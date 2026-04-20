import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MarketingPage = () => {
    const navigate = useNavigate();

    const handleCTA = () => {
        navigate('/register');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const neonBtnStyle = {
        padding: '16px 32px', 
        borderRadius: '50px', 
        background: 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)',
        color: '#003907', 
        fontWeight: '900', 
        fontSize: '1rem', 
        border: 'none', 
        cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(0,255,65,0.3)', 
        textTransform: 'uppercase',
        transition: 'transform 0.2s',
    };

    return (
        <div style={{ 
            minHeight: '100vh', background: '#0a0a0a', color: '#e5e2e1', 
            fontFamily: "'Inter', sans-serif", overflowX: 'hidden' 
        }}>
            {/* --- Navbar --- */}
            <nav style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '24px 40px', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(10px)',
                position: 'fixed', width: '100%', top: 0, zIndex: 1000, borderBottom: '1px solid #1c1b1b'
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.04em' }}>
                    Core<span style={{ color: '#00FF41' }}>Adapt</span>
                </div>
                <button onClick={handleLogin} style={{
                    background: 'transparent', color: '#e5e2e1', border: '1px solid #3b4b37',
                    padding: '8px 24px', borderRadius: '50px', fontWeight: '700', cursor: 'pointer',
                    transition: 'all 0.2s'
                }}>
                    INICIAR SESIÓN
                </button>
            </nav>

            {/* --- Hero Section --- */}
            <section style={{ 
                padding: '140px 24px 100px', textAlign: 'center', 
                background: 'radial-gradient(circle at top, #2E5BFF22 0%, transparent 60%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                <div style={{
                    background: 'rgba(0,255,65,0.1)', border: '1px solid #00FF4144', color: '#00FF41',
                    padding: '6px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '800',
                    letterSpacing: '0.1em', marginBottom: '24px', textTransform: 'uppercase'
                }}>
                    Entrenamiento con Inteligencia Biológica
                </div>
                <h1 style={{ 
                    fontSize: '4rem', fontWeight: '900', letterSpacing: '-0.05em', lineHeight: '1', 
                    marginBottom: '24px', maxWidth: '800px'
                }}>
                    El primer <span style={{ color: '#00FF41' }}>Cerebro IA</span> que entiende tu nivel de fatiga.
                </h1>
                <p style={{ 
                    fontSize: '1.2rem', color: '#84967e', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' 
                }}>
                    Conecta tus dispositivos. Permite que la Inteligencia Alpha analice tu HRV y adapte dinámicamente tu plan de Running, Ciclismo, Fuerza o Nutrición en tiempo real.
                </p>
                <button onClick={handleCTA} style={{ ...neonBtnStyle, fontSize: '1.1rem', padding: '20px 48px' }}>
                    INICIAR PRUEBA DE 30 DÍAS GRATIS
                </button>
                <p style={{ color: '#84967e', fontSize: '0.85rem', marginTop: '16px' }}>
                    Sin tarjeta de crédito. Acceso total durante un mes.
                </p>
            </section>

            {/* --- Ecosystem Connectors --- */}
            <section style={{ padding: '40px 24px', background: '#131313', borderTop: '1px solid #1c1b1b', borderBottom: '1px solid #1c1b1b' }}>
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#84967e', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '32px' }}>
                    Sincronización Directa de Datos Biométricos
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', alignItems: 'center', opacity: 0.7 }}>
                    <h2 style={{ fontWeight: '900', fontSize: '1.8rem', color: '#FC4C02', margin: 0 }}>STRAVA</h2>
                    <h2 style={{ fontWeight: '900', fontSize: '1.8rem', color: '#007CC3', margin: 0 }}>GARMIN</h2>
                    <h2 style={{ fontWeight: '900', fontSize: '1.8rem', color: '#e51e25', margin: 0 }}>COROS</h2>
                    <h2 style={{ fontWeight: '900', fontSize: '1.8rem', color: '#fff', margin: 0 }}>❤️ Apple Health</h2>
                </div>
            </section>

            {/* --- Como Funciona --- */}
            <section style={{ padding: '100px 24px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px' }}>Tu Evolución Automática</h2>
                    <p style={{ color: '#84967e', fontSize: '1.1rem' }}>Olvídate de los planes estáticos que te lesionan.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    <div style={{ background: '#1c1b1b', padding: '40px', borderRadius: '32px', border: '1px solid #2a2a2a' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>📡</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '12px' }}>1. Lectura de Estrés</h3>
                        <p style={{ color: '#84967e', lineHeight: '1.6' }}>Sincroniza tus noches. Evaluamos tu HRV (Variación de Ritmo Cardíaco) y Body Battery al despertar.</p>
                    </div>
                    <div style={{ background: '#1c1b1b', padding: '40px', borderRadius: '32px', border: '1px solid #2E5BFF44' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🧠</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '12px', color: '#2E5BFF' }}>2. Alpha IA Decide</h3>
                        <p style={{ color: '#84967e', lineHeight: '1.6' }}>Si tu sistema nervioso está saturado, el Cerebro re-escribe tu entrenamiento del día priorizando la recuperación.</p>
                    </div>
                    <div style={{ background: '#1c1b1b', padding: '40px', borderRadius: '32px', border: '1px solid #00FF4144' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>⚡</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '12px', color: '#00FF41' }}>3. Nutrición Activa</h3>
                        <p style={{ color: '#84967e', lineHeight: '1.6' }}>Tras finalizar un entreno de alta carga, re-calculamos tus macros e hidratación para acelerar la adaptación.</p>
                    </div>
                </div>
            </section>

            {/* --- Pricing Section --- */}
            <section style={{ padding: '80px 24px 120px', background: '#131313', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px' }}>Invierte en tu Rendimiento</h2>
                <p style={{ color: '#84967e', fontSize: '1.1rem', marginBottom: '60px' }}>Inicia sin costo. Decide cuando te sorprendamos.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                    
                    {/* Trial */}
                    <div style={{ background: 'linear-gradient(180deg, #1c1b1b 0%, #0a0a0a 100%)', padding: '40px', borderRadius: '32px', border: '2px solid #00FF41', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: '#00FF41', color: '#003907', padding: '4px 16px', borderRadius: '50px', fontWeight: '800', fontSize: '0.8rem' }}>ARRANCA HOY</div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#84967e' }}>Prueba Inicial</h3>
                        <div style={{ margin: '24px 0', fontSize: '3rem', fontWeight: '900', color: '#fff' }}>0<span style={{ fontSize: '1.5rem', color: '#84967e' }}>$ /30 días</span></div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', textAlign: 'left', color: '#b9ccb2', lineHeight: '2' }}>
                            <li>✓ Acceso a IA Orquestadora</li>
                            <li>✓ Sincronización Dispositivos</li>
                            <li>✓ Nutrición con Vision AI</li>
                            <li>✓ Soporte para 7 disciplinas</li>
                        </ul>
                        <button onClick={handleCTA} style={{ ...neonBtnStyle, width: '100%', padding: '16px' }}>RECLAMAR 30 DÍAS</button>
                    </div>

                    {/* Mensual */}
                    <div style={{ background: '#1c1b1b', padding: '40px', borderRadius: '32px', border: '1px solid #2a2a2a' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#84967e' }}>Plan Mensual</h3>
                        <div style={{ margin: '24px 0', fontSize: '3rem', fontWeight: '900', color: '#fff' }}>--<span style={{ fontSize: '1.5rem', color: '#84967e' }}>$/mes</span></div>
                        <p style={{ color: '#84967e', fontSize: '0.9rem' }}>Pago automático post-prueba.</p>
                    </div>

                    {/* Anual */}
                    <div style={{ background: '#1c1b1b', padding: '40px', borderRadius: '32px', border: '1px solid #2a2a2a' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#84967e' }}>Plan Anual</h3>
                         <div style={{ margin: '24px 0', fontSize: '3rem', fontWeight: '900', color: '#fff' }}>--<span style={{ fontSize: '1.5rem', color: '#84967e' }}>$/año</span></div>
                        <p style={{ color: '#84967e', fontSize: '0.9rem' }}>Ahorro del 25% anualizado.</p>
                    </div>
                </div>
            </section>

             {/* --- Footer --- */}
             <footer style={{ padding: '40px 24px', textAlign: 'center', borderTop: '1px solid #1c1b1b', color: '#84967e', fontSize: '0.85rem' }}>
                <p>&copy; 2026 CoreAdapt by Antigravity. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default MarketingPage;
