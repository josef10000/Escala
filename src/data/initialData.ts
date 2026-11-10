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
    regime: '12x36',
    teamGroup: 'turma_a',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'daniel.silva@escala.com',
    phone: '(11) 98711-2233',
    whatsapp: '11987112233',
    color: 'blue',
    maxMonthlyHours: 180,
    baseSalaryOrFee: 3500,
    bonusAmount: 600,
    bonusFrequencyMonths: 3, // Trimestral
    deductionPerMinuteLate: 0.50,
    deductionPerAbsence: 150,
    status: 'active'
  },
  {
    id: 'prov-2',
    name: 'NATASHA AMARAL DE OLIVEIRA',
    role: 'Prestador',
    regime: '12x36',
    teamGroup: 'turma_b',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'natasha.oliveira@escala.com',
    phone: '(11) 98722-3344',
    whatsapp: '11987223344',
    color: 'emerald',
    maxMonthlyHours: 180,
    baseSalaryOrFee: 3500,
    bonusAmount: 600,
    bonusFrequencyMonths: 3,
    deductionPerMinuteLate: 0.50,
    deductionPerAbsence: 150,
    status: 'active'
  },
  {
    id: 'prov-3',
    name: 'JOSE FRAZAO DA SILVA NETO',
    role: 'Prestador',
    regime: '12x36',
    teamGroup: 'turma_a',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'jose.frazao@escala.com',
    phone: '(11) 98733-4455',
    whatsapp: '11987334455',
    color: 'cyan',
    maxMonthlyHours: 180,
    baseSalaryOrFee: 3500,
    bonusAmount: 500,
    bonusFrequencyMonths: 1, // Mensal
    deductionPerMinuteLate: 0.50,
    deductionPerAbsence: 150,
    status: 'active'
  },
  {
    id: 'prov-4',
    name: 'PATRICIA VIEIRA DA CONCEICAO',
    role: 'Prestador',
    regime: '12x36',
    teamGroup: 'turma_b',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'patricia.conceicao@escala.com',
    phone: '(11) 98744-5566',
    whatsapp: '11987445566',
    color: 'purple',
    maxMonthlyHours: 180,
    baseSalaryOrFee: 3500,
    bonusAmount: 600,
    bonusFrequencyMonths: 3,
    deductionPerMinuteLate: 0.50,
    deductionPerAbsence: 150,
    status: 'active'
  },
  {
    id: 'prov-5',
    name: 'REGIANE JUCA DE CARVALHO',
    role: 'Prestador',
    regime: '12x36',
    teamGroup: 'turma_b',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'regiane.carvalho@escala.com',
    phone: '(11) 98755-6677',
    whatsapp: '11987556677',
    color: 'amber',
    maxMonthlyHours: 180,
    baseSalaryOrFee: 3500,
    bonusAmount: 600,
    bonusFrequencyMonths: 3,
    deductionPerMinuteLate: 0.50,
    deductionPerAbsence: 150,
    status: 'active'
  },
  {
    id: 'prov-6',
    name: 'STEFANIE CRISTINA SANTOS SILVESTRE DA SILVA',
    role: 'Prestador',
    regime: '12x36',
    teamGroup: 'turma_a',
    entryTime: '07h00',
    exitTime: '19h00',
    email: 'stefanie.silva@escala.com',
    phone: '(11) 98766-7788',
    whatsapp: '11987667788',
    color: 'rose',
    maxMonthlyHours: 180,
    baseSalaryOrFee: 3500,
    bonusAmount: 800,
    bonusFrequencyMonths: 6, // Semestral
    deductionPerMinuteLate: 0.50,
    deductionPerAbsence: 150,
    status: 'active'
  }
];

// Exact shift patterns for October 2026
const PATTERN_DANIEL_OCT = ['T','D','T','T','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','T','D','T','D','T','D','D','D','T','D','T','D'];
const PATTERN_NATASHA_OCT = ['D','T','D','D','D','T','D','T','D','D','D','D','D','D','D','T','D','D','D','T','D','T','D','T','T','T','D','T','D','T','D'];
const PATTERN_JOSE_OCT = ['-','-','-','-','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','T','D','T','D','T','D','D','D','T','D','T','D'];
const PATTERN_PATRICIA_OCT = ['-','-','-','-','-','-','D','T','D','T','T','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','D','T','D','T','D'];
const PATTERN_REGIANE_OCT = ['D','T','D','D','D','T','D','T','D','T','T','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','D','T','D','T','D'];
const PATTERN_STEFANIE_OCT = ['T','D','T','T','T','D','T','D','T','D','D','D','T','D','T','D','T','T','T','T','D','T','D','T','D','D','D','T','D','T','D'];

