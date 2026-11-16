import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  History,
  RotateCcw,
  X,
} from 'lucide-react';
import { OcorrenciaCategory, OcorrenciaRecord, OcorrenciaState } from '../types';

interface OcorrenciasViewProps {
  ocorrencias: OcorrenciaRecord[];
  search: string;
  onSearchChange: (value: string) => void;
  stateFilter: 'all' | OcorrenciaState;
  onStateFilterChange: (value: 'all' | OcorrenciaState) => void;
  onlyReview: boolean;
  onOnlyReviewChange: (value: boolean) => void;
  highlightedId: string | null;
  onUpdateState: (
    id: string,
    nextState: OcorrenciaState,
    markReviewed?: boolean,
    note?: string
  ) => void;
  onOpenClienteTimeline: (query: string) => void;
}

const CATEGORY_LABELS: Record<OcorrenciaCategory, string> = {
  cliente_nao_atende: 'Cliente não atende',
  cliente_ausente: 'Cliente ausente',
  endereco_incorreto: 'Endereço incorreto ou incompleto',
  regiao_incorreta: 'Região incorreta',
  reagendamento: 'Solicitação de reagendamento',
  cancelamento: 'Cancelamento',
  ajuda_suporte: 'Solicitação de suporte',
  problema_placa_os: 'Problema de placa, OS ou documento',
  chegada_local: 'Chegada ao local',
  atendimento_concluido: 'Atendimento concluído',
  tentativa_contato: 'Tentativa de contato da equipe',
  orientacao_equipe: 'Orientação ou autorização',
  retorno_solicitado: 'Retorno solicitado',
  nao_classificada: 'Não classificada',
};

const STATE_LABELS: Record<OcorrenciaState, string> = {
  identificada: 'Identificada',
  em_acompanhamento: 'Em acompanhamento',
  aguardando_cliente: 'Aguardando cliente',
  aguardando_equipe: 'Aguardando equipe',
  aguardando_tecnico: 'Aguardando técnico',
  resolvida: 'Resolvida (com evidência)',
  sem_desfecho: 'Sem desfecho identificado',
  necessita_revisao: 'Necessita revisão',
};

function priorityWeight(item: OcorrenciaRecord): number {
  if (item.state === 'resolvida') return 5;
  if (item.needsReview || item.state === 'necessita_revisao') return 0;
  if (item.state === 'sem_desfecho') return 1;
  if (item.state === 'aguardando_cliente' || item.state === 'aguardando_tecnico') return 2;
  return 3;
}

