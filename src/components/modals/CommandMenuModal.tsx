import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { ActiveModule, Provider, WorkRegime } from '../../types';
import {
  Search,
  X,
  Calendar,
  Users,
  MapPin,
  Activity,
  Coins,
  FileSpreadsheet,
  ShieldCheck,
  Send,
  User,
  ArrowRight,
  Sparkles,
  Command,
} from 'lucide-react';

interface CommandMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewShiftModal?: () => void;
  onOpenLeaderAuth?: () => void;
  onOpenMarketplace?: () => void;
  onOpenExecutiveReportModal?: () => void;
  onOpenWeekendDutyModal?: () => void;
  onOpenProfileModal?: () => void;
}

export const CommandMenuModal: React.FC<CommandMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenNewShiftModal,
  onOpenLeaderAuth,
  onOpenMarketplace,
  onOpenExecutiveReportModal,
  onOpenWeekendDutyModal,
  onOpenProfileModal,
}) => {
  const {
    providers,
    setActiveProviderId,
    setViewMode,
    activeModule,
    setActiveModule,
    activeRegime,
    setActiveRegime,
    isLeaderAuthenticated,
    leaderName,
  } = useSchedule();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation inside list
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Providers
    const matchedProviders = providers
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.role && p.role.toLowerCase().includes(q)))
      .map((p) => ({
        id: `prov-${p.id}`,
        category: 'Atendentes',
        title: p.name,
        subtitle: `Regime ${p.regime || '12x36'} • ${p.role || 'Atendente'}`,
        icon: User,
        action: () => {
          setActiveProviderId(p.id);
          setViewMode('personal-calendar');
          setActiveModule('escala');
          onClose();
        },
      }));

    // 2. Quick Actions
    const quickActions = [
      {
        id: 'act-new-shift',
        category: 'Ações Rápidas',
        title: 'Criar / Editar Plantão',
        subtitle: 'Lançar plantão direto na escala',
        icon: Calendar,
        action: () => {
          onClose();
          onOpenNewShiftModal?.();
        },
      },
      {
        id: 'act-marketplace',
        category: 'Ações Rápidas',
        title: 'Mural de Plantões PJ (Venda & Repasse)',
        subtitle: 'Visualizar ou anunciar plantões disponíveis',
        icon: Coins,
        action: () => {
          onClose();
          onOpenMarketplace?.();
        },
      },
      {
        id: 'act-exec-report',
        category: 'Ações Rápidas',
        title: 'Relatório Executivo Mensal para RH',
        subtitle: 'Auditoria de horas, adicionais e fechamento',
        icon: FileSpreadsheet,
        action: () => {
          onClose();
          onOpenExecutiveReportModal?.();
        },
      },
      {
        id: 'act-weekend',
        category: 'Ações Rápidas',
        title: 'Plantão de Fim de Semana (WhatsApp)',
        subtitle: 'Gerar mensagem formatada para o grupo oficial',
        icon: Send,
        action: () => {
          onClose();
          onOpenWeekendDutyModal?.();
        },
      },
      {
        id: 'act-profile',
        category: 'Ações Rápidas',
        title: isLeaderAuthenticated ? 'Meu Perfil de Líder & Cadastrar Atendente' : 'Meu Perfil Pessoal',
        subtitle: isLeaderAuthenticated
          ? 'Gerenciar equipe e seus dados de gestor'
          : 'Telefone, WhatsApp e senha de 4 dígitos',
        icon: isLeaderAuthenticated ? ShieldCheck : User,
        action: () => {
          onClose();
          onOpenProfileModal?.();
        },
      },
    ].filter((a) => !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q));

    // 3. Modules & Regimes
    const navModules = [
      {
        id: 'nav-quadro-12x36',
        category: 'Navegação & Escalas',
        title: 'Escala 12x36 (Quadro Geral)',
        subtitle: 'Plantões de 12 horas (Turma A e Turma B)',
        icon: Calendar,
        action: () => {
          setActiveModule('escala');
          setViewMode('escala');
          setActiveRegime('12x36');
          onClose();
        },
      },
      {
        id: 'nav-quadro-5x2',
        category: 'Navegação & Escalas',
        title: 'Escala 5x2 (Segunda a Sexta)',
        subtitle: 'Equipes técnicas e administrativas',
        icon: Calendar,
        action: () => {
          setActiveModule('escala');
          setViewMode('escala');
          setActiveRegime('5x2');
          onClose();
        },
      },
      {
        id: 'nav-quadro-fds',
        category: 'Navegação & Escalas',
        title: 'Escala de Fim de Semana',
        subtitle: 'Plantões de Sábado e Domingo',
        icon: Calendar,
        action: () => {
          setActiveModule('escala');
          setViewMode('escala');
          setActiveRegime('weekend');
          onClose();
        },
      },
      {
        id: 'nav-prestadores',
        category: 'Navegação & Escalas',
        title: 'Técnicos & CEPs Regionais',
        subtitle: 'Mapeamento de prestadores por cidade e CEP',
        icon: Users,
        action: () => {
          setActiveModule('prestadores_regional');
          onClose();
        },
      },
      {
        id: 'nav-pontos-fixos',
        category: 'Navegação & Escalas',
        title: 'Pontos Fixos & Agendas',
        subtitle: 'Horários e regras operacionais fixas',
        icon: MapPin,
        action: () => {
          setActiveModule('pontos_fixos');
          onClose();
        },
      },
      {
        id: 'nav-central-op',
        category: 'Navegação & Escalas',
        title: 'Central Operacional & Inteligência',
        subtitle: 'Painel com mapa de plantonistas e telemetria',
        icon: Activity,
        action: () => {
          setActiveModule('central_inteligencia');
          onClose();
        },
      },
    ].filter((m) => !q || m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q));

    return [...quickActions, ...matchedProviders, ...navModules];
  }, [
    query,
    providers,
    isLeaderAuthenticated,
    onOpenNewShiftModal,
    onOpenMarketplace,
    onOpenExecutiveReportModal,
    onOpenWeekendDutyModal,
    onOpenProfileModal,
    setActiveProviderId,
    setViewMode,
    setActiveModule,
    setActiveRegime,
    onClose,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle arrow keys and enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) item.action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0e1017] border border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col cursor-default backdrop-blur-2xl"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.08] flex items-center gap-3 bg-white/[0.02]">
          <Search className="w-5 h-5 text-[#00d2d3] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar atendente, plantão, módulo ou relatório..."
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-400 bg-white/[0.06] border border-white/10 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-white/[0.08] text-white' : 'text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[#00d2d3]/20 border-[#00d2d3]/40 text-[#00d2d3]'
                          : 'bg-white/[0.04] border-white/[0.07] text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.category === 'Atendentes' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/[0.06] text-zinc-400">
                            Atendente
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-[#00d2d3] translate-x-0.5' : 'text-zinc-600 opacity-0'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Bar Info */}
        <div className="px-4 py-2.5 border-t border-white/[0.08] bg-white/[0.01] flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 text-[9px] font-mono bg-white/[0.06] rounded border border-white/10">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.2 text-[9px] font-mono bg-white/[0.06] rounded border border-white/10">
                ↓
              </kbd>
              <span className="ml-1">navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 text-[9px] font-mono bg-white/[0.06] rounded border border-white/10">
                ↵
              </kbd>
              <span className="ml-1">selecionar</span>
            </span>
          </div>

          <span className="text-[10px] text-zinc-500">OminiHub • Busca Rápida</span>
        </div>
      </div>
    </div>
  );
};
