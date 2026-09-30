// Date utility functions for EscalaPro

export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DAYS_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DAYS_FULL_PT = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatFriendlyDate(isoString: string, includeYear = false): string {
  if (!isoString) return '';
  const date = parseISODate(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_PT[date.getMonth()];
  const weekDay = DAYS_SHORT_PT[date.getDay()];
  if (includeYear) {
    return `${weekDay}, ${day} de ${month} de ${date.getFullYear()}`;
  }
  return `${weekDay}, ${day} de ${month}`;
}

export function formatShortDate(isoString: string): string {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-');
  return `${d}/${m}/${y}`;
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getMonthDaysArray(year: number, monthIndex: number): Array<{
  dayNumber: number;
  dateStr: string;
  dayOfWeek: number;
  isWeekend: boolean;
}> {
  const daysCount = getDaysInMonth(year, monthIndex);
  const result = [];
  for (let d = 1; d <= daysCount; d++) {
    const dt = new Date(year, monthIndex, d);
    const dateStr = formatDateToISO(dt);
    const dayOfWeek = dt.getDay();
    result.push({
      dayNumber: d,
      dateStr,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }
  return result;
}

export interface CalendarGridDay {
  dayNumber: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number;
}

export function buildMonthCalendarMatrix(year: number, monthIndex: number): CalendarGridDay[][] {
  const todayStr = formatDateToISO(new Date());
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInCurrentMonth = getDaysInMonth(year, monthIndex);
  
  // Previous month fill
  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const prevYear = monthIndex === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonthIndex);
  
  const cells: CalendarGridDay[] = [];
  
  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dt = new Date(prevYear, prevMonthIndex, d);
    const dateStr = formatDateToISO(dt);
    cells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      dayOfWeek: dt.getDay(),
    });
  }
  
  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dt = new Date(year, monthIndex, d);
    const dateStr = formatDateToISO(dt);
    cells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      dayOfWeek: dt.getDay(),
    });
  }
  
  // Next month leading days to complete 35 or 42 cells (5 or 6 weeks)
  const totalCellsNeeded = cells.length > 35 ? 42 : 35;
  const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < totalCellsNeeded) {
    const dt = new Date(nextYear, nextMonthIndex, nextDay);
    const dateStr = formatDateToISO(dt);
    cells.push({
      dayNumber: nextDay,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      dayOfWeek: dt.getDay(),
    });
    nextDay++;
  }
  
  // Split into weeks (rows of 7)
  const weeks: CalendarGridDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function getWeekDaysRange(referenceDate: Date): Array<{
  dateStr: string;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
}> {
  const current = new Date(referenceDate);
  const day = current.getDay();
  const diffToSunday = current.getDate() - day;
  const todayStr = formatDateToISO(new Date());
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(current.getFullYear(), current.getMonth(), diffToSunday + i);
    const dateStr = formatDateToISO(nextDate);
    week.push({
      dateStr,
      dayNumber: nextDate.getDate(),
      dayName: DAYS_SHORT_PT[nextDate.getDay()],
      isToday: dateStr === todayStr,
    });
  }
  return week;
}
