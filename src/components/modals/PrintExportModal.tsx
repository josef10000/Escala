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
    try {
      exportEscalaToCSV({
        providers,
        assignments,
        currentYear,
        currentMonthIndex,
        departmentName: deptName,
        regime: activeRegime,
      });
    } catch (e) {
      console.error('Error exporting CSV:', e);
    }
  };

  // Browser Direct Print
  const handleBrowserPrint = () => {
    window.print();
  };

  // Copy HTML Table to Clipboard for Excel / Word Paste
  const handleCopyExcel = () => {
    const tableEl = document.getElementById('preview-print-table');
    if (!tableEl) return;

    try {
      const html = tableEl.outerHTML;
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([tableEl.innerText], { type: 'text/plain' });

      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0e1017] border border-white/[0.09] text-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl cursor-default"
      >
        
        {/* Modal Top Header */}
        <div className="p-5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#12141c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00d2d3]/15 border border-[#00d2d3]/30 flex items-center justify-center text-[#00d2d3] font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Central de Impressão & Exportação ({activeRegime})
              </h3>
              <p className="text-xs text-neutral-400">
                Gere o PDF oficial em A4 Paisagem, baixe para Excel ou imprima a escala {activeRegime}
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Excel CSV button */}
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Baixar planilha compatível com Microsoft Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Baixar Excel</span>
            </button>

            {/* Copy Table button */}
            <button
              onClick={handleCopyExcel}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Copiar tabela para colar no Excel ou Word"
            >
              {copiedExcel ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              <span>{copiedExcel ? 'Copiado!' : 'Copiar p/ Excel'}</span>
            </button>

            {/* Print button */}
            <button
              onClick={handleBrowserPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Acionar diálogo de impressão da impressora"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-400" />
              <span>Imprimir</span>
            </button>

            {/* PRIMARY BUTTON: DOWNLOAD PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] font-bold rounded-xl text-xs transition-all shadow-md shadow-[#00d2d3]/20 cursor-pointer"
              title="Baixar arquivo PDF formatado para imprimir ou salvar"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGenerating ? 'Gerando...' : `Baixar PDF ${activeRegime}`}</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {downloadSuccess && blobPdfUrl && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300 gap-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>PDF {activeRegime} gerado com sucesso!</strong> Se o download não iniciou automaticamente:
              </span>
            </div>
            <a
              href={blobPdfUrl}
              target="_blank"
              rel="noreferrer"
              download={`escala-${activeRegime}-${monthName.toLowerCase()}-${currentYear}.pdf`}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Arquivo</span>
            </a>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-auto p-6 bg-[#090A0F] flex justify-center">
          <div
            id="preview-print-table"
            className="w-full max-w-4xl bg-[#12141A] text-white p-6 rounded-2xl border border-white/[0.08] shadow-sm space-y-4 font-sans print:bg-white print:text-black print:p-0 print:border-none"
            style={{ minWidth: '850px' }}
          >
            {/* Document Header */}
            <div className="border-b border-white/[0.1] pb-3 flex items-start justify-between print:border-black">
              <div>
                <h1 className="text-base font-bold tracking-tight uppercase text-white print:text-black">
                  ESCALA TÉCNICA OPERACIONAL {activeRegime.toUpperCase()}
                </h1>
                <div className="flex items-center gap-3 text-xs text-neutral-400 font-medium mt-0.5 print:text-slate-700">
                  <span><strong className="text-white print:text-black">Setor:</strong> {deptName}</span>
                  <span>•</span>
                  <span><strong className="text-white print:text-black">Referência:</strong> {monthName.toUpperCase()} / {currentYear}</span>
                  <span>•</span>
                  <span><strong className="text-white print:text-black">Regime:</strong> {activeRegime === '5x2' ? '5x2 (Segunda a Sexta)' : '12x36 (Turno 12h)'}</span>
                </div>
              </div>

              <div className="text-right text-[11px] text-neutral-400 print:text-slate-600">
                <div>Documento Oficial de Escala</div>
                <div className="font-semibold text-white print:text-black">Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-[10px] border border-white/[0.08] print:border-slate-300">
                <thead>
                  <tr className="bg-[#181B26] font-bold border-b border-white/[0.08] print:bg-slate-100 print:text-black">
                    <th className="text-left px-2 py-2 border-r border-white/[0.08] min-w-[170px] font-bold uppercase text-white print:text-black">
                      Colaborador ({regimeProviders.length})
                    </th>
                    <th className="px-1.5 py-2 border-r border-white/[0.08] min-w-[50px] uppercase font-semibold text-[9px] text-neutral-300 print:text-black">
                      Entrada
                    </th>
                    <th className="px-1.5 py-2 border-r border-white/[0.08] min-w-[50px] uppercase font-semibold text-[9px] text-neutral-300 print:text-black">
                      Saída
                    </th>

                    {/* Day numbers */}
                    {days.map(d => (
                      <th
                        key={`th-day-${d.dayNumber}`}
                        className={`px-0.5 py-1.5 border-r border-white/[0.08] min-w-[22px] font-semibold ${
                          d.isWeekend ? 'bg-amber-500/15 text-amber-300' : 'bg-[#181B26] text-neutral-300'
                        } print:text-black`}
                      >
                        <div>{d.dayNumber}</div>
                        <div className="text-[8px] uppercase text-neutral-400 print:text-slate-600">
                          {DAYS_SHORT_PT[d.dayOfWeek]}
                        </div>
                      </th>
                    ))}
                    <th className="px-1.5 py-2 border-l border-white/[0.08] min-w-[36px] font-bold text-white print:text-black">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04] print:divide-slate-200">
                  {regimeProviders.length === 0 ? (
                    <tr>
                      <td colSpan={days.length + 4} className="py-6 text-center text-neutral-400 font-medium">
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
                          className={`hover:bg-white/[0.02] ${
                            idx % 2 === 0 ? 'bg-[#12141A]' : 'bg-[#151822]/60'
                          }`}
                        >
                          <td className="text-left px-2 py-1.5 border-r border-white/[0.08] font-semibold text-white truncate max-w-[180px] print:text-black">
                            {p.name}
                          </td>
                          <td className="px-1 py-1.5 border-r border-white/[0.08] text-[10px] text-neutral-300 print:text-black">
                            {p.entryTime || (activeRegime === '5x2' ? '08h00' : '07h00')}
                          </td>
                          <td className="px-1 py-1.5 border-r border-white/[0.08] text-[10px] text-neutral-300 print:text-black">
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
                                className={`border-r border-white/[0.06] p-0 text-center font-bold text-[10px] ${
                                  d.isWeekend ? 'bg-amber-500/[0.03]' : ''
                                }`}
                              >
                                {code === 'T' && (
                                  <div className="flex flex-col items-center justify-center">
                                    <span
                                      className="inline-block w-4 h-4 leading-4 rounded text-[#003731] text-[9px] font-black bg-[#00d2d3]"
                                    >
                                      T
                                    </span>
                                    {isHomeOffice && (
                                      <span className="text-[6.5px] font-bold leading-none text-purple-300">
                                        HO
                                      </span>
                                    )}
                                  </div>
                                )}
                                {code === 'D' && (
                                  <span
                                    className="inline-block w-4 h-4 leading-4 rounded text-neutral-400 text-[9px] font-bold bg-[#27272a]"
                                  >
                                    D
                                  </span>
                                )}
                                {code === '-' && <span className="text-neutral-600">-</span>}
                                {hasNote && <span className="text-[7px] text-rose-400 font-black block leading-none">*</span>}
                              </td>
                            );
                          })}

                          {/* Total Count */}
                          <td className="px-1 py-1.5 border-l border-white/[0.08] font-bold text-[#00d2d3] text-center bg-[#181B26] print:text-black">
                            {countT}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Totals row */}
                  <tr className="bg-[#181B26] font-semibold border-t border-white/[0.1] print:bg-slate-100">
                    <td colSpan={3} className="text-left px-2 py-1.5 border-r border-white/[0.08] uppercase text-[9px] font-bold text-neutral-300 print:text-black">
                      Total Trabalhadores no Dia
                    </td>
                    {days.map(d => {
                      const count = getDailyWorkersCount(d.dateStr);
                      return (
                        <td key={`tot-${d.dateStr}`} className="border-r border-white/[0.08] font-bold text-[9px] text-[#00d2d3] print:text-black">
                          {count > 0 ? count : '-'}
                        </td>
                      );
                    })}
                    <td className="border-l border-white/[0.08] font-bold text-center bg-[#181B26]">
                      -
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Document Legend & Signatures */}
            <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 print:text-slate-700">
              <div className="flex flex-wrap items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded text-[#003731] font-bold flex items-center justify-center text-[9px] bg-[#00d2d3]">
                    T
                  </span>
                  <span>Trabalha</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded text-neutral-300 font-bold flex items-center justify-center text-[9px] bg-[#27272a]">
                    D
                  </span>
                  <span>Descanso / Folga</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-300">
                  <span className="font-bold border border-purple-500/30 bg-purple-500/20 px-1 py-0.2 rounded text-[8px]">
                    HO
                  </span>
                  <span>Home Office</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <span className="font-bold text-rose-400">*</span>
                  <span>Com Observação/Troca</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex items-center gap-8 text-[10px] text-center pt-2">
                <div>
                  <div className="w-36 border-b border-white/20 print:border-black" />
                  <div className="mt-1 font-semibold text-neutral-300 print:text-black">Líder / Responsável Técnico</div>
                </div>
                <div>
                  <div className="w-36 border-b border-white/20 print:border-black" />
                  <div className="mt-1 font-semibold text-neutral-300 print:text-black">Coordenação Geral</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
