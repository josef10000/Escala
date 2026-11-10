import React from 'react';
import { ViewMode, MainTab } from '../types';
import {
  UserPlus,
  Download,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  List,
  Star,
  Share2,
  Users,
  MessageSquare,
  Plus,
  CalendarCheck,
} from 'lucide-react';
import { DrMonitoraLogo } from './DrMonitoraLogo';

interface NavbarProps {
  mainTab: MainTab;
  onMainTabChange: (tab: MainTab) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenNewModal: () => void;
  onOpenNewTemplateModal: () => void;
  onOpenImportExport: () => void;
  onOpenReset: () => void;
  onOpenShare: () => void;
  onOpenOmniSearch?: () => void;
  totalCount: number;
  templatesCount: number;
  filteredCount: number;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favoritesCount: number;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  prestadoresMatchesCount?: number;
  templatesMatchesCount?: number;
  regrasMatchesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  mainTab,
  onMainTabChange,
  viewMode,
  onViewModeChange,
  onOpenNewModal,
  onOpenNewTemplateModal,
  onOpenImportExport,
  onOpenReset,
  onOpenShare,
  onOpenOmniSearch,
  totalCount,
  templatesCount,
  filteredCount,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  favoritesCount,
  searchQuery = '',
  onSearchChange,
  prestadoresMatchesCount = 0,
  templatesMatchesCount = 0,
  regrasMatchesCount = 0,
}) => {
  const isSearching = searchQuery.trim().length > 0;

  return (
    <header className="border-b border-slate-800 bg-[#0c1220]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Logo & Module Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DrMonitoraLogo size="md" theme="dark" />
              <div className="h-5 w-px bg-slate-800 hidden sm:block" />

              {/* Main Module Switcher with Universal Search Match Counts */}
              <div className="inline-flex p-0.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onMainTabChange('prestadores')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    mainTab === 'prestadores'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Prestadores</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-mono transition-colors ${
                      isSearching
                        ? prestadoresMatchesCount > 0
                          ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                          : 'bg-slate-950/80 text-slate-500'
                        : 'bg-slate-950/60 text-slate-300'
                    }`}
                  >
                    {isSearching ? prestadoresMatchesCount : totalCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onMainTabChange('templates')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    mainTab === 'templates'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Templates OPA</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-mono transition-colors ${
                      isSearching
                        ? templatesMatchesCount > 0
                          ? 'bg-purple-500/30 text-purple-300 font-bold'
                          : 'bg-slate-950/80 text-slate-500'
                        : 'bg-slate-950/60 text-slate-300'
                    }`}
                  >
                    {isSearching ? templatesMatchesCount : templatesCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onMainTabChange('regras')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    mainTab === 'regras'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Regras & Agendas</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                      isSearching
                        ? regrasMatchesCount > 0
                          ? 'bg-amber-500/30 text-amber-300'
                          : 'bg-slate-950/80 text-slate-500'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {isSearching ? regrasMatchesCount : 'Novo'}
                  </span>
                </button>
              </div>
            </div>

            {/* Omni Search Button */}
            {onOpenOmniSearch && (
              <button
                type="button"
                onClick={onOpenOmniSearch}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-medium transition-all group"
                title="Abrir pesquisa universal em todos os módulos"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:animate-ping" />
                <span>Busca Universal 100%</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-xs font-mono text-slate-400">
                  Global
                </span>
              </button>
            )}

            {/* Mobile Share Quick Button */}
            <button
              type="button"
              onClick={onOpenShare}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
            {mainTab === 'prestadores' && (
              <>
                {/* View Switcher Tabs */}
                <div className="inline-flex p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => onViewModeChange('cards')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Visualização em cartões"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cartões</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewModeChange('table')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Visualização em tabela"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Tabela</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewModeChange('terminal')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                      viewMode === 'terminal'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Modo Lista Compacta"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Compacto</span>
                  </button>
                </div>

                {/* Favorites Toggle */}
                <button
                  type="button"
                  onClick={onToggleFavoritesOnly}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    showFavoritesOnly
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                  title="Filtrar favoritos"
                >
                  <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">Favoritos</span>
                  <span className="px-1.5 py-0.5 rounded text-xs bg-slate-800 font-mono text-slate-300">
                    {favoritesCount}
                  </span>
                </button>

                {/* Primary Action: Novo Prestador */}
                <button
                  type="button"
                  onClick={onOpenNewModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Novo Prestador</span>
                </button>
              </>
            )}

            {mainTab === 'templates' && (
              <button
                type="button"
                onClick={onOpenNewTemplateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Template</span>
              </button>
            )}

            {/* Share Button */}
            <button
              type="button"
              onClick={onOpenShare}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="Compartilhar link com a equipe"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Compartilhar</span>
            </button>

            {/* Import / Export */}
            <button
              type="button"
              onClick={onOpenImportExport}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
              title="Importar ou exportar dados (JSON/CSV)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={onOpenReset}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-amber-400 transition-colors"
              title="Restaurar dados padrão de fábrica"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

