/* Ghandi Home — offers & discounts (العروض), bulk price editing (تعديل الأسعار), goods receiving (استلام الأصناف) */
'use strict';

/* ================= PROMO ENGINE ================= */
var Promo = {
  _c: null, _t: 0,
  active: function () {
    if (Promo._c && Date.now() - Promo._t < 2000) return Promo._c;
    var now = U.today();
    Promo._c = (Store.db.promos || []).filter(function (x) { return x.active !== false && (!x.from || x.from <= now) && (!x.to || x.to >= now); });
    Promo._t = Date.now(); return Promo._c;
  },
  reset: function () { Promo._c = null; },
  tiersOf: function (x) { if (Array.isArray(x.tiers)) return x.tiers; return x.tiers === 'all' ? [0, 1, 2, 3] : [0]; },
  status: function (x) { var now = U.today(); if (x.active === false) return 'off'; if (x.from && x.from > now) return 'soon'; if (x.to && x.to < now) return 'ended'; return 'on'; },
  matches: function (x, p) {
    if (x.scope === 'all') return true;
    if (x.scope === 'cat') return (x.cats || []).indexOf(p.cat) >= 0;
    if (x.scope === 'brand') return (x.brands || []).indexOf(p.brand) >= 0;
    return (x.pids || []).indexOf(p.id) >= 0;
  },
  apply: function (x, base) {
    var v = x.type === 'pct' ? base * (1 - U.n(x.val) / 100) : x.type === 'amt' ? base - U.n(x.val) : Math.min(base, U.n(x.val));
    if (+x.round) v = Math.round(v / +x.round) * +x.round;
    return U.r2(Math.max(0, Math.min(base, v)));
  },
  price: function (p, tier) {
    tier = +tier || 0; var base = priceOf(p, tier), best = null, bp = base;
    Promo.active().forEach(function (x) {
      if (Promo.tiersOf(x).indexOf(tier) < 0) return;
      if (!Promo.matches(x, p)) return;
      var v = Promo.apply(x, base); if (v < bp) { bp = v; best = x; }
    });
    return { price: bp, base: base, promo: best, pct: base ? Math.round((base - bp) / base * 100) : 0 };
  }
};

/* ---------- shared filter helpers ---------- */
function brandsList() { var o = {}; Store.db.products.forEach(function (p) { if (p.brand) o[p.brand] = 1; }); return Object.keys(o).sort(); }
function chipPick(name, items, selected) {
  return '<div class="row wrap" style="gap:6px" data-pick="' + name + '">' + (items.length ? items.map(function (c) { return '<button type="button" class="pickc ' + (selected.indexOf(c) >= 0 ? 'on' : '') + '" data-v="' + U.esc(c) + '">' + U.esc(c) + '</button>'; }).join('') : '<span class="muted small">—</span>') + '</div>';
}
function bindChips(root, name, arr, cb) {
  $$('[data-pick="' + name + '"] .pickc', root).forEach(function (b) {
    b.onclick = function () { var v = b.dataset.v, i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); b.classList.toggle('on', i < 0); if (cb) cb(); };
  });
}
function scopeProducts(sc) {
  return Store.db.products.filter(function (p) {
    if (sc.scope === 'cat') return (sc.cats || []).indexOf(p.cat) >= 0 || (!!p.sub && (sc.cats || []).indexOf(p.cat + ' › ' + p.sub) >= 0);
    if (sc.scope === 'brand') return (sc.brands || []).indexOf(p.brand) >= 0;
    if (sc.scope === 'items') return (sc.pids || []).indexOf(p.id) >= 0;
    return true;
  });
}

