/* Ghandi Home — import products from another program's JSON export
   (name, barcode, cost price, sale price → retail, quantity → stock). Category & sub-category chosen by the user. */
'use strict';

var JImport = {
  // "١٬٤٥٠٫٠ ج.م.‏" → 1450 · "90.0 EGP" → 90 · "-" → null
  num: function (v) {
    if (v == null) return null; if (typeof v === 'number') return isFinite(v) ? v : null;
    var s = String(v).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); });
    s = s.replace(/[‎‏‪-‮ \s]/g, '').replace(/٬/g, '').replace(/٫/g, '.');
    var m = s.match(/-?\d[\d,]*(\.\d+)?/); if (!m) return null;
    var t = m[0]; if (/,\d{3}(\D|$)/.test(t) || (t.match(/,/g) || []).length > 1) t = t.replace(/,/g, ''); else t = t.replace(',', '.');
    var n = parseFloat(t); return isFinite(n) ? n : null;
  },
  txt: function (v) { if (v == null) return ''; var s = String(v).replace(/[‎‏‪-‮]/g, '').trim(); return s === '-' || s === '—' ? '' : s.replace(/\s+/g, ' '); },
  code: function (v) { if (v == null) return ''; if (typeof v === 'number') return isFinite(v) && v > 0 ? String(Math.round(v)) : ''; var s = JImport.txt(v).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/\s/g, ''); return /^[0-9A-Za-z\-]+$/.test(s) && !/^0+$/.test(s) ? s : ''; },
  // find the right keys whatever the exact header wording
  keys: function (rows) {
    var all = {}; rows.slice(0, 50).forEach(function (r) { Object.keys(r || {}).forEach(function (k) { all[k] = 1; }); });
    var ks = Object.keys(all), n = function (k) { return U.norm(String(k)).toLowerCase(); }, find = function (test) { return ks.filter(function (k) { return test(n(k)); })[0] || null; };
    return {
      name: find(function (k) { return /اسم الصنف|اسم المنتج|^الاسم$|product name|item name|^name$/.test(k); }) || find(function (k) { return /اسم|name/.test(k) && !/شرك|company|مورد/.test(k); }),
      barcode: find(function (k) { return /باركود|barcode|upc|ean|isbn/.test(k); }),
      cost: find(function (k) { return /تكلف|cost|شراء/.test(k); }),
      price: find(function (k) { return /^السعر$|سعر البيع|سعر القطاعي|^price$|sale price|selling/.test(k); }) || find(function (k) { return /سعر|price/.test(k) && !/تكلف|cost|شراء|ضريب|tax/.test(k); }),
      qty: find(function (k) { return /كمي|رصيد|qty|quantity|stock/.test(k); })
    };
  },
  parse: function (text) {
    var j = JSON.parse(String(text).replace(/^﻿/, ''));
    var rows = Array.isArray(j) ? j : Array.isArray(j.data) ? j.data : Array.isArray(j.items) ? j.items : Array.isArray(j.products) ? j.products : null;
    if (!rows) throw new Error(L('الملف مش فيه قايمة أصناف (data)', 'No product list (data) in the file'));
    rows = rows.filter(function (r) { return r && typeof r === 'object' && !Array.isArray(r); });
    var K = JImport.keys(rows); if (!K.name && !K.barcode) throw new Error(L('مش لاقي عمود اسم الصنف أو الباركود', 'Could not find the name or barcode columns'));
    var seen = {}, out = rows.map(function (r, i) {
      var o = { i: i + 1, name: K.name ? JImport.txt(r[K.name]) : '', bc: K.barcode ? JImport.code(r[K.barcode]) : '', cost: K.cost ? JImport.num(r[K.cost]) : null, price: K.price ? JImport.num(r[K.price]) : null, qty: K.qty ? JImport.num(r[K.qty]) : null };
      if (!o.name && !o.bc) o.st = 'skip'; else if (o.bc && seen[o.bc]) o.st = 'dupfile'; else if (o.bc && Store.byBarcode(o.bc)) o.st = 'exists'; else o.st = 'new';
      if (o.bc) seen[o.bc] = 1; return o;
    });
    return { K: K, rows: out };
  },
  // rows identical 100% in name and sale price → one product (all barcodes, summed quantity)
  groups: function (rows) {
    var g = {}, order = [];
    rows.forEach(function (r) { if (r.st !== 'new' || !r.name || r.price == null) return; var k = r.name + '\u0001' + r.price; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(r); });
    return order.map(function (k) { return g[k]; }).filter(function (a) { return a.length > 1; });
  },
  open: function () {
    if (!F('jsonImport')) return;
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json,.txt';
    inp.onchange = function () { var f = inp.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { var r; try { r = JImport.parse(rd.result); } catch (e) { return toast('⚠️ ' + L('مقدرتش أقرا الملف: ', 'Cannot read the file: ') + e.message, 'bad'); } JImport.preview(r, f.name); }; rd.readAsText(f, 'utf-8'); };
    inp.click();
  },
  preview: function (R, fname) {
    var rows = R.rows, cnt = function (st) { return rows.filter(function (r) { return r.st === st; }).length; }, K = R.K;
    var lbl = function (k, a, e) { return '<span class="chip ' + (K[k] ? 'ok' : 'warn') + '">' + L(a, e) + ' ← ' + (K[k] ? U.esc(K[k]) : L('مش موجود', 'missing')) + '</span>'; };
    var m = Modal.open({ size: 'wide', title: '📥 ' + L('استيراد أصناف من ملف', 'Import products from a file') + ' — ' + U.esc(fname), body: '<div class="col" style="gap:10px">' +
      '<div class="row wrap" style="gap:6px">' + lbl('name', 'اسم الصنف', 'Name') + lbl('barcode', 'الباركود', 'Barcode') + lbl('cost', 'سعر التكلفة', 'Cost') + lbl('price', 'سعر القطاعي', 'Retail') + lbl('qty', 'الرصيد', 'Stock') + '<span class="chip">' + L('التصنيف والشركة: مش هيتاخدوا', 'Classification & company: ignored') + '</span></div>' +
      '<div class="grid g4"><div class="card kpi hero"><div class="l">🆕 ' + L('أصناف جديدة', 'New products') + '</div><div class="v num">' + cnt('new') + '</div></div><div class="card kpi"><div class="l">♻️ ' + L('الباركود موجود عندك', 'Barcode already exists') + '</div><div class="v num">' + cnt('exists') + '</div></div><div class="card kpi"><div class="l">🔁 ' + L('مكرر في الملف', 'Repeated in file') + '</div><div class="v num">' + cnt('dupfile') + '</div></div><div class="card kpi"><div class="l">⛔ ' + L('من غير اسم وباركود', 'No name & barcode') + '</div><div class="v num">' + cnt('skip') + '</div></div></div>' +
      '<div class="card" style="padding:12px"><div class="grid g2" style="gap:12px;align-items:start"><label class="f">🗂️ ' + L('هتضيفهم في قسم إيه؟ *', 'Which category? *') + '<input class="in" id="jiC"></label><div></div></div>' +
      (function () { var G = JImport.groups(rows), n = G.reduce(function (a, x) { return a + x.length; }, 0); return '<div class="card ji-merge" style="padding:12px"><label class="row"><input type="checkbox" class="sw" id="jiMg"' + (G.length ? ' checked' : '') + '> <b>🔗 ' + L('ادمج الأصناف المتطابقة 100% في الاسم والسعر', 'Merge products identical (100%) in name and price') + '</b></label><div class="muted small" style="margin:4px 0 6px">' + (G.length ? L('لقيت ', 'Found ') + '<b>' + n + '</b>' + L(' صنف هيتدمجوا في ', ' rows that become ') + '<b>' + G.length + '</b>' + L(' صنف — كل صنف بياخد كل الباركودات وبتتجمع كمياتهم.', ' products — each keeps all barcodes and the quantities are added up.') : L('مفيش أصناف متطابقة في الاسم والسعر في الملف ده.', 'No rows share the same name and price in this file.')) + '</div>' + (G.length ? '<details><summary class="small">' + L('شوف الأصناف اللي هتتدمج', 'Show the merges') + '</summary><div class="tbl-wrap" style="max-height:26vh;overflow:auto;margin-top:6px"><table class="t"><tr><th>' + L('الاسم', 'Name') + '</th><th>' + L('السعر', 'Price') + '</th><th>' + L('الباركودات', 'Barcodes') + '</th><th>' + L('الكميات', 'Quantities') + '</th><th>' + L('الكمية بعد الدمج', 'Merged qty') + '</th></tr>' + G.map(function (x) { return '<tr><td><b>' + U.esc(x[0].name) + '</b> <span class="chip">×' + x.length + '</span></td><td class="num">' + U.money(x[0].price) + '</td><td>' + x.map(function (r) { return r.bc ? '<span class="tag">' + U.esc(r.bc) + '</span>' : ''; }).join('') + '</td><td class="num">' + x.map(function (r) { return r.qty != null ? r.qty : 0; }).join(' + ') + '</td><td class="num"><b>' + x.reduce(function (a, r) { return a + Math.max(0, Math.round(r.qty || 0)); }, 0) + '</b></td></tr>'; }).join('') + '</table></div></details>' : '') + '<label class="row small" style="margin-top:8px"><input type="checkbox" class="sw" id="jiMx"> ' + L('ادمج كمان مع أصناف موجودة عندي بنفس الاسم والسعر بالظبط (يضيف الباركودات والكمية عليها)', 'Also merge into my existing products with exactly the same name and retail price') + '</label></div>'; })() +
      '<label class="row small" style="margin-top:8px"><input type="checkbox" class="sw" id="jiUp"> ' + L('الأصناف اللي باركودها موجود عندي: حدّث سعر التكلفة والقطاعي والرصيد بتوعها (بدل ما تتساب)', 'Products whose barcode already exists: update their cost, retail price and stock (instead of skipping)') + '</label></div>' +
      '<div class="tbl-wrap" style="max-height:38vh;overflow:auto"><table class="t"><tr><th>#</th><th>' + L('اسم الصنف', 'Name') + '</th><th>' + L('الباركود', 'Barcode') + '</th><th>' + L('التكلفة', 'Cost') + '</th><th>' + L('القطاعي', 'Retail') + '</th><th>' + L('الرصيد', 'Stock') + '</th><th>' + L('الحالة', 'Status') + '</th></tr>' +
      rows.slice(0, 300).map(function (r) { var st = { 'new': ['ok', 'جديد', 'New'], exists: ['warn', 'موجود', 'Exists'], dupfile: ['', 'مكرر', 'Repeated'], skip: ['bad', 'هيتساب', 'Skipped'] }[r.st]; return '<tr><td class="num muted">' + r.i + '</td><td>' + (r.name ? U.esc(r.name) : '<span class="muted">—</span>') + '</td><td class="num">' + (r.bc ? U.esc(r.bc) : '<span class="muted">' + L('هيتولّد', 'auto') + '</span>') + '</td><td class="num">' + (r.cost != null ? U.money(r.cost) : '—') + '</td><td class="num">' + (r.price != null ? U.money(r.price) : '—') + '</td><td class="num">' + (r.qty != null ? r.qty : '—') + '</td><td><span class="chip ' + st[0] + '">' + L(st[1], st[2]) + '</span></td></tr>'; }).join('') + (rows.length > 300 ? '<tr><td colspan="7" class="muted">… ' + (rows.length - 300) + L(' صنف كمان', ' more') + '</td></tr>' : '') + '</table></div>' +
      '<div class="muted small">' + L('أي خانة فاضية في الملف بتتساب فاضية في الصنف. الصنف اللي مالوش باركود بياخد باركود جديد. القطاعي هو «السعر» في الملف، والكمية بتتسجل رصيد افتتاحي.', 'Empty fields stay empty. Products without a barcode get a new one. Retail = «price» in the file; quantity becomes opening stock.') + '</div></div>',
      foot: '<button class="btn" data-x>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri lg" id="jiGo">📥 ' + L('استيراد', 'Import') + ' (' + cnt('new') + ')</button>' });
    Cats.combo($('#jiC', m), 'jic', ''); var sb = typeof SubBox !== 'undefined' ? SubBox.make(m, 'jic', 'jis') : null; if (sb) sb.set('', false);
    $('[data-x]', m).onclick = function () { Modal.close(m); };
    var upd = function () { var n = cnt('new') - ($('#jiMg', m) && $('#jiMg', m).checked ? JImport.groups(rows).reduce(function (a, x) { return a + x.length - 1; }, 0) : 0) + ($('#jiUp', m).checked ? cnt('exists') : 0); $('#jiGo', m).innerHTML = '📥 ' + L('استيراد', 'Import') + ' (' + n + ')'; }; $('#jiUp', m).onchange = upd; if ($('#jiMg', m)) $('#jiMg', m).onchange = upd; upd();
    $('#jiGo', m).onclick = function () {
      var cat = $('#jic', m).value; if (!cat) { var q = $('.catbox .cb-search', m); if (q) { q.classList.add('req-bad'); q.focus(); } return toast(L('اختار القسم اللي هتضيف فيه الأصناف', 'Pick the category for these products'), 'bad'); }
      var res = JImport.run(rows, cat, sb ? sb.get() : '', $('#jiUp', m).checked, $('#jiMg', m) && $('#jiMg', m).checked, $('#jiMx', m) && $('#jiMx', m).checked); Modal.close(m);
      Modal.open({ title: '✅ ' + L('تم الاستيراد', 'Import finished'), body: '<div class="col"><div class="list-row"><span class="grow">🆕 ' + L('أصناف اتضافت', 'Products added') + '</span><b class="num">' + res.added + '</b></div>' + (res.updated ? '<div class="list-row"><span class="grow">♻️ ' + L('أصناف اتحدّثت', 'Products updated') + '</span><b class="num">' + res.updated + '</b></div>' : '') + (res.merged ? '<div class="list-row"><span class="grow">🔗 ' + L('أصناف اتدمجت (نفس الاسم والسعر)', 'Rows merged (same name & price)') + '</span><b class="num">' + res.merged + L(' ← ', ' → ') + res.mergedInto + '</b></div>' : '') + (res.intoExisting ? '<div class="list-row"><span class="grow">➕ ' + L('اتضافت على أصناف موجودة عندك', 'Added onto existing products') + '</span><b class="num">' + res.intoExisting + '</b></div>' : '') + (res.genBc ? '<div class="list-row"><span class="grow">▥ ' + L('خدت باركود جديد (كانت من غير باركود)', 'Got a new barcode') + '</span><b class="num">' + res.genBc + '</b></div>' : '') + (res.skipped ? '<div class="list-row"><span class="grow">⏭️ ' + L('اتسابت (موجودة أو مكررة أو من غير اسم)', 'Skipped (existing, repeated or nameless)') + '</span><b class="num">' + res.skipped + '</b></div>' : '') + '<div class="list-row"><span class="grow">📦 ' + L('قطع اتضافت للمخزن', 'Pieces added to stock') + '</span><b class="num">' + res.pcs + '</b></div><div class="muted small">' + L('في القسم: ', 'Category: ') + '<b>' + U.esc(cat) + '</b>' + (res.sub ? ' › ' + U.esc(res.sub) : '') + '</div></div>' });
      Views.products.cat = cat; Views.products.open = Views.products.open || {}; Views.products.open[cat] = true; go('products');
    };
  },
  run: function (rows, cat, sub, update, merge, mergeExisting) {
    var db = Store.db, res = { added: 0, updated: 0, skipped: 0, genBc: 0, pcs: 0, sub: sub, merged: 0, mergedInto: 0, intoExisting: 0 }, now = Date.now(); ProdHist.src = 'import';
    // 1) existing barcodes / repeats / nameless
    var fresh = [];
    rows.forEach(function (r) {
      if (r.st === 'skip' || r.st === 'dupfile') { res.skipped++; return; }
      if (r.st === 'exists') {
        if (!update) { res.skipped++; return; }
        var e = Store.byBarcode(r.bc); if (!e) { res.skipped++; return; }
        if (r.cost != null) e.cost = U.r2(r.cost); if (r.price != null) { e.prices = e.prices || [0, 0, 0, 0]; e.prices[0] = U.r2(r.price); }
        var qe = r.qty != null ? Math.max(0, Math.round(r.qty)) : null; if (qe != null && qe !== U.n(e.stock)) Store.move(e.id, qe - U.n(e.stock), 'import', L('استيراد ملف', 'File import'));
        res.updated++; return;
      }
      fresh.push(r);
    });
    // 2) build the product list: merge rows identical in name + price
    var items = [];
    if (merge) { var inG = {}; JImport.groups(fresh).forEach(function (g) { g.forEach(function (r) { inG[r.i] = 1; }); items.push(g); res.merged += g.length; res.mergedInto++; }); fresh.forEach(function (r) { if (!inG[r.i]) items.push([r]); }); items.sort(function (a, b) { return a[0].i - b[0].i; }); }
    else fresh.forEach(function (r) { items.push([r]); });
    var findExisting = function (name, price) { return db.products.filter(function (p) { return String(p.name).replace(/\s+/g, ' ').trim() === name && U.n((p.prices || [])[0]) === U.r2(price); })[0] || null; };
    items.forEach(function (g) {
      var r0 = g[0], bcs = [], qty = 0, cq = 0, cs = 0, costs = [];
      g.forEach(function (r) { if (r.bc && bcs.indexOf(r.bc) < 0) bcs.push(r.bc); var q = r.qty != null ? Math.max(0, Math.round(r.qty)) : 0; qty += q; if (r.cost != null) { costs.push(r.cost); cq += q; cs += q * r.cost; } });
      // cost when merged rows differ: weighted by quantity (plain average if no quantity)
      var cost = costs.length ? (costs.every(function (c) { return c === costs[0]; }) ? costs[0] : (cq ? cs / cq : costs.reduce(function (a, c) { return a + c; }, 0) / costs.length)) : null;
      var ex = mergeExisting && r0.name && r0.price != null ? findExisting(r0.name, r0.price) : null;
      if (ex) {
        bcs.forEach(function (b) { if (!Store.byBarcode(b)) { ex.barcodes.push(b); Store.bcIndex[b] = ex; } });
        if (qty) { Store.move(ex.id, qty, 'import', L('استيراد ملف — دمج', 'File import — merged')); res.pcs += qty; }
        res.intoExisting += g.length; return;
      }
      if (!bcs.length) { bcs.push(Store.newBarcode()); res.genBc++; }
      var p = { id: U.id(), created: now, name: r0.name || bcs[0], nameEn: '', cat: cat, sub: sub || '', brand: '', shade: '', unit: '', barcodes: bcs, cost: cost != null ? U.r2(cost) : 0, prices: [r0.price != null ? U.r2(r0.price) : 0, 0, 0, 0], stock: 0, minStock: 0, expiry: '', active: true };
      db.products.push(p); bcs.forEach(function (b) { Store.bcIndex[b] = p; });
      if (qty) { Store.move(p.id, qty, 'import', L('استيراد ملف', 'File import')); res.pcs += qty; }
      res.added++;
    });
    Store.reindex(); Store.log('import.json', res.added + ' new, ' + res.updated + ' updated, ' + res.merged + ' merged → ' + cat); Store.save(); return res;
  }
};
if (typeof FEATS !== 'undefined') { FEATS.splice(FEATS.findIndex(function (f) { return f[0] === 'excel'; }) + 1, 0, ['jsonImport', '📥', 'استيراد أصناف من ملف برنامج تاني (JSON)', 'Import products from another program (JSON)', 'stock', []]); }
(function () { // button on the products page next to «import»
  var P = Views.products, rd = P.render;
  P.render = function (el) {
    rd.apply(this, arguments);
    if (!F('jsonImport') || !can('import') || $('#jiBtn')) return;
    var ref = $$('#view .btn').filter(function (b) { return /استيراد|Import/.test(b.textContent) && !b.closest('table'); })[0];
    var b = document.createElement('button'); b.className = 'btn'; b.id = 'jiBtn'; b.innerHTML = '📥 ' + L('استيراد من برنامج تاني', 'Import from another program'); b.onclick = JImport.open;
    if (ref) ref.parentNode.insertBefore(b, ref.nextSibling); else { var h = $('#view'); h.insertBefore(b, h.firstChild); }
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.8.4'] = ['🔗 الاستيراد: دمج الأصناف المتطابقة 100% في الاسم والسعر في صنف واحد بكل الباركودات ومجموع الكميات']; Updater.notes['1.8.3'] = ['📥 استيراد الأصناف من ملف برنامج تاني (JSON): الاسم والباركود والتكلفة والسعر والكمية، في القسم اللي تختاره'];
