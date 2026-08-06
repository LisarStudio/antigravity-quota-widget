import React from 'react';
import { RefreshCw, Settings, Minimize2, X, Pin, Maximize2 } from 'lucide-react';
import { ConnectionStatus, WidgetSettings } from '../types/quota';

interface HeaderProps {
  status: ConnectionStatus;
  lastSyncedAt: string;
  settings: WidgetSettings;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleMode: () => void;
  onOpenSettings: () => void;
  planName?: string;
  userEmail?: string;
}

const statusConfig: Record<ConnectionStatus, { label: string; dotClass: string; text: string }> = {
  CONNECTED:    { label: 'CONECTADO',    dotClass: 'connected',    text: 'var(--green-ok)' },
  DEMO_MODE:    { label: 'DEMO',         dotClass: 'demo',         text: 'var(--cyan-info)' },
  DISCONNECTED: { label: 'DESCONECTADO', dotClass: 'disconnected', text: 'var(--red-bright)' },
  STALE:        { label: 'DATOS VIEJOS', dotClass: 'warning',      text: 'var(--amber-warn)' },
  AUTH_ERROR:   { label: 'ERROR AUTH',   dotClass: 'disconnected', text: 'var(--red-bright)' },
  CONNECTING:   { label: 'CONECTANDO',   dotClass: 'warning',      text: 'var(--amber-warn)' },
};

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
const electronAPI = isElectron ? (window as any).electronAPI : null;

export function Header({
  status, lastSyncedAt, settings, isRefreshing,
  onRefresh, onToggleMode, onOpenSettings, planName, userEmail
}: HeaderProps) {
  const cfg = statusConfig[status] ?? statusConfig.DISCONNECTED;

  return (
    <header
      className="drag-handle"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px 10px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'linear-gradient(180deg, rgba(255,45,45,0.06) 0%, transparent 100%)',
        gap: '10px',
        flexShrink: 0,
      }}
    >
      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
        <div style={{
          width: '28px', height: '28px', flexShrink: 0,
          background: 'var(--red-dim)',
          border: '1px solid var(--red-border)',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px var(--red-glow)',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" stroke="var(--red-bright)" strokeWidth="1.2" fill="none"/>
            <path d="M8 5L10.5 6.5V9.5L8 11L5.5 9.5V6.5L8 5Z" fill="var(--red-core)" opacity="0.8"/>
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            letterSpacing: '0.08em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {planName || 'ANTIGRAVITY MONITOR'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <div className={`status-dot ${cfg.dotClass}`} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              color: cfg.text,
              letterSpacing: '0.1em',
            }}>
              {userEmail ? userEmail.split('@')[0].toUpperCase() : cfg.label}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '8px' }}>·</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              color: 'var(--text-dim)',
            }}>
              {lastSyncedAt}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        <button
          className="icon-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Actualizar datos"
        >
          <RefreshCw
            size={13}
            style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}
          />
        </button>

        <button
          className={`icon-btn ${settings.alwaysOnTop ? 'active' : ''}`}
          onClick={() => {
            const newVal = !settings.alwaysOnTop;
            electronAPI?.setAlwaysOnTop(newVal);
          }}
          title="Siempre encima"
        >
          <Pin size={12} />
        </button>

        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title="Configuración"
        >
          <Settings size={13} />
        </button>

        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 3px' }} />

        <button
          className="icon-btn"
          onClick={onToggleMode}
          title="Modo compacto"
        >
          <Minimize2 size={12} />
        </button>

        {isElectron && (
          <button
            className="icon-btn"
            onClick={() => electronAPI?.minimizeApp()}
            title="Minimizar"
          >
            <Maximize2 size={12} style={{ transform: 'rotate(45deg)' }} />
          </button>
        )}

        {isElectron && (
          <button
            className="icon-btn danger"
            onClick={() => electronAPI?.closeApp()}
            title="Cerrar (queda en bandeja)"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </header>
  );
}
