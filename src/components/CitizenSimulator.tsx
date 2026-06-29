import React, { useState, useEffect, useRef } from 'react';
import type { Incident, UserSession, Theme } from '../types';
import { 
  Camera, 
  MapPin, 
  Award, 
  Coins, 
  PlusCircle, 
  X, 
  Mic, 
  CheckCircle2,
  Languages,
  Sparkles
} from 'lucide-react';

interface CitizenSimulatorProps {
  incidents: Incident[];
  onAddIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'>) => void;
  onUpvoteIncident: (id: string) => void;
  session: UserSession;
  onUpdateKarma: (xp: number) => void;
  theme: Theme;
  onConfirmResolution: (id: string, verification: { name: string; timestamp: string; photo: string }) => void;
}

export const CitizenSimulator: React.FC<CitizenSimulatorProps> = ({
  incidents,
  onAddIncident,
  onUpvoteIncident,
  session,
  onUpdateKarma,
  theme,
  onConfirmResolution,
}) => {
  const isDark = theme === 'dark';

  // Mobile tabs: 'marketplace' | 'report' | 'ledger'
  const [activeTab, setActiveTab] = useState<'marketplace' | 'report' | 'ledger'>('marketplace');
  
  // Active selected bounty for verification
  const [selectedBounty, setSelectedBounty] = useState<Incident | null>(null);

  // Form State
  const [reportCategory, setReportCategory] = useState('Road & Structural Damage');
  const [reportLocation, setReportLocation] = useState('Sector 4 Area');
  const [reportX, setReportX] = useState(48.2);
  const [reportY, setReportY] = useState(61.9);
  const [reportNotes, setReportNotes] = useState('');
  const [reportImage, setReportImage] = useState('');
  const [reportSeverity, setReportSeverity] = useState<'Critical' | 'Moderate' | 'Low'>('Moderate');
  const [languageBadge, setLanguageBadge] = useState<string | null>(null);

  // Automated Geolocation states
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // AI & Processing States
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  
  // Voice Recording parameters
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const voiceAnimationRef = useRef<number | null>(null);

  // AI Pipeline Toggles: 'off' | 'enhance' | 'translate'
  const [aiPipelineMode, setAiPipelineMode] = useState<'off' | 'enhance' | 'translate'>('off');

  // Submit UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cliLogs, setCliLogs] = useState<string[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Selfie validation states
  const handshakeVideoRef = useRef<HTMLVideoElement | null>(null);
  const handshakeStreamRef = useRef<MediaStream | null>(null);
  const [handshakeStep, setHandshakeStep] = useState<'idle' | 'streaming' | 'countdown'>('idle');
  const [handshakeCountdown, setHandshakeCountdown] = useState(2);

  const stopCamera = () => {
    if (handshakeStreamRef.current) {
      handshakeStreamRef.current.getTracks().forEach(t => t.stop());
      handshakeStreamRef.current = null;
    }
    setHandshakeStep('idle');
  };

  const startCamera = () => {
    // Stub for Tab navigation triggers
  };

  // Transaction Ledger log history
  const [karmaTransactions, setKarmaTransactions] = useState<Array<{ id: string; msg: string; xp: string; time: string }>>([]);

  // Fetch geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGeoCoords({ lat, lng });
          
          // Map to simulated X, Y (0-100)
          const simulatedX = parseFloat((35 + Math.abs((lng * 100) % 40)).toFixed(1));
          const simulatedY = parseFloat((35 + Math.abs((lat * 100) % 40)).toFixed(1));
          setReportX(simulatedX);
          setReportY(simulatedY);
          setReportLocation(`Grid Node: [Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}]`);
        },
        (err) => {
          console.warn("Geolocation access denied. Setting default grid coordinates.", err);
          setGeoCoords({ lat: 40.7128, lng: -74.0060 });
          setGeoError("Perms blocked - default seed coordinates injected");
        }
      );
    } else {
      setGeoCoords({ lat: 40.7128, lng: -74.0060 });
      setGeoError("Browser does not support geolocation");
    }
  }, []);

  // Sync / Init Karma Logs
  useEffect(() => {
    const savedLogs = localStorage.getItem(`zelus_karma_logs_${session.username}`);
    if (savedLogs) {
      try {
        setKarmaTransactions(JSON.parse(savedLogs));
      } catch { /* ignore */ }
    } else {
      const initialLogs = [
        { id: 'tx-1', msg: 'System Bootstrap authentication established', xp: 'CONNECTED', time: '14:02:10' },
        { id: 'tx-2', msg: 'Operator active registry credit seed', xp: '+120 XP', time: '14:02:11' }
      ];
      setKarmaTransactions(initialLogs);
      localStorage.setItem(`zelus_karma_logs_${session.username}`, JSON.stringify(initialLogs));
    }
  }, [session.username]);

  const addKarmaLog = (msg: string, xpChange: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      msg,
      xp: xpChange,
      time: timeStr
    };
    setKarmaTransactions(prev => {
      const updated = [newLog, ...prev].slice(0, 40);
      localStorage.setItem(`zelus_karma_logs_${session.username}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Vision Simulator Preset triggers
  const handleSelectVisionPreset = (presetIndex: number) => {
    setIsVisionScanning(true);
    
    // Simulate image scan pulse
    setTimeout(() => {
      setIsVisionScanning(false);
      
      if (presetIndex === 0) {
        // Pothole
        setReportCategory('Road & Structural Damage');
        setReportSeverity('Moderate');
        setReportImage('/road_pothole.png');
        setReportNotes('Severe road pothole and tarmac damage parsed on main thoroughfare corridor.');
      } else if (presetIndex === 1) {
        // Water Leak
        setReportCategory('Water Outage & Flooding');
        setReportSeverity('Critical');
        setReportImage('/water_main_burst.png');
        setReportNotes('High pressure water pipeline rupture causing heavy localized street flooding.');
      } else {
        // Streetlight
        setReportCategory('Utility & Spark Hazard');
        setReportSeverity('Low');
        setReportImage('/downed_power_line.png');
        setReportNotes('Flickering streetlight fixture exposing internal terminal electrical wires.');
      }
    }, 1200);
  };

  // voice pipeline recording controls
  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(p => p + 1);
    }, 1000);

    // Waveform simulation
    const canvas = voiceCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let step = 0;
        const drawWave = () => {
          if (!isRecording) return;
          ctx.fillStyle = isDark ? '#050A0B' : '#FAF9F6';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.strokeStyle = isDark ? '#00FFCC' : '#006650';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          for (let i = 0; i < canvas.width; i++) {
            const amp = Math.sin(i * 0.05 + step) * (10 + Math.random() * 15);
            ctx.lineTo(i, canvas.height / 2 + amp);
          }
          ctx.stroke();
          
          step += 0.2;
          voiceAnimationRef.current = requestAnimationFrame(drawWave);
        };
        drawWave();
      }
    }
  };

  const stopVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (voiceAnimationRef.current) {
      cancelAnimationFrame(voiceAnimationRef.current);
    }
    setIsRecording(false);
    setTranscribing(true);

    setTimeout(() => {
      setTranscribing(false);
      // Run AI enhance / translate logics
      let text = '';
      let badge: string | null = null;

      if (aiPipelineMode === 'translate') {
        text = 'High-severity road surface pothole fracture identified on main sector corridor, impeding vehicular traffic.';
        badge = '[Translated from Hindi to English]';
      } else if (aiPipelineMode === 'enhance') {
        text = 'Observed severe road surface erosion and localized asphalt fracture on main roadway, causing driver deceleration.';
        badge = null;
      } else {
        text = 'sadak par ek bada gaddha hai gaadi chalane me dikkat ho rahi hai.';
        badge = null;
      }

      setReportNotes(text);
      setLanguageBadge(badge);
    }, 1000);
  };

  // Submit report to global array
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCliLogs([]);
    setShowSuccessAlert(false);

    const generatedHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()}`;

    const logs = [
      '⚡ [ZELUS-ORCHESTRATOR] INITIATING COMPLAINT RECORD...',
      '🔍 [AEGIS-AGENT] Checking duplicate node signatures...',
      '🟢 [AEGIS-AGENT] Exif matched, zero fraud flags identified.',
      `📍 [ATLAS-AGENT] Mapping geospatial vectors: Lat: ${geoCoords?.lat.toFixed(5) || '40.7128'} Lng: ${geoCoords?.lng.toFixed(5) || '-74.0060'}`,
      '📦 [PERSISTENCE] Syncing node telemetry to global ledger storage...',
      `🔐 [BLOCKCHAIN] committed secure hash: ${generatedHash.slice(0, 16)}...`,
      '🏁 [SUCCESS] Incident successfully registered. Outbound alarms triggered!'
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < logs.length) {
        setCliLogs(prev => [...prev, logs[step]]);
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsSubmitting(false);
          setShowSuccessAlert(true);

          onAddIncident({
            category: reportCategory,
            location: reportLocation,
            coordinates: [reportX, reportY],
            severity: reportSeverity,
            status: 'Triage',
            upvotes: 1,
            description: reportNotes || 'Civic infrastructure report submitted via mobile portal.',
            languageBadge: languageBadge,
            image: reportImage || '/road_pothole.png',
            geolocation: geoCoords || { lat: 40.7128, lng: -74.0060 },
            exifVerified: true,
            hash: generatedHash
          });

          onUpdateKarma(100);
          addKarmaLog(`Filed Report: ${reportCategory}`, '+100 XP');

          // Reset inputs
          setReportNotes('');
          setReportImage('');
          setLanguageBadge(null);
        }, 600);
      }
    }, 200);
  };

  // Selfie handshake verifier
  const startHandshake = async () => {
    try {
      if (handshakeStreamRef.current) {
        handshakeStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 }
      });
      handshakeStreamRef.current = stream;
      setHandshakeStep('streaming');
      if (handshakeVideoRef.current) {
        handshakeVideoRef.current.srcObject = stream;
      }
    } catch {
      setHandshakeStep('countdown');
      if (selectedBounty) {
        runHandshakeTimer(selectedBounty.id);
      }
    }
  };

  const snapHandshake = (id: string) => {
    if (handshakeStreamRef.current) {
      handshakeStreamRef.current.getTracks().forEach(t => t.stop());
      handshakeStreamRef.current = null;
    }
    setHandshakeStep('countdown');
    runHandshakeTimer(id);
  };

  const runHandshakeTimer = (id: string) => {
    setHandshakeCountdown(2);
    let count = 2;
    const timer = setInterval(() => {
      count--;
      setHandshakeCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setHandshakeStep('idle');

        const newVerify = {
          name: `Citizen Hero #${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: 'Just Now',
          photo: '/road_pothole.png'
        };

        onConfirmResolution(id, newVerify);
        onUpdateKarma(30);
        addKarmaLog(`Consensus verification cast: ${id}`, '+30 XP');

        setSelectedBounty(null);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (handshakeStreamRef.current) {
        handshakeStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const activeClaims = incidents.filter(i => i.status === 'Bounty_Posted' || i.status === 'Claimed_In_Progress' || i.status === 'Peer_Review');

  return (
    <div className="flex-1 flex flex-col h-full relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20">

        {/* TAB 1: CIVIC MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Coins className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
                Civic Marketplace
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Sponsor pool matching and citizen upvote verification channels.
              </p>
            </div>

            {activeClaims.length === 0 ? (
              <div className="text-center py-12 rounded-lg border border-dashed font-mono text-xs animate-pulse" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
                [NO ACTIVE CLAIMS IN SECTOR LEDGER]
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeClaims.map(inc => {
                  const verifiedCount = inc.verifications?.length || 0;
                  const isPeer = inc.status === 'Peer_Review';

                  return (
                    <div 
                      key={inc.id}
                      onClick={() => setSelectedBounty(inc)}
                      className="border rounded-lg p-3.5 space-y-3.5 cursor-pointer transition-all hover:scale-[1.01]"
                      style={{ 
                        backgroundColor: 'var(--bg-card)', 
                        borderColor: selectedBounty?.id === inc.id ? 'var(--accent-cyan)' : 'var(--border-secondary)'
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8.5px] font-mono" style={{ color: 'var(--text-muted)' }}>
                              {inc.id}
                            </span>
                            {inc.languageBadge && (
                              <span className="text-[7.5px] bg-cyan-950/20 text-brand-cyan border border-brand-cyan/20 px-1 rounded font-mono">
                                {inc.languageBadge}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold mt-1.5" style={{ color: 'var(--text-primary)' }}>
                            {inc.category}
                          </h4>
                          <span className="text-[9px] flex items-center gap-0.5 mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                            <MapPin className="w-3 h-3 text-zinc-550 shrink-0" />
                            {inc.location}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono border font-semibold" style={{
                          backgroundColor: inc.severity === 'Critical' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 204, 0, 0.15)',
                          borderColor: inc.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-amber)',
                          color: inc.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-amber)'
                        }}>
                          {inc.severity}
                        </span>
                      </div>

                      {/* Matching pool progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          <span>Sponsor Matching Pool</span>
                          <span style={{ color: 'var(--text-primary)' }}>$550 / $800</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                          <div className="h-full bg-brand-emerald rounded-full transition-all duration-300" style={{ width: '68%', backgroundColor: 'var(--accent-cyan)' }} />
                        </div>
                      </div>

                      {/* Upvotes / verification confirmations count */}
                      <div className="flex justify-between items-center text-[9px] font-mono pt-1">
                        <span style={{ color: 'var(--text-muted)' }}>
                          Votes: <strong style={{ color: 'var(--text-primary)' }}>{inc.upvotes} Consensus</strong>
                        </span>
                        <span style={{ color: isPeer ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                          {isPeer ? `Awaiting review (${verifiedCount}/3)` : inc.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REPORT ENGINE */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Camera className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
                Hyperlocal Report Engine
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Automated GPS triangulation and multi-modal voice processing dispatches.
              </p>
            </div>

            {/* Presets simulating vision input */}
            <div className="space-y-1.5 p-2.5 rounded border" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
              <span className="text-[8px] font-mono uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                GEMINI VISION SIMULATION PRESETS:
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button 
                  type="button" 
                  onClick={() => handleSelectVisionPreset(0)}
                  className="px-1.5 py-1 text-[8px] font-mono border rounded hover:bg-zinc-800/10 cursor-pointer truncate text-center"
                  style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                >
                  [ pothole.png ]
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSelectVisionPreset(1)}
                  className="px-1.5 py-1 text-[8px] font-mono border rounded hover:bg-zinc-800/10 cursor-pointer truncate text-center"
                  style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                >
                  [ leak_burst.png ]
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSelectVisionPreset(2)}
                  className="px-1.5 py-1 text-[8px] font-mono border rounded hover:bg-zinc-800/10 cursor-pointer truncate text-center"
                  style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                >
                  [ streetlight.png ]
                </button>
              </div>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              {/* Photo Uplink Frame with scanning animations */}
              <div className="border rounded-lg relative overflow-hidden flex flex-col justify-end min-h-[150px] bg-zinc-950" style={{ borderColor: 'var(--border-secondary)' }}>
                {isVisionScanning && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center space-y-2 z-30">
                    <Sparkles className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-cyan)' }} />
                    <span className="text-[9px] font-mono animate-pulse" style={{ color: 'var(--accent-cyan)' }}>
                      [GEMINI-VISION-ORCHESTRATOR] // SCANNING DATA...
                    </span>
                  </div>
                )}

                {reportImage ? (
                  <>
                    <img src={reportImage} alt="Visual preset" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="relative z-10 p-2 border-t flex justify-between items-center text-[8.5px] font-mono" style={{ backgroundColor: 'rgba(9, 15, 16, 0.95)', borderColor: 'var(--border-secondary)' }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>IMAGE CAPTURE VERIFIED</span>
                      <button 
                        type="button" 
                        onClick={() => setReportImage('')}
                        className="px-1.5 py-0.5 border rounded cursor-pointer"
                        style={{ borderColor: 'var(--border-secondary)', color: 'var(--accent-amber)' }}
                      >
                        Clear
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 space-y-2">
                    <Camera className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>No visual feed loaded</span>
                  </div>
                )}
              </div>

              {/* Form parameters */}
              <div className="space-y-3">
                {/* Geolocation target chips */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Automated GPS Geolocation Engine
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border rounded px-2.5 py-1.5 flex items-center justify-between text-[9.5px] font-mono" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>LATITUDE:</span>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{geoCoords?.lat.toFixed(5) || 'Searching...'}</strong>
                    </div>
                    <div className="border rounded px-2.5 py-1.5 flex items-center justify-between text-[9.5px] font-mono" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>LONGITUDE:</span>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{geoCoords?.lng.toFixed(5) || 'Searching...'}</strong>
                    </div>
                  </div>
                  {geoError && (
                    <span className="text-[7.5px] font-mono block" style={{ color: 'var(--accent-amber)' }}>{geoError}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Category Dropdown</label>
                  <input 
                    type="text" 
                    value={reportCategory}
                    disabled
                    className="w-full border rounded px-2.5 py-1.5 text-[10px] font-mono select-none"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Multilingual Acoustic AI Pipeline */}
                <div className="space-y-2 border rounded p-2.5" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] font-mono block font-bold" style={{ color: 'var(--text-primary)' }}>
                      Multilingual Acoustic Pipeline
                    </span>
                    <button
                      type="button"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      disabled={transcribing}
                      className={`px-2 py-0.5 rounded border text-[8px] font-mono flex items-center gap-1 cursor-pointer transition-all ${
                        isRecording ? 'border-red-900 bg-red-950/20 text-red-400 animate-pulse' : 'border-zinc-800 text-brand-cyan hover:border-zinc-700'
                      }`}
                      style={{
                        borderColor: isRecording ? 'var(--accent-red)' : 'var(--border-primary)',
                        color: isRecording ? 'var(--accent-red)' : 'var(--accent-cyan)'
                      }}
                    >
                      <Mic className="w-2.5 h-2.5" />
                      {isRecording ? `Recording (${recordingTime}s)` : transcribing ? 'Transcribing...' : 'Record Note'}
                    </button>
                  </div>

                  {isRecording && (
                    <canvas ref={voiceCanvasRef} width={300} height={32} className="w-full h-8 rounded border" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }} />
                  )}

                  {/* Dual stage Switch */}
                  <div className="flex flex-col gap-1 pt-1.5 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                    <span className="text-[8px] font-mono uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      Gemini AI Enhance & Translate Configuration
                    </span>
                    <div className="grid grid-cols-3 gap-1 p-0.5 rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                      <button
                        type="button"
                        onClick={() => setAiPipelineMode('off')}
                        className="py-1 text-[8.5px] font-mono rounded text-center cursor-pointer"
                        style={{
                          backgroundColor: aiPipelineMode === 'off' ? 'var(--bg-primary)' : 'transparent',
                          color: aiPipelineMode === 'off' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                        }}
                      >
                        OFF
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiPipelineMode('enhance')}
                        className="py-1 text-[8.5px] font-mono rounded text-center cursor-pointer"
                        style={{
                          backgroundColor: aiPipelineMode === 'enhance' ? 'var(--bg-primary)' : 'transparent',
                          color: aiPipelineMode === 'enhance' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                        }}
                      >
                        STG 1: ENHANCE
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiPipelineMode('translate')}
                        className="py-1 text-[8.5px] font-mono rounded text-center cursor-pointer"
                        style={{
                          backgroundColor: aiPipelineMode === 'translate' ? 'var(--bg-primary)' : 'transparent',
                          color: aiPipelineMode === 'translate' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                        }}
                      >
                        STG 2: TRANSLATE
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description notes */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Observational transcript
                  </label>
                  <textarea 
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    required
                    rows={3}
                    placeholder="Enter observation notes or use simulated Voice Recording..."
                    className="w-full border rounded px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-brand-cyan/60 resize-none font-sans"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                  />
                  {languageBadge && (
                    <div className="flex items-center gap-1 text-[8px] font-mono text-brand-cyan uppercase tracking-wider mt-1">
                      <Languages className="w-3.5 h-3.5" />
                      <span>{languageBadge}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Report */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 font-bold font-mono text-[10px] tracking-wider uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1 shadow-lg border animate-pulse"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  boxShadow: '0 0 10px rgba(0, 255, 204, 0.1)'
                }}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                FILE REPORT
              </button>
            </form>

            {/* Submitting CLI logs */}
            {isSubmitting && (
              <div className="absolute inset-0 z-50 p-4 font-mono text-[9px] flex flex-col" style={{ backgroundColor: 'rgba(9, 15, 16, 0.97)', color: 'var(--accent-cyan)' }}>
                <div className="flex items-center gap-1.5 border-b pb-2 mb-3" style={{ borderColor: 'var(--border-secondary)' }}>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-white font-bold uppercase tracking-widest text-[9.5px]">Zelus Swarm Triage dispatch</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {cliLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('SUCCESS') ? 'text-brand-emerald' : 'text-zinc-350'}>
                      {log}
                    </div>
                  ))}
                  <span className="w-1.5 h-3 inline-block bg-current animate-pulse" />
                </div>
              </div>
            )}

            {/* Success alert screen */}
            {showSuccessAlert && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 p-5 border rounded-lg text-center shadow-2xl z-40 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: 'var(--accent-cyan)' }} />
                <div>
                  <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>DISTRESS RECORD COMMITTED</h4>
                  <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Secure checksum committed to local ledger storage (+100 XP).
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowSuccessAlert(false);
                    setActiveTab('marketplace');
                  }}
                  className="w-full py-1 bg-zinc-900 border rounded text-[9.5px] font-mono cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                >
                  Return to Marketplace
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CIVIC KARMA LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Award className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
                Civic Karma Ledger
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Official volunteer credit balance and status badge credentials.
              </p>
            </div>

            {/* Progression Radial Progress bar */}
            <div className="border rounded-lg p-5 flex items-center justify-between shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
              <div className="space-y-1.5 flex-1 pr-4">
                <span className="text-[8px] font-mono uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Karma XP Progression
                </span>
                <h4 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  {session.username}
                </h4>
                <p className="text-[9px] uppercase font-bold tracking-widest font-mono" style={{ color: 'var(--accent-cyan)' }}>
                  {session.karmaXP >= 300 ? 'INFRASTRUCTURE GUARD' : 'WATER WATCHER'}
                </p>
              </div>

              {/* Radial Progress Ring SVG */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full rotate-[-90deg]">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="var(--bg-secondary)" strokeWidth="4" />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    fill="none" 
                    stroke="var(--accent-cyan)" 
                    strokeWidth="4" 
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 - (175.9 * Math.min(100, (session.karmaXP / 500) * 100)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  {session.karmaXP} XP
                </div>
              </div>
            </div>

            {/* Badges credentials */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-wider block font-semibold" style={{ color: 'var(--text-muted)' }}>
                System Badges
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="border p-2.5 rounded-lg flex flex-col justify-between h-20 transition-all" style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-secondary)',
                  opacity: session.karmaXP >= 100 ? 1 : 0.4
                }}>
                  <Award className="w-4 h-4" style={{ color: session.karmaXP >= 100 ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                  <div>
                    <span className="text-[9.5px] font-bold block" style={{ color: 'var(--text-primary)' }}>Water Watcher</span>
                    <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>Initial badge unlocked</span>
                  </div>
                </div>

                <div className="border p-2.5 rounded-lg flex flex-col justify-between h-20 transition-all" style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-secondary)',
                  opacity: session.karmaXP >= 220 ? 1 : 0.4
                }}>
                  <Award className="w-4 h-4" style={{ color: session.karmaXP >= 220 ? 'var(--accent-amber)' : 'var(--text-muted)' }} />
                  <div>
                    <span className="text-[9.5px] font-bold block" style={{ color: 'var(--text-primary)' }}>Infrastructure Guard</span>
                    <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>Active reporter status</span>
                  </div>
                </div>
              </div>
            </div>

            {/* XP log audit timeline */}
            <div className="border rounded-lg p-3 space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
              <span className="text-[8px] font-mono uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                XP TRANSACTION TIMELINE LOGS
              </span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {karmaTransactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center text-[9px] font-mono border-b pb-1 last:border-0 last:pb-0" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div className="flex flex-col">
                      <span style={{ color: 'var(--text-primary)' }}>{tx.msg}</span>
                      <span className="text-[7.5px]" style={{ color: 'var(--text-muted)' }}>{tx.time}</span>
                    </div>
                    <span className="font-bold" style={{ color: tx.xp.includes('+') ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {tx.xp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Verification slider drawer */}
      {selectedBounty && (
        <div className="absolute inset-0 z-40 bg-zinc-950/95 flex flex-col justify-end">
          <div className="border-t p-4 space-y-4 max-h-[90%] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border-secondary)' }}>
              <span className="text-[9px] font-mono text-zinc-550">{selectedBounty.id} // CONSENSUS</span>
              <button onClick={() => setSelectedBounty(null)} className="cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{selectedBounty.category}</h4>
              <p className="text-[9.5px]" style={{ color: 'var(--text-muted)' }}>{selectedBounty.location}</p>
              <div className="p-2.5 border rounded text-[10px] leading-relaxed font-sans" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}>
                {selectedBounty.description || 'No description notes.'}
              </div>
            </div>

            {/* Selfie Verification */}
            {selectedBounty.status === 'Peer_Review' && (
              <div className="border rounded-lg p-3 space-y-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex justify-between items-center text-[9px] font-mono font-bold" style={{ color: 'var(--accent-cyan)' }}>
                  <span>SELFIE CONFIRMATION HANDSHAKE</span>
                  <span className="animate-pulse">{(selectedBounty.verifications || []).length}/3 SIGNED</span>
                </div>

                {handshakeStep === 'idle' && (
                  <button 
                    type="button" 
                    onClick={startHandshake}
                    className="w-full py-1.5 font-bold font-mono text-[9px] uppercase rounded cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    Cast Verification Signature
                  </button>
                )}

                {handshakeStep === 'streaming' && (
                  <div className="relative rounded overflow-hidden h-36 bg-black flex flex-col justify-end">
                    <video ref={handshakeVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                    <div className="relative z-10 p-1.5 bg-zinc-950/90 flex justify-between items-center text-[8px] font-mono">
                      <span className="text-brand-cyan animate-pulse">SELFIE SCAN ACTIVE</span>
                      <button 
                        type="button" 
                        onClick={() => snapHandshake(selectedBounty.id)}
                        className="bg-brand-cyan text-zinc-950 px-2 py-0.5 rounded font-mono font-bold cursor-pointer"
                      >
                        Confirm Match
                      </button>
                    </div>
                  </div>
                )}

                {handshakeStep === 'countdown' && (
                  <div className="h-28 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-mono font-bold animate-ping" style={{ color: 'var(--accent-cyan)' }}>{handshakeCountdown}</span>
                    <p className="text-[8px] font-mono text-zinc-550 mt-1">GENERATING SECURE HASH BLOCK...</p>
                  </div>
                )}
              </div>
            )}

            {selectedBounty.progressPhoto && (
              <div className="space-y-1">
                <span className="text-[8px] font-mono uppercase tracking-widest block font-semibold" style={{ color: 'var(--text-muted)' }}>Contractor Submission Photo</span>
                <div className="w-full h-24 rounded overflow-hidden border" style={{ borderColor: 'var(--border-secondary)' }}>
                  <img src={selectedBounty.progressPhoto} alt="Progress completion evidence" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                onUpvoteIncident(selectedBounty.id);
                onUpdateKarma(10);
                addKarmaLog(`Cast Consensus Upvote: ${selectedBounty.id}`, '+10 XP');
                setSelectedBounty(prev => prev ? { ...prev, upvotes: prev.upvotes + 1 } : null);
              }}
              className="w-full py-1.5 border rounded text-[9.5px] font-mono cursor-pointer transition-colors"
              style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
            >
              Upvote Issue ({selectedBounty.upvotes} Votes)
            </button>
          </div>
        </div>
      )}

      {/* Footer Navigation Bar */}
      <div className="absolute bottom-0 inset-x-0 h-14 border-t grid grid-cols-3 z-35 select-none" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
        <button
          onClick={() => { setActiveTab('marketplace'); setSelectedBounty(null); stopCamera(); }}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all animate-pulse"
          style={{ color: activeTab === 'marketplace' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
        >
          <Coins className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase font-bold tracking-widest">Market</span>
        </button>

        <button
          onClick={() => { setActiveTab('report'); setSelectedBounty(null); startCamera(); }}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all animate-pulse"
          style={{ color: activeTab === 'report' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase font-bold tracking-widest">Report</span>
        </button>

        <button
          onClick={() => { setActiveTab('ledger'); setSelectedBounty(null); stopCamera(); }}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
          style={{ color: activeTab === 'ledger' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
        >
          <Award className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase font-bold tracking-widest">Karma</span>
        </button>
      </div>
    </div>
  );
};
