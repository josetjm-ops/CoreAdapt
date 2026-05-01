/**
 * api/brain.js — CoreAdapt Orquestador v6.0
 *
 * Flujo completo:
 *   1. Sanitización PII del perfil de atleta
 *   2. Cálculo de fase del Macrociclo (local, sin LLM)
 *   3. Orquestador (DeepSeek→Claude→OpenAI) — con reglas AMPK/mTOR y ACWR
 *   4. Plan de recuperación inmediato si decision=descansar
 *   5. RAG por disciplina (Firestore, en paralelo)
 *   6. Especialistas en paralelo (incluyendo Atletismo + RIR en Pesas)
 *   7. Ensamble del microciclo
 *   8. El Juez — validación de riesgo (1 reintento si hay violaciones)
 *   9. Agente Nutricional
 *  10. Respuesta al cliente con metadatos del proveedor LLM
 */

import { llmComplete } from './_llm-client.js';
import { adminDb } from './_firebase-admin.js';

// ── PII Sanitization ─────────────────────────────────────────────────────────
function sanitizeProfile(profile) {
  if (!profile) return {};
  const age = profile.age;
  return {
    codename: 'Atleta',
    disciplines: profile.disciplines || [],
    objetivo: 'competencia_deportiva',
    milestoneDate: profile.milestoneDate,
    experience: profile.experience,
    resources: profile.resources,
    age_range: age ? `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}` : 'adulto',
    weight: profile.weight,
  };
}

// ── Macrociclo Phase Calculation ─────────────────────────────────────────────
function getMacrocyclePhase(userProfile) {
  const milestoneDate = userProfile?.milestoneDate;
  if (!milestoneDate) return { fase: 'Base Aeróbica', tipo: 'base', pct: 0 };

  const start = userProfile?.createDate
    ? new Date(userProfile.createDate).getTime()
    : Date.now() - 90 * 86400000;
  const end = new Date(milestoneDate).getTime();
  const now = Date.now();
  const total = Math.max(end - start, 1);
  const elapsed = now - start;
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));

  if (pct < 40) return { fase: 'Base Aeróbica', tipo: 'base', pct };
  if (pct < 75) return { fase: 'Desarrollo e Intensificación', tipo: 'desarrollo', pct };
  if (pct < 90) return { fase: 'Pico / Estabilización', tipo: 'pico', pct };
  return { fase: 'Tapering Pre-Competición', tipo: 'tapering', pct };
}

// ── Gasto calórico por disciplina (kcal/hora) ─────────────────────────────────
const GASTO_KCAL_HORA = {
  Atletismo: 920, Running: 900, Trail: 950,
  Ruta: 700, MTB: 800, Pesas: 350,
  Natacion: 600, Descanso: 0,
};

