/* Ghandi Home — sales per account: every user sees what they sold (today / yesterday / 7 days / month / a date & time range),
   the owner sees every account and the total. Shown at the top of the home page. */
'use strict';

var UserSales = {
  st: { p: 'today', from: '', to: '' },
  range: function () {
    var st = UserSales.st, t0 = dayStart(), now = Date.now();
    if (st.p === 'yest') return [t0 - 864e5, t0];
    if (st.p === 'week') return [t0 - 6 * 864e5, now + 1];
    if (st.p === 'month') { var m = new Date(); m.setDate(1); return [dayStart(m), now + 1]; }
    if (st.p === 'custom') { var f = st.from ? new Date(st.from).getTime() : t0, t = st.to ? new Date(st.to).getTime() : now; return [f, Math.max(f, t) + 59999]; }
    return [t0, t0 + 864e5];
  },
  label: function () { var st = UserSales.st, r = UserSales.range(); return st.p === 'today' ? L('النهارده', 'Today') : st.p === 'yest' ? L('امبارح', 'Yesterday') : st.p === 'week' ? L('آخر 7 أيام', 'Last 7 days') : st.p === 'month' ? L('الشهر ده', 'This month') : U.dt(r[0]) + ' ← ' + U.dt(r[1]); },
  calc: function (list) {
    var o = { n: 0, sales: 0, ret: 0, net: 0, pcs: 0 };
    list.forEach(function (s) { if (s.type === 'return') { o.ret += U.n(s.total); o.pcs -= s.items.reduce(function (a, i) { return a + i.qty; }, 0); } else { o.n++; o.sales += U.n(s.total); o.pcs += s.items.reduce(function (a, i) { return a + i.qty; }, 0); } });
    o.sales = U.r2(o.sales); o.ret = U.r2(o.ret); o.net = U.r2(o.sales - o.ret); return o;
  },
  all: function () { return !!App.user && (App.user.role === 'admin' || can('shifts.all')); },
  card: function () {
    var st = UserSales.st, r = UserSales.range(), list = salesIn(r[0], r[1]), me = App.user, mine = UserSales.calc(list.filter(function (s) { return s.user === me.id; }));
    var seg = '<div class="seg" id="usP">' + [['today', 'النهارده', 'Today'], ['yest', 'امبارح', 'Yesterday'], ['week', 'آخر 7 أيام', '7 days'], ['month', 'الشهر', 'Month'], ['custom', '📅 تاريخ وساعة', '📅 Date & time']].map(function (x) { return '<button data-p="' + x[0] + '" class="' + (st.p === x[0] ? 'on' : '') + '">' + L(x[1], x[2]) + '</button>'; }).join('') + '</div>' +
      (st.p === 'custom' ? '<div class="row wrap" style="gap:8px;margin-top:8px"><label class="row small" style="gap:6px">' + L('من', 'From') + ' <input class="in" type="datetime-local" id="usF" value="' + U.esc(st.from) + '"></label><label class="row small" style="gap:6px">' + L('إلى', 'To') + ' <input class="in" type="datetime-local" id="usT" value="' + U.esc(st.to) + '"></label></div>' : '');
    var k = function (l, v, cls) { return '<div class="us-k ' + (cls || '') + '"><div class="muted small">' + l + '</div><b class="num">' + v + '</b></div>'; };
    var h = '<div class="card us-card"><div class="row wrap" style="gap:10px;align-items:center"><h3 style="margin:0">💰 ' + L('مبيعاتي', 'My sales') + ' <span class="muted small">— ' + U.esc(me.name) + '</span></h3><div class="grow"></div>' + seg + '</div>' +
      '<div class="us-ks">' + k(L('صافي مبيعاتي', 'My net sales') + ' · ' + UserSales.label(), U.money(mine.net), 'hero') + k(L('عدد الفواتير', 'Invoices'), mine.n) + k(L('القطع', 'Pieces'), mine.pcs) + k(L('المرتجعات', 'Returns'), U.money(mine.ret)) + '</div>';
    if (UserSales.all()) {
      var by = {}; list.forEach(function (s) { var id = s.user || '?'; (by[id] = by[id] || { name: s.userName || '—', list: [] }).list.push(s); });
      (Store.db.users || []).forEach(function (u) { if (u.active !== false && !by[u.id]) by[u.id] = { name: u.name, list: [] }; });
      var rows = Object.keys(by).map(function (id) { var c = UserSales.calc(by[id].list); c.id = id; c.name = by[id].name; var u = (Store.db.users || []).filter(function (x) { return x.id === id; })[0]; c.role = u ? u.role : ''; return c; }).sort(function (a, b) { return b.net - a.net; });
      var tot = UserSales.calc(list);
      h += '<div class="us-all"><div class="row" style="margin:14px 0 6px"><b>👥 ' + L('مبيعات كل الحسابات', 'Sales by account') + ' · ' + UserSales.label() + '</b><div class="grow"></div><span class="chip ok">' + L('الإجمالي: ', 'Total: ') + '<b class="num">' + U.money(tot.net) + '</b></span></div><div class="tbl-wrap"><table class="t"><tr><th>' + L('الحساب', 'Account') + '</th><th>' + L('الفواتير', 'Invoices') + '</th><th>' + L('القطع', 'Pieces') + '</th><th>' + L('المبيعات', 'Sales') + '</th><th>' + L('المرتجعات', 'Returns') + '</th><th>' + L('الصافي', 'Net') + '</th><th>' + L('النسبة', 'Share') + '</th></tr>' +
        rows.map(function (c) { var pc = tot.net ? Math.round(c.net / tot.net * 100) : 0; return '<tr' + (c.id === me.id ? ' class="us-me"' : '') + '><td><b>' + U.esc(c.name) + '</b> <span class="muted small">' + (c.role === 'admin' ? L('مدير', 'admin') : c.role ? L('كاشير', 'cashier') : '') + '</span></td><td class="num">' + c.n + '</td><td class="num">' + c.pcs + '</td><td class="num">' + U.money(c.sales) + '</td><td class="num">' + (c.ret ? '−' + U.money(c.ret) : '—') + '</td><td class="num"><b>' + U.money(c.net) + '</b></td><td><div class="us-bar"><i style="width:' + Math.max(0, pc) + '%"></i></div><span class="muted small num">' + pc + '%</span></td></tr>'; }).join('') +
        '<tr class="us-tot"><td><b>' + L('الإجمالي', 'Total') + '</b></td><td class="num"><b>' + tot.n + '</b></td><td class="num"><b>' + tot.pcs + '</b></td><td class="num"><b>' + U.money(tot.sales) + '</b></td><td class="num"><b>' + (tot.ret ? '−' + U.money(tot.ret) : '—') + '</b></td><td class="num"><b>' + U.money(tot.net) + '</b></td><td></td></tr></table></div></div>';
    }
    return h + '</div>';
  },
  mount: function (el) {
    var old = $('.us-card', el); if (old) old.remove();
    var w = document.createElement('div'); w.innerHTML = UserSales.card(); var c = w.firstChild; el.insertBefore(c, el.firstChild);
    var st = UserSales.st, re = function () { UserSales.mount(el); };
    $$('#usP button', c).forEach(function (b) { b.onclick = function () { st.p = b.dataset.p; if (st.p === 'custom' && !st.from) { var d = new Date(); d.setHours(0, 0, 0, 0); var z = function (x) { return new Date(x - new Date(x).getTimezoneOffset() * 6e4).toISOString().slice(0, 16); }; st.from = z(d.getTime()); st.to = z(Date.now()); } re(); }; });
    if ($('#usF', c)) $('#usF', c).onchange = function () { st.from = this.value; re(); };
    if ($('#usT', c)) $('#usT', c).onchange = function () { st.to = this.value; re(); };
  }
};
(function () {
  var d0 = Views.dashboard;
  Views.dashboard = function (el) { var r = d0.apply(this, arguments); try { if (App.user) UserSales.mount(el); } catch (e) { } return r; };
})();
if (typeof Updater !== 'undefined') Updater.notes['2.0.3'] = ['💰 «مبيعاتي» في الرئيسية: كل حساب يشوف باع بكام النهارده / امبارح / آخر 7 أيام / الشهر / من تاريخ وساعة لتاريخ وساعة', '👥 المدير يشوف مبيعات كل الحسابات والإجمالي'];
