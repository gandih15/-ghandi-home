/* Ghandi Home — Developer panel (لوحة المطوّر): only the developer can open it (challenge/answer from the keygen tool).
   Controls things the shop owner must NOT change: sign-in screen texts, backup policy, close behaviour, shift system, developer line on receipts. */
'use strict';
function devS() {
  var d = S().dev = S().dev || {};
  if (d.keep == null) d.keep = 1;                 // copies kept in each backup place (1 = only the newest)
  if (!d.closeMode) d.closeMode = 'overlay';      // overlay = "جاري عمل نسخة…" message | silent
  if (!d.shiftMode) d.shiftMode = 'owner';        // on | off | owner
  if (!d.devLine) d.devLine = 'force';            // force | owner
  return d;
}
function shiftsOn() { var m = devS().shiftMode; return m === 'on' ? true : m === 'off' ? false : S().shiftsEnabled !== false; }

var Dev = {
  unlocked: false,
  askCode: function () {
    var ch = License.devChallenge();
    License.fingerprint().then(function (fp) {
      var m = Modal.open({ title: '🔐 ' + L('لوحة المطوّر', 'Developer panel'), body: '<div class="col"><div class="muted">' + L('اللوحة دي للمطوّر بس. ابعت الرقمين دول للمطوّر علشان يديك كود الفتح:', 'Developer only. Send these two values to the developer to get the unlock code:') + '</div>' +
        '<label class="f">' + L('بصمة الجهاز', 'Device ID') + '<div class="fp">' + fp + '</div></label><label class="f">' + L('رقم الطلب', 'Request number') + '<div class="fp" style="font-size:24px;letter-spacing:4px">' + ch + '</div></label>' +
        '<label class="f">' + L('كود الفتح', 'Unlock code') + '<input class="in num" id="dvA" autofocus placeholder="XXXX-XXXX" style="font-size:20px;text-align:center;letter-spacing:3px;direction:ltr"></label></div>',
        foot: '<button class="btn pri" id="dvGo">' + L('فتح', 'Unlock') + '</button>' });
      var go2 = function () { License.devCheck(ch, $('#dvA', m).value).then(function (ok) { if (!ok) { beep(false); return toast(L('كود الفتح غلط', 'Wrong unlock code'), 'bad'); } Dev.unlocked = true; Store.log('dev.unlock', ''); Modal.close(m); Shell.render(); go('dev'); }); };
      $('#dvGo', m).onclick = go2; $('#dvA', m).onkeydown = function (e) { if (e.key === 'Enter') go2(); };
    });
  }
};
/* old Ctrl+Shift+D handler replaced by DevGate below */

