import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Department,
  Provider,
  ShiftAssignment,
  ShiftType,
  SwapRequest,
  ScheduleRequest,
  ScheduleRequestType,
  UserRole,
  ViewMode,
  WorkRegime,
  WorkModality,
  AbsenceType,
  TeamGroup,
  AttendanceIncident,
  ShiftSaleOffer,
  ShiftSaleStatus,
  WeekendColumn,
  ActiveModule,
} from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_PROVIDERS,
  INITIAL_SHIFT_TYPES,
  generateInitialAssignments
} from '../data/initialData';
import {
  INITIAL_WEEKEND_COLUMNS,
  INITIAL_WEEKEND_ASSIGNMENTS,
} from '../data/weekendData';
import { formatDateToISO } from '../utils/dateUtils';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface FilterState {
  departmentId: string;
  providerId: string;
  shiftTypeId: string;
  onlyOpenSpots: boolean;
  searchQuery: string;
}

interface ConflictResult {
  hasConflict: boolean;
  reasons: string[];
}

interface AutoScheduleParams {
  year: number;
  monthIndex: number;
  pattern: '12x36' | 'rotate' | 'random';
  teamAProviderIds: string[];
  teamBProviderIds: string[];
  departmentIds: string[];
  shiftTypeId: string;
}

interface ScheduleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeProviderId: string | null;
  setActiveProviderId: (id: string | null) => void;
  currentYear: number;
  currentMonthIndex: number;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  setMonthYear: (month: number, year: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeRegime: WorkRegime;
  setActiveRegime: (regime: WorkRegime) => void;
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  // Leader PIN & Auth
  isLeaderAuthenticated: boolean;
  leaderPin: string;
  leaderName: string | null;
  authenticateLeader: (name: string, pin: string) => boolean;
  logoutLeader: () => void;
  changeLeaderPin: (newPin: string) => Promise<boolean>;

  // Collaborator PIN & Auth
  authenticatedProviderId: string | null;
  authenticateProvider: (providerId: string, pin?: string) => boolean;
  setupProviderPin: (providerId: string, pin: string) => Promise<boolean>;
  resetProviderPin: (providerId: string) => Promise<boolean>;
  logoutProvider: () => void;

  // Data & Metadata
  isSyncing: boolean;
  lastUpdatedAt: string;
  lastUpdatedBy: string | null;
  providers: Provider[];
  shiftTypes: ShiftType[];
  departments: Department[];
  assignments: ShiftAssignment[];
  swapRequests: SwapRequest[];
  scheduleRequests: ScheduleRequest[];
  attendanceIncidents: AttendanceIncident[];
  shiftSaleOffers: ShiftSaleOffer[];
  isPublished: boolean;
  setIsPublished: (published: boolean) => void;
  publishedMonths: Record<string, boolean>;
  isMonthPublished: (year: number, monthIndex: number) => boolean;
  toggleMonthPublishStatus: (year: number, monthIndex: number) => void;

  // Announcements / Bulletin Board
  announcements: Array<{
    id: string;
    title: string;
    message: string;
    priority: 'normal' | 'urgent';
    authorName: string;
    createdAt: string;
  }>;
  addAnnouncement: (data: { title: string; message: string; priority: 'normal' | 'urgent'; authorName: string }) => void;
  deleteAnnouncement: (id: string) => void;

  // Venda & Compra de Escala (Marketplace de Plantões)
  createShiftSaleOffer: (data: {
    shiftAssignmentId: string;
    providerId: string;
    date: string;
    price: number;
    note?: string;
    sellerWhatsapp?: string;
  }) => string;
  buyShiftSaleOffer: (offerId: string, buyerProviderId: string) => Promise<boolean>;
  cancelShiftSaleOffer: (offerId: string) => void;
  updateProviderWhatsapp: (providerId: string, whatsapp: string) => Promise<void>;

  // Weekend Schedule View
  weekendColumns: WeekendColumn[];
  weekendAssignments: Record<string, Record<string, string>>;
  addWeekendColumn: (name: string) => void;
  renameWeekendColumn: (columnId: string, newName: string) => void;
  deleteWeekendColumn: (columnId: string) => void;
  updateWeekendCell: (dateStr: string, columnId: string, value: string) => void;
  clearWeekendCell: (dateStr: string, columnId: string) => void;
  clonePreviousMonthWeekendSchedule: (targetYear: number, targetMonthIndex: number) => number;

  // Actions
  addAssignment: (data: Omit<ShiftAssignment, 'id' | 'createdAt'>) => string;
  updateAssignment: (id: string, updates: Partial<ShiftAssignment>) => void;
  deleteAssignment: (id: string) => void;
  addProvider: (data: Omit<Provider, 'id'>) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;
  toggleWorkModality: (providerId: string, date: string) => void;

  // Incidents (Atrasos, Faltas, Atestados)
  addAttendanceIncident: (data: Omit<AttendanceIncident, 'id' | 'createdAt'>) => string;
  updateAttendanceIncident: (id: string, updates: Partial<AttendanceIncident>) => void;
  deleteAttendanceIncident: (id: string) => void;

  // Swap requests
  requestSwap: (data: {
    requesterShiftId: string;
    requesterDate: string;
    targetProviderId: string;
    targetDate?: string;
    targetShiftId?: string;
    reason: string;
  }) => void;
  approveSwap: (swapId: string) => void;
  rejectSwap: (swapId: string) => void;
  directSwap: (data: {
    providerAId: string;
    providerBId: string;
    dateA: string;
    dateB?: string;
    reason?: string;
  }) => void;

  // Schedule future requests (folga / extra)
  addScheduleRequest: (data: {
    providerId: string;
    type: ScheduleRequestType;
    date: string;
    reason: string;
  }) => void;
  approveScheduleRequest: (requestId: string) => void;
  rejectScheduleRequest: (requestId: string) => void;

  toggleAcknowledgeShift: (shiftId: string) => void;
  acknowledgeAllMonthlyShifts: (providerId: string, year: number, monthIndex: number) => void;
  checkShiftConflicts: (providerId: string | null, date: string, shiftTypeId: string, ignoreShiftId?: string) => ConflictResult;
  autoGenerateSchedule: (params: AutoScheduleParams) => number;
  clonePreviousMonthSchedule: (targetYear: number, targetMonthIndex: number, mode: 'continue_12x36' | 'exact') => number;
  batchFillProviderMonth: (providerId: string, year: number, monthIndex: number, pattern: 'odd_12x36' | 'even_12x36' | 'mon_to_fri_5x2' | 'mon_wed_fri' | 'tue_thu_sat' | 'clear') => number;
  applyTeamGroupsSchedule: (year: number, monthIndex: number) => number;
  applyAbsenceRange: (data: {
    providerId: string;
    startDate: string;
    endDate: string;
    type: AbsenceType;
    notes?: string;
  }) => number;
  batchAddProviders: (providersList: Array<Omit<Provider, 'id'>>) => number;
  clearMonthAssignments: (year: number, monthIndex: number) => void;
  resetToDemoData: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ROLE: 'escalapro_role_oct2026_v1',
  ACTIVE_PROVIDER: 'escalapro_active_provider_oct2026_v1',
  PROVIDERS: 'escalapro_providers_oct2026_v1',
  DEPARTMENTS: 'escalapro_departments_oct2026_v1',
  SHIFT_TYPES: 'escalapro_shift_types_oct2026_v1',
  ASSIGNMENTS: 'escalapro_assignments_oct2026_v1',
  SWAPS: 'escalapro_swaps_oct2026_v1',
  REQUESTS: 'escalapro_requests_oct2026_v1',
  INCIDENTS: 'escalapro_incidents_oct2026_v1',
  PUBLISHED: 'escalapro_published_oct2026_v1',
  PUBLISHED_MONTHS: 'escalapro_published_months_oct2026_v1',
  LEADER_AUTH: 'escalapro_leader_authenticated_oct2026_v1',
  LEADER_PIN: 'escalapro_leader_pin_oct2026_v1',
  LEADER_NAME: 'escalapro_leader_name_oct2026_v1',
  AUTH_PROVIDER: 'escalapro_auth_provider_oct2026_v1',
  LAST_UPDATED: 'escalapro_last_updated_oct2026_v1',
  LAST_UPDATED_BY: 'escalapro_last_updated_by_oct2026_v1',
  REGIME: 'escalapro_regime_oct2026_v1',
  SHIFT_SALES: 'escalapro_shift_sales_oct2026_v1',
  WEEKEND_COLUMNS: 'escalapro_weekend_columns_v1',
  WEEKEND_ASSIGNMENTS: 'escalapro_weekend_assignments_v1',
};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const today = new Date();
  // Default starting calendar view to October 2026
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(9); // 9 is October (0-indexed)
  const [viewMode, setViewMode] = useState<ViewMode>('escala');

  // Regime: 12x36 or 5x2
  const [activeRegime, setActiveRegimeState] = useState<WorkRegime>(() => {
    return (localStorage.getItem(STORAGE_KEYS.REGIME) as WorkRegime) || '12x36';
  });

  const setActiveRegime = (regime: WorkRegime) => {
    setActiveRegimeState(regime);
    localStorage.setItem(STORAGE_KEYS.REGIME, regime);
  };

  // Active top-level operational module
  const [activeModule, setActiveModuleState] = useState<ActiveModule>(() => {
    try {
      const saved = localStorage.getItem('escalapro_active_module');
      if (saved && ['escala', 'prestadores_regional', 'pontos_fixos', 'templates_whatsapp'].includes(saved)) {
        return saved as ActiveModule;
      }
    } catch (_) {}
    return 'escala';
  });

  const setActiveModule = (mod: ActiveModule) => {
    setActiveModuleState(mod);
    try {
      localStorage.setItem('escalapro_active_module', mod);
    } catch (_) {}
  };

  // Role: supervisor or provider
  const [role, setRoleState] = useState<UserRole>('provider');
  const [isLeaderAuthenticated, setIsLeaderAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(STORAGE_KEYS.LEADER_AUTH) === 'true';
  });

  const [leaderPin, setLeaderPin] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LEADER_PIN) || '1234';
  });

  const [leaderName, setLeaderName] = useState<string | null>(() => {
    return sessionStorage.getItem(STORAGE_KEYS.LEADER_NAME) || localStorage.getItem(STORAGE_KEYS.LEADER_NAME) || null;
  });

  // Authenticated collaborator session (if not leader) - persistent in localStorage
  const [authenticatedProviderId, setAuthenticatedProviderId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_PROVIDER) || sessionStorage.getItem(STORAGE_KEYS.AUTH_PROVIDER) || null;
  });

  const [activeProviderId, setActiveProviderIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_PROVIDER) || localStorage.getItem(STORAGE_KEYS.ACTIVE_PROVIDER) || null;
  });
  const [isPublished, setIsPublishedState] = useState<boolean>(true);
  const [publishedMonths, setPublishedMonths] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PUBLISHED_MONTHS);
      return saved ? JSON.parse(saved) : { '2026-10': true };
    } catch {
      return { '2026-10': true };
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_UPDATED) || new Date().toISOString();
  });
  const [lastUpdatedBy, setLastUpdatedByState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_UPDATED_BY) || null;
  });

  const [filters, setFilters] = useState<FilterState>({
    departmentId: 'all',
    providerId: 'all',
    shiftTypeId: 'all',
    onlyOpenSpots: false,
    searchQuery: '',
  });

  const [providers, setProviders] = useState<Provider[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROVIDERS);
      return saved ? JSON.parse(saved) : INITIAL_PROVIDERS;
    } catch {
      return INITIAL_PROVIDERS;
    }
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  });

  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFT_TYPES);
      return saved ? JSON.parse(saved) : INITIAL_SHIFT_TYPES;
    } catch {
      return INITIAL_SHIFT_TYPES;
    }
  });

  const [assignments, setAssignments] = useState<ShiftAssignment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      let parsed = saved ? JSON.parse(saved) : [];
      // Remove September and stale November assignments so exact image data is always loaded
      parsed = parsed.filter((a: ShiftAssignment) => a.date && !a.date.startsWith('2026-09-') && !a.date.startsWith('2026-11-'));
      const seed = generateInitialAssignments();
      const novSeed = seed.filter(s => s.date.startsWith('2026-11-'));
      const hasOctober = parsed.some((a: ShiftAssignment) => a.date && a.date.startsWith('2026-10-'));
      const octSeed = hasOctober ? [] : seed.filter(s => s.date.startsWith('2026-10-'));
      
      const merged = [...parsed, ...octSeed, ...novSeed];
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(merged));
      return merged;
    } catch {
      return generateInitialAssignments();
    }
  });

  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SWAPS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [scheduleRequests, setScheduleRequests] = useState<ScheduleRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [attendanceIncidents, setAttendanceIncidents] = useState<AttendanceIncident[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'inc-1',
          providerId: 'prov-2',
          date: '2026-10-08',
          type: 'atestado_medico',
          certificateNumber: 'CRM-18920 / CID J06',
          reason: 'Atestado Médico (2 dias - sintomas gripais)',
          registeredByRole: 'supervisor',
          status: 'abonado',
          createdAt: '2026-10-08T08:30:00Z',
        },
        {
          id: 'inc-2',
          providerId: 'prov-1',
          date: '2026-10-02',
          type: 'atraso',
          durationMinutes: 25,
          reason: 'Atraso de 25 min devido a retenção no trânsito',
          registeredByRole: 'supervisor',
          status: 'registrado',
          createdAt: '2026-10-02T07:25:00Z',
        },
        {
          id: 'inc-3',
          providerId: 'prov-3',
          date: '2026-10-14',
          type: 'hora_extra',
          durationMinutes: 120,
          reason: 'Cobertura de emergência no setor (+2 horas extras)',
          registeredByRole: 'supervisor',
          status: 'registrado',
          createdAt: '2026-10-14T21:00:00Z',
        },
      ];
    } catch {
      return [];
    }
  });

  const [shiftSaleOffers, setShiftSaleOffers] = useState<ShiftSaleOffer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFT_SALES);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out initial mock sale-1
        return parsed.filter((o: ShiftSaleOffer) => o.id !== 'sale-1');
      }
      return [];
    } catch {
      return [];
    }
  });

  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    title: string;
    message: string;
    priority: 'normal' | 'urgent';
    authorName: string;
    createdAt: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('escalapro_announcements_v1');
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'ann-1',
          title: 'Bem-vindo ao Sistema OminiHub',
          message: 'Novo painel unificado de plantões, trocas, repasses PJ e mural de avisos ativo para todos os prestadores.',
          priority: 'normal',
          authorName: 'Liderança',
          createdAt: new Date().toISOString(),
        }
      ];
    } catch {
      return [];
    }
  });

  const addAnnouncement = (data: { title: string; message: string; priority: 'normal' | 'urgent'; authorName: string }) => {
    const newItem = {
      id: `ann-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('escalapro_announcements_v1', JSON.stringify(updated));
    syncToFirebase({ announcements: updated } as any);
  };

  const deleteAnnouncement = (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    localStorage.setItem('escalapro_announcements_v1', JSON.stringify(updated));
    syncToFirebase({ announcements: updated } as any);
  };

  // Weekend Schedule View State & Actions
  const [weekendColumns, setWeekendColumns] = useState<WeekendColumn[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEEKEND_COLUMNS);
      return saved ? JSON.parse(saved) : INITIAL_WEEKEND_COLUMNS;
    } catch {
      return INITIAL_WEEKEND_COLUMNS;
    }
  });

  const [weekendAssignments, setWeekendAssignments] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEEKEND_ASSIGNMENTS);
      return saved ? JSON.parse(saved) : INITIAL_WEEKEND_ASSIGNMENTS;
    } catch {
      return INITIAL_WEEKEND_ASSIGNMENTS;
    }
  });

  const addWeekendColumn = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newCol: WeekendColumn = {
      id: `col-${Date.now()}`,
      name: trimmed,
    };
    const updated = [...weekendColumns, newCol];
    setWeekendColumns(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.WEEKEND_COLUMNS, JSON.stringify(updated));
    } catch (_) {}
    syncToFirebase({ weekendColumns: updated } as any);
  };

  const renameWeekendColumn = (columnId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = weekendColumns.map(col => col.id === columnId ? { ...col, name: trimmed } : col);
    setWeekendColumns(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.WEEKEND_COLUMNS, JSON.stringify(updated));
    } catch (_) {}
    syncToFirebase({ weekendColumns: updated } as any);
  };

  const deleteWeekendColumn = (columnId: string) => {
    const updated = weekendColumns.filter(col => col.id !== columnId);
    setWeekendColumns(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.WEEKEND_COLUMNS, JSON.stringify(updated));
    } catch (_) {}
    syncToFirebase({ weekendColumns: updated } as any);
  };

  const updateWeekendCell = (dateStr: string, columnId: string, value: string) => {
    setWeekendAssignments(prev => {
      const daySlots = { ...(prev[dateStr] || {}) };
      if (!value || value.trim() === '') {
        delete daySlots[columnId];
      } else {
        daySlots[columnId] = value.trim();
      }
      const updated = { ...prev, [dateStr]: daySlots };
      try {
        localStorage.setItem(STORAGE_KEYS.WEEKEND_ASSIGNMENTS, JSON.stringify(updated));
      } catch (_) {}
      syncToFirebase({ weekendAssignments: updated } as any);
      return updated;
    });
  };

  const clearWeekendCell = (dateStr: string, columnId: string) => {
    updateWeekendCell(dateStr, columnId, '');
  };

  const clonePreviousMonthWeekendSchedule = (targetYear: number, targetMonthIndex: number): number => {
    let prevYear = targetYear;
    let prevMonthIndex = targetMonthIndex - 1;
    if (prevMonthIndex < 0) {
      prevMonthIndex = 11;
      prevYear--;
    }

    // Collect weekend dates for previous month
    const prevDaysInMonth = new Date(prevYear, prevMonthIndex + 1, 0).getDate();
    const prevWeekendDates: string[] = [];
    for (let d = 1; d <= prevDaysInMonth; d++) {
      const dayOfWeek = new Date(prevYear, prevMonthIndex, d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        prevWeekendDates.push(`${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      }
    }

    // Collect weekend dates for target month
    const targetDaysInMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
    const targetWeekendDates: string[] = [];
    for (let d = 1; d <= targetDaysInMonth; d++) {
      const dayOfWeek = new Date(targetYear, targetMonthIndex, d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        targetWeekendDates.push(`${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      }
    }

    if (targetWeekendDates.length === 0) return 0;

    let appliedCount = 0;
    const updatedAssignments = { ...weekendAssignments };

    targetWeekendDates.forEach((targetDateStr, idx) => {
      if (prevWeekendDates.length > 0) {
        const sourceDateStr = prevWeekendDates[idx % prevWeekendDates.length];
        const sourceDayAssignments = weekendAssignments[sourceDateStr];

        if (sourceDayAssignments && Object.keys(sourceDayAssignments).length > 0) {
          updatedAssignments[targetDateStr] = { ...sourceDayAssignments };
          appliedCount += Object.keys(sourceDayAssignments).length;
        }
      }
    });

    setWeekendAssignments(updatedAssignments);
    try {
      localStorage.setItem(STORAGE_KEYS.WEEKEND_ASSIGNMENTS, JSON.stringify(updatedAssignments));
    } catch (_) {}
    syncToFirebase({ weekendAssignments: updatedAssignments });

    return appliedCount;
  };

  // Sync role with leader authentication
  useEffect(() => {
    if (isLeaderAuthenticated) {
      setRoleState('supervisor');
    } else {
      setRoleState('provider');
    }
  }, [isLeaderAuthenticated]);

  // Immediate mount synchronization to guarantee clean September and clean notes
  useEffect(() => {
    const seed = generateInitialAssignments();
    setAssignments(current => {
      let clean = current
        .filter(a => a.date && !a.date.startsWith('2026-09-'))
        .map(a => {
          // Remove default mock note text so cells are completely clean
          if (a.notes === 'Cobertura especial confirmada') {
            const { notes, ...rest } = a;
            return rest as ShiftAssignment;
          }
          return a;
        });

      const novSeed = seed.filter(s => s.date.startsWith('2026-11-'));
      clean = clean.filter(a => a.date && !a.date.startsWith('2026-11-'));
      const hasOct = clean.some(a => a.date && a.date.startsWith('2026-10-'));
      const octSeed = hasOct ? [] : seed.filter(s => s.date.startsWith('2026-10-'));
      const finalAssignments = [...clean, ...octSeed, ...novSeed];
      
      try {
        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(finalAssignments));
      } catch (_) {}

      return finalAssignments;
    });
  }, []);

  // Real-time Firebase Listener
  useEffect(() => {
    const scheduleDocRef = doc(db, 'schedule_store', 'main');
    setIsSyncing(true);

    const unsubscribe = onSnapshot(
      scheduleDocRef,
      (docSnap) => {
        setIsSyncing(false);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.providers && Array.isArray(data.providers)) {
            setProviders(data.providers);
            localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(data.providers));
          }
          if (data.assignments && Array.isArray(data.assignments)) {
            let loadedAssignments = data.assignments.filter((a: any) => a.date && !a.date.startsWith('2026-09-') && !a.date.startsWith('2026-11-'));
            const seedAssignments = generateInitialAssignments();
            const novSeed = seedAssignments.filter(a => a.date && a.date.startsWith('2026-11-'));
            const hasOctober = loadedAssignments.some((a: any) => a.date && a.date.startsWith('2026-10-'));
            const octSeed = hasOctober ? [] : seedAssignments.filter(a => a.date && a.date.startsWith('2026-10-'));
            
            loadedAssignments = [...loadedAssignments, ...octSeed, ...novSeed];
            
            setAssignments(loadedAssignments);
            localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(loadedAssignments));
          }
          if (data.swapRequests && Array.isArray(data.swapRequests)) {
            setSwapRequests(data.swapRequests);
            localStorage.setItem(STORAGE_KEYS.SWAPS, JSON.stringify(data.swapRequests));
          }
          if (data.scheduleRequests && Array.isArray(data.scheduleRequests)) {
            setScheduleRequests(data.scheduleRequests);
            localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(data.scheduleRequests));
          }
          if (data.attendanceIncidents && Array.isArray(data.attendanceIncidents)) {
            setAttendanceIncidents(data.attendanceIncidents);
            localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(data.attendanceIncidents));
          }
          if (data.shiftSaleOffers && Array.isArray(data.shiftSaleOffers)) {
            const cleanSales = data.shiftSaleOffers.filter((o: any) => o.id !== 'sale-1');
            setShiftSaleOffers(cleanSales);
            localStorage.setItem(STORAGE_KEYS.SHIFT_SALES, JSON.stringify(cleanSales));
          }
          if (data.publishedMonths && typeof data.publishedMonths === 'object') {
            setPublishedMonths(data.publishedMonths);
            localStorage.setItem(STORAGE_KEYS.PUBLISHED_MONTHS, JSON.stringify(data.publishedMonths));
          }
          if (data.leaderPin) {
            setLeaderPin(data.leaderPin);
            localStorage.setItem(STORAGE_KEYS.LEADER_PIN, data.leaderPin);
          }
          if (data.weekendColumns && Array.isArray(data.weekendColumns)) {
            setWeekendColumns(data.weekendColumns);
            try {
              localStorage.setItem(STORAGE_KEYS.WEEKEND_COLUMNS, JSON.stringify(data.weekendColumns));
            } catch (_) {}
          }
          if (data.weekendAssignments && typeof data.weekendAssignments === 'object') {
            setWeekendAssignments(data.weekendAssignments);
            try {
              localStorage.setItem(STORAGE_KEYS.WEEKEND_ASSIGNMENTS, JSON.stringify(data.weekendAssignments));
            } catch (_) {}
          }
          if (data.updatedAt) {
            setLastUpdatedAt(data.updatedAt);
            localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, data.updatedAt);
          }
          if (data.lastUpdatedBy) {
            setLastUpdatedByState(data.lastUpdatedBy);
            localStorage.setItem(STORAGE_KEYS.LAST_UPDATED_BY, data.lastUpdatedBy);
          }
        } else {
          // Document does not exist yet: seed Firebase
          const nowStr = new Date().toISOString();
          const initialData = {
            providers: INITIAL_PROVIDERS,
            assignments: generateInitialAssignments(),
            swapRequests: [],
            scheduleRequests: [],
            leaderPin: '1234',
            updatedAt: nowStr,
            lastUpdatedBy: 'Sistema'
          };
          setDoc(scheduleDocRef, initialData).catch(err => {
            console.error('Error seeding Firebase:', err);
          });
          setLastUpdatedAt(nowStr);
          setLastUpdatedByState('Sistema');
        }
      },
      (error) => {
        console.warn('Firebase sync warning (offline or initializing):', error);
        setIsSyncing(false);
      }
    );

    return () => unsubscribe();
  }, []);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
    },
    operationType,
    path
  };
  const errorJson = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorJson);
  throw new Error(errorJson);
}

  // Helper to push updates to Firebase
  const syncToFirebase = async (updates: {
    providers?: Provider[];
    assignments?: ShiftAssignment[];
    swapRequests?: SwapRequest[];
    scheduleRequests?: ScheduleRequest[];
    attendanceIncidents?: AttendanceIncident[];
    shiftSaleOffers?: ShiftSaleOffer[];
    leaderPin?: string;
    publishedMonths?: Record<string, boolean>;
    weekendColumns?: WeekendColumn[];
    weekendAssignments?: Record<string, Record<string, string>>;
  }): Promise<boolean> => {
    try {
      const scheduleDocRef = doc(db, 'schedule_store', 'main');
      const nowStr = new Date().toISOString();
      const activeLeader = sessionStorage.getItem(STORAGE_KEYS.LEADER_NAME) || localStorage.getItem(STORAGE_KEYS.LEADER_NAME) || 'Líder';
      const payload: Record<string, any> = {
        updatedAt: nowStr,
        lastUpdatedBy: activeLeader,
        ...updates
      };
      setLastUpdatedAt(nowStr);
      setLastUpdatedByState(activeLeader);
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, nowStr);
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED_BY, activeLeader);
      await setDoc(scheduleDocRef, payload, { merge: true });
      return true;
    } catch (e: any) {
      const errStr = String(e?.message || e);
      if (errStr.includes('resource-exhausted') || errStr.includes('Quota') || errStr.includes('quota')) {
        console.warn('Firestore quota limit reached. Running locally in offline storage mode.');
        return false;
      }
      console.error('Failed to sync to Firebase:', e);
      handleFirestoreError(e, OperationType.WRITE, 'schedule_store/main');
      return false;
    }
  };

  // Local storage save backups
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SWAPS, JSON.stringify(swapRequests));
  }, [swapRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(scheduleRequests));
  }, [scheduleRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFT_SALES, JSON.stringify(shiftSaleOffers));
  }, [shiftSaleOffers]);

  // Leader Authentication Methods
  const authenticateLeader = (name: string, pin: string): boolean => {
    const cleanPin = pin.trim();
    const cleanName = name.trim();
    if (!cleanPin || !cleanName) return false;

    // 1. Check if any provider matches this name (case-insensitive) and has a personal PIN matching cleanPin
    const matchingProv = providers.find(
      p => p.name.toLowerCase() === cleanName.toLowerCase() && p.pin && p.pin.trim() === cleanPin
    );

    if (matchingProv) {
      setIsLeaderAuthenticated(true);
      setRoleState('supervisor');
      setLeaderName(matchingProv.name);
      setAuthenticatedProviderId(matchingProv.id);
      setActiveProviderIdState(matchingProv.id);
      localStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, matchingProv.id);
      sessionStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, matchingProv.id);
      sessionStorage.setItem(STORAGE_KEYS.LEADER_AUTH, 'true');
      sessionStorage.setItem(STORAGE_KEYS.LEADER_NAME, matchingProv.name);
      localStorage.setItem(STORAGE_KEYS.LEADER_NAME, matchingProv.name);
      return true;
    }

    // 2. Master Leader PIN check (exact match only - prevents arbitrary 4+ digit bypass)
    if (cleanPin === leaderPin.trim()) {
      setIsLeaderAuthenticated(true);
      setRoleState('supervisor');
      setLeaderName(cleanName);

      // Match provider by name if available
      let nameMatch = providers.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
      if (!nameMatch) {
        nameMatch = providers.find(p => p.name.toLowerCase().includes(cleanName.toLowerCase()));
      }

      if (nameMatch) {
        setAuthenticatedProviderId(nameMatch.id);
        setActiveProviderIdState(nameMatch.id);
        localStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, nameMatch.id);
        sessionStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, nameMatch.id);
      } else {
        // Create new provider record for this new gestor name
        const newLeaderProv: Provider = {
          id: `prov-leader-${Date.now()}`,
          name: cleanName,
          role: 'Gestor da Escala',
          email: `${cleanName.toLowerCase().replace(/\s+/g, '')}@escalapro.com`,
          phone: '',
          color: '#00d2d3',
          status: 'active',
          maxMonthlyHours: 160,
          pin: cleanPin,
        };
        const updatedProviders = [...providers, newLeaderProv];
        setProviders(updatedProviders);
        localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updatedProviders));
        syncToFirebase({ providers: updatedProviders });

        setAuthenticatedProviderId(newLeaderProv.id);
        setActiveProviderIdState(newLeaderProv.id);
        localStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, newLeaderProv.id);
        sessionStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, newLeaderProv.id);
      }

      sessionStorage.setItem(STORAGE_KEYS.LEADER_AUTH, 'true');
      sessionStorage.setItem(STORAGE_KEYS.LEADER_NAME, cleanName);
      localStorage.setItem(STORAGE_KEYS.LEADER_NAME, cleanName);
      return true;
    }

    return false;
  };

  const logoutLeader = () => {
    setIsLeaderAuthenticated(false);
    setRoleState('provider');
    setLeaderName(null);
    sessionStorage.removeItem(STORAGE_KEYS.LEADER_AUTH);
    sessionStorage.removeItem(STORAGE_KEYS.LEADER_NAME);
    localStorage.removeItem(STORAGE_KEYS.LEADER_NAME);
  };

  const changeLeaderPin = async (newPin: string): Promise<boolean> => {
    if (!newPin || newPin.trim().length < 4) return false;
    const cleanPin = newPin.trim();
    setLeaderPin(cleanPin);
    localStorage.setItem(STORAGE_KEYS.LEADER_PIN, cleanPin);
    try {
      const ok = await syncToFirebase({ leaderPin: cleanPin });
      return ok;
    } catch (e) {
      console.error('Error changing leader pin:', e);
      return false;
    }
  };

  // Collaborator Authentication & PIN Methods (Hybrid Model)
  const authenticateProvider = (providerId: string, enteredPin?: string): boolean => {
    const prov = providers.find(p => p.id === providerId);
    if (!prov) return false;

    // If provider already has a PIN configured, it must match
    if (prov.pin) {
      if (!enteredPin || enteredPin.trim() !== prov.pin.trim()) {
        return false;
      }
    }

    setAuthenticatedProviderId(providerId);
    setActiveProviderIdState(providerId);
    localStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, providerId);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, providerId);
    return true;
  };

  const setupProviderPin = async (providerId: string, newPin: string): Promise<boolean> => {
    if (!newPin || newPin.trim().length !== 4) return false;
    const cleanPin = newPin.trim();

    const updatedProviders = providers.map(p => {
      if (p.id === providerId) {
        return { ...p, pin: cleanPin };
      }
      return p;
    });

    setProviders(updatedProviders);
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updatedProviders));

    setAuthenticatedProviderId(providerId);
    setActiveProviderIdState(providerId);
    localStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, providerId);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, providerId);

    try {
      await syncToFirebase({ providers: updatedProviders });
    } catch (e) {
      console.warn('Sync to Firebase failed, locally saved:', e);
    }
    return true;
  };

  const resetProviderPin = async (providerId: string): Promise<boolean> => {
    const updatedProviders = providers.map(p => {
      if (p.id === providerId) {
        const copy = { ...p };
        delete copy.pin;
        return copy;
      }
      return p;
    });

    setProviders(updatedProviders);
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updatedProviders));

    if (authenticatedProviderId === providerId) {
      setAuthenticatedProviderId(null);
      localStorage.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
    }

    try {
      await syncToFirebase({ providers: updatedProviders });
    } catch (e) {
      console.warn('Sync to Firebase failed, locally saved:', e);
    }
    return true;
  };

  const logoutProvider = () => {
    setAuthenticatedProviderId(null);
    setActiveProviderIdState(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROVIDER);
  };

  const updateProviderWhatsapp = async (providerId: string, whatsapp: string): Promise<void> => {
    const cleanPhone = whatsapp.trim();
    const updated = providers.map(p => {
      if (p.id === providerId) {
        return { ...p, whatsapp: cleanPhone, phone: cleanPhone };
      }
      return p;
    });
    setProviders(updated);
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updated));
    await syncToFirebase({ providers: updated });
  };

  const createShiftSaleOffer = (data: {
    shiftAssignmentId: string;
    providerId: string;
    date: string;
    price: number;
    note?: string;
    sellerWhatsapp?: string;
  }): string => {
    const seller = providers.find(p => p.id === data.providerId);
    const newOffer: ShiftSaleOffer = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shiftAssignmentId: data.shiftAssignmentId,
      providerId: data.providerId,
      providerName: seller ? seller.name : 'Prestador',
      date: data.date,
      price: data.price,
      note: data.note,
      sellerWhatsapp: data.sellerWhatsapp || seller?.whatsapp,
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    const updated = [newOffer, ...shiftSaleOffers];
    setShiftSaleOffers(updated);
    localStorage.setItem(STORAGE_KEYS.SHIFT_SALES, JSON.stringify(updated));

    if (data.sellerWhatsapp && seller && (!seller.whatsapp || seller.whatsapp !== data.sellerWhatsapp)) {
      updateProviderWhatsapp(data.providerId, data.sellerWhatsapp);
    }

    syncToFirebase({ shiftSaleOffers: updated });
    return newOffer.id;
  };

  const buyShiftSaleOffer = async (offerId: string, buyerProviderId: string): Promise<boolean> => {
    const offer = shiftSaleOffers.find(o => o.id === offerId);
    if (!offer || offer.status !== 'available') return false;

    const buyer = providers.find(p => p.id === buyerProviderId);
    if (!buyer) return false;

    // 1. Mark offer as sold
    const updatedOffers: ShiftSaleOffer[] = shiftSaleOffers.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          status: 'sold' as ShiftSaleStatus,
          buyerProviderId,
          buyerProviderName: buyer.name,
          soldAt: new Date().toISOString(),
        };
      }
      return o;
    });

    // 2. Transfer the assignment to the buyer
    let assignmentFound = false;
    const formattedPrice = offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const updatedAssignments = assignments.map(a => {
      if (a.id === offer.shiftAssignmentId || (a.providerId === offer.providerId && a.date === offer.date)) {
        assignmentFound = true;
        return {
          ...a,
          providerId: buyerProviderId,
          notes: `Plantão adquirido de ${offer.providerName} (R$ ${formattedPrice})`,
          workModality: (a.workModality || 'presencial') as WorkModality,
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    });

    let finalAssignments = updatedAssignments;
    if (!assignmentFound) {
      finalAssignments = [
        ...updatedAssignments,
        {
          id: `asg-sale-${Date.now()}`,
          providerId: buyerProviderId,
          shiftTypeId: 'st-t',
          departmentId: 'dept-1',
          date: offer.date,
          status: 'confirmed' as const,
          workModality: 'presencial' as const,
          notes: `Plantão adquirido de ${offer.providerName} (R$ ${formattedPrice})`,
          createdAt: new Date().toISOString(),
        }
      ];
    }

    setShiftSaleOffers(updatedOffers);
    setAssignments(finalAssignments);
    localStorage.setItem(STORAGE_KEYS.SHIFT_SALES, JSON.stringify(updatedOffers));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(finalAssignments));

    await syncToFirebase({
      shiftSaleOffers: updatedOffers,
      assignments: finalAssignments,
    });

    return true;
  };

  const cancelShiftSaleOffer = (offerId: string) => {
    const updated: ShiftSaleOffer[] = shiftSaleOffers.map(o => {
      if (o.id === offerId) {
        return { ...o, status: 'cancelled' as ShiftSaleStatus };
      }
      return o;
    });
    setShiftSaleOffers(updated);
    localStorage.setItem(STORAGE_KEYS.SHIFT_SALES, JSON.stringify(updated));
    syncToFirebase({ shiftSaleOffers: updated });
  };

  const setRole = (newRole: UserRole) => {
    if (newRole === 'supervisor' && !isLeaderAuthenticated) {
      return;
    }
    setRoleState(newRole);
  };

  const setActiveProviderId = (id: string | null) => {
    setActiveProviderIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROVIDER);
    }
  };

  const setIsPublished = (published: boolean) => {
    setIsPublishedState(published);
    localStorage.setItem(STORAGE_KEYS.PUBLISHED, String(published));
  };

  const goToPreviousMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonthIndex(now.getMonth());
  };

  const setMonthYear = (month: number, year: number) => {
    setCurrentMonthIndex(month);
    setCurrentYear(year);
  };

  const resetFilters = () => {
    setFilters({
      departmentId: 'all',
      providerId: 'all',
      shiftTypeId: 'all',
      onlyOpenSpots: false,
      searchQuery: '',
    });
  };

  // Add Assignment
  const addAssignment = (data: Omit<ShiftAssignment, 'id' | 'createdAt'>): string => {
    const id = `shift-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newAssignment: ShiftAssignment = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    const updated = [...assignments, newAssignment];
    setAssignments(updated);
    syncToFirebase({ assignments: updated });
    return id;
  };

  // Update Assignment
  const updateAssignment = (id: string, updates: Partial<ShiftAssignment>) => {
    const updated = assignments.map(a =>
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    );
    setAssignments(updated);
    syncToFirebase({ assignments: updated });
  };

  // Delete Assignment
  const deleteAssignment = (id: string) => {
    const updated = assignments.filter(a => a.id !== id);
    setAssignments(updated);
    syncToFirebase({ assignments: updated });
  };

  // Add Provider
  const addProvider = (data: Omit<Provider, 'id'>) => {
    const id = `prov-${Date.now()}`;
    const newProvider: Provider = {
      regime: activeRegime,
      ...data,
      id,
    };
    const updated = [...providers, newProvider];
    setProviders(updated);
    syncToFirebase({ providers: updated });
  };

  // Update Provider
  const updateProvider = (id: string, updates: Partial<Provider>) => {
    const updated = providers.map(p => (p.id === id ? { ...p, ...updates } : p));
    setProviders(updated);
    if (updates.name && (id === authenticatedProviderId || id === activeProviderId || isLeaderAuthenticated)) {
      setLeaderName(updates.name);
      sessionStorage.setItem(STORAGE_KEYS.LEADER_NAME, updates.name);
      localStorage.setItem(STORAGE_KEYS.LEADER_NAME, updates.name);
    }
    syncToFirebase({ providers: updated });
  };

  // Delete Provider
  const deleteProvider = (id: string) => {
    const updatedProviders = providers.filter(p => p.id !== id);
    const updatedAssignments = assignments.filter(a => a.providerId !== id);
    setProviders(updatedProviders);
    setAssignments(updatedAssignments);
    syncToFirebase({ providers: updatedProviders, assignments: updatedAssignments });
  };

  // Toggle Work Modality (Presencial <-> Home Office)
  const toggleWorkModality = (providerId: string, date: string) => {
    const existing = assignments.find(a => a.providerId === providerId && a.date === date);
    let updated: ShiftAssignment[];

    if (existing) {
      const nextModality: WorkModality = existing.workModality === 'home_office' ? 'presencial' : 'home_office';
      updated = assignments.map(a =>
        a.id === existing.id ? { ...a, workModality: nextModality, updatedAt: new Date().toISOString() } : a
      );
    } else {
      const newShift: ShiftAssignment = {
        id: `shift-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date,
        providerId,
        shiftTypeId: 'st-t',
        departmentId: departments[0]?.id || 'dept-1',
        status: 'confirmed',
        workModality: 'home_office',
        createdAt: new Date().toISOString(),
      };
      updated = [...assignments, newShift];
    }

    setAssignments(updated);
    syncToFirebase({ assignments: updated });
  };

  // Incidents CRUD (Atrasos, Faltas, Atestados, Horas Extras)
  const addAttendanceIncident = (data: Omit<AttendanceIncident, 'id' | 'createdAt'>): string => {
    const newId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newIncident: AttendanceIncident = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    const updated = [newIncident, ...attendanceIncidents];
    setAttendanceIncidents(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(updated));
    } catch (_) {}
    syncToFirebase({ attendanceIncidents: updated });
    return newId;
  };

  const updateAttendanceIncident = (id: string, updates: Partial<AttendanceIncident>) => {
    const updated = attendanceIncidents.map(i => (i.id === id ? { ...i, ...updates } : i));
    setAttendanceIncidents(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(updated));
    } catch (_) {}
    syncToFirebase({ attendanceIncidents: updated });
  };

  const deleteAttendanceIncident = (id: string) => {
    const updated = attendanceIncidents.filter(i => i.id !== id);
    setAttendanceIncidents(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(updated));
    } catch (_) {}
    syncToFirebase({ attendanceIncidents: updated });
  };

  // Swap requests between collaborators
  const requestSwap = (data: {
    requesterShiftId: string;
    requesterDate: string;
    targetProviderId: string;
    targetDate?: string;
    targetShiftId?: string;
    reason: string;
  }) => {
    const requesterShift = assignments.find(a => a.id === data.requesterShiftId);
    if (!requesterShift || !requesterShift.providerId) return;

    const newSwap: SwapRequest = {
      id: `swap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      requesterProviderId: requesterShift.providerId,
      targetProviderId: data.targetProviderId,
      requesterDate: data.requesterDate,
      targetDate: data.targetDate,
      requesterShiftId: data.requesterShiftId,
      targetShiftId: data.targetShiftId,
      reason: data.reason,
      status: 'pending_supervisor',
      createdAt: new Date().toISOString(),
    };

    const updatedSwaps = [...swapRequests, newSwap];
    const updatedAssignments = assignments.map(a =>
      a.id === data.requesterShiftId ? { ...a, status: 'swapped' as const } : a
    );

    setSwapRequests(updatedSwaps);
    setAssignments(updatedAssignments);
    syncToFirebase({ swapRequests: updatedSwaps, assignments: updatedAssignments });
  };

  const approveSwap = (swapId: string) => {
    const swap = swapRequests.find(s => s.id === swapId);
    if (!swap) return;

    const reqName = providers.find(p => p.id === swap.requesterProviderId)?.name || 'Colaborador';
    const tgtName = providers.find(p => p.id === swap.targetProviderId)?.name || 'Colaborador';

    let updatedAssignments = [...assignments];

    if (swap.targetShiftId) {
      // Direct two-way shift swap
      updatedAssignments = updatedAssignments.map(a => {
        if (a.id === swap.requesterShiftId) {
          return { ...a, providerId: swap.targetProviderId, status: 'confirmed' as const, notes: `Troca: Plantão do dia ${swap.requesterDate} de ${reqName} assumido por ${tgtName}` };
        }
        if (a.id === swap.targetShiftId) {
          return { ...a, providerId: swap.requesterProviderId, status: 'confirmed' as const, notes: `Troca: Plantão do dia ${swap.targetDate} de ${tgtName} assumido por ${reqName}` };
        }
        return a;
      });
    } else {
      // Reassign requester's shift to target provider
      updatedAssignments = updatedAssignments.map(a => {
        if (a.id === swap.requesterShiftId) {
          return { ...a, providerId: swap.targetProviderId, status: 'confirmed' as const, notes: `Troca: Plantão passado de ${reqName} para ${tgtName}` };
        }
        return a;
      });
    }

    const updatedSwaps = swapRequests.map(s =>
      s.id === swapId ? { ...s, status: 'approved' as const, reviewedAt: new Date().toISOString() } : s
    );

    setAssignments(updatedAssignments);
    setSwapRequests(updatedSwaps);
    syncToFirebase({ assignments: updatedAssignments, swapRequests: updatedSwaps });
  };

  const rejectSwap = (swapId: string) => {
    const swap = swapRequests.find(s => s.id === swapId);
    if (!swap) return;

    const updatedAssignments = assignments.map(a =>
      a.id === swap.requesterShiftId ? { ...a, status: 'confirmed' as const } : a
    );

    const updatedSwaps = swapRequests.map(s =>
      s.id === swapId ? { ...s, status: 'rejected' as const, reviewedAt: new Date().toISOString() } : s
    );

    setAssignments(updatedAssignments);
    setSwapRequests(updatedSwaps);
    syncToFirebase({ assignments: updatedAssignments, swapRequests: updatedSwaps });
  };

  // Direct Swap by Supervisor (with automatic audit note)
  const directSwap = (data: {
    providerAId: string;
    providerBId: string;
    dateA: string;
    dateB?: string;
    reason?: string;
  }) => {
    const provA = providers.find(p => p.id === data.providerAId);
    const provB = providers.find(p => p.id === data.providerBId);
    if (!provA || !provB) return;

    const dateA = data.dateA;
    const dateB = data.dateB || data.dateA;
    const today = new Date().toLocaleDateString('pt-BR');

    const assignmentA = assignments.find(a => a.providerId === provA.id && a.date === dateA);
    const assignmentB = assignments.find(a => a.providerId === provB.id && a.date === dateB);

    const shiftTypeA = assignmentA ? assignmentA.shiftTypeId : 'st-d';
    const shiftTypeB = assignmentB ? assignmentB.shiftTypeId : 'st-d';

    let updated = [...assignments];

    const noteA = `Troca de Plantão autorizada pela Líder em ${today}: ${provA.name} ↔ ${provB.name}${data.reason ? ` (${data.reason})` : ''}`;
    const noteB = `Troca de Plantão autorizada pela Líder em ${today}: ${provB.name} ↔ ${provA.name}${data.reason ? ` (${data.reason})` : ''}`;

    if (assignmentA) {
      updated = updated.map(a => a.id === assignmentA.id ? { ...a, shiftTypeId: shiftTypeB, notes: noteA, updatedAt: new Date().toISOString() } : a);
    } else {
      updated.push({
        id: `shift-${Date.now()}-a`,
        providerId: provA.id,
        date: dateA,
        shiftTypeId: shiftTypeB,
        departmentId: 'dept-1',
        status: 'confirmed',
        notes: noteA,
        createdAt: new Date().toISOString(),
      });
    }

    if (assignmentB) {
      updated = updated.map(a => a.id === assignmentB.id ? { ...a, shiftTypeId: shiftTypeA, notes: noteB, updatedAt: new Date().toISOString() } : a);
    } else {
      updated.push({
        id: `shift-${Date.now()}-b`,
        providerId: provB.id,
        date: dateB,
        shiftTypeId: shiftTypeA,
        departmentId: 'dept-1',
        status: 'confirmed',
        notes: noteB,
        createdAt: new Date().toISOString(),
      });
    }

    setAssignments(updated);
    syncToFirebase({ assignments: updated });
  };

  // Future schedule requests (Folgas / Extras)
  const addScheduleRequest = (data: {
    providerId: string;
    type: ScheduleRequestType;
    date: string;
    reason: string;
  }) => {
    const newReq: ScheduleRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      providerId: data.providerId,
      type: data.type,
      date: data.date,
      reason: data.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [...scheduleRequests, newReq];
    setScheduleRequests(updated);
    syncToFirebase({ scheduleRequests: updated });
  };

  const approveScheduleRequest = (requestId: string) => {
    const req = scheduleRequests.find(r => r.id === requestId);
    if (!req) return;

    let updatedAssignments = [...assignments];

    if (req.type === 'day_off') {
      // Ensure provider has 'D' (Descanso) on this date
      const existing = updatedAssignments.find(a => a.date === req.date && a.providerId === req.providerId);
      if (existing) {
        updatedAssignments = updatedAssignments.map(a =>
          a.id === existing.id ? { ...a, shiftTypeId: 'st-d', notes: `Folga aprovada: ${req.reason}` } : a
        );
      } else {
        updatedAssignments.push({
          id: `shift-off-${Date.now()}`,
          date: req.date,
          shiftTypeId: 'st-d',
          departmentId: 'dept-1',
          providerId: req.providerId,
          status: 'confirmed',
          notes: `Folga aprovada: ${req.reason}`,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (req.type === 'extra_shift') {
      // Add extra shift 'T' (Trabalha)
      const existing = updatedAssignments.find(a => a.date === req.date && a.providerId === req.providerId);
      if (existing) {
        updatedAssignments = updatedAssignments.map(a =>
          a.id === existing.id ? { ...a, shiftTypeId: 'st-t', notes: `Extra aprovado: ${req.reason}` } : a
        );
      } else {
        updatedAssignments.push({
          id: `shift-extra-${Date.now()}`,
          date: req.date,
          shiftTypeId: 'st-t',
          departmentId: 'dept-1',
          providerId: req.providerId,
          status: 'confirmed',
          notes: `Extra aprovado: ${req.reason}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const updatedRequests = scheduleRequests.map(r =>
      r.id === requestId ? { ...r, status: 'approved' as const, reviewedAt: new Date().toISOString() } : r
    );

    setAssignments(updatedAssignments);
    setScheduleRequests(updatedRequests);
    syncToFirebase({ assignments: updatedAssignments, scheduleRequests: updatedRequests });
  };

  const rejectScheduleRequest = (requestId: string) => {
    const updatedRequests = scheduleRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const, reviewedAt: new Date().toISOString() } : r
    );
    setScheduleRequests(updatedRequests);
    syncToFirebase({ scheduleRequests: updatedRequests });
  };

  const toggleAcknowledgeShift = (shiftId: string) => {
    const shift = assignments.find(a => a.id === shiftId);
    if (!shift) return;
    updateAssignment(shiftId, { acknowledgedByProvider: !shift.acknowledgedByProvider });
  };

  const acknowledgeAllMonthlyShifts = (providerId: string, year: number, monthIndex: number) => {
    const updated = assignments.map(a => {
      if (a.providerId !== providerId) return a;
      const [y, m] = a.date.split('-').map(Number);
      if (y === year && m === monthIndex + 1) {
        return { ...a, acknowledgedByProvider: true };
      }
      return a;
    });
    setAssignments(updated);
    syncToFirebase({ assignments: updated });
  };

  // Conflict Checking
  const checkShiftConflicts = (
    providerId: string | null,
    date: string,
    shiftTypeId: string,
    ignoreShiftId?: string
  ): ConflictResult => {
    if (!providerId) return { hasConflict: false, reasons: [] };

    const reasons: string[] = [];
    const sameDayShifts = assignments.filter(
      a => a.date === date && a.providerId === providerId && a.id !== ignoreShiftId
    );

    if (sameDayShifts.length > 0) {
      reasons.push('Plantonista já possui outro plantão alocado no mesmo dia');
    }

    return {
      hasConflict: reasons.length > 0,
      reasons,
    };
  };

  // Helper to find the provider's last working shift (st-t) prior to a target date string
  const findLastWorkingShiftDate = (providerId: string, beforeDateStr: string): Date | null => {
    const pastShifts = assignments.filter(
      a => a.providerId === providerId && a.shiftTypeId === 'st-t' && a.date < beforeDateStr
    );
    if (pastShifts.length === 0) return null;
    pastShifts.sort((a, b) => b.date.localeCompare(a.date));
    const [y, m, d] = pastShifts[0].date.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Auto Generate Schedule (preserves 12x36 continuous cadence from previous month)
  const autoGenerateSchedule = (params: AutoScheduleParams): number => {
    const { year, monthIndex, pattern, teamAProviderIds, teamBProviderIds, departmentIds } = params;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const newAssignments: ShiftAssignment[] = [];
    const deptId = departmentIds[0] || 'dept-1';
    let count = 0;

    const firstOfMonthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const allProvidersToSchedule = Array.from(new Set([...teamAProviderIds, ...teamBProviderIds]));

    allProvidersToSchedule.forEach(provId => {
      const lastWorkDate = findLastWorkingShiftDate(provId, firstOfMonthStr);

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day);
        const dateStr = formatDateToISO(date);

        let isWorking = false;
        if (lastWorkDate) {
          const diffInDays = Math.round((date.getTime() - lastWorkDate.getTime()) / (1000 * 60 * 60 * 24));
          isWorking = diffInDays % 2 === 0;
        } else {
          const isTeamA = teamAProviderIds.includes(provId);
          isWorking = isTeamA ? day % 2 !== 0 : day % 2 === 0;
        }

        newAssignments.push({
          id: `shift-auto-${Date.now()}-${count++}`,
          date: dateStr,
          shiftTypeId: isWorking ? 'st-t' : 'st-d',
          departmentId: deptId,
          providerId: provId,
          status: 'confirmed',
          acknowledgedByProvider: true,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Replace assignments for this month
    const existingOtherMonths = assignments.filter(a => {
      const [y, m] = a.date.split('-').map(Number);
      return !(y === year && m === monthIndex + 1);
    });

    const combined = [...existingOtherMonths, ...newAssignments];
    setAssignments(combined);
    syncToFirebase({ assignments: combined });
    return newAssignments.length;
  };

  // Month Publish Status
  const isMonthPublished = (year: number, monthIndex: number): boolean => {
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    if (key === '2026-10') return publishedMonths[key] !== false;
    return publishedMonths[key] ?? true;
  };

  const toggleMonthPublishStatus = (year: number, monthIndex: number) => {
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const current = isMonthPublished(year, monthIndex);
    const updated = { ...publishedMonths, [key]: !current };
    setPublishedMonths(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.PUBLISHED_MONTHS, JSON.stringify(updated));
    } catch (_) {}
    syncToFirebase({ publishedMonths: updated });
  };

  // Clone Previous Month Schedule (Calculates exact 12x36 rotation across month boundaries)
  const clonePreviousMonthSchedule = (
    targetYear: number,
    targetMonthIndex: number,
    mode: 'continue_12x36' | 'exact'
  ): number => {
    let prevYear = targetYear;
    let prevMonthIndex = targetMonthIndex - 1;
    if (prevMonthIndex < 0) {
      prevMonthIndex = 11;
      prevYear--;
    }

    const prevDaysCount = new Date(prevYear, prevMonthIndex + 1, 0).getDate();
    const targetDaysCount = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
    const newAssignments: ShiftAssignment[] = [];
    let count = 1;

    providers.forEach(prov => {
      const firstOfMonthStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-01`;
      const lastWorkDate = findLastWorkingShiftDate(prov.id, firstOfMonthStr);

      for (let d = 1; d <= targetDaysCount; d++) {
        const dt = new Date(targetYear, targetMonthIndex, d);
        const dateStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        let shiftCode: 'T' | 'D' = 'D';

        if (mode === 'continue_12x36') {
          if (lastWorkDate) {
            const diffInDays = Math.round((dt.getTime() - lastWorkDate.getTime()) / (1000 * 60 * 60 * 24));
            shiftCode = diffInDays % 2 === 0 ? 'T' : 'D';
          } else {
            shiftCode = d % 2 !== 0 ? 'T' : 'D';
          }
        } else {
          // Exact day clone
          const sourceDay = Math.min(d, prevDaysCount);
          const sourceDateStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(sourceDay).padStart(2, '0')}`;
          const sourceShift = assignments.find(a => a.providerId === prov.id && a.date === sourceDateStr);
          shiftCode = sourceShift?.shiftTypeId === 'st-t' ? 'T' : 'D';
        }

        newAssignments.push({
          id: `shift-clone-${Date.now()}-${count++}`,
          date: dateStr,
          shiftTypeId: shiftCode === 'T' ? 'st-t' : 'st-d',
          departmentId: 'dept-1',
          providerId: prov.id,
          status: 'confirmed',
          acknowledgedByProvider: true,
          createdAt: new Date().toISOString(),
        });
      }
    });

    const otherMonths = assignments.filter(a => {
      const [y, m] = a.date.split('-').map(Number);
      return !(y === targetYear && m === targetMonthIndex + 1);
    });

    const combined = [...otherMonths, ...newAssignments];
    setAssignments(combined);
    syncToFirebase({ assignments: combined });
    return newAssignments.length;
  };

  // Batch Fill for Single Provider in a Month
  const batchFillProviderMonth = (
    providerId: string,
    year: number,
    monthIndex: number,
    pattern: 'odd_12x36' | 'even_12x36' | 'mon_to_fri_5x2' | 'mon_wed_fri' | 'tue_thu_sat' | 'clear'
  ): number => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const newAssignmentsForProv: ShiftAssignment[] = [];
    let count = 1;

    if (pattern !== 'clear') {
      const firstOfMonthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      const lastWorkDate = findLastWorkingShiftDate(providerId, firstOfMonthStr);

      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, monthIndex, d);
        const dateStr = formatDateToISO(dt);
        const dayOfWeek = dt.getDay(); // 0 = Sun, 1 = Mon...
        let isWorking = false;

        if (pattern === 'odd_12x36' || pattern === 'even_12x36') {
          if (lastWorkDate) {
            const diffInDays = Math.round((dt.getTime() - lastWorkDate.getTime()) / (1000 * 60 * 60 * 24));
            isWorking = diffInDays % 2 === 0;
          } else {
            isWorking = pattern === 'odd_12x36' ? d % 2 !== 0 : d % 2 === 0;
          }
        } else if (pattern === 'mon_to_fri_5x2') {
          isWorking = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri works, Sat-Sun off
        } else if (pattern === 'mon_wed_fri') {
          isWorking = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
        } else if (pattern === 'tue_thu_sat') {
          isWorking = dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6;
        }

        newAssignmentsForProv.push({
          id: `shift-batch-${Date.now()}-${count++}`,
          date: dateStr,
          shiftTypeId: isWorking ? 'st-t' : 'st-d',
          departmentId: 'dept-1',
          providerId: providerId,
          status: 'confirmed',
          acknowledgedByProvider: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const updated = assignments.filter(a => {
      const [y, m] = a.date.split('-').map(Number);
      const isTargetMonth = y === year && m === monthIndex + 1;
      return !(isTargetMonth && a.providerId === providerId);
    });

    const combined = [...updated, ...newAssignmentsForProv];
    setAssignments(combined);
    syncToFirebase({ assignments: combined });
    return newAssignmentsForProv.length;
  };

  // Clear Month
  const clearMonthAssignments = (year: number, monthIndex: number) => {
    const updated = assignments.filter(a => {
      const [y, m] = a.date.split('-').map(Number);
      return !(y === year && m === monthIndex + 1);
    });
    setAssignments(updated);
    syncToFirebase({ assignments: updated });
  };

  // Apply Team Groups Schedule (Turma A = Ímpares, Turma B = Pares, 5x2 = Seg-Sex) - Preserves continuous 12x36
  const applyTeamGroupsSchedule = (year: number, monthIndex: number): number => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const newAssignments: ShiftAssignment[] = [];
    let count = 1;

    const currentRegimeProviders = providers.filter(p => (p.regime || '12x36') === activeRegime);
    const firstOfMonthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;

    currentRegimeProviders.forEach((prov, provIdx) => {
      const is5x2 = (prov.regime || activeRegime) === '5x2';
      const group = prov.teamGroup || (provIdx % 2 === 0 ? 'turma_a' : 'turma_b');
      const lastWorkDate = findLastWorkingShiftDate(prov.id, firstOfMonthStr);

      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, monthIndex, d);
        const dateStr = formatDateToISO(dt);
        const dayOfWeek = dt.getDay(); // 0 = Sun, 1 = Mon...
        let isWorking = false;

        if (is5x2) {
          isWorking = dayOfWeek >= 1 && dayOfWeek <= 5;
        } else {
          if (lastWorkDate) {
            const diffInDays = Math.round((dt.getTime() - lastWorkDate.getTime()) / (1000 * 60 * 60 * 24));
            isWorking = diffInDays % 2 === 0;
          } else {
            isWorking = group === 'turma_a' ? d % 2 !== 0 : d % 2 === 0;
          }
        }

        newAssignments.push({
          id: `shift-team-${Date.now()}-${count++}`,
          date: dateStr,
          shiftTypeId: isWorking ? 'st-t' : 'st-d',
          departmentId: 'dept-1',
          providerId: prov.id,
          status: 'confirmed',
          acknowledgedByProvider: true,
          createdAt: new Date().toISOString(),
        });
      }
    });

    const existingOther = assignments.filter(a => {
      const [y, m] = a.date.split('-').map(Number);
      const isTargetMonth = y === year && m === monthIndex + 1;
      const isRegimeProv = currentRegimeProviders.some(p => p.id === a.providerId);
      return !(isTargetMonth && isRegimeProv);
    });

    const combined = [...existingOther, ...newAssignments];
    setAssignments(combined);
    syncToFirebase({ assignments: combined });
    return newAssignments.length;
  };

  // Apply Absence Range (Férias, Atestado, Licença por período)
  const applyAbsenceRange = (data: {
    providerId: string;
    startDate: string;
    endDate: string;
    type: AbsenceType;
    notes?: string;
  }): number => {
    const prov = providers.find(p => p.id === data.providerId);
    if (!prov) return 0;

    const [sy, sm, sd] = data.startDate.split('-').map(Number);
    const [ey, em, ed] = data.endDate.split('-').map(Number);
    const startDt = new Date(sy, sm - 1, sd);
    const endDt = new Date(ey, em - 1, ed);

    const typeLabels: Record<AbsenceType, string> = {
      vacation: '🏖️ Férias',
      medical: '🏥 Atestado Médico',
      maternity: '👶 Licença',
      compensation: '⏳ Folga Compensatória',
      other: '📌 Afastamento',
    };

    const label = typeLabels[data.type] || '📌 Afastamento';
    const noteText = data.notes ? `${label} (${data.notes})` : label;

    let updated = [...assignments];
    let daysCount = 0;

    for (let dt = new Date(startDt); dt <= endDt; dt.setDate(dt.getDate() + 1)) {
      const dateStr = formatDateToISO(dt);
      daysCount++;

      const existingIdx = updated.findIndex(a => a.providerId === data.providerId && a.date === dateStr);
      if (existingIdx >= 0) {
        updated[existingIdx] = {
          ...updated[existingIdx],
          shiftTypeId: 'st-d',
          notes: noteText,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updated.push({
          id: `shift-abs-${Date.now()}-${daysCount}`,
          date: dateStr,
          shiftTypeId: 'st-d',
          departmentId: 'dept-1',
          providerId: data.providerId,
          status: 'confirmed',
          notes: noteText,
          createdAt: new Date().toISOString(),
        });
      }
    }

    setAssignments(updated);
    syncToFirebase({ assignments: updated });
    return daysCount;
  };

  // Batch Add Providers (Colar Lista)
  const batchAddProviders = (providersList: Array<Omit<Provider, 'id'>>): number => {
    if (!providersList.length) return 0;

    const newItems: Provider[] = providersList.map((p, idx) => ({
      ...p,
      id: `prov-${Date.now()}-${idx + 1}`,
      regime: p.regime || activeRegime,
      teamGroup: p.teamGroup || (idx % 2 === 0 ? 'turma_a' : 'turma_b'),
      entryTime: p.entryTime || (activeRegime === '5x2' ? '08h00' : '07h00'),
      exitTime: p.exitTime || (activeRegime === '5x2' ? '17h00' : '19h00'),
      status: 'active',
      maxMonthlyHours: p.maxMonthlyHours || 180,
    }));

    const updated = [...providers, ...newItems];
    setProviders(updated);
    syncToFirebase({ providers: updated });
    return newItems.length;
  };

  // Reset to Demo Data
  const resetToDemoData = () => {
    const initialAssignments = generateInitialAssignments();
    setCurrentYear(2026);
    setCurrentMonthIndex(9); // October
    setProviders(INITIAL_PROVIDERS);
    setAssignments(initialAssignments);
    setDepartments(INITIAL_DEPARTMENTS);
    setShiftTypes(INITIAL_SHIFT_TYPES);
    setSwapRequests([]);
    setScheduleRequests([]);
    setLeaderPin('1234');
    syncToFirebase({
      providers: INITIAL_PROVIDERS,
      assignments: initialAssignments,
      swapRequests: [],
      scheduleRequests: [],
      leaderPin: '1234',
    });
  };

  return (
    <ScheduleContext.Provider
      value={{
        role,
        setRole,
        activeProviderId,
        setActiveProviderId,
        currentYear,
        currentMonthIndex,
        goToPreviousMonth,
        goToNextMonth,
        goToToday,
        setMonthYear,
        viewMode,
        setViewMode,
        activeRegime,
        setActiveRegime,
        activeModule,
        setActiveModule,
        filters,
        setFilters,
        resetFilters,

        isLeaderAuthenticated,
        leaderPin,
        leaderName,
        authenticateLeader,
        logoutLeader,
        changeLeaderPin,

        authenticatedProviderId,
        authenticateProvider,
        setupProviderPin,
        resetProviderPin,
        logoutProvider,

        isSyncing,
        lastUpdatedAt,
        lastUpdatedBy,
        providers,
        shiftTypes,
        departments,
        assignments,
        swapRequests,
        scheduleRequests,
        attendanceIncidents,
        shiftSaleOffers,
        isPublished,
        setIsPublished,
        publishedMonths,
        isMonthPublished,
        toggleMonthPublishStatus,

        announcements,
        addAnnouncement,
        deleteAnnouncement,

        createShiftSaleOffer,
        buyShiftSaleOffer,
        cancelShiftSaleOffer,
        updateProviderWhatsapp,

        weekendColumns,
        weekendAssignments,
        addWeekendColumn,
        renameWeekendColumn,
        deleteWeekendColumn,
        updateWeekendCell,
        clearWeekendCell,
        clonePreviousMonthWeekendSchedule,

        addAssignment,
        updateAssignment,
        deleteAssignment,
        addProvider,
        updateProvider,
        deleteProvider,
        toggleWorkModality,

        addAttendanceIncident,
        updateAttendanceIncident,
        deleteAttendanceIncident,

        requestSwap,
        approveSwap,
        rejectSwap,
        directSwap,

        addScheduleRequest,
        approveScheduleRequest,
        rejectScheduleRequest,

        toggleAcknowledgeShift,
        acknowledgeAllMonthlyShifts,
        checkShiftConflicts,
        autoGenerateSchedule,
        clonePreviousMonthSchedule,
        batchFillProviderMonth,
        applyTeamGroupsSchedule,
        applyAbsenceRange,
        batchAddProviders,
        clearMonthAssignments,
        resetToDemoData,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = (): ScheduleContextType => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
