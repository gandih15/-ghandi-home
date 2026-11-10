const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await br.newPage({ viewport: { width: 760, height: 760 } });
  pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(800);
  await pg.evaluate(() => { go('pos'); ['p4', 'p23', 'p1'].forEach(id => Views.pos.add(Store.product(id))); const t = Views.pos.totals(); const s = Sales.create({ type: 'sale', items: App.cart.items, tier: 0, subtotal: t.sub, discount: 0, total: t.total, payments: { cash: t.total }, paid: t.total }); 
    Views.labels.queue = [{ pid: 'p23', qty: 1, code: Store.product('p23').barcodes[0] }];
    document.body.innerHTML = '<div style="display:flex;gap:30px;padding:20px;background:#eee;align-items:flex-start"><div class="receipt">' + Receipt.html(s) + '</div><div style="transform:scale(2);transform-origin:top left">' + Views.labels.one(Store.product('p23'), Store.product('p23').barcodes[0], Object.assign({}, S().label, { w: 50, h: 30 })) + '</div></div>'; });
  await pg.waitForTimeout(300); await pg.screenshot({ path: '/home/claude/ghandi/build/shots/25_receipt_label_promo.png' });
  await br.close();
})();
