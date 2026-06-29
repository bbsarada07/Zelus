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

// ── Category color/icon helpers ────────────────────────────────────────────
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
  return map[cat] || '#00FFCC';
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

export const GovernmentDashboard: React.FC = () => {
  const {
    incidents, authorizeDispatch, addIncident,
    sectorGrades, trustScore, webhookLogs, isIsolated, toggleIsolation
  } = useZelus();

  const weatherMultiplier = 1.05 + Math.random() * 0.4;

  // Selected incident for Center Swarm
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [swarmStep, setSwarmStep] = useState(0);
  const [swarmAnimating, setSwarmAnimating] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Dev console
  const [devConsoleOpen, setDevConsoleOpen] = useState(true);
  const [devLogs, setDevLogs] = useState<Array<{time:string;msg:string;raw?:string}>>([
    { time: '14:31:02', msg: 'System Bootstrap core nominal. Initialized developer log ledger.' },
    { time: '14:31:05', msg: '[ZELUS-ORCHESTRATOR] Agent swarm pre-warmed and standing by.' },
  ]);

  // Threat risk index
  const [threatIndex, setThreatIndex] = useState(0.92);
  useEffect(() => {
    const iv = setInterval(() => {
      setThreatIndex(p => parseFloat(Math.min(1.5, Math.max(0.4, p + (Math.random()-0.5)*0.04)).toFixed(2)));
    }, 3500);
    return () => clearInterval(iv);
  }, []);

  // New incident pulse IDs
  const [newIncidentIds, setNewIncidentIds] = useState<string[]>([]);
  const prevRef = useRef<Incident[]>(incidents);
  useEffect(() => {
    const prevIds = new Set(prevRef.current.map(i => i.id));
    const added = incidents.filter(i => !prevIds.has(i.id)).map(i => i.id);
    if (added.length > 0) {
      setNewIncidentIds(p => [...p, ...added]);
      const now = new Date().toLocaleTimeString();
      setDevLogs(p => [{ time: now, msg: `[NEW TICKET] ${added.join(', ')} received from Citizen feed.` }, ...p]);
      setTimeout(() => setNewIncidentIds(p => p.filter(id => !added.includes(id))), 12000);
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

  // Swarm animation
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
      [`[HELIOS-AGENT] Materials estimation engaged for severity: ${selectedIncident.severity}`, `[HELIOS-AGENT] BOM committed — ${selectedIncident.materials?.length||0} items allocated`, `[HELIOS-AGENT] Total budget: $${selectedIncident.costBreakdown?.total||250}`],
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
    <div className="space-y-5 flex-1 flex flex-col font-sans select-none">

      {/* ── TOP CONTROL BAR ── */}
      <div className="glass-panel border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl" style={{ borderColor: '#1A2629', backgroundColor: '#111A1C' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border flex items-center justify-center" style={{ backgroundColor: '#0D1517', borderColor: '#1A2629' }}>
            <Cpu className={`w-5 h-5 ${isIsolated ? 'animate-bounce' : 'animate-pulse'}`} style={{ color: isIsolated ? '#FFCC00' : '#00FFCC' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-bold font-mono tracking-wider text-white uppercase">ZELUS MUNICIPAL GATEWAY // ADMIN</h2>
              <span className={`flex items-center gap-1 text-[9px] font-mono border px-2 py-0.5 rounded-full font-extrabold ${isIsolated ? 'animate-pulse' : ''}`} style={{ backgroundColor: isIsolated ? 'rgba(255,204,0,0.1)' : 'rgba(0,255,204,0.08)', borderColor: isIsolated ? '#FFCC00' : '#00FFCC', color: isIsolated ? '#FFCC00' : '#00FFCC' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                {isIsolated ? 'LOCAL ISOLATION MODE' : 'SYSTEM: NOMINAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Live diagnostics */}
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono">
          <div className="flex flex-col">
            <span style={{ color: '#64748B' }}>ACTIVE TICKETS</span>
            <span className="text-xs font-bold text-white">{activeCount} IN QUEUE</span>
          </div>
          <div className="h-5 w-px" style={{ backgroundColor: '#1A2629' }} />
          <div className="flex flex-col">
            <span style={{ color: '#64748B' }}>THREAT RISK</span>
            <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#FF3B30' }}>
              <AlertTriangle className="w-3 h-3 animate-bounce" />
              {threatIndex.toFixed(2)} INDEX
            </span>
          </div>
          <div className="h-5 w-px" style={{ backgroundColor: '#1A2629' }} />
          <div className="flex flex-col">
            <span style={{ color: '#64748B' }}>WEATHER WEAR</span>
            <span className="text-xs font-bold" style={{ color: '#FFCC00' }}>x{weatherMultiplier.toFixed(2)} COEFF</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={toggleIsolation}
            className="px-3 py-1.5 rounded border text-[10px] font-mono font-bold cursor-pointer flex items-center gap-1.5 transition-all"
            style={{ borderColor: isIsolated ? '#FFCC00' : '#1A2629', color: isIsolated ? '#FFCC00' : '#64748B', backgroundColor: isIsolated ? 'rgba(255,204,0,0.06)' : 'transparent' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${isIsolated ? 'animate-spin' : ''}`} />
            {isIsolated ? 'ISOLATED' : 'SYNC ACTIVE'}
          </button>
          <button onClick={() => setShowQR(true)}
            className="px-3 py-1.5 rounded border text-[10px] font-mono font-bold cursor-pointer flex items-center gap-1.5 transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(0,255,204,0.25)', color: '#00FFCC' }}>
            QR Pairing
          </button>
        </div>
      </div>

      {/* ── THREE-PANE WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1 min-h-[500px]">

        {/* LEFT — Geospatial Triage Engine */}
        <div className="lg:col-span-4 border rounded-xl p-4 flex flex-col justify-between shadow-xl min-h-[500px] overflow-hidden" style={{ borderColor: '#1A2629', backgroundColor: '#111A1C' }}>
          <div className="space-y-3">
            <div className="border-b pb-3" style={{ borderColor: '#1A2629' }}>
              <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4" style={{ color: '#00FFCC' }} />
                Geospatial Triage Engine
              </h3>
              <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>Clustered incoming tickets pending municipal authorization.</p>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {incidents.length === 0 ? (
                <div className="text-center py-12 text-[10px] font-mono" style={{ color: '#64748B' }}>[NO ACTIVE TICKETS SUBMITTED]</div>
              ) : incidents.map(inc => {
                const isSelected = selectedIncident?.id === inc.id;
                const isNew = newIncidentIds.includes(inc.id);
                const catColor = getCatColor(inc.category);
                return (
                  <div key={inc.id}
                    onClick={() => handleSelectIncident(inc)}
                    className={`border p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01] relative ${isNew ? 'animate-pulse' : ''}`}
                    style={{
                      backgroundColor: isSelected ? '#0D1517' : 'rgba(9,15,16,0.4)',
                      borderColor: isSelected ? '#00FFCC' : isNew ? catColor : '#1A2629',
                      borderLeftColor: catColor,
                      borderLeftWidth: 3,
                      boxShadow: isNew ? `0 0 12px ${catColor}30` : 'none',
                    }}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: catColor }}>{getCatIcon(inc.category)}</span>
                        <span className="text-[8px] font-mono" style={{ color: '#64748B' }}>{inc.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isNew && <span className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded border animate-pulse" style={{ borderColor: catColor, color: catColor, backgroundColor: `${catColor}10` }}>NEW</span>}
                        <span className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded border" style={{ borderColor: inc.severity==='Critical'?'#FF3B30':'#FFCC00', color: inc.severity==='Critical'?'#FF3B30':'#FFCC00', backgroundColor: inc.severity==='Critical'?'rgba(255,59,48,0.1)':'rgba(255,204,0,0.1)' }}>{inc.severity}</span>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold mt-1.5 text-white">{inc.category}</h4>
                    <p className="text-[9px] truncate mt-0.5 font-mono" style={{ color: '#64748B' }}>{inc.location}</p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t text-[8px] font-mono" style={{ borderColor: '#1A2629' }}>
                      <span style={{ color: '#64748B' }}>↑{inc.upvotes} · {inc.timestamp}</span>
                      <span className="font-bold uppercase" style={{ color: '#00FFCC' }}>{inc.status.replace(/_/g,' ')}</span>
                    </div>

                    {/* Inline "Approve & Dispatch Swarm" button for Triage status */}
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
                        className="mt-2 w-full py-1.5 rounded border text-[8.5px] font-mono font-bold uppercase cursor-pointer transition-all hover:brightness-110"
                        style={{ backgroundColor: 'rgba(0,255,204,0.08)', borderColor: 'rgba(0,255,204,0.3)', color: '#00FFCC' }}
                      >
                        ▶ Approve & Dispatch Swarm
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick inject buttons */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t mt-3" style={{ borderColor: '#1A2629' }}>
            <button type="button" onClick={() => addIncident({ category:'Critical Infrastructure Failure', location:'Zone-1 Main Transformers', coordinates:[17.4480,78.5210], severity:'Critical', status:'Triage', upvotes:4, image:'/downed_power_line.png', notes:'High severity grid node failure.', description:'High severity grid node failure.', languageBadge:null, geolocation:{lat:17.4480,lng:78.5210}, materials:['High-Voltage Insulation Tape'], costBreakdown:{materials:600,labor:400,total:1000} })}
              className="py-1 text-[8.5px] font-mono rounded border cursor-pointer hover:bg-red-500/10" style={{ borderColor:'rgba(255,59,48,0.3)', color:'#FF3B30', backgroundColor:'rgba(255,59,48,0.05)' }}>
              + Inject Critical
            </button>
            <button type="button" onClick={() => addIncident({ category:'Stray Animal Welfare & Rescue', location:'Greenfield Park', coordinates:[17.4530,78.5195], severity:'Moderate', status:'Triage', upvotes:2, image:'/road_pothole.png', notes:'Stray animal rescue needed.', description:'Stray animal rescue needed.', languageBadge:null, geolocation:{lat:17.4530,lng:78.5195}, materials:['Animal Transport Crate'], costBreakdown:{materials:200,labor:300,total:500} })}
              className="py-1 text-[8.5px] font-mono rounded border cursor-pointer hover:bg-white/5" style={{ borderColor:'#1A2629', color:'#F97316' }}>
              + Inject Animal
            </button>
          </div>
        </div>

        {/* CENTER — Swarm Orchestrator */}
        <div className="lg:col-span-5 border rounded-xl p-4 flex flex-col shadow-xl min-h-[500px] relative overflow-hidden" style={{ borderColor: '#1A2629', backgroundColor: '#111A1C' }}>
          {selectedIncident ? (
            <div className="flex-1 flex flex-col justify-between space-y-4 animate-slide-down">
              <div className="border-b pb-3 flex justify-between items-start" style={{ borderColor: '#1A2629' }}>
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" style={{ color: '#00FFCC' }} />
                    [ZELUS-ORCHESTRATOR] // SWARM
                  </h3>
                  <span className="text-[9px] font-mono" style={{ color: '#64748B' }}>TRIAGING: {selectedIncident.id}</span>
                </div>
                <button onClick={() => setSelectedIncident(null)} className="p-1 rounded cursor-pointer hover:bg-white/5" style={{ color: '#64748B' }}>
                  <X className="w-3.5 h-3.5"/>
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {[
                  { step:1, label:'[Aegis-Agent: Fraud & Verification]', icon:<ShieldCheck className="w-3.5 h-3.5"/>, detail:`Blockchain sig: ${selectedIncident.hash?.slice(0,18)||'0x3EAA89FD'}` },
                  { step:2, label:'[Atlas-Agent: Geospatial Routing]', icon:<MapPin className="w-3.5 h-3.5"/>, detail:`Lat ${selectedIncident.geolocation?.lat.toFixed(5)||'17.45012'} · Lng ${selectedIncident.geolocation?.lng.toFixed(5)||'78.52521'}` },
                  { step:3, label:'[Helios-Agent: Material & Cost Matrix]', icon:<Wrench className="w-3.5 h-3.5"/>, detail:`BOM: ${selectedIncident.materials?.length||0} items · Budget $${selectedIncident.costBreakdown?.total||250}` },
                  { step:4, label:'[Mercury-Agent: Fleet Dispatch]', icon:<Send className="w-3.5 h-3.5"/>, detail:'Twilio SMS + GIS pin committed to marketplace' },
                ].map(agent => (
                  <div key={agent.step}
                    className="p-2.5 rounded border transition-all duration-400"
                    style={{ borderColor: swarmStep >= agent.step ? 'rgba(0,255,204,0.2)' : '#1A2629', backgroundColor: swarmStep >= agent.step ? 'rgba(0,255,204,0.03)' : 'transparent', opacity: swarmStep >= agent.step ? 1 : 0.35 }}>
                    <div className="flex items-center justify-between text-[9px] font-mono font-bold">
                      <span className="flex items-center gap-1.5" style={{ color: swarmStep >= agent.step ? '#00FFCC' : '#64748B' }}>
                        {agent.icon} {agent.label}
                      </span>
                      <span style={{ color: swarmStep >= agent.step ? '#22C55E' : '#1A2629' }}>
                        {swarmStep >= agent.step ? '✓ DONE' : '○'}
                      </span>
                    </div>
                    {swarmStep >= agent.step && (
                      <p className="text-[8.5px] font-mono mt-1" style={{ color: '#64748B' }}>{agent.detail}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Materials */}
              {selectedIncident.materials && selectedIncident.materials.length > 0 && swarmStep >= 3 && (
                <div className="space-y-1.5 animate-fade-in">
                  <p className="text-[8px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Allocated BOM:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedIncident.materials.map((m,i) => (
                      <span key={i} className="text-[7.5px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: '#1A2629', color: '#94A3B8', backgroundColor: 'rgba(9,15,16,0.5)' }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Post bounty button */}
              <div className="pt-3 border-t" style={{ borderColor: '#1A2629' }}>
                {selectedIncident.status === 'Triage' ? (
                  <button
                    onClick={() => { if (!swarmAnimating && swarmStep >= 4) { authorizeDispatch(selectedIncident.id); setSelectedIncident(p => p ? {...p, status:'Bounty_Posted'} : null); } }}
                    disabled={swarmAnimating || swarmStep < 4}
                    className="w-full py-2.5 font-bold font-mono text-[10px] uppercase rounded cursor-pointer transition-all border disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#00FFCC', color: '#090F10', borderColor: '#00FFCC' }}>
                    POST CIVIC BOUNTY TO MARKETPLACE
                  </button>
                ) : (
                  <div className="w-full py-2 text-center text-[9px] font-mono rounded border" style={{ borderColor: '#1A2629', color: '#22C55E' }}>
                    ✓ BOUNTY COMMITTED TO VOLUNTEER WORKSPACE
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Laptop className="w-10 h-10" style={{ color: '#1A2629' }} />
              <div>
                <h4 className="text-xs font-bold text-white">Command Overlay Idle</h4>
                <p className="text-[10px] mt-1 max-w-[240px]" style={{ color: '#64748B' }}>Select an active triage incident to execute sequential swarm pipelines.</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Cloud Analytics */}
        <div className="lg:col-span-3 border rounded-xl p-4 space-y-4 shadow-xl min-h-[500px]" style={{ borderColor: '#1A2629', backgroundColor: '#111A1C' }}>
          <div className="border-b pb-3" style={{ borderColor: '#1A2629' }}>
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4" style={{ color: '#00FFCC' }} />
              Cloud Infrastructure
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>Google Cloud + Gemini orchestration metrics.</p>
          </div>

          {/* Sparklines */}
          {[
            { label:'Incident Queue Velocity', val:`+${activeCount}/hr`, color:'#00FFCC', path:'M 0 18 C 15 15, 30 18, 45 10 C 60 5, 80 12, 100 2', fill:'rgba(0,255,204,0.05)' },
            { label:'Spam Isolation Rate', val:'94.2% quarantine', color:'#FFCC00', path:'M 0 12 C 20 8, 40 14, 60 5 C 80 2, 90 8, 100 6', fill:'rgba(255,204,0,0.05)' },
          ].map(chart => (
            <div key={chart.label} className="space-y-1 p-2.5 border rounded" style={{ borderColor: '#1A2629', backgroundColor: 'rgba(9,15,16,0.4)' }}>
              <div className="flex justify-between items-baseline text-[9.5px] font-mono">
                <span style={{ color: '#64748B' }}>{chart.label}</span>
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
            <span className="text-[8px] font-mono uppercase tracking-wider font-bold" style={{ color: '#64748B' }}>GCP Telemetry</span>
            <div className="border rounded p-3 space-y-2 font-mono text-[9px]" style={{ backgroundColor: '#0D1517', borderColor: '#1A2629' }}>
              {[
                { k:'Cloud Run Instance', v:'ACTIVE', vc:'#00FFCC', ping:true },
                { k:'Container Build', v:'SUCCESS', vc:'#00FFCC', ping:false },
                { k:'Gemini API Load', v:'34.2k tokens/m', vc:'#FFCC00', ping:false },
                { k:'Agent Swarms', v:`${activeCount} parallel`, vc:'#F97316', ping:false },
              ].map(r => (
                <div key={r.k} className="flex justify-between items-center border-b pb-1.5 last:border-0 last:pb-0" style={{ borderColor: '#1A2629' }}>
                  <span style={{ color: '#64748B' }}>{r.k}:</span>
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
        style={{ borderColor: '#1A2629', backgroundColor: '#111A1C', height: devConsoleOpen ? '240px' : '44px' }}>
        <div onClick={() => setDevConsoleOpen(!devConsoleOpen)} className="px-4 h-11 flex items-center justify-between cursor-pointer border-b select-none" style={{ borderColor: '#1A2629', backgroundColor: '#0D1517' }}>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-white">
            <Terminal className="w-4 h-4" style={{ color: '#00FFCC' }}/>
            OPERATIONAL TELEMETRY // /DEV CONSOLE
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[8px] font-mono border px-1.5 py-0.5 rounded uppercase" style={{ borderColor: '#1A2629', color: '#64748B' }}>{devLogs.length} updates</span>
            <span className="text-xs font-mono font-bold" style={{ color: '#64748B' }}>{devConsoleOpen ? '▼' : '▲'}</span>
          </div>
        </div>
        <div className="flex-1 p-3 font-mono text-[9px] space-y-1.5 overflow-y-auto bg-black text-zinc-300">
          {devLogs.map((log, i) => (
            <div key={i} className="border-b border-zinc-950 pb-1">
              <span className="text-zinc-600 mr-2">[{log.time}]</span>
              <span style={{ color: log.msg.includes('✅') ? '#22C55E' : log.msg.includes('WEBHOOK') ? '#F97316' : '#00FFCC' }}>{log.msg}</span>
              {log.raw && <pre className="text-zinc-500 text-[8px] mt-0.5 pl-4 whitespace-pre-wrap">{log.raw.slice(0,200)}</pre>}
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
