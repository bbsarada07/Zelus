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

const CATEGORIES: { label: IncidentCategory; icon: React.ReactNode; color: string }[] = [
  { label: 'Road & Structural Damage',    icon: <Construction className="w-3.5 h-3.5"/>, color: '#FFCC00' },
  { label: 'Water Outage & Flooding',     icon: <Droplets className="w-3.5 h-3.5"/>,    color: '#38BDF8' },
  { label: 'Utility & Spark Hazard',      icon: <Zap className="w-3.5 h-3.5"/>,         color: '#FF3B30' },
  { label: 'Stray Animal Welfare & Rescue', icon: <PawPrint className="w-3.5 h-3.5"/>, color: '#F97316' },
  { label: 'Urban Forestry Protection',   icon: <Trees className="w-3.5 h-3.5"/>,       color: '#22C55E' },
  { label: 'Sanitation Operations',       icon: <Trash2 className="w-3.5 h-3.5"/>,      color: '#EAB308' },
  { label: 'Neighborhood Mediation',      icon: <Users className="w-3.5 h-3.5"/>,       color: '#8B5CF6' },
];

const LANGUAGES = ['Mandarin', 'Telugu', 'Spanish', 'Hindi', 'Arabic', 'French', 'Tamil'];

const TRANSLATIONS: Record<string, string> = {
  Mandarin: '此市民报告记录了市政基础设施节点的明显退化。损坏严重程度分类要求优先派遣合格的维护团队进行即时评估和补救。',
  Telugu:   'రహదారి ఉపరితలం వద్ద గణనీయమైన నిర్మాణ నష్టం జరిగింది. పెడస్ట్రియన్లు మరియు వాహనదారులకు ప్రమాదకర పరిస్థితులు ఏర్పడుతున్నాయి. తక్షణ మరమ్మత్తు అవసరం.',
  Spanish:  'Hay daños estructurales significativos en la superficie de la carretera en esta ubicación. Múltiples grietas y material inestable están creando un peligro.',
  Hindi:    'सूचित स्थान पर सार्वजनिक बुनियादी ढांचे में गंभीर क्षति देखी गई है। जलभराव और सतह का विस्थापन इंगित करता है कि तत्काल मरम्मत की आवश्यकता है।',
  Arabic:   'تم اكتشاف خلل في البنية التحتية في الموقع المحدد. يرجى إرسال فريق الصيانة فوراً لتجنب الحوادث.',
  French:   'Des dommages structurels importants ont été signalés sur la chaussée. L\'état de dégradation nécessite une intervention immédiate.',
  Tamil:    'குறிப்பிட்ட ஒருங்கிணைப்புகளில் பொது உள்கட்டமைப்பு சேதம் பதிவாகியுள்ளது. விபத்துகளைத் தவிர்க்க உடனடியாகப் பழுதுபார்க்க பரிந்துரைக்கப்படுகிறது.',
};

// Preset details mapping
const PRESETS = {
  pothole: {
    category: 'Road & Structural Damage' as IncidentCategory,
    location: '17.4485°N, 78.5204°E (Zone-3 Structural Fracture)',
    x: 48.2,
    y: 61.9,
    notes: 'Asphalt fracture detected on main driveway. Bounding box scan confirmed structural depth collapse.',
    scanText: '[VISION: DISCOVERED ASPHALT FRACTURE | CONFIDENCE 97.2%]',
    severity: 'Critical' as const,
  },
  water: {
    category: 'Water Outage & Flooding' as IncidentCategory,
    location: '17.4512°N, 78.5289°E (Sector-5 Hydro Junction)',
    x: 60.5,
    y: 45.3,
    notes: 'High pressure water main burst spraying water into the walkway. Ground flooding observed.',
    scanText: '[VISION: WATER BURST DETECTED | PRESSURE LOSS ACTIVE | CONFIDENCE 99.1%]',
    severity: 'Critical' as const,
  },
  utility: {
    category: 'Utility & Spark Hazard' as IncidentCategory,
    location: '17.4461°N, 78.5178°E (Grid-8 Overhead Insulator)',
    x: 32.8,
    y: 71.4,
    notes: 'High-voltage overhead cable snapping and creating electrical sparks near public trees.',
    scanText: '[VISION: ARCS DETECTED | RISK WEIGHT: 9.4/10 | CONFIDENCE 96.8%]',
    severity: 'Critical' as const,
  }
};

