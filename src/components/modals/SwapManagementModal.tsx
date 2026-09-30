import React from 'react';
import { X, ArrowRightLeft, Check, AlertCircle, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { formatFriendlyDate, formatShortDate } from '../../utils/dateUtils';

interface SwapManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwapManagementModal: React.FC<SwapManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    swapRequests,
    providers,
    assignments,
    shiftTypes,
    departments,
    approveSwap,
    rejectSwap,
  } = useSchedule();

  if (!isOpen) return null;

  const pendingSwaps = swapRequests.filter(s => s.status === 'pending_supervisor');
  const pastSwaps = swapRequests.filter(s => s.status !== 'pending_supervisor');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Gestão de Trocas e Permutas de Plantão
              </h3>
              <p className="text-xs text-slate-500">
                Homologação e aprovação de substituições entre prestadores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Pending Swaps Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Permutas Pendentes de Aprovação ({pendingSwaps.length})</span>
              </h4>
            </div>

            {pendingSwaps.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                Nenhuma solicitação de troca pendente no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSwaps.map(swap => {
                  const requester = providers.find(p => p.id === swap.requesterProviderId);
                  const target = providers.find(p => p.id === swap.targetProviderId);
                  const reqShift = assignments.find(a => a.id === swap.requesterShiftId);
                  const targetShift = swap.targetShiftId ? assignments.find(a => a.id === swap.targetShiftId) : null;

                  const reqShiftType = reqShift ? shiftTypes.find(s => s.id === reqShift.shiftTypeId) : null;
                  const reqDept = reqShift ? departments.find(d => d.id === reqShift.departmentId) : null;

                  return (
                    <div
                      key={swap.id}
                      className="p-4 bg-white border border-amber-200 rounded-xl shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-900">{requester?.name}</span>
                          <span className="text-slate-400">propôs troca para</span>
                          <span className="font-bold text-slate-900">{target?.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono-nums">
                          Solicitado em {new Date(swap.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {/* Shift details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">
                            Plantão a ceder ({requester?.name}):
                          </div>
                          {reqShift && reqShiftType ? (
                            <div className="mt-1 font-medium text-slate-800">
                              <div>{formatFriendlyDate(reqShift.date)}</div>
                              <div className="text-[11px] text-indigo-700 font-mono-nums">
                                {reqShiftType.name} ({reqShiftType.startTime} - {reqShiftType.endTime})
                              </div>
                              <div className="text-[10px] text-slate-500">{reqDept?.name}</div>
                            </div>
                          ) : (
                            <span className="text-rose-500">Plantão não localizado</span>
                          )}
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">
                            Contrapartida ({target?.name}):
                          </div>
                          {targetShift ? (
                            <div className="mt-1 font-medium text-slate-800">
                              <div>{formatFriendlyDate(targetShift.date)}</div>
                              <div className="text-[11px] text-indigo-700 font-mono-nums">
                                Troca mútua
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 text-slate-600 italic">
                              Cobertura direta (sem troca de plantão)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="text-xs text-slate-600">
                        <strong className="text-slate-700">Motivo informado:</strong> "{swap.reason}"
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => rejectSwap(swap.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Recusar</span>
                        </button>
                        <button
                          onClick={() => approveSwap(swap.id)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar e Efetivar na Escala</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Swaps History */}
          {pastSwaps.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Histórico Recente de Permutas ({pastSwaps.length})
              </h4>
              <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl border border-slate-200 p-2 text-xs">
                {pastSwaps.map(swap => {
                  const req = providers.find(p => p.id === swap.requesterProviderId);
                  const tgt = providers.find(p => p.id === swap.targetProviderId);
                  const isApproved = swap.status === 'approved';

                  return (
                    <div key={swap.id} className="p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-sm text-[10px] ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isApproved ? 'Aprovada' : 'Recusada'}
                        </span>
                        <span className="text-slate-700">
                          <strong>{req?.name}</strong> ➔ <strong>{tgt?.name}</strong>: "{swap.reason}"
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono-nums text-[10px]">
                        {swap.reviewedAt ? new Date(swap.reviewedAt).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
