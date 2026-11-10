/* Ghandi Home — sub-categories (بنود) under each category, blank numbers for new products,
   and a full change history per product with undo. */
'use strict';

/* ================= sub-categories ================= */
var Subs = {
  bulkMove: function (P) {
    var sel = Store.db.products.filter(function (p) { return P.sel[p.id]; }); if (!sel.length) return;
    var m = Modal.open({ title: '🗂️ ' + L('نقل ', 'Move ') + sel.length + L(' صنف', ' products'), body: '<div class="col"><label class="f">' + L('القسم', 'Category') + '<input class="in" id="mvC"></label></div>', foot: '<button class="btn pri" id="mvGo">' + L('نقل', 'Move') + '</button>' });
    Cats.combo($('#mvC', m), 'mvc', sel[0].cat || ''); var sb = SubBox.make(m, 'mvc', 'mvs'); if (sb) sb.set(sel.every(function (p) { return p.sub === sel[0].sub; }) ? sel[0].sub : '');
    $('#mvGo', m).onclick = function () { var c = $('#mvc', m).value, sv = sb ? sb.get() : ''; if (!c) return toast(L('اختار القسم', 'Pick a category'), 'bad'); ProdHist.src = 'move'; sel.forEach(function (p) { p.cat = c; p.sub = sv; }); Store.log('product.move', sel.length + ' → ' + c + (sv ? ' › ' + sv : '')); Store.save(); Modal.close(m); P.sel = {}; toast('🗂️ ' + L('اتنقلوا ✓', 'Moved ✓'), 'ok'); P.table(); };
  },
  SEED: { 'إكسسوارات': ['سلاسل', 'خواتم', 'حلقان', 'أساور', 'خلاخيل', 'توك وإكسسوار شعر'], 'ميك أب': ['روج', 'كحل', 'ماسكرا', 'كريم أساس', 'بودرة', 'ظلال عيون', 'منظفات ومزيل مكياج'], 'عناية بالبشرة': ['غسول', 'سيروم', 'كريمات', 'واقي شمس'], 'برفانات': ['حريمي', 'رجالي', 'بادي سبلاش'], 'شنط': ['شنط يد', 'شنط كتف', 'محافظ'] },
  all: function () { var s = S(); if (!s.subs) { s.subs = {}; (s.categories || []).forEach(function (c) { if (Subs.SEED[c]) s.subs[c] = Subs.SEED[c].slice(); }); } return s.subs; },
  count: function (cat) { var c = {}; Store.db.products.forEach(function (p) { if (p.cat === cat && p.sub) c[p.sub] = (c[p.sub] || 0) + 1; }); return c; },
  list: function (cat) { var a = Subs.all(), arr = (a[cat] || []).slice(), c = Subs.count(cat), idx = {}; arr.forEach(function (x, i) { idx[x] = i; }); return arr.sort(function (x, y) { return (c[y] || 0) - (c[x] || 0) || idx[x] - idx[y]; }); },
  label: function (p) { return (p.cat || '—') + (p.sub ? ' › ' + p.sub : ''); },
  chips: function () { var out = []; Cats.sort().forEach(function (c) { out.push(c); Subs.list(c).forEach(function (s) { out.push(c + ' › ' + s); }); }); return out; },
  add: function (cat, name) { var a = Subs.all(); a[cat] = a[cat] || []; if (a[cat].some(function (x) { return U.norm(x) === U.norm(name); })) return false; a[cat].push(name); Store.log('sub.add', cat + ' › ' + name); Store.save(); return true; },
  rename: function (cat, from, to) { var a = Subs.all(); a[cat][a[cat].indexOf(from)] = to; Store.db.products.forEach(function (p) { if (p.cat === cat && p.sub === from) p.sub = to; }); (Store.db.promos || []).forEach(function (pr) { if (pr.cats) pr.cats = pr.cats.map(function (c) { return c === cat + ' › ' + from ? cat + ' › ' + to : c; }); }); var pin = S().subPin || {}; if (pin[cat] === from) pin[cat] = to; Store.log('sub.rename', cat + ' › ' + from + ' → ' + to); Store.save(); },
  remove: function (cat, name, moveTo) { var a = Subs.all(); a[cat].splice(a[cat].indexOf(name), 1); Store.db.products.forEach(function (p) { if (p.cat === cat && p.sub === name) p.sub = moveTo || ''; }); var pin = S().subPin || {}; if (pin[cat] === name) delete pin[cat]; Store.log('sub.delete', cat + ' › ' + name); Store.save(); }
};
// keep sub-categories in step with category renames / deletes
(function () {
  var rn = Cats.rename; Cats.rename = function (from, to) { var a = Subs.all(); if (a[from]) { a[to] = a[from]; delete a[from]; } rn.apply(this, arguments); };
  var rm = Cats.remove; Cats.remove = function (name, moveTo) { var a = Subs.all(); Store.db.products.forEach(function (p) { if (p.cat === name) p.sub = ''; }); delete a[name]; rm.apply(this, arguments); };
})();
// a searchable pick-list for the sub-category, filtered by the chosen category
var SubBox = {
  make: function (m, catId, id) {
    var catHid = $('#' + catId, m); if (!catHid) return null;
    var box = catHid.closest('.catbox'), lab = box.closest('label') || box.parentNode;
    var wrap = document.createElement('label'); wrap.className = 'f subf'; wrap.innerHTML = '<span>' + L('البند (اختياري)', 'Sub-category (optional)') + '</span><input type="hidden" id="' + id + '"><div class="row" style="gap:6px;align-items:stretch"><div class="catbox-in grow"><input class="in cb-search" autocomplete="off"><button type="button" class="cb-x" tabindex="-1">✕</button><div class="cb-list hide"></div></div><span class="cb-pin" title="' + L('ثبّت البند ده للأصناف الجاية في نفس القسم', 'Keep this sub-category for the next products of this category') + '"><input type="checkbox"> 📌</span></div>';
    lab.parentNode.insertBefore(wrap, lab.nextSibling);
    var hid = $('#' + id, wrap), q = $('.cb-search', wrap), list = $('.cb-list', wrap), pin = $('.cb-pin input', wrap), cur = -1, items = [];
    var pins = function () { var s = S(); if (!s.subPin) s.subPin = {}; return s.subPin; };
    var cat = function () { return catHid.value; };
    var refresh = function () { var c = cat(); q.disabled = !c; q.placeholder = c ? '🔎 ' + L('اكتب حروف من اسم البند…', 'Type to search…') : L('اختار القسم الأول', 'Pick a category first'); pin.disabled = !c; pin.checked = !!(c && hid.value && pins()[c] === hid.value); };
    var set = function (v) { hid.value = v; q.value = v; q.classList.remove('req-bad'); var c = cat(); if (c) { if (pin.checked && v) pins()[c] = v; if (!v && pins()[c]) { delete pins()[c]; } Store.save(); } refresh(); };
    var draw = function () {
      var c = cat(); if (!c) return; var t = U.norm(q.value.trim()), all = Subs.list(c); items = t && q.value !== hid.value ? all.filter(function (x) { return U.norm(x).indexOf(t) >= 0; }) : all; cur = items.length ? 0 : -1;
      list.innerHTML = items.length ? items.map(function (x, i) { return '<div data-i="' + i + '" class="' + (i === cur ? 'on' : '') + (x === hid.value ? ' sel' : '') + '">' + U.esc(x) + (x === hid.value ? ' ✓' : '') + '</div>'; }).join('') : '<div class="muted">' + L('مفيش بنود — ضيفها من صفحة «الأقسام»', 'No sub-categories — add them in «Categories»') + '</div>';
      list.classList.remove('hide');
      $$('[data-i]', list).forEach(function (d) { d.onmousedown = function (e) { e.preventDefault(); set(items[+d.dataset.i]); list.classList.add('hide'); }; });
    };
    q.onfocus = function () { q.select(); draw(); }; q.oninput = draw;
    q.onkeydown = function (e) { var hl = function () { $$('[data-i]', list).forEach(function (d) { d.classList.toggle('on', +d.dataset.i === cur); }); }; if (e.key === 'ArrowDown') { e.preventDefault(); if (cur < items.length - 1) cur++; hl(); } else if (e.key === 'ArrowUp') { e.preventDefault(); if (cur > 0) cur--; hl(); } else if (e.key === 'Enter') { e.preventDefault(); if (items[cur]) { set(items[cur]); list.classList.add('hide'); } } else if (e.key === 'Escape') { list.classList.add('hide'); q.value = hid.value; } };
    q.onblur = function () { setTimeout(function () { list.classList.add('hide'); var ex = Subs.list(cat()).filter(function (x) { return U.norm(x) === U.norm(q.value.trim()); })[0]; if (ex) set(ex); else if (!q.value.trim()) set(''); else q.value = hid.value; }, 120); };
    $('.cb-x', wrap).onclick = function () { set(''); q.focus(); };
    pin.onchange = function () { var c = cat(); if (pin.checked) { if (!hid.value) { pin.checked = false; return toast(L('اختار البند الأول وبعدين ثبّته', 'Pick a sub-category first'), 'bad'); } pins()[c] = hid.value; toast('📌 ' + L('البند «', '«') + hid.value + L('» هيفضل متعلّم عليه مع «', '» stays selected with «') + c + '»', 'ok'); } else delete pins()[c]; Store.save(); };
    catHid.addEventListener('change', function () { var c = cat(); if (hid.value && Subs.list(c).indexOf(hid.value) < 0) { hid.value = ''; q.value = ''; } if (!hid.value && c && pins()[c] && Subs.list(c).indexOf(pins()[c]) >= 0) { hid.value = pins()[c]; q.value = pins()[c]; } refresh(); });
    return { set: function (v, isNew) { var c = cat(); if (!v && isNew && c && pins()[c] && Subs.list(c).indexOf(pins()[c]) >= 0) v = pins()[c]; hid.value = v || ''; q.value = v || ''; refresh(); }, get: function () { return hid.value; } };
  }
};

