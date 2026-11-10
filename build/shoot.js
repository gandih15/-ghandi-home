const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1 });
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const base = 'file:///home/claude/ghandi/app/index.html';
  const only = process.argv[2];
  await pg.goto(base + '?demo&reset'); await pg.waitForTimeout(2500);
  const shot = async (n) => { if (!only || n.includes(only)) await pg.screenshot({ path: `/home/claude/ghandi/build/shots/${n}.png` }); };
  await shot('00_login_ar');
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1200);
  const go = async (v) => { await pg.evaluate(v => go(v), v); await pg.waitForTimeout(500); };
  for (const lang of ['ar', 'en']) {
    if (lang === 'en') { await pg.evaluate(() => { S().lang = 'en'; Shell.render(); }); }
    await go('dashboard'); await shot(`01_dashboard_${lang}`);
    await go('pos');
    const codes = await pg.evaluate(() => [Store.db.products[1].barcodes[0], Store.db.products[1].barcodes[0], Store.db.products[3].barcodes[0], Store.db.products[16].barcodes[0], Store.db.products[22].barcodes[0], Store.db.products[40].barcodes[0]]);
    for (const c of codes) { await pg.fill('#scan', c); await pg.press('#scan', 'Enter'); await pg.waitForTimeout(80); }
    await pg.evaluate(() => { App.cart.customer = 'c1'; App.cart.disc = 10; Views.pos.draw(); }); await pg.waitForTimeout(2800);
    await shot(`02_pos_${lang}`);
    await pg.keyboard.press('F4'); await pg.waitForTimeout(400); await shot(`03_checkout_${lang}`);
    await pg.keyboard.press('Escape'); await pg.evaluate(() => Modal.close());
    await go('promos'); await shot(`20_promos_${lang}`);
    await pg.evaluate(() => Views.promos.edit(Store.db.promos[0], document.getElementById('view'))); await pg.waitForTimeout(400); await shot(`21_promo_edit_${lang}`); await pg.evaluate(() => Modal.close());
    await go('prices'); await pg.evaluate(() => { const b = [...document.querySelectorAll('[data-pick="cats"] .pickc')][0]; b && b.click(); document.querySelector('[data-tier="2"]').click(); }); await pg.waitForTimeout(300); await shot(`22_prices_${lang}`);
    await pg.evaluate(() => { Views.purchases.draft = { supplier: 's1', ref: 'B-102', items: [], paid: 0, note: '', updCost: true, updPrice: true }; }); await go('purchases');
    for (const c of await pg.evaluate(() => [Store.db.products[0].barcodes[0], Store.db.products[0].barcodes[0], Store.db.products[20].barcodes[0]])) { await pg.fill('#ps', c); await pg.press('#ps', 'Enter'); await pg.waitForTimeout(80); }
    await shot(`23_receive_${lang}`);
    await pg.fill('#ps', '6229999999999'); await pg.press('#ps', 'Enter'); await pg.waitForTimeout(400); await shot(`24_receive_new_item_${lang}`); await pg.evaluate(() => { Modal.close(); Views.purchases.draft = null; });
    await go('products'); await shot(`04_products_${lang}`);
    await pg.evaluate(() => Views.products.edit(Store.db.products[1])); await pg.waitForTimeout(400); await shot(`05_product_edit_${lang}`); await pg.evaluate(() => Modal.close());
    await pg.evaluate(() => { Views.labels.queue = [{ pid: 'p23', qty: 3, code: Store.db.products[22].barcodes[0] }, { pid: 'p5', qty: 2 }]; });
    await go('labels'); await shot(`06_labels_${lang}`);
    await go('users'); await pg.evaluate(() => Views.users.edit(Store.db.users[2], document.getElementById('view'))); await pg.waitForTimeout(400); await shot(`07_permissions_${lang}`); await pg.evaluate(() => Modal.close());
    await go('invoice'); await shot(`08_invoice_designer_${lang}`);
    await go('shop'); await shot(`26_shop_profile_${lang}`);
    await go('backup'); await shot(`09_backup_${lang}`);
    await go('reports'); await shot(`10_reports_${lang}`);
    await pg.evaluate(() => { Views.count.cur = Store.db.counts[0]; }); await go('count'); await shot(`11_count_${lang}`); await pg.evaluate(() => { Views.count.cur = null; });
    await go('shifts'); await shot(`12_shifts_${lang}`);
    await go('sales'); await shot(`13_sales_${lang}`);
    await go('settings'); await shot(`14_settings_${lang}`);
    await go('purchases'); await go('contacts'); await go('expenses'); await go('about'); await shot(`15_about_${lang}`);
  }
  await pg.evaluate(() => { S().theme = 'dark'; S().lang = 'ar'; Shell.render(); go('pos'); }); await pg.waitForTimeout(500); await shot('16_pos_dark');
  // first run of a brand-new shop
  await pg.evaluate(() => { const s = S(); s.shopName = ''; s.shopNameEn = ''; s.logo = ''; s.slogan = ''; s.lang = 'ar'; Shell.render(); go('shop'); }); await pg.waitForTimeout(500); await shot('27_first_run_setup');
  await pg.evaluate(() => { const s = S(); s.shopName = 'بيوتي كورنر'; s.slogan = 'كل اللي يخص جمالك'; Shell.render(); go('pos'); }); await pg.waitForTimeout(500); await shot('28_other_shop_pos');
  // activation screen
  await pg.evaluate(() => { App.user = null; document.getElementById('app').innerHTML = ''; S().theme = 'light'; Gate.activate({ ok: false, why: 'none' }); }); await pg.waitForTimeout(800); await shot('17_activation_ar');
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS');
  await b.close();
})();
