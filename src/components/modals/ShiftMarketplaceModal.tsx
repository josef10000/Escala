import React, { useState, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { ShiftSaleOffer } from '../../types';
import {
  X,
  Coins,
  MessageCircle,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Search,
  ExternalLink,
  Info,
  Trash2,
} from 'lucide-react';

interface ShiftMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSellModal?: () => void;
}

export const ShiftMarketplaceModal: React.FC<ShiftMarketplaceModalProps> = ({
  isOpen,
  onClose,
  onOpenSellModal,
}) => {
  const {
    shiftSaleOffers,
    providers,
    authenticatedProviderId,
    activeProviderId,
    role,
    buyShiftSaleOffer,
    cancelShiftSaleOffer,
  } = useSchedule();

  const [activeTab, setActiveTab] = useState<'available' | 'my_offers' | 'history'>('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmBuyOffer, setConfirmBuyOffer] = useState<ShiftSaleOffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUserId = authenticatedProviderId || activeProviderId;
  const currentProvider = providers.find(p => p.id === currentUserId) || providers[0];

  const availableOffers = useMemo(() => {
    return shiftSaleOffers.filter(o => o.status === 'available');
  }, [shiftSaleOffers]);

  const myOffers = useMemo(() => {
    return shiftSaleOffers.filter(o => o.providerId === currentUserId);
  }, [shiftSaleOffers, currentUserId]);

  const soldHistory = useMemo(() => {
    return shiftSaleOffers.filter(o => o.status === 'sold');
  }, [shiftSaleOffers]);

  const filteredOffers = useMemo(() => {
    let list: ShiftSaleOffer[] = [];
    if (activeTab === 'available') list = availableOffers;
    else if (activeTab === 'my_offers') list = myOffers;
    else list = soldHistory;

    if (!searchTerm.trim()) return list;

    const q = searchTerm.toLowerCase();
    return list.filter(
      o =>
        o.providerName.toLowerCase().includes(q) ||
        o.date.includes(q) ||
        (o.note && o.note.toLowerCase().includes(q))
    );
  }, [activeTab, availableOffers, myOffers, soldHistory, searchTerm]);

  if (!isOpen) return null;

  const handleOpenWhatsApp = (offer: ShiftSaleOffer) => {
    const rawPhone = offer.sellerWhatsapp || providers.find(p => p.id === offer.providerId)?.whatsapp || '11987654321';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = `55${cleanPhone}`;
    }

    const day = offer.date.split('-')[2];
    const priceFormatted = offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const message = `Olá ${offer.providerName.split(' ')[0]}! Vi seu plantão do dia ${day}/10/2026 à venda no EscalaPro (R$ ${priceFormatted}). Tenho interesse em assumir este plantão. Ainda está disponível?`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmBuy = async () => {
    if (!confirmBuyOffer) return;
    setIsProcessing(true);
    try {
      const ok = await buyShiftSaleOffer(confirmBuyOffer.id, currentUserId);
      if (ok) {
        setToastMessage({
          type: 'success',
          text: `Plantão do dia ${confirmBuyOffer.date.split('-')[2]}/10/2026 assumido com sucesso! A escala já foi transferida para você.`,
        });
        setConfirmBuyOffer(null);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setToastMessage({
          type: 'error',
          text: 'Não foi possível assumir este plantão. Verifique se ele ainda está disponível.',
        });
      }
    } catch (e: any) {
      setToastMessage({
        type: 'error',
        text: e.message || 'Erro ao processar transferência de plantão.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOffer = (offerId: string) => {
    cancelShiftSaleOffer(offerId);
    setToastMessage({
      type: 'success',
      text: 'Anúncio cancelado com sucesso. O plantão permanece sob sua responsabilidade.',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0e1017] border border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Mural de Venda & Repasse de Plantões
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full">
                  Repasse Remunerado PJ
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Passe ou assuma plantões remunerados de colegas com contato direto via WhatsApp
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenSellModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSellModal();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Vender Meu Plantão
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* Tabs & Search */}
        <div className="px-6 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 p-1 bg-[#141720] rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'available'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Disponíveis para Assumir</span>
              <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 text-[10px] rounded-full font-mono">
                {availableOffers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('my_offers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'my_offers'
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Meus Anúncios</span>
              <span className="px-1.5 py-0.2 bg-white/10 text-neutral-300 text-[10px] rounded-full font-mono">
                {myOffers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Histórico de Repasses</span>
              <span className="px-1.5 py-0.2 bg-white/10 text-neutral-300 text-[10px] rounded-full font-mono">
                {soldHistory.length}
              </span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por colega ou dia..."
              className="bg-[#141720] border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/40 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {filteredOffers.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-white/[0.08] rounded-2xl bg-[#12141c]/50">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {activeTab === 'available'
                  ? 'Nenhum plantão anunciado para venda no momento'
                  : activeTab === 'my_offers'
                  ? 'Você ainda não colocou nenhum plantão à venda'
                  : 'Nenhum repasse registrado ainda'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
                {activeTab === 'available'
                  ? 'Quando colegas prestadores precisarem repassar um plantão com remuneração acordada, eles aparecerão aqui.'
                  : 'Se não puder comparecer a um plantão, anuncie-o para que outros colegas assumam com valor acordado.'}
              </p>
              {onOpenSellModal && activeTab !== 'history' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSellModal();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Anunciar Plantão para Venda
                </button>
              )}
            </div>
          ) : (
            filteredOffers.map(offer => {
              const isMine = offer.providerId === currentUserId;
              const day = offer.date.split('-')[2];
              const seller = providers.find(p => p.id === offer.providerId);

              return (
                <div
                  key={offer.id}
                  className="p-5 rounded-2xl bg-[#13161f] border border-white/[0.08] hover:border-amber-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Shift Details */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Dia {day}/10/2026
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        07h00 às 19h00 (12h Diurno)
                      </span>
                      {offer.status === 'sold' && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-medium">
                          Assumido por {offer.buyerProviderName || 'Colega'}
                        </span>
                      )}
                      {offer.status === 'cancelled' && (
                        <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700 text-[10px] font-medium">
                          Cancelado
                        </span>
                      )}
                    </div>

                    {/* Seller details */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs font-semibold text-white">
                        {offer.providerName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white flex items-center gap-1.5">
                          {offer.providerName}
                          {isMine && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-[#00d2d3]/20 text-[#00d2d3] border border-[#00d2d3]/30 rounded font-semibold">
                              VOCÊ
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {seller?.role || 'Prestador PJ'} • {seller?.regime || '12x36'}
                        </div>
                      </div>
                    </div>

                    {/* Note if any */}
                    {offer.note && (
                      <p className="text-xs text-neutral-300 bg-black/30 rounded-xl px-3 py-2 border border-white/[0.04]">
                        "{offer.note}"
                      </p>
                    )}
                  </div>

                  {/* Right: Value & Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                        Valor do Repasse PJ
                      </span>
                      <span className="text-lg font-bold font-mono text-amber-400">
                        R$ {offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {offer.status === 'available' && (
                      <div className="flex items-center gap-2">
                        {/* WhatsApp Button */}
                        <button
                          onClick={() => handleOpenWhatsApp(offer)}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 transition-all flex items-center gap-1.5"
                          title="Conversar com o prestador pelo WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-[#25D366]/30" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Buy / Assume Button */}
                        {isMine ? (
                          <button
                            onClick={() => handleCancelOffer(offer.id)}
                            className="px-3 py-2 rounded-xl text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Cancelar Anúncio
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmBuyOffer(offer)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                          >
                            <span>Assumir Plantão</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Confirmation Modal Overlay */}
        {confirmBuyOffer && (
          <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#13161f] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Confirmar Assunção de Plantão PJ?
                </h3>
                <p className="text-xs text-neutral-300 mt-1">
                  Você assumirá a escala do dia{' '}
                  <strong className="text-amber-300">
                    {confirmBuyOffer.date.split('-')[2]}/10/2026 (07h às 19h)
                  </strong>{' '}
                  no lugar de <strong>{confirmBuyOffer.providerName}</strong> pelo valor de{' '}
                  <strong className="text-amber-400 font-mono">
                    R$ {confirmBuyOffer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                  .
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-[11px] text-neutral-400 space-y-1">
                <p>• A titularidade na escala será transferida para seu nome automaticamente.</p>
                <p>• O acerto financeiro do repasse da diária deve ser alinhado diretamente com o colega.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmBuyOffer(null)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBuy}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/25 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isProcessing ? 'Confirmando...' : 'Confirmar e Assumir Escala'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
