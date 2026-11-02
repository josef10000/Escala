// Brazilian National Holidays Utility (Feriados Nacionais Oficiais)

export interface HolidayBR {
  date: string; // "YYYY-MM-DD"
  name: string;
  type: 'nacional' | 'facultativo';
}

export const BRAZILIAN_HOLIDAYS_2026: Record<string, string> = {
  // Feriados Nacionais 2026
  '2026-01-01': 'Confraternização Universal',
  '2026-02-16': 'Carnaval (Ponto Facultativo)',
  '2026-02-17': 'Carnaval',
  '2026-02-18': 'Quarta-feira de Cinzas',
  '2026-04-03': 'Sexta-feira Santa (Paixão de Cristo)',
  '2026-04-05': 'Páscoa',
  '2026-04-21': 'Tiradentes',
  '2026-05-01': 'Dia do Trabalho',
  '2026-06-04': 'Corpus Christi',
  '2026-09-07': 'Independência do Brasil',
  '2026-10-12': 'Nossa Senhora Aparecida',
  '2026-10-28': 'Dia do Servidor Público',
  '2026-11-02': 'Finados',
  '2026-11-15': 'Proclamação da República',
  '2026-11-20': 'Dia da Consciência Negra',
  '2026-12-24': 'Véspera de Natal',
  '2026-12-25': 'Natal',
  '2026-12-31': 'Véspera de Ano Novo',
};

export function getHolidayInfo(dateStr: string): { isHoliday: boolean; name?: string } {
  if (!dateStr) return { isHoliday: false };
  const name = BRAZILIAN_HOLIDAYS_2026[dateStr];
  if (name) {
    return { isHoliday: true, name };
  }
  
  // Generic month-day checks for other years
  const [_, m, d] = dateStr.split('-');
  const monthDay = `${m}-${d}`;
  const fixedHolidays: Record<string, string> = {
    '01-01': 'Confraternização Universal',
    '04-21': 'Tiradentes',
    '05-01': 'Dia do Trabalho',
    '09-07': 'Independência do Brasil',
    '10-12': 'Nossa Sra. Aparecida',
    '11-02': 'Finados',
    '11-15': 'Proclamação da República',
    '11-20': 'Consciência Negra',
    '12-25': 'Natal',
  };

  if (fixedHolidays[monthDay]) {
    return { isHoliday: true, name: fixedHolidays[monthDay] };
  }

  return { isHoliday: false };
}

export function isSundayDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getDay() === 0;
}
