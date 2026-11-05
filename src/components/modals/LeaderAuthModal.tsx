import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Lock, Unlock, X, Check, KeyRound } from 'lucide-react';

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
    leaderName
  } = useSchedule();

  const [inputName, setInputName] = useState(() => leaderName || localStorage.getItem('escalapro_leader_name') || '');
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg('Senha ou PIN incorreto. Informe seu PIN individual cadastrado no perfil ou a senha Mestra de Liderança (1234).');
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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#12141A] text-zinc-100 rounded-3xl p-6 border border-white/[0.08] shadow-2xl max-w-sm w-full space-y-5 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
              isLeaderAuthenticated ? 'bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30' : 'bg-[#1A1D24] text-zinc-300 border border-white/[0.08]'
            }`}>
              {isLeaderAuthenticated ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isLeaderAuthenticated ? 'Painel da Liderança' : 'Acesso da Liderança'}
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                {isLeaderAuthenticated ? 'Edição e gestão autorizada' : 'Digite a senha para destravar a edição'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If already authenticated, show options to Logout or Change PIN */}
        {isLeaderAuthenticated ? (
          <div className="space-y-4">
            <div className="bg-[#00d2d3]/10 border border-[#00d2d3]/20 rounded-2xl p-3 text-xs text-zinc-200 flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#00d2d3] shrink-0 mt-0.5" />
              <span>Conectada como <strong className="text-white">{leaderName || 'Líder da Escala'}</strong>. Suas alterações são sincronizadas em tempo real.</span>
            </div>

            {successMsg && (
              <div className="bg-[#00d2d3]/15 border border-[#00d2d3]/30 text-[#00d2d3] p-2.5 rounded-xl text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {!isChangingPin ? (
              <div className="space-y-2">
                <button
                  onClick={() => setIsChangingPin(true)}
                  className="w-full py-2.5 px-3 text-xs font-bold text-zinc-200 bg-[#1A1D24] hover:bg-[#252830] border border-white/[0.08] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <KeyRound className="w-4 h-4 text-[#00d2d3]" />
                  <span>Alterar Minha Senha / PIN</span>
                </button>

                <button
                  onClick={() => {
                    logoutLeader();
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/50 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>Bloquear Edição (Modo Visualização)</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePinSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nova Senha / PIN (mínimo 4 dígitos):
                  </label>
                  <input
                    type="password"
                    required
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    placeholder="Nova senha"
                    className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Confirme a Nova Senha / PIN:
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPin}
                    onChange={e => setConfirmNewPin(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="w-1/2 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 text-xs font-bold text-[#003731] bg-[#00d2d3] hover:bg-[#57f1db] rounded-xl shadow-sm shadow-[#00d2d3]/20"
                  >
                    Salvar Senha
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Nome da Liderança / Coordenador(a):
              </label>
              <input
                type="text"
                required
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                placeholder="Ex: Dra. Ana Souza, Valéria..."
                className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Senha ou PIN Individual de Acesso:
              </label>
              <input
                type="password"
                value={inputPin}
                onChange={e => setInputPin(e.target.value)}
                placeholder="PIN individual ou Mestre (1234)"
                className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none font-medium"
              />
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                Aceita seu PIN individual cadastrado no seu perfil ou a senha Mestra (1234).
              </p>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-[#003731] bg-[#00d2d3] hover:bg-[#57f1db] rounded-xl shadow-sm shadow-[#00d2d3]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4 text-[#003731]" />
                <span>Destravar Edição</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
