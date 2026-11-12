/* =========================================================
   Ghandi Home — core (storage, security, license, backup,
   barcode, excel, printing)
   Developer: Eng. Mohamed Ali — 01098811581
   ========================================================= */
'use strict';
// IS_NW = "running as the desktop program" (Electron build; NW.js kept for compatibility)
var IS_ELECTRON = typeof require === 'function' && typeof process !== 'undefined' && !!(process.versions && process.versions.electron);
var IS_NW = IS_ELECTRON || ((typeof nw !== 'undefined') && (typeof require === 'function'));
var IPC = IS_ELECTRON ? require('electron').ipcRenderer : null;
var NODE = {};
if (IS_NW) {
  NODE.fs = require('fs'); NODE.path = require('path'); NODE.zlib = require('zlib');
  NODE.cp = require('child_process'); NODE.os = require('os'); NODE.crypto = require('crypto');
}
/* ---------- data-at-rest protection: AES-256-GCM (+gzip) — unreadable outside Ghandi, any damage is detected ---------- */
var Vault = {
  MAGIC: 'GHDB2',
  key: function () { return Vault._k || (Vault._k = NODE.crypto.createHash('sha256').update('Ghandi Home|data vault|v1|' + 'م. محمد علي 01098811581|9f4e1c7a2b').digest()); },
  seal: function (text) {
    var iv = NODE.crypto.randomBytes(12), c = NODE.crypto.createCipheriv('aes-256-gcm', Vault.key(), iv);
    var body = Buffer.concat([c.update(NODE.zlib.gzipSync(Buffer.from(text, 'utf8'))), c.final()]);
    return Buffer.concat([Buffer.from(Vault.MAGIC), iv, c.getAuthTag(), body]);
  },
  isSealed: function (buf) { return Buffer.isBuffer(buf) && buf.length > 33 && buf.slice(0, 5).toString() === Vault.MAGIC; },
  open: function (buf) { // throws if damaged / tampered
    var iv = buf.slice(5, 17), tag = buf.slice(17, 33), d = NODE.crypto.createDecipheriv('aes-256-gcm', Vault.key(), iv);
    d.setAuthTag(tag); return NODE.zlib.gunzipSync(Buffer.concat([d.update(buf.slice(33)), d.final()])).toString('utf8');
  },
  read: function (file) { var b = NODE.fs.readFileSync(file); return Vault.isSealed(b) ? Vault.open(b) : b.toString('utf8'); }
};
var APP = { name: 'Ghandi Home', nameAr: 'غاندي', version: '1.9.10', dev: 'م. محمد علي', devEn: 'Eng. Mohamed Ali', phone: '01098811581' };

/* ---------- small utils ---------- */
var U = {
  id: function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
  esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
  n: function (v) { v = parseFloat(v); return isFinite(v) ? v : 0; },
  r2: function (v) { return Math.round((+v || 0) * 100) / 100; },
  money: function (v) { var x = U.r2(v); return x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
  pad: function (n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; },
  today: function (d) { d = d ? new Date(d) : new Date(); return d.getFullYear() + '-' + U.pad(d.getMonth() + 1, 2) + '-' + U.pad(d.getDate(), 2); },
  dt: function (d) { d = new Date(d); return U.today(d) + ' ' + U.pad(d.getHours(), 2) + ':' + U.pad(d.getMinutes(), 2); },
  stamp: function () { var d = new Date(); return U.today(d).replace(/-/g, '') + '_' + U.pad(d.getHours(), 2) + U.pad(d.getMinutes(), 2) + U.pad(d.getSeconds(), 2); },
  clone: function (o) { return JSON.parse(JSON.stringify(o)); },
  norm: function (s) { // Arabic-aware search normalisation
    return String(s || '').toLowerCase().replace(/[أإآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[ً-ْ]/g, '').trim();
  },
  b64u: function (bytes) { var s = ''; bytes = new Uint8Array(bytes); for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  unb64u: function (s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; },
  sha256: function (str) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (h) { return Array.from(new Uint8Array(h)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }); }
};

/* ---------- password hashing (PBKDF2-SHA256, 60k) ---------- */
var Sec = {
  hash: function (pw, salt) {
    salt = salt || U.b64u(crypto.getRandomValues(new Uint8Array(16)));
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 60000 }, k, 256);
    }).then(function (bits) { return { salt: salt, hash: U.b64u(bits) }; });
  },
  verify: function (pw, user) { return Sec.hash(pw, user.salt).then(function (r) { return r.hash === user.hash; }); }
};

