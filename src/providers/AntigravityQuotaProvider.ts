import { QuotaSnapshot, ConnectionStatus, UsageHealth } from '../types/quota';

/**
 * Capa de abstracción AntigravityQuotaProvider.
 * Obtiene y normaliza los datos de cuota, créditos y límites de Antigravity AI.
 * Reutiliza las fuentes locales de Antigravity en AppData/.gemini cuando están disponibles
 * y ofrece un fallback seguro con estados explícitos (CONNECTED, STALE, DISCONNECTED, DEMO_MODE).
 */
export class AntigravityQuotaProvider {
  private static demoDataIndex = 0;

  /**
   * Intenta obtener una captura real de los límites y cuotas desde el entorno Antigravity local.
   */
  public static async fetchQuotaSnapshot(demoMode: boolean = false): Promise<QuotaSnapshot> {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (demoMode) {
      return this.getDemoSnapshot(now, formattedTime);
    }

    try {
      // Intentar consulta a API local o lector de estado de Antigravity IDE
      const localApiRes = await fetch('/api/antigravity/quota', {
        headers: { 'Accept': 'application/json' },
      }).catch(() => null);

      if (localApiRes && localApiRes.ok) {
        const rawData = await localApiRes.json();
        return this.parseRawQuotaData(rawData, now, formattedTime, 'CONNECTED');
      }

      // Si se ejecuta en entorno Node / Electron, consultar endpoint interno del Widget
      const widgetServerRes = await fetch('http://localhost:4600/api/antigravity/quota', {
        headers: { 'Accept': 'application/json' },
      }).catch(() => null);

      if (widgetServerRes && widgetServerRes.ok) {
        const rawData = await widgetServerRes.json();
        return this.parseRawQuotaData(rawData, now, formattedTime, 'CONNECTED');
      }

      // Fallback: Estado real sin conexión con Antigravity
      return {
        timestamp: now.getTime(),
        credits: {
          availableCredits: 0,
          overagesActive: false,
          overagesLabel: 'No activo',
          usageHealth: 'CRITICAL',
        },
        gemini: {
          familyName: 'gemini',
          displayName: 'Gemini Models',
          weekly: { remainingPercentage: 0, resetTimeRemainingSeconds: 0, resetTimeLabel: 'Sin datos' },
          fiveHour: { remainingPercentage: 0, resetTimeRemainingSeconds: 0, resetTimeLabel: 'Sin datos' },
          historyTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        claudeGpt: {
          familyName: 'claude_gpt',
          displayName: 'Claude & GPT Models',
          weekly: { remainingPercentage: 0, resetTimeRemainingSeconds: 0, resetTimeLabel: 'Sin datos' },
          fiveHour: { remainingPercentage: 0, resetTimeRemainingSeconds: 0, resetTimeLabel: 'Sin datos' },
          historyTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        connectionStatus: 'DISCONNECTED',
        lastSyncedAt: formattedTime,
        activeAlerts: ['Sin conexión activa con Antigravity. Verifica el estado local o activa el Modo Demo.'],
        estimatedVelocityTokSec: 0,
      };
    } catch (error) {
      return {
        timestamp: now.getTime(),
        credits: {
          availableCredits: 0,
          overagesActive: false,
          overagesLabel: 'Desconocido',
          usageHealth: 'CRITICAL',
        },
        gemini: {
          familyName: 'gemini',
          displayName: 'Gemini Models',
          weekly: { remainingPercentage: 0, resetTimeRemainingSeconds: 0, resetTimeLabel: 'Error de lectura' },
          fiveHour: { remainingPercentage: 0, resetTimeRemainingSeconds: 0, resetTimeLabel: 'Error de lectura' },
          historyTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        claudeGpt: {
          familyName: 'claude_gpt',
          displayName: 'Claude & GPT Models',
          weekly: { remainingPercentage: 0, resetTimeRemainingSeconds: 0, resetTimeLabel: 'Error de lectura' },
          fiveHour: { remainingPercentage: 0, resetTimeRemainingSeconds: 0, resetTimeLabel: 'Error de lectura' },
          historyTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        connectionStatus: 'AUTH_ERROR',
        lastSyncedAt: formattedTime,
        activeAlerts: ['Error de autenticación o acceso a la fuente de datos.'],
        estimatedVelocityTokSec: 0,
      };
    }
  }

  private static parseRawQuotaData(
    data: any,
    now: Date,
    formattedTime: string,
    status: ConnectionStatus
  ): QuotaSnapshot {
    const geminiWeeklyPct = data.geminiWeeklyPct ?? 100;
    const geminiFivePct = data.geminiFivePct ?? 100;
    const claudeWeeklyPct = data.claudeWeeklyPct ?? 100;
    const claudeFivePct = data.claudeFivePct ?? 100;

    const minPct = Math.min(geminiWeeklyPct, geminiFivePct, claudeWeeklyPct, claudeFivePct);
    let health: UsageHealth = 'NORMAL';
    if (minPct < 15) health = 'CRITICAL';
    else if (minPct < 35) health = 'ELEVATED';

    return {
      timestamp: now.getTime(),
      credits: {
        availableCredits: data.availableCredits ?? 0,
        overagesActive: data.overagesActive ?? false,
        overagesLabel: data.overagesActive ? 'Activado (Sin bloqueo)' : 'Inactivo',
        usageHealth: health,
      },
      gemini: {
        familyName: 'gemini',
        displayName: 'Gemini Models',
        weekly: {
          remainingPercentage: geminiWeeklyPct,
          resetTimeRemainingSeconds: data.geminiWeeklySecs ?? 0,
          resetTimeLabel: data.geminiWeeklyRefresh || 'Inactivo',
        },
        fiveHour: {
          remainingPercentage: geminiFivePct,
          resetTimeRemainingSeconds: data.geminiFiveSecs ?? 0,
          resetTimeLabel: data.geminiFiveRefresh || 'Inactivo',
        },
        historyTrend: data.geminiHistory || [100, 100, 100, 100, 100, 100, 100, 100, 100, geminiFivePct],
      },
      claudeGpt: {
        familyName: 'claude_gpt',
        displayName: 'Claude & GPT Models',
        weekly: {
          remainingPercentage: claudeWeeklyPct,
          resetTimeRemainingSeconds: data.claudeWeeklySecs ?? 0,
          resetTimeLabel: data.claudeWeeklyRefresh || 'Inactivo',
        },
        fiveHour: {
          remainingPercentage: claudeFivePct,
          resetTimeRemainingSeconds: data.claudeFiveSecs ?? 0,
          resetTimeLabel: data.claudeFiveRefresh || 'Inactivo',
        },
        historyTrend: data.claudeHistory || [100, 100, 100, 100, 100, 100, 100, 100, 100, claudeFivePct],
      },
      connectionStatus: status,
      lastSyncedAt: formattedTime,
      activeAlerts: minPct < 20 ? [`⚠️ Alerta de cuota crítica: Gemini al ${geminiFivePct}%`] : [],
      estimatedVelocityTokSec: data.velocity || 0,
      planName: data.planName || 'Starter Quota',
      userEmail: data.userEmail || '',
      activeIDE: data.activeIDE || 'unknown',
    };
  }

  /**
   * Genera datos de prueba aislados en Modo Demo para desarrollo y demostración visual.
   */
  private static getDemoSnapshot(now: Date, formattedTime: string): QuotaSnapshot {
    this.demoDataIndex++;
    const cycle = this.demoDataIndex % 4;

    const geminiFivePct = cycle === 0 ? 14 : cycle === 1 ? 22 : cycle === 2 ? 8 : 45;
    const health: UsageHealth = geminiFivePct < 10 ? 'CRITICAL' : geminiFivePct < 25 ? 'ELEVATED' : 'NORMAL';

    return {
      timestamp: now.getTime(),
      credits: {
        availableCredits: 2450 - cycle * 50,
        overagesActive: false,
        overagesLabel: 'No activo',
        usageHealth: health,
      },
      gemini: {
        familyName: 'gemini',
        displayName: 'Gemini Models',
        weekly: {
          remainingPercentage: 82,
          resetTimeRemainingSeconds: 504000 - cycle * 1000,
          resetTimeLabel: '5 días, 20 horas',
        },
        fiveHour: {
          remainingPercentage: geminiFivePct,
          resetTimeRemainingSeconds: 9780 - cycle * 300,
          resetTimeLabel: '2 horas, 43 minutos',
        },
        historyTrend: [92, 85, 78, 65, 54, 42, 30, 22, 18, geminiFivePct],
      },
      claudeGpt: {
        familyName: 'claude_gpt',
        displayName: 'Claude & GPT Models',
        weekly: {
          remainingPercentage: 100,
          resetTimeRemainingSeconds: 604800,
          resetTimeLabel: '6 días, 23 horas',
        },
        fiveHour: {
          remainingPercentage: 100,
          resetTimeRemainingSeconds: 18000,
          resetTimeLabel: '5 horas',
        },
        historyTrend: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
      },
      connectionStatus: 'DEMO_MODE',
      lastSyncedAt: formattedTime,
      activeAlerts: geminiFivePct < 15 ? [`⚠️ Cuota de Gemini 5h baja (${geminiFivePct}%). Reinicio en 2h 43m.`] : [],
      estimatedVelocityTokSec: 64.2,
    };
  }
}
