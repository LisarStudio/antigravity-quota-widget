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

// ─── Cache ─────────────────────────────────────────────────────────────────
let cachedQuota = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5_000; // 5 segundos

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
  try {
    const cmd = 'wmic process where "name=\'language_server_windows_x64.exe\'" get commandline';
    const out = execSync(cmd, { encoding: 'utf8' });
    const lines = out.split(/\r?\n/).filter(line => line.includes('--https_server_port'));

    const instances = [];
    for (const line of lines) {
      const portMatch = line.match(/--https_server_port\s+([0-9]+)/);
      const tokenMatch = line.match(/--csrf_token\s+([a-f0-9-]+)/i);
      const extTokenMatch = line.match(/--extension_server_csrf_token\s+([a-f0-9-]+)/i);
      if (portMatch) {
        instances.push({
          port: parseInt(portMatch[1], 10),
          tokens: [tokenMatch ? tokenMatch[1] : null, extTokenMatch ? extTokenMatch[1] : null].filter(Boolean)
        });
      }
    }
    return instances;
  } catch (err) {
    return [];
  }
}

// ─── Obtener Instancias de GitHub Copilot (VS Code) ───────────────────────
function getCopilotInstances() {
  try {
    // GitHub Copilot usa copilot-agent o su propio language server
    const cmd = 'wmic process where "commandline like \'%copilot%\' and commandline like \'%agent%\'" get commandline';
    const out = execSync(cmd, { encoding: 'utf8' });
    const lines = out.split(/\r?\n/).filter(line => line.trim().length > 10);

    if (lines.length > 1) {
      return { detected: true, type: 'copilot' };
    }
  } catch (_) {}

  // Alternativa: buscar el proceso de VS Code
  try {
    const cmd2 = 'wmic process where "name=\'Code.exe\'" get processid';
    const out2 = execSync(cmd2, { encoding: 'utf8' });
    const pids = out2.split(/\r?\n/).filter(l => /^\d+/.test(l.trim()));
    if (pids.length > 0) {
      return { detected: true, type: 'vscode' };
    }
  } catch (_) {}

  return { detected: false, type: null };
}

// ─── Detectar IDE activo automáticamente ──────────────────────────────────
function detectActiveIDE() {
  // 1. Comprobar Antigravity IDE
  try {
    const cmd = 'wmic process where "name=\'Antigravity IDE.exe\'" get processid';
    const out = execSync(cmd, { encoding: 'utf8' });
    const pids = out.split(/\r?\n/).filter(l => /^\d+/.test(l.trim()));
    if (pids.length > 0) return 'antigravity';
  } catch (_) {}

  // 2. Comprobar VS Code
  try {
    const cmd = 'wmic process where "name=\'Code.exe\'" get processid';
    const out = execSync(cmd, { encoding: 'utf8' });
    const pids = out.split(/\r?\n/).filter(l => /^\d+/.test(l.trim()));
    if (pids.length > 0) return 'vscode';
  } catch (_) {}

  // 3. Comprobar Cursor IDE
  try {
    const cmd = 'wmic process where "name=\'Cursor.exe\'" get processid';
    const out = execSync(cmd, { encoding: 'utf8' });
    const pids = out.split(/\r?\n/).filter(l => /^\d+/.test(l.trim()));
    if (pids.length > 0) return 'cursor';
  } catch (_) {}

  return 'unknown';
}

// ─── Consultar RPC al LanguageServer ────────────────────────────────────────
async function fetchFromLanguageServer() {
  const instances = getLanguageServerInstances();
  const activeIDE = detectActiveIDE();
  
  if (instances.length === 0) {
    // Si no hay LanguageServer pero hay VS Code/Copilot detectado
    const copilot = getCopilotInstances();
    if (copilot.detected) {
      return {
        source: 'copilot_detected',
        connected: true,
        availableCredits: 0,
        overagesActive: false,
        userEmail: '',
        planName: copilot.type === 'vscode' ? 'VS Code + GitHub Copilot' : 'GitHub Copilot',
        activeIDE: activeIDE,
        geminiWeeklyPct: 100,
        geminiFivePct: 100,
        claudeWeeklyPct: 100,
        claudeFivePct: 100,
        geminiWeeklyRefresh: 'N/A (Copilot)',
        geminiFiveRefresh: 'N/A (Copilot)',
        claudeWeeklyRefresh: 'N/A (Copilot)',
        claudeFiveRefresh: 'N/A (Copilot)',
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
        let userEmail = '';
        let planName = activeIDE === 'antigravity' ? 'Antigravity Quota' : 'Codeium Quota';

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
            const pct = Math.round((b.remainingFraction ?? 1) * 100);
            const refreshLabel = formatResetTimeLabel(b.resetTime);
            const remainingSecs = getResetRemainingSecs(b.resetTime);

            if (name.includes('gemini')) {
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
    const now = Date.now();
    const forceRefresh = req.query.refresh === '1';

    if (!forceRefresh && cachedQuota && (now - lastFetchTime) < CACHE_TTL_MS) {
      return res.json({ ...cachedQuota, cached: true });
    }

    const realData = await fetchFromLanguageServer();

    const responseData = realData ? {
      ...realData,
      demo: false,
    } : {
      ...getDemoData(),
      note: 'LanguageServer no detectado. Modo fallback.',
      demo: true,
    };

    cachedQuota = responseData;
    lastFetchTime = now;

    res.json(responseData);
  } catch (err) {
    console.error('[DataServer] Error en /api/antigravity/quota:', err);
    res.status(500).json({ error: err.message });
  }
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
