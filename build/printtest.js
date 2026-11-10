// node build/printtest.js → print preview, 6 document designs, wording/terms settings, developer reset tools
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/print'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  const close = () => pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  await close();
  // quotation preview (wording: العميل instead of السادة, customer & manager names under signatures)
  await pg.evaluate(() => { Quote.print(Store.db.quotes[0]); }); await pg.waitForTimeout(700); await pg.screenshot({ path: OUT + '/01_preview_quote.png' });
  const qtxt = await pg.evaluate(() => document.querySelector('#dpF').contentDocument.body.innerText);
  console.log('quote has العميل:', /العميل/.test(qtxt), 'has السادة:', /السادة/.test(qtxt), 'manager name:', /أ\. حسن النور/.test(qtxt), 'customer name under sign:', /م\. وليد/.test(qtxt));
  // switch template in preview
  for (const t of ['modern', 'minimal', 'boxed', 'elegant', 'compact']) { await pg.selectOption('#dpT', t); await pg.waitForTimeout(400); await pg.screenshot({ path: `${OUT}/02_preview_${t}.png` }); }
  await close();
  // sale invoice preview
  await pg.evaluate(() => A4.printSale(Store.db.sales.filter(s => s.customer && s.type === 'sale').slice(-1)[0])); await pg.waitForTimeout(700); await pg.screenshot({ path: OUT + '/03_preview_sale.png' });
  await close();
  // settings dialog: edit wording + add/hide a line
  await pg.evaluate(() => go('settings')); await pg.waitForTimeout(500);
  await pg.click('#dsOpen'); await pg.waitForTimeout(500);
  await pg.fill('[data-lb="to"]', 'اسم العميل'); await pg.fill('[data-ta="quote"]', 'الأسعار شاملة التوصيل داخل المدينة'); await pg.click('[data-tb="quote"]'); await pg.uncheck('[data-to="quote:1"]');
  await pg.screenshot({ path: OUT + '/04_settings_dialog.png' }); await pg.click('#dsGo'); await pg.waitForTimeout(300);
  await pg.evaluate(() => { Quote.print(Store.db.quotes[0]); }); await pg.waitForTimeout(600);
  const q2 = await pg.evaluate(() => document.querySelector('#dpF').contentDocument.body.innerText);
  console.log('custom label:', /اسم العميل/.test(q2), 'added line:', /شاملة التوصيل/.test(q2), 'hidden line gone:', !/متاح التقسيط/.test(q2));
  await pg.screenshot({ path: OUT + '/05_preview_after_settings.png' }); await close();
  // developer reset tools
  await pg.evaluate(() => { Dev.unlocked = true; go('dev'); }); await pg.waitForTimeout(600);
  await pg.evaluate(() => { var c = [...document.querySelectorAll('h3')].filter(h => /تصفير/.test(h.textContent))[0]; c && c.scrollIntoView(); }); await pg.waitForTimeout(300); await pg.screenshot({ path: OUT + '/06_dev_reset.png' });
  const before = await pg.evaluate(() => ({ sales: Store.db.sales.length, products: Store.db.products.length, cats: S().categories.length, cust: Store.db.customers.length, shop: S().shopName }));
  await pg.click('#rsData'); await pg.waitForTimeout(300); await pg.fill('#rsW', 'مسح'); await pg.screenshot({ path: OUT + '/07_reset_confirm.png' }); await pg.click('#rsGo'); await pg.waitForTimeout(800);
  const after = await pg.evaluate(() => ({ sales: Store.db.sales.length, products: Store.db.products.length, cats: S().categories.length, cust: Store.db.customers.length, custBal: Store.db.customers.reduce((a, c) => a + (c.balance || 0), 0), inst: Store.db.inst.length, invSeq: Store.db.seq.invoice, shop: S().shopName }));
  console.log('before', JSON.stringify(before)); console.log('after ', JSON.stringify(after));
  // settings reset keeps shop info
  await pg.evaluate(() => { S().design = 'neon'; homeCfg().instRate = 9; }); 
  const sr = await pg.evaluate(() => { var r = location.reload; try { Reset.settings({ shop: true, backup: true, printers: true, cats: true, tiers: true }); } catch (e) { return 'ERR ' + e.message; } return JSON.stringify({ shop: S().shopName, design: S().design || null, rate: homeCfg().instRate, cats: S().categories.length, dev: !!S().dev }); });
  console.log('settings reset:', sr);
  await pg.waitForTimeout(1500);
  console.log('ERRORS:', errs.join('\n') || 'none'); await b.close();
})();
