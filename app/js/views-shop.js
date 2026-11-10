/* Ghandi Home — shop profile (بيانات المحل): every licensed shop gets its own name, logo & invoice details.
   "Ghandi" is the system brand; the shop identity comes from here (and optionally from the activation key). */
'use strict';
var Shop = {
  locked: function () { return !!(License.info && License.info.l); },
  // apply identity carried by the activation key
  syncFromLicense: function (p) {
    if (!p || !Store.db) return;
    var s = S(), changed = false;
    var set = function (k, v, force) { if (v && (force || !s[k]) && s[k] !== v) { s[k] = v; changed = true; } };
    set('shopName', p.n, p.l); set('shopNameEn', p.ne, p.l); set('ownerName', p.o); set('shopPhone', p.ph);
    if (changed) { Store.log('shop.license', p.n || ''); Store.save(); }
  },
  needsSetup: function () { return !String(S().shopName || '').trim(); },
  sample: function () {
    return { no: Store.db.seq.invoice + 1, date: Date.now(), type: 'sale', userName: App.user ? App.user.name : '', items: [{ name: L('غسالة أوتوماتيك 7 كيلو', 'Automatic washer 7kg'), qty: 1, price: 14500, cost: 12900 }, { name: L('طقم صيني 72 قطعة', 'Dinner set 72 pcs'), qty: 1, price: 3200, base: 3600, promo: L('عرض العرائس', 'Bridal offer'), cost: 2500 }, { name: L('سجادة 2×3 م', 'Carpet 2x3 m'), qty: 1, price: 1800, cost: 1300 }], subtotal: 19500, discount: 0, vat: 0, total: 19500, payments: { cash: 19500 }, change: 0, credit: 0, tier: 0 };
  }
};
function shopName(en) { var s = S(); en = en == null ? lang() === 'en' : en; return (en && s.shopNameEn) ? s.shopNameEn : (s.shopName || s.shopNameEn || L('اسم المحل', 'Your shop')); }
function shopMark(size, accent) {
  var s = S(); size = size || 42;
  if (s.logo) return '<img src="' + s.logo + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:contain;border-radius:' + Math.round(size / 4) + 'px;background:#fff;flex:none" alt="">';
  return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:' + Math.round(size / 3.5) + 'px;flex:none;display:grid;place-items:center;font-weight:800;font-size:' + Math.round(size * .46) + 'px;color:#fff;background:' + (accent || 'linear-gradient(135deg,var(--gold),#9b6747)') + '">' + U.esc(shopName().trim().charAt(0) || '★') + '</div>';
}

