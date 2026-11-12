import { Prestador, TemplateItem, PontoFixoItem, AgendaRegiaoItem, RegraOperacionalItem } from '../types';

export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Normalizes tokens for query matching, treating 'leste1' as 'leste 1', etc.
 */
export function canonicalRegion(region: string): string {
  return normalizeText(region).replace(/([a-z]+)\s*(\\d+)/g, '$1 $2').replace(/\s+/g, ' ').trim().toUpperCase();
}

export function tokenizeQuery(query: string): string[] {
  const norm = normalizeText(query);
  if (!norm) return [];
  
  // Expand connected letters and digits e.g. "leste1" -> "leste" "1"
  const expanded = norm.replace(/([a-z]+)(\d+)/g, '$1 $2');
  return expanded.split(/\s+/).filter(Boolean);
}

export function filterPrestadores(prestadores: Prestador[], query: string, selectedRegion: string | null): Prestador[] {
  let list = prestadores;

  if (selectedRegion && selectedRegion !== 'TODAS') {
    const normRegion = canonicalRegion(selectedRegion);
    list = list.filter(p => canonicalRegion(p.regiao) === normRegion);
  }

  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return list;
  }

  return list.filter(p => {
    const normRegiao = normalizeText(p.regiao);
    const normNome = normalizeText(p.nome);
    const normCodigo = normalizeText(p.codigo);
    const normObs = normalizeText(p.observacao || '');
    const normTel = normalizeText(p.telefone || '');
    const combined = `${normCodigo} ${normNome} ${normRegiao} ${normObs} ${normTel}`;
    const combinedNoSpaces = combined.replace(/\s+/g, '');

    // Every token in query must be present in the combined provider text
    return tokens.every(token => {
      return (
        combined.includes(token) ||
        combinedNoSpaces.includes(token) ||
        normRegiao.includes(token) ||
        normNome.includes(token) ||
        normCodigo.includes(token)
      );
    });
  });
}

export function filterTemplates(templates: TemplateItem[], query: string): TemplateItem[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return templates;

  return templates.filter(t => {
    const normTitulo = normalizeText(t.titulo);
    const normCategoria = normalizeText(t.categoria);
    const normTexto = normalizeText(t.texto);
    const normBadge = normalizeText(t.badge || '');
    const combined = `${normTitulo} ${normCategoria} ${normTexto} ${normBadge}`;
    const combinedNoSpaces = combined.replace(/\s+/g, '');

    return tokens.every(token => combined.includes(token) || combinedNoSpaces.includes(token));
  });
}

export function filterPontosFixos(pontosFixos: PontoFixoItem[], query: string): PontoFixoItem[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return pontosFixos;

  return pontosFixos.filter(pf => {
    const normNome = normalizeText(pf.nome);
    const normSub = normalizeText(pf.subtitulo);
    const normEnd = normalizeText(pf.endereco);
    const normCep = normalizeText(pf.cep);
    const normRef = normalizeText(pf.referencia);
    const normSem = normalizeText(pf.horarioSemana);
    const normSab = normalizeText(pf.horarioSabado);
    const combined = `${normNome} ${normSub} ${normEnd} ${normCep} ${normRef} ${normSem} ${normSab} ponto fixo posto base`;
    const combinedNoSpaces = combined.replace(/\s+/g, '');

    return tokens.every(token => combined.includes(token) || combinedNoSpaces.includes(token));
  });
}

export function filterAgendas(agendas: AgendaRegiaoItem[], query: string): AgendaRegiaoItem[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return agendas;

  return agendas.filter(ag => {
    const normRegiao = normalizeText(ag.regiao);
    const normDias = normalizeText(ag.diasAtendimento);
    const normObs = normalizeText(ag.observacoes);
    const normCidades = ag.cidades ? ag.cidades.map(normalizeText).join(' ') : '';
    const normIsencao = ag.isencaoKm ? `${normalizeText(ag.isencaoKm.dia)} ${normalizeText(ag.isencaoKm.regra)} isencao km isento quilometragem` : '';
    const combined = `${normRegiao} ${normDias} ${normObs} ${normCidades} ${normIsencao} agenda regiao`;
    const combinedNoSpaces = combined.replace(/\s+/g, '');

    return tokens.every(token => combined.includes(token) || combinedNoSpaces.includes(token));
  });
}