export const OcorrenciasView: React.FC<OcorrenciasViewProps> = ({
  ocorrencias,
  search,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  onlyReview,
  onOnlyReviewChange,
  highlightedId,
  onUpdateState,
  onOpenClienteTimeline,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | OcorrenciaCategory>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'recent'>('priority');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (highlightedId) {
      setExpandedIds((prev) => ({ ...prev, [highlightedId]: true }));
    }
  }, [highlightedId]);

  const availableCategories = useMemo(() => {
    const set = new Set<OcorrenciaCategory>();
    ocorrencias.forEach((o) => set.add(o.category));
    return Array.from(set);
  }, [ocorrencias]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = ocorrencias.filter((o) => {
      if (stateFilter !== 'all' && o.state !== stateFilter) return false;
      if (categoryFilter !== 'all' && o.category !== categoryFilter) return false;
      if (onlyReview && !o.needsReview) return false;
      if (!q) return true;
      return (
        o.summary.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.plate.toLowerCase().includes(q) ||
        o.nsu.toLowerCase().includes(q) ||
        (o.technicianName || '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (highlightedId) {
        if (a.id === highlightedId) return -1;
        if (b.id === highlightedId) return 1;
      }
      if (sortBy === 'priority') {
        const diff = priorityWeight(a) - priorityWeight(b);
        if (diff !== 0) return diff;
        if (b.silenceHours !== a.silenceHours) return b.silenceHours - a.silenceHours;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [ocorrencias, search, stateFilter, categoryFilter, onlyReview, sortBy, highlightedId]);

  const toggleEvidence = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    stateFilter !== 'all' ||
    categoryFilter !== 'all' ||
    onlyReview;

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">Ocorrências de Campo</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Ordenadas por criticidade: itens para revisão e sem desfecho com maior silêncio aparecem no topo.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0e1016] border border-white/[0.08] rounded-xl self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setSortBy('priority')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              sortBy === 'priority'
                ? 'bg-[#00d2d3] text-[#003731] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Prioridade
          </button>
          <button
            type="button"
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              sortBy === 'recent'
                ? 'bg-[#00d2d3] text-[#003731] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Mais recentes
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filtrar por técnico, placa, NSU ou cliente..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#0e1016] border border-white/[0.08] text-[13px] text-white placeholder-slate-500 focus:border-[#00d2d3] focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | OcorrenciaCategory)
            }
            className="px-3.5 py-2.5 rounded-xl bg-[#0e1016] border border-white/[0.08] text-[13px] text-slate-200 focus:border-[#00d2d3] focus:outline-none cursor-pointer"
          >
            <option value="all">Todas categorias</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          <select
            value={stateFilter}
            onChange={(e) => onStateFilterChange(e.target.value as 'all' | OcorrenciaState)}
            className="px-3.5 py-2.5 rounded-xl bg-[#0e1016] border border-white/[0.08] text-[13px] text-slate-200 focus:border-[#00d2d3] focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os estados ({ocorrencias.length})</option>
            {Object.entries(STATE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onOnlyReviewChange(!onlyReview)}
            className={`px-3.5 py-2.5 rounded-xl text-[13px] font-medium border cursor-pointer transition-colors whitespace-nowrap ${
              onlyReview
                ? 'bg-amber-500/15 text-amber-200 border-amber-500/40'
                : 'bg-[#0e1016] text-slate-300 border-white/[0.08] hover:bg-white/[0.04]'
            }`}
          >
            Revisão humana ({ocorrencias.filter((o) => o.needsReview).length})
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onStateFilterChange('all');
                setCategoryFilter('all');
                onOnlyReviewChange(false);
              }}
              className="px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista Unificada */}
      <section className="bg-[#0e1016] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Nenhuma ocorrência corresponde aos filtros aplicados.
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = !!expandedIds[item.id];
            const isHighlighted = highlightedId === item.id;
            const isResolving = resolvingId === item.id;
            return (
              <article
                key={item.id}
                className={`p-6 space-y-3.5 transition-colors ${
                  isHighlighted ? 'bg-cyan-500/[0.05]' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
                    <span className="font-semibold text-white text-sm">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-cyan-300 font-medium">
                      {item.technicianName || 'Técnico não identificado'}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      Placa {item.plate} · NSU {item.nsu}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums shrink-0">
                    <span className="text-slate-400">
                      Confiança {item.confidence}%
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span
                      className={
                        item.state === 'resolvida'
                          ? 'text-emerald-400 font-semibold'
                          : item.state === 'necessita_revisao' || item.needsReview
                          ? 'text-amber-300 font-semibold'
                          : item.state === 'sem_desfecho'
                          ? 'text-rose-300 font-semibold'
                          : 'text-cyan-300 font-semibold'
                      }
                    >
                      {STATE_LABELS[item.state]}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed max-w-4xl">
                  {item.summary}
                </p>

                {item.state === 'sem_desfecho' && (
                  <p className="text-[13px] text-amber-300/90 flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      Sem novas mensagens há {item.silenceHours}h — mantido aberto até haver confirmação explícita.
                    </span>
                  </p>
                )}

                {item.needsReview && (
                  <p className="text-[13px] text-amber-300/90">
                    Revisão sugerida: {item.aiInterpretation}
                  </p>
                )}

                {isExpanded && (
                  <div className="border-l border-white/15 pl-4 py-1 space-y-1">
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      {item.authorName} ·{' '}
                      {new Date(item.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {item.sourceMessageId}
                    </div>
                    <p className="text-[13px] text-slate-200 leading-relaxed">
                      {item.originalText}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span>Cliente: {item.clientName}</span>
                    <button
                      type="button"
                      onClick={() => toggleEvidence(item.id)}
                      className="text-cyan-300 hover:text-cyan-200 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{isExpanded ? 'Ocultar mensagem' : 'Ver mensagem original'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {item.plate && !item.plate.includes('CONFIRMAR') && (
                      <button
                        type="button"
                        onClick={() => onOpenClienteTimeline(item.plate)}
                        className="text-slate-300 hover:text-white font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Timeline</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.state !== 'em_acompanhamento' && item.state !== 'resolvida' && (
                      <button
                        type="button"
                        onClick={() => onUpdateState(item.id, 'em_acompanhamento', true)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 cursor-pointer transition-colors"
                      >
                        Acompanhar
                      </button>
                    )}
                    {item.state !== 'resolvida' && (
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingId((prev) => (prev === item.id ? null : item.id));
                          setResolutionNote('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmar Resolução</span>
                      </button>
                    )}
                    {!item.needsReview && item.state !== 'resolvida' && (
                      <button
                        type="button"
                        onClick={() => onUpdateState(item.id, 'necessita_revisao', false)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Solicitar Revisão</span>
                      </button>
                    )}
                  </div>
                </div>

                {isResolving && (
                  <div className="bg-[#090A0F] border border-emerald-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="text"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Nota breve de encerramento (opcional, ex.: cliente liberou acesso)..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#0e1016] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setResolvingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateState(
                            item.id,
                            'resolvida',
                            true,
                            resolutionNote.trim() || undefined
                          );
                          setResolvingId(null);
                          setResolutionNote('');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#003731] text-xs font-semibold cursor-pointer"
                      >
                        Encerrar Ocorrência
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
