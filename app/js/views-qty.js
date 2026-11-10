/* Ghandi Home — «see stock quantities» permission (stock.viewQty).
   Off: the user sells normally (available products still show) but never sees how many are in stock,
   and the stock count is blind (counted quantities only). The owner decides per user. */
'use strict';

(function () {
  var c0 = can;
  can = function (p) {
    if (p === 'stock.viewQty' && App.user && App.user.role !== 'admin') { var ps = App.user.perms || {}; if (!('stock.viewQty' in ps)) return true; } // older users keep seeing it until the owner changes it
    return c0.apply(this, arguments);
  };
})();

var QtyHide = {
  off: function () { return !!App.user && !can('stock.viewQty'); },
  mark: function () { document.body.classList.toggle('noqty', QtyHide.off()); },
  // blank the «Stock» column of a table (header text match), colspans respected
  col: function (table, rx) {
    if (!table) return; var hr = table.tHead ? table.tHead.rows[0] : table.rows[0]; if (!hr) return; var idx = -1, x = 0;
    for (var i = 0; i < hr.cells.length; i++) { if (rx.test(hr.cells[i].textContent.trim())) { idx = x; hr.cells[i].textContent = ''; break; } x += hr.cells[i].colSpan || 1; }
    if (idx < 0) return;
    for (var r = 1; r < table.rows.length; r++) { var row = table.rows[r], y = 0; for (var k = 0; k < row.cells.length; k++) { var cs = row.cells[k].colSpan || 1; if (y === idx && cs === 1) { row.cells[k].innerHTML = ''; break; } if (y > idx) break; y += cs; } }
  },
  products: function () {
    if (!QtyHide.off()) return; var t = $('#pt table'); if (!t) return;
    QtyHide.col(t, /^(الرصيد|Stock)$/);
    $$('#pt tr.grp-cat td:first-child, #pt tr.grp-sub td:first-child').forEach(function (td) { td.innerHTML = td.innerHTML.replace(/[\d,٬]+ (قطعة|pcs)( · )?/g, ''); });
    $$('#pt .vp-chips .vchip b.num').forEach(function (b) { b.remove(); });
  }
};

(function () {
  // every screen
  var g0 = go;
  go = function () { var r = g0.apply(this, arguments); try { QtyHide.mark(); QtyHide.after(); } catch (e) { } return r; };
  QtyHide.after = function () {
    if (!QtyHide.off()) return; var v = App.view;
    if (v === 'dashboard') $$('#view .chip.bad.num').forEach(function (c) { c.remove(); });
    if (v === 'reports') $$('#view [data-t="stock"]').forEach(function (b) { b.remove(); });
    if (v === 'products') QtyHide.products();
  };
  // products table
  var P = Views.products, tb = P.table;
  P.table = function () { var r = tb.apply(this, arguments); QtyHide.products(); return r; };
  // product form: no stock field when editing an existing product
  var ed = P.edit;
  P.edit = function (p) {
    var r = ed.apply(this, arguments); if (!QtyHide.off()) return r; var m = $$('.mask').pop(); if (!m) return r;
    var f = $('#fst', m); if (f && p) { var lb = f.closest('label') || f; lb.style.display = 'none'; }
    $$('.vfield .vchip b.num', m).forEach(function (b) { b.remove(); }); $$('.vfield .small b.num', m).forEach(function (b) { b.parentNode.style.display = 'none'; });
    return r;
  };
  // product history shows balances → owner / users who can see quantities only
  if (typeof ProdHist !== 'undefined') { var ph = ProdHist.open; ProdHist.open = function () { if (QtyHide.off()) return; return ph.apply(this, arguments); }; }
  // POS: tiles keep showing available products, without the count
  var T = Views.pos.tiles; Views.pos.tiles = function () { var r = T.apply(this, arguments); QtyHide.mark(); return r; };
  // the options chooser: «available» instead of a number
  if (typeof VChoose !== 'undefined') { var vo = VChoose.open; VChoose.open = function () { var r = vo.apply(this, arguments); if (QtyHide.off()) { var m = $$('.mask').pop(); if (m) $$('.vo-s', m).forEach(function (s) { s.textContent = /خلص|out/.test(s.textContent) ? s.textContent : L('متاح', 'available'); }); } return r; }; }
  // receiving with options: hide the stock column
  if (typeof VRecv !== 'undefined') { var vr = VRecv.open; VRecv.open = function () { var r = vr.apply(this, arguments); if (QtyHide.off()) { var m = $$('.mask').pop(); if (m) QtyHide.col($('table', m), /الرصيد|Stock/); } return r; }; }
})();
if (typeof Updater !== 'undefined') Updater.notes['2.0.2'] = ['🔎 الجرد: بحث بالاسم بيطلعلك الأصناف اللي فيها الحروف اللي كتبتها وتختار منها، والقارئ بيضيف على طول', '👁️ صلاحية جديدة «رؤية الكميات المتوفرة»: لو قفلتها لمستخدم بيبيع عادي من غير ما يشوف العدد في أي صفحة، والجرد بيعد بس من غير ما يشوف المتوفر والعجز والزيادة'];

