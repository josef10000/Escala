import { Prestador } from '../../prestadores_regional/types';
import {
  AiUsageEntry,
  CentralOperationalConfig,
  ClienteChamadoRecord,
  DailyAgendaEntry,
  EncaixeRecord,
  GeoHierarchyItem,
  OcorrenciaRecord,
  RawWhatsAppMessage,
  TechnicianComputedMetrics,
} from '../types';

export const TODAY_ISO = new Date().toISOString().split('T')[0];

export const INITIAL_OPERATIONAL_CONFIG: CentralOperationalConfig = {
  noResponseSlaMinutes: 30,
  reducedAgendaRule: 'Máximo de 3 atendimentos extras ou apenas janela da manhã (sujeito à validação operacional)',
  retentionDays: 180,
  activeModels: {
    deepseekEnabled: true,
    geminiDecisionEnabled: true,
  },
};

export const INITIAL_RAW_MESSAGES: RawWhatsAppMessage[] = [
  {
    id: 'raw-1',
    whatsappMessageId: 'WA-3EB0A891C201',
    group: 'ENCAIXES MESMO DIA',
    senderName: 'Camila (Atendimento)',
    senderPhone: '11 98412-3301',
    timestamp: `${TODAY_ISO}T08:42:00`,
    contentType: 'text',
    text: 'Bom dia! Encaixe Leste 1 Alta (São Miguel Paulista) - Cliente Marcos Vinícius | Placa ABC1D23 | HB20 Prata | Tel 11 99123-4567 | NSU 884120 | Av. Marechal Tito, 1420 CEP 08010-090. @Rafael D. Carvalho consegue encaixar hoje?',
    deduplicatedCount: 1,
    aiModel: 'DeepSeek-V3',
    confidence: 96,
  },
  {
    id: 'raw-2',
    whatsappMessageId: 'WA-3EB0A891C218',
    group: 'ENCAIXES MESMO DIA',
    senderName: 'RAFAEL D. CARVALHO',
    senderPhone: '11 97741-9022',
    timestamp: `${TODAY_ISO}T08:50:00`,
    contentType: 'text',
    text: 'Consigo sim, coloco na rota das 13h30 depois do almoço.',
    quotedMessageId: 'WA-3EB0A891C201',
    quotedPreview: 'Encaixe Leste 1 Alta - Marcos Vinícius | ABC1D23',
    aiModel: 'Gemini Decision 1',
    confidence: 98,
  },
  {
    id: 'raw-3',
    whatsappMessageId: 'WA-3EB0B440D102',
    group: 'EQUIPE TÉCNICA',
    senderName: 'RAFAEL D. CARVALHO',
    senderPhone: '11 97741-9022',
    timestamp: `${TODAY_ISO}T13:48:00`,
    contentType: 'text',
    text: 'Cheguei no local da placa ABC1D23 (Av. Marechal Tito, 1420), mas cliente não atende interfone nem WhatsApp.',
    aiModel: 'DeepSeek-V3',
    confidence: 94,
  },
  {
    id: 'raw-4',
    whatsappMessageId: 'WA-3EB0B440D115',
    group: 'EQUIPE TÉCNICA',
    senderName: 'Juliana (Suporte)',
    senderPhone: '11 98110-4410',
    timestamp: `${TODAY_ISO}T13:55:00`,
    contentType: 'text',
    text: 'Rafael, estamos ligando para o Marcos (NSU 884120) para liberar entrada. Aguarda 10 min por favor.',
    quotedMessageId: 'WA-3EB0B440D102',
    quotedPreview: 'Cheguei no local da placa ABC1D23...',
    aiModel: 'Gemini Decision 1',
    confidence: 95,
  },
  {
    id: 'raw-5',
    whatsappMessageId: 'WA-3EB0C119F009',
    group: 'AGENDAS E MUDANÇAS',
    senderName: 'Coordenação Rotas',
    senderPhone: '11 98800-1122',
    timestamp: `${TODAY_ISO}T07:15:00`,
    contentType: 'text',
    text: 'Agendas hoje:\n- Carlos André: Leste 1/4 altas\n- Felipe: Sul1 alta/abc3 meio/centro baixa\n- Leonardo Miguel: Agenda fechada\n- Bruno Martins: Reduzida (somente manhã)\n- Kennedy: Sem serviço hoje',
    aiModel: 'DeepSeek-V3',
    confidence: 92,
  },
  {
    id: 'raw-6',
    whatsappMessageId: 'WA-3EB0A891C399',
    group: 'ENCAIXES MESMO DIA',
    senderName: 'Camila (Atendimento)',
    senderPhone: '11 98412-3301',
    timestamp: `${TODAY_ISO}T10:12:00`,
    contentType: 'audio',
    text: '[Áudio 0:18] "Pessoal, precisa encaixar um Tracker em Santo André, perto da Av. Portugal, placa FDS9K12, cliente Carla Mendes, ver se o Mauro Thiago ou Leonardo pega hoje."',
    mediaNote: 'Áudio transcrito automaticamente (18s)',
    mediaStatus: 'interpreted',
    aiModel: 'DeepSeek-V3',
    confidence: 81,
  },
  {
    id: 'raw-7',
    whatsappMessageId: 'WA-3EB0B440D220',
    group: 'EQUIPE TÉCNICA',
    senderName: 'CARLOS ANDRÉ',
    senderPhone: '11 97221-8890',
    timestamp: `${TODAY_ISO}T11:05:00`,
    contentType: 'image',
    text: '[Imagem anexada] Foto ilegível da etiqueta do rastreador com solicitação de verificação de OS.',
    mediaNote: 'Imagem com baixa nitidez — requer revisão manual',
    mediaStatus: 'unreadable',
    aiModel: 'Gemini Decision 1',
    confidence: 42,
  },
];

