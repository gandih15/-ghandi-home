// node build/hometest.js  → clicks through every home-edition screen in the browser preview and saves screenshots
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = process.env.SHOTS || '/home/claude/ghandi-home/build/shots';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  const shot = async n => pg.screenshot({ path: `${OUT}/${n}.png` });
  await shot('00_login');
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  const go = async v => { await pg.evaluate(v => { while (document.querySelector('.mask')) Modal.close(); go(v); }, v); await pg.waitForTimeout(600); };
  const step = async (name, fn) => { try { await fn(); } catch (e) { errs.push('STEP ' + name + ': ' + e.message); } };
  await go('dashboard'); await shot('01_dashboard');
  // POS: measured carpet + fridge, then instalments
  await go('pos');
  await step('pos-meas', async () => {
    const bc = await pg.evaluate(() => Store.db.products.filter(p => p.sellBy === 'm2')[0].barcodes[0]);
    await pg.fill('#scan', bc); await pg.press('#scan', 'Enter'); await pg.waitForTimeout(300);
    await pg.fill('#mL', '3.5'); await pg.fill('#mW', '4'); await pg.waitForTimeout(200); await shot('02_pos_measure'); await pg.click('#mGo'); await pg.waitForTimeout(200);
    const bc2 = await pg.evaluate(() => Store.db.products[0].barcodes[0]); await pg.fill('#scan', bc2); await pg.press('#scan', 'Enter'); await pg.waitForTimeout(300);
    await shot('03_pos_cart');
  });
  await step('inst-form', async () => {
    await pg.click('#xInst'); await pg.waitForTimeout(400);
    await pg.fill('[data-cph]', '01277778888'); await pg.fill('[data-cnm]', 'رامي عادل'); await pg.fill('#iNid', '29001011234567'); await pg.fill('#iAdr', 'بني سويف — شارع الثورة');
    await pg.fill('[data-g="0"][data-k="name"]', 'عادل رمضان'); await pg.fill('[data-g="0"][data-k="phone"]', '01011112222');
    await pg.fill('#iMon', '10'); await pg.dispatchEvent('#iMon', 'input'); await pg.waitForTimeout(200); await shot('04_inst_form');
    await pg.uncheck('#iPrn'); await pg.click('#iGo'); await pg.waitForTimeout(600);
  });
  const ic = await pg.evaluate(() => { var c = Store.db.inst[Store.db.inst.length - 1]; var s = Store.db.sales[Store.db.sales.length - 1]; return { no: c.no, total: c.instTotal, sched: c.schedule.length, first: c.schedule[0].amount, last: c.schedule[c.schedule.length-1].amount, sum: c.schedule.reduce((a,x)=>a+x.amount,0), sale: s.no, pays: s.payments, instNo: s.instNo, stock: Store.db.products[0].stock }; });
  console.log('contract', JSON.stringify(ic));
  await go('installments'); await shot('05_installments_due');
  await pg.evaluate(() => { Views.installments.tab = 'open'; go('installments'); }); await pg.waitForTimeout(400); await shot('06_installments_open');
  await step('inst-open', async () => { await pg.evaluate(() => Views.installments.open(Store.db.inst[0])); await pg.waitForTimeout(400); await shot('07_inst_detail'); });
  await step('inst-collect', async () => { await pg.click('#icPay'); await pg.waitForTimeout(400); await shot('08_inst_collect'); await pg.click('#hcGo'); await pg.waitForTimeout(500); });
  console.log('after collect', await pg.evaluate(() => { var c = Store.db.inst[0]; return Inst.remaining(c) + ' paidN=' + c.schedule.filter(s => s.paid >= s.amount).length + ' pays=' + c.pays.length; }));
  await pg.evaluate(() => { Views.installments.tab = 'rep'; go('installments'); }); await pg.waitForTimeout(400); await shot('09_inst_report');
  // brides
  await go('brides'); await shot('10_brides');
  await step('bride-open', async () => { await pg.evaluate(() => Views.brides.open(Store.db.brides[0])); await pg.waitForTimeout(500); await shot('11_bride_file'); });
  await step('bride-deliver', async () => {
    await pg.evaluate(() => { document.querySelector('[data-sel="bi1"]').click(); document.querySelector('[data-sel="bi2"]').click(); }); await pg.click('#boD'); await pg.waitForTimeout(400); await shot('12_bride_deliver');
    const btn = await pg.$('#hcGo'); if (btn) { await btn.click(); } else { await pg.click('.mask:last-child [data-y]'); } await pg.waitForTimeout(600);
  });
  console.log('bride', await pg.evaluate(() => { var b = Store.db.brides[0]; var s = Store.db.sales[Store.db.sales.length - 1]; return JSON.stringify({ used: b.used, st: b.items.map(i => i.status).join(','), sale: s.no, pays: s.payments, credit: s.credit, fridge: Store.db.products[0].stock }); }));
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  // orders
  await go('orders'); await shot('13_orders');
  await step('order-edit', async () => { await pg.evaluate(() => Ord.edit(Store.db.orders[0])); await pg.waitForTimeout(500); await shot('14_order_edit'); await pg.evaluate(() => Modal.close()); });
  await step('order-new', async () => { await pg.evaluate(() => Ord.edit(null)); await pg.waitForTimeout(400); await pg.fill('[data-cph]', '01001234567'); await pg.dispatchEvent('[data-cph]', 'input'); await pg.fill('[data-r="0"][data-k="w"]', '4'); await pg.dispatchEvent('[data-r="0"][data-k="w"]', 'change'); await pg.fill('[data-r="0"][data-k="fabricPrice"]', '200'); await pg.dispatchEvent('[data-r="0"][data-k="fabricPrice"]', 'change'); await pg.waitForTimeout(200); await shot('15_order_new'); await pg.click('#oGo'); await pg.waitForTimeout(400); });
  console.log('order new', await pg.evaluate(() => { var o = Store.db.orders[Store.db.orders.length - 1]; return o.no + ' fabricM=' + o.rooms[0].fabricM + ' total=' + Ord.total(o); }));
  await step('order-open', async () => { await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); Views.orders.open(Store.db.orders[1]); }); await pg.waitForTimeout(400); await shot('16_order_detail'); await pg.click('#ooInv'); await pg.waitForTimeout(400); await shot('17_order_invoice'); await pg.click('#hcGo'); await pg.waitForTimeout(600); });
  console.log('order inv', await pg.evaluate(() => { var o = Store.db.orders[1], s = Store.db.sales[Store.db.sales.length - 1]; return o.status + ' sale#' + o.saleNo + ' ' + JSON.stringify(s.payments) + ' items=' + s.items.map(i => i.name + ':' + i.qty).join(' | '); }));
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  await go('deliveries'); await shot('18_deliveries');
  await go('quotes'); await shot('19_quotes');
  await step('quote-load', async () => { await pg.click('[data-l]'); await pg.waitForTimeout(500); await shot('20_quote_in_pos'); });
  await pg.evaluate(() => { App.cart = newCart(); });
  await go('warehouses'); await shot('21_warehouses');
  await step('transfer', async () => { await pg.click('#whNew'); await pg.waitForTimeout(300); await pg.fill('#tP', 'غسالة'); await pg.waitForTimeout(300); await pg.press('#tP', 'Enter'); await pg.waitForTimeout(200); await shot('22_transfer'); await pg.click('#tGo'); await pg.waitForTimeout(500); });
  console.log('wh', await pg.evaluate(() => { var p = Store.db.products.filter(x => /غسالة/.test(x.name))[0]; return JSON.stringify(p.wh) + ' stock=' + p.stock; }));
  await go('warranty'); await pg.fill('#wQ', '01001234567'); await pg.click('#wGo'); await pg.waitForTimeout(300); await shot('23_warranty');
  // A4 invoice preview
  await step('a4', async () => { await go('sales'); await pg.evaluate(() => { var s = Store.db.sales.filter(x => x.instNo)[0] || Store.db.sales[Store.db.sales.length - 1]; Views.sales.open(s); }); await pg.waitForTimeout(500); await shot('24_invoice_a4'); });
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  await go('settings'); await pg.evaluate(() => { var c = [...document.querySelectorAll('#view .card')].filter(x => /إعدادات المعرض/.test(x.textContent))[0]; c && c.scrollIntoView(); }); await pg.waitForTimeout(300); await shot('25_settings_home');
  await go('users'); await pg.waitForTimeout(300); await pg.evaluate(() => { var b = document.querySelector('[data-edit],[data-u]'); b && b.click(); }); await pg.waitForTimeout(400); await shot('26_users');
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); });
  await go('prices'); await shot('27_bulk_prices');
  await go('backup'); await shot('28_backup');
  await go('shifts'); await shot('29_shifts');
  await go('customers'); await pg.evaluate(() => { Views.customers.cur = 'c1'; go('customers'); }); await pg.waitForTimeout(400); await shot('30_customer');
  await go('products'); await pg.evaluate(() => Views.products.edit(Store.db.products.filter(p => p.sellBy === 'm2')[0])); await pg.waitForTimeout(400); await shot('31_product_form');
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); S().lang = 'en'; Shell.render(); go('installments'); }); await pg.waitForTimeout(400); await shot('32_en_installments');
  await pg.evaluate(() => { S().lang = 'ar'; Shell.render(); go('dashboard'); });
  console.log('ERRORS:', errs.length ? '\n' + errs.join('\n') : 'none');
  await b.close();
})();
