import React, { useState, useEffect } from 'react';
import {
  Hammer, MapPin, CheckCircle2, Clock, Camera,
  AlertTriangle, Wrench, Zap, Droplets, Trees, Trash2, Users,
  PawPrint, Construction, X
} from 'lucide-react';
import { useZelus } from '../context/ZelusStateContext';
import type { Incident } from '../types';

function getCatColor(cat: string): string {
  const m: Record<string, string> = {
    'Road & Structural Damage': '#FFCC00',
    'Water Outage & Flooding': '#38BDF8',
    'Utility & Spark Hazard': '#FF3B30',
    'Stray Animal Welfare & Rescue': '#F97316',
    'Urban Forestry Protection': '#22C55E',
    'Sanitation Operations': '#EAB308',
    'Neighborhood Mediation': '#8B5CF6',
  };
  return m[cat] || 'var(--accent-cyan)';
}

function getCatIcon(cat: string): React.ReactNode {
  const m: Record<string, React.ReactNode> = {
    'Road & Structural Damage': <Construction className="w-3.5 h-3.5"/>,
    'Water Outage & Flooding': <Droplets className="w-3.5 h-3.5"/>,
    'Utility & Spark Hazard': <Zap className="w-3.5 h-3.5"/>,
    'Stray Animal Welfare & Rescue': <PawPrint className="w-3.5 h-3.5"/>,
    'Urban Forestry Protection': <Trees className="w-3.5 h-3.5"/>,
    'Sanitation Operations': <Trash2 className="w-3.5 h-3.5"/>,
    'Neighborhood Mediation': <Users className="w-3.5 h-3.5"/>,
  };
  return m[cat] || <AlertTriangle className="w-3.5 h-3.5"/>;
}

