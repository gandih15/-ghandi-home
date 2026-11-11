/* Ghandi Home 1.4 — A4 document designs chosen in Settings, editable wording & terms, signature names,
   print preview before every A4 print, and developer reset tools.
   Eng. Mohamed Ali — 01098811581 */
'use strict';
var DOC_TPLS = [['classic', 'كلاسيك', 'Classic', '🧾'], ['modern', 'عصري بشريط ملوّن', 'Modern band', '🎨'], ['minimal', 'بسيط موفّر للحبر', 'Ink-saver', '🖤'], ['boxed', 'رسمي بمربعات', 'Official boxed', '🗂️'], ['elegant', 'فخم', 'Elegant', '👑'], ['compact', 'مضغوط (نص صفحة)', 'Compact (half page)', '📄']];
var DOC_KINDS = [['sale', 'فاتورة البيع', 'Sales invoice'], ['quote', 'عرض السعر', 'Quotation'], ['other', 'باقي المستندات (عقود، كشوف، إيصالات…)', 'Other documents']];
function docCfg() {
  var h = homeCfg();
  if (!h.doc) h.doc = {};
  var d = h.doc, def = {
    tpl: { sale: 'classic', quote: 'classic', other: 'classic' }, paper: 'A4', font: 100, margin: 10, preview: true,
    show: { logo: true, shop: true, words: true, terms: true, sign: true, foot: true, unit: true, warranty: true, payments: true, seller: true, sigNames: true, sigCustOn: true, sigMgrOn: true, sigStampOn: true },
    lbl: { saleTitle: 'فاتورة بيع', saleNo: 'رقم الفاتورة', retTitle: 'فاتورة مرتجع', quoteTitle: 'عرض سعر', quoteNo: 'رقم العرض', to: 'العميل', mobile: 'الموبايل', address: 'العنوان', date: 'التاريخ', valid: 'ساري حتى', by: 'مقدم العرض', seller: 'البائع', sigCust: 'العميل', sigMgr: 'المدير المسئول', sigStamp: 'الختم', mgrName: '', termsTitle: 'الشروط والأحكام' },
    terms: {
      sale: (h.a4Terms || '').split('\n').map(function (t) { return t.trim(); }).filter(Boolean).map(function (t) { return { t: t, on: true }; }),
      quote: [{ t: 'الأسعار سارية حتى التاريخ الموضح وحسب توفر الكميات بالمخزن.', on: true }, { t: 'متاح التقسيط بمقدم بسيط — اسأل عن نظام الأقساط.', on: true }]
    }
  };
  Object.keys(def).forEach(function (k) { if (d[k] === undefined) d[k] = def[k]; else if (typeof def[k] === 'object' && !Array.isArray(def[k])) Object.keys(def[k]).forEach(function (j) { if (d[k][j] === undefined) d[k][j] = def[k][j]; }); });
  return d;
}
var DocLbl = function (k) { return lang() === 'en' ? ({ saleTitle: 'Sales invoice', saleNo: 'Invoice no.', retTitle: 'Return invoice', quoteTitle: 'Quotation', quoteNo: 'Quotation no.', to: 'Customer', mobile: 'Mobile', address: 'Address', date: 'Date', valid: 'Valid until', by: 'Prepared by', seller: 'Sales rep', sigCust: 'Customer', sigMgr: 'Manager', sigStamp: 'Stamp', termsTitle: 'Terms' }[k] || docCfg().lbl[k]) : docCfg().lbl[k]; };

