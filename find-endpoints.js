const fs = require('fs');

const file = 'C:\\Users\\peter\\AppData\\Local\\Programs\\Antigravity IDE\\resources\\app\\product.json';

try {
  const content = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(content);
  
  // Print all keys and nested fields containing URLs or hosts
  const scan = (obj, path = '') => {
    if (typeof obj === 'string') {
      if (obj.startsWith('http') || obj.includes('antigravity') || obj.includes('google')) {
        console.log(`${path}: ${obj}`);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const k in obj) {
        scan(obj[k], path ? `${path}.${k}` : k);
      }
    }
  };
  scan(parsed);
} catch (e) {
  console.error(e);
}
