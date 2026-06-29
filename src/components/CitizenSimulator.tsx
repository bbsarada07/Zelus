import React, { useState, useEffect, useRef } from 'react';
import type { Incident, UserSession, Theme } from '../types';
import { 
  Camera, 
  MapPin, 
  ThumbsUp, 
  Award, 
  Wifi, 
  Battery, 
  Terminal, 
  CheckCircle,
  PlusCircle,
  X,
  Map,
  Mic,
  RefreshCw,
  ShieldCheck,
  Wrench,
  Send,
  Hourglass,
  Clock,
  Coins
} from 'lucide-react';

interface CitizenSimulatorProps {
  incidents: Incident[];
  onAddIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'>) => void;
  onUpvoteIncident: (id: string) => void;
  onAuthorizeDispatch?: (id: string) => void;
  session: UserSession;
  onUpdateKarma: (xp: number) => void;
  isStandaloneMobile?: boolean;
  theme?: Theme;
  onConfirmResolution?: (id: string, verification: { name: string; timestamp: string; photo: string }) => void;
}
const CitizenClaimCountdown: React.FC<{ targetTime: number }> = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  useEffect(() => {
    const update = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00 - ETA EXCEEDED');
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [targetTime]);
  return <span className="font-mono font-bold text-brand-amber">{timeLeft}</span>;
};


