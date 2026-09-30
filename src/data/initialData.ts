import { Department, Provider, ShiftAssignment, ShiftType, SwapRequest } from '../types';
import { formatDateToISO } from '../utils/dateUtils';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Geral / Plantão', description: 'Escala Operacional' },
];

export const INITIAL_SHIFT_TYPES: ShiftType[] = [
  {
    id: 'st-t',
    name: 'Trabalha',
    code: 'T',
    startTime: '07:00',
    endTime: '19:00',
    durationHours: 12,
    colorBg: 'bg-emerald-600/30 dark:bg-emerald-500/25',
    colorText: 'text-emerald-200 dark:text-emerald-100',
    colorBorder: 'border-emerald-500/40',
    description: 'Dia de Trabalho (Trabalha)'
  },
  {
    id: 'st-d',
    name: 'Descanso',
    code: 'D',
    startTime: '07:00',
    endTime: '19:00',
    durationHours: 0,
    colorBg: 'bg-blue-600/30 dark:bg-blue-500/25',
    colorText: 'text-blue-200 dark:text-blue-100',
    colorBorder: 'border-blue-500/40',
    description: 'Dia de Folga / Descanso (Descanso)'
  }
];

export const INITIAL_PROVIDERS: Provider[] = [
  {
    id: 'prov-1',
    name: 'DANIEL ANTONIO DA SILVA',
    role: 'Prestador',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'daniel.silva@escala.com',
    phone: '(11) 98711-2233',
    color: 'blue',
    maxMonthlyHours: 180,
    status: 'active'
  },
  {
    id: 'prov-2',
    name: 'NATASHA AMARAL DE OLIVEIRA',
    role: 'Prestador',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'natasha.oliveira@escala.com',
    phone: '(11) 98722-3344',
    color: 'emerald',
    maxMonthlyHours: 180,
    status: 'active'
  },
  {
    id: 'prov-3',
    name: 'JOSE FRAZAO DA SILVA NETO',
    role: 'Prestador',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'jose.frazao@escala.com',
    phone: '(11) 98733-4455',
    color: 'cyan',
    maxMonthlyHours: 180,
    status: 'active'
  },
  {
    id: 'prov-4',
    name: 'PATRICIA VIEIRA DA CONCEICAO',
    role: 'Prestador',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'patricia.conceicao@escala.com',
    phone: '(11) 98744-5566',
    color: 'purple',
    maxMonthlyHours: 180,
    status: 'active'
  },
  {
    id: 'prov-5',
    name: 'REGIANE JUCA DE CARVALHO',
    role: 'Prestador',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'regiane.carvalho@escala.com',
    phone: '(11) 98755-6677',
    color: 'amber',
    maxMonthlyHours: 180,
    status: 'active'
  },
  {
    id: 'prov-6',
    name: 'STEFANIE CRISTINA SANTOS SILVESTRE DA SILVA',
    role: 'Prestador',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'stefanie.silva@escala.com',
    phone: '(11) 98766-7788',
    color: 'rose',
    maxMonthlyHours: 180,
    status: 'active'
  }
];

// Exact shift patterns from the user's reference image for 31 days
const PATTERN_DANIEL = ['T','D','T','T','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','T','D','T','D','T','D','D','D','T','D','T','D'];
const PATTERN_NATASHA = ['D','T','D','D','D','T','D','T','D','D','D','D','D','D','D','T','D','D','D','T','D','T','D','T','T','T','D','T','D','T','D'];
const PATTERN_JOSE = ['-','-','-','-','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','T','D','T','D','T','D','D','D','T','D','T','D'];
const PATTERN_PATRICIA = ['-','-','-','-','-','-','D','T','D','T','T','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','D','T','D','T','D'];
const PATTERN_REGIANE = ['D','T','D','D','D','T','D','T','D','T','T','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','D','T','D','T','D'];
const PATTERN_STEFANIE = ['T','D','T','T','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','T','D','T','D','T','D','D','D','T','D','T','D'];

const PROVIDER_PATTERNS: { [id: string]: string[] } = {
  'prov-1': PATTERN_DANIEL,
  'prov-2': PATTERN_NATASHA,
  'prov-3': PATTERN_JOSE,
  'prov-4': PATTERN_PATRICIA,
  'prov-5': PATTERN_REGIANE,
  'prov-6': PATTERN_STEFANIE,
};

export function generateInitialAssignments(): ShiftAssignment[] {
  const assignments: ShiftAssignment[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Seed for current month and adjacent
  const monthsToSeed = [
    { year: currentYear, month: currentMonth }
  ];

  let idCounter = 1;

  monthsToSeed.forEach(({ year, month }) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    INITIAL_PROVIDERS.forEach(prov => {
      const pattern = PROVIDER_PATTERNS[prov.id] || PATTERN_DANIEL;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDateToISO(date);
        const shiftCode = pattern[(day - 1) % pattern.length];

        if (shiftCode === 'D' || shiftCode === 'T') {
          const shiftTypeId = shiftCode === 'D' ? 'st-d' : 'st-t';
          // Natasha days 10 to 14 have a note (red corner mark in reference)
          const hasNote = prov.id === 'prov-2' && day >= 10 && day <= 14;

          assignments.push({
            id: `shift-${idCounter++}`,
            date: dateStr,
            shiftTypeId,
            departmentId: 'dept-1',
            providerId: prov.id,
            status: 'confirmed',
            notes: hasNote ? 'Cobertura especial confirmada' : undefined,
            acknowledgedByProvider: true,
            createdAt: new Date().toISOString()
          });
        }
      }
    });
  });

  return assignments;
}

export function generateInitialSwapRequests(assignments: ShiftAssignment[]): SwapRequest[] {
  return [];
}
