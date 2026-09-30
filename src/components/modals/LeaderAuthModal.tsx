import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Shield, KeyRound, Lock, Unlock, X, Check, Eye, EyeOff } from 'lucide-react';

interface LeaderAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderAuthModal: React.FC<LeaderAuthModalProps> = ({ isOpen, onClose }) => {
  const {
    isLeaderAuthenticated,
    authenticateLeader,
    logoutLeader,
    changeLeaderPin,
    leaderPin,
    leaderName
  } = useSchedule();

  const [inputName, setInputName] = useState(() => leaderName || localStorage.getItem('escalapro_leader_name') || '');
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Change PIN mode
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!inputName.trim()) {
      setErrorMsg('Por favor, informe seu nome ou identificação.');
      return;
    }
    const success = authenticateLeader(inputName.trim(), inputPin);
    if (success) {
      setInputPin('');
      onClose();
    } else {
      setErrorMsg('Senha incorreta. A senha padrão inicial é 1234');
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPin.trim().length < 4) {
      setErrorMsg('A nova senha deve ter no mínimo 4 dígitos.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    const changed = await changeLeaderPin(newPin.trim());
    if (changed) {
      setSuccessMsg('Senha da Líder alterada com sucesso e sincronizada na nuvem!');
      setNewPin('');
      setConfirmNewPin('');
      setIsChangingPin(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl max-w-sm w-full space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isLeaderAuthenticated ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-indigo-950 text-indigo-400 border border-indigo-500/40'
            }`}>
              {isLeaderAuthenticated ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isLeaderAuthenticated ? 'Painel da Líder' : 'Acesso da Líder'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isLeaderAuthenticated ? 'Permissão de edição ativa' : 'Digite o PIN para destravar a edição'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If already authenticated, show options to Logout or Change PIN */}
        {isLeaderAuthenticated ? (
          <div className="space-y-4">
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 text-xs text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Você está conectada como <strong>{leaderName || 'Líder da Escala'}</strong>. Todas as suas alterações são salvas na nuvem e sincronizadas para a equipe.</span>
            </div>

            {successMsg && (
              <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl text-xs">
                {successMsg}
              </div>
            )}

            {!isChangingPin ? (
              <div className="space-y-2">
                <button
                  onClick={() => setIsChangingPin(true)}
                  className="w-full py-2 px-3 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Alterar Minha Senha / PIN</span>
                </button>

                <button
                  onClick={() => {
                    logoutLeader();
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 text-xs font-bold text-rose-300 bg-rose-950/50 border border-rose-800/60 hover:bg-rose-900/50 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sair do Modo Líder (Bloquear Edição)</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePinSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nova Senha / PIN (mínimo 4 dígitos):
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    placeholder="Digite a nova senha..."
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirme a Nova Senha:
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPin}
                    onChange={e => setConfirmNewPin(e.target.value)}
                    placeholder="Repita a nova senha..."
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <div className="text-rose-400 text-xs text-center font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPin(false);
                      setErrorMsg('');
                    }}
                    className="w-1/2 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow"
                  >
                    Salvar Senha
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Login Form with Name and PIN */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seu Nome ou Identificação:
              </label>
              <input
                type="text"
                required
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                placeholder="Ex: Dr. João, Coord. Natasha"
                className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-2xl text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senha / PIN da Líder:
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  value={inputPin}
                  onChange={e => setInputPin(e.target.value)}
                  placeholder="Ex: 1234"
                  className="w-full px-4 py-2.5 text-base bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-center tracking-widest focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 text-center">
                A senha padrão inicial é <strong>1234</strong> (você pode alterá-la após entrar).
              </p>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 text-center font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Desbloquear Modo de Edição</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
