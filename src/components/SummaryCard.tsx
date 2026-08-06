import React from 'react';
import { CreditStatus } from '../types/quota';
import { Zap, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react';

interface SummaryCardProps {
  credits: CreditStatus;
  globalPercentage: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ credits, globalPercentage }) => {
  const getHealthBadge = () => {
    switch (credits.usageHealth) {
      case 'NORMAL':
        return {
          label: 'CONSUMO NORMAL',
          color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
          desc: 'Tus cuotas y créditos están en niveles óptimos de operación.',
          icon: ShieldCheck,
        };
      case 'ELEVATED':
        return {
          label: 'CONSUMO ELEVADO',
          color: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
          desc: 'La ventana de 5 horas presenta un consumo intensivo reciente.',
          icon: AlertTriangle,
        };
      case 'CRITICAL':
        return {
          label: 'CONSUMO CRÍTICO',
          color: 'text-rose-400 border-rose-500/30 bg-rose-950/40 animate-pulse',
          desc: 'Atención: Las cuotas de 5h se encuentran cerca del límite.',
          icon: AlertTriangle,
        };
    }
  };

  const health = getHealthBadge();
  const HealthIcon = health.icon;

  // Calculo de stroke para semicírculo SVG (circunferencia r=42 -> 263.8, semicírculo ~131.9)
  const strokeDashoffset = 132 - (132 * (globalPercentage / 100));

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 rounded-2xl p-4 backdrop-blur-md transition-all shadow-lg hover:shadow-cyan-500/5 group relative overflow-hidden">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4">
        {/* Izquierda: Créditos Disponibles */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>CRÉDITOS DE IA DISPONIBLES</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-orbitron text-3xl font-black text-white tracking-tight drop-shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              {credits.availableCredits.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">pts</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1 text-[11px] text-slate-300 font-mono">
              <CreditCard className="w-3 h-3 text-slate-400" />
              <span>AI Credit Overages:</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              credits.overagesActive
                ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                : 'text-slate-400 border-slate-700 bg-slate-800/50'
            }`}>
              {credits.overagesLabel}
            </span>
          </div>
        </div>

        {/* Derecha: Indicador Semicircular de Salud Global */}
        <div className="flex flex-col items-center justify-center relative min-w-[100px]">
          <svg className="w-24 h-16 transform -rotate-90" viewBox="0 0 100 60">
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="rgba(30, 41, 59, 0.8)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke={
                globalPercentage > 50
                  ? '#10B981'
                  : globalPercentage > 25
                  ? '#06B6D4'
                  : globalPercentage > 10
                  ? '#F59E0B'
                  : '#EF4444'
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="132"
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out filter drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
            />
          </svg>

          <div className="absolute top-4 text-center">
            <span className="font-orbitron font-extrabold text-lg text-white drop-shadow-md">
              {Math.round(globalPercentage)}%
            </span>
            <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-wider">
              ESTADO GLOBAL
            </span>
          </div>
        </div>
      </div>

      {/* Banner Corto de Salud */}
      <div className={`mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-mono rounded-lg px-2.5 py-1.5 border ${health.color}`}>
        <HealthIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-bold uppercase tracking-wider">{health.label}:</span>
        <span className="text-slate-300 text-[10px] truncate">{health.desc}</span>
      </div>
    </div>
  );
};
