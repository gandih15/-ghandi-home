/* Ghandi Home — desktop shell (Electron 22: last version that supports Windows 7)
   Eng. Mohamed Ali — 01098811581 */
'use strict';
const { app, BrowserWindow, ipcMain, dialog, Menu, shell, screen } = require('electron');
const path = require('path'), fs = require('fs'), crypto = require('crypto');

const EXE_DIR = path.dirname(process.execPath);
const DATA = process.env.GHANDI_DATA || path.join(EXE_DIR, 'data');
const PUB = __PUBKEY__;

// portable: everything (settings, cache, license clock-guard) lives next to GhandiHome.exe
try { fs.mkdirSync(path.join(DATA, 'profile'), { recursive: true }); app.setPath('userData', path.join(DATA, 'profile')); } catch (e) { }
app.commandLine.appendSwitch('lang', 'ar');
app.commandLine.appendSwitch('disable-features', 'Translate,CalculateNativeWinOcclusion');
if (process.platform === 'win32') app.setAppUserModelId('com.ghandi.home');

/* ---------- integrity: every program file must match the signed manifest ---------- */
function integrity() {
  try {
    const man = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
    const key = crypto.createPublicKey({ key: PUB, format: 'jwk' });
    const ok = crypto.verify('sha256', Buffer.from(JSON.stringify(man.files)), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(man.sig, 'base64'));
    if (!ok) return 'signature';
    for (const f of Object.keys(man.files)) {
      const h = crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, f))).digest('hex');
      if (h !== man.files[f]) return f;
    }
    return '';
  } catch (e) { return e.message; }
}

let win = null;
if (!app.requestSingleInstanceLock()) { app.quit(); }
else app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  const bad = integrity();
  if (bad) {
    dialog.showErrorBox('غاندي — Ghandi Home',
      'ملفات البرنامج اتعدّلت أو اتضربت، ومش هيشتغل علشان يحمي بياناتك.\nأعد تسطيب البرنامج من ملف التسطيب الأصلي — بياناتك في فولدر data مش هتتأثر.\n\n' +
      'Program files were modified or damaged. Please reinstall Ghandi — your data folder is safe.\n\n' +
      'الدعم: م. محمد علي — 01098811581\n(' + bad + ')');
    app.quit(); return;
  }
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1366, height: 800, minWidth: 1100, minHeight: 680, show: false, backgroundColor: '#160a18',
    title: 'غاندي — Ghandi Home', icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false, devTools: !!process.env.GHANDI_DEV, spellcheck: false, backgroundThrottling: false }
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.on('closed', () => { try { if (cdWin && !cdWin.isDestroyed()) cdWin.destroy(); } catch (e) { } win = null; });
  // every way of closing (Exit button, X, Alt+F4, taskbar, Windows shutdown) → backup first, then close
  let allowClose = false, asked = false;
  const askRenderer = () => { if (asked) return; asked = true; try { win.webContents.send('app-closing'); } catch (e) { allowClose = true; win.close(); } setTimeout(() => { allowClose = true; try { win.close(); } catch (e) { } }, 60000); };
  win.on('close', (e) => { if (allowClose) return; e.preventDefault(); askRenderer(); });
  win.on('session-end', () => { askRenderer(); });
  ipcMain.on('close-now', () => { allowClose = true; try { if (cdWin) cdWin.destroy(); } catch (e) { } try { win.close(); } catch (e) { app.quit(); } });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('before-input-event', (e, i) => { // no reload / devtools shortcuts in the shop
    const k = (i.key || '').toLowerCase();
    if ((i.control && (k === 'r' || (i.shift && k === 'i'))) || k === 'f5' || k === 'f12') e.preventDefault();
  });
  win.loadFile(path.join(__dirname, 'index.html'));
});
app.on('window-all-closed', () => app.quit());

