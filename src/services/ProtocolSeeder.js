import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Protocolos Maestros Alpha v3.0
 *
 * CRÍTICO: deporte_origen debe coincidir exactamente con los valores del Orquestador:
 * "Atletismo" | "Running" | "Trail" | "Ruta" | "MTB" | "Pesas" | "Natacion" | "General"
 */
const PROTOCOLS = [
  // ── Atletismo ─────────────────────────────────────────────────────────────
  {
    deporte_origen: 'Atletismo',
    categoria: 'Zonas_FC_Atletismo',
    subcategoria: 'Fisiologia_Glucolitica',
    contenido_tecnico: 'Atletismo pista/fondo: Z1 (50-60% FC) recuperación; Z2 (60-70%) base aeróbica; Z3 (70-80%) tempo; Z4 (80-90%) umbral glucolítico 400-1000m; Z5 (90-100%) VO2Max sprints. Economía de carrera: cadencia objetivo 180spm, postura erguida, apoyo de mediopié. Regla: nunca Z5 con HRV < 85% promedio.',
    etiquetas: ['atletismo', 'fc', 'glucolisis', 'cadencia'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'Atletismo',
    categoria: 'Intervalos_Pista',
    subcategoria: 'Calidad_Velocidad',
    contenido_tecnico: 'Sesiones de intervalos en pista: 8×400m al 95% VO2Max con 90s recuperación. O 5×1000m al ritmo de 5k con 2min recuperación. Calentamiento 15min Z1-Z2 + drills técnicos (skipping, talones, zancada). Máximo 2 sesiones calidad/semana. Enfriamiento 10min Z1.',
    etiquetas: ['atletismo', 'intervalos', 'pista', 'z4-z5'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'Atletismo',
    categoria: 'Drills_Tecnica',
    subcategoria: 'Economia_Carrera',
    contenido_tecnico: 'Drills de técnica: A-runs (rodilla alta, 20m×6), B-runs (extensión cadera, 20m×4), skipping rápido (cadencia), butt-kicks (talones a glúteo), zancadas con resistencia (parachute o banda). Incluir strides al final de sesiones Z2 (6×80m controlados). Objetivo: cadencia 178-182spm, zancada eficiente sin sobre-extensión.',
    etiquetas: ['atletismo', 'técnica', 'drills', 'economía'],
    fuente: 'Manual Alpha v3.0'
  },

  // ── Running ──────────────────────────────────────────────────────────────
  {
    deporte_origen: 'Running',
    categoria: 'Zonas_FC_Running',
    subcategoria: 'Fisiologia_Zonas',
    contenido_tecnico: 'Zonas FC Running: Z1 (50-60%) recuperación activa; Z2 (60-70%) base aeróbica, oxidación grasas; Z3 (70-80%) tempo; Z4 (80-90%) umbral lactato; Z5 (90-100%) VO2Max. Regla Alpha: HRV < 85% promedio 7d → SOLO Z1-Z2. Tiradas largas siempre en Z2. Máximo 2 sesiones de calidad por semana.',
    etiquetas: ['running', 'fc', 'zonas', 'hrv'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'Running',
    categoria: 'Tirada_Larga',
    subcategoria: 'Volumen_Aerobico',
    contenido_tecnico: 'Tirada larga: 25-35% del volumen total semanal. Ritmo conversacional Z2. Estructura: 10min Z1 → bloque principal Z2 → 10min Z1. Hidratación cada 20min en >90min. Ayuno opcional <70min para adaptación metabólica. Progresión: +10% volumen cada semana, semana de descarga cada 4ta.',
    etiquetas: ['running', 'tirada-larga', 'z2', 'volumen'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'Running',
    categoria: 'Intervalos_Running',
    subcategoria: 'Calidad_Velocidad',
    contenido_tecnico: 'Intervalos: 6-10×400m al 95% VO2Max, recuperación 90s. O 5×1km ritmo 10k, recuperación 2min. Calentamiento obligatorio 15min Z1-Z2. Nunca el día anterior a tirada larga. Máximo 2 sesiones calidad/semana.',
    etiquetas: ['running', 'intervalos', 'calidad', 'z4-z5'],
    fuente: 'Manual Alpha v3.0'
  },

  // ── Trail ─────────────────────────────────────────────────────────────────
  {
    deporte_origen: 'Trail',
    categoria: 'Trail_Desnivel',
    subcategoria: 'Especialidad_D+',
    contenido_tecnico: 'D+ genera alta carga excéntrica en cuádriceps. 48h recuperación estructural post >800m D+. Bajadas técnicas obligatorias para adaptar tendones. FC ascenso: no superar Z3. Bastones opcionales >1500m D+. Progresión: +100-150m D+ por semana en fase base.',
    etiquetas: ['trail', 'desnivel', 'd+', 'excéntrico'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'Trail',
    categoria: 'Trail_Tapering',
    subcategoria: 'Pre_Competencia',
    contenido_tecnico: 'Tapering Trail: <14 días → reducir volumen 30-40%, mantener 2 sesiones cortas calidad. Última tirada larga 10-12 días antes. Días −3 a −1: movilidad + trote suave 20-30min Z1. Aumentar carbos últimas 48h (+30%). Hidratación máxima.',
    etiquetas: ['trail', 'tapering', 'pre-competencia', 'carbos'],
    fuente: 'Manual Alpha v3.0'
  },

  // ── Ruta ──────────────────────────────────────────────────────────────────
  {
    deporte_origen: 'Ruta',
    categoria: 'FTP_Desarrollo',
    subcategoria: 'Capacidad_Mitocondrial',
    contenido_tecnico: 'FTP (Functional Threshold Power) — potencia sostenible 1 hora. Sweet Spot: 88-93% FTP, bloques 2×20min, recuperación 5min a 55% FTP. Umbral: 95-105% FTP, bloques 3×12min. VO2Max: 110-120% FTP, bloques 5×5min. Cadencia sostenida 85-100rpm. Economía de pedaleo: evitar "marcar la cadencia" con la cadera.',
    etiquetas: ['ruta', 'ftp', 'potencia', 'sweet-spot'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'Ruta',
    categoria: 'Periodizacion_Ruta',
    subcategoria: 'Estructura_Semanal',
    contenido_tecnico: 'Semana tipo ciclismo ruta: Día 1 volumen Z2 (2-3h), Día 2 calidad (Sweet Spot o Umbral), Día 3 descanso o Z1. Fase base: priorizar volumen Z2 para base mitocondrial. Fase desarrollo: introducir bloques de Umbral y VO2Max. Pre-competencia (2sem): reducir volumen 20%, mantener 1 sesión calidad. Nutrición intra-sesión: 60g carbos/h en sesiones >90min.',
    etiquetas: ['ruta', 'periodización', 'z2', 'estructura'],
    fuente: 'Manual Alpha v3.0'
  },

  // ── MTB ───────────────────────────────────────────────────────────────────
  {
    deporte_origen: 'MTB',
    categoria: 'MTB_Potencia_FTP',
    subcategoria: 'Entrenamiento_Potencia',
    contenido_tecnico: 'MTB potencia: esfuerzos explosivos 80-85% VO2Max para subidas técnicas. Intervalos 30s-2min a >120% FTP. Cadencia variable 60-100rpm según terreno. No prescribir Sweet Spot fijo — el terreno marca el ritmo. Recuperación entre bloques: 5-10min Z1-Z2.',
    etiquetas: ['mtb', 'ftp', 'potencia', 'explosivo'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'MTB',
    categoria: 'MTB_Tecnico',
    subcategoria: 'Habilidades_Terreno',
    contenido_tecnico: 'Técnica MTB: curvas radio cerrado, drops y saltos a baja velocidad. Frenado progresivo y transferencia de peso. Sesiones 45-60min en terreno técnico Z1-Z2. Trabajo de tronco para control del manillar. Terreno: singletrack, roots, rocks, berms. Combinar con fuerza isométrica de core.',
    etiquetas: ['mtb', 'técnica', 'singletrack', 'z1'],
    fuente: 'Manual Alpha v3.0'
  },

  // ── Pesas ─────────────────────────────────────────────────────────────────
  {
    deporte_origen: 'Pesas',
    categoria: 'Fuerza_Resistencia',
    subcategoria: 'Fuerza_Complementaria',
    contenido_tecnico: 'Fuerza complementaria para resistencia. RIR (Repeticiones en Reserva) es obligatorio: RIR 2-3 en todos los ejercicios (no al fallo). Sentadilla búlgara 4×8 RIR2, peso muerto rumano 3×10 RIR3, hip thrust 4×12 RIR2, zancadas mancuerna 3×10/lado RIR2. Descanso 90-120s. Foco glúteos, isquiotibiales, core. REGLA AMPK: nunca tren inferior pesado el día anterior a corrida de calidad.',
    etiquetas: ['pesas', 'fuerza', 'rir', 'glúteos', 'ampk'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'Pesas',
    categoria: 'Core_Estabilizacion',
    subcategoria: 'Prevención_Lesiones',
    contenido_tecnico: 'Core antirotacional: pallof press 3×12, dead bug 3×10, bird-dog 3×10/lado. Estabilización: planchas frontales 3×45s, planchas laterales 3×30s/lado. Movilidad de cadera: apertura 2×10, hip flexor stretch 2min/lado. 30-40min total. Puede realizarse el mismo día que aeróbico de baja intensidad.',
    etiquetas: ['pesas', 'core', 'estabilización', 'movilidad', 'antirotacional'],
    fuente: 'Manual Alpha v3.0'
  },

  // ── Natacion ──────────────────────────────────────────────────────────────
  {
    deporte_origen: 'Natacion',
    categoria: 'Natacion_Recovery',
    subcategoria: 'Recuperacion_Activa',
    contenido_tecnico: 'Natación recovery: Crol 200m×4 Z1-Z2, descanso 30s. Total 800-1200m. Excelente post-carrera larga por descarga articular. Temperatura óptima: 26-28°C. FINA: Crol/200m×4/30s. Drills de eficiencia: catch temprano, rotación del tronco 45°, patada desde cadera (no rodilla).',
    etiquetas: ['natacion', 'recovery', 'z1', 'fina', 'hidrodinámica'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'Natacion',
    categoria: 'Natacion_Tecnica',
    subcategoria: 'Eficiencia_Hidrodinamica',
    contenido_tecnico: 'Técnica natación: catch-up drill (sincronización brazada), fist drill (puño cerrado para sentir el agua con antebrazo), kickboard 4×50m para mejorar patada. Respiración bilateral cada 3 brazadas. Objetivo DPS (Distance Per Stroke): máximo de metros por ciclo de brazada. Total técnica: 800-1000m.',
    etiquetas: ['natacion', 'técnica', 'drills', 'eficiencia'],
    fuente: 'Manual Alpha v3.0'
  },

  // ── General / AMPK-mTOR ───────────────────────────────────────────────────
  {
    deporte_origen: 'General',
    categoria: 'AMPK_mTOR_Interferencia',
    subcategoria: 'Secuenciacion_Sesiones',
    contenido_tecnico: 'Gestión de interferencia metabólica AMPK vs mTOR: (1) Separación mínima 6-8h entre fuerza y resistencia el mismo día. (2) Si mismo día: fuerza en mañana (mTOR), aeróbico baja intensidad <20min en tarde (AMPK se disipa). (3) Fuerza de tren inferior el día ANTERIOR a corrida de calidad está PROHIBIDO. (4) Post corrida larga: si hay fuerza, solo tren superior (no cuádriceps, isquiotibiales). (5) Expresión PGC-1α4: el cardio posterior debe ser Z1 para no suprimir vía mTOR.',
    etiquetas: ['interferencia', 'ampk', 'mtor', 'secuenciación', 'fuerza-resistencia'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'General',
    categoria: 'Recuperacion_Activa',
    subcategoria: 'Descanso_Activo',
    contenido_tecnico: 'Recuperación activa: caminata 30-45min Z1, movilidad articular dinámica 10min (cadera, hombros, tobillo), foam rolling cadena posterior 5-10min. No superar FC Z1. Sueño 8h mínimo. Hidratación 2.5-3L agua + electrolitos post entreno intenso. HRV baja → priorizar recuperación sobre rendimiento.',
    etiquetas: ['general', 'recovery', 'movilidad', 'descanso', 'sueño'],
    fuente: 'Manual Alpha v3.0'
  },
  {
    deporte_origen: 'General',
    categoria: 'Tapering_General',
    subcategoria: 'Pre_Competencia',
    contenido_tecnico: 'Tapering universal: reduce volumen total 30-40% en las 2 semanas previas a la competencia. Mantener intensidad en 1-2 sesiones de calidad por semana (no eliminar la velocidad). Última sesión larga: 10-12 días antes. Días −3 a −1: solo movilidad y activación suave. Carga de carbohidratos: +30% los últimas 48h. Descanso completo el día previo.',
    etiquetas: ['general', 'tapering', 'pre-competencia', 'carbos'],
    fuente: 'Manual Alpha v3.0'
  },
];

export const seedProtocols = async () => {
  try {
    for (const p of PROTOCOLS) {
      // ID determinístico: re-correr el seeder actualiza, no duplica
      const docId = `${p.deporte_origen}_${p.categoria}`.replace(/\s+/g, '_').toLowerCase();
      await setDoc(doc(db, 'Conocimiento_Tecnico', docId), {
        ...p,
        ultima_actualizacion: new Date().toISOString(),
        version: 'v3.0',
      });
    }
    console.log(`${PROTOCOLS.length} protocolos Alpha v3.0 sembrados con éxito.`);
    return true;
  } catch (e) {
    console.error('[ProtocolSeeder] Error:', e);
    return false;
  }
};
