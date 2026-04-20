import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, reload } from 'firebase/auth';
import MarketingPage from './views/MarketingPage';
import Login from './views/Login';
import Signup from './views/Signup';
import Onboarding from './views/Onboarding';
import BottomTabBar from './components/BottomTabBar';
import DashboardHoy from './views/DashboardHoy';
import MiPlan from './views/MiPlan';
import Combustible from './views/Combustible';
import Cockpit from './views/Cockpit';
import Callback from './views/Callback';
import Paywall from './views/Paywall';
import VerifyEmail from './views/VerifyEmail';
import InstallPrompt from './components/InstallPrompt';

function MainLayout({ profile, setProfile }) {
  const [activeTab, setActiveTab] = useState('hoy');

  const renderView = () => {
    switch (activeTab) {
      case 'hoy':         return <DashboardHoy profile={profile} />;
      case 'miPlan':      return <MiPlan profile={profile} />;
      case 'combustible': return <Combustible />;
      case 'cockpit':     return <Cockpit profile={profile} setProfile={setProfile} />;
      default:            return <DashboardHoy profile={profile} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#131313', maxWidth: '480px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {renderView()}
      <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('coreAdaptProfile');
    return saved ? JSON.parse(saved) : null;
  });

  const refreshUser = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setCurrentUser({ ...auth.currentUser });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser({ ...user });
        
        // RECUPERACIÓN AUTOMÁTICA: Si no hay perfil local, lo buscamos en Firestore
        if (!profile) {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('./firebaseConfig');
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().onboardingComplete) {
            const profileData = userDoc.data();
            setProfile(profileData);
            localStorage.setItem('coreAdaptProfile', JSON.stringify(profileData));
          }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

  const handleOnboardingComplete = (profileData) => {
    setProfile(profileData);
    localStorage.setItem('coreAdaptProfile', JSON.stringify(profileData));
  };

  if (loading) return null;

  return (
    <Router>
      <Routes>
        {/* Public Routes - Solo visibles si NO hay usuario logueado */}
        {!currentUser && (
          <>
            <Route path="/" element={<MarketingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />} />
          </>
        )}

        {/* Authenticated Routes */}
        {currentUser ? (
          <>
            {!currentUser.emailVerified ? (
              // ── Email no verificado: solo puede acceder a la pantalla de verificación
              <>
                <Route path="/verify-email" element={<VerifyEmail onRefresh={refreshUser} />} />
                <Route path="*" element={<Navigate to="/verify-email" replace />} />
              </>
            ) : !profile ? (
              // ── Email verificado pero sin perfil: debe completar el onboarding
              <>
                <Route path="/onboarding" element={<Onboarding onComplete={handleOnboardingComplete} />} />
                <Route path="*" element={<Navigate to="/onboarding" replace />} />
              </>
            ) : (
              // ── Usuario completo: acceso a la app
              <>
                <Route path="/app/*" element={<MainLayout profile={profile} setProfile={setProfile} />} />
                <Route path="/callback" element={<Callback />} />
                <Route path="/paywall" element={<Paywall />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </>
            )}
          </>
        ) : (
          // ── No autenticado: redirigir siempre al marketing
          <Route path="*" element={<Navigate to="/" replace />} />
        )}

      </Routes>
      <InstallPrompt />
    </Router>
  );
}

export default App;
