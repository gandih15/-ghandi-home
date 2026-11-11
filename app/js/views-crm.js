/* Ghandi Home — customers & loyalty (CRM), phone at checkout, points, coupons, gift cards, layaway,
   cash drawer, customer display, supplier returns, license-expiry alert, smarter search & reports. */
'use strict';

/* ================= helpers ================= */
var Phone = {
  norm: function (s) {
    s = String(s || '').replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/\D/g, '');
    if (/^0020\d{10}$/.test(s)) s = '0' + s.slice(4); else if (/^20\d{10}$/.test(s)) s = '0' + s.slice(2);
    return s;
  },
  valid: function (s) { s = Phone.norm(s); return /^01[0125]\d{8}$/.test(s) || (s.length >= 8 && s.length <= 13); }
};
function custDefaults() {
  var s = S();
  if (!s.loyalty) s.loyalty = { on: false, earnEvery: 10, earnPts: 1, redeemPts: 100, redeemVal: 10, minRedeem: 100, maxPct: 50, expireMonths: 12, welcome: 0, onCredit: false };
  if (!s.posPhone) s.posPhone = { on: false, required: false };
  if (!s.drawer) s.drawer = { on: false, when: 'cash', printer: '' };
  if (!s.custDisplay) s.custDisplay = { on: false, msg: 'أهلاً بيك — نورتنا 🏠' };
  var db = Store.db; ['coupons', 'giftcards', 'layaways'].forEach(function (k) { if (!db[k]) db[k] = []; });
  if (db.seq.layaway == null) db.seq.layaway = 0;
}
var Cust = {
  get: function (id) { for (var i = 0; i < Store.db.customers.length; i++) if (Store.db.customers[i].id === id) return Store.db.customers[i]; return null; },
  byPhone: function (ph) { ph = Phone.norm(ph); if (!ph) return null; for (var i = 0; i < Store.db.customers.length; i++) { var c = Store.db.customers[i]; if (Phone.norm(c.phone) === ph || (c.phone2 && Phone.norm(c.phone2) === ph)) return c; } return null; },
  create: function (phone, name, src) {
    var c = { id: U.id(), name: (name || '').trim() || L('عميل ', 'Customer ') + Phone.norm(phone).slice(-4), phone: Phone.norm(phone), balance: 0, points: 0, pts: [], created: Date.now(), src: src || 'pos', tier: '' };
    Store.db.customers.push(c); Store.log('customer.auto', c.phone);
    var ly = S().loyalty; if (ly.on && U.n(ly.welcome) > 0) Points.add(c, U.n(ly.welcome), 'welcome', '');
    return c;
  },
  sales: function (c) { return Store.db.sales.filter(function (s) { return s.customer === c.id; }); },
  stats: function (c) {
    var r = { spent: 0, visits: 0, returns: 0, last: 0, items: 0 };
    Cust.sales(c).forEach(function (s) { if (s.void) return; if (s.type === 'return') r.returns += s.total; else { r.spent += s.total; r.visits++; r.items += s.items.reduce(function (a, i) { return a + i.qty; }, 0); } r.last = Math.max(r.last, s.date); });
    r.net = r.spent - r.returns; r.avg = r.visits ? r.spent / r.visits : 0; return r;
  }
};
var Loyalty = {
  on: function () { return !!(S().loyalty && S().loyalty.on); },
  ptValue: function () { var l = S().loyalty; return U.n(l.redeemVal) / Math.max(1, U.n(l.redeemPts)); },
  value: function (pts) { return U.r2(pts * Loyalty.ptValue()); },
  earnFor: function (amount) { var l = S().loyalty; return Math.max(0, Math.floor(U.n(amount) / Math.max(0.01, U.n(l.earnEvery))) * U.n(l.earnPts)); },
  maxRedeem: function (c, due) { var l = S().loyalty; if (!c || c.points < U.n(l.minRedeem)) return 0; var byPct = Math.floor(due * U.n(l.maxPct) / 100 / Math.max(0.0001, Loyalty.ptValue())); return Math.max(0, Math.min(Math.floor(c.points), byPct)); },
  cashback: function () { var l = S().loyalty; return U.n(l.earnEvery) ? Math.round(U.n(l.earnPts) / U.n(l.earnEvery) * Loyalty.ptValue() * 1000) / 10 : 0; },
  expireRun: function () {
    var l = S().loyalty, m = U.n(l.expireMonths); if (!l.on || !m) return;
    var key = 'ghandi.ptsExpire', today = U.today(); try { if (localStorage.getItem(key) === today) return; localStorage.setItem(key, today); } catch (e) { }
    var lim = Date.now() - m * 30.44 * 864e5, n = 0;
    Store.db.customers.forEach(function (c) { if (U.n(c.points) > 0 && (c.lastVisit || c.created || 0) < lim) { Points.add(c, -c.points, 'expire', ''); n++; } });
    if (n) { Store.log('points.expire', n); Store.save(); }
  }
};
var Points = {
  add: function (c, d, why, inv) { d = Math.round(d); if (!d) return; c.points = Math.max(0, Math.round(U.n(c.points) + d)); (c.pts = c.pts || []).push({ t: Date.now(), d: d, r: why, inv: inv || '', by: App.user ? App.user.name : '' }); },
  label: function (r) { return { earn: ['⭐', 'كسب من فاتورة', 'Earned'], redeem: ['🎁', 'استبدال في فاتورة', 'Redeemed'], 'return': ['↩️', 'خصم بسبب مرتجع', 'Return'], adjust: ['✏️', 'تعديل يدوي', 'Manual'], expire: ['⌛', 'انتهت لعدم الشراء', 'Expired'], welcome: ['🎉', 'هدية تسجيل', 'Welcome'], void: ['🚫', 'إلغاء فاتورة', 'Void'] }[r] || ['•', r, r]; }
};
var Coupons = {
  find: function (code) { code = String(code || '').trim().toUpperCase(); return (Store.db.coupons || []).filter(function (c) { return c.code.toUpperCase() === code; })[0] || null; },
  check: function (cp, total, cust) {
    if (!cp) return L('الكوبون مش موجود', 'Coupon not found');
    if (cp.active === false) return L('الكوبون متوقف', 'Coupon is disabled');
    var now = U.today(); if (cp.from && cp.from > now) return L('الكوبون لسه مابدأش', 'Coupon not started yet'); if (cp.to && cp.to < now) return L('الكوبون انتهى', 'Coupon expired');
    if (U.n(cp.max) && U.n(cp.used) >= U.n(cp.max)) return L('الكوبون استُخدم بالكامل', 'Coupon fully used');
    if (U.n(cp.min) && total < U.n(cp.min)) return L('أقل قيمة فاتورة للكوبون ', 'Minimum invoice ') + U.money(cp.min);
    if (cp.once && cust && (cp.usedBy || []).indexOf(cust.id) >= 0) return L('العميل استخدم الكوبون ده قبل كده', 'Customer already used it');
    return '';
  },
  value: function (cp, total) { return U.r2(Math.min(total, cp.type === 'pct' ? total * U.n(cp.val) / 100 : U.n(cp.val))); },
  use: function (code, cust) { var cp = Coupons.find(code); if (!cp) return; cp.used = U.n(cp.used) + 1; if (cust) (cp.usedBy = cp.usedBy || []).push(cust.id); }
};
var GiftCards = {
  find: function (code) { code = String(code || '').trim().toUpperCase(); return (Store.db.giftcards || []).filter(function (g) { return g.code === code; })[0] || null; },
  newCode: function () { var c; do { c = 'GC' + String(Math.floor(1e7 + Math.random() * 9e7)); } while (GiftCards.find(c)); return c; },
  issue: function (code, amount, cust, no) { Store.db.giftcards.push({ code: code, initial: U.r2(amount), balance: U.r2(amount), created: Date.now(), customer: cust ? cust.id : '', sale: no, log: [{ t: Date.now(), v: amount, inv: no }] }); },
  charge: function (code, v, no) { var g = GiftCards.find(code); if (!g) return; g.balance = U.r2(g.balance - v); g.log.push({ t: Date.now(), v: -v, inv: no }); },
  print: function (g) {
    Printer.print('<div style="width:72mm;padding:4mm;text-align:center;font-family:Tahoma,Arial"><div style="font-size:18px;font-weight:800">' + U.esc(shopName()) + '</div><div style="font-size:26px;margin:6px 0">🎁 ' + L('كارت هدية', 'Gift card') + '</div><div style="font-size:30px;font-weight:800">' + U.money(g.initial) + ' ' + cur() + '</div><div style="height:46px;margin:10px auto;width:85%">' + Barcode.svg(g.code, { height: 50 }) + '</div><div style="font-family:Consolas,monospace;font-size:15px;letter-spacing:2px">' + g.code + '</div><div style="font-size:11px;margin-top:6px">' + U.dt(g.created) + '</div></div>', { css: Receipt.css({ paper: '80' }), printer: S().printers.invoice, silent: S().printers.silent, receipt: true });
  }
};
var Drawer = {
  open: function (why) {
    var d = S().drawer || {}; Store.log('drawer.open', why || '');
    if (!IS_ELECTRON) { if (/^#|^L/.test(why || '')) return; toast('🗄️ ' + L('فتح الدرج (بيشتغل في GhandiHome.exe)', 'Drawer opens in GhandiHome.exe'), ''); return; }
    IPC.invoke('drawer', { printer: d.printer || S().printers.invoice || '' }).then(function (r) { if (!r || !r.ok) toast(L('مقدرتش أفتح الدرج: ', 'Could not open drawer: ') + ((r && r.error) || ''), 'bad'); });
  },
  auto: function (s) { var d = S().drawer || {}; if (!d.on || s.type === 'void') return; if (d.when === 'all' || U.n((s.payments || {}).cash) > 0 || s.type === 'return') Drawer.open('#' + s.no); }
};

/* ================= customer display (second screen) ================= */
var CD = {
  win: null,
  on: function () { return !!(S().custDisplay && S().custDisplay.on); },
  open: function () {
    if (!CD.on()) return;
    if (IS_ELECTRON) { IPC.send('cd-open'); return; }
    if (!CD.win || CD.win.closed) CD.win = window.open('cd.html', 'ghandi_cd', 'width=1024,height=640');
  },
  send: function (d) {
    if (!CD.on()) return;
    d.shop = shopName(); d.logo = S().logo || ''; d.slogan = S().slogan || ''; d.msg = S().custDisplay.msg || ''; d.cur = cur(); d.dir = lang() === 'en' ? 'ltr' : 'rtl';
    if (IS_ELECTRON) IPC.send('cd', d); else if (CD.win && !CD.win.closed) CD.win.postMessage(d, '*');
  },
  cart: function () {
    var c = App.cart; if (!c) return; var t = Views.pos.totals(), cu = c.customer ? Cust.get(c.customer) : null;
    CD.send({ mode: c.items.length ? 'cart' : 'idle', items: c.items.map(function (i) { var p = Store.product(i.pid) || {}; return { n: i.name + (p.shade ? ' · ' + p.shade : ''), q: i.qty, p: i.price, b: U.n(i.base) > i.price ? i.base : 0, img: p.img || '', e: p.id ? prodEmoji(p) : '🎁' }; }), total: t.total, saved: t.saved + t.disc, cust: cu ? cu.name : '', pts: cu && Loyalty.on() ? cu.points : null, earn: Loyalty.on() && (cu || c.newCust) ? Loyalty.earnFor(t.total) : 0 });
  },
  thanks: function (s) { var cu = s.customer ? Cust.get(s.customer) : null; CD.send({ mode: 'thanks', total: s.total, change: s.change, cust: cu ? cu.name : '', earned: s.ptsEarned || 0, pts: cu && Loyalty.on() ? cu.points : null }); setTimeout(function () { if (App.cart && !App.cart.items.length) CD.send({ mode: 'idle' }); }, 6000); }
};

/* ================= sales engine (replaces the basic one) ================= */
Sales.create = function (o) {
  custDefaults();
  var db = Store.db; db.seq.invoice++;
  var cust = o.customer ? Cust.get(o.customer) : null;
  if (!cust && o.newCust && Phone.valid(o.newCust.phone)) cust = Cust.byPhone(o.newCust.phone) || Cust.create(o.newCust.phone, o.newCust.name, 'pos');
  var s = { id: U.id(), no: db.seq.invoice, date: Date.now(), type: o.type, user: App.user.id, userName: App.user.name, shift: App.shift ? App.shift.id : '', customer: cust ? cust.id : '', tier: o.tier || 0,
    items: o.items.map(function (i) { var r = { pid: i.pid || null, name: i.name, qty: i.qty, price: U.r2(i.price), cost: U.n(i.cost) }; if (U.n(i.base) > i.price) { r.base = U.r2(i.base); r.promo = i.promo || ''; } if (i.gift) r.gift = i.gift; return r; }),
    subtotal: o.subtotal, discount: U.r2(o.discount || 0), vat: o.vat || 0, total: U.r2(o.total), payments: o.payments || {}, paid: o.paid || 0, change: o.change || 0, credit: o.credit || 0, ref: o.ref || '' };
  if (o.disc) s.disc = o.disc; if (o.coupon) s.coupon = o.coupon; if (o.giftCode) s.giftCode = o.giftCode; if (o.layaway) s.layaway = o.layaway; if (o.ptsRedeemed) s.ptsRedeemed = o.ptsRedeemed;
  var sign = o.type === 'return' ? 1 : -1;
  if (!o.noStock) s.items.forEach(function (i) { if (i.pid) Store.move(i.pid, sign * i.qty, o.type, '#' + s.no); });
  if (o.type === 'sale') s.items.forEach(function (i) { if (i.gift) GiftCards.issue(i.gift, i.price * i.qty, cust, s.no); });
  if (s.giftCode && U.n(s.payments.gift)) GiftCards.charge(s.giftCode, U.n(s.payments.gift), s.no);
  if (s.coupon) Coupons.use(s.coupon, cust);
  if (cust) {
    cust.balance = U.r2(U.n(cust.balance) + (o.type === 'return' ? -s.credit : s.credit));
    if (Loyalty.on()) {
      if (s.ptsRedeemed) Points.add(cust, -s.ptsRedeemed, 'redeem', s.no);
      if (o.type === 'sale') { var base = s.total - (S().loyalty.onCredit ? 0 : s.credit) - s.items.reduce(function (a, i) { return a + (i.gift ? i.price * i.qty : 0); }, 0); s.ptsEarned = Loyalty.earnFor(base); if (s.ptsEarned) Points.add(cust, s.ptsEarned, 'earn', s.no); }
      if (o.type === 'return' && o.ref) { var orig = db.sales.filter(function (x) { return x.id === o.ref; })[0]; if (orig && orig.ptsEarned && orig.total) { var back = Math.round(orig.ptsEarned * s.total / orig.total); if (back) { Points.add(cust, -back, 'return', s.no); s.ptsBack = back; } } }
    }
    cust.lastVisit = s.date;
  }
  db.sales.push(s); Store.log(o.type, '#' + s.no + ' ' + s.total); Store.save();
  try { CD.thanks(s); } catch (e) { } try { Drawer.auto(s); } catch (e) { }
  return s;
};
Sales.onVoid = function (s) {
  var cu = s.customer ? Cust.get(s.customer) : null;
  if (cu && Loyalty.on()) { if (s.ptsEarned) Points.add(cu, -s.ptsEarned, 'void', s.no); if (s.ptsRedeemed) Points.add(cu, s.ptsRedeemed, 'void', s.no); if (s.ptsBack) Points.add(cu, s.ptsBack, 'void', s.no); }
  if (s.giftCode && U.n(s.payments.gift)) GiftCards.charge(s.giftCode, -U.n(s.payments.gift), s.no);
};
// gift-card sales are a liability, not revenue: keep them out of sales/profit totals
sumSales = function (list) {
  var r = { total: 0, profit: 0, count: 0, items: 0, ret: 0 };
  list.forEach(function (s) {
    var sign = s.type === 'return' ? -1 : 1, gift = 0;
    s.items.forEach(function (i) { if (i.gift) { gift += i.qty * i.price; return; } r.items += sign * i.qty; r.profit += sign * (i.qty * (i.price - i.cost)); });
    r.total += sign * (s.total - gift); if (s.type === 'return') r.ret += s.total; else r.count++;
    r.profit -= sign * (s.discount || 0);
  });
  return r;
};
(function () { // layaway deposits are cash in the drawer
  var orig = Views.shifts.calc;
  Views.shifts.calc = function (sh) {
    var r = orig(sh); r.lay = 0;
    (Store.db.layaways || []).forEach(function (l) { (l.pays || []).forEach(function (p) { if (p.shift === sh.id) { if (p.m === 'cash') { r.cash += p.v; r.lay += p.v; } else r.other[p.m] = (r.other[p.m] || 0) + p.v; } }); });
    r.expected = U.r2(U.n(sh.openCash) + r.cash - r.exp + r.coll); return r;
  };
})();

/* ================= POS: customer box (phone) ================= */
var CustBox = {
  html: function () {
    var ph = posPhoneCfg();
    if (!ph.on) return '<div class="cart-h" style="padding:8px 14px"><select class="in" id="cust" style="padding:6px 10px"><option value="">' + L('عميل نقدي', 'Walk-in customer') + '</option>' + Store.db.customers.map(function (c) { return '<option value="' + c.id + '">' + U.esc(c.name) + ' — ' + U.esc(c.phone || '') + '</option>'; }).join('') + '</select></div>';
    return '<div class="custbox"><div class="cb-in"><span class="cb-ic">📱</span><input id="cbPhone" class="in num" type="tel" inputmode="numeric" autocomplete="off" placeholder="' + L('رقم موبايل العميل', 'Customer mobile') + (ph.required ? ' *' : '') + '"><button class="btn ghost sm hide" id="cbX">✕</button></div><div id="cbList"></div><div id="cbRes"></div></div>';
  },
  mount: function (P) {
    var c = App.cart, ph = posPhoneCfg();
    if (!ph.on) { $('#cust').value = c.customer; $('#cust').onchange = function () { c.customer = this.value; var cu = Cust.get(c.customer); if (cu && cu.tier !== '' && cu.tier != null && can('pos.changeTier')) P.setTier(+cu.tier); CD.cart(); }; return; }
    var inp = $('#cbPhone'), res = $('#cbRes'), list = $('#cbList');
    var show = function () {
      var cu = c.customer ? Cust.get(c.customer) : null; $('#cbX').classList.toggle('hide', !(cu || c.newCust));
      if (cu) {
        inp.value = cu.phone || ''; var st = Cust.stats(cu);
        res.innerHTML = '<div class="cb-chip"><span class="cb-av">' + U.esc(cu.name.charAt(0)) + '</span><div class="grow"><b>' + U.esc(cu.name) + '</b><div class="muted small">' + st.visits + L(' زيارة', ' visits') + (st.last ? ' · ' + L('آخر زيارة ', 'last ') + U.today(st.last) : '') + '</div></div>' +
          (Loyalty.on() ? '<span class="chip ok" title="' + L('النقاط', 'Points') + '">⭐ <b class="num">' + U.n(cu.points) + '</b> = ' + U.money(Loyalty.value(cu.points)) + '</span>' : '') + (U.n(cu.balance) > 0 ? '<span class="chip bad">💳 ' + U.money(cu.balance) + '</span>' : '') + '</div>';
      } else if (c.newCust) {
        res.innerHTML = '<div class="cb-chip new"><span class="cb-av">✨</span><div class="grow"><b>' + L('عميل جديد', 'New customer') + '</b><div class="muted small">' + L('هيتسجّل تلقائي مع الفاتورة', 'Saved automatically with this sale') + (Loyalty.on() && U.n(S().loyalty.welcome) ? ' · 🎉 +' + S().loyalty.welcome + L(' نقطة هدية', ' welcome pts') : '') + '</div></div><input class="in" id="cbName" placeholder="' + L('الاسم (اختياري)', 'Name (optional)') + '" value="' + U.esc(c.newCust.name || '') + '" style="max-width:150px"></div>';
        $('#cbName').oninput = function () { c.newCust.name = this.value; };
      } else res.innerHTML = '';
    };
    var pick = function (cu) { c.customer = cu.id; c.newCust = null; list.innerHTML = ''; if (cu.tier !== '' && cu.tier != null && can('pos.changeTier')) P.setTier(+cu.tier); show(); CD.cart(); $('#scan').focus(); };
    var lookup = function (final) {
      var v = inp.value.trim(), n = Phone.norm(v); list.innerHTML = '';
      if (!v) { c.customer = ''; c.newCust = null; show(); CD.cart(); return; }
      var hit = Cust.byPhone(n);
      if (hit && n.length >= 10) return pick(hit);
      var q = U.norm(v), m = Store.db.customers.filter(function (x) { return (n.length >= 3 && Phone.norm(x.phone).indexOf(n) >= 0) || (!/^\d+$/.test(v) && v.length >= 2 && U.norm(x.name).indexOf(q) >= 0); }).slice(0, 5);
      if (m.length && !(final && Phone.valid(n) && n.length >= 11)) list.innerHTML = '<div class="cb-sug">' + m.map(function (x) { return '<div data-c="' + x.id + '"><b>' + U.esc(x.name) + '</b> <span class="num muted">' + U.esc(x.phone || '') + '</span>' + (Loyalty.on() ? ' <span class="chip">⭐ ' + U.n(x.points) + '</span>' : '') + '</div>'; }).join('') + '</div>';
      $$('[data-c]', list).forEach(function (d) { d.onmousedown = function (e) { e.preventDefault(); pick(Cust.get(d.dataset.c)); }; });
      c.customer = '';
      c.newCust = (/^\d+$/.test(n) && (n.length >= 11 || (final && Phone.valid(n)))) ? { phone: n, name: (c.newCust && c.newCust.name) || '' } : null;
      show(); CD.cart();
    };
    inp.oninput = function () { lookup(false); };
    inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); lookup(true); if (!list.innerHTML) $('#scan').focus(); } };
    inp.onblur = function () { setTimeout(function () { list.innerHTML = ''; }, 150); };
    $('#cbX').onclick = function () { c.customer = ''; c.newCust = null; inp.value = ''; show(); CD.cart(); inp.focus(); };
    show();
  }
};

