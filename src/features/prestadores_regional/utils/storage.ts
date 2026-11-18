import { Prestador, TemplateItem, PontoFixoItem, AgendaRegiaoItem, RegraOperacionalItem } from '../types';
import { INITIAL_PRESTADORES } from '../data/defaultPrestadores';
import { INITIAL_TEMPLATES } from '../data/defaultTemplates';
import { PONTOS_FIXOS, AGENDAS_REGIONAIS, REGRAS_OPERACIONAIS } from '../data/defaultRegrasAgendas';
import { getRegionColor } from './search';
import { pushCloudFields } from '../../../lib/cloudSync';

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRESTADORES));
      return INITIAL_PRESTADORES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let needsUpdate = false;
      const enriched = parsed.map((p: Prestador) => {
        if (!p.cor) {
          const match = INITIAL_PRESTADORES.find(
            (ip) => ip.id === p.id || ip.codigo === p.codigo
          );
          const assignedCor = match?.cor || getRegionColor(p.regiao).glow;
          needsUpdate = true;
          return { ...p, cor: assignedCor };
        }
        return p;
      });
      if (needsUpdate) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
      }
      return enriched;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRESTADORES));
    return INITIAL_PRESTADORES;
  } catch (err) {
    console.error('Erro ao ler prestadores do LocalStorage:', err);
    return INITIAL_PRESTADORES;
  }
}

export function savePrestadores(prestadores: Prestador[]): void {
  try {
    const serialized = JSON.stringify(prestadores);
    if (localStorage.getItem(STORAGE_KEY) === serialized) return;
    localStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalPrestadores: prestadores });
  } catch (err) {
    console.error('Erro ao salvar no LocalStorage:', err);
  }
}

export function resetPrestadoresToDefault(): Prestador[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRESTADORES));
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalPrestadores: INITIAL_PRESTADORES });
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
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(INITIAL_TEMPLATES));
      return INITIAL_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(INITIAL_TEMPLATES));
    return INITIAL_TEMPLATES;
  } catch (err) {
    console.error('Erro ao ler templates do LocalStorage:', err);
    return INITIAL_TEMPLATES;
  }
}

export function saveTemplates(templates: TemplateItem[]): void {
  try {
    const serialized = JSON.stringify(templates);
    if (localStorage.getItem(TEMPLATES_KEY) === serialized) return;
    localStorage.setItem(TEMPLATES_KEY, serialized);
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalTemplates: templates });
  } catch (err) {
    console.error('Erro ao salvar templates no LocalStorage:', err);
  }
}

export function resetTemplatesToDefault(): TemplateItem[] {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(INITIAL_TEMPLATES));
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalTemplates: INITIAL_TEMPLATES });
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
      localStorage.setItem(PONTOS_FIXOS_KEY, JSON.stringify(PONTOS_FIXOS));
      return PONTOS_FIXOS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    localStorage.setItem(PONTOS_FIXOS_KEY, JSON.stringify(PONTOS_FIXOS));
    return PONTOS_FIXOS;
  } catch (err) {
    console.error('Erro ao ler pontos fixos:', err);
    return PONTOS_FIXOS;
  }
}

export function savePontosFixos(items: PontoFixoItem[]): void {
  try {
    const serialized = JSON.stringify(items);
    if (localStorage.getItem(PONTOS_FIXOS_KEY) === serialized) return;
    localStorage.setItem(PONTOS_FIXOS_KEY, serialized);
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalPontosFixos: items });
  } catch (err) {
    console.error('Erro ao salvar pontos fixos:', err);
  }
}

export function resetPontosFixosToDefault(): PontoFixoItem[] {
  try {
    localStorage.setItem(PONTOS_FIXOS_KEY, JSON.stringify(PONTOS_FIXOS));
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalPontosFixos: PONTOS_FIXOS });
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
      localStorage.setItem(AGENDAS_KEY, JSON.stringify(AGENDAS_REGIONAIS));
      return AGENDAS_REGIONAIS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    localStorage.setItem(AGENDAS_KEY, JSON.stringify(AGENDAS_REGIONAIS));
    return AGENDAS_REGIONAIS;
  } catch (err) {
    console.error('Erro ao ler agendas regionais:', err);
    return AGENDAS_REGIONAIS;
  }
}

export function saveAgendas(items: AgendaRegiaoItem[]): void {
  try {
    const serialized = JSON.stringify(items);
    if (localStorage.getItem(AGENDAS_KEY) === serialized) return;
    localStorage.setItem(AGENDAS_KEY, serialized);
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalAgendas: items });
  } catch (err) {
    console.error('Erro ao salvar agendas regionais:', err);
  }
}

export function resetAgendasToDefault(): AgendaRegiaoItem[] {
  try {
    localStorage.setItem(AGENDAS_KEY, JSON.stringify(AGENDAS_REGIONAIS));
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalAgendas: AGENDAS_REGIONAIS });
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
      localStorage.setItem(REGRAS_KEY, JSON.stringify(REGRAS_OPERACIONAIS));
      return REGRAS_OPERACIONAIS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    localStorage.setItem(REGRAS_KEY, JSON.stringify(REGRAS_OPERACIONAIS));
    return REGRAS_OPERACIONAIS;
  } catch (err) {
    console.error('Erro ao ler regras operacionais:', err);
    return REGRAS_OPERACIONAIS;
  }
}

export function saveRegras(items: RegraOperacionalItem[]): void {
  try {
    const serialized = JSON.stringify(items);
    if (localStorage.getItem(REGRAS_KEY) === serialized) return;
    localStorage.setItem(REGRAS_KEY, serialized);
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalRegras: items });
  } catch (err) {
    console.error('Erro ao salvar regras operacionais:', err);
  }
}

export function resetRegrasToDefault(): RegraOperacionalItem[] {
  try {
    localStorage.setItem(REGRAS_KEY, JSON.stringify(REGRAS_OPERACIONAIS));
    window.dispatchEvent(new Event('prestadores-cloud-updated'));
    void pushCloudFields({ regionalRegras: REGRAS_OPERACIONAIS });
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
    const serialized = JSON.stringify(ids);
    if (localStorage.getItem(FAVORITES_KEY) === serialized) return;
    localStorage.setItem(FAVORITES_KEY, serialized);
    void pushCloudFields({ regionalFavorites: ids });
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