export function buildInitialEncaixes(prestadores: Prestador[]): EncaixeRecord[] {
  const findByName = (q: string) =>
    prestadores.find((p) => p.nome.toLowerCase().includes(q.toLowerCase()));

  const rafael = findByName('RAFAEL D. CARVALHO') || prestadores[0];
  const carlos = findByName('CARLOS ANDRÉ') || prestadores[1];
  const mauro = findByName('MAURO THIAGO') || prestadores[2];
  const brunoM = findByName('BRUNO MARTINS') || prestadores[3];
  const brunoG = findByName('BRUNO P. GOIS') || prestadores[4];
  const alex = findByName('ALEX SANDER') || prestadores[5];
  const rodrigoM = findByName('RODRIGO S. MOREIRA') || prestadores[6];
  const juliano = findByName('JULIANO') || prestadores[7];

  return [
    {
      id: 'enc-101',
      clientName: 'Marcos Vinícius Oliveira',
      plate: 'ABC1D23',
      phone: '11 99123-4567',
      address: 'Av. Marechal Tito, 1420',
      city: 'São Paulo',
      neighborhood: 'São Miguel Paulista',
      cep: '08010-090',
      region: 'Leste',
      subRegion: 'LESTE 1',
      sector: 'Alta',
      nsu: '884120',
      vehicle: 'Hyundai HB20 Prata',
      desiredDate: TODAY_ISO,
      notes: 'Encaixe solicitado para período da tarde',
      technicianId: rafael?.id,
      technicianName: rafael?.nome || 'RAFAEL D. CARVALHO',
      status: 'aceito',
      needsReview: false,
      confidence: 97,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-3EB0A891C201',
      originalText:
        'Bom dia! Encaixe Leste 1 Alta (São Miguel Paulista) - Cliente Marcos Vinícius | Placa ABC1D23 | HB20 Prata | Tel 11 99123-4567 | NSU 884120 | Av. Marechal Tito, 1420 CEP 08010-090. @Rafael D. Carvalho consegue encaixar hoje?',
      aiInterpretation:
        'Solicitação de encaixe mesmo dia na Leste 1 (Alta), cliente Marcos Vinícius, placa ABC1D23. Técnico Rafael acionado às 08:42 e aceite confirmado às 08:50.',
      requestedAt: `${TODAY_ISO}T08:42:00`,
      dispatchedAt: `${TODAY_ISO}T08:42:00`,
      respondedAt: `${TODAY_ISO}T08:50:00`,
      responseMinutes: 8,
      duplicatePings: 1,
      events: [
        {
          id: 'ev-101-1',
          timestamp: `${TODAY_ISO}T08:42:00`,
          title: 'Solicitação identificada no grupo ENCAIXES MESMO DIA',
          actor: 'Camila (Atendimento)',
          sourceMessageId: 'WA-3EB0A891C201',
        },
        {
          id: 'ev-101-2',
          timestamp: `${TODAY_ISO}T08:42:00`,
          title: 'Técnico acionado identificado na conversa',
          actor: 'Sistema (Menção)',
          newValue: rafael?.nome || 'RAFAEL D. CARVALHO',
        },
        {
          id: 'ev-101-3',
          timestamp: `${TODAY_ISO}T08:47:00`,
          title: 'Cobrança/ping repetido ignorado na contagem',
          actor: 'Deduplicador',
        },
        {
          id: 'ev-101-4',
          timestamp: `${TODAY_ISO}T08:50:00`,
          title: 'Aceite confirmado pelo técnico (8 min)',
          actor: rafael?.nome || 'RAFAEL D. CARVALHO',
          previousValue: 'Técnico acionado',
          newValue: 'Aceito (rota 13h30)',
          sourceMessageId: 'WA-3EB0A891C218',
        },
      ],
    },
    {
      id: 'enc-102',
      clientName: 'Carla Mendes Souza',
      plate: 'FDS9K12',
      phone: '11 98221-7710',
      address: 'Av. Portugal, 610',
      city: 'Santo André',
      neighborhood: 'Centro',
      cep: '09040-001',
      region: 'ABC',
      subRegion: 'ABC 3',
      sector: 'Meio',
      nsu: '884299',
      vehicle: 'Chevrolet Tracker Branco',
      desiredDate: TODAY_ISO,
      notes: 'Áudio transcrito — mencionou dois técnicos possíveis',
      technicianId: mauro?.id,
      technicianName: mauro?.nome || 'MAURO THIAGO',
      status: 'tecnico_acionado',
      needsReview: true,
      reviewReason: 'Áudio citou dois técnicos (Mauro Thiago e Leonardo). Confirmar acionado principal.',
      confidence: 81,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-3EB0A891C399',
      originalText:
        '[Áudio 0:18] "Pessoal, precisa encaixar um Tracker em Santo André, perto da Av. Portugal, placa FDS9K12, cliente Carla Mendes, ver se o Mauro Thiago ou Leonardo pega hoje."',
      aiInterpretation:
        'Solicitação em ABC 3 (Santo André) para Carla Mendes (FDS9K12). Aguardando retorno dentro da janela SLA de 30 min.',
      requestedAt: `${TODAY_ISO}T10:12:00`,
      dispatchedAt: `${TODAY_ISO}T10:12:00`,
      duplicatePings: 0,
      events: [
        {
          id: 'ev-102-1',
          timestamp: `${TODAY_ISO}T10:12:00`,
          title: 'Áudio transcrito e encaixe registrado',
          actor: 'Camila (Atendimento)',
          sourceMessageId: 'WA-3EB0A891C399',
        },
        {
          id: 'ev-102-2',
          timestamp: `${TODAY_ISO}T10:12:00`,
          title: 'Sinalizado para revisão humana (múltiplos técnicos citados)',
          actor: 'Motor de Confiança',
        },
      ],
    },
    {
      id: 'enc-103',
      clientName: 'Transportadora Rápida Ltda',
      plate: 'QWE4R55',
      phone: '11 97400-1988',
      address: 'Av. Sapopemba, 8920',
      city: 'São Paulo',
      neighborhood: 'São Mateus',
      cep: '03988-000',
      region: 'Leste',
      subRegion: 'LESTE 4',
      sector: 'Alta',
      nsu: '884005',
      vehicle: 'Fiat Fiorino Branca',
      desiredDate: TODAY_ISO,
      notes: 'Urgente empresa',
      technicianId: carlos?.id,
      technicianName: carlos?.nome || 'CARLOS ANDRÉ',
      status: 'recusado',
      needsReview: false,
      confidence: 95,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-3EB0A891C104',
      originalText:
        'Alguém consegue encaixar Fiorino QWE4R55 na Av. Sapopemba, 8920? NSU 884005. @Carlos André',
      aiInterpretation:
        'Técnico Carlos André recusou por rota lotada no setor Leste 4 Alta após 14 minutos.',
      requestedAt: `${TODAY_ISO}T08:05:00`,
      dispatchedAt: `${TODAY_ISO}T08:05:00`,
      respondedAt: `${TODAY_ISO}T08:19:00`,
      responseMinutes: 14,
      refusalReason: 'Rota cheia até 17h',
      duplicatePings: 0,
      events: [
        {
          id: 'ev-103-1',
          timestamp: `${TODAY_ISO}T08:05:00`,
          title: 'Solicitação identificada',
          actor: 'Lucas (Atendimento)',
        },
        {
          id: 'ev-103-2',
          timestamp: `${TODAY_ISO}T08:19:00`,
          title: 'Recusado pelo técnico (Rota cheia até 17h)',
          actor: carlos?.nome || 'CARLOS ANDRÉ',
        },
      ],
    },
    {
      id: 'enc-104',
      clientName: 'Roberto Almeida Silva',
      plate: 'GTR8H90',
      phone: '11 96654-1020',
      address: 'Rua Coriolano, 512',
      city: 'São Paulo',
      neighborhood: 'Lapa',
      cep: '05047-000',
      region: 'Oeste',
      subRegion: 'OESTE 1',
      sector: 'Baixa',
      nsu: '883990',
      vehicle: 'Volkswagen Polo Cinza',
      desiredDate: TODAY_ISO,
      notes: 'Prazo de 30 min expirado sem resposta no grupo',
      technicianId: brunoM?.id,
      technicianName: brunoM?.nome || 'BRUNO MARTINS',
      status: 'sem_resposta',
      needsReview: false,
      confidence: 93,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-3EB0A891C088',
      originalText:
        'Encaixe Oeste 1 Lapa: Roberto Almeida, Polo GTR8H90, Rua Coriolano 512 (CEP 05047-000), NSU 883990. @Bruno Martins consegue?',
      aiInterpretation:
        'Solicitação direcionada a Bruno Martins às 07:50. Nenhuma resposta registrada após prazo configurado de 30 minutos.',
      requestedAt: `${TODAY_ISO}T07:50:00`,
      dispatchedAt: `${TODAY_ISO}T07:50:00`,
      duplicatePings: 2,
      events: [
        {
          id: 'ev-104-1',
          timestamp: `${TODAY_ISO}T07:50:00`,
          title: 'Solicitação registrada e técnico mencionado',
          actor: 'Camila (Atendimento)',
        },
        {
          id: 'ev-104-2',
          timestamp: `${TODAY_ISO}T08:20:00`,
          title: 'Classificado automaticamente como Sem Resposta (SLA 30 min vencido)',
          actor: 'Motor Determinístico (SLA)',
        },
      ],
    },
    {
      id: 'enc-105',
      clientName: 'Fernanda Costa Lima',
      plate: 'JKL2M34',
      phone: '11 99871-4090',
      address: 'Av. Eng. Armando de Arruda Pereira, 2300',
      city: 'São Paulo',
      neighborhood: 'Jabaquara',
      cep: '04308-001',
      region: 'Sul',
      subRegion: 'SUL 1',
      sector: 'Alta',
      nsu: '884310',
      vehicle: 'Jeep Compass Preto',
      desiredDate: TODAY_ISO,
      notes: 'Mudança de técnico no histórico registrada',
      technicianId: brunoG?.id,
      technicianName: brunoG?.nome || 'BRUNO P. GOIS',
      status: 'aceito',
      needsReview: false,
      confidence: 96,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-3EB0A891C412',
      originalText:
        'Encaixe Sul 1 Jabaquara | Fernanda Costa | JKL2M34 | Compass Preto | NSU 884310. Bruno Gois assume no lugar do Felipe.',
      aiInterpretation:
        'Transferido para Bruno P. Gois na Sul 1 Alta; aceite confirmado em 6 minutos.',
      requestedAt: `${TODAY_ISO}T09:15:00`,
      dispatchedAt: `${TODAY_ISO}T09:15:00`,
      respondedAt: `${TODAY_ISO}T09:21:00`,
      responseMinutes: 6,
      duplicatePings: 0,
      events: [
        {
          id: 'ev-105-1',
          timestamp: `${TODAY_ISO}T09:15:00`,
          title: 'Mudança de técnico acionado registrada',
          actor: 'Juliana (Suporte)',
          previousValue: 'FELIPE',
          newValue: brunoG?.nome || 'BRUNO P. GOIS',
        },
        {
          id: 'ev-105-2',
          timestamp: `${TODAY_ISO}T09:21:00`,
          title: 'Aceite confirmado pelo técnico (6 min)',
          actor: brunoG?.nome || 'BRUNO P. GOIS',
        },
      ],
    },
    {
      id: 'enc-106',
      clientName: 'Sem nome informado',
      plate: 'PQR9S11',
      phone: '11 95510-0092',
      address: 'Rua das Palmeiras (número não informado)',
      city: 'São Paulo',
      neighborhood: 'Santana',
      cep: '',
      region: 'Não identificada',
      subRegion: 'NORTE 1',
      sector: 'Requer revisão',
      nsu: '',
      vehicle: 'Fiat Strada',
      desiredDate: TODAY_ISO,
      notes: 'Falta CEP, número e NSU — endereço incompleto',
      technicianId: alex?.id,
      technicianName: alex?.nome || 'ALEX SANDER',
      status: 'aguardando_validacao',
      needsReview: true,
      reviewReason: 'Endereço sem número/CEP e setor não determinado automaticamente.',
      confidence: 68,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-3EB0A891C455',
      originalText:
        'Tem uma Strada PQR9S11 na Rua das Palmeiras em Santana pra encaixar hoje, tel 11 95510-0092, vê se o Alex Sander tá por perto.',
      aiInterpretation:
        'Registro criado sem bloquear por campos ausentes. Marcado para validação geográfica e identificação de NSU.',
      requestedAt: `${TODAY_ISO}T10:30:00`,
      duplicatePings: 0,
      events: [
        {
          id: 'ev-106-1',
          timestamp: `${TODAY_ISO}T10:30:00`,
          title: 'Recebido com campos parciais — encaminhado para validação',
          actor: 'Lucas (Atendimento)',
        },
      ],
    },
    // Histórico recente (últimos dias) para dar massa estatística realista aos técnicos
    {
      id: 'enc-090',
      clientName: 'Logística Paulista',
      plate: 'LMN4T88',
      phone: '11 97123-0001',
      address: 'Av. Aricanduva, 5500',
      city: 'São Paulo',
      neighborhood: 'Aricanduva',
      cep: '03527-900',
      region: 'Leste',
      subRegion: 'LESTE 3',
      sector: 'Meio',
      nsu: '883102',
      vehicle: 'Renault Master',
      desiredDate: '2026-11-15',
      notes: '',
      technicianId: rodrigoM?.id,
      technicianName: rodrigoM?.nome || 'RODRIGO S. MOREIRA',
      status: 'aceito',
      needsReview: false,
      confidence: 97,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-HIST-090',
      originalText: 'Encaixe Leste 3 Aricanduva Master LMN4T88 @Rodrigo Moreira',
      aiInterpretation: 'Aceito em 11 min.',
      requestedAt: '2026-11-15T09:10:00',
      dispatchedAt: '2026-11-15T09:10:00',
      respondedAt: '2026-11-15T09:21:00',
      responseMinutes: 11,
      duplicatePings: 0,
      events: [],
    },
    {
      id: 'enc-091',
      clientName: 'Pedro Henrique',
      plate: 'KJH5V22',
      phone: '11 98899-1122',
      address: 'Av. Guarulhos, 2100',
      city: 'Guarulhos',
      neighborhood: 'Vila Augusta',
      cep: '07030-000',
      region: 'Norte',
      subRegion: 'NORTE 2',
      sector: 'Alta',
      nsu: '883220',
      vehicle: 'Toyota Corolla',
      desiredDate: '2026-11-15',
      notes: '',
      technicianId: juliano?.id,
      technicianName: juliano?.nome || 'JULIANO',
      status: 'aceito',
      needsReview: false,
      confidence: 95,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-HIST-091',
      originalText: 'Encaixe Guarulhos Vila Augusta Corolla KJH5V22 @Juliano',
      aiInterpretation: 'Aceito em 5 min.',
      requestedAt: '2026-11-15T14:00:00',
      dispatchedAt: '2026-11-15T14:00:00',
      respondedAt: '2026-11-15T14:05:00',
      responseMinutes: 5,
      duplicatePings: 0,
      events: [],
    },
    {
      id: 'enc-092',
      clientName: 'Sérgio Teixeira',
      plate: 'BVN3X11',
      phone: '11 99100-3344',
      address: 'Rua Serra de Bragança, 900',
      city: 'São Paulo',
      neighborhood: 'Tatuapé',
      cep: '03318-000',
      region: 'Leste',
      subRegion: 'LESTE 1',
      sector: 'Baixa',
      nsu: '883400',
      vehicle: 'VW T-Cross',
      desiredDate: '2026-11-14',
      notes: '',
      technicianId: rafael?.id,
      technicianName: rafael?.nome || 'RAFAEL D. CARVALHO',
      status: 'aceito',
      needsReview: false,
      confidence: 98,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-HIST-092',
      originalText: 'Encaixe Leste 1 Tatuapé BVN3X11 @Rafael D. Carvalho',
      aiInterpretation: 'Aceito em 7 min.',
      requestedAt: '2026-11-14T10:00:00',
      dispatchedAt: '2026-11-14T10:00:00',
      respondedAt: '2026-11-14T10:07:00',
      responseMinutes: 7,
      duplicatePings: 0,
      events: [],
    },
    {
      id: 'enc-093',
      clientName: 'Auto Escola União',
      plate: 'ZXY1W09',
      phone: '11 99222-8877',
      address: 'Av. Mateo Bei, 1800',
      city: 'São Paulo',
      neighborhood: 'São Mateus',
      cep: '03949-010',
      region: 'Leste',
      subRegion: 'LESTE 4',
      sector: 'Meio',
      nsu: '883412',
      vehicle: 'Fiat Mobi',
      desiredDate: '2026-11-14',
      notes: '',
      technicianId: carlos?.id,
      technicianName: carlos?.nome || 'CARLOS ANDRÉ',
      status: 'aceito',
      needsReview: false,
      confidence: 96,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-HIST-093',
      originalText: 'Encaixe Leste 4 Mateo Bei Mobi ZXY1W09 @Carlos André',
      aiInterpretation: 'Aceito em 9 min.',
      requestedAt: '2026-11-14T11:20:00',
      dispatchedAt: '2026-11-14T11:20:00',
      respondedAt: '2026-11-14T11:29:00',
      responseMinutes: 9,
      duplicatePings: 0,
      events: [],
    },
    {
      id: 'enc-094',
      clientName: 'Eduardo Vasconcelos',
      plate: 'RTY7U65',
      phone: '11 97331-2090',
      address: 'Av. Imperador, 3200',
      city: 'São Paulo',
      neighborhood: 'Vila Jacuí',
      cep: '08050-000',
      region: 'Leste',
      subRegion: 'LESTE 1',
      sector: 'Alta',
      nsu: '883511',
      vehicle: 'Honda Civic',
      desiredDate: '2026-11-13',
      notes: '',
      technicianId: rafael?.id,
      technicianName: rafael?.nome || 'RAFAEL D. CARVALHO',
      status: 'recusado',
      needsReview: false,
      confidence: 94,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-HIST-094',
      originalText: 'Encaixe Vila Jacuí Civic RTY7U65 @Rafael D. Carvalho',
      aiInterpretation: 'Recusado por conflito de janela.',
      requestedAt: '2026-11-13T15:10:00',
      dispatchedAt: '2026-11-13T15:10:00',
      respondedAt: '2026-11-13T15:22:00',
      responseMinutes: 12,
      refusalReason: 'Em atendimento na Penha até 17h30',
      duplicatePings: 0,
      events: [],
    },
    {
      id: 'enc-095',
      clientName: 'Clínica Vida Nova',
      plate: 'HBN6M44',
      phone: '11 98199-4433',
      address: 'Rua Augusta, 1980',
      city: 'São Paulo',
      neighborhood: 'Cerqueira César',
      cep: '01412-000',
      region: 'Centro',
      subRegion: 'CENTRO',
      sector: 'Meio',
      nsu: '883599',
      vehicle: 'Chevrolet Onix',
      desiredDate: '2026-11-13',
      notes: 'Cliente cancelou antes da resposta do técnico',
      technicianId: rafael?.id,
      technicianName: rafael?.nome || 'RAFAEL D. CARVALHO',
      status: 'cancelado',
      needsReview: false,
      confidence: 95,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: 'WA-HIST-095',
      originalText: 'Cancelar encaixe HBN6M44, cliente pediu outro dia.',
      aiInterpretation: 'Cancelamento auditável — excluído do denominador das taxas.',
      requestedAt: '2026-11-13T16:00:00',
      duplicatePings: 0,
      events: [],
    },
  ];
}