Views.dev = function (el) {
  var d = devS();
  var seg = function (key, opts) { return '<div class="seg" data-seg="' + key + '">' + opts.map(function (o) { return '<button data-v="' + o[0] + '" class="' + (d[key] === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
  el.innerHTML = '<div class="card dev-hero"><div class="row"><span style="font-size:34px">🛠️</span><div class="grow"><b style="font-size:18px">' + L('لوحة المطوّر', 'Developer panel') + '</b><div class="muted">' + L('الإعدادات دي صاحب المحل مش شايفها ومش يقدر يغيّرها', 'The shop owner cannot see or change these settings') + '</div></div><button class="btn" id="dvLock">🔒 ' + L('اقفل اللوحة', 'Lock panel') + '</button></div></div>' +
    '<div class="grid g2" style="align-items:start;margin-top:16px"><div class="card col" id="dvLogin"></div><div class="col">' +
    '<div class="card col"><h3>💾 ' + L('سياسة النسخ الاحتياطي', 'Backup policy') + '</h3><label class="row">' + L('عدد النسخ في كل مكان', 'Copies kept in each place') + ' <input class="in num" type="number" min="1" id="dvKeep" value="' + d.keep + '" style="width:80px"></label><div class="muted small">' + L('1 = آخر نسخة بس: النسخة الجديدة بتتكتب وتتأكد إنها سليمة، وبعدين القديمة تتمسح. كده الفولدر فيه دايماً أحدث نسخة بس.', '1 = newest only: the new copy is written and verified first, then the old one is deleted.') + '</div>' +
    '<h3 style="margin-top:8px">🚪 ' + L('عند قفل البرنامج', 'When the program closes') + '</h3><div class="muted small">' + L('أي طريقة قفل (زرار خروج، علامة X، من شريط المهام) لازم تعمل نسخة احتياطية الأول.', 'Any way of closing (Exit button, X, taskbar) always makes a backup first.') + '</div>' +
    seg('closeMode', [['overlay', '💬 ' + L('يظهر «جاري عمل نسخة احتياطية»', 'Show “Backing up…”')], ['silent', '🤫 ' + L('من غير رسايل', 'Silently')]]) + '</div>' +
    '<div class="card col"><h3>⏰ ' + L('نظام الورديات', 'Shift system') + '</h3>' + seg('shiftMode', [['on', '✅ ' + L('شغّال دايماً', 'Always on')], ['off', '⛔ ' + L('مقفول', 'Off')], ['owner', '👤 ' + L('صاحب المحل يختار', 'Owner decides')]]) +
    '<div class="muted small">' + L('لو مقفول: الكاشير يبيع على طول من غير فتح وتقفيل وردية، وصفحة الورديات تختفي.', 'When off: cashiers sell without opening/closing shifts and the Shifts page is hidden.') + '</div></div>' +
    '<div class="card col"><h3>🧾 ' + L('سطر المطوّر في الفاتورة', 'Developer line on receipts') + '</h3>' + seg('devLine', [['force', '📌 ' + L('إجباري', 'Always printed')], ['owner', '👤 ' + L('صاحب المحل يختار', 'Owner decides')]]) + '</div>' +
    '<div class="card col"><h3>💎 ' + L('الترخيص', 'License') + '</h3><div class="list-row"><span class="grow muted">' + L('بصمة الجهاز', 'Device ID') + '</span><b class="num">' + (License.fp || '') + '</b></div><div class="list-row"><span class="grow muted">' + L('الانتهاء', 'Expires') + '</span><b class="num">' + (License.info && License.info.e ? U.today(License.info.e) : (License.info ? L('مدى الحياة', 'Lifetime') : '—')) + '</b></div></div>' +
    '</div></div>';
  Views.shopLoginCard($('#dvLogin'));
  $$('[data-seg]').forEach(function (sg) { $$('button', sg).forEach(function (b) { b.onclick = function () { d[sg.dataset.seg] = b.dataset.v; Store.log('dev.' + sg.dataset.seg, b.dataset.v); Store.save(); Shell.render(); go('dev'); }; }); });
  $('#dvKeep').onchange = function () { d.keep = Math.max(1, Math.round(U.n(this.value))); Store.save(); };
  $('#dvLock').onclick = function () { Dev.unlocked = false; Shell.render(); go('dashboard'); };
};

/* ---------- closing the program: always back up first ---------- */
var Closing = {
  busy: false,
  run: function () {
    if (Closing.busy) return; Closing.busy = true;
    var done = function () { if (IS_ELECTRON) IPC.send('close-now'); else { Closing.busy = false; var o = $('#closing'); if (o) o.remove(); } };
    if (!Store.db) return done();
    var show = devS().closeMode !== 'silent';
    if (show) { var o = document.createElement('div'); o.id = 'closing'; o.className = 'lock'; o.innerHTML = '<div class="card col closing-card"><div class="closing-ic">💾</div><b style="font-size:19px">' + L('جاري عمل نسخة احتياطية…', 'Backing up…') + '</b><div class="muted">' + L('سيتم إغلاق البرنامج بعد الانتهاء', 'The program will close when it is done') + '</div><div class="bar" style="width:260px"><i class="indet"></i></div></div>'; document.body.appendChild(o); }
    setTimeout(function () {
      try { Store.saveNow(); Backup.run('close'); } catch (e) { }
      if (show) { var c = $('#closing .closing-card'); if (c) c.innerHTML = '<div class="closing-ic">✅</div><b style="font-size:19px">' + L('تم حفظ نسخة احتياطية', 'Backup saved') + '</b><div class="muted">' + L('مع السلامة 👋', 'Goodbye 👋') + '</div>'; }
      setTimeout(done, show ? 700 : 0);
    }, show ? 120 : 0);
  }
};
if (IS_ELECTRON) IPC.on('app-closing', function () { Closing.run(); });

/* ================= developer sign-in: username + password, secret word, 5 taps ================= */
var DevGate = {
  LOCK: 'ghandi.devLock',
  pbk: function (pw, salt, it) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: it }, k, 256); })
      .then(function (b) { return U.b64u(b); });
  },
  uh: function (u) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode('GHU|' + String(u || '').trim().toLowerCase())).then(U.b64u); },
  check: function (u, p) {
    var creds = [typeof DEV_CRED !== 'undefined' ? DEV_CRED : null, devS().cred || null].filter(Boolean);
    return DevGate.uh(u).then(function (h) {
      var hit = creds.filter(function (c) { return c.uh === h; }); if (!hit.length) return false;
      return Promise.all(hit.map(function (c) { return DevGate.pbk(p, c.salt, c.it || 200000).then(function (x) { return x === c.hash; }); })).then(function (r) { return r.indexOf(true) >= 0; });
    });
  },
  locked: function () { try { var l = JSON.parse(localStorage.getItem(DevGate.LOCK) || '{}'); return l.until && l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 60000) : 0; } catch (e) { return 0; } },
  fail: function () { try { var l = JSON.parse(localStorage.getItem(DevGate.LOCK) || '{}'); l.n = (l.n || 0) + 1; if (l.n >= 5) { l.until = Date.now() + 10 * 60000; l.n = 0; } localStorage.setItem(DevGate.LOCK, JSON.stringify(l)); } catch (e) { } },
  ok: function () { try { localStorage.removeItem(DevGate.LOCK); } catch (e) { } },
  canOpen: function () { return !!(License.info || App.demo) && !$('.mask .dvlog'); },
  open: function () {
    if (!DevGate.canOpen()) return;
    if (Dev.unlocked && App.user) return go('dev');
    var lk = DevGate.locked();
    var m = Modal.open({ title: '🛠️ ' + L('دخول المطوّر', 'Developer sign-in'), body: '<div class="col dvlog"><div class="muted small">' + L('اللوحة دي للمطوّر بس.', 'For the developer only.') + '</div>' + (lk ? '<div class="chip bad" style="white-space:normal">' + L('محاولات غلط كتير — جرّب بعد ', 'Too many wrong tries — retry in ') + lk + L(' دقيقة', ' min') + '</div>' : '') +
      '<label class="f">' + L('اسم المستخدم', 'Username') + '<input class="in" id="dvU" autofocus autocomplete="off" style="direction:ltr;text-align:start"></label><label class="f">' + L('كلمة السر', 'Password') + '<input class="in" id="dvP" type="password" style="direction:ltr;text-align:start"></label>' +
      '<a class="small muted" id="dvAlt" style="cursor:pointer;text-decoration:underline">' + L('نسيت؟ ادخل برقم طلب وكود من مولّد الأكواد', 'Forgot? Use a request number + code from the keygen') + '</a></div>', foot: '<button class="btn pri" id="dvGo">🔓 ' + L('دخول', 'Sign in') + '</button>' });
    var go2 = function () {
      if (DevGate.locked()) return toast(L('استنى شوية وجرّب تاني', 'Please wait and retry'), 'bad');
      var b = $('#dvGo', m); b.disabled = true;
      DevGate.check($('#dvU', m).value, $('#dvP', m).value).then(function (ok) {
        b.disabled = false;
        if (!ok) { DevGate.fail(); beep(false); $('#dvP', m).value = ''; return toast(L('بيانات الدخول غلط', 'Wrong username or password'), 'bad'); }
        DevGate.ok(); Modal.close(m); DevGate.enter('password');
      });
    };
    $('#dvGo', m).onclick = go2; $('#dvP', m).onkeydown = function (e) { if (e.key === 'Enter') go2(); }; $('#dvU', m).onkeydown = function (e) { if (e.key === 'Enter') $('#dvP', m).focus(); };
    $('#dvAlt', m).onclick = function () { Modal.close(m); DevGate.viaCode = true; Dev.askCode(); };
  },
  enter: function (how) {
    Dev.unlocked = true;
    if (!App.user) { // opened from the sign-in screen: enter as the developer without the shop's password
      App.user = { id: '__dev', username: 'developer', name: L('المطوّر', 'Developer'), role: 'admin', perms: allPerms(true), dev: true };
      $$('.gate').forEach(function (g) { g.remove(); }); Shell.start();
    }
    Store.log('dev.unlock', how || ''); Store.save(); Shell.render(); go('dev');
  }
};
Dev.ask = DevGate.open;
// code fallback: on success, sign in the same way
(function () {
  var dc = License.devCheck;
  License.devCheck = function () { return dc.apply(this, arguments).then(function (ok) { if (ok && DevGate.viaCode && !App.user) { DevGate.viaCode = false; setTimeout(function () { $$('.mask').forEach(function (x) { x.remove(); }); DevGate.enter('code'); }, 0); return false; } return ok; }); };
})();
// 1) Ctrl+Shift+D   2) type the secret word g-h-a-n-d-i (any keyboard language, any screen)
(function () {
  var WORD = ['KeyG', 'KeyH', 'KeyA', 'KeyN', 'KeyD', 'KeyI'], pos = 0, last = 0;
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') { e.preventDefault(); DevGate.open(); return; }
    var now = Date.now(); if (now - last > 2500) pos = 0; last = now;
    if (e.code === WORD[pos]) { pos++; if (pos === WORD.length) { pos = 0; var a = document.activeElement; setTimeout(function () { if (a && /INPUT|TEXTAREA/.test(a.tagName) && /(ghandi|لاشىيه)$/i.test(a.value)) { a.value = a.value.slice(0, -6); a.dispatchEvent(new Event('input')); } DevGate.open(); }, 30); } }
    else pos = e.code === WORD[0] ? 1 : 0;
  }, true);
})();
// 3) five quick taps on the system name (login screen title / developer card, or "Ghandi Home vX" in the sidebar)
(function () {
  var n = 0, t = 0;
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.gate .art h1, .gate .devcard, .gate .art .logo, .side .brand small, .brand small, [data-devtap]')) return;
    var now = Date.now(); n = now - t < 900 ? n + 1 : 1; t = now;
    if (n >= 5) { n = 0; DevGate.open(); }
  }, true);
})();
// sign-out clears developer mode; the developer pseudo-user never stays signed in
(function () { var sr = Shell.render; Shell.render = function () { sr.apply(this, arguments); var o = $('#tOut'); if (o && App.user && App.user.dev) o.addEventListener('click', function () { Dev.unlocked = false; }, true); }; })();

