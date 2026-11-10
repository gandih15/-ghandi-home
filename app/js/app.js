/* Ghandi Home — application shell, gates, dashboard, POS */
'use strict';
var App = { user: null, view: 'dashboard', shift: null, cart: null, lastActivity: Date.now(), demo: false };
var Views = {};
function S() { return Store.db.settings; }
function lang() { return Store.db ? S().lang : (localStorage.getItem('ghandi.lang') || 'ar'); }
function L(ar, en) { return lang() === 'en' ? en : ar; }
function can(p) { return !!App.user && (App.user.role === 'admin' || !!(App.user.perms || {})[p]); }
function cur() { return lang() === 'en' ? S().currencyEn : S().currency; }
function M(v) { return '<span class="num">' + U.money(v) + '</span> <small class="muted">' + cur() + '</small>'; }
function tierName(i) { var t = S().tiers[i] || S().tiers[0]; return lang() === 'en' ? t[1] : t[0]; }
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function pname(p) { return (lang() === 'en' && p.nameEn) ? p.nameEn : p.name; }
function priceOf(p, tier) { var v = U.n((p.prices || [])[tier]); return v > 0 ? v : U.n((p.prices || [])[0]); }

/* ---------- icons ---------- */
var IC = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  pos: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 20h10M12 16v4"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
  barcode: '<path d="M4 5v14M7 5v14M11 5v14M14 5v14M18 5v14M20 5v14"/>',
  clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12l2 2 4-4"/>',
  truck: '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4.3 1.6 5 4"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  print: '<path d="M6 9V3h12v6M6 17H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>',
  save: '<path d="M5 3h11l5 5v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M7 3v6h9M7 21v-7h10v7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>', down: '<path d="M12 5v14M5 12l7 7 7-7"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  moon: '<path d="M20 15A8 8 0 1 1 9 4a6 6 0 0 0 11 11z"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>', pause: '<path d="M9 5v14M15 5v14"/>', ret: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  usb: '<path d="M12 2v14M8 6l4-4 4 4M7 12v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><circle cx="12" cy="19" r="3"/>', tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17v.5"/>', gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z"/>'
};
function ic(n, s) { return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (s ? ' style="width:' + s + 'px;height:' + s + 'px"' : '') + '>' + (IC[n] || '') + '</svg>'; }

