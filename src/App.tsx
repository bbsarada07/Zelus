import React, { useState, lazy, Suspense } from 'react';
import { Sun, Moon, LogOut, Shield, Smartphone, Hammer, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { ZelusStateProvider, useZelus } from './context/ZelusStateContext';
import { ZetaLoader } from './components/ZetaLoader';
import { LoginScreen } from './components/LoginScreen';
import { MobileViewport } from './components/MobileViewport';
import { MockSearchEngine } from './components/MockSearchEngine';
import type { UserRole } from './types';

const CitizenSimulator = lazy(() => import('./components/CitizenSimulator').then(m => ({ default: m.CitizenSimulator })));
const GovernmentDashboard = lazy(() => import('./components/GovernmentDashboard').then(m => ({ default: m.GovernmentDashboard })));
const ContractorDashboard = lazy(() => import('./components/ContractorDashboard').then(m => ({ default: m.ContractorDashboard })));

const DashboardFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-4 font-mono">
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
      <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent-cyan, #00FFCC)' }}>
        Loading Secure Portal Node...
      </span>
    </div>
    <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
      <div className="h-full bg-cyan-500 rounded-full animate-pulse" style={{ width: '60%' }} />
    </div>
  </div>
);

// ── Toast Layer ───────────────────────────────────────────────────────────
const ToastLayer: React.FC = () => {
  const { toasts, dismissToast } = useZelus();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-12 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => {
        const colors = {
          success: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.4)', color: '#22C55E', Icon: CheckCircle2 },
          warning: { bg: 'rgba(255,204,0,0.1)', border: 'rgba(255,204,0,0.4)', color: '#FFCC00', Icon: AlertTriangle },
          error:   { bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.4)', color: '#FF3B30', Icon: AlertTriangle },
          info:    { bg: 'rgba(0,255,204,0.1)', border: 'rgba(0,255,204,0.4)', color: '#00FFCC', Icon: Info },
        }[toast.type];
        const { bg, border, color, Icon } = colors;
        return (
          <div 
            key={toast.id} 
            onClick={() => {
              if (toast.message.toLowerCase().includes('sync error') || toast.message.toLowerCase().includes('retry')) {
                window.dispatchEvent(new CustomEvent('zelus-retry-sync', { detail: { id: toast.id } }));
                dismissToast(toast.id);
              }
            }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 animate-toast-in shadow-2xl backdrop-blur-md ${
              (toast.message.toLowerCase().includes('sync error') || toast.message.toLowerCase().includes('retry')) ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
            }`}
            style={{ backgroundColor: bg, borderColor: border }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
            <p className="text-xs font-mono flex-1 text-white">{toast.message}</p>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                dismissToast(toast.id); 
              }} 
              className="cursor-pointer flex-shrink-0" 
              style={{ color: '#64748B' }}
            >
              <X className="w-3.5 h-3.5"/>
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── Main App Shell (inside context) ──────────────────────────────────────
const AppShell: React.FC = () => {
  const { session, setSession, isAuthenticated, setAuthenticated, theme, toggleTheme } = useZelus();
  const [booting, setBooting] = useState(true);
  const [appView, setAppView] = useState<'search' | 'app'>(() => {
    const hasSession = localStorage.getItem('zelus_session');
    const isAuth = localStorage.getItem('zelus_authenticated') === 'true';
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if ((hasSession && isAuth) || roleParam) return 'app';
    return 'search';
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  React.useEffect(() => {
    const handlePopState = () => {
      if (!isAuthenticated) {
        window.history.pushState(null, '', window.location.pathname);
        setAppView('search');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  const handleLogin = (username: string, role: UserRole) => {
    const initialXP = role === 'Citizen' ? 120 : role === 'Contractor' ? 150 : 0;
    const badges = role === 'Citizen' ? ['Water Watcher'] : role === 'Contractor' ? ['Vetted Contractor'] : ['System Admin'];
    setSession({ username, role, karmaXP: initialXP, badges });
    setAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setAuthenticated(false);
    setSession(null);
    setAppView('search');
  };

  // Quick switch for demo (same as login but inline)
  const switchRole = (role: UserRole) => {
    const username = role === 'Admin' ? 'admin_zero' : role === 'Citizen' ? 'citizen_hero' : 'contractor_alpha';
    handleLogin(username, role);
  };

  if (booting) {
    return <ZetaLoader onComplete={() => setBooting(false)} theme={theme} />;
  }

  const isDark = theme === 'dark';

  if (appView === 'search') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <MockSearchEngine
          onEnter={() => {
            setAppView('app');
          }}
        />
        <ToastLayer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── FIXED TOP HEADER STRIP (36px) ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-[150] flex items-center justify-between px-4 border-b transition-all duration-300"
        style={{ height: '36px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>

        {/* Left: Brand */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-black tracking-[0.25em] uppercase" style={{ color: 'var(--accent-cyan)' }}>ZELUS</span>
          <span className="hidden sm:flex text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>// URBAN CIVIC ENGINE</span>
        </div>

        {/* Center: Role switcher */}
        {session && isAuthenticated && (
          <div className="flex items-center gap-1">
            {([
              { role: 'Admin' as UserRole,      label: 'Admin Portal',        icon: <Shield className="w-3 h-3"/> },
              { role: 'Citizen' as UserRole,    label: 'Citizen Portal',      icon: <Smartphone className="w-3 h-3"/> },
              { role: 'Contractor' as UserRole, label: 'Contractor Workspace',icon: <Hammer className="w-3 h-3"/> },
            ]).map(({ role, label, icon }) => {
              const isActive = session.role === role;
              return (
                <button
                  key={role}
                  onClick={() => switchRole(role)}
                  className="flex items-center gap-1 px-2.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer"
                  style={{
                    height: '22px',
                    backgroundColor: isActive ? 'var(--accent-cyan)' : 'transparent',
                    color: isActive ? 'var(--bg-primary)' : 'var(--text-muted)',
                    border: isActive ? 'none' : '1px solid var(--border-secondary)',
                  }}
                >
                  {icon}
                  <span className="hidden md:inline">{label}</span>
                  <span className="md:hidden">{role}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right: Theme + logout */}
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-1 rounded cursor-pointer hover:bg-white/5 transition-colors"
            title="Toggle Theme">
            {isDark
              ? <Sun className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              : <Moon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
          </button>
          {session && isAuthenticated && (
            <button onClick={handleLogout} className="flex items-center gap-1 px-2 rounded text-[9px] font-mono cursor-pointer hover:bg-red-500/10 transition-all"
              style={{ color: 'var(--text-muted)', height: '22px' }}>
              <LogOut className="w-3 h-3"/>
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}
          {(!session || !isAuthenticated) && (
            <button onClick={() => {}} className="px-2 rounded text-[9px] font-mono cursor-pointer"
              style={{ color: 'var(--text-muted)', height: '22px' }}>
              Access Portal
            </button>
          )}
        </div>
      </header>

      {/* ── PAGE CONTENT (padded for header) ──────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ paddingTop: '36px' }}>

        {/* No session or not authenticated → Login */}
        {(!session || !isAuthenticated) && (
          <div className="min-h-screen flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <LoginScreen onLogin={handleLogin} theme={theme} />
          </div>
        )}

        {/* Citizen → Mobile viewport */}
        {session && isAuthenticated && session.role === 'Citizen' && (
          <div className="min-h-screen w-full flex items-center justify-center transition-all duration-300" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <MobileViewport theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} username={session.username}>
              <Suspense fallback={<DashboardFallback />}>
                <CitizenSimulator />
              </Suspense>
            </MobileViewport>
          </div>
        )}

        {/* Admin → Gov Dashboard */}
        {session && isAuthenticated && session.role === 'Admin' && (
          <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full transition-all duration-300">
            {/* Weather ticker */}
            <div className="mb-4 py-1.5 px-4 rounded-lg border text-[9.5px] font-mono flex items-center justify-between"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
              <span>☀️ Environmental wear coefficient nominal. Autonomous swarm pre-warmed and standing by.</span>
              <span className="flex items-center gap-1.5 text-[8.5px]" style={{ color: 'var(--accent-cyan)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"/>
                LEDGER SECURE
              </span>
            </div>
            <Suspense fallback={<DashboardFallback />}>
              <GovernmentDashboard />
            </Suspense>
          </div>
        )}

        {/* Contractor → Contractor Dashboard */}
        {session && isAuthenticated && session.role === 'Contractor' && (
          <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full transition-all duration-300">
            <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Volunteer Contractor Operations Command</h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Remediate local infrastructure failures, earn sponsorships, and verify repair completions.
                </p>
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                Logged in as: <span style={{ color: 'var(--accent-cyan)' }}>{session.username}</span>
              </div>
            </div>
            <Suspense fallback={<DashboardFallback />}>
              <ContractorDashboard />
            </Suspense>
          </div>
        )}
      </div>

      {/* ── GLOBAL TOAST LAYER ──────────────────────────────────────────── */}
      <ToastLayer />
    </div>
  );
};

// ── Root App (wraps with Context) ─────────────────────────────────────────
function App() {
  return (
    <ZelusStateProvider>
      <AppShell />
    </ZelusStateProvider>
  );
}

export default App;