/* ================= POS: checkout with points / coupon / gift card ================= */
Views.pos.pay = function () {
  custDefaults();
  var c = App.cart; if (!c.items.length) return;
  var ph = posPhoneCfg();
  if (ph.on && ph.required && can('pos.custPhone') && !c.customer && !(c.newCust && c.newCust.phone)) { beep(false); toast(L('اكتب رقم موبايل العميل الأول', 'Enter the customer mobile first'), 'bad'); var pi = $('#cbPhone'); if (pi) pi.focus(); return; }
  var t = Views.pos.totals(), methods = S().payMethods, cust = c.customer ? Cust.get(c.customer) : null, ly = S().loyalty;
  var x = { cp: null, cval: 0, pts: 0, pval: 0, gc: null, gval: 0, ex: c.exch ? U.n(c.exch.value) : 0 };
  var due = function () { return U.r2(Math.max(0, t.total - x.cval - x.pval - x.ex)); };
  var canPts = Loyalty.on() && cust && U.n(cust.points) >= U.n(ly.minRedeem);
  var m = Modal.open({
    size: 'wide', title: '💳 ' + L('إتمام البيع', 'Checkout'), body: '<div class="grid" style="grid-template-columns:1.05fr 1fr;gap:20px"><div class="col">' +
      '<div class="card kpi hero"><div class="l">' + L('المطلوب', 'Amount due') + '</div><div class="v num" id="dueV" style="font-size:38px"></div><div class="small" id="brk" style="opacity:.9;margin-top:4px"></div></div>' +
      '<div class="pay-extras">' +
      (canPts ? '<div class="px"><div class="row"><span style="font-size:20px">⭐</span><div class="grow"><b>' + L('نقاط ', 'Points of ') + U.esc(cust.name) + '</b><div class="muted small">' + L('عنده ', 'Has ') + '<b class="num">' + cust.points + '</b>' + L(' نقطة = ', ' pts = ') + U.money(Loyalty.value(cust.points)) + ' ' + cur() + '</div></div><input class="in num" id="ptsIn" type="number" min="0" style="width:90px" placeholder="0"><button class="btn sm gold" id="ptsMax">' + L('استخدم المتاح', 'Use max') + '</button></div><div class="muted small" id="ptsHint"></div></div>' : (Loyalty.on() && cust ? '<div class="px muted small">⭐ ' + L('نقاط العميل: ', 'Points: ') + U.n(cust.points) + L(' — أقل استبدال ', ' — minimum ') + ly.minRedeem + '</div>' : '')) +
      '<div class="px"><div class="row"><span style="font-size:20px">🎟️</span><input class="in" id="cpIn" placeholder="' + L('كود الكوبون', 'Coupon code') + '" style="text-transform:uppercase"><button class="btn sm" id="cpGo">' + L('تطبيق', 'Apply') + '</button></div><div class="small" id="cpMsg"></div></div>' +
      '<div class="px"><div class="row"><span style="font-size:20px">🎁</span><input class="in num" id="gcIn" placeholder="' + L('كود كارت الهدية (امسحه)', 'Gift card code (scan)') + '" style="text-transform:uppercase"><button class="btn sm" id="gcGo">' + L('استخدام', 'Use') + '</button></div><div class="small" id="gcMsg"></div></div></div>' +
      '<div class="grid g4" id="quick"></div>' +
      '<div class="card" style="padding:12px"><div class="row" style="justify-content:space-between"><span class="muted">' + L('الباقي للعميل', 'Change') + '</span><b class="num" id="chg" style="font-size:22px;color:var(--ok)">0.00</b></div><div class="row" style="justify-content:space-between;margin-top:6px"><span class="muted">' + L('متبقي (آجل)', 'Remaining (credit)') + '</span><b class="num" id="rem" style="color:var(--bad)">0.00</b></div>' + (Loyalty.on() && (cust || c.newCust) ? '<div class="row" style="justify-content:space-between;margin-top:6px"><span class="muted">⭐ ' + L('هيكسب', 'Will earn') + '</span><b class="num" id="earnV" style="color:var(--gold)"></b></div>' : '') + '</div></div>' +
      '<div class="col">' + methods.map(function (pm, i) { return '<label class="f">' + (lang() === 'en' ? pm[2] : pm[1]) + '<input class="in num" type="number" data-pm="' + pm[0] + '" ' + (i === 0 ? 'autofocus' : '') + ' style="font-size:18px"></label>'; }).join('') +
      '<div class="f hide" id="gcRow"><span>🎁 ' + L('من كارت الهدية', 'From gift card') + '</span><div class="in num" id="gcVal" style="font-size:18px;background:var(--bg2)"></div></div>' +
      '<label class="row small"><input type="checkbox" class="sw" id="prn" ' + (localStorage.getItem('ghandi.autoPrint') !== '0' ? 'checked' : '') + '> ' + L('طباعة الفاتورة', 'Print receipt') + '</label></div></div>',
    foot: '<button class="btn" data-x2>' + L('رجوع', 'Back') + '</button><button class="btn pri lg" id="done">' + ic('receipt') + L('تأكيد البيع', 'Complete sale') + ' <span class="kbd">Enter</span></button>'
  });
  var cashIn = $('[data-pm="cash"]', m) || $('[data-pm]', m);
  var refresh = function (resetCash) {
    var d = due();
    if (x.gc) { x.gval = U.r2(Math.min(x.gc.balance, d)); $('#gcRow', m).classList.remove('hide'); $('#gcVal', m).textContent = U.money(x.gval); } else { x.gval = 0; $('#gcRow', m).classList.add('hide'); }
    $('#dueV', m).textContent = U.money(d);
    var b = []; if (t.disc) b.push(L('خصم ', 'Disc ') + U.money(t.disc)); if (x.cval) b.push('🎟️ −' + U.money(x.cval)); if (x.pval) b.push('⭐ −' + U.money(x.pval)); if (t.saved) b.push('🎁 ' + L('وفّر ', 'saved ') + U.money(t.saved)); if (x.ex) { b.push('🔁 ' + L('رصيد الاستبدال −', 'exchange credit −') + U.money(x.ex)); var rf = U.r2(x.ex - (t.total - x.cval - x.pval)); if (rf > 0) b.push('💵 ' + L('رجّع للعميل ', 'refund ') + U.money(rf)); }
    $('#brk', m).textContent = b.join('  ·  ');
    if (typeof DiscSrc !== 'undefined') { var dls = DiscSrc.lines({ items: c.items, discount: t.disc, discPct: c.discType === '%' ? c.disc : 0, disc: { manual: t.disc, coupon: x.cval, points: x.pval }, coupon: x.cp ? x.cp.code : '', ptsRedeemed: x.pts }); if (dls.length) $('#brk', m).innerHTML = DiscSrc.html(dls) + (x.ex ? '<div style="margin-top:4px">' + U.esc(b.filter(function (z) { return /🔁|💵/.test(z); }).join('  ·  ')) + '</div>' : ''); }
    var rest = U.r2(Math.max(0, d - x.gval));
    if (resetCash) { $$('[data-pm]', m).forEach(function (i) { i.value = ''; }); cashIn.value = rest || ''; }
    $('#quick', m).innerHTML = [rest, Math.ceil(rest / 50) * 50, Math.ceil(rest / 100) * 100, Math.ceil(rest / 200) * 200].filter(function (v, i, a) { return v > 0 && a.indexOf(v) === i; }).map(function (v) { return '<button class="btn" data-q="' + v + '">' + U.money(v) + '</button>'; }).join('');
    $$('[data-q]', m).forEach(function (bq) { bq.onclick = function () { cashIn.value = bq.dataset.q; calc(); }; });
    if ($('#earnV', m)) $('#earnV', m).textContent = '+' + Loyalty.earnFor(d) + L(' نقطة', ' pts');
    calc();
  };
  var calc = function () {
    var d = due(), paid = x.gval, cash = 0; $$('[data-pm]', m).forEach(function (i) { paid += U.n(i.value); if (i.dataset.pm === 'cash') cash = U.n(i.value); });
    var other = paid - cash, needCash = Math.max(0, d - other), change = Math.max(0, cash - needCash), rem = Math.max(0, d - paid);
    $('#chg', m).textContent = U.money(change); $('#rem', m).textContent = U.money(rem); return { paid: paid, change: change, rem: rem };
  };
  if (canPts) {
    var setPts = function (v) { var mx = Loyalty.maxRedeem(cust, U.r2(t.total - x.cval)); v = Math.max(0, Math.min(Math.round(U.n(v)), mx)); if (v && v < U.n(ly.minRedeem)) v = 0; x.pts = v; x.pval = Loyalty.value(v); $('#ptsIn', m).value = v || ''; $('#ptsHint', m).textContent = L('أقصى استبدال في الفاتورة دي: ', 'Max for this invoice: ') + mx + L(' نقطة', ' pts') + (v ? ' → ' + L('خصم ', 'discount ') + U.money(x.pval) : ''); refresh(true); };
    $('#ptsIn', m).onchange = function () { setPts(this.value); };
    $('#ptsMax', m).onclick = function () { setPts(1e9); };
    setPts(0);
  }
  $('#cpGo', m).onclick = function () {
    var code = $('#cpIn', m).value.trim(); if (!code) { x.cp = null; x.cval = 0; $('#cpMsg', m).textContent = ''; return refresh(true); }
    var cp = Coupons.find(code), err = Coupons.check(cp, t.total, cust);
    if (err) { beep(false); x.cp = null; x.cval = 0; $('#cpMsg', m).innerHTML = '<span style="color:var(--bad)">❌ ' + err + '</span>'; return refresh(true); }
    x.cp = cp; x.cval = Coupons.value(cp, t.total); beep(true); $('#cpMsg', m).innerHTML = '<span style="color:var(--ok)">✅ ' + U.esc(cp.code) + ' — ' + L('خصم ', 'discount ') + U.money(x.cval) + '</span>';
    if (canPts) $('#ptsIn', m).onchange(); else refresh(true);
  };
  $('#cpIn', m).onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#cpGo', m).click(); } };
  $('#gcGo', m).onclick = function () {
    var g = GiftCards.find($('#gcIn', m).value);
    if (!g) { beep(false); x.gc = null; $('#gcMsg', m).innerHTML = '<span style="color:var(--bad)">❌ ' + L('الكارت مش موجود', 'Card not found') + '</span>'; return refresh(true); }
    if (g.balance <= 0) { beep(false); x.gc = null; $('#gcMsg', m).innerHTML = '<span style="color:var(--bad)">❌ ' + L('رصيد الكارت خلص', 'Card balance is zero') + '</span>'; return refresh(true); }
    x.gc = g; beep(true); $('#gcMsg', m).innerHTML = '<span style="color:var(--ok)">✅ ' + L('رصيد الكارت ', 'Card balance ') + U.money(g.balance) + '</span>'; refresh(true);
  };
  $('#gcIn', m).onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#gcGo', m).click(); } };
  $$('[data-pm]', m).forEach(function (i) { i.oninput = calc; i.onkeydown = function (e) { if (e.key === 'Enter') $('#done', m).click(); }; });
  $('[data-x2]', m).onclick = function () { Modal.close(m); };
  refresh(true); setTimeout(function () { cashIn.focus(); cashIn.select(); }, 40);
  $('#done', m).onclick = function () {
    var r = calc(), d = due();
    if (r.rem > 0.009) {
      if (!c.customer && !c.newCust) return toast(L('اختار عميل أو اكتب موبايله للبيع الآجل', 'Pick a customer for credit'), 'bad');
      if (!can('pos.credit')) return toast(L('ليس لديك صلاحية البيع الآجل', 'No credit-sale permission'), 'bad');
    }
    var pays = {}; $$('[data-pm]', m).forEach(function (i) { if (U.n(i.value)) pays[i.dataset.pm] = U.n(i.value); });
    if (pays.cash) pays.cash = U.r2(pays.cash - r.change); if (x.gval) pays.gift = x.gval;
    localStorage.setItem('ghandi.autoPrint', $('#prn', m).checked ? '1' : '0');
    var net = U.r2(t.total - x.cval - x.pval), exU = U.r2(Math.min(x.ex, net)), refund = U.r2(Math.max(0, x.ex - net)), exRet = null;
    if (exU) pays.exchange = exU;
    if (c.exch) { var rp = {}; if (exU) rp.exchange = exU; if (refund) rp.cash = refund; exRet = Sales.create({ type: 'return', ref: c.exch.ref, items: c.exch.items, customer: c.exch.customer || c.customer, tier: c.exch.tier, subtotal: c.exch.sub, discount: c.exch.disc, total: x.ex, payments: rp, paid: x.ex }); exRet.exchange = true; }
    var sale = Sales.create({ type: 'sale', items: c.items, tier: c.tier, customer: c.customer, newCust: c.newCust, discount: U.r2(t.disc + x.cval + x.pval), disc: (x.cval || x.pval) ? { manual: t.disc, coupon: x.cval, points: x.pval } : null, coupon: x.cp ? x.cp.code : '', ptsRedeemed: x.pts, giftCode: x.gc ? x.gc.code : '', vat: t.vat, subtotal: t.sub, total: net, payments: pays, paid: U.r2(r.paid - r.change + exU), change: r.change, credit: r.rem });
    if (exRet) { sale.exRet = exRet.no; exRet.exSale = sale.no; Store.save(); if (refund) toast('💵 ' + L('رجّع للعميل ', 'Refund the customer ') + U.money(refund), 'ok'); }
    Modal.close(m);
    var autoP = $('#prn', m).checked;
    sale.items.forEach(function (i) { if (i.gift) { var g = GiftCards.find(i.gift); if (g) GiftCards.print(g); } });
    App.cart = newCart(); go('pos'); setTimeout(function () { ReceiptPop.show(sale, autoP); }, 60);
    toast(L('تم البيع ✓ فاتورة #', 'Sale completed ✓ #') + sale.no + (r.change ? ' — ' + L('الباقي ', 'change ') + U.money(r.change) : '') + (sale.ptsEarned ? ' — ⭐ +' + sale.ptsEarned : ''), 'ok');
  };
};

