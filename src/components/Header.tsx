import React from 'react';
import { ConnectionStatus, WidgetSettings } from '../types/quota';
import { RefreshCw, Settings, Minimize2, Maximize2, ShieldAlert, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  status: ConnectionStatus;
  lastSyncedAt: string;
  settings: WidgetSettings;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleMode: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  lastSyncedAt,
  settings,
  isRefreshing,
  onRefresh,
  onToggleMode,
  onOpenSettings,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'CONNECTED':
        return {
          label: 'EN VIVO',
          color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
          dot: 'bg-emerald-400 shadow-[0_0_8px_#10B981]',
          icon: Wifi,
        };
      case 'DEMO_MODE':
        return {
          label: 'MODO DEMO',
          color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
          dot: 'bg-cyan-400 shadow-[0_0_8px_#06B6D4]',
          icon: Wifi,
        };
      case 'STALE':
        return {
          label: 'DESACTUALIZADO',
          color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
          dot: 'bg-amber-400',
          icon: ShieldAlert,
        };
      case 'AUTH_ERROR':
        return {
          label: 'ERROR AUTH',
          color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
          dot: 'bg-rose-400',
          icon: ShieldAlert,
        };
      default:
        return {
          label: 'SIN CONEXIÓN',
          color: 'text-slate-400 border-slate-600/40 bg-slate-800/40',
          dot: 'bg-slate-500',
          icon: WifiOff,
        };
    }
  };

  const badge = getStatusBadge();
  const StatusIcon = badge.icon;

  return (
    <header className="drag-header select-none flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-cyan-500/20 backdrop-blur-md rounded-t-2xl">
      {/* Título & Conexión */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className={`w-2.5 h-2.5 rounded-full ${badge.dot} animate-pulse`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-orbitron font-extrabold text-xs tracking-widest text-slate-100 uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              ANTIGRAVITY <span className="text-cyan-400">AI MONITOR</span>
            </h1>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.color} flex items-center gap-1`}>
              <StatusIcon className="w-2.5 h-2.5" />
              {badge.label}
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-400">
            Última sync: <span className="text-slate-200">{lastSyncedAt || '--:--:--'}</span>
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="no-drag flex items-center gap-1.5">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-1.5 rounded-lg bg-slate-800/60 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-400 border border-slate-700/50 hover:border-cyan-500/40 transition-all cursor-pointer ${
            isRefreshing ? 'animate-spin text-cyan-400' : ''
          }`}
          title="Actualizar datos ahora"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleMode}
          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-400 border border-slate-700/50 hover:border-cyan-500/40 transition-all cursor-pointer"
          title={settings.mode === 'EXPANDED' ? 'Cambiar a Modo Barrita Compacta' : 'Cambiar a Modo Expandido'}
        >
          {settings.mode === 'EXPANDED' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-purple-950/60 text-slate-300 hover:text-purple-400 border border-slate-700/50 hover:border-purple-500/40 transition-all cursor-pointer"
          title="Ajustes y Configuración"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