/* ---------- modal & toast ---------- */
var Modal = {
  open: function (o) {
    var m = document.createElement('div'); m.className = 'mask';
    m.innerHTML = '<div class="modal ' + (o.size || '') + '"><div class="mh"><h2>' + o.title + '</h2><button class="btn ghost sm" data-x>' + ic('x') + '</button></div><div class="mb">' + o.body + '</div>' + (o.foot ? '<div class="mf">' + o.foot + '</div>' : '') + '</div>';
    document.body.appendChild(m);
    m.querySelector('[data-x]').onclick = function () { Modal.close(m); };
    m.addEventListener('mousedown', function (e) { if (e.target === m && !o.sticky) Modal.close(m); });
    if (o.mount) o.mount(m);
    var f = m.querySelector('[autofocus]'); if (f) setTimeout(function () { f.focus(); f.select && f.select(); }, 30);
    return m;
  },
  close: function (m) { (m || $$('.mask').pop()) && (m || $$('.mask').pop()).remove(); },
  confirm: function (msg, yes) {
    var m = Modal.open({ title: L('تأكيد', 'Confirm'), body: '<p style="font-size:15px;line-height:1.8">' + msg + '</p>', foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri" data-y>' + L('تأكيد', 'Confirm') + '</button>' });
    m.querySelector('[data-n]').onclick = function () { Modal.close(m); };
    m.querySelector('[data-y]').onclick = function () { Modal.close(m); yes(); };
  },
  prompt: function (title, label, val, cb, type) {
    var m = Modal.open({ title: title, body: '<label class="f">' + label + '<input class="in" autofocus type="' + (type || 'text') + '" value="' + U.esc(val || '') + '"></label>', foot: '<button class="btn pri" data-y>' + L('حفظ', 'OK') + '</button>' });
    var go = function () { var v = m.querySelector('input').value; Modal.close(m); cb(v); };
    m.querySelector('[data-y]').onclick = go; m.querySelector('input').onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }
};
function toast(msg, type) {
  var b = $('#toasts'); if (!b) { b = document.createElement('div'); b.id = 'toasts'; document.body.appendChild(b); }
  var t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; b.appendChild(t);
  setTimeout(function () { t.style.opacity = 0; t.style.transition = '.3s'; setTimeout(function () { t.remove(); }, 300); }, 2600);
}
function beep(ok) {
  try { var c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = ok ? 1250 : 260; g.gain.value = .05; o.start(); o.stop(c.currentTime + (ok ? .07 : .25)); } catch (e) { }
}

/* ---------- theme/lang ---------- */
function applyLook() {
  var l = lang(); document.documentElement.lang = l; document.documentElement.dir = l === 'en' ? 'ltr' : 'rtl';
  var sk = Store.db ? (S().skin || 'classic') : (localStorage.getItem('ghandi.skin') || 'velvet'), de = document.documentElement;
  de.setAttribute('data-skin', sk); if (sk === 'classic') de.removeAttribute('data-kit'); else de.setAttribute('data-kit', ''); if (/^(sapphire|emerald|graphite|mocha|midnight|lavender|peach|fuchsia|cotton|mint|glitter|kawaii|rosegold|holo|blossom)$/.test(sk)) de.setAttribute('data-nskin', ''); else de.removeAttribute('data-nskin'); if (/^(glitter|kawaii|rosegold|holo|blossom)$/.test(sk)) de.setAttribute('data-fancy', ''); else de.removeAttribute('data-fancy');
  de.setAttribute('data-theme', sk === 'classic' ? (Store.db ? S().theme : 'light') : (SKIN_THEME[sk] || 'dark'));
  try { localStorage.setItem('ghandi.skin', sk); } catch (e) { }
  document.title = L('غاندي — نظام نقاط البيع', 'Ghandi Home');
}

/* ================= BOOT ================= */
function boot() {
  var q = location.search; App.demo = !IS_NW && /demo/.test(q);
  var st = Store.load();
  if (App.demo && (st !== 'ok' || /reset/.test(q))) { Store.init(); return Demo.seed().then(function () { afterLoad(); }); }
  if (st === 'ok' || st === 'recovered') return afterLoad(st === 'recovered');
  var found = Backup.findLatest();
  if (found) {
    applyLook();
    var m = Modal.open({ sticky: true, title: L('تم العثور على نسخة احتياطية', 'Backup found'), body: '<p style="line-height:1.9">' + (st === 'corrupt' ? L('ملف البيانات تالف. ', 'The data file is damaged. ') : L('لا توجد بيانات على هذا الجهاز. ', 'No data on this device. ')) + L('وجدنا أحدث نسخة احتياطية:', 'We found the latest backup:') + '</p><div class="fp" style="font-size:13px;letter-spacing:0">' + U.esc(found.file) + '<br>' + U.dt(found.time) + '</div>', foot: '<button class="btn" data-new>' + L('بدء بيانات جديدة', 'Start fresh') + '</button><button class="btn pri" data-r>' + L('استرجاع النسخة', 'Restore it') + '</button>' });
    m.querySelector('[data-r]').onclick = function () { try { Backup.restoreFrom(NODE.fs.readFileSync(found.file)); Modal.close(m); toast(L('تم الاسترجاع بنجاح', 'Restored'), 'ok'); afterLoad(); } catch (e) { toast(e.message, 'bad'); } };
    m.querySelector('[data-new]').onclick = function () { Modal.close(m); freshStart(); };
    return;
  }
  freshStart();
}
function freshStart() {
  Store.init();
  Sec.hash('1234').then(function (h) {
    Store.db.users.push({ id: U.id(), username: 'admin', name: L('المدير', 'Administrator'), role: 'admin', salt: h.salt, hash: h.hash, perms: allPerms(true), active: true, mustChange: true });
    Store.saveNow(); afterLoad();
  });
}
function afterLoad(recovered) {
  applyLook();
  try { localStorage.setItem('ghandi.backupFolders', JSON.stringify(Backup.slotPaths())); } catch (e) { }
  if (recovered) toast(L('تم استرجاع آخر نسخة سليمة من البيانات', 'Recovered last good data copy'), 'ok');
  if (App.demo) return Gate.login();
  License.check().then(function (r) { if (r.ok) { Shop.syncFromLicense(r.payload); Gate.login(); } else Gate.activate(r); });
}

/* ================= GATES ================= */
var Gate = {
  art: function () {
    var c = LoginTexts.get();
    return '<div class="art"><div style="position:relative;z-index:1"><div class="logo" style="width:58px;height:58px;font-size:28px;margin-bottom:26px">' + U.esc((c.title || 'G').charAt(0)) + '</div><h1>' + U.esc(c.title) + '</h1><p>' + U.esc(c.tagline) + '</p></div>' +
      '<div class="feat">' + c.feats.filter(function (f) { return f.on !== false && f.t; }).map(function (f) { return '<div>' + (f.e ? U.esc(f.e) + ' ' : '✦ ') + U.esc(f.t) + '</div>'; }).join('') + '</div>' +
      (c.showDev !== false ? '<div class="devcard"><div class="avatar" style="background:linear-gradient(135deg,var(--gold2),var(--gold));color:#2a1024">' + ic('star', 18) + '</div><div><b>' + L(APP.dev, APP.devEn) + '</b><div class="num" style="opacity:.8;font-size:13px">' + APP.phone + '</div></div></div>' : '<div></div>') + '</div>';
  },
  activate: function (r) {
    applyLook();
    License.fingerprint().then(function (fp) {
      var why = { none: '', sig: L('كود التفعيل غير صحيح', 'Invalid activation key'), device: L('الكود لا يخص هذا الجهاز', 'This key belongs to another device'), expired: L('انتهت مدة الترخيص', 'License expired'), clock: L('تم اكتشاف تغيير في تاريخ الجهاز', 'System clock tampering detected'), format: L('صيغة الكود غير صحيحة', 'Malformed key') }[r.why] || '';
      var g = document.createElement('div'); g.className = 'gate'; g.id = 'gate';
      g.innerHTML = Gate.art() + '<div class="form"><div class="box col" style="gap:14px"><div>' + '<span class="chip warn"><span class="dot"></span>' + L('النسخة غير مفعّلة', 'Not activated') + '</span><h2 style="margin-top:12px">' + L('تفعيل البرنامج', 'Activate Ghandi') + '</h2><div class="muted">' + L('أرسل بصمة الجهاز للمطوّر لاستلام كود التفعيل', 'Send this device ID to the developer to get your key') + '</div></div>' +
        '<label class="f">' + L('بصمة الجهاز', 'Device ID') + '<div class="fp" id="fp">' + fp + '</div></label><button class="btn sm" id="cp" style="align-self:flex-start">' + L('نسخ البصمة', 'Copy ID') + '</button>' +
        '<label class="f">' + L('كود التفعيل', 'Activation key') + '<input class="in num" id="key" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" style="font-family:Consolas,monospace;direction:ltr;font-size:22px;letter-spacing:2px;text-align:center;text-transform:uppercase"></label>' +
        (why ? '<div class="chip bad" style="white-space:normal">' + why + '</div>' : '') +
        '<button class="btn pri lg" id="act">' + ic('shield') + L('تفعيل', 'Activate') + '</button>' +
        '<div class="card" style="padding:12px;text-align:center"><div class="muted small">' + L('للتفعيل والدعم الفني', 'Activation & support') + '</div><b>' + L(APP.dev, APP.devEn) + '</b> — <b class="num">' + APP.phone + '</b></div>' +
        '<button class="btn ghost sm" id="lg">' + ic('globe') + (lang() === 'en' ? 'العربية' : 'English') + '</button></div></div>';
      document.body.appendChild(g);
      $('#cp').onclick = function () { try { (IS_NW ? Desk.copy(fp) : navigator.clipboard.writeText(fp)); toast(L('تم النسخ', 'Copied'), 'ok'); } catch (e) { } };
      $('#lg').onclick = function () { S().lang = lang() === 'en' ? 'ar' : 'en'; Store.saveNow(); g.remove(); Gate.activate(r); };
      $('#act').onclick = function () {
        var k = $('#key').value.trim();
        License.verify(k).then(function (res) {
          if (res.ok) { License.write(k); License.info = res.payload; Shop.syncFromLicense(res.payload); toast(L('تم التفعيل بنجاح ✨', 'Activated ✨'), 'ok'); g.remove(); Gate.login(); }
          else { g.remove(); Gate.activate(res); }
        });
      };
    });
  },
  login: function () {
    applyLook();
    var old = $('#gate'); if (old) old.remove();
    var g = document.createElement('div'); g.className = 'gate'; g.id = 'gate';
    var users = Store.db.users.filter(function (u) { return u.active; });
    g.innerHTML = Gate.art() + '<div class="form"><div class="box col" style="gap:16px"><div>' + (S().shopName || S().shopNameEn ? '<div class="row" style="gap:14px;margin-bottom:6px">' + shopMark(56) + '<div><b style="font-size:19px">' + U.esc(shopName()) + '</b><div class="muted small">' + U.esc(S().slogan || '') + '</div></div></div>' : '') + '<h2>' + L('أهلاً بيك 👋', 'Welcome back 👋') + '</h2></div>' +
      '<label class="f">' + L('المستخدم', 'User') + '<select class="in" id="lu">' + users.map(function (u) { return '<option value="' + u.id + '">' + U.esc(u.name) + ' (' + U.esc(u.username) + ')</option>'; }).join('') + '</select></label>' +
      '<label class="f">' + L('كلمة المرور', 'Password') + '<input class="in" type="password" id="lp" autofocus style="font-size:18px;letter-spacing:3px"></label>' +
      '<button class="btn pri lg" id="lb">' + L('دخول', 'Sign in') + '</button>' +
      '<div class="row" style="justify-content:space-between"><button class="btn ghost sm" id="lg">' + ic('globe') + (lang() === 'en' ? 'العربية' : 'English') + '</button><span class="muted small">' + (License.info ? L('مفعّل لـ: ', 'Licensed to: ') + U.esc(License.info.n || S().shopName || '') : (App.demo ? L('نسخة عرض', 'Demo mode') : '')) + '</span></div>' +
      '<div class="muted small" style="text-align:center">' + L('برمجة وتطوير', 'Developed by') + ' <b>' + L(APP.dev, APP.devEn) + '</b> · <span class="num">' + APP.phone + '</span></div></div></div>';
    document.body.appendChild(g);
    setTimeout(function () { $('#lp').focus(); }, 50);
    var go = function () {
      var u = Store.db.users.filter(function (x) { return x.id === $('#lu').value; })[0];
      Sec.verify($('#lp').value, u).then(function (ok) {
        if (!ok) { beep(false); toast(L('كلمة المرور غير صحيحة', 'Wrong password'), 'bad'); Store.log('login.fail', u.username); return; }
        App.user = u; Store.log('login', u.username); Store.save(); g.remove(); Shell.start();
        if (u.mustChange && !App.demo) setTimeout(function () { Views.users.changePw(u, true); }, 400);
      });
    };
    $('#lb').onclick = go; $('#lp').onkeydown = function (e) { if (e.key === 'Enter') go(); };
    $('#lg').onclick = function () { S().lang = lang() === 'en' ? 'ar' : 'en'; Store.save(); Gate.login(); };
  }
};

/* ================= SHELL ================= */
var NAV = [
  ['dashboard', 'home', 'الرئيسية', 'Dashboard', null],
  ['pos', 'pos', 'نقطة البيع', 'Point of Sale', 'pos.sell'],
  ['sales', 'receipt', 'الفواتير والمرتجع', 'Invoices & Returns', 'sales.history'],
  ['sep', '', 'المخزن', 'Inventory'],
  ['products', 'box', 'الأصناف', 'Products', 'products.view'],
  ['labels', 'barcode', 'طباعة الباركود', 'Barcode labels', 'labels'],
  ['count', 'clip', 'الجرد', 'Stock count', 'stock.count'],
  ['purchases', 'truck', 'استلام الأصناف', 'Goods receiving', 'purchases'],
  ['prices', 'tag', 'تعديل الأسعار', 'Price editing', 'products.editPrice'],
  ['promos', 'gift', 'العروض والخصومات', 'Offers & discounts', 'promos'],
  ['sep', '', 'الحسابات', 'Accounts'],
  ['customers', 'users', 'العملاء والنقاط', 'Customers & points', 'customers'],
  ['layaway', 'clip', 'الحجوزات بعربون', 'Layaways', 'layaway'],
  ['coupons', 'gift', 'الكوبونات وكروت الهدايا', 'Coupons & gift cards', 'coupons'],
  ['suppliers', 'truck', 'الموردين', 'Suppliers', 'suppliers'],
  ['expenses', 'wallet', 'المصروفات', 'Expenses', 'expenses'],
  ['shifts', 'clock', 'الورديات', 'Shifts', '__shifts'],
  ['reports', 'chart', 'التقارير', 'Reports', 'reports'],
  ['sep', '', 'الإدارة', 'Admin'],
  ['users', 'shield', 'المستخدمين والصلاحيات', 'Users & permissions', 'users'],
  ['shop', 'home', 'بيانات المحل', 'Shop profile', 'settings'],
  ['invoice', 'print', 'تصميم الفاتورة', 'Invoice designer', 'invoiceDesign'],
  ['backup', 'save', 'النسخ الاحتياطي', 'Backup', 'backup'],
  ['settings', 'gear', 'الإعدادات', 'Settings', 'settings'],
  ['about', 'info', 'التفعيل والدعم', 'License & support', null],
  ['dev', 'shield', 'لوحة المطوّر', 'Developer panel', '__dev']
];
function navAllowed(n) { if (n[4] === '__dev') return !!Dev.unlocked; if (n[4] === '__shifts') return shiftsOn(); if (!n[4]) return true; return n[4].split('|').some(can); }
var Shell = {
  brandHTML: function () { return shopMark(42) + '<div style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;font-size:16px">' + U.esc(shopName()) + '</b><small>' + L('غاندي للأدوات المنزلية', 'Ghandi Home') + ' v' + APP.version + '</small></div>'; },
  start: function () {
    App.shift = Store.db.shifts.filter(function (s) { return s.user === App.user.id && !s.closeAt; })[0] || null;
    Shell.render(); Backup.schedule();
    var first = can('pos.sell') && App.user.role !== 'admin' ? 'pos' : 'dashboard';
    if (App.user.role === 'admin' && Shop.needsSetup()) first = 'shop';
    go(App.demoView || first);
    clearInterval(Shell.clock); Shell.clock = setInterval(Shell.tick, 15000);
  },
  render: function () {
    applyLook();
    var nav = NAV.filter(function (n) { return n[0] === 'sep' || navAllowed(n); }).map(function (n) {
      if (n[0] === 'sep') return '<div class="navsep">' + L(n[2], n[3]) + '</div>';
      return '<button class="nav" data-go="' + n[0] + '" title="' + U.esc(L(n[2], n[3])) + '">' + (kit() ? navGem(n[0], n[1]) : ic(n[1])) + '<span>' + L(n[2], n[3]) + '</span></button>';
    }).join('');
    $('#app').innerHTML = '<aside class="side"><div class="brand">' + Shell.brandHTML() + '</div>' + nav +
      '<div class="sidefoot">' + L('برمجة', 'By') + ' <b style="color:var(--gold2)">' + L(APP.dev, APP.devEn) + '</b><br><span class="num">' + APP.phone + '</span></div></aside>' +
      '<div class="main"><header class="top"><h1 id="vt"></h1><div class="grow"></div><span id="shiftChip"></span><span class="chip" id="clk"></span>' +
      '<button class="btn ghost sm" id="tLang" title="Language">' + ic('globe') + (lang() === 'en' ? 'ع' : 'EN') + '</button><button class="btn ghost sm" id="tTheme" title="' + L('الثيم', 'Theme') + '">' + (kit() ? '<span style="font-size:17px">🎨</span>' : ic('moon')) + '</button><button class="btn ghost sm" id="tLock" title="Lock">' + ic('lock') + '</button>' +
      '<div class="row" style="gap:8px"><div class="avatar">' + U.esc(App.user.name.charAt(0)) + '</div><div style="line-height:1.2"><b style="font-size:13px">' + U.esc(App.user.name) + '</b><div class="muted small">' + (App.user.role === 'admin' ? L('مدير', 'Admin') : L('موظف', 'Staff')) + '</div></div></div>' +
      '<button class="btn ghost sm" id="tOut" title="' + L('تبديل المستخدم', 'Switch user') + '">' + ic('logout') + '</button><button class="btn ghost sm" id="tExit" title="' + L('خروج من البرنامج', 'Exit program') + '" style="color:var(--bad)">⏻</button></header><section class="view" id="view"></section></div>';
    $$('[data-go]').forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; });
    $('#tLang').onclick = function () { S().lang = lang() === 'en' ? 'ar' : 'en'; Store.save(); Shell.render(); go(App.view); };
    $('#tTheme').onclick = function () { Themes.picker(); };
    $('#tLock').onclick = Shell.lock;
    $('#tExit').onclick = function () { Modal.confirm(L('خروج من البرنامج؟ هيتعمل نسخة احتياطية الأول.', 'Exit the program? A backup will be made first.'), function () { if (IS_ELECTRON) window.close(); else Closing.run(); }); };
    $('#tOut').onclick = function () { Store.saveNow(); App.user = null; Dev.unlocked = false; Gate.login(); };
    Shell.tick();
  },
  tick: function () {
    var c = $('#clk'); if (c) { var d = new Date(); c.innerHTML = ic('clock', 14) + '<span class="num">' + U.pad(d.getHours(), 2) + ':' + U.pad(d.getMinutes(), 2) + '</span>'; }
    var s = $('#shiftChip'); if (s && !shiftsOn()) s.innerHTML = ''; else if (s) s.innerHTML = App.shift ? '<span class="chip ok"><span class="dot"></span>' + L('وردية مفتوحة #', 'Shift #') + App.shift.no + '</span>' : '<span class="chip warn"><span class="dot"></span>' + L('لا توجد وردية', 'No open shift') + '</span>';
    var lm = +S().lockMinutes; if (lm && App.user && Date.now() - App.lastActivity > lm * 60000 && !$('.lock')) Shell.lock();
  },
  lock: function () {
    var l = document.createElement('div'); l.className = 'lock';
    l.innerHTML = '<div class="card col" style="width:340px;text-align:center"><div class="logo" style="margin:0 auto">G</div><h3 style="justify-content:center">' + L('الشاشة مقفلة', 'Screen locked') + '</h3><div class="muted">' + U.esc(App.user.name) + '</div><input class="in" type="password" placeholder="' + L('كلمة المرور', 'Password') + '"><button class="btn pri">' + L('فتح', 'Unlock') + '</button></div>';
    document.body.appendChild(l); var i = l.querySelector('input'); i.focus();
    var u = function () { Sec.verify(i.value, App.user).then(function (ok) { if (ok) { l.remove(); App.lastActivity = Date.now(); } else { beep(false); i.value = ''; } }); };
    l.querySelector('button').onclick = u; i.onkeydown = function (e) { if (e.key === 'Enter') u(); };
  }
};
function go(v) {
  var n = NAV.filter(function (x) { return x[0] === v; })[0];
  if (!n || !navAllowed(n)) { v = 'dashboard'; n = NAV[0]; }
  App.view = v; $$('.nav').forEach(function (b) { b.classList.toggle('on', b.dataset.go === v); });
  $('#vt').innerHTML = (kit() ? navGem(v, n[1]) : '') + U.esc(L(n[2], n[3]));
  var el = $('#view'); el.innerHTML = ''; el.style.padding = v === 'pos' ? '14px' : '';
  (Views[v] && Views[v].render ? Views[v].render : Views[v])(el);
}
['mousemove', 'keydown', 'mousedown'].forEach(function (e) { document.addEventListener(e, function () { App.lastActivity = Date.now(); }, true); });

