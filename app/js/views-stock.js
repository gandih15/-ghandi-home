/* Ghandi Home — products, import/export, labels, stock count, purchases */
'use strict';
function pickProduct(cb, opt) { // search box modal
  opt = opt || {};
  var m = Modal.open({ size: 'wide', title: L('اختيار صنف', 'Pick a product'), body: '<input class="in" autofocus placeholder="' + L('ابحث أو امسح باركود…', 'Search or scan…') + '"><div id="pp" style="margin-top:10px;max-height:55vh;overflow:auto"></div>' });
  var inp = $('input', m), draw = function () {
    var q = U.norm(inp.value), res = Store.db.products.filter(function (p) { return !q || U.norm(p.name + ' ' + (p.nameEn || '') + ' ' + (p.shade || '') + ' ' + p.barcodes.join(' ') + ' ' + (p.code || '')).indexOf(q) >= 0; }).slice(0, 80);
    $('#pp', m).innerHTML = res.map(function (p) { return '<div class="list-row" data-id="' + p.id + '" style="cursor:pointer"><div style="width:30px;height:30px;border-radius:9px;background:' + swatch(p) + '"></div><div class="grow"><b>' + U.esc(pname(p)) + '</b> <span class="muted small">' + U.esc(p.shade || '') + '</span><div>' + p.barcodes.slice(0, 3).map(function (b) { return '<span class="tag">' + U.esc(b) + '</span>'; }).join('') + '</div></div><span class="chip num">' + U.n(p.stock) + '</span></div>'; }).join('') || '<div class="empty">—</div>';
    $$('[data-id]', m).forEach(function (r) { r.onclick = function () { Modal.close(m); cb(Store.product(r.dataset.id)); }; });
  };
  inp.oninput = draw; inp.onkeydown = function (e) { if (e.key === 'Enter') { var p = Store.byBarcode(inp.value); if (p) { Modal.close(m); cb(p); } } };
  draw();
}