/* ---------- template styles ---------- */
(function () {
  var css0 = A4.css;
  A4.tplCss = function (tpl) {
    var ac = (S().invoice || {}).accent || '#1f4e79';
    return {
      classic: '',
      modern: '.a4h{background:' + ac + ';color:#fff;border:0;border-radius:12px;padding:14px 18px}.a4h h1{color:#fff}.a4h .sm{color:rgba(255,255,255,.88)}.a4t{background:#fff;color:' + ac + '}.a4t small{color:' + ac + '}.meta{background:#fff;border:0;box-shadow:0 0 0 1px #dde inset;border-radius:12px}table.g th{background:#eef2f8;color:' + ac + ';border-bottom:2px solid ' + ac + '}table.g{border-radius:10px;overflow:hidden}.tot .box .big{border-radius:0 0 8px 8px}h3.s{border:0;background:#f2f5fa;padding:6px 10px;border-radius:8px}',
      minimal: '.a4h{border-bottom:1.5px solid #000}.a4h h1{color:#000}.a4t{background:#fff;color:#000;border:1.5px solid #000}.a4t small{color:#000}.meta{background:#fff;border:0;border-top:1px solid #000;border-bottom:1px solid #000;border-radius:0}table.g th{background:#fff;color:#000;border-top:1.5px solid #000;border-bottom:1.5px solid #000}table.g tr:nth-child(even) td{background:#fff}.tot .box{border-color:#000;border-radius:0}.tot .box .big{background:#fff;color:#000;border-top:1.5px solid #000}.words{border-color:#000;background:#fff;border-radius:0}h3.s{color:#000;border-bottom-color:#000}.badge{background:#fff;border:1px solid #000;color:#000}',
      boxed: '.a4h{flex-direction:column;align-items:center;text-align:center;border:2px solid ' + ac + ';border-radius:6px;padding:10px}.a4h .shop{flex-direction:column}.a4t{margin-top:6px}.meta{border:1.5px solid ' + ac + ';border-radius:0;background:#fff}.meta div{border-bottom:1px dashed #ccd;padding-bottom:3px}table.g td,table.g th{border:1px solid #889}table.g tr:nth-child(even) td{background:#fff}.tot .box{border:1.5px solid ' + ac + ';border-radius:0}.words{border:1.5px solid ' + ac + ';border-radius:0}.sign div{border:1px solid #889;border-top:1px solid #889;padding:30px 6px 6px;border-radius:0}.terms{border:1px solid #ccd;padding:8px}',
      elegant: 'body{font-family:"Sakkal Majalla","Traditional Arabic","Times New Roman",serif;font-size:15px}.a4h{flex-direction:column;align-items:center;text-align:center;border-bottom:0;padding-bottom:4px}.a4h .shop{flex-direction:column;gap:4px}.a4h h1{font-size:30px;letter-spacing:1px;color:' + ac + '}.a4t{background:transparent;color:' + ac + ';border-top:1px solid ' + ac + ';border-bottom:1px solid ' + ac + ';border-radius:0;font-size:20px;margin-top:4px}.a4t small{color:#666}.a4{border:3px double ' + ac + ';padding:12px 16px;min-height:270mm;box-sizing:border-box}.meta{background:transparent;border:0;border-bottom:1px solid #d9c9a3;border-radius:0}table.g th{background:transparent;color:' + ac + ';border-top:2px solid ' + ac + ';border-bottom:2px solid ' + ac + ';font-size:15px}table.g tr:nth-child(even) td{background:#fbf8f1}.tot .box{border-radius:0;border-color:#d9c9a3}.words{border-style:solid;border-color:#d9c9a3;background:#fdfaf3;border-radius:0}.num,table.g td{font-family:Tahoma,Arial}',
      compact: 'body{font-size:10.5px}.a4h h1{font-size:17px}.a4h .shop img{max-height:46px}.a4t{font-size:14px;padding:5px 10px;min-width:120px}.meta{margin:6px 0;padding:6px 8px;gap:2px 12px}table.g th,table.g td{padding:3px 4px}.tot .box{min-width:200px}.tot .box div{padding:3px 8px}.tot .box .big{font-size:13px}.sign{margin-top:14px}.terms{font-size:9.5px;margin-top:6px}.ft{margin-top:6px}'
    }[tpl] || '';
  };
  A4.css = function (tpl) {
    var d = docCfg(), sh = d.show, f = U.n(d.font) || 100;
    tpl = tpl || d.tpl[A4.kindNow || 'other'] || 'classic';
    var size = { A4: 'A4', A5: 'A5', Letter: 'letter' }[d.paper] || 'A4';
    return css0.apply(this, arguments).replace(/@page\{[^}]*\}/, '@page{size:' + size + ';margin:' + (String(d.margin) === '0' ? 0 : (U.n(d.margin) || 10)) + 'mm}') + A4.tplCss(tpl) +
      'body{zoom:' + (f / 100) + '}' + (sh.logo ? '' : '.a4h .shop img{display:none}') + (sh.shop ? '' : '.a4h .sm{display:none}') + (sh.words ? '' : '.words{visibility:hidden}') + (sh.terms ? '' : '.terms{display:none}') + (sh.sign ? '' : '.sign{display:none}') + (sh.foot ? '' : '.ft{display:none}') +
      '.sign small.nm{display:block;font-weight:400;margin-top:3px;color:#333}' + (sh.sigNames ? '' : '.sign small.nm{display:none}') + (sh.sigCustOn ? '' : '.sign .s-cust{display:none}') + (sh.sigMgrOn ? '' : '.sign .s-mgr{display:none}') + (sh.sigStampOn ? '' : '.sign .s-stamp{display:none}');
  };
  // signatures can carry a name under the line: [label, name]
  A4.sign = function (who) {
    var d = docCfg(); if (!d.show.sign) return '';
    who = who.filter(function (w) { var t = Array.isArray(w) ? w[0] : w; return t && String(t).trim(); }); if (!who.length) return '';
    return '<div class="sign">' + who.map(function (w) { var t = Array.isArray(w) ? w[0] : w, n = Array.isArray(w) ? w[1] : '', k = Array.isArray(w) && w[2] ? ' class="' + w[2] + '"' : ''; return '<div' + k + '>' + t + (n ? '<small class="nm">' + U.esc(n) + '</small>' : '') + '</div>'; }).join('') + '</div>';
  };
  A4.totals = function (rows, amount) { return '<div class="tot"><div class="words">' + (lang() !== 'en' && amount != null && amount > 0 ? Tafqeet.money(amount) : '') + '</div><div class="box">' + rows.map(function (r) { return '<div class="' + (r[2] ? 'big' : '') + '"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join('') + '</div></div>'; };
  A4.termsBlock = function (kind) { var t = (docCfg().terms[kind] || []).filter(function (x) { return x.on && x.t; }); return t.length ? '<div class="terms"><b>' + U.esc(DocLbl('termsTitle')) + '</b>\n' + t.map(function (x) { return '• ' + U.esc(x.t); }).join('\n') + '</div>' : ''; };
  A4.sigs = function (custName, stamp) { var l = docCfg().lbl, out = [[l.sigCust, custName, 's-cust'], [l.sigMgr, A4.mgr(), 's-mgr']]; if (stamp) out.push([l.sigStamp, '', 's-stamp']); return out; };
  A4.mgr = function () { return docCfg().lbl.mgrName || S().ownerName || ''; };

  /* ---------- the sales invoice with editable wording ---------- */
  A4.invoice = function (s) {
    var d = docCfg(), sh = d.show, cu = H.cust(s.customer), ret = s.type === 'return';
    var hasW = sh.warranty && s.items.some(function (i) { var p = i.pid && Store.product(i.pid); return p && U.n(p.warranty) > 0; });
    var heads = [L('م', '#'), L('الصنف', 'Item')].concat(sh.unit ? [L('الوحدة', 'Unit')] : []).concat([L('الكمية', 'Qty'), L('السعر', 'Price'), L('الإجمالي', 'Total')]).concat(hasW ? [L('الضمان', 'Warranty')] : []);
    var rows = s.items.map(function (i, x) {
      var p = i.pid && Store.product(i.pid);
      return [x + 1, U.esc(i.name) + (i.serial ? '<br><span class="badge">S/N: ' + U.esc(i.serial) + '</span>' : '') + (i.base > i.price && i.promo ? '<br><span class="badge">★ ' + U.esc(i.promo) + '</span>' : '')].concat(sh.unit ? [U.esc(p ? Meas.unitName(p) : '—')] : []).concat([U.r2(i.qty), (i.base > i.price ? '<s style="color:#888">' + U.money(i.base) + '</s><br>' : '') + U.money(i.price), U.money(i.qty * i.price)]).concat(hasW ? [p && U.n(p.warranty) > 0 ? p.warranty + L(' شهر', ' mo') : '—'] : []);
    });
    var inst = s.instNo ? (Store.db.inst || []).filter(function (c) { return c.no === s.instNo; })[0] : null;
    var meta = [[DocLbl('saleNo'), '<b>' + s.no + '</b>'], [DocLbl('date'), U.dt(s.date)], [DocLbl('to'), cu ? U.esc(cu.name) : L('نقدي', 'Walk-in')], [DocLbl('mobile'), cu && cu.phone ? '<span dir="ltr">' + U.esc(cu.phone) + '</span>' : '—']];
    if (cu && cu.address) meta.push([DocLbl('address'), U.esc(cu.address)]);
    if (sh.seller) { var rep = s.rep && typeof Comm !== 'undefined' ? Comm.name(s.rep) : s.userName; meta.push([DocLbl('seller'), U.esc(rep || '')]); }
    var tr = [[L('الإجمالي', 'Subtotal'), U.money(s.subtotal)]];
    if (s.discount) tr.push([L('الخصم', 'Discount'), '- ' + U.money(s.discount)]);
    if (s.vat) tr.push([L('الضريبة', 'VAT'), U.money(s.vat)]);
    tr.push([L('الصافي', 'Net total'), U.money(s.total) + ' ' + cur(), 1]);
    if (sh.payments) { Object.keys(s.payments || {}).filter(function (k) { return U.n(s.payments[k]); }).forEach(function (k) { tr.push([pmName(k), U.money(s.payments[k])]); }); if (s.change) tr.push([L('الباقي', 'Change'), U.money(s.change)]); if (s.credit) tr.push([L('آجل على العميل', 'On account'), U.money(s.credit)]); }
    return A4.head(ret ? DocLbl('retTitle') : DocLbl('saleTitle'), meta, s.void ? L('ملغاة', 'VOID') : '') + A4.table(heads, rows) + A4.totals(tr, s.total) +
      (inst ? '<h3 class="s">🏦 ' + L('بيانات التقسيط — عقد رقم ', 'Instalment contract #') + inst.no + '</h3><div class="meta"><div><b>' + L('المقدم', 'Down payment') + ':</b>' + U.money(inst.down) + '</div><div><b>' + L('المبلغ المقسط', 'Financed') + ':</b>' + U.money(inst.instTotal) + '</div><div><b>' + L('عدد الأقساط', 'Instalments') + ':</b>' + inst.months + '</div><div><b>' + L('القسط', 'Each') + ':</b>' + U.money(inst.schedule[0].amount) + '</div></div>' : '') +
      A4.termsBlock('sale') + A4.sign(A4.sigs(cu ? cu.name : '', true)) + A4.foot();
  };
  A4.printSale = function (s) { A4.kindNow = 'sale'; A4.print(A4.invoice(s), 'sale'); };

  /* ---------- quotation with the same editable wording ---------- */
  Quote.print = function (q) {
    var d = docCfg(), sh = d.show, cu = q.customer ? H.cust(q.customer) : null, name = q.name || (cu && cu.name) || '';
    var heads = [L('م', '#'), L('الصنف', 'Item')].concat(sh.unit ? [L('الوحدة', 'Unit')] : []).concat([L('الكمية', 'Qty'), L('السعر', 'Price'), L('الإجمالي', 'Total')]);
    var rows = q.items.map(function (i, x) { var p = i.pid && Store.product(i.pid); return [x + 1, U.esc(i.name)].concat(sh.unit ? [U.esc(p ? Meas.unitName(p) : '—')] : []).concat([U.r2(i.qty), U.money(i.price), U.money(i.qty * i.price)]); });
    var tr = [[L('الإجمالي', 'Subtotal'), U.money(q.sub)]]; if (q.disc) tr.push([L('الخصم', 'Discount'), '- ' + U.money(q.disc)]); if (q.vat) tr.push([L('الضريبة', 'VAT'), U.money(q.vat)]); tr.push([L('الصافي', 'Total'), U.money(q.total) + ' ' + cur(), 1]);
    var meta = [[DocLbl('quoteNo'), '<b>' + q.no + '</b>'], [DocLbl('date'), U.dt(q.date)], [DocLbl('to'), U.esc(name || '—')], [DocLbl('mobile'), '<span dir="ltr">' + U.esc(q.phone || (cu && cu.phone) || '—') + '</span>'], [DocLbl('valid'), q.valid || '—'], [DocLbl('by'), U.esc(q.by)]];
    A4.kindNow = 'quote';
    A4.print(A4.head(DocLbl('quoteTitle'), meta) + A4.table(heads, rows) + A4.totals(tr, q.total) + (q.note ? '<div class="terms">' + U.esc(q.note) + '</div>' : '') + A4.termsBlock('quote') + A4.sign(A4.sigs(name, false)) + A4.foot(), 'quote');
  };

  /* ---------- every A4 print goes through a preview first ---------- */
  var raw = A4.print;
  A4.print = function (html, kind) {
    kind = kind || A4.kindNow || 'other'; A4.kindNow = null;
    if (!docCfg().preview) { A4.kindNow = kind; var r = Printer.print(html, { css: A4.css(), printer: homeCfg().a4Printer || '', silent: false, dir: lang() === 'en' ? 'ltr' : 'rtl' }); A4.kindNow = null; return r; }
    DocPrev.open(html, kind);
  };
  A4.rawPrint = raw;
})();

var DocPrev = {
  open: function (html, kind) {
    var d = docCfg(), o = { tpl: d.tpl[kind] || 'classic', paper: d.paper, font: d.font, show: U.clone(d.show) }, en = lang() === 'en';
    var tog = [['logo', 'اللوجو', 'Logo'], ['shop', 'بيانات المحل', 'Shop info'], ['words', 'المبلغ بالحروف', 'Amount in words'], ['terms', 'الشروط', 'Terms'], ['sign', 'التوقيعات', 'Signatures'], ['foot', 'سطر الطباعة', 'Print footer'], ['sigStampOn', 'خانة الختم', 'Stamp box'], ['sigNames', 'الأسماء تحت التوقيع', 'Names under signatures']];
    var m = Modal.open({ size: 'xl', title: '👁️ ' + L('معاينة قبل الطباعة', 'Print preview') + ' — ' + L(DOC_KINDS.filter(function (k) { return k[0] === kind; })[0][1], DOC_KINDS.filter(function (k) { return k[0] === kind; })[0][2]), body: '<div class="grid" style="grid-template-columns:1fr 290px;gap:14px;align-items:start"><div style="background:#8a93a3;border-radius:12px;padding:14px;height:72vh;overflow:auto"><iframe id="dpF" style="width:100%;height:100%;border:0;background:transparent"></iframe></div>' +
      '<div class="col"><label class="f">' + L('التصميم', 'Design') + '<select class="in" id="dpT">' + DOC_TPLS.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === o.tpl ? ' selected' : '') + '>' + t[3] + ' ' + L(t[1], t[2]) + '</option>'; }).join('') + '</select></label><div class="grid g2"><label class="f">' + L('المقاس', 'Paper') + '<select class="in" id="dpP">' + ['A4', 'A5', 'Letter'].map(function (p) { return '<option' + (p === o.paper ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label><label class="f">' + L('حجم الكلام', 'Text size') + ' <b id="dpFv">' + o.font + '%</b><input type="range" id="dpFs" min="70" max="140" step="5" value="' + o.font + '"></label></div>' +
      tog.map(function (t) { return '<label class="row small"><input type="checkbox" class="sw" data-sh="' + t[0] + '"' + (o.show[t[0]] ? ' checked' : '') + '> ' + L(t[1], t[2]) + '</label>'; }).join('') +
      (can('settings') ? '<button class="btn" id="dpSave">💾 ' + L('خلّي ده الافتراضي', 'Make this the default') + '</button>' : '') + '<button class="btn" id="dpSet">⚙️ ' + L('تعديل الكلام والشروط', 'Edit wording & terms') + '</button><div class="muted small">' + L('الطباعة هتطلع زي المعاينة بالظبط.', 'The print matches this preview.') + '</div></div></div>',
      foot: '<button class="btn" data-n>' + L('إغلاق', 'Close') + '</button><button class="btn pri lg" id="dpGo">🖨️ ' + L('طباعة', 'Print') + '</button>' });
    var cssNow = function () { var keep = { tpl: U.clone(d.tpl), paper: d.paper, font: d.font, show: U.clone(d.show) }; d.tpl[kind] = o.tpl; d.paper = o.paper; d.font = o.font; d.show = o.show; A4.kindNow = kind; var c = A4.css(); A4.kindNow = null; d.tpl = keep.tpl; d.paper = keep.paper; d.font = keep.font; d.show = keep.show; return c; };
    var draw = function () {
      var w = { A4: 210, A5: 148, Letter: 216 }[o.paper] || 210, hgt = { A4: 297, A5: 210, Letter: 279 }[o.paper] || 297;
      $('#dpF', m).srcdoc = '<!doctype html><html dir="' + (en ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><style>' + cssNow().replace(/@page\{[^}]*\}/, '') + 'html{background:#8a93a3}body{background:#fff;width:' + w + 'mm;min-height:' + hgt + 'mm;margin:0 auto;padding:' + (String(d.margin) === '0' ? 0 : (U.n(d.margin) || 10)) + 'mm;box-sizing:border-box;box-shadow:0 6px 24px rgba(0,0,0,.35)}</style></head><body>' + html + '</body></html>';
    };
    $('#dpT', m).onchange = function () { o.tpl = this.value; draw(); };
    $('#dpP', m).onchange = function () { o.paper = this.value; draw(); };
    $('#dpFs', m).oninput = function () { o.font = +this.value; $('#dpFv', m).textContent = o.font + '%'; draw(); };
    $$('[data-sh]', m).forEach(function (c) { c.onchange = function () { o.show[c.dataset.sh] = c.checked; draw(); }; });
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    if ($('#dpSave', m)) $('#dpSave', m).onclick = function () { d.tpl[kind] = o.tpl; d.paper = o.paper; d.font = o.font; d.show = o.show; Store.log('doc.design', kind + ' ' + o.tpl); Store.save(); toast('💾 ' + L('اتحفظ كافتراضي', 'Saved as default'), 'ok'); };
    $('#dpSet', m).onclick = function () { Modal.close(m); DocSet.open(); };
    $('#dpGo', m).onclick = function () { Printer.print(html, { css: cssNow(), printer: homeCfg().a4Printer || '', silent: false, dir: en ? 'ltr' : 'rtl' }); Modal.close(m); };
    draw();
  }
};

/* ---------- settings: wording, terms, designs ---------- */
var DocSet = {
  open: function () {
    if (!can('settings')) return toast(L('ده من صلاحية المدير', 'Admin only'), 'bad');
    var d = docCfg(), w = U.clone(d);
    var LB = [['saleTitle', 'عنوان فاتورة البيع'], ['saleNo', 'كلمة «رقم الفاتورة»'], ['retTitle', 'عنوان فاتورة المرتجع'], ['quoteTitle', 'عنوان عرض السعر'], ['quoteNo', 'كلمة «رقم العرض»'], ['to', 'كلمة العميل (بدل «السادة»)'], ['mobile', 'كلمة «الموبايل»'], ['address', 'كلمة «العنوان»'], ['date', 'كلمة «التاريخ»'], ['valid', 'كلمة «ساري حتى»'], ['by', 'كلمة «مقدم العرض»'], ['seller', 'كلمة «البائع»'], ['termsTitle', 'عنوان الشروط'], ['sigCust', 'توقيع العميل'], ['sigMgr', 'توقيع المسئول'], ['sigStamp', 'خانة الختم'], ['mgrName', 'اسم المسئول تحت التوقيع (فاضي = اسم صاحب المحل)']];
    var SH = [['logo', 'اللوجو'], ['shop', 'بيانات المحل تحت الاسم'], ['words', 'المبلغ بالحروف'], ['terms', 'الشروط'], ['sign', 'خانات التوقيع'], ['sigNames', 'اسم العميل واسم المسئول تحت التوقيع'], ['sigCustOn', 'خانة توقيع العميل'], ['sigMgrOn', 'خانة توقيع المسئول'], ['sigStampOn', 'خانة الختم (فاتورة البيع)'], ['foot', 'سطر «طُبع بواسطة»'], ['unit', 'عمود الوحدة'], ['warranty', 'عمود الضمان'], ['payments', 'طرق الدفع والباقي في الفاتورة'], ['seller', 'اسم البائع']];
    var m = Modal.open({ size: 'xl', sticky: true, title: '🧾 ' + L('شكل الفواتير وعروض الأسعار والمستندات', 'Invoice, quotation & document layout'), body: '<div class="grid" style="grid-template-columns:1fr 1fr;gap:16px;align-items:start"><div class="col">' +
      '<div class="card col"><b>🎨 ' + L('التصميم لكل نوع', 'Design per document') + '</b>' + DOC_KINDS.map(function (k) { return '<label class="f">' + L(k[1], k[2]) + '<div class="row"><select class="in grow" data-tp="' + k[0] + '">' + DOC_TPLS.map(function (t) { return '<option value="' + t[0] + '"' + (w.tpl[k[0]] === t[0] ? ' selected' : '') + '>' + t[3] + ' ' + L(t[1], t[2]) + '</option>'; }).join('') + '</select><button class="btn sm" data-pv="' + k[0] + '">👁️ ' + L('معاينة', 'Preview') + '</button></div></label>'; }).join('') +
      '<div class="grid g3"><label class="f">' + L('المقاس', 'Paper') + '<select class="in" id="dsP">' + ['A4', 'A5', 'Letter'].map(function (p) { return '<option' + (p === w.paper ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label><label class="f">' + L('حجم الكلام %', 'Text size %') + '<input class="in num" type="number" id="dsF" min="70" max="140" step="5" value="' + w.font + '"></label><label class="f">' + L('الهامش (مم)', 'Margin (mm)') + '<input class="in num" type="number" id="dsM" min="3" max="25" value="' + w.margin + '"></label></div>' +
      '<label class="row small"><input type="checkbox" class="sw" id="dsPv"' + (w.preview ? ' checked' : '') + '> ' + L('اعرض المستند قبل الطباعة دايماً', 'Always preview before printing') + '</label></div>' +
      '<div class="card col"><b>👁️ ' + L('يظهر في الطباعة', 'Shown on prints') + '</b><div class="grid g2">' + SH.map(function (x) { return '<label class="row small"><input type="checkbox" class="sw" data-sh="' + x[0] + '"' + (w.show[x[0]] ? ' checked' : '') + '> ' + x[1] + '</label>'; }).join('') + '</div></div>' +
      '<div class="card col"><b>✍️ ' + L('الكلام المكتوب في المستندات', 'Wording') + '</b><div class="grid g2">' + LB.map(function (x) { return '<label class="f">' + x[1] + '<input class="in" data-lb="' + x[0] + '" value="' + U.esc(w.lbl[x[0]] || '') + '"' + (x[0] === 'mgrName' ? ' placeholder="' + U.esc(S().ownerName || '') + '"' : '') + '></label>'; }).join('') + '</div><div class="muted small">' + L('أي خانة توقيع تسيب اسمها فاضي بتختفي من الطباعة.', 'A signature box with an empty label is not printed.') + '</div><button class="btn sm" id="dsRL">↺ ' + L('رجّع الكلام للافتراضي', 'Reset wording') + '</button></div></div>' +
      '<div class="col">' + ['sale', 'quote'].map(function (k) { return '<div class="card col"><b>📜 ' + (k === 'sale' ? L('الجمل اللي تحت فاتورة البيع', 'Lines under the sales invoice') : L('الجمل اللي تحت عرض السعر', 'Lines under the quotation')) + '</b><div data-tl="' + k + '"></div><div class="row"><input class="in grow" data-ta="' + k + '" placeholder="' + L('اكتب جملة جديدة…', 'New line…') + '"><button class="btn" data-tb="' + k + '">➕</button></div><div class="muted small">' + L('علّم عشان تظهر، شيل العلامة عشان تختفي، أو امسحها خالص.', 'Tick to show, untick to hide, or delete.') + '</div></div>'; }).join('') + '</div></div>',
      foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri lg" id="dsGo">💾 ' + L('حفظ', 'Save') + '</button>' });
    var drawT = function (k) {
      var box = $('[data-tl="' + k + '"]', m);
      box.innerHTML = w.terms[k].map(function (x, i) { return '<div class="row" style="margin-bottom:6px"><input type="checkbox" data-to="' + k + ':' + i + '"' + (x.on ? ' checked' : '') + '><input class="in grow" data-tt="' + k + ':' + i + '" value="' + U.esc(x.t) + '"><button class="btn sm ghost" data-tu="' + k + ':' + i + '" title="' + L('لفوق', 'Up') + '">▲</button><button class="btn sm ghost" data-td="' + k + ':' + i + '" style="color:var(--bad)">✕</button></div>'; }).join('') || '<div class="muted small">—</div>';
      var at = function (s) { var a = s.split(':'); return [a[0], +a[1]]; };
      $$('[data-to]', box).forEach(function (c) { c.onchange = function () { var p = at(c.dataset.to); w.terms[p[0]][p[1]].on = c.checked; }; });
      $$('[data-tt]', box).forEach(function (c) { c.oninput = function () { var p = at(c.dataset.tt); w.terms[p[0]][p[1]].t = c.value; }; });
      $$('[data-td]', box).forEach(function (c) { c.onclick = function () { var p = at(c.dataset.td); w.terms[p[0]].splice(p[1], 1); drawT(p[0]); }; });
      $$('[data-tu]', box).forEach(function (c) { c.onclick = function () { var p = at(c.dataset.tu); if (!p[1]) return; var a = w.terms[p[0]], x = a.splice(p[1], 1)[0]; a.splice(p[1] - 1, 0, x); drawT(p[0]); }; });
    };
    ['sale', 'quote'].forEach(function (k) { drawT(k); $('[data-tb="' + k + '"]', m).onclick = function () { var i = $('[data-ta="' + k + '"]', m), v = i.value.trim(); if (!v) return; w.terms[k].push({ t: v, on: true }); i.value = ''; drawT(k); }; });
    var collect = function () {
      $$('[data-tp]', m).forEach(function (s) { w.tpl[s.dataset.tp] = s.value; });
      w.paper = $('#dsP', m).value; w.font = Math.max(70, Math.min(140, U.n($('#dsF', m).value) || 100)); w.margin = Math.max(3, Math.min(25, U.n($('#dsM', m).value) || 10)); w.preview = $('#dsPv', m).checked;
      $$('[data-sh]', m).forEach(function (c) { w.show[c.dataset.sh] = c.checked; }); $$('[data-lb]', m).forEach(function (i) { w.lbl[i.dataset.lb] = i.value.trim(); });
    };
    $('#dsRL', m).onclick = function () { var h = homeCfg(), keep = h.doc; h.doc = { terms: keep.terms }; var fresh = docCfg().lbl; h.doc = keep; $$('[data-lb]', m).forEach(function (i) { i.value = fresh[i.dataset.lb] || ''; }); };
    $$('[data-pv]', m).forEach(function (b) { b.onclick = function () {
      collect(); var keep = homeCfg().doc; homeCfg().doc = U.clone(w);
      try { var k = b.dataset.pv, s = Store.db.sales.filter(function (x) { return x.type === 'sale' && !x.void; }).slice(-1)[0], q = (Store.db.quotes || []).slice(-1)[0];
        if (k === 'sale') { if (!s) toast(L('مفيش فاتورة بيع للمعاينة', 'No sale to preview'), 'bad'); else A4.printSale(s); }
        else if (k === 'quote') { if (!q) toast(L('مفيش عرض سعر للمعاينة', 'No quotation to preview'), 'bad'); else Quote.print(q); }
        else { var c = (Store.db.inst || [])[0]; if (c) Inst.printContract(c); else Views.warehouses.print({ no: 0, date: Date.now(), from: Wh.def(), to: Wh.def(), items: [], note: '' }); }
      } finally { setTimeout(function () { homeCfg().doc = keep; }, 50); }
    }; });
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#dsGo', m).onclick = function () { collect(); homeCfg().doc = w; Store.log('doc.settings', 'saved'); Store.save(); Modal.close(m); toast('💾 ' + L('اتحفظ شكل المستندات', 'Document layout saved'), 'ok'); };
  }
};
(function () {
  var st = Views.settings;
  Views.settings = function (el) {
    st.apply(this, arguments); var g = $('.grid', el); if (!g || !can('settings')) return;
    var d = docCfg(), c = document.createElement('div'); c.className = 'card col'; c.style.gridColumn = '1 / -1';
    c.innerHTML = '<div class="row"><h3 class="grow">🧾 ' + L('شكل الفواتير وعروض الأسعار والمستندات A4', 'Invoice, quotation & A4 document layout') + '</h3><button class="btn pri" id="dsOpen">⚙️ ' + L('تعديل الشكل والكلام والشروط', 'Edit layout, wording & terms') + '</button></div><div class="grid g3">' + DOC_KINDS.map(function (k) { var t = DOC_TPLS.filter(function (x) { return x[0] === d.tpl[k[0]]; })[0] || DOC_TPLS[0]; return '<div class="card" style="padding:10px;background:var(--panel2)"><div class="muted small">' + L(k[1], k[2]) + '</div><b>' + t[3] + ' ' + L(t[1], t[2]) + '</b></div>'; }).join('') + '</div><div class="muted small">' + L('6 تصميمات (كلاسيك، عصري، بسيط موفّر للحبر، رسمي بمربعات، فخم، مضغوط نص صفحة) — وكل كلمة وكل جملة في الفاتورة تقدر تغيّرها أو تخفيها، والمعاينة بتظهر قبل أي طباعة.', '6 designs; every word and line is editable; preview before printing.') + '</div>';
    g.appendChild(c); $('#dsOpen', c).onclick = DocSet.open;
  };
})();

/* ================= developer reset tools ================= */
var Reset = {
  SHOP_KEYS: ['shopName', 'shopNameEn', 'slogan', 'ownerName', 'shopPhone', 'shopPhone2', 'phones', 'whatsapp', 'facebook', 'instagram', 'shopAddress', 'taxNo', 'crNo', 'logo', 'currency', 'currencyEn', 'lang'],
  GROUPS: [
    ['sales', '🧾 المبيعات والمرتجعات والفواتير المعلقة والحجز', ['sales', 'held', 'layaways', 'trash'], ['invoice'], true],
    ['purchases', '🚚 المشتريات ومرتجعات الموردين وطلبات الشراء', ['purchases', 'porders'], ['purchase'], true],
    ['moves', '📦 حركات المخزن والجرد وتاريخ الأسعار وتحويلات المخازن', ['moves', 'counts', 'priceHistory', 'transfers'], ['transfer'], true],
    ['shifts', '🕐 الورديات والمصروفات', ['shifts', 'expenses'], ['shift'], true],
    ['inst', '🏦 عقود التقسيط', ['inst'], ['inst'], true],
    ['brides', '💍 ملفات العرائس', ['brides'], ['bride'], true],
    ['orders', '🪟 أوامر تفصيل الستائر والسجاد', ['orders'], ['order'], true],
    ['deliveries', '🚚 مواعيد التوصيل والتركيب', ['deliveries'], ['delivery'], true],
    ['quotes', '📝 عروض الأسعار', ['quotes'], ['quote'], true],
    ['supinst', '🏭 أقساط الموردين', ['supInst'], ['supInst'], true],
    ['log', '📋 سجل العمليات', ['log'], [], true],
    ['promos', '🎁 العروض والكوبونات وكروت الهدايا', ['promos', 'coupons', 'giftcards'], [], false],
    ['customers', '👥 العملاء', ['customers'], [], false],
    ['suppliers', '🏭 الموردين', ['suppliers'], [], false],
    ['products', '📦 الأصناف', ['products'], ['barcode'], false],
    ['cats', '🗂️ الأقسام والبنود الفرعية', [], [], false],
    ['users', '👤 المستخدمين (ماعدا المدير الأساسي)', [], [], false]
  ],
  backup: function () { try { if (typeof Backup !== 'undefined' && Backup.run) Backup.run('before-reset'); } catch (e) { } Store.saveNow && Store.saveNow(); },
  confirm: function (msg, word, cb) {
    var m = Modal.open({ title: '⚠️ ' + L('تأكيد', 'Confirm'), body: '<div class="col"><div>' + msg + '</div><div class="chip warn" style="white-space:normal">💾 ' + L('هيتعمل نسخة احتياطية تلقائي قبل التنفيذ', 'A backup is taken automatically first') + '</div><label class="f">' + L('اكتب كلمة «', 'Type «') + word + L('» للتأكيد', '» to confirm') + '<input class="in" id="rsW" autofocus></label></div>', foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri" id="rsGo" style="background:var(--bad)">' + L('تنفيذ', 'Run') + '</button>' });
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#rsGo', m).onclick = function () { if ($('#rsW', m).value.trim() !== word) return toast(L('الكلمة مش مطابقة', 'Word does not match'), 'bad'); Modal.close(m); Reset.backup(); cb(); };
  },
  settings: function (keep) {
    var s = S(), d = defaultDB().settings, out = d;
    Reset.SHOP_KEYS.forEach(function (k) { if (keep.shop && s[k] !== undefined) out[k] = s[k]; });
    out.dev = s.dev; // developer settings, feature switches and locks always stay
    if (keep.backup) out.backup = s.backup; if (keep.printers) { out.printers = s.printers; if (s.home) out.home = { a4Printer: s.home.a4Printer }; }
    if (keep.cats) { out.categories = s.categories; out.subs = s.subs; out.catPin = s.catPin; out.subPin = s.subPin; }
    if (keep.tiers) { out.tiers = s.tiers; out.payMethods = s.payMethods; }
    Store.db.settings = out; Store.log('dev.reset.settings', JSON.stringify(keep)); Store.saveNow(); setTimeout(function () { location.reload(); }, 400);
  },
  data: function (sel, opt) {
    var db = Store.db, all = Object.keys(db).filter(function (k) { return Array.isArray(db[k]); }), known = [];
    Reset.GROUPS.forEach(function (g) { known = known.concat(g[2]); });
    Reset.GROUPS.forEach(function (g) {
      if (!sel[g[0]]) return;
      g[2].forEach(function (k) { if (Array.isArray(db[k])) db[k] = []; });
      g[3].forEach(function (k) { if (db.seq[k] != null) db.seq[k] = 0; });
      if (g[0] === 'cats') { S().categories = []; S().subs = {}; S().catPin = []; S().subPin = []; }
      if (g[0] === 'users') db.users = db.users.filter(function (u) { return u.role === 'admin' && (u.username === 'admin' || u.id === App.user.id); });
    });
    if (sel.other) all.forEach(function (k) { if (known.indexOf(k) < 0 && ['users', 'products', 'customers', 'suppliers'].indexOf(k) < 0) db[k] = []; });
    if (opt.zeroStock) db.products.forEach(function (p) { p.stock = 0; p.wh = {}; });
    if (opt.zeroCust) db.customers.forEach(function (c) { c.balance = 0; c.points = 0; c.payments = []; c.spent = 0; c.visits = 0; });
    if (opt.zeroSup) db.suppliers.forEach(function (s) { s.balance = 0; s.payments = []; });
    if (sel.sales) App.cart = newCart();
    Store.reindex && Store.reindex(); Store.log('dev.reset.data', Object.keys(sel).filter(function (k) { return sel[k]; }).join(',')); Store.saveNow();
    toast('🧹 ' + L('اتمسحت البيانات المختارة', 'Selected data cleared'), 'ok'); go('dev');
  },
  factory: function (keepDev) {
    var dev = S().dev;
    Store.init();
    Sec.hash('1234').then(function (h) {
      Store.db.users.push({ id: U.id(), username: 'admin', name: L('المدير', 'Administrator'), role: 'admin', salt: h.salt, hash: h.hash, perms: allPerms(true), active: true, mustChange: true });
      if (keepDev && dev) Store.db.settings.dev = dev;
      Store.saveNow(); setTimeout(function () { location.reload(); }, 400);
    });
  },
  card: function () {
    var c = document.createElement('div'); c.className = 'card col'; c.style.gridColumn = '1 / -1';
    var db = Store.db, cnt = function (keys) { return keys.reduce(function (a, k) { return a + (Array.isArray(db[k]) ? db[k].length : 0); }, 0); };
    var known = []; Reset.GROUPS.forEach(function (g) { known = known.concat(g[2]); });
    var others = Object.keys(db).filter(function (k) { return Array.isArray(db[k]) && known.indexOf(k) < 0 && ['users', 'products', 'customers', 'suppliers'].indexOf(k) < 0 && db[k].length; });
    c.innerHTML = '<h3>🧹 ' + L('تصفير وإعادة ضبط السيستم', 'Reset tools') + '</h3><div class="muted small">' + L('كل عملية بتاخد نسخة احتياطية الأول، والتفعيل وإعدادات المطوّر مش بيتلمسوا.', 'Every action backs up first; activation and developer settings are never touched.') + '</div>' +
      '<div class="grid g3" style="align-items:start">' +
      '<div class="card col" style="background:var(--panel2)"><b>↺ ' + L('1) رجّع الإعدادات للافتراضي', '1) Reset settings to default') + '</b><div class="muted small">' + L('البيانات (مبيعات، أصناف، عملاء…) مش بتتمسح.', 'Data is kept.') + '</div>' +
      [['shop', 'احتفظ ببيانات المحل (الاسم، اللوجو، التليفونات، العنوان)', 1], ['backup', 'احتفظ بأماكن النسخ الاحتياطي', 1], ['printers', 'احتفظ بالطابعات', 1], ['cats', 'احتفظ بالأقسام والبنود', 1], ['tiers', 'احتفظ بشرائح الأسعار وطرق الدفع', 1]].map(function (x) { return '<label class="row small"><input type="checkbox" class="sw" data-ks="' + x[0] + '"' + (x[2] ? ' checked' : '') + '> ' + x[1] + '</label>'; }).join('') + '<button class="btn" id="rsSet">↺ ' + L('رجّع الإعدادات', 'Reset settings') + '</button></div>' +
      '<div class="card col" style="background:var(--panel2)"><b>🗑️ ' + L('2) امسح البيانات — واختار اللي يفضل', '2) Clear data — choose what stays') + '</b><div class="row wrap" style="gap:6px"><button class="btn sm" id="rsP1">' + L('الحركات بس', 'Transactions only') + '</button><button class="btn sm" id="rsP2">' + L('كل البيانات', 'All data') + '</button><button class="btn sm" id="rsP0">' + L('ولا حاجة', 'None') + '</button></div><div class="col" style="gap:4px;max-height:300px;overflow:auto">' +
      Reset.GROUPS.map(function (g) { var n = g[0] === 'cats' ? (S().categories || []).length : g[0] === 'users' ? db.users.length - 1 : cnt(g[2]); return '<label class="row small"><input type="checkbox" data-g="' + g[0] + '"' + (g[4] ? ' checked' : '') + '> <span class="grow">' + g[1] + '</span><span class="chip">' + n + '</span></label>'; }).join('') + (others.length ? '<label class="row small"><input type="checkbox" data-g="other" checked> <span class="grow">🧩 ' + L('بيانات تانية: ', 'Other: ') + others.join('، ') + '</span></label>' : '') + '</div>' +
      '<b class="small">' + L('لو الأصناف أو العملاء أو الموردين هيفضلوا:', 'If kept:') + '</b><label class="row small"><input type="checkbox" class="sw" id="rsZs"> ' + L('صفّر كميات المخزن', 'Zero the stock quantities') + '</label><label class="row small"><input type="checkbox" class="sw" id="rsZc" checked> ' + L('صفّر حسابات العملاء (الآجل والنقاط)', 'Zero customer balances') + '</label><label class="row small"><input type="checkbox" class="sw" id="rsZp" checked> ' + L('صفّر حسابات الموردين', 'Zero supplier balances') + '</label><button class="btn" id="rsData" style="color:var(--bad)">🗑️ ' + L('امسح المختار', 'Clear selected') + '</button></div>' +
      '<div class="card col" style="background:var(--panel2)"><b>🏭 ' + L('3) ضبط المصنع — يرجع كأنه أول مرة يتفتح', '3) Factory reset — like the first run') + '</b><div class="muted small">' + L('كل البيانات والإعدادات بتتمسح، ودخول المدير بيرجع admin / 1234، وبيطلب بيانات المحل من الأول. التفعيل بيفضل زي ما هو.', 'Everything is wiped; admin / 1234; shop setup runs again. Activation stays.') + '</div><label class="row small"><input type="checkbox" class="sw" id="rsKd" checked> ' + L('احتفظ بإعدادات المطوّر (المميزات والأقفال)', 'Keep developer settings') + '</label><button class="btn" id="rsFac" style="background:var(--bad);color:#fff">🏭 ' + L('ضبط المصنع', 'Factory reset') + '</button></div></div>';
    $('#rsSet', c).onclick = function () { var keep = {}; $$('[data-ks]', c).forEach(function (x) { keep[x.dataset.ks] = x.checked; }); Reset.confirm(L('كل الإعدادات هترجع للافتراضي (التصميم، الفاتورة، الصلاحيات الافتراضية، التقسيط…).', 'All settings go back to default.'), L('افتراضي', 'default'), function () { Reset.settings(keep); }); };
    var setAll = function (f) { $$('[data-g]', c).forEach(function (x) { x.checked = f(x.dataset.g); }); };
    $('#rsP1', c).onclick = function () { setAll(function (g) { var G = Reset.GROUPS.filter(function (x) { return x[0] === g; })[0]; return g === 'other' || (G && G[4]); }); };
    $('#rsP2', c).onclick = function () { setAll(function () { return true; }); };
    $('#rsP0', c).onclick = function () { setAll(function () { return false; }); };
    $('#rsData', c).onclick = function () {
      var sel = {}; $$('[data-g]', c).forEach(function (x) { sel[x.dataset.g] = x.checked; });
      var names = Reset.GROUPS.filter(function (g) { return sel[g[0]]; }).map(function (g) { return g[1]; }); if (sel.other) names.push('🧩 ' + L('بيانات تانية', 'Other data'));
      if (!names.length) return toast(L('اختار حاجة تتمسح', 'Pick something to clear'), 'bad');
      var opt = { zeroStock: $('#rsZs', c).checked, zeroCust: $('#rsZc', c).checked, zeroSup: $('#rsZp', c).checked };
      Reset.confirm(L('هيتمسح:', 'Will be cleared:') + '<br>' + names.join('<br>') + '<br><br>' + L('والإعدادات كلها هتفضل.', 'All settings stay.'), L('مسح', 'clear'), function () { Reset.data(sel, opt); });
    };
    $('#rsFac', c).onclick = function () { var kd = $('#rsKd', c).checked; Reset.confirm(L('السيستم كله هيتمسح ويرجع جديد كأنه أول مرة يتفتح.', 'The whole system will be wiped like new.'), L('ضبط المصنع', 'factory'), function () { Reset.factory(kd); }); };
    return c;
  }
};
(function () {
  var dv = Views.dev;
  Views.dev = function (el) { dv.apply(this, arguments); if (!Dev.unlocked) return; var host = $('.grid', el) || el; host.appendChild(Reset.card()); };
})();
/* POS invoices printed on A4 paper use the «sales invoice» design */
(function () {
  var rh = Receipt.html, rc = Receipt.css;
  Receipt.html = function () { A4.kindNow = 'sale'; try { return rh.apply(this, arguments); } finally { A4.kindNow = null; } };
  Receipt.css = function () { A4.kindNow = 'sale'; try { return rc.apply(this, arguments); } finally { A4.kindNow = null; } };
})();