/* ---------- printing ---------- */
ipcMain.handle('printers', async () => {
  try { const ps = await win.webContents.getPrintersAsync(); return ps.map(p => p.name); } catch (e) { return []; }
});
ipcMain.handle('savePdf', (ev, o) => new Promise((resolve) => {
  const tmp = path.join(DATA, 'profile', 'pdf-job.html');
  try { fs.writeFileSync(tmp, o.html, 'utf8'); } catch (e) { return resolve({ ok: false, error: e.message }); }
  const pw = new BrowserWindow({ show: false, width: 800, height: 1000, webPreferences: { javascript: false } });
  pw.loadFile(tmp);
  pw.webContents.once('did-finish-load', () => setTimeout(async () => {
    try {
      const po = { printBackground: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } }; if (o.pageSize) po.pageSize = o.pageSize; else po.preferCSSPageSize = true;
      const buf = await pw.webContents.printToPDF(po);
      const r = await dialog.showSaveDialog(win, { title: o.title || 'حفظ الملصقات', defaultPath: o.name || 'barcodes.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
      if (!r.canceled && r.filePath) { fs.writeFileSync(r.filePath, buf); resolve({ ok: true, path: r.filePath }); } else resolve({ ok: false, error: 'cancelled' });
    } catch (e) { resolve({ ok: false, error: e.message }); }
    setTimeout(() => { try { pw.destroy(); } catch (e) { } }, 300);
  }, 400));
}));
ipcMain.handle('printers2', async () => {
  try { const ps = await win.webContents.getPrintersAsync(); return ps.map(p => ({ name: p.name, isDefault: !!p.isDefault, status: p.status || 0 })); } catch (e) { return []; }
});
ipcMain.handle('print', (ev, o) => new Promise((resolve) => {
  const tmp = path.join(DATA, 'profile', 'print-job.html');
  try { fs.writeFileSync(tmp, o.html, 'utf8'); } catch (e) { return resolve({ ok: false, error: e.message }); }
  const pw = new BrowserWindow({ show: false, width: 800, height: 1000, webPreferences: { javascript: false } });
  pw.loadFile(tmp);
  pw.webContents.once('did-finish-load', () => setTimeout(() => {
    const opt = { silent: !!o.silent, printBackground: true, copies: o.copies || 1, margins: { marginType: 'none' } };
    if (o.printer) opt.deviceName = o.printer;
    if (o.pageSize) opt.pageSize = o.pageSize;
    else if (o.pageName) { opt.pageSize = ({ a4: 'A4', a5: 'A5', letter: 'Letter' })[String(o.pageName).toLowerCase()] || undefined; opt.scaleFactor = Math.max(25, Math.min(400, Math.round(Number(o.scale) || 100))); }
    pw.webContents.print(opt, (ok, err) => { resolve({ ok, error: err || '' }); setTimeout(() => { try { pw.destroy(); } catch (e) { } }, 500); });
  }, 300));
}));

/* ---------- folder picker for backup locations ---------- */
ipcMain.handle('pickDir', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'اختار فولدر النسخ الاحتياطي', properties: ['openDirectory', 'createDirectory'] });
  return r.canceled ? '' : r.filePaths[0];
});

/* ---------- customer display on the second monitor ---------- */
let cdWin = null;
ipcMain.on('cd-open', () => {
  if (cdWin && !cdWin.isDestroyed()) return;
  const ds = screen.getAllDisplays(), main = screen.getPrimaryDisplay();
  const other = ds.find(d => d.id !== main.id);
  const b = (other || main).bounds;
  cdWin = new BrowserWindow({ x: b.x + 40, y: b.y + 40, width: other ? b.width : 1024, height: other ? b.height : 640, frame: !other, autoHideMenuBar: true, backgroundColor: '#1a0b1d', title: 'Ghandi — شاشة العميل', icon: path.join(__dirname, 'icon.png'), focusable: !other, webPreferences: { nodeIntegration: true, contextIsolation: false, devTools: false } });
  cdWin.setMenu(null);
  if (other) cdWin.setFullScreen(true);
  cdWin.loadFile(path.join(__dirname, 'cd.html'));
  cdWin.webContents.on('will-navigate', (e) => e.preventDefault());
  cdWin.on('closed', () => { cdWin = null; });
  cdWin.webContents.once('did-finish-load', () => { if (win) win.webContents.send('cd-ready'); });
});
ipcMain.on('cd', (ev, d) => { if (cdWin && !cdWin.isDestroyed()) cdWin.webContents.send('cd', d); });

