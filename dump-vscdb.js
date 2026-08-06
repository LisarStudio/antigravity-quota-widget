const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');
const fs = require('fs');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb');
const outPath = 'db-dump.txt';

try {
  const db = new DatabaseSync(dbPath);
  const rows = db.prepare("SELECT [key], value FROM ItemTable").all();
  let output = '';
  for (const row of rows) {
    output += `KEY: ${row.key}\n`;
    output += `VALUE: ${row.value}\n`;
    try {
      const buf = Buffer.from(row.value, 'base64');
      const ascii = buf.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
      output += `DECODED: ${ascii}\n`;
    } catch (_) {}
    output += '==================================================\n\n';
  }
  fs.writeFileSync(outPath, output, 'utf8');
  console.log('Dumped to:', outPath);
} catch (err) {
  console.error(err);
}
