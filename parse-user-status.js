const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb');

try {
  const db = new DatabaseSync(dbPath);
  const rows = db.prepare("SELECT [key], value FROM ItemTable").all();
  for (const row of rows) {
    if (row.key === 'antigravityUnifiedStateSync.userStatus') {
      const buf = Buffer.from(row.value, 'base64');
      console.log('--- USER STATUS RAW ---');
      console.log(buf.toString('utf8'));
    }
  }
} catch (err) {
  console.error(err);
}
