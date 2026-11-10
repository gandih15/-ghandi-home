/* Ghandi Home — where the discount came from (offers / invoice discount / coupon / points),
   shown in the POS cart, the payment window, the printed invoice and the invoice details. */
'use strict';

var DiscSrc = {
  // s: a sale or a cart-like object { items, discount, disc:{manual,coupon,points}, discPct, coupon, ptsRedeemed }
  lines: function (s) {
    var out = [], promos = {};
    (s.items || []).forEach(function (i) { var b = U.n(i.base), p = U.n(i.price); if (b > p) { var k = i.promo || L('عرض', 'Offer'); promos[k] = (promos[k] || 0) + (b - p) * U.n(i.qty); } });
    Object.keys(promos).forEach(function (k) { out.push({ k: 'promo', ic: '🎁', t: L('عرض «', 'Offer «') + k + L('» (في سعر الصنف)', '» (in item price)'), a: U.r2(promos[k]) }); });
    var d = s.disc || {}, inv = U.n(s.discount), manual = s.disc ? U.n(d.manual) : inv;
    if (manual > 0) out.push({ k: 'manual', ic: '✂️', t: L('خصم على الفاتورة', 'Invoice discount') + (U.n(s.discPct) ? ' (' + U.n(s.discPct) + '%)' : '') + (s.userName ? L(' — من ', ' — by ') + s.userName : ''), a: U.r2(manual) });
    if (U.n(d.coupon) > 0) out.push({ k: 'coupon', ic: '🎟️', t: L('كوبون', 'Coupon') + (s.coupon ? ' ' + s.coupon : ''), a: U.r2(d.coupon) });
    if (U.n(d.points) > 0) out.push({ k: 'points', ic: '⭐', t: L('استبدال نقاط', 'Points redeemed') + (U.n(s.ptsRedeemed) ? ' (' + U.n(s.ptsRedeemed) + L(' نقطة)', ' pts)') : ''), a: U.r2(d.points) });
    return out;
  },
  total: function (ls) { return U.r2(ls.reduce(function (a, l) { return a + l.a; }, 0)); },
  // on screen (POS, payment window, invoice details)
  html: function (ls, title) {
    if (!ls.length) return '';
    return '<div class="dsrc">' + (title === false ? '' : '<div class="dsrc-h">🔎 ' + L('مصدر الخصم', 'Discount source') + '</div>') + ls.map(function (l) { return '<div class="dsrc-r"><span>' + l.ic + ' ' + U.esc(l.t) + '</span><b class="num">−' + U.money(l.a) + '</b></div>'; }).join('') + (ls.length > 1 ? '<div class="dsrc-r dsrc-t"><span>' + L('إجمالي الخصم', 'Total discount') + '</span><b class="num">−' + U.money(DiscSrc.total(ls)) + '</b></div>' : '') + '</div>';
  }
};

/* sale: remember the % of the invoice discount */
(function () {
  var cr = Sales.create;
  Sales.create = function (o) { var s = cr.apply(this, arguments); try { var c = App.cart; if (s && s.type === 'sale' && c && c.discType === '%' && U.n(c.disc) && U.n(s.discount)) { s.discPct = U.n(c.disc); Store.save(); } } catch (e) { } return s; };
})();

/* POS cart: show the sources under the totals, before payment */
(function () {
  var P = Views.pos, dr = P.draw;
  P.draw = function () {
    dr.apply(this, arguments);
    var sum = $('#sum'); if (!sum || !App.cart) return; var c = App.cart, t = P.totals();
    var ls = DiscSrc.lines({ items: c.items, discount: t.disc, discPct: c.discType === '%' ? c.disc : 0 }); if (!ls.length) return;
    var old = $('.dsrc', sum); if (old) old.remove();
    var rows = $$('.r', sum), after = null; rows.forEach(function (r) { var tx = r.textContent; if (/توفير العروض|Offer savings|^الخصم|^Discount/.test(tx.trim())) { r.style.display = 'none'; after = r; } });
    var w = document.createElement('div'); w.innerHTML = DiscSrc.html(ls); var blk = w.firstChild;
    if (after) after.parentNode.insertBefore(blk, after.nextSibling); else if (rows[1]) rows[1].parentNode.insertBefore(blk, rows[1].nextSibling); else sum.appendChild(blk);
  };
})();

/* invoice details (admin / cashier) */
(function () {
  var op = Views.sales.open;
  Views.sales.open = function (s) {
    op.apply(this, arguments); var ls = DiscSrc.lines(s); if (!ls.length) return;
    var m = $$('.mask').pop(); if (!m || $('.dsrc', m)) return; var mb = $('.mb', m); if (!mb) return;
    var w = document.createElement('div'); w.style.marginTop = '12px'; w.innerHTML = DiscSrc.html(ls); mb.appendChild(w);
  };
})();

