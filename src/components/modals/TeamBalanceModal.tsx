import React from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT } from '../../utils/dateUtils';
import {
  Scale,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  TrendingUp,
  Share2
} from 'lucide-react';

interface TeamBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamBalanceModal: React.FC<TeamBalanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    providers,
    assignments,
    currentYear,
    currentMonthIndex,
    activeRegime,
  } = useSchedule();

  if (!isOpen) return null;

  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  const regimeProviders = providers.filter(
    p => (p.regime || '12x36') === activeRegime
  );

  // Calculate stats for each provider
  const stats = regimeProviders.map(p => {
    const pShifts = assignments.filter(a => {
      if (a.providerId !== p.id) return false;
      const [y, m] = a.date.split('-').map(Number);
      return y === currentYear && m === currentMonthIndex + 1;
    });

    const countT = pShifts.filter(s => s.shiftTypeId === 'st-t').length;
    const countD = pShifts.filter(s => s.shiftTypeId === 'st-d').length;
    const countHO = pShifts.filter(s => s.shiftTypeId === 'st-t' && s.workModality === 'home_office').length;
    const totalHours = countT * (activeRegime === '5x2' ? 8 : 12);
    const maxTargetHours = p.maxMonthlyHours || (activeRegime === '5x2' ? 176 : 180);

    // Overload thresholds
    const isOverloaded = totalHours > maxTargetHours + 12;
    const isUnderloaded = totalHours < maxTargetHours - 24 && countT > 0;
    const isBalanced = !isOverloaded && !isUnderloaded;

    return {
      provider: p,
      countT,
      countD,
      countHO,
      totalHours,
      maxTargetHours,
      isOverloaded,
      isUnderloaded,
      isBalanced,
      percentage: Math.min(100, Math.round((totalHours / maxTargetHours) * 100)),
    };
  });

  const totalShiftsMonth = stats.reduce((acc, s) => acc + s.countT, 0);
  const avgShiftsPerPerson = stats.length > 0 ? (totalShiftsMonth / stats.length).toFixed(1) : '0';
  const overloadCount = stats.filter(s => s.isOverloaded).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e1017] text-white rounded-2xl p-6 border border-white/[0.09] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-2xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Balanceamento de Carga & Horas
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Auditoria humanizada de horas e divisão justa de plantões — {monthName}/{currentYear} ({activeRegime})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-[#141720] p-3 rounded-xl border border-white/[0.06] text-center">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total de Plantões</span>
            <span className="text-xl font-extrabold text-white">{totalShiftsMonth}</span>
            <span className="text-[10px] text-neutral-500 block">no mês</span>
          </div>

          <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-purple-300 block">Média por Pessoa</span>
            <span className="text-xl font-extrabold text-purple-300">{avgShiftsPerPerson}</span>
            <span className="text-[10px] text-purple-300/80 block">plantões/mês</span>
          </div>

          <div className={`p-3 rounded-xl border text-center ${
            overloadCount > 0
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}>
            <span className="text-[10px] uppercase font-bold opacity-80 block">Saúde da Equipe</span>
            <span className="text-xl font-extrabold">
              {overloadCount > 0 ? `${overloadCount} em Alerta` : 'Equilibrado ✓'}
            </span>
            <span className="text-[10px] opacity-80 block">
              {overloadCount > 0 ? 'Excesso de horas' : 'Divisão ideal'}
            </span>
          </div>
        </div>

        {/* Collaborators List */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
          {stats.map(s => (
            <div
              key={s.provider.id}
              className="p-3.5 bg-[#141720] border border-white/[0.06] rounded-xl space-y-2.5 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#1b1f2b] border border-white/[0.08] font-black text-xs text-[#00d2d3] flex items-center justify-center shrink-0">
                    {s.provider.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-white truncate">{s.provider.name}</h4>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      {s.provider.teamGroup ? (s.provider.teamGroup === 'turma_a' ? 'Turma A (Ímpar)' : 'Turma B (Par)') : 'Sem Turma'} • {s.countHO > 0 ? `${s.countHO} HO` : 'Presencial'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-white">{s.countT} plantões</span>
                    <span className="text-[10px] text-neutral-400 font-medium block">{s.totalHours}h / {s.maxTargetHours}h</span>
                  </div>

                  {s.isOverloaded && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                      ⚠️ Hora Extra
                    </span>
                  )}
                  {s.isUnderloaded && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                      Subutilizado
                    </span>
                  )}
                  {s.isBalanced && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      ✓ OK
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    s.isOverloaded ? 'bg-rose-500' : s.isUnderloaded ? 'bg-sky-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.06] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#161922] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar Auditoria
          </button>
        </div>

      </div>
    </div>
  );
};
