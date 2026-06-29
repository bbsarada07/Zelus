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
    } else if (newRole === 'Contractor') {
      setUsername('volunteer_alpha');
    } else {
      setUsername('citizen_hero');
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
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative overflow-hidden select-none">
      
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

      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${accentColorStyle}08` }} />

      {/* Left side Vertical Log Stream Ticker */}
      <div className="hidden lg:flex absolute left-8 top-8 bottom-8 w-72 flex-col font-mono text-[9px] overflow-hidden pointer-events-none select-none z-10">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-3 border-b pb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)', borderBottomColor: 'var(--border-secondary)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--accent-cyan)' }} />
          Node Operations Stream
        </div>
        <div className="space-y-1.5 flex-1 flex flex-col justify-start overflow-hidden">
          {terminalLogs.map((log, idx) => {
            const isCoord = log.includes('coordinates') || log.includes('GPS');
            const isFleet = log.includes('DISPATCHED') || log.includes('Fleet');
            const isSystem = log.includes('SYSTEM') || log.includes('FIREWALL');
            
            let color = "var(--text-muted)";
            if (isCoord) color = "var(--accent-cyan)";
            if (isFleet) color = "var(--accent-cyan)";
            if (isSystem) color = "var(--accent-amber)";

            return (
              <div 
                key={idx} 
                className="truncate transition-opacity duration-300 font-semibold"
                style={{ opacity: Math.max(0.05, 1 - (idx / 18)), color }}
              >
                {log}
              </div>
            );
          })}
        </div>
      </div>

      {/* Corner Diagnostics Bento Box - Top Left */}
      <div className="hidden sm:block absolute top-6 left-6 border rounded p-2.5 z-10 font-mono text-[9px] space-y-0.5 backdrop-blur-md pointer-events-none select-none" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
        <div className="text-[7.5px] uppercase tracking-widest">DATA CORE STATS</div>
        <div className="flex justify-between gap-6">
          <span>THREAT RISK:</span>
          <span className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>x{threatIndex.toFixed(2)}</span>
        </div>
      </div>

      {/* Corner Diagnostics Bento Box - Top Right */}
      <div className="hidden sm:block absolute top-6 right-6 border rounded p-2.5 z-10 font-mono text-[9px] space-y-0.5 backdrop-blur-md pointer-events-none select-none" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
        <div className="text-[7.5px] uppercase tracking-widest">SPATIAL INDEXER</div>
        <div className="flex justify-between gap-6">
          <span>ACTIVE TARGETS:</span>
          <span className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>{activeNodes} UNITS</span>
        </div>
      </div>

      {/* Corner Diagnostics Bento Box - Bottom Left */}
      <div className="hidden sm:block absolute bottom-6 left-6 border rounded p-2.5 z-10 font-mono text-[9px] space-y-0.5 backdrop-blur-md pointer-events-none select-none" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
        <div className="text-[7.5px] uppercase tracking-widest">LEDGER SYNCER</div>
        <div className="flex justify-between gap-6">
          <span>THROUGHPUT RATIO:</span>
          <span className="font-semibold" style={{ color: 'var(--accent-amber)' }}>{throughput.toFixed(1)} MB/S</span>
        </div>
      </div>

      {/* Corner Diagnostics Bento Box - Bottom Right */}
      <div className="hidden sm:block absolute bottom-6 right-6 border rounded p-2.5 z-10 font-mono text-[9px] space-y-0.5 backdrop-blur-md pointer-events-none select-none" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
        <div className="text-[7.5px] uppercase tracking-widest">SECURE ENCLAVE</div>
        <div className="flex justify-between gap-6">
          <span>HANDSHAKE KEYS:</span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>SHA-256 SYNC</span>
        </div>
      </div>

      {/* Central Login Card */}
      <div className={`w-full max-w-md glass-panel rounded-xl p-8 relative z-10 border shadow-2xl transition-all duration-300 backdrop-blur-lg ${
        isGlitching ? 'active-glitch-layer border-brand-cyan/60 scale-[1.015]' : ''
      }`} style={{ borderColor: 'var(--border-secondary)' }}>
        
        {/* Upper Brand / Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg border flex items-center justify-center mb-3 relative overflow-hidden group" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
            <Cpu className="w-6 h-6 animate-pulse" style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            ZELUS <span className="text-[10px] border px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>ENGINE v1.0.0</span>
          </h1>
          <p className="text-xs mt-1.5 text-center leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>
            AI-Powered Hyperlocal Civic Automation & Triage Ledger
          </p>
        </div>

        {/* Role Selector Toggle */}
        <div className="grid grid-cols-3 gap-1 p-1 border rounded-lg mb-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
          <button
            type="button"
            onClick={() => handleRoleChange('Admin')}
            className={`py-2 text-[10px] font-medium tracking-tight rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'Admin'
                ? 'bg-zinc-800/40 text-brand-cyan border shadow-inner font-semibold'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
            style={{ 
              borderColor: role === 'Admin' ? 'var(--border-primary)' : 'transparent',
              color: role === 'Admin' ? 'var(--accent-cyan)' : 'var(--text-muted)' 
            }}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('Citizen')}
            className={`py-2 text-[10px] font-medium tracking-tight rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'Citizen'
                ? 'bg-zinc-800/40 text-brand-emerald border shadow-inner font-semibold'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
            style={{ 
              borderColor: role === 'Citizen' ? 'var(--border-primary)' : 'transparent',
              color: role === 'Citizen' ? 'var(--accent-cyan)' : 'var(--text-muted)'
            }}
          >
            <User className="w-3.5 h-3.5" />
            Citizen
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('Contractor')}
            className={`py-2 text-[10px] font-medium tracking-tight rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'Contractor'
                ? 'bg-zinc-800/40 text-brand-amber border shadow-inner font-semibold'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
            style={{ 
              borderColor: role === 'Contractor' ? 'var(--border-primary)' : 'transparent',
              color: role === 'Contractor' ? 'var(--accent-amber)' : 'var(--text-muted)'
            }}
          >
            <Wrench className="w-3.5 h-3.5" />
            Contractor
          </button>
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
                className="w-full pl-9 pr-4 py-2.5 border rounded-md text-sm transition-all font-mono"
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
                className="w-full pl-9 pr-4 py-2.5 border rounded-md text-sm transition-all font-mono"
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
              className="w-full py-2.5 px-4 rounded-md font-medium text-xs tracking-tight transition-all duration-300 flex items-center justify-center gap-1.5 border cursor-pointer hover:opacity-90"
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
        <div className="mt-8 text-center">
          <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            SECURE ACCESS PORTAL // ZELUS PROTOCOL v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};