/* ---------- permissions catalogue ---------- */
var PERMS = [
  ['g', 'نقطة البيع', 'Point of sale'],
  ['pos.sell', 'البيع', 'Sell'],
  ['pos.discount', 'عمل خصم على الفاتورة', 'Give discounts'],
  ['pos.maxDiscount', 'أقصى نسبة خصم %', 'Max discount %', 'num'],
  ['pos.priceEdit', 'تعديل السعر وقت البيع', 'Edit price while selling'],
  ['pos.changeTier', 'تغيير شريحة السعر (جملة/نص جملة)', 'Change price tier'],
  ['pos.credit', 'البيع الآجل', 'Credit sales'],
  ['pos.return', 'المرتجعات', 'Returns'],
  ['pos.hold', 'تعليق الفواتير', 'Hold invoices'],
  ['pos.reprint', 'إعادة طباعة فاتورة', 'Reprint invoice'],
  ['pos.drawer', 'فتح درج الكاش يدوي', 'Open cash drawer manually'],
  ['layaway', 'الحجز بعربون', 'Layaway (reservations)'],
  ['g', 'الأصناف والمخزن', 'Products & stock'],
  ['products.view', 'عرض الأصناف', 'View products'],
  ['products.add', 'إضافة أصناف', 'Add products'],
  ['products.edit', 'تعديل بيانات الأصناف', 'Edit products'],
  ['products.editPrice', 'تعديل أسعار الأصناف', 'Edit product prices'],
  ['products.viewCost', 'رؤية سعر التكلفة', 'View cost price'],
  ['stock.viewQty', 'رؤية الكميات المتوفرة (الرصيد) في كل الصفحات — لو مقفولة: بيبيع عادي من غير ما يشوف العدد، والجرد بيعد بس', 'See stock quantities everywhere — when off: sells normally without seeing counts; stock count is blind'],
  ['prices.viewAll', 'رؤية أسعار كل الشرائح (حتى اللي مش بيبيع بيها)', 'See every price tier (even ones they cannot sell at)'],
  ['products.delete', 'حذف أصناف', 'Delete products'],
  ['stock.count', 'الجرد (العد فقط)', 'Stock count (counting only)'],
  ['stock.apply', 'اعتماد الجرد وتعديل الرصيد', 'Approve count / adjust stock'],
  ['purchases', 'استلام الأصناف / المشتريات', 'Goods receiving / purchases'],
  ['promos', 'العروض والخصومات على الأصناف', 'Offers & product discounts'],
  ['labels', 'طباعة الباركود', 'Print barcode labels'],
  ['import', 'استيراد من إكسيل', 'Import from Excel'],
  ['export', 'تصدير إلى إكسيل', 'Export to Excel'],
  ['g', 'الحسابات والتقارير', 'Accounts & reports'],
  ['customers', 'العملاء', 'Customers'],
  ['customers.points', 'تعديل نقاط العملاء يدوي', 'Adjust customer points'],
  ['coupons', 'الكوبونات وكروت الهدايا', 'Coupons & gift cards'],
  ['suppliers', 'الموردين', 'Suppliers'],
  ['expenses', 'المصروفات', 'Expenses'],
  ['sales.history', 'سجل المبيعات', 'Sales history'],
  ['sales.delete', 'إلغاء فواتير', 'Void invoices'],
  ['reports', 'التقارير', 'Reports'],
  ['reports.profit', 'رؤية الأرباح', 'View profit'],
  ['shifts.all', 'رؤية ورديات الآخرين', 'View all shifts'],
  ['g', 'الإدارة', 'Administration'],
  ['backup', 'النسخ الاحتياطي', 'Backup'],
  ['restore', 'استرجاع نسخة', 'Restore backup'],
  ['invoiceDesign', 'تصميم الفاتورة', 'Invoice design'],
  ['settings', 'الإعدادات', 'Settings'],
  ['users', 'المستخدمين والصلاحيات', 'Users & permissions']
];
function allPerms(v) { var o = {}; PERMS.forEach(function (p) { if (p[0] !== 'g') o[p[0]] = p[3] === 'num' ? (v ? 100 : 0) : p[3] === 'sel' ? 0 : !!v; }); return o; }
var ROLE_PRESETS = {
  cashier: function () { var o = allPerms(false); ['pos.sell', 'pos.hold', 'pos.discount', 'products.view', 'customers', 'pos.reprint', 'pos.drawer', 'layaway', 'stock.viewQty'].forEach(function (k) { o[k] = true; }); o['pos.maxDiscount'] = 5; return o; },
  counter: function () { var o = allPerms(false); o['products.view'] = true; o['stock.count'] = true; return o; },
  manager: function () { var o = allPerms(true); o['users'] = false; o['restore'] = false; o['settings'] = false; return o; }
};

/* ---------- default database ---------- */
function defaultDB() {
  return {
    v: 1,
    seq: { invoice: 0, purchase: 0, barcode: 0, shift: 0 },
    settings: {
      lang: 'ar', theme: 'light', skin: 'sapphire', currency: 'ج.م', currencyEn: 'EGP',
      // shop identity — filled by each shop owner (or from the activation key); "Ghandi" is only the system name
      shopName: '', shopNameEn: '', slogan: '', ownerName: '', shopPhone: '', shopPhone2: '', whatsapp: '', facebook: '', instagram: '',
      shopAddress: '', taxNo: '', crNo: '', logo: '',
      tiers: [['قطاعي', 'Retail'], ['نص جملة', 'Half-wholesale'], ['جملة', 'Wholesale'], ['سعر خاص', 'Special']],
      defaultTier: 0, allowNegativeStock: false, expiryAlertDays: 60, vat: 0,
      categories: ['أجهزة كهربائية', 'أدوات منزلية', 'أطقم صيني وأركوبال', 'أواني طهي', 'مفروشات', 'سجاد', 'ستائر', 'أنتريهات وموبيليا', 'تجهيز عرائس'],
      payMethods: [['cash', 'كاش', 'Cash'], ['card', 'فيزا', 'Card'], ['wallet', 'فودافون كاش / محفظة', 'Mobile wallet'], ['instapay', 'إنستاباي', 'InstaPay'], ['bank', 'تحويل بنكي / شيك', 'Bank transfer / cheque']],
      printers: { invoice: '', label: '', silent: true },
      invoice: { paper: 'A4', fontSize: 12, showLogo: true, showShop: true, showAddress: true, showPhone: true, showCashier: true, showCustomer: true, showBarcode: true, showSaved: true, showTier: false, showSocial: true, showTaxNo: false, header: '', footer: 'شكراً لثقتكم — الاستبدال والاسترجاع خلال 14 يوماً بالفاتورة وبحالة البضاعة الأصلية', showDev: true, accent: '#1f4e79', copies: 1 },
      label: { w: 38, h: 25, cols: 1, gap: 2, showName: true, showPrice: true, showShop: true, showPromo: true, priceTier: 0, fontSize: 9, barH: 11 },
      backup: { auto: true, every: 30, keep: 1, folders: [], slots: [{ path: '', on: true }, { path: '', on: true }, { path: '', on: true }], status: {}, allUsb: true, onClose: true, onShiftClose: true },
      lockMinutes: 0
    },
    users: [], products: [], customers: [], suppliers: [], sales: [], purchases: [],
    expenses: [], shifts: [], counts: [], moves: [], held: [], log: [], promos: [], priceHistory: []
  };
}

