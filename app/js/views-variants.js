/* Ghandi Home — product options (size / fit size / colour / weight). Optional per product.
   Each option is a full product (own barcode, cost, prices, stock) linked by p.vg; screens show them as one product. */
'use strict';

var VATTR = [['hajm', '📏', 'الحجم', 'Size'], ['size', '👕', 'المقاس', 'Fit size'], ['color', '🎨', 'اللون', 'Colour'], ['weight', '⚖️', 'الوزن', 'Weight'], ['pack', '📦', 'العبوة', 'Pack']];
var VCOLORS = { 'أسود': '#111', 'ابيض': '#fff', 'أبيض': '#fff', 'أحمر': '#d32f2f', 'احمر': '#d32f2f', 'بيج': '#d8c3a5', 'Nude': '#e3b9a0', 'nude': '#e3b9a0', 'وردي': '#f48fb1', 'بمبي': '#f48fb1', 'بني': '#6d4c41', 'ذهبي': '#d4af37', 'فضي': '#c0c0c0', 'أزرق': '#1e88e5', 'ازرق': '#1e88e5', 'كحلي': '#1a237e', 'أخضر': '#2e7d32', 'اخضر': '#2e7d32', 'أصفر': '#fbc02d', 'اصفر': '#fbc02d', 'بنفسجي': '#7b1fa2', 'رمادي': '#9e9e9e', 'برتقالي': '#fb8c00', 'نبيتي': '#7b1f2c', 'موف': '#9575cd' };
var Variants = {
  lists: function () { var s = S(); if (!s.vlists) s.vlists = { hajm: ['صغير', 'وسط', 'كبير'], size: ['S', 'M', 'L', 'XL', 'XXL'], color: ['أسود', 'أبيض', 'أحمر', 'بيج', 'Nude', 'وردي', 'بني', 'ذهبي', 'فضي', 'أزرق'], weight: ['50 جم', '100 جم', '150 مل', '250 مل', '500 مل', '1 لتر'], pack: ['قطعة', 'علبة', 'دستة', 'كرتونة'] }; if (!s.vlists.pack || !s.vlists.pack.length) s.vlists.pack = ['قطعة', 'علبة', 'دستة', 'كرتونة']; VATTR.forEach(function (a) { if (!s.vlists[a[0]]) s.vlists[a[0]] = []; }); return s.vlists; },
  attrName: function (k) { var a = VATTR.filter(function (x) { return x[0] === k; })[0]; return a ? a[1] + ' ' + L(a[2], a[3]) : k; },
  label: function (p) { if (!p || !p.vopt) return ''; return (p.vattrs || Object.keys(p.vopt)).map(function (k) { return p.vopt[k]; }).filter(Boolean).join(' / '); },
  fullName: function (p) { var l = Variants.label(p); return p.name + (l ? ' — ' + l : ''); },
  members: function (vg) { return Store.db.products.filter(function (x) { return x.vg === vg; }); },
  dot: function (v) { var c = VCOLORS[v]; return c ? '<i class="vdot" style="background:' + c + '"></i>' : ''; },
  chip: function (p) { var ks = p.vattrs || Object.keys(p.vopt || {}); return '<span class="vchip">' + (p.vopt && p.vopt.color ? Variants.dot(p.vopt.color) : '') + ks.map(function (k) { return U.esc(p.vopt[k] || ''); }).filter(Boolean).join(' / ') + '</span>'; },
  range: function (a) { a = a.filter(function (x) { return x != null; }); if (!a.length) return '—'; var lo = Math.min.apply(null, a), hi = Math.max.apply(null, a); return lo === hi ? U.money(lo) : U.money(lo) + ' – ' + U.money(hi); }
};
// names everywhere (lists, reports, history, labels) carry the option: «شنطة — أسود / L»
(function () { var pn = pname; pname = function (p) { var n = pn(p); var l = Variants.label(p); return l ? n + ' — ' + l : n; }; })();

/* a small searchable multi-pick for option values (from the managed lists; new values added on purpose) */
var VPick = {
  values: function (box, attr, chosen, onChange) {
    var draw = function () {
      box.innerHTML = '<div class="vp-chips">' + chosen.map(function (v, i) { return '<span class="vchip on">' + (attr === 'color' ? Variants.dot(v) : '') + U.esc(v) + ' <b data-x="' + i + '">✕</b></span>'; }).join('') + '</div><div class="catbox-in"><input class="in cb-search" placeholder="🔎 ' + L('اختار ', 'Pick ') + Variants.attrName(attr) + '…" autocomplete="off"><div class="cb-list hide"></div></div>';
      var q = $('.cb-search', box), list = $('.cb-list', box);
      $$('[data-x]', box).forEach(function (x) { x.onclick = function () { chosen.splice(+x.dataset.x, 1); draw(); onChange(); }; });
      var show = function () {
        var t = U.norm(q.value.trim()), all = Variants.lists()[attr].filter(function (v) { return chosen.indexOf(v) < 0 && (!t || U.norm(v).indexOf(t) >= 0); });
        var exact = Variants.lists()[attr].some(function (v) { return U.norm(v) === t; });
        list.innerHTML = all.map(function (v) { return '<div data-v="' + U.esc(v) + '">' + (attr === 'color' ? Variants.dot(v) : '') + U.esc(v) + '</div>'; }).join('') + (t && !exact ? '<div data-add class="vp-add">➕ ' + L('ضيف «', 'Add «') + U.esc(q.value.trim()) + L('» للقايمة', '» to the list') + '</div>' : '') || '<div class="muted">' + L('كله متختار', 'All picked') + '</div>';
        list.classList.remove('hide');
        $$('[data-v]', list).forEach(function (d) { d.onmousedown = function (e) { e.preventDefault(); chosen.push(d.dataset.v); draw(); onChange(); $('.cb-search', box).focus(); }; });
        var ad = $('[data-add]', list); if (ad) ad.onmousedown = function (e) { e.preventDefault(); var v = q.value.trim().replace(/\s+/g, ' '); Variants.lists()[attr].push(v); Store.save(); chosen.push(v); draw(); onChange(); $('.cb-search', box).focus(); };
      };
      q.onfocus = show; q.oninput = show; q.onblur = function () { setTimeout(function () { list.classList.add('hide'); }, 150); };
      q.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); var f = $('[data-v]', list) || $('[data-add]', list); if (f) f.onmousedown(e); } };
    };
    draw();
  }
};

