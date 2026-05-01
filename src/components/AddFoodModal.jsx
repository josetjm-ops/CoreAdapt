import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { COLORS } from '../constants/theme';

const QUICK_FOODS = [
  { nombre: 'Avena con leche', emoji: '🥣', kcal: 320, proteina_g: 14, carbos_g: 52, grasas_g: 7, tag: 'Desayuno' },
  { nombre: 'Pechuga de pollo 150g', emoji: '🍗', kcal: 250, proteina_g: 45, carbos_g: 0, grasas_g: 6, tag: 'Almuerzo' },
  { nombre: 'Arroz integral 1 taza', emoji: '🍚', kcal: 220, proteina_g: 5, carbos_g: 46, grasas_g: 2, tag: 'Almuerzo' },
  { nombre: 'Batido proteico', emoji: '🥛', kcal: 180, proteina_g: 30, carbos_g: 10, grasas_g: 3, tag: 'Post-Run' },
  { nombre: 'Banana', emoji: '🍌', kcal: 90, proteina_g: 1, carbos_g: 23, grasas_g: 0, tag: 'Pre-Entreno' },
  { nombre: 'Huevos revueltos x3', emoji: '🍳', kcal: 240, proteina_g: 18, carbos_g: 2, grasas_g: 17, tag: 'Desayuno' },
  { nombre: 'Salmón 150g', emoji: '🐟', kcal: 280, proteina_g: 38, carbos_g: 0, grasas_g: 14, tag: 'Cena' },
  { nombre: 'Quinoa 1 taza', emoji: '🥗', kcal: 222, proteina_g: 8, carbos_g: 39, grasas_g: 4, tag: 'Almuerzo' },
  { nombre: 'Nueces 30g', emoji: '🥜', kcal: 185, proteina_g: 4, carbos_g: 4, grasas_g: 18, tag: 'Snack' },
  { nombre: 'Yogur griego', emoji: '🫙', kcal: 100, proteina_g: 17, carbos_g: 6, grasas_g: 1, tag: 'Snack' },
  { nombre: 'Pasta integral 80g', emoji: '🍝', kcal: 280, proteina_g: 10, carbos_g: 54, grasas_g: 2, tag: 'Pre-Entreno' },
  { nombre: 'Brócoli 200g', emoji: '🥦', kcal: 70, proteina_g: 6, carbos_g: 11, grasas_g: 1, tag: 'Almuerzo' },
  { nombre: 'Aguacate ½', emoji: '🥑', kcal: 120, proteina_g: 2, carbos_g: 6, grasas_g: 11, tag: 'Snack' },
  { nombre: 'Gel energético', emoji: '⚡', kcal: 100, proteina_g: 0, carbos_g: 25, grasas_g: 0, tag: 'Pre-Entreno' },
  { nombre: 'Pavo wrap', emoji: '🌯', kcal: 350, proteina_g: 28, carbos_g: 35, grasas_g: 8, tag: 'Almuerzo' },
];

const TAGS = ['Desayuno', 'Pre-Entreno', 'Post-Run', 'Almuerzo', 'Cena', 'Snack'];

