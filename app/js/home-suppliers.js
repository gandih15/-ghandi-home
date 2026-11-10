/* Ghandi Home 1.3 — supplier accounts: a page per supplier with invoices, movements, payments, dates, notes,
   printable purchase invoices and a full statement (who owes whom). Eng. Mohamed Ali — 01098811581 */
'use strict';
var Sup = {
  get: function (id) { return Store.db.suppliers.filter(function (s) { return s.id === id; })[0] || null; },
  invoices: function (s) { return Store.db.purchases.filter(function (p) { return p.supplier === s.id; }).sort(function (a, b) { return b.date - a.date; }); },
  pays: function (s) { return (s.payments || []).slice().sort(function (a, b) { return b.t - a.t; }); },
  // every movement that changes what we owe; amount > 0 = we owe more, < 0 = we owe less
  events: function (s) {
    var ev = [];
    Sup.invoices(s).forEach(function (p) {
      var ret = p.type === 'return' || p.total < 0;
      ev.push({ t: p.date, k: ret ? 'ret' : (p.manual ? 'man' : 'inv'), d: (ret ? L('مرتجع للمورد #', 'Return #') : p.manual ? (p.total < 0 ? L('خصم / تسوية #', 'Credit note #') : L('فاتورة يدوية #', 'Manual invoice #')) : L('فاتورة شراء #', 'Purchase invoice #')) + p.no + (p.ref ? ' (' + p.ref + ')' : ''), v: U.r2(p.total), p: p, note: p.note || '' });
      if (U.n(p.paid)) ev.push({ t: p.date + 1, k: 'paidInv', d: L('مدفوع مع الفاتورة #', 'Paid with invoice #') + p.no, v: -U.r2(p.paid), p: p });
    });
    (s.payments || []).forEach(function (x, i) { ev.push({ t: x.t, k: 'pay', d: (x.ref ? L('قسط مورد ', 'Instalment ') + x.ref : L('سداد', 'Payment')) + (x.m && x.m !== 'cash' ? ' — ' + pmName(x.m) : ''), v: -U.r2(x.v), x: x, i: i, note: x.note || '' }); });
    ev.sort(function (a, b) { return a.t - b.t; });
    return ev;
  },
  opening: function (s) { return U.r2(U.n(s.balance) - H.sum(Sup.events(s), function (e) { return e.v; })); },
  stats: function (s) {
    var inv = Sup.invoices(s), buy = H.sum(inv, function (p) { return p.total > 0 ? p.total : 0; }), ret = -H.sum(inv, function (p) { return p.total < 0 ? p.total : 0; });
    var paid = H.sum(inv, function (p) { return p.paid; }) + H.sum(s.payments, function (x) { return x.v; });
    var last = Math.max(0, inv[0] ? inv[0].date : 0, H.sum([]) || 0, (s.payments || []).reduce(function (m, x) { return Math.max(m, x.t); }, 0));
    return { n: inv.filter(function (p) { return p.total > 0; }).length, buy: U.r2(buy), ret: U.r2(ret), paid: U.r2(paid), bal: U.r2(U.n(s.balance)), last: last };
  },
  balTxt: function (b, big) {
    b = U.r2(b);
    if (Math.abs(b) < 0.01) return '<span style="color:var(--ok)' + (big ? ';font-size:22px' : '') + '">✅ ' + L('خالص', 'Settled') + '</span>';
    return b > 0 ? '<span style="color:var(--bad);font-weight:800' + (big ? ';font-size:22px' : '') + '">' + L('له عندنا ', 'We owe ') + U.money(b) + '</span>' : '<span style="color:var(--ok);font-weight:800' + (big ? ';font-size:22px' : '') + '">' + L('لينا عنده ', 'Owes us ') + U.money(-b) + '</span>';
  },
  itemName: function (i) { var p = Store.product(i.pid); return i.name || (p ? pname(p) + (p.shade ? ' ' + p.shade : '') : L('صنف محذوف', 'Deleted item')); },
  edit: function (s, after) {
    var isNew = !s; s = s || { name: '', phone: '', phone2: '', company: '', address: '', note: '', balance: 0 };
    var m = Modal.open({ title: '🏭 ' + (isNew ? L('مورد جديد', 'New supplier') : U.esc(s.name)), body: '<div class="col"><div class="grid g2"><label class="f">' + L('اسم المورد / الشركة *', 'Supplier / company *') + '<input class="in" id="seN" value="' + U.esc(s.name) + '" autofocus></label><label class="f">' + L('اسم المسئول', 'Contact person') + '<input class="in" id="seC" value="' + U.esc(s.company || '') + '"></label><label class="f">' + L('الموبايل', 'Mobile') + '<input class="in num" id="seP" value="' + U.esc(s.phone || '') + '"></label><label class="f">' + L('موبايل تاني / تليفون', 'Second phone') + '<input class="in num" id="seP2" value="' + U.esc(s.phone2 || '') + '"></label></div><label class="f">' + L('العنوان', 'Address') + '<input class="in" id="seA" value="' + U.esc(s.address || '') + '"></label><label class="f">' + L('ملاحظات ثابتة (شروط الدفع، المندوب…)', 'Fixed notes (payment terms, rep…)') + '<input class="in" id="seNo" value="' + U.esc(s.note || '') + '"></label>' +
      (isNew ? '<label class="f">' + L('رصيد افتتاحي (اكتب بالموجب لو ليه عندك، وبالسالب لو ليك عنده)', 'Opening balance (+ we owe him, − he owes us)') + '<input class="in num" type="number" id="seB" value="0"></label>' : '') + '</div>', foot: '<button class="btn pri" id="seGo">💾 ' + L('حفظ', 'Save') + '</button>' });
    $('#seGo', m).onclick = function () {
      var n = $('#seN', m).value.trim(); if (!n) return toast(L('اكتب اسم المورد', 'Enter the name'), 'bad');
      s.name = n; s.company = $('#seC', m).value.trim(); s.phone = Phone.norm($('#seP', m).value); s.phone2 = Phone.norm($('#seP2', m).value); s.address = $('#seA', m).value.trim(); s.note = $('#seNo', m).value.trim();
      if (isNew) { s.id = U.id(); s.balance = U.r2(U.n($('#seB', m).value)); s.payments = []; s.notes = []; s.created = Date.now(); Store.db.suppliers.push(s); Store.log('supplier.add', s.name); } else Store.log('supplier.edit', s.name);
      Store.save(); Modal.close(m); if (after) after(s);
    };
  },
  pay: function (s, after) {
    if (!can('suppliers')) return toast(L('مفيش صلاحية', 'No permission'), 'bad');
    var bal = U.n(s.balance), shift = App.shift;
    var m = Modal.open({ title: '💸 ' + L('سداد للمورد — ', 'Pay supplier — ') + U.esc(s.name), body: '<div class="col"><div class="card kpi hero"><div class="l">' + L('الرصيد الحالي', 'Current balance') + '</div><div class="v num" style="font-size:22px">' + (bal > 0 ? L('له ', 'We owe ') + U.money(bal) : bal < 0 ? L('لينا ', 'Owes us ') + U.money(-bal) : L('خالص', 'Settled')) + '</div></div><div class="grid g2"><label class="f">' + L('المبلغ', 'Amount') + '<input class="in num" type="number" id="spV" value="' + (bal > 0 ? bal : '') + '" autofocus style="font-size:20px"></label><label class="f">' + L('طريقة الدفع', 'Method') + H.pmSelect('spM', 'cash') + '</label><label class="f">' + L('التاريخ', 'Date') + '<input class="in" type="date" id="spD" value="' + U.today() + '"></label><label class="f">' + L('رقم الإيصال / الشيك', 'Receipt / cheque no.') + '<input class="in" id="spR"></label></div><label class="f">' + L('ملاحظة', 'Note') + '<input class="in" id="spN"></label>' + (shift ? '<label class="row small"><input type="checkbox" class="sw" id="spDr" checked> ' + L('اتدفع من درج الكاشير (يتخصم من الوردية)', 'Paid from the cash drawer (deducted from the shift)') + '</label>' : '') + '<label class="row small"><input type="checkbox" class="sw" id="spPr" checked> ' + L('طباعة إيصال', 'Print receipt') + '</label></div>', foot: '<button class="btn pri lg" id="spGo">✅ ' + L('تسجيل السداد', 'Record payment') + '</button>' });
    $('#spGo', m).onclick = function () {
      var v = U.r2(U.n($('#spV', m).value)); if (v <= 0) return toast(L('اكتب المبلغ', 'Enter the amount'), 'bad');
      var d = $('#spD', m).value || U.today(), t = d === U.today() ? Date.now() : new Date(d + 'T12:00:00').getTime();
      var meth = $('#spM', m).value, x = { t: t, v: v, u: App.user.name, m: meth, no: $('#spR', m).value.trim(), note: $('#spN', m).value.trim(), shift: shift ? shift.id : '', drawer: !!($('#spDr', m) && $('#spDr', m).checked && meth === 'cash') };
      (s.payments = s.payments || []).push(x); s.balance = U.r2(U.n(s.balance) - v);
      Store.log('supplier.pay', s.name + ' ' + v); Store.save(); Modal.close(m); toast('✅ ' + L('اتسجل السداد — ', 'Recorded — ') + U.money(v), 'ok');
      if ($('#spPr', m).checked) Sup.printPay(s, x);
      if (after) after();
    };
  },
  manual: function (s, after) {
    var m = Modal.open({ title: '🧾 ' + L('فاتورة / تسوية يدوية — ', 'Manual invoice / adjustment — ') + U.esc(s.name), body: '<div class="col"><div class="seg" id="smT"><button data-t="1" class="on">➕ ' + L('فاتورة (تزوّد اللي ليه)', 'Invoice (we owe more)') + '</button><button data-t="-1">➖ ' + L('خصم / تسوية (تقلّل اللي ليه)', 'Credit note (we owe less)') + '</button></div><div class="grid g2"><label class="f">' + L('المبلغ', 'Amount') + '<input class="in num" type="number" id="smV" autofocus></label><label class="f">' + L('التاريخ', 'Date') + '<input class="in" type="date" id="smD" value="' + U.today() + '"></label><label class="f">' + L('رقم فاتورة المورد', 'Supplier invoice no.') + '<input class="in" id="smR"></label><label class="f">' + L('مدفوع منها', 'Paid now') + '<input class="in num" type="number" id="smP" value="0"></label></div><label class="f">' + L('البيان / ملاحظة', 'Description / note') + '<input class="in" id="smN" placeholder="' + L('مثلاً: رصيد فواتير قديمة، نقل، خصم كمية…', 'e.g. old invoices, freight, volume discount…') + '"></label><div class="muted small">' + L('دي للحسابات بس — مش بتزوّد المخزن. البضاعة بتدخل من «المشتريات / استلام البضاعة».', 'Accounts only — stock is received from Purchases.') + '</div></div>', foot: '<button class="btn pri" id="smGo">💾 ' + L('حفظ', 'Save') + '</button>' });
    var sg = 1; $$('#smT [data-t]', m).forEach(function (b) { b.onclick = function () { sg = +b.dataset.t; $$('#smT [data-t]', m).forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    $('#smGo', m).onclick = function () {
      var v = U.r2(U.n($('#smV', m).value)); if (v <= 0) return toast(L('اكتب المبلغ', 'Enter the amount'), 'bad');
      var d = $('#smD', m).value || U.today(), db = Store.db; db.seq.purchase++;
      var paid = sg > 0 ? Math.min(v, U.n($('#smP', m).value)) : 0;
      var rec = { id: U.id(), no: db.seq.purchase, date: d === U.today() ? Date.now() : new Date(d + 'T12:00:00').getTime(), supplier: s.id, ref: $('#smR', m).value.trim(), manual: true, items: [], total: sg * v, paid: paid, note: $('#smN', m).value.trim(), by: App.user.name };
      db.purchases.push(rec); s.balance = U.r2(U.n(s.balance) + rec.total - paid);
      Store.log('supplier.manual', s.name + ' ' + rec.total); Store.save(); Modal.close(m); toast(L('اتسجل', 'Saved'), 'ok'); if (after) after();
    };
  },
  invoice: function (s, p) {
    var rows = (p.items || []).map(function (i, x) { return [x + 1, U.esc(Sup.itemName(i)), U.r2(Math.abs(i.qty)), U.money(i.cost), U.money(Math.abs(i.qty) * i.cost)]; });
    var ret = p.total < 0, can2 = can('products.viewCost');
    var m = Modal.open({ size: 'wide', title: (ret ? '↩️ ' : '🧾 ') + (ret ? L('مرتجع للمورد #', 'Return #') : L('فاتورة شراء #', 'Purchase #')) + p.no + ' — ' + U.esc(s.name), body: '<div class="grid g4" style="margin-bottom:10px"><div class="card kpi hero"><div class="l">' + L('الإجمالي', 'Total') + '</div><div class="v num">' + U.money(Math.abs(p.total)) + '</div></div><div class="card kpi"><div class="l">' + L('المدفوع', 'Paid') + '</div><div class="v num">' + U.money(p.paid) + '</div></div><div class="card kpi"><div class="l">' + L('الباقي عليها', 'Left on it') + '</div><div class="v num">' + U.money(Math.max(0, p.total - U.n(p.paid))) + '</div></div><div class="card kpi"><div class="l">' + L('التاريخ', 'Date') + '</div><div class="v" style="font-size:15px">' + U.dt(p.date) + '</div><div class="muted small">' + U.esc(p.by || '') + '</div></div></div>' +
      (p.ref ? '<div class="small">🧾 ' + L('رقم فاتورة المورد: ', 'Supplier ref: ') + '<b>' + U.esc(p.ref) + '</b></div>' : '') + (p.note ? '<div class="small">📝 ' + U.esc(p.note) + '</div>' : '') +
      (rows.length ? '<div class="tbl-wrap" style="margin-top:8px"><table class="t"><tr><th>#</th><th>' + L('الصنف', 'Item') + '</th><th>' + L('الكمية', 'Qty') + '</th>' + (can2 ? '<th>' + L('السعر', 'Cost') + '</th><th>' + L('الإجمالي', 'Total') + '</th>' : '') + '</tr>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td class="num">' + r[2] + '</td>' + (can2 ? '<td class="num">' + r[3] + '</td><td class="num">' + r[4] + '</td>' : '') + '</tr>'; }).join('') + '</table></div>' : '<div class="muted small" style="margin-top:8px">' + L('فاتورة يدوية بدون أصناف', 'Manual entry — no items') + '</div>'),
      foot: '<button class="btn pri" id="siP">🖨️ ' + L('طباعة A4', 'Print A4') + '</button>' });
    $('#siP', m).onclick = function () { Sup.printInvoice(s, p); };
  },
  printInvoice: function (s, p) {
    var ret = p.total < 0, rows = (p.items || []).map(function (i, x) { return [x + 1, U.esc(Sup.itemName(i)), U.r2(Math.abs(i.qty)), U.money(i.cost), U.money(Math.abs(i.qty) * i.cost)]; });
    A4.print(A4.head(ret ? L('إذن مرتجع للمورد', 'Supplier return note') : p.manual ? L('فاتورة مورد (يدوية)', 'Supplier invoice (manual)') : L('فاتورة شراء', 'Purchase invoice'), [[L('رقم الفاتورة', 'No.'), '<b>' + p.no + '</b>'], [L('التاريخ', 'Date'), U.dt(p.date)], [L('المورد', 'Supplier'), U.esc(s.name)], [L('موبايل المورد', 'Mobile'), '<span dir="ltr">' + U.esc(s.phone || '—') + '</span>'], [L('رقم فاتورة المورد', 'Supplier ref'), U.esc(p.ref || '—')], [L('استلمها', 'Received by'), U.esc(p.by || '')]]) +
      (rows.length ? A4.table([L('م', '#'), L('الصنف', 'Item'), L('الكمية', 'Qty'), L('سعر الوحدة', 'Unit cost'), L('الإجمالي', 'Total')], rows) : (p.note ? '<p>' + U.esc(p.note) + '</p>' : '')) +
      A4.totals([[L('الإجمالي', 'Total'), U.money(Math.abs(p.total)), 1], [L('المدفوع', 'Paid'), U.money(p.paid)], [L('الباقي على الفاتورة', 'Left on invoice'), U.money(Math.max(0, p.total - U.n(p.paid)))], [L('رصيد المورد الحالي', 'Supplier balance now'), Sup.balTxt(s.balance).replace(/<[^>]+>/g, '')]], Math.abs(p.total)) +
      (p.note && rows.length ? '<div class="terms">' + U.esc(p.note) + '</div>' : '') + A4.sign([L('المورد / المندوب', 'Supplier / rep'), L('المستلم', 'Received by'), L('أمين المخزن', 'Warehouse')]) + A4.foot());
  },
  printPay: function (s, x) {
    A4.print(A4.head(L('إيصال سداد لمورد', 'Supplier payment receipt'), [[L('المورد', 'Supplier'), U.esc(s.name)], [L('التاريخ', 'Date'), U.dt(x.t)], [L('المبلغ', 'Amount'), '<b>' + U.money(x.v) + '</b>'], [L('طريقة الدفع', 'Method'), pmName(x.m || 'cash')], [L('رقم الإيصال / الشيك', 'Receipt / cheque'), U.esc(x.no || '—')], [L('دفعها', 'Paid by'), U.esc(x.u || '')]]) +
      A4.totals([[L('المبلغ المدفوع', 'Paid'), U.money(x.v), 1], [L('الرصيد بعد السداد', 'Balance after'), Sup.balTxt(s.balance).replace(/<[^>]+>/g, '')]], x.v) + (x.note ? '<div class="terms">' + U.esc(x.note) + '</div>' : '') + A4.sign([L('توقيع المورد / المستلم', 'Supplier signature'), L('الخزنة', 'Cashier')]) + A4.foot());
  },
  statementRows: function (s, from, to) {
    var ev = Sup.events(s), bal = Sup.opening(s), pre = 0, rows = [];
    ev.forEach(function (e) { if (from && e.t < from) { bal = U.r2(bal + e.v); return; } if (to && e.t >= to) return; bal = U.r2(bal + e.v); rows.push({ e: e, bal: bal }); });
    var start = U.r2(rows.length ? rows[0].bal - rows[0].e.v : bal);
    return { start: start, rows: rows, end: rows.length ? rows[rows.length - 1].bal : start };
  },
  printStatement: function (s, st) {
    var r = st ? rangeMs(st) : [0, 0], R = Sup.statementRows(s, r[0], r[1]), S2 = Sup.stats(s);
    var lines = [['—', L('رصيد أول المدة', 'Opening balance'), '', '', Sup.balTxt(R.start).replace(/<[^>]+>/g, ''), '']].concat(R.rows.map(function (x) { var e = x.e; return [U.dt(e.t), U.esc(e.d), e.v > 0 ? U.money(e.v) : '', e.v < 0 ? U.money(-e.v) : '', Sup.balTxt(x.bal).replace(/<[^>]+>/g, ''), U.esc(e.note || '')]; }));
    var inPer = function (k) { return H.sum(R.rows, function (x) { return k(x.e) ? Math.abs(x.e.v) : 0; }); };
    A4.print(A4.head(L('كشف حساب مورد', 'Supplier statement'), [[L('المورد', 'Supplier'), '<b>' + U.esc(s.name) + '</b>'], [L('الموبايل', 'Mobile'), '<span dir="ltr">' + U.esc([s.phone, s.phone2].filter(Boolean).join(' / ') || '—') + '</span>'], [L('الفترة', 'Period'), st ? st.from + ' ← ' + st.to : L('من البداية', 'All time')], [L('تاريخ الطباعة', 'Printed'), U.dt(Date.now())]]) +
      A4.table([L('التاريخ', 'Date'), L('البيان', 'Description'), L('عليّ (فواتير)', 'Debit (invoices)'), L('سددت (دفع / مرتجع)', 'Credit (paid / returns)'), L('الرصيد', 'Balance'), L('ملاحظة', 'Note')], lines) +
      A4.totals([[L('مشتريات الفترة', 'Purchases'), U.money(inPer(function (e) { return e.k === 'inv' || (e.k === 'man' && e.v > 0); }))], [L('مرتجعات وخصومات', 'Returns & credits'), U.money(inPer(function (e) { return e.k === 'ret' || (e.k === 'man' && e.v < 0); }))], [L('مدفوعات الفترة', 'Payments'), U.money(inPer(function (e) { return e.k === 'pay' || e.k === 'paidInv'; }))], [L('الرصيد النهائي', 'Closing balance'), Sup.balTxt(R.end).replace(/<[^>]+>/g, ''), 1]], Math.abs(R.end)) +
      '<div class="terms">' + L('إجمالي التعامل من البداية: مشتريات ', 'All time: purchases ') + U.money(S2.buy) + ' · ' + L('مرتجعات ', 'returns ') + U.money(S2.ret) + ' · ' + L('مدفوع ', 'paid ') + U.money(S2.paid) + ' · ' + L('عدد الفواتير ', 'invoices ') + S2.n + '</div>' +
      A4.sign([L('توقيع المورد بالمطابقة', 'Supplier (agreed)'), L('المحاسب', 'Accountant')]) + A4.foot());
  },
  waText: function (s) { var b = U.n(s.balance); return H.fill(L('السلام عليكم أ/ {name}\nمعاك {shop} — ملخص الحساب لحد النهارده ({date}):\n• إجمالي المشتريات: {buy} {cur}\n• المرتجعات: {ret} {cur}\n• المدفوع: {paid} {cur}\n• {bal}\nشكراً لتعاونكم 🙏', 'Hello {name}, account summary from {shop} as of {date}: purchases {buy}, returns {ret}, paid {paid}. {bal}'), { name: s.company || s.name, shop: shopName(), date: U.today(), buy: U.money(Sup.stats(s).buy), ret: U.money(Sup.stats(s).ret), paid: U.money(Sup.stats(s).paid), cur: cur(), bal: b > 0.009 ? L('الرصيد المستحق لكم: ', 'We owe you: ') + U.money(b) + ' ' + cur() : b < -0.009 ? L('رصيد مستحق لنا: ', 'You owe us: ') + U.money(-b) + ' ' + cur() : L('الحساب خالص ✅', 'Account settled ✅') }); }
};

/* ---------- the suppliers page: list → a full page per supplier ---------- */
Views.suppliers = function (el) {
  var V = Views.suppliers; V.el = el;
  if (V.cur && Sup.get(V.cur)) return V.page(el, Sup.get(V.cur));
  V.cur = null; V.list(el);
};
Views.suppliers.q = ''; Views.suppliers.tab = 'stmt'; Views.suppliers.st = { range: 'all', from: U.today(), to: U.today() };
Views.suppliers.list = function (el) {
  var V = Views.suppliers, all = Store.db.suppliers, owe = H.sum(all, function (s) { return Math.max(0, U.n(s.balance)); }), owed = H.sum(all, function (s) { return Math.max(0, -U.n(s.balance)); });
  var m0 = new Date(); m0.setDate(1); m0 = dayStart(m0); var monthBuy = H.sum(Store.db.purchases, function (p) { return p.date >= m0 && p.total > 0 ? p.total : 0; });
  el.innerHTML = '<div class="grid g4" style="margin-bottom:14px"><div class="card kpi hero"><div class="l">🏭 ' + L('إجمالي اللي للموردين عندنا', 'We owe suppliers') + '</div><div class="v num">' + U.money(owe) + '</div><div class="small">' + all.filter(function (s) { return U.n(s.balance) > 0.009; }).length + L(' مورد ليهم فلوس', ' suppliers') + '</div></div><div class="card kpi"><div class="l">💚 ' + L('لينا عند موردين', 'Suppliers owe us') + '</div><div class="v num" style="color:var(--ok)">' + U.money(owed) + '</div></div><div class="card kpi"><div class="l">🧾 ' + L('مشتريات الشهر ده', 'Purchases this month') + '</div><div class="v num">' + U.money(monthBuy) + '</div></div><div class="card kpi"><div class="l">👥 ' + L('عدد الموردين', 'Suppliers') + '</div><div class="v num">' + all.length + '</div></div></div>' +
    '<div class="row wrap" style="margin-bottom:12px"><input class="in" id="suQ" style="width:280px" placeholder="🔎 ' + L('اسم المورد أو موبايله', 'Name or mobile') + '" value="' + U.esc(V.q) + '"><select class="in" id="suF" style="width:auto"><option value="">' + L('الكل', 'All') + '</option><option value="owe">' + L('اللي ليهم فلوس', 'We owe them') + '</option><option value="owed">' + L('اللي علينا لهم لأ — لينا عندهم', 'They owe us') + '</option><option value="zero">' + L('الخالصين', 'Settled') + '</option></select><div class="grow"></div><button class="btn" id="suAll">🖨️ ' + L('كشف أرصدة الموردين', 'Balances report') + '</button>' + (can('suppliers') ? '<button class="btn pri" id="suNew">➕ ' + L('مورد جديد', 'New supplier') + '</button>' : '') + '</div><div id="suB" class="tbl-wrap"></div>';
  var draw = function () {
    var q = U.norm(V.q), qd = Phone.norm(V.q), f = $('#suF').value;
    var rows = all.filter(function (s) { var b = U.n(s.balance); return (!q || U.norm(s.name + ' ' + (s.company || '')).indexOf(q) >= 0 || (qd.length >= 4 && Phone.norm(s.phone + ' ' + (s.phone2 || '')).indexOf(qd) >= 0)) && (!f || (f === 'owe' ? b > 0.009 : f === 'owed' ? b < -0.009 : Math.abs(b) < 0.01)); }).map(function (s) { return { s: s, x: Sup.stats(s) }; }).sort(function (a, b) { return b.x.bal - a.x.bal; });
    $('#suB').innerHTML = rows.length ? '<table class="t"><tr><th>' + L('المورد', 'Supplier') + '</th><th>' + L('الموبايل', 'Mobile') + '</th><th>' + L('الفواتير', 'Invoices') + '</th><th>' + L('إجمالي المشتريات', 'Purchases') + '</th><th>' + L('إجمالي المدفوع', 'Paid') + '</th><th>' + L('الرصيد', 'Balance') + '</th><th>' + L('آخر حركة', 'Last activity') + '</th><th></th></tr>' + rows.map(function (r) { var s = r.s, x = r.x; return '<tr data-s="' + s.id + '" style="cursor:pointer"><td><b>' + U.esc(s.name) + '</b>' + (s.company ? '<div class="muted small">' + U.esc(s.company) + '</div>' : '') + '</td><td class="num">' + U.esc(s.phone || '—') + '</td><td class="num">' + x.n + '</td><td class="num">' + U.money(x.buy) + '</td><td class="num">' + U.money(x.paid) + '</td><td>' + Sup.balTxt(x.bal) + '</td><td class="num muted small">' + (x.last ? U.today(x.last) : '—') + '</td><td><button class="btn sm">' + L('فتح الحساب ←', 'Open →') + '</button></td></tr>'; }).join('') + '</table>' : '<div class="empty">' + L('مفيش موردين', 'No suppliers') + '</div>';
    $$('[data-s]').forEach(function (r) { r.onclick = function () { V.cur = r.dataset.s; V.tab = 'stmt'; V(el); }; });
  };
  $('#suQ').oninput = function () { V.q = this.value; draw(); }; $('#suF').onchange = draw; draw();
  if ($('#suNew')) $('#suNew').onclick = function () { Sup.edit(null, function (s) { V.cur = s.id; V(el); }); };
  $('#suAll').onclick = function () { var rows = all.map(function (s) { return { s: s, x: Sup.stats(s) }; }).sort(function (a, b) { return b.x.bal - a.x.bal; }); A4.print(A4.head(L('كشف أرصدة الموردين', 'Supplier balances'), [[L('التاريخ', 'Date'), U.dt(Date.now())], [L('علينا للموردين', 'We owe'), '<b>' + U.money(owe) + '</b>'], [L('لينا عند موردين', 'Owed to us'), U.money(owed)], [L('عدد الموردين', 'Suppliers'), all.length]]) + A4.table([L('م', '#'), L('المورد', 'Supplier'), L('الموبايل', 'Mobile'), L('المشتريات', 'Purchases'), L('المدفوع', 'Paid'), L('الرصيد', 'Balance')], rows.map(function (r, i) { return [i + 1, U.esc(r.s.name), '<span dir="ltr">' + U.esc(r.s.phone || '') + '</span>', U.money(r.x.buy), U.money(r.x.paid), Sup.balTxt(r.x.bal).replace(/<[^>]+>/g, '')]; })) + A4.foot()); };
};
Views.suppliers.page = function (el, s) {
  var V = Views.suppliers, x = Sup.stats(s), cv = can('products.viewCost') || can('suppliers');
  el.innerHTML = '<div class="row wrap" style="margin-bottom:12px"><button class="btn" id="spBack">→ ' + L('كل الموردين', 'All suppliers') + '</button><div style="font-size:30px">🏭</div><div class="grow"><h2 style="margin:0">' + U.esc(s.name) + '</h2><div class="muted small">' + [s.company, s.phone && '📱 ' + s.phone, s.phone2 && '☎️ ' + s.phone2, s.address && '📍 ' + s.address].filter(Boolean).map(U.esc).join(' · ') + '</div>' + (s.note ? '<div class="small">📌 ' + U.esc(s.note) + '</div>' : '') + '</div>' +
    (can('suppliers') ? '<button class="btn pri" id="spPay">💸 ' + L('سداد للمورد', 'Pay supplier') + '</button><button class="btn" id="spMan">🧾 ' + L('فاتورة / تسوية يدوية', 'Manual entry') + '</button><button class="btn" id="spBuy">🚚 ' + L('استلام بضاعة منه', 'Receive goods') + '</button><button class="btn" id="spEd">✏️</button>' : '') + '<button class="btn" id="spSt">🖨️ ' + L('كشف حساب A4', 'Statement A4') + '</button>' + (s.phone ? '<button class="btn" id="spWa">📲</button>' : '') + '</div>' +
    '<div class="grid g4" style="margin-bottom:14px"><div class="card kpi hero"><div class="l">' + L('الرصيد بينّا وبينه', 'Balance between us') + '</div><div class="v num" style="font-size:24px">' + (x.bal > 0.009 ? L('ليه ', 'We owe ') + U.money(x.bal) : x.bal < -0.009 ? L('لينا ', 'Owes us ') + U.money(-x.bal) : '✅ ' + L('خالص', 'Settled')) + '</div><div class="small">' + (x.bal > 0.009 ? L('المورد ليه فلوس عندك', 'You owe the supplier') : x.bal < -0.009 ? L('المورد عليه فلوس ليك', 'The supplier owes you') : L('مفيش حاجة لحد', 'Nothing outstanding')) + '</div></div>' +
    '<div class="card kpi"><div class="l">🧾 ' + L('إجمالي المشتريات', 'Total purchases') + '</div><div class="v num">' + (cv ? U.money(x.buy) : '•••') + '</div><div class="muted small">' + x.n + L(' فاتورة', ' invoices') + '</div></div><div class="card kpi"><div class="l">↩️ ' + L('المرتجعات والخصومات', 'Returns & credits') + '</div><div class="v num">' + U.money(x.ret) + '</div></div><div class="card kpi"><div class="l">💸 ' + L('إجمالي المدفوع', 'Total paid') + '</div><div class="v num" style="color:var(--ok)">' + U.money(x.paid) + '</div><div class="muted small">' + L('آخر حركة ', 'Last ') + (x.last ? U.today(x.last) : '—') + '</div></div></div>' +
    '<div class="row wrap" style="margin-bottom:12px">' + H.tabs('spT', [['stmt', '📜 ' + L('كشف الحساب والحركات', 'Statement & movements')], ['inv', '🧾 ' + L('الفواتير', 'Invoices') + ' (' + Sup.invoices(s).length + ')'], ['pay', '💸 ' + L('التسديدات', 'Payments') + ' (' + (s.payments || []).length + ')'], ['items', '📦 ' + L('الأصناف اللي أخدتها منه', 'Items bought')], ['notes', '📝 ' + L('الملاحظات', 'Notes') + ' (' + (s.notes || []).length + ')']], V.tab) + '</div><div id="spB"></div>';
  var re = function () { V(el); };
  $('#spBack').onclick = function () { V.cur = null; V(el); };
  H.bindTabs('spT', function (t) { V.tab = t; re(); });
  if ($('#spPay')) $('#spPay').onclick = function () { Sup.pay(s, re); };
  if ($('#spMan')) $('#spMan').onclick = function () { Sup.manual(s, re); };
  if ($('#spEd')) $('#spEd').onclick = function () { Sup.edit(s, re); };
  if ($('#spBuy')) $('#spBuy').onclick = function () { Views.purchases.draft = { supplier: s.id, ref: '', items: [], paid: 0, note: '', updCost: true, updPrice: true }; go('purchases'); };
  $('#spSt').onclick = function () { Sup.printStatement(s, V.st.range === 'all' ? null : V.st); };
  if ($('#spWa')) $('#spWa').onclick = function () { H.wa(s.phone, Sup.waText(s)); };
  var B = $('#spB');
  if (V.tab === 'stmt') {
    B.innerHTML = '<div class="row wrap" style="margin-bottom:10px"><div class="seg" id="spR"><button data-r="all" class="' + (V.st.range === 'all' ? 'on' : '') + '">' + L('من البداية', 'All time') + '</button></div>' + dateRangeBar('sps', V.st) + '</div><div id="spSb"></div>';
    bindRange('sps', V.st, function () { re(); }); $('#spR [data-r]').onclick = function () { V.st.range = 'all'; re(); };
    var r = V.st.range === 'all' ? [0, 0] : rangeMs(V.st), R = Sup.statementRows(s, r[0], r[1]);
    var icon = { inv: '🧾', ret: '↩️', man: '✍️', pay: '💸', paidInv: '💵' };
    $('#spSb').innerHTML = '<div class="tbl-wrap"><table class="t"><tr><th>' + L('التاريخ', 'Date') + '</th><th>' + L('البيان', 'Description') + '</th><th>' + L('عليّ (فواتير)', 'Debit') + '</th><th>' + L('سددت / مرتجع', 'Credit') + '</th><th>' + L('الرصيد', 'Balance') + '</th><th>' + L('ملاحظة', 'Note') + '</th><th></th></tr><tr style="background:var(--panel2)"><td>—</td><td><b>' + L('رصيد أول المدة', 'Opening balance') + '</b></td><td></td><td></td><td>' + Sup.balTxt(R.start) + '</td><td></td><td></td></tr>' +
      R.rows.slice().reverse().map(function (y) { var e = y.e; return '<tr><td class="num">' + U.dt(e.t) + '</td><td>' + (icon[e.k] || '') + ' ' + U.esc(e.d) + '</td><td class="num" style="color:var(--bad)">' + (e.v > 0 ? U.money(e.v) : '') + '</td><td class="num" style="color:var(--ok)">' + (e.v < 0 ? U.money(-e.v) : '') + '</td><td>' + Sup.balTxt(y.bal) + '</td><td class="small">' + U.esc(e.note || '') + '</td><td>' + (e.p ? '<button class="btn sm" data-ip="' + e.p.id + '">👁️</button>' : e.x ? '<button class="btn sm" data-pp="' + e.i + '">🖨️</button>' : '') + '</td></tr>'; }).join('') + '</table></div><div class="muted small" style="margin-top:6px">' + L('الأحدث فوق · «عليّ» = فواتير بتزوّد اللي ليه · «سددت» = فلوس دفعتها أو بضاعة رجعتها', 'Newest first') + '</div>';
  } else if (V.tab === 'inv') {
    var inv = Sup.invoices(s);
    B.innerHTML = inv.length ? '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('النوع', 'Type') + '</th><th>' + L('رقم فاتورة المورد', 'Supplier ref') + '</th><th>' + L('أصناف', 'Items') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>' + L('مدفوع', 'Paid') + '</th><th>' + L('ملاحظة', 'Note') + '</th><th></th></tr>' + inv.map(function (p) { var ret = p.total < 0; return '<tr data-ip="' + p.id + '" style="cursor:pointer"><td class="num"><b>' + p.no + '</b></td><td class="num">' + U.dt(p.date) + '</td><td>' + (ret ? H.chip('↩️ ' + L('مرتجع', 'Return'), 'warn') : p.manual ? H.chip('✍️ ' + L('يدوية', 'Manual')) : H.chip('🧾 ' + L('شراء', 'Purchase'), 'ok')) + '</td><td>' + U.esc(p.ref || '—') + '</td><td class="num">' + (p.items || []).length + '</td><td class="num"><b>' + U.money(Math.abs(p.total)) + '</b></td><td class="num">' + U.money(p.paid) + '</td><td class="small">' + U.esc(p.note || '') + '</td><td><button class="btn sm" data-pr="' + p.id + '">🖨️</button></td></tr>'; }).join('') + '</table></div>' : '<div class="empty">' + L('لسه مفيش فواتير من المورد ده — بتتسجل لوحدها لما تستلم بضاعة منه من «المشتريات»', 'No invoices yet') + '</div>';
  } else if (V.tab === 'pay') {
    var ps = Sup.pays(s);
    B.innerHTML = ps.length ? '<div class="tbl-wrap"><table class="t"><tr><th>' + L('التاريخ', 'Date') + '</th><th>' + L('المبلغ', 'Amount') + '</th><th>' + L('الطريقة', 'Method') + '</th><th>' + L('رقم الإيصال / الشيك', 'Ref') + '</th><th>' + L('دفعها', 'By') + '</th><th>' + L('ملاحظة', 'Note') + '</th><th></th></tr>' + ps.map(function (p) { var i = s.payments.indexOf(p); return '<tr><td class="num">' + U.dt(p.t) + '</td><td class="num"><b>' + U.money(p.v) + '</b></td><td>' + pmName(p.m || 'cash') + (p.drawer ? ' <span class="muted small">(' + L('من الدرج', 'drawer') + ')</span>' : '') + '</td><td>' + U.esc(p.no || p.ref || '—') + '</td><td>' + U.esc(p.u || '') + '</td><td class="small">' + U.esc(p.note || '') + '</td><td class="row" style="gap:4px"><button class="btn sm" data-pp="' + i + '">🖨️</button>' + (can('settings') ? '<button class="btn sm ghost" data-pd="' + i + '" style="color:var(--bad)">✕</button>' : '') + '</td></tr>'; }).join('') + '</table></div>' : '<div class="empty">' + L('لسه مفيش تسديدات', 'No payments yet') + '</div>';
  } else if (V.tab === 'items') {
    var agg = {};
    Sup.invoices(s).forEach(function (p) { (p.items || []).forEach(function (i) { var k = i.pid || i.name, a = agg[k] || (agg[k] = { name: Sup.itemName(i), q: 0, v: 0, last: 0, cost: 0 }); a.q += i.qty; a.v += i.qty * i.cost; if (p.date > a.last && i.qty > 0) { a.last = p.date; a.cost = i.cost; } }); });
    var rows = Object.keys(agg).map(function (k) { return agg[k]; }).sort(function (a, b) { return b.v - a.v; });
    B.innerHTML = rows.length ? '<div class="tbl-wrap"><table class="t"><tr><th>' + L('الصنف', 'Item') + '</th><th>' + L('إجمالي الكمية', 'Total qty') + '</th>' + (cv ? '<th>' + L('آخر سعر', 'Last cost') + '</th><th>' + L('إجمالي القيمة', 'Total value') + '</th>' : '') + '<th>' + L('آخر مرة', 'Last time') + '</th></tr>' + rows.map(function (a) { return '<tr><td><b>' + U.esc(a.name) + '</b></td><td class="num">' + U.r2(a.q) + '</td>' + (cv ? '<td class="num">' + U.money(a.cost) + '</td><td class="num">' + U.money(a.v) + '</td>' : '') + '<td class="num">' + (a.last ? U.today(a.last) : '—') + '</td></tr>'; }).join('') + '</table></div>' : '<div class="empty">—</div>';
  } else {
    var ns = (s.notes || []).slice().reverse();
    B.innerHTML = '<div class="card col" style="margin-bottom:12px"><div class="row"><input class="in grow" id="snT" placeholder="' + L('اكتب ملاحظة (اتفاق، ميعاد، شكوى، خصم…)', 'Write a note (agreement, date, complaint, discount…)') + '"><input class="in" type="date" id="snD" value="' + U.today() + '" style="width:auto"><button class="btn pri" id="snA">➕ ' + L('إضافة', 'Add') + '</button></div></div>' + (ns.length ? ns.map(function (n) { var i = s.notes.indexOf(n); return '<div class="list-row"><span style="font-size:18px">📝</span><div class="grow"><b>' + U.esc(n.text) + '</b><div class="muted small">' + (n.day || U.today(n.t)) + ' · ' + U.esc(n.by || '') + '</div></div><button class="btn sm ghost" data-nd="' + i + '">✕</button></div>'; }).join('') : '<div class="empty">' + L('مفيش ملاحظات', 'No notes') + '</div>');
    $('#snA').onclick = function () { var t = $('#snT').value.trim(); if (!t) return; (s.notes = s.notes || []).push({ t: Date.now(), day: $('#snD').value || U.today(), text: t, by: App.user.name }); Store.save(); re(); };
    $('#snT').onkeydown = function (e) { if (e.key === 'Enter') $('#snA').click(); };
    $$('[data-nd]').forEach(function (b) { b.onclick = function () { s.notes.splice(+b.dataset.nd, 1); Store.save(); re(); }; });
  }
  var findP = function (id) { return Store.db.purchases.filter(function (p) { return p.id === id; })[0]; };
  $$('[data-ip]', B).forEach(function (r) { r.onclick = function (e) { if (e.target.closest('[data-pr]')) return; Sup.invoice(s, findP(r.dataset.ip)); }; });
  $$('[data-pr]', B).forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); Sup.printInvoice(s, findP(b.dataset.pr)); }; });
  $$('[data-pp]', B).forEach(function (b) { b.onclick = function () { Sup.printPay(s, s.payments[+b.dataset.pp]); }; });
  $$('[data-pd]', B).forEach(function (b) { b.onclick = function () { var p = s.payments[+b.dataset.pd]; Modal.confirm(L('حذف السداد ده (', 'Delete this payment (') + U.money(p.v) + L(')؟ الرصيد هيرجع زي ما كان.', ')? The balance will be restored.'), function () { s.payments.splice(+b.dataset.pd, 1); s.balance = U.r2(U.n(s.balance) + U.n(p.v)); Store.log('supplier.pay.delete', s.name + ' ' + p.v); Store.save(); re(); }); }; });
};

/* supplier payments taken from the cash drawer reduce the shift's expected cash */
(function () {
  var sc = Views.shifts.calc;
  Views.shifts.calc = function (sh) {
    var r = sc.apply(this, arguments), out = 0;
    Store.db.suppliers.forEach(function (s) { (s.payments || []).forEach(function (p) { if (p.shift === sh.id && p.drawer) out += U.n(p.v); }); });
    if (out) { r.supPaid = U.r2(out); r.exp = U.r2(r.exp + out); r.expected = U.r2(r.expected - out); }
    return r;
  };
})();
