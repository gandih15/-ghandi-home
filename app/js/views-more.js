/* Ghandi Home — receipt popup + smart printing, discounts per invoice & per product, developer data purge. */
'use strict';

/* ================= smart printing: real printer only, never a "save as PDF" window ================= */
var SmartPrint = {
  virt: /pdf|xps|onenote|fax|document writer|send to|cutepdf|nitro|anydesk|microsoft print/i,
  list: function () { if (!IS_ELECTRON) return Promise.resolve([]); return IPC.invoke('printers2').then(function (r) { return r || []; }).catch(function () { return []; }); },
  pick: function (pref) {
    return SmartPrint.list().then(function (ps) {
      var real = ps.filter(function (p) { return !SmartPrint.virt.test(p.name); });
      if (pref) { var hit = real.filter(function (p) { return p.name === pref; })[0]; if (hit) return hit.name; }
      var d = real.filter(function (p) { return p.isDefault; })[0] || (real.length === 1 ? real[0] : null);
      return d ? d.name : null;
    });
  }
};
(function () {
  var rp0 = Receipt.print;
  // opt.auto: printing right after a sale (silent, skip if no printer) · opt.manual: the cashier pressed «Print»
  Receipt.print = function (s, opt) {
    opt = opt || {};
    if (!IS_ELECTRON) { if (opt.auto) return Promise.resolve(null); rp0(s); return Promise.resolve('browser'); }
    return SmartPrint.pick(S().printers.invoice).then(function (name) {
      var cfg = S().invoice, o = { css: Receipt.css(), copies: +cfg.copies || 1, dir: lang() === 'en' ? 'ltr' : 'rtl' };
      if (!name) {
        if (opt.manual) { o.printer = ''; o.silent = false; Printer.print(Receipt.html(s), o); return 'dialog'; }
        toast('🖨️ ' + L('مفيش طابعة متوصلة — الفاتورة محفوظة في البرنامج، اطبعها من «الفواتير» لما توصل الطابعة', 'No printer connected — the invoice is saved; print it later from Invoices'), 'bad');
        return null;
      }
      o.printer = name; o.silent = true; Printer.print(Receipt.html(s), o); return name;
    });
  };
})();

/* ================= discounts of an invoice ================= */
function saleDisc(s) {
  var promo = 0; (s.items || []).forEach(function (i) { if (U.n(i.base) > i.price) promo += (i.base - i.price) * i.qty; });
  var d = s.disc || {}, inv = U.n(s.discount);
  return { promo: U.r2(promo), manual: U.r2(s.disc ? U.n(d.manual) : inv), coupon: U.r2(U.n(d.coupon)), points: U.r2(U.n(d.points)), inv: U.r2(inv), total: U.r2(promo + inv) };
}
function discHtml(s, small) {
  var d = saleDisc(s); if (!d.total) return '<span class="muted">—</span>';
  var parts = []; if (d.promo) parts.push('🎁 ' + U.money(d.promo)); if (d.manual) parts.push('✂️ ' + U.money(d.manual)); if (d.coupon) parts.push('🎟️ ' + U.money(d.coupon)); if (d.points) parts.push('⭐ ' + U.money(d.points));
  return '<b class="num" style="color:var(--bad)">−' + U.money(d.total) + '</b>' + (small !== false && parts.length ? '<div class="muted small" style="white-space:nowrap">' + parts.join(' · ') + '</div>' : '');
}

