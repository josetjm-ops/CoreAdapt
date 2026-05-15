import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getProfile, saveProfile } from './services/PersonalUser';
import BottomTabBar from './components/BottomTabBar';
import DashboardHoy from './views/DashboardHoy';
import MiPlan from './views/MiPlan';
import Combustible from './views/Combustible';
import Cockpit from './views/Cockpit';
import Callback from './views/Callback';
import SetupWizard from './components/SetupWizard';
import InstallPrompt from './components/InstallPrompt';

function MainLayout({ profile, setProfile }) {
  const [activeTab, setActiveTab] = useState('hoy');

  const renderView = () => {
    switch (activeTab) {
      case 'hoy':         return <DashboardHoy profile={profile} />;
      case 'miPlan':      return <MiPlan profile={profile} />;
      case 'combustible': return <Combustible profile={profile} />;
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
  const [profile, setProfile] = useState(() => getProfile());

  const handleSetupComplete = (profileData) => {
    saveProfile(profileData);
    setProfile(profileData);
  };

  const handleProfileUpdate = (updatedProfile) => {
    saveProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  // Sin perfil → Setup Wizard
  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#131313', maxWidth: '480px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
        <SetupWizard onComplete={handleSetupComplete} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/app/*" element={<MainLayout profile={profile} setProfile={handleProfileUpdate} />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      <InstallPrompt />
    </Router>
  );
}

export default App;
