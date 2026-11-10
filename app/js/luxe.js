/* Ghandi Home — "Velvet Jewel Box" look: emoji gems, dashboard hero, product emoji */
'use strict';
var NAV_GEMS = {
  dashboard: ['✨', 'g-gold'], pos: ['🛍️', 'g-rose'], sales: ['🧾', 'g-sapphire'], products: ['📦', 'g-ruby'], labels: ['🏷️', 'g-amethyst'],
  count: ['📋', 'g-aqua'], purchases: ['🚚', 'g-emerald'], prices: ['💰', 'g-gold'], promos: ['🎁', 'g-coral'], contacts: ['💞', 'g-rose'], customers: ['💞', 'g-rose'], suppliers: ['🚚', 'g-emerald'], layaway: ['📌', 'g-amethyst'], coupons: ['🎟️', 'g-coral'],
  expenses: ['💸', 'g-emerald'], shifts: ['⏰', 'g-sapphire'], reports: ['📊', 'g-amethyst'], users: ['🛡️', 'g-onyx'], shop: ['🏪', 'g-coral'],
  invoice: ['🖨️', 'g-pearl'], dev: ['🛠️', 'g-onyx'], backup: ['💾', 'g-aqua'], settings: ['⚙️', 'g-onyx'], about: ['💎', 'g-sapphire']
};
function navGem(v, fallbackIcon, cls) { var g = NAV_GEMS[v]; return g ? '<span class="gem ' + g[1] + (cls ? ' ' + cls : '') + '">' + g[0] + '</span>' : ic(fallbackIcon || 'star'); }
var SKINS = [['glitter', 'أميرة البريق', 'Princess glitter', '👑', 'pr'], ['kawaii', 'كيوت باستيل', 'Kawaii pastel', '🧸', 'pr'], ['rosegold', 'روز جولد', 'Rose gold', '🌹', 'pr'], ['holo', 'هولوجرام', 'Holographic', '🦄', 'pr'], ['blossom', 'زهرة الكرز', 'Cherry blossom', '🌸', 'pr'],
  ['velvet', 'المخمل والجواهر', 'Velvet & jewels', '💎'], ['pearl', 'اللؤلؤ الوردي', 'Pink pearl', '🌸'], ['maison', 'الأسود والدهبي', 'Black & gold maison', '🖤'], ['candy', 'كاندي بوب', 'Candy pop', '🍭'], ['aurora', 'زجاج الأورورا', 'Aurora glass', '🌌'], ['classic', 'الكلاسيك', 'Classic', '🤍'],
  ['sapphire', 'الأزرق الملكي', 'Royal sapphire', '💙', 'el'], ['emerald', 'الزمرد والدهب', 'Emerald & gold', '💚', 'el'], ['graphite', 'جرافيت', 'Graphite', '🩶', 'el'], ['mocha', 'موكا', 'Mocha', '🤎', 'el'], ['midnight', 'ميدنايت', 'Midnight', '🌙', 'el'],
  ['lavender', 'لافندر', 'Lavender', '💜', 'gi'], ['peach', 'خوخ وكريمة', 'Peach cream', '🍑', 'gi'], ['fuchsia', 'فوشيا', 'Fuchsia', '💖', 'gi'], ['cotton', 'غزل البنات', 'Cotton candy', '🍬', 'gi'], ['mint', 'نعناع وردي', 'Pink mint', '🌿', 'gi']];
