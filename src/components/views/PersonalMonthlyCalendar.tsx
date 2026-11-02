import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { getMonthDaysArray, MONTH_NAMES_PT, formatFriendlyDate, DAYS_SHORT_PT } from '../../utils/dateUtils';
import { Provider } from '../../types';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  Coffee,
  MessageSquare,
  Printer,
  ArrowLeftRight,
  FileText,
  User,
  Shield,
  CalendarCheck,
  Building2,
  Home,
  Grid,
  List
} from 'lucide-react';
import { shareProviderWhatsApp } from '../../utils/shareUtils';
import { ShiftSwapModal } from '../modals/ShiftSwapModal';
import { ScheduleRequestModal } from '../modals/ScheduleRequestModal';

interface PersonalMonthlyCalendarProps {
  provider: Provider;
  onBackToGrid: () => void;
  onOpenPrintModal?: () => void;
}

export const PersonalMonthlyCalendar: React.FC<PersonalMonthlyCalendarProps> = ({
  provider,
  onBackToGrid,
  onOpenPrintModal,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    assignments,
    providers,
    setActiveProviderId,
    lastUpdatedAt,
    swapRequests,
    scheduleRequests,
  } = useSchedule();

  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [viewStyle, setViewStyle] = useState<'grid' | 'timeline'>('grid');

  const days = getMonthDaysArray(currentYear, currentMonthIndex);
  const monthName = MONTH_NAMES_PT[currentMonthIndex];

  // Shifts of this provider in current month
  const providerShifts = assignments.filter(a => {
    const [y, m] = a.date.split('-').map(Number);
    return a.providerId === provider.id && y === currentYear && m === currentMonthIndex + 1;
  });

  const getShiftForDate = (dateStr: string) => {
    return providerShifts.find(a => a.date === dateStr);
  };

  const workDaysCount = providerShifts.filter(s => s.shiftTypeId === 'st-t').length;
  const restDaysCount = providerShifts.filter(s => s.shiftTypeId === 'st-d').length;
  const hoDaysCount = providerShifts.filter(s => s.shiftTypeId === 'st-t' && s.workModality === 'home_office').length;
  const presencialDaysCount = workDaysCount - hoDaysCount;
  const hoursPerShift = provider.regime === '5x2' ? 8 : 12;
  const totalHoursWorked = workDaysCount * hoursPerShift;

  const todayStr = new Date().toISOString().split('T')[0];

  // Swaps involving this provider
  const mySwaps = swapRequests.filter(
    s => s.requesterProviderId === provider.id || s.targetProviderId === provider.id
  );

  // Future schedule requests by this provider
  const myRequests = scheduleRequests.filter(r => r.providerId === provider.id);

  // Format last updated date
  const formatLastUpdated = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 is Sunday
  const paddingEmptyDays = Array.from({ length: firstDayOfWeek });

  // Get initials for avatar
  const initials = provider.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  const defaultEntry = provider.entryTime || (provider.regime === '5x2' ? '08h00' : '07h00');
  const defaultExit = provider.exitTime || (provider.regime === '5x2' ? '17h00' : '19h00');

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-200 text-slate-100">
      
      {/* Top Header Card */}
      <div className="bg-[#141c28] border border-[#1e2a3a] rounded-3xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          
          {/* Left: Back button + Profile avatar + Name + Meta */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBackToGrid}
              className="p-2.5 text-slate-300 hover:text-cyan-400 bg-[#0c121c] hover:bg-slate-800 active:scale-95 rounded-2xl border border-[#1e2a3a] transition-all cursor-pointer shrink-0 shadow-sm"
              title="Voltar ao Quadro Geral da Escala"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-cyan-500/40 flex items-center justify-center font-black text-cyan-400 text-base shadow-sm shrink-0">
              {initials}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {provider.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-cyan-950/70 text-cyan-300 border border-cyan-800/80">
                  {provider.regime || '12x36'}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  • {provider.role || 'Colaborador'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Turno habitual: {defaultEntry} às {defaultExit}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-medium">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{monthName} de {currentYear}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Collaborator Switcher */}
            <div className="flex items-center bg-[#0c121c] border border-[#1e2a3a] rounded-xl px-2.5 py-1.5 shadow-sm">
              <User className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
              <select
                value={provider.id}
                onChange={e => setActiveProviderId(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none cursor-pointer pr-1"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0c121c] text-slate-200">
                    {p.name} ({p.regime || '12x36'})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Request Button */}
            <button
              onClick={() => setIsSwapModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-950/40 cursor-pointer"
              title="Solicitar troca de plantão com outro colega"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-200" />
              <span>Troca</span>
            </button>

            {/* Request Day Off */}
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0c121c] hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-cyan-400 rounded-xl text-xs font-bold transition-all border border-[#1e2a3a] shadow-sm cursor-pointer"
              title="Solicitar folga ou registrar indisponibilidade"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Pedir Folga</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => shareProviderWhatsApp(provider, currentYear, currentMonthIndex, assignments)}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/60 hover:bg-cyan-900/70 active:scale-95 text-cyan-300 rounded-xl text-xs font-bold transition-all border border-cyan-800/80 shadow-sm cursor-pointer"
              title="Enviar calendário individual no WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={onOpenPrintModal || (() => window.print())}
              className="p-2 text-slate-300 hover:text-cyan-400 bg-[#0c121c] hover:bg-slate-800 rounded-xl border border-[#1e2a3a] transition-colors cursor-pointer"
              title="Imprimir ou exportar em PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Work Shifts KPI */}
        <div className="bg-[#141c28] border border-[#1e2a3a] p-4 rounded-2xl shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plantões / Dias</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)] animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400 tracking-tight">
              {workDaysCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">dias escalados</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-300 font-medium">
            <span>🏢 {presencialDaysCount} Presencial</span>
            {hoDaysCount > 0 && (
              <span className="text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/80">
                🏠 {hoDaysCount} HO
              </span>
            )}
          </div>
        </div>

        {/* Rest Days KPI */}
        <div className="bg-[#141c28] border border-[#1e2a3a] p-4 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-slate-400" />
              <span>Folgas / Descanso</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400 tracking-tight">
              {restDaysCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">dias de folga</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            Descanso regulamentar programado
          </div>
        </div>

        {/* Hours Worked KPI */}
        <div className="bg-[#141c28] border border-[#1e2a3a] p-4 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Carga Horária</span>
            </span>
            <span className="text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/80">
              {hoursPerShift}h/dia
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">
              {totalHoursWorked}
              <span className="text-lg font-bold text-cyan-400">h</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">previstas no mês</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            Mês de {monthName}
          </div>
        </div>

        {/* Sync & Cloud Status */}
        <div className="bg-[#141c28] border border-[#1e2a3a] p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Status da Nuvem</span>
            </span>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
              <span>Sincronizado em Tempo Real</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Atualizado: {formatLastUpdated(lastUpdatedAt)}
          </div>
        </div>
      </div>

      {/* Main Calendar Card with Grid & Timeline Toggle */}
      <div className="bg-[#141c28] border border-[#1e2a3a] rounded-3xl p-4 sm:p-6 shadow-md space-y-4">
        
        {/* Calendar Toolbar: Month Title + Legend + View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2a3a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0c121c] text-cyan-400 border border-[#1e2a3a]">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
                {monthName} {currentYear}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Agenda mensal individual de plantões e folgas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Legend Badges */}
            <div className="flex items-center gap-2 text-xs bg-[#0c121c] border border-[#1e2a3a] px-3 py-1.5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-cyan-500 rounded-sm" />
                <span className="text-slate-200 font-bold">Trabalha (T)</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-700 rounded-sm" />
                <span className="text-slate-200 font-bold">Descanso (D)</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded text-xs font-black bg-purple-900/60 text-purple-300 border border-purple-700/50">
                  HO
                </span>
                <span className="text-slate-300 font-medium">Home Office</span>
              </div>
            </div>

            {/* View Switcher: Grid vs Timeline */}
            <div className="flex items-center bg-[#0c121c] p-0.5 rounded-xl border border-[#1e2a3a]">
              <button
                onClick={() => setViewStyle('grid')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewStyle === 'grid'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visualização em Grade Mensal"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grade</span>
              </button>
              <button
                onClick={() => setViewStyle('timeline')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewStyle === 'timeline'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visualização em Lista Cronológica"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: GRID MODE */}
        {viewStyle === 'grid' && (
          <div className="space-y-2">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate-400">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayLabel, idx) => (
                <div
                  key={dayLabel}
                  className={`py-2 px-1 rounded-xl font-bold ${
                    idx === 0 || idx === 6
                      ? 'bg-[#101724] text-slate-300 border border-[#1e2a3a]'
                      : 'bg-[#0c121c] text-cyan-400 border border-[#1e2a3a]'
                  }`}
                >
                  {dayLabel}
                </div>
              ))}
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Padding empty days */}
              {paddingEmptyDays.map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[85px] sm:min-h-[110px] rounded-2xl bg-[#0c121c]/40 border border-[#1e2a3a]/60"
                />
              ))}

              {/* Month Days */}
              {days.map(d => {
                const shift = getShiftForDate(d.dateStr);
                const isWork = shift?.shiftTypeId === 'st-t';
                const isRest = shift?.shiftTypeId === 'st-d';
                const isHomeOffice = isWork && shift?.workModality === 'home_office';
                const isToday = d.dateStr === todayStr;
                const hasNote = Boolean(shift?.notes);

                // Card Styling
                let cardStyle = 'bg-[#0c121c]/60 border-[#1e2a3a] text-slate-400 hover:border-slate-600';
                if (isWork) {
                  cardStyle = 'bg-cyan-950/20 border-cyan-500/40 text-slate-100 shadow-sm hover:border-cyan-400';
                } else if (isRest) {
                  cardStyle = 'bg-slate-900/40 border-[#1e2a3a] text-slate-300 hover:border-slate-600';
                }

                return (
                  <div
                    key={d.dateStr}
                    className={`min-h-[92px] sm:min-h-[115px] p-2 sm:p-2.5 rounded-2xl border flex flex-col justify-between transition-all relative group ${cardStyle} ${
                      isToday ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#141c28]' : ''
                    }`}
                  >
                    {/* Top Row: Day number & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-xs sm:text-sm font-extrabold ${
                            isToday
                              ? 'text-cyan-400'
                              : d.isWeekend
                              ? 'text-slate-400'
                              : 'text-white'
                          }`}
                        >
                          {d.dayNumber}
                        </span>
                        {isToday && (
                          <span className="text-xs font-black uppercase bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-md leading-tight">
                            Hoje
                          </span>
                        )}
                      </div>

                      {/* HO Badge in top corner */}
                      {isHomeOffice && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50">
                          HO
                        </span>
                      )}
                    </div>

                    {/* Center: Shift status */}
                    <div className="my-auto py-1 text-center">
                      {isWork ? (
                        <div className="space-y-0.5">
                          <div className="inline-flex items-center justify-center gap-1 w-full py-1 px-2 bg-cyan-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:bg-cyan-400">
                            <span>TRABALHA</span>
                          </div>
                          <div className="text-xs text-cyan-300/80 font-semibold truncate hidden sm:block">
                            {defaultEntry} - {defaultExit}
                          </div>
                        </div>
                      ) : isRest ? (
                        <div className="space-y-0.5">
                          <div className="inline-flex items-center justify-center w-full py-1 px-2 bg-slate-700/80 text-slate-200 border border-slate-600/50 rounded-xl text-xs font-bold uppercase tracking-wider">
                            FOLGA
                          </div>
                          <div className="text-xs text-slate-400 hidden sm:block">
                            Descanso
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-600 text-xs font-bold">-</div>
                      )}
                    </div>

                    {/* Bottom: Note snippet if any */}
                    {hasNote && (
                      <div
                        className="text-xs text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded-md border border-amber-800/80 truncate mt-1 font-medium"
                        title={shift?.notes}
                      >
                        Obs: {shift?.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 2: TIMELINE / LIST MODE */}
        {viewStyle === 'timeline' && (
          <div className="space-y-2 pt-2">
            {days.map(d => {
              const shift = getShiftForDate(d.dateStr);
              const isWork = shift?.shiftTypeId === 'st-t';
              const isRest = shift?.shiftTypeId === 'st-d';
              const isHomeOffice = isWork && shift?.workModality === 'home_office';
              const isToday = d.dateStr === todayStr;

              return (
                <div
                  key={d.dateStr}
                  className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isWork
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm'
                      : isRest
                      ? 'bg-[#0c121c]/60 border-[#1e2a3a]'
                      : 'bg-[#0c121c]/30 border-[#1e2a3a] text-slate-500'
                  } ${isToday ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#141c28]' : ''}`}
                >
                  {/* Left: Date info */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#0c121c] border border-[#1e2a3a] flex flex-col items-center justify-center font-bold text-center shrink-0 shadow-sm">
                      <span className="text-xs text-slate-400 uppercase leading-none font-bold">
                        {DAYS_SHORT_PT[d.dayOfWeek]}
                      </span>
                      <span className={`text-base font-black leading-none mt-0.5 ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                        {d.dayNumber}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {formatFriendlyDate(d.dateStr)}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-black uppercase bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded-md">
                            Hoje
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {isWork
                          ? `Turno das ${defaultEntry} às ${defaultExit} (${hoursPerShift}h)`
                          : isRest
                          ? 'Dia de descanso / Folga programada'
                          : 'Sem escala definida'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isWork && (
                      <div className="flex items-center gap-1.5">
                        {isHomeOffice ? (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                            <Home className="w-3.5 h-3.5" />
                            <span>Home Office</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Presencial</span>
                          </span>
                        )}

                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-cyan-500 text-slate-950 shadow-sm">
                          TRABALHA
                        </span>
                      </div>
                    )}

                    {isRest && (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-700/80 text-slate-200 border border-slate-600/50">
                        FOLGA
                      </span>
                    )}

                    {!isWork && !isRest && (
                      <span className="px-3 py-1 rounded-xl text-xs font-medium text-slate-600 bg-[#0c121c] border border-[#1e2a3a]">
                        -
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Requests & Swaps Registered History */}
      {(mySwaps.length > 0 || myRequests.length > 0) && (
        <div className="bg-[#141c28] border border-[#1e2a3a] rounded-3xl p-5 shadow-md space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-cyan-400" />
            <span>Meus Pedidos de Troca e Folgas Registrados</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mySwaps.map(swap => {
              const isRequester = swap.requesterProviderId === provider.id;
              const otherId = isRequester ? swap.targetProviderId : swap.requesterProviderId;
              const otherName = providers.find(p => p.id === otherId)?.name || 'Colega';

              return (
                <div
                  key={swap.id}
                  className="bg-[#0c121c] border border-[#1e2a3a] p-3.5 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Troca com {otherName}</span>
                    </span>

                    {swap.status === 'pending_supervisor' && (
                      <span className="px-2 py-0.5 bg-amber-950/70 border border-amber-800/80 text-amber-300 rounded-md text-xs font-bold">
                        Aguardando Líder
                      </span>
                    )}
                    {swap.status === 'approved' && (
                      <span className="px-2 py-0.5 bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 rounded-md text-xs font-bold">
                        Aprovada
                      </span>
                    )}
                    {swap.status === 'rejected' && (
                      <span className="px-2 py-0.5 bg-rose-950/70 border border-rose-800/80 text-rose-300 rounded-md text-xs font-bold">
                        Recusada
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-300">
                    Dia {swap.requesterDate} ({formatFriendlyDate(swap.requesterDate)})
                    {swap.targetDate && <span> ↔ Dia {swap.targetDate}</span>}
                  </div>
                  {swap.reason && (
                    <div className="text-xs text-slate-400 italic">
                      Motivo: "{swap.reason}"
                    </div>
                  )}
                </div>
              );
            })}

            {myRequests.map(req => (
              <div
                key={req.id}
                className="bg-[#0c121c] border border-[#1e2a3a] p-3.5 rounded-2xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{req.type === 'day_off' ? 'Pedido de Folga' : 'Disponibilidade Extra'}</span>
                  </span>

                  {req.status === 'pending' && (
                    <span className="px-2 py-0.5 bg-amber-950/70 border border-amber-800/80 text-amber-300 rounded-md text-xs font-bold">
                      Aguardando Líder
                    </span>
                  )}
                  {req.status === 'approved' && (
                    <span className="px-2 py-0.5 bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 rounded-md text-xs font-bold">
                      Aprovado
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="px-2 py-0.5 bg-rose-950/70 border border-rose-800/80 text-rose-300 rounded-md text-xs font-bold">
                      Recusado
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300">
                  Para o dia {req.date} ({formatFriendlyDate(req.date)})
                </div>
                {req.reason && (
                  <div className="text-xs text-slate-400 italic">
                    Motivo: "{req.reason}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ShiftSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        requesterProvider={provider}
      />

      <ScheduleRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        provider={provider}
      />
    </div>
  );
};
