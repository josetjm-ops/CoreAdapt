import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Sincronizar perfil local desde Firestore
      let hasProfile = false;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().onboardingComplete) {
        localStorage.setItem('coreAdaptProfile', JSON.stringify(userDoc.data()));
        hasProfile = true;
      } else {
        localStorage.removeItem('coreAdaptProfile');
      }

      // Redirección Explícita y Forzada (Garantiza el cambio de vista instantáneo)
      if (!user.emailVerified) {
        navigate('/verify-email', { replace: true });
      } else if (hasProfile) {
        navigate('/app', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (error) {
      console.error(error);
      alert("Credenciales incorrectas. Verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };


  const inputStyle = {
    width: '100%', backgroundColor: '#0e0e0e', border: '1px solid #3b4b37',
    borderRadius: '12px', padding: '18px', color: '#fff', outline: 'none', fontSize: '16px'
  };

  const labelStyle = {
    fontSize: '10px', color: '#84967e', position: 'absolute', top: '-8px', left: '16px',
    background: '#131313', padding: '0 4px', textTransform: 'uppercase', fontWeight: 600, zIndex: 1
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#131313', color: '#e5e2e1', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px', maxWidth: '440px', margin: '0 auto' }}>
      <header style={{ marginBottom: '48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '12px', color: '#00FF41', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '16px' }}>Acceso al Cerebro</h2>
        <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase' }}>INGRESAR</h1>
      </header>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>Correo Electrónico</label>
          <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} placeholder="atleta@premium.com" />
        </div>
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>Contraseña</label>
          <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={inputStyle} placeholder="******" />
        </div>

        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)', color: '#003907', border: 'none', borderRadius: '50px', padding: '20px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '16px' }}>
          {loading ? '...' : 'INICIAR SESIÓN'}
        </button>
      </form>

      <p style={{ marginTop: '32px', textAlign: 'center', color: '#84967e', fontSize: '14px' }}>
        ¿No tienes cuenta? <span onClick={() => navigate('/register')} style={{ color: '#00FF41', cursor: 'pointer', fontWeight: '700' }}>Regístrate aquí</span>
      </p>
    </div>
  );
};

export default Login;
