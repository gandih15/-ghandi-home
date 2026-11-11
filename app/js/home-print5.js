/* Ghandi Home 1.9.1 — free text on the invoice: write any sentence and drag it anywhere on the page.
   Eng. Mohamed Ali — 01098811581 */
'use strict';
var DocTxt = {
  list: function (d, kind) { d.texts = d.texts || {}; var k = DocFree.key(d, kind); return d.texts[k] = d.texts[k] || []; },
  html: function () {
    var d = docCfg(), kind = A4.kindNow; if (kind !== 'sale' && kind !== 'quote') return '';
    var a = ((d.texts || {})[DocFree.key(d, kind)] || []).filter(function (x) { return x.on !== false && String(x.t || '').trim(); });
    return a.map(function (x) { return '<div class="ftx" data-tx="' + x.id + '" style="left:' + (U.n(x.x) || 0) + 'px;top:' + (U.n(x.y) || 0) + 'px;font-size:' + (U.n(x.size) || 14) + 'px;font-weight:' + (x.bold ? 800 : 400) + ';color:' + (x.color || '#111') + (x.box ? ';border:1.5px solid ' + (x.color || '#111') + ';padding:3px 10px;border-radius:6px' : '') + '">' + U.esc(x.t).replace(/\n/g, '<br>') + '</div>'; }).join('');
  },
  inject: function (h) { var t = DocTxt.html(); if (!t) return h; var i = h.indexOf('<div class="a4'); if (i < 0) return h; var j = h.indexOf('>', i); return h.slice(0, j + 1) + t + h.slice(j + 1); },
  edit: function (x, done, del) {
    var m = Modal.open({ title: '✍️ ' + L('جملة على الفاتورة', 'Text on the invoice'), body: '<div class="col"><textarea class="in" id="txT" rows="2" style="font-size:16px">' + U.esc(x.t || '') + '</textarea>' +
      '<div class="grid g3"><label class="f">' + L('الحجم', 'Size') + '<input class="in num" type="number" id="txS" min="8" max="60" value="' + (U.n(x.size) || 14) + '"></label><label class="f">' + L('اللون', 'Colour') + '<input class="in" type="color" id="txC" value="' + (x.color || '#111111') + '" style="height:38px;padding:3px"></label><div class="col" style="gap:4px;justify-content:end"><label class="row small"><input type="checkbox" id="txB"' + (x.bold ? ' checked' : '') + '> ' + L('عريض', 'Bold') + '</label><label class="row small"><input type="checkbox" id="txX"' + (x.box ? ' checked' : '') + '> ' + L('في إطار', 'Boxed') + '</label></div></div>' +
      '<div class="muted small">' + L('بعد ما تحفظ: امسك الجملة في الورقة بالماوس وحطها في أي مكان.', 'Then drag the text anywhere on the page.') + '</div></div>',
      foot: (del ? '<button class="btn" id="txD" style="color:var(--bad)">🗑️ ' + L('مسح', 'Delete') + '</button>' : '') + '<button class="btn pri" id="txOk">✔️ ' + L('تمام', 'OK') + '</button>' });
    $('#txT', m).focus();
    $('#txOk', m).onclick = function () { var t = $('#txT', m).value.trim(); if (!t) return toast(L('اكتب الجملة', 'Type the text'), 'bad'); x.t = t; x.size = Math.max(8, Math.min(60, U.n($('#txS', m).value) || 14)); x.color = $('#txC', m).value; x.bold = $('#txB', m).checked; x.box = $('#txX', m).checked; Modal.close(m); done(); };
    if (del) $('#txD', m).onclick = function () { Modal.close(m); del(); };
  },
  // live editor: drag a sentence; a click without moving opens it for editing
  attach: function (frame, w, kind, cur) {
    var doc = frame.contentDocument; if (!doc) return;
    var st = doc.createElement('style'); st.textContent = '.ftx{cursor:move!important;outline:1.5px dashed rgba(37,99,235,.55);outline-offset:2px}.ftx:hover{outline-color:#2563eb;background:rgba(37,99,235,.06)}'; doc.head.appendChild(st);
    var list = DocTxt.list(w, kind), drag = null;
    doc.addEventListener('mousedown', function (e) {
      var el = e.target.closest && e.target.closest('.ftx'); if (!el) return; e.preventDefault(); e.stopPropagation();
      var x = list.filter(function (o) { return o.id === el.dataset.tx; })[0]; if (!x) return;
      var r = el.getBoundingClientRect(), ratio = r.width / el.offsetWidth || 1;
      drag = { el: el, x: x, x0: e.clientX, y0: e.clientY, ox: U.n(x.x), oy: U.n(x.y), r: ratio, moved: false };
    }, true);
    doc.addEventListener('mousemove', function (e) { if (!drag) return; var dx = (e.clientX - drag.x0) / drag.r, dy = (e.clientY - drag.y0) / drag.r; if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true; drag.x.x = Math.round(drag.ox + dx); drag.x.y = Math.round(drag.oy + dy); drag.el.style.left = drag.x.x + 'px'; drag.el.style.top = drag.x.y + 'px'; }, true);
    var up = function () { if (!drag) return; var d = drag; drag = null; if (!d.moved) { d.x.x = d.ox; d.x.y = d.oy; DocTxt.edit(d.x, function () { cur.draw(); if (cur.drawTx) cur.drawTx(); }, function () { var i = list.indexOf(d.x); if (i >= 0) list.splice(i, 1); cur.draw(); if (cur.drawTx) cur.drawTx(); }); } else cur.draw(); };
    doc.addEventListener('mouseup', up, true);
    doc.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.ftx')) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
};
(function () {
  var css = A4.css; A4.css = function () { return css.apply(this, arguments) + '.a4{position:relative;overflow:hidden}.ftx{position:absolute;z-index:5;white-space:nowrap;line-height:1.4}'; };
  var inv = A4.invoice; A4.invoice = function () { return DocTxt.inject(inv.apply(this, arguments)); };
  var qh = Quote.html; Quote.html = function () { return DocTxt.inject(qh.apply(this, arguments)); };
  var rnd = DocLive.render;
  DocLive.render = function (frame, kind, w, onPick) {
    var r = rnd.apply(this, arguments), ol = frame.onload, cur = DocSet.cur;
    frame.onload = function () { if (ol) ol.apply(this, arguments); try { DocTxt.attach(frame, w, kind, cur); } catch (e) { console.error(e); } };
    return r;
  };
  var ext = DocSet.extend;
  DocSet.extend = function (cur) {
    ext.apply(this, arguments);
    var m = cur.m, w = cur.w, col = $('.grid > .col', m); if (!col) return;
    var c = document.createElement('div'); c.className = 'card col'; c.style.padding = '10px';
    c.innerHTML = '<b>✍️ ' + L('جمل حرة على الفاتورة', 'Free text on the invoice') + '</b><div class="row" style="gap:6px"><input class="in grow" id="txNew" placeholder="' + L('مثلاً: البيع بسعر الجملة', 'e.g. Wholesale prices') + '"><button class="btn pri" id="txAdd">➕ ' + L('ضيف', 'Add') + '</button></div><div id="txL" class="col" style="gap:4px"></div><div class="muted small">' + L('الجملة بتتحط تحت عنوان الفاتورة — امسكها بالماوس في الورقة وحطها في أي مكان، ودوسة عليها تعدّلها. كل تصميم ليه جمله لوحده.', 'New text goes under the title — drag it anywhere; click it to edit. Each design keeps its own texts.') + '</div>';
    var tdCard = $('#tdCard', m); var anchor = tdCard && tdCard.parentNode === col ? tdCard : col.firstElementChild; col.insertBefore(c, anchor ? anchor.nextSibling : null);
    var list = function () { return DocTxt.list(w, cur.kind()); };
    var drawTx = cur.drawTx = function () {
      var a = list(), box = $('#txL', c);
      box.innerHTML = a.map(function (x, i) { return '<div class="row" style="gap:6px"><input type="checkbox" data-txo="' + i + '"' + (x.on !== false ? ' checked' : '') + ' title="' + L('يظهر', 'Show') + '"><span class="grow small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + U.esc(x.t) + '</span><button class="btn sm ghost" data-txe="' + i + '">✏️</button><button class="btn sm ghost" data-txd="' + i + '" style="color:var(--bad)">✕</button></div>'; }).join('');
      $$('[data-txo]', box).forEach(function (i) { i.onchange = function () { a[+i.dataset.txo].on = i.checked; cur.draw(); }; });
      $$('[data-txe]', box).forEach(function (b) { b.onclick = function () { DocTxt.edit(a[+b.dataset.txe], function () { cur.draw(); drawTx(); }); }; });
      $$('[data-txd]', box).forEach(function (b) { b.onclick = function () { a.splice(+b.dataset.txd, 1); cur.draw(); drawTx(); }; });
    };
    // place new text right under the document title
    var spot = function () {
      try {
        var doc = $('#lvF2', m).contentDocument, a4 = doc.querySelector('.a4'), t = doc.querySelector('.tb-title') || doc.querySelector('.a4t');
        if (a4 && t) { var ra = a4.getBoundingClientRect(), rt = t.getBoundingClientRect(), k = ra.width / a4.offsetWidth || 1; return { x: Math.round((rt.left - ra.left) / k), y: Math.round((rt.bottom - ra.top) / k + 4) }; }
      } catch (e) { }
      return { x: 40, y: 90 };
    };
    var add = function () { var i = $('#txNew', c), t = i.value.trim(); if (!t) return toast(L('اكتب الجملة الأول', 'Type the text first'), 'bad'); var p = spot(); list().push({ id: U.id(), t: t, x: p.x, y: p.y, size: 14, bold: true, color: '#111111', on: true }); i.value = ''; cur.draw(); drawTx(); toast('✍️ ' + L('اتضافت — امسكها في الورقة وحركها لأي مكان', 'Added — drag it anywhere'), 'ok'); };
    $('#txAdd', c).onclick = add; $('#txNew', c).onkeydown = function (e) { if (e.key === 'Enter') add(); };
    $$('#lvK [data-k]', m).forEach(function (b) { b.addEventListener('click', function () { setTimeout(drawTx, 0); }); });
    var tsel = $('#lvT', m); if (tsel) tsel.addEventListener('change', function () { setTimeout(drawTx, 0); });
    drawTx();
  };
})();
/* one click: content fills the sheet (small safe margin the printer can still print) */
(function () {
  var ext = DocSet.extend;
  DocSet.extend = function (cur) {
    ext.apply(this, arguments);
    var mi = $('#lvM', cur.m); if (!mi || $('#lvFit', cur.m)) return;
    var b = document.createElement('button'); b.className = 'btn sm'; b.id = 'lvFit'; b.style.marginTop = '6px'; b.textContent = '📐 ' + L('على قد الورقة بالظبط', 'Fill the sheet');
    b.title = L('هامش 4 مم بس — أقل من كده أغلب الطابعات بتقص الأطراف', '4 mm margin — most printers cut anything closer');
    b.onclick = function () { cur.w.margin = 4; mi.value = 4; cur.draw(); toast('📐 ' + L('الفاتورة بقت على قد الورقة', 'Now fills the sheet'), 'ok'); };
    var lab = mi.closest('label'); (lab && lab.parentNode ? lab.parentNode.parentNode : mi.parentNode).insertBefore(b, lab ? lab.parentNode.nextSibling : null);
  };
})();
