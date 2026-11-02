import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT, getMonthDaysArray } from '../../utils/dateUtils';
import { getHolidayInfo, isSundayDate } from '../../utils/holidaysBR';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Share2,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Award,
  Users,
  ShieldCheck
} from 'lucide-react';

interface ExecutiveMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIncidentModal?: () => void;
}

export const ExecutiveMonthlyReportModal: React.FC<ExecutiveMonthlyReportModalProps> = ({
  isOpen,
  onClose,
  onOpenIncidentModal,
}) => {
  const {
    providers,
    assignments,
    attendanceIncidents,
    currentYear,
    currentMonthIndex,
    activeRegime,
    leaderName,
  } = useSchedule();

  const [activeTab, setActiveTab] = useState<'operacional' | 'financeiro'>('operacional');
  const [paidStatus, setPaidStatus] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  const regimeProviders = providers.filter(
    p => (p.regime || '12x36') === activeRegime
  );

  // Calculate stats and financials for each provider
  const reportData = regimeProviders.map(p => {
    const pShifts = assignments.filter(a => {
      if (a.providerId !== p.id) return false;
      const [y, m] = a.date.split('-').map(Number);
      return y === currentYear && m === currentMonthIndex + 1;
    });

    const shiftsT = pShifts.filter(s => s.shiftTypeId === 'st-t');
    const shiftsD = pShifts.filter(s => s.shiftTypeId === 'st-d');
    const shiftsHO = shiftsT.filter(s => s.workModality === 'home_office');

    const sundaysWorked = shiftsT.filter(s => isSundayDate(s.date)).length;
    const holidaysWorked = shiftsT.filter(s => getHolidayInfo(s.date).isHoliday).length;

    // Incidents
    const pIncidents = attendanceIncidents.filter(inc => {
      if (inc.providerId !== p.id) return false;
      const [y, m] = inc.date.split('-').map(Number);
      return y === currentYear && m === currentMonthIndex + 1;
    });

    const atestadosCount = pIncidents.filter(i => i.type === 'atestado_medico').length;
    const faltasJustificadas = pIncidents.filter(i => i.type === 'falta_justificada').length;
    const faltasInjustificadas = pIncidents.filter(i => i.type === 'falta_injustificada').length;
    const atrasos = pIncidents.filter(i => i.type === 'atraso');
    const totalAtrasoMinutos = atrasos.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
    const horasExtras = pIncidents.filter(i => i.type === 'hora_extra');
    const totalHorasExtrasMinutos = horasExtras.reduce((acc, h) => acc + (h.durationMinutes || 0), 0);
    const totalHorasExtrasHoras = (totalHorasExtrasMinutos / 60).toFixed(1);

    const shiftHoursUnit = activeRegime === '5x2' ? 8 : 12;
    const regularHours = shiftsT.length * shiftHoursUnit;
    const totalHoursWithExtras = regularHours + (totalHorasExtrasMinutos / 60);

    // Financial Calculations (Deductions apply ONLY to the bonus)
    const baseFee = p.baseSalaryOrFee || 3500;
    const bonus = p.bonusAmount || 600;
    const frequency = p.bonusFrequencyMonths || 3; // 1 = mensal, 3 = trimestral
    const bonusForPeriod = frequency === 1 ? bonus : Number((bonus / frequency).toFixed(2));
    
    const deductionMode = p.deductionMode || 'percentage_of_bonus';
    const deductionPerMinute = p.deductionPerMinuteLate ?? 0.5;
    const deductionPerAbsenceVal = p.deductionPerAbsence ?? 10;

    let latenessDeduction = 0;
    let absenceDeduction = 0;

    if (deductionMode === 'percentage_of_bonus') {
      latenessDeduction = totalAtrasoMinutos * (bonusForPeriod * (deductionPerMinute / 100));
      absenceDeduction = faltasInjustificadas * (bonusForPeriod * (deductionPerAbsenceVal / 100));
    } else {
      latenessDeduction = totalAtrasoMinutos * deductionPerMinute;
      absenceDeduction = faltasInjustificadas * deductionPerAbsenceVal;
    }

    const totalDeductions = latenessDeduction + absenceDeduction;
    const bonusFinal = Math.max(0, bonusForPeriod - totalDeductions);
    const netPayout = baseFee + bonusFinal;

    return {
      provider: p,
      shiftsCount: shiftsT.length,
      restsCount: shiftsD.length,
      homeOfficeCount: shiftsHO.length,
      sundaysWorked,
      holidaysWorked,
      regularHours,
      totalHoursWithExtras: Number(totalHoursWithExtras.toFixed(1)),
      atestadosCount,
      faltasJustificadas,
      faltasInjustificadas,
      atrasosCount: atrasos.length,
      totalAtrasoMinutos,
      horasExtrasCount: horasExtras.length,
      horasExtrasHoras: Number(totalHorasExtrasHoras),
      baseFee,
      bonus,
      frequency,
      bonusForPeriod,
      latenessDeduction,
      absenceDeduction,
      totalDeductions,
      netPayout,
    };
  });

  const totalPlantões = reportData.reduce((acc, r) => acc + r.shiftsCount, 0);
  const totalDomingos = reportData.reduce((acc, r) => acc + r.sundaysWorked, 0);
  const totalFeriados = reportData.reduce((acc, r) => acc + r.holidaysWorked, 0);
  const totalHoras = reportData.reduce((acc, r) => acc + r.totalHoursWithExtras, 0);
  const totalAtestados = reportData.reduce((acc, r) => acc + r.atestadosCount, 0);
  const totalAtrasosMin = reportData.reduce((acc, r) => acc + r.totalAtrasoMinutos, 0);
  const totalNetPayout = reportData.reduce((acc, r) => acc + r.netPayout, 0);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Colaborador',
      'Cargo',
      'Regime',
      'Plantões (T)',
      'Horas Totais',
      'Honorário Base (R$)',
      'Bônus Proporcional (R$)',
      'Deduções (R$)',
      'Valor Líquido (R$)'
    ];

    const rows = reportData.map(r => [
      `"${r.provider.name}"`,
      `"${r.provider.role}"`,
      `"${r.provider.regime || activeRegime}"`,
      r.shiftsCount,
      r.totalHoursWithExtras,
      r.baseFee.toFixed(2),
      r.bonusForPeriod.toFixed(2),
      r.totalDeductions.toFixed(2),
      r.netPayout.toFixed(2),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fechamento-financeiro-${monthName.toLowerCase()}-${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareRHWhatsApp = () => {
    const text = `📊 *FECHAMENTO EXECUTIVO & PAGAMENTOS - ESCALAPRO*\n` +
      `📅 *Competência:* ${monthName}/${currentYear} (${activeRegime})\n` +
      `🏢 *Setor Central* • *Gestor:* ${leaderName || 'Liderança'}\n\n` +
      `💰 *TOTAL LÍQUIDO DA FOLHA:* R$ ${totalNetPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `• Plantões Cobertos: ${totalPlantões}\n` +
      `• Atrasos Totais: ${totalAtrasosMin} min\n\n` +
      `👥 *PRESTADORES:*\n` +
      reportData.map(r => `• ${r.provider.name.split(' ')[0]}: R$ ${r.netPayout.toFixed(2)} (${r.shiftsCount} plantões, ${r.totalDeductions > 0 ? `-${r.totalDeductions.toFixed(2)} ded.` : 'sem débitos'})`).join('\n') +
      `\n\n_Relatório gerado em 1 clique via EscalaPro_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-[#141c28] text-slate-100 rounded-3xl p-5 sm:p-6 border border-[#1e2a3a] shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2a3a] pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-950/70 border border-blue-800/80 flex items-center justify-center text-cyan-400 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Fechamento Executivo & Relatório em 1 Clique
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/80">
                  Visão do Líder
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Controle de plantões, ocorrências, bônus e descontos automáticos — {monthName}/{currentYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#0c121c] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-[#1e2a3a] cursor-pointer"
              title="Imprimir Relatório Oficial"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-[#0c121c] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-[#1e2a3a] cursor-pointer"
              title="Exportar planilha Excel"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              onClick={handleShareRHWhatsApp}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-950/40 cursor-pointer"
              title="Enviar resumo para o RH via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden sm:inline">Enviar WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1e2a3a] pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('operacional')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'operacional'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                : 'bg-[#0c121c] text-slate-400 hover:text-slate-200 border border-[#1e2a3a]'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-300" />
            <span>1. Relatório Operacional (Plantões & Horas)</span>
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'financeiro'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                : 'bg-[#0c121c] text-slate-400 hover:text-slate-200 border border-[#1e2a3a]'
            }`}
          >
            <DollarSign className="w-4 h-4 text-cyan-300" />
            <span>2. Fechamento Financeiro & Pagamentos (1 Clique)</span>
          </button>
        </div>

        {/* Tab Content 1: Operacional */}
        {activeTab === 'operacional' && (
          <div className="overflow-y-auto flex-1 space-y-4 pr-1 animate-in fade-in">
            {/* KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <div className="bg-[#0c121c] p-3 rounded-2xl border border-[#1e2a3a] text-center">
                <span className="text-xs uppercase font-bold text-slate-400 block">Total Plantões</span>
                <span className="text-xl font-black text-cyan-400">{totalPlantões}</span>
                <span className="text-xs text-slate-500 block">no mês</span>
              </div>
              <div className="bg-[#0c121c] p-3 rounded-2xl border border-[#1e2a3a] text-center">
                <span className="text-xs uppercase font-bold text-amber-400 block">Domingos Trab.</span>
                <span className="text-xl font-black text-amber-400">{totalDomingos}</span>
                <span className="text-xs text-slate-500 block">coberturas</span>
              </div>
              <div className="bg-[#0c121c] p-3 rounded-2xl border border-[#1e2a3a] text-center">
                <span className="text-xs uppercase font-bold text-sky-400 block">Feriados Oficiais</span>
                <span className="text-xl font-black text-sky-400">{totalFeriados}</span>
                <span className="text-xs text-slate-500 block">dias especiais</span>
              </div>
              <div className="bg-[#0c121c] p-3 rounded-2xl border border-[#1e2a3a] text-center">
                <span className="text-xs uppercase font-bold text-emerald-400 block">Horas Totais</span>
                <span className="text-xl font-black text-emerald-400">{totalHoras.toFixed(0)}h</span>
                <span className="text-xs text-slate-500 block">efetivas</span>
              </div>
              <div className="bg-[#0c121c] p-3 rounded-2xl border border-[#1e2a3a] text-center">
                <span className="text-xs uppercase font-bold text-indigo-400 block">Atestados Méd.</span>
                <span className="text-xl font-black text-indigo-400">{totalAtestados}</span>
                <span className="text-xs text-slate-500 block">licenças</span>
              </div>
              <div className="bg-[#0c121c] p-3 rounded-2xl border border-[#1e2a3a] text-center">
                <span className="text-xs uppercase font-bold text-rose-400 block">Atrasos Acum.</span>
                <span className="text-xl font-black text-rose-400">{totalAtrasosMin}m</span>
                <span className="text-xs text-slate-500 block">minutos</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1e2a3a] overflow-hidden bg-[#0c121c]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#141c28] border-b border-[#1e2a3a] text-cyan-400 font-extrabold uppercase text-xs tracking-wider">
                    <th className="py-3 px-3">Colaborador</th>
                    <th className="py-3 px-2 text-center">Regime</th>
                    <th className="py-3 px-2 text-center">Plantões (T)</th>
                    <th className="py-3 px-2 text-center">Domingos</th>
                    <th className="py-3 px-2 text-center">Feriados</th>
                    <th className="py-3 px-2 text-center">Horas Reg.</th>
                    <th className="py-3 px-2 text-center font-black text-white">Horas Totais</th>
                    <th className="py-3 px-2 text-center">Atestados</th>
                    <th className="py-3 px-2 text-center">Atrasos</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2a3a]">
                  {reportData.map(r => (
                    <tr key={r.provider.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-blue-950/70 border border-blue-800/80 text-cyan-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {r.provider.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="truncate max-w-[160px] text-white font-bold">{r.provider.name}</div>
                            <span className="text-xs text-slate-400 font-medium">{r.provider.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                          {r.provider.regime || activeRegime}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-400">
                        {r.shiftsCount}
                      </td>
                      <td className="py-3 px-2 text-center font-semibold text-amber-400">
                        {r.sundaysWorked}
                      </td>
                      <td className="py-3 px-2 text-center font-semibold text-sky-400">
                        {r.holidaysWorked}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300 font-medium">
                        {r.regularHours}h
                      </td>
                      <td className="py-3 px-2 text-center font-black text-cyan-300">
                        {r.totalHoursWithExtras}h
                      </td>
                      <td className="py-3 px-2 text-center">
                        {r.atestadosCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-950/70 text-indigo-300 border border-indigo-800/80 font-bold text-xs">
                            {r.atestadosCount} atestado(s)
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {r.totalAtrasoMinutos > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-800/80 font-bold text-xs">
                            {r.totalAtrasoMinutos} min
                          </span>
                        ) : (
                          <span className="text-slate-600">0 min</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {r.totalAtrasoMinutos === 0 && r.faltasInjustificadas === 0 ? (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-800/80">
                            Regular ✓
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded-lg border border-amber-800/80">
                            Revisar Ocorrência
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 2: Financeiro */}
        {activeTab === 'financeiro' && (
          <div className="overflow-y-auto flex-1 space-y-4 pr-1 animate-in fade-in">
            <div className="bg-[#0c121c] p-4 rounded-2xl border border-[#1e2a3a] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  <span>Fechamento & Descontos Automáticos (Prestação de Serviço)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  O sistema desconta automaticamente atrasos (minutos) e faltas injustificadas do valor base + bônus periódico definido pelo líder.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs uppercase font-bold text-slate-400 block">Total Líquido da Folha</span>
                <span className="text-2xl font-black text-cyan-400">
                  R$ {totalNetPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1e2a3a] overflow-hidden bg-[#0c121c]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#141c28] border-b border-[#1e2a3a] text-cyan-400 font-extrabold uppercase text-xs tracking-wider">
                    <th className="py-3 px-3">Colaborador</th>
                    <th className="py-3 px-2 text-center">Honorário Base</th>
                    <th className="py-3 px-2 text-center">Bônus (Freq.)</th>
                    <th className="py-3 px-2 text-center">Deduções (Atraso/Falta)</th>
                    <th className="py-3 px-2 text-center font-black text-white">Valor Líquido</th>
                    <th className="py-3 px-3 text-right">Status / 1 Clique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2a3a]">
                  {reportData.map(r => {
                    const isPaid = paidStatus[r.provider.id] || false;
                    return (
                      <tr key={r.provider.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-blue-950/70 border border-blue-800/80 text-cyan-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                              {r.provider.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="truncate max-w-[160px] text-white font-bold">{r.provider.name}</div>
                              <span className="text-xs text-slate-400 font-medium">{r.provider.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-slate-200 font-semibold">
                          R$ {r.baseFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-2 text-center text-cyan-300 font-semibold">
                          + R$ {r.bonusForPeriod.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          <span className="block text-xs text-slate-400 font-normal">
                            ({r.frequency === 1 ? 'Mensal' : `${r.frequency} meses`})
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-rose-400 font-semibold">
                          {r.totalDeductions > 0 ? (
                            <span>
                              - R$ {r.totalDeductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              <span className="block text-xs text-rose-300/80 font-normal">
                                ({r.totalAtrasoMinutos}m atraso + {r.faltasInjustificadas} faltas)
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-500">Sem débitos</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-black text-emerald-400 text-sm">
                          R$ {r.netPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setPaidStatus(prev => ({ ...prev, [r.provider.id]: !isPaid }));
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                              isPaid
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-200" />
                            <span>{isPaid ? 'Pago ✓' : 'Pagar 1-Clique'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#1e2a3a] flex items-center justify-between shrink-0">
          {onOpenIncidentModal && (
            <button
              onClick={() => {
                onClose();
                onOpenIncidentModal();
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer"
            >
              + Registrar novos atrasos ou faltas
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer ml-auto border border-[#1e2a3a]"
          >
            Fechar Fechamento
          </button>
        </div>

      </div>
    </div>
  );
};
