import React, { useState, useMemo, useEffect } from 'react';
import { TemplateItem } from '../types';
import {
  Copy,
  Check,
  Edit2,
  Trash2,
  Star,
  Search,
  X,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Clock,
  Sun,
  Sunset,
  Moon,
  Sparkle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  GreetingMode,
  getGreetingInfo,
  applyGreetingToText,
} from '../utils/greeting';

interface TemplatesViewProps {
  templates: TemplateItem[];
  onSaveTemplate: (template: TemplateItem) => void;
  onDeleteTemplate: (id: string) => void;
  onResetTemplates: () => void;
  onCopySuccess: (text: string) => void;
  onOpenNewTemplateModal: () => void;
  onOpenEditTemplateModal: (template: TemplateItem) => void;
  onOpenFillerModal: () => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (q: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onResetTemplates,
  onCopySuccess,
  onOpenNewTemplateModal: _onOpenNewTemplateModal,
  onOpenEditTemplateModal,
  onOpenFillerModal,
  globalSearchQuery = '',
  onGlobalSearchChange,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [greetingMode, setGreetingMode] = useState<GreetingMode>('auto');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const searchQuery = globalSearchQuery || localSearch;
  const setSearchQuery = (val: string) => {
    if (onGlobalSearchChange) {
      onGlobalSearchChange(val);
    } else {
      setLocalSearch(val);
    }
  };

  // Keep clock in sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const greetingInfo = useMemo(
    () => getGreetingInfo(greetingMode, currentTime),
    [greetingMode, currentTime]
  );

  const formattedCurrentHour = useMemo(() => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [currentTime]);

