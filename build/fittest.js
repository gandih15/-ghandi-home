const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  const r = await pg.evaluate(async () => { A4.kindNow = 'sale'; var css = A4.css(); var h = A4.invoice(Store.db.sales.filter(s => s.type === 'sale').slice(-1)[0]); A4.kindNow = null;
    var ok = await FitCheck.run(h, { css: css }); var bad = await FitCheck.run('<div class="wide" style="width:2000px">x</div>' + h, { css: css });
    return { okSame: ok === css, fixed: bad !== css && /contain:paint/.test(bad), toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ').slice(0, 140) }; });
  console.log(JSON.stringify(r));
  // watermark is a background now
  console.log('wm bg:', await pg.evaluate(() => { docCfg().opt = { wm: 'معرض الأخوه' }; A4.kindNow = 'sale'; var c = A4.css(); A4.kindNow = null; return /background-image:url\("data:image\/svg/.test(c) && !/\.a4:before/.test(c); }));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
