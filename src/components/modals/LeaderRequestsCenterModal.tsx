import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import {
  ArrowLeftRight,
  FileText,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { formatFriendlyDate } from '../../utils/dateUtils';

interface LeaderRequestsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderRequestsCenterModal: React.FC<LeaderRequestsCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    providers,
    swapRequests,
    scheduleRequests,
    approveSwap,
    rejectSwap,
    approveScheduleRequest,
    rejectScheduleRequest,
  } = useSchedule();

  const [activeTab, setActiveTab] = useState<'swaps' | 'requests'>('swaps');

  if (!isOpen) return null;

  const pendingSwaps = swapRequests.filter(s => s.status === 'pending_supervisor');
  const pendingRequests = scheduleRequests.filter(r => r.status === 'pending');

  const getProviderName = (id: string) => {
    return providers.find(p => p.id === id)?.name || 'Colaborador';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl max-w-2xl w-full space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div>
            <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
              Painel da Líder
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>Central de Pedidos e Trocas</span>
              {(pendingSwaps.length + pendingRequests.length > 0) && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                  {pendingSwaps.length + pendingRequests.length} pendentes
                </span>
              )}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('swaps')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'swaps'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Trocas de Plantão ({pendingSwaps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'requests'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pedidos de Folgas / Extras ({pendingRequests.length})</span>
          </button>
        </div>

        {/* Content list (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeTab === 'swaps' && (
            <>
              {swapRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Nenhuma solicitação de troca enviada até o momento.
                </div>
              ) : (
                swapRequests.map(swap => {
                  const requesterName = getProviderName(swap.requesterProviderId);
                  const targetName = getProviderName(swap.targetProviderId);
                  const isPending = swap.status === 'pending_supervisor';

                  return (
                    <div
                      key={swap.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPending
                          ? 'bg-slate-950/80 border-indigo-500/40 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white">
                              {requesterName}
                            </span>
                            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-black text-sm text-indigo-200">
                              {targetName}
                            </span>

                            {swap.status === 'approved' && (
                              <span className="ml-2 px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold">
                                APROVADA
                              </span>
                            )}
                            {swap.status === 'rejected' && (
                              <span className="ml-2 px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-500/30 rounded-md text-[10px] font-bold">
                                RECUSADA
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-300">
                            <strong>Plantão a passar:</strong> Dia {swap.requesterDate} (
                            {formatFriendlyDate(swap.requesterDate)})
                            {swap.targetDate && (
                              <span>
                                {' '}
                                ↔ <strong>Em troca do dia:</strong> {swap.targetDate}
                              </span>
                            )}
                          </div>

                          {swap.reason && (
                            <div className="text-xs text-slate-400 italic bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 mt-1">
                              "{swap.reason}"
                            </div>
                          )}
                        </div>

                        {/* Action buttons if pending */}
                        {isPending && (
                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                            <button
                              onClick={() => approveSwap(swap.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprovar Troca</span>
                            </button>

                            <button
                              onClick={() => rejectSwap(swap.id)}
                              className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Recusar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              {scheduleRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Nenhum pedido de folga ou disponibilidade enviado ainda.
                </div>
              ) : (
                scheduleRequests.map(req => {
                  const provName = getProviderName(req.providerId);
                  const isPending = req.status === 'pending';
                  const isDayOff = req.type === 'day_off';

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPending
                          ? 'bg-slate-950/80 border-indigo-500/40 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white">
                              {provName}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isDayOff
                                  ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {isDayOff ? 'PEDIDO DE FOLGA (D)' : 'DISPONIBILIDADE EXTRA (T)'}
                            </span>

                            {req.status === 'approved' && (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold">
                                APROVADO
                              </span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-500/30 rounded-md text-[10px] font-bold">
                                RECUSADO
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-300">
                            <strong>Data solicitada:</strong> {req.date} (
                            {formatFriendlyDate(req.date)})
                          </div>

                          {req.reason && (
                            <div className="text-xs text-slate-400 italic bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 mt-1">
                              "{req.reason}"
                            </div>
                          )}
                        </div>

                        {/* Action buttons if pending */}
                        {isPending && (
                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                            <button
                              onClick={() => approveScheduleRequest(req.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprovar na Escala</span>
                            </button>

                            <button
                              onClick={() => rejectScheduleRequest(req.id)}
                              className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Recusar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
