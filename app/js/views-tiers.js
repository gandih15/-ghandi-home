/* Ghandi Home — selling by price tier (retail / half-wholesale / wholesale / special):
   which tiers each cashier may use, how prices appear, tier on every invoice & item, sales-by-tier report. */
'use strict';

function tierCfg() { var s = S(); if (!s.tierCfg) s.tierCfg = { tiles: 'tier', showDisc: false, print: true }; return s.tierCfg; }
function allTiers() { return S().tiers.map(function (t, i) { return i; }); }
function userTiers(u) {
  u = u || App.user; if (!u || u.role === 'admin') return allTiers();
  var t = Array.isArray(u.tiers) ? u.tiers : (u.perms && u.perms['pos.changeTier'] ? allTiers() : [+S().defaultTier || 0]);
  t = t.filter(function (i) { return i < S().tiers.length; }); return t.length ? t : [0];
}
function userDefTier(u) { u = u || App.user; var a = userTiers(u), d = u && u.defTier != null ? +u.defTier : +S().defaultTier || 0; return a.indexOf(d) >= 0 ? d : a[0]; }
function tierAllowed(i) { return userTiers().indexOf(+i) >= 0; }
function tierVisible(i) { return !App.user || App.user.role === 'admin' || can('prices.viewAll') || tierAllowed(i); }
var TIER_EMO = ['🛍️', '📦', '🚚', '⭐'];
function tierChip(i) { i = +i || 0; return '<span class="chip tierc t' + i + '">' + TIER_EMO[i] + ' ' + tierName(i) + '</span>'; }

/* ---------- POS ---------- */
(function () {
  var nc = newCart;
  newCart = function () { var c = nc(); c.tier = userDefTier(); return c; };
  var P = Views.pos;
  // price used in the cart: optionally shows the tier price as a discount off retail
  P.price = function (p, t) {
    var pr = Promo.price(p, t); t = +t || 0;
    if (t > 0 && tierCfg().showDisc) { var r = priceOf(p, 0); if (r > pr.price) return { price: pr.price, base: r, promo: pr.promo || { name: tierName(t) }, pct: Math.round((r - pr.price) / r * 100) }; }
    return pr;
  };
  P.tileTier = function () { var c = App.cart; return tierCfg().tiles === 'retail' && tierVisible(0) ? 0 : c.tier; };
  var setTier = P.setTier;
  P.setTier = function (t) { t = +t || 0; if (!tierAllowed(t)) { toast(L('مش مسموحلك تبيع بسعر ', 'You may not sell at ') + tierName(t), 'bad'); return; } setTier.call(P, t); P.pill(); };
  P.pill = function () {
    var b = $('#tier'); if (!b) return; var t = App.cart.tier, n = userTiers().length;
    b.className = 'pill-tier tp t' + t; b.innerHTML = TIER_EMO[t] + ' ' + tierName(t) + (n > 1 ? ' ▾' : ' 🔒');
    b.title = n > 1 ? L('غيّر نوع السعر (F9)', 'Change price type (F9)') : L('مسموحلك بالسعر ده بس', 'This is the only price type you may use');
  };
  P.tierMenu = function () {
    var a = userTiers();
    if (a.length < 2) return toast(L('مسموحلك تبيع ', 'You can only sell ') + tierName(a[0]) + L(' بس', ''), 'bad');
    var m = Modal.open({ title: '💰 ' + L('البيع بسعر إيه؟', 'Sell at which price?'), body: '<div class="grid g2">' + a.map(function (i) { return '<button class="btn lg tierbtn t' + i + (i === App.cart.tier ? ' on' : '') + '" data-t="' + i + '"><span style="font-size:26px">' + TIER_EMO[i] + '</span><b>' + tierName(i) + '</b></button>'; }).join('') + '</div><div class="muted small" style="margin-top:10px">' + L('كل أصناف الفاتورة هتتحسب بالسعر اللي تختاره', 'Every item on the invoice is re-priced') + '</div>' });
    $$('[data-t]', m).forEach(function (b) { b.onclick = function () { Modal.close(m); P.setTier(+b.dataset.t); }; });
  };
  var render = P.render;
  P.render = function (el) {
    render.apply(this, arguments);
    if (!$('#tier')) return;
    if (!tierAllowed(App.cart.tier)) { var d = userDefTier(); App.cart.tier = d; setTier.call(P, d); }
    $('#tier').onclick = P.tierMenu; P.pill();
  };
  // checkout: pick the price type right there too
  var pay = P.pay;
  P.pay = function () {
    pay.apply(this, arguments);
    var a = userTiers(), m = $$('.mask').pop(); if (!m || !$('#done', m) || a.length < 2) return;
    var bar = document.createElement('div'); bar.className = 'tierbar';
    bar.innerHTML = '<span class="muted small">💰 ' + L('البيع بسعر:', 'Selling at:') + '</span><div class="seg">' + a.map(function (i) { return '<button data-pt="' + i + '" class="' + (i === App.cart.tier ? 'on' : '') + '">' + TIER_EMO[i] + ' ' + tierName(i) + '</button>'; }).join('') + '</div>';
    var mb = $('.mb', m); mb.insertBefore(bar, mb.firstChild);
    $$('[data-pt]', bar).forEach(function (b) { b.onclick = function () { var t = +b.dataset.pt; if (t === App.cart.tier) return; Modal.close(m); P.setTier(t); P.pay(); }; });
  };
})();

