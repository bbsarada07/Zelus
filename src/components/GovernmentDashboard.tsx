import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, MapPin, Layers, X,
  ShieldCheck, Wrench, Send, Cpu, Laptop,
  Terminal, Activity, RefreshCw, Zap, PawPrint,
  Trees, Trash2, Users, Construction, Droplets
} from 'lucide-react';
import { useZelus } from '../context/ZelusStateContext';
import { QRPairingModal } from './QRPairingModal';
import { MunicipalTrustMatrix } from './MunicipalTrustMatrix';
import type { Incident } from '../types';

function getCatColor(cat: string): string {
  const map: Record<string, string> = {
    'Road & Structural Damage': '#FFCC00',
    'Water Outage & Flooding': '#38BDF8',
    'Utility & Spark Hazard': '#FF3B30',
    'Stray Animal Welfare & Rescue': '#F97316',
    'Urban Forestry Protection': '#22C55E',
    'Sanitation Operations': '#EAB308',
    'Neighborhood Mediation': '#8B5CF6',
  };
  return map[cat] || 'var(--accent-cyan)';
}

function getCatIcon(cat: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    'Road & Structural Damage': <Construction className="w-3 h-3"/>,
    'Water Outage & Flooding': <Droplets className="w-3 h-3"/>,
    'Utility & Spark Hazard': <Zap className="w-3 h-3"/>,
    'Stray Animal Welfare & Rescue': <PawPrint className="w-3 h-3"/>,
    'Urban Forestry Protection': <Trees className="w-3 h-3"/>,
    'Sanitation Operations': <Trash2 className="w-3 h-3"/>,
    'Neighborhood Mediation': <Users className="w-3 h-3"/>,
  };
  return map[cat] || <AlertTriangle className="w-3 h-3"/>;
}

// Synthesize custom futuristic double-chirp beep sound
const playSciFiSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const playBeep = (time: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, time + duration);
      
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };
    
    const now = ctx.currentTime;
    playBeep(now, 580, 0.12);
    playBeep(now + 0.08, 880, 0.16);
  } catch (e) {
    console.error('AudioContext synth sound failed', e);
  }
};

