/* Ghandi Home 1.8 — what you see is what prints (colours forced in print), 10 more A4 designs, more page options,
   an editor that fits any screen, and test documents (sale / return / quotation / receipt) that are never saved.
   Eng. Mohamed Ali — 01098811581 */
'use strict';
/* ---------- 10 more designs ---------- */
DOC_TPLS.push(
  ['royal', 'ملكي ذهبي', 'Royal gold', '👑'], ['sidebar', 'شريط جانبي ملوّن', 'Side ribbon', '🎀'], ['corporate', 'شركات رسمي', 'Corporate', '🏢'],
  ['zebra', 'جدول مخطط واضح', 'Clear stripes', '🦓'], ['frame', 'إطار مزدوج', 'Double frame', '🖼️'], ['soft', 'ناعم بألوان فاتحة', 'Soft pastel', '🌸'],
  ['bold', 'عريض داكن', 'Bold dark', '⬛'], ['gridline', 'شبكة كاملة', 'Full grid', '🔲'], ['centered', 'كله في النص', 'Centered', '🎯'], ['receipt', 'شكل إيصال بسيط', 'Simple receipt look', '🧾']
);
(function () {
  var tc = A4.tplCss;
  A4.tplCss = function (tpl) {
    var ac = docColor();
    var x = {
      royal: 'body{font-family:"Sakkal Majalla","Traditional Arabic",Tahoma,serif;font-size:15px}.a4{border:2px solid #b8913a;outline:1px solid #b8913a;outline-offset:3px;padding:12px 16px}.a4h{border-bottom:2px solid #b8913a}.a4h h1{color:#7a5c12;font-size:28px}.a4t{background:linear-gradient(135deg,#b8913a,#e3c77a);color:#3b2a05}.meta{background:#fffaf0;border-color:#e3d3a8}table.g th{background:#7a5c12;color:#fff8e6}table.g tr:nth-child(even) td{background:#fffaf0}.tot .box{border-color:#e3d3a8}.tot .box .big{background:#7a5c12;color:#fff8e6}.words{border-color:#b8913a;background:#fffaf0}.sign div{border-top-color:#7a5c12}',
      sidebar: '.a4{border-inline-start:14px solid ' + ac + ';padding-inline-start:14px}.a4h{border-bottom:1px solid #ccd}.a4t{border-radius:0 18px 18px 0}.meta{border:0;background:transparent;border-inline-start:3px solid ' + ac + ';border-radius:0}table.g th{background:#fff;color:' + ac + ';border-bottom:2.5px solid ' + ac + '}.tot .box .big{border-radius:0}',
      corporate: 'body{font-family:Arial,Tahoma,sans-serif}.a4h{border-bottom:0;padding-bottom:0}.a4h:after{content:"";display:block}.a4t{background:#fff;color:#111;border:0;border-bottom:4px solid ' + ac + ';border-radius:0;font-size:22px;text-align:end}.meta{background:#fff;border:0;border-top:4px solid ' + ac + ';border-radius:0;padding-top:12px}table.g th{background:#2b2f36;color:#fff}table.g tr:nth-child(even) td{background:#f3f4f6}.tot .box{border-radius:0;border:0;border-top:2px solid #2b2f36}.tot .box .big{background:#2b2f36}.words{border-radius:0}',
      zebra: 'table.g th{background:' + ac + ';font-size:13px;padding:9px 6px}table.g td{padding:8px 6px;border-bottom:0}table.g tr:nth-child(even) td{background:#e8eef7}table.g tr:nth-child(odd) td{background:#fff}.meta{background:#e8eef7;border:0}.tot .box div:nth-child(even):not(.big){background:#f3f6fb}',
      frame: '.a4{border:4px double ' + ac + ';padding:14px 18px;min-height:265mm;box-sizing:border-box}.a4h{border-bottom:4px double ' + ac + '}.meta{border:1px solid ' + ac + ';background:#fff;border-radius:0}table.g td,table.g th{border:1px solid ' + ac + '}.tot .box,.words{border:2px solid ' + ac + ';border-radius:0}',
      soft: '.a4h{background:#f3f6ff;border:0;border-radius:16px;padding:14px}.a4t{border-radius:30px;background:#dfe7ff;color:#24356b}.a4h h1{color:#24356b}.meta{background:#fbfcff;border:1px solid #e3e8f8;border-radius:16px}table.g th{background:#dfe7ff;color:#24356b}table.g{border-radius:14px;overflow:hidden}table.g tr:nth-child(even) td{background:#f8faff}.tot .box{border-radius:16px;border-color:#e3e8f8}.tot .box .big{background:#dfe7ff;color:#24356b}.words{border-radius:16px;border-color:#c9d4f5;background:#f8faff}',
      bold: 'body{font-weight:600}.a4h{background:#111;color:#fff;padding:14px 16px;border:0}.a4h h1{color:#fff;font-size:26px}.a4h .sm{color:#ddd}.a4t{background:#fff;color:#111}.meta{background:#fff;border:2px solid #111;border-radius:0}table.g th{background:#111;color:#fff;font-size:13px}table.g td{border-bottom:1.5px solid #111}table.g tr:nth-child(even) td{background:#f1f1f1}.tot .box{border:2px solid #111;border-radius:0}.tot .box .big{background:#111}.words{border:2px solid #111;border-radius:0}.sign div{border-top:2px solid #111}',
      gridline: '.meta{border:1.5px solid #444;border-radius:0;background:#fff;gap:0}.meta div{border:1px solid #ccc;padding:5px 8px}table.g td,table.g th{border:1px solid #444}table.g th{background:#e9ecef;color:#111}table.g tr:nth-child(even) td{background:#fff}.tot .box{border:1.5px solid #444;border-radius:0}.tot .box div{border-bottom:1px solid #444}.tot .box .big{background:#e9ecef;color:#111}.words{border:1.5px solid #444;border-radius:0;background:#fff}',
      centered: '.a4h{flex-direction:column;align-items:center;text-align:center}.a4h .shop{flex-direction:column;gap:6px}.a4h .shop img{max-height:80px}.a4t{margin:8px auto 0}.meta{text-align:center}.meta div{justify-content:center}.tot{flex-direction:column-reverse;align-items:center}.tot .box{min-width:340px}.words{width:100%;text-align:center}.terms{text-align:center}',
      receipt: 'body{font-family:"Courier New",Tahoma,monospace}.a4{max-width:150mm;margin:0 auto}.a4h{flex-direction:column;align-items:center;text-align:center;border-bottom:1.5px dashed #000}.a4h .shop{flex-direction:column}.a4h h1{color:#000}.a4t{background:#fff;color:#000;border:1.5px dashed #000;border-radius:0}.meta{background:#fff;border:0;border-bottom:1.5px dashed #000;border-radius:0}table.g th{background:#fff;color:#000;border-bottom:1.5px dashed #000}table.g td{border-bottom:1px dotted #999}table.g tr:nth-child(even) td{background:#fff}.tot{flex-direction:column-reverse}.tot .box{width:100%;border:0;border-top:1.5px dashed #000;border-radius:0}.tot .box .big{background:#fff;color:#000;font-size:18px}.words{width:100%;border:0;background:#fff;text-align:center}'
    }[tpl];
    return x != null ? x : tc.apply(this, arguments);
  };
})();

