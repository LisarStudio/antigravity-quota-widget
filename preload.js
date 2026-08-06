/**
 * ANTIGRAVITY AI MONITOR — Preload Script (Context Bridge)
 * Expone APIs seguras del proceso principal al renderer React.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── Identidad ──────────────────────────────────────────────────────────
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // ─── Controles de Ventana ────────────────────────────────────────────────
  closeApp: () => ipcRenderer.send('close-app'),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  setAlwaysOnTop: (flag) => ipcRenderer.send('toggle-always-on-top', flag),
  toggleCompact: () => ipcRenderer.send('toggle-compact'),

  // ─── Notificaciones ──────────────────────────────────────────────────────
  showNotification: (title, body, urgency) =>
    ipcRenderer.send('show-notification', { title, body, urgency }),
  showIdeNotification: (title, body) =>
    ipcRenderer.send('show-ide-notification', { title, body }),
  sendQuotaAlert: (model, percent, resetLabel) =>
    ipcRenderer.send('quota-alert', { model, percent, resetLabel }),
  syncMode: (mode) => ipcRenderer.send('sync-mode', mode),

  // ─── Listeners desde Main → Renderer ────────────────────────────────────
  onForceRefresh: (callback) => {
    ipcRenderer.on('force-refresh', callback);
    return () => ipcRenderer.removeListener('force-refresh', callback);
  },
  onModeChanged: (callback) => {
    ipcRenderer.on('mode-changed', (_, mode) => callback(mode));
    return () => ipcRenderer.removeListener('mode-changed', callback);
  },
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
    return () => ipcRenderer.removeListener('open-settings', callback);
  },

  // ─── Utilidades ──────────────────────────────────────────────────────────
  isElectron: true,
});
