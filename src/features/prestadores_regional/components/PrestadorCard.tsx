import React, { useState, useRef, useEffect } from 'react';
import { Prestador } from '../types';
import { Copy, Check, Edit2, Trash2, Phone, Star, MapPin, ChevronDown, MessageSquare } from 'lucide-react';
import { getRegionColor } from '../utils/search';
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
    avatarGrad: 'from-emerald-950/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    badgeBorder: 'border-emerald-500/40',
    badgeGlow: 'hover:border-emerald-500/50',
    pillBg: 'from-emerald-950/40 to-slate-900',
    accentText: 'text-emerald-400',
  },
  amber: {
    radial: 'bg-amber-500',
    avatarGrad: 'from-amber-950/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    badgeBorder: 'border-amber-500/40',
    badgeGlow: 'hover:border-amber-500/50',
    pillBg: 'from-amber-950/40 to-slate-900',
    accentText: 'text-amber-400',
  },
  sky: {
    radial: 'bg-sky-500',
    avatarGrad: 'from-sky-950/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-sky-500/40 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.2)]',
    badgeBorder: 'border-sky-500/40',
    badgeGlow: 'hover:border-sky-500/50',
    pillBg: 'from-sky-950/40 to-slate-900',
    accentText: 'text-sky-400',
  },
  purple: {
    radial: 'bg-purple-500',
    avatarGrad: 'from-purple-950/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    badgeBorder: 'border-purple-500/40',
    badgeGlow: 'hover:border-purple-500/50',
    pillBg: 'from-purple-950/40 to-slate-900',
    accentText: 'text-purple-400',
  },
  rose: {
    radial: 'bg-rose-500',
    avatarGrad: 'from-rose-950/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    badgeBorder: 'border-rose-500/40',
    badgeGlow: 'hover:border-rose-500/50',
    pillBg: 'from-rose-950/40 to-slate-900',
    accentText: 'text-rose-400',
  },
  blue: {
    radial: 'bg-cyan-500',
    avatarGrad: 'from-cyan-950/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,210,211,0.2)]',
    badgeBorder: 'border-cyan-500/40',
    badgeGlow: 'hover:border-cyan-500/50',
    pillBg: 'from-cyan-950/40 to-slate-900',
    accentText: 'text-cyan-400',
  },
  cyan: {
    radial: 'bg-cyan-500',
    avatarGrad: 'from-cyan-950/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,210,211,0.2)]',
    badgeBorder: 'border-cyan-500/40',
    badgeGlow: 'hover:border-cyan-500/50',
    pillBg: 'from-cyan-950/40 to-slate-900',
    accentText: 'text-cyan-400',
  },
  indigo: {
    radial: 'bg-indigo-500',
    avatarGrad: 'from-indigo-950/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]',
    badgeBorder: 'border-indigo-500/40',
    badgeGlow: 'hover:border-indigo-500/50',
    pillBg: 'from-indigo-950/40 to-slate-900',
    accentText: 'text-indigo-400',
  },
  teal: {
    radial: 'bg-teal-500',
    avatarGrad: 'from-teal-950/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.2)]',
    badgeBorder: 'border-teal-500/40',
    badgeGlow: 'hover:border-teal-500/50',
    pillBg: 'from-teal-950/40 to-slate-900',
    accentText: 'text-teal-400',
  },
  slate: {
    radial: 'bg-slate-500',
    avatarGrad: 'from-slate-800/50 via-slate-900 to-slate-950',
    avatarBorder: 'border-slate-700/60 text-slate-300 shadow-sm',
    badgeBorder: 'border-slate-700/60',
    badgeGlow: 'hover:border-slate-600/50',
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
  const { isLeaderAuthenticated, authenticatedProviderId, activeProviderId } = useSchedule();
  const loggedInProvId = authenticatedProviderId || activeProviderId;
  const canManagePrestador = isLeaderAuthenticated || (loggedInProvId ? p.id === loggedInProvId : false);

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
  // COMPACT VIEW (3D Spatial Glass)
  // -------------------------------------------------------------
  if (density === 'compact') {
    return (
      <div
        className={`relative rounded-xl p-3 flex items-center justify-between gap-3 group transition-all duration-300 ease-out
          bg-gradient-to-b from-[#161824]/95 via-[#11131c]/95 to-[#0b0c12]/95 backdrop-blur-xl
          border border-[#1f2230] hover:border-[#00d2d3]/60
          border-t-white/15 border-b-black/80
          shadow-[0_8px_20px_-4px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]
          hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.9),0_0_20px_rgba(0,210,211,0.18)]
          hover:-translate-y-1 ${glowStyles.badgeGlow} overflow-hidden`}
      >
        {/* Specular Edge Highlight Line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d2d3]/40 to-transparent pointer-events-none" />

        <div
          className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl pointer-events-none opacity-10 group-hover:opacity-25 transition-opacity duration-300 ${glowStyles.radial}`}
        />

        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-2.5 min-w-0 relative z-10 flex-1">
          <div
            className={`w-9 h-9 rounded-lg border ${glowStyles.avatarBorder} bg-gradient-to-br ${glowStyles.avatarGrad} flex items-center justify-center font-bold font-mono text-xs shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-white bg-[#0d0e14] px-1.5 py-0.5 rounded border border-[#2b2d3d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                #{p.codigo}
              </span>
              <span
                className={`text-[10px] font-semibold font-mono uppercase px-2 py-0.5 rounded border ${glowStyles.badgeBorder} ${color.bg} ${color.text} backdrop-blur-md shadow-xs truncate`}
              >
                {p.regiao}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors mt-0.5" title={p.nome}>
              {p.nome}
            </h4>
          </div>
        </div>

        {/* Right: Actions in compact 3D row */}
        <div className="flex items-center gap-1.5 shrink-0 relative z-10">
          {p.telefone ? (
            <button
              type="button"
              onClick={handleCopyPhone}
              className={`p-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 active:translate-y-[1px] active:shadow-inner cursor-pointer shadow-sm ${
                copiedId === `phone-${p.id}`
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-[#181a24] hover:bg-[#232534] text-cyan-300 border-[#2b2d3d] border-t-white/10 hover:border-t-cyan-400/40'
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
              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-cyan-950/70 hover:bg-[#00d2d3] text-cyan-300 hover:text-black border border-cyan-800/40 border-t-cyan-400/30 transition-all active:translate-y-[1px] cursor-pointer shadow-sm"
              title="Cadastrar telefone"
            >
              + Tel
            </button>
          )}

          {p.telefone && (
            <button
              type="button"
              onClick={() => handleOpenWhatsApp()}
              className="p-1.5 rounded-lg bg-gradient-to-b from-[#12a150] to-[#087335] hover:from-[#15b259] hover:to-[#0a853e] text-white border-t border-emerald-300/40 border-b border-black shadow-md transition-all active:translate-y-[1px] active:shadow-inner cursor-pointer"
              title="Abrir WhatsApp"
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(p.id)}
                title="Excluir prestador"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
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
  // SPACIOUS VIEW (3D SPATIAL GLASS & TACTILE DEPTH)
  // -------------------------------------------------------------
  return (
    <div
      className={`relative rounded-2xl p-5 flex flex-col justify-between group transition-all duration-300 ease-out
        bg-gradient-to-b from-[#161824]/95 via-[#11131c]/95 to-[#0b0c12]/95 backdrop-blur-2xl
        border border-[#1f2230] hover:border-[#00d2d3]/60
        border-t-white/15 border-b-black/80
        shadow-[0_14px_35px_-8px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)]
        hover:shadow-[0_22px_48px_-10px_rgba(0,0,0,0.95),0_0_30px_rgba(0,210,211,0.2)]
        ${glowStyles.badgeGlow}
        hover:-translate-y-1.5 hover:scale-[1.01] overflow-visible`}
    >
      {/* Ambient Radial Color Glow in top right corner */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-10 group-hover:opacity-30 transition-opacity duration-500 ${glowStyles.radial}`}
      />

      {/* Top Specular Glass Reflection Line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d2d3]/45 to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Top Row: Region & Code + Tactile Action Toolbar */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-mono text-xs font-bold text-[#e3e1e9] bg-[#0c0d14] px-2.5 py-1 rounded-lg border border-[#2b2d3d] border-t-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] shrink-0">
              #{p.codigo}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono uppercase tracking-wide border ${glowStyles.badgeBorder} ${color.bg} ${color.text} shadow-sm backdrop-blur-md truncate`}
            >
              <MapPin className="w-3.5 h-3.5 opacity-80 shrink-0" />
              <span className="truncate">{p.regiao}</span>
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 shrink-0 bg-[#090a0f]/90 p-1 rounded-xl border border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
            <button
              type="button"
              onClick={() => onToggleFavorite(p.id)}
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar prestador'}
              className={`p-1.5 rounded-lg transition-all active:scale-90 cursor-pointer ${
                isFavorite
                  ? 'text-amber-400 bg-amber-500/15 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-[#1f212a] border border-transparent'
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
                  title="Editar prestador (nome, telefone, cor, região)"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/30 transition-all active:scale-90 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  title="Excluir prestador da base"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all active:scale-90 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Body: Avatar + Name + Sunken Phone Dock */}
        <div className="flex items-start gap-3.5 my-2">
          {/* Avatar with colored gradient and 3D border */}
          <div
            className={`w-11 h-11 rounded-xl border ${glowStyles.avatarBorder} bg-gradient-to-br ${glowStyles.avatarGrad} flex items-center justify-center font-bold font-mono text-sm shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200`}
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
              <div className="flex items-center justify-between gap-2 mt-2 p-1.5 px-2 rounded-xl bg-[#090a0f] border border-[#1d1f2b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-[#161822] border border-[#262836] flex items-center justify-center shrink-0 shadow-xs">
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:translate-y-[1px] active:shadow-inner shrink-0 cursor-pointer shadow-xs ${
                    copiedId === `phone-${p.id}`
                      ? 'bg-emerald-600 text-white border border-emerald-400/50'
                      : 'bg-[#181a24] hover:bg-[#222534] text-cyan-300 border border-[#2a2b38] border-t-white/10 hover:border-[#00d2d3]/50'
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
                className="w-full flex items-center justify-between gap-2 mt-2 p-1.5 px-2.5 rounded-xl bg-[#090a0f]/90 hover:bg-[#121624] border border-dashed border-[#282a3d] hover:border-[#00d2d3]/60 text-slate-400 hover:text-cyan-300 transition-all text-xs group/tel cursor-pointer shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"
                title="Cadastrar telefone para este prestador"
              >
                <span className="flex items-center gap-1.5 text-xs italic">
                  <Phone className="w-3 h-3 text-slate-500 group-hover/tel:text-cyan-400" />
                  <span>Sem telefone cadastrado</span>
                </span>
                <span className="font-semibold text-[11px] text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-700/50 group-hover/tel:bg-[#00d2d3] group-hover/tel:text-[#003731] transition-colors">
                  + Adicionar
                </span>
              </button>
            )}

            {/* Observação */}
            {p.observacao && (
              <div className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed bg-[#090a0f] p-2.5 rounded-xl border border-[#1d1f2b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                {p.observacao}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Bottom 3D Actions + WhatsApp Quick Pre-Fill */}
      <div className="mt-4 pt-3.5 border-t border-[#1d1f2b] flex items-center gap-2.5 relative z-10">
        <button
          type="button"
          onClick={handleCopyCard}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 active:translate-y-[1px] active:shadow-inner cursor-pointer shadow-md ${
            copiedId === `card-${p.id}`
              ? 'bg-emerald-600 text-white border border-emerald-400/50'
              : 'bg-gradient-to-b from-[#1c1e2b] to-[#121420] hover:from-[#252839] hover:to-[#161826] text-[#e3e1e9] border border-[#2b2d3e] border-t-white/10 hover:border-[#00d2d3]/50'
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
            <div className="flex rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20">
              {/* Primary Direct WhatsApp Tactile 3D Button */}
              <button
                type="button"
                onClick={() => handleOpenWhatsApp()}
                className="flex-1 py-2.5 px-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-150 active:translate-y-[1px] active:shadow-inner cursor-pointer
                  bg-gradient-to-b from-[#14b259] via-[#0d8e44] to-[#07662e] hover:from-[#17c262] hover:via-[#109e4d] hover:to-[#097737]
                  text-white border-t border-emerald-300/50 border-b-2 border-b-black"
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
                className="px-2 bg-gradient-to-b from-[#0e8f46] to-[#065b29] hover:from-[#12a150] hover:to-[#087335] text-white border-l border-emerald-400/40 border-t border-emerald-300/50 border-b-2 border-b-black flex items-center justify-center cursor-pointer transition-colors"
                title="Mensagens rápidas prontas (Encaixe, Plantão, OS)"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQuickMsgOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Quick Message Popover Menu */}
            {isQuickMsgOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#10121c] border border-[#2b2e42] border-t-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between">
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
                    className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-all group/item cursor-pointer"
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
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-gradient-to-b from-[#101726] to-[#0a0f1b] hover:from-[#162035] hover:to-[#0f1729] text-cyan-300 hover:text-white border border-[#00d2d3]/50 border-t-cyan-400/40 hover:border-[#00d2d3]/80 transition-all active:translate-y-[1px] cursor-pointer shadow-md"
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
