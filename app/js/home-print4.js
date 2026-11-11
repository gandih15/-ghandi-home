/* Ghandi Home 1.9 — the "TIBA" wholesale invoice (an exact copy of the owner's paper) + free design mode:
   drag any part of the invoice, make it bigger or smaller, and it prints exactly like that.
   Eng. Mohamed Ali — 01098811581 */
'use strict';
/* ================= the TIBA layout ================= */
DOC_TPLS.push(['tiba', 'طيبة — نسخة طبق الأصل من فاتورة الجملة', 'TIBA wholesale (exact copy)', '🏠']);
if (typeof WHOLESALE !== 'undefined') WHOLESALE.push('tiba');
var TibaDoc = {
  d8: function (t) { var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); },
  // the top: invoice details on the right, the shop (band + info + logo) on the left
  top: function (title, meta) {
    var st = S(), sh = docCfg().show, en = lang() === 'en';
    var info = [sh.slogan && st.slogan ? DK('show:slogan', U.esc(st.slogan)) : '', sh.shopAddr && st.shopAddress ? DK('show:shopAddr', U.esc(st.shopAddress)) : '', sh.tax && (st.taxNo || st.crNo) ? DK('show:tax', U.esc([st.taxNo ? L('رقم ضريبي ', 'Tax no. ') + st.taxNo : '', st.crNo ? L('سجل تجاري ', 'C.R. ') + st.crNo : ''].filter(Boolean).join(' · '))) : ''].filter(Boolean);
    var phones = sh.shopPhones && typeof ShopPhones !== 'undefined' ? ShopPhones.shown().map(function (x) { return '<div class="tb-ph"><span>' + U.esc(x.n || '') + '</span> <span dir="ltr">' + U.esc(x.p) + '</span></div>'; }).join('') : '';
    return '<table class="tb-top"><tr>' +
      '<td class="tb-r">' + (sh.title ? '<div class="tb-title">' + title + '</div>' : '') + '<table class="tb-meta">' + meta.map(function (r) { return '<tr' + (r[2] ? ' data-dk="show:' + r[2] + '"' : '') + '><td class="k">' + r[0] + '</td><td class="v">' + r[1] + '</td></tr>'; }).join('') + '</table></td>' +
      '<td class="tb-l"><div class="tb-band">' + U.esc(shopName(en)) + '</div><div class="tb-body"><div class="tb-info">' + info.map(function (x) { return '<div>' + x + '</div>'; }).join('') + (phones ? DK('show:shopPhones', '<div class="tb-phs">' + phones + '</div>') : '') + '</div>' +
      (sh.logo && st.logo ? '<div class="tb-logo">' + DK('show:logo', '<img src="' + st.logo + '">') + '</div>' : '') + '</div></td>' +
      '</tr></table>';
  },
  sale: function (s) {
    var d = docCfg(), sh = d.show, cu = H.cust(s.customer), ret = s.type === 'return';
    var code = function (i) { var p = i.pid && Store.product(i.pid); return p ? U.esc(p.code || (p.barcodes || [])[0] || '') : ''; };
    var cols = [['colNo', 'colNo'], ['colCode', 'colCode'], ['colItem'], ['colUnit', 'unit'], ['colQty'], ['colPrice', 'colPrice'], ['colTotal']];
    var rows = s.items.map(function (i, x) { var p = i.pid && Store.product(i.pid); return [x + 1, code(i), U.esc(i.name) + (i.serial ? ' <small>S/N: ' + U.esc(i.serial) + '</small>' : ''), U.esc(p ? Meas.unitName(p) : L('قطعة', 'pc')), U.r2(i.qty), U.money(i.price), U.money(i.qty * i.price)]; });
    var meta = [];
    if (sh.mNo) meta.push([DL('saleNo'), s.no, 'mNo']);
    if (sh.mType) meta.push([DL('mType'), ret ? DL('typeRet') : (U.n(s.credit) > 0 ? DL('typeCredit') : DL('typeCash')), 'mType']);
    if (sh.mDate) meta.push([DL('date'), '<span dir="ltr">' + TibaDoc.d8(s.date) + '</span>', 'mDate']);
    if (sh.mCust) meta.push([DL('to'), (cu ? U.esc(cu.name) : DL('walkin')) + (sh.mMobile && cu && cu.phone ? ' &nbsp; <span dir="ltr">' + U.esc(cu.phone) + '</span>' : ''), 'mCust']);
    if (sh.mAddr && cu && cu.address) meta.push([DL('address'), U.esc([cu.area, cu.address].filter(Boolean).join(' — ')), 'mAddr']);
    if (sh.seller) { var rep = s.rep && typeof Comm !== 'undefined' ? Comm.name(s.rep) : s.userName; meta.push([DL('seller'), U.esc(rep || ''), 'seller']); }
    meta.push([DL('notes'), U.esc(s.note || ''), 'mNotes']);
    var tr = [];
    if (sh.subtotal) tr.push([DL('subtotal'), U.money(s.subtotal), 0, 'subtotal']);
    if (s.discount && sh.discount) tr.push([DL('discount'), '- ' + U.money(s.discount), 0, 'discount']);
    if (s.vat) tr.push([L('الضريبة', 'VAT'), U.money(s.vat)]);
    if (sh.netRow) tr.push([DL('net'), U.money(s.total), 1, 'netRow']);
    if (sh.payments) { Object.keys(s.payments || {}).filter(function (k) { return U.n(s.payments[k]); }).forEach(function (k) { tr.push([pmName(k), U.money(s.payments[k]), 0, 'payments']); }); if (s.change) tr.push([DL('change'), U.money(s.change), 0, 'payments']); if (s.credit) tr.push([DL('credit'), U.money(s.credit), 0, 'payments']); }
    return '<div class="a4 tb">' + TibaDoc.top(DK('lbl:' + (ret ? 'retTitle' : 'saleTitle'), U.esc(DocLbl(ret ? 'retTitle' : 'saleTitle'))) + (s.void ? ' — ' + L('ملغاة', 'VOID') : ''), meta.filter(function (r) { return r[2] !== 'mNotes' || docCfg().show.mNotes !== false; })) +
      A4.topNote() + A4.cols(cols, rows) + A4.totals(tr, s.total) + A4.termsBlock('sale') + A4.sign(A4.sigs(cu ? cu.name : '', true)) + A4.foot();
  },
  quote: function (q) {
    var sh = docCfg().show, cu = q.customer ? H.cust(q.customer) : null, name = q.name || (cu && cu.name) || '';
    var cols = [['colNo', 'colNo'], ['colCode', 'colCode'], ['colItem'], ['colUnit', 'unit'], ['colQty'], ['colPrice', 'colPrice'], ['colTotal']];
    var rows = q.items.map(function (i, x) { var p = i.pid && Store.product(i.pid); return [x + 1, p ? U.esc(p.code || (p.barcodes || [])[0] || '') : '', U.esc(i.name), U.esc(p ? Meas.unitName(p) : L('قطعة', 'pc')), U.r2(i.qty), U.money(i.price), U.money(i.qty * i.price)]; });
    var meta = []; if (sh.mNo) meta.push([DL('quoteNo'), q.no, 'mNo']); if (sh.mDate) meta.push([DL('date'), '<span dir="ltr">' + TibaDoc.d8(q.date) + '</span>', 'mDate']); if (sh.mCust) meta.push([DL('to'), U.esc(name || '—') + (sh.mMobile && (q.phone || (cu && cu.phone)) ? ' &nbsp; <span dir="ltr">' + U.esc(q.phone || cu.phone) + '</span>' : ''), 'mCust']); meta.push([DL('valid'), q.valid || '—']); if (sh.seller) meta.push([DL('by'), U.esc(q.by), 'seller']);
    var tr = []; if (sh.subtotal) tr.push([DL('subtotal'), U.money(q.sub), 0, 'subtotal']); if (q.disc && sh.discount) tr.push([DL('discount'), '- ' + U.money(q.disc), 0, 'discount']); if (q.vat) tr.push([L('الضريبة', 'VAT'), U.money(q.vat)]); if (sh.netRow) tr.push([DL('net'), U.money(q.total), 1, 'netRow']);
    return '<div class="a4 tb">' + TibaDoc.top(DK('lbl:quoteTitle', U.esc(DocLbl('quoteTitle'))), meta) + A4.topNote() + A4.cols(cols, rows) + A4.totals(tr, q.total) + (q.note ? '<div class="terms">' + U.esc(q.note) + '</div>' : '') + A4.termsBlock('quote') + A4.sign(A4.sigs(name, false)) + A4.foot();
  },
  css: function () {
    return '.tb{font-family:Tahoma,Arial,sans-serif;font-size:12.5px;color:#111}.tb .a4h,.tb>.meta{display:none}' +
      '.tb-top{width:100%;border-collapse:collapse;margin:0 0 8px}.tb-top>tbody>tr>td{vertical-align:top;padding:0}.tb-r{width:48%;padding-inline-end:24px!important}.tb-l{width:52%}' +
      '.tb-title{font-size:21px;font-weight:800;margin:0 0 4px}' +
      '.tb-meta{border-collapse:collapse}.tb-meta td{padding:1.5px 0;font-size:13px;font-weight:700;vertical-align:top}.tb-meta td.k{min-width:108px;white-space:nowrap}.tb-meta td.v{padding-inline-start:26px!important}' +
      '.tb-band{background:#d4d4d4;font-weight:800;font-size:18px;padding:6px 12px;line-height:1.3}' +
      '.tb-body{display:flex;gap:12px;align-items:flex-start;margin-top:8px}.tb-info{flex:1;font-weight:700;font-size:12.5px;line-height:1.85}.tb-phs{margin-top:8px}.tb-ph span:first-child{min-width:70px;display:inline-block}' +
      '.tb-logo{flex:none}.tb-logo img{display:block;max-height:86px;max-width:160px}' +
      '.tb table.g{border-collapse:collapse;border:1px solid #444;margin:4px 0}.tb table.g th{background:#cfcfcf!important;color:#111!important;border:1px solid #444;padding:4px 4px;font-size:12px;font-weight:700}' +
      '.tb table.g td{border:1px solid #444;padding:3px 6px;font-size:13px;background:#fff!important}.tb table.g td.l{font-weight:400}.tb table.g td:first-child,.tb table.g th:first-child{width:26px}' +
      '.tb .tot{margin-top:6px}.tb .tot .box{border:1px solid #444;border-radius:0}.tb .tot .box div{border-bottom:1px solid #444;font-weight:700}.tb .tot .box .big{background:#cfcfcf!important;color:#111!important}' +
      '.tb .words{border:1px solid #444;border-radius:0;background:#fff}.tb .terms{border-top:1px solid #444}.tb .sign div{border-top:1px solid #444}';
  }
};
(function () {
  var inv = A4.invoice;
  A4.invoice = function (s) { return (docCfg().tpl.sale === 'tiba') ? TibaDoc.sale(s) : inv.apply(this, arguments); };
  var qh = Quote.html;
  Quote.html = function (q) { return (docCfg().tpl.quote === 'tiba') ? TibaDoc.quote(q) : qh.apply(this, arguments); };
  var tc = A4.tplCss;
  A4.tplCss = function (tpl) { return tpl === 'tiba' ? TibaDoc.css() : tc.apply(this, arguments); };
  // labels used by this layout
  var dc = docCfg;
  docCfg = function () { var d = dc.apply(this, arguments); if (d.lbl.notes === undefined) d.lbl.notes = 'ملاحظات'; if (d.show.mNotes === undefined) d.show.mNotes = true; return d; };
})();

