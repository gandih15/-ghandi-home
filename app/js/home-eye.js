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
