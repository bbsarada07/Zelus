import React, { useState, useEffect, useRef } from 'react';
import type { UserRole } from '../types';
import { Shield, User, Cpu, Lock, ArrowRight, Wrench } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string, role: UserRole) => void;
  theme?: 'dark' | 'light';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  
  const [username, setUsername] = useState('admin_zero');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState<UserRole>('Admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  // Diagnostics state fluctuations
  const [threatIndex, setThreatIndex] = useState(0.95);
  const [activeNodes, setActiveNodes] = useState(1482);
  const [throughput, setThroughput] = useState(421.8);

  // Terminal log stream state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle submit connection
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(username || 'anonymous_hero', role);
      setIsSubmitting(false);
    }, 800);
  };

  // Corner diagnostics updates
  useEffect(() => {
    const dataInterval = setInterval(() => {
      setThreatIndex(prev => Number(Math.max(0.5, prev + (Math.random() - 0.5) * 0.05).toFixed(2)));
      setActiveNodes(prev => Math.max(1000, prev + Math.floor((Math.random() - 0.5) * 8)));
      setThroughput(prev => Number(Math.max(100, prev + (Math.random() - 0.5) * 15).toFixed(1)));
    }, 2000);

    return () => clearInterval(dataInterval);
  }, []);

  // Vertical terminal code stream logger
  useEffect(() => {
    const logPresets = [
      'DISPATCHED Autonomous Fleet Unit 04 to Sector-3',
      'EXIF INTEGRITY checked. True coordinates resolved',
      'Atmospheric Risk Coefficient recalculated: x1.14',
      'LEDGER block validated. Index SHA-256 committed',
      'SYSTEM nodes connected. Synced status nominal',
      'TRIAGE engine parsed vocal telemetry packet',
      'SPATIAL PIN matching active nodes on monitor',
      'MUNICIPAL dispatch handshake signature accepted',
      'STATE local synchronization stream completed',
      'FIREWALL established. Anti-spoof payload verified',
      'LIDAR scanning urban structural contours'
    ];

    const generateLog = () => {
      const stamp = new Date().toLocaleTimeString();
      const randomLog = logPresets[Math.floor(Math.random() * logPresets.length)];
      setTerminalLogs(prev => [`[${stamp}] // ${randomLog}`, ...prev].slice(0, 25));
    };

    // Prepopulate
    for (let i = 0; i < 12; i++) {
      generateLog();
    }

    const interval = setInterval(generateLog, 800);
    return () => clearInterval(interval);
  }, []);

  // Floating grid particles canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 2 + 1;
        this.color = color;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    
    // Core accents: Toxic Green (#00FFCC), Alert Red (#FF3B30), Warning Amber (#FFCC00)
    // For light mode: Dark Green (#006650), Dark Red (#B0120A), Dark Amber (#944200)
    const colorTheme = isDark
      ? ['#00FFCC', '#FF3B30', '#FFCC00', '#00997A', '#B38F00']
      : ['#006650', '#B0120A', '#944200', '#004D3C', '#733300'];

    for (let i = 0; i < 40; i++) {
      particles.push(
        new Particle(
          Math.random() * width,
          Math.random() * height,
          colorTheme[Math.floor(Math.random() * colorTheme.length)]
        )
      );
    }

    const animate = () => {
      if (isDark) {
        ctx.fillStyle = 'rgba(9, 15, 16, 0.15)'; // base dark #090F10
      } else {
        ctx.fillStyle = 'rgba(253, 251, 247, 0.15)'; // base light #FDFBF7
      }
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Matrix Lines
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = isDark ? 'rgba(0, 255, 204, 0.04)' : 'rgba(0, 102, 80, 0.06)';
      const gap = 80;
      for (let x = 0; x < width; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw and connect
      particles.forEach((p, idx) => {
        p.update();
        p.draw();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            if (isGlitching) {
              ctx.lineWidth = Math.random() * 1.5;
              ctx.strokeStyle = isDark
                ? `rgba(0, 255, 204, ${0.8 - dist / 130})`
                : `rgba(0, 102, 80, ${0.8 - dist / 130})`;
            } else {
              ctx.lineWidth = 0.45;
              ctx.strokeStyle = isDark
                ? `rgba(0, 255, 204, ${0.25 - dist / 300})`
                : `rgba(0, 102, 80, ${0.25 - dist / 300})`;
            }
            ctx.stroke();
          }
        }
      });

      // Glitch visual channels slice rendering
      if (isGlitching && Math.random() > 0.35) {
        ctx.fillStyle = isDark ? 'rgba(0, 255, 204, 0.08)' : 'rgba(0, 102, 80, 0.08)';
        ctx.fillRect(0, Math.random() * height, width, Math.random() * 50);
        ctx.fillStyle = isDark ? 'rgba(255, 204, 0, 0.08)' : 'rgba(148, 66, 0, 0.08)';
        ctx.fillRect(0, Math.random() * height, width, Math.random() * 50);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [role, isGlitching, isDark]);

  // Violently shift ambient themes with matrix glitch
  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === role) return;
    setIsGlitching(true);
    setRole(newRole);
    if (newRole === 'Admin') {
      setUsername('admin_zero');
      setPassword('•••••••••admin');
    } else if (newRole === 'Contractor') {
      setUsername('contractor_alpha');
      setPassword('•••••••••contractor');
    } else {
      setUsername('citizen_hero');
      setPassword('•••••••••citizen');
    }
    const audioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (audioCtx) {
      try {
        const ctx = new audioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch {
        // audio fail safe
      }
    }
    setTimeout(() => {
      setIsGlitching(false);
    }, 350);
  };

  const accentColorStyle = role === 'Admin'
    ? 'var(--accent-cyan)'
    : role === 'Contractor'
    ? 'var(--accent-amber)'
    : 'var(--accent-cyan)';

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen relative overflow-hidden select-none" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes customGlitch {
          0% { transform: skew(0.5deg) scale(1); filter: hue-rotate(0deg); }
          10% { transform: skew(-1deg) scale(1.005); filter: hue-rotate(90deg) contrast(1.2); }
          20% { transform: skew(0deg) scale(0.995); filter: none; }
          30% { transform: skew(1.5deg) scale(1); filter: invert(0.05); }
          40% { transform: skew(-0.5deg) scale(1.002); }
          50% { transform: skew(0deg) scale(1); }
        }
        .active-glitch-layer {
          animation: customGlitch 0.3s infinite linear;
        }
      `}} />

      {/* Grid Nodes Animated Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ background: 'transparent' }} />

      {/* LEFT SIDE: SLEEK TELEMETRY STREAM CONSOLE */}
      <div className="hidden lg:flex w-[40%] border-r relative flex-col justify-between p-8 font-mono text-[10px] select-none z-10 overflow-hidden" 
           style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
        
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 30% 30%, ${accentColorStyle}05 0%, transparent 60%)` }} />
        
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-3 border-b pb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottomColor: 'var(--border-secondary)' }}>
            <span className="w-2 h-2 rounded-full bg-current animate-ping" style={{ color: 'var(--accent-cyan)' }} />
            SYSTEM TELEMETRY ENGINE // NODE DISPATCH
          </div>
          
          {/* Diagnostics Bento Box Inside Telemetry Stream */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-3 border rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
            <div>
              <span className="block text-[7.5px] uppercase tracking-wider">THREAT INDEX</span>
              <strong className="text-[11px] font-bold" style={{ color: 'var(--accent-cyan)' }}>x{threatIndex.toFixed(2)}</strong>
            </div>
            <div>
              <span className="block text-[7.5px] uppercase tracking-wider">ACTIVE NODES</span>
              <strong className="text-[11px] font-bold" style={{ color: 'var(--accent-cyan)' }}>{activeNodes} Wards</strong>
            </div>
            <div className="mt-1">
              <span className="block text-[7.5px] uppercase tracking-wider">THROUGHPUT</span>
              <strong className="text-[11px] font-bold" style={{ color: 'var(--accent-amber)' }}>{throughput.toFixed(1)} MB/s</strong>
            </div>
            <div className="mt-1">
              <span className="block text-[7.5px] uppercase tracking-wider">SECURE ENCLAVE</span>
              <strong className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>SHA-256 SYNC</strong>
            </div>
          </div>
        </div>

        {/* Telemetry scrolling feed */}
        <div className="flex-1 space-y-2 flex flex-col-reverse justify-end overflow-hidden mb-6">
          {terminalLogs.map((log, idx) => {
            const isCoord = log.includes('coordinates') || log.includes('GPS');
            const isFleet = log.includes('DISPATCHED') || log.includes('Fleet');
            const isSystem = log.includes('SYSTEM') || log.includes('FIREWALL');
            
            let color = "var(--accent-cyan)"; // Default toxic green/accent
            if (isCoord) color = "var(--accent-cyan)";
            if (isFleet) color = "var(--accent-cyan)";
            if (isSystem) color = "var(--accent-amber)";

            return (
              <div 
                key={idx} 
                className="truncate transition-opacity duration-300 font-semibold text-[10px] tracking-tight leading-normal"
                style={{ opacity: Math.max(0.1, 1 - (idx / 18)), color }}
              >
                {log}
              </div>
            );
          })}
        </div>

        <div className="border-t pt-2" style={{ borderColor: 'var(--border-secondary)' }}>
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">
            SECURE ACCESS GATEWAY CORE // SYSTEM_TELEMETRY_PORTAL
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: AUTHENTICATION FORM & ROLE CARDS */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 z-10 relative">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `${accentColorStyle}03` }} />

        <div className={`w-full max-w-md glass-panel rounded-2xl p-8 relative border shadow-2xl transition-all duration-300 backdrop-blur-lg ${
          isGlitching ? 'active-glitch-layer border-brand-cyan/60 scale-[1.015]' : ''
        }`} style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}>
          
          {/* Upper Brand / Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl border flex items-center justify-center mb-3 relative overflow-hidden group shadow-inner" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
              <Cpu className="w-6 h-6 animate-pulse" style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              ZELUS <span className="text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>ENGINE v2.0.0</span>
            </h1>
            <p className="text-xs mt-1 text-center leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>
              AI-Powered Hyperlocal Civic Automation & Triage Ledger
            </p>
          </div>

          {/* Interactive Role Option Cards */}
          <div className="space-y-2 mb-6">
            <label className="block text-[10px] font-mono tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Select Operational Role Access
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { r: 'Admin' as UserRole, name: 'Admin Center', user: 'admin_zero', desc: 'Manage triaged nodes & swarm telemetry workflows' },
                { r: 'Citizen' as UserRole, name: 'Citizen App', user: 'citizen_hero', desc: 'Simulate reports with AI enhance & verify updates' },
                { r: 'Contractor' as UserRole, name: 'Contractor Workspace', user: 'contractor_alpha', desc: 'Claim volunteer bounties and verify remediations' }
              ].map(item => (
                <div 
                  key={item.r}
                  onClick={() => handleRoleChange(item.r)}
                  className={`border rounded-xl p-3 flex items-start gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                    role === item.r 
                      ? 'shadow-md scale-[1.01]' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: role === item.r ? 'var(--accent-cyan)' : 'var(--border-secondary)',
                    boxShadow: role === item.r ? `0 0 12px ${role === 'Contractor' ? 'var(--accent-amber)' : 'var(--accent-cyan)'}15` : 'none'
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5`} 
                       style={{ 
                         borderColor: role === item.r ? 'var(--accent-cyan)' : 'var(--border-secondary)',
                         color: role === item.r ? (item.r === 'Contractor' ? 'var(--accent-amber)' : 'var(--accent-cyan)') : 'var(--text-muted)',
                         backgroundColor: 'var(--bg-primary)'
                       }}>
                    {item.r === 'Admin' ? <Shield className="w-4 h-4" /> : item.r === 'Citizen' ? <User className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold font-sans" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                      {role === item.r && (
                        <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: item.r === 'Contractor' ? 'var(--accent-amber)' : 'var(--accent-cyan)' }} />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Operator Identifier
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-xs transition-all font-mono"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-secondary)', 
                    color: 'var(--text-primary)' 
                  }}
                  placeholder="operator_id"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Access Token
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-xs transition-all font-mono"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-secondary)', 
                    color: 'var(--text-primary)' 
                  }}
                  placeholder="password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 border cursor-pointer hover:brightness-110"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: role === 'Contractor' ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                  color: role === 'Contractor' ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                  boxShadow: `0 0 15px ${role === 'Contractor' ? 'var(--accent-amber)' : 'var(--accent-cyan)'}15`
                }}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Establish System Connection
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer info text */}
          <div className="mt-6 text-center">
            <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
              SECURE ACCESS PORTAL // ZELUS GATEWAY SECURED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
