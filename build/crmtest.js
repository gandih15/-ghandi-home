const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const D = '/home/claude/ghandi/build/shots/crm/';
  const shot = n => pg.screenshot({ path: D + n + '.png' });
  const ev = (f, a) => pg.evaluate(f, a);
  const W = t => pg.waitForTimeout(t || 300);
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); };
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await W(2500);
  await pg.evaluate(() => { ReceiptPop.show = function () { }; }); await pg.fill('#lp', '1234'); await pg.click('#lb'); await W(1200);
  await ev(() => Modal.close()); // what's-new on first run?
  const go = async v => { await ev(v => go(v), v); await W(450); };
  // 1) POS new customer by phone
  await go('pos');
  ok(await pg.$('#cbPhone'), 'phone box shown in POS');
  await pg.fill('#cbPhone', '01099998888'); await W(200);
  ok(await ev(() => App.cart.newCust && App.cart.newCust.phone === '01099998888'), 'unknown number → new customer pending');
  await pg.fill('#cbName', 'رنا جديدة');
  const bc = await ev(() => [Store.db.products[1].barcodes[0], Store.db.products[4].barcodes[0], Store.db.products[7].barcodes[0]]);
  for (const c of bc) { await pg.fill('#scan', c); await pg.press('#scan', 'Enter'); await W(60); }
  await shot('01_pos_new_customer');
  await pg.keyboard.press('F4'); await W(400);
  await pg.fill('#cpIn', 'eid20'); await pg.click('#cpGo'); await W(200);
  const cpMsg = await pg.textContent('#cpMsg'); ok(/✅/.test(cpMsg), 'coupon EID20 applied: ' + cpMsg);
  await shot('02_checkout_coupon');
  await pg.click('#done'); await W(600);
  const nc = await ev(() => { var c = Cust.byPhone('01099998888'); var s = Store.db.sales[Store.db.sales.length - 1]; return c && { name: c.name, pts: c.points, ledger: c.pts.map(p => p.r + p.d), sCust: s.customer === c.id, coupon: s.coupon, disc: s.disc, earned: s.ptsEarned, total: s.total }; });
  console.log(JSON.stringify(nc)); ok(nc && nc.sCust && nc.name === 'رنا جديدة' && nc.coupon === 'EID20' && nc.pts === 20 + nc.earned, 'auto-registered + welcome + earned points + coupon');
  // 2) known customer, redeem points
  await pg.fill('#cbPhone', '01001234567'); await W(250);
  ok(await ev(() => App.cart.customer === 'c1'), 'known number attaches customer');
  for (const c of bc.slice(0, 2)) { await pg.fill('#scan', c); await pg.press('#scan', 'Enter'); await W(60); }
  await shot('03_pos_known_customer');
  const before = await ev(() => Cust.get('c1').points);
  await pg.keyboard.press('F4'); await W(400);
  await pg.click('#ptsMax'); await W(200); await shot('04_checkout_points');
  const used = await ev(() => +document.getElementById('ptsIn').value);
  await pg.click('#done'); await W(600);
  const after = await ev(() => { var s = Store.db.sales[Store.db.sales.length - 1]; return { pts: Cust.get('c1').points, red: s.ptsRedeemed, earned: s.ptsEarned, disc: s.discount, total: s.total }; });
  console.log(before, used, JSON.stringify(after)); ok(after.red === used && after.pts === before - used + after.earned, 'points redeemed and earned correctly');
  // 3) gift card: sell then pay with it
  await ev(() => { App.cart = newCart(); App.cart.items.push({ pid: null, name: 'كارت هدية 300', qty: 1, price: 300, cost: 0, gift: 'GCTEST0001', manual: true }); Views.pos.draw(); });
  await ev(() => Views.pos.pay()); await W(300); await pg.click('#done'); await W(500);
  ok(await ev(() => GiftCards.find('GCTEST0001') && GiftCards.find('GCTEST0001').balance === 300), 'gift card issued');
  for (const c of bc) { await pg.fill('#scan', c); await pg.press('#scan', 'Enter'); await W(60); }
  await ev(() => Views.pos.pay()); await W(300); await pg.fill('#gcIn', 'gctest0001'); await pg.click('#gcGo'); await W(200); await shot('05_checkout_giftcard');
  await pg.click('#done'); await W(500);
  ok(await ev(() => { var g = GiftCards.find('GCTEST0001'); var s = Store.db.sales[Store.db.sales.length - 1]; return g.balance === U.r2(300 - s.payments.gift) && s.payments.gift > 0; }), 'gift card charged');
  // 4) layaway
  await pg.fill('#cbPhone', '01223334445'); await W(200);
  for (const c of bc.slice(0, 2)) { await pg.fill('#scan', c); await pg.press('#scan', 'Enter'); await W(60); }
  const stk = await ev(() => Store.product('p2').stock);
  await pg.click('#xLay'); await W(300); await shot('06_layaway_new'); await pg.click('#lyGo'); await W(500);
  const ly = await ev(s => [Store.db.products[1].id, s, Store.product('p2').stock, Store.db.layaways.length, JSON.stringify(Store.db.layaways[1] && Store.db.layaways[1].items.map(i => i.pid + ':' + i.qty))], stk); ok(ly[2] === ly[1] - 1 && ly[3] === 2, 'layaway reserves stock ' + ly);
  await go('layaway'); await shot('07_layaways');
  await ev(() => Views.layaway.open(Store.db.layaways[1], document.getElementById('view'))); await W(300); await shot('08_layaway_open');
  await pg.click('#lDel'); await W(500);
  ok(await ev(() => Store.db.layaways[1].status === 'done' && Store.db.sales[Store.db.sales.length - 1].layaway), 'layaway delivered → invoice');
  await ev(() => Modal.close());
  // 5) customers
  await go('customers'); await shot('09_customers');
  await pg.fill('#cq', '0100'); await W(250); await shot('10_customers_search');
  await ev(() => { Views.customers.cur = 'c1'; Views.customers.render(document.getElementById('view')); }); await W(300); await shot('11_profile_invoices');
  for (const t of ['buy', 'pts', 'acc']) { await pg.click(`#cTabs [data-t="${t}"]`); await W(250); await shot('12_profile_' + t); }
  // 6) invoice search
  await go('sales'); await ev(() => { Views.sales.st.range = 'month'; }); await pg.click('#sr [data-r="month"]'); await W(300);
  await pg.fill('[data-f="a1"]', '400'); await W(200); await pg.fill('[data-f="t1"]', '12:00'); await W(250); await shot('13_sales_search');
  const filtered = await ev(() => [...document.querySelectorAll('#stb tr[data-id]')].length); ok(filtered > 0, 'invoice filters return rows: ' + filtered);
  await pg.fill('[data-f="phone"]', '01001234567'); await W(250); await shot('14_sales_by_phone');
  // 7) products
  await go('products'); await pg.click('#pdR [data-r="today"]'); await W(300); await shot('15_products_today');
  await go('products'); await pg.fill('#pq', bc[0]); await pg.press('#pq', 'Enter'); await W(400); ok(await pg.$('.pimg-ed'), 'scanner Enter opens product with photo box'); await shot('16_product_edit_photo'); await ev(() => Modal.close());
  // 8) reports
  await ev(() => { Views.reports.tab = 'added'; }); await go('reports'); await shot('17_report_added');
  await pg.click('#rT [data-t="cust"]'); await W(300); await shot('18_report_customers');
  // 9) coupons
  await go('coupons'); await shot('19_coupons'); await pg.click('#cpT [data-t="gc"]'); await W(300); await shot('20_giftcards');
  // 10) settings
  await go('settings'); await ev(() => { var h = [...document.querySelectorAll('h3')].find(x => /النقاط/.test(x.textContent)); h && h.scrollIntoView(); }); await W(300); await shot('21_settings_loyalty');
  // 11) supplier return
  await go('purchases'); await shot('22_purchases'); await ev(() => { Views.purchases.ret = { supplier: 's1', items: [], note: 'تالف' }; Views.purchases.render(document.getElementById('view')); }); await W(200);
  await pg.fill('#rs', bc[0]); await pg.press('#rs', 'Enter'); await W(150); await shot('23_supplier_return');
  const sb = await ev(() => Store.db.suppliers[0].balance); await pg.click('#rsave'); await W(300);
  ok(await ev(s => Store.db.suppliers[0].balance < s, sb), 'supplier return lowers balance');
  // 12) void restores points
  const v = await ev(() => { var s = Store.db.sales.filter(x => x.customer === 'c1' && x.ptsRedeemed)[0]; var p0 = Cust.get('c1').points; Sales.onVoid(s); return [p0, Cust.get('c1').points, s.ptsRedeemed, s.ptsEarned]; });
  ok(v[1] === v[0] + v[2] - v[3], 'void reverses points ' + v);
  // 13) license expiry banner
  await ev(() => { License.info = { e: Date.now() + 4 * 864e5 }; Shell.start(); }); await W(500); await shot('24_license_warning'); await ev(() => Modal.close());
  // 14) phone hidden when admin turns it off
  await ev(() => { S().posPhone.on = false; }); await go('pos'); ok(!(await pg.$('#cbPhone')) && await pg.$('#cust'), 'phone box hidden when off');
  await ev(() => { S().posPhone.on = true; S().posPhone.required = true; App.cart = newCart(); }); await go('pos');
  for (const c of bc.slice(0, 1)) { await pg.fill('#scan', c); await pg.press('#scan', 'Enter'); await W(60); }
  await ev(() => Views.pos.pay()); await W(300); ok(!(await pg.$('#done')), 'required phone blocks checkout');
  // 15) cashier sees phone box
  await ev(() => { S().posPhone.required = false; Store.saveNow(); });
  // customer display
  const cd = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await cd.goto('file:///home/claude/ghandi/app/cd.html'); await cd.waitForTimeout(300);
  const items = await ev(() => { App.cart = newCart(); App.cart.customer = 'c1'; [1, 4, 22].forEach(i => Views.pos.add(Store.db.products[i])); S().custDisplay.on = true; var d = null; var o = CD.send; CD.send = function (x) { d = x; x.shop = shopName(); x.logo = S().logo || ''; x.slogan = S().slogan || ''; x.msg = 'أهلاً بيكي 💖'; x.cur = cur(); x.dir = 'rtl'; }; CD.cart(); CD.send = o; return d; });
  await cd.evaluate(d => show(d), items); await cd.waitForTimeout(300); await cd.screenshot({ path: D + '25_customer_display.png' });
  await cd.evaluate(() => show({ mode: 'thanks', cust: 'نورهان أحمد', change: 15, earned: 42, pts: 310, dir: 'rtl' })); await cd.screenshot({ path: D + '26_customer_display_thanks.png' });
  console.log(errs.length ? errs.join('\n') : 'NO PAGE ERRORS');
  await b.close();
})();
