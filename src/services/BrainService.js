import { db } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * Brain Intelligence Service - Orquestador Funcional
 */

export const BrainService = {
  /**
   * Obtiene un análisis personalizado basado en biometría y contexto real
   */
  async getAthleteInsight(profile, biometria, actividad, objetivo) {
    try {
      // 2. Recuperar Conocimiento Técnico (RAG Alpha)
      const kbRef = collection(db, "Conocimiento_Tecnico");
      // Buscamos contenido relevante a la disciplina o categoría general
      const category = profile.disciplines?.[0] || 'General';
      const kbSnapshot = await getDocs(query(kbRef, limit(2))); // En prod filtrar por categoría
      const technicalContext = kbSnapshot.docs.map(doc => doc.data().contenido_tecnico).join('\n');

      // 3. Llamar al Orquestador (DeepSeek)
      const response = await fetch('/api/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userProfile: profile,
          biometria,
          actividad_hoy: actividad,
          objetivo,
          technicalContext
        }),
      });

      if (!response.ok) throw new Error("Cerebro offline");

      const data = await response.json();
      const logsRef = collection(db, "Logs_CoreAdapt");

      // 3. Persistencia en Logs_CoreAdapt (Memoria de IA)
      await addDoc(logsRef, {
        insight: data.insight,
        sugerencia: data.sugerencia_plan,
        alerta: data.alerta_sobreentreno,
        nutricion: data.ajuste_nutricional || null,
        timestamp: new Date().toISOString()
      });

      // 4. Gestión de Alertas PWA (Notificación Push)
      if (data.alerta_sobreentreno && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification("⚠️ Alerta CoreAdapt", {
            body: "El Cerebro ha detectado fatiga crítica. Revisa tu plan.",
            icon: "/favicon.ico"
          });
        }
      }

      return data;

    } catch (error) {
      console.error("Brain Service Error:", error);
      return { insight: "El Cerebro está analizando tus datos...", sugerencia_plan: "mantener" };
    }
  },

  /**
   * Guarda el entrenamiento sugerido en Firestore después de la aprobación del usuario
   */
  async acceptSuggestedTraining(trainingData) {
    try {
      const planRef = collection(db, "MiPlan_Ajustes"); // Usamos una tabla de ajustes/plan real
      await addDoc(planRef, {
        ...trainingData,
        status: 'accepted',
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Error al aceptar entrenamiento:", error);
      return false;
    }
  },

  /**
   * Push Coaching: Envía notificaciones motivacionales basadas en energía matutina
   */
  async handlePushCoaching(biometria) {
    if (biometria.body_battery > 80 && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification("🚀 Energía al Máximo", {
          body: "Tus niveles de Body Battery están al 80%+. ¡Día perfecto para cumplir tu sesión!",
          icon: "/favicon.ico"
        });
      }
    }
  },

  /**
   * Calcula el % de Adherencia basado en historial de logs
   */
  async getAdherenceRate() {
    const logsRef = collection(db, "Logs_CoreAdapt");
    const q = query(logsRef, limit(30)); // Últimos 30 días
    const snap = await getDocs(q);
    const logs = snap.docs.map(doc => doc.data());
    
    const completed = logs.filter(l => l.cumplimiento === true).length;
    const total = logs.length || 1;
    return Math.round((completed / total) * 100);
  },

  /**
   * Verifica los días restantes de prueba o estado de pago
   */
  async checkSubscriptionStatus(profile) {
    const createDate = profile.createDate ? new Date(profile.createDate) : new Date();
    const now = new Date();
    const diffDays = Math.ceil((now - createDate) / (1000 * 60 * 60 * 24));
    
    if (profile.isPaid) return { status: 'active', daysLeft: 999 };
    if (diffDays > 7) return { status: 'expired', daysLeft: 0 };
    
    return { status: 'trial', daysLeft: 7 - diffDays };
  }
};
