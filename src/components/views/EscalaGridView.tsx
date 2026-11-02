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
  Moon,
  Sun,
  Wand2,
  Sparkles,
  MessageSquare,
  ChevronDown,
  RotateCcw,
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
  AlertTriangle
} from 'lucide-react';
import { Provider, WorkModality, WorkRegime } from '../../types';
import { CollaboratorAuthModal } from '../modals/CollaboratorAuthModal';
import { AbsenceBatchModal } from '../modals/AbsenceBatchModal';
import { shareProviderWhatsApp } from '../../utils/shareUtils';

interface EscalaGridViewProps {
  onAddProvider?: () => void;
  onOpenCollaboratorAuth?: (provider: Provider) => void;
  onOpenPrintModal?: () => void;
}

export const EscalaGridView: React.FC<EscalaGridViewProps> = ({
  onAddProvider,
  onOpenCollaboratorAuth,
  onOpenPrintModal,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    providers,
    assignments,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    role,
    activeProviderId,
    setActiveProviderId,
    updateProvider,
    deleteProvider,
    addProvider,
    resetToDemoData,
    setViewMode,
    authenticatedProviderId,
    isLeaderAuthenticated,
    batchFillProviderMonth,
    applyTeamGroupsSchedule,
    isMonthPublished,
    toggleMonthPublishStatus,
    activeRegime,
    setActiveRegime,
    toggleWorkModality,
    filters,
  } = useSchedule();

  // Absence Modal state
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [absenceModalProvId, setAbsenceModalProvId] = useState<string | undefined>(undefined);

  // Selected cell for keyboard navigation & hotkeys
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

  // Row Quick Actions Menu (e.g., fill 12x36)
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);

  // Theme: 'sheet' (Clean Friendly Clinical Roster) or 'dark'
  const [sheetTheme, setSheetTheme] = useState<'dark' | 'sheet'>('sheet');

  // Row density: 'spacious' (default, comfortable and well-separated) or 'compact'
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

  const getDailyWorkersCount = (dateStr: string) => {
    return assignments.filter(
      a => a.date === dateStr && a.shiftTypeId === 'st-t' && regimeProviders.some(p => p.id === a.providerId)
    ).length;
  };

  const days = getMonthDaysArray(currentYear, currentMonthIndex);
  const monthName = MONTH_NAMES_PT[currentMonthIndex].toUpperCase();

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

      // Navigation with arrow keys
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextDay = Math.min(days.length, selectedCell.dayNumber + 1);
        setSelectedCell({ providerId: selectedCell.providerId, dayNumber: nextDay });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevDay = Math.max(1, selectedCell.dayNumber - 1);
        setSelectedCell({ providerId: selectedCell.providerId, dayNumber: prevDay });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextProv = displayedProviders[Math.min(displayedProviders.length - 1, currentProvIdx + 1)];
        if (nextProv) setSelectedCell({ providerId: nextProv.id, dayNumber: selectedCell.dayNumber });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevProv = displayedProviders[Math.max(0, currentProvIdx - 1)];
        if (prevProv) setSelectedCell({ providerId: prevProv.id, dayNumber: selectedCell.dayNumber });
      }

      // Hotkey T -> Trabalha Presencial
      else if (key === 'T') {
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
      }

      // Hotkey H -> Trabalha Home Office
      else if (key === 'H') {
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
      }

      // Hotkey D -> Descanso
      else if (key === 'D') {
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
      }

      // Hotkey Delete / Backspace / - -> Clear shift
      else if (e.key === 'Delete' || e.key === 'Backspace' || key === '-') {
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

  // Helper to find shift
  const getShiftForProviderAndDate = (providerId: string, dateStr: string) => {
    return assignments.find(a => a.providerId === providerId && a.date === dateStr);
  };

  // Fast cycle on single click: '-' -> 'T' (Trabalha) -> 'D' (Descanso) -> '-'
  const handleCellClick = (provider: Provider, dateStr: string) => {
    if (role !== 'supervisor') return;

    const existingShift = getShiftForProviderAndDate(provider.id, dateStr);

    if (!existingShift) {
      // First click: Create 'T' (Trabalha)
      addAssignment({
        date: dateStr,
        shiftTypeId: 'st-t',
        departmentId: 'dept-1',
        providerId: provider.id,
        status: 'confirmed',
        acknowledgedByProvider: true,
      });
    } else if (existingShift.shiftTypeId === 'st-t') {
      // Second click: Change to 'D' (Descanso)
      updateAssignment(existingShift.id, {
        shiftTypeId: 'st-d',
      });
    } else {
      // Third click: Remove (Folga / Sem Escala '-')
      deleteAssignment(existingShift.id);
    }
  };

  // Open rich cell editor (on right click or click on note triangle)
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

  const handleSelectCodeInModal = (code: 'D' | 'T' | '-') => {
    if (!activeCellEdit) return;

    if (code === '-') {
      if (activeCellEdit.shiftId) {
        deleteAssignment(activeCellEdit.shiftId);
      }
      setActiveCellEdit(prev => prev ? { ...prev, currentCode: '-', shiftId: undefined } : null);
    } else {
      const shiftTypeId = code === 'D' ? 'st-d' : 'st-t';
      if (activeCellEdit.shiftId) {
        updateAssignment(activeCellEdit.shiftId, { shiftTypeId, workModality: modalityInput });
      } else {
        const newId = addAssignment({
          date: activeCellEdit.dateStr,
          shiftTypeId,
          departmentId: 'dept-1',
          providerId: activeCellEdit.providerId,
          status: 'confirmed',
          workModality: modalityInput,
          notes: noteInput.trim() || undefined,
          acknowledgedByProvider: true,
        });
        setActiveCellEdit(prev => prev ? { ...prev, currentCode: code, shiftId: newId } : null);
        return;
      }
      setActiveCellEdit(prev => prev ? { ...prev, currentCode: code } : null);
    }
  };

  const handleSaveModal = () => {
    if (!activeCellEdit) return;

    if (activeCellEdit.shiftId) {
      updateAssignment(activeCellEdit.shiftId, {
        notes: noteInput.trim() || undefined,
        workModality: modalityInput,
      });
    } else if (activeCellEdit.currentCode !== '-') {
      addAssignment({
        date: activeCellEdit.dateStr,
        shiftTypeId: activeCellEdit.currentCode === 'D' ? 'st-d' : 'st-t',
        departmentId: 'dept-1',
        providerId: activeCellEdit.providerId,
        status: 'confirmed',
        workModality: modalityInput,
        notes: noteInput.trim() || undefined,
        acknowledgedByProvider: true,
      });
    }
    setActiveCellEdit(null);
  };

  // Start inline edit of provider info
  const startEditingField = (provider: Provider, field: 'name' | 'entry' | 'exit') => {
    if (role !== 'supervisor') return;
    setEditingProviderId(provider.id);
    setEditingField(field);
    if (field === 'name') setEditValue(provider.name);
    else if (field === 'entry') setEditValue(provider.entryTime || '07h00');
    else if (field === 'exit') setEditValue(provider.exitTime || '19h00');
  };

  const saveEditingField = () => {
    if (!editingProviderId || !editingField) return;

    const val = editValue.trim();
    if (editingField === 'name' && val) {
      updateProvider(editingProviderId, { name: val });
    } else if (editingField === 'entry' && val) {
      updateProvider(editingProviderId, { entryTime: val });
    } else if (editingField === 'exit' && val) {
      updateProvider(editingProviderId, { exitTime: val });
    }

    setEditingProviderId(null);
    setEditingField(null);
  };

  const handleKeyDownEdit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEditingField();
    if (e.key === 'Escape') {
      setEditingProviderId(null);
      setEditingField(null);
    }
  };

  // Add new provider row
  const handleAddNewProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addProvider({
      name: newName.trim(),
      role: activeRegime === '5x2' ? 'Técnico / Administrativo' : 'Prestador',
      regime: activeRegime,
      entryTime: newEntry.trim() || (activeRegime === '5x2' ? '08h00' : '07h00'),
      exitTime: newExit.trim() || (activeRegime === '5x2' ? '17h00' : '19h00'),
      email: `${newName.toLowerCase().replace(/\s+/g, '.')}@escala.com`,
      phone: '(11) 90000-0000',
      color: activeRegime === '5x2' ? 'teal' : 'indigo',
      maxMonthlyHours: activeRegime === '5x2' ? 176 : 180,
      status: 'active',
    });

    setNewName('');
    setIsAddingNewRow(false);
  };

  // Delete provider
  const handleDeleteProvider = (providerId: string, providerName: string) => {
    if (role !== 'supervisor') return;
    if (window.confirm(`Tem certeza que deseja remover "${providerName}" da escala?`)) {
      deleteProvider(providerId);
    }
  };

  // Batch fill row pattern
  const handleFillRowPattern = (providerId: string, pattern: '12x36_D_start' | '12x36_T_start' | 'all_D' | 'all_T' | 'clear') => {
    // Remove existing shifts for this provider in current month
    days.forEach(d => {
      const existing = getShiftForProviderAndDate(providerId, d.dateStr);
      if (existing) deleteAssignment(existing.id);
    });

    if (pattern === 'clear') {
      setRowMenuOpenId(null);
      return;
    }

    days.forEach((d, idx) => {
      let code: 'D' | 'T' | '-' = '-';
      if (pattern === '12x36_D_start') {
        code = idx % 2 === 0 ? 'D' : 'T';
      } else if (pattern === '12x36_T_start') {
        code = idx % 2 === 0 ? 'T' : 'D';
      } else if (pattern === 'all_D') {
        code = 'D';
      } else if (pattern === 'all_T') {
        code = 'T';
      }

      if (code !== '-') {
        addAssignment({
          date: d.dateStr,
          shiftTypeId: code === 'D' ? 'st-d' : 'st-t',
          departmentId: 'dept-1',
          providerId,
          status: 'confirmed',
          acknowledgedByProvider: true,
        });
      }
    });

    setRowMenuOpenId(null);
  };

  // Selected provider summary for collaborator mode and individual card
  const selectedProvider = providers.find(p => p.id === activeProviderId) || providers[0];
  const selectedProviderShifts = assignments.filter(a => {
    const [y, m] = a.date.split('-').map(Number);
    return a.providerId === selectedProvider?.id && y === currentYear && m === currentMonthIndex + 1;
  });

  const countD = selectedProviderShifts.filter(s => s.shiftTypeId === 'st-d').length;
  const countT = selectedProviderShifts.filter(s => s.shiftTypeId === 'st-t').length;
  const countFolgas = Math.max(0, days.length - countT);

  return (
    <div className="space-y-3">
      {/* 👤 INDIVIDUAL USER SECTION (DANIEL ANTONIO DA SILVA / Active User) */}
      {selectedProvider && (
        <div className="bg-[#141c28] border border-[#1e2a3a] rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/90 border-2 border-cyan-500/40 flex items-center justify-center font-black text-xl text-cyan-400 shadow-md ring-4 ring-cyan-500/10 shrink-0">
              {getInitials(selectedProvider.name)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                  {selectedProvider.name}
                </h2>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-400/40 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Você
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Primeiro Calendário • {selectedProvider.role} ({selectedProvider.entryTime || '07h00'} às {selectedProvider.exitTime || '19h00'})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-5 sm:gap-6 bg-[#0c121c] px-5 py-2.5 rounded-xl border border-[#1e2a3a]">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Plantões
                </div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 leading-tight">
                  {countT > 0 ? countT : 16}
                </div>
              </div>
              <div className="w-px h-8 bg-[#1e2a3a]" />
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Folgas
                </div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 leading-tight">
                  {countD > 0 ? countD : (countFolgas > 0 ? countFolgas : 15)}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveProviderId(selectedProvider.id);
                setViewMode('personal-calendar');
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all cursor-pointer flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4 text-cyan-200" />
              <span>Ver Meu Calendário</span>
            </button>
          </div>
        </div>
      )}

      {/* Legend & Grid View Controls (Clean Cyan Dark Bar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141c28] border border-[#1e2a3a] py-2.5 px-4 rounded-2xl text-xs shadow-md text-slate-200">
        {/* Updated Cyan / Medium Grey / Soft Purple Legend */}
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Legenda:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 flex items-center justify-center font-black rounded-lg text-xs bg-cyan-500 text-slate-950 shadow-sm">
              T
            </span>
            <span className="text-slate-200 font-bold text-xs">Trabalha</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 flex items-center justify-center font-bold rounded-lg text-xs bg-slate-700/80 text-slate-200 border border-slate-600/50 shadow-sm">
              D
            </span>
            <span className="text-slate-200 font-bold text-xs">Descanso</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 flex items-center justify-center font-bold rounded-lg text-xs bg-[#0c121c] text-slate-500 border border-[#1e2a3a]">
              -
            </span>
            <span className="text-slate-400 text-xs">Sem Escala</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50">
              HO
            </span>
            <span className="text-slate-200 font-bold text-xs">Home Office</span>
          </div>
        </div>

        {/* Right Tools: Add Provider, Density, Turmas */}
        <div className="flex items-center gap-2 flex-wrap">
          {role === 'supervisor' && (
            <>
              {/* Absence / Vacation Batch Modal Trigger */}
              <button
                onClick={() => {
                  setAbsenceModalProvId(undefined);
                  setAbsenceModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/80 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Lançar período de férias, licença médica ou folga"
              >
                <Palmtree className="w-3.5 h-3.5 text-amber-400" />
                <span>Férias / Afastamento</span>
              </button>

              {/* Fill by Teams (Turma A = Ímpar, Turma B = Par) */}
              <button
                onClick={() => {
                  if (window.confirm(`Deseja preencher automaticamente o mês de ${monthName} distribuindo a equipe de acordo com as Turmas cadastradas (Turma A: Dias Ímpares, Turma B: Dias Pares)?`)) {
                    applyTeamGroupsSchedule(currentYear, currentMonthIndex);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Preencher escala inteira pelas Turmas (A: Ímpares, B: Pares, 5x2: Seg-Sex)"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Preencher Turmas (A/B)</span>
              </button>

              <button
                onClick={() => setIsAddingNewRow(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-950/40 cursor-pointer active:scale-98"
                title="Adicionar novo colaborador à escala"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-200" />
                <span>+ Novo Colaborador</span>
              </button>
            </>
          )}

          {/* Spacing / Density Switch */}
          <div className="flex items-center bg-[#0c121c] p-0.5 rounded-xl border border-[#1e2a3a]">
            <button
              onClick={() => setRowDensity('spacious')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                rowDensity === 'spacious' ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualização com espaçamento amplo"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Amplo</span>
            </button>
            <button
              onClick={() => setRowDensity('compact')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                rowDensity === 'compact' ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualização compacta para caber mais linhas na tela"
            >
              <Minimize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Compacto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Draft Mode Notice Banner (Friendly warm alert) */}
      {!isMonthPublished(currentYear, currentMonthIndex) && (
        <div className="py-2.5 px-4 rounded-2xl bg-amber-950/40 border border-amber-800/70 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-extrabold">Escala em Elaboração (Rascunho)</span>
            <span className="text-amber-300/80 hidden sm:inline">— {role === 'supervisor' ? 'Visível para você conferir antes de liberar para a equipe' : 'A liderança está finalizando os horários'}</span>
          </div>
          {role === 'supervisor' && (
            <button
              onClick={() => toggleMonthPublishStatus(currentYear, currentMonthIndex)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-98"
            >
              <Check className="w-3.5 h-3.5 text-cyan-200" />
              <span>Publicar para a Equipe</span>
            </button>
          )}
        </div>
      )}

      {/* Main Table Container in Deep Grey-Blue with Near-Black Header */}
      <div className="overflow-x-auto rounded-2xl border border-[#1e2a3a] shadow-lg relative bg-[#141c28] text-slate-100">
        {/* Centered Month Header Title */}
        <div className="py-2.5 text-center text-xs font-black tracking-widest uppercase border-b border-[#1e2a3a] bg-[#0c121c] flex items-center justify-center gap-3 text-slate-300">
          <span className="text-cyan-400">ESCALA {activeRegime}</span>
          <span className="text-slate-600">•</span>
          <span>{monthName} {currentYear}</span>
          {!isMonthPublished(currentYear, currentMonthIndex) && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 font-bold uppercase tracking-wider">
              Rascunho
            </span>
          )}
        </div>

        <table className="w-full text-center border-collapse text-xs select-none">
          <thead>
            {/* Header row in black-blue rgb(12, 18, 28) */}
            <tr className="border-b border-[#1e2a3a] font-bold bg-[#0c121c] text-slate-300">
              {/* Prestadores Header */}
              <th
                className={`text-left font-bold border-r border-[#1e2a3a] sticky left-0 z-20 bg-[#0c121c] text-slate-100 ${
                  rowDensity === 'spacious'
                    ? 'min-w-[280px] sm:min-w-[340px] px-4 py-3'
                    : 'min-w-[240px] sm:min-w-[300px] px-3 py-2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-black text-white">
                    Colaboradores {activeRegime} ({displayedProviders.length})
                  </span>
                  {role === 'supervisor' && (
                    <span className="text-xs font-normal text-slate-400">
                      Clique p/ editar
                    </span>
                  )}
                </div>
              </th>

              {/* Entrada */}
              <th
                className={`text-center font-bold border-r border-[#1e2a3a] text-xs uppercase tracking-wider text-slate-400 bg-[#0c121c] ${
                  rowDensity === 'spacious' ? 'min-w-[76px] px-2 py-3' : 'min-w-[60px] px-1 py-1.5'
                }`}
              >
                Entrada
              </th>

              {/* Saída */}
              <th
                className={`text-center font-bold border-r border-[#1e2a3a] text-xs uppercase tracking-wider text-slate-400 bg-[#0c121c] ${
                  rowDensity === 'spacious' ? 'min-w-[76px] px-2 py-3' : 'min-w-[60px] px-1 py-1.5'
                }`}
              >
                Saída
              </th>

              {/* Days 1 to 31 with Date Headers in Cyan */}
              {days.map(d => {
                const isWeekend = d.isWeekend;
                const dailyWorkers = getDailyWorkersCount(d.dateStr);
                const isLowCoverage = dailyWorkers > 0 && dailyWorkers < 3;
                const holiday = getHolidayInfo(d.dateStr);

                let headerBg = holiday.isHoliday
                  ? 'bg-amber-950/30 text-amber-200 font-black'
                  : isWeekend
                  ? 'bg-[#101724] text-slate-300 font-bold'
                  : 'bg-[#0c121c] text-slate-300';

                return (
                  <th
                    key={`head-day-${d.dayNumber}`}
                    className={`text-center font-bold border-r border-[#1e2a3a]/80 transition-colors relative ${
                      rowDensity === 'spacious'
                        ? 'min-w-[44px] max-w-[48px] py-2 px-1'
                        : 'min-w-[32px] max-w-[36px] py-1 px-0.5'
                    } ${headerBg}`}
                    title={
                      holiday.isHoliday
                        ? `🇧🇷 Feriado: ${holiday.name} — ${dailyWorkers} colaboradores escalados`
                        : `Dia ${d.dayNumber}/${currentMonthIndex + 1}: ${dailyWorkers} colaboradores escalados para trabalhar`
                    }
                  >
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="text-cyan-400 text-xs font-black">
                        {d.dayNumber}
                      </span>
                      {holiday.isHoliday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`Feriado: ${holiday.name}`} />
                      )}
                      {isLowCoverage && !holiday.isHoliday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" title="Atenção: Apenas 1 ou 2 plantonistas neste dia" />
                      )}
                    </div>
                    <div
                      className={`text-xs font-bold uppercase tracking-wider ${
                        holiday.isHoliday
                          ? 'text-amber-300'
                          : isWeekend
                          ? 'text-slate-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {DAYS_SHORT_PT[d.dayOfWeek]}
                    </div>
                  </th>
                );
              })}

              {/* Action column for supervisor */}
              {role === 'supervisor' && (
                <th
                  className="p-2 text-center font-bold min-w-[55px] bg-[#0c121c] border-l border-[#1e2a3a] text-slate-300"
                >
                  Ações
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {displayedProviders.length === 0 ? (
              <tr>
                <td
                  colSpan={days.length + 3 + (role === 'supervisor' ? 1 : 0)}
                  className="p-12 text-center bg-[#141c28] text-slate-400 border-b border-[#1e2a3a]"
                >
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/90 border border-[#1e2a3a] flex items-center justify-center text-cyan-400 shadow-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">
                        {activeRegime === '5x2'
                          ? 'Nenhum colaborador na Escala 5x2'
                          : 'Nenhum colaborador na Escala 12x36'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {activeRegime === '5x2'
                          ? 'A escala 5x2 inicia vazia para você cadastrar a equipe técnica ou administrativa real sem dados falsos.'
                          : 'Nenhum colaborador encontrado com os filtros selecionados.'}
                      </p>
                    </div>
                    {role === 'supervisor' && (
                      <button
                        onClick={() => setIsAddingNewRow(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-950/40 inline-flex items-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Plus className="w-4 h-4 text-cyan-200" />
                        <span>+ Adicionar Colaborador {activeRegime}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayedProviders.map(provider => {
                const isSelected = (role === 'provider' && provider.id === activeProviderId) || provider.id === selectedProvider?.id;
                const isEditingThisName = editingProviderId === provider.id && editingField === 'name';
                const isEditingThisEntry = editingProviderId === provider.id && editingField === 'entry';
                const isEditingThisExit = editingProviderId === provider.id && editingField === 'exit';

                return (
                  <tr
                    key={provider.id}
                    className={`border-b border-[#1e2a3a]/70 transition-colors group ${
                      isSelected
                        ? 'bg-cyan-950/20 ring-1 ring-cyan-500/40'
                        : 'odd:bg-[#141c28] even:bg-[#101724] hover:bg-[#182334]'
                    }`}
                  >
                  {/* Prestador Name Cell (Full Name shown, not truncated) */}
                  <td
                    className={`text-left font-bold border-r border-[#1e2a3a] sticky left-0 z-10 bg-[#141c28] group-hover:bg-[#182334] text-slate-100 ${
                      rowDensity === 'spacious'
                        ? 'px-4 py-3 min-w-[280px] sm:min-w-[340px]'
                        : 'px-2.5 py-1.5 min-w-[240px] sm:min-w-[300px]'
                    }`}
                  >
                    {isEditingThisName ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDownEdit}
                          onBlur={saveEditingField}
                          className="w-full px-2 py-1 text-xs bg-[#0c121c] text-white border border-cyan-500 rounded-lg font-bold uppercase focus:outline-none"
                        />
                        <button
                          onClick={saveEditingField}
                          className="p-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2.5 group/name">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Avatar with initials */}
                          <div
                            className={`rounded-xl flex items-center justify-center font-black shrink-0 ${
                              rowDensity === 'spacious' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-xs'
                            } bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-xs`}
                          >
                            {getInitials(provider.name)}
                          </div>

                          <div className="flex flex-col min-w-0">
                            {/* Full names like NATACHA AMARAL DE OLIVEIRA are shown, not truncated */}
                            <span
                              onClick={() => {
                                if (role === 'supervisor') {
                                  startEditingField(provider, 'name');
                                } else if (isLeaderAuthenticated || authenticatedProviderId === provider.id) {
                                  setActiveProviderId(provider.id);
                                  setViewMode('personal-calendar');
                                } else {
                                  if (authenticatedProviderId && authenticatedProviderId !== provider.id) {
                                    alert(`Você está conectado como outro prestador. Para ver o calendário de ${provider.name}, desconecte seu perfil primeiro.`);
                                  } else if (onOpenCollaboratorAuth) {
                                    onOpenCollaboratorAuth(provider);
                                  }
                                }
                              }}
                              className={`cursor-pointer hover:underline hover:text-cyan-400 font-extrabold tracking-tight text-white whitespace-normal break-words ${
                                rowDensity === 'spacious' ? 'text-sm' : 'text-xs'
                              }`}
                              title={
                                role === 'supervisor'
                                  ? 'Clique para renomear este prestador'
                                  : 'Clique para abrir seu calendário mensal'
                              }
                            >
                              {provider.name}
                            </span>
                            
                            {/* Monthly worked hours and shifts metric */}
                            {(() => {
                              const workedDaysCount = assignments.filter(a => {
                                const [y, m] = a.date.split('-').map(Number);
                                return y === currentYear && m === currentMonthIndex + 1 && a.providerId === provider.id && a.shiftTypeId === 'st-t';
                              }).length;
                              const totalHours = workedDaysCount * (provider.regime === '5x2' ? 8 : 12);

                              return (
                                <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                                  <span className="font-semibold px-1.5 py-0.5 rounded bg-[#0c121c] text-slate-400 border border-[#1e2a3a]">
                                    {workedDaysCount} plantões ({totalHours}h)
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Soft blue 'VOCÊ' tag */}
                          {isSelected && (
                            <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-400/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Você
                            </span>
                          )}

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (isLeaderAuthenticated || authenticatedProviderId === provider.id) {
                                setActiveProviderId(provider.id);
                                setViewMode('personal-calendar');
                              } else {
                                if (authenticatedProviderId && authenticatedProviderId !== provider.id) {
                                  alert(`Você está conectado como outro prestador. Para ver o calendário de ${provider.name}, desconecte seu perfil primeiro.`);
                                } else if (onOpenCollaboratorAuth) {
                                  onOpenCollaboratorAuth(provider);
                                }
                              }
                            }}
                            className="text-slate-400 hover:text-cyan-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Ver calendário mensal deste colaborador"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              shareProviderWhatsApp(provider, currentYear, currentMonthIndex, assignments);
                            }}
                            className="text-slate-400 hover:text-cyan-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            title={`Enviar escala de ${provider.name} no WhatsApp`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {role === 'supervisor' && (
                            <button
                              onClick={() => startEditingField(provider, 'name')}
                              className="opacity-0 group-hover/name:opacity-100 text-slate-400 hover:text-cyan-400 p-1 rounded-lg hover:bg-slate-800 transition-opacity"
                              title="Editar nome"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Entrada Cell (Editable) */}
                  <td
                    className={`text-center font-medium border-r border-[#1e2a3a] cursor-pointer ${
                      rowDensity === 'spacious' ? 'px-2 py-2 min-w-[76px]' : 'px-1 py-1 min-w-[60px]'
                    } hover:bg-slate-800 text-slate-300`}
                    onClick={() => startEditingField(provider, 'entry')}
                    title={role === 'supervisor' ? 'Clique para alterar horário de entrada' : undefined}
                  >
                    {isEditingThisEntry ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDownEdit}
                        onBlur={saveEditingField}
                        className="w-14 text-center text-xs bg-[#0c121c] text-white border border-cyan-500 rounded-lg focus:outline-none py-1 shadow-sm"
                      />
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-[#0c121c] border border-[#1e2a3a] text-xs font-semibold text-slate-300">
                        {provider.entryTime || '07h00'}
                      </span>
                    )}
                  </td>

                  {/* Saída Cell (Editable) */}
                  <td
                    className={`text-center font-medium border-r border-[#1e2a3a] cursor-pointer ${
                      rowDensity === 'spacious' ? 'px-2 py-2 min-w-[76px]' : 'px-1 py-1 min-w-[60px]'
                    } hover:bg-slate-800 text-slate-300`}
                    onClick={() => startEditingField(provider, 'exit')}
                    title={role === 'supervisor' ? 'Clique para alterar horário de saída' : undefined}
                  >
                    {isEditingThisExit ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDownEdit}
                        onBlur={saveEditingField}
                        className="w-14 text-center text-xs bg-[#0c121c] text-white border border-cyan-500 rounded-lg focus:outline-none py-1 shadow-sm"
                      />
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-[#0c121c] border border-[#1e2a3a] text-xs font-semibold text-slate-300">
                        {provider.exitTime || '19h00'}
                      </span>
                    )}
                  </td>

                  {/* Day cells 1 to 31: 'T' blocks are Cyan, 'D' blocks are Medium Grey */}
                  {days.map(d => {
                    const shift = getShiftForProviderAndDate(provider.id, d.dateStr);
                    const shiftCode = shift ? (shift.shiftTypeId === 'st-d' ? 'D' : 'T') : '-';
                    const hasNote = Boolean(shift?.notes);

                    // Weekend subtle background tint for clear visual rhythm
                    const weekendCellBg = d.isWeekend ? 'bg-slate-900/40' : '';

                    const isCellSelected = selectedCell?.providerId === provider.id && selectedCell?.dayNumber === d.dayNumber;

                    return (
                      <td
                        key={`${provider.id}-${d.dateStr}`}
                        onClick={() => {
                          if (role === 'supervisor') {
                            setSelectedCell({ providerId: provider.id, dayNumber: d.dayNumber });
                          }
                          handleCellClick(provider, d.dateStr);
                        }}
                        onContextMenu={e => handleOpenCellEditor(e, provider, d.dateStr, d.dayNumber)}
                        className={`p-0 text-center relative transition-transform ${
                          rowDensity === 'spacious' ? 'h-13' : 'h-8'
                        } ${
                          role === 'supervisor'
                            ? 'cursor-pointer hover:opacity-90 active:scale-95'
                            : ''
                        } ${weekendCellBg} ${
                          isCellSelected ? 'ring-2 ring-cyan-500 ring-inset z-10 bg-cyan-950/30' : ''
                        } border-r border-[#1e2a3a]/70`}
                        title={
                          shift
                            ? `${provider.name}: ${shiftCode === 'T' ? 'Trabalha' : 'Descanso'} (${d.dayNumber}/${currentMonthIndex + 1})${hasNote ? ` - Nota: ${shift.notes}` : ''}`
                            : `${provider.name}: Sem Escala (${d.dayNumber}/${currentMonthIndex + 1})`
                        }
                      >
                        <div className="w-full h-full flex flex-col items-center justify-center p-0.5 relative">
                          {/* 'T' blocks are clean Cyan */}
                          {shiftCode === 'T' && (
                            <span
                              className={`flex items-center justify-center rounded-lg font-black transition-transform ${
                                rowDensity === 'spacious' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-xs'
                              } bg-cyan-500 text-slate-950 shadow-sm hover:bg-cyan-400`}
                            >
                              T
                            </span>
                          )}

                          {/* 'D' blocks are Medium Grey */}
                          {shiftCode === 'D' && (
                            <span
                              className={`flex items-center justify-center rounded-lg font-bold transition-transform ${
                                rowDensity === 'spacious' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-xs'
                              } bg-slate-700/80 text-slate-200 border border-slate-600/50 shadow-xs hover:bg-slate-700`}
                            >
                              D
                            </span>
                          )}

                          {shiftCode === '-' && (
                            <span
                              className={`flex items-center justify-center text-slate-600 font-bold transition-opacity group-hover:text-slate-400 ${
                                rowDensity === 'spacious' ? 'text-sm' : 'text-xs'
                              }`}
                            >
                              -
                            </span>
                          )}

                          {/* Home Office Badge in soft purple */}
                          {shift?.workModality === 'home_office' && (
                            <span
                              className="text-xs font-bold px-1 leading-tight rounded bg-purple-900/60 text-purple-300 border border-purple-700/50 mt-0.5"
                              title="Modalidade: Home Office"
                            >
                              HO
                            </span>
                          )}
                        </div>

                        {/* Red note indicator */}
                        {hasNote && (
                          <div
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenCellEditor(e, provider, d.dateStr, d.dayNumber);
                            }}
                            className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-xs cursor-pointer ring-2 ring-slate-900"
                            title={`Observação: ${shift?.notes}`}
                          />
                        )}
                      </td>
                    );
                  })}

                  {/* Actions column for supervisor */}
                  {role === 'supervisor' && (
                    <td
                      className="p-1 text-center relative border-l border-slate-700 bg-[#162032]"
                    >
                      <div className="flex items-center justify-center gap-1">
                        {/* Quick fill pattern dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setRowMenuOpenId(rowMenuOpenId === provider.id ? null : provider.id)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Ações rápidas de preenchimento da linha"
                          >
                            <Wand2 className="w-4 h-4" />
                          </button>

                          {rowMenuOpenId === provider.id && (
                            <div className="absolute right-0 top-full mt-1 w-56 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl z-30 p-2 text-left text-xs space-y-1 animate-in fade-in zoom-in-95">
                              <div className="text-xs font-extrabold text-slate-400 px-2 py-1 uppercase tracking-wider">
                                Preencher {provider.name.split(' ')[0]}:
                              </div>
                              <button
                                onClick={() => {
                                  batchFillProviderMonth(provider.id, currentYear, currentMonthIndex, 'mon_to_fri_5x2');
                                  setRowMenuOpenId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 text-xs font-bold flex items-center justify-between cursor-pointer"
                              >
                                <span>Padrão 5x2 (Seg a Sex)</span>
                                <span className="text-xs text-emerald-400 font-semibold">T Seg-Sex</span>
                              </button>
                              <button
                                onClick={() => {
                                  batchFillProviderMonth(provider.id, currentYear, currentMonthIndex, 'odd_12x36');
                                  setRowMenuOpenId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-300 hover:bg-emerald-950/60 hover:text-emerald-300 text-xs font-medium flex items-center justify-between cursor-pointer"
                              >
                                <span>12x36 (Dias Ímpares)</span>
                                <span className="text-xs text-slate-500">1, 3, 5...</span>
                              </button>
                              <button
                                onClick={() => {
                                  batchFillProviderMonth(provider.id, currentYear, currentMonthIndex, 'even_12x36');
                                  setRowMenuOpenId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-300 hover:bg-emerald-950/60 hover:text-emerald-300 text-xs font-medium flex items-center justify-between cursor-pointer"
                              >
                                <span>12x36 (Dias Pares)</span>
                                <span className="text-xs text-slate-500">2, 4, 6...</span>
                              </button>
                              <button
                                onClick={() => {
                                  batchFillProviderMonth(provider.id, currentYear, currentMonthIndex, 'mon_wed_fri');
                                  setRowMenuOpenId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-300 hover:bg-sky-950/60 hover:text-sky-300 text-xs font-medium cursor-pointer"
                              >
                                Seg / Qua / Sex
                              </button>
                              <button
                                onClick={() => {
                                  batchFillProviderMonth(provider.id, currentYear, currentMonthIndex, 'tue_thu_sat');
                                  setRowMenuOpenId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-300 hover:bg-sky-950/60 hover:text-sky-300 text-xs font-medium cursor-pointer"
                              >
                                Ter / Qui / Sáb
                              </button>
                              <button
                                onClick={() => {
                                  handleFillRowPattern(provider.id, 'all_D');
                                  setRowMenuOpenId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-300 hover:bg-blue-950/60 hover:text-blue-300 text-xs cursor-pointer"
                              >
                                Preencher tudo com Descanso (D)
                              </button>
                              <div className="border-t border-slate-700/80 my-1" />
                              <button
                                onClick={() => {
                                  batchFillProviderMonth(provider.id, currentYear, currentMonthIndex, 'clear');
                                  setRowMenuOpenId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/60 text-xs font-semibold cursor-pointer"
                              >
                                🧹 Limpar mês deste prestador
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete row */}
                        <button
                          onClick={() => handleDeleteProvider(provider.id, provider.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Remover prestador da escala"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            }))}

            {/* Totals Row: Smart Coverage Indicator Footer */}
            <tr
              className="border-t-2 border-slate-600 font-bold bg-[#141e30] text-slate-300"
            >
              <td
                className={`sticky left-0 z-10 text-left border-r border-slate-600 font-bold bg-[#162032] text-slate-200 ${
                  rowDensity === 'spacious' ? 'px-4 py-3 text-xs' : 'px-2.5 py-1.5 text-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="uppercase tracking-wider font-extrabold text-xs text-slate-300">
                    🛡️ Cobertura no Dia
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    (Mín. 2)
                  </span>
                </div>
              </td>
              <td className="text-center text-xs text-slate-500 border-r border-slate-700">-</td>
              <td className="text-center text-xs text-slate-500 border-r border-slate-700">-</td>
              {days.map(d => {
                const count = getDailyWorkersCount(d.dateStr);
                const isZero = count === 0;
                const isLow = count > 0 && count < 2;

                let cellStyle = '';
                if (isZero) {
                  cellStyle = 'text-rose-400 bg-rose-950/50 font-black border-rose-800';
                } else if (isLow) {
                  cellStyle = 'text-amber-400 bg-amber-950/50 font-black border-amber-800';
                } else {
                  cellStyle = 'text-emerald-300 bg-emerald-950/35 font-black';
                }

                return (
                  <td
                    key={`total-${d.dateStr}`}
                    className={`text-center border-r border-slate-700/60 transition-colors ${
                      rowDensity === 'spacious' ? 'py-2 text-xs' : 'py-1 text-xs'
                    } ${cellStyle}`}
                    title={
                      isZero
                        ? `Atenção: Dia ${d.dayNumber} está sem plantonista escalado (0)`
                        : isLow
                        ? `Atenção: Dia ${d.dayNumber} tem apenas ${count} plantonista(s)`
                        : `✓ Cobertura adequada: Dia ${d.dayNumber} tem ${count} plantonistas`
                    }
                  >
                    <div className="flex items-center justify-center gap-0.5">
                      <span>{count}</span>
                    </div>
                  </td>
                );
              })}
              {role === 'supervisor' && <td className="border-l border-slate-700 text-slate-500">-</td>}
            </tr>

            {/* Quick Add Inline Row for Supervisor */}
            {role === 'supervisor' && isAddingNewRow && (
              <tr className="bg-emerald-950/30 border-b border-emerald-800">
                <td className="p-2 sticky left-0 z-10 bg-[#162032] border-r border-slate-700">
                  <form onSubmit={handleAddNewProvider} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="Nome do novo prestador..."
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl font-bold uppercase text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewRow(false)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                </td>
                <td className="p-1 border-r border-slate-700">
                  <input
                    type="text"
                    value={newEntry}
                    onChange={e => setNewEntry(e.target.value)}
                    className="w-14 text-center text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-medium py-1"
                  />
                </td>
                <td className="p-1 border-r border-slate-700">
                  <input
                    type="text"
                    value={newExit}
                    onChange={e => setNewExit(e.target.value)}
                    className="w-14 text-center text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-medium py-1"
                  />
                </td>
                <td colSpan={days.length + 1} className="p-2 text-slate-400 font-medium text-left pl-4 text-xs">
                  Digite o nome e clique em Salvar para incluir na escala.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Add Row Button under table */}
        {role === 'supervisor' && !isAddingNewRow && (
          <div className="p-3 bg-[#162032] border-t border-slate-700 flex items-center justify-between">
            <button
              onClick={() => setIsAddingNewRow(true)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-bold px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Adicionar Novo Prestador na Grade</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar a escala padrão original da imagem?')) {
                  resetToDemoData();
                }
              }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar dados de exemplo</span>
            </button>
          </div>
        )}
      </div>

      {/* Cell Detail / Note Modal */}
      {activeCellEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#1e293b] text-slate-100 rounded-3xl p-5 border border-slate-700 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  Editar Plantão • Dia {activeCellEdit.dayNumber}
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  {activeCellEdit.providerName}
                </p>
              </div>
              <button
                onClick={() => setActiveCellEdit(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Shift Code Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Definir Status do Dia:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectCodeInModal('T')}
                  className={`p-2.5 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                    activeCellEdit.currentCode === 'T'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/80'
                  }`}
                >
                  <div className="text-base font-black">T</div>
                  <div className="text-xs font-medium opacity-90">Trabalha</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCodeInModal('D')}
                  className={`p-2.5 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                    activeCellEdit.currentCode === 'D'
                      ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                      : 'bg-sky-950/60 text-sky-300 border-sky-800/80 hover:bg-sky-900/80'
                  }`}
                >
                  <div className="text-base font-black">D</div>
                  <div className="text-xs font-medium opacity-90">Descanso</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCodeInModal('-')}
                  className={`p-2.5 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                    activeCellEdit.currentCode === '-'
                      ? 'bg-slate-700 text-white border-slate-600 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-base font-black">-</div>
                  <div className="text-xs font-medium opacity-90">Sem Escala</div>
                </button>
              </div>
            </div>

            {/* Work Modality Toggle: Presencial vs Home Office */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Modalidade de Trabalho:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalityInput('presencial')}
                  className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    modalityInput === 'presencial'
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Presencial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalityInput('home_office')}
                  className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    modalityInput === 'home_office'
                      ? 'bg-purple-950/70 text-purple-300 border-purple-800 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 text-purple-400" />
                  <span>Home Office</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {modalityInput === 'presencial'
                  ? 'Como é presencial, não exibe etiqueta na célula para manter a escala limpa.'
                  : 'Exibirá a etiqueta HO na célula para indicar trabalho remoto.'}
              </p>
            </div>

            {/* Note text field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nota ou Observação:
              </label>
              <textarea
                rows={2}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Ex: Cobertura especial, troca acordada, plantão extra..."
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/80">
              <button
                type="button"
                onClick={() => setActiveCellEdit(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs rounded-xl cursor-pointer transition-colors"
              >
                Salvar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Absence / Vacation Batch Modal */}
      <AbsenceBatchModal
        isOpen={absenceModalOpen}
        onClose={() => setAbsenceModalOpen(false)}
        defaultProviderId={absenceModalProvId}
      />

      {/* Keyboard Shortcuts Hint Bar for Leader */}
      {role === 'supervisor' && (
        <div className="bg-[#1e293b] border border-slate-700/80 py-2 px-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-white flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dicas de Navegação:</span>
            </span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-200 font-bold text-xs">T</kbd> Trabalha</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-200 font-bold text-xs">D</kbd> Descanso</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-200 font-bold text-xs">H</kbd> Home Office</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-200 font-bold text-xs">Del</kbd> Limpar</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-200 font-bold text-xs">Setas</kbd> Navegar</span>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden md:inline">
            Clique em qualquer célula para preencher rapidamente
          </span>
        </div>
      )}

    </div>
  );
};
