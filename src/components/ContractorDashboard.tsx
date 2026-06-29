import React, { useState, useEffect, useRef } from 'react';
import type { Incident, UserSession, Theme } from '../types';
import { 
  Camera, Clock, Coins, 
  MapPin, RefreshCw, Send, Smile, Wrench, X, CheckCircle, Map
} from 'lucide-react';

interface ContractorDashboardProps {
  incidents: Incident[];
  session: UserSession;
  onClaimBounty: (id: string) => void;
  onSubmitProgress: (id: string, progressPhoto: string) => void;
  onUpdateStage?: (id: string, stage: 'Accepted' | 'Dispatched' | 'In-Review') => void;
  theme?: Theme;
}

const ClaimCountdown: React.FC<{ targetTime: number }> = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('Computing...');

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00 - EXCEEDED');
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
    <div className="flex items-center gap-1.5 font-mono text-[10px]">
      <Clock className={`w-3 h-3 ${isExceeded ? 'text-red-500 animate-pulse' : 'text-brand-amber animate-spin'}`} style={{ animationDuration: '6s' }} />
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
  onUpdateStage,
}) => {

  // Filter queues
  const openBounties = incidents.filter(inc => inc.status === 'Bounty_Posted');
  const myClaims = incidents.filter(
    inc => inc.claimedBy === session.username && inc.status !== 'Resolved'
  );

  // Selected incident from map or queue
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Camera settings per claimed item
  const [cameraActiveId, setCameraActiveId] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getBountyReward = (severity: string) => {
    if (severity === 'Critical') return '600 ZEL';
    if (severity === 'Moderate') return '300 ZEL';
    return '150 ZEL';
  };

  const getBountyDeadline = (severity: string) => {
    if (severity === 'Critical') return '1.5 Hours';
    if (severity === 'Moderate') return '4 Hours';
    return '12 Hours';
  };

  const startCamera = async (id: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (!navigator.mediaDevices) {
        throw new Error("mediaDevices unavailable");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 320, height: 240 }
      });
      streamRef.current = stream;
      setCameraActiveId(id);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Could not launch camera stream, fallback to canvas animation', err);
      setCameraActiveId(id);
      setTimeout(() => {
        drawFallbackRepairCanvas();
      }, 100);
    }
  };

  const drawFallbackRepairCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    const interval = setInterval(() => {
      if (cameraActiveId === null || capturedPhotos[cameraActiveId]) {
        clearInterval(interval);
        return;
      }
      ctx.fillStyle = '#060B0C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw concentric circles representing patching overlay
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.2)';
      ctx.lineWidth = 1;
      const radius = 20 + (frame % 3) * 15;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#FFCC00';
      ctx.lineWidth = 2;
      ctx.strokeRect(canvas.width / 2 - 40, canvas.height / 2 - 30, 80, 60);

      ctx.fillStyle = '#FFCC00';
      ctx.font = '8px monospace';
      ctx.fillText('CAMERA OVERLAY // FIELD REMEDIATION EVIDENCE', 10, 15);
      ctx.fillText('STATUS: PREPARING COMPLETION EVIDENCE SNAP', 10, canvas.height - 10);
      frame++;
    }, 100);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActiveId(null);
  };

  const snapPhoto = (id: string) => {
    const video = videoRef.current;
    if (video && streamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhotos(prev => ({ ...prev, [id]: dataUrl }));
        stopCamera();
      }
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhotos(prev => ({ ...prev, [id]: dataUrl }));
        stopCamera();
      } else {
        setCapturedPhotos(prev => ({ ...prev, [id]: '/road_pothole.png' }));
        stopCamera();
      }
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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans select-none" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="border rounded-xl p-4 flex flex-col justify-between shadow-lg" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              Open Infrastructure Bounties
            </span>
            <Coins className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-zinc-100">{openBounties.length}</span>
            <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>Bounties Posted</span>
          </div>
        </div>

        <div className="border rounded-xl p-4 flex flex-col justify-between shadow-lg" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              My Claimed Projects
            </span>
            <Wrench className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-zinc-100">
              {myClaims.filter(c => c.status === 'Claimed_In_Progress').length}
            </span>
            <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>Active Repairs</span>
          </div>
        </div>

        <div className="border rounded-xl p-4 flex flex-col justify-between shadow-lg" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              My Completed Tasks
            </span>
            <Smile className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-zinc-100">
              {myClaims.filter(c => c.status === 'Peer_Review' || c.status === 'Resolved').length}
            </span>
            <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>Consensus Verified</span>
          </div>
        </div>
      </div>

      {/* 3-PANE SPLIT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-[500px]">
        
        {/* LEFT PANE: AVAILABLE INFRASTRUCTURE ASSIGNMENTS (4 Columns) */}
        <div 
          className="lg:col-span-4 border rounded-xl p-4 space-y-4 shadow-xl min-h-[500px]"
          style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
              <Coins className="w-4 h-4 animate-pulse" style={{ color: 'var(--accent-amber)' }} />
              Available Assignments
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Claim available community infrastructure bounties immediately.
            </p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {openBounties.length === 0 ? (
              <div className="text-center py-12 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                [NO VOLUNTEER BOUNTIES CURRENTLY POSTED]
              </div>
            ) : (
              openBounties.map(bounty => {
                const isSelected = selectedIncident?.id === bounty.id;
                return (
                  <div 
                    key={bounty.id}
                    onClick={() => setSelectedIncident(bounty)}
                    className={`border p-3.5 rounded-lg space-y-3 cursor-pointer transition-all hover:scale-[1.01] ${
                      isSelected ? 'animate-pulse' : ''
                    }`}
                    style={{ 
                      backgroundColor: 'rgba(9, 15, 16, 0.25)', 
                      borderColor: isSelected ? 'var(--accent-amber)' : 'var(--border-secondary)',
                      boxShadow: isSelected ? '0 0 10px rgba(255, 204, 0, 0.35)' : 'none'
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[8px] font-mono block" style={{ color: 'var(--text-muted)' }}>{bounty.id}</span>
                        <h4 className="text-xs font-bold mt-0.5 text-zinc-100">{bounty.category}</h4>
                        <p className="text-[9.5px] mt-0.5 flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                          <MapPin className="w-3 h-3 text-zinc-550 shrink-0" /> {bounty.location}
                        </p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono border font-semibold shrink-0" style={{
                        backgroundColor: 'rgba(255, 204, 0, 0.1)',
                        borderColor: 'var(--accent-amber)',
                        color: 'var(--accent-amber)'
                      }}>
                        {bounty.severity}
                      </span>
                    </div>

                    <p className="text-[10.5px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {bounty.description}
                    </p>

                    {/* Deadline and Tokens Row */}
                    <div className="flex items-center justify-between text-[9px] font-mono pt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-650" />
                        <span>Deadline: <strong className="text-zinc-200">{getBountyDeadline(bounty.severity)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 text-brand-cyan">
                        <Coins className="w-3.5 h-3.5 text-current" />
                        <strong className="font-extrabold">{getBountyReward(bounty.severity)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClaimBounty(bounty.id);
                        if (selectedIncident?.id === bounty.id) {
                          setSelectedIncident(null);
                        }
                      }}
                      className="w-full py-1.5 text-[9px] font-mono font-bold tracking-wider uppercase rounded cursor-pointer transition-colors border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--accent-amber)',
                        color: 'var(--accent-amber)'
                      }}
                    >
                      Claim Bounty
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER PANE: ACTIVE PROJECT STATUS MATRIX (5 Columns) */}
        <div 
          className="lg:col-span-5 border rounded-xl p-4 space-y-4 shadow-xl min-h-[500px]"
          style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
              <Wrench className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
              Active Project Status Matrix ({myClaims.length})
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Remediate structural errors and submit photographic confirmation blocks.
            </p>
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {myClaims.length === 0 ? (
              <div className="text-center py-12 text-[10px] font-mono border border-dashed rounded-lg" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
                [NO CLAIMED PROJECTS DEPLOYED TO PROFILE]
                <p className="text-[9px] mt-1 font-sans">Select and claim available bounties from the left panel queue.</p>
              </div>
            ) : (
              myClaims.map(incident => {
                const captured = capturedPhotos[incident.id];
                const isStreaming = cameraActiveId === incident.id;
                const inProgress = incident.status === 'Claimed_In_Progress';
                const isSelected = selectedIncident?.id === incident.id;

                // Active lifecycle stage: 'Accepted' | 'Dispatched' | 'In-Review'
                const currentStage = incident.contractorStage || (incident.status === 'Peer_Review' || incident.status === 'Resolved' ? 'In-Review' : 'Accepted');

                return (
                  <div 
                    key={incident.id}
                    className={`border p-4 rounded-lg space-y-3.5 transition-all ${
                      isSelected ? 'ring-1 ring-brand-cyan shadow-lg shadow-brand-cyan/15' : ''
                    }`}
                    style={{ 
                      backgroundColor: 'rgba(9, 15, 16, 0.25)', 
                      borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-secondary)'
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[8.5px] font-mono block" style={{ color: 'var(--text-muted)' }}>
                          {incident.id} // {incident.status.replace(/_/g, ' ')}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-150">{incident.category}</h4>
                        <p className="text-[9.5px] flex items-center gap-0.5 mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          <MapPin className="w-3 h-3 text-zinc-550 shrink-0" /> {incident.location}
                        </p>
                      </div>

                      {inProgress && incident.etaTargetTime && (
                        <ClaimCountdown targetTime={incident.etaTargetTime} />
                      )}
                    </div>

                    {/* Stepper Status Indicators */}
                    <div className="grid grid-cols-5 gap-1 items-center justify-between text-[9px] font-mono bg-black/35 p-2 rounded border" style={{ borderColor: 'var(--border-secondary)' }}>
                      <button
                        type="button"
                        onClick={() => onUpdateStage && onUpdateStage(incident.id, 'Accepted')}
                        disabled={!inProgress}
                        className="flex items-center gap-1 focus:outline-none cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentStage === 'Accepted' ? 'var(--accent-cyan)' : 'rgba(82,82,91,0.4)' }} />
                        <span style={{ color: currentStage === 'Accepted' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>Accepted</span>
                      </button>
                      <span className="text-zinc-700 text-center">&gt;&gt;</span>
                      
                      <button
                        type="button"
                        onClick={() => onUpdateStage && onUpdateStage(incident.id, 'Dispatched')}
                        disabled={!inProgress}
                        className="flex items-center gap-1 focus:outline-none cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentStage === 'Dispatched' ? 'var(--accent-cyan)' : 'rgba(82,82,91,0.4)' }} />
                        <span style={{ color: currentStage === 'Dispatched' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>Dispatched</span>
                      </button>
                      <span className="text-zinc-700 text-center">&gt;&gt;</span>
                      
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentStage === 'In-Review' ? 'var(--accent-cyan)' : 'rgba(82,82,91,0.4)' }} />
                        <span style={{ color: currentStage === 'In-Review' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>In-Review</span>
                      </div>
                    </div>

                    {/* Display info/actions based on current stage */}
                    {inProgress && (
                      <div className="space-y-3 pt-1">
                        {currentStage === 'Accepted' && (
                          <div className="space-y-2 text-center py-2.5 border rounded border-dashed" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
                            <p className="text-[10px] font-mono" style={{ color: 'var(--text-primary)' }}>
                              JOB ACCEPTED & REGISTERED TO WORKSPACE
                            </p>
                            <button
                              type="button"
                              onClick={() => onUpdateStage && onUpdateStage(incident.id, 'Dispatched')}
                              className="px-4 py-1.5 bg-brand-cyan text-zinc-950 font-bold font-mono text-[9px] uppercase rounded hover:bg-cyan-400 cursor-pointer shadow-md"
                            >
                              Dispatch Service Team
                            </button>
                          </div>
                        )}

                        {currentStage === 'Dispatched' && (
                          <div className="space-y-3">
                            {captured ? (
                              <div className="relative rounded overflow-hidden h-32 border" style={{ borderColor: 'var(--border-secondary)' }}>
                                <img src={captured} alt="evidence" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-between p-2 mt-20 text-[8.5px] font-mono border-t border-zinc-900">
                                  <span style={{ color: 'var(--accent-cyan)' }}>REPAIR EVIDENCE CAPTURED</span>
                                  <button 
                                    type="button"
                                    onClick={() => clearPhoto(incident.id)}
                                    className="px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer"
                                    style={{ borderColor: 'var(--border-secondary)', color: 'var(--accent-amber)' }}
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" /> Retake
                                  </button>
                                </div>
                              </div>
                            ) : isStreaming ? (
                              <div className="relative rounded overflow-hidden h-32 bg-black flex flex-col justify-end">
                                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" width={320} height={128} />
                                <div className="relative z-10 p-2 flex justify-between items-center text-[8.5px] font-mono bg-zinc-950/90 border-t border-zinc-900">
                                  <span style={{ color: 'var(--accent-amber)' }}>WEBCAM FEED OPENED</span>
                                  <div className="flex gap-1.5">
                                    <button type="button" onClick={stopCamera} className="px-2 py-0.5 rounded border text-zinc-400 cursor-pointer" style={{ borderColor: 'var(--border-secondary)' }}>
                                      Cancel
                                    </button>
                                    <button type="button" onClick={() => snapPhoto(incident.id)} className="px-2.5 py-0.5 rounded text-zinc-950 font-bold cursor-pointer" style={{ backgroundColor: 'var(--accent-cyan)' }}>
                                      Capture
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startCamera(incident.id)}
                                className="w-full py-5 rounded border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                                style={{ 
                                  backgroundColor: 'rgba(9, 15, 16, 0.1)', 
                                  borderColor: 'var(--border-secondary)',
                                  color: 'var(--text-muted)'
                                }}
                              >
                                <Camera className="w-6 h-6 animate-pulse" />
                                <div className="text-center font-mono text-[9px]">
                                  <span>INITIALIZE FIELD EVIDENCE CAMERA UPLINK</span>
                                  <p className="text-[8px] mt-0.5">Snap and dispatch completion photo block to verify repair.</p>
                                </div>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={!captured}
                              onClick={() => {
                                onSubmitProgress(incident.id, captured);
                                if (onUpdateStage) onUpdateStage(incident.id, 'In-Review');
                              }}
                              className="w-full py-2 font-bold font-mono text-[9.5px] tracking-wider uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1 shadow-md border"
                              style={{
                                backgroundColor: captured ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                                borderColor: captured ? 'var(--accent-cyan)' : 'var(--border-secondary)',
                                color: captured ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                opacity: captured ? 1 : 0.5
                              }}
                            >
                              <Send className="w-3.5 h-3.5" />
                              Submit Evidence to Peer Review
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStage === 'In-Review' && incident.status === 'Peer_Review' && (
                      <div className="p-3 border rounded text-[9.5px] font-mono text-center flex items-center justify-center gap-2" style={{ backgroundColor: 'rgba(255, 204, 0, 0.05)', borderColor: 'var(--border-secondary)', color: 'var(--accent-amber)' }}>
                        <Clock className="w-4 h-4 animate-spin" />
                        AWAITING CITIZEN PEER REVIEW CONSENSUS ({(incident.verifications || []).length}/3 SIGNED)
                      </div>
                    )}

                    {incident.status === 'Resolved' && (
                      <div className="p-3 border rounded text-[9.5px] font-mono text-center flex items-center justify-center gap-2" style={{ backgroundColor: 'rgba(0, 255, 204, 0.05)', borderColor: 'var(--border-secondary)', color: 'var(--accent-cyan)' }}>
                        <CheckCircle className="w-4 h-4" />
                        REMEDIATION COMPLETED & LEDGER SETTLED
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: SPATIAL ROUTING GRID (3 Columns) */}
        <div 
          className="lg:col-span-3 border rounded-xl p-4 space-y-4 shadow-xl min-h-[500px] flex flex-col justify-between"
          style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
              <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
                <Map className="w-4 h-4 animate-pulse" style={{ color: 'var(--accent-cyan)' }} />
                Spatial Routing Grid
              </h3>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Triangulated coordinates map grid for active failing nodes.
              </p>
            </div>

            {/* Grid Vector SVG Map */}
            <div className="flex-1 min-h-[220px] rounded-lg border relative overflow-hidden bg-black/85" style={{ borderColor: 'var(--border-secondary)' }}>
              {/* Blueprint Grid Roadways */}
              <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                backgroundImage: 'linear-gradient(to right, rgba(0, 255, 204, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 204, 0.15) 1px, transparent 1px)',
                backgroundSize: '15px 15px'
              }} />

              {/* Vector overlay path */}
              <svg className="absolute inset-0 w-full h-full text-zinc-900 opacity-60" fill="none">
                <path d="M 0 60 L 300 60 M 0 160 L 300 160" stroke="var(--border-primary)" strokeWidth="0.5" strokeDasharray="3 3"/>
                <path d="M 90 0 L 90 300 M 200 0 L 200 300" stroke="var(--border-primary)" strokeWidth="0.5" strokeDasharray="3 3"/>
                <rect x="25" y="0" width="12" height="300" fill="#0b1011" />
                <rect x="180" y="0" width="16" height="300" fill="#0b1011" />
                <rect x="0" y="52" width="300" height="15" fill="#0b1011" />
                <rect x="0" y="150" width="300" height="18" fill="#0b1011" />
              </svg>

              {/* Pins mapping */}
              {incidents.map(inc => {
                const isBounty = inc.status === 'Bounty_Posted';
                const isClaimedByMe = inc.claimedBy === session.username && inc.status !== 'Resolved';
                if (!isBounty && !isClaimedByMe) return null;

                const [x, y] = inc.coordinates;
                const pinColor = isClaimedByMe ? 'var(--accent-cyan)' : 'var(--accent-amber)';

                return (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => setSelectedIncident(inc)}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group focus:outline-none"
                  >
                    <span className="absolute inset-0 w-6 h-6 -left-1.5 -top-1.5 rounded-full scale-110 opacity-35 animate-ping bg-current" style={{ color: pinColor }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center relative shadow-lg font-mono text-[6px] font-bold animate-pulse" style={{
                      backgroundColor: pinColor,
                      color: '#000000'
                    }}>
                      <MapPin className="w-2 h-2" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Legend details */}
          <div className="border-t pt-3 space-y-1.5 font-mono text-[8.5px] mt-3" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
            <span className="text-[8px] font-bold block" style={{ color: 'var(--text-primary)' }}>MAP VECTOR LEGEND</span>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-amber)' }} />
                Open Bounties Queue
              </span>
              <strong style={{ color: 'var(--text-primary)' }}>{openBounties.length} Pins</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-cyan)' }} />
                My Claimed Active
              </span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {myClaims.filter(c => c.status === 'Claimed_In_Progress').length} Pins
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* Slide drawer details for map coordinates */}
      {selectedIncident && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-sm border rounded-xl p-5 space-y-4 shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
          >
            <button 
              type="button"
              onClick={() => setSelectedIncident(null)}
              className="absolute top-3 right-3 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="border-b pb-2.5" style={{ borderColor: 'var(--border-secondary)' }}>
              <span className="text-[8px] font-mono text-zinc-550 block">{selectedIncident.id}</span>
              <h4 className="text-xs font-bold text-white mt-0.5">{selectedIncident.category}</h4>
              <p className="text-[9.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedIncident.location}</p>
            </div>

            <div className="space-y-2.5 font-mono text-[9px]">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>GPS COORDINATES:</span>
                <span className="text-zinc-250 font-bold">
                  {selectedIncident.geolocation
                    ? `${selectedIncident.geolocation.lat.toFixed(5)}°, ${selectedIncident.geolocation.lng.toFixed(5)}°`
                    : `X:${selectedIncident.coordinates[0]}%, Y:${selectedIncident.coordinates[1]}%`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>BOUNTY STATUS:</span>
                <span style={{ color: 'var(--accent-amber)' }}>{selectedIncident.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>SEVERITY LEVEL:</span>
                <span style={{ color: 'var(--accent-red)' }}>{selectedIncident.severity}</span>
              </div>
              <div className="p-2 border rounded text-[10px] leading-relaxed font-sans" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}>
                {selectedIncident.description || 'No description notes.'}
              </div>
            </div>

            {selectedIncident.status === 'Bounty_Posted' && (
              <button
                type="button"
                onClick={() => {
                  onClaimBounty(selectedIncident.id);
                  setSelectedIncident(null);
                }}
                className="w-full py-2 bg-brand-amber text-zinc-950 font-bold font-mono text-[10px] uppercase rounded hover:bg-amber-400 cursor-pointer shadow-md"
              >
                Claim Infrastructure Bounty
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
