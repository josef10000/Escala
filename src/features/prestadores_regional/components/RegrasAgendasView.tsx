import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Navigation,
  DollarSign,
  ShieldAlert,
  Edit2,
  Trash2,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { PontoFixoItem, AgendaRegiaoItem, RegraOperacionalItem } from '../types';
import { PontoFixoModal } from './PontoFixoModal';
import { AgendaRegionalModal } from './AgendaRegionalModal';
import { RegraOperacionalModal } from './RegraOperacionalModal';
import { PontoFixoStatusBadge } from './PontoFixoStatusBadge';
import { CepConsultationWidget } from './CepConsultationWidget';

interface RegrasAgendasViewProps {
  pontosFixos: PontoFixoItem[];
  agendas: AgendaRegiaoItem[];
  regras: RegraOperacionalItem[];
  onSavePontoFixo: (item: PontoFixoItem) => void;
  onDeletePontoFixo: (id: string) => void;
  onSaveAgenda: (item: AgendaRegiaoItem) => void;
  onDeleteAgenda: (id: string) => void;
  onSaveRegra: (item: RegraOperacionalItem) => void;
  onDeleteRegra: (id: string) => void;
  onResetDefaults: () => void;
  onCopySuccess: (msg: string) => void;
  onNavigateToTemplates?: () => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (q: string) => void;
}

type TabFilter = 'todos' | 'localizador_cep' | 'pontos_fixos' | 'isencao_km' | 'agendas' | 'regras';

const DIAS_SEMANA = [
  { id: 0, label: 'Domingo', abbrev: 'Dom', desc: 'Taxa +R$10 (Sem encaixe/fixo)' },
  { id: 1, label: 'Segunda-feira', abbrev: 'Seg', desc: 'Litoral Norte (SJC)' },
  { id: 2, label: 'Terça-feira', abbrev: 'Ter', desc: 'Rotas regulares' },
  { id: 3, label: 'Quarta-feira', abbrev: 'Qua', desc: 'Guarujá, Atibaia & SJC Isento KM' },
  { id: 4, label: 'Quinta-feira', abbrev: 'Qui', desc: 'Ilhabela & Litoral Norte Isento KM' },
  { id: 5, label: 'Sexta-feira', abbrev: 'Sex', desc: 'Rotas regulares' },
  { id: 6, label: 'Sábado', abbrev: 'Sáb', desc: 'Guarujá, Atibaia & rotas matutinas' },
];

