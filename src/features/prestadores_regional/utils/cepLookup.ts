import { PontoFixoItem } from '../types';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  ddd?: string;
  erro?: boolean;
}

export interface CepLookupResult {
  cep: string;
  formattedCep: string;
  logradouro?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  ddd?: string;
  isOnline: boolean;
  baseRecomendada: PontoFixoItem;
  motivoRecomendacao: string;
  regrasEspeciais: {
    temIsencaoKm: boolean;
    titulo: string;
    descricao: string;
    diaSemanaRecomendado: string;
    isHojeAtivo: boolean;
    tipo: 'sjc' | 'litoral' | 'guaruja' | 'padrao';
  }[];
  textoWhatsapp: string;
}

export function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '').slice(0, 8);
}

export function formatCep(cep: string): string {
  const clean = cleanCep(cep);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}

/**
 * Offline fallback dictionary for São Paulo / Regional CEP prefixes.
 */
function getOfflineLocation(prefix5: number): { cidade: string; bairro: string; uf: string } {
  // SJC
  if (prefix5 >= 12200 && prefix5 <= 12299) {
    return { cidade: 'São José dos Campos', bairro: 'Região SJC', uf: 'SP' };
  }
  // Litoral Norte
  if (prefix5 >= 11600 && prefix5 <= 11699) {
    if (prefix5 >= 11600 && prefix5 <= 11634) return { cidade: 'São Sebastião', bairro: 'Litoral Norte', uf: 'SP' };
    if (prefix5 >= 11635 && prefix5 <= 11659) return { cidade: 'Ilhabela', bairro: 'Litoral Norte', uf: 'SP' };
    if (prefix5 >= 11660 && prefix5 <= 11679) return { cidade: 'Caraguatatuba', bairro: 'Litoral Norte', uf: 'SP' };
    return { cidade: 'Ubatuba', bairro: 'Litoral Norte', uf: 'SP' };
  }
  // Guarujá
  if (prefix5 >= 11400 && prefix5 <= 11499) {
    return { cidade: 'Guarujá', bairro: 'Baixada Santista', uf: 'SP' };
  }
  // Santos
  if (prefix5 >= 11000 && prefix5 <= 11299) {
    return { cidade: 'Santos', bairro: 'Baixada Santista', uf: 'SP' };
  }
  // Guarulhos
  if (prefix5 >= 7000 && prefix5 <= 7399) {
    return { cidade: 'Guarulhos', bairro: 'Grande São Paulo', uf: 'SP' };
  }
  // Itaquaquecetuba
  if (prefix5 >= 8500 && prefix5 <= 8599) {
    return { cidade: 'Itaquaquecetuba', bairro: 'Alto Tietê', uf: 'SP' };
  }
  // Mogi das Cruzes / Suzano
  if (prefix5 >= 8600 && prefix5 <= 8799) {
    return { cidade: 'Mogi das Cruzes / Suzano', bairro: 'Alto Tietê', uf: 'SP' };
  }
  // Zona Leste SP
  if ((prefix5 >= 3000 && prefix5 <= 3999) || (prefix5 >= 8000 && prefix5 <= 8499)) {
    return { cidade: 'São Paulo', bairro: 'Zona Leste', uf: 'SP' };
  }
  // Zona Norte SP
  if (prefix5 >= 2000 && prefix5 <= 2999) {
    return { cidade: 'São Paulo', bairro: 'Zona Norte', uf: 'SP' };
  }
  // Centro SP
  if (prefix5 >= 1000 && prefix5 <= 1599) {
    return { cidade: 'São Paulo', bairro: 'Centro / Barra Funda', uf: 'SP' };
  }
  // Zona Oeste SP
  if (prefix5 >= 5000 && prefix5 <= 5899) {
    return { cidade: 'São Paulo', bairro: 'Zona Oeste', uf: 'SP' };
  }
  // Zona Sul SP
  if (prefix5 >= 4000 && prefix5 <= 4999) {
    return { cidade: 'São Paulo', bairro: 'Zona Sul', uf: 'SP' };
  }
  // ABC Paulista
  if (prefix5 >= 9000 && prefix5 <= 9999) {
    return { cidade: 'Grande ABC (Santo André / SBC / SCS)', bairro: 'ABC Paulista', uf: 'SP' };
  }
  // Campinas
  if (prefix5 >= 13000 && prefix5 <= 13139) {
    return { cidade: 'Campinas', bairro: 'Região de Campinas', uf: 'SP' };
  }

  return { cidade: 'São Paulo e Região', bairro: 'Região Metropolitana', uf: 'SP' };
}

