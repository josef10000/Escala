import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 pb-2 border-t border-[#1e2029] text-xs text-zinc-400">
      <div>
        Mostrando <span className="font-semibold text-white">{startItem}</span> a{' '}
        <span className="font-semibold text-white">{endItem}</span> de{' '}
        <span className="font-semibold text-white">{totalItems}</span> prestadores
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl bg-[#13151c] border border-[#1e2029] text-zinc-300 hover:bg-[#1a1c26] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-zinc-600">
                ...
              </span>
            );
          }
          const isCurrent = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(Number(page))}
              className={`w-8 h-8 rounded-xl font-semibold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#00d2d3] text-[#003731] font-black border border-[#00d2d3] shadow-md shadow-[#00d2d3]/20'
                  : 'bg-[#13151c] border border-[#1e2029] text-zinc-300 hover:bg-[#1a1c26] hover:text-white'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl bg-[#13151c] border border-[#1e2029] text-zinc-300 hover:bg-[#1a1c26] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
