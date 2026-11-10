import React, { useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  resultCount: number;
  totalCount: number;
  onClear: () => void;
  selectedRegion: string | null;
  onSelectRegion: (reg: string | null) => void;
  regions: { regiao: string; count: number }[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  resultCount,
  totalCount,
  onClear,
  selectedRegion,
  onSelectRegion,
  regions,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
      {/* Search Input */}
      <div className="relative flex-1 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 transition-colors">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por código, nome ou região (ex: 18890, leste 1, campinas)..."
          className="w-full pl-9 pr-16 py-2 bg-slate-900 text-white placeholder-slate-500 text-xs sm:text-sm rounded-lg border border-slate-800 hover:border-slate-700 focus:border-slate-600 focus:outline-none transition-colors"
        />

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {resultCount}
          </span>
        </div>
      </div>

      {/* Region Filter Dropdown - Clean & Compact */}
      <div className="relative shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <select
            value={selectedRegion || ''}
            onChange={(e) => onSelectRegion(e.target.value || null)}
            className="w-full sm:w-auto appearance-none pl-8 pr-7 py-2 bg-slate-900 text-slate-300 text-xs sm:text-sm rounded-lg border border-slate-800 hover:border-slate-700 focus:border-slate-600 focus:outline-none cursor-pointer font-medium transition-colors"
          >
            <option value="">Todas as Regiões ({totalCount})</option>
            {regions.map((r) => (
              <option key={r.regiao} value={r.regiao}>
                {r.regiao} ({r.count})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-500 text-xs">
            ▼
          </div>
        </div>
      </div>
    </div>
  );
};
