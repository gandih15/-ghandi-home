// node build/custtest.js → full customer details form, profile card, customer file A4
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); docCfg().preview = false; Views.customers.cur = null; go('customers'); }); await pg.waitForTimeout(500);
  await pg.evaluate(() => Views.customers.edit(null, document.getElementById('view'))); await pg.waitForTimeout(400);
  const f = { ceN: 'سامح عبد الرحمن', ceP: '01144455566', ceNid: '29105012201234', ceGov: 'بني سويف', ceAr: 'الحي التاني', ceA: 'شارع الثورة — عمارة 5 — الدور 3', ceLm: 'جنب صيدلية الشفاء', ceJ: 'محاسب', ceW: 'شركة الكهرباء', ceWp: '0822334455', ceRn: 'عبد الرحمن سامح', ceRp: '01009998887', ceRr: 'الأب', ceCl: '20000', ceOb: '1500' };
  for (const k in f) await pg.fill('#' + k, f[k]);
  await pg.selectOption('#ceK', 'vip'); await pg.screenshot({ path: OUT + '/80_cust_form.png' });
  await pg.click('#ceS'); await pg.waitForTimeout(600);
  const c = await pg.evaluate(() => { var c = Cust.byPhone('01144455566'); return { name: c.name, nid: c.nid, bal: c.balance, kind: c.kind, cur: Views.customers.cur === c.id }; });
  console.log(JSON.stringify(c));
  await pg.screenshot({ path: OUT + '/81_cust_profile.png' });
  const doc = await pg.evaluate(() => { var out; var pp = Printer.print; Printer.print = function (h, o) { out = '<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>' + o.css + '</style></head><body>' + h + '</body></html>'; }; CustX.print(Cust.byPhone('01144455566')); Printer.print = pp; return out; });
  const p2 = await b.newPage({ viewport: { width: 794, height: 1123 } }); await p2.setContent(doc); await p2.waitForTimeout(150); await p2.screenshot({ path: OUT + '/a4_cust_file.png', fullPage: true });
  // old customer without details shows the "complete" prompt
  await pg.evaluate(() => { Views.customers.cur = 'c2'; go('customers'); }); await pg.waitForTimeout(400); console.log('fill prompt:', !!(await pg.$('#cxFill')) || !!(await pg.$('#cxPr')));
  console.log('ERRORS:', errs.join('\n') || 'none'); await b.close();
})();
