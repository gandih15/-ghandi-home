// Build Ghandi.exe (portable folder) + Ghandi-Setup.exe from app/  —  node build/build-desktop.js [win32|linux]
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'), B = __dirname, plat = process.argv[2] || 'win32';
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/package.json'), 'utf8'));
const keys = require('./keys.json');
const rm = p => fs.rmSync(p, { recursive: true, force: true });
const cpdir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const n of fs.readdirSync(a)) { const s = path.join(a, n), d = path.join(b, n); fs.statSync(s).isDirectory() ? cpdir(s, d) : fs.copyFileSync(s, d); } };

// 1) stage the app
const STAGE = path.join(B, 'stage'); rm(STAGE); cpdir(path.join(ROOT, 'app'), STAGE);
rm(path.join(STAGE, 'print.html'));
fs.writeFileSync(path.join(STAGE, 'js/demo.js'), 'var Demo = null; /* demo data is not shipped */\n');
const pub = { kty: keys.pub.kty, crv: keys.pub.crv, x: keys.pub.x, y: keys.pub.y };
fs.writeFileSync(path.join(STAGE, 'main.js'), fs.readFileSync(path.join(ROOT, 'desktop/main.js'), 'utf8').replace('__PUBKEY__', JSON.stringify(pub)));
fs.writeFileSync(path.join(STAGE, 'package.json'), JSON.stringify({ name: 'ghandi-home', productName: 'Ghandi Home', version: pkg.version, main: 'main.js', description: 'Ghandi Home', author: 'Eng. Mohamed Ali 01098811581' }, null, 1));

// 2) signed integrity manifest
const list = []; (function walk(d) { for (const n of fs.readdirSync(d)) { const f = path.join(d, n); fs.statSync(f).isDirectory() ? walk(f) : list.push(path.relative(STAGE, f).split(path.sep).join('/')); } })(STAGE);
const files = {}; list.sort().forEach(f => files[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(STAGE, f))).digest('hex'));
const prv = crypto.createPrivateKey({ key: keys.prv, format: 'jwk' });
const sig = crypto.sign('sha256', Buffer.from(JSON.stringify(files)), { key: prv, dsaEncoding: 'ieee-p1363' }).toString('base64');
fs.writeFileSync(path.join(STAGE, 'manifest.json'), JSON.stringify({ files, sig }));
console.log('staged', list.length, 'files, manifest signed');

// 3) runtime + asar
const DL = process.env.GHANDI_DL || (fs.existsSync('/home/claude/dl') ? '/home/claude/dl' : path.join(ROOT, 'toolchain')); // electron.zip + nsis
const ZIP = plat === 'win32' ? path.join(DL, 'electron.zip') : path.join(DL, 'electron-linux.zip');
const OUT = path.join(ROOT, 'dist', plat === 'win32' ? 'GhandiHome' : 'GhandiHome-linux'); rm(OUT); fs.mkdirSync(OUT, { recursive: true });
cp.execSync(`unzip -q -o "${ZIP}" -d "${OUT}"`);
rm(path.join(OUT, 'resources/default_app.asar'));
const n = require('./asar')(STAGE, path.join(OUT, 'resources/app.asar'));
console.log('app.asar:', n, 'files', (fs.statSync(path.join(OUT, 'resources/app.asar')).size / 1048576).toFixed(1) + 'MB');
if (plat === 'win32') {
  fs.renameSync(path.join(OUT, 'electron.exe'), path.join(OUT, 'GhandiHome.exe'));
  cp.execSync(`python3 "${path.join(B, 'patch-exe.py')}" "${path.join(OUT, 'GhandiHome.exe')}" "${path.join(B, 'icon.svg')}"`, { stdio: 'inherit' });
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
  fs.copyFileSync(path.join(B, 'installer/readme-ar.txt'), path.join(OUT, 'اقرأني.txt'));
} else { fs.renameSync(path.join(OUT, 'electron'), path.join(OUT, 'ghandi')); }
console.log('OK ->', OUT);

// 4) installer (NSIS)
if (plat === 'win32') {
  const NSIS = path.join(DL, 'nsis'), DIST = path.join(ROOT, 'dist');
  const outExe = path.join(DIST, `Ghandi-Home-Setup-${pkg.version}.exe`);
  const nsi = fs.readFileSync(path.join(B, 'installer/ghandi.nsi'), 'utf8')
    .replace('__VER__', pkg.version.split('.').concat(['0', '0']).slice(0, 3).join('.'))
    .replace('__OUT__', outExe).replace(/__ICO__/g, path.join(B, 'ghandi.ico')).replace('__SRC__', OUT);
  fs.writeFileSync(path.join(B, 'installer/_build.nsi'), nsi);
  cp.execSync(`"${NSIS}/linux/makensis" -V2 "${path.join(B, 'installer/_build.nsi')}"`, { env: Object.assign({}, process.env, { NSISDIR: NSIS }), stdio: 'inherit' });
  console.log('installer ->', outExe, (fs.statSync(outExe).size / 1048576).toFixed(1) + 'MB');
  // small update package: replaces only resources/app.asar, keeps data & license
  const updExe = path.join(DIST, `Ghandi-Home-Update-${pkg.version}.exe`);
  const unsi = fs.readFileSync(path.join(B, 'installer/ghandi-update.nsi'), 'utf8')
    .replace('__VER__', pkg.version.split('.').concat(['0', '0']).slice(0, 3).join('.')).replace('__VERTXT__', pkg.version)
    .replace('__OUT__', updExe).replace(/__ICO__/g, path.join(B, 'ghandi.ico')).replace('__ASAR__', path.join(OUT, 'resources', 'app.asar'));
  fs.writeFileSync(path.join(B, 'installer/_update.nsi'), unsi);
  cp.execSync(`"${NSIS}/linux/makensis" -V2 "${path.join(B, 'installer/_update.nsi')}"`, { env: Object.assign({}, process.env, { NSISDIR: NSIS }), stdio: 'inherit' });
  console.log('update ->', updExe, (fs.statSync(updExe).size / 1048576).toFixed(1) + 'MB');
}
