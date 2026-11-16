import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  X,
  Copy,
  History,
  UserCheck,
  RotateCcw,
  ArrowUp,
} from 'lucide-react';
import { Prestador } from '../../prestadores_regional/types';
import { EncaixeRecord, EncaixeStatus } from '../types';

interface EncaixesViewProps {
  encaixes: EncaixeRecord[];
  prestadores: Prestador[];
  selectedEncaixeId: string | null;
  onSelectEncaixe: (id: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | EncaixeStatus;
  onStatusFilterChange: (value: 'all' | EncaixeStatus) => void;
  onlyReview: boolean;
  onOnlyReviewChange: (value: boolean) => void;
  onUpdateEncaixeStatus: (
    id: string,
    status: EncaixeStatus,
    resolvedReview?: boolean,
    refusalReason?: string
  ) => void;
  onReassignTechnician: (id: string, technicianId: string) => void;
  onSimulateNewEncaixe: (rawText: string, technicianId?: string) => void;
  onOpenClienteTimeline: (query: string) => void;
  onCopyText: (text: string, label: string) => void;
}

const STATUS_LABELS: Record<EncaixeStatus, string> = {
  recebido: 'Recebido',
  aguardando_validacao: 'Aguardando validação',
  tecnico_acionado: 'Técnico acionado',
  aceito: 'Aceito',
  recusado: 'Recusado',
  sem_resposta: 'Sem resposta',
  cancelado: 'Cancelado',
  desconhecido: 'Desconhecido',
};

const QUICK_REFUSAL_REASONS = [
  'Rota cheia no período',
  'Fora da área atendida hoje',
  'Sem janela disponível',
];

function statusTextClass(status: EncaixeStatus): string {
  switch (status) {
    case 'aceito':
      return 'text-emerald-400';
    case 'recusado':
      return 'text-rose-400';
    case 'sem_resposta':
      return 'text-amber-300';
    case 'tecnico_acionado':
    case 'recebido':
      return 'text-cyan-300';
    case 'aguardando_validacao':
      return 'text-amber-400';
    default:
      return 'text-slate-400';
  }
}

export const EncaixesView: React.FC<EncaixesViewProps> = ({
  encaixes,
  prestadores,
  selectedEncaixeId,
  onSelectEncaixe,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onlyReview,
  onOnlyReviewChange,
  onUpdateEncaixeStatus,
  onReassignTechnician,
  onSimulateNewEncaixe,
  onOpenClienteTimeline,
  onCopyText,
}) => {
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simText, setSimText] = useState(
    'Encaixe Leste 1 Tatuapé: Cliente Ricardo Nunes | Placa GHI5J67 | Corolla Preto | Tel 11 98111-2233 | NSU 884510 | Rua Coelho Lisboa, 400 CEP 03323-040. @Rafael D. Carvalho consegue hoje?'
  );
  const [simTechId, setSimTechId] = useState<string>(prestadores[0]?.id || '');
  const [refusalPromptId, setRefusalPromptId] = useState<string | null>(null);
  const [refusalReasonInput, setRefusalReasonInput] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return encaixes.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (onlyReview && !item.needsReview) return false;
      if (!q) return true;
      return (
        item.clientName.toLowerCase().includes(q) ||
        item.plate.toLowerCase().includes(q) ||
        item.nsu.toLowerCase().includes(q) ||
        item.subRegion.toLowerCase().includes(q) ||
        (item.technicianName || '').toLowerCase().includes(q) ||
        item.cep.toLowerCase().includes(q)
      );
    });
  }, [encaixes, search, statusFilter, onlyReview]);

  const activeEncaixe = useMemo(() => {
    if (selectedEncaixeId) {
      const exact = encaixes.find((e) => e.id === selectedEncaixeId);
      if (exact) return exact;
    }
    return filtered[0] || null;
  }, [encaixes, selectedEncaixeId, filtered]);

  // Limpa caixa de motivo de recusa ao trocar de encaixe
  useEffect(() => {
    setRefusalPromptId(null);
    setRefusalReasonInput('');
  }, [activeEncaixe?.id]);

  const orderedTechnicians = useMemo(() => {
    if (!activeEncaixe) return prestadores;
    const targetSub = activeEncaixe.subRegion.trim().toUpperCase();
    return [...prestadores].sort((a, b) => {
      const aMatch = a.regiao.trim().toUpperCase() === targetSub ? 0 : 1;
      const bMatch = b.regiao.trim().toUpperCase() === targetSub ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.nome.localeCompare(b.nome);
    });
  }, [prestadores, activeEncaixe]);

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== 'all' || onlyReview;

  const handleConfirmSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;
    onSimulateNewEncaixe(simText.trim(), simTechId || undefined);
    setSimModalOpen(false);
  };

  const handleCopySummary = (item: EncaixeRecord) => {
    const summary = [
      `Encaixe ${item.subRegion} (${item.sector})`,
      `Cliente: ${item.clientName} | Tel: ${item.phone || 'N/I'}`,
      `Veículo: ${item.vehicle || 'N/I'} | Placa: ${item.plate || 'N/I'} | NSU: ${item.nsu || 'N/I'}`,
      `Endereço: ${item.address} - ${item.neighborhood}, ${item.city}${item.cep ? ` (CEP ${item.cep})` : ''}`,
    ].join('\n');
    onCopyText(summary, `Resumo da placa ${item.plate || item.clientName} copiado`);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">Encaixes do Dia</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Acompanhamento passivo das solicitações recebidas, com reatribuição rápida e separação entre mensagem original e leitura.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSimModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#00d2d3] hover:bg-[#00e2e3] text-[#003731] text-[13px] font-semibold flex items-center gap-2 cursor-pointer self-start lg:self-auto whitespace-nowrap shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Simular Encaixe</span>
        </button>
      </header>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por placa, cliente, NSU, técnico ou CEP..."
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
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as 'all' | EncaixeStatus)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-[#0e1016] border border-white/[0.08] text-[13px] text-slate-200 focus:border-[#00d2d3] focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os estados ({encaixes.length})</option>
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
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
            Revisão humana ({encaixes.filter((e) => e.needsReview).length})
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onStatusFilterChange('all');
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

      {/* Layout Split com Inspetor Sticky */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Lista de Encaixes */}
        <div
          id="encaixes-list"
          className="xl:col-span-7 bg-[#0e1016] border border-white/[0.08] rounded-2xl overflow-hidden scroll-mt-4"
        >
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between gap-2 text-xs text-slate-400">
            <span>Exibindo {filtered.length} de {encaixes.length} registros</span>
            <span className="hidden sm:inline">Clique em uma linha para inspecionar</span>
            <span className="sm:hidden">Toque para inspecionar</span>
          </div>

          {/* Lista Mobile em Cards (< md) */}
          <div className="md:hidden divide-y divide-white/[0.06]">
            {filtered.length === 0 ? (
              <div className="py-10 px-4 text-center text-sm text-slate-400">
                Nenhum encaixe encontrado para os filtros aplicados.
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = activeEncaixe?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectEncaixe(item.id);
                      if (window.innerWidth < 1280) {
                        window.setTimeout(() => {
                          document
                            .getElementById('encaixe-inspector')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 40);
                      }
                    }}
                    className={`w-full text-left p-4 space-y-2 transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-500/[0.09]' : 'hover:bg-white/[0.025]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-white flex items-center gap-1.5">
                          <span className="truncate">{item.clientName}</span>
                          {item.needsReview && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                          {item.plate || 'Sem placa'} · NSU {item.nsu || 'N/I'}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium shrink-0 ${statusTextClass(item.status)}`}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                      <span className="truncate">
                        {item.subRegion} ({item.sector}) · {item.technicianName || 'Não definido'}
                      </span>
                      <span className="font-mono text-slate-400 tabular-nums shrink-0">
                        {item.responseMinutes !== undefined ? `${item.responseMinutes}m` : '—'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Tabela Desktop (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-slate-400">
                  <th className="py-3 px-4 font-medium">Cliente e Placa</th>
                  <th className="py-3 px-3 font-medium">Região</th>
                  <th className="py-3 px-3 font-medium">Técnico</th>
                  <th className="py-3 px-3 font-medium">Estado</th>
                  <th className="py-3 px-4 font-medium text-right">Resp.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-[13px]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      Nenhum encaixe encontrado para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isSelected = activeEncaixe?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          onSelectEncaixe(item.id);
                          if (window.innerWidth < 1280) {
                            window.setTimeout(() => {
                              document
                                .getElementById('encaixe-inspector')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 40);
                          }
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-cyan-500/[0.09]' : 'hover:bg-white/[0.025]'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white flex items-center gap-1.5">
                            <span className="truncate max-w-[170px]">{item.clientName}</span>
                            {item.needsReview && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                            {item.plate || 'Sem placa'} · NSU {item.nsu || 'N/I'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-200">
                          <div>{item.subRegion}</div>
                          <div className="text-xs text-slate-400">{item.sector}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-200 truncate max-w-[140px]">
                          {item.technicianName || 'Não definido'}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`font-medium ${statusTextClass(item.status)}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-slate-300">
                          {item.responseMinutes !== undefined ? `${item.responseMinutes}m` : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspetor Sticky à direita */}
        <div
          id="encaixe-inspector"
          className="xl:col-span-5 xl:sticky xl:top-2 bg-[#0e1016] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-5 scroll-mt-4"
        >
          <div className="xl:hidden flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-xs font-medium text-slate-400">Detalhes do Encaixe</span>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('encaixes-list')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Voltar à lista</span>
            </button>
          </div>
          {!activeEncaixe ? (
            <div className="py-14 text-center text-sm text-slate-400">
              Selecione um encaixe para consultar os detalhes.
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] pb-4">
                <div className="min-w-0">
                  <div className="text-xs text-slate-400 font-mono tabular-nums">
                    {activeEncaixe.plate || 'Sem placa'} · NSU {activeEncaixe.nsu || 'N/I'} ·{' '}
                    {new Date(activeEncaixe.requestedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <h3 className="text-lg font-semibold text-white mt-1 truncate">
                    {activeEncaixe.clientName}
                  </h3>
                  <p className="text-[13px] text-slate-400 mt-0.5">
                    {activeEncaixe.vehicle || 'Veículo não informado'} · {activeEncaixe.phone || 'Sem telefone'}
                  </p>
                </div>

                <span
                  className={`text-xs font-semibold whitespace-nowrap shrink-0 ${statusTextClass(
                    activeEncaixe.status
                  )}`}
                >
                  {STATUS_LABELS[activeEncaixe.status]}
                </span>
              </div>

              {/* Ações rápidas de contexto (Copiar + Timeline) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySummary(activeEncaixe)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Copiar resumo</span>
                </button>
                {activeEncaixe.plate && (
                  <button
                    type="button"
                    onClick={() => onOpenClienteTimeline(activeEncaixe.plate)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Ver timeline da placa</span>
                  </button>
                )}
              </div>

              {activeEncaixe.needsReview && (
                <div className="border border-amber-500/30 bg-amber-500/[0.06] rounded-xl px-4 py-3 text-[13px] text-amber-200 leading-relaxed">
                  <span className="font-semibold">Revisão solicitada: </span>
                  <span className="text-amber-100/90">{activeEncaixe.reviewReason}</span>
                </div>
              )}

              {/* Dados Extraídos + Reatribuição de Técnico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                <div>
                  <div className="text-xs text-slate-400">Endereço</div>
                  <div className="text-slate-100 mt-0.5 leading-snug">
                    {activeEncaixe.address}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Bairro e CEP</div>
                  <div className="text-slate-100 mt-0.5 leading-snug">
                    {activeEncaixe.neighborhood} · {activeEncaixe.city}{' '}
                    {activeEncaixe.cep && `(${activeEncaixe.cep})`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Região / Setor</div>
                  <div className="text-cyan-300 mt-0.5">
                    {activeEncaixe.region} / {activeEncaixe.subRegion} / {activeEncaixe.sector}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Técnico acionado</span>
                  </label>
                  <select
                    value={activeEncaixe.technicianId || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        onReassignTechnician(activeEncaixe.id, e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#090A0F] border border-white/[0.12] text-xs font-medium text-white focus:border-[#00d2d3] focus:outline-none cursor-pointer"
                  >
                    {!activeEncaixe.technicianId && (
                      <option value="">Selecionar técnico...</option>
                    )}
                    {orderedTechnicians.map((p) => {
                      const sameRegion =
                        p.regiao.trim().toUpperCase() ===
                        activeEncaixe.subRegion.trim().toUpperCase();
                      return (
                        <option key={p.id} value={p.id}>
                          {sameRegion ? '★ ' : ''}#{p.codigo} · {p.nome} ({p.regiao})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {activeEncaixe.refusalReason && (
                <div className="text-[13px] text-rose-300 border-l-2 border-rose-500/60 pl-3">
                  Motivo da recusa: {activeEncaixe.refusalReason}
                </div>
              )}

              {/* Mensagem Original vs Leitura Estruturada */}
              <div className="space-y-4 border-t border-white/[0.07] pt-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium text-slate-300">Mensagem original</span>
                    <span className="font-mono">{activeEncaixe.sourceMessageId}</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed border-l border-white/15 pl-3.5">
                    {activeEncaixe.originalText}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium text-slate-300">Leitura estruturada</span>
                    <span className="font-mono tabular-nums text-cyan-300">
                      Confiança {activeEncaixe.confidence}%
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    {activeEncaixe.aiInterpretation}
                  </p>
                  {activeEncaixe.duplicatePings > 0 && (
                    <p className="text-xs text-slate-400">
                      {activeEncaixe.duplicatePings} cobrança(s) repetida(s) ignorada(s) na contagem.
                    </p>
                  )}
                </div>

                <div className="pt-2 space-y-2.5">
                  <div className="text-xs font-medium text-slate-400">
                    Atualizar estado manualmente
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRefusalPromptId(null);
                        onUpdateEncaixeStatus(activeEncaixe.id, 'aceito', true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmar Aceite</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRefusalPromptId((prev) =>
                          prev === activeEncaixe.id ? null : activeEncaixe.id
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Marcar Recusado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRefusalPromptId(null);
                        onUpdateEncaixeStatus(activeEncaixe.id, 'sem_resposta', true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Sem Resposta</span>
                    </button>
                  </div>

                  {/* Motivo rápido de recusa */}
                  {refusalPromptId === activeEncaixe.id && (
                    <div className="bg-[#090A0F] border border-rose-500/30 rounded-xl p-3.5 space-y-2.5">
                      <div className="text-xs font-medium text-rose-200">
                        Informe o motivo da recusa (opcional):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_REFUSAL_REASONS.map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => setRefusalReasonInput(reason)}
                            className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                              refusalReasonInput === reason
                                ? 'bg-rose-500/25 text-rose-100'
                                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'
                            }`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={refusalReasonInput}
                          onChange={(e) => setRefusalReasonInput(e.target.value)}
                          placeholder="Outro motivo..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#0e1016] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateEncaixeStatus(
                              activeEncaixe.id,
                              'recusado',
                              true,
                              refusalReasonInput.trim() || undefined
                            );
                            setRefusalPromptId(null);
                            setRefusalReasonInput('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold cursor-pointer transition-colors shrink-0"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico */}
              {activeEncaixe.events.length > 0 && (
                <div className="border-t border-white/[0.07] pt-4 space-y-2.5">
                  <div className="text-xs font-medium text-slate-400">Histórico do registro</div>
                  <div className="space-y-2.5">
                    {activeEncaixe.events.map((ev) => (
                      <div key={ev.id} className="flex items-start justify-between gap-3 text-[13px]">
                        <div>
                          <div className="text-slate-100">{ev.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {ev.actor}
                            {ev.previousValue && ev.newValue
                              ? ` · ${ev.previousValue} → ${ev.newValue}`
                              : ''}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0">
                          {new Date(ev.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Simulação */}
      {simModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmSimulation}
            className="w-full max-w-lg bg-[#0e1016] border border-white/15 rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <h3 className="text-base font-semibold text-white">Simular Mensagem de Encaixe</h3>
              <button
                type="button"
                onClick={() => setSimModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Texto recebido no grupo
                </label>
                <textarea
                  rows={4}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090A0F] border border-white/[0.1] text-white leading-relaxed focus:border-[#00d2d3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Técnico acionado
                </label>
                <select
                  value={simTechId}
                  onChange={(e) => setSimTechId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090A0F] border border-white/[0.1] text-white focus:border-[#00d2d3] focus:outline-none"
                >
                  {prestadores.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.codigo} · {p.nome} ({p.regiao})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSimModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-[13px] font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#00d2d3] hover:bg-[#00e2e3] text-[#003731] text-[13px] font-semibold cursor-pointer"
              >
                Registrar Encaixe
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