/* ================= OFFERS & DISCOUNTS ================= */
Views.promos = {
  render: function (el) {
    var V = Views.promos, list = Store.db.promos || [];
    var badge = { on: ['ok', 'شغّال الآن', 'Live now'], soon: ['warn', 'مجدول', 'Scheduled'], ended: ['bad', 'انتهى', 'Ended'], off: ['', 'متوقف', 'Paused'] };
    el.innerHTML = '<div class="row" style="margin-bottom:16px"><div class="grow"><b style="font-size:16px">' + L('العروض والخصومات', 'Offers & discounts') + '</b><div class="muted small">' + L('الخصم بيظهر في البيع والفاتورة والملصق: السعر القديم متشطب والجديد جنبه', 'Shown at POS, on receipts and labels: old price struck through, new price beside it') + '</div></div><button class="btn pri" id="prnew">' + ic('plus') + L('عرض جديد', 'New offer') + '</button></div>' +
      (list.length ? '<div class="grid g3">' + list.slice().reverse().map(function (x) {
        var st = Promo.status(x), b = badge[st], n = scopeProducts(x).length;
        var val = x.type === 'pct' ? U.n(x.val) + '%' : x.type === 'amt' ? U.money(x.val) + ' ' + cur() : L('سعر ', 'Price ') + U.money(x.val);
        var scope = x.scope === 'all' ? L('كل الأصناف', 'All products') : x.scope === 'cat' ? (x.cats || []).join('، ') : x.scope === 'brand' ? (x.brands || []).join('، ') : (x.pids || []).length + L(' صنف محدد', ' selected items');
        return '<div class="card promo-card"><div class="promo-val">' + (x.type === 'price' ? '' : '−') + val + '</div><div class="row" style="align-items:flex-start"><div class="grow"><b style="font-size:15px">' + U.esc(x.name) + '</b><div class="muted small" style="margin-top:3px">' + U.esc(scope) + '</div></div><span class="chip ' + b[0] + '"><span class="dot"></span>' + L(b[1], b[2]) + '</span></div>' +
          '<div class="row wrap small muted" style="margin-top:10px;gap:14px"><span>' + ic('box', 14) + ' ' + n + L(' صنف', ' items') + '</span><span>' + ic('clock', 14) + ' <span class="num">' + (x.from || '…') + ' → ' + (x.to || '∞') + '</span></span><span>' + ic('tag', 14) + ' ' + Promo.tiersOf(x).map(tierName).join(' · ') + '</span></div>' +
          '<div class="row" style="margin-top:12px;gap:6px"><label class="row small grow"><input type="checkbox" class="sw" data-tg="' + x.id + '" ' + (x.active !== false ? 'checked' : '') + '> ' + L('مفعّل', 'Enabled') + '</label><button class="btn sm" data-lb="' + x.id + '">' + ic('barcode', 15) + L('ملصقات', 'Labels') + '</button><button class="btn sm" data-ed="' + x.id + '">' + ic('edit', 15) + '</button><button class="btn sm ghost" data-dl="' + x.id + '" style="color:var(--bad)">' + ic('trash', 15) + '</button></div></div>';
      }).join('') + '</div>' : '<div class="card empty">' + ic('gift', 46) + '<div style="margin:12px 0">' + L('مفيش عروض لسه — اعمل خصم على بند كامل (مثلاً الأجهزة الكهربائية 10%) أو على أصناف معينة', 'No offers yet — discount a whole category (e.g. appliances 10%) or specific items') + '</div><button class="btn pri" id="prnew2">' + ic('plus') + L('أول عرض', 'Create first offer') + '</button></div>');
    var find = function (id) { return list.filter(function (x) { return x.id === id; })[0]; };
    $$('#prnew,#prnew2').forEach(function (b) { b.onclick = function () { V.edit(null, el); }; });
    $$('[data-ed]').forEach(function (b) { b.onclick = function () { V.edit(find(b.dataset.ed), el); }; });
    $$('[data-tg]').forEach(function (i) { i.onchange = function () { find(i.dataset.tg).active = i.checked; Promo.reset(); Store.log('promo.toggle', find(i.dataset.tg).name + ' ' + i.checked); Store.save(); V.render(el); }; });
    $$('[data-dl]').forEach(function (b) { b.onclick = function () { var x = find(b.dataset.dl); Modal.confirm(L('حذف العرض ', 'Delete offer ') + '<b>' + U.esc(x.name) + '</b>؟', function () { list.splice(list.indexOf(x), 1); Promo.reset(); Store.log('promo.delete', x.name); Store.save(); V.render(el); }); }; });
    $$('[data-lb]').forEach(function (b) { b.onclick = function () { var x = find(b.dataset.lb); Views.labels.queue = scopeProducts(x).filter(function (p) { return p.active !== false; }).map(function (p) { return { pid: p.id, qty: Math.max(1, U.n(p.stock)), code: p.barcodes[0] }; }); S().label.showPromo = true; Store.save(); go('labels'); }; });
  },
  edit: function (x, el) {
    var V = Views.promos, isNew = !x;
    var d = x ? U.clone(x) : { name: '', scope: 'cat', cats: [], brands: [], pids: [], type: 'pct', val: 10, from: U.today(), to: '', tiers: [0], round: 0, active: true };
    if (!x && Views.promos.seed) { Object.keys(Views.promos.seed).forEach(function (k) { d[k] = Views.promos.seed[k]; }); Views.promos.seed = null; }
    d.tiers = Promo.tiersOf(d).slice();
    var m = Modal.open({
      size: 'xl', title: isNew ? L('عرض / خصم جديد', 'New offer') : L('تعديل العرض', 'Edit offer'),
      body: '<div class="grid" style="grid-template-columns:1.15fr 1fr;gap:22px"><div class="col" style="gap:14px">' +
        '<label class="f">' + L('اسم العرض (بيظهر على الفاتورة)', 'Offer name (shown on receipt)') + '<input class="in" id="pn" autofocus value="' + U.esc(d.name) + '" placeholder="' + L('مثال: عرض تجهيز العرائس 15%', 'e.g. Bridal offer 15% off') + '"></label>' +
        '<div class="f"><span>' + L('الخصم على', 'Applies to') + '</span><div class="seg" id="psc">' + [['all', 'كل الأصناف', 'All products'], ['cat', 'بند / قسم', 'Category'], ['brand', 'ماركة', 'Brand'], ['items', 'أصناف محددة', 'Specific items']].map(function (s) { return '<button data-v="' + s[0] + '" class="' + (d.scope === s[0] ? 'on' : '') + '">' + L(s[1], s[2]) + '</button>'; }).join('') + '</div></div>' +
        '<div id="pscope"></div>' +
        '<div class="f"><span>' + L('نوع الخصم', 'Discount type') + '</span><div class="seg" id="pty">' + [['pct', 'نسبة %', 'Percent %'], ['amt', 'مبلغ ثابت', 'Fixed amount'], ['price', 'سعر جديد', 'New price']].map(function (s) { return '<button data-v="' + s[0] + '" class="' + (d.type === s[0] ? 'on' : '') + '">' + L(s[1], s[2]) + '</button>'; }).join('') + '</div></div>' +
        '<div class="grid g2"><label class="f" id="pvl">' + L('القيمة', 'Value') + '<input class="in num" type="number" id="pv" value="' + U.n(d.val) + '" style="font-size:18px"></label><label class="f">' + L('تقريب السعر الجديد لأقرب', 'Round new price to') + '<select class="in" id="pr">' + [0, 1, 5, 10].map(function (r) { return '<option value="' + r + '" ' + (+d.round === r ? 'selected' : '') + '>' + (r || '—') + '</option>'; }).join('') + '</select></label></div>' +
        '<div class="grid g2"><label class="f">' + L('من تاريخ', 'From') + '<input class="in" type="date" id="pf" value="' + (d.from || '') + '"></label><label class="f">' + L('إلى تاريخ (فاضي = مفتوح)', 'To (empty = no end)') + '<input class="in" type="date" id="pt" value="' + (d.to || '') + '"></label></div>' +
        '<div class="f"><span>' + L('العرض على أنهي سعر؟', 'Which price gets the offer?') + '</span><div class="row wrap">' + S().tiers.map(function (t, i) { return '<label class="tierbox"><input type="checkbox" data-ptr="' + i + '" ' + (d.tiers.indexOf(i) >= 0 ? 'checked' : '') + '><span>' + tierName(i) + '</span></label>'; }).join('') + '</div></div></div>' +
        '<div class="col"><div class="card" style="padding:14px"><div class="row" style="margin-bottom:8px"><b class="grow">' + ic('star', 16) + ' ' + L('معاينة الأسعار بعد الخصم', 'Price preview') + '</b><span class="chip" id="pcnt"></span></div><div id="pprev" style="max-height:52vh;overflow:auto"></div></div></div></div>',
      foot: '<button class="btn" data-c>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri" id="psave">' + ic('save') + L('حفظ العرض', 'Save offer') + '</button>'
    });
    var drawScope = function () {
      var h = '';
      if (d.scope === 'cat') h = '<div class="f"><span>' + L('اختار البنود', 'Pick categories') + '</span>' + chipPick('cats', typeof Subs !== 'undefined' ? Subs.chips() : S().categories, d.cats) + '</div>';
      else if (d.scope === 'brand') h = '<div class="f"><span>' + L('اختار الماركات', 'Pick brands') + '</span>' + chipPick('brands', brandsList(), d.brands) + '</div>';
      else if (d.scope === 'items') h = '<div class="f"><span>' + L('الأصناف', 'Items') + '</span><div class="row"><input class="in" id="pitm" placeholder="' + L('امسح باركود أو اضغط اختيار', 'Scan barcode or pick') + '"><button class="btn" id="ppk">' + ic('search') + '</button></div><div class="row wrap" style="gap:6px;margin-top:8px">' + d.pids.map(function (id, i) { var p = Store.product(id); return p ? '<span class="chip" style="background:var(--panel);border:1px solid var(--line2)">' + U.esc(pname(p)) + (p.shade ? ' · ' + U.esc(p.shade) : '') + ' <a data-rm="' + i + '" style="cursor:pointer;color:var(--bad)">✕</a></span>' : ''; }).join('') + '</div></div>';
      $('#pscope', m).innerHTML = h;
      bindChips(m, 'cats', d.cats, prev); bindChips(m, 'brands', d.brands, prev);
      var addP = function (p) { if (p && d.pids.indexOf(p.id) < 0) { d.pids.push(p.id); beep(true); } drawScope(); prev(); };
      if ($('#pitm', m)) { $('#pitm', m).onkeydown = function (e) { if (e.key === 'Enter') { var p = Store.byBarcode(this.value); if (!p) beep(false); addP(p); } }; $('#ppk', m).onclick = function () { pickProduct(addP); }; }
      $$('[data-rm]', m).forEach(function (a) { a.onclick = function () { d.pids.splice(+a.dataset.rm, 1); drawScope(); prev(); }; });
    };
    var prev = function () {
      d.val = U.n($('#pv', m).value); d.round = +$('#pr', m).value;
      var ps = scopeProducts(d), sample = ps.slice(0, 60);
      $('#pcnt', m).textContent = ps.length + L(' صنف', ' items');
      $('#pprev', m).innerHTML = sample.length ? sample.map(function (p) { var tt = ($$('[data-ptr]', m).filter(function (i) { return i.checked; })[0] || { dataset: { ptr: 0 } }).dataset.ptr, b = priceOf(p, +tt), n = Promo.apply(d, b); return '<div class="list-row"><div style="width:28px;height:28px;border-radius:8px;background:' + swatch(p) + '"></div><div class="grow small"><b>' + U.esc(pname(p)) + '</b> <span class="muted">' + U.esc(p.shade || '') + '</span></div><s class="muted num small">' + U.money(b) + '</s><b class="num" style="color:var(--bad);min-width:70px;text-align:end">' + U.money(n) + '</b></div>'; }).join('') + (ps.length > 60 ? '<div class="muted small" style="text-align:center;padding:8px">+' + (ps.length - 60) + '</div>' : '') : '<div class="empty">' + L('اختار البند أو الأصناف', 'Choose a category or items') + '</div>';
      $('#pvl', m).firstChild.textContent = d.type === 'pct' ? L('نسبة الخصم %', 'Discount %') : d.type === 'amt' ? L('مبلغ الخصم', 'Amount off') : L('السعر الجديد', 'New price');
    };
    $$('#psc button', m).forEach(function (b) { b.onclick = function () { d.scope = b.dataset.v; $$('#psc button', m).forEach(function (x) { x.classList.toggle('on', x === b); }); drawScope(); prev(); }; });
    $$('#pty button', m).forEach(function (b) { b.onclick = function () { d.type = b.dataset.v; $$('#pty button', m).forEach(function (x) { x.classList.toggle('on', x === b); }); prev(); }; });
    $('#pv', m).oninput = prev; $('#pr', m).onchange = prev; $$('[data-ptr]', m).forEach(function (i) { i.onchange = prev; });
    $('[data-c]', m).onclick = function () { Modal.close(m); };
    $('#psave', m).onclick = function () {
      d.name = $('#pn', m).value.trim(); d.from = $('#pf', m).value; d.to = $('#pt', m).value; d.tiers = $$('[data-ptr]', m).filter(function (i) { return i.checked; }).map(function (i) { return +i.dataset.ptr; }); prev();
      if (!d.tiers.length) return toast(L('اختار سعر واحد على الأقل', 'Pick at least one price tier'), 'bad');
      if (!d.name) return toast(L('اكتب اسم العرض', 'Name the offer'), 'bad');
      if (!d.val) return toast(L('اكتب قيمة الخصم', 'Enter a value'), 'bad');
      if (d.type === 'pct' && d.val >= 100) return toast(L('النسبة لازم تكون أقل من 100%', 'Percent must be below 100'), 'bad');
      if (!scopeProducts(d).length) return toast(L('مفيش أصناف داخلة في العرض', 'No products match'), 'bad');
      Store.db.promos = Store.db.promos || [];
      if (isNew) { d.id = U.id(); d.by = App.user.name; d.at = Date.now(); Store.db.promos.push(d); } else Object.keys(d).forEach(function (k) { x[k] = d[k]; });
      Promo.reset(); Store.log('promo.save', d.name); Store.save(); Modal.close(m); toast(L('تم حفظ العرض ✓', 'Offer saved ✓'), 'ok'); V.render(el);
    };
    drawScope(); prev();
  }
};

