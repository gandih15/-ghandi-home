/* Ghandi Home 1.9 — every product gets a short item number (1, 2, 3 …), editable, unique, searchable,
   printed in the «رقم الصنف» column. Eng. Mohamed Ali — 01098811581 */
'use strict';
var ItemNo = {
  on: function () { return !!Dev.unlocked || devS().codeOn !== false; },
  canEdit: function () { return !!Dev.unlocked || (devS().codeOn !== false && devS().codeEdit !== false); },
  used: function () { var s = S(); s.codeUsed = s.codeUsed || {}; return s.codeUsed; },
  remember: function () { var u = ItemNo.used(); Store.db.products.forEach(function (p) { if (p.code) u[String(p.code)] = 1; }); },
  max: function () { var m = 0; Store.db.products.forEach(function (p) { var n = parseInt(p.code, 10); if (/^\d+$/.test(String(p.code || '')) && n > m) m = n; }); return m; },
  next: function () { return String(Math.max(ItemNo.max(), U.n(S().codeSeq), ItemNo.top()) + 1); },
  top: function () { var m = 0; Object.keys(ItemNo.used()).forEach(function (k) { if (/^\d+$/.test(k) && +k > m) m = +k; }); return m; },
  taken: function (v, self) { v = String(v || '').trim(); if (!v) return false; if (Store.db.products.some(function (p) { return p !== self && String(p.code || '').trim() === v; })) return true; return !!ItemNo.used()[v] && !(self && String(self.code) === v); },
  gone: function (v) { v = String(v || '').trim(); return !!ItemNo.used()[v] && !ItemNo.byCode(v); },
  // products that do not have a number yet get one, in the order they were added
  fill: function () {
    if (!Store.db || !Store.db.products) return 0;
    var miss = Store.db.products.filter(function (p) { return !String(p.code || '').trim(); }); if (!miss.length) return 0;
    var n = Math.max(ItemNo.max(), U.n(S().codeSeq), ItemNo.top());
    miss.sort(function (a, b) { return U.n(a.created) - U.n(b.created); }).forEach(function (p) { n++; p.code = String(n); });
    S().codeSeq = n; return miss.length;
  },
  byCode: function (v) { v = String(v || '').trim(); if (!v) return null; return Store.db.products.filter(function (p) { return String(p.code || '') === v; })[0] || null; }
};
PCOLS.push(['code', 'رقم الصنف', 'Item no.']);
(function () {
  // number new products as soon as they are saved
  var sv = Store.save;
  Store.save = function () { try { ItemNo.fill(); ItemNo.remember(); } catch (e) { } return sv.apply(this, arguments); };
  // typing the item number in the POS scanner (or anywhere a barcode is looked up) finds the product
  var bb = Store.byBarcode;
  Store.byBarcode = function (code) { return bb.apply(this, arguments) || (ItemNo.on() ? ItemNo.byCode(code) : null); };
  // products search: by number too
  var ls = Views.products.list;
  Views.products.list = function () {
    var P = Views.products, q = String(P.q || '').trim();
    if (q && ItemNo.on() && /^\d{1,7}$/.test(q)) { var hit = ItemNo.byCode(q); var r = ls.apply(this, arguments); if (hit && r.indexOf(hit) < 0) r.unshift(hit); else if (hit) { r.splice(r.indexOf(hit), 1); r.unshift(hit); } return r; }
    return ls.apply(this, arguments);
  };
  // products table: show the number next to the name
  var stamp = function () { if (!ItemNo.on() || App.view !== 'products') return; $$('#pt tr[data-id]').forEach(function (row) { var p = Store.product(row.dataset.id), cell = row.cells[1]; if (p && cell && p.code && !$('.ino', cell)) cell.insertAdjacentHTML('afterbegin', '<span class="chip ino num" title="' + L('رقم الصنف', 'Item no.') + '" style="margin-inline-end:6px">#' + U.esc(p.code) + '</span>'); }); };
  var tb = Views.products.table;
  Views.products.table = function () { var r = tb.apply(this, arguments); stamp(); return r; };
  var mo = new MutationObserver(function () { clearTimeout(mo.t); mo.t = setTimeout(stamp, 20); });
  document.addEventListener('DOMContentLoaded', function () { var v = document.body; if (v) mo.observe(v, { childList: true, subtree: true }); });
  // product form: an editable «رقم الصنف» box
  var ed = Views.products.edit;
  Views.products.edit = function (p) {
    var r = ed.apply(this, arguments), m = $$('.mask').pop(); if (!m || !$('#fsave', m) || $('#fcode', m) || !ItemNo.on()) return r;
    var nameBox = $('#fn', m); var lab = nameBox && nameBox.closest('label'); if (!lab) return r;
    var c = document.createElement('label'); c.className = 'f'; c.innerHTML = '🔢 ' + L('رقم الصنف', 'Item no.') + '<input class="in num" id="fcode" style="max-width:160px" value="' + U.esc(p && p.code ? p.code : ItemNo.next()) + '">';
    lab.parentNode.insertBefore(c, lab);
    if (!ItemNo.canEdit()) { var ci = $('#fcode', c); ci.readOnly = true; ci.title = L('تعديل رقم الصنف مقفول من المطوّر', 'Editing item numbers is locked by the developer'); ci.style.opacity = '.7'; c.insertAdjacentHTML('beforeend', '<span class="muted small">🔒 ' + L('بيتحدد لوحده', 'automatic') + '</span>'); }
    var sb = $('#fsave', m), orig = sb.onclick, before = Store.db.products.length;
    sb.onclick = function () {
      var v = ItemNo.canEdit() ? $('#fcode', m).value.trim() : (p && p.code ? p.code : '');
      if (v && ItemNo.taken(v, p)) { toast('⛔ ' + (ItemNo.gone(v) ? L('الرقم ده كان لصنف اتحذف — مينفعش يتكرر', 'This number belonged to a deleted product and is never reused') : L('رقم الصنف ده متسجل لصنف تاني: ', 'This item no. is used by: ') + U.esc(pname(ItemNo.byCode(v)))), 'bad'); $('#fcode', m).focus(); return; }
      var target = p, n0 = Store.db.products.length; var res = orig.apply(this, arguments);
      if (!target && Store.db.products.length > n0) target = Store.db.products[Store.db.products.length - 1];
      if (target && v) { target.code = v; if (/^\d+$/.test(v) && +v > U.n(S().codeSeq)) S().codeSeq = +v; Store.save(); }
      void before; return res;
    };
    return r;
  };
  // first start after the update: number every product
  var sr = Shell.render, done = false;
  Shell.render = function () { var r = sr.apply(this, arguments); if (!done && Store.db) { done = true; try { var n = ItemNo.fill(); ItemNo.remember(); if (n) { Store.save(); Store.log('items.numbered', String(n)); } } catch (e) { } } return r; };
})();

