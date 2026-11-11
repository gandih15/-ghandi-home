const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/tiba'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); S().phones = [{ n: 'ا/ محمد', p: '01025860494', on: true }, { n: 'ا/ شعبان', p: '01286798899', on: true }];
    // a logo like the paper
    var c = document.createElement('canvas'); c.width = 260; c.height = 140; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 260, 140); x.fillStyle = '#222'; x.font = 'bold 64px Arial'; x.fillText('TIBA', 30, 110); x.beginPath(); x.moveTo(60, 50); x.lineTo(130, 10); x.lineTo(200, 50); x.lineWidth = 8; x.stroke(); S().logo = c.toDataURL();
    S().invoice.paper = 'A4'; go('invoice'); });
  await pg.waitForTimeout(1000);
  await pg.selectOption('#lvT', 'tiba'); await pg.waitForTimeout(800);
  await pg.screenshot({ path: OUT + '/01_tiba.png' });
  // full page render of the document itself
  const doc = await pg.evaluate(() => { A4.kindNow = 'sale'; var s = Store.db.sales.filter(s => s.type === 'sale' && s.items.length > 1).slice(-1)[0]; var h = A4.invoice(s); var c = A4.css(); A4.kindNow = null; return '<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>' + c.replace(/@page\{[^}]*\}/, '') + 'body{width:190mm;margin:10mm auto}</style></head><body>' + h + '</body></html>'; });
  const p2 = await b.newPage({ viewport: { width: 860, height: 1100 } }); await p2.setContent(doc); await p2.waitForTimeout(300); await p2.screenshot({ path: OUT + '/02_tiba_page.png', fullPage: true });
  // free mode: drag the logo, wheel to scale
  await pg.check('#fxOn'); await pg.waitForTimeout(700);
  const fr = pg.frameLocator('#lvF2');
  const box = await fr.locator('.tb-logo img').boundingBox();
  await pg.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await pg.mouse.down(); await pg.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 40, { steps: 6 }); await pg.mouse.up(); await pg.waitForTimeout(600);
  const box2 = await fr.locator('.tb-band').boundingBox();
  await pg.mouse.click(box2.x + 30, box2.y + 8); await pg.waitForTimeout(200); await pg.mouse.wheel(0, -300); await pg.waitForTimeout(800);
  console.log('free map:', await pg.evaluate(() => JSON.stringify(docCfg().free)), 'sel:', await pg.evaluate(() => document.querySelector('#fxName').textContent));
  await pg.screenshot({ path: OUT + '/03_free.png' });
  console.log('print css has transform:', await pg.evaluate(() => { A4.kindNow = 'sale'; var c = A4.css(); A4.kindNow = null; return /\.tb-logo\{transform:translate\(/.test(c); }));
  // quote in tiba too
  await pg.click('#lvK [data-k="quote"]'); await pg.waitForTimeout(400); await pg.selectOption('#lvT', 'tiba'); await pg.waitForTimeout(600); await pg.screenshot({ path: OUT + '/04_quote.png' });
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
