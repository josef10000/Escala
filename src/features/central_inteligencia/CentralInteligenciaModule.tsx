import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Zap,
  AlertCircle,
  CalendarRange,
  FileSearch,
  MessageSquareText,
  QrCode,
  WifiOff,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import { Prestador } from '../prestadores_regional/types';
import { getStoredPrestadores } from '../prestadores_regional/utils/storage';
import {
  AgendaStatusType,
  CentralOperationalConfig,
  CentralTab,
  ClienteChamadoRecord,
  DailyAgendaEntry,
  EncaixeRecord,
  EncaixeStatus,
  GeoHierarchyItem,
  OcorrenciaRecord,
  OcorrenciaState,
  RawWhatsAppMessage,
  WhatsAppConnectionStatus,
  WhatsAppGroupKey,
} from './types';
import {
  buildInitialOcorrencias,
  getStoredDailyAgendas,
  getStoredEncaixes,
  INITIAL_CLIENTES_CHAMADOS,
  INITIAL_GEO_HIERARCHY,
  INITIAL_OPERATIONAL_CONFIG,
  INITIAL_RAW_MESSAGES,
  saveStoredDailyAgendas,
  saveStoredEncaixes,
  TODAY_ISO,
} from './data/mockCentralData';
import { OverviewView } from './components/OverviewView';
import { EncaixesView } from './components/EncaixesView';
import { OcorrenciasView } from './components/OcorrenciasView';
import { AgendasGeografiaView } from './components/AgendasGeografiaView';
import { ClientesTimelineView } from './components/ClientesTimelineView';
import { ChatConsultaView } from './components/ChatConsultaView';
import { WhatsAppConnectionView } from './components/WhatsAppConnectionView';

