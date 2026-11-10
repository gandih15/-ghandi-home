/* Ghandi Home — required fields when adding a product (chosen by the developer). Default: name, retail price, quantity. */
'use strict';

// key, emoji, Arabic, English, selector in the product form, selector in quick-add (receiving), kind
var REQ_FIELDS = [
  ['name', '🏷️', 'اسم الصنف', 'Product name', '#fn', '#qn', 'text'],
  ['price0', '🛍️', 'سعر القطاعي', 'Retail price', '[data-pr="0"]', '[data-qp="0"]', 'num'],
  ['stock', '📦', 'الكمية (الرصيد)', 'Quantity (stock)', '#fst', null, 'num'],
  ['cost', '💰', 'سعر التكلفة', 'Cost price', '#fcost', '#qcost', 'num'],
  ['price1', '📦', 'سعر نص الجملة', 'Half-wholesale price', '[data-pr="1"]', '[data-qp="1"]', 'num'],
  ['price2', '🚚', 'سعر الجملة', 'Wholesale price', '[data-pr="2"]', '[data-qp="2"]', 'num'],
  ['price3', '⭐', 'السعر الخاص', 'Special price', '[data-pr="3"]', '[data-qp="3"]', 'num'],
  ['cat', '🗂️', 'القسم', 'Category', '#fc', '#qc', 'text'],
  ['brand', '🏭', 'الماركة', 'Brand', '#fb', '#qb', 'text'],
  ['shade', '🎨', 'اللون / الدرجة', 'Shade', '#fs', '#qs', 'text'],
  ['min', '⚠️', 'حد الطلب', 'Reorder level', '#fmin', '#qm', 'num'],
  ['expiry', '⏳', 'تاريخ الصلاحية', 'Expiry date', '#fexp', null, 'text'],
  ['nameEn', '🔤', 'الاسم بالإنجليزي', 'English name', '#fne', null, 'text'],
  ['barcode', '▥', 'باركود مكتوب (مش متولّد)', 'A scanned barcode (not generated)', null, null, 'bc'],
  ['image', '📷', 'صورة الصنف', 'Product photo', null, null, 'img']
];
function reqCfg() { var d = devS(); if (!d.req) d.req = { name: 1, price0: 1, stock: 1 }; d.req.name = 1; return d.req; }
var ReqF = {
  on: function (k) { return !!reqCfg()[k]; },
  label: function (el) { var l = el && (el.closest('label') || el.parentNode); return l; },
  mark: function (m, quick) {
    REQ_FIELDS.forEach(function (f) {
      if (!ReqF.on(f[0])) return; var sel = quick ? f[5] : f[4]; if (!sel) return; var el = $(sel, m); if (!el) return;
      var l = ReqF.label(el); if (!l || $('.req-star', l)) return; var tn = null; for (var i = 0; i < l.childNodes.length; i++) { var n = l.childNodes[i]; if (n.nodeType === 3 && n.nodeValue.trim()) { tn = n; break; } if (n.nodeType === 1 && !/INPUT|SELECT|TEXTAREA|BUTTON/.test(n.tagName) && n.textContent.trim()) { tn = n; break; } } if (!tn) return; var txt = tn.textContent.replace(/\s*\*\s*$/, ''); var sp = document.createElement('span'); sp.textContent = txt; var st = document.createElement('b'); st.className = 'req-star'; st.textContent = ' *'; sp.appendChild(st); l.replaceChild(sp, tn);
    });
  },
  missing: function (m, quick, d) {
    var out = [];
    REQ_FIELDS.forEach(function (f) {
      if (!ReqF.on(f[0])) return; var bad = false, el = null;
      if (f[6] === 'bc') { if (quick) return; bad = !$$('#bcl .chip', m).length && !(d && d.barcodes && d.barcodes.length); }
      else if (f[6] === 'img') { if (quick) return; bad = !m._img; }
      else { var sel = quick ? f[5] : f[4]; if (!sel) return; el = $(sel, m); if (!el) return; var v = String(el.value || '').trim(); bad = f[6] === 'num' ? !(U.n(v) > 0) : !v; }
      if (bad) out.push({ f: f, el: el });
    });
    return out;
  },
  guard: function (m, btnSel, quick, d) {
    ReqF.mark(m, quick);
    m.addEventListener('click', function (e) {
      var b = e.target.closest(btnSel); if (!b || !m.contains(b) || m._vOn) return;
      var miss = ReqF.missing(m, quick, d); $$('.req-bad', m).forEach(function (x) { x.classList.remove('req-bad'); });
      if (!miss.length) return;
      e.stopImmediatePropagation(); e.preventDefault(); beep(false);
      miss.forEach(function (x) { if (x.el) { if (x.el.type === 'hidden') { var v = x.el.parentNode.querySelector('.cb-search'); if (v) x.el = v; } x.el.classList.add('req-bad'); } });
      var first = miss[0].el; if (first) { if (!first.offsetParent && $('#fmore', m)) $('#fmore', m).click(); setTimeout(function () { first.focus(); first.scrollIntoView({ block: 'center' }); }, 30); }
      toast('⚠️ ' + L('لازم تكتب: ', 'Required: ') + miss.map(function (x) { return L(x.f[2], x.f[3]); }).join('، '), 'bad');
    }, true);
  }
};
(function () {
  var P = Views.products, edit = P.edit;
  P.edit = function (p) {
    edit.apply(this, arguments);
    var m = $$('.mask').pop(); if (!m || !$('#fsave', m)) return;
    if (!p || reqCfg().onEdit) ReqF.guard(m, '#fsave', false, p);
  };
  var qa = Views.purchases.quickAdd;
  if (qa) Views.purchases.quickAdd = function () { var r = qa.apply(this, arguments), m = $$('.mask').pop(); if (m && $('#qsave', m)) ReqF.guard(m, '#qsave', true); return r; };
  // developer panel card
  var dv = Views.dev;
  Views.dev = function (el) {
    dv.apply(this, arguments);
    var c = reqCfg(), card = document.createElement('div'); card.className = 'card col';
    card.innerHTML = '<h3>✳️ ' + L('الخانات الإجبارية عند إضافة صنف', 'Required fields when adding a product') + '</h3><div class="muted small">' + L('المعلّم عليه لازم يتكتب، وإلا الصنف مايتحفظش. الاسم إجباري دايماً. الكمية بتتطلب في «صنف جديد» بس — في الاستلام الكمية بتيجي من المسح.', 'Ticked fields must be filled or the product will not save. Name is always required. Quantity applies to «New product» only — when receiving, it comes from the scan.') + '</div><div class="grid g2" style="gap:6px">' +
      REQ_FIELDS.map(function (f) { return '<label class="feat-r"><span>' + f[1] + ' ' + L(f[2], f[3]) + '</span><input type="checkbox" class="sw" data-rq="' + f[0] + '"' + (c[f[0]] ? ' checked' : '') + (f[0] === 'name' ? ' disabled' : '') + '></label>'; }).join('') + '</div>' +
      '<label class="feat-r" style="margin-top:6px"><span>✏️ ' + L('طبّقها كمان عند تعديل صنف موجود', 'Also apply when editing an existing product') + '</span><input type="checkbox" class="sw" id="rqEd"' + (c.onEdit ? ' checked' : '') + '></label><div class="row"><button class="btn sm" id="rqDef">↺ ' + L('الافتراضي: الاسم + سعر القطاعي + الكمية', 'Default: name + retail price + quantity') + '</button></div>';
    var host = $('.grid', el) || el; host.appendChild(card);
    $$('[data-rq]', card).forEach(function (i) { i.onchange = function () { if (i.checked) c[i.dataset.rq] = 1; else delete c[i.dataset.rq]; Store.log('dev.required', i.dataset.rq + '=' + i.checked); Store.save(); }; });
    $('#rqEd', card).onchange = function () { if (this.checked) c.onEdit = 1; else delete c.onEdit; Store.save(); };
    $('#rqDef', card).onclick = function () { devS().req = { name: 1, price0: 1, stock: 1 }; Store.save(); Views.dev(el); };
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.7.8'] = ['✳️ الصنف الجديد مايتحفظش من غير الاسم وسعر القطاعي والكمية — والمطوّر يحدد الخانات الإجبارية من لوحته'];
