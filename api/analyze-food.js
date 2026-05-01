import { llmComplete } from './_llm-client.js';

/**
 * Vercel Serverless Function: /api/analyze-food
 * Analiza alimentos (imagen o descripción) y estima macronutrientes.
 *
 * Para análisis de imagen: usa DeepSeek o GPT-4o (Claude Haiku no soporta visión en este contexto).
 * Para análisis textual: failover completo DeepSeek → Claude → OpenAI.
 */

const JSON_SCHEMA = `{
  "nombre": "nombre del alimento",
  "emoji": "emoji representativo (1 carácter)",
  "porcion": "descripción de porción (ej: 1 plato, 200g)",
  "kcal": número,
  "proteina_g": número,
  "carbos_g": número,
  "grasas_g": número,
  "tag": "Pre-Entreno|Post-Run|Almuerzo|Cena|Desayuno|Snack",
  "confianza": "alta|media|baja"
}`;

const SYSTEM_PROMPT = `Eres un nutricionista especialista en deportes de resistencia.
Tu tarea: identificar alimentos y estimar macronutrientes con precisión clínica para atletas.
Responde SOLO con JSON válido, sin texto adicional, sin markdown.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const hasAnyKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  if (!hasAnyKey) return res.status(500).json({ error: 'No hay clave LLM configurada.' });

  const { imageBase64, descripcion } = req.body;

  if (!imageBase64 && !descripcion) {
    return res.status(400).json({ error: 'Proporciona imageBase64 o descripcion del alimento.' });
  }

  // ── Análisis con imagen ─────────────────────────────────────────────────────
  if (imageBase64) {
    // Primero intentar con DeepSeek (puede no soportar visión, fallback a OpenAI GPT-4o)
    const visionProviders = [];
    if (process.env.DEEPSEEK_API_KEY) visionProviders.push('deepseek');
    if (process.env.OPENAI_API_KEY) visionProviders.push('openai');

    for (const provider of visionProviders) {
      try {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI(
          provider === 'deepseek'
            ? { apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com' }
            : { apiKey: process.env.OPENAI_API_KEY }
        );
        const model = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini';

        const r = await client.chat.completions.create({
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
                { type: 'text', text: `Analiza este alimento. Responde JSON:\n${JSON_SCHEMA}` },
              ],
            },
          ],
        });

        return res.status(200).json(JSON.parse(r.choices[0].message.content));
      } catch (e) {
        console.warn(`[analyze-food vision] ${provider} falló:`, e.message);
        if (e.message?.includes('vision') || e.status === 400) continue;
      }
    }

    // Si visión falla en todos los proveedores → solicitar descripción textual
    return res.status(422).json({
      error: 'vision_not_supported',
      mensaje: 'Describe el alimento con palabras y lo estimamos para ti.',
    });
  }

  // ── Análisis textual con failover completo ──────────────────────────────────
  try {
    const userMsg = `El atleta describe este alimento: "${descripcion}"
Estima los macronutrientes para una porción individual típica.
Responde JSON:\n${JSON_SCHEMA}`;

    const { content } = await llmComplete(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
      { jsonMode: true }
    );

    return res.status(200).json(JSON.parse(content));
  } catch (error) {
    console.error('[analyze-food text] error:', error);
    return res.status(500).json({ error: 'Error analizando el alimento.' });
  }
}