/* ================= product form: sub-category, blank numbers, history link ================= */
(function () {
  var P = Views.products, edit = P.edit;
  P.edit = function (p) {
    ProdHist.src = 'form';
    edit.apply(this, arguments);
    var m = $$('.mask').pop(); if (!m || !$('#fsave', m)) return;
    var before = Store.db.products.length;
    var sb = SubBox.make(m, 'fc', 'fsub'); if (sb) sb.set(p ? p.sub : '', !p);
    if (!p) { $$('[data-pr], #fcost, #fst', m).forEach(function (i) { i.value = ''; i.placeholder = '0'; }); }
    else { var b = document.createElement('button'); b.className = 'btn'; b.innerHTML = '📜 ' + L('حركات الصنف', 'Product history'); b.onclick = function () { ProdHist.open(p); }; var f = $('#fsave', m).parentNode; f.insertBefore(b, f.firstChild); }
    // after the original save runs: store the sub-category on the saved product
    $('#fsave', m).addEventListener('click', function () {
      var t = p || (Store.db.products.length > before ? Store.db.products[Store.db.products.length - 1] : null); if (!t || !sb) return;
      var v = sb.get(); if ((t.sub || '') !== v) { t.sub = v; Store.save(); }
    });
  };
  var qa = Views.purchases.quickAdd;
  if (qa) Views.purchases.quickAdd = function () {
    var r = qa.apply(this, arguments), m = $$('.mask').pop(); if (!m || !$('#qsave', m)) return r;
    var before = Store.db.products.length, sb = SubBox.make(m, 'qc', 'qsub'); if (sb) sb.set('', true);
    $$('[data-qp], #qcost', m).forEach(function (i) { if (U.n(i.value) === 0) { i.value = ''; i.placeholder = '0'; } });
    $('#qsave', m).addEventListener('click', function () { var t = Store.db.products.length > before ? Store.db.products[Store.db.products.length - 1] : null; if (t && sb && sb.get()) { t.sub = sb.get(); Store.save(); } });
    return r;
  };
})();
if (typeof REQ_FIELDS !== 'undefined') REQ_FIELDS.splice(8, 0, ['sub', '🗂️', 'البند', 'Sub-category', '#fsub', '#qsub', 'text']);

