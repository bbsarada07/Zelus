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
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
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
          <span className="text-xl font-black font-mono text-[var(--text-primary)]">{score}%</span>
          <span className="text-[7.5px] font-mono uppercase tracking-wider text-[var(--text-muted)]">TRUST</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-primary)] font-bold">City-Wide Trust Coefficient</p>
        <p className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {score >= 80 ? '✅ Public confidence: HIGH' : score >= 60 ? '⚠️ Public confidence: MODERATE' : '🔴 Public confidence: LOW'}
        </p>
      </div>
    </div>
  );
};

export const MunicipalTrustMatrix: React.FC<MunicipalTrustMatrixProps> = ({ sectorGrades, trustScore }) => {
  return (
    <div
      className="rounded-xl border p-5 space-y-5 transition-all duration-300"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <div>
            <h3 className="text-xs font-bold font-mono tracking-wider text-[var(--text-primary)] uppercase">
              Municipal Sector Trust Matrix
            </h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Performance Gradeboard & SLA Resolution Compliance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[8.5px] font-mono border px-2 py-1 rounded-full"
          style={{ borderColor: 'var(--border-secondary)', color: 'var(--accent-cyan)', backgroundColor: 'var(--bg-secondary)' }}>
          <TrendingUp className="w-3 h-3" />
          LIVE SLA FEED
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* 4 Sector Cards */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sectorGrades.map(sg => {
            const meta = SECTOR_META[sg.sector as MunicipalSector] || SECTOR_META['Public Works'];
            const cls = gradeClass(sg.grade);
            const glow = gradeGlow(sg.grade);
            return (
              <div
                key={sg.sector}
                className="rounded-lg p-3 border space-y-2.5 relative overflow-hidden transition-all duration-300"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', borderLeftColor: meta.color, borderLeftWidth: 3 }}
              >
                {/* Grade badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`text-sm font-black font-mono ${cls}`}
                    style={{ textShadow: `0 0 10px ${glow}` }}
                  >
                    {sg.grade}
                  </span>
                </div>

                {/* Icon + name */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-primary)]">{sg.sector}</p>
                    <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {sg.resolvedCount} resolved · {sg.activeCount} active
                    </p>
                  </div>
                </div>

                {/* SLA Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span style={{ color: 'var(--text-muted)' }}>SLA Resolution Rate</span>
                    <span className="font-bold" style={{ color: meta.color }}>{sg.slaRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
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

                {/* Avg resolution */}
                <div className="flex items-center justify-between text-[9px] font-mono border-t pt-1.5" style={{ borderColor: 'var(--border-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Avg Resolution:</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {sg.avgResolutionHours < 1
                      ? `${Math.round(sg.avgResolutionHours * 60)}m`
                      : `${sg.avgResolutionHours.toFixed(1)}h`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Gauge */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center rounded-lg border p-4 h-full"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
          <TrustGauge score={trustScore} />
        </div>
      </div>

      {/* Grade legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t text-[9px] font-mono" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
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
