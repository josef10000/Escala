import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { getMonthDaysArray, MONTH_NAMES_PT, formatFriendlyDate } from '../../utils/dateUtils';
import { Provider } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Printer,
  Shield,
  ArrowLeftRight,
  FileText,
  Lock,
  LogOut,
  Sparkles
} from 'lucide-react';
import { ShiftSwapModal } from '../modals/ShiftSwapModal';
import { ScheduleRequestModal } from '../modals/ScheduleRequestModal';

interface PersonalMonthlyCalendarProps {
  provider: Provider;
  onBackToGrid: () => void;
}

export const PersonalMonthlyCalendar: React.FC<PersonalMonthlyCalendarProps> = ({
  provider,
  onBackToGrid,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    assignments,
    providers,
    setActiveProviderId,
    isLeaderAuthenticated,
    logoutProvider,
    swapRequests,
    scheduleRequests,
    lastUpdatedAt,
  } = useSchedule();

  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const days = getMonthDaysArray(currentYear, currentMonthIndex);
  const monthName = MONTH_NAMES_PT[currentMonthIndex].toUpperCase();

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
  const totalDaysInMonth = days.length;
  const offDaysCount = totalDaysInMonth - (workDaysCount + restDaysCount);
  const totalHoursWorked = workDaysCount * 12;

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

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header with Back button, Provider Name & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToGrid}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Quadro Geral</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                Minha Escala Individual
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                PIN Ativo
              </span>
            </div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>{provider.name}</span>
            </h2>
          </div>
        </div>

        {/* Action Buttons: Swap Request & Day Off Request */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSwapModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            title="Pedir troca de plantão com um colega"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Pedir Troca de Plantão</span>
          </button>

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Pedir folga ou disponibilidade futura para a Líder"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pedir Folga / Extra</span>
          </button>

          {/* If Supervisor (Leader), allow switching person; else, keep locked to this collaborator */}
          {isLeaderAuthenticated ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-400 hidden lg:inline">Colaborador:</span>
              <select
                value={provider.id}
                onChange={e => setActiveProviderId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <button
              onClick={() => {
                logoutProvider();
                onBackToGrid();
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors ml-1"
              title="Sair do modo individual (Desconectar PIN)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Imprimir meu calendário"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards + Last updated notice */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-2xl">
          <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
            Dias Que Trabalha
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {workDaysCount} <span className="text-xs font-normal text-emerald-300/80">dias</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-0.5">
            Turnos das {provider.entryTime || '07h00'} às {provider.exitTime || '19h00'}
          </div>
        </div>

        <div className="bg-blue-950/40 border border-blue-500/40 p-3.5 rounded-2xl">
          <div className="text-xs text-blue-300 font-bold uppercase tracking-wider">
            Dias de Descanso
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1">
            {restDaysCount} <span className="text-xs font-normal text-blue-300/80">dias</span>
          </div>
          <div className="text-[11px] text-blue-300/80 mt-0.5">
            Folgas programadas
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Total Trabalhado
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {totalHoursWorked}h
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Carga horária em {monthName}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Última Atualização
            </div>
            <div className="text-xs font-black text-indigo-300 mt-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatLastUpdated(lastUpdatedAt)}</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">
            ● Sincronizado na Nuvem
          </div>
        </div>
      </div>

      {/* The Big Monthly Calendar Grid */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Month Header Banner */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              {monthName} {currentYear}
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded-md" />
              <span className="text-slate-300 font-medium">Trabalha (T)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-blue-500 rounded-md" />
              <span className="text-slate-300 font-medium">Descanso (D)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-slate-800 border border-slate-700 rounded-md" />
              <span className="text-slate-400">Sem Escala</span>
            </div>
          </div>
        </div>

        {/* Calendar Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-400">
          <div className="p-2 text-rose-400 bg-rose-950/20 rounded-xl">Dom</div>
          <div className="p-2 bg-slate-900/60 rounded-xl">Seg</div>
          <div className="p-2 bg-slate-900/60 rounded-xl">Ter</div>
          <div className="p-2 bg-slate-900/60 rounded-xl">Qua</div>
          <div className="p-2 bg-slate-900/60 rounded-xl">Qui</div>
          <div className="p-2 bg-slate-900/60 rounded-xl">Sex</div>
          <div className="p-2 text-amber-400 bg-amber-950/20 rounded-xl">Sáb</div>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before month starts */}
          {paddingEmptyDays.map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[96px] rounded-2xl bg-slate-950/30 border border-slate-900/40 opacity-30"
            />
          ))}

          {/* Days of current month */}
          {days.map(d => {
            const shift = getShiftForDate(d.dateStr);
            const isWork = shift?.shiftTypeId === 'st-t';
            const isRest = shift?.shiftTypeId === 'st-d';
            const hasNote = Boolean(shift?.notes);

            let cardBg = 'bg-slate-950/80 border-slate-800/80 text-slate-400';
            if (isWork) {
              cardBg =
                'bg-emerald-950/50 border-emerald-500/60 text-emerald-100 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/30';
            } else if (isRest) {
              cardBg =
                'bg-blue-950/40 border-blue-500/50 text-blue-100 shadow-md shadow-blue-950/40';
            }

            return (
              <div
                key={d.dateStr}
                className={`min-h-[105px] p-3 rounded-2xl border flex flex-col justify-between transition-all relative group ${cardBg}`}
              >
                {/* Day number & note mark */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-black font-mono ${
                      d.isWeekend ? 'text-amber-300' : 'text-white'
                    }`}
                  >
                    {d.dayNumber}
                  </span>

                  {hasNote && (
                    <div
                      className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse ring-2 ring-slate-900"
                      title={shift?.notes}
                    />
                  )}
                </div>

                {/* Status Badge */}
                <div className="my-auto text-center py-1">
                  {isWork ? (
                    <div className="space-y-0.5">
                      <div className="inline-block px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm">
                        TRABALHA
                      </div>
                      <div className="text-[10px] font-mono text-emerald-300 font-bold">
                        {provider.entryTime || '07h00'} - {provider.exitTime || '19h00'}
                      </div>
                    </div>
                  ) : isRest ? (
                    <div className="space-y-0.5">
                      <div className="inline-block px-2.5 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-lg text-xs font-bold uppercase tracking-wider">
                        DESCANSO
                      </div>
                      <div className="text-[10px] text-blue-300/70">Folga</div>
                    </div>
                  ) : (
                    <div className="text-slate-600 font-mono text-xs">-</div>
                  )}
                </div>

                {/* Note preview if any */}
                {hasNote && (
                  <div className="text-[10px] text-rose-300 truncate bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/60 mt-1">
                    Obs: {shift?.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: My Swap Requests and Future Schedule Requests */}
      {(mySwaps.length > 0 || myRequests.length > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Meus Pedidos de Troca e Folga Registrados</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Swaps */}
            {mySwaps.map(swap => {
              const isRequester = swap.requesterProviderId === provider.id;
              const otherId = isRequester ? swap.targetProviderId : swap.requesterProviderId;
              const otherName = providers.find(p => p.id === otherId)?.name || 'Colega';

              return (
                <div
                  key={swap.id}
                  className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Troca com {otherName}</span>
                    </span>

                    {swap.status === 'pending_supervisor' && (
                      <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-md text-[10px] font-bold">
                        Aguardando Líder
                      </span>
                    )}
                    {swap.status === 'approved' && (
                      <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-md text-[10px] font-bold">
                        Aprovada
                      </span>
                    )}
                    {swap.status === 'rejected' && (
                      <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-md text-[10px] font-bold">
                        Recusada
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-300">
                    Dia {swap.requesterDate} (
                    {formatFriendlyDate(swap.requesterDate)})
                    {swap.targetDate && (
                      <span> ↔ Dia {swap.targetDate}</span>
                    )}
                  </div>
                  {swap.reason && (
                    <div className="text-[11px] text-slate-400 italic">
                      Motivo: "{swap.reason}"
                    </div>
                  )}
                </div>
              );
            })}

            {/* Requests */}
            {myRequests.map(req => {
              return (
                <div
                  key={req.id}
                  className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{req.type === 'day_off' ? 'Pedido de Folga' : 'Disponibilidade Extra'}</span>
                    </span>

                    {req.status === 'pending' && (
                      <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-md text-[10px] font-bold">
                        Aguardando Líder
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-md text-[10px] font-bold">
                        Aprovado
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-md text-[10px] font-bold">
                        Recusado
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-300">
                    Para o dia {req.date} ({formatFriendlyDate(req.date)})
                  </div>
                  {req.reason && (
                    <div className="text-[11px] text-slate-400 italic">
                      Motivo: "{req.reason}"
                    </div>
                  )}
                </div>
              );
            })}
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
