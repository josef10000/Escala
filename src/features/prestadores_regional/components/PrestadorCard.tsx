import React, { useState, useRef, useEffect } from 'react';
import { Prestador } from '../types';
import { Copy, Check, Edit2, Trash2, Phone, Star, MapPin, ChevronDown, MessageSquare } from 'lucide-react';
import { normalizeText } from '../utils/search';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getWhatsAppUrl, cleanPhoneNumber, openWhatsApp, WHATSAPP_TAB_NAME } from '../utils/whatsapp';
import { useSchedule } from '../../../context/ScheduleContext';

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'PR').toUpperCase();
}

// Apple iOS Glassmorphic Region Tokens
const getRegionStyle = (region: string) => {
  const norm = normalizeText(region);
  if (norm.startsWith('leste')) {
    return {
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      dot: 'bg-emerald-400',
      avatarRing: 'ring-emerald-500/30 text-emerald-300 bg-emerald-500/10',
      glow: 'from-emerald-500/[0.07]',
    };
  }
  if (norm.startsWith('oeste')) {
    return {
      badge: 'bg-amber-500/10 text-amber-300 border-amber-400/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      dot: 'bg-amber-400',
      avatarRing: 'ring-amber-500/30 text-amber-300 bg-amber-500/10',
      glow: 'from-amber-500/[0.07]',
    };
  }
  if (norm.startsWith('norte')) {
    return {
      badge: 'bg-sky-500/10 text-sky-300 border-sky-400/20 shadow-[0_0_12px_rgba(14,165,233,0.15)]',
      dot: 'bg-sky-400',
      avatarRing: 'ring-sky-500/30 text-sky-300 bg-sky-500/10',
      glow: 'from-sky-500/[0.07]',
    };
  }
  if (norm.startsWith('sul')) {
    return {
      badge: 'bg-purple-500/10 text-purple-300 border-purple-400/20 shadow-[0_0_12px_rgba(168,85,247,0.15)]',
      dot: 'bg-purple-400',
      avatarRing: 'ring-purple-500/30 text-purple-300 bg-purple-500/10',
      glow: 'from-purple-500/[0.07]',
    };
  }
  if (norm.startsWith('abc')) {
    return {
      badge: 'bg-rose-500/10 text-rose-300 border-rose-400/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
      dot: 'bg-rose-400',
      avatarRing: 'ring-rose-500/30 text-rose-300 bg-rose-500/10',
      glow: 'from-rose-500/[0.07]',
    };
  }
  return {
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    dot: 'bg-cyan-400',
    avatarRing: 'ring-cyan-500/30 text-cyan-300 bg-cyan-500/10',
    glow: 'from-cyan-500/[0.07]',
  };
};

