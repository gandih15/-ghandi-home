const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/p3'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); S().invoice.paper = 'A4'; go('invoice'); }); await pg.waitForTimeout(1200);
  await pg.screenshot({ path: OUT + '/01_editor_1366.png' });
  console.log('buttons visible:', await pg.evaluate(() => { var r = document.querySelector('#lvTest').getBoundingClientRect(); return r.bottom < innerHeight && r.top > 0; }), 'preview bottom in view:', await pg.evaluate(() => document.querySelector('#lvF2').getBoundingClientRect().bottom <= innerHeight));
  console.log('templates:', await pg.evaluate(() => document.querySelectorAll('#lvT option').length));
  for (const t of ['royal', 'sidebar', 'corporate', 'zebra', 'frame', 'soft', 'bold', 'gridline', 'centered', 'receipt']) { await pg.selectOption('#lvT', t); await pg.waitForTimeout(350); await pg.screenshot({ path: `${OUT}/t_${t}.png` }); }
  await pg.selectOption('#lvT', 'classic');
  await pg.fill('#opW', 'أصلي'); await pg.evaluate(() => { var i = document.querySelector('#opC'); i.value = '#8b1e3f'; i.dispatchEvent(new Event('input')); }); await pg.selectOption('#opF', '"Times New Roman"'); await pg.fill('#opL', '110'); await pg.check('#opB'); await pg.waitForTimeout(400);
  await pg.screenshot({ path: OUT + '/02_options.png' });
  console.log('css has color+exact:', await pg.evaluate(() => { var c = A4.css(); return c.includes('#8b1e3f') && c.includes('print-color-adjust:exact') && c.includes('أصلي'); }));
  // test documents
  const n0 = await pg.evaluate(() => [Store.db.sales.length, Store.db.customers.length, Store.db.seq.invoice].join(','));
  for (const k of ['sale', 'saleC', 'ret', 'quote']) { await pg.selectOption('#tdK', k); await pg.click('#tdGo'); await pg.waitForTimeout(600); await pg.screenshot({ path: `${OUT}/td_${k}.png` }); await pg.evaluate(() => { var ms = [...document.querySelectorAll('.mask')]; ms.forEach(m => Modal.close(m)); }); }
  console.log('nothing saved:', n0 === await pg.evaluate(() => [Store.db.sales.length, Store.db.customers.length, Store.db.seq.invoice].join(',')));
  await pg.evaluate(() => { S().invoice.paper = '80'; go('invoice'); }); await pg.waitForTimeout(600);
  console.log('thermal page test card:', await pg.evaluate(() => !!document.querySelector('#tdCard')));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
