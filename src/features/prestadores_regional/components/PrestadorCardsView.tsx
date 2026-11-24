import React, { useState } from 'react';
import { AgendaRegiaoItem, Prestador, TechnicianQualitativeEvaluation } from '../types';
import { MapPin } from 'lucide-react';
import { Pagination } from './Pagination';
import { PrestadorCard, getInitials } from './PrestadorCard';
import { Technician3DModal } from './Technician3DModal';
import { DailyAgendaEntry, EncaixeRecord, OcorrenciaRecord } from '../../central_inteligencia/types';

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
  encaixes?: EncaixeRecord[];
  dailyAgendas?: DailyAgendaEntry[];
  agendas?: AgendaRegiaoItem[];
  ocorrencias?: OcorrenciaRecord[];
  evaluationsMap?: Record<string, TechnicianQualitativeEvaluation>;
  onEvaluationChange?: (next: TechnicianQualitativeEvaluation) => void;
  searchQuery?: string;
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
  encaixes,
  dailyAgendas,
  agendas,
  ocorrencias,
  evaluationsMap,
  onEvaluationChange,
  searchQuery,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [modalPrestador, setModalPrestador] = useState<Prestador | null>(null);
  const itemsPerPage = density === 'compact' ? 24 : 12;

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
      <div className="bg-[#0e1016] border border-white/[0.08] rounded-2xl p-12 text-center max-w-lg mx-auto my-8 shadow-lg">
        <MapPin className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-white">Nenhum prestador encontrado</h3>
        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
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
            encaixes={encaixes}
            dailyAgendas={dailyAgendas}
            agendas={agendas}
            ocorrencias={ocorrencias}
            evaluation={evaluationsMap?.[p.id]}
            onEvaluationChange={onEvaluationChange}
            onOpen3DModal={(target) => setModalPrestador(target)}
            searchQuery={searchQuery}
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

      {/* 3D Scorecard Modal for Compact Cards */}
      <Technician3DModal
        prestador={modalPrestador}
        onClose={() => setModalPrestador(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        onCopySuccess={onCopySuccess}
        isFavorite={modalPrestador ? favorites.includes(modalPrestador.id) : false}
        onToggleFavorite={onToggleFavorite}
        onRecordRecent={onRecordRecent}
        encaixes={encaixes}
        dailyAgendas={dailyAgendas}
        agendas={agendas}
        ocorrencias={ocorrencias}
        evaluation={modalPrestador ? evaluationsMap?.[modalPrestador.id] : undefined}
        onEvaluationChange={onEvaluationChange}
      />
    </div>
  );
};
