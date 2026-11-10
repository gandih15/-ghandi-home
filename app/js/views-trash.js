/* Ghandi Home — deleted & stopped products: soft delete (restorable), bulk delete, password/word confirmation. */
'use strict';

var Trash = {
  init: function () { if (!Store.db.trash) Store.db.trash = []; return Store.db.trash; },
  confirm: function (title, msg, cb) {
    var m = Modal.open({ title: '🗑️ ' + title, body: '<div class="col"><div>' + msg + '</div><label class="f">' + L('اكتب كلمة السر بتاعتك أو كلمة «حذف» للتأكيد', 'Type your password or the word DELETE to confirm') + '<input class="in" id="tcW" type="password" autofocus autocomplete="off" style="font-size:18px"></label><label class="row small"><input type="checkbox" id="tcShow"> ' + L('إظهار', 'Show') + '</label></div>', foot: '<button class="btn" id="tcGo" style="color:var(--bad)">🗑️ ' + L('تأكيد', 'Confirm') + '</button>' });
    $('#tcShow', m).onchange = function () { $('#tcW', m).type = this.checked ? 'text' : 'password'; };
    var go2 = function () {
      var v = $('#tcW', m).value.trim(); if (!v) return toast(L('اكتب كلمة السر أو «حذف»', 'Type your password or DELETE'), 'bad');
      var ok = function () { Modal.close(m); cb(); };
      if (/^(حذف|delete)$/i.test(v)) return ok();
      if (App.user && App.user.hash) Sec.verify(v, App.user).then(function (r) { if (r) ok(); else { beep(false); toast(L('كلمة السر غلط', 'Wrong password'), 'bad'); } });
      else { beep(false); toast(L('اكتب «حذف»', 'Type DELETE'), 'bad'); }
    };
    $('#tcGo', m).onclick = go2; $('#tcW', m).onkeydown = function (e) { if (e.key === 'Enter') go2(); };
  },
  // move products out of the shop: gone from selling, stock, reports, labels — old invoices keep them
  del: function (list) {
    var t = Trash.init(), db = Store.db, now = Date.now();
    list.forEach(function (p) {
      var i = db.products.indexOf(p); if (i < 0) return;
      db.products.splice(i, 1);
      if (U.n(p.stock)) db.moves.push({ t: now, p: p.id, q: -U.n(p.stock), k: 'delete', r: L('حذف الصنف', 'Product deleted'), u: App.user ? App.user.username : '', s: 0 });
      t.push({ id: U.id(), p: p, at: now, by: App.user ? App.user.name : '', stock: U.n(p.stock) });
    });
    Store.log('product.delete', list.length + ': ' + list.slice(0, 5).map(function (p) { return p.name; }).join('، ')); Store.reindex(); Store.save();
  },
  restore: function (entries) {
    var db = Store.db, t = Trash.init(), clash = [];
    entries.forEach(function (e) {
      var p = e.p; p.barcodes = (p.barcodes || []).filter(function (b) { var o = Store.byBarcode(b); if (o && o !== p) { clash.push(b); return false; } return true; });
      if (!p.barcodes.length) p.barcodes = [String(Date.now()).slice(-10) + Math.floor(Math.random() * 10)];
      db.products.push(p); t.splice(t.indexOf(e), 1);
      if (U.n(p.stock)) db.moves.push({ t: Date.now(), p: p.id, q: U.n(p.stock), k: 'restore', r: L('استرجاع صنف محذوف', 'Product restored'), u: App.user ? App.user.username : '', s: U.n(p.stock) });
      Store.reindex();
    });
    Store.log('product.restore', entries.length + ''); Store.save();
    if (clash.length) toast(L('اترجعوا ✓ — الباركود ده كان اتستخدم لصنف تاني فاتشال: ', 'Restored ✓ — these barcodes now belong to another product and were removed: ') + clash.join('، '), 'warn');
    else toast('↩️ ' + L('اترجع ', 'Restored ') + entries.length + L(' صنف', ' products'), 'ok');
  },
  purge: function (entries) { var t = Trash.init(); entries.forEach(function (e) { t.splice(t.indexOf(e), 1); }); Store.log('product.purge', entries.length + ''); Store.save(); toast(L('اتحذفوا نهائياً', 'Permanently deleted'), 'ok'); },
  ask: function (list, after) {
    if (!list.length) return toast(L('مفيش أصناف متحددة', 'Nothing selected'), 'bad');
    var stock = list.reduce(function (a, p) { return a + U.n(p.stock); }, 0);
    Trash.confirm(L('حذف ', 'Delete ') + list.length + L(' صنف', ' products'), (list.length === 1 ? '<b>' + U.esc(pname(list[0])) + '</b>' : '<b>' + list.length + L(' صنف', ' products') + '</b>: ' + list.slice(0, 6).map(function (p) { return U.esc(p.name); }).join('، ') + (list.length > 6 ? '…' : '')) + '<div class="muted small" style="margin-top:6px">' + L('هيختفوا من البيع والأصناف والمخزن والتقارير', 'They disappear from selling, products, stock and reports') + (stock ? ' (' + L('رصيد ', 'stock ') + stock + L(' قطعة', ' pcs') + ')' : '') + L('. فواتيرهم القديمة بتفضل زي ما هي، وتقدر ترجّعهم من صفحة «المحذوفات».', '. Old invoices stay; restore them from «Deleted».') + '</div>', function () { Trash.del(list); toast('🗑️ ' + L('اتحذف ', 'Deleted ') + list.length + L(' صنف — تقدر ترجّعه من «المحذوفات»', ' — restore from «Deleted»'), 'ok'); after && after(); });
  }
};
// old invoices, customer history and reports can still show a deleted product
(function () { var pr = Store.product; Store.product = function (id) { var p = pr.apply(Store, arguments); if (p) return p; var t = Store.db && Store.db.trash; if (t) for (var i = 0; i < t.length; i++) if (t[i].p.id === id) return t[i].p; return null; }; })();
// remember when a product was stopped (for the date filter)
(function () { var sv = Store.save; Store.save = function () { try { (Store.db.products || []).forEach(function (p) { if (p.active === false && !p.offAt) p.offAt = Date.now(); else if (p.active !== false && p.offAt) delete p.offAt; }); } catch (e) { } return sv.apply(this, arguments); }; })();

