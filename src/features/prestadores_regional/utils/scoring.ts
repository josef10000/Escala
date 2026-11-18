import {
  AgendaRegiaoItem,
  Prestador,
  TechnicianGrade,
  TechnicianQualitativeCriteria,
  TechnicianQualitativeEvaluation,
  TechnicianScoreBreakdown,
} from '../types';
import {
  OcorrenciaRecord,
  TechnicianComputedMetrics,
} from '../../central_inteligencia/types';
import { normalizeText } from './search';
import { pushCloudFields } from '../../../lib/cloudSync';

const EVALUATIONS_STORAGE_KEY = 'prestadores_avaliacoes_v1';

export function findRegionalAgendaForPrestador(
  regiao: string,
  agendas: AgendaRegiaoItem[]
): AgendaRegiaoItem | undefined {
  const normReg = normalizeText(regiao);
  if (!normReg || agendas.length === 0) return undefined;

  // 1. Exact or prefix match on regiao name (ignoring trailing numbers like LESTE 1 / CAMPINAS 1)
  const baseReg = normReg.replace(/\s*\d+$/, '').trim();

  return (
    agendas.find((ag) => {
      const agNorm = normalizeText(ag.regiao);
      if (agNorm === normReg || (baseReg.length >= 3 && agNorm.includes(baseReg))) {
        return true;
      }
      if (ag.cidades && ag.cidades.length > 0) {
        return ag.cidades.some((c) => {
          const cNorm = normalizeText(c);
          return cNorm === normReg || (baseReg.length >= 4 && cNorm.includes(baseReg));
        });
      }
      return false;
    }) ?? undefined
  );
}

export const QUALITATIVE_CRITERIA_META: Array<{
  key: keyof TechnicianQualitativeCriteria;
  label: string;
  hint: string;
}> = [
  {
    key: 'pontualidade',
    label: 'Pontualidade & Rota',
    hint: 'Cumprimento das janelas e combinados',
  },
  {
    key: 'postura',
    label: 'Postura com Cliente',
    hint: 'Cordialidade e ausência de atritos',
  },
  {
    key: 'comunicacao',
    label: 'Comunicação WhatsApp',
    hint: 'Clareza nas respostas e fotos legíveis',
  },
  {
    key: 'qualidadeTecnica',
    label: 'Qualidade Técnica',
    hint: 'Execução sem retrabalho ou erro de OS',
  },
];

// Perfis iniciais sutis baseados em nomes/códigos conhecidos para enriquecer a demonstração
const SEEDED_EVALUATIONS: Array<{
  matchName: string;
  eval: Omit<TechnicianQualitativeEvaluation, 'prestadorId'>;
}> = [
  {
    matchName: 'RAFAEL',
    eval: {
      pontualidade: 5,
      postura: 5,
      comunicacao: 5,
      qualidadeTecnica: 5,
      notaGestor: 'Referência na Zona Leste; absorve encaixes urgentes com retorno ágil.',
      isCustom: false,
    },
  },
  {
    matchName: 'CARLOS ANDRÉ',
    eval: {
      pontualidade: 4,
      postura: 5,
      comunicacao: 3,
      qualidadeTecnica: 4,
      notaGestor: 'Bom atendimento presencial; orientar sobre nitidez de fotos de OS no grupo.',
      isCustom: false,
    },
  },
  {
    matchName: 'FELIPE',
    eval: {
      pontualidade: 4,
      postura: 4,
      comunicacao: 4,
      qualidadeTecnica: 5,
      notaGestor: 'Forte cobertura multi-região (Sul / ABC / Centro).',
      isCustom: false,
    },
  },
  {
    matchName: 'MAURO',
    eval: {
      pontualidade: 3,
      postura: 4,
      comunicacao: 2,
      qualidadeTecnica: 4,
      notaGestor: 'Precisa melhorar tempo de confirmação no grupo de encaixes.',
      isCustom: false,
    },
  },
  {
    matchName: 'BRUNO',
    eval: {
      pontualidade: 4,
      postura: 4,
      comunicacao: 4,
      qualidadeTecnica: 4,
      isCustom: false,
    },
  },
];

