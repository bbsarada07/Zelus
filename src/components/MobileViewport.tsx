import React from 'react';
import { Wifi, Battery, Signal, Sun, Moon, LogOut } from 'lucide-react';
import type { Theme } from '../types';

interface MobileViewportProps {
  children: React.ReactNode;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
  username: string;
}

export const MobileViewport: React.FC<MobileViewportProps> = ({
  children,
  theme,
  onToggleTheme,
  onLogout,
  username
}) => {
  const [time, setTime] = React.useState('09:41');

  React.useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
      {/* Device wrapper */}
      <div 
        className="relative w-full max-w-[390px] h-[800px] rounded-[50px] border-[12px] shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: isDark ? '#142022' : '#C8C4BC',
          boxShadow: isDark 
            ? '0 25px 50px -12px rgba(0, 255, 204, 0.15)' 
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Notch */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-[26px] rounded-b-[20px] z-50 flex items-center justify-center"
          style={{ backgroundColor: isDark ? '#142022' : '#C8C4BC' }}
        >
          {/* Mock Speaker/Lens */}
          <div className="w-12 h-1 bg-black/40 rounded-full mb-1" />
          <div className="w-2.5 h-2.5 rounded-full bg-black/60 absolute right-4 mb-1" />
        </div>

        {/* Status Bar */}
        <div 
          className="w-full h-11 px-6 pt-2 flex items-center justify-between select-none font-sans text-xs font-semibold z-40 relative"
          style={{ color: 'var(--text-primary)' }}
        >
          <span>{time}</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">88%</span>
              <Battery className="w-4 h-4 rotate-0" />
            </div>
          </div>
        </div>

        {/* Dynamic header inside mobile for theme toggle and session logout */}
        <div 
          className="w-full px-5 py-2.5 border-b flex items-center justify-between z-30 relative"
          style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--accent-cyan)' }} />
            <span className="font-mono text-[10px] uppercase font-bold tracking-tight" style={{ color: 'var(--text-secondary)' }}>
              {username}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onToggleTheme} 
              className="p-1.5 rounded-md border hover:bg-zinc-800/10 cursor-pointer"
              style={{ borderColor: 'var(--border-secondary)' }}
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} /> : <Moon className="w-3.5 h-3.5" style={{ color: 'var(--text-primary)' }} />}
            </button>
            <button 
              onClick={onLogout} 
              className="p-1.5 rounded-md border hover:bg-red-500/10 cursor-pointer"
              style={{ borderColor: 'var(--border-secondary)' }}
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" style={{ color: 'var(--accent-red)' }} />
            </button>
          </div>
        </div>

        {/* Viewport Screen Content */}
        <div className="flex-1 overflow-y-auto relative flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};
