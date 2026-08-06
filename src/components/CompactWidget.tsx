import React from 'react';
import { QuotaSnapshot, WidgetSettings } from '../types/quota';
import { Zap, Maximize2, RefreshCw } from 'lucide-react';

interface CompactWidgetProps {
  snapshot: QuotaSnapshot;
  settings: WidgetSettings;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExpand: () => void;
}

export const CompactWidget: React.FC<CompactWidgetProps> = ({
  snapshot,
  isRefreshing,
  onRefresh,
  onExpand,
}) => {
  const gemini5h = snapshot.gemini.fiveHour.remainingPercentage;
  const claude5h = snapshot.claudeGpt.fiveHour.remainingPercentage;

  const getColor = (pct: number) => {
    if (pct > 50) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
    if (pct > 25) return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';
    if (pct > 10) return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
    return 'text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse';
  };

  return (
    <div className="drag-header select-none bg-slate-950/85 border border-cyan-500/40 backdrop-blur-xl rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-4 w-[460px]">
      {/* Créditos Disponibles */}
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
        <div>
          <span className="font-orbitron font-extrabold text-sm text-white drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            {snapshot.credits.availableCredits.toLocaleString()}
          </span>
          <span className="text-[9px] font-mono text-slate-400 block">CRÉDITOS IA</span>
        </div>
      </div>

      {/* Cuotas de 5 horas: Gemini vs Claude */}
      <div className="flex items-center gap-3">
        {/* Gemini 5h */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 text-[10px]">Gemini 5h:</span>
          <span className={`px-2 py-0.5 rounded-full border font-bold ${getColor(gemini5h)}`}>
            {gemini5h}%
          </span>
        </div>

        {/* Claude/GPT 5h */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 text-[10px]">Claude 5h:</span>
          <span className={`px-2 py-0.5 rounded-full border font-bold ${getColor(claude5h)}`}>
            {claude5h}%
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="no-drag flex items-center gap-1.5">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-all cursor-pointer ${
            isRefreshing ? 'animate-spin text-cyan-400' : ''
          }`}
          title="Actualizar datos"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onExpand}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-all cursor-pointer"
          title="Expandir Widget"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
