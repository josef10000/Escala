import React, { useState, useEffect } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { TeamGroup, WorkRegime } from '../../types';
import { MONTH_NAMES_PT } from '../../utils/dateUtils';
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
  UserPlus,
  Users,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';

interface CollaboratorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCollaboratorAuth?: () => void;
  onOpenLeaderAuth?: () => void;
  onOpenAdvancedTeamModal?: () => void;
}

export const CollaboratorProfileModal: React.FC<CollaboratorProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenCollaboratorAuth,
  onOpenLeaderAuth,
  onOpenAdvancedTeamModal,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    providers,
    activeProviderId,
    authenticatedProviderId,
    isLeaderAuthenticated,
    leaderName,
    leaderAccounts,
    updateLeaderProfile,
    addProvider,
    deleteProvider,
    updateProvider,
    updateProviderWhatsapp,
    setupProviderPin,
    resetProviderPin,
    logoutProvider,
    logoutLeader,
    assignments,
    shiftSaleOffers,
    activeRegime,
  } = useSchedule();

  const currentProviderId = authenticatedProviderId || activeProviderId;
  const currentProviderObj = providers.find((p) => p.id === currentProviderId);

  const currentLeaderAccount = leaderName
    ? leaderAccounts.find((acc) => acc.name.trim().toLowerCase() === leaderName.trim().toLowerCase())
    : undefined;

  // Attendant / Leader personal profile states
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

  // Leader-only: New Attendant creation states (exclusively inside Leader Profile)
  const [newAttName, setNewAttName] = useState('');
  const [newAttRegime, setNewAttRegime] = useState<WorkRegime>(
    activeRegime === '5x2' ? '5x2' : '12x36'
  );
  const [newAttTeam, setNewAttTeam] = useState<TeamGroup>('turma_a');
  const [newAttEntry, setNewAttEntry] = useState(activeRegime === '5x2' ? '08h00' : '07h00');
  const [newAttExit, setNewAttExit] = useState(activeRegime === '5x2' ? '17h00' : '19h00');
  const [newAttPhone, setNewAttPhone] = useState('');
  const [showTeamRoster, setShowTeamRoster] = useState(false);

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setIsEditingName(false);
    setIsChangingPin(false);
    setCurrentPinInput('');
    setNewPin('');
    setConfirmNewPin('');
    setSuccessMsg('');
    setErrorMsg('');
    setWhatsappSaved(false);

    if (isLeaderAuthenticated) {
      setNameInput(leaderName || 'Gestor da Escala');
      setWhatsapp(currentLeaderAccount?.whatsapp || '');
      const defaultReg: WorkRegime = activeRegime === '5x2' ? '5x2' : '12x36';
      setNewAttRegime(defaultReg);
      setNewAttEntry(defaultReg === '5x2' ? '08h00' : '07h00');
      setNewAttExit(defaultReg === '5x2' ? '17h00' : '19h00');
    } else if (currentProviderObj) {
      setNameInput(currentProviderObj.name || '');
      setWhatsapp(currentProviderObj.whatsapp || currentProviderObj.phone || '');
    }
  }, [isOpen, isLeaderAuthenticated, leaderName, currentLeaderAccount, currentProviderObj, activeRegime]);

  if (!isOpen) return null;

  // ============================================================================
  // MODE 1: LEADER PROFILE (Leader NEVER enters schedule + creates attendants here)
  // ============================================================================
  if (isLeaderAuthenticated) {
    const displayLeaderName = leaderName || 'Gestor da Escala';

    const handleSaveLeaderName = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      const trimmed = nameInput.trim();
      if (!trimmed) return;
      if (trimmed.toLowerCase() === 'macos') {
        setErrorMsg('Este nome não é permitido.');
        return;
      }
      await updateLeaderProfile({ name: trimmed });
      setIsEditingName(false);
      setSuccessMsg('Nome do seu perfil de Líder atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3500);
    };

    const handleSaveLeaderWhatsapp = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      const cleanPhone = whatsapp.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMsg('Informe um WhatsApp válido com DDD (mínimo 10 dígitos).');
        return;
      }
      setIsSavingWhatsapp(true);
      try {
        await updateLeaderProfile({ whatsapp: cleanPhone });
        setWhatsappSaved(true);
        setSuccessMsg('WhatsApp da liderança salvo com sucesso!');
        setTimeout(() => {
          setSuccessMsg('');
          setWhatsappSaved(false);
        }, 3500);
      } finally {
        setIsSavingWhatsapp(false);
      }
    };

    const handleSaveLeaderPin = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
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
        const ok = await updateLeaderProfile({ pin: cleanNewPin });
        if (ok) {
          setSuccessMsg('PIN de 4 dígitos do Líder atualizado com sucesso!');
          setNewPin('');
          setConfirmNewPin('');
          setIsChangingPin(false);
          setTimeout(() => setSuccessMsg(''), 3500);
        } else {
          setErrorMsg('Não foi possível atualizar o PIN.');
        }
      } finally {
        setIsSavingPin(false);
      }
    };

    const handleCreateAttendant = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      const cleanAttName = newAttName.trim().toUpperCase();
      if (!cleanAttName) {
        setErrorMsg('Informe o nome completo do novo atendente.');
        return;
      }
      if (cleanAttName.toLowerCase() === 'macos') {
        setErrorMsg('Este cadastro foi bloqueado e removido do sistema.');
        return;
      }
      if (providers.some((p) => p.name.trim().toUpperCase() === cleanAttName)) {
        setErrorMsg('Já existe um atendente cadastrado na escala com este nome.');
        return;
      }

      const cleanWhatsapp = newAttPhone.replace(/\D/g, '');
      addProvider({
        name: cleanAttName,
        role: 'Atendente',
        regime: newAttRegime,
        teamGroup: newAttRegime === '12x36' ? newAttTeam : 'none',
        entryTime: newAttEntry.trim() || (newAttRegime === '5x2' ? '08h00' : '07h00'),
        exitTime: newAttExit.trim() || (newAttRegime === '5x2' ? '17h00' : '19h00'),
        email: `${cleanAttName.toLowerCase().replace(/\s+/g, '.')}@escala.com`,
        phone: newAttPhone.trim() || '(11) 90000-0000',
        whatsapp: cleanWhatsapp.length >= 10 ? cleanWhatsapp : undefined,
        color: providers.length % 2 === 0 ? 'cyan' : 'emerald',
        maxMonthlyHours: newAttRegime === '5x2' ? 176 : 180,
        baseSalaryOrFee: 3500,
        bonusAmount: 600,
        bonusFrequencyMonths: 3,
        deductionMode: 'percentage_of_bonus',
        deductionPerMinuteLate: 0.5,
        deductionPerAbsence: 10,
        status: 'active',
      });

      setNewAttName('');
      setNewAttPhone('');
      setSuccessMsg(`Atendente "${cleanAttName}" cadastrado(a) na escala ${newAttRegime} com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-[#0e1017] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] cursor-default backdrop-blur-xl"
        >
          {/* Header: Perfil Exclusivo do Líder */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#00d2d3]/15 border border-[#00d2d3]/35 flex items-center justify-center text-[#00d2d3] font-black text-sm shadow-inner shrink-0">
                {displayLeaderName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {displayLeaderName}
                  </h2>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/35 rounded-full">
                    Líder • Fora da Escala
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Conta administrativa da liderança — não ocupa linhas nem plantões na escala
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alerts */}
          {successMsg && (
            <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-4 text-sm">
            {/* PRIMARY SECTION: Cadastrar Novo Atendente na Escala (Exclusivo no Perfil do Líder) */}
            <form
              onSubmit={handleCreateAttendant}
              className="p-4 rounded-2xl bg-gradient-to-b from-[#00d2d3]/[0.08] to-white/[0.02] border border-[#00d2d3]/30 space-y-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-[#00d2d3] uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#00d2d3]" />
                    <span>Cadastrar Novo Atendente na Escala</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Exclusivo do Líder: somente contas de liderança podem adicionar atendentes à escala.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/10 text-[10px] font-mono text-zinc-300 shrink-0">
                  {providers.length} na escala
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Nome Completo do Atendente *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAttName}
                    onChange={(e) => setNewAttName(e.target.value)}
                    placeholder="Ex: MARIA CLARA SOUZA"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-semibold uppercase focus:outline-none focus:border-[#00d2d3]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Regime de Escala
                  </label>
                  <select
                    value={newAttRegime}
                    onChange={(e) => {
                      const reg = e.target.value as WorkRegime;
                      setNewAttRegime(reg);
                      if (reg === '5x2') {
                        setNewAttEntry('08h00');
                        setNewAttExit('17h00');
                      } else {
                        setNewAttEntry('07h00');
                        setNewAttExit('19h00');
                      }
                    }}
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-[#00d2d3] cursor-pointer"
                  >
                    <option value="12x36">12x36 (Plantão 12h)</option>
                    <option value="5x2">5x2 (Segunda a Sexta)</option>
                  </select>
                </div>

                {newAttRegime === '12x36' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Turma Inicial (12x36)
                    </label>
                    <select
                      value={newAttTeam}
                      onChange={(e) => setNewAttTeam(e.target.value as TeamGroup)}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-[#00d2d3] cursor-pointer"
                    >
                      <option value="turma_a">Turma A (Dias Ímpares)</option>
                      <option value="turma_b">Turma B (Dias Pares)</option>
                      <option value="none">Sem Turma Fixa</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      WhatsApp (Opcional)
                    </label>
                    <input
                      type="tel"
                      value={newAttPhone}
                      onChange={(e) => setNewAttPhone(e.target.value)}
                      placeholder="Ex: 11987654321"
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#00d2d3]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Entrada
                    </label>
                    <input
                      type="text"
                      value={newAttEntry}
                      onChange={(e) => setNewAttEntry(e.target.value)}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs text-center font-mono focus:outline-none focus:border-[#00d2d3]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Saída
                    </label>
                    <input
                      type="text"
                      value={newAttExit}
                      onChange={(e) => setNewAttExit(e.target.value)}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs text-center font-mono focus:outline-none focus:border-[#00d2d3]"
                    />
                  </div>
                </div>

                {newAttRegime === '12x36' && (
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      WhatsApp (Opcional)
                    </label>
                    <input
                      type="tel"
                      value={newAttPhone}
                      onChange={(e) => setNewAttPhone(e.target.value)}
                      placeholder="Ex: 11987654321"
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#00d2d3]"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTeamRoster((prev) => !prev)}
                    className="px-3 py-2 rounded-xl text-[11px] font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span>{showTeamRoster ? 'Ocultar Atendentes' : `Ver Atendentes (${providers.length})`}</span>
                  </button>
                  {onOpenAdvancedTeamModal && (
                    <button
                      type="button"
                      onClick={onOpenAdvancedTeamModal}
                      className="px-3 py-2 rounded-xl text-[11px] font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Configurar bônus, descontos ou importar lista em lote"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Bônus & Lote</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#003731]" />
                  <span>+ Cadastrar Atendente</span>
                </button>
              </div>

              {/* Compact Roster List inside Leader Profile */}
              {showTeamRoster && (
                <div className="pt-3 border-t border-white/10 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {providers.map((p) => (
                    <div
                      key={p.id}
                      className="px-3 py-2 rounded-xl bg-[#090A0F]/90 border border-white/[0.07] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-zinc-400">
                          Escala {p.regime || '12x36'} • {p.entryTime || '07h00'} às {p.exitTime || '19h00'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.pin && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                window.confirm(
                                  `Redefinir o PIN de ${p.name}? O atendente poderá criar um novo PIN no próximo acesso.`
                                )
                              ) {
                                await resetProviderPin(p.id);
                                setSuccessMsg(`PIN de ${p.name} redefinido.`);
                                setTimeout(() => setSuccessMsg(''), 3000);
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[10px] font-semibold cursor-pointer"
                          >
                            Resetar PIN
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remover "${p.name}" da escala de atendimento?`
                              )
                            ) {
                              deleteProvider(p.id);
                              setSuccessMsg(`Atendente "${p.name}" removido(a) da escala.`);
                              setTimeout(() => setSuccessMsg(''), 3000);
                            }
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={`Remover ${p.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>

            {/* Leader Personal Data 1: Nome do Líder */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#00d2d3]" />
                  <span>Seu Nome de Líder / Gestor</span>
                </label>
                {!isEditingName && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="text-[11px] text-[#00d2d3] hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar Nome</span>
                  </button>
                )}
              </div>
              {isEditingName ? (
                <form onSubmit={handleSaveLeaderName} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-[#00d2d3]"
                    placeholder="Seu nome completo de líder"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#00d2d3] text-[#003731] font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-[#57f1db] cursor-pointer shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>
                </form>
              ) : (
                <p className="text-xs text-zinc-300 font-medium">{displayLeaderName}</p>
              )}
            </div>

            {/* Leader Personal Data 2: WhatsApp da Liderança */}
            <form
              onSubmit={handleSaveLeaderWhatsapp}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5"
            >
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp da Liderança</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-mono">
                    +55
                  </span>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: 11987654321"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl pl-12 pr-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingWhatsapp}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSavingWhatsapp ? 'Salvando...' : whatsappSaved ? 'Salvo ✓' : 'Salvar'}</span>
                </button>
              </div>
            </form>

            {/* Leader Personal Data 3: PIN do Líder */}
            {!isChangingPin ? (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white">PIN de Liderança Ativo (4 dígitos)</div>
                    <div className="text-[11px] text-zinc-400">
                      Protege a edição da escala e o cadastro de atendentes.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 rounded-xl font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Alterar PIN
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSaveLeaderPin}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-purple-400" />
                    <span>Alterar PIN do Líder (4 dígitos)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPin(false);
                      setNewPin('');
                      setConfirmNewPin('');
                    }}
                    className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Novo PIN (4 dígitos)"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest text-center font-bold focus:outline-none focus:border-purple-500/50"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Confirmar PIN"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest text-center font-bold focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingPin || newPin.length !== 4 || confirmNewPin.length !== 4}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPin ? 'Salvando PIN...' : 'Confirmar Novo PIN do Líder'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                logoutLeader();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sair da Conta de Líder</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] transition-colors cursor-pointer shadow-sm"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE 2: ATTENDANT PERSONAL PROFILE (Strictly NO attendant creation allowed)
  // ============================================================================
  if (!currentProviderObj) {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#0e1017] border border-white/10 rounded-3xl p-6 shadow-2xl text-center cursor-default backdrop-blur-xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <User className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Nenhum perfil selecionado</h3>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Selecione seu nome na lista de atendentes para autenticar seu perfil, ou entre como Líder para cadastrar novos atendentes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
            >
              Cancelar
            </button>
            {onOpenLeaderAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLeaderAuth();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 cursor-pointer"
              >
                Sou Líder
              </button>
            )}
            {onOpenCollaboratorAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCollaboratorAuth();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] transition-all cursor-pointer shadow-sm"
              >
                + Entrar como Atendente
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayProviderName = currentProviderObj.name || 'Colaborador';
  const activeMonthPrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-`;
  const activeMonthLabel = `${MONTH_NAMES_PT[currentMonthIndex].slice(0, 3)}/${String(currentYear).slice(-2)}`;
  const shiftHoursPerDay = currentProviderObj.regime === '5x2' ? 8 : 12;
  const monthAssignments = assignments.filter(
    (a) =>
      a.providerId === currentProviderObj.id &&
      a.date &&
      a.date.startsWith(activeMonthPrefix) &&
      a.shiftTypeId === 'st-t'
  );
  const activeSales = shiftSaleOffers.filter(
    (o) => o.providerId === currentProviderObj.id && o.status === 'available'
  );

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === 'macos') {
      setErrorMsg('Nome inválido.');
      return;
    }
    updateProvider(currentProviderObj.id, { name: trimmed });
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

    if (currentProviderObj.pin) {
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

  const handleLogoutEntirely = () => {
    logoutProvider();
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0e1017] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default backdrop-blur-xl"
      >
        {/* Top Header */}
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
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full">
                  Atendente PJ
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Regime {currentProviderObj.regime || '12x36'} •{' '}
                {currentProviderObj.teamGroup === 'turma_a' ? 'Turma A' : 'Turma B'} • Plantões Ativos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center shadow-sm">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                Plantões em {activeMonthLabel}
              </span>
              <span className="text-lg font-bold font-mono text-white">
                {monthAssignments.length}
              </span>
              <span className="text-[10px] text-zinc-500 block">
                {monthAssignments.length * shiftHoursPerDay}h escaladas
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center shadow-sm">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                À Venda no Mural
              </span>
              <span className="text-lg font-bold font-mono text-amber-300">
                {activeSales.length}
              </span>
              <span className="text-[10px] text-zinc-500 block">plantões anunciados</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center shadow-sm">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                PIN de Segurança
              </span>
              <span className="text-xs font-semibold text-emerald-300 mt-1 block">
                {currentProviderObj.pin ? 'Ativo (4 dígitos)' : 'Não cadastrado'}
              </span>
              <span className="text-[10px] text-zinc-500 block">Acesso pessoal</span>
            </div>
          </div>

          {/* Form 1: Editar Nome */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Nome / Identificação no Perfil</span>
              </label>
              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Editar Nome</span>
                </button>
              )}
            </div>
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                  placeholder="Seu nome completo"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-cyan-400 cursor-pointer shrink-0 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </button>
              </form>
            ) : (
              <p className="text-xs text-zinc-300 font-medium">{displayProviderName}</p>
            )}
          </div>

          {/* Form 2: WhatsApp Configuration */}
          <form
            onSubmit={handleSaveWhatsapp}
            className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5"
          >
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp para Notificações e Plantões</span>
            </label>
            <p className="text-xs text-zinc-400">
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
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 11987654321"
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl pl-12 pr-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingWhatsapp}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSavingWhatsapp ? 'Salvando...' : whatsappSaved ? 'Salvo ✓' : 'Salvar WhatsApp'}</span>
              </button>
            </div>
          </form>

          {/* Form 3: PIN Security */}
          {currentProviderObj.pin && !isChangingPin ? (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white">PIN Pessoal Ativo</div>
                  <div className="text-[11px] text-zinc-400">
                    Seu perfil está protegido por senha de 4 dígitos.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 rounded-xl font-semibold transition-colors cursor-pointer shrink-0"
              >
                Alterar PIN
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSavePin}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>
                    {currentProviderObj.pin
                      ? 'Alterar PIN Pessoal'
                      : 'Cadastrar PIN Pessoal de 4 Dígitos'}
                  </span>
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
                    className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {currentProviderObj.pin
                  ? 'Informe seu PIN atual e cadastre o novo PIN de 4 dígitos numéricos.'
                  : 'Defina um PIN numérico de 4 dígitos para proteger suas trocas de plantão.'}
              </p>

              {currentProviderObj.pin && (
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-zinc-500" />
                    <span>PIN Atual:</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest text-center font-bold focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Novo PIN (4 dígitos):</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest text-center font-bold focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Confirmar Novo PIN:</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest text-center font-bold focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingPin || newPin.length !== 4 || confirmNewPin.length !== 4}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSavingPin ? 'Salvando PIN...' : 'Confirmar e Salvar Novo PIN'}</span>
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
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                Trocar Perfil
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] transition-colors cursor-pointer shadow-sm"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
