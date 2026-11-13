import React, { useState, useEffect } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Provider } from '../../types';
import {
  X,
  User,
  ShieldCheck,
  KeyRound,
  Check,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Edit2,
  LogOut,
  Lock,
} from 'lucide-react';

interface CollaboratorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCollaboratorAuth?: () => void;
  onOpenLeaderAuth?: () => void;
}

export const CollaboratorProfileModal: React.FC<CollaboratorProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenCollaboratorAuth,
}) => {
  const {
    providers,
    activeProviderId,
    authenticatedProviderId,
    isLeaderAuthenticated,
    updateProvider,
    updateProviderWhatsapp,
    setupProviderPin,
    resetProviderPin,
    logoutProvider,
    logoutLeader,
    assignments,
    shiftSaleOffers,
  } = useSchedule();

  const currentProviderId = authenticatedProviderId || activeProviderId;
  const currentProviderObj = providers.find(p => p.id === currentProviderId);

  // States
  const [nameInput, setNameInput] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);

  // PIN security states
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentProviderObj) {
      setNameInput(currentProviderObj.name || '');
      setWhatsapp(currentProviderObj.phone || '');
      setIsEditingName(false);
      setIsChangingPin(false);
      setCurrentPinInput('');
      setNewPin('');
      setConfirmNewPin('');
      setSuccessMsg('');
      setErrorMsg('');
      setWhatsappSaved(false);
    }
  }, [currentProviderObj, isOpen]);

  if (!isOpen) return null;

  const displayProviderName = currentProviderObj?.name || 'Colaborador';

  if (!currentProviderObj) {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      >
        <div
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-center cursor-default backdrop-blur-xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <User className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Nenhum perfil selecionado</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Selecione seu nome na lista para autenticar seu perfil e gerenciar sua escala com segurança.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
            >
              Cancelar
            </button>
            {onOpenCollaboratorAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCollaboratorAuth();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-sm"
              >
                + Entrar no Meu Perfil
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Monthly stats
  const monthAssignments = assignments.filter(
    a => a.providerId === currentProviderObj.id && a.date && a.date.startsWith('2026-10-')
  );
  const activeSales = shiftSaleOffers.filter(
    o => o.providerId === currentProviderObj.id && o.status === 'available'
  );

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    updateProvider(currentProviderObj.id, { name: nameInput.trim() });
    setIsEditingName(false);
    setSuccessMsg('Nome atualizado com sucesso!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Informe um número de WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }

    setIsSavingWhatsapp(true);
    try {
      await updateProviderWhatsapp(currentProviderObj.id, cleanPhone);
      setWhatsappSaved(true);
      setSuccessMsg('Número de WhatsApp salvo com sucesso!');
      setTimeout(() => {
        setSuccessMsg('');
        setWhatsappSaved(false);
      }, 4000);
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // If provider already had a PIN and is not leader, verify current PIN first
    if (currentProviderObj.pin && !isLeaderAuthenticated) {
      if (currentPinInput.trim() !== currentProviderObj.pin.trim()) {
        setErrorMsg('O PIN atual informado está incorreto.');
        return;
      }
    }

    const cleanNewPin = newPin.trim();
    if (cleanNewPin.length !== 4 || !/^\d{4}$/.test(cleanNewPin)) {
      setErrorMsg('O novo PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    if (cleanNewPin !== confirmNewPin.trim()) {
      setErrorMsg('A confirmação do novo PIN não coincide.');
      return;
    }

    setIsSavingPin(true);
    try {
      const ok = await setupProviderPin(currentProviderObj.id, cleanNewPin);
      if (ok) {
        setSuccessMsg('PIN pessoal de 4 dígitos configurado com sucesso!');
        setNewPin('');
        setConfirmNewPin('');
        setCurrentPinInput('');
        setIsChangingPin(false);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Erro ao configurar PIN. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao configurar PIN.');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleResetPinByLeader = async () => {
    if (!isLeaderAuthenticated) return;
    if (window.confirm(`Deseja realmente redefinir o PIN de ${currentProviderObj.name}? O colaborador poderá cadastrar um novo no próximo acesso.`)) {
      await resetProviderPin(currentProviderObj.id);
      setSuccessMsg('PIN redefinido com sucesso.');
      setIsChangingPin(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleLogoutEntirely = () => {
    if (isLeaderAuthenticated) logoutLeader();
    logoutProvider();
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default backdrop-blur-xl"
      >
        {/* Top Header - Frosted Glass Style */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm shadow-inner">
              {displayProviderName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {displayProviderName}
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full backdrop-blur-sm">
                  {isLeaderAuthenticated ? 'Gestor da Escala' : 'Prestador PJ'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Regime {currentProviderObj.regime || '12x36'} • {currentProviderObj.teamGroup === 'turma_a' ? 'Turma A' : 'Turma B'} • Plantões Ativos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Quick Stats Grid (iOS Glass Cards) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center shadow-sm">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Plantões em Out/26
              </span>
              <span className="text-lg font-bold font-mono text-white">
                {monthAssignments.length}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {monthAssignments.length * 12}h escaladas
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center shadow-sm">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                À Venda no Mural
              </span>
              <span className="text-lg font-bold font-mono text-amber-300">
                {activeSales.length}
              </span>
              <span className="text-[10px] text-slate-500 block">
                plantões anunciados
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center shadow-sm">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                PIN de Segurança
              </span>
              <span className="text-xs font-semibold text-emerald-300 mt-1 block">
                {currentProviderObj.pin ? 'Ativo (4 dígitos)' : 'Não cadastrado'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Acesso pessoal
              </span>
            </div>
          </div>

          {/* Form 1: Editar Nome */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                Nome / Identificação no Perfil
              </label>
              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  Editar Nome
                </button>
              )}
            </div>
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="flex-1 bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                  placeholder="Seu nome completo"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-cyan-400 cursor-pointer shrink-0 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-300 font-medium font-sans">
                {displayProviderName}
              </p>
            )}
          </div>

          {/* Form 2: WhatsApp Configuration */}
          <form onSubmit={handleSaveWhatsapp} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                WhatsApp para Notificações e Plantões
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Número com DDD para receber avisos diretos quando você trocar ou vender plantões no mural.
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-mono">
                  +55
                </span>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="Ex: 11987654321"
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-12 pr-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingWhatsapp}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  whatsappSaved
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-emerald-500/90 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSavingWhatsapp ? 'Salvando...' : whatsappSaved ? 'Salvo ✓' : 'Salvar WhatsApp'}
              </button>
            </div>
          </form>

          {/* Form 3: PIN Security (Secured & Redesigned) */}
          {currentProviderObj.pin && !isChangingPin ? (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white">PIN Pessoal Ativo</div>
                  <div className="text-[11px] text-slate-400">Seu perfil está protegido por senha de 4 dígitos.</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLeaderAuthenticated && (
                  <button
                    type="button"
                    onClick={handleResetPinByLeader}
                    className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl font-medium transition-colors cursor-pointer shrink-0"
                    title="Redefinir PIN deste colaborador"
                  >
                    Resetar (Líder)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 rounded-xl font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Alterar PIN
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSavePin} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  {currentProviderObj.pin ? 'Alterar PIN Pessoal' : 'Cadastrar PIN Pessoal de 4 Dígitos'}
                </label>
                {currentProviderObj.pin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPin(false);
                      setCurrentPinInput('');
                      setNewPin('');
                      setConfirmNewPin('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {currentProviderObj.pin
                  ? 'Informe seu PIN atual e cadastre o novo PIN de 4 dígitos numéricos.'
                  : 'Defina um PIN numérico de 4 dígitos para proteger suas trocas de plantão.'}
              </p>

              {/* Current PIN input if already set and not leader */}
              {currentProviderObj.pin && !isLeaderAuthenticated && (
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    PIN Atual:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentPinInput}
                    onChange={e => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest text-center font-bold focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Novo PIN (4 dígitos):</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest text-center font-bold focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Confirmar Novo PIN:</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmNewPin}
                    onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest text-center font-bold focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingPin || newPin.length !== 4 || confirmNewPin.length !== 4}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSavingPin ? 'Salvando PIN...' : 'Confirmar e Salvar Novo PIN'}
              </button>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLogoutEntirely}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Desconectar Perfil</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenCollaboratorAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCollaboratorAuth();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                Trocar Perfil
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer shadow-sm"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
