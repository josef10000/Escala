import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Calendar, User, Clock, AlertCircle } from 'lucide-react';
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
    currentYear,
    currentMonthIndex,
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
    if (!selectedShiftId || !targetProviderId || !reason.trim()) return;

    const chosenRequesterShift = assignments.find(a => a.id === selectedShiftId);
    const chosenTargetShift = targetShiftId ? assignments.find(a => a.id === targetShiftId) : undefined;

    requestSwap({
      requesterShiftId: selectedShiftId,
      requesterDate: chosenRequesterShift?.date || '',
      targetProviderId,
      targetDate: isExchangeShift && chosenTargetShift ? chosenTargetShift.date : undefined,
      targetShiftId: isExchangeShift && targetShiftId ? targetShiftId : undefined,
      reason,
    });

    setReason('');
    onClose();
  };

  const selectedShift = assignments.find(a => a.id === selectedShiftId);
  const selectedShiftType = selectedShift ? shiftTypes.find(s => s.id === selectedShift.shiftTypeId) : null;
  const currentProvider = providers.find(p => p.id === activeProviderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Solicitar Troca de Plantão / Permuta
              </h3>
              <p className="text-xs text-slate-500">
                Solicitante: <strong className="text-slate-700">{currentProvider?.name}</strong>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Select which shift to swap */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Qual plantão seu você deseja trocar ou passar?
            </label>
            {myShifts.length === 0 ? (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                Você não possui nenhum plantão alocado para solicitar troca.
              </p>
            ) : (
              <select
                required
                value={selectedShiftId}
                onChange={e => setSelectedShiftId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Para qual colega você deseja propor a cobertura/troca?
            </label>
            <select
              required
              value={targetProviderId}
              onChange={e => setTargetProviderId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {providers
                .filter(p => p.id !== activeProviderId)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role}
                  </option>
                ))}
            </select>
          </div>

          {/* Toggle bilateral exchange */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExchangeShift}
                onChange={e => setIsExchangeShift(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Troca bilateral (eu assumo um plantão dele em outra data)
              </span>
            </label>
          </div>

          {isExchangeShift && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Plantão do colega que você pretende assumir em troca:
              </label>
              {targetProviderShifts.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Este colega não possui plantões escalados para troca mútua. Você pode enviar a solicitação como cobertura simples.
                </p>
              ) : (
                <select
                  value={targetShiftId}
                  onChange={e => setTargetShiftId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="">Selecione o plantão dele em contrapartida...</option>
                  {targetProviderShifts.map(ts => {
                    const st = shiftTypes.find(t => t.id === ts.shiftTypeId);
                    return (
                      <option key={ts.id} value={ts.id}>
                        {formatFriendlyDate(ts.date)} ({st?.name})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3. Justificativa / Motivo da Solicitação
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Consulta médica agendada, compromisso familiar urgente, plantão já pré-acordado com o colega..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Toda solicitação de permuta é encaminhada diretamente ao supervisor para homologação na escala oficial.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={myShifts.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors"
            >
              Enviar Solicitação de Troca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
