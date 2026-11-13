import React, { useState, useRef, useEffect } from 'react';
import { Prestador } from '../types';
import { Copy, Check, Edit2, Trash2, Phone, Star, MapPin, ChevronDown, MessageSquare } from 'lucide-react';
import { getRegionColor, normalizeText } from '../utils/search';
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

// Sophisticated, clean iOS/Enterprise Region styling for PrestadorCard
const getRegionGlassBadge = (region: string) => {
  const norm = normalizeText(region);
  if (norm.startsWith('leste')) {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }
  if (norm.startsWith('oeste')) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  }
  if (norm.startsWith('norte')) {
    return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
  }
  if (norm.startsWith('sul')) {
    return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  }
  if (norm.startsWith('abc')) {
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  }
  return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
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
  const regionBadgeClass = getRegionGlassBadge(p.regiao);

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
  // COMPACT VIEW (Clean Slate / iOS Frosted Glass)
  // -------------------------------------------------------------
  if (density === 'compact') {
    return (
      <div
        className="relative rounded-xl p-3 flex items-center justify-between gap-3 group transition-all duration-200
          bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-md
          border border-slate-800 hover:border-slate-700
          shadow-sm hover:shadow-md"
      >
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-2.5 min-w-0 relative z-10 flex-1">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold font-mono text-xs text-slate-200 shrink-0">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                #{p.codigo}
              </span>
              <span className="text-xs font-semibold text-slate-100 truncate">{p.nome}</span>
              <span className={`text-[10px] font-medium font-mono uppercase px-2 py-0.5 rounded-full border backdrop-blur-sm ${regionBadgeClass}`}>
                {p.regiao}
              </span>
            </div>

            {p.telefone && (
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" />
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
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isFavorite
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCopyCard}
            title="Copiar dados"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(p.id)}
                title="Excluir prestador"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
  // SPACIOUS VIEW (Executive Slate / Refined Glass Theme)
  // -------------------------------------------------------------
  return (
    <div
      className="relative rounded-2xl p-5 flex flex-col justify-between group transition-all duration-200
        bg-slate-900/90 hover:bg-slate-900 backdrop-blur-xl
        border border-slate-800 hover:border-slate-700
        shadow-sm hover:shadow-md overflow-visible"
    >
      <div className="relative z-10">
        {/* Top Row: Region & Code + Action Toolbar */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
              #{p.codigo}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono uppercase tracking-wide border backdrop-blur-md ${regionBadgeClass} truncate`}
            >
              <MapPin className="w-3 h-3 opacity-80 shrink-0" />
              <span className="truncate">{p.regiao}</span>
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 shrink-0 bg-slate-950/70 p-1 rounded-lg border border-slate-800/80">
            <button
              type="button"
              onClick={() => onToggleFavorite(p.id)}
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar prestador'}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isFavorite
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
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
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  title="Excluir prestador"
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Body: Avatar + Name + Phone */}
        <div className="flex items-start gap-3 my-2">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center font-bold font-mono text-xs text-slate-200 shrink-0">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="text-base font-semibold text-slate-100 tracking-tight leading-snug truncate"
              title={p.nome}
            >
              {p.nome}
            </h3>

            {/* Phone Dock */}
            {p.telefone ? (
              <div className="flex items-center justify-between gap-2 mt-2 p-1.5 px-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <a
                    href={`tel:${p.telefone}`}
                    className="text-xs font-mono text-slate-300 hover:text-white transition-colors truncate"
                  >
                    {p.telefone}
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    copiedId === `phone-${p.id}`
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 hover:text-white'
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
                      <Copy className="w-3 h-3 text-slate-400" />
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
                className="w-full flex items-center justify-between gap-2 mt-2 p-1.5 px-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-950 border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs cursor-pointer"
                title="Cadastrar telefone para este prestador"
              >
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="w-3 h-3" />
                  <span>Sem telefone</span>
                </span>
                <span className="font-medium text-[11px] text-cyan-400 hover:underline">
                  + Adicionar
                </span>
              </button>
            )}

            {/* Observação */}
            {p.observacao && (
              <div className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
                {p.observacao}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions + WhatsApp Quick Pre-Fill */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 relative z-10">
        <button
          type="button"
          onClick={handleCopyCard}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
            copiedId === `card-${p.id}`
              ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-white'
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
              <Copy className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>Copiar Dados</span>
            </>
          )}
        </button>

        {p.telefone && cleanPhoneNumber(p.telefone) ? (
          <div className="flex-1 relative" ref={quickMsgRef}>
            <div className="flex rounded-xl overflow-hidden border border-emerald-600/40 bg-emerald-600/20 hover:bg-emerald-600/30 transition-colors">
              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={() => handleOpenWhatsApp()}
                className="flex-1 py-2 px-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-emerald-300 hover:text-emerald-200 cursor-pointer"
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
                className="px-2 border-l border-emerald-600/30 text-emerald-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Mensagens rápidas prontas"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQuickMsgOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Quick Message Popover Menu */}
            {isQuickMsgOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-xl p-2 z-50 animate-in fade-in duration-150 space-y-1">
                <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
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
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition-colors group/item cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-slate-200 group-hover/item:text-emerald-300 flex items-center justify-between">
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
            className="flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
            title={`Editar cadastro de ${p.nome}`}
          >
            <Edit2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>Editar</span>
          </button>
        )}
      </div>
    </div>
  );
};
