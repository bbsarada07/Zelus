import React, { useState, useEffect, useRef } from 'react';
import type { Incident, Theme } from '../types';
import { 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  Layers, 
  X,
  ShieldCheck,
  Wrench,
  Send,
  Cpu,
  Laptop,
  Terminal,
  Activity,
  Smartphone,
  QrCode,
  RefreshCw
} from 'lucide-react';

interface GovernmentDashboardProps {
  incidents: Incident[];
  onAuthorizeDispatch: (id: string) => void;
  weatherRiskMultiplier: number;
  onAddIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'>) => void;
  theme?: Theme;
  onLogout: () => void;
  onToggleTheme: () => void;
  username: string;
  isIsolated?: boolean;
  onToggleIsolation?: () => void;
}

export const GovernmentDashboard: React.FC<GovernmentDashboardProps> = ({ 
  incidents, 
  onAuthorizeDispatch, 
  weatherRiskMultiplier,
  onAddIncident,
  onLogout,
  onToggleTheme,
  username,
  isIsolated = false,
  onToggleIsolation
}) => {

  // Selected incident for Center Swarm command view
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Swarm command sequence animation
  const [swarmStep, setSwarmStep] = useState<number>(0);
  const [swarmAnimating, setSwarmAnimating] = useState<boolean>(false);

  // QR Code Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  // Dev Console drawer expanded
  const [devConsoleOpen, setDevConsoleOpen] = useState<boolean>(true);
  const [devLogs, setDevLogs] = useState<Array<{ time: string; msg: string; raw?: string }>>([
    { time: '14:31:02', msg: 'System Bootstrap core nominal. Initialized developer log ledger.' }
  ]);

  // Threat risk index state
  const [threatIndex, setThreatIndex] = useState<number>(0.92);

  // Pulse neon indicators for new reports
  const [newIncidentIds, setNewIncidentIds] = useState<string[]>([]);
  const prevIncidentsRef = useRef<Incident[]>(incidents);

  // Tracks newly created issues submitted via Citizen view to drop in with neon entry animation
  useEffect(() => {
    const prevIds = new Set(prevIncidentsRef.current.map(i => i.id));
    const added = incidents.filter(i => !prevIds.has(i.id)).map(i => i.id);
    
    if (added.length > 0) {
      setNewIncidentIds(prev => [...prev, ...added]);
      // Keep blinking neon status for 12 seconds
      setTimeout(() => {
        setNewIncidentIds(prev => prev.filter(id => !added.includes(id)));
      }, 12000);
    }
    
    prevIncidentsRef.current = incidents;
  }, [incidents]);

  // Fluctuating threat risk index simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setThreatIndex(prev => {
        const delta = (Math.random() - 0.5) * 0.04;
        return parseFloat(Math.min(1.5, Math.max(0.4, prev + delta)).toFixed(2));
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Sync /DEV logs from storage when dispatches occur
  useEffect(() => {
    const savedWebhooks = localStorage.getItem('zelus_webhooks');
    if (savedWebhooks) {
      try {
        const parsed = JSON.parse(savedWebhooks);
        if (Array.isArray(parsed)) {
          const mappedLogs = parsed.map((wh: any) => ({
            time: wh.timestamp,
            msg: `[WEBHOOK DISPATCH] ${wh.method} -> ${wh.service} Status ${wh.status}`,
            raw: wh.payload
          }));
          setDevLogs(prev => [...mappedLogs.reverse(), ...prev.slice(-30)]);
        }
      } catch { /* ignore */ }
    }
  }, [incidents]);

  // Handle row click & trigger Swarm animation
  const handleSelectIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    setSwarmStep(0);
    setSwarmAnimating(true);
  };

  // Swarm sequential workflow simulator
  useEffect(() => {
    if (!swarmAnimating || !selectedIncident) return;
    
    let currentStep = 0;
    setSwarmStep(0);

    const logsForSteps = [
      // Step 1: Aegis-Agent logs
      [
        `[AEGIS-AGENT] // Initiating fraud check integrity scan for ticket ${selectedIncident.id}...`,
        `[AEGIS-AGENT] // Checking EXIF photo metadata geotags integrity...`,
        `[AEGIS-AGENT] // Verifying SHA-256 ledger checksum: ${selectedIncident.hash || '0x4FFA89D20E89104A12B890'}`,
        `[AEGIS-AGENT] // Verification complete. CONFIDENCE SCORE: 98.9% SUCCESS. NO FRAUD DETECTED.`
      ],
      // Step 2: Atlas-Agent logs
      [
        `[ATLAS-AGENT] // Commencing spatial location triangulation...`,
        `[ATLAS-AGENT] // GPS Coordinates locked: Lat ${selectedIncident.geolocation?.lat.toFixed(5) || '17.4501'} Lng ${selectedIncident.geolocation?.lng.toFixed(5) || '78.5252'}`,
        `[ATLAS-AGENT] // Resolving nearest volunteer dispatch quadrant...`,
        `[ATLAS-AGENT] // Delivery priority quad mapped: QUADRANT-${selectedIncident.severity === 'Critical' ? 'RED-01' : 'AMBER-02'}.`
      ],
      // Step 3: Helios-Agent logs
      [
        `[HELIOS-AGENT] // Generative Gemini materials estimation matrix engaged...`,
        `[HELIOS-AGENT] // Severity level: ${selectedIncident.severity}. Allocating Bills of Materials (BOM)...`,
        `[HELIOS-AGENT] // BOM items: ${JSON.stringify(selectedIncident.materials || ["General Safety Barrier", "Toolkit"])}`,
        `[HELIOS-AGENT] // Target budget: Materials $${selectedIncident.costBreakdown?.materials || 100} Labor $${selectedIncident.costBreakdown?.labor || 150} Total $${selectedIncident.costBreakdown?.total || 250}`
      ],
      // Step 4: Mercury-Agent logs
      [
        `[MERCURY-AGENT] // Formatting outbound volunteer marketplace dispatches...`,
        `[MERCURY-AGENT] // Twilio SMS dispatch trigger queued to nearby registered contractors.`,
        `[MERCURY-AGENT] // Consensus channel active. Ready for marketplace posting.`
      ]
    ];

    const runTelemetry = () => {
      if (currentStep < 4) {
        const now = new Date().toLocaleTimeString();
        const stepLogs = logsForSteps[currentStep].map(msg => ({ time: now, msg }));
        setDevLogs(prev => [...stepLogs.reverse(), ...prev]);
        setSwarmStep(currentStep + 1);
        currentStep++;
        setTimeout(runTelemetry, 1000);
      } else {
        setSwarmAnimating(false);
      }
    };

    const startTimer = setTimeout(runTelemetry, 450);
    return () => clearTimeout(startTimer);
  }, [swarmAnimating, selectedIncident]);

  const activeCount = incidents.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans select-none" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* 1. TOP CONTROL BAR */}
      <div 
        className="glass-panel border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl relative overflow-hidden"
        style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}
      >
        {/* Status Led */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border flex items-center justify-center relative shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
            <Cpu className={`w-5 h-5 ${isIsolated ? 'animate-bounce' : 'animate-pulse'}`} style={{ color: isIsolated ? 'var(--accent-amber)' : 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
                ZELUS MUNICIPAL GATEWAY // ADMIN
              </h2>
              <span className={`flex items-center gap-1 text-[9px] font-mono border px-2 py-0.5 rounded-full font-extrabold ${
                isIsolated 
                  ? 'animate-pulse bg-amber-500/10 border-amber-500 text-amber-550' 
                  : 'animate-pulse bg-emerald-500/10 border-emerald-500 text-emerald-400'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {isIsolated ? 'LOCAL ISOLATION' : 'SYSTEM: NOMINAL'}
              </span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Operator terminal authenticated as: <strong className="text-zinc-200">{username}</strong>
            </p>
          </div>
        </div>

        {/* Live diagnostics */}
        <div className="flex flex-wrap items-center gap-5 text-[10px] font-mono">
          <div className="flex flex-col">
            <span style={{ color: 'var(--text-muted)' }}>ACTIVE NODE FEED</span>
            <span className={`text-xs font-bold ${isIsolated ? 'text-amber-550' : 'text-zinc-150'}`}>1,482 NODES ONLINE</span>
          </div>
          <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-secondary)' }} />
          
          <div className="flex flex-col">
            <span style={{ color: 'var(--text-muted)' }}>THREAT RISK LEVEL</span>
            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: isIsolated ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
              <AlertTriangle className="w-3.5 h-3.5 fill-current animate-bounce" />
              {threatIndex.toFixed(2)} Index
            </span>
          </div>
          <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-secondary)' }} />
          
          <div className="flex flex-col">
            <span style={{ color: 'var(--text-muted)' }}>WEATHER wear MULTIPLIER</span>
            <span className="text-xs font-bold" style={{ color: 'var(--accent-amber)' }}>
              x{weatherRiskMultiplier.toFixed(2)} Coefficient
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Sync Device / Disconnect toggler */}
          <button 
            onClick={onToggleIsolation}
            className={`px-3 py-1.5 rounded border text-[10px] font-mono tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isIsolated 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500 animate-pulse' 
                : 'border-emerald-500 text-emerald-400 hover:bg-zinc-800/10'
            }`}
            style={{ 
              borderColor: isIsolated ? 'var(--accent-amber)' : 'var(--border-primary)', 
              color: isIsolated ? 'var(--accent-amber)' : 'var(--accent-cyan)' 
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isIsolated ? 'animate-spin' : ''}`} />
            {isIsolated ? 'DATA OFFLINE / DISCONNECT' : 'Sync Device / Disconnect'}
          </button>

          <button 
            onClick={() => { setShowSyncModal(true); setSyncStatus('idle'); }}
            className="px-3 py-1.5 rounded border text-[10px] font-mono tracking-wider font-bold transition-all hover:bg-zinc-800/10 cursor-pointer flex items-center gap-1.5"
            style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Pairing
          </button>
          
          <button 
            onClick={onToggleTheme}
            className="p-2 rounded border hover:bg-zinc-850 cursor-pointer"
            style={{ borderColor: 'var(--border-secondary)' }}
          >
            <Smartphone className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>

          <button 
            onClick={onLogout}
            className="px-3 py-1.5 rounded bg-zinc-900 border text-[10px] font-mono font-bold hover:bg-red-500/15 hover:border-red-500/40 text-red-400 cursor-pointer"
            style={{ borderColor: 'var(--border-secondary)' }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* 2. THREE-PANE DESKTOP WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-[500px]">
        
        {/* LEFT PANEL: GEOSPATIAL TRIAGE ENGINE (4 Columns) */}
        <div 
          className="lg:col-span-4 border rounded-xl p-4 flex flex-col justify-between shadow-xl min-h-[500px] overflow-hidden"
          style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="space-y-4">
            <div className="border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
              <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
                Geospatial Triage Engine
              </h3>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Clustered incoming tickets waiting for municipal authorization.
              </p>
            </div>

            {/* Ticket items list */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {incidents.length === 0 ? (
                <div className="text-center py-12 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  [NO ACTIVE TICKETS SUBMITTED]
                </div>
              ) : (
                incidents.map(inc => {
                  const isSelected = selectedIncident?.id === inc.id;
                  const isNew = newIncidentIds.includes(inc.id);
                  return (
                    <div 
                      key={inc.id}
                      onClick={() => handleSelectIncident(inc)}
                      className={`border p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01] relative ${
                        isNew ? 'animate-pulse border-brand-cyan/65 ring-2 ring-[#00FFCC]/20' : ''
                      }`}
                      style={{ 
                        backgroundColor: isSelected ? 'var(--bg-secondary)' : 'rgba(9, 15, 16, 0.25)', 
                        borderColor: isSelected ? 'var(--accent-cyan)' : isNew ? 'var(--accent-cyan)' : 'var(--border-secondary)',
                        boxShadow: isNew ? '0 0 10px rgba(0, 255, 204, 0.2)' : 'none'
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {inc.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isNew && (
                            <span className="px-1.5 py-0.2 rounded text-[7.5px] font-mono border font-extrabold animate-pulse" style={{
                              backgroundColor: 'rgba(0, 255, 204, 0.1)',
                              borderColor: 'var(--accent-cyan)',
                              color: 'var(--accent-cyan)'
                            }}>
                              NEW ENTRY
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded text-[7.5px] font-mono border font-bold" style={{
                            backgroundColor: inc.severity === 'Critical' ? 'rgba(255,59,48,0.1)' : 'rgba(255,204,0,0.1)',
                            borderColor: inc.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-amber)',
                            color: inc.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-amber)'
                          }}>
                            {inc.severity}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold mt-1.5" style={{ color: 'var(--text-primary)' }}>{inc.category}</h4>
                      <p className="text-[9.5px] truncate mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>{inc.location}</p>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t text-[8px] font-mono" style={{ borderColor: 'var(--border-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          GRID: X:{inc.coordinates[0]} Y:{inc.coordinates[1]}
                        </span>
                        <span className="uppercase font-bold" style={{ color: 'var(--accent-cyan)' }}>
                          {inc.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick injection buttons */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
            <button 
              onClick={() => {
                onAddIncident({
                  category: 'Critical Infrastructure Failure',
                  location: 'Zone-1 Main Transformers',
                  coordinates: [17.4480, 78.5210],
                  severity: 'Critical',
                  status: 'Triage',
                  upvotes: 4,
                  image: '/downed_power_line.png',
                  notes: 'High severity grid node failure causing local sparks and blackout threats.',
                  description: 'High severity grid node failure causing local sparks and blackout threats.',
                  languageBadge: null,
                  geolocation: { lat: 17.4480, lng: 78.5210 },
                  materials: ["High-Voltage Insulation Tape", "Ceramic Insulator Bushings (2 units)", "Grid Diagnostics Meter Rental"],
                  costBreakdown: { materials: 600, labor: 400, total: 1000 }
                });
              }}
              className="py-1 text-[8.5px] font-mono rounded border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              + Inject Critical
            </button>
            <button 
              onClick={() => {
                onAddIncident({
                  category: 'Road & Structural Damage',
                  location: 'Subway Exit Junction 4',
                  coordinates: [17.4520, 78.5280],
                  severity: 'Moderate',
                  status: 'Triage',
                  upvotes: 1,
                  image: '/road_pothole.png',
                  notes: 'Tarmac structural fracture causing pedestrian routing vectors blockage.',
                  description: 'Tarmac structural fracture causing pedestrian routing vectors blockage.',
                  languageBadge: null,
                  geolocation: { lat: 17.4520, lng: 78.5280 },
                  materials: ["Asphalt Patch Compound (5 Bags)", "Traffic Safety Cones (4 units)", "Compaction Rammer Rental"],
                  costBreakdown: { materials: 150, labor: 200, total: 350 }
                });
              }}
              className="py-1 text-[8.5px] font-mono rounded border text-zinc-300 hover:bg-zinc-800/10 cursor-pointer"
              style={{ borderColor: 'var(--border-secondary)' }}
            >
              + Inject Ambient
            </button>
          </div>
        </div>

        {/* CENTER PANEL: DYNAMIC SWARM ORCHESTRATOR SCREEN (5 Columns) */}
        <div 
          className="lg:col-span-5 border rounded-xl p-4 flex flex-col justify-between shadow-xl min-h-[500px] relative overflow-hidden"
          style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}
        >
          {selectedIncident ? (
            <div className="flex-1 flex flex-col justify-between space-y-4 h-full animate-slide-down">
              {/* Header */}
              <div className="border-b pb-3 flex justify-between items-center" style={{ borderColor: 'var(--border-secondary)' }}>
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-brand-cyan" />
                    [ZELUS-ORCHESTRATOR] // SWARM MODULE
                  </h3>
                  <span className="text-[9px] font-mono text-zinc-500">TRIAGING TICKET: {selectedIncident.id}</span>
                </div>
                <button 
                  onClick={() => setSelectedIncident(null)} 
                  className="p-1 rounded hover:bg-zinc-850 cursor-pointer text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Agent decision timeline details */}
              <div className="flex-1 space-y-2 py-2 overflow-y-auto">
                
                {/* 1. Aegis-Agent */}
                <div className={`p-2.5 rounded border transition-all duration-300 ${
                  swarmStep >= 1 ? 'border-brand-cyan/20 bg-zinc-950/20' : 'border-zinc-900/50 opacity-40'
                }`}>
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
                      [Aegis-Agent: Fraud & Verification Check]
                    </span>
                    <span className={swarmStep >= 1 ? 'text-brand-emerald animate-pulse' : 'text-zinc-650'}>
                      {swarmStep >= 1 ? 'VERIFIED // SUCCESS' : 'STANDBY'}
                    </span>
                  </div>
                  {swarmStep >= 1 && (
                    <div className="text-[9px] font-mono mt-1 text-zinc-400 space-y-0.5">
                      <p>• Scanning image EXIF headers & pixel clustering vectors...</p>
                      <p>• Blockchain verification signature verified: <span className="text-brand-cyan">{selectedIncident.hash?.slice(0, 16) || '0x3EAA89FD'}</span></p>
                    </div>
                  )}
                </div>

                {/* 2. Atlas-Agent */}
                <div className={`p-2.5 rounded border transition-all duration-300 ${
                  swarmStep >= 2 ? 'border-brand-cyan/20 bg-zinc-950/20' : 'border-zinc-900/50 opacity-40'
                }`}>
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                      [Atlas-Agent: Geospatial Route Optimization]
                    </span>
                    <span className={swarmStep >= 2 ? 'text-brand-emerald animate-pulse' : 'text-zinc-650'}>
                      {swarmStep >= 2 ? 'ROUTED // SUCCESS' : 'STANDBY'}
                    </span>
                  </div>
                  {swarmStep >= 2 && (
                    <div className="text-[9px] font-mono mt-1 text-zinc-400 space-y-0.5">
                      <p>• Lat: {selectedIncident.geolocation?.lat.toFixed(5) || '17.4501'} N / Lng: {selectedIncident.geolocation?.lng.toFixed(5) || '78.5252'} E</p>
                      <p>• Routing vector committed to GIS Quad Map. Sector delivery index: Level-{selectedIncident.severity === 'Critical' ? '01' : '02'}</p>
                    </div>
                  )}
                </div>

                {/* 3. Helios-Agent */}
                <div className={`p-2.5 rounded border transition-all duration-300 ${
                  swarmStep >= 3 ? 'border-brand-cyan/20 bg-zinc-950/20' : 'border-zinc-900/50 opacity-40'
                }`}>
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    <span className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-brand-cyan" />
                      [Helios-Agent: Material & Cost Matrix]
                    </span>
                    <span className={swarmStep >= 3 ? 'text-brand-emerald animate-pulse' : 'text-zinc-650'}>
                      {swarmStep >= 3 ? 'BOM COMMITTED // SUCCESS' : 'STANDBY'}
                    </span>
                  </div>
                  {swarmStep >= 3 && (
                    <div className="text-[9px] font-mono mt-1 text-zinc-400 space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {selectedIncident.materials?.map((mat, i) => (
                          <span key={i} className="text-[7.5px] border border-zinc-800 bg-zinc-950 px-1 py-0.2 rounded font-mono text-zinc-300">{mat}</span>
                        ))}
                      </div>
                      <p>• Budget breakdown: Materials ${selectedIncident.costBreakdown?.materials || 100} + Labor ${selectedIncident.costBreakdown?.labor || 150} = <strong className="text-brand-cyan">${selectedIncident.costBreakdown?.total || 250} Total</strong></p>
                    </div>
                  )}
                </div>

                {/* 4. Mercury-Agent */}
                <div className={`p-2.5 rounded border transition-all duration-300 ${
                  swarmStep >= 4 ? 'border-brand-cyan/20 bg-zinc-950/20' : 'border-zinc-900/50 opacity-40'
                }`}>
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-brand-cyan" />
                      [Mercury-Agent: Outbound Fleet Dispatch]
                    </span>
                    <span className={swarmStep >= 4 ? 'text-brand-emerald animate-pulse' : 'text-zinc-650'}>
                      {swarmStep >= 4 ? 'READY // OUTBOUND' : 'STANDBY'}
                    </span>
                  </div>
                  {swarmStep >= 4 && (
                    <div className="text-[9px] font-mono mt-1 text-zinc-400 space-y-0.5">
                      <p>• Twilio SMS Dispatch payload committed to API (200 OK)</p>
                      <p>• Geographic overlay updated across active node feeds.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons inside Center Swarm Drawer */}
              <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <div className="flex items-center justify-between text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span>Consensus verifications count:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{(selectedIncident.verifications || []).length} / 3 confirmations</strong>
                </div>

                {selectedIncident.status === 'Triage' ? (
                  <button
                    onClick={() => {
                      if (!swarmAnimating && swarmStep >= 4) {
                        onAuthorizeDispatch(selectedIncident.id);
                        setSelectedIncident(prev => prev ? { ...prev, status: 'Bounty_Posted' } : null);
                      }
                    }}
                    disabled={swarmAnimating || swarmStep < 4}
                    className="w-full py-2 text-zinc-950 font-bold font-mono text-[10px] tracking-wider uppercase rounded cursor-pointer transition-colors shadow-md border hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--accent-cyan)',
                      borderColor: 'var(--accent-cyan)'
                    }}
                  >
                    POST CIVIC BOUNTY TO MARKETPLACE
                  </button>
                ) : (
                  <div className="w-full py-1.5 bg-zinc-950 border border-zinc-800 text-center text-zinc-450 font-mono text-[9px] rounded uppercase font-bold text-zinc-400">
                    BOUNTY COMMITTED TO VOLUNTEER WORKSPACE
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Laptop className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
              <div>
                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Command Overlay Idle</h4>
                <p className="text-[10px] mt-1 max-w-[240px]" style={{ color: 'var(--text-muted)' }}>
                  Select an active triage incident from the left panel to execute sequential swarm pipelines.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: GOOGLE CLOUD STACK & ANALYTICS (3 Columns) */}
        <div 
          className="lg:col-span-3 border rounded-xl p-4 space-y-4 shadow-xl min-h-[500px]"
          style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
              Cloud Infrastructure
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Live Google Cloud stack analytics & Gemini orchestration token loads.
            </p>
          </div>

          {/* Simple Animated Visual Charts */}
          <div className="space-y-4">
            
            {/* Spark chart 1 */}
            <div className="space-y-1 bg-zinc-950/40 p-2.5 border rounded" style={{ borderColor: 'var(--border-secondary)' }}>
              <div className="flex justify-between items-baseline text-[9.5px] font-mono">
                <span style={{ color: 'var(--text-muted)' }}>Incident Queue Velocity</span>
                <span style={{ color: 'var(--accent-cyan)' }}>+{activeCount} incidents/hr</span>
              </div>
              <div className="w-full h-10 mt-1">
                <svg viewBox="0 0 100 20" className="w-full h-full text-brand-cyan opacity-80" style={{ color: 'var(--accent-cyan)' }}>
                  <path d="M 0 18 C 15 15, 30 18, 45 10 C 60 5, 80 12, 100 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M 0 18 C 15 15, 30 18, 45 10 C 60 5, 80 12, 100 2 L 100 20 L 0 20 Z" fill="rgba(0, 255, 204, 0.05)" />
                </svg>
              </div>
            </div>

            {/* Spark chart 2 */}
            <div className="space-y-1 bg-zinc-950/40 p-2.5 border rounded" style={{ borderColor: 'var(--border-secondary)' }}>
              <div className="flex justify-between items-baseline text-[9.5px] font-mono">
                <span style={{ color: 'var(--text-muted)' }}>Spam Isolation Rate</span>
                <span style={{ color: 'var(--accent-amber)' }}>94.2% quarantine</span>
              </div>
              <div className="w-full h-10 mt-1">
                <svg viewBox="0 0 100 20" className="w-full h-full text-brand-amber opacity-85" style={{ color: 'var(--accent-amber)' }}>
                  <path d="M 0 12 C 20 8, 40 14, 60 5 C 80 2, 90 8, 100 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M 0 12 C 20 8, 40 14, 60 5 C 80 2, 90 8, 100 6 L 100 20 L 0 20 Z" fill="rgba(255, 204, 0, 0.05)" />
                </svg>
              </div>
            </div>
          </div>

          {/* Dedicated Styled Google Cloud Telemetry Bento Panel */}
          <div className="space-y-2">
            <span className="text-[8px] font-mono uppercase tracking-wider block font-bold" style={{ color: 'var(--text-muted)' }}>
              Google Cloud Telemetry
            </span>
            <div className="border rounded p-3 space-y-2.5 font-mono text-[9px]" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}>
              <div className="flex justify-between items-center border-b pb-1.5" style={{ borderColor: 'var(--border-secondary)' }}>
                <span>Cloud Run Instance:</span>
                <span className="flex items-center gap-1 font-bold text-[8px]" style={{ color: 'var(--accent-cyan)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                  ACTIVE
                </span>
              </div>

              <div className="flex justify-between items-center border-b pb-1.5" style={{ borderColor: 'var(--border-secondary)' }}>
                <span>Container Build:</span>
                <span className="font-bold text-[8px]" style={{ color: 'var(--accent-cyan)' }}>
                  SUCCESS
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Gemini API Load:</span>
                <strong style={{ color: 'var(--accent-amber)' }}>34.2k tokens/m</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. OPERATIONAL TELEMETRY DRAWER Terminal "/DEV" */}
      <div 
        className="border rounded-xl shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col"
        style={{ 
          borderColor: 'var(--border-secondary)', 
          backgroundColor: 'var(--bg-card)',
          height: devConsoleOpen ? '260px' : '44px'
        }}
      >
        {/* Toggle Header */}
        <div 
          onClick={() => setDevConsoleOpen(!devConsoleOpen)}
          className="px-4 h-11 flex items-center justify-between cursor-pointer border-b select-none"
          style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-white">
            <Terminal className="w-4 h-4 text-brand-cyan" />
            <span>OPERATIONAL TELEMETRY DRAWER // /DEV</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[8px] font-mono text-zinc-550 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900 uppercase font-bold">
              {devLogs.length} updates logged
            </span>
            <span className="text-zinc-400 font-bold font-mono text-xs hover:text-white">
              {devConsoleOpen ? '▼ Minimize' : '▲ Expand /DEV Console'}
            </span>
          </div>
        </div>

        {/* Console logs body */}
        <div className="flex-1 p-4 font-mono text-[9px] space-y-2 overflow-y-auto bg-black select-text text-zinc-300">
          {devLogs.map((log, idx) => (
            <div key={idx} className="space-y-0.5 border-b pb-1 border-zinc-950">
              <div className="flex items-start justify-between">
                <span className="text-zinc-600 font-semibold shrink-0">[{log.time}]</span>
                <span className="text-brand-cyan font-bold flex-1 ml-2 text-emerald-400">{log.msg}</span>
              </div>
              {log.raw && (
                <pre className="text-zinc-500 text-[8.5px] pl-16 bg-[#040606] p-1 rounded border border-zinc-950 whitespace-pre-wrap select-all">
                  {log.raw}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. SYNC DEVICE OVERLAY MODAL */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div 
            className="w-full max-w-sm border rounded-xl p-5 space-y-4 shadow-2xl relative bg-zinc-900"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
          >
            <button 
              onClick={() => setShowSyncModal(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-zinc-850 cursor-pointer text-zinc-450 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 border-b pb-3 border-zinc-800" style={{ borderColor: 'var(--border-secondary)' }}>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                Sync Device Pairing Bridge
              </h3>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Establish high-security bridge link to mobile hardware sensors.
              </p>
            </div>

            {/* QR Scan box */}
            <div className="flex items-center justify-center p-6 border rounded-lg bg-black/60 relative overflow-hidden h-44 border-zinc-800" style={{ borderColor: 'var(--border-secondary)' }}>
              {syncStatus === 'idle' && (
                <div className="text-center space-y-3">
                  <QrCode className="w-16 h-16 mx-auto text-zinc-700" />
                  <button 
                    onClick={() => {
                      setSyncStatus('scanning');
                      setTimeout(() => {
                        setSyncStatus('success');
                        const now = new Date().toLocaleTimeString();
                        setDevLogs(prev => [
                          { time: now, msg: `[DEVICES] Bridge paired successfully. Handshake sync keys committed.` },
                          ...prev
                        ]);
                      }, 2000);
                    }}
                    className="px-4 py-1.5 rounded font-bold font-mono text-[9px] uppercase cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    Initialize Laser Scan
                  </button>
                </div>
              )}

              {syncStatus === 'scanning' && (
                <div className="relative w-28 h-28 border border-dashed flex flex-col items-center justify-center border-brand-cyan/50" style={{ borderColor: 'var(--accent-cyan)' }}>
                  <QrCode className="w-20 h-20 text-brand-cyan opacity-40 animate-pulse" />
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 animate-bounce" style={{ top: '45%' }} />
                  <span className="text-[8px] font-mono mt-2 text-brand-cyan animate-pulse">SCANNING HANDSHAKE...</span>
                </div>
              )}

              {syncStatus === 'success' && (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-brand-emerald animate-bounce" style={{ color: 'var(--accent-cyan)' }} />
                  <span className="text-[9px] font-mono text-brand-emerald block font-bold text-emerald-400">BRIDGE CONNECTION SECURED</span>
                  <button 
                    onClick={() => setShowSyncModal(false)}
                    className="px-3 py-1 rounded bg-zinc-950 border border-zinc-800 text-[8.5px] font-mono text-zinc-350 hover:text-white"
                  >
                    Close Modal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