/* ---------- cash drawer: ESC p 0 25 250 sent raw to the receipt printer ---------- */
ipcMain.handle('drawer', (ev, o) => new Promise((resolve) => {
  if (process.platform !== 'win32') return resolve({ ok: false, error: 'windows only' });
  const ps1 = path.join(DATA, 'profile', 'drawer.ps1');
  const src = `param([string]$p)
$c = @"
using System; using System.Runtime.InteropServices;
public class GRaw {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] public class DI { public string n; public string o; public string t; }
 [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)] public static extern bool OpenPrinter(string n, out IntPtr h, IntPtr d);
 [DllImport("winspool.drv", SetLastError=true)] public static extern bool ClosePrinter(IntPtr h);
 [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)] public static extern bool StartDocPrinter(IntPtr h, int l, [In] DI d);
 [DllImport("winspool.drv")] public static extern bool EndDocPrinter(IntPtr h);
 [DllImport("winspool.drv")] public static extern bool StartPagePrinter(IntPtr h);
 [DllImport("winspool.drv")] public static extern bool EndPagePrinter(IntPtr h);
 [DllImport("winspool.drv")] public static extern bool WritePrinter(IntPtr h, byte[] b, int c, out int w);
 public static bool Kick(string n) { IntPtr h; if (!OpenPrinter(n, out h, IntPtr.Zero)) return false; DI d = new DI(); d.n = "Ghandi drawer"; d.t = "RAW";
  bool ok = StartDocPrinter(h, 1, d) && StartPagePrinter(h); byte[] b = new byte[]{27,112,0,25,250,27,112,1,25,250}; int w; ok = ok && WritePrinter(h, b, b.Length, out w); EndPagePrinter(h); EndDocPrinter(h); ClosePrinter(h); return ok; }
}
"@
Add-Type -TypeDefinition $c
if (-not $p) { $p = (Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default=TRUE").Name }
if ([GRaw]::Kick($p)) { "OK" } else { "FAIL" }
`;
  try { fs.writeFileSync(ps1, src, 'utf8'); } catch (e) { return resolve({ ok: false, error: e.message }); }
  require('child_process').execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-p', o.printer || ''], { windowsHide: true, timeout: 20000 }, (err, out) => {
    resolve({ ok: !err && /OK/.test(String(out)), error: err ? err.message : (/OK/.test(String(out)) ? '' : 'printer') });
  });
}));

