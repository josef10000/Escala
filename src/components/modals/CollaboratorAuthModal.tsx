import React, { useState, useEffect, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Provider } from '../../types';
import {
  X,
  UserCheck,
  Search,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Lock,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface CollaboratorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProvider?: Provider | null;
  onSuccess?: (provider: Provider) => void;
}

export const CollaboratorAuthModal: React.FC<CollaboratorAuthModalProps> = ({
  isOpen,
  onClose,
  targetProvider,
  onSuccess,
}) => {
  const {
    providers,
    authenticateProvider,
    setupProviderPin,
    isLeaderAuthenticated,
  } = useSchedule();

  // Internal selected provider (starts with targetProvider if provided, else null for list view)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
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
        // Setup new PIN flow
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          setErrorMsg('O PIN deve conter exatamente 4 números.');
          setIsSubmitting(false);
          return;
        }

        if (pin !== confirmPin) {
          setErrorMsg('A confirmação do PIN não confere.');
          setIsSubmitting(false);
          return;
        }

        const ok = await setupProviderPin(selectedProvider.id, pin);
        if (ok) {
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
          if (onSuccess) onSuccess(selectedProvider);
          onClose();
        } else {
          setErrorMsg('PIN incorreto. Verifique ou peça o reset ao seu Líder.');
        }
      }
    } catch {
      setErrorMsg('Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-[#141c28] text-slate-100 rounded-3xl p-5 sm:p-6 border border-[#1e2a3a] shadow-2xl max-w-md w-full space-y-4">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#1e2a3a] pb-3">
          <div className="flex items-center gap-2.5">
            {selectedProvider && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider(null);
                  setErrorMsg('');
                  setPin('');
                  setConfirmPin('');
                }}
                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Voltar para a lista de participantes"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="text-xs text-cyan-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Identificação do Colaborador</span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                {selectedProvider ? 'Acesso ao Perfil' : 'Quem é você na equipe?'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: PARTICIPANT SELECTION LIST */}
        {!selectedProvider ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Selecione seu nome na lista abaixo para conectar seu perfil neste aparelho. Você poderá consultar escalas e solicitar trocas com agilidade.
            </p>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar por nome ou função..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0c121c] border border-[#1e2a3a] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
              />
            </div>

            {/* Providers Scroll Area */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {filteredProviders.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Nenhum colaborador encontrado com "{searchQuery}".
                </div>
              ) : (
                filteredProviders.map(p => {
                  const hasPin = Boolean(p.pin);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProvider(p)}
                      className="w-full text-left p-2.5 rounded-2xl bg-[#0c121c] hover:bg-slate-800/80 border border-[#1e2a3a] hover:border-cyan-500/40 flex items-center justify-between gap-2.5 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-cyan-500/30 flex items-center justify-center font-black text-xs text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                          {getInitials(p.name)}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-white group-hover:text-cyan-300 transition-colors truncate">
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {p.role} • {p.regime || '12x36'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {hasPin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>PIN Criado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/80">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>1º Acesso</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* STEP 2: PIN SETUP OR VERIFICATION */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Selected Collaborator Summary Badge */}
            <div className="p-3 bg-[#0c121c] border border-[#1e2a3a] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-cyan-500/40 flex items-center justify-center font-black text-xs text-cyan-400 shrink-0">
                  {getInitials(selectedProvider.name)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-white truncate">
                    {selectedProvider.name}
                  </h4>
                  <span className="text-xs text-slate-400 block">
                    {selectedProvider.role} • Regime {selectedProvider.regime || '12x36'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedProvider(null);
                  setErrorMsg('');
                  setPin('');
                  setConfirmPin('');
                }}
                className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer shrink-0"
              >
                Trocar
              </button>
            </div>

            {/* CASE A: PRIMEIRO ACESSO (CRIAR PIN) */}
            {!selectedProvider.pin ? (
              <div className="space-y-3">
                <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Primeiro Acesso de {selectedProvider.name.split(' ')[0]}!</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Crie um PIN numérico de <strong>4 dígitos</strong> para proteger seu perfil neste aparelho. Você usará este PIN para confirmar trocas e plantões.
                  </p>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Criar PIN (4 números)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      autoFocus
                      required
                      placeholder="••••"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3 py-2 text-center text-lg tracking-[0.5em] font-black bg-[#0c121c] border border-[#1e2a3a] text-white rounded-xl focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Confirmar o PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3 py-2 text-center text-lg tracking-[0.5em] font-black bg-[#0c121c] border border-[#1e2a3a] text-white rounded-xl focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* CASE B: PIN JÁ CADASTRADO (ENTRAR) */
              <div className="space-y-3">
                <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-300">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span>PIN já cadastrado</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Digite seu PIN de <strong>4 dígitos</strong> para conectar este dispositivo.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Digite seu PIN de 4 dígitos
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    autoFocus
                    required
                    placeholder="••••"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3 py-2 text-center text-lg tracking-[0.5em] font-black bg-[#0c121c] border border-[#1e2a3a] text-white rounded-xl focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Esqueceu seu PIN? Solicite o reset ao Líder da escala através do painel da liderança.
                  </span>
                </div>
              </div>
            )}

            {/* Remember on this device checkbox */}
            <label className="flex items-center gap-2 p-2 bg-[#0c121c] border border-[#1e2a3a] rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={e => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded border-[#1e2a3a] text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-xs text-slate-300 font-medium">
                Lembrar neste aparelho (não precisará redigitar neste dispositivo)
              </span>
            </label>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded-xl border border-rose-800/80">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
              >
                Voltar à Lista
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-950/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{!selectedProvider.pin ? 'Criar PIN & Entrar' : 'Entrar'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
