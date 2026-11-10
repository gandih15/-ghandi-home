// minimal ASAR writer (Electron archive format)
const fs = require('fs'), path = require('path');
module.exports = function pack(srcDir, outFile) {
  const files = [], header = { files: {} }; let offset = 0;
  (function walk(dir, node) {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name), st = fs.statSync(full);
      if (st.isDirectory()) { node.files[name] = { files: {} }; walk(full, node.files[name]); }
      else { node.files[name] = { size: st.size, offset: String(offset) }; files.push(full); offset += st.size; }
    }
  })(srcDir, header);
  const json = Buffer.from(JSON.stringify(header), 'utf8');
  const pad = (4 - (json.length % 4)) % 4;
  const hp = Buffer.alloc(8 + json.length + pad); // header pickle: [payloadSize][strLen][str][pad]
  hp.writeUInt32LE(4 + json.length + pad, 0); hp.writeInt32LE(json.length, 4); json.copy(hp, 8);
  const sp = Buffer.alloc(8); sp.writeUInt32LE(4, 0); sp.writeUInt32LE(hp.length, 4);
  const fd = fs.openSync(outFile, 'w'); fs.writeSync(fd, sp); fs.writeSync(fd, hp);
  for (const f of files) fs.writeSync(fd, fs.readFileSync(f));
  fs.closeSync(fd); return files.length;
};