/* ================= DASHBOARD ================= */
function salesIn(from, to) { return Store.db.sales.filter(function (s) { return !s.void && s.date >= from && s.date < to; }); }
function sumSales(list) {
  var r = { total: 0, profit: 0, count: 0, items: 0, ret: 0 };
  list.forEach(function (s) {
    var sign = s.type === 'return' ? -1 : 1; r.total += sign * s.total; if (s.type === 'return') r.ret += s.total; else r.count++;
    s.items.forEach(function (i) { r.items += sign * i.qty; r.profit += sign * (i.qty * (i.price - i.cost)); });
    r.profit -= sign * (s.discount || 0);
  });
  return r;
}
function dayStart(d) { d = d ? new Date(d) : new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
Views.dashboard = function (el) {
  var t0 = dayStart(), today = sumSales(salesIn(t0, t0 + 864e5)), yest = sumSales(salesIn(t0 - 864e5, t0));
  var m0 = new Date(); m0.setDate(1); m0 = dayStart(m0); var month = sumSales(salesIn(m0, Date.now() + 1));
  var low = Store.db.products.filter(function (p) { return p.active !== false && U.n(p.stock) <= U.n(p.minStock); });
  var expD = Date.now() + S().expiryAlertDays * 864e5;
  var exp = Store.db.products.filter(function (p) { return p.expiry && new Date(p.expiry).getTime() < expD; });
  var stockVal = Store.db.products.reduce(function (s, p) { return s + Math.max(0, ownQty(p)) * U.n(p.cost); }, 0);
  var diff = yest.total ? Math.round((today.total - yest.total) / yest.total * 100) : 0;
  var kp = function (cls, icn, l, v, sub) { return '<div class="card kpi ' + cls + '"><div class="ic">' + ic(icn) + '</div><div class="l">' + l + '</div><div class="v">' + v + '</div><div class="small" style="margin-top:4px;opacity:.8">' + (sub || '') + '</div></div>'; };
  // last 14 days
  var days = []; for (var i = 13; i >= 0; i--) { var a = t0 - i * 864e5; days.push({ d: new Date(a), v: sumSales(salesIn(a, a + 864e5)).total }); }
  var top = {}; salesIn(t0 - 29 * 864e5, Date.now() + 1).forEach(function (s) { if (s.type === 'return') return; s.items.forEach(function (i) { top[i.pid] = top[i.pid] || { n: i.name, q: 0, v: 0 }; top[i.pid].q += i.qty; top[i.pid].v += i.qty * i.price; }); });
  top = Object.keys(top).map(function (k) { return top[k]; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
  var mx = top.length ? top[0].v : 1;
  el.innerHTML = '<div class="grid g4">' +
    kp('hero', 'pos', L('مبيعات اليوم', 'Today\'s sales'), M(today.total), (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff) + '% ' + L('عن أمس', 'vs yesterday')) +
    kp('', 'receipt', L('عدد الفواتير اليوم', 'Invoices today'), '<span class="num">' + today.count + '</span>', today.items + ' ' + L('قطعة مباعة', 'items sold')) +
    (can('reports.profit') ? kp('', 'chart', L('أرباح الشهر', 'Profit this month'), M(month.profit), L('مبيعات الشهر: ', 'Month sales: ') + U.money(month.total)) : kp('', 'chart', L('مبيعات الشهر', 'Month sales'), M(month.total), '')) +
    (can('products.viewCost') ? kp('', 'box', L('قيمة المخزون (تكلفة)', 'Stock value (cost)'), M(stockVal), Store.db.products.length + ' ' + L('صنف', 'products')) : kp('', 'box', L('عدد الأصناف', 'Products'), Store.db.products.length, '')) +
    '</div><div class="grid" style="grid-template-columns:1.7fr 1fr;margin-top:14px"><div class="card"><h3>' + ic('chart', 18) + L('المبيعات — آخر 14 يوم', 'Sales — last 14 days') + '</h3><canvas class="chart" id="ch"></canvas></div>' +
    '<div class="card"><h3>' + ic('star', 18) + L('الأكثر مبيعاً (30 يوم)', 'Top sellers (30 days)') + '</h3>' + (top.length ? top.map(function (t) { return '<div style="margin-bottom:11px"><div class="row" style="justify-content:space-between"><b class="small">' + U.esc(t.n) + '</b><span class="small muted num">' + U.money(t.v) + '</span></div><div class="bar" style="margin-top:5px"><i style="width:' + Math.max(4, t.v / mx * 100) + '%"></i></div></div>'; }).join('') : '<div class="empty">—</div>') + '</div></div>' +
    '<div class="grid g2" style="margin-top:14px"><div class="card"><h3>' + ic('warn', 18) + L('نواقص (أقل من حد الطلب)', 'Low stock') + ' <span class="chip bad">' + low.length + '</span></h3>' + listRows(low.slice(0, 7), function (p) { return '<span class="chip bad num">' + U.n(p.stock) + '</span>'; }) + '</div>' +
    '<div class="card"><h3>' + ic('clock', 18) + L('قرب انتهاء الصلاحية', 'Expiring soon') + ' <span class="chip warn">' + exp.length + '</span></h3>' + listRows(exp.slice(0, 7), function (p) { return '<span class="chip warn num">' + p.expiry + '</span>'; }) + '</div></div>';
  drawBars($('#ch'), days.map(function (d) { return d.d.getDate() + '/' + (d.d.getMonth() + 1); }), days.map(function (d) { return d.v; }));
};
function listRows(arr, right) {
  if (!arr.length) return '<div class="empty">' + L('لا يوجد ✓', 'All good ✓') + '</div>';
  return arr.map(function (p) { return '<div class="list-row"><div class="tile-sw" style="width:30px;height:30px;border-radius:9px;background:' + swatch(p) + '"></div><div class="grow"><b class="small">' + U.esc(pname(p)) + '</b><div class="muted small">' + U.esc(p.cat || '') + (p.shade ? ' · ' + U.esc(p.shade) : '') + '</div></div>' + right(p) + '</div>'; }).join('');
}
var SWATCHES = [['#e8a0b4', '#a23f76'], ['#f0c5a8', '#c8956d'], ['#c9a7e0', '#6b3fa0'], ['#f4b6a6', '#c2554a'], ['#e7cfa0', '#a8724e'], ['#b7d3e8', '#3f6fa0'], ['#d9b2c8', '#7a2d5a'], ['#f2d1c9', '#b5655c'], ['#c4e0d0', '#3f8a6a'], ['#e0c2a8', '#8a5a3c']];
function swatch(p) { var h = 0, s = (p.name || '') + (p.cat || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; var c = SWATCHES[h % SWATCHES.length]; return 'linear-gradient(135deg,' + c[0] + ',' + c[1] + ')'; }
function drawBars(cv, labels, vals) {
  if (!cv) return; var r = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight; cv.width = W * r; cv.height = H * r;
  var c = cv.getContext('2d'); c.scale(r, r); var css = getComputedStyle(document.documentElement);
  var mx = Math.max.apply(null, vals.concat([1])), pad = 28, bw = (W - pad * 2) / vals.length;
  c.font = '11px ' + css.getPropertyValue('--font'); c.fillStyle = css.getPropertyValue('--muted');
  for (var g = 0; g <= 4; g++) { var y = H - 24 - (H - 40) * g / 4; c.strokeStyle = css.getPropertyValue('--line'); c.beginPath(); c.moveTo(pad, y); c.lineTo(W - 6, y); c.stroke(); }
  vals.forEach(function (v, i) {
    var h = (H - 40) * v / mx, x = pad + i * bw + bw * .18, y = H - 24 - h;
    var gr = c.createLinearGradient(0, y, 0, H - 24); gr.addColorStop(0, css.getPropertyValue('--brand2').trim()); gr.addColorStop(1, css.getPropertyValue('--gold').trim());
    c.fillStyle = gr; var w = bw * .64, rr = Math.min(6, w / 2, h);
    c.beginPath(); c.moveTo(x, H - 24); c.lineTo(x, y + rr); c.quadraticCurveTo(x, y, x + rr, y); c.lineTo(x + w - rr, y); c.quadraticCurveTo(x + w, y, x + w, y + rr); c.lineTo(x + w, H - 24); c.fill();
    c.fillStyle = css.getPropertyValue('--muted'); c.textAlign = 'center'; c.fillText(labels[i], x + w / 2, H - 8);
  });
}

/* ================= POS ================= */
function newCart() { return { items: [], tier: S().defaultTier || 0, customer: '', disc: 0, discType: 'v', sel: -1 }; }
Views.pos = {
  cat: '', q: '',
  render: function (el) {
    if (!App.cart) App.cart = newCart();
    if (shiftsOn() && !App.shift) return Views.shifts.openPrompt(el);
    var cats = S().categories;
    el.innerHTML = '<div class="pos"><div class="pos-left"><div class="scan"><div class="bi">' + ic('barcode') + '</div><input id="scan" placeholder="' + L('امسح الباركود أو ابحث باسم الصنف… (F2)', 'Scan barcode or search product… (F2)') + '" autocomplete="off"><span class="chip">' + Store.db.products.length + ' ' + L('صنف', 'items') + '</span></div>' +
      '<div class="cats"><button data-c="" class="on">' + (kit() ? '✨ ' : '') + L('الكل', 'All') + '</button>' + cats.map(function (c) { return '<button data-c="' + U.esc(c) + '">' + (kit() ? catEmoji(c) + ' ' : '') + U.esc(c) + '</button>'; }).join('') + '</div><div class="tiles" id="tiles"></div></div>' +
      '<div class="cart"><div class="cart-h"><b style="font-size:15px">' + L('فاتورة جديدة', 'New invoice') + ' <span class="muted num">#' + (Store.db.seq.invoice + 1) + '</span></b><div class="grow"></div><button class="pill-tier" id="tier" title="F9">' + tierName(App.cart.tier) + '</button>' + (can('pos.hold') ? '<button class="btn sm" id="held" title="F8">' + ic('pause') + '<span class="num">' + Store.db.held.length + '</span></button>' : '') + '</div>' +
      (typeof CustBox !== 'undefined' ? CustBox.html() : '') +
      '<div class="cart-items" id="items"></div><div class="sum" id="sum"></div><div class="paybar">' +
      '<button class="btn" id="bDisc">' + ic('tag') + L('خصم', 'Discount') + '</button><button class="btn" id="bHold">' + ic('pause') + L('تعليق', 'Hold') + '</button><button class="btn" id="bClear">' + ic('trash') + L('مسح', 'Clear') + '</button>' +
      '<button class="btn pri" id="bPay">' + L('الدفع', 'Pay') + '<span class="kbd">F4</span></button></div></div></div>';
    var P = Views.pos;
    $$('.cats button').forEach(function (b) { b.onclick = function () { $$('.cats button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); P.cat = b.dataset.c; P.tiles(); }; });
    var sc = $('#scan');
    sc.oninput = function () { P.q = sc.value; P.tiles(); };
    sc.onkeydown = function (e) { if (e.key === 'Enter') { P.scan(sc.value); sc.value = ''; P.q = ''; P.tiles(); } };
    if (typeof CustBox !== 'undefined') CustBox.mount(P);
    $('#tier').onclick = P.tierMenu; $('#bPay').onclick = P.pay; $('#bClear').onclick = function () { if (App.cart.items.length) Modal.confirm(L('مسح الفاتورة الحالية؟', 'Clear current invoice?'), function () { App.cart = newCart(); P.render(el); }); };
    $('#bHold').onclick = P.hold; if ($('#held')) $('#held').onclick = P.heldList; $('#bDisc').onclick = P.discount;
    P.tiles(); P.draw(); sc.focus();
    document.onkeydown = function (e) {
      if (App.view !== 'pos' || $('.mask') || $('.lock')) return;
      if (e.key === 'F2') { e.preventDefault(); sc.focus(); } else if (e.key === 'F4') { e.preventDefault(); P.pay(); } else if (e.key === 'F8') { e.preventDefault(); P.hold(); } else if (e.key === 'F9') { e.preventDefault(); P.tierMenu(); }
      else if (e.key === 'Delete' && App.cart.sel >= 0 && document.activeElement === sc && !sc.value) { App.cart.items.splice(App.cart.sel, 1); App.cart.sel = App.cart.items.length - 1; P.draw(); }
      else if ((e.key === '+' || e.key === '-') && document.activeElement === sc && !sc.value && App.cart.sel >= 0) { e.preventDefault(); P.qty(App.cart.sel, e.key === '+' ? 1 : -1); }
      else if (!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && e.key.length === 1) sc.focus();
    };
  },
  tiles: function () {
    var P = Views.pos, q = U.norm(P.q), out = [], all = Store.db.products;
    for (var i = 0; i < all.length && out.length < 60; i++) {
      var p = all[i]; if (p.active === false || U.n(p.stock) <= 0) continue; if (P.cat && p.cat !== P.cat) continue; if (P.sub && p.sub !== P.sub) continue;
      if (q && U.norm(p.name + ' ' + (p.nameEn || '') + ' ' + (p.brand || '') + ' ' + (p.shade || '') + ' ' + p.barcodes.join(' ')).indexOf(q) < 0) continue;
      out.push(p);
    }
    $('#tiles').innerHTML = out.length ? out.map(function (p) { var st = U.n(p.stock); return '<div class="tile" data-id="' + p.id + '"><div class="th">' + (kit() || p.img ? prodGem(p, 'sw8') : '<div class="sw8" style="background:' + swatch(p) + '">' + U.esc(pname(p).charAt(0)) + '</div>') + '<span class="st chip ' + (st <= 0 ? 'bad' : st <= U.n(p.minStock) ? 'warn' : '') + ' num">' + st + '</span></div><div class="nm">' + U.esc(pname(p)) + (p.shade ? ' <span class="muted">· ' + U.esc(p.shade) + '</span>' : '') + '</div>' + (function () { var pr = (Views.pos.price || Promo.price)(p, Views.pos.tileTier ? Views.pos.tileTier() : App.cart.tier); return (pr.promo ? '<span class="ribbon">−' + pr.pct + '%</span>' : '') + '<div class="pr">' + (pr.promo ? '<s class="old num">' + U.money(pr.base) + '</s> ' : '') + M(pr.price) + '</div>'; })() + '</div>'; }).join('') : '<div class="empty">' + L('لا توجد نتائج', 'No results') + '</div>';
    $$('#tiles .tile').forEach(function (t) { t.onclick = function () { P.add(Store.product(t.dataset.id)); $('#scan').focus(); }; });
  },
  scan: function (code) {
    code = String(code || '').trim(); if (!code) return;
    var mult = 1, m = code.match(/^(\d+)\*(.+)$/); if (m) { mult = +m[1]; code = m[2]; }
    var p = Store.byBarcode(code);
    if (!p) { var q = U.norm(code), hits = Store.db.products.filter(function (x) { return U.norm(x.name + ' ' + (x.nameEn || '')).indexOf(q) >= 0; }), live = hits.filter(function (x) { return x.active !== false; }); if (live.length === 1) p = live[0]; else if (!live.length && hits.length) p = hits[0]; }
    if (!p && typeof Trash !== 'undefined') { var del = Trash.init().filter(function (e) { return (e.p.barcodes || []).indexOf(code) >= 0; })[0]; if (del) { beep(false); toast('🗑️ ' + L('الصنف ده محذوف: ', 'This product was deleted: ') + del.p.name, 'bad'); return; } }
    if (!p) { beep(false); toast(L('الصنف غير موجود: ', 'Not found: ') + code, 'bad'); return; }
    Views.pos.add(p, mult);
  },
  add: function (p, qty) {
    qty = qty || 1; var c = App.cart, ex = -1;
    c.items.forEach(function (it, i) { if (it.pid === p.id && !it.manual) ex = i; });
    var inCart = c.items.filter(function (x) { return x.pid === p.id; }).reduce(function (s, x) { return s + x.qty; }, 0);
    if (p.active === false) { beep(false); toast('⏸️ ' + L('الصنف ده موقوف — مش متاح للبيع', 'This product is stopped — not for sale'), 'bad'); return; }
    if (U.n(p.stock) <= 0) { beep(false); toast('📦 ' + L('المنتج غير متوفر في المخزون — خلص', 'Out of stock — none left'), 'bad'); return; }
    if (inCart + qty > U.n(p.stock)) { beep(false); toast(L('الكمية غير متاحة بالمخزن (المتاح ', 'Not enough stock (available ') + U.n(p.stock) + ')', 'bad'); return; }
    if (ex >= 0) c.items[ex].qty += qty; else { var pr = (Views.pos.price || Promo.price)(p, c.tier); c.items.push({ pid: p.id, name: (p.vopt && typeof Variants !== 'undefined' ? Variants.fullName(p) : p.name), qty: qty, price: pr.price, base: pr.base, promo: pr.promo ? pr.promo.name : '', cost: U.n(p.cost), manual: false }); ex = c.items.length - 1; }
    c.sel = ex; beep(true); Views.pos.draw();
  },
  qty: function (i, d, abs) {
    var it = App.cart.items[i], p = Store.product(it.pid), nq = abs != null ? abs : it.qty + d;
    if (nq <= 0) { App.cart.items.splice(i, 1); App.cart.sel = App.cart.items.length - 1; }
    else if (p && nq > U.n(p.stock)) { toast(L('الكمية غير متاحة', 'Not enough stock'), 'bad'); }
    else it.qty = nq;
    Views.pos.draw();
  },
  totals: function () {
    var c = App.cart, sub = c.items.reduce(function (s, i) { return s + i.qty * i.price; }, 0);
    var disc = c.discType === '%' ? sub * U.n(c.disc) / 100 : U.n(c.disc); disc = Math.min(disc, sub);
    var vat = (sub - disc) * U.n(S().vat) / 100;
    var saved = c.items.reduce(function (s, i) { return s + (U.n(i.base) > i.price ? (i.base - i.price) * i.qty : 0); }, 0);
    return { sub: U.r2(sub), disc: U.r2(disc), vat: U.r2(vat), total: U.r2(sub - disc + vat), saved: U.r2(saved), qty: c.items.reduce(function (s, i) { return s + i.qty; }, 0) };
  },
  draw: function () {
    var c = App.cart, P = Views.pos;
    $('#items').innerHTML = c.items.length ? c.items.map(function (it, i) {
      var p = Store.product(it.pid) || {};
      return '<div class="ci ' + (i === c.sel ? 'sel' : '') + '" data-i="' + i + '"><div class="nm">' + U.esc(p.name ? pname(p) : it.name) + (p.shade ? ' <span class="muted small">· ' + U.esc(p.shade) + '</span>' : '') + (it.promo && it.base > it.price ? ' <span class="chip promo">' + ic('gift', 12) + U.esc(it.promo) + '</span>' : '') + '</div><div class="tot num">' + (it.base > it.price ? '<s class="old">' + U.money(it.qty * it.base) + '</s><br>' : '') + U.money(it.qty * it.price) + '</div>' +
        '<div class="row" style="gap:8px"><span class="qty"><button data-m>−</button><input class="num" value="' + it.qty + '"><button data-p>+</button></span><span class="muted small">× </span><span class="small num ' + (it.manual ? '' : 'muted') + '" data-price style="' + (can('pos.priceEdit') ? 'cursor:pointer;text-decoration:underline dotted' : '') + '">' + U.money(it.price) + '</span></div><button class="btn ghost sm" data-del style="padding:4px">' + ic('x', 15) + '</button></div>';
    }).join('') : '<div class="empty" style="padding:60px 20px">' + ic('barcode', 46) + '<div style="margin-top:12px">' + L('امسح باركود أو اختر صنف للبدء', 'Scan a barcode or tap a product') + '</div></div>';
    $$('#items .ci').forEach(function (r) {
      var i = +r.dataset.i;
      r.onclick = function () { c.sel = i; $$('#items .ci').forEach(function (x) { x.classList.toggle('sel', +x.dataset.i === i); }); };
      r.querySelector('[data-m]').onclick = function (e) { e.stopPropagation(); P.qty(i, -1); };
      r.querySelector('[data-p]').onclick = function (e) { e.stopPropagation(); P.qty(i, 1); };
      r.querySelector('input').onchange = function () { P.qty(i, 0, U.n(this.value)); };
      r.querySelector('[data-del]').onclick = function (e) { e.stopPropagation(); c.items.splice(i, 1); c.sel = c.items.length - 1; P.draw(); };
      r.querySelector('[data-price]').onclick = function (e) {
        e.stopPropagation(); if (!can('pos.priceEdit')) return toast(L('ليس لديك صلاحية تعديل السعر', 'No permission to edit price'), 'bad');
        Modal.prompt(L('تعديل السعر', 'Edit price'), U.esc(c.items[i].name), c.items[i].price, function (v) { c.items[i].price = U.n(v); c.items[i].manual = true; Store.log('pos.priceEdit', c.items[i].name + ' → ' + v); P.draw(); }, 'number');
      };
    });
    var t = P.totals();
    $('#sum').innerHTML = '<div class="r"><span>' + L('عدد القطع', 'Items') + '</span><b class="num">' + t.qty + '</b></div><div class="r"><span>' + L('الإجمالي', 'Subtotal') + '</span><span>' + M(t.sub) + '</span></div>' + (t.saved ? '<div class="r" style="color:var(--ok)"><span>' + ic('gift', 13) + ' ' + L('توفير العروض', 'Offer savings') + '</span><span class="num">' + U.money(t.saved) + '</span></div>' : '') + (t.disc ? '<div class="r" style="color:var(--bad)"><span>' + L('الخصم', 'Discount') + '</span><span class="num">− ' + U.money(t.disc) + '</span></div>' : '') + (t.vat ? '<div class="r"><span>' + L('الضريبة', 'VAT') + '</span><span class="num">' + U.money(t.vat) + '</span></div>' : '') +
      '<div class="total"><span style="font-weight:700">' + L('المطلوب', 'Total') + '</span><b class="num">' + U.money(t.total) + ' <small style="font-size:14px">' + cur() + '</small></b></div>';
  },
  setTier: function (t) {
    App.cart.tier = t; App.cart.items.forEach(function (it) { if (!it.manual) { var p = Store.product(it.pid); if (p) { var pr = (Views.pos.price || Promo.price)(p, t); it.price = pr.price; it.base = pr.base; it.promo = pr.promo ? pr.promo.name : ''; } } });
    $('#tier').textContent = tierName(t); Views.pos.draw(); Views.pos.tiles();
  },
  tierMenu: function () {
    if (!can('pos.changeTier')) return toast(L('ليس لديك صلاحية تغيير شريحة السعر', 'No permission to change tier'), 'bad');
    var m = Modal.open({ title: L('شريحة السعر', 'Price tier'), body: '<div class="grid g2">' + S().tiers.map(function (t, i) { return '<button class="btn lg ' + (i === App.cart.tier ? 'pri' : '') + '" data-t="' + i + '">' + tierName(i) + '</button>'; }).join('') + '</div>' });
    $$('[data-t]', m).forEach(function (b) { b.onclick = function () { Modal.close(m); Views.pos.setTier(+b.dataset.t); }; });
  },
  discount: function () {
    if (!can('pos.discount')) return toast(L('ليس لديك صلاحية الخصم', 'No discount permission'), 'bad');
    var c = App.cart, mx = App.user.role === 'admin' ? 100 : U.n(App.user.perms['pos.maxDiscount']);
    var m = Modal.open({ title: L('خصم على الفاتورة', 'Invoice discount'), body: '<div class="row"><div class="seg"><button data-t="v" class="' + (c.discType === 'v' ? 'on' : '') + '">' + cur() + '</button><button data-t="%" class="' + (c.discType === '%' ? 'on' : '') + '">%</button></div><input class="in grow" type="number" autofocus value="' + (c.disc || '') + '"></div><div class="muted small" style="margin-top:8px">' + L('أقصى خصم مسموح: ', 'Max allowed: ') + mx + '%</div>', foot: '<button class="btn pri" data-y>' + L('تطبيق', 'Apply') + '</button>' });
    var tp = c.discType; $$('[data-t]', m).forEach(function (b) { b.onclick = function () { tp = b.dataset.t; $$('[data-t]', m).forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    var ok = function () {
      var v = U.n($('input', m).value), sub = Views.pos.totals().sub, pct = tp === '%' ? v : (sub ? v / sub * 100 : 0);
      if (pct > mx + 1e-9) return toast(L('الخصم أكبر من المسموح لك', 'Discount exceeds your limit'), 'bad');
      c.disc = v; c.discType = tp; Modal.close(m); Views.pos.draw();
    };
    $('[data-y]', m).onclick = ok; $('input', m).onkeydown = function (e) { if (e.key === 'Enter') ok(); };
  },
  hold: function () {
    if (!can('pos.hold') || !App.cart.items.length) return;
    App.cart.at = Date.now(); App.cart.by = App.user.name; Store.db.held.push(App.cart); App.cart = newCart(); Store.save(); toast(L('تم تعليق الفاتورة', 'Invoice held'), 'ok'); go('pos');
  },
  heldList: function () {
    var m = Modal.open({ title: L('الفواتير المعلّقة', 'Held invoices'), body: Store.db.held.length ? Store.db.held.map(function (h, i) { var t = h.items.reduce(function (s, x) { return s + x.qty * x.price; }, 0); return '<div class="list-row"><div class="grow"><b>' + h.items.length + ' ' + L('أصناف', 'items') + ' — ' + M(t) + '</b><div class="muted small">' + U.dt(h.at) + ' · ' + U.esc(h.by) + '</div></div><button class="btn sm pri" data-i="' + i + '">' + L('استرجاع', 'Resume') + '</button></div>'; }).join('') : '<div class="empty">—</div>' });
    $$('[data-i]', m).forEach(function (b) { b.onclick = function () { if (App.cart.items.length) Store.db.held.push(App.cart); App.cart = Store.db.held.splice(+b.dataset.i, 1)[0]; Store.save(); Modal.close(m); go('pos'); }; });
  },
  pay: function () {
    var c = App.cart; if (!c.items.length) return;
    var t = Views.pos.totals(), methods = S().payMethods;
    var m = Modal.open({
      size: 'wide', title: L('إتمام البيع', 'Checkout'), body: '<div class="grid" style="grid-template-columns:1fr 1fr;gap:20px"><div class="col"><div class="card kpi hero"><div class="l">' + L('المطلوب', 'Amount due') + '</div><div class="v num" style="font-size:38px">' + U.money(t.total) + '</div></div>' +
        '<div class="grid g4" id="quick">' + [t.total, Math.ceil(t.total / 50) * 50, Math.ceil(t.total / 100) * 100, Math.ceil(t.total / 200) * 200].filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (v) { return '<button class="btn" data-q="' + v + '">' + U.money(v) + '</button>'; }).join('') + '</div>' +
        '<div class="card" style="padding:12px"><div class="row" style="justify-content:space-between"><span class="muted">' + L('الباقي للعميل', 'Change') + '</span><b class="num" id="chg" style="font-size:22px;color:var(--ok)">0.00</b></div><div class="row" style="justify-content:space-between;margin-top:6px"><span class="muted">' + L('متبقي (آجل)', 'Remaining (credit)') + '</span><b class="num" id="rem" style="color:var(--bad)">0.00</b></div></div></div>' +
        '<div class="col">' + methods.map(function (pm, i) { return '<label class="f">' + (lang() === 'en' ? pm[2] : pm[1]) + '<input class="in num" type="number" data-pm="' + pm[0] + '" ' + (i === 0 ? 'autofocus value="' + t.total + '"' : '') + ' style="font-size:18px"></label>'; }).join('') +
        '<label class="row small"><input type="checkbox" class="sw" id="prn" ' + (localStorage.getItem('ghandi.autoPrint') !== '0' ? 'checked' : '') + '> ' + L('طباعة الفاتورة', 'Print receipt') + '</label></div></div>',
      foot: '<button class="btn" data-x2>' + L('رجوع', 'Back') + '</button><button class="btn pri lg" id="done">' + ic('receipt') + L('تأكيد البيع', 'Complete sale') + ' <span class="kbd">Enter</span></button>'
    });
    var calc = function () {
      var paid = 0, cash = 0; $$('[data-pm]', m).forEach(function (i) { paid += U.n(i.value); if (i.dataset.pm === 'cash') cash = U.n(i.value); });
      var other = paid - cash, needCash = Math.max(0, t.total - other), change = Math.max(0, cash - needCash), rem = Math.max(0, t.total - paid);
      $('#chg', m).textContent = U.money(change); $('#rem', m).textContent = U.money(rem); return { paid: paid, change: change, rem: rem };
    };
    $$('[data-pm]', m).forEach(function (i) { i.oninput = calc; i.onkeydown = function (e) { if (e.key === 'Enter') $('#done', m).click(); }; });
    $$('[data-q]', m).forEach(function (b) { b.onclick = function () { $('[data-pm="cash"]', m).value = b.dataset.q; calc(); }; });
    $('[data-x2]', m).onclick = function () { Modal.close(m); }; calc();
    $('#done', m).onclick = function () {
      var r = calc();
      if (r.rem > 0.009) {
        if (!c.customer) return toast(L('اختر عميل للبيع الآجل', 'Select a customer for credit'), 'bad');
        if (!can('pos.credit')) return toast(L('ليس لديك صلاحية البيع الآجل', 'No credit-sale permission'), 'bad');
      }
      var pays = {}; $$('[data-pm]', m).forEach(function (i) { if (U.n(i.value)) pays[i.dataset.pm] = U.n(i.value); });
      if (pays.cash) pays.cash = U.r2(pays.cash - r.change);
      localStorage.setItem('ghandi.autoPrint', $('#prn', m).checked ? '1' : '0');
      var sale = Sales.create({ type: 'sale', items: c.items, tier: c.tier, customer: c.customer, discount: t.disc, vat: t.vat, subtotal: t.sub, total: t.total, payments: pays, paid: U.r2(r.paid - r.change), change: r.change, credit: r.rem });
      Modal.close(m);
      if ($('#prn', m).checked) Receipt.print(sale);
      App.cart = newCart(); go('pos');
      toast(L('تم البيع ✓ فاتورة #', 'Sale completed ✓ #') + sale.no + (r.change ? ' — ' + L('الباقي ', 'change ') + U.money(r.change) : ''), 'ok');
    };
  }
};

/* ---------- sales engine ---------- */
var Sales = {
  create: function (o) {
    var db = Store.db; db.seq.invoice++;
    var s = { id: U.id(), no: db.seq.invoice, date: Date.now(), type: o.type, user: App.user.id, userName: App.user.name, shift: App.shift ? App.shift.id : '', customer: o.customer || '', tier: o.tier || 0,
      items: o.items.map(function (i) { var r = { pid: i.pid, name: i.name, qty: i.qty, price: U.r2(i.price), cost: U.n(i.cost) }; if (U.n(i.base) > i.price) { r.base = U.r2(i.base); r.promo = i.promo || ''; } return r; }),
      subtotal: o.subtotal, discount: o.discount || 0, vat: o.vat || 0, total: o.total, payments: o.payments || {}, paid: o.paid || 0, change: o.change || 0, credit: o.credit || 0, ref: o.ref || '' };
    var sign = o.type === 'return' ? 1 : -1;
    s.items.forEach(function (i) { Store.move(i.pid, sign * i.qty, o.type, '#' + s.no); });
    if (s.customer) { var c = db.customers.filter(function (x) { return x.id === s.customer; })[0]; if (c) { c.balance = U.r2(U.n(c.balance) + (o.type === 'return' ? -s.credit : s.credit)); c.points = U.n(c.points) + (o.type === 'return' ? 0 : Math.floor(s.total / 100)); } }
    db.sales.push(s); Store.log(o.type, '#' + s.no + ' ' + s.total); Store.save();
    return s;
  }
};

/* ---------- receipt rendering ---------- */
var Receipt = {
  html: function (s, cfg) {
    cfg = cfg || S().invoice; var st = S(), en = lang() === 'en', cust = Store.db.customers.filter(function (c) { return c.id === s.customer; })[0];
    var w = cfg.paper === 'A4' ? '190mm' : cfg.paper === '58' ? '48mm' : '72mm', fs = +cfg.fontSize || 12, a4 = cfg.paper === 'A4';
    var pm = st.payMethods.reduce(function (o, p) { o[p[0]] = en ? p[2] : p[1]; return o; }, {});
    var h = '<div class="rc" style="width:' + w + ';font-size:' + fs + 'px;padding:' + (a4 ? '8mm' : '3mm') + '">';
    if (cfg.showLogo) h += st.logo ? '<div style="text-align:center"><img src="' + st.logo + '" style="max-height:' + (a4 ? 70 : 54) + 'px;max-width:70%"></div>' : '<div style="text-align:center"><div style="display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:' + cfg.accent + ';color:#fff;font-weight:800;font-size:22px">' + U.esc(shopName(en).charAt(0)) + '</div></div>';
    if (cfg.showShop) h += '<div style="text-align:center;font-weight:800;font-size:' + (fs + 5) + 'px;margin-top:4px">' + U.esc(shopName(en)) + '</div>' + (st.slogan ? '<div style="text-align:center;font-size:' + (fs - 1) + 'px;color:#333">' + U.esc(st.slogan) + '</div>' : '');
    if (cfg.header) h += '<div style="text-align:center;margin-top:2px">' + U.esc(cfg.header) + '</div>';
    if (cfg.showAddress && st.shopAddress) h += '<div style="text-align:center;color:#444">' + U.esc(st.shopAddress) + '</div>';
    if (cfg.showPhone && (st.shopPhone || st.shopPhone2)) h += '<div style="text-align:center;color:#444" dir="ltr">☎ ' + U.esc([st.shopPhone, st.shopPhone2].filter(Boolean).join(' / ')) + '</div>';
    if (cfg.showTaxNo && (st.taxNo || st.crNo)) h += '<div style="text-align:center;color:#444;font-size:' + (fs - 2) + 'px">' + [st.taxNo ? (en ? 'Tax no. ' : 'رقم ضريبي ') + U.esc(st.taxNo) : '', st.crNo ? (en ? 'C.R. ' : 'س.ت ') + U.esc(st.crNo) : ''].filter(Boolean).join(' · ') + '</div>';
    h += '<div style="border-top:1.5px dashed #000;margin:6px 0"></div>';
    h += '<div style="display:flex;justify-content:space-between"><b>' + (s.type === 'return' ? (en ? 'RETURN' : 'مرتجع') : (en ? 'Invoice' : 'فاتورة')) + ' #' + s.no + '</b><span dir="ltr">' + U.dt(s.date) + '</span></div>';
    if (cfg.showCashier) h += '<div>' + (en ? 'Cashier: ' : 'الكاشير: ') + U.esc(s.userName) + '</div>';
    if (cfg.showCustomer && cust) h += '<div>' + (en ? 'Customer: ' : 'العميل: ') + U.esc(cust.name) + (cust.phone ? ' — <span dir="ltr">' + U.esc(cust.phone) + '</span>' : '') + '</div>';
    if (cfg.showTier) h += '<div>' + (en ? 'Price list: ' : 'نوع السعر: ') + tierName(s.tier) + '</div>';
    h += '<table style="width:100%;border-collapse:collapse;margin-top:6px"><tr style="border-bottom:1px solid #000;border-top:1px solid #000"><th style="text-align:start;padding:3px 0">' + (en ? 'Item' : 'الصنف') + '</th><th>' + (en ? 'Qty' : 'كمية') + '</th><th>' + (en ? 'Price' : 'سعر') + '</th><th style="text-align:end">' + (en ? 'Total' : 'إجمالي') + '</th></tr>';
    s.items.forEach(function (i) { h += '<tr><td style="padding:3px 0">' + U.esc(i.name) + '</td><td style="text-align:center">' + i.qty + '</td><td style="text-align:center">' + (i.base > i.price ? '<s style="color:#555">' + U.money(i.base) + '</s><br>' : '') + U.money(i.price) + '</td><td style="text-align:end">' + U.money(i.qty * i.price) + '</td></tr>' + (i.base > i.price && i.promo ? '<tr><td colspan="4" style="font-size:' + (fs - 2) + 'px;padding:0 0 3px">★ ' + U.esc(i.promo) + ' (−' + U.money((i.base - i.price) * i.qty) + ')</td></tr>' : ''); });
    h += '</table><div style="border-top:1px solid #000;margin:4px 0"></div>';
    var row = function (a, b, bold) { return '<div style="display:flex;justify-content:space-between;' + (bold ? 'font-weight:800;font-size:' + (fs + 4) + 'px' : '') + '"><span>' + a + '</span><span>' + b + '</span></div>'; };
    h += row(en ? 'Subtotal' : 'الإجمالي', U.money(s.subtotal));
    if (s.discount) h += row(en ? 'Discount' : 'الخصم', '- ' + U.money(s.discount));
    if (s.vat) h += row(en ? 'VAT' : 'الضريبة', U.money(s.vat));
    h += row(en ? 'TOTAL' : 'الصافي', U.money(s.total) + ' ' + (en ? st.currencyEn : st.currency), true);
    Object.keys(s.payments || {}).forEach(function (k) { h += row(pm[k] || k, U.money(s.payments[k])); });
    if (s.change) h += row(en ? 'Change' : 'الباقي', U.money(s.change));
    if (s.credit) h += row(en ? 'On account' : 'آجل', U.money(s.credit));
    var saved = U.n(s.discount) + s.items.reduce(function (a, i) { return a + (i.base > i.price ? (i.base - i.price) * i.qty : 0); }, 0);
    if (cfg.showSaved && saved > 0) h += '<div style="text-align:center;margin-top:5px;padding:3px;border:1px solid #000;border-radius:4px">' + (en ? 'You saved ' : 'وفّرتِ ') + U.money(saved) + ' ' + (en ? st.currencyEn : st.currency) + '</div>';
    if (cfg.showBarcode) h += '<div style="height:34px;margin:8px auto 0;width:75%">' + Barcode.svg('INV' + s.no, { height: 40 }) + '</div>';
    if (cfg.footer) h += '<div style="text-align:center;margin-top:6px;white-space:pre-line">' + U.esc(cfg.footer) + '</div>';
    if (cfg.showSocial && (st.whatsapp || st.facebook || st.instagram)) h += '<div style="text-align:center;margin-top:5px;font-size:' + (fs - 2) + 'px;line-height:1.6" dir="ltr">' + [st.whatsapp ? 'WhatsApp: ' + U.esc(st.whatsapp) : '', st.facebook ? 'Facebook: ' + U.esc(st.facebook) : '', st.instagram ? 'Instagram: ' + U.esc(st.instagram) : ''].filter(Boolean).join('<br>') + '</div>';
    if (cfg.showDev || devS().devLine === 'force') h += '<div style="text-align:center;margin-top:6px;font-size:' + (fs - 3) + 'px;color:#555">Ghandi Home · ' + APP.devEn + ' · ' + APP.phone + '</div>';
    return h + '</div>';
  },
  css: function (cfg) {
    cfg = cfg || S().invoice; var size = cfg.paper === 'A4' ? 'A4' : (cfg.paper === '58' ? '58mm auto' : '80mm auto');
    return '@page{size:' + size + ';margin:0}body{margin:0;font-family:Tahoma,Arial,sans-serif;color:#000}.rc{box-sizing:border-box;line-height:1.45}table td,table th{font-size:inherit}';
  },
  print: function (s) {
    var cfg = S().invoice;
    Printer.print(Receipt.html(s), { css: Receipt.css(), printer: S().printers.invoice, silent: S().printers.silent, copies: +cfg.copies || 1, dir: lang() === 'en' ? 'ltr' : 'rtl' });
  }
};
