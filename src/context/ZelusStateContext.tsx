import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Incident, UserSession, Bounty, WebhookLog, Theme, SectorGrade, ToastNotification } from '../types';
import { initialIncidents, initialBounties } from '../mockData';

// ── Sector mapping ─────────────────────────────────────────────────────────
const SECTOR_CATEGORIES: Record<string, string> = {
  'Stray Animal Welfare & Rescue': 'Animal Care Services',
  'Urban Forestry Protection': 'Public Works',
  'Sanitation Operations': 'Sanitation Swarms',
  'Neighborhood Mediation': 'Civil Mediation Squads',
  'Road & Structural Damage': 'Public Works',
  'Water Outage & Flooding': 'Public Works',
  'Utility & Spark Hazard': 'Public Works',
};

function computeSectorGrades(incidents: Incident[]): SectorGrade[] {
  const sectors = ['Animal Care Services', 'Sanitation Swarms', 'Public Works', 'Civil Mediation Squads'] as const;
  return sectors.map(sector => {
    const relevant = incidents.filter(i => {
      const mapped = SECTOR_CATEGORIES[i.category] || 'Public Works';
      return mapped === sector;
    });
    const resolved = relevant.filter(i => i.status === 'Resolved');
    const active = relevant.filter(i => i.status !== 'Resolved');
    const slaRate = relevant.length > 0 ? Math.round((resolved.length / relevant.length) * 100) : 85;

    // Compute avg resolution hours from resolvedAt - dispatchedAt
    let avgHours = 4;
    if (resolved.length > 0) {
      const times = resolved
        .filter(i => i.resolvedAt && i.dispatchedAt)
        .map(i => (i.resolvedAt! - i.dispatchedAt!) / (1000 * 60 * 60));
      if (times.length > 0) avgHours = times.reduce((a, b) => a + b, 0) / times.length;
    }

    type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'D-';
    let grade: Grade = 'B';
    if (avgHours < 2) grade = 'A+';
    else if (avgHours < 4) grade = 'A';
    else if (avgHours < 6) grade = 'B+';
    else if (avgHours < 12) grade = 'B';
    else if (avgHours < 24) grade = 'C';
    else if (avgHours < 48) grade = 'D';
    else grade = 'D-';

    return { sector, slaRate, avgResolutionHours: avgHours, grade, resolvedCount: resolved.length, activeCount: active.length };
  });
}

// ── Context types ──────────────────────────────────────────────────────────
export interface ZelusState {
  // Data
  incidents: Incident[];
  bounties: Bounty[];
  webhookLogs: WebhookLog[];
  session: UserSession | null;
  theme: Theme;
  trustScore: number;
  sectorGrades: SectorGrade[];
  toasts: ToastNotification[];
  isIsolated: boolean;

  // Session actions
  setSession: (s: UserSession | null) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleIsolation: () => void;

  // Incident actions
  addIncident: (inc: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'>) => void;
  upvoteIncident: (id: string) => void;
  authorizeDispatch: (id: string) => void;
  claimBounty: (id: string) => void;
  updateStage: (id: string, stage: 'Accepted' | 'Dispatched' | 'In-Review') => void;
  submitProgress: (id: string, photo: string) => void;
  confirmResolution: (id: string, verification: { name: string; timestamp: string; photo: string }) => void;

  // Karma actions
  updateKarma: (xp: number) => void;

  // Toast
  addToast: (msg: string, type: ToastNotification['type']) => void;
  dismissToast: (id: string) => void;
}

const ZelusStateContext = createContext<ZelusState | null>(null);

export const useZelus = (): ZelusState => {
  const ctx = useContext(ZelusStateContext);
  if (!ctx) throw new Error('useZelus must be used inside ZelusStateProvider');
  return ctx;
};

// ── Provider ───────────────────────────────────────────────────────────────
export const ZelusStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ─ Persistent storage loader
  function loadLS<T>(key: string, fallback: T): T {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }

  const [incidents, setIncidentsRaw] = useState<Incident[]>(() => loadLS('zelus_incidents', initialIncidents));
  const [bounties] = useState<Bounty[]>(() => loadLS('zelus_bounties', initialBounties));
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(() => loadLS('zelus_webhooks', []));
  const [session, setSessionRaw] = useState<UserSession | null>(() => loadLS('zelus_session', null));
  const [theme, setThemeRaw] = useState<Theme>(() => (loadLS('zelus_theme', 'dark') as Theme));
  const [isIsolated, setIsIsolated] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const sectorGrades = computeSectorGrades(incidents);
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length;
  const activeCount = incidents.filter(i => i.status !== 'Resolved').length;
  const trustScore = Math.max(30, Math.min(100, Math.round(80 + (resolvedCount * 5) - (activeCount * 1.2))));