/* ================= BULK PRICE EDITING ================= */
Views.prices = {
  st: { scope: 'cat', cats: [], brands: [], pids: [], tiers: [0], dir: 'up', unit: 'pct', val: 10, round: 5 },
  op: function () { var st = Views.prices.st; if (st.dir === 'set' || st.dir === 'margin') return st.dir; return st.dir === 'up' ? (st.unit === 'pct' ? 'inc' : 'add') : (st.unit === 'pct' ? 'dec' : 'sub'); },
  render: function (el) {
    var V = Views.prices, st = V.st, hist = Store.db.priceHistory || [];
    el.innerHTML = '<div class="grid" style="grid-template-columns:420px 1fr;gap:16px;align-items:start"><div class="card col" style="gap:14px"><h3>' + ic('tag', 18) + L('تعديل الأسعار', 'Change prices') + '</h3>' +
      '<div class="f"><span>' + L('على', 'Apply to') + '</span><div class="seg" id="xsc">' + [['all', 'كل المنتجات', 'All'], ['cat', 'قسم / بند', 'Category / sub'], ['brand', 'ماركة', 'Brand'], ['items', 'أصناف', 'Items']].map(function (s) { return '<button data-v="' + s[0] + '" class="' + (st.scope === s[0] ? 'on' : '') + '">' + L(s[1], s[2]) + '</button>'; }).join('') + '</div></div><div id="xscope"></div>' +
      '<div class="f"><span>' + L('أنهي سعر هيتعدل؟ (اختار واحد أو أكتر)', 'Which price? (one or more)') + '</span><div class="row wrap">' + S().tiers.map(function (t, i) { return '<label class="tierbox"><input type="checkbox" data-tier="' + i + '" ' + (st.tiers.indexOf(i) >= 0 ? 'checked' : '') + '><span>' + tierName(i) + '</span></label>'; }).join('') + (can('products.viewCost') ? '<label class="tierbox"><input type="checkbox" data-tier="cost" ' + (st.tiers.indexOf('cost') >= 0 ? 'checked' : '') + '><span>' + L('التكلفة', 'Cost') + '</span></label>' : '') + '</div></div>' +
      '<div class="f"><span>' + L('عايز تعمل إيه؟', 'What do you want to do?') + '</span><div class="seg" id="xdir">' + [['up', '▲ رفع', '▲ Raise'], ['down', '▼ تخفيض', '▼ Lower'], ['set', '= سعر موحّد', '= Set price']].concat(can('products.viewCost') ? [['margin', 'تكلفة + ربح', 'Cost + margin']] : []).map(function (o) { return '<button data-v="' + o[0] + '" class="' + (st.dir === o[0] ? 'on' : '') + '">' + L(o[1], o[2]) + '</button>'; }).join('') + '</div></div>' +
      '<div class="f" id="xunitw"><span>' + L('بالنسبة ولا بالجنيه؟', 'Percent or amount?') + '</span><div class="seg" id="xunit"><button data-v="pct" class="' + (st.unit === 'pct' ? 'on' : '') + '">' + L('بالمية %', 'Percent %') + '</button><button data-v="amt" class="' + (st.unit === 'amt' ? 'on' : '') + '">' + L('بالجنيه', 'Amount') + ' (' + cur() + ')</button></div></div>' +
      '<div class="tipbox" id="xhint"></div>' +
      '<div class="grid g2"><label class="f" id="xvl">' + L('القيمة', 'Value') + '<input class="in num" type="number" id="xv" value="' + st.val + '" style="font-size:18px"></label><label class="f">' + L('تقريب لأقرب', 'Round to') + '<select class="in" id="xr">' + [0, 0.5, 1, 5, 10].map(function (r) { return '<option value="' + r + '" ' + (+st.round === r ? 'selected' : '') + '>' + (r || L('بدون', 'none')) + '</option>'; }).join('') + '</select></label></div>' +
      '<button class="btn pri lg" id="xgo">' + ic('tag') + L('تطبيق التعديل', 'Apply') + ' <span class="num" id="xn"></span></button>' +
      (can('promos') ? '<button class="btn gold" id="xpromo">' + ic('gift') + L('بدل ما تغيّر السعر — اعمله عرض مؤقت', 'Make it a temporary offer instead') + '</button>' : '') +
      (hist.length ? '<button class="btn" id="xundo">' + ic('ret') + L('تراجع عن آخر تعديل', 'Undo last change') + ' <span class="muted small">(' + U.esc(hist[hist.length - 1].label) + ')</span></button>' : '') + '</div>' +
      '<div class="card"><div class="row" style="margin-bottom:10px"><b class="grow">' + L('معاينة قبل التطبيق', 'Preview before applying') + '</b><input class="in" id="xq" placeholder="🔎 ' + L('دوّر على صنف…', 'Search…') + '" value="' + U.esc(st.xq || '') + '" style="width:200px"><span class="chip" id="xcnt"></span></div><div class="tbl-wrap" style="max-height:66vh" id="xprev"></div></div></div>';
    var drawScope = function () {
      var h = '';
      if (st.scope === 'cat') {
        var allC = typeof Cats !== 'undefined' ? Cats.sort() : S().categories, picked = function (c) { return st.cats.some(function (x) { return x === c || x.indexOf(c + ' › ') === 0; }); };
        h = '<div class="f"><span>' + L('القسم (اختار واحد أو أكتر)', 'Category (one or more)') + '</span><div class="row wrap" style="gap:6px">' + allC.map(function (c) { return '<button type="button" class="pickc' + (picked(c) ? ' on' : '') + '" data-pc="' + U.esc(c) + '">' + (typeof catEmoji === 'function' ? catEmoji(c) + ' ' : '') + U.esc(c) + '</button>'; }).join('') + '</div></div>' +
          allC.filter(picked).map(function (c) { var subs = typeof Subs !== 'undefined' ? Subs.list(c) : []; if (!subs.length) return ''; var whole = st.cats.indexOf(c) >= 0; return '<div class="f"><span>' + L('البنود في «', 'Subs in «') + U.esc(c) + '»</span><div class="row wrap" style="gap:6px"><button type="button" class="pickc' + (whole ? ' on' : '') + '" data-psa="' + U.esc(c) + '">' + L('كل البنود', 'All subs') + '</button>' + subs.map(function (sb) { return '<button type="button" class="pickc' + (st.cats.indexOf(c + ' › ' + sb) >= 0 ? ' on' : '') + '" data-ps="' + U.esc(c + '|' + sb) + '">' + U.esc(sb) + '</button>'; }).join('') + '</div></div>'; }).join('');
      }
      else if (st.scope === 'brand') h = chipPick('brands', brandsList(), st.brands);
      else if (st.scope === 'items') h = '<div class="row"><input class="in" id="xitm" placeholder="' + L('امسح باركود…', 'Scan…') + '"><button class="btn" id="xpk">' + ic('search') + '</button></div><div class="muted small" style="margin-top:6px">' + st.pids.length + L(' صنف محدد', ' selected') + (st.pids.length ? ' · <a id="xclr" style="cursor:pointer;color:var(--bad)">' + L('مسح', 'clear') + '</a>' : '') + '</div>';
      h += '<div class="f"><span>' + L('الأصناف', 'Products') + '</span><div class="seg" id="xav"><button data-v="0" class="' + (st.avail ? '' : 'on') + '">' + L('الكل', 'All') + '</button><button data-v="1" class="' + (st.avail ? 'on' : '') + '">' + L('الموجود حالياً بس (رصيد أكبر من 0)', 'In stock only') + '</button></div></div>';
      $('#xscope').innerHTML = h; bindChips(el, 'cats', st.cats, prev); bindChips(el, 'brands', st.brands, prev);
      var only = function (c) { return st.cats.filter(function (x) { return x !== c && x.indexOf(c + ' › ') !== 0; }); };
      $$('[data-pc]', el).forEach(function (b) { b.onclick = function () { var c = b.dataset.pc, had = st.cats.length !== only(c).length; st.cats = only(c); if (!had) st.cats.push(c); drawScope(); prev(); }; });
      $$('[data-psa]', el).forEach(function (b) { b.onclick = function () { var c = b.dataset.psa; st.cats = only(c); st.cats.push(c); drawScope(); prev(); }; });
      $$('[data-ps]', el).forEach(function (b) { b.onclick = function () { var k = b.dataset.ps.split('|'), c = k[0], e = c + ' › ' + k[1], i = st.cats.indexOf(e); st.cats = st.cats.filter(function (x) { return x !== c; }); if (i >= 0) st.cats.splice(st.cats.indexOf(e), 1); else st.cats.push(e); if (!st.cats.some(function (x) { return x === c || x.indexOf(c + ' › ') === 0; })) st.cats.push(c); drawScope(); prev(); }; });
      $$('#xav button', el).forEach(function (b) { b.onclick = function () { st.avail = b.dataset.v === '1'; drawScope(); prev(); }; });
      var addP = function (p) { if (p && st.pids.indexOf(p.id) < 0) st.pids.push(p.id); drawScope(); prev(); };
      if ($('#xitm')) { $('#xitm').onkeydown = function (e) { if (e.key === 'Enter') { addP(Store.byBarcode(this.value)); this.value = ''; } }; $('#xpk').onclick = function () { pickProduct(addP); }; }
      if ($('#xclr')) $('#xclr').onclick = function () { st.pids = []; drawScope(); prev(); };
    };
    var calc = function (p, t) {
      var old = t === 'cost' ? U.n(p.cost) : U.n(p.prices[t]), v = U.n(st.val), n; st.op = V.op();
      if (!old && st.op !== 'set' && st.op !== 'margin') return old;
      if (st.op === 'inc') n = old * (1 + v / 100); else if (st.op === 'dec') n = old * (1 - v / 100); else if (st.op === 'add') n = old + v; else if (st.op === 'sub') n = old - v; else if (st.op === 'set') n = v; else n = t === 'cost' ? old : U.n(p.cost) * (1 + v / 100);
      if (+st.round) n = Math.round(n / +st.round) * +st.round;
      return U.r2(Math.max(0, n));
    };
    var prev = function () {
      st.val = U.n($('#xv').value); st.round = +$('#xr').value; st.op = V.op();
      $('#xunitw').style.display = (st.dir === 'set' || st.dir === 'margin') ? 'none' : '';
      $('#xvl').firstChild.textContent = st.dir === 'set' ? L('السعر الجديد', 'New price') : st.dir === 'margin' ? L('نسبة الربح على التكلفة %', 'Margin over cost %') : st.unit === 'pct' ? L('النسبة %', 'Percent %') : L('المبلغ', 'Amount') + ' (' + cur() + ')';
      var tn = st.tiers.map(function (t) { return t === 'cost' ? L('التكلفة', 'cost') : tierName(t); }).join(' + ') || '—';
      var what = (st.scope === 'all' ? L('كل المنتجات', 'all products') : st.scope === 'cat' ? (st.cats.join('، ') || '…') : st.scope === 'brand' ? (st.brands.join('، ') || '…') : st.pids.length + L(' صنف', ' items')) + (st.avail ? L(' (الموجود حالياً بس)', ' (in stock only)') : '');
      $('#xhint').innerHTML = ic('info', 16) + ' <span>' + (st.dir === 'set' ? L('سعر ', 'Set ') + '<b>' + tn + '</b> = ' + U.money(st.val) : st.dir === 'margin' ? '<b>' + tn + '</b>' + L(' = التكلفة + ', ' = cost + ') + st.val + '%' : (st.dir === 'up' ? L('رفع ', 'Raise ') : L('تخفيض ', 'Lower ')) + '<b>' + tn + '</b> ' + (st.unit === 'pct' ? st.val + '%' : U.money(st.val) + ' ' + cur())) + '</span><span>' + L(' — على ', ' — on ') + '<b>' + U.esc(what) + '</b></span>';
      var ps = scopeProducts(st).filter(function (p) { return !st.avail || U.n(p.stock) > 0; }), tiers = st.tiers.slice().sort();
      st.sel = st.sel || {}; var selP = ps.filter(function (p) { return st.sel[p.id]; }), useSel = selP.length > 0, applied = useSel ? selP : ps, xq = U.norm(st.xq || ''), shown = ps.filter(function (p) { return !xq || U.norm(pname(p) + ' ' + p.barcodes.join(' ')).indexOf(xq) >= 0; });
      $('#xcnt').innerHTML = useSel ? '☑️ <b>' + selP.length + '</b>' + L(' محدد من ', ' selected of ') + ps.length + ' <a id="xsclr" style="cursor:pointer;color:var(--bad);margin-inline-start:6px">✕ ' + L('مسح التحديد', 'clear') + '</a>' : ps.length + L(' صنف', ' items');
      $('#xn').textContent = applied.length ? '(' + applied.length + (useSel ? L(' محدد', ' selected') : '') + ')' : '';
      var box = $('#xprev'), sc = box.scrollTop, lim = shown.slice(0, 400), allOn = lim.length && lim.every(function (p) { return st.sel[p.id]; });
      box.innerHTML = ps.length && tiers.length ? '<div class="muted small" style="padding:2px 2px 8px">☑️ ' + L('علّم على أصناف معيّنة عشان التعديل يتطبق عليها هي بس — من غير تحديد بيتطبق على كل اللي في القايمة', 'Tick products to change only them — with nothing ticked, the change applies to the whole list') + '</div><table class="t"><tr><th style="width:34px"><input type="checkbox" id="xsa" title="' + L('تحديد الكل', 'Select all') + '"' + (allOn ? ' checked' : '') + '></th><th>' + L('الصنف', 'Product') + '</th>' + tiers.map(function (t) { return '<th>' + (t === 'cost' ? L('التكلفة', 'Cost') : tierName(t)) + '</th>'; }).join('') + '</tr>' +
        lim.map(function (p) { var on = !!st.sel[p.id], act = !useSel || on; return '<tr data-xr="' + p.id + '" class="' + (on ? 'xon' : act ? '' : 'xdim') + '" style="cursor:pointer"><td><input type="checkbox" data-xs="' + p.id + '"' + (on ? ' checked' : '') + '></td><td><b class="small">' + U.esc(pname(p)) + '</b> <span class="muted small">' + U.esc(p.shade || '') + '</span></td>' + tiers.map(function (t) { var o = t === 'cost' ? U.n(p.cost) : U.n(p.prices[t]), n = act ? calc(p, t) : o; return '<td class="num small"><span class="muted">' + U.money(o) + '</span>' + (act ? ' → <b style="color:' + (n > o ? 'var(--ok)' : n < o ? 'var(--bad)' : 'inherit') + '">' + U.money(n) + '</b>' : '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' + (shown.length > 400 ? '<div class="muted small" style="padding:8px;text-align:center">+' + (shown.length - 400) + L(' — استخدم البحث', ' — use search') + '</div>' : '') + (!shown.length ? '<div class="empty">' + L('مفيش نتايج للبحث', 'No matches') + '</div>' : '') : '<div class="empty">' + L('اختار القسم والأسعار المطلوب تعديلها', 'Pick what to change') + '</div>';
      box.scrollTop = sc; if (useSel) { var hs = $$('#xhint > span'); if (hs[1]) hs[1].innerHTML = L(' — على ', ' — on ') + '<b>' + selP.length + L(' صنف محدد', ' selected products') + '</b>'; }
      $$('[data-xr]', box).forEach(function (tr) { tr.onclick = function (e) { var id = tr.dataset.xr; if (e.target.tagName !== 'INPUT') st.sel[id] = !st.sel[id]; else st.sel[id] = e.target.checked; if (!st.sel[id]) delete st.sel[id]; prev(); }; });
      if ($('#xsa', box)) $('#xsa', box).onchange = function () { var c = this.checked; lim.forEach(function (p) { if (c) st.sel[p.id] = true; else delete st.sel[p.id]; }); prev(); };
      if ($('#xsclr')) $('#xsclr').onclick = function () { st.sel = {}; prev(); };
      return applied;
    };
    $$('#xsc button').forEach(function (b) { b.onclick = function () { st.scope = b.dataset.v; $$('#xsc button').forEach(function (x) { x.classList.toggle('on', x === b); }); drawScope(); prev(); }; });
    $$('[data-tier]').forEach(function (i) { i.onchange = function () { var t = i.dataset.tier === 'cost' ? 'cost' : +i.dataset.tier, k = st.tiers.indexOf(t); if (i.checked && k < 0) st.tiers.push(t); if (!i.checked && k >= 0) st.tiers.splice(k, 1); prev(); }; });
    $('#xv').oninput = prev; $('#xr').onchange = prev; $('#xq').oninput = function () { st.xq = this.value; prev(); };
    $$('#xdir button').forEach(function (b) { b.onclick = function () { st.dir = b.dataset.v; $$('#xdir button').forEach(function (x) { x.classList.toggle('on', x === b); }); prev(); }; });
    $$('#xunit button').forEach(function (b) { b.onclick = function () { st.unit = b.dataset.v; $$('#xunit button').forEach(function (x) { x.classList.toggle('on', x === b); }); prev(); }; });
    $('#xgo').onclick = function () {
      var ps = prev(); if (!ps.length || !st.tiers.length) return toast(L('مفيش حاجة تتعدل', 'Nothing to change'), 'bad');
      var nSel = Object.keys(st.sel || {}).length; var label = (nSel ? ps.length + L(' صنف محدد من ', ' selected of ') : '') + (st.scope === 'all' ? L('كل المنتجات', 'All') : st.scope === 'cat' ? st.cats.join('، ') : st.scope === 'brand' ? st.brands.join('، ') : st.pids.length + L(' صنف', ' items')) + ' — ' + $('#xhint span').textContent;
      Modal.confirm(L('هيتم تعديل أسعار ', 'Prices of ') + '<b>' + ps.length + '</b>' + L(' صنف', ' products') + (nSel ? L(' (المحدد بس)', ' (selected only)') : '') + L('. تقدر تتراجع بعدين من زرار "تراجع".', ' will change. You can undo afterwards.'), function () {
        var snap = ps.map(function (p) { return { id: p.id, prices: p.prices.slice(), cost: p.cost }; });
        ps.forEach(function (p) { st.tiers.forEach(function (t) { var n = calc(p, t); if (t === 'cost') p.cost = n; else p.prices[t] = n; }); });
        Store.db.priceHistory = (Store.db.priceHistory || []).concat([{ t: Date.now(), by: App.user.name, label: label, snap: snap }]).slice(-10);
        Store.log('price.bulk', label + ' (' + ps.length + ')'); st.sel = {}; Store.save(); toast(L('تم تعديل أسعار ', 'Updated ') + ps.length + L(' صنف ✓', ' products ✓'), 'ok'); V.render(el);
      });
    };
    if ($('#xpromo')) $('#xpromo').onclick = function () {
      if (st.dir !== 'down' && st.dir !== 'set') return toast(L('العرض بيبقى تخفيض أو سعر جديد أقل — اختار "تخفيض"', 'Offers lower the price — choose "Lower"'), 'bad');
      var tiers = st.tiers.filter(function (t) { return t !== 'cost'; }); if (!tiers.length) tiers = [0];
      Views.promos.seed = { scope: st.scope, cats: st.cats.slice(), brands: st.brands.slice(), pids: st.pids.slice(), type: st.dir === 'set' ? 'price' : st.unit === 'pct' ? 'pct' : 'amt', val: st.val, round: st.round, tiers: tiers };
      go('promos'); Views.promos.edit(null, $('#view'));
    };
    if ($('#xundo')) $('#xundo').onclick = function () {
      var h = Store.db.priceHistory[Store.db.priceHistory.length - 1];
      Modal.confirm(L('إرجاع الأسعار زي ما كانت قبل: ', 'Restore prices from before: ') + '<b>' + U.esc(h.label) + '</b>؟', function () {
        h.snap.forEach(function (s) { var p = Store.product(s.id); if (p) { p.prices = s.prices; p.cost = s.cost; } });
        Store.db.priceHistory.pop(); Store.log('price.undo', h.label); Store.save(); toast(L('تم التراجع ✓', 'Undone ✓'), 'ok'); V.render(el);
      });
    };
    drawScope(); prev();
  }
};

/* ================= GOODS RECEIVING (استلام الأصناف) ================= */
Views.purchases = {
  draft: null, view: null,
  render: function (el) {
    var V = Views.purchases, db = Store.db;
    if (V.draft) return V.form(el);
    if (V.view) return V.detail(el);
    var today0 = dayStart(), todayQty = db.purchases.filter(function (p) { return p.date >= today0; }).reduce(function (s, p) { return s + p.items.reduce(function (a, i) { return a + i.qty; }, 0); }, 0);
    el.innerHTML = '<div class="row" style="margin-bottom:14px"><div class="grow"><b style="font-size:16px">' + L('استلام الأصناف', 'Goods receiving') + '</b><div class="muted small">' + L('امسح البضاعة اللي وصلت، الكميات بتتضاف للمخزن، والصنف الجديد بتعرّفه في نفس اللحظة', 'Scan incoming goods; stock is added and unknown items are created on the spot') + '</div></div><span class="chip ok">' + L('مستلم النهارده: ', 'Received today: ') + '<b class="num">' + todayQty + '</b></span><button class="btn pri" id="pnew">' + ic('truck') + L('استلام جديد', 'New receipt') + '</button></div>' +
      '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('المورد', 'Supplier') + '</th><th>' + L('فاتورة المورد', 'Supplier inv.') + '</th><th>' + L('الأصناف', 'Lines') + '</th><th>' + L('القطع', 'Pieces') + '</th><th>' + (can('products.viewCost') ? L('الإجمالي', 'Total') : '') + '</th><th>' + L('بواسطة', 'By') + '</th></tr>' +
      (db.purchases.length ? db.purchases.slice().reverse().slice(0, 300).map(function (p) { var s = db.suppliers.filter(function (x) { return x.id === p.supplier; })[0]; return '<tr data-id="' + p.id + '" style="cursor:pointer"><td class="num"><b>' + p.no + '</b></td><td class="num">' + U.dt(p.date) + '</td><td>' + U.esc(s ? s.name : '—') + '</td><td class="num">' + U.esc(p.ref || '—') + '</td><td class="num">' + p.items.length + '</td><td class="num">' + p.items.reduce(function (a, i) { return a + i.qty; }, 0) + '</td><td>' + (can('products.viewCost') ? M(p.total) : '') + '</td><td>' + U.esc(p.by) + '</td></tr>'; }).join('') : '<tr><td colspan="8"><div class="empty">' + ic('truck', 42) + '<div>' + L('مفيش استلامات لسه', 'No receipts yet') + '</div></div></td></tr>') + '</table></div>';
    $('#pnew').onclick = function () { V.draft = { supplier: '', ref: '', items: [], paid: 0, note: '', updCost: true, updPrice: true }; V.form(el); };
    $$('tr[data-id]').forEach(function (r) { r.onclick = function () { V.view = db.purchases.filter(function (p) { return p.id === r.dataset.id; })[0]; V.detail(el); }; });
  },
  detail: function (el) {
    var V = Views.purchases, p = V.view, vc = can('products.viewCost');
    el.innerHTML = '<div class="row" style="margin-bottom:14px"><button class="btn" id="dback">' + ic('ret') + '</button><b class="grow" style="font-size:16px">' + L('استلام #', 'Receipt #') + p.no + ' <span class="muted small num">' + U.dt(p.date) + '</span></b>' + (can('labels') ? '<button class="btn pri" id="dlbl">' + ic('barcode') + L('طباعة باركود للكميات المستلمة', 'Print labels for received qty') + '</button>' : '') + '</div><div class="tbl-wrap"><table class="t"><tr><th>' + L('الصنف', 'Product') + '</th><th>' + L('الكمية', 'Qty') + '</th>' + (vc ? '<th>' + L('التكلفة', 'Cost') + '</th><th>' + L('الإجمالي', 'Total') + '</th>' : '') + '</tr>' + p.items.map(function (i) { var pr = Store.product(i.pid); return '<tr><td><b>' + U.esc(pr ? pname(pr) : '?') + '</b> <span class="muted small">' + U.esc(pr && pr.shade || '') + '</span></td><td class="num">' + i.qty + '</td>' + (vc ? '<td class="num">' + U.money(i.cost) + '</td><td class="num">' + U.money(i.qty * i.cost) + '</td>' : '') + '</tr>'; }).join('') + '</table></div>' + (p.note ? '<div class="card" style="margin-top:12px">' + U.esc(p.note) + '</div>' : '');
    $('#dback').onclick = function () { V.view = null; V.render(el); };
    if ($('#dlbl')) $('#dlbl').onclick = function () { V.labels(p.items); };
  },
  labels: function (items) {
    Views.labels.queue = items.map(function (i) { var p = Store.product(i.pid); return p ? { pid: i.pid, qty: i.qty, code: p.barcodes[0] } : null; }).filter(Boolean);
    go('labels');
  },
  quickAdd: function (code, cb) {
    if (!can('products.add')) { beep(false); return toast(L('الباركود مش متسجل، ومعندكش صلاحية إضافة أصناف', 'Unknown barcode and no permission to add products'), 'bad'); }
    var ep = can('products.editPrice'), vc = can('products.viewCost');
    var m = Modal.open({
      size: 'wide', title: L('صنف جديد — باركود ', 'New item — barcode ') + '<span class="tag">' + U.esc(code) + '</span>',
      body: '<div class="col"><div class="grid g2"><label class="f">' + L('اسم الصنف *', 'Name *') + '<input class="in" id="qn" autofocus></label><label class="f">' + L('البند / القسم', 'Category') + '<input class="in" id="qc" list="qcl" value="' + U.esc(Views.purchases.lastCat || S().categories[0] || '') + '"><datalist id="qcl">' + S().categories.map(function (c) { return '<option value="' + U.esc(c) + '">'; }).join('') + '</datalist></label></div>' +
        '<div class="grid g3"><label class="f">' + L('الماركة', 'Brand') + '<input class="in" id="qb"></label><label class="f">' + L('اللون / الدرجة', 'Shade') + '<input class="in" id="qs"></label><label class="f">' + L('حد الطلب', 'Reorder level') + '<input class="in num" type="number" id="qm" value="2"></label></div>' +
        (ep ? '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">' + (vc ? '<label class="f">' + L('التكلفة', 'Cost') + '<input class="in num" type="number" id="qcost"></label>' : '') + S().tiers.map(function (t, i) { return '<label class="f">' + tierName(i) + '<input class="in num" type="number" data-qp="' + i + '"' + (i ? ' placeholder="' + L('فاضي = القطاعي', 'empty = retail') + '"' : '') + '></label>'; }).join('') + '</div>' : '<div class="chip warn">' + L('الأسعار هيحددها المدير', 'Prices will be set by a manager') + '</div>') + '</div>',
      foot: '<button class="btn" data-c>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri" id="qsave">' + ic('plus') + L('إضافة واستلام', 'Add & receive') + ' <span class="kbd">Enter</span></button>'
    });
    var save = function () {
      var n = $('#qn', m).value.trim(); if (!n) return toast(L('اكتب اسم الصنف', 'Name is required'), 'bad');
      var p = { id: U.id(), created: Date.now(), name: n, nameEn: '', cat: $('#qc', m).value.trim(), brand: $('#qb', m).value.trim(), shade: $('#qs', m).value.trim(), barcodes: [code], cost: $('#qcost', m) ? U.n($('#qcost', m).value) : 0, prices: [0, 0, 0, 0], stock: 0, minStock: U.n($('#qm', m).value), expiry: '', active: true, unit: '' };
      $$('[data-qp]', m).forEach(function (i) { p.prices[+i.dataset.qp] = U.n(i.value); });
      if (p.cat && S().categories.indexOf(p.cat) < 0) S().categories.push(p.cat);
      Views.purchases.lastCat = p.cat;
      Store.db.products.push(p); Store.reindex(); Store.log('product.add', n + ' (receive)'); Store.save(); Modal.close(m); cb(p);
    };
    $('#qsave', m).onclick = save; $('[data-c]', m).onclick = function () { Modal.close(m); };
    m.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); save(); } });
  },
  form: function (el) {
    var V = Views.purchases, d = V.draft, db = Store.db, vc = can('products.viewCost'), ep = can('products.editPrice');
    el.innerHTML = '<div class="grid" style="grid-template-columns:1fr 330px;gap:16px;align-items:start"><div class="col"><div class="scan"><div class="bi">' + ic('barcode') + '</div><input id="ps" placeholder="' + L('امسح باركود الصنف المستلم… (5*باركود = 5 قطع)', 'Scan received item… (5*barcode = 5 pcs)') + '"><button class="btn" id="ppick">' + ic('search') + L('اختيار', 'Pick') + '</button></div><div class="card" style="padding:0;overflow:hidden" id="pit"></div></div>' +
      '<div class="card col"><label class="f">' + L('المورد', 'Supplier') + '<select class="in" id="psup"><option value="">—</option>' + db.suppliers.map(function (s) { return '<option value="' + s.id + '" ' + (s.id === d.supplier ? 'selected' : '') + '>' + U.esc(s.name) + '</option>'; }).join('') + '</select></label><label class="f">' + L('رقم فاتورة المورد', 'Supplier invoice no.') + '<input class="in" id="pref" value="' + U.esc(d.ref) + '"></label>' +
      (vc ? '<label class="row small"><input type="checkbox" class="sw" id="pupd" ' + (d.updCost ? 'checked' : '') + '> ' + L('تحديث سعر التكلفة', 'Update cost price') + '</label>' : '') + (ep ? '<label class="row small"><input type="checkbox" class="sw" id="pupp" ' + (d.updPrice ? 'checked' : '') + '> ' + L('تحديث سعر البيع من الاستلام', 'Update selling price from receipt') + '</label>' : '') +
      '<div class="card kpi hero"><div class="l">' + L('إجمالي القطع', 'Total pieces') + '</div><div class="v num" id="pq">0</div>' + (vc ? '<div class="small" style="opacity:.85">' + L('القيمة: ', 'Value: ') + '<b class="num" id="ptot">0</b></div>' : '') + '</div>' +
      (vc ? '<label class="f">' + L('المدفوع للمورد', 'Paid to supplier') + '<input class="in num" type="number" id="ppaid" value="' + (d.paid || '') + '"></label>' : '') + '<label class="f">' + L('ملاحظات', 'Notes') + '<input class="in" id="pnote" value="' + U.esc(d.note) + '"></label>' +
      '<button class="btn pri lg" id="psave">' + ic('save') + L('حفظ الاستلام وإضافة للمخزن', 'Save & add to stock') + '</button><button class="btn" id="pcan">' + L('إلغاء', 'Cancel') + '</button></div></div>';
    var draw = function () {
      $('#pit').innerHTML = d.items.length ? '<table class="t"><tr><th>' + L('الصنف', 'Product') + '</th><th>' + L('الرصيد الحالي', 'In stock') + '</th><th>' + L('الكمية المستلمة', 'Qty received') + '</th>' + (vc ? '<th>' + L('التكلفة', 'Unit cost') + '</th>' : '') + (ep ? S().tiers.map(function (t, ti) { return '<th>' + tierName(ti) + '</th>'; }).join('') : '') + '<th></th></tr>' + d.items.map(function (i, x) { var p = Store.product(i.pid); if (p && !i.prices) { i.prices = [0, 1, 2, 3].map(function (t) { return U.n(p.prices[t]); }); if (i.price) i.prices[0] = U.n(i.price); } i.prices = i.prices || [U.n(i.price), 0, 0, 0]; return '<tr class="' + (x === d.items.length - 1 && d.flash ? 'flash' : '') + '"><td><b>' + U.esc(p ? pname(p) : '') + '</b> <span class="muted small">' + U.esc(p && p.shade || '') + '</span>' + (i.isNew ? ' <span class="chip ok">' + L('جديد', 'new') + '</span>' : '') + '<div>' + (p ? '<span class="tag">' + U.esc(p.barcodes[0]) + '</span>' : '') + '</div></td><td class="num muted">' + (p ? U.n(p.stock) : '') + ' → <b style="color:var(--ok)">' + (p ? U.n(p.stock) + i.qty : '') + '</b></td><td><input class="in num" style="width:84px;font-weight:700" type="number" data-q="' + x + '" value="' + i.qty + '"></td>' + (vc ? '<td><input class="in num" style="width:96px" type="number" data-c="' + x + '" value="' + i.cost + '"></td>' : '') + (ep ? S().tiers.map(function (t, ti) { var v = U.n(i.prices[ti]); return '<td><input class="in num" style="width:86px" type="number" data-pr="' + x + '|' + ti + '" value="' + (v || (ti ? '' : 0)) + '" placeholder="' + (ti ? U.n(i.prices[0]) : '0') + '"' + (ti ? ' title="' + L('فاضي = سعر القطاعي', 'Empty = retail') + '"' : '') + '></td>'; }).join('') : '') + '<td><button class="btn ghost sm" data-r="' + x + '">' + ic('x', 15) + '</button></td></tr>'; }).join('') + '</table>' : '<div class="empty" style="padding:70px 20px">' + ic('truck', 50) + '<div style="margin-top:12px">' + L('امسح البضاعة اللي وصلت — كل مسحة = قطعة', 'Scan incoming goods — each scan = 1 piece') + '</div><div class="muted small" style="margin-top:6px">' + L('لو الباركود مش متسجل هيفتحلك تعريف صنف جديد على طول', 'Unknown barcodes open a quick new-item form') + '</div></div>';
      $$('[data-q]').forEach(function (i) { i.onchange = function () { d.items[+i.dataset.q].qty = Math.max(0, U.n(i.value)); draw(); }; });
      $$('[data-c]').forEach(function (i) { i.onchange = function () { d.items[+i.dataset.c].cost = U.n(i.value); draw(); }; });
      $$('#pit [data-pr]').forEach(function (i) { var k = i.dataset.pr.split('|'), it = d.items[+k[0]]; i.oninput = function () { it.prices[+k[1]] = U.n(i.value); if (+k[1] === 0) { it.price = U.n(i.value); $$('#pit [data-pr^="' + k[0] + '|"]').forEach(function (o) { if (o !== i) o.placeholder = i.value || '0'; }); } }; i.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); var all = $$('#pit input'), ix = all.indexOf(i); if (all[ix + 1]) all[ix + 1].focus(); else $('#ps').focus(); } }; });
      $$('[data-r]').forEach(function (b) { b.onclick = function () { d.items.splice(+b.dataset.r, 1); draw(); }; });
      $('#pq').textContent = d.items.reduce(function (s, i) { return s + i.qty; }, 0);
      if ($('#ptot')) $('#ptot').textContent = U.money(d.items.reduce(function (s, i) { return s + i.qty * i.cost; }, 0));
      d.flash = false;
    };
    var add = function (p, q, isNew) { q = q || 1; var e = d.items.filter(function (i) { return i.pid === p.id; })[0]; if (e) { e.qty += q; d.items.splice(d.items.indexOf(e), 1); d.items.push(e); } else d.items.push({ pid: p.id, qty: q, cost: U.n(p.cost), price: priceOf(p, 0), isNew: !!isNew }); d.flash = true; beep(true); draw(); $('#ps').focus(); };
    $('#ps').onkeydown = function (e) {
      if (e.key !== 'Enter') return; var v = this.value.trim(), q = 1, mm = v.match(/^(\d+)\*(.+)$/); if (mm) { q = +mm[1]; v = mm[2]; } this.value = ''; if (!v) return;
      var p = Store.byBarcode(v); if (p) return add(p, q);
      beep(false); V.quickAdd(v, function (np) { add(np, q, true); });
    };
    $('#ppick').onclick = function () { pickProduct(function (p) { add(p); }); };
    $('#psup').onchange = function () { d.supplier = this.value; }; $('#pref').oninput = function () { d.ref = this.value; };
    if ($('#pupd')) $('#pupd').onchange = function () { d.updCost = this.checked; };
    if ($('#pupp')) $('#pupp').onchange = function () { d.updPrice = this.checked; };
    if ($('#ppaid')) $('#ppaid').oninput = function () { d.paid = U.n(this.value); };
    $('#pnote').oninput = function () { d.note = this.value; };
    $('#pcan').onclick = function () { if (!d.items.length) { V.draft = null; return V.render(el); } Modal.confirm(L('إلغاء الاستلام؟ الأصناف الممسوحة مش هتتحفظ', 'Discard this receipt?'), function () { V.draft = null; V.render(el); }); };
    $('#psave').onclick = function () {
      var items = d.items.filter(function (i) { return i.qty > 0; }); if (!items.length) return toast(L('مفيش كميات', 'No quantities'), 'bad');
      var t = U.r2(items.reduce(function (s, i) { return s + i.qty * i.cost; }, 0)); db.seq.purchase++;
      var rec = { id: U.id(), no: db.seq.purchase, date: Date.now(), supplier: d.supplier, ref: d.ref, items: items.map(function (i) { return { pid: i.pid, qty: i.qty, cost: i.cost }; }), total: t, paid: U.n(d.paid), note: d.note, by: App.user.name };
      items.forEach(function (i) {
        Store.move(i.pid, i.qty, 'purchase', 'R#' + rec.no); var p = Store.product(i.pid); if (!p) return;
        if (vc && d.updCost && i.cost) p.cost = i.cost;
        if (ep && d.updPrice) (i.prices || [i.price]).forEach(function (v, t) { v = U.n(v); if ((t === 0 && !v) || v === U.n(p.prices[t])) return; Store.log('price.change', pname(p) + ' [' + tierName(t) + '] ' + U.n(p.prices[t]) + ' → ' + v + ' (R#' + rec.no + ')'); p.prices[t] = v; });
      });
      if (d.supplier && vc) { var s = db.suppliers.filter(function (x) { return x.id === d.supplier; })[0]; if (s) s.balance = U.r2(U.n(s.balance) + t - rec.paid); }
      db.purchases.push(rec); Store.log('receive', 'R#' + rec.no + ' ' + items.length); Store.save(); V.draft = null;
      var pcs = items.reduce(function (s, i) { return s + i.qty; }, 0);
      var m = Modal.open({ title: L('تم الاستلام ✓', 'Received ✓'), body: '<div style="text-align:center;padding:10px"><div class="logo" style="margin:0 auto 12px;width:56px;height:56px;background:var(--ok);color:#fff">' + ic('truck', 26) + '</div><b style="font-size:18px">' + L('اتضاف ', 'Added ') + '<span class="num">' + pcs + '</span>' + L(' قطعة للمخزن', ' pieces to stock') + '</b><div class="muted" style="margin-top:6px">' + L('استلام رقم ', 'Receipt #') + rec.no + '</div></div>', foot: '<button class="btn" data-x2>' + L('تمام', 'Done') + '</button>' + (can('labels') ? '<button class="btn pri" id="plb">' + ic('barcode') + L('اطبع باركود للبضاعة دي', 'Print labels for these') + '</button>' : '') });
      $('[data-x2]', m).onclick = function () { Modal.close(m); V.render(el); };
      if ($('#plb', m)) $('#plb', m).onclick = function () { Modal.close(m); V.labels(rec.items); };
    };
    draw(); $('#ps').focus();
  }
};
if (typeof Updater !== 'undefined') Updater.notes['1.9.4'] = ['🚚 استلام الأصناف: خانات التكلفة وقطاعي ونص جملة وجملة وسعر خاص لكل صنف، وبتتحدّث في الصنف مع الحفظ', '➕ تعريف صنف جديد من الاستلام فيه السعر الخاص كمان'];
if (typeof Updater !== 'undefined') Updater.notes['1.9.8'] = ['🏷️ تعديل الأسعار: تختار القسم وبعدين بنوده (كل البنود أو بند معيّن)، ومعاها «الكل» أو «الموجود حالياً بس»'];
if (typeof Updater !== 'undefined') Updater.notes['1.9.9'] = ['☑️ تعديل الأسعار: تقدر تعلّم على أصناف معيّنة في المعاينة (مع بحث وتحديد الكل) والتعديل يتطبق على المحدد بس'];
