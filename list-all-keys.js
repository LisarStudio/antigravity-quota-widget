const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb');

try {
  const db = new DatabaseSync(dbPath);
  const rows = db.prepare("SELECT [key] FROM ItemTable").all();
  console.log('ALL KEYS:');
  for (const row of rows) {
    console.log(row.key);
  }
} catch (err) {
  console.error(err);
}