/* ================= product form: «this product has options» ================= */
var VForm = {
  setup: function (m, p) {
    var members = p && p.vg ? Variants.members(p.vg) : null;
    var st = { on: !!members, attrs: VATTR.map(function (a) { return a[0]; }), rows: [] };
    var base = function () { var c = $('#fcost', m); return { cost: c ? U.n(c.value) : (p ? U.n(p.cost) : 0), p: [0, 1, 2, 3].map(function (t) { var i = $('[data-pr="' + t + '"]', m); return i ? U.n(i.value) : (p ? U.n(p.prices[t]) : 0); }) }; };
    var eff = function (r, f, B) { B = B || base(); if (r[f] !== '' && r[f] != null) return U.n(r[f]); if (f === 'cost') return B.cost; var t = +f.slice(1), d = U.n(r.d), bt = B.p[t]; return t === 0 ? Math.max(0, bt + d) : (bt ? Math.max(0, bt + d) : 0); };
    st.eff = eff;
    // a pack line («علبة» × 12) is linked to the piece line with the same other options: its stock = pieces ÷ count
    var same = function (a, b) { return st.attrs.every(function (k) { return k === 'pack' || (a.c[k] || '') === (b.c[k] || ''); }); };
    var baseRow = function (r) { if (!(U.n(r.u) > 1)) return null; return st.rows.filter(function (o) { return o !== r && o.keep && !(U.n(o.u) > 1) && same(o, r); }).sort(function (a, b) { return (/قطع|pc|piece/i.test(b.c.pack || '') ? 1 : 0) - (/قطع|pc|piece/i.test(a.c.pack || '') ? 1 : 0); })[0] || null; };
    var ownQ = function (r) { return baseRow(r) ? 0 : U.n(r.qty); };
    st.baseRow = baseRow;
    var mk = function (x) { var B = p ? { cost: U.n(p.cost), p: [0, 1, 2, 3].map(function (t) { return U.n(p.prices[t]); }) } : { cost: 0, p: [0, 0, 0, 0] }, xp = [0, 1, 2, 3].map(function (t) { return U.n(x.prices[t]); }), d = xp[0] - B.p[0];
      var r = { pid: x.id, c: Object.assign({}, x.vopt || {}), bc: x.barcodes[0] || '', cost: U.n(x.cost) === B.cost ? '' : U.n(x.cost), d: d || '', qty: U.n(x.stock), u: U.n(x.pu) > 1 ? U.n(x.pu) : '', keep: true }; if (r.u && Pack.base(x)) r.qty = '';
      [0, 1, 2, 3].forEach(function (t) { var fl = B.p[t] ? xp[t] === Math.max(0, B.p[t] + d) : xp[t] === 0; r['p' + t] = fl ? '' : xp[t]; }); return r; };
    if (members) members.forEach(function (x) { st.rows.push(mk(x)); });
    var seed = p && !p.vg ? p : null; // a plain product switched to options becomes the first line
    var card = document.createElement('div'); card.className = 'card vform';
    card.innerHTML = '<div id="vBody"></div>';
    var holder = document.createElement('div'); holder.style.display = 'none'; holder.appendChild(card); $('.mb', m).appendChild(holder);
    var fstEl = $('#fst', m), anchor = fstEl ? fstEl.closest('.grid') : null, box = document.createElement('div'); box.className = 'vfield';
    if (anchor) anchor.parentNode.insertBefore(box, anchor); else $('.mb', m).appendChild(box);
    var liveRows = function () { return st.rows.filter(function (r) { return r.keep && (r.pid || r.bc || U.n(r.qty) || st.attrs.some(function (x) { return r.c[x]; })); }); };
    var summary = function () {
      var lv = st.on ? liveRows() : [], tq = lv.reduce(function (a, r) { return a + ownQ(r); }, 0);
      box.innerHTML = '<div class="vf-h"><b>🎛️ ' + L('الألوان / المقاسات / الأحجام / الأوزان', 'Colours / fit sizes / sizes / weights') + '</b><span class="muted small">' + L('اختياري — لو الصنف ليه أكتر من لون أو مقاس', 'optional — when the product comes in several options') + '</span><div class="grow"></div><button class="btn ' + (lv.length ? '' : 'pri') + ' sm" id="vOpen">' + (lv.length ? '✏️ ' + L('تعديل', 'Edit') : '➕ ' + L('حدد', 'Set')) + '</button></div>' +
        (lv.length ? '<div class="vp-chips" style="margin-top:8px">' + lv.map(function (r) { var l = st.attrs.map(function (a) { return r.c[a]; }).filter(Boolean).join(' / ') || '—', d = U.n(r.d); return '<span class="vchip">' + (r.c.color ? Variants.dot(r.c.color) : '') + U.esc(l) + ' <b class="num">' + (baseRow(r) ? '= ' + Math.floor(U.n(baseRow(r).qty) / U.n(r.u)) + ' (' + U.n(r.u) + L(' قطعة)', ' pcs)') : '×' + U.n(r.qty)) + '</b>' + (d ? ' <span class="num" style="direction:ltr;unicode-bidi:isolate;color:' + (d > 0 ? 'var(--ok)' : 'var(--bad)') + '">' + (d > 0 ? '+' : '') + d + '</span>' : '') + '</span>'; }).join('') + '</div><div class="small" style="margin-top:6px">' + lv.length + L(' اختيار · إجمالي القطع ', ' options · total pieces ') + '<b class="num">' + tq + '</b></div>' : '');
      $('#vOpen', box).onclick = openPop;
      var fst = $('#fst', m); if (fst) { if (st.on) { fst.value = tq; fst.readOnly = true; fst.classList.add('vro'); fst.title = L('الرصيد = مجموع كميات الاختيارات', 'Stock = total of the options'); } else { fst.readOnly = false; fst.classList.remove('vro'); fst.title = ''; } }
    };
    var openPop = function () {
      var pm = Modal.open({ size: 'xl vpop', sticky: true, title: '🎛️ ' + L('الألوان والمقاسات — «', 'Options — «') + U.esc($('#fn', m).value.trim() || L('الصنف', 'product')) + '»', body: '', foot: '<span class="muted small grow">' + L('فرق السعر: 5 = يزيد 5 ج وقت البيع، ‎-5 = يقل 5 ج، فاضي = الأسعار اللي في الصفحة.', 'Price ±: 5 adds 5 at sale, -5 subtracts, empty = the page prices.') + '</span><button class="btn pri" id="vDone">✓ ' + L('تم', 'Done') + '</button>' });
      $('.mb', pm).appendChild(card); st.popup = true; draw();
      var done = function () { st.popup = false; holder.appendChild(card); Modal.close(pm); st.on = !!members || liveRows().length > 0; hideMain(st.on); summary(); };
      $('#vDone', pm).onclick = done; $('[data-x]', pm).onclick = done;
      setTimeout(function () { var q = $('tr[data-i] input', card); if (q) q.focus(); }, 60);
    };
    var hideMain = function (h) { m._vOn = h; var bc = $('#bcin', m), pr = $('[data-pr]', m), fst = $('#fst', m); if (bc) bc.closest('.card').style.display = h ? 'none' : ''; if (pr) { var pc = pr.closest('.card'), nt = $('.vbase-note', pc); if (h && !nt) { nt = document.createElement('div'); nt.className = 'vbase-note chip ok'; nt.style.margin = '0 0 8px'; nt.textContent = '🎛️ ' + L('دي الأسعار الأساسية لكل الاختيارات — اللي يزيد أو يقل اكتبله الفرق في سطره', 'Base prices for all options — set a ± difference per line'); pc.insertBefore(nt, pc.children[1] || null); } if (nt) nt.style.display = h ? '' : 'none'; }  var fs = $('#fs', m); if (fs) (fs.closest('label') || fs).style.display = h ? 'none' : ''; var lp = $('#lprev', m); if (lp && lp.closest('.card')) lp.closest('.card').style.display = h ? 'none' : ''; };
    var vc = can('products.viewCost'), canP = can('products.editPrice') || !p;
    var blank = function () { return { c: {}, u: '', bc: '', d: '', cost: '', p0: '', p1: '', p2: '', p3: '', qty: '', keep: true }; };
    var updPh = function () { var B = base(), cn = $('#vCnt', card); if (cn) { var lv = st.rows.filter(function (r) { return r.keep && (r.pid || r.bc || U.n(r.qty) || st.attrs.some(function (x) { return r.c[x]; })); }); cn.innerHTML = lv.length + L(' اختيار · إجمالي الكمية ', ' options · total qty ') + '<b>' + lv.reduce(function (a, r) { return a + ownQ(r); }, 0) + '</b>'; } $$('tr[data-i]', card).forEach(function (tr) { var r = st.rows[+tr.dataset.i]; if (!r) return; ['cost', 'p0', 'p1', 'p2', 'p3'].forEach(function (f) { var i = $('[data-f="' + f + '"]', tr); if (!i) return; var v = eff(r, f, B); if (f !== 'cost' && f !== 'p0' && !v) v = eff(r, 'p0', B); i.placeholder = String(U.r2(v)); i.classList.toggle('vauto', r[f] === '' || r[f] == null); }); var qi = $('[data-f="qty"]', tr), br = baseRow(r); if (qi) { if (br) { if (r.qty !== '') { r.qty = ''; qi.value = ''; } qi.disabled = true; qi.placeholder = '= ' + Math.floor(U.n(br.qty) / U.n(r.u)); qi.title = L('رصيد العبوة بيتحسب من القطع: ', 'Pack stock comes from pieces: ') + U.n(br.qty) + ' ÷ ' + U.n(r.u); qi.classList.add('vauto'); } else if (qi.title) { qi.disabled = false; qi.placeholder = '0'; qi.title = ''; qi.classList.remove('vauto'); } } }); };
    m.addEventListener('input', function (e) { if (st.on && e.target.matches('[data-pr], #fcost')) updPh(); });
    var addRow = function (focus) { st.rows.push(blank()); draw(); if (focus !== false) { var tr = $$('tr[data-i]', card).pop(); var f = tr && $('input', tr); if (f) f.focus(); } };
    var draw = function () {
      var b = $('#vBody', card);
      if (!st.rows.length) { if (seed) { var r0 = mk(seed); r0.c = {}; r0.pid = seed.id; r0.qty = U.n(seed.stock); ['cost', 'p0', 'p1', 'p2', 'p3', 'd'].forEach(function (f) { r0[f] = ''; }); st.rows.push(r0); } else st.rows.push(blank()); }
      var fields = [['bc', '📷 ' + L('الباركود', 'Barcode'), 'text']].concat(st.attrs.map(function (a) { return ['a:' + a, Variants.attrName(a), 'attr']; }), [['qty', L('الكمية', 'Qty'), 'number'], ['d', '± ' + L('فرق السعر', 'Price ±'), 'number']], vc ? [['cost', L('التكلفة', 'Cost'), 'number']] : [], [['p0', tierName(0), 'number'], ['p1', tierName(1), 'number'], ['p2', tierName(2), 'number'], ['p3', tierName(3), 'number']]);
      var live = st.rows.filter(function (r) { return r.keep && (r.pid || r.bc || U.n(r.qty) || st.attrs.some(function (x) { return r.c[x]; })); }), tq = live.reduce(function (a, r) { return a + ownQ(r); }, 0);
      b.innerHTML = '<div class="muted small" style="margin:8px 0">' + L('املا اللي يخص الصنف بس (حجم / مقاس / لون / وزن / عبوة) — الخانة اللي تسيبها فاضية كأنك مش مختارها.', 'Fill only what applies (size / fit / colour / weight) — an empty field means not used.') + '</div>' +
        st.attrs.map(function (a) { return '<datalist id="vdl-' + a + '">' + Variants.lists()[a].map(function (v) { return '<option value="' + U.esc(v) + '">'; }).join('') + '</datalist>'; }).join('') +
        (st.attrs.length ? '<div class="tbl-wrap"><table class="t vgrid"><tr>' + fields.map(function (f) { return '<th>' + f[1] + '</th>'; }).join('') + '<th></th></tr>' +
          st.rows.map(function (r, i) { return '<tr data-i="' + i + '" class="' + (r.keep ? '' : 'vrm') + '">' + fields.map(function (f) {
            if (f[2] === 'attr') { var a = f[0].slice(2), v = r.c[a] || ''; return '<td><div class="vcell">' + (a === 'color' ? '<span class="vdot-w">' + (Variants.dot(v) || '<i class="vdot" style="background:transparent"></i>') + '</span>' : '') + '<input class="in" data-f="' + f[0] + '" list="vdl-' + a + '" value="' + U.esc(v) + '" placeholder="—" autocomplete="off">' + (a === 'pack' ? '<input class="in num vpu" type="number" min="2" data-f="u" value="' + (r.u || '') + '" placeholder="' + L('× قطع', '× pcs') + '" title="' + L('العبوة فيها كام قطعة؟ لو كتبت عدد، رصيدها بيتحسب من القطع وبيعها بيخصم من القطع. فاضي = رصيد منفصل', 'Pieces in this pack — linked to the piece stock. Empty = separate stock') + '" autocomplete="off">' : '') + '</div></td>'; }
            var val = r[f[0]] === '' || r[f[0]] == null ? '' : r[f[0]], dis = (f[0] !== 'bc' && f[0] !== 'qty' && !canP) || (f[0] === 'qty' && r.pid && !can('stock.apply'));
            var ph = f[0] === 'bc' ? L('امسح أو سيبه', 'scan or leave') : f[0] === 'd' ? '+5 / -5' : '0';
            return '<td><input class="in num' + (f[0] === 'd' ? ' vdiff' : '') + '" ' + (f[2] === 'number' ? 'type="number" ' : 'style="direction:ltr" ') + 'data-f="' + f[0] + '" value="' + U.esc(String(val)) + '" placeholder="' + ph + '"' + (dis ? ' disabled' : '') + ' autocomplete="off"></td>';
          }).join('') + '<td><button class="btn ghost sm" data-rm title="' + (r.keep ? L('شيل', 'Remove') : L('رجّعه', 'Bring back')) + '">' + (r.keep ? '✕' : '↩️') + '</button></td></tr>'; }).join('') +
          '</table></div><div class="row" style="gap:10px;margin-top:8px;align-items:center"><button class="btn pri" id="vAdd">➕ ' + L('إضافة اختيار', 'Add option') + '</button><span class="muted small" id="vCnt">' + live.length + L(' اختيار · إجمالي الكمية ', ' options · total qty ') + '<b>' + tq + '</b></span><div class="grow"></div><span class="muted small">' + L('الأسعار الفاضية بتاخد الأسعار الأساسية + الفرق (الرمادي). Enter في آخر سطر بيضيف سطر جديد، وفي الآخر «حفظ».', 'Empty prices use the base prices + difference (grey). Enter on the last line adds a line; then Save.') + '</span></div>' : '<div class="muted small">' + L('اختار نوع الاختيار', 'Pick the option kind') + '</div>');
      $$('[data-va]', b).forEach(function (c) { c.onchange = function () { var k = c.dataset.va; if (c.checked) { if (st.attrs.length >= 2) { c.checked = false; return toast(L('نوعين بالكتير', 'Two kinds at most'), 'bad'); } st.attrs.push(k); } else { st.attrs = st.attrs.filter(function (x) { return x !== k; }); st.rows.forEach(function (r) { delete r.c[k]; }); } draw(); }; });
      if ($('#vAdd', b)) $('#vAdd', b).onclick = function () { addRow(); };
      $$('tr[data-i]', b).forEach(function (tr) { var i = +tr.dataset.i, r = st.rows[i];
        $$('[data-f]', tr).forEach(function (inp) { var f = inp.dataset.f;
          inp.oninput = function () { inp.classList.remove('req-bad'); if (f.indexOf('a:') === 0) { r.c[f.slice(2)] = inp.value.trim(); updPh(); var dw = inp.parentNode.querySelector('.vdot-w'); if (dw) dw.innerHTML = Variants.dot(inp.value.trim()) || '<i class="vdot" style="background:transparent"></i>'; } else if (f === 'bc') { r.bc = inp.value.trim(); updPh(); } else { r[f] = inp.value === '' ? '' : U.n(inp.value); updPh(); } };
          inp.onkeydown = function (e) { if (e.key !== 'Enter') return; e.preventDefault(); e.stopPropagation();
            if (f === 'bc' && r.bc) { var dupI = st.rows.findIndex(function (o, j) { return j !== i && o.keep && o.bc === r.bc; }); if (dupI >= 0) { st.rows[dupI].qty = U.n(st.rows[dupI].qty) + 1; r.bc = ''; beep(true); toast('➕1 — ' + Object.keys(st.rows[dupI].c).map(function (k) { return st.rows[dupI].c[k]; }).join(' / ') + ' = ' + st.rows[dupI].qty, 'ok'); draw(); var t2 = $('tr[data-i="' + i + '"] [data-f="bc"]', card); if (t2) t2.focus(); return; }
              var o = Store.byBarcode(r.bc); if (o && o.id !== r.pid && !(seed && o.id === seed.id) && !(members && members.some(function (x) { return x.id === o.id; }))) { beep(false); inp.select(); return toast(L('الباركود ده متسجل على: ', 'Barcode belongs to: ') + pname(o), 'bad'); } }
            if (f.indexOf('a:') === 0 && r.c[f.slice(2)]) { var a = f.slice(2), t = U.norm(r.c[a]), l = Variants.lists()[a], ex = l.filter(function (v) { return U.norm(v) === t; })[0] || l.filter(function (v) { return U.norm(v).indexOf(t) === 0; })[0]; if (ex) { r.c[a] = ex; inp.value = ex; inp.oninput(); } }
            var all = $$('input:not([disabled])', tr), ix = all.indexOf(inp);
            if (all[ix + 1]) all[ix + 1].focus(); else { var nx = $('tr[data-i="' + (i + 1) + '"] input', card); if (nx) nx.focus(); else addRow(); } };
        });
        updPh();
        $('[data-rm]', tr).onclick = function () { if (!r.pid) { st.rows.splice(i, 1); if (!st.rows.length) st.rows.push(blank()); return draw(); } if (r.keep && U.n(Store.product(r.pid) && Store.product(r.pid).stock) > 0) toast(L('الاختيار ده عليه رصيد — لما تحفظ هيتنقل للمحذوفات وتقدر ترجّعه', 'This option has stock — it moves to «Deleted» on save'), 'warn'); r.keep = !r.keep; draw(); };
      });
    };
    st.draw = draw;
    draw(); hideMain(st.on); summary(); st.summary = summary; st.open = openPop; st.card = card;
    var go2 = function (e) { e.stopImmediatePropagation(); e.preventDefault(); VForm.save(m, p, st, members); };
    m.addEventListener('click', function (e) { if (st.on && e.target.closest('#fsave')) go2(e); }, true);
    m.addEventListener('keydown', function (e) { if (st.on && e.ctrlKey && (e.key === 's' || e.key === 'S')) go2(e); }, true);
  },
  save: function (m, p, st, members) {
    var name = $('#fn', m).value.trim(); if (!name) { beep(false); $('#fn', m).focus(); return toast(L('اكتب اسم الصنف', 'Name is required'), 'bad'); }
    // drop untouched empty lines
    st.rows = st.rows.filter(function (r) { return r.pid || r.bc || U.n(r.qty) || st.attrs.some(function (a) { return r.c[a]; }); });
    var live = st.rows.filter(function (r) { return r.keep; }), bad = [], mark = function (i, f) { var el = $('tr[data-i="' + i + '"] [data-f="' + f + '"]', st.card || m); if (el) { el.classList.add('req-bad'); bad.push(el); } };
    st.draw(); if (!live.length) return toast(L('ضيف اختيار واحد على الأقل', 'Add at least one option'), 'bad');
    // option values: snap to the list (no typos/duplicates), new values join the list
    live.forEach(function (r) { st.attrs.forEach(function (a) { var v = (r.c[a] || '').trim().replace(/\s+/g, ' '); if (!v) return; var l = Variants.lists()[a], ex = l.filter(function (x) { return U.norm(x) === U.norm(v); })[0]; if (ex) v = ex; else l.push(v); r.c[a] = v; }); });
    var rq = typeof reqCfg === 'function' ? reqCfg() : { price0: 1, stock: 1 }, seenK = {}, seenB = {}, dupMsg = null, mine = {};
    (members || []).forEach(function (x) { mine[x.id] = 1; }); if (p) mine[p.id] = 1;
    st.rows.forEach(function (r, i) { if (!r.keep) return;
      if (!st.attrs.some(function (a) { return r.c[a]; })) { st.attrs.forEach(function (a) { mark(i, 'a:' + a); }); dupMsg = dupMsg || L('كل سطر لازم يبقى فيه اختيار واحد على الأقل (حجم أو مقاس أو لون أو وزن)', 'Each line needs at least one option (size, fit, colour or weight)'); }
      [['p0', 'price0'], ['qty', 'stock'], ['cost', 'cost'], ['p1', 'price1'], ['p2', 'price2'], ['p3', 'price3']].forEach(function (f) { if (f[0] === 'qty' && st.baseRow(r)) return; var v = f[0] === 'qty' ? U.n(r.qty) : st.eff(r, f[0]); if (rq[f[1]] && !(v > 0)) mark(i, f[0]); });
      var k = st.attrs.map(function (a) { return r.c[a] || ''; }).join('|'); if (seenK[k]) { mark(i, 'a:' + st.attrs[0]); dupMsg = dupMsg || L('فيه سطرين بنفس الاختيار: ', 'Two lines share the option: ') + k.split('|').filter(Boolean).join(' / '); } seenK[k] = 1;
      if (r.bc) { var o = Store.byBarcode(r.bc); if (seenB[r.bc] || (o && !mine[o.id])) { mark(i, 'bc'); dupMsg = dupMsg || L('الباركود ده مستخدم: ', 'Barcode already used: ') + r.bc + (o && !mine[o.id] ? ' (' + o.name + ')' : ''); } seenB[r.bc] = 1; }
    });
    if (bad.length && !st.popup && st.open) { st.open(); setTimeout(function () { VForm.save(m, p, st, members); }, 80); return; }
    if (bad.length) { beep(false); bad[0].focus(); return toast('⚠️ ' + (dupMsg || L('كمّل الخانات اللي باللون الأحمر', 'Fill the fields marked in red')), 'bad'); }
    var vg = (members && members[0].vg) || 'vg' + U.id(), common = { name: name, nameEn: $('#fne', m) ? $('#fne', m).value.trim() : '', cat: $('#fc', m) ? $('#fc', m).value : '', sub: $('#fsub', m) ? $('#fsub', m).value : '', brand: $('#fb', m) ? $('#fb', m).value.trim() : '', minStock: $('#fmin', m) ? U.n($('#fmin', m).value) : 0, expiry: $('#fexp', m) ? $('#fexp', m).value : '', active: $('#fact', m) ? $('#fact', m).checked : true };
    var img = m._img !== undefined ? m._img : (p && p.img) || '';
    ProdHist.src = 'form'; var db = Store.db, rm = [], link = [];
    st.rows.forEach(function (r) {
      var x = r.pid ? Store.product(r.pid) : null;
      if (!r.keep) { if (x) rm.push(x); return; }
      var isNew = !x; if (isNew) { x = { id: U.id(), created: Date.now(), stock: 0, prices: [0, 0, 0, 0], barcodes: [], cost: 0 }; db.products.push(x); }
      Object.keys(common).forEach(function (f) { x[f] = common[f]; }); if (img) x.img = img; else delete x.img;
      x.vg = vg; x.vattrs = st.attrs.filter(function (a) { return live.some(function (o) { return o.c[a]; }); }); x.vopt = {}; st.attrs.forEach(function (a) { if (r.c[a]) x.vopt[a] = r.c[a]; }); if (r.c.color) x.shade = r.c.color; else if (x.vg && x.shade && !r.c.color && members) delete x.shade;
      var bcs = (x.barcodes || []).slice(); if (r.bc) { bcs = bcs.filter(function (b) { return b !== r.bc; }); bcs.unshift(r.bc); } if (!bcs.length) bcs = [Store.newBarcode()]; x.barcodes = bcs; Store.reindex();
      if (can('products.editPrice') || isNew) { if (can('products.viewCost') || isNew) x.cost = st.eff(r, 'cost'); x.prices = [st.eff(r, 'p0'), st.eff(r, 'p1'), st.eff(r, 'p2'), st.eff(r, 'p3')]; }
      var wasL = !isNew && !!Pack.base(x); if (U.n(r.u) > 1) x.pu = Math.round(U.n(r.u)); else delete x.pu;
      if (st.baseRow(r)) { if (!wasL && !isNew && U.n(x.stock) > 0) link.push([x, U.n(x.stock)]); return; }
      var q = r.qty === '' ? (isNew ? 0 : U.n(x.stock)) : Math.max(0, Math.round(U.n(r.qty)));
      if (isNew) { if (q) Store.move(x.id, q, 'open', L('رصيد افتتاحي', 'Opening')); } else if (q !== U.n(x.stock) && can('stock.apply')) Store.move(x.id, q - U.n(x.stock), 'adjust', L('تعديل يدوي', 'Manual'));
    });
    link.forEach(function (l) { l[0].stock = 0; Store.move(l[0].id, l[1], 'adjust', L('ربط العبوة بالقطع', 'Pack linked to pieces')); }); Pack.sync(vg);
    if (rm.length && typeof Trash !== 'undefined') Trash.del(rm);
    Store.reindex(); Store.log(members ? 'product.options.edit' : 'product.options.add', name + ' (' + live.length + ')'); Store.save(); Modal.close(m);
    toast('✅ ' + L('اتحفظ «', 'Saved «') + name + L('» بـ ', '» with ') + live.length + L(' اختيار', ' options') + (rm.length ? ' — ' + rm.length + L(' اتنقلوا للمحذوفات', ' moved to Deleted') : ''), 'ok');
    if (App.view === 'products') { Views.products.vopen = Views.products.vopen || {}; Views.products.vopen[vg] = true; Views.products.table(); }
  }
};
(function () {
  var P = Views.products, edit = P.edit;
  P.edit = function (p) {
    edit.apply(this, arguments);
    var m = $$('.mask').pop(); if (!m || !$('#fsave', m) || !(can('products.edit') || can('products.add'))) return;
    VForm.setup(m, p);
  };
})();

