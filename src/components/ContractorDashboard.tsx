import React, { useState, useEffect, useRef } from 'react';
import type { Incident, UserSession, Theme } from '../types';
import { 
  Briefcase, Camera, Clock, Coins, 
  MapPin, RefreshCw, Send, Smile, Wrench 
} from 'lucide-react';

interface ContractorDashboardProps {
  incidents: Incident[];
  session: UserSession;
  onClaimBounty: (id: string) => void;
  onSubmitProgress: (id: string, progressPhoto: string) => void;
  theme?: Theme;
  onSelectPayload?: (incident: Incident) => void;
}

// Sub-component for individual countdown timer to avoid full re-renders
const ClaimCountdown: React.FC<{ targetTime: number }> = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('Computing...');

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00 - ETA EXCEEDED');
        return;
      }

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const isExceeded = timeLeft.includes('EXCEEDED');

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <Clock className={`w-3.5 h-3.5 ${isExceeded ? 'text-red-500 animate-pulse' : 'text-brand-amber animate-spin'}`} style={{ animationDuration: '6s' }} />
      <span className={isExceeded ? 'text-red-500 font-bold' : 'text-brand-amber font-semibold'}>
        {timeLeft}
      </span>
    </div>
  );
};

export const ContractorDashboard: React.FC<ContractorDashboardProps> = ({
  incidents,
  session,
  onClaimBounty,
  onSubmitProgress,
  theme = 'dark',
  onSelectPayload,
}) => {
  const isDark = theme === 'dark';
  const openBounties = incidents.filter(inc => inc.status === 'Bounty_Posted');
  const myClaims = incidents.filter(
    inc => inc.status === 'Claimed_In_Progress' && inc.claimedBy === session.username
  );
  const myCompleted = incidents.filter(
    inc => inc.claimedBy === session.username && (inc.status === 'Peer_Review' || inc.status === 'Resolved')
  );

  // Camera settings per claimed item
  const [cameraActiveId, setCameraActiveId] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async (id: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      streamRef.current = stream;
      setCameraActiveId(id);
    } catch (err) {
      console.warn('Could not launch camera:', err);
      // Fallback: mock a photo
      setCameraActiveId(id);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActiveId(null);
  };

  useEffect(() => {
    if (cameraActiveId && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActiveId]);

  const snapPhoto = (id: string) => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhotos(prev => ({ ...prev, [id]: dataUrl }));
        stopCamera();
      }
    } else {
      // Fallback
      setCapturedPhotos(prev => ({ ...prev, [id]: '/road_pothole.png' }));
      stopCamera();
    }
  };

  const clearPhoto = (id: string) => {
    setCapturedPhotos(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    startCamera(id);
  };

  // UI Theme details
  const bentoBg = isDark ? 'bg-zinc-950/80 border-zinc-900 shadow-zinc-950/50' : 'bg-[#FAF8F5] border-[#E8E4DC] shadow-zinc-200/50';
  const textMuted = isDark ? 'text-zinc-500' : 'text-zinc-650';
  const headingText = isDark ? 'text-white' : 'text-[#1A1A1A]';

  return (
    <div className="space-y-6">
      {/* Metrics Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className={`border rounded-xl p-5 flex flex-col justify-between shadow-xl ${bentoBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono tracking-wider uppercase ${textMuted}`}>
              Open Infrastructure Bounties
            </span>
            <Coins className="w-4 h-4 text-brand-amber animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${headingText}`}>{openBounties.length}</span>
            <span className="text-[10px] text-brand-amber font-mono">Bounties Open</span>
          </div>
        </div>

        <div className={`border rounded-xl p-5 flex flex-col justify-between shadow-xl ${bentoBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono tracking-wider uppercase ${textMuted}`}>
              My Claimed Projects
            </span>
            <Wrench className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${headingText}`}>{myClaims.length}</span>
            <span className="text-[10px] text-brand-cyan font-mono">In Progress</span>
          </div>
        </div>

        <div className={`border rounded-xl p-5 flex flex-col justify-between shadow-xl ${bentoBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono tracking-wider uppercase ${textMuted}`}>
              My Completed Repairs
            </span>
            <Smile className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${headingText}`}>{myCompleted.length}</span>
            <span className="text-[10px] text-brand-emerald font-mono">Verified / Reviewed</span>
          </div>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: My Active Claims (7 cols) */}
        <div className={`lg:col-span-7 border rounded-xl p-5 space-y-4 shadow-xl ${bentoBg}`}>
          <div className="border-b border-zinc-900 pb-3">
            <h2 className={`text-sm font-semibold tracking-tight uppercase flex items-center gap-2 ${headingText}`}>
              <Wrench className="w-4 h-4 text-brand-cyan" />
              My Claimed Projects ({myClaims.length})
            </h2>
            <p className={`text-[11px] mt-0.5 ${textMuted}`}>
              Upload visual evidence of your structural repairs to trigger Citizen Peer Review verification.
            </p>
          </div>

          {myClaims.length === 0 ? (
            <div className={`text-center py-12 rounded-lg border border-dashed font-mono text-xs ${isDark ? 'border-zinc-900 bg-zinc-950/20 text-zinc-650' : 'border-[#E8E4DC] bg-[#FDFBF7] text-zinc-550'}`}>
              [NO ACTIVE CLAIMS FOUND ON YOUR PROFILE]
              <p className="text-[10px] mt-1 font-sans text-zinc-500">Claim projects from the Volunteer Marketplace on the right.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {myClaims.map((incident) => {
                const captured = capturedPhotos[incident.id];
                const isStreaming = cameraActiveId === incident.id;

                return (
                  <div 
                    key={incident.id} 
                    className={`border rounded-lg p-4 space-y-4 relative overflow-hidden transition-all duration-300 ${
                      isDark ? 'border-zinc-900 bg-zinc-950/30' : 'border-[#E8E4DC] bg-[#FAF8F5]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <span className={`text-[9px] font-mono block ${textMuted}`}>{incident.id} // ACTIVE CLAIM</span>
                        <h3 className={`text-xs font-bold truncate mt-0.5 ${headingText}`}>{incident.category}</h3>
                        <p className={`text-[10px] flex items-center gap-0.5 mt-0.5 truncate ${textMuted}`}>
                          <MapPin className="w-3 h-3 text-zinc-550 shrink-0" /> {incident.location}
                        </p>
                      </div>
                      
                      {incident.etaTargetTime && (
                        <ClaimCountdown targetTime={incident.etaTargetTime} />
                      )}
                    </div>

                    <p className={`text-[11px] p-2 rounded leading-relaxed ${isDark ? 'bg-zinc-900/40 border border-zinc-900 text-zinc-300' : 'bg-white border border-[#E8E4DC] text-zinc-700'}`}>
                      {incident.notes || 'No reporter notes.'}
                    </p>

                    {/* Hardware Camera Panel */}
                    <div className="space-y-3">
                      <span className={`text-[9px] font-mono block uppercase tracking-wider font-semibold ${textMuted}`}>
                        Live Capture: Structural Repair Progress
                      </span>

                      {captured ? (
                        <div className="relative rounded-lg overflow-hidden border border-brand-cyan/20 h-44 bg-zinc-950">
                          <img src={captured} alt="Progress Capture" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[9px] font-mono text-brand-cyan font-semibold">PHOTO BUFFER HASH GENERATED</span>
                              <button
                                onClick={() => clearPhoto(incident.id)}
                                className="bg-zinc-950/90 border border-zinc-800 hover:bg-zinc-900 px-2 py-1 rounded text-[9px] font-mono text-brand-amber cursor-pointer flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" /> Retake
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : isStreaming ? (
                        <div className="relative rounded-lg overflow-hidden border border-brand-amber/30 h-44 bg-black flex flex-col justify-end">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-grid-lines opacity-10 pointer-events-none" />
                          <div className="relative z-10 p-3 bg-zinc-950/80 border-t border-zinc-900 flex justify-between items-center">
                            <span className="text-[9px] font-mono text-brand-amber flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              WEBCAM STREAMING
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 rounded text-[9px] font-mono text-zinc-400 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => snapPhoto(incident.id)}
                                className="bg-brand-cyan text-zinc-950 px-2 py-1 rounded text-[9px] font-mono font-bold cursor-pointer hover:bg-cyan-400"
                              >
                                Capture Image
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startCamera(incident.id)}
                          className={`w-full py-6 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.005] ${
                            isDark 
                              ? 'border-zinc-850 bg-zinc-900/10 hover:border-brand-cyan/40 hover:bg-zinc-950/40 text-zinc-400 hover:text-brand-cyan' 
                              : 'border-[#E8E4DC] bg-white hover:border-[#D97706] hover:bg-[#FAF8F5] text-zinc-500 hover:text-[#D97706]'
                          }`}
                        >
                          <Camera className="w-6 h-6 animate-pulse" />
                          <div className="text-center">
                            <span className="text-xs font-mono font-semibold">INITIALIZE BROWSER CAMERA ACCESS</span>
                            <p className="text-[9px] mt-0.5 opacity-80">Capture verification photo to dispatch to Peer Review stage.</p>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      disabled={!captured}
                      onClick={() => onSubmitProgress(incident.id, captured)}
                      className={`w-full py-2 rounded text-[10.5px] font-mono tracking-wider uppercase font-bold transition-all flex items-center justify-center gap-1.5 ${
                        captured 
                          ? 'bg-brand-emerald text-zinc-950 hover:bg-emerald-400 cursor-pointer shadow-[0_0_12px_rgba(0,230,118,0.2)]'
                          : 'bg-zinc-900 border border-zinc-850 text-zinc-550 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Infrastructure Verification
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Active Volunteer Marketplace Queue (5 cols) */}
        <div className={`lg:col-span-5 border rounded-xl p-5 space-y-4 shadow-xl ${bentoBg}`}>
          <div className="border-b border-zinc-900 pb-3">
            <h2 className={`text-sm font-semibold tracking-tight uppercase flex items-center gap-2 ${headingText}`}>
              <Coins className="w-4 h-4 text-brand-amber animate-pulse" />
              Volunteer Marketplace
            </h2>
            <p className={`text-[11px] mt-0.5 ${textMuted}`}>
              Claim critical infrastructure bounties posted by the Municipal Swarm ledger.
            </p>
          </div>

          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {openBounties.length === 0 ? (
              <div className={`text-center py-16 rounded-lg border border-dashed font-mono text-xs ${isDark ? 'border-zinc-900 bg-zinc-950/20 text-zinc-650' : 'border-[#E8E4DC] bg-[#FDFBF7] text-zinc-550'}`}>
                [NO VOLUNTEER BOUNTIES CURRENTLY POSTED]
                <p className="text-[9px] mt-1 font-sans text-zinc-500">Wait for Admin swarm approval to dispatch incidents to the marketplace.</p>
              </div>
            ) : (
              openBounties.map((bounty) => (
                <div 
                  key={bounty.id} 
                  onClick={() => onSelectPayload && onSelectPayload(bounty)}
                  className={`border rounded-lg p-3.5 space-y-3 cursor-pointer transition-all hover:scale-[1.01] ${
                    isDark ? 'border-zinc-900 bg-zinc-950/40 hover:border-zinc-800' : 'border-[#E8E4DC] bg-white hover:border-[#D97706]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className={`text-[9px] font-mono block ${textMuted}`}>{bounty.id}</span>
                      <h4 className={`text-xs font-bold mt-0.5 leading-tight ${headingText}`}>{bounty.category}</h4>
                      <p className={`text-[10px] flex items-center gap-0.5 mt-0.5 truncate ${textMuted}`}>
                        <MapPin className="w-3 h-3 text-zinc-550 shrink-0" /> {bounty.location}
                      </p>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono border font-semibold ${
                      bounty.severity === 'Critical' 
                        ? 'bg-red-950/20 text-red-400 border-red-900/30' 
                        : 'bg-brand-amber/5 text-brand-amber border-brand-amber/20'
                    }`}>
                      {bounty.severity}
                    </span>
                  </div>

                  <p className={`text-[10px] line-clamp-3 leading-relaxed ${textMuted}`}>
                    {bounty.notes || 'Civic infrastructure report awaiting remediation.'}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClaimBounty(bounty.id);
                    }}
                    className="w-full py-2 bg-brand-amber hover:bg-amber-400 text-zinc-950 font-bold rounded text-[10px] font-mono tracking-wider uppercase transition-all shadow-[0_0_10px_rgba(255,145,0,0.15)] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Claim Infrastructure Bounty
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
