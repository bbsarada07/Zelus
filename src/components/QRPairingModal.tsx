import React, { useState, useEffect } from 'react';
import { X, Wifi, CheckCircle2, Cpu, Scan } from 'lucide-react';
import QRCode from 'qrcode';

interface QRPairingModalProps {
  onClose: () => void;
}

const DEVICE_META = [
  { label: 'Device UUID', value: '7F:A2:3B:C9:E1:D4' },
  { label: 'Protocol', value: 'ZELUS-BLE-v3.2' },
  { label: 'Auth Token', value: 'zt_hk9mQpR2xW8vN' },
  { label: 'Signal Strength', value: '-42 dBm (Excellent)' },
  { label: 'Firmware', value: 'ZELUS-FW 2026.06.1' },
  { label: 'Pairing Time', value: new Date().toLocaleTimeString() },
];

type ScanState = 'idle' | 'scanning' | 'success';

export const QRPairingModal: React.FC<QRPairingModalProps> = ({ onClose }) => {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [laserPos, setLaserPos] = useState(0); // 0-100 percentage
  const [qrSvg, setQrSvg] = useState<string>('');
  
  // Dynamic URL pairing state
  const [ipAddress, setIpAddress] = useState<string>(() => {
    return window.location.hostname || 'localhost';
  });
  const [port, setPort] = useState<string>(() => {
    return window.location.port || '5173';
  });

  const pairingUrl = `${window.location.protocol}//${ipAddress}${port ? `:${port}` : ''}/?role=Citizen`;

  // Dynamic QR Code generation
  useEffect(() => {
    QRCode.toString(pairingUrl, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#00FFCC', // Neon teal
        light: '#090F1000', // Transparent background
      }
    })
    .then(svg => {
      setQrSvg(svg);
    })
    .catch(err => {
      console.error('Failed to generate QR Code:', err);
    });
  }, [pairingUrl]);

  // Laser animation loop
  useEffect(() => {
    if (scanState !== 'scanning') return;
    let pos = 0;
    let direction = 1;
    const iv = setInterval(() => {
      pos += direction * 2.5;
      if (pos >= 98) { direction = -1; pos = 98; }
      if (pos <= 2)  { direction = 1;  pos = 2;  }
      setLaserPos(pos);
    }, 30);
    const timeout = setTimeout(() => {
      clearInterval(iv);
      setScanState('success');
    }, 2500);
    return () => { clearInterval(iv); clearTimeout(timeout); };
  }, [scanState]);

  const handleScan = () => {
    setScanState('scanning');
    setLaserPos(2);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-md relative rounded-2xl overflow-hidden shadow-2xl animate-fade-in border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0,255,204,0.1)' }}>
              <Scan className="w-4 h-4" style={{ color: '#00FFCC' }} />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono tracking-wider text-[var(--text-primary)] uppercase">Sync Device Bridge</h3>
              <p className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>ZELUS Hardware Pairing Protocol v3.2</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {scanState !== 'success' ? (
            <>
              {/* URL Input Bridge Settings */}
              <div className="p-3 rounded-lg border space-y-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-cyan)]">Target Broadcast URL</p>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-mono text-[var(--text-muted)] block uppercase">Local IP / Hostname</label>
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={e => setIpAddress(e.target.value)}
                      placeholder="e.g. 192.168.1.5"
                      className="w-full rounded border px-2 py-1 text-[10px] font-mono bg-transparent text-[var(--text-primary)] outline-none"
                      style={{ borderColor: 'var(--border-secondary)' }}
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <label className="text-[8px] font-mono text-[var(--text-muted)] block uppercase">Port</label>
                    <input
                      type="text"
                      value={port}
                      onChange={e => setPort(e.target.value)}
                      placeholder="5173"
                      className="w-full rounded border px-2 py-1 text-[10px] font-mono bg-transparent text-[var(--text-primary)] outline-none"
                      style={{ borderColor: 'var(--border-secondary)' }}
                    />
                  </div>
                </div>
                <div className="text-[8.5px] font-mono text-[var(--text-muted)] break-all border-t pt-1.5" style={{ borderColor: 'var(--border-secondary)' }}>
                  Enclosing target: <span className="text-[var(--accent-cyan)] font-bold">{pairingUrl}</span>
                </div>
              </div>

              {/* QR Canvas Container */}
              <div className="relative flex items-center justify-center rounded-xl overflow-hidden border p-4 bg-[#090F10]"
                style={{ borderColor: 'var(--border-secondary)', height: '240px' }}>

                {/* Corner markers */}
                {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-5 h-5`}>
                    <div className="absolute top-0 left-0 w-5 h-[2px]" style={{ backgroundColor: '#00FFCC' }} />
                    <div className="absolute top-0 left-0 w-[2px] h-5" style={{ backgroundColor: '#00FFCC' }} />
                  </div>
                ))}

                {qrSvg ? (
                  <div 
                    className="w-48 h-48 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <div className="text-[10px] font-mono text-zinc-500">Generating SVG QR Code...</div>
                )}

                {/* Laser line */}
                {scanState === 'scanning' && (
                  <div
                    className="absolute left-4 right-4 h-[2px] z-20 pointer-events-none transition-none"
                    style={{
                      top: `${laserPos}%`,
                      background: 'linear-gradient(90deg, transparent, #FF3B30 20%, #FF3B30 80%, transparent)',
                      boxShadow: '0 0 8px rgba(255,59,48,0.8), 0 0 20px rgba(255,59,48,0.4)',
                    }}
                  />
                )}

                {/* Idle overlay */}
                {scanState === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-1.5 z-20">
                    <p className="text-[9px] font-mono text-center animate-pulse text-[#00FFCC]">
                      AWAITING LASER INITIALIZATION...
                    </p>
                  </div>
                )}

                {/* Scanning overlay */}
                {scanState === 'scanning' && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center z-20">
                    <span className="text-[9px] font-mono animate-ticker text-[#FF3B30]">
                      ▶ SCANNING HANDSHAKE PROTOCOL...
                    </span>
                  </div>
                )}
              </div>

              {/* Status row */}
              <div className="flex items-center justify-between text-[9px] font-mono px-1" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" />
                  {scanState === 'scanning' ? 'SCANNING ACTIVE' : 'READY FOR SCAN'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3" style={{ color: '#00FFCC' }} />
                  <span style={{ color: '#00FFCC' }}>BLE 5.2 ACTIVE</span>
                </span>
              </div>

              {/* Initialize button */}
              <button
                onClick={handleScan}
                disabled={scanState === 'scanning'}
                className="w-full py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: scanState === 'scanning' ? 'rgba(0,255,204,0.1)' : '#00FFCC',
                  color: scanState === 'scanning' ? '#00FFCC' : '#090F10',
                  border: scanState === 'scanning' ? '1px solid rgba(0,255,204,0.3)' : 'none',
                }}
              >
                <Scan className="w-4 h-4" />
                {scanState === 'scanning' ? 'Scanning Handshake...' : 'Initialize Laser Scan'}
              </button>
            </>
          ) : (
            /* ── SUCCESS STATE ── */
            <div className="space-y-4 animate-fade-in">
              {/* Success banner */}
              <div
                className="rounded-xl p-4 border flex flex-col items-center gap-3 text-center"
                style={{ backgroundColor: 'rgba(0,255,204,0.06)', borderColor: 'rgba(0,255,204,0.35)' }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,255,204,0.12)' }}>
                  <CheckCircle2 className="w-8 h-8 animate-bounce" style={{ color: '#00FFCC' }} />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#00FFCC' }}>
                    [ DEVICE PROTOCOL PAIRING LINK ESTABLISHED ]
                  </p>
                  <p className="text-[9px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                    Secure encrypted channel active. Telemetry sync committed.
                  </p>
                </div>
              </div>

              {/* Device metadata table */}
              <div className="rounded-lg border divide-y overflow-hidden" style={{ borderColor: 'var(--border-secondary)' }}>
                {DEVICE_META.map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-3 py-1.5 font-mono text-[9px]" style={{ borderColor: 'var(--border-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl border font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:bg-white/5"
                style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}
              >
                Close Bridge Panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