/* ================= products page: sub filter, grouped by category › sub, bulk move ================= */
(function () {
  var P = Views.products, list = P.list;
  P.list = function () {
    var out = list.apply(this, arguments);
    if (P.sub) out = out.filter(function (p) { return (p.sub || '') === (P.sub === '__none' ? '' : P.sub); });
    if (!P.q && (!P.df || P.df.r === 'all')) { // group: category order (most used) › sub order › name
      var co = {}; Cats.sort().forEach(function (c, i) { co[c] = i; }); var so = {};
      out = out.slice().sort(function (a, b) { var ca = co[a.cat] != null ? co[a.cat] : 999, cb = co[b.cat] != null ? co[b.cat] : 999; if (ca !== cb) return ca - cb; if ((a.sub || '') !== (b.sub || '')) { if (!a.sub) return 1; if (!b.sub) return -1; var k = a.cat; so[k] = so[k] || Subs.list(k); return so[k].indexOf(a.sub) - so[k].indexOf(b.sub); } return String(a.name).localeCompare(String(b.name), 'ar'); });
    }
    return out;
  };
  var render = P.render;
  P.render = function (el) {
    render.apply(this, arguments);
    var pc = $('#pc'); if (!pc || $('#psub')) return;
    var s = document.createElement('select'); s.className = 'in'; s.id = 'psub'; s.style.width = '160px';
    var fill = function () { var subs = P.cat ? Subs.list(P.cat) : []; s.innerHTML = '<option value="">' + L('كل البنود', 'All sub-categories') + '</option>' + subs.map(function (x) { return '<option' + (x === P.sub ? ' selected' : '') + '>' + U.esc(x) + '</option>'; }).join('') + (P.cat ? '<option value="__none"' + (P.sub === '__none' ? ' selected' : '') + '>' + L('بدون بند', 'No sub-category') + '</option>' : ''); s.disabled = !P.cat; };
    pc.parentNode.insertBefore(s, pc.nextSibling); fill();
    pc.addEventListener('change', function () { P.sub = ''; fill(); });
    s.onchange = function () { P.sub = s.value; P.page = 0; P.table(); };
  };
  // grouped mode (no search / date filter): categories fold & unfold, sub-categories listed one under another
  P.open = P.open || {};
  var grouped = function () { return !P.q && (!P.df || P.df.r === 'all'); };
  P.tableList = function () { var l = P.list(); if (!grouped()) { P.per = 100; return l; } P.per = 1e9; return l.filter(function (p) { return P.open[p.cat || ''] || (P.cat && p.cat === P.cat); }); };
  var tb = P.table;
  P.table = function () {
    tb.apply(this, arguments);
    var t = $('#pt table'); if (!t) return;
    // «البند» column right after «القسم»
    var hr = t.tHead ? t.tHead.rows[0] : t.rows[0], ci = -1; for (var i = 0; i < hr.cells.length; i++) if (/^(القسم|Category)$/.test(hr.cells[i].textContent.trim())) ci = i;
    if (ci >= 0 && !$('.th-sub', hr)) { var th = document.createElement('th'); th.className = 'th-sub'; th.textContent = L('البند', 'Sub-category'); hr.insertBefore(th, hr.cells[ci + 1]); }
    var rows = $$('#pt tr[data-id]');
    rows.forEach(function (r) {
      var p = Store.product(r.dataset.id); if (!p) return;
      if (ci >= 0) { var td = r.insertCell(ci + 1); td.innerHTML = p.sub ? '<span class="sub-tag">' + U.esc(p.sub) + '</span>' : '<span class="muted">—</span>'; }
      var tmr; r.addEventListener('click', function (e) { if (e.target.closest('button, input, a, select')) return; clearTimeout(tmr); tmr = setTimeout(function () { ProdHist.open(p); }, 260); });
      r.addEventListener('dblclick', function () { clearTimeout(tmr); });
      var act = r.cells[r.cells.length - 1]; if (act && !$('[data-h]', act)) { var b = document.createElement('button'); b.className = 'btn ghost sm'; b.dataset.h = '1'; b.title = L('حركات الصنف', 'Product history'); b.textContent = '📜'; b.onclick = function () { ProdHist.open(p); }; act.insertBefore(b, act.firstChild); }
    });
    $$('#pt tr:not([data-id]) td[colspan]').forEach(function (c) { if (!c.closest('.grp-row')) c.colSpan = c.colSpan + 1; });
    if (!grouped()) return;
    // rebuild the body: every category header (folded or open), and inside an open one its sub-categories one under another
    var body = t.tBodies[0] || t, cols = hr.cells.length, full = P.list(), byId = {}, cats = [], info = {};
    rows.forEach(function (r) { byId[r.dataset.id] = r; });
    full.forEach(function (p) { var c = p.cat || ''; if (!info[c]) { info[c] = { n: 0, pcs: 0, subs: {} }; cats.push(c); } info[c].n++; info[c].pcs += Math.max(0, U.n(p.stock)); var s = p.sub || ''; info[c].subs[s] = (info[c].subs[s] || 0) + 1; });
    var vc = can('products.viewCost'), kinds = [], first = -1;
    for (var k = 0; k < hr.cells.length; k++) { var tx = hr.cells[k].textContent.trim(), kd = null; if (vc && /^(التكلفة|Cost)$/.test(tx)) kd = 'cost'; else if (/^(الرصيد|Stock)$/.test(tx)) kd = 'stock'; else [0, 1, 2, 3].forEach(function (ti) { if (S().tiers[ti] && tx === tierName(ti)) kd = 't' + ti; }); kinds.push(kd); if (kd && first < 0) first = k; }
    var sums = {}, add = function (key, p) { var q = Math.max(0, ownQty(p)), o = sums[key] = sums[key] || { cost: 0, stock: 0, t0: 0, t1: 0, t2: 0, t3: 0 }; o.stock += q; o.cost += q * U.n(p.cost); [0, 1, 2, 3].forEach(function (ti) { o['t' + ti] += q * priceOf(p, ti); }); };
    full.forEach(function (p) { add('c|' + (p.cat || ''), p); add('s|' + (p.cat || '') + '|' + (p.sub || ''), p); });
    var cellsHtml = function (label, key, cls) { var o = sums[key] || {}; if (first < 0) return '<td colspan="' + cols + '">' + label + '</td>'; var h = '<td colspan="' + first + '">' + label + '</td>'; for (var j = first; j < cols; j++) { var kd = kinds[j]; h += '<td class="num gv' + (cls || '') + '">' + (kd === 'stock' ? '<b>' + (o.stock || 0) + '</b>' : kd ? U.money(o[kd] || 0) : '') + '</td>'; } return h; };
    $$('tr', body).forEach(function (r) { if (!r.closest('thead')) r.remove(); });
    if (!cats.length) { body.innerHTML = '<tr><td colspan="' + cols + '"><div class="empty">' + L('لا توجد أصناف', 'No products') + '</div></td></tr>'; return; }
    cats.forEach(function (c) {
      var open = !!(P.open[c] || (P.cat && P.cat === c)), I = info[c], h = document.createElement('tr'); h.className = 'grp-cat' + (open ? ' open' : '');
      h.innerHTML = cellsHtml('<span class="gc-arrow">' + (open ? '▾' : '◂') + '</span> ' + (kit() ? catEmoji(c) + ' ' : '') + '<b>' + U.esc(c || L('بدون قسم', 'No category')) + '</b> <span class="chip">' + I.n + L(' صنف', ' products') + '</span> <span class="muted small">' + I.pcs + L(' قطعة', ' pcs') + (Object.keys(I.subs).filter(Boolean).length ? ' · ' + Object.keys(I.subs).filter(Boolean).length + L(' بند', ' subs') : '') + '</span>', 'c|' + c);
      h.onclick = function () { P.open[c] = !open; if (!P.open[c] && P.cat === c) { P.cat = ''; var pc = $('#pc'); if (pc) pc.value = ''; } P.table(); };
      body.appendChild(h);
      if (!open) return;
      var last = null;
      full.forEach(function (p) {
        if ((p.cat || '') !== c || !byId[p.id]) return; var s = p.sub || '';
        if (s !== last) { var sh = document.createElement('tr'); sh.className = 'grp-sub'; sh.innerHTML = cellsHtml('　' + (s ? '› <b>' + U.esc(s) + '</b>' : '<span class="muted">' + L('بدون بند', 'No sub-category') + '</span>') + ' <span class="chip">' + I.subs[s] + '</span>', 's|' + c + '|' + s, ' gs'); body.appendChild(sh); last = s; }
        body.appendChild(byId[p.id]);
      });
    });
    var pg = $('#pg'); if (pg) pg.innerHTML = '<span class="muted small">' + full.length + ' ' + L('صنف', 'products') + ' · ' + cats.length + L(' قسم', ' categories') + '</span> <button class="btn sm ghost" id="gOpen">▾ ' + L('فتح الكل', 'Expand all') + '</button><button class="btn sm ghost" id="gClose">◂ ' + L('طي الكل', 'Collapse all') + '</button>';
    if ($('#gOpen')) { $('#gOpen').onclick = function () { cats.forEach(function (c) { P.open[c] = true; }); P.table(); }; $('#gClose').onclick = function () { P.open = {}; P.cat = ''; var pc = $('#pc'); if (pc) pc.value = ''; P.table(); }; }
  };
})();

