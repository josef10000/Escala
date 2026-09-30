import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, AlertCircle, Clock } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { getWeekDaysRange, DAYS_FULL_PT } from '../../utils/dateUtils';
import { ShiftAssignment } from '../../types';

interface WeekViewProps {
  onSelectShift: (shift: ShiftAssignment) => void;
  onAddShiftDate: (dateStr: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  onSelectShift,
  onAddShiftDate,
}) => {
  const {
    assignments,
    providers,
    shiftTypes,
    departments,
    filters,
    role,
    activeProviderId
  } = useSchedule();

  const [currentWeekRefDate, setCurrentWeekRefDate] = useState<Date>(new Date());
  const weekDays = getWeekDaysRange(currentWeekRefDate);

  const prevWeek = () => {
    setCurrentWeekRefDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const nextWeek = () => {
    setCurrentWeekRefDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const thisWeek = () => {
    setCurrentWeekRefDate(new Date());
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Week Navigator Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={prevWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-xs font-semibold text-slate-800">
              {weekDays[0].dayNumber} - {weekDays[6].dayNumber} de {weekDays[0].dateStr.slice(0, 7)}
            </div>
            <button
              onClick={nextWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={thisWeek}
            className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-medium"
          >
            Esta Semana
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Visualização detalhada dos 7 dias da semana
        </div>
      </div>

      {/* 7 Columns for the week */}
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[500px]">
        {weekDays.map(day => {
          const dayShifts = assignments.filter(a => {
            if (a.date !== day.dateStr) return false;
            if (filters.departmentId !== 'all' && a.departmentId !== filters.departmentId) return false;
            if (filters.shiftTypeId !== 'all' && a.shiftTypeId !== filters.shiftTypeId) return false;
            if (filters.onlyOpenSpots && a.providerId !== null) return false;
            if (filters.providerId !== 'all' && a.providerId !== filters.providerId) return false;
            return true;
          });

          return (
            <div
              key={day.dateStr}
              className={`flex flex-col ${day.isToday ? 'bg-indigo-50/20' : 'bg-white'}`}
            >
              {/* Day Column Header */}
              <div
                className={`p-3 border-b border-slate-200 text-center ${
                  day.isToday ? 'bg-indigo-100/50 text-indigo-900' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider">{day.dayName}</div>
                <div className="text-lg font-bold font-mono-nums mt-0.5">{day.dayNumber}</div>
                {role === 'supervisor' && (
                  <button
                    onClick={() => onAddShiftDate(day.dateStr)}
                    className="mt-1 w-full flex items-center justify-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-white/80 hover:bg-white border border-slate-200 rounded-md py-1 font-medium transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar</span>
                  </button>
                )}
              </div>

              {/* Day Shifts Stack */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                {dayShifts.map(shift => {
                  const prov = providers.find(p => p.id === shift.providerId);
                  const st = shiftTypes.find(s => s.id === shift.shiftTypeId);
                  const dept = departments.find(d => d.id === shift.departmentId);
                  const isMyShift = role === 'provider' && shift.providerId === activeProviderId;
                  const isUnassigned = !shift.providerId;

                  return (
                    <button
                      key={shift.id}
                      onClick={() => onSelectShift(shift)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all shadow-2xs block ${
                        isUnassigned
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : isMyShift
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold ring-1 ring-indigo-400'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`font-mono-nums font-bold text-[10px] px-1.5 py-0.5 rounded-xs border ${
                            st?.code.startsWith('N')
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              : st?.code.startsWith('D')
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {st?.code}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono-nums">
                          {st?.startTime} - {st?.endTime}
                        </span>
                      </div>

                      <div className="font-bold text-xs truncate">
                        {isUnassigned ? (
                          <span className="text-amber-700 flex items-center gap-1 font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            Vaga em Aberto
                          </span>
                        ) : (
                          prov?.name
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {dept?.name}
                      </div>
                    </button>
                  );
                })}

                {dayShifts.length === 0 && (
                  <div className="h-32 flex items-center justify-center text-slate-400 text-xs italic">
                    Sem plantões
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