const EtaCountdown: React.FC<{ eta: number }> = ({ eta }) => {
  const [remaining, setRemaining] = useState(Math.max(0, eta - Date.now()));
  useEffect(() => {
    const iv = setInterval(() => setRemaining(Math.max(0, eta - Date.now())), 1000);
    return () => clearInterval(iv);
  }, [eta]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const overdue = remaining === 0;
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold" style={{ color: overdue ? '#FF3B30' : '#FFCC00' }}>
      <Clock className="w-3.5 h-3.5"/>
      {overdue ? 'OVERDUE' : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
    </div>
  );
};

const RoutingGrid: React.FC<{ incidents: Incident[] }> = ({ incidents }) => {
  const catColors: Record<string, string> = {
    'Road & Structural Damage': '#FFCC00',
    'Water Outage & Flooding': '#38BDF8',
    'Utility & Spark Hazard': '#FF3B30',
    'Stray Animal Welfare & Rescue': '#F97316',
    'Urban Forestry Protection': '#22C55E',
    'Sanitation Operations': '#EAB308',
    'Neighborhood Mediation': '#8B5CF6',
  };
  const active = incidents.filter(i => ['Bounty_Posted','Claimed_In_Progress'].includes(i.status));

  // Normalize geo coordinates to grid 0-100
  const lat0 = 17.445, latR = 0.01;
  const lng0 = 78.518, lngR = 0.012;
  const toXY = (lat: number, lng: number) => ({
    x: Math.max(5, Math.min(95, ((lng - lng0) / lngR) * 90 + 5)),
    y: Math.max(5, Math.min(95, 95 - ((lat - lat0) / latR) * 90)),
  });

  const legendCats = Array.from(new Set(active.map(i => i.category))).slice(0, 4);

  return (
    <div className="space-y-2 flex-1">
      <svg viewBox="0 0 200 160" className="w-full rounded-lg border transition-colors duration-300" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
        {/* Grid lines */}
        {Array.from({length:11},(_,i)=>(
          <g key={i}>
            <line x1={i*20} y1="0" x2={i*20} y2="160" stroke="var(--border-secondary)" strokeWidth="0.3" opacity="0.3"/>
            <line x1="0" y1={i*16} x2="200" y2={i*16} stroke="var(--border-secondary)" strokeWidth="0.3" opacity="0.3"/>
          </g>
        ))}
        {/* Road grid lines */}
        {[40,80,120,160].map(x=><line key={x} x1={x} y1="0" x2={x} y2="160" stroke="var(--border-secondary)" strokeWidth="0.6" opacity="0.6"/>)}
        {[32,64,96,128].map(y=><line key={y} x1="0" y1={y} x2="200" y2={y} stroke="var(--border-secondary)" strokeWidth="0.6" opacity="0.6"/>)}
        
        {/* Border */}
        <rect x="0" y="0" width="200" height="160" fill="none" stroke="var(--border-secondary)" strokeWidth="0.5"/>

        {/* Incident pins */}
        {active.map((inc) => {
          const geo = inc.geolocation || { lat: 17.4501, lng: 78.5252 };
          const { x, y } = toXY(geo.lat, geo.lng);
          const col = catColors[inc.category] || 'var(--accent-cyan)';
          const claimed = inc.status === 'Claimed_In_Progress';
          return (
            <g key={inc.id}>
              <circle cx={x} cy={y} r={claimed?3.5:3} fill={col} stroke={claimed?'#fff':'none'} strokeWidth="0.5" opacity="0.85"/>
              {claimed && <circle cx={x} cy={y} r="6" fill="none" stroke={col} strokeWidth="0.5" opacity="0.4">
                <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite"/>
              </circle>}
              <text x={x+4} y={y+3} fontSize="4" fill={col} opacity="0.8" fontFamily="monospace">
                {inc.id.split('-').pop()}
              </text>
            </g>
          );
        })}

        {/* Contractor position */}
        <g>
          <circle cx="100" cy="80" r="4" fill="rgba(10,70,228,0.2)" stroke="var(--accent-cyan)" strokeWidth="1"/>
          <circle cx="100" cy="80" r="2" fill="var(--accent-cyan)"/>
          <text x="103" y="78" fontSize="5" fill="var(--accent-cyan)" fontFamily="monospace" fontWeight="bold">YOU</text>
        </g>
      </svg>

      {/* Legend */}
      {legendCats.length > 0 && (
        <div className="flex flex-col gap-1 text-[9px] font-mono">
          {legendCats.map(cat => (
            <div key={cat} className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: catColors[cat] || 'var(--accent-cyan)' }} />
              {cat === 'Public Works Division' ? 'Public Works' : cat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ContractorDashboard: React.FC = () => {
  const { incidents, session, claimBounty, updateStage, submitProgress, addToast } = useZelus();

  const myIncidents = incidents.filter(i =>
    i.status === 'Claimed_In_Progress' && i.claimedBy === session?.username
  );
  const available = incidents.filter(i => i.status === 'Bounty_Posted');

  const [selectedJob, setSelectedJob] = useState<Incident | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleSubmit = (incId: string) => {
    submitProgress(incId, '/road_pothole.png');
    addToast(`📸 Field evidence committed for ${incId}. Peer consensus review initiated.`, 'info');
    setShowCamera(false);
  };

  const STAGES = ['Accepted', 'Dispatched', 'In-Review'] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1 min-h-[500px] text-[var(--text-primary)]">

      {/* LEFT — Available Assignments */}
      <div className="lg:col-span-4 border rounded-xl p-4 flex flex-col shadow-xl min-h-[500px] overflow-hidden transition-all duration-300" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
        <div className="border-b pb-3 mb-3" style={{ borderColor: 'var(--border-secondary)' }}>
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[var(--text-primary)] flex items-center gap-1.5">
            <Hammer className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }}/>
            Available Assignments
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{available.length} authorized bounties ready for dispatch.</p>
        </div>

        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {available.length === 0 ? (
            <div className="text-center py-12 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              No authorized bounties available.<br/>Check back after admin approves tickets.
            </div>
          ) : available.map(inc => {
            const catColor = getCatColor(inc.category);
            return (
              <div key={inc.id} className="border rounded-lg p-3 space-y-2.5 transition-all hover:scale-[1.01]" style={{ borderColor: 'var(--border-secondary)', borderLeftColor: catColor, borderLeftWidth: 3, backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: catColor }}>{getCatIcon(inc.category)}</span>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-primary)]">{inc.category === 'Public Works Division' ? 'Public Works' : inc.category}</p>
                      <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{inc.id}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0" style={{ borderColor: inc.severity==='Critical'?'var(--accent-red)':'var(--accent-amber)', color: inc.severity==='Critical'?'var(--accent-red)':'var(--accent-amber)' }}>
                    {inc.severity}
                  </span>
                </div>

                <p className="text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>{inc.description}</p>

                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <MapPin className="w-3.5 h-3.5"/>
                  <span className="text-[9px] font-mono truncate">{inc.location}</span>
                </div>

                {inc.materials && inc.materials.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[8px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Authorized Materials (BOM):</p>
                    <div className="flex flex-wrap gap-1">
                      {inc.materials.map((m, i) => (
                        <span key={i} className="text-[8px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: `${catColor}30`, color: catColor, backgroundColor: `${catColor}08` }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {inc.costBreakdown && (
                  <div className="flex items-center justify-between text-[9px] font-mono border-t pt-1.5" style={{ borderColor: 'var(--border-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Mat: ${inc.costBreakdown.materials} · Labor: ${inc.costBreakdown.labor}</span>
                    <span className="font-black text-[var(--accent-cyan)]">Total: ${inc.costBreakdown.total}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { claimBounty(inc.id); addToast(`🔧 Bounty ${inc.id} claimed! Dispatch timer started.`, 'success'); }}
                  className="w-full py-2 rounded border font-mono text-[9px] font-bold uppercase cursor-pointer transition-all bg-[var(--accent-cyan)] text-[var(--bg-primary)] border-[var(--accent-cyan)] hover:brightness-105"
                >
                  Claim Bounty →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER — Active Project Status Matrix */}
      <div className="lg:col-span-5 border rounded-xl p-4 shadow-xl min-h-[500px] transition-all duration-300" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
        <div className="border-b pb-3 mb-4" style={{ borderColor: 'var(--border-secondary)' }}>
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[var(--text-primary)] flex items-center gap-1.5">
            <Wrench className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
            Active Project Status Matrix
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{myIncidents.length} active project{myIncidents.length !== 1 ? 's' : ''} claimed.</p>
        </div>

        {myIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center space-y-3">
            <Hammer className="w-10 h-10 text-[var(--border-secondary)]" />
            <p className="text-[10px] font-mono max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
              Claim a bounty from the left panel to begin tracking your project workflow.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {myIncidents.map(inc => {
              const catColor = getCatColor(inc.category);
              const currentStageIdx = STAGES.indexOf(inc.contractorStage as typeof STAGES[number]);

              return (
                <div key={inc.id} className="rounded-lg border p-4 space-y-3 transition-all duration-300" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)', borderLeftColor: catColor, borderLeftWidth: 3 }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-[var(--text-primary)]">{inc.category === 'Public Works Division' ? 'Public Works' : inc.category}</p>
                      <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{inc.id} · {inc.location}</p>
                    </div>
                    {inc.etaTargetTime && <EtaCountdown eta={inc.etaTargetTime} />}
                  </div>

                  {/* Stage stepper */}
                  <div className="relative py-2">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 -z-0 bg-[var(--border-secondary)]" />
                      <div className="absolute left-0 top-1/2 h-px -translate-y-1/2 -z-0 transition-all duration-500 bg-[var(--accent-cyan)]"
                        style={{ width: currentStageIdx < 0 ? '0%' : currentStageIdx === 0 ? '0%' : currentStageIdx === 1 ? '50%' : '100%' }} />

                      {STAGES.map((stage, i) => {
                        const done = i <= currentStageIdx;
                        return (
                          <button key={stage} type="button"
                            onClick={() => updateStage(inc.id, stage)}
                            className="relative z-10 flex flex-col items-center gap-1 cursor-pointer">
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                              style={{ backgroundColor: done ? 'var(--accent-cyan)' : 'var(--bg-secondary)', borderColor: done ? 'var(--accent-cyan)' : 'var(--border-secondary)' }}>
                              {done && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--bg-primary)]"/>}
                            </div>
                            <span className="text-[8px] font-mono text-center leading-tight font-bold" style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{stage}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {inc.materials && inc.materials.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[8px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Allocated Materials:</p>
                      <div className="flex flex-wrap gap-1">
                        {inc.materials.map((m, i) => (
                          <span key={i} className="text-[8px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {inc.costBreakdown && (
                    <div className="flex items-center justify-between text-[9px] font-mono border-t pt-2 border-[var(--border-secondary)]">
                      <span style={{ color: 'var(--text-muted)' }}>Materials: ${inc.costBreakdown.materials} · Labor: ${inc.costBreakdown.labor}</span>
                      <span className="font-black text-[var(--accent-cyan)]">Total: ${inc.costBreakdown.total}</span>
                    </div>
                  )}

                  {inc.status !== 'Peer_Review' ? (
                    <button type="button"
                      onClick={() => { setSelectedJob(inc); setShowCamera(true); }}
                      className="w-full py-2 rounded border font-mono text-[9px] font-bold uppercase cursor-pointer transition-all hover:bg-cyan-500 hover:text-white"
                      style={{ backgroundColor: 'transparent', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
                      <Camera className="w-3.5 h-3.5 inline mr-1.5"/>
                      Submit Completion Evidence
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center text-[10px] font-mono rounded border" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)', backgroundColor: 'rgba(22,163,74,0.05)' }}>
                      ✓ PEER CONSENSUS REVIEW IN PROGRESS
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — Routing Grid */}
      <div className="lg:col-span-3 border rounded-xl p-4 flex flex-col shadow-xl min-h-[500px] transition-all duration-300" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
        <div className="border-b pb-3 mb-4" style={{ borderColor: 'var(--border-secondary)' }}>
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[var(--text-primary)] flex items-center gap-1.5">
            <MapPin className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }}/>
            Spatial Routing Grid
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Live pin map of active bounty nodes.</p>
        </div>
        <RoutingGrid incidents={incidents} />

        <div className="mt-4 space-y-2 border-t pt-3" style={{ borderColor: 'var(--border-secondary)' }}>
          {[
            { label:'Bounties Available', val:available.length, color:'var(--accent-cyan)' },
            { label:'Your Active Jobs', val:myIncidents.length, color:'var(--accent-amber)' },
            { label:'Peer Review', val:incidents.filter(i=>i.status==='Peer_Review').length, color:'var(--accent-purple)' },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-[10px] font-mono">
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span className="font-bold" style={{ color: r.color }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Camera Modal Fallback */}
      {showCamera && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="rounded-xl border p-5 w-full max-w-sm space-y-4 animate-fade-in" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-secondary)' }}>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">Submit Field Evidence</h3>
              <button onClick={() => setShowCamera(false)} className="p-1 rounded cursor-pointer hover:bg-white/5 text-[var(--text-muted)]">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="rounded-lg overflow-hidden border flex items-center justify-center bg-black" style={{ height: '140px', borderColor: 'var(--border-secondary)' }}>
              <div className="text-center space-y-2">
                <Camera className="w-8 h-8 mx-auto animate-pulse text-[#00FFCC]"/>
                <p className="text-[10px] font-mono text-zinc-400">Field Camera Simulation Active</p>
                <p className="text-[9px] font-mono text-zinc-500">[Capture Mode Ready]</p>
              </div>
            </div>
            <div className="text-[10px] font-mono p-3 rounded border space-y-1.5" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
              <div><span style={{ color:'var(--text-muted)' }}>Ticket:</span> <span className="text-[var(--text-primary)] font-bold">{selectedJob.id}</span></div>
              <div><span style={{ color:'var(--text-muted)' }}>Category:</span> <span className="text-[var(--text-primary)] font-bold">{selectedJob.category === 'Public Works Division' ? 'Public Works' : selectedJob.category}</span></div>
              <div><span style={{ color:'var(--text-muted)' }}>Location:</span> <span className="text-[var(--text-primary)] font-bold">{selectedJob.location}</span></div>
            </div>
            <button type="button" onClick={() => handleSubmit(selectedJob.id)}
              className="w-full py-2.5 rounded font-mono text-[10px] font-bold uppercase cursor-pointer bg-[var(--accent-cyan)] text-[var(--bg-primary)] hover:brightness-105"
            >
              Commit Evidence to Ledger →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