export function buildInitialOcorrencias(prestadores: Prestador[]): OcorrenciaRecord[] {
  const findByName = (q: string) =>
    prestadores.find((p) => p.nome.toLowerCase().includes(q.toLowerCase()));

  const rafael = findByName('RAFAEL D. CARVALHO') || prestadores[0];
  const carlos = findByName('CARLOS ANDRÉ') || prestadores[1];
  const brunoG = findByName('BRUNO P. GOIS') || prestadores[4];
  const alex = findByName('ALEX SANDER') || prestadores[5];

  return [
    {
      id: 'oco-201',
      category: 'cliente_nao_atende',
      state: 'aguardando_cliente',
      technicianId: rafael?.id,
      technicianName: rafael?.nome || 'RAFAEL D. CARVALHO',
      clientName: 'Marcos Vinícius Oliveira',
      plate: 'ABC1D23',
      nsu: '884120',
      summary: 'Técnico chegou ao local (Av. Marechal Tito, 1420), cliente não atende interfone nem WhatsApp. Equipe tentando contato.',
      timestamp: `${TODAY_ISO}T13:48:00`,
      lastMessageAt: `${TODAY_ISO}T13:55:00`,
      silenceHours: 1,
      sourceGroup: 'EQUIPE TÉCNICA',
      sourceMessageId: 'WA-3EB0B440D102',
      authorName: rafael?.nome || 'RAFAEL D. CARVALHO',
      originalText:
        'Cheguei no local da placa ABC1D23 (Av. Marechal Tito, 1420), mas cliente não atende interfone nem WhatsApp.',
      aiInterpretation:
        'Ocorrência de cliente sem contato após chegada do técnico. Suporte orientou aguardar 10 min enquanto tenta ligação.',
      confidence: 95,
      needsReview: false,
      hasCompletionEvidence: false,
    },
    {
      id: 'oco-202',
      category: 'problema_placa_os',
      state: 'necessita_revisao',
      technicianId: carlos?.id,
      technicianName: carlos?.nome || 'CARLOS ANDRÉ',
      clientName: 'Cliente não identificado na foto',
      plate: 'A CONFIRMAR',
      nsu: 'SEM NSU',
      summary: 'Foto ilegível enviada pelo técnico solicitando validação de OS/etiqueta. Sistema não inventou os dígitos.',
      timestamp: `${TODAY_ISO}T11:05:00`,
      lastMessageAt: `${TODAY_ISO}T11:05:00`,
      silenceHours: 3,
      sourceGroup: 'EQUIPE TÉCNICA',
      sourceMessageId: 'WA-3EB0B440D220',
      authorName: carlos?.nome || 'CARLOS ANDRÉ',
      originalText:
        '[Imagem anexada] Foto ilegível da etiqueta do rastreador com solicitação de verificação de OS.',
      aiInterpretation:
        'Conteúdo de imagem ilegível/insuficiente para extrair placa ou NSU com segurança. Marcado para revisão humana.',
      confidence: 42,
      needsReview: true,
      hasCompletionEvidence: false,
    },
    {
      id: 'oco-203',
      category: 'atendimento_concluido',
      state: 'resolvida',
      technicianId: brunoG?.id,
      technicianName: brunoG?.nome || 'BRUNO P. GOIS',
      clientName: 'Fernanda Costa Lima',
      plate: 'JKL2M34',
      nsu: '884310',
      summary: 'Instalação finalizada e teste de telemetria validado com a central.',
      timestamp: `${TODAY_ISO}T10:02:00`,
      lastMessageAt: `${TODAY_ISO}T10:38:00`,
      silenceHours: 0,
      sourceGroup: 'EQUIPE TÉCNICA',
      sourceMessageId: 'WA-3EB0B440D189',
      authorName: brunoG?.nome || 'BRUNO P. GOIS',
      originalText:
        'NSU 884310 placa JKL2M34 concluído! Teste de ignição e bloqueio OK com a central.',
      aiInterpretation:
        'Evidência explícita de conclusão enviada pelo técnico responsável.',
      confidence: 98,
      needsReview: false,
      hasCompletionEvidence: true,
    },
    {
      id: 'oco-204',
      category: 'endereco_incorreto',
      state: 'sem_desfecho',
      technicianId: alex?.id,
      technicianName: alex?.nome || 'ALEX SANDER',
      clientName: 'Diego Ferreira Ramos',
      plate: 'MNO7P19',
      nsu: '884188',
      summary: 'Endereço da OS apontava Tucuruvi, mas cliente informou estar em Mairiporã. Conversa parou há 4h sem confirmação final.',
      timestamp: `${TODAY_ISO}T09:10:00`,
      lastMessageAt: `${TODAY_ISO}T09:24:00`,
      silenceHours: 4,
      sourceGroup: 'EQUIPE TÉCNICA',
      sourceMessageId: 'WA-3EB0B440D098',
      authorName: alex?.nome || 'ALEX SANDER',
      originalText:
        'Pessoal, a OS 884188 (MNO7P19) veio como Tucuruvi mas o cliente falou que o carro tá em Mairiporã. Como procedo?',
      aiInterpretation:
        'Divergência de região/endereço. Sem novas mensagens há 4h — mantido como "Sem desfecho identificado" (não presumido como resolvido).',
      confidence: 91,
      needsReview: false,
      hasCompletionEvidence: false,
    },
  ];
}

