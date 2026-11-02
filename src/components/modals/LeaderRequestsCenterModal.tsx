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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white text-slate-800 rounded-3xl p-6 border border-slate-200/90 shadow-2xl max-w-xl w-full max-h-[88vh] flex flex-col overflow-hidden space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shadow-2xs">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Central de Pedidos da Equipe</span>
                {(pendingSwaps.length + pendingRequests.length) > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                    {pendingSwaps.length + pendingRequests.length} novos
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Aprovação de permutas e solicitações de folga
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('swaps')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'swaps'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Trocas de Plantão ({pendingSwaps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pedidos de Folgas ({pendingRequests.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {/* TAB 1: SWAPS */}
          {activeTab === 'swaps' && (
            <div className="space-y-3">
              {pendingSwaps.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70 text-slate-500 space-y-2">
                  <CheckCircle className="w-7 h-7 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Nenhuma troca pendente!</p>
                  <p className="text-xs text-slate-500">Todas as permutas entre colaboradores foram resolvidas.</p>
                </div>
              ) : (
                pendingSwaps.map(swap => (
                  <div
                    key={swap.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="font-extrabold text-slate-900">
                          {getProviderName(swap.requesterProviderId)} ⇄ {getProviderName(swap.targetProviderId)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {formatFriendlyDate(swap.createdAt)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-700 border border-slate-200/60">
                      <div>
                        <strong>{getProviderName(swap.requesterProviderId)}</strong> entrega o dia:{' '}
                        <span className="font-bold text-emerald-700">{formatFriendlyDate(swap.requesterDate, true)}</span>
                      </div>
                      <div>
                        <strong>{getProviderName(swap.targetProviderId)}</strong> assume o dia:{' '}
                        <span className="font-bold text-sky-700">
                          {swap.targetDate ? formatFriendlyDate(swap.targetDate, true) : 'Ceder plantão'}
                        </span>
                      </div>
                      {swap.reason && (
                        <div className="text-xs text-slate-600 pt-1 italic">
                          "{swap.reason}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => rejectSwap(swap.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Recusar</span>
                      </button>
                      <button
                        onClick={() => approveSwap(swap.id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Aprovar Troca na Escala</span>
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Past Swaps History */}
              {pastSwaps.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                    Histórico de Trocas Recentes
                  </span>
                  <div className="space-y-1.5">
                    {pastSwaps.slice(0, 5).map(s => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between text-slate-600"
                      >
                        <span>
                          {getProviderName(s.requesterProviderId)} ⇄ {getProviderName(s.targetProviderId)}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            s.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
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
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70 text-slate-500 space-y-2">
                  <CheckCircle className="w-7 h-7 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Nenhum pedido pendente!</p>
                  <p className="text-xs text-slate-500">Nenhum colaborador solicitou folga ou extra no momento.</p>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            req.type === 'day_off' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-extrabold text-slate-900">
                          {getProviderName(req.providerId)}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {req.type === 'day_off' ? 'Pedido de Folga' : 'Plantão Extra'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {formatFriendlyDate(req.createdAt)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700 border border-slate-200/60">
                      <div>
                        Data solicitada:{' '}
                        <strong className="text-slate-900">{formatFriendlyDate(req.date, true)}</strong>
                      </div>
                      {req.reason && (
                        <div className="text-xs text-slate-600 pt-0.5 italic">
                          "{req.reason}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => rejectScheduleRequest(req.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Recusar</span>
                      </button>
                      <button
                        onClick={() => approveScheduleRequest(req.id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
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
        <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