var SKIN_THEME = { velvet: 'dark', pearl: 'light', maison: 'dark', candy: 'light', aurora: 'dark', sapphire: 'light', emerald: 'dark', graphite: 'light', mocha: 'light', midnight: 'dark', lavender: 'light', peach: 'light', fuchsia: 'light', cotton: 'light', mint: 'light', glitter: 'light', kawaii: 'light', rosegold: 'light', holo: 'light', blossom: 'light' };
function kit() { return document.documentElement.hasAttribute('data-kit'); }
var Themes = {
  apply: function (id, mode) { S().skin = id; if (mode) S().theme = mode; Store.save(); applyLook(); if (App.user) { Shell.render(); go(App.view); } toast(L('تم تغيير الثيم', 'Theme changed') + ' ' + (SKINS.filter(function (x) { return x[0] === id; })[0] || [])[3], 'ok'); },
  html: function () {
    var cur = S().skin || 'classic';
    var lastG = null; return '<div class="theme-grid">' + SKINS.map(function (k) { var gh = ''; if ((k[4] || 'o') !== lastG) { lastG = k[4] || 'o'; gh = '<div class="theme-sec">' + (lastG === 'pr' ? '🌟 ' + L('تصميمات مميزة', 'Signature designs') : lastG === 'el' ? '✨ ' + L('أنيقة وعصرية', 'Elegant & modern') : lastG === 'gi' ? '🎨 ' + L('ألوان مبهجة', 'Cheerful colours') : '💎 ' + L('الثيمات الأساسية', 'Original themes')) + '</div>'; }
      var on = k[0] === cur, cls = k[0] === 'classic';
      return gh + '<div class="theme-card' + (on ? ' on' : '') + '" data-sk="' + k[0] + '"><div class="tc-img"><img src="img/themes/' + (cls && S().theme === 'dark' ? 'classic-dark' : k[0]) + '.jpg" alt="">' + (on ? '<span class="tc-check">✓</span>' : '') + '</div><div class="tc-name"><span>' + k[3] + '</span><b>' + L(k[1], k[2]) + '</b></div>' +
        (cls ? '<div class="seg tc-mode"><button data-mode="light" class="' + (on && S().theme !== 'dark' ? 'on' : '') + '">☀️ ' + L('فاتح', 'Light') + '</button><button data-mode="dark" class="' + (on && S().theme === 'dark' ? 'on' : '') + '">🌙 ' + L('داكن', 'Dark') + '</button></div>' : '') + '</div>';
    }).join('') + '</div>';
  },
  mount: function (box, after) {
    if (!box) return; box.innerHTML = Themes.html();
    $$('[data-sk]', box).forEach(function (c) {
      c.onclick = function (e) { var md = e.target.closest('[data-mode]'); Themes.apply(c.dataset.sk, md ? md.dataset.mode : null); if (after) after(); };
    });
  },
  picker: function () { var m = Modal.open({ size: 'xl', title: '🎨 ' + L('اختار ثيم البرنامج', 'Choose a theme'), body: '<div id="thpk"></div>' }); Themes.mount($('#thpk', m), function () { Modal.close(m); }); }
};
function gem(e, color, cls) { return '<span class="gem ' + (color || 'g-rose') + (cls ? ' ' + cls : '') + '">' + e + '</span>'; }

/* ---------- product & category emoji ---------- */
var NAME_EMOJI = [[/ثلاج|fridge/i, '🧊'], [/غسال|washer/i, '🫧'], [/بوتاجاز|بوتجاز|فرن|oven|stove/i, '🔥'], [/تكييف|مكيف|air ?cond/i, '❄️'], [/شاش|تليفزيون|tv/i, '📺'], [/خلاط|كبة|مكسر|blender/i, '🥤'], [/مكوا|iron/i, '👔'], [/مكنس|vacuum/i, '🧹'], [/سخان|heater/i, '♨️'], [/مروح|fan/i, '🌀'], [/حلل|طاس|pot|pan/i, '🍳'], [/طقم صيني|سفرة|plate|dinner/i, '🍽️'], [/كوب|كاس|فنجان|cup|glass/i, '☕'], [/ملاي|سرير|bed/i, '🛏️'], [/بطاني|blanket/i, '🧣'], [/مخد|pillow/i, '💤'], [/فوط|بشكير|towel/i, '🧺'], [/سجاد|موكيت|كليم|rug|carpet/i, '🧶'], [/ستار|شيفون|curtain/i, '🪟'], [/مجر|rail|track/i, '📏'], [/انتريه|أنتريه|كنب|sofa/i, '🛋️'], [/دولاب|wardrobe/i, '🚪'], [/لمب|نجف|lamp/i, '💡'], [/روج|شفا|lip|gloss/i, '💋'], [/ماسكار|آيلاينر|ايلاينر|ظلال|كحل|mascara|liner|shadow|lash|رموش/i, '👁️'], [/فرش|بلندر|brush|blender|سفنج/i, '🖌️'], [/مناكير|طلاء|اظافر|أظافر|nail/i, '💅'],
  [/حلق|earring/i, '💎'], [/سلسل|عقد|necklace|chain/i, '📿'], [/خاتم|دبل|ring/i, '💍'], [/انسيال|إنسيال|اسور|أسور|bracelet/i, '✨'], [/توك|توكة|شعر|scrunch|clip|طوق|بندانة/i, '🎀'], [/نظار|glasses/i, '🕶️'],
  [/ساع|watch/i, '⌚'], [/شنط|حقيب|bag/i, '👜'], [/محفظ|wallet/i, '👛'], [/برفان|عطر|سبلاش|بخاخ|perfume|splash|mist/i, '🌸'], [/غسول|سيروم|كريم|واقي|لوشن|serum|cream|wash|spf/i, '🧴'],
  [/دبدوب|teddy|bear/i, '🧸'], [/مج|كوب|mug/i, '☕'], [/ميدالي|key/i, '🔑'], [/ورد|flower/i, '🌹'], [/شمع|candle/i, '🕯️'], [/علب|box|تغليف/i, '🎁'], [/مراي|مرآ|mirror/i, '🪞']];
