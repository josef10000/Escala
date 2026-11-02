import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Provider } from '../../types';
import { X, UserCheck } from 'lucide-react';

interface CollaboratorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProvider: Provider | null;
  onSuccess: (provider: Provider) => void;
}

export const CollaboratorAuthModal: React.FC<CollaboratorAuthModalProps> = ({
  isOpen,
  onClose,
  targetProvider,
  onSuccess,
}) => {
  const {
    authenticateProvider,
    isLeaderAuthenticated,
  } = useSchedule();

  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !targetProvider) return null;

  // If already authenticated as Leader, leader has master bypass
  if (isLeaderAuthenticated) {
    onSuccess(targetProvider);
    onClose();
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const ok = authenticateProvider(targetProvider.id);
    if (ok) {
      onSuccess(targetProvider);
      onClose();
    } else {
      setErrorMsg('Não foi possível identificar o prestador.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white text-slate-800 rounded-3xl p-6 border border-slate-200/90 shadow-2xl max-w-sm w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-extrabold shadow-2xs">
              {targetProvider.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs text-emerald-700 font-extrabold uppercase tracking-wider">
                Área Individual
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {targetProvider.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <p className="text-xs text-slate-600 font-medium">
            Confirme que você é <strong>{targetProvider.name}</strong> para visualizar seu calendário mensal exclusivo e gerenciar pedidos de troca.
          </p>

          {errorMsg && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Sou eu, Acessar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
