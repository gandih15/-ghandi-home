// node build/make-devcred.js [user] [password]  → writes app/js/devcred.js (hash only — never the password)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const F = path.join(__dirname, 'dev-cred.json');
let c = JSON.parse(fs.readFileSync(F, 'utf8'));
if (process.argv[3]) { c = { u: process.argv[2], p: process.argv[3] }; fs.writeFileSync(F, JSON.stringify(c)); }
const salt = crypto.randomBytes(16).toString('base64url');
const hash = crypto.pbkdf2Sync(c.p, salt, 200000, 32, 'sha256').toString('base64url');
const uh = crypto.createHash('sha256').update('GHU|' + c.u.trim().toLowerCase()).digest('base64url');
fs.writeFileSync(path.join(__dirname, '../app/js/devcred.js'), '/* developer panel login (hash only) */\nvar DEV_CRED = ' + JSON.stringify({ uh, salt, hash, it: 200000 }) + ';\n');
console.log('devcred.js written for user', c.u);
