import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface MockSearchEngineProps {
  onEnter: () => void;
}

export const MockSearchEngine: React.FC<MockSearchEngineProps> = ({ onEnter }) => {
  const [exiting, setExiting] = useState(false);

  const handleResultClick = () => {
    setExiting(true);
    setTimeout(() => onEnter(), 600);
  };

  return (
    <div
      className={`fixed inset-0 z-[300] flex flex-col items-center justify-start transition-all duration-600 ${exiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
      style={{
        backgroundColor: 'var(--bg-primary)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top-right nav links */}
      <div className="w-full flex items-center justify-end gap-4 px-6 py-3">
        <span className="text-[13px] cursor-pointer hover:underline" style={{ color: 'var(--text-muted)' }}>About</span>
        <span className="text-[13px] cursor-pointer hover:underline" style={{ color: 'var(--text-muted)' }}>Images</span>
        <span className="text-[13px] cursor-pointer hover:underline" style={{ color: 'var(--text-muted)' }}>Settings</span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}>Z</div>
      </div>

      {/* Centered logo + search */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[640px] px-6 -mt-20">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-1 select-none">
          <span className="text-[42px] font-black tracking-tight" style={{ color: 'var(--accent-cyan)' }}>Z</span>
          <span className="text-[42px] font-light tracking-tight" style={{ color: 'var(--text-primary)' }}>elus</span>
        </div>

        {/* Search bar */}
        <div
          className="w-full flex items-center gap-3 rounded-full border px-5 py-3 shadow-lg transition-all duration-300 hover:shadow-xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-secondary)',
          }}
        >
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="flex-1 text-[15px]" style={{ color: 'var(--text-primary)' }}>
            zelus government complaint portal
          </span>
          <button
            onClick={handleResultClick}
            className="px-4 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
          >
            Search
          </button>
        </div>

        {/* SEO result card */}
        <div className="w-full mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Breadcrumb URL */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}>Z</div>
            <div>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>zelus.gov</p>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>https://zelus.gov/civic-portal</p>
            </div>
          </div>

          {/* Clickable result */}
          <button
            onClick={handleResultClick}
            className="w-full text-left group cursor-pointer mt-1"
          >
            <h2
              className="text-[20px] font-medium group-hover:underline leading-snug"
              style={{ color: 'var(--accent-cyan)' }}
            >
              Zelus Civic Engine | Official Municipal Telemetry &amp; Report Portal
            </h2>
            <p className="text-[14px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Empowering citizens with real-time autonomous triage, instant proximity geofencing infrastructure reporting, and immutable decentralized ledger accountability metrics.
            </p>
          </button>

          {/* Sub-links */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
            {['File a Report', 'Track Incidents', 'Contractor Portal', 'Admin Dashboard'].map(label => (
              <button
                key={label}
                onClick={handleResultClick}
                className="text-[13px] hover:underline cursor-pointer"
                style={{ color: 'var(--accent-cyan)' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full border-t py-4 px-6 flex items-center justify-between" style={{ borderColor: 'var(--border-secondary)' }}>
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>India</span>
        <div className="flex gap-5">
          {['Privacy', 'Terms', 'Accessibility'].map(t => (
            <span key={t} className="text-[12px] cursor-pointer hover:underline" style={{ color: 'var(--text-muted)' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