Views.shop = function (el) {
  var s = S(), lk = Shop.locked(), first = Shop.needsSetup();
  var fld = function (k, ar, en, ph, opt) { opt = opt || {}; return '<label class="f">' + L(ar, en) + (opt.req ? ' *' : '') + '<input class="in' + (opt.ltr ? ' num' : '') + '" data-k="' + k + '" value="' + U.esc(s[k] || '') + '" placeholder="' + U.esc(ph || '') + '"' + (opt.dis ? ' disabled' : '') + (opt.ltr ? ' style="direction:ltr;text-align:start"' : '') + '></label>'; };
  el.innerHTML = (first ? '<div class="card setup-hero"><div class="row" style="gap:16px"><div style="font-size:36px">✨</div><div class="grow"><b style="font-size:18px">' + L('أهلاً بيك في غاندي! خلّينا نجهّز بيانات محلك', 'Welcome to Ghandi! Let\'s set up your shop') + '</b><div style="opacity:.85;margin-top:4px">' + L('الاسم واللوجو والتليفونات دي هي اللي هتطلع على الفاتورة والملصقات وشاشة الدخول', 'This name, logo and contact info appear on receipts, labels and the sign-in screen') + '</div></div></div></div>' : '') +
    '<div class="grid" style="grid-template-columns:1fr 360px;gap:16px;align-items:start"><div class="col" style="gap:14px">' +
    '<div class="card col"><h3>' + ic('home', 18) + L('هوية المحل', 'Shop identity') + (lk ? ' <span class="chip">' + ic('lock', 12) + L('الاسم مربوط بكود التفعيل', 'Name locked by license') + '</span>' : '') + '</h3>' +
    '<div class="row" style="gap:18px;align-items:flex-start"><div class="logo-drop" id="ldrop">' + (s.logo ? '<img src="' + s.logo + '">' : '<div>' + ic('plus', 26) + '<div class="small">' + L('لوجو المحل', 'Shop logo') + '</div></div>') + '<input type="file" accept="image/*" id="lfile"></div>' +
    '<div class="col grow" style="gap:10px">' + fld('shopName', 'اسم المحل بالعربي', 'Shop name (Arabic)', L('مثال: معرض النور للأدوات المنزلية', 'e.g. Al Nour Home Store'), { req: 1, dis: lk }) + fld('shopNameEn', 'اسم المحل بالإنجليزي', 'Shop name (English)', 'Al Nour Home Store', { dis: lk && License.info.ne }) + fld('slogan', 'شعار / جملة تحت الاسم', 'Tagline', L('أدوات منزلية • أجهزة كهربائية • تجهيز عرائس • سجاد وستائر', 'Home goods • Appliances • Bridal • Carpets & curtains')) + '</div></div>' +
    '<div class="row small">' + (s.logo ? '<button class="btn sm" id="lrm" style="color:var(--bad)">' + ic('trash', 14) + L('إزالة اللوجو', 'Remove logo') + '</button>' : '') + '<span class="muted">' + L('يفضّل لوجو مربع بخلفية بيضا أو شفافة — بيتطبع أبيض وأسود على الطابعة الحرارية', 'Square logo on white/transparent works best — thermal printers print it in black & white') + '</span></div></div>' +
    '<div class="card col"><h3>' + ic('users', 18) + L('صاحب المحل والتواصل', 'Owner & contact') + '</h3><div class="grid g2">' + fld('ownerName', 'اسم صاحب المحل', 'Owner name', '') + fld('shopPhone', 'موبايل / تليفون', 'Phone', '01xxxxxxxxx', { ltr: 1 }) + fld('shopPhone2', 'رقم تاني', 'Second phone', '', { ltr: 1 }) + fld('whatsapp', 'واتساب', 'WhatsApp', '', { ltr: 1 }) + fld('facebook', 'صفحة فيسبوك', 'Facebook', 'fb.com/…', { ltr: 1 }) + fld('instagram', 'إنستجرام', 'Instagram', '@…', { ltr: 1 }) + '</div>' + fld('shopAddress', 'العنوان', 'Address', L('الشارع — المدينة', 'Street — City')) + '</div>' +
    '<div class="card col"><h3>' + ic('file', 18) + L('بيانات رسمية (اختياري)', 'Legal (optional)') + '</h3><div class="grid g2">' + fld('taxNo', 'الرقم الضريبي', 'Tax no.', '', { ltr: 1 }) + fld('crNo', 'السجل التجاري', 'Commercial reg.', '', { ltr: 1 }) + '</div></div>' +
    '<div class="card col"><h3>' + ic('receipt', 18) + L('اللي بيتكتب على الفاتورة', 'Receipt texts') + '</h3><label class="f">' + L('سطر فوق (مثلاً: فرع المعادي)', 'Header line (e.g. branch)') + '<input class="in" data-inv="header" value="' + U.esc(s.invoice.header || '') + '"></label><label class="f">' + L('سياسة الاستبدال / رسالة الشكر', 'Return policy / thank-you note') + '<textarea class="in" rows="3" data-inv="footer">' + U.esc(s.invoice.footer || '') + '</textarea></label>' +
    '<div class="grid g2">' + [['showLogo', 'اللوجو', 'Logo'], ['showShop', 'اسم المحل', 'Shop name'], ['showPhone', 'التليفونات', 'Phones'], ['showAddress', 'العنوان', 'Address'], ['showSocial', 'واتساب وفيسبوك وإنستجرام', 'Social links'], ['showTaxNo', 'الرقم الضريبي والسجل', 'Tax & reg. no.']].map(function (t) { return '<label class="row small"><input type="checkbox" class="sw" data-tg="' + t[0] + '" ' + (s.invoice[t[0]] ? 'checked' : '') + '> ' + L(t[1], t[2]) + '</label>'; }).join('') + '</div><div class="muted small">' + L('باقي شكل الفاتورة (المقاس، الخط، الباركود…) من صفحة "تصميم الفاتورة"', 'Paper size, font, barcode… are in “Invoice designer”') + '</div></div>' +
    (first ? '<button class="btn pri lg" id="sdone">' + ic('pos') + L('تمام — ابدأ الشغل', 'Done — start selling') + '</button>' : '') + '</div>' +
    '<div class="col shop-side"><div class="card" style="padding:14px"><div class="muted small" style="margin-bottom:8px">' + L('معاينة الفاتورة', 'Receipt preview') + '</div><div class="preview-wrap" style="min-height:0;padding:14px"><div class="receipt" id="sprev"></div></div></div>' +
    '<div class="card"><div class="muted small" style="margin-bottom:10px">' + L('شاشة الدخول والقائمة', 'Sign-in & sidebar') + '</div><div class="row" id="sbrand"></div></div></div></div>';
  var draw = function () {
    $('#sprev').innerHTML = Receipt.html(Shop.sample());
    $('#sbrand').innerHTML = shopMark(46) + '<div><b style="font-size:16px">' + U.esc(shopName()) + '</b><div class="muted small">' + U.esc(s.slogan || '') + '</div><div class="muted small">' + L('بنظام غاندي', 'Powered by Ghandi') + '</div></div>';
    var sb = $('.side .brand'); if (sb) sb.innerHTML = Shell.brandHTML();
  };
  $$('[data-k]').forEach(function (i) { i.oninput = function () { s[i.dataset.k] = i.value.trim(); Store.save(); draw(); }; });
  $$('[data-inv]').forEach(function (i) { i.oninput = function () { s.invoice[i.dataset.inv] = i.value; Store.save(); draw(); }; });
  $$('[data-tg]').forEach(function (i) { i.onchange = function () { s.invoice[i.dataset.tg] = i.checked; Store.save(); draw(); }; });
  $('#lfile').onchange = function () {
    var f = this.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () { var img = new Image(); img.onload = function () { var mx = 360, sc = Math.min(1, mx / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc); var c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(img, 0, 0, cv.width, cv.height); s.logo = cv.toDataURL('image/png'); Store.log('shop.logo', ''); Store.save(); Views.shop(el); }; img.src = r.result; };
    r.readAsDataURL(f);
  };
  if ($('#lrm')) $('#lrm').onclick = function () { s.logo = ''; Store.save(); Views.shop(el); };
  if ($('#sdone')) $('#sdone').onclick = function () { if (Shop.needsSetup()) return toast(L('اكتب اسم المحل الأول', 'Enter the shop name first'), 'bad'); Store.log('shop.setup', s.shopName); Store.saveNow(); Shell.render(); go(can('pos.sell') ? 'pos' : 'dashboard'); toast(L('بالتوفيق يا ', 'Good luck, ') + (s.ownerName || shopName()) + ' ✨', 'ok'); };
  draw();
};

