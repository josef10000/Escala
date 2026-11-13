import React, { useState, useEffect, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Provider } from '../../types';
import {
  X,
  UserCheck,
  Search,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  Lock,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface CollaboratorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProvider?: Provider | null;
  onSuccess?: (provider: Provider) => void;
  onOpenLeaderAuth?: () => void;
}

export const CollaboratorAuthModal: React.FC<CollaboratorAuthModalProps> = ({
  isOpen,
  onClose,
  targetProvider,
  onSuccess,
  onOpenLeaderAuth,
}) => {
  const {
    providers,
    authenticateProvider,
    setupProviderPin,
    isLeaderAuthenticated,
    setActiveProviderId,
    setViewMode,
  } = useSchedule();

  // Internal selected provider
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (targetProvider) {
        setSelectedProvider(targetProvider);
      } else {
        setSelectedProvider(null);
      }
      setSearchQuery('');
      setPin('');
      setConfirmPin('');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, targetProvider]);

  // Filtered providers for list view
  const filteredProviders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return providers;
    return providers.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.role && p.role.toLowerCase().includes(q)) ||
      (p.regime && p.regime.toLowerCase().includes(q))
    );
  }, [providers, searchQuery]);

  if (!isOpen) return null;

  // If already authenticated as Leader, leader has master bypass
  if (isLeaderAuthenticated && targetProvider) {
    if (onSuccess) onSuccess(targetProvider);
    onClose();
    return null;
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSelectProvider = (prov: Provider) => {
    setSelectedProvider(prov);
    setPin('');
    setConfirmPin('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const hasPin = Boolean(selectedProvider.pin);

      if (!hasPin) {
        // Setup new PIN flow (first access for this provider)
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          setErrorMsg('O PIN deve conter exatamente 4 números.');
          setIsSubmitting(false);
          return;
        }

        if (pin !== confirmPin) {
          setErrorMsg('A confirmação do PIN não coincide.');
          setIsSubmitting(false);
          return;
        }

        const ok = await setupProviderPin(selectedProvider.id, pin);
        if (ok) {
          setActiveProviderId(selectedProvider.id);
          setViewMode('personal-calendar');
          if (onSuccess) onSuccess(selectedProvider);
          onClose();
        } else {
          setErrorMsg('Erro ao cadastrar o PIN. Tente novamente.');
        }
      } else {
        // Verify existing PIN flow
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          setErrorMsg('Digite os 4 números do seu PIN.');
          setIsSubmitting(false);
          return;
        }

        const ok = authenticateProvider(selectedProvider.id, pin);
        if (ok) {
          setActiveProviderId(selectedProvider.id);
          setViewMode('personal-calendar');
          if (onSuccess) onSuccess(selectedProvider);
          onClose();
        } else {
          setErrorMsg('PIN incorreto. Verifique ou solicite redefinição ao gestor.');
        }
      }
    } catch {
      setErrorMsg('Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] cursor-default backdrop-blur-xl"
      >
        {/* Header - Glass Style */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            {selectedProvider && (
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Voltar para a lista"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {selectedProvider ? 'Autenticação de Perfil' : 'Acesso do Colaborador'}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedProvider ? selectedProvider.name : 'Selecione seu nome para continuar'}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs backdrop-blur-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedProvider ? (
            /* STEP 1: Select Collaborator from List */
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome ou regime..."
                  className="w-full bg-slate-950/70 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredProviders.map(prov => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleSelectProvider(prov)}
                    className="w-full p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 flex items-center justify-between transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
                        {getInitials(prov.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                          {prov.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {prov.regime || '12x36'} • {prov.teamGroup === 'turma_a' ? 'Turma A' : 'Turma B'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {prov.pin ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                          <Lock className="w-2.5 h-2.5" />
                          PIN ativo
                        </span>
                      ) : (
                        <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full font-medium">
                          1º Acesso
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 2: PIN Authentication or Setup */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
                  {getInitials(selectedProvider.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{selectedProvider.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {selectedProvider.regime || '12x36'} • {selectedProvider.pin ? 'PIN configurado' : 'Primeiro acesso - Defina seu PIN'}
                  </div>
                </div>
              </div>

              {!selectedProvider.pin ? (
                /* First Access: Define PIN + Confirm PIN */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Cadastre seu PIN de 4 dígitos para proteger seu perfil.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300">Criar PIN:</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={pin}
                        onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono tracking-widest text-center font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300">Confirmar:</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono tracking-widest text-center font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Existing PIN Login */
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    Digite seu PIN de 4 dígitos:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    autoFocus
                    required
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-slate-950/70 border border-white/10 rounded-2xl px-4 py-3 text-white text-base font-mono tracking-widest text-center font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || pin.length !== 4 || (!selectedProvider.pin && confirmPin.length !== 4)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSubmitting ? 'Verificando...' : selectedProvider.pin ? 'Entrar no Meu Perfil' : 'Salvar PIN e Entrar'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5" />
            Esqueceu o PIN? Peça ao Líder para redefinir.
          </span>
          {onOpenLeaderAuth && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLeaderAuth();
              }}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
            >
              Sou Gestor / Líder
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
