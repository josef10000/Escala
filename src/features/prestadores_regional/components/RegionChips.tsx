import React from 'react';
import { MapPin } from 'lucide-react';

interface RegionChipsProps {
  regions: { regiao: string; count: number }[];
  selectedRegion: string | null;
  onSelectRegion: (reg: string | null) => void;
  totalCount: number;
}

export const RegionChips: React.FC<RegionChipsProps> = ({
  regions,
  selectedRegion,
  onSelectRegion,
  totalCount,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2.5">
        <MapPin className="w-3.5 h-3.5 text-[#00d2d3]" />
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Filtrar por Região / Base
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <button
          type="button"
          onClick={() => onSelectRegion(null)}
          className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            selectedRegion === null
              ? 'bg-[#00d2d3] text-[#003731] border-[#00d2d3] shadow-md shadow-[#00d2d3]/20 font-black'
              : 'bg-[#13151c] text-zinc-300 border-[#1e2029] hover:bg-[#1a1c26] hover:text-white'
          }`}
        >
          <span>Todas as Regiões</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-xs font-mono ${
              selectedRegion === null ? 'bg-[#003731] text-[#00d2d3]' : 'bg-[#1a1b22] text-zinc-400'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {regions.map((r) => {
          const isSelected = selectedRegion === r.regiao;
          return (
            <button
              key={r.regiao}
              type="button"
              onClick={() => onSelectRegion(isSelected ? null : r.regiao)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                isSelected
                  ? 'bg-[#00d2d3] text-[#003731] border-[#00d2d3] shadow-md shadow-[#00d2d3]/20 font-black ring-2 ring-[#00d2d3]/30'
                  : 'bg-[#13151c] text-zinc-300 border-[#1e2029] hover:bg-[#1a1c26] hover:text-white hover:border-zinc-700'
              }`}
            >
              <span>{r.regiao}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-mono ${
                  isSelected ? 'bg-[#003731] text-[#00d2d3]' : 'bg-[#1a1b22] text-zinc-400'
                }`}
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
