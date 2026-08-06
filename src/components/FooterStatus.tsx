import React from 'react';
import { QuotaSnapshot } from '../types/quota';
import { Activity, Bell, Hourglass, CheckCircle2 } from 'lucide-react';

interface FooterStatusProps {
  snapshot: QuotaSnapshot;
}

export const FooterStatus: React.FC<FooterStatusProps> = ({ snapshot }) => {
  const alertsCount = snapshot.activeAlerts ? snapshot.activeAlerts.length : 0;

  return (
    <footer className="bg-slate-950/80 border-t border-slate-800/80 px-4 py-2.5 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 select-none">
      {/* Próximo Reinicio */}
      <div className="flex items-center gap-1.5">
        <Hourglass className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Próximo reset:</span>
        <span className="text-slate-200 font-bold">{snapshot.gemini.fiveHour.resetTimeLabel}</span>
      </div>

      {/* Velocidad de Consumo */}
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-emerald-400" />
        <span>Velocidad:</span>
        <span className="text-emerald-300 font-bold">⚡ {snapshot.estimatedVelocityTokSec} tok/s</span>
      </div>

      {/* Alertas Activas */}
      <div className="flex items-center gap-1">
        {alertsCount > 0 ? (
          <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-500/30">
            <Bell className="w-3 h-3 text-rose-400 animate-bounce" />
            {alertsCount} Alerta{alertsCount > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Sin alertas
          </span>
        )}
      </div>
    </footer>
  );
};
