export type ShiftStatus = 'confirmed' | 'pending' | 'swapped' | 'absent';
export type WorkRegime = '12x36' | '5x2' | 'weekend';
export type WorkModality = 'presencial' | 'home_office';
export type TeamGroup = 'turma_a' | 'turma_b' | 'none'; // Turma A = Ímpares, Turma B = Pares
export type AbsenceType = 'vacation' | 'medical' | 'maternity' | 'compensation' | 'other';

export interface WeekendColumn {
  id: string;
  name: string;
}

export interface WeekendDayRow {
  dateStr: string; // "YYYY-MM-DD"
  formattedDate: string; // "07/11/2026"
  dayOfWeek: number; // 0 for Sunday, 6 for Saturday
  dayOfWeekName: 'SÁBADO' | 'DOMINGO';
  slots: Record<string, string>; // columnId -> assigned name
}

export interface Provider {
  id: string;
  name: string;
  role: string; // e.g., "Prestador", "Técnico", "Administrativo", etc.
  regime?: WorkRegime; // '12x36' (padrão) ou '5x2'
  teamGroup?: TeamGroup; // 'turma_a' (Ímpares) ou 'turma_b' (Pares)
  entryTime?: string; // e.g., "07h00" ou "08h00"
  exitTime?: string; // e.g., "19h00" ou "17h00"
  email: string;
  phone: string;
  whatsapp?: string; // WhatsApp para contato e venda de escalas
  pixKey?: string; // Chave PIX cadastrada para recebimento/repasses
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'; // Tipo de chave PIX
  color: string;
  pin?: string; // Collaborator personal 4-digit PIN for private schedule access
  badgeColor?: {
    bg: string;
    text: string;
    border: string;
  };
  maxMonthlyHours: number;
  baseSalaryOrFee?: number; // Valor base (prestação de serviço ou honorários)
  bonusAmount?: number; // Valor do bônus
  bonusFrequencyMonths?: number; // 1 = mensal, 3 = trimestral, 6 = semestral, 12 = anual
  deductionMode?: 'fixed_value' | 'percentage_of_bonus'; // Descontar em valor fixo ou % do bônus
  deductionPerMinuteLate?: number; // Desconto por minuto de atraso (R$ ou %)
  deductionPerAbsence?: number; // Desconto por falta injustificada (R$ ou %)
  status: 'active' | 'vacation' | 'inactive';
}

export type ShiftSaleStatus = 'available' | 'sold' | 'cancelled';

export interface ShiftSaleOffer {
  id: string;
  shiftAssignmentId: string;
  providerId: string; // Vendedor do plantão
  providerName: string;
  date: string; // "YYYY-MM-DD"
  price: number; // Valor que o anunciante vai pagar para quem assumir (ex: 1200)
  note?: string; // Observação do plantão
  sellerWhatsapp?: string; // WhatsApp de contato do vendedor
  status: ShiftSaleStatus;
  buyerProviderId?: string; // Quem comprou/assumiu o plantão
  buyerProviderName?: string;
  createdAt: string;
  soldAt?: string;
}

export interface ShiftType {
  id: string;
  name: string;
  code: string; // D12, N12, M6, T6, C8, P24, etc.
  startTime: string; // "07:00"
  endTime: string; // "19:00"
  durationHours: number;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface ShiftAssignment {
  id: string;
  date: string; // "YYYY-MM-DD"
  shiftTypeId: string;
  departmentId: string;
  providerId: string | null; // null means open/unassigned spot
  status: ShiftStatus;
  workModality?: WorkModality; // 'presencial' (default, don't show) or 'home_office' (shows HO)
  notes?: string;
  acknowledgedByProvider?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type SwapStatus = 'pending_supervisor' | 'approved' | 'rejected';

export interface SwapRequest {
  id: string;
  requesterProviderId: string;
  targetProviderId: string;
  requesterDate: string; // "YYYY-MM-DD"
  targetDate?: string; // "YYYY-MM-DD"
  requesterShiftId: string;
  targetShiftId?: string; // Optional if direct shift-to-shift swap or giving shift away
  reason: string;
  status: SwapStatus;
  createdAt: string;
  reviewedAt?: string;
}

export type ScheduleRequestType = 'day_off' | 'extra_shift';
export type ScheduleRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ScheduleRequest {
  id: string;
  providerId: string;
  type: ScheduleRequestType;
  date: string; // "YYYY-MM-DD"
  reason: string;
  status: ScheduleRequestStatus;
  createdAt: string;
  reviewedAt?: string;
}

export type IncidentType = 'atraso' | 'falta_justificada' | 'falta_injustificada' | 'saida_antecipada' | 'hora_extra' | 'atestado_medico' | 'observacao';

export interface AttendanceIncident {
  id: string;
  providerId: string;
  date: string; // "YYYY-MM-DD"
  type: IncidentType;
  durationMinutes?: number; // e.g. 30 (minutos de atraso) or 120 (minutos de hora extra)
  certificateNumber?: string; // CID ou Nº do atestado
  reason: string;
  registeredByRole: 'supervisor' | 'provider';
  status: 'registrado' | 'abonado' | 'descontado';
  createdAt: string;
}

export type ViewMode = 'escala' | 'personal-calendar' | 'calendar' | 'matrix' | 'week' | 'agenda' | 'my-schedule';
export type UserRole = 'supervisor' | 'provider';
export type ActiveModule = 'escala' | 'prestadores_regional' | 'pontos_fixos' | 'templates_whatsapp';