type ScenePreset = 'pothole' | 'water' | 'utility';

function drawScene(canvas: HTMLCanvasElement, preset: ScenePreset) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;

  // Clear background
  ctx.fillStyle = '#090F10';
  ctx.fillRect(0, 0, W, H);

  if (preset === 'pothole') {
    // Dark asphalt texture
    ctx.fillStyle = '#1B2426';
    ctx.fillRect(0, 0, W, H);
    // Road center dashes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 12]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
    // Deep Pothole ellipse
    ctx.fillStyle = '#060B0C';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.5, 48, 32, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 204, 0, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.5, 48, 32, 0.1, 0, Math.PI * 2);
    ctx.stroke();
    // Bounding Box
    ctx.strokeStyle = '#00FFCC';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W * 0.5 - 55, H * 0.5 - 38, 110, 76);
    // HUD Tag
    ctx.fillStyle = '#00FFCC';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('STRUCTURAL_DECAY // 97.2%', W * 0.5 - 52, H * 0.5 - 43);

  } else if (preset === 'water') {
    // Wet concrete base
    ctx.fillStyle = '#101B24';
    ctx.fillRect(0, 0, W, H);
    // Water flooding pool
    const grd = ctx.createLinearGradient(0, H * 0.4, 0, H);
    grd.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    grd.addColorStop(1, 'rgba(56, 189, 248, 0.6)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, H * 0.4, W, H * 0.6);
    // Pipe outline
    ctx.fillStyle = '#374151';
    ctx.fillRect(W * 0.2, H * 0.35, W * 0.6, 14);
    // Burst water spray arcs
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.35, 15 + i * 8, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    // Asset Marker Box
    ctx.strokeStyle = '#00FFCC';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W * 0.5 - 40, H * 0.35 - 20, 80, 50);
    ctx.fillStyle = '#00FFCC';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('HYDRO_BURST // 99.1%', W * 0.5 - 37, H * 0.35 - 25);

  } else if (preset === 'utility') {
    // Utility cabinet backdrop
    ctx.fillStyle = '#1A1D20';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0D0F11';
    ctx.fillRect(W * 0.35, H * 0.15, W * 0.3, H * 0.7);
    // Sparks & electric arcs (jagged paths)
    ctx.strokeStyle = '#FFCC00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.3);
    ctx.lineTo(W * 0.45, H * 0.4);
    ctx.lineTo(W * 0.55, H * 0.45);
    ctx.lineTo(W * 0.48, H * 0.55);
    ctx.stroke();
    // Spark dots
    ctx.fillStyle = '#FF3B30';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(W * 0.5 + (Math.random() * 40 - 20), H * 0.4 + (Math.random() * 40 - 20), 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Bounding scanning box
    ctx.strokeStyle = '#FF3B30';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W * 0.3, H * 0.2, W * 0.4, H * 0.5);
    ctx.fillStyle = '#FF3B30';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('HIGH_VOLT_ARC // RISK 9.4', W * 0.3 + 3, H * 0.2 - 6);
  }

  // Common HUD crosshair overlay
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.setLineDash([]);

  // Scanning laser target corners
  [[0, 0], [W, 0], [0, H], [W, H]].forEach(([cx, cy]) => {
    const dx = cx === 0 ? 1 : -1, dy = cy === 0 ? 1 : -1;
    ctx.strokeStyle = '#00FFCC';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + dx * 6, cy); ctx.lineTo(cx + dx * 20, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + dy * 6); ctx.lineTo(cx, cy + dy * 20); ctx.stroke();
  });
}

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
  return map[cat] || null;
}