var CAT_STYLE = [[/كهرب|أجهز|اجهز|applian/i, '🔌', 'g-sapphire'], [/صيني|أركوبال|اركوبال|dinner|china/i, '🍽️', 'g-gold'], [/طهي|حلل|أواني|اواني|cook/i, '🍳', 'g-coral'], [/مفروش|ملاي|بطاطين|bedding/i, '🛏️', 'g-amethyst'],
  [/سجاد|موكيت|كليم|carpet|rug/i, '🧶', 'g-ruby'], [/ستائر|ستار|curtain/i, '🪟', 'g-aqua'], [/أنتريه|انتريه|موبيليا|أثاث|اثاث|furnit/i, '🛋️', 'g-onyx'], [/عرائس|عروس|bridal/i, '💍', 'g-rose'], [/منزلي|home/i, '🏠', 'g-emerald']];
function catStyle(cat) { for (var i = 0; i < CAT_STYLE.length; i++) if (CAT_STYLE[i][0].test(cat || '')) return CAT_STYLE[i]; return [null, '✨', 'g-emerald']; }
function catEmoji(cat) { return catStyle(cat)[1]; }
function prodEmoji(p) { var n = (p.name || '') + ' ' + (p.nameEn || ''); for (var i = 0; i < NAME_EMOJI.length; i++) if (NAME_EMOJI[i][0].test(n)) return NAME_EMOJI[i][1]; return catEmoji(p.cat); }
function prodGem(p, cls) { if (p && p.img) return '<span class="gem pimg' + (cls ? ' ' + cls : '') + '" style="background-image:url(' + p.img + ')"></span>'; return '<span class="gem ' + catStyle(p.cat)[2] + (cls ? ' ' + cls : '') + '">' + prodEmoji(p) + '</span>'; }

/* ---------- emoji toasts ---------- */
toast = function (msg, type) {
  var b = $('#toasts'); if (!b) { b = document.createElement('div'); b.id = 'toasts'; document.body.appendChild(b); }
  var t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.innerHTML = '<span style="font-size:18px">' + (type === 'ok' ? '✅' : type === 'bad' ? '⚠️' : '💬') + '</span><span></span>'; t.lastChild.textContent = msg; b.appendChild(t);
  setTimeout(function () { t.style.opacity = 0; t.style.transition = '.3s'; setTimeout(function () { t.remove(); }, 300); }, 2800);
};

/* ---------- list rows with product gems ---------- */
var listRowsClassic = listRows;
listRows = function (arr, right) {
  if (!kit()) return listRowsClassic(arr, right);
  if (!arr.length) return '<div class="empty"><span class="em">🌷</span>' + L('كله تمام', 'All good') + '</div>';
  return arr.map(function (p) { return '<div class="list-row">' + prodGem(p, 'sm') + '<div class="grow"><b class="small">' + U.esc(pname(p)) + '</b><div class="muted small">' + U.esc(p.cat || '') + (p.shade ? ' · ' + U.esc(p.shade) : '') + '</div></div>' + right(p) + '</div>'; }).join('');
};

/* ---------- login art ---------- */
Gate.artClassic = Gate.art;
Gate.art = function () {
  if (!kit()) return Gate.artClassic();
  var c = LoginTexts.get();
  return '<div class="art"><div class="floaters"><span style="top:9%;inset-inline-start:62%">🏠</span><span style="top:22%;inset-inline-start:80%;animation-delay:-2s;font-size:30px">💍</span><span style="top:5%;inset-inline-start:86%;animation-delay:-4s;font-size:26px">✨</span><span style="top:36%;inset-inline-start:72%;animation-delay:-1s;font-size:34px">🧶</span><span style="top:31%;inset-inline-start:90%;animation-delay:-3s;font-size:26px">🛋️</span></div>' +
    '<div style="position:relative;z-index:1"><span class="gem xl g-gold" style="margin-bottom:22px">💎</span><h1>' + U.esc(c.title) + '</h1><p>' + U.esc(c.tagline) + '</p></div>' +
    '<div class="feat">' + c.feats.filter(function (f) { return f.on !== false && f.t; }).map(function (f) { return '<div><span style="font-size:20px">' + U.esc(f.e || '✨') + '</span>' + U.esc(f.t) + '</div>'; }).join('') + '</div>' +
    (c.showDev !== false ? '<div class="devcard"><span class="gem g-gold">👨‍💻</span><div><b>' + L(APP.dev, APP.devEn) + '</b><div class="num" style="opacity:.8;font-size:13px">' + APP.phone + '</div></div></div>' : '<div></div>') + '</div>';
};

