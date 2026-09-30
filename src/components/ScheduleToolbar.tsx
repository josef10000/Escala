import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Users,
  Wand2,
  CalendarCheck
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { MONTH_NAMES_PT } from '../utils/dateUtils';

interface ScheduleToolbarProps {
  onOpenAutoScheduleModal?: () => void;
  onOpenProviderModal?: () => void;
}

export const ScheduleToolbar: React.FC<ScheduleToolbarProps> = ({
  onOpenAutoScheduleModal,
  onOpenProviderModal,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    filters,
    setFilters,
    resetFilters,
    providers,
    shiftTypes,
    role,
  } = useSchedule();

  const isFilterActive = filters.providerId !== 'all' || filters.shiftTypeId !== 'all' || filters.searchQuery.trim().length > 0;

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 py-3.5 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 min-w-[140px] text-center">
              <span className="text-sm font-bold text-white">
                {MONTH_NAMES_PT[currentMonthIndex]}
              </span>{' '}
              <span className="text-sm font-semibold text-slate-400 font-mono-nums">
                {currentYear}
              </span>
            </div>
            <button
              onClick={goToNextMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
          >
            Mês Atual
          </button>

          {/* Quick Supervisor shortcuts */}
          {role === 'supervisor' && (
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
              {onOpenProviderModal && (
                <button
                  onClick={onOpenProviderModal}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Equipe ({providers.length})</span>
                </button>
              )}
              {onOpenAutoScheduleModal && (
                <button
                  onClick={onOpenAutoScheduleModal}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-lg transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Preenchimento 12x36</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Clean Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Provider Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs hidden sm:inline">Colaborador:</span>
            <select
              value={filters.providerId}
              onChange={e => setFilters(prev => ({ ...prev, providerId: e.target.value }))}
              className="bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Todos os colaboradores</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs hidden sm:inline">Turno:</span>
            <select
              value={filters.shiftTypeId}
              onChange={e => setFilters(prev => ({ ...prev, shiftTypeId: e.target.value }))}
              className="bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Todos os horários</option>
              {shiftTypes.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.searchQuery}
              onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-xs placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none w-32 sm:w-40"
            />
          </div>

          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Limpar filtros"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