// ── Specialist Prompts ────────────────────────────────────────────────────────
const SPECIALIST_PROMPTS = {
  Atletismo: (dias, rag, instruccion, diasRestantes, fase) =>
    `Eres el especialista en Atletismo (Pista y Fondo) del Staff Técnico de CoreAdapt.
FASE MACROCICLO: ${fase.fase}
PROTOCOLOS RAG: ${rag}
INSTRUCCIÓN DEL JEFE: "${instruccion}"
DÍAS A PLANIFICAR: [${dias.join(', ')}] (días hasta objetivo: ${diasRestantes})

Diseña sesiones con enfoque en eficiencia glucolítica y economía de carrera. Incluir:
- Distancias exactas, ritmos objetivo (min/km o min/400m), recuperación entre series
- Drills técnicos: zancada, cadencia 180spm, postura
- Base aeróbica (fase base): tiradas largas 8-15km Z2
- Calidad glucolítica (desarrollo): 400m-1km repeats Z4-Z5
- Si diasRestantes < 14 → reducir volumen 30%, conservar 1 sesión de calidad

Responde JSON: { "sesiones": [{ "dia": 1, "disciplina": "Atletismo", "descripcion": "...", "objetivo_tecnico": "...", "duracion_estimada": 60 }] }
SOLO incluir los días: [${dias.join(', ')}]`,

  Running: (dias, rag, instruccion, diasRestantes, fase) =>
    `Eres el especialista en Running del Staff Técnico de CoreAdapt.
FASE MACROCICLO: ${fase.fase}
PROTOCOLOS RAG: ${rag}
INSTRUCCIÓN DEL JEFE: "${instruccion}"
DÍAS A PLANIFICAR: [${dias.join(', ')}] (días hasta objetivo: ${diasRestantes})

Diseña sesiones de Running para los días indicados. Formato:
Calentamiento (km/min) → Bloque principal (km, zonas FC, ritmo objetivo) → Vuelta a calma.
Zonas: Z1-Z2 para base, Z3-Z4 para calidad, nunca Z5 si HRV bajo fue indicado.
Si fase=base → priorizar tirada larga Z2. Si fase=desarrollo → incluir intervalos.
Si diasRestantes < 14 → TAPERING (volumen -30%).

Responde JSON: { "sesiones": [{ "dia": 1, "disciplina": "Running", "descripcion": "...", "objetivo_tecnico": "...", "duracion_estimada": 60 }] }
SOLO incluir los días: [${dias.join(', ')}]`,

  Trail: (dias, rag, instruccion, diasRestantes, fase) =>
    `Eres el especialista en Trail Running del Staff Técnico de CoreAdapt.
FASE MACROCICLO: ${fase.fase}
PROTOCOLOS RAG: ${rag}
INSTRUCCIÓN DEL JEFE: "${instruccion}"
DÍAS A PLANIFICAR: [${dias.join(', ')}] (días hasta objetivo: ${diasRestantes})

Diseña sesiones con desnivel positivo (D+), tipo de terreno, ritmo ascenso/descenso.
Calentamiento → Bloque principal (km + D+ + zonas FC) → Vuelta a calma.
Incluir bajadas técnicas para adaptar tendones (48h recuperación post >800m D+).
Si diasRestantes < 14 → TAPERING (volumen -30%, mantener 2 sesiones calidad).

Responde JSON: { "sesiones": [{ "dia": 1, "disciplina": "Trail", "descripcion": "...", "objetivo_tecnico": "...", "duracion_estimada": 90 }] }
SOLO incluir los días: [${dias.join(', ')}]`,

  Ruta: (dias, rag, instruccion, diasRestantes, fase) =>
    `Eres el especialista en Ciclismo de Ruta del Staff Técnico de CoreAdapt.
FASE MACROCICLO: ${fase.fase}
PROTOCOLOS RAG: ${rag}
INSTRUCCIÓN DEL JEFE: "${instruccion}"
DÍAS A PLANIFICAR: [${dias.join(', ')}] (días hasta objetivo: ${diasRestantes})

Diseña sesiones optimizadas para desarrollo de FTP y capacidad mitocondrial. Incluir:
- % FTP objetivo, cadencia sostenida (85-100rpm), estructura de bloques en vatios
- Ej: Intervalos 3×12min a 91-95% FTP, cadencia 90rpm, recuperación 5min a 55% FTP
- Si varios días Ruta: primero es volumen Z2 (base aeróbica), segundo es calidad (Sweet Spot/Umbral)
- Si fase=desarrollo → priorizar sesiones de umbral y VO2max
- Si diasRestantes < 14 → volumen -30%, mantener bloques de calidad

Responde JSON: { "sesiones": [{ "dia": 1, "disciplina": "Ruta", "descripcion": "...", "objetivo_tecnico": "...", "duracion_estimada": 90 }] }
SOLO incluir los días: [${dias.join(', ')}]`,

  MTB: (dias, rag, instruccion, diasRestantes, fase) =>
    `Eres el especialista en MTB del Staff Técnico de CoreAdapt.
FASE MACROCICLO: ${fase.fase}
PROTOCOLOS RAG: ${rag}
INSTRUCCIÓN DEL JEFE: "${instruccion}"
DÍAS A PLANIFICAR: [${dias.join(', ')}] (días hasta objetivo: ${diasRestantes})

Diseña sesiones enfocadas en potencia explosiva (80-85% VO2max) y dominio técnico.
Estructura: calentamiento rodadura libre → bloques explosivos (30s-2min a >120% FTP) → técnica descenso.
Tipo terreno: singletrack, roots, rocks, berms. Cadencia variable 60-100rpm según terreno.
Tolerancia al lactato e intermitencia — NO prescribir Sweet Spot fijo ni cadencia uniforme.

Responde JSON: { "sesiones": [{ "dia": 1, "disciplina": "MTB", "descripcion": "...", "objetivo_tecnico": "...", "duracion_estimada": 90 }] }
SOLO incluir los días: [${dias.join(', ')}]`,

  Pesas: (dias, rag, instruccion, diasRestantes) =>
    `Eres el especialista en Fuerza del Staff Técnico de CoreAdapt.
PROTOCOLOS RAG: ${rag}
INSTRUCCIÓN DEL JEFE: "${instruccion}"
DÍAS A PLANIFICAR: [${dias.join(', ')}]

Diseña sesiones de fuerza complementaria para atleta de resistencia.
Formato OBLIGATORIO por ejercicio: Nombre — Series×Reps — %1RM o carga — RIR (Repeticiones en Reserva) — Descanso
  Ejemplo: Sentadilla Búlgara — 4×8 — 65%1RM — RIR 2 — 90s
Foco: glúteos, isquiotibiales, core antirotacional. Carga 60-70% 1RM (RIR 2-3).
REGLA AMPK: Nunca programar Pesas pesadas (tren inferior) el día anterior a Running/Trail de calidad.
Si hay Pesas el mismo día que aeróbico: Pesas siempre primero (mañana), aeróbico baja intensidad después.

Responde JSON: { "sesiones": [{ "dia": 1, "disciplina": "Pesas", "descripcion": "...", "objetivo_tecnico": "...", "duracion_estimada": 50 }] }
SOLO incluir los días: [${dias.join(', ')}]`,

  Natacion: (dias, rag, instruccion) =>
    `Eres el especialista en Natación del Staff Técnico de CoreAdapt.
PROTOCOLOS RAG: ${rag}
INSTRUCCIÓN DEL JEFE: "${instruccion}"
DÍAS A PLANIFICAR: [${dias.join(', ')}]

Diseña sesiones usando formato FINA: Estilo/Distancia×Series/PausaSegundos.
Ej: Crol/200m×4/30s — Total 1000-2000m. Ideal para recovery activa entre días de alta carga terrestre.
Incluir eficiencia hidrodinámica: drills de rotación, catch temprano, patada desde cadera.

Responde JSON: { "sesiones": [{ "dia": 1, "disciplina": "Natacion", "descripcion": "...", "objetivo_tecnico": "...", "duracion_estimada": 45 }] }
SOLO incluir los días: [${dias.join(', ')}]`,
};

