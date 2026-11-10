// node build/make-keys.js  → NEW signing key pair + activation HMAC key for Ghandi Home (run once; keep build/keys.json secret)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const F = path.join(__dirname, 'keys.json');
if (fs.existsSync(F) && !process.argv.includes('--force')) { console.log('keys.json exists — use --force to replace (old activation codes stop working)'); }
else {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const pub = publicKey.export({ format: 'jwk' }), prv = privateKey.export({ format: 'jwk' });
  pub.key_ops = ['verify']; pub.ext = true; prv.key_ops = ['sign']; prv.ext = true;
  fs.writeFileSync(F, JSON.stringify({ pub, prv, hmac: crypto.randomBytes(32).toString('hex') }));
  console.log('new keys.json written');
}
const k = JSON.parse(fs.readFileSync(F, 'utf8'));
const pub = { kty: k.pub.kty, crv: k.pub.crv, x: k.pub.x, y: k.pub.y };
fs.writeFileSync(path.join(__dirname, '../app/js/pubkey.js'), '/* Ghandi Home activation public key (verify only) */\nvar LICENSE_PUB = ' + JSON.stringify(pub) + ';\n');
const h = Buffer.from(k.hmac, 'hex'), m1 = crypto.randomBytes(16), m2 = crypto.randomBytes(16);
const a = [...h.slice(0, 16)].map((x, i) => x ^ m1[i]), c = [...h.slice(16, 32)].map((x, i) => x ^ m2[i]);
fs.writeFileSync(path.join(__dirname, '../app/js/lk.js'), '/* license verifier material */\nvar _LK=(function(a,b,c,d){var o=[];for(var i=0;i<16;i++)o.push(a[i]^b[i]);for(i=0;i<16;i++)o.push(c[i]^d[i]);return new Uint8Array(o);})(' + JSON.stringify(a) + ',' + JSON.stringify([...m1]) + ',' + JSON.stringify(c) + ',' + JSON.stringify([...m2]) + ');\n');
// keygen for the owner
const kg = path.join(__dirname, '../owner-tools/Ghandi-Home-Keygen.html');
let html = fs.readFileSync(path.join(__dirname, '../owner-tools/Ghandi-Keygen.html'), 'utf8');
html = html.replace(/var K=new Uint8Array\(\[[^\]]*\]\);/, 'var K=new Uint8Array(' + JSON.stringify([...h]) + ');');
fs.writeFileSync(kg, html);
console.log('pubkey.js, lk.js, Ghandi-Home-Keygen.html updated');