/* ================= PRODUCTS ================= */
var PCOLS = [['name', 'اسم الصنف', 'Name'], ['nameEn', 'الاسم بالإنجليزي', 'English name'], ['barcodes', 'الباركود', 'Barcodes'], ['cat', 'القسم', 'Category'], ['brand', 'الماركة', 'Brand'], ['shade', 'اللون / الدرجة', 'Shade / colour'], ['cost', 'سعر التكلفة', 'Cost'], ['p0', 'قطاعي', 'Retail'], ['p1', 'نص جملة', 'Half-wholesale'], ['p2', 'جملة', 'Wholesale'], ['p3', 'سعر خاص', 'Special'], ['stock', 'الرصيد', 'Stock'], ['minStock', 'حد الطلب', 'Min stock'], ['expiry', 'تاريخ الصلاحية', 'Expiry']];
Views.products = {
  q: '', cat: '', filter: 'all', page: 0,
  render: function (el) {
    var P = Views.products;
    el.innerHTML = '<div class="row wrap" style="margin-bottom:14px"><div class="scan" style="flex:1;min-width:260px;padding:4px 4px 4px 12px">' + ic('search') + '<input id="pq" placeholder="' + L('بحث بالاسم أو الباركود أو الماركة…', 'Search name, barcode, brand…') + '" value="' + U.esc(P.q) + '"></div>' +
      '<select class="in" id="pc" style="width:170px"><option value="">' + L('كل الأقسام', 'All categories') + '</option>' + S().categories.map(function (c) { return '<option ' + (c === P.cat ? 'selected' : '') + '>' + U.esc(c) + '</option>'; }).join('') + '</select>' +
      '<div class="seg" id="pf">' + [['all', 'الكل', 'All'], ['low', 'نواقص', 'Low'], ['off', 'موقوف', 'Inactive']].map(function (f) { return '<button data-f="' + f[0] + '" class="' + (P.filter === f[0] ? 'on' : '') + '">' + L(f[1], f[2]) + '</button>'; }).join('') + '</div>' +
      (can('products.add') ? '<button class="btn pri" id="padd">' + ic('plus') + L('صنف جديد', 'New product') + '</button>' : '') +
      (can('import') ? '<button class="btn" id="pimp">' + ic('up') + L('استيراد', 'Import') + '</button>' : '') +
      (can('export') ? '<button class="btn" id="pexp">' + ic('down') + L('تصدير', 'Export') + '</button>' : '') +
      (can('products.editPrice') ? '<button class="btn" id="pbulk">' + ic('tag') + L('تعديل الأسعار', 'Edit prices') + '</button>' : '') +
      '</div><div class="tbl-wrap" id="pt"></div><div class="row" style="justify-content:center;margin-top:12px" id="pg"></div>';
    var t; $('#pq').oninput = function () { clearTimeout(t); var v = this.value; t = setTimeout(function () { P.q = v; P.page = 0; P.table(); }, 120); };
    $('#pc').onchange = function () { P.cat = this.value; P.page = 0; P.table(); };
    $$('#pf button').forEach(function (b) { b.onclick = function () { P.filter = b.dataset.f; P.page = 0; $$('#pf button').forEach(function (x) { x.classList.toggle('on', x === b); }); P.table(); }; });
    if ($('#padd')) $('#padd').onclick = function () { P.edit(null); };
    if ($('#pimp')) $('#pimp').onclick = P.importDlg;
    if ($('#pexp')) $('#pexp').onclick = P.exportDlg;
    if ($('#pbulk')) $('#pbulk').onclick = function () { go('prices'); };
    P.table(); $('#pq').focus();
  },
  list: function () {
    var P = Views.products, q = U.norm(P.q), expD = Date.now() + S().expiryAlertDays * 864e5;
    return Store.db.products.filter(function (p) {
      if (P.cat && p.cat !== P.cat) return false;
      if (P.filter === 'low' && !(U.n(p.stock) <= U.n(p.minStock))) return false;
      if (P.filter === 'exp' && !(p.expiry && new Date(p.expiry).getTime() < expD)) return false;
      if (P.filter === 'off' && p.active !== false) return false;
      if (P.filter !== 'off' && p.active === false && P.filter !== 'all') return false;
      if (q && U.norm(p.name + ' ' + (p.nameEn || '') + ' ' + (p.brand || '') + ' ' + (p.shade || '') + ' ' + p.barcodes.join(' ') + ' ' + (p.code || '')).indexOf(q) < 0) return false;
      return true;
    });
  },
  table: function () {
    var P = Views.products, all = P.tableList ? P.tableList() : P.list(), per = P.per || 100, pages = Math.max(1, Math.ceil(all.length / per)); if (P.page >= pages) P.page = pages - 1;
    var rows = all.slice(P.page * per, P.page * per + per), vc = can('products.viewCost'), tiers = S().tiers;
    $('#pt').innerHTML = '<table class="t"><thead><tr><th></th><th>' + L('الصنف', 'Product') + '</th><th>' + L('الباركود', 'Barcodes') + '</th><th>' + L('القسم', 'Category') + '</th>' + (vc ? '<th>' + L('التكلفة', 'Cost') + '</th>' : '') + [0, 1, 2].filter(tierVisible).map(function (i) { return '<th>' + tierName(i) + '</th>'; }).join('') + '<th>' + L('الرصيد', 'Stock') + '</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (p) {
        var st = U.n(p.stock);
        return '<tr data-id="' + p.id + '"><td>' + (kit() ? prodGem(p) : '<div style="width:34px;height:34px;border-radius:10px;background:' + swatch(p) + ';display:grid;place-items:center;color:#fff;font-weight:800">' + U.esc(pname(p).charAt(0)) + '</div>') + '</td><td><b>' + U.esc(pname(p)) + '</b>' + (p.active === false ? ' <span class="chip bad">' + L('موقوف', 'inactive') + '</span>' : '') + '<div class="muted small">' + U.esc([p.brand, p.shade].filter(Boolean).join(' · ')) + (p.expiry ? ' · ⏳ ' + p.expiry : '') + '</div></td>' +
          '<td>' + p.barcodes.slice(0, 3).map(function (b) { return '<span class="tag">' + U.esc(b) + '</span>'; }).join('') + (p.barcodes.length > 3 ? '<span class="tag">+' + (p.barcodes.length - 3) + '</span>' : '') + '</td><td>' + U.esc(p.cat || '') + '</td>' +
          (vc ? '<td class="num muted">' + U.money(p.cost) + '</td>' : '') + [0, 1, 2].filter(tierVisible).map(function (i) { return '<td class="num' + (i === 0 ? '' : ' muted') + '"' + (i === 0 ? ' style="font-weight:700"' : '') + '>' + U.money(priceOf(p, i)) + '</td>'; }).join('') +
          '<td><span class="chip num ' + (st <= 0 ? 'bad' : st <= U.n(p.minStock) ? 'warn' : 'ok') + '">' + st + '</span></td><td style="white-space:nowrap">' +
          (can('products.edit') || can('products.editPrice') ? '<button class="btn ghost sm" data-e>' + ic('edit', 16) + '</button>' : '') + (can('labels') ? '<button class="btn ghost sm" data-l>' + ic('barcode', 16) + '</button>' : '') + (can('products.delete') ? '<button class="btn ghost sm" data-d style="color:var(--bad)">' + ic('trash', 16) + '</button>' : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="10"><div class="empty">' + L('لا توجد أصناف', 'No products') + '</div></td></tr>') + '</tbody></table>';
    $$('#pt tr[data-id]').forEach(function (r) {
      var p = Store.product(r.dataset.id);
      if ($('[data-e]', r)) $('[data-e]', r).onclick = function () { P.edit(p); };
      r.ondblclick = function () { if (can('products.edit') || can('products.editPrice')) P.edit(p); };
      if ($('[data-l]', r)) $('[data-l]', r).onclick = function () { Views.labels.queue = [{ pid: p.id, qty: 1 }]; go('labels'); };
      if ($('[data-d]', r)) $('[data-d]', r).onclick = function () {
        Modal.confirm(L('حذف الصنف ', 'Delete ') + '<b>' + U.esc(p.name) + '</b>؟', function () { var used = Store.db.sales.some(function (s) { return s.items.some(function (i) { return i.pid === p.id; }); }); if (used) { p.active = false; toast(L('الصنف عليه حركات — تم إيقافه بدلاً من حذفه', 'Product has history — deactivated instead'), 'ok'); } else Store.db.products.splice(Store.db.products.indexOf(p), 1); Store.log('product.delete', p.name); Store.reindex(); Store.save(); P.table(); });
      };
    });
    $('#pg').innerHTML = pages > 1 ? '<button class="btn sm" id="pp" ' + (P.page ? '' : 'disabled') + '>‹</button><span class="chip num">' + (P.page + 1) + ' / ' + pages + ' · ' + all.length + '</span><button class="btn sm" id="pn" ' + (P.page < pages - 1 ? '' : 'disabled') + '>›</button>' : '<span class="muted small">' + all.length + ' ' + L('صنف', 'products') + '</span>';
    if ($('#pp')) { $('#pp').onclick = function () { P.page--; P.table(); }; $('#pn').onclick = function () { P.page++; P.table(); }; }
  },
  edit: function (p) {
    var isNew = !p, P = Views.products, ep = can('products.editPrice') || (isNew && can('products.add')), ed = isNew || can('products.edit');
    if (isNew && !can('products.editPrice')) ep = false;
    var d = p ? U.clone(p) : { name: '', nameEn: '', cat: S().categories[0] || '', brand: '', shade: '', unit: L('قطعة', 'pc'), barcodes: [], cost: 0, prices: [0, 0, 0, 0], stock: 0, minStock: 2, expiry: '', active: true };
    var dis = function (b) { return b ? '' : ' disabled'; };
    var m = Modal.open({
      size: 'xl', title: isNew ? L('صنف جديد', 'New product') : L('تعديل صنف', 'Edit product'),
      body: '<div class="grid" style="grid-template-columns:1.25fr 1fr;gap:22px"><div class="col" style="gap:12px">' +
        '<div class="grid g2"><label class="f">' + L('اسم الصنف *', 'Name *') + '<input class="in" id="fn" autofocus value="' + U.esc(d.name) + '"' + dis(ed) + '></label><label class="f">' + L('الاسم بالإنجليزي', 'English name') + '<input class="in" id="fne" value="' + U.esc(d.nameEn || '') + '"' + dis(ed) + '></label></div>' +
        '<div class="grid g3"><label class="f">' + L('القسم', 'Category') + '<input class="in" id="fc" list="cats" value="' + U.esc(d.cat || '') + '"' + dis(ed) + '><datalist id="cats">' + S().categories.map(function (c) { return '<option value="' + U.esc(c) + '">'; }).join('') + '</datalist></label><label class="f">' + L('الماركة', 'Brand') + '<input class="in" id="fb" value="' + U.esc(d.brand || '') + '"' + dis(ed) + '></label><label class="f">' + L('اللون / الدرجة', 'Shade / colour') + '<input class="in" id="fs" value="' + U.esc(d.shade || '') + '"' + dis(ed) + '></label></div>' +
        '<div class="card" style="padding:14px;background:var(--panel2)"><div class="row" style="justify-content:space-between;margin-bottom:8px"><b>' + ic('barcode', 17) + ' ' + L('الباركودات (صنف واحد بأكثر من باركود)', 'Barcodes (one product, many barcodes)') + '</b>' + (ed ? '<button class="btn sm" id="bgen">' + L('توليد باركود', 'Generate') + '</button>' : '') + '</div>' +
        (ed ? '<div class="row"><input class="in" id="bcin" placeholder="' + L('امسح الباركود هنا واضغط Enter — يمكنك إضافة أكثر من باركود', 'Scan here + Enter — add as many as you need') + '"><button class="btn" id="bcadd">' + ic('plus') + '</button></div>' : '') + '<div id="bcl" class="row wrap" style="margin-top:10px;gap:6px"></div></div>' +
        '<div class="grid g3"><label class="f">' + L('الرصيد', 'Stock') + '<input class="in num" type="number" id="fst" value="' + U.n(d.stock) + '"' + dis(isNew || can('stock.apply')) + '></label><label class="f">' + L('حد الطلب', 'Reorder level') + '<input class="in num" type="number" id="fmin" value="' + U.n(d.minStock) + '"' + dis(ed) + '></label><input type="hidden" id="fexp" value="' + (d.expiry || '') + '"><label class="f">' + L('الضمان (بالشهور)', 'Warranty (months)') + '<input class="in num" type="number" min="0" id="fwar" value="' + U.n(d.warranty) + '"' + dis(ed) + '></label></div>' +
        '<div class="card" style="padding:12px;background:var(--panel2)"><b>📏 ' + L('طريقة البيع والوحدة', 'How it is sold') + '</b><div class="grid g3" style="margin-top:8px"><label class="f">' + L('بيتباع', 'Sold by') + '<select class="in" id="fsb"' + dis(ed) + '>' + [['pc', 'بالقطعة / العدد', 'Piece'], ['m', 'بالمتر الطولي (قماش ستائر، مجاري…)', 'Linear metre (fabric, rails…)'], ['m2', 'بالمتر المربع (سجاد رول، موكيت…)', 'Square metre (carpet roll…)'], ['set', 'بالطقم', 'Set']].map(function (o) { return '<option value="' + o[0] + '"' + ((d.sellBy || 'pc') === o[0] ? ' selected' : '') + '>' + L(o[1], o[2]) + '</option>'; }).join('') + '</select></label><label class="f">' + L('عرض الرول (متر) — للسجاد', 'Roll width (m) — carpets') + '<input class="in num" type="number" step="0.01" id="frw" value="' + (d.rollW || '') + '"' + dis(ed) + '></label><label class="f">' + L('المقاس / الموديل', 'Size / model') + '<input class="in" id="fsz" value="' + U.esc(d.size || '') + '" placeholder="' + L('مثلاً 2×3 م أو 18 قدم', 'e.g. 2x3 m or 18 ft') + '"' + dis(ed) + '></label></div><div class="muted small">' + L('الأصناف اللي بالمتر بتطلب المقاس وقت البيع وتحسب الكمية لوحدها (طول × عرض للسجاد).', 'Metre items ask for the size at checkout and compute the quantity (length × width for carpets).') + '</div></div>' +
        '<label class="row small"><input type="checkbox" class="sw" id="fser" ' + (d.serial ? 'checked' : '') + dis(ed) + '> ' + L('له رقم سيريال (بيطلبه وقت البيع — للأجهزة)', 'Has a serial number (asked at checkout — appliances)') + '</label>' +
        '<label class="row small"><input type="checkbox" class="sw" id="fact" ' + (d.active !== false ? 'checked' : '') + dis(ed) + '> ' + L('الصنف نشط ويظهر في البيع', 'Active (visible in POS)') + '</label></div>' +
        '<div class="col" style="gap:12px"><div class="card" style="padding:16px"><h3>' + ic('tag', 17) + L('الأسعار', 'Prices') + (ep ? '' : ' <span class="chip bad">' + ic('lock', 12) + L('مقفول', 'locked') + '</span>') + '</h3>' +
        (can('products.viewCost') ? '<label class="f" style="margin-bottom:10px">' + L('سعر التكلفة', 'Cost price') + '<input class="in num" type="number" id="fcost" value="' + U.n(d.cost) + '"' + dis(ep) + '></label>' : '') +
        S().tiers.map(function (t, i) { return '<div class="row" style="margin-bottom:9px"><span style="width:110px;font-weight:700">' + tierName(i) + '</span><input class="in num grow" type="number" data-pr="' + i + '" value="' + U.n((d.prices || [])[i]) + '"' + dis(ep) + '><span class="chip num" data-mg="' + i + '" style="min-width:64px;justify-content:center"></span></div>'; }).join('') +
        '<div class="muted small">' + L('اترك السعر 0 ليُستخدم سعر القطاعي', 'Leave 0 to fall back to retail price') + '</div></div>' +
        '<div class="card" style="padding:14px;text-align:center"><div class="muted small" style="margin-bottom:6px">' + L('معاينة الملصق', 'Label preview') + '</div><div id="lprev" style="display:inline-block"></div></div></div></div>',
      foot: (isNew ? '<label class="row small" style="margin-inline-end:auto"><input type="checkbox" class="sw" id="fmore" checked> ' + L('إضافة صنف آخر بعد الحفظ', 'Add another after saving') + '</label>' : '') + '<button class="btn" data-c>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri" id="fsave">' + ic('save') + L('حفظ', 'Save') + ' <span class="kbd">Ctrl+S</span></button>'
    });
    var drawBc = function () {
      $('#bcl', m).innerHTML = d.barcodes.length ? d.barcodes.map(function (b, i) { return '<span class="chip" style="background:var(--panel);border:1px solid var(--line2);font-family:Consolas,monospace;direction:ltr">' + U.esc(b) + (ed ? ' <a data-rb="' + i + '" style="cursor:pointer;color:var(--bad)">✕</a>' : '') + '</span>'; }).join('') : '<span class="muted small">' + L('لا يوجد باركود — سيتم توليد واحد تلقائياً', 'No barcode — one will be generated') + '</span>';
      $$('[data-rb]', m).forEach(function (a) { a.onclick = function () { d.barcodes.splice(+a.dataset.rb, 1); drawBc(); }; });
      var code = d.barcodes[0] || '200000000000', lb = S().label;
      $('#lprev', m).innerHTML = Views.labels.one({ name: $('#fn', m).value || d.name || L('اسم الصنف', 'Product'), shade: d.shade, prices: d.prices }, code, Object.assign({}, lb, { w: 50, h: 30 }));
    };
    var addBc = function (v) {
      v = String(v || '').trim(); if (!v) return;
      var other = Store.byBarcode(v);
      if (other && other !== p) { beep(false); return toast(L('الباركود مستخدم في صنف: ', 'Barcode already used by: ') + other.name, 'bad'); }
      if (d.barcodes.indexOf(v) >= 0) return toast(L('الباركود موجود بالفعل', 'Already added'), 'bad');
      d.barcodes.push(v); beep(true); drawBc();
    };
    if (ed) {
      $('#bcin', m).onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); addBc(this.value); this.value = ''; } };
      $('#bcadd', m).onclick = function () { addBc($('#bcin', m).value); $('#bcin', m).value = ''; };
      $('#bgen', m).onclick = function () { addBc(Store.newBarcode()); };
    }
    var margins = function () { var c = $('#fcost', m) ? U.n($('#fcost', m).value) : U.n(d.cost); $$('[data-pr]', m).forEach(function (i) { var v = U.n(i.value), ch = $('[data-mg="' + i.dataset.pr + '"]', m); if (!can('products.viewCost')) { ch.style.display = 'none'; return; } ch.textContent = v && c ? Math.round((v - c) / v * 100) + '%' : '—'; ch.className = 'chip num ' + (v && c ? (v > c ? 'ok' : 'bad') : ''); }); };
    $$('[data-pr]', m).forEach(function (i) { i.oninput = margins; }); if ($('#fcost', m)) $('#fcost', m).oninput = margins;
    $('#fn', m).oninput = drawBc; drawBc(); margins();
    $('[data-c]', m).onclick = function () { Modal.close(m); };
    m.addEventListener('keydown', function (e) { if (e.ctrlKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); $('#fsave', m).click(); } });
    $('#fsave', m).onclick = function () {
      var name = $('#fn', m).value.trim(); if (!name) return toast(L('اكتب اسم الصنف', 'Name is required'), 'bad');
      var pend = $('#bcin', m) && $('#bcin', m).value.trim(); if (pend) addBc(pend);
      var t = p || { id: U.id(), created: Date.now(), stock: 0 }; if (m._img !== undefined) t.img = m._img;
      if (ed) { t.name = name; t.nameEn = $('#fne', m).value.trim(); t.cat = $('#fc', m).value.trim(); t.brand = $('#fb', m).value.trim(); t.shade = $('#fs', m).value.trim(); t.minStock = U.n($('#fmin', m).value); t.expiry = $('#fexp', m).value; t.active = $('#fact', m).checked; t.barcodes = d.barcodes.length ? d.barcodes : [Store.newBarcode()]; t.warranty = U.n($('#fwar', m).value); t.serial = $('#fser', m).checked; t.sellBy = $('#fsb', m).value; t.rollW = U.n($('#frw', m).value) || ''; t.size = $('#fsz', m).value.trim(); t.unit = { pc: L('قطعة', 'pc'), m: L('متر', 'm'), m2: L('م²', 'm²'), set: L('طقم', 'set') }[t.sellBy] || d.unit; }
      if (ep) { var old = JSON.stringify(t.prices || []); t.prices = $$('[data-pr]', m).map(function (i) { return U.n(i.value); }); if ($('#fcost', m)) t.cost = U.n($('#fcost', m).value); if (!isNew && old !== JSON.stringify(t.prices)) Store.log('price.change', name + ' ' + old + ' → ' + JSON.stringify(t.prices)); }
      else if (isNew) { t.prices = [0, 0, 0, 0]; t.cost = 0; }
      if (t.cat && S().categories.indexOf(t.cat) < 0) S().categories.push(t.cat);
      var ns = U.n($('#fst', m).value);
      if (isNew) { Store.db.products.push(t); if (ns) Store.move(t.id, ns, 'open', L('رصيد افتتاحي', 'Opening')); Store.log('product.add', name); }
      else if (ns !== U.n(t.stock) && can('stock.apply')) Store.move(t.id, ns - U.n(t.stock), 'adjust', L('تعديل يدوي', 'Manual'));
      Store.reindex(); Store.save(); toast(L('تم الحفظ ✓', 'Saved ✓'), 'ok');
      var again = isNew && $('#fmore', m) && $('#fmore', m).checked; Modal.close(m);
      if (App.view === 'products') P.table();
      if (again) P.edit(null);
    };
  },
  bulk: function () {
    var m = Modal.open({ title: L('تعديل أسعار جماعي', 'Bulk price update'), body: '<div class="col"><label class="f">' + L('القسم', 'Category') + '<select class="in" id="bc"><option value="">' + L('كل الأقسام', 'All') + '</option>' + S().categories.map(function (c) { return '<option>' + U.esc(c) + '</option>'; }).join('') + '</select></label><label class="f">' + L('الشريحة', 'Tier') + '<select class="in" id="bt">' + S().tiers.map(function (t, i) { return '<option value="' + i + '">' + tierName(i) + '</option>'; }).join('') + '<option value="all">' + L('كل الشرائح', 'All tiers') + '</option></select></label><label class="f">' + L('نسبة الزيادة % (سالب للتخفيض)', 'Change % (negative to reduce)') + '<input class="in num" type="number" id="bp" value="10"></label><label class="f">' + L('تقريب لأقرب', 'Round to nearest') + '<select class="in" id="br"><option value="0">—</option><option value="1">1</option><option value="5" selected>5</option><option value="10">10</option></select></label></div>', foot: '<button class="btn pri" id="bgo">' + L('تطبيق', 'Apply') + '</button>' });
    $('#bgo', m).onclick = function () {
      var c = $('#bc', m).value, t = $('#bt', m).value, pc = U.n($('#bp', m).value), rn = +$('#br', m).value, n = 0;
      Store.db.products.forEach(function (p) { if (c && p.cat !== c) return; (t === 'all' ? [0, 1, 2, 3] : [+t]).forEach(function (i) { var v = U.n(p.prices[i]); if (!v) return; v = v * (1 + pc / 100); p.prices[i] = rn ? Math.round(v / rn) * rn : U.r2(v); }); n++; });
      Store.log('price.bulk', (c || '*') + ' ' + pc + '%'); Store.save(); Modal.close(m); toast(L('تم تعديل ', 'Updated ') + n + L(' صنف', ' products'), 'ok'); Views.products.table();
    };
  },
  exportDlg: function () {
    var rows = [PCOLS.map(function (c) { return L(c[1], c[2]); })];
    Views.products.list().forEach(function (p) { rows.push([p.name, p.nameEn || '', p.barcodes.join(' | '), p.cat || '', p.brand || '', p.shade || '', can('products.viewCost') ? U.n(p.cost) : '', U.n(p.prices[0]), U.n(p.prices[1]), U.n(p.prices[2]), U.n(p.prices[3]), U.n(p.stock), U.n(p.minStock), p.expiry || ''].concat(PCOLS.length > 14 ? [p.sub || ''] : []).concat(PCOLS.length > 15 ? [p.code || ''] : [])); });
    var m = Modal.open({ title: L('تصدير الأصناف', 'Export products'), body: '<p>' + (rows.length - 1) + L(' صنف (حسب الفلتر الحالي)', ' products (current filter)') + '</p><div class="row"><button class="btn pri grow" id="x1">' + ic('file') + 'Excel (.xlsx)</button><button class="btn grow" id="x2">CSV</button><button class="btn grow" id="x3">' + L('قالب فارغ', 'Empty template') + '</button></div>' });
    $('#x1', m).onclick = function () { saveBlob(XL.writeXlsx(rows, 'Products', lang() !== 'en'), 'ghandi_products_' + U.today() + '.xlsx'); Store.log('export', rows.length - 1); Modal.close(m); };
    $('#x2', m).onclick = function () { saveBlob(new Blob([XL.writeCsv(rows)], { type: 'text/csv' }), 'ghandi_products_' + U.today() + '.csv'); Modal.close(m); };
    $('#x3', m).onclick = function () { saveBlob(XL.writeXlsx([rows[0], ['طقم حلل جرانيت 10 قطع', 'Granite cookware set 10', '6221234567890 | 6221234567891', 'أواني طهي', 'Zahran', 'رمادي', 45, 85, 75, 65, 0, 24, 3, '2027-06-30']], 'Products', true), 'ghandi_template.xlsx'); Modal.close(m); };
  },
  importDlg: function () {
    var m = Modal.open({ size: 'wide', title: L('استيراد أصناف من إكسيل', 'Import products from Excel'), body: '<div class="col"><div class="card" style="background:var(--panel2)"><b>' + L('الأعمدة المدعومة (أول صف عناوين):', 'Supported columns (first row = headers):') + '</b><div style="margin-top:8px">' + PCOLS.map(function (c) { return '<span class="chip" style="margin:2px">' + L(c[1], c[2]) + '</span>'; }).join('') + '</div><div class="muted small" style="margin-top:8px">' + L('لأكثر من باركود لنفس الصنف افصل بينهم بـ | أو ،', 'Separate multiple barcodes with | or ,') + '</div></div>' +
      '<input type="file" class="in" id="if" accept=".xlsx,.csv"><label class="row small"><input type="checkbox" class="sw" id="iu" checked> ' + L('تحديث الأصناف الموجودة (حسب الباركود أو الاسم)', 'Update existing (match by barcode or name)') + '</label><label class="row small"><input type="checkbox" class="sw" id="is"> ' + L('استبدال الرصيد بقيمة الملف', 'Overwrite stock with file value') + '</label><div id="ipv"></div></div>', foot: '<button class="btn pri" id="igo" disabled>' + L('استيراد', 'Import') + '</button>' });
    var parsed = null;
    $('#if', m).onchange = function () {
      var f = this.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () {
        (/\.csv$/i.test(f.name) ? Promise.resolve(XL.readCsv(new TextDecoder().decode(new Uint8Array(rd.result)))) : XL.readXlsx(rd.result)).then(function (rows) {
          var head = (rows[0] || []).map(function (h) { return U.norm(h); }), map = {};
          PCOLS.forEach(function (c) { var ix = head.findIndex(function (h) { return h === U.norm(c[1]) || h === U.norm(c[2]) || h === c[0].toLowerCase(); }); if (ix >= 0) map[c[0]] = ix; });
          if (map.name == null) return toast(L('لم يتم العثور على عمود اسم الصنف', 'Name column not found'), 'bad');
          parsed = rows.slice(1).filter(function (r) { return r && String(r[map.name] || '').trim(); }).map(function (r) { var o = {}; Object.keys(map).forEach(function (k) { o[k] = r[map[k]]; }); return o; });
          $('#ipv', m).innerHTML = '<div class="chip ok">' + parsed.length + L(' صف جاهز', ' rows ready') + '</div> <span class="muted small">' + Object.keys(map).length + L(' عمود متطابق', ' columns matched') + '</span>';
          $('#igo', m).disabled = !parsed.length;
        }).catch(function (e) { toast(e.message, 'bad'); });
      };
      rd.readAsArrayBuffer(f);
    };
    $('#igo', m).onclick = function () {
      var add = 0, upd = 0, skip = 0, upOK = $('#iu', m).checked, stOK = $('#is', m).checked, ep = can('products.editPrice');
      parsed.forEach(function (o) {
        var bcs = String(o.barcodes || '').split(/[|,،;\n]+/).map(function (x) { return x.trim().replace(/\.0$/, ''); }).filter(Boolean), ex = null;
        bcs.forEach(function (b) { ex = ex || Store.byBarcode(b); });
        if (!ex) ex = Store.db.products.filter(function (p) { return U.norm(p.name) === U.norm(o.name) && (!o.shade || U.norm(p.shade) === U.norm(o.shade)); })[0] || null;
        if (ex && !upOK) { skip++; return; }
        if (typeof PriceGuard !== 'undefined' && PriceGuard.on() && (ep || !ex)) { var gc = (o.cost != null && o.cost !== '') ? U.n(o.cost) : (ex ? U.n(ex.cost) : 0), gp = (ex ? ex.prices.slice() : [0, 0, 0, 0]); ['p0', 'p1', 'p2', 'p3'].forEach(function (k, i) { if (o[k] != null && o[k] !== '') gp[i] = U.n(o[k]); }); var gb = PriceGuard.bad(gp, gc); if (gb) { skip++; (m._below = m._below || []).push(String(o.name) + ' — ' + tierName(gb.t) + ' ' + U.money(gb.v) + ' < ' + U.money(gb.cost)); return; } }
        var p = ex || { id: U.id(), created: Date.now(), barcodes: [], prices: [0, 0, 0, 0], stock: 0, active: true };
        p.name = String(o.name).trim(); if (o.nameEn != null) p.nameEn = String(o.nameEn); if (o.cat) p.cat = String(o.cat).trim(); if (o.brand != null) p.brand = String(o.brand); if (o.shade != null) p.shade = String(o.shade); if (o.sub != null && typeof Subs !== 'undefined') { p.sub = String(o.sub).trim(); if (p.cat && p.sub) { var sa = Subs.all(); sa[p.cat] = sa[p.cat] || []; if (sa[p.cat].indexOf(p.sub) < 0) sa[p.cat].push(p.sub); } }
        if (ep || !ex) { if (o.cost != null && o.cost !== '') p.cost = U.n(o.cost); ['p0', 'p1', 'p2', 'p3'].forEach(function (k, i) { if (o[k] != null && o[k] !== '') p.prices[i] = U.n(o[k]); }); }
        if (o.minStock != null && o.minStock !== '') p.minStock = U.n(o.minStock);
        if (o.code != null && String(o.code).trim() !== '' && typeof ItemNo !== 'undefined' && ItemNo.canEdit()) { var cv = String(o.code).trim().replace(/\.0$/, ''); if (!ItemNo.taken(cv, p)) p.code = cv; }
        if (o.expiry) { var ev = String(o.expiry); if (/^\d{5}$/.test(ev)) { var dd = new Date(Date.UTC(1899, 11, 30) + (+ev) * 864e5); ev = U.today(dd); } p.expiry = ev; }
        bcs.forEach(function (b) { var other = Store.byBarcode(b); if (!other || other === p) { if (p.barcodes.indexOf(b) < 0) p.barcodes.push(b); Store.bcIndex[b] = p; } });
        if (!p.barcodes.length) p.barcodes.push(Store.newBarcode());
        if (p.cat && S().categories.indexOf(p.cat) < 0) S().categories.push(p.cat);
        if (!ex) { Store.db.products.push(p); add++; if (U.n(o.stock)) Store.move(p.id, U.n(o.stock), 'import', 'Excel'); }
        else { upd++; if (stOK && o.stock !== '' && o.stock != null) Store.move(p.id, U.n(o.stock) - U.n(p.stock), 'import', 'Excel'); }
        Store.reindex();
      });
      Store.log('import', add + '/' + upd); Store.save(); Modal.close(m); if (m._below && m._below.length) PriceGuard.block(m._below);
      toast(L('تمت إضافة ', 'Added ') + add + L(' وتحديث ', ', updated ') + upd + (skip ? L(' وتخطي ', ', skipped ') + skip : ''), 'ok'); Views.products.table();
    };
  }
};