/* POS extra buttons: gift card sale, layaway, cash drawer — and customer display updates */
(function () {
  var draw = Views.pos.draw;
  Views.pos.draw = function () { draw.apply(this, arguments); try { CD.cart(); } catch (e) { } };
  var render = Views.pos.render;
  Views.pos.render = function (el) {
    custDefaults(); render.call(this, el);
    var hb = $('.paybar'); if (!hb) return;
    var bar = document.createElement('div'); bar.className = 'pos-extra';
    bar.innerHTML = (can('pos.sell') ? '<button class="btn sm" id="xGift" title="' + L('بيع كارت هدية', 'Sell a gift card') + '">🎁 ' + L('كارت هدية', 'Gift card') + '</button>' : '') + (can('layaway') ? '<button class="btn sm" id="xLay">📌 ' + L('حجز بعربون', 'Layaway') + '</button>' : '') + (can('pos.drawer') ? '<button class="btn sm" id="xDrw">🗄️ ' + L('فتح الدرج', 'Open drawer') + '</button>' : '') + (CD.on() ? '<button class="btn sm" id="xCd">🖥️</button>' : '');
    hb.parentNode.insertBefore(bar, hb);
    if ($('#xGift')) $('#xGift').onclick = function () { Modal.prompt('🎁 ' + L('بيع كارت هدية', 'Sell a gift card'), L('قيمة الكارت', 'Card value'), '200', function (v) { v = U.r2(U.n(v)); if (v <= 0) return; App.cart.items.push({ pid: null, name: L('كارت هدية', 'Gift card') + ' ' + U.money(v), qty: 1, price: v, cost: 0, gift: GiftCards.newCode(), manual: true }); App.cart.sel = App.cart.items.length - 1; Views.pos.draw(); }, 'number'); };
    if ($('#xLay')) $('#xLay').onclick = Layaway.fromCart;
    if ($('#xDrw')) $('#xDrw').onclick = function () { Drawer.open('manual'); };
    if ($('#xCd')) $('#xCd').onclick = CD.open;
    CD.open(); CD.cart();
  };
})();