export function buildInitialDailyAgendas(prestadores: Prestador[]): DailyAgendaEntry[] {
  const findByName = (q: string) =>
    prestadores.find((p) => p.nome.toLowerCase().includes(q.toLowerCase()));

  const carlos = findByName('CARLOS ANDRÉ') || prestadores[1];
  const felipe = findByName('FELIPE') || prestadores[2];
  const leonardo = findByName('LEONARDO MIGUEL') || prestadores[3];
  const brunoM = findByName('BRUNO MARTINS') || prestadores[4];
  const kennedy = findByName('KENNEDY') || prestadores[5];
  const rafael = findByName('RAFAEL D. CARVALHO') || prestadores[0];

  return [
    {
      id: 'agd-1',
      date: TODAY_ISO,
      technicianId: carlos?.id || '7',
      technicianName: carlos?.nome || 'CARLOS ANDRÉ',
      technicianCode: carlos?.codigo || '18724',
      status: 'mudanca',
      habitualCoverage: `${carlos?.regiao || 'LESTE 4'} (Habitual)`,
      dailyCoverage: 'Leste 1 (Alta) · Leste 4 (Alta)',
      rawText: 'Carlos André: Leste 1/4 altas',
      aiInterpretation: 'Mudança temporária apenas para hoje: setor geográfico Alta em Leste 1 e Leste 4.',
      confidence: 95,
      needsReview: false,
      version: 1,
      updatedAt: `${TODAY_ISO}T07:15:00`,
      history: [
        {
          version: 1,
          timestamp: `${TODAY_ISO}T07:15:00`,
          author: 'Parser AGENDAS E MUDANÇAS',
          summary: 'Criado a partir da mensagem diária "Leste 1/4 altas"',
        },
      ],
    },
    {
      id: 'agd-2',
      date: TODAY_ISO,
      technicianId: felipe?.id || '19',
      technicianName: felipe?.nome || 'FELIPE',
      technicianCode: felipe?.codigo || '18823',
      status: 'mudanca',
      habitualCoverage: `${felipe?.regiao || 'GERAL_SP'} (Habitual)`,
      dailyCoverage: 'Sul 1 (Alta) · ABC 3 (Meio) · Centro (Baixa)',
      rawText: 'Felipe Sul1 alta/abc3 meio/centro baixa',
      aiInterpretation: 'Roteiro composto em 3 sub-regiões com setores geográficos específicos válidos apenas para hoje.',
      confidence: 93,
      needsReview: false,
      version: 2,
      updatedAt: `${TODAY_ISO}T07:40:00`,
      history: [
        {
          version: 1,
          timestamp: `${TODAY_ISO}T07:15:00`,
          author: 'Parser AGENDAS E MUDANÇAS',
          summary: 'Sul 1 Alta / ABC 3 Meio',
        },
        {
          version: 2,
          timestamp: `${TODAY_ISO}T07:40:00`,
          author: 'Coordenação Rotas',
          summary: 'Incluído Centro Baixa conforme complemento no grupo',
        },
      ],
    },
    {
      id: 'agd-3',
      date: TODAY_ISO,
      technicianId: leonardo?.id || '27',
      technicianName: leonardo?.nome || 'LEONARDO MIGUEL',
      technicianCode: leonardo?.codigo || '63093',
      status: 'fechada',
      habitualCoverage: `${leonardo?.regiao || 'ABC 3'} (Habitual)`,
      dailyCoverage: 'Agenda Fechada para esta data',
      rawText: 'Leonardo Miguel: Agenda fechada',
      aiInterpretation: 'Agenda fechada — não recebe novos encaixes nesta data.',
      confidence: 99,
      needsReview: false,
      version: 1,
      updatedAt: `${TODAY_ISO}T07:15:00`,
      history: [
        {
          version: 1,
          timestamp: `${TODAY_ISO}T07:15:00`,
          author: 'Parser AGENDAS E MUDANÇAS',
          summary: 'Agenda marcada como Fechada',
        },
      ],
    },
    {
      id: 'agd-4',
      date: TODAY_ISO,
      technicianId: brunoM?.id || '5',
      technicianName: brunoM?.nome || 'BRUNO MARTINS',
      technicianCode: brunoM?.codigo || '19101',
      status: 'reduzida',
      habitualCoverage: `${brunoM?.regiao || 'OESTE 1'} (Habitual)`,
      dailyCoverage: `${brunoM?.regiao || 'OESTE 1'} (Capacidade Reduzida — somente manhã)`,
      reducedCapacityNote: 'Somente janela da manhã',
      rawText: 'Bruno Martins: Reduzida (somente manhã)',
      aiInterpretation: 'Capacidade reduzida identificada; recomendada revisão quanto ao teto de encaixes da tarde.',
      confidence: 88,
      needsReview: true,
      version: 1,
      updatedAt: `${TODAY_ISO}T07:15:00`,
      history: [
        {
          version: 1,
          timestamp: `${TODAY_ISO}T07:15:00`,
          author: 'Parser AGENDAS E MUDANÇAS',
          summary: 'Status Reduzida — aguardando confirmação da regra',
        },
      ],
    },
    {
      id: 'agd-5',
      date: TODAY_ISO,
      technicianId: kennedy?.id || '26',
      technicianName: kennedy?.nome || 'KENNEDY',
      technicianCode: kennedy?.codigo || '67677',
      status: 'sem_servico',
      habitualCoverage: `${kennedy?.regiao || 'LITORAL 1'} (Habitual)`,
      dailyCoverage: 'Sem serviço previsto na data',
      rawText: 'Kennedy: Sem serviço hoje',
      aiInterpretation: 'Técnico sem atendimento previsto na data.',
      confidence: 99,
      needsReview: false,
      version: 1,
      updatedAt: `${TODAY_ISO}T07:15:00`,
      history: [
        {
          version: 1,
          timestamp: `${TODAY_ISO}T07:15:00`,
          author: 'Parser AGENDAS E MUDANÇAS',
          summary: 'Marcado como Sem Serviço',
        },
      ],
    },
    {
      id: 'agd-6',
      date: TODAY_ISO,
      technicianId: rafael?.id || '38',
      technicianName: rafael?.nome || 'RAFAEL D. CARVALHO',
      technicianCode: rafael?.codigo || '68094',
      status: 'normal',
      habitualCoverage: `${rafael?.regiao || 'LESTE 1'} (Habitual)`,
      dailyCoverage: `${rafael?.regiao || 'LESTE 1'} (Normal — sem alterações temporárias)`,
      rawText: 'Cobertura habitual mantida sem registro de alteração no grupo.',
      aiInterpretation: 'Sem mudanças reportadas; mantendo cobertura habitual.',
      confidence: 100,
      needsReview: false,
      version: 1,
      updatedAt: `${TODAY_ISO}T07:00:00`,
      history: [],
    },
  ];
}

