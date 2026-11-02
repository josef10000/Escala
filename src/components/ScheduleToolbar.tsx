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
    <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl py-2.5 px-3.5 sm:px-4 text-zinc-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Escalador Title / Month Navigator + Regime Switcher + Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="text-sm font-black tracking-tight text-white pr-2 border-r border-white/[0.08] hidden sm:block">
            Escalador
          </div>

          {/* Navigator arrows */}
          <div className="flex items-center bg-[#1A1D24] p-0.5 rounded-xl border border-white/[0.08]">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center min-w-[120px]">
              <span className="text-xs font-bold text-white capitalize">
                {MONTH_NAMES_PT[currentMonthIndex]}
              </span>{' '}
              <span className="text-xs font-semibold text-[#00d2d3]">
                {currentYear}
              </span>
            </div>
            <button
              onClick={goToNextMonth}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* "Hoje" Button */}
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-bold text-zinc-200 bg-[#1A1D24] hover:bg-[#252830] border border-white/[0.08] rounded-xl transition-all cursor-pointer"
            title="Ir para o mês atual"
          >
            Hoje
          </button>

          {/* Regime Switcher Toggle (12x36 vs 5x2) */}
          <div className="flex items-center bg-[#1A1D24] p-0.5 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setActiveRegime('12x36')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeRegime === '12x36'
                  ? 'bg-[#00d2d3] text-[#003731] shadow-xs font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Escala Técnica 12x36"
            >
              12x36
            </button>
            <button
              onClick={() => setActiveRegime('5x2')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeRegime === '5x2'
                  ? 'bg-[#00d2d3] text-[#003731] shadow-xs font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Escala 5x2 (Segunda a Sexta)"
            >
              5x2
            </button>
          </div>

          {/* Publication status badge */}
          {role === 'supervisor' ? (
            <button
              onClick={() => toggleMonthPublishStatus(currentYear, currentMonthIndex)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isCurrentMonthPublished
                  ? 'bg-[#00d2d3]/15 text-[#00d2d3] border-[#00d2d3]/40 hover:bg-[#00d2d3]/25'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
              }`}
              title="Clique para alternar entre Escala Oficial e Rascunho"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCurrentMonthPublished ? 'bg-[#00d2d3] shadow-[0_0_6px_#00d2d3]' : 'bg-amber-400'
                }`}
              />
              <span>
                {isCurrentMonthPublished ? 'Escala Oficial' : 'Rascunho Interno'}
              </span>
            </button>
          ) : (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
              isCurrentMonthPublished
                ? 'bg-[#00d2d3]/15 text-[#00d2d3] border-[#00d2d3]/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/80'
            }`}>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCurrentMonthPublished ? 'bg-[#00d2d3] shadow-[0_0_6px_#00d2d3]' : 'bg-amber-400'
                }`}
              />
              <span>
                {isCurrentMonthPublished ? 'Escala Oficial' : 'Rascunho'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Live Today Duty Numerical Metric */}
        <div className="hidden xl:flex items-center gap-2 bg-[#1A1D24] px-3.5 py-1.5 rounded-xl border border-white/[0.06] text-xs">
          <div className="flex items-center gap-1.5 font-bold text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-[#00d2d3] shadow-[0_0_6px_#00d2d3] animate-pulse" />
            <span>Hoje ({todayWeekDayShort}, {todayDayNum}/{MONTH_NAMES_PT[todayMonthIdx].substring(0, 3)}):</span>
          </div>
          <span className="font-bold text-[#00d2d3] bg-[#00d2d3]/10 px-2 py-0.5 rounded-md border border-[#00d2d3]/20 shadow-xs">
            {todayWorkingCount} Plantonistas
          </span>
          {todayHoCount > 0 && (
            <span className="text-purple-300 text-xs font-semibold">
              ({todayPresencialCount} Presencial • {todayHoCount} HO)
            </span>
          )}
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 text-xs font-medium">
            {todayRestingCount} de Folga
          </span>
        </div>

        {/* Right: Imprimir, Buscar, and Tools */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Supervisor Tools */}
          {role === 'supervisor' && (
            <div className="flex items-center gap-1.5 pr-2 border-r border-white/[0.08]">
              {onOpenExecutiveReportModal && (
                <button
                  onClick={onOpenExecutiveReportModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#003731] bg-[#00d2d3] hover:bg-[#57f1db] rounded-xl transition-all font-bold shadow-sm shadow-[#00d2d3]/20 cursor-pointer active:scale-98"
                  title="Gerar Relatório Executivo Mensal para RH e Diretoria em 1 Clique"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#003731]" />
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#1A1D24] hover:bg-[#252830] border border-white/[0.08] rounded-xl transition-all font-bold cursor-pointer"
                  title="Cadastrar, editar ou remover pessoas da equipe"
                >
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Equipe</span>
                </button>
              )}
              {onOpenBalanceModal && (
                <button
                  onClick={onOpenBalanceModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#00d2d3] bg-[#00d2d3]/10 hover:bg-[#00d2d3]/20 border border-[#00d2d3]/30 rounded-xl transition-all font-bold cursor-pointer"
                  title="Auditoria de Horas e Balanceamento da Equipe"
                >
                  <Scale className="w-3.5 h-3.5 text-[#00d2d3]" />
                  <span className="hidden sm:inline">Carga Horária</span>
                </button>
              )}
              {onOpenQuickSwapModal && (
                <button
                  onClick={onOpenQuickSwapModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#1A1D24] hover:bg-[#252830] border border-white/[0.08] rounded-xl transition-all font-semibold cursor-pointer"
                  title="Troca direta de plantão entre dois colaboradores"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Troca</span>
                </button>
              )}
              {onOpenCloneModal && (
                <button
                  onClick={onOpenCloneModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#1A1D24] hover:bg-[#252830] border border-white/[0.08] rounded-xl transition-all font-semibold cursor-pointer"
                  title="Copiar mês anterior"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Copiar</span>
                </button>
              )}
              {onOpenAutoScheduleModal && (
                <button
                  onClick={onOpenAutoScheduleModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#1A1D24] hover:bg-[#252830] border border-white/[0.08] rounded-xl transition-all font-semibold cursor-pointer"
                  title="Gerador automático de escalas"
                >
                  <Wand2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Auto</span>
                </button>
              )}
            </div>
          )}

          {/* Imprimir Button */}
          <button
            onClick={onOpenPrintModal || (() => window.print())}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-200 bg-[#1A1D24] hover:bg-[#252830] border border-white/[0.08] rounded-xl transition-all font-bold cursor-pointer"
            title="Imprimir ou Salvar em PDF (Formato A4 Paisagem)"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Imprimir</span>
          </button>

          {/* Provider Filter */}
          <select
            value={filters.providerId}
            onChange={e => setFilters(prev => ({ ...prev, providerId: e.target.value }))}
            className="bg-[#1A1D24] border border-white/[0.08] text-zinc-200 py-1.5 px-2.5 rounded-xl text-xs focus:border-[#00d2d3] focus:outline-none max-w-[130px] sm:max-w-[170px] cursor-pointer shadow-sm font-medium"
          >
            <option value="all">Todos colaboradores</option>
            {providers
              .filter(p => (p.regime || '12x36') === activeRegime)
              .map(p => (
                <option key={p.id} value={p.id} className="bg-[#12141A] text-zinc-200">
                  {p.name}
                </option>
              ))}
          </select>

          {/* Buscar Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.searchQuery}
              onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-7 pr-2.5 py-1.5 bg-[#1A1D24] border border-white/[0.08] text-white rounded-xl text-xs placeholder:text-zinc-500 focus:border-[#00d2d3] focus:outline-none w-20 sm:w-28 shadow-sm font-medium"
            />
          </div>

          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
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
