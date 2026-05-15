import React, { useState } from 'react';
import { getPersonalUID, saveProfile } from '../services/PersonalUser';
import { COLORS, FADE_IN_KEYFRAMES } from '../constants/theme';

const DISCIPLINES = [
  { id: 'Running', emoji: '🏃', label: 'Running' },
  { id: 'Trail', emoji: '⛰️', label: 'Trail Running' },
  { id: 'Ruta', emoji: '🚴', label: 'Ciclismo de Ruta' },
  { id: 'MTB', emoji: '🚵', label: 'Mountain Bike' },
  { id: 'Pesas', emoji: '🏋️', label: 'Fuerza / Pesas' },
  { id: 'Natacion', emoji: '🏊', label: 'Natación' },
];

const RESOURCES = [
  { id: 'bike_road', emoji: '🚴', label: 'Bicicleta de ruta' },
  { id: 'bike_mtb', emoji: '🚵', label: 'Bicicleta MTB' },
  { id: 'gym', emoji: '🏋️', label: 'Gimnasio' },
  { id: 'pool', emoji: '🏊', label: 'Piscina' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Principiante', desc: 'Menos de 1 año entrenando' },
  { id: 'intermediate', label: 'Intermedio', desc: '1-3 años de experiencia' },
  { id: 'advanced', label: 'Avanzado', desc: 'Más de 3 años entrenando' },
];

const inputStyle = {
  width: '100%',
  background: COLORS.bgInput,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '16px',
  padding: '16px 18px',
  color: '#fff',
  fontSize: '16px',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
};

const SetupWizard = ({ onComplete }) => {
  const [form, setForm] = useState({
    firstName: '',
    age: '',
    weight: '',
    disciplines: [],
    resources: [],
    experience: 'intermediate',
    milestone: '',
    milestoneDate: '',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleItem = (key, item) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter((i) => i !== item)
        : [...prev[key], item],
    }));
  };

  const canSubmit =
    form.firstName.trim() &&
    form.age &&
    form.weight &&
    form.disciplines.length > 0 &&
    form.milestone.trim();

  const handleSubmit = () => {
    const uid = getPersonalUID();
    const profileData = {
      uid,
      firstName: form.firstName.trim(),
      age: parseInt(form.age),
      weight: parseFloat(form.weight),
      disciplines: form.disciplines,
      resources: form.resources,
      experience: form.experience,
      milestone: form.milestone.trim(),
      milestoneDate: form.milestoneDate || null,
      avatar: parseInt(form.age) < 24 ? 'university' : 'executive',
      onboardingComplete: true,
      createDate: new Date().toISOString(),
    };
    onComplete(profileData);
  };

  return (
    <div style={{ padding: '3rem 1.5rem 4rem', color: COLORS.text, animation: 'fadeIn 0.6s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ color: COLORS.primary, fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
          ⚡ Configuración Inicial
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Configura tu CoreAdapt
        </h1>
        <p style={{ color: COLORS.textSoft, fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
          Completa tu perfil de atleta para que el Orquestador IA genere planes personalizados.
        </p>
      </div>

      {/* Nombre */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
          Tu nombre
        </label>
        <input
          type="text"
          placeholder="¿Cómo te llamas?"
          value={form.firstName}
          onChange={(e) => update('firstName', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Edad + Peso */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
            Edad
          </label>
          <input
            type="number"
            placeholder="Años"
            value={form.age}
            onChange={(e) => update('age', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
            Peso (kg)
          </label>
          <input
            type="number"
            placeholder="kg"
            value={form.weight}
            onChange={(e) => update('weight', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Experiencia */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.75rem' }}>
          Nivel de experiencia
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {EXPERIENCE_LEVELS.map((lvl) => {
            const active = form.experience === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => update('experience', lvl.id)}
                style={{
                  background: active ? `${COLORS.primary}15` : COLORS.surface,
                  border: active ? `2px solid ${COLORS.primary}` : '2px solid transparent',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  color: active ? COLORS.primary : COLORS.text,
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                {lvl.label}
                <span style={{ display: 'block', fontSize: '0.72rem', color: COLORS.textMuted, fontWeight: '400', marginTop: '2px' }}>
                  {lvl.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Disciplinas */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.75rem' }}>
          Disciplinas que practicas *
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          {DISCIPLINES.map((d) => {
            const active = form.disciplines.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleItem('disciplines', d.id)}
                style={{
                  background: active ? `${COLORS.primary}15` : COLORS.surface,
                  border: active ? `2px solid ${COLORS.primary}` : '2px solid transparent',
                  borderRadius: '1.25rem',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  color: active ? COLORS.primary : COLORS.text,
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  transition: 'all 0.2s',
                  boxShadow: active ? '0 0 16px rgba(0,255,65,0.12)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{d.emoji}</span>
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recursos */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.75rem' }}>
          Recursos disponibles
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          {RESOURCES.map((r) => {
            const active = form.resources.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggleItem('resources', r.id)}
                style={{
                  background: active ? `${COLORS.secondary}15` : COLORS.surface,
                  border: active ? `2px solid ${COLORS.secondary}` : '2px solid transparent',
                  borderRadius: '1.25rem',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  color: active ? COLORS.secondary : COLORS.text,
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{r.emoji}</span>
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Objetivo */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
          Tu objetivo / hito *
        </label>
        <input
          type="text"
          placeholder="Ej: Media Maratón, 100km Trail, Ironman..."
          value={form.milestone}
          onChange={(e) => update('milestone', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Fecha objetivo */}
      <div style={{ marginBottom: '2.5rem' }}>
        <label style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
          Fecha del objetivo (opcional)
        </label>
        <input
          type="date"
          value={form.milestoneDate}
          onChange={(e) => update('milestoneDate', e.target.value)}
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '1.25rem',
          borderRadius: '9999px',
          background: canSubmit
            ? 'linear-gradient(180deg, #ebffe2 0%, #00ff41 100%)'
            : '#353534',
          color: canSubmit ? COLORS.primaryDark : COLORS.textMuted,
          border: 'none',
          fontWeight: '900',
          fontSize: '1rem',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: "'Inter', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          boxShadow: canSubmit ? '0 0 30px rgba(0,255,65,0.3)' : 'none',
          transition: 'all 0.3s',
        }}
      >
        🚀 Iniciar CoreAdapt
      </button>

      <style>{FADE_IN_KEYFRAMES}</style>
    </div>
  );
};

export default SetupWizard;