export const INITIAL_GEO_HIERARCHY: GeoHierarchyItem[] = [
  {
    id: 'geo-leste-1',
    macroRegion: 'Leste',
    subRegion: 'LESTE 1',
    sectors: ['Alta', 'Meio', 'Baixa'],
    cepPrefixes: ['08010', '08020', '08050', '03318', '03600'],
    neighborhoods: ['São Miguel Paulista', 'Vila Jacuí', 'Tatuapé', 'Penha', 'Ermelino Matarazzo'],
    cities: ['São Paulo'],
  },
  {
    id: 'geo-leste-4',
    macroRegion: 'Leste',
    subRegion: 'LESTE 4',
    sectors: ['Alta', 'Meio', 'Baixa'],
    cepPrefixes: ['03949', '03988', '08340', '08410'],
    neighborhoods: ['São Mateus', 'Sapopemba', 'Guaianases', 'Cidade Tiradentes'],
    cities: ['São Paulo'],
  },
  {
    id: 'geo-sul-1',
    macroRegion: 'Sul',
    subRegion: 'SUL 1',
    sectors: ['Alta', 'Meio', 'Baixa', 'Direita', 'Esquerda'],
    cepPrefixes: ['04308', '04101', '04002'],
    neighborhoods: ['Jabaquara', 'Saúde', 'Vila Mariana', 'Ipiranga'],
    cities: ['São Paulo'],
  },
  {
    id: 'geo-abc-3',
    macroRegion: 'ABC',
    subRegion: 'ABC 3',
    sectors: ['Alta', 'Meio', 'Baixa'],
    cepPrefixes: ['09040', '09010', '09510', '09720'],
    neighborhoods: ['Centro', 'Vila Assunção', 'Campestre', 'Rudge Ramos'],
    cities: ['Santo André', 'São Bernardo do Campo', 'São Caetano do Sul'],
  },
  {
    id: 'geo-oeste-1',
    macroRegion: 'Oeste',
    subRegion: 'OESTE 1',
    sectors: ['Alta', 'Meio', 'Baixa'],
    cepPrefixes: ['05047', '05001', '05414'],
    neighborhoods: ['Lapa', 'Perdizes', 'Pinheiros', 'Barra Funda'],
    cities: ['São Paulo'],
  },
  {
    id: 'geo-norte-1',
    macroRegion: 'Norte',
    subRegion: 'NORTE 1',
    sectors: ['Alta', 'Meio', 'Baixa'],
    cepPrefixes: ['02011', '02201', '02401'],
    neighborhoods: ['Santana', 'Tucuruvi', 'Mandaqui'],
    cities: ['São Paulo'],
  },
  {
    id: 'geo-centro',
    macroRegion: 'Centro',
    subRegion: 'CENTRO',
    sectors: ['Alta', 'Meio', 'Baixa'],
    cepPrefixes: ['01412', '01001', '01310'],
    neighborhoods: ['Cerqueira César', 'Bela Vista', 'República', 'Sé'],
    cities: ['São Paulo'],
  },
];