  // Distinct known categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) {
      if (t.categoria) set.add(t.categoria.trim());
    }
    return Array.from(set).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [templates]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (showFavoritesOnly && !t.favorito) return false;
      if (selectedCategory && t.categoria !== selectedCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchTitle = t.titulo.toLowerCase().includes(q);
      const matchText = t.texto.toLowerCase().includes(q);
      const matchCategory = t.categoria.toLowerCase().includes(q);
      const matchBadge = t.badge?.toLowerCase().includes(q);

      return matchTitle || matchText || matchCategory || matchBadge;
    });
  }, [templates, searchQuery, selectedCategory, showFavoritesOnly]);

  const handleCopy = (t: TemplateItem, finalFormattedText: string) => {
    navigator.clipboard.writeText(finalFormattedText);
    setCopiedId(t.id);
    onCopySuccess(`Copiado: ${t.titulo}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleToggleFavorite = (t: TemplateItem) => {
    onSaveTemplate({
      ...t,
      favorito: !t.favorito,
    });
  };

  const favoritesCount = templates.filter((t) => t.favorito).length;

  return (
    <div className="space-y-4">
      {/* Streamlined Unified Toolbar with Frosted Glass */}
      <div className="bg-[#0e1424]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
        {/* Top subtle reflection line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        {/* Row 1: Search + Greeting Segmented Control + Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 relative z-10">
          {/* Search Input in Glass */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar em templates, frases ou atalhos..."
              className="w-full pl-10 pr-8 py-2 bg-[#090d16]/80 text-white placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-white/10 hover:border-white/20 focus:border-blue-400/80 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Time-of-Day Greeting Switcher - Glass Dock */}
          <div className="flex items-center gap-1 p-1 bg-[#090d16]/80 backdrop-blur-md border border-white/10 rounded-xl text-xs self-start lg:self-auto shrink-0 overflow-x-auto max-w-full shadow-inner">
            <span className="text-slate-400 px-2 font-medium flex items-center gap-1.5 shrink-0 text-xs">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Saudação:</span>
            </span>

            <button
              type="button"
              onClick={() => setGreetingMode('auto')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                greetingMode === 'auto'
                  ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.4)] border border-blue-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={`Ajuste automático pelo relógio (${formattedCurrentHour})`}
            >
              <Sparkle className="w-3.5 h-3.5 text-blue-200" />
              <span>Auto ({greetingInfo.greeting})</span>
              <span className="font-mono text-xs opacity-80">[{formattedCurrentHour}]</span>
            </button>

            <button
              type="button"
              onClick={() => setGreetingMode('manha')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                greetingMode === 'manha'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-300" />
              <span>Bom dia</span>
            </button>

            <button
              type="button"
              onClick={() => setGreetingMode('tarde')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                greetingMode === 'tarde'
                  ? 'bg-orange-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Sunset className="w-3 h-3 text-orange-300" />
              <span>Boa tarde</span>
            </button>

            <button
              type="button"
              onClick={() => setGreetingMode('noite')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                greetingMode === 'noite'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Moon className="w-3 h-3 text-indigo-300" />
              <span>Boa noite</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto relative z-10">
            {/* Quick Fill Button */}
            <button
              type="button"
              onClick={onOpenFillerModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-b from-[#182236]/80 to-[#101726]/80 hover:from-[#202d48]/80 hover:to-[#141d30]/80 text-slate-200 hover:text-white border border-white/10 transition-all shadow-xs active:scale-[0.98]"
              title="Preencher dados de encaixe com formulário guiado"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Preencher Mensagem</span>
            </button>

            {/* Favorites Toggle */}
            <button
              type="button"
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showFavoritesOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-[#090d16]/70 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title="Filtrar favoritados"
            >
              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="text-xs font-mono">{favoritesCount}</span>
            </button>

            {/* Reset Defaults */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja restaurar os templates padrão originais?')) {
                  onResetTemplates();
                }
              }}
              className="p-2 rounded-xl bg-[#090d16]/70 text-slate-400 border border-white/10 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Restaurar templates padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Chips - Glass Dock */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/10 text-xs relative z-10">
          <span className="text-slate-400 text-xs font-medium mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            Módulos:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 ${
              selectedCategory === null
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white border-t border-blue-300/40 border-b border-blue-900 shadow-[0_3px_10px_rgba(37,99,235,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                : 'bg-[#090d16]/70 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Todos ({templates.length})
          </button>
          {categories.map((cat) => {
            const count = templates.filter((t) => t.categoria === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isActive ? null : cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-[#00d2d3] text-black font-bold shadow-xs'
                    : 'bg-[#1a1b22] hover:bg-[#23252f] text-slate-300 border border-[#2a2b32]'
                }`}
              >
                {cat} <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid with Vercel/Linear dark mode styling */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-12 text-center">
          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">Nenhum template encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Tente outro termo na busca ou limpe o filtro de categoria selecionado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((t) => {
            const isCopied = copiedId === t.id;
            const isEncaixeForm = t.id === 'tpl-dados-encaixe' || t.texto.includes('Placa:');
            const formattedText = applyGreetingToText(t.texto, greetingMode, currentTime);
            const hasGreetingModified = formattedText !== t.texto;

            return (
              <div
                key={t.id}
                className={`relative rounded-2xl p-5 flex flex-col justify-between group transition-all duration-300 ease-out
                  bg-[#13151c]/90 backdrop-blur-2xl
                  border border-[#1e2029] hover:border-[#00d2d3]/50
                  border-t-white/10 hover:border-t-[#00d2d3]/60
                  shadow-[0_12px_32px_-8px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.08)]
                  hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.9),0_0_24px_rgba(0,210,211,0.15)]
                  hover:-translate-y-1.5 overflow-hidden`}
              >
                {/* Top Specular Glass Reflection Line */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d2d3]/30 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  {/* Top: Category Tag + Subtle Badge + Hover Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold font-mono uppercase tracking-wide bg-[#1a1b22] text-[#e3e1e9] border border-[#2a2b32] shadow-xs">
                        {t.categoria}
                      </span>
                      {t.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          {t.badge}
                        </span>
                      )}
                      {hasGreetingModified && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                          title="Saudação ajustada dinamicamente pelo horário"
                        >
                          {greetingInfo.icon}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(t)}
                        title={t.favorito ? 'Remover dos favoritos' : 'Favoritar'}
                        className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                          t.favorito
                            ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                            : 'text-slate-400 hover:text-amber-300 hover:bg-[#1f212a] border border-transparent'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${t.favorito ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEditTemplateModal(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f212a] border border-transparent transition-all active:scale-90"
                        title="Editar template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja excluir o template "${t.titulo}"?`)) {
                            onDeleteTemplate(t.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent transition-all active:scale-90"
                        title="Excluir template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-white tracking-tight mb-2.5 group-hover:text-cyan-300 transition-colors">
                    {t.titulo}
                  </h4>

                  {/* Text Container with Monospace font */}
                  <div
                    onClick={() => handleCopy(t, formattedText)}
                    className="p-3.5 bg-[#0d0e13] hover:border-[#00d2d3]/40 border border-[#1e2029] rounded-xl font-mono text-xs text-[#e3e1e9] whitespace-pre-wrap leading-relaxed cursor-pointer select-all transition-all shadow-inner max-h-44 overflow-y-auto"
                    title="Clique para copiar"
                  >
                    {formattedText}
                  </div>
                </div>

                {/* Footer Copy & Quick Form Fill */}
                <div className="mt-4 pt-3.5 border-t border-[#1e2029] flex items-center gap-2 relative z-10">
                  <button
                    type="button"
                    onClick={() => handleCopy(t, formattedText)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.97] ${
                      isCopied
                        ? 'bg-emerald-600 text-white border border-emerald-400/50'
                        : 'bg-[#1a1b22] hover:bg-[#23252f] text-[#e3e1e9] border border-[#2a2b32] hover:border-[#00d2d3]/40'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>Copiar Frase</span>
                      </>
                    )}
                  </button>

                  {isEncaixeForm && (
                    <button
                      type="button"
                      onClick={onOpenFillerModal}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 transition-all shadow-xs active:scale-[0.97]"
                      title="Preencher campos guiados"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
