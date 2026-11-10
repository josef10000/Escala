import { PontoFixoItem } from '../types';

export interface PontoFixoScheduleStatus {
  isOpen: boolean;
  status: 'aberto' | 'fecha_em_breve' | 'fechado' | 'abre_hoje';
  label: string;
  subtext: string;
  badgeColor: 'emerald' | 'amber' | 'rose';
  closingInMinutes?: number;
}

/**
 * Extracts start and end hour/minute from strings like:
 * "08:00 às 17:00 (Segunda a Sexta)" or "08:00 às 12:00"
 */
function parseTimeRange(timeStr?: string): { startH: number; startM: number; endH: number; endM: number } | null {
  if (!timeStr) return null;
  
  // Format: 08:00 às 17:00 or 08:00 - 17:00 or 8:00 a 17:00
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(?:às|as|-|a|ate|até)\s*(\d{1,2}):(\d{2})/i);
  if (!match) return null;

  return {
    startH: parseInt(match[1], 10),
    startM: parseInt(match[2], 10),
    endH: parseInt(match[3], 10),
    endM: parseInt(match[4], 10),
  };
}

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Computes the real-time operational status of a Ponto Fixo
 * based on the current day of the week and local clock time.
 */
export function getPontoFixoStatus(pf: PontoFixoItem, date: Date = new Date()): PontoFixoScheduleStatus {
  const day = date.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  // Domingo: Fechado
  if (day === 0) {
    const weekdayHours = parseTimeRange(pf.horarioSemana);
    const opensAt = weekdayHours ? `${padZero(weekdayHours.startH)}:${padZero(weekdayHours.startM)}` : '08:00';
    return {
      isOpen: false,
      status: 'fechado',
      label: 'Fechado hoje (Domingo)',
      subtext: `Abre segunda-feira às ${opensAt}`,
      badgeColor: 'rose',
    };
  }

  // Sábado
  if (day === 6) {
    const saturdayHours = parseTimeRange(pf.horarioSabado);
    if (!saturdayHours) {
      return {
        isOpen: false,
        status: 'fechado',
        label: 'Fechado aos sábados',
        subtext: 'Abre segunda-feira às 08:00',
        badgeColor: 'rose',
      };
    }

    const openMin = saturdayHours.startH * 60 + saturdayHours.startM;
    const closeMin = saturdayHours.endH * 60 + saturdayHours.endM;
    const openTimeFmt = `${padZero(saturdayHours.startH)}:${padZero(saturdayHours.startM)}`;
    const closeTimeFmt = `${padZero(saturdayHours.endH)}:${padZero(saturdayHours.endM)}`;

    if (currentMinutes < openMin) {
      return {
        isOpen: false,
        status: 'abre_hoje',
        label: 'Fechado agora',
        subtext: `Abre hoje às ${openTimeFmt}`,
        badgeColor: 'amber',
      };
    }

    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      const minutesLeft = closeMin - currentMinutes;
      if (minutesLeft <= 45) {
        return {
          isOpen: true,
          status: 'fecha_em_breve',
          label: 'Fecha em breve',
          subtext: `Fecha às ${closeTimeFmt} (${minutesLeft} min)`,
          badgeColor: 'amber',
          closingInMinutes: minutesLeft,
        };
      }
      return {
        isOpen: true,
        status: 'aberto',
        label: 'Aberto agora',
        subtext: `Fecha às ${closeTimeFmt}`,
        badgeColor: 'emerald',
      };
    }

    // Passou do horário de sábado
    return {
      isOpen: false,
      status: 'fechado',
      label: 'Fechado (expediente encerrado)',
      subtext: 'Abre segunda-feira às 08:00',
      badgeColor: 'rose',
    };
  }

  // Segunda a Sexta (1 a 5)
  const weekdayHours = parseTimeRange(pf.horarioSemana);
  if (!weekdayHours) {
    return {
      isOpen: true,
      status: 'aberto',
      label: 'Em atendimento',
      subtext: pf.horarioSemana,
      badgeColor: 'emerald',
    };
  }

  const openMin = weekdayHours.startH * 60 + weekdayHours.startM;
  const closeMin = weekdayHours.endH * 60 + weekdayHours.endM;
  const openTimeFmt = `${padZero(weekdayHours.startH)}:${padZero(weekdayHours.startM)}`;
  const closeTimeFmt = `${padZero(weekdayHours.endH)}:${padZero(weekdayHours.endM)}`;

  // Antes de abrir
  if (currentMinutes < openMin) {
    return {
      isOpen: false,
      status: 'abre_hoje',
      label: 'Fechado agora',
      subtext: `Abre hoje às ${openTimeFmt}`,
      badgeColor: 'amber',
    };
  }

  // Dentro do horário de funcionamento
  if (currentMinutes >= openMin && currentMinutes < closeMin) {
    const minutesLeft = closeMin - currentMinutes;
    if (minutesLeft <= 45) {
      return {
        isOpen: true,
        status: 'fecha_em_breve',
        label: 'Fecha em breve',
        subtext: `Fecha às ${closeTimeFmt} (${minutesLeft} min)`,
        badgeColor: 'amber',
        closingInMinutes: minutesLeft,
      };
    }
    return {
      isOpen: true,
      status: 'aberto',
      label: 'Aberto agora',
      subtext: `Fecha às ${closeTimeFmt}`,
      badgeColor: 'emerald',
    };
  }

  // Após o expediente do dia
  if (day === 5) {
    // Sexta-feira após o fechamento -> abre amanhã (sábado)
    const saturdayHours = parseTimeRange(pf.horarioSabado);
    const satOpen = saturdayHours ? `${padZero(saturdayHours.startH)}:${padZero(saturdayHours.startM)}` : '08:00';
    return {
      isOpen: false,
      status: 'fechado',
      label: 'Fechado (expediente encerrado)',
      subtext: `Abre amanhã (Sábado) às ${satOpen}`,
      badgeColor: 'rose',
    };
  }

  // Segunda a Quinta após o fechamento -> abre amanhã
  return {
    isOpen: false,
    status: 'fechado',
    label: 'Fechado (expediente encerrado)',
    subtext: `Abre amanhã às ${openTimeFmt}`,
    badgeColor: 'rose',
  };
}