/* ---------- invoices ---------- */
(function () {
  var cr = Sales.create;
  Sales.create = function (o) {
    if (o.type === 'sale' && !o.layaway) o.tier = +o.tier || 0;
    var s = cr.apply(this, arguments);
    s.tier = +s.tier || 0; s.tierName = tierName(s.tier); s.items.forEach(function (i) { i.tier = s.tier; });
    Store.save(); return s;
  };
  var rh = Receipt.html;
  Receipt.html = function (s) { var cfg = S().invoice, keep = cfg.showTier; cfg.showTier = tierCfg().print !== false; try { return rh.apply(this, arguments); } finally { cfg.showTier = keep; } };
  var tb = Views.sales.table;
  Views.sales.table = function () {
    tb.apply(this, arguments);
    $$('#stb tr[data-id]').forEach(function (r) { var s = Store.db.sales.filter(function (x) { return x.id === r.dataset.id; })[0]; if (s && r.cells[2]) r.cells[2].insertAdjacentHTML('beforeend', ' ' + tierChip(s.tier)); });
  };
  // invoice search: filter by price type
  var srender = Views.sales.render;
  Views.sales.render = function (el) {
    var f = Views.sales.st.f; if (f.tier == null) f.tier = '';
    srender.apply(this, arguments);
    var row = $('.sfilt .row', el); if (!row) return;
    var lab = document.createElement('label'); lab.className = 'f'; lab.innerHTML = '💰 ' + L('نوع السعر', 'Price type') + '<select class="in" id="sfT"><option value="">' + L('الكل', 'All') + '</option>' + allTiers().map(function (i) { return '<option value="' + i + '"' + (String(f.tier) === String(i) ? ' selected' : '') + '>' + tierName(i) + '</option>'; }).join('') + '</select>';
    row.insertBefore(lab, $('#sfClr')); $('#sfT').onchange = function () { f.tier = this.value; Views.sales.table(); };
  };
  var tb2 = Views.sales.table;
  Views.sales.table = function () {
    var f = Views.sales.st.f, all = Store.db.sales;
    if (f && f.tier !== '' && f.tier != null) { Store.db.sales = all.filter(function (s) { return (+s.tier || 0) === +f.tier; }); try { tb2.apply(this, arguments); } finally { Store.db.sales = all; } }
    else tb2.apply(this, arguments);
  };
})();

