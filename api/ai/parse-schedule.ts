import { GoogleGenAI } from '@google/genai';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyBAcHBfqGRtMeiLLHB_0r-lm2kELi0eoHQ',
};
const ADMIN_EMAIL = 'jfs10219@hotmail.com';
const requestWindows = new Map<string, number[]>();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  try {
    const authorization = String(req.headers.authorization || '');
    const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!idToken) return res.status(401).json({ success: false, error: 'Autenticação obrigatória.' });

    const identityResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
    );
    if (!identityResponse.ok) return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada.' });

    const identityData: any = await identityResponse.json();
    const identity = identityData.users?.[0];
    if (!identity || String(identity.email || '').trim().toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) {
      return res.status(403).json({ success: false, error: 'Conta sem permissão para executar esta operação.' });
    }

    const now = Date.now();
    const recent = (requestWindows.get(identity.localId) || []).filter((timestamp) => now - timestamp < 60_000);
    if (recent.length >= 20) return res.status(429).json({ success: false, error: 'Limite temporário de análises atingido. Aguarde um minuto.' });
    recent.push(now);
    requestWindows.set(identity.localId, recent);

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!apiKey) return res.status(503).json({ success: false, error: 'Serviço de IA não configurado no servidor.' });

    const { imageBase64, textContent, providersList, year, month } = req.body || {};
    const targetYear = Number.isInteger(year) && year >= 2020 && year <= 2100 ? year : new Date().getFullYear();
    const targetMonth = Number.isInteger(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    if (!imageBase64 && !(typeof textContent === 'string' && textContent.trim())) {
      return res.status(400).json({ success: false, error: 'Envie uma imagem ou texto para análise.' });
    }
    if (!Array.isArray(providersList) || providersList.length === 0) {
      return res.status(400).json({ success: false, error: 'A lista de prestadores é obrigatória.' });
    }

    const providersSummary = providersList
      .filter((provider: any) => provider && typeof provider.id === 'string' && typeof provider.name === 'string')
      .map((provider: any) => `${provider.id}: ${provider.name}`)
      .join('\n');

    const systemPrompt = `
Você interpreta escalas de trabalho médicas e hospitalares.
Lista oficial de colaboradores:
${providersSummary}

Extraia somente plantões de ${targetMonth}/${targetYear}, dias 1 a ${daysInMonth}.
Não invente nomes, datas, turnos ou IDs. Se não houver certeza sobre um nome, não associe a pessoa.
Use somente T (trabalho), D (folga) ou HO (home office).
Retorne JSON válido nesta estrutura:
{
  "parsedAssignments": [
    {
      "providerId": "ID existente ou string vazia se incerto",
      "providerName": "nome lido",
      "date": "${targetYear}-${String(targetMonth).padStart(2, '0')}-01",
      "shiftCode": "T",
      "notes": "Importado via IA"
    }
  ]
}
`;

    const contents: any[] = [systemPrompt];
    if (textContent) contents.push(`Texto fornecido pelo usuário:\n${textContent}`);

    if (imageBase64) {
      if (typeof imageBase64 !== 'string' || imageBase64.length > 18_000_000) {
        return res.status(400).json({ success: false, error: 'Imagem inválida ou maior que o limite permitido.' });
      }
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const mimeType = mimeMatch?.[1] || 'image/jpeg';
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mimeType)) {
        return res.status(400).json({ success: false, error: 'Formato de imagem não suportado.' });
      }
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      contents.push({ inlineData: { mimeType, data: cleanBase64 } });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { responseMimeType: 'application/json' },
    });

    let data: any;
    try {
      data = JSON.parse(response.text || '');
    } catch {
      return res.status(502).json({ success: false, error: 'A IA retornou uma resposta inválida. Tente novamente.' });
    }
    if (!data || !Array.isArray(data.parsedAssignments)) {
      return res.status(502).json({ success: false, error: 'A resposta da IA não contém uma lista válida de plantões.' });
    }
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Erro no parser de escala:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Erro ao processar escala por IA.' });
  }
}
