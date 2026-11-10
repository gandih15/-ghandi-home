const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  const D = '/home/claude/ghandi/build/shots/extra/'; require('fs').mkdirSync(D, { recursive: true });
  const shot = n => pg.screenshot({ path: D + n + '.png' }), ev = (f, a) => pg.evaluate(f, a), W = t => pg.waitForTimeout(t || 300), ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await W(2500);
  await pg.evaluate(() => { ReceiptPop.show = function () { }; }); await pg.fill('#lp', '1234'); await pg.click('#lb'); await W(1200); await ev(() => Modal.close());
  const go = async v => { await ev(v => go(v), v); await W(450); };
  // ---- birthdays + daily report on dashboard
  await ev(() => { var d = new Date(); Cust.get('c3').birthday = '1995-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); Store.save(); });
  await go('dashboard'); ok(await pg.$('.bday-card'), 'birthday card on dashboard'); await shot('01_dashboard');
  await pg.click('[data-bd="c3"]'); await W(400);
  const bd = await ev(() => { var k = Store.db.coupons.find(x => x.cust === 'c3'); return { code: k && k.code, url: window.__opened.pop() || '' }; });
  ok(bd.code && /wa\.me\/201223334445/.test(bd.url) && decodeURIComponent(bd.url).includes(bd.code), 'birthday WhatsApp with personal coupon ' + bd.code);
  ok(await ev(c => !!Coupons.check(Coupons.find(c), 500, Cust.get('c1')) && !Coupons.check(Coupons.find(c), 500, Cust.get('c3')), bd.code), 'birthday coupon only works for that customer');
  await pg.click('#dDaily'); await W(300); const rep = await pg.inputValue('#drT'); ok(/تقرير اليوم/.test(rep) && /صافي المبيعات/.test(rep), 'daily report text'); await shot('02_daily_report'); await ev(() => Modal.close());
  // ---- exchange: return 1 item, take a more expensive one → pays difference
  await go('pos');
  const ps = await ev(() => { var a = Store.db.products.filter(p => p.stock > 5 && priceOf(p, 0) > 0).sort((x, y) => priceOf(x, 0) - priceOf(y, 0)); return [a[0].barcodes[0], a[a.length - 1].barcodes[0], priceOf(a[0], 0), priceOf(a[a.length - 1], 0), a[0].id, a[a.length - 1].id]; });
  await pg.fill('#scan', ps[0]); await pg.press('#scan', 'Enter'); await W(100); await ev(() => Views.pos.pay()); await W(300); await pg.click('#done'); await W(500);
  const orig = await ev(() => Store.db.sales[Store.db.sales.length - 1].id);
  await go('sales'); await ev(id => Views.sales.open(Store.db.sales.find(s => s.id === id)), orig); await W(300);
  await pg.fill('[data-rq="0"]', '1'); ok(await pg.$('#dox'), 'exchange button on invoice'); await shot('03_invoice_exchange'); await pg.click('#dox'); await W(500);
  ok(await ev(() => !!App.cart.exch && !!document.querySelector('.exch-bar')), 'POS shows exchange bar');
  const st0 = await ev(id => Store.product(id).stock, ps[4]);
  await pg.fill('#scan', ps[1]); await pg.press('#scan', 'Enter'); await W(150); await shot('04_pos_exchange');
  await ev(() => Views.pos.pay()); await W(300); const due = await pg.textContent('#dueV'); await shot('05_checkout_exchange');
  ok(await ev(d => Math.abs(d - (App.cart.items[0].price - App.cart.exch.value)) < 0.02, parseFloat(due.replace(/,/g, ''))), 'due = difference only (' + due + ')');
  await pg.click('#done'); await W(600);
  const ex = await ev(a => { var n = Store.db.sales.length, s = Store.db.sales[n - 1], r = Store.db.sales[n - 2]; return { rt: r.type, rex: r.exchange, sp: s.payments, sr: s.exRet, st: Store.product(a).stock }; }, ps[4]);
  console.log(JSON.stringify(ex)); ok(ex.rt === 'return' && ex.rex && ex.sp.exchange > 0 && ex.st === st0 + 1, 'exchange: return + sale linked, stock back');
  // exchange where new item is cheaper → refund
  await go('sales'); const big = await ev(() => Store.db.sales[Store.db.sales.length - 1].id);
  await ev(id => Views.sales.open(Store.db.sales.find(s => s.id === id)), big); await W(300); await pg.fill('[data-rq="0"]', '1'); await pg.click('#dox'); await W(400);
  await pg.fill('#scan', ps[0]); await pg.press('#scan', 'Enter'); await W(150); await ev(() => Views.pos.pay()); await W(300);
  ok(/رجّع للعميل/.test(await pg.textContent('#brk')), 'refund shown when new items are cheaper'); await pg.click('#done'); await W(500);
  ok(await ev(() => { var r = Store.db.sales[Store.db.sales.length - 2]; return r.type === 'return' && r.payments.cash > 0; }), 'refund recorded as cash out');
  // ---- purchase order → receive
  await go('purchases'); ok(await pg.$('[data-feat="porders"]'), 'purchase order button'); await ev(() => PO.open()); await W(400); await shot('06_purchase_order');
  await pg.click('#poW'); await W(200); ok(await ev(() => /wa\.me/.test(window.__opened.pop() || '')), 'PO to supplier via WhatsApp');
  await pg.click('#poR'); await W(600); ok(await ev(() => !!Views.purchases.draft && Views.purchases.draft.items.length > 0), 'PO → receiving draft'); await shot('07_receive_from_po');
  await ev(() => { Views.purchases.draft = null; });
  // ---- price check
  await go('pricecheck'); await pg.fill('#pcIn', ps[1]); await pg.press('#pcIn', 'Enter'); await W(300); ok(await pg.$('.pc-card'), 'price checker shows item'); await shot('08_price_check');
  // ---- features: owner turns off customers page; developer turns off loyalty, forces exchange; locks
  await go('settings'); await ev(() => { var c = [...document.querySelectorAll('#view h3')].find(h => /المميزات اللي/.test(h.textContent)); c.scrollIntoView(); }); await W(200); await shot('09_owner_features');
  await pg.click('[data-of="layaway"]'); await W(400);
  ok(await ev(() => !NAV.filter(n => n[0] === 'layaway').some(navAllowed) && !document.querySelector('.side [data-v="layaway"], .nav [data-go="layaway"]')), 'owner switched off layaway → gone from menu');
  await go('pos'); ok(!(await pg.$('#xLay')), 'layaway button gone from POS');
  await ev(() => DevGate.enter('t')); await W(500);
  await shot('10_dev_features');
  await pg.click('[data-fk="loyalty"] [data-v="off"]'); await W(200); await pg.click('[data-fk="layaway"] [data-v="force"]'); await W(200); await pg.click('[data-lk="shop"]'); await pg.click('[data-lk="prices"]'); await W(200);
  ok(await ev(() => !Loyalty.on() && F('layaway')), 'dev: loyalty off, layaway forced on (overrides owner)');
  await ev(() => { Dev.unlocked = false; App.user = Store.db.users.find(u => u.username === 'admin'); Shell.start(); }); await W(400); await ev(() => Modal.close());
  await go('shop'); await W(300); ok(await ev(() => !!document.querySelector('#view .lock-note') && [...document.querySelectorAll('#view input')].every(i => i.disabled)), 'locked shop profile is read-only for owner'); await shot('11_locked_shop');
  ok(await ev(() => !can('products.editPrice')), 'price editing locked'); await go('settings'); await W(300);
  ok(await ev(() => document.querySelector('[data-of="layaway"]').disabled && !document.querySelector('[data-of="loyalty"]')), 'owner sees forced as locked and dev-off feature hidden');
  await go('pos'); await ev(() => { App.cart.items = []; }); await pg.fill('#scan', ps[0]); await pg.press('#scan', 'Enter'); await W(100); await ev(() => Views.pos.pay()); await W(300);
  ok(!(await pg.$('#ptsIn')) , 'no points in checkout when loyalty off'); await ev(() => Modal.close());
  // reset
  await ev(() => DevGate.enter('t')); await W(400); await ev(() => { var d = devS(); d.feat = {}; d.lock = {}; S().feat = {}; Store.save(); }); ok(await ev(() => FEATS.every(f => F(f[0]))), 'default: every feature on');
  console.log(errs.length ? errs.join('\n') : 'NO PAGE ERRORS'); await b.close();
})();
