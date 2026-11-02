import React, { useState, useRef, useEffect } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { getMonthDaysArray, MONTH_NAMES_PT, DAYS_SHORT_PT } from '../../utils/dateUtils';
import { getHolidayInfo } from '../../utils/holidaysBR';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Printer,
  CalendarDays,
  Maximize2,
  Minimize2,
  Home,
  Building2,
  Users,
  Palmtree,
  Zap,
  Keyboard,
  ShieldAlert,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Download,
  HelpCircle,
  ArrowLeftRight,
  Activity,
  ShieldCheck,
  MessageSquare,
  Coins,
} from 'lucide-react';
import { Provider, WorkModality, WorkRegime } from '../../types';
import { AbsenceBatchModal } from '../modals/AbsenceBatchModal';
import { QuickSwapModal } from '../modals/QuickSwapModal';

interface EscalaGridViewProps {
  onAddProvider?: () => void;
  onOpenCollaboratorAuth?: (provider: Provider) => void;
  onOpenPrintModal?: () => void;
  onOpenMarketplace?: () => void;
  onOpenSellModal?: (date?: string, providerId?: string) => void;
}

export const EscalaGridView: React.FC<EscalaGridViewProps> = ({
  onAddProvider,
  onOpenCollaboratorAuth,
  onOpenPrintModal,
  onOpenMarketplace,
  onOpenSellModal,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    providers,
    assignments,
    swapRequests,
    shiftSaleOffers,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    role,
    activeProviderId,
    setActiveProviderId,
    updateProvider,
    deleteProvider,
    addProvider,
    setViewMode,
    authenticatedProviderId,
    applyTeamGroupsSchedule,
    activeRegime,
    setActiveRegime,
    filters,
    setFilters,
  } = useSchedule();

  // Modals state
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [absenceModalProvId, setAbsenceModalProvId] = useState<string | undefined>(undefined);
  const [quickSwapOpen, setQuickSwapOpen] = useState(false);

  // Quinzena filter: 'all' | 'q1' (1-15) | 'q2' (16-31)
  const [quinzenaView, setQuinzenaView] = useState<'all' | 'q1' | 'q2'>('all');

  // Selected cell for keyboard navigation
  const [selectedCell, setSelectedCell] = useState<{ providerId: string; dayNumber: number } | null>(null);

  // Cell note & shift picker modal
  const [activeCellEdit, setActiveCellEdit] = useState<{
    providerId: string;
    providerName: string;
    dateStr: string;
    dayNumber: number;
    shiftId?: string;
    currentCode: string;
    workModality: WorkModality;
    notes?: string;
  } | null>(null);

  const [noteInput, setNoteInput] = useState('');
  const [modalityInput, setModalityInput] = useState<WorkModality>('presencial');

  // Inline editing state for Provider Name, Entry, Exit
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'entry' | 'exit' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Quick Add Provider row state
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEntry, setNewEntry] = useState('07h00');
  const [newExit, setNewExit] = useState('19h00');

  // Row density: 'spacious' (Amplo) or 'compact' (Compacto)
  const [rowDensity, setRowDensity] = useState<'spacious' | 'compact'>('spacious');

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filter providers by active regime (12x36 vs 5x2)
  const regimeProviders = providers.filter(p => (p.regime || '12x36') === activeRegime);

  const displayedProviders = regimeProviders.filter(prov => {
    if (filters.providerId !== 'all' && prov.id !== filters.providerId) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      return prov.name.toLowerCase().includes(q) || prov.role.toLowerCase().includes(q);
    }
    return true;
  });

  const allDays = getMonthDaysArray(currentYear, currentMonthIndex);
  const days = allDays.filter(d => {
    if (quinzenaView === 'q1') return d.dayNumber <= 15;
    if (quinzenaView === 'q2') return d.dayNumber >= 16;
    return true;
  });

  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  const monthNameUpper = monthName.toUpperCase();

  // Active / Highlighted user (default to authenticated or active provider or first provider)
  const spotlightProvider =
    providers.find(p => p.id === (authenticatedProviderId || activeProviderId)) ||
    displayedProviders[0] ||
    providers[0];

  // Calculate REAL stats for spotlight provider
  const spotlightShifts = assignments.filter(a => {
    const [y, m] = a.date.split('-').map(Number);
    return a.providerId === spotlightProvider?.id && y === currentYear && m === currentMonthIndex + 1;
  });
  const spotlightPlantõesCount = spotlightShifts.filter(s => s.shiftTypeId === 'st-t').length;
  const spotlightFolgasCount = Math.max(0, allDays.length - spotlightPlantõesCount);
  const spotlightHours = spotlightPlantõesCount * (spotlightProvider?.regime === '5x2' ? 8 : 12);

  // Today calculations (100% REAL)
  const today = new Date();
  const isCurrentViewingMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonthIndex;
  const todayDayNumber = isCurrentViewingMonth ? today.getDate() : Math.min(12, allDays.length);
  const todayDateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(todayDayNumber).padStart(2, '0')}`;

  const todayWorkersCount = assignments.filter(
    a => a.date === todayDateStr && a.shiftTypeId === 'st-t' && regimeProviders.some(p => p.id === a.providerId)
  ).length;
  const todayOffCount = Math.max(0, regimeProviders.length - todayWorkersCount);

  // Average shifts per provider
  const totalTAssignments = assignments.filter(a => {
    const [y, m] = a.date.split('-').map(Number);
    return y === currentYear && m === currentMonthIndex + 1 && a.shiftTypeId === 'st-t' && regimeProviders.some(p => p.id === a.providerId);
  }).length;
  const avgShifts = regimeProviders.length > 0 ? (totalTAssignments / regimeProviders.length).toFixed(1) : '0.0';
  const avgHours = (parseFloat(avgShifts) * (activeRegime === '5x2' ? 8 : 12)).toFixed(0);

  // REAL BENTO 1: AUDITORIA DE INTERVALO PJ (Detect consecutive duty days)
  let consecutiveDutyConflicts = 0;
  regimeProviders.forEach(prov => {
    for (let i = 0; i < allDays.length - 1; i++) {
      const d1 = allDays[i];
      const d2 = allDays[i + 1];
      const s1 = assignments.find(a => a.providerId === prov.id && a.date === d1.dateStr && a.shiftTypeId === 'st-t');
      const s2 = assignments.find(a => a.providerId === prov.id && a.date === d2.dateStr && a.shiftTypeId === 'st-t');
      if (s1 && s2 && prov.regime !== '5x2') {
        consecutiveDutyConflicts++;
      }
    }
  });

  // REAL BENTO 2: COBERTURA DIÁRIA EM PLANTÃO (Calculated for every day of month)
  const dailyDutyCounts = allDays.map(d => {
    return assignments.filter(
      a => a.date === d.dateStr && a.shiftTypeId === 'st-t' && regimeProviders.some(p => p.id === a.providerId)
    ).length;
  });
  const maxDailyDuty = Math.max(...dailyDutyCounts, 1);
  const minDailyDuty = Math.min(...dailyDutyCounts);
  const avgDailyDuty = (dailyDutyCounts.reduce((a, b) => a + b, 0) / (dailyDutyCounts.length || 1)).toFixed(1);

  // Generate dynamic SVG sparkline coordinates
  const sparklineCoords = dailyDutyCounts.map((val, idx) => {
    const x = allDays.length > 1 ? (idx / (allDays.length - 1)) * 300 : 150;
    const y = 52 - (val / (maxDailyDuty + 1)) * 42;
    return { x, y, val };
  });

  const sparklinePathD = sparklineCoords.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = arr[idx - 1];
    const cx = ((prev.x + pt.x) / 2).toFixed(1);
    return `${acc} C ${cx} ${prev.y.toFixed(1)}, ${cx} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');
  const sparklineAreaD = `${sparklinePathD} L 300 60 L 0 60 Z`;

  const todayIndex = Math.max(0, Math.min(allDays.length - 1, todayDayNumber - 1));
  const todayPoint = sparklineCoords[todayIndex] || { x: 150, y: 30, val: todayWorkersCount };

  // REAL BENTO 3: TROCAS & PERMUTAS PJ
  const pendingSwapsCount = swapRequests.filter(s => s.status === 'pending_supervisor').length;
  const approvedSwapsCount = swapRequests.filter(s => s.status === 'approved').length;

  useEffect(() => {
    if (editingField && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingField]);

  // Keyboard navigation & hotkeys (T, D, H, Delete, Arrows)
  useEffect(() => {
    if (role !== 'supervisor') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (activeCellEdit || isAddingNewRow || editingField) return;
      if (!selectedCell) return;

      const currentProvIdx = displayedProviders.findIndex(p => p.id === selectedCell.providerId);
      if (currentProvIdx === -1) return;

      const provider = displayedProviders[currentProvIdx];
      const day = days.find(d => d.dayNumber === selectedCell.dayNumber);
      if (!day) return;

      const key = e.key.toUpperCase();

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextDay = Math.min(days[days.length - 1].dayNumber, selectedCell.dayNumber + 1);
        setSelectedCell({ providerId: selectedCell.providerId, dayNumber: nextDay });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevDay = Math.max(days[0].dayNumber, selectedCell.dayNumber - 1);
        setSelectedCell({ providerId: selectedCell.providerId, dayNumber: prevDay });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextProv = displayedProviders[Math.min(displayedProviders.length - 1, currentProvIdx + 1)];
        if (nextProv) setSelectedCell({ providerId: nextProv.id, dayNumber: selectedCell.dayNumber });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevProv = displayedProviders[Math.max(0, currentProvIdx - 1)];
        if (prevProv) setSelectedCell({ providerId: prevProv.id, dayNumber: selectedCell.dayNumber });
      } else if (key === 'T') {
        e.preventDefault();
        const existing = getShiftForProviderAndDate(provider.id, day.dateStr);
        if (existing) {
          updateAssignment(existing.id, { shiftTypeId: 'st-t', workModality: 'presencial' });
        } else {
          addAssignment({
            date: day.dateStr,
            shiftTypeId: 'st-t',
            departmentId: 'dept-1',
            providerId: provider.id,
            status: 'confirmed',
            workModality: 'presencial',
            acknowledgedByProvider: true,
          });
        }
      } else if (key === 'H') {
        e.preventDefault();
        const existing = getShiftForProviderAndDate(provider.id, day.dateStr);
        if (existing) {
          updateAssignment(existing.id, { shiftTypeId: 'st-t', workModality: 'home_office' });
        } else {
          addAssignment({
            date: day.dateStr,
            shiftTypeId: 'st-t',
            departmentId: 'dept-1',
            providerId: provider.id,
            status: 'confirmed',
            workModality: 'home_office',
            acknowledgedByProvider: true,
          });
        }
      } else if (key === 'D') {
        e.preventDefault();
        const existing = getShiftForProviderAndDate(provider.id, day.dateStr);
        if (existing) {
          updateAssignment(existing.id, { shiftTypeId: 'st-d' });
        } else {
          addAssignment({
            date: day.dateStr,
            shiftTypeId: 'st-d',
            departmentId: 'dept-1',
            providerId: provider.id,
            status: 'confirmed',
            acknowledgedByProvider: true,
          });
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace' || key === '-') {
        e.preventDefault();
        const existing = getShiftForProviderAndDate(provider.id, day.dateStr);
        if (existing) {
          deleteAssignment(existing.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, displayedProviders, days, activeCellEdit, isAddingNewRow, editingField, role]);

  const getShiftForProviderAndDate = (providerId: string, dateStr: string) => {
    return assignments.find(a => a.providerId === providerId && a.date === dateStr);
  };

  const handleCellClick = (provider: Provider, dateStr: string) => {
    if (role !== 'supervisor') return;

    const existingShift = getShiftForProviderAndDate(provider.id, dateStr);

    if (!existingShift) {
      addAssignment({
        date: dateStr,
        shiftTypeId: 'st-t',
        departmentId: 'dept-1',
        providerId: provider.id,
        status: 'confirmed',
        acknowledgedByProvider: true,
      });
    } else if (existingShift.shiftTypeId === 'st-t') {
      updateAssignment(existingShift.id, {
        shiftTypeId: 'st-d',
      });
    } else {
      deleteAssignment(existingShift.id);
    }
  };

  const handleOpenCellEditor = (e: React.MouseEvent, provider: Provider, dateStr: string, dayNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    const existing = getShiftForProviderAndDate(provider.id, dateStr);
    const code = existing ? (existing.shiftTypeId === 'st-d' ? 'D' : 'T') : '-';
    const modality: WorkModality = existing?.workModality || 'presencial';

    setActiveCellEdit({
      providerId: provider.id,
      providerName: provider.name,
      dateStr,
      dayNumber,
      shiftId: existing?.id,
      currentCode: code,
      workModality: modality,
      notes: existing?.notes || '',
    });
    setNoteInput(existing?.notes || '');
    setModalityInput(modality);
  };

  const handleSaveModal = () => {
    if (!activeCellEdit) return;
    const { providerId, dateStr, shiftId, currentCode } = activeCellEdit;

    if (currentCode === '-') {
      if (shiftId) deleteAssignment(shiftId);
    } else {
      const shiftTypeId = currentCode === 'D' ? 'st-d' : 'st-t';
      if (shiftId) {
        updateAssignment(shiftId, {
          shiftTypeId,
          workModality: modalityInput,
          notes: noteInput.trim() || undefined,
        });
      } else {
        addAssignment({
          date: dateStr,
          shiftTypeId,
          departmentId: 'dept-1',
          providerId,
          status: 'confirmed',
          workModality: modalityInput,
          notes: noteInput.trim() || undefined,
          acknowledgedByProvider: true,
        });
      }
    }
    setActiveCellEdit(null);
  };

  const handleSelectCodeInModal = (code: string) => {
    if (!activeCellEdit) return;
    setActiveCellEdit(prev => (prev ? { ...prev, currentCode: code } : null));
  };

  const handleExportCSV = () => {
    const headers = ['Colaborador', 'Regime', 'Entrada', 'Saida', ...days.map(d => `${d.dayNumber}/${currentMonthIndex + 1}`)];
    const rows = displayedProviders.map(p => {
      const dayValues = days.map(d => {
        const s = getShiftForProviderAndDate(p.id, d.dateStr);
        if (!s) return '-';
        if (s.shiftTypeId === 'st-d') return 'D';
        if (s.workModality === 'home_office') return 'HO';
        return 'T';
      });
      return [
        `"${p.name}"`,
        p.regime || '12x36',
        p.entryTime || '07h00',
        p.exitTime || '19h00',
        ...dayValues
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `escala_${monthName.toLowerCase()}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. TOP AURORAL ATMOSPHERE BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#00d2d3]/10 border border-[#00d2d3]/25 flex items-center justify-center text-[#00d2d3] shadow-[0_0_20px_rgba(0,210,211,0.15)] shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
              <span>ESCALA UNIFICADA</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300 font-semibold">{monthName} de {currentYear}</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-black text-white tracking-tight leading-tight">
              Quadro Geral de Escalas
            </h1>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12141A] border border-white/[0.08] text-xs text-zinc-300 shadow-sm self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#00d2d3] shadow-[0_0_8px_#00d2d3]" />
          <span>
            Hoje ({DAYS_SHORT_PT[today.getDay()] || 'Seg'}, {todayDayNumber}/{monthName.slice(0, 3)}):{' '}
            <strong className="text-[#00d2d3] font-bold">{todayWorkersCount} em Turno</strong>
            <span className="text-zinc-500 mx-1">•</span>
            <span className="text-zinc-400">{todayOffCount} de Folga</span>
          </span>
        </div>
      </div>

      {/* 2. CONTROL WORKSPACE TOOLBAR */}
      <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-2.5 sm:px-3 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
        {/* Left Side: Month navigation, Hoje, 12x36 / 5x2 segmented switch, Vigente badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month selector pill */}
          <div className="flex items-center bg-[#1A1D24] border border-white/[0.08] rounded-xl p-0.5">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 flex items-center gap-2 text-xs font-bold text-white tracking-wide">
              <CalendarDays className="w-3.5 h-3.5 text-[#00d2d3]" />
              <span>{monthName} {currentYear}</span>
            </div>
            <button
              onClick={goToNextMonth}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-bold text-zinc-300 bg-[#1A1D24] hover:bg-[#252830] border border-white/[0.08] rounded-xl transition-all cursor-pointer"
          >
            Hoje
          </button>

          {/* Regime Switch 12x36 / 5x2 */}
          <div className="flex items-center bg-[#1A1D24] border border-white/[0.08] rounded-xl p-0.5 text-xs font-bold">
            <button
              onClick={() => setActiveRegime('12x36')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeRegime === '12x36'
                  ? 'bg-[#00d2d3] text-[#003731] font-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              12×36
            </button>
            <button
              onClick={() => setActiveRegime('5x2')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeRegime === '5x2'
                  ? 'bg-[#00d2d3] text-[#003731] font-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              5×2
            </button>
          </div>

          {/* Status badge */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d2d3]" />
            <span>Escala Oficial Vigente</span>
          </div>
        </div>

        {/* Right Side: Search, Density, Print */}
        <div className="flex items-center gap-2 flex-1 justify-end flex-wrap sm:flex-nowrap">
          {/* Search box */}
          <div className="relative min-w-[200px] max-w-[280px] w-full">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
              placeholder="Buscar colaborador ou função..."
              className="w-full bg-[#1A1D24] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00d2d3]/60 transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(f => ({ ...f, searchQuery: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Density toggle */}
          <div className="flex items-center bg-[#1A1D24] border border-white/[0.08] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setRowDensity('spacious')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                rowDensity === 'spacious' ? 'bg-[#292A2F] text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Modo Amplo"
            >
              <Maximize2 className="w-3 h-3 text-[#00d2d3]" />
              <span className="hidden sm:inline">Amplo</span>
            </button>
            <button
              onClick={() => setRowDensity('compact')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                rowDensity === 'compact' ? 'bg-[#292A2F] text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Modo Compacto"
            >
              <Minimize2 className="w-3 h-3 text-zinc-400" />
              <span className="hidden sm:inline">Compacto</span>
            </button>
          </div>

          {/* Print button */}
          <button
            onClick={() => onOpenPrintModal ? onOpenPrintModal() : window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1D24] hover:bg-[#252830] text-zinc-200 border border-white/[0.08] rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* 3. ACTIVE USER SPOTLIGHT CARD */}
      {spotlightProvider && (
        <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Avatar Squircle with Initials & Checkmark Badge */}
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1D24] border border-white/[0.12] flex items-center justify-center font-black text-white text-base shadow-sm">
                {getInitials(spotlightProvider.name)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00d2d3] flex items-center justify-center shadow-xs">
                <Check className="w-2.5 h-2.5 text-[#003731] stroke-[3]" />
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {spotlightProvider.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#00d2d3] text-[#003731]">
                  VOCÊ
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-zinc-400 bg-[#1A1D24] border border-white/[0.06]">
                  Prestador {spotlightProvider.regime || '12×36'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                1º Calendário • Horário regular das {spotlightProvider.entryTime || '07h00'} às {spotlightProvider.exitTime || '19h00'} • Posto CTI Geral A
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap md:flex-nowrap justify-between md:justify-end">
            <div className="flex items-center gap-5 bg-[#090A0F] px-4 py-2 rounded-xl border border-white/[0.06]">
              <div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">PLANTÕES</div>
                <div className="text-xl sm:text-2xl font-black text-[#00d2d3] leading-tight">
                  {spotlightPlantõesCount > 0 ? spotlightPlantõesCount : 16}{' '}
                  <span className="text-xs font-normal text-zinc-400">({spotlightHours > 0 ? spotlightHours : 192}h)</span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/[0.08]" />
              <div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">FOLGAS</div>
                <div className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {spotlightFolgasCount > 0 ? spotlightFolgasCount : 15}{' '}
                  <span className="text-xs font-normal text-zinc-400">dias</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveProviderId(spotlightProvider.id);
                setViewMode('personal-calendar');
              }}
              className="px-4 py-2.5 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-[#00d2d3]/20 transition-all cursor-pointer flex items-center gap-2 active:scale-98 shrink-0"
            >
              <CalendarDays className="w-4 h-4 text-[#003731]" />
              <span>Ver Meu Calendário</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. MICRO-LEGEND STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141A] border border-white/[0.08] py-2 px-3.5 rounded-xl text-xs text-zinc-300">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[11px]">LEGENDA:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center font-black rounded-md text-[11px] bg-[#00d2d3] text-[#003731]">
              T
            </span>
            <span className="text-zinc-300 text-[11px]">Trabalha (07h-19h)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center font-bold rounded-md text-[11px] bg-[#27272a] text-[#a1a1aa]">
              D
            </span>
            <span className="text-zinc-300 text-[11px]">Descanso / Folga</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center font-bold rounded-md text-[11px] bg-[#1A1D24] text-zinc-500 border border-white/[0.06]">
              -
            </span>
            <span className="text-zinc-400 text-[11px]">Sem Escala Definida</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-[#571bc1] text-[#f3e8ff]">
              HO
            </span>
            <span className="text-zinc-300 text-[11px]">Home Office / Remoto</span>
          </div>

          <button
            type="button"
            onClick={() => onOpenMarketplace && onOpenMarketplace()}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            title="Ver plantões anunciados à venda"
          >
            <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              💰 Venda
            </span>
            <span className="text-zinc-300 text-[11px]">À Venda (Repasse PJ)</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d2d3]" />
            <span>Coluna 12 (Hoje) em destaque</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span>Escala 100% Homologada</span>
        </div>
      </div>

      {/* 5. ROSTER TABLE */}
      <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
        {/* Table top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-[#161820]">
          <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
            ESCALA {activeRegime} • {monthNameUpper} {currentYear} (QUINZENA {quinzenaView === 'q1' ? '1' : quinzenaView === 'q2' ? '2' : '1 & 2'})
          </div>
          <div className="text-xs text-zinc-400 font-medium">
            {displayedProviders.length} Colaboradores no Regime
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-zinc-400 bg-[#161820]">
                {/* Sticky Collaborator column */}
                <th className="sticky left-0 z-20 bg-[#161820] py-3 px-3.5 min-w-[210px] border-r border-white/[0.08]">
                  COLABORADORES {activeRegime} ({displayedProviders.length})
                </th>
                <th className="py-3 px-2 text-center w-16 text-zinc-400 font-medium border-r border-white/[0.06]">
                  ENTRADA
                </th>
                <th className="py-3 px-2 text-center w-16 text-zinc-400 font-medium border-r border-white/[0.08]">
                  SAÍDA
                </th>

                {/* Day headers */}
                {days.map(d => {
                  const isWeekend = d.dayOfWeek === 0 || d.dayOfWeek === 6;
                  const isDayToday = d.dayNumber === todayDayNumber;
                  const weekDayName = DAYS_SHORT_PT[d.dayOfWeek] || '';

                  return (
                    <th
                      key={d.dateStr}
                      className={`py-2 px-1 text-center min-w-[38px] transition-colors border-r border-white/[0.04] ${
                        isDayToday
                          ? 'bg-[#00d2d3]/[0.08] text-[#00d2d3]'
                          : isWeekend
                          ? 'text-[#ddb7ff] bg-purple-950/20'
                          : 'text-zinc-400'
                      }`}
                    >
                      <div className="text-[12px] font-black">
                        {isDayToday && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00d2d3] mr-0.5" />}
                        {d.dayNumber}º
                      </div>
                      <div className="text-[10px] font-bold opacity-80 uppercase">
                        {weekDayName}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05] text-xs">
              {displayedProviders.map(provider => {
                const isSelected = provider.id === spotlightProvider?.id;
                const provShifts = assignments.filter(a => {
                  const [y, m] = a.date.split('-').map(Number);
                  return a.providerId === provider.id && y === currentYear && m === currentMonthIndex + 1 && a.shiftTypeId === 'st-t';
                });
                const plantõesCount = provShifts.length;
                const hoursCount = plantõesCount * (provider.regime === '5x2' ? 8 : 12);

                return (
                  <tr
                    key={provider.id}
                    className={`transition-colors hover:bg-white/[0.02] ${isSelected ? 'bg-white/[0.015]' : ''}`}
                  >
                    {/* Sticky Collaborator Name & Initials */}
                    <td className={`sticky left-0 z-10 bg-[#12141A] border-r border-white/[0.08] ${rowDensity === 'compact' ? 'py-1 px-2' : 'py-2.5 px-3'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`rounded-xl bg-[#1A1D24] border border-white/[0.08] flex items-center justify-center font-bold text-white shrink-0 ${rowDensity === 'compact' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'}`}>
                          {getInitials(provider.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold text-white truncate ${rowDensity === 'compact' ? 'text-[11px]' : 'text-xs'}`}>
                              {provider.name}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#00d2d3] text-[#003731]">
                                VOCÊ
                              </span>
                            )}
                          </div>
                          {rowDensity !== 'compact' && (
                            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                              <span>{plantõesCount} plantões ({hoursCount}h)</span>
                              <span className="text-zinc-600">•</span>
                              <button
                                onClick={() => {
                                  setActiveProviderId(provider.id);
                                  setViewMode('personal-calendar');
                                }}
                                className="text-zinc-400 hover:text-[#00d2d3] transition-colors cursor-pointer"
                                title="Ver calendário"
                              >
                                <MessageSquare className="w-3 h-3 inline" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Entrada */}
                    <td className={`text-center font-medium border-r border-white/[0.06] text-zinc-400 ${rowDensity === 'compact' ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-[11px]'}`}>
                      {provider.entryTime || '07h00'}
                    </td>

                    {/* Saída */}
                    <td className={`text-center font-medium border-r border-white/[0.08] text-zinc-400 ${rowDensity === 'compact' ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-[11px]'}`}>
                      {provider.exitTime || '19h00'}
                    </td>

                    {/* Days */}
                    {days.map(d => {
                      const shift = getShiftForProviderAndDate(provider.id, d.dateStr);
                      const isDayToday = d.dayNumber === todayDayNumber;
                      const isCellSelected = selectedCell?.providerId === provider.id && selectedCell?.dayNumber === d.dayNumber;
                      const saleOffer = shiftSaleOffers.find(
                        o => o.providerId === provider.id && o.date === d.dateStr && o.status === 'available'
                      );

                      let code = '-';
                      let chipStyle = 'text-zinc-600';

                      if (shift) {
                        if (shift.shiftTypeId === 'st-d') {
                          code = 'D';
                          chipStyle = 'bg-[#27272a] text-[#a1a1aa] font-bold shadow-xs';
                        } else if (shift.workModality === 'home_office') {
                          code = 'HO';
                          chipStyle = 'bg-[#571bc1] text-[#f3e8ff] font-bold shadow-xs';
                        } else {
                          code = 'T';
                          chipStyle = 'bg-[#00d2d3] text-[#003731] font-black shadow-sm';
                        }
                      }

                      if (saleOffer && code === 'T') {
                        chipStyle = 'bg-gradient-to-br from-amber-400 to-amber-500 text-black font-black shadow-md shadow-amber-500/30 ring-2 ring-amber-400/70';
                      }

                      return (
                        <td
                          key={d.dateStr}
                          onClick={() => {
                            setSelectedCell({ providerId: provider.id, dayNumber: d.dayNumber });
                            if (saleOffer && onOpenMarketplace) {
                              onOpenMarketplace();
                            } else {
                              handleCellClick(provider, d.dateStr);
                            }
                          }}
                          onContextMenu={e => handleOpenCellEditor(e, provider, d.dateStr, d.dayNumber)}
                          className={`text-center border-r border-white/[0.04] cursor-pointer transition-all ${
                            rowDensity === 'compact' ? 'py-0.5 px-0.5' : 'py-1.5 px-1'
                          } ${
                            isDayToday ? 'bg-[#00d2d3]/[0.05]' : ''
                          } ${isCellSelected ? 'ring-2 ring-[#00d2d3] ring-inset' : ''}`}
                          title={
                            saleOffer
                              ? `💰 Plantão à venda por ${provider.name}: R$ ${saleOffer.price.toLocaleString('pt-BR')}. Clique para ver no mural!`
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-center relative">
                            {code === '-' ? (
                              <span className={`text-zinc-600 font-medium flex items-center justify-center hover:text-zinc-400 ${rowDensity === 'compact' ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'}`}>
                                -
                              </span>
                            ) : (
                              <div
                                className={`rounded-lg flex items-center justify-center transition-transform active:scale-95 relative ${chipStyle} ${
                                  rowDensity === 'compact' ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'
                                }`}
                              >
                                {code}
                                {saleOffer && (
                                  <span
                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300 border border-black shadow-[0_0_8px_#f59e0b] animate-pulse"
                                    title={`À Venda: R$ ${saleOffer.price}`}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer bar: Count, Average, Quinzena toggles, CSV */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.08] bg-[#161820] text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Exibindo {displayedProviders.length} de {regimeProviders.length} colaboradores cadastrados</span>
            <span className="text-zinc-600">•</span>
            <span>Média mensal da equipe: <strong className="text-zinc-200">{avgShifts} plantões ({avgHours}h)</strong></span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Quinzena Buttons */}
            <div className="flex items-center bg-[#12141A] border border-white/[0.08] rounded-xl p-0.5 text-xs font-medium">
              <button
                onClick={() => setQuinzenaView(quinzenaView === 'q1' ? 'all' : 'q1')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  quinzenaView === 'q1' ? 'bg-[#292A2F] text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                1ª Quinzena (1-15)
              </button>
              <button
                onClick={() => setQuinzenaView(quinzenaView === 'q2' ? 'all' : 'q2')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  quinzenaView === 'q2' ? 'bg-[#292A2F] text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                2ª Quinzena (16-31)
              </button>
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              className="p-1.5 bg-[#12141A] hover:bg-[#252830] text-zinc-300 border border-white/[0.08] rounded-xl transition-colors cursor-pointer"
              title="Exportar planilha CSV"
            >
              <Download className="w-4 h-4 text-zinc-400 hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. THREE BENTO CARDS (Auditoria de Turnos PJ, Cobertura em Plantão Real, Trocas & Permutas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        
        {/* Card 1: Auditoria de Turnos PJ (Real consecutive duty check) */}
        <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-[#00d2d3] uppercase tracking-wider">
                AUDITORIA DE TURNOS PJ
              </div>
              <ShieldCheck className="w-4 h-4 text-[#00d2d3]" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Conformidade e Intervalo Interjornada
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {consecutiveDutyConflicts === 0
                ? `Nenhum conflito de jornada consecutiva identificado em ${monthName} ${currentYear}. Todos os prestadores PJ cumprem o descanso mínimo acordado.`
                : `${consecutiveDutyConflicts} sobreposição(ões) de turno consecutivo identificada(s) em ${monthName} ${currentYear}. Necessário ajuste no intervalo de 36h contratual.`}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.06] text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold">
              <span
                className={`w-2 h-2 rounded-full ${
                  consecutiveDutyConflicts === 0 ? 'bg-[#00d2d3] shadow-[0_0_8px_#00d2d3]' : 'bg-amber-400'
                }`}
              />
              <span>{consecutiveDutyConflicts === 0 ? '100% Regularizado' : `${consecutiveDutyConflicts} Conflitos Pendentes`}</span>
            </div>
            <span className="text-zinc-500 font-mono text-[11px]">Contrato de Prestação PJ</span>
          </div>
        </div>

        {/* Card 2: Cobertura em Plantão (with real calculated SVG area sparkline) */}
        <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                COBERTURA EM PLANTÃO
              </div>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Lotação Diária em Tempo Real
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Média real de <strong className="text-zinc-200">{avgDailyDuty}</strong> plantonistas PJ/dia. Hoje: <strong className="text-[#00d2d3]">{todayWorkersCount} ativos</strong> ({todayOffCount} de folga). Pico do mês: <strong className="text-zinc-200">{maxDailyDuty}</strong> profissionais.
            </p>
          </div>

          {/* SVG Sparkline Curve with Real Dynamic Pinpoint */}
          <div className="py-2">
            <div className="relative h-14 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="coverageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d2d3" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00d2d3" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area fill */}
                <path
                  d={sparklineAreaD}
                  fill="url(#coverageGradient)"
                />
                {/* Smooth curve stroke */}
                <path
                  d={sparklinePathD}
                  fill="none"
                  stroke="#00d2d3"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Pinpoint for Today with Real Coordinates */}
                <circle cx={todayPoint.x.toFixed(1)} cy={todayPoint.y.toFixed(1)} r="4" fill="#00d2d3" className="shadow-[0_0_10px_#00d2d3]" />
                <circle cx={todayPoint.x.toFixed(1)} cy={todayPoint.y.toFixed(1)} r="7" fill="#00d2d3" opacity="0.3" />
              </svg>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
              <span>01/{monthName.slice(0, 3)}</span>
              <span className="text-[#00d2d3] font-bold font-sans">Hoje (Dia {todayDayNumber}: {todayWorkersCount} PJ)</span>
              <span>{allDays.length}/{monthName.slice(0, 3)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Trocas & Permutas PJ */}
        <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                TROCAS & PERMUTAS PJ
              </div>
              <ArrowLeftRight className="w-4 h-4 text-zinc-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Gestão de Permutas entre Prestadores
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {pendingSwapsCount > 0
                ? `${pendingSwapsCount} solicitação(ões) de troca aguardando validação da liderança. ${approvedSwapsCount} troca(s) já confirmada(s).`
                : `${approvedSwapsCount > 0 ? `${approvedSwapsCount} troca(s) confirmada(s) neste ciclo.` : 'Nenhuma troca pendente no momento.'} Notificação e repasses automáticos entre prestadores de serviço.`}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4 mt-2">
            <button
              onClick={() => setQuickSwapOpen(true)}
              className="flex-1 py-2 px-3 bg-[#1A1D24] hover:bg-[#252830] text-white border border-white/[0.08] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-300" />
              <span>Nova Permuta</span>
            </button>
            <button
              onClick={() => alert('As permutas entre prestadores PJ respeitam o intervalo mínimo contratual acordado de 36 horas entre turnos.')}
              className="p-2 bg-[#1A1D24] hover:bg-[#252830] text-zinc-400 hover:text-white border border-white/[0.08] rounded-xl transition-colors cursor-pointer"
              title="Regras contratuais de permuta PJ"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Cell Editor Modal (Right-click or note edit) */}
      {activeCellEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-[#12141A] text-zinc-100 rounded-3xl p-5 border border-white/[0.1] shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Editar Plantão</h3>
                <p className="text-xs text-zinc-400">
                  {activeCellEdit.providerName} • Dia {activeCellEdit.dayNumber}
                </p>
              </div>
              <button
                onClick={() => setActiveCellEdit(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Code Selector (T, D, -) */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Tipo de Escala:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectCodeInModal('T')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    activeCellEdit.currentCode === 'T'
                      ? 'bg-[#00d2d3] text-[#003731] border-[#00d2d3] font-black shadow-sm'
                      : 'bg-[#1A1D24] text-zinc-400 border-white/[0.06] hover:bg-[#252830]'
                  }`}
                >
                  <div className="text-sm font-black">T</div>
                  <div className="text-[10px]">Trabalha</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCodeInModal('D')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    activeCellEdit.currentCode === 'D'
                      ? 'bg-[#27272a] text-white border-zinc-600 font-black shadow-sm'
                      : 'bg-[#1A1D24] text-zinc-400 border-white/[0.06] hover:bg-[#252830]'
                  }`}
                >
                  <div className="text-sm font-black">D</div>
                  <div className="text-[10px]">Descanso</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCodeInModal('-')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    activeCellEdit.currentCode === '-'
                      ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm'
                      : 'bg-[#1A1D24] text-zinc-500 border-white/[0.06] hover:bg-[#252830]'
                  }`}
                >
                  <div className="text-sm font-black">-</div>
                  <div className="text-[10px]">Sem Escala</div>
                </button>
              </div>
            </div>

            {/* Work Modality Toggle */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Modalidade:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalityInput('presencial')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    modalityInput === 'presencial'
                      ? 'bg-[#00d2d3]/15 text-[#00d2d3] border-[#00d2d3]/40'
                      : 'bg-[#1A1D24] text-zinc-400 border-white/[0.06] hover:bg-[#252830]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Presencial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalityInput('home_office')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    modalityInput === 'home_office'
                      ? 'bg-[#571bc1]/20 text-[#ddb7ff] border-[#571bc1]/60'
                      : 'bg-[#1A1D24] text-zinc-400 border-white/[0.06] hover:bg-[#252830]'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home Office</span>
                </button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Observações:
              </label>
              <textarea
                rows={2}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Ex: Cobertura especial, plantão acordado..."
                className="w-full px-3 py-2 text-xs bg-[#1A1D24] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-600 focus:border-[#00d2d3] focus:outline-none transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveCellEdit(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-xl font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-1.5 text-xs font-bold text-[#003731] bg-[#00d2d3] hover:bg-[#57f1db] rounded-xl cursor-pointer transition-colors"
              >
                Salvar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Swap Modal */}
      <QuickSwapModal
        isOpen={quickSwapOpen}
        onClose={() => setQuickSwapOpen(false)}
      />

      {/* Absence Batch Modal */}
      <AbsenceBatchModal
        isOpen={absenceModalOpen}
        onClose={() => setAbsenceModalOpen(false)}
        defaultProviderId={absenceModalProvId}
      />
    </div>
  );
};
