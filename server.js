const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4600;

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint real local Antigravity
  if (req.url === '/api/antigravity/quota') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        availableCredits: 1500,
        overagesActive: false,
        geminiWeeklyPct: 82,
        geminiFivePct: 14,
        geminiWeeklyRefresh: '5 días, 20 horas',
        geminiFiveRefresh: '2 horas, 43 minutos',
        claudeWeeklyPct: 100,
        claudeFivePct: 100,
        claudeWeeklyRefresh: '7 días',
        claudeFiveRefresh: '5 horas',
        velocity: 48.5,
        geminiHistory: [95, 90, 88, 85, 82, 75, 55, 38, 24, 14],
        claudeHistory: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
      })
    );
    return;
  }

  // Servir estáticos de /dist o /
  let baseDir = fs.existsSync(path.join(__dirname, 'dist')) ? path.join(__dirname, 'dist') : __dirname;
  let filePath = path.join(baseDir, req.url === '/' ? 'index.html' : req.url);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Archivo no encontrado');
      return;
    }

    let contentType = 'text/html';
    if (filePath.endsWith('.css')) contentType = 'text/css';
    if (filePath.endsWith('.js')) contentType = 'text/javascript';
    if (filePath.endsWith('.json')) contentType = 'application/json';
    if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';

    res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`💎 ANTIGRAVITY AI MONITOR DESKTOP WIDGET ACTIVO`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
