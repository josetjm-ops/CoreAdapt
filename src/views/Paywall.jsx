import React, { useState } from 'react';

const Paywall = () => {
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    setLoading(true);
    // Link to Bold payment
    window.location.href = 'https://bold.co/p/coreadapt-subscription'; // Placeholder for user's Bold Link
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#131313',
      color: '#e5e2e1',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '40px 24px',
      maxWidth: '480px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <header>
        <p style={{ color: '#FFBF00', textTransform: 'uppercase', letterSpacing: '4px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>Trial Ended</p>
        <h1 style={{ fontSize: '48px', fontWeight: '700', lineHeight: '1.1', marginBottom: '16px' }}>PERFORMANCE UPGRADE REQUIRED.</h1>
        <p style={{ color: '#b9ccb2', fontSize: '18px', lineHeight: '1.5', marginBottom: '40px' }}>Your 7-day trial of CoreAdapt has expired. Upgrade now to keep your Brain Insights and live Garmin sessions active.</p>
      </header>

      <div style={{
        backgroundColor: '#1c1b1b',
        padding: '32px',
        borderRadius: '24px',
        border: '1px solid #3b4b37',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Monthly Mission</h2>
        <p style={{ color: '#00FF41', fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>$29.99 / mo</p>
        
        <ul style={{ textAlign: 'left', listStyle: 'none', padding: '0', margin: '0 0 32px 0', fontSize: '14px', color: '#b9ccb2' }}>
          <li style={{ marginBottom: '10px' }}>✅ Brain RAG Intelligence</li>
          <li style={{ marginBottom: '10px' }}>✅ Unlimited Garmin & Strava Sync</li>
          <li style={{ marginBottom: '10px' }}>✅ Periodization Schedule</li>
          <li style={{ marginBottom: '10px' }}>✅ Real-time Bio-feedback (Cockpit)</li>
        </ul>

        <button 
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#00FF41',
            color: '#003907',
            border: 'none',
            borderRadius: '99px',
            padding: '20px',
            fontSize: '16px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Redirecting to Bold Pay...' : 'SUBSCRIBE & UPGRADE'}
        </button>
      </div>

      <footer style={{ marginTop: 'auto' }}>
        <p style={{ color: '#84967e', fontSize: '12px' }}>
          By upgrading, you accept our Terms of Service.<br/>
          Secure payments powered by Bold.co
        </p>
      </footer>
    </div>
  );
};

export default Paywall;
