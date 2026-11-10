const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const D = '/home/claude/ghandi/build/shots/extra/', shot = n => pg.screenshot({ path: D + n + '.png' }), ev = (f, a) => pg.evaluate(f, a), W = t => pg.waitForTimeout(t || 300), ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await W(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await W(1200); await ev(() => Modal.close());
  const go = async v => { await ev(v => go(v), v); await W(450); };
  await go('pos');
  const bc = await ev(() => { var promo = Store.db.products.find(p => p.stock > 3 && Promo.price(p, 0).base > Promo.price(p, 0).price); var other = Store.db.products.find(p => p.stock > 3 && p !== promo && !(Promo.price(p, 0).base > Promo.price(p, 0).price)); return [promo.barcodes[0], other.barcodes[0]]; });
  for (const c of bc) { await pg.fill('#scan', c); await pg.press('#scan', 'Enter'); await W(80); }
  await ev(() => { App.cart.disc = { type: 'amt', v: 10 }; App.cart.discount = 10; Views.pos.draw(); });
  await ev(() => Views.pos.pay()); await W(300); await pg.click('#done'); await W(700);
  ok(await pg.$('.rpop .receipt') && await pg.$('#rpP'), 'invoice pops up after the sale with a Print button'); await shot('20_receipt_popup');
  const s = await ev(() => { var s = Store.db.sales[Store.db.sales.length - 1]; return saleDisc(s); }); console.log(JSON.stringify(s)); ok(s.promo > 0, 'discount captured (offer)');
  await pg.keyboard.press('Enter'); await W(300); ok(!(await pg.$('.rpop')), 'Enter closes it, back to selling');
  await go('sales'); ok(await ev(() => [...document.querySelectorAll('#stb th')].some(t => /الخصم/.test(t.textContent))), 'discount column in invoices list'); await shot('21_sales_discount_col');
  ok(await ev(() => /إجمالي الخصومات/.test(document.getElementById('ssum').textContent)), 'total discounts chip');
  await ev(() => { Views.reports.tab = 'disc'; }); await go('reports'); ok(await ev(() => document.querySelectorAll('#rBody tr').length > 2), 'discount report by product'); await shot('22_report_discounts');
  await ev(() => DevGate.enter('t')); await W(500);
  const before = await ev(() => Store.db.sales.length);
  await ev(() => { var a = new Date(Date.now() - 30 * 864e5), z = new Date(Date.now() - 10 * 864e5); document.getElementById('pgA').value = U.today(a); document.getElementById('pgB').value = U.today(z); document.getElementById('pgB').onchange(); document.getElementById('pgB').scrollIntoView(); }); await W(200); await shot('23_dev_purge');
  await pg.click('#pgGo'); await W(300); await pg.fill('#pgW', 'حذف'); await pg.click('#pgY'); await W(1200);
  const after = await ev(() => [Store.db.sales.length, Store.db.sales.filter(s => s.date < Date.now() - 9 * 864e5).length]);
  ok(after[0] < before && after[1] === 0, 'purged old invoices ' + before + ' → ' + after[0]);
  console.log(errs.length ? errs.join('\n') : 'NO PAGE ERRORS'); await b.close();
})();