/* ================= categories page: sub-categories under each category ================= */
(function () {
  var rd = Views.cats.render;
  Views.cats.open = Views.cats.open || {};
  Views.cats.render = function (el) {
    rd.apply(this, arguments); var V = Views.cats;
    var th = $('table.t tr', el); if (th) { var h = document.createElement('th'); h.textContent = L('البنود', 'Sub-categories'); th.insertBefore(h, th.cells[2]); }
    $$('tr[data-c]', el).forEach(function (tr) {
      var c = tr.dataset.c, subs = Subs.list(c), cnt = Subs.count(c), td = tr.insertCell(2);
      td.innerHTML = '<button class="btn sm ghost" data-sx>' + (V.open[c] ? '▾' : '▸') + ' ' + subs.length + L(' بند', ' subs') + '</button>';
      $('[data-sx]', td).onclick = function () { V.open[c] = !V.open[c]; V.render(el); };
      if (!V.open[c]) return;
      var row = document.createElement('tr'); row.className = 'sub-row'; row.innerHTML = '<td></td><td colspan="5"><div class="sub-wrap">' + subs.map(function (s) { return '<span class="sub-chip" data-s="' + U.esc(s) + '">' + U.esc(s) + ' <span class="chip">' + (cnt[s] || 0) + '</span> <button class="btn ghost sm" data-a="ren">✏️</button><button class="btn ghost sm" data-a="del" style="color:var(--bad)">✕</button></span>'; }).join('') + '<span class="row" style="gap:6px"><input class="in" data-new placeholder="➕ ' + L('بند جديد في ', 'New sub-category in ') + U.esc(c) + '" style="width:220px"><button class="btn sm pri" data-add>' + L('إضافة', 'Add') + '</button></span></div></td>';
      tr.parentNode.insertBefore(row, tr.nextSibling);
      var add = function () { var v = $('[data-new]', row).value.trim().replace(/\s+/g, ' '); if (!v) return; if (!Subs.add(c, v)) return toast(L('البند ده موجود', 'Already exists'), 'bad'); toast(L('اتضاف ✓', 'Added ✓'), 'ok'); V.render(el); setTimeout(function () { var r2 = $$('.sub-row', el).filter(function (x) { return x.previousSibling && x.previousSibling.dataset && x.previousSibling.dataset.c === c; })[0]; if (r2) $('[data-new]', r2).focus(); }, 30); };
      $('[data-add]', row).onclick = add; $('[data-new]', row).onkeydown = function (e) { if (e.key === 'Enter') add(); };
      $$('.sub-chip', row).forEach(function (ch) {
        var s = ch.dataset.s;
        $('[data-a="ren"]', ch).onclick = function () { Modal.prompt(L('تعديل اسم البند', 'Rename sub-category'), L('الاسم الجديد', 'New name'), s, function (v) { v = String(v || '').trim(); if (!v || v === s) return; if (Subs.list(c).some(function (x) { return x !== s && U.norm(x) === U.norm(v); })) return toast(L('الاسم موجود', 'Name exists'), 'bad'); Subs.rename(c, s, v); V.render(el); }); };
        $('[data-a="del"]', ch).onclick = function () {
          var n = cnt[s] || 0; if (!n) return Modal.confirm(L('حذف البند «', 'Delete «') + U.esc(s) + '»؟', function () { Subs.remove(c, s); V.render(el); });
          var m = Modal.open({ title: '🗑️ ' + L('حذف البند «', 'Delete «') + U.esc(s) + '»', body: '<div class="col"><div>' + L('البند ده فيه ', 'It has ') + '<b>' + n + '</b>' + L(' صنف. تنقلهم لأنهي بند؟', ' products. Move them to:') + '</div><select class="in" id="sbMv"><option value="">' + L('بدون بند', 'No sub-category') + '</option>' + Subs.list(c).filter(function (x) { return x !== s; }).map(function (x) { return '<option>' + U.esc(x) + '</option>'; }).join('') + '</select></div>', foot: '<button class="btn" id="sbGo" style="color:var(--bad)">' + L('حذف ونقل', 'Delete & move') + '</button>' });
          $('#sbGo', m).onclick = function () { Subs.remove(c, s, $('#sbMv', m).value); Modal.close(m); V.render(el); };
        };
      });
    });
  };
})();

