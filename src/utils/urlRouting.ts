import type { ActiveModule, ViewMode } from '../types';
import type { CentralTab } from '../features/central_inteligencia/types';

const MODULE_TO_SLUG: Record<ActiveModule, string> = {
  escala: 'escala',
  prestadores_regional: 'tecnicos',
  pontos_fixos: 'pontos',
  central_inteligencia: 'central',
  gestor_feedbacks: 'feedbacks',
};

const SLUG_TO_MODULE: Record<string, ActiveModule> = {
  escala: 'escala',
  quadro: 'escala',
  prestadores_regional: 'prestadores_regional',
  prestadores: 'prestadores_regional',
  tecnicos: 'prestadores_regional',
  pontos_fixos: 'pontos_fixos',
  pontos: 'pontos_fixos',
  postos: 'pontos_fixos',
  regras: 'pontos_fixos',
  central_inteligencia: 'central_inteligencia',
  central: 'central_inteligencia',
  gestor_feedbacks: 'gestor_feedbacks',
  feedbacks: 'gestor_feedbacks',
};

const VALID_VIEW_MODES: ViewMode[] = [
  'escala',
  'personal-calendar',
  'calendar',
  'matrix',
  'week',
  'agenda',
  'my-schedule',
];

const VALID_CENTRAL_TABS: CentralTab[] = [
  'overview',
  'encaixes',
  'ocorrencias',
  'agendas',
  'clientes',
  'chat',
  'conexao',
];

export function readModuleFromUrl(): ActiveModule | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const queryMod = (params.get('modulo') || params.get('tab') || '').trim().toLowerCase();
  if (queryMod && SLUG_TO_MODULE[queryMod]) {
    return SLUG_TO_MODULE[queryMod];
  }

  const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (cleanPath && SLUG_TO_MODULE[cleanPath]) {
    return SLUG_TO_MODULE[cleanPath];
  }

  return null;
}

export function readEscalaViewFromUrl(): ViewMode | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const visao = (params.get('visao') || '').trim() as ViewMode;
  return VALID_VIEW_MODES.includes(visao) ? visao : null;
}

export function readCentralTabFromUrl(): CentralTab | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const aba = (params.get('aba') || '').trim() as CentralTab;
  return VALID_CENTRAL_TABS.includes(aba) ? aba : null;
}

export function writeModuleToUrl(
  module: ActiveModule,
  options?: { viewMode?: ViewMode; centralTab?: CentralTab; replace?: boolean }
): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  // Normalize root path when using query params so links share cleanly everywhere
  if (url.pathname !== '/') {
    const cleanPath = url.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (SLUG_TO_MODULE[cleanPath]) {
      url.pathname = '/';
    }
  }

  const slug = MODULE_TO_SLUG[module] || 'escala';
  url.searchParams.set('modulo', slug);
  url.searchParams.delete('tab');

  if (module === 'escala') {
    url.searchParams.delete('aba');
    if (options?.viewMode && options.viewMode !== 'escala') {
      url.searchParams.set('visao', options.viewMode);
    } else if (options?.viewMode === 'escala') {
      url.searchParams.delete('visao');
    }
  } else if (module === 'central_inteligencia') {
    url.searchParams.delete('visao');
    if (options?.centralTab && options.centralTab !== 'overview') {
      url.searchParams.set('aba', options.centralTab);
    } else if (options?.centralTab === 'overview') {
      url.searchParams.delete('aba');
    }
  } else {
    url.searchParams.delete('visao');
    url.searchParams.delete('aba');
  }

  const nextHref = `${url.pathname}${url.search}${url.hash}`;
  const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextHref === currentHref) return;

  if (options?.replace) {
    window.history.replaceState({ module }, '', nextHref);
  } else {
    window.history.pushState({ module }, '', nextHref);
  }
}
