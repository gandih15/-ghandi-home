/* Ghandi Home 1.8.1 — an eye on every number of the home screen (hidden by default), foldable sections,
   and every account remembers its own choice. Eng. Mohamed Ali — 01098811581 */
'use strict';
var Eye = {
  st: function () {
    var u = App.user; if (!u) return { show: {}, fold: {} };
    var rec = Store.db.users.filter(function (x) { return x.id === u.id; })[0] || u;
    rec.dash = rec.dash || { show: {}, fold: {} }; rec.dash.show = rec.dash.show || {}; rec.dash.fold = rec.dash.fold || {};
    return rec.dash;
  },
  shown: function (k) { return !!Eye.st().show[k]; },
  folded: function (k) { return !!Eye.st().fold[k]; },
  set: function (k, v) { Eye.st().show[k] = v; Store.save(); },
  clean: function (t) { return String(t || '').replace(/[\d.,٠-٩·:%\-]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 40); },
  // one unit = one tile/section: its value elements get blurred, the eye toggles them
  unit: function (box, key, vals, o) {
    o = o || {}; if (!box || box.dataset.eyed) return; box.dataset.eyed = '1';
    vals = vals.filter(Boolean); if (!vals.length && !o.fold) return;
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    var bar = document.createElement('i'); bar.className = 'eyebar' + (o.inline ? ' in' : '');
    var eb = document.createElement('i'); eb.className = 'eyeb'; eb.setAttribute('role', 'button'); bar.appendChild(eb);
    var fb = null; if (o.fold) { fb = document.createElement('i'); fb.className = 'eyeb'; fb.setAttribute('role', 'button'); bar.appendChild(fb); }
    var paint = function () {
      var on = Eye.shown(key); eb.textContent = on ? '👁️' : '🙈'; eb.title = on ? L('اخفي الأرقام', 'Hide') : L('اظهر الأرقام', 'Show');
      vals.forEach(function (v) { v.classList.toggle('eye-v', !on); });
      if (fb) { var f = Eye.folded(key); fb.textContent = f ? '▸' : '▾'; fb.title = f ? L('افتح', 'Expand') : L('اطوي', 'Collapse'); (o.fold || []).forEach(function (x) { if (x) x.style.display = f ? 'none' : ''; }); }
    };
    var stop = function (e) { e.preventDefault(); e.stopPropagation(); };
    eb.addEventListener('click', function (e) { stop(e); Eye.set(key, !Eye.shown(key)); paint(); }, true);
    if (fb) fb.addEventListener('click', function (e) { stop(e); Eye.st().fold[key] = !Eye.folded(key); Store.save(); paint(); }, true);
    if (o.after && o.after.parentNode) o.after.parentNode.insertBefore(bar, o.after.nextSibling); else (o.at || box).appendChild(bar); Eye.units.push({ k: key, paint: paint }); paint();
  },
  units: [],
  scan: function (root) {
    if (!root || !App.user) return;
    // alert tiles
    $$('.home-alerts .ha', root).forEach(function (b) { Eye.unit(b, 'ha:' + Eye.clean($('b', b) && $('b', b).textContent), [$('.num', b)], { inline: true, after: $('.num', b) }); });
    // my sales card
    $$('.us-card .us-k', root).forEach(function (k) { Eye.unit(k, 'us:' + Eye.clean($('.muted', k) && $('.muted', k).textContent.split('·')[0]), [$('.num', k)]); });
    var all = $('.us-card .us-all', root); if (all) { var hdr = $('.row', all); Eye.unit(all, 'usall', [$('.chip', all), $('.tbl-wrap', all)], { fold: [$('.tbl-wrap', all)], at: hdr, inline: true }); }
    // the big hero
    var hero = $('section.hero', root); if (hero) { Eye.unit(hero, 'hero:today', [$('.big', hero), $('.cur', hero)].concat($$('.hi', hero).filter(function (h) { return /[%٪]|بـ/.test(h.textContent); }))); $$('.mini > div', hero).forEach(function (d) { Eye.unit(d, 'hero:' + Eye.clean($('span', d) && $('span', d).textContent), [$('b', d)], { inline: true, after: $('b', d) }); }); }
    // quick buttons with counts
    $$('.quick > button', root).forEach(function (b) { var n = $('small.num', b); if (n && /\d/.test(n.textContent)) Eye.unit(b, 'q:' + Eye.clean($('span:not(.gem)', b) && $('span:not(.gem)', b).textContent), [n], { inline: true, after: n }); });
    // kpi cards
    $$('.card.kpi', root).forEach(function (c) { Eye.unit(c, 'kpi:' + Eye.clean($('.l', c) && $('.l', c).textContent), [$('.v', c), $('.muted.small', c)]); });
    // any other card with a title: hide its numbers and fold it
    $$('.card', root).forEach(function (c) {
      if (c.dataset.eyed || c.classList.contains('kpi') || c.classList.contains('ha') || c.closest('.home-alerts') || c.id === 'rrCard') return;
      var h = $(':scope > h3', c) || $(':scope > .row > h3', c) || $(':scope > b', c); if (!h) return;
      var body = [].slice.call(c.children).filter(function (x) { return x !== h && !x.contains(h) && !x.classList.contains('eyebar'); });
      if (c.classList.contains('us-card')) { body = []; }
      Eye.unit(c, 'card:' + Eye.clean(h.textContent), body, { fold: c.classList.contains('us-card') ? [$('.us-ks', c), $('.us-all', c)] : body });
    });
  },
  toolbar: function (root) {
    if ($('#eyeAll', root)) return;
    var t = document.createElement('div'); t.id = 'eyeAll'; t.className = 'row'; t.style.cssText = 'justify-content:flex-end;gap:6px;margin-bottom:8px';
    t.innerHTML = '<button class="btn sm" data-ea="1">👁️ ' + L('اظهر الكل', 'Show all') + '</button><button class="btn sm" data-ea="0">🙈 ' + L('اخفي الكل', 'Hide all') + '</button>';
    $$('[data-ea]', t).forEach(function (b) { b.onclick = function () { var on = b.dataset.ea === '1', st = Eye.st(); Eye.units.forEach(function (u) { st.show[u.k] = on; }); Store.save(); Eye.units.forEach(function (u) { u.paint(); }); }; });
    root.insertBefore(t, root.firstChild);
  }
};
(function () {
  var css = document.createElement('style');
  css.textContent = '.eye-v{filter:blur(7px);opacity:.75;user-select:none;transition:filter .15s}.eyebar,.eyeb{font-style:normal!important;width:auto!important;height:auto!important;min-width:0!important;flex:none!important;box-shadow:none!important;border:0!important;margin:0}.eyebar{background:none!important;padding:0!important}.eyebar{position:absolute;top:6px;inset-inline-end:6px;display:flex;gap:4px;z-index:3}.eyebar.in{position:static;display:inline-flex;margin-inline-start:6px;vertical-align:middle}.eyeb{cursor:pointer;font-size:14px;line-height:1;padding:3px 5px;border-radius:8px;background:rgba(127,127,127,.14);user-select:none}.eyeb:hover{background:rgba(127,127,127,.3)}.home-alerts .ha .eyebar{position:static}section.hero .eyebar:not(.in) .eyeb{background:rgba(255,255,255,.22)}';
  document.head.appendChild(css);
  var db0 = Views.dashboard;
  Views.dashboard = function (el) {
    Eye.units = [];
    var r = db0.apply(this, arguments);
    try { Eye.scan(el); Eye.toolbar(el); } catch (e) { console.error(e); }
    // parts of the page redraw themselves (period buttons, charts…): keep the eyes on them
    if (!el._eyeMo) { el._eyeMo = new MutationObserver(function () { if (App.view !== 'dashboard') return; clearTimeout(el._eyeT); el._eyeT = setTimeout(function () { try { Eye.scan(el); } catch (e) { } }, 30); }); el._eyeMo.observe(el, { childList: true, subtree: true }); }
    return r;
  };
})();