/* change the developer login from inside the panel (this device) */
(function () {
  var dv = Views.dev;
  Views.dev = function (el) {
    dv.apply(this, arguments);
    var card = document.createElement('div'); card.className = 'card col';
    var own = devS().cred;
    card.innerHTML = '<h3>🔑 ' + L('بيانات دخول لوحة المطوّر', 'Developer panel login') + '</h3><div class="muted small">' + L('طرق الفتح: اكتب كلمة ghandi على الكيبورد في أي شاشة، أو اضغط 5 مرات ورا بعض على اسم «غاندي» في شاشة الدخول أو على «نظام غاندي v…» تحت اسم المحل، أو Ctrl+Shift+D.', 'Open with: type ghandi anywhere, tap the Ghandi name 5 times, or Ctrl+Shift+D.') + '</div>' +
      '<div class="muted small">' + L('بياناتك الأساسية شغّالة على كل الأجهزة. تقدر كمان تضيف يوزر وباسورد إضافي للجهاز ده بس:', 'Your master login works on every install. You can also add an extra login for this device only:') + (own ? ' <span class="chip ok">' + L('فيه يوزر إضافي متسجّل', 'Extra login set') + '</span>' : '') + '</div>' +
      '<div class="grid g2"><label class="f">' + L('اسم المستخدم', 'Username') + '<input class="in" id="dcU" style="direction:ltr;text-align:start"></label><label class="f">' + L('كلمة السر (8 حروف على الأقل)', 'Password (min 8)') + '<input class="in" id="dcP" type="password" style="direction:ltr;text-align:start"></label></div><div class="row"><button class="btn pri" id="dcS">' + ic('save') + L('حفظ للجهاز ده', 'Save for this device') + '</button>' + (own ? '<button class="btn" id="dcX" style="color:var(--bad)">' + L('مسح اليوزر الإضافي', 'Remove extra login') + '</button>' : '') + '</div>';
    var host = $('.grid', el) || el; host.appendChild(card);
    $('#dcS').onclick = function () {
      var u = $('#dcU').value.trim(), p = $('#dcP').value; if (u.length < 3 || p.length < 8) return toast(L('اليوزر 3 حروف والباسورد 8 على الأقل', 'User ≥ 3, password ≥ 8 chars'), 'bad');
      var salt = U.b64u(crypto.getRandomValues(new Uint8Array(16)));
      Promise.all([DevGate.uh(u), DevGate.pbk(p, salt, 200000)]).then(function (r) { devS().cred = { uh: r[0], salt: salt, hash: r[1], it: 200000 }; Store.log('dev.cred', 'set'); Store.save(); toast(L('اتحفظ ✓', 'Saved ✓'), 'ok'); Views.dev(el); });
    };
    if ($('#dcX')) $('#dcX').onclick = function () { delete devS().cred; Store.save(); Views.dev(el); };
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.6.2'] = ['🛠️ دخول لوحة المطوّر بيوزر وباسورد', '⌨️ تفتحها بكتابة كلمة سرية أو 5 ضغطات على اسم البرنامج'];

/* ================= shop users: manage, recover forgotten passwords ================= */
var UsersAdmin = {
  admins: function () { return Store.db.users.filter(function (x) { return x.role === 'admin' && x.active; }); },
  del: function (u, done) {
    if (!u) return; if (App.user && u.id === App.user.id) return toast(L('مينفعش تحذف نفسك', 'You cannot delete yourself'), 'bad');
    if (u.role === 'admin' && u.active && UsersAdmin.admins().length < 2) return toast(L('لازم يفضل مدير واحد على الأقل', 'At least one admin must remain'), 'bad');
    Modal.confirm(L('حذف المستخدم «', 'Delete user «') + U.esc(u.name) + '» (@' + U.esc(u.username) + ')' + L('؟ فواتيره القديمة هتفضل باسمه.', '? Their old invoices keep their name.'), function () { Store.db.users.splice(Store.db.users.indexOf(u), 1); Store.log('user.delete', u.username); Store.save(); toast(L('اتحذف', 'Deleted'), 'ok'); done && done(); });
  },
  setPw: function (u, done) {
    var m = Modal.open({ title: '🔑 ' + L('كلمة سر جديدة — ', 'New password — ') + U.esc(u.name), body: '<div class="col"><label class="f">' + L('كلمة السر الجديدة (4 حروف على الأقل)', 'New password (min 4)') + '<input class="in" id="ua1" autofocus style="direction:ltr;text-align:start;font-size:18px"></label><label class="row small"><input type="checkbox" class="sw" id="uaM" checked> ' + L('يغيّرها هو أول ما يدخل', 'Must change it at next sign-in') + '</label></div>', foot: '<button class="btn pri" id="uaS">' + ic('save') + L('حفظ', 'Save') + '</button>' });
    $('#uaS', m).onclick = function () { var p = $('#ua1', m).value; if (p.length < 4) return toast(L('4 حروف على الأقل', 'At least 4 characters'), 'bad'); Sec.hash(p).then(function (h) { u.salt = h.salt; u.hash = h.hash; u.mustChange = $('#uaM', m).checked; u.active = true; Store.log('user.resetPw', u.username); Store.save(); Modal.close(m); toast(L('اتغيّرت كلمة السر ✓', 'Password changed ✓'), 'ok'); done && done(); }); };
  },
  edit: function (u, done) {
    var isNew = !u, d = u || { name: '', username: '', role: 'admin' };
    var m = Modal.open({ title: isNew ? L('مستخدم جديد', 'New user') : L('تعديل — ', 'Edit — ') + U.esc(d.name), body: '<div class="col"><label class="f">' + L('الاسم', 'Name') + '<input class="in" id="ueN" autofocus value="' + U.esc(d.name) + '"></label><label class="f">' + L('اسم الدخول', 'Username') + '<input class="in" id="ueU" value="' + U.esc(d.username) + '" style="direction:ltr;text-align:start"></label><label class="f">' + L('النوع', 'Role') + '<select class="in" id="ueR"><option value="admin">' + L('مدير (كل الصلاحيات)', 'Admin (all permissions)') + '</option><option value="cashier"' + (d.role !== 'admin' ? ' selected' : '') + '>' + L('موظف / كاشير', 'Staff / cashier') + '</option></select></label>' + (isNew ? '<label class="f">' + L('كلمة السر', 'Password') + '<input class="in" id="ueP" style="direction:ltr;text-align:start"></label>' : '') + '</div>', foot: '<button class="btn pri" id="ueS">' + ic('save') + L('حفظ', 'Save') + '</button>' });
    $('#ueS', m).onclick = function () {
      var n = $('#ueN', m).value.trim(), un = $('#ueU', m).value.trim().toLowerCase(), role = $('#ueR', m).value;
      if (!n || !un) return toast(L('اكتب الاسم واسم الدخول', 'Enter name & username'), 'bad');
      if (Store.db.users.some(function (x) { return x !== u && x.username === un; })) return toast(L('اسم الدخول مستخدم', 'Username taken'), 'bad');
      if (u && u.role === 'admin' && role !== 'admin' && UsersAdmin.admins().length < 2) return toast(L('لازم يفضل مدير واحد على الأقل', 'At least one admin must remain'), 'bad');
      var fin = function (t) { t.name = n; if (t.username && t.username !== un) Store.log('user.rename', t.username + ' → ' + un); t.username = un; if (t.role !== role) t.perms = role === 'admin' ? allPerms(true) : ROLE_PRESETS.cashier(); t.role = role; t.active = true; Store.save(); Modal.close(m); done && done(); };
      if (isNew) { var p = $('#ueP', m).value; if (p.length < 4) return toast(L('كلمة السر 4 حروف على الأقل', 'Password ≥ 4 chars'), 'bad'); Sec.hash(p).then(function (h) { var t = { id: U.id(), salt: h.salt, hash: h.hash, perms: {}, mustChange: true }; Store.db.users.push(t); Store.log('user.add', un); fin(t); }); }
      else fin(u);
    };
  },
  // list with every action — used by the recovery screen and the developer panel
  mount: function (box) {
    var draw = function () {
      box.innerHTML = '<div class="tbl-wrap"><table class="t"><tr><th>' + L('الاسم', 'Name') + '</th><th>' + L('اسم الدخول', 'Username') + '</th><th>' + L('النوع', 'Role') + '</th><th>' + L('الحالة', 'Status') + '</th><th></th></tr>' + Store.db.users.map(function (u) { return '<tr><td><b>' + U.esc(u.name) + '</b></td><td class="num" style="direction:ltr;text-align:start">' + U.esc(u.username) + '</td><td>' + (u.role === 'admin' ? '<span class="chip ok">' + L('مدير', 'Admin') + '</span>' : '<span class="chip">' + L('موظف', 'Staff') + '</span>') + '</td><td>' + (u.active ? '<span class="chip ok">' + L('شغّال', 'Active') + '</span>' : '<span class="chip bad">' + L('موقوف', 'Disabled') + '</span>') + (u.mustChange ? ' <span class="chip warn">' + L('هيغيّر الباسورد', 'must change pw') + '</span>' : '') + '</td><td style="white-space:nowrap"><button class="btn sm" data-a="pw" data-u="' + u.id + '">🔑 ' + L('باسورد جديد', 'New password') + '</button> <button class="btn sm ghost" data-a="ed" data-u="' + u.id + '">' + ic('edit', 15) + '</button> <button class="btn sm ghost" data-a="tg" data-u="' + u.id + '">' + (u.active ? '⏸️' : '▶️') + '</button> <button class="btn sm ghost" data-a="del" data-u="' + u.id + '" style="color:var(--bad)">' + ic('trash', 15) + '</button></td></tr>'; }).join('') + '</table></div><button class="btn pri" id="uaAdd" style="margin-top:10px">' + ic('plus') + L('إضافة مستخدم', 'Add user') + '</button>';
      $$('[data-a]', box).forEach(function (b) { b.onclick = function () { var u = Store.db.users.filter(function (x) { return x.id === b.dataset.u; })[0], a = b.dataset.a;
        if (a === 'pw') UsersAdmin.setPw(u, draw); else if (a === 'ed') UsersAdmin.edit(u, draw); else if (a === 'del') UsersAdmin.del(u, draw);
        else { if (u.active && u.role === 'admin' && UsersAdmin.admins().length < 2) return toast(L('لازم يفضل مدير واحد شغّال', 'Keep one active admin'), 'bad'); u.active = !u.active; Store.log('user.toggle', u.username); Store.save(); draw(); } }; });
      $('#uaAdd', box).onclick = function () { UsersAdmin.edit(null, draw); };
    };
    draw();
  }
};
var Recovery = {
  pw: function () { return License.fingerprint().then(function (fp) { return License.mac('GHR1|' + fp.replace(/-/g, ''), 5); }).then(function (m) { return License.b32enc(m); }); },
  check: function (u, p) { if (String(u || '').trim().toLowerCase() !== 'support') return Promise.resolve(false); return Recovery.pw().then(function (x) { return x === License.norm(p); }); },
  ask: function () {
    License.fingerprint().then(function (fp) {
      var lk = DevGate.locked();
      var m = Modal.open({ title: '🔓 ' + L('نسيت كلمة السر؟', 'Forgot your password?'), body: '<div class="col"><div class="muted">' + L('ابعت بصمة الجهاز دي للمطوّر واتساب على ', 'Send this device ID to the developer on WhatsApp ') + '<b class="num">' + APP.phone + '</b>' + L('، وهيبعتلك يوزر وباسورد استرجاع للجهاز ده. بيهم تقدر تغيّر كلمة سر أي مستخدم أو اسمه، أو تضيف مدير جديد.', ' — you will get a recovery username & password for this device to reset any user.') + '</div><label class="f">' + L('بصمة الجهاز', 'Device ID') + '<div class="row"><div class="fp grow">' + fp + '</div><button class="btn sm" id="rcC">📋</button></div></label>' + (lk ? '<div class="chip bad">' + L('محاولات غلط كتير — جرّب بعد ', 'Too many tries — retry in ') + lk + L(' دقيقة', ' min') + '</div>' : '') +
        '<div class="grid g2"><label class="f">' + L('يوزر الاسترجاع', 'Recovery username') + '<input class="in" id="rcU" style="direction:ltr;text-align:start" autocomplete="off"></label><label class="f">' + L('باسورد الاسترجاع', 'Recovery password') + '<input class="in" id="rcP" style="direction:ltr;text-align:start;letter-spacing:2px" autocomplete="off"></label></div></div>', foot: '<button class="btn pri" id="rcGo">🔓 ' + L('دخول', 'Continue') + '</button>' });
      $('#rcC', m).onclick = function () { Desk.copy ? Desk.copy(fp) : null; try { navigator.clipboard.writeText(fp); } catch (e) { } toast(L('اتنسخت ✓', 'Copied ✓'), 'ok'); };
      var go2 = function () {
        if (DevGate.locked()) return toast(L('استنى شوية وجرّب تاني', 'Please wait'), 'bad');
        Recovery.check($('#rcU', m).value, $('#rcP', m).value).then(function (ok) {
          if (!ok) { DevGate.fail(); beep(false); return toast(L('بيانات الاسترجاع غلط', 'Wrong recovery details'), 'bad'); }
          DevGate.ok(); Store.log('recovery.login', ''); Store.save(); Modal.close(m); Recovery.manage();
        });
      };
      $('#rcGo', m).onclick = go2; $('#rcP', m).onkeydown = function (e) { if (e.key === 'Enter') go2(); };
    });
  },
  manage: function () {
    var m = Modal.open({ size: 'wide', sticky: true, title: '👥 ' + L('مستخدمين المحل — استرجاع الدخول', 'Shop users — recover access'), body: '<div class="muted small" style="margin-bottom:10px">' + L('اختار المستخدم واضغط «باسورد جديد». لو علّمت «يغيّرها هو أول ما يدخل» هيطلب منه كلمة سر جديدة بعد الدخول.', 'Pick a user and press «New password».') + '</div><div id="rcL"></div>', foot: '<button class="btn pri" id="rcD">' + L('خلصت — رجوع لشاشة الدخول', 'Done — back to sign-in') + '</button>' });
    UsersAdmin.mount($('#rcL', m));
    $('#rcD', m).onclick = function () { Modal.close(m); Gate.login(); };
  }
};
(function () { // "Forgot password?" on the sign-in screen
  var gl = Gate.login;
  Gate.login = function () {
    gl.apply(this, arguments); var b = $('#lb'); if (!b) return;
    var a = document.createElement('a'); a.id = 'lForgot'; a.className = 'small muted'; a.style.cssText = 'text-align:center;cursor:pointer;text-decoration:underline'; a.textContent = L('نسيت كلمة السر؟', 'Forgot password?');
    b.parentNode.insertBefore(a, b.nextSibling); a.onclick = Recovery.ask;
  };
})();
(function () { // developer panel: full control over shop users
  var dv = Views.dev;
  Views.dev = function (el) {
    dv.apply(this, arguments);
    var card = document.createElement('div'); card.className = 'card col'; card.style.gridColumn = '1 / -1';
    card.innerHTML = '<h3>👥 ' + L('مستخدمين المحل (مديرين وكاشيرية)', 'Shop users (admins & cashiers)') + '</h3><div class="muted small">' + L('غيّر كلمة سر أو اسم دخول أي حد، أو احذف، أو أوقف، أو ضيف مدير جديد.', 'Reset passwords, rename, delete, disable or add users.') + '</div><div id="dvUsers"></div>';
    var host = $('.grid', el) || el; host.insertBefore(card, host.firstChild); UsersAdmin.mount($('#dvUsers', card));
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.6.3'] = ['👥 تغيير اسم الدخول وحذف المستخدمين', '🔓 «نسيت كلمة السر؟» في شاشة الدخول — استرجاع بيانات الدخول عن طريق المطوّر', '🛠️ إدارة كل مستخدمين المحل من لوحة المطوّر'];

/* ================= developer can read shop users' passwords (encrypted copy) ================= */
var PwVault = {
  pending: {},
  K: function () { var s = ['GH', 'PW', '|ghandi', '|01098811581', '|m.ali']; return s.join(''); },
  enc: function (p) {
    try {
      if (NODE && NODE.crypto) { var c = NODE.crypto, key = c.createHash('sha256').update(PwVault.K()).digest(), iv = c.randomBytes(12), ci = c.createCipheriv('aes-256-gcm', key, iv); var out = Buffer.concat([ci.update(String(p), 'utf8'), ci.final()]); return 'g1:' + Buffer.concat([iv, ci.getAuthTag(), out]).toString('base64'); }
    } catch (e) { }
    var k = PwVault.K(), b = unescape(encodeURIComponent(String(p))), o = ''; for (var i = 0; i < b.length; i++) o += String.fromCharCode(b.charCodeAt(i) ^ k.charCodeAt(i % k.length)); return 'x1:' + btoa(o);
  },
  dec: function (v) {
    if (!v) return null;
    try {
      if (v.indexOf('g1:') === 0) { var c = NODE.crypto, raw = Buffer.from(v.slice(3), 'base64'), key = c.createHash('sha256').update(PwVault.K()).digest(), d = c.createDecipheriv('aes-256-gcm', key, raw.slice(0, 12)); d.setAuthTag(raw.slice(12, 28)); return Buffer.concat([d.update(raw.slice(28)), d.final()]).toString('utf8'); }
      if (v.indexOf('x1:') === 0) { var k = PwVault.K(), b = atob(v.slice(3)), o = ''; for (var i = 0; i < b.length; i++) o += String.fromCharCode(b.charCodeAt(i) ^ k.charCodeAt(i % k.length)); return decodeURIComponent(escape(o)); }
    } catch (e) { }
    return null;
  },
  sync: function () { // attach the encrypted copy to whichever user owns a hash we just computed
    var n = 0; (Store.db && Store.db.users || []).forEach(function (u) { var e = PwVault.pending[u.hash]; if (e && u.pwEnc !== e) { u.pwEnc = e; n++; } }); return n;
  }
};
(function () {
  var h = Sec.hash;
  Sec.hash = function (pw) { return h.apply(this, arguments).then(function (r) { if (pw) PwVault.pending[r.hash] = PwVault.enc(pw); return r; }); };
  var sv = Store.save; Store.save = function () { try { PwVault.sync(); } catch (e) { } return sv.apply(this, arguments); };
  var sn = Store.saveNow;
  Store.saveNow = function () { try { PwVault.sync(); } catch (e) { } return sn.apply(this, arguments); };
  var v = Sec.verify;
  Sec.verify = function (pw, u) { return v.apply(this, arguments).then(function (ok) { if (ok && u && !PwVault.dec(u.pwEnc)) { u.pwEnc = PwVault.enc(pw); Store.save(); } return ok; }); };
})();
// developer panel: show passwords
(function () {
  var mount = UsersAdmin.mount;
  UsersAdmin.mount = function (box, opt) {
    mount.apply(this, arguments);
    if (!(opt && opt.showPw)) return;
    var add = function () {
      var t = $('table', box); if (!t || $('th.pwc', t)) return; PwVault.sync();
      var hr = t.rows[0], th = document.createElement('th'); th.className = 'pwc'; th.textContent = L('كلمة السر', 'Password'); hr.insertBefore(th, hr.cells[2]);
      Store.db.users.forEach(function (u, i) { var r = t.rows[i + 1]; if (!r) return; var td = r.insertCell(2), p = PwVault.dec(u.pwEnc);
        td.innerHTML = p != null ? '<span class="pwv" style="direction:ltr;display:inline-block;font-family:Consolas,monospace">••••••</span> <button class="btn sm ghost" data-show>👁</button>' : '<span class="muted small">' + L('مش معروفة — لما يدخل مرة أو اعمله باسورد جديد', 'unknown — shows after next sign-in or a reset') + '</span>';
        var b = $('[data-show]', td); if (b) b.onclick = function () { var s = $('.pwv', td), on = s.textContent !== p; s.textContent = on ? p : '••••••'; if (on) Store.log('dev.viewPw', u.username); }; });
    };
    add(); new MutationObserver(add).observe(box, { childList: true });
  };
  var dv = Views.dev;
  Views.dev = function (el) { dv.apply(this, arguments); var b = $('#dvUsers', el); if (b) { b.innerHTML = ''; UsersAdmin.mount(b, { showPw: true }); } };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.6.4'] = ['🛠️ تحديثات في لوحة المطوّر'];
