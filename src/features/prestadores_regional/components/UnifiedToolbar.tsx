import React from 'react';
import { ViewMode } from '../types';
import {
  LayoutGrid,
  Table as TableIcon,
  Terminal,
  Filter,
  Download,
  Phone,
  PhoneOff,
} from 'lucide-react';
import { normalizeText } from '../utils/search';

export type PhoneFilterType = 'all' | 'with' | 'without';

interface UnifiedToolbarProps {
  selectedRegion: string | null;
  onSelectRegion: (reg: string | null) => void;
  regions: { regiao: string; count: number }[];
  resultCount: number;
  totalCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  phoneFilter: PhoneFilterType;
  onPhoneFilterChange: (filter: PhoneFilterType) => void;
  pendingPhoneCount: number;
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

const getIosMacroGlass = (label: string, isActive: boolean) => {
  const norm = normalizeText(label);
  if (isActive) {
    if (norm.startsWith('leste')) return 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 shadow-[0_4px_16px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/30';
    if (norm.startsWith('oeste')) return 'bg-amber-500/25 border-amber-400/50 text-amber-200 shadow-[0_4px_16px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/30';
    if (norm.startsWith('norte')) return 'bg-sky-500/25 border-sky-400/50 text-sky-200 shadow-[0_4px_16px_rgba(14,165,233,0.3)] ring-1 ring-sky-400/30';
    if (norm.startsWith('sul')) return 'bg-purple-500/25 border-purple-400/50 text-purple-200 shadow-[0_4px_16px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/30';
    if (norm.startsWith('abc')) return 'bg-rose-500/25 border-rose-400/50 text-rose-200 shadow-[0_4px_16px_rgba(244,63,94,0.3)] ring-1 ring-rose-400/30';
    return 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200 shadow-[0_4px_16px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/30';
  }
  return 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-white/20 text-slate-300 hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] active:scale-95';
};

export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  selectedRegion,
  onSelectRegion,
  phoneFilter,
  onPhoneFilterChange,
  pendingPhoneCount,
  cardDensity,
  onCardDensityChange,
  onExportCSV,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
      {/* Region Chips in iOS Glass Style */}
      <div className="flex flex-wrap items-center gap-2 relative z-10">
        <span className="text-slate-400 font-medium text-xs flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Região:</span>
        </span>

        {QUICK_MACRO_REGIONS.map((chip) => {
          const isActive =
            (chip.val === null && !selectedRegion) ||
            selectedRegion === chip.val;
          const glassClass = getIosMacroGlass(chip.label, isActive);

          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onSelectRegion(chip.val)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all duration-200 cursor-pointer ${glassClass}`}
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

      {/* Right Controls: Filters, Density, CSV, View Modes */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-between lg:justify-end relative z-10 text-xs">
        {/* Phone Filter Toggle (iOS Segmented Control) */}
        <div className="inline-flex p-1 bg-slate-950/80 border border-white/10 rounded-xl text-xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => onPhoneFilterChange('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              phoneFilter === 'all'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onPhoneFilterChange('with')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
              phoneFilter === 'with'
                ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
            title="Prestadores com telefone cadastrado"
          >
            <Phone className="w-3 h-3" />
            <span>Com Tel</span>
          </button>
          <button
            type="button"
            onClick={() => onPhoneFilterChange('without')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
              phoneFilter === 'without'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
            title="Prestadores sem telefone cadastrado"
          >
            <PhoneOff className="w-3 h-3" />
            <span>Sem Tel ({pendingPhoneCount})</span>
          </button>
        </div>

        {/* Density Toggle */}
        <div className="inline-flex p-1 bg-slate-950/80 border border-white/10 rounded-xl text-xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => onCardDensityChange('spacious')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              cardDensity === 'spacious'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Confortável
          </button>
          <button
            type="button"
            onClick={() => onCardDensityChange('compact')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              cardDensity === 'compact'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Compacto
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex p-1 bg-slate-950/80 border border-white/10 rounded-xl text-xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Visualização em Cards"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Visualização em Tabela"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('terminal')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'terminal'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Terminal de Ações Rápidas"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={onExportCSV}
          className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 backdrop-blur-md"
          title="Exportar dados para CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>
      </div>
    </div>
  );
};
