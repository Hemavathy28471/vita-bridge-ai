import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SimulationDrawer from './components/SimulationDrawer';
import VitaGuideChat from './components/VitaGuideChat';
import ExplainAlertModal from './components/ExplainAlertModal';

// Pages
import DashboardPage from './pages/DashboardPage';
import LiveSensingPage from './pages/LiveSensingPage';
import RecheckStudioPage from './pages/RecheckStudioPage';
import ActivityEnginePage from './pages/ActivityEnginePage';
import TrendsTimelinePage from './pages/TrendsTimelinePage';
import InsightsPage from './pages/InsightsPage';
import AlertsPage from './pages/AlertsPage';
import DevicesPage from './pages/DevicesPage';
import CaregiverPage from './pages/CaregiverPage';
import ConsentPrivacyPage from './pages/ConsentPrivacyPage';
import AdminPage from './pages/AdminPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [explainingAlert, setExplainingAlert] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading VitaBridge AI...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateToRegister={() => setAuthView('register')} />;
  }

  // Open Explain Alert Modal
  const handleExplainAlert = (alertObj) => {
    setExplainingAlert(alertObj);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sticky Top Navbar with Tagline */}
      <Navbar
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onNavigateToRecheck={() => setActivePage('recheck')}
      />

      <div className="flex flex-1 relative">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 pb-24 lg:pb-12 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {activePage === 'dashboard' && (
            <DashboardPage
              onExplainAlert={handleExplainAlert}
              onNavigateToRecheck={() => setActivePage('recheck')}
              onNavigateToLiveSensing={() => setActivePage('live-sensing')}
              onNavigateToActivity={() => setActivePage('activity')}
            />
          )}
          {activePage === 'live-sensing' && (
            <LiveSensingPage onNavigateToRecheck={() => setActivePage('recheck')} />
          )}
          {activePage === 'recheck' && (
            <RecheckStudioPage onExplainAlert={handleExplainAlert} />
          )}
          {activePage === 'activity' && (
            <ActivityEnginePage onNavigateToRecheck={() => setActivePage('recheck')} />
          )}
          {activePage === 'trends' && (
            <TrendsTimelinePage onExplainAlert={handleExplainAlert} />
          )}
          {activePage === 'insights' && (
            <InsightsPage onNavigateToRecheck={() => setActivePage('recheck')} />
          )}
          {activePage === 'alerts' && (
            <AlertsPage onExplainAlert={handleExplainAlert} />
          )}
          {activePage === 'devices' && <DevicesPage />}
          {activePage === 'caregiver' && (
            <CaregiverPage onSelectPatient={(id) => setActivePage('dashboard')} />
          )}
          {activePage === 'consent' && <ConsentPrivacyPage />}
          {activePage === 'settings' && <ProfileSettingsPage />}
          {activePage === 'admin' && <AdminPage />}
        </main>
      </div>

      {/* Slide-over Health Event Simulator (Section 24 Demo Mode) */}
      <SimulationDrawer
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onSimulationCompleted={(result) => {
          if (result.alert && (result.alert.alertLevel === 'RED' || result.alert.alertLevel === 'ORANGE')) {
            setExplainingAlert(result.alert);
          }
        }}
      />

      {/* VitaGuide Conversational AI Assistant (Section 14) */}
      <VitaGuideChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Explainable AI Modal (Section 13) */}
      <ExplainAlertModal
        alert={explainingAlert}
        isOpen={!!explainingAlert}
        onClose={() => setExplainingAlert(null)}
        onAcknowledged={(id) => setExplainingAlert(null)}
        onNavigateToRecheck={() => {
          setExplainingAlert(null);
          setActivePage('recheck');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
