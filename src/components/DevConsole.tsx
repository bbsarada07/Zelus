import React, { useState, useEffect, useRef } from 'react';
import type { DevLog, Theme, Incident, WebhookLog } from '../types';
import {
  X, Terminal, Pause, Play, Copy, Check, Zap, AlertTriangle,
  ChevronRight, Filter, Send
} from 'lucide-react';

interface DevConsoleProps {
  logs: DevLog[];
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  selectedPayload: Incident | null;
  onClearPayload: () => void;
  onForceCritical: () => void;
  onForceFaulty: () => void;
  webhookLogs: WebhookLog[];
}

type AgentFilter = 'ORCHESTRATOR' | 'AEGIS' | 'ATLAS' | 'VULCAN' | 'MERCURY' | 'CHRONOS' | 'SYSTEM';
const ALL_AGENTS: AgentFilter[] = ['ORCHESTRATOR', 'AEGIS', 'ATLAS', 'VULCAN', 'MERCURY', 'CHRONOS', 'SYSTEM'];

const LEVEL_COLORS: Record<DevLog['level'], string> = {
  INFO: '#71717a',
  SUCCESS: '#00E676',
  WARNING: '#FF9100',
  ERROR: '#f87171',
  CRITICAL: '#ff3b3b',
};

const AGENT_COLORS: Record<AgentFilter, string> = {
  ORCHESTRATOR: '#00E5FF',
  AEGIS: '#a78bfa',
  ATLAS: '#60a5fa',
  VULCAN: '#fb923c',
  MERCURY: '#34d399',
  CHRONOS: '#f472b6',
  SYSTEM: '#94a3b8',
};

function formatLog(log: DevLog): React.ReactNode {
  const agentColor = AGENT_COLORS[log.agent] || '#94a3b8';
  const levelColor = LEVEL_COLORS[log.level] || '#71717a';

  return (
    <div key={log.id} className="flex gap-2 items-start py-0.5 font-mono text-[10.5px] leading-relaxed border-b border-zinc-900/40 hover:bg-zinc-900/20 px-3 transition-colors">
      <span className="shrink-0 text-zinc-600 tabular-nums w-[70px]">{log.timestamp}</span>
      <span className="shrink-0 font-bold w-[90px]" style={{ color: agentColor }}>[{log.agent}]</span>
      <span className="shrink-0 font-bold w-[64px]" style={{ color: levelColor }}>{log.level}</span>
      <span className="text-zinc-300 break-all flex-1">{log.message}</span>
    </div>
  );
}

