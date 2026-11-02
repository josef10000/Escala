import { Provider, ShiftAssignment } from '../types';
import { MONTH_NAMES_PT, DAYS_SHORT_PT } from './dateUtils';

/**
 * Generates formatted text and opens WhatsApp with the provider's monthly schedule
 */
export function shareProviderWhatsApp(
  provider: Provider,
  currentYear: number,
  currentMonthIndex: number,
  assignments: ShiftAssignment[]
): void {
  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  
  // Get all working shifts (T) for this provider in the selected month
  const workingDays = assignments
    .filter(a => {
      const [y, m] = a.date.split('-').map(Number);
      return (
        y === currentYear &&
        m === currentMonthIndex + 1 &&
        a.providerId === provider.id &&
        a.shiftTypeId === 'st-t'
      );
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalHours = workingDays.length * 12;

  const daysList = workingDays.map(a => {
    const [, , dStr] = a.date.split('-');
    const dateObj = new Date(currentYear, currentMonthIndex, Number(dStr));
    const dayOfWeek = DAYS_SHORT_PT[dateObj.getDay()];
    const noteText = a.notes ? ` 📌 _(${a.notes})_` : '';
    return `  • *Dia ${dStr}* (${dayOfWeek})${noteText}`;
  }).join('\n');

  let text = `🏥 *ESCALA TÉCNICA 12x36*\n`;
  text += `📅 *${monthName.toUpperCase()} / ${currentYear}*\n\n`;
  text += `👤 *Colaborador(a):* ${provider.name}\n`;
  text += `⏰ *Horário:* ${provider.entryTime || '07h00'} às ${provider.exitTime || '19h00'}\n`;
  text += `📊 *Total no Mês:* ${workingDays.length} plantões (${totalHours}h)\n\n`;
  text += `🟢 *DIAS DE PLANTÃO (TRABALHA):*\n`;
  text += daysList.length > 0 ? daysList : '  _Nenhum plantão escalado no mês._';
  text += `\n\n─────────────────────────\n`;
  text += `_Escala oficial sincronizada no sistema._`;

  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
