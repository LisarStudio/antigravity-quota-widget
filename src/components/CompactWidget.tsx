import React from 'react';
import { RefreshCw, Maximize2 } from 'lucide-react';
import { QuotaSnapshot, WidgetSettings } from '../types/quota';

interface CompactWidgetProps {
  snapshot: QuotaSnapshot;
  settings: WidgetSettings;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExpand: () => void;
}

function MiniGauge({ pct }: { pct: number }) {
  const r = 13;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color = pct > 50 ? '#30D158' : pct > 25 ? '#FF9500' : '#FF2D2D';

  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
      <circle
        cx="18" cy="18" r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 18 18)"
        style={{ filter: `drop-shadow(0 0 3px ${color})`, transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="18" y="18" textAnchor="middle" dominantBaseline="middle"
        fontSize="8" fontFamily="JetBrains Mono, Consolas, monospace" fontWeight="700" fill={color}
      >
        {pct}%
      </text>
    </svg>
  );
}

export function CompactWidget({
  snapshot, settings, isRefreshing, onRefresh, onExpand
}: CompactWidgetProps) {
  const { gemini, claudeGpt, credits } = snapshot;

  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
  const electronAPI = isElectron ? (window as any).electronAPI : null;

  return (
    <div className="compact-widget drag-handle">
      {/* Logo */}
      <div style={{
        width: '24px', height: '24px', flexShrink: 0,
        background: 'var(--red-dim)',
        border: '1px solid var(--red-border)',
        borderRadius: '6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 8px var(--red-glow)',
      }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" stroke="var(--red-bright)" strokeWidth="1.5" fill="none"/>
          <path d="M8 6L10 7.5V10.5L8 12L6 10.5V7.5L8 6Z" fill="var(--red-core)" opacity="0.9"/>
        </svg>
      </div>

      {/* Créditos */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#ffffff', opacity: 0.6, letterSpacing: '0.1em' }}>CRÉDITOS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>
          {credits.availableCredits.toLocaleString('es-CL')}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', background: 'var(--border-subtle)' }} />

      {/* Gemini */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
        <MiniGauge pct={gemini.fiveHour.remainingPercentage} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#ffffff', fontWeight: 'bold', letterSpacing: '0.05em' }}>GMN</span>
      </div>

      {/* Claude */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
        <MiniGauge pct={claudeGpt.fiveHour.remainingPercentage} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#ffffff', fontWeight: 'bold', letterSpacing: '0.05em' }}>CLD</span>
      </div>

      {/* Status dot */}
      <div className={`status-dot ${snapshot.connectionStatus === 'CONNECTED' ? 'connected' : snapshot.connectionStatus === 'DEMO_MODE' ? 'demo' : 'disconnected'}`} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Buttons */}
      <div className="no-drag" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        <button className="icon-btn" onClick={onRefresh} disabled={isRefreshing} title="Actualizar">
          <RefreshCw size={10} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
        <button className="icon-btn" onClick={onExpand} title="Expandir">
          <Maximize2 size={10} />
        </button>
        {isElectron && (
          <button className="icon-btn danger" onClick={() => electronAPI?.closeApp()} title="Cerrar">
            <span style={{ fontSize: '12px', lineHeight: 1, color: '#ffffff' }}>×</span>
          </button>
        )}
      </div>
    </div>
  );
}