/* ================= POS: where a newly added item shows (top or bottom), chosen by the admin ================= */
var PosOrder = {
  get: function () { return S().posOrder || 'top'; },
  btn: function () {
    var top = PosOrder.get() === 'top';
    return (top ? '⬆️ ' + L('الجديد فوق', 'Newest on top') : '⬇️ ' + L('الجديد تحت', 'Newest at bottom'));
  }
};
(function () {
  var dr = Views.pos.draw;
  Views.pos.draw = function () {
    var r = dr.apply(this, arguments), box = $('#items'); if (!box) return r;
    var rows = $$('#items > .ci');
    if (PosOrder.get() === 'top' && rows.length > 1) rows.reverse().forEach(function (x) { box.appendChild(x); });
    var sel = $('#items > .ci.sel') || (PosOrder.get() === 'top' ? rows[0] : rows[rows.length - 1]);
    if (sel) { try { sel.scrollIntoView({ block: 'nearest' }); } catch (e) { } }
    return r;
  };
  var rn = Views.pos.render;
  Views.pos.render = function (el) {
    var r = rn.apply(this, arguments);
    if (can('settings')) {
      var bar = $('.pos-extra'); if (bar && !$('#xOrd')) {
        var b = document.createElement('button'); b.className = 'btn sm'; b.id = 'xOrd'; b.title = L('ترتيب الأصناف في الفاتورة — للمدير بس', 'Item order in the cart — admin only'); b.textContent = PosOrder.btn();
        b.onclick = function () { S().posOrder = PosOrder.get() === 'top' ? 'bottom' : 'top'; Store.log('pos.order', S().posOrder); Store.save(); b.textContent = PosOrder.btn(); Views.pos.draw(); toast(PosOrder.btn(), 'ok'); };
        bar.appendChild(b);
      }
    }
    return r;
  };
})();