/* ================= POS: one tile per product, pick the option ================= */
var VChoose = {
  open: function (vg) {
    var ms = Variants.members(vg).filter(function (x) { return x.active !== false; }); if (!ms.length) return;
    var t = App.cart.tier, m = Modal.open({ title: '🎛️ ' + U.esc(ms[0].name), body: '<div class="vchoose">' + ms.map(function (x) { var pr = (Views.pos.price || Promo.price)(x, t), st = U.n(x.stock); return '<button class="vopt' + (st > 0 ? '' : ' out') + '" data-p="' + x.id + '"' + (st > 0 ? '' : ' disabled') + '><div class="vo-l">' + Variants.chip(x) + '</div><div class="vo-p num">' + (pr.base && pr.base > pr.price ? '<s>' + U.money(pr.base) + '</s> ' : '') + '<b>' + U.money(pr.price) + '</b></div><div class="vo-s muted small">' + (st > 0 ? st + L(' متاح', ' in stock') : L('خلص', 'out of stock')) + '</div></button>'; }).join('') + '</div>' });
    $$('[data-p]', m).forEach(function (b) { b.onclick = function () { Modal.close(m); Views.pos.add(Store.product(b.dataset.p)); var s = $('#scan'); if (s) s.focus(); }; });
  }
};
(function () {
  var P = Views.pos, tiles = P.tiles;
  P.tiles = function () {
    tiles.apply(this, arguments); var seen = {};
    $$('#tiles .tile').forEach(function (t) {
      var p = Store.product(t.dataset.id); if (!p || !p.vg) return;
      if (seen[p.vg]) { t.remove(); return; } seen[p.vg] = 1;
      var ms = Variants.members(p.vg).filter(function (x) { return x.active !== false && U.n(x.stock) > 0; }), tier = App.cart.tier;
      var nm = $('.nm', t); if (nm) nm.innerHTML = U.esc(p.name) + ' <span class="chip vcount">🎛️ ' + ms.length + '</span>';
      var stb = $('.st', t); if (stb) stb.textContent = ms.reduce(function (a, x) { return a + ownQty(x); }, 0);
      var prs = ms.map(function (x) { return (P.price || Promo.price)(x, P.tileTier ? P.tileTier() : tier).price; }), lo = Math.min.apply(null, prs), hi = Math.max.apply(null, prs), pe = $('.pr', t);
      if (pe && prs.length) pe.innerHTML = (lo === hi ? '' : '<small>' + L('من ', 'from ') + '</small>') + U.money(lo);
      t.onclick = function () { VChoose.open(p.vg); };
    });
  };
  var scan = P.scan;
  P.scan = function (code) {
    var c = String(code || '').trim(); if (!c || Store.byBarcode(c.replace(/^\d+\*/, ''))) return scan.apply(this, arguments);
    var q = U.norm(c), gs = {}; Store.db.products.forEach(function (x) { if (x.vg && x.active !== false && U.norm(x.name).indexOf(q) >= 0) gs[x.vg] = 1; });
    var k = Object.keys(gs); if (k.length === 1) { VChoose.open(k[0]); var s = $('#scan'); if (s) s.value = ''; return; }
    return scan.apply(this, arguments);
  };
})();

