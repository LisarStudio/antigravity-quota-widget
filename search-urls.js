const fs = require('fs');
const path = require('path');

const file = 'C:\\Users\\peter\\AppData\\Local\\Programs\\Antigravity IDE\\resources\\app\\out\\vs\\workbench\\workbench.desktop.main.js';

try {
  const content = fs.readFileSync(file, 'utf8');
  
  const regex = /"https:\/\/[^"]*"/g;
  const matches = content.match(regex) || [];
  const uniqueUrls = [...new Set(matches)];
  
  console.log('Google APIs:');
  for (const url of uniqueUrls) {
    if (url.includes('googleapis.com')) {
      console.log(url);
    }
  }
} catch (e) {
  console.error(e);
}
