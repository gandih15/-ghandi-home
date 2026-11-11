const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/eye';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); go('pos'); }); await pg.waitForTimeout(700);
  const add = () => pg.evaluate(() => { var ps = Store.db.products.filter(p => !p.serial && p.stock > 0 && !(p.vopt)); ps.slice(0, 8).forEach(p => Views.pos.add(p)); document.querySelectorAll('.mask').forEach(m => Modal.close(m)); });
  await add(); await pg.waitForTimeout(400);
  const first = () => pg.evaluate(() => { var r = document.querySelector('#items > .ci .nm'); return r && r.textContent.slice(0, 25); });
  const last = await pg.evaluate(() => App.cart.items.slice(-1)[0].name.slice(0, 25));
  console.log('top mode: first row is newest:', (await first()).startsWith(last.slice(0, 10)), 'btn:', await pg.evaluate(() => document.querySelector('#xOrd') && document.querySelector('#xOrd').textContent));
  await pg.screenshot({ path: OUT + '/10_pos_top.png' });
  await pg.click('#xOrd'); await pg.waitForTimeout(300);
  console.log('bottom mode: first row is oldest:', (await first()).startsWith(await pg.evaluate(() => App.cart.items[0].name.slice(0, 10))));
  // + button still hits the right item after reorder
  await pg.click('#xOrd'); await pg.waitForTimeout(200);
  const q = await pg.evaluate(() => { var r = document.querySelector('#items > .ci'); var i = +r.dataset.i; var q0 = App.cart.items[i].qty; r.querySelector('[data-p]').click(); return App.cart.items[i].qty === q0 + 1 && i === App.cart.items.length - 1; });
  console.log('plus on top row hits newest:', q);
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