/* ---------- sales-by-price-type report ---------- */
var TierRep = {
  q: '',
  calc: function (a, b) {
    var per = {}, tot = allTiers().map(function () { return { n: 0, q: 0, v: 0, pr: 0 }; });
    Store.db.sales.forEach(function (s) {
      if (s.void || s.date < a || s.date >= b) return; var sg = s.type === 'return' ? -1 : 1, ratio = s.subtotal ? (s.total - (s.vat || 0)) / s.subtotal : 1;
      if (s.type === 'sale') tot[+s.tier || 0] && tot[+s.tier || 0].n++;
      s.items.forEach(function (i) {
        if (i.gift || !i.pid) return; var t = i.tier != null ? +i.tier : +s.tier || 0, k = i.pid;
        var r = per[k] = per[k] || { pid: k, name: i.name, by: {}, q: 0, v: 0 };
        var x = r.by[t] = r.by[t] || { q: 0, v: 0 }, v = sg * i.qty * i.price * ratio;
        x.q += sg * i.qty; x.v += v; r.q += sg * i.qty; r.v += v;
        if (tot[t]) { tot[t].q += sg * i.qty; tot[t].v += v; tot[t].pr += v - sg * i.qty * U.n(i.cost); }
      });
    });
    return { rows: Object.keys(per).map(function (k) { return per[k]; }).sort(function (x, y) { return y.v - x.v; }), tot: tot };
  },
  render: function (el) {
    var st = Views.reports.st, rg = rangeMs(st), R = TierRep.calc(rg[0], rg[1]), ts = allTiers().filter(tierVisible), prof = can('reports.profit');
    var q = U.norm(TierRep.q), rows = R.rows.filter(function (r) { if (!q) return true; var p = Store.product(r.pid); return U.norm(r.name + ' ' + (p ? p.barcodes.join(' ') : '')).indexOf(q) >= 0; });
    el.innerHTML = '<div class="row wrap" style="margin-bottom:12px">' + dateRangeBar('rtt', st) + '<div class="grow"></div><input class="in" id="trq" style="width:230px" placeholder="' + L('ابحث بالصنف أو الباركود', 'Search product or barcode') + '" value="' + U.esc(TierRep.q) + '">' + (can('export') ? '<button class="btn" id="trX">' + ic('down') + 'Excel</button>' : '') + '</div>' +
      '<div class="grid g4" style="margin-bottom:12px">' + ts.map(function (i) { var t = R.tot[i]; return '<div class="card kpi tierk t' + i + '"><div class="l">' + TIER_EMO[i] + ' ' + tierName(i) + '</div><div class="v">' + M(t.v) + '</div><div class="muted small">' + t.n + L(' فاتورة · ', ' invoices · ') + t.q + L(' قطعة', ' pcs') + (prof ? ' · ' + L('ربح ', 'profit ') + U.money(t.pr) : '') + '</div></div>'; }).join('') + '</div>' +
      '<div class="tbl-wrap"><table class="t"><tr><th>' + L('الصنف', 'Product') + '</th>' + ts.map(function (i) { return '<th>' + TIER_EMO[i] + ' ' + tierName(i) + '</th>'; }).join('') + '<th>' + L('الإجمالي', 'Total') + '</th></tr>' +
      (rows.length ? rows.map(function (r) { var p = Store.product(r.pid); return '<tr><td><b>' + U.esc(p ? pname(p) : r.name) + '</b>' + (p && p.shade ? ' <span class="muted small">' + U.esc(p.shade) + '</span>' : '') + '</td>' + ts.map(function (i) { var x = r.by[i]; return '<td class="num">' + (x && x.q ? '<b>' + x.q + '</b> <span class="muted small">' + L('قطعة', 'pcs') + ' · ' + U.money(x.v) + '</span>' : '<span class="muted">—</span>') + '</td>'; }).join('') + '<td class="num"><b>' + r.q + '</b> · ' + U.money(r.v) + '</td></tr>'; }).join('') : '<tr><td colspan="' + (ts.length + 2) + '"><div class="empty"><span class="em">💰</span>' + L('مفيش مبيعات في الفترة دي', 'No sales in this period') + '</div></td></tr>') + '</table></div>';
    bindRange('rtt', st, function () { TierRep.render(el); });
    var t0; $('#trq').oninput = function () { var v = this.value; clearTimeout(t0); t0 = setTimeout(function () { TierRep.q = v; TierRep.render(el); var i = $('#trq'); i.focus(); i.setSelectionRange(v.length, v.length); }, 250); };
    if ($('#trX')) $('#trX').onclick = function () { var h = [L('الصنف', 'Product')]; ts.forEach(function (i) { h.push(tierName(i) + ' ' + L('كمية', 'qty'), tierName(i) + ' ' + L('قيمة', 'value')); }); h.push(L('إجمالي الكمية', 'Total qty'), L('إجمالي القيمة', 'Total value')); saveBlob(XL.writeXlsx([h].concat(rows.map(function (r) { var o = [r.name]; ts.forEach(function (i) { var x = r.by[i] || { q: 0, v: 0 }; o.push(x.q, U.r2(x.v)); }); o.push(r.q, U.r2(r.v)); return o; })), 'ByPrice', lang() !== 'en'), 'sales_by_price_type_' + U.today() + '.xlsx'); };
  },
  forProduct: function (pid) {
    var all = TierRep.calc(0, Date.now() + 1), m0 = new Date(); m0.setDate(1); var mon = TierRep.calc(dayStart(m0), Date.now() + 1);
    var a = all.rows.filter(function (r) { return r.pid === pid; })[0], b = mon.rows.filter(function (r) { return r.pid === pid; })[0];
    return { all: a, month: b };
  }
};
(function () {
  var R = Views.reports, rr = R.render;
  R.render = function (el) {
    rr.apply(this, arguments);
    var seg = $('#rT', el); if (!seg) return;
    var b = document.createElement('button'); b.dataset.t = 'tier'; b.textContent = '💰 ' + L('حسب نوع السعر', 'By price type'); if (R.tab === 'tier') { $$('button', seg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }
    seg.appendChild(b); b.onclick = function () { R.tab = 'tier'; R.render(el); };
    if (R.tab === 'tier') TierRep.render($('#rBody'));
  };
})();

/* ---------- products: hide the price columns a cashier may not see + sold-by-type box ---------- */
(function () {
  var P = Views.products, edit = P.edit;
  P.edit = function (p) {
    edit.apply(this, arguments);
    var m = $$('.mask').pop(); if (!m || !$('#fn', m)) return;
    $$('[data-pr]', m).forEach(function (i) { if (!tierVisible(+i.dataset.pr)) i.parentNode.style.display = 'none'; });
    if (!p || !p.id || !can('reports')) return;
    var r = TierRep.forProduct(p.id), ts = allTiers().filter(tierVisible);
    var box = document.createElement('div'); box.className = 'card tsold';
    var line = function (x) { return ts.map(function (i) { var y = x && x.by[i]; return '<div class="tsold-c t' + i + '"><span>' + TIER_EMO[i] + ' ' + tierName(i) + '</span><b class="num">' + (y ? y.q : 0) + '</b></div>'; }).join(''); };
    box.innerHTML = '<h3>💰 ' + L('اتباع منه كام وبأنهي سعر', 'Units sold by price type') + '</h3><div class="muted small">' + L('الشهر ده', 'This month') + '</div><div class="tsold-r">' + line(r.month) + '</div><div class="muted small" style="margin-top:8px">' + L('من أول ما اتسجّل', 'All time') + '</div><div class="tsold-r">' + line(r.all) + '</div>';
    var col = $$('.mb .col', m).pop(); if (col) col.appendChild(box);
  };
})();

/* ---------- user editor: what this cashier may sell at, see and change ---------- */
(function () {
  var U2 = Views.users, edit = U2.edit;
  U2.edit = function (u, el) {
    edit.apply(this, arguments);
    var m = $$('.mask').pop(); if (!m || !$('#us', m)) return;
    var d = { tiers: userTiers(u || { role: 'cashier', perms: ROLE_PRESETS.cashier() }), def: u ? userDefTier(u) : 0 };
    var box = document.createElement('div'); box.className = 'card tier-access';
    var draw = function () {
      var adm = $('#ur', m).value === 'admin';
      if (adm) { box.innerHTML = ''; box.style.display = 'none'; return; } box.style.display = '';
      box.innerHTML = '<h3>💰 ' + L('يبيع بأنهي سعر؟', 'Which prices may this user sell at?') + '</h3><div class="row wrap" style="gap:8px">' + allTiers().map(function (i) { var on = d.tiers.indexOf(i) >= 0; return '<label class="tierbtn sm t' + i + (on ? ' on' : '') + '"><input type="checkbox" data-ut="' + i + '" ' + (on ? 'checked' : '') + '> ' + TIER_EMO[i] + ' ' + tierName(i) + '</label>'; }).join('') + '</div>' +
        '<label class="f" style="margin-top:8px">' + L('السعر اللي الفاتورة بتبدأ بيه', 'Invoice starts at') + '<select class="in" id="utd">' + d.tiers.map(function (i) { return '<option value="' + i + '"' + (i === d.def ? ' selected' : '') + '>' + tierName(i) + '</option>'; }).join('') + '</select></label>' +
        '<div class="muted small">' + (d.tiers.length > 1 ? L('يقدر يغيّر بين الأسعار دي بس من زرار السعر في الفاتورة أو وقت الدفع.', 'Can switch only between these, from the price button or at checkout.') : L('هيبيع بالسعر ده بس، ومش هيقدر يغيّره.', 'Sells at this price only and cannot change it.')) + '</div>';
      $$('[data-ut]', box).forEach(function (c) { c.onchange = function () { var i = +c.dataset.ut; if (c.checked) { if (d.tiers.indexOf(i) < 0) d.tiers.push(i); } else d.tiers = d.tiers.filter(function (x) { return x !== i; }); if (!d.tiers.length) d.tiers = [i]; d.tiers.sort(); if (d.tiers.indexOf(d.def) < 0) d.def = d.tiers[0]; draw(); }; });
      $('#utd', box).onchange = function () { d.def = +this.value; };
    };
    var pl = $('#pl', m); pl.parentNode.insertBefore(box, pl);
    $('#ur', m).addEventListener('change', draw); draw();
    m._tiers = d;
  };
})();

/* ---------- settings card: how prices behave at the POS ---------- */
(function () {
  var orig = Views.settings;
  Views.settings = function (el) {
    orig.apply(this, arguments); var g = $('.grid', el); if (!g) return; var c = tierCfg();
    var card = document.createElement('div'); card.className = 'card col'; card.style.gridColumn = '1 / -1';
    card.innerHTML = '<h3>💰 ' + L('البيع بأنواع الأسعار (قطاعي / نص جملة / جملة)', 'Selling by price type (retail / half-wholesale / wholesale)') + '</h3><div class="grid g3" style="align-items:start">' +
      '<div class="col"><b>' + L('الأصناف في شاشة البيع تبان بسعر:', 'Product tiles show:') + '</b><div class="seg" id="tcT"><button data-v="tier" class="' + (c.tiles !== 'retail' ? 'on' : '') + '">' + L('نوع السعر المختار', 'Selected price type') + '</button><button data-v="retail" class="' + (c.tiles === 'retail' ? 'on' : '') + '">' + L('القطاعي دايماً', 'Always retail') + '</button></div><div class="muted small">' + L('«نوع السعر المختار»: لما الكاشير يختار جملة كل الأصناف تتحول لسعر الجملة. «القطاعي دايماً»: الأصناف تفضل بالقطاعي، والفاتورة بس هي اللي بتتحسب بالسعر المختار.', 'Selected: tiles switch with the chosen price. Always retail: tiles stay retail; only the invoice is re-priced.') + '</div></div>' +
      '<div class="col"><b>' + L('سعر الجملة / نص الجملة يظهر للعميل:', 'Lower tier prices appear as:') + '</b><div class="seg" id="tcD"><button data-v="0" class="' + (!c.showDisc ? 'on' : '') + '">' + L('سعر عادي', 'Normal price') + '</button><button data-v="1" class="' + (c.showDisc ? 'on' : '') + '">' + L('خصم من القطاعي', 'Discount off retail') + '</button></div><div class="muted small" id="tcEx"></div></div>' +
      '<div class="col"><label class="row"><input type="checkbox" class="sw" id="tcP" ' + (c.print !== false ? 'checked' : '') + '> <b>' + L('اطبع نوع السعر على الفاتورة', 'Print the price type on the receipt') + '</b></label><div class="muted small">' + L('نوع السعر بيتسجّل دايماً على كل فاتورة وكل صنف اتباع جوه السيستم، حتى لو مش مطبوع.', 'It is always recorded on every invoice and sold item, printed or not.') + '</div><div class="muted small">👥 ' + L('مين يبيع بأنهي سعر، ومين يشوف التكلفة أو يعدّل السعر أو يبيع آجل: من «المستخدمين والصلاحيات».', 'Who sells at which price, sees cost, edits price or sells on credit: Users & permissions.') + '</div></div></div>';
    g.appendChild(card);
    var ex = function () { var p = Store.db.products.filter(function (x) { return priceOf(x, 2) < priceOf(x, 0); })[0]; $('#tcEx').innerHTML = p ? '🧾 ' + U.esc(p.name) + ': ' + (tierCfg().showDisc ? '<s>' + U.money(priceOf(p, 0)) + '</s> ' + U.money(priceOf(p, 2)) + ' (' + L('وفّرت ', 'saved ') + U.money(priceOf(p, 0) - priceOf(p, 2)) + ')' : U.money(priceOf(p, 2))) + ' — ' + tierName(2) : ''; };
    $$('#tcT button').forEach(function (b) { b.onclick = function () { tierCfg().tiles = b.dataset.v; $$('#tcT button').forEach(function (x) { x.classList.toggle('on', x === b); }); Store.save(); }; });
    $$('#tcD button').forEach(function (b) { b.onclick = function () { tierCfg().showDisc = b.dataset.v === '1'; $$('#tcD button').forEach(function (x) { x.classList.toggle('on', x === b); }); Store.save(); ex(); }; });
    $('#tcP').onchange = function () { tierCfg().print = this.checked; Store.save(); };
    ex();
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.6.1'] = ['💰 تحدد لكل كاشير يبيع بأنهي سعر (قطاعي / نص جملة / جملة / خاص) والسعر اللي يبدأ بيه', '🔁 الكاشير يختار نوع السعر من الفاتورة أو وقت الدفع وكل الأصناف تتحسب بيه', '🏷️ تختار: الأصناف تبان بالسعر المختار ولا بالقطاعي — وسعر الجملة يظهر عادي ولا خصم من القطاعي', '🧾 نوع السعر متسجّل على كل فاتورة وكل صنف، وفلتر بيه في الفواتير', '📊 تقرير «حسب نوع السعر»: كل صنف اتباع منه كام قطاعي وكام جملة', '🔒 الكاشير مش بيشوف أسعار الشرائح اللي مش مسموحله بيها ولا التكلفة'];
