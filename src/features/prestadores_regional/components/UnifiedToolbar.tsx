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
  Award,
  ArrowUpDown,
  Star,
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { normalizeText } from '../utils/search';

export type PhoneFilterType = 'all' | 'with' | 'without';
export type GradeFilterType = 'all' | 'A' | 'B' | 'C' | 'D_E';
export type ScoreSortType = 'default' | 'score_desc' | 'score_asc';

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
  gradeFilter: GradeFilterType;
  onGradeFilterChange: (grade: GradeFilterType) => void;
  scoreSort: ScoreSortType;
  onScoreSortChange: (sort: ScoreSortType) => void;
  pendingPhoneCount: number;
  cardDensity: 'spacious' | 'compact';
  onCardDensityChange: (density: 'spacious' | 'compact') => void;
  onExportCSV: () => void;
  showFavoritesOnly?: boolean;
  onToggleFavoritesOnly?: () => void;
  favoritesCount?: number;
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

const GRADE_OPTIONS: Array<{ id: GradeFilterType; label: string; activeTone: string }> = [
  { id: 'all', label: 'Todas', activeTone: 'bg-white/15 text-white' },
  { id: 'A', label: 'A', activeTone: 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40' },
  { id: 'B', label: 'B', activeTone: 'bg-sky-500/25 text-sky-200 border border-sky-400/40' },
  { id: 'C', label: 'C', activeTone: 'bg-amber-500/25 text-amber-200 border border-amber-400/40' },
  { id: 'D_E', label: 'D/E', activeTone: 'bg-rose-500/25 text-rose-200 border border-rose-400/40' },
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
  gradeFilter,
  onGradeFilterChange,
  scoreSort,
  onScoreSortChange,
  pendingPhoneCount,
  cardDensity,
  onCardDensityChange,
  onExportCSV,
  viewMode,
  onViewModeChange,
  showFavoritesOnly = false,
  onToggleFavoritesOnly,
  favoritesCount = 0,
}) => {
  return (
    <div className="bg-[#0e1016] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Region Chips in iOS Glass Style */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <span className="text-zinc-400 font-medium text-xs flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#00d2d3]" />
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
              className="text-xs text-[#00d2d3] hover:text-[#57f1db] underline ml-1.5 transition-colors font-medium cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Grade Filter & Score Sort Strip */}
        <div className="flex flex-wrap items-center gap-2 relative z-10 text-xs">
          <div className="inline-flex items-center gap-1 p-1 bg-[#090A0F] border border-white/[0.08] rounded-xl">
            <span className="text-zinc-400 font-medium px-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#00d2d3]" />
              <span className="hidden sm:inline">Nota:</span>
            </span>
            {GRADE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onGradeFilterChange(opt.id)}
                className={`px-2 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                  gradeFilter === opt.id
                    ? `${opt.activeTone} shadow-sm`
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              onScoreSortChange(
                scoreSort === 'default'
                  ? 'score_desc'
                  : scoreSort === 'score_desc'
                  ? 'score_asc'
                  : 'default'
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              scoreSort !== 'default'
                ? 'bg-[#00d2d3]/15 border-[#00d2d3]/35 text-[#00d2d3]'
                : 'bg-[#090A0F] border-white/[0.08] text-zinc-300 hover:text-white'
            }`}
            title="Alternar ordenação por nota operacional"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#00d2d3]" />
            <span>
              {scoreSort === 'default'
                ? 'Ordem Padrão'
                : scoreSort === 'score_desc'
                ? 'Maior Nota'
                : 'Menor Nota'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Controls Row: Phone Filters, Favorites, Density, View Modes, Export CSV */}
      <div className="flex flex-wrap items-center gap-2.5 justify-between lg:justify-end relative z-10 text-xs pt-2.5 border-t border-white/[0.06]">
        {/* Quick Filter Pills (Phone, WhatsApp, Favorites) */}
        <div className="inline-flex items-center p-1 bg-[#090A0F] border border-white/[0.08] rounded-xl text-xs gap-1">
          <button
            type="button"
            onClick={() => onPhoneFilterChange('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              phoneFilter === 'all'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onPhoneFilterChange('with')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              phoneFilter === 'with'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
            title="Filtrar técnicos com WhatsApp ativo cadastrado"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Com WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => onPhoneFilterChange('without')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              phoneFilter === 'without'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
            title="Prestadores pendentes de telefone"
          >
            <PhoneOff className="w-3 h-3" />
            <span>Sem Tel ({pendingPhoneCount})</span>
          </button>
          {onToggleFavoritesOnly && (
            <button
              type="button"
              onClick={onToggleFavoritesOnly}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                showFavoritesOnly
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
              title="Filtrar apenas prestadores favoritados"
            >
              <Star className={`w-3 h-3 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
              <span>Favoritos ({favoritesCount})</span>
            </button>
          )}
        </div>

        {/* Density Toggle */}
        <div className="inline-flex p-1 bg-[#090A0F] border border-white/[0.08] rounded-xl text-xs">
          <button
            type="button"
            onClick={() => onCardDensityChange('spacious')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              cardDensity === 'spacious'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
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
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Compacto
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex p-1 bg-[#090A0F] border border-white/[0.08] rounded-xl text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[#00d2d3]/20 text-[#00d2d3] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
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
                ? 'bg-[#00d2d3]/20 text-[#00d2d3] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
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
                ? 'bg-[#00d2d3]/20 text-[#00d2d3] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
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
          className="p-2 rounded-xl bg-[#090A0F] hover:bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          title="Exportar dados para CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>
      </div>
    </div>
  );
};
