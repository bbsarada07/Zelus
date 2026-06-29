import React, { useState } from 'react';
import type { Theme } from '../types';
import { X, Smartphone, Copy, Check, QrCode } from 'lucide-react';

interface SyncDeviceModalProps {
  onClose: () => void;
  theme: Theme;
}

const SYNC_URL = 'https://zelus.engine/live-share/citizen-preview';

// Hand-coded 21x21 QR code matrix representing a stylized QR pattern
// 1 = dark module, 0 = light module
const QR_MATRIX = [
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,1,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0],
  [1,0,1,1,0,1,1,0,1,0,1,1,1,0,1,0,1,1,0,1,0],
  [0,1,0,0,1,0,0,0,0,1,0,0,0,1,0,1,0,0,1,0,1],
  [1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0],
  [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,1,1],
  [0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,0,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0],
  [1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,0,0,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,1,0,0,1,0,0],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1,1,0,0,1],
];

export const SyncDeviceModal: React.FC<SyncDeviceModalProps> = ({ onClose, theme }) => {
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SYNC_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-xl cursor-pointer"
        style={{ background: 'rgba(0,0,0,0.75)' }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-2xl"
        style={{
          background: isDark ? '#0a0a0c' : '#FDFBF7',
          border: isDark ? '1px solid rgba(0,229,255,0.15)' : '1px solid rgba(0,168,107,0.25)',
          boxShadow: isDark
            ? '0 0 80px rgba(0,229,255,0.1), 0 40px 100px rgba(0,0,0,0.8)'
            : '0 0 80px rgba(0,168,107,0.08), 0 40px 100px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: isDark ? 'rgba(0,229,255,0.08)' : 'rgba(0,168,107,0.08)',
                border: isDark ? '1px solid rgba(0,229,255,0.2)' : '1px solid rgba(0,168,107,0.2)',
              }}
            >
              <Smartphone className="w-4 h-4" style={{ color: isDark ? '#00E5FF' : '#00A86B' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: isDark ? '#ffffff' : '#1A1A1A' }}>
                Sync Mobile Device
              </h2>
              <p className="text-[10px] font-mono" style={{ color: isDark ? 'rgba(161,161,170,0.7)' : 'rgba(80,80,70,0.7)' }}>
                Citizen App Live Pairing Bridge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg cursor-pointer transition-colors"
            style={{
              background: isDark ? '#18181b' : '#f0ede6',
              border: isDark ? '1px solid #27272a' : '1px solid #d8d4cc',
              color: isDark ? '#71717a' : '#7a7a6a',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div
            className="p-3 rounded-xl"
            style={{
              background: '#ffffff',
              border: isDark ? '2px solid rgba(0,229,255,0.2)' : '2px solid rgba(0,168,107,0.2)',
              boxShadow: isDark ? '0 0 30px rgba(0,229,255,0.08)' : '0 0 30px rgba(0,168,107,0.06)',
            }}
          >
            <svg width="168" height="168" viewBox="0 0 21 21" shapeRendering="crispEdges">
              {QR_MATRIX.map((row, y) =>
                row.map((cell, x) =>
                  cell === 1 ? (
                    <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1A1A1A" />
                  ) : null
                )
              )}
            </svg>
          </div>
        </div>

        {/* URL + copy */}
        <div
          className="rounded-xl p-3 space-y-2"
          style={{
            background: isDark ? '#13131a' : '#f0ede6',
            border: isDark ? '1px solid #1e1e26' : '1px solid #d4d0c8',
          }}
        >
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <QrCode className="w-3 h-3 shrink-0" style={{ color: isDark ? '#00E5FF' : '#00A86B' }} />
              <code
                className="text-[10px] font-mono truncate"
                style={{ color: isDark ? 'rgba(228,228,231,0.8)' : 'rgba(40,40,35,0.8)' }}
              >
                {SYNC_URL}
              </code>
            </div>
            <button
              onClick={handleCopy}
              title="Copy sync URL to clipboard"
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-semibold cursor-pointer transition-all"
              style={{
                background: copied
                  ? 'rgba(0,230,118,0.15)'
                  : isDark ? 'rgba(0,229,255,0.08)' : 'rgba(0,168,107,0.08)',
                border: copied
                  ? '1px solid rgba(0,230,118,0.3)'
                  : isDark ? '1px solid rgba(0,229,255,0.2)' : '1px solid rgba(0,168,107,0.2)',
                color: copied ? '#00E676' : isDark ? '#00E5FF' : '#00A86B',
              }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Tooltip info */}
        <div
          className="rounded-xl p-3 text-[10px] font-mono leading-relaxed"
          style={{
            background: isDark ? 'rgba(0,229,255,0.03)' : 'rgba(0,168,107,0.03)',
            border: isDark ? '1px solid rgba(0,229,255,0.08)' : '1px solid rgba(0,168,107,0.1)',
            color: isDark ? 'rgba(161,161,170,0.8)' : 'rgba(80,80,70,0.8)',
          }}
        >
          <span style={{ color: isDark ? '#00E5FF' : '#00A86B', fontWeight: 700 }}>
            [SYNC PROTOCOL]
          </span>
          {' '}Scan to pair your physical device camera & microphone with the live Zelus simulation stream. Real-time geolocation, EXIF metadata, and audio will bridge directly into this citizen reporting engine.
        </div>
      </div>
    </div>
  );
};
