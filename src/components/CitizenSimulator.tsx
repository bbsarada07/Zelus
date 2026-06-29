import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Award, PlusCircle, X, Mic,
  MapPin, MicOff, ChevronDown, RotateCcw,
  PawPrint, Trees, Trash2, Users, Zap, Droplets, Construction,
  ThumbsUp, Clock
} from 'lucide-react';
import { useZelus } from '../context/ZelusStateContext';
import { MunicipalTrustMatrix } from './MunicipalTrustMatrix';
import type { IncidentCategory } from '../types';

// ── Category metadata ──────────────────────────────────────────────────────
const CATEGORIES: { label: IncidentCategory; icon: React.ReactNode; color: string; preset?: string }[] = [
  { label: 'Road & Structural Damage',    icon: <Construction className="w-3.5 h-3.5"/>, color: '#FFCC00', preset: 'pothole.png' },
  { label: 'Water Outage & Flooding',     icon: <Droplets className="w-3.5 h-3.5"/>,    color: '#38BDF8', preset: 'leak_burst.png' },
  { label: 'Utility & Spark Hazard',      icon: <Zap className="w-3.5 h-3.5"/>,         color: '#FF3B30', preset: 'trash_heap.png' },
  { label: 'Stray Animal Welfare & Rescue', icon: <PawPrint className="w-3.5 h-3.5"/>, color: '#F97316' },
  { label: 'Urban Forestry Protection',   icon: <Trees className="w-3.5 h-3.5"/>,       color: '#22C55E' },
  { label: 'Sanitation Operations',       icon: <Trash2 className="w-3.5 h-3.5"/>,      color: '#EAB308' },
  { label: 'Neighborhood Mediation',      icon: <Users className="w-3.5 h-3.5"/>,       color: '#8B5CF6' },
];

const LANGUAGES = ['Telugu', 'Spanish', 'Hindi', 'Mandarin', 'Arabic', 'French', 'Tamil'];

const TRANSLATIONS: Record<string, string> = {
  Telugu:   'There is significant structural damage to the road surface at this location. Large cracks and loose gravel are creating hazardous conditions for pedestrians and vehicles. Immediate repair intervention is urgently required.',
  Spanish:  'There is significant structural damage to the road surface at this location. Multiple cracks and unstable surface material are creating a dangerous hazard for all public transit. Immediate remediation action is requested.',
  Hindi:    'At the reported GPS coordinates, the public infrastructure asset shows visible deterioration. Water pooling and surface displacement indicate critical wear beyond normal maintenance thresholds. Urgent dispatch recommended.',
  Mandarin: 'This civic report documents observable degradation of a municipal infrastructure node. The damage severity classification warrants priority dispatch of a qualified maintenance team for immediate assessment and remediation.',
  Arabic:   'A formal infrastructure failure has been detected at the stated location. Citizens in the surrounding zone have confirmed the hazard. Emergency repair dispatch is requested through the ZELUS civic automation pipeline.',
  French:   'The road infrastructure at this location is in critical disrepair. Evidence of structural failure, including surface cracking and material displacement, has been documented. Immediate civic repair action is urgently warranted.',
  Tamil:    'A serious public infrastructure issue has been recorded at the specified coordinates. The damage poses immediate risk to pedestrian safety and requires priority maintenance dispatch through the civic response system.',
};

// ── Camera scene presets ───────────────────────────────────────────────────
type ScenePreset = 'pothole.png' | 'leak_burst.png' | 'trash_heap.png';

