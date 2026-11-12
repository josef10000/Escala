import React, { useState, useEffect } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import {
  X,
  User,
  MessageCircle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Edit2,
  Check,
} from 'lucide-react';

interface CollaboratorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId?: string;
  onOpenCollaboratorAuth?: () => void;
}

export const CollaboratorProfileModal: React.FC<CollaboratorProfileModalProps> = ({
  isOpen,
  onClose,
  providerId,
  onOpenCollaboratorAuth,
}) => {
  const {
    providers,
    authenticatedProviderId,
    activeProviderId,
    isLeaderAuthenticated,
    leaderName,
    updateProviderWhatsapp,
    setupProviderPin,
    updateProvider,
    logoutProvider,
    logoutLeader,
    assignments,
    shiftSaleOffers,
  } = useSchedule();

  const targetId = providerId || authenticatedProviderId || activeProviderId;
  const currentProviderObj = targetId ? providers.find(p => p.id === targetId) || null : null;

  // If leader is authenticated but no matching provider object, construct virtual or use provider
  const displayProviderName = isLeaderAuthenticated && leaderName ? leaderName : currentProviderObj?.name || 'Prestador';

  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [pin, setPin] = useState('');

  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && currentProviderObj) {
      setNameInput(isLeaderAuthenticated && leaderName ? leaderName : currentProviderObj.name);
      setWhatsapp(currentProviderObj.whatsapp || currentProviderObj.phone?.replace(/\D/g, '') || '');
      setPin('');
      setSuccessMsg('');
      setErrorMsg('');
      setIsEditingName(false);
      setIsSavingWhatsapp(false);
      setWhatsappSaved(false);
      setIsSavingPin(false);
      setIsChangingPin(false);
    }
  }, [isOpen, currentProviderObj, isLeaderAuthenticated, leaderName]);

  if (!isOpen) return null;

  if (!currentProviderObj) {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      >
        <div
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#0e1017] border border-white/[0.09] rounded-3xl shadow-2xl p-6 text-center space-y-4 cursor-default"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mx-auto shadow-sm">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Nenhum Perfil Conectado</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Você não está logado em nenhum perfil no momento. Selecione seu nome na lista e insira seu PIN para acessar suas configurações e calendário pessoal.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-white/[0.04] border border-white/[0.08]"
            >
              Cancelar
            </button>
            {onOpenCollaboratorAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCollaboratorAuth();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] transition-all"
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
    const cleanPin = pin.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setErrorMsg('O PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    setIsSavingPin(true);
    try {
      const ok = await setupProviderPin(currentProviderObj.id, cleanPin);
      if (ok) {
        setSuccessMsg('PIN pessoal de 4 dígitos salvo com sucesso!');
        setPin('');
        setIsChangingPin(false);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Erro ao configurar PIN.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao configurar PIN.');
    } finally {
      setIsSavingPin(false);
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
        className="relative w-full max-w-lg bg-[#0e1017] border border-white/[0.09] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00d2d3]/15 border border-[#00d2d3]/30 flex items-center justify-center text-[#00d2d3] font-bold text-sm">
              {displayProviderName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {displayProviderName}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30 rounded-full">
                  {isLeaderAuthenticated ? 'Gestor da Escala' : 'Prestador PJ'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Regime {currentProviderObj.regime || '12x36'} • {currentProviderObj.teamGroup === 'turma_a' ? 'Turma A' : 'Turma B'} • Plantões Ativos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] text-center">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Plantões em Out/26
              </span>
              <span className="text-lg font-bold font-mono text-white">
                {monthAssignments.length}
              </span>
              <span className="text-[10px] text-neutral-500 block">
                {monthAssignments.length * 12}h escaladas
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] text-center">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                À Venda no Mural
              </span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {activeSales.length}
              </span>
              <span className="text-[10px] text-neutral-500 block">
                plantões anunciados
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] text-center">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                PIN de Segurança
              </span>
              <span className="text-xs font-semibold text-emerald-400 mt-1 block">
                {currentProviderObj.pin ? 'Ativo (4 dígitos)' : 'Não cadastrado'}
              </span>
              <span className="text-[10px] text-neutral-500 block">
                Acesso pessoal
              </span>
            </div>
          </div>

          {/* Form 1: Editar Nome */}
          <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#00d2d3]" />
                Nome / Identificação no Perfil
              </label>
              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-[11px] text-[#00d2d3] hover:underline flex items-center gap-1 cursor-pointer font-medium"
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
                  className="flex-1 bg-[#1b1f2b] border border-white/[0.12] rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-[#00d2d3]"
                  placeholder="Seu nome completo"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#00d2d3] text-[#003731] font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-[#57f1db] cursor-pointer shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar
                </button>
              </form>
            ) : (
              <p className="text-xs text-neutral-300 font-medium font-sans">
                {displayProviderName}
              </p>
            )}
          </div>

          {/* Form 2: WhatsApp Configuration */}
          <form onSubmit={handleSaveWhatsapp} className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                WhatsApp para Negociações e Plantões
              </label>
            </div>
            <p className="text-xs text-neutral-400">
              Número com DDD para receber mensagens diretas quando você trocar ou vender plantões no mural.
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
                  className="w-full bg-[#1b1f2b] border border-white/[0.08] rounded-xl pl-12 pr-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingWhatsapp}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  whatsappSaved
                    ? 'bg-emerald-400 text-black'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSavingWhatsapp ? 'Salvando...' : whatsappSaved ? 'Salvo ✓' : 'Salvar WhatsApp'}
              </button>
            </div>
          </form>

          {/* Form 4: PIN Security */}
          {currentProviderObj.pin && !isChangingPin ? (
            <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white">PIN Pessoal Ativo</div>
                  <div className="text-[11px] text-neutral-400">Seu perfil está protegido por senha de 4 dígitos.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="px-3.5 py-2 bg-[#1b1f2b] hover:bg-white/[0.08] text-purple-300 border border-purple-500/30 rounded-xl font-bold transition-colors cursor-pointer shrink-0"
              >
                Alterar PIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSavePin} className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  {currentProviderObj.pin ? 'Alterar PIN Pessoal (4 dígitos)' : 'Cadastrar PIN Pessoal de 4 Dígitos'}
                </label>
                {currentProviderObj.pin && (
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Crie um PIN de 4 dígitos para proteger seu perfil pessoal e confirmação de trocas de plantão.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Digite 4 dígitos..."
                  className="flex-1 bg-[#1b1f2b] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest focus:outline-none focus:border-purple-500/50 text-center font-bold"
                />
                <button
                  type="submit"
                  disabled={isSavingPin || pin.length !== 4}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isSavingPin ? 'Gravando...' : 'Salvar PIN'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer with PROMINENT LOGOUT BUTTON at the bottom */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#12141c] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLogoutEntirely}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-200 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-98"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sair do Perfil / Desconectar</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenCollaboratorAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCollaboratorAuth();
                }}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
              >
                Trocar Perfil
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] transition-colors cursor-pointer shadow-sm"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
