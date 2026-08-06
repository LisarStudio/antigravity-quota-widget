const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb');

try {
  console.log('Abriendo DB:', dbPath);
  const db = new DatabaseSync(dbPath);
  
  // Listar tablas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tablas:', tables);
  
  // Buscar en ItemTable
  const rows = db.prepare("SELECT [key], value FROM ItemTable").all();
  console.log('Filas encontradas:', rows.length);
  for (const row of rows) {
    if (row.key.toLowerCase().includes('quota') || row.key.toLowerCase().includes('limit') || row.key.toLowerCase().includes('token') || row.key.toLowerCase().includes('credit') || row.key.toLowerCase().includes('user') || row.key.toLowerCase().includes('gemini') || row.key.toLowerCase().includes('antigravity')) {
      console.log(`KEY: ${row.key}`);
      console.log(`VALUE: ${row.value.substring(0, 300)}`);
      console.log('---');
    }
  }
} catch (err) {
  console.error('Error:', err);
}