export const INITIAL_CLIENTES_CHAMADOS: ClienteChamadoRecord[] = [
  {
    id: 'cli-1',
    clientName: 'Marcos Vinícius Oliveira',
    plate: 'ABC1D23',
    phone: '11 99123-4567',
    nsu: '884120',
    vehicle: 'Hyundai HB20 Prata',
    address: 'Av. Marechal Tito, 1420 · São Miguel Paulista (Leste 1 Alta)',
    regionLabel: 'Leste / LESTE 1 / Alta',
    matchConfidence: 98,
    currentStatus: 'Aguardando retorno do cliente no local',
    events: [
      {
        id: 'ce-1',
        timestamp: `${TODAY_ISO}T08:42:00`,
        sourceGroup: 'ENCAIXES MESMO DIA',
        sourceMessageId: 'WA-3EB0A891C201',
        author: 'Camila (Atendimento)',
        eventTitle: 'Solicitação de encaixe aberta',
        originalText:
          'Bom dia! Encaixe Leste 1 Alta (São Miguel Paulista) - Cliente Marcos Vinícius | Placa ABC1D23 | HB20 Prata | NSU 884120.',
        aiInterpretation: 'Encaixe mesmo dia extraído e associado ao CEP 08010-090 (Leste 1 Alta).',
        consolidatedState: 'Técnico acionado: RAFAEL D. CARVALHO',
        confidence: 96,
      },
      {
        id: 'ce-2',
        timestamp: `${TODAY_ISO}T08:50:00`,
        sourceGroup: 'ENCAIXES MESMO DIA',
        sourceMessageId: 'WA-3EB0A891C218',
        author: 'RAFAEL D. CARVALHO',
        eventTitle: 'Aceite do técnico confirmado',
        originalText: 'Consigo sim, coloco na rota das 13h30 depois do almoço.',
        aiInterpretation: 'Resposta vinculada via citação à solicitação #884120.',
        consolidatedState: 'Encaixe Aceito (tempo de resposta: 8 min)',
        confidence: 98,
      },
      {
        id: 'ce-3',
        timestamp: `${TODAY_ISO}T13:48:00`,
        sourceGroup: 'EQUIPE TÉCNICA',
        sourceMessageId: 'WA-3EB0B440D102',
        author: 'RAFAEL D. CARVALHO',
        eventTitle: 'Chegada ao local e cliente sem atendimento',
        originalText:
          'Cheguei no local da placa ABC1D23 (Av. Marechal Tito, 1420), mas cliente não atende interfone nem WhatsApp.',
        aiInterpretation: 'Ocorrência vinculada por Placa ABC1D23 + endereço.',
        consolidatedState: 'Aguardando cliente',
        confidence: 95,
      },
      {
        id: 'ce-4',
        timestamp: `${TODAY_ISO}T13:55:00`,
        sourceGroup: 'EQUIPE TÉCNICA',
        sourceMessageId: 'WA-3EB0B440D115',
        author: 'Juliana (Suporte)',
        eventTitle: 'Tentativa de contato pela central',
        originalText:
          'Rafael, estamos ligando para o Marcos (NSU 884120) para liberar entrada. Aguarda 10 min por favor.',
        aiInterpretation: 'Ação de suporte em andamento sem conclusão registrada ainda.',
        consolidatedState: 'Em acompanhamento (aguardando cliente)',
        confidence: 95,
      },
    ],
  },
  {
    id: 'cli-2',
    clientName: 'Fernanda Costa Lima',
    plate: 'JKL2M34',
    phone: '11 99871-4090',
    nsu: '884310',
    vehicle: 'Jeep Compass Preto',
    address: 'Av. Eng. Armando de Arruda Pereira, 2300 · Jabaquara',
    regionLabel: 'Sul / SUL 1 / Alta',
    matchConfidence: 99,
    currentStatus: 'Atendimento concluído (com evidência)',
    events: [
      {
        id: 'ce-21',
        timestamp: `${TODAY_ISO}T09:15:00`,
        sourceGroup: 'ENCAIXES MESMO DIA',
        sourceMessageId: 'WA-3EB0A891C412',
        author: 'Juliana (Suporte)',
        eventTitle: 'Encaixe direcionado para Bruno P. Gois',
        originalText: 'Encaixe Sul 1 Jabaquara | Fernanda Costa | JKL2M34 | NSU 884310.',
        aiInterpretation: 'Registro de substituição de técnico preservando histórico anterior.',
        consolidatedState: 'Aceito por BRUNO P. GOIS (6 min)',
        confidence: 96,
      },
      {
        id: 'ce-22',
        timestamp: `${TODAY_ISO}T10:38:00`,
        sourceGroup: 'EQUIPE TÉCNICA',
        sourceMessageId: 'WA-3EB0B440D189',
        author: 'BRUNO P. GOIS',
        eventTitle: 'Conclusão explícita reportada',
        originalText: 'NSU 884310 placa JKL2M34 concluído! Teste de ignição e bloqueio OK com a central.',
        aiInterpretation: 'Evidência textual explícita de conclusão e validação com a central.',
        consolidatedState: 'Resolvida / Concluída',
        confidence: 98,
      },
    ],
  },
  {
    id: 'cli-3',
    clientName: 'Carla Mendes Souza (Associação parcial)',
    plate: 'FDS9K12',
    phone: '11 98221-7710',
    nsu: '884299',
    vehicle: 'Chevrolet Tracker Branco',
    address: 'Av. Portugal, 610 · Centro · Santo André',
    regionLabel: 'ABC / ABC 3 / Meio',
    matchConfidence: 76,
    ambiguousMatchWarning:
      'Há outro chamado antigo com nome "Carla M." sem placa informada. Mantido separado por segurança para não mesclar veículos distintos.',
    currentStatus: 'Técnico acionado (em revisão)',
    events: [
      {
        id: 'ce-31',
        timestamp: `${TODAY_ISO}T10:12:00`,
        sourceGroup: 'ENCAIXES MESMO DIA',
        sourceMessageId: 'WA-3EB0A891C399',
        author: 'Camila (Atendimento)',
        eventTitle: 'Solicitação via áudio transcrito',
        originalText:
          '[Áudio 0:18] "Pessoal, precisa encaixar um Tracker em Santo André, perto da Av. Portugal, placa FDS9K12, cliente Carla Mendes..."',
        aiInterpretation: 'Associação por placa FDS9K12 e telefone; revisão solicitada para definir técnico principal.',
        consolidatedState: 'Aguardando resposta (revisão pendente)',
        confidence: 81,
      },
    ],
  },
];