/* ================= LABELS ================= */
Views.labels = {
  queue: [],
  one: function (p, code, o) {
    var pr = p.id ? Promo.price(p, +o.priceTier || 0) : { price: priceOf(p, +o.priceTier || 0) }, price = pr.price, old = (o.showPromo && pr.promo) ? pr.base : 0, fs = +o.fontSize || 9;
    return '<div class="lbl" style="width:' + o.w + 'mm;height:' + o.h + 'mm;font-size:' + fs + 'px">' +
      (o.showShop ? '<div style="font-weight:800;font-size:' + (fs - 1) + 'px;line-height:1.1">' + U.esc(shopName()) + '</div>' : '') +
      (o.showName ? '<div style="font-weight:700;line-height:1.15;text-align:center;max-height:2.4em;overflow:hidden">' + (p.vopt && typeof Variants !== 'undefined' ? U.esc(Variants.fullName(p)) : U.esc(p.name) + (p.shade ? ' - ' + U.esc(p.shade) : '')) + '</div>' : '') +
      '<div style="width:92%;height:' + o.barH + 'mm">' + Barcode.svg(code, { height: 50 }) + '</div><div style="display:flex;justify-content:space-between;width:94%;align-items:baseline"><span style="font-family:Consolas,monospace;font-size:' + (fs - 1) + 'px;direction:ltr">' + U.esc(code) + '</span>' + (o.showPrice ? '<span>' + (old ? '<s style="font-size:' + (fs - 1) + 'px">' + U.money(old).replace(/\.00$/, '') + '</s> ' : '') + '<b style="font-size:' + (fs + 3) + 'px">' + U.money(price).replace(/\.00$/, '') + ' ' + (lang() === 'en' ? S().currencyEn : S().currency) + '</b></span>' : '') + '</div></div>';
  },
  render: function (el) {
    var V = Views.labels, o = S().label;
    el.innerHTML = '<div class="grid" style="grid-template-columns:1.2fr 1fr;gap:16px;align-items:start"><div class="card"><h3>' + ic('barcode', 18) + L('الأصناف المطلوب طباعتها', 'Items to print') + '</h3><div class="row"><div class="scan grow" style="padding:4px 4px 4px 12px;box-shadow:none">' + ic('search') + '<input id="lq" placeholder="' + L('امسح أو ابحث ثم Enter', 'Scan / search then Enter') + '"></div><button class="btn" id="lpick">' + ic('plus') + L('اختيار', 'Pick') + '</button><button class="btn" id="llow">' + L('كل الأصناف', 'All products') + '</button></div><div id="lqt" style="margin-top:12px"></div></div>' +
      '<div class="col"><div class="card"><h3>' + ic('gear', 18) + L('إعدادات الملصق', 'Label settings') + '</h3><div class="grid g3"><label class="f">' + L('العرض مم', 'Width mm') + '<input class="in num" type="number" data-o="w" value="' + o.w + '"></label><label class="f">' + L('الارتفاع مم', 'Height mm') + '<input class="in num" type="number" data-o="h" value="' + o.h + '"></label><label class="f">' + L('ارتفاع الباركود', 'Bar height') + '<input class="in num" type="number" data-o="barH" value="' + o.barH + '"></label></div>' +
      '<div class="row wrap" style="margin-top:10px">' + [[38, 25], [40, 30], [50, 25], [50, 30], [58, 40]].map(function (s) { return '<button class="btn sm" data-sz="' + s + '">' + s[0] + '×' + s[1] + '</button>'; }).join('') + '</div>' +
      '<div class="grid g2" style="margin-top:10px"><label class="f">' + L('السعر المطبوع', 'Printed price') + '<select class="in" data-o="priceTier">' + S().tiers.map(function (t, i) { return '<option value="' + i + '" ' + (i == o.priceTier ? 'selected' : '') + '>' + tierName(i) + '</option>'; }).join('') + '</select></label><label class="f">' + L('حجم الخط', 'Font size') + '<input class="in num" type="number" data-o="fontSize" value="' + o.fontSize + '"></label></div>' +
      '<div class="row wrap" style="margin-top:10px">' + [['showShop', 'اسم المحل', 'Shop name'], ['showName', 'اسم الصنف', 'Product name'], ['showPrice', 'السعر', 'Price'], ['showPromo', 'السعر قبل العرض متشطب', 'Old price struck (offers)']].map(function (t) { return '<label class="row small"><input type="checkbox" class="sw" data-o="' + t[0] + '" ' + (o[t[0]] ? 'checked' : '') + '> ' + L(t[1], t[2]) + '</label>'; }).join('') + '</div>' +
      '<div class="row" style="margin-top:12px"><div class="seg" id="lmode"><button data-m="roll" class="' + (o.mode !== 'a4' ? 'on' : '') + '">' + L('طابعة باركود (رول)', 'Label printer (roll)') + '</button><button data-m="a4" class="' + (o.mode === 'a4' ? 'on' : '') + '">' + L('ورق A4', 'A4 sheet') + '</button></div></div></div>' +
      '<div class="card"><h3>' + L('معاينة', 'Preview') + '</h3><div class="preview-wrap" style="min-height:160px" id="lpv"></div><button class="btn pri lg" id="lprint" style="width:100%;margin-top:12px">' + ic('print') + L('طباعة', 'Print') + ' <span id="lcount" class="num"></span></button></div></div></div>';
    $('#lq').onkeydown = function (e) { if (e.key === 'Enter') { var p = Store.byBarcode(this.value); if (!p) { var q = U.norm(this.value), h = Store.db.products.filter(function (x) { return U.norm(x.name).indexOf(q) >= 0; }); if (h.length === 1) p = h[0]; } if (p) { V.add(p); beep(true); } else { beep(false); } this.value = ''; } };
    $('#lpick').onclick = function () { pickProduct(function (p) { V.add(p); }); };
    $('#llow').onclick = function () { V.queue = Store.db.products.filter(function (p) { return p.active !== false; }).map(function (p) { return { pid: p.id, qty: Math.max(1, U.n(p.stock)) }; }); V.draw(); };
    $$('[data-o]').forEach(function (i) { i.onchange = function () { o[i.dataset.o] = i.type === 'checkbox' ? i.checked : (i.tagName === 'SELECT' ? +i.value : U.n(i.value)); Store.save(); V.draw(); }; });
    $$('[data-sz]').forEach(function (b) { b.onclick = function () { var s = b.dataset.sz.split(','); o.w = +s[0]; o.h = +s[1]; o.barH = Math.round(o.h * .42); Store.save(); V.render(el); }; });
    $$('#lmode button').forEach(function (b) { b.onclick = function () { o.mode = b.dataset.m; Store.save(); $$('#lmode button').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    $('#lprint').onclick = function () { V.print(); }; V.draw(); $('#lq').focus();
  },
  add: function (p) { var e = Views.labels.queue.filter(function (x) { return x.pid === p.id; })[0]; if (e) e.qty++; else Views.labels.queue.push({ pid: p.id, qty: 1, code: p.barcodes[0] }); Views.labels.draw(); },
  draw: function () {
    var V = Views.labels;
    $('#lqt').innerHTML = V.queue.length ? '<table class="t"><tr><th>' + L('الصنف', 'Product') + '</th><th>' + L('الباركود', 'Barcode') + '</th><th>' + L('العدد', 'Copies') + '</th><th></th></tr>' + V.queue.map(function (q, i) { var p = Store.product(q.pid); if (!p) return ''; return '<tr><td><b>' + U.esc(pname(p)) + '</b><div class="muted small">' + U.esc(p.shade || '') + '</div></td><td><select class="in" data-bc="' + i + '" style="padding:5px">' + p.barcodes.map(function (b) { return '<option ' + (b === q.code ? 'selected' : '') + '>' + U.esc(b) + '</option>'; }).join('') + '</select></td><td><input class="in num" type="number" style="width:80px" data-q="' + i + '" value="' + q.qty + '"></td><td><button class="btn ghost sm" data-r="' + i + '">' + ic('x', 15) + '</button></td></tr>'; }).join('') + '</table>' : '<div class="empty">' + ic('barcode', 40) + '<div>' + L('امسح باركود صنف لإضافته', 'Scan a product to add it') + '</div></div>';
    $$('[data-q]').forEach(function (i) { i.onchange = function () { V.queue[+i.dataset.q].qty = Math.max(0, U.n(i.value)); V.draw(); }; });
    $$('[data-bc]').forEach(function (i) { i.onchange = function () { V.queue[+i.dataset.bc].code = i.value; V.draw(); }; });
    $$('[data-r]').forEach(function (b) { b.onclick = function () { V.queue.splice(+b.dataset.r, 1); V.draw(); }; });
    var first = V.queue[0] && Store.product(V.queue[0].pid), o = S().label;
    $('#lpv').innerHTML = first ? V.one(first, V.queue[0].code || first.barcodes[0], o) : V.one({ name: L('اسم الصنف', 'Product name'), prices: [125] }, '200000000017', o);
    var n = V.queue.reduce(function (s, q) { return s + q.qty; }, 0); $('#lcount').textContent = n ? '(' + n + ')' : '';
  },
  print: function (dl) {
    var V = Views.labels, o = S().label, html = '';
    V.queue.forEach(function (q) { var p = Store.product(q.pid); if (!p) return; for (var i = 0; i < q.qty; i++) html += V.one(p, q.code || p.barcodes[0], o); });
    if (!html) return toast(L('لا توجد ملصقات', 'Nothing to print'), 'bad');
    var css = o.mode === 'a4' ? '@page{size:A4;margin:8mm}body{margin:0}.wrap{display:flex;flex-wrap:wrap;gap:2mm}.lbl{border:1px dashed #ccc;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:space-between;overflow:hidden;padding:1mm;font-family:Tahoma,Arial}'
      : '@page{size:' + o.w + 'mm ' + o.h + 'mm;margin:0}body{margin:0}.lbl{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:space-between;overflow:hidden;padding:1mm;page-break-after:always;font-family:Tahoma,Arial;border:0!important}.lbl{height:calc(' + o.h + 'mm - 0.5mm)!important}.lbl:last-child{page-break-after:auto}';
    if (dl === true && typeof LabelPdf !== 'undefined') return LabelPdf.save('<div class="wrap">' + html + '</div>', css, o);
    Printer.print('<div class="wrap">' + html + '</div>', { css: css, printer: S().printers.label, silent: S().printers.silent, label: true, mediaSize: o.mode === 'a4' ? undefined : { name: 'CUSTOM', width_microns: o.w * 1000, height_microns: o.h * 1000, custom_display_name: 'Label', is_default: true } });
    Store.log('labels.print', V.queue.length);
  }
};

/* ================= STOCK COUNT (الجرد) ================= */
Views.count = {
  cur: null,
  render: function (el) {
    var V = Views.count, db = Store.db;
    if (V.cur) return V.session(el);
    el.innerHTML = '<div class="row" style="margin-bottom:14px"><div class="grow"><b style="font-size:16px">' + L('جلسات الجرد', 'Count sessions') + '</b><div class="muted small">' + L('الموظف يقدر يعدّ فقط، والاعتماد وتعديل الرصيد بصلاحية منفصلة', 'Staff can count; approving changes stock and needs a separate permission') + '</div></div><button class="btn pri" id="cnew">' + ic('plus') + L('جرد جديد', 'New count') + '</button></div>' +
      '<div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('الاسم', 'Name') + '</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('بواسطة', 'By') + '</th><th>' + L('أصناف', 'Items') + '</th><th>' + L('الحالة', 'Status') + '</th><th></th></tr>' +
      (db.counts.length ? db.counts.slice().reverse().map(function (c) { return '<tr><td class="num">' + c.no + '</td><td><b>' + U.esc(c.name) + '</b></td><td class="num">' + U.dt(c.at) + '</td><td>' + U.esc(c.by) + '</td><td class="num">' + Object.keys(c.lines).length + '</td><td>' + (c.applied ? '<span class="chip ok">' + L('معتمد', 'Approved') + '</span>' : '<span class="chip warn">' + L('مفتوح', 'Open') + '</span>') + '</td><td><button class="btn sm" data-o="' + c.id + '">' + L('فتح', 'Open') + '</button></td></tr>'; }).join('') : '<tr><td colspan="7"><div class="empty">' + L('لا توجد جلسات جرد', 'No sessions yet') + '</div></td></tr>') + '</table></div>';
    $('#cnew').onclick = function () {
      Modal.prompt(L('جرد جديد', 'New count'), L('اسم الجرد (مثلاً: جرد السجاد — المخزن)', 'Name (e.g. Carpets — warehouse)'), L('جرد ', 'Count ') + U.today(), function (n) {
        var c = { id: U.id(), no: db.counts.length + 1, name: n, at: Date.now(), by: App.user.name, lines: {}, applied: false }; db.counts.push(c); Store.save(); V.cur = c; V.render(el);
      });
    };
    $$('[data-o]').forEach(function (b) { b.onclick = function () { V.cur = db.counts.filter(function (c) { return c.id === b.dataset.o; })[0]; V.render(el); }; });
  },
  session: function (el) {
    var V = Views.count, c = V.cur, showSys = can('stock.apply') && can('stock.viewQty');
    el.innerHTML = '<div class="row" style="margin-bottom:14px"><button class="btn" id="cback">' + ic('ret') + '</button><div class="grow"><b style="font-size:16px">' + U.esc(c.name) + '</b> ' + (c.applied ? '<span class="chip ok">' + L('معتمد', 'Approved') + '</span>' : '') + '</div>' + (showSys && !c.applied ? '<button class="btn gold" id="capply">' + ic('shield') + L('اعتماد الجرد وتعديل الأرصدة', 'Approve & adjust stock') + '</button>' : '') + (can('export') ? '<button class="btn" id="cexp">' + ic('down') + 'Excel</button>' : '') + '</div>' +
      (c.applied ? '' : '<div class="scan" style="margin-bottom:14px"><div class="bi">' + ic('barcode') + '</div><input id="cs" placeholder="' + L('امسح الباركود — كل مسح = قطعة واحدة (أو اكتب 5*باركود)', 'Scan — each scan = 1 pc (or 5*barcode)') + '"></div>') + '<div class="grid g3" style="margin-bottom:14px" id="ck"></div><div class="tbl-wrap" id="ct"></div>';
    var draw = function () {
      var keys = Object.keys(c.lines), dq = 0, dv = 0;
      $('#ct').innerHTML = '<table class="t"><tr><th>' + L('الصنف', 'Product') + '</th><th>' + L('المعدود', 'Counted') + '</th>' + (showSys ? '<th>' + L('بالسيستم', 'System') + '</th><th>' + L('الفرق', 'Diff') + '</th><th>' + L('قيمة الفرق', 'Diff value') + '</th>' : '') + '</tr>' + keys.reverse().map(function (k) {
        var p = Store.product(k), l = c.lines[k]; if (!p) return ''; var sys = c.applied ? l.sys : U.n(p.stock), d = l.q - sys; dq += d; dv += d * U.n(p.cost);
        return '<tr><td><b>' + U.esc(pname(p)) + '</b> <span class="muted small">' + U.esc(p.shade || '') + '</span></td><td><input class="in num" style="width:90px" type="number" data-k="' + k + '" value="' + l.q + '" ' + (c.applied ? 'disabled' : '') + '></td>' + (showSys ? '<td class="num">' + sys + '</td><td><span class="chip num ' + (d ? (d > 0 ? 'ok' : 'bad') : '') + '">' + (d > 0 ? '+' : '') + d + '</span></td><td class="num">' + U.money(d * U.n(p.cost)) + '</td>' : '') + '</tr>';
      }).join('') + '</table>';
      $('#ck').innerHTML = '<div class="card kpi"><div class="l">' + L('أصناف تم عدّها', 'Products counted') + '</div><div class="v num">' + keys.length + '</div></div><div class="card kpi"><div class="l">' + L('إجمالي القطع', 'Total pieces') + '</div><div class="v num">' + keys.reduce(function (s, k) { return s + c.lines[k].q; }, 0) + '</div></div>' + (showSys ? '<div class="card kpi"><div class="l">' + L('صافي العجز / الزيادة', 'Net variance') + '</div><div class="v num" style="color:' + (dv < 0 ? 'var(--bad)' : 'var(--ok)') + '">' + U.money(dv) + '</div></div>' : '<div class="card kpi"><div class="l">' + L('بواسطة', 'Counter') + '</div><div class="v" style="font-size:18px">' + U.esc(c.by) + '</div></div>');
      $$('[data-k]').forEach(function (i) { i.onchange = function () { c.lines[i.dataset.k].q = U.n(i.value); Store.save(); draw(); }; });
    };
    $('#cback').onclick = function () { V.cur = null; V.render(el); };
    if ($('#cs')) $('#cs').onkeydown = function (e) {
      if (e.key !== 'Enter') return; var v = this.value.trim(), q = 1, m = v.match(/^(\d+)\*(.+)$/); if (m) { q = +m[1]; v = m[2]; } this.value = '';
      var p = Store.byBarcode(v); if (!p) { beep(false); return toast(L('غير موجود: ', 'Not found: ') + v, 'bad'); }
      c.lines[p.id] = c.lines[p.id] || { q: 0 }; c.lines[p.id].q += q; delete c.lines[p.id]._; var tmp = c.lines[p.id]; delete c.lines[p.id]; c.lines[p.id] = tmp; beep(true); Store.save(); draw();
    };
    if ($('#capply')) $('#capply').onclick = function () {
      Modal.confirm(L('سيتم تعديل أرصدة الأصناف المعدودة فقط لتساوي الكمية المعدودة. متابعة؟', 'Stock of counted products will be set to the counted quantity. Continue?'), function () {
        Object.keys(c.lines).forEach(function (k) { var p = Store.product(k); if (!p) return; c.lines[k].sys = U.n(p.stock); var d = c.lines[k].q - U.n(p.stock); if (d) Store.move(k, d, 'count', c.name); });
        c.applied = true; c.appliedBy = App.user.name; c.appliedAt = Date.now(); Store.log('count.apply', c.name); Store.save(); toast(L('تم اعتماد الجرد ✓', 'Count approved ✓'), 'ok'); V.session(el);
      });
    };
    if ($('#cexp')) $('#cexp').onclick = function () { var rows = [[L('الصنف', 'Product'), L('باركود', 'Barcode'), L('المعدود', 'Counted'), L('بالسيستم', 'System'), L('الفرق', 'Diff')]]; Object.keys(c.lines).forEach(function (k) { var p = Store.product(k); if (!p) return; var sys = c.applied ? c.lines[k].sys : U.n(p.stock); rows.push([p.name, p.barcodes[0], c.lines[k].q, showSys ? sys : '', showSys ? c.lines[k].q - sys : '']); }); saveBlob(XL.writeXlsx(rows, 'Count', lang() !== 'en'), 'count_' + c.no + '.xlsx'); };
    draw(); if ($('#cs')) $('#cs').focus();
  }
};

/* ================= PURCHASES ================= */
Views.purchases = {
  draft: null,
  render: function (el) {
    var V = Views.purchases, db = Store.db;
    if (V.draft) return V.form(el);
    el.innerHTML = '<div class="row" style="margin-bottom:14px"><b class="grow" style="font-size:16px">' + L('فواتير الشراء', 'Purchase invoices') + '</b><button class="btn pri" id="pnew">' + ic('plus') + L('فاتورة شراء', 'New purchase') + '</button></div><div class="tbl-wrap"><table class="t"><tr><th>#</th><th>' + L('التاريخ', 'Date') + '</th><th>' + L('المورد', 'Supplier') + '</th><th>' + L('الأصناف', 'Items') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th>' + L('المدفوع', 'Paid') + '</th><th>' + L('بواسطة', 'By') + '</th></tr>' +
      (db.purchases.length ? db.purchases.slice().reverse().slice(0, 300).map(function (p) { var s = db.suppliers.filter(function (x) { return x.id === p.supplier; })[0]; return '<tr><td class="num">' + p.no + '</td><td class="num">' + U.dt(p.date) + '</td><td>' + U.esc(s ? s.name : '—') + '</td><td class="num">' + p.items.length + '</td><td>' + M(p.total) + '</td><td class="num">' + U.money(p.paid) + '</td><td>' + U.esc(p.by) + '</td></tr>'; }).join('') : '<tr><td colspan="7"><div class="empty">' + L('لا توجد مشتريات بعد', 'No purchases yet') + '</div></td></tr>') + '</table></div>';
    $('#pnew').onclick = function () { V.draft = { supplier: '', items: [], paid: 0, note: '', updCost: true }; V.form(el); };
  },
  form: function (el) {
    var V = Views.purchases, d = V.draft, db = Store.db;
    el.innerHTML = '<div class="grid" style="grid-template-columns:1fr 330px;gap:16px;align-items:start"><div class="card"><div class="row" style="margin-bottom:12px"><div class="scan grow" style="box-shadow:none"><div class="bi">' + ic('barcode') + '</div><input id="ps" placeholder="' + L('امسح باركود الصنف…', 'Scan product barcode…') + '"></div><button class="btn" id="ppick">' + ic('search') + '</button><button class="btn" id="pnewp">' + ic('plus') + L('صنف جديد', 'New item') + '</button></div><div id="pit"></div></div>' +
      '<div class="card col"><label class="f">' + L('المورد', 'Supplier') + '<select class="in" id="psup"><option value="">—</option>' + db.suppliers.map(function (s) { return '<option value="' + s.id + '" ' + (s.id === d.supplier ? 'selected' : '') + '>' + U.esc(s.name) + '</option>'; }).join('') + '</select></label><label class="row small"><input type="checkbox" class="sw" id="pupd" ' + (d.updCost ? 'checked' : '') + '> ' + L('تحديث سعر التكلفة للأصناف', 'Update product cost price') + '</label><div class="card kpi hero"><div class="l">' + L('إجمالي الفاتورة', 'Invoice total') + '</div><div class="v num" id="ptot">0</div></div><label class="f">' + L('المدفوع للمورد', 'Paid to supplier') + '<input class="in num" type="number" id="ppaid" value="' + (d.paid || '') + '"></label><label class="f">' + L('ملاحظات', 'Notes') + '<input class="in" id="pnote" value="' + U.esc(d.note) + '"></label><button class="btn pri lg" id="psave">' + ic('save') + L('حفظ وإضافة للمخزن', 'Save & receive stock') + '</button><button class="btn" id="pcan">' + L('إلغاء', 'Cancel') + '</button></div></div>';
    var total = function () { return d.items.reduce(function (s, i) { return s + i.qty * i.cost; }, 0); };
    var draw = function () {
      $('#pit').innerHTML = d.items.length ? '<table class="t"><tr><th>' + L('الصنف', 'Product') + '</th><th>' + L('الكمية', 'Qty') + '</th><th>' + L('سعر الشراء', 'Unit cost') + '</th><th>' + L('الإجمالي', 'Total') + '</th><th></th></tr>' + d.items.map(function (i, x) { var p = Store.product(i.pid); return '<tr><td><b>' + U.esc(p ? pname(p) : '') + '</b></td><td><input class="in num" style="width:80px" type="number" data-q="' + x + '" value="' + i.qty + '"></td><td><input class="in num" style="width:100px" type="number" data-c="' + x + '" value="' + i.cost + '"></td><td class="num">' + U.money(i.qty * i.cost) + '</td><td><button class="btn ghost sm" data-r="' + x + '">' + ic('x', 15) + '</button></td></tr>'; }).join('') + '</table>' : '<div class="empty">' + L('امسح الأصناف المستلمة', 'Scan received items') + '</div>';
      $$('[data-q]').forEach(function (i) { i.onchange = function () { d.items[+i.dataset.q].qty = U.n(i.value); draw(); }; });
      $$('[data-c]').forEach(function (i) { i.onchange = function () { d.items[+i.dataset.c].cost = U.n(i.value); draw(); }; });
      $$('[data-r]').forEach(function (b) { b.onclick = function () { d.items.splice(+b.dataset.r, 1); draw(); }; });
      $('#ptot').textContent = U.money(total());
    };
    var add = function (p) { var e = d.items.filter(function (i) { return i.pid === p.id; })[0]; if (e) e.qty++; else d.items.push({ pid: p.id, qty: 1, cost: U.n(p.cost) }); beep(true); draw(); };
    $('#ps').onkeydown = function (e) { if (e.key === 'Enter') { var p = Store.byBarcode(this.value); this.value = ''; if (p) add(p); else { beep(false); toast(L('غير موجود — أضفه كصنف جديد', 'Not found — add it as a new product'), 'bad'); } } };
    $('#ppick').onclick = function () { pickProduct(add); };
    $('#pnewp').onclick = function () { if (!can('products.add')) return toast(L('لا تملك صلاحية إضافة أصناف', 'No permission'), 'bad'); Views.products.edit(null); };
    $('#psup').onchange = function () { d.supplier = this.value; }; $('#pupd').onchange = function () { d.updCost = this.checked; };
    $('#ppaid').oninput = function () { d.paid = U.n(this.value); }; $('#pnote').oninput = function () { d.note = this.value; };
    $('#pcan').onclick = function () { V.draft = null; V.render(el); };
    $('#psave').onclick = function () {
      if (!d.items.length) return; var t = U.r2(total()); db.seq.purchase++;
      var rec = { id: U.id(), no: db.seq.purchase, date: Date.now(), supplier: d.supplier, items: d.items, total: t, paid: U.n(d.paid), note: d.note, by: App.user.name };
      d.items.forEach(function (i) { Store.move(i.pid, i.qty, 'purchase', 'P#' + rec.no); if (d.updCost && can('products.editPrice')) { var p = Store.product(i.pid); if (p && i.cost) p.cost = i.cost; } });
      if (d.supplier) { var s = db.suppliers.filter(function (x) { return x.id === d.supplier; })[0]; if (s) s.balance = U.r2(U.n(s.balance) + t - rec.paid); }
      db.purchases.push(rec); Store.log('purchase', 'P#' + rec.no + ' ' + t); Store.save(); V.draft = null; toast(L('تم حفظ فاتورة الشراء وإضافة الكميات ✓', 'Purchase saved, stock received ✓'), 'ok'); V.render(el);
    };
    draw(); $('#ps').focus();
  }
};