/* ---------- Store (file in NW / localStorage in browser) ---------- */
var Store = {
  db: null, dirty: false, timer: null, bcIndex: null,
  dataDir: function () {
    if (!IS_NW) return '';
    if (Store._dd) return Store._dd;
    var base = NODE.path.dirname(process.execPath);
    if (process.env.GHANDI_DATA) { base = null; }
    // when run from SDK during development use package folder
    if (/nw(\.exe)?$/i.test(process.execPath) && !NODE.fs.existsSync(NODE.path.join(base, 'package.nw'))) base = process.cwd();
    var d = base ? NODE.path.join(base, 'data') : process.env.GHANDI_DATA;
    if (!NODE.fs.existsSync(d)) NODE.fs.mkdirSync(d, { recursive: true });
    return (Store._dd = d);
  },
  file: function () { return IS_NW ? NODE.path.join(Store.dataDir(), 'ghandi.db') : 'ghandi.db'; },
  load: function () {
    var raw = null;
    try {
      if (IS_NW) { if (NODE.fs.existsSync(Store.file())) raw = Vault.read(Store.file()); }
      else raw = localStorage.getItem('ghandi.db');
      if (raw) { Store.db = Store.migrate(JSON.parse(raw)); Store.reindex(); return 'ok'; }
      return 'empty';
    } catch (e) {
      // try last good copy
      try { if (IS_NW && NODE.fs.existsSync(Store.file() + '.prev')) { Store.db = Store.migrate(JSON.parse(Vault.read(Store.file() + '.prev'))); Store.reindex(); Store.saveNow(); return 'recovered'; } } catch (e2) { }
      return 'corrupt';
    }
  },
  migrate: function (db) {
    var d = defaultDB();
    Object.keys(d).forEach(function (k) { if (db[k] === undefined) db[k] = d[k]; });
    Object.keys(d.settings).forEach(function (k) { if (db.settings[k] === undefined) db.settings[k] = d.settings[k]; });
    if (db.settings.shopName === 'غاندي للإكسسوارات والهدايا') { db.settings.shopName = ''; if (db.settings.shopNameEn === 'Ghandi Accessories & Gifts') db.settings.shopNameEn = ''; }
    var bk = db.settings.backup || {};
    if (!bk.slots) { var fo = bk.folders || []; bk.slots = [0, 1, 2].map(function (i) { return { path: fo[i] || '', on: true }; }); }
    if (!bk.status) bk.status = {};
    ['invoice', 'label', 'backup', 'printers'].forEach(function (k) { Object.keys(d.settings[k]).forEach(function (j) { if (db.settings[k][j] === undefined) db.settings[k][j] = d.settings[k][j]; }); });
    return db;
  },
  init: function () { Store.db = defaultDB(); Store.reindex(); },
  save: function () { Store.dirty = true; clearTimeout(Store.timer); Store.timer = setTimeout(Store.saveNow, 350); },
  saveNow: function () {
    if (!Store.db) return;
    var txt = JSON.stringify(Store.db);
    if (IS_NW) {
      var f = Store.file(), tmp = f + '.tmp';
      var fd = NODE.fs.openSync(tmp, 'w'); NODE.fs.writeSync(fd, Vault.seal(txt)); try { NODE.fs.fsyncSync(fd); } catch (e) { } NODE.fs.closeSync(fd);
      if (NODE.fs.existsSync(f)) { try { NODE.fs.copyFileSync(f, f + '.prev'); } catch (e) { } }
      NODE.fs.renameSync(tmp, f);
    } else { try { localStorage.setItem('ghandi.db', txt); } catch (e) { console.warn(e); } }
    Store.dirty = false;
  },
  reindex: function () {
    var m = {}; (Store.db.products || []).forEach(function (p) { (p.barcodes || []).forEach(function (b) { if (b) m[String(b).trim()] = p; }); });
    Store.bcIndex = m;
  },
  byBarcode: function (code) { return Store.bcIndex[String(code).trim()] || null; },
  product: function (id) { for (var i = 0; i < Store.db.products.length; i++) if (Store.db.products[i].id === id) return Store.db.products[i]; return null; },
  newBarcode: function () {
    var s = Store.db.seq, code;
    do { s.barcode++; code = '2' + U.pad(s.barcode, 11); } while (Store.bcIndex[code]);
    return code;
  },
  log: function (action, details) {
    Store.db.log.unshift({ t: Date.now(), u: App.user ? App.user.username : '-', a: action, d: details || '' });
    if (Store.db.log.length > 3000) Store.db.log.length = 3000;
  },
  move: function (pid, qty, type, ref) { // stock movement journal
    var p = Store.product(pid); if (!p) return;
    p.stock = U.r2(U.n(p.stock) + qty);
    Store.db.moves.push({ t: Date.now(), p: pid, q: qty, k: type, r: ref || '', u: App.user ? App.user.username : '-', s: p.stock });
  }
};

