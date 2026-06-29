import React, { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';
import type { Theme } from '../types';

interface ZetaLoaderProps {
  onComplete: () => void;
  theme: Theme;
}

const BOOT_STEPS = [
  { label: '[BOOT]', text: 'Initializing Zelus Core Mainframe v1.0.0...', result: 'OK', delay: 300 },
  { label: '[HARDWARE]', text: 'Handshaking Browser Camera & Media API...', result: 'Connected', delay: 650 },
  { label: '[SWARM]', text: 'Allocating operational threads for 5 sub-agents...', result: 'Allocated', delay: 1050 },
  { label: '[NETWORK]', text: 'LocalStorage data persistence layer rehydrated...', result: 'Ready', delay: 1450 },
];

export const ZetaLoader: React.FC<ZetaLoaderProps> = ({ onComplete, theme }) => {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [fading, setFading] = useState<boolean>(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    // Reveal terminal lines sequentially
    BOOT_STEPS.forEach((step, i) => {
      setTimeout(() => setVisibleSteps(i + 1), step.delay);
    });

    // Progress bar from 0 to 100 over 2200ms
    const start = Date.now();
    const duration = 2200;
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(tick);
    }, 30);

    // Fade out and complete at 2500ms
    const fadeTimer = setTimeout(() => setFading(true), 2100);
    const completeTimer = setTimeout(() => onComplete(), 2500);

    return () => {
      clearInterval(tick);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-400"
      style={{
        background: isDark ? '#050505' : '#FDFBF7',
        opacity: fading ? 0 : 1,
        backgroundImage: isDark
          ? 'linear-gradient(rgba(39,39,42,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(39,39,42,0.2) 1px, transparent 1px)'
          : 'linear-gradient(rgba(200,200,190,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,190,0.18) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        transition: 'opacity 0.4s ease-out',
      }}
    >
      {/* Center card */}
      <div
        className="w-full max-w-lg mx-4 rounded-2xl p-8 space-y-6"
        style={{
          background: isDark ? 'rgba(9,9,11,0.85)' : 'rgba(245,242,235,0.92)',
          border: isDark ? '1px solid rgba(39,39,42,0.8)' : '1px solid rgba(180,175,165,0.7)',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '0 0 60px rgba(0,229,255,0.06), 0 24px 80px rgba(0,0,0,0.6)'
            : '0 0 60px rgba(0,168,107,0.04), 0 24px 80px rgba(0,0,0,0.12)',
        }}
      >
        {/* Logo lockup */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: isDark ? 'rgba(0,229,255,0.08)' : 'rgba(0,168,107,0.08)',
              border: isDark ? '1px solid rgba(0,229,255,0.2)' : '1px solid rgba(0,168,107,0.2)',
              boxShadow: isDark ? '0 0 20px rgba(0,229,255,0.15)' : '0 0 20px rgba(0,168,107,0.1)',
            }}
          >
            <Cpu
              className="w-5 h-5"
              style={{
                color: isDark ? '#00E5FF' : '#00A86B',
                animation: 'spin 4s linear infinite',
              }}
            />
          </div>
          <div>
            <div
              className="font-bold tracking-tight text-lg"
              style={{ color: isDark ? '#ffffff' : '#1A1A1A' }}
            >
              ZELUS ENGINE
            </div>
            <div
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: isDark ? 'rgba(161,161,170,0.7)' : 'rgba(60,60,50,0.6)' }}
            >
              Zeta Boot Sequence v1.0.0
            </div>
          </div>
        </div>

        {/* Terminal lines */}
        <div
          className="rounded-lg p-4 font-mono text-[11px] space-y-2 min-h-[100px]"
          style={{
            background: isDark ? '#0a0a0c' : '#f0ede6',
            border: isDark ? '1px solid #1a1a1e' : '1px solid #d8d4cc',
          }}
        >
          {BOOT_STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-2 transition-all duration-300"
              style={{
                opacity: visibleSteps > i ? 1 : 0,
                transform: visibleSteps > i ? 'translateY(0)' : 'translateY(4px)',
              }}
            >
              <span style={{ color: isDark ? '#00E5FF' : '#00A86B', flexShrink: 0 }}>
                {step.label}
              </span>
              <span style={{ color: isDark ? 'rgba(228,228,231,0.7)' : 'rgba(40,40,35,0.7)' }}>
                {step.text}
              </span>
              {visibleSteps > i && (
                <span
                  className="ml-auto font-bold"
                  style={{ color: '#00E676' }}
                >
                  ✓ {step.result}
                </span>
              )}
            </div>
          ))}

          {/* Blinking cursor */}
          {visibleSteps < 4 && (
            <span
              className="inline-block w-2 h-3"
              style={{
                background: isDark ? '#00E5FF' : '#00A86B',
                animation: 'pulse 0.8s step-end infinite',
              }}
            />
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: isDark ? 'rgba(161,161,170,0.6)' : 'rgba(80,80,70,0.6)' }}
            >
              System Initialization Progress
            </span>
            <span
              className="text-[11px] font-mono font-bold tabular-nums"
              style={{ color: isDark ? '#00E5FF' : '#00A86B' }}
            >
              {progress}%
            </span>
          </div>

          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ background: isDark ? '#18181b' : '#dcd9d0' }}
          >
            <div
              className="h-full rounded-full transition-all duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                background: isDark
                  ? 'linear-gradient(90deg, #00E5FF, #00E676)'
                  : 'linear-gradient(90deg, #00A86B, #00E5FF)',
                boxShadow: isDark
                  ? '0 0 12px rgba(0,229,255,0.5)'
                  : '0 0 12px rgba(0,168,107,0.4)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
