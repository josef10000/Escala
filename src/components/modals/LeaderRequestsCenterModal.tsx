import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { formatFriendlyDate } from '../../utils/dateUtils';
import {
  Inbox,
  ArrowLeftRight,
  FileText,
  CheckCircle,
  XCircle,
  X,
  User,
  Clock,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { SwapRequest, ScheduleRequest } from '../../types';

interface LeaderRequestsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderRequestsCenterModal: React.FC<LeaderRequestsCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    swapRequests,
    scheduleRequests,
    approveSwap,
    rejectSwap,
    approveScheduleRequest,
    rejectScheduleRequest,
    providers,
  } = useSchedule();

  const [activeTab, setActiveTab] = useState<'swaps' | 'requests'>('swaps');

  if (!isOpen) return null;

  const pendingSwaps = swapRequests.filter(s => s.status === 'pending_supervisor');
  const pastSwaps = swapRequests.filter(s => s.status !== 'pending_supervisor');

  const pendingRequests = scheduleRequests.filter(r => r.status === 'pending');
  const pastRequests = scheduleRequests.filter(r => r.status !== 'pending');

  const getProviderName = (id: string) => {
    return providers.find(p => p.id === id)?.name || 'Colaborador';
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#12141A] text-zinc-100 rounded-3xl p-6 border border-white/[0.08] shadow-2xl max-w-xl w-full max-h-[88vh] flex flex-col overflow-hidden space-y-4 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A1D24] border border-white/[0.08] flex items-center justify-center text-[#00d2d3] shadow-sm">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Central de Pedidos da Equipe</span>
                {(pendingSwaps.length + pendingRequests.length) > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {pendingSwaps.length + pendingRequests.length} novos
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                Validação de permutas e solicitações de folga da equipe PJ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-[#1A1D24] p-1 rounded-2xl border border-white/[0.08] shrink-0">
          <button
            onClick={() => setActiveTab('swaps')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'swaps'
                ? 'bg-[#292A2F] text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#00d2d3]" />
            <span>Trocas de Plantão ({pendingSwaps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#292A2F] text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Pedidos de Folgas ({pendingRequests.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {/* TAB 1: SWAPS */}
          {activeTab === 'swaps' && (
            <div className="space-y-3">
              {pendingSwaps.length === 0 ? (
                <div className="p-8 text-center bg-[#1A1D24] rounded-2xl border border-white/[0.06] text-zinc-400 space-y-2">
                  <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-200">Nenhuma troca pendente!</p>
                  <p className="text-xs text-zinc-400">Todas as permutas entre colaboradores foram resolvidas.</p>
                </div>
              ) : (
                pendingSwaps.map(swap => (
                  <div
                    key={swap.id}
                    className="p-4 rounded-2xl bg-[#1A1D24] border border-white/[0.08] hover:border-white/[0.15] space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="font-bold text-white">
                          {getProviderName(swap.requesterProviderId)} ⇄ {getProviderName(swap.targetProviderId)}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 font-medium">
                        {formatFriendlyDate(swap.createdAt)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#12141A] rounded-xl text-xs space-y-1.5 text-zinc-300 border border-white/[0.06]">
                      <div>
                        <strong className="text-white">{getProviderName(swap.requesterProviderId)}</strong> entrega o dia:{' '}
                        <span className="font-bold text-[#00d2d3]">{formatFriendlyDate(swap.requesterDate, true)}</span>
                      </div>
                      <div>
                        <strong className="text-white">{getProviderName(swap.targetProviderId)}</strong> assume o dia:{' '}
                        <span className="font-bold text-purple-300">
                          {swap.targetDate ? formatFriendlyDate(swap.targetDate, true) : 'Ceder plantão'}
                        </span>
                      </div>
                      {swap.reason && (
                        <div className="text-xs text-zinc-400 pt-1 italic">
                          "{swap.reason}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => rejectSwap(swap.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/80 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Recusar</span>
                      </button>
                      <button
                        onClick={() => approveSwap(swap.id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#003731] bg-[#00d2d3] hover:bg-[#57f1db] shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-[#003731]" />
                        <span>Aprovar Troca na Escala</span>
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Past Swaps History */}
              {pastSwaps.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                    Histórico de Trocas Recentes
                  </span>
                  <div className="space-y-1.5">
                    {pastSwaps.slice(0, 5).map(s => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-[#1A1D24] border border-white/[0.06] text-xs flex items-center justify-between text-zinc-300"
                      >
                        <span>
                          {getProviderName(s.requesterProviderId)} ⇄ {getProviderName(s.targetProviderId)}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            s.status === 'approved'
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/80'
                              : 'bg-rose-950/40 text-rose-300 border border-rose-800/80'
                          }`}
                        >
                          {s.status === 'approved' ? 'Aprovada ✓' : 'Recusada ✕'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS (Folgas / Extras) */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center bg-[#1A1D24] rounded-2xl border border-white/[0.06] text-zinc-400 space-y-2">
                  <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-200">Nenhum pedido pendente!</p>
                  <p className="text-xs text-zinc-400">Nenhum colaborador solicitou folga ou extra no momento.</p>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-[#1A1D24] border border-white/[0.08] hover:border-white/[0.15] space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            req.type === 'day_off' ? 'bg-amber-400' : 'bg-[#00d2d3]'
                          }`}
                        />
                        <span className="font-bold text-white">
                          {getProviderName(req.providerId)}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#12141A] text-zinc-300 border border-white/[0.08]">
                          {req.type === 'day_off' ? 'Pedido de Folga' : 'Plantão Extra'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 font-medium">
                        {formatFriendlyDate(req.createdAt)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#12141A] rounded-xl text-xs space-y-1 text-zinc-300 border border-white/[0.06]">
                      <div>
                        Data solicitada:{' '}
                        <strong className="text-white">{formatFriendlyDate(req.date, true)}</strong>
                      </div>
                      {req.reason && (
                        <div className="text-xs text-zinc-400 pt-0.5 italic">
                          "{req.reason}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => rejectScheduleRequest(req.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/80 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Recusar</span>
                      </button>
                      <button
                        onClick={() => approveScheduleRequest(req.id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#003731] bg-[#00d2d3] hover:bg-[#57f1db] shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-[#003731]" />
                        <span>Aprovar Pedido</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1A1D24] hover:bg-[#252830] text-zinc-300 border border-white/[0.08] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
