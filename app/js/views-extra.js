/* Ghandi Home — feature switches (developer & owner), edit locks, exchange, birthdays,
   purchase orders, price checker, daily WhatsApp report. */
'use strict';

/* ================= feature registry ================= */
// key, emoji, Arabic, English, group, perms hidden when off, views hidden when off
var FEATS = [
  ['returns', '↩️', 'المرتجعات', 'Returns', 'sell', ['pos.return']],
  ['exchange', '🔁', 'الاستبدال', 'Exchange', 'sell'],
  ['credit', '💳', 'البيع الآجل (الشكك)', 'Credit sales', 'sell', ['pos.credit']],
  ['discount', '✂️', 'الخصم على الفاتورة', 'Invoice discount', 'sell', ['pos.discount']],
  ['priceEdit', '✏️', 'تعديل السعر وقت البيع', 'Edit price at checkout', 'sell', ['pos.priceEdit']],
  ['hold', '⏸️', 'تعليق الفواتير', 'Hold invoices', 'sell', ['pos.hold']],
  ['tiers', '💰', 'البيع بأنواع الأسعار (جملة/نص جملة)', 'Price types (wholesale…)', 'sell', ['pos.changeTier']],
  ['phone', '📱', 'خانة موبايل العميل في البيع', 'Customer mobile at checkout', 'sell'],
  ['layaway', '📌', 'الحجز بعربون', 'Layaway', 'sell', ['layaway'], ['layaway']],
  ['drawer', '🗄️', 'درج الكاش', 'Cash drawer', 'sell', ['pos.drawer']],
  ['custDisplay', '🖥️', 'شاشة العميل', 'Customer display', 'sell'],
  ['pricecheck', '🔎', 'فحص السعر', 'Price checker', 'sell', [], ['pricecheck']],
  ['images', '📷', 'صور الأصناف', 'Product photos', 'stock'],
  ['labels', '🏷️', 'طباعة الباركود', 'Barcode labels', 'stock', ['labels'], ['labels']],
  ['count', '📋', 'الجرد', 'Stock count', 'stock', ['stock.count', 'stock.apply'], ['count']],
  ['purchases', '🚚', 'استلام الأصناف', 'Goods receiving', 'stock', ['purchases'], ['purchases']],
  ['porders', '📝', 'طلبات الشراء للمورد', 'Purchase orders', 'stock'],
  ['supplierReturn', '↪️', 'مرتجع للمورد', 'Supplier returns', 'stock'],
  ['bulkPrices', '🏷️', 'تعديل الأسعار الجماعي', 'Bulk price editing', 'stock', [], ['prices']],
  ['promos', '🎁', 'العروض والخصومات', 'Offers & discounts', 'stock', ['promos'], ['promos']],
  ['excel', '📊', 'استيراد وتصدير إكسيل', 'Excel import/export', 'stock', ['import', 'export']],
  ['customers', '💞', 'صفحة العملاء', 'Customers page', 'cust', [], ['customers']],
  ['loyalty', '⭐', 'نظام النقاط', 'Loyalty points', 'cust', ['customers.points']],
  ['coupons', '🎟️', 'الكوبونات', 'Coupons', 'cust'],
  ['giftcards', '🎁', 'كروت الهدايا', 'Gift cards', 'cust'],
  ['birthdays', '🎂', 'أعياد ميلاد العملاء', 'Customer birthdays', 'cust'],
  ['suppliers', '🏭', 'الموردين', 'Suppliers', 'acc', ['suppliers'], ['suppliers']],
  ['expenses', '💸', 'المصروفات', 'Expenses', 'acc', ['expenses'], ['expenses']],
  ['reports', '📈', 'التقارير', 'Reports', 'acc', ['reports'], ['reports']],
  ['profit', '💹', 'رؤية الأرباح', 'Profit figures', 'acc', ['reports.profit']],
  ['dailyReport', '📲', 'تقرير اليوم على واتساب', 'Daily WhatsApp report', 'acc'],
  ['invoiceDesign', '🧾', 'تصميم الفاتورة', 'Invoice designer', 'admin', ['invoiceDesign'], ['invoice']],
  ['themes', '🎨', 'تغيير شكل البرنامج (الثيمات)', 'Themes', 'admin'],
  ['backupPage', '💾', 'صفحة النسخ الاحتياطي', 'Backup page', 'admin', [], ['backup']]
];
var FEAT_GROUPS = { sell: ['🛒', 'البيع', 'Selling'], stock: ['📦', 'المخزن', 'Inventory'], cust: ['💞', 'العملاء', 'Customers'], acc: ['📈', 'الحسابات والتقارير', 'Accounts & reports'], admin: ['⚙️', 'الإدارة', 'Admin'] };
// things the developer can lock so the shop owner can see but not change them
var LOCKS = [
  ['shop', '🏪', 'بيانات المحل', 'Shop profile', { view: 'shop' }],
  ['invoice', '🧾', 'تصميم الفاتورة', 'Invoice design', { view: 'invoice' }],
  ['users', '👥', 'المستخدمين والصلاحيات', 'Users & permissions', { view: 'users' }],
  ['backupCfg', '💾', 'إعدادات النسخ الاحتياطي', 'Backup settings', { view: 'backup' }],
  ['settings', '⚙️', 'الإعدادات كلها', 'All settings', { view: 'settings' }],
  ['featuresCfg', '🧩', 'تشغيل/إيقاف المميزات من الإعدادات', 'Feature switches in settings', { card: /المميزات اللي شغّالة|Features in use/ }],
  ['loyaltyCfg', '⭐', 'إعدادات النقاط وخانة الموبايل', 'Loyalty & mobile settings', { card: /العملاء ونظام النقاط|Customers & loyalty/ }],
  ['tiersCfg', '💰', 'إعدادات أنواع الأسعار', 'Price-type settings', { card: /أنواع الأسعار|price type|شرائح الأسعار|Price tiers/i }],
  ['printersCfg', '🖨️', 'إعدادات الطابعات والدرج', 'Printer & drawer settings', { card: /الطابعات|Printers|درج الكاش|Cash drawer/ }],
  ['themesCfg', '🎨', 'تغيير الثيم واللغة', 'Theme & language', { card: /ثيم البرنامج|Program theme|الأمان والمظهر|Security & look/ }],
  ['prices', '🏷️', 'تعديل أسعار الأصناف', 'Editing product prices', { perms: ['products.editPrice'] }],
  ['products', '📦', 'إضافة وتعديل وحذف الأصناف', 'Adding/editing/deleting products', { perms: ['products.add', 'products.edit', 'products.delete', 'import'] }],
  ['stockEdit', '📋', 'تعديل الرصيد واعتماد الجرد', 'Changing stock & approving counts', { perms: ['stock.apply'] }]
];
function featCfg() { var d = devS(); if (!d.feat) d.feat = {}; if (!d.lock) d.lock = {}; var s = S(); if (!s.feat) s.feat = {}; return { dev: d.feat, lock: d.lock, own: s.feat }; }
function F(k) { var c = featCfg(), d = c.dev[k]; if (d === 'off') return false; if (d === 'force') return true; return c.own[k] !== false; }
function isLocked(k) { return !Dev.unlocked && !!featCfg().lock[k]; }
var FEAT_BY_PERM = {}, FEAT_BY_VIEW = {};
FEATS.forEach(function (f) { (f[5] || []).forEach(function (p) { FEAT_BY_PERM[p] = f[0]; }); (f[6] || []).forEach(function (v) { FEAT_BY_VIEW[v] = f[0]; }); });
function posPhoneCfg() { var p = S().posPhone || {}; return { on: !!p.on && F('phone'), required: !!p.required && F('phone') }; }

