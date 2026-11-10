import React from 'react';
import { Users, Filter, MapPin } from 'lucide-react';

interface StatsBannerProps {
  total: number;
  filteredCount: number;
  distinctRegionsCount: number;
  topRegion: { name: string; count: number } | null;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  total,
  filteredCount,
  distinctRegionsCount,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1 text-xs text-slate-400">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#00d2d3]" />
          <span>
            Total: <strong className="text-white font-medium">{total}</strong> prestadores
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            <strong className="text-white font-medium">{distinctRegionsCount}</strong> regiões atendidas
          </span>
        </div>

        {filteredCount !== total && (
          <div className="flex items-center gap-1.5 text-amber-400">
            <Filter className="w-3.5 h-3.5" />
            <span>
              Filtrados: <strong className="font-semibold">{filteredCount}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 hidden sm:block">
        dr.monitora® • Banco local sincronizado
      </div>
    </div>
  );
};
