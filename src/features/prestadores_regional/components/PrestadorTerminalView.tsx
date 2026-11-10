import React, { useState, useEffect, useRef } from 'react';
import { Prestador } from '../types';
import { Copy, Check, Edit2, Trash2, Phone, Star, MapPin, Hash } from 'lucide-react';
import { normalizeText, getRegionColor } from '../utils/search';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getWhatsAppUrl, cleanPhoneNumber, openWhatsApp, WHATSAPP_TAB_NAME } from '../utils/whatsapp';

interface PrestadorTerminalViewProps {
  prestadores: Prestador[];
  searchQuery: string;
  onEdit: (prestador: Prestador) => void;
  onDelete: (id: string) => void;
  onCopySuccess: (text: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const PrestadorTerminalView: React.FC<PrestadorTerminalViewProps> = ({
  prestadores,
  searchQuery,
  onEdit,
  onDelete,
  onCopySuccess,
  favorites,
  onToggleFavorite,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedIndex >= prestadores.length) {
      setSelectedIndex(Math.max(0, prestadores.length - 1));
    }
  }, [prestadores.length, selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, prestadores.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        const selected = prestadores[selectedIndex];
        if (selected) {
          e.preventDefault();
          handleCopyLine(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prestadores, selectedIndex]);

  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleCopyLine = (p: Prestador) => {
    const text = `${p.codigo} - ${p.nome} - ${p.regiao}`;
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    onCopySuccess(`Copiado: ${text}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const tokens = searchQuery
      .trim()
      .split(/\s+/)
      .map(t => normalizeText(t))
      .filter(t => t.length > 0);

    if (tokens.length === 0) return text;

    const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = tokens.includes(normalizeText(part));
      return isMatch ? (
        <mark
          key={i}
          className="bg-yellow-400 text-slate-950 font-bold px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  if (prestadores.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-sm">
        <p className="text-base font-bold text-white">Nenhum prestador encontrado</p>
        <p className="text-sm text-slate-400 mt-1">Ajuste os filtros de pesquisa para visualizar os prestadores.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col backdrop-blur-sm">
      {/* Header bar */}
      <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 select-none">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>LISTA COMPACTA ({prestadores.length} prestadores)</span>
          <span className="text-slate-400 hidden md:inline font-normal">
            • Navegue com ↑ ↓ e pressione Enter para copiar
          </span>
        </div>
        <div className="text-slate-400 text-xs font-mono">
          Item <strong className="text-blue-400">{selectedIndex + 1}</strong> de {prestadores.length}
        </div>
      </div>

      {/* List items with modern compact layout */}
      <div
        ref={containerRef}
        className="max-h-[600px] overflow-y-auto divide-y divide-slate-800/60 select-none scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {prestadores.map((prestador, idx) => {
          const isSelected = selectedIndex === idx;
          const isCopied = copiedId === prestador.id;
          const isFav = favorites.includes(prestador.id);
          const color = getRegionColor(prestador.regiao);

          return (
            <div
              key={prestador.id}
              data-selected={isSelected}
              onClick={() => setSelectedIndex(idx)}
              onDoubleClick={() => handleCopyLine(prestador)}
              className={`group relative flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-slate-800/50 border-l-2 border-blue-400 text-white'
                  : 'hover:bg-slate-800/30 text-slate-200 border-l-2 border-transparent'
              }`}
            >
              {/* Prestador Info */}
              <div className="flex items-center gap-2.5 overflow-hidden pr-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(prestador.id);
                  }}
                  title={isFav ? 'Remover favorito' : 'Favoritar'}
                  className={`p-1 rounded transition-colors ${
                    isFav
                      ? 'text-amber-400'
                      : 'text-slate-600 hover:text-slate-300'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                </button>

                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs font-semibold shrink-0">
                  <Hash className="w-2.5 h-2.5 text-slate-500" />
                  <span>{highlightMatch(prestador.codigo)}</span>
                </div>

                <div className="truncate font-medium text-xs tracking-tight uppercase">
                  {highlightMatch(prestador.nome)}
                </div>

                <div
                  className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium font-mono uppercase tracking-wide shrink-0 border ${color.bg} ${color.text} ${color.border}`}
                >
                  <MapPin className="w-3 h-3 opacity-75" />
                  <span>{highlightMatch(prestador.regiao)}</span>
                </div>

                {prestador.telefone && (
                  <a
                    href={getWhatsAppUrl(prestador.telefone, prestador.nome, prestador.codigo)}
                    target={WHATSAPP_TAB_NAME}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      openWhatsApp(prestador.telefone!, prestador.nome, prestador.codigo);
                    }}
                    className="hidden lg:inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-emerald-400 hover:underline cursor-pointer"
                    title="Conversar no WhatsApp (mesma aba)"
                  >
                    <WhatsAppIcon className="w-3 h-3 text-emerald-500" />
                    <span>{prestador.telefone}</span>
                  </a>
                )}
              </div>

              {/* Action buttons */}
              <div className="shrink-0 flex items-center gap-1.5">
                {prestador.telefone && cleanPhoneNumber(prestador.telefone) && (
                  <a
                    href={getWhatsAppUrl(prestador.telefone, prestador.nome, prestador.codigo)}
                    target={WHATSAPP_TAB_NAME}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      openWhatsApp(prestador.telefone!, prestador.nome, prestador.codigo);
                    }}
                    className="p-1 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-400 border border-slate-700/60 transition-colors flex items-center justify-center cursor-pointer"
                    title={`Abrir WhatsApp com ${prestador.nome} (mesma aba)`}
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLine(prestador);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span className="hidden sm:inline">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span className="hidden sm:inline">Copiar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(prestador);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Editar prestador"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(prestador.id);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Excluir prestador"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer bar */}
      <div className="bg-slate-950/80 px-5 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Total de <strong className="text-white">{prestadores.length}</strong> prestadores listados
        </div>
        <div className="text-slate-400 text-xs">
          dr.monitora® • Gestão de Frotas e Prestadores
        </div>
      </div>
    </div>
  );
};
