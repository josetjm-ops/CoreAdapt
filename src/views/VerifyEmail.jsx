import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { reload } from 'firebase/auth';

const VerifyEmail = ({ onRefresh }) => {
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Poll for verification status every 3 seconds
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          if (onRefresh) onRefresh();
          navigate('/onboarding');
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [navigate, onRefresh]);

  const handleCheckNow = async () => {
    setChecking(true);
    if (auth.currentUser) {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        if (onRefresh) onRefresh();
        navigate('/onboarding');
      } else {
        alert("Email not yet verified. Please check your inbox and spam folder.");
      }
    }
    setChecking(false);
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#131313', color: '#e5e2e1',
      fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '40px 24px', maxWidth: '480px', margin: '0 auto', textAlign: 'center'
    }}>
      <header>
        <p style={{ color: '#00FF41', textTransform: 'uppercase', letterSpacing: '4px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>Security Protocol</p>
        <h1 style={{ fontSize: '32px', fontWeight: '700', lineHeight: '1.1', marginBottom: '16px' }}>VERIFY YOUR IDENTITY.</h1>
        <p style={{ color: '#b9ccb2', fontSize: '18px', lineHeight: '1.5', marginBottom: '40px' }}>
          We've sent a verification link to <strong>{auth.currentUser?.email}</strong>.<br/><br/>
          Please check your inbox (and spam) to activate your account.
        </p>
      </header>

      <div style={{ backgroundColor: '#1c1b1b', padding: '32px', borderRadius: '24px', border: '1px solid #3b4b37', marginBottom: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        <p style={{ fontSize: '14px', color: '#84967e', marginBottom: '24px' }}>Once verified, this page will update automatically.</p>
        <button 
          onClick={handleCheckNow}
          disabled={checking}
          style={{
            width: '100%', backgroundColor: '#00FF41', color: '#003907', border: 'none', borderRadius: '99px',
            padding: '20px', fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', cursor: 'pointer',
            transition: 'transform 0.2s', ':active': { transform: 'scale(0.98)' }
          }}
        >
          {checking ? 'Checking Status...' : 'I Verified My Email'}
        </button>
      </div>

      <button 
        onClick={() => { auth.signOut(); navigate('/'); }}
        style={{ color: '#84967e', background: 'none', border: 'none', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', opacity: 0.7 }}
      >
        Sign in with another account
      </button>
    </div>
  );
};

export default VerifyEmail;
