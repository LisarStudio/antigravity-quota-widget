import React, { useState } from 'react';
import { X, Bell, Volume2, RefreshCw, Eye, Moon, Info } from 'lucide-react';
import { WidgetSettings } from '../types/quota';

interface SettingsModalProps {
  settings: WidgetSettings;
  onSave: (settings: WidgetSettings) => void;
  onClose: () => void;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
      type="button"
    />
  );
}

function SettingsRow({
  label, desc, children
}: {
  label: string; desc?: string; children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{desc}</div>}
      </div>
      <div className="no-drag">{children}</div>
    </div>
  );
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [local, setLocal] = useState({ ...settings });

  const update = (patch: Partial<WidgetSettings>) => {
    setLocal(prev => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box no-drag" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.06em' }}>
              CONFIGURACIÓN
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Antigravity AI Monitor v1.0.0
            </div>
          </div>
          <button className="icon-btn danger" onClick={onClose}><X size={14} /></button>
        </div>

        {/* Sección: Datos */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--red-bright)', letterSpacing: '0.12em', marginBottom: '8px', marginTop: '4px' }}>
          ── DATOS ──
        </div>

        <SettingsRow label="Modo Demostración" desc="Usa datos ficticios para probar el widget">
          <Toggle on={local.demoMode} onChange={v => update({ demoMode: v })} />
        </SettingsRow>

        <SettingsRow label="Intervalo de Actualización" desc={`Cada ${local.pollIntervalSeconds}s`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min={15} max={300} step={15}
              value={local.pollIntervalSeconds}
              onChange={e => update({ pollIntervalSeconds: Number(e.target.value) })}
              style={{
                width: '80px',
                accentColor: 'var(--red-bright)',
                background: 'var(--bg-hover)',
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', minWidth: '30px' }}>
              {local.pollIntervalSeconds}s
            </span>
          </div>
        </SettingsRow>

        {/* Sección: Apariencia */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--red-bright)', letterSpacing: '0.12em', marginBottom: '8px', marginTop: '14px' }}>
          ── APARIENCIA ──
        </div>

        <SettingsRow label="Siempre Encima" desc="El widget flota sobre otras ventanas">
          <Toggle on={local.alwaysOnTop ?? true} onChange={v => {
            update({ alwaysOnTop: v });
            (window as any).electronAPI?.setAlwaysOnTop(v);
          }} />
        </SettingsRow>

        <SettingsRow label="Opacidad" desc={`${Math.round((local.opacity ?? 1) * 100)}%`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min={0.3} max={1.0} step={0.05}
              value={local.opacity ?? 1}
              onChange={e => update({ opacity: Number(e.target.value) })}
              style={{ width: '80px', accentColor: 'var(--red-bright)' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', minWidth: '36px' }}>
              {Math.round((local.opacity ?? 1) * 100)}%
            </span>
          </div>
        </SettingsRow>

        <SettingsRow label="Límite de Tokens" desc="Para cálculo de uso">
          <input
            type="number"
            value={local.totalTokens || 1500}
            onChange={e => update({ totalTokens: parseInt(e.target.value, 10) || 1500 })}
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              width: '80px',
              outline: 'none'
            }}
          />
        </SettingsRow>

        <SettingsRow label="Color del Tema" desc="Personaliza el color de la interfaz">
          <select
            value={local.themeColor || 'red'}
            onChange={e => update({ themeColor: e.target.value as any })}
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="red">Rojo (JARVIS)</option>
            <option value="blue">Azul (Ciber)</option>
            <option value="green">Verde (Matrix)</option>
            <option value="purple">Morado (Synthwave)</option>
          </select>
        </SettingsRow>

        {/* Sección: Notificaciones */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--red-bright)', letterSpacing: '0.12em', marginBottom: '8px', marginTop: '14px' }}>
          ── NOTIFICACIONES ──
        </div>

        <SettingsRow label="Notificaciones Nativas" desc="Alertas de Windows cuando la cuota es baja">
          <Toggle on={local.notificationsEnabled} onChange={v => update({ notificationsEnabled: v })} />
        </SettingsRow>

        <SettingsRow label="Sonido de Alertas">
          <Toggle on={local.soundEnabled} onChange={v => update({ soundEnabled: v })} />
        </SettingsRow>

        {/* Info */}
        <div style={{
          marginTop: '16px',
          padding: '10px 12px',
          background: 'var(--red-dim)',
          border: '1px solid var(--red-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
        }}>
          <Info size={12} style={{ color: 'var(--red-bright)', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Los datos se leen directamente desde los archivos locales de{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Antigravity IDE</strong>{' '}
            instalado en tu equipo. Activa el Modo Demo si Antigravity no está instalado.
          </p>
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              background: 'var(--red-dim)',
              border: '1px solid var(--red-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--red-bright)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 10px var(--red-glow)',
            }}
          >
            GUARDAR
          </button>
        </div>
      </div>
    </div>
  );
}