/* ================= stock count: search by name (like the products page) + scanner adds directly ================= */
(function () {
  var V = Views.count, ss = V.session;
  V.session = function (el) {
    ss.apply(this, arguments); var cs = $('#cs'); if (!cs) return; var orig = cs.onkeydown, wrap = cs.closest('.scan'); wrap.style.position = 'relative';
    cs.placeholder = L('امسح الباركود أو اكتب جزء من اسم الصنف واختار — كل مسح = قطعة (أو 5*باركود)', 'Scan, or type part of a name and pick — each scan = 1 pc (or 5*barcode)');
    var list = document.createElement('div'); list.className = 'cb-list hide cnt-list'; wrap.appendChild(list); var hits = [], cur = 0;
    var addP = function (p) { list.classList.add('hide'); cs.value = p.barcodes[0] || ''; orig.call(cs, { key: 'Enter', preventDefault: function () {} }); cs.value = ''; cs.focus(); };
    var show = function () {
      var raw = cs.value.trim(), q = U.norm(raw.replace(/^\d+\*/, '')); if (q.length < 2 || /^\d+$/.test(q)) { list.classList.add('hide'); hits = []; return; }
      var vq = can('stock.viewQty'); hits = Store.db.products.filter(function (p) { return U.norm(pname(p) + ' ' + (p.nameEn || '') + ' ' + (p.brand || '') + ' ' + (p.shade || '') + ' ' + p.barcodes.join(' ')).indexOf(q) >= 0; }).slice(0, 12); cur = 0;
      list.innerHTML = hits.length ? hits.map(function (p, i) { var ln = V.cur.lines[p.id]; return '<div data-i="' + i + '"' + (i ? '' : ' class="on"') + '><b>' + U.esc(pname(p)) + '</b>' + (p.shade ? ' <span class="muted">· ' + U.esc(p.shade) + '</span>' : '') + ' <span class="muted small num">' + U.esc(p.barcodes[0] || '') + '</span>' + (vq ? ' <span class="chip num">' + U.n(p.stock) + '</span>' : '') + (ln ? ' <span class="chip ok num">' + L('معدود ', 'counted ') + ln.q + '</span>' : '') + '</div>'; }).join('') : '<div class="muted">' + L('مفيش صنف بالاسم ده', 'No product matches') + '</div>';
      list.classList.remove('hide');
      $$('[data-i]', list).forEach(function (d) { d.onmousedown = function (e) { e.preventDefault(); var mm = cs.value.trim().match(/^(\d+)\*/); var p = hits[+d.dataset.i]; if (mm) { cs.value = mm[1] + '*' + p.barcodes[0]; orig.call(cs, { key: 'Enter', preventDefault: function () {} }); cs.value = ''; list.classList.add('hide'); cs.focus(); } else addP(p); }; });
    };
    var hl = function () { $$('[data-i]', list).forEach(function (d) { d.classList.toggle('on', +d.dataset.i === cur); }); var o = $('[data-i].on', list); if (o) o.scrollIntoView({ block: 'nearest' }); };
    cs.oninput = show; cs.onblur = function () { setTimeout(function () { list.classList.add('hide'); }, 150); };
    cs.onkeydown = function (e) {
      if (e.key === 'ArrowDown' && hits.length) { e.preventDefault(); cur = Math.min(cur + 1, hits.length - 1); return hl(); }
      if (e.key === 'ArrowUp' && hits.length) { e.preventDefault(); cur = Math.max(cur - 1, 0); return hl(); }
      if (e.key === 'Escape') { list.classList.add('hide'); return; }
      if (e.key === 'Enter') { var v = cs.value.trim().replace(/^\d+\*/, ''); if (!Store.byBarcode(v) && hits.length && !list.classList.contains('hide')) { e.preventDefault(); var d = $('[data-i="' + cur + '"]', list); if (d) d.onmousedown(e); return; } list.classList.add('hide'); hits = []; }
      return orig.apply(this, arguments);
    };
  };
})();

