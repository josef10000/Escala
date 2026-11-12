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
  {
    label: 'Todas',
    val: null,
    inactive: 'bg-[#181a24]/80 text-slate-300 border-[#2a2d3d] hover:bg-[#202332] hover:text-white',
    active: 'bg-white/20 text-white border-white/40 shadow-xs font-bold ring-1 ring-white/30',
  },
  {
    label: 'Leste',
    val: 'LESTE 1',
    inactive: 'bg-emerald-950/30 text-emerald-300/90 border-emerald-800/35 hover:bg-emerald-900/40 hover:text-emerald-200',
    active: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold ring-1 ring-emerald-400/30',
  },
  {
    label: 'Oeste',
    val: 'OESTE 1',
    inactive: 'bg-amber-950/30 text-amber-300/90 border-amber-800/35 hover:bg-amber-900/40 hover:text-amber-200',
    active: 'bg-amber-500/25 text-amber-200 border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold ring-1 ring-amber-400/30',
  },
  {
    label: 'Norte',
    val: 'NORTE 1',
    inactive: 'bg-sky-950/30 text-sky-300/90 border-sky-800/35 hover:bg-sky-900/40 hover:text-sky-200',
    active: 'bg-sky-500/25 text-sky-200 border-sky-400/60 shadow-[0_0_12px_rgba(14,165,233,0.25)] font-bold ring-1 ring-sky-400/30',
  },
  {
    label: 'Sul',
    val: 'SUL 1',
    inactive: 'bg-purple-950/30 text-purple-300/90 border-purple-800/35 hover:bg-purple-900/40 hover:text-purple-200',
    active: 'bg-purple-500/25 text-purple-200 border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-bold ring-1 ring-purple-400/30',
  },
  {
    label: 'Campinas',
    val: 'CAMPINAS 1',
    inactive: 'bg-cyan-950/30 text-cyan-300/90 border-cyan-800/35 hover:bg-cyan-900/40 hover:text-cyan-200',
    active: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(0,210,211,0.25)] font-bold ring-1 ring-cyan-400/30',
  },
  {
    label: 'Sorocaba',
    val: 'SOROCABA',
    inactive: 'bg-cyan-950/30 text-cyan-300/90 border-cyan-800/35 hover:bg-cyan-900/40 hover:text-cyan-200',
    active: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(0,210,211,0.25)] font-bold ring-1 ring-cyan-400/30',
  },
  {
    label: 'ABC',
    val: 'ABC 1',
    inactive: 'bg-rose-950/30 text-rose-300/90 border-rose-800/35 hover:bg-rose-900/40 hover:text-rose-200',
    active: 'bg-rose-500/25 text-rose-200 border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.25)] font-bold ring-1 ring-rose-400/30',
  },
];

export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  selectedRegion,
  onSelectRegion,
  regions,
  resultCount,
  totalCount,
  viewMode,
  onViewModeChange,
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

      {/* Left Column: Region Chips with Frosted Glass Colors Embedded Directly into Words */}
      <div className="flex flex-wrap items-center gap-2 relative z-10">
        <span className="text-slate-400 font-medium text-xs flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Região:</span>
        </span>

        {/* Frosted Glass Color Region Chips */}
        {QUICK_MACRO_REGIONS.map((chip) => {
          const isActive =
            (chip.val === null && !selectedRegion) ||
            selectedRegion === chip.val;

          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onSelectRegion(chip.val)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive ? chip.active : chip.inactive
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
            className="text-xs text-cyan-400 hover:text-cyan-300 underline ml-1.5 transition-colors font-medium cursor-pointer"
          >
            Limpar
          </button>
        )}
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
