const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/tiba';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); S().invoice.paper = 'A4'; go('invoice'); }); await pg.waitForTimeout(1000);
  console.log('card:', await pg.evaluate(() => !!document.querySelector('#pgCard')));
  await pg.fill('[data-pg="width"]', '80'); await pg.click('#pgAl [data-al="right"]'); await pg.fill('[data-pg="scale"]', '90'); await pg.fill('[data-pg="t"]', '15'); await pg.waitForTimeout(600);
  await pg.evaluate(() => document.querySelector('#pgCard').scrollIntoView()); await pg.screenshot({ path: OUT + '/40_page_ctrl.png' });
  console.log('saved:', await pg.evaluate(() => JSON.stringify(docCfg().page)));
  const c = await pg.evaluate(() => { A4.kindNow = 'sale'; var c = A4.css(); A4.kindNow = null; return c; });
  console.log('@page:', /@page\{size:A4;margin:15mm 10mm 10mm 10mm\}/.test(c), 'width/align:', /\.a4\{width:80%!important;margin-left:auto/.test(c));
  // the scale goes to the printer
  console.log('scale sent:', await pg.evaluate(() => { var got = null, pp = IPC; window.IPC = { invoke: (n, o) => { got = o; return Promise.resolve({}); } }; var ie = IS_ELECTRON; try { IS_ELECTRON = true; } catch (e) {} return 'n/a'; }));
  await pg.evaluate(() => A4.printSale(Store.db.sales.filter(s => s.type === 'sale').slice(-1)[0])); await pg.waitForTimeout(700);
  console.log('preview card:', await pg.evaluate(() => !!document.querySelector('.mask #pgCard')));
  await pg.screenshot({ path: OUT + '/41_preview_ctrl.png' });
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
