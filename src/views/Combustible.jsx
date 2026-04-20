import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BrainService } from '../services/BrainService';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// ─── Constants (will connect to Garmin Sync — Regla R3) ─────────────────────
const BASE_MACROS = {
  protein:  { target: 180, consumed: 124, unit: 'g', color: '#00FF41', label: 'PROTEÍNA' },
  carbs:    { target: 340, consumed: 210, unit: 'g', color: '#2E5BFF', label: 'CARBOS' },
  fat:      { target: 80,  consumed: 62,  unit: 'g', color: '#FFBF00', label: 'GRASAS' },
};

const TOTAL_CALS   = { consumed: 1820, target: 2640 };
const HYDRATION_ML = { consumed: 1400, target: 2800 };

const FOOD_LOG = [
  {
    id: 1,
    time: '07:15',
    name: 'Bowl de Avena Pre-Run',
    emoji: '🍚',
    kcal: 420,
    protein: 18,
    carbs: 68,
    fat: 9,
    tag: 'Pre-Entreno',
    tagColor: '#00FF41',
  },
  {
    id: 2,
    time: '10:30',
    name: 'Batido de Recuperación',
    emoji: '🥛',
    kcal: 310,
    protein: 34,
    carbs: 28,
    fat: 6,
    tag: 'Post-Run',
    tagColor: '#2E5BFF',
  },
  {
    id: 3,
    time: '13:45',
    name: 'Pechugas + Arroz + Brócoli',
    emoji: '🍗',
    kcal: 590,
    protein: 48,
    carbs: 72,
    fat: 12,
    tag: 'Almuerzo',
    tagColor: '#b9ccb2',
  },
  {
    id: 4,
    time: '17:00',
    name: 'Puñado de Nueces + Fruta',
    emoji: '🥜',
    kcal: 280,
    protein: 8,
    carbs: 22,
    fat: 18,
    tag: 'Snack',
    tagColor: '#b9ccb2',
  },
];

