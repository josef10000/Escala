import React from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  defaultCount: number;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultCount,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#13151c] border border-[#1e2029] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Restaurar Dados Originais?</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Esta ação irá redefinir o banco de dados do LocalStorage de volta para a lista padrão original com os{' '}
              <strong className="text-amber-300">{defaultCount} prestadores</strong> extraídos das fotos (Leste, Oeste, Norte, Sul, etc.).
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-xs rounded-xl font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sim, Restaurar Padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
