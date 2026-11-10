/* =========================================================
   Ghandi Home — core of the home-goods / bridal / carpets & curtains edition
   helpers · registration (features, permissions, menu) · selling by metre ·
   warehouses · professional A4 invoice · amount in words · home settings
   Developer: Eng. Mohamed Ali — 01098811581
   ========================================================= */
'use strict';

/* ---------- data defaults ---------- */
(function () {
  var d0 = defaultDB;
  defaultDB = function () {
    var d = d0();
    d.inst = []; d.brides = []; d.orders = []; d.deliveries = []; d.quotes = []; d.transfers = [];
    ['inst', 'bride', 'order', 'delivery', 'quote', 'transfer'].forEach(function (k) { d.seq[k] = 0; });
    return d;
  };
  var mg = Store.migrate;
  Store.migrate = function (db) { db = mg.apply(this, arguments); ['inst', 'bride', 'order', 'delivery', 'quote', 'transfer'].forEach(function (k) { if (db.seq[k] == null) db.seq[k] = 0; }); return db; };
})();
function homeCfg() {
  var s = S();
  if (!s.home) s.home = {};
  var h = s.home, d = {
    whs: [{ id: 'main', name: 'المعرض' }, { id: 'store', name: 'المخزن الرئيسي' }], saleWh: 'main', inWh: 'main',
    instType: 'monthly', instRate: 2, instRound: 5, instMonths: 12, instDownPct: 20, instGrace: 3, instLateFee: 0, instGuarantors: 1, instWarnDays: 3,
    instTerms: 'أقر أنا الموقع أدناه (المشتري) بأنني استلمت البضاعة الموضحة بهذا العقد بحالة جيدة، وأتعهد بسداد الأقساط في مواعيدها المحددة.\nفي حالة التأخر عن سداد قسطين متتاليين يحق للبائع المطالبة بكامل المبلغ المتبقي فوراً.\nيقر الضامن بأنه ضامن متضامن مع المشتري في سداد كامل المديونية.\nلا يجوز للمشتري التصرف في البضاعة بالبيع أو الرهن قبل سداد كامل الثمن.',
    fullness: 2.5, hem: 0.4, tailorM: 40, installFee: 0, deliveryFee: 0,
    staff: ['فني التركيب', 'السائق'],
    a4Terms: 'البضاعة المباعة تستبدل خلال 14 يوماً من تاريخ الشراء بالفاتورة وبحالتها الأصلية.\nالأجهزة الكهربائية يسري عليها ضمان الشركة المصنعة.\nالسجاد والستائر المفصلة حسب الطلب لا ترد ولا تستبدل.',
    a4Sign: true, a4Words: true, a4Printer: '', a4Stamp: '', quoteDays: 7, brideAlertDays: 30
  };
  Object.keys(d).forEach(function (k) { if (h[k] === undefined) h[k] = d[k]; });
  return h;
}

