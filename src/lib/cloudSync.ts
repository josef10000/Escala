import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type {
  AgendaRegiaoItem,
  PontoFixoItem,
  Prestador,
  RegraOperacionalItem,
  TechnicianQualitativeEvaluation,
  TemplateItem,
} from '../features/prestadores_regional/types';
import type {
  CentralOperationalConfig,
  DailyAgendaEntry,
  EncaixeRecord,
  OcorrenciaRecord,
} from '../features/central_inteligencia/types';

export const CLOUD_LOCAL_KEYS = {
  PRESTADORES: 'prestadores_dados_v1',
  FAVORITES: 'prestadores_favoritos_v1',
  TEMPLATES: 'atendimento_templates_v1',
  PONTOS_FIXOS: 'drmonitora_pontos_fixos_v1',
  AGENDAS: 'drmonitora_agendas_v1',
  REGRAS: 'drmonitora_regras_v1',
  EVALUATIONS: 'prestadores_avaliacoes_v1',
  CENTRAL_ENCAIXES: 'ominihub_central_encaixes_v1',
  CENTRAL_AGENDAS: 'ominihub_central_agendas_v1',
  CENTRAL_OCORRENCIAS: 'ominihub_central_ocorrencias_v1',
  CENTRAL_CONFIG: 'ominihub_central_config_v1',
} as const;

export interface CloudOperationalFields {
  regionalPrestadores?: Prestador[];
  regionalFavorites?: string[];
  regionalTemplates?: TemplateItem[];
  regionalPontosFixos?: PontoFixoItem[];
  regionalAgendas?: AgendaRegiaoItem[];
  regionalRegras?: RegraOperacionalItem[];
  technicianEvaluations?: Record<string, TechnicianQualitativeEvaluation>;
  centralEncaixes?: EncaixeRecord[];
  centralDailyAgendas?: DailyAgendaEntry[];
  centralOcorrencias?: OcorrenciaRecord[];
  centralConfig?: CentralOperationalConfig;
}

/**
 * Strips undefined values recursively so Firestore never rejects nested optional fields.
 */
export function sanitizeForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Merges operational module fields into `schedule_store/main` in Firestore.
 * Gracefully falls back to localStorage when offline or unauthenticated.
 */
export async function pushCloudFields(fields: CloudOperationalFields): Promise<boolean> {
  try {
    const scheduleDocRef = doc(db, 'schedule_store', 'main');
    const activeLeader =
      sessionStorage.getItem('escalapro_leader_name_oct2026_v1') ||
      localStorage.getItem('escalapro_leader_name_oct2026_v1') ||
      'Operação';

    const payload = sanitizeForFirestore({
      ...fields,
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: activeLeader,
    });

    await setDoc(scheduleDocRef, payload, { merge: true });
    return true;
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (
      msg.includes('permission-denied') ||
      msg.includes('Missing or insufficient permissions') ||
      msg.includes('resource-exhausted') ||
      msg.includes('Quota') ||
      msg.includes('quota') ||
      msg.includes('offline')
    ) {
      console.warn('Cloud sync skipped (offline or unauthenticated session); saved locally.');
      return false;
    }
    console.warn('Cloud sync warning:', err);
    return false;
  }
}

