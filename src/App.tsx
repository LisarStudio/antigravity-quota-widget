import React, { useEffect, useState, useCallback } from 'react';
import { QuotaSnapshot, WidgetSettings } from './types/quota';
import { AntigravityQuotaProvider } from './providers/AntigravityQuotaProvider';
import { StorageService } from './services/storageService';
import { NotificationService } from './services/notificationService';
import { Header } from './components/Header';
import { SummaryCard } from './components/SummaryCard';
import { ModelQuotaCard } from './components/ModelQuotaCard';
import { FooterStatus } from './components/FooterStatus';
import { CompactWidget } from './components/CompactWidget';
import { SettingsModal } from './components/SettingsModal';

export function App() {
  const [settings, setSettings] = useState<WidgetSettings>(() => StorageService.loadSettings());
  const [snapshot, setSnapshot] = useState<QuotaSnapshot | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Cargar y actualizar captura de cuota desde AntigravityQuotaProvider
  const loadSnapshot = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const newSnapshot = await AntigravityQuotaProvider.fetchQuotaSnapshot(settings.demoMode);
      setSnapshot(newSnapshot);

      // Evaluar reglas de notificaciones
      if (newSnapshot) {
        const updatedRules = NotificationService.evaluateSnapshot(
          newSnapshot,
          settings.notificationRules,
          settings.notificationsEnabled,
          settings.soundEnabled
        );
        if (JSON.stringify(updatedRules) !== JSON.stringify(settings.notificationRules)) {
          const updatedSettings = { ...settings, notificationRules: updatedRules };
          setSettings(updatedSettings);
          StorageService.saveSettings(updatedSettings);
        }
      }
    } catch (e) {
      console.error('Error cargando snapshot:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [settings]);

  // Ciclo de Polling Eficiente
  useEffect(() => {
    loadSnapshot();
    const intervalMs = (settings.pollIntervalSeconds || 60) * 1000;
    const timer = setInterval(() => {
      loadSnapshot();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [loadSnapshot, settings.pollIntervalSeconds, settings.demoMode]);

  // Guardar configuración al modificar
  const handleSaveSettings = (newSettings: WidgetSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const toggleMode = () => {
    const newMode = settings.mode === 'EXPANDED' ? 'COMPACT' : 'EXPANDED';
    handleSaveSettings({ ...settings, mode: newMode });
  };

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-cyan-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>INICIALIZANDO ANTIGRAVITY AI MONITOR...</span>
        </div>
      </div>
    );
  }

  // Porcentaje Promedio Global para Semicírculo
  const globalPercentage = Math.round(
    (snapshot.gemini.fiveHour.remainingPercentage + snapshot.claudeGpt.fiveHour.remainingPercentage) / 2
  );

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-3 font-sans text-slate-100"
      style={{ opacity: settings.opacity }}
    >
      {settings.mode === 'COMPACT' ? (
        <CompactWidget
          snapshot={snapshot}
          settings={settings}
          isRefreshing={isRefreshing}
          onRefresh={loadSnapshot}
          onExpand={toggleMode}
        />
      ) : (
        <div className="w-[490px] bg-slate-950/88 border border-cyan-500/35 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.15)] backdrop-blur-2xl flex flex-direction-column relative overflow-hidden select-none">
          {/* Esquinas HUD Sci-Fi */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none z-30" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none z-30" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none z-30" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none z-30" />

          {/* Banner Modo Demo (si aplica) */}
          {settings.demoMode && (
            <div className="bg-purple-600/30 border-b border-purple-500/40 text-purple-200 text-[10px] font-mono text-center py-1 font-bold uppercase tracking-wider">
              ⚠️ MODO DEMOSTRACIÓN ACTIVO — DATOS DE PRUEBA DE DESARROLLO
            </div>
          )}

          {/* Header */}
          <Header
            status={snapshot.connectionStatus}
            lastSyncedAt={snapshot.lastSyncedAt}
            settings={settings}
            isRefreshing={isRefreshing}
            onRefresh={loadSnapshot}
            onToggleMode={toggleMode}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Cuerpo Principal */}
          <main className="p-4 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
            {/* 1. Resumen Superior (Créditos + Overages + Salud Global) */}
            <SummaryCard credits={snapshot.credits} globalPercentage={globalPercentage} />

            {/* 2. Tarjeta Gemini Models */}
            <ModelQuotaCard group={snapshot.gemini} />

            {/* 3. Tarjeta Claude & GPT Models */}
            <ModelQuotaCard group={snapshot.claudeGpt} />
          </main>

          {/* Pie de Widget */}
          <FooterStatus snapshot={snapshot} />

          {/* Modal de Configuración */}
          {isSettingsOpen && (
            <SettingsModal
              settings={settings}
              onSave={handleSaveSettings}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
