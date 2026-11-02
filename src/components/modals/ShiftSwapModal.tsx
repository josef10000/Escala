import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Provider } from '../../types';
import { ArrowLeftRight, X, CheckCircle2 } from 'lucide-react';
import { formatFriendlyDate } from '../../utils/dateUtils';

interface ShiftSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  requesterProvider: Provider;
}

export const ShiftSwapModal: React.FC<ShiftSwapModalProps> = ({
  isOpen,
  onClose,
  requesterProvider,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    assignments,
    providers,
    requestSwap,
  } = useSchedule();

  // Find all work shifts ('st-t') of this requester in the current month
  const requesterWorkShifts = assignments.filter(a => {
    const [y, m] = a.date.split('-').map(Number);
    return (
      a.providerId === requesterProvider.id &&
      a.shiftTypeId === 'st-t' &&
      y === currentYear &&
      m === currentMonthIndex + 1
    );
  }).sort((a, b) => a.date.localeCompare(b.date));

  const [selectedShiftId, setSelectedShiftId] = useState<string>(
    requesterWorkShifts[0]?.id || ''
  );

  // Target provider (excluding requester)
  const otherProviders = providers.filter(p => p.id !== requesterProvider.id);
  const [targetProviderId, setTargetProviderId] = useState<string>(
    otherProviders[0]?.id || ''
  );

  // Target provider's shifts in the month
  const targetWorkShifts = assignments.filter(a => {
    const [y, m] = a.date.split('-').map(Number);
    return (
      a.providerId === targetProviderId &&
      a.shiftTypeId === 'st-t' &&
      y === currentYear &&
      m === currentMonthIndex + 1
    );
  }).sort((a, b) => a.date.localeCompare(b.date));

  const [targetShiftId, setTargetShiftId] = useState<string>('none');
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedShiftId) {
      setErrorMsg('Selecione qual dos seus plantões você deseja trocar.');
      return;
    }
    if (!targetProviderId) {
      setErrorMsg('Selecione com qual colega deseja trocar.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Escreva o motivo da troca para a Líder avaliar.');
      return;
    }

    const chosenShift = requesterWorkShifts.find(s => s.id === selectedShiftId);
    if (!chosenShift) {
      setErrorMsg('Plantão inválido.');
      return;
    }

    const chosenTargetShift = targetWorkShifts.find(s => s.id === targetShiftId);

    requestSwap({
      requesterShiftId: chosenShift.id,
      requesterDate: chosenShift.date,
      targetProviderId,
      targetDate: chosenTargetShift?.date,
      targetShiftId: targetShiftId === 'none' ? undefined : targetShiftId,
      reason: reason.trim(),
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-[#141c28] text-slate-100 rounded-3xl p-6 border border-[#1e2a3a] shadow-2xl max-w-md w-full space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2a3a] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 flex items-center justify-center font-bold shadow-sm">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Solicitar Troca de Plantão
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                De: <strong className="text-cyan-400">{requesterProvider.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-cyan-950/70 text-cyan-300 rounded-2xl flex items-center justify-center mx-auto border border-cyan-800 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-white">
              Pedido de Troca Enviado!
            </h4>
            <p className="text-xs text-slate-400">
              A Líder foi notificada e avaliará a sua troca na Central de Pedidos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {requesterWorkShifts.length === 0 ? (
              <div className="p-4 bg-amber-950/40 border border-amber-800/70 rounded-2xl text-xs text-amber-200">
                Você não possui plantões marcados como "Trabalha (T)" neste mês para trocar.
              </div>
            ) : (
              <>
                {/* Step 1: Which shift to pass/swap */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    1. Qual o seu plantão que deseja passar/trocar?
                  </label>
                  <select
                    value={selectedShiftId}
                    onChange={e => setSelectedShiftId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c121c] border border-[#1e2a3a] rounded-xl text-slate-200 text-xs font-bold focus:border-cyan-400 focus:outline-none transition-colors"
                  >
                    {requesterWorkShifts.map(s => {
                      const [, , day] = s.date.split('-');
                      return (
                        <option key={s.id} value={s.id}>
                          Dia {day} ({formatFriendlyDate(s.date)}) — Plantão 12h
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Step 2: Target provider */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    2. Com qual colega você combinou a troca?
                  </label>
                  <select
                    value={targetProviderId}
                    onChange={e => {
                      setTargetProviderId(e.target.value);
                      setTargetShiftId('none');
                    }}
                    className="w-full px-3 py-2 bg-[#0c121c] border border-[#1e2a3a] rounded-xl text-slate-200 text-xs font-bold focus:border-cyan-400 focus:outline-none transition-colors"
                  >
                    {otherProviders.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 3: Target provider's shift (or just take over) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    3. Você vai assumir qual dia do colega?
                  </label>
                  <select
                    value={targetShiftId}
                    onChange={e => setTargetShiftId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c121c] border border-[#1e2a3a] rounded-xl text-slate-200 text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  >
                    <option value="none">
                      Apenas passar meu plantão (Sem troca de volta)
                    </option>
                    {targetWorkShifts.map(s => {
                      const [, , day] = s.date.split('-');
                      return (
                        <option key={s.id} value={s.id}>
                          Pegar o dia {day} dele(a) ({formatFriendlyDate(s.date)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Step 4: Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    4. Motivo da troca (para análise da Líder):
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Ex: Consulta médica agendada / Imprevisto pessoal..."
                    className="w-full px-3 py-2 bg-[#0c121c] border border-[#1e2a3a] rounded-xl text-slate-200 text-xs focus:border-cyan-400 focus:outline-none resize-none transition-colors placeholder:text-slate-500"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-[#1e2a3a]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/2 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Enviar Pedido</span>
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