/* ================= what each account sees on the home screen (admin decides per user) ================= */
var DASH = [
  ['alerts', '🔔 التنبيهات (أقساط، توصيلات، تركيبات…)', function (r) { return [$('.home-alerts', r)]; }],
  ['mysales', '💰 كارت «مبيعاتي»', function (r) { return [$('.us-card', r)]; }],
  ['usall', '👥 مبيعات كل الحسابات', function (r) { return [$('.us-card .us-all', r)]; }],
  ['hero', '🌙 الترحيب ومبيعات النهارده', function (r) { return [$('section.hero', r)]; }],
  ['hero.profit', '💰 ربح النهارده', function (r) { return $$('section.hero .mini > div', r).filter(function (d) { return /ربح|Profit/.test(d.textContent); }); }],
  ['extra', '📲 أزرار تقرير اليوم وطلب النواقص', function (r) { return [$('.dash-extra', r)]; }],
  ['quick', '⚡ الأزرار السريعة', function (r) { return [$('.quick', r)]; }],
  ['kpi.sales', '📅 مبيعات الشهر', function (r) { return DashSec.kpi(r, /مبيعات الشهر|Month sales/); }],
  ['kpi.profit', '💎 أرباح الشهر', function (r) { return DashSec.kpi(r, /أرباح الشهر|Profit/); }],
  ['kpi.stock', '📦 قيمة البضاعة', function (r) { return DashSec.kpi(r, /قيمة البضاعة|قيمة المخزون|Stock value/); }],
  ['kpi.avg', '🧮 متوسط الفاتورة', function (r) { return DashSec.kpi(r, /متوسط الفاتورة|Average invoice/); }],
  ['chart', '📈 رسم المبيعات', function (r) { return DashSec.card(r, /المبيعات —|Sales —/); }],
  ['top', '🏆 الأكثر مبيعاً', function (r) { return DashSec.card(r, /الأكثر مبيع|Top sell/); }],
  ['low', '🚨 النواقص', function (r) { return DashSec.card(r, /نواقص|Low stock/); }],
  ['exp', '⏳ قرب انتهاء الصلاحية', function (r) { return DashSec.card(r, /صلاحيت|Expir/); }]
];
var DashSec = {
  kpi: function (r, re) { return $$('.card.kpi', r).filter(function (c) { var l = $('.l', c); return l && re.test(l.textContent); }); },
  card: function (r, re) { return $$('.card', r).filter(function (c) { var h = $(':scope > h3', c); return h && re.test(h.textContent); }); },
  ok: function (k) { if (!App.user || App.user.role === 'admin' || App.user.dev) return true; var v = (App.user.perms || {})['dash.' + k]; return v !== false; },
  apply: function (r) {
    DASH.forEach(function (d) { if (DashSec.ok(d[0])) return; (d[2](r) || []).forEach(function (x) { if (x) x.remove(); }); });
    $$('.grid', r).forEach(function (g) { if (g.parentNode === r && !g.children.length) g.remove(); });
  }
};
(function () {
  // permissions: a group for the home screen (checked = shown)
  PERMS.push(['g', '🏠 الرئيسية — يظهرله إيه', 'Home screen — what this user sees']);
  DASH.forEach(function (d) { PERMS.push(['dash.' + d[0], d[1], d[1]]); });
  var fill = function (o) { DASH.forEach(function (d) { if (o['dash.' + d[0]] === undefined) o['dash.' + d[0]] = true; }); return o; };
  Object.keys(ROLE_PRESETS).forEach(function (k) { var f = ROLE_PRESETS[k]; ROLE_PRESETS[k] = function () { var o = f.apply(this, arguments); DASH.forEach(function (d) { o['dash.' + d[0]] = true; }); return o; }; });
  var ue = Views.users.edit;
  Views.users.edit = function (u) { if (u && u.perms) fill(u.perms); return ue.apply(this, arguments); };
  // average invoice tile
  var db0 = Views.dashboard;
  Views.dashboard = function (el) {
    var r = db0.apply(this, arguments);
    try {
      var g = $$('.grid', el).filter(function (x) { return $('.card.kpi', x); })[0];
      if (g && !DashSec.kpi(el, /متوسط الفاتورة/).length) {
        var m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
        var t0 = new Date(); t0.setHours(0, 0, 0, 0);
        var mine = App.user.role !== 'admin' && !App.user.dev && !can('shifts.all');
        var ss = Store.db.sales.filter(function (s) { return s.type === 'sale' && !s.void && s.date >= m0.getTime() && (!mine || s.user === App.user.id); });
        var tt = ss.filter(function (s) { return s.date >= t0.getTime(); });
        var avg = function (a) { return a.length ? a.reduce(function (x, s) { return x + U.n(s.total); }, 0) / a.length : 0; };
        var c = document.createElement('div'); c.className = 'card kpi';
        c.innerHTML = '<div class="ic"><span class="gem g-sapphire">🧮</span></div><div class="l">' + L('متوسط الفاتورة', 'Average invoice') + '</div><div class="v"><span class="num">' + U.money(avg(ss)) + '</span> <small class="muted">' + cur() + '</small></div><div class="muted small">' + L('النهارده: ', 'Today: ') + U.money(avg(tt)) + ' · ' + ss.length + L(' فاتورة الشهر', ' invoices this month') + '</div>';
        g.appendChild(c); g.classList.remove('g3'); g.classList.add('g4');
      }
      DashSec.apply(el);
      if (typeof Eye !== 'undefined') { Eye.scan(el); }
    } catch (e) { console.error(e); }
    return r;
  };
})();