export function getStoredEvaluations(): Record<string, TechnicianQualitativeEvaluation> {
  try {
    const raw = localStorage.getItem(EVALUATIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getEvaluationForPrestador(
  prestador: Prestador,
  storedMap?: Record<string, TechnicianQualitativeEvaluation>
): TechnicianQualitativeEvaluation {
  const map = storedMap ?? getStoredEvaluations();
  if (map[prestador.id]) {
    return map[prestador.id];
  }

  const upperName = prestador.nome.toUpperCase();
  const seeded = SEEDED_EVALUATIONS.find((s) => upperName.includes(s.matchName));
  if (seeded) {
    return {
      prestadorId: prestador.id,
      ...seeded.eval,
    };
  }

  return {
    prestadorId: prestador.id,
    pontualidade: 4,
    postura: 4,
    comunicacao: 4,
    qualidadeTecnica: 4,
    isCustom: false,
  };
}

export function saveTechnicianEvaluation(
  evaluation: TechnicianQualitativeEvaluation
): Record<string, TechnicianQualitativeEvaluation> {
  const current = getStoredEvaluations();
  const next: Record<string, TechnicianQualitativeEvaluation> = {
    ...current,
    [evaluation.prestadorId]: {
      ...evaluation,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    },
  };
  try {
    localStorage.setItem(EVALUATIONS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('prestadores-evaluations-updated'));
    void pushCloudFields({ technicianEvaluations: next });
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function scoreToGrade(score: number): {
  grade: TechnicianGrade;
  label: string;
} {
  if (score >= 88) return { grade: 'A', label: 'Excelência' };
  if (score >= 74) return { grade: 'B', label: 'Confiável' };
  if (score >= 58) return { grade: 'C', label: 'Regular' };
  if (score >= 42) return { grade: 'D', label: 'Atenção' };
  return { grade: 'E', label: 'Crítico' };
}

export function getGradeVisualTokens(grade: TechnicianGrade): {
  crest: string;
  ring: string;
  text: string;
  bar: string;
  backGlow: string;
  borderAccent: string;
} {
  switch (grade) {
    case 'A':
      return {
        crest:
          'from-emerald-400/25 via-cyan-400/20 to-teal-500/25 text-emerald-200 border-emerald-400/45 shadow-[0_0_20px_rgba(16,185,129,0.28)]',
        ring: 'border-emerald-400/50 text-emerald-300',
        text: 'text-emerald-300',
        bar: 'bg-gradient-to-r from-emerald-400 to-cyan-400',
        backGlow: 'from-emerald-500/[0.14] via-cyan-500/[0.06]',
        borderAccent: 'hover:border-emerald-400/40',
      };
    case 'B':
      return {
        crest:
          'from-sky-400/25 via-cyan-500/15 to-blue-500/20 text-sky-200 border-sky-400/45 shadow-[0_0_18px_rgba(56,189,248,0.24)]',
        ring: 'border-sky-400/45 text-sky-300',
        text: 'text-sky-300',
        bar: 'bg-gradient-to-r from-sky-400 to-cyan-300',
        backGlow: 'from-sky-500/[0.14] via-blue-500/[0.05]',
        borderAccent: 'hover:border-sky-400/40',
      };
    case 'C':
      return {
        crest:
          'from-amber-400/25 via-yellow-500/15 to-amber-600/20 text-amber-200 border-amber-400/45 shadow-[0_0_16px_rgba(245,158,11,0.22)]',
        ring: 'border-amber-400/45 text-amber-300',
        text: 'text-amber-300',
        bar: 'bg-gradient-to-r from-amber-400 to-yellow-300',
        backGlow: 'from-amber-500/[0.12] via-yellow-500/[0.04]',
        borderAccent: 'hover:border-amber-400/40',
      };
    case 'D':
      return {
        crest:
          'from-orange-500/25 via-amber-600/15 to-rose-500/20 text-orange-200 border-orange-400/45 shadow-[0_0_16px_rgba(249,115,22,0.22)]',
        ring: 'border-orange-400/45 text-orange-300',
        text: 'text-orange-300',
        bar: 'bg-gradient-to-r from-orange-500 to-amber-400',
        backGlow: 'from-orange-500/[0.14] via-rose-500/[0.05]',
        borderAccent: 'hover:border-orange-400/40',
      };
    case 'E':
      return {
        crest:
          'from-rose-500/30 via-red-500/20 to-rose-700/25 text-rose-200 border-rose-400/50 shadow-[0_0_18px_rgba(244,63,94,0.28)]',
        ring: 'border-rose-400/50 text-rose-300',
        text: 'text-rose-300',
        bar: 'bg-gradient-to-r from-rose-500 to-red-400',
        backGlow: 'from-rose-500/[0.16] via-red-500/[0.06]',
        borderAccent: 'hover:border-rose-400/45',
      };
  }
}

export function computeTechnicianScore(
  prestador: Prestador,
  metrics: TechnicianComputedMetrics,
  ocorrencias: OcorrenciaRecord[] = [],
  evaluationInput?: TechnicianQualitativeEvaluation
): TechnicianScoreBreakdown {
  const evaluation = evaluationInput ?? getEvaluationForPrestador(prestador);

  // 1. Bloco Qualitativo (Gestor) -> 0..100
  const criteriaScores = [
    evaluation.pontualidade,
    evaluation.postura,
    evaluation.comunicacao,
    evaluation.qualidadeTecnica,
  ];
  const avgQual =
    criteriaScores.reduce((acc, v) => acc + Math.max(1, Math.min(5, v)), 0) /
    criteriaScores.length;
  const qualitativeScore = Math.round((avgQual / 5) * 100);

  // 2. Bloco Operacional (Métricas de Encaixe + Ocorrências de Campo) -> 0..60 pts -> norm 0..100
  const techOcorrencias = ocorrencias.filter(
    (o) =>
      o.technicianId === prestador.id ||
      (o.technicianName || '').trim().toUpperCase() === prestador.nome.trim().toUpperCase()
  );
  const unresolvedAlertCount = techOcorrencias.filter(
    (o) => o.state === 'sem_desfecho' || o.state === 'necessita_revisao' || o.needsReview
  ).length;
  const fieldReliabilityPts = Math.max(0, 10 - unresolvedAlertCount * 3);

  const acceptPts =
    metrics.acceptanceRate !== null ? Math.round((metrics.acceptanceRate / 100) * 25) : 16;
  const responsePts =
    metrics.responseRate !== null ? Math.round((metrics.responseRate / 100) * 15) : 10;
  const speedPts =
    metrics.avgResponseMinutes === null
      ? 6
      : metrics.avgResponseMinutes <= 10
      ? 10
      : metrics.avgResponseMinutes <= 20
      ? 8
      : metrics.avgResponseMinutes <= 35
      ? 6
      : 3;

  const operationalRaw60 = acceptPts + responsePts + speedPts + fieldReliabilityPts;
  const operationalScore = Math.round((operationalRaw60 / 60) * 100);

  // Ponderação adaptativa conforme tamanho de amostra operacional
  const isProvisionalSample = metrics.finalizedCount < 2;
  let operationalWeight = 60;
  let qualitativeWeight = 40;

  if (metrics.finalizedCount === 0) {
    operationalWeight = 0;
    qualitativeWeight = 100;
  } else if (metrics.finalizedCount === 1) {
    operationalWeight = 35;
    qualitativeWeight = 65;
  }

  const totalScore = Math.round(
    (operationalScore * operationalWeight + qualitativeScore * qualitativeWeight) / 100
  );

  const { grade, label: gradeLabel } = scoreToGrade(totalScore);

  const operationalItems: TechnicianScoreBreakdown['operationalItems'] = [
    {
      label: 'Taxa de Aceite',
      valueText: metrics.acceptanceRate !== null ? `${metrics.acceptanceRate}%` : 'Sem base',
      points: acceptPts,
      maxPoints: 25,
    },
    {
      label: 'Taxa de Resposta',
      valueText: metrics.responseRate !== null ? `${metrics.responseRate}%` : 'Sem base',
      points: responsePts,
      maxPoints: 15,
    },
    {
      label: 'Agilidade Média',
      valueText: metrics.avgResponseMinutes !== null ? `${metrics.avgResponseMinutes} min` : '—',
      points: speedPts,
      maxPoints: 10,
    },
    {
      label: 'Confiabilidade Campo',
      valueText:
        unresolvedAlertCount === 0
          ? 'Sem pendências'
          : `${unresolvedAlertCount} alerta(s)`,
      points: fieldReliabilityPts,
      maxPoints: 10,
    },
  ];

  const qualitativeItems: TechnicianScoreBreakdown['qualitativeItems'] =
    QUALITATIVE_CRITERIA_META.map((meta) => ({
      key: meta.key,
      label: meta.label,
      hint: meta.hint,
      score: Math.max(1, Math.min(5, evaluation[meta.key])),
    }));

  return {
    grade,
    totalScore,
    operationalScore,
    qualitativeScore,
    operationalWeight,
    qualitativeWeight,
    isProvisionalSample,
    gradeLabel,
    operationalItems,
    qualitativeItems,
    evaluation,
  };
}
