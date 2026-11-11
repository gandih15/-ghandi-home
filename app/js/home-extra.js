/* Ghandi Home 1.1 — promissory notes & trust receipts, appliance serial numbers, field-collector sheet,
   sales-rep commissions, ready bridal packages, supplier instalments
   Eng. Mohamed Ali — 01098811581 */
'use strict';
(function () {
  [['notes', '📜', 'الكمبيالات وإيصالات الأمانة', 'Promissory notes & trust receipts', 'home', [], []],
   ['serials', '🔢', 'أرقام السيريال للأجهزة', 'Appliance serial numbers', 'sell'],
   ['collector', '🧾', 'كشف تحصيل للمحصّل', 'Field-collector sheet', 'home'],
   ['commissions', '💼', 'عمولات البائعين', 'Sales-rep commissions', 'acc', ['commissions'], ['commissions']],
   ['packages', '📦', 'باكدجات العرائس الجاهزة', 'Ready bridal packages', 'home'],
   ['supinst', '🏭', 'أقساط الموردين', 'Supplier instalments', 'acc', ['supinst'], ['supinst']]
  ].forEach(function (f) { FEATS.push(f); (f[5] || []).forEach(function (p) { FEAT_BY_PERM[p] = f[0]; }); (f[6] || []).forEach(function (v) { FEAT_BY_VIEW[v] = f[0]; }); });
  var at = function (k) { for (var i = 0; i < PERMS.length; i++) if (PERMS[i][0] === k) return i; return PERMS.length - 1; };
  PERMS.splice(at('reports.profit') + 1, 0, ['commissions', 'عمولات البائعين', 'Sales-rep commissions'], ['supinst', 'أقساط الموردين', 'Supplier instalments']);
  var idx = function (k) { for (var i = 0; i < NAV.length; i++) if (NAV[i][0] === k) return i; return NAV.length - 1; };
  NAV.splice(idx('suppliers') + 1, 0, ['supinst', 'truck', 'أقساط الموردين', 'Supplier instalments', 'supinst']);
  NAV.splice(idx('reports') + 1, 0, ['commissions', 'chart', 'عمولات البائعين', 'Commissions', 'commissions']);
  if (typeof NAV_GEMS !== 'undefined') { NAV_GEMS.supinst = ['🏭', 'g-coral']; NAV_GEMS.commissions = ['💼', 'g-gold']; }
  var d0 = defaultDB; defaultDB = function () { var d = d0(); d.supInst = []; d.seq.supInst = 0; return d; };
  var mg = Store.migrate; Store.migrate = function (db) { db = mg.apply(this, arguments); if (!db.supInst) db.supInst = []; if (db.seq.supInst == null) db.seq.supInst = 0; return db; };
  var hc = homeCfg; homeCfg = function () { var h = hc(); if (!h.packages) h.packages = []; if (!h.comm) h.comm = {}; if (!h.reps) h.reps = []; if (!h.commBase) h.commBase = 'sales'; if (h.noteTo == null) h.noteTo = ''; return h; };
})();