/* printed invoice (customer): the sources under the discount line */
(function () {
  var rh = Receipt.html;
  Receipt.html = function (s, cfg) {
    var h = rh.apply(this, arguments); if (!s || s.type === 'return') return h;
    var ls = DiscSrc.lines(s); if (!ls.length) return h; var en = lang() === 'en';
    var blk = '<div style="margin:3px 0;padding:3px 0;border-top:1px dotted #000;border-bottom:1px dotted #000"><div style="font-weight:700">' + (en ? 'Discount source:' : 'مصدر الخصم:') + '</div>' + ls.map(function (l) { return '<div style="display:flex;justify-content:space-between"><span>• ' + U.esc(l.k === 'manual' ? l.t.replace(/ — (من|by) .*$/, '') : l.t) + '</span><span>-' + U.money(l.a) + '</span></div>'; }).join('') + '</div>';
    var key = '<span>' + (en ? 'TOTAL' : 'الصافي') + '</span>', i = h.indexOf(key); if (i < 0) return h + blk;
    var j = h.lastIndexOf('<div', i); return h.slice(0, j) + blk + h.slice(j);
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['2.0.0'] = ['🔎 مصدر الخصم: في شاشة البيع قبل الدفع، وفي شاشة الدفع، وفي الفاتورة المطبوعة للعميل، وفي تفاصيل الفاتورة للأدمن والكاشير — عرض / خصم على الفاتورة / كوبون / نقاط'];

/* ================= printing an invoice: direct to the printer · an in-app print page · save on the computer ================= */
var InvPdf = {
  size: function (s) { // page size in inches, from the real receipt height
    var cfg = S().invoice; if (cfg.paper === 'A4') return null;
    var mm = cfg.paper === '58' ? 58 : 80, d = document.createElement('div'); d.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff';
    d.innerHTML = '<style>' + Receipt.css() + '</style>' + Receipt.html(s); document.body.appendChild(d); var h = d.scrollHeight; d.remove();
    return { width: mm / 25.4, height: Math.max(2, (h + 24) / 96) };
  },
  save: function (s) {
    var doc = '<!doctype html><html dir="' + (lang() === 'en' ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><style>' + Receipt.css() + '</style></head><body>' + Receipt.html(s) + '</body></html>', name = (lang() === 'en' ? 'invoice_' : 'فاتورة_') + s.no + '.pdf';
    if (IS_ELECTRON) return IPC.invoke('savePdf', { html: doc, name: name, title: L('حفظ الفاتورة', 'Save invoice'), pageSize: InvPdf.size(s) }).then(function (r) { if (r && r.ok) toast('💾 ' + L('اتحفظت: ', 'Saved: ') + r.path, 'ok'); else if (r && r.error !== 'cancelled') toast(L('مقدرتش أحفظ: ', 'Could not save: ') + r.error, 'bad'); });
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([doc], { type: 'text/html' })); a.download = name.replace('.pdf', '.html'); document.body.appendChild(a); a.click(); a.remove();
    toast('💾 ' + L('اتنزّلت الفاتورة', 'Invoice downloaded'), 'ok');
  }
};
var PrintPage = {
  open: function (s) {
    var cfg = S().invoice, m = Modal.open({ size: 'xl', title: '🖨️ ' + L('طباعة فاتورة #', 'Print invoice #') + s.no,
      body: '<div class="grid" style="grid-template-columns:1fr 340px;gap:18px;align-items:start"><div class="preview-wrap" style="min-height:0;padding:16px;max-height:70vh;overflow:auto;display:flex;justify-content:center"><div class="receipt">' + Receipt.html(s) + '</div></div>' +
        '<div class="col" style="gap:12px"><label class="f">' + L('الطابعة', 'Printer') + '<select class="in" id="ppN"><option value="">' + L('جاري البحث عن الطابعات…', 'Looking for printers…') + '</option></select></label><div class="muted small" id="ppMsg"></div>' +
        '<label class="f">' + L('عدد النسخ', 'Copies') + '<input class="in num" type="number" id="ppC" min="1" value="' + (+cfg.copies || 1) + '"></label>' +
        '<label class="row small" style="gap:8px"><input type="checkbox" class="sw" id="ppD"> ' + L('خليها طابعة الفواتير الأساسية', 'Make it the default invoice printer') + '</label>' +
        '<button class="btn pri lg" id="ppGo">🖨️ ' + L('اطبع', 'Print') + ' <span class="kbd">Enter</span></button>' +
        '<button class="btn" id="ppSv">💾 ' + L('حفظ في الجهاز (PDF)', 'Save on this computer (PDF)') + '</button>' +
        '<div class="muted small">' + L('الطباعة بتروح على الطابعة على طول من غير ما يسألك تحفظ فين. «حفظ في الجهاز» بس هو اللي بيسألك المكان.', 'Printing goes straight to the printer — only «Save» asks where to save.') + '</div></div></div>' });
    var sel = $('#ppN', m), msg = $('#ppMsg', m);
    if (!IS_ELECTRON) { sel.innerHTML = '<option value="">' + L('طابعة المتصفح', 'Browser printer') + '</option>'; sel.disabled = true; msg.textContent = L('هتفتحلك صفحة طباعة المتصفح تختار منها الطابعة', 'The browser print page will open'); }
    else SmartPrint.list().then(function (ps) {
      var real = ps.filter(function (p) { return !SmartPrint.virt.test(p.name); });
      if (!real.length) { sel.innerHTML = '<option value="">—</option>'; msg.innerHTML = '⚠️ ' + L('مفيش طابعة متوصلة — وصّل الطابعة وافتح الصفحة تاني، أو احفظ الفاتورة في الجهاز', 'No printer connected — connect one, or save the invoice'); $('#ppGo', m).disabled = true; return; }
      SmartPrint.pick(S().printers.invoice).then(function (def) { sel.innerHTML = real.map(function (p) { return '<option' + (p.name === def ? ' selected' : '') + '>' + U.esc(p.name) + '</option>'; }).join(''); msg.textContent = real.length + L(' طابعة متوصلة', ' printers connected'); });
    });
    var go = function () {
      var name = sel.value, n = Math.max(1, Math.round(U.n($('#ppC', m).value) || 1));
      if (IS_ELECTRON && !name) return toast(L('اختار الطابعة', 'Pick a printer'), 'bad');
      if ($('#ppD', m).checked && name) { S().printers.invoice = name; Store.save(); }
      Printer.print(Receipt.html(s), { css: Receipt.css(), printer: name, silent: !!name, copies: n, dir: lang() === 'en' ? 'ltr' : 'rtl' });
      toast('🖨️ ' + (name ? L('اتبعتت لـ ', 'Sent to ') + name : L('صفحة الطباعة', 'Print page')), 'ok'); Modal.close(m);
    };
    $('#ppGo', m).onclick = go; $('#ppSv', m).onclick = function () { InvPdf.save(s); };
    m.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); go(); } });
  }
};
(function () {
  // no printer → the in-app print page (never the Windows «save as» window); right after a sale it stays silent
  var rp = Receipt.print;
  Receipt.print = function (s, opt) {
    opt = opt || {};
    if (!IS_ELECTRON) { if (opt.auto) return Promise.resolve(null); PrintPage.open(s); return Promise.resolve('page'); }
    return SmartPrint.pick(S().printers.invoice).then(function (name) {
      if (!name) { if (opt.auto) return rp(s, opt); PrintPage.open(s); return 'page'; }
      return rp(s, opt);
    });
  };
  var sh = ReceiptPop.show;
  ReceiptPop.show = function (s, auto) {
    sh.apply(this, arguments); var m = $$('.mask').pop(); if (!m || !$('#rpP', m)) return;
    var b1 = document.createElement('button'); b1.className = 'btn'; b1.id = 'rpPg'; b1.innerHTML = '📄 ' + L('صفحة الطباعة', 'Print page'); b1.onclick = function () { PrintPage.open(s); };
    var b2 = document.createElement('button'); b2.className = 'btn'; b2.id = 'rpSv'; b2.innerHTML = '💾 ' + L('حفظ في الجهاز', 'Save on computer'); b2.onclick = function () { InvPdf.save(s); };
    $('#rpP', m).after(b1, b2);
    var st = $('#rpSt', m), ob = $('#rpP', m).onclick; $('#rpP', m).onclick = function () { Receipt.print(s, { manual: true }).then(function (r) { if (r === 'page' && st) st.innerHTML = '📄 ' + L('اختار الطابعة من صفحة الطباعة', 'Pick the printer on the print page'); else if (r && st) { st.innerHTML = '✅ ' + L('اتطبعت على ', 'Printed on ') + '<b>' + U.esc(r) + '</b>'; st.className = 'card rp-status ok'; } }); };
  };
  // invoice details: the same two extra buttons
  var op = Views.sales.open;
  Views.sales.open = function (s) {
    op.apply(this, arguments); var m = $$('.mask').pop(), rp1 = m && $('#rp', m); if (!rp1 || $('#rpPg', m)) return;
    var b1 = document.createElement('button'); b1.className = 'btn'; b1.id = 'rpPg'; b1.innerHTML = '📄 ' + L('صفحة الطباعة', 'Print page'); b1.onclick = function () { PrintPage.open(s); };
    var b2 = document.createElement('button'); b2.className = 'btn'; b2.id = 'rpSv'; b2.innerHTML = '💾 ' + L('حفظ في الجهاز', 'Save on computer'); b2.onclick = function () { InvPdf.save(s); };
    rp1.after(b1, b2);
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['2.0.1'] = ['🖨️ الفاتورة بتطبع على الطابعة المتوصلة على طول بعد البيع — من غير ما يطلع «حدد مكان الحفظ»', '📄 «صفحة الطباعة» جوه البرنامج: معاينة + تختار الطابعة وعدد النسخ', '💾 «حفظ في الجهاز» للفاتورة PDF لو حبيت تحفظها'];
