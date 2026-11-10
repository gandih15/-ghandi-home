/* Ghandi Home — fit the screen: display size (zoom), a slim side menu on small screens, denser tables.
   Works on every theme; the owner can override from the theme window (🎨) or with Ctrl + / Ctrl - / Ctrl 0. */
'use strict';

var Fit = {
  key: 'ghandi.fit',
  get: function () { try { return JSON.parse(localStorage.getItem(Fit.key)) || {}; } catch (e) { return {}; } },
  set: function (o) { try { localStorage.setItem(Fit.key, JSON.stringify(o)); } catch (e) { } Fit.apply(); if (App.user && App.view) go(App.view); },
  autoZoom: function () { var w = (window.screen && screen.width) || innerWidth; return w < 1100 ? 0.85 : w < 1300 ? 0.9 : w < 1400 ? 0.95 : 1; },
  zoom: function () { var o = Fit.get(); return o.zoom || Fit.autoZoom(); },
  apply: function () {
    var z = Fit.zoom();
    if (IS_ELECTRON) { try { require('electron').webFrame.setZoomFactor(z); } catch (e) { } }
    var o = Fit.get(), side = $('.side'), vertical = side && getComputedStyle(side).flexDirection === 'column';
    var mini = o.side === 'mini' || (o.side !== 'full' && innerWidth < 1420);
    document.body.classList.toggle('side-mini', !!(vertical && mini));
    document.body.classList.toggle('dense', innerWidth < 1500); document.body.classList.toggle('narrow', innerWidth < 1150);
    var t = $('#tSide'); if (t) t.style.display = vertical ? '' : 'none';
  },
  step: function (d) { var o = Fit.get(), z = Math.round((o.zoom || Fit.zoom()) * 100) + d * 5; z = Math.max(70, Math.min(130, z)); o.zoom = z / 100; Fit.set(o); toast('🔍 ' + L('حجم العرض ', 'Display size ') + z + '%', 'ok'); }
};
(function () {
  var r0 = Shell.render;
  Shell.render = function () {
    var r = r0.apply(this, arguments);
    var lg = $('#tLang'); if (lg && !$('#tSide')) { var b = document.createElement('button'); b.className = 'btn ghost sm'; b.id = 'tSide'; b.title = L('تصغير / تكبير القايمة الجانبية', 'Collapse / expand the side menu'); b.innerHTML = '☰'; lg.parentNode.insertBefore(b, lg); b.onclick = function () { var o = Fit.get(), now = document.body.classList.contains('side-mini'); o.side = now ? 'full' : 'mini'; Fit.set(o); }; }
    Fit.apply(); return r;
  };
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(Fit.apply, 120); });
  document.addEventListener('keydown', function (e) {
    if (!e.ctrlKey || e.altKey) return;
    if (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd') { e.preventDefault(); Fit.step(1); }
    else if (e.key === '-' || e.code === 'NumpadSubtract') { e.preventDefault(); Fit.step(-1); }
    else if (e.key === '0' || e.code === 'Numpad0') { e.preventDefault(); var o = Fit.get(); delete o.zoom; Fit.set(o); toast('🔍 ' + L('حجم العرض تلقائي', 'Display size: auto'), 'ok'); }
  }, true);
  // the theme window gets a «screen size» section
  if (typeof Themes !== 'undefined' && Themes.picker) {
    var pk = Themes.picker;
    Themes.picker = function () {
      var r = pk.apply(this, arguments), m = $$('.mask').pop(); if (!m) return r; var o = Fit.get();
      var c = document.createElement('div'); c.className = 'card fit-card';
      var zs = [['', L('تلقائي', 'Auto') + ' (' + Math.round(Fit.autoZoom() * 100) + '%)'], [0.8, '80%'], [0.85, '85%'], [0.9, '90%'], [0.95, '95%'], [1, '100%'], [1.1, '110%'], [1.2, '120%']];
      c.innerHTML = '<h3>🖥️ ' + L('مقاس الشاشة', 'Screen fit') + '</h3><div class="f"><span>' + L('حجم العرض (كل حاجة تصغر أو تكبر عشان تيجي على الشاشة)', 'Display size') + '</span><div class="seg" id="fitZ">' + zs.map(function (z) { return '<button data-z="' + z[0] + '" class="' + ((o.zoom || '') == z[0] ? 'on' : '') + '">' + z[1] + '</button>'; }).join('') + '</div></div>' +
        '<div class="f"><span>' + L('القايمة الجانبية', 'Side menu') + '</span><div class="seg" id="fitS">' + [['', L('تلقائي (تصغر في الشاشات الصغيرة)', 'Auto')], ['mini', L('صغيرة (أيقونات بس)', 'Slim (icons)')], ['full', L('كاملة', 'Full')]].map(function (s) { return '<button data-s="' + s[0] + '" class="' + ((o.side || '') === s[0] ? 'on' : '') + '">' + s[1] + '</button>'; }).join('') + '</div></div><div class="muted small">' + L('اختصارات: Ctrl و + تكبير · Ctrl و - تصغير · Ctrl و 0 تلقائي. وزرار ☰ فوق بيصغّر القايمة ويكبرها.', 'Shortcuts: Ctrl + / Ctrl - / Ctrl 0. The ☰ button collapses the menu.') + '</div>';
      ($('.mb', m) || m).insertBefore(c, ($('.mb', m) || m).firstChild);
      $$('#fitZ button', c).forEach(function (b) { b.onclick = function () { var x = Fit.get(); if (b.dataset.z) x.zoom = +b.dataset.z; else delete x.zoom; Fit.set(x); $$('#fitZ button', c).forEach(function (y) { y.classList.toggle('on', y === b); }); }; });
      $$('#fitS button', c).forEach(function (b) { b.onclick = function () { var x = Fit.get(); if (b.dataset.s) x.side = b.dataset.s; else delete x.side; Fit.set(x); $$('#fitS button', c).forEach(function (y) { y.classList.toggle('on', y === b); }); }; });
      return r;
    };
  }
})();
if (typeof Updater !== 'undefined') Updater.notes['2.0.4'] = ['🖥️ البرنامج بيظبط نفسه على مقاس الشاشة: القايمة الجانبية بتصغر لأيقونات في الشاشات الصغيرة، والجداول بتتظبط من غير ما تروح يمين وشمال — على كل الثيمات', '🔍 حجم العرض من 🎨 أو Ctrl و + / Ctrl و - / Ctrl و 0، وزرار ☰ يصغّر القايمة', '🔎 فحص السعر: بحث بالاسم أو الباركود بيطلعلك الأصناف اللي فيها الحروف وسعرها'];
if (typeof Updater !== 'undefined') Updater.notes['2.0.5'] = ['🎨 10 ثيمات جديدة: 5 أنيقة وعصرية (الأزرق الملكي، الزمرد والدهب، جرافيت، موكا، ميدنايت) و5 بناتي ومبهجة (لافندر، خوخ وكريمة، فوشيا، غزل البنات، نعناع وردي) — من 🎨 فوق'];
if (typeof Updater !== 'undefined') Updater.notes['2.0.6'] = ['👑 5 تصميمات بنات مميزة: أميرة البريق، كيوت باستيل، روز جولد، هولوجرام، زهرة الكرز — بزخارف ونجوم وقلوب وورد وأشكال مدوّرة'];
