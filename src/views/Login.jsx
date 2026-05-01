import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AuthLayout from '../components/AuthLayout';
import { INPUT_STYLE, LABEL_STYLE, BTN_PRIMARY_STYLE, COLORS } from '../constants/theme';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, formData.email, formData.password);

      let hasProfile = false;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().onboardingComplete) {
        localStorage.setItem('coreAdaptProfile', JSON.stringify(userDoc.data()));
        hasProfile = true;
      } else {
        localStorage.removeItem('coreAdaptProfile');
      }

      if (!user.emailVerified) {
        navigate('/verify-email', { replace: true });
      } else if (hasProfile) {
        navigate('/app', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch {
      alert('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const update = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  return (
    <AuthLayout subtitle="Acceso al Cerebro" title="INGRESAR">
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <label style={LABEL_STYLE}>Correo Electrónico</label>
          <input required type="email" value={formData.email} onChange={update('email')} style={INPUT_STYLE} placeholder="atleta@premium.com" />
        </div>
        <div style={{ position: 'relative' }}>
          <label style={LABEL_STYLE}>Contraseña</label>
          <input required type="password" value={formData.password} onChange={update('password')} style={INPUT_STYLE} placeholder="******" />
        </div>
        <button type="submit" disabled={loading} style={BTN_PRIMARY_STYLE}>
          {loading ? '...' : 'INICIAR SESIÓN'}
        </button>
      </form>
      <p style={{ marginTop: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px' }}>
        ¿No tienes cuenta?{' '}
        <span onClick={() => navigate('/register')} style={{ color: COLORS.primary, cursor: 'pointer', fontWeight: '700' }}>
          Regístrate aquí
        </span>
      </p>
    </AuthLayout>
  );
};

export default Login;