/**
 * Determines which of the default or available Pontos Fixos is best for the location.
 */
function chooseBestBase(
  cidade: string,
  bairro: string,
  cepPrefix5: number,
  pontosFixos: PontoFixoItem[]
): { base: PontoFixoItem; motivo: string } {
  const normCidade = cidade.toLowerCase();
  const normBairro = bairro.toLowerCase();

  // 1. Guarulhos, Arujá, Zona Norte SP, Dutra
  const isGuarulhosOrZN =
    normCidade.includes('guarulhos') ||
    normCidade.includes('aruja') ||
    normCidade.includes('mairipora') ||
    normCidade.includes('santa isabel') ||
    normBairro.includes('norte') ||
    normBairro.includes('santana') ||
    normBairro.includes('tucuruvi') ||
    normBairro.includes('vila maria') ||
    (cepPrefix5 >= 7000 && cepPrefix5 <= 7399) ||
    (cepPrefix5 >= 2000 && cepPrefix5 <= 2999);

  if (isGuarulhosOrZN) {
    const baseZN = pontosFixos.find(
      (p) => p.id === 'pf-norte' || p.nome.toLowerCase().includes('guarulhos') || p.nome.toLowerCase().includes('norte')
    );
    if (baseZN) {
      return {
        base: baseZN,
        motivo: 'Base mais rápida via Rodovia Presidente Dutra / Fernão Dias e fácil acesso à Zona Norte e Guarulhos.',
      };
    }
  }

  // 2. Itaquaquecetuba, Alto Tietê, Zona Leste SP, Suzano, Mogi, Poá, Ferraz, Jacareí
  const isZLOrAltoTiete =
    normCidade.includes('itaquaquecetuba') ||
    normCidade.includes('itaqua') ||
    normCidade.includes('mogi') ||
    normCidade.includes('suzano') ||
    normCidade.includes('poa') ||
    normCidade.includes('ferraz') ||
    normCidade.includes('jacarei') ||
    normBairro.includes('leste') ||
    normBairro.includes('itaquera') ||
    normBairro.includes('sao miguel') ||
    normBairro.includes('guaianazes') ||
    (cepPrefix5 >= 8500 && cepPrefix5 <= 8599) ||
    (cepPrefix5 >= 8600 && cepPrefix5 <= 8799) ||
    (cepPrefix5 >= 8000 && cepPrefix5 <= 8499) ||
    (cepPrefix5 >= 3000 && cepPrefix5 <= 3999);

  if (isZLOrAltoTiete) {
    const baseZL = pontosFixos.find(
      (p) => p.id === 'pf-leste' || p.nome.toLowerCase().includes('rl truck') || p.nome.toLowerCase().includes('leste')
    );
    if (baseZL) {
      return {
        base: baseZL,
        motivo: 'Base estrategicamente localizada no Alto Tietê e Ayrton Senna, referência para Zona Leste e municípios vizinhos.',
      };
    }
  }

  // 3. Barra Funda / Centro / Zona Oeste / ABC / Outros
  const baseCentro =
    pontosFixos.find(
      (p) => p.id === 'pf-centro' || p.nome.toLowerCase().includes('barra funda') || p.nome.toLowerCase().includes('centro')
    ) || pontosFixos[0];

  return {
    base: baseCentro,
    motivo: 'Base central de fácil acesso pela Marginal Tietê, Ponte do Limão e eixos Centro / Zona Oeste / Sul.',
  };
}

/**
 * Searches and validates the given CEP, connects to ViaCEP,
 * identifies location, evaluates proximity to Dr. Monitora bases,
 * and matches regional operational rules (SJC, Litoral Norte, Guarujá, KM exemptions).
 */
