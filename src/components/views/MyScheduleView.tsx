import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  CalendarCheck,
  FileDown
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { formatFriendlyDate, formatShortDate } from '../../utils/dateUtils';
import { ShiftAssignment } from '../../types';

interface MyScheduleViewProps {
  onRequestSwapForShift: (shift: ShiftAssignment) => void;
  onOpenShiftDetail: (shift: ShiftAssignment) => void;
  onPrint: () => void;
}

export const MyScheduleView: React.FC<MyScheduleViewProps> = ({
  onRequestSwapForShift,
  onOpenShiftDetail,
}) => {
  const {
    activeProviderId,
    providers,
    assignments,
    shiftTypes,
    departments,
    currentYear,
    currentMonthIndex,
    toggleAcknowledgeShift,
  } = useSchedule();

  const provider = providers.find(p => p.id === activeProviderId);

  // All shifts for this provider in current month
  const myMonthlyShifts = assignments
    .filter(a => {
      if (a.providerId !== activeProviderId) return false;
      const [y, m] = a.date.split('-').map(Number);
      return y === currentYear && m === currentMonthIndex + 1;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate metrics
  const totalHours = myMonthlyShifts.reduce((acc, shift) => {
    const st = shiftTypes.find(s => s.id === shift.shiftTypeId);
    return acc + (st?.durationHours || 0);
  }, 0);

  const maxHours = provider?.maxMonthlyHours || 144;
  const hoursPercentage = Math.min(100, Math.round((totalHours / maxHours) * 100));

  // Find next upcoming shift
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingShifts = myMonthlyShifts.filter(s => s.date >= todayStr);
  const nextShift = upcomingShifts[0];
  const nextShiftType = nextShift ? shiftTypes.find(s => s.id === nextShift.shiftTypeId) : null;
  const nextDept = nextShift ? departments.find(d => d.id === nextShift.departmentId) : null;

  const acknowledgedCount = myMonthlyShifts.filter(s => s.acknowledgedByProvider).length;

  // Export iCal
  const exportToICS = () => {
    if (myMonthlyShifts.length === 0) return;

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EscalaPro//Escala de Trabalho//PT-BR',
      'CALSCALE:GREGORIAN',
    ];

    myMonthlyShifts.forEach(shift => {
      const st = shiftTypes.find(s => s.id === shift.shiftTypeId);
      const dept = departments.find(d => d.id === shift.departmentId);
      const cleanDate = shift.date.replace(/-/g, '');
      const startHour = (st?.startTime || '07:00').replace(':', '') + '00';
      const endHour = (st?.endTime || '19:00').replace(':', '') + '00';

      icsContent.push(
        'BEGIN:VEVENT',
        `SUMMARY:Plantão: ${st?.name || 'Turno'} - ${dept?.name || 'Setor'}`,
        `DTSTART:${cleanDate}T${startHour}`,
        `DTEND:${cleanDate}T${endHour}`,
        `DESCRIPTION:Plantão agendado via EscalaPro\\nSetor: ${dept?.name}`,
        `LOCATION:${dept?.name || 'Hospital'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `escala-${provider?.name || 'plantonista'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!provider) {
    return (
      <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700/80 text-center shadow-sm">
        <p className="text-slate-400 font-medium">Selecione um prestador no topo para ver seus plantões.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-slate-100">
      {/* Top Banner: Provider Info & Month Summary */}
      <div className="bg-[#1e293b] rounded-3xl border border-slate-700/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Provider Card */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-xl font-black text-white shadow-sm ring-2 ring-emerald-500/20">
              {provider.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">{provider.name}</h2>
                <span className="text-xs bg-emerald-950/70 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-800/80">
                  {provider.role}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2 font-medium">
                <span>{provider.email}</span>
                <span>·</span>
                <span>{provider.phone}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/70 border border-slate-700/80 rounded-2xl p-3 min-w-[130px] shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Plantões no Mês
              </div>
              <div className="text-2xl font-black text-white mt-0.5">
                {myMonthlyShifts.length}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {acknowledgedCount} confirmados
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-700/80 rounded-2xl p-3 min-w-[160px] shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Horas Escaladas</span>
                <span className="font-extrabold text-emerald-400">{hoursPercentage}%</span>
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {totalHours}h{' '}
                <span className="text-xs text-slate-400 font-medium">/ {maxHours}h</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, hoursPercentage)}%` }}
                />
              </div>
            </div>

            <button
              onClick={exportToICS}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800/90 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 px-3.5 py-2.5 rounded-2xl transition-colors shadow-sm whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
              title="Salvar no Google Calendar ou celular"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Exportar (.ics)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Next Shift Spotlight Card */}
      {nextShift && nextShiftType && nextDept && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/80 border border-emerald-800/70 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-400 font-extrabold mb-1 flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                <span>Seu Próximo Plantão</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {formatFriendlyDate(nextShift.date, true)}
              </div>
              <div className="text-xs sm:text-sm text-slate-300 mt-2 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {nextShiftType.startTime} às {nextShiftType.endTime} ({nextShiftType.name})
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {nextDept.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAcknowledgeShift(nextShift.id)}
                className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
                  nextShift.acknowledgedByProvider
                    ? 'bg-emerald-700/80 text-white border border-emerald-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/40'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{nextShift.acknowledgedByProvider ? 'Presença Confirmada ✓' : 'Confirmar Presença'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shifts Timeline */}
      <div className="bg-[#1e293b] rounded-3xl border border-slate-700/80 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-900/40">
          <h3 className="font-extrabold text-white text-sm">
            Todos os seus plantões neste mês
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            {myMonthlyShifts.length} {myMonthlyShifts.length === 1 ? 'plantão' : 'plantões'}
          </span>
        </div>

        {myMonthlyShifts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">Nenhum plantão agendado para você neste mês.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {myMonthlyShifts.map((shift, idx) => {
              const st = shiftTypes.find(s => s.id === shift.shiftTypeId);
              const dept = departments.find(d => d.id === shift.departmentId);
              const isPast = shift.date < todayStr;
              const isToday = shift.date === todayStr;

              return (
                <div
                  key={shift.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isToday
                      ? 'bg-emerald-950/25 border-l-4 border-l-emerald-500'
                      : isPast
                      ? 'bg-slate-900/30 opacity-75'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-6 text-center text-xs font-bold text-slate-500">
                      #{idx + 1}
                    </div>

                    <div className="min-w-[140px]">
                      <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                        {formatFriendlyDate(shift.date)}
                        {isToday && (
                          <span className="bg-emerald-500 text-slate-950 text-xs px-2 py-0.5 rounded-md font-black uppercase">
                            Hoje
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        {formatShortDate(shift.date)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                            st?.code.startsWith('N')
                              ? 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80'
                              : st?.code.startsWith('D')
                              ? 'bg-amber-950/70 text-amber-300 border-amber-800/80'
                              : 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
                          }`}
                        >
                          {st?.code} · {st?.name}
                        </span>
                        <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {st?.startTime} às {st?.endTime}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{dept?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => toggleAcknowledgeShift(shift.id)}
                      className={`text-xs px-3.5 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        shift.acknowledgedByProvider
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/80'
                          : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          shift.acknowledgedByProvider ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{shift.acknowledgedByProvider ? 'Confirmado' : 'Confirmar Presença'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
