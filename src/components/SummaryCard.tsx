import React, { useEffect, useRef } from 'react';
import { Credits } from '../types/quota';

interface SummaryCardProps {
  credits: Credits;
  globalPercentage: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    const start = prev.current;
    const end = value;
    const diff = end - start;
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * ease);
      if (ref.current) ref.current.textContent = current.toLocaleString('es-CL');
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prev.current = value;
  }, [value]);

  return <span ref={ref}>{value.toLocaleString('es-CL')}</span>;
}

function GaugeArc({ percentage, size = 100 }: { percentage: number; size?: number }) {
  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -210;
  const sweepAngle = 240;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (start: number, sweep: number) => {
    const end = start + sweep;
    const x1 = cx + radius * Math.cos(toRad(start));
    const y1 = cy + radius * Math.sin(toRad(start));
    const x2 = cx + radius * Math.cos(toRad(end));
    const y2 = cy + radius * Math.sin(toRad(end));
    const large = sweep > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const fillSweep = (sweepAngle * percentage) / 100;

  const color = percentage > 50
    ? 'var(--green-ok)'
    : percentage > 25
    ? 'var(--amber-warn)'
    : 'var(--red-bright)';

  const trackColor = 'rgba(255,255,255,0.06)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* Track */}
      <path
        d={arcPath(startAngle, sweepAngle)}
        fill="none"
        stroke={trackColor}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={arcPath(startAngle, fillSweep)}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 5px ${color})`,
          transition: 'all 1s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      {/* Center text */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.18}
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
        fill={color}
      >
        {percentage}%
      </text>
      <text
        x={cx}
        y={cy + size * 0.14}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.08}
        fontFamily="JetBrains Mono, monospace"
        fill="rgba(240,240,255,0.35)"
        letterSpacing="1"
      >
        GLOBAL
      </text>
    </svg>
  );
}

export function SummaryCard({ credits, globalPercentage }: SummaryCardProps) {
  const healthClass = credits.usageHealth === 'CRITICAL'
    ? 'critical'
    : credits.usageHealth === 'ELEVATED'
    ? 'warning'
    : '';

  const badgeClass = credits.overagesActive ? 'badge warn' : 'badge ok';
  const badgeText = credits.overagesActive ? 'ACTIVO' : 'INACTIVO';
  const badgeDot = credits.overagesActive ? '●' : '●';

  return (
    <div className={`card ${healthClass}`} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {/* Gauge */}
      <div style={{ flexShrink: 0 }}>
        <GaugeArc percentage={globalPercentage} size={100} />
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Créditos */}
        <div>
          <div className="data-label" style={{ marginBottom: '3px' }}>Créditos AI Disponibles</div>
          <div className="data-value large" style={{ color: globalPercentage > 50 ? 'var(--green-ok)' : globalPercentage > 25 ? 'var(--amber-warn)' : 'var(--red-bright)' }}>
            <AnimatedNumber value={credits.availableCredits} />
          </div>
        </div>

        <div className="divider" style={{ margin: '0' }} />

        {/* AI Credit Overages */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="data-label" style={{ marginBottom: '2px' }}>AI Credit Overages</div>
            <div className="data-value" style={{ fontSize: '11px' }}>
              {credits.overagesLabel}
            </div>
          </div>
          <span className={badgeClass}>
            <span style={{ fontSize: '6px' }}>{badgeDot}</span>
            {badgeText}
          </span>
        </div>

        {/* Salud */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="data-label">Estado del Sistema:</div>
          <span className={`badge ${credits.usageHealth === 'CRITICAL' ? 'critical' : credits.usageHealth === 'ELEVATED' ? 'warn' : 'ok'}`}>
            {credits.usageHealth}
          </span>
        </div>
      </div>
    </div>
  );
}