/* ================= promissory notes (كمبيالات) & trust receipt (إيصال أمانة) ================= */
var Notes = {
  to: function () { var h = homeCfg(); return h.noteTo || S().ownerName || shopName(false); },
  css: function () { return A4.css() + '.note{border:2px solid #222;border-radius:6px;padding:10px 14px;margin-bottom:8mm;page-break-inside:avoid;height:82mm;box-sizing:border-box;position:relative;line-height:2}.note h2{margin:0 0 4px;text-align:center;font-size:18px;letter-spacing:1px}.note .amt{position:absolute;top:10px;left:14px;border:1.5px solid #222;padding:2px 10px;font-weight:800;font-size:15px}.note .no{position:absolute;top:10px;right:14px;font-size:12px}.note .ln{border-bottom:1px dotted #555;display:inline-block;min-width:120px;padding:0 6px;font-weight:700}.note .sg{display:flex;justify-content:space-between;margin-top:6px;gap:16px}.note .sg div{flex:1}.pb{page-break-after:always}'; },
  print: function (c, which) {
    var cu = H.cust(c.customer) || {}, g = c.guarantors || [], to = Notes.to(), place = S().shopAddress ? S().shopAddress.split(/[—-]/)[0].trim() : '';
    var rows = c.schedule.filter(function (s) { return which === 'all' || s.paid < s.amount - 0.009; });
    if (!rows.length) return toast(L('مفيش أقساط متبقية', 'No remaining instalments'), 'bad');
    var html = rows.map(function (s, i) {
      var amt = U.r2(s.amount - (which === 'all' ? 0 : s.paid));
      return '<div class="note"><span class="no">' + L('كمبيالة رقم ', 'Note #') + s.n + ' / ' + c.schedule.length + ' — ' + L('عقد ', 'contract ') + c.no + '</span><span class="amt">' + U.money(amt) + ' ' + cur() + '</span><h2>' + L('كمبيالة (سند لأمر)', 'Promissory note') + '</h2>' +
        '<div>' + L('في يوم ', 'On ') + '<span class="ln">' + s.due + '</span> ' + L('أتعهد أنا الموقع أدناه بأن أدفع بموجب هذه الكمبيالة لأمر / ', 'I promise to pay to the order of ') + '<span class="ln">' + U.esc(to) + '</span></div>' +
        '<div>' + L('مبلغاً وقدره ', 'the sum of ') + '<span class="ln">' + U.money(amt) + '</span> (' + U.esc(Tafqeet.money(amt)) + ')</div>' +
        '<div>' + L('والقيمة وصلتنا بضاعة. تحريراً في ', 'Value received in goods. Issued at ') + '<span class="ln">' + U.esc(place || '—') + '</span> ' + L('بتاريخ ', 'on ') + '<span class="ln">' + U.today(c.date) + '</span></div>' +
        '<div class="sg"><div>' + L('المدين: ', 'Debtor: ') + '<span class="ln">' + U.esc(cu.name || '') + '</span><br>' + L('رقم قومي: ', 'ID: ') + '<span class="ln">' + U.esc(cu.nid || '') + '</span><br>' + L('العنوان: ', 'Address: ') + '<span class="ln">' + U.esc(cu.address || '') + '</span><br>' + L('التوقيع: ', 'Signature: ') + '<span class="ln" style="min-width:160px"></span></div>' +
        (g[0] ? '<div>' + L('الضامن المتضامن: ', 'Guarantor: ') + '<span class="ln">' + U.esc(g[0].name) + '</span><br>' + L('رقم قومي: ', 'ID: ') + '<span class="ln">' + U.esc(g[0].nid || '') + '</span><br>' + L('العنوان: ', 'Address: ') + '<span class="ln">' + U.esc(g[0].address || '') + '</span><br>' + L('التوقيع: ', 'Signature: ') + '<span class="ln" style="min-width:160px"></span></div>' : '') + '</div></div>' + ((i + 1) % 3 === 0 && i < rows.length - 1 ? '<div class="pb"></div>' : '');
    }).join('');
    Printer.print(html, { css: Notes.css(), printer: homeCfg().a4Printer || '', silent: false, dir: lang() === 'en' ? 'ltr' : 'rtl' });
    Store.log('inst.notes', 'I#' + c.no + ' ×' + rows.length);
  },
  trust: function (c) {
    var cu = H.cust(c.customer) || {}, amt = Inst.remaining(c), g = c.guarantors || [];
    var line = function (a, b) { return '<div style="margin:6px 0">' + a + ' <b style="border-bottom:1px dotted #555;padding:0 8px">' + b + '</b></div>'; };
    Printer.print('<div style="border:2px solid #222;border-radius:8px;padding:16mm 14mm;line-height:2.2;font-size:15px"><h1 style="text-align:center;margin:0 0 10px;font-size:26px">' + L('إيصال أمانة', 'Trust receipt') + '</h1>' +
      line(L('استلمت أنا / ', 'I, '), U.esc(cu.name || '')) + line(L('رقم قومي / ', 'National ID: '), U.esc(cu.nid || '..........................')) + line(L('المقيم في / ', 'Residing at: '), U.esc(cu.address || '..........................')) +
      line(L('من السيد / ', 'Received from: '), U.esc(Notes.to())) + line(L('مبلغاً وقدره / ', 'The sum of: '), U.money(amt) + ' ' + cur() + ' (' + U.esc(Tafqeet.money(amt)) + ')') +
      '<div>' + L('وذلك على سبيل الأمانة لتوصيله إلى صاحبه، وأتعهد بردّه عند أول طلب، وإذا تأخرت أو امتنعت أكون مبدداً وخائناً للأمانة وأخضع للمساءلة القانونية.', 'held in trust, to be returned on first demand.') + '</div>' +
      line(L('تحريراً في / ', 'Dated: '), U.today()) +
      '<div style="display:flex;justify-content:space-between;margin-top:22px;gap:30px"><div style="flex:1">' + L('المستلم (المؤتمن)', 'Recipient') + '<br>' + L('الاسم: ', 'Name: ') + U.esc(cu.name || '') + '<br>' + L('التوقيع والبصمة: ', 'Signature & thumbprint: ') + '<br><br>..............................</div>' + (g[0] ? '<div style="flex:1">' + L('الضامن', 'Guarantor') + '<br>' + L('الاسم: ', 'Name: ') + U.esc(g[0].name) + '<br>' + L('التوقيع: ', 'Signature: ') + '<br><br>..............................</div>' : '') + '<div style="flex:1">' + L('الشاهد', 'Witness') + '<br>' + L('الاسم: ', 'Name: ') + '..............<br>' + L('التوقيع: ', 'Signature: ') + '<br><br>..............................</div></div></div>',
      { css: '@page{size:A4;margin:14mm}body{font-family:Tahoma,Arial;color:#111}', printer: homeCfg().a4Printer || '', silent: false, dir: lang() === 'en' ? 'ltr' : 'rtl' });
    Store.log('inst.trust', 'I#' + c.no);
  },
  menu: function (c) {
    var m = Modal.open({ title: '📜 ' + L('مستندات الضمان — عقد ', 'Security documents — contract #') + c.no, body: '<div class="col"><button class="btn lg" id="nRem">📜 ' + L('كمبيالات بالأقساط المتبقية', 'Notes for remaining instalments') + ' (' + c.schedule.filter(function (s) { return s.paid < s.amount - 0.009; }).length + ')</button><button class="btn lg" id="nAll">📜 ' + L('كمبيالات بكل الأقساط', 'Notes for all instalments') + ' (' + c.schedule.length + ')</button><button class="btn lg" id="nTr">🤝 ' + L('إيصال أمانة بالمبلغ المتبقي', 'Trust receipt for the remaining amount') + ' (' + U.money(Inst.remaining(c)) + ')</button><label class="f">' + L('اسم الدائن (لأمر مين بتتكتب)', 'Payee (to the order of)') + '<input class="in" id="nTo" value="' + U.esc(Notes.to()) + '"></label><div class="muted small">' + L('3 كمبيالات في كل ورقة A4 — اطبعها على ورق عادي أو على نماذج الكمبيالات.', '3 notes per A4 page.') + '</div></div>' });
    var save = function () { var v = $('#nTo', m).value.trim(); if (v && v !== homeCfg().noteTo) { homeCfg().noteTo = v; Store.save(); } };
    $('#nRem', m).onclick = function () { save(); Notes.print(c, 'rem'); };
    $('#nAll', m).onclick = function () { save(); Notes.print(c, 'all'); };
    $('#nTr', m).onclick = function () { save(); Notes.trust(c); };
  }
};
(function () {
  var op = Views.installments.open;
  Views.installments.open = function (c) {
    var r = op.apply(this, arguments); if (!F('notes')) return r;
    var m = $$('.mask').pop(), f = m && $('.mf', m); if (!f || c.status === 'void') return r;
    var b = document.createElement('button'); b.className = 'btn'; b.innerHTML = '📜 ' + L('كمبيالات / إيصال أمانة', 'Notes / trust receipt'); b.onclick = function () { Notes.menu(c); }; f.appendChild(b);
    return r;
  };
})();