  // Persist to localStorage
  const setIncidents = useCallback((upd: Incident[] | ((prev: Incident[]) => Incident[])) => {
    setIncidentsRaw(prev => {
      const next = typeof upd === 'function' ? upd(prev) : upd;
      localStorage.setItem('zelus_incidents', JSON.stringify(next));
      return next;
    });
  }, []);

  const setSession = useCallback((s: UserSession | null) => {
    setSessionRaw(s);
    if (s) localStorage.setItem('zelus_session', JSON.stringify(s));
    else localStorage.removeItem('zelus_session');
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeRaw(t);
    localStorage.setItem('zelus_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);
  const toggleIsolation = useCallback(() => setIsIsolated(p => !p), []);

  // Toast helpers
  const addToast = useCallback((msg: string, type: ToastNotification['type']) => {
    const id = `toast-${Date.now()}`;
    setToasts(p => [...p, { id, message: msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);

  // Webhook logger
  const incidentsRef = useRef(incidents);
  useEffect(() => { incidentsRef.current = incidents; }, [incidents]);

  const fireWebhook = useCallback((incidentId: string, method: string, service: string, status: number, payload: Record<string, unknown>) => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const log: WebhookLog = { id: `wh-${Date.now()}`, timestamp: ts, method, service, status, payload: JSON.stringify(payload) };
    setWebhookLogs(p => { const u = [log, ...p].slice(0, 100); localStorage.setItem('zelus_webhooks', JSON.stringify(u)); return u; });
    setIncidents(p => p.map(i => i.id === incidentId ? { ...i, webhookLogs: [log, ...(i.webhookLogs || [])] } : i));
  }, []);

  // ── Incident actions ───────────────────────────────────────────────────
  const addIncident = useCallback((newInc: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'>) => {
    const nextId = `INC-2026-${String(incidentsRef.current.length + 1).padStart(3, '0')}`;
    const committed: Incident = { ...newInc, id: nextId, timestamp: 'Just Now', mergedCount: 1, verifications: [], webhookLogs: [] };
    setIncidents(p => { const u = [committed, ...p]; localStorage.setItem('zelus_incidents', JSON.stringify(u)); return u; });
    setTimeout(() => fireWebhook(nextId, 'POST', 'Citizen Broadcast Node', 200, { id: nextId, status: 'Triage' }), 100);
  }, [fireWebhook, setIncidents]);

  const upvoteIncident = useCallback((id: string) => {
    setIncidents(p => p.map(i => i.id === id ? { ...i, upvotes: i.upvotes + 1 } : i));
  }, [setIncidents]);

  const authorizeDispatch = useCallback((id: string) => {
    const now = Date.now();
    setIncidents(p => p.map(i => i.id === id ? { ...i, status: 'Bounty_Posted' as const, dispatchedAt: now } : i));
    setTimeout(() => {
      fireWebhook(id, 'POST', 'Twilio SMS Dispatch', 200, { body: `Zelus Incident ${id} triage complete. Civic bounty posted.` });
      fireWebhook(id, 'PUSH', 'Municipal GIS Map Service', 201, { id, status: 'Bounty_Posted' });
    }, 100);
  }, [setIncidents, fireWebhook]);

  const claimBounty = useCallback((id: string) => {
    if (!session) return;
    const eta = Date.now() + 2 * 60 * 60 * 1000;
    setIncidents(p => p.map(i => i.id === id ? { ...i, status: 'Claimed_In_Progress' as const, claimedBy: session.username, contractorStage: 'Accepted' as const, etaTargetTime: eta } : i));
    setTimeout(() => fireWebhook(id, 'POST', 'Twilio SMS Dispatch', 200, { body: `Incident ${id} claimed by ${session.username}. ETA: 2 hours.` }), 100);
  }, [session, setIncidents, fireWebhook]);

  const updateStage = useCallback((id: string, stage: 'Accepted' | 'Dispatched' | 'In-Review') => {
    setIncidents(p => p.map(i => i.id === id ? { ...i, contractorStage: stage } : i));
  }, [setIncidents]);

  const submitProgress = useCallback((id: string, photo: string) => {
    setIncidents(p => p.map(i => i.id === id ? { ...i, status: 'Peer_Review' as const, progressPhoto: photo, verifications: [] } : i));
    setTimeout(() => {
      fireWebhook(id, 'PUSH', 'Aegis Security Ledger', 200, { id, status: 'Peer_Review' });
      fireWebhook(id, 'POST', 'Citizen Broadcast Node', 200, { radius: '500m', incidentId: id, message: `Civic repair at ${id} completed. Consensus vote requested.` });
    }, 100);
  }, [setIncidents, fireWebhook]);

  const confirmResolution = useCallback((id: string, verification: { name: string; timestamp: string; photo: string }) => {
    setIncidents(p => p.map(i => {
      if (i.id !== id) return i;
      const updated = [...(i.verifications || []), verification];
      const resolved = updated.length >= 3;
      if (resolved) {
        const now = Date.now();
        addToast(`✅ Incident ${id} resolved! Dynamic Trust updated.`, 'success');
        setTimeout(() => {
          fireWebhook(id, 'POST', 'Twilio SMS Dispatch', 200, { body: `Consensus reached. ${id} marked RESOLVED.` });
          fireWebhook(id, 'PUSH', 'Municipal GIS Map Service', 201, { id, status: 'Resolved' });
        }, 100);
        return { ...i, verifications: updated, status: 'Resolved' as const, resolvedAt: now };
      }
      return { ...i, verifications: updated };
    }));
  }, [setIncidents, addToast, fireWebhook]);

  const updateKarma = useCallback((xp: number) => {
    if (!session) return;
    const newXP = session.karmaXP + xp;
    const badges = [...session.badges];
    if (newXP >= 220 && !badges.includes('Infrastructure Guard')) badges.push('Infrastructure Guard');
    if (newXP >= 400 && !badges.includes('Citizen Shield')) badges.push('Citizen Shield');
    const updated = { ...session, karmaXP: newXP, badges };
    setSession(updated);
  }, [session, setSession]);

  // ── Cross-tab sync ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'zelus_incidents' && e.newValue) try { setIncidentsRaw(JSON.parse(e.newValue)); } catch { /**/ }
      if (e.key === 'zelus_session') try { setSessionRaw(e.newValue ? JSON.parse(e.newValue) : null); } catch { /**/ }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Ambient incident simulation (idle 20s) ─────────────────────────────
  const lastInteractionRef = useRef(Date.now());
  useEffect(() => {
    const update = () => { lastInteractionRef.current = Date.now(); };
    window.addEventListener('mousemove', update);
    window.addEventListener('keydown', update);
    window.addEventListener('click', update);
    const iv = setInterval(() => {
      if (Date.now() - lastInteractionRef.current >= 20000) {
        const cats = ['Road & Structural Damage', 'Water Outage & Flooding', 'Utility & Spark Hazard'] as const;
        const locs = ['Zone-2 West Overpass Junction', 'Sector-5 Industrial Grid Node', 'Junction-8 Underpass Outlet'];
        const cat = cats[Math.floor(Math.random() * cats.length)];
        const loc = locs[Math.floor(Math.random() * locs.length)];
        const x = parseFloat((15 + Math.random() * 70).toFixed(1));
        const y = parseFloat((15 + Math.random() * 70).toFixed(1));
        const nextId = `INC-2026-${String(incidentsRef.current.length + 1).padStart(3, '0')}`;
        const inc: Incident = {
          id: nextId, category: cat, location: loc, coordinates: [x, y],
          severity: Math.random() > 0.5 ? 'Critical' : 'Moderate', status: 'Triage',
          upvotes: Math.floor(Math.random() * 4), description: 'Ambient sensor scan triggered automated triage entry.',
          languageBadge: null, timestamp: 'Just Now', mergedCount: 1,
          geolocation: { lat: 17.4501 + (y - 50) * 0.001, lng: 78.5252 + (x - 50) * 0.001 },
          exifVerified: true, hash: `0x${Array.from({length:16},()=>Math.floor(Math.random()*16).toString(16)).join('').toUpperCase()}`
        };
        setIncidents(p => { const u = [inc, ...p]; localStorage.setItem('zelus_incidents', JSON.stringify(u)); return u; });
      }
    }, 20000);
    return () => { window.removeEventListener('mousemove', update); window.removeEventListener('keydown', update); window.removeEventListener('click', update); clearInterval(iv); };
  }, [setIncidents]);

  const value: ZelusState = {
    incidents, bounties, webhookLogs, session, theme, trustScore, sectorGrades, toasts, isIsolated,
    setSession, setTheme, toggleTheme, toggleIsolation,
    addIncident, upvoteIncident, authorizeDispatch, claimBounty, updateStage, submitProgress, confirmResolution,
    updateKarma, addToast, dismissToast,
  };

  return <ZelusStateContext.Provider value={value}>{children}</ZelusStateContext.Provider>;
};
