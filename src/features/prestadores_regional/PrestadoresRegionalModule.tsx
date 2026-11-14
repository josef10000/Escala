/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, X, Plus, Clock, Keyboard } from 'lucide-react';
import {
  Prestador,
  ViewMode,
  MainTab,
  TemplateItem,
  PontoFixoItem,
  AgendaRegiaoItem,
  RegraOperacionalItem,
} from './types';
import { INITIAL_PRESTADORES } from './data/defaultPrestadores';
import {
  getStoredPrestadores,
  savePrestadores,
  resetPrestadoresToDefault,
  getFavoriteIds,
  saveFavoriteIds,
  getStoredTemplates,
  saveTemplates,
  resetTemplatesToDefault,
  getStoredPontosFixos,
  savePontosFixos,
  getStoredAgendas,
  saveAgendas,
  getStoredRegras,
  saveRegras,
  resetAllRegrasAgendasToDefault,
} from './utils/storage';
import { filterPrestadores, searchUniversalAll, getRegionColor } from './utils/search';
import { exportPrestadoresToCSV } from './utils/csvExport';
import { getPontoFixoStatus } from './utils/pontoFixoSchedule';

import { UnifiedToolbar, PhoneFilterType } from './components/UnifiedToolbar';
import { PrestadorTerminalView } from './components/PrestadorTerminalView';
import { PrestadorCardsView } from './components/PrestadorCardsView';
import { PrestadorTableView } from './components/PrestadorTableView';
import { PrestadorModal } from './components/PrestadorModal';
import { ImportExportModal } from './components/ImportExportModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';
import { TemplatesView } from './components/TemplatesView';
import { TemplateModal } from './components/TemplateModal';
import { TemplateFormFillerModal } from './components/TemplateFormFillerModal';
import { RegrasAgendasView } from './components/RegrasAgendasView';
import { UniversalOmniModal } from './components/UniversalOmniModal';
import { PontoFixoModal } from './components/PontoFixoModal';
import { SearchAccordionFeed } from './components/SearchAccordionFeed';

export interface PrestadoresRegionalModuleProps {
  initialTab?: MainTab;
  onNavigateToEscala?: () => void;
  onTabChange?: (tab: MainTab) => void;
}

