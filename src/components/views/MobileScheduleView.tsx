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
  ChevronLeft,
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
  Check,
  Lock,
  Coins,
  Notebook
} from 'lucide-react';
import { Provider, ShiftAssignment } from '../../types';

interface MobileScheduleViewProps {
  onRequestSwap?: () => void;
  onNotifyAbsence?: () => void;
  onOpenRequestsCenter?: () => void;
  onSwitchToDesktopGrid?: () => void;
  onOpenCollaboratorAuth?: (provider?: Provider) => void;
  onOpenLeaderAuth?: () => void;
  onOpenMarketplace?: () => void;
  onOpenFeedbacks?: () => void;
}

export const MobileScheduleView: React.FC<MobileScheduleViewProps> = ({
  onRequestSwap,
  onNotifyAbsence,
  onOpenRequestsCenter,
  onOpenCollaboratorAuth,
  onOpenLeaderAuth,
  onOpenMarketplace,
  onOpenFeedbacks,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    providers,
    assignments,
    activeProviderId,
    setActiveProviderId,
    activeRegime,
    shiftTypes,
    role,
    isLeaderAuthenticated,
    acknowledgeAllMonthlyShifts,
    isMonthPublished,
    activeModule,
    setActiveModule,
  } = useSchedule();

  const [mobileNotice, setMobileNotice] = useState<string | null>(null);

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
      setMobileNotice('Nenhum plantão agendado para este mês.');
      window.setTimeout(() => setMobileNotice(null), 3000);
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
    <div className="w-full flex-1 pb-24 text-[#e3e1e9] bg-[#090A0F] flex flex-col antialiased overflow-x-hidden">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
        {/* 1. COLLABORATOR CONTEXT BAR (Unified Obsidian Dark, below global OminiHub Navbar) */}
        <div className="mx-3.5 mt-3 p-3 rounded-2xl bg-[#0e1016] border border-white/[0.08] flex items-center justify-between gap-2.5 relative z-30">
          <div className="flex items-center gap-2.5 relative min-w-0">
            {/* Avatar button */}
            <button
              type="button"
              onClick={() => setShowUserPicker(!showUserPicker)}
              className="w-10 h-10 rounded-xl bg-[#141720] border border-[#00d2d3]/35 active:scale-95 text-[#00d2d3] font-black text-xs flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0"
            >
              {getInitials(currentProvider.name)}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowUserPicker(!showUserPicker)}
                  className="font-bold text-xs sm:text-sm text-white hover:text-[#00d2d3] flex items-center gap-1 transition-colors text-left cursor-pointer"
                >
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {currentProvider.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </button>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#00d2d3]/12 text-[#00d2d3] border border-[#00d2d3]/25">
                  {currentProvider.regime || activeRegime}
                </span>
              </div>
              <p className="text-[11px] font-medium text-zinc-400 capitalize truncate">
                {todayDayOfWeekName}, {String(todayDayNum).padStart(2, '0')} de {todayMonthName}
              </p>
            </div>

            {/* User Picker Dropdown Modal */}
            {showUserPicker && (
              <div className="absolute top-12 left-0 w-64 bg-[#0e1017] border border-white/[0.12] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="text-[11px] font-bold uppercase text-zinc-400 px-2 py-1">
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
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        p.id === currentProvider.id
                          ? 'bg-[#00d2d3]/15 text-[#00d2d3] font-bold border border-[#00d2d3]/30'
                          : 'text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-[11px] font-mono text-zinc-400">{p.regime || '12x36'}</span>
                    </button>
                  ))}
                </div>

                {onOpenCollaboratorAuth && (
                  <div className="pt-2 border-t border-white/[0.08] mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserPicker(false);
                        onOpenCollaboratorAuth();
                      }}
                      className="w-full text-center px-2 py-1.5 bg-[#00d2d3]/12 hover:bg-[#00d2d3]/20 border border-[#00d2d3]/25 rounded-xl text-xs font-bold text-[#00d2d3] transition-colors cursor-pointer"
                    >
                      Lista Completa & Gerenciar PIN
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Personal Schedule Actions (Share WhatsApp & Requests Bell) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleShareMyScheduleWhatsApp}
              className="w-8.5 h-8.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-[#00d2d3] transition-colors cursor-pointer"
              title="Compartilhar minha escala no WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenRequestsCenter}
              className="w-8.5 h-8.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-colors relative cursor-pointer"
              title="Notificações e Solicitações"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00d2d3] ring-2 ring-[#0e1016]" />
            </button>
          </div>
        </div>

        {/* 1B. MONTH SELECTOR STRIP (< Mês Anterior | Mês/Ano + Hoje | Próximo Mês >) */}
        <div className="mx-3.5 mt-2.5 px-2.5 py-2 rounded-2xl bg-[#0e1016] border border-white/[0.08] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="w-8.5 h-8.5 rounded-xl bg-[#090A0F] hover:bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 min-w-0 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
              {MONTH_NAMES_PT[currentMonthIndex]} {currentYear}
            </span>
            {isMonthPublished(currentYear, currentMonthIndex) ? (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-300 border border-emerald-500/25">
                Oficial
              </span>
            ) : (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                Prévia
              </span>
            )}
            {(currentYear !== todayObj.getFullYear() || currentMonthIndex !== todayObj.getMonth()) && (
              <button
                type="button"
                onClick={goToToday}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00d2d3]/15 hover:bg-[#00d2d3]/25 text-[#00d2d3] border border-[#00d2d3]/30 transition-colors cursor-pointer"
                title="Voltar para o mês atual"
              >
                Hoje
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            className="w-8.5 h-8.5 rounded-xl bg-[#090A0F] hover:bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {mobileNotice && (
          <div className="mx-3.5 mt-2 px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-center">
            {mobileNotice}
          </div>
        )}

        {/* 🔔 TOMORROW SHIFT REMINDER BANNER */}
        {isWorkingTomorrow && (
          <div className="mx-3.5 mt-2.5 px-3.5 py-2.5 bg-[#0e1016] border border-[#00d2d3]/30 rounded-2xl flex items-center justify-between gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-medium">
              <Clock className="w-4 h-4 text-[#00d2d3] shrink-0" />
              <span>
                Lembrete: <strong className="text-white">Amanhã você tem plantão</strong> das {currentProvider.entryTime || '07h00'} às {currentProvider.exitTime || '19h00'}.
              </span>
            </div>
          </div>
        )}

        {/* ✅ CONFIRM AWARENESS BANNER (Confirmar Ciência) */}
        {myMonthlyShifts.length > 0 && !isMonthAcknowledged && (
          <div className="mx-3.5 mt-2.5 p-3 bg-[#0e1016] border border-amber-500/30 rounded-2xl flex items-center justify-between gap-2.5 shadow-xs">
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-bold text-amber-300 block">
                Escala Oficial • {MONTH_NAMES_PT[currentMonthIndex]}/{currentYear}
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Confirme que você visualizou seus plantões deste mês
              </span>
            </div>
            <button
              type="button"
              onClick={() => acknowledgeAllMonthlyShifts(currentProvider.id, currentYear, currentMonthIndex)}
              className="px-3 py-1.5 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar Ciência</span>
            </button>
          </div>
        )}

        {/* TAB 1: ESCALA */}
        {activeTab === 'escala' && (
          <div className="px-3.5 space-y-4 pt-3">
            
            {/* 2. HERO CARD (Unified Obsidian Dark + Cyan Accent — No Electric Blue Block) */}
            <div
              className={`relative overflow-hidden rounded-3xl p-5 space-y-4 text-white border ${
                isWorkingToday
                  ? 'bg-gradient-to-br from-[#0f171a] via-[#0e1016] to-[#090A0F] border-[#00d2d3]/35 shadow-[0_12px_32px_rgba(0,0,0,0.5)]'
                  : 'bg-[#0e1016] border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
              }`}
            >
              {isWorkingToday && (
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00d2d3]/50 to-transparent pointer-events-none" />
              )}

              {/* Top row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isWorkingToday
                        ? 'bg-[#00d2d3] animate-pulse shadow-[0_0_8px_rgba(0,210,211,0.8)]'
                        : 'bg-zinc-500'
                    }`}
                  />
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
                    {isWorkingToday ? 'PLANTÃO ATIVO HOJE' : 'PRÓXIMO PLANTÃO'}
                  </span>
                </div>

                {isWorkingToday ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span>Trabalhando Hoje</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs font-bold">
                    <Coffee className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Dia de Folga</span>
                  </div>
                )}
              </div>

              {/* Time Row */}
              <div>
                <div className="text-[1.875rem] sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-2 font-mono">
                  <span>{currentProvider.entryTime || '07:00'}</span>
                  <span className="text-sm font-sans font-semibold text-zinc-400">às</span>
                  <span>{currentProvider.exitTime || '19:00'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-300 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#00d2d3] shrink-0" />
                  <span>
                    Setor Central • {todayModality === 'home_office' ? 'Home Office (HO)' : 'Presencial'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 bg-[#090A0F] border border-white/[0.06] p-3 rounded-2xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Progresso do turno (12h)</span>
                  <span className="font-bold text-white">
                    {isWorkingToday ? `${remainingHours}h restantes` : 'Turno programado'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00d2d3] transition-all duration-500"
                    style={{ width: `${isWorkingToday ? Math.max(15, progressPercentage) : 100}%` }}
                  />
                </div>
              </div>

              {/* Team on duty row */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2 overflow-hidden">
                    {teammatesOnDutyToday.slice(0, 3).map(tm => (
                      <div
                        key={tm.id}
                        className="h-6 w-6 rounded-full ring-2 ring-[#0e1016] bg-[#141720] text-[#00d2d3] border border-white/[0.10] text-[10px] font-bold flex items-center justify-center"
                        title={tm.name}
                      >
                        {getInitials(tm.name)}
                      </div>
                    ))}
                    {teammatesOnDutyToday.length > 3 && (
                      <div className="h-6 w-6 rounded-full ring-2 ring-[#0e1016] bg-white/[0.12] text-white text-[10px] font-bold flex items-center justify-center">
                        +{teammatesOnDutyToday.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-zinc-300 font-medium">
                    {teammatesOnDutyToday.length > 0 ? 'Equipe no plantão' : 'Plantonista exclusivo'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('equipe')}
                  className="text-xs font-bold text-[#00d2d3] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Ver time</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. THREE STAT CARDS (Plantões, Folgas, Regime) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#0e1016] border border-white/[0.08] p-3 rounded-2xl text-center space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  PLANTÕES
                </span>
                <div className="text-2xl font-black text-[#00d2d3] font-mono">{countT}</div>
                <span className="text-[11px] text-zinc-400 font-medium block">
                  {totalHours}h totais
                </span>
              </div>

              <div className="bg-[#0e1016] border border-white/[0.08] p-3 rounded-2xl text-center space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  FOLGAS
                </span>
                <div className="text-2xl font-black text-zinc-100 font-mono">{countD}</div>
                <span className="text-[11px] text-zinc-400 font-medium block">
                  descansos
                </span>
              </div>

              <div className="bg-[#0e1016] border border-white/[0.08] p-3 rounded-2xl text-center space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  REGIME
                </span>
                <div className="text-2xl font-black text-white font-mono">
                  {currentProvider.regime || activeRegime}
                </div>
                <span className="text-[11px] text-zinc-400 font-medium block">
                  oficial ativo
                </span>
              </div>
            </div>

            {/* 4. LINHA DO TEMPO (Timeline with Week / Month toggle + Day Detail Modal) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Linha do Tempo • {MONTH_NAMES_PT[currentMonthIndex].slice(0, 3)}/{String(currentYear).slice(-2)}
                </h3>
                
                <div className="flex items-center bg-[#0e1016] p-0.5 rounded-xl border border-white/[0.08] text-xs">
                  <button
                    type="button"
                    onClick={() => setTimelineMode('week')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      timelineMode === 'week'
                        ? 'bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineMode('month')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      timelineMode === 'month'
                        ? 'bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30'
                        : 'text-zinc-400 hover:text-zinc-200'
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

                  let cardClass = 'bg-[#0e1016] border border-white/[0.08] hover:border-white/[0.16]';
                  if (isToday) {
                    cardClass = 'bg-[#0e1016] border border-[#00d2d3]/60 ring-1 ring-[#00d2d3]/25';
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
                            ? 'bg-[#00d2d3] text-[#003731] font-black border-[#00d2d3] shadow-xs'
                            : isWorking
                            ? 'bg-[#00d2d3]/12 text-[#00d2d3] border-[#00d2d3]/30'
                            : 'bg-[#090A0F] text-zinc-300 border-white/[0.06]'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase leading-tight">
                          {dayOfWeekShort}
                        </span>
                        <span className="text-base font-black leading-tight font-mono">
                          {dayNumFormatted}
                        </span>
                      </div>

                      {/* Middle: Shift Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate">
                            {isWorking
                              ? isToday
                                ? 'Plantão Ativo Hoje'
                                : 'Plantão (12h)'
                              : isResting
                              ? 'Dia de Descanso'
                              : 'Sem Escala'}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30">
                              Hoje
                            </span>
                          )}
                          {hasNotes && (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Possui anotação" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 truncate">
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
                          <span className="text-[11px] font-semibold text-zinc-400 bg-[#090A0F] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                            Concluído
                          </span>
                        )}

                        {!isPast && isWorking && (
                          <span className="w-7 h-7 rounded-lg bg-[#00d2d3] text-[#003731] font-black text-xs flex items-center justify-center shadow-xs">
                            T
                          </span>
                        )}

                        {!isPast && isResting && (
                          <span className="w-7 h-7 rounded-lg bg-white/[0.06] text-zinc-200 border border-white/[0.08] font-bold text-xs flex items-center justify-center">
                            D
                          </span>
                        )}

                        {!isPast && !isWorking && !isResting && (
                          <span className="w-7 h-7 rounded-lg bg-[#090A0F] text-zinc-500 border border-white/[0.06] font-bold text-xs flex items-center justify-center">
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                AÇÕES RÁPIDAS
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onRequestSwap}
                  className="p-3.5 rounded-2xl bg-[#0e1016] hover:bg-white/[0.04] active:scale-98 border border-white/[0.08] text-left space-y-1.5 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#00d2d3]/12 border border-[#00d2d3]/25 text-[#00d2d3] flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white group-hover:text-[#00d2d3] transition-colors">
                      Solicitar Troca
                    </h4>
                    <p className="text-[11px] text-zinc-400">Permutar com colega</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onNotifyAbsence}
                  className="p-3.5 rounded-2xl bg-[#0e1016] hover:bg-white/[0.04] active:scale-98 border border-white/[0.08] text-left space-y-1.5 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/12 border border-rose-500/25 text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white group-hover:text-rose-300 transition-colors">
                      Notificar Falta
                    </h4>
                    <p className="text-[11px] text-zinc-400">Atestado / Motivo</p>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportToICS}
                className="w-full py-3 px-4 rounded-2xl bg-[#0e1016] hover:bg-white/[0.04] active:scale-98 border border-white/[0.08] flex items-center justify-center gap-2 text-xs font-bold text-zinc-200 hover:text-white transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#00d2d3]" />
                <span>Sincronizar com Google Agenda (.ics)</span>
              </button>

              {isLeaderAuthenticated && onOpenFeedbacks && (
                <button
                  type="button"
                  onClick={onOpenFeedbacks}
                  className="w-full py-3 px-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/15 active:scale-98 border border-purple-500/25 flex items-center justify-center gap-2 text-xs font-bold text-purple-200 transition-all cursor-pointer"
                >
                  <Notebook className="w-4 h-4 text-purple-300" />
                  <span>Abrir Diário de Feedbacks (Gestor)</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: EQUIPE */}
        {activeTab === 'equipe' && (
          <div className="px-3.5 space-y-3 pt-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm sm:text-base font-bold text-white">Equipe de Plantão</h3>
              <span className="text-xs text-zinc-400">{providers.length} colaboradores</span>
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
                      className="p-3 bg-[#0e1016] border border-white/[0.08] rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#141720] border border-[#00d2d3]/25 font-bold text-xs text-[#00d2d3] flex items-center justify-center shrink-0">
                          {getInitials(p.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">{p.name}</h4>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {p.role} • {p.entryTime || '07h00'} às {p.exitTime || '19h00'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isWorking ? (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#00d2d3]/12 text-[#00d2d3] border border-[#00d2d3]/30 inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00d2d3]" />
                            <span>No Plantão</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#090A0F] text-zinc-400 border border-white/[0.06]">
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
          <div className="px-3.5 space-y-3 pt-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm sm:text-base font-bold text-white">Central de Permutas</h3>
              <button
                type="button"
                onClick={onRequestSwap}
                className="px-3 py-1.5 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                + Nova Troca
              </button>
            </div>

            <div className="p-5 bg-[#0e1016] border border-white/[0.08] rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00d2d3]/12 border border-[#00d2d3]/25 text-[#00d2d3] flex items-center justify-center mx-auto">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Precisa trocar um plantão?</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Selecione a data que você não poderá comparecer e o colega para permutar.
                </p>
              </div>
              <button
                type="button"
                onClick={onRequestSwap}
                className="w-full py-2.5 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Solicitar Troca com Colega
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. BOTTOM SUB-NAVIGATION BAR (Unified Obsidian Dark Glass) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0d0e13]/95 backdrop-blur-2xl border-t border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-6 py-2.5 flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveTab('escala')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'escala' ? 'text-[#00d2d3] font-bold scale-105' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[11px]">Escala</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equipe')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'equipe' ? 'text-[#00d2d3] font-bold scale-105' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px]">Equipe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trocas')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'trocas' ? 'text-[#00d2d3] font-bold scale-105' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[11px]">Trocas</span>
          </button>
        </div>
      </div>

      {/* 7. DAY DETAIL BOTTOM SHEET MODAL */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-[#0e1017] border border-white/[0.10] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-w-md w-full space-y-4 text-[#e3e1e9]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h4 className="font-bold text-base text-white">
                  {DAYS_FULL_PT[selectedDayDetail.dayOfWeek]}, {String(selectedDayDetail.dayNumber).padStart(2, '0')} de {MONTH_NAMES_PT[currentMonthIndex]}
                </h4>
                <p className="text-xs text-zinc-400">
                  Detalhes da escala de {currentProvider.name.split(' ')[0]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status overview */}
            <div className="p-3 bg-[#141720] rounded-2xl border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-zinc-400 block">Status</span>
                <span className="text-sm font-bold text-white">
                  {selectedDayDetail.shift?.shiftTypeId === 'st-t'
                    ? 'Plantão de Trabalho (T)'
                    : selectedDayDetail.shift?.shiftTypeId === 'st-d'
                    ? 'Dia de Descanso / Folga (D)'
                    : 'Sem Escala (-)'}
                </span>
              </div>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                selectedDayDetail.shift?.shiftTypeId === 'st-t'
                  ? 'bg-[#00d2d3] text-[#003731] shadow-xs'
                  : 'bg-white/[0.08] text-zinc-200 border border-white/[0.10]'
              }`}>
                {selectedDayDetail.shift?.shiftTypeId === 'st-t' ? 'T' : 'D'}
              </span>
            </div>

            {/* Shift info */}
            {selectedDayDetail.shift?.shiftTypeId === 'st-t' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-zinc-400">Horário:</span>
                  <strong className="text-white">{currentProvider.entryTime || '07h00'} às {currentProvider.exitTime || '19h00'} (12 horas)</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-zinc-400">Modalidade:</span>
                  <strong className="text-white">{selectedDayDetail.shift.workModality === 'home_office' ? 'Home Office (HO)' : 'Presencial (Setor Central)'}</strong>
                </div>
                {selectedDayDetail.shift.notes && (
                  <div className="p-2.5 bg-[#00d2d3]/10 border border-[#00d2d3]/25 rounded-xl text-[#00d2d3] text-xs">
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
                  className="w-full py-2.5 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Solicitar Troca deste Plantão</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="w-full py-2 bg-[#141720] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
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
