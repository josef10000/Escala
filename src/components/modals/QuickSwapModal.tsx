import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT, getMonthDaysArray, formatDateToISO } from '../../utils/dateUtils';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white border border-slate-200/90 text-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Troca Rápida de Plantão</h3>
              <p className="text-xs text-slate-500 font-medium">Permutar a escala entre dois colaboradores em 1 clique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-in fade-in">
            <Check className="w-5 h-5 shrink-0 text-emerald-600" />
            <p className="font-semibold">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleExecuteSwap} className="space-y-4 text-xs">
            {/* Day Selector */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Selecione o Dia do Mês ({monthName} de {currentYear}):
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDay}
                  onChange={e => setSelectedDay(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                >
                  {daysInMonth.map(d => (
                    <option key={d.dayNumber} value={d.dayNumber}>
                      Dia {String(d.dayNumber).padStart(2, '0')} ({d.isWeekend ? 'Fim de Semana' : 'Dia útil'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Providers comparison box */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              {/* Provider A */}
              <div className="space-y-2">
                <label className="block text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  Colaborador A (Sai do Plantão):
                </label>
                <select
                  value={providerAId}
                  onChange={e => setProviderAId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs font-semibold focus:outline-none"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === providerBId}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <div className="text-[11px] text-slate-600 pt-1">
                  Status atual:
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-md font-bold text-xs ${
                      codeA === 'T'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-sky-100 text-sky-800 border border-sky-300'
                    }`}
                  >
                    {codeA === 'T' ? 'Trabalha (T)' : 'Descanso (D)'}
                  </span>
                </div>
              </div>

              {/* Provider B */}
              <div className="space-y-2">
                <label className="block text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  Colaborador B (Assume Plantão):
                </label>
                <select
                  value={providerBId}
                  onChange={e => setProviderBId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs font-semibold focus:outline-none"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === providerAId}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <div className="text-[11px] text-slate-600 pt-1">
                  Status atual:
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-md font-bold text-xs ${
                      codeB === 'T'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-sky-100 text-sky-800 border border-sky-300'
                    }`}
                  >
                    {codeB === 'T' ? 'Trabalha (T)' : 'Descanso (D)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Inversion preview badge */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                <span>Resultado da Troca no Dia {selectedDay}:</span>
              </div>
              <div className="text-slate-600 text-[11px]">
                {provA?.name.split(' ')[0]} passará a ficar como{' '}
                <strong className={codeB === 'T' ? 'text-emerald-700' : 'text-sky-700'}>
                  {codeB === 'T' ? 'TRABALHA (T)' : 'DESCANSO (D)'}
                </strong>
                , e {provB?.name.split(' ')[0]} passará a ficar como{' '}
                <strong className={codeA === 'T' ? 'text-emerald-700' : 'text-sky-700'}>
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
                  <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
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
              <label className="block text-slate-700 font-bold mb-1">
                Motivo ou Justificativa da Troca (opcional):
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex: Acordo pessoal entre as partes, consulta médica..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!provA || !provB || provA.id === provB.id}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-98"
              >
                Confirmar Troca Agora
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
