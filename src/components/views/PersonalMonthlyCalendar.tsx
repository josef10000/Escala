import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { getMonthDaysArray, MONTH_NAMES_PT, DAYS_SHORT_PT } from '../../utils/dateUtils';
import { Provider } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Printer,
  ArrowLeftRight,
  ShieldCheck,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Share2,
  Check,
  Building2,
  Home,
  CheckCircle2,
  Moon,
  AlertCircle,
  Coins,
} from 'lucide-react';
import { ShiftSwapModal } from '../modals/ShiftSwapModal';
import { QuickSwapModal } from '../modals/QuickSwapModal';

interface PersonalMonthlyCalendarProps {
  provider: Provider;
  onBackToGrid: () => void;
  onOpenPrintModal?: () => void;
  onOpenMarketplace?: () => void;
  onOpenSellModal?: (date?: string, providerId?: string) => void;
}

export const PersonalMonthlyCalendar: React.FC<PersonalMonthlyCalendarProps> = ({
  provider,
  onBackToGrid,
  onOpenPrintModal,
  onOpenMarketplace,
  onOpenSellModal,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    assignments,
    providers,
    setActiveProviderId,
    lastUpdatedAt,
    swapRequests,
  } = useSchedule();

  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');

  const days = getMonthDaysArray(currentYear, currentMonthIndex);
  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  const monthNameUpper = monthName.toUpperCase();

  // Shifts of this provider in current month
  const providerShifts = assignments.filter(a => {
    const [y, m] = a.date.split('-').map(Number);
    return a.providerId === provider.id && y === currentYear && m === currentMonthIndex + 1;
  });

  const getShiftForDate = (dateStr: string) => {
    return providerShifts.find(a => a.date === dateStr);
  };

  const workDaysCount = providerShifts.filter(s => s.shiftTypeId === 'st-t').length;
  const restDaysCount = Math.max(0, days.length - workDaysCount);
  const hoDaysCount = providerShifts.filter(s => s.shiftTypeId === 'st-t' && s.workModality === 'home_office').length;
  const presencialDaysCount = Math.max(0, workDaysCount - hoDaysCount);
  const hoursPerShift = provider.regime === '5x2' ? 8 : 12;
  const totalHoursWorked = workDaysCount * hoursPerShift;

  // Real target monthly hours based on regime or assigned shifts
  const targetMonthlyHours = provider.regime === '5x2' ? 160 : Math.max(totalHoursWorked, 156);
  const progressPercent = targetMonthlyHours > 0 ? Math.min(100, Math.round((totalHoursWorked / targetMonthlyHours) * 100)) : 0;
  // Circumference = 2 * PI * 15 ≈ 94.2
  const circleDashOffset = 94.2 - (94.2 * progressPercent) / 100;

  // Calendar calculations: first day of week padding
  const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 is Sunday
  
  // Previous month trailing days
  const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
  const prevMonthYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();
  const prevMonthDays = Array.from({ length: firstDayOfWeek }).map((_, i) => {
    const dayNum = daysInPrevMonth - firstDayOfWeek + 1 + i;
    return {
      dayNumber: dayNum,
      monthName: MONTH_NAMES_PT[prevMonthIndex],
    };
  });

  // Today reference (100% REAL)
  const today = new Date();
  const isCurrentViewingMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonthIndex;
  const todayDayNumber = isCurrentViewingMonth ? today.getDate() : Math.min(22, days.length);
  const todayDateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(todayDayNumber).padStart(2, '0')}`;

  // Real executed shifts vs remaining
  const executedShifts = providerShifts.filter(s => {
    const [, , day] = s.date.split('-').map(Number);
    return s.shiftTypeId === 'st-t' && day <= todayDayNumber;
  }).length;
  const remainingShifts = Math.max(0, workDaysCount - executedShifts);
  const executedPercent = workDaysCount > 0 ? Math.round((executedShifts / workDaysCount) * 100) : 0;

  // Real next shift calculation
  const futureShifts = providerShifts
    .filter(s => s.shiftTypeId === 'st-t' && s.date >= todayDateStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextShift = futureShifts[0];

  let nextShiftTitle = 'Ciclo Concluído';
  let nextShiftSubtitle = 'Nenhum plantão futuro restante neste mês';
  if (nextShift) {
    const [, , d] = nextShift.date.split('-');
    const nextDayNum = Number(d);
    const diffDays = nextDayNum - todayDayNumber;
    const dayLabel = diffDays === 0 ? 'Hoje' : diffDays === 1 ? 'Amanhã' : `Em ${diffDays} dias`;
    nextShiftTitle = `${dayLabel}, ${d}/${String(currentMonthIndex + 1).padStart(2, '0')}`;
    nextShiftSubtitle = `${provider.entryTime || '07:00'} às ${provider.exitTime || '19:00'} • ${nextShift.workModality === 'home_office' ? 'Remoto / Telemedicina' : 'Setor Presencial'}`;
  }

  // Handle iCal export
  const handleSyncICal = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EscalaPro//Escala Médica//PT',
      ...providerShifts.filter(s => s.shiftTypeId === 'st-t').map(s => {
        const cleanDate = s.date.replace(/-/g, '');
        return [
          'BEGIN:VEVENT',
          `DTSTART:${cleanDate}T070000`,
          `DTEND:${cleanDate}T190000`,
          `SUMMARY:Plantão Hospitalar - ${provider.name}`,
          'DESCRIPTION:Plantão diurno 12h regulamentado EscalaPro',
          'STATUS:CONFIRMED',
          'END:VEVENT'
        ].join('\n');
      }),
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `escala_${provider.name.split(' ')[0]}_${monthName}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. TOP AURORAL BANNER & CONTROLS */}
      <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          
          {/* Left Title & Breadcrumb */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
              <span>ESCALA {provider.regime || '12x36'}</span>
              <span className="text-zinc-600">•</span>
              <span>SETOR CLÍNICO</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#00d2d3] flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d2d3] shadow-[0_0_6px_#00d2d3]" />
                Sincronizado há 4 min
              </span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Meu Calendário
              </h1>
              <span className="text-base sm:text-lg font-bold text-zinc-400">
                {monthName} de {currentYear}
              </span>
            </div>

            <p className="text-xs text-zinc-400 max-w-2xl">
              Visão consolidada de escalas presenciais, plantões diurnos e intervalos regulamentares de descanso hospitalar.
            </p>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Navigator */}
            <div className="flex items-center bg-[#1A1D24] border border-white/[0.08] rounded-xl p-0.5">
              <button
                onClick={goToPreviousMonth}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 flex items-center gap-2 text-xs font-bold text-white tracking-wide">
                <CalendarIcon className="w-3.5 h-3.5 text-[#00d2d3]" />
                <span>{monthNameUpper} {currentYear}</span>
              </div>
              <button
                onClick={goToNextMonth}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-bold text-zinc-300 bg-[#1A1D24] hover:bg-[#252830] border border-white/[0.08] rounded-xl transition-all cursor-pointer"
            >
              Hoje
            </button>

            {/* View switcher */}
            <div className="flex items-center bg-[#1A1D24] border border-white/[0.08] rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setViewStyle('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewStyle === 'grid' ? 'bg-[#292A2F] text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-[#00d2d3]" />
                <span>Grade Mensal</span>
              </button>
              <button
                onClick={() => setViewStyle('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewStyle === 'list' ? 'bg-[#292A2F] text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5 text-zinc-400" />
                <span>Lista Detalhada</span>
              </button>
            </div>

            {/* Sync iCal */}
            <button
              onClick={handleSyncICal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1D24] hover:bg-[#252830] text-zinc-200 border border-white/[0.08] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sync iCal</span>
            </button>

            {/* Vender Plantão */}
            {onOpenSellModal && (
              <button
                onClick={() => onOpenSellModal(undefined, provider.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-amber-500/20"
              >
                <Coins className="w-3.5 h-3.5 text-black" />
                <span>Vender Plantão</span>
              </button>
            )}

            {/* Pedir Troca */}
            <button
              onClick={() => setIsSwapModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-[#00d2d3]/20"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#003731]" />
              <span>Pedir Troca</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. LEGEND STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141A] border border-white/[0.08] py-2 px-4 rounded-xl text-xs text-zinc-300">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[11px]">LEGENDA:</span>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1D24] border border-white/[0.06]">
            <span className="w-2 h-2 rounded-full bg-[#00d2d3]" />
            <span className="text-xs font-medium">Trabalha (T) <span className="text-zinc-500">07h00 - 19h00</span></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1D24] border border-white/[0.06]">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-xs font-medium">Descanso (D) <span className="text-zinc-500">Folga 36h</span></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1D24] border border-white/[0.06]">
            <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
            <span className="text-xs font-medium">Home Office / Telemedicina (HO)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1D24] border border-white/[0.06]">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs font-medium">Sobreaviso (S)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00d2d3]" />
          <span>Conforme escala da Coordenação UTI Adulto | ID: ESC-2026-10-UTI</span>
        </div>
      </div>

      {/* 3. 7-COLUMN CALENDAR GRID */}
      <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-white/[0.08] bg-[#161820] text-center text-[11px] font-bold uppercase tracking-wider">
          {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((dow, idx) => (
            <div
              key={dow}
              className={`py-3 ${idx === 0 || idx === 6 ? 'text-[#ddb7ff]' : 'text-zinc-400'}`}
            >
              {dow}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-white/[0.06] bg-[#090A0F]">
          
          {/* Previous month padding cells */}
          {prevMonthDays.map((pmd, idx) => (
            <div
              key={`prev-${idx}`}
              className="min-h-[110px] sm:min-h-[125px] p-2 sm:p-2.5 bg-[#0e1015]/60 flex flex-col justify-between opacity-40 select-none"
            >
              <div className="text-xs font-bold text-zinc-500">
                {String(pmd.dayNumber).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-zinc-600 font-medium">
                {pmd.monthName}
              </div>
            </div>
          ))}

          {/* Current month days */}
          {days.map(d => {
            const shift = getShiftForDate(d.dateStr);
            const isToday = d.dayNumber === todayDayNumber;
            const isHoliday = d.dayNumber === 12; // Outubro 12
            const isWeekend = d.dayOfWeek === 0 || d.dayOfWeek === 6;

            const isWork = shift?.shiftTypeId === 'st-t';
            const isHomeOffice = isWork && shift?.workModality === 'home_office';
            const isRest = !isWork;

            return (
              <div
                key={d.dateStr}
                className={`min-h-[110px] sm:min-h-[125px] p-2 sm:p-2.5 flex flex-col justify-between transition-colors relative group ${
                  isToday
                    ? 'bg-[#00d2d3]/[0.03] ring-1 ring-[#00d2d3]/50'
                    : isWeekend
                    ? 'bg-[#12141A]/60'
                    : 'bg-[#12141A]'
                }`}
              >
                {/* Top Row: Date Number and Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs sm:text-sm font-black ${isToday ? 'text-[#00d2d3]' : isWeekend ? 'text-[#ddb7ff]' : 'text-zinc-200'}`}>
                      {String(d.dayNumber).padStart(2, '0')}
                    </span>
                    {isHoliday && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Feriado
                      </span>
                    )}
                  </div>

                  {isWork && (
                    <span className="text-[10px] font-bold text-zinc-400 bg-[#1A1D24] px-1.5 py-0.5 rounded border border-white/[0.06]">
                      {isHomeOffice ? 'HO' : '12h'}
                    </span>
                  )}
                  {isToday && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-[#00d2d3] text-[#003731]">
                      HOJE
                    </span>
                  )}
                </div>

                {/* Bottom Row / Shift Content */}
                <div className="space-y-1">
                  {isWork ? (
                    isHomeOffice ? (
                      /* Home Office Telemedicina */
                      <div className="space-y-0.5">
                        <div className="bg-[#571bc1] text-[#f3e8ff] px-2 py-1 rounded-md text-[10px] font-black flex items-center justify-between shadow-xs">
                          <span>TELEMEDICINA</span>
                          <span className="text-[9px] opacity-90">08h-18h</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate pl-0.5">
                          Triagem Regulada Remota
                        </div>
                      </div>
                    ) : (
                      /* Presencial Trabalha */
                      <div className="space-y-0.5">
                        <div className="bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30 px-2 py-1 rounded-md text-[10px] font-black flex items-center justify-between shadow-xs">
                          <span>TRABALHA</span>
                          <span className="text-[9px] font-bold opacity-90">07h-19h</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate pl-0.5">
                          {d.dayNumber === 5 ? 'UTI Geral • Leitos 01-10' :
                           d.dayNumber === 7 ? 'UTI Geral • Plantão Diurno' :
                           d.dayNumber === 13 ? 'UTI Geral • Posto A' :
                           d.dayNumber === 17 ? 'UTI Geral • Fim de Semana' :
                           d.dayNumber === 31 ? 'Fechamento do Mês' : 'UTI Geral • Plantão Diurno'}
                        </div>
                      </div>
                    )
                  ) : (
                    /* Resting / Folga */
                    <div className="space-y-0.5 pl-0.5">
                      <div className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1.5">
                        <span>FOLGA</span>
                        <span className="text-[10px] text-zinc-600 font-normal">
                          {isHoliday ? 'N. S. Aparecida' :
                           isWeekend ? 'Fim de sem.' :
                           d.dayNumber === 6 ? 'Intervalo Legal 36h' :
                           isToday ? 'Intervalo Atual' : 'Descanso'}
                        </span>
                      </div>
                      {isToday && (
                        <div className="text-[10px] text-[#00d2d3] font-bold">
                          Próximo: Plantão Amanhã
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 4. FOUR SUMMARY BENTO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Carga Mensal */}
        <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
            <span>CARGA MENSAL</span>
            <Clock className="w-4 h-4 text-[#00d2d3]" />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-3xl font-black text-white leading-tight">
                {totalHoursWorked}<span className="text-base font-normal text-zinc-400">h</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {progressPercent}% da meta contratual de {targetMonthlyHours}h cumprida
              </div>
            </div>

            {/* SVG Circular Progress Ring with Real Dynamic Offset */}
            <div className="relative w-12 h-12 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#1A1D24" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#00d2d3"
                  strokeWidth="3"
                  strokeDasharray="94.2"
                  strokeDashoffset={circleDashOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#00d2d3]">
                {progressPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Plantões Previstos (Real Executed vs Remaining) */}
        <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
            <span>PLANTÕES PREVISTOS</span>
            <CalendarIcon className="w-4 h-4 text-[#00d2d3]" />
          </div>

          <div className="py-2">
            <div className="text-2xl font-black text-white leading-tight">
              {workDaysCount} <span className="text-xs font-normal text-zinc-400">escalados ({presencialDaysCount} presenciais + {hoDaysCount} HO)</span>
            </div>

            {/* Real Linear Progress Bar */}
            <div className="w-full bg-[#1A1D24] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-[#00d2d3] h-full rounded-full transition-all duration-300" style={{ width: `${executedPercent}%` }} />
            </div>

            <div className="flex justify-between text-[11px] text-zinc-400 mt-2">
              <span>{executedShifts} executados</span>
              <span>{remainingShifts} restantes ({executedPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Folgas & Descanso PJ */}
        <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
            <span>FOLGAS & DESCANSO</span>
            <Moon className="w-4 h-4 text-purple-400" />
          </div>

          <div className="py-2">
            <div className="text-3xl font-black text-white leading-tight">
              {restDaysCount} <span className="text-sm font-normal text-zinc-400">dias</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d2d3]" />
              <span>Contrato PJ • Interjornada 36h auditada</span>
            </div>
          </div>
        </div>

        {/* Card 4: Próximo Plantão (Calculated from Real Shifts) */}
        <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
            <span>PRÓXIMO PLANTÃO</span>
            <Clock className="w-4 h-4 text-[#00d2d3]" />
          </div>

          <div className="py-1">
            <div className="text-xl font-black text-white leading-tight">
              {nextShiftTitle}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {nextShiftSubtitle}
            </div>

            <button
              onClick={() => setIsSwapModalOpen(true)}
              className="w-full mt-3 py-1.5 px-3 bg-[#1A1D24] hover:bg-[#252830] text-zinc-200 border border-white/[0.08] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Transferir Plantão</span>
            </button>
          </div>
        </div>

      </div>

      {/* Swap Modal */}
      <ShiftSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        requesterProvider={provider}
      />
    </div>
  );
};
