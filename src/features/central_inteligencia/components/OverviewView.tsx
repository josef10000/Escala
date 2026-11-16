import React, { useState } from 'react';
import { ArrowRight, WifiOff, MessageSquare, ChevronUp, ArrowUpRight } from 'lucide-react';
import {
  AgendaStatusType,
  CentralTab,
  DailyAgendaEntry,
  EncaixeRecord,
  EncaixeStatus,
  OcorrenciaRecord,
  OcorrenciaState,
  WhatsAppConnectionStatus,
} from '../types';

interface OverviewViewProps {
  connectionStatus: WhatsAppConnectionStatus;
  encaixes: EncaixeRecord[];
  ocorrencias: OcorrenciaRecord[];
  dailyAgendas: DailyAgendaEntry[];
  slaMinutes: number;
  onNavigateTab: (tab: CentralTab) => void;
  onOpenEncaixesFiltered: (opts: {
    status?: 'all' | EncaixeStatus;
    onlyReview?: boolean;
    encaixeId?: string;
    search?: string;
  }) => void;
  onOpenOcorrenciasFiltered: (opts: {
    state?: 'all' | OcorrenciaState;
    onlyReview?: boolean;
    highlightId?: string;
    search?: string;
  }) => void;
  onOpenAgendasFiltered: (status?: 'all' | AgendaStatusType) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  connectionStatus,
  encaixes,
  ocorrencias,
  dailyAgendas,
  slaMinutes,
  onNavigateTab,
  onOpenEncaixesFiltered,
  onOpenOcorrenciasFiltered,
  onOpenAgendasFiltered,
}) => {
  const [bannerMinimized, setBannerMinimized] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEncaixes = encaixes.filter(
    (e) => e.desiredDate === todayStr && e.status !== 'cancelado'
  );

  const aceites = todayEncaixes.filter((e) => e.status === 'aceito').length;
  const recusas = todayEncaixes.filter((e) => e.status === 'recusado').length;
  const semResposta = todayEncaixes.filter((e) => e.status === 'sem_resposta').length;
  const aguardando = todayEncaixes.filter(
    (e) =>
      e.status === 'recebido' ||
      e.status === 'aguardando_validacao' ||
      e.status === 'tecnico_acionado'
  );

  const openOcorrencias = ocorrencias.filter((o) => o.state !== 'resolvida');
  const reviewEncaixes = encaixes.filter((e) => e.needsReview);
  const reviewOcorrencias = ocorrencias.filter((o) => o.needsReview);
  const reviewAgendas = dailyAgendas.filter((a) => a.needsReview);
  const reviewItemsCount =
    reviewEncaixes.length + reviewOcorrencias.length + reviewAgendas.length;

  const agendaCounts = {
    mudanca: dailyAgendas.filter((a) => a.status === 'mudanca').length,
    reduzida: dailyAgendas.filter((a) => a.status === 'reduzida').length,
    fechadas: dailyAgendas.filter((a) => a.status === 'fechada').length,
    semServico: dailyAgendas.filter((a) => a.status === 'sem_servico').length,
  };

  const handleOpenReviewSummary = () => {
    if (reviewEncaixes.length > 0) {
      onOpenEncaixesFiltered({ onlyReview: true, status: 'all' });
    } else if (reviewOcorrencias.length > 0) {
      onOpenOcorrenciasFiltered({ onlyReview: true, state: 'all' });
    } else if (reviewAgendas.length > 0) {
      onOpenAgendasFiltered('reduzida');
    } else {
      onOpenEncaixesFiltered({ onlyReview: true, status: 'all' });
    }
  };

  return (
    <div className="space-y-7">
      {/* Cabeçalho limpo */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">Visão Geral</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Resumo consolidado dos três grupos monitorados no WhatsApp. Clique em qualquer indicador para abrir a fila filtrada.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {connectionStatus !== 'connected' && bannerMinimized && (
            <button
              type="button"
              onClick={() => onNavigateTab('conexao')}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/12 hover:bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
              title="Conectar QR Code do WhatsApp"
            >
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span>WhatsApp desconectado</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('chat')}
            className="px-4 py-2.5 rounded-xl bg-[#00d2d3] hover:bg-[#00e2e3] text-[#003731] text-[13px] font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Consultar no Chat</span>
          </button>
        </div>
      </header>

      {/* Aviso de conexão desconectada recolhível */}
      {connectionStatus !== 'connected' && !bannerMinimized && (
        <div className="border border-rose-500/30 bg-rose-950/20 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-rose-100">
                Integração WhatsApp aguardando pareamento
              </h3>
              <p className="text-[13px] text-rose-200/75 mt-1 leading-relaxed">
                Ausência de novas mensagens não indica ausência de ocorrências. Conecte o QR Code para retomar a leitura em tempo real.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('conexao')}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-100 border border-rose-400/35 text-[13px] font-medium cursor-pointer whitespace-nowrap transition-colors"
            >
              Abrir Conexão
            </button>
            <button
              type="button"
              onClick={() => setBannerMinimized(true)}
              className="p-2 rounded-xl text-rose-200/70 hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
              title="Minimizar aviso"
              aria-label="Minimizar aviso de WhatsApp"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Faixa unificada de indicadores clicáveis */}
      <section className="bg-[#0e1016] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
          <button
            type="button"
            onClick={() => onOpenEncaixesFiltered({ status: 'all', onlyReview: false })}
            className="p-3.5 sm:p-5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Encaixes hoje</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-white font-mono tabular-nums mt-1.5">
              {todayEncaixes.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Válidos no dia</div>
          </button>

          <button
            type="button"
            onClick={() => onOpenEncaixesFiltered({ status: 'aceito', onlyReview: false })}
            className="p-3.5 sm:p-5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Aceites</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-300 transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-emerald-400 font-mono tabular-nums mt-1.5">
              {aceites}
            </div>
            <div className="text-xs text-slate-500 mt-1">Confirmados</div>
          </button>

          <button
            type="button"
            onClick={() => onOpenEncaixesFiltered({ status: 'recusado', onlyReview: false })}
            className="p-3.5 sm:p-5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Recusas</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-300 transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-rose-400 font-mono tabular-nums mt-1.5">
              {recusas}
            </div>
            <div className="text-xs text-slate-500 mt-1">Explícitas</div>
          </button>

          <button
            type="button"
            onClick={() => onOpenEncaixesFiltered({ status: 'sem_resposta', onlyReview: false })}
            className="p-3.5 sm:p-5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Sem resposta</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-300 transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-amber-300 font-mono tabular-nums mt-1.5">
              {semResposta}
            </div>
            <div className="text-xs text-slate-500 mt-1">SLA acima de {slaMinutes}m</div>
          </button>

          <button
            type="button"
            onClick={() => onOpenOcorrenciasFiltered({ state: 'all', onlyReview: false })}
            className="p-3.5 sm:p-5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Ocorrências</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-300 transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-cyan-300 font-mono tabular-nums mt-1.5">
              {openOcorrencias.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Em acompanhamento</div>
          </button>

          <button
            type="button"
            onClick={handleOpenReviewSummary}
            className="p-3.5 sm:p-5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Para revisão</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-300 transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-amber-300 font-mono tabular-nums mt-1.5">
              {reviewItemsCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Requer conferência</div>
          </button>
        </div>
      </section>

      {/* Grade Principal: Aguardando Resposta e Revisão / Agendas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Aguardando Retorno */}
        <section className="lg:col-span-6 bg-[#0e1016] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-white">
              Aguardando Retorno ({aguardando.length})
            </h3>
            <button
              type="button"
              onClick={() => onOpenEncaixesFiltered({ status: 'tecnico_acionado', onlyReview: false })}
              className="text-[13px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ver encaixes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {aguardando.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhuma solicitação pendente de resposta no momento.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {aguardando.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <span className="truncate">{item.clientName}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="font-mono text-xs text-cyan-300 shrink-0">
                        {item.plate || 'Sem placa'}
                      </span>
                    </div>
                    <div className="text-[13px] text-slate-400">
                      {item.subRegion} ({item.sector}) · {item.technicianName || 'Técnico não definido'}
                    </div>
                    {item.needsReview && item.reviewReason && (
                      <p className="text-xs text-amber-300/90 leading-relaxed pt-0.5">
                        Revisão: {item.reviewReason}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenEncaixesFiltered({
                        status: 'all',
                        onlyReview: false,
                        encaixeId: item.id,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-100 cursor-pointer shrink-0 transition-colors"
                  >
                    Inspecionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Coluna Direita: Revisão Humana + Agendas de Hoje */}
        <section className="lg:col-span-6 space-y-6">
          <div className="bg-[#0e1016] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-white">
                Itens para Revisão Humana
              </h3>
              <span className="text-xs font-mono text-amber-300 tabular-nums">
                {reviewItemsCount} pendentes
              </span>
            </div>

            {reviewItemsCount === 0 ? (
              <p className="py-4 text-sm text-slate-400">
                Nenhum item sinalizado para conferência manual.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {reviewEncaixes.map((e) => (
                  <div key={e.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        Encaixe {e.plate} · {e.clientName}
                      </div>
                      <p className="text-[13px] text-slate-400 truncate mt-0.5">
                        {e.reviewReason}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenEncaixesFiltered({
                          status: 'all',
                          onlyReview: false,
                          encaixeId: e.id,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-medium cursor-pointer shrink-0 transition-colors"
                    >
                      Revisar
                    </button>
                  </div>
                ))}

                {reviewOcorrencias.map((o) => (
                  <div key={o.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        Ocorrência {o.technicianName} · Confiança {o.confidence}%
                      </div>
                      <p className="text-[13px] text-slate-400 truncate mt-0.5">{o.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenOcorrenciasFiltered({
                          state: 'all',
                          onlyReview: false,
                          highlightId: o.id,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-medium cursor-pointer shrink-0 transition-colors"
                    >
                      Revisar
                    </button>
                  </div>
                ))}

                {reviewAgendas.map((a) => (
                  <div key={a.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        Agenda {a.technicianName} · {a.status}
                      </div>
                      <p className="text-[13px] text-slate-400 truncate mt-0.5">
                        {a.dailyCoverage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenAgendasFiltered(a.status)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-medium cursor-pointer shrink-0 transition-colors"
                    >
                      Revisar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0e1016] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-white">Agendas de Hoje</h3>
              <button
                type="button"
                onClick={() => onOpenAgendasFiltered('all')}
                className="text-[13px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver agendas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] border-t border-white/[0.06] pt-3">
              <button
                type="button"
                onClick={() => onOpenAgendasFiltered('mudanca')}
                className="pr-3 py-2 text-left hover:bg-white/[0.025] rounded-lg transition-colors cursor-pointer"
              >
                <div className="text-xs text-slate-400">Mudanças</div>
                <div className="text-xl font-semibold text-cyan-300 font-mono tabular-nums mt-1">
                  {agendaCounts.mudanca}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onOpenAgendasFiltered('reduzida')}
                className="sm:px-4 py-2 text-left hover:bg-white/[0.025] rounded-lg transition-colors cursor-pointer"
              >
                <div className="text-xs text-slate-400">Reduzidas</div>
                <div className="text-xl font-semibold text-amber-300 font-mono tabular-nums mt-1">
                  {agendaCounts.reduzida}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onOpenAgendasFiltered('fechada')}
                className="sm:px-4 py-2 text-left hover:bg-white/[0.025] rounded-lg transition-colors cursor-pointer"
              >
                <div className="text-xs text-slate-400">Fechadas</div>
                <div className="text-xl font-semibold text-rose-400 font-mono tabular-nums mt-1">
                  {agendaCounts.fechadas}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onOpenAgendasFiltered('sem_servico')}
                className="sm:pl-4 py-2 text-left hover:bg-white/[0.025] rounded-lg transition-colors cursor-pointer"
              >
                <div className="text-xs text-slate-400">Sem serviço</div>
                <div className="text-xl font-semibold text-slate-300 font-mono tabular-nums mt-1">
                  {agendaCounts.semServico}
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Ocorrências Recentes */}
      <section className="bg-[#0e1016] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white">Ocorrências Recentes</h3>
          <button
            type="button"
            onClick={() => onOpenOcorrenciasFiltered({ state: 'all', onlyReview: false })}
            className="text-[13px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Abrir ocorrências</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {ocorrencias.slice(0, 4).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() =>
                onOpenOcorrenciasFiltered({
                  state: 'all',
                  onlyReview: false,
                  highlightId: o.id,
                })
              }
              className="w-full text-left py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 -mx-2 rounded-xl cursor-pointer transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  {o.technicianName} · Placa {o.plate} · NSU {o.nsu}
                </div>
                <p className="text-[13px] text-slate-300 leading-relaxed">{o.summary}</p>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs shrink-0 tabular-nums">
                <span className="text-slate-400">
                  {new Date(o.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span
                  className={
                    o.state === 'resolvida'
                      ? 'text-emerald-400 font-medium'
                      : o.state === 'necessita_revisao'
                      ? 'text-amber-300 font-medium'
                      : 'text-cyan-300 font-medium'
                  }
                >
                  {o.state.replace(/_/g, ' ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
