const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await br.newPage({ viewport: { width: 1440, height: 1250 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await pg.waitForTimeout(2600);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(900);
  for (const sk of ['velvet', 'classic', 'pearl']) {
    await pg.evaluate(sk => { S().skin = sk; S().theme = 'light'; S().lang = 'ar'; applyLook(); Shell.render(); go('backup'); }, sk); await pg.waitForTimeout(700);
    await pg.screenshot({ path: `shots/30_backup_${sk}.png` });
  }
  await pg.evaluate(() => { S().skin = 'velvet'; S().lang = 'en'; applyLook(); Shell.render(); go('backup'); }); await pg.waitForTimeout(600); await pg.screenshot({ path: 'shots/30_backup_en.png' });
  console.log('readme:\n' + await pg.evaluate(() => { S().lang = 'ar'; return Backup.readme(); }));
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await br.close();
})();
