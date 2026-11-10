// node build/designtest.js → screenshots every design (dashboard; POS for a few) + the picker, reports errors
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/designs'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); go('settings'); });
  await pg.waitForTimeout(500);
  await pg.evaluate(() => { var g = document.querySelector('.dz-grid'); g && g.scrollIntoView(); }); await pg.waitForTimeout(300); await pg.screenshot({ path: OUT + '/00_picker.png' });
  const ids = await pg.evaluate(() => DESIGNS.map(d => d[0]));
  for (const [i, id] of ids.entries()) {
    await pg.evaluate(id => { S().design = id; applyLook(); Shell.render(); go(window.__v || 'dashboard'); }, id); await pg.waitForTimeout(350);
    await pg.screenshot({ path: `${OUT}/${String(i + 1).padStart(2, '0')}_${id}.png` });
  }
  for (const id of ['nakhla', 'kitan', 'sama', 'neon', 'malaki']) { await pg.evaluate(id => { S().design = id; applyLook(); Shell.render(); go('pos'); }, id); await pg.waitForTimeout(400); await pg.screenshot({ path: `${OUT}/pos_${id}.png` }); }
  await pg.evaluate(() => { S().design = 'ofok'; applyLook(); Shell.render(); go('installments'); }); await pg.waitForTimeout(400); await pg.screenshot({ path: `${OUT}/inst_ofok.png` });
  // cashier cannot change
  const cash = await pg.evaluate(() => { var u = App.user; App.user = Store.db.users[1]; var before = S().design; Designs.apply('neon'); var after = S().design; App.user = u; return before === after; });
  console.log('cashier blocked:', cash, 'designs:', ids.length, 'ERRORS:', errs.join('\n') || 'none');
  await b.close();
})();