/* ================= POS: sub-category chips under the category chips ================= */
(function () {
  var rd = Views.pos.render;
  Views.pos.render = function (el) {
    var P = Views.pos; P.sub = ''; rd.apply(this, arguments);
    var cats = $('.cats'); if (!cats) return;
    var row = document.createElement('div'); row.className = 'cats subs-row hide'; cats.parentNode.insertBefore(row, cats.nextSibling);
    var draw = function () { var subs = P.cat ? Subs.list(P.cat).filter(function (s) { return Store.db.products.some(function (p) { return p.cat === P.cat && p.sub === s && p.active !== false && U.n(p.stock) > 0; }); }) : []; row.classList.toggle('hide', !subs.length); row.innerHTML = '<button data-s="" class="' + (!P.sub ? 'on' : '') + '">' + L('كل ', 'All ') + U.esc(P.cat || '') + '</button>' + subs.map(function (s) { return '<button data-s="' + U.esc(s) + '" class="' + (P.sub === s ? 'on' : '') + '">' + U.esc(s) + '</button>'; }).join(''); $$('button', row).forEach(function (b) { b.onclick = function () { P.sub = b.dataset.s; draw(); P.tiles(); }; }); };
    $$('button', cats).forEach(function (b) { b.addEventListener('click', function () { P.sub = ''; draw(); P.tiles(); }); });
    draw();
  };
})();

/* ================= offers & bulk prices can target a sub-category ================= */
(function () {
  var m0 = Promo.matches; Promo.matches = function (x, p) { if (x.scope === 'cat' && p.sub && (x.cats || []).indexOf(p.cat + ' › ' + p.sub) >= 0) return true; return m0.apply(this, arguments); };
})();

