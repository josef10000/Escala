import React from 'react';
import { Plus, AlertCircle, Clock, User, MapPin, CalendarDays } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { formatFriendlyDate } from '../../utils/dateUtils';
import { ShiftAssignment } from '../../types';

interface AgendaViewProps {
  onSelectShift: (shift: ShiftAssignment) => void;
  onAddShiftDate: (dateStr: string) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
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

  // Filter assignments for current month
  const filtered = assignments.filter(shift => {
    const [y, m] = shift.date.split('-').map(Number);
    if (y !== currentYear || m !== currentMonthIndex + 1) return false;

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

  // Group by date
  const groupedByDate: { [dateStr: string]: ShiftAssignment[] } = {};
  filtered.forEach(shift => {
    if (!groupedByDate[shift.date]) {
      groupedByDate[shift.date] = [];
    }
    groupedByDate[shift.date].push(shift);
  });

  const sortedDates = Object.keys(groupedByDate).sort();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-[#1e293b] rounded-3xl border border-slate-700/80 shadow-md overflow-hidden text-slate-200">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-[#162032]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-800/70">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Programação Diária de Plantões
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Lista sequencial organizada dia a dia
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-300 font-bold bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700 shadow-2xs">
          {filtered.length} plantões cadastrados
        </span>
      </div>

      {sortedDates.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          Nenhum plantão agendado para os filtros selecionados.
        </div>
      ) : (
        <div className="divide-y divide-slate-700/70">
          {sortedDates.map(dateStr => {
            const dayShifts = groupedByDate[dateStr];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`p-4 transition-colors ${
                  isToday ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-extrabold text-white">
                      {formatFriendlyDate(dateStr, true)}
                    </span>
                    {isToday && (
                      <span className="bg-emerald-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-2xs">
                        Hoje
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">
                      · {dayShifts.length} {dayShifts.length === 1 ? 'plantonista' : 'plantonistas'}
                    </span>
                  </div>

                  {role === 'supervisor' && (
                    <button
                      onClick={() => onAddShiftDate(dateStr)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  )}
                </div>

                {/* Day Shifts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {dayShifts.map(shift => {
                    const prov = providers.find(p => p.id === shift.providerId);
                    const st = shiftTypes.find(s => s.id === shift.shiftTypeId);
                    const dept = departments.find(d => d.id === shift.departmentId);
                    const isMyShift = role === 'provider' && shift.providerId === activeProviderId;
                    const isUnassigned = !shift.providerId;

                    let cardColor = 'bg-slate-900/70 border-slate-700/80 text-slate-200 hover:border-slate-600';
                    if (isUnassigned) {
                      cardColor = 'bg-rose-950/50 border-rose-800/80 text-rose-200';
                    } else if (isMyShift) {
                      cardColor = 'bg-emerald-950/50 border-emerald-700 text-emerald-200 ring-1 ring-emerald-500';
                    }

                    return (
                      <div
                        key={shift.id}
                        onClick={() => onSelectShift(shift)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:shadow-xs ${cardColor}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`font-bold text-[10px] px-2 py-0.5 rounded-lg border ${
                              st?.code.startsWith('N')
                                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80'
                                : st?.code.startsWith('D')
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                            }`}
                          >
                            {st?.code} · {st?.name}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {st?.startTime} - {st?.endTime}
                          </span>
                        </div>

                        <div className="font-extrabold text-sm text-white mt-1 truncate">
                          {isUnassigned ? (
                            <span className="text-rose-400 flex items-center gap-1 font-extrabold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              VAGA ABERTA
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {prov?.name}
                            </span>
                          )}
                        </div>

                        <div className="text-slate-400 text-xs mt-1 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{dept?.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
