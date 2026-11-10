const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const C = require('./dev-cred.json');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  const D = '/home/claude/ghandi/build/shots/tier/', ev = (f, a) => pg.evaluate(f, a), W = t => pg.waitForTimeout(t || 300), ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await W(2500);
  for (let i = 0; i < 5; i++) { await pg.click('.gate .art h1'); await W(80); }
  await W(300); ok(await pg.$('#dvU'), '5 taps on login title opens developer sign-in'); await pg.screenshot({ path: D + '20_dev_login.png' });
  await pg.fill('#dvU', C.u); await pg.fill('#dvP', 'wrong-pass'); await pg.click('#dvGo'); await W(1500);
  ok(await ev(() => !Dev.unlocked && !!document.querySelector('#dvU')), 'wrong password rejected');
  await pg.fill('#dvU', C.u.toUpperCase()); await pg.fill('#dvP', C.p); await pg.click('#dvGo'); await W(2000);
  ok(await ev(() => Dev.unlocked && App.view === 'dev' && App.user.dev), 'right login → developer panel without the shop password');
  await ev(() => { var c = [...document.querySelectorAll('h3')].find(x => /بيانات دخول لوحة/.test(x.textContent)); c && c.scrollIntoView(); }); await W(200); await pg.screenshot({ path: D + '21_dev_panel_login_card.png' });
  // cashier session: type the secret word
  await ev(() => { Dev.unlocked = false; devS().shiftMode = 'off'; App.user = Store.db.users.find(u => u.username === 'mariam'); App.cart = null; Shell.start(); }); await W(400); await ev(() => Modal.close());
  await pg.click('#scan'); await pg.keyboard.type('ghandi'); await W(400);
  ok(await pg.$('#dvU'), 'typing ghandi opens sign-in (cashier, in the scan box)'); ok(await ev(() => document.getElementById('scan').value === ''), 'secret word removed from the box');
  await ev(() => Modal.close());
  for (let i = 0; i < 5; i++) { await pg.click('.brand small'); await W(80); } await W(300); ok(await pg.$('#dvU'), '5 taps on "Ghandi POS v" in the sidebar'); await ev(() => Modal.close());
  await pg.keyboard.press('Control+Shift+D'); await W(300); ok(await pg.$('#dvU'), 'Ctrl+Shift+D'); await ev(() => Modal.close());
  // lockout after 5 wrong
  await ev(() => DevGate.open()); for (let i = 0; i < 5; i++) { await pg.fill('#dvU', 'x'); await pg.fill('#dvP', 'y'); await pg.click('#dvGo'); await W(400); }
  ok(await ev(() => DevGate.locked() > 0), 'locked 10 min after 5 wrong tries');
  console.log(errs.length ? errs.join('\n') : 'NO PAGE ERRORS'); await b.close();
})();
