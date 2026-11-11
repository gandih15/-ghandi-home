const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/tiba';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  console.log('all numbered:', await pg.evaluate(() => Store.db.products.every(p => p.code) + ' first=' + Store.db.products[0].code + ' max=' + ItemNo.max()));
  await pg.evaluate(() => go('products')); await pg.waitForTimeout(500);
  await pg.screenshot({ path: OUT + '/10_products.png' });
  // new product gets the next number; duplicate refused
  await pg.evaluate(() => Views.products.edit(null)); await pg.waitForTimeout(500);
  const nx = await pg.evaluate(() => document.querySelector('#fcode').value);
  await pg.fill('#fn', 'صنف جديد'); await pg.fill('#fst', '2'); await pg.fill('[data-pr="0"]', '100'); await pg.fill('#fcode', '5'); await pg.click('#fsave'); await pg.waitForTimeout(300);
  console.log('next:', nx, 'dup refused:', await pg.evaluate(() => !!document.querySelector('.mask #fsave')));
  await pg.fill('#fcode', nx); await pg.click('#fsave'); await pg.waitForTimeout(400); console.log('toasts:', await pg.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ')));
  console.log('saved code:', await pg.evaluate(() => { var p = Store.db.products.find(x => x.name === 'صنف جديد'); return p ? p.name + ' #' + p.code : 'NOT SAVED'; }));
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  // POS: type the number in the scanner
  await pg.evaluate(() => go('pos')); await pg.waitForTimeout(500);
  console.log('byCode:', await pg.evaluate(() => { var p = Store.byBarcode('3'); return p && p.code; }));
  // invoice shows short number
  console.log('invoice code col:', await pg.evaluate(() => { docCfg().show.colCode = true; A4.kindNow = 'sale'; var s = Store.db.sales.filter(x => x.type === 'sale').slice(-1)[0]; var h = A4.invoice(s); A4.kindNow = null; var p = Store.product(s.items[0].pid); return h.indexOf('>' + p.code + '<') > 0; }));
  const reuse = await pg.evaluate(() => { var p = Store.db.products.find(x => x.name === 'صنف جديد'); var c = p.code; Store.db.products = Store.db.products.filter(x => x !== p); Store.reindex(); Store.save(); var n = ItemNo.next(); return { deleted: c, next: n, refused: ItemNo.taken(c, null) }; });
  console.log('deleted number not reused:', JSON.stringify(reuse));
  await pg.evaluate(() => { devS().codeOn = false; Dev.unlocked = false; go('products'); }); await pg.waitForTimeout(400);
  console.log('off: chips', await pg.evaluate(() => document.querySelectorAll('#pt .ino').length), 'invoice col', await pg.evaluate(() => { docCfg().show.colCode = true; A4.kindNow = 'sale'; var h = A4.invoice(Store.db.sales.filter(x => x.type === 'sale').slice(-1)[0]); A4.kindNow = null; return /رقم الصنف/.test(h); }));
  await pg.evaluate(() => { devS().codeOn = true; go('products'); }); await pg.waitForTimeout(400); await pg.evaluate(() => { var b = [...document.querySelectorAll('#view button, #view a')].find(x => /فتح الكل/.test(x.textContent)); b && b.click(); }); await pg.waitForTimeout(500);
  console.log('on again: chips', await pg.evaluate(() => document.querySelectorAll('#pt .ino').length));
  await pg.evaluate(() => { devS().codeEdit = false; Views.products.edit(Store.db.products[0]); }); await pg.waitForTimeout(400);
  console.log('locked readonly:', await pg.evaluate(() => document.querySelector('#fcode').readOnly));
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); Dev.unlocked = true; go('dev'); }); await pg.waitForTimeout(500);
  console.log('dev card:', await pg.evaluate(() => !!document.querySelector('#dvTop #cdEd')));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
