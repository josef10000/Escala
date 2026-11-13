import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Lock, Unlock, X, Check, KeyRound, UserPlus, LogIn, ShieldCheck } from 'lucide-react';

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
    leaderName,
    providers,
    setupProviderPin,
  } = useSchedule();

  const [authTab, setAuthTab] = useState<'login' | 'first_access'>('login');
  const [inputName, setInputName] = useState(() => leaderName || localStorage.getItem('escalapro_leader_name') || '');
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // First Access state
  const [firstAccessName, setFirstAccessName] = useState('');
  const [firstAccessPin, setFirstAccessPin] = useState('');
  const [firstAccessPinConfirm, setFirstAccessPinConfirm] = useState('');

  // Change PIN mode for already authenticated leader
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!inputName.trim()) {
      setErrorMsg('Por favor, informe seu nome ou identificação de gestor.');
      return;
    }
    const success = authenticateLeader(inputName.trim(), inputPin);
    if (success) {
      setInputPin('');
      onClose();
    } else {
      setErrorMsg('Senha ou PIN incorreto. Use seu PIN individual cadastrado ou o PIN mestre de gestor. Se for seu primeiro acesso, use a aba "Primeiro Acesso".');
    }
  };

  const handleFirstAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = firstAccessName.trim();
    const cleanPin = firstAccessPin.trim();

    if (!cleanName) {
      setErrorMsg('Por favor, informe seu nome ou selecione um prestador.');
      return;
    }
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setErrorMsg('O seu PIN deve ter exatamente 4 dígitos numéricos (ex: 1234, 4321).');
      return;
    }
    if (cleanPin !== firstAccessPinConfirm.trim()) {
      setErrorMsg('A confirmação do PIN não coincide com o PIN informado.');
      return;
    }

    // Match provider or create PIN
    const provMatch = providers.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
    if (provMatch) {
      await setupProviderPin(provMatch.id, cleanPin);
    }
    await changeLeaderPin(cleanPin);
    const success = authenticateLeader(cleanName, cleanPin);

    if (success) {
      setSuccessMsg('PIN cadastrado e acesso de Gestor ativado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMsg('Erro ao cadastrar PIN. Tente novamente.');
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPin.trim().length !== 4) {
      setErrorMsg('A nova senha deve ter 4 dígitos numéricos.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    const changed = await changeLeaderPin(newPin.trim());
    if (changed) {
      setSuccessMsg('Senha da Liderança alterada com sucesso!');
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
        className="bg-[#12141A] text-zinc-100 rounded-3xl p-6 border border-white/[0.08] shadow-2xl max-w-md w-full space-y-5 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
              isLeaderAuthenticated ? 'bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30' : 'bg-[#1A1D24] text-zinc-300 border border-white/[0.08]'
            }`}>
              {isLeaderAuthenticated ? <Unlock className="w-5 h-5 text-[#00d2d3]" /> : <Lock className="w-5 h-5 text-zinc-300" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isLeaderAuthenticated ? 'Painel da Liderança' : 'Acesso do Gestor / Líder'}
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                {isLeaderAuthenticated ? 'Edição e gestão autorizada' : 'Entre com seu PIN existente ou crie no Primeiro Acesso'}
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
            <div className="bg-[#00d2d3]/10 border border-[#00d2d3]/20 rounded-2xl p-3.5 text-xs text-zinc-200 flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#00d2d3] shrink-0 mt-0.5" />
              <div>
                <span>Conectado como <strong className="text-white font-bold">{leaderName || 'Gestor da Escala'}</strong>.</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Suas alterações na escala e relatórios são salvos e sincronizados automaticamente.</p>
              </div>
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
                  <span>Alterar Minha Senha / PIN do Gestor</span>
                </button>

                <button
                  onClick={() => {
                    logoutLeader();
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/50 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sair do Modo Gestor (Bloquear Edição)</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePinSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nova Senha / PIN (4 dígitos numéricos):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 4321"
                    className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none font-mono text-center tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Confirme a Nova Senha / PIN:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={confirmNewPin}
                    onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Repita os 4 dígitos"
                    className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none font-mono text-center tracking-widest"
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
                    Salvar Novo PIN
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Clear Mode Tabs: Login vs First Access */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#161820] border border-white/[0.06] rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authTab === 'login'
                    ? 'bg-[#00d2d3] text-[#003731] shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Já tenho PIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('first_access');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authTab === 'first_access'
                    ? 'bg-[#00d2d3] text-[#003731] shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Primeiro Acesso</span>
              </button>
            </div>

            {/* Mode 1: Login with Existing PIN */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nome do Gestor / Coordenador:
                  </label>
                  <input
                    type="text"
                    required
                    value={inputName}
                    onChange={e => setInputName(e.target.value)}
                    placeholder="Ex: Gestor Teste, Dra. Ana..."
                    className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    PIN Pessoal ou Senha Mestra:
                  </label>
                  <input
                    type="password"
                    maxLength={10}
                    value={inputPin}
                    onChange={e => setInputPin(e.target.value)}
                    placeholder="Digite seu PIN ou a senha Mestra (1234)"
                    className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none font-medium font-mono tracking-widest text-center"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Aceita seu PIN individual de 4 dígitos ou a senha Mestra (1234).
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
                    <span>Entrar no Painel do Gestor</span>
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: First Access - Create PIN */}
            {authTab === 'first_access' && (
              <form onSubmit={handleFirstAccessSubmit} className="space-y-3.5 pt-1">
                <div className="p-3 bg-[#00d2d3]/10 border border-[#00d2d3]/20 rounded-xl text-xs text-zinc-200 space-y-1">
                  <div className="font-bold text-[#00d2d3] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Primeiro Acesso do Gestor</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Cadastre o seu nome e crie uma senha/PIN de 4 dígitos para gerenciar a escala e relatórios com segurança.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Seu Nome Completo de Gestor:
                  </label>
                  <input
                    type="text"
                    required
                    value={firstAccessName}
                    onChange={e => setFirstAccessName(e.target.value)}
                    placeholder="Ex: Gestor Teste"
                    className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Crie seu PIN de 4 Dígitos Numéricos:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={firstAccessPin}
                    onChange={e => setFirstAccessPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 4321"
                    className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none font-mono text-center tracking-widest font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Confirme o seu PIN de 4 Dígitos:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={firstAccessPinConfirm}
                    onChange={e => setFirstAccessPinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="Repita os 4 dígitos"
                    className="w-full px-3 py-2 text-xs bg-[#1A1D24] text-white border border-white/[0.08] rounded-xl focus:border-[#00d2d3] focus:outline-none font-mono text-center tracking-widest font-bold"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-medium">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-2.5 bg-emerald-950/70 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 font-medium">
                    {successMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-bold text-[#003731] bg-[#00d2d3] hover:bg-[#57f1db] rounded-xl shadow-sm shadow-[#00d2d3]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-[#003731]" />
                    <span>Cadastrar PIN e Entrar como Gestor</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
