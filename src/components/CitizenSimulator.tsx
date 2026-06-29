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
  const [reportLocation, setReportLocation] = useState('5th Ave & 23rd St');
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

  // Camera simulation state
  const [cameraEngaged, setCameraEngaged] = useState<boolean>(false);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraAnimationRef = useRef<number | null>(null);

  // AI Pipeline Toggles: stage 1 (Enhance) & stage 2 (Translate)
  const [aiEnhanceActive, setAiEnhanceActive] = useState<boolean>(true);
  const [aiTranslateActive, setAiTranslateActive] = useState<boolean>(false);
  const [selectedDialect, setSelectedDialect] = useState<string>('Telugu');

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
    // Handled in simulation
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
          
          // Map to simulated coordinates
          const simulatedX = parseFloat((35 + Math.abs((lng * 100) % 40)).toFixed(1));
          const simulatedY = parseFloat((35 + Math.abs((lat * 100) % 40)).toFixed(1));
          setReportX(simulatedX);
          setReportY(simulatedY);
          setReportLocation(`${lat.toFixed(4)} N, ${lng.toFixed(4)} E`);
        },
        (err) => {
          console.warn("Geolocation access denied. Setting default grid coordinates.", err);
          setGeoCoords({ lat: 17.4501, lng: 78.5252 });
          setGeoError("Perms blocked - default seed coordinates injected");
        }
      );
    } else {
      setGeoCoords({ lat: 17.4501, lng: 78.5252 });
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

  // Simulated Camera Drawing Animation
  useEffect(() => {
    if (!cameraEngaged) {
      if (cameraAnimationRef.current) {
        cancelAnimationFrame(cameraAnimationRef.current);
      }
      return;
    }

    const canvas = cameraCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let scanLineY = 0;
    let scanDirection = 1;

    const drawSimulatedCamera = () => {
      if (!canvas || !ctx) return;
      
      // Draw background noise/colors
      ctx.fillStyle = isDark ? '#091214' : '#F0F4F4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw horizontal static lines
      ctx.strokeStyle = isDark ? 'rgba(0, 255, 204, 0.05)' : 'rgba(10, 70, 228, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw scanning laser line
      ctx.strokeStyle = isDark ? 'rgba(0, 255, 204, 0.6)' : 'rgba(10, 70, 228, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(canvas.width, scanLineY);
      ctx.stroke();

      // Pulsing crosshair
      ctx.strokeStyle = isDark ? 'var(--accent-cyan)' : 'var(--border-primary)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Center circle
      ctx.arc(canvas.width / 2, canvas.height / 2, 24 + Math.sin(Date.now() * 0.005) * 4, 0, Math.PI * 2);
      // Cross hair hairs
      ctx.moveTo(canvas.width / 2 - 35, canvas.height / 2);
      ctx.lineTo(canvas.width / 2 - 10, canvas.height / 2);
      ctx.moveTo(canvas.width / 2 + 10, canvas.height / 2);
      ctx.lineTo(canvas.width / 2 + 35, canvas.height / 2);
      ctx.moveTo(canvas.width / 2, canvas.height / 2 - 35);
      ctx.lineTo(canvas.width / 2, canvas.height / 2 - 10);
      ctx.moveTo(canvas.width / 2, canvas.height / 2 + 10);
      ctx.lineTo(canvas.width / 2, canvas.height / 2 + 35);
      ctx.stroke();

      // Simulated HUD stats
      ctx.fillStyle = isDark ? '#00FFCC' : '#0A46E4';
      ctx.font = '7.5px monospace';
      ctx.fillText('HDR HIGH-RES FOCUS', 12, 18);
      ctx.fillText(`GPS SYNC: ${geoCoords?.lat.toFixed(4) || '17.4501'}, ${geoCoords?.lng.toFixed(4) || '78.5252'}`, 12, 28);
      ctx.fillText('STABILIZER NOMINAL', canvas.width - 95, 18);
      
      // Update scanline
      scanLineY += 2.5 * scanDirection;
      if (scanLineY >= canvas.height || scanLineY <= 0) {
        scanDirection *= -1;
      }

      cameraAnimationRef.current = requestAnimationFrame(drawSimulatedCamera);
    };

    drawSimulatedCamera();

    return () => {
      if (cameraAnimationRef.current) {
        cancelAnimationFrame(cameraAnimationRef.current);
      }
    };
  }, [cameraEngaged, isDark, geoCoords]);

  // Capture action simulation
  const capturePhotoAction = () => {
    setIsVisionScanning(true);
    setCameraEngaged(false);
    setTimeout(() => {
      setIsVisionScanning(false);
      // Map mock photos
      if (reportCategory === 'Road & Structural Damage') {
        setReportImage('/road_pothole.png');
      } else if (reportCategory === 'Water Outage & Flooding') {
        setReportImage('/water_main_burst.png');
      } else {
        setReportImage('/downed_power_line.png');
      }
    }, 1200);
  };

  // Vision Simulator Preset triggers
  const handleSelectVisionPreset = (presetIndex: number) => {
    setIsVisionScanning(true);
    
    // Simulate image scan pulse
    setTimeout(() => {
      setIsVisionScanning(false);
      
      if (presetIndex === 0) {
        setReportCategory('Road & Structural Damage');
        setReportSeverity('Moderate');
        setReportImage('/road_pothole.png');
        setReportNotes('Severe road pothole and tarmac damage parsed on main thoroughfare corridor.');
      } else if (presetIndex === 1) {
        setReportCategory('Water Outage & Flooding');
        setReportSeverity('Critical');
        setReportImage('/water_main_burst.png');
        setReportNotes('High pressure water pipeline rupture causing heavy localized street flooding.');
      } else {
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
          ctx.fillStyle = isDark ? '#111A1C' : '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.strokeStyle = isDark ? '#00FFCC' : '#0A46E4';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          for (let i = 0; i < canvas.width; i++) {
            const amp = Math.sin(i * 0.08 + step) * (10 + Math.random() * 10);
            ctx.lineTo(i, canvas.height / 2 + amp);
          }
          ctx.stroke();
          
          step += 0.25;
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
      let text = '';
      let badge: string | null = null;

      // Category-aware templates
      if (reportCategory === 'Water Outage & Flooding') {
        const rawText = "nillu ostaledu road motham paadaipoindi water burst aindi";
        const enhancedText = "A high-pressure water pipeline rupture has occurred near the intersection, causing substantial street flooding and blocking pedestrian crosswalks.";
        text = aiEnhanceActive ? enhancedText : rawText;
        badge = aiTranslateActive ? `[Translated from ${selectedDialect} to English]` : null;
      } else if (reportCategory === 'Road & Structural Damage') {
        const rawText = "road kharab hogaya pura pothole pad gaya hai";
        const enhancedText = "Severe asphalt erosion and road pothole fractures detected, leading to traffic slowing and hazardous driving conditions.";
        text = aiEnhanceActive ? enhancedText : rawText;
        badge = aiTranslateActive ? `[Translated from ${selectedDialect} to English]` : null;
      } else {
        const rawText = "electricity wires nunchi nippulu ostunayi danger";
        const enhancedText = "Damaged utility line short-circuit causing active electrical sparks near the station entrance, posing an immediate hazard.";
        text = aiEnhanceActive ? enhancedText : rawText;
        badge = aiTranslateActive ? `[Translated from ${selectedDialect} to English]` : null;
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

    // Calculate dynamic BOM lists and costs based on category
    let materialsList: string[] = ["General Safety Barrier", "Repair Toolkit Rental"];
    let costObj = { materials: 100, labor: 150, total: 250 };

    if (reportCategory === 'Water Outage & Flooding') {
      materialsList = ["3-inch PVC High-Pressure Clamps", "Industrial De-watering Pump rental", "Crushed Gravel Bedding (2 Tons)"];
      costObj = { materials: 450, labor: 350, total: 800 };
    } else if (reportCategory === 'Road & Structural Damage') {
      materialsList = ["Asphalt Patch Compound (5 Bags)", "Traffic Safety Cones (4 units)", "Compaction Rammer Rental"];
      costObj = { materials: 150, labor: 200, total: 350 };
    } else if (reportCategory === 'Utility & Spark Hazard') {
      materialsList = ["High-Voltage Insulation Tape", "Ceramic Insulator Bushings (2 units)", "Grid Diagnostics Meter Rental"];
      costObj = { materials: 600, labor: 400, total: 1000 };
    }

    const logs = [
      '⚡ [ZELUS-ORCHESTRATOR] INITIATING COMPLAINT RECORD...',
      '🔍 [AEGIS-AGENT] Checking duplicate node signatures...',
      '🟢 [AEGIS-AGENT] Exif matched, zero fraud flags identified.',
      `📍 [ATLAS-AGENT] Mapping geospatial vectors: Lat: ${geoCoords?.lat.toFixed(5) || '17.4501'} Lng: ${geoCoords?.lng.toFixed(5) || '78.5252'}`,
      '📦 [HELIOS-AGENT] Projecting Material list & Bills of Materials (BOM)...',
      `💰 [HELIOS-AGENT] Allocated cost target: Materials $${costObj.materials} Labor $${costObj.labor} Total $${costObj.total}`,
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
            geolocation: geoCoords || { lat: 17.4501, lng: 78.5252 },
            exifVerified: true,
            hash: generatedHash,
            materials: materialsList,
            costBreakdown: costObj
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
          <div className="space-y-4 animate-slide-down">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-tight flex items-center gap-2 animate-pulse" style={{ color: 'var(--text-primary)' }}>
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
              <div className="space-y-3">
                {activeClaims.map(inc => {
                  const verifiedCount = inc.verifications?.length || 0;
                  const isPeer = inc.status === 'Peer_Review';
                  
                  // Calculate dynamic matched sponsor pool
                  const matchTarget = inc.costBreakdown?.total || 500;
                  const upvoteFunding = inc.upvotes * 15;
                  const matchAmount = Math.min(matchTarget, Math.floor(matchTarget * 0.4 + upvoteFunding));
                  const matchPercent = Math.min(100, Math.floor((matchAmount / matchTarget) * 100));

                  return (
                    <div 
                      key={inc.id}
                      onClick={() => setSelectedBounty(inc)}
                      className="border rounded-lg p-3.5 space-y-3 cursor-pointer transition-all hover:scale-[1.01] hover:border-brand-cyan/40 bg-zinc-950/20"
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
                              <span className="text-[7.5px] border px-1 rounded font-mono" style={{ borderColor: 'var(--border-primary)', color: 'var(--accent-cyan)' }}>
                                {inc.languageBadge}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                            {inc.category}
                          </h4>
                          <span className="text-[9px] flex items-center gap-0.5 mt-0.5 truncate font-mono" style={{ color: 'var(--text-muted)' }}>
                            <MapPin className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
                            {inc.location}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono border font-semibold" style={{
                          backgroundColor: inc.severity === 'Critical' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 204, 0, 0.1)',
                          borderColor: inc.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-amber)',
                          color: inc.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-amber)'
                        }}>
                          {inc.severity}
                        </span>
                      </div>

                      {/* Matching pool progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-end text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          <span>Matching Sponsorships</span>
                          <span style={{ color: 'var(--text-primary)' }}>${matchAmount} / ${matchTarget} ({matchPercent}%)</span>
                        </div>
                        <div className="w-full h-1 rounded-full overflow-hidden border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${matchPercent}%`, backgroundColor: 'var(--accent-cyan)' }} />
                        </div>
                      </div>

                      {/* Upvotes / verification confirmations count */}
                      <div className="flex justify-between items-center text-[9px] font-mono pt-1">
                        <span style={{ color: 'var(--text-muted)' }}>
                          Votes: <strong style={{ color: 'var(--text-primary)' }}>{inc.upvotes} Consensus</strong>
                        </span>
                        <span className="uppercase tracking-widest font-extrabold text-[8px] border px-1.5 py-0.5 rounded" 
                              style={{ 
                                borderColor: isPeer ? 'var(--accent-amber)' : 'var(--border-secondary)',
                                color: isPeer ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                                backgroundColor: 'var(--bg-secondary)'
                              }}>
                          {isPeer ? `VERIFYING (${verifiedCount}/3)` : inc.status.replace(/_/g, ' ')}
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
          <div className="space-y-4 animate-slide-down">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-tight flex items-center gap-2 animate-pulse" style={{ color: 'var(--text-primary)' }}>
                <Camera className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
                Hyperlocal Report Engine
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Automated GPS triangulation and multi-modal voice processing dispatches.
              </p>
            </div>

            {/* Presets simulating vision input */}
            <div className="space-y-1.5 p-2.5 rounded border" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
              <span className="text-[8px] font-mono uppercase tracking-wider block font-bold" style={{ color: 'var(--text-muted)' }}>
                GEMINI VISION SIMULATION PRESETS:
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button 
                  type="button" 
                  onClick={() => handleSelectVisionPreset(0)}
                  className="px-1.5 py-1 text-[8px] font-mono border rounded hover:bg-zinc-800/10 cursor-pointer truncate text-center font-bold"
                  style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                >
                  [ pothole.png ]
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSelectVisionPreset(1)}
                  className="px-1.5 py-1 text-[8px] font-mono border rounded hover:bg-zinc-800/10 cursor-pointer truncate text-center font-bold"
                  style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                >
                  [ leak_burst.png ]
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSelectVisionPreset(2)}
                  className="px-1.5 py-1 text-[8px] font-mono border rounded hover:bg-zinc-800/10 cursor-pointer truncate text-center font-bold"
                  style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                >
                  [ streetlight.png ]
                </button>
              </div>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              {/* Photo Uplink Frame with canvas camera simulation */}
              <div className="border rounded-lg relative overflow-hidden flex flex-col justify-center items-center min-h-[160px] bg-zinc-950" style={{ borderColor: 'var(--border-secondary)' }}>
                {isVisionScanning && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center space-y-2 z-30">
                    <Sparkles className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-cyan)' }} />
                    <span className="text-[9px] font-mono animate-pulse" style={{ color: 'var(--accent-cyan)' }}>
                      [GEMINI-VISION-ORCHESTRATOR] // SCANNING DATA...
                    </span>
                  </div>
                )}

                {cameraEngaged ? (
                  <div className="absolute inset-0 z-20 flex flex-col justify-between">
                    <canvas ref={cameraCanvasRef} width={300} height={160} className="absolute inset-0 w-full h-full object-cover" />
                    
                    {/* Blinking engaged tag */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/75 px-2 py-0.5 rounded border border-emerald-500/30 text-[7.5px] font-mono text-emerald-400 font-extrabold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      FEED ENGAGED
                    </div>

                    <div className="absolute bottom-2 inset-x-2 flex gap-1.5 z-30">
                      <button
                        type="button"
                        onClick={capturePhotoAction}
                        className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[9px] rounded shadow-md cursor-pointer border border-emerald-400/20"
                      >
                        [ Capture Photo ]
                      </button>
                      <button
                        type="button"
                        onClick={() => setCameraEngaged(false)}
                        className="py-1 px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[9px] rounded hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {reportImage ? (
                  <>
                    <img src={reportImage} alt="Visual preset" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="relative z-10 p-2 border-t w-full flex justify-between items-center text-[8.5px] font-mono mt-auto" style={{ backgroundColor: 'rgba(9, 15, 16, 0.95)', borderColor: 'var(--border-secondary)' }}>
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
                  !cameraEngaged && (
                    <div className="flex flex-col items-center justify-center p-8 space-y-3">
                      <Camera className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                      <button
                        type="button"
                        onClick={() => setCameraEngaged(true)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white border text-[9px] font-mono font-bold rounded cursor-pointer transition-all"
                        style={{ borderColor: 'var(--border-secondary)' }}
                      >
                        Connect Hardware Camera
                      </button>
                      <span className="text-[7.5px] font-mono" style={{ color: 'var(--text-muted)' }}>Click above or choose preset simulation</span>
                    </div>
                  )
                )}
              </div>

              {/* Form parameters */}
              <div className="space-y-3">
                {/* Geolocation target chips */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                    Automated GPS Geolocation Engine
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border rounded px-2.5 py-1.5 flex items-center justify-between text-[9.5px] font-mono" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>LATITUDE:</span>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{geoCoords?.lat.toFixed(6) || 'Searching...'}</strong>
                    </div>
                    <div className="border rounded px-2.5 py-1.5 flex items-center justify-between text-[9.5px] font-mono" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>LONGITUDE:</span>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{geoCoords?.lng.toFixed(6) || 'Searching...'}</strong>
                    </div>
                  </div>
                  {geoError && (
                    <span className="text-[7.5px] font-mono block" style={{ color: 'var(--accent-amber)' }}>{geoError}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-wider mb-1 font-bold" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => {
                      setReportCategory(e.target.value);
                      if (e.target.value === 'Water Outage & Flooding') setReportSeverity('Critical');
                      else if (e.target.value === 'Road & Structural Damage') setReportSeverity('Moderate');
                      else setReportSeverity('Low');
                    }}
                    className="w-full border rounded px-2.5 py-1.5 text-[10px] font-mono"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                  >
                    <option value="Road & Structural Damage">Road & Structural Damage</option>
                    <option value="Water Outage & Flooding">Water Outage & Flooding</option>
                    <option value="Utility & Spark Hazard">Utility & Spark Hazard</option>
                  </select>
                </div>

                {/* Multilingual Acoustic AI Pipeline */}
                <div className="space-y-2 border rounded p-2.5" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] font-mono block font-extrabold" style={{ color: 'var(--text-primary)' }}>
                      Multilingual Acoustic Pipeline
                    </span>
                    <button
                      type="button"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      disabled={transcribing}
                      className={`px-2 py-1 rounded border text-[8px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        isRecording ? 'border-red-500 bg-red-500/10 text-red-400 animate-pulse' : 'border-zinc-800 text-brand-cyan hover:border-zinc-700'
                      }`}
                      style={{
                        borderColor: isRecording ? 'var(--accent-red)' : 'var(--border-primary)',
                        color: isRecording ? 'var(--accent-red)' : 'var(--accent-cyan)'
                      }}
                    >
                      <Mic className="w-2.5 h-2.5 animate-pulse" />
                      {isRecording ? `STOP (${recordingTime}s)` : transcribing ? 'Transcribing...' : 'Record Note'}
                    </button>
                  </div>

                  {isRecording && (
                    <div className="space-y-1">
                      <canvas ref={voiceCanvasRef} width={300} height={32} className="w-full h-8 rounded border" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }} />
                      <div className="text-[7.5px] font-mono text-zinc-400 text-center animate-pulse">RECORDING ACTIVE SPEECH DATA...</div>
                    </div>
                  )}

                  {/* Dual stage Switch */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                    <span className="text-[8px] font-mono uppercase tracking-wider block font-bold" style={{ color: 'var(--text-muted)' }}>
                      Gemini AI Enhance & Translate configurations
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiEnhanceActive(prev => !prev)}
                        className={`py-1 text-[8.5px] font-mono rounded text-center border font-bold cursor-pointer transition-all ${
                          aiEnhanceActive ? 'bg-zinc-900 border-current shadow-inner' : 'opacity-60'
                        }`}
                        style={{
                          borderColor: aiEnhanceActive ? 'var(--accent-cyan)' : 'var(--border-secondary)',
                          color: aiEnhanceActive ? 'var(--accent-cyan)' : 'var(--text-muted)'
                        }}
                      >
                        STG 1: ENHANCE {aiEnhanceActive ? 'ON' : 'OFF'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiTranslateActive(prev => !prev)}
                        className={`py-1 text-[8.5px] font-mono rounded text-center border font-bold cursor-pointer transition-all ${
                          aiTranslateActive ? 'bg-zinc-900 border-current shadow-inner' : 'opacity-60'
                        }`}
                        style={{
                          borderColor: aiTranslateActive ? 'var(--accent-cyan)' : 'var(--border-secondary)',
                          color: aiTranslateActive ? 'var(--accent-cyan)' : 'var(--text-muted)'
                        }}
                      >
                        STG 2: TRANSLATE {aiTranslateActive ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    {aiTranslateActive && (
                      <div className="flex items-center justify-between text-[8px] font-mono border-t pt-1.5" style={{ borderColor: 'var(--border-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>SELECT SOURCE DIALECT:</span>
                        <select
                          value={selectedDialect}
                          onChange={(e) => setSelectedDialect(e.target.value)}
                          className="bg-zinc-900 border rounded px-1 text-[8px] font-mono"
                          style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                        >
                          <option value="Telugu">Telugu</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Spanish">Spanish</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description notes */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
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
                    <div className="flex items-center gap-1 text-[8.5px] font-mono text-brand-cyan uppercase tracking-wider mt-1 font-bold">
                      <Languages className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
                      <span>{languageBadge}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Report */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 font-bold font-mono text-[10px] tracking-wider uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg border hover:brightness-110 active:scale-[0.99]"
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
              <div className="absolute inset-0 z-50 p-4 font-mono text-[9px] flex flex-col" style={{ backgroundColor: 'rgba(9, 15, 16, 0.98)', color: 'var(--accent-cyan)' }}>
                <div className="flex items-center gap-1.5 border-b pb-2 mb-3" style={{ borderColor: 'var(--border-secondary)' }}>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-white font-bold uppercase tracking-widest text-[9.5px]">Zelus Swarm Triage dispatch</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {cliLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('SUCCESS') || log.includes('🟢') ? 'text-emerald-400 font-bold' : 'text-zinc-350'}>
                      {log}
                    </div>
                  ))}
                  <span className="w-1.5 h-3 inline-block bg-current animate-pulse" />
                </div>
              </div>
            )}

            {/* Success alert screen */}
            {showSuccessAlert && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 p-5 border rounded-xl text-center shadow-2xl z-40 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce" style={{ color: 'var(--accent-cyan)' }} />
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
                  className="w-full py-1.5 bg-zinc-900 border rounded text-[9.5px] font-mono font-bold cursor-pointer transition-colors hover:bg-zinc-800 text-white"
                  style={{ borderColor: 'var(--border-secondary)' }}
                >
                  Return to Marketplace
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CIVIC KARMA LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-4 animate-slide-down">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-tight flex items-center gap-2 animate-pulse" style={{ color: 'var(--text-primary)' }}>
                <Award className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
                Civic Karma Ledger
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Official volunteer credit balance and status badge credentials.
              </p>
            </div>

            {/* Progression Radial Progress bar */}
            <div className="border rounded-lg p-5 flex items-center justify-between shadow-lg bg-zinc-950/10" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
              <div className="space-y-1.5 flex-1 pr-4">
                <span className="text-[8px] font-mono uppercase tracking-wider block font-bold" style={{ color: 'var(--text-muted)' }}>
                  Karma XP Progression
                </span>
                <h4 className="text-sm font-extrabold font-sans" style={{ color: 'var(--text-primary)' }}>
                  {session.username}
                </h4>
                <p className="text-[9px] uppercase font-bold tracking-widest font-mono" style={{ color: 'var(--accent-cyan)' }}>
                  {session.karmaXP >= 220 ? 'INFRASTRUCTURE GUARD' : 'WATER WATCHER'}
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
              <span className="text-[9px] font-mono uppercase tracking-wider block font-bold font-semibold" style={{ color: 'var(--text-muted)' }}>
                System Badges
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="border p-2.5 rounded-lg flex flex-col justify-between h-20 transition-all bg-zinc-950/15" style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-secondary)',
                  opacity: session.karmaXP >= 100 ? 1 : 0.4
                }}>
                  <Award className="w-4 h-4" style={{ color: session.karmaXP >= 100 ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                  <div>
                    <span className="text-[9.5px] font-bold block text-white" style={{ color: 'var(--text-primary)' }}>Water Watcher</span>
                    <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>Initial badge unlocked</span>
                  </div>
                </div>

                <div className="border p-2.5 rounded-lg flex flex-col justify-between h-20 transition-all bg-zinc-950/15" style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-secondary)',
                  opacity: session.karmaXP >= 220 ? 1 : 0.4
                }}>
                  <Award className="w-4 h-4" style={{ color: session.karmaXP >= 220 ? 'var(--accent-amber)' : 'var(--text-muted)' }} />
                  <div>
                    <span className="text-[9.5px] font-bold block text-white" style={{ color: 'var(--text-primary)' }}>Infrastructure Guard</span>
                    <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>Active reporter status</span>
                  </div>
                </div>
              </div>
            </div>

            {/* XP log audit ledger */}
            <div className="border rounded-lg p-3 space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
              <span className="text-[8.5px] font-mono uppercase tracking-wider block font-bold" style={{ color: 'var(--text-muted)' }}>
                XP VERIFICATION TIMELINE AUDIT
              </span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {karmaTransactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center text-[9px] font-mono border-b pb-1 last:border-0 last:pb-0" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div className="flex flex-col">
                      <span style={{ color: 'var(--text-primary)' }}>{tx.msg}</span>
                      <span className="text-[7.5px]" style={{ color: 'var(--text-muted)' }}>{tx.time}</span>
                    </div>
                    <span className="font-extrabold text-[8.5px]" style={{ color: tx.xp.includes('+') ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
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
              <h4 className="text-xs font-bold text-white" style={{ color: 'var(--text-primary)' }}>{selectedBounty.category}</h4>
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
                    className="w-full py-1.5 font-bold font-mono text-[9px] uppercase rounded cursor-pointer transition-all"
                    style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    Cast Verification Signature (+30 XP)
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
                <span className="text-[8px] font-mono uppercase tracking-widest block font-bold" style={{ color: 'var(--text-muted)' }}>Contractor Submission Photo</span>
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
              className="w-full py-2 border rounded text-[9.5px] font-mono font-bold cursor-pointer transition-colors hover:bg-zinc-800 text-white"
              style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}
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
          className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
          style={{ color: activeTab === 'marketplace' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
        >
          <Coins className="w-4 h-4 animate-pulse" />
          <span className="text-[8px] font-mono uppercase font-bold tracking-widest">Market</span>
        </button>

        <button
          onClick={() => { setActiveTab('report'); setSelectedBounty(null); startCamera(); }}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
          style={{ color: activeTab === 'report' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
        >
          <Camera className="w-4 h-4 animate-pulse" />
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