export const GovernmentDashboard: React.FC = () => {
  const {
    incidents, session, isAuthenticated, authorizeDispatch, addIncident,
    sectorGrades, trustScore, webhookLogs, isIsolated, toggleIsolation
  } = useZelus();

  if (!isAuthenticated || session?.role !== 'Admin') {
    return null;
  }

  const weatherMultiplier = 1.05 + Math.random() * 0.4;

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [swarmStep, setSwarmStep] = useState(0);
  const [swarmAnimating, setSwarmAnimating] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Dev log console
  const [devConsoleOpen, setDevConsoleOpen] = useState(true);
  const [devLogs, setDevLogs] = useState<Array<{time:string;msg:string;raw?:string}>>([
    { time: '14:31:02', msg: 'System Bootstrap core nominal. Initialized developer log ledger.' },
    { time: '14:31:05', msg: '[ZELUS-ORCHESTRATOR] Agent swarm pre-warmed and standing by.' },
  ]);

  // Threat risk index simulation
  const [threatIndex, setThreatIndex] = useState(0.92);
  useEffect(() => {
    const iv = setInterval(() => {
      setThreatIndex(p => parseFloat(Math.min(1.5, Math.max(0.4, p + (Math.random()-0.5)*0.04)).toFixed(2)));
    }, 3500);
    return () => clearInterval(iv);
  }, []);

  // Monitor live ingestion of tickets
  const [newIncidentIds, setNewIncidentIds] = useState<string[]>([]);
  const prevRef = useRef<Incident[]>(incidents);
  
  useEffect(() => {
    const prevIds = new Set(prevRef.current.map(i => i.id));
    const added = incidents.filter(i => !prevIds.has(i.id)).map(i => i.id);
    if (added.length > 0) {
      setNewIncidentIds(p => [...p, ...added]);
      const now = new Date().toLocaleTimeString();
      setDevLogs(p => [{ time: now, msg: `[NEW TICKET] ${added.join(', ')} received from Citizen feed.` }, ...p]);
      
      // Play sci-fi ingestion sound cue!
      playSciFiSound();

      // Clear ingestion marker after 8 seconds
      setTimeout(() => setNewIncidentIds(p => p.filter(id => !added.includes(id))), 8000);
    }
    prevRef.current = incidents;
  }, [incidents]);

  // Sync webhook logs to dev console
  useEffect(() => {
    if (webhookLogs.length > 0) {
      const latest = webhookLogs[0];
      const entry = { time: latest.timestamp, msg: `[WEBHOOK ${latest.method}] ${latest.service} → HTTP ${latest.status}`, raw: latest.payload };
      setDevLogs(p => {
        const alreadyHas = p.some(l => l.time === entry.time && l.msg === entry.msg);
        return alreadyHas ? p : [entry, ...p].slice(0, 60);
      });
    }
  }, [webhookLogs]);

  // Swarm agent pipeline simulation
  const handleSelectIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    setSwarmStep(0);
    setSwarmAnimating(true);
  };

  useEffect(() => {
    if (!swarmAnimating || !selectedIncident) return;
    let step = 0;
    setSwarmStep(0);
    const logs = [
      [`[AEGIS-AGENT] Fraud check initiated for ${selectedIncident.id}...`, `[AEGIS-AGENT] EXIF metadata integrity: PASS`, `[AEGIS-AGENT] SHA-256 checksum verified: ${selectedIncident.hash?.slice(0,20) || '0x3EAA89FD'}`, `[AEGIS-AGENT] CONFIDENCE SCORE: 98.9% — NO FRAUD DETECTED.`],
      [`[ATLAS-AGENT] Spatial triangulation commencing...`, `[ATLAS-AGENT] GPS locked: Lat ${selectedIncident.geolocation?.lat.toFixed(5)||'17.45012'} Lng ${selectedIncident.geolocation?.lng.toFixed(5)||'78.52521'}`, `[ATLAS-AGENT] Nearest dispatch quadrant resolved: QUADRANT-${selectedIncident.severity==='Critical'?'RED-01':'AMBER-02'}`],
      [`[VULCAN-AGENT] Materials estimation engaged for severity: ${selectedIncident.severity}`, `[VULCAN-AGENT] BOM committed — ${selectedIncident.materials?.length||0} items allocated`, `[VULCAN-AGENT] Total budget: $${selectedIncident.costBreakdown?.total||250}`],
      [`[MERCURY-AGENT] Outbound dispatch payload queued...`, `[MERCURY-AGENT] Twilio SMS trigger committed to contractors.`, `[MERCURY-AGENT] GIS pin updated on volunteer marketplace.`],
    ];
    const run = () => {
      if (step >= 4) { setSwarmAnimating(false); return; }
      const now = new Date().toLocaleTimeString();
      const entries = logs[step].map(msg => ({ time: now, msg }));
      setDevLogs(p => [...entries.reverse(), ...p]);
      setSwarmStep(step + 1);
      step++;
      setTimeout(run, 950);
    };
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, [swarmAnimating, selectedIncident]);

  const activeCount = incidents.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="space-y-5 flex-1 flex flex-col font-sans select-none animate-fade-in text-[var(--text-primary)]">

      {/* ── TOP CONTROL BAR ── */}
      <div className="border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl transition-all duration-300" 
        style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border flex items-center justify-center bg-[var(--bg-secondary)] border-[var(--border-secondary)]">
            <Cpu className={`w-5 h-5 ${isIsolated ? 'animate-bounce' : 'animate-pulse'}`} style={{ color: isIsolated ? 'var(--accent-amber)' : 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-bold font-mono tracking-wider text-[var(--text-primary)] uppercase">ZELUS MUNICIPAL GATEWAY // ADMIN</h2>
              <span className={`flex items-center gap-1 text-[9px] font-mono border px-2 py-0.5 rounded-full font-extrabold transition-all ${isIsolated ? 'animate-pulse' : ''}`} 
                style={{ backgroundColor: isIsolated ? 'rgba(217,119,6,0.1)' : 'rgba(10,70,228,0.08)', borderColor: isIsolated ? 'var(--accent-amber)' : 'var(--accent-cyan)', color: isIsolated ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                {isIsolated ? 'LOCAL ISOLATION MODE' : 'SYSTEM: NOMINAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Live diagnostics */}
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono">
          <div className="flex flex-col">
            <span style={{ color: 'var(--text-muted)' }}>ACTIVE TICKETS</span>
            <span className="text-xs font-bold text-[var(--text-primary)]">{activeCount} IN QUEUE</span>
          </div>
          <div className="h-5 w-px bg-[var(--border-secondary)]" />
          <div className="flex flex-col">
            <span style={{ color: 'var(--text-muted)' }}>THREAT RISK</span>
            <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--accent-red)' }}>
              <AlertTriangle className="w-3 h-3 animate-bounce" />
              {threatIndex.toFixed(2)} INDEX
            </span>
          </div>
          <div className="h-5 w-px bg-[var(--border-secondary)]" />
          <div className="flex flex-col">
            <span style={{ color: 'var(--text-muted)' }}>WEATHER WEAR</span>
            <span className="text-xs font-bold" style={{ color: 'var(--accent-amber)' }}>x{weatherMultiplier.toFixed(2)} COEFF</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={toggleIsolation}
            className="px-3 py-1.5 rounded border text-[10px] font-mono font-bold cursor-pointer flex items-center gap-1.5 transition-all"
            style={{ borderColor: isIsolated ? 'var(--accent-amber)' : 'var(--border-secondary)', color: isIsolated ? 'var(--accent-amber)' : 'var(--text-muted)', backgroundColor: isIsolated ? 'rgba(217,119,6,0.06)' : 'transparent' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${isIsolated ? 'animate-spin' : ''}`} />
            {isIsolated ? 'ISOLATED' : 'SYNC ACTIVE'}
          </button>
          <button onClick={() => setShowQR(true)}
            className="px-3 py-1.5 rounded border text-[10px] font-mono font-bold cursor-pointer flex items-center gap-1.5 transition-all bg-[var(--accent-cyan)] text-[var(--bg-primary)] border-[var(--accent-cyan)] hover:brightness-105 shadow-sm">
            QR Pairing / Sync Device
          </button>
        </div>
      </div>

      {/* ── THREE-PANE WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1 min-h-[500px]">

        {/* LEFT — Geospatial Triage Engine */}
        <div className="lg:col-span-4 border rounded-xl p-4 flex flex-col justify-between shadow-xl min-h-[500px] overflow-hidden transition-all duration-300" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
          <div className="space-y-3">
            <div className="border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
              <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[var(--text-primary)] flex items-center gap-1.5">
                <Layers className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
                Geospatial Triage Engine
              </h3>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Clustered incoming tickets pending municipal authorization.</p>
            </div>

            {/* Ingestion Neon Banner Alert */}
            {newIncidentIds.length > 0 && (
              <div className="rounded-lg p-2.5 text-center font-mono border text-[9px] font-bold tracking-wider animate-pulse"
                style={{
                  backgroundColor: 'rgba(0, 255, 204, 0.08)',
                  borderColor: '#00FFCC',
                  color: '#00FFCC',
                  boxShadow: '0 0 10px rgba(0, 255, 204, 0.35)',
                }}>
                ⚠️ LIVE INGESTION ACTIVE // {newIncidentIds.length} NEW REPORT(S) RECORDED
              </div>
            )}

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {incidents.length === 0 ? (
                <div className="text-center py-12 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>[NO ACTIVE TICKETS SUBMITTED]</div>
              ) : incidents.map(inc => {
                const isSelected = selectedIncident?.id === inc.id;
                const isNew = newIncidentIds.includes(inc.id);
                const catColor = getCatColor(inc.category);
                return (
                  <div key={inc.id}
                    onClick={() => handleSelectIncident(inc)}
                    className={`border p-3 rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.01] relative ${isNew ? 'animate-live-ingest' : ''}`}
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
                      borderColor: isSelected ? 'var(--accent-cyan)' : isNew ? '#00FFCC' : 'var(--border-secondary)',
                      borderLeftColor: catColor,
                      borderLeftWidth: 3,
                      boxShadow: isNew ? '0 0 12px rgba(0,255,204,0.3)' : 'none',
                    }}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: catColor }}>{getCatIcon(inc.category)}</span>
                        <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{inc.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isNew && <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border animate-pulse" style={{ borderColor: '#00FFCC', color: '#00FFCC', backgroundColor: 'rgba(0,255,204,0.1)' }}>LIVE</span>}
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border" style={{ borderColor: inc.severity==='Critical'?'var(--accent-red)':'var(--accent-amber)', color: inc.severity==='Critical'?'var(--accent-red)':'var(--accent-amber)', backgroundColor: inc.severity==='Critical'?'rgba(239,68,68,0.1)':'rgba(217,119,6,0.1)' }}>{inc.severity}</span>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold mt-1.5 text-[var(--text-primary)]">{inc.category}</h4>
                    <p className="text-[10px] truncate mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>{inc.location}</p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t text-[9px] font-mono" style={{ borderColor: 'var(--border-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>↑{inc.upvotes} · {inc.timestamp}</span>
                      <span className="font-bold uppercase" style={{ color: 'var(--accent-cyan)' }}>{inc.status.replace(/_/g,' ')}</span>
                    </div>

                    {/* Approve & Dispatch button */}
                    {inc.status === 'Triage' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          authorizeDispatch(inc.id);
                          if (selectedIncident?.id === inc.id) setSelectedIncident(p => p ? {...p, status:'Bounty_Posted'} : null);
                          const now = new Date().toLocaleTimeString();
                          setDevLogs(p => [{ time: now, msg: `[ADMIN] ✅ Ticket ${inc.id} authorized. Bounty posted to marketplace.` }, ...p]);
                        }}
                        className="mt-2 w-full py-1.5 rounded border text-[9px] font-mono font-bold uppercase cursor-pointer transition-all hover:bg-cyan-500 hover:text-white"
                        style={{ backgroundColor: 'transparent', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                      >
                        ▶ Approve & Dispatch Swarm
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Inject Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t mt-3" style={{ borderColor: 'var(--border-secondary)' }}>
            <button type="button" onClick={() => addIncident({ category:'Utility & Spark Hazard', location:'Zone-1 Main Transformers', coordinates:[17.4480,78.5210], severity:'Critical', status:'Triage', upvotes:4, image:'/downed_power_line.png', notes:'High severity grid node failure.', description:'High severity grid node failure.', languageBadge:null, geolocation:{lat:17.4480,lng:78.5210}, materials:['High-Voltage Insulation Tape'], costBreakdown:{materials:600,labor:400,total:1000} })}
              className="py-1.5 text-[9px] font-mono rounded border cursor-pointer hover:bg-red-500/10" style={{ borderColor:'rgba(239,68,68,0.3)', color:'var(--accent-red)', backgroundColor:'rgba(239,68,68,0.05)' }}>
              + Inject Critical
            </button>
            <button type="button" onClick={() => addIncident({ category:'Stray Animal Welfare & Rescue', location:'Greenfield Park', coordinates:[17.4530,78.5195], severity:'Moderate', status:'Triage', upvotes:2, image:'/road_pothole.png', notes:'Stray animal rescue needed.', description:'Stray animal rescue needed.', languageBadge:null, geolocation:{lat:17.4530,lng:78.5195}, materials:['Animal Transport Crate'], costBreakdown:{materials:200,labor:300,total:500} })}
              className="py-1.5 text-[9px] font-mono rounded border cursor-pointer hover:bg-white/5" style={{ borderColor:'var(--border-secondary)', color:'var(--accent-orange)' }}>
              + Inject Animal
            </button>
          </div>
        </div>

        {/* CENTER — Swarm Orchestrator */}
        <div className="lg:col-span-5 border rounded-xl p-4 flex flex-col shadow-xl min-h-[500px] relative overflow-hidden transition-all duration-300" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
          {selectedIncident ? (
            <div className="flex-1 flex flex-col justify-between space-y-4 animate-slide-down">
              <div className="border-b pb-3 flex justify-between items-start" style={{ borderColor: 'var(--border-secondary)' }}>
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[var(--text-primary)] flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
                    [ZELUS-ORCHESTRATOR] // SWARM
                  </h3>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>TRIAGING: {selectedIncident.id}</span>
                </div>
                <button onClick={() => setSelectedIncident(null)} className="p-1 rounded cursor-pointer hover:bg-white/5 text-[var(--text-muted)]">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {[
                  { step:1, label:'[Aegis-Agent: Fraud & Verification]', icon:<ShieldCheck className="w-3.5 h-3.5"/>, detail:`Blockchain sig: ${selectedIncident.hash?.slice(0,18)||'0x3EAA89FD'}` },
                  { step:2, label:'[Atlas-Agent: Geospatial Routing]', icon:<MapPin className="w-3.5 h-3.5"/>, detail:`Lat ${selectedIncident.geolocation?.lat.toFixed(5)||'17.45012'} · Lng ${selectedIncident.geolocation?.lng.toFixed(5)||'78.52521'}` },
                  { step:3, label:'[Vulcan-Agent: Material & Cost Matrix]', icon:<Wrench className="w-3.5 h-3.5"/>, detail:`BOM: ${selectedIncident.materials?.length||0} items · Budget $${selectedIncident.costBreakdown?.total||250}` },
                  { step:4, label:'[Mercury-Agent: Fleet Dispatch]', icon:<Send className="w-3.5 h-3.5"/>, detail:'Twilio SMS + GIS pin committed to marketplace' },
                ].map(agent => (
                  <div key={agent.step}
                    className="p-2.5 rounded border transition-all duration-300"
                    style={{ borderColor: swarmStep >= agent.step ? 'var(--accent-cyan)' : 'var(--border-secondary)', backgroundColor: swarmStep >= agent.step ? 'var(--bg-secondary)' : 'transparent', opacity: swarmStep >= agent.step ? 1 : 0.35 }}>
                    <div className="flex items-center justify-between text-[9px] font-mono font-bold">
                      <span className="flex items-center gap-1.5" style={{ color: swarmStep >= agent.step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {agent.icon} {agent.label}
                      </span>
                      <span style={{ color: swarmStep >= agent.step ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {swarmStep >= agent.step ? '✓ DONE' : '○'}
                      </span>
                    </div>
                    {swarmStep >= agent.step && (
                      <p className="text-[9px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{agent.detail}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Materials */}
              {selectedIncident.materials && selectedIncident.materials.length > 0 && swarmStep >= 3 && (
                <div className="space-y-1.5 animate-fade-in">
                  <p className="text-[9px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Allocated BOM:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedIncident.materials.map((m,i) => (
                      <span key={i} className="text-[8px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Post bounty button */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                {selectedIncident.status === 'Triage' ? (
                  <button
                    onClick={() => { if (!swarmAnimating && swarmStep >= 4) { authorizeDispatch(selectedIncident.id); setSelectedIncident(p => p ? {...p, status:'Bounty_Posted'} : null); } }}
                    disabled={swarmAnimating || swarmStep < 4}
                    className="w-full py-2.5 font-bold font-mono text-[10px] uppercase rounded cursor-pointer transition-all border disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-cyan)] text-[var(--bg-primary)] border-[var(--accent-cyan)]"
                  >
                    POST CIVIC BOUNTY TO MARKETPLACE
                  </button>
                ) : (
                  <div className="w-full py-2 text-center text-[10px] font-mono rounded border" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>
                    ✓ BOUNTY COMMITTED TO VOLUNTEER WORKSPACE
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Laptop className="w-10 h-10" style={{ color: 'var(--border-secondary)' }} />
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Command Overlay Idle</h4>
                <p className="text-[10px] mt-1 max-w-[240px]" style={{ color: 'var(--text-muted)' }}>Select an active triage incident to execute sequential swarm pipelines.</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Cloud Analytics */}
        <div className="lg:col-span-3 border rounded-xl p-4 space-y-4 shadow-xl min-h-[500px] transition-all duration-300" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
          <div className="border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[var(--text-primary)] flex items-center gap-1.5">
              <Activity className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
              Cloud Infrastructure
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Google Cloud + Gemini orchestration metrics.</p>
          </div>

          {/* Sparklines */}
          {[
            { label:'Incident Queue Velocity', val:`+${activeCount}/hr`, color:'var(--accent-cyan)', path:'M 0 18 C 15 15, 30 18, 45 10 C 60 5, 80 12, 100 2', fill:'rgba(10,70,228,0.05)' },
            { label:'Spam Isolation Rate', val:'94.2% quarantine', color:'var(--accent-amber)', path:'M 0 12 C 20 8, 40 14, 60 5 C 80 2, 90 8, 100 6', fill:'rgba(217,119,6,0.05)' },
          ].map(chart => (
            <div key={chart.label} className="space-y-1 p-2.5 border rounded" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex justify-between items-baseline text-[9.5px] font-mono">
                <span style={{ color: 'var(--text-muted)' }}>{chart.label}</span>
                <span style={{ color: chart.color }}>{chart.val}</span>
              </div>
              <div className="w-full h-10 mt-1">
                <svg viewBox="0 0 100 20" className="w-full h-full" style={{ color: chart.color }}>
                  <path d={chart.path} fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <path d={chart.path + ' L 100 20 L 0 20 Z'} fill={chart.fill}/>
                </svg>
              </div>
            </div>
          ))}

          {/* GCP Telemetry */}
          <div className="space-y-1.5">
            <span className="text-[8px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>GCP Telemetry</span>
            <div className="border rounded p-3 space-y-2 font-mono text-[10px] bg-var(--bg-secondary)" style={{ borderColor: 'var(--border-secondary)' }}>
              {[
                { k:'Cloud Run Instance', v:'ACTIVE', vc:'var(--accent-green)', ping:true },
                { k:'Container Build', v:'SUCCESS', vc:'var(--accent-cyan)', ping:false },
                { k:'Gemini API Load', v:'34.2k tokens/m', vc:'var(--accent-amber)', ping:false },
                { k:'Agent Swarms', v:`${activeCount} parallel`, vc:'var(--accent-orange)', ping:false },
              ].map(r => (
                <div key={r.k} className="flex justify-between items-center border-b pb-1.5 last:border-0 last:pb-0 border-[var(--border-secondary)]">
                  <span style={{ color: 'var(--text-muted)' }}>{r.k}:</span>
                  <span className="font-bold" style={{ color: r.vc }}>
                    {r.ping && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-ping mr-1"/>}
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── DEV LOG CONSOLE DRAWER ── */}
      <div className="border rounded-xl shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col"
        style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)', height: devConsoleOpen ? '240px' : '44px' }}>
        <div onClick={() => setDevConsoleOpen(!devConsoleOpen)} className="px-4 h-11 flex items-center justify-between cursor-pointer border-b select-none" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-[var(--text-primary)]">
            <Terminal className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }}/>
            OPERATIONAL TELEMETRY // /DEV CONSOLE
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono border px-1.5 py-0.5 rounded uppercase" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>{devLogs.length} updates</span>
            <span className="text-xs font-mono font-bold text-[var(--text-muted)]">{devConsoleOpen ? '▼' : '▲'}</span>
          </div>
        </div>
        <div className="flex-1 p-3 font-mono text-[10px] space-y-1.5 overflow-y-auto bg-black text-zinc-300">
          {devLogs.map((log, i) => (
            <div key={i} className="border-b border-zinc-950 pb-1">
              <span className="text-zinc-600 mr-2">[{log.time}]</span>
              <span style={{ color: log.msg.includes('✅') ? '#22C55E' : log.msg.includes('NEW TICKET') || log.msg.includes('WEBHOOK') ? '#EA580C' : '#00FFCC' }}>{log.msg}</span>
              {log.raw && <pre className="text-zinc-500 text-[9px] mt-0.5 pl-4 whitespace-pre-wrap">{log.raw.slice(0,200)}</pre>}
            </div>
          ))}
        </div>
      </div>

      {/* ── MUNICIPAL TRUST MATRIX ── */}
      <MunicipalTrustMatrix sectorGrades={sectorGrades} trustScore={trustScore} />

      {/* QR Modal */}
      {showQR && <QRPairingModal onClose={() => setShowQR(false)} />}
    </div>
  );
};
