import React from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { getMonthDaysArray, DAYS_SHORT_PT } from '../../utils/dateUtils';
import { ShiftAssignment, Provider } from '../../types';
import { AlertCircle, Clock, Plus, ShieldCheck } from 'lucide-react';

interface MatrixViewProps {
  onSelectShift: (shift: ShiftAssignment) => void;
  onAddShiftDateAndProvider: (dateStr: string, providerId: string) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  onSelectShift,
  onAddShiftDateAndProvider,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    providers,
    assignments,
    shiftTypes,
    role,
    activeProviderId,
    filters,
  } = useSchedule();

  const daysInMonth = getMonthDaysArray(currentYear, currentMonthIndex);

  // Filter providers if provider filter is active
  const displayedProviders = providers.filter(p => {
    if (filters.providerId !== 'all') {
      return p.id === filters.providerId;
    }
    return true;
  });

  // Calculate monthly hours and shift counts per provider
  const getProviderMonthStats = (providerId: string) => {
    const provShifts = assignments.filter(a => {
      const [y, m] = a.date.split('-').map(Number);
      return a.providerId === providerId && y === currentYear && m === currentMonthIndex + 1;
    });

    const totalHours = provShifts.reduce((acc, curr) => {
      const st = shiftTypes.find(s => s.id === curr.shiftTypeId);
      return acc + (st?.durationHours || 0);
    }, 0);

    return {
      shiftsCount: provShifts.length,
      totalHours,
    };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Matrix Controls / Guide Info */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <strong className="text-slate-800 font-semibold">Legenda de Turnos:</strong>
          {shiftTypes.map(st => (
            <div key={st.id} className="flex items-center gap-1">
              <span className="font-mono-nums font-bold text-slate-800 bg-white border border-slate-300 px-1.5 py-0.5 rounded-sm text-[11px]">
                {st.code}
              </span>
              <span className="text-slate-500 hidden sm:inline">{st.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <span className="font-mono-nums text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm text-[11px]">
              -
            </span>
            <span className="text-slate-400">Folga</span>
          </div>
        </div>

        <div className="text-slate-500 text-xs">
          {role === 'supervisor' ? (
            <span>💡 Clique em qualquer célula vazia para escalar um prestador</span>
          ) : (
            <span>Visualização da grade de escala de todos os colaboradores</span>
          )}
        </div>
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {/* Row 1: Weekday indicators */}
            <tr className="bg-slate-100 text-slate-500 font-mono-nums border-b border-slate-200">
              <th className="sticky left-0 z-20 bg-slate-100 p-2 font-medium border-r border-slate-200 min-w-[200px] text-slate-700">
                Colaborador / Função
              </th>
              {daysInMonth.map(d => (
                <th
                  key={`dayname-${d.dateStr}`}
                  className={`p-1 text-center font-medium border-r border-slate-200 min-w-[34px] ${
                    d.isWeekend ? 'bg-indigo-50/50 text-indigo-700' : ''
                  }`}
                >
                  {DAYS_SHORT_PT[d.dayOfWeek].charAt(0)}
                </th>
              ))}
              <th className="p-2 text-center font-medium border-l border-slate-200 min-w-[70px] text-slate-700">
                Plantões
              </th>
              <th className="p-2 text-center font-medium min-w-[80px] text-slate-700">
                Horas / Teto
              </th>
            </tr>

            {/* Row 2: Day numbers */}
            <tr className="bg-slate-50 text-slate-800 font-mono-nums border-b border-slate-200 font-semibold">
              <th className="sticky left-0 z-20 bg-slate-50 p-2 border-r border-slate-200 text-slate-600">
                Dia do Mês
              </th>
              {daysInMonth.map(d => (
                <th
                  key={`daynum-${d.dateStr}`}
                  className={`p-1 text-center border-r border-slate-200 ${
                    d.isWeekend ? 'bg-indigo-50/50 text-indigo-900 font-bold' : ''
                  }`}
                >
                  {d.dayNumber}
                </th>
              ))}
              <th className="p-2 text-center border-l border-slate-200 text-slate-600">
                Total
              </th>
              <th className="p-2 text-center text-slate-600">
                Saldo
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {displayedProviders.map(provider => {
              const isSelectedProvider = role === 'provider' && provider.id === activeProviderId;
              const stats = getProviderMonthStats(provider.id);
              const isNearLimit = stats.totalHours >= provider.maxMonthlyHours * 0.9;
              const isOverLimit = stats.totalHours > provider.maxMonthlyHours;

              return (
                <tr
                  key={provider.id}
                  className={`transition-colors group hover:bg-slate-50/80 ${
                    isSelectedProvider ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-200' : ''
                  }`}
                >
                  {/* Provider Info Column (Sticky on left scroll) */}
                  <td
                    className={`sticky left-0 z-10 p-2 border-r border-slate-200 whitespace-nowrap ${
                      isSelectedProvider ? 'bg-indigo-50/90' : 'bg-white group-hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                          provider.color === 'emerald'
                            ? 'bg-emerald-600'
                            : provider.color === 'sky'
                            ? 'bg-sky-600'
                            : provider.color === 'purple'
                            ? 'bg-purple-600'
                            : provider.color === 'indigo'
                            ? 'bg-indigo-600'
                            : provider.color === 'amber'
                            ? 'bg-amber-600'
                            : 'bg-rose-600'
                        }`}
                      >
                        {provider.name.charAt(0)}
                      </div>
                      <div className="truncate max-w-[150px]">
                        <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                          {provider.name}
                          {isSelectedProvider && (
                            <span className="text-[9px] bg-indigo-600 text-white px-1 rounded-xs uppercase font-bold">
                              Eu
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{provider.role}</div>
                      </div>
                    </div>
                  </td>

                  {/* Days Cells */}
                  {daysInMonth.map(day => {
                    const shift = assignments.find(
                      a => a.date === day.dateStr && a.providerId === provider.id
                    );
                    const shiftType = shift ? shiftTypes.find(s => s.id === shift.shiftTypeId) : null;

                    return (
                      <td
                        key={`${provider.id}-${day.dateStr}`}
                        className={`p-1 text-center border-r border-slate-200 font-mono-nums ${
                          day.isWeekend ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        {shift && shiftType ? (
                          <button
                            onClick={() => onSelectShift(shift)}
                            className={`w-full py-1 px-0.5 rounded-sm font-bold text-[10px] tracking-tight transition-transform hover:scale-105 ${
                              shiftType.code.startsWith('N')
                                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                : shiftType.code.startsWith('D')
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                            title={`${shiftType.name} (${shiftType.startTime} - ${shiftType.endTime})`}
                          >
                            {shiftType.code}
                          </button>
                        ) : (
                          <div className="relative group/cell py-1">
                            {role === 'supervisor' ? (
                              <button
                                onClick={() => onAddShiftDateAndProvider(day.dateStr, provider.id)}
                                className="w-full text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xs py-0.5 transition-colors text-[10px]"
                                title={`Escalar ${provider.name} no dia ${day.dayNumber}`}
                              >
                                ·
                              </button>
                            ) : (
                              <span className="text-slate-300 text-[10px]">-</span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Summary Totals */}
                  <td className="p-2 text-center border-l border-slate-200 font-mono-nums font-semibold text-slate-800">
                    {stats.shiftsCount}
                  </td>
                  <td className="p-2 text-center font-mono-nums">
                    <span
                      className={`font-semibold text-xs ${
                        isOverLimit
                          ? 'text-rose-600'
                          : isNearLimit
                          ? 'text-amber-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {stats.totalHours}h
                    </span>
                    <span className="text-[10px] text-slate-400">/{provider.maxMonthlyHours}h</span>
                  </td>
                </tr>
              );
            })}

            {/* Unassigned Shifts Row (Vagas Abertas) */}
            <tr className="bg-amber-50/30 border-t-2 border-amber-200 font-semibold text-slate-800">
              <td className="sticky left-0 z-10 p-2 bg-amber-50 border-r border-slate-200 whitespace-nowrap text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Vagas em Aberto</span>
              </td>
              {daysInMonth.map(day => {
                const openShifts = assignments.filter(
                  a => a.date === day.dateStr && a.providerId === null
                );
                return (
                  <td
                    key={`open-${day.dateStr}`}
                    className="p-1 text-center border-r border-slate-200 font-mono-nums"
                  >
                    {openShifts.length > 0 ? (
                      <div className="space-y-0.5">
                        {openShifts.map(s => {
                          const st = shiftTypes.find(t => t.id === s.shiftTypeId);
                          return (
                            <button
                              key={s.id}
                              onClick={() => onSelectShift(s)}
                              className="w-full py-0.5 bg-amber-200 text-amber-900 rounded-xs text-[9px] font-bold border border-amber-300"
                              title="Vaga aberta precisando de prestador"
                            >
                              {st?.code || 'VAGA'}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[10px]">-</span>
                    )}
                  </td>
                );
              })}
              <td className="p-2 text-center border-l border-slate-200 font-mono-nums font-bold text-amber-900">
                {assignments.filter(a => {
                  const [y, m] = a.date.split('-').map(Number);
                  return !a.providerId && y === currentYear && m === currentMonthIndex + 1;
                }).length}
              </td>
              <td className="p-2 text-center text-slate-400 font-mono-nums text-xs">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