/* ================= price check: search by name or barcode with suggestions ================= */
(function () {
  var pc0 = Views.pricecheck;
  Views.pricecheck = function (el) {
    var r = pc0.apply(this, arguments), inp = $('#pcIn'); if (!inp) return r; var orig = inp.onkeydown, wrap = inp.closest('.scan'); wrap.style.position = 'relative';
    inp.placeholder = L('امسحي الباركود أو اكتبي جزء من اسم الصنف', 'Scan, or type part of the name');
    var list = document.createElement('div'); list.className = 'cb-list hide pc-list'; wrap.appendChild(list); var hits = [], cur = 0;
    var pick = function (p) { list.classList.add('hide'); hits = []; inp.value = p.barcodes[0] || ''; orig.call(inp, { key: 'Enter' }); inp.value = ''; inp.focus(); };
    var show = function () {
      var q = U.norm(inp.value.trim()); if (q.length < 2 || /^\d+$/.test(q)) { list.classList.add('hide'); hits = []; return; }
      hits = Store.db.products.filter(function (p) { return p.active !== false && U.norm(pname(p) + ' ' + (p.nameEn || '') + ' ' + (p.brand || '') + ' ' + (p.shade || '') + ' ' + p.barcodes.join(' ')).indexOf(q) >= 0; }).slice(0, 10); cur = 0;
      list.innerHTML = hits.length ? hits.map(function (p, i) { var pr = (Views.pos.price || Promo.price)(p, 0); return '<div data-i="' + i + '"' + (i ? '' : ' class="on"') + '><span class="grow"><b>' + U.esc(pname(p)) + '</b>' + (p.shade ? ' <span class="muted">· ' + U.esc(p.shade) + '</span>' : '') + '</span><b class="num">' + U.money(pr.price) + '</b></div>'; }).join('') : '<div class="muted">' + L('مفيش صنف بالاسم ده', 'No product matches') + '</div>';
      list.classList.remove('hide');
      $$('[data-i]', list).forEach(function (d) { d.onmousedown = function (e) { e.preventDefault(); pick(hits[+d.dataset.i]); }; });
    };
    var hl = function () { $$('[data-i]', list).forEach(function (d) { d.classList.toggle('on', +d.dataset.i === cur); }); };
    inp.oninput = show;
    inp.onkeydown = function (e) {
      if (e.key === 'ArrowDown' && hits.length) { e.preventDefault(); cur = Math.min(cur + 1, hits.length - 1); return hl(); }
      if (e.key === 'ArrowUp' && hits.length) { e.preventDefault(); cur = Math.max(cur - 1, 0); return hl(); }
      if (e.key === 'Enter' && hits.length && !list.classList.contains('hide') && !Store.byBarcode(inp.value.trim())) { e.preventDefault(); return pick(hits[cur]); }
      list.classList.add('hide'); hits = [];
      return orig.apply(this, arguments);
    };
    return r;
  };
})();
