import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT, DAYS_SHORT_PT } from '../../utils/dateUtils';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  X,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface MonthTurnComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetYear: number;
  targetMonthIndex: number;
  onApplySuccess?: (count: number) => void;
}

export const MonthTurnComparisonModal: React.FC<MonthTurnComparisonModalProps> = ({
  isOpen,
  onClose,
  targetYear,
  targetMonthIndex,
  onApplySuccess,
}) => {
  const {
    providers,
    assignments,
    clonePreviousMonthSchedule,
    activeRegime,
  } = useSchedule();

  const [mode, setMode] = useState<'continue_12x36' | 'exact'>('continue_12x36');
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  // Previous month calculations
  let prevYear = targetYear;
  let prevMonthIndex = targetMonthIndex - 1;
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevYear--;
  }

  const prevMonthName = MONTH_NAMES_PT[prevMonthIndex];
  const targetMonthName = MONTH_NAMES_PT[targetMonthIndex];

  const prevDaysCount = new Date(prevYear, prevMonthIndex + 1, 0).getDate();
  const targetDaysCount = new Date(targetYear, targetMonthIndex + 1, 0).getDate();

  // Last 3 days of previous month
  const prevLastDays = [prevDaysCount - 2, prevDaysCount - 1, prevDaysCount];
  // First 3 days of target month
  const targetFirstDays = [1, 2, 3];

  // Filter providers for active regime
  const displayedProviders = providers.filter(
    p => (p.regime || '12x36') === (activeRegime === 'weekend' ? '12x36' : activeRegime)
  );

  // Compute transition preview for each provider
  const transitionData = displayedProviders.map(prov => {
    // Check last days of previous month
    const prevDaysShifts = prevLastDays.map(d => {
      const dateStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const shift = assignments.find(a => a.providerId === prov.id && a.date === dateStr);
      const dayOfWeek = new Date(prevYear, prevMonthIndex, d).getDay();
      return {
        dayNumber: d,
        dateStr,
        dayOfWeekShort: DAYS_SHORT_PT[dayOfWeek],
        code: shift?.shiftTypeId === 'st-t' ? 'T' : (shift?.shiftTypeId === 'st-d' ? 'D' : '-'),
      };
    });

    const lastDayShift = prevDaysShifts[prevDaysShifts.length - 1];
    const workedLastDay = lastDayShift.code === 'T';

    // Projected first 3 days of target month
    const targetDaysShifts = targetFirstDays.map(d => {
      const dateStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(targetYear, targetMonthIndex, d).getDay();

      let projectedCode: 'T' | 'D' = 'D';

      if (prov.regime === '5x2') {
        projectedCode = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 'T' : 'D';
      } else if (mode === 'continue_12x36') {
        if (workedLastDay) {
          projectedCode = d % 2 === 0 ? 'T' : 'D';
        } else {
          projectedCode = d % 2 !== 0 ? 'T' : 'D';
        }
      } else {
        // exact
        const sourceDateStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const sourceShift = assignments.find(a => a.providerId === prov.id && a.date === sourceDateStr);
        projectedCode = sourceShift?.shiftTypeId === 'st-t' ? 'T' : 'D';
      }

      return {
        dayNumber: d,
        dateStr,
        dayOfWeekShort: DAYS_SHORT_PT[dayOfWeek],
        code: projectedCode,
      };
    });

    // Check compliance: if worked last day of prev month AND works day 1 of target month = CONFLICT
    const hasConflict = workedLastDay && targetDaysShifts[0].code === 'T' && prov.regime !== '5x2';

    return {
      provider: prov,
      prevDaysShifts,
      targetDaysShifts,
      hasConflict,
      workedLastDay,
    };
  });

  const conflictsCount = transitionData.filter(t => t.hasConflict).length;

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      const count = clonePreviousMonthSchedule(targetYear, targetMonthIndex, mode);
      setIsApplying(false);
      if (onApplySuccess) onApplySuccess(count);
      onClose();
    }, 400);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#12141A] text-zinc-100 rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden space-y-4 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00d2d3]/15 border border-[#00d2d3]/30 text-[#00d2d3] flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Comparativo da Virada de Mês
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#00d2d3]/20 text-[#00d2d3] border border-[#00d2d3]/30">
                  Continuidade 36h
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Fechamento de <strong className="text-white">{prevMonthName} {prevYear}</strong> ➔ Projeção de <strong className="text-[#00d2d3]">{targetMonthName} {targetYear}</strong>
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

        {/* Mode Selector and Quick Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
          {/* Card 1: Compliance */}
          <div className="p-3 bg-[#1A1D24] rounded-2xl border border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                CONFORMIDADE 36H
              </div>
              <div className="text-xs font-bold text-white">
                {conflictsCount === 0 ? '100% Homologado' : `${conflictsCount} Conflito(s)`}
              </div>
            </div>
          </div>

          {/* Card 2: Strategy Selector */}
          <div className="md:col-span-2 p-2 bg-[#1A1D24] rounded-2xl border border-white/[0.06] flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-zinc-400 px-2 hidden sm:block">
              Estratégia:
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <button
                onClick={() => setMode('continue_12x36')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'continue_12x36'
                    ? 'bg-[#00d2d3] text-[#003731] shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Continuidade 36h (Recomendado)
              </button>
              <button
                onClick={() => setMode('exact')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'exact'
                    ? 'bg-[#00d2d3] text-[#003731] shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Cópia 1 para 1
              </button>
            </div>
          </div>
        </div>

        {/* Transition Table / Matrix */}
        <div className="overflow-y-auto flex-1 pr-1 border border-white/[0.06] rounded-2xl bg-[#0e1017]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-[#161820] text-zinc-300 border-b border-white/[0.08]">
              <tr>
                <th className="py-2.5 px-3 min-w-[180px] font-bold text-white uppercase text-[11px] border-r border-white/[0.06]">
                  Colaborador
                </th>
                <th colSpan={3} className="py-2.5 px-2 text-center font-bold text-zinc-400 uppercase text-[10px] bg-white/[0.02] border-r border-white/[0.06]">
                  Fim de {prevMonthName} ({prevLastDays[0]}º ao {prevLastDays[2]}º)
                </th>
                <th className="py-2.5 px-2 text-center font-bold text-[#00d2d3] w-12 border-r border-white/[0.06]">
                  Virada
                </th>
                <th colSpan={3} className="py-2.5 px-2 text-center font-bold text-[#00d2d3] uppercase text-[10px] bg-[#00d2d3]/[0.03]">
                  Início de {targetMonthName} (1º ao 3º)
                </th>
              </tr>
              <tr className="text-[10px] text-zinc-500 border-t border-white/[0.04]">
                <th className="py-1 px-3 border-r border-white/[0.06]">Nome & Regime</th>
                {prevLastDays.map(d => (
                  <th key={`h-prev-${d}`} className="py-1 px-1 text-center w-10 font-mono">
                    Dia {d}
                  </th>
                ))}
                <th className="py-1 px-1 text-center border-r border-white/[0.06]">36h</th>
                {targetFirstDays.map(d => (
                  <th key={`h-target-${d}`} className="py-1 px-1 text-center w-10 font-mono text-[#00d2d3]">
                    Dia {d}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {transitionData.map(({ provider, prevDaysShifts, targetDaysShifts, hasConflict, workedLastDay }, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={provider.id}
                    className={`${isEven ? 'bg-[#12141A]' : 'bg-[#151720]'} hover:bg-white/[0.03] transition-colors`}
                  >
                    {/* Provider Name */}
                    <td className="py-2.5 px-3 border-r border-white/[0.06]">
                      <div className="font-bold text-white text-xs truncate max-w-[200px]">
                        {provider.name}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Regime {provider.regime || '12×36'} • {provider.role || 'Prestador'}
                      </div>
                    </td>

                    {/* Prev Month Days */}
                    {prevDaysShifts.map(s => (
                      <td key={`p-${provider.id}-${s.dayNumber}`} className="py-2 px-1 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-6 rounded-md font-bold text-[11px] ${
                            s.code === 'T'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : s.code === 'D'
                              ? 'bg-[#27272a] text-zinc-400'
                              : 'bg-white/[0.03] text-zinc-600'
                          }`}
                        >
                          {s.code}
                        </span>
                      </td>
                    ))}

                    {/* Transition Indicator */}
                    <td className="py-2 px-1 text-center border-r border-white/[0.06]">
                      {hasConflict ? (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400"
                          title="Atenção: Plantões consecutivos na virada!"
                        >
                          ⚠
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400"
                          title="Descanso de 36h respeitado"
                        >
                          ➔
                        </span>
                      )}
                    </td>

                    {/* Target Month Days */}
                    {targetDaysShifts.map(s => (
                      <td key={`t-${provider.id}-${s.dayNumber}`} className="py-2 px-1 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-6 rounded-md font-bold text-[11px] ${
                            s.code === 'T'
                              ? 'bg-[#00d2d3]/20 text-[#00d2d3] border border-[#00d2d3]/40'
                              : 'bg-[#27272a] text-zinc-400'
                          }`}
                        >
                          {s.code}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-[#00d2d3]" />
            <span>
              Projeção calculada para <strong>{displayedProviders.length} colaboradores</strong> em {targetMonthName}/{targetYear}.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1A1D24] hover:bg-[#252830] text-zinc-300 border border-white/[0.08] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="px-5 py-2 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#003731]" />
              <span>{isApplying ? 'Projetando...' : `Aplicar Escala de ${targetMonthName}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
