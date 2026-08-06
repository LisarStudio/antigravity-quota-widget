const { execSync } = require('child_process');
const http = require('http');

function getAllServers() {
  const servers = [];
  try {
    const output = execSync('wmic process get caption,commandline', { encoding: 'utf8' });
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('language_server_windows_x64.exe')) {
        const portMatch = line.match(/--extension_server_port\s+(\d+)/);
        const lspPortMatch = line.match(/--lsp_port\s+(\d+)/);
        const csrfMatch = line.match(/--csrf_token\s+([a-f0-9-]+)/);
        const extCsrfMatch = line.match(/--extension_server_csrf_token\s+([a-f0-9-]+)/);
        
        const port = portMatch ? parseInt(portMatch[1]) : (lspPortMatch ? parseInt(lspPortMatch[1]) : null);
        if (port) {
          servers.push({
            port,
            csrf: csrfMatch ? csrfMatch[1] : null,
            extCsrf: extCsrfMatch ? extCsrfMatch[1] : null,
            line: line.substring(0, 300)
          });
        }
      }
    }
  } catch (e) {
    console.error('Error getting servers:', e.message);
  }
  return servers;
}

const servers = getAllServers();
console.log(`Found ${servers.length} language servers.`);

for (const s of servers) {
  console.log(`\nTesting Server on port ${s.port}...`);
  
  // Test endpoints: /, /state, /quota, /api/status, /status
  const endpoints = ['/status', '/quota', '/credits', '/api/status', '/'];
  
  for (const path of endpoints) {
    // Try with x-codeium-csrf-token = csrf
    if (s.csrf) {
      testRequest(s.port, path, { 'x-codeium-csrf-token': s.csrf }, 'csrf');
    }
    // Try with x-codeium-csrf-token = extCsrf
    if (s.extCsrf) {
      testRequest(s.port, path, { 'x-codeium-csrf-token': s.extCsrf }, 'extCsrf');
    }
  }
}

function testRequest(port, path, headers, tokenType) {
  const options = {
    hostname: '127.0.0.1',
    port: port,
    path: path,
    method: 'GET',
    headers: headers,
    timeout: 1000
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`[SUCCESS] Port: ${port}, Path: ${path}, TokenType: ${tokenType}, Status: 200`);
        console.log('Body:', body.substring(0, 500));
      }
    });
  });

  req.on('error', (e) => {
    // Silent
  });
  req.end();
}
