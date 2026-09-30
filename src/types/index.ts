export type ShiftStatus = 'confirmed' | 'pending' | 'swapped' | 'absent';

export interface Provider {
  id: string;
  name: string;
  role: string; // e.g., "Prestador", "Enfermeiro", etc.
  entryTime?: string; // e.g., "07h00"
  exitTime?: string; // e.g., "19h00"
  email: string;
  phone: string;
  color: string;
  pin?: string; // Collaborator personal 4-digit PIN for private schedule access
  badgeColor?: {
    bg: string;
    text: string;
    border: string;
  };
  maxMonthlyHours: number;
  status: 'active' | 'vacation' | 'inactive';
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

export type ViewMode = 'escala' | 'personal-calendar' | 'calendar' | 'matrix' | 'week' | 'agenda' | 'my-schedule';
export type UserRole = 'supervisor' | 'provider';
