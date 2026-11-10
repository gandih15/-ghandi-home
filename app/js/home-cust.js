/* Ghandi Home 1.5 — full customer record: identity, addresses, work, references, ID card photos,
   opening balance, credit limit, and a printable customer file. Eng. Mohamed Ali — 01098811581 */
'use strict';
var CUST_KINDS = [['', 'عادي', 'Regular'], ['vip', 'مميّز VIP', 'VIP'], ['trader', 'تاجر', 'Trader'], ['bride', 'عروسة / تجهيز', 'Bride'], ['company', 'شركة / جهة', 'Company'], ['blocked', 'موقوف التعامل معاه', 'Blocked']];
var CustX = {
  kind: function (k) { var x = CUST_KINDS.filter(function (y) { return y[0] === (k || ''); })[0] || CUST_KINDS[0]; return L(x[1], x[2]); },
  img: function (input, cb) { var f = input.files && input.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { var im = new Image(); im.onload = function () { var mx = 900, s = Math.min(1, mx / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .8)); }; im.src = r.result; }; r.readAsDataURL(f); },
  edit: function (c, el, after) {
    var d = c ? U.clone(c) : { name: '', phone: '', tier: '', note: '', birthday: '' }, isNew = !c;
    var fld = function (id, lbl, val, o) { o = o || {}; return '<label class="f">' + lbl + '<input class="in' + (o.num ? ' num' : '') + '" id="' + id + '" value="' + U.esc(val || '') + '"' + (o.type ? ' type="' + o.type + '"' : '') + (o.ltr ? ' style="direction:ltr;text-align:start"' : '') + (o.ph ? ' placeholder="' + o.ph + '"' : '') + '></label>'; };
    var m = Modal.open({ size: 'xl', sticky: true, title: '👤 ' + (isNew ? L('عميل جديد — البيانات الكاملة', 'New customer — full details') : L('بيانات العميل: ', 'Customer: ') + U.esc(d.name)), body:
      '<div class="grid" style="grid-template-columns:1fr 1fr;gap:16px;align-items:start"><div class="col">' +
      '<div class="card col"><b>🪪 ' + L('البيانات الأساسية', 'Basics') + '</b><div class="grid g2">' + fld('ceN', L('الاسم بالكامل *', 'Full name *'), d.name) + '<label class="f">' + L('نوع العميل', 'Customer type') + '<select class="in" id="ceK">' + CUST_KINDS.map(function (k) { return '<option value="' + k[0] + '"' + ((d.kind || '') === k[0] ? ' selected' : '') + '>' + L(k[1], k[2]) + '</option>'; }).join('') + '</select></label>' +
        fld('ceP', L('الموبايل *', 'Mobile *'), d.phone, { num: 1, ltr: 1 }) + fld('ceP2', L('موبايل تاني', 'Second mobile'), d.phone2, { num: 1, ltr: 1 }) + fld('ceWa', L('واتساب (لو مختلف)', 'WhatsApp (if different)'), d.wa, { num: 1, ltr: 1 }) + fld('ceL', L('تليفون أرضي', 'Landline'), d.land, { num: 1, ltr: 1 }) +
        fld('ceNid', L('الرقم القومي', 'National ID'), d.nid, { num: 1, ltr: 1, ph: '14 رقم' }) + '<label class="f">' + L('النوع', 'Gender') + '<select class="in" id="ceG"><option value="">—</option><option value="m"' + (d.gender === 'm' ? ' selected' : '') + '>' + L('ذكر', 'Male') + '</option><option value="f"' + (d.gender === 'f' ? ' selected' : '') + '>' + L('أنثى', 'Female') + '</option></select></label>' +
        fld('ceB', L('تاريخ الميلاد', 'Birthday'), d.birthday, { type: 'date' }) + fld('ceE', L('الإيميل', 'Email'), d.email, { ltr: 1 }) + '</div></div>' +
      '<div class="card col"><b>📍 ' + L('العنوان', 'Address') + '</b><div class="grid g2">' + fld('ceGov', L('المحافظة / المدينة', 'City'), d.city) + fld('ceAr', L('المنطقة / القرية', 'Area / village'), d.area) + '</div>' + fld('ceA', L('العنوان بالتفصيل (شارع، عمارة، دور، شقة)', 'Full address'), d.address) + fld('ceLm', L('علامة مميزة', 'Landmark'), d.landmark, { ph: L('مثلاً: جنب الجامع الكبير', 'e.g. next to the big mosque') }) + fld('ceA2', L('عنوان تاني (شقة الزوجية / الشغل…)', 'Second address'), d.address2) + '</div></div>' +
      '<div class="col"><div class="card col"><b>💼 ' + L('الشغل', 'Work') + '</b><div class="grid g2">' + fld('ceJ', L('الوظيفة', 'Job'), d.job) + fld('ceW', L('جهة العمل', 'Employer'), d.work) + fld('ceWa2', L('عنوان الشغل', 'Work address'), d.workAddr) + fld('ceWp', L('تليفون الشغل', 'Work phone'), d.workPhone, { num: 1, ltr: 1 }) + fld('ceInc', L('الدخل الشهري التقريبي', 'Approx. monthly income'), d.income, { num: 1, type: 'number' }) + fld('ceMs', L('الحالة الاجتماعية', 'Marital status'), d.marital, { ph: L('أعزب / متزوج / مخطوب…', 'Single / married…') }) + '</div></div>' +
      '<div class="card col"><b>🤝 ' + L('قريب أو معرّف (للرجوع ليه)', 'Relative / reference') + '</b><div class="grid g3">' + fld('ceRn', L('الاسم', 'Name'), d.refName) + fld('ceRp', L('الموبايل', 'Mobile'), d.refPhone, { num: 1, ltr: 1 }) + fld('ceRr', L('صلة القرابة', 'Relation'), d.refRel) + '</div></div>' +
      '<div class="card col"><b>💳 ' + L('الحساب', 'Account') + '</b><div class="grid g2"><label class="f">' + L('شريحة سعر ثابتة', 'Fixed price tier') + '<select class="in" id="ceT"><option value="">—</option>' + S().tiers.map(function (t, i) { return '<option value="' + i + '" ' + (String(d.tier) === String(i) ? 'selected' : '') + '>' + tierName(i) + '</option>'; }).join('') + '</select></label>' + fld('ceCl', L('حد الآجل (أقصى مبلغ عليه — 0 = مفتوح)', 'Credit limit (0 = none)'), d.creditLimit || '', { num: 1, type: 'number' }) + (isNew && can('customers') ? fld('ceOb', L('رصيد افتتاحي عليه (آجل قديم)', 'Opening balance (owes)'), '', { num: 1, type: 'number' }) : '') + fld('ceSrc', L('عرفنا منين؟', 'How did they find us?'), d.how, { ph: L('فيسبوك، عميل قديم، معرفة…', 'Facebook, referral…') }) + '</div></div>' +
      '<div class="card col"><b>📷 ' + L('صورة البطاقة', 'ID card photos') + '</b><div class="grid g2">' + ['idF', 'idB'].map(function (k, i) { return '<div class="col" style="gap:6px"><div class="muted small">' + (i ? L('ظهر البطاقة', 'Back') : L('وش البطاقة', 'Front')) + '</div><div id="pv' + k + '" style="height:110px;border:1px dashed var(--line2);border-radius:10px;background:var(--panel2) center/contain no-repeat;' + (d[k] ? 'background-image:url(' + d[k] + ')' : '') + '"></div><div class="row"><label class="btn sm">📁 ' + L('اختار صورة', 'Choose') + '<input type="file" accept="image/*" data-im="' + k + '" style="display:none"></label>' + (d[k] ? '<button class="btn sm ghost" data-rm="' + k + '">✕</button>' : '') + '</div></div>'; }).join('') + '</div></div>' +
      '<label class="f">' + L('ملاحظات', 'Notes') + '<textarea class="in" id="ceNo" rows="2">' + U.esc(d.note || '') + '</textarea></label></div></div>',
      foot: '<button class="btn" data-n>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri lg" id="ceS">💾 ' + L('حفظ', 'Save') + '</button>' });
    $$('[data-im]', m).forEach(function (i) { i.onchange = function () { CustX.img(i, function (u) { d[i.dataset.im] = u; $('#pv' + i.dataset.im, m).style.backgroundImage = 'url(' + u + ')'; }); }; });
    $$('[data-rm]', m).forEach(function (b) { b.onclick = function () { d[b.dataset.rm] = ''; $('#pv' + b.dataset.rm, m).style.backgroundImage = ''; }; });
    $('[data-n]', m).onclick = function () { Modal.close(m); };
    $('#ceS', m).onclick = function () {
      var v = function (id) { return $('#' + id, m) ? $('#' + id, m).value.trim() : ''; };
      var name = v('ceN'), ph = Phone.norm(v('ceP')); if (!name) return toast(L('اكتب اسم العميل', 'Enter the name'), 'bad');
      if (ph && !Phone.valid(ph)) return toast(L('رقم الموبايل غلط', 'Invalid mobile'), 'bad');
      var nid = v('ceNid').replace(/\D/g, ''); if (nid && nid.length !== 14) return toast(L('الرقم القومي لازم 14 رقم', 'National ID must be 14 digits'), 'bad');
      var other = ph && Cust.byPhone(ph); if (other && other !== c) return toast(L('الرقم ده مسجل لعميل تاني: ', 'Number belongs to: ') + other.name, 'bad');
      var t = c || Cust.create(ph, name, 'manual');
      t.name = name; t.phone = ph; t.phone2 = Phone.norm(v('ceP2')); t.wa = Phone.norm(v('ceWa')); t.land = v('ceL'); t.kind = v('ceK'); t.nid = nid; t.gender = v('ceG'); t.birthday = v('ceB'); t.email = v('ceE');
      t.city = v('ceGov'); t.area = v('ceAr'); t.address = v('ceA'); t.landmark = v('ceLm'); t.address2 = v('ceA2');
      t.job = v('ceJ'); t.work = v('ceW'); t.workAddr = v('ceWa2'); t.workPhone = v('ceWp'); t.income = U.n(v('ceInc')) || ''; t.marital = v('ceMs');
      t.refName = v('ceRn'); t.refPhone = Phone.norm(v('ceRp')); t.refRel = v('ceRr');
      t.tier = v('ceT'); t.creditLimit = U.n(v('ceCl')) || ''; t.how = v('ceSrc'); t.note = $('#ceNo', m).value; t.idF = d.idF || ''; t.idB = d.idB || '';
      if (isNew && U.n(v('ceOb'))) { t.balance = U.r2(U.n(t.balance) + U.n(v('ceOb'))); t.opening = U.n(v('ceOb')); }
      Store.log(isNew ? 'customer.add' : 'customer.edit', t.name); Store.save(); Modal.close(m); toast(L('تم الحفظ', 'Saved'), 'ok');
      if (after) after(t); else if (el) { if (isNew) Views.customers.cur = t.id; Views.customers.render(el); }
    };
  },
  card: function (c) {
    var row = function (ic2, lbl, v) { return v ? '<div class="small" style="line-height:1.9">' + ic2 + ' <span class="muted">' + lbl + ':</span> <b>' + v + '</b></div>' : ''; };
    var addr = [c.city, c.area, c.address].filter(Boolean).map(U.esc).join(' — ');
    var html = row('🏷️', L('النوع', 'Type'), c.kind ? CustX.kind(c.kind) : '') + row('🪪', L('الرقم القومي', 'ID'), U.esc(c.nid || '')) + row('📍', L('العنوان', 'Address'), addr + (c.landmark ? ' <span class="muted">(' + U.esc(c.landmark) + ')</span>' : '')) + row('🏠', L('عنوان تاني', 'Address 2'), U.esc(c.address2 || '')) +
      row('💼', L('الشغل', 'Work'), [c.job, c.work].filter(Boolean).map(U.esc).join(' — ') + (c.workPhone ? ' <span class="num">' + U.esc(c.workPhone) + '</span>' : '')) + row('🤝', L('قريب', 'Reference'), [c.refName, c.refRel].filter(Boolean).map(U.esc).join(' — ') + (c.refPhone ? ' <span class="num">' + U.esc(c.refPhone) + '</span>' : '')) +
      row('☎️', L('تليفونات تانية', 'Other phones'), [c.wa && 'WhatsApp ' + c.wa, c.land].filter(Boolean).map(U.esc).join(' · ')) + row('💳', L('حد الآجل', 'Credit limit'), c.creditLimit ? U.money(c.creditLimit) : '') + row('📣', L('عرفنا منين', 'Source'), U.esc(c.how || '')) + row('📝', L('ملاحظات', 'Notes'), U.esc(c.note || ''));
    var ids = (c.idF || c.idB) ? '<div class="row" style="gap:8px;margin-top:6px">' + ['idF', 'idB'].filter(function (k) { return c[k]; }).map(function (k) { return '<img src="' + c[k] + '" data-big="' + k + '" style="height:70px;border-radius:8px;border:1px solid var(--line);cursor:zoom-in">'; }).join('') + '</div>' : '';
    return html || ids ? '<div class="card" style="padding:12px 14px;margin-bottom:14px"><div class="row"><b class="grow">📇 ' + L('بيانات العميل', 'Customer details') + '</b><button class="btn sm" id="cxPr">🖨️ ' + L('ملف العميل A4', 'Customer file A4') + '</button></div><div class="grid g2" style="gap:0 18px">' + html + '</div>' + ids + '</div>' : '<div class="card row" style="padding:10px 14px;margin-bottom:14px"><span class="muted grow">📇 ' + L('بيانات العميل ناقصة (عنوان، رقم قومي، شغل…)', 'Customer details are incomplete') + '</span><button class="btn sm pri" id="cxFill">✏️ ' + L('كمّل البيانات', 'Complete details') + '</button></div>';
  },
  print: function (c) {
    var st = Cust.stats(c), r = function (a, b) { return [a, b || '—']; };
    var inst = (Store.db.inst || []).filter(function (x) { return x.customer === c.id && x.status !== 'void'; });
    A4.print(A4.head(L('ملف عميل', 'Customer file'), [r(L('الاسم', 'Name'), '<b>' + U.esc(c.name) + '</b>'), r(L('النوع', 'Type'), CustX.kind(c.kind)), r(L('الموبايل', 'Mobile'), '<span dir="ltr">' + U.esc([c.phone, c.phone2].filter(Boolean).join(' / ')) + '</span>'), r(L('الرقم القومي', 'National ID'), U.esc(c.nid || '')), r(L('العنوان', 'Address'), U.esc([c.city, c.area, c.address].filter(Boolean).join(' — '))), r(L('علامة مميزة', 'Landmark'), U.esc(c.landmark || '')), r(L('الوظيفة / جهة العمل', 'Job / employer'), U.esc([c.job, c.work].filter(Boolean).join(' — '))), r(L('تليفون الشغل', 'Work phone'), U.esc(c.workPhone || '')), r(L('قريب / معرّف', 'Reference'), U.esc([c.refName, c.refRel, c.refPhone].filter(Boolean).join(' — '))), r(L('عميل من', 'Since'), c.created ? U.today(c.created) : '')]) +
      A4.totals([[L('إجمالي المشتريات', 'Total spent'), U.money(st.net)], [L('عدد الزيارات', 'Visits'), st.visits], [L('عليه آجل', 'Owes'), U.money(c.balance)], [L('متبقي أقساط', 'Instalments left'), U.money(H.sum(inst, Inst.remaining))], [L('إجمالي المستحق', 'Total due'), U.money(U.n(c.balance) + H.sum(inst, Inst.remaining)), 1]], null) +
      ((c.idF || c.idB) ? '<h3 class="s">🪪 ' + L('صورة البطاقة', 'ID card') + '</h3><div style="display:flex;gap:12px">' + ['idF', 'idB'].filter(function (k) { return c[k]; }).map(function (k) { return '<img src="' + c[k] + '" style="max-height:62mm;max-width:48%;border:1px solid #ccc;border-radius:6px">'; }).join('') + '</div>' : '') +
      (c.note ? '<div class="terms">' + U.esc(c.note) + '</div>' : '') + A4.foot(), 'other');
  }
};
(function () {
  Views.customers.edit = function (c, el) { CustX.edit(c, el); };
  var pf = Views.customers.profile;
  Views.customers.profile = function (el) {
    var r = pf.apply(this, arguments), c = Views.customers.cur ? Cust.get(Views.customers.cur) : null; if (!c) return r;
    var tabs = $('#cTabs'); if (!tabs) return r;
    var box = document.createElement('div'); box.innerHTML = CustX.card(c); tabs.parentNode.insertBefore(box.firstChild, tabs);
    if ($('#cxPr')) $('#cxPr').onclick = function () { CustX.print(c); };
    if ($('#cxFill')) $('#cxFill').onclick = function () { CustX.edit(c, el); };
    $$('[data-big]').forEach(function (i) { i.onclick = function () { Modal.open({ size: 'wide', title: '🪪 ' + U.esc(c.name), body: '<img src="' + c[i.dataset.big] + '" style="width:100%;border-radius:10px">' }); }; });
    if (c.kind === 'blocked') { var w = document.createElement('div'); w.className = 'chip bad'; w.style.cssText = 'display:block;padding:10px 14px;margin-bottom:12px;white-space:normal'; w.textContent = '⛔ ' + L('العميل ده موقوف التعامل معاه', 'This customer is blocked'); tabs.parentNode.insertBefore(w, tabs.previousSibling); }
    return r;
  };
  // credit limit + blocked customers at checkout
  var cr = Sales.create;
  Sales.create = function (o) {
    var c = o && o.customer && Cust.get(o.customer);
    if (c && c.kind === 'blocked' && o.type === 'sale') toast('⛔ ' + L('تنبيه: العميل ده موقوف التعامل معاه', 'Warning: blocked customer'), 'bad');
    if (c && U.n(c.creditLimit) && U.n(o.credit) > 0 && U.n(c.balance) + U.n(o.credit) > U.n(c.creditLimit)) toast('⚠️ ' + L('العميل عدّى حد الآجل (', 'Credit limit exceeded (') + U.money(c.creditLimit) + ')', 'bad');
    return cr.apply(this, arguments);
  };
})();
