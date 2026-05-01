import { llmComplete } from './_llm-client.js';

/**
 * Vercel Serverless Function: /api/motivate
 * Coach Alpha — mensajes personalizados según estado biométrico.
 * Failover automático: DeepSeek → Claude → OpenAI
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const hasAnyKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  if (!hasAnyKey) return res.status(500).json({ error: 'No hay clave LLM configurada.' });

  const { userProfile, checkinHoy, historialSemana = [], streakDias = 0, sesionHoy } = req.body;

  const hrv = checkinHoy?.hrv_manual ?? 55;
  const avgHrv = checkinHoy?.avg_hrv_7d ?? hrv;
  const battery = checkinHoy?.body_battery ?? 65;
  const tendenciaHrv = hrv >= avgHrv * 0.85 ? 'normal' : 'BAJA';
  const acwr = checkinHoy?.acwr;

  const adherencia = historialSemana.length
    ? Math.round((historialSemana.filter((a) => a.completada).length / historialSemana.length) * 100)
    : null;

  const diasRestantes = userProfile?.milestoneDate
    ? Math.max(0, Math.floor((new Date(userProfile.milestoneDate) - Date.now()) / 86400000))
    : 90;

  const prompt = `Eres "Coach Alpha", el entrenador y compañero de CoreAdapt.
Personalidad: directo, empático, técnico cuando necesario, nunca condescendiente.
Idioma: español.

ESTADO DEL ATLETA HOY:
- HRV: ${hrv}ms (tendencia: ${tendenciaHrv}, promedio 7d: ${avgHrv}ms)
- Body Battery: ${battery}%
- ACWR: ${acwr ?? 'sin datos'}
- Racha de check-ins: ${streakDias} días
${adherencia !== null ? `- Adherencia esta semana: ${adherencia}%` : ''}
- Días para el objetivo: ${diasRestantes}
${sesionHoy ? `- Sesión de hoy: ${sesionHoy.disciplina} — ${sesionHoy.objetivo_tecnico}` : ''}

REGLAS DE TONO (elige UNO basado en datos):
- HRV normal Y battery > 70% → "energizante": "hoy puedes más, ve por ello"
- HRV BAJA Y battery < 40% → "calmo": "recuperarse ES entrenar, sin presión"
- HRV BAJA O battery 40-70% → "moderado": "sesión controlada, escucha tu cuerpo"
- streakDias >= 7 → "celebrativo": menciona la racha con orgullo
- adherencia < 50% → "reconectado": reconectar con la meta sin juicio
- diasRestantes <= 7 → "épico": cuenta regresiva, momento decisivo
- diasRestantes 8-14 → "tapering": semana crítica, menos es más
- ACWR > 1.5 → "calmo" forzado, menciona el ratio de carga y la necesidad de recuperar

INSTRUCCIONES:
- Máximo 3 oraciones.
- Referencia concreta a los datos del atleta (nunca genérico).
- Nunca frases vacías como "¡Tú puedes!" sin contexto.
- Si hay sesión hoy, mencionarla específicamente.

Responde JSON:
{
  "mensaje": "...",
  "tono": "energizante|calmo|moderado|celebrativo|reconectado|épico|tapering",
  "accion_sugerida": "descripción breve de qué hacer ahora"
}`;

  try {
    const { content } = await llmComplete(
      [{ role: 'system', content: prompt }],
      { jsonMode: true }
    );
    return res.status(200).json(JSON.parse(content));
  } catch (error) {
    console.error('[motivate] error:', error);
    return res.status(500).json({ error: 'Error generando mensaje del Coach.' });
  }
}
