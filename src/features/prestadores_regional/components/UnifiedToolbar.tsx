import React from 'react';
import { ViewMode } from '../types';
import {
  MapPin,
  LayoutGrid,
  Table as TableIcon,
  Terminal,
  Filter,
  Download,
  Phone,
  PhoneOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export type PhoneFilterType = 'all' | 'with' | 'without';

interface UnifiedToolbarProps {
  selectedRegion: string | null;
  onSelectRegion: (reg: string | null) => void;
  regions: { regiao: string; count: number }[];
  resultCount: number;
  totalCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // Color filter (discrete dots)
  selectedColor: string | null;
  onSelectColor: (color: string | null) => void;
  // Phone sanitization filter
  phoneFilter: PhoneFilterType;
  onPhoneFilterChange: (filter: PhoneFilterType) => void;
  pendingPhoneCount: number;
  // Density & Export
  cardDensity: 'spacious' | 'compact';
  onCardDensityChange: (density: 'spacious' | 'compact') => void;
  onExportCSV: () => void;
}

const QUICK_MACRO_REGIONS = [
  { label: 'Todas', val: null },
  { label: 'Leste', val: 'LESTE 1' },
  { label: 'Oeste', val: 'OESTE 1' },
  { label: 'Norte', val: 'NORTE 1' },
  { label: 'Sul', val: 'SUL 1' },
  { label: 'Campinas', val: 'CAMPINAS 1' },
  { label: 'Sorocaba', val: 'SOROCABA' },
  { label: 'ABC', val: 'ABC 1' },
];

const COLOR_PALETTE_DOTS = [
  { id: 'cyan', title: 'Cyan (Escala)', dot: 'bg-cyan-400 hover:bg-cyan-300' },
  { id: 'emerald', title: 'Esmeralda', dot: 'bg-emerald-400 hover:bg-emerald-300' },
  { id: 'amber', title: 'Âmbar', dot: 'bg-amber-400 hover:bg-amber-300' },
  { id: 'purple', title: 'Roxo', dot: 'bg-purple-400 hover:bg-purple-300' },
  { id: 'indigo', title: 'Índigo', dot: 'bg-indigo-400 hover:bg-indigo-300' },
  { id: 'rose', title: 'Rosa', dot: 'bg-rose-400 hover:bg-rose-300' },
  { id: 'sky', title: 'Céu', dot: 'bg-sky-400 hover:bg-sky-300' },
  { id: 'teal', title: 'Teal', dot: 'bg-teal-400 hover:bg-teal-300' },
];

export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  selectedRegion,
  onSelectRegion,
  regions,
  resultCount,
  totalCount,
  viewMode,
  onViewModeChange,
  selectedColor,
  onSelectColor,
  phoneFilter,
  onPhoneFilterChange,
  pendingPhoneCount,
  cardDensity,
  onCardDensityChange,
  onExportCSV,
}) => {
  return (
    <div className="bg-[#13151c]/90 backdrop-blur-xl border border-[#1e2029] rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-md relative overflow-hidden">
      {/* Subtle top reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Left Column: Regions + Color Dots (ONLY dots on the same line, no text) */}
      <div className="flex flex-wrap items-center gap-2 relative z-10">
        <span className="text-slate-400 font-medium text-xs flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Região:</span>
        </span>

        {/* Region Chips */}
        {QUICK_MACRO_REGIONS.map((chip) => {
          const isActive =
            (chip.val === null && !selectedRegion) ||
            selectedRegion === chip.val;

          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onSelectRegion(chip.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-[#00d2d3] text-black font-bold shadow-xs'
                  : 'bg-[#1a1b22] hover:bg-[#23252f] text-slate-300 border border-[#2a2b32]'
              }`}
            >
              {chip.label}
            </button>
          );
        })}

        {selectedRegion && (
          <button
            type="button"
            onClick={() => onSelectRegion(null)}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline ml-1 transition-colors font-medium cursor-pointer"
          >
            Limpar
          </button>
        )}

        {/* Separator Divider */}
        <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

        {/* Color Dots ONLY (Without text labels, directly on the same line) */}
        <div className="flex items-center gap-1.5 ml-1">
          {COLOR_PALETTE_DOTS.map((c) => {
            const isSelected = selectedColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectColor(isSelected ? null : c.id)}
                className={`w-4 h-4 rounded-full ${c.dot} transition-all duration-150 cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#13151c] scale-110 shadow-sm'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={`Filtrar prestadores: ${c.title}`}
              />
            );
          })}

          {selectedColor && (
            <button
              type="button"
              onClick={() => onSelectColor(null)}
              className="text-[11px] text-slate-400 hover:text-white underline ml-1 transition-colors font-medium cursor-pointer"
              title="Limpar filtro de cor"
            >
              (todas)
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Phone Sanitation, Density, CSV Export, Dropdown & View Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-between lg:justify-end relative z-10 text-xs">
        {/* Phone Filter Toggle */}
        <div className="inline-flex p-1 bg-[#0d0e13] border border-[#1e2029] rounded-xl text-xs shadow-inner">
          <button
            type="button"
            onClick={() => onPhoneFilterChange('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              phoneFilter === 'all'
                ? 'bg-white/10 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onPhoneFilterChange('with')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              phoneFilter === 'with'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Apenas prestadores com telefone cadastrado"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Com Tel</span>
          </button>
          <button
            type="button"
            onClick={() => onPhoneFilterChange('without')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              phoneFilter === 'without'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Prestadores sem telefone cadastrado (pendentes)"
          >
            <PhoneOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Sem Tel</span>
            {pendingPhoneCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 font-mono text-[10px]">
                {pendingPhoneCount}
              </span>
            )}
          </button>
        </div>

        {/* Density Switcher (only for Cards view) */}
        {viewMode === 'cards' && (
          <div className="inline-flex p-1 bg-[#0d0e13] border border-[#1e2029] rounded-xl text-xs shadow-inner">
            <button
              type="button"
              onClick={() => onCardDensityChange('spacious')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                cardDensity === 'spacious'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Modo Amplo (cards padrão)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Amplo</span>
            </button>
            <button
              type="button"
              onClick={() => onCardDensityChange('compact')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                cardDensity === 'compact'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Modo Compacto (mais prestadores por tela)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Compacto</span>
            </button>
          </div>
        )}

        {/* CSV Export Button */}
        <button
          type="button"
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-[#2a2b38] hover:border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs"
          title="Exportar prestadores filtrados para planilha Excel/CSV"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>CSV</span>
        </button>

        {/* Region Select Dropdown */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <select
            value={selectedRegion || ''}
            onChange={(e) => onSelectRegion(e.target.value || null)}
            className="appearance-none pl-8 pr-7 py-1.5 bg-[#1a1b22] text-[#e3e1e9] text-xs rounded-xl border border-[#2a2b32] hover:border-[#00d2d3]/40 focus:border-[#00d2d3] focus:outline-none cursor-pointer font-medium transition-all shadow-inner"
          >
            <option value="">Todas as Regiões ({totalCount})</option>
            {regions.map((r) => (
              <option key={r.regiao} value={r.regiao}>
                {r.regiao} ({r.count})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="inline-flex p-1 bg-[#0d0e13] border border-[#1e2029] rounded-xl shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            title="Visualização em Cards"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[#00d2d3] text-black font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title="Visualização em Tabela"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[#00d2d3] text-black font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('terminal')}
            title="Visualização em Terminal Rápido"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'terminal'
                ? 'bg-[#00d2d3] text-black font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
