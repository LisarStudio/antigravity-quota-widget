import React, { useEffect, useState, useCallback, useRef } from 'react';
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

// Detectar entorno Electron
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
const electronAPI = isElectron ? (window as any).electronAPI : null;

export function App() {
  const [settings, setSettings] = useState<WidgetSettings>(() => StorageService.loadSettings());
  const [snapshot, setSnapshot] = useState<QuotaSnapshot | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'claude_gpt'>('gemini');
  const prevAlerts = useRef<string[]>([]);

  // ─── Cargar Datos ────────────────────────────────────────────────────────
  const loadSnapshot = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const newSnapshot = await AntigravityQuotaProvider.fetchQuotaSnapshot(settings.demoMode);
      
      // Calcular los créditos/tokens reales estimados
      if (newSnapshot) {
        const total = settings.totalTokens || 1500;
        const geminiPct = newSnapshot.gemini.fiveHour.remainingPercentage;
        newSnapshot.credits.availableCredits = Math.round(total * (geminiPct / 100));
      }

      setSnapshot(newSnapshot);

      // Evaluar notificaciones
      if (newSnapshot && isElectron && settings.notificationsEnabled) {
        const geminiFive = newSnapshot.gemini.fiveHour.remainingPercentage;
        const claudeFive = newSnapshot.claudeGpt.fiveHour.remainingPercentage;

        // Cuota Gemini crítica
        if (geminiFive < 10 && !prevAlerts.current.includes('gemini-5h-critical')) {
          electronAPI.sendQuotaAlert('Gemini 5h', geminiFive, newSnapshot.gemini.fiveHour.resetTimeLabel);
          prevAlerts.current.push('gemini-5h-critical');
        } else if (geminiFive >= 20) {
          prevAlerts.current = prevAlerts.current.filter(a => a !== 'gemini-5h-critical');
        }

        // Cuota Claude/GPT crítica
        if (claudeFive < 10 && !prevAlerts.current.includes('claude-5h-critical')) {
          electronAPI.sendQuotaAlert('Claude & GPT 5h', claudeFive, newSnapshot.claudeGpt.fiveHour.resetTimeLabel);
          prevAlerts.current.push('claude-5h-critical');
        } else if (claudeFive >= 20) {
          prevAlerts.current = prevAlerts.current.filter(a => a !== 'claude-5h-critical');
        }

        // Gemini 30 mins
        const gSecs = newSnapshot.gemini.fiveHour.resetTimeRemainingSeconds;
        if (gSecs <= 1800 && gSecs > 1700 && !prevAlerts.current.includes('gemini-30m')) {
          electronAPI.showNotification('Antigravity AI Monitor', 'Gemini: 30 minutos para recarga total', 'normal');
          prevAlerts.current.push('gemini-30m');
        } else if (gSecs > 1800 || gSecs === 0) {
          prevAlerts.current = prevAlerts.current.filter(a => a !== 'gemini-30m');
        }

        // Gemini full
        if (geminiFive === 100 && !prevAlerts.current.includes('gemini-full')) {
          electronAPI.showIdeNotification('Antigravity AI Monitor', '¡Gemini recargado completamente! Ya puedes volver a trabajar.');
          prevAlerts.current.push('gemini-full');
        } else if (geminiFive < 100) {
          prevAlerts.current = prevAlerts.current.filter(a => a !== 'gemini-full');
        }

        // Claude 30 mins
        const cSecs = newSnapshot.claudeGpt.fiveHour.resetTimeRemainingSeconds;
        if (cSecs <= 1800 && cSecs > 1700 && !prevAlerts.current.includes('claude-30m')) {
          electronAPI.showNotification('Antigravity AI Monitor', 'Claude/GPT: 30 minutos para recarga total', 'normal');
          prevAlerts.current.push('claude-30m');
        } else if (cSecs > 1800 || cSecs === 0) {
          prevAlerts.current = prevAlerts.current.filter(a => a !== 'claude-30m');
        }

        // Claude full
        if (claudeFive === 100 && !prevAlerts.current.includes('claude-full')) {
          electronAPI.showIdeNotification('Antigravity AI Monitor', '¡Claude/GPT recargado completamente! Ya puedes volver a trabajar.');
          prevAlerts.current.push('claude-full');
        } else if (claudeFive < 100) {
          prevAlerts.current = prevAlerts.current.filter(a => a !== 'claude-full');
        }
      }

      // Guardar reglas de notificación
      if (newSnapshot) {
        const updatedRules = NotificationService.evaluateSnapshot(
          newSnapshot,
          settings.notificationRules,
          settings.notificationsEnabled,
          settings.soundEnabled
        );
        if (JSON.stringify(updatedRules) !== JSON.stringify(settings.notificationRules)) {
          const updated = { ...settings, notificationRules: updatedRules };
          setSettings(updated);
          StorageService.saveSettings(updated);
        }
      }
    } catch (e) {
      console.error('Error cargando snapshot:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, [settings]);

  // ─── Theme & Initial Sync ────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.setAttribute('data-theme', settings.themeColor || 'red');
  }, [settings.themeColor]);

  useEffect(() => {
    if (isElectron && electronAPI) {
      if (electronAPI.syncMode) electronAPI.syncMode(settings.mode);
      if (electronAPI.setAlwaysOnTop) electronAPI.setAlwaysOnTop(settings.alwaysOnTop ?? true);
    }
  }, []); // Solo al montar la aplicación para sincronizar estado de main.js

  // ─── Polling ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadSnapshot();
    const ms = (settings.pollIntervalSeconds || 60) * 1000;
    const timer = setInterval(loadSnapshot, ms);
    return () => clearInterval(timer);
  }, [loadSnapshot, settings.pollIntervalSeconds, settings.demoMode]);

  // ─── IPC desde Electron Main ─────────────────────────────────────────────
  useEffect(() => {
    if (!isElectron) return;

    const unsubRefresh = electronAPI.onForceRefresh(() => loadSnapshot());
    const unsubSettings = electronAPI.onOpenSettings(() => setIsSettingsOpen(true));
    const unsubMode = electronAPI.onModeChanged((mode: string) => {
      handleSaveSettings({ ...settings, mode: mode as 'EXPANDED' | 'COMPACT' });
    });

    return () => {
      unsubRefresh?.();
      unsubSettings?.();
      unsubMode?.();
    };
  }, [isElectron, loadSnapshot, settings]);

  const handleSaveSettings = (newSettings: WidgetSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const toggleMode = () => {
    const newMode = settings.mode === 'EXPANDED' ? 'COMPACT' : 'EXPANDED';
    handleSaveSettings({ ...settings, mode: newMode });
    if (isElectron) electronAPI?.toggleCompact();
  };

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (!snapshot) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-void)',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'var(--font-mono)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '2px solid var(--red-dim)',
          borderTopColor: 'var(--red-core)',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }} />
        <div style={{ color: 'var(--text-dim)', fontSize: '10px', letterSpacing: '0.2em' }}>
          INICIALIZANDO ANTIGRAVITY AI MONITOR
        </div>
      </div>
    );
  }

  // ─── Estado global de salud ───────────────────────────────────────────────
  const globalPct = Math.round(
    (snapshot.gemini.fiveHour.remainingPercentage + snapshot.claudeGpt.fiveHour.remainingPercentage) / 2
  );
  const isCritical = globalPct < 15 || snapshot.credits.usageHealth === 'CRITICAL';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', height: '100%', opacity: settings.opacity ?? 1, background: 'transparent' }}>
      {settings.mode === 'COMPACT' ? (
        <CompactWidget
          snapshot={snapshot}
          settings={settings}
          isRefreshing={isRefreshing}
          onRefresh={loadSnapshot}
          onExpand={toggleMode}
        />
      ) : (
        <div className={`widget-root scanlines${isCritical ? ' critical-state' : ''}`}>
          {/* HUD Corners */}
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />

          {/* Alert Banner */}
          {settings.demoMode && (
            <div className="alert-banner demo">
              <span>◈</span>
              <span>MODO DEMO — DATOS DE DEMOSTRACIÓN ACTIVOS</span>
            </div>
          )}
          {isCritical && !settings.demoMode && (
            <div className="alert-banner warning">
              <span>⚠</span>
              <span>ALERTA: CUOTA CRÍTICA DETECTADA — ACCIÓN REQUERIDA</span>
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
            planName={snapshot.planName}
            userEmail={snapshot.userEmail}
          />

          {/* Cuerpo */}
          <main style={{ padding: '12px 14px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* IA Provider selector header */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '-4px' }}>
              <button 
                onClick={() => setActiveProvider('gemini')}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: activeProvider === 'gemini' ? 'rgba(255,45,45,0.15)' : 'rgba(255,255,255,0.02)',
                  border: activeProvider === 'gemini' ? '1px solid var(--red-bright)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🔴 GEMINI PROVIDER
              </button>
              <button 
                onClick={() => setActiveProvider('claude_gpt')}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: activeProvider === 'claude_gpt' ? 'rgba(0,180,255,0.15)' : 'rgba(255,255,255,0.02)',
                  border: activeProvider === 'claude_gpt' ? '1px solid var(--cyan-info)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🔵 CLAUDE / GPT
              </button>
            </div>

            <SummaryCard credits={snapshot.credits} globalPercentage={globalPct} />
            <ModelQuotaCard 
              group={snapshot.gemini} 
              isSelected={activeProvider === 'gemini'}
              onClick={() => setActiveProvider('gemini')}
            />
            <ModelQuotaCard 
              group={snapshot.claudeGpt} 
              isSelected={activeProvider === 'claude_gpt'}
              onClick={() => setActiveProvider('claude_gpt')}
            />
          </main>

          {/* Footer */}
          <FooterStatus snapshot={snapshot} />

          {/* Settings Modal */}
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