/* hide / lock through the permission check (covers menus, buttons and pages) */
(function () {
  var c0 = can;
  can = function (p) {
    if (FEAT_BY_PERM[p] && !F(FEAT_BY_PERM[p])) return false;
    if (!Dev.unlocked) { var lk = featCfg().lock; for (var i = 0; i < LOCKS.length; i++) { var L0 = LOCKS[i]; if (lk[L0[0]] && L0[4].perms && L0[4].perms.indexOf(p) >= 0) return false; } }
    return c0(p);
  };
  var na = navAllowed;
  navAllowed = function (n) { if (FEAT_BY_VIEW[n[0]] && !F(FEAT_BY_VIEW[n[0]])) return false; if (n[0] === 'coupons' && !F('coupons') && !F('giftcards')) return false; return na(n); };
  var g0 = go;
  go = function (v) { if (FEAT_BY_VIEW[v] && !F(FEAT_BY_VIEW[v])) v = 'dashboard'; return g0.apply(this, [v].concat([].slice.call(arguments, 1))); };
  // feature hooks in existing modules
  var lo = Loyalty.on; Loyalty.on = function () { return F('loyalty') && lo(); };
  var cdo = CD.on; CD.on = function () { return F('custDisplay') && cdo(); };
  var da = Drawer.auto; Drawer.auto = function () { if (F('drawer')) return da.apply(this, arguments); };
  var ut = userTiers; userTiers = function (u) { return F('tiers') ? ut(u) : [+S().defaultTier || 0]; };
  var pg = prodGem; prodGem = function (p, c) { if (p && p.img && !F('images')) { p = Object.assign({}, p); delete p.img; } return pg(p, c); };
  var pm = pmName; pmName = function (k) { return { exchange: '🔁 ' + L('استبدال', 'Exchange'), gift: '🎁 ' + L('كارت هدية', 'Gift card'), layaway: '📌 ' + L('حجز', 'Layaway') }[k] || pm(k); };
})();

/* remove UI pieces of switched-off features + apply edit locks after every render */
var FeatUI = {
  hide: function (sel, root) { $$(sel, root || document).forEach(function (e) { e.remove(); }); },
  run: function () {
    var v = $('#view'); if (!v) return;
    if (!F('giftcards')) FeatUI.hide('#xGift, #cpT [data-t="gc"]');
    if (!F('coupons')) FeatUI.hide('#cpT [data-t="cp"]');
    if (!F('pricecheck')) FeatUI.hide('#xPc');
    if (!F('images')) FeatUI.hide('.pimg-ed');
    if (!F('tiers')) FeatUI.hide('#rT [data-t="tier"], .tierbar, .tier-access');
    if (!F('supplierReturn')) $$('#view .btn').forEach(function (b) { if (/مرتجع للمورد|Return to supplier/.test(b.textContent) && !b.closest('.card')) b.remove(); });
    if (!F('loyalty')) FeatUI.hide('#rT [data-t="cust"]');
    if (!F('dailyReport')) FeatUI.hide('[data-feat="dailyReport"]');
    if (!F('birthdays')) FeatUI.hide('[data-feat="birthdays"]');
    if (!F('porders')) FeatUI.hide('[data-feat="porders"]');
    if (!F('exchange')) FeatUI.hide('[data-feat="exchange"]');
    var tier = $('#tier'); if (tier) tier.style.display = F('tiers') ? '' : 'none';
    if (App.view === 'settings') {
      var cards = $$('#view .card');
      cards.forEach(function (c) { var h = $('h3', c), t = h ? h.textContent : '';
        if ((!F('themes') && /ثيم البرنامج|Program theme/.test(t)) || (!F('drawer') && /درج الكاش|Cash drawer/.test(t)) || (!F('custDisplay') && /شاشة العميل|Customer display/.test(t)) || (!F('tiers') && /أنواع الأسعار|price type/i.test(t))) c.remove(); });
      if (!F('phone')) $$('[data-ph]').forEach(function (i) { var l = i.closest('label'); if (l) { var n = l.nextElementSibling; l.remove(); if (n && n.classList.contains('muted')) n.remove(); } });
      if (!F('loyalty')) { $$('[data-ly="on"]').forEach(function (i) { var l = i.closest('label'); l && l.remove(); }); FeatUI.hide('.ly-box, #lyEx'); }
      if (!F('loyalty') && !F('phone')) $$('#view .card').forEach(function (c) { var h = $('h3', c); if (h && /العملاء ونظام النقاط|Customers & loyalty/.test(h.textContent)) c.remove(); });
    }
    if (Dev.unlocked) return;
    var lk = featCfg().lock;
    LOCKS.forEach(function (L0) {
      if (!lk[L0[0]]) return; var o = L0[4];
      if (o.view && App.view === o.view) FeatUI.freeze(v, L0);
      if (o.card) $$('#view .card').forEach(function (c) { var h = $('h3', c); if (h && o.card.test(h.textContent) && !c.closest('.feat-locked')) FeatUI.freeze(c, L0, true); });
    });
  },
  freeze: function (box, L0, small) {
    if (!box.classList.contains('feat-locked')) {
      box.classList.add('feat-locked');
      var b = document.createElement('div'); b.className = 'lock-note'; b.innerHTML = '🔒 ' + (small ? '' : '<b>' + L(L0[2], L0[3]) + '</b> — ') + L('مقفول من المطوّر — للتعديل كلّم ', 'Locked by the developer — contact ') + L(APP.dev, APP.devEn) + ' <span class="num">' + APP.phone + '</span>';
      box.insertBefore(b, box.firstChild);
    }
    $$('input, select, textarea, button', box).forEach(function (e) { if (!e.closest('.lock-keep') && !e.disabled) { e.disabled = true; e.dataset.lk = '1'; } });
  }
};
(function () {
  var t = 0, obs = new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { try { FeatUI.run(); } catch (e) { } }, 30); });
  var start = function () { var v = $('#view'); if (v && !v._fobs) { v._fobs = 1; obs.observe(v, { childList: true, subtree: true }); } };
  var sr = Shell.render; Shell.render = function () { sr.apply(this, arguments); start(); };
  document.addEventListener('DOMContentLoaded', start);
  // modals: hide switched-off rows in checkout
  var mo = new MutationObserver(function () {
    $$('.mask .modal').forEach(function (m) {
      if (!F('coupons')) { var c = $('#cpIn', m); if (c) c.closest('.px').remove(); }
      if (!F('giftcards')) { var g = $('#gcIn', m); if (g) g.closest('.px').remove(); }
    });
  });
  document.addEventListener('DOMContentLoaded', function () { mo.observe(document.body, { childList: true }); });
})();

