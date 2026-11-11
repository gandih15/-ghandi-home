const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/tiba';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); S().invoice.paper = 'A4'; go('invoice'); }); await pg.waitForTimeout(900);
  await pg.selectOption('#lvT', 'bold'); await pg.waitForTimeout(400); await pg.fill('#lvF', '120'); await pg.waitForTimeout(300);
  console.log('follow:', await pg.evaluate(() => { var d = docCfg(); return [d.tpl.sale, d.tpl.quote, d.tpl.other, d.font].join(','); }));
  // print preview of a quotation and of a purchase-like doc shows the same design
  await pg.evaluate(() => Quote.print(Store.db.quotes[0])); await pg.waitForTimeout(600);
  console.log('preview quote tpl:', await pg.evaluate(() => document.querySelector('#dpT').value), 'font:', await pg.evaluate(() => document.querySelector('#dpFv').textContent));
  await pg.evaluate(() => { var s = document.querySelector('#dpFs'); s.value = 180; s.dispatchEvent(new Event('input')); }); await pg.waitForTimeout(300);
  await pg.click('.mask #pgFull'); await pg.waitForTimeout(300);
  await pg.screenshot({ path: OUT + '/30_preview.png' });
  console.log('saved from preview:', await pg.evaluate(() => { var d = docCfg(); return [d.font, d.margin].join(','); }));
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  await pg.evaluate(() => { A4.print(A4.head('فاتورة شراء', [['رقم', '1']]) + A4.foot(), 'other'); }); await pg.waitForTimeout(500);
  console.log('other doc tpl:', await pg.evaluate(() => document.querySelector('#dpT').value), await pg.evaluate(() => document.querySelector('#dpFv').textContent));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
