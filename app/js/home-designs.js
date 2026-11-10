/* Ghandi Home 1.2 — 30 full designs (layout + card style + shapes + density + fonts + backgrounds + colours),
   chosen by the admin from Settings. Eng. Mohamed Ali — 01098811581 */
'use strict';
/* id, Arabic, English, emoji, mode, layout, card, shape, density, font, background, nav, header, table, colours{bg,panel,text,brand,brand2,side,side2,acc} */
var DESIGNS = [
  ['ofok', 'أفق', 'Horizon', '🌅', 'light', 'side', 'soft', 'round', 'normal', 'segoe', 'plain', 'pill', 'bar', 'lines', { bg: '#f4f7fb', panel: '#ffffff', text: '#14233b', brand: '#1f6feb', brand2: '#16b3c9', side: '#0f2240', side2: '#163360', acc: '#f0a830' }],
  ['bayt', 'البيت الدافي', 'Warm home', '🏡', 'light', 'float', 'lift', 'round', 'airy', 'tahoma', 'dots', 'pill', 'float', 'zebra', { bg: '#f7efe7', panel: '#fffaf5', text: '#3a2418', brand: '#c2552d', brand2: '#e08a4f', side: '#5a2e1c', side2: '#7a3f25', acc: '#e7b45a' }],
  ['nakhla', 'نخلة', 'Palm', '🌴', 'light', 'top', 'flat', 'sharp', 'compact', 'segoe', 'plain', 'under', 'minimal', 'boxed', { bg: '#f3f7f2', panel: '#ffffff', text: '#1d2e1f', brand: '#2e7d32', brand2: '#66a84a', side: '#1f4a24', side2: '#2b5f2f', acc: '#d8a325' }],
  ['marmar', 'رخام', 'Marble', '🏛️', 'light', 'side', 'paper', 'sharp', 'normal', 'naskh', 'grid', 'line', 'bar', 'lines', { bg: '#f5f4f1', panel: '#ffffff', text: '#1b1b1b', brand: '#222222', brand2: '#555555', side: '#ffffff', side2: '#f2f1ee', acc: '#b8913f' }],
  ['kitan', 'كتان', 'Linen', '🧺', 'light', 'rail', 'outline', 'sharp', 'normal', 'tahoma', 'plain', 'block', 'bar', 'boxed', { bg: '#efe9de', panel: '#fbf8f2', text: '#1f1a14', brand: '#1f1a14', brand2: '#4a3f33', side: '#1f1a14', side2: '#2c251d', acc: '#e0563b' }],
  ['sama', 'سما', 'Sky', '☁️', 'light', 'float', 'glass', 'pill', 'airy', 'segoe', 'mesh', 'pill', 'float', 'lines', { bg: '#e9f3fd', panel: '#ffffff', text: '#12304d', brand: '#2d8cf0', brand2: '#7b61ff', side: '#ffffff', side2: '#f2f7fd', acc: '#ffb020' }],
  ['nanaa', 'نعناع', 'Mint', '🌿', 'light', 'side', 'neu', 'round', 'normal', 'segoe', 'plain', 'line', 'minimal', 'zebra', { bg: '#e8f2ee', panel: '#e8f2ee', text: '#163a2e', brand: '#12a383', brand2: '#4cc9a0', side: '#e8f2ee', side2: '#e1ede8', acc: '#f29d38' }],
  ['zaytoon', 'زيتون', 'Olive', '🫒', 'light', 'dock', 'flat', 'round', 'compact', 'tahoma', 'diag', 'pill', 'bar', 'lines', { bg: '#f4f3ea', panel: '#ffffff', text: '#2b2e1a', brand: '#6b7a1f', brand2: '#9aa83a', side: '#3b4214', side2: '#4c5520', acc: '#c9782e' }],
  ['ward', 'ورد', 'Rose', '🌹', 'light', 'boxed', 'lift', 'pill', 'normal', 'segoe', 'mesh', 'pill', 'bar', 'zebra', { bg: '#fbeff2', panel: '#ffffff', text: '#3d1525', brand: '#d6336c', brand2: '#f06595', side: '#4a1630', side2: '#6b2045', acc: '#e8b04a' }],
  ['qamh', 'قمح', 'Wheat', '🌾', 'light', 'top', 'soft', 'round', 'airy', 'naskh', 'plain', 'under', 'bar', 'lines', { bg: '#f8f3e6', panel: '#fffdf7', text: '#3b2d12', brand: '#a8741a', brand2: '#d4a43a', side: '#6e4b10', side2: '#86601a', acc: '#2f7d6d' }],
  ['bahr', 'بحر', 'Sea', '🌊', 'light', 'rail', 'glass', 'round', 'normal', 'segoe', 'mesh', 'pill', 'float', 'zebra', { bg: '#e6f4f7', panel: '#ffffff', text: '#0f2f3a', brand: '#0e7c9b', brand2: '#20c0c8', side: '#0b3a4a', side2: '#0f5066', acc: '#ff8a4c' }],
  ['lamoon', 'ليمون', 'Lemon', '🍋', 'light', 'side', 'outline', 'pill', 'normal', 'tahoma', 'dots', 'block', 'brand', 'boxed', { bg: '#fffbe6', panel: '#ffffff', text: '#1c1a10', brand: '#1c1a10', brand2: '#3b382a', side: '#ffd43b', side2: '#fcc419', acc: '#ff6b6b' }],
  ['fadda', 'فضة', 'Silver', '🥈', 'light', 'float', 'flat', 'sharp', 'compact', 'segoe', 'grid', 'line', 'float', 'boxed', { bg: '#eef0f3', panel: '#ffffff', text: '#1d232c', brand: '#3d5a80', brand2: '#5d7ea6', side: '#2a3442', side2: '#364254', acc: '#ee6c4d' }],
  ['kahraman', 'كهرمان', 'Amber', '🟠', 'light', 'side', 'paper', 'round', 'airy', 'naskh', 'plain', 'line', 'minimal', 'lines', { bg: '#fdf6ec', panel: '#ffffff', text: '#3a2410', brand: '#d9730d', brand2: '#f2a541', side: '#fff3e0', side2: '#ffe8c7', acc: '#7b3fa0' }],
  ['fayrouz', 'فيروز', 'Turquoise', '💠', 'light', 'top', 'lift', 'pill', 'normal', 'segoe', 'diag', 'under', 'brand', 'zebra', { bg: '#eaf8f7', panel: '#ffffff', text: '#103b3a', brand: '#0ca5a0', brand2: '#36d1c4', side: '#0a5552', side2: '#0d6d69', acc: '#f7b32b' }],
  ['sajada', 'سجادة', 'Carpet', '🧶', 'light', 'boxed', 'outline', 'sharp', 'normal', 'naskh', 'diag', 'block', 'bar', 'boxed', { bg: '#f6efe6', panel: '#fffaf3', text: '#2a1210', brand: '#9b1c1c', brand2: '#c2410c', side: '#1e2a4a', side2: '#2a3a63', acc: '#d4a017' }],
  ['tobi', 'طوبي', 'Brick', '🧱', 'light', 'dock', 'soft', 'round', 'normal', 'tahoma', 'plain', 'block', 'bar', 'zebra', { bg: '#f7efea', panel: '#ffffff', text: '#35180f', brand: '#b5452a', brand2: '#d66a45', side: '#3a1c13', side2: '#53291b', acc: '#3a7d7c' }],
  ['banafsag', 'بنفسج', 'Violet', '💜', 'light', 'float', 'neu', 'round', 'airy', 'segoe', 'plain', 'pill', 'minimal', 'lines', { bg: '#efecf8', panel: '#efecf8', text: '#2a2145', brand: '#6c4ce0', brand2: '#9b7bff', side: '#efecf8', side2: '#e8e4f5', acc: '#ff9f43' }],
  ['maktab', 'المكتب الحديث', 'Modern office', '🖥️', 'light', 'rail', 'flat', 'sharp', 'compact', 'segoe', 'plain', 'line', 'bar', 'boxed', { bg: '#f5f5f5', panel: '#ffffff', text: '#111111', brand: '#ff5a1f', brand2: '#ff8a4c', side: '#111111', side2: '#1c1c1c', acc: '#ff5a1f' }],
  ['khashab', 'خشب', 'Walnut', '🪵', 'light', 'side', 'lift', 'round', 'normal', 'naskh', 'plain', 'pill', 'bar', 'zebra', { bg: '#f6f1ea', panel: '#fffdf9', text: '#2e1e12', brand: '#7a4a24', brand2: '#a8693a', side: '#3b2414', side2: '#56361f', acc: '#c9a227' }],
  ['layl', 'ليل', 'Night', '🌙', 'dark', 'side', 'glass', 'round', 'normal', 'segoe', 'mesh', 'pill', 'float', 'lines', { bg: '#0d1424', panel: '#141e33', text: '#e6edf9', brand: '#4f8cff', brand2: '#7c5cff', side: '#0a101d', side2: '#0f182b', acc: '#ffc857' }],
  ['fahm', 'فحم', 'Charcoal', '⚫', 'dark', 'rail', 'flat', 'sharp', 'compact', 'segoe', 'grid', 'line', 'bar', 'boxed', { bg: '#151617', panel: '#1d1f21', text: '#e9ecef', brand: '#a3e635', brand2: '#65c32a', side: '#0f1011', side2: '#151617', acc: '#a3e635' }],
  ['zumurrud', 'زمرد الليل', 'Night emerald', '💚', 'dark', 'float', 'lift', 'round', 'airy', 'naskh', 'plain', 'pill', 'float', 'zebra', { bg: '#0c1b16', panel: '#12261f', text: '#e4f3ec', brand: '#10b981', brand2: '#34d399', side: '#08130f', side2: '#0d1d17', acc: '#d4af37' }],
  ['neon', 'نيون', 'Neon', '⚡', 'dark', 'top', 'outline', 'sharp', 'normal', 'tahoma', 'grid', 'under', 'minimal', 'boxed', { bg: '#0b0b12', panel: '#12121c', text: '#f1f1ff', brand: '#00e5ff', brand2: '#ff2bd6', side: '#08080d', side2: '#0e0e17', acc: '#ff2bd6' }],
  ['qahwa', 'قهوة', 'Coffee', '☕', 'dark', 'dock', 'soft', 'round', 'normal', 'tahoma', 'plain', 'block', 'bar', 'zebra', { bg: '#1a1411', panel: '#241c17', text: '#f3e9e1', brand: '#c08552', brand2: '#e0a96d', side: '#120d0b', side2: '#1c1511', acc: '#e0a96d' }],
  ['ghroob', 'غروب', 'Sunset', '🌇', 'dark', 'boxed', 'glass', 'pill', 'normal', 'segoe', 'mesh', 'pill', 'float', 'lines', { bg: '#1b1029', panel: '#25173a', text: '#f7ecff', brand: '#ff7a45', brand2: '#ff4d8d', side: '#140b20', side2: '#1d1030', acc: '#ffd166' }],
  ['samoor', 'جرافيت', 'Graphite', '🩶', 'dark', 'side', 'neu', 'round', 'normal', 'segoe', 'plain', 'line', 'minimal', 'lines', { bg: '#23262b', panel: '#23262b', text: '#e8eaed', brand: '#5ea0ff', brand2: '#7fb5ff', side: '#23262b', side2: '#202328', acc: '#ffb454' }],
  ['ahram', 'أهرام', 'Pyramids', '🔺', 'dark', 'float', 'paper', 'sharp', 'airy', 'naskh', 'diag', 'line', 'bar', 'lines', { bg: '#1c1710', panel: '#262016', text: '#f5ead2', brand: '#d4a24c', brand2: '#e9c27a', side: '#14100b', side2: '#1d1810', acc: '#3fa7a0' }],
  ['mohit', 'محيط', 'Ocean', '🐋', 'dark', 'top', 'lift', 'pill', 'normal', 'segoe', 'mesh', 'under', 'brand', 'zebra', { bg: '#071c24', panel: '#0c2733', text: '#e2f4fa', brand: '#14b8c8', brand2: '#3b82f6', side: '#05141a', side2: '#082029', acc: '#ffb703' }],
  ['malaki', 'ملكي', 'Royal', '👑', 'dark', 'side', 'outline', 'round', 'airy', 'naskh', 'dots', 'block', 'bar', 'boxed', { bg: '#0e0e10', panel: '#16161a', text: '#f4ead2', brand: '#d4af37', brand2: '#f0d77b', side: '#09090b', side2: '#111114', acc: '#d4af37' }]
];
var DZ_TXT = {
  lay: { side: ['قائمة جانبية', 'Sidebar'], float: ['قائمة عائمة', 'Floating'], top: ['قائمة فوق', 'Top menu'], rail: ['أيقونات بس', 'Icon rail'], dock: ['القائمة على الناحية التانية', 'Docked opposite'], boxed: ['شاشة في المنتصف', 'Boxed'] },
  card: { soft: ['ناعم', 'Soft'], lift: ['بارز', 'Lifted'], flat: ['مسطح', 'Flat'], paper: ['ورقي', 'Paper'], outline: ['حدود عريضة', 'Bold outline'], glass: ['زجاجي', 'Glass'], neu: ['بارز ثلاثي الأبعاد', 'Neumorphic'] },
  shape: { round: ['زوايا دائرية', 'Rounded'], sharp: ['زوايا حادة', 'Sharp'], pill: ['أزرار كبسولة', 'Pill'] },
  font: { segoe: ['خط حديث', 'Modern font'], tahoma: ['خط واضح', 'Clear font'], naskh: ['خط نسخ', 'Naskh font'] }
};
var Designs = {
  get: function (id) { for (var i = 0; i < DESIGNS.length; i++) if (DESIGNS[i][0] === id) return DESIGNS[i]; return null; },
  hex: function (h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; },
  mix: function (a, b, t) { var x = Designs.hex(a), y = Designs.hex(b); return '#' + x.map(function (v, i) { return ('0' + Math.round(v + (y[i] - v) * t).toString(16)).slice(-2); }).join(''); },
  rgba: function (a, al) { var x = Designs.hex(a); return 'rgba(' + x.join(',') + ',' + al + ')'; },
  dark: function (c) { var x = Designs.hex(c); return (x[0] * 299 + x[1] * 587 + x[2] * 114) / 1000 < 140; },
  vars: function (d) {
    var c = d[14], dk = d[4] === 'dark', M = Designs.mix, A = Designs.rgba, sideDark = Designs.dark(c.side);
    var v = {
      bg: c.bg, bg2: M(c.bg, c.text, dk ? .06 : .05), panel: c.panel, panel2: M(c.panel, dk ? '#ffffff' : c.bg, dk ? .04 : .55), line: M(c.panel, c.text, dk ? .13 : .1), line2: M(c.panel, c.text, dk ? .22 : .18),
      text: c.text, muted: M(c.text, c.panel, .42), soft: M(c.text, c.panel, .62), brand: c.brand, brand2: c.brand2, brandInk: Designs.dark(c.brand) ? '#fff' : '#111', gold: c.acc, gold2: M(c.acc, '#ffffff', .45),
      side: c.side, side2: c.side2, sideText: sideDark ? '#f2f5fa' : c.text, sideMuted: sideDark ? A('#ffffff', .55) : M(c.text, c.side, .5),
      navOn: sideDark ? A('#ffffff', .14) : A(c.brand, .13), navInk: sideDark ? '#ffffff' : c.brand,
      pri: 'linear-gradient(135deg,' + c.brand + ',' + c.brand2 + ')', foil: 'linear-gradient(115deg,' + c.brand + ',' + c.brand2 + ')', heroBg: 'linear-gradient(120deg,' + (sideDark ? c.side : M(c.brand, '#000', .35)) + ',' + c.brand + ' 60%,' + c.brand2 + ')',
      toastBg: dk ? M(c.panel, '#ffffff', .12) : c.text, glow: A(c.brand, .45), glass: A(c.panel, dk ? .72 : .78), panelA: A(c.panel, dk ? .62 : .7),
      neuD: dk ? 'rgba(0,0,0,.55)' : M(c.bg, '#000000', .14), neuL: dk ? 'rgba(255,255,255,.05)' : M(c.bg, '#ffffff', .75), dot: A(c.text, dk ? .09 : .07),
      m1: A(c.brand, dk ? .22 : .13), m2: A(c.brand2, dk ? .18 : .12), m3: A(c.acc, dk ? .12 : .09),
      ok: dk ? '#34d399' : '#16a34a', warn: dk ? '#fbbf24' : '#d97706', bad: dk ? '#f87171' : '#dc2626', info: '#3b82f6',
      shadow: dk ? '0 1px 2px rgba(0,0,0,.35),0 10px 28px rgba(0,0,0,.35)' : '0 1px 2px ' + A(c.text, .05) + ',0 8px 24px ' + A(c.text, .07), shadow2: dk ? '0 18px 50px rgba(0,0,0,.55)' : '0 18px 50px ' + A(c.text, .18),
      font: { segoe: '"Segoe UI",Tahoma,"DejaVu Sans",Arial,sans-serif', tahoma: 'Tahoma,"Segoe UI",Arial,sans-serif', naskh: '"Sakkal Majalla","Traditional Arabic","Simplified Arabic","Times New Roman",serif' }[d[9]]
    };
    return ':root[data-design="' + d[0] + '"]{' + Object.keys(v).map(function (k) { return '--' + k + ':' + v[k]; }).join(';') + '}';
  },
  css: function () {
    var R = ':root[data-design]';
    var s = DESIGNS.map(Designs.vars).join('\n');
    s += '\n' + R + ' body{font-family:var(--font)}' +
      R + '[data-dz-font="naskh"] body{font-size:15.5px}' + R + '[data-dz-font="naskh"] .num,' + R + '[data-dz-font="naskh"] input{font-family:"Segoe UI",Tahoma,Arial,sans-serif}' +
      /* ---------- layouts ---------- */
      R + '[data-dz-lay="dock"] #app{flex-direction:row-reverse}' +
      R + '[data-dz-lay="float"] #app{padding:12px;gap:12px;box-sizing:border-box}' + R + '[data-dz-lay="float"] .side{border-radius:22px;box-shadow:var(--shadow2)}' + R + '[data-dz-lay="float"] .main{border-radius:22px;overflow:hidden;background:var(--bg);box-shadow:var(--shadow)}' +
      R + '[data-dz-lay="boxed"] body{padding:14px 0;box-sizing:border-box}' + R + '[data-dz-lay="boxed"] #app{max-width:1480px;margin:0 auto;height:calc(100vh - 28px);border-radius:18px;overflow:hidden;box-shadow:var(--shadow2);border:1px solid var(--line)}' + R + '[data-dz-lay="boxed"] .main{background:var(--bg)}' +
      R + '[data-dz-lay="rail"] .side{width:80px!important;min-width:80px!important;padding:12px 8px!important;align-items:center}' + R + '[data-dz-lay="rail"] .side .nav>span:not(.gem),' + R + '[data-dz-lay="rail"] .side .navsep,' + R + '[data-dz-lay="rail"] .side .sidefoot,' + R + '[data-dz-lay="rail"] .side .brand>div{display:none!important}' + R + '[data-dz-lay="rail"] .side .nav{justify-content:center;padding:7px!important;width:auto}' + R + '[data-dz-lay="rail"] .side .brand{justify-content:center;padding:0!important;margin-bottom:6px}' +
      R + '[data-dz-lay="top"] #app{flex-direction:column}' + R + '[data-dz-lay="top"] .side{width:auto!important;min-width:0!important;flex-direction:row!important;align-items:center;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;padding:6px 12px!important;gap:4px;flex:none;scrollbar-width:thin}' +
      R + '[data-dz-lay="top"] .side .navsep{width:1px;height:26px;padding:0!important;margin:0 6px;background:' + 'var(--sideMuted)' + ';opacity:.4;font-size:0;flex:none}' + R + '[data-dz-lay="top"] .side .sidefoot{display:none}' + R + '[data-dz-lay="top"] .side .brand{padding:0 0 0 0;margin-inline-end:10px;flex:none}' + R + '[data-dz-lay="top"] .side .brand small{display:none}' +
      R + '[data-dz-lay="top"] .side .nav{width:auto!important;flex:none;white-space:nowrap;padding:6px 10px!important;font-size:13px;gap:6px}' + R + '[data-dz-lay="top"] .side .nav .gem{width:24px;height:24px;font-size:13px}' + R + '[data-dz-lay="top"] .side:after{display:none}' + R + '[data-dz-lay="top"] .main{min-height:0;flex:1}' + R + '[data-dz-lay="top"] #tSide{display:none}' +
      /* ---------- nav styles ---------- */
      R + '[data-dz-nav="line"] .nav.on{background:transparent!important;box-shadow:inset -4px 0 0 var(--brand)!important;color:var(--brand)!important;border-radius:4px!important}' + 'html[dir="ltr"]' + R.slice(5) + '[data-dz-nav="line"] .nav.on{box-shadow:inset 4px 0 0 var(--brand)!important}' +
      R + '[data-dz-nav="block"] .nav{border-radius:0!important}' + R + '[data-dz-nav="block"] .nav.on{background:var(--brand)!important;color:var(--brandInk)!important}' +
      R + '[data-dz-nav="under"] .nav.on{background:transparent!important;box-shadow:inset 0 -3px 0 var(--brand)!important;border-radius:0!important;color:var(--sideText)!important}' + R + '[data-dz-nav="pill"] .nav{border-radius:999px!important}' +
      /* ---------- headers ---------- */
      R + '[data-dz-head="float"] .top{margin:12px 14px 0;border-radius:16px;border:1px solid var(--line)!important;box-shadow:var(--shadow)}' +
      R + '[data-dz-head="minimal"] .top{background:transparent!important;border-bottom:0!important;backdrop-filter:none!important}' +
      R + '[data-dz-head="brand"] .top{background:var(--pri)!important;border:0!important}' + R + '[data-dz-head="brand"] .top h1,' + R + '[data-dz-head="brand"] .top .btn.ghost,' + R + '[data-dz-head="brand"] .top b,' + R + '[data-dz-head="brand"] .top .muted{color:#fff!important}' +
      /* ---------- shapes ---------- */
      R + '[data-dz-shape="sharp"] .card,' + R + '[data-dz-shape="sharp"] .tile,' + R + '[data-dz-shape="sharp"] .cart,' + R + '[data-dz-shape="sharp"] .scan,' + R + '[data-dz-shape="sharp"] .tbl-wrap,' + R + '[data-dz-shape="sharp"] .modal,' + R + '[data-dz-shape="sharp"] .side,' + R + '[data-dz-shape="sharp"] .main{border-radius:3px!important}' +
      R + '[data-dz-shape="sharp"] .btn,' + R + '[data-dz-shape="sharp"] .in,' + R + '[data-dz-shape="sharp"] .seg,' + R + '[data-dz-shape="sharp"] .seg button,' + R + '[data-dz-shape="sharp"] .chip,' + R + '[data-dz-shape="sharp"] .cats button,' + R + '[data-dz-shape="sharp"] .gem{border-radius:2px!important}' +
      R + '[data-dz-shape="pill"] .btn,' + R + '[data-dz-shape="pill"] .seg,' + R + '[data-dz-shape="pill"] .seg button,' + R + '[data-dz-shape="pill"] .cats button,' + R + '[data-dz-shape="pill"] .in:not(textarea),' + R + '[data-dz-shape="pill"] .chip{border-radius:999px!important}' + R + '[data-dz-shape="pill"] .card,' + R + '[data-dz-shape="pill"] .modal,' + R + '[data-dz-shape="pill"] .cart{border-radius:26px!important}' +
      /* ---------- card styles ---------- */
      R + '[data-dz-card="flat"] .card,' + R + '[data-dz-card="flat"] .tile,' + R + '[data-dz-card="flat"] .cart,' + R + '[data-dz-card="flat"] .tbl-wrap{box-shadow:none!important;border:1px solid var(--line2)!important}' +
      R + '[data-dz-card="lift"] .card,' + R + '[data-dz-card="lift"] .tile,' + R + '[data-dz-card="lift"] .cart,' + R + '[data-dz-card="lift"] .tbl-wrap{border:0!important;box-shadow:0 2px 4px rgba(0,0,0,.04),0 16px 38px -12px var(--glow)!important}' +
      R + '[data-dz-card="paper"] .card,' + R + '[data-dz-card="paper"] .cart,' + R + '[data-dz-card="paper"] .tbl-wrap{box-shadow:0 1px 0 var(--line2)!important;border:1px solid var(--line)!important;border-top:3px solid var(--brand)!important}' +
      R + '[data-dz-card="outline"] .card,' + R + '[data-dz-card="outline"] .tile,' + R + '[data-dz-card="outline"] .cart,' + R + '[data-dz-card="outline"] .tbl-wrap,' + R + '[data-dz-card="outline"] .modal{border:2px solid var(--text)!important;box-shadow:5px 5px 0 var(--brand)!important}' + R + '[data-dz-card="outline"] .btn{border-width:2px!important}' + R + '[data-dz-card="outline"] .btn.pri{box-shadow:3px 3px 0 var(--text)!important}' +
      R + '[data-dz-card="glass"] .card,' + R + '[data-dz-card="glass"] .tile,' + R + '[data-dz-card="glass"] .cart,' + R + '[data-dz-card="glass"] .tbl-wrap{background:var(--panelA)!important;backdrop-filter:blur(14px) saturate(1.3);border:1px solid ' + 'var(--line)' + '!important}' + R + '[data-dz-card="glass"] .side{background:linear-gradient(180deg,var(--side),var(--side2))!important;opacity:.97}' +
      R + '[data-dz-card="neu"] .card,' + R + '[data-dz-card="neu"] .tile,' + R + '[data-dz-card="neu"] .cart,' + R + '[data-dz-card="neu"] .tbl-wrap{background:var(--bg)!important;border:0!important;box-shadow:7px 7px 16px var(--neuD),-7px -7px 16px var(--neuL)!important}' + R + '[data-dz-card="neu"] .btn:not(.pri){background:var(--bg)!important;border:0!important;box-shadow:4px 4px 9px var(--neuD),-4px -4px 9px var(--neuL)!important}' + R + '[data-dz-card="neu"] .in{background:var(--bg)!important;border:0!important;box-shadow:inset 3px 3px 7px var(--neuD),inset -3px -3px 7px var(--neuL)!important}' + R + '[data-dz-card="neu"] .card.hero,' + R + '[data-dz-card="neu"] .kpi.hero{background:var(--heroBg)!important}' +
      /* ---------- density ---------- */
      R + '[data-dz-dens="compact"] .view{zoom:.92}' + R + '[data-dz-dens="compact"] .t td,' + R + '[data-dz-dens="compact"] .t th{padding:6px 7px}' + R + '[data-dz-dens="airy"] .view{padding:26px 30px}' + R + '[data-dz-dens="airy"] .grid{gap:18px}' + R + '[data-dz-dens="airy"] .t td{padding:12px 10px}' +
      /* ---------- tables ---------- */
      R + '[data-dz-tbl="zebra"] .t tr:nth-child(even) td{background:var(--panel2)}' + R + '[data-dz-tbl="boxed"] .t td,' + R + '[data-dz-tbl="boxed"] .t th{border:1px solid var(--line)!important}' + R + '[data-dz-tbl="boxed"] .t th{background:var(--bg2)!important}' +
      /* ---------- backgrounds ---------- */
      R + '[data-dz-bg="plain"] body{background-image:none!important}' +
      R + '[data-dz-bg="dots"] body,' + R + '[data-dz-bg="dots"] .main{background-image:radial-gradient(var(--dot) 1.2px,transparent 1.3px)!important;background-size:18px 18px!important}' +
      R + '[data-dz-bg="grid"] body,' + R + '[data-dz-bg="grid"] .main{background-image:linear-gradient(var(--dot) 1px,transparent 1px),linear-gradient(90deg,var(--dot) 1px,transparent 1px)!important;background-size:26px 26px!important}' +
      R + '[data-dz-bg="diag"] body,' + R + '[data-dz-bg="diag"] .main{background-image:repeating-linear-gradient(45deg,var(--dot) 0 1px,transparent 1px 14px)!important}' +
      R + '[data-dz-bg="mesh"] body,' + R + '[data-dz-bg="mesh"] .main{background-image:radial-gradient(900px 520px at 100% 0,var(--m1),transparent 60%),radial-gradient(700px 480px at 0 100%,var(--m2),transparent 60%),radial-gradient(600px 400px at 50% 50%,var(--m3),transparent 70%)!important;background-attachment:fixed}' +
      R + ' .hero,' + R + ' .card.hero,' + R + ' .kpi.hero,' + R + ' .us-k.hero,' + R + '[data-dz-card] .card.kpi.hero,' + R + '[data-dz-card] .hero.card{background:radial-gradient(70% 140% at 100% 0,rgba(255,255,255,.2),transparent 55%),var(--heroBg)!important;color:#fff!important;backdrop-filter:none!important}' + R + ' .hero .muted,' + R + ' .kpi.hero .l,' + R + ' .kpi.hero .small,' + R + ' .us-k.hero .muted{color:rgba(255,255,255,.88)!important}' + R + ' .kpi.hero .v,' + R + ' .us-k.hero b,' + R + ' .hero h2,' + R + ' .hero .big,' + R + ' .hero b{color:#fff!important;-webkit-text-fill-color:#fff}' +
      R + ' .view{background:transparent}' + R + ' .brand b{-webkit-text-fill-color:initial}' + R + ' .side .brand b{color:var(--sideText)!important;background:none!important}' +
      /* picker */
      '.dz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}.dz-card{border:2px solid var(--line);border-radius:14px;padding:8px;cursor:pointer;background:var(--panel);transition:.15s}.dz-card:hover{transform:translateY(-2px);box-shadow:var(--shadow)}.dz-card.on{border-color:var(--brand);box-shadow:0 0 0 3px var(--glow,rgba(0,0,0,.1))}.dz-card .nm{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-weight:800}.dz-card .tg{font-size:11px;color:var(--muted);line-height:1.5}.dz-mock{height:112px;border-radius:9px;overflow:hidden;position:relative;display:flex}';
    return s;
  },
  // a small drawing of the design (layout, card style, colours) — no images needed
  mock: function (d) {
    var c = d[14], lay = d[5], card = d[6], shape = d[7], r = shape === 'sharp' ? 1 : shape === 'pill' ? 9 : 5, sideDark = Designs.dark(c.side), M = Designs.mix;
    var cardCss = function (w, h) {
      var st = 'width:' + w + ';height:' + h + 'px;border-radius:' + r + 'px;background:' + c.panel + ';';
      if (card === 'outline') st += 'border:1.5px solid ' + c.text + ';box-shadow:2px 2px 0 ' + c.brand + ';';
      else if (card === 'neu') st += 'background:' + c.bg + ';box-shadow:2px 2px 5px ' + M(c.bg, '#000', d[4] === 'dark' ? .5 : .16) + ',-2px -2px 5px ' + M(c.bg, '#fff', d[4] === 'dark' ? .06 : .8) + ';';
      else if (card === 'glass') st += 'background:' + Designs.rgba(c.panel, .6) + ';border:1px solid ' + M(c.panel, c.text, .12) + ';';
      else if (card === 'paper') st += 'border:1px solid ' + M(c.panel, c.text, .12) + ';border-top:2px solid ' + c.brand + ';';
      else if (card === 'flat') st += 'border:1px solid ' + M(c.panel, c.text, .16) + ';';
      else st += 'box-shadow:0 3px 8px ' + Designs.rgba(c.text, .12) + ';';
      return '<div style="' + st + '"></div>';
    };
    var bgImg = { dots: 'radial-gradient(' + Designs.rgba(c.text, .12) + ' 1px,transparent 1.2px)', grid: 'linear-gradient(' + Designs.rgba(c.text, .08) + ' 1px,transparent 1px),linear-gradient(90deg,' + Designs.rgba(c.text, .08) + ' 1px,transparent 1px)', diag: 'repeating-linear-gradient(45deg,' + Designs.rgba(c.text, .08) + ' 0 1px,transparent 1px 6px)', mesh: 'radial-gradient(circle at 90% 10%,' + Designs.rgba(c.brand, .25) + ',transparent 55%),radial-gradient(circle at 10% 90%,' + Designs.rgba(c.brand2, .22) + ',transparent 55%)' }[d[10]] || 'none', bgSize = { dots: '7px 7px', grid: '9px 9px' }[d[10]] || 'auto';
    var side = '<div style="background:linear-gradient(180deg,' + c.side + ',' + c.side2 + ');' + (lay === 'top' ? 'height:16px;width:100%;display:flex;gap:4px;align-items:center;padding:0 6px;box-sizing:border-box' : 'width:' + (lay === 'rail' ? 16 : 40) + 'px;display:flex;flex-direction:column;gap:4px;padding:6px 4px;box-sizing:border-box') + (lay === 'float' ? ';margin:4px;border-radius:7px' : '') + '">' +
      [0, 1, 2, 3, 4].map(function (i) { var on = i === 1; return '<span style="display:block;' + (lay === 'top' ? 'width:22px;height:6px' : 'height:6px;width:100%') + ';border-radius:' + (d[11] === 'pill' ? 9 : 2) + 'px;background:' + (on ? (sideDark ? 'rgba(255,255,255,.55)' : c.brand) : (sideDark ? 'rgba(255,255,255,.18)' : Designs.rgba(c.text, .14))) + '"></span>'; }).join('') + '</div>';
    var head = '<div style="height:12px;margin:' + (d[12] === 'float' ? '4px 6px 0' : '0') + ';border-radius:' + (d[12] === 'float' ? 4 : 0) + 'px;background:' + (d[12] === 'brand' ? 'linear-gradient(90deg,' + c.brand + ',' + c.brand2 + ')' : d[12] === 'minimal' ? 'transparent' : c.panel) + ';border-bottom:1px solid ' + M(c.panel, c.text, .1) + '"></div>';
    var body = '<div style="flex:1;padding:6px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;align-content:start"><div style="grid-column:span 2;height:26px;border-radius:' + r + 'px;background:linear-gradient(120deg,' + c.brand + ',' + c.brand2 + ')"></div>' + cardCss('100%', 26) + cardCss('100%', 30) + cardCss('100%', 30) + cardCss('100%', 30) + '</div>';
    var main = '<div style="flex:1;display:flex;flex-direction:column;min-width:0' + (lay === 'float' ? ';margin:4px 4px 4px 0;border-radius:7px;overflow:hidden' : '') + '">' + head + body + '</div>';
    var inner = lay === 'top' ? '<div style="display:flex;flex-direction:column;width:100%">' + side + main + '</div>' : (lay === 'dock' ? main + side : side + main);
    if (lay === 'boxed') inner = '<div style="margin:6px 10px;display:flex;flex:1;border-radius:6px;overflow:hidden;box-shadow:0 4px 12px ' + Designs.rgba(c.text, .25) + '">' + inner + '</div>';
    return '<div class="dz-mock" dir="rtl" style="background-color:' + c.bg + ';background-image:' + bgImg + ';background-size:' + bgSize + '">' + inner + '</div>';
  },
  tags: function (d) { var T = DZ_TXT; return [T.lay[d[5]], T.card[d[6]], T.shape[d[7]], T.font[d[9]]].map(function (x) { return L(x[0], x[1]); }).join(' · ') + ' · ' + (d[4] === 'dark' ? L('داكن', 'Dark') : L('فاتح', 'Light')); },
  apply: function (id) {
    if (!can('settings') && !Dev.unlocked) return toast(L('تغيير التصميم من صلاحية المدير', 'Only the admin can change the design'), 'bad');
    S().design = id; Store.log('design', id || 'none'); Store.save(); applyLook(); if (App.user) { Shell.render(); go(App.view); }
    var d = Designs.get(id); toast('🎨 ' + (d ? L('التصميم: ', 'Design: ') + d[3] + ' ' + L(d[1], d[2]) : L('رجعنا للثيمات العادية', 'Back to classic themes')), 'ok');
  },
  html: function () {
    var cur = S().design || '';
    return '<div class="row" style="margin:4px 0 10px"><b class="grow" style="font-size:15px">✨ ' + L('تصميمات غاندي هوم — 30 تصميم (شكل الشاشات نفسه بيتغير مش الألوان بس)', 'Ghandi Home designs — 30 full designs (layout, cards, shapes & fonts, not just colours)') + '</b>' + (cur ? '<button class="btn sm" data-dz="">↺ ' + L('إلغاء التصميم والرجوع للثيمات', 'Back to themes') + '</button>' : '') + '</div>' +
      '<div class="dz-grid">' + DESIGNS.map(function (d) { return '<div class="dz-card' + (d[0] === cur ? ' on' : '') + '" data-dz="' + d[0] + '">' + Designs.mock(d) + '<div class="nm"><span>' + d[3] + ' ' + L(d[1], d[2]) + '</span>' + (d[0] === cur ? '<span class="chip ok">✓ ' + L('الحالي', 'Current') + '</span>' : '') + '</div><div class="tg">' + Designs.tags(d) + '</div></div>'; }).join('') + '</div><div class="muted small" style="margin:12px 0 4px">' + L('أو اختار من الثيمات الأساسية تحت (ألوان بس):', 'Or a classic colour theme below:') + '</div>';
  }
};
(function () {
  var st = document.createElement('style'); st.id = 'dz-css'; st.textContent = Designs.css(); document.head.appendChild(st);
  var al = applyLook;
  applyLook = function () {
    al.apply(this, arguments);
    var de = document.documentElement, d = Store.db ? Designs.get(S().design) : Designs.get(localStorage.getItem('ghandi.design'));
    ['data-design', 'data-dz-lay', 'data-dz-card', 'data-dz-shape', 'data-dz-dens', 'data-dz-font', 'data-dz-bg', 'data-dz-nav', 'data-dz-head', 'data-dz-tbl'].forEach(function (a) { de.removeAttribute(a); });
    try { localStorage.setItem('ghandi.design', d ? d[0] : ''); } catch (e) { }
    if (!d) return;
    de.setAttribute('data-skin', 'dz'); de.setAttribute('data-kit', ''); de.setAttribute('data-nskin', ''); de.removeAttribute('data-fancy'); de.setAttribute('data-theme', d[4]);
    de.setAttribute('data-design', d[0]);
    var k = ['lay', 'card', 'shape', 'dens', 'font', 'bg', 'nav', 'head', 'tbl'], v = [d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13]];
    k.forEach(function (x, i) { de.setAttribute('data-dz-' + x, v[i]); });
  };
  // classic colour themes switch the design off
  var ta = Themes.apply; Themes.apply = function () { if (!can('settings') && !Dev.unlocked) return toast(L('تغيير الشكل من صلاحية المدير', 'Only the admin can change the look'), 'bad'); if (Store.db) delete S().design; return ta.apply(this, arguments); };
  var th = Themes.html; Themes.html = function () { return Designs.html() + th.apply(this, arguments); };
  var tm = Themes.mount; Themes.mount = function (box, after) { tm.apply(this, arguments); if (!box) return; $$('[data-dz]', box).forEach(function (c) { c.onclick = function () { Designs.apply(c.dataset.dz); if (after) after(); else Themes.mount(box, after); }; }); };
  var tp = Themes.picker; Themes.picker = function () { if (!can('settings') && !Dev.unlocked) return toast(L('تغيير التصميم من الإعدادات — صلاحية المدير', 'Designs are changed by the admin in Settings'), 'bad'); return tp.apply(this, arguments); };
})();
