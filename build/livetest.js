// node build/livetest.js → 1.6: live invoice editor + retail >= cost rule
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/live'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  const close = () => pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  await close();
  const ftxt = () => pg.evaluate(() => document.querySelector('#lvF2').contentDocument.body.innerText);
  await pg.evaluate(() => DocSet.open()); await pg.waitForTimeout(900);
  await pg.screenshot({ path: OUT + '/01_editor.png' });
  let t = await ftxt(); console.log('preview has invoice title:', /فاتورة بيع/.test(t));
  await pg.fill('[data-lb="saleTitle"]', 'فاتورة مبيعات'); await pg.waitForTimeout(300);
  t = await ftxt(); console.log('live rename:', /فاتورة مبيعات/.test(t));
  await pg.uncheck('[data-sh="mMobile"]'); await pg.waitForTimeout(300);
  t = await ftxt(); console.log('mobile hidden live:', !/الموبايل/.test(t));
  // click on a label inside the page
  const fr = pg.frameLocator('#lvF2');
  await fr.locator('[data-dk="lbl:colQty"]').click(); await pg.waitForTimeout(300);
  await pg.screenshot({ path: OUT + '/02_click_edit.png' });
  await pg.fill('#pkL', 'العدد'); await pg.click('#pkS'); await pg.waitForTimeout(300);
  t = await ftxt(); console.log('click-rename column:', /العدد/.test(t));
  await fr.locator('[data-dk="show:words"]').first().click(); await pg.waitForTimeout(300); await pg.click('.mask:last-child [data-y], .mask:last-child .btn.pri'); await pg.waitForTimeout(300);
  console.log('words hidden:', await pg.evaluate(() => !document.querySelector('[data-sh="words"]').checked));
  // terms line add + delete via page
  await pg.fill('#lvTa', 'البضاعة المباعة لا ترد بعد 14 يوم'); await pg.click('#lvTb'); await pg.waitForTimeout(300);
  t = await ftxt(); console.log('added line live:', /لا ترد بعد 14/.test(t));
  await fr.locator('[data-dk^="term:sale"]').last().click(); await pg.waitForTimeout(300); await pg.click('#pkD'); await pg.waitForTimeout(300);
  t = await ftxt(); console.log('deleted line live:', !/لا ترد بعد 14/.test(t));
  await pg.click('#lvK [data-k="quote"]'); await pg.waitForTimeout(400); t = await ftxt(); console.log('quote preview:', /عرض سعر/.test(t));
  await pg.screenshot({ path: OUT + '/03_quote.png' });
  await pg.click('#lvGo'); await pg.waitForTimeout(300);
  await pg.evaluate(() => A4.printSale(Store.db.sales.filter(s => s.type === 'sale').slice(-1)[0])); await pg.waitForTimeout(700);
  const real = await pg.evaluate(() => document.querySelector('#dpF').contentDocument.body.innerText);
  console.log('saved in real print:', /فاتورة مبيعات/.test(real), /العدد/.test(real), !/الموبايل/.test(real));
  await pg.screenshot({ path: OUT + '/04_real_print.png' }); await close();
  // ---- price guard
  await pg.evaluate(() => { Dev.unlocked = true; go('dev'); }); await pg.waitForTimeout(600);
  await pg.evaluate(() => document.querySelector('#pgOn').scrollIntoView()); await pg.check('#pgOn'); await pg.waitForTimeout(200);
  await pg.screenshot({ path: OUT + '/05_dev_rule.png' });
  console.log('rule on:', await pg.evaluate(() => PriceGuard.on()));
  await pg.evaluate(() => { go('products'); Views.products.edit(null); }); await pg.waitForTimeout(600);
  await pg.fill('#fn', 'صنف اختبار'); await pg.fill('#fst', '3'); await pg.fill('#fcost', '500'); await pg.fill('[data-pr="0"]', '400'); await pg.waitForTimeout(200);
  const n0 = await pg.evaluate(() => Store.db.products.length);
  await pg.click('#fsave'); await pg.waitForTimeout(400);
  await pg.screenshot({ path: OUT + '/06_blocked.png' });
  console.log('blocked save:', await pg.evaluate(n => Store.db.products.length === n, n0), 'toast:', await pg.evaluate(() => [...document.querySelectorAll('.toast')].map(x => x.textContent).join('|').slice(0, 120)));
  await pg.fill('[data-pr="0"]', '500'); await pg.click('#fsave'); await pg.waitForTimeout(400);
  console.log('equal ok:', await pg.evaluate(n => Store.db.products.length === n + 1, n0));
  await close();
  // bulk lowering below cost
  const bulk = await pg.evaluate(() => { var p = Store.db.products.filter(x => x.name === 'صنف اختبار')[0]; return PriceGuard.bad([450, 0, 0, 0], p.cost) ? 'blocked' : 'passed'; });
  console.log('bulk check:', bulk);
  await pg.evaluate(() => { devS().minPrice = false; }); console.log('off allows:', await pg.evaluate(() => PriceGuard.bad([1], 500) === null));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