function drawScene(canvas: HTMLCanvasElement, preset: ScenePreset) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;

  if (preset === 'pothole.png') {
    // Dark road surface with pothole
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, W, H);
    // Road lines
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
    ctx.setLineDash([]);
    // Pothole
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.ellipse(W*0.45, H*0.55, 52, 38, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,204,0,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(W*0.45, H*0.55, 52, 38, 0.3, 0, Math.PI*2); ctx.stroke();
    // Cracks
    ctx.strokeStyle = '#FFCC00'; ctx.lineWidth = 1;
    [[W*0.35,H*0.45],[W*0.3,H*0.4],[W*0.5,H*0.65],[W*0.55,H*0.7]].forEach(([x,y],i) => {
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+(i%2?20:-15),y+(i>1?20:-18)); ctx.stroke();
    });
    // HUD label
    ctx.fillStyle = 'rgba(255,204,0,0.85)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('[ VISION: POTHOLE DETECTED ]', 10, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '8px monospace';
    ctx.fillText('CLASS: STRUCTURAL_DAMAGE | CONF: 97.2%', 10, H-10);

  } else if (preset === 'leak_burst.png') {
    // Blue/teal flooded scene
    ctx.fillStyle = '#071420';
    ctx.fillRect(0, 0, W, H);
    // Water gradient
    const grd = ctx.createLinearGradient(0, H*0.4, 0, H);
    grd.addColorStop(0, 'rgba(56,189,248,0.3)');
    grd.addColorStop(1, 'rgba(56,189,248,0.7)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, H*0.4, W, H*0.6);
    // Water ripples
    ctx.strokeStyle = 'rgba(56,189,248,0.6)'; ctx.lineWidth = 1.5;
    [0.5,0.6,0.7,0.8].forEach((frac, i) => {
      ctx.beginPath();
      ctx.ellipse(W*(0.3+i*0.1), H*frac, 30+i*15, 8, 0, 0, Math.PI*2);
      ctx.stroke();
    });
    // Burst pipe indicator
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(W*0.25, H*0.2, 20, H*0.25);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(W*0.22, H*0.2, 26, 8);
    // Water spray
    ctx.fillStyle = 'rgba(56,189,248,0.5)';
    for(let i=0;i<30;i++){
      ctx.beginPath();
      ctx.arc(W*0.35+Math.random()*60-30, H*0.25+Math.random()*80, 2, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(56,189,248,0.85)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('[ VISION: WATER BURST DETECTED ]', 10, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '8px monospace';
    ctx.fillText('CLASS: WATER_FLOODING | CONF: 99.1%', 10, H-10);

  } else {
    // Waste/trash heap
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, W, H);
    // Waste pile
    ctx.fillStyle = '#3a2e1a';
    ctx.beginPath();
    ctx.moveTo(W*0.1, H*0.85);
    ctx.lineTo(W*0.25, H*0.45);
    ctx.lineTo(W*0.5, H*0.35);
    ctx.lineTo(W*0.75, H*0.48);
    ctx.lineTo(W*0.9, H*0.85);
    ctx.closePath(); ctx.fill();
    // Trash items
    const trashColors = ['#4a3728','#2e4a2e','#4a4a1e'];
    for(let i=0;i<12;i++){
      ctx.fillStyle = trashColors[i%3];
      ctx.fillRect(W*(0.15+i*0.06)+Math.random()*10-5, H*(0.5+Math.random()*0.25), 18+Math.random()*15, 10+Math.random()*20);
    }
    ctx.fillStyle = 'rgba(234,179,8,0.85)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('[ VISION: WASTE DUMP DETECTED ]', 10, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '8px monospace';
    ctx.fillText('CLASS: SANITATION_HAZARD | CONF: 96.8%', 10, H-10);
  }

  // Crosshair overlay
  ctx.strokeStyle = 'rgba(0,255,204,0.6)'; ctx.lineWidth = 1;
  ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
  ctx.setLineDash([]);
  // Corner targets
  [[0,0],[W,0],[0,H],[W,H]].forEach(([cx,cy]) => {
    const dx = cx === 0 ? 1 : -1, dy = cy === 0 ? 1 : -1;
    ctx.strokeStyle = '#00FFCC'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx+dx*6,cy); ctx.lineTo(cx+dx*20,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy+dy*6); ctx.lineTo(cx,cy+dy*20); ctx.stroke();
  });

  // Grid scan lines
  ctx.strokeStyle = 'rgba(0,255,204,0.04)'; ctx.lineWidth = 1;
  for(let y=0;y<H;y+=4){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
}

// ── Category color helper ──────────────────────────────────────────────────
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
  return map[cat] || null;
}

// ── Main component ─────────────────────────────────────────────────────────
export const CitizenSimulator: React.FC = () => {
  const {
    incidents, session, addIncident, upvoteIncident,
    updateKarma, confirmResolution, sectorGrades, trustScore, addToast
  } = useZelus();

  // Tabs
  const [activeTab, setActiveTab] = useState<'feed' | 'report' | 'ledger'>('feed');

  // ── Form state ──
  const [reportCategory, setReportCategory] = useState<IncidentCategory>('Road & Structural Damage');
  const [reportLocation, setReportLocation] = useState('GPS Acquiring...');
  const [reportX, setReportX] = useState(48.2);
  const [reportY, setReportY] = useState(61.9);
  const [reportNotes, setReportNotes] = useState('');
  const [reportSeverity, setReportSeverity] = useState<'Critical' | 'Moderate' | 'Low'>('Moderate');
  const [languageBadge, setLanguageBadge] = useState<string | null>(null);

  // ── Geolocation ──
  const [geoCoords, setGeoCoords] = useState<{lat:number;lng:number}|null>(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setReportX(parseFloat((35 + Math.abs((pos.coords.longitude * 100) % 40)).toFixed(1)));
          setReportY(parseFloat((35 + Math.abs((pos.coords.latitude * 100) % 40)).toFixed(1)));
          setReportLocation(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
        },
        () => {
          setReportLocation('17.4501°N, 78.5252°E (Simulated)');
          setGeoCoords({ lat: 17.4501, lng: 78.5252 });
        }
      );
    }
  }, []);

  // ── Camera simulation ──
  const [cameraActive, setCameraActive] = useState(false);
  const [activeScene, setActiveScene] = useState<ScenePreset | null>(null);
  const [scanningScene, setScanningScene] = useState(false);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activateCamera = () => { setCameraActive(true); setActiveScene(null); };
  const selectScene = (preset: ScenePreset) => {
    setActiveScene(preset);
    setScanningScene(true);
    setTimeout(() => {
      setScanningScene(false);
      if (cameraCanvasRef.current) drawScene(cameraCanvasRef.current, preset);
    }, 800);
  };

  useEffect(() => {
    if (cameraActive && !activeScene && cameraCanvasRef.current) {
      const canvas = cameraCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#060B0C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(0,255,204,0.4)'; ctx.lineWidth = 1;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(canvas.width/2,0); ctx.lineTo(canvas.width/2,canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,canvas.height/2); ctx.lineTo(canvas.width,canvas.height/2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#00FFCC'; ctx.lineWidth = 2;
      const cx=canvas.width/2, cy=canvas.height/2;
      [[cx-50,cy-35],[cx+50,cy-35],[cx-50,cy+35],[cx+50,cy+35]].forEach(([x,y]) => {
        const dx = x<cx?1:-1, dy = y<cy?1:-1;
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+dx*12,y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+dy*12); ctx.stroke();
      });
      ctx.fillStyle = 'rgba(0,255,204,0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ SELECT SCENE PRESET BELOW ]', canvas.width/2, canvas.height-10);
      ctx.textAlign = 'left';
    }
  }, [cameraActive, activeScene]);

  // ── Audio/recording ──
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('Telugu');
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const recordTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setTranscriptText('');
    recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setTranscribing(true);
    setLanguageBadge(selectedLanguage);
    setTimeout(() => {
      setTranscribing(false);
      setTranscriptText((TRANSLATIONS[selectedLanguage] || TRANSLATIONS.Telugu) +
        '\n\n[ AUDIO SOURCE LOCALIZED -> TRANSLATED EN-US ACCURACY: 98.4% ]');
      setReportNotes((TRANSLATIONS[selectedLanguage] || TRANSLATIONS.Telugu));
    }, 1800);
  };

  useEffect(() => () => { if (recordTimerRef.current) clearInterval(recordTimerRef.current); }, []);

  // ── Submit state machine ──
  type SubmitPhase = 'form' | 'processing' | 'success';
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('form');
  const [processingStep, setProcessingStep] = useState(0);
  const [generatedId, setGeneratedId] = useState('');
  const [karmaTransactions, setKarmaTransactions] = useState<Array<{id:string;msg:string;xp:string;time:string}>>([]);

  const PROCESSING_STEPS = [
    'PARSING GEOMETRIC DATA...',
    'VALIDATING EXIF SIGNATURES...',
    'GENERATING IMMUTABLE LEDGER ENTITY...',
    'DISPATCHING SWARM CONTEXT...',
    'COMMITTING TO TRIAGE LEDGER...',
  ];

  const handleSubmit = useCallback(() => {
    if (!reportNotes && !transcriptText) return;
    setSubmitPhase('processing');
    setProcessingStep(0);

    let step = 0;
    const iv = setInterval(() => {
      step++;
      setProcessingStep(step);
      if (step >= PROCESSING_STEPS.length) {
        clearInterval(iv);
        const newId = `INC-2026-${Math.floor(Math.random()*9000+1000)}-ZELUS`;
        setGeneratedId(newId);


        addIncident({
          category: reportCategory,
          location: reportLocation,
          coordinates: [reportX, reportY],
          severity: reportSeverity,
          status: 'Triage',
          upvotes: 1,
          description: reportNotes || transcriptText,
          languageBadge: languageBadge,
          image: activeScene ? `/${activeScene}` : '/road_pothole.png',
          notes: reportNotes || transcriptText,
          geolocation: geoCoords || { lat: 17.4501, lng: 78.5252 },
          exifVerified: !!activeScene,
          hash: `0x${Array.from({length:16},()=>Math.floor(Math.random()*16).toString(16)).join('').toUpperCase()}`,
          materials: [],
        });

        updateKarma(10);
        setKarmaTransactions(p => [{
          id: `KT-${Date.now()}`,
          msg: `Civic ticket ${newId} filed`,
          xp: '+10 XP',
          time: new Date().toLocaleTimeString(),
        }, ...p]);

        addToast('✅ Civic ticket submitted! +10 Karma XP awarded.', 'success');
        setTimeout(() => setSubmitPhase('success'), 200);
      }
    }, 380);
  }, [reportNotes, transcriptText, reportCategory, reportLocation, reportX, reportY, reportSeverity, languageBadge, activeScene, geoCoords, addIncident, updateKarma, addToast]);

  const resetForm = () => {
    setSubmitPhase('form');
    setReportNotes('');
    setTranscriptText('');
    setCameraActive(false);
    setActiveScene(null);
    setLanguageBadge(null);
    setIsRecording(false);
    setRecordingTime(0);
    setReportCategory('Road & Structural Damage');
    setReportSeverity('Moderate');
  };

  // ── Feed / marketplace incidents ──
  const feedIncidents = incidents.slice(0, 15);
  const reviewable = incidents.filter(i => i.status === 'Peer_Review');

  // ── Status badge renderer ──
  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, [string, string]> = {
      'Triage': ['#FFCC00', 'rgba(255,204,0,0.1)'],
      'Bounty_Posted': ['#00FFCC', 'rgba(0,255,204,0.1)'],
      'Claimed_In_Progress': ['#F97316', 'rgba(249,115,22,0.1)'],
      'Peer_Review': ['#8B5CF6', 'rgba(139,92,246,0.1)'],
      'Resolved': ['#22C55E', 'rgba(34,197,94,0.1)'],
    };
    const [color, bg] = map[status] || ['#64748B', 'rgba(100,116,139,0.1)'];
    return (
      <span className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded border" style={{ color, backgroundColor: bg, borderColor: `${color}40` }}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#090F10' }}>

      {/* ── Tab content area ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══ FEED TAB ═══════════════════════════════════════════════════ */}
        {activeTab === 'feed' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">Live Civic Feed</h3>
              <span className="text-[8px] font-mono" style={{ color: '#64748B' }}>{feedIncidents.length} active tickets</span>
            </div>

            {/* Peer review section */}
            {reviewable.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2" style={{ backgroundColor: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.25)' }}>
                <p className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>
                  🗳 Consensus Vote Required ({reviewable.length})
                </p>
                {reviewable.map(inc => {
                  const alreadyVoted = (inc.verifications||[]).some(v => v.name === session?.username);
                  const voteCount = (inc.verifications||[]).length;
                  return (
                    <div key={inc.id} className="rounded border p-2.5 space-y-2" style={{ borderColor: 'rgba(139,92,246,0.2)', backgroundColor: 'rgba(9,15,16,0.5)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[9px] font-bold text-white">{inc.category}</p>
                          <p className="text-[8px] font-mono" style={{ color: '#64748B' }}>{inc.location}</p>
                        </div>
                        <StatusBadge status={inc.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono" style={{ color: '#64748B' }}>
                          {voteCount}/3 confirmations
                        </span>
                        <button
                          disabled={alreadyVoted}
                          onClick={() => {
                            if (!alreadyVoted && session) {
                              confirmResolution(inc.id, {
                                name: session.username,
                                timestamp: new Date().toISOString(),
                                photo: '/road_pothole.png',
                              });
                              updateKarma(15);
                            }
                          }}
                          className="text-[8px] font-mono font-bold px-2 py-1 rounded border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          style={{
                            color: alreadyVoted ? '#64748B' : '#8B5CF6',
                            borderColor: alreadyVoted ? '#1A2629' : 'rgba(139,92,246,0.4)',
                            backgroundColor: alreadyVoted ? 'transparent' : 'rgba(139,92,246,0.08)',
                          }}
                        >
                          {alreadyVoted ? '✓ Voted' : 'Confirm Resolved +15 XP'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feed cards */}
            {feedIncidents.map(inc => {
              const color = getCatColor(inc.category);
              return (
                <div key={inc.id} className="rounded-lg border p-3 space-y-2" style={{ backgroundColor: '#111A1C', borderColor: '#1A2629', borderLeftColor: color, borderLeftWidth: 3 }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span style={{ color }}>{getCatIcon(inc.category)}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">{inc.category}</p>
                        <p className="text-[8px] font-mono truncate" style={{ color: '#64748B' }}>
                          <MapPin className="w-2.5 h-2.5 inline mr-0.5"/>{inc.location}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="text-[9px] leading-relaxed line-clamp-2" style={{ color: '#94A3B8' }}>{inc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono" style={{ color: '#64748B' }}>{inc.timestamp}</span>
                    <button
                      onClick={() => { upvoteIncident(inc.id); updateKarma(2); }}
                      className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded border cursor-pointer hover:bg-white/5 transition-all"
                      style={{ borderColor: '#1A2629', color: '#64748B' }}
                    >
                      <ThumbsUp className="w-2.5 h-2.5"/>
                      {inc.upvotes}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ REPORT TAB ═════════════════════════════════════════════════ */}
        {activeTab === 'report' && (
          <div className="p-3">
            {/* Processing state */}
            {submitPhase === 'processing' && (
              <div className="flex flex-col items-center justify-center min-h-[380px] space-y-6 animate-fade-in">
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#00FFCC', borderTopColor: 'transparent' }} />
                <div className="space-y-2 w-full max-w-[280px]">
                  {PROCESSING_STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < processingStep ? 'bg-green-400' : i === processingStep ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-800'}`} />
                      <span className={`text-[9px] font-mono ${i < processingStep ? 'line-through' : ''}`}
                        style={{ color: i < processingStep ? '#22C55E' : i === processingStep ? '#00FFCC' : '#374151' }}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success state */}
            {submitPhase === 'success' && (
              <div className="flex flex-col items-center justify-center min-h-[420px] space-y-5 text-center animate-fade-in p-4">
                {/* Animated checkmark */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center relative" style={{ backgroundColor: 'rgba(0,255,204,0.08)', border: '2px solid rgba(0,255,204,0.4)' }}>
                  <svg viewBox="0 0 60 60" className="w-12 h-12">
                    <path d="M12 30 L24 42 L48 18" fill="none" stroke="#00FFCC" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                      className="animate-checkmark" style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,204,0.8))' }} />
                  </svg>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: '#00FFCC' }}>
                    Ticket Registered Successfully
                  </p>
                  <div className="text-[11px] font-black font-mono text-white py-1 px-3 rounded-lg border" style={{ backgroundColor: 'rgba(0,255,204,0.06)', borderColor: 'rgba(0,255,204,0.3)' }}>
                    {generatedId}
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-2 w-full max-w-[280px] text-left"
                  style={{ backgroundColor: 'rgba(9,15,16,0.8)', borderColor: '#1A2629' }}>
                  <p className="text-[9px] leading-relaxed" style={{ color: '#94A3B8' }}>
                    Your civic ticket has been successfully registered onto the Triage Ledger. Citizen tracking metrics updated.
                  </p>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold" style={{ color: '#00FFCC' }}>
                    <Award className="w-3.5 h-3.5"/>
                    +10 Civic Karma points assigned
                  </div>
                  <div className="text-[8px] font-mono" style={{ color: '#64748B' }}>
                    Status: <span style={{ color: '#FFCC00' }}>TRIAGE</span> → Pending admin authorization
                  </div>
                </div>

                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider cursor-pointer transition-all"
                  style={{ backgroundColor: '#00FFCC', color: '#090F10' }}
                >
                  <RotateCcw className="w-3.5 h-3.5"/>
                  Return to Citizen Console
                </button>
              </div>
            )}

            {/* Form state */}
            {submitPhase === 'form' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">File Civic Report</h3>
                  <span className="text-[8px] font-mono" style={{ color: '#64748B' }}>
                    {geoCoords ? '📍 GPS Locked' : '📡 Acquiring...'}
                  </span>
                </div>

                {/* Category selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Category</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setReportCategory(cat.label)}
                        className="flex items-center gap-1.5 p-2 rounded-lg border text-left cursor-pointer transition-all"
                        style={{
                          borderColor: reportCategory === cat.label ? cat.color : '#1A2629',
                          backgroundColor: reportCategory === cat.label ? `${cat.color}12` : 'transparent',
                          color: reportCategory === cat.label ? cat.color : '#64748B',
                        }}
                      >
                        {cat.icon}
                        <span className="text-[8px] font-mono font-bold leading-tight">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Severity</label>
                  <div className="flex gap-2">
                    {(['Critical', 'Moderate', 'Low'] as const).map(sev => {
                      const cols = { Critical: '#FF3B30', Moderate: '#FFCC00', Low: '#22C55E' };
                      const active = reportSeverity === sev;
                      return (
                        <button key={sev} type="button" onClick={() => setReportSeverity(sev)}
                          className="flex-1 py-1.5 rounded border text-[9px] font-mono font-bold cursor-pointer transition-all"
                          style={{ borderColor: active ? cols[sev] : '#1A2629', backgroundColor: active ? `${cols[sev]}12` : 'transparent', color: active ? cols[sev] : '#64748B' }}>
                          {sev}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Location</label>
                  <input
                    value={reportLocation}
                    onChange={e => setReportLocation(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-[10px] font-mono bg-transparent text-white outline-none"
                    style={{ borderColor: '#1A2629' }}
                  />
                </div>

                {/* Camera simulation */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Visual Evidence</label>
                  {!cameraActive ? (
                    <button type="button" onClick={activateCamera}
                      className="w-full py-4 rounded-lg border border-dashed flex flex-col items-center gap-1.5 cursor-pointer transition-all hover:bg-white/5"
                      style={{ borderColor: '#1A2629', color: '#64748B' }}>
                      <Camera className="w-5 h-5 animate-pulse" style={{ color: '#00FFCC' }} />
                      <span className="text-[9px] font-mono">Connect Hardware Camera</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden" style={{ height: '140px', backgroundColor: '#060B0C' }}>
                        {scanningScene && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                            <div className="text-[9px] font-mono animate-pulse" style={{ color: '#00FFCC' }}>
                              ▶ VISION AI PROCESSING...
                            </div>
                          </div>
                        )}
                        <canvas ref={cameraCanvasRef} width={300} height={140} className="w-full h-full" />
                        <button type="button" onClick={() => { setCameraActive(false); setActiveScene(null); }}
                          className="absolute top-2 right-2 p-1 rounded bg-black/60 cursor-pointer" style={{ color: '#64748B' }}>
                          <X className="w-3 h-3"/>
                        </button>
                      </div>
                      {/* Scene presets */}
                      <div className="flex gap-1.5">
                        {(['pothole.png', 'leak_burst.png', 'trash_heap.png'] as ScenePreset[]).map(preset => (
                          <button key={preset} type="button" onClick={() => selectScene(preset)}
                            className="flex-1 py-1.5 rounded border text-[8px] font-mono cursor-pointer transition-all"
                            style={{
                              borderColor: activeScene === preset ? '#00FFCC' : '#1A2629',
                              backgroundColor: activeScene === preset ? 'rgba(0,255,204,0.08)' : 'transparent',
                              color: activeScene === preset ? '#00FFCC' : '#64748B',
                            }}>
                            [ {preset} ]
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio + Translation */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Audio Note + Localization</label>

                  {/* Language selector */}
                  <div className="relative">
                    <select
                      value={selectedLanguage}
                      onChange={e => setSelectedLanguage(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-[10px] font-mono bg-transparent text-white outline-none appearance-none cursor-pointer"
                      style={{ borderColor: '#1A2629', backgroundColor: '#111A1C' }}
                    >
                      {LANGUAGES.map(l => <option key={l} value={l} style={{ backgroundColor: '#111A1C' }}>{l}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#64748B' }} />
                  </div>

                  {/* Record button + waveform */}
                  {!transcribing ? (
                    <button type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className="w-full py-3 rounded-lg border flex items-center justify-center gap-3 cursor-pointer transition-all"
                      style={{
                        borderColor: isRecording ? '#FF3B30' : '#1A2629',
                        backgroundColor: isRecording ? 'rgba(255,59,48,0.06)' : 'transparent',
                      }}>
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 flex-shrink-0" style={{ color: '#FF3B30' }} />
                          {/* Waveform bars */}
                          <div className="flex items-end gap-[2px] h-6">
                            {Array.from({length:10},(_,i)=>(
                              <div key={i} className={`w-[3px] rounded-full bg-current wave-b${i+1}`}
                                style={{ color: '#FF3B30', minHeight: '4px' }} />
                            ))}
                          </div>
                          <span className="text-[9px] font-mono text-white">
                            {String(Math.floor(recordingTime/60)).padStart(2,'0')}:{String(recordingTime%60).padStart(2,'0')}
                          </span>
                          <span className="text-[8px] font-mono" style={{ color: '#FF3B30' }}>Stop</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" style={{ color: '#00FFCC' }} />
                          <span className="text-[9px] font-mono" style={{ color: '#64748B' }}>Record Audio Note ({selectedLanguage})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-lg border" style={{ borderColor: '#1A2629', backgroundColor: 'rgba(0,255,204,0.04)' }}>
                      <div className="w-3 h-3 rounded-full animate-spin border border-t-transparent" style={{ borderColor: '#00FFCC', borderTopColor: 'transparent' }} />
                      <span className="text-[9px] font-mono animate-pulse" style={{ color: '#00FFCC' }}>
                        Localizing {selectedLanguage} → EN-US...
                      </span>
                    </div>
                  )}

                  {/* Transcript output */}
                  {transcriptText && (
                    <div className="rounded-lg border p-2.5 space-y-1.5" style={{ borderColor: 'rgba(0,255,204,0.2)', backgroundColor: 'rgba(0,255,204,0.03)' }}>
                      <p className="text-[8px] font-mono font-bold" style={{ color: '#00FFCC' }}>Translated Observational Transcript:</p>
                      <p className="text-[8.5px] leading-relaxed whitespace-pre-wrap" style={{ color: '#94A3B8' }}>{transcriptText}</p>
                      {languageBadge && (
                        <span className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block" style={{ borderColor: 'rgba(0,255,204,0.3)', color: '#00FFCC', backgroundColor: 'rgba(0,255,204,0.06)' }}>
                          🌐 SOURCE: {languageBadge.toUpperCase()} → EN-US
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Description textarea */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Observational Notes</label>
                  <textarea
                    value={reportNotes}
                    onChange={e => setReportNotes(e.target.value)}
                    rows={3}
                    placeholder="Describe the issue in detail..."
                    className="w-full rounded-lg border px-3 py-2 text-[10px] font-mono bg-transparent text-white outline-none resize-none"
                    style={{ borderColor: '#1A2629' }}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!reportNotes && !transcriptText}
                  className="w-full py-3 rounded-xl font-bold font-mono text-[11px] uppercase tracking-wider cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#00FFCC', color: '#090F10' }}
                >
                  <PlusCircle className="w-4 h-4"/>
                  File Civic Report
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ KARMA LEDGER TAB ═══════════════════════════════════════════ */}
        {activeTab === 'ledger' && (
          <div className="p-3 space-y-4">
            {/* XP summary card */}
            <div className="rounded-xl border p-4" style={{ backgroundColor: '#111A1C', borderColor: 'rgba(0,255,204,0.2)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Civic Karma Balance</p>
                  <p className="text-3xl font-black font-mono mt-1" style={{ color: '#00FFCC' }}>
                    {session?.karmaXP || 0} <span className="text-sm font-bold">XP</span>
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#00FFCC', backgroundColor: 'rgba(0,255,204,0.08)' }}>
                  <Award className="w-7 h-7" style={{ color: '#00FFCC' }} />
                </div>
              </div>
              {/* XP bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[8px] font-mono" style={{ color: '#64748B' }}>
                  <span>Progress to next badge</span>
                  <span style={{ color: '#00FFCC' }}>{session?.karmaXP || 0} / 400 XP</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1A2629' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(((session?.karmaXP||0)/400)*100, 100)}%`, backgroundColor: '#00FFCC', boxShadow: '0 0 8px rgba(0,255,204,0.5)' }} />
                </div>
              </div>
              {/* Badges */}
              {session?.badges && session.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {session.badges.map(badge => (
                    <span key={badge} className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border" style={{ borderColor: 'rgba(0,255,204,0.3)', color: '#00FFCC', backgroundColor: 'rgba(0,255,204,0.06)' }}>
                      🏅 {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction history */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#64748B' }}>Karma Ledger History</h4>
              {karmaTransactions.length === 0 ? (
                <p className="text-[9px] font-mono text-center py-6" style={{ color: '#64748B' }}>No transactions yet. File a report or confirm a resolution to earn XP.</p>
              ) : (
                karmaTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between rounded border p-2.5" style={{ backgroundColor: '#111A1C', borderColor: '#1A2629' }}>
                    <div>
                      <p className="text-[9px] font-mono text-white">{tx.msg}</p>
                      <p className="text-[8px] font-mono" style={{ color: '#64748B' }}>{tx.time}</p>
                    </div>
                    <span className="text-[10px] font-black font-mono" style={{ color: '#00FFCC' }}>{tx.xp}</span>
                  </div>
                ))
              )}
            </div>

            {/* Trust matrix */}
            <MunicipalTrustMatrix sectorGrades={sectorGrades} trustScore={trustScore} />
          </div>
        )}
      </div>

      {/* ── Bottom tab bar ── */}
      <div className="border-t grid grid-cols-3 h-14" style={{ borderColor: '#1A2629', backgroundColor: '#090F10' }}>
        {([
          { key: 'feed', label: 'Live Feed', icon: <Clock className="w-4 h-4"/> },
          { key: 'report', label: 'Report', icon: <Camera className="w-4 h-4"/> },
          { key: 'ledger', label: 'Karma', icon: <Award className="w-4 h-4"/> },
        ] as const).map(tab => (
          <button key={tab.key} type="button"
            onClick={() => { setActiveTab(tab.key); }}
            className="flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
            style={{ color: activeTab === tab.key ? '#00FFCC' : '#64748B' }}>
            {tab.icon}
            <span className="text-[8px] font-mono uppercase font-bold tracking-widest">{tab.label}</span>
            {activeTab === tab.key && <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ backgroundColor: '#00FFCC' }} />}
          </button>
        ))}
      </div>
    </div>
  );
};