/* ================= products page: one row per product, options under it ================= */
(function () {
  var P = Views.products; P.vopen = P.vopen || {}; var tb = P.table;
  P.table = function () {
    tb.apply(this, arguments);
    var t = $('#pt table'); if (!t) return; var hr = t.tHead ? t.tHead.rows[0] : t.rows[0], idx = {};
    for (var i = 0; i < hr.cells.length; i++) { var tx = hr.cells[i].textContent.trim(); if (/^(الصنف|Product)$/.test(tx)) idx.name = i; else if (/^(الباركود|Barcodes)$/.test(tx)) idx.bc = i; else if (/^(التكلفة|Cost)$/.test(tx)) idx.cost = i; else if (/^(الرصيد|Stock)$/.test(tx)) idx.stock = i; else [0, 1, 2, 3].forEach(function (ti) { if (tx === tierName(ti)) idx['t' + ti] = i; }); }
    var groups = {}; $$('#pt tr[data-id]').forEach(function (r) { var p = Store.product(r.dataset.id); if (p && p.vg) (groups[p.vg] = groups[p.vg] || []).push(r); });
    Object.keys(groups).forEach(function (vg) {
      var rows = groups[vg], ms = Variants.members(vg), first = rows[0], open = !!P.vopen[vg];
      var h = first.cloneNode(true); delete h.dataset.id; h.removeAttribute('data-id'); h.className = 'vparent' + (open ? ' open' : ''); h.dataset.vg = vg;
      var cell = function (k) { return idx[k] != null ? h.cells[idx[k]] : null; };
      if (h.cells[0] && $('input', h.cells[0])) h.cells[0].innerHTML = '';
      var n = cell('name'); if (n) n.innerHTML = '<div class="vp-name"><span class="v-arrow">' + (open ? '▾' : '◂') + '</span><b>' + U.esc(ms[0].name) + '</b><span class="chip vcount">🎛️ ' + ms.length + '</span></div>' + (ms[0].brand ? '<div class="muted small">' + U.esc(ms[0].brand) + '</div>' : '') + '<div class="vp-chips vp-sum"' + (open ? ' style="display:none"' : '') + '>' + ms.slice(0, 6).map(function (x) { return Variants.chip(x); }).join('') + (ms.length > 6 ? '<span class="muted small">+' + (ms.length - 6) + '</span>' : '') + '</div>';
      var b = cell('bc'); if (b) b.innerHTML = '<span class="muted small">' + ms.reduce(function (a, x) { return a + x.barcodes.length; }, 0) + L(' باركود', ' barcodes') + '</span>';
      var c0 = cell('cost'); if (c0) c0.textContent = Variants.range(ms.map(function (x) { return U.n(x.cost); }));
      [0, 1, 2, 3].forEach(function (ti) { var c = cell('t' + ti); if (c) c.textContent = Variants.range(ms.map(function (x) { return priceOf(x, ti); })); });
      var s = cell('stock'); if (s) { var tot = ms.reduce(function (a, x) { return a + ownQty(x); }, 0); s.innerHTML = '<span class="chip num ' + (tot <= 0 ? 'bad' : 'ok') + '">' + tot + '</span>'; }
      var act = h.cells[h.cells.length - 1]; act.innerHTML = (can('products.edit') || can('products.editPrice') ? '<button class="btn ghost sm" data-ve title="' + L('تعديل الصنف واختياراته', 'Edit product & options') + '">' + ic('edit', 16) + '</button>' : '');
      first.parentNode.insertBefore(h, first);
      var after = h; rows.forEach(function (r) { r.classList.add('vchild'); r.style.display = open ? '' : 'none'; after.parentNode.insertBefore(r, after.nextSibling); after = r; var p = Store.product(r.dataset.id), nc = idx.name != null ? r.cells[idx.name] : null; if (nc && p) nc.innerHTML = '<div class="vc-name"><span class="muted">↳</span>' + Variants.chip(p) + '</div>'; if (idx.name > 1 && r.cells[idx.name - 1]) r.cells[idx.name - 1].innerHTML = ''; });
      h.onclick = function (e) { if (e.target.closest('button, input')) return; var o = P.vopen[vg] = !P.vopen[vg]; h.classList.toggle('open', o); rows.forEach(function (r) { r.style.display = o ? '' : 'none'; }); var ar = $('.v-arrow', h); if (ar) ar.textContent = o ? '▾' : '◂'; var sm = $('.vp-sum', h); if (sm) sm.style.display = o ? 'none' : ''; };
      var ve = $('[data-ve]', h); if (ve) ve.onclick = function () { P.edit(ms[0]); };
    });
  };
})();

