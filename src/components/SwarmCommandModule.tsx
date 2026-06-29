import React from 'react';
import { Cpu, ShieldCheck, MapPin, Wrench, Send, Hourglass, Activity } from 'lucide-react';
import type { Incident, Theme } from '../types';

interface SwarmCommandModuleProps {
  swarmStep: number; // 0 to 7
  activeIncident: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'> | null;
  swarmStatus: 'idle' | 'running' | 'completed';
  criticalMode?: boolean;
  theme?: Theme;
}

export const SwarmCommandModule: React.FC<SwarmCommandModuleProps> = ({
  swarmStep,
  activeIncident,
  swarmStatus,
  criticalMode = false,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const accentColor = criticalMode ? '#ff3b3b' : isDark ? '#00E5FF' : '#00A86B';
  const accentAmber = criticalMode ? '#FF4444' : '#FF9100';
  if (swarmStatus === 'idle' || !activeIncident) return null;

  // Render LED status indicator style
  const getLedStyle = (stepActive: boolean, stepCompleted: boolean): React.CSSProperties => {
    if (stepCompleted) return { background: accentColor, boxShadow: `0 0 8px ${accentColor}` };
    if (stepActive) return { background: accentAmber, animation: 'pulse 1s infinite' };
    return { background: isDark ? 'rgba(82,82,91,0.4)' : 'rgba(180,175,165,0.5)' };
  };

  const getStatusText = (stepActive: boolean, stepCompleted: boolean) => {
    if (stepCompleted) return 'SUCCESS';
    if (stepActive) return 'THINKING';
    return 'IDLE';
  };

  // Agent detail configurations derived from active incident
  const getAgentContent = (agent: string) => {
    const category = activeIncident.category || 'Road & Structural Damage';
    const notes = activeIncident.notes || '';
    
    switch (agent) {
      case 'aegis':
        return {
          title: '[Aegis-Agent]',
          subtitle: 'Fraud & Authenticator',
          log: 'Confidence Threshold: 98.6% Authentic',
          badge: activeIncident.exifVerified ? 'EXIF Verified' : 'Standard Validation'
        };
      case 'atlas':
        const x = activeIncident.coordinates?.[0] || 50;
        const y = activeIncident.coordinates?.[1] || 50;
        return {
          title: '[Atlas-Agent]',
          subtitle: 'Geospatial & Router',
          log: `Scaled relative grid offset: [X:${x}, Y:${y}]`,
          badge: 'Routing Optimized via Spatial Matrix'
        };
      case 'vulcan':
        let resource = 'Asphalt Patching Rig Type-B';
        if (category.includes('Water') || category.includes('Flood')) {
          resource = 'Water Extraction Pump Crew';
        } else if (category.includes('Utility') || category.includes('Spark')) {
          resource = 'High Voltage Utility Crew';
        }
        return {
          title: '[Vulcan-Agent]',
          subtitle: 'Solution & Material Estimator',
          log: notes ? `Analyzed observations transcript payload` : 'Estimated repair payloads',
          badge: `Resource: ${resource}`
        };
      case 'mercury':
        let dept = 'Public Works';
        if (category.includes('Water')) dept = 'Water Board';
        else if (category.includes('Utility')) dept = 'Power Grid';
        return {
          title: '[Mercury-Agent]',
          subtitle: 'Municipal Dispatcher',
          log: `Dept: ${dept}`,
          badge: `Ping: mock-api.${dept.toLowerCase().replace(' ', '')}.gov/outbound`
        };
      case 'chronos':
        let eta = '14.2 Hours';
        if (category.includes('Water')) eta = '2.5 Hours';
        else if (category.includes('Utility')) eta = '0.5 Hours';
        return {
          title: '[Chronos-Agent]',
          subtitle: 'Lifecycle Tracker',
          log: `Atmospheric decay factor simulated`,
          badge: `ETA locked: ${eta}`
        };
      default:
        return { title: '', subtitle: '', log: '', badge: '' };
    }
  };

  const aegis = getAgentContent('aegis');
  const atlas = getAgentContent('atlas');
  const vulcan = getAgentContent('vulcan');
  const mercury = getAgentContent('mercury');
  const chronos = getAgentContent('chronos');

  return (
    <div
      className="w-full rounded-lg p-5 relative overflow-hidden animate-slide-down"
      style={{
        background: isDark ? 'rgba(9,9,11,0.85)' : 'rgba(245,242,235,0.92)',
        border: `1px solid ${criticalMode ? 'rgba(255,59,59,0.35)' : isDark ? 'rgba(0,229,255,0.15)' : 'rgba(0,168,107,0.2)'}`,
        boxShadow: criticalMode
          ? '0 0 30px rgba(255,59,59,0.12)'
          : isDark ? '0 0 20px rgba(0,229,255,0.06)' : '0 0 20px rgba(0,168,107,0.04)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Visual background scanner line */}
      <div
        className="absolute inset-x-0 h-[1.5px] animate-pulse pointer-events-none"
        style={{
          top: '35%',
          background: `linear-gradient(to right, transparent, ${accentColor}40, transparent)`,
        }}
      />

      {/* Header bar: Master Orchestrator status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-3.5 mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden shrink-0">
            <Cpu className="w-5 h-5 text-brand-cyan animate-spin" style={{ animationDuration: '6s' }} />
            <div className="absolute inset-0 bg-brand-cyan/5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                [Zelus-Orchestrator] // Swarm Command Module
              </h2>
              <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                swarmStatus === 'completed'
                  ? 'border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan'
                  : 'border-brand-amber/30 bg-brand-amber/5 text-brand-amber animate-pulse'
              }`}>
                {swarmStatus === 'completed' ? 'LEDGER VERIFIED & SAVED' : `RUNNING PHASE ${swarmStep}/6`}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Active parsing loop for incident telemetry: <span className="text-zinc-300">"{activeIncident.category}"</span> in <span className="text-zinc-300">{activeIncident.location}</span>
            </p>
          </div>
        </div>

        {/* Global Orchestrator Step Info */}
        <div className="flex items-center gap-4 text-[9.5px] font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
            <span>Threads: Active Swarm</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div>
            <span>INTEGRITY STATUS: </span>
            <span className={swarmStep >= 2 ? 'text-brand-emerald font-bold' : 'text-zinc-500'}>
              {swarmStep >= 2 ? '✓ ANALYZED' : 'PENDING'}
            </span>
          </div>
        </div>
      </div>

      {/* Swarm Cards Horizontal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Aegis-Agent */}
        <div className={`border rounded-lg p-3.5 space-y-2.5 bg-zinc-950/60 relative overflow-hidden transition-all duration-300 ${
          swarmStep === 2 ? 'border-brand-amber/40 shadow-[0_0_12px_rgba(255,145,0,0.1)] scale-[1.01]' : swarmStep > 2 ? 'border-brand-cyan/15 bg-brand-cyan/[0.01]' : 'border-zinc-900 opacity-50'
        }`}>
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <ShieldCheck className={`w-3.5 h-3.5 ${swarmStep >= 2 ? 'text-brand-cyan' : 'text-zinc-550'}`} />
              <span className="text-[9px] font-mono font-bold tracking-tight">{aegis.title}</span>
            </div>
            <div className="flex items-center gap-1 text-[8.5px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${getLedStyle(swarmStep === 2, swarmStep > 2)}`} />
              <span className={swarmStep === 2 ? 'text-brand-amber' : swarmStep > 2 ? 'text-brand-cyan' : 'text-zinc-550'}>
                {getStatusText(swarmStep === 2, swarmStep > 2)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block">{aegis.subtitle}</span>
            <p className="text-[9.5px] font-mono text-zinc-300 leading-normal">{aegis.log}</p>
          </div>
          {swarmStep >= 2 && (
            <span className="inline-block text-[8px] font-mono bg-brand-cyan/5 border border-brand-cyan/20 text-brand-cyan px-1.5 py-0.5 rounded uppercase">
              {aegis.badge}
            </span>
          )}
        </div>

        {/* Card 2: Atlas-Agent */}
        <div className={`border rounded-lg p-3.5 space-y-2.5 bg-zinc-950/60 relative overflow-hidden transition-all duration-300 ${
          swarmStep === 3 ? 'border-brand-amber/40 shadow-[0_0_12px_rgba(255,145,0,0.1)] scale-[1.01]' : swarmStep > 3 ? 'border-brand-cyan/15 bg-brand-cyan/[0.01]' : 'border-zinc-900 opacity-50'
        }`}>
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <MapPin className={`w-3.5 h-3.5 ${swarmStep >= 3 ? 'text-brand-cyan' : 'text-zinc-550'}`} />
              <span className="text-[9px] font-mono font-bold tracking-tight">{atlas.title}</span>
            </div>
            <div className="flex items-center gap-1 text-[8.5px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${getLedStyle(swarmStep === 3, swarmStep > 3)}`} />
              <span className={swarmStep === 3 ? 'text-brand-amber' : swarmStep > 3 ? 'text-brand-cyan' : 'text-zinc-550'}>
                {getStatusText(swarmStep === 3, swarmStep > 3)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block">{atlas.subtitle}</span>
            <p className="text-[9.5px] font-mono text-zinc-300 leading-normal">{atlas.log}</p>
          </div>
          {swarmStep >= 3 && (
            <span className="inline-block text-[8px] font-mono bg-brand-cyan/5 border border-brand-cyan/20 text-brand-cyan px-1.5 py-0.5 rounded leading-normal">
              {atlas.badge}
            </span>
          )}
        </div>

        {/* Card 3: Vulcan-Agent */}
        <div className={`border rounded-lg p-3.5 space-y-2.5 bg-zinc-950/60 relative overflow-hidden transition-all duration-300 ${
          swarmStep === 4 ? 'border-brand-amber/40 shadow-[0_0_12px_rgba(255,145,0,0.1)] scale-[1.01]' : swarmStep > 4 ? 'border-brand-cyan/15 bg-brand-cyan/[0.01]' : 'border-zinc-900 opacity-50'
        }`}>
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <Wrench className={`w-3.5 h-3.5 ${swarmStep >= 4 ? 'text-brand-cyan' : 'text-zinc-550'}`} />
              <span className="text-[9px] font-mono font-bold tracking-tight">{vulcan.title}</span>
            </div>
            <div className="flex items-center gap-1 text-[8.5px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${getLedStyle(swarmStep === 4, swarmStep > 4)}`} />
              <span className={swarmStep === 4 ? 'text-brand-amber' : swarmStep > 4 ? 'text-brand-cyan' : 'text-zinc-550'}>
                {getStatusText(swarmStep === 4, swarmStep > 4)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block">{vulcan.subtitle}</span>
            <p className="text-[9.5px] font-mono text-zinc-300 leading-normal">{vulcan.log}</p>
          </div>
          {swarmStep >= 4 && (
            <span className="inline-block text-[8px] font-mono bg-brand-cyan/5 border border-brand-cyan/20 text-brand-cyan px-1.5 py-0.5 rounded leading-normal">
              {vulcan.badge}
            </span>
          )}
        </div>

        {/* Card 4: Mercury-Agent */}
        <div className={`border rounded-lg p-3.5 space-y-2.5 bg-zinc-950/60 relative overflow-hidden transition-all duration-300 ${
          swarmStep === 5 ? 'border-brand-amber/40 shadow-[0_0_12px_rgba(255,145,0,0.1)] scale-[1.01]' : swarmStep > 5 ? 'border-brand-cyan/15 bg-brand-cyan/[0.01]' : 'border-zinc-900 opacity-50'
        }`}>
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <Send className={`w-3.5 h-3.5 ${swarmStep >= 5 ? 'text-brand-cyan' : 'text-zinc-550'}`} />
              <span className="text-[9px] font-mono font-bold tracking-tight">{mercury.title}</span>
            </div>
            <div className="flex items-center gap-1 text-[8.5px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${getLedStyle(swarmStep === 5, swarmStep > 5)}`} />
              <span className={swarmStep === 5 ? 'text-brand-amber' : swarmStep > 5 ? 'text-brand-cyan' : 'text-zinc-550'}>
                {getStatusText(swarmStep === 5, swarmStep > 5)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block">{mercury.subtitle}</span>
            <p className="text-[9.5px] font-mono text-zinc-350 truncate">{mercury.log}</p>
          </div>
          {swarmStep >= 5 && (
            <span className="inline-block text-[8px] font-mono bg-brand-cyan/5 border border-brand-cyan/20 text-brand-cyan px-1.5 py-0.5 rounded leading-normal truncate max-w-full" title={mercury.badge}>
              {mercury.badge}
            </span>
          )}
        </div>

        {/* Card 5: Chronos-Agent */}
        <div className={`border rounded-lg p-3.5 space-y-2.5 bg-zinc-950/60 relative overflow-hidden transition-all duration-300 ${
          swarmStep === 6 ? 'border-brand-amber/40 shadow-[0_0_12px_rgba(255,145,0,0.1)] scale-[1.01]' : swarmStep > 6 ? 'border-brand-cyan/15 bg-brand-cyan/[0.01]' : 'border-zinc-900 opacity-50'
        }`}>
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <Hourglass className={`w-3.5 h-3.5 ${swarmStep >= 6 ? 'text-brand-cyan' : 'text-zinc-550'}`} />
              <span className="text-[9px] font-mono font-bold tracking-tight">{chronos.title}</span>
            </div>
            <div className="flex items-center gap-1 text-[8.5px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${getLedStyle(swarmStep === 6, swarmStep > 6)}`} />
              <span className={swarmStep === 6 ? 'text-brand-amber' : swarmStep > 6 ? 'text-brand-cyan' : 'text-zinc-550'}>
                {getStatusText(swarmStep === 6, swarmStep > 6)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block">{chronos.subtitle}</span>
            <p className="text-[9.5px] font-mono text-zinc-300 leading-normal">{chronos.log}</p>
          </div>
          {swarmStep >= 6 && (
            <span className="inline-block text-[8px] font-mono bg-brand-cyan/5 border border-brand-cyan/20 text-brand-cyan px-1.5 py-0.5 rounded leading-normal">
              {chronos.badge}
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
