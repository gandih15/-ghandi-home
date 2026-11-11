/* Ghandi Home 1.9.5 — full control of the printed sheet: print scale %, each margin on its own,
   content width and position (right / centre / left). Eng. Mohamed Ali — 01098811581 */
'use strict';
function docPage() {
  var d = docCfg(); d.page = d.page || {}; var p = d.page, m = String(d.margin) === '0' ? 0 : (U.n(d.margin) || 10);
  ['t', 'r', 'b', 'l'].forEach(function (k) { if (p[k] === undefined) p[k] = m; });
  if (p.scale === undefined) p.scale = 100; if (p.width === undefined) p.width = 100; if (!p.align) p.align = 'center';
  return p;
}
(function () {
  var mm = function (v) { return (U.n(v) || 0) + 'mm'; };
  var css = A4.css;
  A4.css = function () {
    var c = css.apply(this, arguments), p = docPage(), d = docCfg(), size = { A4: 'A4', A5: 'A5', Letter: 'letter' }[d.paper] || 'A4';
    c = c.replace(/@page\{[^}]*\}/, '@page{size:' + size + ';margin:' + mm(p.t) + ' ' + mm(p.r) + ' ' + mm(p.b) + ' ' + mm(p.l) + '}');
    var w = Math.max(40, Math.min(100, U.n(p.width) || 100)), al = p.align === 'right' ? 'margin-left:auto!important;margin-right:0!important' : p.align === 'left' ? 'margin-left:0!important;margin-right:auto!important' : 'margin-left:auto!important;margin-right:auto!important';
    var s = Math.max(25, Math.min(400, U.n(p.scale) || 100)) / 100;
    return c + (w < 100 || p.align !== 'center' ? '.a4{width:' + w + '%!important;' + al + '}' : '') +
      // on screen (previews) show the sheet exactly as the printer will: its own margins, and the print scale
      '@media screen{body{padding:' + mm(p.t) + ' ' + mm(p.r) + ' ' + mm(p.b) + ' ' + mm(p.l) + '!important}' + (s !== 1 ? 'body>.a4{transform:scale(' + s + ');transform-origin:top ' + (p.align === 'left' ? 'left' : p.align === 'right' ? 'right' : 'center') + '}' : '') + '}';
  };
  // every A4 job carries the print scale to the printer
  var pp = Printer.print;
  Printer.print = function (html, opt) { opt = opt || {}; if (/@page\{size:(A4|A5|letter)/i.test(opt.css || '') && !opt.scale) opt.scale = U.n(docPage().scale) || 100; return pp.call(this, html, opt); };

  var ui = function (p, onChange) {
    var c = document.createElement('div'); c.className = 'card col'; c.style.padding = '10px'; c.id = 'pgCard';
    var n = function (k, lab, min, max) { return '<label class="f">' + lab + '<input class="in num" type="number" data-pg="' + k + '" min="' + min + '" max="' + max + '" value="' + p[k] + '"></label>'; };
    var dpr = Math.round((window.devicePixelRatio || 1) * 100);
    c.innerHTML = '<b>🖨️ ' + L('مقاس الطباعة على الورق', 'The printed sheet') + '</b>' +
      '<div class="grid g2">' + n('scale', L('حجم الطباعة %', 'Print scale %'), 25, 400) + n('width', L('عرض الفاتورة %', 'Content width %'), 40, 100) + '</div>' +
      '<div class="muted small">' + L('الهوامش بالمللي:', 'Margins (mm):') + '</div><div class="grid g4">' + n('t', L('فوق', 'Top'), 0, 40) + n('r', L('يمين', 'Right'), 0, 40) + n('b', L('تحت', 'Bottom'), 0, 40) + n('l', L('شمال', 'Left'), 0, 40) + '</div>' +
      '<div class="seg" id="pgAl">' + [['right', '➡️ ' + L('يمين', 'Right')], ['center', '↔️ ' + L('في النص', 'Centre')], ['left', '⬅️ ' + L('شمال', 'Left')]].map(function (a) { return '<button data-al="' + a[0] + '" class="' + (p.align === a[0] ? 'on' : '') + '">' + a[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row wrap" style="gap:6px"><button class="btn sm" id="pgFull">📐 ' + L('ملء الورقة (هامش 4)', 'Fill sheet (4 mm)') + '</button>' + (dpr > 100 ? '<button class="btn sm" id="pgDpr" title="' + L('لو الطباعة بتطلع أصغر من المعاينة', 'If prints come out smaller than the preview') + '">🖥️ ' + L('تعويض مقياس الشاشة ', 'Compensate screen scale ') + dpr + '%</button>' : '') + '<button class="btn sm ghost" id="pgRst">↺ ' + L('الافتراضي', 'Default') + '</button></div>' +
      '<div class="muted small">' + L('لو الورقة بتطلع أصغر من المعاينة: زوّد «حجم الطباعة» (مثلاً 125%). لو بتطلع مقصوصة: قلّله. «عرض الفاتورة» + يمين/نص/شمال بيحددوا مكانها على الورقة.', 'Prints smaller than the preview? Raise the print scale (e.g. 125%). Cut off? Lower it.') + '</div>';
    var sync = function () { $$('[data-pg]', c).forEach(function (i) { i.value = p[i.dataset.pg]; }); $$('#pgAl [data-al]', c).forEach(function (b) { b.classList.toggle('on', b.dataset.al === p.align); }); };
    $$('[data-pg]', c).forEach(function (i) { i.oninput = function () { if (i.value === '') return; p[i.dataset.pg] = U.n(i.value); onChange(); }; });
    $$('#pgAl [data-al]', c).forEach(function (b) { b.onclick = function () { p.align = b.dataset.al; sync(); onChange(); }; });
    $('#pgFull', c).onclick = function () { p.t = p.r = p.b = p.l = 4; p.width = 100; p.align = 'center'; sync(); onChange(); };
    if ($('#pgDpr', c)) $('#pgDpr', c).onclick = function () { p.scale = dpr; sync(); onChange(); toast('🖥️ ' + L('حجم الطباعة بقى ', 'Print scale set to ') + dpr + '%', 'ok'); };
    $('#pgRst', c).onclick = function () { p.t = p.r = p.b = p.l = 10; p.scale = 100; p.width = 100; p.align = 'center'; sync(); onChange(); };
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
