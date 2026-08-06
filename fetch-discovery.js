const https = require('https');
const fs = require('fs');

const url = 'https://cloudaicompanion.googleapis.com/$discovery/rest?version=v1';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Resources:', Object.keys(parsed.resources || {}));
      fs.writeFileSync('discovery.json', JSON.stringify(parsed, null, 2));
      console.log('Saved discovery.json');
    } catch (e) {
      console.log('Error parsing:', e.message);
      console.log(data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
