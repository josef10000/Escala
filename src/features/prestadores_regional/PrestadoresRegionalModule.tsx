/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { filterPrestadores, searchUniversalAll } from './utils/search';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { UnifiedToolbar } from './components/UnifiedToolbar';
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
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [favorites, setFavorites] = useState<string[]>(() => getFavoriteIds());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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

  // Global Keyboard shortcut: Cmd+K / Ctrl+K opens In-Place Spotlight Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setFocusSearchSignal((prev) => prev + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Filtered Prestadores for the Prestadores view
  const filteredPrestadores = useMemo(() => {
    let base = prestadores;
    if (showFavoritesOnly) {
      base = base.filter((p) => favorites.includes(p.id));
    }
    return filterPrestadores(base, searchQuery, selectedRegion);
  }, [prestadores, searchQuery, selectedRegion, showFavoritesOnly, favorites]);

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
    } else if (mainTab === 'templates') {
      setEditingTemplate(null);
      setIsTemplateModalOpen(true);
    } else {
      setIsPontoFixoModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F] text-[#e3e1e9] font-sans selection:bg-[#00d2d3] selection:text-black relative">
      {/* Ambient Aurora Glow Background for True Glassmorphism */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Soft Escala Cyan Aurora Blob Top-Left */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00d2d3]/8 blur-[140px]" />
        {/* Deep Cyan/Teal Aurora Top-Right */}
        <div className="absolute top-1/6 -right-20 w-[32rem] h-[32rem] rounded-full bg-cyan-500/6 blur-[160px]" />
      </div>

      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        mainTab={mainTab}
        onMainTabChange={(tab) => {
          setMainTab(tab);
          setSearchQuery('');
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        totalPrestadores={prestadores.length}
        totalTemplates={templates.length}
        totalRegrasAgendas={totalRegrasAgendas}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => {
          setShowFavoritesOnly((prev) => !prev);
          setMainTab('prestadores');
          setSearchQuery('');
        }}
        favoritesCount={favorites.length}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenReset={() => setIsResetOpen(true)}
        selectedRegion={selectedRegion}
        onSelectRegion={(reg) => {
          setSelectedRegion(reg);
          setMainTab('prestadores');
          setSearchQuery('');
        }}
        onNavigateToEscala={onNavigateToEscala}
      />

      {/* 2. Main Right Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        {/* Sticky Header with THE SINGLE UNIVERSAL SEARCH BAR */}
        <Header
          mainTab={mainTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenPrimaryCTA={handlePrimaryCTA}
          onOpenSecondaryCTA={mainTab === 'templates' ? () => setIsFillerModalOpen(true) : undefined}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalUniversalMatches={searchQuery ? universalResults.totalMatches : undefined}
        />

        {/* Scrollable View Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {/* OPTION 2: Accordion Feed when universal search is active */}
          {searchQuery.trim().length > 0 ? (
            <SearchAccordionFeed
              query={searchQuery}
              onClearQuery={() => setSearchQuery('')}
              results={universalResults}
              onCopySuccess={showToast}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onNavigateToTab={(tab) => {
                setMainTab(tab);
                setSearchQuery('');
              }}
            />
          ) : (
            <>
              {/* Page Hero Header with responsive H1 using rem: ~30px on mobile (1.875rem), 36px on desktop (2.25rem) */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
                <div>
                  <h1 className="text-[1.875rem] sm:text-4xl font-bold text-white tracking-tight leading-tight">
                    {mainTab === 'prestadores' && 'Prestadores de Serviços'}
                    {mainTab === 'templates' && 'Templates OPA Atendimento'}
                    {mainTab === 'regras' && 'Regras, Pontos Fixos & Agendas'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    {mainTab === 'prestadores' && 'Consulta operacional de técnicos, bases regionais e telefones autorizados'}
                    {mainTab === 'templates' && 'Mensagens padronizadas com saudação automática pelo horário para WhatsApp e OPA'}
                    {mainTab === 'regras' && 'Diretrizes operacionais, regras de horário fixo, bases presenciais e agendas'}
                  </p>
                </div>
              </div>

              {/* Module 1: Prestadores */}
              {mainTab === 'prestadores' && (
                <div className="space-y-4">
                  <UnifiedToolbar
                    selectedRegion={selectedRegion}
                    onSelectRegion={setSelectedRegion}
                    regions={regionStats}
                    resultCount={filteredPrestadores.length}
                    totalCount={prestadores.length}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
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

              {/* Module 2: Frases & Templates OPA */}
              {mainTab === 'templates' && (
                <TemplatesView
                  templates={templates}
                  onSaveTemplate={handleSaveTemplate}
                  onDeleteTemplate={handleDeleteTemplate}
                  onResetTemplates={handleResetTemplates}
                  onCopySuccess={showToast}
                  onOpenNewTemplateModal={() => {
                    setEditingTemplate(null);
                    setIsTemplateModalOpen(true);
                  }}
                  onOpenEditTemplateModal={(t) => {
                    setEditingTemplate(t);
                    setIsTemplateModalOpen(true);
                  }}
                  onOpenFillerModal={() => setIsFillerModalOpen(true)}
                  globalSearchQuery=""
                  onGlobalSearchChange={() => {}}
                />
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
        </main>
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