/* ================= serial numbers ================= */
var Serial = {
  ask: function (p, it, n) {
    if (!F('serials') || !p || !p.serial || !it) return;
    var need = Math.max(1, Math.round(n || 1));
    var m = Modal.open({ title: '🔢 ' + L('رقم السيريال — ', 'Serial number — ') + U.esc(pname(p)), body: '<div class="col">' + Array.apply(null, Array(need)).map(function (x, i) { return '<input class="in num" data-sn ' + (i ? '' : 'autofocus ') + 'placeholder="' + L('امسح أو اكتب السيريال', 'Scan or type the serial') + (need > 1 ? ' ' + (i + 1) : '') + '" style="font-size:18px;direction:ltr">'; }).join('') + '<div class="muted small">' + L('بيتطبع في الفاتورة وشهادة الضمان، وتقدر تبحث بيه في صفحة الضمان.', 'Printed on the invoice and warranty; searchable in Warranty.') + '</div></div>', foot: '<button class="btn" data-n>' + L('تخطّي', 'Skip') + '</button><button class="btn pri" id="snGo">✅ ' + L('حفظ', 'Save') + '</button>' });
    var ins = $$('[data-sn]', m);
    ins.forEach(function (i, k) { i.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); if (ins[k + 1]) ins[k + 1].focus(); else $('#snGo', m).click(); } }; });
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#snGo', m).onclick = function () { var v = ins.map(function (i) { return i.value.trim(); }).filter(Boolean); if (v.length) { it.serials = (it.serials || []).concat(v); it.serial = it.serials.join('، '); Views.pos.draw(); } Modal.close(m); };
  }
};
(function () {
  var add0 = Views.pos.add;
  Views.pos.add = function (p, qty) {
    var c = App.cart, before = c ? c.items.reduce(function (a, x) { return a + (x.pid === (p && p.id) ? x.qty : 0); }, 0) : 0;
    var r = add0.apply(this, arguments);
    try { if (p && p.serial && F('serials') && !Meas.isMeas(p)) { var it = c.items.filter(function (x) { return x.pid === p.id; }).pop(), after = c.items.reduce(function (a, x) { return a + (x.pid === p.id ? x.qty : 0); }, 0); if (after > before) setTimeout(function () { Serial.ask(p, it, after - before); }, 60); } } catch (e) { }
    return r;
  };
  var dr = Views.pos.draw;
  Views.pos.draw = function () { dr.apply(this, arguments); try { $$('#items .ci').forEach(function (r) { var it = App.cart.items[+r.dataset.i]; if (it && it.serial) { var nm = $('.nm', r); if (nm && !$('.sn', nm)) nm.insertAdjacentHTML('beforeend', ' <span class="chip sn" style="direction:ltr">S/N ' + U.esc(it.serial) + '</span>'); } }); } catch (e) { } };
  // keep serials and the sales rep on the saved invoice
  var cr = Sales.create;
  Sales.create = function (o) {
    var s = cr.apply(this, arguments);
    try { (o.items || []).forEach(function (i, k) { if (i.serial && s.items[k]) s.items[k].serial = i.serial; }); var c = App.cart; if (c && o.items === c.items && c.rep) s.rep = c.rep; if (!s.rep && o.rep) s.rep = o.rep; if (Comm.locked()) s.rep = 'u:' + App.user.id; Store.save(); } catch (e) { }
    return s;
  };
  // warranty search by serial too + show serial
  var wr = Views.warranty.render;
  Views.warranty.render = function (el) {
    wr.apply(this, arguments);
    var q = $('#wQ'); if (q) q.placeholder = L('رقم الفاتورة أو السيريال أو موبايل العميل أو اسمه', 'Invoice no., serial, customer mobile or name');
    var go2 = function () {
      var v = String(q.value || '').trim().toUpperCase(); if (v.length < 3) return;
      var hits = []; Store.db.sales.forEach(function (s) { if (s.void || s.type !== 'sale') return; s.items.forEach(function (i) { if (i.serial && String(i.serial).toUpperCase().indexOf(v) >= 0) hits.push({ s: s, i: i }); }); });
      if (!hits.length) return;
      var box = document.createElement('div'); box.className = 'card'; box.style.cssText = 'padding:12px;margin-bottom:12px';
      box.innerHTML = '<b>🔢 ' + L('نتايج السيريال', 'Serial matches') + '</b>' + hits.map(function (h) { var p = h.i.pid && Store.product(h.i.pid), w = p ? U.n(p.warranty) : 0, end = new Date(h.s.date); end.setMonth(end.getMonth() + w); var ok = w && end.getTime() > Date.now(); return '<div class="list-row"><div class="grow"><b>' + U.esc(h.i.name) + '</b> · <span class="num" dir="ltr">S/N ' + U.esc(h.i.serial) + '</span><div class="muted small">' + L('فاتورة #', 'Invoice #') + h.s.no + ' · ' + U.today(h.s.date) + ' · ' + U.esc(H.custName(h.s.customer)) + '</div></div>' + (w ? H.chip(ok ? '✅ ' + L('ضمان لحد ', 'Warranty until ') + U.today(end) : '⛔ ' + L('الضمان انتهى ', 'Expired ') + U.today(end), ok ? 'ok' : 'bad') : H.chip(L('بدون ضمان', 'No warranty'))) + '</div>'; }).join('');
      var b = $('#wB'); b.insertBefore(box, b.firstChild);
    };
    var g = $('#wGo'); if (g) { var o = g.onclick; g.onclick = function () { o && o(); go2(); }; q.onkeydown = function (e) { if (e.key === 'Enter') g.onclick(); }; if (q.value) go2(); }
  };
})();