export const DevConsole: React.FC<DevConsoleProps> = ({
  logs,
  isOpen,
  onClose,
  theme,
  selectedPayload,
  onClearPayload,
  onForceCritical,
  onForceFaulty,
  webhookLogs,
}) => {
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<AgentFilter>>(new Set(ALL_AGENTS));
  const [viewTab, setViewTab] = useState<'stream' | 'payload' | 'webhooks'>('stream');
  const bottomRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (!paused && viewTab === 'stream') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, paused, viewTab]);

  // Switch to payload tab when a payload is selected
  useEffect(() => {
    if (selectedPayload) setViewTab('payload');
  }, [selectedPayload]);

  const filteredLogs = logs.filter(l => activeFilters.has(l.agent));

  const toggleFilter = (agent: AgentFilter) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(agent)) next.delete(agent);
      else next.add(agent);
      return next;
    });
  };

  const handleCopyLog = async () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.agent}] ${l.level}: ${l.message}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  if (!isOpen) return null;

  const bg = isDark ? '#070709' : '#FDFBF7';
  const border = isDark ? 'rgba(0,229,255,0.12)' : 'rgba(0,168,107,0.2)';
  const headerBg = isDark ? '#0a0a0c' : '#F5F2EB';
  const terminalBg = isDark ? '#050507' : '#f0ede6';
  const accent = isDark ? '#00E5FF' : '#00A86B';
  const textPrimary = isDark ? '#e4e4e7' : '#1A1A1A';
  const textMuted = isDark ? 'rgba(113,113,122,0.9)' : 'rgba(80,80,70,0.9)';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-[101] flex flex-col shadow-2xl animate-slide-left"
        style={{
          width: 'min(520px, 95vw)',
          background: bg,
          borderLeft: `1px solid ${border}`,
          boxShadow: isDark
            ? '-20px 0 80px rgba(0,229,255,0.06), -10px 0 40px rgba(0,0,0,0.7)'
            : '-20px 0 80px rgba(0,168,107,0.04), -10px 0 40px rgba(0,0,0,0.1)',
        }}
      >
        {/* ─── HEADER ─── */}
        <div
          className="shrink-0 px-4 py-3 flex items-center justify-between"
          style={{ background: headerBg, borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4" style={{ color: accent }} />
            <span className="text-sm font-bold font-mono" style={{ color: textPrimary }}>
              Developer Log Core
            </span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase"
              style={{
                background: isDark ? 'rgba(0,229,255,0.06)' : 'rgba(0,168,107,0.06)',
                border: `1px solid ${border}`,
                color: accent,
              }}
            >
              {filteredLogs.length} entries
            </span>
          </div>
          <button onClick={onClose} className="cursor-pointer" style={{ color: textMuted }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── INJECTION RIG ─── */}
        <div
          className="shrink-0 px-4 py-3 space-y-2"
          style={{ background: isDark ? '#08080b' : '#f5f2eb', borderBottom: `1px solid ${border}` }}
        >
          <div
            className="text-[9px] font-mono uppercase tracking-widest mb-2"
            style={{ color: textMuted }}
          >
            Force Injection Rig
          </div>
          <div className="flex gap-2">
            <button
              onClick={onForceCritical}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(255,59,59,0.1)',
                border: '1px solid rgba(255,59,59,0.35)',
                color: '#ff6b6b',
                boxShadow: '0 0 12px rgba(255,59,59,0.1)',
              }}
            >
              <Zap className="w-3 h-3" />
              Force Critical Node
            </button>
            <button
              onClick={onForceFaulty}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(255,145,0,0.08)',
                border: '1px solid rgba(255,145,0,0.3)',
                color: '#FF9100',
                boxShadow: '0 0 12px rgba(255,145,0,0.08)',
              }}
            >
              <AlertTriangle className="w-3 h-3" />
              Force Faulty Node
            </button>
          </div>
        </div>

        {/* ─── AGENT FILTERS ─── */}
        <div
          className="shrink-0 px-4 py-2.5 flex flex-wrap gap-1.5 items-center"
          style={{ background: isDark ? '#070709' : '#f8f5ef', borderBottom: `1px solid ${border}` }}
        >
          <Filter className="w-3 h-3 shrink-0" style={{ color: textMuted }} />
          {ALL_AGENTS.map(agent => {
            const active = activeFilters.has(agent);
            return (
              <button
                key={agent}
                onClick={() => toggleFilter(agent)}
                className="text-[9px] font-mono px-2 py-0.5 rounded cursor-pointer transition-all"
                style={{
                  background: active
                    ? `${AGENT_COLORS[agent]}18`
                    : isDark ? '#111115' : '#e8e4dc',
                  border: `1px solid ${active ? AGENT_COLORS[agent] + '50' : isDark ? '#222228' : '#ccc8c0'}`,
                  color: active ? AGENT_COLORS[agent] : textMuted,
                  opacity: active ? 1 : 0.5,
                }}
              >
                {agent}
              </button>
            );
          })}
        </div>

        {/* ─── TABS ─── */}
        <div
          className="shrink-0 flex"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          {(['stream', 'payload', 'webhooks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setViewTab(tab)}
              className="flex-1 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider cursor-pointer transition-all"
              style={{
                color: viewTab === tab ? accent : textMuted,
                borderBottom: viewTab === tab ? `2px solid ${accent}` : '2px solid transparent',
                background: viewTab === tab
                  ? isDark ? 'rgba(0,229,255,0.03)' : 'rgba(0,168,107,0.03)'
                  : 'transparent',
              }}
            >
              {tab === 'stream' ? `Live Stream (${filteredLogs.length})` : tab === 'payload' ? 'Payload Inspector' : 'Outbound Dispatches'}
            </button>
          ))}
        </div>

        {/* ─── CONTENT ─── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {viewTab === 'stream' ? (
            <>
              {/* Stream controls */}
              <div
                className="shrink-0 px-4 py-2 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${border}` }}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaused(p => !p)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer transition-all"
                    style={{
                      background: paused
                        ? 'rgba(0,230,118,0.1)'
                        : isDark ? '#111115' : '#eae6de',
                      border: `1px solid ${paused ? 'rgba(0,230,118,0.3)' : isDark ? '#222228' : '#d0ccc4'}`,
                      color: paused ? '#00E676' : textMuted,
                    }}
                  >
                    {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                </div>
                <button
                  onClick={handleCopyLog}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer"
                  style={{
                    background: isDark ? '#111115' : '#eae6de',
                    border: `1px solid ${isDark ? '#222228' : '#d0ccc4'}`,
                    color: copied ? '#00E676' : textMuted,
                  }}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy Log'}
                </button>
              </div>

              {/* Log terminal */}
              <div
                className="flex-1 overflow-y-auto text-[10.5px] font-mono leading-relaxed"
                style={{ background: terminalBg }}
              >
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                    <Terminal className="w-8 h-8 opacity-20" style={{ color: accent }} />
                    <p className="text-[11px] font-mono" style={{ color: textMuted }}>
                      Awaiting swarm activity... Submit an incident or use the Injection Rig above.
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredLogs.map(log => formatLog(log))}
                    {!paused && <div ref={bottomRef} />}
                  </>
                )}
              </div>
            </>
          ) : viewTab === 'payload' ? (
            /* Payload Inspector */
            <div className="flex-1 overflow-y-auto" style={{ background: terminalBg }}>
              {selectedPayload ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" style={{ color: accent }} />
                      <span className="text-[11px] font-mono font-bold" style={{ color: textPrimary }}>
                        {selectedPayload.id} // Raw Agent Payload
                      </span>
                    </div>
                    <button
                      onClick={onClearPayload}
                      className="text-[9px] font-mono cursor-pointer"
                      style={{ color: textMuted }}
                    >
                      [Clear]
                    </button>
                  </div>
                  <pre
                    className="text-[10px] font-mono p-4 rounded-lg overflow-x-auto leading-relaxed whitespace-pre-wrap break-all"
                    style={{
                      background: isDark ? '#0a0a0e' : '#ece9e0',
                      border: `1px solid ${border}`,
                      color: textPrimary,
                    }}
                  >
                    {JSON.stringify({
                      incidentId: selectedPayload.id,
                      category: selectedPayload.category,
                      location: selectedPayload.location,
                      severity: selectedPayload.severity,
                      status: selectedPayload.status,
                      coordinates: selectedPayload.coordinates,
                      geolocation: selectedPayload.geolocation,
                      exifVerified: selectedPayload.exifVerified,
                      hash: selectedPayload.hash,
                      upvotes: selectedPayload.upvotes,
                      timestamp: selectedPayload.timestamp,
                      mergedCount: selectedPayload.mergedCount,
                      notes: selectedPayload.notes,
                      swarmData: selectedPayload.swarmData,
                      claimedBy: selectedPayload.claimedBy,
                      etaTargetTime: selectedPayload.etaTargetTime,
                      progressPhoto: selectedPayload.progressPhoto ? (selectedPayload.progressPhoto.slice(0, 40) + '... (Data URL)') : undefined,
                      verifications: selectedPayload.verifications,
                      webhookLogs: selectedPayload.webhookLogs,
                    }, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                  <Terminal className="w-8 h-8 opacity-20" style={{ color: accent }} />
                  <p className="text-[11px] font-mono" style={{ color: textMuted }}>
                    Click any row in the Admin Triage Table to pull its raw agent JSON payload here for inspection.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Webhooks tab */
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-zinc-100" style={{ background: terminalBg }}>
              <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                <span className="text-[11px] font-mono font-bold" style={{ color: textPrimary }}>
                  {selectedPayload 
                    ? `[DISPATCHES] Inc: ${selectedPayload.id}` 
                    : '[GLOBAL DISPATCHES] Outbound API Webhooks'}
                </span>
                {selectedPayload && (
                  <button
                    onClick={onClearPayload}
                    className="text-[9px] font-mono text-zinc-500 hover:text-zinc-350 cursor-pointer"
                  >
                    [Clear Target Filter]
                  </button>
                )}
              </div>

              {((selectedPayload ? selectedPayload.webhookLogs : webhookLogs) || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Send className="w-8 h-8 opacity-20 animate-bounce" style={{ color: accent }} />
                  <p className="text-[11px] font-mono" style={{ color: textMuted }}>
                    No webhooks dispatched yet for this state.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {((selectedPayload ? selectedPayload.webhookLogs : webhookLogs) || []).map((wh, idx) => {
                    const isSuccess = wh.status >= 200 && wh.status < 300;
                    return (
                      <div 
                        key={wh.id || idx} 
                        className="border border-zinc-900/80 bg-zinc-950/40 rounded p-3.5 space-y-2 relative overflow-hidden transition-all duration-300"
                        style={{
                          borderLeft: `3px solid ${isSuccess ? '#00E676' : '#ff3b3b'}`
                        }}
                      >
                        <div className="flex items-center justify-between font-mono text-[9px] border-b border-zinc-900 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold px-1 py-0.5 rounded text-[8px] ${
                              wh.method === 'POST' 
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                                : wh.method === 'PUSH' 
                                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' 
                                : 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                            }`}>
                              {wh.method}
                            </span>
                            <span className="text-zinc-300 font-semibold">{wh.service}</span>
                          </div>
                          <span className="text-zinc-550 tabular-nums">{wh.timestamp}</span>
                        </div>
                        
                        <pre className="text-[9.5px] font-mono bg-zinc-950/90 border border-zinc-900/60 p-2 rounded overflow-x-auto leading-normal text-zinc-400 select-all max-h-24">
                          {wh.payload}
                        </pre>

                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-zinc-550">Target Destination Endpoint:</span>
                          <span className={`font-semibold flex items-center gap-1 ${isSuccess ? 'text-brand-emerald' : 'text-red-400'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                            {wh.status} {isSuccess ? 'Success' : 'Error'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── STATUS BAR ─── */}
        <div
          className="shrink-0 px-4 py-2 flex items-center justify-between"
          style={{ background: headerBg, borderTop: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: paused ? '#FF9100' : '#00E676',
                boxShadow: `0 0 6px ${paused ? '#FF9100' : '#00E676'}`,
                animation: paused ? 'none' : 'pulse 1.5s infinite',
              }}
            />
            <span className="text-[9.5px] font-mono" style={{ color: textMuted }}>
              {paused ? 'STREAM PAUSED' : 'LIVE STREAM ACTIVE'}
            </span>
          </div>
          <span className="text-[9.5px] font-mono" style={{ color: textMuted }}>
            zelus.engine // dev console v1.0
          </span>
        </div>
      </div>
    </>
  );
};
