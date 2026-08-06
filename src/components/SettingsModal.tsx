import React from 'react';
import { WidgetSettings } from '../types/quota';
import { X, Sliders, Bell, Volume2, Shield, Eye, Layers } from 'lucide-react';

interface SettingsModalProps {
  settings: WidgetSettings;
  onSave: (newSettings: WidgetSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [current, setCurrent] = React.useState<WidgetSettings>({ ...settings });

  const handleChange = <K extends keyof WidgetSettings>(key: K, value: WidgetSettings[K]) => {
    const updated = { ...current, [key]: value };
    setCurrent(updated);
    onSave(updated);
  };

  const toggleRule = (ruleId: string) => {
    const updatedRules = current.notificationRules.map((rule) =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    handleChange('notificationRules', updatedRules);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sliders className="w-4 h-4" />
            <h3 className="font-orbitron font-extrabold text-sm text-white tracking-wider">
              CONFIGURACIÓN DEL WIDGET
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Visual & Comportamiento */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Visual & Comportamiento
          </h4>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-3 text-xs font-mono">
            {/* Opacidad */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Opacidad del Widget:</span>
                <span className="font-bold text-cyan-400">{Math.round(current.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={current.opacity}
                onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Intervalo de Polling */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Frecuencia de Actualización:</span>
              <select
                value={current.pollIntervalSeconds}
                onChange={(e) => handleChange('pollIntervalSeconds', parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:border-cyan-400 outline-none"
              >
                <option value={15}>15 segundos (Activo)</option>
                <option value={30}>30 segundos</option>
                <option value={60}>60 segundos (Normal)</option>
              </select>
            </div>

            {/* Siempre al frente */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Fijar siempre al frente (Always on top):</span>
              <input
                type="checkbox"
                checked={current.alwaysOnTop}
                onChange={(e) => handleChange('alwaysOnTop', e.target.checked)}
                className="accent-cyan-400 rounded cursor-pointer w-4 h-4"
              />
            </div>
          </div>
        </div>

        {/* 2. Modo Demo (Desarrollo) */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            Fuente de Datos & Desarrollo
          </h4>

          <div className="bg-purple-950/20 border border-purple-500/30 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
            <div>
              <span className="font-bold text-purple-300 block">Modo Demostración (Demo Mode)</span>
              <span className="text-[10px] text-slate-400">Genera datos de prueba aislados para evaluación visual.</span>
            </div>
            <input
              type="checkbox"
              checked={current.demoMode}
              onChange={(e) => handleChange('demoMode', e.target.checked)}
              className="accent-purple-500 rounded cursor-pointer w-4 h-4"
            />
          </div>
        </div>

        {/* 3. Notificaciones & Sonido */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            Notificaciones y Sonido
          </h4>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-slate-400" /> Notificaciones Nativas
              </span>
              <input
                type="checkbox"
                checked={current.notificationsEnabled}
                onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                className="accent-emerald-400 rounded cursor-pointer w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" /> Sonido SFX de Alerta
              </span>
              <input
                type="checkbox"
                checked={current.soundEnabled}
                onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                className="accent-emerald-400 rounded cursor-pointer w-4 h-4"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Reglas de Alerta:</span>
              {current.notificationRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{rule.name}</span>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                    className="accent-emerald-400 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-orbitron text-xs px-5 py-2 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            GUARDAR Y CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};
