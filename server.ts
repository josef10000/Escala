import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '20mb' }));

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Server-side AI endpoint to parse schedule from images or text without user needing an API key
app.post('/api/ai/parse-schedule', async (req, res) => {
  try {
    const { imageBase64, textContent, providersList } = req.body;

    const providersSummary = (providersList || []).map((p: any) => `${p.id}: ${p.name}`).join('\n');

    const systemPrompt = `
Você é um assistente especialista em interpretar escalas de trabalho médicas e hospitalares.
Abaixo está a lista oficial de colaboradores cadastrados na equipe:
${providersSummary}

Sua tarefa é analisar a foto/imagem da escala ou o texto colado e extrair os plantões identificados para Outubro de 2026 (dias 1 a 31).

Instruções importantes:
1. Associe cada nome na imagem ao colaborador correspondente na lista (se houver correspondência).
2. Identifique os dias em que o colaborador TRABALHA ("T"), FOLGA ("D") ou fica em HOME OFFICE ("HO").
3. Retorne no formato JSON válido exatamente com esta estrutura:
{
  "parsedAssignments": [
    {
      "providerId": "prov-1",
      "providerName": "DANIEL ANTONIO DA SILVA",
      "date": "2026-10-01",
      "shiftCode": "T",
      "notes": "Importado via IA"
    }
  ]
}
`;

    const contents: any[] = [systemPrompt];

    if (textContent) {
      contents.push(`Texto da escala fornecido pelo usuário:\n${textContent}`);
    }

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text || '{}';
    let jsonResult = {};
    try {
      jsonResult = JSON.parse(responseText);
    } catch {
      jsonResult = { parsedAssignments: [] };
    }

    res.json({ success: true, data: jsonResult });
  } catch (error: any) {
    console.error('Error in AI parse-schedule:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro ao processar imagem por IA' });
  }
});

// Vite middleware for dev
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true, host: true, port: 3000 },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