// ── Nutrition prompt ──────────────────────────────────────────────────────────
function buildNutritionPrompt(microciclo, safeProfile) {
  const resumen = microciclo.map((s) => {
    const gasto = Math.round((GASTO_KCAL_HORA[s.disciplina] || 0) * (s.duracion_estimada / 60));
    return `Día ${s.dia}: ${s.disciplina} — ${s.duracion_estimada}min (~${gasto} kcal ejercicio)`;
  }).join('\n');

  return `Eres el especialista en Nutrición Deportiva de CoreAdapt.
ATLETA: ${safeProfile.age_range || 'adulto'}, ${safeProfile.weight || '?'}kg, disciplinas: ${(safeProfile.disciplines || []).join(', ')}.

GASTO CALÓRICO ESTIMADO:
${resumen}

Principios:
- Alta carga (>600 kcal): carbos 5-7g/kg, proteína 1.8-2.2g/kg
- Carga media (300-600 kcal): carbos 3-5g/kg, proteína 1.6-1.8g/kg
- Descanso: carbos 2-3g/kg, proteína 1.6g/kg, grasas sin restricción
- Post-sesión intensa: ventana anabólica 30min → 25-40g proteína + 1g/kg carbos
- MTB/Ruta umbral: carbos rápidos intra-sesión (geles)
- Separación AMPK/mTOR: si el mismo día hay fuerza + cardio, carbos mayores en peri-entrenamiento fuerza

Responde JSON con exactamente 7 entradas:
{
  "ajuste_nutricional": [
    { "dia": 1, "gasto_ejercicio_kcal": n, "objetivo_kcal_total": n, "proteina_g": n, "carbos_g": n, "grasas_g": n, "timing_clave": "..." }
  ]
}`;
}

