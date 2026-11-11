/* Ghandi Home 1.7 — cashier returns with the admin's approval, and how far back each cashier can see invoices.
   Eng. Mohamed Ali — 01098811581 */
'use strict';
/* ---------- permissions ---------- */
(function () {
  var at = function (k) { for (var i = 0; i < PERMS.length; i++) if (PERMS[i][0] === k) return i; return -1; };
  PERMS.splice(at('pos.return') + 1, 0,
    ['pos.returnReq', 'المرتجع بموافقة المدير (الكاشير يطلب والمدير يوافق)', 'Returns with the admin\'s approval'],
    ['returns.approve', 'الموافقة على طلبات المرتجع', 'Approve return requests']);
  PERMS.splice(at('sales.history') + 1, 0,
    ['sales.days', 'الفواتير اللي يقدر يرجعلها', 'Invoices he can look back at', 'sel', [[0, 'كل الفواتير'], [1, 'فواتير النهارده بس'], [2, 'النهارده وامبارح'], [7, 'آخر 7 أيام'], [30, 'الشهر ده'], [90, 'آخر 3 شهور']]],
    ['sales.all', 'يشوف فواتير الكاشيرية التانيين (مش فواتيره بس)', 'See other cashiers\' invoices']);
  var cp = ROLE_PRESETS.cashier;
  ROLE_PRESETS.cashier = function () { var o = cp(); o['sales.history'] = true; o['pos.returnReq'] = true; o['pos.reprint'] = true; o['sales.days'] = 1; return o; };
})();