export const CitizenSimulator: React.FC = () => {
  const {
    incidents, session, addIncident, upvoteIncident,
    updateKarma, confirmResolution, sectorGrades, trustScore, addToast
  } = useZelus();

  const [activeTab, setActiveTab] = useState<'feed' | 'report' | 'ledger'>('feed');

  // Form inputs state
  const [reportCategory, setReportCategory] = useState<IncidentCategory>('Road & Structural Damage');
  const [reportLocation, setReportLocation] = useState('GPS Acquiring...');
  const [reportX, setReportX] = useState(48.2);
  const [reportY, setReportY] = useState(61.9);
  const [reportNotes, setReportNotes] = useState('');
  const [reportSeverity, setReportSeverity] = useState<'Critical' | 'Moderate' | 'Low'>('Moderate');
  const [languageBadge, setLanguageBadge] = useState<string | null>(null);

  // Fallback Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [activeScene, setActiveScene] = useState<ScenePreset | null>(null);
  const [scanningScene, setScanningScene] = useState(false);
  const [visionScanText, setVisionScanText] = useState('');
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('Mandarin');
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Form Submission Phases
  type SubmitPhase = 'form' | 'processing' | 'success';
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('form');
  const [processingStep, setProcessingStep] = useState(0);
  const [generatedId, setGeneratedId] = useState('');
  const [karmaTransactions, setKarmaTransactions] = useState<Array<{id:string;msg:string;xp:string;time:string}>>([]);

  const PROCESSING_STEPS = [
    '[ANALYZING VISUAL PRESET EVIDENCE...]',
    '[COMPUTING STRUCTURAL PRIORITY CRITERIA...]',
    '[COMMITTING IMMUTABLE CIVIC REGISTRY ENTITY...]',
  ];

  // Initialize simulated GPS coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setReportX(parseFloat((35 + Math.abs((pos.coords.longitude * 100) % 40)).toFixed(1)));
          setReportY(parseFloat((35 + Math.abs((pos.coords.latitude * 100) % 40)).toFixed(1)));
          setReportLocation(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
        },
        () => {
          setReportLocation('17.4501°N, 78.5252°E (Simulated)');
        }
      );
    }
  }, []);

  // Sync camera canvas
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
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ SELECT SCENE PRESET BELOW ]', canvas.width/2, canvas.height-10);
      ctx.textAlign = 'left';
    }
  }, [cameraActive, activeScene]);

  // Activate Camera Simulator HUD
  const activateCamera = () => {
    setCameraActive(true);
    setActiveScene(null);
    setVisionScanText('');
  };

  // Trigger preset action
  const selectPreset = (key: ScenePreset) => {
    const data = PRESETS[key];
    setReportCategory(data.category);
    setReportLocation(data.location);
    setReportX(data.x);
    setReportY(data.y);
    setReportNotes(data.notes);
    setReportSeverity(data.severity);
    setActiveScene(key);
    setScanningScene(true);
    setCameraActive(true);

    setTimeout(() => {
      setScanningScene(false);
      setVisionScanText(data.scanText);
      if (cameraCanvasRef.current) {
        drawScene(cameraCanvasRef.current, key);
      }
    }, 700);
  };

  // Audio recording handlers
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
      const rawText = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.Mandarin;
      // We will output a clean English translation
      const engTranslation = "This civic report documents observable degradation of a municipal infrastructure node. The damage severity classification warrants priority dispatch of a qualified maintenance team for immediate assessment and remediation.";
      
      setTranscriptText(`Raw Ingestion:\n"${rawText}"\n\nEnglish Translation:\n"${engTranslation}"\n\n[AUDIO SOURCE LOCALIZED -> TRANSLATED FROM ${selectedLanguage.toUpperCase()} TO EN-US | ACCURACY: 99.1%]`);
      setReportNotes(engTranslation);
    }, 1500);
  };

  useEffect(() => () => { if (recordTimerRef.current) clearInterval(recordTimerRef.current); }, []);

  // Multi-stage loader submission intercept
  const handleSubmit = useCallback(() => {
    if (!reportNotes && !transcriptText) return;
    setSubmitPhase('processing');
    setProcessingStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProcessingStep(step);
      if (step >= PROCESSING_STEPS.length) {
        clearInterval(interval);
        
        // Generate random Ticket ID
        const ticketNum = Math.floor(Math.random() * 900 + 100);
        const ticketChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const newId = `INC-2026-${ticketChar}${ticketNum}`;
        setGeneratedId(newId);

        // Commit to state context
        addIncident({
          category: reportCategory,
          location: reportLocation,
          coordinates: [reportX, reportY],
          severity: reportSeverity,
          status: 'Triage',
          upvotes: 1,
          description: reportNotes || transcriptText,
          languageBadge: languageBadge,
          image: activeScene ? `/${activeScene}.png` : '/road_pothole.png',
          notes: reportNotes || transcriptText,
          geolocation: { lat: 17.4501 + (reportY - 50) * 0.001, lng: 78.5252 + (reportX - 50) * 0.001 },
          exifVerified: true,
          hash: `0x${Array.from({length:16},()=>Math.floor(Math.random()*16).toString(16)).join('').toUpperCase()}`,
          materials: [],
        });

        // Assign XP
        updateKarma(10);
        setKarmaTransactions(p => [{
          id: `KT-${Date.now()}`,
          msg: `Civic ticket ${newId} filed`,
          xp: '+10 XP',
          time: new Date().toLocaleTimeString(),
        }, ...p]);

        addToast('✅ Civic ticket filed successfully! +10 Civic Karma points assigned.', 'success');
        setSubmitPhase('success');
      }
    }, 500); // 3 steps * 500ms = 1.5 seconds exactly
  }, [reportNotes, transcriptText, reportCategory, reportLocation, reportX, reportY, reportSeverity, languageBadge, activeScene, addIncident, updateKarma, addToast]);

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
    setActiveTab('feed'); // Safely navigate back to maps/feed
  };

  const feedIncidents = incidents.slice(0, 15);
  const reviewable = incidents.filter(i => i.status === 'Peer_Review');

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, [string, string]> = {
      'Triage': ['#FFCC00', 'rgba(255,204,0,0.1)'],
      'Bounty_Posted': ['#00FFCC', 'rgba(0,255,204,0.1)'],
      'Claimed_In_Progress': ['#F97316', 'rgba(249,115,22,0.1)'],
      'Peer_Review': ['#8B5CF6', 'rgba(139,92,246,0.1)'],
      'Resolved': ['#22C55E', 'rgba(34,197,94,0.1)'],
    };
    const [color, bg] = map[status] || ['var(--text-muted)', 'rgba(100,116,139,0.1)'];
    return (
      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border" style={{ color, backgroundColor: bg, borderColor: `${color}40` }}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── Tab content area ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══ FEED TAB ═══════════════════════════════════════════════════ */}
        {activeTab === 'feed' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-primary)]">Live Civic Feed</h3>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{feedIncidents.length} active tickets</span>
            </div>

            {/* Peer review section */}
            {reviewable.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2" style={{ backgroundColor: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.25)' }}>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--accent-purple)' }}>
                  🗳 Consensus Vote Required ({reviewable.length})
                </p>
                {reviewable.map(inc => {
                  const alreadyVoted = (inc.verifications||[]).some(v => v.name === session?.username);
                  const voteCount = (inc.verifications||[]).length;
                  return (
                    <div key={inc.id} className="rounded border p-2.5 space-y-2" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-bold text-[var(--text-primary)]">{inc.category}</p>
                          <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{inc.location}</p>
                        </div>
                        <StatusBadge status={inc.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
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
                          className="text-[9px] font-mono font-bold px-2 py-1 rounded border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          style={{
                            color: alreadyVoted ? 'var(--text-muted)' : 'var(--accent-purple)',
                            borderColor: alreadyVoted ? 'var(--border-secondary)' : 'rgba(139,92,246,0.4)',
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
                <div key={inc.id} className="rounded-lg border p-3 space-y-2 transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', borderLeftColor: color, borderLeftWidth: 3 }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span style={{ color }}>{getCatIcon(inc.category)}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">{inc.category}</p>
                        <p className="text-[9px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                          <MapPin className="w-2.5 h-2.5 inline mr-0.5"/>{inc.location}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{inc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{inc.timestamp}</span>
                    <button
                      onClick={() => { upvoteIncident(inc.id); updateKarma(2); }}
                      className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border cursor-pointer hover:bg-white/5 transition-all"
                      style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}
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
              <div className="flex flex-col items-center justify-center min-h-[380px] space-y-6 animate-fade-in bg-var(--bg-primary)">
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-cyan)', borderTopColor: 'transparent' }} />
                <div className="space-y-3 w-full max-w-[280px]">
                  {PROCESSING_STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < processingStep ? 'bg-green-500' : i === processingStep ? 'bg-cyan-500 animate-pulse' : 'bg-zinc-800'}`} />
                      <span className="text-[10px] font-mono"
                        style={{ color: i < processingStep ? '#16A34A' : i === processingStep ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
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
                <div className="w-20 h-20 rounded-full flex items-center justify-center relative bg-green-500/10 border-2 border-green-500/40">
                  <svg viewBox="0 0 60 60" className="w-12 h-12">
                    <path d="M12 30 L24 42 L48 18" fill="none" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                      className="animate-checkmark" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-500">
                    Ticket Registered Successfully
                  </p>
                  <div className="text-xs font-black font-mono text-[var(--text-primary)] py-1.5 px-3 rounded-lg border bg-green-500/5 border-green-500/20">
                    {generatedId}
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-2 w-full max-w-[280px] text-left"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Your civic ticket has been successfully registered onto the Triage Ledger. Citizen tracking metrics updated.
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-green-600">
                    <Award className="w-3.5 h-3.5"/>
                    +10 Civic Karma points assigned
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    Status: <span className="text-amber-500 font-bold">TRIAGE</span> → Pending admin authorization
                  </div>
                </div>

                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider cursor-pointer transition-all bg-green-500 text-white hover:brightness-105 shadow-md"
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
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-primary)]">File Civic Report</h3>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    📍 GPS Locked
                  </span>
                </div>

                {/* Simulated Preset Cards */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Simulated Preset Evidence</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => selectPreset('pothole')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-20 ${activeScene === 'pothole' ? 'bg-[#FFCC00]10' : 'bg-var(--bg-card)'}`}
                      style={{ borderColor: activeScene === 'pothole' ? '#FFCC00' : 'var(--border-secondary)' }}
                    >
                      <Construction className="w-4 h-4 text-[#FFCC00]" />
                      <div>
                        <p className="text-[9.5px] font-bold text-[var(--text-primary)] leading-tight">Pothole Scene</p>
                        <p className="text-[7.5px] text-zinc-500">Asphalt Fracture</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPreset('water')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-20 ${activeScene === 'water' ? 'bg-[#38BDF8]10' : 'bg-var(--bg-card)'}`}
                      style={{ borderColor: activeScene === 'water' ? '#38BDF8' : 'var(--border-secondary)' }}
                    >
                      <Droplets className="w-4 h-4 text-[#38BDF8]" />
                      <div>
                        <p className="text-[9.5px] font-bold text-[var(--text-primary)] leading-tight">Water Burst</p>
                        <p className="text-[7.5px] text-zinc-500">Hydro Leak</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPreset('utility')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-20 ${activeScene === 'utility' ? 'bg-[#FF3B30]10' : 'bg-var(--bg-card)'}`}
                      style={{ borderColor: activeScene === 'utility' ? '#FF3B30' : 'var(--border-secondary)' }}
                    >
                      <Zap className="w-4 h-4 text-[#FF3B30]" />
                      <div>
                        <p className="text-[9.5px] font-bold text-[var(--text-primary)] leading-tight">Utility Spark</p>
                        <p className="text-[7.5px] text-zinc-500">Grid Danger</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Visual Evidence Canvas HUD */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Visual Evidence Screen</label>
                  {!cameraActive ? (
                    <button type="button" onClick={activateCamera}
                      className="w-full py-4 rounded-lg border border-dashed flex flex-col items-center gap-1.5 cursor-pointer transition-all hover:bg-white/5"
                      style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
                      <Camera className="w-5 h-5 animate-pulse text-[var(--accent-cyan)]" />
                      <span className="text-[9px] font-mono">Connect Hardware Camera</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden border" style={{ height: '140px', backgroundColor: '#060B0C', borderColor: 'var(--border-secondary)' }}>
                        {scanningScene && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
                            <div className="text-[10px] font-mono animate-pulse text-[var(--accent-cyan)]">
                              ▶ SCANNING VISUAL SCENE EVIDENCE...
                            </div>
                          </div>
                        )}
                        <canvas ref={cameraCanvasRef} width={300} height={140} className="w-full h-full" />
                        
                        {visionScanText && !scanningScene && (
                          <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded bg-black/75 border border-[#00FFCC]/20 text-[8.5px] font-mono text-[#00FFCC] text-center shadow-lg animate-fade-in">
                            {visionScanText}
                          </div>
                        )}

                        <button type="button" onClick={() => { setCameraActive(false); setActiveScene(null); setVisionScanText(''); }}
                          className="absolute top-2 right-2 p-1 rounded bg-black/60 cursor-pointer text-white" style={{ color: '#64748B' }}>
                          <X className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setReportCategory(cat.label)}
                        className="flex items-center gap-1.5 p-2 rounded-lg border text-left cursor-pointer transition-all"
                        style={{
                          borderColor: reportCategory === cat.label ? cat.color : 'var(--border-secondary)',
                          backgroundColor: reportCategory === cat.label ? `${cat.color}12` : 'var(--bg-card)',
                          color: reportCategory === cat.label ? cat.color : 'var(--text-muted)',
                        }}
                      >
                        {cat.icon}
                        <span className="text-[9px] font-mono font-bold leading-tight">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Severity</label>
                  <div className="flex gap-2">
                    {(['Critical', 'Moderate', 'Low'] as const).map(sev => {
                      const cols = { Critical: '#FF3B30', Moderate: '#FFCC00', Low: '#22C55E' };
                      const active = reportSeverity === sev;
                      return (
                        <button key={sev} type="button" onClick={() => setReportSeverity(sev)}
                          className="flex-1 py-1.5 rounded border text-[10px] font-mono font-bold cursor-pointer transition-all"
                          style={{ borderColor: active ? cols[sev] : 'var(--border-secondary)', backgroundColor: active ? `${cols[sev]}12` : 'var(--bg-card)', color: active ? cols[sev] : 'var(--text-muted)' }}>
                          {sev}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Location / GPS Coordinates</label>
                  <input
                    value={reportLocation}
                    onChange={e => setReportLocation(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-[10px] font-mono bg-transparent text-[var(--text-primary)] outline-none"
                    style={{ borderColor: 'var(--border-secondary)' }}
                  />
                </div>

                {/* Audio + Translation */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Audio Note + Localization</label>

                  <div className="relative">
                    <select
                      value={selectedLanguage}
                      onChange={e => setSelectedLanguage(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-[10px] font-mono bg-transparent text-[var(--text-primary)] outline-none appearance-none cursor-pointer"
                      style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}
                    >
                      {LANGUAGES.map(l => <option key={l} value={l} style={{ backgroundColor: 'var(--bg-card)' }}>{l}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--text-muted)]" />
                  </div>

                  {!transcribing ? (
                    <button type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className="w-full py-2.5 rounded-lg border flex items-center justify-center gap-3 cursor-pointer transition-all"
                      style={{
                        borderColor: isRecording ? '#FF3B30' : 'var(--border-secondary)',
                        backgroundColor: isRecording ? 'rgba(255,59,48,0.06)' : 'var(--bg-card)',
                      }}>
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 flex-shrink-0 text-red-500" />
                          <div className="flex items-end gap-[2px] h-6">
                            {Array.from({length:10},(_,i)=>(
                              <div key={i} className={`w-[3px] rounded-full bg-red-500 wave-b${i+1}`}
                                style={{ minHeight: '4px' }} />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-primary)]">
                            {String(Math.floor(recordingTime/60)).padStart(2,'0')}:{String(recordingTime%60).padStart(2,'0')}
                          </span>
                          <span className="text-[9px] font-mono text-red-500">Stop</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-[var(--accent-cyan)]" />
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">Record Audio Note ({selectedLanguage})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-lg border" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'rgba(0,255,204,0.04)' }}>
                      <div className="w-3.5 h-3.5 rounded-full animate-spin border border-t-transparent border-cyan-500" />
                      <span className="text-[10px] font-mono animate-pulse text-cyan-600">
                        Localizing {selectedLanguage} → EN-US Translation...
                      </span>
                    </div>
                  )}

                  {transcriptText && (
                    <div className="rounded-lg border p-2.5 space-y-1.5 bg-green-500/5 border-green-500/20">
                      <p className="text-[9px] font-mono font-bold text-green-600">Translated Observational Transcript:</p>
                      <p className="text-[10px] leading-relaxed whitespace-pre-wrap text-[var(--text-primary)]">{transcriptText.split('\n\n')[0]}</p>
                      {languageBadge && (
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block bg-cyan-500/5 border-cyan-500/20 text-cyan-600">
                          🌐 SOURCE: {languageBadge.toUpperCase()} → EN-US | ACCURACY: 99.1%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Description textarea */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Observational Notes</label>
                  <textarea
                    value={reportNotes}
                    onChange={e => setReportNotes(e.target.value)}
                    rows={3}
                    placeholder="Describe the issue in detail or use presets..."
                    className="w-full rounded-lg border px-3 py-2 text-[10px] font-mono bg-transparent text-[var(--text-primary)] outline-none resize-none"
                    style={{ borderColor: 'var(--border-secondary)' }}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!reportNotes && !transcriptText}
                  className="w-full py-3 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] hover:brightness-105 shadow-lg"
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
            <div className="rounded-xl border p-4 transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Civic Karma Balance</p>
                  <p className="text-3xl font-black font-mono mt-1 text-[var(--accent-cyan)]">
                    {session?.karmaXP || 0} <span className="text-sm font-bold">XP</span>
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--accent-cyan)', backgroundColor: 'var(--bg-secondary)' }}>
                  <Award className="w-7 h-7 text-[var(--accent-cyan)]" />
                </div>
              </div>
              
              {/* XP bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span>Progress to next badge</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{session?.karmaXP || 0} / 400 XP</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-var(--bg-secondary)">
                  <div className="h-full rounded-full bg-[var(--accent-cyan)]" style={{ width: `${Math.min(((session?.karmaXP||0)/400)*100, 100)}%` }} />
                </div>
              </div>

              {/* Badges */}
              {session?.badges && session.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {session.badges.map(badge => (
                    <span key={badge} className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border bg-[var(--accent-cyan)]/5 border-[var(--accent-cyan)]/25 text-[var(--accent-cyan)]">
                      🏅 {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction history */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Karma Ledger History</h4>
              {karmaTransactions.length === 0 ? (
                <p className="text-[10px] font-mono text-center py-6" style={{ color: 'var(--text-muted)' }}>No transactions yet. File a report or confirm a resolution to earn XP.</p>
              ) : (
                karmaTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between rounded border p-2.5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
                    <div>
                      <p className="text-[10px] font-mono text-[var(--text-primary)]">{tx.msg}</p>
                      <p className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>{tx.time}</p>
                    </div>
                    <span className="text-[11px] font-black font-mono text-[var(--accent-cyan)]">{tx.xp}</span>
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
      <div className="border-t grid grid-cols-3 h-14" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
        {([
          { key: 'feed', label: 'Live Feed', icon: <Clock className="w-4 h-4"/> },
          { key: 'report', label: 'Report', icon: <Camera className="w-4 h-4"/> },
          { key: 'ledger', label: 'Karma', icon: <Award className="w-4 h-4"/> },
        ] as const).map(tab => (
          <button key={tab.key} type="button"
            onClick={() => { setActiveTab(tab.key); }}
            className="flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
            style={{ color: activeTab === tab.key ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
            {tab.icon}
            <span className="text-[9px] font-mono uppercase font-bold tracking-widest">{tab.label}</span>
            {activeTab === tab.key && <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ backgroundColor: 'var(--accent-cyan)' }} />}
          </button>
        ))}
      </div>
    </div>
  );
};