export async function lookupCep(rawCep: string, pontosFixos: PontoFixoItem[]): Promise<CepLookupResult> {
  const clean = cleanCep(rawCep);
  if (clean.length !== 8) {
    throw new Error('CEP deve conter exatamente 8 dígitos numéricos.');
  }

  const prefix5 = parseInt(clean.slice(0, 5), 10);
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb

  let logradouro = '';
  let bairro = '';
  let cidade = '';
  let uf = 'SP';
  let ddd = '11';
  let isOnline = false;

  // Try ViaCEP with 3.5s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: ViaCepResponse = await res.json();
      if (!data.erro) {
        logradouro = data.logradouro || '';
        bairro = data.bairro || '';
        cidade = data.localidade || '';
        uf = data.uf || 'SP';
        ddd = data.ddd || '11';
        isOnline = true;
      }
    }
  } catch {
    // Graceful offline fallback
    isOnline = false;
  }

  // Fallback to offline table if ViaCEP failed or returned empty
  if (!cidade) {
    const offline = getOfflineLocation(prefix5);
    cidade = offline.cidade;
    bairro = offline.bairro;
    uf = offline.uf;
  }

  // Choose best Ponto Fixo base
  const { base, motivo } = chooseBestBase(cidade, bairro, prefix5, pontosFixos);

  // Check special regional & KM rules
  const regrasEspeciais: CepLookupResult['regrasEspeciais'] = [];
  const normCidade = cidade.toLowerCase();

  // REGRA 1: São José dos Campos (SJC)
  const isSJC =
    normCidade.includes('sao jose dos campos') ||
    normCidade.includes('são josé dos campos') ||
    (prefix5 >= 12200 && prefix5 <= 12299);

  if (isSJC) {
    const isQuarta = currentDayOfWeek === 3;
    regrasEspeciais.push({
      temIsencaoKm: true,
      tipo: 'sjc',
      titulo: 'Isenção de KM em São José dos Campos (SJC)',
      descricao:
        'Na área Fora do Mapa de São José dos Campos, NÃO há cobrança de taxa de KM quando o agendamento ocorrer às quartas-feiras.',
      diaSemanaRecomendado: 'Quarta-feira',
      isHojeAtivo: isQuarta,
    });
  }

  // REGRA 2: Litoral Norte (Caraguá, Ilhabela, São Sebastião, Ubatuba)
  const isLitoralNorte =
    normCidade.includes('sao sebastiao') ||
    normCidade.includes('ilhabela') ||
    normCidade.includes('caraguatatuba') ||
    normCidade.includes('ubatuba') ||
    (prefix5 >= 11600 && prefix5 <= 11699);

  if (isLitoralNorte) {
    const isQuinta = currentDayOfWeek === 4;
    regrasEspeciais.push({
      temIsencaoKm: true,
      tipo: 'litoral',
      titulo: 'Isenção de KM no Litoral Norte (Acima de Bertioga)',
      descricao:
        'Clientes do Litoral Norte atendidos pela rota de SJC contam com 100% de isenção da taxa de KM às quintas-feiras.',
      diaSemanaRecomendado: 'Quinta-feira',
      isHojeAtivo: isQuinta,
    });
  }

  // REGRA 3: Guarujá
  const isGuaruja =
    normCidade.includes('guaruja') ||
    normCidade.includes('guarujá') ||
    (prefix5 >= 11400 && prefix5 <= 11499);

  if (isGuaruja) {
    const isDiaAtendimento = currentDayOfWeek === 3 || currentDayOfWeek === 6; // Quarta ou Sábado
    regrasEspeciais.push({
      temIsencaoKm: false,
      tipo: 'guaruja',
      titulo: 'Agenda Regional Exclusiva – Guarujá',
      descricao:
        'Atendimento com prestadores dedicados exclusivamente às quartas-feiras e aos sábados (sem horário fixo, rota comercial).',
      diaSemanaRecomendado: 'Quarta e Sábado',
      isHojeAtivo: isDiaAtendimento,
    });
  }

  // Generate copyable WhatsApp message
  let textoWhatsapp = `*CONSULTA DE ATENDIMENTO – DR. MONITORA®*\n`;
  textoWhatsapp += `📍 *Região do Cliente:* ${bairro ? `${bairro}, ` : ''}${cidade} - ${uf}\n`;
  textoWhatsapp += `📬 *CEP:* ${formatCep(clean)}\n\n`;
  textoWhatsapp += `🎯 *Ponto Fixo Recomendado:*\n`;
  textoWhatsapp += `🏢 *Base:* ${base.nome} (${base.subtitulo})\n`;
  textoWhatsapp += `📍 *Endereço:* ${base.endereco}\n`;
  textoWhatsapp += `📬 *CEP da Base:* ${base.cep}\n`;
  textoWhatsapp += `🕒 *Segunda a Sexta:* ${base.horarioSemana}\n`;
  textoWhatsapp += `🕒 *Sábado:* ${base.horarioSabado}\n`;

  if (regrasEspeciais.length > 0) {
    textoWhatsapp += `\n⚠️ *Regra Operacional da sua Região:*\n`;
    regrasEspeciais.forEach((r) => {
      textoWhatsapp += `• ${r.titulo}: ${r.descricao}\n`;
    });
  }

  return {
    cep: clean,
    formattedCep: formatCep(clean),
    logradouro,
    bairro,
    cidade,
    uf,
    ddd,
    isOnline,
    baseRecomendada: base,
    motivoRecomendacao: motivo,
    regrasEspeciais,
    textoWhatsapp,
  };
}