export function PrestadoresRegionalModule({
  initialTab = 'prestadores',
  onNavigateToEscala,
  onTabChange,
}: PrestadoresRegionalModuleProps) {
  const [mainTab, setMainTabState] = useState<MainTab>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== mainTab) {
      setMainTabState(initialTab);
    }
  }, [initialTab]);

  const setMainTab = (tab: MainTab) => {
    setMainTabState(tab);
    onTabChange?.(tab);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Core Data
  const [prestadores, setPrestadores] = useState<Prestador[]>(() => getStoredPrestadores());
  const [templates, setTemplates] = useState<TemplateItem[]>(() => getStoredTemplates());
  const [pontosFixos, setPontosFixos] = useState<PontoFixoItem[]>(() => getStoredPontosFixos());
  const [agendas, setAgendas] = useState<AgendaRegiaoItem[]>(() => getStoredAgendas());
  const [regras, setRegras] = useState<RegraOperacionalItem[]>(() => getStoredRegras());

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [phoneFilter, setPhoneFilter] = useState<PhoneFilterType>('all');
  const [cardDensity, setCardDensity] = useState<'spacious' | 'compact'>(() => {
    try {
      return (localStorage.getItem('prestadores_card_density') as 'spacious' | 'compact') || 'spacious';
    } catch {
      return 'spacious';
    }
  });
  const [recentConsults, setRecentConsults] = useState<Prestador[]>(() => {
    try {
      const raw = localStorage.getItem('prestadores_recent_consults');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [favorites, setFavorites] = useState<string[]>(() => getFavoriteIds());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const handleCardDensityChange = (density: 'spacious' | 'compact') => {
    setCardDensity(density);
    try {
      localStorage.setItem('prestadores_card_density', density);
    } catch {}
  };

  const handleRecordRecent = useCallback((prestador: Prestador) => {
    setRecentConsults((prev) => {
      const filtered = prev.filter((p) => p.id !== prestador.id);
      const updated = [prestador, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('prestadores_recent_consults', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleClearRecent = () => {
    setRecentConsults([]);
    try {
      localStorage.removeItem('prestadores_recent_consults');
    } catch {}
  };

  // Modals & Notifications
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrestador, setEditingPrestador] = useState<Prestador | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [isFillerModalOpen, setIsFillerModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOmniModalOpen, setIsOmniModalOpen] = useState(false);
  const [isPontoFixoModalOpen, setIsPontoFixoModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [focusSearchSignal, setFocusSearchSignal] = useState(0);

  const sharedUrl =
    typeof window !== 'undefined'
      ? window.location.href.replace('ais-dev-', 'ais-pre-')
      : 'https://ais-pre-42jptb5qp5pyoh3u7jrqpn-171385671542.us-east1.run.app';

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard shortcuts: Cmd+K / Ctrl+K, Alt+N, Alt+P, Alt+R, Alt+E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (mainTab === 'prestadores') {
          setEditingPrestador(null);
          setIsModalOpen(true);
        } else {
          setIsPontoFixoModalOpen(true);
        }
      }
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setMainTab('prestadores');
      }
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setMainTab('regras');
      }
      if (e.altKey && e.key.toLowerCase() === 'e') {
        if (onNavigateToEscala) {
          e.preventDefault();
          onNavigateToEscala();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mainTab, onNavigateToEscala]);

  // Sync Prestadores to LocalStorage
  const updatePrestadoresList = (newList: Prestador[]) => {
    setPrestadores(newList);
    savePrestadores(newList);
  };

  // Sync Templates to LocalStorage
  const updateTemplatesList = (newList: TemplateItem[]) => {
    setTemplates(newList);
    saveTemplates(newList);
  };

  // Sync Pontos Fixos
  const handleSavePontoFixo = (item: PontoFixoItem) => {
    const exists = pontosFixos.some((p) => p.id === item.id);
    let updated: PontoFixoItem[];
    if (exists) {
      updated = pontosFixos.map((p) => (p.id === item.id ? item : p));
      showToast(`Ponto Fixo "${item.nome}" atualizado.`);
    } else {
      updated = [item, ...pontosFixos];
      showToast(`Ponto Fixo "${item.nome}" cadastrado.`);
    }
    setPontosFixos(updated);
    savePontosFixos(updated);
  };

  const handleDeletePontoFixo = (id: string) => {
    const updated = pontosFixos.filter((p) => p.id !== id);
    setPontosFixos(updated);
    savePontosFixos(updated);
    showToast('Ponto Fixo removido com sucesso.');
  };

  // Sync Agendas
  const handleSaveAgenda = (item: AgendaRegiaoItem) => {
    const exists = agendas.some((a) => a.id === item.id);
    let updated: AgendaRegiaoItem[];
    if (exists) {
      updated = agendas.map((a) => (a.id === item.id ? item : a));
      showToast(`Agenda de "${item.regiao}" atualizada.`);
    } else {
      updated = [item, ...agendas];
      showToast(`Nova Agenda de "${item.regiao}" cadastrada.`);
    }
    setAgendas(updated);
    saveAgendas(updated);
  };

  const handleDeleteAgenda = (id: string) => {
    const updated = agendas.filter((a) => a.id !== id);
    setAgendas(updated);
    saveAgendas(updated);
    showToast('Agenda regional removida com sucesso.');
  };

  // Sync Regras
  const handleSaveRegra = (item: RegraOperacionalItem) => {
    const exists = regras.some((r) => r.id === item.id);
    let updated: RegraOperacionalItem[];
    if (exists) {
      updated = regras.map((r) => (r.id === item.id ? item : r));
      showToast(`Regra "${item.titulo}" atualizada.`);
    } else {
      updated = [item, ...regras];
      showToast(`Nova Regra "${item.titulo}" cadastrada.`);
    }
    setRegras(updated);
    saveRegras(updated);
  };

  const handleDeleteRegra = (id: string) => {
    const updated = regras.filter((r) => r.id !== id);
    setRegras(updated);
    saveRegras(updated);
    showToast('Regra operacional removida com sucesso.');
  };

  const handleResetRegrasAgendas = () => {
    const restored = resetAllRegrasAgendasToDefault();
    setPontosFixos(restored.pontosFixos);
    setAgendas(restored.agendas);
    setRegras(restored.regras);
    showToast('Regras, Agendas e Pontos Fixos restaurados.');
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      saveFavoriteIds(next);
      return next;
    });
  };

  // Distinct known regions and counts for Prestadores
  const regionStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of prestadores) {
      const reg = p.regiao.trim().toUpperCase();
      map.set(reg, (map.get(reg) || 0) + 1);
    }
    const list = Array.from(map.entries()).map(([regiao, count]) => ({
      regiao,
      count,
    }));
    list.sort((a, b) => a.regiao.localeCompare(b.regiao));
    return list;
  }, [prestadores]);

  const knownRegions = useMemo(() => regionStats.map((r) => r.regiao), [regionStats]);

  // Distinct template categories
  const knownTemplateCategories = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) {
      if (t.categoria) set.add(t.categoria.trim());
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [templates]);

  // 100% Universal Cross-Module Search Engine
  const universalResults = useMemo(() => {
    return searchUniversalAll(searchQuery, {
      prestadores,
      templates,
      pontosFixos,
      agendas,
      regras,
    });
  }, [searchQuery, prestadores, templates, pontosFixos, agendas, regras]);

  // Count of currently open physical bases (Pontos Fixos) in real-time
  const openBasesCount = useMemo(() => {
    return pontosFixos.filter((pf) => getPontoFixoStatus(pf).isOpen).length;
  }, [pontosFixos]);

  // Count of prestadores without phone for quick sanitation
  const pendingPhoneCount = useMemo(() => {
    return prestadores.filter((p) => !p.telefone || !p.telefone.trim()).length;
  }, [prestadores]);

  // Filtered Prestadores for the Prestadores view
  const filteredPrestadores = useMemo(() => {
    let base = prestadores;
    if (showFavoritesOnly) {
      base = base.filter((p) => favorites.includes(p.id));
    }
    // Phone sanitization filter
    if (phoneFilter === 'with') {
      base = base.filter((p) => !!p.telefone && p.telefone.trim().length > 0);
    } else if (phoneFilter === 'without') {
      base = base.filter((p) => !p.telefone || p.telefone.trim().length === 0);
    }
    // Color palette filter
    if (selectedColor) {
      base = base.filter((p) => {
        const itemColor = p.cor ? p.cor.toLowerCase() : getRegionColor(p.regiao).glow;
        return itemColor === selectedColor.toLowerCase();
      });
    }
    return filterPrestadores(base, searchQuery, selectedRegion);
  }, [prestadores, searchQuery, selectedRegion, showFavoritesOnly, favorites, phoneFilter, selectedColor]);

  const handleExportCSV = () => {
    if (filteredPrestadores.length === 0) {
      showToast('Nenhum prestador para exportar com os filtros atuais.');
      return;
    }
    exportPrestadoresToCSV(filteredPrestadores);
    showToast(`${filteredPrestadores.length} prestadores exportados para CSV!`);
  };

  // Prestadores CRUD Handlers
  const handleSavePrestador = (prestador: Prestador) => {
    if (editingPrestador) {
      const updated = prestadores.map((p) => (p.id === prestador.id ? prestador : p));
      updatePrestadoresList(updated);
      showToast(`Prestador ${prestador.nome} atualizado.`);
    } else {
      const updated = [prestador, ...prestadores];
      updatePrestadoresList(updated);
      showToast(`Prestador ${prestador.nome} cadastrado com sucesso.`);
    }
    setEditingPrestador(null);
  };

  const handleDeletePrestador = (id: string) => {
    const target = prestadores.find((p) => p.id === id);
    if (!target) return;
    if (window.confirm(`Tem certeza que deseja remover o prestador ${target.nome}?`)) {
      const updated = prestadores.filter((p) => p.id !== id);
      updatePrestadoresList(updated);
      showToast(`Prestador removido.`);
    }
  };

  // Templates CRUD Handlers
  const handleSaveTemplate = (template: TemplateItem) => {
    const exists = templates.some((t) => t.id === template.id);
    if (exists) {
      const updated = templates.map((t) => (t.id === template.id ? template : t));
      updateTemplatesList(updated);
      showToast(`Template "${template.titulo}" atualizado.`);
    } else {
      const updated = [template, ...templates];
      updateTemplatesList(updated);
      showToast(`Novo template "${template.titulo}" criado.`);
    }
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    updateTemplatesList(updated);
    showToast('Template removido com sucesso.');
  };

  const handleResetTemplates = () => {
    const restored = resetTemplatesToDefault();
    setTemplates(restored);
    showToast(`Restaurados ${restored.length} templates originais.`);
  };

  const handleImportPrestadores = (imported: Prestador[]) => {
    const existingCodes = new Set(prestadores.map((p) => p.codigo.trim()));
    const newItems = imported.filter((item) => !existingCodes.has(item.codigo.trim()));
    const merged = [...prestadores, ...newItems];
    updatePrestadoresList(merged);
    showToast(`${newItems.length} novos prestadores adicionados.`);
  };

  const handleResetConfirm = () => {
    const restored = resetPrestadoresToDefault();
    setPrestadores(restored);
    setSearchQuery('');
    setSelectedRegion(null);
    setShowFavoritesOnly(false);
    showToast(`Base restaurada com ${restored.length} prestadores originais.`);
  };

  const regrasAgendasCount =
    universalResults.pontosFixosMatches.length +
    universalResults.agendasMatches.length +
    universalResults.regrasMatches.length;

  const totalRegrasAgendas = pontosFixos.length + agendas.length + regras.length;

  // Header Primary Action Dispatcher
  const handlePrimaryCTA = () => {
    if (mainTab === 'prestadores') {
      setEditingPrestador(null);
      setIsModalOpen(true);
    } else {
      setIsPontoFixoModalOpen(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#090A0F] text-[#e3e1e9] font-sans relative overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
      {/* Ambient Aurora Glow Background for True Glassmorphism */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Soft Escala Cyan Aurora Blob Top-Left */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00d2d3]/8 blur-[140px]" />
        {/* Deep Cyan/Teal Aurora Top-Right */}
        <div className="absolute top-1/6 -right-20 w-[32rem] h-[32rem] rounded-full bg-cyan-500/6 blur-[160px]" />
      </div>

      {/* Hero Header with Integrated Search, Live Open Bases Indicator & Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#1e2029] relative z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {mainTab === 'prestadores' ? 'Prestadores de Serviços' : 'Regras, Pontos Fixos & Agendas'}
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-950/60 text-[#00d2d3] border border-[#00d2d3]/30 uppercase">
              dr.monitora® OPA
            </span>
            {/* Real-time Open Bases Status Indicator */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-xs transition-colors ${
                openBasesCount > 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
              }`}
              title="Status em tempo real das bases presenciais dr.monitora®"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  openBasesCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>
                {openBasesCount > 0
                  ? `${openBasesCount} ${openBasesCount === 1 ? 'Base Presencial Aberta Agora' : 'Bases Presenciais Abertas Agora'}`
                  : 'Bases Presenciais Fechadas Agora'}
              </span>
            </div>
          </div>
          <p className="text-xs text-white/50 mt-1">
            {mainTab === 'prestadores'
              ? 'Consulta operacional de técnicos, bases regionais e telefones autorizados'
              : 'Diretrizes operacionais, regras de horário fixo, bases presenciais e agendas'}
          </p>
        </div>

        {/* Search Input + Action Button */}
        <div className="flex items-center gap-2.5 flex-1 max-w-xl md:justify-end">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-[#00d2d3]" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca universal (técnico, código, cidade, ponto fixo)..."
              className="w-full pl-9 pr-16 py-2 bg-[#13151c] text-[#e3e1e9] placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-[#1e2029] focus:border-[#00d2d3] focus:outline-none transition-all shadow-inner font-sans"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[10px] font-mono text-slate-500">
                Ctrl+K
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handlePrimaryCTA}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00d2d3] hover:bg-[#00e2e3] active:scale-[0.98] text-[#003731] font-black text-xs shadow-md border border-[#00d2d3] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{mainTab === 'prestadores' ? 'Novo Prestador' : 'Novo Ponto Fixo'}</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        {searchQuery.trim().length > 0 ? (
          <SearchAccordionFeed
            query={searchQuery}
            onClearQuery={() => setSearchQuery('')}
            results={universalResults}
            onCopySuccess={showToast}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onEdit={(p) => {
              setEditingPrestador(p);
              setIsModalOpen(true);
            }}
            onDelete={handleDeletePrestador}
            onRecordRecent={handleRecordRecent}
          />
        ) : (
          <>
            {/* Module 1: Prestadores */}
            {mainTab === 'prestadores' && (
              <div className="space-y-3.5">
                {/* Recent Consults Strip (if any prestador was consulted) */}
                {recentConsults.length > 0 && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#11141e]/80 border border-[#1e2230] backdrop-blur-md text-xs shadow-sm">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                      <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Acessados Recentemente:</span>
                      </span>
                      {recentConsults.map((rc) => {
                        const color = getRegionColor(rc.regiao, rc.cor);
                        return (
                          <button
                            key={rc.id}
                            type="button"
                            onClick={() => {
                              setSearchQuery(rc.codigo);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1a1b26] hover:bg-[#232532] text-white border ${color.border} shrink-0 transition-all cursor-pointer shadow-xs active:scale-95`}
                            title={`Consultar ${rc.nome} (#${rc.codigo} - ${rc.regiao})`}
                          >
                            <span className="font-mono text-[11px] text-cyan-300">#{rc.codigo}</span>
                            <span className="truncate max-w-[130px]">{rc.nome}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearRecent}
                      className="text-[11px] text-slate-500 hover:text-slate-300 underline shrink-0 cursor-pointer ml-1"
                      title="Limpar histórico de recentes"
                    >
                      Limpar
                    </button>
                  </div>
                )}

                <UnifiedToolbar
                  selectedRegion={selectedRegion}
                  onSelectRegion={setSelectedRegion}
                  regions={regionStats}
                  resultCount={filteredPrestadores.length}
                  totalCount={prestadores.length}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  phoneFilter={phoneFilter}
                  onPhoneFilterChange={setPhoneFilter}
                  pendingPhoneCount={pendingPhoneCount}
                  cardDensity={cardDensity}
                  onCardDensityChange={handleCardDensityChange}
                  onExportCSV={handleExportCSV}
                />

                {/* Views */}
                {viewMode === 'terminal' && (
                  <PrestadorTerminalView
                    prestadores={filteredPrestadores}
                    searchQuery=""
                    onEdit={(p) => {
                      setEditingPrestador(p);
                      setIsModalOpen(true);
                    }}
                    onDelete={handleDeletePrestador}
                    onCopySuccess={showToast}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}

                {viewMode === 'cards' && (
                  <PrestadorCardsView
                    prestadores={filteredPrestadores}
                    onEdit={(p) => {
                      setEditingPrestador(p);
                      setIsModalOpen(true);
                    }}
                    onDelete={handleDeletePrestador}
                    onCopySuccess={showToast}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    density={cardDensity}
                    onRecordRecent={handleRecordRecent}
                  />
                )}

                {viewMode === 'table' && (
                  <PrestadorTableView
                    prestadores={filteredPrestadores}
                    onEdit={(p) => {
                      setEditingPrestador(p);
                      setIsModalOpen(true);
                    }}
                    onDelete={handleDeletePrestador}
                    onCopySuccess={showToast}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}
              </div>
            )}

              {/* Module 3: Regras Operacionais, Agendas & Pontos Fixos */}
              {mainTab === 'regras' && (
                <RegrasAgendasView
                  pontosFixos={pontosFixos}
                  agendas={agendas}
                  regras={regras}
                  onSavePontoFixo={handleSavePontoFixo}
                  onDeletePontoFixo={handleDeletePontoFixo}
                  onSaveAgenda={handleSaveAgenda}
                  onDeleteAgenda={handleDeleteAgenda}
                  onSaveRegra={handleSaveRegra}
                  onDeleteRegra={handleDeleteRegra}
                  onResetDefaults={handleResetRegrasAgendas}
                  onCopySuccess={showToast}
                  onNavigateToTemplates={() => {
                    setMainTab('templates');
                    setSearchQuery('');
                  }}
                  globalSearchQuery=""
                  onGlobalSearchChange={() => {}}
                />
              )}
            </>
          )}
        </div>

      {/* Modals & Dialogs */}
      <PrestadorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPrestador(null);
        }}
        onSave={handleSavePrestador}
        editingPrestador={editingPrestador}
        knownRegions={knownRegions}
      />

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        editingTemplate={editingTemplate}
        knownCategories={knownTemplateCategories}
      />

      <TemplateFormFillerModal
        isOpen={isFillerModalOpen}
        onClose={() => setIsFillerModalOpen(false)}
        onCopySuccess={showToast}
      />

      <UniversalOmniModal
        isOpen={isOmniModalOpen}
        onClose={() => setIsOmniModalOpen(false)}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        prestadores={universalResults.prestadoresMatches}
        templates={universalResults.templatesMatches}
        pontosFixos={universalResults.pontosFixosMatches}
        agendas={universalResults.agendasMatches}
        regras={universalResults.regrasMatches}
        onNavigateToTab={(tab) => {
          setMainTab(tab);
          setSearchQuery('');
        }}
        onCopySuccess={showToast}
      />

      <PontoFixoModal
        isOpen={isPontoFixoModalOpen}
        onClose={() => setIsPontoFixoModalOpen(false)}
        onSave={handleSavePontoFixo}
        editingItem={null}
        totalItems={pontosFixos.length}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        prestadores={prestadores}
        onImport={handleImportPrestadores}
      />

      <ResetConfirmModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleResetConfirm}
        defaultCount={INITIAL_PRESTADORES.length}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        sharedUrl={sharedUrl}
      />

      <Toast message={toastMessage} />
    </div>
  );
}

export default PrestadoresRegionalModule;

