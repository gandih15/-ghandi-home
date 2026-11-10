/* Ghandi Home — curtain & carpet work orders (measure → tailor → install), delivery & installation agenda,
   warranty lookup, customer statement A4, dashboard alerts
   Eng. Mohamed Ali — 01098811581 */
'use strict';
var ORD_ST = [['measure', '📐', 'معاينة ومقاسات', 'Measuring'], ['confirmed', '✍️', 'اتعمد — في انتظار التفصيل', 'Confirmed'], ['cutting', '✂️', 'في الورشة (تفصيل)', 'In the workshop'], ['ready', '📦', 'جاهز للتركيب', 'Ready'], ['installed', '🔧', 'اتركب', 'Installed'], ['done', '✅', 'اتسلّم واتقفل', 'Closed'], ['cancelled', '⛔', 'ملغي', 'Cancelled']];
var Ord = {
  st: function (k) { return ORD_ST.filter(function (s) { return s[0] === k; })[0] || ORD_ST[0]; },
  stChip: function (k) { var s = Ord.st(k); return H.chip(s[1] + ' ' + L(s[2], s[3]), { ready: 'warn', installed: 'ok', done: 'ok', cancelled: 'bad' }[k] || ''); },
  room: function (r) { // recompute one room
    var h = homeCfg();
    if (r.type === 'curtain') {
      r.panels = Math.max(1, Math.round(U.n(r.panels) || 1)); r.fullness = U.n(r.fullness) || h.fullness;
      r.autoM = U.r2(U.n(r.w) * r.fullness + U.n(h.hem) * r.panels);
      r.fabricM = r.fixM ? U.n(r.fabricM) : r.autoM;
      r.liningM = r.liningPrice || r.liningName ? r.fabricM : 0;
      r.railM = r.railPrice || r.railName ? (r.fixRail ? U.n(r.railM) : U.r2(U.n(r.w) + 0.2)) : 0;
      r.tailor = U.n(r.tailorM != null ? r.tailorM : h.tailorM);
      r.total = U.r2(r.fabricM * U.n(r.fabricPrice) + r.liningM * U.n(r.liningPrice) + r.railM * U.n(r.railPrice) + r.fabricM * r.tailor);
    } else {
      r.area = U.r2(U.n(r.l) * U.n(r.w) * (1 + U.n(r.waste) / 100));
      r.edgeM = r.edgePrice ? U.r2(2 * (U.n(r.l) + U.n(r.w))) : 0;
      r.total = U.r2(r.area * U.n(r.fabricPrice) + r.edgeM * U.n(r.edgePrice));
    }
    return r;
  },
  total: function (o) { o.rooms.forEach(Ord.room); return U.r2(H.sum(o.rooms, function (r) { return r.total; }) + H.sum(o.extras, function (x) { return x.qty * x.price; }) + U.n(o.installFee) + U.n(o.deliveryFee) - U.n(o.discount)); },
  rest: function (o) { return U.r2(Ord.total(o) - H.paid(o)); },
  lines: function (o) { // invoice lines
    var out = [], L2 = function (n, a) { return n + (a ? ' — ' + a : ''); };
    o.rooms.forEach(function (r) {
      Ord.room(r);
      if (r.type === 'curtain') {
        if (r.fabricM && (r.fabricPrice || r.fabricPid)) out.push({ pid: r.fabricPid || null, name: L2(r.fabricName || L('قماش ستائر', 'Curtain fabric'), r.name), qty: r.fabricM, price: U.n(r.fabricPrice), cost: U.n((Store.product(r.fabricPid) || {}).cost) });
        if (r.liningM && r.liningPrice) out.push({ pid: r.liningPid || null, name: L2(r.liningName || L('بطانة', 'Lining'), r.name), qty: r.liningM, price: U.n(r.liningPrice), cost: U.n((Store.product(r.liningPid) || {}).cost) });
        if (r.railM && r.railPrice) out.push({ pid: r.railPid || null, name: L2(r.railName || L('مجرى ستارة', 'Curtain rail'), r.name), qty: r.railM, price: U.n(r.railPrice), cost: U.n((Store.product(r.railPid) || {}).cost) });
        if (r.tailor && r.fabricM) out.push({ pid: null, name: L2(L('مصنعية تفصيل', 'Tailoring'), r.name), qty: r.fabricM, price: r.tailor, cost: 0 });
      } else {
        if (r.area) out.push({ pid: r.fabricPid || null, name: L2(r.fabricName || L('سجاد / موكيت', 'Carpet'), r.name + ' ' + U.r2(r.l) + '×' + U.r2(r.w)), qty: r.area, price: U.n(r.fabricPrice), cost: U.n((Store.product(r.fabricPid) || {}).cost) });
        if (r.edgeM) out.push({ pid: null, name: L2(L('تحفيف / شرشبة', 'Edge binding'), r.name), qty: r.edgeM, price: U.n(r.edgePrice), cost: 0 });
      }
    });
    o.extras.forEach(function (x) { if (x.qty && x.price) out.push({ pid: x.pid || null, name: x.name, qty: x.qty, price: x.price, cost: U.n((Store.product(x.pid) || {}).cost) }); });
    if (U.n(o.installFee)) out.push({ pid: null, name: L('تركيب', 'Installation'), qty: 1, price: U.n(o.installFee), cost: 0 });
    if (U.n(o.deliveryFee)) out.push({ pid: null, name: L('توصيل', 'Delivery'), qty: 1, price: U.n(o.deliveryFee), cost: 0 });
    return out.map(function (x) { x.qty = U.r2(x.qty); return x; });
  },
  edit: function (o, after) {
    var isNew = !o, h = homeCfg();
    o = o ? U.clone(o) : { customer: '', address: '', rooms: [], extras: [], installFee: h.installFee, deliveryFee: h.deliveryFee, discount: 0, tech: h.staff[0] || '', appt: '', apptTime: '', note: '', status: 'measure' };
    if (!o.rooms.length) o.rooms.push({ type: 'curtain', name: L('الصالون', 'Living room'), w: '', h: '', panels: 2, fullness: h.fullness });
    var m = Modal.open({ size: 'xl', sticky: true, title: '🪟 ' + (isNew ? L('أمر شغل جديد — ستائر / سجاد', 'New curtain / carpet order') : L('أمر شغل #', 'Order #') + o.no), body: '<div class="grid" style="grid-template-columns:1.6fr 1fr;gap:16px"><div class="col"><div class="card" style="padding:10px"><div id="oC"></div><div class="grid g3" style="margin-top:6px"><label class="f">' + L('العنوان (للمعاينة والتركيب)', 'Address') + '<input class="in" id="oA" value="' + U.esc(o.address) + '"></label><label class="f">' + L('ميعاد المعاينة / التركيب', 'Appointment') + '<div class="row"><input class="in" type="date" id="oAp" value="' + U.esc(o.appt) + '"><input class="in" type="time" id="oAt" value="' + U.esc(o.apptTime) + '" style="width:120px"></div></label><label class="f">' + L('الفني', 'Technician') + '<input class="in" id="oT" list="oTl" value="' + U.esc(o.tech) + '"><datalist id="oTl">' + h.staff.map(function (s) { return '<option value="' + U.esc(s) + '">'; }).join('') + '</datalist></label></div></div>' +
      '<div class="row"><b class="grow">📐 ' + L('الأماكن والمقاسات', 'Rooms & sizes') + '</b><button class="btn sm" id="oAddC">➕ 🪟 ' + L('شباك ستارة', 'Curtain window') + '</button><button class="btn sm" id="oAddR">➕ 🧶 ' + L('سجاد / موكيت', 'Carpet / wall-to-wall') + '</button></div><div id="oR" class="col" style="gap:10px"></div>' +
      '<div class="card" style="padding:10px"><div class="row"><b class="grow">🧩 ' + L('إضافات (إكسسوارات، كلبسات، رول…)', 'Extras') + '</b><input class="in" id="oXp" style="width:240px" placeholder="➕ ' + L('صنف من المعرض', 'Product') + '"><button class="btn sm" id="oXm">✍️ ' + L('يدوي', 'Manual') + '</button></div><div id="oX"></div></div></div>' +
      '<div class="col"><div class="card kpi hero"><div class="l">' + L('إجمالي الأمر', 'Order total') + '</div><div class="v num" id="oTot">0</div><div class="small" id="oSub"></div></div><div class="grid g2"><label class="f">' + L('رسوم التركيب', 'Installation') + '<input class="in num" type="number" id="oIf" value="' + U.n(o.installFee) + '"></label><label class="f">' + L('رسوم التوصيل', 'Delivery') + '<input class="in num" type="number" id="oDf" value="' + U.n(o.deliveryFee) + '"></label><label class="f">' + L('خصم', 'Discount') + '<input class="in num" type="number" id="oDs" value="' + U.n(o.discount) + '"' + (can('pos.discount') ? '' : ' disabled') + '></label><label class="f">' + L('الحالة', 'Status') + '<select class="in" id="oSt">' + ORD_ST.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === o.status ? ' selected' : '') + '>' + s[1] + ' ' + L(s[2], s[3]) + '</option>'; }).join('') + '</select></label></div><label class="f">' + L('ملاحظات للورشة', 'Workshop notes') + '<textarea class="in" id="oN" rows="3">' + U.esc(o.note) + '</textarea></label>' + (isNew ? '<label class="f">' + L('عربون دلوقتي', 'Deposit now') + '<div class="row"><input class="in num grow" type="number" id="oDep" placeholder="0">' + H.pmSelect('oDepM', 'cash') + '</div></label>' : '') + '<div class="muted small">' + L('الكميات بتتحسب لوحدها: القماش = العرض × معامل الكشكشة + الحواشي، والمجرى = العرض + 20 سم. تقدر تعدّل يدوي.', 'Fabric = width × fullness + hems; rail = width + 20 cm. You can override.') + '</div></div></div>',
      foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri lg" id="oGo">💾 ' + L('حفظ الأمر', 'Save order') + '</button>' });
    var cb = H.custBox($('#oC', m), o.customer, 'order');
    $('[data-cph]', m).addEventListener('input', function () { var c = Cust.byPhone(this.value); if (c && c.address && !$('#oA', m).value) $('#oA', m).value = c.address; });
    var pickInto = function (input, r, pre) { H.prodPick(input, function (p) { r[pre + 'Pid'] = p.id; r[pre + 'Name'] = pname(p) + (p.shade ? ' ' + p.shade : ''); r[pre + 'Price'] = (Views.pos.price || Promo.price)(p, 0).price; draw(); }); };
    var draw = function () {
      $('#oR', m).innerHTML = o.rooms.map(function (r, i) {
        Ord.room(r); var cur2 = function (k) { return U.esc(r[k] == null ? '' : r[k]); };
        if (r.type === 'curtain') return '<div class="card" style="padding:10px"><div class="row"><span style="font-size:20px">🪟</span><input class="in" data-r="' + i + '" data-k="name" value="' + cur2('name') + '" style="width:170px"><div class="grow"></div><b class="num">' + U.money(r.total) + '</b><button class="btn sm ghost" data-rd="' + i + '" style="color:var(--bad)">✕</button></div>' +
          '<div class="grid g4" style="margin-top:6px"><label class="f">' + L('عرض الشباك (م)', 'Width (m)') + '<input class="in num" type="number" step="0.01" data-r="' + i + '" data-k="w" value="' + cur2('w') + '"></label><label class="f">' + L('الارتفاع (م)', 'Height (m)') + '<input class="in num" type="number" step="0.01" data-r="' + i + '" data-k="h" value="' + cur2('h') + '"></label><label class="f">' + L('عدد الضلف', 'Panels') + '<input class="in num" type="number" data-r="' + i + '" data-k="panels" value="' + cur2('panels') + '"></label><label class="f">' + L('الكشكشة', 'Fullness') + '<input class="in num" type="number" step="0.1" data-r="' + i + '" data-k="fullness" value="' + cur2('fullness') + '"></label></div>' +
          '<div class="grid g3" style="margin-top:6px"><label class="f">🧵 ' + L('القماش', 'Fabric') + '<input class="in" data-pick="fabric" data-r="' + i + '" placeholder="' + U.esc(r.fabricName || L('اختار من المعرض…', 'Pick…')) + '"><span class="small"><input class="in num" style="width:46%" type="number" data-r="' + i + '" data-k="fabricPrice" value="' + cur2('fabricPrice') + '" placeholder="' + L('سعر المتر', 'Price/m') + '"> <input class="in num" style="width:46%" type="number" step="0.01" data-r="' + i + '" data-k="fabricM" data-fix="fixM" value="' + r.fabricM + '" title="' + L('متر', 'm') + '"></span></label>' +
          '<label class="f">🌫️ ' + L('بطانة / شيفون (اختياري)', 'Lining (optional)') + '<input class="in" data-pick="lining" data-r="' + i + '" placeholder="' + U.esc(r.liningName || L('اختار…', 'Pick…')) + '"><input class="in num" type="number" data-r="' + i + '" data-k="liningPrice" value="' + cur2('liningPrice') + '" placeholder="' + L('سعر المتر', 'Price/m') + '"></label>' +
          '<label class="f">📏 ' + L('المجرى (اختياري)', 'Rail (optional)') + '<input class="in" data-pick="rail" data-r="' + i + '" placeholder="' + U.esc(r.railName || L('اختار…', 'Pick…')) + '"><span class="small"><input class="in num" style="width:46%" type="number" data-r="' + i + '" data-k="railPrice" value="' + cur2('railPrice') + '" placeholder="' + L('سعر المتر', 'Price/m') + '"> <input class="in num" style="width:46%" type="number" step="0.01" data-r="' + i + '" data-k="railM" data-fix="fixRail" value="' + r.railM + '"></span></label></div>' +
          '<div class="muted small" style="margin-top:4px">' + L('قماش ', 'Fabric ') + '<b>' + r.fabricM + L(' م', ' m') + '</b>' + (r.fixM ? ' ✍️' : '') + ' · ' + L('مصنعية ', 'Tailoring ') + '<input class="in num" style="width:80px;display:inline-block;padding:2px 6px" type="number" data-r="' + i + '" data-k="tailorM" value="' + r.tailor + '">' + L('/متر', '/m') + (r.liningM ? ' · ' + L('بطانة ', 'Lining ') + r.liningM + L(' م', ' m') : '') + (r.railM ? ' · ' + L('مجرى ', 'Rail ') + r.railM + L(' م', ' m') : '') + '</div></div>';
        return '<div class="card" style="padding:10px"><div class="row"><span style="font-size:20px">🧶</span><input class="in" data-r="' + i + '" data-k="name" value="' + cur2('name') + '" style="width:170px"><div class="grow"></div><b class="num">' + U.money(r.total) + '</b><button class="btn sm ghost" data-rd="' + i + '" style="color:var(--bad)">✕</button></div>' +
          '<div class="grid g4" style="margin-top:6px"><label class="f">' + L('الطول (م)', 'Length (m)') + '<input class="in num" type="number" step="0.01" data-r="' + i + '" data-k="l" value="' + cur2('l') + '"></label><label class="f">' + L('العرض (م)', 'Width (m)') + '<input class="in num" type="number" step="0.01" data-r="' + i + '" data-k="w" value="' + cur2('w') + '"></label><label class="f">' + L('هالك %', 'Waste %') + '<input class="in num" type="number" data-r="' + i + '" data-k="waste" value="' + cur2('waste') + '"></label><label class="f">' + L('تحفيف / متر (اختياري)', 'Binding / m') + '<input class="in num" type="number" data-r="' + i + '" data-k="edgePrice" value="' + cur2('edgePrice') + '"></label></div>' +
          '<div class="grid g2" style="margin-top:6px"><label class="f">🧶 ' + L('نوع السجاد / الموكيت', 'Carpet') + '<input class="in" data-pick="fabric" data-r="' + i + '" placeholder="' + U.esc(r.fabricName || L('اختار من المعرض…', 'Pick…')) + '"></label><label class="f">' + L('سعر المتر المربع', 'Price / m²') + '<input class="in num" type="number" data-r="' + i + '" data-k="fabricPrice" value="' + cur2('fabricPrice') + '"></label></div><div class="muted small">' + L('المساحة ', 'Area ') + '<b>' + r.area + L(' م²', ' m²') + '</b>' + (r.edgeM ? ' · ' + L('تحفيف ', 'binding ') + r.edgeM + L(' م', ' m') : '') + '</div></div>';
      }).join('');
      $('#oX', m).innerHTML = o.extras.length ? o.extras.map(function (x, i) { return '<div class="row" style="margin-top:6px"><span class="grow small"><b>' + U.esc(x.name) + '</b></span><input class="in num" style="width:80px" type="number" step="0.01" data-xq="' + i + '" value="' + x.qty + '"><input class="in num" style="width:100px" type="number" data-xp="' + i + '" value="' + x.price + '"><b class="num" style="width:90px">' + U.money(x.qty * x.price) + '</b><button class="btn sm ghost" data-xd="' + i + '">✕</button></div>'; }).join('') : '<div class="muted small" style="margin-top:6px">—</div>';
      $$('[data-r][data-k]', m).forEach(function (inp) { inp.onchange = function () { var r = o.rooms[+inp.dataset.r], k = inp.dataset.k; r[k] = inp.type === 'number' ? U.n(inp.value) : inp.value; if (inp.dataset.fix) r[inp.dataset.fix] = true; setTimeout(draw); }; });
      $$('[data-pick]', m).forEach(function (inp) { pickInto(inp, o.rooms[+inp.dataset.r], inp.dataset.pick); });
      $$('[data-rd]', m).forEach(function (b) { b.onclick = function () { o.rooms.splice(+b.dataset.rd, 1); draw(); }; });
      $$('[data-xq]', m).forEach(function (i) { i.onchange = function () { o.extras[+i.dataset.xq].qty = U.n(i.value); setTimeout(draw); }; });
      $$('[data-xp]', m).forEach(function (i) { i.onchange = function () { o.extras[+i.dataset.xp].price = U.n(i.value); setTimeout(draw); }; });
      $$('[data-xd]', m).forEach(function (b) { b.onclick = function () { o.extras.splice(+b.dataset.xd, 1); draw(); }; });
      tot();
    };
    var tot = function () { o.installFee = U.n($('#oIf', m).value); o.deliveryFee = U.n($('#oDf', m).value); o.discount = U.n($('#oDs', m).value); $('#oTot', m).textContent = U.money(Ord.total(o)); $('#oSub', m).textContent = o.rooms.length + L(' مكان', ' rooms') + (H.paid(o) ? ' · ' + L('مدفوع ', 'paid ') + U.money(H.paid(o)) : ''); };
    $$('#oIf,#oDf,#oDs', m).forEach(function (i) { i.oninput = tot; });
    $('#oAddC', m).onclick = function () { o.rooms.push({ type: 'curtain', name: L('غرفة ', 'Room ') + (o.rooms.length + 1), w: '', h: '', panels: 2, fullness: h.fullness }); draw(); };
    $('#oAddR', m).onclick = function () { o.rooms.push({ type: 'carpet', name: L('غرفة ', 'Room ') + (o.rooms.length + 1), l: '', w: '', waste: 5 }); draw(); };
    H.prodPick($('#oXp', m), function (p) { o.extras.push({ pid: p.id, name: pname(p), qty: 1, price: (Views.pos.price || Promo.price)(p, 0).price }); draw(); });
    $('#oXm', m).onclick = function () { Modal.prompt(L('بند إضافي', 'Extra line'), L('البيان', 'Description'), '', function (v) { if (v) { o.extras.push({ name: v, qty: 1, price: 0 }); draw(); } }); };
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#oGo', m).onclick = function () {
      var cu = cb.get(); if (!cu) return;
      if (!o.rooms.length && !o.extras.length) return toast(L('ضيف مكان واحد على الأقل', 'Add at least one room'), 'bad');
      o.customer = cu.id; o.address = $('#oA', m).value.trim(); o.appt = $('#oAp', m).value; o.apptTime = $('#oAt', m).value; o.tech = $('#oT', m).value.trim(); o.status = $('#oSt', m).value; o.note = $('#oN', m).value; o.total = Ord.total(o);
      if (o.address && !cu.address) cu.address = o.address;
      var db = Store.db, target;
      if (isNew) { db.seq.order++; o.id = U.id(); o.no = db.seq.order; o.date = Date.now(); o.by = App.user.name; o.pays = []; o.log = [{ t: Date.now(), s: o.status, u: App.user.name }]; var dep = U.n($('#oDep', m).value); if (dep > 0) { if (shiftsOn() && !App.shift) return toast(L('افتح وردية أولاً عشان العربون', 'Open a shift first for the deposit'), 'bad'); H.pay(o.pays, dep, $('#oDepM', m).value); } db.orders.push(o); target = o; Store.log('order.new', 'O#' + o.no); }
      else { target = db.orders.filter(function (x) { return x.id === o.id; })[0]; if (target.status !== o.status) (o.log = o.log || []).push({ t: Date.now(), s: o.status, u: App.user.name }); Object.keys(o).forEach(function (k) { target[k] = o[k]; }); Store.log('order.edit', 'O#' + o.no); }
      Store.save(); Modal.close(m); toast('🪟 ' + L('اتحفظ أمر الشغل #', 'Order saved #') + target.no, 'ok'); if (after) after(target);
    };
    draw();
  },
  setStatus: function (o, s) { o.status = s; (o.log = o.log || []).push({ t: Date.now(), s: s, u: App.user.name }); Store.log('order.status', 'O#' + o.no + ' ' + s); Store.save(); },
  invoice: function (o, after) {
    if (o.saleNo) return toast(L('الأمر ده اتعمله فاتورة #', 'Already invoiced #') + o.saleNo, 'bad');
    if (shiftsOn() && !App.shift) return toast(L('افتح وردية أولاً', 'Open a shift first'), 'bad');
    var lines = Ord.lines(o); if (!lines.length) return toast(L('الأمر فاضي', 'Empty order'), 'bad');
    var sub = U.r2(H.sum(lines, function (x) { return x.qty * x.price; })), disc = U.r2(Math.min(sub, U.n(o.discount))), total = U.r2(sub - disc), dep = Math.min(H.paid(o), total), due = U.r2(total - dep);
    var finish = function (pays, credit) {
      if (dep) pays.order = U.r2(dep);
      var s = Sales.create({ type: 'sale', items: lines, customer: o.customer, subtotal: sub, discount: disc, vat: 0, total: total, payments: pays, paid: U.r2(total - credit), change: 0, credit: credit });
      s.orderNo = o.no; o.saleNo = s.no; Ord.setStatus(o, 'done'); Store.save();
      toast('✅ ' + L('اتعمل فاتورة #', 'Invoice #') + s.no, 'ok'); if (F('a4')) A4.printSale(s); if (after) after();
    };
    if (due <= 0.009) return Modal.confirm(L('عمل فاتورة بإجمالي ', 'Invoice total ') + U.money(total) + L(' — مدفوعة بالكامل من العربون؟', ' — fully covered by the deposit?'), function () { finish({}, 0); });
    H.collect('🧾 ' + L('تقفيل أمر الشغل #', 'Close order #') + o.no, due, function (r) { var v = Math.min(r.v, due), credit = U.r2(due - v); if (credit > 0.009 && !can('pos.credit')) { toast(L('ليس لديك صلاحية البيع الآجل', 'No credit permission'), 'bad'); return false; } var pays = {}; if (v) pays[r.m] = v; finish(pays, credit); }, { label: L('الباقي بعد العربون', 'Due after deposit'), sub: L('الإجمالي ', 'Total ') + U.money(total) + ' − ' + L('عربون ', 'deposit ') + U.money(dep), restNote: L('هيتسجل آجل على العميل', 'goes on account'), btn: L('تحصيل وعمل الفاتورة', 'Collect & invoice') });
  },
  print: function (o, workshop) {
    var cu = H.cust(o.customer) || {}; Ord.total(o);
    var rows = o.rooms.map(function (r, i) { return r.type === 'curtain'
      ? [i + 1, '🪟 ' + U.esc(r.name), U.r2(r.w) + ' × ' + U.r2(r.h) + L(' م', ' m'), r.panels + L(' ضلفة · كشكشة ', ' panels · fullness ') + r.fullness, U.esc(r.fabricName || '—') + ' <b>' + r.fabricM + L(' م', ' m') + '</b>' + (r.liningM ? '<br>' + L('بطانة: ', 'Lining: ') + U.esc(r.liningName || '') + ' ' + r.liningM + L(' م', ' m') : '') + (r.railM ? '<br>' + L('مجرى: ', 'Rail: ') + U.esc(r.railName || '') + ' ' + r.railM + L(' م', ' m') : '')].concat(workshop ? [] : [U.money(r.total)])
      : [i + 1, '🧶 ' + U.esc(r.name), U.r2(r.l) + ' × ' + U.r2(r.w) + L(' م', ' m'), L('هالك ', 'waste ') + U.n(r.waste) + '%', U.esc(r.fabricName || '—') + ' <b>' + r.area + L(' م²', ' m²') + '</b>' + (r.edgeM ? '<br>' + L('تحفيف ', 'binding ') + r.edgeM + L(' م', ' m') : '')].concat(workshop ? [] : [U.money(r.total)]); });
    var tr = [[L('الأماكن', 'Rooms'), U.money(H.sum(o.rooms, function (r) { return r.total; }))]];
    if (o.extras.length) tr.push([L('إضافات', 'Extras'), U.money(H.sum(o.extras, function (x) { return x.qty * x.price; }))]);
    if (U.n(o.installFee)) tr.push([L('التركيب', 'Installation'), U.money(o.installFee)]); if (U.n(o.deliveryFee)) tr.push([L('التوصيل', 'Delivery'), U.money(o.deliveryFee)]); if (U.n(o.discount)) tr.push([L('خصم', 'Discount'), '- ' + U.money(o.discount)]);
    tr.push([L('الإجمالي', 'Total'), U.money(Ord.total(o)) + ' ' + cur(), 1], [L('العربون المدفوع', 'Deposit paid'), U.money(H.paid(o))], [L('الباقي', 'Remaining'), U.money(Ord.rest(o))]);
    A4.print(A4.head(workshop ? L('أمر تشغيل للورشة', 'Workshop order') : L('أمر شغل ستائر وسجاد', 'Curtain & carpet order'), [[L('رقم الأمر', 'Order'), '<b>' + o.no + '</b>'], [L('التاريخ', 'Date'), U.dt(o.date)], [L('العميل', 'Customer'), U.esc(cu.name || '')], [L('الموبايل', 'Mobile'), '<span dir="ltr">' + U.esc(cu.phone || '') + '</span>'], [L('العنوان', 'Address'), U.esc(o.address || '—')], [L('ميعاد التركيب', 'Appointment'), (o.appt || '—') + ' ' + (o.apptTime || '')], [L('الفني', 'Technician'), U.esc(o.tech || '—')], [L('الحالة', 'Status'), L(Ord.st(o.status)[2], Ord.st(o.status)[3])]]) +
      A4.table([L('م', '#'), L('المكان', 'Room'), L('المقاس', 'Size'), L('التفاصيل', 'Details'), L('الخامات والكميات', 'Materials')].concat(workshop ? [] : [L('القيمة', 'Amount')]), rows) +
      (o.extras.length ? '<h3 class="s">🧩 ' + L('إضافات', 'Extras') + '</h3>' + A4.table([L('م', '#'), L('البيان', 'Item'), L('الكمية', 'Qty')].concat(workshop ? [] : [L('السعر', 'Price'), L('الإجمالي', 'Total')]), o.extras.map(function (x, i) { return [i + 1, U.esc(x.name), x.qty].concat(workshop ? [] : [U.money(x.price), U.money(x.qty * x.price)]); })) : '') +
      (workshop ? '' : A4.totals(tr, Ord.total(o))) + (o.note ? '<div class="terms"><b>' + L('ملاحظات', 'Notes') + '</b>\n' + U.esc(o.note) + '</div>' : '') +
      (workshop ? '' : '<div class="terms">' + L('الستائر والسجاد المفصّلة حسب الطلب لا ترد ولا تستبدل بعد التفصيل. المقاسات النهائية حسب المعاينة.', 'Made-to-measure items cannot be returned once cut. Final sizes follow the site survey.') + '</div>') +
      A4.sign(workshop ? [L('مسئول الورشة', 'Workshop'), L('الفني', 'Technician')] : [L('العميل', 'Customer'), L('المسئول', 'Sales rep')]) + A4.foot());
  }
};
Views.orders = {
  tab: 'active', q: '',
  render: function (el) {
    var V = Views.orders, all = Store.db.orders || [], act = all.filter(function (o) { return ['done', 'cancelled'].indexOf(o.status) < 0; });
    var cnt = function (s) { return act.filter(function (o) { return o.status === s; }).length; };
    el.innerHTML = '<div class="grid g4" style="margin-bottom:14px">' + [['measure', '📐'], ['cutting', '✂️'], ['ready', '📦'], ['installed', '🔧']].map(function (k, i) { var s = Ord.st(k[0]); return '<div class="card kpi' + (i === 2 ? ' hero' : '') + '"><div class="l">' + k[1] + ' ' + L(s[2], s[3]) + '</div><div class="v num">' + cnt(k[0]) + (k[0] === 'cutting' ? ' <small class="muted">+' + cnt('confirmed') + '</small>' : '') + '</div></div>'; }).join('') + '</div>' +
      '<div class="row wrap" style="margin-bottom:12px">' + H.tabs('orT', [['active', '🔧 ' + L('الشغّالة', 'Active') + ' (' + act.length + ')'], ['done', '✅ ' + L('المقفولة', 'Closed')], ['all', '🗂️ ' + L('الكل', 'All')]], V.tab) + '<div class="grow"></div><input class="in" id="orQ" style="width:230px" placeholder="🔎 ' + L('رقم / اسم / موبايل', 'No. / name / mobile') + '" value="' + U.esc(V.q) + '"><button class="btn pri" id="orNew">➕ ' + L('أمر شغل جديد', 'New order') + '</button></div><div id="orB" class="tbl-wrap"></div>';
    H.bindTabs('orT', function (t) { V.tab = t; V.render(el); });
    $('#orNew').onclick = function () { Ord.edit(null, function (o) { V.render(el); V.open(o); }); };
    var draw = function () {
      var q = U.norm(V.q), rows = all.filter(function (o) { return V.tab === 'all' || (V.tab === 'done' ? ['done', 'cancelled'].indexOf(o.status) >= 0 : ['done', 'cancelled'].indexOf(o.status) < 0); }).filter(function (o) { var cu = H.cust(o.customer) || {}; return !q || String(o.no) === V.q.trim() || U.norm(cu.name).indexOf(q) >= 0 || Phone.norm(cu.phone).indexOf(Phone.norm(V.q) || '#') >= 0; }).slice().reverse();
      $('#orB').innerHTML = rows.length ? '<table class="t"><tr><th>#</th><th>' + L('العميل', 'Customer') + '</th><th>' + L('الأماكن', 'Rooms') + '</th><th>' + L('الميعاد', 'Appointment') + '</th><th>' + L('الفني', 'Tech') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>' + L('الباقي', 'Left') + '</th><th>' + L('الحالة', 'Status') + '</th></tr>' + rows.map(function (o) { var cu = H.cust(o.customer) || {}, d = H.daysTo(o.appt); return '<tr data-o="' + o.id + '" style="cursor:pointer"><td class="num"><b>' + o.no + '</b></td><td><b>' + U.esc(cu.name || '') + '</b><div class="muted small num">' + U.esc(cu.phone || '') + '</div></td><td>' + o.rooms.map(function (r) { return (r.type === 'curtain' ? '🪟' : '🧶') + U.esc(r.name); }).join(' ') + '</td><td class="num">' + (o.appt ? o.appt + ' ' + (o.apptTime || '') + (d === 0 ? ' ' + H.chip(L('النهارده', 'today'), 'warn') : d === 1 ? ' ' + H.chip(L('بكرة', 'tomorrow')) : '') : '—') + '</td><td>' + U.esc(o.tech || '') + '</td><td class="num">' + U.money(Ord.total(o)) + '</td><td class="num">' + (o.saleNo ? H.chip('#' + o.saleNo, 'ok') : U.money(Ord.rest(o))) + '</td><td>' + Ord.stChip(o.status) + '</td></tr>'; }).join('') + '</table>' : '<div class="empty">' + L('مفيش أوامر شغل', 'No orders') + '</div>';
      $$('[data-o]').forEach(function (r) { r.onclick = function () { V.open(all.filter(function (o) { return o.id === r.dataset.o; })[0]); }; });
    };
    $('#orQ').oninput = function () { V.q = this.value; draw(); }; draw();
  },
  open: function (o) {
    var cu = H.cust(o.customer) || {}, idx = ORD_ST.map(function (s) { return s[0]; }).indexOf(o.status), nx = idx >= 0 && idx < 4 ? ORD_ST[idx + 1] : null;
    var m = Modal.open({ size: 'wide', title: '🪟 ' + L('أمر شغل #', 'Order #') + o.no + ' — ' + U.esc(cu.name || ''), body: '<div class="grid g3" style="margin-bottom:10px"><div class="card kpi hero"><div class="l">' + L('الإجمالي', 'Total') + '</div><div class="v num">' + U.money(Ord.total(o)) + '</div></div><div class="card kpi"><div class="l">' + L('العربون المدفوع', 'Deposit') + '</div><div class="v num" style="color:var(--ok)">' + U.money(H.paid(o)) + '</div></div><div class="card kpi"><div class="l">' + L('الباقي', 'Remaining') + '</div><div class="v num">' + (o.saleNo ? '✅ #' + o.saleNo : U.money(Ord.rest(o))) + '</div></div></div>' +
      '<div class="row wrap" style="gap:6px;margin-bottom:10px">' + ORD_ST.slice(0, 6).map(function (s, i) { return '<span class="chip ' + (i <= idx ? 'ok' : '') + '">' + s[1] + ' ' + L(s[2], s[3]) + '</span>'; }).join('<span class="muted">←</span>') + '</div>' +
      '<div class="card" style="padding:10px;line-height:1.9">📱 <span class="num">' + U.esc(cu.phone || '') + '</span> · 📍 ' + U.esc(o.address || '—') + '<br>🗓️ ' + (o.appt || '—') + ' ' + (o.apptTime || '') + ' · 👷 ' + U.esc(o.tech || '—') + '</div>' +
      o.rooms.map(function (r) { Ord.room(r); return '<div class="list-row"><span style="font-size:18px">' + (r.type === 'curtain' ? '🪟' : '🧶') + '</span><div class="grow"><b>' + U.esc(r.name) + '</b> — ' + (r.type === 'curtain' ? U.r2(r.w) + '×' + U.r2(r.h) + L(' م · قماش ', ' m · fabric ') + r.fabricM + L(' م', ' m') + (r.fabricName ? ' (' + U.esc(r.fabricName) + ')' : '') : U.r2(r.l) + '×' + U.r2(r.w) + ' = ' + r.area + L(' م²', ' m²') + (r.fabricName ? ' (' + U.esc(r.fabricName) + ')' : '')) + '</div><b class="num">' + U.money(r.total) + '</b></div>'; }).join('') +
      (o.pays.length ? '<div style="margin-top:8px"><b>💵 ' + L('المدفوعات', 'Payments') + '</b>' + o.pays.map(function (p) { return '<div class="list-row"><b class="num">' + U.money(p.v) + '</b> · ' + pmName(p.m) + ' · <span class="muted small">' + U.dt(p.t) + ' · ' + U.esc(p.by) + '</span></div>'; }).join('') + '</div>' : '') +
      ((o.log || []).length ? '<div class="muted small" style="margin-top:8px">' + o.log.map(function (x) { return U.dt(x.t) + ' ' + Ord.st(x.s)[1] + ' ' + U.esc(x.u); }).join(' · ') + '</div>' : ''),
      foot: (o.saleNo || o.status === 'cancelled' ? '' : '<button class="btn" id="ooEd">✏️ ' + L('تعديل', 'Edit') + '</button>' + (nx ? '<button class="btn gold" id="ooNx">' + nx[1] + ' ' + L('نقل لـ«', 'Move to «') + L(nx[2], nx[3]) + '»</button>' : '') + '<button class="btn" id="ooDep">💵 ' + L('عربون / دفعة', 'Deposit') + '</button><button class="btn pri" id="ooInv">🧾 ' + L('تسليم وفاتورة', 'Deliver & invoice') + '</button>') +
        '<button class="btn" id="ooW">🛠️ ' + L('أمر الورشة', 'Workshop sheet') + '</button><button class="btn" id="ooP">📄 A4</button>' + (cu.phone ? '<button class="btn" id="ooWa">📲</button>' : '') + (!o.saleNo && o.status !== 'cancelled' ? '<button class="btn" id="ooX" style="color:var(--bad)">⛔</button>' : '') });
    var re = function () { Modal.close(m); if (App.view === 'orders') Views.orders.render($('#view')); };
    if ($('#ooEd', m)) $('#ooEd', m).onclick = function () { Modal.close(m); Ord.edit(o, function (x) { if (App.view === 'orders') Views.orders.render($('#view')); Views.orders.open(x); }); };
    if ($('#ooNx', m)) $('#ooNx', m).onclick = function () { Ord.setStatus(o, nx[0]); re(); Views.orders.open(o); if (nx[0] === 'ready' && cu.phone) Modal.confirm(L('تبعت للعميل إن الطلب جاهز؟', 'Tell the customer it is ready?'), function () { H.wa(cu.phone, H.fill(L('أهلاً {name} 🌷\nطلبك رقم {no} من {shop} جاهز للتركيب ✅\nهنتواصل معاك لتأكيد الميعاد.', 'Hello {name}, your order #{no} from {shop} is ready for installation.'), { name: cu.name, no: o.no, shop: shopName() })); }); };
    if ($('#ooDep', m)) $('#ooDep', m).onclick = function () { if (shiftsOn() && !App.shift) return toast(L('افتح وردية أولاً', 'Open a shift first'), 'bad'); H.collect('💵 ' + L('دفعة — أمر #', 'Payment — order #') + o.no, Math.max(0, Ord.rest(o)), function (r) { if (!r.v) return false; H.pay(o.pays, r.v, r.m); Store.log('order.pay', 'O#' + o.no + ' ' + r.v); Store.save(); re(); Views.orders.open(o); }, { max: Math.max(0, Ord.rest(o)) }); };
    if ($('#ooInv', m)) $('#ooInv', m).onclick = function () { Ord.invoice(o, re); };
    $('#ooW', m).onclick = function () { Ord.print(o, true); }; $('#ooP', m).onclick = function () { Ord.print(o, false); };
    if ($('#ooWa', m)) $('#ooWa', m).onclick = function () { H.wa(cu.phone, H.fill(L('أهلاً {name} 🌷\nتفاصيل أمر الشغل رقم {no} من {shop}:\n{rooms}\nالإجمالي: {tot} {cur} · المدفوع: {paid} {cur}\nميعاد التركيب: {appt}', 'Order #{no} from {shop}: total {tot} {cur}, paid {paid}. Appointment: {appt}'), { name: cu.name, no: o.no, shop: shopName(), rooms: o.rooms.map(function (r) { return '• ' + r.name + ': ' + U.money(r.total); }).join('\n'), tot: U.money(Ord.total(o)), paid: U.money(H.paid(o)), cur: cur(), appt: (o.appt || '—') + ' ' + (o.apptTime || '') })); };
    if ($('#ooX', m)) $('#ooX', m).onclick = function () { Modal.confirm(L('إلغاء أمر الشغل؟', 'Cancel this order?') + (H.paid(o) ? '<br>⚠️ ' + L('العميل دافع عربون ', 'Deposit paid: ') + U.money(H.paid(o)) : ''), function () { Ord.setStatus(o, 'cancelled'); re(); }); };
  }
};

