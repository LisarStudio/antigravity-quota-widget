import { QuotaSnapshot, NotificationRule } from '../types/quota';

export class NotificationService {
  private static audioCtx: AudioContext | null = null;

  public static defaultRules: NotificationRule[] = [
    { id: 'rule_25', name: 'Cuota bajo 25%', enabled: true, thresholdPercentage: 25, condition: 'BELOW_25', cooldownSeconds: 300 },
    { id: 'rule_10', name: 'Cuota bajo 10% (Crítica)', enabled: true, thresholdPercentage: 10, condition: 'BELOW_10', cooldownSeconds: 300 },
    { id: 'rule_0', name: 'Cuota Agotada (0%)', enabled: true, thresholdPercentage: 0, condition: 'EXHAUSTED_0', cooldownSeconds: 600 },
    { id: 'rule_overage', name: 'AI Overages Activado', enabled: true, condition: 'OVERAGE_ACTIVATED', cooldownSeconds: 900 },
  ];

  public static evaluateSnapshot(
    snapshot: QuotaSnapshot,
    rules: NotificationRule[],
    notificationsEnabled: boolean,
    soundEnabled: boolean
  ): NotificationRule[] {
    if (!notificationsEnabled) return rules;

    const now = Date.now();
    const updatedRules = [...rules];

    const gemini5h = snapshot.gemini.fiveHour.remainingPercentage;
    const claude5h = snapshot.claudeGpt.fiveHour.remainingPercentage;
    const minFiveHourPct = Math.min(gemini5h, claude5h);

    for (let i = 0; i < updatedRules.length; i++) {
      const rule = updatedRules[i];
      if (!rule.enabled) continue;

      const timeSinceLast = (now - (rule.lastTriggeredAt || 0)) / 1000;
      if (timeSinceLast < rule.cooldownSeconds) continue;

      let triggered = false;
      let title = 'Antigravity AI Alert';
      let body = '';

      if (rule.condition === 'BELOW_25' && minFiveHourPct <= 25 && minFiveHourPct > 10) {
        triggered = true;
        title = '⚡ Cuota por debajo del 25%';
        body = `Tu ventana de 5 horas de Gemini/Claude ha descendido al ${minFiveHourPct}%.`;
      } else if (rule.condition === 'BELOW_10' && minFiveHourPct <= 10 && minFiveHourPct > 0) {
        triggered = true;
        title = '🚨 Cuota Crítica (< 10%)';
        body = `¡Atención! Te queda solo un ${minFiveHourPct}% de cuota en Antigravity.`;
      } else if (rule.condition === 'EXHAUSTED_0' && minFiveHourPct === 0) {
        triggered = true;
        title = '🛑 Cuota Totalmente Agotada';
        body = `Has consumido el 100% de la cuota de 5 horas. Reinicio estimado en breve.`;
      } else if (rule.condition === 'OVERAGE_ACTIVATED' && snapshot.credits.overagesActive) {
        triggered = true;
        title = '💳 AI Credit Overages Activado';
        body = `Se están consumiendo créditos por exceso en tu cuenta.`;
      }

      if (triggered) {
        updatedRules[i] = { ...rule, lastTriggeredAt: now };
        this.sendNativeNotification(title, body);
        if (soundEnabled) this.playSoundAlert(rule.condition);
      }
    }

    return updatedRules;
  }

  public static sendNativeNotification(title: string, body: string) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        });
      }
    }
  }

  public static playSoundAlert(type: string) {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'BELOW_10' || type === 'EXHAUSTED_0') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {}
  }
}
