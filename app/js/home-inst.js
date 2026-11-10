/* Ghandi Home — instalment sales (التقسيط): contracts, guarantors, schedule, collection, lateness, A4 contract
   Eng. Mohamed Ali — 01098811581 */
'use strict';
var Inst = {
  remaining: function (c) { return U.r2(H.sum(c.schedule, function (s) { return s.amount - s.paid; })); },
  collected: function (c) { return U.r2(H.sum(c.pays, function (p) { return p.v - U.n(p.fee); })); },
  nextDue: function (c) { return c.schedule.filter(function (s) { return s.paid < s.amount - 0.009; })[0] || null; },
  lateList: function (c) { var g = U.n(homeCfg().instGrace); return c.schedule.filter(function (s) { return s.paid < s.amount - 0.009 && H.daysTo(s.due) < -g; }); },
  lateDays: function (c) { var n = Inst.nextDue(c); if (!n) return 0; var d = -H.daysTo(n.due); return d > 0 ? d : 0; },
  lateFee: function (c) { var f = U.n(homeCfg().instLateFee), g = U.n(homeCfg().instGrace); if (!f) return 0; return U.r2(H.sum(Inst.lateList(c), function (s) { return Math.max(0, -H.daysTo(s.due) - g) * f; })); },
  status: function (c) {
    if (c.status === 'void') return ['⛔ ' + L('ملغي', 'Cancelled'), 'bad'];
    if (Inst.remaining(c) <= 0.009) return ['✅ ' + L('خالص', 'Paid off'), 'ok'];
    if (Inst.lateList(c).length) return ['⏰ ' + L('متأخر ', 'Late ') + Inst.lateList(c).length + L(' قسط', ' inst.'), 'bad'];
    var n = Inst.nextDue(c), d = n ? H.daysTo(n.due) : 99;
    if (d <= U.n(homeCfg().instWarnDays)) return ['🔔 ' + (d <= 0 ? L('مستحق النهارده', 'Due today') : L('مستحق بعد ', 'Due in ') + d + L(' يوم', ' d')), 'warn'];
    return ['🟢 ' + L('منتظم', 'On track'), ''];
  },
  open: function () { return (Store.db.inst || []).filter(function (c) { return c.status !== 'void' && Inst.remaining(c) > 0.009; }); },
  calc: function (price, down, months, rate, type, round) {
    var fin = Math.max(0, U.r2(price - down)), extra = type === 'total' ? fin * rate / 100 : fin * rate / 100 * months;
    var total = U.r2(fin + extra), per = months ? total / months : total;
    if (round > 0) per = Math.ceil(per / round) * round; per = U.r2(per);
    var sched = [], left = total;
    for (var i = 0; i < months; i++) { var a = i === months - 1 ? U.r2(left) : Math.min(per, U.r2(left)); left = U.r2(left - a); sched.push(a); }
    return { fin: fin, extra: U.r2(extra), total: total, per: per, sched: sched.filter(function (a) { return a > 0; }) };
  },
  /* the contract form — used from the POS cart and for manual contracts */
  form: function (o) {
    var h = homeCfg(), price = U.r2(o.price), isCart = !!o.cart;
    var gN = Math.max(h.instGuarantors, 1);
    var gHtml = function (i) { return '<div class="card" style="padding:10px;background:var(--panel2)"><b>🤝 ' + L('الضامن ', 'Guarantor ') + (i + 1) + (i < h.instGuarantors ? ' *' : ' (' + L('اختياري', 'optional') + ')') + '</b><div class="grid g4" style="margin-top:6px"><input class="in" data-g="' + i + '" data-k="name" placeholder="' + L('الاسم', 'Name') + '"><input class="in num" data-g="' + i + '" data-k="phone" placeholder="' + L('الموبايل', 'Mobile') + '"><input class="in num" data-g="' + i + '" data-k="nid" placeholder="' + L('الرقم القومي', 'National ID') + '"><input class="in" data-g="' + i + '" data-k="job" placeholder="' + L('الوظيفة / جهة العمل', 'Job') + '"></div><input class="in" style="margin-top:6px" data-g="' + i + '" data-k="address" placeholder="' + L('العنوان', 'Address') + '"></div>'; };
    var gs = []; for (var i = 0; i < Math.max(gN, 1); i++) gs.push(gHtml(i));
    var m = Modal.open({ size: 'xl', sticky: true, title: '🏦 ' + L('بيع بالتقسيط — عقد جديد', 'Instalment sale — new contract'), body: '<div class="grid" style="grid-template-columns:1.25fr 1fr;gap:18px"><div class="col">' +
      '<div class="card" style="padding:12px"><b>👤 ' + L('المشتري', 'Buyer') + '</b><div id="iC" style="margin-top:6px"></div><div class="grid g3" style="margin-top:6px"><input class="in num" id="iNid" placeholder="' + L('الرقم القومي', 'National ID') + '"><input class="in" id="iJob" placeholder="' + L('الوظيفة / جهة العمل', 'Job / employer') + '"><input class="in num" id="iPh2" placeholder="' + L('موبايل تاني', 'Second mobile') + '"></div><input class="in" style="margin-top:6px" id="iAdr" placeholder="' + L('العنوان بالتفصيل', 'Full address') + '"></div>' +
      gs.join('') + (gN < 3 ? '<button class="btn sm" id="iMoreG">➕ ' + L('ضامن كمان', 'Add guarantor') + '</button>' : '') +
      (isCart ? '' : '<label class="f">' + L('البيان (اللي اتباع)', 'Description') + '<input class="in" id="iDesc" value="' + U.esc(o.desc || '') + '"></label>') + '</div>' +
      '<div class="col"><div class="card kpi hero"><div class="l">' + L('سعر الكاش', 'Cash price') + '</div><div class="v num">' + U.money(price) + '</div><div class="small">' + (isCart ? o.cart.items.length + L(' صنف', ' items') : '') + '</div></div>' +
      '<div class="grid g2"><label class="f">' + L('المقدم', 'Down payment') + '<input class="in num" type="number" id="iDown" value="' + Math.ceil(price * h.instDownPct / 100) + '" style="font-size:18px"></label><label class="f">' + L('طريقة دفع المقدم', 'Down-payment method') + H.pmSelect('iDm', 'cash') + '</label>' +
      '<label class="f">' + L('عدد الشهور', 'Months') + '<input class="in num" type="number" min="1" id="iMon" value="' + h.instMonths + '" style="font-size:18px"></label><label class="f">' + L('نسبة الزيادة %', 'Mark-up %') + '<div class="row"><input class="in num grow" type="number" step="0.1" id="iRate" value="' + h.instRate + '"><select class="in" id="iType" style="width:auto"><option value="monthly"' + (h.instType === 'monthly' ? ' selected' : '') + '>' + L('شهرياً', 'monthly') + '</option><option value="total"' + (h.instType === 'total' ? ' selected' : '') + '>' + L('على الكل', 'flat') + '</option></select></div></label>' +
      '<label class="f">' + L('أول قسط يوم', 'First instalment on') + '<input class="in" type="date" id="iStart" value="' + H.addMonths(U.today(), 1) + '"></label><label class="f">' + L('تقريب القسط لأقرب', 'Round to') + '<input class="in num" type="number" id="iRound" value="' + h.instRound + '"></label></div>' +
      '<div class="card" id="iSum" style="padding:12px"></div><label class="f">' + L('ملاحظة', 'Note') + '<input class="in" id="iNote"></label><label class="row small"><input type="checkbox" class="sw" id="iPrn" checked> ' + L('طباعة العقد وجدول الأقساط A4', 'Print contract & schedule (A4)') + '</label></div></div>',
      foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri lg" id="iGo">✅ ' + L('اعتماد العقد', 'Confirm contract') + '</button>' });
    var cb = H.custBox($('#iC', m), o.customer, 'inst');
    var fillCust = function () { var c = Cust.byPhone($('[data-cph]', m).value); if (c) { if (c.nid && !$('#iNid', m).value) $('#iNid', m).value = c.nid; if (c.address && !$('#iAdr', m).value) $('#iAdr', m).value = c.address; if (c.job && !$('#iJob', m).value) $('#iJob', m).value = c.job; } };
    $('[data-cph]', m).addEventListener('input', fillCust); fillCust();
    var r;
    var calc = function () {
      var dn = U.n($('#iDown', m).value), mo = Math.max(1, Math.round(U.n($('#iMon', m).value) || 1));
      r = Inst.calc(price, dn, mo, U.n($('#iRate', m).value), $('#iType', m).value, U.n($('#iRound', m).value));
      var st = $('#iStart', m).value || U.today();
      $('#iSum', m).innerHTML = '<div class="grid g2" style="gap:6px"><div>' + L('المتبقي بعد المقدم', 'After down payment') + '</div><b class="num">' + U.money(r.fin) + '</b><div>' + L('الزيادة', 'Mark-up') + '</div><b class="num">' + U.money(r.extra) + '</b><div>' + L('إجمالي المقسط', 'Total financed') + '</div><b class="num">' + U.money(r.total) + '</b><div><b>' + L('القسط الشهري', 'Monthly instalment') + '</b></div><b class="num" style="font-size:20px;color:var(--ok)">' + U.money(r.per) + '</b><div>' + L('عدد الأقساط', 'Count') + '</div><b class="num">' + r.sched.length + '</b><div>' + L('آخر قسط', 'Last on') + '</div><b class="num">' + H.addMonths(st, r.sched.length - 1) + '</b><div>' + L('إجمالي اللي هيدفعه', 'Grand total paid') + '</div><b class="num">' + U.money(r.total + U.n($('#iDown', m).value)) + '</b></div>';
    };
    $$('#iDown,#iMon,#iRate,#iType,#iStart,#iRound', m).forEach(function (i) { i.oninput = calc; i.onchange = calc; }); calc();
    if ($('#iMoreG', m)) $('#iMoreG', m).onclick = function () { var n = $$('[data-k="name"]', m).length; if (n >= 3) return; this.insertAdjacentHTML('beforebegin', gHtml(n)); if (n + 1 >= 3) this.remove(); };
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#iGo', m).onclick = function () {
      var cu = cb.get(); if (!cu) return;
      var dn = U.r2(U.n($('#iDown', m).value)); if (dn < 0 || dn > price) return toast(L('المقدم غلط', 'Invalid down payment'), 'bad');
      if (r.total <= 0) return toast(L('مفيش مبلغ للتقسيط — بيعها كاش', 'Nothing to finance — sell it as cash'), 'bad');
      var g = []; $$('[data-k="name"]', m).forEach(function (n) { var i = n.dataset.g, o = {}; $$('[data-g="' + i + '"]', m).forEach(function (x) { o[x.dataset.k] = x.value.trim(); }); if (o.name) g.push(o); });
      if (g.length < h.instGuarantors) return toast(L('لازم ', 'Need ') + h.instGuarantors + L(' ضامن على الأقل', ' guarantor(s)'), 'bad');
      if (g.some(function (x) { return !Phone.valid(x.phone); })) return toast(L('اكتب موبايل الضامن صح', 'Enter a valid guarantor mobile'), 'bad');
      cu.nid = $('#iNid', m).value.trim() || cu.nid || ''; cu.address = $('#iAdr', m).value.trim() || cu.address || ''; cu.job = $('#iJob', m).value.trim() || cu.job || ''; if ($('#iPh2', m).value.trim()) cu.phone2 = Phone.norm($('#iPh2', m).value);
      var db = Store.db; db.seq.inst++;
      var st = $('#iStart', m).value || H.addMonths(U.today(), 1);
      var c = { id: U.id(), no: db.seq.inst, date: Date.now(), customer: cu.id, price: price, down: dn, downM: $('#iDm', m).value, months: r.sched.length, rate: U.n($('#iRate', m).value), rateType: $('#iType', m).value, fin: r.fin, extra: r.extra, instTotal: r.total,
        schedule: r.sched.map(function (a, i) { return { n: i + 1, due: H.addMonths(st, i), amount: a, paid: 0 }; }), guarantors: g, pays: [], note: $('#iNote', m).value, by: App.user.name, status: 'open', desc: isCart ? '' : $('#iDesc', m).value };
      if (isCart) {
        var t = o.totals, pays = {}; if (dn) pays[c.downM] = dn; pays.inst = U.r2(t.total - dn);
        var sale = Sales.create({ type: 'sale', items: o.cart.items, tier: o.cart.tier, customer: cu.id, discount: t.disc, vat: t.vat, subtotal: t.sub, total: t.total, payments: pays, paid: t.total, change: 0, credit: 0 });
        sale.instNo = c.no; c.sale = sale.id; c.saleNo = sale.no; c.items = sale.items.map(function (i) { return { name: i.name, qty: i.qty, price: i.price }; });
        if (dn && c.downM === 'cash') try { Drawer.auto({ type: 'sale', payments: { cash: dn }, no: sale.no }); } catch (e) { }
      } else {
        c.items = [{ name: c.desc || L('بضاعة', 'Goods'), qty: 1, price: price }];
        if (dn) H.pay(c.pays, dn, c.downM, { down: 1 });
      }
      db.inst.push(c); cu.lastVisit = Date.now(); Store.log('inst.create', 'I#' + c.no + ' ' + c.instTotal); Store.save();
      var prn = $('#iPrn', m).checked; Modal.close(m);
      if (o.done) o.done(c);
      if (prn) Inst.printContract(c);
      toast('🏦 ' + L('تم عقد التقسيط رقم ', 'Contract #') + c.no + ' — ' + L('القسط ', 'instalment ') + U.money(c.schedule[0].amount), 'ok');
    };
  },
  fromCart: function () {
    var c = App.cart; if (!c.items.length) return toast(L('ضيف أصناف الأول', 'Add items first'), 'bad');
    if (c.items.some(function (i) { return i.gift; })) return toast(L('كارت الهدية مينفعش يتقسط', 'Gift cards cannot be financed'), 'bad');
    if (shiftsOn() && !App.shift) return toast(L('افتح وردية أولاً', 'Open a shift first'), 'bad');
    var t = Views.pos.totals(), pre = c.customer || (c.newCust && c.newCust.phone ? (Cust.byPhone(c.newCust.phone) || {}).id : '');
    Inst.form({ cart: c, totals: t, price: t.total, customer: pre, done: function () { App.cart = newCart(); go('pos'); } });
  },
  manual: function () { Modal.prompt('🏦 ' + L('عقد تقسيط بدون فاتورة', 'Contract without invoice'), L('سعر البضاعة الكاش', 'Cash price of the goods'), '', function (v) { v = U.r2(U.n(v)); if (v <= 0) return; Inst.form({ price: v, done: function () { if (App.view === 'installments') go('installments'); } }); }, 'number'); },
  /* collect money: applied to the oldest unpaid instalments first */
  collect: function (c, after) {
    if (!can('inst.collect')) return toast(L('مفيش صلاحية تحصيل', 'No permission'), 'bad');
    if (shiftsOn() && !App.shift) return toast(L('افتح وردية أولاً', 'Open a shift first'), 'bad');
    var n = Inst.nextDue(c); if (!n) return toast(L('العقد خالص', 'Contract is paid off'), 'ok');
    var due = U.r2(n.amount - n.paid), rem = Inst.remaining(c), fee = Inst.lateFee(c), cu = H.cust(c.customer) || {};
    H.collect('💵 ' + L('تحصيل قسط — عقد ', 'Collect — contract #') + c.no, due, function (r) {
      var feeV = U.r2(Math.min(U.n($('#hcFee', r.modal) ? $('#hcFee', r.modal).value : 0), r.v)), v = U.r2(r.v - feeV);
      if (v > rem + 0.009) { toast(L('المبلغ أكبر من المتبقي ', 'More than the remaining ') + U.money(rem), 'bad'); return false; }
      if (v <= 0 && !feeV) return false;
      var left = v, touched = [];
      c.schedule.forEach(function (s) { if (left <= 0) return; var need = U.r2(s.amount - s.paid); if (need <= 0) return; var take = Math.min(need, left); s.paid = U.r2(s.paid + take); left = U.r2(left - take); touched.push(s.n); if (s.paid >= s.amount - 0.009) s.paidAt = Date.now(); });
      var p = H.pay(c.pays, v + feeV, r.m, { ins: touched, fee: feeV || 0, rec: (c.pays.length + 1) });
      if (Inst.remaining(c) <= 0.009) { c.status = 'done'; c.doneAt = Date.now(); }
      Store.log('inst.collect', 'I#' + c.no + ' ' + p.v); Store.save();
      Inst.printReceipt(c, p);
      toast('✅ ' + L('اتحصّل ', 'Collected ') + U.money(p.v) + (c.status === 'done' ? ' — 🎉 ' + L('العقد خلص', 'contract paid off') : ''), 'ok');
      if (after) after();
    }, { label: L('القسط رقم ', 'Instalment #') + n.n + ' · ' + n.due, sub: U.esc(cu.name || '') + ' · ' + L('إجمالي المتبقي ', 'total left ') + U.money(rem), extra: fee ? '<label class="f">⏰ ' + L('غرامة تأخير (من ضمن المبلغ)', 'Late fee (included)') + '<input class="in num" type="number" id="hcFee" value="' + fee + '"></label>' : '', btn: L('تحصيل وطباعة إيصال', 'Collect & print receipt'), def: due + fee });
  },
  settleEarly: function (c, after) {
    if (!can('inst.void')) return toast(L('مفيش صلاحية', 'No permission'), 'bad');
    var rem = Inst.remaining(c), unpaidMonths = c.schedule.filter(function (s) { return s.paid < s.amount; }).length, sug = c.rateType === 'monthly' ? U.r2(Math.min(rem, c.fin * c.rate / 100 * Math.max(0, unpaidMonths - 1))) : 0;
    var m = Modal.open({ title: '⚡ ' + L('سداد مبكر — عقد ', 'Early settlement #') + c.no, body: '<div class="col"><div class="card kpi hero"><div class="l">' + L('المتبقي', 'Remaining') + '</div><div class="v num">' + U.money(rem) + '</div></div><label class="f">' + L('خصم السداد المبكر', 'Early-settlement discount') + '<input class="in num" type="number" id="esD" value="' + sug + '"></label><label class="f">' + L('طريقة الدفع', 'Method') + H.pmSelect('esM', 'cash') + '</label><div class="muted small" id="esR"></div></div>', foot: '<button class="btn pri" id="esGo">✅ ' + L('سداد وتقفيل العقد', 'Settle & close') + '</button>' });
    var rr = function () { $('#esR', m).innerHTML = L('هيدفع: ', 'Pays: ') + '<b>' + U.money(rem - U.n($('#esD', m).value)) + '</b>'; }; $('#esD', m).oninput = rr; rr();
    $('#esGo', m).onclick = function () {
      var d = U.r2(Math.max(0, Math.min(rem, U.n($('#esD', m).value)))), v = U.r2(rem - d);
      c.schedule.forEach(function (s) { s.paid = s.amount; s.paidAt = s.paidAt || Date.now(); });
      var p = H.pay(c.pays, v, $('#esM', m).value, { early: 1, disc: d, rec: c.pays.length + 1 }); c.earlyDisc = d; c.status = 'done'; c.doneAt = Date.now();
      Store.log('inst.early', 'I#' + c.no + ' ' + v + ' disc ' + d); Store.save(); Modal.close(m); Inst.printReceipt(c, p); toast('🎉 ' + L('العقد اتقفل', 'Contract closed'), 'ok'); if (after) after();
    };
  },
  waText: function (c) { var n = Inst.nextDue(c), cu = H.cust(c.customer) || {}; return H.fill(L('السلام عليكم {name} 🌷\nتذكير من {shop}: القسط رقم {n} بقيمة {amount} {cur} {when} ({date}).\nالمتبقي على العقد: {rem} {cur}.\nشكراً لالتزامك 🙏', 'Hello {name}, reminder from {shop}: instalment #{n} of {amount} {cur} is due {date}. Remaining: {rem} {cur}.'), { name: cu.name || '', shop: shopName(), n: n ? n.n : '', amount: n ? U.money(n.amount - n.paid) : '', cur: cur(), date: n ? n.due : '', when: n && H.daysTo(n.due) < 0 ? L('كان مستحق', 'was due') : L('مستحق', 'is due'), rem: U.money(Inst.remaining(c)) }); },
  printReceipt: function (c, p) {
    var cu = H.cust(c.customer) || {}, en = lang() === 'en';
    var row = function (a, b) { return '<div style="display:flex;justify-content:space-between"><span>' + a + '</span><b>' + b + '</b></div>'; };
    Printer.print('<div class="rc" style="width:72mm;padding:3mm;font-size:12px"><div style="text-align:center;font-weight:800;font-size:16px">' + U.esc(shopName(en)) + '</div><div style="text-align:center;font-size:14px;margin:4px 0;border:1.5px solid #000;border-radius:6px;padding:3px">🏦 ' + L('إيصال سداد قسط', 'Instalment receipt') + '</div>' +
      row(L('عقد رقم', 'Contract'), c.no) + row(L('إيصال رقم', 'Receipt'), c.no + '-' + (p.rec || c.pays.length)) + row(L('التاريخ', 'Date'), U.dt(p.t)) + '<div>' + U.esc(cu.name || '') + ' — <span dir="ltr">' + U.esc(cu.phone || '') + '</span></div><hr>' +
      row(L('المبلغ المدفوع', 'Paid'), U.money(p.v)) + (p.fee ? row(L('منها غرامة تأخير', 'incl. late fee'), U.money(p.fee)) : '') + (p.disc ? row(L('خصم سداد مبكر', 'Early discount'), U.money(p.disc)) : '') + row(L('طريقة الدفع', 'Method'), pmName(p.m)) + (p.ins && p.ins.length ? row(L('عن الأقساط', 'For instalments'), p.ins.join('، ')) : '') + '<hr>' +
      row(L('إجمالي المدفوع', 'Total paid'), U.money(Inst.collected(c) + (c.sale ? U.n(c.down) : 0))) + row(L('المتبقي', 'Remaining'), U.money(Inst.remaining(c))) + (Inst.nextDue(c) ? row(L('القسط الجاي', 'Next'), Inst.nextDue(c).due + ' — ' + U.money(Inst.nextDue(c).amount - Inst.nextDue(c).paid)) : '<div style="text-align:center;font-weight:800;margin-top:4px">🎉 ' + L('العقد خالص بالكامل', 'Fully paid') + '</div>') +
      '<div style="margin-top:6px">' + L('المستلم: ', 'Received by: ') + U.esc(p.by) + '</div><div style="text-align:center;margin-top:6px;font-size:9px;color:#555">Ghandi Home · ' + APP.devEn + ' · ' + APP.phone + '</div></div>',
      { css: '@page{size:80mm auto;margin:0}body{margin:0;font-family:Tahoma,Arial}', printer: S().printers.invoice, silent: S().printers.silent, dir: en ? 'ltr' : 'rtl' });
  },
  printContract: function (c) {
    var cu = H.cust(c.customer) || {}, h = homeCfg();
    var g = c.guarantors.map(function (x, i) { return '<div class="meta" style="grid-template-columns:1fr 1fr 1fr"><div><b>' + L('الضامن ', 'Guarantor ') + (i + 1) + ':</b>' + U.esc(x.name) + '</div><div><b>' + L('موبايل', 'Mobile') + ':</b><span dir="ltr">' + U.esc(x.phone) + '</span></div><div><b>' + L('رقم قومي', 'ID') + ':</b>' + U.esc(x.nid || '—') + '</div><div><b>' + L('الوظيفة', 'Job') + ':</b>' + U.esc(x.job || '—') + '</div><div style="grid-column:span 2"><b>' + L('العنوان', 'Address') + ':</b>' + U.esc(x.address || '—') + '</div></div>'; }).join('');
    A4.print(A4.head(L('عقد بيع بالتقسيط', 'Instalment sale contract'), [[L('رقم العقد', 'Contract no.'), '<b>' + c.no + '</b>'], [L('التاريخ', 'Date'), U.dt(c.date)], [L('رقم الفاتورة', 'Invoice'), c.saleNo || '—'], [L('محرر العقد', 'Prepared by'), U.esc(c.by)]]) +
      '<h3 class="s">👤 ' + L('الطرف الثاني (المشتري)', 'Buyer') + '</h3><div class="meta" style="grid-template-columns:1fr 1fr 1fr"><div><b>' + L('الاسم', 'Name') + ':</b>' + U.esc(cu.name || '') + '</div><div><b>' + L('موبايل', 'Mobile') + ':</b><span dir="ltr">' + U.esc([cu.phone, cu.phone2].filter(Boolean).join(' / ')) + '</span></div><div><b>' + L('رقم قومي', 'ID') + ':</b>' + U.esc(cu.nid || '—') + '</div><div><b>' + L('الوظيفة', 'Job') + ':</b>' + U.esc(cu.job || '—') + '</div><div style="grid-column:span 2"><b>' + L('العنوان', 'Address') + ':</b>' + U.esc(cu.address || '—') + '</div></div>' +
      (g ? '<h3 class="s">🤝 ' + L('الضامنين', 'Guarantors') + '</h3>' + g : '') +
      '<h3 class="s">🛒 ' + L('البضاعة', 'Goods') + '</h3>' + A4.table([L('م', '#'), L('الصنف', 'Item'), L('الكمية', 'Qty'), L('السعر', 'Price'), L('الإجمالي', 'Total')], (c.items || []).map(function (i, x) { return [x + 1, U.esc(i.name), U.r2(i.qty), U.money(i.price), U.money(i.qty * i.price)]; })) +
      A4.totals([[L('سعر الكاش', 'Cash price'), U.money(c.price)], [L('المقدم', 'Down payment'), U.money(c.down)], [L('الزيادة', 'Mark-up') + ' (' + c.rate + '%' + (c.rateType === 'monthly' ? L(' شهرياً', '/mo') : '') + ')', U.money(c.extra)], [L('إجمالي المقسط', 'Total financed'), U.money(c.instTotal), 1], [L('عدد الأقساط', 'Instalments'), c.months]], c.instTotal) +
      '<h3 class="s">📅 ' + L('جدول الأقساط', 'Schedule') + '</h3>' + A4.table([L('القسط', '#'), L('تاريخ الاستحقاق', 'Due date'), L('القيمة', 'Amount'), L('المدفوع', 'Paid'), L('الحالة', 'Status'), L('توقيع المحصّل', 'Collector')], c.schedule.map(function (s) { var late = s.paid < s.amount && H.daysTo(s.due) < 0; return [s.n, s.due, U.money(s.amount), U.money(s.paid), s.paid >= s.amount - 0.009 ? '<span class="badge paid">' + L('مدفوع', 'Paid') + '</span>' : late ? '<span class="badge late">' + L('متأخر', 'Late') + '</span>' : '—', '']; }), 99) +
      (h.instTerms ? '<div class="terms"><b>' + L('شروط العقد', 'Terms') + '</b>\n' + U.esc(h.instTerms) + '</div>' : '') +
      '<div class="sign"><div>' + L('الطرف الأول (البائع)', 'Seller') + '</div><div>' + L('الطرف الثاني (المشتري)', 'Buyer') + '<br><small style="font-weight:400">' + L('التوقيع والبصمة', 'Signature & thumbprint') + '</small></div>' + c.guarantors.map(function (x, i) { return '<div>' + L('الضامن ', 'Guarantor ') + (i + 1) + '<br><small style="font-weight:400">' + U.esc(x.name) + '</small></div>'; }).join('') + '</div>' + A4.foot());
  }
};

/* ================= instalments page ================= */
Views.installments = {
  tab: 'due', q: '',
  render: function (el) {
    var V = Views.installments, all = (Store.db.inst || []), open = Inst.open(), t0 = U.today();
    var late = open.filter(function (c) { return Inst.lateList(c).length; }), soon = open.filter(function (c) { var n = Inst.nextDue(c); return n && H.daysTo(n.due) <= U.n(homeCfg().instWarnDays); });
    var m0 = new Date(); m0.setDate(1); m0 = dayStart(m0);
    var collM = H.sum(all, function (c) { return H.sum(c.pays, function (p) { return p.t >= m0 ? p.v : 0; }); });
    var dueM = H.sum(open, function (c) { return H.sum(c.schedule, function (s) { return s.due.slice(0, 7) === t0.slice(0, 7) ? s.amount - s.paid : 0; }); });
    el.innerHTML = '<div class="grid g4" style="margin-bottom:14px"><div class="card kpi hero"><div class="l">💰 ' + L('إجمالي المتبقي على العملاء', 'Outstanding') + '</div><div class="v num">' + U.money(H.sum(open, Inst.remaining)) + '</div><div class="small">' + open.length + L(' عقد مفتوح', ' open contracts') + '</div></div>' +
      '<div class="card kpi"><div class="l">⏰ ' + L('متأخرين', 'Late') + '</div><div class="v num" style="color:var(--bad)">' + late.length + '</div><div class="muted small">' + L('متأخرات ', 'Arrears ') + U.money(H.sum(late, function (c) { return H.sum(Inst.lateList(c), function (s) { return s.amount - s.paid; }); })) + '</div></div>' +
      '<div class="card kpi"><div class="l">📅 ' + L('مستحق الشهر ده', 'Due this month') + '</div><div class="v num">' + U.money(dueM) + '</div></div><div class="card kpi"><div class="l">✅ ' + L('اتحصّل الشهر ده', 'Collected this month') + '</div><div class="v num" style="color:var(--ok)">' + U.money(collM) + '</div></div></div>' +
      '<div class="row wrap" style="margin-bottom:12px">' + H.tabs('inT', [['due', '🔔 ' + L('المستحق والمتأخر', 'Due & late') + ' (' + (late.length + soon.filter(function (c) { return late.indexOf(c) < 0; }).length) + ')'], ['open', '📂 ' + L('العقود المفتوحة', 'Open contracts')], ['all', '🗂️ ' + L('كل العقود', 'All contracts')], ['rep', '📊 ' + L('تقرير', 'Report')]], V.tab) +
      '<div class="grow"></div><input class="in" id="inQ" style="width:230px" placeholder="🔎 ' + L('اسم / موبايل / رقم عقد', 'Name / mobile / no.') + '" value="' + U.esc(V.q) + '">' + (can('inst.create') ? '<button class="btn" id="inMan">➕ ' + L('عقد بدون فاتورة', 'Manual contract') + '</button><button class="btn pri" id="inPos">🛒 ' + L('بيع تقسيط من الكاشير', 'Instalment sale (POS)') + '</button>' : '') + '</div><div id="inB"></div>';
    H.bindTabs('inT', function (t) { V.tab = t; V.render(el); });
    if ($('#inMan')) $('#inMan').onclick = Inst.manual; if ($('#inPos')) $('#inPos').onclick = function () { go('pos'); toast(L('ضيف الأصناف واضغط «🏦 تقسيط»', 'Add items then press «🏦 Instalments»'), 'ok'); };
    $('#inQ').oninput = function () { V.q = this.value; V.list(el); };
    V.list(el);
  },
  list: function (el) {
    var V = Views.installments, B = $('#inB'), all = (Store.db.inst || []), q = U.norm(V.q), qd = Phone.norm(V.q);
    if (V.tab === 'rep') return V.report(B);
    var rows = (V.tab === 'all' ? all.slice() : V.tab === 'open' ? Inst.open() : Inst.open().filter(function (c) { var n = Inst.nextDue(c); return Inst.lateList(c).length || (n && H.daysTo(n.due) <= U.n(homeCfg().instWarnDays)); }))
      .filter(function (c) { if (!q) return true; var cu = H.cust(c.customer) || {}; return String(c.no) === V.q.trim() || U.norm(cu.name).indexOf(q) >= 0 || (qd.length >= 4 && Phone.norm(cu.phone).indexOf(qd) >= 0) || c.guarantors.some(function (g) { return U.norm(g.name).indexOf(q) >= 0; }); });
    rows.sort(function (a, b) { var na = Inst.nextDue(a), nb = Inst.nextDue(b); return (na ? na.due : '9') < (nb ? nb.due : '9') ? -1 : 1; });
    if (V.tab === 'all') rows.reverse();
    B.innerHTML = rows.length ? '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('العميل', 'Customer') + '</th><th>' + L('القسط الجاي', 'Next due') + '</th><th>' + L('قيمته', 'Amount') + '</th><th>' + L('مدفوع / عدد', 'Paid / count') + '</th><th>' + L('المتبقي', 'Remaining') + '</th><th>' + L('الحالة', 'Status') + '</th><th></th></tr>' +
      rows.map(function (c) { var cu = H.cust(c.customer) || {}, n = Inst.nextDue(c), st = Inst.status(c), pc = c.schedule.filter(function (s) { return s.paid >= s.amount - 0.009; }).length; return '<tr data-c="' + c.id + '" style="cursor:pointer"><td class="num"><b>' + c.no + '</b></td><td><b>' + U.esc(cu.name || '') + '</b><div class="muted small num">' + U.esc(cu.phone || '') + '</div></td><td class="num">' + (n ? n.due + ' <span class="muted small">(' + n.n + ')</span>' : '—') + '</td><td class="num">' + (n ? U.money(n.amount - n.paid) : '—') + '</td><td class="num">' + pc + ' / ' + c.schedule.length + '</td><td class="num"><b>' + U.money(Inst.remaining(c)) + '</b></td><td>' + H.chip(st[0], st[1]) + '</td><td class="row" style="gap:4px">' + (n && c.status !== 'void' && can('inst.collect') ? '<button class="btn sm pri" data-pay="' + c.id + '">💵 ' + L('تحصيل', 'Collect') + '</button>' : '') + (n && cu.phone ? '<button class="btn sm" data-wa="' + c.id + '" title="WhatsApp">📲</button>' : '') + '</td></tr>'; }).join('') + '</table></div>'
      : '<div class="empty">' + (V.tab === 'due' ? '🎉 ' + L('مفيش أقساط مستحقة أو متأخرة دلوقتي', 'Nothing due or late right now') : L('مفيش عقود', 'No contracts')) + '</div>';
    var get = function (id) { return all.filter(function (c) { return c.id === id; })[0]; };
    $$('[data-c]', B).forEach(function (r) { r.onclick = function (e) { if (e.target.closest('button')) return; V.open(get(r.dataset.c), el); }; });
    $$('[data-pay]', B).forEach(function (b) { b.onclick = function () { Inst.collect(get(b.dataset.pay), function () { V.render(el); }); }; });
    $$('[data-wa]', B).forEach(function (b) { b.onclick = function () { var c = get(b.dataset.wa), cu = H.cust(c.customer) || {}; H.wa(cu.phone, Inst.waText(c)); c.lastRemind = Date.now(); Store.save(); }; });
  },
  open: function (c, el) {
    var cu = H.cust(c.customer) || {}, st = Inst.status(c), fee = Inst.lateFee(c);
    var m = Modal.open({ size: 'xl', title: '🏦 ' + L('عقد تقسيط رقم ', 'Contract #') + c.no + ' — ' + U.esc(cu.name || ''), body: '<div class="grid g4" style="margin-bottom:12px"><div class="card kpi hero"><div class="l">' + L('المتبقي', 'Remaining') + '</div><div class="v num">' + U.money(Inst.remaining(c)) + '</div><div class="small">' + st[0] + '</div></div><div class="card kpi"><div class="l">' + L('إجمالي المقسط', 'Financed') + '</div><div class="v num">' + U.money(c.instTotal) + '</div><div class="muted small">' + L('مقدم ', 'Down ') + U.money(c.down) + '</div></div><div class="card kpi"><div class="l">' + L('اتحصّل', 'Collected') + '</div><div class="v num" style="color:var(--ok)">' + U.money(Inst.collected(c)) + '</div></div><div class="card kpi"><div class="l">' + L('غرامة التأخير الحالية', 'Current late fee') + '</div><div class="v num">' + U.money(fee) + '</div><div class="muted small">' + Inst.lateDays(c) + L(' يوم تأخير', ' days late') + '</div></div></div>' +
      '<div class="grid" style="grid-template-columns:1.3fr 1fr;gap:16px"><div class="col"><b>📅 ' + L('جدول الأقساط', 'Schedule') + '</b><div class="tbl-wrap" style="max-height:330px"><table class="t"><tr><th>#</th><th>' + L('الاستحقاق', 'Due') + '</th><th>' + L('القيمة', 'Amount') + '</th><th>' + L('المدفوع', 'Paid') + '</th><th></th></tr>' + c.schedule.map(function (s) { var d = H.daysTo(s.due), paid = s.paid >= s.amount - 0.009; return '<tr><td class="num">' + s.n + '</td><td class="num">' + s.due + '</td><td class="num">' + U.money(s.amount) + '</td><td class="num">' + U.money(s.paid) + '</td><td>' + (paid ? H.chip('✅', 'ok') : d < 0 ? H.chip(L('متأخر ', 'late ') + (-d) + L(' يوم', 'd'), 'bad') : d <= 3 ? H.chip(d === 0 ? L('النهارده', 'today') : L('بعد ', 'in ') + d, 'warn') : '') + '</td></tr>'; }).join('') + '</table></div>' +
      '<b>🧾 ' + L('المدفوعات', 'Payments') + '</b>' + (c.pays.length ? c.pays.slice().reverse().map(function (p) { return '<div class="list-row"><div class="grow"><b class="num">' + U.money(p.v) + '</b> · ' + pmName(p.m) + (p.down ? ' · ' + L('مقدم', 'down') : '') + (p.fee ? ' · ' + L('غرامة ', 'fee ') + U.money(p.fee) : '') + (p.early ? ' · ⚡ ' + L('سداد مبكر', 'early') : '') + '<div class="muted small">' + U.dt(p.t) + ' · ' + U.esc(p.by) + '</div></div>' + (p.down ? '' : '<button class="btn sm ghost" data-rp="' + c.pays.indexOf(p) + '">🖨️</button>') + '</div>'; }).join('') : '<div class="muted small">—</div>') + '</div>' +
      '<div class="col"><div class="card" style="padding:12px;line-height:1.9">👤 <b>' + U.esc(cu.name || '') + '</b><br>📱 <span class="num">' + U.esc([cu.phone, cu.phone2].filter(Boolean).join(' / ')) + '</span>' + (cu.nid ? '<br>🪪 <span class="num">' + U.esc(cu.nid) + '</span>' : '') + (cu.address ? '<br>📍 ' + U.esc(cu.address) : '') + (cu.job ? '<br>💼 ' + U.esc(cu.job) : '') + '</div>' +
      c.guarantors.map(function (g, i) { return '<div class="card" style="padding:10px;line-height:1.8">🤝 <b>' + L('الضامن ', 'Guarantor ') + (i + 1) + ': ' + U.esc(g.name) + '</b><br><span class="num">' + U.esc(g.phone) + '</span>' + (g.nid ? ' · 🪪 ' + U.esc(g.nid) : '') + (g.address ? '<br>📍 ' + U.esc(g.address) : '') + (g.phone ? ' <button class="btn sm" data-gwa="' + i + '">📲</button>' : '') + '</div>'; }).join('') +
      '<div class="card" style="padding:10px"><div class="muted small">' + L('البضاعة', 'Goods') + '</div>' + (c.items || []).map(function (i) { return '<div class="small">• ' + U.esc(i.name) + ' × ' + U.r2(i.qty) + '</div>'; }).join('') + (c.saleNo ? '<div class="small muted">' + L('فاتورة رقم ', 'Invoice #') + c.saleNo + '</div>' : '') + (c.note ? '<div class="small">📝 ' + U.esc(c.note) + '</div>' : '') + '</div></div></div>',
      foot: (c.status === 'void' ? '' : (Inst.nextDue(c) && can('inst.collect') ? '<button class="btn pri lg" id="icPay">💵 ' + L('تحصيل قسط', 'Collect') + '</button>' : '') + (Inst.nextDue(c) && can('inst.void') ? '<button class="btn" id="icEarly">⚡ ' + L('سداد مبكر', 'Early settlement') + '</button>' : '') + (cu.phone && Inst.nextDue(c) ? '<button class="btn" id="icWa">📲 ' + L('تذكير واتساب', 'WhatsApp reminder') + '</button>' : '')) + '<button class="btn" id="icPr">📄 ' + L('طباعة العقد A4', 'Print contract') + '</button>' + (can('inst.void') && c.status !== 'void' && !c.sale ? '<button class="btn" id="icVoid" style="color:var(--bad)">⛔ ' + L('إلغاء العقد', 'Cancel contract') + '</button>' : '') });
    var re = function () { Modal.close(m); if (App.view === 'installments') Views.installments.render($('#view')); };
    if ($('#icPay', m)) $('#icPay', m).onclick = function () { Inst.collect(c, function () { re(); Views.installments.open(c, el); }); };
    if ($('#icEarly', m)) $('#icEarly', m).onclick = function () { Inst.settleEarly(c, re); };
    if ($('#icWa', m)) $('#icWa', m).onclick = function () { H.wa(cu.phone, Inst.waText(c)); c.lastRemind = Date.now(); Store.save(); };
    $('#icPr', m).onclick = function () { Inst.printContract(c); };
    if ($('#icVoid', m)) $('#icVoid', m).onclick = function () { Modal.confirm(L('إلغاء العقد؟ (المدفوع هيفضل مسجّل)', 'Cancel this contract? (payments stay recorded)'), function () { c.status = 'void'; c.voidBy = App.user.name; c.voidAt = Date.now(); Store.log('inst.void', 'I#' + c.no); Store.save(); re(); }); };
    $$('[data-rp]', m).forEach(function (b) { b.onclick = function () { Inst.printReceipt(c, c.pays[+b.dataset.rp]); }; });
    $$('[data-gwa]', m).forEach(function (b) { b.onclick = function () { var g = c.guarantors[+b.dataset.gwa]; H.wa(g.phone, H.fill(L('السلام عليكم أ/ {g}\nمعاك {shop} — بخصوص عقد تقسيط رقم {no} للعميل {name} وحضرتك ضامن فيه: يوجد مبلغ متأخر {late} {cur}. برجاء التواصل.', 'Hello {g}, {shop} here regarding contract #{no} for {name} which you guarantee: {late} {cur} is overdue.'), { g: g.name, shop: shopName(), no: c.no, name: cu.name || '', late: U.money(H.sum(Inst.lateList(c), function (s) { return s.amount - s.paid; })), cur: cur() })); }; });
  },
  report: function (B) {
    var st = Views.installments.rs || (Views.installments.rs = { range: 'month', from: U.today(), to: U.today() });
    B.innerHTML = '<div class="row wrap" style="margin-bottom:12px">' + dateRangeBar('irs', st) + '<div class="grow"></div><button class="btn" id="irP">🖨️ ' + L('طباعة A4', 'Print A4') + '</button><button class="btn" id="irX">📊 Excel</button></div><div id="irB"></div>';
    bindRange('irs', st, function () { Views.installments.report(B); });
    var r = rangeMs(st), rows = [], tot = 0, fees = 0, n = 0, created = 0, extra = 0;
    (Store.db.inst || []).forEach(function (c) { var cu = H.cust(c.customer) || {}; if (c.date >= r[0] && c.date < r[1] && c.status !== 'void') { created += c.instTotal; extra += c.extra; n++; } c.pays.forEach(function (p) { if (p.t >= r[0] && p.t < r[1]) { tot += p.v; fees += U.n(p.fee); rows.push([U.dt(p.t), c.no, cu.name || '', U.money(p.v), pmName(p.m), p.down ? L('مقدم', 'Down') : p.early ? L('سداد مبكر', 'Early') : (p.ins || []).join('، '), p.by]); } }); });
    rows.sort(function (a, b) { return a[0] < b[0] ? 1 : -1; });
    var heads = [L('الوقت', 'Time'), L('عقد', 'Contract'), L('العميل', 'Customer'), L('المبلغ', 'Amount'), L('الدفع', 'Method'), L('عن', 'For'), L('المحصّل', 'By')];
    $('#irB').innerHTML = '<div class="grid g4" style="margin-bottom:12px"><div class="card kpi hero"><div class="l">' + L('التحصيلات', 'Collections') + '</div><div class="v num">' + U.money(tot) + '</div><div class="small">' + rows.length + L(' إيصال', ' receipts') + '</div></div><div class="card kpi"><div class="l">' + L('منها غرامات', 'Late fees') + '</div><div class="v num">' + U.money(fees) + '</div></div><div class="card kpi"><div class="l">' + L('عقود جديدة', 'New contracts') + '</div><div class="v num">' + n + '</div><div class="muted small">' + U.money(created) + '</div></div>' + (can('reports.profit') ? '<div class="card kpi"><div class="l">' + L('أرباح الزيادة في العقود الجديدة', 'Mark-up on new contracts') + '</div><div class="v num" style="color:var(--ok)">' + U.money(extra) + '</div></div>' : '') + '</div>' +
      '<div class="tbl-wrap"><table class="t"><tr>' + heads.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' + rows.map(function (x) { return '<tr>' + x.map(function (c) { return '<td>' + U.esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
    $('#irP').onclick = function () { A4.print(A4.head(L('تقرير تحصيل الأقساط', 'Instalment collections'), [[L('من', 'From'), st.from], [L('إلى', 'To'), st.to], [L('الإجمالي', 'Total'), U.money(tot)], [L('عدد الإيصالات', 'Receipts'), rows.length]]) + A4.table(heads, rows.map(function (x) { return x.map(U.esc); }), 2) + A4.foot()); };
    $('#irX').onclick = function () { saveBlob(XL.writeXlsx([heads].concat(rows), 'Instalments', true), 'instalments_' + st.from + '_' + st.to + '.xlsx'); };
  }
};

/* POS: instalment, quotation buttons */
(function () {
  var render = Views.pos.render;
  Views.pos.render = function (el) {
    render.apply(this, arguments);
    var bar = $('.pos-extra'); if (!bar) return;
    var add = function (id, html, fn) { var b = document.createElement('button'); b.className = 'btn sm'; b.id = id; b.innerHTML = html; b.onclick = fn; bar.insertBefore(b, bar.firstChild); };
    if (F('quotes') && can('quotes')) add('xQuote', '📝 ' + L('عرض سعر', 'Quotation'), function () { Quote.fromCart(); });
    if (F('brides') && can('brides')) add('xBride', '💍 ' + L('لملف عروسة', 'To bridal file'), function () { Bride.fromCart(); });
    if (F('inst') && can('inst.create')) add('xInst', '🏦 ' + L('تقسيط', 'Instalments'), Inst.fromCart);
  };
  // voiding an invoice that has a contract cancels the contract too
  var ov = Sales.onVoid;
  Sales.onVoid = function (s) { if (typeof ov === 'function') ov.apply(this, arguments); (Store.db.inst || []).forEach(function (c) { if (c.sale === s.id && c.status !== 'void') { c.status = 'void'; c.voidBy = App.user.name; c.voidAt = Date.now(); Store.log('inst.void', 'I#' + c.no + ' (invoice void)'); } }); };
})();