export interface PrestadorCardProps {
  prestador: Prestador;
  onEdit: (p: Prestador) => void;
  onDelete: (id: string) => void;
  onCopySuccess: (text: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  density?: 'spacious' | 'compact';
  onRecordRecent?: (p: Prestador) => void;
}

export const PrestadorCard: React.FC<PrestadorCardProps> = ({
  prestador: p,
  onEdit,
  onDelete,
  onCopySuccess,
  isFavorite,
  onToggleFavorite,
  density = 'spacious',
  onRecordRecent,
}) => {
  const { isLeaderAuthenticated, authenticatedProviderId, activeProviderId } = useSchedule();
  const loggedInProvId = authenticatedProviderId || activeProviderId;
  const canManagePrestador = isLeaderAuthenticated || (loggedInProvId ? p.id === loggedInProvId : false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isQuickMsgOpen, setIsQuickMsgOpen] = useState(false);
  const quickMsgRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(p.nome);
  const regStyle = getRegionStyle(p.regiao);

  // Close quick message dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (quickMsgRef.current && !quickMsgRef.current.contains(e.target as Node)) {
        setIsQuickMsgOpen(false);
      }
    };
    if (isQuickMsgOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isQuickMsgOpen]);

  const handleCopyCard = async () => {
    onRecordRecent?.(p);
    const textToCopy = `PRESTADOR: ${p.nome}
CÓDIGO: #${p.codigo}
REGIÃO: ${p.regiao}
TELEFONE: ${p.telefone || 'Não informado'}
${p.observacao ? `OBS: ${p.observacao}` : ''}`.trim();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(`card-${p.id}`);
      onCopySuccess('Dados do prestador copiados!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onCopySuccess('Não foi possível copiar automaticamente.');
    }
  };

  const handleCopyPhone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!p.telefone) return;
    onRecordRecent?.(p);

    try {
      await navigator.clipboard.writeText(p.telefone);
      setCopiedId(`phone-${p.id}`);
      onCopySuccess(`Telefone de ${p.nome} copiado!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onCopySuccess('Erro ao copiar telefone.');
    }
  };

  const handleOpenWhatsApp = (customMessage?: string) => {
    if (!p.telefone) return;
    onRecordRecent?.(p);

    const message = customMessage || `Olá ${p.nome} (${p.codigo}), contato da central dr.monitora®. Tudo bem?`;
    const url = getWhatsAppUrl(p.telefone, message);
    openWhatsApp(url, WHATSAPP_TAB_NAME);
    setIsQuickMsgOpen(false);
  };

  const QUICK_MESSAGES = [
    {
      title: 'Padrão Central',
      desc: 'Saudação oficial dr.monitora®',
      msg: `Olá ${p.nome} (${p.codigo}), contato da central dr.monitora®. Tudo bem?`,
    },
    {
      title: 'Disponibilidade de Encaixe',
      desc: 'Pergunta rápida de apoio na região',
      msg: `Olá ${p.nome}! Você teria disponibilidade para um encaixe na região de ${p.regiao} hoje?`,
    },
    {
      title: 'Confirmação de Plantão',
      desc: 'Confirmação da escala oficial',
      msg: `Olá ${p.nome}, tudo bem? Confirmando seu plantão conforme a escala oficial da equipe.`,
    },
    {
      title: 'Abertura de Demanda / OS',
      desc: 'Chamado urgente para atendimento',
      msg: `Olá ${p.nome}, temos uma OS aberta para atendimento presencial na base ${p.regiao}. Pode assumir?`,
    },
  ];

  // -------------------------------------------------------------
  // COMPACT VIEW (Apple Liquid Glass Pill)
  // -------------------------------------------------------------
  if (density === 'compact') {
    return (
      <div
        className="relative rounded-2xl p-3 flex items-center justify-between gap-3 group transition-all duration-300
          bg-gradient-to-b from-white/[0.08] to-white/[0.02]
          hover:from-white/[0.12] hover:to-white/[0.04]
          backdrop-blur-2xl
          border border-white/[0.10] hover:border-white/[0.22]
          shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
          hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.5)]"
      >
        {/* Apple Top Hairline Sheen */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-t-2xl" />

        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-2.5 min-w-0 relative z-10 flex-1">
          <div className={`w-8 h-8 rounded-full ring-1 flex items-center justify-center font-bold font-mono text-xs shrink-0 backdrop-blur-md ${regStyle.avatarRing}`}>
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] font-semibold text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded-full border border-white/10">
                #{p.codigo}
              </span>
              <span className="text-xs font-semibold text-white truncate drop-shadow-sm">{p.nome}</span>
              <span className={`text-[10px] font-medium font-mono uppercase px-2 py-0.5 rounded-full border backdrop-blur-md ${regStyle.badge}`}>
                {p.regiao}
              </span>
            </div>

            {p.telefone && (
              <div className="text-[11px] text-white/60 font-mono mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-white/40" />
                <span>{p.telefone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(p.id)}
            title={isFavorite ? 'Remover dos favoritos' : 'Favoritar prestador'}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isFavorite
                ? 'text-amber-400 bg-amber-400/15 border border-amber-400/30'
                : 'text-white/40 hover:text-amber-300 hover:bg-white/[0.08]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCopyCard}
            title="Copiar dados"
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            {copiedId === `card-${p.id}` ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {p.telefone && cleanPhoneNumber(p.telefone) && (
            <button
              type="button"
              onClick={() => handleOpenWhatsApp()}
              title="Abrir WhatsApp"
              className="p-1.5 rounded-xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
            </button>
          )}

          {canManagePrestador && (
            <>
              <button
                type="button"
                onClick={() => {
                  onRecordRecent?.(p);
                  onEdit(p);
                }}
                title="Editar prestador"
                className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(p.id)}
                title="Excluir prestador"
                className="p-1.5 rounded-xl text-white/50 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SPACIOUS VIEW (Apple Sonoma / iOS 18 Frosted Glass)
  // -------------------------------------------------------------
  return (
    <div
      className="relative rounded-3xl p-5 flex flex-col justify-between group transition-all duration-300
        bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-transparent
        hover:from-white/[0.11] hover:via-white/[0.05] hover:to-white/[0.01]
        backdrop-blur-2xl
        border border-white/[0.12] hover:border-white/[0.24]
        shadow-[0_12px_40px_0_rgba(0,0,0,0.45)]
        hover:shadow-[0_20px_50px_0_rgba(0,0,0,0.65)]
        hover:-translate-y-0.5 overflow-hidden"
    >
      {/* 1. Apple Specular Edge Light (brilho suave superior) */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* 2. Soft Ambient Regional Glow (Halo difuso de fundo) */}
      <div
        className={`absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br ${regStyle.glow} to-transparent blur-3xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <div className="relative z-10">
        {/* Top Header: Code & Region Pill + Quick Action Toolbar */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Monospace Code Pill */}
            <span className="font-mono text-[11px] font-semibold text-white/80 bg-white/[0.07] px-2.5 py-0.5 rounded-full border border-white/10 shrink-0 backdrop-blur-md">
              #{p.codigo}
            </span>

            {/* Apple Region Glass Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold font-mono uppercase tracking-wide border backdrop-blur-md ${regStyle.badge} truncate`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${regStyle.dot} animate-pulse shrink-0`} />
              <span className="truncate">{p.regiao}</span>
            </span>
          </div>

          {/* Action Toolbar (Glass Segment) */}
          <div className="flex items-center gap-1 shrink-0 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08] backdrop-blur-md">
            <button
              type="button"
              onClick={() => onToggleFavorite(p.id)}
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar prestador'}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isFavorite
                  ? 'text-amber-400 bg-amber-400/15 border border-amber-400/30'
                  : 'text-white/40 hover:text-amber-300 hover:bg-white/[0.08]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {canManagePrestador && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onRecordRecent?.(p);
                    onEdit(p);
                  }}
                  title="Editar prestador"
                  className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  title="Excluir prestador"
                  className="p-1.5 rounded-xl text-white/50 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Body: Avatar + Name */}
        <div className="flex items-start gap-3.5 my-1">
          {/* Avatar (Circle Glass Ring) */}
          <div
            className={`w-11 h-11 rounded-2xl ring-1 flex items-center justify-center font-bold font-mono text-sm shrink-0 backdrop-blur-md shadow-inner ${regStyle.avatarRing}`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="text-base font-bold text-white tracking-tight leading-snug truncate drop-shadow-sm"
              title={p.nome}
            >
              {p.nome}
            </h3>

            {/* Phone Dock (Apple Frosted Sub-Surface) */}
            {p.telefone ? (
              <div className="flex items-center justify-between gap-2 mt-2.5 p-1.5 px-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md hover:border-white/[0.15] transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-white/40 shrink-0" />
                  <a
                    href={`tel:${p.telefone}`}
                    className="text-xs font-mono text-white/80 hover:text-white transition-colors truncate"
                  >
                    {p.telefone}
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    copiedId === `phone-${p.id}`
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border-white/10 hover:text-white'
                  }`}
                  title="Copiar telefone"
                >
                  {copiedId === `phone-${p.id}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-white/40" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onRecordRecent?.(p);
                  onEdit(p);
                }}
                className="w-full flex items-center justify-between gap-2 mt-2.5 p-1.5 px-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-dashed border-white/[0.10] hover:border-white/[0.20] text-white/40 hover:text-white/80 transition-all text-xs cursor-pointer"
                title="Cadastrar telefone para este prestador"
              >
                <span className="flex items-center gap-1.5 text-xs text-white/40">
                  <Phone className="w-3 h-3" />
                  <span>Sem telefone</span>
                </span>
                <span className="font-semibold text-[11px] text-cyan-400 hover:text-cyan-300">
                  + Adicionar
                </span>
              </button>
            )}

            {/* Observação */}
            {p.observacao && (
              <div className="text-xs text-white/60 mt-2.5 line-clamp-2 leading-relaxed bg-white/[0.02] p-2.5 rounded-2xl border border-white/[0.06]">
                {p.observacao}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions + WhatsApp Quick Pre-Fill */}
      <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center gap-2.5 relative z-10">
        {/* Copy Card Data Pill */}
        <button
          type="button"
          onClick={handleCopyCard}
          className={`flex-1 py-2 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border backdrop-blur-md ${
            copiedId === `card-${p.id}`
              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
              : 'bg-white/[0.05] hover:bg-white/[0.10] text-white/80 border-white/[0.10] hover:border-white/[0.20] hover:text-white'
          }`}
          title="Copiar dados formatados"
        >
          {copiedId === `card-${p.id}` ? (
            <>
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 shrink-0 text-white/50" />
              <span>Copiar Dados</span>
            </>
          )}
        </button>

        {/* WhatsApp Pill with Quick Message Popover */}
        {p.telefone && cleanPhoneNumber(p.telefone) ? (
          <div className="flex-1 relative" ref={quickMsgRef}>
            <div className="flex rounded-2xl overflow-hidden border border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25 transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md">
              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={() => handleOpenWhatsApp()}
                className="flex-1 py-2 px-2.5 text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-300 hover:text-emerald-200 cursor-pointer"
                title={`Abrir WhatsApp com ${p.nome}`}
              >
                <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>

              {/* Quick Message Dropdown Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQuickMsgOpen((prev) => !prev);
                }}
                className="px-2 border-l border-emerald-400/20 text-emerald-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Mensagens rápidas prontas"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQuickMsgOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Quick Message Popover Menu (Apple Glass Sheet) */}
            {isQuickMsgOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-72 bg-slate-950/90 backdrop-blur-3xl border border-white/[0.15] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-2 z-50 animate-in fade-in duration-150 space-y-1">
                <div className="px-3 py-2 border-b border-white/[0.08] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Disparo Rápido</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    1-clique
                  </span>
                </div>

                {QUICK_MESSAGES.map((qm, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleOpenWhatsApp(qm.msg)}
                    className="w-full text-left p-2.5 rounded-2xl hover:bg-white/[0.08] transition-all group/item cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-white group-hover/item:text-emerald-300 flex items-center justify-between">
                      <span>{qm.title}</span>
                      <WhatsAppIcon className="w-3 h-3 opacity-60 group-hover/item:opacity-100" />
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">{qm.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onRecordRecent?.(p);
              onEdit(p);
            }}
            className="flex-1 py-2 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.10] text-white/80 hover:text-white border border-white/[0.10] hover:border-white/[0.20] transition-all cursor-pointer backdrop-blur-md"
            title={`Editar cadastro de ${p.nome}`}
          >
            <Edit2 className="w-3.5 h-3.5 shrink-0 text-white/50" />
            <span>Editar</span>
          </button>
        )}
      </div>
    </div>
  );
};
