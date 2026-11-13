import React, { useState } from 'react';
import { Prestador } from '../types';
import { MapPin } from 'lucide-react';
import { Pagination } from './Pagination';
import { PrestadorCard, getInitials } from './PrestadorCard';

export { getInitials };

interface PrestadorCardsViewProps {
  prestadores: Prestador[];
  onEdit: (p: Prestador) => void;
  onDelete: (id: string) => void;
  onCopySuccess: (text: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  density?: 'spacious' | 'compact';
  onRecordRecent?: (p: Prestador) => void;
}

export const PrestadorCardsView: React.FC<PrestadorCardsViewProps> = ({
  prestadores,
  onEdit,
  onDelete,
  onCopySuccess,
  favorites,
  onToggleFavorite,
  density = 'spacious',
  onRecordRecent,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = density === 'compact' ? 24 : 12;

  // Reset to page 1 if prestadores count changes and current page is out of bounds
  const totalPages = Math.ceil(prestadores.length / itemsPerPage);
  const effectivePage = Math.min(currentPage, Math.max(1, totalPages));

  const startIndex = (effectivePage - 1) * itemsPerPage;
  const paginatedList = prestadores.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (prestadores.length === 0) {
    return (
      <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 shadow-lg">
        <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-white">Nenhum prestador encontrado</h3>
        <p className="text-xs text-[#9CA3AF] mt-1.5 leading-relaxed">
          Tente ajustar os termos da busca ou selecione outra região para visualizar os técnicos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={
          density === 'compact'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
        }
      >
        {paginatedList.map((p) => (
          <PrestadorCard
            key={p.id}
            prestador={p}
            onEdit={onEdit}
            onDelete={onDelete}
            onCopySuccess={onCopySuccess}
            isFavorite={favorites.includes(p.id)}
            onToggleFavorite={onToggleFavorite}
            density={density}
            onRecordRecent={onRecordRecent}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={effectivePage}
        totalItems={prestadores.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