/* ================= delivery & installation agenda ================= */
var DLV_ST = [['scheduled', '🗓️', 'متحدد', 'Scheduled'], ['out', '🚚', 'خرج للعميل', 'Out'], ['done', '✅', 'اتسلّم', 'Done'], ['postponed', '⏸️', 'متأجل', 'Postponed'], ['cancelled', '⛔', 'ملغي', 'Cancelled']];
var Dlv = {
  st: function (k) { return DLV_ST.filter(function (s) { return s[0] === k; })[0] || DLV_ST[0]; },
  edit: function (d, o) {
    o = o || {}; var isNew = !d, h = homeCfg(), s = o.sale;
    d = d ? U.clone(d) : { customer: s ? s.customer : '', saleNo: s ? s.no : '', saleId: s ? s.id : '', items: s ? s.items.map(function (i) { return { name: i.name, qty: i.qty }; }) : [], when: U.today(Date.now() + 864e5), time: '', type: 'delivery', staff: h.staff[h.staff.length - 1] || '', fee: 0, cod: s ? U.n(s.credit) : 0, address: o.address || '', note: '', status: 'scheduled' };
    if (!d.address && d.customer) d.address = (H.cust(d.customer) || {}).address || '';
    var m = Modal.open({ size: 'wide', title: '🚚 ' + (isNew ? L('ميعاد توصيل / تركيب', 'Delivery / installation') : L('توصيل #', 'Delivery #') + d.no) + (d.saleNo ? ' — ' + L('فاتورة #', 'invoice #') + d.saleNo : ''), body: '<div class="col"><div id="dC"></div><div class="grid g4"><label class="f">' + L('النوع', 'Type') + '<select class="in" id="dTy">' + [['delivery', '🚚 توصيل', 'Delivery'], ['install', '🔧 تركيب', 'Installation'], ['both', '🚚🔧 توصيل وتركيب', 'Delivery + installation']].map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === d.type ? ' selected' : '') + '>' + L(x[1], x[2]) + '</option>'; }).join('') + '</select></label><label class="f">' + L('اليوم', 'Date') + '<input class="in" type="date" id="dW" value="' + U.esc(d.when) + '"></label><label class="f">' + L('الساعة', 'Time') + '<input class="in" type="time" id="dTm" value="' + U.esc(d.time) + '"></label><label class="f">' + L('السائق / الفني', 'Driver / tech') + '<input class="in" id="dS" list="dSl" value="' + U.esc(d.staff) + '"><datalist id="dSl">' + h.staff.map(function (x) { return '<option value="' + U.esc(x) + '">'; }).join('') + '</datalist></label></div>' +
      '<label class="f">' + L('العنوان بالتفصيل', 'Full address') + '<input class="in" id="dA" value="' + U.esc(d.address) + '"></label><div class="grid g3"><label class="f">' + L('مصاريف التوصيل', 'Delivery fee') + '<input class="in num" type="number" id="dF" value="' + U.n(d.fee) + '"></label><label class="f">' + L('مطلوب تحصيله عند التسليم', 'Collect on delivery') + '<input class="in num" type="number" id="dCod" value="' + U.n(d.cod) + '"></label><label class="f">' + L('ملاحظات', 'Notes') + '<input class="in" id="dN" value="' + U.esc(d.note) + '"></label></div>' +
      '<b>' + L('الأصناف', 'Items') + '</b><textarea class="in" id="dI" rows="4" placeholder="' + L('صنف في كل سطر', 'One item per line') + '">' + U.esc(d.items.map(function (i) { return i.name + (i.qty != null && i.qty !== 1 ? ' × ' + U.r2(i.qty) : ''); }).join('\n')) + '</textarea></div>',
      foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri" id="dGo">💾 ' + L('حفظ', 'Save') + '</button>' });
    var cb = H.custBox($('#dC', m), d.customer, 'delivery');
    $('[data-cph]', m).addEventListener('input', function () { var c = Cust.byPhone(this.value); if (c && c.address && !$('#dA', m).value) $('#dA', m).value = c.address; });
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#dGo', m).onclick = function () {
      var cu = cb.get(); if (!cu) return; if (!$('#dW', m).value) return toast(L('حدد اليوم', 'Pick a date'), 'bad');
      d.customer = cu.id; d.type = $('#dTy', m).value; d.when = $('#dW', m).value; d.time = $('#dTm', m).value; d.staff = $('#dS', m).value.trim(); d.address = $('#dA', m).value.trim(); d.fee = U.n($('#dF', m).value); d.cod = U.n($('#dCod', m).value); d.note = $('#dN', m).value;
      d.items = $('#dI', m).value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) { var mm = x.match(/^(.*?)\s*×\s*([\d.]+)$/); return mm ? { name: mm[1], qty: U.n(mm[2]) } : { name: x, qty: 1 }; });
      if (d.address && !cu.address) cu.address = d.address;
      var db = Store.db, t;
      if (isNew) { db.seq.delivery++; d.id = U.id(); d.no = db.seq.delivery; d.date = Date.now(); d.by = App.user.name; db.deliveries.push(d); t = d; Store.log('delivery.new', 'D#' + d.no); }
      else { t = db.deliveries.filter(function (x) { return x.id === d.id; })[0]; Object.keys(d).forEach(function (k) { t[k] = d[k]; }); }
      Store.save(); Modal.close(m); toast('🚚 ' + L('اتحدد الميعاد ', 'Scheduled ') + d.when, 'ok');
      if (cu.phone) Modal.confirm(L('تبعت للعميل تأكيد الميعاد على واتساب؟', 'Send the customer a WhatsApp confirmation?'), function () { H.wa(cu.phone, Dlv.waText(t)); });
      if (App.view === 'deliveries') Views.deliveries.render($('#view'));
    };
  },
  waText: function (d) { var cu = H.cust(d.customer) || {}; return H.fill(L('أهلاً {name} 🌷\nمعاك {shop}: ميعاد {type} يوم {when}{time} على العنوان: {addr}\n{cod}للاستفسار: {phone}', 'Hello {name}, {shop}: {type} on {when}{time} at {addr}. {cod}'), { name: cu.name || '', shop: shopName(), type: { delivery: L('التوصيل', 'delivery'), install: L('التركيب', 'installation'), both: L('التوصيل والتركيب', 'delivery & installation') }[d.type], when: d.when, time: d.time ? ' ' + L('الساعة ', 'at ') + d.time : '', addr: d.address || '—', cod: d.cod ? L('المطلوب عند الاستلام: ', 'Due on delivery: ') + U.money(d.cod) + ' ' + cur() + '\n' : '', phone: S().shopPhone || '' }); },
  print: function (d) {
    var cu = H.cust(d.customer) || {};
    A4.print(A4.head(L('إذن تسليم بضاعة', 'Delivery note'), [[L('رقم الإذن', 'No.'), '<b>' + d.no + '</b>'], [L('الفاتورة', 'Invoice'), d.saleNo || '—'], [L('العميل', 'Customer'), U.esc(cu.name || '')], [L('الموبايل', 'Mobile'), '<span dir="ltr">' + U.esc([cu.phone, cu.phone2].filter(Boolean).join(' / ')) + '</span>'], [L('العنوان', 'Address'), U.esc(d.address || '—')], [L('الميعاد', 'Date'), d.when + ' ' + (d.time || '')], [L('السائق / الفني', 'Driver / tech'), U.esc(d.staff || '—')], [L('النوع', 'Type'), { delivery: L('توصيل', 'Delivery'), install: L('تركيب', 'Installation'), both: L('توصيل وتركيب', 'Delivery + installation') }[d.type]]]) +
      A4.table([L('م', '#'), L('الصنف', 'Item'), L('الكمية', 'Qty'), L('ملاحظات الاستلام', 'Condition on receipt')], d.items.map(function (i, x) { return [x + 1, U.esc(i.name), U.r2(i.qty), '']; })) +
      (d.cod || d.fee ? '<div class="meta"><div><b>' + L('مطلوب تحصيله', 'Collect') + ':</b>' + U.money(d.cod) + '</div><div><b>' + L('مصاريف التوصيل', 'Delivery fee') + ':</b>' + U.money(d.fee) + '</div></div>' : '') + (d.note ? '<div class="terms">' + U.esc(d.note) + '</div>' : '') +
      '<div class="terms">' + L('أقر أنا المستلم بأنني استلمت الأصناف الموضحة أعلاه بحالة جيدة وسليمة ومطابقة للفاتورة.', 'I confirm receiving the items above in good condition.') + '</div>' + A4.sign([L('توقيع المستلم', 'Received by'), L('السائق / الفني', 'Driver / tech'), L('مسئول المخزن', 'Warehouse')]) + A4.foot());
  }
};
Views.deliveries = {
  tab: 'today',
  render: function (el) {
    var V = Views.deliveries, all = Store.db.deliveries || [], t0 = U.today(), t1 = U.today(Date.now() + 864e5), wk = U.today(Date.now() + 7 * 864e5);
    var openD = all.filter(function (d) { return ['done', 'cancelled'].indexOf(d.status) < 0; });
    var appts = F('orders') ? (Store.db.orders || []).filter(function (o) { return o.appt && ['done', 'cancelled', 'installed'].indexOf(o.status) < 0; }) : [];
    var inTab = function (day) { return V.tab === 'today' ? day === t0 || (day < t0) : V.tab === 'tomorrow' ? day === t1 : V.tab === 'week' ? day >= t0 && day <= wk : true; };
    var list = (V.tab === 'done' ? all.filter(function (d) { return d.status === 'done'; }) : openD.filter(function (d) { return inTab(d.when); })).map(function (d) { return { k: 'd', d: d, day: d.when, time: d.time || '' }; });
    if (V.tab !== 'done') appts.filter(function (o) { return inTab(o.appt); }).forEach(function (o) { list.push({ k: 'o', o: o, day: o.appt, time: o.apptTime || '' }); });
    list.sort(function (a, b) { return (a.day + a.time) < (b.day + b.time) ? -1 : 1; }); if (V.tab === 'done') list.reverse();
    el.innerHTML = '<div class="grid g4" style="margin-bottom:14px"><div class="card kpi hero"><div class="l">🚚 ' + L('النهارده', 'Today') + '</div><div class="v num">' + openD.filter(function (d) { return d.when === t0; }).length + '</div><div class="small">' + L('متأخر ', 'Overdue ') + openD.filter(function (d) { return d.when < t0; }).length + '</div></div><div class="card kpi"><div class="l">📅 ' + L('بكرة', 'Tomorrow') + '</div><div class="v num">' + openD.filter(function (d) { return d.when === t1; }).length + '</div></div><div class="card kpi"><div class="l">🔧 ' + L('تركيبات ستائر وسجاد', 'Curtain/carpet installs') + '</div><div class="v num">' + appts.length + '</div></div><div class="card kpi"><div class="l">💵 ' + L('مطلوب تحصيله', 'To collect') + '</div><div class="v num">' + U.money(H.sum(openD, function (d) { return d.cod; })) + '</div></div></div>' +
      '<div class="row wrap" style="margin-bottom:12px">' + H.tabs('dvT', [['today', '📍 ' + L('النهارده والمتأخر', 'Today & overdue')], ['tomorrow', L('بكرة', 'Tomorrow')], ['week', L('الأسبوع', 'This week')], ['all', L('كل المفتوح', 'All open')], ['done', '✅ ' + L('اللي اتسلّم', 'Done')]], V.tab) + '<div class="grow"></div><button class="btn" id="dvPr">🖨️ ' + L('طباعة خط السير', 'Print route sheet') + '</button><button class="btn pri" id="dvNew">➕ ' + L('ميعاد جديد', 'New') + '</button></div><div id="dvB"></div>';
    H.bindTabs('dvT', function (t) { V.tab = t; V.render(el); });
    $('#dvNew').onclick = function () { Dlv.edit(null); };
    var tName = function (t) { return { delivery: '🚚', install: '🔧', both: '🚚🔧' }[t] || '🚚'; };
    $('#dvB').innerHTML = list.length ? list.map(function (x) {
      if (x.k === 'o') { var o = x.o, cu = H.cust(o.customer) || {}; return '<div class="card list-row" style="margin-bottom:8px"><span style="font-size:22px">🪟</span><div class="grow"><b>' + L('تركيب أمر شغل #', 'Install order #') + o.no + ' — ' + U.esc(cu.name || '') + '</b><div class="muted small">' + x.day + ' ' + x.time + ' · 📍 ' + U.esc(o.address || '—') + ' · 👷 ' + U.esc(o.tech || '') + '</div></div>' + Ord.stChip(o.status) + '<button class="btn sm" data-oo="' + o.id + '">' + L('فتح', 'Open') + '</button></div>'; }
      var d = x.d, cu2 = H.cust(d.customer) || {}, st = Dlv.st(d.status), late = d.when < t0 && d.status !== 'done';
      return '<div class="card list-row" style="margin-bottom:8px;' + (late ? 'border-inline-start:4px solid var(--bad)' : '') + '"><span style="font-size:22px">' + tName(d.type) + '</span><div class="grow"><b>#' + d.no + ' — ' + U.esc(cu2.name || '') + '</b> <span class="num muted small">' + U.esc(cu2.phone || '') + '</span><div class="muted small">' + d.when + ' ' + (d.time || '') + (late ? ' ' + H.chip(L('متأخر', 'late'), 'bad') : '') + ' · 📍 ' + U.esc(d.address || '—') + ' · 👷 ' + U.esc(d.staff || '') + (d.saleNo ? ' · 🧾 #' + d.saleNo : '') + (d.cod ? ' · 💵 ' + U.money(d.cod) : '') + '</div><div class="small">' + d.items.slice(0, 4).map(function (i) { return U.esc(i.name); }).join(' · ') + (d.items.length > 4 ? ' …' : '') + '</div></div>' +
        '<select class="in" data-st="' + d.id + '" style="width:auto">' + DLV_ST.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === d.status ? ' selected' : '') + '>' + s[1] + ' ' + L(s[2], s[3]) + '</option>'; }).join('') + '</select><button class="btn sm" data-p="' + d.id + '">🖨️</button>' + (cu2.phone ? '<button class="btn sm" data-w="' + d.id + '">📲</button>' : '') + '<button class="btn sm" data-e="' + d.id + '">✏️</button></div>';
    }).join('') : '<div class="empty">' + L('مفيش مواعيد هنا', 'Nothing scheduled here') + '</div>';
    var get = function (id) { return all.filter(function (d) { return d.id === id; })[0]; };
    $$('[data-st]').forEach(function (s) { s.onchange = function () { var d = get(s.dataset.st); d.status = s.value; if (s.value === 'done') { d.doneAt = Date.now(); d.doneBy = App.user.name; } Store.log('delivery.status', 'D#' + d.no + ' ' + s.value); Store.save(); V.render(el); }; });
    $$('[data-p]').forEach(function (b) { b.onclick = function () { Dlv.print(get(b.dataset.p)); }; });
    $$('[data-w]').forEach(function (b) { b.onclick = function () { var d = get(b.dataset.w); H.wa((H.cust(d.customer) || {}).phone, Dlv.waText(d)); }; });
    $$('[data-e]').forEach(function (b) { b.onclick = function () { Dlv.edit(get(b.dataset.e)); }; });
    $$('[data-oo]').forEach(function (b) { b.onclick = function () { Views.orders.open((Store.db.orders || []).filter(function (o) { return o.id === b.dataset.oo; })[0]); }; });
    $('#dvPr').onclick = function () { var rows = list.filter(function (x) { return x.k === 'd'; }).map(function (x, i) { var d = x.d, cu = H.cust(d.customer) || {}; return [i + 1, d.when + ' ' + (d.time || ''), U.esc(cu.name || '') + '<br><span dir="ltr">' + U.esc(cu.phone || '') + '</span>', U.esc(d.address || ''), d.items.map(function (i2) { return U.esc(i2.name); }).join('<br>'), d.cod ? U.money(d.cod) : '', U.esc(d.staff || ''), '']; }); A4.print(A4.head(L('خط سير التوصيل والتركيب', 'Route sheet'), [[L('التاريخ', 'Date'), U.today()], [L('عدد المشاوير', 'Stops'), rows.length]]) + A4.table([L('م', '#'), L('الميعاد', 'When'), L('العميل', 'Customer'), L('العنوان', 'Address'), L('الأصناف', 'Items'), L('تحصيل', 'Collect'), L('السائق', 'Driver'), L('توقيع العميل', 'Signature')], rows, 3) + A4.foot()); };
  }
};