/* ---------- small helpers shared by every home module ---------- */
var H = {
  cust: function (id) { return id ? Cust.get(id) : null; },
  custName: function (id) { var c = H.cust(id); return c ? c.name : '—'; },
  sum: function (a, f) { return (a || []).reduce(function (s, x) { return s + U.n(f ? f(x) : x); }, 0); },
  paid: function (o) { return U.r2(H.sum(o.pays, function (p) { return p.v; })); },
  daysTo: function (d) { if (!d) return null; var a = new Date(String(d).slice(0, 10) + 'T00:00:00').getTime(), b = dayStart(); return Math.round((a - b) / 864e5); },
  addMonths: function (dateStr, n) {
    var d = new Date(dateStr + 'T00:00:00'), day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last));
    return U.today(d);
  },
  pmSelect: function (id, sel) { return '<select class="in" id="' + id + '">' + S().payMethods.map(function (p) { return '<option value="' + p[0] + '"' + (p[0] === sel ? ' selected' : '') + '>' + (lang() === 'en' ? p[2] : p[1]) + '</option>'; }).join('') + '</select>'; },
  pay: function (list, v, m, extra) { var p = { t: Date.now(), v: U.r2(v), m: m || 'cash', shift: App.shift ? App.shift.id : '', by: App.user ? App.user.name : '' }; if (extra) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; }); list.push(p); if (p.m === 'cash' && typeof Drawer !== 'undefined') try { Drawer.auto({ type: 'sale', payments: { cash: p.v }, no: 'C' }); } catch (e) { } return p; },
  chip: function (txt, cls) { return '<span class="chip ' + (cls || '') + '">' + txt + '</span>'; },
  wa: function (phone, text) { if (!phone) return toast(L('مفيش رقم موبايل', 'No mobile number'), 'bad'); Wa.open(phone, text); },
  fill: function (tpl, o) { return String(tpl || '').replace(/\{(\w+)\}/g, function (a, k) { return o[k] != null ? o[k] : a; }); },
  // customer picker: phone + name; returns {get: fn -> customer or null (creates if new)}
  custBox: function (box, preId, src) {
    var c0 = H.cust(preId);
    box.innerHTML = '<div class="grid g2"><label class="f">' + L('موبايل العميل *', 'Customer mobile *') + '<input class="in num" data-cph value="' + U.esc(c0 ? c0.phone : '') + '" placeholder="01xxxxxxxxx"></label><label class="f">' + L('اسم العميل *', 'Customer name *') + '<input class="in" data-cnm value="' + U.esc(c0 ? c0.name : '') + '"></label></div><div class="muted small" data-cmsg></div>';
    var ph = $('[data-cph]', box), nm = $('[data-cnm]', box), msg = $('[data-cmsg]', box), found = c0;
    var look = function () { var c = Cust.byPhone(ph.value); found = c; if (c) { nm.value = c.name; msg.innerHTML = '✅ ' + L('عميل مسجّل', 'Existing customer') + (U.n(c.balance) > 0 ? ' · <span style="color:var(--bad)">' + L('عليه آجل ', 'owes ') + U.money(c.balance) + '</span>' : ''); } else msg.innerHTML = ph.value.length >= 8 ? '🆕 ' + L('عميل جديد — هيتسجل تلقائي', 'New customer — will be added') : ''; };
    ph.oninput = look; if (c0) look();
    return {
      get: function () {
        var p = Phone.norm(ph.value), n = nm.value.trim();
        if (found && Phone.norm(found.phone) === p) { if (n && n !== found.name) found.name = n; return found; }
        if (!Phone.valid(p)) { toast(L('اكتب رقم موبايل صحيح', 'Enter a valid mobile'), 'bad'); ph.focus(); return null; }
        if (!n) { toast(L('اكتب اسم العميل', 'Enter the customer name'), 'bad'); nm.focus(); return null; }
        return Cust.byPhone(p) || Cust.create(p, n, src || 'home');
      }
    };
  },
  // product search box with dropdown
  prodPick: function (input, onPick, opt) {
    opt = opt || {};
    var dd = document.createElement('div'); dd.className = 'pp-dd hide'; input.parentNode.style.position = 'relative'; input.parentNode.appendChild(dd);
    var hits = [], sel = 0;
    var draw = function () {
      var q = U.norm(input.value); if (!q) { dd.classList.add('hide'); return; }
      var bc = Store.byBarcode(input.value.trim());
      hits = bc ? [bc] : Store.db.products.filter(function (p) { return p.active !== false && (!opt.filter || opt.filter(p)) && U.norm(p.name + ' ' + (p.nameEn || '') + ' ' + (p.brand || '') + ' ' + (p.shade || '') + ' ' + (p.size || '') + ' ' + (p.cat || '')).indexOf(q) >= 0; }).slice(0, 12);
      sel = 0;
      dd.innerHTML = hits.length ? hits.map(function (p, i) { return '<div class="pp-it' + (i === sel ? ' on' : '') + '" data-i="' + i + '">' + prodGem(p, 'sm') + '<div class="grow"><b>' + U.esc(pname(p)) + '</b>' + (p.shade ? ' · ' + U.esc(p.shade) : '') + (p.size ? ' · ' + U.esc(p.size) : '') + '<div class="muted small">' + U.esc(p.cat || '') + ' · ' + U.money(U.n((p.prices || [])[0])) + ' / ' + U.esc(Meas.unitName(p)) + (can('stock.viewQty') ? ' · ' + L('رصيد ', 'stock ') + U.n(p.stock) : '') + '</div></div></div>'; }).join('') : '<div class="pp-it muted">' + L('مفيش نتيجة', 'No match') + '</div>';
      dd.classList.remove('hide');
      $$('[data-i]', dd).forEach(function (r) { r.onmousedown = function (e) { e.preventDefault(); pick(+r.dataset.i); }; });
    };
    var pick = function (i) { var p = hits[i]; if (!p) return; dd.classList.add('hide'); input.value = ''; onPick(p); };
    input.oninput = draw; input.onblur = function () { setTimeout(function () { dd.classList.add('hide'); }, 150); };
    input.onkeydown = function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, Math.min(hits.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1))); $$('.pp-it', dd).forEach(function (x, i) { x.classList.toggle('on', i === sel); }); }
      else if (e.key === 'Enter') { e.preventDefault(); if (!hits.length) draw(); pick(sel); }
      else if (e.key === 'Escape') dd.classList.add('hide');
    };
  },
  // generic "collect money" dialog → cb({v, m}) ; allowLess lets the rest go on account
  collect: function (title, due, cb, o) {
    o = o || {};
    var m = Modal.open({ title: title, body: '<div class="col"><div class="card kpi hero"><div class="l">' + (o.label || L('المطلوب', 'Due')) + '</div><div class="v num">' + U.money(due) + '</div>' + (o.sub ? '<div class="small">' + o.sub + '</div>' : '') + '</div><label class="f">' + L('المبلغ المدفوع', 'Amount paid') + '<input class="in num" type="number" id="hcV" autofocus value="' + U.r2(o.def != null ? o.def : due) + '" style="font-size:20px"></label><label class="f">' + L('طريقة الدفع', 'Method') + H.pmSelect('hcM', 'cash') + '</label>' + (o.extra || '') + '<div class="muted small" id="hcR"></div></div>',
      foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri lg" id="hcGo">✅ ' + (o.btn || L('تأكيد', 'Confirm')) + '</button>' });
    var r = function () { var v = U.n($('#hcV', m).value), rem = U.r2(due - v); $('#hcR', m).innerHTML = rem > 0.009 ? '⚠️ ' + L('متبقي ', 'Remaining ') + U.money(rem) + (o.restNote ? ' — ' + o.restNote : '') : (rem < -0.009 ? '💵 ' + L('الباقي للعميل ', 'Change ') + U.money(-rem) : '✅'); };
    $('#hcV', m).oninput = r; r();
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#hcGo', m).onclick = function () { var v = U.r2(U.n($('#hcV', m).value)); if (v < 0) return; if (o.max != null && v > o.max + 0.009) return toast(L('المبلغ أكبر من المطلوب', 'Amount exceeds the due'), 'bad'); if (cb({ v: v, m: $('#hcM', m).value, modal: m }) !== false) Modal.close(m); };
    $('#hcV', m).onkeydown = function (e) { if (e.key === 'Enter') $('#hcGo', m).click(); };
    return m;
  },
  tabs: function (id, list, cur) { return '<div class="seg" id="' + id + '">' + list.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (t[0] === cur ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>'; },
  bindTabs: function (id, cb) { $$('#' + id + ' [data-t]').forEach(function (b) { b.onclick = function () { cb(b.dataset.t); }; }); }
};

/* ---------- amount in Arabic words (تفقيط) ---------- */
var Tafqeet = {
  ones: ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'],
  teens: ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'],
  tens: ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'],
  hund: ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'],
  under1000: function (n) {
    var T = Tafqeet, h = Math.floor(n / 100), r = n % 100, out = [];
    if (h) out.push(T.hund[h]);
    if (r) { if (r < 10) out.push(T.ones[r]); else if (r < 20) out.push(T.teens[r - 10]); else { var o = r % 10, t = Math.floor(r / 10); out.push(o ? T.ones[o] + ' و' + T.tens[t] : T.tens[t]); } }
    return out.join(' و');
  },
  scale: function (n, one, two, few, many) { if (n === 1) return one; if (n === 2) return two; if (n >= 3 && n <= 10) return Tafqeet.under1000(n) + ' ' + few; return Tafqeet.under1000(n) + ' ' + many; },
  int: function (n) {
    n = Math.floor(Math.abs(n)); if (!n) return 'صفر';
    var T = Tafqeet, parts = [], b = Math.floor(n / 1e9), mi = Math.floor(n % 1e9 / 1e6), th = Math.floor(n % 1e6 / 1000), r = n % 1000;
    if (b) parts.push(T.scale(b, 'مليار', 'ملياران', 'مليارات', 'مليار'));
    if (mi) parts.push(T.scale(mi, 'مليون', 'مليونان', 'ملايين', 'مليون'));
    if (th) parts.push(T.scale(th, 'ألف', 'ألفان', 'آلاف', 'ألف'));
    if (r) parts.push(T.under1000(r));
    return parts.join(' و');
  },
  money: function (v) {
    v = U.r2(Math.abs(v)); var g = Math.floor(v), p = Math.round((v - g) * 100), cu = S().currency || 'ج.م';
    var big = /ج|جنيه|EGP/i.test(cu) ? 'جنيهاً مصرياً' : /ر\.?س|ريال/.test(cu) ? 'ريالاً' : /د\.?إ|درهم/.test(cu) ? 'درهماً' : /د\.?ك|دينار/.test(cu) ? 'ديناراً' : cu;
    var small = /ج|جنيه|EGP/i.test(cu) ? 'قرشاً' : /ريال/.test(cu) ? 'هللة' : 'من مائة';
    return 'فقط ' + Tafqeet.int(g) + ' ' + big + (p ? ' و' + Tafqeet.int(p) + ' ' + small : '') + ' لا غير';
  }
};

/* ---------- registration: features, permissions, menu ---------- */
(function () {
  FEAT_GROUPS.home = ['🏠', 'المعرض والتقسيط', 'Showroom & instalments'];
  [['inst', '🏦', 'البيع بالتقسيط والضامنين', 'Instalment sales', 'home', ['inst', 'inst.create', 'inst.collect', 'inst.void'], ['installments']],
   ['brides', '💍', 'ملفات تجهيز العرائس', 'Bridal files', 'home', ['brides'], ['brides']],
   ['orders', '🪟', 'تفصيل الستائر والسجاد (أوامر الشغل)', 'Curtain & carpet orders', 'home', ['orders'], ['orders']],
   ['deliveries', '🚚', 'التوصيل والتركيب', 'Delivery & installation', 'home', ['deliveries'], ['deliveries']],
   ['quotes', '📝', 'عروض الأسعار', 'Quotations', 'home', ['quotes'], ['quotes']],
   ['warehouses', '🏬', 'المخازن المتعددة والتحويل', 'Warehouses & transfers', 'stock', ['warehouses'], ['warehouses']],
   ['warranty', '🛡️', 'الضمان', 'Warranty', 'home', [], ['warranty']],
   ['meters', '📏', 'البيع بالمتر (سجاد وستائر)', 'Selling by metre', 'sell'],
   ['a4', '📄', 'الفاتورة A4 الاحترافية', 'Professional A4 invoice', 'sell']
  ].forEach(function (f) { FEATS.push(f); (f[5] || []).forEach(function (p) { FEAT_BY_PERM[p] = f[0]; }); (f[6] || []).forEach(function (v) { FEAT_BY_VIEW[v] = f[0]; }); });

  var at = function (key) { for (var i = 0; i < PERMS.length; i++) if (PERMS[i][0] === key) return i; return PERMS.length; };
  PERMS.splice(at('g') >= 0 ? at('layaway') + 1 : PERMS.length, 0,
    ['g', 'المعرض والتقسيط', 'Showroom & instalments'],
    ['inst', 'عرض الأقساط والعقود', 'View instalments'],
    ['inst.create', 'عمل عقد تقسيط جديد', 'Create instalment contracts'],
    ['inst.collect', 'تحصيل الأقساط', 'Collect instalments'],
    ['inst.void', 'إلغاء عقد تقسيط / خصم السداد المبكر', 'Cancel contract / early-settlement discount'],
    ['brides', 'ملفات العرائس', 'Bridal files'],
    ['orders', 'أوامر تفصيل الستائر والسجاد', 'Curtain & carpet orders'],
    ['deliveries', 'التوصيل والتركيب', 'Delivery & installation'],
    ['quotes', 'عروض الأسعار', 'Quotations'],
    ['warehouses', 'المخازن والتحويل بينها', 'Warehouses & transfers']);
  var cash0 = ROLE_PRESETS.cashier;
  ROLE_PRESETS.cashier = function () { var o = cash0(); ['inst', 'inst.collect', 'brides', 'orders', 'deliveries', 'quotes'].forEach(function (k) { o[k] = true; }); return o; };
  var man0 = ROLE_PRESETS.manager;
  ROLE_PRESETS.manager = function () { var o = man0(); ['inst', 'inst.create', 'inst.collect', 'brides', 'orders', 'deliveries', 'quotes', 'warehouses'].forEach(function (k) { o[k] = true; }); return o; };

  var idx = function (k) { for (var i = 0; i < NAV.length; i++) if (NAV[i][0] === k) return i; return -1; };
  NAV.splice(idx('sales') + 1, 0,
    ['quotes', 'file', 'عروض الأسعار', 'Quotations', 'quotes'],
    ['sep', '', 'المعرض', 'Showroom'],
    ['installments', 'wallet', 'التقسيط والأقساط', 'Instalments', 'inst'],
    ['brides', 'gift', 'تجهيز العرائس', 'Bridal files', 'brides'],
    ['orders', 'edit', 'تفصيل ستائر وسجاد', 'Curtain & carpet orders', 'orders'],
    ['deliveries', 'truck', 'التوصيل والتركيب', 'Delivery & installation', 'deliveries'],
    ['warranty', 'shield', 'الضمان', 'Warranty', 'sales.history|customers']);
  NAV.splice(idx('purchases') + 1, 0, ['warehouses', 'box', 'المخازن والتحويل', 'Warehouses', 'warehouses']);
  if (typeof NAV_GEMS !== 'undefined') { NAV_GEMS.installments = ['🏦', 'g-emerald']; NAV_GEMS.brides = ['💍', 'g-rose']; NAV_GEMS.orders = ['🪟', 'g-aqua']; NAV_GEMS.deliveries = ['🚚', 'g-gold']; NAV_GEMS.quotes = ['📝', 'g-sapphire']; NAV_GEMS.warehouses = ['🏬', 'g-onyx']; NAV_GEMS.warranty = ['🛡️', 'g-amethyst']; }
  // elegant themes first (home-goods look), girly ones last
  if (typeof SKINS !== 'undefined') { var rk = { el: 0, o: 1, gi: 2, pr: 3 }; SKINS.sort(function (a, b) { return rk[a[4] || 'o'] - rk[b[4] || 'o']; }); }

  var pm = pmName;
  pmName = function (k) { return { inst: '🏦 ' + L('تقسيط', 'Instalments'), bride: '💍 ' + L('من مدفوعات العروسة', 'Bridal deposits'), order: '🧵 ' + L('من عربون أمر الشغل', 'Order deposit'), quote: '📝' }[k] || pm(k); };

  // money collected outside invoices (instalments, bridal & order deposits) counts in the shift
  var sc = Views.shifts.calc;
  Views.shifts.calc = function (sh) {
    var r = sc.apply(this, arguments), add = function (p) { if (p.shift !== sh.id) return; if ((p.m || 'cash') === 'cash') { r.coll += U.n(p.v); } else r.other[p.m] = (r.other[p.m] || 0) + U.n(p.v); };
    var db = Store.db;
    (db.inst || []).forEach(function (c) { (c.pays || []).forEach(add); });
    (db.brides || []).forEach(function (b) { (b.pays || []).forEach(add); });
    (db.orders || []).forEach(function (o) { (o.pays || []).forEach(add); });
    r.expected = U.r2(U.n(sh.openCash) + r.cash - r.exp + r.coll); return r;
  };
})();

/* ================= selling by metre (carpets & curtains) ================= */
var Meas = {
  unitName: function (p) { return { m: L('متر', 'm'), m2: L('م²', 'm²'), set: L('طقم', 'set') }[p && p.sellBy] || (p && p.unit) || L('قطعة', 'pc'); },
  isMeas: function (p) { return p && (p.sellBy === 'm' || p.sellBy === 'm2') && F('meters'); },
  ask: function (p, cb) {
    var a = p.sellBy === 'm2', rw = U.n(p.rollW);
    var m = Modal.open({ title: (a ? '🧶 ' : '📏 ') + U.esc(pname(p)), body: '<div class="col"><div class="muted">' + (a ? L('اكتب الطول والعرض بالمتر — الكمية = الطول × العرض', 'Enter length and width in metres — qty = L × W') : L('اكتب الطول بالمتر', 'Enter the length in metres')) + '</div><div class="grid ' + (a ? 'g2' : '') + '"><label class="f">' + L('الطول (م)', 'Length (m)') + '<input class="in num" type="number" step="0.01" id="mL" autofocus style="font-size:22px"></label>' + (a ? '<label class="f">' + L('العرض (م)', 'Width (m)') + '<input class="in num" type="number" step="0.01" id="mW" value="' + (rw || '') + '" style="font-size:22px"></label>' : '') + '</div>' +
      '<label class="f">' + L('عدد القطع بنفس المقاس', 'Pieces of this size') + '<input class="in num" type="number" id="mN" value="1" min="1"></label><div class="card kpi hero"><div class="l">' + L('الكمية', 'Quantity') + '</div><div class="v num" id="mQ">0</div><div class="small" id="mP"></div></div>' + (can('stock.viewQty') ? '<div class="muted small">' + L('المتاح: ', 'Available: ') + U.n(p.stock) + ' ' + Meas.unitName(p) + '</div>' : '') + '</div>',
      foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri lg" id="mGo">➕ ' + L('إضافة للفاتورة', 'Add to invoice') + '</button>' });
    var price = (Views.pos.price || Promo.price)(p, App.cart ? App.cart.tier : 0).price;
    var calc = function () { var l = U.n($('#mL', m).value), w = a ? U.n($('#mW', m).value) : 1, n = Math.max(1, Math.round(U.n($('#mN', m).value) || 1)), q = U.r2(l * w * n); $('#mQ', m).textContent = q + ' ' + Meas.unitName(p); $('#mP', m).textContent = U.money(price) + ' × ' + q + ' = ' + U.money(price * q) + ' ' + cur(); return { l: l, w: w, n: n, q: q }; };
    $$('input', m).forEach(function (i) { i.oninput = calc; i.onkeydown = function (e) { if (e.key === 'Enter') $('#mGo', m).click(); }; }); calc();
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#mGo', m).onclick = function () { var r = calc(); if (r.q <= 0) return toast(L('اكتب المقاس', 'Enter the size'), 'bad'); Modal.close(m); cb(r); };
  },
  label: function (p, r) { return pname(p) + ' (' + (p.sellBy === 'm2' ? U.r2(r.l) + '×' + U.r2(r.w) + L(' م', ' m') : U.r2(r.l) + L(' م', ' m')) + (r.n > 1 ? ' ×' + r.n : '') + ')'; }
};
(function () {
  var add0 = Views.pos.add;
  Views.pos.add = function (p, qty) {
    if (!Meas.isMeas(p) || qty === -1) return add0.apply(this, arguments);
    var c = App.cart;
    if (p.active === false) { beep(false); return toast('⏸️ ' + L('الصنف ده موقوف', 'This product is stopped'), 'bad'); }
    Meas.ask(p, function (r) {
      var inCart = c.items.filter(function (x) { return x.pid === p.id; }).reduce(function (s, x) { return s + x.qty; }, 0);
      if (!S().allowNegativeStock && inCart + r.q > U.n(p.stock) + 1e-9) { beep(false); return toast(L('المتاح بالمخزن ', 'Available ') + U.n(p.stock) + ' ' + Meas.unitName(p), 'bad'); }
      var pr = (Views.pos.price || Promo.price)(p, c.tier);
      c.items.push({ pid: p.id, name: Meas.label(p, r), qty: r.q, price: pr.price, base: pr.base, promo: pr.promo ? pr.promo.name : '', cost: U.n(p.cost), manual: false, meas: 1 });
      c.sel = c.items.length - 1; beep(true); Views.pos.draw();
    });
  };
})();

/* ================= warehouses ================= */
var Wh = {
  list: function () { return homeCfg().whs; },
  name: function (id) { var w = Wh.list().filter(function (x) { return x.id === id; })[0]; return w ? w.name : id; },
  def: function () { var h = homeCfg(); return Wh.list().some(function (w) { return w.id === h.saleWh; }) ? h.saleWh : Wh.list()[0].id; },
  inDef: function () { var h = homeCfg(); return Wh.list().some(function (w) { return w.id === h.inWh; }) ? h.inWh : Wh.def(); },
  // keep the per-warehouse split in line with the product total (anything unassigned sits in the sales warehouse)
  ensure: function (p) {
    if (!p.wh) p.wh = {}; var ids = Wh.list().map(function (w) { return w.id; }), s = 0;
    Object.keys(p.wh).forEach(function (k) { if (ids.indexOf(k) < 0) { p.wh[Wh.def()] = U.n(p.wh[Wh.def()]) + U.n(p.wh[k]); delete p.wh[k]; } });
    ids.forEach(function (k) { if (k !== Wh.def()) s += U.n(p.wh[k]); });
    p.wh[Wh.def()] = U.r2(U.n(p.stock) - s);
    return p.wh;
  },
  qty: function (p, id) { Wh.ensure(p); return U.r2(U.n(p.wh[id])); },
  ctx: null,
  apply: function (p, q, type) {
    Wh.ensure(p); var w = p.wh, d = Wh.def();
    if (q > 0) { var to = Wh.ctx || (/^(return|void|unreserve|undo)$/.test(type) ? d : Wh.inDef()); w[to] = U.r2(U.n(w[to]) + q); }
    else if (q < 0) {
      var need = -q, order = [Wh.ctx || d].concat(Wh.list().map(function (x) { return x.id; }).filter(function (x) { return x !== (Wh.ctx || d); }));
      order.forEach(function (id) { if (need <= 0) return; var take = Math.min(need, Math.max(0, U.n(w[id]))); w[id] = U.r2(U.n(w[id]) - take); need = U.r2(need - take); });
      if (need > 0) w[order[0]] = U.r2(U.n(w[order[0]]) - need);
    }
    // the sales warehouse absorbs any rounding so the split always sums to the total
    var s = 0; Object.keys(w).forEach(function (k) { if (k !== d) s += U.n(w[k]); }); w[d] = U.r2(U.n(p.stock) - s);
  }
};
(function () {
  var mv = Store.move;
  Store.move = function (pid, qty, type, ref) {
    var p = Store.product(pid); if (p) Wh.ensure(p);
    var before = p ? U.n(p.stock) : 0, r = mv.apply(this, arguments);
    if (p) { var d = U.r2(U.n(p.stock) - before); p.stock = U.r2(p.stock); if (d) Wh.apply(p, d, type); }
    return r;
  };
})();

Views.warehouses = {
  tab: 'stock', q: '', w: '',
  render: function (el) {
    var V = Views.warehouses, h = homeCfg(), ws = Wh.list(), db = Store.db;
    var tot = ws.map(function (w) { var q = 0, v = 0, n = 0; db.products.forEach(function (p) { var x = Wh.qty(p, w.id); if (x > 0) { q += x; v += x * U.n(p.cost); n++; } }); return { w: w, q: q, v: v, n: n }; });
    el.innerHTML = '<div class="grid g4" style="margin-bottom:14px">' + tot.map(function (t) { return '<div class="card kpi' + (t.w.id === Wh.def() ? ' hero' : '') + '"><div class="l">🏬 ' + U.esc(t.w.name) + (t.w.id === Wh.def() ? ' · ' + L('البيع منه', 'sells from here') : '') + '</div><div class="v num">' + U.r2(t.q) + '</div><div class="small' + (t.w.id === Wh.def() ? '' : ' muted') + '">' + t.n + L(' صنف', ' items') + (can('products.viewCost') ? ' · ' + L('بالتكلفة ', 'at cost ') + U.money(t.v) : '') + '</div></div>'; }).join('') + '</div>' +
      '<div class="row wrap" style="margin-bottom:12px">' + H.tabs('whT', [['stock', '📦 ' + L('الأرصدة في كل مخزن', 'Stock per warehouse')], ['tr', '🔁 ' + L('التحويلات', 'Transfers')], ['cfg', '⚙️ ' + L('المخازن', 'Warehouses')]], V.tab) + '<div class="grow"></div><button class="btn pri" id="whNew">🔁 ' + L('تحويل بين المخازن', 'New transfer') + '</button></div><div id="whB"></div>';
    H.bindTabs('whT', function (t) { V.tab = t; V.render(el); });
    $('#whNew').onclick = function () { V.transfer(el); };
    var B = $('#whB');
    if (V.tab === 'stock') {
      B.innerHTML = '<div class="row" style="margin-bottom:10px"><input class="in" id="whQ" style="width:280px" placeholder="🔎 ' + L('ابحث بالاسم أو الباركود…', 'Search…') + '" value="' + U.esc(V.q) + '"><select class="in" id="whF" style="width:200px"><option value="">' + L('كل الأصناف', 'All items') + '</option>' + ws.map(function (w) { return '<option value="' + w.id + '"' + (V.w === w.id ? ' selected' : '') + '>' + L('اللي في ', 'In ') + U.esc(w.name) + '</option>'; }).join('') + '</select></div><div class="tbl-wrap" id="whTb"></div>';
      var draw = function () {
        var q = U.norm(V.q), rows = db.products.filter(function (p) { return (!q || U.norm(p.name + ' ' + (p.shade || '') + ' ' + p.barcodes.join(' ')).indexOf(q) >= 0) && (!V.w || Wh.qty(p, V.w) > 0); }).slice(0, 400);
        $('#whTb').innerHTML = '<table class="t"><tr><th>' + L('الصنف', 'Product') + '</th>' + ws.map(function (w) { return '<th>' + U.esc(w.name) + '</th>'; }).join('') + '<th>' + L('الإجمالي', 'Total') + '</th></tr>' + rows.map(function (p) { return '<tr><td><b>' + U.esc(pname(p)) + '</b>' + (p.shade ? ' <span class="muted small">' + U.esc(p.shade) + '</span>' : '') + '</td>' + ws.map(function (w) { var x = Wh.qty(p, w.id); return '<td class="num" style="' + (x < 0 ? 'color:var(--bad)' : x ? 'font-weight:700' : 'opacity:.4') + '">' + x + '</td>'; }).join('') + '<td class="num"><b>' + U.r2(p.stock) + '</b> <span class="muted small">' + U.esc(Meas.unitName(p)) + '</span></td></tr>'; }).join('') + '</table>';
      };
      $('#whQ').oninput = function () { V.q = this.value; draw(); }; $('#whF').onchange = function () { V.w = this.value; draw(); }; draw();
    } else if (V.tab === 'tr') {
      var tl = db.transfers.slice().reverse();
      B.innerHTML = tl.length ? '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('من', 'From') + '</th><th>' + L('إلى', 'To') + '</th><th>' + L('الأصناف', 'Items') + '</th><th>' + L('بواسطة', 'By') + '</th><th></th></tr>' + tl.map(function (t) { return '<tr><td class="num"><b>' + t.no + '</b></td><td class="num">' + U.dt(t.date) + '</td><td>' + U.esc(Wh.name(t.from)) + '</td><td>' + U.esc(Wh.name(t.to)) + '</td><td>' + t.items.length + ' · ' + U.r2(H.sum(t.items, function (i) { return i.qty; })) + '</td><td>' + U.esc(t.by) + '</td><td><button class="btn sm" data-tp="' + t.id + '">🖨️</button></td></tr>'; }).join('') + '</table></div>' : '<div class="empty">' + L('لسه مفيش تحويلات', 'No transfers yet') + '</div>';
      $$('[data-tp]').forEach(function (b) { b.onclick = function () { V.print(db.transfers.filter(function (t) { return t.id === b.dataset.tp; })[0]); }; });
    } else {
      B.innerHTML = '<div class="card col" style="max-width:640px"><h3>🏬 ' + L('المخازن', 'Warehouses') + '</h3>' + ws.map(function (w, i) { return '<div class="row"><input class="in grow" data-wn="' + i + '" value="' + U.esc(w.name) + '"' + (can('settings') ? '' : ' disabled') + '>' + (w.id === Wh.def() ? H.chip(L('البيع منه', 'Sales'), 'ok') : '') + (w.id === Wh.inDef() ? H.chip(L('الاستلام فيه', 'Receiving'), '') : '') + (ws.length > 1 && can('settings') ? '<button class="btn sm ghost" data-wd="' + i + '" style="color:var(--bad)">✕</button>' : '') + '</div>'; }).join('') +
        (can('settings') ? '<div class="row"><input class="in grow" id="wAdd" placeholder="' + L('اسم مخزن جديد (مثلاً مخزن السجاد)', 'New warehouse name') + '"><button class="btn" id="wAddB">➕ ' + L('إضافة', 'Add') + '</button></div><div class="grid g2"><label class="f">' + L('البيع بيتخصم من', 'Sales deduct from') + '<select class="in" id="wSale">' + ws.map(function (w) { return '<option value="' + w.id + '"' + (w.id === Wh.def() ? ' selected' : '') + '>' + U.esc(w.name) + '</option>'; }).join('') + '</select></label><label class="f">' + L('استلام البضاعة بيدخل', 'Received goods go to') + '<select class="in" id="wIn">' + ws.map(function (w) { return '<option value="' + w.id + '"' + (w.id === Wh.inDef() ? ' selected' : '') + '>' + U.esc(w.name) + '</option>'; }).join('') + '</select></label></div><button class="btn pri" id="wSave">💾 ' + L('حفظ', 'Save') + '</button>' : '') +
        '<div class="muted small">' + L('لو الصنف خلص من مخزن البيع، البيع بيكمّل من المخازن التانية تلقائي.', 'If the sales warehouse runs out, sales continue from the others automatically.') + '</div></div>';
      if (!can('settings')) return;
      $('#wAddB').onclick = function () { var n = $('#wAdd').value.trim(); if (!n) return; ws.push({ id: 'w' + U.id(), name: n }); Store.save(); V.render(el); };
      $$('[data-wd]').forEach(function (b) { b.onclick = function () { var w = ws[+b.dataset.wd], has = db.products.some(function (p) { return Wh.qty(p, w.id) !== 0; }); if (has) return toast(L('المخزن فيه بضاعة — حوّلها الأول', 'Warehouse has stock — transfer it first'), 'bad'); ws.splice(+b.dataset.wd, 1); Store.save(); V.render(el); }; });
      $('#wSave').onclick = function () { $$('[data-wn]').forEach(function (i) { var v = i.value.trim(); if (v) ws[+i.dataset.wn].name = v; }); h.saleWh = $('#wSale').value; h.inWh = $('#wIn').value; db.products.forEach(Wh.ensure); Store.log('warehouses', 'saved'); Store.save(); toast(L('اتحفظ ✓', 'Saved ✓'), 'ok'); V.render(el); };
    }
  },
  transfer: function (el) {
    var ws = Wh.list(); if (ws.length < 2) return toast(L('ضيف مخزن تاني الأول من تبويب «المخازن»', 'Add a second warehouse first'), 'bad');
    var lines = [];
    var m = Modal.open({ size: 'wide', title: '🔁 ' + L('تحويل بضاعة بين المخازن', 'Transfer between warehouses'), body: '<div class="col"><div class="grid g2"><label class="f">' + L('من', 'From') + '<select class="in" id="tF">' + ws.map(function (w) { return '<option value="' + w.id + '"' + (w.id === (Wh.inDef() !== Wh.def() ? Wh.inDef() : (ws.filter(function (x) { return x.id !== Wh.def(); })[0] || {}).id) ? ' selected' : '') + '>' + U.esc(w.name) + '</option>'; }).join('') + '</select></label><label class="f">' + L('إلى', 'To') + '<select class="in" id="tT">' + ws.map(function (w) { return '<option value="' + w.id + '"' + (w.id === Wh.def() ? ' selected' : '') + '>' + U.esc(w.name) + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="f">' + L('ضيف صنف (اسم أو باركود)', 'Add item (name or barcode)') + '<input class="in" id="tP" autofocus></label><div id="tL"></div><label class="f">' + L('ملاحظة', 'Note') + '<input class="in" id="tN"></label></div>',
      foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri lg" id="tGo">✅ ' + L('تنفيذ التحويل', 'Transfer') + '</button>' });
    var draw = function () { var f = $('#tF', m).value; $('#tL', m).innerHTML = lines.length ? '<table class="t"><tr><th>' + L('الصنف', 'Item') + '</th><th>' + L('المتاح في المصدر', 'Available') + '</th><th>' + L('الكمية', 'Qty') + '</th><th></th></tr>' + lines.map(function (l, i) { return '<tr><td>' + U.esc(pname(l.p)) + '</td><td class="num">' + Wh.qty(l.p, f) + '</td><td><input class="in num" style="width:110px" type="number" step="0.01" data-q="' + i + '" value="' + l.q + '"></td><td><button class="btn sm ghost" data-d="' + i + '">✕</button></td></tr>'; }).join('') + '</table>' : '<div class="empty" style="padding:20px">' + L('ضيف الأصناف اللي هتتحوّل', 'Add the items to move') + '</div>';
      $$('[data-q]', m).forEach(function (i) { i.oninput = function () { lines[+i.dataset.q].q = U.n(i.value); }; }); $$('[data-d]', m).forEach(function (b) { b.onclick = function () { lines.splice(+b.dataset.d, 1); draw(); }; }); };
    H.prodPick($('#tP', m), function (p) { var ex = lines.filter(function (l) { return l.p === p; })[0]; if (ex) ex.q++; else lines.push({ p: p, q: Math.max(0, Math.min(1, Wh.qty(p, $('#tF', m).value))) || 1 }); draw(); });
    $('#tF', m).onchange = draw; draw();
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#tGo', m).onclick = function () {
      var f = $('#tF', m).value, t = $('#tT', m).value; if (f === t) return toast(L('اختار مخزنين مختلفين', 'Pick two different warehouses'), 'bad');
      var ok = lines.filter(function (l) { return l.q > 0; }); if (!ok.length) return toast(L('ضيف أصناف', 'Add items'), 'bad');
      var bad = ok.filter(function (l) { return l.q > Wh.qty(l.p, f) + 1e-9; })[0]; if (bad) return toast(L('الكمية مش متاحة في المصدر: ', 'Not enough in source: ') + bad.p.name, 'bad');
      var db = Store.db; db.seq.transfer++;
      var tr = { id: U.id(), no: db.seq.transfer, date: Date.now(), from: f, to: t, by: App.user.name, note: $('#tN', m).value, items: ok.map(function (l) { return { pid: l.p.id, name: pname(l.p), qty: U.r2(l.q) }; }) };
      ok.forEach(function (l) { Wh.ensure(l.p); l.p.wh[f] = U.r2(U.n(l.p.wh[f]) - l.q); l.p.wh[t] = U.r2(U.n(l.p.wh[t]) + l.q); Wh.ensure(l.p); db.moves.push({ t: Date.now(), p: l.p.id, q: 0, k: 'transfer', r: 'T#' + tr.no + ' ' + Wh.name(f) + '→' + Wh.name(t) + ' (' + l.q + ')', u: App.user.username, s: l.p.stock }); });
      db.transfers.push(tr); Store.log('transfer', 'T#' + tr.no); Store.save(); Modal.close(m); toast('🔁 ' + L('تم التحويل رقم ', 'Transfer #') + tr.no, 'ok'); Views.warehouses.print(tr); if (el) { Views.warehouses.tab = 'tr'; Views.warehouses.render(el); }
    };
  },
  print: function (t) {
    A4.print(A4.head(L('إذن تحويل مخزني', 'Stock transfer note'), [[L('رقم الإذن', 'No.'), t.no], [L('التاريخ', 'Date'), U.dt(t.date)], [L('من مخزن', 'From'), Wh.name(t.from)], [L('إلى مخزن', 'To'), Wh.name(t.to)]]) +
      A4.table([L('م', '#'), L('الصنف', 'Item'), L('الكمية', 'Qty')], t.items.map(function (i, x) { return [x + 1, U.esc(i.name), i.qty]; })) + (t.note ? '<p>' + U.esc(t.note) + '</p>' : '') + A4.sign([L('أمين المخزن المسلّم', 'Released by'), L('المستلم', 'Received by')]) + A4.foot());
  }
};

/* ================= A4 documents ================= */
var A4 = {
  css: function () {
    var ac = (S().invoice || {}).accent || '#1f4e79';
    return '@page{size:A4;margin:10mm}body{margin:0;font-family:Tahoma,Arial,sans-serif;color:#111;font-size:12.5px}' +
      '.a4{width:100%}.a4h{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;border-bottom:3px solid ' + ac + ';padding-bottom:10px}' +
      '.a4h .shop{display:flex;gap:12px;align-items:center}.a4h .shop img{max-height:70px;max-width:120px}.a4h h1{margin:0;font-size:22px;color:' + ac + '}.a4h .sm{color:#444;font-size:11.5px;line-height:1.6}' +
      '.a4t{background:' + ac + ';color:#fff;padding:8px 16px;border-radius:8px;font-size:18px;font-weight:800;text-align:center;min-width:170px}.a4t small{display:block;font-size:11px;font-weight:400;opacity:.9}' +
      '.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin:12px 0;padding:10px 12px;border:1px solid #ccd;border-radius:8px;background:#f6f8fb}.meta div{display:flex;gap:6px}.meta b{color:#333;min-width:90px}' +
      'table.g{width:100%;border-collapse:collapse;margin:8px 0}table.g th{background:' + ac + ';color:#fff;padding:7px 6px;font-size:12px}table.g td{border-bottom:1px solid #dde;padding:6px;text-align:center}table.g td.l{text-align:start}table.g tr:nth-child(even) td{background:#f7f9fc}' +
      '.tot{display:flex;justify-content:space-between;gap:16px;margin-top:8px;align-items:flex-start}.tot .box{min-width:260px;border:1px solid #ccd;border-radius:8px;overflow:hidden}.tot .box div{display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #eee}.tot .box .big{background:' + ac + ';color:#fff;font-weight:800;font-size:16px}' +
      '.words{flex:1;padding:10px 12px;border:1px dashed #99a;border-radius:8px;background:#fbfbfd;font-weight:700;line-height:1.7}' +
      '.terms{margin-top:12px;font-size:11px;color:#333;white-space:pre-line;border-top:1px solid #ccd;padding-top:8px;line-height:1.7}' +
      '.sign{display:flex;justify-content:space-around;margin-top:26px;gap:20px}.sign div{flex:1;text-align:center;border-top:1px solid #333;padding-top:6px;font-weight:700}' +
      '.ft{margin-top:14px;text-align:center;font-size:10px;color:#777;border-top:1px solid #eee;padding-top:6px}.stamp{float:left;max-height:90px;opacity:.85}' +
      'h3.s{margin:14px 0 4px;color:' + ac + ';font-size:14px;border-bottom:1px solid #dde;padding-bottom:3px}.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;background:#eef;color:#223}.paid{background:#e3f6e9;color:#126b32}.late{background:#fde8e8;color:#9b1c1c}';
  },
  head: function (title, meta, sub) {
    var st = S(), en = lang() === 'en';
    return '<div class="a4"><div class="a4h"><div class="shop">' + (st.logo ? '<img src="' + st.logo + '">' : '') + '<div><h1>' + U.esc(shopName(en)) + '</h1><div class="sm">' + [st.slogan, st.shopAddress, [st.shopPhone, st.shopPhone2].filter(Boolean).join(' / '), st.taxNo ? L('رقم ضريبي ', 'Tax no. ') + st.taxNo : '', st.crNo ? L('سجل تجاري ', 'C.R. ') + st.crNo : ''].filter(Boolean).map(U.esc).join('<br>') + '</div></div></div>' +
      '<div class="a4t">' + U.esc(title) + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>' +
      (meta && meta.length ? '<div class="meta">' + meta.map(function (r) { return '<div><b>' + r[0] + ':</b><span>' + r[1] + '</span></div>'; }).join('') + '</div>' : '');
  },
  table: function (heads, rows, leftCol) { leftCol = leftCol == null ? 1 : leftCol; return '<table class="g"><tr>' + heads.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i === leftCol ? ' class="l"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; },
  totals: function (rows, amount) { var h = homeCfg(); return '<div class="tot"><div class="words">' + (h.a4Words && lang() !== 'en' && amount != null ? Tafqeet.money(amount) : '') + '</div><div class="box">' + rows.map(function (r) { return '<div class="' + (r[2] ? 'big' : '') + '"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join('') + '</div></div>'; },
  sign: function (who) { return homeCfg().a4Sign ? '<div class="sign">' + who.map(function (w) { return '<div>' + w + '</div>'; }).join('') + '</div>' : ''; },
  foot: function () { return '<div class="ft">' + (homeCfg().a4Stamp ? '' : '') + L('طُبع بواسطة', 'Printed by') + ' ' + U.esc(App.user ? App.user.name : '') + ' · ' + U.dt(Date.now()) + ' · Ghandi Home · ' + APP.devEn + ' ' + APP.phone + '</div></div>'; },
  print: function (html) { Printer.print(html, { css: A4.css(), printer: homeCfg().a4Printer || '', silent: false, dir: lang() === 'en' ? 'ltr' : 'rtl' }); },
  // the invoice itself
  invoice: function (s) {
    var cu = H.cust(s.customer), h = homeCfg(), en = lang() === 'en', ret = s.type === 'return';
    var hasW = s.items.some(function (i) { var p = i.pid && Store.product(i.pid); return p && U.n(p.warranty) > 0; });
    var rows = s.items.map(function (i, x) {
      var p = i.pid && Store.product(i.pid), w = p && U.n(p.warranty) > 0 ? p.warranty + L(' شهر', ' mo') : '—';
      return [x + 1, U.esc(i.name) + (i.base > i.price && i.promo ? '<br><span class="badge">★ ' + U.esc(i.promo) + '</span>' : ''), U.esc(p ? Meas.unitName(p) : '—'), U.r2(i.qty), (i.base > i.price ? '<s style="color:#888">' + U.money(i.base) + '</s><br>' : '') + U.money(i.price), U.money(i.qty * i.price)].concat(hasW ? [w] : []);
    });
    var pays = Object.keys(s.payments || {}).filter(function (k) { return U.n(s.payments[k]); }).map(function (k) { return [pmName(k), U.money(s.payments[k])]; });
    var inst = s.instNo ? (Store.db.inst || []).filter(function (c) { return c.no === s.instNo; })[0] : null;
    var meta = [[L('رقم الفاتورة', 'Invoice no.'), '<b>' + s.no + '</b>'], [L('التاريخ', 'Date'), U.dt(s.date)], [L('العميل', 'Customer'), cu ? U.esc(cu.name) : L('نقدي', 'Walk-in')], [L('الموبايل', 'Mobile'), cu && cu.phone ? '<span dir="ltr">' + U.esc(cu.phone) + '</span>' : '—']];
    if (cu && cu.address) meta.push([L('العنوان', 'Address'), U.esc(cu.address)]);
    meta.push([L('البائع', 'Sales rep'), U.esc(s.userName || '')]);
    var tr = [[L('الإجمالي', 'Subtotal'), U.money(s.subtotal)]];
    if (s.discount) tr.push([L('الخصم', 'Discount'), '- ' + U.money(s.discount)]);
    if (s.vat) tr.push([L('الضريبة', 'VAT'), U.money(s.vat)]);
    tr.push([L('الصافي', 'Net total'), U.money(s.total) + ' ' + cur(), 1]);
    pays.forEach(function (p) { tr.push(p); });
    if (s.change) tr.push([L('الباقي', 'Change'), U.money(s.change)]);
    if (s.credit) tr.push([L('آجل على العميل', 'On account'), U.money(s.credit)]);
    return A4.head(ret ? L('فاتورة مرتجع', 'Return invoice') : L('فاتورة بيع', 'Sales invoice'), meta, s.void ? L('ملغاة', 'VOID') : '') +
      A4.table([L('م', '#'), L('الصنف', 'Item'), L('الوحدة', 'Unit'), L('الكمية', 'Qty'), L('السعر', 'Price'), L('الإجمالي', 'Total')].concat(hasW ? [L('الضمان', 'Warranty')] : []), rows) +
      A4.totals(tr, s.total) +
      (inst ? '<h3 class="s">🏦 ' + L('بيانات التقسيط — عقد رقم ', 'Instalment contract #') + inst.no + '</h3><div class="meta"><div><b>' + L('المقدم', 'Down payment') + ':</b>' + U.money(inst.down) + '</div><div><b>' + L('المبلغ المقسط', 'Financed') + ':</b>' + U.money(inst.instTotal) + '</div><div><b>' + L('عدد الأقساط', 'Instalments') + ':</b>' + inst.months + '</div><div><b>' + L('القسط', 'Each') + ':</b>' + U.money(inst.schedule[0].amount) + '</div></div>' : '') +
      (h.a4Terms ? '<div class="terms"><b>' + L('الشروط والأحكام', 'Terms') + '</b>\n' + U.esc(h.a4Terms) + '</div>' : '') +
      A4.sign([L('توقيع العميل بالاستلام', 'Customer signature'), L('توقيع البائع', 'Seller'), L('الختم', 'Stamp')]) + A4.foot();
  },
  printSale: function (s) { A4.print(A4.invoice(s)); }
};
// "A4" paper in the invoice designer now uses the professional layout
(function () {
  var rh = Receipt.html;
  Receipt.html = function (s, cfg) {
    var c = cfg || S().invoice;
    if (c.paper === 'A4' && F('a4') && s && s.items && s.no != null) return '<div class="a4wrap" style="width:190mm;padding:6mm;background:#fff;color:#111"><style>' + A4.css().replace(/@page\{[^}]*\}/, '').replace(/body\{[^}]*\}/, '') + '</style>' + A4.invoice(s) + '</div>';
    return rh.apply(this, arguments);
  };
  var rc = Receipt.css;
  Receipt.css = function (cfg) { var c = cfg || S().invoice; if (c.paper === 'A4' && F('a4')) return A4.css(); return rc.apply(this, arguments); };
  // A4 button in the after-sale popup and the invoice details
  var addBtn = function (s) {
    if (!F('a4')) return; var m = $$('.mask').pop(); if (!m) return; var f = $('.mf', m) || $('.mb', m); if (!f || $('[data-a4]', m)) return;
    var b = document.createElement('button'); b.className = 'btn'; b.dataset.a4 = '1'; b.innerHTML = '📄 ' + L('طباعة A4', 'Print A4'); b.onclick = function () { A4.printSale(s); };
    f.insertBefore(b, f.firstChild);
  };
  var rp = ReceiptPop.show; ReceiptPop.show = function (s) { var r = rp.apply(this, arguments); addBtn(s); return r; };
  var so = Views.sales.open; Views.sales.open = function (s) { var r = so.apply(this, arguments); var m = $$('.mask').pop(); if (m) { var row = $('.mb .col .row.wrap', m); if (row && F('a4')) { var b = document.createElement('button'); b.className = 'btn'; b.innerHTML = '📄 A4'; b.onclick = function () { A4.printSale(s); }; row.appendChild(b); } if (row && F('deliveries') && can('deliveries') && s.type === 'sale' && !s.void) { var d = document.createElement('button'); d.className = 'btn'; d.innerHTML = '🚚 ' + L('توصيل / تركيب', 'Delivery'); d.onclick = function () { Dlv.edit(null, { sale: s }); }; row.appendChild(d); } } return r; };
})();

/* ================= settings card for the home edition ================= */
(function () {
  var st = Views.settings;
  Views.settings = function (el) {
    st.apply(this, arguments); var g = $('.grid', el); if (!g || !can('settings')) return;
    var h = homeCfg(), card = document.createElement('div'); card.className = 'card col'; card.style.gridColumn = '1 / -1';
    card.innerHTML = '<h3>🏠 ' + L('إعدادات المعرض (التقسيط · الستائر · الفاتورة A4)', 'Showroom settings (instalments · curtains · A4)') + '</h3>' +
      '<div class="grid g3">' +
      '<div class="col"><b>🏦 ' + L('التقسيط', 'Instalments') + '</b><label class="f">' + L('طريقة حساب الزيادة', 'Mark-up method') + '<select class="in" id="hiT"><option value="monthly"' + (h.instType === 'monthly' ? ' selected' : '') + '>' + L('نسبة شهرية × عدد الشهور', 'Monthly % × months') + '</option><option value="total"' + (h.instType === 'total' ? ' selected' : '') + '>' + L('نسبة ثابتة على المبلغ كله', 'Flat % on the amount') + '</option></select></label>' +
      '<div class="grid g2"><label class="f">' + L('النسبة %', 'Rate %') + '<input class="in num" type="number" step="0.1" id="hiR" value="' + h.instRate + '"></label><label class="f">' + L('شهور افتراضي', 'Default months') + '<input class="in num" type="number" id="hiM" value="' + h.instMonths + '"></label><label class="f">' + L('المقدم الافتراضي %', 'Default down %') + '<input class="in num" type="number" id="hiD" value="' + h.instDownPct + '"></label><label class="f">' + L('تقريب القسط لأقرب', 'Round instalment to') + '<input class="in num" type="number" id="hiRo" value="' + h.instRound + '"></label><label class="f">' + L('أيام سماح قبل التأخير', 'Grace days') + '<input class="in num" type="number" id="hiG" value="' + h.instGrace + '"></label><label class="f">' + L('غرامة تأخير / يوم', 'Late fee / day') + '<input class="in num" type="number" id="hiL" value="' + h.instLateFee + '"></label><label class="f">' + L('عدد الضامنين المطلوب', 'Guarantors required') + '<input class="in num" type="number" min="0" max="3" id="hiGu" value="' + h.instGuarantors + '"></label><label class="f">' + L('تنبيه قبل الميعاد (يوم)', 'Remind days before') + '<input class="in num" type="number" id="hiW" value="' + h.instWarnDays + '"></label></div>' +
      '<label class="f">' + L('شروط عقد التقسيط', 'Contract terms') + '<textarea class="in" id="hiTe" rows="5">' + U.esc(h.instTerms) + '</textarea></label></div>' +
      '<div class="col"><b>🪟 ' + L('الستائر والتركيب', 'Curtains & installation') + '</b><div class="grid g2"><label class="f">' + L('معامل الكشكشة (الكثافة)', 'Fullness factor') + '<input class="in num" type="number" step="0.1" id="hcF" value="' + h.fullness + '"></label><label class="f">' + L('زيادة الحواشي (م)', 'Hems allowance (m)') + '<input class="in num" type="number" step="0.05" id="hcH" value="' + h.hem + '"></label><label class="f">' + L('مصنعية تفصيل / متر', 'Tailoring / metre') + '<input class="in num" type="number" id="hcT" value="' + h.tailorM + '"></label><label class="f">' + L('رسوم تركيب افتراضي', 'Default installation fee') + '<input class="in num" type="number" id="hcI" value="' + h.installFee + '"></label><label class="f">' + L('رسوم توصيل افتراضي', 'Default delivery fee') + '<input class="in num" type="number" id="hcD" value="' + h.deliveryFee + '"></label><label class="f">' + L('تنبيه فرح العروسة قبل (يوم)', 'Wedding alert (days)') + '<input class="in num" type="number" id="hcB" value="' + h.brideAlertDays + '"></label></div>' +
      '<label class="f">' + L('الفنيين والسواقين (كل اسم في سطر)', 'Technicians & drivers (one per line)') + '<textarea class="in" id="hcS" rows="4">' + U.esc(h.staff.join('\n')) + '</textarea></label></div>' +
      '<div class="col"><b>📄 ' + L('الفاتورة والمستندات A4', 'A4 invoice & documents') + '</b><label class="f">' + L('طابعة A4 (ليزر / إنك جت)', 'A4 printer') + '<select class="in" id="haP"><option value="">' + L('الطابعة الافتراضية / اختيار وقت الطباعة', 'Default / ask') + '</option></select></label>' +
      '<label class="row small"><input type="checkbox" class="sw" id="haW" ' + (h.a4Words ? 'checked' : '') + '> ' + L('كتابة المبلغ بالحروف (تفقيط)', 'Amount in words') + '</label><label class="row small"><input type="checkbox" class="sw" id="haS" ' + (h.a4Sign ? 'checked' : '') + '> ' + L('خانات التوقيع والختم', 'Signature boxes') + '</label><label class="f">' + L('صلاحية عرض السعر (يوم)', 'Quotation valid (days)') + '<input class="in num" type="number" id="haQ" value="' + h.quoteDays + '"></label>' +
      '<label class="f">' + L('الشروط المطبوعة على الفاتورة', 'Terms printed on the invoice') + '<textarea class="in" id="haT" rows="5">' + U.esc(h.a4Terms) + '</textarea></label><div class="muted small">' + L('لتخلي الفاتورة الأساسية A4: من «تصميم الفاتورة» اختار مقاس A4. وتقدر تطبع A4 من أي فاتورة بزرار «طباعة A4».', 'To make A4 the default, choose A4 in the invoice designer. Any invoice can also be printed A4 from its button.') + '</div></div></div>' +
      '<div class="row"><button class="btn pri" id="hSave">💾 ' + L('حفظ إعدادات المعرض', 'Save showroom settings') + '</button></div>';
    g.appendChild(card);
    Printer.list().then(function (ps) { var s = $('#haP', card); if (!s) return; ps.forEach(function (p) { var o = document.createElement('option'); o.value = o.textContent = p; if (p === h.a4Printer) o.selected = true; s.appendChild(o); }); });
    $('#hSave', card).onclick = function () {
      var n = function (id) { return U.n($(id, card).value); };
      h.instType = $('#hiT', card).value; h.instRate = n('#hiR'); h.instMonths = Math.max(1, Math.round(n('#hiM'))); h.instDownPct = n('#hiD'); h.instRound = Math.max(0, n('#hiRo')); h.instGrace = n('#hiG'); h.instLateFee = n('#hiL'); h.instGuarantors = Math.max(0, Math.min(3, Math.round(n('#hiGu')))); h.instWarnDays = n('#hiW'); h.instTerms = $('#hiTe', card).value;
      h.fullness = n('#hcF') || 2.5; h.hem = n('#hcH'); h.tailorM = n('#hcT'); h.installFee = n('#hcI'); h.deliveryFee = n('#hcD'); h.brideAlertDays = n('#hcB') || 30; h.staff = $('#hcS', card).value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      h.a4Printer = $('#haP', card).value; h.a4Words = $('#haW', card).checked; h.a4Sign = $('#haS', card).checked; h.quoteDays = n('#haQ') || 7; h.a4Terms = $('#haT', card).value;
      Store.log('settings.home', 'saved'); Store.save(); toast(L('اتحفظ ✓', 'Saved ✓'), 'ok');
    };
  };
})();
