/* Ghandi Home — Backup page: 1 fixed copy inside the program folder + 3 locations the owner chooses */
'use strict';
var SLOT_HINTS = [
  ['💽', 'g-sapphire', 'مثلاً بارتيشن تاني على الجهاز', 'e.g. another partition'],
  ['🔌', 'g-emerald', 'مثلاً فلاشة', 'e.g. a USB stick'],
  ['🗄️', 'g-amethyst', 'مثلاً هارد خارجي أو جهاز تاني', 'e.g. external drive or another PC']
];
function openFolder(p) {
  if (!IS_NW) return toast(L('فتح الفولدر بيشتغل في نسخة Ghandi.exe', 'Opening folders works in Ghandi.exe'), 'bad');
  try { if (!NODE.fs.existsSync(p)) NODE.fs.mkdirSync(p, { recursive: true }); Desk.openFolder(p); } catch (e) { toast(e.message, 'bad'); }
}
function copyText(t) { try { if (IS_NW) Desk.copy(t); else navigator.clipboard.writeText(t); toast(L('اتنسخ ✓', 'Copied ✓'), 'ok'); } catch (e) { } }
function bkGem(e, c) { return kit() ? gem(e, c, 'lg') : '<span style="font-size:28px">' + e + '</span>'; }

Views.backup = function (el) {
  var b = S().backup, last = +(localStorage.getItem('ghandi.lastBackup') || 0), usb = Backup.usbDrives(), inDir = Backup.internalDir(), inDrive = Backup.driveOf(inDir);
  var ago = function (t) { if (!t) return ''; var m = Math.round((Date.now() - t) / 60000); return m < 1 ? L('دلوقتي', 'just now') : m < 60 ? L('من ', '') + m + L(' دقيقة', ' min ago') : m < 1440 ? L('من ', '') + Math.round(m / 60) + L(' ساعة', ' h ago') : U.dt(t); };
  var slotStatus = function (s, i) {
    if (!s.path) return '<span class="chip">' + L('لسه متحددش', 'Not set') + '</span>';
    if (!s.on) return '<span class="chip">⏸️ ' + L('متوقف', 'Paused') + '</span>';
    var dir = Backup.slotDir(s.path), st = b.status['s' + i] || {};
    if (!Backup.driveReady(dir)) return '<span class="chip warn">🔌 ' + L('مش متوصل دلوقتي — هيتنسخ عليه أول ما يتوصل', 'Not connected — will copy as soon as it is') + '</span>';
    if (st.err && (!st.t || st.et > st.t)) return '<span class="chip bad" title="' + U.esc(st.err) + '">❌ ' + L('فيه مشكلة في الكتابة', 'Write failed') + '</span>';
    var n = Backup.count(dir);
    return st.t ? '<span class="chip ok">✅ ' + L('آخر نسخة ', 'Last copy ') + ago(st.t) + '</span>' + (n > 0 ? ' <span class="chip">' + n + L(' نسخة محفوظة', ' copies') + '</span>' : '') : '<span class="chip">' + L('هيتنسخ عليه في النسخة الجاية', 'Will be used on the next backup') + '</span>';
  };
  var inSt = b.status.internal || {}, inCount = IS_NW ? Backup.count(inDir) : (inSt.n || 0);
  el.innerHTML =
    '<div class="grid g3" style="margin-bottom:16px"><div class="card kpi hero"><div class="ic">' + (kit() ? gem('💾', 'g-aqua') : ic('save')) + '</div><div class="l">' + L('آخر نسخة احتياطية', 'Last backup') + '</div><div class="v" style="font-size:20px">' + (last ? ago(last) : L('لسه متعملتش', 'Never')) + '</div><div class="small" style="opacity:.8">' + (last ? U.dt(last) : '') + '</div></div>' +
    '<div class="card kpi"><div class="ic">' + (kit() ? gem('📍', 'g-rose') : ic('file')) + '</div><div class="l">' + L('أماكن النسخ الشغّالة', 'Active locations') + '</div><div class="v num">' + (1 + b.slots.filter(function (s) { return s.on && s.path; }).length) + ' / 4</div><div class="muted small">' + L('الأساسية + 3 أماكن بتحددها', 'Main + 3 of your choice') + '</div></div>' +
    '<div class="card kpi"><div class="ic">' + (kit() ? gem('⏰', 'g-gold') : ic('clock')) + '</div><div class="l">' + L('النسخ التلقائي', 'Auto backup') + '</div><div class="v" style="font-size:20px">' + (b.auto ? L('كل ', 'Every ') + b.every + L(' دقيقة', ' min') : L('متوقف', 'Off')) + '</div><div class="muted small">' + (usb.length ? '🔌 ' + L('فلاشات متوصلة: ', 'USB: ') + usb.join(' ') : '') + '</div></div></div>' +

    '<div class="card bk-main"><div class="row" style="align-items:flex-start;gap:16px">' + bkGem('🏠', 'g-gold') + '<div class="grow"><h3 style="margin:0 0 4px">' + L('النسخة الأساسية — جوه ملفات البرنامج', 'Main copy — inside the program folder') + ' <span class="chip ok">' + L('شغّالة دايماً', 'Always on') + '</span></h3>' +
    '<div class="muted" style="line-height:1.8">' + L('دي نسخة بتتعمل دايماً جنب البرنامج نفسه، في فولدر <b>data ← backups</b> جوه فولدر غاندي. يعني لو البرنامج على <b>D:\\Ghandi</b> هتلاقيها في <b>D:\\Ghandi\\data\\backups</b>. وجنبها ملف اسمه <b>«اقرأني - أماكن النسخ الاحتياطية»</b> مكتوب فيه كل الأماكن.', 'Always saved next to the program itself, in <b>data → backups</b> inside the Ghandi folder. If Ghandi is on <b>D:\\Ghandi</b> it is in <b>D:\\Ghandi\\data\\backups</b>. A file named <b>“اقرأني”</b> beside it lists every location.') + '</div>' +
    '<div class="bk-path"><span class="num">' + U.esc(inDir) + '</span></div>' +
    '<div class="row wrap"><button class="btn pri" id="inOpen">📂 ' + L('افتح الفولدر', 'Open folder') + '</button><button class="btn" id="inCopy">📋 ' + L('انسخ المسار', 'Copy path') + '</button><span class="muted small">' + (inSt.t ? '✅ ' + L('آخر نسخة ', 'Last copy ') + ago(inSt.t) : '') + (inCount > 0 ? ' · ' + inCount + L(' نسخة محفوظة', ' copies kept') : '') + '</span></div></div></div></div>' +

    '<div class="row" style="margin:20px 0 10px"><b style="font-size:16px" class="grow">📍 ' + L('3 أماكن تانية بتختارها إنت', '3 more locations you choose') + '</b><span class="muted small">' + L('يفضّل كل مكان يكون على هارد أو فلاشة مختلفة', 'Best on different drives / sticks') + '</span></div>' +
    '<div class="grid g3">' + b.slots.map(function (s, i) {
      var h = SLOT_HINTS[i], dir = s.path ? Backup.slotDir(s.path) : '', same = dir && inDrive && Backup.driveOf(dir) === inDrive;
      return '<div class="card col bk-slot' + (s.path && s.on ? ' on' : '') + '" data-slot="' + i + '"><div class="row">' + bkGem(h[0], h[1]) + '<div class="grow"><b style="font-size:15px">' + L('المكان رقم ', 'Location ') + (i + 1) + '</b><div class="muted small">' + L(h[2], h[3]) + '</div></div><label class="row small" title="' + L('تشغيل / إيقاف', 'On / off') + '"><input type="checkbox" class="sw" data-on ' + (s.on ? 'checked' : '') + '></label></div>' +
        '<div class="row" style="gap:6px"><input class="in num" data-path placeholder="' + L('اختار فولدر…', 'Choose a folder…') + '" value="' + U.esc(s.path || '') + '" style="direction:ltr;text-align:start">' + (IS_NW ? '<input type="file" nwdirectory class="hide" data-pick>' : '') + '<button class="btn" data-browse title="' + L('اختيار', 'Browse') + '">📁</button></div>' +
        (dir && dir !== s.path ? '<div class="muted small">' + L('هيتحفظ في: ', 'Saves to: ') + '<span class="num">' + U.esc(dir) + '</span></div>' : '') +
        '<div>' + slotStatus(s, i) + '</div>' + (same ? '<div class="chip warn" style="white-space:normal">⚠️ ' + L('ده نفس البارتيشن بتاع البرنامج — لو الهارد باظ هتضيع النسختين. الأفضل فلاشة أو هارد تاني.', 'Same drive as the program — if the disk fails both copies are lost.') + '</div>' : '') +
        '<div class="row wrap" style="gap:6px;margin-top:auto"><button class="btn sm" data-test ' + (s.path ? '' : 'disabled') + '>🧪 ' + L('جرّب', 'Test') + '</button><button class="btn sm" data-open ' + (s.path ? '' : 'disabled') + '>📂 ' + L('افتح', 'Open') + '</button>' + (s.path ? '<button class="btn sm ghost" data-clear style="color:var(--bad)">✕ ' + L('إلغاء المكان', 'Remove') + '</button>' : '') + '</div></div>';
    }).join('') + '</div>' +

    '<div class="grid g2" style="margin-top:16px;align-items:start"><div class="card col"><h3>⚙️ ' + L('إمتى يتعمل باك اب؟', 'When to back up') + '</h3><label class="row"><input type="checkbox" class="sw" data-k="auto" ' + (b.auto ? 'checked' : '') + '> ' + L('تلقائي كل', 'Automatically every') + ' <input class="in num" type="number" data-k="every" value="' + b.every + '" style="width:80px"> ' + L('دقيقة', 'minutes') + '</label>' +
    '<label class="row"><input type="checkbox" class="sw" data-k="onShiftClose" ' + (b.onShiftClose ? 'checked' : '') + '> ' + L('عند تقفيل كل وردية', 'On every shift close') + '</label><div class="row small">🔒 ' + L('عند قفل البرنامج: دايماً (إجباري)', 'When the program closes: always (mandatory)') + '</div>' +
    '<label class="row"><input type="checkbox" class="sw" data-k="allUsb" ' + (b.allUsb ? 'checked' : '') + '> ' + L('كمان على أي فلاشة تتوصل (فولدر Ghandi-Backup)', 'Also on any USB stick plugged in (Ghandi-Backup folder)') + '</label>' +
    '<div class="muted small">♻️ ' + ((S().dev && S().dev.keep > 1) ? L('بيتحفظ آخر ', 'Keeps the last ') + S().dev.keep + L(' نسخ في كل مكان', ' copies per place') : L('في كل مكان بيتحفظ آخر نسخة بس — النسخة الجديدة بتحل محل القديمة بعد ما تتأكد إنها سليمة.', 'Each place keeps only the newest copy — it replaces the old one after being verified.')) + '</div>' +
    '<button class="btn pri lg" id="bnow" style="margin-top:6px">💾 ' + L('اعمل نسخة احتياطية دلوقتي', 'Back up now') + '</button><div id="bres" class="row wrap" style="gap:6px"></div></div>' +
    (can('restore') ? '<div class="card col"><h3>♻️ ' + L('استرجاع نسخة', 'Restore') + '</h3>' + (function () { var f = IS_NW ? Backup.findLatest(Backup.slotPaths()) : null; return f ? '<div class="list-row"><div class="grow"><b>' + L('أحدث نسخة لقيناها', 'Newest backup found') + '</b><div class="muted small num">' + U.esc(f.file) + '<br>' + U.dt(f.time) + '</div></div><button class="btn gold" id="bauto">' + L('استرجعها', 'Restore it') + '</button></div>' : ''; })() +
      '<label class="f">' + L('أو اختار ملف نسخة (.gbk) من أي مكان', 'Or choose a .gbk file from anywhere') + '<input type="file" class="in" id="bfile" accept=".gbk,.json"></label><div class="muted small" style="line-height:1.8">💡 ' + L('لو الويندوز وقع: شغّل Ghandi.exe من نفس البارتيشن أو الفلاشة، وهيدوّر لوحده على أحدث نسخة في كل الأماكن دي ويعرض عليك تسترجعها.', 'After a Windows reinstall: run Ghandi.exe from the same drive and it finds the newest backup in all these places automatically.') + '</div></div>' : '') + '</div>';

  var save = function () { Store.save(); try { localStorage.setItem('ghandi.backupFolders', JSON.stringify(Backup.slotPaths())); } catch (e) { } };
  $('#inOpen').onclick = function () { openFolder(inDir); };
  $('#inCopy').onclick = function () { copyText(inDir); };
  $$('[data-slot]').forEach(function (c) {
    var i = +c.dataset.slot, s = b.slots[i], setPath = function (v) { s.path = String(v || '').trim(); if (s.path) s.on = true; delete b.status['s' + i]; save(); Store.log('backup.slot', (i + 1) + ': ' + s.path); Views.backup(el); };
    $('[data-path]', c).onchange = function () { setPath(this.value); };
    $('[data-on]', c).onchange = function () { s.on = this.checked; save(); Views.backup(el); };
    $('[data-browse]', c).onclick = function () { if (IS_NW) Desk.pickDir(setPath); else Modal.prompt(L('المكان رقم ', 'Location ') + (i + 1), L('اكتب مسار الفولدر', 'Folder path'), s.path || 'E:\\', setPath); };
    if ($('[data-open]', c)) $('[data-open]', c).onclick = function () { openFolder(Backup.slotDir(s.path)); };
    if ($('[data-clear]', c)) $('[data-clear]', c).onclick = function () { setPath(''); };
    $('[data-test]', c).onclick = function () {
      var dir = Backup.slotDir(s.path);
      if (!IS_NW) return toast(L('الاختبار بيشتغل في نسخة Ghandi.exe', 'Testing works in Ghandi.exe'), 'bad');
      if (!Backup.driveReady(dir)) return toast(L('الفلاشة أو الهارد ده مش متوصل', 'That drive is not connected'), 'bad');
      try { if (!NODE.fs.existsSync(dir)) NODE.fs.mkdirSync(dir, { recursive: true }); var f = NODE.path.join(dir, '.ghandi-test'); NODE.fs.writeFileSync(f, 'ok'); NODE.fs.unlinkSync(f); toast(L('المكان شغّال وينفع نحفظ عليه ✓', 'Location works ✓'), 'ok'); } catch (e) { toast(L('مش قادر أكتب هنا: ', 'Cannot write here: ') + e.message, 'bad'); }
    };
  });
  $$('[data-k]').forEach(function (i) { i.onchange = function () { b[i.dataset.k] = i.type === 'checkbox' ? i.checked : Math.max(1, U.n(i.value)); save(); Backup.schedule(); }; });
  $('#bnow').onclick = function () {
    var r = Backup.run('manual');
    if (IS_NW) Views.backup(el);
    var box = $('#bres'); if (!box) return;
    box.innerHTML = r.ok.map(function (x) { return '<span class="chip ok">✅ ' + U.esc(x) + '</span>'; }).join('') + (r.missing || []).map(function (x) { return '<span class="chip warn">🔌 ' + U.esc(x) + ' — ' + L('مش متوصل', 'not connected') + '</span>'; }).join('') + r.fail.map(function (x) { return '<span class="chip bad">❌ ' + U.esc(x) + '</span>'; }).join('');
    toast(r.fail.length ? L('النسخة اتعملت بس فيه مكان فيه مشكلة', 'Backup done, but one location failed') : L('تم النسخ الاحتياطي ✓', 'Backup done ✓'), r.fail.length ? 'bad' : 'ok');
  };
  var restore = function (data) { Modal.confirm(L('هيتم استبدال كل البيانات الحالية بالنسخة دي (وهنعمل نسخة من الحالية الأول). متأكد؟', 'All current data will be replaced (a safety copy is made first). Continue?'), function () { try { if (IS_NW) Backup.run('pre-restore'); var o = Backup.restoreFrom(data); Store.log('restore', U.dt(o.at)); toast(L('تم الاسترجاع — ادخل تاني', 'Restored — please sign in again'), 'ok'); App.user = null; Gate.login(); } catch (e) { toast(L('الملف ده مش نسخة غاندي سليمة', 'Not a valid Ghandi backup'), 'bad'); } }); };
  if ($('#bauto')) $('#bauto').onclick = function () { restore(NODE.fs.readFileSync(Backup.findLatest(Backup.slotPaths()).file)); };
  if ($('#bfile')) $('#bfile').onchange = function () { var f = this.files[0]; if (!f) return; if (IS_NW && f.path) return restore(NODE.fs.readFileSync(f.path)); var r = new FileReader(); r.onload = function () { restore(r.result); }; r.readAsText(f); };
};
