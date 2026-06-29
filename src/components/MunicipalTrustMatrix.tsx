import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Trash2, Trees, PawPrint, Users, TrendingUp } from 'lucide-react';
import type { SectorGrade, MunicipalSector } from '../types';

interface MunicipalTrustMatrixProps {
  sectorGrades: SectorGrade[];
  trustScore: number;
}

const SECTOR_META: Record<MunicipalSector, { icon: React.ReactNode; color: string; bg: string }> = {
  'Animal Care Services': {
    icon: <PawPrint className="w-4 h-4" />,
    color: '#F97316',
    bg: 'rgba(249,115,22,0.08)',
  },
  'Sanitation Swarms': {
    icon: <Trash2 className="w-4 h-4" />,
    color: '#EAB308',
    bg: 'rgba(234,179,8,0.08)',
  },
  'Public Works': {
    icon: <Trees className="w-4 h-4" />,
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
  },
  'Civil Mediation Squads': {
    icon: <Users className="w-4 h-4" />,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
  },
};

function gradeClass(grade: string): string {
  const map: Record<string, string> = {
    'A+': 'grade-aplus', 'A': 'grade-a', 'B+': 'grade-bplus',
    'B': 'grade-b', 'C': 'grade-c', 'D': 'grade-d', 'D-': 'grade-dminus',
  };
  return map[grade] || 'grade-b';
}

function gradeGlow(grade: string): string {
  if (grade === 'A+' || grade === 'A') return 'rgba(0,255,204,0.3)';
  if (grade === 'B+' || grade === 'B') return 'rgba(252,211,77,0.25)';
  return 'rgba(248,113,113,0.25)';
}

// Responsive Individual Sector Card Component
const ResponsiveKarmaCard: React.FC<{ sg: SectorGrade }> = ({ sg }) => {
  const meta = SECTOR_META[sg.sector as MunicipalSector] || SECTOR_META['Public Works'];
  const cls = gradeClass(sg.grade);
  const glow = gradeGlow(sg.grade);

  return (
    <div
      className="rounded-lg p-3 border space-y-2.5 relative overflow-hidden transition-all duration-300 w-full min-w-0"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-secondary)',
        borderLeftColor: meta.color,
        borderLeftWidth: 3,
      }}
    >
      {/* Top: Sector Title + Grade */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
            {meta.icon}
          </div>
          <div className="min-w-0 truncate">
            <p className="text-[0.95rem] font-bold text-[var(--text-primary)] truncate">{sg.sector}</p>
            <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
              {sg.resolvedCount} resolved · {sg.activeCount} active
            </p>
          </div>
        </div>
        <span
          className={`text-[1.25rem] font-black font-mono flex-shrink-0 ${cls}`}
          style={{ textShadow: `0 0 10px ${glow}` }}
        >
          {sg.grade}
        </span>
      </div>

      {/* Middle: 100% width Progress Bar with High-Contrast Track */}
      <div className="space-y-1 w-full">
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-[var(--text-muted)] truncate max-w-[65%]">SLA Resolution Rate</span>
          <span className="font-bold flex-shrink-0" style={{ color: meta.color }}>{sg.slaRate}%</span>
        </div>
        
        {/* High-contrast Track Container: bg-slate-200/80 in light theme, bg-white/10 in dark theme */}
        <div 
          className="h-2 rounded-full overflow-hidden w-full transition-all duration-300"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            border: sg.slaRate === 0 ? '1px dashed #cbd5e1' : 'none'
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${sg.slaRate}%`,
              backgroundColor: meta.color,
              boxShadow: `0 0 6px ${meta.color}80`,
            }}
          />
        </div>
      </div>

      {/* Bottom: Metric/Trend data */}
      <div className="flex items-center justify-between text-[11px] font-mono border-t pt-1.5" style={{ borderColor: 'var(--border-secondary)' }}>
        <span className="text-[var(--text-muted)] truncate">Avg Resolution Time</span>
        <span className="font-bold text-[var(--text-primary)] flex-shrink-0">
          {sg.avgResolutionHours < 1
            ? `${Math.round(sg.avgResolutionHours * 60)}m`
            : `${sg.avgResolutionHours.toFixed(1)}h`}
        </span>
      </div>
    </div>
  );
};

// SVG circular trust gauge
const TrustGauge: React.FC<{ score: number }> = ({ score }) => {
  const RADIUS = 40;
  const CIRC = 2 * Math.PI * RADIUS;
  const offset = CIRC - (score / 100) * CIRC;
  const svgRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.style.setProperty('--target-offset', String(offset));
    }
  }, [offset]);

  const color = score >= 80 ? 'var(--accent-green)' : score >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--border-secondary)" strokeWidth="8" />
          {/* Progress arc */}
          <circle
            ref={svgRef}
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.25rem] font-black font-mono text-[var(--text-primary)]">{score}%</span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">TRUST</span>
        </div>
      </div>
      <div className="text-center w-full">
        <p className="text-[12px] font-mono uppercase tracking-wider text-[var(--text-primary)] font-bold truncate">City-Wide Public Trust</p>
        <p className="text-[11px] font-mono mt-0.5 text-[var(--text-muted)] truncate">
          {score >= 80 ? '✅ confidence: HIGH' : score >= 60 ? '⚠️ confidence: MODERATE' : '🔴 confidence: LOW'}
        </p>
      </div>
    </div>
  );
};

export const MunicipalTrustMatrix: React.FC<MunicipalTrustMatrixProps> = ({ sectorGrades, trustScore }) => {
  return (
    <div
      className="rounded-xl border p-4 space-y-4 transition-all duration-300 w-full overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-cyan)' }} />
          <div className="min-w-0">
            <h3 className="text-[1.25rem] font-bold font-mono tracking-wider text-[var(--text-primary)] uppercase truncate">
              Municipal Sector Trust Matrix
            </h3>
            <p className="text-[11px] font-mono mt-0.5 text-[var(--text-muted)] truncate">
              Performance Gradeboard &amp; SLA Resolution Compliance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono border px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ borderColor: 'var(--border-secondary)', color: 'var(--accent-cyan)', backgroundColor: 'var(--bg-secondary)' }}>
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">LIVE SLA FEED</span>
          <span className="sm:hidden">LIVE</span>
        </div>
      </div>

      {/* Grid to column responsive architecture */}
      <div className="flex flex-col md:grid md:grid-cols-5 gap-4 items-start w-full">
        {/* Sector cards: single-column stack on mobile (<768px), 2 columns on desktop */}
        <div className="md:col-span-4 flex flex-col md:grid md:grid-cols-2 gap-3 w-full">
          {sectorGrades.map(sg => (
            <ResponsiveKarmaCard key={sg.sector} sg={sg} />
          ))}
        </div>

        {/* Trust Gauge card */}
        <div className="md:col-span-1 flex flex-col items-center justify-center rounded-lg border p-4 w-full h-full"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
          <TrustGauge score={trustScore} />
        </div>
      </div>

      {/* Grade legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t text-[11px] font-mono" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
        <span><span className="grade-aplus font-bold">A+</span> &lt;2h</span>
        <span><span className="grade-a font-bold">A</span> &lt;4h</span>
        <span><span className="grade-bplus font-bold">B+</span> &lt;6h</span>
        <span><span className="grade-b font-bold">B</span> &lt;12h</span>
        <span><span className="grade-c font-bold">C</span> &lt;24h</span>
        <span><span className="grade-d font-bold">D</span> &lt;48h</span>
        <span><span className="grade-dminus font-bold">D-</span> &gt;48h</span>
      </div>
    </div>
  );
};
