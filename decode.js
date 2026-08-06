const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb');

try {
  const db = new DatabaseSync(dbPath);
  const rows = db.prepare("SELECT [key], value FROM ItemTable").all();
  for (const row of rows) {
    if (row.key.includes('antigravity') || row.key.includes('Token') || row.key.includes('User')) {
      try {
        const rawVal = row.value;
        let decoded = '';
        if (rawVal.startsWith('Crts') || rawVal.startsWith('C') || rawVal.startsWith('ey')) {
          const cleanB64 = rawVal.replace(/^[A-Za-z0-9+/=]+Key/, ''); // strip prefix if any
          // Find any JSON substring inside
          const match = rawVal.match(/\{.*\}/);
          if (match) {
            console.log(`KEY: ${row.key}`);
            console.log('JSON found:', JSON.stringify(JSON.parse(match[0]), null, 2));
            console.log('---');
            continue;
          }
          // Try base64 decoding of the whole string or parts
          const buf = Buffer.from(rawVal, 'base64');
          const ascii = buf.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
          const jsonMatch = ascii.match(/\{.*\}/);
          console.log(`KEY: ${row.key}`);
          console.log('ASCII:', ascii);
          if (jsonMatch) {
            console.log('Parsed JSON from B64:', jsonMatch[0]);
          }
          console.log('---');
        }
      } catch (e) {
        // console.error(e);
      }
    }
  }
} catch (err) {
  console.error(err);
}
