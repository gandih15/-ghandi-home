/* Ghandi Home 1.6 — live A4 invoice editor (every change shows instantly; click anything on the preview
   to rename, hide or delete it) + developer rule: retail price can't be below cost.
   Eng. Mohamed Ali — 01098811581 */
'use strict';
/* ---------- more things you can hide / rename ---------- */
(function () {
  var dc = docCfg;
  docCfg = function () {
    var d = dc.apply(this, arguments);
    var sh = { title: true, slogan: true, shopAddr: true, shopPhones: true, tax: true, mNo: true, mDate: true, mCust: true, mMobile: true, mAddr: true, colNo: true, colPrice: true, subtotal: true, discount: true, netRow: true, inst: true, words: true };
    Object.keys(sh).forEach(function (k) { if (d.show[k] === undefined) d.show[k] = sh[k]; });
    var lb = { colNo: 'م', colItem: 'الصنف', colUnit: 'الوحدة', colQty: 'الكمية', colPrice: 'السعر', colTotal: 'الإجمالي', colWar: 'الضمان', subtotal: 'الإجمالي', discount: 'الخصم', net: 'الصافي', change: 'الباقي', credit: 'آجل على العميل', walkin: 'نقدي', topNote: '', footNote: '' };
    Object.keys(lb).forEach(function (k) { if (d.lbl[k] === undefined) d.lbl[k] = lb[k]; });
    return d;
  };
})();
(function () { var dl = DocLbl, en = { colNo: '#', colItem: 'Item', colUnit: 'Unit', colQty: 'Qty', colPrice: 'Price', colTotal: 'Total', colWar: 'Warranty', subtotal: 'Subtotal', discount: 'Discount', net: 'Total', change: 'Change', credit: 'On account', walkin: 'Cash customer' }; DocLbl = function (k) { if (lang() === 'en' && en[k]) { var c = docCfg().lbl[k]; return c === undefined || c === ({ colNo: 'م', colItem: 'الصنف', colUnit: 'الوحدة', colQty: 'الكمية', colPrice: 'السعر', colTotal: 'الإجمالي', colWar: 'الضمان', subtotal: 'الإجمالي', discount: 'الخصم', net: 'الصافي', change: 'الباقي', credit: 'آجل على العميل', walkin: 'نقدي' })[k] ? en[k] : c; } return dl(k); }; })();
var DK = function (key, html) { return '<span data-dk="' + key + '">' + html + '</span>'; };
var DL = function (k) { return DK('lbl:' + k, U.esc(DocLbl(k) || '')); };
var Dshow = function (k) { return docCfg().show[k] !== false; };

