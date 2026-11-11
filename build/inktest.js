const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/tiba';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); S().invoice.paper = 'A4'; go('invoice'); }); await pg.waitForTimeout(1000);
  for (const lv of [1, 3, 5]) { await pg.click(`#pgInk [data-ink="${lv}"]`); await pg.waitForTimeout(500); await pg.screenshot({ path: `${OUT}/50_ink${lv}.png`, clip: { x: 430, y: 230, width: 600, height: 380 } }); }
  console.log('saved ink:', await pg.evaluate(() => docCfg().page.ink), 'css:', await pg.evaluate(() => { A4.kindNow = 'sale'; var c = A4.css(); A4.kindNow = null; return /-webkit-text-stroke:0.55px/.test(c); }));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
