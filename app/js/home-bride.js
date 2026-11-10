/* Ghandi Home — bridal files (تجهيز العرائس) and quotations (عروض الأسعار)
   Eng. Mohamed Ali — 01098811581 */
'use strict';
var BRIDE_LIST = [
  ['أجهزة كهربائية', ['ثلاجة', 'ديب فريزر', 'غسالة أوتوماتيك', 'بوتاجاز', 'شاشة', 'تكييف', 'ميكروويف', 'سخان', 'مكنسة كهربائية', 'خلاط', 'كبة / محضر طعام', 'مكواة', 'مروحة', 'غلاية', 'حلة ضغط كهربائية']],
  ['مطبخ وسفرة', ['طقم صيني', 'طقم أركوبال', 'طقم حلل جرانيت', 'طقم حلل استانلس', 'طقم طاسات', 'طقم صواني', 'طقم كاسات', 'طقم فناجين وقهوة', 'طقم شاي', 'طقم معالق وشوك', 'أدوات مطبخ', 'علب تخزين', 'مفرش سفرة']],
  ['مفروشات', ['أطقم ملايات', 'بطاطين', 'لحاف', 'مخدات', 'فوط وبشاكير', 'برنس', 'مفارش', 'طقم سرير عروسة']],
  ['سجاد وستائر', ['سجاد الصالون', 'سجاد غرفة النوم', 'سجاد الأطفال', 'ممرات', 'دواسات', 'ستائر الصالون', 'ستائر غرفة النوم', 'ستائر المطبخ']],
  ['موبيليا', ['أنتريه', 'غرفة نوم', 'سفرة', 'ترابيزات', 'نيش']]
];
var Bride = {
  total: function (b, f) { return U.r2(H.sum(b.items, function (i) { return (!f || f(i)) ? i.qty * i.price : 0; })); },
  delivered: function (b) { return Bride.total(b, function (i) { return i.status === 'delivered'; }); },
  credit: function (b) { return U.r2(H.paid(b) - U.n(b.used)); }, // deposits not yet used on an invoice
  rest: function (b) { return U.r2(Bride.total(b) - H.paid(b) - U.n(b.creditUsed)); },
  fromCart: function () {
    var c = App.cart; if (!c.items.length) return toast(L('ضيف أصناف الأول', 'Add items first'), 'bad');
    var open = (Store.db.brides || []).filter(function (b) { return b.status === 'open'; });
    var m = Modal.open({ title: '💍 ' + L('إضافة الأصناف لملف عروسة', 'Add items to a bridal file'), body: '<div class="col">' + (open.length ? '<label class="f">' + L('اختار الملف', 'Choose file') + '<select class="in" id="bfS">' + open.map(function (b) { return '<option value="' + b.id + '">#' + b.no + ' — ' + U.esc(b.bride || H.custName(b.customer)) + (b.wedding ? ' (' + b.wedding + ')' : '') + '</option>'; }).join('') + '</select></label>' : '<div class="muted">' + L('مفيش ملفات مفتوحة — هيتعمل ملف جديد', 'No open files — a new one will be created') + '</div>') + '<div class="muted small">' + L('الأصناف هتتضاف كـ«محجوزة للعروسة» وتتشال من المعروض، والتسليم والفاتورة من صفحة الملف.', 'Items are reserved for the bride; delivery and invoicing happen from the file.') + '</div></div>',
      foot: '<button class="btn" id="bfN">➕ ' + L('ملف جديد', 'New file') + '</button>' + (open.length ? '<button class="btn pri" id="bfGo">✅ ' + L('إضافة', 'Add') + '</button>' : '') });
    var addTo = function (b) { c.items.forEach(function (i) { b.items.push({ id: U.id(), pid: i.pid, name: i.name, qty: i.qty, price: i.price, cost: i.cost, cat: (Store.product(i.pid) || {}).cat || '', status: 'reserved' }); if (i.pid) Store.move(i.pid, -i.qty, 'reserve', 'B#' + b.no); }); Store.log('bride.items', 'B#' + b.no + ' +' + c.items.length); Store.save(); App.cart = newCart(); go('brides'); Views.brides.open(b); };
    $('#bfN', m).onclick = function () { Modal.close(m); Bride.edit(null, function (b) { addTo(b); }, c.customer); };
    if ($('#bfGo', m)) $('#bfGo', m).onclick = function () { var b = open.filter(function (x) { return x.id === $('#bfS', m).value; })[0]; Modal.close(m); addTo(b); };
  },
  edit: function (b, done, custId) {
    var isNew = !b; b = b || { customer: custId || '', bride: '', groom: '', wedding: '', address: '', budget: 0, note: '' };
    var m = Modal.open({ size: 'wide', title: '💍 ' + (isNew ? L('ملف عروسة جديد', 'New bridal file') : L('بيانات الملف #', 'File #') + b.no), body: '<div class="col"><div id="beC"></div><div class="grid g3"><label class="f">' + L('اسم العروسة', 'Bride') + '<input class="in" id="beB" value="' + U.esc(b.bride) + '"></label><label class="f">' + L('اسم العريس', 'Groom') + '<input class="in" id="beG" value="' + U.esc(b.groom) + '"></label><label class="f">' + L('ميعاد الفرح', 'Wedding date') + '<input class="in" type="date" id="beW" value="' + U.esc(b.wedding) + '"></label></div><div class="grid g3"><label class="f">' + L('عنوان الشقة (للتوصيل)', 'Flat address (delivery)') + '<input class="in" id="beA" value="' + U.esc(b.address) + '"></label><label class="f">' + L('الميزانية المتوقعة', 'Budget') + '<input class="in num" type="number" id="beBu" value="' + (b.budget || '') + '"></label><label class="f">' + L('ملاحظات', 'Notes') + '<input class="in" id="beN" value="' + U.esc(b.note) + '"></label></div>' +
      (isNew ? '<label class="row small"><input type="checkbox" class="sw" id="beL" checked> ' + L('ضيف قائمة الجهاز الجاهزة (تقدر تشيل اللي مش محتاجاه)', 'Add the standard bridal checklist') + '</label>' : '') + '</div>',
      foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri" id="beGo">💾 ' + L('حفظ', 'Save') + '</button>' });
    var cb = H.custBox($('#beC', m), b.customer, 'bride');
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#beGo', m).onclick = function () {
      var cu = cb.get(); if (!cu) return;
      b.customer = cu.id; b.bride = $('#beB', m).value.trim() || cu.name; b.groom = $('#beG', m).value.trim(); b.wedding = $('#beW', m).value; b.address = $('#beA', m).value.trim(); b.budget = U.n($('#beBu', m).value); b.note = $('#beN', m).value;
      if (b.address && !cu.address) cu.address = b.address;
      if (isNew) {
        var db = Store.db; db.seq.bride++; b.id = U.id(); b.no = db.seq.bride; b.date = Date.now(); b.items = []; b.pays = []; b.status = 'open'; b.by = App.user.name; b.used = 0;
        if ($('#beL', m).checked) BRIDE_LIST.forEach(function (g) { g[1].forEach(function (n) { b.items.push({ id: U.id(), pid: null, name: n, qty: 1, price: 0, cat: g[0], status: 'planned' }); }); });
        db.brides.push(b); Store.log('bride.new', 'B#' + b.no);
      }
      Store.save(); Modal.close(m); if (done) done(b);
    };
  },
  // deliver chosen lines → a real invoice paid from the bride's deposits first
  deliver: function (b, ids, after) {
    if (shiftsOn() && !App.shift) return toast(L('افتح وردية أولاً', 'Open a shift first'), 'bad');
    var lines = b.items.filter(function (i) { return ids.indexOf(i.id) >= 0 && i.status !== 'delivered'; });
    if (!lines.length) return toast(L('اختار أصناف للتسليم', 'Pick items to deliver'), 'bad');
    var zero = lines.filter(function (i) { return !(i.price > 0); })[0]; if (zero) return toast(L('حدد سعر: ', 'Set a price for: ') + zero.name, 'bad');
    var noStock = lines.filter(function (i) { if (!i.pid || i.status === 'reserved') return false; var p = Store.product(i.pid); return p && !S().allowNegativeStock && U.n(p.stock) < i.qty; })[0];
    if (noStock) return toast(L('الكمية مش متاحة: ', 'Not in stock: ') + noStock.name, 'bad');
    var tot = U.r2(H.sum(lines, function (i) { return i.qty * i.price; })), cr = Math.max(0, Bride.credit(b)), fromDep = U.r2(Math.min(cr, tot)), due = U.r2(tot - fromDep);
    var finish = function (pays, credit) {
      // reserved lines already left the stock → release the reservation, the invoice takes it out again
      lines.forEach(function (i) { if (i.status === 'reserved' && i.pid) Store.move(i.pid, i.qty, 'unreserve', 'B#' + b.no); });
      if (fromDep) pays.bride = fromDep;
      var s = Sales.create({ type: 'sale', items: lines.map(function (i) { return { pid: i.pid, name: i.name, qty: i.qty, price: i.price, cost: i.cost || (Store.product(i.pid) || {}).cost || 0 }; }), customer: b.customer, subtotal: tot, discount: 0, vat: 0, total: tot, payments: pays, paid: U.r2(tot - credit), change: 0, credit: credit });
      s.brideNo = b.no; b.used = U.r2(U.n(b.used) + fromDep);
      lines.forEach(function (i) { i.status = 'delivered'; i.saleNo = s.no; i.dlvAt = Date.now(); });
      if (b.items.every(function (i) { return i.status === 'delivered' || i.skip; })) b.status = 'done';
      Store.log('bride.deliver', 'B#' + b.no + ' → #' + s.no); Store.save();
      toast('✅ ' + L('اتسلّم — فاتورة #', 'Delivered — invoice #') + s.no, 'ok');
      if (F('a4')) A4.printSale(s);
      if (F('deliveries') && can('deliveries')) Modal.confirm(L('تحب تحدد ميعاد توصيل للحاجات دي؟', 'Schedule a delivery for these items?'), function () { Dlv.edit(null, { sale: s, address: b.address }); });
      if (after) after();
    };
    if (due <= 0.009) return Modal.confirm(L('تسليم ', 'Deliver ') + lines.length + L(' صنف بقيمة ', ' items worth ') + U.money(tot) + L(' — هيتخصم بالكامل من مدفوعات العروسة.', ' — fully covered by deposits.'), function () { finish({}, 0); });
    H.collect('📦 ' + L('تسليم أصناف — ملف ', 'Deliver — file #') + b.no, due, function (r) {
      var v = Math.min(r.v, due), credit = U.r2(due - v);
      if (credit > 0.009 && !can('pos.credit')) { toast(L('ليس لديك صلاحية البيع الآجل', 'No credit permission'), 'bad'); return false; }
      var pays = {}; if (v) pays[r.m] = v; finish(pays, credit);
    }, { label: L('المطلوب بعد خصم مدفوعات العروسة', 'Due after deposits'), sub: L('قيمة الأصناف ', 'Items ') + U.money(tot) + (fromDep ? ' − ' + L('من المدفوعات ', 'deposits ') + U.money(fromDep) : ''), restNote: L('هيتسجل آجل على العميل', 'goes on account'), btn: L('تسليم وعمل الفاتورة', 'Deliver & invoice') });
  },
  print: function (b) {
    var cu = H.cust(b.customer) || {}, cats = {}, order = [];
    b.items.filter(function (i) { return !i.skip; }).forEach(function (i) { var k = i.cat || L('أخرى', 'Other'); if (!cats[k]) { cats[k] = []; order.push(k); } cats[k].push(i); });
    var stName = function (s) { return s === 'delivered' ? '<span class="badge paid">' + L('اتسلّم', 'Delivered') + '</span>' : s === 'reserved' ? '<span class="badge">' + L('محجوز', 'Reserved') + '</span>' : L('مطلوب', 'Planned'); };
    A4.print(A4.head(L('قائمة جهاز العروسة', 'Bridal list'), [[L('رقم الملف', 'File'), b.no], [L('العروسة', 'Bride'), U.esc(b.bride || cu.name || '')], [L('العريس', 'Groom'), U.esc(b.groom || '—')], [L('ميعاد الفرح', 'Wedding'), b.wedding || '—'], [L('الموبايل', 'Mobile'), '<span dir="ltr">' + U.esc(cu.phone || '') + '</span>'], [L('العنوان', 'Address'), U.esc(b.address || '—')]]) +
      order.map(function (k) { return '<h3 class="s">' + U.esc(k) + '</h3>' + A4.table([L('م', '#'), L('الصنف', 'Item'), L('الكمية', 'Qty'), L('السعر', 'Price'), L('الإجمالي', 'Total'), L('الحالة', 'Status')], cats[k].map(function (i, x) { return [x + 1, U.esc(i.name), U.r2(i.qty), i.price ? U.money(i.price) : '—', i.price ? U.money(i.qty * i.price) : '—', stName(i.status)]; })); }).join('') +
      A4.totals([[L('إجمالي القائمة', 'List total'), U.money(Bride.total(b))], [L('اتسلّم منها', 'Delivered'), U.money(Bride.delivered(b))], [L('إجمالي المدفوع', 'Paid'), U.money(H.paid(b))], [L('المتبقي', 'Remaining'), U.money(Math.max(0, Bride.total(b) - H.paid(b))), 1]], Math.max(0, Bride.total(b) - H.paid(b))) +
      A4.sign([L('توقيع العميل', 'Customer'), L('المسئول', 'Sales rep')]) + A4.foot());
  }
};

Views.brides = {
  tab: 'open', q: '',
  render: function (el) {
    var V = Views.brides, all = Store.db.brides || [], open = all.filter(function (b) { return b.status === 'open'; }), ad = U.n(homeCfg().brideAlertDays);
    var soon = open.filter(function (b) { var d = H.daysTo(b.wedding); return d != null && d >= 0 && d <= ad; });
    el.innerHTML = '<div class="grid g4" style="margin-bottom:14px"><div class="card kpi hero"><div class="l">💍 ' + L('ملفات مفتوحة', 'Open files') + '</div><div class="v num">' + open.length + '</div></div><div class="card kpi"><div class="l">🎉 ' + L('فرحهم خلال ', 'Weddings within ') + ad + L(' يوم', ' days') + '</div><div class="v num" style="color:var(--warn)">' + soon.length + '</div></div><div class="card kpi"><div class="l">💵 ' + L('مدفوعات تحت الحساب', 'Deposits held') + '</div><div class="v num">' + U.money(H.sum(open, Bride.credit)) + '</div></div><div class="card kpi"><div class="l">🧾 ' + L('قيمة القوائم المفتوحة', 'Open lists value') + '</div><div class="v num">' + U.money(H.sum(open, function (b) { return Bride.total(b) - Bride.delivered(b); })) + '</div></div></div>' +
      '<div class="row wrap" style="margin-bottom:12px">' + H.tabs('brT', [['open', '📂 ' + L('المفتوحة', 'Open')], ['done', '✅ ' + L('المكتملة', 'Completed')], ['all', '🗂️ ' + L('الكل', 'All')]], V.tab) + '<div class="grow"></div><input class="in" id="brQ" style="width:230px" placeholder="🔎 ' + L('اسم / موبايل', 'Name / mobile') + '" value="' + U.esc(V.q) + '"><button class="btn pri" id="brNew">➕ ' + L('ملف عروسة جديد', 'New bridal file') + '</button></div><div id="brB"></div>';
    H.bindTabs('brT', function (t) { V.tab = t; V.render(el); });
    $('#brNew').onclick = function () { Bride.edit(null, function (b) { V.render(el); V.open(b); }); };
    $('#brQ').oninput = function () { V.q = this.value; draw(); };
    var draw = function () {
      var q = U.norm(V.q), rows = all.filter(function (b) { return V.tab === 'all' || (V.tab === 'open' ? b.status === 'open' : b.status === 'done'); }).filter(function (b) { var cu = H.cust(b.customer) || {}; return !q || U.norm(b.bride + ' ' + b.groom + ' ' + cu.name).indexOf(q) >= 0 || Phone.norm(cu.phone).indexOf(Phone.norm(V.q) || '#') >= 0; });
      rows.sort(function (a, b) { return (a.wedding || '9') < (b.wedding || '9') ? -1 : 1; });
      $('#brB').innerHTML = rows.length ? '<div class="grid g3">' + rows.map(function (b) {
        var cu = H.cust(b.customer) || {}, d = H.daysTo(b.wedding), tot = Bride.total(b), dl = Bride.delivered(b), pct = tot ? Math.round(dl / tot * 100) : 0;
        return '<div class="card col bride-card" data-b="' + b.id + '" style="cursor:pointer;gap:6px"><div class="row"><span style="font-size:26px">💍</span><div class="grow"><b style="font-size:16px">' + U.esc(b.bride || cu.name) + (b.groom ? ' & ' + U.esc(b.groom) : '') + '</b><div class="muted small">#' + b.no + ' · <span class="num">' + U.esc(cu.phone || '') + '</span></div></div>' + (b.wedding ? H.chip('🎉 ' + b.wedding + (d != null && d >= 0 ? ' · ' + (d === 0 ? L('النهارده', 'today') : L('باقي ', 'in ') + d + L(' يوم', 'd')) : ''), d != null && d >= 0 && d <= 14 ? 'warn' : '') : '') + '</div>' +
          '<div class="bar"><span style="width:' + pct + '%"></span></div><div class="row small" style="justify-content:space-between"><span>' + L('القائمة ', 'List ') + '<b class="num">' + U.money(tot) + '</b></span><span>' + L('اتسلّم ', 'Delivered ') + pct + '%</span><span>' + L('مدفوع ', 'Paid ') + '<b class="num">' + U.money(H.paid(b)) + '</b></span></div></div>';
      }).join('') + '</div>' : '<div class="empty">' + L('مفيش ملفات', 'No files') + '</div>';
      $$('[data-b]').forEach(function (c) { c.onclick = function () { V.open(all.filter(function (b) { return b.id === c.dataset.b; })[0]); }; });
    };
    draw();
  },
  open: function (b) {
    var cu = H.cust(b.customer) || {}, sel = {};
    var m = Modal.open({ size: 'xl', sticky: true, title: '💍 ' + L('ملف عروسة #', 'Bridal file #') + b.no + ' — ' + U.esc(b.bride || cu.name || ''), body: '<div id="boK"></div><div class="row wrap" style="margin:10px 0"><input class="in" id="boP" style="width:300px" placeholder="➕ ' + L('ضيف صنف من المعرض (اسم / باركود)', 'Add a product (name / barcode)') + '"><button class="btn" id="boM">✍️ ' + L('بند يدوي', 'Manual line') + '</button><div class="grow"></div><button class="btn" id="boAll">☑️ ' + L('اختار الجاهز للتسليم', 'Select ready') + '</button><button class="btn pri" id="boD">📦 ' + L('تسليم المختار وعمل فاتورة', 'Deliver selected') + '</button></div><div id="boL" class="tbl-wrap" style="max-height:48vh"></div>',
      foot: '<button class="btn" id="boEd">✏️ ' + L('بيانات الملف', 'Edit info') + '</button><button class="btn" id="boPr">📄 ' + L('طباعة القائمة A4', 'Print list') + '</button>' + (cu.phone ? '<button class="btn" id="boWa">📲 ' + L('واتساب', 'WhatsApp') + '</button>' : '') + '<button class="btn gold" id="boPay">💵 ' + L('دفعة تحت الحساب', 'Add deposit') + '</button>' + (b.status === 'open' ? '<button class="btn" id="boClose">✔️ ' + L('قفل الملف', 'Close file') + '</button>' : '<button class="btn" id="boReo">↺ ' + L('إعادة فتح', 'Reopen') + '</button>') });
    var kpis = function () {
      var tot = Bride.total(b), paid = H.paid(b), d = H.daysTo(b.wedding);
      $('#boK', m).innerHTML = '<div class="grid g4"><div class="card kpi hero"><div class="l">' + L('إجمالي القائمة', 'List total') + '</div><div class="v num">' + U.money(tot) + '</div><div class="small">' + b.items.filter(function (i) { return !i.skip; }).length + L(' بند', ' lines') + (b.budget ? ' · ' + L('الميزانية ', 'budget ') + U.money(b.budget) : '') + '</div></div><div class="card kpi"><div class="l">' + L('المدفوع', 'Paid') + '</div><div class="v num" style="color:var(--ok)">' + U.money(paid) + '</div><div class="muted small">' + L('متاح للتسليم ', 'Available ') + U.money(Bride.credit(b)) + '</div></div><div class="card kpi"><div class="l">' + L('اتسلّم', 'Delivered') + '</div><div class="v num">' + U.money(Bride.delivered(b)) + '</div></div><div class="card kpi"><div class="l">🎉 ' + L('الفرح', 'Wedding') + '</div><div class="v" style="font-size:18px">' + (b.wedding || '—') + '</div><div class="muted small">' + (d != null ? (d >= 0 ? L('باقي ', 'in ') + d + L(' يوم', ' days') : L('عدّى', 'passed')) : '') + (b.address ? ' · 📍 ' + U.esc(b.address) : '') + '</div></div></div>';
    };
    var draw = function () {
      kpis();
      var rows = b.items.map(function (i, x) { return { i: i, x: x }; }), cats = [];
      rows.forEach(function (r) { if (cats.indexOf(r.i.cat || '') < 0) cats.push(r.i.cat || ''); });
      $('#boL', m).innerHTML = '<table class="t"><tr><th></th><th>' + L('الصنف', 'Item') + '</th><th>' + L('الكمية', 'Qty') + '</th><th>' + L('السعر', 'Price') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>' + L('الحالة', 'Status') + '</th><th></th></tr>' + cats.map(function (c) {
        return '<tr><td colspan="7" style="background:var(--panel2);font-weight:800">' + (c ? catEmoji(c) + ' ' + U.esc(c) : L('أخرى', 'Other')) + '</td></tr>' + rows.filter(function (r) { return (r.i.cat || '') === c; }).map(function (r) {
          var i = r.i, dl = i.status === 'delivered', p = i.pid && Store.product(i.pid);
          return '<tr style="' + (i.skip ? 'opacity:.4;text-decoration:line-through' : '') + '"><td>' + (dl || i.skip ? '' : '<input type="checkbox" data-sel="' + i.id + '"' + (sel[i.id] ? ' checked' : '') + '>') + '</td><td><b>' + U.esc(i.name) + '</b>' + (p ? '' : (dl ? '' : ' <button class="btn sm ghost" data-link="' + i.id + '" title="' + L('اربطه بصنف من المعرض', 'Link to a product') + '">🔗</button>')) + (p && can('stock.viewQty') && !dl && i.status !== 'reserved' ? ' <span class="muted small">' + L('رصيد ', 'stock ') + U.n(p.stock) + '</span>' : '') + '</td><td>' + (dl ? U.r2(i.qty) : '<input class="in num" style="width:70px" type="number" step="0.01" data-q="' + i.id + '" value="' + i.qty + '">') + '</td><td>' + (dl ? U.money(i.price) : '<input class="in num" style="width:110px" type="number" data-pr="' + i.id + '" value="' + (i.price || '') + '"' + (can('pos.priceEdit') || !i.pid ? '' : ' disabled') + '>') + '</td><td class="num">' + U.money(i.qty * i.price) + '</td><td>' + (dl ? H.chip('✅ #' + i.saleNo, 'ok') : i.status === 'reserved' ? H.chip('📌 ' + L('محجوز', 'Reserved'), 'warn') : i.skip ? L('مش محتاجاه', 'Skipped') : H.chip(L('مطلوب', 'Planned'))) + '</td><td>' + (dl ? '' : '<button class="btn sm ghost" data-skip="' + i.id + '" title="' + (i.skip ? L('رجّعه', 'Restore') : L('مش محتاجاه', 'Skip')) + '">' + (i.skip ? '↺' : '🚫') + '</button><button class="btn sm ghost" data-del="' + i.id + '" style="color:var(--bad)">✕</button>') + '</td></tr>';
        }).join('');
      }).join('') + '</table>' + (b.pays.length ? '<div style="margin-top:10px"><b>💵 ' + L('الدفعات', 'Deposits') + '</b>' + b.pays.map(function (p) { return '<div class="list-row"><b class="num">' + U.money(p.v) + '</b> · ' + pmName(p.m) + ' · <span class="muted small">' + U.dt(p.t) + ' · ' + U.esc(p.by) + '</span></div>'; }).join('') + '</div>' : '');
      var byId = function (id) { return b.items.filter(function (i) { return i.id === id; })[0]; };
      $$('[data-sel]', m).forEach(function (c) { c.onchange = function () { sel[c.dataset.sel] = c.checked; }; });
      $$('[data-q]', m).forEach(function (i) { i.onchange = function () { var it = byId(i.dataset.q), nq = Math.max(0, U.n(i.value)); if (it.status === 'reserved' && it.pid) Store.move(it.pid, it.qty - nq, nq > it.qty ? 'reserve' : 'unreserve', 'B#' + b.no); it.qty = nq; Store.save(); setTimeout(draw); }; });
      $$('[data-pr]', m).forEach(function (i) { i.onchange = function () { byId(i.dataset.pr).price = U.n(i.value); Store.save(); setTimeout(draw); }; });
      $$('[data-skip]', m).forEach(function (x) { x.onclick = function () { var it = byId(x.dataset.skip); it.skip = !it.skip; if (it.skip && it.status === 'reserved' && it.pid) { Store.move(it.pid, it.qty, 'unreserve', 'B#' + b.no); it.status = 'planned'; } Store.save(); draw(); }; });
      $$('[data-del]', m).forEach(function (x) { x.onclick = function () { var it = byId(x.dataset.del); if (it.status === 'reserved' && it.pid) Store.move(it.pid, it.qty, 'unreserve', 'B#' + b.no); b.items.splice(b.items.indexOf(it), 1); Store.save(); draw(); }; });
      $$('[data-link]', m).forEach(function (x) { x.onclick = function () { var it = byId(x.dataset.link); var mm = Modal.open({ title: '🔗 ' + U.esc(it.name), body: '<label class="f">' + L('اختار الصنف من المعرض', 'Pick the product') + '<input class="in" id="lkP" autofocus></label>' }); H.prodPick($('#lkP', mm), function (p) { it.pid = p.id; it.name = pname(p) + (p.shade ? ' ' + p.shade : ''); it.price = (Views.pos.price || Promo.price)(p, 0).price; it.cost = U.n(p.cost); it.cat = it.cat || p.cat; Store.save(); Modal.close(mm); draw(); }); }; });
    };
    H.prodPick($('#boP', m), function (p) {
      var add = function (q, name) { var pr = (Views.pos.price || Promo.price)(p, 0).price, it = { id: U.id(), pid: p.id, name: name || (pname(p) + (p.shade ? ' ' + p.shade : '')), qty: q, price: pr, cost: U.n(p.cost), cat: p.cat || '', status: 'planned' };
        Modal.confirm(L('تحجز الصنف ده للعروسة دلوقتي؟ (يتشال من المعروض)', 'Reserve it for the bride now? (taken off sale)'), function () { if (!S().allowNegativeStock && U.n(p.stock) < q) return toast(L('الكمية مش متاحة', 'Not enough stock'), 'bad'); Store.move(p.id, -q, 'reserve', 'B#' + b.no); it.status = 'reserved'; Store.save(); draw(); });
        b.items.push(it); Store.save(); draw(); };
      if (Meas.isMeas(p)) Meas.ask(p, function (r) { add(r.q, Meas.label(p, r)); }); else add(1);
    });
    $('#boM', m).onclick = function () { var mm = Modal.open({ title: '✍️ ' + L('بند يدوي', 'Manual line'), body: '<div class="col"><label class="f">' + L('البيان', 'Item') + '<input class="in" id="mlN" autofocus></label><div class="grid g3"><label class="f">' + L('الكمية', 'Qty') + '<input class="in num" type="number" id="mlQ" value="1"></label><label class="f">' + L('السعر', 'Price') + '<input class="in num" type="number" id="mlP"></label><label class="f">' + L('القسم', 'Section') + '<input class="in" id="mlC" list="mlCl"><datalist id="mlCl">' + BRIDE_LIST.map(function (g) { return '<option value="' + g[0] + '">'; }).join('') + '</datalist></label></div></div>', foot: '<button class="btn pri" id="mlGo">➕</button>' }); $('#mlGo', mm).onclick = function () { var n = $('#mlN', mm).value.trim(); if (!n) return; b.items.push({ id: U.id(), pid: null, name: n, qty: U.n($('#mlQ', mm).value) || 1, price: U.n($('#mlP', mm).value), cat: $('#mlC', mm).value.trim(), status: 'planned' }); Store.save(); Modal.close(mm); draw(); }; };
    $('#boAll', m).onclick = function () { b.items.forEach(function (i) { if (i.status !== 'delivered' && !i.skip && i.price > 0 && (i.status === 'reserved' || !i.pid || U.n((Store.product(i.pid) || {}).stock) >= i.qty)) sel[i.id] = true; }); draw(); };
    $('#boD', m).onclick = function () { Bride.deliver(b, Object.keys(sel).filter(function (k) { return sel[k]; }), function () { sel = {}; draw(); }); };
    $('#boEd', m).onclick = function () { Bride.edit(b, function () { Modal.close(m); Views.brides.open(b); }); };
    $('#boPr', m).onclick = function () { Bride.print(b); };
    if ($('#boWa', m)) $('#boWa', m).onclick = function () { H.wa(cu.phone, H.fill(L('أهلاً {name} 💍\nمن {shop}: ملخص قائمة جهازك:\n• إجمالي القائمة: {tot} {cur}\n• المدفوع: {paid} {cur}\n• اتسلّم: {dl} {cur}\nألف مبروك مقدماً 🎉', 'Hello {name}, summary from {shop}: list {tot}, paid {paid}, delivered {dl} {cur}.'), { name: b.bride || cu.name, shop: shopName(), tot: U.money(Bride.total(b)), paid: U.money(H.paid(b)), dl: U.money(Bride.delivered(b)), cur: cur() })); };
    $('#boPay', m).onclick = function () { if (shiftsOn() && !App.shift) return toast(L('افتح وردية أولاً', 'Open a shift first'), 'bad'); H.collect('💵 ' + L('دفعة تحت الحساب — ملف ', 'Deposit — file #') + b.no, Math.max(0, Bride.total(b) - H.paid(b)), function (r) { if (!r.v) return false; var p = H.pay(b.pays, r.v, r.m); Store.log('bride.pay', 'B#' + b.no + ' ' + r.v); Store.save(); Views.brides.receipt(b, p); draw(); }, { label: L('المتبقي على القائمة', 'Left on the list'), def: '', btn: L('تسجيل وطباعة إيصال', 'Save & print receipt') }); };
    if ($('#boClose', m)) $('#boClose', m).onclick = function () { var res = b.items.filter(function (i) { return i.status === 'reserved'; }); Modal.confirm(L('قفل الملف؟', 'Close the file?') + (res.length ? '<br>' + L('الأصناف المحجوزة هترجع للمعروض: ', 'Reserved items go back on sale: ') + res.length : '') + (Bride.credit(b) > 0 ? '<br>⚠️ ' + L('فيه مدفوعات مش مستخدمة ', 'Unused deposits ') + U.money(Bride.credit(b)) : ''), function () { res.forEach(function (i) { if (i.pid) Store.move(i.pid, i.qty, 'unreserve', 'B#' + b.no); i.status = 'planned'; }); b.status = 'done'; Store.save(); Modal.close(m); go('brides'); }); };
    if ($('#boReo', m)) $('#boReo', m).onclick = function () { b.status = 'open'; Store.save(); Modal.close(m); Views.brides.open(b); };
    draw();
  },
  receipt: function (b, p) {
    var cu = H.cust(b.customer) || {}, row = function (a, v) { return '<div style="display:flex;justify-content:space-between"><span>' + a + '</span><b>' + v + '</b></div>'; };
    Printer.print('<div class="rc" style="width:72mm;padding:3mm;font-size:12px"><div style="text-align:center;font-weight:800;font-size:16px">' + U.esc(shopName()) + '</div><div style="text-align:center;font-size:14px;margin:4px 0;border:1.5px solid #000;border-radius:6px;padding:3px">💍 ' + L('إيصال دفعة — تجهيز عروسة', 'Bridal deposit receipt') + '</div>' + row(L('ملف رقم', 'File'), b.no) + row(L('التاريخ', 'Date'), U.dt(p.t)) + '<div>' + U.esc(b.bride || cu.name || '') + ' — <span dir="ltr">' + U.esc(cu.phone || '') + '</span></div><hr>' + row(L('المبلغ', 'Amount'), U.money(p.v)) + row(L('طريقة الدفع', 'Method'), pmName(p.m)) + row(L('إجمالي المدفوع', 'Total paid'), U.money(H.paid(b))) + row(L('إجمالي القائمة', 'List total'), U.money(Bride.total(b))) + '<div style="margin-top:6px">' + L('المستلم: ', 'By: ') + U.esc(p.by) + '</div><div style="text-align:center;margin-top:6px;font-size:9px;color:#555">Ghandi Home · ' + APP.phone + '</div></div>',
      { css: '@page{size:80mm auto;margin:0}body{margin:0;font-family:Tahoma,Arial}', printer: S().printers.invoice, silent: S().printers.silent, dir: lang() === 'en' ? 'ltr' : 'rtl' });
  }
};

