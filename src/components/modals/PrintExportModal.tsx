import React, { useState, useEffect } from 'react';
import { X, FileDown, Printer, Copy, Check, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT, DAYS_SHORT_PT, getMonthDaysArray } from '../../utils/dateUtils';
import { generateEscalaPDF, exportEscalaToCSV } from '../../utils/pdfGenerator';

interface PrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintExportModal: React.FC<PrintExportModalProps> = ({ isOpen, onClose }) => {
  const {
    providers,
    assignments,
    currentYear,
    currentMonthIndex,
    departments,
    activeRegime,
  } = useSchedule();

  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [blobPdfUrl, setBlobPdfUrl] = useState<string | null>(null);
  const [copiedExcel, setCopiedExcel] = useState(false);

  // Clean up blob URL on close/unmount
  useEffect(() => {
    return () => {
      if (blobPdfUrl) URL.revokeObjectURL(blobPdfUrl);
    };
  }, [blobPdfUrl]);

  if (!isOpen) return null;

  const days = getMonthDaysArray(currentYear, currentMonthIndex);
  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  const deptName = departments[0]?.name || 'Equipe Técnica';
  const regimeProviders = providers.filter(p => (p.regime || '12x36') === activeRegime);

  // Helper to count daily workers
  const getDailyWorkersCount = (dateStr: string) => {
    return assignments.filter(
      a => a.date === dateStr && a.shiftTypeId === 'st-t' && regimeProviders.some(p => p.id === a.providerId)
    ).length;
  };