var RetReq = {
  list: function () { return Store.db.retReqs = Store.db.retReqs || []; },
  approver: function (u) { u = u || App.user; return !!u && u.active !== false && (u.role === 'admin' || !!(u.perms || {})['returns.approve']); },
  need: function () { return !can('pos.return') && can('pos.returnReq'); },
  pending: function () { return RetReq.list().filter(function (r) { return r.status === 'pending'; }); },
  // the earliest date this user may see (0 = no limit)
  minDate: function () {
    if (!App.user || App.user.role === 'admin') return 0;
    var d = U.n((App.user.perms || {})['sales.days']); if (!d) return 0;
    var t = new Date(); t.setHours(0, 0, 0, 0);
    if (d === 30) t.setDate(1); else t.setDate(t.getDate() - (d - 1));
    return t.getTime();
  },
  mineOnly: function () { return !!App.user && App.user.role !== 'admin' && !can('shifts.all') && !can('sales.all'); },
  visible: function (s) { if (!s) return false; if (s.date < RetReq.minDate()) return false; if (RetReq.mineOnly() && s.user !== App.user.id) return false; return true; },
  daysLabel: function () { var d = U.n((App.user.perms || {})['sales.days']); return ({ 1: L('فواتير النهارده بس', 'today only'), 2: L('النهارده وامبارح', 'today & yesterday'), 7: L('آخر 7 أيام', 'last 7 days'), 30: L('الشهر ده', 'this month'), 90: L('آخر 3 شهور', 'last 3 months') })[d] || ''; },
  sale: function (id) { return Store.db.sales.filter(function (s) { return s.id === id; })[0]; },
  qtys: function (m) { var q = {}; $$('[data-rq]', m).forEach(function (i) { var v = Math.min(U.n(i.value), U.n(i.max)); if (v > 0) q[i.dataset.rq] = v; }); return q; },
  // the cashier asks: approve now with the admin's password, or send the request
  ask: function (s, m, go2) {
    var q = RetReq.qtys(m), keys = Object.keys(q);
    if (!keys.length) return toast(L('حدد الكمية الراجعة من كل صنف الأول', 'Set the returned quantities first'), 'bad');
    var aps = Store.db.users.filter(function (u) { return RetReq.approver(u) && u.id !== App.user.id; });
    var list = keys.map(function (k) { var it = s.items[+k]; return '<div class="list-row small"><span class="grow">' + U.esc(it.name) + '</span><b class="num">× ' + q[k] + '</b><span class="num">' + U.money(q[k] * it.price) + '</span></div>'; }).join('');
    var a = Modal.open({ title: '🔐 ' + L('المرتجع محتاج موافقة المدير', 'This return needs the admin\'s approval'), body: '<div class="col">' + list +
      '<label class="f">' + L('سبب المرتجع', 'Reason') + '<input class="in" id="rrW" placeholder="' + L('مثلاً: عيب صناعة / مقاس غلط', 'e.g. defect / wrong size') + '"></label>' +
      '<div class="card col" style="padding:10px"><b>✅ ' + L('موافقة دلوقتي — المدير جنبك', 'Approve now — the admin is here') + '</b><div class="grid g2"><label class="f">' + L('المدير', 'Admin') + '<select class="in" id="rrU">' + aps.map(function (u) { return '<option value="' + u.id + '">' + U.esc(u.name) + '</option>'; }).join('') + '</select></label><label class="f">' + L('كلمة سره', 'His password') + '<input class="in" type="password" id="rrP"></label></div><button class="btn pri" id="rrOk">' + L('موافقة وتنفيذ المرتجع', 'Approve & do the return') + '</button></div>' +
      '<div class="card col" style="padding:10px"><b>📨 ' + L('أو ابعت طلب للمدير', 'Or send a request') + '</b><div class="muted small">' + L('الطلب هيظهر عند المدير، ولما يوافق هتلاقيه في «الفواتير والمرتجع» وتنفّذه.', 'The admin sees it; once approved you will find it under Invoices & Returns.') + '</div><button class="btn" id="rrSend">📨 ' + L('ابعت الطلب', 'Send request') + '</button></div></div>' });
    $('#rrP', a).onkeydown = function (e) { if (e.key === 'Enter') $('#rrOk', a).click(); };
    $('#rrOk', a).onclick = function () {
      var u = Store.db.users.filter(function (x) { return x.id === $('#rrU', a).value; })[0]; if (!u) return toast(L('مفيش مدير متسجل', 'No admin user'), 'bad');
      Sec.verify($('#rrP', a).value, u).then(function (ok) {
        if (!ok) { beep(false); return toast(L('كلمة السر غلط', 'Wrong password'), 'bad'); }
        var r = { id: U.id(), sale: s.id, no: s.no, q: q, total: U.r2(keys.reduce(function (t, k) { return t + q[k] * s.items[+k].price; }, 0)), by: App.user.id, byName: App.user.name, at: Date.now(), why: $('#rrW', a).value.trim(), status: 'approved', okBy: u.name, okAt: Date.now(), live: true };
        RetReq.list().push(r); Store.log('return.approve', '#' + s.no + ' ' + u.name + ' (live)'); Store.save(); Modal.close(a); go2(r);
      });
    };
    $('#rrSend', a).onclick = function () {
      var r = { id: U.id(), sale: s.id, no: s.no, q: q, total: U.r2(keys.reduce(function (t, k) { return t + q[k] * s.items[+k].price; }, 0)), by: App.user.id, byName: App.user.name, at: Date.now(), why: $('#rrW', a).value.trim(), status: 'pending' };
      RetReq.list().push(r); Store.log('return.request', '#' + s.no); Store.save(); Modal.close(a); Modal.close(m);
      toast('📨 ' + L('اتبعت الطلب للمدير', 'Request sent to the admin'), 'ok'); if (App.view === 'sales') Views.sales.render($('#view'));
    };
  },
  decide: function (r, ok, el) {
    if (ok) { r.status = 'approved'; r.okBy = App.user.name; r.okAt = Date.now(); Store.log('return.approve', '#' + r.no + ' ' + r.byName); Store.save(); toast('✅ ' + L('اتوافق — الكاشير هينفّذه', 'Approved'), 'ok'); RetReq.refresh(el); }
    else Modal.prompt(L('رفض طلب المرتجع', 'Reject the request'), L('سبب الرفض (اختياري)', 'Reason (optional)'), '', function (v) { r.status = 'rejected'; r.noBy = App.user.name; r.noAt = Date.now(); r.noWhy = v || ''; Store.log('return.reject', '#' + r.no); Store.save(); RetReq.refresh(el); });
  },
  refresh: function (el) { if (App.view === 'sales') Views.sales.render($('#view')); else if (App.view === 'dashboard') Views.dashboard($('#view')); else if (el) el.remove(); },
  // execute an approved request: open the invoice with the quantities filled in
  run: function (r) {
    var s = RetReq.sale(r.sale); if (!s) return toast(L('الفاتورة مش موجودة', 'Invoice not found'), 'bad');
    RetReq.cur = r; RetReq.skipView = true; try { Views.sales.open(s); } finally { RetReq.skipView = false; }
    var m = $$('.mask').pop(); if (!m) return;
    $$('[data-rq]', m).forEach(function (i) { i.value = r.q[i.dataset.rq] || 0; i.readOnly = true; });
    var d = $('#dor', m); if (d) { d.scrollIntoView({ block: 'center' }); d.classList.add('pri'); }
    toast('✅ ' + L('الطلب متوافق عليه — دوس «تنفيذ المرتجع»', 'Approved — press the return button'), 'ok');
  },
  card: function (forList) {
    var me = App.user, appr = RetReq.approver(), all = RetReq.list();
    var pend = appr ? RetReq.pending() : [], mineOk = all.filter(function (r) { return r.by === me.id && (r.status === 'approved' || (r.status === 'rejected' && !r.seen)); }), mineWait = all.filter(function (r) { return r.by === me.id && r.status === 'pending'; });
    if (!pend.length && !mineOk.length && !mineWait.length) return null;
    var row = function (r, btns) { var s = RetReq.sale(r.sale); return '<div class="list-row"><div class="grow"><b>' + L('فاتورة #', 'Invoice #') + r.no + '</b> — <span class="num">' + U.money(r.total) + '</span> <span class="muted small">' + U.esc(r.byName) + ' · ' + U.dt(r.at) + '</span>' + (s ? '<div class="small">' + Object.keys(r.q).map(function (k) { var it = s.items[+k]; return it ? U.esc(it.name) + ' × ' + r.q[k] : ''; }).join('، ') + '</div>' : '') + (r.why ? '<div class="muted small">💬 ' + U.esc(r.why) + '</div>' : '') + (r.status === 'rejected' ? '<div class="small" style="color:var(--bad)">❌ ' + L('اترفض', 'Rejected') + (r.noBy ? ' — ' + U.esc(r.noBy) : '') + (r.noWhy ? ': ' + U.esc(r.noWhy) : '') + '</div>' : '') + '</div>' + btns + '</div>'; };
    var c = document.createElement('div'); c.className = 'card col'; c.id = 'rrCard'; c.style.marginBottom = '12px';
    c.innerHTML = (pend.length ? '<b>📨 ' + L('طلبات مرتجع مستنية موافقتك', 'Return requests waiting for you') + ' <span class="chip warn">' + pend.length + '</span></b>' + pend.map(function (r) { return row(r, '<button class="btn sm" data-ro="' + r.id + '">👁️</button><button class="btn sm pri" data-ry="' + r.id + '">✅ ' + L('موافقة', 'Approve') + '</button><button class="btn sm" data-rn="' + r.id + '" style="color:var(--bad)">✕ ' + L('رفض', 'Reject') + '</button>'); }).join('') : '') +
      (mineOk.length ? '<b>🔔 ' + L('ردود المدير على طلباتك', 'Replies to your requests') + '</b>' + mineOk.map(function (r) { return row(r, r.status === 'approved' ? '<button class="btn sm pri" data-rx="' + r.id + '">↩️ ' + L('تنفيذ المرتجع', 'Do the return') + '</button>' : '<button class="btn sm" data-rs="' + r.id + '">' + L('تمام', 'OK') + '</button>'); }).join('') : '') +
      (mineWait.length ? '<div class="muted small">⏳ ' + mineWait.length + L(' طلب مستني موافقة المدير', ' request(s) waiting for approval') + ' (' + mineWait.map(function (r) { return '#' + r.no; }).join('، ') + ')</div>' : '');
    var by = function (id) { return all.filter(function (r) { return r.id === id; })[0]; };
    $$('[data-ry]', c).forEach(function (b) { b.onclick = function () { RetReq.decide(by(b.dataset.ry), true, c); }; });
    $$('[data-rn]', c).forEach(function (b) { b.onclick = function () { RetReq.decide(by(b.dataset.rn), false, c); }; });
    $$('[data-ro]', c).forEach(function (b) { b.onclick = function () { var s = RetReq.sale(by(b.dataset.ro).sale); if (s) { RetReq.skipView = true; try { Views.sales.open(s); } finally { RetReq.skipView = false; } } }; });
    $$('[data-rx]', c).forEach(function (b) { b.onclick = function () { RetReq.run(by(b.dataset.rx)); }; });
    $$('[data-rs]', c).forEach(function (b) { b.onclick = function () { by(b.dataset.rs).seen = true; Store.save(); RetReq.refresh(c); }; });
    return c;
  }
};

