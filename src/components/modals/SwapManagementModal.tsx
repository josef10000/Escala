import React from 'react';
import { X, ArrowRightLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { formatFriendlyDate } from '../../utils/dateUtils';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e1017] border border-white/[0.09] text-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#12141c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Gestão de Trocas e Permutas de Plantão
              </h3>
              <p className="text-xs text-neutral-400">
                Homologação e aprovação de substituições entre prestadores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Pending Swaps Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Permutas Pendentes de Aprovação ({pendingSwaps.length})</span>
              </h4>
            </div>

            {pendingSwaps.length === 0 ? (
              <div className="p-6 bg-[#141720] rounded-xl border border-white/[0.06] text-center text-xs text-neutral-400">
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
                      className="p-4 bg-[#141720] border border-amber-500/30 rounded-xl space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-white">{requester?.name}</span>
                          <span className="text-neutral-400">propôs troca para</span>
                          <span className="font-semibold text-white">{target?.name}</span>
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          Solicitado em {new Date(swap.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {/* Shift details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#1b1f2b] p-3 rounded-lg border border-white/[0.06]">
                        <div>
                          <div className="text-[10px] text-neutral-400 font-semibold uppercase">
                            Plantão a ceder ({requester?.name.split(' ')[0]}):
                          </div>
                          {reqShift && reqShiftType ? (
                            <div className="mt-1 font-medium text-white">
                              <div>{formatFriendlyDate(reqShift.date)}</div>
                              <div className="text-[11px] text-[#00d2d3] font-mono">
                                {reqShiftType.name} ({reqShiftType.startTime} - {reqShiftType.endTime})
                              </div>
                              <div className="text-[10px] text-neutral-400">{reqDept?.name}</div>
                            </div>
                          ) : (
                            <span className="text-rose-400">Plantão não localizado</span>
                          )}
                        </div>

                        <div>
                          <div className="text-[10px] text-neutral-400 font-semibold uppercase">
                            Contrapartida ({target?.name.split(' ')[0]}):
                          </div>
                          {targetShift ? (
                            <div className="mt-1 font-medium text-white">
                              <div>{formatFriendlyDate(targetShift.date)}</div>
                              <div className="text-[11px] text-[#00d2d3] font-mono">
                                Troca mútua
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 text-neutral-400 italic">
                              Cobertura direta (sem troca de plantão)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="text-xs text-neutral-300">
                        <strong className="text-neutral-200">Motivo informado:</strong> "{swap.reason}"
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                        <button
                          onClick={() => rejectSwap(swap.id)}
                          className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Recusar</span>
                        </button>
                        <button
                          onClick={() => approveSwap(swap.id)}
                          className="px-4 py-1.5 text-xs font-semibold text-black bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Histórico Recente de Permutas ({pastSwaps.length})
              </h4>
              <div className="divide-y divide-white/[0.06] bg-[#141720] rounded-xl border border-white/[0.06] p-2 text-xs">
                {pastSwaps.map(swap => {
                  const req = providers.find(p => p.id === swap.requesterProviderId);
                  const tgt = providers.find(p => p.id === swap.targetProviderId);
                  const isApproved = swap.status === 'approved';

                  return (
                    <div key={swap.id} className="p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isApproved ? 'Aprovada' : 'Recusada'}
                        </span>
                        <span className="text-neutral-300">
                          <strong>{req?.name}</strong> ➔ <strong>{tgt?.name}</strong>: "{swap.reason}"
                        </span>
                      </div>
                      <span className="text-neutral-500 font-mono text-[10px]">
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
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#12141c] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