/* ================= SIGN-IN SCREEN TEXTS (editable by the owner) ================= */
var LoginTexts = {
  defaults: {
    ar: { title: 'غاندي', tagline: 'نظام إدارة معارض الأدوات المنزلية والأجهزة الكهربائية وتجهيز العرائس والسجاد والستائر 🏠', showDev: true,
      feats: [['🏦', 'تقسيط بضامنين وجدول أقساط'], ['💍', 'ملفات تجهيز العرائس'], ['🪟', 'تفصيل ستائر وسجاد بالمتر'], ['🚚', 'توصيل وتركيب بمواعيد'], ['🏬', 'مخازن متعددة وجرد'], ['💾', 'باك اب تلقائي في 4 أماكن']] },
    en: { title: 'Ghandi Home', tagline: 'Your whole showroom in one program 🏠', showDev: true,
      feats: [['🏦', 'Instalments with guarantors'], ['💍', 'Bridal files'], ['🪟', 'Curtains & carpets by metre'], ['🚚', 'Delivery & installation'], ['🏬', 'Multiple warehouses'], ['💾', 'Auto backup in 4 places']] }
  },
  get: function (lg) {
    lg = lg || lang(); var c = Store.db && S().login && S().login[lg], d = LoginTexts.defaults[lg];
    if (!c) return { title: d.title, tagline: d.tagline, showDev: true, feats: d.feats.map(function (f) { return { e: f[0], t: f[1], on: true }; }) };
    return c;
  },
  edit: function (lg) { S().login = S().login || {}; if (!S().login[lg]) S().login[lg] = U.clone(LoginTexts.get(lg)); return S().login[lg]; }
};
Views.shopLoginCard = function (box) {
  var lg = lang(), c = LoginTexts.get(lg);
  box.innerHTML = '<h3>🔑 ' + L('شاشة الدخول — الكلام اللي بيظهر عليها', 'Sign-in screen texts') + '</h3><div class="muted small">' + L('بتعدّل نسخة العربي — لو عايز تعدّل الإنجليزي غيّر لغة البرنامج من فوق (EN)', 'You are editing the English version — switch the language (ع) to edit the Arabic one') + '</div>' +
    '<label class="f">' + L('العنوان الكبير', 'Big title') + '<input class="in" id="lgT" value="' + U.esc(c.title) + '" style="font-size:18px;font-weight:800"></label>' +
    '<label class="f">' + L('الجملة التعريفية', 'Tagline') + '<textarea class="in" id="lgS" rows="2">' + U.esc(c.tagline) + '</textarea></label>' +
    '<div class="f"><span>' + L('المميزات (الإيموجي + الكلام) — تقدر تعدّل أو تخفي أو ترتّب أو تمسح', 'Feature lines — edit, hide, reorder or delete') + '</span><div id="lgF" class="col" style="gap:6px"></div>' +
    '<div class="row wrap" style="margin-top:6px"><button class="btn sm" id="lgAdd">➕ ' + L('إضافة ميزة', 'Add a line') + '</button><span class="muted small">' + L('إيموجي مقترحة: ', 'Ideas: ') + ['✨', '💄', '💍', '👜', '🧾', '📦', '🏷️', '⚡', '🔒', '📊', '🎀', '💎', '🚚', '⭐'].map(function (e) { return '<a class="emo" data-emo="' + e + '">' + e + '</a>'; }).join('') + '</span></div></div>' +
    '<label class="row small"><input type="checkbox" class="sw" id="lgD" ' + (c.showDev !== false ? 'checked' : '') + '> ' + L('إظهار كارت المطوّر (الاسم والرقم)', 'Show developer card') + '</label>' +
    '<div class="row wrap"><button class="btn" id="lgPrev">👁️ ' + L('معاينة شاشة الدخول', 'Preview sign-in screen') + '</button><button class="btn ghost" id="lgReset" style="color:var(--bad)">↺ ' + L('رجوع للكلام الأصلي', 'Restore defaults') + '</button></div>';
  var lastEmo = null;
  var drawF = function () {
    var cur = LoginTexts.get(lg);
    $('#lgF').innerHTML = cur.feats.map(function (f, i) { return '<div class="row feat-row' + (f.on === false ? ' off' : '') + '" data-i="' + i + '"><input class="in emo-in" data-e value="' + U.esc(f.e) + '" maxlength="8"><input class="in grow" data-t value="' + U.esc(f.t) + '"><label title="' + L('إظهار', 'Show') + '"><input type="checkbox" class="sw" data-on ' + (f.on !== false ? 'checked' : '') + '></label><button class="btn ghost sm" data-up ' + (i ? '' : 'disabled') + '>▲</button><button class="btn ghost sm" data-dn ' + (i < cur.feats.length - 1 ? '' : 'disabled') + '>▼</button><button class="btn ghost sm" data-del style="color:var(--bad)">🗑️</button></div>'; }).join('') || '<div class="muted small">' + L('مفيش مميزات — اضغط إضافة', 'No lines — press Add') + '</div>';
    $$('#lgF [data-i]').forEach(function (r) {
      var i = +r.dataset.i, mod = function (fn) { var e = LoginTexts.edit(lg); fn(e.feats); Store.save(); drawF(); };
      $('[data-e]', r).onfocus = function () { lastEmo = this; };
      $('[data-e]', r).onchange = function () { var v = this.value; mod(function (a) { a[i].e = v; }); };
      $('[data-t]', r).onchange = function () { var v = this.value; mod(function (a) { a[i].t = v; }); };
      $('[data-on]', r).onchange = function () { var v = this.checked; mod(function (a) { a[i].on = v; }); };
      $('[data-up]', r).onclick = function () { mod(function (a) { a.splice(i - 1, 0, a.splice(i, 1)[0]); }); };
      $('[data-dn]', r).onclick = function () { mod(function (a) { a.splice(i + 1, 0, a.splice(i, 1)[0]); }); };
      $('[data-del]', r).onclick = function () { mod(function (a) { a.splice(i, 1); }); };
    });
  };
  $('#lgT').onchange = function () { LoginTexts.edit(lg).title = this.value.trim(); Store.save(); };
  $('#lgS').onchange = function () { LoginTexts.edit(lg).tagline = this.value.trim(); Store.save(); };
  $('#lgD').onchange = function () { LoginTexts.edit(lg).showDev = this.checked; Store.save(); };
  $('#lgAdd').onclick = function () { LoginTexts.edit(lg).feats.push({ e: '✨', t: L('ميزة جديدة', 'New feature'), on: true }); Store.save(); drawF(); var ins = $$('#lgF [data-t]'); if (ins.length) { ins[ins.length - 1].focus(); ins[ins.length - 1].select(); } };
  $$('[data-emo]', box).forEach(function (a) { a.onmousedown = function (e) { e.preventDefault(); if (lastEmo) { lastEmo.value = a.dataset.emo; lastEmo.onchange(); } else toast(L('اضغط على خانة إيموجي الأول', 'Click an emoji box first'), ''); }; });
  $('#lgReset').onclick = function () { Modal.confirm(L('ترجّع كلام شاشة الدخول للأصلي؟', 'Restore the original texts?'), function () { if (S().login) delete S().login[lg]; Store.save(); Views.shopLoginCard(box); }); };
  $('#lgPrev').onclick = function () { var u = App.user; App.user = null; Gate.login(); var g = $('#gate'), b = document.createElement('button'); b.className = 'btn pri'; b.style.cssText = 'position:fixed;top:16px;inset-inline-end:16px;z-index:99'; b.textContent = L('رجوع للتعديل ✕', 'Back to editing ✕'); b.onclick = function () { g.remove(); b.remove(); App.user = u; }; document.body.appendChild(b); };
  drawF();
};