/* ================= feature switches: developer panel + owner settings ================= */
var FeatAdmin = {
  dev: function (box) {
    var c = featCfg();
    var seg = function (k) { var v = c.dev[k] || 'on'; return '<div class="seg sm" data-fk="' + k + '">' + [['on', '✅ ' + L('شغّالة', 'On')], ['force', '🔒 ' + L('إجباري', 'Forced')], ['off', '⛔ ' + L('مقفولة ومخفية', 'Off & hidden')]].map(function (o) { return '<button data-v="' + o[0] + '" class="' + (v === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
    box.innerHTML = '<h3>🧩 ' + L('المميزات والخانات عند صاحب المحل', 'Features available to the shop') + '</h3><div class="muted small">' + L('«شغّالة»: صاحب المحل يقدر يشغّلها أو يقفلها من الإعدادات. «إجباري»: شغّالة ومايقدرش يقفلها. «مقفولة ومخفية»: بتختفي من البرنامج كله لحد ما تفتحها.', '«On»: owner can switch it. «Forced»: always on. «Off & hidden»: disappears everywhere.') + '</div>' +
      Object.keys(FEAT_GROUPS).map(function (g) { var G = FEAT_GROUPS[g]; return '<div class="feat-g"><b>' + G[0] + ' ' + L(G[1], G[2]) + '</b>' + FEATS.filter(function (f) { return f[4] === g; }).map(function (f) { return '<div class="feat-r"><span>' + f[1] + ' ' + L(f[2], f[3]) + (c.own[f[0]] === false && (c.dev[f[0]] || 'on') === 'on' ? ' <span class="chip warn">' + L('صاحب المحل قافلها', 'owner turned off') + '</span>' : '') + '</span>' + seg(f[0]) + '</div>'; }).join('') + '</div>'; }).join('') +
      '<h3 style="margin-top:18px">🔒 ' + L('قفل التعديل على صاحب المحل', 'Lock editing for the shop owner') + '</h3><div class="muted small">' + L('اللي تقفله بيفضل ظاهر وشغّال، بس صاحب المحل والموظفين مايقدروش يغيّروه. إنت (وإنت فاتح لوحة المطوّر) تقدر تعدّل عادي.', 'Locked items stay visible and working, but nobody can change them — except you while the developer panel is open.') + '</div><div class="grid g2" style="gap:6px">' +
      LOCKS.map(function (L0) { return '<label class="feat-r"><span>' + L0[1] + ' ' + L(L0[2], L0[3]) + '</span><input type="checkbox" class="sw" data-lk="' + L0[0] + '" ' + (c.lock[L0[0]] ? 'checked' : '') + '></label>'; }).join('') + '</div>' +
      '<div class="row" style="margin-top:12px"><button class="btn" id="fReset">↺ ' + L('رجّع الكل للافتراضي (كله شغّال ومفيش قفل)', 'Reset all (everything on, nothing locked)') + '</button></div>';
    $$('[data-fk]', box).forEach(function (sg) { $$('button', sg).forEach(function (b) { b.onclick = function () { var k = sg.dataset.fk; if (b.dataset.v === 'on') delete c.dev[k]; else c.dev[k] = b.dataset.v; Store.log('dev.feature', k + '=' + b.dataset.v); Store.save(); Shell.render(); go(App.view); }; }); });
    $$('[data-lk]', box).forEach(function (i) { i.onchange = function () { if (i.checked) c.lock[i.dataset.lk] = true; else delete c.lock[i.dataset.lk]; Store.log('dev.lock', i.dataset.lk + '=' + i.checked); Store.save(); }; });
    $('#fReset', box).onclick = function () { Modal.confirm(L('ترجّع كل المميزات شغّالة وتشيل كل الأقفال؟', 'Turn everything on and remove all locks?'), function () { var d = devS(); d.feat = {}; d.lock = {}; S().feat = {}; Store.log('dev.feature', 'reset'); Store.save(); Shell.render(); go(App.view); }); };
  },
  owner: function (box) {
    var c = featCfg(), list = FEATS.filter(function (f) { return c.dev[f[0]] !== 'off'; });
    box.innerHTML = '<h3>🧩 ' + L('المميزات اللي شغّالة في المحل', 'Features in use') + '</h3><div class="muted small">' + L('اقفل أي ميزة مش محتاجها فتختفي من البرنامج عند كل الموظفين، وافتحها تاني وقت ما تحب.', 'Switch off anything you do not need — it disappears for everyone.') + '</div>' +
      Object.keys(FEAT_GROUPS).map(function (g) { var G = FEAT_GROUPS[g], fs = list.filter(function (f) { return f[4] === g; }); if (!fs.length) return ''; return '<div class="feat-g"><b>' + G[0] + ' ' + L(G[1], G[2]) + '</b><div class="grid g2" style="gap:4px">' + fs.map(function (f) { var forced = c.dev[f[0]] === 'force'; return '<label class="feat-r"><span>' + f[1] + ' ' + L(f[2], f[3]) + (forced ? ' 🔒' : '') + '</span><input type="checkbox" class="sw" data-of="' + f[0] + '" ' + (F(f[0]) ? 'checked' : '') + (forced ? ' disabled' : '') + '></label>'; }).join('') + '</div></div>'; }).join('');
    $$('[data-of]', box).forEach(function (i) { i.onchange = function () { if (i.checked) delete c.own[i.dataset.of]; else c.own[i.dataset.of] = false; Store.log('feature', i.dataset.of + '=' + i.checked); Store.save(); Shell.render(); go(App.view); }; });
  }
};
(function () {
  var dv = Views.dev;
  Views.dev = function (el) { dv.apply(this, arguments); var host = $('.grid', el) || el, card = document.createElement('div'); card.className = 'card col'; card.style.gridColumn = '1 / -1'; host.insertBefore(card, host.firstChild); FeatAdmin.dev(card); };
  var st = Views.settings;
  Views.settings = function (el) { st.apply(this, arguments); var g = $('.grid', el); if (!g) return; var card = document.createElement('div'); card.className = 'card col'; card.style.gridColumn = '1 / -1'; g.appendChild(card); FeatAdmin.owner(card); var c2 = document.createElement('div'); c2.className = 'card col'; c2.dataset.feat = 'extraCfg'; g.appendChild(c2); ExtraCfg.render(c2); };
})();

/* ================= WhatsApp helper ================= */
var Wa = {
  num: function (p) { p = Phone.norm(p); if (/^01\d{9}$/.test(p)) p = '2' + p; return p; },
  open: function (phone, text) {
    var url = 'https://wa.me/' + (phone ? Wa.num(phone) : '') + '?text=' + encodeURIComponent(text);
    try { if (Desk.copy) Desk.copy(text); else navigator.clipboard.writeText(text); } catch (e) { }
    try { if (IS_ELECTRON) require('electron').shell.openExternal(url); else window.open(url, '_blank'); } catch (e) { }
    toast('📲 ' + L('بيفتح واتساب — والرسالة اتنسخت كمان لو حبيت تلصقها', 'Opening WhatsApp — the message is also copied'), 'ok');
  }
};
function extraCfg() { var s = S(); if (!s.extra) s.extra = { bdayPct: 15, bdayDays: 7, bdayMsg: 'كل سنة وإنت طيب يا {name} 🎂\nهديتك من {shop}: خصم {pct}% على أي حاجة بالكود {code}\nالكود شغّال لحد {date} — مستنيينك ✨', ownerWa: '', supMsg: 'السلام عليكم، طلب شراء من {shop}:' }; return s.extra; }
var ExtraCfg = {
  render: function (box) {
    var x = extraCfg();
    box.innerHTML = '<h3>🎂 ' + L('أعياد الميلاد والتقارير', 'Birthdays & reports') + '</h3><div class="grid g2" style="align-items:start"><div class="col" data-feat="birthdays"><b>🎂 ' + L('هدية عيد الميلاد', 'Birthday gift') + '</b><div class="ly-line">' + L('خصم', 'Discount') + ' <input class="in num" type="number" data-x="bdayPct" value="' + x.bdayPct + '"> % ' + L('صالح لمدة', 'valid for') + ' <input class="in num" type="number" data-x="bdayDays" value="' + x.bdayDays + '"> ' + L('يوم', 'days') + '</div><label class="f">' + L('الرسالة ({name} الاسم · {shop} المحل · {pct} الخصم · {code} الكود · {date} آخر يوم)', 'Message ({name} {shop} {pct} {code} {date})') + '<textarea class="in" rows="4" data-x="bdayMsg">' + U.esc(x.bdayMsg) + '</textarea></label></div>' +
      '<div class="col" data-feat="dailyReport"><b>📲 ' + L('تقرير اليوم', 'Daily report') + '</b><label class="f">' + L('رقم واتساب صاحب المحل (التقرير بيتبعتله)', 'Owner WhatsApp number') + '<input class="in num" data-x="ownerWa" value="' + U.esc(x.ownerWa) + '" style="direction:ltr;text-align:start" placeholder="01xxxxxxxxx"></label><div class="muted small">' + L('زرار «تقرير اليوم» في الرئيسية وفي التقارير بيجهّز رسالة بمبيعات وأرباح اليوم ويفتحها على واتساب.', 'The «Today report» button builds a WhatsApp summary.') + '</div></div></div>';
    $$('[data-x]', box).forEach(function (i) { i.onchange = function () { x[i.dataset.x] = i.type === 'number' ? U.n(i.value) : i.value; Store.save(); }; });
  }
};

/* ================= exchange (استبدال) ================= */
(function () {
  var op = Views.sales.open;
  Views.sales.open = function (s) {
    op.apply(this, arguments);
    var m = $$('.mask').pop(), dor = m && $('#dor', m); if (!dor || !F('exchange') || !can('pos.sell')) return;
    var b = document.createElement('button'); b.className = 'btn pri'; b.id = 'dox'; b.dataset.feat = 'exchange'; b.style.cssText = 'width:100%;margin-top:8px'; b.innerHTML = '🔁 ' + L('استبدال — العميل ياخد حاجة بدالها', 'Exchange — swap for other items');
    dor.parentNode.insertBefore(b, dor.nextSibling);
    b.onclick = function () {
      if (shiftsOn() && !App.shift) return toast(L('افتح وردية أولاً', 'Open a shift first'), 'bad');
      var items = []; $$('[data-rq]', m).forEach(function (i) { var q = Math.min(U.n(i.value), U.n(i.max)); if (q > 0) { var it = s.items[+i.dataset.rq]; items.push({ pid: it.pid, name: it.name, qty: q, price: it.price, cost: it.cost }); } });
      if (!items.length) return toast(L('حدد الكمية الراجعة من كل صنف الأول', 'Set the returned quantities first'), 'bad');
      var sub = items.reduce(function (a, i) { return a + i.qty * i.price; }, 0), ratio = s.subtotal ? s.discount / s.subtotal : 0, disc = U.r2(sub * ratio);
      App.cart = newCart(); App.cart.exch = { ref: s.id, no: s.no, items: items, sub: U.r2(sub), disc: disc, value: U.r2(sub - disc), customer: s.customer, tier: s.tier };
      App.cart.customer = s.customer || ''; if (tierAllowed(+s.tier || 0)) App.cart.tier = +s.tier || 0;
      Modal.close(m); go('pos'); toast('🔁 ' + L('امسح الأصناف الجديدة — رصيد الاستبدال ', 'Scan the new items — exchange credit ') + U.money(App.cart.exch.value), 'ok');
    };
  };
  var rd = Views.pos.render;
  Views.pos.render = function (el) {
    rd.apply(this, arguments); var x = App.cart && App.cart.exch, cart = $('.cart'); if (!x || !cart) return;
    var bn = document.createElement('div'); bn.className = 'exch-bar'; bn.dataset.feat = 'exchange';
    bn.innerHTML = '<span>🔁 ' + L('استبدال من فاتورة #', 'Exchange from #') + x.no + ' — ' + L('راجع ', 'returning ') + x.items.reduce(function (a, i) { return a + i.qty; }, 0) + L(' قطعة · رصيد ', ' pcs · credit ') + '<b class="num">' + U.money(x.value) + '</b></span><button class="btn ghost sm" id="exX">✕</button>';
    cart.insertBefore(bn, cart.firstChild);
    $('#exX').onclick = function () { App.cart.exch = null; go('pos'); };
  };
  var pay = Views.pos.pay; // allow exchange with an empty new cart? no — needs at least one item; but warn
  Views.pos.pay = function () { if (App.cart.exch && !App.cart.items.length) return toast(L('امسح الأصناف اللي العميل هياخدها بدل المرتجع', 'Scan the replacement items'), 'bad'); return pay.apply(this, arguments); };
})();

/* ================= birthdays ================= */
var Bday = {
  md: function (d) { return d ? d.slice(5, 10) : ''; },
  upcoming: function (days) {
    var out = [], now = new Date(); now.setHours(0, 0, 0, 0);
    Store.db.customers.forEach(function (c) {
      if (!c.birthday || c.birthday.length < 10) return;
      var b = new Date(now.getFullYear(), +c.birthday.slice(5, 7) - 1, +c.birthday.slice(8, 10)); if (b < now) b.setFullYear(b.getFullYear() + 1);
      var d = Math.round((b - now) / 864e5); if (d <= days) out.push({ c: c, d: d });
    });
    return out.sort(function (a, b) { return a.d - b.d; });
  },
  send: function (c) {
    var x = extraCfg(), code, till = U.today(Date.now() + U.n(x.bdayDays) * 864e5), yr = new Date().getFullYear();
    if (F('coupons') && U.n(x.bdayPct) > 0) {
      var ex = (Store.db.coupons || []).filter(function (k) { return k.cust === c.id && k.bday === yr; })[0];
      if (ex) code = ex.code; else { do { code = 'BD' + String(Math.floor(1000 + Math.random() * 9000)); } while (Coupons.find(code)); Store.db.coupons.push({ id: U.id(), code: code, type: 'pct', val: U.n(x.bdayPct), min: 0, from: U.today(), to: till, max: 1, used: 0, usedBy: [], once: true, active: true, note: '🎂 ' + c.name, cust: c.id, bday: yr, created: Date.now() }); }
    }
    var msg = x.bdayMsg.replace(/\{name\}/g, c.name.split(' ')[0]).replace(/\{shop\}/g, shopName()).replace(/\{pct\}/g, x.bdayPct).replace(/\{code\}/g, code || '').replace(/\{date\}/g, till);
    if (!code) msg = msg.split('\n').filter(function (l) { return l.indexOf('{code}') < 0 && !/بالكود|code/.test(l); }).join('\n');
    c.bdaySent = yr; Store.log('birthday.send', c.name); Store.save(); Wa.open(c.phone, msg);
  },
  card: function () {
    var list = Bday.upcoming(7); if (!list.length) return '';
    var yr = new Date().getFullYear();
    return '<div class="card bday-card" data-feat="birthdays"><h3>🎂 ' + L('أعياد ميلاد العملاء', 'Customer birthdays') + '</h3>' + list.map(function (o) { var c = o.c; return '<div class="list-row"><span class="cb-av">' + U.esc(c.name.charAt(0)) + '</span><div class="grow"><b>' + U.esc(c.name) + '</b><div class="muted small">' + (o.d === 0 ? '🎉 ' + L('النهارده!', 'Today!') : o.d === 1 ? L('بكرة', 'Tomorrow') : L('بعد ', 'in ') + o.d + L(' يوم', ' days')) + ' · <span class="num">' + U.esc(c.phone || '') + '</span></div></div>' + (c.bdaySent === yr ? '<span class="chip ok">✓ ' + L('اتبعتلها', 'Sent') + '</span>' : '') + '<button class="btn sm gold" data-bd="' + c.id + '">📲 ' + L('تهنئة + كوبون', 'Greet + coupon') + '</button></div>'; }).join('') + '</div>';
  }
};
(function () { // birthday coupons belong to one customer
  var ck = Coupons.check;
  Coupons.check = function (cp, total, cust) { if (cp && cp.cust && (!cust || cust.id !== cp.cust)) return L('الكوبون ده خاص بعميلة معيّنة — اكتب موبايلها الأول', 'This coupon belongs to a specific customer — enter their mobile first'); return ck.apply(this, arguments); };
})();

/* ================= daily report (WhatsApp) ================= */
var Daily = {
  text: function () {
    var a = dayStart(), b = a + 864e5, list = salesIn(a, b), r = sumSales(list), pays = {}, items = {};
    list.forEach(function (s) { var sg = s.type === 'return' ? -1 : 1; Object.keys(s.payments || {}).forEach(function (k) { if (k === 'exchange') return; pays[k] = (pays[k] || 0) + sg * s.payments[k]; }); if (s.credit) pays.credit = (pays.credit || 0) + sg * s.credit; s.items.forEach(function (i) { if (i.gift) return; items[i.name] = (items[i.name] || 0) + sg * i.qty; }); });
    var exp = Store.db.expenses.filter(function (e) { return e.t >= a && e.t < b; }).reduce(function (s, e) { return s + U.n(e.v); }, 0);
    var top = Object.keys(items).sort(function (x, y) { return items[y] - items[x]; }).slice(0, 5).filter(function (k) { return items[k] > 0; });
    var news = Store.db.customers.filter(function (c) { return (c.created || 0) >= a; }).length, low = Store.db.products.filter(function (p) { return p.active !== false && U.n(p.minStock) > 0 && U.n(p.stock) <= U.n(p.minStock); }).length;
    var t = ['📊 ' + L('تقرير اليوم — ', 'Today — ') + shopName(), '🗓️ ' + U.today() + ' · ' + new Date().toLocaleTimeString(lang() === 'en' ? 'en' : 'ar-EG', { hour: '2-digit', minute: '2-digit' }), '',
      '💰 ' + L('صافي المبيعات: ', 'Net sales: ') + U.money(r.total) + ' ' + cur(), '🧾 ' + L('عدد الفواتير: ', 'Invoices: ') + r.count + ' · ' + L('القطع: ', 'Items: ') + r.items];
    if (r.ret) t.push('↩️ ' + L('مرتجعات: ', 'Returns: ') + U.money(r.ret));
    if (can('reports.profit')) t.push('💹 ' + L('الربح: ', 'Profit: ') + U.money(r.profit));
    if (exp) t.push('💸 ' + L('مصروفات: ', 'Expenses: ') + U.money(exp));
    t.push('', '💳 ' + L('طرق الدفع:', 'Payments:')); Object.keys(pays).forEach(function (k) { if (pays[k]) t.push('  • ' + (k === 'credit' ? L('آجل', 'Credit') : pmName(k).replace(/^[^\wء-ي]+/, '')) + ': ' + U.money(pays[k])); });
    if (top.length) { t.push('', '🏆 ' + L('الأكثر مبيعاً:', 'Top items:')); top.forEach(function (k, i) { t.push('  ' + (i + 1) + '. ' + k + ' × ' + items[k]); }); }
    if (news) t.push('', '💞 ' + L('عملاء جدد: ', 'New customers: ') + news);
    if (low) t.push('⚠️ ' + L('أصناف قرّبت تخلص: ', 'Low-stock items: ') + low);
    t.push('', '— ' + L('غاندي', 'Ghandi Home')); return t.join('\n');
  },
  show: function () {
    var tx = Daily.text(), m = Modal.open({ title: '📲 ' + L('تقرير اليوم', 'Today report'), body: '<textarea class="in" id="drT" rows="16" style="width:100%;font-size:13px;line-height:1.7">' + U.esc(tx) + '</textarea>', foot: '<button class="btn" id="drC">📋 ' + L('نسخ', 'Copy') + '</button><button class="btn pri" id="drW">📲 ' + L('ابعت على واتساب', 'Send on WhatsApp') + '</button>' });
    $('#drC', m).onclick = function () { try { Desk.copy ? Desk.copy($('#drT', m).value) : navigator.clipboard.writeText($('#drT', m).value); } catch (e) { } toast(L('اتنسخ ✓', 'Copied ✓'), 'ok'); };
    $('#drW', m).onclick = function () { Wa.open(extraCfg().ownerWa, $('#drT', m).value); };
  }
};

/* ================= dashboard: birthdays + daily report + purchase-order shortcut ================= */
(function () {
  var db = Views.dashboard;
  Views.dashboard = function (el) {
    db.apply(this, arguments);
    var bar = document.createElement('div'); bar.className = 'row wrap dash-extra';
    bar.innerHTML = (F('dailyReport') && can('reports') ? '<button class="btn" data-feat="dailyReport" id="dDaily">📲 ' + L('تقرير اليوم واتساب', 'Today report (WhatsApp)') + '</button>' : '') + (F('porders') && can('purchases') ? '<button class="btn" data-feat="porders" id="dPo">📝 ' + L('طلب شراء للنواقص', 'Order low stock') + '</button>' : '') + (F('pricecheck') ? '<button class="btn" id="dPc" data-feat="pricecheck">🔎 ' + L('فحص السعر', 'Price check') + '</button>' : '');
    el.insertBefore(bar, el.children[1] || null);
    if ($('#dDaily')) $('#dDaily').onclick = Daily.show; if ($('#dPo')) $('#dPo').onclick = function () { PO.open(); }; if ($('#dPc')) $('#dPc').onclick = function () { go('pricecheck'); };
    if (F('birthdays') && can('customers')) { var h = Bday.card(); if (h) { var w = document.createElement('div'); w.innerHTML = h; el.insertBefore(w.firstChild, bar.nextSibling); $$('[data-bd]', el).forEach(function (b) { b.onclick = function () { Bday.send(Cust.get(b.dataset.bd)); Views.dashboard(el); }; }); } }
  };
  var rr = Views.reports.render;
  Views.reports.render = function (el) { rr.apply(this, arguments); var seg = $('#rT', el); if (seg && F('dailyReport')) { var b = document.createElement('button'); b.className = 'btn sm'; b.dataset.feat = 'dailyReport'; b.style.marginInlineStart = '10px'; b.textContent = '📲 ' + L('تقرير اليوم واتساب', 'Today report'); b.onclick = Daily.show; seg.parentNode.insertBefore(b, seg.nextSibling); } };
})();

/* ================= purchase orders (طلب شراء) ================= */
var PO = {
  low: function () { return Store.db.products.filter(function (p) { return p.active !== false && ((U.n(p.minStock) > 0 && U.n(p.stock) <= U.n(p.minStock)) || U.n(p.stock) <= 0); }); },
  open: function (po) {
    var db = Store.db; if (!db.porders) db.porders = [];
    var d = po || { id: U.id(), no: (db.seq.po = (db.seq.po || 0) + 1), date: Date.now(), supplier: '', status: 'draft', items: PO.low().map(function (p) { return { pid: p.id, qty: Math.max(1, U.n(p.minStock) * 2 - U.n(p.stock)) }; }), note: '' };
    var m = Modal.open({ size: 'wide', title: '📝 ' + L('طلب شراء #', 'Purchase order #') + d.no, body: '<div class="row wrap" style="gap:10px;margin-bottom:10px"><label class="f">' + L('المورد', 'Supplier') + '<select class="in" id="poS"><option value="">—</option>' + db.suppliers.map(function (s) { return '<option value="' + s.id + '"' + (s.id === d.supplier ? ' selected' : '') + '>' + U.esc(s.name) + '</option>'; }).join('') + '</select></label><div class="scan" style="flex:1;min-width:240px"><div class="bi">➕</div><input id="poA" placeholder="' + L('امسح أو اكتب باركود صنف تضيفه', 'Scan a barcode to add') + '"></div></div><div class="muted small" style="margin-bottom:6px">' + L('القايمة متجهّزة بالأصناف اللي رصيدها وصل لحد الطلب أو خلص. الكمية المقترحة = ضعف حد الطلب ناقص الرصيد.', 'Pre-filled with items at or below their reorder level.') + '</div><div class="tbl-wrap" id="poT" style="max-height:46vh;overflow:auto"></div><label class="f">' + L('ملاحظة', 'Note') + '<input class="in" id="poN" value="' + U.esc(d.note) + '"></label>' +
      (db.porders.length ? '<details style="margin-top:10px"><summary class="small">' + L('طلبات سابقة', 'Previous orders') + ' (' + db.porders.length + ')</summary>' + db.porders.slice().reverse().slice(0, 20).map(function (o) { var s = db.suppliers.filter(function (x) { return x.id === o.supplier; })[0]; return '<div class="list-row"><span class="grow">#' + o.no + ' · <span class="num">' + U.dt(o.date) + '</span> · ' + U.esc(s ? s.name : '—') + ' · ' + o.items.length + L(' صنف', ' items') + '</span><span class="chip ' + (o.status === 'received' ? 'ok' : 'warn') + '">' + (o.status === 'received' ? L('اتستلم', 'Received') : L('مفتوح', 'Open')) + '</span><button class="btn sm" data-po="' + o.id + '">' + L('فتح', 'Open') + '</button></div>'; }).join('') + '</details>' : ''),
      foot: '<button class="btn" id="poX">📊 Excel</button><button class="btn" id="poP">🖨️ ' + L('طباعة', 'Print') + '</button><button class="btn" id="poW">📲 ' + L('ابعت للمورد واتساب', 'WhatsApp supplier') + '</button><button class="btn" id="poSave">💾 ' + L('حفظ', 'Save') + '</button>' + (can('purchases') && F('purchases') ? '<button class="btn pri" id="poR">🚚 ' + L('البضاعة وصلت — استلام', 'Goods arrived — receive') + '</button>' : '') });
    var draw = function () {
      $('#poT', m).innerHTML = d.items.length ? '<table class="t"><tr><th>' + L('الصنف', 'Product') + '</th><th>' + L('الرصيد', 'Stock') + '</th><th>' + L('حد الطلب', 'Reorder at') + '</th><th>' + L('الكمية المطلوبة', 'Order qty') + '</th>' + (can('products.viewCost') ? '<th>' + L('التكلفة', 'Cost') + '</th>' : '') + '<th></th></tr>' + d.items.map(function (i, x) { var p = Store.product(i.pid); if (!p) return ''; return '<tr><td><b>' + U.esc(pname(p)) + '</b> <span class="muted small">' + U.esc(p.shade || '') + '</span><div class="muted small num">' + U.esc(p.barcodes[0] || '') + '</div></td><td class="num" style="color:' + (U.n(p.stock) <= 0 ? 'var(--bad)' : 'inherit') + '">' + U.n(p.stock) + '</td><td class="num">' + U.n(p.minStock) + '</td><td><input class="in num" type="number" min="0" data-q="' + x + '" value="' + i.qty + '" style="width:90px"></td>' + (can('products.viewCost') ? '<td class="num">' + U.money(i.qty * U.n(p.cost)) + '</td>' : '') + '<td><button class="btn ghost sm" data-r="' + x + '">✕</button></td></tr>'; }).join('') + '</table>' : '<div class="empty"><span class="em">📝</span>' + L('مفيش نواقص — امسح أي صنف تضيفه للطلب', 'Nothing low — scan items to add') + '</div>';
      $$('[data-q]', m).forEach(function (i) { i.onchange = function () { d.items[+i.dataset.q].qty = Math.max(0, U.n(i.value)); draw(); }; });
      $$('[data-r]', m).forEach(function (b) { b.onclick = function () { d.items.splice(+b.dataset.r, 1); draw(); }; });
    };
    var rows = function () { return d.items.filter(function (i) { return i.qty > 0 && Store.product(i.pid); }).map(function (i) { var p = Store.product(i.pid); return { p: p, q: i.qty }; }); };
    var sup = function () { return db.suppliers.filter(function (x) { return x.id === d.supplier; })[0]; };
    var save = function () { d.note = $('#poN', m).value; d.supplier = $('#poS', m).value; if (db.porders.indexOf(d) < 0) db.porders.push(d); Store.save(); };
    $('#poS', m).onchange = function () { d.supplier = this.value; };
    $('#poA', m).onkeydown = function (e) { if (e.key !== 'Enter') return; var p = Store.byBarcode(this.value); this.value = ''; if (!p) { beep(false); return; } var ex = d.items.filter(function (i) { return i.pid === p.id; })[0]; if (ex) ex.qty++; else d.items.push({ pid: p.id, qty: Math.max(1, U.n(p.minStock) || 1) }); beep(true); draw(); };
    $('#poSave', m).onclick = function () { save(); Store.log('po.save', '#' + d.no); toast(L('اتحفظ الطلب ✓', 'Order saved ✓'), 'ok'); };
    $('#poW', m).onclick = function () { save(); var s = sup(), x = extraCfg(); Wa.open(s && s.phone, x.supMsg.replace('{shop}', shopName()) + ' (#' + d.no + ')\n\n' + rows().map(function (r, i) { return (i + 1) + '. ' + r.p.name + (r.p.shade ? ' — ' + r.p.shade : '') + (r.p.brand ? ' (' + r.p.brand + ')' : '') + ' × ' + r.q; }).join('\n') + (d.note ? '\n\n📝 ' + d.note : '') + '\n\n' + L('شكراً', 'Thanks') + ' 🙏'); d.status = d.status === 'received' ? d.status : 'sent'; Store.save(); };
    $('#poX', m).onclick = function () { save(); saveBlob(XL.writeXlsx([[L('الصنف', 'Product'), L('اللون', 'Shade'), L('الماركة', 'Brand'), L('الباركود', 'Barcode'), L('الرصيد', 'Stock'), L('الكمية المطلوبة', 'Order qty')]].concat(rows().map(function (r) { return [r.p.name, r.p.shade || '', r.p.brand || '', r.p.barcodes[0] || '', U.n(r.p.stock), r.q]; })), 'PO', lang() !== 'en'), 'purchase_order_' + d.no + '.xlsx'); };
    $('#poP', m).onclick = function () { save(); var s = sup(); Printer.print('<h2>' + U.esc(shopName()) + ' — ' + L('طلب شراء #', 'Purchase order #') + d.no + '</h2><p>' + L('المورد: ', 'Supplier: ') + U.esc(s ? s.name : '—') + ' · ' + U.dt(d.date) + '</p><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:13px"><tr><th>#</th><th>' + L('الصنف', 'Product') + '</th><th>' + L('الباركود', 'Barcode') + '</th><th>' + L('الكمية', 'Qty') + '</th></tr>' + rows().map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td>' + U.esc(r.p.name) + ' ' + U.esc(r.p.shade || '') + '</td><td>' + U.esc(r.p.barcodes[0] || '') + '</td><td><b>' + r.q + '</b></td></tr>'; }).join('') + '</table>' + (d.note ? '<p>' + U.esc(d.note) + '</p>' : ''), { css: '@page{size:A4;margin:14mm}body{font-family:Tahoma,Arial}', silent: false, dir: lang() === 'en' ? 'ltr' : 'rtl' }); };
    if ($('#poR', m)) $('#poR', m).onclick = function () { save(); d.status = 'received'; Store.save(); Modal.close(m); var V = Views.purchases; V.draft = { supplier: d.supplier, ref: 'PO#' + d.no, items: rows().map(function (r) { return { pid: r.p.id, qty: r.q, cost: U.n(r.p.cost), price: priceOf(r.p, 0), isNew: false }; }), paid: 0, note: L('من طلب الشراء #', 'From PO #') + d.no, updCost: true, updPrice: true }; go('purchases'); toast('🚚 ' + L('راجع الكميات اللي وصلت فعلاً واحفظ', 'Check the quantities that arrived and save'), 'ok'); };
    $$('[data-po]', m).forEach(function (b) { b.onclick = function () { Modal.close(m); PO.open(db.porders.filter(function (o) { return o.id === b.dataset.po; })[0]); }; });
    draw();
  }
};
(function () { // purchases page button
  var r = Views.purchases.render;
  Views.purchases.render = function (el) {
    r.apply(this, arguments); var h = $('#pnew'); if (!h || Views.purchases.draft || Views.purchases.ret || !F('porders')) return;
    var b = document.createElement('button'); b.className = 'btn'; b.dataset.feat = 'porders'; b.innerHTML = '📝 ' + L('طلب شراء', 'Purchase order') + ' <span class="chip">' + PO.low().length + '</span>'; b.onclick = function () { PO.open(); };
    h.parentNode.insertBefore(b, h);
  };
})();

/* ================= price checker ================= */
Views.pricecheck = function (el) {
  el.innerHTML = '<div class="pc-wrap"><div class="pc-head">' + shopMark(54) + '<div><b style="font-size:22px">' + U.esc(shopName()) + '</b><div class="muted">🔎 ' + L('امسحي باركود أي حاجة واعرفي سعرها', 'Scan any item to see its price') + '</div></div><div class="grow"></div><button class="btn" id="pcX">✕ ' + L('خروج', 'Exit') + '</button></div><div class="scan pc-scan"><div class="bi">🔎</div><input id="pcIn" autocomplete="off" placeholder="' + L('امسح الباركود هنا…', 'Scan the barcode…') + '"></div><div id="pcOut" class="pc-out"><div class="pc-idle"><div style="font-size:90px">🏷️</div><div style="font-size:24px">' + L('قرّبي الباركود من القارئ', 'Bring the barcode to the scanner') + '</div></div></div></div>';
  var t0; var inp = $('#pcIn');
  var show = function (p) {
    clearTimeout(t0);
    if (!p) { beep(false); $('#pcOut').innerHTML = '<div class="pc-idle"><div style="font-size:80px">🤷‍♀️</div><div style="font-size:24px">' + L('الصنف ده مش متسجّل — اسألي الكاشير', 'Not found — please ask the cashier') + '</div></div>'; }
    else {
      beep(true); var pr = (Views.pos.price || Promo.price)(p, 0);
      $('#pcOut').innerHTML = '<div class="pc-card"><div class="pc-img">' + (p.img && F('images') ? '<div style="background-image:url(' + p.img + ')"></div>' : '<span>' + prodEmoji(p) + '</span>') + '</div><div class="pc-info"><div class="pc-name">' + U.esc(pname(p)) + '</div>' + (p.shade ? '<div class="muted" style="font-size:20px">' + U.esc(p.shade) + '</div>' : '') + (p.brand ? '<div class="chip">' + U.esc(p.brand) + '</div>' : '') +
        '<div class="pc-price">' + (pr.base && pr.base > pr.price ? '<s>' + U.money(pr.base) + '</s> ' : '') + '<b>' + U.money(pr.price) + '</b> <small>' + cur() + '</small></div>' + (pr.promo ? '<div class="chip ok" style="font-size:18px">🎁 ' + U.esc(pr.promo.name || '') + (pr.pct ? ' −' + pr.pct + '%' : '') + '</div>' : '') +
        '<div class="muted" style="font-size:18px;margin-top:10px">' + (U.n(p.stock) > 0 ? '✅ ' + L('متوفر', 'In stock') : '⏳ ' + L('خلصان دلوقتي', 'Out of stock')) + '</div></div></div>';
    }
    t0 = setTimeout(function () { var o = $('#pcOut'); if (o) o.innerHTML = '<div class="pc-idle"><div style="font-size:90px">🏷️</div><div style="font-size:24px">' + L('قرّبي الباركود من القارئ', 'Bring the barcode to the scanner') + '</div></div>'; }, 15000);
  };
  inp.onkeydown = function (e) { if (e.key === 'Enter') { var v = this.value.trim(); this.value = ''; if (v) show(Store.byBarcode(v)); } if (e.key === 'Escape') go('pos'); };
  inp.onblur = function () { setTimeout(function () { if ($('#pcIn') && !$('.mask')) $('#pcIn').focus(); }, 200); };
  $('#pcX').onclick = function () { go(can('pos.sell') ? 'pos' : 'dashboard'); };
  inp.focus();
};
(function () {
  NAV.splice(NAV.findIndex(function (n) { return n[0] === 'sales'; }) + 1, 0, ['pricecheck', 'search', 'فحص السعر', 'Price checker', null]);
  if (typeof NAV_GEMS !== 'undefined') NAV_GEMS.pricecheck = ['🔎', 'g-sapphire'];
  var pr = Views.pos.render;
  Views.pos.render = function (el) { pr.apply(this, arguments); var bar = $('.pos-extra'); if (bar && F('pricecheck')) { var b = document.createElement('button'); b.className = 'btn sm'; b.id = 'xPc'; b.innerHTML = '🔎 ' + L('فحص سعر', 'Price check'); b.onclick = function () { go('pricecheck'); }; bar.appendChild(b); } };
})();

if (typeof Updater !== 'undefined') Updater.notes['1.7.0'] = ['🔁 الاستبدال في خطوة واحدة: المرتجع والبيع الجديد في فاتورة واحدة والبرنامج يحسب الفرق', '🎂 أعياد ميلاد العملاء في الرئيسية + تهنئة واتساب بكوبون خصم خاص', '📝 طلب شراء للمورد بالنواقص: طباعة وواتساب وإكسيل، ولما البضاعة توصل يتحول لاستلام', '🔎 شاشة فحص السعر للعملاء', '📲 تقرير اليوم على واتساب لصاحب المحل', '🧩 من الإعدادات: شغّل أو اقفل أي ميزة في البرنامج'];