const QUICK_MENUS = [
  { id: 1, name: 'Salmón Express', emoji: '🐟', time: '12 min', kcal: 480, tag: 'Recovery' },
  { id: 2, name: 'Pavo Wrap Pro', emoji: '🌯', time: '8 min', kcal: 420, tag: 'Pre-Entreno' },
  { id: 3, name: 'Smoothie Power', emoji: '🥤', time: '5 min', kcal: 310, tag: 'Post-Run' },
  { id: 4, name: 'Bowl de Quinoa', emoji: '🥗', time: '15 min', kcal: 520, tag: 'Almuerzo' },
  { id: 5, name: 'Omelette Proteico', emoji: '🍳', time: '10 min', kcal: 380, tag: 'Desayuno' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const MacroRing = ({ macro, value }) => {
  const pct = Math.min(100, Math.round((value.consumed / value.target) * 100));
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
        <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={radius} fill="none" stroke="#2a2a2a" strokeWidth="5" />
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke={value.color}
            strokeWidth="5"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${value.color}66)`, transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: value.color }}>{pct}%</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.6rem', color: '#84967e', fontWeight: '700', letterSpacing: '0.06em' }}>{value.label}</p>
        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#e5e2e1' }}>
          {value.consumed}<span style={{ color: '#84967e', fontWeight: '400' }}>/{value.target}{value.unit}</span>
        </p>
      </div>
    </div>
  );
};

const HydrationBar = ({ consumed, target }) => {
  const pct = Math.min(100, Math.round((consumed / target) * 100));
  const glasses = Math.round(consumed / 250);  // ~250ml per glass
  const totalGlasses = Math.round(target / 250);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <p style={{ fontSize: '0.65rem', color: '#b9ccb2', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          💧 Hidratación
        </p>
        <p style={{ fontSize: '0.7rem', color: pct < 50 ? '#FFBF00' : '#00FF41', fontWeight: '700' }}>
          {consumed}ml / {target}ml
        </p>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: totalGlasses }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '8px', borderRadius: '2px',
            background: i < glasses ? '#2E5BFF' : '#2a2a2a',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {pct < 60 && (
        <p style={{ fontSize: '0.7rem', color: '#FFBF00', marginTop: '0.4rem' }}>
          ⚠️ Déficit de hidratación — bebe 400ml antes del siguiente entreno.
        </p>
      )}
    </div>
  );
};

const FoodCard = ({ item }) => (
  <div style={{
    background: '#1c1b1b',
    borderRadius: '1.25rem',
    padding: '1rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  }}>
    <div style={{
      width: '52px', height: '52px', borderRadius: '1rem', flexShrink: 0,
      background: '#2a2a2a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.75rem',
    }}>
      {item.emoji}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
        <div>
          <span style={{
            fontSize: '0.6rem', fontWeight: '700', color: item.tagColor,
            background: `${item.tagColor}18`, borderRadius: '9999px',
            padding: '2px 8px', marginRight: '6px',
          }}>{item.tag}</span>
          <span style={{ fontSize: '0.65rem', color: '#84967e' }}>{item.time}</span>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#e5e2e1', flexShrink: 0 }}>{item.kcal} kcal</span>
      </div>
      <p style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.name}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#00FF41' }}>P: {item.protein}g</span>
        <span style={{ fontSize: '0.7rem', color: '#2E5BFF' }}>C: {item.carbs}g</span>
        <span style={{ fontSize: '0.7rem', color: '#FFBF00' }}>G: {item.fat}g</span>
      </div>
    </div>
  </div>
);

const QuickMenuCard = ({ item }) => (
  <div style={{
    flexShrink: 0,
    width: '140px',
    background: '#1c1b1b',
    borderRadius: '1.25rem',
    padding: '1rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
  }}>
    <span style={{ fontSize: '2rem' }}>{item.emoji}</span>
    <p style={{ fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.3 }}>{item.name}</p>
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{
        fontSize: '0.55rem', fontWeight: '700', color: '#00FF41',
        background: '#00FF4118', borderRadius: '9999px', padding: '2px 6px',
      }}>{item.tag}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
      <span style={{ fontSize: '0.7rem', color: '#84967e' }}>⏱ {item.time}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>{item.kcal} cal</span>
    </div>
  </div>
);

// ─── Camera Modal (Vision AI Stub) ────────────────────────────────────────────
const CameraModal = ({ onClose }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setAnalyzing(true);
    // Simulate AI analysis — will connect to Vision API
    setTimeout(() => {
      setAnalyzing(false);
      setResult({ kcal: 480, protein: 38, carbs: 52, fat: 14, label: 'Plato detectado: Pollo con Arroz Integral' });
    }, 2200);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', zIndex: 2000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '380px', background: '#1c1b1b', borderRadius: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: "'Inter', sans-serif", color: '#e5e2e1' }}>
            📸 Vision AI
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#84967e', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {!preview && (
          <>
            <p style={{ color: '#b9ccb2', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
              Toma una foto de tu plato o captura una etiqueta nutricional. La IA analizará los macros automáticamente.
            </p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => fileRef.current.click()}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '9999px',
                  background: 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)',
                  color: '#003907', fontWeight: '800', fontSize: '0.95rem',
                  border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}
              >📷 Cámara</button>
              <button
                onClick={() => fileRef.current.click()}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '9999px',
                  background: '#2a2a2a', color: '#e5e2e1',
                  fontWeight: '700', fontSize: '0.95rem',
                  border: '1px solid #3b4b37', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}
              >🖼️ Galería</button>
            </div>
          </>
        )}

        {preview && (
          <div>
            <img src={preview} alt="preview" style={{ width: '100%', borderRadius: '1rem', maxHeight: '240px', objectFit: 'cover', marginBottom: '1rem' }} />
            {analyzing && (
              <div style={{ textAlign: 'center', color: '#00FF41', fontFamily: "'Inter', sans-serif" }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>🧠 Analizando con Vision AI…</p>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '0.5rem' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '8px', height: '8px', background: '#00FF41', borderRadius: '50%',
                      animation: `pulse 1s ${i * 0.25}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            {result && (
              <div style={{ background: '#0e0e0e', borderRadius: '1rem', padding: '1rem' }}>
                <p style={{ color: '#00FF41', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif" }}>
                  ✓ {result.label}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: 'Calorías', value: `${result.kcal} kcal`, color: '#e5e2e1' },
                    { label: 'Proteína', value: `${result.protein}g`, color: '#00FF41' },
                    { label: 'Carbos', value: `${result.carbs}g`, color: '#2E5BFF' },
                    { label: 'Grasas', value: `${result.fat}g`, color: '#FFBF00' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#1c1b1b', borderRadius: '0.75rem', padding: '0.6rem' }}>
                      <p style={{ fontSize: '0.6rem', color: '#84967e', fontFamily: "'Inter', sans-serif" }}>{m.label}</p>
                      <p style={{ fontSize: '1rem', fontWeight: '800', color: m.color, fontFamily: "'Inter', sans-serif" }}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%', marginTop: '1rem', padding: '0.75rem',
                    borderRadius: '9999px', border: 'none',
                    background: 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)',
                    color: '#003907', fontWeight: '800', fontSize: '0.9rem',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}
                >✓ Registrar en COMBUSTIBLE</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Combustible = () => {
  const { t } = useTranslation();
  const [showCamera, setShowCamera] = useState(false);
  const [activeTab, setActiveTab] = useState('hoy');
  const [nutritionData, setNutritionData] = useState({
    target: 2640,
    macros: { protein: 180, carbs: 340, fat: 80 },
    consejoChef: "Cargando recomendaciones nutricionales..."
  });

  useEffect(() => {
    const fetchNutrition = async () => {
      try {
        // Obtenemos los últimos datos de la IA desde Logs
        const logsRef = collection(db, "Logs_CoreAdapt");
        const q = query(logsRef, orderBy("timestamp", "desc"), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const lastLog = snap.docs[0].data();
          if (lastLog.nutricion) {
            setNutritionData(prev => ({ ...prev, ...lastLog.nutricion }));
          }
        }
      } catch (error) {
        console.error("Error fetching nutrition:", error);
      }
    };
    fetchNutrition();
  }, []);

  const totalConsumed = FOOD_LOG.reduce((sum, f) => sum + f.kcal, 0);
  const totalTarget = nutritionData.target;
  const calsPercent = Math.round((totalConsumed / totalTarget) * 100);

  return (
    <div style={{ padding: '2rem 1.5rem 9rem', fontFamily: "'Inter', sans-serif", color: '#e5e2e1', maxWidth: '480px', margin: '0 auto' }}>

      {showCamera && <CameraModal onClose={() => setShowCamera(false)} />}

      {/* ── Header ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: '#b9ccb2', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nutrición · IA</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', marginTop: '0.1rem' }}>
            {t('tabs.combustible')}
          </h1>
        </div>
        {/* Camera FAB */}
        <button
          onClick={() => setShowCamera(true)}
          style={{
            width: '52px', height: '52px', borderRadius: '50%', border: 'none',
            background: 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0,255,65,0.35)',
          }}
          title="Capturar Alimento con Vision AI"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#003907" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </header>

      {/* ── Calorie Summary ── */}
      <section style={{
        background: '#1c1b1b', borderRadius: '1.5rem', padding: '1.25rem',
        marginBottom: '1.5rem', borderTop: '2px solid #00FF41',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: '#00FF41', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              🔥 Calorías del Día
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '900', marginTop: '0.2rem', lineHeight: 1 }}>
              {totalConsumed.toLocaleString()}
              <span style={{ fontSize: '1rem', color: '#84967e', fontWeight: '400' }}> / {totalTarget.toLocaleString()} kcal</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: '900', color: calsPercent > 90 ? '#FFBF00' : '#00FF41' }}>{calsPercent}%</p>
            <p style={{ fontSize: '0.6rem', color: '#84967e' }}>COMPLETADO</p>
          </div>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#0e0e0e', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${calsPercent}%`, height: '100%',
            background: calsPercent > 90
              ? 'linear-gradient(90deg, #FFBF00 0%, #FFD55E 100%)'
              : 'linear-gradient(90deg, #00e639 0%, #00FF41 100%)',
            borderRadius: '8px', transition: 'width 0.6s ease',
          }} />
        </div>
        <p style={{ fontSize: '0.7rem', color: '#b9ccb2', marginTop: '0.5rem' }}>
          ⚡ Ajustado post-15k Trail Run de hoy · Actualización Garmin sync
        </p>
      </section>

      {/* ── Macro Rings ── */}
      <section style={{
        background: '#1c1b1b', borderRadius: '1.5rem', padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <p style={{ fontSize: '0.65rem', color: '#b9ccb2', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
          Macronutrientes
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <MacroRing macro="protein" value={{...BASE_MACROS.protein, target: nutritionData.macros.protein, consumed: 124}} />
          <MacroRing macro="carbs" value={{...BASE_MACROS.carbs, target: nutritionData.macros.carbs, consumed: 210}} />
          <MacroRing macro="fat" value={{...BASE_MACROS.fat, target: nutritionData.macros.fat, consumed: 62}} />
        </div>
      </section>

      {/* ── Hydration ── */}
      <section style={{
        background: '#1c1b1b', borderRadius: '1.5rem', padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <HydrationBar consumed={HYDRATION_ML.consumed} target={HYDRATION_ML.target} />
      </section>

      {/* ── Tab Switch: Log / Menús ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: '#1c1b1b', borderRadius: '9999px', padding: '4px' }}>
        {[
          { id: 'hoy', label: '📋 Registro de Hoy' },
          { id: 'menus', label: '⚡ Menús 15 min' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '0.6rem', borderRadius: '9999px', border: 'none',
            background: activeTab === tab.id ? '#00FF41' : 'transparent',
            color: activeTab === tab.id ? '#003907' : '#b9ccb2',
            fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Food Log ── */}
      {activeTab === 'hoy' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FOOD_LOG.map(item => <FoodCard key={item.id} item={item} />)}
          {/* Add meal button */}
          <button
            onClick={() => setShowCamera(true)}
            style={{
              width: '100%', padding: '1rem', borderRadius: '1.25rem',
              background: 'transparent', border: '2px dashed #3b4b37',
              color: '#b9ccb2', fontWeight: '700', fontSize: '0.9rem',
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            <span>📸</span> Registrar Comida con Vision AI
          </button>
        </section>
      )}

      {/* ── Quick Menus ── */}
      {activeTab === 'menus' && (
        <section>
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {QUICK_MENUS.map(item => <QuickMenuCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {/* ── Brain Insight (R3 + R5) ── */}
      <section style={{
        background: 'rgba(53,53,52,0.4)', backdropFilter: 'blur(20px)',
        borderRadius: '1.5rem', padding: '1.25rem',
        borderLeft: '3px solid #FFBF00', marginTop: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span>👨‍🍳</span>
          <p style={{ fontSize: '0.65rem', color: '#FFBF00', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            CONSEJO DEL CHEF ALPHA
          </p>
          <span style={{
            marginLeft: 'auto', fontSize: '0.6rem', color: '#b9ccb2',
            background: '#1c1b1b', padding: '0.2rem 0.5rem', borderRadius: '9999px',
          }}>IA · CORE NUTRICIÓN</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#b9ccb2', lineHeight: 1.6 }}>
          {nutritionData.consejoChef}
        </p>
      </section>

    </div>
  );
};

export default Combustible;