/* ================= free design: drag / grow / shrink any part ================= */
var FREE_PARTS = [
  ['.tb-title', 'عنوان الفاتورة'], ['.tb-meta', 'بيانات الفاتورة'], ['.tb-band', 'شريط اسم المحل'], ['.tb-info', 'بيانات المحل'], ['.tb-phs', 'الأرقام'], ['.tb-logo', 'اللوجو'],
  ['.a4h .shop img', 'اللوجو'], ['.a4h h1', 'اسم المحل'], ['.a4h .sm', 'بيانات المحل'], ['.a4t', 'عنوان الفاتورة'], ['.a4 > .meta', 'بيانات الفاتورة'],
  ['table.g', 'جدول الأصناف'], ['.tot .box', 'الإجماليات'], ['.words', 'المبلغ بالحروف'], ['.terms', 'الشروط'], ['.sign', 'التوقيعات'], ['.ft', 'سطر الطباعة']
];
var DocFree = {
  on: false,
  key: function (d, kind) { kind = kind || A4.kindNow || 'other'; return kind + ':' + ((d.tpl || {})[kind] || 'classic'); },
  map: function (d, kind) { d.free = d.free || {}; var k = DocFree.key(d, kind); return d.free[k] = d.free[k] || {}; },
  tf: function (o) { return 'translate(' + (U.n(o.x) || 0) + 'px,' + (U.n(o.y) || 0) + 'px) scale(' + (U.n(o.s) || 1) + ')'; },
  css: function () { var d = docCfg(), m = (d.free || {})[DocFree.key(d)] || {}; return Object.keys(m).map(function (sel) { var o = m[sel]; return sel + '{transform:' + DocFree.tf(o) + ';transform-origin:center top;position:relative;z-index:2}'; }).join(''); },
  part: function (el) { for (var n = el; n && n.nodeType === 1; n = n.parentElement) { for (var i = 0; i < FREE_PARTS.length; i++) { try { if (n.matches(FREE_PARTS[i][0])) return { el: n, sel: FREE_PARTS[i][0], name: FREE_PARTS[i][1] }; } catch (e) { } } } return null; },
  // live editor iframe: grab a part with the mouse and move it; wheel = bigger / smaller
  attach: function (frame, w, kind, cur) {
    var doc = frame.contentDocument; if (!doc || !DocFree.on) return;
    var st = doc.createElement('style'); st.textContent = '*{cursor:move!important}[data-dk]:hover{outline:none!important;background:transparent!important}.fx-sel{outline:2px dashed #2563eb!important;outline-offset:3px}.fx-hov{outline:1.5px dashed #94a3b8;outline-offset:2px}'; doc.head.appendChild(st);
    var map = DocFree.map(w, kind), drag = null, sel = DocFree.sel && doc.querySelector(DocFree.sel);
    if (sel) sel.classList.add('fx-sel');
    var ratio = function (el, o) { var r = el.getBoundingClientRect(); return r.width / (el.offsetWidth * (U.n(o.s) || 1)) || 1; };
    doc.addEventListener('mouseover', function (e) { var p = DocFree.part(e.target); $$('.fx-hov', doc.body).forEach(function (x) { x.classList.remove('fx-hov'); }); if (p) p.el.classList.add('fx-hov'); }, true);
    doc.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); }, true);
    doc.addEventListener('mousedown', function (e) {
      var p = DocFree.part(e.target); if (!p) return; e.preventDefault(); e.stopPropagation();
      $$('.fx-sel', doc.body).forEach(function (x) { x.classList.remove('fx-sel'); }); p.el.classList.add('fx-sel');
      DocFree.sel = p.sel; DocFree.selName = p.name; if (cur && cur.onSel) cur.onSel();
      var o = map[p.sel] = map[p.sel] || { x: 0, y: 0, s: 1 };
      drag = { p: p, o: o, x0: e.clientX, y0: e.clientY, ox: o.x, oy: o.y, r: ratio(p.el, o) };
    }, true);
    doc.addEventListener('mousemove', function (e) { if (!drag) return; drag.o.x = Math.round(drag.ox + (e.clientX - drag.x0) / drag.r); drag.o.y = Math.round(drag.oy + (e.clientY - drag.y0) / drag.r); drag.p.el.style.transform = DocFree.tf(drag.o); drag.p.el.style.transformOrigin = 'center top'; }, true);
    var up = function () { if (!drag) return; drag = null; if (cur) cur.draw(); };
    doc.addEventListener('mouseup', up, true); doc.addEventListener('mouseleave', up, true);
    doc.addEventListener('wheel', function (e) {
      var p = DocFree.part(e.target); if (!p || p.sel !== DocFree.sel) return; e.preventDefault();
      var o = map[p.sel] = map[p.sel] || { x: 0, y: 0, s: 1 }; o.s = Math.max(0.3, Math.min(3, Math.round(((U.n(o.s) || 1) + (e.deltaY < 0 ? 0.05 : -0.05)) * 100) / 100));
      p.el.style.transform = DocFree.tf(o); clearTimeout(DocFree.t); DocFree.t = setTimeout(function () { if (cur) cur.draw(); if (cur && cur.onSel) cur.onSel(); }, 350);
    }, { passive: false, capture: true });
  }
};
(function () {
  // the free layout prints exactly like the editor shows it
  var css = A4.css; A4.css = function () { return css.apply(this, arguments) + DocFree.css(); };
  var rnd = DocLive.render;
  DocLive.render = function (frame, kind, w, onPick) {
    var r = rnd.apply(this, arguments), ol = frame.onload, cur = DocSet.cur;
    frame.onload = function () { if (ol) ol.apply(this, arguments); try { DocFree.attach(frame, w, kind, cur); } catch (e) { console.error(e); } };
    return r;
  };
  var ext = DocSet.extend;
  DocSet.extend = function (cur) {
    ext.apply(this, arguments);
    var m = cur.m, w = cur.w, col = $('.grid > .col', m); if (!col) return;
    var c = document.createElement('div'); c.className = 'card col'; c.style.padding = '10px';
    c.innerHTML = '<label class="row"><input type="checkbox" class="sw" id="fxOn"' + (DocFree.on ? ' checked' : '') + '> <b>✋ ' + L('تصميم حر — حرّك وكبّر وصغّر أي حاجة في الفاتورة', 'Free design — move & resize anything') + '</b></label>' +
      '<div id="fxBox" class="col" style="gap:6px"><div class="muted small">' + L('شغّله وبعدين امسك أي جزء في الورقة بالماوس وحرّكه. بكرة الماوس على الجزء المختار = تكبير / تصغير. كل تصميم ليه شكله الحر لوحده.', 'Turn it on, then drag any part on the page. Mouse wheel on the selected part = bigger / smaller. Each design keeps its own layout.') + '</div>' +
      '<div class="row wrap" style="gap:6px;align-items:center"><span class="chip" id="fxName">—</span><button class="btn sm" id="fxP">➕ ' + L('كبّر', 'Bigger') + '</button><button class="btn sm" id="fxM">➖ ' + L('صغّر', 'Smaller') + '</button>' +
      ['↑', '↓', '→', '←'].map(function (a, i) { return '<button class="btn sm ghost" data-fxa="' + i + '">' + a + '</button>'; }).join('') + '<button class="btn sm" id="fxR">↺ ' + L('رجّعه مكانه', 'Reset part') + '</button><button class="btn sm" id="fxRA" style="color:var(--bad)">↺ ' + L('رجّع الكل', 'Reset all') + '</button></div></div>';
    var first = col.firstElementChild; col.insertBefore(c, first ? first.nextSibling : null);
    var kind = function () { return cur.kind(); };
    var curO = function (mk) { var mp = DocFree.map(w, kind()); if (!DocFree.sel) return null; if (!mp[DocFree.sel] && mk) mp[DocFree.sel] = { x: 0, y: 0, s: 1 }; return mp[DocFree.sel]; };
    cur.onSel = function () { var o = curO(); $('#fxName', c).textContent = DocFree.sel ? (DocFree.selName || DocFree.sel) + (o ? ' · ' + Math.round((U.n(o.s) || 1) * 100) + '%' : '') : '—'; };
    var paint = function () { $('#fxBox', c).style.display = DocFree.on ? '' : 'none'; };
    $('#fxOn', c).onchange = function () { DocFree.on = this.checked; paint(); cur.draw(); };
    var bump = function (f) { var o = curO(true); if (!o) return toast(L('دوس على جزء في الورقة الأول', 'Select a part on the page first'), 'bad'); f(o); cur.onSel(); cur.draw(); };
    $('#fxP', c).onclick = function () { bump(function (o) { o.s = Math.min(3, Math.round(((U.n(o.s) || 1) + 0.05) * 100) / 100); }); };
    $('#fxM', c).onclick = function () { bump(function (o) { o.s = Math.max(0.3, Math.round(((U.n(o.s) || 1) - 0.05) * 100) / 100); }); };
    $$('[data-fxa]', c).forEach(function (b) { b.onclick = function () { var i = +b.dataset.fxa; bump(function (o) { if (i === 0) o.y -= 4; if (i === 1) o.y += 4; if (i === 2) o.x += 4; if (i === 3) o.x -= 4; }); }; });
    $('#fxR', c).onclick = function () { var mp = DocFree.map(w, kind()); if (DocFree.sel) delete mp[DocFree.sel]; cur.onSel(); cur.draw(); };
    $('#fxRA', c).onclick = function () { Modal.confirm(L('ترجّع كل الأجزاء لمكانها الأصلي في التصميم ده؟', 'Reset every part of this design?'), function () { w.free = w.free || {}; delete w.free[DocFree.key(w, kind())]; DocFree.sel = null; cur.onSel(); cur.draw(); }); };
    paint(); cur.onSel();
  };
})();
