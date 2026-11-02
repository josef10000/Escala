import jsPDF from 'jspdf';
import { Provider, ShiftAssignment, WorkRegime } from '../types';
import { MONTH_NAMES_PT, DAYS_SHORT_PT, getMonthDaysArray } from './dateUtils';

interface GeneratePDFParams {
  providers: Provider[];
  assignments: ShiftAssignment[];
  currentYear: number;
  currentMonthIndex: number;
  departmentName?: string;
  regime?: WorkRegime;
}

export function generateEscalaPDF({
  providers,
  assignments,
  currentYear,
  currentMonthIndex,
  departmentName = 'Equipe Técnica',
  regime = '12x36',
}: GeneratePDFParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Filter providers by selected regime
  const regimeProviders = providers.filter(p => (p.regime || '12x36') === regime);

  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  const days = getMonthDaysArray(currentYear, currentMonthIndex);
  const totalDays = days.length;

  const pageWidth = 297;
  const pageHeight = 210;
  const marginLeft = 10;
  const marginTop = 10;
  const printableWidth = pageWidth - marginLeft * 2; // 277 mm

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`ESCALA TÉCNICA OPERACIONAL ${regime.toUpperCase()}`, marginLeft, marginTop + 4);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  const turnoDesc = regime === '5x2' ? 'Regime 5x2 (Seg a Sex)' : 'Regime 12x36 (Plantão)';
  const subtitle = `Setor: ${departmentName}   |   Mês: ${monthName.toUpperCase()} / ${currentYear}   |   ${turnoDesc}   |   Emitido em: ${new Date().toLocaleDateString('pt-BR')}`;
  doc.text(subtitle, marginLeft, marginTop + 9);

  // Divider line
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.4);
  doc.line(marginLeft, marginTop + 11, marginLeft + printableWidth, marginTop + 11);

  // Table Dimensions
  const startY = marginTop + 13;
  const colNameW = 46;
  const colTimeW = 12;
  const colTotalW = 12;
  const remainingW = printableWidth - colNameW - (colTimeW * 2) - colTotalW;
  const colDayW = remainingW / totalDays;

  const headerRowH = 8;
  const rowH = 6.8;

  // Header Background
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(marginLeft, startY, printableWidth, headerRowH, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.rect(marginLeft, startY, printableWidth, headerRowH, 'S');

  // Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`COLABORADOR (${regimeProviders.length})`, marginLeft + 2, startY + 5.2);

  let curX = marginLeft + colNameW;
  doc.line(curX, startY, curX, startY + headerRowH);
  doc.text('ENT.', curX + colTimeW / 2, startY + 5.2, { align: 'center' });

  curX += colTimeW;
  doc.line(curX, startY, curX, startY + headerRowH);
  doc.text('SAÍDA', curX + colTimeW / 2, startY + 5.2, { align: 'center' });

  curX += colTimeW;

  // Day columns header
  days.forEach(d => {
    doc.line(curX, startY, curX, startY + headerRowH);
    if (d.isWeekend) {
      doc.setFillColor(254, 243, 199); // amber-100
      doc.rect(curX, startY, colDayW, headerRowH, 'F');
    }
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(String(d.dayNumber), curX + colDayW / 2, startY + 3.2, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(DAYS_SHORT_PT[d.dayOfWeek].toUpperCase(), curX + colDayW / 2, startY + 6.8, { align: 'center' });
    curX += colDayW;
  });

  // Total Column Header
  doc.line(curX, startY, curX, startY + headerRowH);
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL', curX + colTotalW / 2, startY + 5.2, { align: 'center' });

  // Rows for Providers
  let curY = startY + headerRowH;

  if (regimeProviders.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(marginLeft, curY, printableWidth, rowH * 3, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(marginLeft, curY, printableWidth, rowH * 3, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Nenhum colaborador cadastrado na escala ${regime}.`, marginLeft + printableWidth / 2, curY + 11, { align: 'center' });
    curY += rowH * 3;
  } else {
    regimeProviders.forEach((p, idx) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252); // slate-50
      }
      doc.rect(marginLeft, curY, printableWidth, rowH, 'F');
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.rect(marginLeft, curY, printableWidth, rowH, 'S');

      // Provider Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      const nameStr = p.name.length > 25 ? p.name.substring(0, 24) + '...' : p.name;
      doc.text(nameStr, marginLeft + 2, curY + 4.5);

      // Entrada & Saída
      let rx = marginLeft + colNameW;
      doc.line(rx, curY, rx, curY + rowH);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(p.entryTime || (regime === '5x2' ? '08h00' : '07h00'), rx + colTimeW / 2, curY + 4.5, { align: 'center' });

      rx += colTimeW;
      doc.line(rx, curY, rx, curY + rowH);
      doc.text(p.exitTime || (regime === '5x2' ? '17h00' : '19h00'), rx + colTimeW / 2, curY + 4.5, { align: 'center' });

      rx += colTimeW;

      let workingCount = 0;

      // Days cells
      days.forEach(d => {
        doc.line(rx, curY, rx, curY + rowH);

        const shift = assignments.find(a => a.providerId === p.id && a.date === d.dateStr);
        const isWorking = shift && shift.shiftTypeId === 'st-t';
        const isDayOff = shift && shift.shiftTypeId === 'st-d';
        const isHomeOffice = shift?.workModality === 'home_office';
        const hasNote = Boolean(shift && shift.notes);

        if (isWorking) {
          workingCount++;
          // Green cell
          doc.setFillColor(169, 209, 142); // Soft pastel green
          doc.rect(rx + 0.3, curY + 0.5, colDayW - 0.6, rowH - 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(isHomeOffice ? 5.5 : 6.5);
          doc.setTextColor(20, 83, 45); // dark green
          doc.text('T', rx + colDayW / 2, isHomeOffice ? curY + 3.4 : curY + 4.5, { align: 'center' });

          if (isHomeOffice) {
            doc.setFontSize(4);
            doc.setTextColor(3, 105, 161); // sky-700
            doc.text('HO', rx + colDayW / 2, curY + 5.8, { align: 'center' });
          }
        } else if (isDayOff) {
          // Blue cell
          doc.setFillColor(152, 183, 232); // Soft pastel blue
          doc.rect(rx + 0.3, curY + 0.5, colDayW - 0.6, rowH - 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(30, 58, 138); // dark blue
          doc.text('D', rx + colDayW / 2, curY + 4.5, { align: 'center' });
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text('-', rx + colDayW / 2, curY + 4.5, { align: 'center' });
        }

        // Observation marker
        if (hasNote) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6);
          doc.setTextColor(225, 29, 72); // rose-600
          doc.text('*', rx + colDayW - 1.2, curY + 2.5);
        }

        rx += colDayW;
      });

      // Total Working Days
      doc.line(rx, curY, rx, curY + rowH);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(String(workingCount), rx + colTotalW / 2, curY + 4.5, { align: 'center' });

      curY += rowH;
    });
  }

  // Daily Totals Row
  doc.setFillColor(226, 232, 240); // slate-200
  doc.rect(marginLeft, curY, printableWidth, rowH, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.rect(marginLeft, curY, printableWidth, rowH, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL DE TRABALHADORES NO DIA', marginLeft + 2, curY + 4.5);

  let totX = marginLeft + colNameW + colTimeW * 2;
  days.forEach(d => {
    doc.line(totX, curY, totX, curY + rowH);
    const dayWorkers = assignments.filter(
      a => a.date === d.dateStr && a.shiftTypeId === 'st-t' && regimeProviders.some(p => p.id === a.providerId)
    ).length;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(dayWorkers > 0 ? String(dayWorkers) : '-', totX + colDayW / 2, curY + 4.5, { align: 'center' });
    totX += colDayW;
  });

  doc.line(totX, curY, totX, curY + rowH);
  doc.text('-', totX + colTotalW / 2, curY + 4.5, { align: 'center' });

  curY += rowH + 6;

  // Legend
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);

  // Legend T
  doc.setFillColor(169, 209, 142);
  doc.rect(marginLeft, curY, 3.5, 3.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text('T', marginLeft + 1.75, curY + 2.7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Trabalha', marginLeft + 5, curY + 2.8);

  // Legend D
  doc.setFillColor(152, 183, 232);
  doc.rect(marginLeft + 28, curY, 3.5, 3.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('D', marginLeft + 29.75, curY + 2.7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Descanso / Folga', marginLeft + 33, curY + 2.8);

  // Legend HO
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161);
  doc.text('HO', marginLeft + 63, curY + 2.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Home Office', marginLeft + 69, curY + 2.8);

  // Legend *
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text('*', marginLeft + 94, curY + 2.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Com Observação de Troca / Ajuste', marginLeft + 97, curY + 2.8);

  // Signatures on right
  const sigY = curY + 12;
  const sig1X = marginLeft + 130;
  const sig2X = marginLeft + 210;
  const sigW = 60;

  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.3);
  doc.line(sig1X, sigY, sig1X + sigW, sigY);
  doc.line(sig2X, sigY, sig2X + sigW, sigY);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Responsável Técnico / Líder de Escala', sig1X + sigW / 2, sigY + 3.5, { align: 'center' });
  doc.text('Coordenação Geral / Direção', sig2X + sigW / 2, sigY + 3.5, { align: 'center' });

  return doc;
}

/**
 * Generates and downloads CSV compatible with Excel
 */
export function exportEscalaToCSV({
  providers,
  assignments,
  currentYear,
  currentMonthIndex,
  departmentName = 'Equipe Técnica',
  regime = '12x36',
}: GeneratePDFParams): void {
  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  const days = getMonthDaysArray(currentYear, currentMonthIndex);
  const regimeProviders = providers.filter(p => (p.regime || '12x36') === regime);

  let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
  csv += `ESCALA TÉCNICA OPERACIONAL ${regime.toUpperCase()} - ${monthName.toUpperCase()} / ${currentYear}\r\n`;
  csv += `Setor: ${departmentName};Regime: ${regime};Emissão: ${new Date().toLocaleDateString('pt-BR')}\r\n\r\n`;

  // Header row
  const dayHeaders = days.map(d => `Dia ${d.dayNumber} (${DAYS_SHORT_PT[d.dayOfWeek]})`).join(';');
  csv += `Colaborador;Entrada;Saída;${dayHeaders};Total Trabalhados\r\n`;

  // Rows
  regimeProviders.forEach(p => {
    const workingDays = assignments.filter(a => {
      const [y, m] = a.date.split('-').map(Number);
      return y === currentYear && m === currentMonthIndex + 1 && a.providerId === p.id && a.shiftTypeId === 'st-t';
    });

    const dayCells = days.map(d => {
      const shift = assignments.find(a => a.providerId === p.id && a.date === d.dateStr);
      if (!shift) return '-';
      let code = shift.shiftTypeId === 'st-t' ? 'T' : 'D';
      if (shift.workModality === 'home_office') {
        code += ' (HO)';
      }
      if (shift.notes) {
        return `"${code} [${shift.notes.replace(/"/g, '""')}]"`;
      }
      return code;
    }).join(';');

    csv += `"${p.name.replace(/"/g, '""')}";"${p.entryTime || (regime === '5x2' ? '08h00' : '07h00')}";"${p.exitTime || (regime === '5x2' ? '17h00' : '19h00')}";${dayCells};${workingDays.length}\r\n`;
  });

  // Daily totals row
  const dayTotals = days.map(d => {
    return assignments.filter(
      a => a.date === d.dateStr && a.shiftTypeId === 'st-t' && regimeProviders.some(p => p.id === a.providerId)
    ).length;
  }).join(';');
  csv += `Total Trabalhadores;-;-;${dayTotals};-\r\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `escala-${regime}-${monthName.toLowerCase()}-${currentYear}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
