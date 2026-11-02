import React from 'react';
import { Plus, AlertCircle, Clock } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { buildMonthCalendarMatrix, DAYS_SHORT_PT } from '../../utils/dateUtils';
import { ShiftAssignment } from '../../types';

interface MonthCalendarViewProps {
  onSelectShift: (shift: ShiftAssignment) => void;
  onAddShiftDate: (dateStr: string) => void;
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  onSelectShift,
  onAddShiftDate,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    assignments,
    providers,
    shiftTypes,
    departments,
    filters,
    role,
    activeProviderId
  } = useSchedule();

  const calendarWeeks = buildMonthCalendarMatrix(currentYear, currentMonthIndex);

  // Filter assignments
  const filteredAssignments = assignments.filter(shift => {
    if (filters.departmentId !== 'all' && shift.departmentId !== filters.departmentId) return false;
    if (filters.shiftTypeId !== 'all' && shift.shiftTypeId !== filters.shiftTypeId) return false;
    if (filters.onlyOpenSpots && shift.providerId !== null) return false;
    if (filters.providerId !== 'all' && shift.providerId !== filters.providerId) return false;

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const prov = providers.find(p => p.id === shift.providerId);
      const dept = departments.find(d => d.id === shift.departmentId);
      const st = shiftTypes.find(s => s.id === shift.shiftTypeId);
      const matchName = prov?.name.toLowerCase().includes(q);
      const matchDept = dept?.name.toLowerCase().includes(q);
      const matchNotes = shift.notes?.toLowerCase().includes(q);
      const matchType = st?.name.toLowerCase().includes(q) || st?.code.toLowerCase().includes(q);
      if (!matchName && !matchDept && !matchNotes && !matchType) return false;
    }

    return true;
  });

  return (
    <div className="bg-[#1e293b] rounded-3xl border border-slate-700/80 shadow-md overflow-hidden text-slate-200">
      {/* Calendar Header Row: Day Names */}
      <div className="grid grid-cols-7 border-b border-slate-700 bg-[#162032] text-center text-xs font-bold text-slate-300">
        {DAYS_SHORT_PT.map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-3 border-r last:border-r-0 border-slate-700 ${
              idx === 0 || idx === 6 ? 'text-amber-300 font-extrabold bg-amber-950/20' : ''
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Weeks & Days Grid */}
      <div className="divide-y divide-slate-700/80">
        {calendarWeeks.map((week, weekIdx) => (
          <div key={`week-${weekIdx}`} className="grid grid-cols-7 divide-x divide-slate-700/80 min-h-[145px]">
            {week.map(cell => {
              const dayShifts = filteredAssignments.filter(a => a.date === cell.dateStr);

              return (
                <div
                  key={cell.dateStr}
                  className={`p-2 flex flex-col justify-between group transition-colors relative ${
                    cell.isCurrentMonth ? 'bg-[#1e293b]' : 'bg-[#141e30]/80 text-slate-500'
                  } ${cell.isToday ? 'bg-emerald-950/30 ring-1 ring-inset ring-emerald-500' : ''}`}
                >
                  {/* Cell Top: Day Number and Add Button */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                        cell.isToday
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : cell.isCurrentMonth
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick Add Shift button for supervisor */}
                    {role === 'supervisor' && cell.isCurrentMonth && (
                      <button
                        onClick={() => onAddShiftDate(cell.dateStr)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-opacity cursor-pointer"
                        title="Adicionar plantão neste dia"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Shifts in this Day */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[115px]">
                    {dayShifts.map(shift => {
                      const prov = providers.find(p => p.id === shift.providerId);
                      const st = shiftTypes.find(s => s.id === shift.shiftTypeId);
                      const isMyShift = role === 'provider' && shift.providerId === activeProviderId;
                      const isUnassigned = !shift.providerId;

                      // Style colors
                      let badgeStyle = 'bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800';
                      if (isUnassigned) {
                        badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900/80';
                      } else if (isMyShift) {
                        badgeStyle = 'bg-emerald-950/70 text-emerald-300 border-emerald-700 ring-1 ring-emerald-500 shadow-2xs';
                      } else if (st?.code.startsWith('N')) {
                        badgeStyle = 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80 hover:bg-indigo-900/80';
                      } else if (st?.code.startsWith('D')) {
                        badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/80';
                      } else {
                        badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/80';
                      }

                      return (
                        <button
                          key={shift.id}
                          onClick={() => onSelectShift(shift)}
                          className={`w-full text-left p-1.5 rounded-xl border text-xs leading-tight transition-all block cursor-pointer ${badgeStyle}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-extrabold text-[10px] tracking-wide uppercase">
                              {st?.code || 'Turno'}
                            </span>
                            <span className="text-[10px] opacity-75 font-medium">
                              {st?.startTime}
                            </span>
                          </div>

                          <div className="truncate font-bold flex items-center gap-1 text-[11px]">
                            {isUnassigned ? (
                              <span className="text-rose-400 font-extrabold flex items-center gap-1">
                                <AlertCircle className="w-2.5 h-2.5" />
                                Vaga Aberta
                              </span>
                            ) : (
                              <>
                                <span className="truncate">{prov?.name || 'Desconhecido'}</span>
                                {isMyShift && (
                                  <span className="text-[9px] bg-emerald-600 text-white px-1 rounded-sm font-black shrink-0">
                                    EU
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {dayShifts.length === 0 && cell.isCurrentMonth && (
                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-40 text-[10px] text-slate-500">
                        {role === 'supervisor' ? '+ Adicionar' : 'Sem plantões'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