/* ================= combine existing separate products into one product with options ================= */
Variants.combine = function (P) {
  var sel = Store.db.products.filter(function (p) { return P.sel[p.id]; });
  if (sel.length < 2) return toast(L('علّم على صنفين أو أكتر', 'Select two or more products'), 'bad');
  var vgs = sel.filter(function (p) { return p.vg; }).map(function (p) { return p.vg; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var st = { attrs: [], vals: {} };
  var m = Modal.open({ size: 'wide', title: '🎛️ ' + L('اجمعهم اختيارات لصنف واحد', 'Combine as options of one product'), body: '<div class="col"><label class="f">' + L('اسم الصنف', 'Product name') + '<input class="in" id="vcN" value="' + U.esc(sel[0].name) + '"></label><div class="row wrap" style="gap:6px">' + VATTR.map(function (a) { return '<label class="vtype"><input type="checkbox" data-va="' + a[0] + '"> ' + a[1] + ' ' + L(a[2], a[3]) + '</label>'; }).join('') + '</div><div id="vcT"></div><div class="muted small">' + L('كل صنف بيفضل بباركوده وأسعاره ورصيده ومبيعاته القديمة — بس بيتعرضوا صنف واحد.', 'Every product keeps its barcode, prices, stock and history — they are just shown as one product.') + '</div></div>', foot: '<button class="btn pri" id="vcGo">🎛️ ' + L('اجمع', 'Combine') + '</button>' });
  var draw = function () {
    $('#vcT', m).innerHTML = st.attrs.length ? '<div class="tbl-wrap"><table class="t"><tr><th>' + L('الصنف الحالي', 'Current product') + '</th><th>' + L('السعر', 'Price') + '</th><th>' + L('الرصيد', 'Stock') + '</th>' + st.attrs.map(function (a) { return '<th>' + Variants.attrName(a) + '</th>'; }).join('') + '</tr>' + sel.map(function (p) { return '<tr><td><b>' + U.esc(pname(p)) + '</b><div class="muted small num">' + U.esc(p.barcodes[0] || '') + '</div></td><td class="num">' + U.money(priceOf(p, 0)) + '</td><td class="num">' + U.n(p.stock) + '</td>' + st.attrs.map(function (a) { var cur = (p.vopt || {})[a] || (a === 'color' ? p.shade : '') || ''; return '<td><select class="in" data-pv="' + p.id + '|' + a + '"><option value="">—</option>' + Variants.lists()[a].concat(cur && Variants.lists()[a].indexOf(cur) < 0 ? [cur] : []).map(function (v) { return '<option' + (v === cur ? ' selected' : '') + '>' + U.esc(v) + '</option>'; }).join('') + '</select></td>'; }).join('') + '</tr>'; }).join('') + '</table></div><div class="muted small">' + L('القيمة مش موجودة؟ ضيفها من «الأقسام ← الاختيارات».', 'Missing value? Add it in «Categories → Options».') + '</div>' : '<div class="muted small">' + L('اختار نوع الاختيار (نوع أو اتنين)', 'Pick the option kind (one or two)') + '</div>';
  };
  $$('[data-va]', m).forEach(function (c) { c.onchange = function () { var k = c.dataset.va; if (c.checked) { if (st.attrs.length >= 2) { c.checked = false; return toast(L('نوعين بالكتير', 'Two kinds at most'), 'bad'); } st.attrs.push(k); } else st.attrs = st.attrs.filter(function (x) { return x !== k; }); c.closest('label').classList.toggle('on', c.checked); draw(); }; });
  draw();
  $('#vcGo', m).onclick = function () {
    var name = $('#vcN', m).value.trim(); if (!name) return toast(L('اكتب اسم الصنف', 'Enter the name'), 'bad'); if (!st.attrs.length) return toast(L('اختار نوع الاختيار', 'Pick the option kind'), 'bad');
    var vals = {}, keys = {}, bad = null;
    sel.forEach(function (p) { vals[p.id] = {}; st.attrs.forEach(function (a) { var v = $('[data-pv="' + p.id + '|' + a + '"]', m).value; if (!v) bad = bad || L('حدد ', 'Set ') + Variants.attrName(a) + L(' لـ ', ' for ') + p.name; vals[p.id][a] = v; }); var k = st.attrs.map(function (a) { return vals[p.id][a]; }).join('|'); if (keys[k]) bad = bad || L('فيه صنفين بنفس الاختيار: ', 'Two products share the option: ') + k.replace('|', ' / '); keys[k] = 1; });
    if (bad) { beep(false); return toast(bad, 'bad'); }
    var vg = vgs[0] || 'vg' + U.id(); ProdHist.src = 'move';
    sel.forEach(function (p) { p.vg = vg; p.vattrs = st.attrs.slice(); p.vopt = vals[p.id]; p.name = name; if (st.attrs.indexOf('color') >= 0) p.shade = vals[p.id].color; });
    Store.log('product.combine', name + ' (' + sel.length + ')'); Store.save(); Modal.close(m); P.sel = {}; P.vopen = P.vopen || {}; P.vopen[vg] = true; toast('🎛️ ' + L('بقوا صنف واحد بـ ', 'Now one product with ') + sel.length + L(' اختيار', ' options'), 'ok'); P.table();
  };
};

/* ================= option values managed with the categories ================= */
(function () {
  var rd = Views.cats.render;
  Views.cats.render = function (el) {
    rd.apply(this, arguments); var lists = Variants.lists();
    var c = document.createElement('div'); c.className = 'card'; c.style.marginTop = '16px';
    c.innerHTML = '<h3>🎛️ ' + L('الاختيارات: الأحجام والمقاسات والألوان والأوزان', 'Options: sizes, fit sizes, colours & weights') + '</h3><div class="muted small">' + L('القيم دي بتظهر لما تعمل صنف ليه اختيارات — بتختار منها بدل ما تكتب.', 'These values appear when a product has options — you pick instead of typing.') + '</div><div class="grid g2" style="gap:12px;margin-top:10px">' +
      VATTR.map(function (a) { return '<div class="vlist"><b>' + a[1] + ' ' + L(a[2], a[3]) + '</b><div class="vp-chips" style="margin:6px 0">' + lists[a[0]].map(function (v, i) { return '<span class="vchip">' + (a[0] === 'color' ? Variants.dot(v) : '') + U.esc(v) + ' <b data-del="' + a[0] + '|' + i + '">✕</b></span>'; }).join('') + '</div><div class="row" style="gap:6px"><input class="in" data-addv="' + a[0] + '" placeholder="➕ ' + L('قيمة جديدة', 'New value') + '"><button class="btn sm" data-addb="' + a[0] + '">' + L('إضافة', 'Add') + '</button></div></div>'; }).join('') + '</div>';
    el.appendChild(c);
    var add = function (k) { var i = $('[data-addv="' + k + '"]', c), v = i.value.trim().replace(/\s+/g, ' '); if (!v) return; if (lists[k].some(function (x) { return U.norm(x) === U.norm(v); })) return toast(L('موجودة', 'Already there'), 'bad'); lists[k].push(v); Store.save(); Views.cats.render(el); setTimeout(function () { var n = $('[data-addv="' + k + '"]'); if (n) n.focus(); }, 30); };
    $$('[data-addb]', c).forEach(function (b) { b.onclick = function () { add(b.dataset.addb); }; });
    $$('[data-addv]', c).forEach(function (i) { i.onkeydown = function (e) { if (e.key === 'Enter') add(i.dataset.addv); }; });
    $$('[data-del]', c).forEach(function (x) { x.onclick = function () { var s = x.dataset.del.split('|'), v = lists[s[0]][+s[1]], used = Store.db.products.filter(function (p) { return p.vopt && p.vopt[s[0]] === v; }).length; var go2 = function () { lists[s[0]].splice(+s[1], 1); Store.save(); Views.cats.render(el); }; if (used) Modal.confirm(L('القيمة «', '«') + U.esc(v) + L('» مستخدمة في ', '» is used by ') + used + L(' صنف — هتتشال من القايمة بس، والأصناف هتفضل زي ما هي. تكمل؟', ' products — it is removed from the list only. Continue?'), go2); else go2(); }; });
  };
})();

/* ================= reports: sales per product with options ================= */
(function () {
  var R = Views.reports, rr = R.render;
  R.render = function (el) {
    rr.apply(this, arguments); if (R.tab !== 'sales') return; var body = $('#rBody'); if (!body) return;
    var rg = rangeMs(R.st), g = {};
    salesIn(rg[0], rg[1]).forEach(function (s) { var sg = s.type === 'return' ? -1 : 1; s.items.forEach(function (i) { var p = Store.product(i.pid); if (!p || !p.vg) return; var G = g[p.vg] = g[p.vg] || { n: p.name, q: 0, v: 0, o: {} }; var l = Variants.label(p); G.q += sg * i.qty; G.v += sg * i.qty * i.price; G.o[l] = G.o[l] || { q: 0, v: 0 }; G.o[l].q += sg * i.qty; G.o[l].v += sg * i.qty * i.price; }); });
    var keys = Object.keys(g).sort(function (a, b) { return g[b].v - g[a].v; }); if (!keys.length) return;
    var c = document.createElement('div'); c.className = 'card'; c.style.marginTop = '14px';
    c.innerHTML = '<h3>🎛️ ' + L('الأصناف اللي ليها اختيارات', 'Products with options') + '</h3>' + keys.map(function (k) { var G = g[k]; return '<div class="list-row"><b class="grow">' + U.esc(G.n) + '</b><span class="muted small">× ' + G.q + '</span><b class="num">' + U.money(G.v) + '</b></div>' + Object.keys(G.o).sort(function (a, b) { return G.o[b].v - G.o[a].v; }).map(function (o) { return '<div class="list-row small" style="padding-inline-start:24px"><span class="grow">↳ ' + U.esc(o) + '</span><span class="muted">× ' + G.o[o].q + '</span><span class="num">' + U.money(G.o[o].v) + '</span></div>'; }).join(''); }).join('');
    body.appendChild(c);
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.9.0'] = ['🎛️ اختيارات للصنف (حجم / مقاس / لون / وزن / عبوة) — كل اختيار بباركود وسعر ورصيد، والصنف يظهر واحد', '🏷️ طباعة الباركود على طابعة الباركود على طول + تنزيل الملصقات PDF'];
if (typeof Updater !== 'undefined') Updater.notes['1.9.1'] = ['⚡ إضافة سريعة للاختيارات في سطر واحد: امسح الباركود ← اللون ← الكمية ← Enter، والسعر بيفضل من السطر اللي قبله', '🎛️ فتح وقفل الصنف اللي ليه اختيارات في صفحة الأصناف بقى أنضف ومن غير ما الصفحة تتهز'];
if (typeof Updater !== 'undefined') Updater.notes['1.9.3'] = ['💎 خانة «سعر خاص» في سطور الاختيارات (فاضية = سعر القطاعي)', '🎛️ الحجم والمقاس واللون والوزن موجودين في كل سطر — املا اللي يخص الصنف والفاضي كأنه مش مختار'];
if (typeof Updater !== 'undefined') Updater.notes['1.9.2'] = ['🎛️ الاختيارات بقت سطور تحت بعض: كل سطر فيه الباركود واللون/المقاس والكمية والتكلفة وقطاعي ونص جملة وجملة — «➕ إضافة اختيار» أو Enter في آخر السطر يضيف سطر جديد بنفس الأسعار', '🎨 تقدر تغيّر نوع الاختيار في أي وقت من غير رسالة «امسح السطور»'];

/* ================= receiving: a product with options opens all its options with quantities and a +/- price change ================= */
var VRecv = {
  open: function (vg, focusPid, mult, cb) {
    var ms = Variants.members(vg), vc = can('products.viewCost'), ep = can('products.editPrice'), st = { sign: 1, amt: '', on: { cost: false, p0: true, p1: true, p2: true, p3: true }, rows: {} };
    ms.forEach(function (x) { st.rows[x.id] = { qty: x.id === focusPid ? (mult || 1) : '', cost: '', p0: '', p1: '', p2: '', p3: '' }; });
    var cols = (vc ? ['cost'] : []).concat(ep ? ['p0', 'p1', 'p2', 'p3'] : []), cname = function (f) { return f === 'cost' ? L('التكلفة', 'Cost') : tierName(+f.slice(1)); };
    var cur = function (x, f) { return f === 'cost' ? U.n(x.cost) : U.n(x.prices[+f.slice(1)]); };
    var val = function (x, f) { var r = st.rows[x.id]; if (r[f] !== '') return U.n(r[f]); var c = cur(x, f), a = U.n(st.amt) * st.sign; if (!a || !st.on[f] || (f !== 'p0' && f !== 'cost' && !c)) return c; return Math.max(0, U.r2(c + a)); };
    var m = Modal.open({ size: 'xl', title: '🎛️ ' + L('استلام «', 'Receive «') + U.esc(ms[0].name) + L('» — حدد الألوان والكميات', '» — options & quantities'),
      body: '<div class="col">' + (cols.length ? '<div class="card vadj"><b>💲 ' + L('تعديل الأسعار بمبلغ', 'Change prices by') + '</b><div class="seg" id="vrS"><button data-s="1" class="on">➕ ' + L('زيادة', 'Increase') + '</button><button data-s="-1">➖ ' + L('خصم', 'Decrease') + '</button></div><input class="in num" type="number" id="vrA" placeholder="0" style="width:90px"><span class="muted">' + L('ج.م على:', 'on:') + '</span>' + cols.map(function (f) { return '<label class="vtype' + (st.on[f] ? ' on' : '') + '" style="padding:4px 10px"><input type="checkbox" data-on="' + f + '"' + (st.on[f] ? ' checked' : '') + '> ' + cname(f) + '</label>'; }).join('') + '</div>' : '') + '<div id="vrT"></div></div>',
      foot: '<button class="btn" data-x>' + L('إلغاء', 'Cancel') + '</button><button class="btn pri" id="vrGo">➕ ' + L('أضف للاستلام', 'Add to receipt') + ' <span class="kbd">Ctrl+Enter</span></button>' });
    var table = function () {
      var tq = 0; ms.forEach(function (x) { tq += U.n(st.rows[x.id].qty); });
      $('#vrT', m).innerHTML = '<div class="tbl-wrap"><table class="t vgrid"><tr><th>' + L('الاختيار', 'Option') + '</th><th>' + L('الباركود', 'Barcode') + '</th><th>' + L('الرصيد الحالي ← بعد الاستلام', 'Stock now → after') + '</th><th>' + L('الكمية المستلمة', 'Qty received') + '</th>' + cols.map(function (f) { return '<th>' + cname(f) + '</th>'; }).join('') + '</tr>' +
        ms.map(function (x) { var r = st.rows[x.id]; return '<tr data-p="' + x.id + '"' + (x.id === focusPid ? ' class="vflash"' : '') + '><td><b>' + Variants.chip(x) + '</b></td><td class="num muted small">' + U.esc(x.barcodes[0] || '') + '</td><td class="num vstk"><span class="muted">' + U.n(x.stock) + '</span> → <b class="vaft" style="color:' + (U.n(r.qty) ? 'var(--ok)' : 'var(--muted)') + '">' + (U.n(x.stock) + U.n(r.qty)) + '</b></td><td><input class="in num" type="number" data-rq value="' + r.qty + '" placeholder="0" style="width:70px;font-weight:700"></td>' +
          cols.map(function (f) { var c = cur(x, f), v = val(x, f), ch = r[f] === '' && v !== c; return '<td><input class="in num" type="number" data-rf="' + f + '" value="' + r[f] + '" placeholder="' + (v || (f === 'p0' || f === 'cost' ? 0 : val(x, 'p0'))) + '" style="width:80px"><div class="vchg">' + (ch ? '<s>' + c + '</s> ' + L('←', '→') + ' <b>' + v + '</b>' : '&nbsp;') + '</div></td>'; }).join('') + '</tr>'; }).join('') +
        '</table></div><div class="row" style="gap:12px;margin-top:6px"><span class="muted small">' + L('الخانة الفاضية = السعر الحالي + التعديل · لو كتبت سعر بإيدك بيتاخد هو · الكمية الفاضية مش بتدخل', 'Empty = current price + change · a typed price wins · empty qty is skipped') + '</span><div class="grow"></div><b>' + L('إجمالي المستلم: ', 'Total: ') + '<span class="num">' + tq + '</span></b></div>';
      $$('tr[data-p]', m).forEach(function (tr) { var r = st.rows[tr.dataset.p];
        var q = $('[data-rq]', tr); q.oninput = function () { r.qty = q.value === '' ? '' : Math.max(0, Math.round(U.n(q.value))); var px = Store.product(tr.dataset.p), af = $('.vaft', tr); if (af && px) { af.textContent = U.n(px.stock) + U.n(r.qty); af.style.color = U.n(r.qty) ? 'var(--ok)' : 'var(--muted)'; } var t = 0; ms.forEach(function (x) { t += U.n(st.rows[x.id].qty); }); $('#vrT .row b .num', m).textContent = t; };
        $$('[data-rf]', tr).forEach(function (i) { i.oninput = function () { r[i.dataset.rf] = i.value === '' ? '' : U.n(i.value); }; i.onchange = function () { var pos = i.dataset.rf, id = tr.dataset.p; table(); var n = $('tr[data-p="' + id + '"] [data-rf="' + pos + '"]', m); if (n) n.focus(); }; });
      });
      $$('[data-rq]', m).forEach(function (q, ix, all) { q.onkeydown = function (e) { if (e.key !== 'Enter' || e.ctrlKey) return; e.preventDefault(); e.stopPropagation(); if (all[ix + 1]) { all[ix + 1].focus(); all[ix + 1].select(); } else go(); }; });
    };
    var go = function () {
      var out = []; ms.forEach(function (x) { var q = U.n(st.rows[x.id].qty); if (q > 0) out.push({ pid: x.id, qty: q, cost: vc ? val(x, 'cost') : U.n(x.cost), prices: [0, 1, 2, 3].map(function (t) { return ep ? val(x, 'p' + t) : U.n(x.prices[t]); }) }); });
      if (!out.length) { beep(false); return toast(L('اكتب كمية لاختيار واحد على الأقل', 'Enter a quantity for at least one option'), 'bad'); }
      Modal.close(m); cb(out);
    };
    if ($('#vrS', m)) $$('#vrS button', m).forEach(function (b) { b.onclick = function () { $$('#vrS button', m).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.sign = +b.dataset.s; table(); }; });
    if ($('#vrA', m)) { $('#vrA', m).oninput = function () { st.amt = this.value; table(); }; $('#vrA', m).onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); var q = $('[data-rq]', m); if (q) q.focus(); } }; }
    $$('[data-on]', m).forEach(function (c) { c.onchange = function () { st.on[c.dataset.on] = c.checked; c.closest('label').classList.toggle('on', c.checked); table(); }; });
    $('#vrGo', m).onclick = go; $('[data-x]', m).onclick = function () { Modal.close(m); };
    m.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); go(); } });
    table(); setTimeout(function () { var f = $('tr[data-p="' + focusPid + '"] [data-rq]', m) || $('[data-rq]', m); if (f) { f.focus(); f.select(); } }, 60);
  }
};
(function () {
  var V = Views.purchases, form = V.form;
  V.form = function (el) {
    form.apply(this, arguments);
    var ps = $('#ps'); if (!ps) return; var orig = ps.onkeydown, d = V.draft;
    var put = function (out) {
      out.forEach(function (o) { var e = d.items.filter(function (i) { return i.pid === o.pid; })[0]; if (e) { e.qty += o.qty; e.cost = o.cost; e.prices = o.prices; e.price = o.prices[0]; d.items.splice(d.items.indexOf(e), 1); d.items.push(e); } else d.items.push({ pid: o.pid, qty: o.qty, cost: o.cost, price: o.prices[0], prices: o.prices, isNew: false }); });
      d.flash = true; beep(true); V.form(el);
    };
    ps.onkeydown = function (e) {
      if (e.key === 'Enter') { var v = this.value.trim(), q = 1, mm = v.match(/^(\d+)\*(.+)$/); if (mm) { q = +mm[1]; v = mm[2]; } var p = v && Store.byBarcode(v); if (p && p.vg) { e.preventDefault(); this.value = ''; return VRecv.open(p.vg, p.id, q, put); } }
      return orig.apply(this, arguments);
    };
    var pk = $('#ppick'); if (pk) pk.onclick = function () { pickProduct(function (p) { if (p.vg) return VRecv.open(p.vg, p.id, 1, put); ps.value = p.barcodes[0]; orig.call(ps, { key: 'Enter', preventDefault: function () {} }); }); };
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['1.9.5'] = ['🎛️ الصنف اللي ليه اختيارات: الأسعار الأساسية من كارت الأسعار، ولكل لون «± فرق السعر» — الخانات الفاضية بتاخد الأسعار الأساسية لوحدها', '🚚 في الاستلام: الصنف اللي ليه ألوان بيفتح كل ألوانه تكتب كمياتها، مع زيادة أو خصم مبلغ على كل الأسعار مرة واحدة'];
if (typeof Updater !== 'undefined') Updater.notes['1.9.6'] = ['🎛️ خانة «الألوان / المقاسات / الأحجام / الأوزان» في صفحة الصنف نفسها: تدوس «حدد» تفتح مربع تضيف فيه كل لون بكميته وفرق سعره (+ يزيد / - يقل / فاضي = نفس الأسعار)، والرصيد بيتجمع لوحده'];
if (typeof Updater !== 'undefined') Updater.notes['1.9.7'] = ['🚚 استلام صنف ليه ألوان/مقاسات: قدام كل اختيار رصيده الحالي وهيبقى كام بعد الاستلام، وبيتحدّث وانت بتكتب الكمية'];
if (typeof Updater !== 'undefined') Updater.notes['2.0.8'] = ['📦 اختيار جديد «العبوة» جنب الحجم والمقاس واللون والوزن: قطعة / علبة / دستة / كرتونة — كل عبوة بسعرها وباركودها ورصيدها، ولو مستخدمتهوش كل حاجة زي ما هي'];

/* ================= packs linked to pieces («علبة» = 12 قطعة) =================
   A pack option with a piece count shares the stock of the piece option that has the same colour / size…:
   selling, returning, receiving or counting a pack moves pieces (count × qty); the pack shows pieces ÷ count. */
var Pack = {
  same: function (a, b) { var ks = {}; Object.keys(a.vopt || {}).concat(Object.keys(b.vopt || {})).forEach(function (k) { ks[k] = 1; }); delete ks.pack; return Object.keys(ks).every(function (k) { return (a.vopt[k] || '') === (b.vopt[k] || ''); }); },
  base: function (p) {
    if (!p || !p.vg || !(U.n(p.pu) > 1)) return null; var pc = function (x) { return /قطع|pc|piece/i.test((x.vopt && x.vopt.pack) || '') ? 1 : 0; };
    return Variants.members(p.vg).filter(function (s) { return s !== p && s.active !== false && !(U.n(s.pu) > 1) && Pack.same(s, p); }).sort(function (a, b) { return pc(b) - pc(a); })[0] || null;
  },
  sync: function (vg) { if (!vg) return; Variants.members(vg).forEach(function (x) { var b = Pack.base(x); if (b) x.stock = Math.max(0, Math.floor(U.n(b.stock) / U.n(x.pu))); }); }
};
function ownQty(p) { return typeof Pack !== 'undefined' && Pack.base(p) ? 0 : U.n(p.stock); }
(function () {
  var mv = Store.move;
  Store.move = function (pid, qty, type, ref) {
    var p = Store.product(pid), b = Pack.base(p);
    if (b) { var r = mv.call(this, b.id, U.r2(U.n(qty) * U.n(p.pu)), type, (ref ? ref + ' · ' : '') + U.n(qty) + ' ' + (p.vopt.pack || '') + ' × ' + p.pu); Pack.sync(p.vg); return r; }
    var r2 = mv.apply(this, arguments); if (p && p.vg) Pack.sync(p.vg); return r2;
  };
})();
if (typeof Updater !== 'undefined') Updater.notes['2.0.9'] = ['📦 العبوة مربوطة بالقطع: اكتب جنب «علبة» فيها كام قطعة (مثلاً 12) — بيع علبة يخصم 12 قطعة، واستلام علبة يزود 12، ورصيد العلبة = القطع ÷ 12 أوتوماتيك', 'لو سيبت عدد القطع فاضي العبوة تفضل برصيد منفصل زي الأول'];
