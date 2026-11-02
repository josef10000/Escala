import React, { useState, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import {
  DAYS_SHORT_PT,
  DAYS_FULL_PT,
  MONTH_NAMES_PT,
  formatDateToISO,
  getMonthDaysArray
} from '../../utils/dateUtils';
import {
  Bell,
  MapPin,
  Clock,
  ArrowLeftRight,
  AlertTriangle,
  Calendar,
  CalendarDays,
  Users,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Building2,
  Home,
  Coffee,
  Sparkles,
  ChevronDown,
  Share2,
  X,
  FileCheck,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Provider, ShiftAssignment } from '../../types';

interface MobileScheduleViewProps {
  onRequestSwap?: () => void;
  onNotifyAbsence?: () => void;
  onOpenRequestsCenter?: () => void;
  onSwitchToDesktopGrid?: () => void;
}

export const MobileScheduleView: React.FC<MobileScheduleViewProps> = ({
  onRequestSwap,
  onNotifyAbsence,
  onOpenRequestsCenter,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    providers,
    assignments,
    activeProviderId,
    setActiveProviderId,
    activeRegime,
    shiftTypes,
    role,
    acknowledgeAllMonthlyShifts,
    isMonthPublished,
  } = useSchedule();

  // Bottom Navigation Tab: 'escala' | 'equipe' | 'trocas' (NO 'perfil' tab as requested)
  const [activeTab, setActiveTab] = useState<'escala' | 'equipe' | 'trocas'>('escala');

  // Timeline view filter: 'week' | 'month'
  const [timelineMode, setTimelineMode] = useState<'week' | 'month'>('week');

  // Dropdown to switch collaborator profile
  const [showUserPicker, setShowUserPicker] = useState(false);

  // Selected Day Detail for Bottom Sheet/Modal
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNumber: number;
    dayOfWeek: number;
    shift?: ShiftAssignment;
  } | null>(null);

  // Active collaborator
  const currentProvider = providers.find(p => p.id === activeProviderId) || providers[0];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Dates calculation
  const todayObj = new Date();
  const todayISO = formatDateToISO(todayObj);
  const todayDayNum = todayObj.getDate();
  const todayDayOfWeekName = DAYS_FULL_PT[todayObj.getDay()];
  const todayMonthName = MONTH_NAMES_PT[todayObj.getMonth()];

  // Tomorrow calculation
  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowISO = formatDateToISO(tomorrowObj);
  const myTomorrowShift = assignments.find(
    a => a.providerId === currentProvider.id && a.date === tomorrowISO
  );
  const isWorkingTomorrow = myTomorrowShift?.shiftTypeId === 'st-t';

  // Month days array
  const allMonthDays = getMonthDaysArray(currentYear, currentMonthIndex);

  // Provider's monthly shifts
  const myMonthlyShifts = assignments.filter(a => {
    if (a.providerId !== currentProvider.id) return false;
    const [y, m] = a.date.split('-').map(Number);
    return y === currentYear && m === currentMonthIndex + 1;
  });

  const countT = myMonthlyShifts.filter(s => s.shiftTypeId === 'st-t').length;
  const countD = myMonthlyShifts.filter(s => s.shiftTypeId === 'st-d').length;
  const totalHours = countT * (activeRegime === '5x2' ? 8 : 12);

  // Check if collaborator has acknowledged the month
  const isMonthAcknowledged = myMonthlyShifts.length > 0 && myMonthlyShifts.every(s => s.acknowledgedByProvider);

  // Today's shift for active provider
  const myTodayShift = assignments.find(
    a => a.providerId === currentProvider.id && a.date === todayISO
  );
  const isWorkingToday = myTodayShift?.shiftTypeId === 'st-t';
  const todayModality = myTodayShift?.workModality || 'presencial';

  // Teammates on duty today
  const teammatesOnDutyToday = providers.filter(p => {
    if (p.id === currentProvider.id) return false;
    if ((p.regime || '12x36') !== activeRegime) return false;
    const shift = assignments.find(a => a.providerId === p.id && a.date === todayISO);
    return shift?.shiftTypeId === 'st-t';
  });

  // Calculate shift time progress (if working today)
  const currentHour = todayObj.getHours();
  const currentMinute = todayObj.getMinutes();
  const totalShiftMinutes = 12 * 60; // 720 min (07h00 to 19h00)
  const passedMinutes = Math.max(0, Math.min(totalShiftMinutes, (currentHour - 7) * 60 + currentMinute));
  const progressPercentage = Math.round((passedMinutes / totalShiftMinutes) * 100);
  const remainingHours = Math.max(0, Math.ceil((totalShiftMinutes - passedMinutes) / 60));

  // Timeline days (Week vs Month)
  const timelineDays = useMemo(() => {
    if (timelineMode === 'month') return allMonthDays;

    const todayIndex = allMonthDays.findIndex(d => d.dateStr === todayISO);
    if (todayIndex === -1) return allMonthDays.slice(0, 7);

    const start = Math.max(0, todayIndex - 2);
    const end = Math.min(allMonthDays.length, todayIndex + 5);
    return allMonthDays.slice(start, end);
  }, [timelineMode, allMonthDays, todayISO]);

  // Handle WhatsApp Share for Personal Schedule
  const handleShareMyScheduleWhatsApp = () => {
    const workingDays = myMonthlyShifts
      .filter(s => s.shiftTypeId === 'st-t')
      .map(s => String(parseInt(s.date.split('-')[2], 10)).padStart(2, '0'))
      .join(', ');

    const monthTitle = `${MONTH_NAMES_PT[currentMonthIndex]}/${currentYear}`;
    const text = `📋 *Minha Escala de Trabalho - ${monthTitle}*\n` +
      `👤 *Colaborador:* ${currentProvider.name}\n` +
      `⏰ *Turno:* ${currentProvider.entryTime || '07h00'} às ${currentProvider.exitTime || '19h00'}\n` +
      `🟢 *Plantões (${countT}):* ${workingDays || 'Nenhum'}\n` +
      `🔵 *Total de Horas:* ${totalHours}h (${currentProvider.regime || '12x36'})\n\n` +
      `_Gerado pelo EscalaPro Gestão_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Export to Google Calendar / .ICS file
  const handleExportToICS = () => {
    if (myMonthlyShifts.length === 0) {
      alert('Nenhum plantão agendado para este mês.');
      return;
    }

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EscalaPro//Mobile//PT-BR',
      'CALSCALE:GREGORIAN',
    ];

    myMonthlyShifts
      .filter(s => s.shiftTypeId === 'st-t')
      .forEach(shift => {
        const cleanDate = shift.date.replace(/-/g, '');
        const entryClean = (currentProvider.entryTime || '07h00').replace(/[^0-9]/g, '').padEnd(4, '0') + '00';
        const exitClean = (currentProvider.exitTime || '19h00').replace(/[^0-9]/g, '').padEnd(4, '0') + '00';

        ics.push(
          'BEGIN:VEVENT',
          `SUMMARY:Plantão: ${currentProvider.name}`,
          `DTSTART:${cleanDate}T${entryClean}`,
          `DTEND:${cleanDate}T${exitClean}`,
          `DESCRIPTION:Plantão Técnico (${shift.workModality === 'home_office' ? 'Home Office' : 'Presencial'})`,
          `LOCATION:${shift.workModality === 'home_office' ? 'Home Office' : 'Setor Central'}`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });

    ics.push('END:VCALENDAR');
    const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `escala-${currentProvider.name.split(' ')[0].toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen pb-24 text-slate-100 bg-[#0c121c] flex flex-col antialiased">
      
      {/* 1. TOP HEADER (Avatar, Name, Date, Notification Bell) */}
      <div className="pt-3 pb-2.5 px-4 flex items-center justify-between sticky top-0 bg-[#0c121c]/95 backdrop-blur-md z-30 border-b border-[#1e2a3a] shadow-sm">
        <div className="flex items-center gap-3 relative">
          {/* Avatar button */}
          <button
            type="button"
            onClick={() => setShowUserPicker(!showUserPicker)}
            className="w-11 h-11 rounded-2xl bg-slate-800 border-2 border-cyan-500/40 active:scale-95 text-cyan-400 font-black text-sm flex items-center justify-center shadow-sm transition-all cursor-pointer ring-2 ring-cyan-500/20 shrink-0"
          >
            {getInitials(currentProvider.name)}
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowUserPicker(!showUserPicker)}
                className="font-extrabold text-sm text-white hover:text-cyan-400 flex items-center gap-1 transition-colors text-left"
              >
                <span className="truncate max-w-[150px]">{currentProvider.name.split(' ').slice(0, 2).join(' ')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/80">
                {currentProvider.regime || activeRegime}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 capitalize">
              {todayDayOfWeekName}, {String(todayDayNum).padStart(2, '0')} de {todayMonthName}
            </p>
          </div>

          {/* User Picker Dropdown Modal */}
          {showUserPicker && (
            <div className="absolute top-12 left-0 w-64 bg-[#141c28] border border-[#1e2a3a] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-xs font-bold uppercase text-slate-400 px-2 py-1">
                Trocar Colaborador:
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1">
                {providers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProviderId(p.id);
                      setShowUserPicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      p.id === currentProvider.id
                        ? 'bg-cyan-950/70 text-cyan-300 font-bold border border-cyan-800'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-xs text-slate-400">{p.regime || '12x36'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action icons (WhatsApp Share + Notification Bell) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareMyScheduleWhatsApp}
            className="w-10 h-10 rounded-full bg-cyan-950/70 border border-cyan-800/80 flex items-center justify-center text-cyan-300 hover:bg-cyan-900/80 transition-colors cursor-pointer shadow-sm"
            title="Compartilhar minha escala no WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenRequestsCenter}
            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors relative cursor-pointer shadow-sm"
            title="Notificações e Solicitações"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0c121c]" />
          </button>
        </div>
      </div>

      {/* 🔔 TOMORROW SHIFT REMINDER BANNER */}
      {isWorkingTomorrow && (
        <div className="mx-4 mt-2 px-3.5 py-2.5 bg-cyan-950/50 border border-cyan-800/70 rounded-2xl flex items-center justify-between gap-2 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-cyan-200 font-medium">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Lembrete: <strong>Amanhã você tem plantão</strong> das {currentProvider.entryTime || '07h00'} às {currentProvider.exitTime || '19h00'}.
            </span>
          </div>
        </div>
      )}

      {/* ✅ CONFIRM AWARENESS BANNER (Confirmar Ciência) */}
      {!isMonthAcknowledged && (
        <div className="mx-4 mt-2 p-3 bg-amber-950/50 border border-amber-800/80 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-amber-200 block">
              Escala Oficial Publicada
            </span>
            <span className="text-xs text-amber-300/80 block">
              Confirme que você visualizou seus plantões
            </span>
          </div>
          <button
            type="button"
            onClick={() => acknowledgeAllMonthlyShifts(currentProvider.id, currentYear, currentMonthIndex)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirmar Ciência</span>
          </button>
        </div>
      )}

      {/* TAB 1: ESCALA */}
      {activeTab === 'escala' && (
        <div className="px-4 space-y-4 pt-3">
          
          {/* 2. HERO CARD (Electric Blue & Cyan Gradient) */}
          <div className={`rounded-3xl p-5 shadow-md space-y-4 text-white ${
            isWorkingToday
              ? 'bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-900'
              : 'bg-gradient-to-br from-slate-800 via-slate-900 to-[#0c121c] border border-[#1e2a3a]'
          }`}>
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <span className="text-xs font-black uppercase tracking-wider text-white/90">
                  {isWorkingToday ? 'PLANTÃO ATIVO HOJE' : 'PRÓXIMO PLANTÃO'}
                </span>
              </div>

              {isWorkingToday ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-extrabold shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Trabalhando Hoje</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-slate-200 text-xs font-extrabold shadow-sm">
                  <Coffee className="w-3.5 h-3.5 text-slate-300" />
                  <span>Dia de Folga</span>
                </div>
              )}
            </div>

            {/* Time Row */}
            <div>
              <div className="text-[1.875rem] sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
                <span>{currentProvider.entryTime || '07:00'}</span>
                <span className="text-sm font-semibold text-white/80">às</span>
                <span>{currentProvider.exitTime || '19:00'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/90 mt-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span>
                  Setor Central • {todayModality === 'home_office' ? 'Home Office (HO)' : 'Presencial'}
                </span>
              </div>
            </div>

            {/* Progress Bar (Visible on shift day) */}
            <div className="space-y-1.5 bg-black/25 backdrop-blur-xs p-3 rounded-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80 font-medium">Progresso do turno (12h)</span>
                <span className="font-extrabold text-white">
                  {isWorkingToday ? `${remainingHours}h restantes` : 'Turno programado'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${isWorkingToday ? Math.max(15, progressPercentage) : 100}%` }}
                />
              </div>
            </div>

            {/* Team on duty row */}
            <div className="flex items-center justify-between pt-1 border-t border-white/20">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {teammatesOnDutyToday.slice(0, 3).map(tm => (
                    <div
                      key={tm.id}
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-white/60 bg-slate-800 text-cyan-400 text-xs font-black flex items-center justify-center shadow-xs"
                      title={tm.name}
                    >
                      {getInitials(tm.name)}
                    </div>
                  ))}
                  {teammatesOnDutyToday.length > 3 && (
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white/60 bg-white/30 text-white text-xs font-black flex items-center justify-center">
                      +{teammatesOnDutyToday.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-white/90 font-medium">
                  {teammatesOnDutyToday.length > 0 ? 'Equipe no plantão' : 'Plantonista exclusivo'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('equipe')}
                className="text-xs font-bold text-white hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Ver time</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. THREE STAT CARDS (Plantões, Folgas, Regime) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#141c28] border border-[#1e2a3a] p-3 rounded-2xl text-center space-y-0.5 shadow-md">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                PLANTÕES
              </span>
              <div className="text-2xl font-black text-cyan-400">{countT}</div>
              <span className="text-xs text-slate-400 font-medium block">
                {totalHours}h totais
              </span>
            </div>

            <div className="bg-[#141c28] border border-[#1e2a3a] p-3 rounded-2xl text-center space-y-0.5 shadow-md">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                FOLGAS
              </span>
              <div className="text-2xl font-black text-slate-200">{countD}</div>
              <span className="text-xs text-slate-400 font-medium block">
                descansos
              </span>
            </div>

            <div className="bg-[#141c28] border border-[#1e2a3a] p-3 rounded-2xl text-center space-y-0.5 shadow-md">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                REGIME
              </span>
              <div className="text-2xl font-black text-white">
                {currentProvider.regime || activeRegime}
              </div>
              <span className="text-xs text-slate-400 font-medium block">
                oficial ativo
              </span>
            </div>
          </div>

          {/* 4. LINHA DO TEMPO (Timeline with Week / Month toggle + Day Detail Modal) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">Linha do Tempo</h3>
              
              <div className="flex items-center bg-[#0c121c] p-0.5 rounded-xl border border-[#1e2a3a] text-xs">
                <button
                  type="button"
                  onClick={() => setTimelineMode('week')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    timelineMode === 'week'
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineMode('month')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    timelineMode === 'month'
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mês
                </button>
              </div>
            </div>

            {/* List of Day Cards */}
            <div className="space-y-2">
              {timelineDays.map(d => {
                const shift = assignments.find(
                  a => a.providerId === currentProvider.id && a.date === d.dateStr
                );
                const isWorking = shift?.shiftTypeId === 'st-t';
                const isResting = shift?.shiftTypeId === 'st-d';
                const isToday = d.dateStr === todayISO;
                const isPast = d.dateStr < todayISO;
                const hasNotes = Boolean(shift?.notes);
                const dayOfWeekShort = DAYS_SHORT_PT[d.dayOfWeek].toUpperCase();
                const dayNumFormatted = String(d.dayNumber).padStart(2, '0');

                let cardClass = 'bg-[#141c28] border border-[#1e2a3a] hover:border-slate-600 shadow-sm';
                if (isToday) {
                  cardClass = 'bg-[#141c28] border-2 border-cyan-400 shadow-md ring-2 ring-cyan-500/20';
                }

                return (
                  <div
                    key={d.dateStr}
                    onClick={() => setSelectedDayDetail({
                      dateStr: d.dateStr,
                      dayNumber: d.dayNumber,
                      dayOfWeek: d.dayOfWeek,
                      shift,
                    })}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-98 ${cardClass}`}
                  >
                    {/* Left: Date Box */}
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                        isToday
                          ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-sm'
                          : isWorking
                          ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800'
                          : 'bg-[#0c121c] text-slate-300 border-[#1e2a3a]'
                      }`}
                    >
                      <span className="text-xs font-extrabold uppercase leading-tight">
                        {dayOfWeekShort}
                      </span>
                      <span className="text-base font-black leading-tight">
                        {dayNumFormatted}
                      </span>
                    </div>

                    {/* Middle: Shift Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-white truncate">
                          {isWorking
                            ? isToday
                              ? 'Plantão Ativo Hoje'
                              : 'Plantão (12h)'
                            : isResting
                            ? 'Dia de Descanso'
                            : 'Sem Escala'}
                        </span>
                        {isToday && (
                          <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                            Hoje
                          </span>
                        )}
                        {hasNotes && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title="Possui anotação" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {isWorking
                          ? `${currentProvider.entryTime || '07:00'} às ${currentProvider.exitTime || '19:00'} • Central`
                          : isResting
                          ? shift?.notes || 'Descanso programado (D)'
                          : 'Sem agendamento'}
                      </p>
                    </div>

                    {/* Right: Badge */}
                    <div className="shrink-0">
                      {isPast && !isToday && (
                        <span className="text-xs font-bold text-slate-400 bg-[#0c121c] px-2.5 py-1 rounded-lg border border-[#1e2a3a]">
                          Concluído
                        </span>
                      )}

                      {!isPast && isWorking && (
                        <span className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                          T
                        </span>
                      )}

                      {!isPast && isResting && (
                        <span className="w-7 h-7 rounded-lg bg-slate-700/80 text-slate-200 border border-slate-600/50 font-bold text-xs flex items-center justify-center shadow-xs">
                          D
                        </span>
                      )}

                      {!isPast && !isWorking && !isResting && (
                        <span className="w-7 h-7 rounded-lg bg-[#0c121c] text-slate-500 border border-[#1e2a3a] font-bold text-xs flex items-center justify-center">
                          -
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. AÇÕES RÁPIDAS (Quick Action Buttons) */}
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              AÇÕES RÁPIDAS
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onRequestSwap}
                className="p-3.5 rounded-2xl bg-[#141c28] hover:bg-slate-800 active:scale-98 border border-[#1e2a3a] text-left space-y-1 transition-all cursor-pointer shadow-md group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-950/70 border border-blue-800/80 text-cyan-300 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white group-hover:text-cyan-300 transition-colors">
                    Solicitar Troca
                  </h4>
                  <p className="text-xs text-slate-400">Permutar com colega</p>
                </div>
              </button>

              <button
                type="button"
                onClick={onNotifyAbsence}
                className="p-3.5 rounded-2xl bg-[#141c28] hover:bg-slate-800 active:scale-98 border border-[#1e2a3a] text-left space-y-1 transition-all cursor-pointer shadow-md group"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white group-hover:text-rose-300 transition-colors">
                    Notificar Falta
                  </h4>
                  <p className="text-xs text-slate-400">Atestado / Motivo</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportToICS}
              className="w-full py-3 px-4 rounded-2xl bg-[#141c28] hover:bg-slate-800 active:scale-98 border border-[#1e2a3a] flex items-center justify-center gap-2 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer shadow-md"
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Sincronizar com Google Agenda (.ics)</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: EQUIPE */}
      {activeTab === 'equipe' && (
        <div className="px-4 space-y-3 pt-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base font-extrabold text-white">Equipe de Plantão</h3>
            <span className="text-xs text-slate-400">{providers.length} colaboradores</span>
          </div>

          <div className="space-y-2">
            {providers
              .filter(p => (p.regime || '12x36') === activeRegime)
              .map(p => {
                const shift = assignments.find(a => a.providerId === p.id && a.date === todayISO);
                const isWorking = shift?.shiftTypeId === 'st-t';

                return (
                  <div
                    key={p.id}
                    className="p-3 bg-[#141c28] border border-[#1e2a3a] rounded-2xl flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-cyan-500/30 font-black text-xs text-cyan-400 flex items-center justify-center shrink-0">
                        {getInitials(p.name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{p.name}</h4>
                        <p className="text-xs text-slate-400">
                          {p.role} • {p.entryTime || '07h00'} às {p.exitTime || '19h00'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isWorking ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/80">
                          🟢 No Plantão
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#0c121c] text-slate-400 border border-[#1e2a3a]">
                          Folga
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: TROCAS */}
      {activeTab === 'trocas' && (
        <div className="px-4 space-y-3 pt-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base font-extrabold text-white">Central de Permutas</h3>
            <button
              type="button"
              onClick={onRequestSwap}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              + Nova Troca
            </button>
          </div>

          <div className="p-5 bg-[#141c28] border border-[#1e2a3a] rounded-3xl text-center space-y-3 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/70 border border-blue-800/80 text-cyan-300 flex items-center justify-center mx-auto">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Precisa trocar um plantão?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Selecione a data que você não poderá comparecer e o colega para permutar.
              </p>
            </div>
            <button
              type="button"
              onClick={onRequestSwap}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Solicitar Troca com Colega
            </button>
          </div>
        </div>
      )}

      {/* 6. BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c121c]/95 backdrop-blur-lg border-t border-[#1e2a3a] max-w-md mx-auto px-6 py-2.5 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('escala')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'escala' ? 'text-cyan-400 font-black scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-xs">Escala</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipe')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'equipe' ? 'text-cyan-400 font-black scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">Equipe</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trocas')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'trocas' ? 'text-cyan-400 font-black scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs">Trocas</span>
        </button>
      </div>

      {/* 7. DAY DETAIL BOTTOM SHEET MODAL */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-[#141c28] border border-[#1e2a3a] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-w-md w-full space-y-4 text-slate-100">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e2a3a] pb-3">
              <div>
                <h4 className="font-extrabold text-base text-white">
                  {DAYS_FULL_PT[selectedDayDetail.dayOfWeek]}, {String(selectedDayDetail.dayNumber).padStart(2, '0')} de {MONTH_NAMES_PT[currentMonthIndex]}
                </h4>
                <p className="text-xs text-slate-400">
                  Detalhes da escala de {currentProvider.name.split(' ')[0]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status overview */}
            <div className="p-3 bg-[#0c121c] rounded-2xl border border-[#1e2a3a] flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 block">Status</span>
                <span className="text-sm font-black text-white">
                  {selectedDayDetail.shift?.shiftTypeId === 'st-t'
                    ? 'Plantão de Trabalho (T)'
                    : selectedDayDetail.shift?.shiftTypeId === 'st-d'
                    ? 'Dia de Descanso / Folga (D)'
                    : 'Sem Escala (-)'}
                </span>
              </div>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                selectedDayDetail.shift?.shiftTypeId === 'st-t'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-700/80 text-slate-200 border border-slate-600/50'
              }`}>
                {selectedDayDetail.shift?.shiftTypeId === 'st-t' ? 'T' : 'D'}
              </span>
            </div>

            {/* Shift info */}
            {selectedDayDetail.shift?.shiftTypeId === 'st-t' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#1e2a3a]">
                  <span className="text-slate-400">Horário:</span>
                  <strong className="text-white">{currentProvider.entryTime || '07h00'} às {currentProvider.exitTime || '19h00'} (12 horas)</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#1e2a3a]">
                  <span className="text-slate-400">Modalidade:</span>
                  <strong className="text-white">{selectedDayDetail.shift.workModality === 'home_office' ? '🏠 Home Office (HO)' : '🏢 Presencial (Setor Central)'}</strong>
                </div>
                {selectedDayDetail.shift.notes && (
                  <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-cyan-300 text-xs">
                    <strong>Anotação da Liderança:</strong> {selectedDayDetail.shift.notes}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {selectedDayDetail.shift?.shiftTypeId === 'st-t' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDayDetail(null);
                    if (onRequestSwap) onRequestSwap();
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 text-cyan-200" />
                  <span>Solicitar Troca deste Plantão</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
