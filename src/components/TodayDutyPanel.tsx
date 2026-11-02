import React, { useState } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import {
  formatDateToISO,
  DAYS_SHORT_PT,
  MONTH_NAMES_PT
} from '../utils/dateUtils';
import {
  Users,
  Building2,
  Home,
  Coffee,
  CalendarDays
} from 'lucide-react';

export const TodayDutyPanel: React.FC = () => {
  const {
    assignments,
    providers,
    activeRegime,
  } = useSchedule();

  // Selected date (defaults to today)
  const todayISO = formatDateToISO(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  // Date helpers for selectedDate
  const [selY, selM, selD] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(selY, selM - 1, selD);
  const dayOfWeekShort = DAYS_SHORT_PT[selectedDateObj.getDay()];
  const isSelectedToday = selectedDate === todayISO;

  // Filter providers by active regime (12x36 or 5x2)
  const regimeProviders = providers.filter(
    p => (p.regime || '12x36') === activeRegime
  );

  // Shifts on selected date
  const dayShifts = assignments.filter(a => a.date === selectedDate);

  // Working count
  const workingShifts = regimeProviders.map(prov => {
    const shift = dayShifts.find(a => a.providerId === prov.id);
    return {
      isWorking: shift?.shiftTypeId === 'st-t',
      modality: shift?.workModality || 'presencial',
    };
  }).filter(item => item.isWorking);

  const totalWorking = workingShifts.length;
  const presencialCount = workingShifts.filter(w => w.modality === 'presencial').length;
  const homeOfficeCount = workingShifts.filter(w => w.modality === 'home_office').length;
  const totalResting = Math.max(0, regimeProviders.length - totalWorking);

  const handleGoToTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateToISO(d));
  };

  const handleGoToToday = () => {
    setSelectedDate(todayISO);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-3.5 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Date indicator + quick switches */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-white tracking-tight flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {isSelectedToday ? 'Hoje' : 'Data'}: {dayOfWeekShort}, {String(selD).padStart(2, '0')}/{MONTH_NAMES_PT[selM - 1].substring(0, 3)}
            </span>
          </span>
        </div>

        <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {activeRegime}
        </span>

        {/* Date Selector Buttons */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={handleGoToToday}
            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
              isSelectedToday
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={handleGoToTomorrow}
            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
              !isSelectedToday && selectedDate === formatDateToISO(new Date(Date.now() + 86400000))
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Amanhã
          </button>
        </div>
      </div>

      {/* Right: Numerical Metrics Only (Compact, No Cards, No WhatsApp) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Total Escalados */}
        <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-600/50 px-2.5 py-1 rounded-xl text-emerald-300 font-bold">
          <span className="text-sm font-black text-white">{totalWorking}</span>
          <span>Escalados</span>
        </div>

        {/* Presencial */}
        <div className="flex items-center gap-1 text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800" title="Plantões presenciais">
          <Building2 className="w-3 h-3 text-slate-400" />
          <span className="font-bold text-white">{presencialCount}</span>
          <span className="text-slate-400">Presencial</span>
        </div>

        {/* Home Office (se houver) */}
        {homeOfficeCount > 0 && (
          <div className="flex items-center gap-1 text-sky-300 bg-sky-950/70 px-2.5 py-1 rounded-xl border border-sky-600/40" title="Plantões em home office">
            <Home className="w-3 h-3 text-sky-400" />
            <span className="font-bold text-white">{homeOfficeCount}</span>
            <span className="text-sky-400">HO</span>
          </div>
        )}

        {/* Folga */}
        <div className="flex items-center gap-1 text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800" title="Colaboradores em folga neste dia">
          <Coffee className="w-3 h-3 text-slate-500" />
          <span className="font-bold text-slate-200">{totalResting}</span>
          <span>Folga</span>
        </div>

        {/* Total Equipe */}
        <div className="hidden md:flex items-center gap-1 text-slate-500 pl-1">
          <Users className="w-3 h-3" />
          <span>{regimeProviders.length} total</span>
        </div>
      </div>
    </div>
  );
};
