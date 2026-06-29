import { useState, useEffect, useCallback, useRef } from 'react';
import type { Incident, Bounty, UserSession, Theme, WebhookLog } from './types';
import { initialIncidents, initialBounties } from './mockData';
import { ZetaLoader } from './components/ZetaLoader';
import { LoginScreen } from './components/LoginScreen';
import { MobileViewport } from './components/MobileViewport';
import { CitizenSimulator } from './components/CitizenSimulator';
import { GovernmentDashboard } from './components/GovernmentDashboard';
import { ContractorDashboard } from './components/ContractorDashboard';
import { CloudLightning, Smartphone } from 'lucide-react';

function App() {
  // ─── BOOT LOADER ───────────────────────────────────────────────────────────
  const [booting, setBooting] = useState<boolean>(() => {
    return !sessionStorage.getItem('zelus_booted');
  });

  const handleBootComplete = useCallback(() => {
    sessionStorage.setItem('zelus_booted', '1');
    setBooting(false);
  }, []);

  // ─── THEME ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('zelus_theme') as Theme) || 'dark';
  });
  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('zelus_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  // ─── SESSION (LocalStorage RBAC persistence) ───────────────────────────────
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('zelus_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return null;
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem('zelus_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('zelus_session');
    }
  }, [session]);

  // ─── SYSTEM INCIDENTS STATE ────────────────────────────────────────────────
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('zelus_incidents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return initialIncidents;
  });

  useEffect(() => {
    localStorage.setItem('zelus_incidents', JSON.stringify(incidents));
  }, [incidents]);

  // ─── WEBHOOK DISPATCH LOGS ─────────────────────────────────────────────────
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(() => {
    const saved = localStorage.getItem('zelus_webhooks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('zelus_webhooks', JSON.stringify(webhookLogs));
  }, [webhookLogs]);

  // ─── BOUNTIES STATE ────────────────────────────────────────────────────────
  const [bounties, setBounties] = useState<Bounty[]>(() => {
    const saved = localStorage.getItem('zelus_bounties');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return initialBounties;
  });

  useEffect(() => {
    localStorage.setItem('zelus_bounties', JSON.stringify(bounties));
  }, [bounties]);

  // ─── WEATHER TICKER FACTOR ─────────────────────────────────────────────────
  const [weatherMultiplier, setWeatherMultiplier] = useState<number>(1.05);
  const [tickerMessage, setTickerMessage] = useState<string>('Normal environmental wear detected.');

  useEffect(() => {
    const interval = setInterval(() => {
      const isStorm = Math.random() > 0.6;
      if (isStorm) {
        const factor = Number((1.20 + Math.random() * 0.40).toFixed(2));
        setWeatherMultiplier(factor);
        setTickerMessage(`🌩️ Elevated Atmospheric Threat: storm front detected. Wear factor x${factor}.`);
      } else {
        const factor = Number((0.90 + Math.random() * 0.20).toFixed(2));
        setWeatherMultiplier(factor);
        setTickerMessage(`☀️ Environment clear. Active wear coefficient at baseline x${factor}.`);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // ─── WEBHOOK FIRE LEDGER SIMULATOR ──────────────────────────────────────────
  const fireWebhook = useCallback((incidentId: string, method: 'POST' | 'PUSH' | 'PATCH' | 'GET', service: string, status: number, payload: Record<string, unknown>) => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`;
    const newLog: WebhookLog = {
      id: `wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: ts,
      method,
      service,
      status,
      payload: JSON.stringify(payload)
    };

    setWebhookLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('zelus_webhooks', JSON.stringify(updated));
      return updated;
    });

    setIncidents(prev => prev.map(inc => {
      if (inc.id !== incidentId) return inc;
      return {
        ...inc,
        webhookLogs: [newLog, ...(inc.webhookLogs || [])]
      };
    }));
  }, []);

  // ─── REAL-TIME STORAGE SYNC (Listen to other tabs / roles) ─────────────────
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'zelus_incidents' && e.newValue) {
        try {
          setIncidents(JSON.parse(e.newValue));
        } catch { /* ignore */ }
      }
      if (e.key === 'zelus_session') {
        try {
          setSession(e.newValue ? JSON.parse(e.newValue) : null);
        } catch { /* ignore */ }
      }
      if (e.key === 'zelus_bounties' && e.newValue) {
        try {
          setBounties(JSON.parse(e.newValue));
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ─── BACKGROUND SIMULATED INCIDENTS (Every 20s on System Idle) ──────────────
  const lastInteractionRef = useRef<number>(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem('zelus_incidents');
    if (!saved || saved === '[]') {
      localStorage.setItem('zelus_incidents', JSON.stringify(initialIncidents));
    }
  }, []);

  useEffect(() => {
    const updateInteraction = () => {
      lastInteractionRef.current = Date.now();
    };
    window.addEventListener('mousemove', updateInteraction);
    window.addEventListener('keydown', updateInteraction);
    window.addEventListener('click', updateInteraction);

    const ambientInterval = setInterval(() => {
      const isIdle = Date.now() - lastInteractionRef.current >= 20000;
      if (isIdle) {
        const categories = [
          'Road & Structural Damage',
          'Water Outage & Flooding',
          'Utility & Spark Hazard'
        ];
        const locations = [
          'Zone-2 West Overpass Junction',
          'Sector-5 Industrial Grid Node',
          'Junction-8 Underpass Outlet',
          'Eastern Bypass Zone Gamma'
        ];
        const notes = [
          'Ambient wear and structural decay report committed on idle scan.',
          'Localized wear threshold exceeded. Node verification recommended.',
          'Secondary utility node failure scanned by automated environmental sensors.'
        ];
        
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const loc = locations[Math.floor(Math.random() * locations.length)];
        const note = notes[Math.floor(Math.random() * notes.length)];
        const x = parseFloat((15 + Math.random() * 70).toFixed(1));
        const y = parseFloat((15 + Math.random() * 70).toFixed(1));
        const nextIdNum = incidents.length + 1;
        const newInc: Incident = {
          id: `INC-2026-${String(nextIdNum).padStart(3, '0')}`,
          category: cat,
          location: loc,
          coordinates: [x, y],
          severity: Math.random() > 0.5 ? 'Critical' : 'Moderate',
          status: 'Triage',
          upvotes: Math.floor(Math.random() * 4),
          description: note,
          languageBadge: null,
          image: cat.includes('Water') ? '/water_main_burst.png' : cat.includes('Utility') ? '/downed_power_line.png' : '/road_pothole.png',
          timestamp: 'Just Now',
          mergedCount: 1,
          geolocation: {
            lat: 40.7128 + (y - 50) * 0.001,
            lng: -74.0060 + (x - 50) * 0.001
          },
          exifVerified: true,
          hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()}`
        };

        setIncidents(prev => {
          const updated = [newInc, ...prev];
          localStorage.setItem('zelus_incidents', JSON.stringify(updated));
          return updated;
        });

        // Fire outbound mock dispatch
        fireWebhook(newInc.id, 'POST', 'Ambient Swarm Triage Sensor', 200, {
          scanned: true,
          threatLevel: newInc.severity,
          coordinates: newInc.coordinates
        });
      }
    }, 20000);

    return () => {
      window.removeEventListener('mousemove', updateInteraction);
      window.removeEventListener('keydown', updateInteraction);
      window.removeEventListener('click', updateInteraction);
      clearInterval(ambientInterval);
    };
  }, [incidents.length, fireWebhook]);

  // ─── LOGIN HANDLER ─────────────────────────────────────────────────────────
  const handleLogin = (username: string, role: UserSession['role']) => {
    const initialXP = role === 'Citizen' ? 120 : role === 'Contractor' ? 150 : 0;
    const badges = role === 'Citizen' ? ['Water Watcher'] : role === 'Contractor' ? ['Vetted Contractor'] : ['System Admin'];
    const newSession = { username, role, karmaXP: initialXP, badges };
    setSession(newSession);
    localStorage.setItem('zelus_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('zelus_session');
    // Clear storage defaults on reset if requested
    setIncidents(initialIncidents);
    setBounties(initialBounties);
    setWebhookLogs([]);
  };

  // ─── TRIAGE DISPATCH AUTHORIZATION ──────────────────────────────────────────
  const handleAuthorizeDispatch = useCallback((id: string) => {
    setIncidents(prev => {
      const updated = prev.map(inc => inc.id === id ? { ...inc, status: 'Bounty_Posted' as const } : inc);
      localStorage.setItem('zelus_incidents', JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => {
      fireWebhook(id, 'POST', 'Twilio SMS Dispatch', 200, {
        to: "Citizen Reporter",
        body: `Zelus Incident ${id} triage complete. Civic bounty posted to volunteer marketplace.`
      });
      fireWebhook(id, 'PUSH', 'Municipal GIS Map Service', 201, {
        id,
        status: 'Bounty_Posted'
      });
    }, 100);
  }, [fireWebhook]);

  // ─── CONTRACTOR CLAIM BOUNTY ────────────────────────────────────────────────
  const handleClaimBounty = useCallback((id: string) => {
    if (!session || session.role !== 'Contractor') return;
    const etaTime = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    setIncidents(prev => {
      const updated = prev.map(inc => {
        if (inc.id !== id) return inc;
        return {
          ...inc,
          status: 'Claimed_In_Progress' as const,
          claimedBy: session.username,
          contractorStage: 'Accepted' as const,
          etaTargetTime: etaTime
        };
      });
      localStorage.setItem('zelus_incidents', JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => {
      fireWebhook(id, 'POST', 'Twilio SMS Dispatch', 200, {
        to: "Citizen Reporter",
        body: `Zelus Incident ${id} has been claimed by Contractor ${session.username}. Target ETA: 2 hours.`
      });
    }, 100);
  }, [session, fireWebhook]);

  // ─── CONTRACTOR STAGE MANAGER ───────────────────────────────────────────────
  const handleUpdateStage = useCallback((id: string, stage: 'Accepted' | 'Dispatched' | 'In-Review') => {
    setIncidents(prev => {
      const updated = prev.map(inc => inc.id === id ? { ...inc, contractorStage: stage } : inc);
      localStorage.setItem('zelus_incidents', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ─── CONTRACTOR SUBMIT PROGRESS EVIDENCE ────────────────────────────────────
  const handleSubmitProgress = useCallback((id: string, progressPhoto: string) => {
    setIncidents(prev => {
      const updated = prev.map(inc => {
        if (inc.id !== id) return inc;
        return {
          ...inc,
          status: 'Peer_Review' as const,
          progressPhoto,
          verifications: []
        };
      });
      localStorage.setItem('zelus_incidents', JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => {
      fireWebhook(id, 'PUSH', 'Aegis Security Ledger', 200, {
        id,
        status: 'Peer_Review',
        hash: '0x' + Math.floor(Math.random()*10000000).toString(16).toUpperCase()
      });
      fireWebhook(id, 'POST', 'Citizen Broadcast Node', 200, {
        radius: "500m",
        incidentId: id,
        message: `Civic repair at ${id} completed. Consensus vote requested.`
      });
    }, 100);
  }, [fireWebhook]);

  // ─── CITIZEN CONSENSUS HANDSHAKE CONFIRMATION ──────────────────────────────
  const handleConfirmResolution = useCallback((id: string, verification: { name: string; timestamp: string; photo: string }) => {
    setIncidents(prev => {
      const updated = prev.map(inc => {
        if (inc.id !== id) return inc;
        const updatedVerifications = [...(inc.verifications || []), verification];
        const isFull = updatedVerifications.length >= 3;
        const newStatus = isFull ? 'Resolved' : inc.status;

        if (isFull) {
          setTimeout(() => {
            fireWebhook(id, 'POST', 'Twilio SMS Dispatch', 200, {
              to: "Citizen Reporter",
              body: `Consensus reached. Zelus Incident ${id} is officially marked RESOLVED. Thank you volunteers!`
            });
            fireWebhook(id, 'PUSH', 'Municipal GIS Map Service', 201, {
              id,
              status: 'Resolved'
            });
          }, 100);
        } else {
          setTimeout(() => {
            fireWebhook(id, 'POST', 'Aegis Security Ledger', 200, {
              id,
              action: 'confirm_handshake',
              verificationsCount: updatedVerifications.length
            });
          }, 100);
        }

        return {
          ...inc,
          verifications: updatedVerifications,
          status: newStatus as any
        };
      });
      localStorage.setItem('zelus_incidents', JSON.stringify(updated));
      return updated;
    });
  }, [fireWebhook]);

  // ─── CITIZEN UPDATE KARMA XP ────────────────────────────────────────────────
  const handleUpdateKarma = (xp: number) => {
    if (session && session.role === 'Citizen') {
      const newXP = session.karmaXP + xp;
      const badges = [...session.badges];
      if (newXP >= 220 && !badges.includes('Infrastructure Guard')) {
        badges.push('Infrastructure Guard');
      }
      if (newXP >= 400 && !badges.includes('Citizen Shield')) {
        badges.push('Citizen Shield');
      }
      const updatedSession = { ...session, karmaXP: newXP, badges };
      setSession(updatedSession);
      localStorage.setItem('zelus_session', JSON.stringify(updatedSession));
    }
  };

  const handleAddIncident = useCallback((newInc: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'>) => {
    const nextIdNum = incidents.length + 1;
    const committedIncident: Incident = {
      ...newInc,
      id: `INC-2026-${String(nextIdNum).padStart(3, '0')}`,
      timestamp: 'Just Now',
      mergedCount: 1,
      severity: newInc.severity || 'Moderate',
      status: 'Triage',
      verifications: [],
      webhookLogs: []
    };

    setIncidents(prev => {
      const updated = [committedIncident, ...prev];
      localStorage.setItem('zelus_incidents', JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => {
      fireWebhook(committedIncident.id, 'POST', 'Citizen Broadcast Node', 200, {
        id: committedIncident.id,
        status: 'Triage'
      });
    }, 100);
  }, [incidents.length, fireWebhook]);

  const handleUpvoteIncident = (id: string) => {
    setIncidents(prev => {
      const updated = prev.map(inc => inc.id === id ? { ...inc, upvotes: inc.upvotes + 1 } : inc);
      localStorage.setItem('zelus_incidents', JSON.stringify(updated));
      return updated;
    });
  };

  const [isIsolated, setIsIsolated] = useState<boolean>(false);

  // ─── BOOT SCREEN ───────────────────────────────────────────────────────────
  if (booting) {
    return <ZetaLoader onComplete={handleBootComplete} theme={theme} />;
  }

  const renderMainContent = () => {
    // ─── AUTHENTICATION GATEWAY ────────────────────────────────────────────────
    if (!session) {
      return (
        <div className="min-h-screen flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <LoginScreen onLogin={handleLogin} theme={theme} />
        </div>
      );
    }

    // ─── CITIZEN NATIVE MOBILE LAYOUT VIEWPORT (Strict Mobile layout) ──────────
    if (session.role === 'Citizen') {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black/45" style={{ backgroundColor: isDark ? '#040809' : '#EDEAE3' }}>
          <MobileViewport
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onLogout={handleLogout}
            username={session.username}
          >
            <CitizenSimulator
              incidents={incidents}
              onAddIncident={handleAddIncident}
              onUpvoteIncident={handleUpvoteIncident}
              session={session}
              onUpdateKarma={handleUpdateKarma}
              theme={theme}
              onConfirmResolution={handleConfirmResolution}
            />
          </MobileViewport>
        </div>
      );
    }

    // ─── ADMIN & CONTRACTOR DESKTOP PORTAL SHELL ──────────────────────────────
    const headingText = isDark ? '#ffffff' : '#090F10';
    const rootBg = 'var(--bg-primary)';

    return (
      <div
        className="min-h-screen flex flex-col font-sans transition-all duration-300 pb-20"
        style={{
          backgroundColor: rootBg,
          backgroundImage: isDark
            ? 'linear-gradient(rgba(0, 255, 204, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 204, 0.02) 1px, transparent 1px)'
            : 'linear-gradient(rgba(10, 70, 228, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(10, 70, 228, 0.02) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        {/* Weather status ticker banner */}
        <div
          className="w-full py-1.5 px-6 flex items-center justify-between text-[10px] font-mono select-none border-b transition-colors"
          style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            borderColor: 'var(--border-secondary)',
            color: isIsolated ? 'var(--accent-amber)' : 'var(--text-muted)'
          }}
        >
          <div className="flex items-center gap-2">
            <CloudLightning className={`w-3.5 h-3.5 ${isIsolated ? 'animate-bounce' : 'animate-pulse'}`} style={{ color: isIsolated ? 'var(--accent-amber)' : 'var(--accent-amber)' }} />
            <span>{isIsolated ? '⚠️ [DATA ISOLATION ACTIVE] Local ledger isolated from cloud relay.' : tickerMessage}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span>Vitals Block synced</span>
            <span>|</span>
            <span className="flex items-center gap-1 font-bold" style={{ color: isIsolated ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${isIsolated ? 'animate-bounce' : 'animate-ping'}`} />
              {isIsolated ? 'LOCAL LEDGER STORAGE ONLY' : 'LEDGER SECURE'}
            </span>
          </div>
        </div>

        {/* Main Workspace Frame */}
        <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
          {session.role === 'Admin' ? (
            <div className="flex-1 flex flex-col">
              <GovernmentDashboard
                incidents={incidents}
                onAuthorizeDispatch={handleAuthorizeDispatch}
                weatherRiskMultiplier={weatherMultiplier}
                onAddIncident={handleAddIncident}
                theme={theme}
                onLogout={handleLogout}
                onToggleTheme={handleToggleTheme}
                username={session.username}
                isIsolated={isIsolated}
                onToggleIsolation={() => setIsIsolated(prev => !prev)}
              />
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Contractor Page Header Bar */}
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
                <div>
                  <h1 className="text-xl font-bold tracking-tight" style={{ color: headingText }}>
                    Volunteer Contractor Operations Command
                  </h1>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Remediate local infrastructure failures, earn sponsorships, and verify repair completions.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={handleToggleTheme}
                    className="p-1.5 rounded border hover:bg-zinc-800/10 cursor-pointer"
                    style={{ borderColor: 'var(--border-secondary)' }}
                    title="Toggle Theme"
                  >
                    <Smartphone className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded bg-zinc-900 border text-[10px] font-mono font-bold hover:bg-red-500/15 hover:border-red-500/40 text-red-400 cursor-pointer"
                    style={{ borderColor: 'var(--border-secondary)' }}
                  >
                    Disconnect Profile
                  </button>
                </div>
              </div>

              <ContractorDashboard
                incidents={incidents}
                session={session}
                onClaimBounty={handleClaimBounty}
                onSubmitProgress={handleSubmitProgress}
                onUpdateStage={handleUpdateStage}
                theme={theme}
              />
            </div>
          )}
        </main>
      </div>
    );
  };

  return (
    <>
      {renderMainContent()}
      
      {/* Testing/Demo Mode Persistent Swapper Bar */}
      <div 
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass-panel border rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl backdrop-blur-md" 
        style={{ 
          borderColor: 'var(--border-primary)', 
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}
      >
        <span className="text-[9px] font-mono tracking-widest uppercase mr-1" style={{ color: 'var(--text-muted)' }}>
          DEMO MODE:
        </span>
        <button 
          onClick={() => handleLogin('admin_zero', 'Admin')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all font-bold cursor-pointer ${session?.role === 'Admin' ? 'text-zinc-950 font-extrabold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          style={session?.role === 'Admin' ? { backgroundColor: 'var(--accent-cyan)' } : {}}
        >
          Admin
        </button>
        <button 
          onClick={() => handleLogin('citizen_hero', 'Citizen')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all font-bold cursor-pointer ${session?.role === 'Citizen' ? 'text-zinc-950 font-extrabold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          style={session?.role === 'Citizen' ? { backgroundColor: 'var(--accent-cyan)' } : {}}
        >
          Citizen
        </button>
        <button 
          onClick={() => handleLogin('contractor_alpha', 'Contractor')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all font-bold cursor-pointer ${session?.role === 'Contractor' ? 'text-zinc-950 font-extrabold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          style={session?.role === 'Contractor' ? { backgroundColor: 'var(--accent-amber)' } : {}}
        >
          Contractor
        </button>
        <button 
          onClick={handleLogout}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all font-bold cursor-pointer ${!session ? 'bg-red-500 text-white font-extrabold shadow-sm' : 'text-zinc-400 hover:text-red-400'}`}
        >
          Access Portal
        </button>
      </div>
    </>
  );
}

export default App;
