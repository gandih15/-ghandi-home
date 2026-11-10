/* Ghandi Home — fixed category list (managed in its own page), "in stock" filter, stock value at cost & every price. */
'use strict';

/* ================= categories ================= */
var Cats = {
  count: function () { var c = {}; Store.db.products.forEach(function (p) { if (p.cat) c[p.cat] = (c[p.cat] || 0) + 1; }); return c; },
  // most-used first (number of products), ties keep their order
  sort: function () { var s = S(), c = Cats.count(), idx = {}; s.categories = (s.categories || []).filter(function (x, i, a) { return x && a.indexOf(x) === i; }); s.categories.forEach(function (x, i) { idx[x] = i; }); s.categories.sort(function (a, b) { return (c[b] || 0) - (c[a] || 0) || idx[a] - idx[b]; }); return s.categories; },
  select: function (id, val, extra) {
    var list = Cats.sort().slice(); if (val && list.indexOf(val) < 0) list.push(val);
    return '<select class="in" id="' + id + '"' + (extra || '') + '>' + (val ? '' : '<option value="">— ' + L('اختار القسم', 'Pick a category') + ' —</option>') + list.map(function (c) { return '<option' + (c === val ? ' selected' : '') + '>' + U.esc(c) + '</option>'; }).join('') + '<option value="">' + L('بدون قسم', 'No category') + '</option></select>';
  },
  // searchable pick-list: type to filter, choose only from the list; 📌 keeps the choice for the next products
  combo: function (old, id, val, disabled) {
    var w = document.createElement('div'); w.className = 'catbox';
    w.innerHTML = '<input type="hidden" id="' + id + '" value="' + U.esc(val) + '"><div class="row" style="gap:6px;align-items:stretch"><div class="catbox-in grow"><input class="in cb-search" autocomplete="off" placeholder="🔎 ' + L('اكتب حروف من اسم القسم…', 'Type to search categories…') + '" value="' + U.esc(val) + '"' + (disabled ? ' disabled' : '') + '><button type="button" class="cb-x" tabindex="-1" title="' + L('مسح', 'Clear') + '">✕</button><div class="cb-list hide"></div></div><label class="cb-pin" title="' + L('ثبّت القسم ده للأصناف الجاية', 'Keep this category for the next products') + '"><input type="checkbox"' + (S().catPin && S().catPin === val && val ? ' checked' : '') + (disabled ? ' disabled' : '') + '> 📌</label></div>';
    old.parentNode.replaceChild(w, old);
    var hid = $('#' + id, w), q = $('.cb-search', w), list = $('.cb-list', w), pin = $('.cb-pin input', w), cur = -1, items = [];
    var set = function (v) { var ch = hid.value !== v; hid.value = v; q.value = v; if (ch) setTimeout(function () { hid.dispatchEvent(new Event('change')); }, 0); q.classList.remove('req-bad'); if (pin.checked) { S().catPin = v; Store.save(); } if (!v && pin.checked) { pin.checked = false; S().catPin = ''; Store.save(); } };
    var draw = function () {
      var t = U.norm(q.value.trim()), all = Cats.sort(); items = t && q.value !== hid.value ? all.filter(function (c) { return U.norm(c).indexOf(t) >= 0; }) : all;
      cur = items.length ? 0 : -1;
      list.innerHTML = items.length ? items.map(function (c, i) { return '<div data-i="' + i + '" class="' + (i === cur ? 'on' : '') + (c === hid.value ? ' sel' : '') + '">' + U.esc(c) + (c === hid.value ? ' ✓' : '') + '</div>'; }).join('') : '<div class="muted">' + L('مفيش قسم بالاسم ده — ضيفه من صفحة «الأقسام»', 'No such category — add it in «Categories»') + '</div>';
      list.classList.remove('hide');
      $$('[data-i]', list).forEach(function (d) { d.onmousedown = function (e) { e.preventDefault(); set(items[+d.dataset.i]); list.classList.add('hide'); }; });
    };
    var hl = function () { $$('[data-i]', list).forEach(function (d) { d.classList.toggle('on', +d.dataset.i === cur); if (+d.dataset.i === cur) d.scrollIntoView({ block: 'nearest' }); }); };
    q.onfocus = function () { q.select(); draw(); };
    q.oninput = draw;
    q.onkeydown = function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (cur < items.length - 1) cur++; hl(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (cur > 0) cur--; hl(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (cur >= 0 && items[cur]) { set(items[cur]); list.classList.add('hide'); } }
      else if (e.key === 'Escape') { list.classList.add('hide'); q.value = hid.value; }
    };
    q.onblur = function () { setTimeout(function () { list.classList.add('hide'); var exact = S().categories.filter(function (c) { return U.norm(c) === U.norm(q.value.trim()); })[0]; if (exact) set(exact); else if (!q.value.trim()) set(''); else q.value = hid.value; }, 120); };
    $('.cb-x', w).onclick = function () { set(''); q.focus(); };
    pin.onchange = function () { if (pin.checked) { if (!hid.value) { pin.checked = false; return toast(L('اختار القسم الأول وبعدين ثبّته', 'Pick a category first'), 'bad'); } S().catPin = hid.value; toast('📌 ' + L('القسم «', 'Category «') + hid.value + L('» هيفضل متعلّم عليه في الأصناف الجاية', '» will stay selected for the next products'), 'ok'); } else { S().catPin = ''; } Store.save(); };
    return w;
  },
  rename: function (from, to) {
    var s = S(), db = Store.db; s.categories[s.categories.indexOf(from)] = to;
    db.products.forEach(function (p) { if (p.cat === from) p.cat = to; });
    (db.promos || []).forEach(function (pr) { if (pr.cats) pr.cats = pr.cats.map(function (c) { return c === from ? to : c; }); });
    if (s.catPin === from) s.catPin = to; Store.log('category.rename', from + ' → ' + to); Store.save();
  },
  remove: function (name, moveTo) {
    var s = S(), db = Store.db; s.categories.splice(s.categories.indexOf(name), 1);
    db.products.forEach(function (p) { if (p.cat === name) p.cat = moveTo || ''; });
    (db.promos || []).forEach(function (pr) { if (pr.cats) pr.cats = pr.cats.filter(function (c) { return c !== name; }); });
    if (s.catPin === name) s.catPin = ''; Store.log('category.delete', name + (moveTo ? ' → ' + moveTo : '')); Store.save();
  }
};
// product form & quick-add while receiving: pick from the list instead of typing
(function () {
  var P = Views.products, edit = P.edit;
  P.edit = function (p) {
    edit.apply(this, arguments);
    var m = $$('.mask').pop(), inp = m && $('#fc', m); if (!inp || inp.tagName !== 'INPUT') return;
    var val = p ? (p.cat || '') : (S().catPin && S().categories.indexOf(S().catPin) >= 0 ? S().catPin : '');
    var dl = $('#cats', m); if (dl) dl.remove(); Cats.combo(inp, 'fc', val, inp.disabled);
  };
  var qa = Views.purchases.quickAdd;
  if (qa) Views.purchases.quickAdd = function () {
    var r = qa.apply(this, arguments), m = $$('.mask').pop(), inp = m && $('#qc', m);
    if (inp && inp.tagName === 'INPUT') { var dl = $('#qcl', m); if (dl) dl.remove(); Cats.combo(inp, 'qc', S().catPin && S().categories.indexOf(S().catPin) >= 0 ? S().catPin : ''); }
    return r;
  };
  var pr = P.render; // category filter in most-used order
  P.render = function (el) { Cats.sort(); return pr.apply(this, arguments); };
  var pos = Views.pos.render;
  Views.pos.render = function (el) { Cats.sort(); return pos.apply(this, arguments); };
})();
Views.cats = {
  render: function (el) {
    var V = Views.cats, list = Cats.sort(), cnt = Cats.count(), stock = {}, none = 0;
    Store.db.products.forEach(function (p) { if (p.cat) stock[p.cat] = (stock[p.cat] || 0) + Math.max(0, ownQty(p)); else none++; });
    var stray = Object.keys(cnt).filter(function (c) { return list.indexOf(c) < 0; });
    el.innerHTML = '<div class="grid" style="grid-template-columns:340px 1fr;gap:16px;align-items:start"><div class="card col"><h3>➕ ' + L('قسم جديد', 'New category') + '</h3><input class="in" id="caN" placeholder="' + L('اسم القسم', 'Category name') + '" autofocus><button class="btn pri" id="caAdd">' + ic('plus') + L('إضافة', 'Add') + '</button><div class="muted small">' + L('الأقسام دي بس هي اللي بتظهر لما تضيف أو تعدّل صنف — مفيش كتابة يدوي، فمفيش أقسام غلط. وبتترتب لوحدها: الأكثر استخدام فوق.', 'Only these categories appear when adding or editing a product — no free typing, no typos. Most-used first.') + '</div>' +
      (stray.length ? '<div class="card" style="padding:10px;border-color:var(--gold)"><b>⚠️ ' + L('أقسام مكتوبة في أصناف ومش في القايمة', 'Categories used by products but not in the list') + '</b>' + stray.map(function (c) { return '<div class="list-row"><span class="grow">' + U.esc(c) + ' <span class="chip">' + cnt[c] + '</span></span><button class="btn sm" data-adopt="' + U.esc(c) + '">' + L('ضيفه للقايمة', 'Add to list') + '</button></div>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('القسم', 'Category') + '</th><th>' + L('عدد الأصناف', 'Products') + '</th><th>' + L('القطع المتوفرة', 'Pieces in stock') + '</th><th></th></tr>' +
      list.map(function (c, i) { return '<tr data-c="' + U.esc(c) + '"><td class="num muted">' + (i + 1) + '</td><td><b>' + U.esc(c) + '</b></td><td class="num">' + (cnt[c] || 0) + '</td><td class="num">' + (stock[c] || 0) + '</td><td style="white-space:nowrap"><button class="btn sm ghost" data-a="ren">' + ic('edit', 15) + '</button> <button class="btn sm ghost" data-a="del" style="color:var(--bad)">' + ic('trash', 15) + '</button></td></tr>'; }).join('') +
      (none ? '<tr><td></td><td class="muted">' + L('بدون قسم', 'No category') + '</td><td class="num">' + none + '</td><td></td><td></td></tr>' : '') + '</table></div></div>';
    var add = function () { var n = $('#caN').value.trim().replace(/\s+/g, ' '); if (!n) return; if (S().categories.some(function (c) { return U.norm(c) === U.norm(n); })) return toast(L('القسم ده موجود', 'Already exists'), 'bad'); S().categories.push(n); Store.log('category.add', n); Store.save(); toast(L('اتضاف ✓', 'Added ✓'), 'ok'); V.render(el); };
    $('#caAdd').onclick = add; $('#caN').onkeydown = function (e) { if (e.key === 'Enter') add(); };
    $$('[data-adopt]').forEach(function (b) { b.onclick = function () { S().categories.push(b.dataset.adopt); Store.save(); V.render(el); }; });
    $$('tr[data-c]').forEach(function (tr) {
      var c = tr.dataset.c;
      $('[data-a="ren"]', tr).onclick = function () { Modal.prompt(L('تعديل اسم القسم', 'Rename category'), L('الاسم الجديد', 'New name'), c, function (v) { v = String(v || '').trim(); if (!v || v === c) return; if (S().categories.some(function (x) { return x !== c && U.norm(x) === U.norm(v); })) return toast(L('الاسم ده موجود', 'Name exists'), 'bad'); Cats.rename(c, v); toast(L('اتعدّل ✓ — وكل أصنافه اتنقلت للاسم الجديد', 'Renamed ✓ — its products moved too'), 'ok'); V.render(el); }); };
      $('[data-a="del"]', tr).onclick = function () {
        var n = cnt[c] || 0;
        if (!n) return Modal.confirm(L('حذف القسم «', 'Delete «') + U.esc(c) + '»؟', function () { Cats.remove(c); V.render(el); });
        var m = Modal.open({ title: '🗑️ ' + L('حذف القسم «', 'Delete «') + U.esc(c) + '»', body: '<div class="col"><div>' + L('القسم ده فيه ', 'This category has ') + '<b>' + n + '</b>' + L(' صنف. تنقلهم لأنهي قسم؟', ' products. Move them to:') + '</div>' + Cats.select('caMv', '') + '</div>', foot: '<button class="btn" id="caGo" style="color:var(--bad)">🗑️ ' + L('حذف ونقل الأصناف', 'Delete & move') + '</button>' });
        $$('#caMv option', m).forEach(function (o) { if (o.value === c) o.remove(); });
        $('#caGo', m).onclick = function () { Cats.remove(c, $('#caMv', m).value); Modal.close(m); toast(L('اتحذف ✓', 'Deleted ✓'), 'ok'); V.render(el); };
      };
    });
    $('#caN').focus();
  }
};

/* ================= stock value ================= */
var StockVal = {
  calc: function (list) {
    var tiers = [0, 1, 2, 3].filter(function (i) { return S().tiers[i] && tierVisible(i); }), r = { n: 0, pcs: 0, cost: 0, v: {}, cats: {} };
    tiers.forEach(function (i) { r.v[i] = 0; });
    list.forEach(function (p) {
      var q = Math.max(0, ownQty(p)); if (!q) return; r.n++; r.pcs += q; r.cost += q * U.n(p.cost);
      var c = r.cats[p.cat || '—'] = r.cats[p.cat || '—'] || { n: 0, pcs: 0, cost: 0, v: {} };
      c.n++; c.pcs += q; c.cost += q * U.n(p.cost);
      tiers.forEach(function (i) { var pr = i === 3 ? U.n((p.prices || [])[3]) : priceOf(p, i); if (!pr && i === 3) return; r.v[i] += q * pr; c.v[i] = (c.v[i] || 0) + q * pr; });
    });
    r.tiers = tiers.filter(function (i) { return i < 3 || r.v[3] > 0; }); return r;
  },
  html: function (r, title) {
    var vc = can('products.viewCost');
    return '<div class="card sv-card"><h3>📦 ' + title + '</h3><div class="muted small">' + r.n + L(' صنف متوفر · ', ' products in stock · ') + '<b class="num">' + r.pcs + '</b>' + L(' قطعة', ' pieces') + '</div><div class="sv-grid">' +
      (vc ? '<div class="sv-c"><div class="l">🏷️ ' + L('بسعر التكلفة', 'At cost') + '</div><div class="v num">' + U.money(r.cost) + '</div></div>' : '') +
      r.tiers.map(function (i) { var v = r.v[i]; return '<div class="sv-c t' + i + '"><div class="l">' + TIER_EMO[i] + ' ' + L('بسعر ', 'At ') + tierName(i) + '</div><div class="v num">' + U.money(v) + '</div>' + (vc ? '<div class="small" style="color:' + (v - r.cost >= 0 ? 'var(--ok)' : 'var(--bad)') + '">' + L('المكسب ', 'Profit ') + '<b class="num">' + U.money(v - r.cost) + '</b>' + (v ? ' (' + Math.round((v - r.cost) / v * 100) + '%)' : '') + '</div>' : '') + '</div>'; }).join('') + '</div></div>';
  }
};
(function () { // products page: "in stock" filter + value summary under the table
  var P = Views.products, list = P.list;
  P.list = function () { var out = list.apply(this, arguments); return P.filter === 'avail' ? out.filter(function (p) { return p.active !== false && U.n(p.stock) > 0; }) : out; };
  var render = P.render;
  P.render = function (el) {
    render.apply(this, arguments);
    var seg = $('#pf'); if (seg && !$('[data-f="avail"]', seg)) { var b = document.createElement('button'); b.dataset.f = 'avail'; b.textContent = '✅ ' + L('المتوفر', 'In stock'); if (P.filter === 'avail') { $$('button', seg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } var all = $('[data-f="all"]', seg); seg.insertBefore(b, all ? all.nextSibling : seg.firstChild); b.onclick = function () { P.filter = 'avail'; P.page = 0; $$('#pf button').forEach(function (x) { x.classList.toggle('on', x === b); }); P.table(); }; }
    P.table();
  };
  var tb = P.table;
  P.table = function () {
    tb.apply(this, arguments);
    var old = $('#svBox'); if (old) old.remove(); var pg = $('#pg'); if (!pg) return;
    var names = { all: L('كل الأصناف', 'All products'), avail: L('الأصناف المتوفرة', 'Products in stock'), low: L('النواقص', 'Low stock'), exp: L('قرّب ميعاد صلاحيتها', 'Expiring'), off: L('الموقوفة', 'Stopped') };
    var box = document.createElement('div'); box.id = 'svBox'; box.style.marginTop = '14px';
    box.innerHTML = StockVal.html(StockVal.calc(P.list()), L('قيمة البضاعة — ', 'Stock value — ') + (names[P.filter] || names.all) + (P.cat ? ' · ' + U.esc(P.cat) : '') + (P.q ? ' · 🔎 ' + U.esc(P.q) : ''));
    pg.parentNode.insertBefore(box, pg.nextSibling);
  };
})();
(function () { // reports: stock value tab with per-category breakdown
  var R = Views.reports, rr = R.render;
  R.render = function (el) {
    rr.apply(this, arguments); var seg = $('#rT', el); if (!seg) return;
    var b = document.createElement('button'); b.dataset.t = 'stock'; b.textContent = '📦 ' + L('قيمة المخزون', 'Stock value');
    if (R.tab === 'stock') { $$('button', seg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }
    var ref = $('[data-t="added"]', seg); seg.insertBefore(b, ref ? ref.nextSibling : null); b.onclick = function () { R.tab = 'stock'; R.render(el); };
    if (R.tab !== 'stock') return;
    var body = $('#rBody'), r = StockVal.calc(Store.db.products.filter(function (p) { return p.active !== false; })), vc = can('products.viewCost');
    var cats = Object.keys(r.cats).sort(function (a, b2) { return (r.cats[b2].v[0] || 0) - (r.cats[a].v[0] || 0); });
    body.innerHTML = StockVal.html(r, L('قيمة البضاعة المتوفرة دلوقتي', 'Value of stock on hand now')) +
      '<div class="row" style="margin:14px 0 8px"><b class="grow">' + L('حسب القسم', 'By category') + '</b>' + (can('export') ? '<button class="btn sm" id="svX">' + ic('down') + 'Excel</button>' : '') + '</div><div class="tbl-wrap"><table class="t"><tr><th>' + L('القسم', 'Category') + '</th><th>' + L('أصناف', 'Products') + '</th><th>' + L('قطع', 'Pieces') + '</th>' + (vc ? '<th>' + L('التكلفة', 'Cost') + '</th>' : '') + r.tiers.map(function (i) { return '<th>' + tierName(i) + '</th>' + (vc ? '<th>' + L('مكسب ', 'Profit ') + tierName(i) + '</th>' : ''); }).join('') + '</tr>' +
      cats.map(function (c) { var x = r.cats[c]; return '<tr><td><b>' + U.esc(c) + '</b></td><td class="num">' + x.n + '</td><td class="num">' + x.pcs + '</td>' + (vc ? '<td class="num">' + U.money(x.cost) + '</td>' : '') + r.tiers.map(function (i) { var v = x.v[i] || 0; return '<td class="num">' + U.money(v) + '</td>' + (vc ? '<td class="num" style="color:var(--ok)">' + U.money(v - x.cost) + '</td>' : ''); }).join('') + '</tr>'; }).join('') + '</table></div>';
    if ($('#svX')) $('#svX').onclick = function () { var h = [L('القسم', 'Category'), L('أصناف', 'Products'), L('قطع', 'Pieces')].concat(vc ? [L('التكلفة', 'Cost')] : []); r.tiers.forEach(function (i) { h.push(tierName(i)); if (vc) h.push(L('مكسب ', 'Profit ') + tierName(i)); }); saveBlob(XL.writeXlsx([h].concat(cats.map(function (c) { var x = r.cats[c], o = [c, x.n, x.pcs].concat(vc ? [U.r2(x.cost)] : []); r.tiers.forEach(function (i) { o.push(U.r2(x.v[i] || 0)); if (vc) o.push(U.r2((x.v[i] || 0) - x.cost)); }); return o; })), 'Stock', lang() !== 'en'), 'stock_value_' + U.today() + '.xlsx'); };
  };
})();
(function () {
  NAV.splice(NAV.findIndex(function (n) { return n[0] === 'products'; }) + 1, 0, ['cats', 'tag', 'الأقسام', 'Categories', 'products.edit']);
  if (typeof NAV_GEMS !== 'undefined') NAV_GEMS.cats = ['🗂️', 'g-amethyst'];
})();
if (typeof Updater !== 'undefined') Updater.notes['1.7.7'] = ['✅ فلتر «المتوفر» في الأصناف', '📦 قيمة البضاعة تحت الأصناف وفي التقارير: بالتكلفة وبكل سعر (قطاعي/نص جملة/جملة) والمكسب', '🗂️ صفحة «الأقسام»: تضيف وتعدّل وتحذف الأقسام، والصنف بيختار منها بس — والأكثر استخدام فوق'];

if (typeof Updater !== 'undefined') Updater.notes['1.7.9'] = ['🗂️ القسم في إضافة صنف: اكتب حروف وتظهر الأقسام اللي فيها الحروف دي، وعلامة 📌 تثبّت القسم للأصناف الجاية'];
