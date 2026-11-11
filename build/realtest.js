// fresh (non-demo) install smoke test: every page as admin, developer and a cashier
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/real'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR [' + (pg._at || '') + '] ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html'); await pg.evaluate(() => { localStorage.clear(); }); await pg.reload(); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { License.check = () => Promise.resolve({ ok: true, payload: { n: 'معرض الاخوه', ph: '01001234567' } }); License.info = { n: 'معرض الاخوه' }; $$('.gate').forEach(g => g.remove()); $$('.mask').forEach(g => g.remove()); Shop.syncFromLicense({ n: 'معرض الاخوه', ph: '01001234567' }); Gate.login(); }); await pg.waitForTimeout(800);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { $$('.mask').forEach(g => g.remove()); App.user.mustChange = false; });
  const views = await pg.evaluate(() => NAV.filter(n => n[0] && Views[n[0]]).map(n => n[0]));
  const walk = async (who) => { for (const v of views) { pg._at = who + ':' + v; await pg.evaluate(v => { try { go(v); } catch (e) { console.error(e); } }, v); await pg.waitForTimeout(250); await pg.evaluate(() => { $$('.mask').forEach(g => g.remove()); }); } };
  await walk('admin');
  // make a cashier + a sale by him
  await pg.evaluate(() => Sec.hash('1111').then(h => { Store.db.users.push({ id: 'c1', username: 'c1', name: 'كاشير', role: 'cashier', salt: h.salt, hash: h.hash, perms: (function(){ var o = ROLE_PRESETS.cashier(); delete o['sales.history']; delete o['pos.returnReq']; delete o['sales.days']; return o; })(), active: true }); Store.db.products.push({ id: 'p1', name: 'صنف', barcodes: ['111'], prices: [100, 0, 0, 0], cost: 50, stock: 10, active: true, cat: '' }); Store.reindex(); Store.save(); }));
  pg._at = 'dev'; await pg.evaluate(() => DevGate.enter('password')); await pg.waitForTimeout(800); await pg.screenshot({ path: OUT + '/dev.png' });
  console.log('dev cards:', await pg.evaluate(() => document.querySelectorAll('#view h3').length), 'top:', await pg.evaluate(() => [...document.querySelectorAll('#dvTop h3')].map(h => h.textContent).join(' | ')));
  await pg.check('#cpOn'); await pg.waitForTimeout(300); await pg.screenshot({ path: OUT + '/dev_top.png' });
  await pg.evaluate(() => { Store.saveNow(); App.user = null; Dev.unlocked = false; Gate.login(); }); await pg.waitForTimeout(800);
  await pg.selectOption('#lu', 'c1'); await pg.fill('#lp', '1111'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { $$('.mask').forEach(g => g.remove()); App.user.mustChange = false; });
  pg._at = 'cashier sale'; await pg.evaluate(() => { go('pos'); }); await pg.waitForTimeout(500);
  await pg.evaluate(() => { var p = Store.product('p1'); Sales.create({ type: 'sale', items: [{ pid: p.id, name: p.name, qty: 1, price: 100, cost: 50, base: 100 }], payments: { cash: 100 }, subtotal: 100, total: 100, discount: 0, vat: 0 }); });
  await pg.evaluate(() => { $$('.mask').forEach(g => g.remove()); go('sales'); }); await pg.waitForTimeout(600);
  console.log('cashier sees his invoices:', await pg.evaluate(() => document.querySelectorAll('#stb tr[data-id]').length), 'nav has sales:', await pg.evaluate(() => !!document.querySelector('.side [data-v="sales"], .side a[href*="sales"], .nav [data-v="sales"]') ));
  await pg.screenshot({ path: OUT + '/cashier_sales.png' });
  await pg.evaluate((ids) => Views.sales.open(Store.db.sales.slice(-1)[0])); await pg.waitForTimeout(400);
  console.log('cashier return btn:', await pg.evaluate(() => { var d = document.querySelector('.mask #dor'); return d && d.textContent; }), 'reprint:', await pg.evaluate(() => !!document.querySelector('.mask #rp')));
  await pg.evaluate(() => { $$('.mask').forEach(g => g.remove()); });
  await walk('cashier');
  console.log('ERRORS:', errs.length ? [...new Set(errs)].join('\n') : 'none'); await b.close();
})();