export const CitizenSimulator: React.FC<CitizenSimulatorProps> = ({
  incidents,
  onAddIncident,
  onUpvoteIncident,
  onAuthorizeDispatch,
  session,
  onUpdateKarma,
  isStandaloneMobile = false,
  theme: _theme = 'dark',
  onConfirmResolution,
}) => {
  // Mobile UI screens: 'map' | 'report' | 'profile'
  const [activeTab, setActiveTab] = useState<'map' | 'report' | 'profile'>('map');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Form State
  const [reportCategory, setReportCategory] = useState('Road & Structural Damage');
  const [reportLocation, setReportLocation] = useState('Central Avenue (Corner Plaza)');
  const [reportX, setReportX] = useState(50);
  const [reportY, setReportY] = useState(50);
  const [reportNotes, setReportNotes] = useState('');
  const [reportImage, setReportImage] = useState('/road_pothole.png');

  // Terminal AI Simulation States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [cliLogs, setCliLogs] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Hardware APIs & Stream States
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Camera States
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Peer Handshake verification states
  const handshakeVideoRef = useRef<HTMLVideoElement | null>(null);
  const [handshakeStep, setHandshakeStep] = useState<'idle' | 'streaming' | 'countdown' | 'completed'>('idle');
  const [handshakeCountdown, setHandshakeCountdown] = useState(2);
  const handshakeStreamRef = useRef<MediaStream | null>(null);

  const startHandshakeCamera = async () => {
    try {
      if (handshakeStreamRef.current) {
        handshakeStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 }
      });
      handshakeStreamRef.current = stream;
      if (handshakeVideoRef.current) {
        handshakeVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Handshake camera fail:", err);
      // Fallback
      setHandshakeStep('countdown');
      if (selectedIncident) {
        runHandshakeCountdown(selectedIncident.id);
      }
    }
  };

  const snapHandshakePhoto = (incidentId: string) => {
    if (handshakeStreamRef.current) {
      handshakeStreamRef.current.getTracks().forEach(t => t.stop());
      handshakeStreamRef.current = null;
    }
    setHandshakeStep('countdown');
    runHandshakeCountdown(incidentId);
  };

  const runHandshakeCountdown = (incidentId: string) => {
    setHandshakeCountdown(2);
    let count = 2;
    const interval = setInterval(() => {
      count--;
      setHandshakeCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setHandshakeStep('idle');
        
        // Generate mock signature
        const newVerification = {
          name: `Citizen Hero #${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: 'Just Now',
          photo: ''
        };

        if (onConfirmResolution) {
          onConfirmResolution(incidentId, newVerification);
        }

        onUpdateKarma(30);

        setSelectedIncident(prev => {
          if (!prev || prev.id !== incidentId) return prev;
          const updatedVerifications = [...(prev.verifications || []), newVerification];
          const isFull = updatedVerifications.length >= 3;
          return {
            ...prev,
            verifications: updatedVerifications,
            status: isFull ? 'Resolved' : prev.status
          };
        });
      }
    }, 1000);
  };

  // cleanup handshake stream on unmount
  useEffect(() => {
    return () => {
      if (handshakeStreamRef.current) {
        handshakeStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Geolocation Init
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latVal = position.coords.latitude;
          const lngVal = position.coords.longitude;
          setGpsCoords({ lat: latVal, lng: lngVal });
          
          // Map to standard [15-85] grid coordinates
          const xGrid = 20 + Math.abs((lngVal * 100) % 60);
          const yGrid = 20 + Math.abs((latVal * 100) % 60);
          setReportX(parseFloat(xGrid.toFixed(1)));
          setReportY(parseFloat(yGrid.toFixed(1)));
          setReportLocation(`GeoLoc: [${latVal.toFixed(6)}°, ${lngVal.toFixed(6)}]`);
        },
        (error) => {
          console.warn("Geolocation permission or availability failed. Mocking base station coordinates.", error);
          setGpsCoords({ lat: 40.7128, lng: -74.0060 });
        }
      );
    } else {
      setGpsCoords({ lat: 40.7128, lng: -74.0060 });
    }
  }, []);

  // Camera Management
  const startCamera = React.useCallback(async () => {
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (!navigator.mediaDevices) {
        throw new Error("navigator.mediaDevices is undefined");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 480, height: 360 } 
      });
      cameraStreamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Could not access camera stream:", err);
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = React.useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Bind camera stream to video element when active and mounted
  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [isCameraActive]);

  useEffect(() => {
    if (activeTab === 'report' && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, capturedPhoto, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && cameraStreamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 480;
      canvas.height = videoRef.current.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
        setReportImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setReportImage('');
    startCamera();
  };

  // Audio Recording & Glowing Visualizer Management
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.start();
      setIsRecording(true);

      setTimeout(() => {
        drawWave();
      }, 50);
    } catch (err) {
      console.warn("Audio access failed:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(t => t.stop());
      setAudioStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsRecording(false);

    simulateWhisperTranscription();
  };

  const drawWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      if (!ctx || !analyser) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgba(5, 5, 5, 0.4)';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#00E5FF';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00E5FF';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    draw();
  };

  const simulateWhisperTranscription = () => {
    setIsAiLoading(true);
    setCliLogs([]);
    
    const categoryTranscriptions: Record<string, string> = {
      'Road & Structural Damage': "Large structural fracture and pavement subsidence noticed here. The asphalt is cracking, causing driver deceleration. Immediate repairs required.",
      'Water Outage & Flooding': "Substantial water pipe leak detected with localized street accumulation. Hydration systems compromised. Urgent plumbing dispatch required.",
      'Utility & Spark Hazard': "High-voltage distribution cable exposure with electrical flashover risk. Sparks observed near foliage. Critical fire danger.",
    };

    const transcriptText = categoryTranscriptions[reportCategory] || "Emergency civic distress report recorded via real-time vocal telemetry. Audio integrity verified by regional node. Awaiting dispatcher response.";

    const logs = [
      '🎤 [MIC] AUDIO STREAM CAPTURE TERMINATED SUCCESSFULLY.',
      '📦 [BUFFER] Extracting audio stream byte chunks...',
      '🔍 [SPEECH] Initializing Whisper speech-to-text pipeline...',
      '📡 [CLOUD] Streaming telemetry to regional AI model...',
      '🤖 [MODEL] Processing waveforms & filtering noise profiles...',
      '📝 [TRANSCRIPTION] Output generated: "' + transcriptText + '"',
      '✅ [SUCCESS] Observation field populated dynamically.'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setCliLogs((prev) => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsAiLoading(false);
          setReportNotes(transcriptText);
        }, 500);
      }
    }, 250);
  };

  // Pre-configured incident options for demo
  const reportPresets = [
    {
      category: 'Road & Structural Damage',
      image: '/road_pothole.png',
      location: 'West End Drive (Near Metro Station)',
      notes: 'Major tarmac collapse. Needs immediate asphalt patching.',
    },
    {
      category: 'Water Outage & Flooding',
      image: '/water_main_burst.png',
      location: '5th Avenue & E 12th St',
      notes: 'Water main rupture. Heavy flooding on road lanes.',
    },
    {
      category: 'Utility & Spark Hazard',
      image: '/downed_power_line.png',
      location: 'Broadway & W 46th St',
      notes: 'Dangling live cables from pole. High spark risk.',
    }
  ];

  const handleSelectPreset = (idx: number) => {
    const preset = reportPresets[idx];
    setReportCategory(preset.category);
    setReportImage(preset.image);
    setCapturedPhoto(preset.image);
    setReportLocation(preset.location);
    setReportNotes(preset.notes);
    // Add random coordinates to make it interactive on the map
    setReportX(Math.floor(Math.random() * 60) + 20);
    setReportY(Math.floor(Math.random() * 60) + 20);
    stopCamera();
  };

  // Submit flow with terminal simulation logs
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiLoading(true);
    setCliLogs([]);
    setShowSuccess(false);

    const generatedHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()}`;

    const logs = [
      '⚡ [SYSTEM] INITIATING AI HYPERLOCAL CIVIC PARSING ENGINE...',
      '🔍 [INFO] Analyzing uploaded multi-spectral visual image matrix...',
      `📸 [MATCH] Hazard fingerprint identified as "${reportCategory}"`,
      '📍 [GPS] Triangulating geofence coordinate boundaries: [' + reportX + ', ' + reportY + ']',
      '🛡️ [SECURITY] Running multi-modal anti-fraud validation...',
      '📷 [METADATA] Checking EXIF integrity...',
      '🟢 [VALIDATION] High confidence matching. Device signatures verify.',
      '🌐 [LEDGER] Generating SHA-256 blockchain audit node...',
      `🔐 [BLOCKCHAIN] Generated hash: ${generatedHash.slice(0, 24)}...`,
      '💾 [CONTROL] Writing verified incident log to municipal backend database...',
      '📡 [SYNC] Synchronized live with Municipal Dashboard...',
      '🏁 [SUCCESS] Ticket committed successfully. Dispatch alert triggered.'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setCliLogs((prev) => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsAiLoading(false);
          setShowSuccess(true);
          // Push new incident dynamically to global state
          onAddIncident({
            category: reportCategory,
            location: reportLocation,
            coordinates: [reportX, reportY],
            severity: Math.random() > 0.5 ? 'Critical' : 'Moderate',
            status: 'Triage',
            upvotes: 1,
            image: reportImage || '/road_pothole.png',
            notes: reportNotes || 'AI validated civic report submission.',
            geolocation: gpsCoords || { lat: 40.7128, lng: -74.0060 },
            exifVerified: true,
            hash: generatedHash
          });
          onUpdateKarma(50); // Submit earns 50 XP
          // Reset form to default
          setReportNotes('');
          setCapturedPhoto(null);
          setReportImage('/road_pothole.png');
        }, 600);
      }
    }, 220);
  };

  return (
    <div className={`select-none ${isStandaloneMobile ? 'w-full max-w-sm mx-auto' : 'w-[360px] h-[720px] shrink-0'}`}>
      
      {/* Smartphone Device Mockup Shell */}
      <div className="w-full h-full bg-zinc-950 border-[6px] border-zinc-800 rounded-[36px] shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,255,0.05)] flex flex-col overflow-hidden relative">
        
        {/* Device Notch & Speaker */}
        <div className="absolute top-0 inset-x-0 h-6 bg-zinc-950 flex justify-center items-center z-50">
          <div className="w-28 h-4 bg-zinc-950 rounded-b-xl border-x border-b border-zinc-850 flex justify-between px-4 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            <div className="w-10 h-1 bg-zinc-800 rounded-full" />
            <span className="w-2.5 h-1.5 rounded-sm bg-zinc-800" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-10 pt-4 px-6 flex justify-between items-center text-[10px] font-mono text-zinc-400 bg-zinc-950 border-b border-zinc-900 shrink-0">
          <span>22:59</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-zinc-550" />
            <span className="text-[8px] bg-zinc-900 border border-zinc-800 px-1 py-0 rounded text-brand-emerald">5G</span>
            <Battery className="w-3.5 h-3.5 text-zinc-550" />
          </div>
        </div>

        {/* Dynamic Simulator Screens */}
        <div className="flex-1 bg-[#050505] relative overflow-hidden flex flex-col">
          
          {/* Active Tab Screen 1: GEOFENCED INTERACTIVE MAP */}
          {activeTab === 'map' && (
            <div className="flex-1 flex flex-col relative h-full">
              {/* Map Blueprint Grid */}
              <div className="flex-1 bg-zinc-950 relative overflow-hidden border-b border-zinc-900">
                {/* Visual grid gridlines representation */}
                <div className="absolute inset-0 bg-grid-lines pointer-events-none opacity-20" />
                <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />
                
                {/* Blueprint Smart City Grid SVG */}
                <svg className="absolute inset-0 w-full h-full text-zinc-900 opacity-60" fill="none">
                  <path d="M 0 50 L 360 50 M 0 150 L 360 150 M 0 250 L 360 250 M 0 350 L 360 350 M 0 450 L 360 450" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3"/>
                  <path d="M 80 0 L 80 500 M 180 0 L 180 500 M 280 0 L 280 500" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3"/>
                  {/* Grid roads representation */}
                  <rect x="30" y="40" width="20" height="420" fill="#080808" />
                  <rect x="150" y="40" width="25" height="420" fill="#080808" />
                  <rect x="290" y="40" width="20" height="420" fill="#080808" />
                  <rect x="0" y="100" width="360" height="20" fill="#080808" />
                  <rect x="0" y="280" width="360" height="25" fill="#080808" />
                </svg>

                <div className="absolute top-3 left-3 bg-zinc-900/90 border border-zinc-800 rounded px-2.5 py-1 flex items-center gap-1.5 shadow-md">
                  <Map className="w-3.5 h-3.5 text-brand-cyan" />
                  <span className="text-[10px] font-mono text-zinc-300">HQ Spatial Monitor</span>
                </div>

                {/* Glowing coordinate pins */}
                {incidents.map((incident) => {
                  if (!incident || !Array.isArray(incident.coordinates)) return null;
                  const [xPercent, yPercent] = incident.coordinates;
                  const status = incident.status;
                  let pinColor = '#00E5FF'; // Triage cyan
                  let pinBg = 'bg-brand-cyan text-zinc-950';

                  if (status === 'Resolved') {
                    pinColor = '#00E676';
                    pinBg = 'bg-brand-emerald text-zinc-950';
                  } else if (status === 'Bounty_Posted') {
                    pinColor = '#D946EF'; // fuchsia
                    pinBg = 'bg-fuchsia-500 text-white';
                  } else if (status === 'Claimed_In_Progress') {
                    pinColor = '#FF9100'; // amber
                    pinBg = 'bg-brand-amber text-zinc-950';
                  } else if (status === 'Peer_Review') {
                    pinColor = '#3B82F6'; // blue
                    pinBg = 'bg-blue-500 text-white animate-pulse';
                  } else if (status === 'Archived') {
                    pinColor = '#71717A'; // zinc
                    pinBg = 'bg-zinc-700 text-zinc-300';
                  }

                  return (
                    <button
                      key={incident.id}
                      onClick={() => setSelectedIncident(incident)}
                      style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none z-20"
                    >
                      <span className="absolute inset-0 w-8 h-8 -left-2 -top-2 rounded-full scale-110 opacity-30 animate-ping duration-1000 bg-current"
                            style={{ color: pinColor }} />
                      <div 
                        className={`w-4 h-4 rounded-full border border-zinc-950 flex items-center justify-center relative shadow-lg ${pinBg}`}
                      >
                        <MapPin className="w-2.5 h-2.5 text-current" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Incident drawer sheet */}
              {selectedIncident ? (
                <div className="bg-zinc-950 border-t border-zinc-850 p-4 space-y-3 animate-slide-up shrink-0 relative">
                  <button 
                    onClick={() => setSelectedIncident(null)}
                    className="absolute top-2 right-2 text-zinc-550 hover:text-zinc-350 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-3">
                    <img 
                      src={selectedIncident.image} 
                      alt={selectedIncident.category} 
                      className="w-14 h-14 rounded-md object-cover border border-zinc-800 bg-zinc-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-zinc-500">{selectedIncident.id}</span>
                        <span className={`text-[8px] font-mono border px-1 rounded font-bold uppercase ${
                          selectedIncident.severity === 'Critical' ? 'border-red-900/50 bg-red-950/20 text-red-400' : 'border-brand-amber/30 bg-brand-amber/5 text-brand-amber'
                        }`}>
                          {selectedIncident.severity}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-200 mt-0.5 truncate">{selectedIncident.category}</h4>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-0.5 mt-0.5 truncate">
                        <MapPin className="w-2.5 h-2.5" /> {selectedIncident.location}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-450 leading-relaxed font-sans bg-zinc-900/30 border border-zinc-900 p-2 rounded">
                    {selectedIncident.notes || 'No community notes submitted.'}
                  </p>

                  {/* Incident Metadata Ledger */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded p-2.5 space-y-1.5 font-mono text-[8px] text-zinc-450 select-text">
                    <span className="text-[8px] font-bold text-brand-cyan uppercase tracking-wider block border-b border-zinc-900 pb-1 mb-1">
                      Incident Metadata Ledger
                    </span>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">ABS GEOLOCATION:</span>
                      <span className="text-zinc-300 font-semibold">
                        {selectedIncident.geolocation 
                          ? `${selectedIncident.geolocation.lat.toFixed(6)}°, ${selectedIncident.geolocation.lng.toFixed(6)}°` 
                          : `${(40.7128 + (selectedIncident.coordinates?.[0] || 0) * 0.001).toFixed(6)}°, ${(-74.0060 - (selectedIncident.coordinates?.[1] || 0) * 0.001).toFixed(6)}°`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">EXIF INTEGRITY Check:</span>
                      <span className={selectedIncident.exifVerified ? "text-brand-emerald font-semibold" : "text-zinc-500 font-semibold"}>
                        {selectedIncident.exifVerified ? "✓ PASSED (MOBILE SECURE ENCLAVE)" : "N/A (LEGACY SEED)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-zinc-550 shrink-0">AUDIT SHA-256 KEY:</span>
                      <span className="text-brand-cyan/85 select-all truncate font-mono text-[7.5px]" title={selectedIncident.hash}>
                        {selectedIncident.hash ? selectedIncident.hash : `0x${((selectedIncident.coordinates?.[0] || 0) * 9382103).toString(16).padEnd(64, '0').slice(0, 64).toUpperCase()}`}
                      </span>
                    </div>
                  </div>

                  {/* Swarm Audit Ledger */}
                  <div className="space-y-1 bg-zinc-950 border border-zinc-900 rounded p-2 text-[8px] font-mono text-zinc-500">
                    <span className="text-[8px] font-bold text-brand-cyan uppercase tracking-wider block border-b border-zinc-900 pb-1 mb-1">
                      Swarm Audit Ledger
                    </span>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      <div className="flex flex-col border-b border-zinc-900 pb-1">
                        <span className="text-zinc-300 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-brand-cyan" />
                          [Aegis-Agent]
                        </span>
                        <p className="text-zinc-400 mt-0.5 leading-normal">
                          {selectedIncident.swarmData?.aegisConfidence || 'Confidence Threshold: 98.6% Authentic (Visual checks passed)'}
                        </p>
                      </div>

                      <div className="flex flex-col border-b border-zinc-900 pb-1">
                        <span className="text-zinc-300 font-bold flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-brand-cyan" />
                          [Atlas-Agent]
                        </span>
                        <p className="text-zinc-400 mt-0.5 leading-normal">
                          {selectedIncident.swarmData?.atlasRouting || 'Routing Optimized via Spatial Matrix (Swarm Triangulated)'}
                        </p>
                      </div>

                      <div className="flex flex-col border-b border-zinc-900 pb-1">
                        <span className="text-zinc-300 font-bold flex items-center gap-1">
                          <Wrench className="w-2.5 h-2.5 text-brand-cyan" />
                          [Vulcan-Agent]
                        </span>
                        <p className="text-zinc-400 mt-0.5 leading-normal">
                          {selectedIncident.swarmData?.vulcanMaterial || 'Resource Dispatched: Asphalt Patching Rig Type-B'}
                        </p>
                      </div>

                      <div className="flex flex-col border-b border-zinc-900 pb-1">
                        <span className="text-zinc-300 font-bold flex items-center gap-1">
                          <Send className="w-2.5 h-2.5 text-brand-cyan" />
                          [Mercury-Agent]
                        </span>
                        <p className="text-zinc-400 mt-0.5 leading-normal truncate" title={selectedIncident.swarmData?.mercuryPing}>
                          {selectedIncident.swarmData?.mercuryPing || 'Outbound target API endpoint success (200 OK)'}
                        </p>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-zinc-300 font-bold flex items-center gap-1">
                          <Hourglass className="w-2.5 h-2.5 text-brand-cyan" />
                          [Chronos-Agent]
                        </span>
                        <p className="text-zinc-400 mt-0.5 leading-normal">
                          {selectedIncident.swarmData?.chronosEta || 'ETA locked: 14.2 Hours (Predictive degradation verified)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Upvote */}
                  <div className="flex flex-col gap-2.5 pt-2.5 border-t border-zinc-900/60">
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[8.5px] font-mono border px-1.5 py-0.5 rounded uppercase font-semibold ${
                        selectedIncident.status === 'Triage' 
                          ? 'border-brand-cyan/20 bg-brand-cyan/5 text-brand-cyan animate-pulse-cyan' 
                          : selectedIncident.status === 'Bounty_Posted'
                          ? 'border-purple-500/20 bg-purple-950/20 text-purple-400'
                          : selectedIncident.status === 'Claimed_In_Progress'
                          ? 'border-brand-amber/20 bg-brand-amber/5 text-brand-amber animate-pulse-amber'
                          : selectedIncident.status === 'Peer_Review'
                          ? 'border-blue-500/20 bg-blue-950/20 text-blue-400'
                          : selectedIncident.status === 'Resolved'
                          ? 'border-brand-emerald/20 bg-brand-emerald/5 text-brand-emerald'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-550'
                      }`}>
                        {selectedIncident.status.replace(/_/g, ' ')}
                      </span>

                      <button
                        onClick={() => {
                          onUpvoteIncident(selectedIncident.id);
                          onUpdateKarma(10); // Upvote earns 10 XP
                          setSelectedIncident(prev => prev ? { ...prev, upvotes: prev.upvotes + 1 } : null);
                        }}
                        className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded px-2.5 py-1 text-[9px] font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-2.5 h-2.5 text-brand-cyan fill-current" />
                        Upvote ({selectedIncident.upvotes})
                      </button>
                    </div>

                    {/* Progress visual if Claimed or Peer Reviewed */}
                    {selectedIncident.progressPhoto && (
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Structural Remediation Evidence</span>
                        <div className="w-full h-24 rounded overflow-hidden border border-zinc-900 bg-zinc-950">
                          <img src={selectedIncident.progressPhoto} alt="Remediation" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {/* Conditional rendering based on status */}
                    {selectedIncident.status === 'Triage' ? (
                      <button
                        onClick={() => {
                          if (onAuthorizeDispatch) {
                            onAuthorizeDispatch(selectedIncident.id);
                          }
                          setSelectedIncident(prev => prev ? { ...prev, status: 'Bounty_Posted' } : null);
                        }}
                        className="w-full py-1.5 bg-brand-cyan hover:bg-cyan-400 text-zinc-950 font-bold rounded text-[9.5px] font-mono tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.15)]"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        Post Civic Bounty
                      </button>
                    ) : selectedIncident.status === 'Bounty_Posted' ? (
                      <div className="w-full py-1.5 bg-purple-950/20 border border-purple-900/30 text-purple-400 font-mono text-[9px] rounded text-center uppercase flex items-center justify-center gap-1">
                        <Coins className="w-3 h-3 animate-bounce" />
                        Bounty Posted & Open
                      </div>
                    ) : selectedIncident.status === 'Claimed_In_Progress' ? (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1 text-[9px] font-mono p-2 bg-zinc-950 border border-zinc-900 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-550">RESOLUTION COUNTDOWN:</span>
                            {selectedIncident.etaTargetTime && (
                              <CitizenClaimCountdown targetTime={selectedIncident.etaTargetTime} />
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-550">ASSIGNED CONTRACTOR:</span>
                            <span className="text-zinc-300 font-bold">{selectedIncident.claimedBy || 'Volunteer'}</span>
                          </div>
                        </div>
                        <div className="w-full py-1.5 bg-brand-amber/10 border border-brand-amber/20 text-brand-amber font-mono text-[9px] rounded text-center uppercase flex items-center justify-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          Remediation In Progress
                        </div>
                      </div>
                    ) : selectedIncident.status === 'Peer_Review' ? (
                      /* CITIZEN PEER-VERIFICATION VOTING NODE */
                      <div className="border border-brand-cyan/25 bg-zinc-950/90 rounded p-2.5 space-y-2.5">
                        <div className="flex justify-between items-center text-[9px] font-mono font-bold text-brand-cyan border-b border-zinc-900 pb-1">
                          <span>PEER-VERIFICATION VOTING NODE</span>
                          <span className="animate-pulse">{(selectedIncident.verifications || []).length}/3 SIGNED</span>
                        </div>
                        
                        {(selectedIncident.verifications || []).length > 0 && (
                          <div className="space-y-1 max-h-16 overflow-y-auto pr-1">
                            {selectedIncident.verifications?.map((v, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-900/60 p-1 rounded text-[8px] font-mono border border-zinc-900">
                                <span className="text-zinc-400 font-bold">{v.name}</span>
                                <span className="text-brand-emerald font-semibold">✓ Signed Handshake</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {handshakeStep === 'idle' && (
                          <button
                            type="button"
                            onClick={startHandshakeCamera}
                            className="w-full py-1.5 bg-brand-cyan hover:bg-cyan-400 text-zinc-950 font-bold rounded text-[9px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Verify (Camera Handshake)
                          </button>
                        )}

                        {handshakeStep === 'streaming' && (
                          <div className="relative rounded overflow-hidden h-28 bg-black flex flex-col justify-end">
                            <video 
                              ref={handshakeVideoRef} 
                              autoPlay 
                              playsInline 
                              muted 
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="relative z-10 p-1.5 bg-zinc-950/95 border-t border-zinc-900 flex justify-between items-center text-[8.5px]">
                              <span className="text-brand-cyan animate-pulse">SELFIE HANDSHAKE ACTIVE</span>
                              <button
                                type="button"
                                onClick={() => snapHandshakePhoto(selectedIncident.id)}
                                className="bg-brand-cyan text-zinc-950 px-2 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer hover:bg-cyan-400"
                              >
                                Confirm Snap
                              </button>
                            </div>
                          </div>
                        )}

                        {handshakeStep === 'countdown' && (
                          <div className="h-24 bg-zinc-950 border border-zinc-900 rounded flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-mono font-bold text-brand-cyan animate-ping">{handshakeCountdown}</span>
                            <p className="text-[7.5px] font-mono text-zinc-550 mt-1 uppercase tracking-widest">Generating cryptographic proof...</p>
                          </div>
                        )}
                      </div>
                    ) : selectedIncident.status === 'Resolved' ? (
                      <div className="w-full py-1.5 bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald font-mono text-[9px] rounded text-center uppercase flex items-center justify-center gap-1.5 font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Remediation Resolved
                      </div>
                    ) : (
                      <div className="w-full py-1.5 bg-zinc-900/40 border border-zinc-800 text-zinc-500 font-mono text-[9px] rounded text-center uppercase flex items-center justify-center gap-1.5">
                        <X className="w-3 h-3" />
                        Ticket Archived
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 p-4 border-t border-zinc-850 flex flex-col items-center justify-center text-center shrink-0">
                  <p className="text-[10px] font-mono text-zinc-500">
                    [TAP AN ACTIVE GRAPH MAP PIN TO LOAD DATA]
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Active Tab Screen 2: MULTI-MODAL AI SUBMISSION FORM */}
          {activeTab === 'report' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 relative">
              <h3 className="text-xs font-bold tracking-tight text-white border-b border-zinc-900 pb-2">
                Multi-Modal AI Incident Filing
              </h3>

              {/* Preset selection bar for quick testing */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">
                  Select Simulation Profile Preset:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(0)}
                    className="p-1 text-[8px] font-mono bg-zinc-950 border border-zinc-900 rounded hover:border-zinc-700 text-zinc-400 hover:text-white transition-all text-center truncate cursor-pointer"
                  >
                    Pothole
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(1)}
                    className="p-1 text-[8px] font-mono bg-zinc-950 border border-zinc-900 rounded hover:border-zinc-700 text-zinc-400 hover:text-white transition-all text-center truncate cursor-pointer"
                  >
                    Flooding
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(2)}
                    className="p-1 text-[8px] font-mono bg-zinc-950 border border-zinc-900 rounded hover:border-zinc-700 text-zinc-400 hover:text-white transition-all text-center truncate cursor-pointer"
                  >
                    Power Line
                  </button>
                </div>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-3">
                {/* Simulated Camera Uplink Box */}
                <div className="border border-zinc-850 rounded-lg bg-zinc-950/80 flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[140px]">
                  {capturedPhoto ? (
                    <div className="absolute inset-0 w-full h-full flex flex-col justify-end">
                      <img 
                        src={capturedPhoto} 
                        alt="preview" 
                        className="absolute inset-0 w-full h-full object-cover" 
                      />
                      <div className="relative z-10 p-2 bg-zinc-950/80 border-t border-zinc-900 flex justify-between items-center">
                        <span className="text-[8px] font-mono text-zinc-400">Photo Captured</span>
                        <button
                          type="button"
                          onClick={retakePhoto}
                          className="bg-zinc-900 border border-zinc-805 hover:bg-zinc-850 px-2 py-0.5 rounded text-[8px] font-mono text-brand-cyan flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Retake
                        </button>
                      </div>
                    </div>
                  ) : isCameraActive ? (
                    <div className="absolute inset-0 w-full h-full flex flex-col justify-end">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="relative z-10 p-2 bg-zinc-950/80 border-t border-zinc-900 flex justify-between items-center">
                        <span className="text-[8px] font-mono text-brand-cyan flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          LIVE STREAM
                        </span>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-brand-cyan text-zinc-950 hover:bg-cyan-400 font-bold px-2 py-0.5 rounded text-[8px] font-mono flex items-center gap-1 cursor-pointer"
                        >
                          Capture Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 py-4 flex flex-col items-center">
                      <Camera className="w-6 h-6 text-zinc-650 mb-1" />
                      <span className="text-[9px] font-mono text-zinc-400 block">Camera Offline</span>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-brand-cyan px-2 py-1 rounded text-[8px] font-mono cursor-pointer"
                      >
                        Start Camera Stream
                      </button>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-zinc-500 mb-0.5">Category</label>
                    <input
                      type="text"
                      value={reportCategory}
                      disabled
                      className="w-full bg-zinc-950 border border-zinc-900 rounded px-2 py-1 text-[10px] text-zinc-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-zinc-500 mb-0.5">Geospatial Coordinate Target</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-950 border border-zinc-900 rounded px-2 py-1 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                        <span>Grid X</span>
                        <span className="text-brand-cyan font-bold">{reportX}%</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-900 rounded px-2 py-1 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                        <span>Grid Y</span>
                        <span className="text-brand-cyan font-bold">{reportY}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-zinc-500 mb-0.5">Location Details</label>
                    <input
                      type="text"
                      value={reportLocation}
                      onChange={(e) => setReportLocation(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-900 rounded px-2 py-1.5 text-[10px] text-zinc-200 focus:outline-none focus:border-brand-cyan/60 font-mono"
                      placeholder="Enter location address..."
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="block text-[8px] font-mono uppercase tracking-wider text-zinc-500">Additional Observations</label>
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`px-1.5 py-0.5 border rounded text-[8px] font-mono flex items-center gap-1 cursor-pointer transition-all ${
                          isRecording 
                            ? 'border-red-900/60 bg-red-950/20 text-red-400 animate-pulse' 
                            : 'border-brand-cyan/20 bg-brand-cyan/5 text-brand-cyan hover:border-brand-cyan/60'
                        }`}
                      >
                        <Mic className="w-2.5 h-2.5" />
                        {isRecording ? 'Stop Recording' : 'Record Observations'}
                      </button>
                    </div>

                    {isRecording && (
                      <div className="border border-zinc-900 rounded p-1 mb-1.5 bg-[#050505] flex flex-col items-center">
                        <canvas 
                          ref={canvasRef} 
                          width={320} 
                          height={40} 
                          className="w-full h-[40px] bg-zinc-950/80 rounded"
                        />
                        <span className="text-[7.5px] font-mono text-zinc-500 mt-0.5 block tracking-tight">
                          RECORDING TELEMETRY... SHIFT WAV FOR FREQ ANALYSIS
                        </span>
                      </div>
                    )}

                    <textarea
                      rows={2}
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded px-2 py-1.5 text-[10px] text-zinc-200 focus:outline-none focus:border-brand-cyan/60 resize-none font-sans"
                      placeholder="Add structural context or use Voice Recording..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-brand-cyan hover:bg-cyan-400 text-zinc-950 font-bold rounded text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(0,229,255,0.15)]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  File Report
                </button>
              </form>

              {/* Terminal Simulator Overlay (Absolute Position overlay inside phone viewport) */}
              {isAiLoading && (
                <div className="absolute inset-0 bg-zinc-950/95 flex flex-col p-4 z-40 font-mono text-[9px] text-brand-cyan">
                  <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2 mb-3">
                    <Terminal className="w-3.5 h-3.5 text-brand-cyan" />
                    <span className="font-bold tracking-tight text-white">Zelus Triage CLI</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto pr-1 select-text">
                    {cliLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('SUCCESS') ? 'text-brand-emerald' : log.includes('INFO') ? 'text-zinc-400' : 'text-brand-cyan'}>
                        {log}
                      </div>
                    ))}
                    <div className="w-1.5 h-3 bg-brand-cyan animate-pulse inline-block" />
                  </div>
                </div>
              )}

              {/* Success Notification Alert */}
              {showSuccess && (
                <div className="absolute inset-x-4 top-4 bg-zinc-950 border border-brand-emerald/40 rounded-lg p-4 shadow-2xl z-40 text-center animate-slide-up space-y-3">
                  <CheckCircle className="w-8 h-8 text-brand-emerald mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Incident Ledger Updated</h4>
                    <p className="text-[9px] text-zinc-400 mt-1">
                      AI anti-fraud checked completed. Incident synchronized to regional admin console (+50 XP).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      setActiveTab('map');
                    }}
                    className="w-full py-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white rounded cursor-pointer transition-colors"
                  >
                    Return to Map View
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Tab Screen 3: CIVIC KARMA LEDGER */}
          {activeTab === 'profile' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <h3 className="text-xs font-bold tracking-tight text-white border-b border-zinc-900 pb-2">
                Civic Karma Ledger
              </h3>

              {/* Bento Grid Profile Card */}
              <div className="glass-panel border-zinc-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden">
                    <Award className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 font-mono">{session.username}</h4>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-550">
                      Tier-02 Civic Hero
                    </span>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-zinc-500">Progression Level</span>
                    <span className="text-brand-emerald font-semibold">
                      {session.karmaXP} / {Math.ceil(session.karmaXP / 500) * 500} XP
                    </span>
                  </div>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-emerald rounded-full transition-all duration-300"
                      style={{ width: `${(session.karmaXP % 500) / 5}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Badges Bento Block */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                  Unlocked Credentials
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div className={`border p-3 rounded-lg flex flex-col justify-between h-20 transition-all ${
                    session.karmaXP >= 200 
                      ? 'border-brand-cyan/20 bg-brand-cyan/[0.01]' 
                      : 'border-zinc-900 bg-zinc-950/20 opacity-40'
                  }`}>
                    <Award className={`w-4 h-4 ${session.karmaXP >= 200 ? 'text-brand-cyan' : 'text-zinc-650'}`} />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-200 block truncate">Water Watchdog</span>
                      <span className="text-[8px] font-mono text-zinc-500">Report/Upvote water issues</span>
                    </div>
                  </div>

                  <div className={`border p-3 rounded-lg flex flex-col justify-between h-20 transition-all ${
                    session.karmaXP >= 300 
                      ? 'border-brand-emerald/20 bg-brand-emerald/[0.01]' 
                      : 'border-zinc-900 bg-zinc-950/20 opacity-40'
                  }`}>
                    <Award className={`w-4 h-4 ${session.karmaXP >= 300 ? 'text-brand-emerald' : 'text-zinc-650'}`} />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-200 block truncate">Infrastructure Guard</span>
                      <span className="text-[8px] font-mono text-zinc-500">Report structural defects</span>
                    </div>
                  </div>

                  <div className={`border p-3 rounded-lg flex flex-col justify-between h-20 transition-all ${
                    session.karmaXP >= 400 
                      ? 'border-brand-amber/20 bg-brand-amber/[0.01]' 
                      : 'border-zinc-900 bg-zinc-950/20 opacity-40'
                  }`}>
                    <Award className={`w-4 h-4 ${session.karmaXP >= 400 ? 'text-brand-amber' : 'text-zinc-650'}`} />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-200 block truncate">Citizen Shield</span>
                      <span className="text-[8px] font-mono text-zinc-500">High-priority triage sync</span>
                    </div>
                  </div>

                  <div className={`border p-3 rounded-lg flex flex-col justify-between h-20 transition-all ${
                    session.karmaXP >= 500 
                      ? 'border-zinc-700 bg-zinc-800/[0.05]' 
                      : 'border-zinc-900 bg-zinc-950/20 opacity-40'
                  }`}>
                    <Award className="w-4 h-4 text-zinc-650" />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-200 block truncate">Urban Vanguard</span>
                      <span className="text-[8px] font-mono text-zinc-500">Unlock custom civic bounties</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* XP Ledger History */}
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-lg p-3 space-y-2">
                <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-500 block">
                  XP Transaction Log
                </span>
                <div className="space-y-1.5 text-[9px] font-mono text-zinc-400">
                  <div className="flex justify-between items-center border-b border-zinc-900/60 pb-1">
                    <span>AI Report Validated</span>
                    <span className="text-brand-emerald">+50 XP</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-900/60 pb-1">
                    <span>Upvote Registered</span>
                    <span className="text-brand-emerald">+10 XP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Session Connected</span>
                    <span className="text-zinc-600">CONNECTED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Device Bottom Tab Navigation */}
        <div className="h-14 bg-zinc-950 border-t border-zinc-900 grid grid-cols-3 shrink-0">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'map' ? 'text-brand-cyan' : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[8px] font-mono uppercase tracking-widest">Map</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'report' ? 'text-brand-cyan' : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="text-[8px] font-mono uppercase tracking-widest">Report</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'profile' ? 'text-brand-cyan' : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            <Award className="w-4 h-4" />
            <span className="text-[8px] font-mono uppercase tracking-widest">Karma</span>
          </button>
        </div>

        {/* Device Virtual Home Button Bar */}
        <div className="h-4 bg-zinc-950 flex justify-center items-center shrink-0">
          <div className="w-32 h-1 bg-zinc-800 rounded-full" />
        </div>

      </div>
    </div>
  );
};