/* ---------- dashboard ---------- */
Views.dashboardClassic = Views.dashboard;
Views.dashboard = function (el) {
  if (!kit()) return Views.dashboardClassic(el);
  var t0 = dayStart(), today = sumSales(salesIn(t0, t0 + 864e5)), yest = sumSales(salesIn(t0 - 864e5, t0));
  var m0 = new Date(); m0.setDate(1); m0 = dayStart(m0); var month = sumSales(salesIn(m0, Date.now() + 1));
  var low = Store.db.products.filter(function (p) { return p.active !== false && U.n(p.stock) <= U.n(p.minStock); });
  var expD = Date.now() + S().expiryAlertDays * 864e5, exp = Store.db.products.filter(function (p) { return p.expiry && new Date(p.expiry).getTime() < expD; });
  var stockVal = Store.db.products.reduce(function (s, p) { return s + Math.max(0, U.n(p.stock)) * U.n(p.cost); }, 0);
  var diff = yest.total ? Math.round((today.total - yest.total) / yest.total * 100) : 0, h = new Date().getHours();
  var greet = h >= 5 && h < 12 ? L('صباح الفل', 'Good morning') + ' ☀️' : h < 17 ? L('يومك سعيد', 'Good afternoon') + ' 🌤️' : h < 23 ? L('مساء الفل', 'Good evening') + ' 🌙' : L('سهرانين؟', 'Working late?') + ' 🌙';
  var first = App.user.name.replace(/^(م\.|أ\.|ا\.|Eng\.|Mr\.|Ms\.)\s*/, '').split(' ')[0];
  var promos = (typeof Promo !== 'undefined') ? Promo.active().length : 0;
  var days = []; for (var i = 13; i >= 0; i--) { var a = t0 - i * 864e5; days.push({ d: new Date(a), v: sumSales(salesIn(a, a + 864e5)).total }); }
  var top = {}; salesIn(t0 - 29 * 864e5, Date.now() + 1).forEach(function (s) { if (s.type === 'return') return; s.items.forEach(function (it) { top[it.pid] = top[it.pid] || { p: Store.product(it.pid) || { name: it.name }, q: 0, v: 0 }; top[it.pid].q += it.qty; top[it.pid].v += it.qty * it.price; }); });
  top = Object.keys(top).map(function (k) { return top[k]; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 6); var mx = top.length ? top[0].v : 1;
  var q = [['pos', '🛍️', 'g-rose', 'بيع جديد', 'New sale', 'F2', 'pos.sell'], ['purchases', '🚚', 'g-emerald', 'استلام بضاعة', 'Receive goods', '', 'purchases'], ['products', '📦', 'g-ruby', 'الأصناف', 'Products', Store.db.products.length + '', 'products.view'], ['promos', '🎁', 'g-coral', 'العروض', 'Offers', promos ? promos + L(' شغّال', ' live') : '', 'promos'], ['labels', '🏷️', 'g-amethyst', 'طباعة باركود', 'Print labels', '', 'labels'], ['reports', '📊', 'g-sapphire', 'التقارير', 'Reports', '', 'reports']].filter(function (x) { return can(x[6]); });
  el.innerHTML =
    '<section class="hero"><span class="float" style="top:18px;inset-inline-end:46%">🏠</span><span class="float" style="bottom:16px;inset-inline-end:40%;font-size:24px">✨</span><span class="float" style="top:24px;inset-inline-end:34%;font-size:22px">💍</span>' +
    '<div class="row wrap" style="justify-content:space-between;align-items:flex-end;gap:24px;position:relative"><div><div class="hi">' + greet + '</div><h2>' + L('يا ', '') + U.esc(first) + ' 👋</h2><div class="hi" style="margin:10px 0 4px">' + L('مبيعات النهارده', 'Today\'s sales') + '</div><span class="big">' + U.money(today.total) + '</span><span class="cur">' + cur() + '</span>' +
    '<div class="hi" style="margin-top:8px">' + (yest.total ? (diff >= 0 ? '📈 ' + L('أعلى من امبارح بـ ', 'Up ') + diff + '%' : '📉 ' + L('أقل من امبارح بـ ', 'Down ') + Math.abs(diff) + '%') : '🌱 ' + L('يوم جديد، بداية جديدة', 'A fresh day') ) + '</div></div>' +
    '<div class="mini"><div><span>🧾 ' + L('فواتير', 'Invoices') + '</span><b>' + today.count + '</b></div><div><span>🛍️ ' + L('قطع اتباعت', 'Items sold') + '</span><b>' + today.items + '</b></div>' + (can('reports.profit') ? '<div><span>💰 ' + L('ربح النهارده', 'Today\'s profit') + '</span><b>' + U.money(today.profit) + '</b></div>' : '<div><span>💳 ' + L('متوسط الفاتورة', 'Avg. ticket') + '</span><b>' + U.money(today.count ? today.total / today.count : 0) + '</b></div>') + '</div></div></section>' +
    (q.length ? '<div class="quick">' + q.map(function (x) { return '<button data-q="' + x[0] + '">' + gem(x[1], x[2], 'lg') + '<span>' + L(x[3], x[4]) + '</span><small class="num">' + x[5] + '</small></button>'; }).join('') + '</div>' : '') +
    '<div class="grid g3" style="margin-bottom:16px"><div class="card kpi"><div class="ic">' + gem('📅', 'g-amethyst') + '</div><div class="l">' + L('مبيعات الشهر', 'This month') + '</div><div class="v">' + M(month.total) + '</div><div class="muted small">' + month.count + L(' فاتورة', ' invoices') + '</div></div>' +
    (can('reports.profit') ? '<div class="card kpi"><div class="ic">' + gem('💎', 'g-emerald') + '</div><div class="l">' + L('أرباح الشهر', 'Profit this month') + '</div><div class="v" style="color:var(--ok)">' + M(month.profit) + '</div><div class="muted small">' + (month.total ? Math.round(month.profit / month.total * 100) : 0) + '% ' + L('هامش', 'margin') + '</div></div>' : '<div class="card kpi"><div class="ic">' + gem('🎁', 'g-coral') + '</div><div class="l">' + L('عروض شغّالة', 'Live offers') + '</div><div class="v num">' + promos + '</div></div>') +
    '<div class="card kpi"><div class="ic">' + gem('📦', 'g-gold') + '</div><div class="l">' + (can('products.viewCost') ? L('قيمة البضاعة', 'Stock value') : L('عدد الأصناف', 'Products')) + '</div><div class="v">' + (can('products.viewCost') ? M(stockVal) : '<span class="num">' + Store.db.products.length + '</span>') + '</div><div class="muted small">' + Store.db.products.length + L(' صنف', ' products') + '</div></div></div>' +
    '<div class="grid" style="grid-template-columns:1.7fr 1fr;gap:16px"><div class="card"><h3>' + gem('📈', 'g-rose', 'sm') + L('المبيعات — آخر 14 يوم', 'Sales — last 14 days') + '</h3><canvas class="chart" id="ch"></canvas></div>' +
    '<div class="card"><h3>' + gem('🏆', 'g-gold', 'sm') + L('الأكثر مبيعاً', 'Best sellers') + '</h3>' + (top.length ? top.map(function (t, i) { return '<div class="list-row">' + (t.p.id ? prodGem(t.p, 'sm') : gem('✨', 'g-emerald', 'sm')) + '<div class="grow"><div class="row" style="justify-content:space-between"><b class="small">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] + ' ' : '') + U.esc(pname(t.p)) + '</b><span class="small muted num">' + U.money(t.v) + '</span></div><div class="bar" style="margin-top:6px"><i style="width:' + Math.max(4, t.v / mx * 100) + '%"></i></div></div></div>'; }).join('') : '<div class="empty"><span class="em">🛍️</span>' + L('أول بيعة هتظهر هنا', 'Your first sale shows up here') + '</div>') + '</div></div>' +
    '<div class="grid g2" style="margin-top:16px"><div class="card"><h3>' + gem('🚨', 'g-ruby', 'sm') + L('نواقص محتاجة تتطلب', 'Running low') + ' <span class="chip bad">' + low.length + '</span></h3>' + listRows(low.slice(0, 6), function (p) { return '<span class="chip bad num">' + U.n(p.stock) + '</span>'; }) + '</div>' +
    '<div class="card"><h3>' + gem('⏳', 'g-gold', 'sm') + L('قرّبت صلاحيتها تخلص', 'Expiring soon') + ' <span class="chip warn">' + exp.length + '</span></h3>' + listRows(exp.slice(0, 6), function (p) { return '<span class="chip warn num">' + p.expiry + '</span>'; }) + '</div></div>';
  $$('[data-q]').forEach(function (b) { b.onclick = function () { go(b.dataset.q); }; });
  drawBars($('#ch'), days.map(function (d) { return d.d.getDate() + '/' + (d.d.getMonth() + 1); }), days.map(function (d) { return d.v; }));
};
