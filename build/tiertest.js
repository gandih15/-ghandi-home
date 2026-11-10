const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const D = '/home/claude/ghandi/build/shots/tier/'; require('fs').mkdirSync(D, { recursive: true });
  const shot = n => pg.screenshot({ path: D + n + '.png' }), ev = (f, a) => pg.evaluate(f, a), W = t => pg.waitForTimeout(t || 300);
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await W(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await W(1200); await ev(() => Modal.close());
  const go = async v => { await ev(v => go(v), v); await W(450); };
  await go('settings'); await ev(() => { var h = [...document.querySelectorAll('h3')].find(x => /أنواع الأسعار/.test(x.textContent)); h.scrollIntoView(); }); await W(200); await shot('01_settings');
  // admin configures mariam: retail + wholesale, starts at wholesale
  await go('users'); await ev(() => Views.users.edit(Store.db.users.find(u => u.username === 'mariam'), document.getElementById('view'))); await W(300);
  await pg.click('[data-ut="2"]'); await W(100); await pg.selectOption('#utd', '2'); await shot('02_user_tiers'); await pg.click('#us'); await W(300);
  const mu = await ev(() => { var u = Store.db.users.find(u => u.username === 'mariam'); return [u.tiers, u.defTier, u.perms['pos.changeTier']]; });
  ok(JSON.stringify(mu) === '[[0,2],2,true]', 'cashier tiers saved ' + JSON.stringify(mu));
  // become mariam
  await ev(() => { devS().shiftMode = 'off'; App.user = Store.db.users.find(u => u.username === 'mariam'); App.cart = null; Shell.start(); }); await W(300); await ev(() => Modal.close()); await go('pos');
  ok(await ev(() => App.cart.tier === 2 && /جملة/.test(document.getElementById('tier').textContent)), 'invoice starts at wholesale');
  const p = await ev(() => { var p = Store.db.products.find(x => priceOf(x, 2) < priceOf(x, 0) && x.stock > 3); return [p.id, p.barcodes[0], priceOf(p, 0), priceOf(p, 2)]; });
  const tileTxt = await ev(id => document.querySelector('.tile[data-id="' + id + '"] .pr').textContent, p[0]);
  ok(tileTxt.includes(p[3].toFixed(2)), 'tiles show wholesale price ' + tileTxt);
  await pg.fill('#scan', p[1]); await pg.press('#scan', 'Enter'); await W(150);
  ok(await ev(w => App.cart.items[0].price === w, p[3]), 'cart priced at wholesale');
  await ev(() => Views.pos.setTier(1)); await W(150); ok(await ev(() => App.cart.tier === 2), 'half-wholesale refused for this cashier');
  await ev(() => Views.pos.tierMenu()); await W(200); await shot('03_tier_menu'); ok(await ev(() => document.querySelectorAll('.modal [data-t]').length === 2), 'menu shows only allowed types'); await ev(() => Modal.close());
  // retail tiles mode + discount display
  await ev(() => { tierCfg().tiles = 'retail'; tierCfg().showDisc = true; App.cart = newCart(); }); await go('pos');
  await pg.fill('#scan', p[1]); await pg.press('#scan', 'Enter'); await W(150);
  const tt = await ev(id => document.querySelector('.tile[data-id="' + id + '"] .pr').textContent, p[0]);
  ok(tt.includes(p[2].toFixed(2)) && !tt.includes(p[3].toFixed(2)), 'retail-tiles mode shows retail on tiles: ' + tt);
  ok(await ev(r => App.cart.items[0].base === r, p[2]), 'wholesale shown as discount off retail');
  await shot('04_pos_wholesale_as_discount');
  await ev(() => Views.pos.pay()); await W(300); ok(await pg.$('.tierbar'), 'checkout has price-type switch'); await shot('05_checkout_tierbar');
  await pg.click('[data-pt="0"]'); await W(400);
  ok(await ev(r => App.cart.tier === 0 && App.cart.items[0].price === r, p[2]), 'switching at checkout re-prices to retail');
  await pg.click('[data-pt="2"]'); await W(400); await pg.click('#done'); await W(500);
  const s = await ev(() => { var s = Store.db.sales[Store.db.sales.length - 1]; return [s.tier, s.tierName, s.items.map(i => i.tier)]; });
  ok(s[0] === 2 && s[2].every(x => x === 2), 'sale + items record wholesale ' + JSON.stringify(s));
  ok(await ev(() => /نوع السعر/.test(Receipt.html(Store.db.sales[Store.db.sales.length - 1]))), 'receipt prints price type');
  // products columns hidden for cashier
  await go('products'); const ths = await ev(() => [...document.querySelectorAll('#pt th')].map(x => x.textContent).join('|')); ok(!/نص جملة/.test(ths) && !/التكلفة/.test(ths), 'cashier sees only allowed price columns: ' + ths); await shot('06_products_cashier');
  // back to admin
  await ev(() => { App.user = Store.db.users.find(u => u.username === 'admin'); App.cart = null; Shell.start(); }); await W(300); await ev(() => Modal.close());
  await ev(() => { Views.reports.tab = 'tier'; }); await go('reports'); await shot('07_report_by_type');
  ok(await ev(() => document.querySelectorAll('.tierk').length >= 3), 'report by price type rendered');
  await ev(id => Views.products.edit(Store.product(id)), p[0]); await W(300); await shot('08_product_sold_by_type'); ok(await pg.$('.tsold'), 'product shows sold-by-type'); await ev(() => Modal.close());
  await go('sales'); await pg.selectOption('#sfT', '2'); await W(300); await shot('09_sales_filter_type');
  ok(await ev(() => [...document.querySelectorAll('#stb tr[data-id]')].length >= 1), 'invoice filter by price type');
  console.log(errs.length ? errs.join('\n') : 'NO PAGE ERRORS'); await b.close();
})();
