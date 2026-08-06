export type ConnectionStatus =
  | 'CONNECTED'
  | 'STALE'
  | 'DISCONNECTED'
  | 'AUTH_ERROR'
  | 'CONNECTING'
  | 'DEMO_MODE';

export type UsageHealth = 'NORMAL' | 'ELEVATED' | 'CRITICAL';

export interface QuotaWindow {
  remainingPercentage: number;
  resetTimeRemainingSeconds: number;
  resetTimeLabel: string; // e.g. "5 días, 20 horas" or "2 horas, 43 minutos"
  totalLimit?: number;
  used?: number;
}

export interface QuotaGroup {
  familyName: 'gemini' | 'claude_gpt';
  displayName: string;
  weekly: QuotaWindow;
  fiveHour: QuotaWindow;
  historyTrend: number[]; // e.g. last 10 snapshots for sparkline
}

export interface CreditStatus {
  availableCredits: number;
  overagesActive: boolean;
  overagesLabel: string;
  usageHealth: UsageHealth;
}

export interface QuotaSnapshot {
  timestamp: number;
  credits: CreditStatus;
  gemini: QuotaGroup;
  claudeGpt: QuotaGroup;
  connectionStatus: ConnectionStatus;
  lastSyncedAt: string; // Formatted ISO / local string
  activeAlerts: string[];
  estimatedVelocityTokSec: number;
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  thresholdPercentage?: number;
  condition: 'BELOW_25' | 'BELOW_10' | 'EXHAUSTED_0' | 'CREDITS_EXHAUSTED' | 'RESET_AVAILABLE' | 'OVERAGE_ACTIVATED';
  cooldownSeconds: number;
  lastTriggeredAt?: number;
}

export interface WidgetSettings {
  mode: 'COMPACT' | 'EXPANDED';
  alwaysOnTop: boolean;
  opacity: number; // 0.5 to 1.0
  pollIntervalSeconds: number; // 15, 30, 60
  demoMode: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  notificationRules: NotificationRule[];
}
