import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { HospitalsPage } from './pages/HospitalsPage';
import { FederatedTrainingPage } from './pages/FederatedTrainingPage';
import { TrustManagementPage } from './pages/TrustManagementPage';
import { SecureAggregationPage } from './pages/SecureAggregationPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { User, FederatedStatus } from './types';
import { federatedApi } from './services/api';
import { Menu } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>({
    id: 1,
    username: 'admin',
    email: 'admin@hospital-fl.org',
    full_name: 'Chief Medical AI Officer',
    role: 'ADMIN',
    is_active: true
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('fed_token') || 'demo-token');
  const [activeTab, setActiveTab] = useState<NavItemKey>('welcome');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trainingState, setTrainingState] = useState<string>('IDLE');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const s = await federatedApi.getStatus();
        setTrainingState(s.state);
      } catch (e) {
        // quiet error
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (loggedInUser: User, authToken: string) => {
    setUser(loggedInUser);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('fed_token');
    setUser(null);
    setToken(null);
  };

  const handleSwitchRole = (newRole: 'ADMIN' | 'OPERATOR' | 'RESEARCHER') => {
    if (user) {
      setUser({
        ...user,
        role: newRole,
        username: newRole === 'OPERATOR' ? 'operator_hospA' : newRole === 'RESEARCHER' ? 'researcher' : 'admin',
        full_name: newRole === 'OPERATOR' ? 'Hospital A Lead Operator' : newRole === 'RESEARCHER' ? 'Senior ML Scientist' : 'Chief Medical AI Officer'
      });
    }
  };

  if (!user || !token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'welcome':
        return <WelcomePage onEnterApp={(targetTab) => setActiveTab(targetTab || 'dashboard')} />;
      case 'dashboard':
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'hospitals':
        return <HospitalsPage />;
      case 'training':
        return <FederatedTrainingPage />;
      case 'trust':
        return <TrustManagementPage />;
      case 'aggregation':
        return <SecureAggregationPage />;
      case 'predictions':
        return <PredictionsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'experiments':
        return <ExperimentsPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <WelcomePage onEnterApp={(targetTab) => setActiveTab(targetTab || 'dashboard')} />;
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onNavigateWelcome={() => setActiveTab('welcome')}
        trainingState={trainingState}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 overflow-y-auto min-h-screen flex flex-col">
          {/* Mobile Header Menu Trigger */}
          <div className="lg:hidden p-3 border-b border-navy-800 bg-navy-950/80 flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-navy-900 border border-navy-700 text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-cyan-400 capitalize">
              {activeTab} Module
            </span>
          </div>

          {/* Page View Container */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderActivePage()}
          </div>

          {/* Footer */}
          <footer className="mt-auto border-t border-navy-800/80 py-4 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 bg-navy-950/80">
            <div>
              <span className="font-semibold text-white">Privacy-Preserving Federated Learning for Smart Hospitals</span>
              <span className="text-slate-400 hidden md:inline"> — Adaptive Trust-Aware Consortium Engine</span>
            </div>
            <div className="flex items-center space-x-4 text-[11px] font-mono text-cyan-400">
              <span>SMPC: Shamir Secret Sharing</span>
              <span>•</span>
              <span>Trust: λ=0.90 EMA</span>
              <span>•</span>
              <span className="text-emerald-400">Zero Raw Patient Leaks</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
export default App;