A4.head = function (title, meta, sub) {
  var st = S(), en = lang() === 'en', sh = docCfg().show;
  var lines = [sh.slogan && st.slogan ? DK('show:slogan', U.esc(st.slogan)) : '', sh.shopAddr && st.shopAddress ? DK('show:shopAddr', U.esc(st.shopAddress)) : '', sh.shopPhones && ShopPhones.shown().length ? DK('show:shopPhones', ShopPhones.a4()): '', sh.tax && (st.taxNo || st.crNo) ? DK('show:tax', U.esc([st.taxNo ? L('رقم ضريبي ', 'Tax no. ') + st.taxNo : '', st.crNo ? L('سجل تجاري ', 'C.R. ') + st.crNo : ''].filter(Boolean).join(' · '))) : ''].filter(Boolean);
  var titleHtml = typeof title === 'object' ? DK('lbl:' + title.k, U.esc(DocLbl(title.k))) : U.esc(title);
  return '<div class="a4"><div class="a4h"><div class="shop">' + (st.logo ? DK('show:logo', '<img src="' + st.logo + '">') : '') + '<div><h1>' + U.esc(shopName(en)) + '</h1><div class="sm">' + lines.join('<br>') + '</div></div></div>' +
    (sh.title || typeof title !== 'object' ? DK('show:title', '<div class="a4t">' + titleHtml + (sub ? '<small>' + sub + '</small>' : '') + '</div>') : '<div></div>') + '</div>' +
    (meta && meta.length ? '<div class="meta">' + meta.map(function (r) { return '<div' + (r[2] ? ' data-dk="show:' + r[2] + '"' : '') + '><b>' + r[0] + ':</b><span>' + r[1] + '</span></div>'; }).join('') + '</div>' : '');
};
A4.totals = function (rows, amount) {
  return '<div class="tot"><div class="words">' + (Dshow('words') && lang() !== 'en' && amount != null && amount > 0 ? DK('show:words', Tafqeet.money(amount)) : '') + '</div><div class="box">' +
    rows.map(function (r) { return '<div class="' + (r[2] ? 'big' : '') + '"' + (r[3] ? ' data-dk="show:' + r[3] + '"' : '') + '><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join('') + '</div></div>';
};
A4.termsBlock = function (kind) {
  var t = (docCfg().terms[kind] || []).map(function (x, i) { return { x: x, i: i }; }).filter(function (o) { return o.x.on && o.x.t; });
  return t.length && Dshow('terms') ? '<div class="terms">' + DK('lbl:termsTitle', '<b>' + U.esc(DocLbl('termsTitle')) + '</b>') + '\n' + t.map(function (o) { return DK('term:' + kind + ':' + o.i, '• ' + U.esc(o.x.t)); }).join('\n') + '</div>' : '';
};
A4.sign = function (who) {
  var d = docCfg(); if (!d.show.sign) return '';
  who = who.filter(function (w) { var t = Array.isArray(w) ? w[0] : w; return t && String(t).trim(); }); if (!who.length) return '';
  return '<div class="sign" data-dk="show:sign">' + who.map(function (w) { var t = Array.isArray(w) ? w[0] : w, n = Array.isArray(w) ? w[1] : '', cls = Array.isArray(w) && w[2] ? w[2] : '', k = { 's-cust': 'sigCust', 's-mgr': 'sigMgr', 's-stamp': 'sigStamp' }[cls]; return '<div class="' + cls + '"' + (k ? ' data-dk="lbl:' + k + '"' : '') + '>' + U.esc(t) + (n ? '<small class="nm">' + U.esc(n) + '</small>' : '') + '</div>'; }).join('') + '</div>';
};
A4.sigs = function (custName, stamp) { var l = docCfg().lbl, out = [[l.sigCust, custName, 's-cust'], [l.sigMgr, A4.mgr(), 's-mgr']]; if (stamp) out.push([l.sigStamp, '', 's-stamp']); return out; };
(function () {
  var ft = A4.foot;
  A4.foot = function () { var n = docCfg().lbl.footNote; return (n ? '<div class="terms" style="text-align:center;border:0" data-dk="lbl:footNote">' + U.esc(n) + '</div>' : '') + ft.apply(this, arguments); };
})();
A4.topNote = function () { var n = docCfg().lbl.topNote; return n ? '<div class="meta" style="display:block;text-align:center;font-weight:700" data-dk="lbl:topNote">' + U.esc(n) + '</div>' : ''; };
A4.cols = function (cols, rows) {
  var on = cols.map(function (c) { return !c[1] || Dshow(c[1]); });
  return '<table class="g"><tr>' + cols.map(function (c, i) { return on[i] ? '<th data-dk="lbl:' + c[0] + '">' + U.esc(DocLbl(c[0])) + '</th>' : ''; }).join('') + '</tr>' +
    rows.map(function (r) { return '<tr>' + r.map(function (v, i) { return on[i] ? '<td' + (cols[i][0] === 'colItem' ? ' class="l"' : '') + '>' + v + '</td>' : ''; }).join('') + '</tr>'; }).join('') + '</table>';
};

/* ---------- sales invoice ---------- */
A4.invoice = function (s) {
  var d = docCfg(), sh = d.show, cu = H.cust(s.customer), ret = s.type === 'return';
  var hasW = sh.warranty && s.items.some(function (i) { var p = i.pid && Store.product(i.pid); return p && U.n(p.warranty) > 0; });
  var cols = [['colNo', 'colNo'], ['colItem'], ['colUnit', 'unit'], ['colQty'], ['colPrice', 'colPrice'], ['colTotal']].concat(hasW ? [['colWar', 'warranty']] : []);
  var rows = s.items.map(function (i, x) {
    var p = i.pid && Store.product(i.pid);
    return [x + 1, U.esc(i.name) + (i.serial ? '<br><span class="badge">S/N: ' + U.esc(i.serial) + '</span>' : '') + (i.base > i.price && i.promo ? '<br><span class="badge">★ ' + U.esc(i.promo) + '</span>' : ''), U.esc(p ? Meas.unitName(p) : '—'), U.r2(i.qty), (i.base > i.price ? '<s style="color:#888">' + U.money(i.base) + '</s><br>' : '') + U.money(i.price), U.money(i.qty * i.price)].concat(hasW ? [p && U.n(p.warranty) > 0 ? p.warranty + L(' شهر', ' mo') : '—'] : []);
  });
  var meta = [];
  if (sh.mNo) meta.push([DL('saleNo'), '<b>' + s.no + '</b>', 'mNo']);
  if (sh.mDate) meta.push([DL('date'), U.dt(s.date), 'mDate']);
  if (sh.mCust) meta.push([DL('to'), cu ? U.esc(cu.name) : DL('walkin'), 'mCust']);
  if (sh.mMobile) meta.push([DL('mobile'), cu && cu.phone ? '<span dir="ltr">' + U.esc(cu.phone) + '</span>' : '—', 'mMobile']);
  if (sh.mAddr && cu && cu.address) meta.push([DL('address'), U.esc([cu.area, cu.address].filter(Boolean).join(' — ')), 'mAddr']);
  if (sh.seller) { var rep = s.rep && typeof Comm !== 'undefined' ? Comm.name(s.rep) : s.userName; meta.push([DL('seller'), U.esc(rep || ''), 'seller']); }
  var tr = [];
  if (sh.subtotal) tr.push([DL('subtotal'), U.money(s.subtotal), 0, 'subtotal']);
  if (s.discount && sh.discount) tr.push([DL('discount'), '- ' + U.money(s.discount), 0, 'discount']);
  if (s.vat) tr.push([L('الضريبة', 'VAT'), U.money(s.vat)]);
  if (sh.netRow) tr.push([DL('net'), U.money(s.total) + ' ' + cur(), 1, 'netRow']);
  if (sh.payments) { Object.keys(s.payments || {}).filter(function (k) { return U.n(s.payments[k]); }).forEach(function (k) { tr.push([pmName(k), U.money(s.payments[k]), 0, 'payments']); }); if (s.change) tr.push([DL('change'), U.money(s.change), 0, 'payments']); if (s.credit) tr.push([DL('credit'), U.money(s.credit), 0, 'payments']); }
  var inst = sh.inst && s.instNo ? (Store.db.inst || []).filter(function (c) { return c.no === s.instNo; })[0] : null;
  return A4.head({ k: ret ? 'retTitle' : 'saleTitle' }, meta, s.void ? L('ملغاة', 'VOID') : '') + A4.topNote() + A4.cols(cols, rows) + A4.totals(tr, s.total) +
    (inst ? '<div data-dk="show:inst"><h3 class="s">🏦 ' + L('بيانات التقسيط — عقد رقم ', 'Instalment contract #') + inst.no + '</h3><div class="meta"><div><b>' + L('المقدم', 'Down payment') + ':</b>' + U.money(inst.down) + '</div><div><b>' + L('المبلغ المقسط', 'Financed') + ':</b>' + U.money(inst.instTotal) + '</div><div><b>' + L('عدد الأقساط', 'Instalments') + ':</b>' + inst.months + '</div><div><b>' + L('القسط', 'Each') + ':</b>' + U.money(inst.schedule[0].amount) + '</div></div></div>' : '') +
    A4.termsBlock('sale') + A4.sign(A4.sigs(cu ? cu.name : '', true)) + A4.foot();
};

/* ---------- quotation ---------- */
Quote.html = function (q) {
  var sh = docCfg().show, cu = q.customer ? H.cust(q.customer) : null, name = q.name || (cu && cu.name) || '';
  var cols = [['colNo', 'colNo'], ['colItem'], ['colUnit', 'unit'], ['colQty'], ['colPrice', 'colPrice'], ['colTotal']];
  var rows = q.items.map(function (i, x) { var p = i.pid && Store.product(i.pid); return [x + 1, U.esc(i.name), U.esc(p ? Meas.unitName(p) : '—'), U.r2(i.qty), U.money(i.price), U.money(i.qty * i.price)]; });
  var tr = []; if (sh.subtotal) tr.push([DL('subtotal'), U.money(q.sub), 0, 'subtotal']); if (q.disc && sh.discount) tr.push([DL('discount'), '- ' + U.money(q.disc), 0, 'discount']); if (q.vat) tr.push([L('الضريبة', 'VAT'), U.money(q.vat)]); if (sh.netRow) tr.push([DL('net'), U.money(q.total) + ' ' + cur(), 1, 'netRow']);
  var meta = []; if (sh.mNo) meta.push([DL('quoteNo'), '<b>' + q.no + '</b>', 'mNo']); if (sh.mDate) meta.push([DL('date'), U.dt(q.date), 'mDate']); if (sh.mCust) meta.push([DL('to'), U.esc(name || '—'), 'mCust']); if (sh.mMobile) meta.push([DL('mobile'), '<span dir="ltr">' + U.esc(q.phone || (cu && cu.phone) || '—') + '</span>', 'mMobile']); meta.push([DL('valid'), q.valid || '—']); if (sh.seller) meta.push([DL('by'), U.esc(q.by), 'seller']);
  return A4.head({ k: 'quoteTitle' }, meta) + A4.topNote() + A4.cols(cols, rows) + A4.totals(tr, q.total) + (q.note ? '<div class="terms">' + U.esc(q.note) + '</div>' : '') + A4.termsBlock('quote') + A4.sign(A4.sigs(name, false)) + A4.foot();
};
Quote.print = function (q) { A4.kindNow = 'quote'; A4.print(Quote.html(q), 'quote'); };

/* ---------- the live editor ---------- */
var DocLive = {
  sample: function (kind) {
    if (kind === 'quote') return (Store.db.quotes || []).slice(-1)[0] || { no: 1, date: Date.now(), name: L('اسم العميل', 'Customer'), phone: '01000000000', valid: U.today(Date.now() + 7 * 864e5), by: App.user.name, items: [{ name: L('صنف تجريبي', 'Sample item'), qty: 2, price: 1500 }, { name: L('صنف تاني', 'Another item'), qty: 1, price: 2500 }], sub: 5500, disc: 500, vat: 0, total: 5000 };
    var s = Store.db.sales.filter(function (x) { return x.type === 'sale' && !x.void && x.customer; }).slice(-1)[0] || Store.db.sales.filter(function (x) { return x.type === 'sale'; }).slice(-1)[0];
    return s || { no: 1, type: 'sale', date: Date.now(), customer: '', userName: App.user.name, items: [{ name: L('صنف تجريبي', 'Sample item'), qty: 2, price: 1500 }], subtotal: 3000, discount: 0, vat: 0, total: 3000, payments: { cash: 3000 } };
  },
  html: function (kind, w) {
    var h = homeCfg(), keep = h.doc; h.doc = w; A4.kindNow = kind;
    try { var body = kind === 'quote' ? Quote.html(DocLive.sample('quote')) : A4.invoice(DocLive.sample('sale')); var css = A4.css(); } finally { h.doc = keep; A4.kindNow = null; }
    return { body: body, css: css };
  },
  render: function (frame, kind, w, onPick) {
    var r = DocLive.html(kind, w), d = w, pw = { A4: 210, A5: 148, Letter: 216 }[d.paper] || 210, ph = { A4: 297, A5: 210, Letter: 279 }[d.paper] || 297;
    var y = frame.contentWindow ? frame.contentWindow.scrollY : 0;
    frame.onload = function () {
      var doc = frame.contentDocument; try { var sc = Math.min(1, (frame.clientWidth - 30) / (doc.body.offsetWidth * (parseFloat(getComputedStyle(doc.body).zoom) || 1))); if (sc > 0) doc.documentElement.style.zoom = sc; } catch (e) { } try { frame.contentWindow.scrollTo(0, y); } catch (e) { }
      doc.querySelectorAll('[data-dk]').forEach(function (el) { el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); onPick(el.getAttribute('data-dk'), el); }); });
    };
    frame.srcdoc = '<!doctype html><html dir="' + (lang() === 'en' ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><style>' + r.css.replace(/@page\{[^}]*\}/, '') + 'html{background:#8a93a3}body{background:#fff;width:' + pw + 'mm;min-height:' + ph + 'mm;margin:10px auto;padding:' + (U.n(d.margin) || 10) + 'mm;box-sizing:border-box;box-shadow:0 6px 24px rgba(0,0,0,.35)}[data-dk]{cursor:pointer;transition:outline .1s}[data-dk]:hover{outline:2px dashed #e11d48;outline-offset:2px;background:rgba(225,29,72,.06)}</style></head><body>' + r.body + '</body></html>';
  }
};
var DK_NAMES = { logo: 'اللوجو', slogan: 'الشعار تحت اسم المحل', shopAddr: 'عنوان المحل', shopPhones: 'تليفونات المحل', tax: 'الرقم الضريبي والسجل', title: 'عنوان المستند', mNo: 'رقم الفاتورة', mDate: 'التاريخ', mCust: 'اسم العميل', mMobile: 'موبايل العميل', mAddr: 'عنوان العميل', seller: 'البائع', subtotal: 'سطر الإجمالي', discount: 'سطر الخصم', netRow: 'سطر الصافي', payments: 'طرق الدفع والباقي والآجل', words: 'المبلغ بالحروف', terms: 'الشروط', sign: 'التوقيعات', inst: 'بيانات التقسيط', unit: 'عمود الوحدة', colNo: 'عمود الترقيم', colPrice: 'عمود السعر', warranty: 'عمود الضمان', foot: 'سطر «طُبع بواسطة»', sigNames: 'الأسماء تحت التوقيع', sigCustOn: 'خانة توقيع العميل', sigMgrOn: 'خانة توقيع المسئول', sigStampOn: 'خانة الختم' };
var LBL_SHOW = { sigCust: 'sigCustOn', sigMgr: 'sigMgrOn', sigStamp: 'sigStampOn', colUnit: 'unit', colNo: 'colNo', colPrice: 'colPrice', colWar: 'warranty', subtotal: 'subtotal', discount: 'discount', net: 'netRow', saleNo: 'mNo', quoteNo: 'mNo', date: 'mDate', to: 'mCust', mobile: 'mMobile', address: 'mAddr', seller: 'seller', by: 'seller', saleTitle: 'title', quoteTitle: 'title', retTitle: 'title', termsTitle: 'terms', change: 'payments', credit: 'payments', walkin: '' };
DocSet.open = function () {
  if (!can('settings')) return toast(L('ده من صلاحية المدير', 'Admin only'), 'bad');
  DocSet.mount(null);
};
/* host given → the editor lives inside the page and every change is saved on the spot */
DocSet.mount = function (host) {
  var inline = !!host, w = inline ? docCfg() : U.clone(docCfg()), kind = 'sale';
  var SHOWS = ['title', 'logo', 'slogan', 'shopAddr', 'shopPhones', 'tax', 'mNo', 'mDate', 'mCust', 'mMobile', 'mAddr', 'seller', 'colNo', 'unit', 'colPrice', 'warranty', 'subtotal', 'discount', 'netRow', 'payments', 'words', 'inst', 'terms', 'sign', 'sigCustOn', 'sigMgrOn', 'sigStampOn', 'sigNames', 'foot'];
  var LB = [['saleTitle', 'عنوان فاتورة البيع'], ['saleNo', '«رقم الفاتورة»'], ['retTitle', 'عنوان المرتجع'], ['quoteTitle', 'عنوان عرض السعر'], ['quoteNo', '«رقم العرض»'], ['to', 'كلمة العميل'], ['walkin', 'لو مفيش عميل'], ['mobile', '«الموبايل»'], ['address', '«العنوان»'], ['date', '«التاريخ»'], ['valid', '«ساري حتى»'], ['by', '«مقدم العرض»'], ['seller', '«البائع»'], ['colNo', 'عمود الترقيم'], ['colItem', 'عمود الصنف'], ['colUnit', 'عمود الوحدة'], ['colQty', 'عمود الكمية'], ['colPrice', 'عمود السعر'], ['colTotal', 'عمود الإجمالي'], ['colWar', 'عمود الضمان'], ['subtotal', 'سطر الإجمالي'], ['discount', 'سطر الخصم'], ['net', 'سطر الصافي'], ['change', 'الباقي'], ['credit', 'الآجل'], ['termsTitle', 'عنوان الشروط'], ['sigCust', 'توقيع العميل'], ['sigMgr', 'توقيع المسئول'], ['sigStamp', 'الختم'], ['mgrName', 'اسم المسئول (فاضي = صاحب المحل)'], ['topNote', 'جملة فوق الأصناف (اختياري)'], ['footNote', 'جملة في آخر الورقة (اختياري)']];
  var H2 = inline ? 'calc(100vh - 250px)' : '68vh';
  var BODY =
    '<div class="grid" style="grid-template-columns:380px 1fr;gap:14px;align-items:start"><div class="col" style="max-height:' + (inline ? 'calc(100vh - 210px)' : '72vh') + ';overflow:auto;padding-inline-end:4px">' +
    '<div class="card col" style="padding:10px"><div class="seg" id="lvK"><button data-k="sale" class="on">🧾 ' + L('فاتورة البيع', 'Sales invoice') + '</button><button data-k="quote">📝 ' + L('عرض السعر', 'Quotation') + '</button></div>' +
    '<label class="f">' + L('التصميم', 'Design') + '<select class="in" id="lvT">' + DOC_TPLS.map(function (t) { return '<option value="' + t[0] + '">' + t[3] + ' ' + L(t[1], t[2]) + '</option>'; }).join('') + '</select></label>' +
    '<div class="grid g3"><label class="f">' + L('المقاس', 'Paper') + '<select class="in" id="lvP">' + ['A4', 'A5', 'Letter'].map(function (p) { return '<option' + (p === w.paper ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label><label class="f">' + L('الكلام %', 'Text %') + '<input class="in num" type="number" id="lvF" step="5" min="70" max="140" value="' + w.font + '"></label><label class="f">' + L('الهامش', 'Margin') + '<input class="in num" type="number" id="lvM" min="3" max="25" value="' + w.margin + '"></label></div>' +
    '<label class="row small"><input type="checkbox" class="sw" id="lvPv"' + (w.preview ? ' checked' : '') + '> ' + L('اعرض المستند قبل الطباعة دايماً', 'Always preview before printing') + '</label></div>' +
    '<div class="card col" style="padding:10px"><b>👁️ ' + L('يظهر / يختفي', 'Show / hide') + '</b><div class="grid g2" style="gap:2px 10px">' + SHOWS.map(function (k) { return '<label class="row small"><input type="checkbox" data-sh="' + k + '"' + (w.show[k] !== false ? ' checked' : '') + '> ' + DK_NAMES[k] + '</label>'; }).join('') + '</div></div>' +
    '<div class="card col" style="padding:10px"><b>📜 ' + L('الجمل اللي تحت', 'Lines at the bottom') + '</b><div id="lvTl"></div><div class="row"><input class="in grow" id="lvTa" placeholder="' + L('جملة جديدة…', 'New line…') + '"><button class="btn" id="lvTb">➕</button></div></div>' +
    '<div class="card col" style="padding:10px"><b>✍️ ' + L('الكلام المكتوب', 'Wording') + '</b>' + LB.map(function (x) { return '<label class="f">' + x[1] + '<input class="in" data-lb="' + x[0] + '" value="' + U.esc(w.lbl[x[0]] || '') + '"' + (x[0] === 'mgrName' ? ' placeholder="' + U.esc(S().ownerName || '') + '"' : '') + '></label>'; }).join('') + '</div></div>' +
    '<div class="col" style="gap:6px"><div class="chip" style="white-space:normal;display:block;padding:8px 12px">👆 ' + L('أي تغيير بيظهر في الورقة على طول. ودوس على أي حاجة في الورقة نفسها عشان تغيّر كلامها أو تخفيها أو تمسحها.', 'Every change shows instantly. Click anything on the page to rename, hide or delete it.') + '</div><div style="background:#8a93a3;border-radius:12px;height:' + H2 + ';min-height:420px;overflow:hidden"><iframe id="lvF2" style="width:100%;height:100%;border:0"></iframe></div></div></div>';
  var m;
  if (inline) { host.innerHTML = BODY + '<div class="row" style="margin-top:8px"><span class="chip ok">✅ ' + L('أي تغيير بيتحفظ لوحده على طول', 'Every change is saved automatically') + '</span><span class="grow"></span><button class="btn" id="lvR">↺ ' + L('رجّع الكلام للافتراضي', 'Reset wording') + '</button><button class="btn" id="lvTest">🖨️ ' + L('طباعة تجريبية', 'Test print') + '</button></div>'; m = host; }
  else m = Modal.open({ size: 'xl', sticky: true, title: '🧾 ' + L('محرر الفاتورة وعرض السعر — مباشر', 'Live invoice & quotation editor'), body: BODY,
    foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn" id="lvR">↺ ' + L('رجّع الكلام للافتراضي', 'Reset wording') + '</button><button class="btn pri lg" id="lvGo">💾 ' + L('حفظ', 'Save') + '</button>' });
  var frame = $('#lvF2', m);
  var drawTerms = function () {
    var box = $('#lvTl', m), k = kind;
    box.innerHTML = (w.terms[k] || []).map(function (x, i) { return '<div class="row" style="margin-bottom:5px"><input type="checkbox" data-to="' + i + '"' + (x.on ? ' checked' : '') + '><input class="in grow" data-tt="' + i + '" value="' + U.esc(x.t) + '"><button class="btn sm ghost" data-tu="' + i + '">▲</button><button class="btn sm ghost" data-td="' + i + '" style="color:var(--bad)">✕</button></div>'; }).join('') || '<div class="muted small">—</div>';
    $$('[data-to]', box).forEach(function (c) { c.onchange = function () { w.terms[k][+c.dataset.to].on = c.checked; draw(); }; });
    $$('[data-tt]', box).forEach(function (c) { c.oninput = function () { w.terms[k][+c.dataset.tt].t = c.value; draw(); }; });
    $$('[data-td]', box).forEach(function (c) { c.onclick = function () { w.terms[k].splice(+c.dataset.td, 1); drawTerms(); draw(); }; });
    $$('[data-tu]', box).forEach(function (c) { c.onclick = function () { var i = +c.dataset.tu; if (!i) return; var a = w.terms[k], x = a.splice(i, 1)[0]; a.splice(i - 1, 0, x); drawTerms(); draw(); }; });
  };
  var sync = function () { $$('[data-sh]', m).forEach(function (c) { c.checked = w.show[c.dataset.sh] !== false; }); $$('[data-lb]', m).forEach(function (i) { if (document.activeElement !== i) i.value = w.lbl[i.dataset.lb] || ''; }); $('#lvT', m).value = w.tpl[kind] || 'classic'; };
  var t0; var draw = function () { clearTimeout(t0); t0 = setTimeout(function () { if (!frame.isConnected) return; DocLive.render(frame, kind, w, pick); if (inline) Store.save(); }, 60); };
  // click on the page itself
  var pick = function (key, el) {
    var p = key.split(':'), type = p[0];
    if (type === 'term') {
      var k = p[1], i = +p[2], x = w.terms[k][i]; if (!x) return;
      var mm = Modal.open({ title: '📜 ' + L('جملة', 'Line'), body: '<div class="col"><textarea class="in" id="pkT" rows="3">' + U.esc(x.t) + '</textarea></div>', foot: '<button class="btn" id="pkD" style="color:var(--bad)">🗑️ ' + L('مسح', 'Delete') + '</button><button class="btn" id="pkH">🙈 ' + L('إخفاء', 'Hide') + '</button><button class="btn pri" id="pkS">✔️ ' + L('تمام', 'OK') + '</button>' });
      $('#pkS', mm).onclick = function () { x.t = $('#pkT', mm).value.trim() || x.t; Modal.close(mm); drawTerms(); draw(); };
      $('#pkH', mm).onclick = function () { x.on = false; Modal.close(mm); drawTerms(); draw(); };
      $('#pkD', mm).onclick = function () { w.terms[k].splice(i, 1); Modal.close(mm); drawTerms(); draw(); };
      return;
    }
    if (type === 'lbl') {
      var lk = p[1], sk = LBL_SHOW[lk];
      var mm2 = Modal.open({ title: '✍️ ' + L('تغيير الكلمة', 'Edit wording'), body: '<div class="col"><input class="in" id="pkL" value="' + U.esc(w.lbl[lk] || '') + '" style="font-size:17px"><div class="muted small">' + L('اكتب الكلمة اللي تحبها، أو امسحها خالص.', 'Type the wording you want, or clear it.') + '</div></div>', foot: (sk ? '<button class="btn" id="pkH">🙈 ' + L('إخفاء', 'Hide') + '</button>' : '') + '<button class="btn" id="pkC" style="color:var(--bad)">🗑️ ' + L('مسح الكلمة', 'Clear') + '</button><button class="btn pri" id="pkS">✔️ ' + L('تمام', 'OK') + '</button>' });
      $('#pkL', mm2).select();
      $('#pkS', mm2).onclick = function () { w.lbl[lk] = $('#pkL', mm2).value.trim(); Modal.close(mm2); sync(); draw(); };
      $('#pkL', mm2).onkeydown = function (e) { if (e.key === 'Enter') $('#pkS', mm2).click(); };
      $('#pkC', mm2).onclick = function () { w.lbl[lk] = ''; Modal.close(mm2); sync(); draw(); };
      if ($('#pkH', mm2)) $('#pkH', mm2).onclick = function () { w.show[sk] = false; Modal.close(mm2); sync(); draw(); };
      return;
    }
    if (type === 'show') { var s2 = p[1]; Modal.confirm('🙈 ' + L('إخفاء «', 'Hide «') + (DK_NAMES[s2] || s2) + L('» من الطباعة؟ (ترجّعه من «يظهر / يختفي»)', '»? (bring it back from Show / hide)'), function () { w.show[s2] = false; sync(); draw(); }); }
  };
  $$('#lvK [data-k]', m).forEach(function (b) { b.onclick = function () { kind = b.dataset.k; $$('#lvK [data-k]', m).forEach(function (x) { x.classList.toggle('on', x === b); }); sync(); drawTerms(); draw(); }; });
  $('#lvT', m).onchange = function () { w.tpl[kind] = this.value; draw(); };
  $('#lvP', m).onchange = function () { w.paper = this.value; draw(); };
  $('#lvF', m).oninput = function () { w.font = Math.max(70, Math.min(140, U.n(this.value) || 100)); draw(); };
  $('#lvM', m).oninput = function () { w.margin = Math.max(3, Math.min(25, U.n(this.value) || 10)); draw(); };
  $('#lvPv', m).onchange = function () { w.preview = this.checked; if (inline) Store.save(); };
  $$('[data-sh]', m).forEach(function (c) { c.onchange = function () { w.show[c.dataset.sh] = c.checked; draw(); }; });
  $$('[data-lb]', m).forEach(function (i) { i.oninput = function () { w.lbl[i.dataset.lb] = i.value; draw(); }; });
  $('#lvTb', m).onclick = function () { var i = $('#lvTa', m), v = i.value.trim(); if (!v) return; (w.terms[kind] = w.terms[kind] || []).push({ t: v, on: true }); i.value = ''; drawTerms(); draw(); };
  $('#lvTa', m).onkeydown = function (e) { if (e.key === 'Enter') $('#lvTb', m).click(); };
  $('#lvR', m).onclick = function () { var h = homeCfg(), keep = h.doc; h.doc = { terms: keep.terms }; var fresh = docCfg().lbl; h.doc = keep; w.lbl = U.clone(fresh); sync(); draw(); };
  DocSet.cur = { w: w, draw: draw, m: m, inline: inline, kind: function () { return kind; } };
  if (typeof DocSet.extend === 'function') DocSet.extend(DocSet.cur);
  if (inline) { $('#lvTest', m).onclick = function () { var x = DocLive.sample(kind); if (kind === 'quote') Quote.print(x); else A4.printSale(x); }; sync(); drawTerms(); draw(); return; }
  $('[data-n]', m).onclick = function () { Modal.close(m); };
  $('#lvGo', m).onclick = function () { homeCfg().doc = w; Store.log('doc.settings', 'live editor'); Store.save(); Modal.close(m); toast('💾 ' + L('اتحفظ شكل الفاتورة', 'Invoice layout saved'), 'ok'); };
  sync(); drawTerms(); draw();
};

/* the «Invoice design» page: when the paper is A4 the whole live editor opens right there */
(function () {
  var vi = Views.invoice;
  Views.invoice = function (el) {
    var c = S().invoice; if (c.paper !== 'A4') { var r = vi.apply(this, arguments); var ab = $('#ipaper [data-v="A4"]', el); if (ab) ab.onclick = function () { c.paper = 'A4'; Store.save(); Views.invoice(el); }; return r; }
    el.innerHTML = '<div class="card row" style="gap:14px;padding:10px 14px;margin-bottom:12px;flex-wrap:wrap"><b>🖨️ ' + L('مقاس الورق', 'Paper') + '</b><div class="seg" id="ipaper">' + [['58', '58mm'], ['80', '80mm'], ['A4', 'A4']].map(function (p) { return '<button data-v="' + p[0] + '" class="' + (c.paper === p[0] ? 'on' : '') + '">' + p[1] + '</button>'; }).join('') + '</div><label class="row small">' + L('عدد النسخ', 'Copies') + ' <input class="in num" type="number" id="icp" min="1" max="5" style="width:70px" value="' + (c.copies || 1) + '"></label><span class="muted small grow">👆 ' + L('غيّر من الشمال أو دوس على أي حاجة في الورقة — بيتطبق ويتحفظ في نفس اللحظة', 'Change anything on the left or click anything on the page — applied and saved instantly') + '</span></div><div id="ilive"></div>';
    $$('#ipaper button', el).forEach(function (b) { b.onclick = function () { c.paper = b.dataset.v; Store.save(); Views.invoice(el); }; });
    $('#icp', el).oninput = function () { c.copies = Math.max(1, U.n(this.value) || 1); Store.save(); };
    DocSet.mount($('#ilive', el));
  };
})();

/* ================= developer rule: retail price >= cost ================= */
var PriceGuard = {
  on: function () { return !!devS().minPrice; },
  tiers: function () { return devS().minPriceAll ? [0, 1, 2, 3] : [0]; },
  bad: function (prices, cost) {
    if (!PriceGuard.on()) return null; cost = U.r2(U.n(cost)); if (!(cost > 0)) return null;
    var ts = PriceGuard.tiers();
    for (var i = 0; i < ts.length; i++) { var t = ts[i], v = U.r2(U.n((prices || [])[t])); if ((t === 0 || v > 0) && v < cost) return { t: t, v: v, cost: cost }; }
    return null;
  },
  msg: function (b, name) { return '⛔ ' + (name ? '«' + name + '»: ' : '') + L('سعر ', 'The ') + tierName(b.t) + ' (' + U.money(b.v) + L(') أقل من التكلفة (', ') is below cost (') + U.money(b.cost) + L(') — لازم يساوي التكلفة أو أعلى منها', ') — it must be equal to or above cost'); },
  warn: function (b, input, name) { toast(PriceGuard.msg(b, name), 'bad'); if (input) { input.style.outline = '2.5px solid var(--bad)'; input.focus(); input.select && input.select(); setTimeout(function () { input.style.outline = ''; }, 3000); } },
  block: function (list) { Modal.open({ title: '⛔ ' + L('أسعار أقل من التكلفة', 'Prices below cost'), body: '<div class="col"><div>' + L('مينفعش يتحفظ — الأصناف دي سعرها هيبقى أقل من التكلفة:', 'Not saved — these items would be priced below cost:') + '</div>' + list.slice(0, 15).map(function (x) { return '<div class="list-row small">' + U.esc(x) + '</div>'; }).join('') + (list.length > 15 ? '<div class="muted small">+' + (list.length - 15) + '</div>' : '') + '<div class="muted small">' + L('القاعدة دي متفعّلة من المطوّر: سعر القطاعي لازم يساوي التكلفة أو أعلى.', 'This rule is set by the developer: retail price must be at least the cost.') + '</div></div>' }); }
};
(function () {
  // product form: block save + live red hint
  var ed = Views.products.edit;
  Views.products.edit = function () {
    var r = ed.apply(this, arguments), m = $$('.mask').pop(); if (!m || !$('#fsave', m) || !PriceGuard.on()) return r;
    var ins = $$('[data-pr]', m), fc = $('#fcost', m), hint = document.createElement('div'); hint.className = 'small'; hint.style.cssText = 'color:var(--bad);font-weight:700;margin-top:4px';
    if (ins[0]) ins[0].parentNode.parentNode.appendChild(hint);
    var p0 = arguments[0];
    var check = function () { var b = PriceGuard.bad(ins.map(function (i) { return U.n(i.value); }), fc ? U.n(fc.value) : U.n((p0 || {}).cost)); hint.textContent = b ? PriceGuard.msg(b) : ''; ins.forEach(function (i, t) { i.style.borderColor = b && b.t === t ? 'var(--bad)' : ''; }); return b; };
    ins.concat(fc ? [fc] : []).forEach(function (i) { i.addEventListener('input', check); });
    var sv = $('#fsave', m), orig = sv.onclick;
    sv.onclick = function () { var b = check(); if (b) return PriceGuard.warn(b, ins[b.t]); return orig.apply(this, arguments); };
    check(); return r;
  };
})();

/* developer panel switch */
(function () {
  var dv = Views.dev;
  Views.dev = function (el) {
    dv.apply(this, arguments); if (!Dev.unlocked) return; var host = $('.grid', el) || el, d = devS();
    var c = document.createElement('div'); c.className = 'card col'; c.style.gridColumn = '1 / -1';
    c.innerHTML = '<h3>💰 ' + L('قواعد الأسعار', 'Price rules') + '</h3><label class="row"><input type="checkbox" class="sw" id="pgOn"' + (d.minPrice ? ' checked' : '') + '> <b>' + L('إجبار سعر القطاعي يساوي التكلفة أو أعلى', 'Force retail price ≥ cost') + '</b></label><label class="row small" style="margin-inline-start:28px"><input type="checkbox" class="sw" id="pgAll"' + (d.minPriceAll ? ' checked' : '') + '> ' + L('وكمان نص الجملة والجملة والسعر الخاص (لو مكتوبين)', 'Also half-wholesale, wholesale & special (when set)') + '</label><div class="muted small">' + L('لما تكون شغالة: أي صنف سعره أقل من تكلفته مش هيتحفظ — في إضافة/تعديل الصنف، الإضافة السريعة وقت الاستلام، استلام البضاعة، تعديل الأسعار الجماعي، والاستيراد من Excel — والبرنامج بيقول لصاحب المحل السبب. صاحب المحل مايقدرش يقفلها.', 'When on, a product priced below its cost is never saved — in the product form, quick add, receiving, bulk price changes and Excel import. The shop owner cannot turn it off.') + '</div>';
    host.appendChild(c);
    var rc = document.createElement('div'); rc.className = 'card col'; rc.style.gridColumn = '1 / -1';
    rc.innerHTML = '<h3>👤 ' + L('البائع على الفاتورة', 'Sales rep on invoices') + '</h3><select class="in" id="dvRep">' + [['', 'سيبها لصاحب المحل يحددها من صفحة العمولات']].concat([['free', 'الكاشير يختار البائع من القائمة'], ['staff', 'إجباري: البائع = الموظف اللي عامل دخول (المدير بس يقدر يغيّر)'], ['all', 'إجباري على الكل: البائع = اللي عامل دخول']]).map(function (o) { return '<option value="' + o[0] + '"' + ((d.repMode || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select><div class="muted small">' + L('أي اختيار غير الأول بيتفرض على صاحب المحل ومايقدرش يغيّره.', 'Anything but the first option overrides the shop owner.') + '</div>';
    host.appendChild(rc);
    $('#dvRep', rc).onchange = function () { if (this.value) d.repMode = this.value; else delete d.repMode; Store.log('dev.repMode', this.value || 'owner'); Store.save(); toast(L('اتحفظ', 'Saved'), 'ok'); };
    $('#pgOn', c).onchange = function () { d.minPrice = this.checked; Store.log('dev.minPrice', String(d.minPrice)); Store.save(); toast(L('اتحفظ', 'Saved'), 'ok'); };
    $('#pgAll', c).onchange = function () { d.minPriceAll = this.checked; Store.save(); toast(L('اتحفظ', 'Saved'), 'ok'); };
  };
})();

/* ================= shop phones with names (who answers each number) ================= */
var ShopPhones = {
  list: function () {
    var st = S();
    if (!Array.isArray(st.phones)) st.phones = [st.shopPhone, st.shopPhone2].filter(Boolean).map(function (p) { return { n: '', p: p, on: true }; });
    return st.phones;
  },
  shown: function () { return ShopPhones.list().filter(function (x) { return x.on !== false && String(x.p || '').trim(); }); },
  sync: function () { var a = ShopPhones.list().filter(function (x) { return String(x.p || '').trim(); }), st = S(); st.shopPhone = a[0] ? a[0].p.trim() : ''; st.shopPhone2 = a[1] ? a[1].p.trim() : ''; },
  one: function (x) { return '<span style="white-space:nowrap;display:inline-block">' + (x.n ? '<b>' + U.esc(x.n) + ':</b> ' : '') + '<span dir="ltr">' + U.esc(x.p) + '</span></span>'; },
  receipt: function () { return '<div style="text-align:center;color:#222;line-height:1.55">' + ShopPhones.shown().map(function (x) { return '<div>☎ ' + ShopPhones.one(x) + '</div>'; }).join('') + '</div>'; },
  a4: function () { return '☎ ' + ShopPhones.shown().map(ShopPhones.one).join(' &nbsp;·&nbsp; '); },
  card: function (after) {
    var c = document.createElement('div'); c.className = 'card col'; c.id = 'phCard';
    var draw = function () {
      var a = ShopPhones.list();
      c.innerHTML = '<h3>📞 ' + L('أرقام المحل على الفاتورة — اسم قصاد كل رقم', 'Shop numbers on the invoice — a name for each') + '</h3><div class="muted small">' + L('اكتب اسم الشخص قصاد رقمه (مثلاً: أ. محمد — المبيعات) عشان اللي بيتصل يعرف يكلّم مين. علّم على «يظهر» للأرقام اللي تطلع على الفاتورة.', 'Write who answers each number so callers know whom to ask for. Tick “show” for numbers printed on invoices.') + '</div>' +
        a.map(function (x, i) { return '<div class="row" style="gap:8px"><input class="in" style="flex:1.2" data-pn="' + i + '" placeholder="' + L('الاسم (مثلاً: أ. محمد)', 'Name') + '" value="' + U.esc(x.n || '') + '"><input class="in num" style="flex:1;direction:ltr" data-pp="' + i + '" placeholder="01xxxxxxxxx" value="' + U.esc(x.p || '') + '"><label class="row small" style="white-space:nowrap"><input type="checkbox" data-po="' + i + '"' + (x.on !== false ? ' checked' : '') + '> ' + L('يظهر', 'show') + '</label><button class="btn sm ghost" data-pu="' + i + '" title="' + L('لفوق', 'Up') + '">▲</button><button class="btn sm ghost" data-pd="' + i + '" style="color:var(--bad)">✕</button></div>'; }).join('') +
        '<button class="btn" id="phAdd" style="align-self:flex-start">➕ ' + L('رقم جديد', 'Add number') + '</button>';
      var ch = function () { ShopPhones.sync(); Store.save(); if (after) after(); };
      $$('[data-pn]', c).forEach(function (i) { i.oninput = function () { a[+i.dataset.pn].n = i.value; ch(); }; });
      $$('[data-pp]', c).forEach(function (i) { i.oninput = function () { a[+i.dataset.pp].p = i.value.trim(); ch(); }; });
      $$('[data-po]', c).forEach(function (i) { i.onchange = function () { a[+i.dataset.po].on = i.checked; ch(); }; });
      $$('[data-pd]', c).forEach(function (b) { b.onclick = function () { a.splice(+b.dataset.pd, 1); ch(); draw(); }; });
      $$('[data-pu]', c).forEach(function (b) { b.onclick = function () { var i = +b.dataset.pu; if (!i) return; a.splice(i - 1, 0, a.splice(i, 1)[0]); ch(); draw(); }; });
      $('#phAdd', c).onclick = function () { a.push({ n: '', p: '', on: true }); draw(); var l = $$('[data-pn]', c).pop(); l && l.focus(); };
    };
    draw(); return c;
  }
};
(function () {
  var vs = Views.shop;
  Views.shop = function (el) {
    var r = vs.apply(this, arguments);
    // the two old phone boxes are replaced by the named list
    ['shopPhone', 'shopPhone2'].forEach(function (k) { var i = $('[data-k="' + k + '"]', el); if (i) i.closest('label').style.display = 'none'; });
    var own = $$('.card', el).filter(function (c) { return $('[data-k="ownerName"]', c); })[0];
    var redraw = function () { var p = $('#sprev'); if (p) p.innerHTML = Receipt.html(Shop.sample()); };
    var card = ShopPhones.card(redraw);
    if (own) own.parentNode.insertBefore(card, own.nextSibling); else el.appendChild(card);
    return r;
  };
})();
