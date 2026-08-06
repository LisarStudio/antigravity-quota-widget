const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');
const Module = require('module');

// Allow importing from IDE's node_modules
const ideNodeModules = 'C:\\Users\\peter\\AppData\\Local\\Programs\\Antigravity IDE\\resources\\app\\node_modules';
module.paths.push(ideNodeModules);

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb');

try {
  const db = new DatabaseSync(dbPath);
  const row = db.prepare("SELECT value FROM ItemTable WHERE [key]='antigravityUnifiedStateSync.userStatus'").get();
  if (row) {
    const buf = Buffer.from(row.value, 'base64');
    console.log('Protobuf length:', buf.length);
    
    // We can use protobufjs or @bufbuild/protobuf if available
    // Let's try to parse using a generic decoder or print all strings/numbers
    let i = 0;
    while (i < buf.length) {
      const key = buf[i];
      const wireType = key & 0x7;
      const fieldNumber = key >> 3;
      i++;
      
      console.log(`Field ${fieldNumber}, WireType ${wireType}`);
      if (wireType === 0) { // Varint
        let val = 0;
        let shift = 0;
        while (true) {
          const b = buf[i++];
          val |= (b & 0x7f) << shift;
          if (!(b & 0x80)) break;
          shift += 7;
        }
        console.log(`  Varint: ${val}`);
      } else if (wireType === 2) { // Length-delimited
        let len = 0;
        let shift = 0;
        while (true) {
          const b = buf[i++];
          len |= (b & 0x7f) << shift;
          if (!(b & 0x80)) break;
          shift += 7;
        }
        const data = buf.subarray(i, i + len);
        i += len;
        // Check if string
        const str = data.toString('utf8');
        const isPrintable = /^[a-zA-Z0-9\s().,/:_@{}=+?&-]*$/.test(str);
        if (isPrintable && len > 1) {
          console.log(`  String (len ${len}): "${str}"`);
        } else {
          console.log(`  Bytes (len ${len}): ${data.toString('hex')}`);
        }
      } else if (wireType === 1) { // 64-bit
        i += 8;
      } else if (wireType === 5) { // 32-bit
        i += 4;
      } else {
        console.log('  Unknown wire type');
        break;
      }
    }
  }
} catch (err) {
  console.error(err);
}
