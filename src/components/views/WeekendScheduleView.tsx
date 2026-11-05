import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { getMonthDaysArray, MONTH_NAMES_PT, formatShortDate } from '../../utils/dateUtils';
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Search,
  Check,
  X,
  ChevronDown,
  Filter,
  UserCheck,
  Sparkles,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { WeekendColumn } from '../../types';

interface WeekendScheduleViewProps {
  onOpenLeaderAuth?: () => void;
}

export const WeekendScheduleView: React.FC<WeekendScheduleViewProps> = ({ onOpenLeaderAuth }) => {
  const {
    currentYear,
    currentMonthIndex,
    providers,
    isLeaderAuthenticated,
    weekendColumns,
    weekendAssignments,
    addWeekendColumn,
    renameWeekendColumn,
    deleteWeekendColumn,
    updateWeekendCell,
    clearWeekendCell,
    clonePreviousMonthWeekendSchedule,
  } = useSchedule();

  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  let prevMonthIndex = currentMonthIndex - 1;
  let prevYear = currentYear;
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevYear--;
  }
  const prevMonthName = MONTH_NAMES_PT[prevMonthIndex];

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumnFilter, setSelectedColumnFilter] = useState<string | 'all'>('all');

  // Column management states
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');

  // Cell editing state
  const [editingCell, setEditingCell] = useState<{
    dateStr: string;
    formattedDate: string;
    dayName: string;
    columnId: string;
    columnName: string;
    currentValue: string;
  } | null>(null);
  const [cellInputValue, setCellInputValue] = useState('');

  // Weekend days for the current viewed month
  const allMonthDays = getMonthDaysArray(currentYear, currentMonthIndex);
  const weekendDays = allMonthDays
    .filter(d => d.dayOfWeek === 0 || d.dayOfWeek === 6)
    .map(d => ({
      dateStr: d.dateStr,
      formattedDate: formatShortDate(d.dateStr),
      dayOfWeek: d.dayOfWeek,
      dayOfWeekName: d.dayOfWeek === 6 ? 'SÁBADO' : 'DOMINGO',
    }));

  // Handle adding new column
  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    addWeekendColumn(newColumnName.trim());
    setNewColumnName('');
    setIsAddingColumn(false);
  };

  // Handle renaming column
  const handleSaveColumnRename = (columnId: string) => {
    if (!editingColumnName.trim()) {
      setEditingColumnId(null);
      return;
    }
    renameWeekendColumn(columnId, editingColumnName.trim());
    setEditingColumnId(null);
  };

  // Handle cell click
  const handleCellClick = (
    dateStr: string,
    formattedDate: string,
    dayName: string,
    column: WeekendColumn,
    currentValue: string
  ) => {
    if (!isLeaderAuthenticated) {
      if (onOpenLeaderAuth) onOpenLeaderAuth();
      return;
    }
    setEditingCell({
      dateStr,
      formattedDate,
      dayName,
      columnId: column.id,
      columnName: column.name,
      currentValue: currentValue || '',
    });
    setCellInputValue(currentValue || '');
  };

  // Handle cell save
  const handleSaveCell = (valueToSave?: string) => {
    if (!editingCell) return;
    const value = valueToSave !== undefined ? valueToSave : cellInputValue;
    updateWeekendCell(editingCell.dateStr, editingCell.columnId, value);
    setEditingCell(null);
  };

  // Filtered weekend rows based on search
  const filteredWeekendDays = weekendDays.filter(day => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (day.formattedDate.toLowerCase().includes(q) || day.dayOfWeekName.toLowerCase().includes(q)) {
      return true;
    }
    // Check if any slot has this query
    const slots = weekendAssignments[day.dateStr] || {};
    return Object.values(slots).some(val => val && val.toLowerCase().includes(q));
  });

  // Calculate quick stats
  const totalAssignedSlots = weekendDays.reduce((acc, day) => {
    const slots = weekendAssignments[day.dateStr] || {};
    return acc + Object.values(slots).filter(v => v && v.trim() !== '' && v.trim() !== '-').length;
  }, 0);
  const totalPossibleSlots = weekendDays.length * weekendColumns.length;

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar for Weekend Schedule */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141A] border border-white/[0.08] p-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
              <span>QUADRO DE FINS DE SEMANA</span>
              <span className="text-zinc-600">•</span>
              <span className="text-purple-300">{monthName} de {currentYear}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Plantões de Sábado e Domingo
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative min-w-[180px] max-w-[240px]">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nome ou data..."
              className="w-full bg-[#1A1D24] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00d2d3]/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Add Column Button (Only for Supervisors) */}
          {isLeaderAuthenticated ? (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Coluna</span>
            </button>
          ) : (
            <button
              onClick={onOpenLeaderAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1D24] hover:bg-[#252830] text-zinc-400 hover:text-zinc-200 border border-white/[0.08] rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Apenas supervisores podem editar colunas e vagas"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Editar Escala</span>
            </button>
          )}

          {/* Projetar Rodízio Button */}
          {isLeaderAuthenticated ? (
            <button
              onClick={() => {
                const count = clonePreviousMonthWeekendSchedule(currentYear, currentMonthIndex);
                setToastMessage(`${count} vagas de fim de semana projetadas a partir de ${prevMonthName}!`);
                setTimeout(() => setToastMessage(null), 4000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-98"
              title="Projetar escala de fim de semana com base no rodízio do mês anterior"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Projetar Rodízio</span>
            </button>
          ) : null}

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1D24] hover:bg-[#252830] text-zinc-200 border border-white/[0.08] rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Toast feedback */}
      {toastMessage && (
        <div className="p-3 bg-purple-500/15 border border-purple-500/30 text-purple-200 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-white">×</button>
        </div>
      )}

      {/* Smart Continuity Banner if Weekend Slots are Empty */}
      {totalAssignedSlots === 0 && (
        <div className="bg-gradient-to-r from-[#141220] via-[#1a172c] to-[#141220] border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Fins de semana de {monthName} de {currentYear} sem plantões
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Sugestão de Rodízio
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Deseja preencher as vagas e grupos de plantão automaticamente usando como referência os fins de semana de <strong className="text-white">{prevMonthName} {prevYear}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              {isLeaderAuthenticated ? (
                <button
                  onClick={() => {
                    const count = clonePreviousMonthWeekendSchedule(currentYear, currentMonthIndex);
                    setToastMessage(`${count} vagas de fim de semana projetadas com sucesso!`);
                    setTimeout(() => setToastMessage(null), 4000);
                  }}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Projetar Rodízio de Fins de Semana</span>
                </button>
              ) : (
                <button
                  onClick={onOpenLeaderAuth}
                  className="px-4 py-2 bg-[#1A1D24] hover:bg-[#252830] text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Desbloquear como Líder</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Weekend Schedule Table */}
      <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#161820] text-white border-b border-white/[0.08]">
                {/* Column 1: DATA */}
                <th className="py-3 px-3 min-w-[110px] font-bold text-white tracking-wider border-r border-white/[0.08] bg-[#161820]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>DATA</span>
                    <Filter className="w-3 h-3 text-zinc-500 opacity-60" />
                  </div>
                </th>

                {/* Column 2: DIA SEMANA */}
                <th className="py-3 px-3 min-w-[120px] font-bold text-white tracking-wider border-r border-white/[0.08] bg-[#161820]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>DIA SEMANA</span>
                    <Filter className="w-3 h-3 text-zinc-500 opacity-60" />
                  </div>
                </th>

                {/* Dynamic Duty Columns */}
                {weekendColumns.map((col, idx) => (
                  <th
                    key={col.id}
                    className="py-3 px-3 min-w-[150px] font-bold text-white tracking-wider border-r border-white/[0.08] bg-[#161820] group relative"
                  >
                    {editingColumnId === col.id ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingColumnName}
                          onChange={e => setEditingColumnName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveColumnRename(col.id);
                            if (e.key === 'Escape') setEditingColumnId(null);
                          }}
                          autoFocus
                          className="w-full bg-[#12141A] border border-[#00d2d3] rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveColumnRename(col.id)}
                          className="p-1 text-emerald-400 hover:text-white cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingColumnId(null)}
                          className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate uppercase font-bold text-zinc-100">{col.name}</span>
                        
                        <div className="flex items-center gap-1">
                          <Filter className="w-3 h-3 text-zinc-500 opacity-60" />
                          
                          {/* Supervisor edit/delete column icons */}
                          {isLeaderAuthenticated && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() => {
                                  setEditingColumnId(col.id);
                                  setEditingColumnName(col.name);
                                }}
                                className="p-1 hover:bg-white/[0.1] rounded text-zinc-400 hover:text-white cursor-pointer transition-colors"
                                title="Renomear coluna"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                              {weekendColumns.length > 1 && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Tem certeza que deseja excluir a coluna "${col.name}"?`)) {
                                      deleteWeekendColumn(col.id);
                                    }
                                  }}
                                  className="p-1 hover:bg-rose-500/20 rounded text-zinc-400 hover:text-rose-400 cursor-pointer transition-colors"
                                  title="Excluir coluna"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {filteredWeekendDays.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + weekendColumns.length}
                    className="py-10 text-center text-zinc-500"
                  >
                    Nenhum plantão de fim de semana encontrado para os critérios de busca.
                  </td>
                </tr>
              ) : (
                filteredWeekendDays.map((row, rIdx) => {
                  const isSaturday = row.dayOfWeek === 6;
                  const rowBg = rIdx % 2 === 0 ? 'bg-[#12141A]' : 'bg-[#151720]';
                  const rowAssignments = weekendAssignments[row.dateStr] || {};

                  return (
                    <tr key={row.dateStr} className={`${rowBg} hover:bg-[#1a1d28] transition-colors`}>
                      {/* Column 1: DATA */}
                      <td className="py-2.5 px-3 font-mono font-medium text-zinc-300 border-r border-white/[0.06] whitespace-nowrap">
                        {row.formattedDate}
                      </td>

                      {/* Column 2: DIA SEMANA */}
                      <td className="py-2.5 px-3 border-r border-white/[0.06] whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isSaturday
                              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {row.dayOfWeekName}
                        </span>
                      </td>

                      {/* Dynamic Columns */}
                      {weekendColumns.map(col => {
                        const cellVal = rowAssignments[col.id] || '';
                        const hasVal = Boolean(cellVal && cellVal.trim());
                        const isDash = cellVal.trim() === '-';

                        return (
                          <td
                            key={col.id}
                            onClick={() =>
                              handleCellClick(
                                row.dateStr,
                                row.formattedDate,
                                row.dayOfWeekName,
                                col,
                                cellVal
                              )
                            }
                            className={`py-2 px-3 border-r border-white/[0.04] transition-all cursor-pointer relative group ${
                              hasVal && !isDash
                                ? 'text-zinc-100 font-semibold'
                                : 'text-zinc-500 font-normal italic'
                            } hover:bg-white/[0.04]`}
                          >
                            <div className="flex items-center justify-between min-h-[22px]">
                              <span>{hasVal ? cellVal : <span className="opacity-40">-</span>}</span>
                              {isLeaderAuthenticated && (
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 ml-1">
                                  ✎
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Status Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-[#161820] border-t border-white/[0.08] text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00d2d3]" />
            <span>
              Total: <strong>{weekendDays.length} dias de fim de semana</strong> ({totalAssignedSlots} de {totalPossibleSlots} vagas preenchidas)
            </span>
          </div>

          <div className="text-[11px] text-zinc-500">
            {isLeaderAuthenticated ? (
              <span>Clique em qualquer célula para alterar o plantonista responsável</span>
            ) : (
              <span>Visualização de plantões de fim de semana • Homologado</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Modal: Add New Column */}
      {isAddingColumn && (
        <div
          onClick={() => setIsAddingColumn(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#12141A] text-zinc-100 rounded-3xl p-5 border border-white/[0.08] shadow-2xl max-w-sm w-full space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00d2d3]/15 text-[#00d2d3] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Nova Coluna de Plantão</h3>
              </div>
              <button
                onClick={() => setIsAddingColumn(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Nome da Coluna / Grupo:
                </label>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={e => setNewColumnName(e.target.value)}
                  placeholder="Ex: GRUPO (10h - 18h) ou COORDENAÇÃO"
                  autoFocus
                  className="w-full bg-[#1A1D24] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00d2d3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-[#1A1D24] border border-white/[0.08] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newColumnName.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#003731] bg-[#00d2d3] hover:bg-[#57f1db] disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  Criar Coluna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Cell Collaborator Editor */}
      {editingCell && (
        <div
          onClick={() => setEditingCell(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#12141A] text-zinc-100 rounded-3xl p-5 border border-white/[0.08] shadow-2xl max-w-md w-full space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Editar Plantonista</h3>
                <p className="text-xs text-zinc-400">
                  {editingCell.dayName}, {editingCell.formattedDate} • {editingCell.columnName}
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick text input */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Nome do Plantonista ou Informação:
              </label>
              <input
                type="text"
                value={cellInputValue}
                onChange={e => setCellInputValue(e.target.value)}
                placeholder="Digite o nome ou selecione abaixo..."
                autoFocus
                className="w-full bg-[#1A1D24] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00d2d3]"
              />
            </div>

            {/* Quick Picker from Team Providers */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Selecionar da Equipe:
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {providers.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCellInputValue(p.name);
                      handleSaveCell(p.name);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors flex items-center justify-between text-xs text-zinc-200 cursor-pointer"
                  >
                    <span className="font-semibold truncate">{p.name}</span>
                    <span className="text-[10px] text-zinc-500 bg-[#1A1D24] px-1.5 py-0.5 rounded">
                      {p.regime || '12×36'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  clearWeekendCell(editingCell.dateStr, editingCell.columnId);
                  setEditingCell(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 border border-rose-900/50 transition-colors cursor-pointer"
              >
                Limpar Vaga
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-[#1A1D24] border border-white/[0.08] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCell()}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#003731] bg-[#00d2d3] hover:bg-[#57f1db] transition-all cursor-pointer shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
