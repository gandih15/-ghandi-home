const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await br.newPage({ viewport: { width: 1440, height: 860 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await pg.waitForTimeout(2600);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1000);
  const codes = await pg.evaluate(() => [Store.db.products[3].barcodes[0], Store.db.products[22].barcodes[0], Store.db.products[1].barcodes[0], Store.db.products[1].barcodes[0]]);
  const only = process.argv[2];
  for (const sk of ['velvet', 'pearl', 'maison', 'candy', 'aurora', 'classic']) {
    if (only && sk !== only) continue;
    await pg.evaluate(sk => { S().skin = sk; S().theme = 'light'; applyLook(); Shell.render(); go('dashboard'); }, sk); await pg.waitForTimeout(900);
    await pg.screenshot({ path: `shots/themes/${sk}_1_dashboard.png` });
    await pg.evaluate(() => { App.cart = null; go('pos'); }); await pg.waitForTimeout(200);
    for (const c of codes) { await pg.fill('#scan', c); await pg.press('#scan', 'Enter'); await pg.waitForTimeout(60); }
    await pg.waitForTimeout(2700); await pg.screenshot({ path: `shots/themes/${sk}_2_pos.png` });
    await pg.evaluate(() => go('products')); await pg.waitForTimeout(400); await pg.screenshot({ path: `shots/themes/${sk}_3_products.png` });
    await pg.evaluate(() => { const u = App.user; App.user = null; Gate.login(); App._u = u; }); await pg.waitForTimeout(700); await pg.screenshot({ path: `shots/themes/${sk}_4_login.png` });
    await pg.evaluate(() => { document.getElementById('gate').remove(); App.user = App._u; });
  }
  await pg.evaluate(() => { S().skin = 'velvet'; applyLook(); Shell.render(); go('settings'); document.getElementById('thgal').scrollIntoView(); }); await pg.waitForTimeout(800);
  await pg.screenshot({ path: 'shots/themes/0_settings_gallery.png' });
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await br.close();
})();
