import React, { useState, useRef, useEffect } from 'react';
import { Prestador } from '../types';
import { Copy, Check, Edit2, Trash2, Phone, Star, MapPin, ChevronDown, MessageSquare } from 'lucide-react';
import { getRegionColor } from '../utils/search';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getWhatsAppUrl, cleanPhoneNumber, openWhatsApp, WHATSAPP_TAB_NAME } from '../utils/whatsapp';

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'PR').toUpperCase();
}

export const GLOW_COLOR_MAP: Record<
  string,
  {
    radial: string;
    avatarGrad: string;
    avatarBorder: string;
    badgeBorder: string;
    badgeGlow: string;
    pillBg: string;
    accentText: string;
  }
> = {
  emerald: {
    radial: 'bg-emerald-500',
    avatarGrad: 'from-emerald-950/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-emerald-500/35 text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
    badgeGlow: 'hover:border-emerald-500/40',
    pillBg: 'from-emerald-950/40 to-slate-900',
    accentText: 'text-emerald-400',
  },
  amber: {
    radial: 'bg-amber-500',
    avatarGrad: 'from-amber-950/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-amber-500/35 text-amber-300',
    badgeBorder: 'border-amber-500/30',
    badgeGlow: 'hover:border-amber-500/40',
    pillBg: 'from-amber-950/40 to-slate-900',
    accentText: 'text-amber-400',
  },
  sky: {
    radial: 'bg-sky-500',
    avatarGrad: 'from-sky-950/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-sky-500/35 text-sky-300',
    badgeBorder: 'border-sky-500/30',
    badgeGlow: 'hover:border-sky-500/40',
    pillBg: 'from-sky-950/40 to-slate-900',
    accentText: 'text-sky-400',
  },
  purple: {
    radial: 'bg-purple-500',
    avatarGrad: 'from-purple-950/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-purple-500/35 text-purple-300',
    badgeBorder: 'border-purple-500/30',
    badgeGlow: 'hover:border-purple-500/40',
    pillBg: 'from-purple-950/40 to-slate-900',
    accentText: 'text-purple-400',
  },
  rose: {
    radial: 'bg-rose-500',
    avatarGrad: 'from-rose-950/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-rose-500/35 text-rose-300',
    badgeBorder: 'border-rose-500/30',
    badgeGlow: 'hover:border-rose-500/40',
    pillBg: 'from-rose-950/40 to-slate-900',
    accentText: 'text-rose-400',
  },
  blue: {
    radial: 'bg-cyan-500',
    avatarGrad: 'from-cyan-950/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-cyan-500/35 text-cyan-300',
    badgeBorder: 'border-cyan-500/30',
    badgeGlow: 'hover:border-cyan-500/40',
    pillBg: 'from-cyan-950/40 to-slate-900',
    accentText: 'text-cyan-400',
  },
  cyan: {
    radial: 'bg-cyan-500',
    avatarGrad: 'from-cyan-950/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-cyan-500/35 text-cyan-300',
    badgeBorder: 'border-cyan-500/30',
    badgeGlow: 'hover:border-cyan-500/40',
    pillBg: 'from-cyan-950/40 to-slate-900',
    accentText: 'text-cyan-400',
  },
  indigo: {
    radial: 'bg-indigo-500',
    avatarGrad: 'from-indigo-950/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-indigo-500/35 text-indigo-300',
    badgeBorder: 'border-indigo-500/30',
    badgeGlow: 'hover:border-indigo-500/40',
    pillBg: 'from-indigo-950/40 to-slate-900',
    accentText: 'text-indigo-400',
  },
  teal: {
    radial: 'bg-teal-500',
    avatarGrad: 'from-teal-950/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-teal-500/35 text-teal-300',
    badgeBorder: 'border-teal-500/30',
    badgeGlow: 'hover:border-teal-500/40',
    pillBg: 'from-teal-950/40 to-slate-900',
    accentText: 'text-teal-400',
  },
  slate: {
    radial: 'bg-slate-500',
    avatarGrad: 'from-slate-800/40 via-slate-900 to-slate-950',
    avatarBorder: 'border-slate-700/50 text-slate-300',
    badgeBorder: 'border-slate-700/50',
    badgeGlow: 'hover:border-slate-600/40',
    pillBg: 'from-slate-850 to-slate-900',
    accentText: 'text-slate-400',
  },
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isQuickMsgOpen, setIsQuickMsgOpen] = useState(false);
  const quickMsgRef = useRef<HTMLDivElement>(null);

  const color = getRegionColor(p.regiao, p.cor);
  const initials = getInitials(p.nome);
  const glowStyles = GLOW_COLOR_MAP[color.glow] || GLOW_COLOR_MAP.slate;

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
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isQuickMsgOpen]);

  const handleCopyCard = () => {
    onRecordRecent?.(p);
    const text = `${p.codigo} - ${p.nome} - ${p.regiao}${p.telefone ? ` - Tel: ${p.telefone}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(`card-${p.id}`);
    onCopySuccess(`Copiado: ${p.codigo} - ${p.nome}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!p.telefone) return;
    onRecordRecent?.(p);
    navigator.clipboard.writeText(p.telefone);
    setCopiedId(`phone-${p.id}`);
    onCopySuccess(`Telefone ${p.telefone} copiado!`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleOpenWhatsApp = (customMsg?: string) => {
    if (!p.telefone) return;
    onRecordRecent?.(p);
    openWhatsApp(p.telefone, p.nome, p.codigo, customMsg);
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
  // COMPACT VIEW
  // -------------------------------------------------------------
  if (density === 'compact') {
    return (
      <div
        className={`relative rounded-xl p-3 flex items-center justify-between gap-3 group transition-all duration-200 ease-out
          bg-[#13151c]/90 backdrop-blur-xl
          border border-[#1f2230] hover:border-[#00d2d3]/50
          shadow-md hover:shadow-lg ${glowStyles.badgeGlow} overflow-hidden`}
      >
        <div
          className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl pointer-events-none opacity-10 group-hover:opacity-20 ${glowStyles.radial}`}
        />

        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-2.5 min-w-0 relative z-10 flex-1">
          <div
            className={`w-9 h-9 rounded-lg border ${glowStyles.avatarBorder} bg-gradient-to-br ${glowStyles.avatarGrad} flex items-center justify-center font-bold font-mono text-xs shrink-0 shadow-xs`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-white bg-[#1a1b26] px-1.5 py-0.5 rounded border border-[#2b2d3d]">
                #{p.codigo}
              </span>
              <span
                className={`text-[10px] font-semibold font-mono uppercase px-2 py-0.5 rounded border ${glowStyles.badgeBorder} ${color.bg} ${color.text} truncate`}
              >
                {p.regiao}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors mt-0.5" title={p.nome}>
              {p.nome}
            </h4>
          </div>
        </div>

        {/* Right: Actions in compact row */}
        <div className="flex items-center gap-1.5 shrink-0 relative z-10">
          {p.telefone ? (
            <button
              type="button"
              onClick={handleCopyPhone}
              className={`p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                copiedId === `phone-${p.id}`
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-[#1a1b22] hover:bg-[#23252f] text-cyan-300 border-[#2b2d3d]'
              }`}
              title={`Copiar ${p.telefone}`}
            >
              {copiedId === `phone-${p.id}` ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onRecordRecent?.(p);
                onEdit(p);
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-cyan-950/60 hover:bg-[#00d2d3] text-cyan-300 hover:text-black border border-cyan-800/40 transition-all cursor-pointer"
              title="Cadastrar telefone"
            >
              + Tel
            </button>
          )}

          {p.telefone && (
            <button
              type="button"
              onClick={() => handleOpenWhatsApp()}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Abrir WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onRecordRecent?.(p);
              onEdit(p);
            }}
            title="Editar prestador"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(p.id)}
            title="Excluir prestador"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SPACIOUS VIEW (STANDARD)
  // -------------------------------------------------------------
  return (
    <div
      className={`relative rounded-2xl p-5 flex flex-col justify-between group transition-all duration-300 ease-out
        bg-gradient-to-br from-[#161824]/95 via-[#11131c]/95 to-[#0b0c12]/95 backdrop-blur-2xl
        border border-[#1f2230] hover:border-[#00d2d3]/50
        border-t-white/10 hover:border-t-[#00d2d3]/60
        shadow-[0_12px_32px_-8px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.08)]
        hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.9),0_0_26px_rgba(0,210,211,0.18)]
        ${glowStyles.badgeGlow}
        hover:-translate-y-1.5 overflow-visible`}
    >
      {/* Ambient Radial Color Glow in top right corner */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${glowStyles.radial}`}
      />

      {/* Top Specular Glass Reflection Line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d2d3]/35 to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Top Row: Region & Code + Action Toolbar */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-mono text-xs font-bold text-[#e3e1e9] bg-[#1a1b26] px-2.5 py-1 rounded-lg border border-[#2b2d3d] shadow-xs shrink-0">
              #{p.codigo}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono uppercase tracking-wide border ${glowStyles.badgeBorder} ${color.bg} ${color.text} shadow-xs truncate`}
            >
              <MapPin className="w-3.5 h-3.5 opacity-80 shrink-0" />
              <span className="truncate">{p.regiao}</span>
            </span>
          </div>

          {/* Action Toolbar: ALWAYS VISIBLE to guarantee standard across all cards */}
          <div className="flex items-center gap-1 shrink-0 bg-[#0f1118]/80 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => onToggleFavorite(p.id)}
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar prestador'}
              className={`p-1.5 rounded-lg transition-all active:scale-90 cursor-pointer ${
                isFavorite
                  ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-[#1f212a] border border-transparent'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                onRecordRecent?.(p);
                onEdit(p);
              }}
              title="Editar prestador (nome, telefone, cor, região)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all active:scale-90 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(p.id)}
              title="Excluir prestador da base"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-90 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Body: Avatar + Name + Phone Dock */}
        <div className="flex items-start gap-3.5 my-2">
          {/* Avatar with colored gradient and border */}
          <div
            className={`w-11 h-11 rounded-xl border ${glowStyles.avatarBorder} bg-gradient-to-br ${glowStyles.avatarGrad} flex items-center justify-center font-bold font-mono text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="text-base font-bold text-white tracking-tight leading-snug truncate group-hover:text-cyan-300 transition-colors"
              title={p.nome}
            >
              {p.nome}
            </h3>

            {/* Sunken Dock for Phone or Add Phone Button */}
            {p.telefone ? (
              <div className="flex items-center justify-between gap-2 mt-2 p-1.5 px-2 rounded-xl bg-[#0d0e13] border border-[#1e2029]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-[#1a1b22] border border-[#2a2b32] flex items-center justify-center shrink-0">
                    <Phone className="w-3 h-3 text-emerald-400" />
                  </div>
                  <a
                    href={`tel:${p.telefone}`}
                    className="text-xs font-mono font-medium text-slate-300 hover:text-white transition-colors truncate tracking-wide"
                  >
                    {p.telefone}
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 shrink-0 cursor-pointer ${
                    copiedId === `phone-${p.id}`
                      ? 'bg-emerald-600 text-white border border-emerald-400/50'
                      : 'bg-[#1a1b22] hover:bg-[#23252f] text-cyan-300 border border-[#2a2b32] hover:border-[#00d2d3]/40'
                  }`}
                  title="Copiar apenas o telefone"
                >
                  {copiedId === `phone-${p.id}` ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-cyan-400" />
                      <span>Copiar Tel</span>
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
                className="w-full flex items-center justify-between gap-2 mt-2 p-1.5 px-2.5 rounded-xl bg-[#0d0e13]/80 hover:bg-[#141824] border border-dashed border-[#2a2d3d] hover:border-[#00d2d3]/60 text-slate-400 hover:text-cyan-300 transition-all text-xs group/tel cursor-pointer"
                title="Cadastrar telefone para este prestador"
              >
                <span className="flex items-center gap-1.5 text-xs italic">
                  <Phone className="w-3 h-3 text-slate-500 group-hover/tel:text-cyan-400" />
                  <span>Sem telefone cadastrado</span>
                </span>
                <span className="font-semibold text-[11px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/50 group-hover/tel:bg-[#00d2d3] group-hover/tel:text-[#003731] transition-colors">
                  + Adicionar
                </span>
              </button>
            )}

            {/* Observação */}
            {p.observacao && (
              <div className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed bg-[#0d0e13] p-2.5 rounded-xl border border-[#1e2029]">
                {p.observacao}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Bottom Actions + WhatsApp Quick Pre-Fill */}
      <div className="mt-4 pt-3.5 border-t border-[#1e2029] flex items-center gap-2.5 relative z-10">
        <button
          type="button"
          onClick={handleCopyCard}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.97] cursor-pointer ${
            copiedId === `card-${p.id}`
              ? 'bg-emerald-600 text-white border border-emerald-400/50'
              : 'bg-[#1a1b22] hover:bg-[#23252f] text-[#e3e1e9] border border-[#2a2b32] hover:border-[#00d2d3]/40'
          }`}
          title="Copiar dados formatados para colar no atendimento"
        >
          {copiedId === `card-${p.id}` ? (
            <>
              <Check className="w-3.5 h-3.5 shrink-0 text-white" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>Copiar Dados</span>
            </>
          )}
        </button>

        {p.telefone && cleanPhoneNumber(p.telefone) ? (
          <div className="flex-1 relative" ref={quickMsgRef}>
            <div className="flex rounded-xl overflow-hidden shadow-md shadow-emerald-500/20">
              {/* Primary Direct WhatsApp Button */}
              <button
                type="button"
                onClick={() => handleOpenWhatsApp()}
                className="flex-1 py-2.5 px-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.97] cursor-pointer
                  bg-gradient-to-b from-[#12a150] via-[#0d8e44] to-[#097737] hover:from-[#15b259] hover:via-[#109e4d] hover:to-[#0a853e]
                  text-white border-t border-emerald-300/40 border-b border-emerald-950"
                title={`Abrir WhatsApp com ${p.nome}`}
              >
                <WhatsAppIcon className="w-3.5 h-3.5 shrink-0 drop-shadow-xs" />
                <span className="truncate">WhatsApp</span>
              </button>

              {/* Quick Message Dropdown Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQuickMsgOpen((prev) => !prev);
                }}
                className="px-2 bg-gradient-to-b from-[#0e8f46] to-[#07662e] hover:from-[#12a150] hover:to-[#097737] text-white border-l border-emerald-400/30 border-t border-emerald-300/40 border-b border-emerald-950 flex items-center justify-center cursor-pointer transition-colors"
                title="Mensagens rápidas prontas (Encaixe, Plantão, OS)"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQuickMsgOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Quick Message Popover Menu */}
            {isQuickMsgOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#12151f] border border-[#2b2e40] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="px-2.5 py-1.5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                    <span>Disparo Rápido</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">1-clique</span>
                </div>

                {QUICK_MESSAGES.map((qm, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleOpenWhatsApp(qm.msg)}
                    className="w-full text-left p-2 rounded-xl hover:bg-white/5 transition-all group/item cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white group-hover/item:text-emerald-300 flex items-center justify-between">
                      <span>{qm.title}</span>
                      <WhatsAppIcon className="w-3 h-3 opacity-60 group-hover/item:opacity-100" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{qm.desc}</p>
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
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-[#0e1422] hover:bg-[#141b2e] text-cyan-300 hover:text-white border border-[#00d2d3]/40 hover:border-[#00d2d3]/70 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
            title={`Editar cadastro de ${p.nome}`}
          >
            <Edit2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>Editar Prestador</span>
          </button>
        )}
      </div>
    </div>
  );
};
