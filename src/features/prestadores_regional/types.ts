export interface Prestador {
  id: string;
  codigo: string;
  nome: string;
  regiao: string;
  telefone?: string;
  observacao?: string;
  ativo?: boolean;
  criadoEm?: string;
}

export type ViewMode = 'cards' | 'table' | 'terminal';

export type MainTab = 'prestadores' | 'templates' | 'regras';

export interface RegionGroup {
  regiao: string;
  count: number;
}

export interface TemplateItem {
  id: string;
  categoria: string;
  titulo: string;
  texto: string;
  badge?: string;
  favorito?: boolean;
}

export interface PontoFixoItem {
  id: string;
  numero: number;
  nome: string;
  subtitulo: string;
  endereco: string;
  cep: string;
  referencia: string;
  horarioSemana: string;
  horarioSabado: string;
  horarioFeriados: string;
  mapsQuery?: string;
  wazeQuery?: string;
}

export interface AgendaRegiaoItem {
  id: string;
  regiao: string;
  cidades?: string[];
  diasAtendimento: string; // e.g. "Quarta e Sábado", "Segunda a Sábado", "Segunda e Quinta"
  diasSemanaIds: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  semHorarioFixo: boolean;
  observacoes: string;
  isencaoKm?: {
    dia: string;
    diaSemanaId: number;
    regra: string;
  };
  destaque?: string;
  iconeTipo?: 'praia' | 'cidade' | 'antena' | 'carro' | 'serra';
}

export interface RegraOperacionalItem {
  id: string;
  titulo: string;
  categoria: 'horario' | 'domingos' | 'encaixe' | 'pagamento' | 'pre_agendado';
  subtitulo: string;
  itens: string[];
  alerta?: string;
  textoCopiaAtendente?: string;
  icone: string;
  destaqueCor?: 'blue' | 'amber' | 'emerald' | 'rose' | 'purple';
}