export function filterRegras(regras: RegraOperacionalItem[], query: string): RegraOperacionalItem[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return regras;

  return regras.filter(r => {
    const normTitulo = normalizeText(r.titulo);
    const normSub = normalizeText(r.subtitulo);
    const normCat = normalizeText(r.categoria);
    const normItens = r.itens.map(normalizeText).join(' ');
    const normAlerta = normalizeText(r.alerta || '');
    const normCopia = normalizeText(r.textoCopiaAtendente || '');
    const combined = `${normTitulo} ${normSub} ${normCat} ${normItens} ${normAlerta} ${normCopia} regra politica diretriz`;
    const combinedNoSpaces = combined.replace(/\s+/g, '');

    return tokens.every(token => combined.includes(token) || combinedNoSpaces.includes(token));
  });
}

export interface UniversalSearchResults {
  prestadoresMatches: Prestador[];
  templatesMatches: TemplateItem[];
  pontosFixosMatches: PontoFixoItem[];
  agendasMatches: AgendaRegiaoItem[];
  regrasMatches: RegraOperacionalItem[];
  totalMatches: number;
}

export function searchUniversalAll(
  query: string,
  data: {
    prestadores: Prestador[];
    templates: TemplateItem[];
    pontosFixos: PontoFixoItem[];
    agendas: AgendaRegiaoItem[];
    regras: RegraOperacionalItem[];
  }
): UniversalSearchResults {
  const prestadoresMatches = filterPrestadores(data.prestadores, query, null);
  const templatesMatches = filterTemplates(data.templates, query);
  const pontosFixosMatches = filterPontosFixos(data.pontosFixos, query);
  const agendasMatches = filterAgendas(data.agendas, query);
  const regrasMatches = filterRegras(data.regras, query);

  const totalMatches =
    prestadoresMatches.length +
    templatesMatches.length +
    pontosFixosMatches.length +
    agendasMatches.length +
    regrasMatches.length;

  return {
    prestadoresMatches,
    templatesMatches,
    pontosFixosMatches,
    agendasMatches,
    regrasMatches,
    totalMatches,
  };
}

export function getRegionColor(region: string, customColor?: string): { bg: string; text: string; border: string; glow: string } {
  if (customColor) {
    const c = customColor.toLowerCase();
    if (c === 'emerald') return { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/60', glow: 'emerald' };
    if (c === 'amber') return { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/60', glow: 'amber' };
    if (c === 'sky') return { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-800/60', glow: 'sky' };
    if (c === 'purple') return { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/60', glow: 'purple' };
    if (c === 'rose') return { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/60', glow: 'rose' };
    if (c === 'cyan') return { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/60', glow: 'cyan' };
    if (c === 'indigo') return { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-800/60', glow: 'indigo' };
    if (c === 'teal') return { bg: 'bg-teal-950/40', text: 'text-teal-300', border: 'border-teal-800/60', glow: 'teal' };
  }

  const norm = normalizeText(region);
  if (norm.startsWith('leste')) {
    return { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/60', glow: 'emerald' };
  }
  if (norm.startsWith('oeste')) {
    return { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/60', glow: 'amber' };
  }
  if (norm.startsWith('norte')) {
    return { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-800/60', glow: 'sky' };
  }
  if (norm.startsWith('sul')) {
    return { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/60', glow: 'purple' };
  }
  if (norm.startsWith('abc')) {
    return { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/60', glow: 'rose' };
  }
  if (norm.includes('campinas') || norm.includes('sorocaba') || norm.includes('ribeirao') || norm.includes('sao jose') || norm.includes('atibaia')) {
    return { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/60', glow: 'cyan' };
  }
  if (norm.includes('tupa') || norm.includes('litoral') || norm.includes('geral') || norm.includes('centro') || norm.includes('teste')) {
    return { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-800/60', glow: 'indigo' };
  }
  return { bg: 'bg-teal-950/40', text: 'text-teal-300', border: 'border-teal-800/60', glow: 'teal' };
}