/* ================= products page: checkboxes, delete selected / all ================= */
(function () {
  var P = Views.products; P.sel = P.sel || {};
  var tb = P.table;
  P.table = function () {
    tb.apply(this, arguments);
    var t = $('#pt table'); if (!t || !can('products.delete')) return;
    var rows = $$('#pt tr[data-id]');
    var hr = t.rows[0]; if (hr && !$('#psAll', hr)) { var th = document.createElement('th'); th.innerHTML = '<input type="checkbox" id="psAll" title="' + L('تحديد الصفحة', 'Select page') + '">'; hr.insertBefore(th, hr.firstChild); }
    rows.forEach(function (r) {
      var id = r.dataset.id, td = r.insertCell(0); td.innerHTML = '<input type="checkbox" data-ps="' + id + '"' + (P.sel[id] ? ' checked' : '') + '>';
      $('input', td).onchange = function () { if (this.checked) P.sel[id] = 1; else delete P.sel[id]; bar(); };
      var d = $('[data-d]', r); if (d) d.onclick = function () { var p = Store.product(id); Trash.ask([p], function () { delete P.sel[id]; P.table(); }); };
    });
    $$('#pt tr:not([data-id]) td[colspan]').forEach(function (c) { c.colSpan = c.colSpan + 1; });
    var all = $('#psAll'); if (all) { all.checked = rows.length && rows.every(function (r) { return P.sel[r.dataset.id]; }); all.onchange = function () { var on = this.checked; rows.forEach(function (r) { if (on) P.sel[r.dataset.id] = 1; else delete P.sel[r.dataset.id]; $('[data-ps]', r).checked = on; }); bar(); }; }
    var b = $('#psBar'); if (!b) { b = document.createElement('div'); b.id = 'psBar'; b.className = 'row wrap ps-bar'; var w = $('#pt'); w.parentNode.insertBefore(b, w); }
    var bar = function () {
      Object.keys(P.sel).forEach(function (k) { if (!Store.db.products.some(function (p) { return p.id === k; })) delete P.sel[k]; });
      var n = Object.keys(P.sel).length, tot = P.list().length;
      b.innerHTML = (n ? '<span class="chip">' + n + L(' صنف متحدد', ' selected') + '</span>' + (can('products.edit') && typeof Subs !== 'undefined' ? '<button class="btn sm" id="psMove">🗂️ ' + L('نقل لقسم / بند', 'Move to category') + '</button>' : '') + '<button class="btn sm" id="psDel" style="color:var(--bad)">🗑️ ' + L('حذف المحدد', 'Delete selected') + '</button><button class="btn sm ghost" id="psClr">✕ ' + L('إلغاء التحديد', 'Clear') + '</button>' : '<span class="muted small">' + L('علّم على الأصناف اللي عايز تحذفها', 'Tick products to delete them') + '</span>') + '<div class="grow"></div><button class="btn sm ghost" id="psAllDel" style="color:var(--bad)">🗑️ ' + L('حذف الكل', 'Delete all') + ' (' + tot + ')</button>';
      if ($('#psDel')) $('#psDel').onclick = function () { Trash.ask(Store.db.products.filter(function (p) { return P.sel[p.id]; }), function () { P.sel = {}; P.table(); }); };
      if ($('#psMove')) $('#psMove').onclick = function () { Subs.bulkMove(P); };
      if (n >= 2 && can('products.edit') && typeof Variants !== 'undefined' && $('#psMove')) { var vb = document.createElement('button'); vb.className = 'btn sm'; vb.id = 'psVar'; vb.innerHTML = '🎛️ ' + L('اجمعهم اختيارات لصنف واحد', 'Combine as options'); $('#psMove').after(vb); vb.onclick = function () { Variants.combine(P); }; }
      if ($('#psClr')) $('#psClr').onclick = function () { P.sel = {}; P.table(); };
      $('#psAllDel').onclick = function () { var l = P.list(); if (!l.length) return; Trash.ask(l, function () { P.sel = {}; P.page = 0; P.table(); }); };
    };
    bar();
  };
})();