/* ================= field-collector sheet (كشف تحصيل) ================= */
var Collector = {
  open: function () {
    var h = homeCfg();
    var m = Modal.open({ title: '🧾 ' + L('كشف تحصيل للمحصّل', 'Field-collector sheet'), body: '<div class="col"><div class="grid g2"><label class="f">' + L('يشمل', 'Include') + '<select class="in" id="kcW"><option value="late">' + L('المتأخرين بس', 'Late only') + '</option><option value="7" selected>' + L('المتأخرين + المستحق خلال أسبوع', 'Late + due within a week') + '</option><option value="30">' + L('المتأخرين + المستحق خلال شهر', 'Late + due within a month') + '</option></select></label><label class="f">' + L('المنطقة (جزء من العنوان — اختياري)', 'Area (part of address — optional)') + '<input class="in" id="kcA"></label><label class="f">' + L('اسم المحصّل', 'Collector') + '<input class="in" id="kcN" list="kcL" value="' + U.esc(h.staff[0] || '') + '"><datalist id="kcL">' + h.staff.map(function (x) { return '<option value="' + U.esc(x) + '">'; }).join('') + '</datalist></label><label class="f">' + L('الترتيب', 'Sort') + '<select class="in" id="kcS"><option value="addr">' + L('بالعنوان (خط سير)', 'By address (route)') + '</option><option value="late">' + L('الأكثر تأخيراً', 'Most overdue') + '</option></select></label></div><div id="kcP" class="muted small"></div></div>', foot: '<button class="btn pri lg" id="kcGo">🖨️ ' + L('طباعة الكشف A4', 'Print A4') + '</button>' });
    var rows = function () {
      var w = $('#kcW', m).value, area = U.norm($('#kcA', m).value), out = [];
      Inst.open().forEach(function (c) {
        var cu = H.cust(c.customer) || {}; if (area && U.norm(cu.address).indexOf(area) < 0) return;
        var late = Inst.lateList(c), due = U.r2(H.sum(c.schedule, function (s) { var d = H.daysTo(s.due); return s.paid < s.amount - 0.009 && (d < 0 || (w !== 'late' && d <= +w)) ? s.amount - s.paid : 0; }));
        if (!due && !late.length) return;
        var n = Inst.nextDue(c); out.push({ c: c, cu: cu, due: due, fee: Inst.lateFee(c), days: Inst.lateDays(c), n: n });
      });
      if ($('#kcS', m).value === 'late') out.sort(function (a, b) { return b.days - a.days; }); else out.sort(function (a, b) { return String(a.cu.address || '').localeCompare(String(b.cu.address || ''), 'ar'); });
      return out;
    };
    var prev = function () { var r = rows(); $('#kcP', m).innerHTML = r.length + L(' عميل · مطلوب ', ' customers · due ') + U.money(H.sum(r, function (x) { return x.due + x.fee; })); };
    $$('select,input', m).forEach(function (i) { i.oninput = prev; i.onchange = prev; }); prev();
    $('#kcGo', m).onclick = function () {
      var r = rows(); if (!r.length) return toast(L('مفيش حد مطلوب منه حاجة', 'Nobody to collect from'), 'bad');
      var tot = H.sum(r, function (x) { return x.due + x.fee; });
      A4.print(A4.head(L('كشف تحصيل أقساط', 'Collection sheet'), [[L('المحصّل', 'Collector'), U.esc($('#kcN', m).value || '—')], [L('التاريخ', 'Date'), U.today()], [L('عدد العملاء', 'Customers'), r.length], [L('إجمالي المطلوب', 'Total due'), '<b>' + U.money(tot) + '</b>']]) +
        A4.table([L('م', '#'), L('العميل', 'Customer'), L('الموبايل', 'Mobile'), L('العنوان', 'Address'), L('عقد', 'Contract'), L('تأخير', 'Late'), L('المطلوب', 'Due'), L('اللي اتحصّل', 'Collected'), L('توقيع العميل', 'Signature')], r.map(function (x, i) { return [i + 1, '<b>' + U.esc(x.cu.name || '') + '</b>' + (x.c.guarantors[0] ? '<br><small>' + L('ضامن: ', 'Guar.: ') + U.esc(x.c.guarantors[0].name) + ' ' + U.esc(x.c.guarantors[0].phone) + '</small>' : ''), '<span dir="ltr">' + U.esc([x.cu.phone, x.cu.phone2].filter(Boolean).join('<br>')) + '</span>', U.esc(x.cu.address || '—'), x.c.no, x.days ? x.days + L(' يوم', ' d') : '—', '<b>' + U.money(x.due + x.fee) + '</b>' + (x.fee ? '<br><small>' + L('منها غرامة ', 'incl. fee ') + U.money(x.fee) + '</small>' : ''), '', '']; }), 1) +
        '<div class="meta" style="grid-template-columns:1fr 1fr 1fr"><div><b>' + L('إجمالي المطلوب', 'Total due') + ':</b>' + U.money(tot) + '</div><div><b>' + L('إجمالي المحصّل', 'Total collected') + ':</b> ..............</div><div><b>' + L('سُلِّم للخزنة', 'Handed in') + ':</b> ..............</div></div>' +
        A4.sign([L('توقيع المحصّل', 'Collector'), L('مسئول الخزنة', 'Cashier'), L('المدير', 'Manager')]) + A4.foot());
      Store.log('inst.collector', r.length + ' · ' + tot); Modal.close(m);
    };
  }
};
(function () {
  var rn = Views.installments.render;
  Views.installments.render = function (el) {
    rn.apply(this, arguments); if (!F('collector')) return;
    var inp = $('#inQ'); if (!inp) return;
    var b = document.createElement('button'); b.className = 'btn'; b.innerHTML = '🧾 ' + L('كشف تحصيل للمحصّل', 'Collector sheet'); b.onclick = Collector.open; inp.parentNode.insertBefore(b, inp.nextSibling);
  };
})();

