const fs = require('fs');

const file = 'C:\\Users\\peter\\AppData\\Local\\Programs\\Antigravity IDE\\resources\\app\\extensions\\antigravity\\dist\\extension.js';

try {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find strings like "google.antigravity..." or containing service methods
  const regex = /"[a-zA-Z0-9.-]+\/[a-zA-Z0-9.-]+"/g;
  const matches = content.match(regex) || [];
  const uniqueMatches = [...new Set(matches)];
  console.log('ConnectRPC/gRPC Paths:');
  for (const m of uniqueMatches) {
    if (m.toLowerCase().includes('antigravity') || m.toLowerCase().includes('agent') || m.toLowerCase().includes('quota') || m.toLowerCase().includes('user')) {
      console.log(m);
    }
  }
} catch (e) {
  console.error(e);
}
