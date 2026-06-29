import React from 'react';
import type { UserSession, Theme } from '../types';
import { Cpu, LogOut, ShieldAlert, Award, Activity, Sun, Moon, Smartphone, Terminal } from 'lucide-react';

interface NavbarProps {
  session: UserSession;
  onLogout: () => void;
  weatherRiskMultiplier: number;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSync: () => void;
  onOpenDevConsole: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onLogout,
  weatherRiskMultiplier,
  theme,
  onToggleTheme,
  onOpenSync,
  onOpenDevConsole,
}) => {
  const isDark = theme === 'dark';

  const styles = {
    header: {
      background: isDark ? '#050505' : '#FDFBF7',
      borderBottom: isDark ? '1px solid rgba(39,39,42,0.8)' : '1px solid rgba(200,195,185,0.7)',
    },
    text: isDark ? '#f4f4f5' : '#1A1A1A',
    textMuted: isDark ? 'rgba(113,113,122,0.9)' : 'rgba(80,80,70,0.9)',
    accent: isDark ? '#00E5FF' : '#00A86B',
    cardBg: isDark ? '#0a0a0c' : '#F5F2EB',
    cardBorder: isDark ? 'rgba(39,39,42,0.8)' : 'rgba(200,195,185,0.7)',
  };

  return (
    <header
      className="w-full px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 select-none"
      style={styles.header}
    >
      {/* Brand logo & status */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{
              background: isDark ? '#0a0a0c' : '#F5F2EB',
              border: `1px solid ${styles.cardBorder}`,
              boxShadow: `0 0 8px ${isDark ? 'rgba(0,229,255,0.08)' : 'rgba(0,168,107,0.08)'}`,
            }}
          >
            <Cpu className="w-4 h-4" style={{ color: styles.accent }} />
          </div>
          <span className="font-bold tracking-tight text-sm" style={{ color: styles.text }}>
            ZELUS
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 border-l pl-3.5" style={{ borderColor: styles.cardBorder }}>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5"
            style={{
              background: isDark ? 'rgba(9,9,11,0.6)' : 'rgba(245,242,235,0.8)',
              border: `1px solid ${styles.cardBorder}`,
              color: styles.textMuted,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping"
              style={{ background: '#00E676' }}
            />
            System Status: Nominal
          </span>
          <span className="text-[10px] font-mono" style={{ color: styles.textMuted }}>
            Node: US-EAST-MUNI // DB Sync: 100%
          </span>
        </div>
      </div>

      {/* Center: Threat Index */}
      <div
        className="hidden lg:flex items-center gap-2.5 rounded-full px-3 py-1 text-xs"
        style={{
          background: isDark ? 'rgba(9,9,11,0.6)' : 'rgba(245,242,235,0.8)',
          border: `1px solid ${styles.cardBorder}`,
        }}
      >
        <Activity className="w-3.5 h-3.5" style={{ color: styles.accent }} />
        <span className="font-mono text-[10px]" style={{ color: styles.textMuted }}>
          Threat Index:{' '}
          <span className="font-semibold" style={{ color: '#FF9100' }}>
            x{weatherRiskMultiplier.toFixed(2)}
          </span>
        </span>
        <span style={{ color: styles.cardBorder }}>|</span>
        <span className="font-mono text-[10px]" style={{ color: styles.textMuted }}>
          {weatherRiskMultiplier > 1.15 ? '⚠️ Elevated Decay' : '✅ Standard Load'}
        </span>
      </div>

      {/* Right: Actions + user */}
      <div className="flex items-center gap-2">

        {/* Dev Console toggle */}
        <button
          onClick={onOpenDevConsole}
          title="Open Developer Log Core"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-mono font-semibold cursor-pointer transition-all"
          style={{
            background: isDark ? '#0a0a0c' : '#F5F2EB',
            border: `1px solid ${styles.cardBorder}`,
            color: isDark ? '#00E5FF' : '#00A86B',
          }}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">DEV</span>
        </button>

        {/* Sync Device */}
        <button
          onClick={onOpenSync}
          title="Sync mobile device"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-mono font-semibold cursor-pointer transition-all"
          style={{
            background: isDark ? '#0a0a0c' : '#F5F2EB',
            border: `1px solid ${styles.cardBorder}`,
            color: styles.textMuted,
          }}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sync Device</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Editorial Light' : 'Switch to Cyber Dark'}
          className="p-2 rounded-md cursor-pointer transition-all"
          style={{
            background: isDark ? '#0a0a0c' : '#F5F2EB',
            border: `1px solid ${styles.cardBorder}`,
            color: isDark ? '#FF9100' : '#00A86B',
          }}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User card */}
        <div
          className="flex items-center gap-3 rounded-md py-1 px-2.5"
          style={{
            background: styles.cardBg,
            border: `1px solid ${styles.cardBorder}`,
          }}
        >
          <div className="flex flex-col text-right">
            <span className="text-xs font-mono font-medium" style={{ color: styles.text }}>
              {session.username}
            </span>
            <span
              className="text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 justify-end"
              style={{ color: styles.textMuted }}
            >
              {session.role === 'Admin' ? (
                <>
                  <ShieldAlert className="w-2.5 h-2.5" style={{ color: styles.accent }} />
                  Authority Admin
                </>
              ) : (
                <>
                  <Award className="w-2.5 h-2.5" style={{ color: '#00E676' }} />
                  Citizen Hero
                </>
              )}
            </span>
          </div>

          <div className="w-[1px] h-6" style={{ background: styles.cardBorder }} />

          {session.role === 'Citizen' ? (
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono font-semibold" style={{ color: '#00E676' }}>
                {session.karmaXP} XP
              </span>
              <span className="text-[8px] font-mono tracking-widest uppercase" style={{ color: styles.textMuted }}>
                Karma
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono font-semibold" style={{ color: styles.accent }}>
                HQ-01
              </span>
              <span className="text-[8px] font-mono tracking-widest uppercase" style={{ color: styles.textMuted }}>
                Control
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="p-2 rounded-md cursor-pointer transition-all"
          style={{
            background: styles.cardBg,
            border: `1px solid ${styles.cardBorder}`,
            color: styles.textMuted,
          }}
          title="Disconnect Session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