/* ================= sales-rep commissions ================= */
var Comm = {
  reps: function () { var h = homeCfg(), out = Store.db.users.filter(function (u) { return u.active !== false; }).map(function (u) { return { k: 'u:' + u.id, name: u.name, login: true }; }); h.reps.forEach(function (n) { out.push({ k: 'r:' + n, name: n }); }); return out; },
  // 'free' = anyone can be picked · 'staff' = staff locked to themselves (admin can pick) · 'all' = locked for everyone
  mode: function () { return devS().repMode || homeCfg().repMode || 'free'; },
  locked: function () { var m = Comm.mode(); return m === 'all' || (m === 'staff' && !can('settings')); },
  keyOf: function (s) { return s.rep || ('u:' + s.user); },
  name: function (k) { var r = Comm.reps().filter(function (x) { return x.k === k; })[0]; if (r) return r.name; if (/^u:/.test(k)) { var u = Store.db.users.filter(function (x) { return 'u:' + x.id === k; })[0]; return u ? u.name : k.slice(2); } return k.slice(2); },
  rate: function (k) { return U.n(homeCfg().comm[k]); }
};
(function () {
  // POS: pick the sales rep for this invoice (defaults to the logged-in user)
  var render = Views.pos.render;
  Views.pos.render = function (el) {
    render.apply(this, arguments); if (!F('commissions')) return;
    var bar = $('.pos-extra'); if (!bar) return;
    var reps = Comm.reps(); if (reps.length < 2) return;
    var s = document.createElement('select'); s.className = 'in'; s.id = 'xRep'; s.style.cssText = 'width:auto;padding:4px 8px;font-size:13px'; s.title = L('البائع', 'Sales rep');
    if (Comm.locked()) { App.cart.rep = 'u:' + App.user.id; s.innerHTML = '<option>👤 ' + U.esc(App.user.name) + ' 🔒</option>'; s.disabled = true; s.title = L('البائع إجباري = اللي عامل دخول', 'Sales rep is locked to the logged-in user'); s.style.opacity = '.85'; bar.appendChild(s); return; }
    var cur0 = App.cart.rep || ('u:' + App.user.id);
    s.innerHTML = reps.map(function (r) { return '<option value="' + U.esc(r.k) + '"' + (r.k === cur0 ? ' selected' : '') + '>👤 ' + U.esc(r.name) + '</option>'; }).join('');
    s.onchange = function () { App.cart.rep = s.value; }; bar.appendChild(s);
  };
})();
Views.commissions = {
  st: { range: 'month', from: U.today(), to: U.today() },
  render: function (el) {
    var V = Views.commissions, st = V.st, h = homeCfg(), r = rangeMs(st), prof = can('reports.profit');
    var map = {};
    Store.db.sales.forEach(function (s) {
      if (s.void || s.date < r[0] || s.date >= r[1]) return; var k = Comm.keyOf(s), o = map[k] || (map[k] = { k: k, sales: 0, ret: 0, profit: 0, n: 0 }), sg = s.type === 'return' ? -1 : 1;
      if (s.type === 'return') o.ret += s.total; else { o.sales += s.total; o.n++; }
      o.profit += sg * (s.items.reduce(function (a, i) { return a + i.qty * (i.price - U.n(i.cost)); }, 0) - U.n(s.discount));
    });
    Comm.reps().forEach(function (x) { if (!map[x.k]) map[x.k] = { k: x.k, sales: 0, ret: 0, profit: 0, n: 0 }; });
    var rows = Object.keys(map).map(function (k) { var o = map[k]; o.net = U.r2(o.sales - o.ret); o.base = h.commBase === 'profit' ? Math.max(0, o.profit) : o.net; o.rate = Comm.rate(k); o.comm = U.r2(Math.max(0, o.base) * o.rate / 100); return o; }).sort(function (a, b) { return b.net - a.net; });
    var tot = H.sum(rows, function (x) { return x.comm; });
    el.innerHTML = '<div class="row wrap" style="margin-bottom:12px">' + dateRangeBar('cms', st) + '<div class="grow"></div><button class="btn" id="cmP">🖨️ ' + L('طباعة A4', 'Print A4') + '</button></div>' +
      '<div class="grid g3" style="margin-bottom:12px"><div class="card kpi hero"><div class="l">' + L('إجمالي العمولات', 'Total commissions') + '</div><div class="v num">' + U.money(tot) + '</div><div class="small">' + (h.commBase === 'profit' ? L('محسوبة على الربح', 'on profit') : L('محسوبة على صافي المبيعات', 'on net sales')) + '</div></div>' +
      (can('settings') ? '<div class="card col" style="grid-column:span 2"><b>⚙️ ' + L('إعدادات العمولة', 'Commission settings') + '</b><div class="row wrap"><label class="row small"><input type="radio" name="cmB" value="sales"' + (h.commBase !== 'profit' ? ' checked' : '') + '> ' + L('نسبة من صافي المبيعات', '% of net sales') + '</label>' + (prof ? '<label class="row small"><input type="radio" name="cmB" value="profit"' + (h.commBase === 'profit' ? ' checked' : '') + '> ' + L('نسبة من الربح', '% of profit') + '</label>' : '') + '</div><label class="f">' + L('مين البائع على الفاتورة؟', 'Who is the sales rep?') + '<select class="in" id="cmM"' + (devS().repMode ? ' disabled title="' + L('مقفول من المطوّر', 'Set by developer') + '"' : '') + '>' + [['free', 'الكاشير يختار البائع من القائمة'], ['staff', 'إجباري: البائع = الموظف اللي عامل دخول (المدير بس يقدر يغيّر)'], ['all', 'إجباري على الكل: البائع = اللي عامل دخول']].map(function (o) { return '<option value="' + o[0] + '"' + (Comm.mode() === o[0] ? ' selected' : '') + '>' + o[1] + (devS().repMode === o[0] ? ' 🔒' : '') + '</option>'; }).join('') + '</select></label><div class="row"><input class="in grow" id="cmR" placeholder="' + L('ضيف بائع من غير حساب دخول (اسمه)', 'Add a rep without a login (name)') + '"><button class="btn" id="cmRa">➕</button></div><div class="muted small">' + L('البائع بيتحدد في الكاشير من القائمة «👤» — ولو متحددش بيتحسب للي عامل الدخول.', 'Pick the rep at the POS (👤); otherwise the logged-in user gets it.') + '</div></div>' : '') + '</div>' +
      '<div class="tbl-wrap"><table class="t"><tr><th>' + L('البائع', 'Rep') + '</th><th>' + L('فواتير', 'Invoices') + '</th><th>' + L('المبيعات', 'Sales') + '</th><th>' + L('المرتجعات', 'Returns') + '</th><th>' + L('الصافي', 'Net') + '</th>' + (prof ? '<th>' + L('الربح', 'Profit') + '</th>' : '') + '<th>' + L('النسبة %', 'Rate %') + '</th><th>' + L('العمولة', 'Commission') + '</th></tr>' +
      rows.map(function (o) { return '<tr><td><b>' + U.esc(Comm.name(o.k)) + '</b>' + (/^r:/.test(o.k) && can('settings') ? ' <button class="btn sm ghost" data-rd="' + U.esc(o.k) + '">✕</button>' : '') + '</td><td class="num">' + o.n + '</td><td class="num">' + U.money(o.sales) + '</td><td class="num">' + U.money(o.ret) + '</td><td class="num"><b>' + U.money(o.net) + '</b></td>' + (prof ? '<td class="num">' + U.money(o.profit) + '</td>' : '') + '<td>' + (can('settings') ? '<input class="in num" style="width:80px" type="number" step="0.1" data-rt="' + U.esc(o.k) + '" value="' + (o.rate || '') + '">' : o.rate) + '</td><td class="num"><b style="color:var(--ok)">' + U.money(o.comm) + '</b></td></tr>'; }).join('') + '</table></div>';
    bindRange('cms', st, function () { V.render(el); });
    $$('[data-rt]').forEach(function (i) { i.onchange = function () { h.comm[i.dataset.rt] = U.n(i.value); Store.log('commission.rate', i.dataset.rt + '=' + i.value); Store.save(); V.render(el); }; });
    $$('[name="cmB"]').forEach(function (i) { i.onchange = function () { h.commBase = i.value; Store.save(); V.render(el); }; });
    if ($('#cmM')) $('#cmM').onchange = function () { h.repMode = this.value; Store.log('comm.repMode', this.value); Store.save(); toast(L('اتحفظ', 'Saved'), 'ok'); };
    if ($('#cmRa')) $('#cmRa').onclick = function () { var n = $('#cmR').value.trim(); if (!n || h.reps.indexOf(n) >= 0) return; h.reps.push(n); Store.save(); V.render(el); };
    $$('[data-rd]').forEach(function (b) { b.onclick = function () { h.reps = h.reps.filter(function (x) { return 'r:' + x !== b.dataset.rd; }); Store.save(); V.render(el); }; });
    $('#cmP').onclick = function () { A4.print(A4.head(L('كشف عمولات البائعين', 'Sales-rep commissions'), [[L('من', 'From'), st.from], [L('إلى', 'To'), st.to], [L('الأساس', 'Base'), h.commBase === 'profit' ? L('الربح', 'Profit') : L('صافي المبيعات', 'Net sales')], [L('الإجمالي', 'Total'), '<b>' + U.money(tot) + '</b>']]) + A4.table([L('البائع', 'Rep'), L('فواتير', 'Invoices'), L('الصافي', 'Net'), L('النسبة', 'Rate'), L('العمولة', 'Commission'), L('توقيع الاستلام', 'Signature')], rows.filter(function (o) { return o.n || o.comm; }).map(function (o) { return [U.esc(Comm.name(o.k)), o.n, U.money(o.net), o.rate + '%', '<b>' + U.money(o.comm) + '</b>', '']; }), 0) + A4.foot()); };
  }
};

