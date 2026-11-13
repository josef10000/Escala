import React from 'react';
import { MapPin } from 'lucide-react';
import { normalizeText } from '../utils/search';

interface RegionChipsProps {
  regions: { regiao: string; count: number }[];
  selectedRegion: string | null;
  onSelectRegion: (reg: string | null) => void;
  totalCount: number;
}

// iPhone / iOS Frosted Glass Theme for regions
const getIosRegionGlass = (regionName: string, isSelected: boolean) => {
  const norm = normalizeText(regionName);

  if (isSelected) {
    if (norm.startsWith('leste')) {
      return 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 shadow-[0_4px_20px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-emerald-400/30';
    }
    if (norm.startsWith('oeste')) {
      return 'bg-amber-500/25 border-amber-400/50 text-amber-200 shadow-[0_4px_20px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-amber-400/30';
    }
    if (norm.startsWith('norte')) {
      return 'bg-sky-500/25 border-sky-400/50 text-sky-200 shadow-[0_4px_20px_rgba(14,165,233,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-sky-400/30';
    }
    if (norm.startsWith('sul')) {
      return 'bg-purple-500/25 border-purple-400/50 text-purple-200 shadow-[0_4px_20px_rgba(168,85,247,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-purple-400/30';
    }
    if (norm.startsWith('abc')) {
      return 'bg-rose-500/25 border-rose-400/50 text-rose-200 shadow-[0_4px_20px_rgba(244,63,94,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-rose-400/30';
    }
    return 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200 shadow-[0_4px_20px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-cyan-400/30';
  }

  // Unselected iOS Glass Style: subtle translucent frosted pill with glossy top edge
  return 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-white/20 text-slate-300 hover:text-white shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] active:scale-95';
};

const getBadgeGlass = (regionName: string, isSelected: boolean) => {
  const norm = normalizeText(regionName);
  if (isSelected) {
    if (norm.startsWith('leste')) return 'bg-emerald-500/40 text-emerald-100 border border-emerald-400/30';
    if (norm.startsWith('oeste')) return 'bg-amber-500/40 text-amber-100 border border-amber-400/30';
    if (norm.startsWith('norte')) return 'bg-sky-500/40 text-sky-100 border border-sky-400/30';
    if (norm.startsWith('sul')) return 'bg-purple-500/40 text-purple-100 border border-purple-400/30';
    if (norm.startsWith('abc')) return 'bg-rose-500/40 text-rose-100 border border-rose-400/30';
    return 'bg-cyan-500/40 text-cyan-100 border border-cyan-400/30';
  }
  return 'bg-black/30 text-slate-400 border border-white/5';
};

export const RegionChips: React.FC<RegionChipsProps> = ({
  regions,
  selectedRegion,
  onSelectRegion,
  totalCount,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2.5">
        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-semibold tracking-wider text-slate-400">
          Regiões & Bases Operacionais
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
        {/* All Regions iOS Pill */}
        <button
          type="button"
          onClick={() => onSelectRegion(null)}
          className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-200 border ${
            selectedRegion === null
              ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100 shadow-[0_4px_20px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-cyan-400/30'
              : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-white/20 text-slate-300 hover:text-white shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] active:scale-95'
          }`}
        >
          <span>Todas as Regiões</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono backdrop-blur-sm transition-colors ${
              selectedRegion === null
                ? 'bg-cyan-500/40 text-cyan-100 border border-cyan-400/30'
                : 'bg-black/30 text-slate-400 border border-white/5'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Region Pills (iPhone Frosted Glass) */}
        {regions.map((r) => {
          const isSelected = selectedRegion === r.regiao;
          const glassClass = getIosRegionGlass(r.regiao, isSelected);
          const badgeClass = getBadgeGlass(r.regiao, isSelected);

          return (
            <button
              key={r.regiao}
              type="button"
              onClick={() => onSelectRegion(isSelected ? null : r.regiao)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-200 border ${glassClass}`}
            >
              <span>{r.regiao}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono backdrop-blur-sm transition-colors ${badgeClass}`}
              >
                {r.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