/* ================= deleted & stopped products page ================= */
Views.trash = {
  f: { st: 'all', q: '', a: '', b: '' }, sel: {},
  rows: function () {
    var V = Views.trash, f = V.f, out = [], q = U.norm(f.q), a = f.a ? new Date(f.a).getTime() : 0, b = f.b ? new Date(f.b).getTime() : Infinity;
    if (f.st !== 'off') Trash.init().forEach(function (e) { out.push({ k: 'del', id: 'd' + e.id, e: e, p: e.p, at: e.at, by: e.by, stock: e.stock }); });
    if (f.st !== 'del') Store.db.products.forEach(function (p) { if (p.active === false) out.push({ k: 'off', id: 'o' + p.id, p: p, at: p.offAt || 0, by: '', stock: U.n(p.stock) }); });
    return out.filter(function (r) { if (r.at && (r.at < a || r.at > b)) return false; if (!r.at && f.a) return false; if (q && U.norm(r.p.name + ' ' + (r.p.brand || '') + ' ' + (r.p.shade || '') + ' ' + (r.p.barcodes || []).join(' ')).indexOf(q) < 0) return false; return true; }).sort(function (x, y) { return (y.at || 0) - (x.at || 0); });
  },
  render: function (el) {
    var V = Views.trash, f = V.f;
    el.innerHTML = '<div class="card sfilt" style="margin-bottom:12px"><div class="row wrap" style="gap:10px;align-items:flex-end"><div class="seg" id="trS">' + [['all', 'الكل', 'All'], ['del', '🗑️ المحذوفة', '🗑️ Deleted'], ['off', '⏸️ الموقوفة', '⏸️ Stopped']].map(function (s) { return '<button data-s="' + s[0] + '" class="' + (f.st === s[0] ? 'on' : '') + '">' + L(s[1], s[2]) + '</button>'; }).join('') + '</div>' +
      '<label class="f">🔎 ' + L('الاسم أو الباركود', 'Name or barcode') + '<input class="in" id="trQ" value="' + U.esc(f.q) + '" style="width:220px"></label><label class="f">🕒 ' + L('من (تاريخ ووقت)', 'From (date & time)') + '<input class="in" type="datetime-local" id="trA" value="' + f.a + '"></label><label class="f">' + L('إلى', 'To') + '<input class="in" type="datetime-local" id="trB" value="' + f.b + '"></label><div class="seg" id="trQk">' + [['today', 'النهارده', 'Today'], ['week', '7 أيام', '7 days'], ['month', 'الشهر', 'Month'], ['clr', '✕', '✕']].map(function (s) { return '<button data-q="' + s[0] + '">' + L(s[1], s[2]) + '</button>'; }).join('') + '</div></div></div><div class="row wrap ps-bar" id="trBar"></div><div class="tbl-wrap" id="trT"></div>';
    $$('#trS button').forEach(function (b) { b.onclick = function () { f.st = b.dataset.s; V.sel = {}; V.render(el); }; });
    var t0; $('#trQ').oninput = function () { var v = this.value; clearTimeout(t0); t0 = setTimeout(function () { f.q = v; V.table(); }, 200); };
    $('#trA').onchange = function () { f.a = this.value; V.table(); }; $('#trB').onchange = function () { f.b = this.value; V.table(); };
    var iso = function (t) { var d = new Date(t - new Date().getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16); };
    $$('#trQk button').forEach(function (b) { b.onclick = function () { var q = b.dataset.q, s = dayStart(); if (q === 'clr') { f.a = f.b = ''; } else { f.a = iso(q === 'today' ? s : q === 'week' ? s - 6 * 864e5 : (function () { var m = new Date(); m.setDate(1); return dayStart(m); })()); f.b = ''; } V.render(el); }; });
    V.table();
  },
  table: function () {
    var V = Views.trash, rows = V.rows(), vc = can('products.viewCost');
    Object.keys(V.sel).forEach(function (k) { if (!rows.some(function (r) { return r.id === k; })) delete V.sel[k]; });
    $('#trT').innerHTML = '<table class="t"><tr><th><input type="checkbox" id="trAll"></th><th>' + L('الصنف', 'Product') + '</th><th>' + L('الباركود', 'Barcode') + '</th><th>' + L('الحالة', 'Status') + '</th><th>' + L('التاريخ والوقت', 'Date & time') + '</th><th>' + L('بواسطة', 'By') + '</th><th>' + L('الرصيد', 'Stock') + '</th>' + (vc ? '<th>' + L('القيمة', 'Value') + '</th>' : '') + '<th></th></tr>' +
      (rows.length ? rows.map(function (r) { var p = r.p; return '<tr data-r="' + r.id + '"><td><input type="checkbox" data-t="' + r.id + '"' + (V.sel[r.id] ? ' checked' : '') + '></td><td><b>' + U.esc(pname(p)) + '</b> <span class="muted small">' + U.esc(p.shade || '') + '</span>' + (p.brand ? '<div class="muted small">' + U.esc(p.brand) + '</div>' : '') + '</td><td>' + (p.barcodes || []).slice(0, 2).map(function (b) { return '<span class="tag">' + U.esc(b) + '</span>'; }).join('') + '</td><td>' + (r.k === 'del' ? '<span class="chip bad">🗑️ ' + L('محذوف', 'Deleted') + '</span>' : '<span class="chip warn">⏸️ ' + L('موقوف', 'Stopped') + '</span>') + '</td><td class="num">' + (r.at ? U.dt(r.at) : '—') + '</td><td>' + U.esc(r.by || '') + '</td><td class="num">' + r.stock + '</td>' + (vc ? '<td class="num">' + U.money(r.stock * U.n(p.cost)) + '</td>' : '') + '<td style="white-space:nowrap"><button class="btn sm" data-a="back">' + (r.k === 'del' ? '↩️ ' + L('استرجاع', 'Restore') : '▶️ ' + L('تشغيل', 'Activate')) + '</button> ' + (r.k === 'off' ? '<button class="btn sm ghost" data-a="del" style="color:var(--bad)">🗑️</button>' : '<button class="btn sm ghost" data-a="purge" style="color:var(--bad)" title="' + L('حذف نهائي', 'Delete forever') + '">⛔</button>') + '</td></tr>'; }).join('') : '<tr><td colspan="9"><div class="empty"><span class="em">🗑️</span>' + L('مفيش أصناف محذوفة أو موقوفة هنا', 'No deleted or stopped products') + '</div></td></tr>') + '</table>';
    var byId = {}; rows.forEach(function (r) { byId[r.id] = r; });
    var act = function (list, a) {
      var dels = list.filter(function (r) { return r.k === 'del'; }), offs = list.filter(function (r) { return r.k === 'off'; });
      if (a === 'back') { if (dels.length) Trash.restore(dels.map(function (r) { return r.e; })); if (offs.length) { offs.forEach(function (r) { r.p.active = true; }); Store.log('product.activate', offs.length + ''); Store.save(); toast('▶️ ' + L('اشتغل ', 'Activated ') + offs.length + L(' صنف', ' products'), 'ok'); } V.sel = {}; V.table(); }
      else if (a === 'del') Trash.ask(offs.map(function (r) { return r.p; }), function () { V.sel = {}; V.table(); });
      else if (a === 'purge') Trash.confirm(L('حذف نهائي', 'Delete forever'), '<b>' + dels.length + L(' صنف محذوف', ' deleted products') + '</b> ' + L('هيتشالوا نهائياً ومش هينفع يرجعوا. فواتيرهم القديمة بتفضل بأسمائها.', 'will be removed forever. Old invoices keep their names.'), function () { Trash.purge(dels.map(function (r) { return r.e; })); V.sel = {}; V.table(); });
    };
    $$('#trT tr[data-r]').forEach(function (tr) { var r = byId[tr.dataset.r]; $('[data-t]', tr).onchange = function () { if (this.checked) V.sel[r.id] = 1; else delete V.sel[r.id]; bar(); }; $$('[data-a]', tr).forEach(function (b) { b.onclick = function () { act([r], b.dataset.a); }; }); });
    $('#trAll').checked = rows.length && rows.every(function (r) { return V.sel[r.id]; });
    $('#trAll').onchange = function () { var on = this.checked; rows.forEach(function (r) { if (on) V.sel[r.id] = 1; else delete V.sel[r.id]; }); V.table(); };
    var bar = function () {
      var sel = rows.filter(function (r) { return V.sel[r.id]; }), dels = rows.filter(function (r) { return r.k === 'del'; });
      $('#trBar').innerHTML = '<span class="chip">' + rows.length + L(' صنف', ' products') + '</span>' + (sel.length ? '<span class="chip">' + sel.length + L(' متحدد', ' selected') + '</span><button class="btn sm" id="trR">↩️ ' + L('استرجاع / تشغيل المحدد', 'Restore / activate selected') + '</button>' + (sel.some(function (r) { return r.k === 'off'; }) ? '<button class="btn sm" id="trD" style="color:var(--bad)">🗑️ ' + L('حذف الموقوف المحدد', 'Delete selected stopped') + '</button>' : '') + (sel.some(function (r) { return r.k === 'del'; }) ? '<button class="btn sm" id="trP" style="color:var(--bad)">⛔ ' + L('حذف نهائي للمحدد', 'Delete selected forever') + '</button>' : '') : '') + '<div class="grow"></div>' + (dels.length ? '<button class="btn sm ghost" id="trPA" style="color:var(--bad)">⛔ ' + L('حذف نهائي للكل', 'Delete all forever') + ' (' + dels.length + ')</button>' : '');
      if ($('#trR')) $('#trR').onclick = function () { act(sel, 'back'); };
      if ($('#trD')) $('#trD').onclick = function () { act(sel, 'del'); };
      if ($('#trP')) $('#trP').onclick = function () { act(sel, 'purge'); };
      if ($('#trPA')) $('#trPA').onclick = function () { act(dels, 'purge'); };
    };
    bar();
  }
};
(function () {
  NAV.splice(NAV.findIndex(function (n) { return n[0] === 'products'; }) + 1, 0, ['trash', 'trash', 'المحذوفات والموقوفة', 'Deleted & stopped', 'products.delete']);
  if (typeof NAV_GEMS !== 'undefined') NAV_GEMS.trash = ['🗑️', 'g-ruby'];
})();
if (typeof Updater !== 'undefined') Updater.notes['1.7.5'] = ['🗑️ صفحة «المحذوفات والموقوفة»: بحث بالتاريخ والوقت والحالة، واسترجاع أي صنف اتحذف بالغلط', '☑️ حذف المحدد وحذف الكل في الأصناف بكلمة السر أو كلمة «حذف»', '📦 الصنف المحذوف بيختفي من البيع والأصناف والمخزن والتقارير، وفواتيره القديمة زي ما هي'];
if (typeof Updater !== 'undefined') Updater.notes['1.7.6'] = ['⏸️ الصنف الموقوف مش بيتباع: لو اتمسح أو اتبحث عنه يقول «الصنف موقوف»، والمحذوف يقول «الصنف محذوف»', '📦 الصنف اللي رصيده خلص بيختفي من شاشة الكاشير، ولو اتمسح يقول «غير متوفر في المخزون» — ومفيش بيع بالسالب'];
