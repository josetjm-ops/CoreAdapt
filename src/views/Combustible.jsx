import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import useNutricion from '../hooks/useNutricion';
import AddFoodModal from '../components/AddFoodModal';

// ─── Sub-components ───────────────────────────────────────────────────────────

const MacroRing = ({ value }) => {
  const pct = Math.min(100, value.target > 0 ? Math.round((value.consumed / value.target) * 100) : 0);
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
        <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={radius} fill="none" stroke="#2a2a2a" strokeWidth="5" />
          <circle cx="36" cy="36" r={radius} fill="none" stroke={value.color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${value.color}66)`, transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: value.color }}>{pct}%</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.6rem', color: COLORS.textMuted, fontWeight: '700', letterSpacing: '0.06em' }}>{value.label}</p>
        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: COLORS.text }}>
          {value.consumed}<span style={{ color: COLORS.textMuted, fontWeight: '400' }}>/{value.target}{value.unit}</span>
        </p>
      </div>
    </div>
  );
};

const HydrationBar = ({ consumed, target, onAddGlass }) => {
  const pct = Math.min(100, target > 0 ? Math.round((consumed / target) * 100) : 0);
  const glasses = Math.round(consumed / 250);
  const totalGlasses = Math.round(target / 250);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
        <p style={{ fontSize: '0.65rem', color: COLORS.textSoft, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>💧 Hidratación</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: pct < 50 ? COLORS.warning : COLORS.primary, fontWeight: '700' }}>{consumed}ml / {target}ml</p>
          <button onClick={onAddGlass} style={{ background: COLORS.primary, border: 'none', borderRadius: '9999px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: '800', color: COLORS.primaryDark, cursor: 'pointer' }}>+250ml</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: totalGlasses }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: '8px', borderRadius: '2px', background: i < glasses ? COLORS.secondary : '#2a2a2a', transition: 'background 0.3s' }} />
        ))}
      </div>
      {pct < 60 && (
        <p style={{ fontSize: '0.7rem', color: COLORS.warning, marginTop: '0.4rem' }}>
          ⚠️ Déficit de hidratación — bebe 400ml antes del siguiente entreno.
        </p>
      )}
    </div>
  );
};

const TAG_COLORS = {
  'Pre-Entreno': COLORS.primary,
  'Post-Run': COLORS.secondary,
  'Almuerzo': COLORS.textSoft,
  'Cena': COLORS.textSoft,
  'Desayuno': '#FFBF00',
  'Snack': COLORS.textMuted,
};

const FoodCard = ({ item }) => {
  const nombre = item.nombre || item.name || 'Alimento';
  const hora = item.hora || item.time || '--:--';
  const proteina = item.proteina_g ?? item.protein ?? 0;
  const carbos = item.carbos_g ?? item.carbs ?? 0;
  const grasas = item.grasas_g ?? item.fat ?? 0;
  const tagColor = item.tagColor || TAG_COLORS[item.tag] || COLORS.textMuted;

  return (
    <div style={{ background: COLORS.surface, borderRadius: '1.25rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '1rem', flexShrink: 0, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
        {item.emoji || '🍽️'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
          <div>
            <span style={{ fontSize: '0.6rem', fontWeight: '700', color: tagColor, background: `${tagColor}18`, borderRadius: '9999px', padding: '2px 8px', marginRight: '6px' }}>{item.tag}</span>
            <span style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>{hora}</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: COLORS.text, flexShrink: 0 }}>{item.kcal} kcal</span>
        </div>
        <p style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.7rem', color: COLORS.primary }}>P: {proteina}g</span>
          <span style={{ fontSize: '0.7rem', color: COLORS.secondary }}>C: {carbos}g</span>
          <span style={{ fontSize: '0.7rem', color: COLORS.warning }}>G: {grasas}g</span>
        </div>
      </div>
    </div>
  );
};

const QUICK_MENUS = [
  { id: 1, name: 'Salmón Express',    emoji: '🐟', time: '12 min', kcal: 480, tag: 'Recovery' },
  { id: 2, name: 'Pavo Wrap Pro',     emoji: '🌯', time: '8 min',  kcal: 420, tag: 'Pre-Entreno' },
  { id: 3, name: 'Smoothie Power',    emoji: '🥤', time: '5 min',  kcal: 310, tag: 'Post-Run' },
  { id: 4, name: 'Bowl de Quinoa',    emoji: '🥗', time: '15 min', kcal: 520, tag: 'Almuerzo' },
  { id: 5, name: 'Omelette Proteico', emoji: '🍳', time: '10 min', kcal: 380, tag: 'Desayuno' },
];

const QuickMenuCard = ({ item }) => (
  <div style={{ flexShrink: 0, width: '140px', background: COLORS.surface, borderRadius: '1.25rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <span style={{ fontSize: '2rem' }}>{item.emoji}</span>
    <p style={{ fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.3 }}>{item.name}</p>
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{ fontSize: '0.55rem', fontWeight: '700', color: COLORS.primary, background: `${COLORS.primary}18`, borderRadius: '9999px', padding: '2px 6px' }}>{item.tag}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
      <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>⏱ {item.time}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>{item.kcal} cal</span>
    </div>
  </div>
);

// ─── Camera Modal (Vision AI Real) ────────────────────────────────────────────
const CameraModal = ({ onClose, onAdd }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [needsDescription, setNeedsDescription] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  const analyze = async (imageBase64, desc) => {
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageBase64 ? { imageBase64 } : { descripcion: desc }),
      });

      if (res.status === 422) {
        setNeedsDescription(true);
        setAnalyzing(false);
        return;
      }

      if (!res.ok) throw new Error('Error en análisis');
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
      setNeedsDescription(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      analyze(base64, null);
    };
    reader.readAsDataURL(file);
  };

  const handleDescriptionSubmit = () => {
    if (!descripcion.trim()) return;
    analyze(null, descripcion);
  };

  const handleRegister = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const now = new Date();
      await onAdd({
        nombre: result.nombre,
        emoji: result.emoji || '🍽️',
        hora: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
        kcal: result.kcal,
        proteina_g: result.proteina_g,
        carbos_g: result.carbos_g,
        grasas_g: result.grasas_g,
        tag: result.tag || 'Snack',
        fuente: 'vision_ai',
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const RESULT_ITEMS = result ? [
    { label: 'Calorías', value: `${result.kcal} kcal`, color: COLORS.text },
    { label: 'Proteína', value: `${result.proteina_g}g`,  color: COLORS.primary },
    { label: 'Carbos',   value: `${result.carbos_g}g`,   color: COLORS.secondary },
    { label: 'Grasas',   value: `${result.grasas_g}g`,   color: COLORS.warning },
  ] : [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '380px', background: COLORS.surface, borderRadius: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: COLORS.text }}>📸 Vision AI</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {!preview && !needsDescription && (
          <>
            <p style={{ color: COLORS.textSoft, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Toma una foto de tu plato o captura una etiqueta nutricional.
            </p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => fileRef.current.click()} style={{ flex: 1, padding: '1rem', borderRadius: '9999px', background: `linear-gradient(180deg, #ebffe2 0%, ${COLORS.primary} 100%)`, color: COLORS.primaryDark, fontWeight: '800', fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}>📷 Cámara</button>
              <button onClick={() => fileRef.current.click()} style={{ flex: 1, padding: '1rem', borderRadius: '9999px', background: '#2a2a2a', color: COLORS.text, fontWeight: '700', fontSize: '0.95rem', border: `1px solid ${COLORS.border}`, cursor: 'pointer' }}>🖼️ Galería</button>
            </div>
          </>
        )}

        {needsDescription && !result && (
          <div>
            <p style={{ color: COLORS.textSoft, fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Describe el alimento y estimamos los macros para ti:
            </p>
            <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Pechuga de pollo con arroz y brócoli" style={{ width: '100%', padding: '0.875rem', background: COLORS.bgInput, border: `1px solid ${COLORS.border}`, borderRadius: '0.75rem', color: COLORS.text, fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box' }} />
            <button onClick={handleDescriptionSubmit} disabled={!descripcion.trim() || analyzing} style={{ width: '100%', padding: '0.875rem', borderRadius: '9999px', border: 'none', background: descripcion.trim() ? `linear-gradient(180deg, #ebffe2 0%, ${COLORS.primary} 100%)` : '#2a2a2a', color: descripcion.trim() ? COLORS.primaryDark : COLORS.textMuted, fontWeight: '800', cursor: descripcion.trim() ? 'pointer' : 'not-allowed' }}>
              {analyzing ? 'Analizando...' : 'Estimar Macros'}
            </button>
          </div>
        )}

        {preview && !needsDescription && (
          <div>
            <img src={preview} alt="preview" style={{ width: '100%', borderRadius: '1rem', maxHeight: '240px', objectFit: 'cover', marginBottom: '1rem' }} />
            {analyzing && (
              <div style={{ textAlign: 'center', color: COLORS.primary }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>🧠 Analizando con Vision AI…</p>
              </div>
            )}
            {result && (
              <div style={{ background: COLORS.bgInput, borderRadius: '1rem', padding: '1rem' }}>
                <p style={{ color: COLORS.primary, fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.9rem' }}>✓ {result.nombre} {result.emoji}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  {RESULT_ITEMS.map((m) => (
                    <div key={m.label} style={{ background: COLORS.surface, borderRadius: '0.75rem', padding: '0.6rem' }}>
                      <p style={{ fontSize: '0.6rem', color: COLORS.textMuted }}>{m.label}</p>
                      <p style={{ fontSize: '1rem', fontWeight: '800', color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={handleRegister} disabled={saving} style={{ width: '100%', padding: '0.75rem', borderRadius: '9999px', border: 'none', background: `linear-gradient(180deg, #ebffe2 0%, ${COLORS.primary} 100%)`, color: COLORS.primaryDark, fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer' }}>
                  {saving ? 'Guardando...' : '✓ Registrar en COMBUSTIBLE'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Combustible = ({ profile = {} }) => {
  const { t } = useTranslation();
  const { foodLog, macrosConsumed, macrosTarget, addFoodEntry } = useNutricion(profile);
  const [showCamera, setShowCamera] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('hoy');
  const [hydrationMl, setHydrationMl] = useState(0);

  const calsPercent = macrosTarget.kcal > 0 ? Math.round((macrosConsumed.kcal / macrosTarget.kcal) * 100) : 0;

  const macroRings = [
    { label: 'PROTEÍNA', consumed: macrosConsumed.proteina_g, target: macrosTarget.proteina_g, unit: 'g', color: COLORS.primary },
    { label: 'CARBOS',   consumed: macrosConsumed.carbos_g,   target: macrosTarget.carbos_g,   unit: 'g', color: COLORS.secondary },
    { label: 'GRASAS',   consumed: macrosConsumed.grasas_g,   target: macrosTarget.grasas_g,   unit: 'g', color: COLORS.warning },
  ];

  return (
    <div style={{ padding: '2rem 1.5rem 9rem', fontFamily: "'Inter', sans-serif", color: COLORS.text, maxWidth: '480px', margin: '0 auto' }}>

      {showCamera && <CameraModal onClose={() => setShowCamera(false)} onAdd={addFoodEntry} />}
      {showAddModal && <AddFoodModal onClose={() => setShowAddModal(false)} onAdd={addFoodEntry} />}

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: COLORS.textSoft, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nutrición · IA</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', marginTop: '0.1rem' }}>{t('tabs.combustible')}</h1>
        </div>
        <button onClick={() => setShowCamera(true)} style={{ width: '52px', height: '52px', borderRadius: '50%', border: 'none', background: `linear-gradient(180deg, #ebffe2 0%, ${COLORS.primary} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,255,65,0.35)' }} title="Capturar Alimento con Vision AI">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={COLORS.primaryDark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </header>

      {/* Calorie Summary */}
      <section style={{ background: COLORS.surface, borderRadius: '1.5rem', padding: '1.25rem', marginBottom: '1.5rem', borderTop: `2px solid ${COLORS.primary}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: COLORS.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔥 Calorías del Día</p>
            <p style={{ fontSize: '2rem', fontWeight: '900', marginTop: '0.2rem', lineHeight: 1 }}>
              {macrosConsumed.kcal.toLocaleString()}
              <span style={{ fontSize: '1rem', color: COLORS.textMuted, fontWeight: '400' }}> / {macrosTarget.kcal.toLocaleString()} kcal</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: '900', color: calsPercent > 90 ? COLORS.warning : COLORS.primary }}>{calsPercent}%</p>
            <p style={{ fontSize: '0.6rem', color: COLORS.textMuted }}>COMPLETADO</p>
          </div>
        </div>
        <div style={{ width: '100%', height: '6px', background: COLORS.bgInput, borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(calsPercent, 100)}%`, height: '100%', borderRadius: '8px', transition: 'width 0.6s ease', background: calsPercent > 90 ? `linear-gradient(90deg, ${COLORS.warning} 0%, #FFD55E 100%)` : 'linear-gradient(90deg, #00e639 0%, #00FF41 100%)' }} />
        </div>
      </section>

      {/* Macro Rings */}
      <section style={{ background: COLORS.surface, borderRadius: '1.5rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.65rem', color: COLORS.textSoft, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>Macronutrientes</p>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {macroRings.map(ring => <MacroRing key={ring.label} value={ring} />)}
        </div>
      </section>

      {/* Hydration */}
      <section style={{ background: COLORS.surface, borderRadius: '1.5rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <HydrationBar
          consumed={hydrationMl}
          target={macrosTarget.agua_ml || 2800}
          onAddGlass={() => setHydrationMl(p => p + 250)}
        />
      </section>

      {/* Tab Switch */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: COLORS.surface, borderRadius: '9999px', padding: '4px' }}>
        {[{ id: 'hoy', label: '📋 Registro de Hoy' }, { id: 'menus', label: '⚡ Menús 15 min' }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '0.6rem', borderRadius: '9999px', border: 'none',
            background: activeTab === tab.id ? COLORS.primary : 'transparent',
            color: activeTab === tab.id ? COLORS.primaryDark : COLORS.textSoft,
            fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Food Log */}
      {activeTab === 'hoy' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {foodLog.length === 0 && (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '0.9rem', padding: '2rem 0' }}>
              Sin registros hoy. ¡Agrega tu primera comida!
            </p>
          )}
          {foodLog.map((item) => <FoodCard key={item.id} item={item} />)}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowAddModal(true)} style={{ flex: 1, padding: '1rem', borderRadius: '1.25rem', background: 'transparent', border: `2px dashed ${COLORS.border}`, color: COLORS.textSoft, fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              ✏️ Agregar manual
            </button>
            <button onClick={() => setShowCamera(true)} style={{ flex: 1, padding: '1rem', borderRadius: '1.25rem', background: 'transparent', border: `2px dashed ${COLORS.border}`, color: COLORS.textSoft, fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              📸 Vision AI
            </button>
          </div>
        </section>
      )}

      {/* Quick Menus */}
      {activeTab === 'menus' && (
        <section>
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {QUICK_MENUS.map((item) => <QuickMenuCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default Combustible;
