// node build/suptest.js → supplier pages: list, page tabs, payment, manual entry, receive from supplier, prints
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); go('suppliers'); }); await pg.waitForTimeout(500);
  await pg.screenshot({ path: OUT + '/70_suppliers_list.png' });
  const bal0 = await pg.evaluate(() => Store.db.suppliers[0].balance);
  await pg.click('[data-s]'); await pg.waitForTimeout(400); await pg.screenshot({ path: OUT + '/71_supplier_stmt.png' });
  // pay 2000 from drawer
  await pg.click('#spPay'); await pg.waitForTimeout(300); await pg.fill('#spV', '2000'); await pg.fill('#spN', 'دفعة تحت الحساب'); await pg.uncheck('#spPr'); await pg.click('#spGo'); await pg.waitForTimeout(400);
  // manual invoice 1500
  await pg.click('#spMan'); await pg.waitForTimeout(300); await pg.fill('#smV', '1500'); await pg.fill('#smR', 'F-77'); await pg.fill('#smN', 'مصاريف نقل'); await pg.click('#smGo'); await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => { var s = Store.db.suppliers[0]; var R = Sup.statementRows(s, 0, 0); return { bal: s.balance, end: R.end, start: R.start, n: R.rows.length, exp: Views.shifts.calc(App.shift).supPaid }; });
  console.log('bal0', bal0, JSON.stringify(r));
  await pg.screenshot({ path: OUT + '/72_supplier_after.png' });
  for (const [t, n] of [['inv', 73], ['pay', 74], ['items', 75], ['notes', 76]]) { await pg.evaluate(t => { Views.suppliers.tab = t; go('suppliers'); }, t); await pg.waitForTimeout(350); if (t === 'notes') { await pg.fill('#snT', 'اتفقنا على خصم 3% لو الدفع كاش'); await pg.click('#snA'); await pg.waitForTimeout(200); } await pg.screenshot({ path: `${OUT}/${n}_supplier_${t}.png` }); }
  await pg.evaluate(() => { Views.suppliers.tab = 'inv'; go('suppliers'); }); await pg.waitForTimeout(300); await pg.click('[data-ip]'); await pg.waitForTimeout(300); await pg.screenshot({ path: OUT + '/77_supplier_invoice.png' });
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  // receive goods from the supplier page
  await pg.click('#spBuy'); await pg.waitForTimeout(500); const sel = await pg.evaluate(() => ($('#psup') || {}).value); await pg.screenshot({ path: OUT + '/78_receive_prefilled.png' }); console.log('receive supplier preselected:', sel);
  const docs = await pg.evaluate(() => { var out = [], pp = Printer.print; Printer.print = function (h, o) { out.push('<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>' + (o.css || '') + '</style></head><body>' + h + '</body></html>'); }; var s = Store.db.suppliers[0]; Sup.printStatement(s, null); Sup.printInvoice(s, Store.db.purchases.filter(p => p.supplier === s.id && p.items.length)[0]); Printer.print = pp; return out; });
  const p2 = await b.newPage({ viewport: { width: 794, height: 1123 } });
  for (const [i, n] of ['a4_sup_statement', 'a4_sup_invoice'].entries()) { await p2.setContent(docs[i]); await p2.waitForTimeout(150); await p2.screenshot({ path: `${OUT}/${n}.png`, fullPage: true }); }
  console.log('ERRORS:', errs.join('\n') || 'none'); await b.close();
})();