/* ================= receipt popup after every sale ================= */
var ReceiptPop = {
  show: function (s, auto) {
    var d = saleDisc(s), cu = s.customer && typeof Cust !== 'undefined' ? Cust.get(s.customer) : null;
    var m = Modal.open({ size: 'wide', title: '✅ ' + L('تم البيع — فاتورة #', 'Sale completed — invoice #') + s.no, body: '<div class="grid rpop" style="grid-template-columns:1fr 1fr;gap:18px"><div class="preview-wrap" style="min-height:0;padding:14px;max-height:62vh;overflow:auto"><div class="receipt">' + Receipt.html(s) + '</div></div><div class="col">' +
      '<div class="card kpi hero"><div class="l">' + L('الإجمالي', 'Total') + '</div><div class="v num" style="font-size:40px">' + U.money(s.total) + '</div>' + (s.change ? '<div style="font-size:20px;margin-top:6px">💵 ' + L('الباقي للعميل: ', 'Change: ') + '<b class="num">' + U.money(s.change) + '</b></div>' : '') + '</div>' +
      (d.total ? '<div class="card" style="padding:12px"><div class="row" style="justify-content:space-between"><b>✂️ ' + L('إجمالي الخصم', 'Total discount') + '</b>' + discHtml(s, false) + '</div><div class="muted small" style="margin-top:4px">' + [d.promo ? '🎁 ' + L('عروض ', 'offers ') + U.money(d.promo) : '', d.manual ? '✂️ ' + L('خصم ', 'manual ') + U.money(d.manual) : '', d.coupon ? '🎟️ ' + L('كوبون ', 'coupon ') + U.money(d.coupon) : '', d.points ? '⭐ ' + L('نقاط ', 'points ') + U.money(d.points) : ''].filter(Boolean).join(' · ') + '</div></div>' : '') +
      (cu ? '<div class="card" style="padding:12px">💞 <b>' + U.esc(cu.name) + '</b>' + (s.ptsEarned ? ' · ⭐ +' + s.ptsEarned + L(' نقطة', ' pts') : '') + '</div>' : '') +
      '<div class="card rp-status" id="rpSt">' + (auto ? '🖨️ ' + L('جاري الطباعة…', 'Printing…') : '💾 ' + L('الفاتورة اتحفظت في البرنامج', 'Invoice saved in the program')) + '</div></div></div>',
      foot: '<button class="btn" id="rpP">🖨️ ' + L('طباعة', 'Print') + '</button><button class="btn pri lg" id="rpN">🛍️ ' + L('بيع جديد', 'New sale') + ' <span class="kbd">Enter</span></button>' });
    var st = $('#rpSt', m), set = function (r) {
      if (!st) return;
      if (r === 'browser') st.innerHTML = '🖨️ ' + L('اتبعتت للطباعة', 'Sent to the printer');
      else if (r === 'dialog') st.innerHTML = '🖨️ ' + L('اختار الطابعة من النافذة', 'Pick a printer in the dialog');
      else if (r) { st.innerHTML = '✅ ' + L('اتطبعت على ', 'Printed on ') + '<b>' + U.esc(r) + '</b>'; st.classList.add('ok'); }
      else { st.innerHTML = '⚠️ ' + L('مفيش طابعة متوصلة — الفاتورة محفوظة. وصّل الطابعة واضغط «طباعة».', 'No printer connected — the invoice is saved. Connect it and press Print.'); st.classList.add('warn'); }
    };
    if (auto) Receipt.print(s, { auto: true }).then(set);
    $('#rpP', m).onclick = function () { Receipt.print(s, { manual: true }).then(set); };
    $('#rpN', m).onclick = function () { Modal.close(m); var sc = $('#scan'); if (sc) sc.focus(); };
    setTimeout(function () { $('#rpN', m).focus(); }, 80);
    // the next customer's scan (or F-keys) closes the popup and goes straight to selling
    m.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key && e.key.length === 1 && e.target.tagName !== 'INPUT') { e.preventDefault(); Modal.close(m); var sc = $('#scan'); if (sc) { sc.focus(); sc.value = e.key; } }
      else if (/^F\d+$/.test(e.key)) { Modal.close(m); }
    }, true);
  }
};

/* ================= invoices list: discount column ================= */
(function () {
  var tb = Views.sales.table;
  Views.sales.table = function () {
    tb.apply(this, arguments);
    var t = $('#stb table'); if (!t || !t.rows.length) return;
    var hr = t.rows[0], th = document.createElement('th'); th.textContent = '✂️ ' + L('الخصم', 'Discount'); hr.insertBefore(th, hr.cells[6] || null);
    var sum = 0;
    for (var i = 1; i < t.rows.length; i++) { var r = t.rows[i]; if (!r.dataset.id) { if (r.cells[0]) r.cells[0].colSpan = (r.cells[0].colSpan || 1) + 1; continue; } var s = Store.db.sales.filter(function (x) { return x.id === r.dataset.id; })[0]; var td = r.insertCell(6); td.innerHTML = s && s.type === 'sale' ? discHtml(s) : '<span class="muted">—</span>'; if (s && s.type === 'sale' && !s.void) sum += saleDisc(s).total; }
    var sm = $('#ssum'); if (sm && sum) sm.insertAdjacentHTML('beforeend', ' <span class="chip bad">✂️ ' + L('إجمالي الخصومات ', 'Discounts ') + U.money(sum) + '</span>');
  };
})();

