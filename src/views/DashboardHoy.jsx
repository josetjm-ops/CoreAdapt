import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  Zap, 
  Moon, 
  Activity, 
  Dumbbell, 
  Bike, 
  Waves, 
  Mountain, 
  Settings, 
  User,
  Brain
} from 'lucide-react';

const DISCIPLINE_ICONS = {
  'Running': <Activity size={24} strokeWidth={1.5} />,
  'Trail_Running': <Mountain size={24} strokeWidth={1.5} />,
  'Ruta': <Bike size={24} strokeWidth={1.5} />,
  'MTB': <Bike size={24} strokeWidth={1.5} />,
  'Pesas': <Dumbbell size={24} strokeWidth={1.5} />,
  'Natacion': <Waves size={24} strokeWidth={1.5} />,
  'Descanso': <Moon size={24} strokeWidth={1.5} />
};

const DashboardHoy = ({ profile = {} }) => {
  const { t } = useTranslation();
  const [brainPlan, setBrainPlan] = useState(null);
  const bodyBattery = 82; // Simulated Garmin Data
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(
            collection(db, "MiPlan_Ajustes"),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const docArray = snapshot.docs.map(doc => doc.data());
            docArray.sort((a, b) => {
              const tA = a.timestamp_generacion?.toMillis ? a.timestamp_generacion.toMillis() : 0;
              const tB = b.timestamp_generacion?.toMillis ? b.timestamp_generacion.toMillis() : 0;
              return tB - tA;
            });
            setBrainPlan(docArray[0].plan_generado);
          }
        } catch (err) {
          console.error("Error cargando plan en Hoy:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    if (window.confirm("¿Deseas cerrar sesión?")) {
      signOut(auth).then(() => {
        localStorage.removeItem('coreAdaptProfile');
        window.location.href = "/";
      });
    }
  };

  const sesionHoy = brainPlan?.microciclo?.[0] || null;

  return (
    <div style={{ padding: '3rem 1.5rem 10rem', color: 'var(--on-surface)' }}>
      
      {/* Header Editorial */}
      <header style={{ marginBottom: '3rem' }}>
        <p className="label-md" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
          {todayStr}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 className="headline-md" style={{ fontSize: '2.2rem', lineHeight: 1 }}>
            Hola, {profile.firstName || 'Atleta'}
          </h1>
          <div onClick={handleLogout} style={{ 
            width: '48px', height: '48px', borderRadius: 'var(--radius-full)', 
            background: 'var(--surface-high)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer' 
          }}>
            <User size={20} strokeWidth={1.5} color="var(--on-surface-variant)" />
          </div>
        </div>
      </header>

      {/* Body Battery Quick Look - Asymmetric */}
      <section className="card-technical" style={{ 
        marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, var(--surface-low) 0%, var(--surface-lowest) 100%)',
      }}>
        <div>
          <p className="label-md">Energía Vital</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span className="display-lg" style={{ color: 'var(--primary)' }}>{bodyBattery}</span>
            <span className="label-md" style={{ opacity: 0.6 }}>%</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="label-md">Estado</p>
          <p className="title-lg" style={{ fontWeight: '700' }}>Ready for Output</p>
          <p className="label-md" style={{ color: 'var(--primary)', marginTop: '2px' }}>● Óptimo</p>
        </div>
      </section>

      {/* Objetivo Técnico del Orquestador */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Zap size={16} color="var(--primary)" />
          <h2 className="label-md" style={{ color: 'var(--primary)' }}>Core Strategy</h2>
        </div>

        {sesionHoy ? (
          <div className="card-technical" style={{ 
            background: 'var(--surface-high)',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <p className="label-md" style={{ color: 'var(--secondary)' }}>
                  {brainPlan.fase_macro?.toUpperCase() || 'MICRO-CICLO ACTIVO'}
                </p>
                <h3 className="headline-md" style={{ marginTop: '0.4rem' }}>{sesionHoy.disciplina}</h3>
              </div>
              <div style={{ color: 'var(--primary)' }}>
                {DISCIPLINE_ICONS[sesionHoy.disciplina] || <Activity size={24} />}
              </div>
            </div>
            
            <p style={{ fontSize: '1rem', color: 'var(--on-surface)', lineHeight: 1.6, marginBottom: '2rem', opacity: 0.9 }}>
              {sesionHoy.descripcion}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--surface-lowest)', borderRadius: '1rem' }}>
                <p className="label-md">Duración</p>
                <p className="title-lg" style={{ color: 'var(--on-surface)' }}>{sesionHoy.duracion_estimada} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>min</span></p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--surface-lowest)', borderRadius: '1rem' }}>
                <p className="label-md">Enfoque</p>
                <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)', marginTop: '4px' }}>{sesionHoy.objetivo_tecnico}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
            <p className="label-md" style={{ marginBottom: '1rem' }}>Sin plan activo</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>Genera tu microciclo en la pestaña de plan.</p>
          </div>
        )}
      </section>

      {/* Insight del Jefe (The Kinetic Intelligence) */}
      <section className="glass" style={{
        borderRadius: 'var(--radius-lg)', padding: '1.5rem', 
        borderLeft: '2px solid var(--primary)', background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Brain size={18} color="var(--primary)" strokeWidth={2} />
          <p className="label-md" style={{ color: 'var(--primary)' }}>Cerebro Adapta v3</p>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, marginTop: '1rem', fontStyle: 'italic' }}>
          "{brainPlan?.insight_del_jefe || "Sincronizando variables biométricas..."}"
        </p>
      </section>
    </div>
  );
};

export default DashboardHoy;
