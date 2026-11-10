import React, { useRef, useEffect } from 'react';
import { MainTab } from '../types';
import { Menu, Search, X, Sparkles, MessageSquarePlus, UserPlus, CalendarPlus } from 'lucide-react';
import { DrMonitoraLogo } from './DrMonitoraLogo';

interface HeaderProps {
  mainTab: MainTab;
  onOpenSidebar: () => void;
  onOpenPrimaryCTA: () => void;
  onOpenSecondaryCTA?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalUniversalMatches?: number;
}

export const Header: React.FC<HeaderProps> = ({
  mainTab,
  onOpenSidebar,
  onOpenPrimaryCTA,
  onOpenSecondaryCTA,
  searchQuery,
  onSearchChange,
  totalUniversalMatches,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const metaByTab = {
    prestadores: {
      title: 'Prestadores de Serviços',
      ctaLabel: 'Novo Prestador',
      ctaIcon: UserPlus,
    },
    templates: {
      title: 'Templates OPA Atendimento',
      ctaLabel: 'Novo Template',
      ctaIcon: MessageSquarePlus,
    },
    regras: {
      title: 'Regras, Pontos Fixos & Agendas',
      ctaLabel: 'Novo Item',
      ctaIcon: CalendarPlus,
    },
  }[mainTab];

  const CtaIcon = metaByTab.ctaIcon;

  // Global Ctrl+K / Cmd+K focuses the single search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#090A0F]/90 backdrop-blur-2xl border-b border-[#1e2029] flex items-center justify-between gap-3 sm:gap-6 sticky top-0 z-30 select-none shadow-md relative">
      {/* Top subtle specular reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d2d3]/20 to-transparent pointer-events-none" />

      {/* Left: Sidebar Toggle & Brand Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-300 hover:text-white bg-[#1a1b22] hover:bg-[#23252f] border border-[#2a2b32] transition-all flex items-center gap-2 shadow-xs active:scale-95 group cursor-pointer"
          aria-label="Abrir menu de navegação lateral"
          title="Abrir navegação lateral (Sidebar)"
        >
          <Menu className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
          <span className="text-xs font-semibold hidden sm:inline text-slate-300 group-hover:text-white">
            Menu
          </span>
        </button>

        {/* Official Brand Logo */}
        <div className="flex items-center gap-2">
          <DrMonitoraLogo size="sm" theme="dark" />
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-mono hidden sm:inline-block">
            OPA
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#1e2029] hidden xl:block" />

        <span className="text-xs sm:text-sm font-semibold text-slate-300 tracking-tight truncate hidden xl:block">
          {metaByTab.title}
        </span>
      </div>

      {/* Center: THE ONLY UNIVERSAL SEARCH BAR IN THE APPLICATION */}
      <div className="flex-1 max-w-2xl relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
            <Search className="w-4 h-4 text-cyan-400" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Busca universal (técnico, código, template, KM, regra, ponto fixo)..."
            className="w-full pl-10 pr-24 py-2 bg-[#1a1b22] text-[#e3e1e9] placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-[#2a2b32] hover:border-[#00d2d3]/40 focus:border-[#00d2d3] focus:outline-none transition-all shadow-inner font-sans"
          />

          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-mono font-medium text-slate-300 bg-[#0d0e13] rounded-md border border-[#2a2b32] shadow-xs">
                Ctrl+K
              </kbd>
            )}

            {searchQuery && totalUniversalMatches !== undefined && (
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/40">
                {totalUniversalMatches}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {mainTab === 'templates' && onOpenSecondaryCTA && (
          <button
            type="button"
            onClick={onOpenSecondaryCTA}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a1b22] hover:bg-[#23252f] text-[#e3e1e9] border border-[#2a2b32] text-xs font-medium transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            title="Preencher variáveis dinâmicas em formulário guiado"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preencher Mensagem</span>
          </button>
        )}

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onOpenPrimaryCTA}
          className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-[#00d2d3] hover:bg-[#00e2e3] active:scale-[0.98] text-black font-bold text-xs shadow-xs border border-[#00d2d3] transition-all cursor-pointer whitespace-nowrap"
        >
          <CtaIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{metaByTab.ctaLabel}</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>
    </header>
  );
};
