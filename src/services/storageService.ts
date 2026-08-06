import { WidgetSettings } from '../types/quota';
import { NotificationService } from './notificationService';

const STORAGE_KEY_SETTINGS = 'antigravity_quota_settings_v2';
const STORAGE_KEY_HISTORY = 'antigravity_quota_history_v2';

export class StorageService {
  public static defaultSettings: WidgetSettings = {
    mode: 'EXPANDED',
    alwaysOnTop: true,
    opacity: 0.94,
    pollIntervalSeconds: 2,
    demoMode: false,
    notificationsEnabled: true,
    soundEnabled: true,
    notificationRules: NotificationService.defaultRules,
    themeColor: 'red',
    totalTokens: 1000000,
  };

  public static loadSettings(): WidgetSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return this.defaultSettings;
      const parsed = JSON.parse(raw);
      // Siempre arrancar en EXPANDED para evitar que se quede en compacto
      return { ...this.defaultSettings, ...parsed, mode: 'EXPANDED' };
    } catch (e) {
      return this.defaultSettings;
    }
  }

  public static saveSettings(settings: WidgetSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }

  public static loadHistoryTrend(familyName: string): number[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_HISTORY}_${familyName}`);
      if (!raw) return [100, 100, 100, 100, 100];
      return JSON.parse(raw);
    } catch (e) {
      return [100, 100, 100, 100, 100];
    }
  }

  public static saveHistoryTrend(familyName: string, trend: number[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_HISTORY}_${familyName}`, JSON.stringify(trend.slice(-12)));
    } catch (e) {}
  }
}
