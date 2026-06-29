import { useState, useEffect, useCallback, useRef } from 'react';
import type { Incident, Bounty, UserSession, Theme, DevLog, WebhookLog } from './types';
import { initialIncidents, initialBounties } from './mockData';
import { ZetaLoader } from './components/ZetaLoader';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { GovernmentDashboard } from './components/GovernmentDashboard';
import { CitizenSimulator } from './components/CitizenSimulator';
import { BountyMarket } from './components/BountyMarket';
import { SwarmCommandModule } from './components/SwarmCommandModule';
import { DevConsole } from './components/DevConsole';
import { SyncDeviceModal } from './components/SyncDeviceModal';
import { ContractorDashboard } from './components/ContractorDashboard';
import { CloudLightning } from 'lucide-react';

// ─── Utility: make a DevLog entry ───────────────────────────────────────────
let logSeq = 0;
function mkLog(
  agent: DevLog['agent'],
  level: DevLog['level'],
  message: string,
  raw?: Record<string, unknown>
): DevLog {
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`;
  return { id: `log-${++logSeq}`, timestamp: ts, agent, level, message, raw };
}

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

  // ─── SESSION ───────────────────────────────────────────────────────────────
  const [session, setSession] = useState<UserSession | null>(null);

  // ─── SYNC MODAL ────────────────────────────────────────────────────────────
  const [syncOpen, setSyncOpen] = useState(false);

  // ─── DEV CONSOLE ───────────────────────────────────────────────────────────
  const [devConsoleOpen, setDevConsoleOpen] = useState(false);
  const [devLogs, setDevLogs] = useState<DevLog[]>([
    mkLog('SYSTEM', 'INFO', 'Developer Log Core initialized. Awaiting swarm activity...'),
  ]);
  const [devPayload, setDevPayload] = useState<Incident | null>(null);
  const [criticalMode, setCriticalMode] = useState(false);
  const logsRef = useRef(devLogs);
  logsRef.current = devLogs;

  const addLog = useCallback((log: DevLog) => {
    setDevLogs(prev => [...prev.slice(-299), log]); // cap at 300 entries
  }, []);

  // ─── SWARM STATE ───────────────────────────────────────────────────────────
  const [swarmStep, setSwarmStep] = useState<number>(0);
  const [activeSwarmIncident, setActiveSwarmIncident] = useState<Omit<Incident, 'id' | 'timestamp' | 'mergedCount'> | null>(null);
  const [swarmStatus, setSwarmStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  // ─── WEBHOOK LOGS ──────────────────────────────────────────────────────────
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(() => {
    const saved = localStorage.getItem('zelus_webhooks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [
      {
        id: 'wh-init-1',
        timestamp: 'System Boot',
        method: 'POST',
        service: 'System Bootstrap Service',
        status: 200,
        payload: '{"status": "initialized", "ledgerState": "synced"}'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zelus_webhooks', JSON.stringify(webhookLogs));
  }, [webhookLogs]);

  // ─── INCIDENTS ─────────────────────────────────────────────────────────────
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

  // ─── BOUNTIES ──────────────────────────────────────────────────────────────
  const [bounties, setBounties] = useState<Bounty[]>(initialBounties);

  // ─── WEATHER TICKER ────────────────────────────────────────────────────────
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

    setWebhookLogs(prev => [newLog, ...prev].slice(0, 199));

    setIncidents(prev => prev.map(inc => {
      if (inc.id !== incidentId) return inc;
      return {
        ...inc,
        webhookLogs: [newLog, ...(inc.webhookLogs || [])]
      };
    }));

    addLog(mkLog('SYSTEM', 'SUCCESS', `[OUTBOUND DISPATCH] Webhook fired to ${service}: status ${status}`, { service, method, payload }));
  }, [addLog]);

  // ─── SWARM PIPELINE ────────────────────────────────────────────────────────
  const runSwarmPipeline = useCallback((
    newInc: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'>,
    mode: 'normal' | 'critical' | 'faulty' = 'normal'
  ) => {
    setActiveSwarmIncident(newInc);
    setSwarmStatus('running');
    setSwarmStep(1);

    if (mode === 'critical') {
      setCriticalMode(true);
      addLog(mkLog('ORCHESTRATOR', 'CRITICAL', `[CRITICAL NODE INJECT] High-severity disaster incident spawned. All agents entering emergency cascade.`, { mode: 'critical', category: newInc.category }));
    } else {
      setCriticalMode(false);
    }

    addLog(mkLog('ORCHESTRATOR', 'INFO', `Swarm pipeline initialized for: "${newInc.category}" @ ${newInc.location}`, { category: newInc.category, location: newInc.location }));

    const agentLogs: Array<{ step: number; fn: () => DevLog }> = [
      { step: 2, fn: () => mkLog('AEGIS', mode === 'faulty' ? 'ERROR' : (mode === 'critical' ? 'CRITICAL' : 'INFO'),
          mode === 'faulty'
            ? 'System Filter Intercepted: Token Purged. Authenticity check FAILED — report rejected as spam payload.'
            : mode === 'critical'
              ? '[CRITICAL] Confidence: 94.2% — Anomalous signal pattern detected. Emergency override engaged.'
              : `Confidence Threshold: 98.6% Authentic — EXIF integrity verified, geolocation cross-matched.`,
          { agent: 'Aegis', exifVerified: newInc.exifVerified, coordinates: newInc.coordinates }) },
      { step: 3, fn: () => mkLog('ATLAS', mode === 'critical' ? 'CRITICAL' : 'SUCCESS',
          mode === 'critical'
            ? `[CRITICAL] Routing via emergency spatial matrix override. All nearby units redirected.`
            : `Routing optimized. Grid offset [X:${newInc.coordinates?.[0] || 50}, Y:${newInc.coordinates?.[1] || 50}] triangulated.`,
          { agent: 'Atlas', coordinates: newInc.coordinates, location: newInc.location }) },
      { step: 4, fn: () => mkLog('VULCAN', mode === 'critical' ? 'CRITICAL' : 'SUCCESS',
          mode === 'critical'
            ? `[CRITICAL] Emergency resource allocation: ALL available units deployed. Priority: MAXIMUM.`
            : `Resource estimated. Dispatching optimal response units for category: ${newInc.category}.`,
          { agent: 'Vulcan', category: newInc.category }) },
      { step: 5, fn: () => mkLog('MERCURY', mode === 'critical' ? 'CRITICAL' : 'SUCCESS',
          mode === 'critical'
            ? `[CRITICAL] Emergency broadcast sent to all municipal departments. API ping: 200 OK (Emergency flag).`
            : `Municipal API pinged successfully. Outbound to dept mock-api endpoint (200 OK).`,
          { agent: 'Mercury', status: 200 }) },
      { step: 6, fn: () => mkLog('CHRONOS', mode === 'critical' ? 'WARNING' : 'SUCCESS',
          mode === 'critical'
            ? `[CRITICAL] Accelerated ETA computed. Decay velocity 3x nominal. All units expedited.`
            : `Lifecycle model computed. ETA locked with predictive degradation decay verified.`,
          { agent: 'Chronos', timestamp: new Date().toISOString() }) },
    ];

    agentLogs.forEach(({ step, fn }) => {
      setTimeout(() => {
        setSwarmStep(step);
        const log = fn();
        addLog(log);

        // Faulty mode: halt and write as Archived
        if (mode === 'faulty' && step === 2) {
          addLog(mkLog('SYSTEM', 'WARNING', 'Pipeline halted by Aegis rejection. Committing incident as Archived.'));
          setIncidents(prev => {
            const nextNum = Math.max(...prev.map(i => {
              if (!i?.id) return 0;
              const parts = i.id.split('-');
              const num = parseInt(parts[parts.length - 1] || '0', 10);
              return isNaN(num) ? 0 : num;
            }), 0) + 1;

            const archivedIncident: Incident = {
              ...newInc,
              id: `INC-2026-${String(nextNum).padStart(3, '0')}`,
              timestamp: 'Just Now',
              mergedCount: 1,
              status: 'Archived',
              severity: 'Low',
              verifications: [],
              webhookLogs: [],
              swarmData: {
                aegisConfidence: 'Confidence Threshold: 12.4% authentic (Forgeries flagged)',
                atlasRouting: 'N/A (Archived)',
                vulcanMaterial: 'N/A (Archived)',
                mercuryPing: 'N/A (Archived)',
                chronosEta: 'N/A (Archived)'
              }
            };

            setTimeout(() => {
              fireWebhook(archivedIncident.id, 'POST', 'Aegis Security Ledger', 200, {
                id: archivedIncident.id,
                action: 'quarantine',
                status: 'Archived'
              });
            }, 100);

            return [archivedIncident, ...prev];
          });

          setSwarmStatus('completed');
          setTimeout(() => {
            setSwarmStatus('idle');
            setActiveSwarmIncident(null);
            setSwarmStep(0);
            setCriticalMode(false);
          }, 3200);
          return;
        }

        if (step === 6 && mode !== 'faulty') {
          // Finalize incident
          setSwarmStep(7);
          setIncidents(prev => {
            const nextNum = Math.max(...prev.map(i => {
              if (!i?.id) return 0;
              const parts = i.id.split('-');
              const num = parseInt(parts[parts.length - 1] || '0', 10);
              return isNaN(num) ? 0 : num;
            }), 0) + 1;

            const category = newInc.category || 'Road & Structural Damage';
            let resource = 'Asphalt Patching Rig Type-B';
            let dept = 'Public Works';
            let eta = '14.2 Hours';
            if (category.includes('Water') || category.includes('Flood')) {
              resource = 'Water Extraction Pump Crew'; dept = 'Water Board'; eta = '2.5 Hours';
            } else if (category.includes('Utility') || category.includes('Spark')) {
              resource = 'High Voltage Utility Crew'; dept = 'Power Grid'; eta = '0.5 Hours';
            } else if (mode === 'critical') {
              resource = 'Emergency Response Unit — Full Deployment'; dept = 'Emergency Management'; eta = '0.25 Hours (CRITICAL)';
            }

            const verifiedIncident: Incident = {
              ...newInc,
              id: `INC-2026-${String(nextNum).padStart(3, '0')}`,
              timestamp: 'Just Now',
              mergedCount: 1,
              severity: mode === 'critical' ? 'Critical' : newInc.severity,
              status: mode === 'critical' ? 'Bounty_Posted' : 'Triage',
              verifications: [],
              webhookLogs: [],
              swarmData: {
                aegisConfidence: mode === 'critical'
                  ? '[CRITICAL] Confidence: 94.2% — Emergency override engaged.'
                  : 'Confidence Threshold: 98.6% Authentic (Visual checks passed)',
                atlasRouting: mode === 'critical'
                  ? '[CRITICAL] Emergency routing override — all units redirected.'
                  : 'Routing Optimized via Spatial Matrix (Swarm Triangulated)',
                vulcanMaterial: `Resource Dispatched: ${resource}`,
                mercuryPing: `Outbound target mock API: mock-api.${dept.toLowerCase().replace(/ /g,'')}.gov/outbound`,
                chronosEta: `ETA locked: ${eta} (Predictive degradation verified)`,
              }
            };

            addLog(mkLog('ORCHESTRATOR', 'SUCCESS', `Incident ${verifiedIncident.id} committed to ledger. Swarm pipeline complete.`, { incidentId: verifiedIncident.id }));

            if (mode === 'critical') {
              setTimeout(() => {
                fireWebhook(verifiedIncident.id, 'POST', 'Twilio SMS Dispatch', 200, {
                  to: "Reporter",
                  body: `Zelus Incident ${verifiedIncident.id} generated as Critical. Posted immediately to Volunteer Marketplace.`
                });
                fireWebhook(verifiedIncident.id, 'PUSH', 'Municipal GIS Map Service', 201, {
                  id: verifiedIncident.id,
                  status: 'Bounty_Posted',
                  priority: 'High'
                });
              }, 100);
            }

            return [verifiedIncident, ...prev];
          });

          setSwarmStatus('completed');
          setTimeout(() => {
            setSwarmStatus('idle');
            setActiveSwarmIncident(null);
            setSwarmStep(0);
            setCriticalMode(false);
          }, 3200);
        }
      }, (step - 1) * 500);
    });
  }, [addLog, fireWebhook]);

  const handleAddIncident = useCallback((newInc: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'>) => {
    runSwarmPipeline(newInc, 'normal');
  }, [runSwarmPipeline]);

  // ─── INJECTION RIG ─────────────────────────────────────────────────────────
  const handleForceCritical = useCallback(() => {
    const criticalInc: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'> = {
      category: 'Critical Infrastructure Failure',
      location: 'Central Grid Node — Zone Alpha',
      coordinates: [50, 50],
      severity: 'Critical',
      status: 'Triage',
      upvotes: 0,
      image: '/downed_power_line.png',
      notes: '[FORCE INJECT] Critical systemic infrastructure failure detected across multiple municipal zones. Emergency escalation required.',
      exifVerified: true,
      hash: `0x${Math.random().toString(16).slice(2).toUpperCase().padEnd(64,'F').slice(0,64)}`,
    };
    runSwarmPipeline(criticalInc, 'critical');
  }, [runSwarmPipeline]);

  const handleForceFaulty = useCallback(() => {
    const faultyInc: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'> = {
      category: 'Unverified Spam Report',
      location: 'Unknown Origin — Synthetic Token',
      coordinates: [0, 0],
      severity: 'Low',
      status: 'Triage',
      upvotes: 0,
      image: '',
      notes: '[FORCE INJECT — FAULTY] Synthetic report with forged EXIF data and mismatched geolocation signature.',
    };
    runSwarmPipeline(faultyInc, 'faulty');
  }, [runSwarmPipeline]);

  // ─── HANDLERS ──────────────────────────────────────────────────────────────
  const handleLogin = (username: string, role: 'Admin' | 'Citizen' | 'Contractor') => {
    let xp = 0;
    let badges: string[] = [];
    if (role === 'Citizen') {
      xp = 120;
      badges = ['Citizen Hero'];
    } else if (role === 'Contractor') {
      xp = 150;
      badges = ['Vetted Contractor'];
    } else {
      badges = ['System Admin'];
    }
    setSession({ username, role, karmaXP: xp, badges });
    addLog(mkLog('SYSTEM', 'INFO', `Session authenticated: ${username} (${role}). System ready.`));
  };

  const handleLogout = () => {
    setSession(null);
    setIncidents(initialIncidents);
    setBounties(initialBounties);
    addLog(mkLog('SYSTEM', 'WARNING', 'Session terminated. State reset to initial seeds.'));
  };

  const handleUpvoteIncident = (id: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, upvotes: inc.upvotes + 1 } : inc));
  };

  const handleAuthorizeDispatch = useCallback((id: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'Bounty_Posted' } : inc));
    addLog(mkLog('MERCURY', 'SUCCESS', `Civic bounty posted to marketplace for incident ${id}.`, { incidentId: id }));

    setTimeout(() => {
      fireWebhook(id, 'POST', 'Twilio SMS Dispatch', 200, {
        to: "Reporter",
        body: `Zelus Incident ${id} triage complete. Civic bounty posted to volunteer marketplace.`
      });
      fireWebhook(id, 'PUSH', 'Municipal GIS Map Service', 201, {
        id,
        status: 'Bounty_Posted'
      });
    }, 100);
  }, [fireWebhook, addLog]);

  const handleClaimBounty = useCallback((id: string) => {
    if (!session || session.role !== 'Contractor') return;
    const now = Date.now();
    const etaTime = now + 2 * 60 * 60 * 1000; // 2 hours
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== id) return inc;
      return {
        ...inc,
        status: 'Claimed_In_Progress',
        claimedBy: session.username,
        etaTargetTime: etaTime,
      };
    }));

    addLog(mkLog('ORCHESTRATOR', 'SUCCESS', `Bounty ${id} claimed by contractor: ${session.username}. ETA 2 Hours.`, { incidentId: id, claimedBy: session.username }));

    setTimeout(() => {
      fireWebhook(id, 'POST', 'Twilio SMS Dispatch', 200, {
        to: "Reporter",
        body: `Zelus Incident ${id} has been claimed by Volunteer ${session.username}. Target ETA: 2 hours.`
      });
      fireWebhook(id, 'PUSH', 'Municipal GIS Map Service', 201, {
        id,
        status: 'Claimed_In_Progress',
        claimedBy: session.username,
        etaTargetTime: etaTime
      });
    }, 100);
  }, [session, addLog, fireWebhook]);

  const handleSubmitProgress = useCallback((id: string, progressPhoto: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== id) return inc;
      return {
        ...inc,
        status: 'Peer_Review',
        progressPhoto,
        verifications: []
      };
    }));

    addLog(mkLog('ORCHESTRATOR', 'SUCCESS', `Contractor submitted repair photo for incident ${id}. Entering citizen peer review.`, { incidentId: id }));

    setTimeout(() => {
      fireWebhook(id, 'PUSH', 'Aegis Security Ledger', 200, {
        id,
        status: 'Peer_Review',
        exifData: 'Commit secure visual hash: 0x' + Math.floor(Math.random()*1000000)
      });
      fireWebhook(id, 'POST', 'Citizen Broadcast Node', 200, {
        radius: "500m",
        incidentId: id,
        message: `Civic repair at ${id} completed. Consensus vote requested.`
      });
    }, 100);
  }, [fireWebhook, addLog]);

  const handleConfirmResolution = useCallback((id: string, verification: { name: string; timestamp: string; photo: string }) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== id) return inc;
      const updatedVerifications = [...(inc.verifications || []), verification];
      const isFull = updatedVerifications.length >= 3;
      const newStatus = isFull ? 'Resolved' : inc.status;

      addLog(mkLog('SYSTEM', 'INFO', `Citizen Peer Verification cast for ${id} (${updatedVerifications.length}/3 confirmations)`, { incidentId: id, signedBy: verification.name }));

      if (isFull) {
        addLog(mkLog('ORCHESTRATOR', 'SUCCESS', `Incident ${id} resolved via crowd consensus! Committing state.`, { incidentId: id }));
        setTimeout(() => {
          fireWebhook(id, 'POST', 'Twilio SMS Dispatch', 200, {
            to: "Reporter",
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
        status: newStatus
      };
    }));
  }, [fireWebhook, addLog]);

  const handleCastBountyVote = (id: string) => {
    setBounties(prev => prev.map(bty => {
      if (bty.id !== id) return bty;
      const updatedVotes = bty.votes + 1;
      const newProgress = Math.min(100, bty.progress + 5);
      const newFunding = Math.min(bty.targetBounty, Math.round(bty.targetBounty * (newProgress / 100)));
      return { ...bty, votes: updatedVotes, progress: newProgress, currentFunding: newFunding };
    }));
    if (session?.role === 'Citizen') {
      setSession(prev => {
        if (!prev) return null;
        const newXP = prev.karmaXP + 10;
        const newBadges = [...prev.badges];
        if (newXP >= 200 && !newBadges.includes('Water Watchdog')) newBadges.push('Water Watchdog');
        if (newXP >= 300 && !newBadges.includes('Infrastructure Guardian')) newBadges.push('Infrastructure Guardian');
        return { ...prev, karmaXP: newXP, badges: newBadges };
      });
    }
  };

  const handleVerifyBounty = (id: string) => {
    setBounties(prev => prev.map(bty => bty.id === id ? { ...bty, isVerified: true, progress: 100, currentFunding: bty.targetBounty } : bty));
    if (session?.role === 'Citizen') {
      setSession(prev => prev ? { ...prev, karmaXP: prev.karmaXP + 100 } : null);
    }
  };

  const handleUpdateKarma = (xp: number) => {
    if (session?.role === 'Citizen') {
      setSession(prev => {
        if (!prev) return null;
        const newXP = prev.karmaXP + xp;
        const newBadges = [...prev.badges];
        if (newXP >= 200 && !newBadges.includes('Water Watchdog')) newBadges.push('Water Watchdog');
        if (newXP >= 300 && !newBadges.includes('Infrastructure Guardian')) newBadges.push('Infrastructure Guardian');
        if (newXP >= 400 && !newBadges.includes('Citizen Shield')) newBadges.push('Citizen Shield');
        return { ...prev, karmaXP: newXP, badges: newBadges };
      });
    }
  };

  // ─── DERIVED THEME STYLES ──────────────────────────────────────────────────
  const rootBg = isDark ? '#050505' : '#FDFBF7';
  const tickerBg = isDark ? 'rgba(9,9,11,0.9)' : 'rgba(245,242,235,0.9)';
  const tickerBorder = isDark ? 'rgba(39,39,42,0.6)' : 'rgba(200,195,185,0.7)';
  const tickerText = isDark ? 'rgba(113,113,122,0.9)' : 'rgba(80,80,70,0.9)';
  const headingText = isDark ? '#ffffff' : '#1A1A1A';
  const subText = isDark ? 'rgba(113,113,122,0.9)' : 'rgba(80,80,70,0.8)';
  const accent = isDark ? '#00E5FF' : '#00A86B';
  const sidebarBorder = isDark ? 'rgba(39,39,42,0.8)' : 'rgba(200,195,185,0.6)';

  // ─── BOOT SCREEN ───────────────────────────────────────────────────────────
  if (booting) {
    return <ZetaLoader onComplete={handleBootComplete} theme={theme} />;
  }

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col justify-center" style={{ background: rootBg }}>
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  // ─── MAIN APP ──────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{
        background: rootBg,
        color: isDark ? '#f4f4f5' : '#1A1A1A',
        backgroundImage: isDark
          ? 'linear-gradient(rgba(39,39,42,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(39,39,42,0.15) 1px, transparent 1px)'
          : 'linear-gradient(rgba(200,195,185,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(200,195,185,0.18) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <Navbar
        session={session}
        onLogout={handleLogout}
        weatherRiskMultiplier={weatherMultiplier}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSync={() => setSyncOpen(true)}
        onOpenDevConsole={() => setDevConsoleOpen(true)}
      />

      {/* Ticker */}
      <div
        className="w-full py-1.5 px-6 flex items-center justify-between text-[10px] font-mono select-none"
        style={{ background: tickerBg, borderBottom: `1px solid ${tickerBorder}` }}
      >
        <div className="flex items-center gap-2" style={{ color: tickerText }}>
          <CloudLightning className="w-3.5 h-3.5" style={{ color: '#FF9100', animation: 'pulse 2s infinite' }} />
          <span>{tickerMessage}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3" style={{ color: tickerText }}>
          <span>Active Ledger: Block #{Math.floor(840200 + weatherMultiplier * 1000)}</span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: accent }} />
            Vitals synced
          </span>
        </div>
      </div>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        <SwarmCommandModule
          swarmStep={swarmStep}
          activeIncident={activeSwarmIncident}
          swarmStatus={swarmStatus}
          criticalMode={criticalMode}
          theme={theme}
        />

        <div className="flex-1 flex flex-col lg:flex-row gap-6 w-full">
          {/* Left panel */}
          <div className="flex-1 min-w-0">
            {session.role === 'Admin' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: headingText }}>
                      Municipal Authority Console
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: subText }}>
                      Authorized operations dashboard for emergency responders & town utility units.
                    </p>
                  </div>
                  <div
                    className="rounded px-2.5 py-1 text-[10px] font-mono"
                    style={{
                      background: `${accent}08`,
                      border: `1px solid ${accent}30`,
                      color: accent,
                    }}
                  >
                    ADMIN MODULE ACTIVE
                  </div>
                </div>

                <GovernmentDashboard
                  incidents={incidents}
                  onAuthorizeDispatch={handleAuthorizeDispatch}
                  weatherRiskMultiplier={weatherMultiplier}
                  onAddIncident={handleAddIncident}
                  theme={theme}
                  onSelectPayload={(inc) => {
                    setDevPayload(inc);
                    setDevConsoleOpen(true);
                  }}
                />
              </div>
            ) : session.role === 'Contractor' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: headingText }}>
                      Volunteer Contractor Portal
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: subText }}>
                      Crowdsourced civic infrastructure restoration. Claim bounties and submit progress updates.
                    </p>
                  </div>
                  <div
                    className="rounded px-2.5 py-1 text-[10px] font-mono"
                    style={{
                      background: 'rgba(255,145,0,0.05)',
                      border: '1px solid rgba(255,145,0,0.2)',
                      color: '#FF9100',
                    }}
                  >
                    CONTRACTOR ACCESS VERIFIED
                  </div>
                </div>

                <ContractorDashboard
                  incidents={incidents}
                  session={session}
                  onClaimBounty={handleClaimBounty}
                  onSubmitProgress={handleSubmitProgress}
                  theme={theme}
                  onSelectPayload={(inc) => {
                    setDevPayload(inc);
                    setDevConsoleOpen(true);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: headingText }}>
                      Citizen Community Workspace
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: subText }}>
                      Public bounty ledger, community statistics board, and task tracking records.
                    </p>
                  </div>
                  <div
                    className="rounded px-2.5 py-1 text-[10px] font-mono"
                    style={{
                      background: 'rgba(0,230,118,0.05)',
                      border: '1px solid rgba(0,230,118,0.2)',
                      color: '#00E676',
                    }}
                  >
                    CITIZEN SYSTEM CONNECTED
                  </div>
                </div>
                <BountyMarket bounties={bounties} onCastVote={handleCastBountyVote} onVerify={handleVerifyBounty} />
              </div>
            )}
          </div>

          {/* Right panel: Citizen Simulator */}
          <div
            className="shrink-0 flex flex-col items-center justify-start pt-6 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l"
            style={{ borderColor: sidebarBorder }}
          >
            <div className="mb-3 text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: subText }}>
                Citizen App Simulator
              </span>
              <p className="text-[9px] max-w-[280px] mt-0.5" style={{ color: isDark ? '#52525b' : '#a0a090' }}>
                Simulates the mobile submission app. Tap pins to load details or use the "Report" tab.
              </p>
            </div>
            <CitizenSimulator
              incidents={incidents}
              onAddIncident={handleAddIncident}
              onUpvoteIncident={handleUpvoteIncident}
              onAuthorizeDispatch={handleAuthorizeDispatch}
              session={session}
              onUpdateKarma={handleUpdateKarma}
              theme={theme}
              onConfirmResolution={handleConfirmResolution}
            />
          </div>
        </div>
      </main>

      {/* Dev Console */}
      <DevConsole
        logs={devLogs}
        webhookLogs={webhookLogs}
        isOpen={devConsoleOpen}
        onClose={() => setDevConsoleOpen(false)}
        theme={theme}
        selectedPayload={devPayload}
        onClearPayload={() => setDevPayload(null)}
        onForceCritical={handleForceCritical}
        onForceFaulty={handleForceFaulty}
      />

      {/* Sync Device Modal */}
      {syncOpen && <SyncDeviceModal onClose={() => setSyncOpen(false)} theme={theme} />}
    </div>
  );
}

export default App;