/* ---------- Device fingerprint & license ---------- */
/* LICENSE_PUB is defined in js/pubkey.js */
var License = {
  fp: null, info: null,
  fingerprint: function () {
    if (License.fp) return Promise.resolve(License.fp);
    var parts = [];
    if (IS_NW) {
      var run = function (c) { try { return NODE.cp.execSync(c, { windowsHide: true, timeout: 8000 }).toString().replace(/\s+/g, ' ').trim(); } catch (e) { return ''; } };
      if (process.platform === 'win32') {
        // values only (no headers) so the ID is identical whether read via PowerShell (Win7..11) or wmic
        var q = [['Win32_ComputerSystemProduct', 'UUID'], ['Win32_BaseBoard', 'SerialNumber'], ['Win32_Processor', 'ProcessorId'], ['Win32_BIOS', 'SerialNumber']];
        var ps = run('powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "' + q.map(function (x) { return '(Get-WmiObject ' + x[0] + ' | Select-Object -First 1).' + x[1]; }).join(';') + '"');
        var id = (ps || '').replace(/\s+/g, '');
        if (id.length < 8) id = q.map(function (x) { return run('wmic path ' + x[0] + ' get ' + x[1] + ' /value').replace(/^.*?=/, ''); }).join('').replace(/\s+/g, '');
        if (id.length < 8) id = NODE.os.hostname() + (NODE.os.cpus()[0] || {}).model; // last resort
        parts.push(id.toUpperCase());
      } else { parts.push(NODE.os.hostname(), (NODE.os.cpus()[0] || {}).model, run('cat /etc/machine-id')); }
    } else {
      var k = localStorage.getItem('ghandi.devseed'); if (!k) { k = U.id() + U.id(); localStorage.setItem('ghandi.devseed', k); }
      parts.push(k, navigator.userAgent, screen.width + 'x' + screen.height);
    }
    return U.sha256('GHANDI-HOME|' + parts.join('|')).then(function (h) {
      h = h.toUpperCase().slice(0, 20); License.fp = h.match(/.{1,5}/g).join('-'); return License.fp;
    });
  },
  path: function () { return IS_NW ? NODE.path.join(Store.dataDir(), 'license.key') : null; },
  read: function () { try { return IS_NW ? (NODE.fs.existsSync(License.path()) ? NODE.fs.readFileSync(License.path(), 'utf8').trim() : '') : (localStorage.getItem('ghandi.license') || ''); } catch (e) { return ''; } },
  write: function (k) { if (IS_NW) NODE.fs.writeFileSync(License.path(), k, 'utf8'); else localStorage.setItem('ghandi.license', k); },
  /* ---- short codes: XXXX-XXXX-XXXX-XXXX (80 bits = 32-bit payload + 48-bit HMAC bound to this device) ---- */
  B32: '0123456789ABCDEFGHJKMNPQRSTVWXYZ',
  EPOCH: Date.UTC(2026, 0, 1),
  norm: function (s) { return String(s || '').toUpperCase().replace(/[\s\-_.]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V'); },
  b32dec: function (s) { var bits = ''; for (var i = 0; i < s.length; i++) { var v = License.B32.indexOf(s[i]); if (v < 0) return null; bits += ('0000' + v.toString(2)).slice(-5); } var out = []; for (i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.substr(i, 8), 2)); return new Uint8Array(out); },
  b32enc: function (bytes) { var bits = ''; for (var i = 0; i < bytes.length; i++) bits += ('0000000' + bytes[i].toString(2)).slice(-8); var s = ''; for (i = 0; i < bits.length; i += 5) s += License.B32[parseInt((bits.substr(i, 5) + '0000').slice(0, 5), 2)]; return s; },
  mac: function (msg, n) { return crypto.subtle.importKey('raw', _LK, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']).then(function (k) { return crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)); }).then(function (h) { return new Uint8Array(h).slice(0, n); }); },
  same: function (a, b) { if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; },
  verifyShort: function (code) {
    var c = License.norm(code); if (c.length !== 16) return Promise.resolve({ ok: false, why: 'format' });
    var b = License.b32dec(c); if (!b || b.length !== 10) return Promise.resolve({ ok: false, why: 'format' });
    var fp;
    return License.fingerprint().then(function (f) { fp = f; return License.mac('GHX1|' + fp.replace(/-/g, ''), 4); }).then(function (mask) {
      for (var i = 0; i < 4; i++) b[i] ^= mask[i];
      var p = Array.prototype.map.call(b.slice(0, 4), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      return License.mac('GHL1|' + fp.replace(/-/g, '') + '|' + p, 6).then(function (m) {
        if (!License.same(m, b.slice(4))) return { ok: false, why: 'device' };
        var v = (b[0] << 24 >>> 0) + (b[1] << 16) + (b[2] << 8) + b[3], days = (v >>> 16) & 0x3fff;
        return { ok: true, payload: { f: fp, e: days ? License.EPOCH + days * 864e5 : 0, i: 0, short: 1 } };
      });
    });
  },
  devChallenge: function () { var r = crypto.getRandomValues(new Uint8Array(4)); return License.b32enc(r).slice(0, 6); },
  devCheck: function (challenge, answer) {
    return License.fingerprint().then(function (fp) { return License.mac('GHD1|' + fp.replace(/-/g, '') + '|' + License.norm(challenge), 5); })
      .then(function (m) { var a = License.norm(answer); return a.length === 8 && License.b32enc(m) === a; });
  },
  verify: function (key) {
    key = String(key || '').replace(/\s+/g, '');
    if (key.indexOf('.') < 0) return License.verifyShort(key).then(License.guard);
    var parts = key.split('.'); if (parts.length !== 2) return Promise.resolve({ ok: false, why: 'format' });
    var payload; try { payload = JSON.parse(new TextDecoder().decode(U.unb64u(parts[0]))); } catch (e) { return Promise.resolve({ ok: false, why: 'format' }); }
    return Promise.all([License.fingerprint(), crypto.subtle.importKey('jwk', LICENSE_PUB, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])]).then(function (r) {
      return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, r[1], U.unb64u(parts[1]), U.unb64u(parts[0])).then(function (ok) {
        if (!ok) return { ok: false, why: 'sig' };
        if (payload.f !== r[0]) return { ok: false, why: 'device' };
        if (payload.e && Date.now() > payload.e) return { ok: false, why: 'expired', payload: payload };
        // clock rollback guard
        var last = +(localStorage.getItem('ghandi.lastSeen') || 0);
        if (payload.e && last && Date.now() < last - 36e5 * 24) return { ok: false, why: 'clock' };
        localStorage.setItem('ghandi.lastSeen', Math.max(last, Date.now()));
        return { ok: true, payload: payload };
      });
    });
  },
  guard: function (r) {
    if (!r.ok) return r; var p = r.payload;
    if (p.e && Date.now() > p.e) return { ok: false, why: 'expired', payload: p };
    var last = +(localStorage.getItem('ghandi.lastSeen') || 0);
    if (p.e && last && Date.now() < last - 36e5 * 24) return { ok: false, why: 'clock' };
    localStorage.setItem('ghandi.lastSeen', Math.max(last, Date.now())); return r;
  },
  check: function () { var k = License.read(); if (!k) return Promise.resolve({ ok: false, why: 'none' }); return License.verify(k).then(function (r) { License.info = r.ok ? r.payload : null; return r; }); }
};

/* ---------- Backup / restore ---------- */
var Backup = {
  last: 0, timer: null,
  pack: function () {
    var body = JSON.stringify({ app: 'ghandi', ver: APP.version, at: Date.now(), db: Store.db });
    return IS_NW ? Vault.seal(body) : body;
  },
  unpack: function (buf) {
    var txt;
    if (IS_NW && Vault.isSealed(buf)) txt = Vault.open(buf);
    else if (IS_NW && buf[0] === 0x1f && buf[1] === 0x8b) txt = NODE.zlib.gunzipSync(buf).toString('utf8'); else txt = typeof buf === 'string' ? buf : buf.toString('utf8');
    var o = JSON.parse(txt); if (o.app !== 'ghandi' || !o.db) throw new Error('not a ghandi backup'); return o;
  },
  usbDrives: function () {
    if (!IS_NW || process.platform !== 'win32') return [];
    var run = function (c) { try { return NODE.cp.execSync(c, { windowsHide: true, timeout: 8000 }).toString(); } catch (e) { return ''; } };
    if (Backup._usb && Date.now() - Backup._usb.t < 20000) return Backup._usb.v;
    var out = run('powershell -NoProfile -NonInteractive -Command "Get-WmiObject Win32_LogicalDisk -Filter \'DriveType=2\' | ForEach-Object { $_.DeviceID }"') || run('wmic logicaldisk where drivetype=2 get deviceid');
    var v = (out.match(/[A-Z]:/g) || []).filter(function (d, i, a) { return a.indexOf(d) === i; });
    Backup._usb = { t: Date.now(), v: v }; return v;
  },
  allDrives: function () {
    if (!IS_NW || process.platform !== 'win32') return [];
    var out = []; 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (l) { try { if (NODE.fs.existsSync(l + ':\\')) out.push(l + ':'); } catch (e) { } }); return out;
  },
  internalDir: function () { return IS_NW ? NODE.path.join(Store.dataDir(), 'backups') : 'D:\\Ghandi\\data\\backups'; },
  // a drive root ("E:" / "E:\\") gets its own sub-folder so the stick stays tidy
  slotDir: function (p) { p = String(p || '').trim().replace(/[\\\/]+$/, ''); if (/^[A-Za-z]:$/.test(p)) p += '\\Ghandi-Backup'; return p; },
  driveOf: function (p) { var m = String(p || '').match(/^([A-Za-z]:)/); return m ? m[1].toUpperCase() : ''; },
  driveReady: function (p) { if (!IS_NW) return true; var d = Backup.driveOf(p); if (!d) return true; try { return NODE.fs.existsSync(d + '\\'); } catch (e) { return false; } },
  slotPaths: function () { return (Store.db.settings.backup.slots || []).filter(function (s) { return s.on && s.path; }).map(function (s) { return Backup.slotDir(s.path); }); },
  targets: function () {
    var b = Store.db.settings.backup, t = [{ key: 'internal', dir: Backup.internalDir() }];
    (b.slots || []).forEach(function (s, i) { if (s.on && s.path) t.push({ key: 's' + i, dir: Backup.slotDir(s.path) }); });
    if (b.allUsb) Backup.usbDrives().forEach(function (d) { t.push({ key: 'usb:' + d, dir: d + '\\Ghandi-Backup' }); });
    var seen = {}; return t.filter(function (x) { var k = x.dir.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
  },
  count: function (dir) { if (!IS_NW) return 0; try { return NODE.fs.readdirSync(dir).filter(function (f) { return /^ghandi_.*\.gbk$/.test(f); }).length; } catch (e) { return -1; } },
  readme: function () {
    var b = Store.db.settings.backup, ar = [], en = [];
    ar.push('غاندي — أماكن النسخ الاحتياطية', '==============================', '', 'محل: ' + (Store.db.settings.shopName || ''), 'آخر تحديث: ' + U.dt(Date.now()), '',
      '1) النسخة الأساسية (جوه ملفات البرنامج — الفولدر ده):', '   ' + Backup.internalDir(), '');
    (b.slots || []).forEach(function (s, i) { ar.push((i + 2) + ') المكان رقم ' + (i + 1) + ': ' + (s.path ? Backup.slotDir(s.path) + (s.on ? '' : '  (متوقف)') : '— لم يتم التحديد —')); });
    if (b.allUsb) ar.push('', '+ أي فلاشة بتتوصل: فولدر Ghandi-Backup على الفلاشة');
    ar.push('', 'كل ملف اسمه ghandi_السنة الشهر اليوم_الساعة.gbk = نسخة كاملة من البيانات.',
      'للاسترجاع: افتح البرنامج ← النسخ الاحتياطي ← اختر ملف .gbk',
      'لو الويندوز وقع: شغّل GhandiHome.exe من نفس المكان، وهيلاقي آخر نسخة لوحده.', '',
      'Ghandi Home — Backup locations', '1) Main copy (inside the program folder): ' + Backup.internalDir());
    (b.slots || []).forEach(function (s, i) { ar.push((i + 2) + ') Location ' + (i + 1) + ': ' + (s.path ? Backup.slotDir(s.path) : '(not set)')); });
    ar.push('Restore: Ghandi → Backup → choose a .gbk file.', '', 'Support: ' + APP.devEn + ' — ' + APP.phone);
    return '\ufeff' + ar.join('\r\n');
  },
  run: function (reason) {
    Store.saveNow();
    var res = { ok: [], fail: [] };
    if (!IS_NW) { // browser: download
      var blob = new Blob([Backup.pack()], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ghandi_' + U.stamp() + '.gbk'; a.click();
      res.ok.push('Downloads'); Backup.last = Date.now(); return res;
    }
    var b = Store.db.settings.backup, data = Backup.pack(), name = 'ghandi_' + U.stamp() + '.gbk', keep = (S().dev && S().dev.keep) || 1, now = Date.now();
    res.missing = [];
    Backup.targets().forEach(function (t) {
      var dir = t.dir, st = b.status[t.key] = b.status[t.key] || {};
      if (!Backup.driveReady(dir)) { st.miss = now; res.missing.push(dir); return; }
      try {
        if (!NODE.fs.existsSync(dir)) NODE.fs.mkdirSync(dir, { recursive: true });
        // write → verify → then replace: the old copy is removed only after the new one is proven readable
        var tmpf = NODE.path.join(dir, name + '.part'); NODE.fs.writeFileSync(tmpf, data);
        Backup.unpack(NODE.fs.readFileSync(tmpf)); NODE.fs.renameSync(tmpf, NODE.path.join(dir, name));
        var files = NODE.fs.readdirSync(dir).filter(function (f) { return /^ghandi_.*\.gbk$/.test(f); }).sort();
        while (files.length > keep) { NODE.fs.unlinkSync(NODE.path.join(dir, files.shift())); }
        st.t = now; st.err = ''; st.miss = 0; st.file = name; st.dir = dir;
        res.ok.push(dir);
      } catch (e) { st.err = e.message; st.et = now; res.fail.push(dir + ' (' + e.message + ')'); }
    });
    try { NODE.fs.writeFileSync(NODE.path.join(Backup.internalDir(), 'اقرأني - أماكن النسخ الاحتياطية.txt'), Backup.readme(), 'utf8'); } catch (e) { }
    try { localStorage.setItem('ghandi.backupFolders', JSON.stringify(Backup.slotPaths())); } catch (e) { }
    Store.save();
    Backup.last = Date.now(); localStorage.setItem('ghandi.lastBackup', Backup.last);
    Store.log('backup', (reason || 'manual') + ' → ' + res.ok.length);
    return res;
  },
  schedule: function () {
    clearInterval(Backup.timer);
    var b = Store.db.settings.backup; if (!b.auto) return;
    Backup.timer = setInterval(function () { if (Store.db) Backup.run('auto'); }, Math.max(5, +b.every || 30) * 60000);
  },
  // look for newest backup on known folders + every drive (for "it finds it by itself")
  findLatest: function (extraFolders) {
    if (!IS_NW) return null;
    var dirs = [NODE.path.join(Store.dataDir(), 'backups')].concat(extraFolders || []);
    try { var cfg = JSON.parse(localStorage.getItem('ghandi.backupFolders') || '[]'); dirs = dirs.concat(cfg); } catch (e) { }
    // after a fresh Windows: look on every drive — usual folders + one level deep for any folder holding .gbk files
    Backup.allDrives().forEach(function (d) {
      dirs.push(d + '\\Ghandi-Backup', d + '\\Ghandi\\data\\backups', d + '\\Ghandi Home\\data\\backups');
      if (/^C:/i.test(d)) return;
      try { NODE.fs.readdirSync(d + '\\').slice(0, 300).forEach(function (n) { var p = d + '\\' + n; try { if (NODE.fs.statSync(p).isDirectory()) { dirs.push(p); dirs.push(p + '\\Ghandi-Backup'); } } catch (e) { } }); } catch (e) { }
    });
    var best = null;
    dirs.forEach(function (dir) {
      try {
        if (!NODE.fs.existsSync(dir)) return;
        NODE.fs.readdirSync(dir).forEach(function (f) {
          if (!/^ghandi_.*\.gbk$/.test(f)) return;
          var full = NODE.path.join(dir, f), st = NODE.fs.statSync(full);
          if (!best || st.mtimeMs > best.time) best = { file: full, time: st.mtimeMs, size: st.size };
        });
      } catch (e) { }
    });
    return best;
  },
  restoreFrom: function (bufOrText) {
    var o = Backup.unpack(bufOrText);
    Store.db = Store.migrate(o.db); Store.reindex(); Store.saveNow();
    return o;
  }
};

/* ---------- Code 128 barcode (SVG) ---------- */
var Barcode = (function () {
  var P = '212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232'.split(' ');
  var STOP = '2331112';
  function encode(text) {
    text = String(text); var codes = [];
    if (/^\d+$/.test(text) && text.length >= 4 && text.length % 2 === 0) {
      codes.push(105); for (var i = 0; i < text.length; i += 2) codes.push(+text.substr(i, 2));
    } else {
      codes.push(104); for (var j = 0; j < text.length; j++) { var c = text.charCodeAt(j); if (c < 32 || c > 126) c = 63; codes.push(c - 32); }
    }
    var sum = codes[0]; for (var k = 1; k < codes.length; k++) sum += codes[k] * k;
    codes.push(sum % 103);
    var pat = codes.map(function (c) { return P[c]; }).join('') + STOP;
    return pat;
  }
  function svg(text, opt) {
    opt = opt || {}; var pat = encode(text), mods = 0, i;
    for (i = 0; i < pat.length; i++) mods += +pat[i];
    var quiet = 10, total = mods + quiet * 2, h = opt.height || 50;
    var x = quiet, rects = '';
    for (i = 0; i < pat.length; i++) { var w = +pat[i]; if (i % 2 === 0) rects += '<rect x="' + x + '" y="0" width="' + w + '" height="' + h + '"/>'; x += w; }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:100%;display:block" shape-rendering="crispEdges"><g fill="#000">' + rects + '</g></svg>';
  }
  return { svg: svg, encode: encode };
})();

/* ---------- Excel / CSV ---------- */
var XL = (function () {
  var crcT = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = crcT[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  // minimal STORE zip writer
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    var csize = central.reduce(function (s, a) { return s + a.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function colName(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function xmlEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function writeXlsx(rows, sheetName, rtl) {
    var sd = rows.map(function (r, ri) {
      return '<row r="' + (ri + 1) + '">' + r.map(function (v, ci) {
        var ref = colName(ci) + (ri + 1);
        if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + (ri === 0 ? ' s="1"' : '') + '><v>' + v + '</v></c>';
        return '<c r="' + ref + '" t="inlineStr"' + (ri === 0 ? ' s="1"' : '') + '><is><t>' + xmlEsc(v) + '</t></is></c>';
      }).join('') + '</row>';
    }).join('');
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + xmlEsc(sheetName || 'Sheet1') + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>' },
      { name: 'xl/worksheets/sheet1.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"' + (rtl ? ' rightToLeft="1"' : '') + '/></sheetViews><sheetData>' + sd + '</sheetData></worksheet>' }
    ];
    return zip(files);
  }
  // reader
  function inflate(u8) {
    if (IS_NW) return Promise.resolve(new Uint8Array(NODE.zlib.inflateRawSync(Buffer.from(u8))));
    var ds = new DecompressionStream('deflate-raw'); var s = new Blob([u8]).stream().pipeThrough(ds);
    return new Response(s).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function unzip(buf) {
    var u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), eocd = -1;
    for (var i = u8.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) return Promise.reject(new Error('bad xlsx'));
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), out = {}, jobs = [], dec = new TextDecoder();
    for (var k = 0; k < n; k++) {
      var method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      var name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      var ds = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true), data = u8.subarray(ds, ds + csz);
      (function (name, method, data) { jobs.push((method === 0 ? Promise.resolve(data) : inflate(data)).then(function (d) { out[name] = dec.decode(d); })); })(name, method, data);
      p += 46 + nl + el + cl;
    }
    return Promise.all(jobs).then(function () { return out; });
  }
  function readXlsx(buf) {
    return unzip(buf).then(function (f) {
      var dp = new DOMParser(), ss = [];
      if (f['xl/sharedStrings.xml']) { var sx = dp.parseFromString(f['xl/sharedStrings.xml'], 'application/xml'); Array.prototype.forEach.call(sx.getElementsByTagName('si'), function (si) { ss.push(Array.prototype.map.call(si.getElementsByTagName('t'), function (t) { return t.textContent; }).join('')); }); }
      var sheetName = Object.keys(f).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort()[0];
      var doc = dp.parseFromString(f[sheetName], 'application/xml'), rows = [];
      Array.prototype.forEach.call(doc.getElementsByTagName('row'), function (r) {
        var row = [];
        Array.prototype.forEach.call(r.getElementsByTagName('c'), function (c) {
          var ref = c.getAttribute('r') || '', col = 0, m = ref.match(/^[A-Z]+/);
          if (m) { for (var i = 0; i < m[0].length; i++) col = col * 26 + (m[0].charCodeAt(i) - 64); col--; } else col = row.length;
          var t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], val = '';
          if (t === 's') val = ss[+v.textContent]; else if (t === 'inlineStr') val = (c.getElementsByTagName('t')[0] || {}).textContent || ''; else if (v) val = v.textContent;
          row[col] = val;
        });
        rows.push(row);
      });
      return rows;
    });
  }
  function readCsv(text) {
    text = text.replace(/^﻿/, ''); var rows = [], row = [], cur = '', q = false, sep = (text.split('\n')[0].split(';').length > text.split('\n')[0].split(',').length) ? ';' : ',';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  function writeCsv(rows) { return '﻿' + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n'); }
  return { writeXlsx: writeXlsx, readXlsx: readXlsx, readCsv: readCsv, writeCsv: writeCsv };
})();

/* ---------- file save helper ---------- */
function saveBlob(blob, name) {
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

/* ---------- printing ---------- */
var Desk = { // desktop helpers (Electron / NW.js)
  openFolder: function (p) { if (IS_ELECTRON) return require('electron').shell.openPath(p); nw.Shell.openItem(p); },
  copy: function (t) { if (IS_ELECTRON) return require('electron').clipboard.writeText(t); nw.Clipboard.get().set(t, 'text'); },
  pickDir: function (cb) { if (IS_ELECTRON) return IPC.invoke('pickDir').then(function (p) { if (p) cb(p); }); var i = document.createElement('input'); i.type = 'file'; i.setAttribute('nwdirectory', ''); i.onchange = function () { if (i.value) cb(i.value); }; i.click(); }
};
var Printer = {
  list: function () {
    return new Promise(function (res) {
      if (!IS_NW) return res([]);
      if (IS_ELECTRON) return IPC.invoke('printers').then(res, function () { res([]); });
      try { nw.Window.get().getPrinters(function (ps) { res((ps || []).map(function (p) { return p.deviceName || p.printerName || p.name; })); }); } catch (e) { res([]); }
    });
  },
  // css: page css (size), body: html
  print: function (html, opt) {
    opt = opt || {};
    var doc = '<!doctype html><html dir="' + (opt.dir || 'rtl') + '"><head><meta charset="utf-8"><style>' + (opt.css || '') + '</style></head><body>' + html + '</body></html>';
    if (IS_ELECTRON) {
      var ms = opt.mediaSize ? { width: opt.mediaSize.width_microns, height: opt.mediaSize.height_microns } : null;
      IPC.invoke('print', { html: doc, printer: opt.printer || '', silent: !!opt.silent, copies: opt.copies || 1, pageSize: ms, scale: U.n(opt.scale) || 0, forcePage: !!opt.forcePage, pageName: !ms ? ((/@page\{size:(A4|A5|letter)/i.exec(opt.css || '') || [])[1] || '') : '' }).then(function (r) { if (r && !r.ok && r.error && r.error !== 'cancelled') toast(L('الطباعة: ', 'Print: ') + r.error, 'bad'); });
      return;
    }
    if (IS_NW) {
      nw.Window.open('print.html', { show: false, width: 400, height: 600 }, function (w) {
        w.on('loaded', function () {
          w.window.document.open(); w.window.document.write(doc); w.window.document.close();
          setTimeout(function () {
            var o = { autoprint: !!opt.silent, headerFooterEnabled: false, shouldPrintBackgrounds: true, marginsType: 1, copies: opt.copies || 1 };
            if (opt.printer) o.printer = opt.printer;
            if (opt.mediaSize) o.mediaSize = opt.mediaSize;
            try { w.print(o); } catch (e) { w.window.print(); }
            setTimeout(function () { w.close(true); }, 4000);
          }, 250);
        });
      });
      return;
    }
    var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px';
    document.body.appendChild(f); f.contentDocument.open(); f.contentDocument.write(doc); f.contentDocument.close();
    setTimeout(function () { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(function () { f.remove(); }, 2000); }, 300);
  }
};
