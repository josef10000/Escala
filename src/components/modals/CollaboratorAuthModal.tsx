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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl max-w-sm w-full space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold">
              {targetProvider.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">
                Área Individual
              </div>
              <h3 className="text-base font-black text-white truncate max-w-[200px]">
                {targetProvider.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
            Olá, <span className="font-bold text-white">{targetProvider.name}</span>! Deseja acessar a sua área de calendário individual para visualizar seus plantões e enviar solicitações?
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 text-center font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Acessar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