export const INITIAL_AI_USAGE: AiUsageEntry[] = [
  {
    id: 'ai-1',
    model: 'DeepSeek-V3',
    task: 'Extração de entidades (Encaixes & Ocorrências)',
    messagesCount: 1420,
    inputTokens: 890000,
    outputTokens: 210000,
    estimatedUsd: 0.24,
  },
  {
    id: 'ai-2',
    model: 'Gemini Decision 1',
    task: 'Classificação estruturada & desambiguação de estados',
    messagesCount: 1850,
    inputTokens: 1240000,
    outputTokens: 165000,
    estimatedUsd: 0.12, // Referência US$ 0,10 / 1M input tokens
  },
  {
    id: 'ai-3',
    model: 'DeepSeek-V3',
    task: 'Resumos e respostas do Chat de Consulta',
    messagesCount: 164,
    inputTokens: 320000,
    outputTokens: 95000,
    estimatedUsd: 0.09,
  },
  {
    id: 'ai-4',
    model: 'Motor Determinístico',
    task: 'Deduplicação, SLA, CEP/Geografia, Taxas e Probabilidade',
    messagesCount: 3434,
    inputTokens: 0,
    outputTokens: 0,
    estimatedUsd: 0,
  },
];

/**
 * Motor Determinístico de Métricas (Seção 3.4 & 3.5 da especificação)
 * Nunca delega cálculos de taxas, médias ou estimativas para IA.
 */