/* ================= reports: stock value & sales by sub-category ================= */
(function () {
  var R = Views.reports, rr = R.render;
  R.render = function (el) {
    rr.apply(this, arguments); var body = $('#rBody'); if (!body) return;
    if (R.tab === 'sales') {
      var cardCat = $$('#rBody .card h3').filter(function (h) { return /حسب القسم|By category/.test(h.textContent); })[0]; if (!cardCat) return;
      var rg = rangeMs(R.st), agg = {};
      salesIn(rg[0], rg[1]).forEach(function (s) { var sg = s.type === 'return' ? -1 : 1; s.items.forEach(function (i) { var p = Store.product(i.pid); if (!p || !p.sub) return; var k = p.cat + ' › ' + p.sub; agg[k] = agg[k] || { q: 0, v: 0 }; agg[k].q += sg * i.qty; agg[k].v += sg * i.qty * i.price; }); });
      var keys = Object.keys(agg).sort(function (a, b) { return agg[b].v - agg[a].v; }); if (!keys.length) return;
      var c = document.createElement('div'); c.className = 'card'; c.style.marginTop = '14px';
      c.innerHTML = '<h3>🗂️ ' + L('حسب البند', 'By sub-category') + '</h3>' + keys.map(function (k) { return '<div class="list-row"><span class="grow">' + U.esc(k) + ' <span class="muted small">× ' + agg[k].q + '</span></span><b class="num">' + U.money(agg[k].v) + '</b></div>'; }).join('');
      var host = cardCat.closest('.card'); host.parentNode.insertBefore(c, host.nextSibling);
    }
    if (R.tab === 'stock') {
      var tbl = $('#rBody table.t'); if (!tbl) return; var vc = can('products.viewCost'), tiers = StockVal.calc([]).tiers;
      $$('tr', tbl).slice(1).forEach(function (tr) {
        var cat = tr.cells[0].textContent.trim(), ps = Store.db.products.filter(function (p) { return p.active !== false && (p.cat || '—') === cat && p.sub; }); if (!ps.length) return;
        var subs = {}; ps.forEach(function (p) { (subs[p.sub] = subs[p.sub] || []).push(p); });
        Object.keys(subs).sort().reverse().forEach(function (s) { var r = StockVal.calc(subs[s]); if (!r.n) return; var x = document.createElement('tr'); x.className = 'sub-val'; x.innerHTML = '<td>　› ' + U.esc(s) + '</td><td class="num">' + r.n + '</td><td class="num">' + r.pcs + '</td>' + (vc ? '<td class="num">' + U.money(r.cost) + '</td>' : '') + r.tiers.map(function (i) { var v = r.v[i] || 0; return '<td class="num">' + U.money(v) + '</td>' + (vc ? '<td class="num" style="color:var(--ok)">' + U.money(v - r.cost) + '</td>' : ''); }).join(''); tr.parentNode.insertBefore(x, tr.nextSibling); });
      });
    }
  };
})();

/* ================= Excel: «البند» column ================= */
(function () {
  if (typeof PCOLS !== 'undefined') PCOLS.push(['sub', 'البند', 'Sub-category']);
})();