// Exact shift patterns for NOVEMBER 2026 from user's uploaded image (image.png)
// Group 1: DANIEL, JOSÉ FRAZÃO, STEFANIE (16 work days: 1, 2, 4, 6, 10, 12, 14, 15, 16, 18, 20, 24, 26, 28, 29, 30)
const PATTERN_NOV_DANIEL = [
  'T','T','D','T','D','T','D','D','D','T',
  'D','T','D','T','T','T','D','T','D','T',
  'D','D','D','T','D','T','D','T','T','T'
]; // prov-1

// Group 2: NATASHA, PATRICIA, REGIANE (14 work days: 3, 5, 7, 8, 9, 11, 13, 17, 19, 21, 22, 23, 25, 27)
const PATTERN_NOV_NATASHA = [
  'D','D','T','D','T','D','T','T','T','D',
  'T','D','T','D','D','D','T','D','T','D',
  'T','T','T','D','T','D','T','D','D','D'
]; // prov-2

const PATTERN_NOV_JOSE = [
  'T','T','D','T','D','T','D','D','D','T',
  'D','T','D','T','T','T','D','T','D','T',
  'D','D','D','T','D','T','D','T','T','T'
]; // prov-3

const PATTERN_NOV_PATRICIA = [
  'D','D','T','D','T','D','T','T','T','D',
  'T','D','T','D','D','D','T','D','T','D',
  'T','T','T','D','T','D','T','D','D','D'
]; // prov-4

const PATTERN_NOV_REGIANE = [
  'D','D','T','D','T','D','T','T','T','D',
  'T','D','T','D','D','D','T','D','T','D',
  'T','T','T','D','T','D','T','D','D','D'
]; // prov-5

const PATTERN_NOV_STEFANIE = [
  'T','T','D','T','D','T','D','D','D','T',
  'D','T','D','T','T','T','D','T','D','T',
  'D','D','D','T','D','T','D','T','T','T'
]; // prov-6

const PROVIDER_PATTERNS_NOV: { [id: string]: string[] } = {
  'prov-1': PATTERN_NOV_DANIEL,
  'prov-2': PATTERN_NOV_NATASHA,
  'prov-3': PATTERN_NOV_JOSE,
  'prov-4': PATTERN_NOV_PATRICIA,
  'prov-5': PATTERN_NOV_REGIANE,
  'prov-6': PATTERN_NOV_STEFANIE,
};

const PROVIDER_PATTERNS_OCT: { [id: string]: string[] } = {
  'prov-1': PATTERN_DANIEL_OCT,
  'prov-2': PATTERN_NATASHA_OCT,
  'prov-3': PATTERN_JOSE_OCT,
  'prov-4': PATTERN_PATRICIA_OCT,
  'prov-5': PATTERN_REGIANE_OCT,
  'prov-6': PATTERN_STEFANIE_OCT,
};

export function generateInitialAssignments(): ShiftAssignment[] {
  const assignments: ShiftAssignment[] = [];
  
  // Seed October 2026 and November 2026
  const monthsToSeed = [
    { year: 2026, month: 9 },  // October 2026
    { year: 2026, month: 10 }, // November 2026
  ];

  let idCounter = 1;

  monthsToSeed.forEach(({ year, month }) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const isNov = month === 10;
    const patternsMap = isNov ? PROVIDER_PATTERNS_NOV : PROVIDER_PATTERNS_OCT;

    INITIAL_PROVIDERS.forEach(prov => {
      const pattern = patternsMap[prov.id] || (isNov ? PATTERN_NOV_DANIEL : PATTERN_DANIEL_OCT);

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDateToISO(date);
        const shiftCode = pattern[(day - 1) % pattern.length];

        if (shiftCode === 'D' || shiftCode === 'T') {
          const shiftTypeId = shiftCode === 'D' ? 'st-d' : 'st-t';

          assignments.push({
            id: `shift-${idCounter++}`,
            date: dateStr,
            shiftTypeId,
            departmentId: 'dept-1',
            providerId: prov.id,
            status: 'confirmed',
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