/* ================= ready bridal packages ================= */
var Pkg = {
  sum: function (k) { return U.r2(H.sum(k.items, function (i) { return i.qty * i.price; })); },
  manage: function (box) {
    var h = homeCfg();
    box.innerHTML = '<div class="row" style="margin-bottom:10px"><div class="muted grow">' + L('اعمل باكدجات جاهزة (باكدج المطبخ، الأجهزة، المفروشات…) بسعر واحد، وتضيفها لملف أي عروسة بضغطة.', 'Ready packages with one price, added to any bridal file in one click.') + '</div><button class="btn pri" id="pkN">➕ ' + L('باكدج جديد', 'New package') + '</button></div>' +
      (h.packages.length ? '<div class="grid g3">' + h.packages.map(function (k, i) { var s = Pkg.sum(k); return '<div class="card col" style="gap:6px"><div class="row"><span style="font-size:24px">📦</span><b class="grow" style="font-size:16px">' + U.esc(k.name) + '</b><button class="btn sm" data-pe="' + i + '">✏️</button><button class="btn sm ghost" data-pd="' + i + '" style="color:var(--bad)">✕</button></div><div class="small">' + k.items.map(function (x) { return '• ' + U.esc(x.name) + (x.qty !== 1 ? ' × ' + x.qty : ''); }).join('<br>') + '</div><div class="row" style="justify-content:space-between"><span class="muted small">' + L('الأصناف ', 'Items ') + '<s>' + U.money(s) + '</s></span><b class="num" style="font-size:18px;color:var(--ok)">' + U.money(k.price || s) + '</b></div>' + (k.price && k.price < s ? H.chip(L('توفير ', 'Save ') + U.money(s - k.price), 'ok') : '') + '</div>'; }).join('') + '</div>' : '<div class="empty">' + L('لسه مفيش باكدجات', 'No packages yet') + '</div>');
    $('#pkN', box).onclick = function () { Pkg.edit(null, function () { Pkg.manage(box); }); };
    $$('[data-pe]', box).forEach(function (b) { b.onclick = function () { Pkg.edit(h.packages[+b.dataset.pe], function () { Pkg.manage(box); }); }; });
    $$('[data-pd]', box).forEach(function (b) { b.onclick = function () { Modal.confirm(L('حذف الباكدج؟', 'Delete package?'), function () { h.packages.splice(+b.dataset.pd, 1); Store.save(); Pkg.manage(box); }); }; });
  },
  edit: function (k, after) {
    var isNew = !k, h = homeCfg(); k = k ? U.clone(k) : { id: U.id(), name: '', price: 0, items: [] };
    var m = Modal.open({ size: 'wide', title: '📦 ' + (isNew ? L('باكدج جديد', 'New package') : U.esc(k.name)), body: '<div class="col"><div class="grid g2"><label class="f">' + L('اسم الباكدج', 'Name') + '<input class="in" id="kN" value="' + U.esc(k.name) + '" placeholder="' + L('مثلاً: باكدج المطبخ الكامل', 'e.g. Full kitchen') + '"></label><label class="f">' + L('سعر الباكدج (فاضي = مجموع الأصناف)', 'Package price (empty = items sum)') + '<input class="in num" type="number" id="kP" value="' + (k.price || '') + '"></label></div><div class="row"><input class="in grow" id="kA" placeholder="➕ ' + L('ضيف صنف من المعرض', 'Add a product') + '"><button class="btn" id="kM">✍️ ' + L('بند يدوي', 'Manual') + '</button></div><div id="kL"></div></div>', foot: '<button class="btn pri" id="kGo">💾 ' + L('حفظ', 'Save') + '</button>' });
    var draw = function () { $('#kL', m).innerHTML = k.items.length ? '<table class="t"><tr><th>' + L('الصنف', 'Item') + '</th><th>' + L('الكمية', 'Qty') + '</th><th>' + L('السعر', 'Price') + '</th><th></th></tr>' + k.items.map(function (x, i) { return '<tr><td>' + U.esc(x.name) + '</td><td><input class="in num" style="width:70px" type="number" data-q="' + i + '" value="' + x.qty + '"></td><td><input class="in num" style="width:110px" type="number" data-p="' + i + '" value="' + x.price + '"></td><td><button class="btn sm ghost" data-d="' + i + '">✕</button></td></tr>'; }).join('') + '<tr><td colspan="2"><b>' + L('المجموع', 'Sum') + '</b></td><td class="num"><b>' + U.money(Pkg.sum(k)) + '</b></td><td></td></tr></table>' : '<div class="empty" style="padding:16px">—</div>';
      $$('[data-q]', m).forEach(function (i) { i.onchange = function () { k.items[+i.dataset.q].qty = U.n(i.value) || 1; setTimeout(draw); }; }); $$('[data-p]', m).forEach(function (i) { i.onchange = function () { k.items[+i.dataset.p].price = U.n(i.value); setTimeout(draw); }; }); $$('[data-d]', m).forEach(function (b) { b.onclick = function () { k.items.splice(+b.dataset.d, 1); draw(); }; }); };
    H.prodPick($('#kA', m), function (p) { k.items.push({ pid: p.id, name: pname(p) + (p.shade ? ' ' + p.shade : ''), qty: 1, price: (Views.pos.price || Promo.price)(p, 0).price, cat: p.cat || '' }); draw(); });
    $('#kM', m).onclick = function () { Modal.prompt(L('بند يدوي', 'Manual line'), L('البيان', 'Item'), '', function (v) { if (v) { k.items.push({ pid: null, name: v, qty: 1, price: 0 }); draw(); } }); };
    $('#kGo', m).onclick = function () { k.name = $('#kN', m).value.trim(); if (!k.name) return toast(L('اكتب اسم الباكدج', 'Name it'), 'bad'); if (!k.items.length) return toast(L('ضيف أصناف', 'Add items'), 'bad'); k.price = U.n($('#kP', m).value); var i = h.packages.map(function (x) { return x.id; }).indexOf(k.id); if (i >= 0) h.packages[i] = k; else h.packages.push(k); Store.log('package', k.name); Store.save(); Modal.close(m); if (after) after(); };
    draw();
  },
  pick: function (b, after) {
    var h = homeCfg(); if (!h.packages.length) return toast(L('اعمل باكدجات الأول من تبويب «📦 الباكدجات الجاهزة»', 'Create packages first'), 'bad');
    var m = Modal.open({ title: '📦 ' + L('إضافة باكدج للعروسة', 'Add a package'), body: '<div class="col">' + h.packages.map(function (k, i) { var s = Pkg.sum(k); return '<button class="btn lg" data-k="' + i + '" style="justify-content:space-between"><span>📦 ' + U.esc(k.name) + ' <small class="muted">(' + k.items.length + ')</small></span><b class="num">' + U.money(k.price || s) + '</b></button>'; }).join('') + '</div>' });
    $$('[data-k]', m).forEach(function (bt) { bt.onclick = function () {
      var k = h.packages[+bt.dataset.k], s = Pkg.sum(k), f = k.price && s ? k.price / s : 1, added = 0;
      k.items.forEach(function (x) { var p = x.pid && Store.product(x.pid); b.items.push({ id: U.id(), pid: p ? p.id : null, name: x.name, qty: x.qty, price: U.r2(x.price * f), cost: p ? U.n(p.cost) : 0, cat: '📦 ' + k.name, status: 'planned', pkg: k.id }); added += U.r2(x.price * f) * x.qty; });
      var diff = U.r2((k.price || s) - added), mine = b.items.filter(function (i) { return i.pkg === k.id; }), one = mine.filter(function (i) { return i.qty === 1; }).pop() || mine.pop(); if (diff && one) one.price = U.r2(one.price + diff / one.qty);
      Store.log('bride.package', 'B#' + b.no + ' ' + k.name); Store.save(); Modal.close(m); toast('📦 ' + L('اتضاف ', 'Added ') + k.name, 'ok'); if (after) after();
    }; });
  }
};