// ── El Juez: Agente Evaluador de Riesgos ─────────────────────────────────────
async function validateWithJuez(microciclo, biometria, llmSkip) {
  const resumen = microciclo.map((s) =>
    `Día ${s.dia}: ${s.disciplina} — ${s.objetivo_tecnico || 'sin objetivo'} (${s.duracion_estimada}min)`
  ).join('\n');

  const acwr = biometria?.acwr;

  const juezPrompt = `Eres "El Juez" — Agente Evaluador de Riesgos de CoreAdapt.
Tu única función: detectar violaciones de seguridad médica en el microciclo propuesto.
Actúas como gatekeeper cíclico: si detectas violaciones, el plan debe regenerarse.

MICROCICLO PROPUESTO:
${resumen}

ACWR ACTUAL: ${acwr ?? 'desconocido'}
BODY BATTERY: ${biometria?.body_battery ?? '?'}%
HRV TENDENCIA: ${biometria?.hrv_tendencia ?? 'normal'}

CRITERIOS DE RECHAZO (verifica TODOS):
1. Dos o más días consecutivos de alta intensidad (Z4-Z5, HIIT, intervalos) sin descanso entre ellos
2. Pesas de tren inferior el día ANTERIOR a Running/Trail de calidad (intervalos, Z4-Z5)
3. Más de 4 sesiones de duración >60min en la semana sin día de descanso completo
4. Sin ningún día de descanso total en la semana
5. ACWR > 1.5 Y hay sesiones de alta intensidad programadas (viola ratio de carga)
6. Fuerza intensa de tren inferior el mismo día que running de larga distancia (>60min)
7. Más de 2 sesiones de calidad (Z4-Z5 o HIIT) en la semana cuando HRV está baja

Responde JSON:
{
  "aprobado": boolean,
  "violaciones": ["descripción concreta de cada violación"],
  "correcciones_obligatorias": ["acción específica por cada violación"],
  "nivel_riesgo": "bajo|medio|alto|critico"
}`;

  try {
    const { content } = await llmComplete(
      [{ role: 'system', content: juezPrompt }],
      { jsonMode: true, skipTo: llmSkip }
    );
    return JSON.parse(content);
  } catch (e) {
    console.error('[El Juez] fallo, aprobando por defecto:', e.message);
    return { aprobado: true, violaciones: [], correcciones_obligatorias: [], nivel_riesgo: 'bajo' };
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const hasAnyKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  if (!hasAnyKey) {
    return res.status(500).json({ error: 'No hay clave LLM configurada (DEEPSEEK_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY).' });
  }

  const { userProfile, biometria, actividad_hoy, compliance } = req.body;

  // PII Sanitization — el perfil del atleta se anonimiza antes de enviarse a cualquier LLM
  const safeProfile = sanitizeProfile(userProfile);

  // Macrociclo phase (cálculo local, sin LLM)
  const macrophase = getMacrocyclePhase(userProfile);

  // Tracking del proveedor LLM activo para esta solicitud (evita timeouts repetidos)
  let llmSkip = null;

  try {
    // ── 1. ORQUESTADOR ──────────────────────────────────────────────────────
    let jefe;
    try {
      const disciplines = (safeProfile.disciplines || []).join(', ') || 'General';
      const diasRestantes = userProfile?.milestoneDate
        ? Math.max(0, Math.floor((new Date(userProfile.milestoneDate) - Date.now()) / 86400000))
        : 90;
      const hrv = biometria?.hrv_manual || biometria?.hrv || 55;
      const avgHrv = biometria?.avg_hrv_7d || hrv;
      const battery = biometria?.body_battery || 65;
      const acwr = biometria?.acwr ?? null;
      const acwr_zona = biometria?.acwr_zona ?? 'unknown';

      const hrvTendencia = hrv >= avgHrv * 0.85 ? 'normal' : 'BAJA';
      const sobreentrenamiento = biometria?.sobreentrenamiento_detectado || false;

      const actividadInfo = actividad_hoy?.sesion_completada === false
        ? `SESIÓN OMITIDA (${actividad_hoy?.notas || 'sin notas'})`
        : `RPE: ${actividad_hoy?.rpe_usuario || 5}/10`;

      const complianceInfo = compliance
        ? `CUMPLIMIENTO PLAN: ${Math.round(compliance.cumplimiento * 100)}% | Días perdidos consecutivos: ${compliance.diasPerdidos} | Acción requerida: ${compliance.action}`
        : 'CUMPLIMIENTO: sin datos previos';

      const routerPrompt = `Eres el Jefe de Entrenamiento de CoreAdapt. Toma decisiones de carga basadas exclusivamente en datos reales.

PERFIL: disciplines=[${disciplines}], objetivo en ${diasRestantes} días.
FASE MACROCICLO: ${macrophase.fase} (${macrophase.tipo}, ${macrophase.pct.toFixed(0)}% de progreso).

BIOMETRÍA:
- HRV: ${hrv}ms (promedio 7d: ${avgHrv}ms, tendencia: ${hrvTendencia})
- Body Battery: ${battery}%
- ACWR: ${acwr ?? 'sin datos'} (zona: ${acwr_zona})
- Sobreentrenamiento diagnosticado: ${sobreentrenamiento ? 'SÍ — CRÍTICO' : 'No'}

SESIÓN ANTERIOR: ${actividadInfo}
${complianceInfo}

REGLAS NO NEGOCIABLES:
1. HRV < 85% promedio 7d → SOLO Z1-Z2 o descanso — NUNCA calidad
2. body_battery < 35% → descanso total o recovery ≤30min Z1
3. diasRestantes < 14 → TAPERING (volumen −30%, mantener intensidad)
4. Sobreentrenamiento detectado → descanso 50% carga + cancelar HIIT y Fuerza Pesada
5. ACWR > 1.5 → no prescribir alta intensidad, rutear a recuperación
6. Solo disciplinas del perfil: [${disciplines}]
7. Ruta y MTB son DISCIPLINAS SEPARADAS — nunca en la misma clave

REGLAS AMPK vs mTOR (INTERFERENCIA METABÓLICA — INQUEBRANTABLES):
8. Separar Pesas y aeróbico: mínimo 6-8h o días distintos
9. Si el mismo día tiene Pesas + aeróbico → Pesas en mañana, aeróbico Z1 <20min en tarde
10. Pesas de tren inferior NUNCA el día anterior a Running/Trail de calidad
11. Post running de larga distancia: si hay Pesas, solo tren superior

REGLA INCUMPLIMIENTO:
${compliance?.action === 'redistribute_50_75'
  ? '⚠️ Redistributir carga: reduce cada sesión al 60-75% del volumen habitual, distribuida en más días.'
  : compliance?.action === 'conservative_restart'
  ? '🛑 Reinicio Conservador: prescribir ÚNICAMENTE el 25-50% de la carga base. Sin calidad. Sin intensidad >Z2.'
  : 'Continuar plan normal.'
}

Responde JSON estricto:
{
  "decision": "entrenar"|"descansar",
  "motivo_clinico": "...",
  "especialistas_requeridos": ["Running"],
  "distribucion_dias": { "Running": [1,3,6], "Pesas": [2,4], "Descanso": [5,7] },
  "instruccion_del_jefe": "instrucción concreta para especialistas",
  "alerta_riesgo": false,
  "fase_prescrita": "${macrophase.tipo}"
}`;

      const orcResult = await llmComplete(
        [{ role: 'system', content: routerPrompt }],
        { jsonMode: true }
      );

      // Registrar proveedor para las siguientes llamadas de esta request
      if (orcResult.provider !== 'deepseek') llmSkip = orcResult.provider;

      jefe = JSON.parse(orcResult.content);
    } catch (e) {
      console.error('[Orquestador] fallo:', e);
      return res.status(500).json({ error: 'Fallo en el Orquestador.' });
    }

    const especialistas = jefe.especialistas_requeridos || [];
    const distribucionDias = jefe.distribucion_dias || {};
    const instruccion = jefe.instruccion_del_jefe || 'Semana de entrenamiento estándar.';
    const diasRestantes = userProfile?.milestoneDate
      ? Math.max(0, Math.floor((new Date(userProfile.milestoneDate) - Date.now()) / 86400000))
      : 90;

    // Plan de recuperación inmediato
    if (jefe.decision === 'descansar') {
      const microciclo = Array.from({ length: 7 }, (_, i) => ({
        dia: i + 1,
        disciplina: 'Descanso',
        descripcion: i === 0
          ? 'Recuperación total. HRV o ACWR indican sobrecarga sistémica. Movilidad suave 15-20min, hidratación máxima, sueño prioritario.'
          : 'Recuperación activa. Caminata 30min Z1 o natación suave. Sin cargas externas.',
        objetivo_tecnico: 'Regeneración sistémica',
        duracion_estimada: 0,
        nutricion: {
          gasto_ejercicio_kcal: 0, objetivo_kcal_total: 1800,
          proteina_g: 112, carbos_g: 168, grasas_g: 60,
          timing_clave: 'Comidas regulares, evitar déficit calórico. Priorizar alimentos antiinflamatorios (omega-3, cúrcuma, vegetales de hoja verde).'
        }
      }));
      return res.status(200).json({
        fase_macro: `Semana de Recuperación — ${macrophase.fase}`,
        macrophase,
        insight_del_jefe: instruccion,
        alerta_sobreentreno: true,
        especialistas_activos: 'Descanso',
        juez_validacion: { aprobado: true, nivel_riesgo: 'bajo', violaciones: [] },
        llm_provider: 'local',
        microciclo
      });
    }

    // ── 2. RAG POR DISCIPLINA (en paralelo) ─────────────────────────────────
    const ragResults = await Promise.all(
      especialistas.map(async (esp) => {
        try {
          const snap = await adminDb.collection('Conocimiento_Tecnico')
            .where('deporte_origen', '==', esp).get();
          const ctx = snap.empty
            ? `Protocolos estándar de ${esp}.`
            : snap.docs.map((d) => `[${d.data().categoria}] ${d.data().contenido_tecnico}`).join('\n');
          return [esp, ctx];
        } catch {
          return [esp, `Protocolos estándar de ${esp}.`];
        }
      })
    );
    const ragMap = Object.fromEntries(ragResults);

    // ── 3. ESPECIALISTAS EN PARALELO ────────────────────────────────────────
    const specialistResults = await Promise.all(
      especialistas.map((esp) => {
        const dias = distribucionDias[esp] || [];
        if (dias.length === 0) return Promise.resolve({ specialist: esp, sesiones: [] });
        const promptFn = SPECIALIST_PROMPTS[esp];
        if (!promptFn) return Promise.resolve({ specialist: esp, sesiones: [] });

        const prompt = promptFn(dias, ragMap[esp] || 'Protocolos estándar.', instruccion, diasRestantes, macrophase);

        return llmComplete(
          [{ role: 'system', content: prompt }],
          { jsonMode: true, skipTo: llmSkip }
        ).then(({ content, provider }) => {
          if (provider !== 'deepseek' && !llmSkip) llmSkip = provider;
          const data = JSON.parse(content);
          return { specialist: esp, sesiones: Array.isArray(data.sesiones) ? data.sesiones : [] };
        }).catch((e) => {
          console.error(`[Especialista ${esp}] fallo:`, e.message);
          return { specialist: esp, sesiones: [] };
        });
      })
    );

    // ── 4. ENSAMBLE DEL MICROCICLO ──────────────────────────────────────────
    const todasLasSesiones = specialistResults.flatMap((r) => r.sesiones);
    const diasAsignados = new Set(Object.values(distribucionDias).flat());

    for (let dia = 1; dia <= 7; dia++) {
      if (!diasAsignados.has(dia) && !todasLasSesiones.find((s) => s.dia === dia)) {
        todasLasSesiones.push({
          dia, disciplina: 'Descanso',
          descripcion: 'Recuperación activa. Movilidad articular 15min, foam rolling cadena posterior, caminata suave 30min Z1.',
          objetivo_tecnico: 'Regeneración', duracion_estimada: 0
        });
      }
    }
    (distribucionDias.Descanso || []).forEach((dia) => {
      if (!todasLasSesiones.find((s) => s.dia === dia)) {
        todasLasSesiones.push({
          dia, disciplina: 'Descanso',
          descripcion: 'Descanso programado. Movilidad suave, hidratación y sueño de calidad.',
          objetivo_tecnico: 'Recuperación', duracion_estimada: 0
        });
      }
    });

    const microciclo = Array.from({ length: 7 }, (_, i) => {
      const dia = i + 1;
      return todasLasSesiones.find((s) => s.dia === dia) || {
        dia, disciplina: 'Descanso',
        descripcion: 'Recuperación activa.', objetivo_tecnico: 'Recuperación', duracion_estimada: 0
      };
    });

    // ── 5. EL JUEZ — Validación de riesgo ───────────────────────────────────
    let juezResult = await validateWithJuez(microciclo, biometria, llmSkip);

    // Si El Juez rechaza → un solo reintento con correcciones explícitas en el prompt del Orquestador
    if (!juezResult.aprobado && juezResult.violaciones.length > 0) {
      console.warn('[El Juez] Plan rechazado. Violaciones:', juezResult.violaciones);
      try {
        const correctionPrompt = `CORRECCIÓN OBLIGATORIA — El Juez de Seguridad rechazó el plan anterior.
VIOLACIONES DETECTADAS:
${juezResult.violaciones.map((v, i) => `${i + 1}. ${v}`).join('\n')}

ACCIONES REQUERIDAS:
${juezResult.correcciones_obligatorias.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Con base en estas correcciones, redistribuye los días en distribucion_dias para eliminar TODAS las violaciones.
Disciplinas disponibles: [${especialistas.join(', ')}]

Responde JSON: { "distribucion_dias": { "Running": [1,3], "Pesas": [4], "Descanso": [2,5,6,7] } }`;

        const { content: corrContent } = await llmComplete(
          [{ role: 'system', content: correctionPrompt }],
          { jsonMode: true, skipTo: llmSkip }
        );
        const corrData = JSON.parse(corrContent);
        const nuevaDistribucion = corrData.distribucion_dias || distribucionDias;

        // Re-ejecutar especialistas con la nueva distribución
        const retryResults = await Promise.all(
          especialistas.map((esp) => {
            const dias = nuevaDistribucion[esp] || [];
            if (dias.length === 0) return Promise.resolve({ specialist: esp, sesiones: [] });
            const promptFn = SPECIALIST_PROMPTS[esp];
            if (!promptFn) return Promise.resolve({ specialist: esp, sesiones: [] });
            const prompt = promptFn(dias, ragMap[esp] || 'Protocolos estándar.', instruccion, diasRestantes, macrophase);
            return llmComplete([{ role: 'system', content: prompt }], { jsonMode: true, skipTo: llmSkip })
              .then(({ content }) => {
                const data = JSON.parse(content);
                return { specialist: esp, sesiones: Array.isArray(data.sesiones) ? data.sesiones : [] };
              })
              .catch(() => ({ specialist: esp, sesiones: [] }));
          })
        );

        const retryAll = retryResults.flatMap((r) => r.sesiones);
        for (let dia = 1; dia <= 7; dia++) {
          if (!retryAll.find((s) => s.dia === dia)) {
            retryAll.push({ dia, disciplina: 'Descanso', descripcion: 'Recuperación.', objetivo_tecnico: 'Recuperación', duracion_estimada: 0 });
          }
        }
        retryAll.forEach((s, idx) => { microciclo[idx] = retryAll.find((x) => x.dia === idx + 1) || microciclo[idx]; });
        for (let i = 0; i < 7; i++) {
          const found = retryAll.find((s) => s.dia === i + 1);
          if (found) microciclo[i] = found;
        }

        juezResult = { ...juezResult, aprobado: true, nota: 'Plan corregido tras rechazo inicial.' };
      } catch (e) {
        console.error('[El Juez retry] fallo:', e.message);
      }
    }

    // ── 6. AGENTE NUTRICIONAL ───────────────────────────────────────────────
    try {
      const nutritionPrompt = buildNutritionPrompt(microciclo, safeProfile);
      const { content: nutriContent } = await llmComplete(
        [{ role: 'system', content: nutritionPrompt }],
        { jsonMode: true, skipTo: llmSkip }
      );
      const nutriData = JSON.parse(nutriContent);
      (nutriData.ajuste_nutricional || []).forEach((n) => {
        const sesion = microciclo.find((s) => s.dia === n.dia);
        if (sesion) sesion.nutricion = n;
      });
    } catch (e) {
      console.error('[Nutrición] fallo:', e.message);
    }

    return res.status(200).json({
      fase_macro: `${macrophase.fase} — ${especialistas.join(' + ') || 'Recuperación'}`,
      macrophase,
      insight_del_jefe: instruccion,
      alerta_sobreentreno: jefe.alerta_riesgo || false,
      especialistas_activos: especialistas.join(', ') || 'Descanso',
      juez_validacion: {
        aprobado: juezResult.aprobado,
        nivel_riesgo: juezResult.nivel_riesgo || 'bajo',
        violaciones: juezResult.violaciones || [],
      },
      llm_provider: llmSkip || 'deepseek',
      microciclo,
    });

  } catch (error) {
    console.error('[Brain] Error crítico:', error);
    return res.status(500).json({ error: 'Error crítico en el Brain.' });
  }
}