  // Download Native PDF
  const handleDownloadPDF = () => {
    try {
      setIsGenerating(true);

      const doc = generateEscalaPDF({
        providers,
        assignments,
        currentYear,
        currentMonthIndex,
        departmentName: deptName,
        regime: activeRegime,
      });

      const filename = `escala-${activeRegime}-${monthName.toLowerCase()}-${currentYear}.pdf`;

      // Create Blob URL
      const blob = doc.output('blob');
      if (blobPdfUrl) URL.revokeObjectURL(blobPdfUrl);
      const url = URL.createObjectURL(blob);
      setBlobPdfUrl(url);

      // Trigger download
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.warn('Direct link download trigger error:', e);
      }

      // Also call doc.save
      try {
        doc.save(filename);
      } catch (e) {
        console.warn('doc.save error:', e);
      }

      setDownloadSuccess(true);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Houve um imprevisto ao gerar o PDF. Você também pode baixar em Excel ou imprimir.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Excel CSV
  const handleDownloadExcel = () => {
    exportEscalaToCSV({
      providers,
      assignments,
      currentYear,
      currentMonthIndex,
      departmentName: deptName,
      regime: activeRegime,
    });
  };

  // Browser Print
  const handleBrowserPrint = () => {
    window.print();
  };

  // Copy HTML Table for Excel
  const handleCopyExcel = () => {
    const tableEl = document.getElementById('preview-print-table');
    if (!tableEl) return;

    try {
      const blob = new Blob([tableEl.outerHTML], { type: 'text/html' });
      const textBlob = new Blob([tableEl.innerText], { type: 'text/plain' });

      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': textBlob,
        }),
      ]).then(() => {
        setCopiedExcel(true);
        setTimeout(() => setCopiedExcel(false), 2500);
      });
    } catch {
      navigator.clipboard.writeText(tableEl.innerText);
      setCopiedExcel(true);
      setTimeout(() => setCopiedExcel(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200/90 text-slate-800 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-100">
        
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shadow-2xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Central de Impressão & Exportação ({activeRegime})</h3>
              <p className="text-xs text-slate-500 font-medium">
                Gere o PDF oficial em A4 Paisagem, baixe para Excel ou imprima a escala {activeRegime}
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Excel CSV button */}
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Baixar planilha compatível com Microsoft Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Baixar Excel</span>
            </button>

            {/* Copy Table button */}
            <button
              onClick={handleCopyExcel}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Copiar tabela para colar no Excel ou Word"
            >
              {copiedExcel ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedExcel ? 'Copiado!' : 'Copiar p/ Excel'}</span>
            </button>

            {/* Print button */}
            <button
              onClick={handleBrowserPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Acionar diálogo de impressão da impressora"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir</span>
            </button>

            {/* PRIMARY GREEN BUTTON: DOWNLOAD PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              title="Baixar arquivo PDF formatado para imprimir ou salvar"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>{isGenerating ? 'Gerando...' : `Baixar PDF ${activeRegime}`}</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {downloadSuccess && blobPdfUrl && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 gap-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>PDF {activeRegime} gerado com sucesso!</strong> Se o download não iniciou automaticamente:
              </span>
            </div>
            <a
              href={blobPdfUrl}
              target="_blank"
              rel="noreferrer"
              download={`escala-${activeRegime}-${monthName.toLowerCase()}-${currentYear}.pdf`}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Arquivo</span>
            </a>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100/70 flex justify-center">
          <div
            id="preview-print-table"
            className="w-full max-w-4xl bg-white text-slate-900 p-6 rounded-2xl shadow-sm space-y-4 border border-slate-200 font-sans"
            style={{ minWidth: '850px' }}
          >
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
              <div>
                <h1 className="text-base font-black tracking-tight uppercase text-slate-900">
                  ESCALA TÉCNICA OPERACIONAL {activeRegime.toUpperCase()}
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-700 font-medium mt-0.5">
                  <span><strong>Setor:</strong> {deptName}</span>
                  <span>•</span>
                  <span><strong>Referência:</strong> {monthName.toUpperCase()} / {currentYear}</span>
                  <span>•</span>
                  <span><strong>Regime:</strong> {activeRegime === '5x2' ? '5x2 (Segunda a Sexta)' : '12x36 (Turno 12h)'}</span>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-600">
                <div>Documento Oficial de Escala</div>
                <div className="font-semibold text-slate-800">Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-[10px] border border-slate-300">
                <thead>
                  <tr className="bg-slate-50 font-bold border-b border-slate-300">
                    <th className="text-left px-2 py-1.5 border-r border-slate-300 min-w-[170px] font-black uppercase text-slate-900">
                      Colaborador ({regimeProviders.length})
                    </th>
                    <th className="px-1.5 py-1.5 border-r border-slate-300 min-w-[50px] uppercase font-bold text-[9px] text-slate-700">
                      Entrada
                    </th>
                    <th className="px-1.5 py-1.5 border-r border-slate-300 min-w-[50px] uppercase font-bold text-[9px] text-slate-700">
                      Saída
                    </th>

                    {/* Day numbers */}
                    {days.map(d => (
                      <th
                        key={`th-day-${d.dayNumber}`}
                        className={`px-0.5 py-1 border-r border-slate-300 min-w-[22px] font-bold ${
                          d.isWeekend ? 'bg-amber-50 text-amber-900' : 'bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>{d.dayNumber}</div>
                        <div className="text-[8px] font-bold uppercase text-slate-500">
                          {DAYS_SHORT_PT[d.dayOfWeek]}
                        </div>
                      </th>
                    ))}
                    <th className="px-1.5 py-1.5 border-l border-slate-300 min-w-[36px] font-bold text-slate-900">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {regimeProviders.length === 0 ? (
                    <tr>
                      <td colSpan={days.length + 4} className="py-6 text-center text-slate-500 font-medium">
                        Nenhum colaborador cadastrado na escala {activeRegime}.
                      </td>
                    </tr>
                  ) : (
                    regimeProviders.map((p, idx) => {
                      const workingDays = assignments.filter(a => {
                        const [y, m] = a.date.split('-').map(Number);
                        return y === currentYear && m === currentMonthIndex + 1 && a.providerId === p.id && a.shiftTypeId === 'st-t';
                      });
                      const countT = workingDays.length;

                      return (
                        <tr
                          key={`row-${p.id}`}
                          className={`border-b border-slate-200 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                          }`}
                        >
                          <td className="text-left px-2 py-1 border-r border-slate-300 font-bold text-slate-900 truncate max-w-[180px]">
                            {p.name}
                          </td>
                          <td className="px-1 py-1 border-r border-slate-300 text-[10px] text-slate-700">
                            {p.entryTime || (activeRegime === '5x2' ? '08h00' : '07h00')}
                          </td>
                          <td className="px-1 py-1 border-r border-slate-300 text-[10px] text-slate-700">
                            {p.exitTime || (activeRegime === '5x2' ? '17h00' : '19h00')}
                          </td>

                          {/* Days */}
                          {days.map(d => {
                            const shift = assignments.find(a => a.providerId === p.id && a.date === d.dateStr);
                            const code = shift ? (shift.shiftTypeId === 'st-t' ? 'T' : 'D') : '-';
                            const hasNote = Boolean(shift?.notes);
                            const isHomeOffice = shift?.workModality === 'home_office';

                            return (
                              <td
                                key={`cell-${p.id}-${d.dateStr}`}
                                className={`border-r border-slate-200 p-0 text-center font-bold text-[10px] ${
                                  d.isWeekend ? 'bg-amber-50/20' : ''
                                }`}
                              >
                                {code === 'T' && (
                                  <div className="flex flex-col items-center justify-center">
                                    <span
                                      className="inline-block w-4 h-4 leading-4 rounded text-emerald-900 text-[9px] font-black bg-emerald-200"
                                    >
                                      T
                                    </span>
                                    {isHomeOffice && (
                                      <span className="text-[6.5px] font-black leading-none text-sky-800">
                                        HO
                                      </span>
                                    )}
                                  </div>
                                )}
                                {code === 'D' && (
                                  <span
                                    className="inline-block w-4 h-4 leading-4 rounded text-sky-900 text-[9px] font-black bg-sky-200"
                                  >
                                    D
                                  </span>
                                )}
                                {code === '-' && <span className="text-slate-300">-</span>}
                                {hasNote && <span className="text-[7px] text-rose-600 font-black block leading-none">*</span>}
                              </td>
                            );
                          })}

                          {/* Total Count */}
                          <td className="px-1 py-1 border-l border-slate-300 font-black text-slate-900 text-center bg-slate-50">
                            {countT}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Totals row */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="text-left px-2 py-1.5 border-r border-slate-300 uppercase text-[9px] font-black text-slate-800">
                      Total Trabalhadores no Dia
                    </td>
                    {days.map(d => {
                      const count = getDailyWorkersCount(d.dateStr);
                      return (
                        <td key={`tot-${d.dateStr}`} className="border-r border-slate-300 font-black text-[9px] text-slate-800">
                          {count > 0 ? count : '-'}
                        </td>
                      );
                    })}
                    <td className="border-l border-slate-300 font-black text-center bg-slate-200">
                      -
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Document Legend & Signatures */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700">
              <div className="flex flex-wrap items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded text-emerald-900 font-bold flex items-center justify-center text-[9px] bg-emerald-200">
                    T
                  </span>
                  <span>Trabalha</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded text-sky-900 font-bold flex items-center justify-center text-[9px] bg-sky-200">
                    D
                  </span>
                  <span>Descanso / Folga</span>
                </div>
                <div className="flex items-center gap-1 text-sky-800">
                  <span className="font-bold border border-sky-300 bg-sky-50 px-1 py-0.2 rounded text-[8px]">
                    HO
                  </span>
                  <span>Home Office</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="font-bold text-rose-600">*</span>
                  <span>Com Observação/Troca</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex items-center gap-8 text-[10px] text-center pt-2">
                <div>
                  <div className="w-40 border-b border-slate-400" />
                  <div className="mt-1 font-semibold text-slate-800">Líder / Responsável Técnico</div>
                </div>
                <div>
                  <div className="w-40 border-b border-slate-400" />
                  <div className="mt-1 font-semibold text-slate-800">Coordenação Geral</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