/* ================= layaway (حجز بعربون) ================= */
var Layaway = {
  remaining: function (l) { return U.r2(l.total - (l.pays || []).reduce(function (a, p) { return a + p.v; }, 0)); },
  fromCart: function () {
    custDefaults(); var c = App.cart; if (!c.items.length) return toast(L('ضيف أصناف الأول', 'Add items first'), 'bad');
    if (c.items.some(function (i) { return i.gift; })) return toast(L('كارت الهدية مينفعش يتحجز', 'Gift cards cannot be reserved'), 'bad');
    var cu = c.customer ? Cust.get(c.customer) : null;
    if (!cu && !(c.newCust && c.newCust.phone)) return toast(L('الحجز محتاج عميل — اكتب رقم موبايله', 'Layaway needs a customer — enter a mobile'), 'bad');
    var t = Views.pos.totals(), dd = new Date(Date.now() + 14 * 864e5);
    var m = Modal.open({ title: '📌 ' + L('حجز بعربون', 'Layaway'), body: '<div class="col"><div class="card kpi hero"><div class="l">' + L('إجمالي الحجز', 'Total') + '</div><div class="v num">' + U.money(t.total) + '</div><div class="small">' + U.esc(cu ? cu.name : c.newCust.phone) + '</div></div>' +
      '<label class="f">' + L('العربون المدفوع دلوقتي', 'Deposit paid now') + '<input class="in num" type="number" id="lyDep" autofocus value="' + Math.ceil(t.total * 0.3) + '" style="font-size:20px"></label><label class="f">' + L('طريقة الدفع', 'Method') + '<select class="in" id="lyM">' + S().payMethods.map(function (p) { return '<option value="' + p[0] + '">' + (lang() === 'en' ? p[2] : p[1]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">' + L('آخر ميعاد للاستلام', 'Pick-up by') + '<input class="in" type="date" id="lyDue" value="' + U.today(dd) + '"></label><label class="f">' + L('ملاحظة', 'Note') + '<input class="in" id="lyNote"></label><div class="muted small">' + L('الأصناف بتتشال من المخزن وتتحجز للعميل لحد ما يستلم أو يتلغي الحجز.', 'Items are taken out of stock and held until pick-up or cancellation.') + '</div></div>', foot: '<button class="btn pri" id="lyGo">📌 ' + L('تأكيد الحجز', 'Confirm') + '</button>' });
    $('#lyGo', m).onclick = function () {
      var dep = U.r2(U.n($('#lyDep', m).value)); if (dep < 0 || dep > t.total) return toast(L('العربون غلط', 'Invalid deposit'), 'bad');
      var cust = cu || Cust.byPhone(c.newCust.phone) || Cust.create(c.newCust.phone, c.newCust.name, 'layaway');
      var db = Store.db; db.seq.layaway++;
      var l = { id: U.id(), no: db.seq.layaway, date: Date.now(), tier: c.tier || 0, customer: cust.id, items: c.items.map(function (i) { return { pid: i.pid, name: i.name, qty: i.qty, price: i.price, cost: i.cost, base: i.base, promo: i.promo }; }), subtotal: t.sub, discount: t.disc, total: t.total, due: $('#lyDue', m).value, note: $('#lyNote', m).value, status: 'open', by: App.user.name, pays: [] };
      l.items.forEach(function (i) { if (i.pid) Store.move(i.pid, -i.qty, 'reserve', 'L#' + l.no); });
      if (dep) l.pays.push({ t: Date.now(), v: dep, m: $('#lyM', m).value, shift: App.shift ? App.shift.id : '', by: App.user.name });
      db.layaways.push(l); cust.lastVisit = Date.now(); Store.log('layaway', 'L#' + l.no); Store.save(); Modal.close(m);
      Layaway.print(l); App.cart = newCart(); go('pos'); toast('📌 ' + L('تم الحجز رقم ', 'Layaway #') + l.no, 'ok');
      if (dep && $('#lyM', m).value === 'cash') Drawer.auto({ type: 'sale', payments: { cash: dep }, no: 'L' + l.no });
    };
  },
  print: function (l) {
    var cu = Cust.get(l.customer) || {}, rem = Layaway.remaining(l);
    Printer.print('<div class="rc" style="width:72mm;padding:3mm;font-size:12px"><div style="text-align:center;font-weight:800;font-size:16px">' + U.esc(shopName()) + '</div><div style="text-align:center;font-size:15px;margin:4px 0">📌 ' + L('إيصال حجز رقم ', 'Layaway #') + l.no + '</div><div>' + U.esc(cu.name || '') + ' — <span dir="ltr">' + U.esc(cu.phone || '') + '</span></div><div>' + U.dt(l.date) + '</div><hr>' + l.items.map(function (i) { return '<div style="display:flex;justify-content:space-between"><span>' + U.esc(i.name) + ' × ' + i.qty + '</span><span>' + U.money(i.qty * i.price) + '</span></div>'; }).join('') + '<hr><div style="display:flex;justify-content:space-between;font-weight:800"><span>' + L('الإجمالي', 'Total') + '</span><span>' + U.money(l.total) + '</span></div><div style="display:flex;justify-content:space-between"><span>' + L('المدفوع', 'Paid') + '</span><span>' + U.money(l.total - rem) + '</span></div><div style="display:flex;justify-content:space-between;font-weight:800"><span>' + L('الباقي', 'Remaining') + '</span><span>' + U.money(rem) + '</span></div><div style="margin-top:6px">' + L('آخر ميعاد للاستلام: ', 'Pick up by: ') + (l.due || '—') + '</div><div style="height:34px;margin:8px auto 0;width:70%">' + Barcode.svg('LAY' + l.no, { height: 40 }) + '</div></div>', { css: Receipt.css({ paper: '80' }), printer: S().printers.invoice, silent: S().printers.silent, receipt: true });
  }
};
Views.layaway = {
  f: 'open',
  render: function (el) {
    custDefaults(); var V = Views.layaway, list = Store.db.layaways.slice().reverse().filter(function (l) { return V.f === 'all' || l.status === V.f; });
    var st = { open: ['warn', 'مفتوح', 'Open'], done: ['ok', 'اتسلّم', 'Delivered'], cancel: ['bad', 'اتلغى', 'Cancelled'] };
    el.innerHTML = '<div class="row" style="margin-bottom:14px"><div class="grow"><b style="font-size:16px">📌 ' + L('الحجوزات بعربون', 'Layaways') + '</b><div class="muted small">' + L('اعمل الحجز من شاشة البيع بزرار «حجز بعربون»', 'Create layaways from the POS screen') + '</div></div><div class="seg" id="lyF">' + [['open', 'المفتوحة', 'Open'], ['done', 'اتسلّمت', 'Delivered'], ['cancel', 'اتلغت', 'Cancelled'], ['all', 'الكل', 'All']].map(function (f) { return '<button data-f="' + f[0] + '" class="' + (V.f === f[0] ? 'on' : '') + '">' + L(f[1], f[2]) + '</button>'; }).join('') + '</div><input class="in" id="lyQ" style="width:200px" placeholder="' + L('رقم الحجز أو الموبايل', 'No. or mobile') + '"></div>' +
      '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('العميل', 'Customer') + '</th><th>' + L('الأصناف', 'Items') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>' + L('المدفوع', 'Paid') + '</th><th>' + L('الباقي', 'Remaining') + '</th><th>' + L('الاستلام', 'Pick-up') + '</th><th>' + L('الحالة', 'Status') + '</th></tr>' +
      (list.length ? list.map(function (l) { var cu = Cust.get(l.customer) || {}, rem = Layaway.remaining(l), late = l.status === 'open' && l.due && l.due < U.today(); return '<tr data-l="' + l.id + '" data-s="' + U.esc((cu.phone || '') + ' ' + l.no) + '" style="cursor:pointer"><td class="num"><b>' + l.no + '</b></td><td class="num">' + U.dt(l.date) + '</td><td>' + U.esc(cu.name || '') + '<div class="muted small num">' + U.esc(cu.phone || '') + '</div></td><td class="num">' + l.items.reduce(function (a, i) { return a + i.qty; }, 0) + '</td><td>' + M(l.total) + '</td><td class="num">' + U.money(l.total - rem) + '</td><td class="num" style="color:var(--bad);font-weight:700">' + U.money(rem) + '</td><td class="num">' + (late ? '⏰ ' : '') + (l.due || '') + '</td><td><span class="chip ' + st[l.status][0] + '">' + L(st[l.status][1], st[l.status][2]) + '</span></td></tr>'; }).join('') : '<tr><td colspan="9"><div class="empty"><span class="em">📌</span>' + L('مفيش حجوزات هنا', 'No layaways here') + '</div></td></tr>') + '</table></div>';
    $$('#lyF button').forEach(function (b) { b.onclick = function () { V.f = b.dataset.f; V.render(el); }; });
    $('#lyQ').oninput = function () { var q = this.value.trim(); $$('[data-l]').forEach(function (r) { r.style.display = !q || r.dataset.s.indexOf(Phone.norm(q) || q) >= 0 || r.dataset.s.indexOf(q) >= 0 ? '' : 'none'; }); };
    $$('[data-l]').forEach(function (r) { r.onclick = function () { V.open(Store.db.layaways.filter(function (l) { return l.id === r.dataset.l; })[0], el); }; });
  },
  open: function (l, el) {
    var cu = Cust.get(l.customer) || {}, rem = Layaway.remaining(l), V = Views.layaway;
    var m = Modal.open({ size: 'wide', title: '📌 ' + L('حجز رقم ', 'Layaway #') + l.no + ' — ' + U.esc(cu.name || ''), body: '<div class="grid g2"><div class="col"><div class="tbl-wrap"><table class="t">' + l.items.map(function (i) { return '<tr><td>' + U.esc(i.name) + '</td><td class="num">× ' + i.qty + '</td><td class="num">' + U.money(i.qty * i.price) + '</td></tr>'; }).join('') + '</table></div><div class="muted small">' + U.esc(l.note || '') + '</div></div>' +
      '<div class="col"><div class="grid g3"><div class="card kpi"><div class="l">' + L('الإجمالي', 'Total') + '</div><div class="v num" style="font-size:20px">' + U.money(l.total) + '</div></div><div class="card kpi"><div class="l">' + L('المدفوع', 'Paid') + '</div><div class="v num" style="font-size:20px;color:var(--ok)">' + U.money(l.total - rem) + '</div></div><div class="card kpi"><div class="l">' + L('الباقي', 'Left') + '</div><div class="v num" style="font-size:20px;color:var(--bad)">' + U.money(rem) + '</div></div></div>' +
      '<b>' + L('الدفعات', 'Payments') + '</b>' + ((l.pays || []).map(function (p) { return '<div class="list-row"><span class="grow num">' + U.dt(p.t) + '</span><span>' + pmName(p.m) + '</span><b class="num">' + U.money(p.v) + '</b></div>'; }).join('') || '<div class="muted small">—</div>') +
      (l.status === 'open' ? '<div class="row"><input class="in num" type="number" id="lpV" placeholder="' + L('دفعة جديدة', 'New payment') + '" value="' + rem + '"><select class="in" id="lpM" style="width:140px">' + S().payMethods.map(function (p) { return '<option value="' + p[0] + '">' + (lang() === 'en' ? p[2] : p[1]) + '</option>'; }).join('') + '</select></div>' : '') + '</div></div>',
      foot: (l.status === 'open' ? '<button class="btn" id="lCan" style="color:var(--bad)">✕ ' + L('إلغاء الحجز', 'Cancel layaway') + '</button><button class="btn" id="lPrn">🖨️</button><button class="btn" id="lPay">💵 ' + L('تسجيل الدفعة', 'Add payment') + '</button><button class="btn pri" id="lDel">✅ ' + L('تسليم للعميل', 'Deliver') + '</button>' : '<button class="btn" id="lPrn">🖨️</button>') });
    var addPay = function () { var v = U.r2(U.n($('#lpV', m).value)); if (v <= 0) return false; if (v > Layaway.remaining(l) + 0.001) { toast(L('أكبر من الباقي', 'More than remaining'), 'bad'); return false; } l.pays.push({ t: Date.now(), v: v, m: $('#lpM', m).value, shift: App.shift ? App.shift.id : '', by: App.user.name }); if ($('#lpM', m).value === 'cash') Drawer.auto({ type: 'sale', payments: { cash: v }, no: 'L' + l.no }); Store.save(); return true; };
    $('#lPrn', m).onclick = function () { Layaway.print(l); };
    if ($('#lPay', m)) $('#lPay', m).onclick = function () { if (addPay()) { Modal.close(m); toast(L('تم تسجيل الدفعة', 'Payment saved'), 'ok'); V.render(el); } };
    if ($('#lDel', m)) $('#lDel', m).onclick = function () {
      if (Layaway.remaining(l) > 0.009 && !addPay()) return;
      if (Layaway.remaining(l) > 0.009) return toast(L('لسه فيه باقي على العميل', 'There is still a balance'), 'bad');
      var s = Sales.create({ type: 'sale', items: l.items, tier: l.tier || 0, customer: l.customer, subtotal: l.subtotal, discount: l.discount, total: l.total, payments: { layaway: l.total }, paid: l.total, noStock: true, layaway: l.id });
      l.status = 'done'; l.sale = s.no; l.doneAt = Date.now(); Store.save(); Modal.close(m); ReceiptPop.show(s, true); toast('✅ ' + L('تم التسليم — فاتورة #', 'Delivered — invoice #') + s.no, 'ok'); V.render(el);
    };
    if ($('#lCan', m)) $('#lCan', m).onclick = function () { Modal.confirm(L('إلغاء الحجز ورجوع الأصناف للمخزن؟ العربون (', 'Cancel and return items to stock? Deposit (') + U.money(l.total - Layaway.remaining(l)) + L(') هيتسجل مردود للعميل.', ') will be recorded as refunded.'), function () { l.items.forEach(function (i) { if (i.pid) Store.move(i.pid, i.qty, 'unreserve', 'L#' + l.no); }); var paid = U.r2(l.total - Layaway.remaining(l)); if (paid) l.pays.push({ t: Date.now(), v: -paid, m: 'cash', shift: App.shift ? App.shift.id : '', by: App.user.name, refund: true }); l.status = 'cancel'; Store.log('layaway.cancel', 'L#' + l.no); Store.save(); Modal.close(m); V.render(el); }); };
  }
};

/* ================= customers page + profile ================= */
Views.customers = {
  q: '', sort: 'last', cur: null, tab: 'inv',
  render: function (el) {
    custDefaults(); var V = Views.customers; if (V.cur) return V.profile(el);
    var all = Store.db.customers, stats = {}; all.forEach(function (c) { stats[c.id] = Cust.stats(c); });
    var m0 = new Date(); m0.setDate(1); m0 = dayStart(m0);
    var ptsTot = all.reduce(function (a, c) { return a + U.n(c.points); }, 0), owe = all.filter(function (c) { return U.n(c.balance) > 0; });
    el.innerHTML = '<div class="grid g4" style="margin-bottom:14px"><div class="card kpi hero"><div class="ic">' + (kit() ? gem('💞', 'g-rose') : '') + '</div><div class="l">' + L('عدد العملاء', 'Customers') + '</div><div class="v num">' + all.length + '</div><div class="small" style="opacity:.85">+' + all.filter(function (c) { return (c.created || 0) >= m0; }).length + L(' الشهر ده', ' this month') + '</div></div>' +
      '<div class="card kpi"><div class="l">⭐ ' + L('نقاط عند العملاء', 'Points outstanding') + '</div><div class="v num">' + ptsTot + '</div><div class="muted small">' + (Loyalty.on() ? '= ' + U.money(Loyalty.value(ptsTot)) + ' ' + cur() : L('نظام النقاط مقفول', 'Loyalty is off')) + '</div></div>' +
      '<div class="card kpi"><div class="l">💳 ' + L('عملاء عليهم فلوس', 'Customers owing') + '</div><div class="v num">' + owe.length + '</div><div class="muted small">' + U.money(owe.reduce(function (a, c) { return a + U.n(c.balance); }, 0)) + '</div></div>' +
      '<div class="card kpi"><div class="l">🏆 ' + L('أعلى عميل', 'Top customer') + '</div><div class="v" style="font-size:17px">' + (function () { var b = all.slice().sort(function (a, b2) { return stats[b2.id].net - stats[a.id].net; })[0]; return b ? U.esc(b.name) + '<div class="muted small num">' + U.money(stats[b.id].net) + '</div>' : '—'; })() + '</div></div></div>' +
      '<div class="row wrap" style="margin-bottom:12px"><div class="scan" style="flex:1;min-width:280px;padding:4px 4px 4px 12px"><div class="bi">' + ic('search') + '</div><input id="cq" placeholder="' + L('ابحث بالموبايل أو الاسم أو رقم الفاتورة…', 'Search mobile, name or invoice #…') + '" value="' + U.esc(V.q) + '"></div><div class="seg" id="cs">' + [['last', 'آخر زيارة', 'Last visit'], ['spent', 'الأكثر شراء', 'Top spend'], ['pts', 'النقاط', 'Points'], ['new', 'الأحدث', 'Newest']].map(function (s) { return '<button data-s="' + s[0] + '" class="' + (V.sort === s[0] ? 'on' : '') + '">' + L(s[1], s[2]) + '</button>'; }).join('') + '</div><button class="btn pri" id="cAdd">' + ic('plus') + L('عميل جديد', 'New customer') + '</button>' + (can('export') ? '<button class="btn" id="cExp">' + ic('down') + 'Excel</button>' : '') + '</div><div class="tbl-wrap" id="ct"></div>';
    var draw = function () {
      var q = V.q.trim(), n = Phone.norm(q), qq = U.norm(q), byInv = null;
      if (/^#?\d{1,7}$/.test(q)) { var s = Store.db.sales.filter(function (x) { return String(x.no) === q.replace('#', ''); })[0]; if (s && s.customer) byInv = s.customer; }
      var rows = all.filter(function (c) { if (!q) return true; if (byInv && c.id === byInv) return true; return (n.length >= 3 && Phone.norm(c.phone).indexOf(n) >= 0) || U.norm(c.name).indexOf(qq) >= 0; });
      rows.sort(function (a, b) { var A = stats[a.id], B = stats[b.id]; return V.sort === 'spent' ? B.net - A.net : V.sort === 'pts' ? U.n(b.points) - U.n(a.points) : V.sort === 'new' ? (b.created || 0) - (a.created || 0) : (B.last || b.created || 0) - (A.last || a.created || 0); });
      $('#ct').innerHTML = '<table class="t"><tr><th></th><th>' + L('العميل', 'Customer') + '</th><th>' + L('الموبايل', 'Mobile') + '</th><th>' + L('الزيارات', 'Visits') + '</th><th>' + L('إجمالي المشتريات', 'Total spent') + '</th><th>⭐ ' + L('النقاط', 'Points') + '</th><th>💳 ' + L('عليه', 'Owes') + '</th><th>' + L('آخر زيارة', 'Last visit') + '</th></tr>' +
        (rows.length ? rows.slice(0, 400).map(function (c) { var st = stats[c.id]; return '<tr data-c="' + c.id + '" style="cursor:pointer"><td><span class="cb-av">' + U.esc(c.name.charAt(0)) + '</span></td><td><b>' + U.esc(c.name) + '</b>' + (byInv === c.id ? ' <span class="chip ok">🧾 #' + U.esc(q.replace('#', '')) + '</span>' : '') + (c.tier !== '' && c.tier != null ? ' <span class="chip">' + tierName(+c.tier) + '</span>' : '') + '</td><td class="num">' + U.esc(c.phone || '') + '</td><td class="num">' + st.visits + '</td><td>' + M(st.net) + '</td><td class="num">' + U.n(c.points) + '</td><td>' + (U.n(c.balance) > 0 ? '<b style="color:var(--bad)" class="num">' + U.money(c.balance) + '</b>' : '<span class="muted">—</span>') + '</td><td class="num muted">' + (st.last ? U.dt(st.last) : '—') + '</td></tr>'; }).join('') : '<tr><td colspan="8"><div class="empty"><span class="em">💞</span>' + (q ? L('مفيش عميل بالبحث ده', 'No match') : L('العملاء بيتسجلوا تلقائي من شاشة البيع برقم الموبايل', 'Customers are added automatically from the POS by mobile')) + '</div></td></tr>') + '</table>';
      $$('[data-c]', $('#ct')).forEach(function (r) { r.onclick = function () { V.cur = r.dataset.c; V.tab = 'inv'; V.render(el); }; });
    };
    var t; $('#cq').oninput = function () { clearTimeout(t); var v = this.value; t = setTimeout(function () { V.q = v; draw(); }, 120); };
    $$('#cs button').forEach(function (b) { b.onclick = function () { V.sort = b.dataset.s; $$('#cs button').forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); }; });
    $('#cAdd').onclick = function () { V.edit(null, el); };
    if ($('#cExp')) $('#cExp').onclick = function () { var rows = [[L('الاسم', 'Name'), L('الموبايل', 'Mobile'), L('الزيارات', 'Visits'), L('إجمالي المشتريات', 'Spent'), L('النقاط', 'Points'), L('عليه', 'Owes'), L('آخر زيارة', 'Last visit'), L('تاريخ التسجيل', 'Joined')]]; all.forEach(function (c) { var s2 = stats[c.id]; rows.push([c.name, c.phone || '', s2.visits, U.r2(s2.net), U.n(c.points), U.n(c.balance), s2.last ? U.dt(s2.last) : '', c.created ? U.dt(c.created) : '']); }); saveBlob(XL.writeXlsx(rows, 'Customers', lang() !== 'en'), 'customers_' + U.today() + '.xlsx'); };
    draw(); $('#cq').focus();
  },
  edit: function (c, el) {
    var d = c || { name: '', phone: '', tier: '', note: '', birthday: '' };
    var m = Modal.open({ title: c ? L('تعديل بيانات العميل', 'Edit customer') : L('عميل جديد', 'New customer'), body: '<div class="col"><label class="f">' + L('الاسم', 'Name') + '<input class="in" id="ceN" autofocus value="' + U.esc(d.name) + '"></label><label class="f">' + L('الموبايل', 'Mobile') + '<input class="in num" id="ceP" value="' + U.esc(d.phone || '') + '" style="direction:ltr;text-align:start"></label><label class="f">' + L('رقم تاني', 'Second number') + '<input class="in num" id="ceP2" value="' + U.esc(d.phone2 || '') + '" style="direction:ltr;text-align:start"></label><label class="f">' + L('شريحة سعر ثابتة', 'Fixed price tier') + '<select class="in" id="ceT"><option value="">—</option>' + S().tiers.map(function (t, i) { return '<option value="' + i + '" ' + (String(d.tier) === String(i) ? 'selected' : '') + '>' + tierName(i) + '</option>'; }).join('') + '</select></label><label class="f">' + L('عيد الميلاد', 'Birthday') + '<input class="in" type="date" id="ceB" value="' + (d.birthday || '') + '"></label><label class="f">' + L('ملاحظات', 'Notes') + '<input class="in" id="ceNo" value="' + U.esc(d.note || '') + '"></label></div>', foot: '<button class="btn pri" id="ceS">' + L('حفظ', 'Save') + '</button>' });
    $('#ceS', m).onclick = function () {
      var name = $('#ceN', m).value.trim(), ph = Phone.norm($('#ceP', m).value); if (!name && !ph) return toast(L('اكتب الاسم أو الموبايل', 'Enter a name or mobile'), 'bad');
      var other = ph && Cust.byPhone(ph); if (other && other !== c) return toast(L('الرقم ده مسجل لعميل تاني: ', 'Number belongs to: ') + other.name, 'bad');
      var t = c || Cust.create(ph, name, 'manual'); t.name = name || t.name; t.phone = ph; t.phone2 = Phone.norm($('#ceP2', m).value); t.tier = $('#ceT', m).value; t.birthday = $('#ceB', m).value; t.note = $('#ceNo', m).value;
      Store.save(); Modal.close(m); toast(L('تم الحفظ', 'Saved'), 'ok'); Views.customers.render(el);
    };
  },
  profile: function (el) {
    var V = Views.customers, c = Cust.get(V.cur); if (!c) { V.cur = null; return V.render(el); }
    var st = Cust.stats(c), sales = Cust.sales(c).slice().reverse(), lays = (Store.db.layaways || []).filter(function (l) { return l.customer === c.id; });
    var tabs = [['inv', '🧾', 'الفواتير', 'Invoices', sales.length], ['buy', '🛍️', 'المشتريات', 'Purchases', ''], ['pts', '⭐', 'النقاط', 'Points', (c.pts || []).length], ['acc', '💳', 'الحساب', 'Account', ''], ['lay', '📌', 'الحجوزات', 'Layaways', lays.length]];
    el.innerHTML = '<div class="row" style="margin-bottom:14px"><button class="btn" id="cBack">' + ic('ret') + '</button><span class="cb-av lg">' + U.esc(c.name.charAt(0)) + '</span><div class="grow"><b style="font-size:20px">' + U.esc(c.name) + '</b><div class="muted"><span class="num">' + U.esc(c.phone || '') + '</span>' + (c.phone2 ? ' · <span class="num">' + U.esc(c.phone2) + '</span>' : '') + ' · ' + L('عميل من ', 'since ') + (c.created ? U.today(c.created) : '—') + (c.birthday ? ' · 🎂 ' + c.birthday : '') + (c.tier !== '' && c.tier != null ? ' · <span class="chip">' + tierName(+c.tier) + '</span>' : '') + '</div>' + (c.note ? '<div class="small">📝 ' + U.esc(c.note) + '</div>' : '') + '</div>' +
      (can('pos.sell') ? '<button class="btn pri" id="cSell">🛍️ ' + L('بيع للعميل ده', 'Sell to this customer') + '</button>' : '') + '<button class="btn" id="cEdit">' + ic('edit') + L('تعديل', 'Edit') + '</button>' + (Loyalty.on() && can('customers.points') ? '<button class="btn" id="cPts">⭐ ' + L('تعديل النقاط', 'Adjust points') + '</button>' : '') + (U.n(c.balance) > 0 ? '<button class="btn gold" id="cPay">💳 ' + L('سداد', 'Settle') + '</button>' : '') + '</div>' +
      '<div class="grid g4" style="margin-bottom:14px"><div class="card kpi hero"><div class="l">' + L('إجمالي المشتريات', 'Total spent') + '</div><div class="v">' + M(st.net) + '</div><div class="small" style="opacity:.85">' + st.visits + L(' زيارة · متوسط ', ' visits · avg ') + U.money(st.avg) + '</div></div>' +
      '<div class="card kpi"><div class="l">⭐ ' + L('النقاط', 'Points') + '</div><div class="v num">' + U.n(c.points) + '</div><div class="muted small">' + (Loyalty.on() ? '= ' + U.money(Loyalty.value(c.points)) + ' ' + cur() : L('النقاط مقفولة', 'Loyalty off')) + '</div></div>' +
      '<div class="card kpi"><div class="l">💳 ' + L('عليه (آجل)', 'Owes') + '</div><div class="v num" style="color:' + (U.n(c.balance) > 0 ? 'var(--bad)' : 'inherit') + '">' + U.money(c.balance) + '</div><div class="muted small">↩️ ' + L('مرتجعات ', 'returns ') + U.money(st.returns) + '</div></div>' +
      '<div class="card kpi"><div class="l">🕒 ' + L('آخر زيارة', 'Last visit') + '</div><div class="v" style="font-size:18px">' + (st.last ? U.today(st.last) : '—') + '</div><div class="muted small">' + st.items + L(' قطعة اشتراها', ' items bought') + '</div></div></div>' +
      '<div class="seg" id="cTabs" style="margin-bottom:12px">' + tabs.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (V.tab === t[0] ? 'on' : '') + '">' + t[1] + ' ' + L(t[2], t[3]) + (t[4] !== '' ? ' <span class="chip">' + t[4] + '</span>' : '') + '</button>'; }).join('') + '</div><div id="cBody"></div>';
    var body = $('#cBody');
    if (V.tab === 'inv') body.innerHTML = '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('النوع', 'Type') + '</th><th>' + L('القطع', 'Items') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>⭐</th><th>' + L('الكاشير', 'Cashier') + '</th></tr>' + (sales.length ? sales.map(function (s) { return '<tr data-s="' + s.id + '" style="cursor:pointer' + (s.void ? ';opacity:.45;text-decoration:line-through' : '') + '"><td class="num"><b>' + s.no + '</b></td><td class="num">' + U.dt(s.date) + '</td><td>' + (s.type === 'return' ? '<span class="chip bad">' + L('مرتجع', 'Return') + '</span>' : '<span class="chip ok">' + L('بيع', 'Sale') + '</span>') + (s.layaway ? ' <span class="chip">📌</span>' : '') + '</td><td class="num">' + s.items.reduce(function (a, i) { return a + i.qty; }, 0) + '</td><td><b>' + M(s.total) + '</b></td><td class="num">' + (s.ptsEarned ? '<span style="color:var(--ok)">+' + s.ptsEarned + '</span> ' : '') + (s.ptsRedeemed ? '<span style="color:var(--bad)">−' + s.ptsRedeemed + '</span>' : '') + (s.ptsBack ? '<span style="color:var(--bad)">−' + s.ptsBack + '</span>' : '') + '</td><td>' + U.esc(s.userName) + '</td></tr>'; }).join('') : '<tr><td colspan="7"><div class="empty">—</div></td></tr>') + '</table></div>';
    else if (V.tab === 'buy') { var agg = {}; sales.forEach(function (s) { if (s.void) return; var sg = s.type === 'return' ? -1 : 1; s.items.forEach(function (i) { var k = i.pid || i.name; agg[k] = agg[k] || { n: i.name, q: 0, v: 0, last: 0, p: i.pid }; agg[k].q += sg * i.qty; agg[k].v += sg * i.qty * i.price; agg[k].last = Math.max(agg[k].last, s.date); }); }); var ar = Object.keys(agg).map(function (k) { return agg[k]; }).filter(function (a) { return a.q > 0; }).sort(function (a, b) { return b.v - a.v; });
      body.innerHTML = '<div class="tbl-wrap"><table class="t"><tr><th></th><th>' + L('الصنف', 'Product') + '</th><th>' + L('الكمية', 'Qty') + '</th><th>' + L('القيمة', 'Value') + '</th><th>' + L('آخر مرة', 'Last bought') + '</th></tr>' + (ar.length ? ar.map(function (a) { var p = Store.product(a.p); return '<tr><td>' + (p ? (p.img ? '<span class="pthumb" style="background-image:url(' + p.img + ')"></span>' : (kit() ? prodGem(p, 'sm') : '')) : '🎁') + '</td><td><b>' + U.esc(a.n) + '</b>' + (p && p.shade ? ' <span class="muted small">' + U.esc(p.shade) + '</span>' : '') + '</td><td class="num">' + a.q + '</td><td class="num">' + U.money(a.v) + '</td><td class="num muted">' + U.today(a.last) + '</td></tr>'; }).join('') : '<tr><td colspan="5"><div class="empty">—</div></td></tr>') + '</table></div>'; }
    else if (V.tab === 'pts') body.innerHTML = '<div class="tbl-wrap"><table class="t"><tr><th>' + L('التاريخ', 'Date') + '</th><th>' + L('الحركة', 'Movement') + '</th><th>' + L('النقاط', 'Points') + '</th><th>' + L('فاتورة', 'Invoice') + '</th><th>' + L('بواسطة', 'By') + '</th></tr>' + ((c.pts || []).length ? c.pts.slice().reverse().map(function (p) { var lb = Points.label(p.r); return '<tr><td class="num">' + U.dt(p.t) + '</td><td>' + lb[0] + ' ' + L(lb[1], lb[2]) + (p.note ? ' <span class="muted small">' + U.esc(p.note) + '</span>' : '') + '</td><td class="num" style="font-weight:800;color:' + (p.d > 0 ? 'var(--ok)' : 'var(--bad)') + '">' + (p.d > 0 ? '+' : '') + p.d + '</td><td class="num">' + (p.inv ? '#' + p.inv : '') + '</td><td>' + U.esc(p.by || '') + '</td></tr>'; }).join('') : '<tr><td colspan="5"><div class="empty"><span class="em">⭐</span>' + L('لسه مفيش نقاط', 'No points yet') + '</div></td></tr>') + '</table></div>';
    else if (V.tab === 'acc') { var cr = sales.filter(function (s) { return s.credit && !s.void; }); body.innerHTML = '<div class="grid g2"><div class="card"><h3>🧾 ' + L('فواتير آجل', 'Credit invoices') + '</h3>' + (cr.length ? cr.map(function (s) { return '<div class="list-row"><span class="grow">#' + s.no + ' · <span class="num">' + U.dt(s.date) + '</span></span><b class="num">' + U.money(s.credit) + '</b></div>'; }).join('') : '<div class="empty">—</div>') + '</div><div class="card"><h3>💵 ' + L('السداد', 'Payments') + '</h3>' + ((c.payments || []).length ? c.payments.slice().reverse().map(function (p) { return '<div class="list-row"><span class="grow num">' + U.dt(p.t) + ' · ' + U.esc(p.u || '') + '</span><b class="num" style="color:var(--ok)">' + U.money(p.v) + '</b></div>'; }).join('') : '<div class="empty">—</div>') + '</div></div>'; }
    else body.innerHTML = '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>' + L('الباقي', 'Left') + '</th><th>' + L('الحالة', 'Status') + '</th></tr>' + (lays.length ? lays.map(function (l) { return '<tr><td class="num">' + l.no + '</td><td class="num">' + U.dt(l.date) + '</td><td class="num">' + U.money(l.total) + '</td><td class="num">' + U.money(Layaway.remaining(l)) + '</td><td>' + l.status + '</td></tr>'; }).join('') : '<tr><td colspan="5"><div class="empty">—</div></td></tr>') + '</table></div>';
    $$('[data-s]', body).forEach(function (r) { r.onclick = function () { Views.sales.open(Store.db.sales.filter(function (s) { return s.id === r.dataset.s; })[0]); }; });
    $('#cBack').onclick = function () { V.cur = null; V.render(el); };
    $$('#cTabs button').forEach(function (b) { b.onclick = function () { V.tab = b.dataset.t; V.profile(el); }; });
    $('#cEdit').onclick = function () { V.edit(c, el); };
    if ($('#cSell')) $('#cSell').onclick = function () { App.cart = App.cart && App.cart.items.length ? App.cart : newCart(); App.cart.customer = c.id; App.cart.newCust = null; go('pos'); };
    if ($('#cPts')) $('#cPts').onclick = function () { var m = Modal.open({ title: '⭐ ' + L('تعديل نقاط ', 'Adjust points — ') + U.esc(c.name), body: '<div class="col"><div class="muted">' + L('الرصيد الحالي: ', 'Current: ') + '<b>' + U.n(c.points) + '</b></div><label class="f">' + L('عدد النقاط (+ للإضافة، − للخصم)', 'Points (+ add, − remove)') + '<input class="in num" type="number" id="apV" autofocus></label><label class="f">' + L('السبب', 'Reason') + '<input class="in" id="apN" placeholder="' + L('مثلاً: هدية عيد ميلاد', 'e.g. birthday gift') + '"></label></div>', foot: '<button class="btn pri" id="apS">' + L('حفظ', 'Save') + '</button>' }); $('#apS', m).onclick = function () { var v = Math.round(U.n($('#apV', m).value)); if (!v) return; Points.add(c, v, 'adjust', ''); c.pts[c.pts.length - 1].note = $('#apN', m).value; Store.log('points.adjust', c.name + ' ' + v); Store.save(); Modal.close(m); V.tab = 'pts'; V.profile(el); }; };
    if ($('#cPay')) $('#cPay').onclick = function () { Modal.prompt(L('سداد — ', 'Settle — ') + U.esc(c.name), L('المبلغ', 'Amount'), U.n(c.balance), function (v) { v = U.n(v); if (!v) return; c.balance = U.r2(U.n(c.balance) - v); (c.payments = c.payments || []).push({ t: Date.now(), v: v, u: App.user.name, shift: App.shift ? App.shift.id : '' }); Store.log('customers.pay', c.name + ' ' + v); Store.save(); V.tab = 'acc'; V.profile(el); }, 'number'); };
  }
};
Views.suppliers = function (el) { Views.contacts.tab = 'suppliers'; Views.contacts.only = 'suppliers'; Views.contacts.render(el); };

/* ================= coupons & gift cards ================= */
Views.coupons = {
  tab: 'cp',
  render: function (el) {
    custDefaults(); var V = Views.coupons;
    el.innerHTML = '<div class="row" style="margin-bottom:14px"><div class="seg" id="cpT"><button data-t="cp" class="' + (V.tab === 'cp' ? 'on' : '') + '">🎟️ ' + L('الكوبونات', 'Coupons') + '</button><button data-t="gc" class="' + (V.tab === 'gc' ? 'on' : '') + '">🎁 ' + L('كروت الهدايا', 'Gift cards') + '</button></div><div class="grow"></div>' + (V.tab === 'cp' ? '<button class="btn pri" id="cpN">' + ic('plus') + L('كوبون جديد', 'New coupon') + '</button>' : '<input class="in num" id="gcQ" placeholder="' + L('امسح كود الكارت لمعرفة رصيده', 'Scan a card to check balance') + '" style="width:280px">') + '</div><div id="cpB"></div>';
    $$('#cpT button').forEach(function (b) { b.onclick = function () { V.tab = b.dataset.t; V.render(el); }; });
    if (V.tab === 'cp') {
      var list = Store.db.coupons.slice().reverse();
      $('#cpB').innerHTML = '<div class="tbl-wrap"><table class="t"><tr><th>' + L('الكود', 'Code') + '</th><th>' + L('الخصم', 'Discount') + '</th><th>' + L('أقل فاتورة', 'Min. invoice') + '</th><th>' + L('الفترة', 'Period') + '</th><th>' + L('الاستخدام', 'Uses') + '</th><th>' + L('الحالة', 'Status') + '</th><th></th></tr>' + (list.length ? list.map(function (c) { var err = Coupons.check(c, 1e12, null); return '<tr><td><span class="tag" style="font-size:14px">' + U.esc(c.code) + '</span>' + (c.note ? '<div class="muted small">' + U.esc(c.note) + '</div>' : '') + '</td><td><b>' + (c.type === 'pct' ? U.n(c.val) + '%' : U.money(c.val) + ' ' + cur()) + '</b></td><td class="num">' + (U.n(c.min) ? U.money(c.min) : '—') + '</td><td class="num small">' + (c.from || '…') + ' → ' + (c.to || '∞') + '</td><td class="num">' + U.n(c.used) + (U.n(c.max) ? ' / ' + c.max : '') + (c.once ? ' <span class="chip">' + L('مرة لكل عميل', 'once/customer') + '</span>' : '') + '</td><td>' + (err ? '<span class="chip warn">' + err + '</span>' : '<span class="chip ok">' + L('شغّال', 'Active') + '</span>') + '</td><td><button class="btn ghost sm" data-e="' + c.id + '">' + ic('edit', 15) + '</button></td></tr>'; }).join('') : '<tr><td colspan="7"><div class="empty"><span class="em">🎟️</span>' + L('اعمل كوبون وادّيه للعملاء على السوشيال — الكاشير يكتبه وقت الدفع', 'Create a coupon — the cashier enters it at checkout') + '</div></td></tr>') + '</table></div>';
      $('#cpN').onclick = function () { V.edit(null, el); };
      $$('[data-e]').forEach(function (b) { b.onclick = function () { V.edit(Store.db.coupons.filter(function (c) { return c.id === b.dataset.e; })[0], el); }; });
    } else {
      var g = Store.db.giftcards.slice().reverse(), out = g.reduce(function (a, x) { return a + U.n(x.balance); }, 0);
      $('#cpB').innerHTML = '<div class="grid g3" style="margin-bottom:12px"><div class="card kpi"><div class="l">' + L('كروت متباعة', 'Cards sold') + '</div><div class="v num">' + g.length + '</div></div><div class="card kpi"><div class="l">' + L('قيمتها', 'Value sold') + '</div><div class="v">' + M(g.reduce(function (a, x) { return a + U.n(x.initial); }, 0)) + '</div></div><div class="card kpi"><div class="l">' + L('رصيد لسه متصرفش', 'Unspent balance') + '</div><div class="v">' + M(out) + '</div></div></div>' +
        '<div class="muted small" style="margin-bottom:8px">💡 ' + L('بيع كارت هدية من شاشة البيع بزرار «كارت هدية». العميل يدفع بيه من خانة «كارت الهدية» وقت الدفع.', 'Sell cards from the POS «Gift card» button. Customers pay with them at checkout.') + '</div>' +
        '<div class="tbl-wrap"><table class="t"><tr><th>' + L('الكود', 'Code') + '</th><th>' + L('القيمة', 'Value') + '</th><th>' + L('الرصيد', 'Balance') + '</th><th>' + L('اتباع', 'Sold') + '</th><th>' + L('العميل', 'Customer') + '</th><th></th></tr>' + (g.length ? g.map(function (x) { var cu = Cust.get(x.customer); return '<tr data-g="' + x.code + '"><td><span class="tag">' + x.code + '</span></td><td class="num">' + U.money(x.initial) + '</td><td class="num"><b style="color:' + (x.balance > 0 ? 'var(--ok)' : 'var(--muted)') + '">' + U.money(x.balance) + '</b></td><td class="num">' + U.dt(x.created) + ' · #' + x.sale + '</td><td>' + U.esc(cu ? cu.name : '—') + '</td><td><button class="btn ghost sm" data-p="' + x.code + '">🖨️</button></td></tr>'; }).join('') : '<tr><td colspan="6"><div class="empty"><span class="em">🎁</span>—</div></td></tr>') + '</table></div>';
      $$('[data-p]').forEach(function (b) { b.onclick = function () { GiftCards.print(GiftCards.find(b.dataset.p)); }; });
      $('#gcQ').onkeydown = function (e) { if (e.key !== 'Enter') return; var x = GiftCards.find(this.value); this.value = ''; if (!x) { beep(false); return toast(L('الكارت مش موجود', 'Card not found'), 'bad'); } Modal.open({ title: '🎁 ' + x.code, body: '<div class="card kpi hero"><div class="l">' + L('الرصيد', 'Balance') + '</div><div class="v num">' + U.money(x.balance) + '</div><div class="small">' + L('من ', 'of ') + U.money(x.initial) + '</div></div>' + x.log.map(function (l) { return '<div class="list-row"><span class="grow num">' + U.dt(l.t) + ' · #' + l.inv + '</span><b class="num" style="color:' + (l.v > 0 ? 'var(--ok)' : 'var(--bad)') + '">' + (l.v > 0 ? '+' : '') + U.money(l.v) + '</b></div>'; }).join('') }); };
      $('#gcQ').focus();
    }
  },
  edit: function (c, el) {
    var d = c || { code: 'GH' + String(Math.floor(1000 + Math.random() * 9000)), type: 'pct', val: 10, min: 0, from: U.today(), to: '', max: 0, once: false, active: true, note: '' };
    var m = Modal.open({ title: c ? L('تعديل كوبون', 'Edit coupon') : L('كوبون جديد', 'New coupon'), body: '<div class="col"><label class="f">' + L('الكود (اللي العميل يقوله)', 'Code') + '<input class="in" id="kC" value="' + U.esc(d.code) + '" style="text-transform:uppercase;font-size:20px;letter-spacing:2px;direction:ltr;text-align:center"></label><div class="grid g2"><label class="f">' + L('النوع', 'Type') + '<select class="in" id="kT"><option value="pct">' + L('نسبة %', 'Percent %') + '</option><option value="amt" ' + (d.type === 'amt' ? 'selected' : '') + '>' + L('مبلغ ثابت', 'Fixed amount') + '</option></select></label><label class="f">' + L('القيمة', 'Value') + '<input class="in num" type="number" id="kV" value="' + d.val + '"></label></div><div class="grid g2"><label class="f">' + L('أقل قيمة فاتورة', 'Minimum invoice') + '<input class="in num" type="number" id="kM" value="' + U.n(d.min) + '"></label><label class="f">' + L('أقصى عدد استخدام (0 = مفتوح)', 'Max uses (0 = unlimited)') + '<input class="in num" type="number" id="kX" value="' + U.n(d.max) + '"></label></div><div class="grid g2"><label class="f">' + L('من', 'From') + '<input class="in" type="date" id="kF" value="' + (d.from || '') + '"></label><label class="f">' + L('إلى', 'To') + '<input class="in" type="date" id="kTo" value="' + (d.to || '') + '"></label></div><label class="row small"><input type="checkbox" class="sw" id="kO" ' + (d.once ? 'checked' : '') + '> ' + L('مرة واحدة بس لكل عميل', 'Once per customer') + '</label><label class="row small"><input type="checkbox" class="sw" id="kA" ' + (d.active !== false ? 'checked' : '') + '> ' + L('مفعّل', 'Active') + '</label><label class="f">' + L('ملاحظة', 'Note') + '<input class="in" id="kN" value="' + U.esc(d.note || '') + '"></label></div>', foot: (c ? '<button class="btn ghost" id="kD" style="color:var(--bad);margin-inline-end:auto">' + ic('trash') + '</button>' : '') + '<button class="btn pri" id="kS">' + L('حفظ', 'Save') + '</button>' });
    $('#kS', m).onclick = function () {
      var code = $('#kC', m).value.trim().toUpperCase().replace(/\s+/g, ''); if (!code) return; var ex = Coupons.find(code); if (ex && ex !== c) return toast(L('الكود موجود قبل كده', 'Code already exists'), 'bad');
      var t = c || { id: U.id(), used: 0, usedBy: [], created: Date.now() }; t.code = code; t.type = $('#kT', m).value; t.val = U.n($('#kV', m).value); t.min = U.n($('#kM', m).value); t.max = U.n($('#kX', m).value); t.from = $('#kF', m).value; t.to = $('#kTo', m).value; t.once = $('#kO', m).checked; t.active = $('#kA', m).checked; t.note = $('#kN', m).value;
      if (!c) Store.db.coupons.push(t); Store.log('coupon.save', code); Store.save(); Modal.close(m); Views.coupons.render(el);
    };
    if ($('#kD', m)) $('#kD', m).onclick = function () { Store.db.coupons.splice(Store.db.coupons.indexOf(c), 1); Store.save(); Modal.close(m); Views.coupons.render(el); };
  }
};

/* ================= supplier returns (مرتجع للمورد) ================= */
(function () {
  var render = Views.purchases.render;
  Views.purchases.render = function (el) {
    var V = Views.purchases;
    if (V.ret) return V.retForm(el);
    render.call(this, el);
    var h = $('#pnew'); if (h && !V.draft && !V.view) { var b = document.createElement('button'); b.className = 'btn'; b.innerHTML = '↩️ ' + L('مرتجع للمورد', 'Return to supplier'); b.onclick = function () { V.ret = { supplier: '', items: [], note: '' }; V.render(el); }; h.parentNode.insertBefore(b, h); }
  };
  Views.purchases.retForm = function (el) {
    var V = Views.purchases, d = V.ret, db = Store.db;
    el.innerHTML = '<div class="grid" style="grid-template-columns:1fr 330px;gap:16px;align-items:start"><div class="col"><div class="scan"><div class="bi">↩️</div><input id="rs" placeholder="' + L('امسح الصنف اللي راجع للمورد…', 'Scan the item going back…') + '"></div><div class="card" style="padding:0;overflow:hidden" id="rit"></div></div>' +
      '<div class="card col"><b style="font-size:16px">↩️ ' + L('مرتجع للمورد', 'Return to supplier') + '</b><label class="f">' + L('المورد', 'Supplier') + '<select class="in" id="rsup"><option value="">—</option>' + db.suppliers.map(function (s) { return '<option value="' + s.id + '" ' + (s.id === d.supplier ? 'selected' : '') + '>' + U.esc(s.name) + '</option>'; }).join('') + '</select></label><div class="card kpi hero"><div class="l">' + L('قيمة المرتجع', 'Return value') + '</div><div class="v num" id="rtot">0</div><div class="small">' + L('بتتخصم من حساب المورد', 'Deducted from the supplier balance') + '</div></div><label class="f">' + L('السبب', 'Reason') + '<input class="in" id="rnote" value="' + U.esc(d.note) + '" placeholder="' + L('مثلاً: تالف / مش مطابق', 'e.g. damaged') + '"></label><button class="btn pri lg" id="rsave">' + ic('save') + L('حفظ المرتجع', 'Save return') + '</button><button class="btn" id="rcan">' + L('إلغاء', 'Cancel') + '</button></div></div>';
    var draw = function () {
      $('#rit').innerHTML = d.items.length ? '<table class="t"><tr><th>' + L('الصنف', 'Product') + '</th><th>' + L('الرصيد', 'Stock') + '</th><th>' + L('الكمية', 'Qty') + '</th><th>' + L('التكلفة', 'Cost') + '</th><th></th></tr>' + d.items.map(function (i, x) { var p = Store.product(i.pid); return '<tr><td><b>' + U.esc(p ? pname(p) : '') + '</b></td><td class="num">' + (p ? U.n(p.stock) : '') + '</td><td><input class="in num" style="width:80px" type="number" data-q="' + x + '" value="' + i.qty + '"></td><td><input class="in num" style="width:90px" type="number" data-c="' + x + '" value="' + i.cost + '"></td><td><button class="btn ghost sm" data-r="' + x + '">✕</button></td></tr>'; }).join('') + '</table>' : '<div class="empty"><span class="em">↩️</span>' + L('امسح الأصناف الراجعة', 'Scan returned items') + '</div>';
      $$('[data-q]').forEach(function (i) { i.onchange = function () { d.items[+i.dataset.q].qty = Math.max(0, U.n(i.value)); draw(); }; });
      $$('[data-c]').forEach(function (i) { i.onchange = function () { d.items[+i.dataset.c].cost = U.n(i.value); draw(); }; });
      $$('[data-r]').forEach(function (b) { b.onclick = function () { d.items.splice(+b.dataset.r, 1); draw(); }; });
      $('#rtot').textContent = U.money(d.items.reduce(function (a, i) { return a + i.qty * i.cost; }, 0));
    };
    $('#rs').onkeydown = function (e) { if (e.key !== 'Enter') return; var p = Store.byBarcode(this.value); this.value = ''; if (!p) { beep(false); return; } var ex = d.items.filter(function (i) { return i.pid === p.id; })[0]; if (ex) ex.qty++; else d.items.push({ pid: p.id, qty: 1, cost: U.n(p.cost) }); beep(true); draw(); };
    $('#rsup').onchange = function () { d.supplier = this.value; }; $('#rnote').oninput = function () { d.note = this.value; };
    $('#rcan').onclick = function () { V.ret = null; V.render(el); };
    $('#rsave').onclick = function () {
      var items = d.items.filter(function (i) { return i.qty > 0; }); if (!items.length) return;
      var t = U.r2(items.reduce(function (a, i) { return a + i.qty * i.cost; }, 0)); db.seq.purchase++;
      var rec = { id: U.id(), no: db.seq.purchase, date: Date.now(), supplier: d.supplier, type: 'return', items: items.map(function (i) { return { pid: i.pid, qty: -i.qty, cost: i.cost }; }), total: -t, paid: 0, note: '↩️ ' + L('مرتجع للمورد', 'Return to supplier') + (d.note ? ' — ' + d.note : ''), by: App.user.name };
      items.forEach(function (i) { Store.move(i.pid, -i.qty, 'sreturn', 'R#' + rec.no); });
      if (d.supplier) { var s = db.suppliers.filter(function (x) { return x.id === d.supplier; })[0]; if (s) s.balance = U.r2(U.n(s.balance) - t); }
      db.purchases.push(rec); Store.log('supplier.return', 'R#' + rec.no + ' ' + t); Store.save(); V.ret = null; toast('↩️ ' + L('تم تسجيل المرتجع للمورد', 'Supplier return saved'), 'ok'); V.render(el);
    };
    draw(); $('#rs').focus();
  };
})();

/* ================= invoices: full search ================= */
Views.sales.st.f = Views.sales.st.f || { no: '', phone: '', t1: '', t2: '', a1: '', a2: '', type: '', pm: '' };
Views.sales.render = function (el) {
  var V = Views.sales, st = V.st, f = st.f;
  el.innerHTML = '<div class="row wrap" style="margin-bottom:10px">' + dateRangeBar('sr', st) + '</div>' +
    '<div class="card sfilt"><div class="row wrap" style="gap:8px"><label class="f">🧾 ' + L('رقم الفاتورة', 'Invoice #') + '<input class="in num" data-f="no" value="' + U.esc(f.no) + '" style="width:120px"></label><label class="f">📱 ' + L('موبايل العميل', 'Customer mobile') + '<input class="in num" data-f="phone" value="' + U.esc(f.phone) + '" style="width:150px"></label><label class="f">🕒 ' + L('من ساعة', 'From time') + '<input class="in" type="time" data-f="t1" value="' + f.t1 + '"></label><label class="f">' + L('إلى ساعة', 'To time') + '<input class="in" type="time" data-f="t2" value="' + f.t2 + '"></label><label class="f">💰 ' + L('المبلغ من', 'Amount from') + '<input class="in num" type="number" data-f="a1" value="' + f.a1 + '" style="width:100px"></label><label class="f">' + L('إلى', 'to') + '<input class="in num" type="number" data-f="a2" value="' + f.a2 + '" style="width:100px"></label><label class="f">' + L('النوع', 'Type') + '<select class="in" data-f="type"><option value="">' + L('الكل', 'All') + '</option><option value="sale" ' + (f.type === 'sale' ? 'selected' : '') + '>' + L('بيع', 'Sale') + '</option><option value="return" ' + (f.type === 'return' ? 'selected' : '') + '>' + L('مرتجع', 'Return') + '</option></select></label><label class="f">' + L('الدفع', 'Payment') + '<select class="in" data-f="pm"><option value="">' + L('الكل', 'All') + '</option>' + S().payMethods.concat([['gift', '🎁 كارت هدية', 'Gift card'], ['layaway', '📌 حجز', 'Layaway'], ['credit', 'آجل', 'Credit']]).map(function (p) { return '<option value="' + p[0] + '" ' + (f.pm === p[0] ? 'selected' : '') + '>' + (lang() === 'en' ? p[2] : p[1]) + '</option>'; }).join('') + '</select></label><button class="btn ghost sm" id="sfClr" style="align-self:flex-end">✕ ' + L('مسح الفلاتر', 'Clear') + '</button></div></div>' +
    '<div class="row" style="margin:10px 0" id="ssum"></div><div class="tbl-wrap" id="stb"></div>';
  bindRange('sr', st, function () { V.render(el); });
  $$('[data-f]', el).forEach(function (i) { i.oninput = i.onchange = function () { f[i.dataset.f] = i.value; V.table(); }; i.onkeydown = function (e) { if (e.key === 'Enter' && i.dataset.f === 'no') { var s = Store.db.sales.filter(function (x) { return String(x.no) === f.no.replace(/\D/g, ''); })[0]; if (s) V.open(s); } }; });
  $('#sfClr').onclick = function () { st.f = { no: '', phone: '', t1: '', t2: '', a1: '', a2: '', type: '', pm: '' }; V.render(el); };
  V.table();
};
Views.sales.table = function () {
  var V = Views.sales, st = V.st, f = st.f, r = rangeMs(st), mine = !can('shifts.all') && App.user.role !== 'admin';
  var ph = Phone.norm(f.phone), custIds = ph.length >= 3 ? Store.db.customers.filter(function (c) { return Phone.norm(c.phone).indexOf(ph) >= 0; }).map(function (c) { return c.id; }) : null;
  var mins = function (t) { var d = new Date(t); return d.getHours() * 60 + d.getMinutes(); }, hm = function (s) { if (!s) return null; var p = s.split(':'); return +p[0] * 60 + +p[1]; }, t1 = hm(f.t1), t2 = hm(f.t2);
  var list = Store.db.sales.filter(function (s) {
    if (f.no) return String(s.no).indexOf(f.no.replace(/\D/g, '')) === 0;
    if (!(s.date >= r[0] && s.date < r[1])) return false; if (mine && s.user !== App.user.id) return false;
    if (custIds && custIds.indexOf(s.customer) < 0) return false;
    if (t1 != null && mins(s.date) < t1) return false; if (t2 != null && mins(s.date) > t2) return false;
    if (f.a1 !== '' && s.total < U.n(f.a1)) return false; if (f.a2 !== '' && s.total > U.n(f.a2)) return false;
    if (f.type && s.type !== f.type) return false;
    if (f.pm) { if (f.pm === 'credit') { if (!s.credit) return false; } else if (!U.n((s.payments || {})[f.pm])) return false; }
    return true;
  }).reverse();
  var tot = list.reduce(function (a, s) { return a + (s.void ? 0 : (s.type === 'return' ? -s.total : s.total)); }, 0);
  $('#ssum').innerHTML = '<span class="chip">' + list.length + L(' فاتورة', ' invoices') + '</span> <span class="chip ok">' + L('الصافي ', 'Net ') + U.money(tot) + '</span>';
  $('#stb').innerHTML = '<table class="t"><tr><th>#</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('النوع', 'Type') + '</th><th>' + L('العميل', 'Customer') + '</th><th>' + L('القطع', 'Items') + '</th><th>' + L('الدفع', 'Payment') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>' + L('الكاشير', 'Cashier') + '</th></tr>' +
    (list.length ? list.slice(0, 600).map(function (s) { var c = Cust.get(s.customer); return '<tr data-id="' + s.id + '" style="cursor:pointer' + (s.void ? ';opacity:.45;text-decoration:line-through' : '') + '"><td class="num"><b>' + s.no + '</b></td><td class="num">' + U.dt(s.date) + '</td><td>' + (s.type === 'return' ? '<span class="chip bad">' + L('مرتجع', 'Return') + '</span>' : '<span class="chip ok">' + L('بيع', 'Sale') + '</span>') + '</td><td>' + (c ? U.esc(c.name) + '<div class="muted small num">' + U.esc(c.phone || '') + '</div>' : '—') + '</td><td class="num">' + s.items.reduce(function (a, i) { return a + i.qty; }, 0) + '</td><td>' + Object.keys(s.payments || {}).map(function (k) { return '<span class="chip">' + (k === 'gift' ? '🎁' : k === 'layaway' ? '📌' : pmName(k)) + '</span>'; }).join(' ') + (s.credit ? '<span class="chip warn">' + L('آجل', 'Credit') + '</span>' : '') + (s.coupon ? ' <span class="chip">🎟️</span>' : '') + (s.ptsRedeemed ? ' <span class="chip">⭐</span>' : '') + '</td><td><b>' + M(s.total) + '</b></td><td>' + U.esc(s.userName) + '</td></tr>'; }).join('') : '<tr><td colspan="8"><div class="empty"><span class="em">🔎</span>' + L('مفيش فواتير بالبحث ده', 'No invoices match') + '</div></td></tr>') + '</table>';
  $$('#stb tr[data-id]').forEach(function (rw) { rw.onclick = function () { V.open(Store.db.sales.filter(function (s) { return s.id === rw.dataset.id; })[0]); }; });
};

/* ================= products: scanner + date-added filter ================= */
(function () {
  var P = Views.products; P.df = P.df || { r: 'all', a: '', b: '' };
  var list = P.list;
  P.list = function () {
    var out = list.call(P), df = P.df; if (df.r === 'all') return out;
    var now = new Date(), a = 0, b = Date.now() + 1;
    if (df.r === 'today') a = dayStart(); else if (df.r === 'yest') { a = dayStart() - 864e5; b = dayStart(); } else if (df.r === 'week') a = dayStart() - 6 * 864e5; else if (df.r === 'month') { var m0 = new Date(); m0.setDate(1); a = dayStart(m0); } else { a = df.a ? new Date(df.a).getTime() : 0; b = df.b ? new Date(df.b).getTime() : b; }
    return out.filter(function (p) { var c = p.created || 0; return c >= a && c < b; }).sort(function (x, y) { return (y.created || 0) - (x.created || 0); });
  };
  var render = P.render;
  P.render = function (el) {
    render.call(P, el); var df = P.df;
    var bar = document.createElement('div'); bar.className = 'row wrap pdate'; bar.style.marginBottom = '12px';
    bar.innerHTML = '<span class="muted small">🗓️ ' + L('اتضاف:', 'Added:') + '</span><div class="seg" id="pdR">' + [['all', 'أي وقت', 'Any time'], ['today', 'النهارده', 'Today'], ['yest', 'امبارح', 'Yesterday'], ['week', 'آخر 7 أيام', 'Last 7 days'], ['month', 'الشهر ده', 'This month'], ['custom', 'من … إلى', 'Custom']].map(function (r) { return '<button data-r="' + r[0] + '" class="' + (df.r === r[0] ? 'on' : '') + '">' + L(r[1], r[2]) + '</button>'; }).join('') + '</div>' + (df.r === 'custom' ? '<input class="in" type="datetime-local" id="pdA" value="' + df.a + '" style="width:200px"><input class="in" type="datetime-local" id="pdB" value="' + df.b + '" style="width:200px">' : '') + (can('reports') ? '<button class="btn sm ghost" id="pdRep">📊 ' + L('تقرير الأصناف المضافة', 'Added-products report') + '</button>' : '');
    var tw = $('#pt'); tw.parentNode.insertBefore(bar, tw);
    $$('#pdR button').forEach(function (b) { b.onclick = function () { df.r = b.dataset.r; P.page = 0; P.render(el); }; });
    if ($('#pdA')) { $('#pdA').onchange = function () { df.a = this.value; P.table(); }; $('#pdB').onchange = function () { df.b = this.value; P.table(); }; }
    if ($('#pdRep')) $('#pdRep').onclick = function () { Views.reports.tab = 'added'; go('reports'); };
    // scanner: exact barcode + Enter opens the product straight away
    var q = $('#pq'); q.placeholder = L('امسح الباركود بالقارئ أو ابحث بالاسم / الماركة…', 'Scan a barcode or search name / brand…');
    q.addEventListener('keydown', function (e) { if (e.key !== 'Enter') return; var p = Store.byBarcode(q.value); if (!p) return; beep(true); if (can('products.edit') || can('products.editPrice')) P.edit(p); else { P.q = q.value; P.table(); } });
  };
})();

/* ================= reports: added products ================= */
(function () {
  var R = Views.reports, render = R.render; R.tab = R.tab || 'sales';
  R.ad = R.ad || { r: 'today', a: '', b: '' };
  R.render = function (el) {
    el.innerHTML = '<div class="seg" id="rT" style="margin-bottom:14px"><button data-t="sales" class="' + (R.tab === 'sales' ? 'on' : '') + '">📈 ' + L('المبيعات والأرباح', 'Sales & profit') + '</button><button data-t="added" class="' + (R.tab === 'added' ? 'on' : '') + '">📦 ' + L('الأصناف المضافة', 'Added products') + '</button><button data-t="cust" class="' + (R.tab === 'cust' ? 'on' : '') + '">💞 ' + L('العملاء والنقاط', 'Customers & points') + '</button></div><div id="rBody"></div>';
    $$('#rT button').forEach(function (b) { b.onclick = function () { R.tab = b.dataset.t; R.render(el); }; });
    var body = $('#rBody');
    if (R.tab === 'sales') return render.call(R, body);
    if (R.tab === 'cust') return R.custRep(body);
    R.added(body);
  };
  R.range = function (d) { var a = 0, b = Date.now() + 1; if (d.r === 'today') a = dayStart(); else if (d.r === 'yest') { a = dayStart() - 864e5; b = dayStart(); } else if (d.r === 'week') a = dayStart() - 6 * 864e5; else if (d.r === 'month') { var m0 = new Date(); m0.setDate(1); a = dayStart(m0); } else { a = d.a ? new Date(d.a).getTime() : dayStart(); b = d.b ? new Date(d.b).getTime() : b; } return [a, b]; };
  R.added = function (el) {
    var d = R.ad, rg = R.range(d), K = { open: ['🆕', 'رصيد افتتاحي', 'Opening'], purchase: ['🚚', 'استلام', 'Received'], 'import': ['📥', 'استيراد إكسيل', 'Excel import'], adjust: ['✏️', 'تعديل يدوي +', 'Manual +'], count: ['📋', 'زيادة جرد', 'Count +'] };
    var agg = {};
    Store.db.moves.forEach(function (mv) { if (mv.t < rg[0] || mv.t >= rg[1] || mv.q <= 0 || !K[mv.k]) return; var a = agg[mv.p] = agg[mv.p] || { q: 0, by: {}, last: 0 }; a.q += mv.q; a.by[mv.k] = (a.by[mv.k] || 0) + mv.q; a.last = Math.max(a.last, mv.t); });
    Store.db.products.forEach(function (p) { if ((p.created || 0) >= rg[0] && (p.created || 0) < rg[1]) { agg[p.id] = agg[p.id] || { q: 0, by: {}, last: p.created }; agg[p.id].isNew = true; } });
    var rows = Object.keys(agg).map(function (k) { var p = Store.product(k); return p ? { p: p, a: agg[k] } : null; }).filter(Boolean).sort(function (x, y) { return y.a.q - x.a.q; });
    var tq = rows.reduce(function (s, r) { return s + r.a.q; }, 0), tv = rows.reduce(function (s, r) { return s + r.a.q * U.n(r.p.cost); }, 0), nn = rows.filter(function (r) { return r.a.isNew; }).length, vc = can('products.viewCost');
    el.innerHTML = '<div class="row wrap" style="margin-bottom:12px"><div class="seg" id="adR">' + [['today', 'النهارده', 'Today'], ['yest', 'امبارح', 'Yesterday'], ['week', 'آخر 7 أيام', 'Last 7 days'], ['month', 'الشهر ده', 'This month'], ['custom', 'من … إلى', 'Custom']].map(function (r) { return '<button data-r="' + r[0] + '" class="' + (d.r === r[0] ? 'on' : '') + '">' + L(r[1], r[2]) + '</button>'; }).join('') + '</div>' + (d.r === 'custom' ? '<input class="in" type="datetime-local" id="adA" value="' + d.a + '" style="width:200px"><input class="in" type="datetime-local" id="adB" value="' + d.b + '" style="width:200px">' : '') + '<div class="grow"></div>' + (can('export') ? '<button class="btn" id="adX">' + ic('down') + 'Excel</button>' : '') + '<button class="btn" id="adP">' + ic('print') + L('طباعة', 'Print') + '</button></div>' +
      '<div class="grid g4" style="margin-bottom:12px"><div class="card kpi hero"><div class="l">📦 ' + L('القطع المضافة', 'Pieces added') + '</div><div class="v num">' + tq + '</div><div class="small" style="opacity:.85">' + U.dt(rg[0]) + ' → ' + U.dt(Math.min(rg[1], Date.now())) + '</div></div><div class="card kpi"><div class="l">' + L('أصناف اتضاف منها', 'Products restocked') + '</div><div class="v num">' + rows.length + '</div></div><div class="card kpi"><div class="l">🆕 ' + L('أصناف جديدة اتعرّفت', 'New products created') + '</div><div class="v num">' + nn + '</div></div>' + (vc ? '<div class="card kpi"><div class="l">💰 ' + L('قيمة المضاف (تكلفة)', 'Value added (cost)') + '</div><div class="v">' + M(tv) + '</div></div>' : '<div></div>') + '</div>' +
      '<div class="tbl-wrap"><table class="t"><tr><th></th><th>' + L('الصنف', 'Product') + '</th><th>' + L('الباركود', 'Barcode') + '</th><th>' + L('اتضاف', 'Added') + '</th><th>' + L('منها', 'Breakdown') + '</th><th>' + L('الرصيد الحالي', 'In stock now') + '</th>' + (vc ? '<th>' + L('القيمة', 'Value') + '</th>' : '') + '<th>' + L('آخر إضافة', 'Last added') + '</th></tr>' +
      (rows.length ? rows.map(function (r) { var p = r.p; return '<tr><td>' + (p.img ? '<span class="pthumb" style="background-image:url(' + p.img + ')"></span>' : (kit() ? prodGem(p, 'sm') : '')) + '</td><td><b>' + U.esc(pname(p)) + '</b> <span class="muted small">' + U.esc(p.shade || '') + '</span>' + (r.a.isNew ? ' <span class="chip ok">🆕 ' + L('جديد', 'new') + '</span>' : '') + '</td><td><span class="tag">' + U.esc(p.barcodes[0] || '') + '</span></td><td class="num"><b style="font-size:16px;color:var(--ok)">+' + r.a.q + '</b></td><td class="small">' + Object.keys(r.a.by).map(function (k) { return K[k][0] + ' ' + L(K[k][1], K[k][2]) + ' <b class="num">' + r.a.by[k] + '</b>'; }).join(' · ') + '</td><td class="num">' + U.n(p.stock) + '</td>' + (vc ? '<td class="num">' + U.money(r.a.q * U.n(p.cost)) + '</td>' : '') + '<td class="num muted">' + U.dt(r.a.last) + '</td></tr>'; }).join('') : '<tr><td colspan="8"><div class="empty"><span class="em">📦</span>' + L('مفيش أصناف اتضافت في الفترة دي', 'Nothing added in this period') + '</div></td></tr>') + '</table></div>';
    $$('#adR button').forEach(function (b) { b.onclick = function () { d.r = b.dataset.r; if (d.r === 'custom' && !d.a) { d.a = U.today() + 'T00:00'; d.b = U.today() + 'T23:59'; } R.added(el); }; });
    if ($('#adA')) { $('#adA').onchange = function () { d.a = this.value; R.added(el); }; $('#adB').onchange = function () { d.b = this.value; R.added(el); }; }
    var table = function () { return [[L('الصنف', 'Product'), L('اللون', 'Shade'), L('الباركود', 'Barcode'), L('الكمية المضافة', 'Qty added'), L('جديد', 'New'), L('الرصيد الحالي', 'Stock now')].concat(vc ? [L('القيمة', 'Value')] : []).concat([L('آخر إضافة', 'Last added')])].concat(rows.map(function (r) { return [r.p.name, r.p.shade || '', r.p.barcodes[0] || '', r.a.q, r.a.isNew ? '✓' : '', U.n(r.p.stock)].concat(vc ? [U.r2(r.a.q * U.n(r.p.cost))] : []).concat([U.dt(r.a.last)]); })); };
    if ($('#adX')) $('#adX').onclick = function () { saveBlob(XL.writeXlsx(table(), 'Added', lang() !== 'en'), 'added_products_' + U.today() + '.xlsx'); };
    $('#adP').onclick = function () { var t = table(); Printer.print('<h2>' + U.esc(shopName()) + ' — ' + L('تقرير الأصناف المضافة', 'Added products report') + '</h2><p>' + U.dt(rg[0]) + ' → ' + U.dt(Math.min(rg[1], Date.now())) + ' · ' + L('إجمالي القطع: ', 'Total pieces: ') + tq + '</p><table border="1" cellpadding="5" style="border-collapse:collapse;width:100%;font-size:12px">' + t.map(function (r, i) { return '<tr>' + r.map(function (c) { return (i ? '<td>' : '<th>') + U.esc(c) + (i ? '</td>' : '</th>'); }).join('') + '</tr>'; }).join('') + '</table>', { css: '@page{size:A4;margin:12mm}body{font-family:Tahoma,Arial}', silent: false, dir: lang() === 'en' ? 'ltr' : 'rtl' }); };
  };
  R.custRep = function (el) {
    var st = Views.reports.st, rg = rangeMs(st), news = Store.db.customers.filter(function (c) { return (c.created || 0) >= rg[0] && (c.created || 0) < rg[1]; });
    var earned = 0, redeemed = 0, expired = 0; Store.db.customers.forEach(function (c) { (c.pts || []).forEach(function (p) { if (p.t < rg[0] || p.t >= rg[1]) return; if (p.r === 'earn' || p.r === 'welcome') earned += p.d; else if (p.r === 'redeem') redeemed -= p.d; else if (p.r === 'expire') expired -= p.d; }); });
    var withC = salesIn(rg[0], rg[1]).filter(function (s) { return s.type === 'sale'; }), known = withC.filter(function (s) { return s.customer; }).length;
    el.innerHTML = '<div class="row wrap" style="margin-bottom:12px">' + dateRangeBar('rc', st) + '</div><div class="grid g4"><div class="card kpi hero"><div class="l">🆕 ' + L('عملاء جدد', 'New customers') + '</div><div class="v num">' + news.length + '</div></div><div class="card kpi"><div class="l">📱 ' + L('فواتير مسجّل عليها عميل', 'Invoices with a customer') + '</div><div class="v num">' + (withC.length ? Math.round(known / withC.length * 100) : 0) + '%</div><div class="muted small">' + known + ' / ' + withC.length + '</div></div><div class="card kpi"><div class="l">⭐ ' + L('نقاط اتكسبت', 'Points earned') + '</div><div class="v num">' + earned + '</div></div><div class="card kpi"><div class="l">🎁 ' + L('نقاط اتستبدلت', 'Points redeemed') + '</div><div class="v num">' + redeemed + '</div><div class="muted small">= ' + U.money(Loyalty.value(redeemed)) + ' · ⌛ ' + expired + '</div></div></div>';
    bindRange('rc', st, function () { R.custRep(el); });
  };
})();

/* ================= settings: customers & points, drawer, customer display ================= */
(function () {
  var orig = Views.settings;
  Views.settings = function (el) {
    custDefaults(); orig(el);
    var g = $('.grid', el); if (!g) return; var ly = S().loyalty, ph = S().posPhone, dr = S().drawer, cd = S().custDisplay;
    var card = document.createElement('div'); card.className = 'card col'; card.style.gridColumn = '1 / -1';
    card.innerHTML = '<h3>💞 ' + L('العملاء ونظام النقاط', 'Customers & loyalty points') + '</h3><div class="grid g2" style="align-items:start"><div class="col">' +
      '<label class="row"><input type="checkbox" class="sw" data-ph="on" ' + (ph.on ? 'checked' : '') + '> <b>📱 ' + L('خانة موبايل العميل في شاشة البيع', 'Customer mobile box at checkout') + '</b></label><div class="muted small">' + L('لما تكون شغّالة بتظهر لكل الكاشيرية في البيع والحجز. لو الرقم جديد العميل بيتسجّل تلقائي، ولو موجود بيظهر اسمه ونقاطه وبتتسجل الفاتورة عليه.', 'Shown to every cashier at checkout and layaway. New numbers are registered automatically; known ones show name & points.') + '</div>' +
      '<label class="row" style="' + (ph.on ? '' : 'opacity:.5') + '"><input type="checkbox" class="sw" data-ph="required" ' + (ph.required ? 'checked' : '') + (ph.on ? '' : ' disabled') + '> ' + L('إلزامي — ممنوع إتمام البيع من غير رقم', 'Required — cannot complete a sale without a number') + '</label>' +
      '<hr style="border:0;border-top:1px dashed var(--line);width:100%"><label class="row"><input type="checkbox" class="sw" data-ly="on" ' + (ly.on ? 'checked' : '') + '> <b>⭐ ' + L('تشغيل نظام النقاط', 'Enable loyalty points') + '</b></label>' +
      '<div class="ly-box" style="' + (ly.on ? '' : 'opacity:.5;pointer-events:none') + '"><div class="ly-line">💰 ' + L('كل', 'Every') + ' <input class="in num" type="number" data-ly="earnEvery" value="' + ly.earnEvery + '"> ' + cur() + L(' شراء = ', ' spent = ') + '<input class="in num" type="number" data-ly="earnPts" value="' + ly.earnPts + '"> ' + L('نقطة', 'pt') + '</div>' +
      '<div class="ly-line">🎁 ' + L('كل', 'Every') + ' <input class="in num" type="number" data-ly="redeemPts" value="' + ly.redeemPts + '"> ' + L('نقطة = خصم', 'pts = discount of') + ' <input class="in num" type="number" data-ly="redeemVal" value="' + ly.redeemVal + '"> ' + cur() + '</div>' +
      '<div class="ly-line">🔢 ' + L('أقل عدد نقاط للاستبدال', 'Minimum points to redeem') + ' <input class="in num" type="number" data-ly="minRedeem" value="' + ly.minRedeem + '"></div>' +
      '<div class="ly-line">📉 ' + L('النقاط تغطي لحد', 'Points may cover up to') + ' <input class="in num" type="number" data-ly="maxPct" value="' + ly.maxPct + '"> % ' + L('من الفاتورة', 'of the invoice') + '</div>' +
      '<div class="ly-line">⌛ ' + L('النقاط تنتهي لو العميل ماشتراش', 'Points expire after no purchase for') + ' <input class="in num" type="number" data-ly="expireMonths" value="' + ly.expireMonths + '"> ' + L('شهر (0 = مبتنتهيش)', 'months (0 = never)') + '</div>' +
      '<div class="ly-line">🎉 ' + L('هدية تسجيل لأي عميل جديد', 'Welcome gift for new customers') + ' <input class="in num" type="number" data-ly="welcome" value="' + ly.welcome + '"> ' + L('نقطة', 'pts') + '</div>' +
      '<label class="row small"><input type="checkbox" class="sw" data-ly="onCredit" ' + (ly.onCredit ? 'checked' : '') + '> ' + L('احسب نقاط على البيع الآجل كمان', 'Earn points on credit sales too') + '</label></div></div>' +
      '<div class="col"><div class="card ly-ex" id="lyEx"></div></div></div>';
    g.appendChild(card);
    var ex = function () { var l = S().loyalty, cb = Loyalty.cashback(); $('#lyEx').innerHTML = '<b>💡 ' + L('مثال بالإعدادات دي', 'Example with these settings') + '</b><div style="line-height:2;margin-top:6px">🛍️ ' + L('عميلة اشترت بـ ', 'A customer spends ') + '<b>1,000 ' + cur() + '</b> → ' + L('تكسب ', 'earns ') + '<b>' + Loyalty.earnFor(1000) + L(' نقطة', ' pts') + '</b><br>🎁 ' + L('النقط دي تساوي ', 'Worth ') + '<b>' + U.money(Loyalty.value(Loyalty.earnFor(1000))) + ' ' + cur() + '</b> ' + L('خصم في زيارة جاية', 'off a future visit') + '<br>📊 ' + L('يعني بترجّع للعميل ', 'That is a cashback of ') + '<b>' + cb + '%</b> ' + L('من مشترياته', 'of spending') + (cb > 10 ? ' <span class="chip bad">' + L('عالية!', 'high!') + '</span>' : cb >= 1 && cb <= 5 ? ' <span class="chip ok">' + L('نسبة مناسبة', 'healthy') + '</span>' : '') + '<br>🔢 ' + L('تقدر تستبدل من أول ', 'Can redeem from ') + '<b>' + l.minRedeem + L(' نقطة', ' pts') + '</b> (' + U.money(Loyalty.value(l.minRedeem)) + ')' + (U.n(l.expireMonths) ? '<br>⌛ ' + L('لو ماشترتش ', 'Expires after ') + l.expireMonths + L(' شهر النقاط تتحرق', ' months of inactivity') : '') + '</div><div class="muted small" style="margin-top:8px">' + L('المقترح لمعارض الأدوات المنزلية: كل 10 ج = نقطة، و100 نقطة = 10 ج (يعني 1%)، أو كل 10 ج = نقطة و100 نقطة = 20 ج (2%).', 'Suggested: 1 pt per 10 spent, 100 pts = 10 off (1%), or 100 pts = 20 off (2%).') + '</div>'; };
    $$('[data-ph]', card).forEach(function (i) { i.onchange = function () { S().posPhone[i.dataset.ph] = i.checked; Store.log('settings.posPhone', i.dataset.ph + '=' + i.checked); Store.save(); Views.settings(el); }; });
    $$('[data-ly]', card).forEach(function (i) { i.onchange = i.oninput = function () { S().loyalty[i.dataset.ly] = i.type === 'checkbox' ? i.checked : U.n(i.value); Store.save(); if (i.dataset.ly === 'on') { Store.log('loyalty', i.checked); Views.settings(el); } else ex(); }; });
    ex();
    var c2 = document.createElement('div'); c2.className = 'card col';
    c2.innerHTML = '<h3>🗄️ ' + L('درج الكاش', 'Cash drawer') + '</h3><label class="row"><input type="checkbox" class="sw" id="drOn" ' + (dr.on ? 'checked' : '') + '> ' + L('افتح الدرج تلقائي', 'Open the drawer automatically') + '</label><div class="seg" id="drW"><button data-v="cash" class="' + (dr.when !== 'all' ? 'on' : '') + '">' + L('مع الدفع الكاش بس', 'Cash payments only') + '</button><button data-v="all" class="' + (dr.when === 'all' ? 'on' : '') + '">' + L('مع كل فاتورة', 'Every invoice') + '</button></div><label class="f">' + L('الطابعة اللي الدرج متوصل بيها', 'Printer the drawer is connected to') + '<select class="in" id="drP"></select></label><button class="btn" id="drT">🧪 ' + L('جرّب فتح الدرج', 'Test drawer') + '</button><div class="muted small">' + L('الدرج بيتوصل بكابل في الطابعة الحرارية (RJ11). البرنامج بيبعتله أمر الفتح مباشرة.', 'The drawer plugs into the receipt printer (RJ11); Ghandi sends the kick command.') + '</div>';
    var c3 = document.createElement('div'); c3.className = 'card col';
    c3.innerHTML = '<h3>🖥️ ' + L('شاشة العميل', 'Customer display') + '</h3><label class="row"><input type="checkbox" class="sw" id="cdOn" ' + (cd.on ? 'checked' : '') + '> ' + L('شاشة تانية تعرض للعميل الأصناف والإجمالي والنقاط', 'Second screen shows items, total and points to the customer') + '</label><label class="f">' + L('رسالة الترحيب', 'Welcome message') + '<input class="in" id="cdMsg" value="' + U.esc(cd.msg) + '"></label><button class="btn" id="cdT">🖥️ ' + L('افتح شاشة العميل', 'Open customer display') + '</button><div class="muted small">' + L('وصّل شاشة تانية بالجهاز — البرنامج بيفتح عليها تلقائي وأنت في شاشة البيع.', 'Connect a second monitor — it opens there automatically at the POS.') + '</div>';
    g.appendChild(c2); g.appendChild(c3);
    $('#drOn').onchange = function () { S().drawer.on = this.checked; Store.save(); };
    $$('#drW button').forEach(function (b) { b.onclick = function () { S().drawer.when = b.dataset.v; $$('#drW button').forEach(function (x) { x.classList.toggle('on', x === b); }); Store.save(); }; });
    Printer.list().then(function (ps) { $('#drP').innerHTML = '<option value="">' + L('نفس طابعة الفواتير', 'Same as receipt printer') + '</option>' + ps.map(function (p) { return '<option>' + U.esc(p) + '</option>'; }).join(''); $('#drP').value = dr.printer || ''; });
    $('#drP').onchange = function () { S().drawer.printer = this.value; Store.save(); };
    $('#drT').onclick = function () { Drawer.open('test'); };
    $('#cdOn').onchange = function () { S().custDisplay.on = this.checked; Store.save(); if (this.checked) CD.open(); };
    $('#cdMsg').onchange = function () { S().custDisplay.msg = this.value; Store.save(); };
    $('#cdT').onclick = function () { S().custDisplay.on = true; $('#cdOn').checked = true; Store.save(); CD.open(); setTimeout(function () { CD.send({ mode: 'idle' }); }, 600); };
  };
})();

/* ================= license expiry alert + points expiry (on sign-in) ================= */
(function () {
  var start = Shell.start;
  Shell.start = function () {
    custDefaults(); start.apply(this, arguments);
    try { Loyalty.expireRun(); } catch (e) { }
    var li = License.info; if (!li || !li.e) return;
    var days = Math.ceil((li.e - Date.now()) / 864e5); if (days > 7) return;
    var chip = document.createElement('span'); chip.className = 'chip bad'; chip.style.cursor = 'pointer'; chip.innerHTML = '⏳ ' + L('الترخيص بيخلص بعد ', 'License ends in ') + days + L(' يوم', ' days');
    var top = $('#shiftChip'); if (top) top.parentNode.insertBefore(chip, top);
    chip.onclick = function () { go('about'); };
    var k = 'ghandi.licWarn.' + U.today(); try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) { }
    Modal.open({ title: '⏳ ' + L('الترخيص قرّب يخلص', 'License ending soon'), body: '<div style="text-align:center;padding:10px"><div style="font-size:54px">⏳</div><b style="font-size:20px">' + L('باقي ', 'Only ') + days + L(' يوم على انتهاء الترخيص', ' days left on your license') + '</b><div class="muted" style="margin:10px 0">' + L('علشان البرنامج يفضل شغّال من غير توقف، كلّم المطوّر للتجديد', 'Contact the developer to renew and keep working without interruption') + '</div><div class="card" style="display:inline-block;padding:12px 22px"><b>' + L(APP.dev, APP.devEn) + '</b> — <b class="num" style="font-size:18px">' + APP.phone + '</b></div></div>' });
  };
})();

/* ================= product images ================= */
var ProdImg = {
  pick: function (cb) {
    var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
    i.onchange = function () { var f = i.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { var im = new Image(); im.onload = function () { var S2 = 220, c = document.createElement('canvas'), k = Math.max(im.width, im.height), sc = S2 / Math.min(im.width, im.height); c.width = c.height = S2; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, S2, S2); g.drawImage(im, (S2 - im.width * sc) / 2, (S2 - im.height * sc) / 2, im.width * sc, im.height * sc); cb(c.toDataURL('image/jpeg', 0.82)); }; im.src = r.result; }; r.readAsDataURL(f); };
    i.click();
  }
};
(function () {
  var edit = Views.products.edit;
  Views.products.edit = function (p) {
    edit.apply(this, arguments);
    var m = $$('.mask').pop(); if (!m || !$('#fn', m) || !(can('products.edit') || !p)) return;
    var box = document.createElement('div'); box.className = 'pimg-ed';
    var draw = function () { var v = m._img !== undefined ? m._img : (p && p.img) || ''; box.innerHTML = '<div class="pimg-big" style="' + (v ? 'background-image:url(' + v + ')' : '') + '">' + (v ? '' : '📷') + '</div><div class="col" style="gap:6px"><b>' + L('صورة الصنف', 'Product photo') + '</b><div class="muted small">' + L('بتظهر في شاشة البيع وشاشة العميل', 'Shown at the POS and on the customer display') + '</div><div class="row"><button class="btn sm" data-ip>📷 ' + (v ? L('تغيير', 'Change') : L('اختار صورة', 'Choose photo')) + '</button>' + (v ? '<button class="btn sm ghost" data-ix style="color:var(--bad)">✕</button>' : '') + '</div></div>'; $('[data-ip]', box).onclick = function () { ProdImg.pick(function (d) { m._img = d; draw(); }); }; if ($('[data-ix]', box)) $('[data-ix]', box).onclick = function () { m._img = ''; draw(); }; };
    var mb = $('.mb', m); mb.insertBefore(box, mb.firstChild); draw();
  };
})();
if (IS_ELECTRON) IPC.on('cd-ready', function () { try { if (App.view === 'pos') CD.cart(); else CD.send({ mode: 'idle' }); } catch (e) { } });

/* ================= after an update: safety backup + what's new ================= */
var Updater = {
  notes: { '1.6.0': ['🧾 محرر الفاتورة وعرض السعر بقى مباشر: أي تغيير يظهر في الورقة في نفس اللحظة', '👆 دوس على أي كلمة في الفاتورة تغيّرها أو تمسحها أو تخفيها — وأي جملة تحت تعدّلها أو تمسحها', '👁️ تقدر تخفي/تظهر كل حاجة: اللوجو، بيانات المحل، رقم الفاتورة، التاريخ، العميل، الموبايل، العنوان، البائع، أعمدة الجدول، سطور الإجمالي والخصم والدفع، المبلغ بالحروف، التوقيعات', '✍️ أسماء أعمدة الجدول وسطور الإجمالي بقت تتكتب زي ما تحب + جملة فوق الأصناف وجملة في آخر الورقة', '💰 قاعدة من المطوّر: سعر القطاعي لازم يساوي التكلفة أو أعلى — لو أقل البرنامج يرفض الحفظ ويقول السبب (إضافة صنف، إضافة سريعة، استلام بضاعة، تعديل جماعي، استيراد Excel)'], '1.0.0': ['🏠 أول إصدار من غاندي للأدوات المنزلية وتجهيز العرائس والسجاد والستائر'], '1.1.0': ['📜 طباعة كمبيالات لكل قسط وإيصال أمانة بالمبلغ المتبقي', '🔢 رقم السيريال للأجهزة وقت البيع — في الفاتورة وشهادة الضمان والبحث', '🧾 كشف تحصيل للمحصّل الميداني بالمتأخرين وعناوينهم', '💼 عمولات البائعين — اختيار البائع في الكاشير وكشف عمولات', '📦 باكدجات العرائس الجاهزة بسعر واحد', '🏭 أقساط الموردين بمواعيد وتنبيه قبلها'], '1.2.0': ['🎨 30 تصميم جديد كامل للبرنامج — مكان القائمة، شكل الكروت، الزوايا، الخطوط، الخلفيات والألوان', '🖼️ معاينة لكل تصميم قبل ما تختاره من الإعدادات', '🔒 تغيير التصميم بقى من صلاحية المدير بس'], '1.3.0': ['🏭 صفحة كاملة لكل مورد: الفواتير، الحركات، التسديدات، الأصناف اللي أخدتها منه، والملاحظات بالتواريخ', '📜 كشف حساب مورد A4 بالرصيد بعد كل حركة — ليه كام أو ليك كام', '🖨️ طباعة أي فاتورة شراء أو إيصال سداد A4', '💸 سداد للمورد بالطريقة ورقم الشيك والملاحظة، ولو من الدرج بيتخصم من الوردية', '✍️ فاتورة أو تسوية يدوية للمورد، وكشف أرصدة كل الموردين'], '1.4.0': ['🧾 6 تصميمات للفاتورة وعرض السعر والمستندات A4 — تختار تصميم لكل نوع من الإعدادات', '✍️ كل كلمة في الفاتورة تتغير (العميل بدل السادة…) والجمل اللي تحت تظهر أو تختفي أو تتمسح أو تضيف جديد', '✍️ اسم العميل تحت توقيعه واسم المدير المسئول تحت توقيعه', '👁️ معاينة قبل أي طباعة A4 مع تغيير التصميم والمقاس وحجم الكلام', '🧹 أدوات التصفير في لوحة المطوّر: رجوع الإعدادات للافتراضي، مسح البيانات مع اختيار اللي يفضل، وضبط المصنع'], '1.4.1': ['🛠️ تصحيح اسم البرنامج في صفحة النسخ الاحتياطي'], '1.4.2': ['✍️ تقدر تشيل خانة الختم أو توقيع العميل أو توقيع المسئول كل واحدة لوحدها — من الإعدادات أو من شاشة المعاينة'], '1.5.0': ['👤 بيانات العميل الكاملة: الرقم القومي، العنوان بالتفصيل والعلامة المميزة، الشغل، قريب للرجوع ليه، صورة البطاقة', '🏷️ نوع العميل (عادي / VIP / تاجر / عروسة / شركة / موقوف) وحد أقصى للآجل', '🖨️ ملف العميل A4 بكل بياناته وحسابه'] },
  check: function () {
    var k = 'ghandi.ver', prev = ''; try { prev = localStorage.getItem(k) || ''; localStorage.setItem(k, APP.version); } catch (e) { return; }
    if (!prev || prev === APP.version) return;
    Store.log('app.update', prev + ' → ' + APP.version);
    try { Backup.run('update'); } catch (e) { }
    var n = Updater.notes[APP.version];
    Modal.open({ title: '🎉 ' + L('تم تحديث البرنامج', 'Ghandi was updated'), body: '<div class="col" style="gap:10px"><div class="card kpi hero"><div class="l">' + L('الإصدار', 'Version') + '</div><div class="v num" dir="ltr" style="text-align:end">' + prev + ' → ' + APP.version + '</div><div class="small">' + L('كل بياناتك زي ما هي ✓ واتعملت نسخة احتياطية قبل التحديث', 'All your data is intact ✓ — a backup was taken first') + '</div></div>' + (n ? '<b>' + L('الجديد في الإصدار ده:', 'What is new:') + '</b>' + n.map(function (x) { return '<div class="list-row">' + x + '</div>'; }).join('') : '') + '</div>' });
  }
};
(function () { var st = Shell.start; Shell.start = function () { st.apply(this, arguments); if (App.user && App.user.role === 'admin') Updater.check(); }; })();