const AddFoodModal = ({ onClose, onAdd }) => {
  const [mode, setMode] = useState('quick');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [hora, setHora] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [custom, setCustom] = useState({ nombre: '', emoji: '🍽️', kcal: '', proteina_g: '', carbos_g: '', grasas_g: '', tag: 'Almuerzo' });
  const [saving, setSaving] = useState(false);

  const filtered = QUICK_FOODS.filter(f =>
    !search || f.nombre.toLowerCase().includes(search.toLowerCase()) || f.tag.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    const entry = mode === 'quick'
      ? { ...selected, hora }
      : { ...custom, kcal: Number(custom.kcal), proteina_g: Number(custom.proteina_g), carbos_g: Number(custom.carbos_g), grasas_g: Number(custom.grasas_g), hora };

    if (!entry.nombre || !entry.kcal) return;

    setSaving(true);
    try {
      await onAdd(entry);
      onClose();
    } catch {
      alert('Error guardando la comida.');
    } finally {
      setSaving(false);
    }
  };

  const canSave = mode === 'quick' ? !!selected : !!(custom.nombre && custom.kcal);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ background: COLORS.surface, borderRadius: '1.5rem 1.5rem 0 0', padding: '1.5rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: COLORS.text }}>Agregar Comida</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted }}>
            <X size={22} />
          </button>
        </div>

        {/* Mode switch */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: COLORS.bgInput, borderRadius: '9999px', padding: '3px' }}>
          {[{ id: 'quick', label: '⚡ Rápido' }, { id: 'manual', label: '✏️ Manual' }].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{ flex: 1, padding: '0.5rem', borderRadius: '9999px', border: 'none', background: mode === m.id ? COLORS.primary : 'transparent', color: mode === m.id ? COLORS.primaryDark : COLORS.textSoft, fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {mode === 'quick' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: COLORS.bgInput, borderRadius: '0.75rem', padding: '0.6rem 0.875rem', marginBottom: '1rem' }}>
                <Search size={16} color={COLORS.textMuted} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alimento..." style={{ background: 'none', border: 'none', outline: 'none', color: COLORS.text, flex: 1, fontSize: '0.9rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filtered.map((f, i) => (
                  <div key={i} onClick={() => setSelected(f === selected ? null : f)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.875rem', borderRadius: '0.875rem', cursor: 'pointer',
                    background: selected === f ? `${COLORS.primary}18` : COLORS.bgInput,
                    border: `1px solid ${selected === f ? COLORS.primary : 'transparent'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{f.emoji}</span>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: '700', color: COLORS.text }}>{f.nombre}</p>
                        <p style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>{f.tag} · P:{f.proteina_g}g C:{f.carbos_g}g G:{f.grasas_g}g</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: COLORS.primary }}>{f.kcal} kcal</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {mode === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Nombre', key: 'nombre', type: 'text', placeholder: 'Pollo con arroz' },
                { label: 'Emoji', key: 'emoji', type: 'text', placeholder: '🍗' },
                { label: 'Calorías (kcal)', key: 'kcal', type: 'number', placeholder: '350' },
                { label: 'Proteína (g)', key: 'proteina_g', type: 'number', placeholder: '30' },
                { label: 'Carbos (g)', key: 'carbos_g', type: 'number', placeholder: '40' },
                { label: 'Grasas (g)', key: 'grasas_g', type: 'number', placeholder: '10' },
              ].map(f => (
                <div key={f.key}>
                  <p style={{ fontSize: '0.65rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{f.label}</p>
                  <input type={f.type} value={custom[f.key]} onChange={e => setCustom(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '0.75rem', background: COLORS.bgInput, border: `1px solid ${COLORS.border}`, borderRadius: '0.75rem', color: COLORS.text, fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <p style={{ fontSize: '0.65rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Categoría</p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {TAGS.map(tag => (
                    <button key={tag} onClick={() => setCustom(p => ({ ...p, tag }))} style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', background: custom.tag === tag ? COLORS.primary : COLORS.bgInput, color: custom.tag === tag ? COLORS.primaryDark : COLORS.textSoft }}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hora + guardar */}
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input type="time" value={hora} onChange={e => setHora(e.target.value)} style={{ padding: '0.75rem', background: COLORS.bgInput, border: `1px solid ${COLORS.border}`, borderRadius: '0.75rem', color: COLORS.text, fontSize: '0.9rem' }} />
          <button onClick={handleAdd} disabled={!canSave || saving}
            style={{ flex: 1, padding: '0.875rem', borderRadius: '9999px', border: 'none', background: canSave ? `linear-gradient(180deg, #ebffe2 0%, ${COLORS.primary} 100%)` : COLORS.bgInput, color: canSave ? COLORS.primaryDark : COLORS.textMuted, fontWeight: '800', fontSize: '0.9rem', cursor: canSave ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Guardando...' : '+ Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFoodModal;
