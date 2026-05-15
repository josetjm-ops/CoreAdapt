import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPersonalUID } from '../services/PersonalUser';
import { connectionService } from '../services/ConnectionService';

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setStatus('error');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    const targetService = state || 'strava';

    const handleCallback = async () => {
      try {
        const uid = getPersonalUID();
        await connectionService.connect(targetService, code, uid);
        setStatus('success');
        setTimeout(() => navigate('/'), 2000);
      } catch (err) {
        console.error("Connection failed:", err);
        setStatus('error');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{
      minHeight: '100vh', background: '#131313', color: '#e5e2e1',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center', fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(0,255,65,0.1)', border: '2px solid #00FF41',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem', position: 'relative'
      }}>
        {status === 'processing' && (
          <div className="spinner" style={{
            width: '40px', height: '40px', border: '3px solid rgba(0,255,65,0.2)',
            borderTopColor: '#00FF41', borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
        )}
        {status === 'success' && <span style={{ fontSize: '2.5rem', color: '#00FF41' }}>✓</span>}
        {status === 'error' && <span style={{ fontSize: '2.5rem', color: '#FF4444' }}>!</span>}
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
        {status === 'processing' && 'Sincronizando con el Cerebro...'}
        {status === 'success' && '¡Conexión Exitosa!'}
        {status === 'error' && 'Error en la conexión'}
      </h2>

      <p style={{ color: '#b9ccb2', marginTop: '1rem', fontSize: '0.9rem' }}>
        {status === 'processing' && 'Estamos vinculando tus datos de entrenamiento de forma segura.'}
        {status === 'success' && 'Redirigiendo a tu panel de control...'}
        {status === 'error' && 'No recibimos el permiso necesario. Inténtalo de nuevo.'}
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Callback;
