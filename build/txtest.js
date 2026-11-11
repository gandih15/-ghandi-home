const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/tiba';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); S().invoice.paper = 'A4'; go('invoice'); }); await pg.waitForTimeout(1000);
  await pg.selectOption('#lvT', 'tiba'); await pg.waitForTimeout(600);
  await pg.fill('#txNew', 'البيع بسعر الجملة'); await pg.click('#txAdd'); await pg.waitForTimeout(700);
  const fr = pg.frameLocator('#lvF2');
  console.log('text on page:', await fr.locator('.ftx').count());
  const bx = await fr.locator('.ftx').boundingBox();
  await pg.mouse.move(bx.x + 10, bx.y + 5); await pg.mouse.down(); await pg.mouse.move(bx.x + 10 - 200, bx.y + 5 + 30, { steps: 6 }); await pg.mouse.up(); await pg.waitForTimeout(600);
  console.log('moved:', await pg.evaluate(() => JSON.stringify(docCfg().texts)));
  await pg.screenshot({ path: OUT + '/20_text.png' });
  // click without moving → edit dialog
  const bx2 = await fr.locator('.ftx').boundingBox(); await pg.mouse.click(bx2.x + 10, bx2.y + 5); await pg.waitForTimeout(400);
  console.log('edit dialog:', await pg.evaluate(() => !!document.querySelector('#txT')));
  await pg.fill('#txS', '22'); await pg.check('#txX'); await pg.click('#txOk'); await pg.waitForTimeout(500);
  await pg.screenshot({ path: OUT + '/21_text_edit.png' });
  // printed html includes it
  console.log('in print:', await pg.evaluate(() => { A4.kindNow = 'sale'; var h = A4.invoice(Store.db.sales.filter(s => s.type === 'sale').slice(-1)[0]); var c = A4.css(); A4.kindNow = null; return /البيع بسعر الجملة/.test(h) && /\.ftx\{position:absolute/.test(c); }));
  // quote has its own list
  await pg.click('#lvK [data-k="quote"]'); await pg.waitForTimeout(500);
  console.log('quote list empty:', await pg.evaluate(() => document.querySelectorAll('#txL [data-txe]').length === 0));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
