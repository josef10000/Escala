import React, { useEffect } from 'react';
import { X, RotateCw } from 'lucide-react';
import { AgendaRegiaoItem, Prestador, TechnicianQualitativeEvaluation } from '../types';
import {
  DailyAgendaEntry,
  EncaixeRecord,
  OcorrenciaRecord,
} from '../../central_inteligencia/types';
import { PrestadorCard } from './PrestadorCard';

interface Technician3DModalProps {
  prestador: Prestador | null;
  onClose: () => void;
  onEdit: (p: Prestador) => void;
  onDelete: (id: string) => void;
  onCopySuccess: (text: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onRecordRecent?: (p: Prestador) => void;
  encaixes?: EncaixeRecord[];
  dailyAgendas?: DailyAgendaEntry[];
  agendas?: AgendaRegiaoItem[];
  ocorrencias?: OcorrenciaRecord[];
  evaluation?: TechnicianQualitativeEvaluation;
  onEvaluationChange?: (next: TechnicianQualitativeEvaluation) => void;
}

export const Technician3DModal: React.FC<Technician3DModalProps> = ({
  prestador,
  onClose,
  onEdit,
  onDelete,
  onCopySuccess,
  isFavorite,
  onToggleFavorite,
  onRecordRecent,
  encaixes = [],
  dailyAgendas = [],
  agendas,
  ocorrencias = [],
  evaluation,
  onEvaluationChange,
}) => {
  useEffect(() => {
    if (!prestador) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prestador, onClose]);

  if (!prestador) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Cartão de nota 3D de ${prestador.nome}`}
    >
      <div
        className="w-full max-w-md my-auto space-y-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-2 text-xs text-white/75 font-medium">
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cartão 3D · Avaliação & Métricas</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white/80 hover:text-white border border-white/15 transition-all cursor-pointer"
            title="Fechar cartão 3D (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <PrestadorCard
          key={`modal-3d-${prestador.id}`}
          prestador={prestador}
          onEdit={(p) => {
            onClose();
            onEdit(p);
          }}
          onDelete={(id) => {
            onClose();
            onDelete(id);
          }}
          onCopySuccess={onCopySuccess}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          density="spacious"
          onRecordRecent={onRecordRecent}
          encaixes={encaixes}
          dailyAgendas={dailyAgendas}
          agendas={agendas}
          ocorrencias={ocorrencias}
          evaluation={evaluation}
          onEvaluationChange={onEvaluationChange}
          initialFlipped={true}
        />
      </div>
    </div>
  );
};
