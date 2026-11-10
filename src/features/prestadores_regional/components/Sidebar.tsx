import React, { useEffect } from 'react';
import { MainTab } from '../types';
import {
  Users,
  MessageSquare,
  CalendarCheck,
  Star,
  Download,
  Share2,
  RotateCcw,
  X,
  ChevronLeft,
  MapPin,
  Clock,
  Calendar,
} from 'lucide-react';
import { DrMonitoraLogo } from './DrMonitoraLogo';

interface SidebarProps {
  mainTab: MainTab;
  onMainTabChange: (tab: MainTab) => void;
  isOpen: boolean;
  onClose: () => void;
  totalPrestadores: number;
  totalTemplates: number;
  totalRegrasAgendas: number;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favoritesCount: number;
  onOpenImportExport: () => void;
  onOpenShare: () => void;
  onOpenReset: () => void;
  selectedRegion?: string | null;
  onSelectRegion?: (region: string | null) => void;
  onNavigateToEscala?: () => void;
}

const QUICK_REGIONS = [
  { label: 'Todas', val: null },
  { label: 'Leste', val: 'LESTE 1' },
  { label: 'Oeste', val: 'OESTE 1' },
  { label: 'Norte', val: 'NORTE 1' },
  { label: 'Sul', val: 'SUL 1' },
  { label: 'Campinas', val: 'CAMPINAS 1' },
  { label: 'Sorocaba', val: 'SOROCABA' },
  { label: 'ABC', val: 'ABC 1' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  mainTab,
  onMainTabChange,
  isOpen,
  onClose,
  totalPrestadores,
  totalTemplates,
  totalRegrasAgendas,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  favoritesCount,
  onOpenImportExport,
  onOpenShare,
  onOpenReset,
  selectedRegion,
  onSelectRegion,
  onNavigateToEscala,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems = [
    {
      id: 'prestadores' as MainTab,
      label: 'Prestadores',
      subtitle: 'Técnicos & Regiões',
      icon: Users,
      count: totalPrestadores,
    },
    {
      id: 'regras' as MainTab,
      label: 'Regras & Agendas',
      subtitle: 'Pontos Fixos & KM',
      icon: CalendarCheck,
      count: totalRegrasAgendas,
    },
  ];

  return (
    <>
      {/* Retractable Backdrop (Works on all screen sizes when sidebar is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 
        Retractable Sidebar:
        - Never permanently open on desktop or mobile.
        - Slides out smoothly when requested and retracts cleanly.
        - Fixed Logo Header at the top (does not move).
        - 100% same system color (#080d16) with frosted glass.
      */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 h-screen bg-[#090A0F]/95 backdrop-blur-2xl border-r border-[#1e2029] flex flex-col overflow-hidden transition-transform duration-300 ease-out select-none shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 1. FIXED LOGO HEADER */}
        <div className="shrink-0 h-16 px-4 border-b border-[#1e2029] bg-[#090A0F]/90 backdrop-blur-md flex items-center justify-between z-10 relative">
          {/* Top subtle specular reflection line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d2d3]/20 to-transparent pointer-events-none" />

          <div className="flex items-center gap-2">
            <DrMonitoraLogo size="sm" theme="dark" />
            <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-mono">
              OPA
            </span>
          </div>

          {/* Universal Close / Retract Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 px-2 rounded-xl text-slate-400 hover:text-white bg-[#1a1b22] hover:bg-[#23252f] border border-[#2a2b32] transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
            aria-label="Recolher menu lateral"
            title="Recolher navegação (Esc)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[11px] font-medium hidden sm:inline">Recolher</span>
          </button>
        </div>

        {/* 2. SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5 bg-transparent">
          {/* Navigation Section */}
          <div className="space-y-1.5">
            <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navegação
            </div>

            {onNavigateToEscala && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToEscala();
                  onClose();
                }}
                className="w-full mb-2 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs bg-[#13151c] hover:bg-[#1a1b22] border border-[#1e2029] hover:border-[#00d2d3]/40 text-[#e3e1e9] font-medium transition-all group shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="text-left truncate">
                    <div className="font-semibold text-white truncate">Escala & Plantões</div>
                    <div className="text-[11px] text-cyan-300/80 truncate">Quadro Geral e Trocas</div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-500/30">
                  Voltar
                </span>
              </button>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = mainTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onMainTabChange(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-200 group relative overflow-hidden cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-[#00d2d3]/50 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-[#13151c] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 relative z-10">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <div className="text-left truncate">
                      <div className="leading-snug truncate">{item.label}</div>
                      <div
                        className={`text-xs leading-tight truncate ${
                          isActive ? 'text-blue-200/80' : 'text-slate-500 group-hover:text-slate-400'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-mono shrink-0 transition-all relative z-10 ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs border border-blue-400/30'
                        : 'bg-[#0e1424]/90 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Filter: Favoritos */}
          <div className="pt-2 border-t border-white/10 space-y-1">
            <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Filtro
            </div>

            <button
              type="button"
              onClick={() => {
                onToggleFavoritesOnly();
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                showFavoritesOnly
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shadow-[0_4px_14px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star
                  className={`w-3.5 h-3.5 ${
                    showFavoritesOnly ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                  }`}
                />
                <span>Favoritos</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-mono ${
                  showFavoritesOnly
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                    : 'bg-[#0e1424]/90 text-slate-500 border border-slate-800'
                }`}
              >
                {favoritesCount}
              </span>
            </button>
          </div>

          {/* Quick Regions Shortcut */}
          {onSelectRegion && (
            <div className="pt-2.5 border-t border-white/10 space-y-1.5">
              <div className="px-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Regiões Rápidas
                </span>
                {selectedRegion && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRegion(null);
                      onClose();
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                {QUICK_REGIONS.map((chip) => {
                  const isActive =
                    (chip.val === null && !selectedRegion) ||
                    selectedRegion === chip.val;

                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        onSelectRegion(chip.val);
                        onClose();
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs text-left truncate transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600/30 text-blue-200 border border-blue-400/50 font-semibold shadow-[0_2px_8px_rgba(37,99,235,0.3)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 bg-[#0e1424]/60 border border-white/5'
                      }`}
                      title={chip.label}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Diretrizes Operacionais Dr. Monitora - Frosted Glass Container */}
          <div className="pt-2.5 border-t border-white/10">
            <div className="p-3 rounded-xl bg-gradient-to-b from-[#0f172a]/60 to-[#0b101c]/60 backdrop-blur-md border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)] space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
                <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Horários & Diretrizes</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 leading-snug">
                <div>• Seg–Sex 08h–18h | Sáb 08h–12h</div>
                <div>• Hora Fixa: Contratação R$ 100,00</div>
                <div>• Encaixe: Cliente ciente e no local</div>
              </div>
            </div>
          </div>

          {/* Utility Actions */}
          <div className="pt-2.5 border-t border-white/10 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onOpenImportExport();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Importar / Exportar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenShare();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Compartilhar Painel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenReset();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Restaurar Padrões</span>
            </button>
          </div>

          {/* Retract Button at the Bottom */}
          <div className="pt-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              <span>Recolher Barra Lateral</span>
            </button>
          </div>

          {/* System Status */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
              <span className="text-slate-400 font-medium">Painel Ativo</span>
            </div>
            <span className="font-mono text-xs text-slate-500">v2.4 OPA</span>
          </div>
        </div>
      </aside>
    </>
  );
};
