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
  AttendanceIncident
} from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_PROVIDERS,
  INITIAL_SHIFT_TYPES,
  generateInitialAssignments
} from '../data/initialData';
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
  activeProviderId: string;
  setActiveProviderId: (id: string) => void;
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
  isPublished: boolean;
  setIsPublished: (published: boolean) => void;
  publishedMonths: Record<string, boolean>;
  isMonthPublished: (year: number, monthIndex: number) => boolean;
  toggleMonthPublishStatus: (year: number, monthIndex: number) => void;

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

  const [activeProviderId, setActiveProviderIdState] = useState<string>('prov-1');
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
      parsed = parsed.filter((a: ShiftAssignment) => a.date && !a.date.startsWith('2026-09-'));
      const hasOctober = parsed.some((a: ShiftAssignment) => a.date && a.date.startsWith('2026-10-'));
      if (!hasOctober) {
        const seed = generateInitialAssignments();
        return [...parsed, ...seed];
      }
      return parsed;
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

      const hasOct = clean.some(a => a.date && a.date.startsWith('2026-10-'));
      const finalAssignments = hasOct ? clean : [...clean, ...seed];
      
      try {
        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(finalAssignments));
      } catch (_) {}

      const scheduleDocRef = doc(db, 'schedule_store', 'main');
      setDoc(scheduleDocRef, {
        assignments: finalAssignments,
        providers: INITIAL_PROVIDERS,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: 'Sistema'
      }, { merge: true }).catch(() => {});

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
            let loadedAssignments = data.assignments.filter((a: any) => a.date && !a.date.startsWith('2026-09-'));
            const hasOctober = loadedAssignments.some((a: any) => a.date && a.date.startsWith('2026-10-'));
            
            if (!hasOctober) {
              const seedAssignments = generateInitialAssignments();
              const octoberSeed = seedAssignments.filter(a => a.date && a.date.startsWith('2026-10-'));
              loadedAssignments = [...loadedAssignments, ...octoberSeed];
              
              setDoc(scheduleDocRef, { assignments: loadedAssignments }, { merge: true }).catch(() => {});
            }
            
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
          if (data.publishedMonths && typeof data.publishedMonths === 'object') {
            setPublishedMonths(data.publishedMonths);
            localStorage.setItem(STORAGE_KEYS.PUBLISHED_MONTHS, JSON.stringify(data.publishedMonths));
          }
          if (data.leaderPin) {
            setLeaderPin(data.leaderPin);
            localStorage.setItem(STORAGE_KEYS.LEADER_PIN, data.leaderPin);
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
    leaderPin?: string;
    publishedMonths?: Record<string, boolean>;
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
    } catch (e) {
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

  // Leader Authentication Methods
  const authenticateLeader = (name: string, pin: string): boolean => {
    if (pin.trim() === leaderPin.trim() && name.trim()) {
      setIsLeaderAuthenticated(true);
      setRoleState('supervisor');
      const cleanName = name.trim();
      setLeaderName(cleanName);
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
    localStorage.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
  };

  const setRole = (newRole: UserRole) => {
    if (newRole === 'supervisor' && !isLeaderAuthenticated) {
      return;
    }
    setRoleState(newRole);
  };

  const setActiveProviderId = (id: string) => {
    setActiveProviderIdState(id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, id);
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

  // Auto Generate Schedule
  const autoGenerateSchedule = (params: AutoScheduleParams): number => {
    const { year, monthIndex, pattern, teamAProviderIds, teamBProviderIds, departmentIds } = params;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const newAssignments: ShiftAssignment[] = [];
    const deptId = departmentIds[0] || 'dept-1';

    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dateStr = formatDateToISO(date);
      const isEvenDay = day % 2 === 0;

      const workingTeam = isEvenDay ? teamAProviderIds : teamBProviderIds;
      const restingTeam = isEvenDay ? teamBProviderIds : teamAProviderIds;

      workingTeam.forEach(provId => {
        newAssignments.push({
          id: `shift-auto-${Date.now()}-${count++}`,
          date: dateStr,
          shiftTypeId: 'st-t',
          departmentId: deptId,
          providerId: provId,
          status: 'confirmed',
          acknowledgedByProvider: true,
          createdAt: new Date().toISOString(),
        });
      });

      restingTeam.forEach(provId => {
        newAssignments.push({
          id: `shift-auto-${Date.now()}-${count++}`,
          date: dateStr,
          shiftTypeId: 'st-d',
          departmentId: deptId,
          providerId: provId,
          status: 'confirmed',
          acknowledgedByProvider: true,
          createdAt: new Date().toISOString(),
        });
      });
    }

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
    // October 2026 is published by default; for other months, check publishedMonths map (default true if not explicitly set)
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

  // Clone Previous Month Schedule
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
      // Check last day of previous month
      const lastDayPrevStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(prevDaysCount).padStart(2, '0')}`;
      const lastShiftPrev = assignments.find(a => a.providerId === prov.id && a.date === lastDayPrevStr);
      const lastWasWorking = lastShiftPrev?.shiftTypeId === 'st-t';

      for (let d = 1; d <= targetDaysCount; d++) {
        const dateStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        let shiftCode: 'T' | 'D' = 'D';

        if (mode === 'continue_12x36') {
          // If worked last day of month, day 1 is resting (D), day 2 is working (T), etc.
          if (lastWasWorking) {
            shiftCode = d % 2 === 0 ? 'T' : 'D';
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
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, monthIndex, d);
        const dateStr = formatDateToISO(dt);
        const dayOfWeek = dt.getDay(); // 0 = Sun, 1 = Mon...
        let isWorking = false;

        if (pattern === 'odd_12x36') {
          isWorking = d % 2 !== 0;
        } else if (pattern === 'even_12x36') {
          isWorking = d % 2 === 0;
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

  // Apply Team Groups Schedule (Turma A = Ímpares, Turma B = Pares, 5x2 = Seg-Sex)
  const applyTeamGroupsSchedule = (year: number, monthIndex: number): number => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const newAssignments: ShiftAssignment[] = [];
    let count = 1;

    // Filter providers in current active regime
    const currentRegimeProviders = providers.filter(p => (p.regime || '12x36') === activeRegime);

    currentRegimeProviders.forEach((prov, provIdx) => {
      const is5x2 = (prov.regime || activeRegime) === '5x2';
      // Group: if explicit, use it; otherwise alternate
      const group = prov.teamGroup || (provIdx % 2 === 0 ? 'turma_a' : 'turma_b');

      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, monthIndex, d);
        const dateStr = formatDateToISO(dt);
        const dayOfWeek = dt.getDay(); // 0 = Sun, 1 = Mon...
        let isWorking = false;

        if (is5x2) {
          isWorking = dayOfWeek >= 1 && dayOfWeek <= 5;
        } else {
          if (group === 'turma_a') {
            isWorking = d % 2 !== 0; // Odd days
          } else {
            isWorking = d % 2 === 0; // Even days
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
        isPublished,
        setIsPublished,
        publishedMonths,
        isMonthPublished,
        toggleMonthPublishStatus,

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
