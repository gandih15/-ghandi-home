// renders every A4 document to PNG (build/shots/a4_*.png)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500); await pg.evaluate(() => { docCfg().preview = false; });
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); window.__docs = []; Printer.print = function (html, o) { window.__docs.push({ html: html, css: (o && o.css) || '' }); }; });
  const docs = await pg.evaluate(() => {
    var db = Store.db, out = [];
    var take = function (n, fn) { window.__docs = []; try { fn(); } catch (e) { return out.push([n, 'ERR ' + e.message]); } var d = window.__docs.pop(); if (d) out.push([n, '<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>' + d.css + '</style></head><body>' + d.html + '</body></html>']); };
    App.cart = newCart(); var p0 = db.products[0], p1 = db.products.filter(function (p) { return p.sellBy === 'm2'; })[0];
    App.cart.items.push({ pid: p0.id, name: p0.name, qty: 1, price: 19500, cost: p0.cost }, { pid: p1.id, name: Meas.label(p1, { l: 3, w: 4, n: 1 }), qty: 12, price: 240, cost: p1.cost });
    var t = Views.pos.totals(); var s = Sales.create({ type: 'sale', items: App.cart.items, customer: 'c1', subtotal: t.sub, discount: 500, vat: 0, total: t.total - 500, payments: { cash: 10000 }, paid: 10000, change: 0, credit: t.total - 10500 });
    take('a4_invoice', function () { A4.printSale(s); });
    take('a4_contract', function () { Inst.printContract(db.inst[0]); });
    take('a4_inst_receipt', function () { Inst.printReceipt(db.inst[0], db.inst[0].pays[1]); });
    take('a4_bride', function () { Bride.print(db.brides[0]); });
    take('a4_order', function () { Ord.print(db.orders[0], false); });
    take('a4_workshop', function () { Ord.print(db.orders[0], true); });
    take('a4_delivery', function () { Dlv.print(db.deliveries[0]); });
    take('a4_quote', function () { Quote.print(db.quotes[0]); });
    take('a4_statement', function () { Stmt.print(Cust.get('c2')); });
    take('a4_transfer', function () { Views.warehouses.print(db.transfers[0]); });
    return out;
  });
  const p2 = await b.newPage({ viewport: { width: 794, height: 1123 } });
  for (const [n, h] of docs) { if (h.startsWith('ERR')) { console.log(n, h); continue; } await p2.setContent(h); await p2.waitForTimeout(150); await p2.screenshot({ path: `${OUT}/${n}.png`, fullPage: true }); const pdf = n === 'a4_invoice' || n === 'a4_contract'; if (pdf) await p2.pdf({ path: `${OUT}/${n}.pdf`, format: 'A4', printBackground: true }); }
  console.log('docs', docs.map(d => d[0]).join(' '), 'ERRORS:', errs.join('\n') || 'none');
  await b.close();
})();