export const CentralInteligenciaModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CentralTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Reaproveita exatamente os mesmos técnicos/regiões já cadastrados em Técnicos & CEP
  const [prestadores, setPrestadores] = useState<Prestador[]>(() => getStoredPrestadores());

  // Estado da Conexão WhatsApp / Evolution API (simulação interativa front-end)
  const [connectionStatus, setConnectionStatus] = useState<WhatsAppConnectionStatus>('qr_pending');
  const [instanceName, setInstanceName] = useState<string>('ominihub-operacao-sp');
  const [connectedPhone] = useState<string>('+55 (11) 98800-1122');
  const [monitoredGroups, setMonitoredGroups] = useState<Record<WhatsAppGroupKey, boolean>>({
    'ENCAIXES MESMO DIA': true,
    'EQUIPE TÉCNICA': true,
    'AGENDAS E MUDANÇAS': true,
  });

  // Dados operacionais simulados (conectados aos técnicos reais e compartilhados com os cards)
  const [rawMessages, setRawMessages] = useState<RawWhatsAppMessage[]>(INITIAL_RAW_MESSAGES);
  const [encaixes, setEncaixes] = useState<EncaixeRecord[]>(() =>
    getStoredEncaixes(getStoredPrestadores())
  );
  const [selectedEncaixeId, setSelectedEncaixeId] = useState<string | null>(null);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaRecord[]>(() =>
    buildInitialOcorrencias(getStoredPrestadores())
  );
  const [dailyAgendas, setDailyAgendas] = useState<DailyAgendaEntry[]>(() =>
    getStoredDailyAgendas(getStoredPrestadores())
  );
  const [geoHierarchy] = useState<GeoHierarchyItem[]>(INITIAL_GEO_HIERARCHY);
  const [clientes] = useState<ClienteChamadoRecord[]>(INITIAL_CLIENTES_CHAMADOS);
  const [config, setConfig] = useState<CentralOperationalConfig>(INITIAL_OPERATIONAL_CONFIG);

  // Filtros controlados para navegação cruzada entre telas
  const [encaixesSearch, setEncaixesSearch] = useState('');
  const [encaixesStatusFilter, setEncaixesStatusFilter] = useState<'all' | EncaixeStatus>('all');
  const [encaixesOnlyReview, setEncaixesOnlyReview] = useState(false);

  const [ocorrenciasSearch, setOcorrenciasSearch] = useState('');
  const [ocorrenciasStateFilter, setOcorrenciasStateFilter] = useState<'all' | OcorrenciaState>('all');
  const [ocorrenciasOnlyReview, setOcorrenciasOnlyReview] = useState(false);
  const [highlightedOcorrenciaId, setHighlightedOcorrenciaId] = useState<string | null>(null);

  const [agendasStatusFilter, setAgendasStatusFilter] = useState<'all' | AgendaStatusType>('all');
  const [clientesSearch, setClientesSearch] = useState('');

  // Feedback toast sutil
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 2600);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(label);
  };

  // Mantém sincronizado caso o usuário cadastre algo em Técnicos & CEP antes de voltar
  useEffect(() => {
    setPrestadores(getStoredPrestadores());
  }, []);

  useEffect(() => {
    saveStoredEncaixes(encaixes);
  }, [encaixes]);

  useEffect(() => {
    saveStoredDailyAgendas(dailyAgendas);
  }, [dailyAgendas]);

  // Volta o scroll central ao topo ao trocar de aba
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  const handleToggleGroup = (group: WhatsAppGroupKey) => {
    setMonitoredGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    showToast(`Monitoramento de ${group} atualizado`);
  };

  const handleSimulateIncomingMessage = (group: WhatsAppGroupKey) => {
    const idSuffix = Math.floor(100 + Math.random() * 900);
    const msgId = `WA-SIM-${Date.now().toString().slice(-6)}`;
    const sampleTech = prestadores[Math.floor(Math.random() * Math.min(12, prestadores.length))];
    const techName = sampleTech?.nome || 'RAFAEL D. CARVALHO';

    const sampleTexts: Record<WhatsAppGroupKey, string> = {
      'ENCAIXES MESMO DIA': `Encaixe ${sampleTech?.regiao || 'LESTE 1'} - Cliente Teste #${idSuffix} | Placa SIM${idSuffix}K | Tel 11 99000-${idSuffix}1 | @${techName} consegue atender hoje?`,
      'EQUIPE TÉCNICA': `${techName}: Cheguei no local do veículo SIM${idSuffix}K, cliente ausente no endereço informado.`,
      'AGENDAS E MUDANÇAS': `${techName}: Alteração para hoje -> ${sampleTech?.regiao || 'LESTE 1'} setor Alta`,
    };

    const newRaw: RawWhatsAppMessage = {
      id: `raw-${Date.now()}`,
      whatsappMessageId: msgId,
      group,
      senderName: group === 'EQUIPE TÉCNICA' ? techName : 'Atendimento Central',
      senderPhone: '11 98412-3301',
      timestamp: new Date().toISOString(),
      contentType: 'text',
      text: sampleTexts[group],
      aiModel: group === 'ENCAIXES MESMO DIA' ? 'DeepSeek-V3' : 'Gemini Decision 1',
      confidence: 91,
    };

    setRawMessages((prev) => [newRaw, ...prev]);

    if (group === 'ENCAIXES MESMO DIA') {
      const newEnc: EncaixeRecord = {
        id: `enc-sim-${Date.now()}`,
        clientName: `Cliente Simulado #${idSuffix}`,
        plate: `SIM${idSuffix}K`,
        phone: `11 99000-${idSuffix}1`,
        address: 'Endereço simulado via webhook',
        city: 'São Paulo',
        neighborhood: sampleTech?.regiao || 'LESTE 1',
        cep: '08010-090',
        region: 'Leste',
        subRegion: sampleTech?.regiao || 'LESTE 1',
        sector: 'Alta',
        nsu: `889${idSuffix}`,
        vehicle: 'Veículo Simulado',
        desiredDate: TODAY_ISO,
        notes: 'Simulado pela Central WhatsApp',
        technicianId: sampleTech?.id,
        technicianName: techName,
        status: 'tecnico_acionado',
        needsReview: false,
        confidence: 91,
        sourceGroup: group,
        sourceMessageId: msgId,
        originalText: newRaw.text,
        aiInterpretation: `Solicitação simulada extraída e vinculada a ${techName}.`,
        requestedAt: newRaw.timestamp,
        dispatchedAt: newRaw.timestamp,
        duplicatePings: 0,
        events: [
          {
            id: `ev-${Date.now()}`,
            timestamp: newRaw.timestamp,
            title: 'Mensagem simulada ingerida via Evolution API',
            actor: 'Simulador Webhook',
            sourceMessageId: msgId,
          },
        ],
      };
      setEncaixes((prev) => [newEnc, ...prev]);
      showToast(`Novo encaixe SIM${idSuffix}K registrado`);
    } else if (group === 'EQUIPE TÉCNICA') {
      const newOco: OcorrenciaRecord = {
        id: `oco-sim-${Date.now()}`,
        category: 'cliente_ausente',
        state: 'aguardando_cliente',
        technicianId: sampleTech?.id,
        technicianName: techName,
        clientName: `Cliente Simulado #${idSuffix}`,
        plate: `SIM${idSuffix}K`,
        nsu: `889${idSuffix}`,
        summary: `${techName} informou chegada ao local com cliente ausente (evento simulado).`,
        timestamp: newRaw.timestamp,
        lastMessageAt: newRaw.timestamp,
        silenceHours: 0,
        sourceGroup: group,
        sourceMessageId: msgId,
        authorName: techName,
        originalText: newRaw.text,
        aiInterpretation: 'Ocorrência classificada como cliente ausente; aguardando retorno.',
        confidence: 91,
        needsReview: false,
        hasCompletionEvidence: false,
      };
      setOcorrencias((prev) => [newOco, ...prev]);
      showToast(`Ocorrência SIM${idSuffix}K adicionada`);
    } else {
      showToast('Mensagem de agenda simulada registrada');
    }
  };

  const handleUpdateEncaixeStatus = (
    id: string,
    status: EncaixeStatus,
    resolvedReview = false,
    refusalReason?: string
  ) => {
    const now = new Date().toISOString();
    setEncaixes((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const responseMinutes =
          status === 'aceito' || status === 'recusado'
            ? item.responseMinutes ?? 10
            : item.responseMinutes;
        return {
          ...item,
          status,
          refusalReason:
            status === 'recusado'
              ? refusalReason || item.refusalReason
              : status === 'aceito'
              ? undefined
              : item.refusalReason,
          needsReview: resolvedReview ? false : item.needsReview,
          respondedAt: status === 'aceito' || status === 'recusado' ? now : item.respondedAt,
          responseMinutes,
          events: [
            ...item.events,
            {
              id: `ev-man-${Date.now()}`,
              timestamp: now,
              title:
                status === 'recusado' && refusalReason
                  ? `Marcado como recusado (${refusalReason})`
                  : `Estado atualizado manualmente para "${status.replace(/_/g, ' ')}"`,
              actor: 'Revisão Humana',
              previousValue: item.status,
              newValue: status,
            },
          ],
        };
      })
    );
    const labelMap: Record<EncaixeStatus, string> = {
      aceito: 'Aceite confirmado',
      recusado: 'Recusa registrada',
      sem_resposta: 'Marcado como sem resposta',
      tecnico_acionado: 'Técnico acionado',
      aguardando_validacao: 'Aguardando validação',
      recebido: 'Recebido',
      cancelado: 'Cancelado',
      desconhecido: 'Estado atualizado',
    };
    showToast(labelMap[status]);
  };

  const handleReassignTechnician = (id: string, technicianId: string) => {
    const tech = prestadores.find((p) => p.id === technicianId);
    if (!tech) return;
    const now = new Date().toISOString();
    setEncaixes((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const prevTech = item.technicianName || 'Não definido';
        const nextStatus: EncaixeStatus =
          item.status === 'recusado' ||
          item.status === 'sem_resposta' ||
          item.status === 'aguardando_validacao' ||
          item.status === 'recebido'
            ? 'tecnico_acionado'
            : item.status;
        return {
          ...item,
          technicianId: tech.id,
          technicianName: tech.nome,
          status: nextStatus,
          dispatchedAt: now,
          events: [
            ...item.events,
            {
              id: `ev-tech-${Date.now()}`,
              timestamp: now,
              title: 'Técnico reatribuído manualmente',
              actor: 'Coordenação',
              previousValue: prevTech,
              newValue: tech.nome,
            },
          ],
        };
      })
    );
    showToast(`Encaixe direcionado para ${tech.nome}`);
  };

  const handleSimulateNewEncaixe = (rawText: string, technicianId?: string) => {
    const tech = prestadores.find((p) => p.id === technicianId);
    const now = new Date().toISOString();
    const plateMatch = rawText.match(/\b[A-Z]{3}[0-9][A-Z0-9][0-9]{2}\b/i);
    const nsuMatch = rawText.match(/NSU\s*[:#-]?\s*(\d{4,8})/i);
    const cepMatch = rawText.match(/\b\d{5}-?\d{3}\b/);

    const newRecord: EncaixeRecord = {
      id: `enc-${Date.now()}`,
      clientName: 'Novo Cliente Extraído',
      plate: plateMatch ? plateMatch[0].toUpperCase() : 'SEM PLACA',
      phone: '11 99000-0000',
      address: 'Extraído do texto do grupo',
      city: 'São Paulo',
      neighborhood: tech?.regiao || 'A validar',
      cep: cepMatch ? cepMatch[0] : '',
      region: 'São Paulo',
      subRegion: tech?.regiao || 'Não identificada',
      sector: cepMatch ? 'Alta' : 'Requer revisão',
      nsu: nsuMatch ? nsuMatch[1] : 'N/I',
      vehicle: 'Identificado na mensagem',
      desiredDate: TODAY_ISO,
      notes: 'Simulado manualmente pelo usuário',
      technicianId: tech?.id,
      technicianName: tech?.nome,
      status: tech ? 'tecnico_acionado' : 'aguardando_validacao',
      needsReview: !cepMatch || !plateMatch,
      reviewReason:
        !cepMatch || !plateMatch
          ? 'Faltam placa ou CEP completo para associação geográfica determinística.'
          : undefined,
      confidence: plateMatch && cepMatch ? 94 : 72,
      sourceGroup: 'ENCAIXES MESMO DIA',
      sourceMessageId: `WA-SIM-${Date.now().toString().slice(-6)}`,
      originalText: rawText,
      aiInterpretation: `Solicitação interpretada no grupo ENCAIXES MESMO DIA${tech ? ` e direcionada a ${tech.nome}` : ''}.`,
      requestedAt: now,
      dispatchedAt: tech ? now : undefined,
      duplicatePings: 0,
      events: [
        {
          id: `ev-${Date.now()}`,
          timestamp: now,
          title: 'Solicitação criada via simulador de entrada',
          actor: 'Gestor (Simulação)',
        },
      ],
    };

    setEncaixes((prev) => [newRecord, ...prev]);
    setSelectedEncaixeId(newRecord.id);
    showToast(`Encaixe ${newRecord.plate} registrado`);
  };

  const handleUpdateOcorrenciaState = (
    id: string,
    nextState: OcorrenciaState,
    markReviewed = false,
    note?: string
  ) => {
    setOcorrencias((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              state: nextState,
              needsReview: markReviewed ? false : nextState === 'necessita_revisao',
              hasCompletionEvidence: nextState === 'resolvida' ? true : o.hasCompletionEvidence,
              summary: note ? `${o.summary} (Encerramento: ${note})` : o.summary,
            }
          : o
      )
    );
    showToast(
      nextState === 'resolvida'
        ? 'Ocorrência encerrada'
        : nextState === 'necessita_revisao'
        ? 'Marcada para revisão humana'
        : 'Ocorrência colocada em acompanhamento'
    );
  };

  const handleApproveAgendaReview = (id: string) => {
    setDailyAgendas((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              needsReview: false,
              version: a.version + 1,
              updatedAt: new Date().toISOString(),
              history: [
                ...a.history,
                {
                  version: a.version + 1,
                  timestamp: new Date().toISOString(),
                  author: 'Gestor (Revisão Manual)',
                  summary: 'Regra diária confirmada manualmente',
                },
              ],
            }
          : a
      )
    );
    showToast('Regra de agenda aprovada');
  };

  const handleSimulateAgendaMessage = (rawText: string, date: string) => {
    const matchedTech = prestadores.find((p) => {
      const first = p.nome.split(' ')[0].toLowerCase();
      return first.length >= 4 && rawText.toLowerCase().includes(first);
    });
    const lower = rawText.toLowerCase();
    const status = lower.includes('fechada')
      ? 'fechada'
      : lower.includes('sem serviço') || lower.includes('sem servico')
      ? 'sem_servico'
      : lower.includes('reduzida')
      ? 'reduzida'
      : 'mudanca';

    const newAgenda: DailyAgendaEntry = {
      id: `agd-${Date.now()}`,
      date,
      technicianId: matchedTech?.id || `temp-${Date.now()}`,
      technicianName: matchedTech?.nome || 'TÉCNICO IDENTIFICADO NO TEXTO',
      technicianCode: matchedTech?.codigo || '00000',
      status,
      habitualCoverage: matchedTech ? `${matchedTech.regiao} (Habitual)` : 'Não vinculado',
      dailyCoverage: rawText,
      rawText,
      aiInterpretation: `Interpretação diária isolada para ${date} (não sobrescreve dias seguintes).`,
      confidence: matchedTech ? 92 : 65,
      needsReview: !matchedTech || status === 'reduzida',
      version: 1,
      updatedAt: new Date().toISOString(),
      history: [
        {
          version: 1,
          timestamp: new Date().toISOString(),
          author: 'Simulador AGENDAS E MUDANÇAS',
          summary: `Criado a partir de "${rawText}"`,
        },
      ],
    };

    setDailyAgendas((prev) => [newAgenda, ...prev]);
    showToast(`Agenda registrada para ${date}`);
  };

  // Navegadores cruzados
  const openEncaixesFiltered = (opts: {
    status?: 'all' | EncaixeStatus;
    onlyReview?: boolean;
    encaixeId?: string;
    search?: string;
  }) => {
    setEncaixesStatusFilter(opts.status ?? 'all');
    setEncaixesOnlyReview(opts.onlyReview ?? false);
    setEncaixesSearch(opts.search ?? '');
    setSelectedEncaixeId(opts.encaixeId ?? null);
    setActiveTab('encaixes');
    setMobileMenuOpen(false);
  };

  const openOcorrenciasFiltered = (opts: {
    state?: 'all' | OcorrenciaState;
    onlyReview?: boolean;
    highlightId?: string;
    search?: string;
  }) => {
    setOcorrenciasStateFilter(opts.state ?? 'all');
    setOcorrenciasOnlyReview(opts.onlyReview ?? false);
    setOcorrenciasSearch(opts.search ?? '');
    setHighlightedOcorrenciaId(opts.highlightId ?? null);
    setActiveTab('ocorrencias');
    setMobileMenuOpen(false);
  };

  const openAgendasFiltered = (status?: 'all' | AgendaStatusType) => {
    setAgendasStatusFilter(status ?? 'all');
    setActiveTab('agendas');
    setMobileMenuOpen(false);
  };

  const openClienteTimeline = (query: string) => {
    setClientesSearch(query);
    setActiveTab('clientes');
    setMobileMenuOpen(false);
  };

  const reviewAlertsCount =
    encaixes.filter((e) => e.needsReview).length +
    ocorrencias.filter((o) => o.needsReview).length +
    dailyAgendas.filter((a) => a.needsReview).length;

  const navItems: Array<{
    id: CentralTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }> = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, badge: reviewAlertsCount || undefined },
    { id: 'encaixes', label: 'Encaixes', icon: Zap, badge: encaixes.length },
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertCircle, badge: ocorrencias.filter((o) => o.state !== 'resolvida').length || undefined },
    { id: 'agendas', label: 'Agendas & Geografia', icon: CalendarRange },
    { id: 'clientes', label: 'Clientes & Timeline', icon: FileSearch },
    { id: 'chat', label: 'Chat Consulta', icon: MessageSquareText },
    { id: 'conexao', label: 'WhatsApp & QR Code', icon: QrCode },
  ];

  const activeNavItem = navItems.find((n) => n.id === activeTab) || navItems[0];
  const ActiveIcon = activeNavItem.icon;

  return (
    <div className="central-shell flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden bg-[#090A0F] text-[#e3e1e9] relative">
      {/* Barra compacta no Mobile + Drawer recolhível */}
      <div className="lg:hidden shrink-0 bg-[#0c0d12] border-b border-white/[0.07] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ActiveIcon className="w-4 h-4 text-[#00d2d3] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {activeNavItem.label}
            </div>
            <div className="text-[11px] text-slate-400">Central Operacional</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{mobileMenuOpen ? 'Fechar' : 'Menu'}</span>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-[57px] inset-x-0 z-40 bg-[#0c0d12]/98 backdrop-blur-xl border-b border-white/[0.1] px-4 py-3 space-y-1 shadow-2xl max-h-[calc(100vh-160px)] overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13px] cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#00d2d3]/12 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03] font-medium'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00d2d3]' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-[#00d2d3]' : 'text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-white/[0.07]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('conexao');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.07] hover:border-white/[0.14] text-left cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                {connectionStatus === 'connected' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-[13px] font-medium text-white truncate">
                  {connectionStatus === 'connected' ? 'WhatsApp conectado' : 'Conectar WhatsApp'}
                </span>
              </span>
              <span className="text-xs text-slate-400 shrink-0">
                {connectionStatus === 'connected' ? 'Ativo' : 'QR Code'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Desktop fixa */}
      <aside className="hidden lg:flex lg:w-64 shrink-0 bg-[#0c0d12] border-r border-white/[0.07] px-4 py-5 flex-col justify-between gap-6 lg:h-full lg:overflow-y-auto">
        <div className="space-y-5">
          <div className="px-2.5">
            <h1 className="text-[15px] font-semibold text-white">
              Central Operacional
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Leitura passiva de grupos
            </p>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13px] cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#00d2d3]/12 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03] font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00d2d3]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isActive ? 'text-[#00d2d3]' : 'text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé de status da conexão */}
        <button
          type="button"
          onClick={() => setActiveTab('conexao')}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.07] hover:border-white/[0.14] text-left cursor-pointer transition-colors"
        >
          {connectionStatus === 'connected' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-white truncate">
              {connectionStatus === 'connected' ? 'WhatsApp conectado' : 'Conectar WhatsApp'}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {connectionStatus === 'connected' ? connectedPhone : 'Parear QR Code'}
            </div>
          </div>
        </button>
      </aside>

      {/* Main Content Area (único scroll da tela) */}
      <main
        ref={mainScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 py-4 sm:px-8 sm:py-8"
      >
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              connectionStatus={connectionStatus}
              encaixes={encaixes}
              ocorrencias={ocorrencias}
              dailyAgendas={dailyAgendas}
              slaMinutes={config.noResponseSlaMinutes}
              onNavigateTab={setActiveTab}
              onOpenEncaixesFiltered={openEncaixesFiltered}
              onOpenOcorrenciasFiltered={openOcorrenciasFiltered}
              onOpenAgendasFiltered={openAgendasFiltered}
            />
          )}

          {activeTab === 'encaixes' && (
            <EncaixesView
              encaixes={encaixes}
              prestadores={prestadores}
              selectedEncaixeId={selectedEncaixeId}
              onSelectEncaixe={setSelectedEncaixeId}
              search={encaixesSearch}
              onSearchChange={setEncaixesSearch}
              statusFilter={encaixesStatusFilter}
              onStatusFilterChange={setEncaixesStatusFilter}
              onlyReview={encaixesOnlyReview}
              onOnlyReviewChange={setEncaixesOnlyReview}
              onUpdateEncaixeStatus={handleUpdateEncaixeStatus}
              onReassignTechnician={handleReassignTechnician}
              onSimulateNewEncaixe={handleSimulateNewEncaixe}
              onOpenClienteTimeline={openClienteTimeline}
              onCopyText={handleCopyText}
            />
          )}

          {activeTab === 'ocorrencias' && (
            <OcorrenciasView
              ocorrencias={ocorrencias}
              search={ocorrenciasSearch}
              onSearchChange={setOcorrenciasSearch}
              stateFilter={ocorrenciasStateFilter}
              onStateFilterChange={setOcorrenciasStateFilter}
              onlyReview={ocorrenciasOnlyReview}
              onOnlyReviewChange={setOcorrenciasOnlyReview}
              highlightedId={highlightedOcorrenciaId}
              onUpdateState={handleUpdateOcorrenciaState}
              onOpenClienteTimeline={openClienteTimeline}
            />
          )}

          {activeTab === 'agendas' && (
            <AgendasGeografiaView
              dailyAgendas={dailyAgendas}
              geoHierarchy={geoHierarchy}
              prestadores={prestadores}
              statusFilter={agendasStatusFilter}
              onStatusFilterChange={setAgendasStatusFilter}
              onApproveAgendaReview={handleApproveAgendaReview}
              onSimulateAgendaMessage={handleSimulateAgendaMessage}
              onCopyText={handleCopyText}
            />
          )}

          {activeTab === 'clientes' && (
            <ClientesTimelineView
              clientes={clientes}
              search={clientesSearch}
              onSearchChange={setClientesSearch}
              onOpenEncaixeByQuery={(q) =>
                openEncaixesFiltered({ search: q, status: 'all', onlyReview: false })
              }
              onOpenOcorrenciasByQuery={(q) =>
                openOcorrenciasFiltered({ search: q, state: 'all', onlyReview: false })
              }
              onCopyText={handleCopyText}
            />
          )}

          {activeTab === 'chat' && (
            <ChatConsultaView
              prestadores={prestadores}
              encaixes={encaixes}
              ocorrencias={ocorrencias}
              dailyAgendas={dailyAgendas}
              clientes={clientes}
              onOpenClienteTimeline={openClienteTimeline}
              onOpenEncaixesByQuery={(q) =>
                openEncaixesFiltered({ search: q, status: 'all', onlyReview: false })
              }
            />
          )}

          {activeTab === 'conexao' && (
            <WhatsAppConnectionView
              connectionStatus={connectionStatus}
              onChangeConnectionStatus={(st) => {
                setConnectionStatus(st);
                if (st === 'connected') showToast('WhatsApp conectado com sucesso');
                else if (st === 'disconnected') showToast('Sessão desconectada');
              }}
              instanceName={instanceName}
              onChangeInstanceName={setInstanceName}
              connectedPhone={connectedPhone}
              monitoredGroups={monitoredGroups}
              onToggleGroup={handleToggleGroup}
              rawMessages={rawMessages}
              onSimulateIncomingMessage={handleSimulateIncomingMessage}
              config={config}
              onUpdateConfig={setConfig}
            />
          )}
        </div>
      </main>

      {/* Toast discreto de confirmação */}
      {toastMessage && (
        <div className="fixed bottom-4 left-3.5 right-3.5 sm:left-auto sm:right-5 sm:bottom-5 z-50 bg-[#141822] border border-[#00d2d3]/35 text-white px-4 py-2.5 rounded-xl shadow-xl text-[13px] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00d2d3] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default CentralInteligenciaModule;
