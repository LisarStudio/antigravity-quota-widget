const { execSync } = require('child_process');
const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function getActiveLanguageServerInstances() {
  try {
    const cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name = \'language_server_windows_x64.exe\'\\" | Select-Object -ExpandProperty CommandLine"';
    const out = execSync(cmd, { encoding: 'utf8' });
    const lines = out.split(/\r?\n/).filter(line => line.includes('--https_server_port'));

    const instances = [];
    for (const line of lines) {
      const portMatch = line.match(/--https_server_port\s+([0-9]+)/);
      const tokenMatch = line.match(/--csrf_token\s+([a-f0-9-]+)/i);
      if (portMatch && tokenMatch) {
        instances.push({
          port: parseInt(portMatch[1], 10),
          token: tokenMatch[1]
        });
      }
    }
    return instances;
  } catch (err) {
    return [];
  }
}

async function fetchRealQuota() {
  const instances = getActiveLanguageServerInstances();
  if (instances.length === 0) {
    throw new Error('No active LanguageServer process with https_server_port found');
  }

  for (const inst of instances) {
    try {
      const data = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({});
        const req = https.request({
          hostname: '127.0.0.1',
          port: inst.port,
          path: '/exa.language_server_pb.LanguageServerService/RetrieveUserQuotaSummary',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Connect-Protocol-Version': '1',
            'x-codeium-csrf-token': inst.token,
            'Content-Length': Buffer.byteLength(postData)
          }
        }, res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      });

      if (data && data.response && data.response.groups) {
        return { ...data, port: inst.port };
      }
    } catch (err) {}
  }
  throw new Error('Could not fetch quota from any detected LanguageServer instance');
}

fetchRealQuota().then(res => console.log('SUCCESSFUL REAL QUOTA DATA:\n', JSON.stringify(res, null, 2))).catch(console.error);