/* ---------- version library: every version that ran here is kept, the developer can go back to any of them ---------- */
const ofs = (() => { try { return require('original-fs'); } catch (e) { return fs; } })();
const ASAR = __dirname; // …\resources\app.asar
const VERS = path.join(DATA, 'versions');
const asarVer = (p) => { try { return JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8')).version || ''; } catch (e) { return ''; } };
function archiveVersions() {
  try {
    if (!/\.asar$/i.test(ASAR)) return; // running unpacked (development)
    ofs.mkdirSync(VERS, { recursive: true });
    const me = app.getVersion(), mine = path.join(VERS, me + '.asar');
    if (!ofs.existsSync(mine)) ofs.copyFileSync(ASAR, mine);
    const prev = path.join(VERS, '_prev.asar'); // left by the update package
    if (ofs.existsSync(prev)) { const v = asarVer(prev); const dst = path.join(VERS, (v || 'old-' + Date.now()) + '.asar'); if (v && v !== me && !ofs.existsSync(dst)) ofs.renameSync(prev, dst); else ofs.unlinkSync(prev); }
  } catch (e) { }
}
app.whenReady().then(() => setTimeout(archiveVersions, 4000));
ipcMain.handle('versions', async () => {
  try {
    ofs.mkdirSync(VERS, { recursive: true });
    return { current: app.getVersion(), list: ofs.readdirSync(VERS).filter(n => /\.asar$/i.test(n) && n !== '_prev.asar').map(n => { const st = ofs.statSync(path.join(VERS, n)); return { v: n.replace(/\.asar$/i, ''), size: st.size, t: st.mtimeMs }; }) };
  } catch (e) { return { current: app.getVersion(), list: [], error: e.message }; }
});
ipcMain.handle('importVersion', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'اختار ملف إصدار غاندي (.asar)', filters: [{ name: 'Ghandi version', extensions: ['asar'] }], properties: ['openFile'] });
  if (r.canceled || !r.filePaths[0]) return { ok: false, error: 'cancelled' };
  const src = r.filePaths[0], v = asarVer(src);
  if (!v) return { ok: false, error: 'الملف ده مش إصدار غاندي' };
  try { ofs.mkdirSync(VERS, { recursive: true }); ofs.copyFileSync(src, path.join(VERS, v + '.asar')); return { ok: true, v }; } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('exportVersion', async (ev, v) => {
  const src = path.join(VERS, String(v).replace(/[\\/:*?"<>|]/g, '') + '.asar'); if (!ofs.existsSync(src)) return { ok: false, error: 'not found' };
  const r = await dialog.showSaveDialog(win, { title: 'حفظ نسخة من الإصدار', defaultPath: 'Ghandi-Home-' + v + '.asar', filters: [{ name: 'Ghandi version', extensions: ['asar'] }] });
  if (r.canceled || !r.filePath) return { ok: false, error: 'cancelled' };
  try { ofs.copyFileSync(src, r.filePath); return { ok: true, path: r.filePath }; } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('useVersion', async (ev, v) => {
  try {
    const src = path.join(VERS, String(v).replace(/[\\/:*?"<>|]/g, '') + '.asar');
    if (!ofs.existsSync(src) || !asarVer(src)) return { ok: false, error: 'الإصدار ده مش موجود' };
    if (!/\.asar$/i.test(ASAR)) return { ok: false, error: 'dev mode' };
    // keep the running version too, so you can come back to it
    const me = path.join(VERS, app.getVersion() + '.asar'); if (!ofs.existsSync(me)) ofs.copyFileSync(ASAR, me);
    // test that we can write next to the program
    const probe = path.join(path.dirname(ASAR), 'ghandi-write-test.tmp'); ofs.writeFileSync(probe, 'x'); ofs.unlinkSync(probe);
    const bat = path.join(DATA, 'profile', 'switch-version.cmd');
    const q = (s) => '"' + s + '"';
    fs.writeFileSync(bat, ['@echo off', 'chcp 65001 > nul', 'ping 127.0.0.1 -n 4 > nul', 'taskkill /F /IM ' + path.basename(process.execPath) + ' > nul 2>&1', 'ping 127.0.0.1 -n 2 > nul',
      'copy /y ' + q(src) + ' ' + q(ASAR) + ' > nul', 'start "" ' + q(process.execPath), 'del "%~f0"'].join('\r\n'), 'utf8');
    require('child_process').spawn('cmd.exe', ['/c', bat], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    setTimeout(() => { try { app.exit(0); } catch (e) { } }, 1200);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.code === 'EPERM' || e.code === 'EACCES' ? 'مفيش صلاحية كتابة في فولدر البرنامج — شغّل البرنامج كمسؤول (Run as administrator) مرة وجرّب تاني' : e.message }; }
});
