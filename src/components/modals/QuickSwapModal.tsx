import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT, getMonthDaysArray } from '../../utils/dateUtils';

interface QuickSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProviderAId?: string;
  defaultDate?: string;
}

export const QuickSwapModal: React.FC<QuickSwapModalProps> = ({
  isOpen,
  onClose,
  defaultProviderAId,
  defaultDate,
}) => {
  const {
    providers,
    assignments,
    currentYear,
    currentMonthIndex,
    directSwap,
  } = useSchedule();

  const daysInMonth = getMonthDaysArray(currentYear, currentMonthIndex);
  const monthName = MONTH_NAMES_PT[currentMonthIndex];

  const [providerAId, setProviderAId] = useState<string>(() => {
    return defaultProviderAId || providers[0]?.id || '';
  });

  const [providerBId, setProviderBId] = useState<string>(() => {
    const other = providers.find(p => p.id !== (defaultProviderAId || providers[0]?.id));
    return other?.id || providers[1]?.id || '';
  });

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    if (defaultDate) {
      const parts = defaultDate.split('-');
      if (parts.length === 3) return Number(parts[2]);
    }
    return 1;
  });

  const [reason, setReason] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (defaultProviderAId) {
      setProviderAId(defaultProviderAId);
      const other = providers.find(p => p.id !== defaultProviderAId);
      if (other) setProviderBId(other.id);
    }
    if (defaultDate) {
      const parts = defaultDate.split('-');
      if (parts.length === 3) setSelectedDay(Number(parts[2]));
    }
    setSuccessMessage(null);
  }, [defaultProviderAId, defaultDate, isOpen, providers]);

  if (!isOpen) return null;

  const targetDateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const provA = providers.find(p => p.id === providerAId);
  const provB = providers.find(p => p.id === providerBId);

  // Current status on selected date
  const assignmentA = assignments.find(a => a.providerId === providerAId && a.date === targetDateStr);
  const assignmentB = assignments.find(a => a.providerId === providerBId && a.date === targetDateStr);

  const codeA = assignmentA ? (assignmentA.shiftTypeId === 'st-t' ? 'T' : 'D') : 'D';
  const codeB = assignmentB ? (assignmentB.shiftTypeId === 'st-t' ? 'T' : 'D') : 'D';

  const handleExecuteSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provA || !provB || provA.id === provB.id) return;

    directSwap({
      providerAId: provA.id,
      providerBId: provB.id,
      dateA: targetDateStr,
      dateB: targetDateStr,
      reason: reason.trim() || undefined,
    });

    setSuccessMessage(
      `Troca confirmada entre ${provA.name} e ${provB.name} no dia ${selectedDay}/${currentMonthIndex + 1}! Registro salvo na escala.`
    );

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0e1017] border border-white/[0.09] text-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white tracking-tight">Troca Rápida de Plantão</h3>
              <p className="text-xs text-neutral-400">Permutar a escala entre dois colaboradores em 1 clique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {successMessage ? (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
              <Check className="w-5 h-5 shrink-0 text-emerald-400" />
              <p className="font-medium">{successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleExecuteSwap} className="space-y-4 text-xs">
              {/* Day Selector */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Selecione o Dia do Mês ({monthName} de {currentYear}):
                </label>
                <select
                  value={selectedDay}
                  onChange={e => setSelectedDay(Number(e.target.value))}
                  className="w-full bg-[#161922] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-semibold text-xs focus:outline-none focus:border-amber-500/50"
                >
                  {daysInMonth.map(d => (
                    <option key={d.dayNumber} value={d.dayNumber}>
                      Dia {String(d.dayNumber).padStart(2, '0')} ({d.isWeekend ? 'Fim de Semana' : 'Dia útil'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Providers comparison box */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#141720] border border-white/[0.06]">
                {/* Provider A */}
                <div className="space-y-2">
                  <label className="block text-neutral-400 font-semibold text-[10px] uppercase tracking-wider">
                    Colaborador A (Sai do Plantão):
                  </label>
                  <select
                    value={providerAId}
                    onChange={e => setProviderAId(e.target.value)}
                    className="w-full bg-[#1b1f2b] border border-white/[0.08] rounded-xl px-2.5 py-2 text-white text-xs font-semibold focus:outline-none focus:border-amber-500/50"
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id} disabled={p.id === providerBId}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <div className="text-[11px] text-neutral-400 pt-1 flex items-center gap-1.5">
                    <span>Status atual:</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        codeA === 'T'
                          ? 'bg-[#00d2d3]/20 text-[#00d2d3] border border-[#00d2d3]/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {codeA === 'T' ? 'Trabalha (T)' : 'Descanso (D)'}
                    </span>
                  </div>
                </div>

                {/* Provider B */}
                <div className="space-y-2">
                  <label className="block text-neutral-400 font-semibold text-[10px] uppercase tracking-wider">
                    Colaborador B (Assume Plantão):
                  </label>
                  <select
                    value={providerBId}
                    onChange={e => setProviderBId(e.target.value)}
                    className="w-full bg-[#1b1f2b] border border-white/[0.08] rounded-xl px-2.5 py-2 text-white text-xs font-semibold focus:outline-none focus:border-amber-500/50"
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id} disabled={p.id === providerAId}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <div className="text-[11px] text-neutral-400 pt-1 flex items-center gap-1.5">
                    <span>Status atual:</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        codeB === 'T'
                          ? 'bg-[#00d2d3]/20 text-[#00d2d3] border border-[#00d2d3]/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {codeB === 'T' ? 'Trabalha (T)' : 'Descanso (D)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inversion preview badge */}
              <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Resultado da Troca no Dia {selectedDay}:</span>
                </div>
                <div className="text-neutral-300 text-[11px] leading-relaxed">
                  {provA?.name.split(' ')[0]} passará a ficar como{' '}
                  <strong className={codeB === 'T' ? 'text-[#00d2d3]' : 'text-sky-300'}>
                    {codeB === 'T' ? 'TRABALHA (T)' : 'DESCANSO (D)'}
                  </strong>
                  , e {provB?.name.split(' ')[0]} passará a ficar como{' '}
                  <strong className={codeA === 'T' ? 'text-[#00d2d3]' : 'text-sky-300'}>
                    {codeA === 'T' ? 'TRABALHA (T)' : 'DESCANSO (D)'}
                  </strong>
                  .
                </div>

                {/* Consecutive shift validator */}
                {(() => {
                  const prevDateNum = selectedDay - 1;
                  const nextDateNum = selectedDay + 1;
                  const prevDateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(prevDateNum).padStart(2, '0')}`;
                  const nextDateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(nextDateNum).padStart(2, '0')}`;

                  const willBWork = codeA === 'T';
                  const bHasPrev = willBWork && assignments.some(a => a.providerId === providerBId && a.date === prevDateStr && a.shiftTypeId === 'st-t');
                  const bHasNext = willBWork && assignments.some(a => a.providerId === providerBId && a.date === nextDateStr && a.shiftTypeId === 'st-t');

                  const willAWork = codeB === 'T';
                  const aHasPrev = willAWork && assignments.some(a => a.providerId === providerAId && a.date === prevDateStr && a.shiftTypeId === 'st-t');
                  const aHasNext = willAWork && assignments.some(a => a.providerId === providerAId && a.date === nextDateStr && a.shiftTypeId === 'st-t');

                  const hasConflict = bHasPrev || bHasNext || aHasPrev || aHasNext;
                  if (!hasConflict) return null;

                  return (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>Atenção (Dobra de Turno):</strong> Esta troca resultará em plantões seguidos sem o descanso de 36h para{' '}
                        {bHasPrev || bHasNext ? provB?.name.split(' ')[0] : provA?.name.split(' ')[0]}.
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Motivo ou Justificativa da Troca (opcional):
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex: Acordo pessoal entre as partes, consulta médica..."
                  className="w-full bg-[#161922] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500/50"
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
                  disabled={!provA || !provB || provA.id === provB.id}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  Confirmar Troca Agora
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