export const RegrasAgendasView: React.FC<RegrasAgendasViewProps> = ({
  pontosFixos,
  agendas,
  regras,
  onSavePontoFixo,
  onDeletePontoFixo,
  onSaveAgenda,
  onDeleteAgenda,
  onSaveRegra,
  onDeleteRegra,
  onResetDefaults,
  onCopySuccess,
  onNavigateToTemplates,
  globalSearchQuery = '',
  onGlobalSearchChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabFilter>('todos');
  const [localSearch, setLocalSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals for CRUD
  const [isPfModalOpen, setIsPfModalOpen] = useState(false);
  const [editingPf, setEditingPf] = useState<PontoFixoItem | null>(null);

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<AgendaRegiaoItem | null>(null);

  const [isRegraModalOpen, setIsRegraModalOpen] = useState(false);
  const [editingRegra, setEditingRegra] = useState<RegraOperacionalItem | null>(null);

  // Search query combination
  const searchQuery = globalSearchQuery || localSearch;
  const setSearchQuery = (val: string) => {
    if (onGlobalSearchChange) {
      onGlobalSearchChange(val);
    } else {
      setLocalSearch(val);
    }
  };

  // Current system day-of-week (0=Dom, 1=Seg, ..., 6=Sáb)
  const currentDayOfWeek = new Date().getDay();
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null);

  const handleCopy = (id: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onCopySuccess(`Copiado: ${label}`);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  // Filter Agendas
  const filteredAgendas = useMemo(() => {
    return agendas.filter((item) => {
      if (selectedDayFilter !== null) {
        if (!item.diasSemanaIds.includes(selectedDayFilter)) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inRegiao = item.regiao.toLowerCase().includes(q);
      const inDias = item.diasAtendimento.toLowerCase().includes(q);
      const inObs = item.observacoes.toLowerCase().includes(q);
      const inCidades = item.cidades?.some((c) => c.toLowerCase().includes(q)) ?? false;
      const inIsencao = item.isencaoKm?.regra.toLowerCase().includes(q) ?? false;

      return inRegiao || inDias || inObs || inCidades || inIsencao;
    });
  }, [agendas, searchQuery, selectedDayFilter]);

  // Filter Pontos Fixos
  const filteredPontosFixos = useMemo(() => {
    if (!searchQuery.trim()) return pontosFixos;
    const q = searchQuery.toLowerCase();
    return pontosFixos.filter((pf) => {
      return (
        pf.nome.toLowerCase().includes(q) ||
        pf.subtitulo.toLowerCase().includes(q) ||
        pf.endereco.toLowerCase().includes(q) ||
        pf.cep.toLowerCase().includes(q) ||
        pf.referencia.toLowerCase().includes(q) ||
        pf.horarioSemana.toLowerCase().includes(q) ||
        pf.horarioSabado.toLowerCase().includes(q)
      );
    });
  }, [pontosFixos, searchQuery]);

  // Filter Regras
  const filteredRegras = useMemo(() => {
    if (!searchQuery.trim()) return regras;
    const q = searchQuery.toLowerCase();
    return regras.filter((r) => {
      return (
        r.titulo.toLowerCase().includes(q) ||
        r.subtitulo.toLowerCase().includes(q) ||
        r.itens.some((i) => i.toLowerCase().includes(q)) ||
        (r.alerta && r.alerta.toLowerCase().includes(q)) ||
        (r.textoCopiaAtendente && r.textoCopiaAtendente.toLowerCase().includes(q))
      );
    });
  }, [regras, searchQuery]);

  const todayInfo = DIAS_SEMANA[currentDayOfWeek];

  return (
    <div className="space-y-4">
      {/* Overview & Quick KPIs */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0e1424]/75 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.55)] p-4 sm:p-5 group">
        {/* Specular top highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Regras Operacionais, Agendas & Pontos Fixos</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Consulte roteiros de atendimento, isenções de KM, pontos fixos e diretrizes de agendamento do OPA.
            </p>
          </div>

          {/* Today Info Card - Frosted Pill */}
          <div className="bg-[#080d18]/80 backdrop-blur-md border border-white/10 shadow-inner rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/25 to-indigo-500/25 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-sm shadow-blue-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Hoje no sistema</div>
              <div className="text-xs font-bold text-white">{todayInfo.label}</div>
              <div className="text-xs text-cyan-300 font-medium">{todayInfo.desc}</div>
            </div>
          </div>
        </div>

        {/* Quick Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-white/10 text-xs">
          <div className="bg-[#080d18]/70 backdrop-blur-md border border-white/10 hover:border-blue-500/30 rounded-xl p-3 shadow-inner hover:-translate-y-0.5 transition-all">
            <span className="text-slate-400 text-[11px] uppercase font-mono tracking-wider block">Horário Fixo</span>
            <strong className="text-white font-semibold text-xs sm:text-sm">R$ 100,00 contratado</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">08h, 12h ou 18h apenas</span>
          </div>

          <div className="bg-[#080d18]/70 backdrop-blur-md border border-white/10 hover:border-amber-500/30 rounded-xl p-3 shadow-inner hover:-translate-y-0.5 transition-all">
            <span className="text-slate-400 text-[11px] uppercase font-mono tracking-wider block">Domingos e Feriados</span>
            <strong className="text-amber-300 font-semibold text-xs sm:text-sm">+R$ 10,00 por serviço</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Sem encaixes / Sem horário fixo</span>
          </div>

          <div className="bg-[#080d18]/70 backdrop-blur-md border border-white/10 hover:border-emerald-500/30 rounded-xl p-3 shadow-inner hover:-translate-y-0.5 transition-all">
            <span className="text-slate-400 text-[11px] uppercase font-mono tracking-wider block">Isenção KM SJC</span>
            <strong className="text-emerald-400 font-semibold text-xs sm:text-sm">Quarta-feira (Fora Mapa)</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Outros dias cobra KM</span>
          </div>

          <div className="bg-[#080d18]/70 backdrop-blur-md border border-white/10 hover:border-emerald-500/30 rounded-xl p-3 shadow-inner hover:-translate-y-0.5 transition-all">
            <span className="text-slate-400 text-[11px] uppercase font-mono tracking-wider block">Isenção KM Litoral N.</span>
            <strong className="text-emerald-400 font-semibold text-xs sm:text-sm">Quinta-feira (Fora Mapa)</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Agenda de SJC integrada</span>
          </div>
        </div>
      </div>

      {/* Unified Toolbar for Regras & Agendas */}
      <div className="relative overflow-hidden bg-[#0e1424]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3 shadow-xl">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Main Segmented Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'todos', label: 'Todos os Módulos' },
              { id: 'localizador_cep', label: '🧭 Consultar CEP do Cliente' },
              { id: 'pontos_fixos', label: `Pontos Fixos (${pontosFixos.length})` },
              { id: 'isencao_km', label: 'Isenção de KM' },
              { id: 'agendas', label: `Agendas (${agendas.length})` },
              { id: 'regras', label: `Regras Operacionais (${regras.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border-t border-white/25 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Management Buttons: Add & Reset */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'pontos_fixos') {
                  setEditingPf(null);
                  setIsPfModalOpen(true);
                } else if (activeTab === 'agendas' || activeTab === 'isencao_km') {
                  setEditingAgenda(null);
                  setIsAgendaModalOpen(true);
                } else if (activeTab === 'regras') {
                  setEditingRegra(null);
                  setIsRegraModalOpen(true);
                } else {
                  setEditingPf(null);
                  setIsPfModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border-t border-white/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {activeTab === 'pontos_fixos'
                  ? 'Novo Ponto'
                  : activeTab === 'regras'
                  ? 'Nova Regra'
                  : activeTab === 'agendas' || activeTab === 'isencao_km'
                  ? 'Nova Agenda'
                  : 'Adicionar Item'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja restaurar todas as regras operacionais, agendas e pontos fixos para os valores padrão de fábrica?')) {
                  onResetDefaults();
                }
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 shadow-xs hover:border-white/20 transition-all active:scale-95"
              title="Restaurar valores padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Day of Week Filter */}
        {(activeTab === 'todos' || activeTab === 'agendas') && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-white/10 text-xs">
            <span className="text-slate-400 text-xs font-medium mr-1">Filtrar dia:</span>
            <button
              type="button"
              onClick={() => setSelectedDayFilter(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedDayFilter === null
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs border-t border-white/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Todos os dias
            </button>
            <button
              type="button"
              onClick={() => setSelectedDayFilter(currentDayOfWeek)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedDayFilter === currentDayOfWeek
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs border-t border-white/25'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              Hoje ({todayInfo.abbrev})
            </button>
            {DIAS_SEMANA.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDayFilter(d.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedDayFilter === d.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs border-t border-white/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {d.abbrev}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LOCALIZADOR RÁPIDO DE BASE POR CEP DO CLIENTE & ALERTAS DE KM */}
      {(activeTab === 'todos' ||
        activeTab === 'localizador_cep' ||
        activeTab === 'pontos_fixos' ||
        activeTab === 'isencao_km') && (
        <section className="space-y-2">
          <CepConsultationWidget
            pontosFixos={pontosFixos}
            onCopySuccess={onCopySuccess}
            defaultExpanded={activeTab === 'localizador_cep' || activeTab === 'todos'}
          />
        </section>
      )}

      {/* SECTION 1: PONTOS FIXOS */}
      {(activeTab === 'todos' || activeTab === 'pontos_fixos') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">Pontos Fixos de Atendimento</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              {filteredPontosFixos.length} bases ativas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredPontosFixos.map((pf) => {
              const fullAddressCopyText = `*PONTO FIXO DR. MONITORA®*\n📍 *Base:* ${pf.nome}\n🏢 *Endereço:* ${pf.endereco}\n📬 *CEP:* ${pf.cep}\n🔎 *Referência:* ${pf.referencia}\n🕒 *Horário Segunda a Sexta:* ${pf.horarioSemana}\n🕒 *Sábado:* ${pf.horarioSabado}\n⚠️ *Feriados:* ${pf.horarioFeriados}`;

              return (
                <div
                  key={pf.id}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141b2b]/95 via-[#101623]/95 to-[#0c101a]/95 backdrop-blur-xl border border-white/10 border-t-slate-700/80 hover:border-t-sky-400/50 hover:border-white/20 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.65)] hover:shadow-[0_22px_45px_-10px_rgba(0,0,0,0.9)] group"
                >
                  {/* Top Specular Line */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 border border-white/15 shadow-sm text-xs font-bold flex items-center justify-center shrink-0">
                          {pf.numero}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight group-hover:text-sky-300 transition-colors">
                            {pf.nome}
                          </h4>
                          <span className="text-xs text-slate-400">{pf.subtitulo}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPf(pf);
                            setIsPfModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors"
                          title="Editar ponto fixo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Deseja excluir o ponto fixo "${pf.nome}"?`)) {
                              onDeletePontoFixo(pf.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          title="Excluir ponto fixo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Real-time Open/Closed Live Status Badge */}
                    <div className="pt-0.5">
                      <PontoFixoStatusBadge pontoFixo={pf} size="md" />
                    </div>

                    {/* Address & Hours Inset Box */}
                    <div className="bg-[#070b14]/80 backdrop-blur-md border border-white/5 rounded-xl p-3.5 space-y-2 text-xs shadow-inner">
                      <div>
                        <span className="text-slate-400 text-[11px] uppercase font-mono tracking-wider block">
                          Endereço Completo
                        </span>
                        <p className="text-slate-200 font-medium mt-0.5">{pf.endereco}</p>
                        
                        {/* CEP Highlight Box with Instant 1-Click Copy */}
                        <div className="mt-2.5 flex items-center justify-between gap-2 bg-[#0c1424]/90 border border-sky-500/25 hover:border-sky-500/40 rounded-xl px-2.5 py-1.5 transition-all shadow-inner">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-slate-400 text-xs font-mono">📬 CEP:</span>
                            <span className="text-sky-300 font-mono font-bold text-xs tracking-wider select-all">
                              {pf.cep}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(`pf-cep-${pf.id}`, pf.cep, `CEP ${pf.cep}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all active:scale-95 shrink-0 shadow-xs"
                            title="Copiar apenas o CEP"
                          >
                            {copiedId === `pf-cep-${pf.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-sky-400" />
                                <span>Copiar CEP</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <span className="text-slate-400 text-[11px] uppercase font-mono tracking-wider block">
                          Referência
                        </span>
                        <p className="text-slate-300 text-xs mt-0.5">{pf.referencia}</p>
                      </div>

                      <div className="pt-2 border-t border-white/5 space-y-1">
                        <span className="text-slate-400 text-[11px] uppercase font-mono tracking-wider block">
                          Funcionamento
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{pf.horarioSemana}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{pf.horarioSabado}</span>
                        </div>
                        <div className="text-xs text-rose-400 font-semibold pt-0.5">
                          {pf.horarioFeriados}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3.5 mt-3.5 border-t border-white/10 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `pf-cep-btn-${pf.id}`,
                            pf.cep,
                            `CEP ${pf.cep}`
                          )
                        }
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition-all active:scale-95 shadow-xs"
                        title="Copiar apenas o CEP para rastreio / GPS"
                      >
                        {copiedId === `pf-cep-btn-${pf.id}` || copiedId === `pf-cep-${pf.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">CEP Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-sky-400" />
                            <span>Copiar CEP</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `pf-full-${pf.id}`,
                            fullAddressCopyText,
                            `Endereço completo de ${pf.nome}`
                          )
                        }
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 border-t-white/30 shadow-md transition-all active:scale-95"
                      >
                        {copiedId === `pf-full-${pf.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            <span>Copiar Endereço</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {pf.mapsQuery && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            pf.mapsQuery
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                        >
                          <Navigation className="w-3 h-3 text-sky-400" />
                          <span>Google Maps</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </a>
                      )}

                      {pf.wazeQuery && (
                        <a
                          href={pf.wazeQuery}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                        >
                          <Navigation className="w-3 h-3 text-cyan-400" />
                          <span>Waze</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: ISENÇÃO DE KM */}
      {(activeTab === 'todos' || activeTab === 'isencao_km') && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0f1d2d]/90 via-[#0c1724]/90 to-[#08101a]/90 backdrop-blur-xl border border-emerald-500/25 shadow-[0_12px_32px_rgba(0,0,0,0.6)] p-5 space-y-4 group">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Instalação Sem Custo de KM – Fora do Mapa
                </h3>
                <p className="text-xs text-slate-300">
                  Dias com isenção total de cobrança de quilometragem para o cliente
                </p>
              </div>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs self-start sm:self-auto">
              ✓ Isenção de KM Ativa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Card 1: São José dos Campos */}
            <div className="relative overflow-hidden rounded-xl bg-[#070d18]/80 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 p-4 space-y-3 shadow-inner hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  São José dos Campos (SJC)
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Quartas-feiras
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Na área <strong>Fora do Mapa de São José dos Campos</strong>, NÃO há taxa de KM quando o agendamento ocorrer às <strong>quartas-feiras</strong>.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Em outros dias da semana haverá cobrança regular de KM adicional.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'km-sjc',
                    'Aproveite a isenção de taxa de KM fora do mapa: na região de São José dos Campos a isenção ocorre às quartas-feiras! Agendando para quarta-feira você economiza o custo de deslocamento.',
                    'Regra Isenção KM SJC'
                  )
                }
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-emerald-300 border border-white/15 border-t-white/25 shadow-sm transition-all active:scale-95"
              >
                {copiedId === 'km-sjc' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiar Explicação (SJC)</span>
                  </>
                )}
              </button>
            </div>

            {/* Card 2: Litoral Norte */}
            <div className="relative overflow-hidden rounded-xl bg-[#070d18]/80 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 p-4 space-y-3 shadow-inner hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Litoral Norte (Acima de Bertioga)
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Quintas-feiras
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  No <strong>Litoral Norte (acima de Bertioga)</strong> dentro da agenda de SJC, o cliente fica <strong>100% isento de taxa de KM</strong> às <strong>quintas-feiras</strong>.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Em outros dias da semana haverá cobrança regular de KM adicional.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'km-litoral',
                    'Para a região do Litoral Norte (acima de Bertioga), o agendamento às quintas-feiras possui isenção total da taxa de quilometragem (KM fora do mapa)!',
                    'Regra Isenção KM Litoral Norte'
                  )
                }
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-emerald-300 border border-white/15 border-t-white/25 shadow-sm transition-all active:scale-95"
              >
                {copiedId === 'km-litoral' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiar Explicação (Litoral Norte)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: AGENDAS REGIONAIS */}
      {(activeTab === 'todos' || activeTab === 'agendas') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Regiões de Atendimentos & Agendas DR
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              {filteredAgendas.length} de {agendas.length} regiões
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgendas.map((item) => {
              const isToday = item.diasSemanaIds.includes(currentDayOfWeek);

              return (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141b2b]/95 via-[#101623]/95 to-[#0c101a]/95 backdrop-blur-xl border border-white/10 border-t-slate-700/80 hover:border-t-indigo-400/50 hover:border-white/20 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.65)] hover:shadow-[0_22px_45px_-10px_rgba(0,0,0,0.9)] group"
                >
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors">
                            {item.regiao}
                          </h4>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-xs">
                              Atende Hoje
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-200">{item.diasAtendimento}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAgenda(item);
                            setIsAgendaModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors"
                          title="Editar agenda regional"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Deseja excluir a agenda da região "${item.regiao}"?`)) {
                              onDeleteAgenda(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          title="Excluir agenda regional"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {item.semHorarioFixo && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#070b14]/80 border border-white/10 text-slate-400 font-mono text-[11px]">
                          Sem Horário Fixo
                        </span>
                      )}
                      {item.isencaoKm && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-semibold text-[11px]">
                          {item.isencaoKm.dia} Isento KM
                        </span>
                      )}
                    </div>

                    {/* Covered Cities */}
                    {item.cidades && item.cidades.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider block">
                          Cidades / Bairros Atendidos:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.cidades.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-md bg-[#070b14]/80 border border-white/5 text-[11px] text-slate-300"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 leading-relaxed pt-2.5 border-t border-white/5">
                      {item.observacoes}
                    </p>
                  </div>

                  <div className="pt-3.5 mt-3.5 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `agenda-${item.id}`,
                          `*AGENDA DE ATENDIMENTO - ${item.regiao.toUpperCase()}*\n📅 *Dias de atendimento:* ${item.diasAtendimento}\n🕒 *Horário:* Comercial (sem horário fixo, conforme rota do técnico)\n📌 *Observações:* ${item.observacoes}`,
                          `Agenda de ${item.regiao}`
                        )
                      }
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 border-t-white/30 shadow-sm transition-all active:scale-95"
                    >
                      {copiedId === `agenda-${item.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copiar Agenda</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 4: REGRAS OPERACIONAIS CRÍTICAS */}
      {(activeTab === 'todos' || activeTab === 'regras') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Diretrizes Operacionais do OPA
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              {filteredRegras.length} diretrizes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRegras.map((regra) => {
              return (
                <div
                  key={regra.id}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141b2b]/95 via-[#101623]/95 to-[#0c101a]/95 backdrop-blur-xl border border-white/10 border-t-slate-700/80 hover:border-t-amber-400/50 hover:border-white/20 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.65)] hover:shadow-[0_22px_45px_-10px_rgba(0,0,0,0.9)] group"
                >
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight group-hover:text-amber-300 transition-colors">
                          {regra.titulo}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">{regra.subtitulo}</p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRegra(regra);
                            setIsRegraModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors"
                          title="Editar regra"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Deseja excluir a regra "${regra.titulo}"?`)) {
                              onDeleteRegra(regra.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          title="Excluir regra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Alert Banner if present */}
                    {regra.alerta && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex items-start gap-2 shadow-inner">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{regra.alerta}</span>
                      </div>
                    )}

                    {/* Item list */}
                    <ul className="space-y-2 text-xs text-slate-300">
                      {regra.itens.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0 shadow-xs shadow-blue-400" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Copy Action if available */}
                  {regra.textoCopiaAtendente && (
                    <div className="pt-3.5 mt-3.5 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `regra-copy-${regra.id}`,
                            regra.textoCopiaAtendente!,
                            regra.titulo
                          )
                        }
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 border-t-white/30 shadow-sm transition-all active:scale-95"
                      >
                        {copiedId === `regra-copy-${regra.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Texto Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copiar Texto Explicativo</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modals for CRUD operations */}
      <PontoFixoModal
        isOpen={isPfModalOpen}
        onClose={() => {
          setIsPfModalOpen(false);
          setEditingPf(null);
        }}
        onSave={onSavePontoFixo}
        editingItem={editingPf}
        totalItems={pontosFixos.length}
      />

      <AgendaRegionalModal
        isOpen={isAgendaModalOpen}
        onClose={() => {
          setIsAgendaModalOpen(false);
          setEditingAgenda(null);
        }}
        onSave={onSaveAgenda}
        editingItem={editingAgenda}
      />

      <RegraOperacionalModal
        isOpen={isRegraModalOpen}
        onClose={() => {
          setIsRegraModalOpen(false);
          setEditingRegra(null);
        }}
        onSave={onSaveRegra}
        editingItem={editingRegra}
      />
    </div>
  );
};
