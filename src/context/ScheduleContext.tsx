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
  ViewMode
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
  setupProviderPin: (providerId: string, pin?: string) => Promise<boolean>;
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
  isPublished: boolean;
  setIsPublished: (published: boolean) => void;

  // Actions
  addAssignment: (data: Omit<ShiftAssignment, 'id' | 'createdAt'>) => string;
  updateAssignment: (id: string, updates: Partial<ShiftAssignment>) => void;
  deleteAssignment: (id: string) => void;
  addProvider: (data: Omit<Provider, 'id'>) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;

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
  checkShiftConflicts: (providerId: string | null, date: string, shiftTypeId: string, ignoreShiftId?: string) => ConflictResult;
  autoGenerateSchedule: (params: AutoScheduleParams) => number;
  clearMonthAssignments: (year: number, monthIndex: number) => void;
  resetToDemoData: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ROLE: 'escalapro_role_v5',
  ACTIVE_PROVIDER: 'escalapro_active_provider_v5',
  PROVIDERS: 'escalapro_providers_v5',
  DEPARTMENTS: 'escalapro_departments_v5',
  SHIFT_TYPES: 'escalapro_shift_types_v5',
  ASSIGNMENTS: 'escalapro_assignments_v5',
  SWAPS: 'escalapro_swaps_v5',
  REQUESTS: 'escalapro_requests_v5',
  PUBLISHED: 'escalapro_published_v5',
  LEADER_AUTH: 'escalapro_leader_authenticated_v5',
  LEADER_PIN: 'escalapro_leader_pin_v5',
  LEADER_NAME: 'escalapro_leader_name_v5',
  AUTH_PROVIDER: 'escalapro_auth_provider_v5',
  LAST_UPDATED: 'escalapro_last_updated_v5',
  LAST_UPDATED_BY: 'escalapro_last_updated_by_v5',
};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(today.getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>('escala');

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

  // Authenticated collaborator session (if not leader)
  const [authenticatedProviderId, setAuthenticatedProviderId] = useState<string | null>(() => {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH_PROVIDER) || null;
  });

  const [activeProviderId, setActiveProviderIdState] = useState<string>('prov-1');
  const [isPublished, setIsPublishedState] = useState<boolean>(true);
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
      return saved ? JSON.parse(saved) : generateInitialAssignments();
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

  // Sync role with leader authentication
  useEffect(() => {
    if (isLeaderAuthenticated) {
      setRoleState('supervisor');
    } else {
      setRoleState('provider');
    }
  }, [isLeaderAuthenticated]);

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
            setAssignments(data.assignments);
            localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(data.assignments));
          }
          if (data.swapRequests && Array.isArray(data.swapRequests)) {
            setSwapRequests(data.swapRequests);
            localStorage.setItem(STORAGE_KEYS.SWAPS, JSON.stringify(data.swapRequests));
          }
          if (data.scheduleRequests && Array.isArray(data.scheduleRequests)) {
            setScheduleRequests(data.scheduleRequests);
            localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(data.scheduleRequests));
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
    leaderPin?: string;
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

  // Collaborator Authentication & PIN Methods (Simplified - PIN check removed)
  const authenticateProvider = (providerId: string, pin?: string): boolean => {
    const prov = providers.find(p => p.id === providerId);
    if (!prov) return false;

    setAuthenticatedProviderId(providerId);
    setActiveProviderIdState(providerId);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, providerId);
    return true;
  };

  const setupProviderPin = async (providerId: string, pin?: string): Promise<boolean> => {
    setAuthenticatedProviderId(providerId);
    setActiveProviderIdState(providerId);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, providerId);
    return true;
  };

  const logoutProvider = () => {
    setAuthenticatedProviderId(null);
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
    const newProvider: Provider = { ...data, id };
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

    let updatedAssignments = [...assignments];

    if (swap.targetShiftId) {
      // Direct two-way shift swap
      updatedAssignments = updatedAssignments.map(a => {
        if (a.id === swap.requesterShiftId) {
          return { ...a, providerId: swap.targetProviderId, status: 'confirmed' as const };
        }
        if (a.id === swap.targetShiftId) {
          return { ...a, providerId: swap.requesterProviderId, status: 'confirmed' as const };
        }
        return a;
      });
    } else {
      // Reassign requester's shift to target provider
      updatedAssignments = updatedAssignments.map(a => {
        if (a.id === swap.requesterShiftId) {
          return { ...a, providerId: swap.targetProviderId, status: 'confirmed' as const };
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

  // Clear Month
  const clearMonthAssignments = (year: number, monthIndex: number) => {
    const updated = assignments.filter(a => {
      const [y, m] = a.date.split('-').map(Number);
      return !(y === year && m === monthIndex + 1);
    });
    setAssignments(updated);
    syncToFirebase({ assignments: updated });
  };

  // Reset to Demo Data
  const resetToDemoData = () => {
    const initialAssignments = generateInitialAssignments();
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
        isPublished,
        setIsPublished,

        addAssignment,
        updateAssignment,
        deleteAssignment,
        addProvider,
        updateProvider,
        deleteProvider,

        requestSwap,
        approveSwap,
        rejectSwap,

        addScheduleRequest,
        approveScheduleRequest,
        rejectScheduleRequest,

        toggleAcknowledgeShift,
        checkShiftConflicts,
        autoGenerateSchedule,
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
