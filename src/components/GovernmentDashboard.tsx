import React from 'react';
import type { Incident, Theme } from '../types';
import { 
  AlertTriangle, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Flame, 
  CloudLightning,
  X,
  ShieldCheck,
  Wrench,
  Send,
  Hourglass,
  Coins
} from 'lucide-react';

interface GovernmentDashboardProps {
  incidents: Incident[];
  onAuthorizeDispatch: (id: string) => void;
  weatherRiskMultiplier: number;
  onAddIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'mergedCount'>) => void;
  theme?: Theme;
  onSelectPayload?: (incident: Incident) => void;
}

export const GovernmentDashboard: React.FC<GovernmentDashboardProps> = ({ 
  incidents, 
  onAuthorizeDispatch, 
  weatherRiskMultiplier,
  onAddIncident,
  theme: _theme = 'dark',
  onSelectPayload,
}) => {
  const [lastIncidentsCount, setLastIncidentsCount] = React.useState(incidents.length);
  const [newIncidentToast, setNewIncidentToast] = React.useState<Incident | null>(null);
  const [selectedIncidentRow, setSelectedIncidentRow] = React.useState<Incident | null>(null);

  React.useEffect(() => {
    if (incidents.length > lastIncidentsCount) {
      // New incident captured in state! Show live flashing authority overlay toast
      const latestIncident = incidents[0];
      setNewIncidentToast(latestIncident);
      const timer = setTimeout(() => {
        setNewIncidentToast(null);
      }, 5000);
      setLastIncidentsCount(incidents.length);
      return () => clearTimeout(timer);
    } else if (incidents.length !== lastIncidentsCount) {
      setLastIncidentsCount(incidents.length);
    }
  }, [incidents, lastIncidentsCount]);

  // Real-Time Live Traffic Simulation loop (Autonomously inject reports every 15s)
  React.useEffect(() => {
    const trafficPresets = [
      { category: "Road & Structural Damage", notes: "Power Outage at 8th Boulevard and street intersection.", location: "8th Boulevard & Elm St" },
      { category: "Road & Structural Damage", notes: "Damaged Guardrail at Highway 10. High-risk highway divider crack.", location: "Highway 10 (Mile Marker 45)" },
      { category: "Water Outage & Flooding", notes: "Sewer Line Leak at Oak Street. Minor flooding reported.", location: "Oak Street & W 14th St" },
      { category: "Utility & Spark Hazard", notes: "Flickering Grid Node at Elm Junction. Spark risks under rain.", location: "Elm Junction & Pine Lane" },
      { category: "Road & Structural Damage", notes: "Debris Blockage at Sector-3 Bypass. Pedestrians blocked.", location: "Sector-3 Bypass Road" },
      { category: "Road & Structural Damage", notes: "Pavement Fracture at West Overpass. Major driver speed reduction.", location: "West Overpass Grid 4" },
      { category: "Utility & Spark Hazard", notes: "Signage Collapse on 12th Avenue. Live wires exposed.", location: "12th Avenue & Broadway" }
    ];

    const interval = setInterval(() => {
      const randomPreset = trafficPresets[Math.floor(Math.random() * trafficPresets.length)];
      const xVal = Math.floor(Math.random() * 60) + 20;
      const yVal = Math.floor(Math.random() * 60) + 20;
      const latVal = parseFloat((40.7128 + (Math.random() - 0.5) * 0.08).toFixed(6));
      const lngVal = parseFloat((-74.0060 + (Math.random() - 0.5) * 0.08).toFixed(6));
      const generatedHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()}`;

      onAddIncident({
        category: randomPreset.category,
        location: randomPreset.location,
        coordinates: [xVal, yVal],
        severity: Math.random() > 0.5 ? 'Critical' : 'Moderate',
        status: 'Triage',
        upvotes: Math.floor(Math.random() * 5) + 1,
        image: randomPreset.category === "Water Outage & Flooding" ? "/water_main_burst.png" : randomPreset.category === "Utility & Spark Hazard" ? "/downed_power_line.png" : "/road_pothole.png",
        notes: randomPreset.notes,
        geolocation: { lat: latVal, lng: lngVal },
        exifVerified: true,
        hash: generatedHash
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [onAddIncident]);
  // Stats derivations
  const activeCount = incidents.filter(inc => inc.status !== 'Resolved' && inc.status !== 'Archived').length;
  const dispatchedCount = incidents.filter(inc => inc.status === 'Claimed_In_Progress' || inc.status === 'Peer_Review').length;
  const bountyCount = incidents.filter(inc => inc.status === 'Bounty_Posted').length;

  // Custom risk calculator
  const calculateRiskScore = (inc: Incident) => {
    let base = 10;
    if (inc.severity === 'Critical') base = 40;
    else if (inc.severity === 'Moderate') base = 25;

    const upvoteWeight = inc.upvotes * 1.5;
    const mergeWeight = inc.mergedCount * 8;
    
    return Math.round((base + upvoteWeight + mergeWeight) * weatherRiskMultiplier);
  };

  // Sorting incidents by risk score for Predictive Decay Sidebar
  const predictiveQueue = [...incidents]
    .filter(inc => inc.status !== 'Resolved' && inc.status !== 'Archived')
    .map(inc => ({ ...inc, riskScore: calculateRiskScore(inc) }))
    .sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="space-y-6">
      {/* Real-Time Command Analytics Sparkline Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="glass-panel border-zinc-900 rounded-lg p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
              Active Regional Incidents
            </span>
            <AlertTriangle className="w-4 h-4 text-brand-cyan animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono">{activeCount}</span>
            <span className="text-[10px] text-brand-cyan font-mono flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live Sync
            </span>
          </div>
          {/* Custom Mini Sparkline */}
          <div className="w-full h-8 mt-2">
            <svg viewBox="0 0 100 20" className="w-full h-full text-brand-cyan opacity-80 group-hover:opacity-100 transition-opacity">
              <defs>
                <linearGradient id="gradient-cyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path 
                d={`M 0 18 Q 20 ${18 - activeCount * 2} 40 ${12 - activeCount} T 80 8 T 100 4`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              />
              <path 
                d={`M 0 18 Q 20 ${18 - activeCount * 2} 40 ${12 - activeCount} T 80 8 T 100 4 L 100 20 L 0 20 Z`} 
                fill="url(#gradient-cyan)"
              />
            </svg>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel border-zinc-900 rounded-lg p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
              Spam Isolation Ratio
            </span>
            <Layers className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono">94.2%</span>
            <span className="text-[10px] text-brand-emerald font-mono flex items-center gap-0.5">
              +1.4% (24h)
            </span>
          </div>
          {/* Custom Mini Sparkline */}
          <div className="w-full h-8 mt-2">
            <svg viewBox="0 0 100 20" className="w-full h-full text-brand-emerald opacity-80 group-hover:opacity-100 transition-opacity">
              <defs>
                <linearGradient id="gradient-emerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E676" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#00E676" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path 
                d="M 0 15 Q 15 12 30 14 T 60 8 T 85 5 T 100 2" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              />
              <path 
                d="M 0 15 Q 15 12 30 14 T 60 8 T 85 5 T 100 2 L 100 20 L 0 20 Z" 
                fill="url(#gradient-emerald)"
              />
            </svg>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel border-zinc-900 rounded-lg p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
              Average Dispatch Delta
            </span>
            <Clock className="w-4 h-4 text-brand-amber" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono">14.0 Mins</span>
            <span className="text-[10px] text-brand-amber font-mono flex items-center gap-0.5">
              -3.2 Mins
            </span>
          </div>
          {/* Custom Mini Sparkline */}
          <div className="w-full h-8 mt-2">
            <svg viewBox="0 0 100 20" className="w-full h-full text-brand-amber opacity-80 group-hover:opacity-100 transition-opacity">
              <defs>
                <linearGradient id="gradient-amber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF9100" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#FF9100" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path 
                d="M 0 5 Q 20 8 40 4 T 70 12 T 100 16" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              />
              <path 
                d="M 0 5 Q 20 8 40 4 T 70 12 T 100 16 L 100 20 L 0 20 Z" 
                fill="url(#gradient-amber)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Dashboard Workspace layout (Split screen sidebar + table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Geospatial Clustering Triage Engine: TABULAR LIST (8 cols) */}
        <div className="lg:col-span-8 glass-panel border-zinc-900 rounded-lg p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-cyan" />
                Geospatial Clustering Triage Engine
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Live incoming reports clustered dynamically by geospatial coordinates
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded">
                Triage queue: {incidents.filter(i => i.status === 'Triage').length}
              </span>
              <span className="text-[10px] font-mono text-brand-cyan bg-brand-cyan/5 border border-brand-cyan/25 px-2 py-0.5 rounded">
                Active Bounties: {bountyCount}
              </span>
              <span className="text-[10px] font-mono text-brand-amber bg-brand-amber/5 border border-brand-amber/25 px-2 py-0.5 rounded">
                Active Claims: {dispatchedCount}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Ticket ID / Category</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-center">Severity</th>
                  <th className="py-2.5 px-3 text-center">State</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 text-xs">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 font-mono">
                      [NO INCIDENTS REGISTERED ON THE LEDGER]
                    </td>
                  </tr>
                ) : (
                  incidents.map((incident) => (
                    <tr 
                      key={incident.id} 
                      className="hover:bg-zinc-900/35 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedIncidentRow(incident);
                        if (onSelectPayload) onSelectPayload(incident);
                      }}
                    >
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-1.5">
                            {incident.id}
                            {incident.mergedCount > 1 && (
                              <span className="text-[9px] bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan px-1.5 rounded-full font-mono scale-90">
                                Clustered: {incident.mergedCount} Reports Merged
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-zinc-200 mt-0.5">
                            {incident.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-mono">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-zinc-650 flex-shrink-0" />
                            <span className="truncate max-w-[150px] font-semibold text-zinc-200">{incident.location}</span>
                          </div>
                          <span className="text-[9px] text-brand-cyan/85 mt-0.5 ml-4">
                            {incident.geolocation 
                              ? `${incident.geolocation.lat.toFixed(5)}°, ${incident.geolocation.lng.toFixed(5)}°` 
                              : `${(40.7128 + (incident.coordinates?.[0] || 0) * 0.001).toFixed(5)}°, ${(-74.0060 - (incident.coordinates?.[1] || 0) * 0.001).toFixed(5)}°`
                            }
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-semibold inline-block ${
                          incident.severity === 'Critical' 
                            ? 'bg-red-950/20 text-red-400 border-red-900/50' 
                            : incident.severity === 'Moderate'
                            ? 'bg-brand-amber/5 text-brand-amber border-brand-amber/25'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-850'
                        }`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono border inline-block uppercase font-semibold ${
                          incident.status === 'Triage' 
                            ? 'bg-brand-cyan/5 text-brand-cyan border-brand-cyan/25 animate-pulse-cyan' 
                            : incident.status === 'Bounty_Posted'
                            ? 'bg-purple-950/20 text-purple-400 border-purple-900/30'
                            : incident.status === 'Claimed_In_Progress'
                            ? 'bg-brand-amber/5 text-brand-amber border-brand-amber/25 animate-pulse-amber'
                            : incident.status === 'Peer_Review'
                            ? 'bg-blue-950/20 text-blue-400 border-blue-900/30'
                            : incident.status === 'Resolved'
                            ? 'bg-brand-emerald/5 text-brand-emerald border-brand-emerald/25'
                            : 'bg-zinc-900/40 text-zinc-500 border-zinc-800'
                        }`}>
                          {incident.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {incident.status === 'Triage' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAuthorizeDispatch(incident.id);
                              if (selectedIncidentRow && selectedIncidentRow.id === incident.id) {
                                setSelectedIncidentRow(prev => prev ? { ...prev, status: 'Bounty_Posted' } : null);
                              }
                            }}
                            className="bg-brand-cyan hover:bg-cyan-400 text-zinc-950 font-semibold px-2.5 py-1.5 rounded text-[10px] font-mono tracking-tight flex items-center gap-1.5 ml-auto cursor-pointer shadow-[0_0_8px_rgba(0,229,255,0.2)] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all"
                          >
                            <Coins className="w-3 h-3" />
                            Post Civic Bounty
                          </button>
                        ) : incident.status === 'Bounty_Posted' ? (
                          <span className="text-[10px] text-purple-400 font-mono flex items-center justify-end gap-1.5">
                            <Coins className="w-3.5 h-3.5" />
                            Bounty Open
                          </span>
                        ) : incident.status === 'Claimed_In_Progress' ? (
                          <span className="text-[10px] text-brand-amber font-mono flex items-center justify-end gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            Claimed / Progress
                          </span>
                        ) : incident.status === 'Peer_Review' ? (
                          <span className="text-[10px] text-blue-400 font-mono flex items-center justify-end gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                            In Peer Review
                          </span>
                        ) : incident.status === 'Resolved' ? (
                          <span className="text-[10px] text-brand-emerald font-mono flex items-center justify-end gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolved
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono flex items-center justify-end gap-1.5">
                            <X className="w-3.5 h-3.5" />
                            Archived
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Predictive Decay Indexing Queue: SIDEBAR FEED (4 cols) */}
        <div className="lg:col-span-4 glass-panel border-zinc-900 rounded-lg p-5 space-y-4 shadow-xl">
          <div className="border-b border-zinc-900 pb-3 flex flex-col gap-1">
            <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-brand-amber" />
              Predictive Decay Indexing
            </h2>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Active structural risks ordered dynamically by atmospheric weather coefficient.
            </p>
          </div>

          {/* Current multiplier status indicator */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded p-3 flex items-center gap-3">
            <div className={`p-2 rounded ${weatherRiskMultiplier > 1.2 ? 'bg-brand-amber/10 border border-brand-amber/20 text-brand-amber' : 'bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan'}`}>
              <CloudLightning className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-400">Weather Multiplier</span>
                <span className={weatherRiskMultiplier > 1.2 ? 'text-brand-amber font-bold' : 'text-brand-cyan'}>
                  x{weatherRiskMultiplier.toFixed(2)}
                </span>
              </div>
              <p className="text-[9px] text-zinc-550 truncate mt-0.5">
                {weatherRiskMultiplier > 1.2 
                  ? 'Severe storm forecast: accelerated infrastructure wear' 
                  : 'Atmospheric conditions standard: baseline wear'
                }
              </p>
            </div>
          </div>

          {/* Sidebar Feed Cards */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {predictiveQueue.length === 0 ? (
              <div className="text-center py-6 text-zinc-650 font-mono text-[10px]">
                [NO PENDING RISKS REGISTERED]
              </div>
            ) : (
              predictiveQueue.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-zinc-950/40 border border-zinc-900/80 hover:border-zinc-850 rounded p-3.5 space-y-2.5 transition-colors relative overflow-hidden group"
                >
                  {/* Top indicator containing index badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-500">
                      {item.id} // {item.timestamp}
                    </span>
                    <div className="flex items-center gap-1 bg-red-950/10 border border-red-900/30 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-red-400">
                      <Flame className="w-2.5 h-2.5 fill-current animate-pulse" />
                      Index: {item.riskScore}
                    </div>
                  </div>

                  {/* Incident Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                      {item.category}
                    </h4>
                    <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {item.location}
                    </p>
                  </div>

                  {/* Index progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.riskScore > 65 
                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                            : item.riskScore > 40
                            ? 'bg-brand-amber'
                            : 'bg-brand-cyan'
                        }`}
                        style={{ width: `${Math.min(100, item.riskScore)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Sidebar Detail Slide-over Panel */}
      {selectedIncidentRow && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setSelectedIncidentRow(null)}
          />

          {/* Drawer content container */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 z-50 bg-[#050505] border-l border-zinc-900 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between font-sans text-zinc-150 backdrop-blur-md animate-slide-left">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-zinc-550">{selectedIncidentRow.id} // LEDGER DATA</span>
                  <h3 className="text-sm font-bold text-white uppercase mt-0.5 tracking-tight">{selectedIncidentRow.category}</h3>
                </div>
                <button 
                  onClick={() => setSelectedIncidentRow(null)}
                  className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Severity badges */}
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-semibold inline-block ${
                  selectedIncidentRow.severity === 'Critical' 
                    ? 'bg-red-950/20 text-red-400 border-red-900/50' 
                    : 'bg-brand-amber/5 text-brand-amber border-brand-amber/25'
                }`}>
                  Severity: {selectedIncidentRow.severity}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono border inline-block uppercase font-semibold ${
                  selectedIncidentRow.status === 'Triage' 
                    ? 'bg-brand-cyan/5 text-brand-cyan border-brand-cyan/25 animate-pulse-cyan' 
                    : selectedIncidentRow.status === 'Bounty_Posted'
                    ? 'bg-purple-950/20 text-purple-400 border-purple-900/30'
                    : selectedIncidentRow.status === 'Claimed_In_Progress'
                    ? 'bg-brand-amber/5 text-brand-amber border-brand-amber/25 animate-pulse-amber'
                    : selectedIncidentRow.status === 'Peer_Review'
                    ? 'bg-blue-950/20 text-blue-400 border-blue-900/30'
                    : selectedIncidentRow.status === 'Resolved'
                    ? 'bg-brand-emerald/5 text-brand-emerald border-brand-emerald/25'
                    : 'bg-zinc-900/40 text-zinc-550 border-zinc-800'
                }`}>
                  State: {selectedIncidentRow.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Image if any */}
              {selectedIncidentRow.image && (
                <div className="w-full h-36 rounded-lg overflow-hidden border border-zinc-900/80 bg-zinc-950/50 relative">
                  <img 
                    src={selectedIncidentRow.image} 
                    alt={selectedIncidentRow.category}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Progress image if any */}
              {selectedIncidentRow.progressPhoto && (
                <div className="space-y-1 bg-zinc-950/80 border border-brand-cyan/20 p-2.5 rounded">
                  <span className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-wider block border-b border-zinc-900 pb-1 mb-1 font-semibold">Volunteer Structural Repair Photo</span>
                  <div className="w-full h-36 rounded-lg overflow-hidden border border-zinc-905 bg-zinc-950 relative">
                    <img 
                      src={selectedIncidentRow.progressPhoto} 
                      alt="Progress Verification"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Location & GPS coords */}
              <div className="space-y-1 bg-zinc-950/80 border border-zinc-900 p-3 rounded">
                <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider block">Target Coordinates</span>
                <div className="text-xs text-zinc-200 font-semibold flex items-center gap-1.5 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                  {selectedIncidentRow.location}
                </div>
                <div className="text-[10px] font-mono text-brand-cyan/85 pl-5">
                  GPS: {selectedIncidentRow.geolocation 
                    ? `${selectedIncidentRow.geolocation.lat.toFixed(6)}°, ${selectedIncidentRow.geolocation.lng.toFixed(6)}°` 
                    : `${(40.7128 + (selectedIncidentRow.coordinates?.[0] || 0) * 0.001).toFixed(6)}°, ${(-74.0060 - (selectedIncidentRow.coordinates?.[1] || 0) * 0.001).toFixed(6)}°`
                  }
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1 bg-zinc-950/80 border border-zinc-900 p-3 rounded">
                <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider block">Observations Text</span>
                <p className="text-xs text-zinc-350 leading-relaxed font-sans">{selectedIncidentRow.notes || 'No description provided.'}</p>
              </div>

              {/* Multi-Agent Swarm Audit Ledger */}
              <div className="space-y-2">
                <span className="text-[9.5px] font-mono text-zinc-550 uppercase tracking-wider block">
                  Swarm Audit Ledger
                </span>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  
                  {/* Aegis Agent */}
                  <div className="border border-zinc-900/80 p-2.5 rounded bg-zinc-950/30 font-mono text-[9.5px] text-zinc-450 space-y-1">
                    <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1 text-zinc-400">
                      <span className="font-bold flex items-center gap-1.5 text-white">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
                        [Aegis-Agent]
                      </span>
                      <span className="text-brand-emerald text-[8px] font-bold">✓ AUTHENTIC</span>
                    </div>
                    <p className="text-zinc-300 leading-normal">
                      {selectedIncidentRow.swarmData?.aegisConfidence || 'Confidence Threshold: 98.6% Authentic (Visual checks passed)'}
                    </p>
                  </div>

                  {/* Atlas Agent */}
                  <div className="border border-zinc-900/80 p-2.5 rounded bg-zinc-950/30 font-mono text-[9.5px] text-zinc-450 space-y-1">
                    <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1 text-zinc-400">
                      <span className="font-bold flex items-center gap-1.5 text-white">
                        <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                        [Atlas-Agent]
                      </span>
                      <span className="text-brand-emerald text-[8px] font-bold">✓ ROUTED</span>
                    </div>
                    <p className="text-zinc-300 leading-normal">
                      {selectedIncidentRow.swarmData?.atlasRouting || 'Routing Optimized via Spatial Matrix (Swarm Triangulated)'}
                    </p>
                  </div>

                  {/* Vulcan Agent */}
                  <div className="border border-zinc-900/80 p-2.5 rounded bg-zinc-950/30 font-mono text-[9.5px] text-zinc-450 space-y-1">
                    <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1 text-zinc-400">
                      <span className="font-bold flex items-center gap-1.5 text-white">
                        <Wrench className="w-3.5 h-3.5 text-brand-cyan" />
                        [Vulcan-Agent]
                      </span>
                      <span className="text-brand-emerald text-[8px] font-bold">✓ DISPATCHED</span>
                    </div>
                    <p className="text-zinc-300 leading-normal">
                      {selectedIncidentRow.swarmData?.vulcanMaterial || 'Resource Dispatched: Asphalt Patching Rig Type-B'}
                    </p>
                  </div>

                  {/* Mercury Agent */}
                  <div className="border border-zinc-900/80 p-2.5 rounded bg-zinc-950/30 font-mono text-[9.5px] text-zinc-450 space-y-1">
                    <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1 text-zinc-400">
                      <span className="font-bold flex items-center gap-1.5 font-mono text-white">
                        <Send className="w-3.5 h-3.5 text-brand-cyan" />
                        [Mercury-Agent]
                      </span>
                      <span className="text-brand-emerald text-[8px] font-bold">✓ PINGED</span>
                    </div>
                    <p className="text-zinc-300 leading-normal break-all">
                      {selectedIncidentRow.swarmData?.mercuryPing || 'Outbound target API endpoint success (200 OK)'}
                    </p>
                  </div>

                  {/* Chronos Agent */}
                  <div className="border border-zinc-900/80 p-2.5 rounded bg-zinc-950/30 font-mono text-[9.5px] text-zinc-450 space-y-1">
                    <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1 text-zinc-400">
                      <span className="font-bold flex items-center gap-1.5 text-white">
                        <Hourglass className="w-3.5 h-3.5 text-brand-cyan" />
                        [Chronos-Agent]
                      </span>
                      <span className="text-brand-emerald text-[8px] font-bold">✓ TRACKED</span>
                    </div>
                    <p className="text-zinc-300 leading-normal">
                      {selectedIncidentRow.swarmData?.chronosEta || 'ETA locked: 14.2 Hours (Predictive degradation verified)'}
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-zinc-900 mt-6">
              {selectedIncidentRow.status === 'Triage' ? (
                <button
                  onClick={() => {
                    onAuthorizeDispatch(selectedIncidentRow.id);
                    setSelectedIncidentRow(prev => prev ? { ...prev, status: 'Bounty_Posted' } : null);
                  }}
                  className="w-full py-2.5 bg-brand-cyan hover:bg-cyan-400 text-zinc-950 font-bold rounded text-[11px] font-mono tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(0,229,255,0.15)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Post Civic Bounty
                </button>
              ) : selectedIncidentRow.status === 'Bounty_Posted' ? (
                <div className="w-full py-2.5 bg-purple-950/20 border border-purple-900/30 text-purple-400 font-mono text-[10px] rounded text-center uppercase flex items-center justify-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Bounty Posted & Marketplace Open
                </div>
              ) : selectedIncidentRow.status === 'Claimed_In_Progress' ? (
                <div className="w-full py-2.5 bg-brand-amber/10 border border-brand-amber/20 text-brand-amber font-mono text-[10px] rounded text-center uppercase flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Claimed by {selectedIncidentRow.claimedBy || 'Volunteer'}
                </div>
              ) : selectedIncidentRow.status === 'Peer_Review' ? (
                <div className="w-full py-2.5 bg-blue-950/20 border border-blue-900/30 text-blue-400 font-mono text-[10px] rounded text-center uppercase flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  Awaiting Peer Review Verification
                </div>
              ) : selectedIncidentRow.status === 'Resolved' ? (
                <div className="w-full py-2.5 bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald font-mono text-[10px] rounded text-center uppercase flex items-center justify-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Response Resolved
                </div>
              ) : (
                <div className="w-full py-2.5 bg-zinc-900/40 border border-zinc-800 text-zinc-550 font-mono text-[10px] rounded text-center uppercase flex items-center justify-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  Ticket Archived
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating Live Triage Toast Alert */}
      {newIncidentToast && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-zinc-950 border border-brand-cyan/40 rounded-lg p-4 shadow-[0_0_30px_rgba(0,229,255,0.25)] animate-slide-up flex flex-col gap-2 select-none">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
            <span className="text-[9.5px] font-mono font-bold text-brand-cyan flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-ping" />
              [AI TRIAGE ALERT]
            </span>
            <button 
              onClick={() => setNewIncidentToast(null)} 
              className="text-zinc-550 hover:text-zinc-350 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="font-mono text-[9px] text-zinc-300 leading-normal">
            New incoming node detected in Sector-3. Verifying spatial integrity...
          </div>
          <div className="bg-zinc-900/40 p-2 border border-zinc-900/60 rounded flex flex-col gap-0.5">
            <span className="font-bold text-white text-[10.5px]">{newIncidentToast.category}</span>
            <span className="text-zinc-400 text-[9.5px] font-medium">{newIncidentToast.location}</span>
            <span className="text-brand-cyan font-mono text-[8px] mt-1">
              {newIncidentToast.geolocation 
                ? `GPS: ${newIncidentToast.geolocation.lat.toFixed(6)}°, ${newIncidentToast.geolocation.lng.toFixed(6)}°` 
                : `GPS: ${(40.7128 + newIncidentToast.coordinates[0] * 0.001).toFixed(6)}°, ${(-74.0060 - newIncidentToast.coordinates[1] * 0.001).toFixed(6)}°`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
