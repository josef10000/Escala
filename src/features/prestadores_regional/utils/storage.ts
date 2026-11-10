import { Prestador, TemplateItem, PontoFixoItem, AgendaRegiaoItem, RegraOperacionalItem } from '../types';
import { INITIAL_PRESTADORES } from '../data/defaultPrestadores';
import { INITIAL_TEMPLATES } from '../data/defaultTemplates';
import { PONTOS_FIXOS, AGENDAS_REGIONAIS, REGRAS_OPERACIONAIS } from '../data/defaultRegrasAgendas';

const STORAGE_KEY = 'prestadores_dados_v1';
const FAVORITES_KEY = 'prestadores_favoritos_v1';
const TEMPLATES_KEY = 'atendimento_templates_v1';
const PONTOS_FIXOS_KEY = 'drmonitora_pontos_fixos_v1';
const AGENDAS_KEY = 'drmonitora_agendas_v1';
const REGRAS_KEY = 'drmonitora_regras_v1';

export function getStoredPrestadores(): Prestador[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      savePrestadores(INITIAL_PRESTADORES);
      return INITIAL_PRESTADORES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    savePrestadores(INITIAL_PRESTADORES);
    return INITIAL_PRESTADORES;
  } catch (err) {
    console.error('Erro ao ler prestadores do LocalStorage:', err);
    return INITIAL_PRESTADORES;
  }
}

export function savePrestadores(prestadores: Prestador[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prestadores));
  } catch (err) {
    console.error('Erro ao salvar no LocalStorage:', err);
  }
}

export function resetPrestadoresToDefault(): Prestador[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRESTADORES));
    return INITIAL_PRESTADORES;
  } catch (err) {
    console.error('Erro ao restaurar dados padrão:', err);
    return INITIAL_PRESTADORES;
  }
}

export function getStoredTemplates(): TemplateItem[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) {
      saveTemplates(INITIAL_TEMPLATES);
      return INITIAL_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    saveTemplates(INITIAL_TEMPLATES);
    return INITIAL_TEMPLATES;
  } catch (err) {
    console.error('Erro ao ler templates do LocalStorage:', err);
    return INITIAL_TEMPLATES;
  }
}

export function saveTemplates(templates: TemplateItem[]): void {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Erro ao salvar templates no LocalStorage:', err);
  }
}

export function resetTemplatesToDefault(): TemplateItem[] {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(INITIAL_TEMPLATES));
    return INITIAL_TEMPLATES;
  } catch (err) {
    console.error('Erro ao restaurar templates padrão:', err);
    return INITIAL_TEMPLATES;
  }
}

// ==========================================
// PONTOS FIXOS STORAGE
// ==========================================
export function getStoredPontosFixos(): PontoFixoItem[] {
  try {
    const raw = localStorage.getItem(PONTOS_FIXOS_KEY);
    if (!raw) {
      savePontosFixos(PONTOS_FIXOS);
      return PONTOS_FIXOS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    savePontosFixos(PONTOS_FIXOS);
    return PONTOS_FIXOS;
  } catch (err) {
    console.error('Erro ao ler pontos fixos:', err);
    return PONTOS_FIXOS;
  }
}

export function savePontosFixos(items: PontoFixoItem[]): void {
  try {
    localStorage.setItem(PONTOS_FIXOS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Erro ao salvar pontos fixos:', err);
  }
}

export function resetPontosFixosToDefault(): PontoFixoItem[] {
  try {
    localStorage.setItem(PONTOS_FIXOS_KEY, JSON.stringify(PONTOS_FIXOS));
    return PONTOS_FIXOS;
  } catch (err) {
    console.error('Erro ao restaurar pontos fixos:', err);
    return PONTOS_FIXOS;
  }
}

// ==========================================
// AGENDAS REGIONAIS STORAGE
// ==========================================
export function getStoredAgendas(): AgendaRegiaoItem[] {
  try {
    const raw = localStorage.getItem(AGENDAS_KEY);
    if (!raw) {
      saveAgendas(AGENDAS_REGIONAIS);
      return AGENDAS_REGIONAIS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    saveAgendas(AGENDAS_REGIONAIS);
    return AGENDAS_REGIONAIS;
  } catch (err) {
    console.error('Erro ao ler agendas regionais:', err);
    return AGENDAS_REGIONAIS;
  }
}

export function saveAgendas(items: AgendaRegiaoItem[]): void {
  try {
    localStorage.setItem(AGENDAS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Erro ao salvar agendas regionais:', err);
  }
}

export function resetAgendasToDefault(): AgendaRegiaoItem[] {
  try {
    localStorage.setItem(AGENDAS_KEY, JSON.stringify(AGENDAS_REGIONAIS));
    return AGENDAS_REGIONAIS;
  } catch (err) {
    console.error('Erro ao restaurar agendas regionais:', err);
    return AGENDAS_REGIONAIS;
  }
}

// ==========================================
// REGRAS OPERACIONAIS STORAGE
// ==========================================
export function getStoredRegras(): RegraOperacionalItem[] {
  try {
    const raw = localStorage.getItem(REGRAS_KEY);
    if (!raw) {
      saveRegras(REGRAS_OPERACIONAIS);
      return REGRAS_OPERACIONAIS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    saveRegras(REGRAS_OPERACIONAIS);
    return REGRAS_OPERACIONAIS;
  } catch (err) {
    console.error('Erro ao ler regras operacionais:', err);
    return REGRAS_OPERACIONAIS;
  }
}

export function saveRegras(items: RegraOperacionalItem[]): void {
  try {
    localStorage.setItem(REGRAS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Erro ao salvar regras operacionais:', err);
  }
}

export function resetRegrasToDefault(): RegraOperacionalItem[] {
  try {
    localStorage.setItem(REGRAS_KEY, JSON.stringify(REGRAS_OPERACIONAIS));
    return REGRAS_OPERACIONAIS;
  } catch (err) {
    console.error('Erro ao restaurar regras operacionais:', err);
    return REGRAS_OPERACIONAIS;
  }
}

export function resetAllRegrasAgendasToDefault(): {
  pontosFixos: PontoFixoItem[];
  agendas: AgendaRegiaoItem[];
  regras: RegraOperacionalItem[];
} {
  return {
    pontosFixos: resetPontosFixosToDefault(),
    agendas: resetAgendasToDefault(),
    regras: resetRegrasToDefault(),
  };
}

export function getFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteIds(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function exportToJSON(prestadores: Prestador[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(prestadores, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `prestadores_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToCSV(prestadores: Prestador[]): void {
  const header = 'Codigo,Nome,Regiao,Telefone,Observacao\n';
  const rows = prestadores
    .map(p => `"${p.codigo}","${p.nome.replace(/"/g, '""')}","${p.regiao.replace(/"/g, '""')}","${(p.telefone || '').replace(/"/g, '""')}","${(p.observacao || '').replace(/"/g, '""')}"`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prestadores_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

