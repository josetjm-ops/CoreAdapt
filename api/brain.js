import OpenAI from "openai";

/**
 * Vercel Serverless Function: /api/brain
 * Versión 2.2: Estructura JSON estricta y protección contra fallos.
 */

const PROJECT_ID = "coreadapt-d7f0d";
const API_KEY = "AIzaSyCxt7rOulp5bbKFW8PkNhU2SU-5Tl3CPbo";
const URL_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Conocimiento_Tecnico`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: "Falta DEEPSEEK_API_KEY en el servidor." });
  }

  const { userProfile, biometria, actividad_hoy, disponibilidad } = req.body;

  const llm = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  try {
    // 1. ORQUESTADOR
    let jefe;
    try {
        const actividadInfo = actividad_hoy?.rutina_completada === false 
          ? "ATENCIÓN: EL USUARIO REPORTÓ QUE HOY NO PUDO ENTRENAR (SE SALTÓ LA SESIÓN)."
          : `Último esfuerzo (RPE): \${actividad_hoy?.rpe_usuario || 5}/10`;

        const routerPrompt = `Eres el "Jefe de Entrenamiento" de CoreAdapt.
        Objetivo: \${userProfile?.milestone}. Biometría: HRV \${biometria?.hrv}, BB \${biometria?.body_battery}.
        Reporte de la Sesión: \${actividadInfo}
        Si el usuario NO pudo entrenar, debes adaptar el plan futuro (ej: decidir si mover la sesión para mañana u ordenar recuperación activa).
        Responde JSON estricto: {"decision":"entrenar"|"descansar", "especialistas_requeridos":["Running"], "instruccion_del_jefe":"..."}`;

        const r1 = await llm.chat.completions.create({
          messages: [{ role: "system", content: routerPrompt }],
          model: "deepseek-chat",
          response_format: { type: 'json_object' }
        });
        jefe = JSON.parse(r1.choices[0].message.content);
    } catch (e) {
        console.error("Fallo Orquestador:", e);
        return res.status(500).json({ error: "Fallo en el Orquestador." });
    }

    if (!jefe.especialistas_requeridos) jefe.especialistas_requeridos = [];

    // 2. RAG
    let contextoRAG = "Protocolos estándar.";
    try {
        if (jefe.decision === "entrenar" && jefe.especialistas_requeridos.length > 0) {
          const getRes = await fetch(`\${URL_BASE}?key=\${API_KEY}&pageSize=1000`);
          if (getRes.ok) {
            const data = await getRes.json();
            const docs = data.documents || [];
            const reglas = docs.filter(d => jefe.especialistas_requeridos.includes(d.fields?.deporte_origen?.stringValue));
            if (reglas.length > 0) {
              contextoRAG = reglas.map(r => `[\${r.fields.deporte_origen.stringValue}] \${r.fields.categoria.stringValue}: \${r.fields.contenido_tecnico.stringValue}`).join('\n');
            }
          }
        }
    } catch (e) {
        console.error("Fallo RAG:", e);
    }

    // 3. STAFF TÉCNICO
    try {
        const staffPrompt = `Eres el Staff Técnico de CoreAdapt (\${jefe.especialistas_requeridos.join(', ')}).
        REGLAMENTO RAG: \${contextoRAG} | ORDEN DEL JEFE: "\${jefe.instruccion_del_jefe}"
        
        MANDATORIO FINAL: Diseña un microciclo de EXACTAMENTE 7 DÍAS basado en las reglas del RAG. 
        Tu respuesta debe ser EXCLUSIVAMENTE un JSON con esta estructura exacta (no cambies mayúsculas ni nombres, todo minúscula excepto valores):
        {
          "fase_macro": "Ej: Construcción Semanas 1 a 8",
          "insight_del_jefe": "\${jefe.instruccion_del_jefe}",
          "alerta_sobreentreno": \${jefe.decision !== "entrenar"},
          "especialistas_activos": "\${jefe.especialistas_requeridos.join(', ') || 'Descanso'}",
          "microciclo": [
            {
              "dia": 1,
              "disciplina": "Ej. Running, MTB, Trail, Descanso, Fuerza",
              "descripcion": "Descripción larga con las instrucciones técnicas sacadas del RAG",
              "objetivo_tecnico": "Objetivo principal",
              "duracion_estimada": 60
            }
            // ... Generar EXACTAMENTE 7 objetos aquí, uno para cada día de la semana.
          ]
        }`;

        const r2 = await llm.chat.completions.create({
          messages: [{ role: "system", content: staffPrompt }],
          model: "deepseek-chat",
          response_format: { type: 'json_object' }
        });

        const finalResponse = JSON.parse(r2.choices[0].message.content);
        return res.status(200).json(finalResponse);
    } catch (e) {
        console.error("Fallo Staff:", e);
        return res.status(500).json({ error: "Fallo en el Staff (Malformed JSON)." });
    }

  } catch (error) {
    console.error("Global Brain Error:", error);
    res.status(500).json({ error: "Error critico final." });
  }
}
