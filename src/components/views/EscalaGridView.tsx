import React, { useState, useRef, useEffect } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { getMonthDaysArray, MONTH_NAMES_PT, DAYS_SHORT_PT } from '../../utils/dateUtils';
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
  Minimize2
} from 'lucide-react';
import { Provider } from '../../types';
import { CollaboratorAuthModal } from '../modals/CollaboratorAuthModal';

interface EscalaGridViewProps {
  onAddProvider?: () => void;
  onOpenCollaboratorAuth?: (provider: Provider) => void;
}

export const EscalaGridView: React.FC<EscalaGridViewProps> = ({
  onAddProvider,
  onOpenCollaboratorAuth,
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
  } = useSchedule();

  // Cell note & shift picker modal
  const [activeCellEdit, setActiveCellEdit] = useState<{
    providerId: string;
    providerName: string;
    dateStr: string;
    dayNumber: number;
    shiftId?: string;
    currentCode: string;
    notes?: string;
  } | null>(null);

  const [noteInput, setNoteInput] = useState('');

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

  // Theme: 'dark' (Modern Dark Roster) or 'sheet' (Classic Pastel Excel)
  const [sheetTheme, setSheetTheme] = useState<'dark' | 'sheet'>('dark');

  // Row density: 'spacious' (default, comfortable and well-separated) or 'compact'
  const [rowDensity, setRowDensity] = useState<'spacious' | 'compact'>('spacious');

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getDailyWorkersCount = (dateStr: string) => {
    return assignments.filter(a => a.date === dateStr && a.shiftTypeId === 'st-t').length;
  };

  const days = getMonthDaysArray(currentYear, currentMonthIndex);
  const monthName = MONTH_NAMES_PT[currentMonthIndex].toUpperCase();

  useEffect(() => {
    if (editingField && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingField]);

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

    setActiveCellEdit({
      providerId: provider.id,
      providerName: provider.name,
      dateStr,
      dayNumber,
      shiftId: existing?.id,
      currentCode: code,
      notes: existing?.notes || '',
    });
    setNoteInput(existing?.notes || '');
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
        updateAssignment(activeCellEdit.shiftId, { shiftTypeId });
      } else {
        const newId = addAssignment({
          date: activeCellEdit.dateStr,
          shiftTypeId,
          departmentId: 'dept-1',
          providerId: activeCellEdit.providerId,
          status: 'confirmed',
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
      });
    } else if (activeCellEdit.currentCode !== '-') {
      addAssignment({
        date: activeCellEdit.dateStr,
        shiftTypeId: activeCellEdit.currentCode === 'D' ? 'st-d' : 'st-t',
        departmentId: 'dept-1',
        providerId: activeCellEdit.providerId,
        status: 'confirmed',
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
      role: 'Prestador',
      entryTime: newEntry.trim() || '07h00',
      exitTime: newExit.trim() || '19h00',
      email: `${newName.toLowerCase().replace(/\s+/g, '.')}@escala.com`,
      phone: '(11) 90000-0000',
      color: 'indigo',
      maxMonthlyHours: 180,
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

  // Selected provider summary for collaborator mode
  const selectedProvider = providers.find(p => p.id === activeProviderId);
  const selectedProviderShifts = assignments.filter(a => {
    const [y, m] = a.date.split('-').map(Number);
    return a.providerId === activeProviderId && y === currentYear && m === currentMonthIndex + 1;
  });

  const countD = selectedProviderShifts.filter(s => s.shiftTypeId === 'st-d').length;
  const countT = selectedProviderShifts.filter(s => s.shiftTypeId === 'st-t').length;
  const countFolgas = days.length - (countD + countT);

  return (
    <div className="space-y-4">
      {/* Top Banner with Controls & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-xs shadow-md">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 font-bold">Legenda:</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 flex items-center justify-center font-bold font-mono rounded text-[11px] ${
                sheetTheme === 'sheet'
                  ? 'bg-[#a9d18e] text-slate-900 border border-slate-400'
                  : 'bg-emerald-600/35 text-emerald-200 border border-emerald-500/40'
              }`}
            >
              T
            </span>
            <span className="text-slate-200 font-medium">Trabalha</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 flex items-center justify-center font-bold font-mono rounded text-[11px] ${
                sheetTheme === 'sheet'
                  ? 'bg-[#98b7e8] text-slate-900 border border-slate-400'
                  : 'bg-blue-600/35 text-blue-200 border border-blue-500/40'
              }`}
            >
              D
            </span>
            <span className="text-slate-200 font-medium">Descanso</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center font-bold font-mono rounded text-[11px] bg-slate-800 text-slate-400 border border-slate-700">
              -
            </span>
            <span className="text-slate-400">Sem Escala</span>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/60 text-slate-400">
            <div className="w-2.5 h-2.5 bg-red-600 rounded-xs rotate-45 inline-block" />
            <span>Com Observação</span>
          </div>
        </div>

        {/* Right Tools: Add Provider, Theme Toggle, Hints */}
        <div className="flex items-center gap-2.5">
          {role === 'supervisor' && (
            <button
              onClick={() => setIsAddingNewRow(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-sm"
              title="Adicionar novo prestador à tabela"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Prestador</span>
            </button>
          )}

          {/* Spacing / Density Switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setRowDensity('spacious')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                rowDensity === 'spacious' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Linhas amplas e organizadas (Visualização espaçosa)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Espaçoso</span>
            </button>
            <button
              onClick={() => setRowDensity('compact')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                rowDensity === 'compact' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Modo compacto"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compacto</span>
            </button>
          </div>

          {/* Theme switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSheetTheme('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                sheetTheme === 'dark' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Tema Escuro Moderno"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Escuro</span>
            </button>
            <button
              onClick={() => setSheetTheme('sheet')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                sheetTheme === 'sheet' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Planilha idêntica à imagem"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Planilha</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Imprimir Escala"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Supervisor Helper Tip */}
      {role === 'supervisor' && (
        <div className="bg-indigo-950/30 border border-indigo-900/60 px-4 py-2 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💡 <strong>Dica de Edição:</strong> Clique em qualquer dia para alternar: <strong>Trabalha (T)</strong> ➔ <strong>Descanso (D)</strong> ➔ <strong>Sem Escala (-)</strong>. Clique duas vezes ou com botão direito para adicionar observações. Clique no nome ou horário para editar na hora!</span>
          </div>
        </div>
      )}

      {/* Collaborator Personal Summary Row */}
      {role === 'provider' && selectedProvider && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs text-white shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Escala destacada de:</span>
            <strong className="text-indigo-300 text-sm">{selectedProvider.name}</strong>
            <span className="text-slate-400 font-mono-nums">({selectedProvider.entryTime} às {selectedProvider.exitTime})</span>
          </div>

          <div className="flex items-center gap-3 font-mono-nums flex-wrap">
            <span className="bg-emerald-900/50 text-emerald-200 border border-emerald-500/40 px-2.5 py-0.5 rounded-md font-bold">
              Dias Trabalhados (T): {countT}
            </span>
            <span className="bg-blue-900/50 text-blue-200 border border-blue-500/40 px-2.5 py-0.5 rounded-md font-bold">
              Dias de Descanso (D): {countD}
            </span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-md font-bold">
              Sem Escala: {countFolgas}
            </span>
            <button
              onClick={() => {
                setActiveProviderId(selectedProvider.id);
                setViewMode('personal-calendar');
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm ml-auto"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Ver Meu Calendário Mensal</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div
        className={`overflow-x-auto rounded-2xl border shadow-2xl relative ${
          sheetTheme === 'sheet'
            ? 'bg-white border-slate-400 text-slate-900'
            : 'bg-[#0B0F19] border-slate-800 text-slate-100'
        }`}
      >
        {/* Centered Month Header Title: OUTUBRO 2026 */}
        <div
          className={`py-2.5 text-center text-sm font-black tracking-widest uppercase border-b ${
            sheetTheme === 'sheet'
              ? 'bg-slate-100 border-slate-400 text-slate-900'
              : 'bg-slate-900/90 border-slate-800 text-white'
          }`}
        >
          {monthName} {currentYear}
        </div>

        <table className="w-full text-center border-collapse text-[11px] select-none">
          <thead>
            <tr
              className={`border-b font-bold ${
                sheetTheme === 'sheet'
                  ? 'bg-[#d9e1f2] text-slate-900 border-slate-400'
                  : 'bg-slate-900 text-slate-200 border-slate-800'
              }`}
            >
              {/* Prestadores Header */}
              <th
                className={`text-left font-bold border-r sticky left-0 z-20 ${
                  rowDensity === 'spacious'
                    ? 'min-w-[280px] max-w-[340px] px-4 py-3'
                    : 'min-w-[240px] max-w-[300px] px-3 py-2'
                } ${
                  sheetTheme === 'sheet'
                    ? 'bg-[#d9e1f2] border-slate-400 text-slate-900'
                    : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-black">
                    Prestadores ({providers.length})
                  </span>
                  {role === 'supervisor' && (
                    <span className="text-[10px] font-normal text-slate-400">
                      Clique p/ editar
                    </span>
                  )}
                </div>
              </th>

              {/* Entrada */}
              <th
                className={`text-center font-bold border-r text-xs uppercase tracking-wider ${
                  rowDensity === 'spacious' ? 'min-w-[76px] px-2 py-3' : 'min-w-[60px] px-1 py-1.5'
                } ${sheetTheme === 'sheet' ? 'border-slate-400' : 'border-slate-800'}`}
              >
                Entrada
              </th>

              {/* Saída */}
              <th
                className={`text-center font-bold border-r text-xs uppercase tracking-wider ${
                  rowDensity === 'spacious' ? 'min-w-[76px] px-2 py-3' : 'min-w-[60px] px-1 py-1.5'
                } ${sheetTheme === 'sheet' ? 'border-slate-400' : 'border-slate-800'}`}
              >
                Saída
              </th>

              {/* Days 1 to 31 */}
              {days.map(d => {
                const isWeekend = d.isWeekend;

                let headerBg = '';
                if (sheetTheme === 'sheet') {
                  headerBg = isWeekend ? 'bg-[#fff2cc] text-slate-900' : 'bg-[#e2efda] text-slate-900';
                } else {
                  headerBg = isWeekend
                    ? 'bg-amber-950/40 text-amber-300 font-bold border-amber-900/40'
                    : 'bg-slate-900 text-slate-300';
                }

                return (
                  <th
                    key={`head-day-${d.dayNumber}`}
                    className={`text-center font-bold font-mono border-r transition-colors ${
                      rowDensity === 'spacious'
                        ? 'min-w-[44px] max-w-[48px] py-2 px-1'
                        : 'min-w-[32px] max-w-[36px] py-1 px-0.5'
                    } ${headerBg} ${
                      sheetTheme === 'sheet' ? 'border-slate-400' : 'border-slate-800'
                    }`}
                  >
                    <div className={rowDensity === 'spacious' ? 'text-xs font-black' : 'text-[11px] font-black'}>
                      {d.dayNumber}
                    </div>
                    <div
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isWeekend ? 'text-amber-400' : 'text-slate-400'
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
                  className={`p-2 text-center font-bold min-w-[55px] ${
                    sheetTheme === 'sheet'
                      ? 'bg-slate-100 border-l border-slate-400'
                      : 'bg-slate-900 border-l border-slate-800'
                  }`}
                >
                  Ações
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {providers.map(provider => {
              const isSelected = role === 'provider' && provider.id === activeProviderId;
              const isEditingThisName = editingProviderId === provider.id && editingField === 'name';
              const isEditingThisEntry = editingProviderId === provider.id && editingField === 'entry';
              const isEditingThisExit = editingProviderId === provider.id && editingField === 'exit';

              return (
                <tr
                  key={provider.id}
                  className={`border-b transition-colors group ${
                    sheetTheme === 'sheet'
                      ? 'odd:bg-white even:bg-slate-50 border-slate-300 hover:bg-slate-100'
                      : 'odd:bg-slate-900/35 even:bg-slate-950/70 border-slate-800/80 hover:bg-indigo-950/30'
                  } ${
                    isSelected
                      ? sheetTheme === 'sheet'
                        ? 'ring-2 ring-indigo-500 bg-indigo-50/70'
                        : 'ring-2 ring-indigo-500 bg-indigo-950/50'
                      : ''
                  }`}
                >
                  {/* Prestador Name Cell (Editable on click) */}
                  <td
                    className={`text-left font-bold border-r sticky left-0 z-10 ${
                      rowDensity === 'spacious'
                        ? 'px-4 py-3 min-w-[280px] max-w-[340px]'
                        : 'px-2.5 py-1.5 min-w-[240px] max-w-[300px]'
                    } ${
                      sheetTheme === 'sheet'
                        ? isSelected
                          ? 'bg-indigo-50 text-indigo-900 border-slate-400'
                          : 'bg-white text-slate-900 border-slate-400'
                        : isSelected
                        ? 'bg-indigo-950 text-white border-slate-800'
                        : 'bg-slate-950 text-slate-200 border-slate-800'
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
                          className="w-full px-2 py-1 text-xs bg-slate-900 text-white border border-indigo-500 rounded-lg font-bold uppercase focus:outline-none"
                        />
                        <button
                          onClick={saveEditingField}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
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
                              rowDensity === 'spacious' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]'
                            } bg-gradient-to-tr from-indigo-900 to-indigo-700 text-indigo-100 border border-indigo-500/40 shadow-xs`}
                          >
                            {getInitials(provider.name)}
                          </div>

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
                            className={`truncate cursor-pointer hover:underline hover:text-indigo-400 font-bold tracking-tight ${
                              rowDensity === 'spacious' ? 'text-sm' : 'text-xs'
                            } ${sheetTheme === 'sheet' ? 'text-slate-900' : 'text-white'}`}
                            title={
                              role === 'supervisor'
                                ? 'Clique para renomear este prestador'
                                : 'Clique para abrir seu calendário mensal'
                            }
                          >
                            {provider.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-black uppercase tracking-wider shadow-xs">
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
                            className="text-slate-400 hover:text-indigo-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Ver calendário mensal deste colaborador"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>

                          {role === 'supervisor' && (
                            <button
                              onClick={() => startEditingField(provider, 'name')}
                              className="opacity-0 group-hover/name:opacity-100 text-slate-400 hover:text-indigo-400 p-1 rounded-lg hover:bg-slate-800 transition-opacity"
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
                    className={`text-center font-mono font-medium border-r cursor-pointer ${
                      rowDensity === 'spacious' ? 'px-2 py-2 min-w-[76px]' : 'px-1 py-1 min-w-[60px]'
                    } ${
                      sheetTheme === 'sheet'
                        ? 'border-slate-400 text-slate-800 hover:bg-slate-100'
                        : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
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
                        className="w-14 text-center text-xs bg-slate-900 text-white border border-indigo-500 rounded-lg font-mono focus:outline-none py-1"
                      />
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-slate-950/70 border border-slate-700/50 text-xs font-mono font-semibold text-slate-200">
                        {provider.entryTime || '07h00'}
                      </span>
                    )}
                  </td>

                  {/* Saída Cell (Editable) */}
                  <td
                    className={`text-center font-mono font-medium border-r cursor-pointer ${
                      rowDensity === 'spacious' ? 'px-2 py-2 min-w-[76px]' : 'px-1 py-1 min-w-[60px]'
                    } ${
                      sheetTheme === 'sheet'
                        ? 'border-slate-400 text-slate-800 hover:bg-slate-100'
                        : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
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
                        className="w-14 text-center text-xs bg-slate-900 text-white border border-indigo-500 rounded-lg font-mono focus:outline-none py-1"
                      />
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-slate-950/70 border border-slate-700/50 text-xs font-mono font-semibold text-slate-200">
                        {provider.exitTime || '19h00'}
                      </span>
                    )}
                  </td>

                  {/* Day cells 1 to 31 */}
                  {days.map(d => {
                    const shift = getShiftForProviderAndDate(provider.id, d.dateStr);
                    const shiftCode = shift ? (shift.shiftTypeId === 'st-d' ? 'D' : 'T') : '-';
                    const hasNote = Boolean(shift?.notes);

                    // Weekend subtle background tint for clear visual rhythm
                    const weekendCellBg = d.isWeekend
                      ? sheetTheme === 'sheet'
                        ? 'bg-amber-50/40'
                        : 'bg-amber-950/10'
                      : '';

                    return (
                      <td
                        key={`${provider.id}-${d.dateStr}`}
                        onClick={() => handleCellClick(provider, d.dateStr)}
                        onContextMenu={e => handleOpenCellEditor(e, provider, d.dateStr, d.dayNumber)}
                        className={`p-0 text-center font-mono relative transition-transform ${
                          rowDensity === 'spacious' ? 'h-13' : 'h-8'
                        } ${
                          role === 'supervisor'
                            ? 'cursor-pointer hover:opacity-85 active:scale-95'
                            : ''
                        } ${weekendCellBg} border-r ${
                          sheetTheme === 'sheet' ? 'border-slate-300' : 'border-slate-800/80'
                        }`}
                        title={
                          shift
                            ? `${provider.name}: ${shiftCode === 'T' ? 'Trabalha' : 'Descanso'} (${d.dayNumber}/${currentMonthIndex + 1})${hasNote ? ` - Nota: ${shift.notes}` : ''}`
                            : `${provider.name}: Sem Escala (${d.dayNumber}/${currentMonthIndex + 1})`
                        }
                      >
                        <div className="w-full h-full flex items-center justify-center p-1">
                          {shiftCode === 'T' && (
                            <span
                              className={`flex items-center justify-center rounded-lg font-black transition-transform ${
                                rowDensity === 'spacious' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs'
                              } ${
                                sheetTheme === 'sheet'
                                  ? 'bg-[#a9d18e] text-slate-900 border border-emerald-600/40 shadow-xs'
                                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20'
                              }`}
                            >
                              T
                            </span>
                          )}

                          {shiftCode === 'D' && (
                            <span
                              className={`flex items-center justify-center rounded-lg font-black transition-transform ${
                                rowDensity === 'spacious' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs'
                              } ${
                                sheetTheme === 'sheet'
                                  ? 'bg-[#98b7e8] text-slate-900 border border-blue-600/40 shadow-xs'
                                  : 'bg-blue-600/30 text-blue-200 border border-blue-500/50 shadow-xs ring-1 ring-blue-500/20'
                              }`}
                            >
                              D
                            </span>
                          )}

                          {shiftCode === '-' && (
                            <span
                              className={`flex items-center justify-center text-slate-600 font-bold transition-opacity group-hover:text-slate-500 ${
                                rowDensity === 'spacious' ? 'text-sm' : 'text-xs'
                              }`}
                            >
                              -
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
                      className={`p-1 text-center relative border-l ${
                        sheetTheme === 'sheet' ? 'border-slate-400 bg-slate-50' : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {/* Quick fill pattern dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setRowMenuOpenId(rowMenuOpenId === provider.id ? null : provider.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Preenchimento rápido da linha"
                          >
                            <Wand2 className="w-4 h-4" />
                          </button>

                          {rowMenuOpenId === provider.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-1.5 text-left text-xs space-y-1">
                              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">
                                Preencher Linha:
                              </div>
                              <button
                                onClick={() => handleFillRowPattern(provider.id, '12x36_T_start')}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 text-[11px]"
                              >
                                Alternar 12x36 (T / D)
                              </button>
                              <button
                                onClick={() => handleFillRowPattern(provider.id, '12x36_D_start')}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 text-[11px]"
                              >
                                Alternar 12x36 (D / T)
                              </button>
                              <button
                                onClick={() => handleFillRowPattern(provider.id, 'all_T')}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 text-[11px]"
                              >
                                Preencher tudo com Trabalha (T)
                              </button>
                              <button
                                onClick={() => handleFillRowPattern(provider.id, 'all_D')}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 text-[11px]"
                              >
                                Preencher tudo com Descanso (D)
                              </button>
                              <button
                                onClick={() => handleFillRowPattern(provider.id, 'clear')}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-rose-400 hover:bg-slate-800 text-[11px]"
                              >
                                Limpar linha (Sem Escala)
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete row */}
                        <button
                          onClick={() => handleDeleteProvider(provider.id, provider.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Remover prestador da escala"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

            {/* Totals Row: Total Workers (T) per day */}
            <tr
              className={`border-t-2 font-bold ${
                sheetTheme === 'sheet'
                  ? 'bg-slate-100 border-slate-400 text-slate-900'
                  : 'bg-slate-900/95 border-slate-700 text-slate-200'
              }`}
            >
              <td
                className={`sticky left-0 z-10 text-left border-r font-black ${
                  rowDensity === 'spacious' ? 'px-4 py-3 text-xs' : 'px-2.5 py-1.5 text-[11px]'
                } ${
                  sheetTheme === 'sheet'
                    ? 'bg-slate-100 text-slate-900 border-slate-400'
                    : 'bg-slate-900 text-indigo-300 border-slate-700'
                }`}
              >
                <span>Total Escalados no Dia (Trabalha)</span>
              </td>
              <td className="text-center font-mono text-xs text-slate-400 border-r border-slate-800">-</td>
              <td className="text-center font-mono text-xs text-slate-400 border-r border-slate-800">-</td>
              {days.map(d => {
                const count = getDailyWorkersCount(d.dateStr);
                return (
                  <td
                    key={`total-${d.dateStr}`}
                    className={`text-center font-mono font-black border-r ${
                      rowDensity === 'spacious' ? 'py-2.5 text-xs' : 'py-1 text-[11px]'
                    } ${
                      count > 0
                        ? sheetTheme === 'sheet'
                          ? 'text-emerald-700 bg-emerald-100/60 font-black'
                          : 'text-emerald-400 bg-emerald-950/40 font-black'
                        : 'text-slate-600'
                    } ${sheetTheme === 'sheet' ? 'border-slate-400' : 'border-slate-800'}`}
                  >
                    {count}
                  </td>
                );
              })}
              {role === 'supervisor' && <td className="border-l border-slate-800">-</td>}
            </tr>

            {/* Quick Add Inline Row for Supervisor */}
            {role === 'supervisor' && isAddingNewRow && (
              <tr className="bg-indigo-950/20 border-b border-indigo-500/40">
                <td className="p-2 sticky left-0 z-10 bg-slate-900 border-r border-slate-700">
                  <form onSubmit={handleAddNewProvider} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="Nome do novo prestador..."
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-slate-950 border border-indigo-500 rounded font-bold uppercase text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewRow(false)}
                      className="p-1 text-slate-400 hover:text-white"
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
                    className="w-12 text-center text-xs bg-slate-950 border border-slate-700 rounded font-mono text-white"
                  />
                </td>
                <td className="p-1 border-r border-slate-700">
                  <input
                    type="text"
                    value={newExit}
                    onChange={e => setNewExit(e.target.value)}
                    className="w-12 text-center text-xs bg-slate-950 border border-slate-700 rounded font-mono text-white"
                  />
                </td>
                <td colSpan={days.length + 1} className="p-2 text-slate-400 italic text-left pl-4">
                  Digite o nome e pressione Salvar para inserir na grade.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Add Row Button under table */}
        {role === 'supervisor' && !isAddingNewRow && (
          <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setIsAddingNewRow(true)}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Nova Linha de Prestador</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar a escala padrão original da imagem?')) {
                  resetToDemoData();
                }
              }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar dados de exemplo</span>
            </button>
          </div>
        )}
      </div>

      {/* Cell Detail / Note Modal */}
      {activeCellEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Editar Plantão - Dia {activeCellEdit.dayNumber}
                </h4>
                <p className="text-xs text-slate-400">
                  {activeCellEdit.providerName}
                </p>
              </div>
              <button
                onClick={() => setActiveCellEdit(null)}
                className="p-1 text-slate-400 hover:text-white"
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
                  className={`p-2.5 rounded-xl border text-center font-bold font-mono transition-all ${
                    activeCellEdit.currentCode === 'T'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500'
                      : 'bg-slate-950 text-emerald-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-base">T</div>
                  <div className="text-[10px] font-sans font-normal opacity-80">Trabalha</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCodeInModal('D')}
                  className={`p-2.5 rounded-xl border text-center font-bold font-mono transition-all ${
                    activeCellEdit.currentCode === 'D'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500'
                      : 'bg-slate-950 text-blue-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-base">D</div>
                  <div className="text-[10px] font-sans font-normal opacity-80">Descanso</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCodeInModal('-')}
                  className={`p-2.5 rounded-xl border text-center font-bold font-mono transition-all ${
                    activeCellEdit.currentCode === '-'
                      ? 'bg-slate-700 text-white border-slate-500 ring-2 ring-slate-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-base">-</div>
                  <div className="text-[10px] font-sans font-normal opacity-80">Sem Escala</div>
                </button>
              </div>
            </div>

            {/* Note text field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nota / Observação (cria o triângulo vermelho):
              </label>
              <textarea
                rows={2}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Ex: Cobertura especial, troca acordada, leito 4..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveCellEdit(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
  );
};
