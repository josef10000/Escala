import React, { useState, useEffect, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import {
  X,
  Coins,
  Calendar,
  Clock,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react';

interface ShiftSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultProviderId?: string;
  onOfferCreated?: (offerId: string) => void;
}

export const ShiftSaleModal: React.FC<ShiftSaleModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultProviderId,
  onOfferCreated,
}) => {
  const {
    providers,
    assignments,
    activeProviderId,
    authenticatedProviderId,
    role,
    createShiftSaleOffer,
    shiftSaleOffers,
    updateProviderWhatsapp,
  } = useSchedule();

  // Current active provider to sell for
  const currentProviderId = defaultProviderId || authenticatedProviderId || activeProviderId;
  const [selectedProviderId, setSelectedProviderId] = useState<string>(currentProviderId);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate || '');
  const [price, setPrice] = useState<number>(150);
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saveWhatsappToProfile, setSaveWhatsappToProfile] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const provider = useMemo(() => {
    return providers.find(p => p.id === selectedProviderId) || providers[0];
  }, [providers, selectedProviderId]);

  // Provider's scheduled shifts that are eligible to sell
  const eligibleShifts = useMemo(() => {
    if (!provider) return [];
    // Get all shifts for this provider that are not already listed for sale
    const listedDates = new Set(
      shiftSaleOffers
        .filter(o => o.providerId === provider.id && o.status === 'available')
        .map(o => o.date)
    );

    return assignments
      .filter(a => a.providerId === provider.id && a.date && a.date.startsWith('2026-10-'))
      .filter(a => !listedDates.has(a.date))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [assignments, provider, shiftSaleOffers]);

  useEffect(() => {
    if (isOpen) {
      const pid = defaultProviderId || authenticatedProviderId || activeProviderId;
      setSelectedProviderId(pid);
      const prov = providers.find(p => p.id === pid);
      if (prov) {
        setWhatsapp(prov.whatsapp || prov.phone?.replace(/\D/g, '') || '');
      }

      if (defaultDate) {
        setSelectedDate(defaultDate);
      } else if (eligibleShifts.length > 0) {
        setSelectedDate(eligibleShifts[0].date);
      }
      setPrice(150);
      setNote('Plantão diurno 12h (07h às 19h). Repasso integral da diária PJ.');
      setSuccessMessage('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, defaultDate, defaultProviderId, authenticatedProviderId, activeProviderId, providers, eligibleShifts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDate) {
      setErrorMessage('Selecione o dia do plantão que deseja colocar à venda.');
      return;
    }

    if (price === undefined || price < 0 || price > 300) {
      setErrorMessage('O valor do repasse/prestação deve ser de R$ 0 a R$ 300.');
      return;
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    if (!cleanWhatsapp || cleanWhatsapp.length < 10) {
      setErrorMessage('Informe um número de WhatsApp válido com DDD (ex: 11988887777).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find shift assignment
      const asg = assignments.find(a => a.providerId === selectedProviderId && a.date === selectedDate);
      const shiftAssignmentId = asg ? asg.id : `asg-${selectedProviderId}-${selectedDate}`;

      const offerId = createShiftSaleOffer({
        shiftAssignmentId,
        providerId: selectedProviderId,
        date: selectedDate,
        price: Number(price),
        note: note.trim() || undefined,
        sellerWhatsapp: cleanWhatsapp,
      });

      if (saveWhatsappToProfile && selectedProviderId) {
        await updateProviderWhatsapp(selectedProviderId, cleanWhatsapp);
      }

      setSuccessMessage('Plantão anunciado com sucesso no Quadro de Escalas e Mural de Repasses!');
      setTimeout(() => {
        if (onOfferCreated) onOfferCreated(offerId);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao publicar plantão à venda.');
      setIsSubmitting(false);
    }
  };

  const quickPricePresets = [0, 50, 100, 150, 200, 250, 300];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0e1017] border border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                Disponibilizar Plantão para Venda / Repasse
                <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  Repasse Remunerado PJ
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Passe seu plantão para outro prestador com valor acordado e contato direto via WhatsApp
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-medium">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-rose-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Collaborator Selection (if leader or switched) */}
          {role === 'supervisor' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                Prestador que deseja vender o plantão
              </label>
              <select
                value={selectedProviderId}
                onChange={e => {
                  setSelectedProviderId(e.target.value);
                  const prov = providers.find(p => p.id === e.target.value);
                  if (prov) setWhatsapp(prov.whatsapp || prov.phone?.replace(/\D/g, '') || '');
                }}
                className="w-full bg-[#161922] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500/50"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role} • {p.regime})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Plantão Selection */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Selecione o Dia do Plantão na Sua Escala
            </label>
            {eligibleShifts.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-400 text-xs">
                Nenhum plantão ativo elegível encontrado para este prestador em Outubro de 2026.
              </div>
            ) : (
              <select
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-[#161922] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Selecione a data do plantão...</option>
                {eligibleShifts.map(s => {
                  const dayNum = s.date.split('-')[2];
                  return (
                    <option key={s.id} value={s.date}>
                      Dia {dayNum}/10/2026 • Plantão 12h Diurno (07h às 19h)
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Valor do Repasse (Diária PJ) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Valor da Diária / Repasse (R$)
              </label>
              <span className="text-[11px] text-amber-400/90 font-mono">
                {price > 0 ? `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">
                R$
              </span>
              <input
                type="number"
                min="0"
                max="300"
                step="10"
                value={price === 0 ? '0' : price || ''}
                onChange={e => setPrice(Number(e.target.value))}
                placeholder="Ex: 150 (R$ 0 a R$ 300)"
                className="w-full bg-[#161922] border border-white/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            {/* Quick price chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider mr-1">Sugestões:</span>
              {quickPricePresets.map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setPrice(val)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg font-mono border transition-all ${
                    price === val
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold shadow-sm shadow-amber-500/10'
                      : 'bg-[#161922] border-white/[0.06] text-neutral-400 hover:text-white hover:border-white/[0.12]'
                  }`}
                >
                  R$ {val}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Direct Field */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              Seu WhatsApp para Contato Direto
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-mono">
                +55
              </span>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="Ex: 11987654321 (DDD + número)"
                className="w-full bg-[#161922] border border-white/[0.08] rounded-xl pl-12 pr-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveWhatsappToProfile}
                onChange={e => setSaveWhatsappToProfile(e.target.checked)}
                className="rounded border-white/20 bg-[#161922] text-[#00d2d3] focus:ring-0"
              />
              <span className="text-[11px] text-neutral-400">
                Salvar este WhatsApp no meu cadastro para contatos futuros de troca e venda
              </span>
            </label>
          </div>

          {/* Observações / Descrição do Plantão */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Detalhes / Observações do Plantão (Opcional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: Plantão diurno UTI Geral 12h. Repasso o valor integral acordado."
              className="w-full bg-[#161922] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* How It Works Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-transparent border border-amber-500/20 text-xs text-neutral-300 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-medium text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Como funciona o Repasse de Plantão:
            </div>
            <ul className="text-[11px] text-neutral-400 space-y-1 list-disc list-inside">
              <li>O plantão ganhará um selo dourado <span className="text-amber-300 font-semibold">À VENDA</span> no quadro geral de escalas.</li>
              <li>Qualquer colega prestador poderá clicar no plantão, conversar diretamente com você no WhatsApp e aceitar assumi-lo.</li>
              <li>Assim que um colega aceitar, a titularidade da escala passa para ele no sistema automaticamente.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDate || !price}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Coins className="w-4 h-4" />
              {isSubmitting ? 'Publicando...' : `Publicar Plantão por R$ ${price.toLocaleString('pt-BR')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
