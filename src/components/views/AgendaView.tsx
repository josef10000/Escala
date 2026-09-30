import React from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { formatFriendlyDate, formatShortDate } from '../../utils/dateUtils';
import { ShiftAssignment } from '../../types';
import { Clock, MapPin, User, AlertCircle, Plus } from 'lucide-react';

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

  // Filter shifts
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
      const matchName = prov?.name.toLowerCase().includes(q);
      const matchDept = dept?.name.toLowerCase().includes(q);
      if (!matchName && !matchDept) return false;
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
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div>
          <h3 className="text-sm font-bold text-white">
            Programação Diária de Plantões
          </h3>
          <p className="text-xs text-slate-400">
            Lista sequencial organizada por data
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono-nums">
          {filtered.length} plantões cadastrados
        </span>
      </div>

      {sortedDates.length === 0 ? (
        <div className="p-16 text-center text-slate-500 text-sm">
          Nenhum plantão agendado para os filtros selecionados.
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {sortedDates.map(dateStr => {
            const dayShifts = groupedByDate[dateStr];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`p-4 transition-colors ${
                  isToday ? 'bg-indigo-950/20' : 'hover:bg-slate-800/30'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-white">
                      {formatFriendlyDate(dateStr, true)}
                    </span>
                    {isToday && (
                      <span className="bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                        Hoje
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono-nums">
                      · {dayShifts.length} {dayShifts.length === 1 ? 'plantonista' : 'plantonistas'}
                    </span>
                  </div>

                  {role === 'supervisor' && (
                    <button
                      onClick={() => onAddShiftDate(dateStr)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
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

                    let cardColor = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700';
                    if (isUnassigned) {
                      cardColor = 'bg-rose-950/40 border-rose-800/80 text-rose-200';
                    } else if (isMyShift) {
                      cardColor = 'bg-indigo-950/50 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500';
                    }

                    return (
                      <div
                        key={shift.id}
                        onClick={() => onSelectShift(shift)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardColor}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`font-mono-nums font-bold text-[10px] px-2 py-0.5 rounded-md border ${
                              st?.code.startsWith('N')
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : st?.code.startsWith('D')
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {st?.code} · {st?.name}
                          </span>
                          <span className="text-[11px] font-mono-nums text-slate-400">
                            {st?.startTime} - {st?.endTime}
                          </span>
                        </div>

                        <div className="font-bold text-sm text-white mt-1 truncate">
                          {isUnassigned ? (
                            <span className="text-rose-400 flex items-center gap-1 font-bold">
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

                        <div className="text-slate-400 text-xs mt-1 flex items-center gap-1">
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