/* ---------- page options ---------- */
function docOpt() { var d = docCfg(); d.opt = d.opt || {}; var o = d.opt, df = { color: '', font: '', logo: 70, wm: '', wmOp: 7, border: false, zebra: true, center: false, sigH: 26, rowPad: 6, title: 18 }; Object.keys(df).forEach(function (k) { if (o[k] === undefined) o[k] = df[k]; }); return o; }
function docColor() { var o = (docCfg().opt || {}); return o.color || (S().invoice || {}).accent || '#1f4e79'; }
var DOC_FONTS = [['', 'افتراضي (Tahoma)'], ['Arial', 'Arial'], ['"Segoe UI"', 'Segoe UI'], ['"Times New Roman"', 'Times New Roman'], ['"Sakkal Majalla"', 'Sakkal Majalla (عربي فخم)'], ['"Traditional Arabic"', 'Traditional Arabic'], ['"Simplified Arabic"', 'Simplified Arabic'], ['"Arabic Typesetting"', 'Arabic Typesetting'], ['"Courier New"', 'Courier New']];
(function () {
  var css1 = A4.css;
  A4.css = function () {
    var c = css1.apply(this, arguments), o = docOpt(), ac = docColor(), base = (S().invoice || {}).accent || '#1f4e79';
    if (o.color && o.color !== base) c = c.split(base).join(o.color); // the document colour is its own choice
    return c +
      // what you see is what prints: keep every colour and background even if the print dialog hides "background graphics"
      '*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}' +
      (o.font ? 'body,table,td,th{font-family:' + o.font + ',Tahoma,Arial,sans-serif!important}' : '') +
      '.a4h .shop img{max-height:' + (U.n(o.logo) || 70) + 'px;max-width:' + Math.round((U.n(o.logo) || 70) * 1.8) + 'px}' +
      '.a4t{font-size:' + (U.n(o.title) || 18) + 'px}' +
      'table.g td{padding:' + (U.n(o.rowPad) || 6) + 'px 6px}' +
      (o.zebra ? '' : 'table.g tr:nth-child(even) td{background:transparent!important}') +
      (o.center ? '.a4h{flex-direction:column;align-items:center;text-align:center}.a4h .shop{flex-direction:column}' : '') +
      (o.border ? '.a4{border:1.5px solid ' + ac + ';padding:10px 14px;box-sizing:border-box}' : '') +
      '.sign{margin-top:' + (U.n(o.sigH) || 26) + 'px}' +
      (o.wm ? (function () { // watermark drawn as a background picture: nothing can stick out of the page
        var t = String(o.wm).replace(/[<>&"]/g, ''), op = Math.min(0.3, (U.n(o.wmOp) || 7) / 100);
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><text x="400" y="560" text-anchor="middle" dominant-baseline="middle" direction="rtl" font-family="Tahoma,Arial,sans-serif" font-weight="900" font-size="' + Math.max(40, Math.min(150, Math.round(1400 / Math.max(4, t.length)))) + '" fill="' + ac + '" fill-opacity="' + op + '" transform="rotate(-28 400 560)">' + t + '</text></svg>';
        return '.a4{background-image:url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")!important;background-repeat:no-repeat!important;background-position:center 40%!important;background-size:90% auto!important}';
      })() : '');
  };
  // thermal receipts keep their colours too
  var rc = Receipt.css;
  Receipt.css = function () { return rc.apply(this, arguments) + '*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}'; };
})();

/* ---------- test documents: printed like the real thing, never saved ---------- */
var TestDoc = {
  KINDS: [['sale', '🧾 فاتورة بيع A4'], ['saleC', '🧾 فاتورة بيع لعميل بخصم وآجل'], ['ret', '↩️ فاتورة مرتجع'], ['quote', '📝 عرض سعر'], ['thermal', '🖨️ فاتورة الطابعة الحرارية']],
  items: function () {
    var ps = Store.db.products.filter(function (p) { return p.active !== false && U.n(p.prices[0]) > 0; }).slice(0, 3);
    if (!ps.length) return [{ pid: '', name: L('صنف تجريبي', 'Sample item'), qty: 2, price: 1500, base: 1500, cost: 0 }, { name: L('صنف تاني', 'Another item'), pid: '', qty: 1, price: 2500, base: 2500, cost: 0 }];
    return ps.map(function (p, i) { return { pid: p.id, name: pname(p), qty: i ? 1 : 2, price: U.n(p.prices[0]), base: U.n(p.prices[0]), cost: U.n(p.cost) }; });
  },
  cust: { id: '__testc', name: L('عميل تجريبي', 'Test customer'), phone: '01000000000', area: L('المنطقة', 'Area'), address: L('عنوان العميل', 'Customer address'), balance: 0 },
  sale: function (k) {
    var it = TestDoc.items(), sub = U.r2(it.reduce(function (a, i) { return a + i.qty * i.price; }, 0)), disc = k === 'saleC' ? U.r2(sub * 0.05) : 0, tot = U.r2(sub - disc), credit = k === 'saleC' ? U.r2(tot / 2) : 0;
    return { id: '__test', no: (Store.db.seq && Store.db.seq.invoice ? Store.db.seq.invoice + 1 : 1), type: k === 'ret' ? 'return' : 'sale', date: Date.now(), customer: k === 'saleC' || k === 'ret' ? TestDoc.cust.id : '', user: App.user.id, userName: App.user.name, items: it, subtotal: sub, discount: disc, vat: 0, total: tot, payments: { cash: U.r2(tot - credit) }, change: 0, credit: credit, tier: 0, test: true };
  },
  quote: function () { var it = TestDoc.items(), sub = U.r2(it.reduce(function (a, i) { return a + i.qty * i.price; }, 0)); return { no: ((Store.db.quotes || []).length + 1), date: Date.now(), name: TestDoc.cust.name, phone: TestDoc.cust.phone, valid: U.today(Date.now() + 7 * 864e5), by: App.user.name, items: it, sub: sub, disc: 0, vat: 0, total: sub, note: '' }; },
  // the fake customer exists only while the page is being built
  withCust: function (fn) { var db = Store.db.customers, had = db.some(function (c) { return c.id === TestDoc.cust.id; }); if (!had) db.push(TestDoc.cust); try { return fn(); } finally { if (!had) Store.db.customers = db.filter(function (c) { return c.id !== TestDoc.cust.id; }); } },
  run: function (k) {
    var n = (Store.db.sales || []).length, sv = Store.save;
    Store.save = function () { }; // nothing is written while the test document is made
    try {
      TestDoc.withCust(function () {
        if (k === 'quote') return Quote.print(TestDoc.quote());
        if (k === 'thermal') { var cfg = S().invoice, p = cfg.paper; if (p === 'A4') cfg.paper = '80'; try { Receipt.print(TestDoc.sale('sale')); } finally { cfg.paper = p; } return; }
        A4.printSale(TestDoc.sale(k));
      });
    } finally { Store.save = sv; }
    if (Store.db.sales.length !== n) Store.db.sales.length = n;
    toast('🧪 ' + L('مستند تجريبي — مش متسجل في البرنامج', 'Test document — not saved'), 'ok');
  },
  card: function () {
    var c = document.createElement('div'); c.className = 'card col'; c.id = 'tdCard';
    c.innerHTML = '<b>🧪 ' + L('مستند تجريبي — بيتطبع زي الحقيقي ومش بيتسجل', 'Test document — prints like a real one, never saved') + '</b><div class="row" style="gap:8px;flex-wrap:wrap"><select class="in" id="tdK" style="flex:1;min-width:200px">' + TestDoc.KINDS.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('') + '</select><button class="btn pri" id="tdGo">🖨️ ' + L('اطبع / اعرض', 'Print / preview') + '</button></div><div class="muted small">' + L('بياخد أصناف حقيقية من المخزن وعميل تجريبي — مفيش فاتورة ولا حركة مخزن ولا فلوس بتتسجل.', 'Uses real products and a test customer — no invoice, stock movement or money is recorded.') + '</div>';
    $('#tdGo', c).onclick = function () { TestDoc.run($('#tdK', c).value); };
    return c;
  }
};

/* ---------- editor: more options + fits the screen ---------- */
DocSet.extend = function (cur) {
  var m = cur.m, w = cur.w; w.opt = w.opt || {}; var keep = docCfg().opt; var o = w.opt;
  var h = homeCfg(), was = h.doc; h.doc = w; docOpt(); h.doc = was; void keep;
  var col = $('.grid > .col', m); if (!col) return;
  var card = document.createElement('div'); card.className = 'card col'; card.style.padding = '10px';
  card.innerHTML = '<b>🎨 ' + L('شكل الورقة', 'Page look') + '</b>' +
    '<div class="grid g2"><label class="f">' + L('لون الفاتورة', 'Colour') + '<input class="in" type="color" id="opC" value="' + (o.color || docColor()) + '" style="height:38px;padding:3px"></label><label class="f">' + L('نوع الخط', 'Font') + '<select class="in" id="opF">' + DOC_FONTS.map(function (f) { return '<option value=\'' + f[0] + '\'' + (o.font === f[0] ? ' selected' : '') + '>' + f[1] + '</option>'; }).join('') + '</select></label>' +
    '<label class="f">' + L('حجم اللوجو', 'Logo size') + '<input class="in num" type="number" id="opL" min="30" max="160" step="5" value="' + o.logo + '"></label><label class="f">' + L('حجم عنوان الفاتورة', 'Title size') + '<input class="in num" type="number" id="opT" min="12" max="34" value="' + o.title + '"></label>' +
    '<label class="f">' + L('ارتفاع سطور الجدول', 'Row height') + '<input class="in num" type="number" id="opR" min="2" max="16" value="' + o.rowPad + '"></label><label class="f">' + L('مسافة التوقيعات', 'Signature space') + '<input class="in num" type="number" id="opS" min="6" max="90" step="2" value="' + o.sigH + '"></label>' +
    '<label class="f">' + L('علامة مائية (كلمة في نص الورقة)', 'Watermark text') + '<input class="in" id="opW" value="' + U.esc(o.wm || '') + '" placeholder="' + L('مثلاً: أصلي / اسم المحل', 'e.g. ORIGINAL') + '"></label><label class="f">' + L('وضوح العلامة %', 'Watermark %') + '<input class="in num" type="number" id="opWo" min="2" max="30" value="' + o.wmOp + '"></label></div>' +
    '<label class="row small"><input type="checkbox" id="opB"' + (o.border ? ' checked' : '') + '> ' + L('إطار حوالين الورقة', 'Page border') + '</label><label class="row small"><input type="checkbox" id="opZ"' + (o.zebra ? ' checked' : '') + '> ' + L('سطور الجدول ملوّنة بالتبادل', 'Striped rows') + '</label><label class="row small"><input type="checkbox" id="opM"' + (o.center ? ' checked' : '') + '> ' + L('اسم المحل واللوجو في النص', 'Centre the shop header') + '</label>' +
    '<button class="btn sm" id="opX" style="align-self:flex-start">↺ ' + L('رجّع شكل الورقة للافتراضي', 'Reset page look') + '</button>';
  var first = col.firstElementChild; col.insertBefore(card, first ? first.nextSibling : null);
  var set = function (k, v) { o[k] = v; cur.draw(); };
  $('#opC', card).oninput = function () { set('color', this.value); };
  $('#opF', card).onchange = function () { set('font', this.value); };
  [['#opL', 'logo'], ['#opT', 'title'], ['#opR', 'rowPad'], ['#opS', 'sigH'], ['#opWo', 'wmOp']].forEach(function (x) { $(x[0], card).oninput = function () { set(x[1], U.n(this.value)); }; });
  $('#opW', card).oninput = function () { set('wm', this.value); };
  $('#opB', card).onchange = function () { set('border', this.checked); };
  $('#opZ', card).onchange = function () { set('zebra', this.checked); };
  $('#opM', card).onchange = function () { set('center', this.checked); };
  $('#opX', card).onclick = function () { w.opt = {}; var hh = homeCfg(), ww = hh.doc; hh.doc = w; docOpt(); hh.doc = ww; o = w.opt; card.remove(); DocSet.extend(cur); cur.draw(); };
  // the preview iframe must render with the edited colour/options: DocLive swaps h.doc = w, and docOpt/docColor read docCfg() → fine.
  if (cur.inline) {
    // the buttons row goes to the top so it is never off-screen
    var bar = $('#lvR', m) && $('#lvR', m).parentNode; if (bar && bar !== m.firstChild) { bar.style.marginTop = '0'; bar.style.marginBottom = '10px'; m.insertBefore(bar, m.firstChild); }
    if (!$('#tdCard', m)) { var tc = TestDoc.card(); tc.style.padding = '10px'; col.insertBefore(tc, col.firstElementChild); }
    DocSet.fit(m);
  }
};
DocSet.fit = function (m) {
  var go2 = function () {
    if (!m.isConnected) return window.removeEventListener('resize', go2);
    var col = $('.grid > .col', m), pv = $('#lvF2', m); if (!col || !pv) return;
    var top = col.getBoundingClientRect().top, hh = Math.max(380, window.innerHeight - top - 18);
    col.style.maxHeight = hh + 'px';
    var box = pv.parentNode; box.style.height = Math.max(340, hh - (box.getBoundingClientRect().top - top)) + 'px'; box.style.minHeight = '0';
  };
  window.addEventListener('resize', go2); setTimeout(go2, 0); setTimeout(go2, 300);
};

/* the thermal design page gets the test documents too */
(function () {
  var vi = Views.invoice;
  Views.invoice = function (el) {
    var r = vi.apply(this, arguments);
    if (S().invoice.paper !== 'A4') { var card = $('.card.col', el); if (card && !$('#tdCard', el)) card.appendChild(TestDoc.card()); }
    return r;
  };
})();

/* ---------- wholesale style (like the paper the owner sent): name in a band, details beside it, full grid ---------- */
var WHOLESALE = ['ws', 'wsBlue', 'wsLine', 'wsDark', 'wsFrame'];
DOC_TPLS.push(['ws', 'جملة رمادي (زي الصورة)', 'Wholesale grey', '📋'], ['wsBlue', 'جملة أزرق', 'Wholesale blue', '🟦'], ['wsLine', 'جملة خطوط بس (موفّر للحبر)', 'Wholesale lines', '📃'], ['wsDark', 'جملة شريط داكن', 'Wholesale dark', '⬛'], ['wsFrame', 'جملة بإطار', 'Wholesale framed', '🗂️']);
(function () {
  var wsCss = function (band, bandTxt, th, thTxt, line, extra) {
    return 'body{font-size:12px}.a4{display:grid;grid-template-columns:1.15fr 1fr;column-gap:16px;align-items:start}.a4>*{grid-column:1/-1}' +
      '.a4>.a4h{grid-column:1;grid-row:1;display:block;border:0;padding:0}.a4>.meta{grid-column:2;grid-row:1;margin:0;align-self:start}' +
      '.a4h .shop{display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:start}.a4h .shop>img{grid-column:2;grid-row:1 / span 2;max-height:76px}.a4h .shop>div{grid-column:1}' +
      '.a4h h1{background:' + band + ';color:' + bandTxt + ';padding:6px 12px;font-size:18px;border-radius:0}.a4h .sm{color:#222;font-size:12px;font-weight:700;line-height:1.75;margin-top:4px}' +
      '.a4t{background:transparent!important;color:#222!important;border:0!important;padding:0;font-size:12px!important;font-weight:700;text-align:start;min-width:0;margin-top:4px;box-shadow:none}' +
      '.meta{display:block;background:transparent;border:0;padding:0;font-size:12.5px}.meta div{display:flex;gap:8px;padding:2px 0;border:0}.meta b{min-width:96px;color:#222}' +
      'table.g{margin-top:10px;border:1px solid ' + line + '}table.g th{background:' + th + ';color:' + thTxt + ';border:1px solid ' + line + ';padding:5px 4px;font-size:12px;font-weight:700}' +
      'table.g td{border:1px solid ' + line + ';padding:4px 5px;font-size:12.5px}table.g tr:nth-child(even) td{background:transparent}table.g td:first-child{width:28px}' +
      '.tot .box{border:1px solid ' + line + ';border-radius:0}.tot .box div{border-bottom:1px solid ' + line + '}.tot .box .big{background:' + th + ';color:' + thTxt + '}.words{border:1px solid ' + line + ';border-radius:0;background:transparent}' +
      '.terms{border-top:1px solid ' + line + '}.sign div{border-top:1px solid ' + line + '}' + (extra || '');
  };
  var tc = A4.tplCss;
  A4.tplCss = function (tpl) {
    var ac = docColor();
    var x = {
      ws: wsCss('#d6d6d6', '#111', '#cfcfcf', '#111', '#555'),
      wsBlue: wsCss(ac, '#fff', '#dfe8f5', '#0d2a4d', '#6b7f99'),
      wsLine: wsCss('transparent', '#111', '#fff', '#111', '#222', '.a4h h1{border-bottom:2px solid #111;padding-inline-start:0}'),
      wsDark: wsCss('#222', '#fff', '#222', '#fff', '#444'),
      wsFrame: wsCss('#e6e6e6', '#111', '#e6e6e6', '#111', '#333', '.a4{border:2px solid #333;padding:10px 12px;box-sizing:border-box;min-height:270mm;align-content:start}')
    }[tpl];
    return x != null ? x : tc.apply(this, arguments);
  };
  // choosing a wholesale design turns on the item-code column and the invoice type line
  var ext = DocSet.extend;
  DocSet.extend = function (cur) {
    ext.apply(this, arguments);
    var sel = $('#lvT', cur.m); if (!sel) return;
    sel.addEventListener('change', function () {
      if (WHOLESALE.indexOf(sel.value) < 0) return;
      var w = cur.w, ch = false; ['colCode', 'mType'].forEach(function (k) { if (w.show[k] !== true && !(w._wsAsked || {})[k]) { w.show[k] = true; ch = true; } });
      w._wsAsked = { colCode: 1, mType: 1 };
      if (ch) { $$('[data-sh="colCode"],[data-sh="mType"]', cur.m).forEach(function (c) { c.checked = true; }); toast('📋 ' + L('اتفتح عمود «رقم الصنف» وسطر «نوع الفاتورة» — تقدر تقفلهم من «يظهر / يختفي»', 'Item code column and invoice type turned on'), 'ok'); cur.draw(); }
    });
  };
})();