/* developer: may the shop owner edit item numbers? */
(function () {
  var dv = Views.dev;
  Views.dev = function (el) {
    var r = dv.apply(this, arguments); if (!Dev.unlocked) return r;
    var c = document.createElement('div'); c.className = 'card col'; c.id = 'dvCode';
    c.innerHTML = '<h3>🔢 ' + L('رقم الصنف', 'Item numbers') + '</h3><label class="row"><input type="checkbox" class="sw" id="cdOn"' + (devS().codeOn !== false ? ' checked' : '') + '> <b>' + L('رقم الصنف شغّال عند صاحب المحل', 'Item numbers are on for the shop') + '</b></label><div class="muted small">' + L('لو قفلتها الأرقام بتختفي من عنده خالص (الأصناف، الفاتورة، البحث) — ولما تفتحها ترجع زي ما هي.', 'Off = hidden everywhere for the shop; on again = back as they were.') + '</div><label class="row"><input type="checkbox" class="sw" id="cdEd"' + (devS().codeEdit !== false ? ' checked' : '') + '> <b>' + L('صاحب المحل يقدر يعدّل رقم الصنف', 'The shop owner may edit item numbers') + '</b></label><div class="muted small">' + L('لو التعديل مقفول: كل صنف جديد بياخد الرقم اللي بعده لوحده ومحدش يقدر يغيّره (حتى من استيراد الإكسيل) — انت بس من وضع المطوّر.', 'When off, numbers are automatic and only the developer can change them.') + '</div>';
    var top = $('#dvTop', el); if (top) top.appendChild(c); else el.appendChild(c);
    $('#cdOn', c).onchange = function () { devS().codeOn = this.checked; Store.log('dev.codeOn', String(this.checked)); Store.save(); toast(L('اتحفظ', 'Saved'), 'ok'); };
    $('#cdEd', c).onchange = function () { devS().codeEdit = this.checked; Store.log('dev.codeEdit', String(this.checked)); Store.save(); toast(L('اتحفظ', 'Saved'), 'ok'); };
    return r;
  };
})();

/* the «رقم الصنف» column disappears from every document when the developer turns numbers off */
(function () {
  var cols = A4.cols;
  A4.cols = function (cs, rows) {
    var i = cs.findIndex(function (c) { return c[0] === 'colCode'; });
    if (i >= 0 && !ItemNo.on()) { cs = cs.slice(); cs.splice(i, 1); rows = rows.map(function (r) { r = r.slice(); r.splice(i, 1); return r; }); }
    return cols.call(this, cs, rows);
  };
})();
