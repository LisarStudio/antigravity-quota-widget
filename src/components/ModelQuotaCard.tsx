import React from 'react';
import { QuotaGroup } from '../types/quota';
import { Clock, TrendingUp, Sparkles, Cpu } from 'lucide-react';

interface ModelQuotaCardProps {
  group: QuotaGroup;
}

export const ModelQuotaCard: React.FC<ModelQuotaCardProps> = ({ group }) => {
  const isGemini = group.familyName === 'gemini';

  const getColorClass = (pct: number) => {
    if (pct > 50) return { text: 'text-emerald-400', stroke: '#10B981', bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_#10B981]' };
    if (pct > 25) return { text: 'text-cyan-400', stroke: '#06B6D4', bar: 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_#06B6D4]' };
    if (pct > 10) return { text: 'text-amber-400', stroke: '#F59E0B', bar: 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_#F59E0B]' };
    return { text: 'text-rose-400', stroke: '#EF4444', bar: 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_#EF4444]' };
  };

  const weeklyColor = getColorClass(group.weekly.remainingPercentage);
  const fiveHourColor = getColorClass(group.fiveHour.remainingPercentage);

  // Generar path para la gráfica sparkline SVG de tendencia histórica
  const generateSparklinePath = (data: number[]) => {
    if (!data || data.length === 0) return '';
    const width = 110;
    const height = 24;
    const step = width / (data.length - 1);

    const points = data.map((val, idx) => {
      const x = idx * step;
      const y = height - (val / 100) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const sparklinePath = generateSparklinePath(group.historyTrend);

  return (
    <div className={`bg-slate-900/60 border rounded-2xl p-4 backdrop-blur-md transition-all shadow-lg hover:shadow-cyan-500/5 group ${
      isGemini ? 'border-cyan-500/25 hover:border-cyan-500/40' : 'border-purple-500/25 hover:border-purple-500/40'
    }`}>
      {/* Header Tarjeta */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isGemini ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}`}>
            {isGemini ? <Sparkles className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="font-orbitron font-extrabold text-sm text-slate-100 tracking-wide">
              {group.displayName}
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              {isGemini ? 'Gemini 1.5 Pro / 2.0 Flash' : 'Claude 3.5 Sonnet & GPT-4o'}
            </span>
          </div>
        </div>

        {/* Sparkline de Tendencia */}
        {group.historyTrend && group.historyTrend.length > 0 && (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
              <TrendingUp className="w-2.5 h-2.5 text-cyan-400" />
              <span>Tendencia</span>
            </div>
            <svg className="w-24 h-6 overflow-visible" viewBox="0 0 110 24">
              <path
                d={sparklinePath}
                fill="none"
                stroke={isGemini ? '#06B6D4' : '#A855F7'}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="filter drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Bloque 1: Weekly Limit */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="font-bold text-slate-200">Weekly Limit Remaining</span>
          </div>
          <span className={`font-orbitron font-extrabold ${weeklyColor.text}`}>
            {group.weekly.remainingPercentage}%
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Reinicio completo:</span>
          <span className="text-slate-300 font-semibold">{group.weekly.resetTimeLabel}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${weeklyColor.bar}`}
            style={{ width: `${group.weekly.remainingPercentage}%` }}
          />
        </div>
      </div>

      {/* Bloque 2: Five Hour Limit */}
      <div className="space-y-2 pt-2 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="font-bold text-slate-200">Five Hour Limit Remaining</span>
          </div>
          <span className={`font-orbitron font-extrabold ${fiveHourColor.text}`}>
            {group.fiveHour.remainingPercentage}%
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Próximo reset:</span>
          <span className="text-slate-300 font-semibold">{group.fiveHour.resetTimeLabel}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${fiveHourColor.bar}`}
            style={{ width: `${group.fiveHour.remainingPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