/* ================= warranty lookup ================= */
Views.warranty = {
  q: '',
  render: function (el) {
    var V = Views.warranty;
    el.innerHTML = '<div class="card col" style="margin-bottom:14px"><h3>🛡️ ' + L('الاستعلام عن الضمان', 'Warranty lookup') + '</h3><div class="row"><input class="in grow" id="wQ" autofocus placeholder="' + L('رقم الفاتورة أو موبايل العميل أو اسمه', 'Invoice no., customer mobile or name') + '" value="' + U.esc(V.q) + '" style="font-size:17px"><button class="btn pri" id="wGo">🔎 ' + L('بحث', 'Search') + '</button></div><div class="muted small">' + L('الضمان بيتحدد من بيانات الصنف (خانة «الضمان بالشهور»).', 'Warranty comes from each product\'s «Warranty (months)» field.') + '</div></div><div id="wB"></div>';
    var run = function () {
      V.q = $('#wQ').value.trim(); if (!V.q) { $('#wB').innerHTML = ''; return; }
      var q = U.norm(V.q), qd = Phone.norm(V.q), custs = Store.db.customers.filter(function (c) { return (qd.length >= 6 && Phone.norm(c.phone).indexOf(qd) >= 0) || (q.length >= 2 && U.norm(c.name).indexOf(q) >= 0); }).map(function (c) { return c.id; });
      var sales = Store.db.sales.filter(function (s) { return s.type === 'sale' && !s.void && (String(s.no) === V.q.replace(/\D/g, '') && /^\d+$/.test(V.q.replace(/[#\s]/g, '')) || custs.indexOf(s.customer) >= 0); });
      var rows = []; sales.forEach(function (s) { s.items.forEach(function (i) { var p = i.pid && Store.product(i.pid); var w = p ? U.n(p.warranty) : 0; if (!w) return; var end = new Date(s.date); end.setMonth(end.getMonth() + w); rows.push({ s: s, i: i, p: p, w: w, end: end.getTime() }); }); });
      rows.sort(function (a, b) { return b.s.date - a.s.date; });
      $('#wB').innerHTML = rows.length ? '<div class="tbl-wrap"><table class="t"><tr><th>' + L('الصنف', 'Item') + '</th><th>' + L('الفاتورة', 'Invoice') + '</th><th>' + L('العميل', 'Customer') + '</th><th>' + L('تاريخ البيع', 'Sold') + '</th><th>' + L('الضمان', 'Warranty') + '</th><th>' + L('ينتهي', 'Ends') + '</th><th>' + L('الحالة', 'Status') + '</th><th></th></tr>' + rows.map(function (r, x) { var ok = r.end > Date.now(), left = Math.ceil((r.end - Date.now()) / 864e5); return '<tr><td><b>' + U.esc(r.i.name) + '</b></td><td class="num">#' + r.s.no + '</td><td>' + U.esc(H.custName(r.s.customer)) + '</td><td class="num">' + U.today(r.s.date) + '</td><td>' + r.w + L(' شهر', ' mo') + '</td><td class="num">' + U.today(r.end) + '</td><td>' + (ok ? H.chip('✅ ' + L('ساري — باقي ', 'Valid — ') + left + L(' يوم', ' d'), 'ok') : H.chip('⛔ ' + L('منتهي', 'Expired'), 'bad')) + '</td><td><button class="btn sm" data-wc="' + x + '">🖨️</button></td></tr>'; }).join('') + '</table></div>' : '<div class="empty">' + L('مفيش أصناف عليها ضمان للبحث ده', 'No warranty items found') + '</div>';
      $$('[data-wc]').forEach(function (b) { b.onclick = function () { var r = rows[+b.dataset.wc], cu = H.cust(r.s.customer) || {}; A4.print(A4.head(L('شهادة ضمان', 'Warranty certificate'), [[L('الصنف', 'Item'), U.esc(r.i.name)], [L('رقم الفاتورة', 'Invoice'), r.s.no], [L('العميل', 'Customer'), U.esc(cu.name || '')], [L('الموبايل', 'Mobile'), '<span dir="ltr">' + U.esc(cu.phone || '') + '</span>'], [L('تاريخ البيع', 'Sold on'), U.today(r.s.date)], [L('مدة الضمان', 'Warranty'), r.w + L(' شهر', ' months')], [L('ينتهي في', 'Ends on'), U.today(r.end)], [L('الماركة', 'Brand'), U.esc((r.p && r.p.brand) || '—')]]) + '<div class="terms">' + L('يشمل الضمان عيوب الصناعة فقط ولا يشمل سوء الاستخدام أو الكسر أو تذبذب الكهرباء. يلزم تقديم هذه الشهادة مع الفاتورة.', 'Covers manufacturing defects only — not misuse, breakage or power surges. Present this certificate with the invoice.') + '</div>' + A4.sign([L('العميل', 'Customer'), L('الختم', 'Stamp')]) + A4.foot()); }; });
    };
    $('#wGo').onclick = run; $('#wQ').onkeydown = function (e) { if (e.key === 'Enter') run(); }; if (V.q) run();
  }
};

/* ================= customer statement (A4) + instalments in the customer profile ================= */
var Stmt = {
  print: function (c) {
    var ev = [];
    Store.db.sales.forEach(function (s) { if (s.customer !== c.id || s.void || !U.n(s.credit)) return; ev.push({ t: s.date, d: (s.type === 'return' ? L('مرتجع #', 'Return #') : L('فاتورة آجل #', 'Credit invoice #')) + s.no, dr: s.type === 'return' ? 0 : s.credit, cr: s.type === 'return' ? s.credit : 0 }); });
    (c.payments || []).forEach(function (p) { ev.push({ t: p.t, d: L('سداد نقدي', 'Payment') + (p.u ? ' — ' + p.u : ''), dr: 0, cr: p.v }); });
    ev.sort(function (a, b) { return a.t - b.t; });
    var net = H.sum(ev, function (e) { return e.dr - e.cr; }), open = U.r2(U.n(c.balance) - net), bal = open;
    var rows = [[U.esc('—'), L('رصيد سابق', 'Opening balance'), '', '', U.money(open)]].concat(ev.map(function (e) { bal = U.r2(bal + e.dr - e.cr); return [U.dt(e.t), U.esc(e.d), e.dr ? U.money(e.dr) : '', e.cr ? U.money(e.cr) : '', U.money(bal)]; }));
    var inst = (Store.db.inst || []).filter(function (x) { return x.customer === c.id && x.status !== 'void' && Inst.remaining(x) > 0.009; });
    A4.print(A4.head(L('كشف حساب عميل', 'Customer statement'), [[L('العميل', 'Customer'), U.esc(c.name)], [L('الموبايل', 'Mobile'), '<span dir="ltr">' + U.esc(c.phone || '') + '</span>'], [L('حتى تاريخ', 'As of'), U.dt(Date.now())], [L('الرصيد المستحق (آجل)', 'Balance due'), '<b>' + U.money(c.balance) + '</b>']]) +
      A4.table([L('التاريخ', 'Date'), L('البيان', 'Description'), L('مدين', 'Debit'), L('دائن', 'Credit'), L('الرصيد', 'Balance')], rows) +
      (inst.length ? '<h3 class="s">🏦 ' + L('عقود التقسيط المفتوحة', 'Open instalment contracts') + '</h3>' + A4.table([L('عقد', 'Contract'), L('التاريخ', 'Date'), L('إجمالي المقسط', 'Financed'), L('المتبقي', 'Remaining'), L('القسط الجاي', 'Next due')], inst.map(function (x) { var n = Inst.nextDue(x); return [x.no, U.today(x.date), U.money(x.instTotal), U.money(Inst.remaining(x)), n ? n.due + ' — ' + U.money(n.amount - n.paid) : '—']; })) : '') +
      A4.totals([[L('رصيد الآجل', 'On account'), U.money(c.balance)], [L('متبقي الأقساط', 'Instalments left'), U.money(H.sum(inst, Inst.remaining))], [L('إجمالي المستحق', 'Total due'), U.money(U.n(c.balance) + H.sum(inst, Inst.remaining)), 1]], U.n(c.balance) + H.sum(inst, Inst.remaining)) + A4.sign([L('العميل', 'Customer'), L('المحاسب', 'Accountant')]) + A4.foot());
  }
};
(function () {
  var pf = Views.customers.profile;
  Views.customers.profile = function (el) {
    var r = pf.apply(this, arguments); var V = Views.customers, c = V.cur ? Cust.get(V.cur) : null;
    var host = $('#cEdit') && $('#cEdit').parentNode; if (!host || !c) return r;
    var b = document.createElement('button'); b.className = 'btn'; b.innerHTML = '📄 ' + L('كشف حساب A4', 'Statement A4'); b.onclick = function () { Stmt.print(c); }; host.appendChild(b);
    var inst = (Store.db.inst || []).filter(function (x) { return x.customer === c.id && x.status !== 'void'; });
    if (inst.length && can('inst')) { var box = document.createElement('div'); box.className = 'card'; box.style.cssText = 'padding:12px;margin-top:12px'; box.innerHTML = '<b>🏦 ' + L('عقود التقسيط', 'Instalment contracts') + '</b>' + inst.map(function (x) { var st = Inst.status(x); return '<div class="list-row" data-ic="' + x.id + '" style="cursor:pointer"><b>#' + x.no + '</b><div class="grow">' + U.money(x.instTotal) + ' · ' + L('متبقي ', 'left ') + U.money(Inst.remaining(x)) + '</div>' + H.chip(st[0], st[1]) + '</div>'; }).join(''); host.parentNode.appendChild(box); $$('[data-ic]', box).forEach(function (rw) { rw.onclick = function () { Views.installments.open(inst.filter(function (x) { return x.id === rw.dataset.ic; })[0]); }; }); }
    return r;
  };
})();

/* ================= dashboard alerts ================= */
(function () {
  var db0 = Views.dashboard;
  Views.dashboard = function (el) {
    db0.apply(this, arguments);
    try {
      var items = [], t0 = U.today(), h = homeCfg();
      if (F('inst') && can('inst')) { var op = Inst.open(), late = op.filter(function (c) { return Inst.lateList(c).length; }), today = op.filter(function (c) { var n = Inst.nextDue(c); return n && H.daysTo(n.due) === 0; }); if (late.length) items.push(['⏰', L('أقساط متأخرة', 'Late instalments'), late.length + ' · ' + U.money(H.sum(late, function (c) { return H.sum(Inst.lateList(c), function (s) { return s.amount - s.paid; }); })), 'installments', 'bad']); if (today.length) items.push(['🔔', L('أقساط مستحقة النهارده', 'Due today'), today.length, 'installments', 'warn']); }
      if (F('deliveries') && can('deliveries')) { var dl = (Store.db.deliveries || []).filter(function (d) { return d.when <= t0 && ['done', 'cancelled'].indexOf(d.status) < 0; }); if (dl.length) items.push(['🚚', L('توصيلات النهارده / متأخرة', 'Deliveries today'), dl.length, 'deliveries', 'warn']); }
      if (F('orders') && can('orders')) { var rd = (Store.db.orders || []).filter(function (o) { return o.status === 'ready'; }), ap = (Store.db.orders || []).filter(function (o) { return o.appt === t0 && ['done', 'cancelled'].indexOf(o.status) < 0; }); if (rd.length) items.push(['📦', L('ستائر/سجاد جاهزة للتركيب', 'Orders ready'), rd.length, 'orders', 'ok']); if (ap.length) items.push(['🔧', L('تركيبات النهارده', 'Installs today'), ap.length, 'deliveries', 'warn']); }
      if (F('brides') && can('brides')) { var wd = (Store.db.brides || []).filter(function (b) { var d = H.daysTo(b.wedding); return b.status === 'open' && d != null && d >= 0 && d <= U.n(h.brideAlertDays); }); if (wd.length) items.push(['💍', L('أفراح قربت (', 'Weddings soon (') + h.brideAlertDays + L(' يوم)', ' d)'), wd.length, 'brides', '']); }
      if (F('quotes') && can('quotes')) { var qo = (Store.db.quotes || []).filter(function (q) { return q.status === 'open' && (!q.valid || H.daysTo(q.valid) >= 0); }); if (qo.length) items.push(['📝', L('عروض أسعار سارية', 'Open quotations'), qo.length, 'quotes', '']); }
      if (!items.length) return;
      var box = document.createElement('div'); box.className = 'home-alerts';
      box.innerHTML = items.map(function (x) { return '<button class="card ha ' + x[4] + '" data-go2="' + x[3] + '"><span class="e">' + x[0] + '</span><span class="grow"><b>' + x[1] + '</b><span class="num">' + x[2] + '</span></span><span class="muted">←</span></button>'; }).join('');
      el.insertBefore(box, el.firstChild);
      $$('[data-go2]', box).forEach(function (b) { b.onclick = function () { go(b.dataset.go2); }; });
    } catch (e) { console.warn(e); }
  };
})();
