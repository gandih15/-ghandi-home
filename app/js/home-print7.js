/* Ghandi Home 1.9.5 — full control of the printed sheet: print scale %, each margin on its own,
   content width and position (right / centre / left). Eng. Mohamed Ali — 01098811581 */
'use strict';
/* ink darkness: 1 light (saves ink) · 2 lighter · 3 normal · 4 dark · 5 darkest — text stays sharp (no image filters) */
var DocInk = {
  LV: [['فاتح', 'Light'], ['أفتح شوية', 'Lighter'], ['عادي', 'Normal'], ['غامق', 'Dark'], ['غامق جداً', 'Darkest']],
  css: function (lv, root) {
    lv = U.n(lv) || 3; var r = root || 'body';
    if (lv === 3) return '';
    if (lv < 3) return r + '{opacity:' + (lv === 1 ? 0.62 : 0.8) + '}';
    var st = lv === 4 ? 0.28 : 0.55;
    return r + ',' + r + ' *{-webkit-text-stroke:' + st + 'px currentColor}' + r + ' .muted,' + r + ' .sm,' + r + ' small,' + r + ' .ft,' + r + ' .terms,' + r + ' .meta,' + r + ' td,' + r + ' .tb-info{color:#000!important}' + (lv === 5 ? r + ' table.g td,' + r + ' table.g th,' + r + ' .tot .box,' + r + ' .tot .box div,' + r + ' .meta,' + r + ' .words{border-color:#000!important}' : '');
  }
};
function docPage() {
  var d = docCfg(); d.page = d.page || {}; var p = d.page, m = String(d.margin) === '0' ? 0 : (U.n(d.margin) || 10);
  ['t', 'r', 'b', 'l'].forEach(function (k) { if (p[k] === undefined) p[k] = m; });
  if (p.scale === undefined) p.scale = 100; if (p.width === undefined) p.width = 100; if (!p.align) p.align = 'center'; if (p.ink === undefined) p.ink = 3;
  return p;
}
(function () {
  var mm = function (v) { return (U.n(v) || 0) + 'mm'; };
  var css = A4.css;
  A4.css = function () {
    var c = css.apply(this, arguments), p = docPage(), d = docCfg(), size = { A4: 'A4', A5: 'A5', Letter: 'letter' }[d.paper] || 'A4';
    // text size: every font size is multiplied (no CSS zoom — the Windows app's engine prints zoomed pages smaller)
    var fz = Math.max(50, Math.min(220, U.n(d.font) || 100)) / 100;
    if (fz !== 1) c = c.replace(/font-size:\s*([\d.]+)px/g, function (m, n) { return 'font-size:' + (parseFloat(n) * fz).toFixed(1) + 'px'; });
    c = c.replace(/@page\{[^}]*\}/, '@page{size:' + size + ';margin:' + mm(p.t) + ' ' + mm(p.r) + ' ' + mm(p.b) + ' ' + mm(p.l) + '}');
    var w = Math.max(40, Math.min(100, U.n(p.width) || 100)), al = p.align === 'right' ? 'margin-left:auto!important;margin-right:0!important' : p.align === 'left' ? 'margin-left:0!important;margin-right:auto!important' : 'margin-left:auto!important;margin-right:auto!important';
    var s = Math.max(25, Math.min(400, U.n(p.scale) || 100)) / 100;
    c += DocInk.css(p.ink, '.a4');
    return c + (w < 100 || p.align !== 'center' ? '.a4{width:' + w + '%!important;' + al + '}' : '') +
      // on screen (previews) show the sheet exactly as the printer will: its own margins, and the print scale
      '@media screen{body{padding:' + mm(p.t) + ' ' + mm(p.r) + ' ' + mm(p.b) + ' ' + mm(p.l) + '!important}' + (s !== 1 ? 'body>.a4{transform:scale(' + s + ');transform-origin:top ' + (p.align === 'left' ? 'left' : p.align === 'right' ? 'right' : 'center') + '}' : '') + '}';
  };
  // every A4 job carries the print scale to the printer
  var pp = Printer.print;
  Printer.print = function (html, opt) {
    opt = opt || {}; var a4 = /@page\{size:(A4|A5|letter)/i.test(opt.css || ''), p = docPage();
    // sales & returns printed from the POS came wrapped in an on-screen box 190mm wide + padding — wider than the
    // printable area, so the printer shrank the whole page. Print the bare invoice instead, exactly like other documents.
    if (a4 && /^\s*<div class="a4wrap"/.test(html)) html = html.replace(/^\s*<div class="a4wrap"[^>]*>(<style>[\s\S]*?<\/style>)?/, '').replace(/<\/div>\s*$/, '');
    if (a4 && !opt.scale) opt.scale = U.n(p.scale) || 100;
    if (a4) opt.forcePage = !!p.force;
    if (a4 && p.via === 'pdf' && IS_ELECTRON) {
      var doc = '<!doctype html><html dir="' + (opt.dir || 'rtl') + '"><head><meta charset="utf-8"><style>' + (opt.css || '') + '</style></head><body>' + html + '</body></html>';
      toast('📄 ' + L('بيتعمل ملف PDF وهيفتح — اطبع منه', 'Making a PDF — print it from the viewer'), 'ok');
      return IPC.invoke('printPdf', { html: doc, name: L('فاتورة', 'invoice') }).then(function (r) { if (!r.ok) toast(r.error || 'PDF error', 'bad'); });
    }
    return pp.call(this, html, opt);
  };

  var ui = function (p, onChange) {
    var c = document.createElement('div'); c.className = 'card col'; c.style.padding = '10px'; c.id = 'pgCard';
    var n = function (k, lab, min, max) { return '<label class="f">' + lab + '<input class="in num" type="number" data-pg="' + k + '" min="' + min + '" max="' + max + '" value="' + p[k] + '"></label>'; };
    var dpr = Math.round((window.devicePixelRatio || 1) * 100);
    c.innerHTML = '<b>🖨️ ' + L('مقاس الطباعة على الورق', 'The printed sheet') + '</b>' +
      '<div class="grid g2">' + n('scale', L('حجم الطباعة %', 'Print scale %'), 25, 400) + n('width', L('عرض الفاتورة %', 'Content width %'), 40, 100) + '</div>' +
      '<div class="muted small">' + L('الهوامش بالمللي:', 'Margins (mm):') + '</div><div class="grid g4">' + n('t', L('فوق', 'Top'), 0, 40) + n('r', L('يمين', 'Right'), 0, 40) + n('b', L('تحت', 'Bottom'), 0, 40) + n('l', L('شمال', 'Left'), 0, 40) + '</div>' +
      '<div class="seg" id="pgAl">' + [['right', '➡️ ' + L('يمين', 'Right')], ['center', '↔️ ' + L('في النص', 'Centre')], ['left', '⬅️ ' + L('شمال', 'Left')]].map(function (a) { return '<button data-al="' + a[0] + '" class="' + (p.align === a[0] ? 'on' : '') + '">' + a[1] + '</button>'; }).join('') + '</div>' +
      '<div class="muted small">🧭 ' + L('طريقة الطباعة', 'How to print') + '</div><div class="seg" id="pgVia"><button data-via="direct" class="' + (p.via !== 'pdf' ? 'on' : '') + '">🖨️ ' + L('على الطابعة مباشرة', 'Straight to printer') + '</button><button data-via="pdf" class="' + (p.via === 'pdf' ? 'on' : '') + '">📄 ' + L('ملف PDF وأطبع منه', 'PDF, print from viewer') + '</button></div>' +
      '<label class="row small"><input type="checkbox" id="pgForce"' + (p.force ? ' checked' : '') + '> ' + L('ابعت مقاس الورق للطابعة إجباري (سيبها مقفولة لو الطابعة متظبطة على Letter)', 'Force the paper size on the printer') + '</label>' +
      '<div class="muted small">🖋️ ' + L('درجة الحبر', 'Ink darkness') + '</div><div class="seg" id="pgInk">' + DocInk.LV.map(function (x, i) { return '<button data-ink="' + (i + 1) + '" class="' + (U.n(p.ink) === i + 1 ? 'on' : '') + '">' + L(x[0], x[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="row wrap" style="gap:6px"><button class="btn sm" id="pgFull">📐 ' + L('ملء الورقة (هامش 4)', 'Fill sheet (4 mm)') + '</button>' + (dpr > 100 ? '<button class="btn sm" id="pgDpr" title="' + L('لو الطباعة بتطلع أصغر من المعاينة', 'If prints come out smaller than the preview') + '">🖥️ ' + L('تعويض مقياس الشاشة ', 'Compensate screen scale ') + dpr + '%</button>' : '') + '<button class="btn sm ghost" id="pgRst">↺ ' + L('الافتراضي', 'Default') + '</button></div>' +
      '<div class="muted small">' + L('لو الورقة بتطلع أصغر من المعاينة: زوّد «حجم الطباعة» (مثلاً 125%). لو بتطلع مقصوصة: قلّله. «عرض الفاتورة» + يمين/نص/شمال بيحددوا مكانها على الورقة.', 'Prints smaller than the preview? Raise the print scale (e.g. 125%). Cut off? Lower it.') + '</div>';
    var warn = document.createElement('div'); warn.className = 'chip warn'; warn.style.cssText = 'display:none;white-space:normal'; c.insertBefore(warn, c.children[1]);
    var check = function () {
      var msg = [];
      if (U.n(p.width) < 100) msg.push(L('عرض الفاتورة ', 'Width ') + p.width + '% ' + L('(مش مالية الورقة)', '(not full width)'));
      if (U.n(p.scale) !== 100) msg.push(L('حجم الطباعة ', 'Scale ') + p.scale + '%');
      if (Math.abs(U.n(p.r) - U.n(p.l)) > 3) msg.push(L('الهامش اليمين ', 'Right ') + p.r + L(' والشمال ', ' vs left ') + p.l + L(' مش زي بعض', ' differ'));
      warn.style.display = msg.length ? 'block' : 'none'; warn.textContent = '⚠️ ' + msg.join(' · ') + ' — ' + L('لو الفاتورة بتطلع صغيرة أو على جنب دوس «ملء الورقة»', 'press Fill sheet if the page looks small');
    };
    var sync = function () { $$('[data-pg]', c).forEach(function (i) { i.value = p[i.dataset.pg]; }); $$('#pgAl [data-al]', c).forEach(function (b) { b.classList.toggle('on', b.dataset.al === p.align); }); check(); };
    $$('[data-pg]', c).forEach(function (i) { i.oninput = function () { if (i.value === '') return; p[i.dataset.pg] = U.n(i.value); check(); onChange(); }; });
    setTimeout(check, 0);
    $$('#pgAl [data-al]', c).forEach(function (b) { b.onclick = function () { p.align = b.dataset.al; sync(); onChange(); }; });
    $$('#pgVia [data-via]', c).forEach(function (b) { b.onclick = function () { p.via = b.dataset.via; $$('#pgVia [data-via]', c).forEach(function (x) { x.classList.toggle('on', x === b); }); onChange(); }; });
    $('#pgForce', c).onchange = function () { p.force = this.checked; onChange(); };
    $$('#pgInk [data-ink]', c).forEach(function (b) { b.onclick = function () { p.ink = +b.dataset.ink; $$('#pgInk [data-ink]', c).forEach(function (x) { x.classList.toggle('on', x === b); }); onChange(); }; });
    $('#pgFull', c).onclick = function () { p.t = p.r = p.b = p.l = 4; p.width = 100; p.align = 'center'; sync(); onChange(); };
    if ($('#pgDpr', c)) $('#pgDpr', c).onclick = function () { p.scale = dpr; sync(); onChange(); toast('🖥️ ' + L('حجم الطباعة بقى ', 'Print scale set to ') + dpr + '%', 'ok'); };
    $('#pgRst', c).onclick = function () { p.t = p.r = p.b = p.l = 10; p.scale = 100; p.width = 100; p.align = 'center'; p.ink = 3; $$('#pgInk [data-ink]', c).forEach(function (x) { x.classList.toggle('on', x.dataset.ink === '3'); }); sync(); onChange(); };
    return c;
  };
  // in the invoice editor (replaces the single margin box)
  var ext = DocSet.extend;
  DocSet.extend = function (cur) {
    ext.apply(this, arguments);
    var m = cur.m, w = cur.w, col = $('.grid > .col', m); if (!col || $('#pgCard', m)) return;
    var h = homeCfg(), keep = h.doc; h.doc = w; var p = docPage(); h.doc = keep;
    var c = ui(p, function () { cur.draw(); });
    var lm = $('#lvM', m); if (lm) { var lab = lm.closest('label'); if (lab) lab.style.display = 'none'; }
    var fit = $('#lvFit', m); if (fit) fit.style.display = 'none';
    var lvP = $('#lvP', m), anchor = lvP && lvP.closest('.card'); col.insertBefore(c, anchor ? anchor.nextSibling : null);
  };
  // in the print preview window
  var op = DocPrev.open;
  DocPrev.open = function () {
    var r = op.apply(this, arguments), m = $$('.mask').pop(); if (!m || !$('#dpF', m) || !can('settings')) return r;
    var row = $('#dpM', m) && $('#dpM', m).closest('.row'); if (row) row.style.display = 'none';
    var c = ui(docPage(), function () { Store.save(); $('#dpP', m).dispatchEvent(new Event('change')); });
    c.style.padding = '8px';
    var fs = $('#dpFs', m), host = fs && fs.closest('.grid'); if (host) host.parentNode.insertBefore(c, host.nextSibling);
    return r;
  };
})();

/* thermal receipts get the same ink control */
(function () {
  var rc = Receipt.css;
  Receipt.css = function () { var p = (docCfg().page || {}); return rc.apply(this, arguments) + DocInk.css(p.ink, 'body'); };
})();

/* ================= lock: nothing in the invoice design changes until it is unlocked ================= */
var DocLock = {
  on: function () { return !!homeCfg().docLock; },
  set: function (v) { homeCfg().docLock = !!v; Store.log('doc.lock', String(!!v)); Store.save(); },
  freeze: function (root, keep) {
    var on = DocLock.on();
    $$('input,select,textarea,button', root).forEach(function (x) {
      if (keep && keep.some(function (k) { return k && (k === x || k.contains(x)); })) return;
      if (on) { if (!x.disabled) { x.disabled = true; x.dataset.lk = '1'; } }
      else if (x.dataset.lk) { x.disabled = false; delete x.dataset.lk; }
    });
  }
};
(function () {
  // the live preview ignores clicks / drags while locked
  var rnd = DocLive.render;
  DocLive.render = function (frame) {
    var r = rnd.apply(this, arguments), ol = frame.onload;
    frame.onload = function () {
      if (ol) ol.apply(this, arguments);
      try { var win = frame.contentWindow, doc = frame.contentDocument; if (!DocLock.on()) return;
        ['click', 'mousedown', 'wheel', 'dblclick'].forEach(function (t) { win.addEventListener(t, function (e) { if (DocLock.on()) { e.preventDefault(); e.stopImmediatePropagation(); } }, { capture: true, passive: false }); });
        var st = doc.createElement('style'); st.textContent = '*{cursor:not-allowed!important}[data-dk]:hover,.ftx{outline:none!important;background:transparent!important}'; doc.head.appendChild(st);
      } catch (e) { }
    };
    return r;
  };
  var ext = DocSet.extend;
  DocSet.extend = function (cur) {
    ext.apply(this, arguments);
    var m = cur.m, col = $('.grid > .col', m); if (!col || $('#lkCard', m)) return;
    var c = document.createElement('div'); c.className = 'card col'; c.id = 'lkCard'; c.style.padding = '10px';
    var test = [$('#lvTest', m), $('#tdCard', m), $('#lvK', m)];
    var paint = function () {
      var on = DocLock.on();
      c.innerHTML = '<label class="row"><input type="checkbox" class="sw" id="lkOn"' + (on ? ' checked' : '') + '> <b>' + (on ? '🔒 ' + L('إعدادات الفاتورة مقفولة', 'Invoice settings are locked') : '🔓 ' + L('قفل إعدادات الفاتورة', 'Lock the invoice settings')) + '</b></label><div class="muted small">' + (on ? L('مفيش حاجة هتتغير لحد ما تفتح القفل — تقدر تتفرج وتطبع تجريبي بس.', 'Nothing can change until you unlock — you can still look and test-print.') : L('بعد ما تظبط كل حاجة اقفلها عشان محدش يغيّر حاجة بالغلط.', 'Lock it once everything is right so nothing changes by mistake.')) + '</div>';
      c.style.borderColor = on ? 'var(--ok)' : ''; c.style.background = on ? 'rgba(22,163,74,.07)' : '';
      $('#lkOn', c).onchange = function () {
        var v = this.checked;
        if (!v) { this.checked = true; return Modal.confirm('🔓 ' + L('تفتح القفل وتسمح بتغيير إعدادات الفاتورة؟', 'Unlock and allow changes?'), function () { DocLock.set(false); apply(); }); }
        DocLock.set(true); apply(); toast('🔒 ' + L('اتقفلت — مفيش حاجة هتتغير بالغلط', 'Locked'), 'ok');
      };
    };
    var apply = function () {
      paint();
      DocLock.freeze(col, [c].concat(test));
      var bar = $('#lvR', m) && $('#lvR', m).parentNode; if (bar) DocLock.freeze(bar, test);
      var pagebar = $('#ipaper') && $('#ipaper').closest('.card'); if (pagebar) DocLock.freeze(pagebar, []);
      cur.draw();
    };
    col.appendChild(c);
    setTimeout(apply, 0);
  };
  // print preview window: look and print, but no changes while locked
  var op = DocPrev.open;
  DocPrev.open = function () {
    var r = op.apply(this, arguments), m = $$('.mask').pop(); if (!m || !$('#dpF', m) || !DocLock.on()) return r;
    var side = $('#dpT', m) && $('#dpT', m).closest('.col'); if (side) { DocLock.freeze(side, [$('#dpSet', m)]); var n = document.createElement('div'); n.className = 'chip ok'; n.style.cssText = 'display:block;white-space:normal'; n.textContent = '🔒 ' + L('إعدادات الفاتورة مقفولة — بتتطبع زي ما هي. تفتح القفل من صفحة تصميم الفاتورة.', 'Invoice settings are locked — printing as saved.'); side.insertBefore(n, side.firstChild); }
    return r;
  };
})();
/* one-off: print this document through a PDF from the preview window */
(function () {
  var op = DocPrev.open;
  DocPrev.open = function () {
    var r = op.apply(this, arguments), m = $$('.mask').pop(), go2 = m && $('#dpGo', m); if (!go2 || $('#dpPdf', m)) return r;
    var b = document.createElement('button'); b.className = 'btn'; b.id = 'dpPdf'; b.textContent = '📄 ' + L('PDF واطبع منه', 'PDF & print from it');
    b.title = L('بيعمل ملف PDF بالمقاس المظبوط ويفتحه — اطبع منه بـ «Fit to printable area» زي المتصفح', 'Makes an exact PDF and opens it');
    b.onclick = function () { if (!IS_ELECTRON) return toast(L('متاح في برنامج الويندوز', 'Windows app only'), 'bad'); var p = docPage(), v = p.via; p.via = 'pdf'; try { go2.click(); } finally { p.via = v; } };
    go2.parentNode.insertBefore(b, go2);
    return r;
  };
})();
