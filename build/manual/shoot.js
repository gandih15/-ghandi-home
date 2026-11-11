// node build/manual/shoot.js → annotated screenshots for the user guide (build/manual/img/*.jpg + marks.json)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const SPEC = require('./spec.js'), OUT = path.join(__dirname, 'img'); fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.argv[2];
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.4 });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); docCfg().preview = true; });
  const result = fs.existsSync(path.join(__dirname, 'marks.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'marks.json'), 'utf8')) : {};
  for (const ch of SPEC) for (const sh of ch.shots) {
    if (ONLY && sh.id !== ONLY) continue;
    await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); document.querySelectorAll('.mk-ov').forEach(x => x.remove()); window.scrollTo(0, 0); var v = document.getElementById('view'); if (v) v.scrollTop = 0; });
    await pg.waitForTimeout(150);
    try { await pg.evaluate(sh.prep); } catch (e) { errs.push(sh.id + ' prep: ' + e.message); }
    await pg.waitForTimeout(sh.wait || 700);
    const r = await pg.evaluate(({ marks, modal }) => {
      var root = modal ? (document.querySelectorAll('.mask .modal, .mask > div')[document.querySelectorAll('.mask .modal, .mask > div').length - 1] || document) : document;
      var vis = function (e) { var r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
      var find = function (t) {
        if (t.startsWith('t:')) { var s = t.slice(2), best = null, ba = 1e12; root.querySelectorAll('*').forEach(function (e) { if (!vis(e) || e.closest('.mk-ov')) return; var tx = (e.innerText || e.value || '').trim(); if (tx.indexOf(s) < 0) return; var r = e.getBoundingClientRect(), a = r.width * r.height; if (a < ba) { ba = a; best = e; } }); return best; }
        if (t.startsWith('p:')) { var q = t.slice(2), f = null; root.querySelectorAll('input,textarea').forEach(function (e) { if (!f && vis(e) && (e.placeholder || '').indexOf(q) >= 0) f = e; }); return f; }
        var all = [].slice.call(root.querySelectorAll(t)).filter(vis); return all[0] || null;
      };
      var out = [], miss = [], used = [], n = 0, mroot = modal ? root.getBoundingClientRect() : null;
      marks.forEach(function (m) {
        var e = find(m[0]); if (!e) { miss.push(m[0]); return; }
        n++; var r = e.getBoundingClientRect();
        var box = document.createElement('div'); box.className = 'mk-ov'; box.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;border:2.5px solid #e11d48;border-radius:8px;box-shadow:0 0 0 3px rgba(225,29,72,.18);left:' + (r.left - 4) + 'px;top:' + (r.top - 4) + 'px;width:' + (r.width + 8) + 'px;height:' + (r.height + 8) + 'px';
        var x = Math.min(innerWidth - 34, Math.max(4, r.right - 6)), y = Math.max(4, r.top - 16);
        used.forEach(function (u) { if (Math.abs(u[0] - x) < 30 && Math.abs(u[1] - y) < 30) y += 32; }); used.push([x, y]);
        var c = document.createElement('div'); c.className = 'mk-ov'; c.textContent = n; c.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;width:30px;height:30px;border-radius:50%;background:#e11d48;color:#fff;font:800 16px Tahoma,Arial;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.35);left:' + x + 'px;top:' + y + 'px';
        document.body.appendChild(box); document.body.appendChild(c); out.push({ n: n, title: m[1], text: m[2] });
      });
      return { marks: out, miss: miss, clip: mroot ? { x: Math.max(0, mroot.left - 10), y: Math.max(0, mroot.top - 10), width: Math.min(innerWidth, mroot.width + 20), height: Math.min(innerHeight, mroot.height + 20) } : null };
    }, { marks: sh.marks, modal: sh.size === 'modal' });
    await pg.waitForTimeout(120);
    await pg.screenshot({ path: path.join(OUT, sh.id + '.jpg'), type: 'jpeg', quality: 80, clip: r.clip || undefined });
    result[sh.id] = r.marks;
    if (r.miss.length) console.log('MISSING', sh.id, JSON.stringify(r.miss));
  }
  fs.writeFileSync(path.join(__dirname, 'marks.json'), JSON.stringify(result, null, 1));
  console.log('shots:', Object.keys(result).length, 'errors:', errs.join(' | ') || 'none');
  await b.close();
})();