/* ================= quotations ================= */
var Quote = {
  fromCart: function () {
    var c = App.cart; if (!c.items.length) return toast(L('ضيف أصناف الأول', 'Add items first'), 'bad');
    var t = Views.pos.totals(), cu = H.cust(c.customer), h = homeCfg();
    var m = Modal.open({ title: '📝 ' + L('عرض سعر', 'Quotation'), body: '<div class="col"><div class="card kpi hero"><div class="l">' + L('الإجمالي', 'Total') + '</div><div class="v num">' + U.money(t.total) + '</div></div><div class="grid g2"><label class="f">' + L('اسم العميل', 'Customer') + '<input class="in" id="qN" value="' + U.esc(cu ? cu.name : (c.newCust && c.newCust.name) || '') + '"></label><label class="f">' + L('الموبايل', 'Mobile') + '<input class="in num" id="qP" value="' + U.esc(cu ? cu.phone : (c.newCust && c.newCust.phone) || '') + '"></label></div><label class="f">' + L('العرض ساري لحد', 'Valid until') + '<input class="in" type="date" id="qV" value="' + U.today(Date.now() + h.quoteDays * 864e5) + '"></label><label class="f">' + L('ملاحظات تظهر في العرض', 'Notes on the quotation') + '<textarea class="in" id="qNo" rows="2"></textarea></label><label class="row small"><input type="checkbox" class="sw" id="qClr" checked> ' + L('مسح الكاشير بعد الحفظ', 'Clear the POS after saving') + '</label></div>', foot: '<button class="btn pri lg" id="qGo">💾 ' + L('حفظ وطباعة A4', 'Save & print A4') + '</button>' });
    $('#qGo', m).onclick = function () {
      var db = Store.db; db.seq.quote++;
      var q = { id: U.id(), no: db.seq.quote, date: Date.now(), customer: c.customer || '', name: $('#qN', m).value.trim(), phone: Phone.norm($('#qP', m).value), valid: $('#qV', m).value, note: $('#qNo', m).value, tier: c.tier, items: c.items.map(function (i) { return { pid: i.pid, name: i.name, qty: i.qty, price: i.price, base: i.base, cost: i.cost, promo: i.promo, meas: i.meas }; }), sub: t.sub, disc: t.disc, vat: t.vat, total: t.total, by: App.user.name, status: 'open' };
      db.quotes.push(q); Store.log('quote', 'Q#' + q.no); Store.save(); Modal.close(m); Quote.print(q);
      if ($('#qClr', m).checked) { App.cart = newCart(); go('pos'); }
      toast('📝 ' + L('عرض سعر رقم ', 'Quotation #') + q.no, 'ok');
    };
  },
  print: function (q) {
    var rows = q.items.map(function (i, x) { var p = i.pid && Store.product(i.pid); return [x + 1, U.esc(i.name), U.esc(p ? Meas.unitName(p) : '—'), U.r2(i.qty), U.money(i.price), U.money(i.qty * i.price)]; });
    var tr = [[L('الإجمالي', 'Subtotal'), U.money(q.sub)]]; if (q.disc) tr.push([L('الخصم', 'Discount'), '- ' + U.money(q.disc)]); if (q.vat) tr.push([L('الضريبة', 'VAT'), U.money(q.vat)]); tr.push([L('الصافي', 'Total'), U.money(q.total) + ' ' + cur(), 1]);
    A4.print(A4.head(L('عرض سعر', 'Quotation'), [[L('رقم العرض', 'No.'), '<b>' + q.no + '</b>'], [L('التاريخ', 'Date'), U.dt(q.date)], [L('السادة', 'To'), U.esc(q.name || '—')], [L('الموبايل', 'Mobile'), '<span dir="ltr">' + U.esc(q.phone || '—') + '</span>'], [L('ساري حتى', 'Valid until'), q.valid || '—'], [L('مقدم العرض', 'Prepared by'), U.esc(q.by)]]) +
      A4.table([L('م', '#'), L('الصنف', 'Item'), L('الوحدة', 'Unit'), L('الكمية', 'Qty'), L('السعر', 'Price'), L('الإجمالي', 'Total')], rows) + A4.totals(tr, q.total) +
      '<div class="terms">' + (q.note ? U.esc(q.note) + '\n' : '') + L('الأسعار سارية حتى التاريخ الموضح وحسب توفر الكميات بالمخزن.', 'Prices are valid until the date shown and subject to stock availability.') + (homeCfg().instRate ? '\n' + L('متاح التقسيط بمقدم بسيط — اسأل عن نظام الأقساط.', 'Instalment plans available.') : '') + '</div>' + A4.sign([L('العميل', 'Customer'), L('المسئول', 'Sales rep')]) + A4.foot());
  },
  load: function (q) {
    if (App.cart && App.cart.items.length) return Modal.confirm(L('الكاشير فيه فاتورة — تمسحها وتحمّل العرض؟', 'The POS has items — replace them?'), function () { App.cart = newCart(); Quote.load(q); });
    var c = newCart(); c.tier = q.tier || 0; c.customer = q.customer || ''; if (!c.customer && q.phone) { var cu = Cust.byPhone(q.phone); if (cu) c.customer = cu.id; else c.newCust = { phone: q.phone, name: q.name }; }
    var miss = [];
    q.items.forEach(function (i) { var p = i.pid && Store.product(i.pid); if (i.pid && (!p || U.n(p.stock) < i.qty)) { miss.push(i.name); return; } c.items.push({ pid: i.pid, name: i.name, qty: i.qty, price: i.price, base: i.base, cost: p ? U.n(p.cost) : U.n(i.cost), promo: i.promo || '', manual: true, meas: i.meas }); });
    c.quote = q.id; c.sel = c.items.length - 1; App.cart = c; go('pos');
    if (miss.length) toast('⚠️ ' + L('مش متاح في المخزن: ', 'Not in stock: ') + miss.join('، '), 'bad'); else toast('📝 ' + L('العرض اتحمّل في الكاشير بأسعاره', 'Quotation loaded with its prices'), 'ok');
  }
};
(function () {
  var cr = Sales.create;
  Sales.create = function (o) { var s = cr.apply(this, arguments); try { var c = App.cart; if (s && s.type === 'sale' && c && c.quote && o.items === c.items) { var q = (Store.db.quotes || []).filter(function (x) { return x.id === c.quote; })[0]; if (q) { q.status = 'sold'; q.saleNo = s.no; s.quoteNo = q.no; Store.save(); } } } catch (e) { } return s; };
})();
Views.quotes = {
  q: '',
  render: function (el) {
    var V = Views.quotes, all = (Store.db.quotes || []).slice().reverse();
    el.innerHTML = '<div class="row wrap" style="margin-bottom:12px"><input class="in" id="quQ" style="width:260px" placeholder="🔎 ' + L('رقم / اسم / موبايل', 'No. / name / mobile') + '" value="' + U.esc(V.q) + '"><div class="grow"></div><button class="btn pri" id="quNew">➕ ' + L('عرض جديد من الكاشير', 'New from the POS') + '</button></div><div id="quB" class="tbl-wrap"></div>';
    $('#quNew').onclick = function () { go('pos'); toast(L('ضيف الأصناف واضغط «📝 عرض سعر»', 'Add items then press «📝 Quotation»'), 'ok'); };
    var draw = function () {
      var q = U.norm(V.q), rows = all.filter(function (x) { return !q || String(x.no) === V.q.trim() || U.norm(x.name).indexOf(q) >= 0 || (x.phone || '').indexOf(Phone.norm(V.q) || '#') >= 0; });
      $('#quB').innerHTML = rows.length ? '<table class="t"><tr><th>#</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('العميل', 'Customer') + '</th><th>' + L('الأصناف', 'Items') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>' + L('ساري حتى', 'Valid') + '</th><th>' + L('الحالة', 'Status') + '</th><th></th></tr>' + rows.map(function (x) { var exp = x.valid && H.daysTo(x.valid) < 0; return '<tr><td class="num"><b>' + x.no + '</b></td><td class="num">' + U.dt(x.date) + '</td><td>' + U.esc(x.name || '—') + '<div class="muted small num">' + U.esc(x.phone || '') + '</div></td><td>' + x.items.length + '</td><td class="num"><b>' + U.money(x.total) + '</b></td><td class="num">' + (x.valid || '—') + '</td><td>' + (x.status === 'sold' ? H.chip('✅ ' + L('اتباع #', 'Sold #') + x.saleNo, 'ok') : exp ? H.chip(L('منتهي', 'Expired'), 'bad') : H.chip(L('مفتوح', 'Open'))) + '</td><td class="row" style="gap:4px"><button class="btn sm" data-p="' + x.id + '">🖨️</button>' + (x.phone ? '<button class="btn sm" data-w="' + x.id + '">📲</button>' : '') + (x.status !== 'sold' && can('pos.sell') ? '<button class="btn sm pri" data-l="' + x.id + '">🛒 ' + L('تحويل لفاتورة', 'To invoice') + '</button>' : '') + '<button class="btn sm ghost" data-d="' + x.id + '" style="color:var(--bad)">✕</button></td></tr>'; }).join('') + '</table>' : '<div class="empty">' + L('مفيش عروض أسعار — اعملها من الكاشير بزرار «📝 عرض سعر»', 'No quotations — create one from the POS') + '</div>';
      var get = function (id) { return all.filter(function (x) { return x.id === id; })[0]; };
      $$('[data-p]').forEach(function (b) { b.onclick = function () { Quote.print(get(b.dataset.p)); }; });
      $$('[data-l]').forEach(function (b) { b.onclick = function () { Quote.load(get(b.dataset.l)); }; });
      $$('[data-w]').forEach(function (b) { b.onclick = function () { var x = get(b.dataset.w); H.wa(x.phone, L('أهلاً ', 'Hello ') + (x.name || '') + '\n' + L('عرض سعر رقم ', 'Quotation #') + x.no + L(' من ', ' from ') + shopName() + ':\n' + x.items.map(function (i) { return '• ' + i.name + ' × ' + U.r2(i.qty) + ' = ' + U.money(i.qty * i.price); }).join('\n') + '\n' + L('الإجمالي: ', 'Total: ') + U.money(x.total) + ' ' + cur() + (x.valid ? '\n' + L('ساري حتى ', 'Valid until ') + x.valid : '')); }; });
      $$('[data-d]').forEach(function (b) { b.onclick = function () { Modal.confirm(L('حذف عرض السعر؟', 'Delete this quotation?'), function () { var db = Store.db; db.quotes = db.quotes.filter(function (x) { return x.id !== b.dataset.d; }); Store.save(); go('quotes'); }); }; });
    };
    $('#quQ').oninput = function () { V.q = this.value; draw(); }; draw();
  }
};
