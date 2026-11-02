import React, { useState, useEffect } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import {
  X,
  User,
  MessageCircle,
  KeyRound,
  ShieldCheck,
  Calendar,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Lock,
} from 'lucide-react';

interface CollaboratorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId?: string;
}

export const CollaboratorProfileModal: React.FC<CollaboratorProfileModalProps> = ({
  isOpen,
  onClose,
  providerId,
}) => {
  const {
    providers,
    authenticatedProviderId,
    activeProviderId,
    updateProviderWhatsapp,
    setupProviderPin,
    assignments,
    shiftSaleOffers,
  } = useSchedule();

  const targetId = providerId || authenticatedProviderId || activeProviderId;
  const provider = providers.find(p => p.id === targetId) || providers[0];

  const [whatsapp, setWhatsapp] = useState('');
  const [pin, setPin] = useState('');
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && provider) {
      setWhatsapp(provider.whatsapp || provider.phone?.replace(/\D/g, '') || '');
      setPin('');
      setSuccessMsg('');
      setErrorMsg('');
      setIsSavingWhatsapp(false);
      setIsSavingPin(false);
    }
  }, [isOpen, provider]);

  if (!isOpen || !provider) return null;

  // Monthly stats for this provider
  const monthAssignments = assignments.filter(
    a => a.providerId === provider.id && a.date && a.date.startsWith('2026-10-')
  );
  const activeSales = shiftSaleOffers.filter(
    o => o.providerId === provider.id && o.status === 'available'
  );

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
      await updateProviderWhatsapp(provider.id, cleanPhone);
      setSuccessMsg('Número de WhatsApp atualizado com sucesso! Agora colegas podem contatar você para trocas e repasses.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar WhatsApp.');
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
      const ok = await setupProviderPin(provider.id, cleanPin);
      if (ok) {
        setSuccessMsg('PIN de segurança de 4 dígitos configurado com sucesso!');
        setPin('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e1017] border border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00d2d3]/20 to-purple-500/10 border border-[#00d2d3]/30 flex items-center justify-center text-[#00d2d3] font-bold text-sm">
              {provider.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  {provider.name}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30 rounded-full">
                  Prestador PJ
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Regime {provider.regime} • {provider.teamGroup === 'turma_a' ? 'Turma A' : 'Turma B'} • Horário regular 07h às 19h
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                À Venda
              </span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {activeSales.length}
              </span>
              <span className="text-[10px] text-neutral-500 block">
                no mural
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] text-center">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Segurança PIN
              </span>
              <span className="text-xs font-semibold text-emerald-400 mt-1 block">
                {provider.pin ? 'Ativo (4 dígitos)' : 'Não configurado'}
              </span>
              <span className="text-[10px] text-neutral-500 block">
                Acesso pessoal
              </span>
            </div>
          </div>

          {/* Form: WhatsApp Configuration */}
          <form onSubmit={handleSaveWhatsapp} className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                WhatsApp para Contato Direto
              </label>
              <span className="text-[10px] text-neutral-400">
                Para trocas e compra/venda de plantão
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Colegas que clicarem nos seus plantões ou quiserem negociar permutas poderão abrir uma conversa direta com você no WhatsApp.
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSavingWhatsapp ? 'Salvando...' : 'Salvar WhatsApp'}
              </button>
            </div>
          </form>

          {/* Form: PIN Security */}
          <form onSubmit={handleSavePin} className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                PIN Pessoal de Acesso (4 dígitos)
              </label>
              <span className="text-[10px] text-neutral-400">
                {provider.pin ? 'PIN configurado' : 'Sem PIN'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Proteja seu acesso individual à sua agenda e confirmação de permutas com uma senha de 4 dígitos.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Novo PIN de 4 dígitos..."
                className="flex-1 bg-[#1b1f2b] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest focus:outline-none focus:border-purple-500/50 text-center"
              />
              <button
                type="submit"
                disabled={isSavingPin || pin.length !== 4}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isSavingPin ? 'Gravando...' : 'Definir PIN'}
              </button>
            </div>
          </form>

          {/* Additional details */}
          <div className="p-4 rounded-xl bg-[#141720]/60 border border-white/[0.04] text-xs text-neutral-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>E-mail:</span>
              <span className="text-neutral-200 font-mono text-[11px]">{provider.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Telefone Cadastral:</span>
              <span className="text-neutral-200 font-mono text-[11px]">{provider.phone || 'Não informado'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Regime Contratual:</span>
              <span className="text-neutral-200 font-medium">Prestação de Serviços (PJ 12x36)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#12141c] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
