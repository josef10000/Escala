import React from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { getMonthDaysArray, MONTH_NAMES_PT, DAYS_SHORT_PT } from '../utils/dateUtils';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintScheduleViewProps {
  onClose: () => void;
}

export const PrintScheduleView: React.FC<PrintScheduleViewProps> = ({ onClose }) => {
  const {
    currentYear,
    currentMonthIndex,
    providers,
    assignments,
    shiftTypes,
    departments,
    isPublished,
  } = useSchedule();

  const days = getMonthDaysArray(currentYear, currentMonthIndex);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-4 sm:p-8">
      {/* Control bar hidden during printing */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between no-print border-b border-slate-200 pb-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Sistema</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Formato pronto para impressão em papel A4 ou salvar como PDF
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Escala Agora</span>
          </button>
        </div>
      </div>

      {/* Official Document to Print */}
      <div className="max-w-6xl mx-auto print-container space-y-6 text-slate-900">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              Escala Mensal de Plantões e Prestadores
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Período de Referência: <strong>{MONTH_NAMES_PT[currentMonthIndex]} de {currentYear}</strong>
            </p>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-slate-800">EscalaPro - Sistema Operacional</div>
            <div className="text-slate-500">Status: {isPublished ? 'OFICIAL / PUBLICADA' : 'RASCUNHO EM APROVAÇÃO'}</div>
            <div className="text-slate-500 font-mono-nums">Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
          <strong className="text-slate-800">Legenda de Códigos:</strong>
          {shiftTypes.map(st => (
            <span key={st.id} className="flex items-center gap-1">
              <strong className="font-mono-nums border border-slate-400 px-1 bg-white">
                {st.code}
              </strong>
              <span>
                = {st.name} ({st.startTime}-{st.endTime})
              </span>
            </span>
          ))}
          <span className="text-slate-500">- = Folga</span>
        </div>

        {/* Printable Matrix Table */}
        <div className="overflow-x-auto border border-slate-300">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                <th className="p-1.5 border-r border-slate-300 min-w-[150px]">Colaborador</th>
                {days.map(d => (
                  <th
                    key={d.dateStr}
                    className={`p-1 text-center border-r border-slate-300 font-mono-nums ${
                      d.isWeekend ? 'bg-slate-200 text-slate-900' : ''
                    }`}
                  >
                    <div>{DAYS_SHORT_PT[d.dayOfWeek].charAt(0)}</div>
                    <div>{d.dayNumber}</div>
                  </th>
                ))}
                <th className="p-1 text-center min-w-[50px]">Plantões</th>
                <th className="p-1 text-center min-w-[50px]">Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {providers.map(p => {
                const provShifts = assignments.filter(a => {
                  const [y, m] = a.date.split('-').map(Number);
                  return a.providerId === p.id && y === currentYear && m === currentMonthIndex + 1;
                });
                const totalHours = provShifts.reduce((acc, curr) => {
                  const st = shiftTypes.find(s => s.id === curr.shiftTypeId);
                  return acc + (st?.durationHours || 0);
                }, 0);

                return (
                  <tr key={p.id}>
                    <td className="p-1.5 border-r border-slate-300 font-medium">
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[9px] text-slate-500">{p.role}</div>
                    </td>
                    {days.map(d => {
                      const shift = assignments.find(
                        a => a.date === d.dateStr && a.providerId === p.id
                      );
                      const st = shift ? shiftTypes.find(s => s.id === shift.shiftTypeId) : null;
                      return (
                        <td
                          key={d.dateStr}
                          className={`p-1 text-center border-r border-slate-300 font-mono-nums font-bold ${
                            d.isWeekend ? 'bg-slate-50' : ''
                          }`}
                        >
                          {st ? st.code : '-'}
                        </td>
                      );
                    })}
                    <td className="p-1 text-center border-r border-slate-300 font-bold font-mono-nums">
                      {provShifts.length}
                    </td>
                    <td className="p-1 text-center font-bold font-mono-nums">
                      {totalHours}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Signatures Footer */}
        <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <div className="border-t border-slate-800 w-3/4 mx-auto pt-2 font-bold">
              Supervisor / Coordenador da Escala
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">Assinatura e Carimbo</div>
          </div>
          <div>
            <div className="border-t border-slate-800 w-3/4 mx-auto pt-2 font-bold">
              Diretoria Técnica / Operações
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">Homologação da Escala</div>
          </div>
        </div>
      </div>
    </div>
  );
};