export function computeTechnicianMetrics(
  prestador: Prestador,
  encaixes: EncaixeRecord[],
  dailyAgenda?: DailyAgendaEntry
): TechnicianComputedMetrics {
  const mine = encaixes.filter(
    (e) =>
      e.technicianId === prestador.id ||
      (e.technicianName && e.technicianName.toUpperCase() === prestador.nome.toUpperCase())
  );

  // Excluir cancelados do universo válido comparável
  const validNonCancelled = mine.filter((e) => e.status !== 'cancelado');

  // Finalizadas = aceito, recusado, sem_resposta
  const finalized = validNonCancelled.filter(
    (e) => e.status === 'aceito' || e.status === 'recusado' || e.status === 'sem_resposta'
  );
  const pendingCount = validNonCancelled.filter(
    (e) =>
      e.status === 'recebido' ||
      e.status === 'aguardando_validacao' ||
      e.status === 'tecnico_acionado' ||
      e.status === 'desconhecido'
  ).length;

  const acceptedCount = finalized.filter((e) => e.status === 'aceito').length;
  const refusedCount = finalized.filter((e) => e.status === 'recusado').length;
  const noResponseCount = finalized.filter((e) => e.status === 'sem_resposta').length;
  const finalizedCount = finalized.length;

  const acceptanceRate = finalizedCount > 0 ? Math.round((acceptedCount / finalizedCount) * 100) : null;
  const refusalRate = finalizedCount > 0 ? Math.round((refusedCount / finalizedCount) * 100) : null;
  const responseRate =
    finalizedCount > 0 ? Math.round(((acceptedCount + refusedCount) / finalizedCount) * 100) : null;
  const absenceRate = finalizedCount > 0 ? Math.round((noResponseCount / finalizedCount) * 100) : null;

  const responseTimes = finalized
    .map((e) => e.responseMinutes)
    .filter((v): v is number => typeof v === 'number' && v >= 0);
  const avgResponseMinutes =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((acc, n) => acc + n, 0) / responseTimes.length)
      : null;

  // Regiões
  const regionMap = new Map<string, { total: number; accepted: number }>();
  for (const item of finalized) {
    const key = item.subRegion || item.region || 'Não informada';
    const curr = regionMap.get(key) || { total: 0, accepted: 0 };
    curr.total += 1;
    if (item.status === 'aceito') curr.accepted += 1;
    regionMap.set(key, curr);
  }
  const byRegion = Array.from(regionMap.entries()).map(([region, stats]) => ({
    region,
    ...stats,
  }));

  // Período do dia
  const periodMap: Record<'Manhã' | 'Tarde', { total: number; accepted: number }> = {
    Manhã: { total: 0, accepted: 0 },
    Tarde: { total: 0, accepted: 0 },
  };
  for (const item of finalized) {
    const hour = new Date(item.requestedAt).getHours();
    const p: 'Manhã' | 'Tarde' = hour < 12 ? 'Manhã' : 'Tarde';
    periodMap[p].total += 1;
    if (item.status === 'aceito') periodMap[p].accepted += 1;
  }
  const byPeriod = (['Manhã', 'Tarde'] as const)
    .map((period) => ({ period, ...periodMap[period] }))
    .filter((p) => p.total > 0);

  // Probabilidade Estimada de Aceite (Seção 3.5)
  // Exige amostra mínima (n >= 2 neste protótipo visual; em produção configurável)
  const sufficientSample = finalizedCount >= 2;
  let estimatedAcceptProbability: number | null = null;
  let probabilityBasis = 'Histórico insuficiente (mín. 2 observações finalizadas)';

  if (dailyAgenda && (dailyAgenda.status === 'fechada' || dailyAgenda.status === 'sem_servico')) {
    estimatedAcceptProbability = 0;
    probabilityBasis = `Agenda do dia: ${dailyAgenda.status === 'fechada' ? 'Fechada' : 'Sem serviço'} (n=${finalizedCount})`;
  } else if (sufficientSample && acceptanceRate !== null) {
    let prob = acceptanceRate;
    if (dailyAgenda?.status === 'reduzida') {
      prob = Math.max(5, Math.round(prob * 0.65));
      probabilityBasis = `Estimativa ponderada com agenda reduzida · n=${finalizedCount} obs.`;
    } else {
      probabilityBasis = `Estimativa estatística baseada em n=${finalizedCount} obs. (${prestador.regiao})`;
    }
    estimatedAcceptProbability = Math.min(95, Math.max(5, prob));
  }

  return {
    prestador,
    totalReceived: validNonCancelled.length,
    finalizedCount,
    pendingCount,
    acceptedCount,
    refusedCount,
    noResponseCount,
    acceptanceRate,
    refusalRate,
    responseRate,
    absenceRate,
    avgResponseMinutes,
    estimatedAcceptProbability,
    sampleSize: finalizedCount,
    probabilityBasis,
    sufficientSample,
    byRegion,
    byPeriod,
  };
}

const CENTRAL_ENCAIXES_KEY = 'ominihub_central_encaixes_v1';
const CENTRAL_AGENDAS_KEY = 'ominihub_central_agendas_v1';

export function getStoredEncaixes(prestadores: Prestador[]): EncaixeRecord[] {
  try {
    const raw = localStorage.getItem(CENTRAL_ENCAIXES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as EncaixeRecord[];
      }
    }
  } catch {
    // Fallback to initial seed
  }
  const seeded = buildInitialEncaixes(prestadores);
  try {
    localStorage.setItem(CENTRAL_ENCAIXES_KEY, JSON.stringify(seeded));
  } catch {}
  return seeded;
}

export function saveStoredEncaixes(encaixes: EncaixeRecord[]): void {
  try {
    localStorage.setItem(CENTRAL_ENCAIXES_KEY, JSON.stringify(encaixes));
    window.dispatchEvent(new Event('central-metrics-updated'));
  } catch {}
}

export function getStoredDailyAgendas(prestadores: Prestador[]): DailyAgendaEntry[] {
  try {
    const raw = localStorage.getItem(CENTRAL_AGENDAS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as DailyAgendaEntry[];
      }
    }
  } catch {
    // Fallback to initial seed
  }
  const seeded = buildInitialDailyAgendas(prestadores);
  try {
    localStorage.setItem(CENTRAL_AGENDAS_KEY, JSON.stringify(seeded));
  } catch {}
  return seeded;
}

export function saveStoredDailyAgendas(agendas: DailyAgendaEntry[]): void {
  try {
    localStorage.setItem(CENTRAL_AGENDAS_KEY, JSON.stringify(agendas));
    window.dispatchEvent(new Event('central-metrics-updated'));
  } catch {}
}

