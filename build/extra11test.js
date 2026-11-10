// node build/extra11test.js → tests the 1.1 features (notes, serials, collector, commissions, packages, supplier instalments)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  const close = () => pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  const go = async v => { await close(); await pg.evaluate(v => go(v), v); await pg.waitForTimeout(500); };
  const shot = n => pg.screenshot({ path: `${OUT}/${n}.png` });
  const step = async (n, f) => { try { await f(); } catch (e) { errs.push('STEP ' + n + ': ' + e.message); } };
  await close(); await go('dashboard'); await shot('50_dashboard_11');
  // serial at POS + rep
  await go('pos');
  await step('serial', async () => {
    await pg.selectOption('#xRep', { index: 2 });
    const bc = await pg.evaluate(() => Store.db.products[1].barcodes[0]); await pg.fill('#scan', bc); await pg.press('#scan', 'Enter'); await pg.waitForTimeout(400);
    await pg.fill('[data-sn]', 'ZN7-2026-00981'); await shot('51_serial_prompt'); await pg.click('#snGo'); await pg.waitForTimeout(200); await shot('52_pos_serial');
    await pg.keyboard.press('F4'); await pg.waitForTimeout(400); await pg.click('#done'); await pg.waitForTimeout(700);
  });
  console.log('sale', await pg.evaluate(() => { var s = Store.db.sales[Store.db.sales.length - 1]; return JSON.stringify({ no: s.no, serial: s.items[0].serial, rep: s.rep }); }));
  await close();
  await go('warranty'); await pg.fill('#wQ', '00981'); await pg.click('#wGo'); await pg.waitForTimeout(300); await shot('53_warranty_serial');
  // notes
  await step('notes', async () => { await go('installments'); await pg.evaluate(() => Views.installments.open(Store.db.inst[0])); await pg.waitForTimeout(400); await pg.click('text=كمبيالات / إيصال أمانة'); await pg.waitForTimeout(300); await shot('54_notes_menu'); });
  await close();
  await step('collector', async () => { await go('installments'); await shot('55_inst_with_collector'); });
  // packages
  await step('pk', async () => { await pg.evaluate(() => { Views.brides.tab = 'pk'; }); await go('brides'); await shot('56_packages'); await pg.evaluate(() => { Views.brides.tab = 'open'; Views.brides.open(Store.db.brides[1]); }); await pg.waitForTimeout(300); await pg.click('#boPk'); await pg.waitForTimeout(200); await pg.click('[data-k="0"]'); await pg.waitForTimeout(500); await shot('57_bride_with_pkg'); });
  console.log('pkg', await pg.evaluate(() => { var b = Store.db.brides[1]; var t = b.items.filter(i => i.pkg === 'k1').reduce((a, i) => a + i.qty * i.price, 0); return 'pkg total=' + Math.round(t * 100) / 100; }));
  await go('commissions'); await shot('58_commissions');
  await go('supinst'); await shot('59_supinst');
  await step('suppay', async () => { await pg.click('[data-yp]'); await pg.waitForTimeout(300); await pg.click('#hcGo'); await pg.waitForTimeout(400); });
  console.log('sup', await pg.evaluate(() => { var x = Store.db.supInst[0]; return SupInst.rem(x) + ' bal=' + Store.db.suppliers[0].balance; }));
  // docs
  const docs = await pg.evaluate(() => { var out = []; var pp = Printer.print; Printer.print = function (h, o) { out.push('<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>' + (o.css || '') + '</style></head><body>' + h + '</body></html>'); }; Notes.print(Store.db.inst[0], 'rem'); Notes.trust(Store.db.inst[0]); A4.printSale(Store.db.sales[Store.db.sales.length - 1]); Printer.print = pp; return out; });
  const p2 = await b.newPage({ viewport: { width: 794, height: 1123 } });
  for (const [i, n] of ['a4_notes', 'a4_trust', 'a4_invoice_serial'].entries()) { await p2.setContent(docs[i]); await p2.waitForTimeout(150); await p2.screenshot({ path: `${OUT}/${n}.png`, fullPage: true }); }
  await p2.close(); const p3 = await b.newPage(); await p3.setContent(docs[0]); await p3.pdf({ path: `${OUT}/a4_notes.pdf`, format: 'A4' }); console.log('notes pages ok');
  console.log('ERRORS:', errs.length ? '\n' + errs.join('\n') : 'none'); await b.close();
})();
