import { Prestador } from '../prestadores_regional/types';

export type CentralTab =
  | 'overview'
  | 'encaixes'
  | 'ocorrencias'
  | 'agendas'
  | 'clientes'
  | 'chat'
  | 'conexao';

export type WhatsAppGroupKey =
  | 'ENCAIXES MESMO DIA'
  | 'EQUIPE TÉCNICA'
  | 'AGENDAS E MUDANÇAS';

export type WhatsAppConnectionStatus =
  | 'disconnected'
  | 'qr_pending'
  | 'connecting'
  | 'connected'
  | 'error';

export type ContentType = 'text' | 'image' | 'audio' | 'document';

export interface RawWhatsAppMessage {
  id: string;
  whatsappMessageId: string;
  group: WhatsAppGroupKey;
  senderName: string;
  senderPhone: string;
  timestamp: string;
  contentType: ContentType;
  text: string;
  mediaNote?: string;
  mediaStatus?: 'interpreted' | 'unreadable' | 'pending';
  quotedMessageId?: string;
  quotedPreview?: string;
  deduplicatedCount?: number;
  aiModel: 'DeepSeek-V3' | 'Gemini Decision 1' | 'Motor Determinístico';
  confidence: number; // 0-100
}

export type EncaixeStatus =
  | 'recebido'
  | 'aguardando_validacao'
  | 'tecnico_acionado'
  | 'aceito'
  | 'recusado'
  | 'sem_resposta'
  | 'cancelado'
  | 'desconhecido';

export interface EncaixeEvent {
  id: string;
  timestamp: string;
  title: string;
  actor: string;
  previousValue?: string;
  newValue?: string;
  sourceMessageId?: string;
}

export interface EncaixeRecord {
  id: string;
  clientName: string;
  plate: string;
  phone: string;
  address: string;
  city: string;
  neighborhood: string;
  cep: string;
  region: string;
  subRegion: string;
  sector: string;
  nsu: string;
  vehicle: string;
  desiredDate: string;
  notes: string;
  technicianId?: string;
  technicianName?: string;
  status: EncaixeStatus;
  needsReview: boolean;
  reviewReason?: string;
  confidence: number;
  sourceGroup: WhatsAppGroupKey;
  sourceMessageId: string;
  originalText: string;
  aiInterpretation: string;
  requestedAt: string;
  dispatchedAt?: string;
  respondedAt?: string;
  responseMinutes?: number;
  refusalReason?: string;
  duplicatePings: number;
  events: EncaixeEvent[];
}

export type OcorrenciaCategory =
  | 'cliente_nao_atende'
  | 'cliente_ausente'
  | 'endereco_incorreto'
  | 'regiao_incorreta'
  | 'reagendamento'
  | 'cancelamento'
  | 'ajuda_suporte'
  | 'problema_placa_os'
  | 'chegada_local'
  | 'atendimento_concluido'
  | 'tentativa_contato'
  | 'orientacao_equipe'
  | 'retorno_solicitado'
  | 'nao_classificada';

export type OcorrenciaState =
  | 'identificada'
  | 'em_acompanhamento'
  | 'aguardando_cliente'
  | 'aguardando_equipe'
  | 'aguardando_tecnico'
  | 'resolvida'
  | 'sem_desfecho'
  | 'necessita_revisao';

export interface OcorrenciaRecord {
  id: string;
  category: OcorrenciaCategory;
  state: OcorrenciaState;
  technicianId?: string;
  technicianName?: string;
  clientName: string;
  plate: string;
  nsu: string;
  summary: string;
  timestamp: string;
  lastMessageAt: string;
  silenceHours: number;
  sourceGroup: WhatsAppGroupKey;
  sourceMessageId: string;
  authorName: string;
  originalText: string;
  aiInterpretation: string;
  confidence: number;
  needsReview: boolean;
  hasCompletionEvidence: boolean;
}

export type AgendaStatusType =
  | 'normal'
  | 'fechada'
  | 'sem_servico'
  | 'reduzida'
  | 'mudanca';

export interface AgendaVersion {
  version: number;
  timestamp: string;
  author: string;
  summary: string;
}

export interface DailyAgendaEntry {
  id: string;
  date: string; // YYYY-MM-DD
  technicianId: string;
  technicianName: string;
  technicianCode: string;
  status: AgendaStatusType;
  habitualCoverage: string;
  dailyCoverage: string;
  reducedCapacityNote?: string;
  rawText: string;
  aiInterpretation: string;
  confidence: number;
  needsReview: boolean;
  version: number;
  updatedAt: string;
  history: AgendaVersion[];
}

export type GeoSector = 'Alta' | 'Meio' | 'Baixa' | 'Direita' | 'Esquerda';

export interface GeoHierarchyItem {
  id: string;
  macroRegion: string;
  subRegion: string;
  sectors: GeoSector[];
  cepPrefixes: string[];
  neighborhoods: string[];
  cities: string[];
}

export interface ClienteTimelineEvent {
  id: string;
  timestamp: string;
  sourceGroup: WhatsAppGroupKey;
  sourceMessageId: string;
  author: string;
  eventTitle: string;
  originalText: string;
  aiInterpretation: string;
  consolidatedState: string;
  confidence: number;
}

export interface ClienteChamadoRecord {
  id: string;
  clientName: string;
  plate: string;
  phone: string;
  nsu: string;
  vehicle: string;
  address: string;
  regionLabel: string;
  matchConfidence: number;
  ambiguousMatchWarning?: string;
  currentStatus: string;
  events: ClienteTimelineEvent[];
}

export interface ChatEvidence {
  group: WhatsAppGroupKey;
  author: string;
  timestamp: string;
  messageId: string;
  text: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  facts?: string[];
  interpretations?: string[];
  uncertainties?: string[];
  evidences?: ChatEvidence[];
}

export interface AiUsageEntry {
  id: string;
  model: 'DeepSeek-V3' | 'Gemini Decision 1' | 'Motor Determinístico';
  task: string;
  messagesCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedUsd: number;
}

export interface CentralOperationalConfig {
  noResponseSlaMinutes: number;
  reducedAgendaRule: string;
  retentionDays: number;
  activeModels: {
    deepseekEnabled: boolean;
    geminiDecisionEnabled: boolean;
  };
}

export interface TechnicianComputedMetrics {
  prestador: Prestador;
  totalReceived: number;
  finalizedCount: number;
  pendingCount: number;
  acceptedCount: number;
  refusedCount: number;
  noResponseCount: number;
  acceptanceRate: number | null;
  refusalRate: number | null;
  responseRate: number | null;
  absenceRate: number | null;
  avgResponseMinutes: number | null;
  estimatedAcceptProbability: number | null;
  sampleSize: number;
  probabilityBasis: string;
  sufficientSample: boolean;
  byRegion: Array<{ region: string; total: number; accepted: number }>;
  byPeriod: Array<{ period: 'Manhã' | 'Tarde'; total: number; accepted: number }>;
}
