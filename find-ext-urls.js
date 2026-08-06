const fs = require('fs');

const file = 'C:\\Users\\peter\\AppData\\Local\\Programs\\Antigravity IDE\\resources\\app\\extensions\\antigravity\\dist\\extension.js';

try {
  const content = fs.readFileSync(file, 'utf8');
  const keywords = ['GetCredits', 'GetQuota', 'AntigravityService', 'userStatus', 'modelCredits', 'credits', 'quota'];
  for (const kw of keywords) {
    const idx = content.indexOf(kw);
    if (idx !== -1) {
      console.log(`Keyword: ${kw} found at index ${idx}`);
      console.log(content.substring(idx - 100, idx + 200));
      console.log('---');
    }
  }
} catch (e) {
  console.error(e);
}
