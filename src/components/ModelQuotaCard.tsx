import React, { useEffect, useState } from 'react';
import { ModelQuotaGroup } from '../types/quota';

interface ModelQuotaCardProps {
  group: ModelQuotaGroup;
  isSelected?: boolean;
  onClick?: () => void;
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownTimer({ seconds, label }: { seconds: number; label: string }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const timer = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 600,
        color: '#ffffff',
      }}
    >
      {remaining > 0 ? (h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`) : label}
    </span>
  );
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 100;
  const h = 28;
  const pts = data.slice(-10);
  const max = Math.max(...pts, 1);
  const points = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h, display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sg-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      {/* Last point dot */}
      {pts.length > 0 && (() => {
        const last = pts[pts.length - 1];
        const x = w;
        const y = h - (last / max) * (h - 4) - 2;
        return <circle cx={x} cy={y} r={2.5} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />;
      })()}
    </svg>
  );
}

// ─── Radial Progress ──────────────────────────────────────────────────────────
function RadialProgress({ percentage, size = 52 }: { percentage: number; size?: number }) {
  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage / 100);

  const color = percentage > 50 ? 'var(--green-ok)' : percentage > 25 ? 'var(--amber-warn)' : 'var(--red-bright)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={4}
      />
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)',
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.19}
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
        fill="#ffffff"
      >
        {percentage}%
      </text>
    </svg>
  );
}

// ─── Barra de Cuota ───────────────────────────────────────────────────────────
function QuotaRow({
  label,
  pct,
  resetSeconds,
  resetLabel,
}: {
  label: string;
  pct: number;
  resetSeconds: number;
  resetLabel: string;
}) {
  const color = pct > 50 ? '#30D158' : pct > 25 ? '#FF9500' : '#FF2D2D';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="data-label" style={{ color: '#ffffff' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>
            Reset:
          </span>
          <CountdownTimer seconds={resetSeconds} label={resetLabel} />
        </div>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function ModelQuotaCard({ group, isSelected = true, onClick }: ModelQuotaCardProps) {
  const isGemini = group.familyName === 'gemini';
  const minPct = Math.min(group.weekly.remainingPercentage, group.fiveHour.remainingPercentage);
  let cardClass = minPct < 15 ? 'card critical' : minPct < 30 ? 'card warning' : 'card';
  if (!isSelected) {
    cardClass += ' inactive';
  }

  const accentColor = isGemini ? 'var(--red-bright)' : 'var(--cyan-info)';
  const icon = isGemini ? '◈' : '◇';

  return (
    <div 
      className={cardClass} 
      onClick={onClick} 
      style={{ 
        cursor: 'pointer', 
        borderWidth: isSelected ? '1px' : '0px', 
        borderColor: isSelected ? accentColor : 'transparent',
        opacity: isSelected ? 1 : 0.45,
        transition: 'all 0.3s ease'
      }}
    >
      {/* Header de tarjeta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ color: accentColor, fontSize: '14px' }}>{icon}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.05em',
          }}>
            {group.displayName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div>
            <div className="data-label" style={{ textAlign: 'right', color: '#ffffff' }}>5H</div>
            <RadialProgress percentage={group.fiveHour.remainingPercentage} size={40} />
          </div>
          <div>
            <div className="data-label" style={{ textAlign: 'right', color: '#ffffff' }}>7D</div>
            <RadialProgress percentage={group.weekly.remainingPercentage} size={40} />
          </div>
        </div>
      </div>

      {/* Barras de cuota */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        <QuotaRow
          label="Cuota Semanal"
          pct={group.weekly.remainingPercentage}
          resetSeconds={group.weekly.resetTimeRemainingSeconds}
          resetLabel={group.weekly.resetTimeLabel}
        />
        <QuotaRow
          label="Cuota 5 Horas"
          pct={group.fiveHour.remainingPercentage}
          resetSeconds={group.fiveHour.resetTimeRemainingSeconds}
          resetLabel={group.fiveHour.resetTimeLabel}
        />
      </div>

      {/* Sparkline de tendencia */}
      <div>
        <div className="data-label" style={{ marginBottom: '4px', color: '#ffffff' }}>TENDENCIA (ÚLTIMAS 10 LECTURAS)</div>
        <div className="sparkline-container" style={{ height: '28px' }}>
          <Sparkline
            data={group.historyTrend}
            color={minPct > 50 ? '#30D158' : minPct > 25 ? '#FF9500' : '#FF2D2D'}
          />
        </div>
      </div>
    </div>
  );
}