/* ================= developer: go back to any version ================= */
var VerLib = {
  card: function () {
    var c = document.createElement('div'); c.className = 'card col'; c.id = 'dvVer'; c.style.gridColumn = '1 / -1';
    c.innerHTML = '<h3>🕘 ' + L('الإصدارات — ارجع لأي إصدار', 'Versions — go back to any version') + '</h3><div id="vlList" class="col"><div class="muted small">…</div></div>' +
      '<div class="row wrap" style="gap:8px"><button class="btn" id="vlImp">📥 ' + L('إضافة إصدار من ملف (.asar)', 'Add a version file (.asar)') + '</button><button class="btn ghost" id="vlRef">↻</button></div>' +
      '<div class="muted small">' + L('كل إصدار بيشتغل على الجهاز ده بيتحفظ لوحده هنا، ومعاه الإصدار اللي كان قبل كل تحديث. لما ترجع لإصدار: البيانات بتتحفظ الأول، البرنامج يتقفل ويفتح تاني بالإصدار اللي اخترته، وكل المبيعات والإعدادات والتفعيل زي ما هي. ⚠️ الإصدارات الأقدم من 1.8.3 مفيهاش الصفحة دي — عشان ترجع منها لإصدار أحدث شغّل ملف التحديث بتاعه.', 'Every version that ran here is kept. Switching saves the data first, restarts on the chosen version and keeps all data. Versions before 1.8.3 do not have this page — use an update file to move forward again.') + '</div>';
    var draw = function () {
      var box = $('#vlList', c);
      if (!IS_ELECTRON) { box.innerHTML = '<div class="muted small">' + L('متاح في برنامج الويندوز بس.', 'Available in the Windows app only.') + '</div>'; return; }
      IPC.invoke('versions').then(function (r) {
        var cmp = function (a, b) { var x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0); } return 0; };
        var list = (r.list || []).sort(function (a, b) { return cmp(a.v, b.v); });
        if (!list.some(function (x) { return x.v === r.current; })) list.unshift({ v: r.current, size: 0, t: 0 });
        box.innerHTML = list.map(function (x) { var me = x.v === r.current; return '<div class="list-row"><div class="grow"><b class="num">v' + U.esc(x.v) + '</b> ' + (me ? '<span class="chip ok">' + L('الشغّال دلوقتي', 'Running now') + '</span>' : '') + '<div class="muted small">' + (x.t ? U.dt(x.t) + ' · ' : '') + (x.size ? (x.size / 1048576).toFixed(1) + ' MB' : '') + '</div></div>' + (me ? '' : '<button class="btn sm pri" data-vu="' + U.esc(x.v) + '">↩️ ' + L('ارجع للإصدار ده', 'Switch to this') + '</button>') + (x.size ? '<button class="btn sm ghost" data-ve="' + U.esc(x.v) + '" title="' + L('احفظ نسخة من الإصدار على فلاشة', 'Save a copy') + '">💾</button>' : '') + '</div>'; }).join('') || '<div class="muted small">—</div>';
        $$('[data-vu]', box).forEach(function (b) { b.onclick = function () { VerLib.use(b.dataset.vu); }; });
        $$('[data-ve]', box).forEach(function (b) { b.onclick = function () { IPC.invoke('exportVersion', b.dataset.ve).then(function (x) { if (x.ok) toast('💾 ' + x.path, 'ok'); else if (x.error !== 'cancelled') toast(x.error, 'bad'); }); }; });
      });
    };
    $('#vlImp', c).onclick = function () { if (!IS_ELECTRON) return; IPC.invoke('importVersion').then(function (x) { if (x.ok) { toast('📥 v' + x.v, 'ok'); draw(); } else if (x.error !== 'cancelled') toast(x.error, 'bad'); }); };
    $('#vlRef', c).onclick = draw; draw();
    return c;
  },
  use: function (v) {
    Modal.confirm('↩️ ' + L('ترجع لإصدار ', 'Switch to version ') + '<b>v' + U.esc(v) + '</b>' + L('؟<br>البيانات هتتحفظ والبرنامج هيتقفل ويفتح تاني لوحده.', '?<br>Data is saved and the app restarts.'), function () {
      try { Store.log('dev.version', APP.version + ' → ' + v); Store.saveNow(); if (typeof Backup !== 'undefined' && Backup.run) Backup.run('pre-version'); } catch (e) { }
      IPC.invoke('useVersion', v).then(function (r) { if (!r.ok) toast(r.error || 'error', 'bad'); else toast('↩️ v' + v + ' …', 'ok'); });
    });
  }
};
(function () {
  var dv = Views.dev;
  Views.dev = function (el) {
    var r = dv.apply(this, arguments); if (!Dev.unlocked) return r;
    var top = $('#dvTop', el); var c = VerLib.card();
    if (top) top.appendChild(c); else el.appendChild(c);
    return r;
  };
})();