/* ================= supplier instalments ================= */
var SupInst = {
  rem: function (x) { return U.r2(H.sum(x.schedule, function (s) { return s.amount - s.paid; })); },
  next: function (x) { return x.schedule.filter(function (s) { return s.paid < s.amount - 0.009; })[0] || null; },
  sup: function (id) { return Store.db.suppliers.filter(function (s) { return s.id === id; })[0] || null; },
  edit: function (after) {
    var sups = Store.db.suppliers; if (!sups.length) return toast(L('ضيف المورد الأول من صفحة الموردين', 'Add the supplier first'), 'bad');
    var m = Modal.open({ title: '🏭 ' + L('جدول أقساط لمورد', 'Supplier instalment plan'), body: '<div class="col"><label class="f">' + L('المورد', 'Supplier') + '<select class="in" id="ysS">' + sups.map(function (s) { return '<option value="' + s.id + '">' + U.esc(s.name) + (U.n(s.balance) ? ' — ' + L('له ', 'owed ') + U.money(s.balance) : '') + '</option>'; }).join('') + '</select></label><div class="grid g3"><label class="f">' + L('المبلغ', 'Amount') + '<input class="in num" type="number" id="ysT"></label><label class="f">' + L('عدد الدفعات', 'Payments') + '<input class="in num" type="number" id="ysN" value="3"></label><label class="f">' + L('كل كام يوم', 'Every (days)') + '<input class="in num" type="number" id="ysE" value="30"></label></div><div class="grid g2"><label class="f">' + L('أول دفعة يوم', 'First payment') + '<input class="in" type="date" id="ysD" value="' + U.today(Date.now() + 30 * 864e5) + '"></label><label class="f">' + L('البيان / رقم الفاتورة', 'Reference') + '<input class="in" id="ysR"></label></div><label class="row small"><input type="checkbox" class="sw" id="ysB"> ' + L('ضيف المبلغ على رصيد المورد (لو مش متسجل من استلام البضاعة)', 'Add to the supplier balance (if not already recorded)') + '</label><div id="ysP" class="muted small"></div></div>', foot: '<button class="btn pri" id="ysGo">💾 ' + L('حفظ', 'Save') + '</button>' });
    var sched = function () { var t = U.n($('#ysT', m).value), n = Math.max(1, Math.round(U.n($('#ysN', m).value))), e = Math.max(1, U.n($('#ysE', m).value) || 30), d0 = new Date(($('#ysD', m).value || U.today()) + 'T00:00:00').getTime(), per = U.r2(Math.floor(t / n * 100) / 100), out = []; for (var i = 0; i < n; i++) out.push({ n: i + 1, due: e === 30 ? H.addMonths(U.today(d0), i) : U.today(d0 + i * e * 864e5), amount: i === n - 1 ? U.r2(t - per * (n - 1)) : per, paid: 0 }); return out; };
    var pv = function () { var s = sched(); $('#ysP', m).innerHTML = s.map(function (x) { return x.due + ': <b>' + U.money(x.amount) + '</b>'; }).join(' · '); };
    $$('input', m).forEach(function (i) { i.oninput = pv; }); $('#ysS', m).onchange = function () { var s = SupInst.sup(this.value); if (s && U.n(s.balance) > 0 && !$('#ysT', m).value) { $('#ysT', m).value = s.balance; pv(); } }; $('#ysS', m).onchange();
    $('#ysGo', m).onclick = function () {
      var t = U.n($('#ysT', m).value); if (t <= 0) return toast(L('اكتب المبلغ', 'Enter the amount'), 'bad');
      var db = Store.db; db.seq.supInst++; var x = { id: U.id(), no: db.seq.supInst, date: Date.now(), supplier: $('#ysS', m).value, total: U.r2(t), ref: $('#ysR', m).value, schedule: sched(), pays: [], by: App.user.name };
      if ($('#ysB', m).checked) { var s = SupInst.sup(x.supplier); if (s) s.balance = U.r2(U.n(s.balance) + x.total); x.addedToBalance = true; }
      db.supInst.push(x); Store.log('supinst.new', 'Y#' + x.no + ' ' + x.total); Store.save(); Modal.close(m); if (after) after();
    };
  },
  pay: function (x, after) {
    var n = SupInst.next(x); if (!n) return;
    H.collect('💸 ' + L('دفع قسط للمورد — ', 'Pay supplier — ') + U.esc((SupInst.sup(x.supplier) || {}).name || ''), U.r2(n.amount - n.paid), function (r) {
      var v = Math.min(r.v, SupInst.rem(x)); if (v <= 0) return false; var left = v;
      x.schedule.forEach(function (s) { if (left <= 0) return; var need = U.r2(s.amount - s.paid), t = Math.min(need, left); if (t > 0) { s.paid = U.r2(s.paid + t); left = U.r2(left - t); } });
      var p = { t: Date.now(), v: U.r2(v), m: r.m, by: App.user.name, shift: App.shift ? App.shift.id : '' }; x.pays.push(p);
      var s = SupInst.sup(x.supplier); if (s) { s.balance = U.r2(U.n(s.balance) - v); (s.payments = s.payments || []).push({ t: p.t, v: v, u: App.user.name, shift: p.shift, ref: 'Y#' + x.no }); }
      Store.log('supinst.pay', 'Y#' + x.no + ' ' + v); Store.save(); toast('✅ ' + L('اتسجّل الدفع', 'Payment recorded'), 'ok'); if (after) after();
    }, { label: L('القسط رقم ', 'Instalment #') + n.n + ' · ' + n.due, sub: L('المتبقي للمورد ', 'Left ') + U.money(SupInst.rem(x)), btn: L('تسجيل الدفع', 'Record payment') });
  }
};
Views.supinst = {
  render: function (el) {
    var all = Store.db.supInst || [], open = all.filter(function (x) { return SupInst.rem(x) > 0.009; }), wk = U.today(Date.now() + 7 * 864e5);
    var soon = open.filter(function (x) { var n = SupInst.next(x); return n && n.due <= wk; });
    el.innerHTML = '<div class="grid g3" style="margin-bottom:14px"><div class="card kpi hero"><div class="l">🏭 ' + L('إجمالي المطلوب للموردين بالأقساط', 'Owed in instalments') + '</div><div class="v num">' + U.money(H.sum(open, SupInst.rem)) + '</div><div class="small">' + open.length + L(' جدول', ' plans') + '</div></div><div class="card kpi"><div class="l">⏰ ' + L('مستحق خلال أسبوع / متأخر', 'Due within a week / late') + '</div><div class="v num" style="color:var(--warn)">' + soon.length + '</div><div class="muted small">' + U.money(H.sum(soon, function (x) { var n = SupInst.next(x); return n.amount - n.paid; })) + '</div></div><div class="card kpi"><div class="l">' + L('أرصدة الموردين', 'Supplier balances') + '</div><div class="v num">' + U.money(H.sum(Store.db.suppliers, function (s) { return s.balance; })) + '</div></div></div>' +
      '<div class="row" style="margin-bottom:12px"><div class="grow"></div><button class="btn pri" id="ysNew">➕ ' + L('جدول أقساط جديد', 'New plan') + '</button></div>' +
      (all.length ? '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('المورد', 'Supplier') + '</th><th>' + L('البيان', 'Ref') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>' + L('الدفعة الجاية', 'Next') + '</th><th>' + L('المتبقي', 'Left') + '</th><th></th></tr>' + all.slice().reverse().map(function (x) { var n = SupInst.next(x), d = n ? H.daysTo(n.due) : null; return '<tr><td class="num"><b>' + x.no + '</b></td><td><b>' + U.esc((SupInst.sup(x.supplier) || {}).name || '—') + '</b></td><td>' + U.esc(x.ref || '') + '</td><td class="num">' + U.money(x.total) + '</td><td class="num">' + (n ? n.due + ' — ' + U.money(n.amount - n.paid) + ' ' + (d < 0 ? H.chip(L('متأخر ', 'late ') + (-d), 'bad') : d <= 3 ? H.chip(d === 0 ? L('النهارده', 'today') : L('بعد ', 'in ') + d, 'warn') : '') : H.chip('✅ ' + L('خالص', 'Paid'), 'ok')) + '</td><td class="num"><b>' + U.money(SupInst.rem(x)) + '</b></td><td>' + (n ? '<button class="btn sm pri" data-yp="' + x.id + '">💸 ' + L('دفع', 'Pay') + '</button>' : '') + '<button class="btn sm" data-yv="' + x.id + '">📅</button></td></tr>'; }).join('') + '</table></div>' : '<div class="empty">' + L('مفيش أقساط للموردين', 'No supplier instalments') + '</div>');
    var get = function (id) { return all.filter(function (x) { return x.id === id; })[0]; };
    $('#ysNew').onclick = function () { SupInst.edit(function () { go('supinst'); }); };
    $$('[data-yp]').forEach(function (b) { b.onclick = function () { SupInst.pay(get(b.dataset.yp), function () { go('supinst'); }); }; });
    $$('[data-yv]').forEach(function (b) { b.onclick = function () { var x = get(b.dataset.yv); Modal.open({ title: '📅 ' + L('جدول رقم ', 'Plan #') + x.no, body: '<table class="t"><tr><th>#</th><th>' + L('الميعاد', 'Due') + '</th><th>' + L('القيمة', 'Amount') + '</th><th>' + L('المدفوع', 'Paid') + '</th></tr>' + x.schedule.map(function (s) { return '<tr><td>' + s.n + '</td><td class="num">' + s.due + '</td><td class="num">' + U.money(s.amount) + '</td><td class="num">' + U.money(s.paid) + '</td></tr>'; }).join('') + '</table>' + (x.pays.length ? '<div style="margin-top:8px">' + x.pays.map(function (p) { return '<div class="list-row">💸 <b class="num">' + U.money(p.v) + '</b> · ' + pmName(p.m) + ' · <span class="muted small">' + U.dt(p.t) + ' · ' + U.esc(p.by) + '</span></div>'; }).join('') + '</div>' : '') }); }; });
  }
};

/* dashboard: supplier payments coming up */
(function () {
  var db0 = Views.dashboard;
  Views.dashboard = function (el) {
    db0.apply(this, arguments);
    try {
      if (!F('supinst') || !can('supinst')) return;
      var t3 = U.today(Date.now() + 3 * 864e5), due = (Store.db.supInst || []).filter(function (x) { var n = SupInst.next(x); return n && n.due <= t3; });
      if (!due.length) return;
      var box = $('.home-alerts', el); if (!box) { box = document.createElement('div'); box.className = 'home-alerts'; el.insertBefore(box, el.firstChild); }
      var b = document.createElement('button'); b.className = 'card ha warn'; b.innerHTML = '<span class="e">🏭</span><span class="grow"><b>' + L('أقساط موردين مستحقة', 'Supplier payments due') + '</b><span class="num">' + due.length + ' · ' + U.money(H.sum(due, function (x) { var n = SupInst.next(x); return n.amount - n.paid; })) + '</span></span><span class="muted">←</span>'; b.onclick = function () { go('supinst'); }; box.appendChild(b);
    } catch (e) { }
  };
})();
