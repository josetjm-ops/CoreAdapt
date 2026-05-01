import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import AuthLayout from '../components/AuthLayout';
import { INPUT_STYLE, LABEL_STYLE, BTN_PRIMARY_STYLE, COLORS } from '../constants/theme';
import { postToSheets } from '../constants/api';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [countryCode, setCountryCode] = useState('+57');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await sendEmailVerification(user);
      await updateProfile(user, { displayName: formData.name });

      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const fullPhone = `${countryCode} ${formData.phone}`;

      const userData = {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: fullPhone,
        registrationDate: now.toISOString(),
        trialStartedAt: now.toISOString(),
        trialEndsAt: trialEndsAt.toISOString(),
        subscriptionStatus: 'trial',
        subscriptionPlan: 'none',
        paymentDate: null,
        nextBillingDate: null,
        onboardingComplete: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      localStorage.removeItem('coreAdaptProfile');

      postToSheets({
        action: 'signup',
        email: formData.email,
        name: formData.name,
        phone: fullPhone,
        registrationDate: now.toISOString(),
        trialEndsAt: trialEndsAt.toISOString(),
        status: 'Iniciado',
      });

      navigate('/verify-email');
    } catch (error) {
      let msg = 'Error en el registro.';
      if (error.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado. Intenta dar clic en INGRESA AQUÍ al final.';
      if (error.code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
      if (error.code === 'auth/invalid-email') msg = 'El formato del correo no es válido.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const update = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  return (
    <AuthLayout subtitle="RECLAMAR 30 DÍAS GRATIS" title="REGISTRARSE">
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <label style={LABEL_STYLE}>Nombre Completo</label>
          <input required type="text" value={formData.name} onChange={update('name')} style={INPUT_STYLE} placeholder="Nombre del Atleta" />
        </div>
        <div style={{ position: 'relative' }}>
          <label style={LABEL_STYLE}>Correo Electrónico</label>
          <input required type="email" value={formData.email} onChange={update('email')} style={INPUT_STYLE} placeholder="atleta@premium.com" />
        </div>
        <div style={{ position: 'relative' }}>
          <label style={LABEL_STYLE}>Contraseña</label>
          <input required type="password" value={formData.password} onChange={update('password')} style={INPUT_STYLE} placeholder="******" />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100px' }}>
            <label style={LABEL_STYLE}>COD</label>
            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ ...INPUT_STYLE, textAlign: 'center' }}>
              <option value="+57">🇨🇴 +57</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+34">🇪🇸 +34</option>
            </select>
          </div>
          <div style={{ position: 'relative', flex: 1 }}>
            <label style={LABEL_STYLE}>WhatsApp</label>
            <input required type="tel" value={formData.phone} onChange={update('phone')} style={INPUT_STYLE} placeholder="300 000 0000" />
          </div>
        </div>

        <button type="submit" disabled={loading} style={BTN_PRIMARY_STYLE}>
          {loading ? '...' : 'INICIAR PRUEBA GRATUITA'}
        </button>
      </form>

      <p style={{ marginTop: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px' }}>
        ¿Ya tienes cuenta?{' '}
        <span onClick={() => navigate('/login')} style={{ color: COLORS.primary, cursor: 'pointer', fontWeight: '700' }}>
          Ingresa aquí
        </span>
      </p>
    </AuthLayout>
  );
};

export default Signup;
