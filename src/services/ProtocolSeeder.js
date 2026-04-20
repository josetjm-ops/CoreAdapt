import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const PROTOCOLS = [
  { 
    categoria: 'Entrenamiento_Base', 
    subcategoria: 'Fisiologia_Zonas', 
    contenido_tecnico: 'Definir Zonas de Potencia/FC (Z1 a Z5). Z1-Z2: Oxidación de grasas y recuperación. Z3: Tempo/Aeróbico estable. Z4: Umbral lactato. Z5: VO2 Max. Regla Alpha: Ante un HRV bajo (>10% de caída), el Cerebro DEBE restringir el entrenamiento a Z1-Z2 o descanso total, prohibiendo sesiones de Z4/Z5 por riesgo de sobreentrenamiento.', 
    etiquetas: ['fisiologia', 'zonas', 'HRV'], 
    fuente: 'Manual Alpha v1.2' 
  },
  { 
    categoria: 'Nutricion_IA', 
    subcategoria: 'Recarga_Glucogeno', 
    contenido_tecnico: 'Reposición de glucógeno post-esfuerzo: 1.2g de carbos/kg de peso + 0.4g proteína/kg en la ventana de 2 horas tras entrenos de >90 min. Regla Alpha: Si la sesión sincronizada de Strava indica un gasto >1,500 kcal, el Cerebro debe ajustar automáticamente la meta de Carbos en la pantalla COMBUSTIBLE incrementándola en un 20%.', 
    etiquetas: ['nutricion', 'carbos', 'glucogeno'], 
    fuente: 'Manual Alpha v1.2' 
  },
  { 
    categoria: 'Trail_Running', 
    subcategoria: 'Especialidad_D+', 
    contenido_tecnico: 'El entrenamiento de desnivel positivo (+) genera alta carga excéntrica. Requiere 48h de recuperación estructural para sesiones de >800m D+. Regla Alpha: Si el usuario tiene una carrera (Milestone) en <15 días, activa el protocolo Tapering: Reducción de volumen en 30%, manteniendo la intensidad pero bajando la duración de las tiradas largas.', 
    etiquetas: ['trail', 'desnivel', 'tapering'], 
    fuente: 'Manual Alpha v1.2' 
  }
];

export const seedProtocols = async () => {
    try {
        const col = collection(db, "Conocimiento_Tecnico");
        for (const p of PROTOCOLS) {
            await addDoc(col, p);
        }
        console.log("Protocolos Maestros cargados con éxito.");
        return true;
    } catch (e) {
        console.error("Error cargando protocolos:", e);
        return false;
    }
};
