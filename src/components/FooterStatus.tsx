import React from 'react';
import { QuotaSnapshot } from '../types/quota';

interface FooterStatusProps {
  snapshot: QuotaSnapshot;
}

export function FooterStatus({ snapshot }: FooterStatusProps) {
  const { estimatedVelocityTokSec, lastSyncedAt, connectionStatus } = snapshot;

  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(5,5,10,0.6)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Velocidad */}
        {estimatedVelocityTokSec > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div className="data-label">VELOCIDAD</div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--cyan-info)',
              fontWeight: 600,
            }}>
              {estimatedVelocityTokSec.toFixed(1)} tok/s
            </span>
          </div>
        )}
        {/* Alertas activas */}
        {snapshot.activeAlerts && snapshot.activeAlerts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--red-bright)', fontSize: '9px' }}>⚠</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              color: 'var(--red-bright)',
              maxWidth: '160px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {snapshot.activeAlerts[0]}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Última sincronización */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          color: 'var(--text-dim)',
          letterSpacing: '0.06em',
        }}>
          UPD: {lastSyncedAt}
        </div>
        {/* Versión */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          color: 'var(--border-subtle)',
          letterSpacing: '0.06em',
        }}>
          v1.0.0
        </div>
      </div>
    </footer>
  );
}
