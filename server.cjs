/**
 * ANTIGRAVITY AI MONITOR — Backend Data Server
 * Conexión en tiempo real con Antigravity LanguageServer RPC
 * y fallback SQLite/JSON.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const { exec, execSync } = require('child_process');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 4600;

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// ─── Carga de Configuración Externa (config.json) ──────────────────────────
const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadAppConfig() {
  const defaultConfig = {
    pollIntervalSeconds: 2,
    cacheTtlMs: 1000,
    totalTokens: 1000000,
    geminiTokenLimit: 1000000,
    claudeTokenLimit: 500000,
    autoSyncAccounts: true,
    themeColor: 'red',
    demoMode: false,
    notificationsEnabled: true,
    soundEnabled: true,
    accountOverrides: { antigravity: '', codex: '', claude: '' }
  };

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      return { ...defaultConfig, ...JSON.parse(raw) };
    } else {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf8');
      return defaultConfig;
    }
  } catch (e) {
    return defaultConfig;
  }
}

function saveAppConfig(newConfig) {
  try {
    const current = loadAppConfig();
    const updated = { ...current, ...newConfig };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (e) {
    console.error('[DataServer] Error guardando config.json:', e.message);
    return null;
  }
}

// ─── Cache ─────────────────────────────────────────────────────────────────
let cachedQuota = null;
let lastFetchTime = 0;

// ─── Formateador de Tiempo Restante ─────────────────────────────────────────
function formatResetTimeLabel(resetIso) {
  if (!resetIso) return 'Inactivo';
  const diffMs = new Date(resetIso).getTime() - Date.now();
  if (diffMs <= 0) return 'Recargado';

  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);

  if (days > 0) return `${days} día${days > 1 ? 's' : ''}, ${hours} hora${hours > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}, ${mins} min${mins > 1 ? 's' : ''}`;
  return `${mins} min${mins > 1 ? 's' : ''}`;
}

function getResetRemainingSecs(resetIso) {
  if (!resetIso) return 0;
  const diffMs = new Date(resetIso).getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 1000));
}

// ─── Obtener Instancias de LanguageServer (Antigravity/Codeium) ────────────
function getLanguageServerInstances() {
  const instances = [];
  
  // 1. Intentar PowerShell Get-CimInstance
  try {
    const cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name = \'language_server_windows_x64.exe\'\\" | Select-Object -ExpandProperty CommandLine"';
    const out = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
    const lines = out.split(/\r?\n/).filter(line => line.includes('--https_server_port') || line.includes('--extension_server_port'));

    for (const line of lines) {
      const portMatch = line.match(/--https_server_port\s+([0-9]+)/) || line.match(/--extension_server_port\s+([0-9]+)/);
      const tokenMatch = line.match(/--csrf_token\s+([a-f0-9-]+)/i);
      const extTokenMatch = line.match(/--extension_server_csrf_token\s+([a-f0-9-]+)/i);
      
      const ports = [];
      const p1 = line.match(/--https_server_port\s+([0-9]+)/);
      const p2 = line.match(/--extension_server_port\s+([0-9]+)/);
      if (p1) ports.push(parseInt(p1[1], 10));
      if (p2) ports.push(parseInt(p2[1], 10));

      const tokens = [
        tokenMatch ? tokenMatch[1] : null,
        extTokenMatch ? extTokenMatch[1] : null
      ].filter(Boolean);

      for (const port of ports) {
        instances.push({ port, tokens });
      }
    }
  } catch (err) {
    console.warn('[DataServer] Error ejecutando PowerShell Get-CimInstance:', err.message);
  }

  // 2. Fallback con netstat/tasklist si no hay resultados
  if (instances.length === 0) {
    try {
      const netstatOut = execSync('netstat -ano | findstr LISTENING', { encoding: 'utf8', timeout: 3000 });
      // Si language server está corriendo pero ps falló, buscar procesos node/language_server
    } catch (_) {}
  }

  return instances;
}

// ─── Obtener Instancias de GitHub Copilot / VS Code ───────────────────────
function getCopilotInstances() {
  try {
    const cmd = 'powershell -NoProfile -Command "Get-Process Code, Cursor, copilot-agent -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName"';
    const out = execSync(cmd, { encoding: 'utf8', timeout: 3000 });
    const names = out.toLowerCase();

    if (names.includes('copilot')) {
      return { detected: true, type: 'copilot' };
    }
    if (names.includes('code') || names.includes('cursor')) {
      return { detected: true, type: names.includes('cursor') ? 'cursor' : 'vscode' };
    }
  } catch (_) {}

  return { detected: false, type: null };
}

// ─── Detectar IDE activo automáticamente ──────────────────────────────────
function detectActiveIDE() {
  try {
    const cmd = 'powershell -NoProfile -Command "Get-Process \'Antigravity IDE\', Code, Cursor -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName"';
    const out = execSync(cmd, { encoding: 'utf8', timeout: 3000 });
    const names = out.toLowerCase();

    if (names.includes('antigravity')) return 'antigravity';
    if (names.includes('cursor')) return 'cursor';
    if (names.includes('code')) return 'vscode';
  } catch (_) {}

  return 'unknown';
}

// ─── Obtener datos de respaldo desde state.vscdb ──────────────────────────
function getUserStatusFromVscdb() {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb');
    if (!fs.existsSync(dbPath)) return null;

    const db = new DatabaseSync(dbPath);
    const rows = db.prepare("SELECT [key], value FROM ItemTable").all();
    let email = '';
    let plan = '';

    for (const row of rows) {
      if (row.key === 'antigravityUnifiedStateSync.userStatus') {
        const str = Buffer.from(row.value, 'base64').toString('utf8');
        const match = str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (match) email = match[1];
        if (str.includes('Antigravity Starter Quota')) plan = 'Antigravity Starter Quota';
        else if (str.includes('Google AI Pro')) plan = 'Google AI Pro';
        else if (str.includes('Google AI Ultra')) plan = 'Google AI Ultra';
      }
    }
    return { email, plan };
  } catch (_) {
    return null;
  }
}

// ─── Consultar RPC al LanguageServer ────────────────────────────────────────
async function fetchFromLanguageServer() {
  const instances = getLanguageServerInstances();
  const activeIDE = detectActiveIDE();
  const dbStatus = getUserStatusFromVscdb();
  
  if (instances.length === 0) {
    const copilot = getCopilotInstances();
    if (copilot.detected) {
      return {
        source: 'copilot_detected',
        connected: true,
        availableCredits: 0,
        overagesActive: false,
        userEmail: dbStatus?.email || 'peter@gmail.com',
        planName: copilot.type === 'vscode' ? 'VS Code + GitHub Copilot' : 'GitHub Copilot',
        activeIDE: activeIDE,
        geminiWeeklyPct: 100,
        geminiFivePct: 100,
        claudeWeeklyPct: 100,
        claudeFivePct: 100,
        geminiWeeklyRefresh: 'Inactivo (Copilot)',
        geminiFiveRefresh: 'Inactivo (Copilot)',
        claudeWeeklyRefresh: 'Inactivo (Copilot)',
        claudeFiveRefresh: 'Inactivo (Copilot)',
        geminiWeeklySecs: 0,
        geminiFiveSecs: 0,
        claudeWeeklySecs: 0,
        claudeFiveSecs: 0,
      };
    }
    return null;
  }

  for (const inst of instances) {
    for (const token of inst.tokens) {
      try {
        const postData = JSON.stringify({});

        // 1. Quota Summary
        const quotaData = await new Promise((resolve, reject) => {
          const req = https.request({
            hostname: '127.0.0.1',
            port: inst.port,
            path: '/exa.language_server_pb.LanguageServerService/RetrieveUserQuotaSummary',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Connect-Protocol-Version': '1',
              'x-codeium-csrf-token': token,
              'Content-Length': Buffer.byteLength(postData)
            }
          }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
              try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
          });
          req.on('error', reject);
          req.write(postData);
          req.end();
        });

        if (!quotaData || !quotaData.response || !quotaData.response.groups) continue;

        // 2. User Status Profile
        let userEmail = dbStatus?.email || '';
        let planName = dbStatus?.plan || (activeIDE === 'antigravity' ? 'Antigravity Quota' : 'Codeium Quota');

        try {
          const statusData = await new Promise((resolve, reject) => {
            const req = https.request({
              hostname: '127.0.0.1',
              port: inst.port,
              path: '/exa.language_server_pb.LanguageServerService/GetUserStatus',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Connect-Protocol-Version': '1',
                'x-codeium-csrf-token': token,
                'Content-Length': Buffer.byteLength(postData)
              }
            }, res => {
              let body = '';
              res.on('data', c => body += c);
              res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
              });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
          });

          if (statusData && statusData.userStatus) {
            if (statusData.userStatus.email) userEmail = statusData.userStatus.email;
            if (statusData.userStatus.userTier && statusData.userStatus.userTier.name) {
              planName = statusData.userStatus.userTier.name;
            }
          }
        } catch (_) {}

        // Procesar cuotas
        const result = {
          source: 'language_server',
          connected: true,
          availableCredits: 0,
          overagesActive: false,
          userEmail,
          planName,
          activeIDE: activeIDE,
          geminiWeeklyPct: 100,
          geminiFivePct: 100,
          claudeWeeklyPct: 100,
          claudeFivePct: 100,
          geminiWeeklyRefresh: 'Inactivo',
          geminiFiveRefresh: 'Inactivo',
          claudeWeeklyRefresh: 'Inactivo',
          claudeFiveRefresh: 'Inactivo',
          geminiWeeklySecs: 0,
          geminiFiveSecs: 0,
          claudeWeeklySecs: 0,
          claudeFiveSecs: 0,
        };

        const groups = quotaData.response.groups || [];
        for (const g of groups) {
          const name = (g.displayName || '').toLowerCase();
          const buckets = g.buckets || [];

          for (const b of buckets) {
            const bId = (b.bucketId || '').toLowerCase();
            const pct = (b.remainingFraction ?? 1) * 100;
            const refreshLabel = formatResetTimeLabel(b.resetTime);
            const remainingSecs = getResetRemainingSecs(b.resetTime);

            if (name.includes('gemini') || bId.includes('gemini')) {
              if (bId.includes('weekly')) {
                result.geminiWeeklyPct = pct;
                result.geminiWeeklyRefresh = refreshLabel;
                result.geminiWeeklySecs = remainingSecs;
              } else {
                result.geminiFivePct = pct;
                result.geminiFiveRefresh = refreshLabel;
                result.geminiFiveSecs = remainingSecs;
              }
            } else if (name.includes('claude') || name.includes('gpt') || bId.includes('3p')) {
              if (bId.includes('weekly')) {
                result.claudeWeeklyPct = pct;
                result.claudeWeeklyRefresh = refreshLabel;
                result.claudeWeeklySecs = remainingSecs;
              } else {
                result.claudeFivePct = pct;
                result.claudeFiveRefresh = refreshLabel;
                result.claudeFiveSecs = remainingSecs;
              }
            }
          }
        }

        // Si solo hay cubo semanal, proyectar al de 5 horas para mantener la vista coherente
        if (result.geminiFivePct === 100 && result.geminiWeeklyPct < 100) {
          result.geminiFivePct = result.geminiWeeklyPct;
          result.geminiFiveRefresh = result.geminiWeeklyRefresh;
          result.geminiFiveSecs = result.geminiWeeklySecs;
        }
        if (result.claudeFivePct === 100 && result.claudeWeeklyPct < 100) {
          result.claudeFivePct = result.claudeWeeklyPct;
          result.claudeFiveRefresh = result.claudeWeeklyRefresh;
          result.claudeFiveSecs = result.claudeWeeklySecs;
        }

        return result;
      } catch (err) {}
    }
  }

  return null;
}

// ─── Generar datos demo ────────────────────────────────────────────────────
let demoTick = 0;
function getDemoData() {
  demoTick++;
  const t = demoTick % 20;
  return {
    source: 'demo',
    connected: false,
    availableCredits: 0,
    overagesActive: false,
    geminiWeeklyPct: Math.max(5, 65 - t),
    geminiFivePct: Math.max(0, 7 - t),
    claudeWeeklyPct: 67,
    claudeFivePct: 0,
    geminiWeeklyRefresh: '5 días, 10 horas',
    geminiFiveRefresh: '2 horas, 3 minutos',
    claudeWeeklyRefresh: '5 días, 12 horas',
    claudeFiveRefresh: '2 horas, 47 minutos',
    geminiWeeklySecs: 468000,
    geminiFiveSecs: 7380,
    claudeWeeklySecs: 475200,
    claudeFiveSecs: 10020,
    velocity: 0,
    planName: 'Antigravity Starter Quota',
    userEmail: 'rjccordero@yahoo.com',
  };
}

// ─── Endpoint Principal de Cuotas ──────────────────────────────────────────
app.get('/api/antigravity/quota', async (req, res) => {
  try {
    const config = loadAppConfig();
    const now = Date.now();
    const forceRefresh = req.query.refresh === '1';
    const cacheTtl = config.cacheTtlMs || 1000;

    if (!forceRefresh && cachedQuota && (now - lastFetchTime) < cacheTtl) {
      return res.json({ ...cachedQuota, cached: true });
    }

    const realData = await fetchFromLanguageServer();

    let responseData = realData ? {
      ...realData,
      demo: false,
    } : {
      ...getDemoData(),
      note: 'LanguageServer no detectado. Modo fallback.',
      demo: true,
    };

    // Aplicar sobreescritura de cuenta si está configurada en config.json
    if (config.accountOverrides && config.accountOverrides.antigravity && config.accountOverrides.antigravity.trim() !== '') {
      responseData.userEmail = config.accountOverrides.antigravity;
    }

    // Calcular métricas exactas de tokens
    const geminiLimit = config.geminiTokenLimit || config.totalTokens || 1000000;
    const claudeLimit = config.claudeTokenLimit || 500000;
    const geminiPct = responseData.geminiFivePct ?? responseData.geminiWeeklyPct ?? 100;
    const claudePct = responseData.claudeFivePct ?? responseData.claudeWeeklyPct ?? 100;

    responseData.tokenMetrics = {
      geminiLimit,
      geminiRemaining: Math.floor(geminiLimit * (geminiPct / 100)),
      geminiConsumed: Math.ceil(geminiLimit * (1 - geminiPct / 100)),
      claudeLimit,
      claudeRemaining: Math.floor(claudeLimit * (claudePct / 100)),
      claudeConsumed: Math.ceil(claudeLimit * (1 - claudePct / 100)),
    };
    responseData.config = config;

    cachedQuota = responseData;
    lastFetchTime = now;

    res.json(responseData);
  } catch (err) {
    console.error('[DataServer] Error en /api/antigravity/quota:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Endpoints de Configuración Externa (config.json) ─────────────────────
app.get('/api/antigravity/config', (req, res) => {
  res.json(loadAppConfig());
});

app.post('/api/antigravity/config', (req, res) => {
  const updated = saveAppConfig(req.body);
  if (!updated) return res.status(500).json({ success: false, error: 'No se pudo guardar config.json' });
  cachedQuota = null; // Invalidar cache para forzar refresco
  res.json({ success: true, config: updated });
});

// ─── Endpoint para Abrir Antigravity IDE ───────────────────────────────────
app.post('/api/antigravity/open-ide', (req, res) => {
  const idePath = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe');
  exec(`start "" "${idePath}"`, (err) => {
    if (err) {
      console.error('[DataServer] Error abriendo Antigravity IDE:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Antigravity IDE iniciado' });
  });
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() });
});

// ─── Servir archivos estáticos ──────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// ─── Arrancar ─────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[DataServer] Servidor activo en http://127.0.0.1:${PORT}`);
  if (process.send) process.send(`ready:${PORT}`);
});

module.exports = app;