/* ================= reports: discounts per product ================= */
var DiscRep = {
  q: '',
  calc: function (a, b) {
    var per = {}, tot = { promo: 0, manual: 0, coupon: 0, points: 0, total: 0, n: 0, gross: 0 }, byUser = {};
    Store.db.sales.forEach(function (s) {
      if (s.void || s.type !== 'sale' || s.date < a || s.date >= b) return;
      var d = saleDisc(s), sub = s.items.reduce(function (x, i) { return x + i.price * i.qty; }, 0) || 1;
      if (d.total) tot.n++; ['promo', 'manual', 'coupon', 'points', 'total'].forEach(function (k) { tot[k] += d[k]; });
      var u = byUser[s.userName || '—'] = byUser[s.userName || '—'] || { n: 0, manual: 0, total: 0 }; u.n++; u.manual += d.manual; u.total += d.total;
      s.items.forEach(function (i) {
        if (i.gift) return; var k = i.pid || i.name, r = per[k] = per[k] || { pid: i.pid, name: i.name, q: 0, gross: 0, net: 0, promo: 0, inv: 0 };
        var base = U.n(i.base) > i.price ? i.base : i.price, share = d.inv * (i.price * i.qty) / sub;
        r.q += i.qty; r.gross += base * i.qty; r.promo += (base - i.price) * i.qty; r.inv += share; r.net += i.price * i.qty - share;
        tot.gross += base * i.qty;
      });
    });
    var rows = Object.keys(per).map(function (k) { var r = per[k]; r.total = r.promo + r.inv; return r; }).filter(function (r) { return r.total > 0.004; }).sort(function (x, y) { return y.total - x.total; });
    return { rows: rows, tot: tot, byUser: byUser };
  },
  render: function (el) {
    var st = Views.reports.st, rg = rangeMs(st), R = DiscRep.calc(rg[0], rg[1]), T = R.tot, q = U.norm(DiscRep.q);
    var rows = R.rows.filter(function (r) { if (!q) return true; var p = Store.product(r.pid); return U.norm(r.name + ' ' + (p ? p.barcodes.join(' ') : '')).indexOf(q) >= 0; });
    var k = function (e, a, b, v, sub) { return '<div class="card kpi"><div class="l">' + e + ' ' + L(a, b) + '</div><div class="v">' + M(v) + '</div>' + (sub ? '<div class="muted small">' + sub + '</div>' : '') + '</div>'; };
    el.innerHTML = '<div class="row wrap" style="margin-bottom:12px">' + dateRangeBar('rdd', st) + '<div class="grow"></div><input class="in" id="ddq" style="width:230px" placeholder="' + L('ابحث بالصنف أو الباركود', 'Search product or barcode') + '" value="' + U.esc(DiscRep.q) + '">' + (can('export') ? '<button class="btn" id="ddX">' + ic('down') + 'Excel</button>' : '') + '</div>' +
      '<div class="grid g4" style="margin-bottom:12px"><div class="card kpi hero"><div class="l">✂️ ' + L('إجمالي الخصومات', 'Total discounts') + '</div><div class="v">' + M(T.total) + '</div><div class="small" style="opacity:.85">' + T.n + L(' فاتورة فيها خصم', ' invoices with a discount') + (T.gross ? ' · ' + (T.total / T.gross * 100).toFixed(1) + '%' + L(' من قيمة البضاعة', ' of goods value') : '') + '</div></div>' + k('🎁', 'عروض وأسعار مخفّضة', 'Offers & reduced prices', T.promo) + k('✂️', 'خصم يدوي من الكاشير', 'Manual discounts', T.manual) + k('🎟️⭐', 'كوبونات + نقاط', 'Coupons + points', T.coupon + T.points, '🎟️ ' + U.money(T.coupon) + ' · ⭐ ' + U.money(T.points)) + '</div>' +
      '<div class="grid" style="grid-template-columns:1fr 300px;gap:14px;align-items:start"><div class="tbl-wrap"><table class="t"><tr><th>' + L('الصنف', 'Product') + '</th><th>' + L('الكمية', 'Qty') + '</th><th>' + L('قيمته قبل الخصم', 'Value before') + '</th><th>🎁 ' + L('خصم العروض', 'Offer discount') + '</th><th>✂️ ' + L('نصيبه من خصم الفاتورة', 'Share of invoice discount') + '</th><th>' + L('إجمالي الخصم', 'Total discount') + '</th><th>%</th></tr>' +
      (rows.length ? rows.map(function (r) { var p = Store.product(r.pid); return '<tr><td><b>' + U.esc(p ? pname(p) : r.name) + '</b>' + (p && p.shade ? ' <span class="muted small">' + U.esc(p.shade) + '</span>' : '') + '</td><td class="num">' + r.q + '</td><td class="num">' + U.money(r.gross) + '</td><td class="num">' + (r.promo ? U.money(r.promo) : '—') + '</td><td class="num">' + (r.inv > 0.004 ? U.money(r.inv) : '—') + '</td><td class="num"><b style="color:var(--bad)">' + U.money(r.total) + '</b></td><td class="num">' + (r.gross ? (r.total / r.gross * 100).toFixed(1) : 0) + '%</td></tr>'; }).join('') : '<tr><td colspan="7"><div class="empty"><span class="em">✂️</span>' + L('مفيش خصومات في الفترة دي', 'No discounts in this period') + '</div></td></tr>') + '</table></div>' +
      '<div class="card"><h3>👤 ' + L('الخصم حسب الكاشير', 'By cashier') + '</h3>' + Object.keys(R.byUser).map(function (u) { var x = R.byUser[u]; return '<div class="list-row"><span class="grow">' + U.esc(u) + '<div class="muted small">' + L('يدوي ', 'manual ') + U.money(x.manual) + '</div></span><b class="num">' + U.money(x.total) + '</b></div>'; }).join('') + '</div></div>';
    bindRange('rdd', st, function () { DiscRep.render(el); });
    var t0; $('#ddq').oninput = function () { var v = this.value; clearTimeout(t0); t0 = setTimeout(function () { DiscRep.q = v; DiscRep.render(el); var i = $('#ddq'); i.focus(); i.setSelectionRange(v.length, v.length); }, 250); };
    if ($('#ddX')) $('#ddX').onclick = function () { saveBlob(XL.writeXlsx([[L('الصنف', 'Product'), L('الكمية', 'Qty'), L('قيمته قبل الخصم', 'Value before'), L('خصم العروض', 'Offer discount'), L('نصيب خصم الفاتورة', 'Invoice discount share'), L('إجمالي الخصم', 'Total discount')]].concat(rows.map(function (r) { return [r.name, r.q, U.r2(r.gross), U.r2(r.promo), U.r2(r.inv), U.r2(r.total)]; })), 'Discounts', lang() !== 'en'), 'discounts_' + U.today() + '.xlsx'); };
  }
};
(function () {
  var R = Views.reports, rr = R.render;
  R.render = function (el) {
    rr.apply(this, arguments); var seg = $('#rT', el); if (!seg) return;
    var b = document.createElement('button'); b.dataset.t = 'disc'; b.textContent = '✂️ ' + L('الخصومات', 'Discounts');
    if (R.tab === 'disc') { $$('button', seg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }
    var ref = $('[data-t="tier"]', seg); seg.insertBefore(b, ref ? ref.nextSibling : null); b.onclick = function () { R.tab = 'disc'; R.render(el); };
    if (R.tab === 'disc') DiscRep.render($('#rBody'));
  };
})();

/* ================= developer: delete old invoices to slim the data ================= */
var Purge = {
  card: function (box) {
    var first = Store.db.sales.length ? Store.db.sales[0].date : Date.now(), y = new Date(); y.setMonth(y.getMonth() - 6);
    box.innerHTML = '<h3>🗑️ ' + L('حذف فواتير قديمة لتخفيف البيانات', 'Delete old invoices to slim the data') + '</h3><div class="muted small">' + L('بيتعمل نسخة احتياطية كاملة الأول. الحذف مش بيغيّر رصيد المخزن ولا حسابات العملاء — بيشيل سجل الفواتير بس من الفترة دي.', 'A full backup is taken first. Stock and customer balances are not changed — only the invoice records of that period are removed.') + '</div>' +
      '<div class="row wrap" style="gap:10px;margin-top:8px"><label class="f">' + L('من', 'From') + '<input class="in" type="date" id="pgA" value="' + U.today(first) + '"></label><label class="f">' + L('إلى (شامل)', 'To (inclusive)') + '<input class="in" type="date" id="pgB" value="' + U.today(y) + '"></label></div>' +
      '<div class="grid g2" style="gap:6px;margin-top:8px"><label class="feat-r"><span>🧾 ' + L('فواتير البيع والمرتجع', 'Sales & returns') + '</span><input type="checkbox" class="sw" id="pgS" checked></label><label class="feat-r"><span>📦 ' + L('حركات المخزن في نفس الفترة', 'Stock movements in that period') + '</span><input type="checkbox" class="sw" id="pgM"></label><label class="feat-r"><span>📝 ' + L('سجل العمليات في نفس الفترة', 'Activity log in that period') + '</span><input type="checkbox" class="sw" id="pgL"></label><label class="feat-r"><span>⏰ ' + L('الورديات المقفولة في نفس الفترة', 'Closed shifts in that period') + '</span><input type="checkbox" class="sw" id="pgH"></label></div>' +
      '<div class="card" id="pgInfo" style="margin-top:10px;padding:10px"></div><button class="btn" id="pgGo" style="color:var(--bad);margin-top:8px">🗑️ ' + L('حذف', 'Delete') + '</button>';
    var rng = function () { var a = new Date($('#pgA', box).value + 'T00:00').getTime(), b = new Date($('#pgB', box).value + 'T00:00').getTime() + 864e5; return [a || 0, b || 0]; };
    var count = function () {
      var r = rng(), db = Store.db, n = { s: 0, v: 0, m: 0, l: 0, h: 0 };
      db.sales.forEach(function (s) { if (s.date >= r[0] && s.date < r[1]) { n.s++; if (s.type === 'sale' && !s.void) n.v += s.total; } });
      (db.moves || []).forEach(function (x) { if (x.t >= r[0] && x.t < r[1]) n.m++; });
      (db.log || []).forEach(function (x) { if (x.t >= r[0] && x.t < r[1]) n.l++; });
      (db.shifts || []).forEach(function (x) { if (x.closeAt && x.closeAt >= r[0] && x.closeAt < r[1]) n.h++; });
      var size = 0; try { size = JSON.stringify(db).length; } catch (e) { }
      $('#pgInfo', box).innerHTML = '🧾 <b class="num">' + n.s + '</b> ' + L('فاتورة', 'invoices') + ' (' + L('مبيعات ', 'sales ') + U.money(n.v) + ') · 📦 <b class="num">' + n.m + '</b> ' + L('حركة', 'moves') + ' · 📝 <b class="num">' + n.l + '</b> ' + L('سجل', 'log') + ' · ⏰ <b class="num">' + n.h + '</b> ' + L('وردية', 'shifts') + '<div class="muted small">' + L('حجم البيانات الحالي تقريباً: ', 'Current data size ≈ ') + (size / 1048576).toFixed(2) + ' MB · ' + Store.db.sales.length + L(' فاتورة إجمالي', ' invoices total') + '</div>';
      return n;
    };
    ['pgA', 'pgB'].forEach(function (id) { $('#' + id, box).onchange = count; }); count();
    $('#pgGo', box).onclick = function () {
      var n = count(), r = rng(); if (r[1] <= r[0]) return toast(L('التواريخ غلط', 'Invalid dates'), 'bad');
      var m = Modal.open({ title: '🗑️ ' + L('تأكيد الحذف', 'Confirm delete'), body: '<div class="col"><div>' + L('هيتحذف نهائياً من ', 'This permanently deletes from ') + '<b>' + $('#pgA', box).value + '</b>' + L(' لحد ', ' to ') + '<b>' + $('#pgB', box).value + '</b>:</div><div>' + $('#pgInfo', box).innerHTML + '</div><div class="muted small">' + L('هتتعمل نسخة احتياطية كاملة قبل الحذف. اكتب كلمة «حذف» للتأكيد:', 'A full backup is taken first. Type DELETE to confirm:') + '</div><input class="in" id="pgW" autofocus></div>', foot: '<button class="btn" id="pgY" style="color:var(--bad)">🗑️ ' + L('احذف', 'Delete') + '</button>' });
      $('#pgY', m).onclick = function () {
        if (!/^(حذف|delete)$/i.test($('#pgW', m).value.trim())) return toast(L('اكتب «حذف» بالظبط', 'Type the word exactly'), 'bad');
        var done = function () {
          var db = Store.db, inR = function (t) { return t >= r[0] && t < r[1]; }, k = { s: 0, m: 0, l: 0, h: 0 };
          if ($('#pgS', box).checked) { var b0 = db.sales.length; db.sales = db.sales.filter(function (s) { return !inR(s.date); }); k.s = b0 - db.sales.length; }
          if ($('#pgM', box).checked && db.moves) { var b1 = db.moves.length; db.moves = db.moves.filter(function (x) { return !inR(x.t); }); k.m = b1 - db.moves.length; }
          if ($('#pgL', box).checked && db.log) { var b2 = db.log.length; db.log = db.log.filter(function (x) { return !inR(x.t); }); k.l = b2 - db.log.length; }
          if ($('#pgH', box).checked && db.shifts) { var b3 = db.shifts.length; db.shifts = db.shifts.filter(function (x) { return !(x.closeAt && inR(x.closeAt)); }); k.h = b3 - db.shifts.length; }
          Store.log('dev.purge', $('#pgA', box).value + '→' + $('#pgB', box).value + ' s' + k.s + ' m' + k.m + ' l' + k.l + ' h' + k.h); Store.saveNow();
          Modal.close(m); toast('🗑️ ' + L('اتحذف: ', 'Deleted: ') + k.s + L(' فاتورة', ' invoices') + (k.m ? ' · ' + k.m + L(' حركة', ' moves') : '') + (k.l ? ' · ' + k.l + L(' سجل', ' log') : '') + (k.h ? ' · ' + k.h + L(' وردية', ' shifts') : ''), 'ok'); count();
        };
        $('#pgY', m).disabled = true; $('#pgY', m).textContent = '💾 ' + L('بعمل نسخة احتياطية…', 'Backing up…');
        var p; try { Store.saveNow(); p = Backup.run('purge'); } catch (e) { }
        Promise.resolve(p).then(done, done);
      };
    };
  }
};
(function () {
  var dv = Views.dev;
  Views.dev = function (el) { dv.apply(this, arguments); var host = $('.grid', el) || el, c = document.createElement('div'); c.className = 'card col'; c.style.gridColumn = '1 / -1'; host.appendChild(c); Purge.card(c); };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.7.1'] = ['🧾 بعد كل بيعة الفاتورة بتفتح قدامك وتحتها زرار طباعة — ولو الطابعة متوصلة بتطبع لوحدها من غير ما يسألك تحفظها', '✂️ عمود «الخصم» قدام كل فاتورة في الفواتير والمرتجع', '📊 تقرير «الخصومات»: إجمالي الخصم لكل صنف وحسب النوع والكاشير'];
if (typeof Updater !== 'undefined') Updater.notes['1.7.2'] = ['✂️ خانة «الخصومات» لكل صنف في جدول «الأصناف المباعة» بالتقارير + إجمالي الخصومات للفترة'];

/* ================= receipt-size prints (shift report, gift card, layaway) never open a "save" window ================= */
(function () {
  var pp = Printer.print;
  Printer.print = function (html, opt) {
    opt = opt || {};
    if (!opt.receipt || !IS_ELECTRON) return pp.apply(this, arguments);
    SmartPrint.pick(opt.printer).then(function (name) {
      if (!name) return toast('🖨️ ' + L('مفيش طابعة متوصلة — اتحفظ في البرنامج ومش هيتطبع دلوقتي', 'No printer connected — saved, not printed'), 'bad');
      pp(html, Object.assign({}, opt, { printer: name, silent: true }));
    });
  };
})();

/* ================= admin corrects the counted cash of a closed shift ================= */
(function () {
  var sr = Views.shifts.render;
  Views.shifts.render = function (el) {
    sr.apply(this, arguments);
    $$('[data-fixc]', el).forEach(function (b) {
      b.onclick = function () {
        var sh = Store.db.shifts.filter(function (x) { return x.id === b.dataset.fixc; })[0]; if (!sh) return;
        var exp = Views.shifts.calc(sh).expected;
        var m = Modal.open({ title: '✏️ ' + L('تصحيح المبلغ الفعلي — وردية #', 'Correct counted cash — shift #') + sh.no, body: '<div class="col"><div class="muted">' + L('المتوقع: ', 'Expected: ') + '<b class="num">' + U.money(exp) + '</b> · ' + L('المسجّل: ', 'Recorded: ') + '<b class="num">' + U.money(sh.closeCash) + '</b></div><label class="f">' + L('المبلغ اللي كان في الدرج فعلاً', 'Cash that was actually in the drawer') + '<input class="in num" type="number" id="fxV" autofocus value="' + U.n(sh.closeCash) + '" style="font-size:22px;text-align:center"></label><label class="f">' + L('السبب', 'Reason') + '<input class="in" id="fxN" placeholder="' + L('مثلاً: اتقفلت من غير ما المبلغ يتكتب', 'e.g. closed without entering the amount') + '"></label></div>', foot: '<button class="btn pri" id="fxS">' + ic('save') + L('حفظ', 'Save') + '</button>' });
        $('#fxS', m).onclick = function () {
          var v = $('#fxV', m).value.trim(); if (v === '') return toast(L('اكتب المبلغ', 'Enter the amount'), 'bad');
          (sh.fixes = sh.fixes || []).push({ t: Date.now(), from: sh.closeCash, to: U.n(v), by: App.user.name, note: $('#fxN', m).value });
          Store.log('shift.fix', '#' + sh.no + ' ' + sh.closeCash + ' → ' + U.n(v) + ' ' + $('#fxN', m).value);
          sh.closeCash = U.n(v); Store.save(); Modal.close(m); toast(L('اتصحّح ✓', 'Corrected ✓'), 'ok'); Views.shifts.render(el);
        };
      };
    });
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.7.3'] = ['⏰ قفل الوردية: لازم تكتب المبلغ اللي في الدرج، ولو فيه عجز أو زيادة بيطلب تأكيد', '✏️ المدير يقدر يصحّح «الفعلي» لوردية اتقفلت غلط', '🖨️ تقرير الوردية وكارت الهدية وإيصال الحجز بيطبعوا على الطابعة على طول من غير نافذة حفظ'];

/* ================= owner can switch the shift system off right from the Shifts page ================= */
(function () {
  var sr = Views.shifts.render;
  Views.shifts.render = function (el) {
    sr.apply(this, arguments);
    if (!App.user || App.user.role !== 'admin' || devS().shiftMode !== 'owner') return;
    var c = document.createElement('div'); c.className = 'card row'; c.style.cssText = 'margin-bottom:14px;justify-content:space-between;flex-wrap:wrap;gap:10px';
    c.innerHTML = '<div><b>⏰ ' + L('نظام الورديات شغّال', 'The shift system is on') + '</b><div class="muted small">' + L('لو مش محتاجه: اقفله، والكاشير يبيع على طول من غير فتح وقفل وردية. تقدر ترجّعه من «الإعدادات ← نظام الورديات».', 'Not needed? Turn it off and cashiers sell without opening/closing shifts. Turn it back on from Settings → Shift system.') + '</div></div><button class="btn" id="shOff" style="color:var(--bad)">⛔ ' + L('إيقاف نظام الورديات', 'Turn off shifts') + '</button>';
    el.insertBefore(c, el.firstChild);
    $('#shOff').onclick = function () {
      Modal.confirm(L('إيقاف نظام الورديات؟ الكاشير هيبيع من غير فتح وردية، والورديات القديمة وتقاريرها هتفضل محفوظة.', 'Turn off shifts? Cashiers will sell without a shift; old shifts stay saved.'), function () {
        if (App.shift && !App.shift.closeAt) toast(L('الوردية المفتوحة اتسابت زي ما هي — تقدر تقفلها لو رجّعت النظام', 'The open shift is left as is'), 'warn');
        S().shiftsEnabled = false; App.shift = null; Store.log('shifts.enabled', false); Store.save(); Shell.render(); go('dashboard'); toast('⛔ ' + L('نظام الورديات اتقفل', 'Shift system turned off'), 'ok');
      });
    };
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.7.4'] = ['⏰ زرار «إيقاف نظام الورديات» في صفحة الورديات لصاحب المحل'];

/* ================= barcode labels: print straight to the label printer · download as PDF ================= */
var LabelPdf = {
  save: function (html, css, o) {
    var doc = '<!doctype html><html dir="' + (lang() === 'en' ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><style>' + css + '</style></head><body>' + html + '</body></html>', name = 'barcodes_' + U.today() + '.pdf';
    if (IS_ELECTRON) return IPC.invoke('savePdf', { html: doc, name: name }).then(function (r) { if (r && r.ok) toast('⬇️ ' + L('اتحفظ الملف: ', 'Saved: ') + r.path, 'ok'); else if (r && r.error !== 'cancelled') toast(L('مقدرتش أحفظ: ', 'Could not save: ') + r.error, 'bad'); });
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([doc], { type: 'text/html' })); a.download = name.replace('.pdf', '.html'); document.body.appendChild(a); a.click(); a.remove();
    toast('⬇️ ' + L('اتنزّل ملف الملصقات — افتحه واطبعه من أي جهاز', 'Labels file downloaded'), 'ok');
  }
};
SmartPrint.labelRx = /label|barcode|xprinter|zebra|tsc|godex|gprinter|xp-|ttp|zd\d|gk\d|honeywell|argox|bixolon|sato|citizen/i;
SmartPrint.pickLabel = function (pref) {
  return SmartPrint.list().then(function (ps) {
    var real = ps.filter(function (p) { return !SmartPrint.virt.test(p.name); });
    if (pref) { var hit = real.filter(function (p) { return p.name === pref; })[0]; if (hit) return hit.name; }
    var lb = real.filter(function (p) { return SmartPrint.labelRx.test(p.name); })[0]; if (lb) return lb.name;
    var d = real.filter(function (p) { return p.isDefault; })[0] || (real.length === 1 ? real[0] : null); return d ? d.name : null;
  });
};
(function () {
  var pp = Printer.print;
  Printer.print = function (html, opt) {
    opt = opt || {};
    if (!opt.label || !IS_ELECTRON) return pp.apply(this, arguments);
    SmartPrint.pickLabel(opt.printer).then(function (name) {
      if (!name) return toast('🏷️ ' + L('مفيش طابعة باركود متوصلة — استخدم «تنزيل الملصقات» واطبعها من جهاز تاني', 'No label printer connected — use «Download labels» and print elsewhere'), 'bad');
      pp(html, Object.assign({}, opt, { printer: name, silent: true })); toast('🏷️ ' + L('بيطبع على ', 'Printing on ') + name, 'ok');
    });
  };
  var rd = Views.labels.render;
  Views.labels.render = function (el) {
    rd.apply(this, arguments); var b = $('#lprint'); if (!b || $('#ldl')) return;
    var d = document.createElement('button'); d.className = 'btn'; d.id = 'ldl'; d.style.cssText = 'width:100%;margin-top:8px'; d.innerHTML = '⬇️ ' + L('تنزيل الملصقات (PDF) للطباعة من جهاز تاني', 'Download labels (PDF) to print elsewhere'); d.onclick = function () { Views.labels.print(true); };
    b.parentNode.insertBefore(d, b.nextSibling);
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.8.5x'] = ['🏷️ طباعة الباركود بتطبع على طابعة الباركود على طول من غير نافذة حفظ، وزرار «تنزيل الملصقات PDF» للطباعة من جهاز تاني'];