/* ================= product history: who changed what, when — with undo ================= */
var ProdHist = {
  F: [['name', 'الاسم', 'Name'], ['nameEn', 'الاسم بالإنجليزي', 'English name'], ['cat', 'القسم', 'Category'], ['sub', 'البند', 'Sub-category'], ['brand', 'الماركة', 'Brand'], ['shade', 'اللون', 'Shade'], ['cost', 'سعر التكلفة', 'Cost'], ['p0', 'سعر القطاعي', 'Retail price'], ['p1', 'سعر نص الجملة', 'Half-wholesale'], ['p2', 'سعر الجملة', 'Wholesale'], ['p3', 'السعر الخاص', 'Special price'], ['minStock', 'حد الطلب', 'Reorder level'], ['expiry', 'الصلاحية', 'Expiry'], ['active', 'الحالة', 'Status'], ['barcodes', 'الباركود', 'Barcodes'], ['img', 'الصورة', 'Photo']],
  SRC: { form: ['✏️', 'تعديل الصنف', 'Product edited'], prices: ['🏷️', 'تعديل أسعار جماعي', 'Bulk price edit'], purchases: ['🚚', 'استلام بضاعة', 'Goods receiving'], products: ['✏️', 'تعديل الصنف', 'Product edited'], move: ['🗂️', 'نقل لقسم/بند', 'Moved'], import: ['📥', 'استيراد من ملف', 'Imported'], undo: ['↩️', 'تراجع عن تعديل', 'Undo'], create: ['🆕', 'إضافة الصنف', 'Product created'], del: ['🗑️', 'حذف الصنف', 'Deleted'], restore: ['♻️', 'استرجاع الصنف', 'Restored'], other: ['✏️', 'تعديل', 'Change'] },
  last: null, src: '', t0: 0,
  pick: function (p) { var o = {}; ProdHist.F.forEach(function (f) { var k = f[0], v; if (/^p\d$/.test(k)) v = U.n((p.prices || [])[+k[1]]); else if (k === 'barcodes') v = (p.barcodes || []).join(' | '); else if (k === 'img') v = p.img ? String(p.img.length) + ':' + p.img.slice(-24) : ''; else if (k === 'active') v = p.active !== false; else if (k === 'cost' || k === 'minStock') v = U.n(p[k]); else v = p[k] == null ? '' : String(p[k]); o[k] = v; }); return o; },
  init: function () { ProdHist.last = {}; ProdHist.t0 = Date.now(); Store.db.products.forEach(function (p) { ProdHist.last[p.id] = ProdHist.pick(p); }); },
  push: function (p, e) { e.t = e.t || Date.now(); e.by = e.by || (App.user ? App.user.name : ''); (p.hist = p.hist || []).push(e); if (p.hist.length > 150) p.hist.splice(0, p.hist.length - 150); },
  scan: function () {
    if (!ProdHist.last || !Store.db || !App.user) return;
    var src = ProdHist.src || (App.view === 'prices' ? 'prices' : App.view === 'purchases' ? 'purchases' : App.view === 'products' ? 'products' : 'other');
    Store.db.products.forEach(function (p) {
      var cur = ProdHist.pick(p), prev = ProdHist.last[p.id];
      if (!prev) { if ((p.created || 0) >= ProdHist.t0 - 5000 && !(p.hist || []).length) ProdHist.push(p, { k: 'create' }); ProdHist.last[p.id] = cur; return; }
      var ch = []; ProdHist.F.forEach(function (f) { if (String(prev[f[0]]) !== String(cur[f[0]])) ch.push({ f: f[0], from: prev[f[0]], to: cur[f[0]] }); });
      if (ch.length) { ProdHist.push(p, { k: src, ch: ch }); ProdHist.last[p.id] = cur; }
    });
    ProdHist.src = '';
  },
  show: function (f, v) { if (f === 'active') return v === true || v === 'true' ? L('شغّال', 'Active') : L('موقوف', 'Stopped'); if (f === 'img') return v ? '📷' : '—'; if (v === '' || v == null) return '—'; return /^(cost|minStock|p\d)$/.test(f) ? U.money(v) : String(v); },
  apply: function (p, f, v) { if (/^p\d$/.test(f)) { p.prices = p.prices || [0, 0, 0, 0]; p.prices[+f[1]] = U.n(v); } else if (f === 'barcodes') { p.barcodes = String(v || '').split(' | ').filter(Boolean).filter(function (b) { var o = Store.byBarcode(b); return !o || o === p; }); if (!p.barcodes.length) p.barcodes = [Store.newBarcode()]; } else if (f === 'active') p.active = v === true || v === 'true'; else if (f === 'cost' || f === 'minStock') p[f] = U.n(v); else if (f !== 'img') p[f] = v; },
  undo: function (p, e, done) {
    var ch = (e.ch || []).filter(function (c) { return c.f !== 'img'; }); if (!ch.length) return;
    var now = ProdHist.pick(p), changed = ch.filter(function (c) { return String(now[c.f]) !== String(c.to); });
    Modal.confirm('<b>' + L('تتراجع عن التعديل ده؟', 'Undo this change?') + '</b><div style="margin-top:8px">' + ch.map(function (c) { var F = ProdHist.F.filter(function (x) { return x[0] === c.f; })[0]; return '<div class="list-row"><span class="grow">' + L(F[1], F[2]) + '</span><b class="num">' + U.esc(ProdHist.show(c.f, c.to)) + '</b> ← <b class="num" style="color:var(--ok)">' + U.esc(ProdHist.show(c.f, c.from)) + '</b></div>'; }).join('') + '</div>' + (changed.length ? '<div class="chip warn" style="white-space:normal;margin-top:8px">⚠️ ' + L('فيه حاجات اتعدّلت تاني بعد التعديل ده — التراجع هيرجّعها للقيمة القديمة برضو', 'Some of these were changed again later — undo will still restore the old values') + '</div>' : ''), function () {
      ProdHist.src = 'undo'; ch.forEach(function (c) { ProdHist.apply(p, c.f, c.from); }); e.undone = { t: Date.now(), by: App.user ? App.user.name : '' };
      Store.reindex(); Store.log('product.undo', p.name); Store.save(); ProdHist.scan(); toast('↩️ ' + L('اتراجعنا عن التعديل ✓', 'Change undone ✓'), 'ok'); done && done();
    });
  },
  open: function (p, tab) {
    ProdHist.scan(); tab = tab || 'h';
    var KM = { sale: ['🛒', 'بيع', 'Sale'], 'return': ['↩️', 'مرتجع', 'Return'], purchase: ['🚚', 'استلام', 'Received'], open: ['🆕', 'رصيد افتتاحي', 'Opening'], adjust: ['✏️', 'تعديل يدوي', 'Manual'], count: ['📋', 'جرد', 'Count'], 'import': ['📥', 'إكسيل', 'Excel'], void: ['🚫', 'إلغاء فاتورة', 'Void'], reserve: ['📌', 'حجز', 'Reserved'], unreserve: ['📌', 'إلغاء حجز', 'Unreserved'], sreturn: ['↪️', 'مرتجع للمورد', 'To supplier'], 'delete': ['🗑️', 'حذف', 'Deleted'], restore: ['♻️', 'استرجاع', 'Restored'], undo: ['↩️', 'تراجع', 'Undo'] };
    var hist = (p.hist || []).slice().reverse(), moves = Store.db.moves.filter(function (x) { return x.p === p.id; }).slice().reverse().slice(0, 300), canE = can('products.edit') || can('products.editPrice');
    var m = Modal.open({ size: 'wide', title: '📜 ' + L('حركات الصنف — ', 'Product history — ') + U.esc(pname(p)), body: '<div class="row" style="margin-bottom:10px"><div class="seg" id="phT"><button data-t="h" class="' + (tab === 'h' ? 'on' : '') + '">✏️ ' + L('التعديلات', 'Changes') + ' <span class="chip">' + hist.length + '</span></button><button data-t="m" class="' + (tab === 'm' ? 'on' : '') + '">📦 ' + L('حركات المخزن', 'Stock movements') + ' <span class="chip">' + moves.length + '</span></button></div><div class="grow"></div><span class="muted small">' + U.esc(Subs.label(p)) + ' · ' + L('الرصيد ', 'stock ') + '<b class="num">' + U.n(p.stock) + '</b></span></div><div id="phB" style="max-height:60vh;overflow:auto"></div>',
      foot: (canE && Store.db.products.indexOf(p) >= 0 ? '<button class="btn" id="phE">✏️ ' + L('تعديل الصنف', 'Edit product') + '</button>' : '') });
    var draw = function () {
      var b = $('#phB', m);
      if (tab === 'h') b.innerHTML = hist.length ? hist.map(function (e, i) { var S0 = ProdHist.SRC[e.k] || ProdHist.SRC.other; return '<div class="ph-e' + (e.undone ? ' undone' : '') + '"><div class="row"><b>' + S0[0] + ' ' + L(S0[1], S0[2]) + '</b><span class="muted small">' + U.esc(e.by || '') + ' · <span class="num">' + U.dt(e.t) + '</span></span><div class="grow"></div>' + (e.undone ? '<span class="chip">↩️ ' + L('اتراجع عنه ', 'undone ') + U.esc(e.undone.by) + ' · ' + U.dt(e.undone.t) + '</span>' : (canE && e.ch && e.ch.some(function (c) { return c.f !== 'img'; }) && Store.db.products.indexOf(p) >= 0 ? '<button class="btn sm" data-u="' + i + '">↩️ ' + L('تراجع', 'Undo') + '</button>' : '')) + '</div>' + (e.ch ? e.ch.map(function (c) { var F = ProdHist.F.filter(function (x) { return x[0] === c.f; })[0] || [c.f, c.f, c.f]; var vc = can('products.viewCost') || c.f !== 'cost'; return '<div class="ph-c"><span>' + L(F[1], F[2]) + '</span><span class="num">' + (vc ? U.esc(ProdHist.show(c.f, c.from)) : '•••') + '</span><span>←</span><b class="num">' + (vc ? U.esc(ProdHist.show(c.f, c.to)) : '•••') + '</b></div>'; }).join('') : '') + '</div>'; }).join('') : '<div class="empty"><span class="em">📜</span>' + L('لسه مفيش تعديلات متسجلة على الصنف ده', 'No changes recorded yet') + '</div>';
      else b.innerHTML = moves.length ? '<table class="t"><tr><th>' + L('التاريخ', 'Date') + '</th><th>' + L('الحركة', 'Movement') + '</th><th>' + L('الكمية', 'Qty') + '</th><th>' + L('الرصيد بعدها', 'Stock after') + '</th><th>' + L('مرجع', 'Ref') + '</th><th>' + L('بواسطة', 'By') + '</th><th></th></tr>' + moves.map(function (x, i) { var k = KM[x.k] || ['•', x.k, x.k]; return '<tr><td class="num">' + U.dt(x.t) + '</td><td>' + k[0] + ' ' + L(k[1], k[2]) + '</td><td class="num" style="font-weight:800;color:' + (x.q > 0 ? 'var(--ok)' : 'var(--bad)') + '">' + (x.q > 0 ? '+' : '') + x.q + '</td><td class="num">' + (x.s != null ? x.s : '') + '</td><td>' + U.esc(x.r || '') + '</td><td>' + U.esc(x.u || '') + '</td><td>' + (x.k === 'adjust' && !x.undone && can('stock.apply') && Store.db.products.indexOf(p) >= 0 ? '<button class="btn sm" data-mu="' + i + '">↩️ ' + L('تراجع', 'Undo') + '</button>' : (x.undone ? '<span class="chip">↩️</span>' : '')) + '</td></tr>'; }).join('') + '</table>' : '<div class="empty"><span class="em">📦</span>' + L('مفيش حركات', 'No movements') + '</div>';
      $$('[data-u]', b).forEach(function (bt) { bt.onclick = function () { ProdHist.undo(p, hist[+bt.dataset.u], function () { hist = (p.hist || []).slice().reverse(); draw(); }); }; });
      $$('[data-mu]', b).forEach(function (bt) { bt.onclick = function () { var x = moves[+bt.dataset.mu]; Modal.confirm(L('تتراجع عن تعديل الرصيد ده (', 'Undo this stock adjustment (') + (x.q > 0 ? '+' : '') + x.q + L(')؟ الرصيد هيبقى ', ')? Stock becomes ') + (U.n(p.stock) - x.q), function () { Store.move(p.id, -x.q, 'undo', L('تراجع عن تعديل ', 'Undo adjustment ') + U.dt(x.t)); x.undone = { t: Date.now(), by: App.user.name }; Store.log('stock.undo', p.name + ' ' + (-x.q)); Store.save(); toast('↩️ ' + L('اتراجعنا ✓', 'Undone ✓'), 'ok'); moves = Store.db.moves.filter(function (y) { return y.p === p.id; }).slice().reverse().slice(0, 300); draw(); }); }; });
    };
    $$('#phT button', m).forEach(function (bt) { bt.onclick = function () { tab = bt.dataset.t; $$('#phT button', m).forEach(function (x) { x.classList.toggle('on', x === bt); }); draw(); }; });
    if ($('#phE', m)) $('#phE', m).onclick = function () { Modal.close(m); Views.products.edit(p); };
    draw();
  }
};
(function () {
  var sn = Store.saveNow; Store.saveNow = function () { try { ProdHist.scan(); } catch (e) { } return sn.apply(this, arguments); };
  var st = Shell.start; Shell.start = function () { st.apply(this, arguments); try { ProdHist.init(); } catch (e) { } };
  if (typeof Trash !== 'undefined') {
    var td = Trash.del; Trash.del = function (list) { list.forEach(function (p) { ProdHist.push(p, { k: 'del' }); }); return td.apply(this, arguments); };
    var tr = Trash.restore; Trash.restore = function (entries) { entries.forEach(function (e) { ProdHist.push(e.p, { k: 'restore' }); }); var r = tr.apply(this, arguments); if (ProdHist.last) entries.forEach(function (e) { ProdHist.last[e.p.id] = ProdHist.pick(e.p); }); return r; };
  }
})();
if (typeof Updater !== 'undefined') Updater.notes['1.8.0'] = ['🗂️ البنود تحت كل قسم (سلاسل، خواتم، روج، كحل…) — في الأصناف والإضافة والكاشير والتقارير والعروض', '🧾 خانات الأسعار والكمية فاضية في الصنف الجديد — تكتب على طول', '📜 حركات الصنف: كل تعديل مين عمله وإمتى، والتراجع عنه بتأكيد'];

if (typeof Updater !== 'undefined') Updater.notes['1.8.1'] = ['🗂️ الأصناف متجمّعة حسب القسم: دوسة تفتح القسم بكل بنوده تحت بعض ودوسة تطويه', '🏷️ عمود «البند» قدام كل صنف'];

if (typeof Updater !== 'undefined') Updater.notes['1.8.2'] = ['💰 قيمة كل قسم وكل بند (تكلفة، قطاعي، نص جملة، جملة، والقطع) في سطر القسم نفسه'];
