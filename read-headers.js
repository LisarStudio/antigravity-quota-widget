const fs = require('fs');

const file = 'C:\\Users\\peter\\AppData\\Local\\Programs\\Antigravity IDE\\resources\\app\\extensions\\antigravity\\dist\\extension.js';

try {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /"[a-zA-Z0-9-]*csrf[a-zA-Z0-9-]*"/gi;
  const matches = content.match(regex) || [];
  console.log('Mentions of CSRF in strings:', [...new Set(matches)]);
} catch (e) {
  console.error(e);
}