/* ---------- invoice list: only what this cashier is allowed to see ---------- */
(function () {
  var tb = Views.sales.table;
  Views.sales.table = function () {
    var all = Store.db.sales, min = RetReq.minDate(), mine = RetReq.mineOnly();
    RetReq.fakeAll = !!App.user && App.user.role !== 'admin' && can('sales.all');
    try {
      if (!min && !mine) return tb.apply(this, arguments);
      Store.db.sales = all.filter(function (s) { return s.date >= min && (!mine || s.user === App.user.id); });
      try { tb.apply(this, arguments); } finally { Store.db.sales = all; }
    } finally { RetReq.fakeAll = false; }
  };
  var rd = Views.sales.render;
  Views.sales.render = function (el) {
    var st = Views.sales.st, min = RetReq.minDate();
    if (min && rangeMs(st)[0] < min) { st.range = 'custom'; st.from = U.today(new Date(min)); if (rangeMs(st)[1] <= min) st.to = U.today(); }
    rd.apply(this, arguments);
    var c = RetReq.card(); if (c) el.insertBefore(c, el.firstChild);
    if (min || RetReq.mineOnly()) { var n = document.createElement('div'); n.className = 'chip'; n.style.cssText = 'margin-bottom:10px;display:inline-block'; n.textContent = '👁️ ' + L('مسموحلك تشوف: ', 'You can see: ') + [RetReq.daysLabel(), RetReq.mineOnly() ? L('فواتيرك انت بس', 'only your invoices') : ''].filter(Boolean).join(' — '); el.insertBefore(n, c ? c.nextSibling : el.firstChild); }
    var fi = $('[data-f="from"], #sr [data-f]', el); if (fi && min) fi.min = U.today(new Date(min));
  };
  // opening one invoice: respect the limits, and the approval step instead of a direct return
  var op = Views.sales.open;
  Views.sales.open = function (s) {
    if (!s) return;
    if (!RetReq.skipView && !RetReq.visible(s)) return toast('⛔ ' + L('الفاتورة دي برّه الفواتير المسموحلك تشوفها', 'This invoice is outside what you are allowed to see'), 'bad');
    var req = RetReq.need() && s.type === 'sale' && !s.void, cur = RetReq.cur && RetReq.cur.sale === s.id && RetReq.cur.status === 'approved' ? RetReq.cur : null;
    if (!cur) RetReq.cur = null;
    if (!req) return op.apply(this, arguments);
    RetReq.fake = true; var r; try { r = op.apply(this, arguments); } finally { RetReq.fake = false; }
    var m = $$('.mask').pop(); if (!m || !$('#dor', m)) return r;
    var d = $('#dor', m); if (!cur) d.innerHTML = '🔐 ' + L('طلب مرتجع (بموافقة المدير)', 'Request a return (admin approval)');
    m.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('#dor, #dox'); if (!b || m._ok) return;
      if (cur) { m._ok = cur; return; }
      e.preventDefault(); e.stopImmediatePropagation();
      RetReq.ask(s, m, function (rq) { m._ok = rq; RetReq.cur = rq; $$('[data-rq]', m).forEach(function (i) { i.readOnly = true; }); b.click(); });
    }, true);
    return r;
  };
  var c0 = can;
  can = function (p) { if (p === 'pos.return' && RetReq.fake) return true; if (p === 'shifts.all' && RetReq.fakeAll) return true; return c0(p); };
  // the return created from an approved request is stamped and the request closed
  var sc = Sales.create;
  Sales.create = function (o) {
    var r = sc.apply(this, arguments), q = RetReq.cur;
    try { if (r && q && r.type === 'return' && r.ref === q.sale) { r.approvedBy = q.okBy; r.retReq = q.id; q.status = 'done'; q.doneAt = Date.now(); q.ret = r.no; RetReq.cur = null; Store.save(); } } catch (e) { }
    return r;
  };
})();

