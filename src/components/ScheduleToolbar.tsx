import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Wand2,
  Copy,
  ArrowLeftRight,
  Printer,
  Users,
  Scale,
  FileSpreadsheet,
  ShieldAlert
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { MONTH_NAMES_PT, formatDateToISO, DAYS_SHORT_PT } from '../utils/dateUtils';

interface ScheduleToolbarProps {
  onOpenLeaderAuth?: () => void;
  onOpenAutoScheduleModal?: () => void;
  onOpenProviderModal?: () => void;
  onOpenCloneModal?: () => void;
  onOpenWhatsAppModal?: () => void;
  onOpenQuickSwapModal?: () => void;
  onOpenPrintModal?: () => void;
  onOpenBalanceModal?: () => void;
  onOpenExecutiveReportModal?: () => void;
  onOpenIncidentModal?: () => void;
}

export const ScheduleToolbar: React.FC<ScheduleToolbarProps> = ({
  onOpenAutoScheduleModal,
  onOpenProviderModal,
  onOpenCloneModal,
  onOpenQuickSwapModal,
  onOpenPrintModal,
  onOpenBalanceModal,
  onOpenExecutiveReportModal,
  onOpenIncidentModal,
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
    assignments,
    role,
    isMonthPublished,
    toggleMonthPublishStatus,
    activeRegime,
    setActiveRegime,
  } = useSchedule();

  const isFilterActive = filters.providerId !== 'all' || filters.searchQuery.trim().length > 0;
  const isCurrentMonthPublished = isMonthPublished(currentYear, currentMonthIndex);

  // Calculate today's live duty metrics
  const todayISO = formatDateToISO(new Date());
  const todayDateObj = new Date();
  const todayDayNum = todayDateObj.getDate();
  const todayMonthIdx = todayDateObj.getMonth();
  const todayWeekDayShort = DAYS_SHORT_PT[todayDateObj.getDay()];

  const todayShifts = assignments.filter(a => a.date === todayISO);
  const regimeProviders = providers.filter(p => (p.regime || '12x36') === activeRegime);
  
  const workingToday = regimeProviders.map(prov => {
    const shift = todayShifts.find(a => a.providerId === prov.id);
    return {
      isWorking: shift?.shiftTypeId === 'st-t',
      modality: shift?.workModality || 'presencial',
    };
  }).filter(item => item.isWorking);

  const todayWorkingCount = workingToday.length;
  const todayPresencialCount = workingToday.filter(w => w.modality === 'presencial').length;
  const todayHoCount = workingToday.filter(w => w.modality === 'home_office').length;
  const todayRestingCount = Math.max(0, regimeProviders.length - todayWorkingCount);

  return (
    <div className="bg-[#141c28] border border-[#1e2a3a] rounded-2xl py-2.5 px-3.5 sm:px-4 text-slate-200 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Escalador Title / Month Navigator + Regime Switcher + Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="text-sm font-black tracking-tight text-white pr-2 border-r border-slate-800 hidden sm:block">
            Escalador
          </div>

          {/* Navigator arrows */}
          <div className="flex items-center bg-[#0c121c] p-0.5 rounded-xl border border-[#1e2a3a]">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center min-w-[120px]">
              <span className="text-xs font-extrabold text-white capitalize">
                {MONTH_NAMES_PT[currentMonthIndex]}
              </span>{' '}
              <span className="text-xs font-semibold text-cyan-400">
                {currentYear}
              </span>
            </div>
            <button
              onClick={goToNextMonth}
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Electric Blue & Cyan "Hoje" Button */}
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 border border-blue-400/40 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-950/50"
            title="Ir para o mês atual"
          >
            Hoje
          </button>

          {/* Regime Switcher Toggle (12x36 vs 5x2) in Cyan/Electric Blue */}
          <div className="flex items-center bg-[#0c121c] p-0.5 rounded-xl border border-[#1e2a3a]">
            <button
              onClick={() => setActiveRegime('12x36')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeRegime === '12x36'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
              title="Escala Técnica 12x36"
            >
              12x36
            </button>
            <button
              onClick={() => setActiveRegime('5x2')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeRegime === '5x2'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
              title="Escala 5x2 (Segunda a Sexta)"
            >
              5x2
            </button>
          </div>

          {/* Publication status badge in Electric Blue & Cyan */}
          {role === 'supervisor' ? (
            <button
              onClick={() => toggleMonthPublishStatus(currentYear, currentMonthIndex)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isCurrentMonthPublished
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/50 hover:bg-cyan-500/25 shadow-sm shadow-cyan-950/40'
                  : 'bg-amber-950/50 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
              }`}
              title="Clique para alternar entre Escala Oficial e Rascunho"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCurrentMonthPublished ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]' : 'bg-amber-400'
                }`}
              />
              <span>
                {isCurrentMonthPublished ? 'Escala Oficial' : 'Rascunho Interno'}
              </span>
            </button>
          ) : (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
              isCurrentMonthPublished
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-950/40'
                : 'bg-amber-950/50 text-amber-300 border-amber-800/80'
            }`}>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCurrentMonthPublished ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]' : 'bg-amber-400'
                }`}
              />
              <span>
                {isCurrentMonthPublished ? 'Escala Oficial' : 'Rascunho'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Live Today Duty Numerical Metric in Cyan */}
        <div className="hidden xl:flex items-center gap-2 bg-[#0c121c] px-3.5 py-1.5 rounded-xl border border-[#1e2a3a] text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)] animate-pulse" />
            <span>Hoje ({todayWeekDayShort}, {todayDayNum}/{MONTH_NAMES_PT[todayMonthIdx].substring(0, 3)}):</span>
          </div>
          <span className="font-black text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-700/60 shadow-xs">
            {todayWorkingCount} Plantonistas
          </span>
          {todayHoCount > 0 && (
            <span className="text-purple-300 text-xs font-semibold">
              ({todayPresencialCount} Presencial • {todayHoCount} HO)
            </span>
          )}
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 text-xs font-medium">
            {todayRestingCount} de Folga
          </span>
        </div>

        {/* Right: Imprimir, Buscar, and Tools in Electric Blue & Cyan */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Supervisor Tools */}
          {role === 'supervisor' && (
            <div className="flex items-center gap-1.5 pr-2 border-r border-[#1e2a3a]">
              {onOpenExecutiveReportModal && (
                <button
                  onClick={onOpenExecutiveReportModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/40 rounded-xl transition-all font-bold shadow-md shadow-blue-950/40 cursor-pointer active:scale-98"
                  title="Gerar Relatório Executivo Mensal para RH e Diretoria em 1 Clique"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Relatório RH</span>
                </button>
              )}
              {onOpenIncidentModal && (
                <button
                  onClick={onOpenIncidentModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-300 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/80 rounded-xl transition-all font-bold cursor-pointer"
                  title="Lançar atrasos, faltas, atestados e horas extras"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Ocorrências</span>
                </button>
              )}
              {onOpenProviderModal && (
                <button
                  onClick={onOpenProviderModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-cyan-400 bg-[#0c121c] hover:bg-slate-800 border border-[#1e2a3a] rounded-xl transition-all font-bold cursor-pointer"
                  title="Cadastrar, editar ou remover pessoas da equipe"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Equipe</span>
                </button>
              )}
              {onOpenBalanceModal && (
                <button
                  onClick={onOpenBalanceModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-xl transition-all font-bold cursor-pointer"
                  title="Auditoria de Horas e Balanceamento da Equipe"
                >
                  <Scale className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Carga Horária</span>
                </button>
              )}
              {onOpenQuickSwapModal && (
                <button
                  onClick={onOpenQuickSwapModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-cyan-400 bg-[#0c121c] hover:bg-slate-800 border border-[#1e2a3a] rounded-xl transition-all font-semibold cursor-pointer"
                  title="Troca direta de plantão entre dois colaboradores"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Troca</span>
                </button>
              )}
              {onOpenCloneModal && (
                <button
                  onClick={onOpenCloneModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-cyan-400 bg-[#0c121c] hover:bg-slate-800 border border-[#1e2a3a] rounded-xl transition-all font-semibold cursor-pointer"
                  title="Copiar mês anterior"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Copiar</span>
                </button>
              )}
              {onOpenAutoScheduleModal && (
                <button
                  onClick={onOpenAutoScheduleModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-cyan-400 bg-[#0c121c] hover:bg-slate-800 border border-[#1e2a3a] rounded-xl transition-all font-semibold cursor-pointer"
                  title="Gerador automático de escalas"
                >
                  <Wand2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Auto</span>
                </button>
              )}
            </div>
          )}

          {/* Electric Blue Imprimir Button */}
          <button
            onClick={onOpenPrintModal || (() => window.print())}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/40 rounded-xl transition-all font-bold cursor-pointer shadow-sm shadow-blue-950/40"
            title="Imprimir ou Salvar em PDF (Formato A4 Paisagem)"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-200" />
            <span>Imprimir</span>
          </button>

          {/* Provider Filter */}
          <select
            value={filters.providerId}
            onChange={e => setFilters(prev => ({ ...prev, providerId: e.target.value }))}
            className="bg-[#0c121c] border border-[#1e2a3a] text-slate-200 py-1.5 px-2.5 rounded-xl text-xs focus:border-cyan-400 focus:outline-none max-w-[130px] sm:max-w-[170px] cursor-pointer shadow-sm font-medium"
          >
            <option value="all">Todos colaboradores</option>
            {providers
              .filter(p => (p.regime || '12x36') === activeRegime)
              .map(p => (
                <option key={p.id} value={p.id} className="bg-[#0c121c] text-slate-200">
                  {p.name}
                </option>
              ))}
          </select>

          {/* Electric Blue / Cyan Buscar Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.searchQuery}
              onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-7 pr-2.5 py-1.5 bg-[#0c121c] border border-[#1e2a3a] text-slate-200 rounded-xl text-xs placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none w-20 sm:w-28 shadow-sm font-medium"
            />
          </div>

          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
