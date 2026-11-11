const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/live';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); go('pos'); }); await pg.waitForTimeout(700);
  console.log('free:', await pg.evaluate(() => { var s = document.querySelector('#xRep'); return s && !s.disabled && s.options.length; }));
  await pg.evaluate(() => { go('commissions'); }); await pg.waitForTimeout(500);
  await pg.selectOption('#cmM', 'all'); await pg.waitForTimeout(200);
  await pg.screenshot({ path: OUT + '/30_comm_setting.png' });
  await pg.evaluate(() => { go('pos'); }); await pg.waitForTimeout(700);
  console.log('all locked:', await pg.evaluate(() => { var s = document.querySelector('#xRep'); return s && s.disabled && s.textContent; }));
  await pg.evaluate(() => document.querySelector('#xRep').scrollIntoView()); await pg.screenshot({ path: OUT + '/31_pos_locked.png' });
  // sale saved with the logged-in user as rep even if cart said otherwise
  const rep = await pg.evaluate(() => { var p = Store.db.products.filter(x => !x.serial && x.stock > 0)[0]; App.cart.rep = 'r:someone'; var s = Sales.create({ items: [{ pid: p.id, name: p.name, qty: 1, price: p.prices[0], cost: p.cost, base: p.prices[0] }], payments: { cash: p.prices[0] }, subtotal: p.prices[0], total: p.prices[0], discount: 0, vat: 0 }); return s && s.rep + ' vs ' + 'u:' + App.user.id; });
  console.log('saved rep:', rep);
  // staff mode: admin free, cashier locked
  await pg.evaluate(() => { homeCfg().repMode = 'staff'; go('pos'); }); await pg.waitForTimeout(500);
  console.log('staff/admin free:', await pg.evaluate(() => !document.querySelector('#xRep').disabled));
  await pg.evaluate(() => { devS().repMode = 'all'; go('commissions'); }); await pg.waitForTimeout(500);
  console.log('dev override disables owner select:', await pg.evaluate(() => document.querySelector('#cmM').disabled));
  await pg.evaluate(() => { Dev.unlocked = true; go('dev'); }); await pg.waitForTimeout(600);
  await pg.evaluate(() => document.querySelector('#dvRep').scrollIntoView({ block: 'center' })); await pg.screenshot({ path: OUT + '/32_dev_rep.png' });
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
