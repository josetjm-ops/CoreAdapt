import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebaseConfig';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';

const Signup = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [countryCode, setCountryCode] = useState('+57');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      await updateProfile(user, { displayName: formData.name });

      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 días

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
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "users", user.uid), userData);
      // No guardamos el perfil aún porque no está completo (onboarding)
      localStorage.removeItem('coreAdaptProfile');
      
      // Llamada síncrona al webhook de Google Sheets (no bloqueante para UX)
      fetch('https://script.google.com/macros/s/AKfycbwUILJYG_mCAZoGzIVNj0n3A72jjOO_qVUbFg8UCkKz9TaneaUzYAf757hAxWb9IR8/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'signup',
          email: formData.email,
          name: formData.name,
          phone: fullPhone,
          registrationDate: now.toISOString(),
          trialEndsAt: trialEndsAt.toISOString(),
          status: 'Iniciado'
        })
      }).catch(err => console.error("Error sincronizando initial con Google Sheets:", err));

      navigate('/verify-email');
    } catch (error) {
      console.error(error);
      let msg = "Error en el registro.";
      if (error.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado. Intenta dar clic en INGRESA AQUÍ al final.";
      if (error.code === 'auth/weak-password') msg = "La contraseña debe tener al menos 6 caracteres.";
      if (error.code === 'auth/invalid-email') msg = "El formato del correo no es válido.";
      alert(msg);
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
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '12px', color: '#00FF41', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '16px' }}>RECLAMAR 30 DÍAS GRATIS</h2>
        <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase' }}>REGISTRARSE</h1>
      </header>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>Nombre Completo</label>
          <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} placeholder="Nombre del Atleta" />
        </div>
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>Correo Electrónico</label>
          <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} placeholder="atleta@premium.com" />
        </div>
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>Contraseña</label>
          <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={inputStyle} placeholder="******" />
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
           <div style={{ position: 'relative', width: '100px' }}>
              <label style={labelStyle}>COD</label>
              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }}>
                <option value="+57">🇨🇴 +57</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+34">🇪🇸 +34</option>
              </select>
           </div>
           <div style={{ position: 'relative', flex: 1 }}>
              <label style={labelStyle}>WhatsApp</label>
              <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={inputStyle} placeholder="300 000 0000" />
           </div>
        </div>

        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)', color: '#003907', border: 'none', borderRadius: '50px', padding: '20px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '16px' }}>
          {loading ? '...' : 'INICIAR PRUEBA GRATUITA'}
        </button>
      </form>

      <p style={{ marginTop: '32px', textAlign: 'center', color: '#84967e', fontSize: '14px' }}>
        ¿Ya tienes cuenta? <span onClick={() => navigate('/login')} style={{ color: '#00FF41', cursor: 'pointer', fontWeight: '700' }}>Ingresa aquí</span>
      </p>
    </div>
  );
};

export default Signup;