function updateLocalIfChanged(storageKey: string, incomingValue: unknown): boolean {
  if (incomingValue === undefined || incomingValue === null) return false;
  try {
    const serialized = JSON.stringify(incomingValue);
    const existing = localStorage.getItem(storageKey);
    if (existing === serialized) return false;
    localStorage.setItem(storageKey, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Applies incoming `schedule_store/main` snapshot fields to localStorage and notifies mounted modules
 * without causing echo write loops.
 */
export function applyIncomingCloudSnapshot(data: Record<string, any>): void {
  let regionalChanged = false;
  let evaluationsChanged = false;
  let centralChanged = false;

  if (Array.isArray(data.regionalPrestadores)) {
    regionalChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.PRESTADORES, data.regionalPrestadores) ||
      regionalChanged;
  }
  if (Array.isArray(data.regionalFavorites)) {
    regionalChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.FAVORITES, data.regionalFavorites) ||
      regionalChanged;
  }
  if (Array.isArray(data.regionalTemplates)) {
    regionalChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.TEMPLATES, data.regionalTemplates) ||
      regionalChanged;
  }
  if (Array.isArray(data.regionalPontosFixos)) {
    regionalChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.PONTOS_FIXOS, data.regionalPontosFixos) ||
      regionalChanged;
  }
  if (Array.isArray(data.regionalAgendas)) {
    regionalChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.AGENDAS, data.regionalAgendas) ||
      regionalChanged;
  }
  if (Array.isArray(data.regionalRegras)) {
    regionalChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.REGRAS, data.regionalRegras) ||
      regionalChanged;
  }

  if (data.technicianEvaluations && typeof data.technicianEvaluations === 'object') {
    evaluationsChanged = updateLocalIfChanged(
      CLOUD_LOCAL_KEYS.EVALUATIONS,
      data.technicianEvaluations
    );
  }

  if (Array.isArray(data.centralEncaixes)) {
    centralChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.CENTRAL_ENCAIXES, data.centralEncaixes) ||
      centralChanged;
  }
  if (Array.isArray(data.centralDailyAgendas)) {
    centralChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.CENTRAL_AGENDAS, data.centralDailyAgendas) ||
      centralChanged;
  }
  if (Array.isArray(data.centralOcorrencias)) {
    centralChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.CENTRAL_OCORRENCIAS, data.centralOcorrencias) ||
      centralChanged;
  }
  if (data.centralConfig && typeof data.centralConfig === 'object') {
    centralChanged =
      updateLocalIfChanged(CLOUD_LOCAL_KEYS.CENTRAL_CONFIG, data.centralConfig) ||
      centralChanged;
  }

  if (regionalChanged && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
  }
  if (evaluationsChanged && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('prestadores-evaluations-updated'));
  }
  if (centralChanged && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('central-metrics-updated'));
  }
}

let hasAttemptedInitialOperationalSeed = false;

/**
 * Seeds operational fields into `schedule_store/main` once if the document exists
 * from an earlier version without regional/evaluation/central fields.
 */
export function seedMissingCloudOperationalFields(existingDocData: Record<string, any>): void {
  if (hasAttemptedInitialOperationalSeed) return;
  hasAttemptedInitialOperationalSeed = true;

  const toSeed: CloudOperationalFields = {};

  const readJson = <T>(key: string): T | undefined => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      return undefined;
    }
  };

  if (existingDocData.regionalPrestadores === undefined) {
    const val = readJson<Prestador[]>(CLOUD_LOCAL_KEYS.PRESTADORES);
    if (val && val.length > 0) toSeed.regionalPrestadores = val;
  }
  if (existingDocData.regionalPontosFixos === undefined) {
    const val = readJson<PontoFixoItem[]>(CLOUD_LOCAL_KEYS.PONTOS_FIXOS);
    if (val && val.length > 0) toSeed.regionalPontosFixos = val;
  }
  if (existingDocData.regionalAgendas === undefined) {
    const val = readJson<AgendaRegiaoItem[]>(CLOUD_LOCAL_KEYS.AGENDAS);
    if (val && val.length > 0) toSeed.regionalAgendas = val;
  }
  if (existingDocData.regionalRegras === undefined) {
    const val = readJson<RegraOperacionalItem[]>(CLOUD_LOCAL_KEYS.REGRAS);
    if (val && val.length > 0) toSeed.regionalRegras = val;
  }
  if (existingDocData.technicianEvaluations === undefined) {
    const val = readJson<Record<string, TechnicianQualitativeEvaluation>>(
      CLOUD_LOCAL_KEYS.EVALUATIONS
    );
    if (val && Object.keys(val).length > 0) toSeed.technicianEvaluations = val;
  }
  if (existingDocData.centralEncaixes === undefined) {
    const val = readJson<EncaixeRecord[]>(CLOUD_LOCAL_KEYS.CENTRAL_ENCAIXES);
    if (val && val.length > 0) toSeed.centralEncaixes = val;
  }
  if (existingDocData.centralDailyAgendas === undefined) {
    const val = readJson<DailyAgendaEntry[]>(CLOUD_LOCAL_KEYS.CENTRAL_AGENDAS);
    if (val && val.length > 0) toSeed.centralDailyAgendas = val;
  }

  if (Object.keys(toSeed).length > 0) {
    void pushCloudFields(toSeed);
  }
}
