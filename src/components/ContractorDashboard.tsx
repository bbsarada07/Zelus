import React, { useState, useEffect } from 'react';
import {
  Hammer, MapPin, CheckCircle2, Clock, Camera,
  AlertTriangle, Wrench, Zap, Droplets, Trees, Trash2, Users,
  PawPrint, Construction
} from 'lucide-react';
import { useZelus } from '../context/ZelusStateContext';
import type { Incident } from '../types';

// ── Category colors ────────────────────────────────────────────────────────
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
  return m[cat] || '#00FFCC';
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

// ── ETA countdown ──────────────────────────────────────────────────────────
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
    <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold" style={{ color: overdue ? '#FF3B30' : '#FFCC00' }}>
      <Clock className="w-3 h-3"/>
      {overdue ? 'OVERDUE' : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
    </div>
  );
};

// ── Routing grid SVG map ───────────────────────────────────────────────────
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

  // Normalize geo to grid 0-100
  const lat0 = 17.445, latR = 0.01;
  const lng0 = 78.518, lngR = 0.012;
  const toXY = (lat: number, lng: number) => ({
    x: Math.max(5, Math.min(95, ((lng - lng0) / lngR) * 90 + 5)),
    y: Math.max(5, Math.min(95, 95 - ((lat - lat0) / latR) * 90)),
  });

  const legendCats = Array.from(new Set(active.map(i => i.category))).slice(0, 4);

  return (
    <div className="space-y-2 flex-1">
      <svg viewBox="0 0 200 160" className="w-full rounded-lg border" style={{ borderColor: '#1A2629', backgroundColor: '#080D0E' }}>
        {/* Grid lines */}
        {Array.from({length:11},(_,i)=>(
          <g key={i}>
            <line x1={i*20} y1="0" x2={i*20} y2="160" stroke="rgba(0,255,204,0.04)" strokeWidth="0.5"/>
            <line x1="0" y1={i*16} x2="200" y2={i*16} stroke="rgba(0,255,204,0.04)" strokeWidth="0.5"/>
          </g>
        ))}
        {/* Road grid */}
        {[40,80,120,160].map(x=><line key={x} x1={x} y1="0" x2={x} y2="160" stroke="rgba(0,255,204,0.07)" strokeWidth="0.8"/>)}
        {[32,64,96,128].map(y=><line key={y} x1="0" y1={y} x2="200" y2={y} stroke="rgba(0,255,204,0.07)" strokeWidth="0.8"/>)}
        {/* Border */}
        <rect x="0" y="0" width="200" height="160" fill="none" stroke="rgba(0,255,204,0.12)" strokeWidth="0.5"/>

        {/* Incident pins */}
        {active.map((inc) => {
          const geo = inc.geolocation || { lat: 17.4501, lng: 78.5252 };
          const { x, y } = toXY(geo.lat, geo.lng);
          const col = catColors[inc.category] || '#00FFCC';
          const claimed = inc.status === 'Claimed_In_Progress';
          return (
            <g key={inc.id}>
              <circle cx={x} cy={y} r={claimed?3.5:3} fill={col} stroke={claimed?'#fff':'none'} strokeWidth="0.5" opacity="0.85"/>
              {claimed && <circle cx={x} cy={y} r="6" fill="none" stroke={col} strokeWidth="0.5" opacity="0.4">
                <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite"/>
              </circle>}
              <text x={x+4} y={y+3} fontSize="3.5" fill={col} opacity="0.7" fontFamily="monospace">
                {inc.id.split('-').pop()}
              </text>
            </g>
          );
        })}

        {/* Contractor position */}
        <g>
          <circle cx="100" cy="80" r="4" fill="rgba(0,255,204,0.2)" stroke="#00FFCC" strokeWidth="1"/>
          <circle cx="100" cy="80" r="2" fill="#00FFCC"/>
          <text x="103" y="78" fontSize="4" fill="#00FFCC" fontFamily="monospace">YOU</text>
        </g>
      </svg>

      {/* Legend */}
      {legendCats.length > 0 && (
        <div className="flex flex-col gap-1 text-[8px] font-mono">
          {legendCats.map(cat => (
            <div key={cat} className="flex items-center gap-1.5" style={{ color: '#64748B' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catColors[cat] || '#00FFCC' }} />
              {cat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main ContractorDashboard ───────────────────────────────────────────────
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
    addToast(`📸 Evidence submitted for ${incId}. Peer review initiated.`, 'info');
    setShowCamera(false);
  };

  const STAGES = ['Accepted', 'Dispatched', 'In-Review'] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1 min-h-[500px]">

      {/* LEFT — Available Assignments */}
      <div className="lg:col-span-4 border rounded-xl p-4 flex flex-col shadow-xl min-h-[500px] overflow-hidden" style={{ borderColor: '#1A2629', backgroundColor: '#111A1C' }}>
        <div className="border-b pb-3 mb-3" style={{ borderColor: '#1A2629' }}>
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
            <Hammer className="w-4 h-4" style={{ color: '#00FFCC' }}/>
            Available Assignments
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>{available.length} authorized bounties ready for dispatch.</p>
        </div>

        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {available.length === 0 ? (
            <div className="text-center py-12 text-[10px] font-mono" style={{ color: '#64748B' }}>
              No authorized bounties available.<br/>Check back after admin approves tickets.
            </div>
          ) : available.map(inc => {
            const catColor = getCatColor(inc.category);
            return (
              <div key={inc.id} className="border rounded-lg p-3 space-y-2.5 transition-all hover:border-cyan-500/30" style={{ borderColor: '#1A2629', borderLeftColor: catColor, borderLeftWidth: 3, backgroundColor: 'rgba(9,15,16,0.4)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: catColor }}>{getCatIcon(inc.category)}</span>
                    <div>
                      <p className="text-[10px] font-bold text-white">{inc.category}</p>
                      <p className="text-[8px] font-mono" style={{ color: '#64748B' }}>{inc.id}</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0" style={{ borderColor: inc.severity==='Critical'?'#FF3B30':'#FFCC00', color: inc.severity==='Critical'?'#FF3B30':'#FFCC00' }}>
                    {inc.severity}
                  </span>
                </div>

                <p className="text-[9px] leading-snug line-clamp-2" style={{ color: '#94A3B8' }}>{inc.description}</p>

                <div className="flex items-center gap-1.5" style={{ color: '#64748B' }}>
                  <MapPin className="w-3 h-3"/>
                  <span className="text-[8px] font-mono truncate">{inc.location}</span>
                </div>

                {/* BOM materials */}
                {inc.materials && inc.materials.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[7.5px] font-mono uppercase tracking-wider font-bold" style={{ color: '#64748B' }}>Authorized Materials (BOM):</p>
                    <div className="flex flex-wrap gap-1">
                      {inc.materials.map((m, i) => (
                        <span key={i} className="text-[7px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: `${catColor}30`, color: catColor, backgroundColor: `${catColor}08` }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost breakdown */}
                {inc.costBreakdown && (
                  <div className="flex items-center justify-between text-[8.5px] font-mono border-t pt-1.5" style={{ borderColor: '#1A2629' }}>
                    <span style={{ color: '#64748B' }}>Mat: ${inc.costBreakdown.materials} · Labor: ${inc.costBreakdown.labor}</span>
                    <span className="font-black" style={{ color: '#00FFCC' }}>Total: ${inc.costBreakdown.total}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { claimBounty(inc.id); addToast(`🔧 Bounty ${inc.id} claimed! Dispatch timer started.`, 'success'); }}
                  className="w-full py-2 rounded border font-mono text-[9px] font-bold uppercase cursor-pointer transition-all hover:brightness-110"
                  style={{ backgroundColor: 'rgba(0,255,204,0.08)', borderColor: 'rgba(0,255,204,0.3)', color: '#00FFCC' }}>
                  Claim Bounty →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER — Active Project Status Matrix */}
      <div className="lg:col-span-5 border rounded-xl p-4 shadow-xl min-h-[500px]" style={{ borderColor: '#1A2629', backgroundColor: '#111A1C' }}>
        <div className="border-b pb-3 mb-4" style={{ borderColor: '#1A2629' }}>
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
            <Wrench className="w-4 h-4" style={{ color: '#00FFCC' }} />
            Active Project Status Matrix
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>{myIncidents.length} active project{myIncidents.length !== 1 ? 's' : ''} claimed.</p>
        </div>

        {myIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center space-y-3">
            <Hammer className="w-10 h-10" style={{ color: '#1A2629' }}/>
            <p className="text-[10px] font-mono max-w-[200px]" style={{ color: '#64748B' }}>
              Claim a bounty from the left panel to begin tracking your project workflow.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {myIncidents.map(inc => {
              const catColor = getCatColor(inc.category);
              const currentStageIdx = STAGES.indexOf(inc.contractorStage as typeof STAGES[number]);

              return (
                <div key={inc.id} className="rounded-lg border p-4 space-y-3" style={{ borderColor: '#1A2629', backgroundColor: '#0D1517', borderLeftColor: catColor, borderLeftWidth: 3 }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-white">{inc.category}</p>
                      <p className="text-[8px] font-mono" style={{ color: '#64748B' }}>{inc.id} · {inc.location}</p>
                    </div>
                    {inc.etaTargetTime && <EtaCountdown eta={inc.etaTargetTime} />}
                  </div>

                  {/* Stage stepper */}
                  <div className="relative">
                    <div className="flex items-center justify-between relative">
                      {/* Progress line */}
                      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 -z-0" style={{ backgroundColor: '#1A2629' }} />
                      <div className="absolute left-0 top-1/2 h-px -translate-y-1/2 -z-0 transition-all duration-500"
                        style={{ backgroundColor: '#00FFCC', width: currentStageIdx < 0 ? '0%' : currentStageIdx === 0 ? '0%' : currentStageIdx === 1 ? '50%' : '100%' }} />

                      {STAGES.map((stage, i) => {
                        const done = i <= currentStageIdx;
                        return (
                          <button key={stage} type="button"
                            onClick={() => updateStage(inc.id, stage)}
                            className="relative z-10 flex flex-col items-center gap-1 cursor-pointer">
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                              style={{ backgroundColor: done ? '#00FFCC' : '#0D1517', borderColor: done ? '#00FFCC' : '#1A2629', boxShadow: done ? '0 0 8px rgba(0,255,204,0.5)' : 'none' }}>
                              {done && <CheckCircle2 className="w-3 h-3 text-zinc-950"/>}
                            </div>
                            <span className="text-[7.5px] font-mono text-center leading-tight" style={{ color: done ? '#00FFCC' : '#64748B' }}>{stage}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Allocated Materials */}
                  {inc.materials && inc.materials.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[7.5px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Allocated Materials:</p>
                      <div className="flex flex-wrap gap-1">
                        {inc.materials.map((m, i) => (
                          <span key={i} className="text-[7px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: '#1A2629', color: '#94A3B8' }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cost */}
                  {inc.costBreakdown && (
                    <div className="flex items-center justify-between text-[8.5px] font-mono border-t pt-2" style={{ borderColor: '#1A2629' }}>
                      <span style={{ color: '#64748B' }}>Materials: ${inc.costBreakdown.materials} · Labor: ${inc.costBreakdown.labor}</span>
                      <span className="font-black" style={{ color: '#00FFCC' }}>Total: ${inc.costBreakdown.total}</span>
                    </div>
                  )}

                  {/* Submit Evidence */}
                  {inc.status !== 'Peer_Review' ? (
                    <button type="button"
                      onClick={() => { setSelectedJob(inc); setShowCamera(true); }}
                      className="w-full py-2 rounded border font-mono text-[9px] font-bold uppercase cursor-pointer transition-all hover:brightness-110 flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: 'rgba(0,255,204,0.05)', borderColor: 'rgba(0,255,204,0.2)', color: '#00FFCC' }}>
                      <Camera className="w-3.5 h-3.5"/>
                      Submit Completion Evidence
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center text-[9px] font-mono rounded border" style={{ borderColor: '#22C55E', color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.05)' }}>
                      ✓ PEER REVIEW IN PROGRESS
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — Routing Grid */}
      <div className="lg:col-span-3 border rounded-xl p-4 flex flex-col shadow-xl min-h-[500px]" style={{ borderColor: '#1A2629', backgroundColor: '#111A1C' }}>
        <div className="border-b pb-3 mb-4" style={{ borderColor: '#1A2629' }}>
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
            <MapPin className="w-4 h-4" style={{ color: '#00FFCC' }}/>
            Spatial Routing Grid
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>Live pin map of active bounty nodes.</p>
        </div>
        <RoutingGrid incidents={incidents} />

        {/* Status summary */}
        <div className="mt-4 space-y-2 border-t pt-3" style={{ borderColor: '#1A2629' }}>
          {[
            { label:'Bounties Available', val:available.length, color:'#00FFCC' },
            { label:'Your Active Jobs', val:myIncidents.length, color:'#FFCC00' },
            { label:'Peer Review', val:incidents.filter(i=>i.status==='Peer_Review').length, color:'#8B5CF6' },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-[9px] font-mono">
              <span style={{ color: '#64748B' }}>{r.label}</span>
              <span className="font-bold" style={{ color: r.color }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Camera Modal */}
      {showCamera && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="rounded-xl border p-5 w-full max-w-sm space-y-4 animate-fade-in" style={{ backgroundColor: '#111A1C', borderColor: 'rgba(0,255,204,0.3)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Submit Field Evidence</h3>
              <button onClick={() => setShowCamera(false)} className="p-1 rounded cursor-pointer hover:bg-white/5" style={{ color: '#64748B' }}>
                <CheckCircle2 className="w-4 h-4"/>
              </button>
            </div>
            <div className="rounded-lg overflow-hidden border flex items-center justify-center" style={{ height: '140px', backgroundColor: '#060B0C', borderColor: '#1A2629' }}>
              <div className="text-center space-y-2">
                <Camera className="w-8 h-8 mx-auto animate-pulse" style={{ color: '#00FFCC' }}/>
                <p className="text-[9px] font-mono" style={{ color: '#64748B' }}>Field Camera Simulation Active</p>
                <p className="text-[8px] font-mono" style={{ color: '#64748B' }}>[Capture Mode Ready]</p>
              </div>
            </div>
            <div className="text-[9px] font-mono p-3 rounded border space-y-1" style={{ borderColor: '#1A2629', backgroundColor: '#0D1517' }}>
              <div><span style={{ color:'#64748B' }}>Ticket:</span> <span className="text-white">{selectedJob.id}</span></div>
              <div><span style={{ color:'#64748B' }}>Category:</span> <span className="text-white">{selectedJob.category}</span></div>
              <div><span style={{ color:'#64748B' }}>Location:</span> <span className="text-white">{selectedJob.location}</span></div>
            </div>
            <button type="button" onClick={() => handleSubmit(selectedJob.id)}
              className="w-full py-2.5 rounded font-mono text-[10px] font-bold uppercase cursor-pointer"
              style={{ backgroundColor: '#00FFCC', color: '#090F10' }}>
              Commit Evidence to Ledger →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
