/**
 * ANTIGRAVITY AI MONITOR — Electron Main Process
 * Sistema completo: Tray, Notificaciones nativas, Drag-to-move, Modo compacto
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, screen, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');

// ─── Single Instance Lock ────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let tray = null;
let dataServer = null;
let isCompactMode = false;
let isAlwaysOnTop = true;
// isDev: true cuando se ejecuta desde el source (no desde un .exe empaquetado)
let isDev = !app.isPackaged;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
});

// ─── Dimensiones del Widget ─────────────────────────────────────────────────
const EXPANDED = { width: 500, height: 720 };
const COMPACT  = { width: 380, height: 80 };

// ─── Iniciar Servidor de Datos Backend ──────────────────────────────────────
function startDataServer() {
  const serverPath = path.join(__dirname, 'server.cjs');
  try {
    dataServer = fork(serverPath, [], {
      silent: true,
      env: { ...process.env, PORT: '4600' }
    });
    dataServer.on('message', (msg) => console.log('[DataServer]', msg));
    dataServer.on('error', (err) => console.error('[DataServer Error]', err));
    console.log('[Main] Servidor de datos iniciado (Puerto 4600)');
  } catch (err) {
    console.warn('[Main] No se pudo iniciar servidor de datos:', err.message);
  }
}

// ─── Crear Ventana Principal ─────────────────────────────────────────────────
function createWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: EXPANDED.width,
    height: EXPANDED.height,
    x: sw - EXPANDED.width - 24,
    y: sh - EXPANDED.height - 24,
    frame: false,
    transparent: true,
    alwaysOnTop: isAlwaysOnTop,
    resizable: false,
    skipTaskbar: false,
    show: false, // Start hidden to prevent white flashes
    hasShadow: false,
    roundedCorners: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message} (at ${sourceId}:${line})`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Fallback para forzar el show si ready-to-show no se dispara
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('[Main] Fallback: Mostrando ventana principal de forma forzada.');
      mainWindow.show();
      mainWindow.focus();
    }
  }, 1500);

  if (isDev) {
    // Carga el servidor Vite (código fuente actualizado, siempre fresco)
    mainWindow.loadURL('http://127.0.0.1:5173');
    // Abrir DevTools si se quiere depurar
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`[Main] Failed to load window: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.setMenuBarVisibility(false);
}

// ─── Crear Icono de Bandeja ──────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.png');

  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Antigravity AI Monitor');
  updateTrayMenu();

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

function updateTrayMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: '🤖 Antigravity AI Monitor',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: mainWindow?.isVisible() ? '🔵 Ocultar Widget' : '🟢 Mostrar Widget',
      click: () => {
        if (!mainWindow) { createWindow(); return; }
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        updateTrayMenu();
      }
    },
    {
      label: isCompactMode ? '⬛ Modo Expandido' : '▪️ Modo Compacto',
      click: () => {
        toggleCompactMode();
        updateTrayMenu();
      }
    },
    {
      label: isAlwaysOnTop ? '📌 Desactivar Siempre Encima' : '📌 Activar Siempre Encima',
      click: () => {
        isAlwaysOnTop = !isAlwaysOnTop;
        mainWindow?.setAlwaysOnTop(isAlwaysOnTop);
        updateTrayMenu();
      }
    },
    { type: 'separator' },
    {
      label: '🔄 Actualizar Datos',
      click: () => {
        mainWindow?.webContents.send('force-refresh');
      }
    },
    {
      label: '⚙️ Configuración',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('open-settings');
      }
    },
    { type: 'separator' },
    {
      label: '✖ Salir',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(menu);
}

// ─── Toggle Modo Compacto ─────────────────────────────────────────────────────
function toggleCompactMode() {
  if (!mainWindow) return;
  isCompactMode = !isCompactMode;
  const size = isCompactMode ? COMPACT : EXPANDED;
  mainWindow.setResizable(true);
  mainWindow.setSize(size.width, size.height, true);
  mainWindow.setResizable(false);
  mainWindow.webContents.send('mode-changed', isCompactMode ? 'COMPACT' : 'EXPANDED');
}

// ─── Notificaciones Nativas ───────────────────────────────────────────────────
function showNotification(title, body, urgency = 'normal', withIdeAction = false) {
  if (!Notification.isSupported()) return;
  const n = new Notification({
    title,
    body,
    icon: path.join(isDev ? __dirname : process.resourcesPath, 'build', 'icon.png'),
    urgency,
    timeoutType: 'default',
    actions: withIdeAction ? [{ type: 'button', text: 'Abrir IDE' }] : undefined
  });
  
  n.on('action', (event, index) => {
    if (withIdeAction && index === 0) {
      const idePath = path.join(require('os').homedir(), 'AppData', 'Local', 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe');
      require('child_process').exec(`start "" "${idePath}"`);
    }
  });

  n.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
  n.show();
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);

ipcMain.on('close-app', () => {
  app.isQuiting = true;
  app.quit();
});

ipcMain.on('minimize-app', () => mainWindow?.hide());

ipcMain.on('toggle-always-on-top', (_, flag) => {
  isAlwaysOnTop = flag;
  mainWindow?.setAlwaysOnTop(flag);
  updateTrayMenu();
});

ipcMain.on('toggle-compact', () => {
  toggleCompactMode();
  updateTrayMenu();
});

ipcMain.on('sync-mode', (_, mode) => {
  isCompactMode = (mode === 'COMPACT');
  const size = isCompactMode ? COMPACT : EXPANDED;
  if (mainWindow) {
    mainWindow.setResizable(true);
    mainWindow.setSize(size.width, size.height, true);
    mainWindow.setResizable(false);
  }
  updateTrayMenu();
});

ipcMain.on('start-drag', () => {
  // Handled via CSS -webkit-app-region: drag on the renderer side
});

ipcMain.on('show-notification', (_, { title, body, urgency }) => {
  showNotification(title, body, urgency);
});

ipcMain.on('show-ide-notification', (_, { title, body }) => {
  showNotification(title, body, 'normal', true);
});

ipcMain.on('quota-alert', (_, data) => {
  const { model, percent, resetLabel } = data;
  showNotification(
    `⚠️ Cuota Baja — ${model}`,
    `Queda ${percent}% · Reset en ${resetLabel}`,
    'normal'
  );
});

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startDataServer();

  // Pequeño delay para que el servidor de datos arranque
  setTimeout(() => {
    createWindow();
    createTray();
  }, 1000);

  app.on('activate', () => {
    if (!mainWindow) createWindow();
  });
});

app.on('before-quit', () => {
  app.isQuiting = true;
  if (dataServer) dataServer.kill();
});

app.on('window-all-closed', () => {
  // No salir al cerrar ventana — quedarse en bandeja
  if (process.platform === 'darwin') app.quit();
});
