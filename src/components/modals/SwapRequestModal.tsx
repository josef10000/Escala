import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { ShiftAssignment } from '../../types';
import { formatFriendlyDate } from '../../utils/dateUtils';

interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedShift?: ShiftAssignment | null;
}

export const SwapRequestModal: React.FC<SwapRequestModalProps> = ({
  isOpen,
  onClose,
  preSelectedShift,
}) => {
  const {
    activeProviderId,
    providers,
    assignments,
    shiftTypes,
    departments,
    requestSwap,
  } = useSchedule();

  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [targetProviderId, setTargetProviderId] = useState<string>('');
  const [targetShiftId, setTargetShiftId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isExchangeShift, setIsExchangeShift] = useState<boolean>(false);

  // My shifts available to swap
  const myShifts = assignments.filter(a => {
    return a.providerId === activeProviderId;
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Shifts of target provider to exchange with
  const targetProviderShifts = assignments.filter(a => {
    return a.providerId === targetProviderId;
  }).sort((a, b) => a.date.localeCompare(b.date));

  useEffect(() => {
    if (preSelectedShift) {
      setSelectedShiftId(preSelectedShift.id);
    } else if (myShifts.length > 0 && !selectedShiftId) {
      setSelectedShiftId(myShifts[0].id);
    }

    const availablePeers = providers.filter(p => p.id !== activeProviderId);
    if (availablePeers.length > 0 && !targetProviderId) {
      setTargetProviderId(availablePeers[0].id);
    }
  }, [preSelectedShift, myShifts, providers, activeProviderId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const myShift = assignments.find(a => a.id === selectedShiftId);
    if (!myShift || !targetProviderId) return;

    const targetShift = isExchangeShift ? assignments.find(a => a.id === targetShiftId) : null;

    requestSwap({
      requesterShiftId: myShift.id,
      requesterDate: myShift.date,
      targetProviderId,
      targetDate: targetShift ? targetShift.date : undefined,
      targetShiftId: targetShift ? targetShift.id : undefined,
      reason: reason.trim(),
    });

    onClose();
  };

  const currentProvider = providers.find(p => p.id === activeProviderId);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0e1017] border border-white/[0.09] text-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00d2d3]/15 border border-[#00d2d3]/30 text-[#00d2d3] flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Solicitar Troca de Plantão / Permuta
              </h3>
              <p className="text-xs text-neutral-400">
                Solicitante: <strong className="text-[#00d2d3]">{currentProvider?.name}</strong>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Select which shift to swap */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              1. Qual plantão seu você deseja trocar ou passar?
            </label>
            {myShifts.length === 0 ? (
              <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                Você não possui nenhum plantão alocado para solicitar troca.
              </p>
            ) : (
              <select
                required
                value={selectedShiftId}
                onChange={e => setSelectedShiftId(e.target.value)}
                className="w-full bg-[#161922] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-semibold text-xs focus:outline-none focus:border-[#00d2d3]/50"
              >
                {myShifts.map(s => {
                  const st = shiftTypes.find(t => t.id === s.shiftTypeId);
                  const dept = departments.find(d => d.id === s.departmentId);
                  return (
                    <option key={s.id} value={s.id}>
                      {formatFriendlyDate(s.date)} — {st?.code} ({st?.startTime}-{st?.endTime}) · {dept?.name}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Target Colleague to propose to */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              2. Para qual colega prestador deseja enviar a proposta?
            </label>
            <select
              required
              value={targetProviderId}
              onChange={e => {
                setTargetProviderId(e.target.value);
                setTargetShiftId('');
              }}
              className="w-full bg-[#161922] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-semibold text-xs focus:outline-none focus:border-[#00d2d3]/50"
            >
              {providers
                .filter(p => p.id !== activeProviderId)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
            </select>
          </div>

          {/* Exchange options toggle */}
          <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isExchangeShift}
                onChange={e => setIsExchangeShift(e.target.checked)}
                className="rounded border-white/20 bg-[#161922] text-[#00d2d3] focus:ring-0"
              />
              <span className="text-xs font-medium text-white">
                Desejo pegar um plantão dele em troca (Permuta Mútua)
              </span>
            </label>

            {isExchangeShift && (
              <div className="pt-2">
                <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                  Selecione o plantão do colega que você quer assumir:
                </label>
                {targetProviderShifts.length === 0 ? (
                  <p className="text-[11px] text-amber-300">
                    Este colega não tem plantões escalados para permuta neste mês.
                  </p>
                ) : (
                  <select
                    value={targetShiftId}
                    onChange={e => setTargetShiftId(e.target.value)}
                    className="w-full bg-[#1b1f2b] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#00d2d3]/50"
                  >
                    <option value="">Selecione o plantão do colega...</option>
                    {targetProviderShifts.map(s => {
                      const st = shiftTypes.find(t => t.id === s.shiftTypeId);
                      return (
                        <option key={s.id} value={s.id}>
                          {formatFriendlyDate(s.date)} — {st?.code} ({st?.startTime}-{st?.endTime})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Motivo ou Justificativa:
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Acordo pessoal entre as partes, compromisso acadêmico..."
              className="w-full bg-[#161922] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#00d2d3]/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedShiftId || !targetProviderId || !reason.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] font-bold text-xs transition-all shadow-md shadow-[#00d2d3]/20 disabled:opacity-50 cursor-pointer"
            >
              Enviar Pedido de Troca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