/* ---------- dashboard: the admin sees waiting requests, the cashier sees replies ---------- */
(function () {
  var db0 = Views.dashboard;
  Views.dashboard = function (el) { var r = db0.apply(this, arguments); try { var c = RetReq.card(); if (c) el.insertBefore(c, el.firstChild); } catch (e) { } return r; };
  // a heads-up when an approver logs in
  var sr = Shell.render, told = null;
  Shell.render = function () { var r = sr.apply(this, arguments); try { if (App.user && told !== App.user.id) { told = App.user.id; var n = RetReq.approver() ? RetReq.pending().length : 0; if (n) setTimeout(function () { toast('📨 ' + n + L(' طلب مرتجع مستني موافقتك — من «الفواتير والمرتجع»', ' return request(s) waiting for you'), 'warn'); }, 900); } } catch (e) { } return r; };
})();

/* ================= developer policy for all cashiers: invoices & returns ================= */
var CashPol = {
  get: function () { return devS().cashPol || null; },
  on: function () { var p = CashPol.get(); return !!(p && p.on) && !!App.user && App.user.role !== 'admin' && !App.user.dev; },
  perm: function (k) { // undefined = not decided by the policy
    if (!CashPol.on()) return undefined; var p = CashPol.get();
    if (k === 'sales.history') return true;
    if (k === 'pos.return') return p.ret === 'direct';
    if (k === 'pos.returnReq') return p.ret === 'req';
    if (k === 'pos.reprint') return !!p.reprint;
    if (k === 'sales.all') return !!p.all;
    return undefined;
  },
  days: function () { return CashPol.on() ? U.n(CashPol.get().days) : U.n(((App.user || {}).perms || {})['sales.days']); },
  card: function () {
    var d = devS(), p = d.cashPol = d.cashPol || { on: false, ret: 'req', days: 1, all: false, reprint: true };
    var c = document.createElement('div'); c.className = 'card col'; c.id = 'dvCash';
    var opt = function (v, t, cur) { return '<option value="' + v + '"' + (String(cur) === String(v) ? ' selected' : '') + '>' + t + '</option>'; };
    c.innerHTML = '<h3>🧾 ' + L('الكاشيرية: الفواتير والمرتجع', 'Cashiers: invoices & returns') + '</h3>' +
      '<label class="row"><input type="checkbox" class="sw" id="cpOn"' + (p.on ? ' checked' : '') + '> <b>' + L('طبّق القواعد دي على كل الكاشيرية (أي حد مش مدير)', 'Apply these rules to every non-admin user') + '</b></label>' +
      '<div class="grid g2"><label class="f">↩️ ' + L('المرتجع', 'Returns') + '<select class="in" id="cpRet">' + opt('req', 'بموافقة المدير (يطلب والمدير يوافق)', p.ret) + opt('direct', 'مباشر من غير موافقة', p.ret) + opt('no', 'ممنوع', p.ret) + '</select></label>' +
      '<label class="f">📅 ' + L('يرجع لفواتير', 'Can look back at') + '<select class="in" id="cpDays">' + [[1, 'النهارده بس'], [2, 'النهارده وامبارح'], [7, 'آخر 7 أيام'], [30, 'الشهر ده'], [90, 'آخر 3 شهور'], [0, 'كل الفواتير']].map(function (o) { return opt(o[0], o[1], p.days); }).join('') + '</select></label>' +
      '<label class="f">👥 ' + L('يشوف', 'Sees') + '<select class="in" id="cpAll">' + opt('0', 'فواتيره هو بس', p.all ? 1 : 0) + opt('1', 'فواتير كل الكاشيرية', p.all ? 1 : 0) + '</select></label>' +
      '<label class="row" style="align-self:end"><input type="checkbox" class="sw" id="cpRp"' + (p.reprint ? ' checked' : '') + '> 🖨️ ' + L('يطبع أي فاتورة من دول تاني', 'Can reprint them') + '</label></div>' +
      '<div class="muted small">' + L('لما تكون شغالة: كل كاشير بيلاقي «الفواتير والمرتجع» في القايمة، بيبحث برقم الفاتورة، وبيشوف الفواتير في المدة دي بس، والمرتجع على حسب اختيارك. صاحب المحل مايقدرش يغيّرها من الصلاحيات. لو مقفولة: كل كاشير على حسب صلاحياته اللي صاحب المحل حددها.', 'When on, these rules override each cashier\'s own permissions.') + '</div>';
    var sv = function () { Store.log('dev.cashPol', JSON.stringify(p)); Store.save(); toast(L('اتحفظ', 'Saved'), 'ok'); };
    $('#cpOn', c).onchange = function () { p.on = this.checked; sv(); };
    $('#cpRet', c).onchange = function () { p.ret = this.value; sv(); };
    $('#cpDays', c).onchange = function () { p.days = U.n(this.value); sv(); };
    $('#cpAll', c).onchange = function () { p.all = this.value === '1'; sv(); };
    $('#cpRp', c).onchange = function () { p.reprint = this.checked; sv(); };
    return c;
  }
};
(function () {
  var c0 = can;
  can = function (p) { if (p === 'pos.return' && RetReq.fake) return true; var v = CashPol.perm(p); if (v !== undefined) return v && !(FEAT_BY_PERM[p] && !F(FEAT_BY_PERM[p])); return c0(p); };
  RetReq.minDate = (function () {
    return function () {
      if (!App.user || App.user.role === 'admin' || App.user.dev) return 0;
      var d = CashPol.days(); if (!d) return 0;
      var t = new Date(); t.setHours(0, 0, 0, 0);
      if (d === 30) t.setDate(1); else t.setDate(t.getDate() - (d - 1));
      return t.getTime();
    };
  })();
  var dl = RetReq.daysLabel; RetReq.daysLabel = function () { var d = CashPol.days(); return ({ 1: L('فواتير النهارده بس', 'today only'), 2: L('النهارده وامبارح', 'today & yesterday'), 7: L('آخر 7 أيام', 'last 7 days'), 30: L('الشهر ده', 'this month'), 90: L('آخر 3 شهور', 'last 3 months') })[d] || ''; void dl; };
  // developer panel: the shop-rule cards go right at the top so they are easy to find
  var dv = Views.dev;
  Views.dev = function (el) {
    var r = dv.apply(this, arguments); if (!Dev.unlocked) return r;
    var hero = $('.dev-hero', el); if (!hero) return r;
    var top = document.createElement('div'); top.className = 'grid g2'; top.id = 'dvTop'; top.style.cssText = 'align-items:start;margin-top:16px';
    var cards = [CashPol.card()];
    ['#dvRep', '#pgOn'].forEach(function (s) { var x = $(s, el), cd = x && x.closest('.card'); if (cd) { cd.style.gridColumn = ''; cards.push(cd); } });
    cards.forEach(function (cd) { top.appendChild(cd); });
    hero.parentNode.insertBefore(top, hero.nextSibling);
    var h = document.createElement('div'); h.className = 'muted small'; h.style.cssText = 'margin:14px 2px 0'; h.textContent = '⚡ ' + L('قواعد المحل — اللي بتفرضها على صاحب المحل والكاشيرية', 'Shop rules you enforce'); hero.parentNode.insertBefore(h, top);
    return r;
  };
})();
(function () {
  var ue = Views.users.edit;
  Views.users.edit = function () {
    var r = ue.apply(this, arguments); try { var p = CashPol.get(), m = $$('.mask').pop(), pl = m && $('#pl', m); if (p && p.on && pl) { var n = document.createElement('div'); n.className = 'chip warn'; n.style.cssText = 'display:block;white-space:normal;margin-bottom:8px'; n.textContent = '🛠️ ' + L('الفواتير والمرتجع وإعادة الطباعة للكاشيرية متحددين من المطوّر — الاختيارات دي هنا مش هتغيّرهم.', 'Invoices, returns & reprint for cashiers are set by the developer.'); pl.parentNode.insertBefore(n, pl); } } catch (e) { }
    return r;
  };
})();
