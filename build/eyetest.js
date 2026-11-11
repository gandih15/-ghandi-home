const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = '/home/claude/ghandi-home/build/shots/eye'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  const login = async (u, pw) => { await pg.selectOption('#lu', u); await pg.fill('#lp', pw); await pg.click('#lb'); await pg.waitForTimeout(1500); await pg.evaluate(() => { while (document.querySelector('.mask')) Modal.close(); go('dashboard'); }); await pg.waitForTimeout(800); };
  const logout = async () => { await pg.evaluate(() => { Store.saveNow(); App.user = null; Gate.login(); }); await pg.waitForTimeout(800); };
  await pg.goto('file:///home/claude/ghandi-home/app/index.html?demo&reset'); await pg.waitForTimeout(2500);
  await login('u1', '1234');
  const st = () => pg.evaluate(() => ({ units: Eye.units.length, hidden: document.querySelectorAll('#view .eye-v').length, eyes: document.querySelectorAll('#view .eyeb').length }));
  console.log('default:', JSON.stringify(await st()));
  await pg.screenshot({ path: OUT + '/01_hidden.png' });
  // show "صافي مبيعاتي" and the hero, fold the all-accounts table
  await pg.evaluate(() => { var k = [...document.querySelectorAll('.us-k')][0]; k.querySelector('.eyeb').click(); document.querySelector('section.hero > .eyebar .eyeb').click(); var a = document.querySelector('.us-all .eyebar'); a.querySelectorAll('.eyeb')[1].click(); });
  await pg.waitForTimeout(300); await pg.screenshot({ path: OUT + '/02_some_shown.png' });
  const after = await pg.evaluate(() => ({ my: !document.querySelector('.us-k .num').classList.contains('eye-v'), hero: !document.querySelector('section.hero .big').classList.contains('eye-v'), folded: document.querySelector('.us-all .tbl-wrap').style.display === 'none' }));
  console.log('after clicks:', JSON.stringify(after));
  // period button redraw keeps state
  await pg.evaluate(() => { var b = document.querySelectorAll('#usP button')[3]; b && b.click(); }); await pg.waitForTimeout(500);
  console.log('after period change:', await pg.evaluate(() => { var n = document.querySelector('.us-k .num'); return n && !n.classList.contains('eye-v') && !!document.querySelector('.us-k .eyeb'); }));
  await logout(); await login('u2', '1111');
  console.log('cashier own state (all hidden):', await pg.evaluate(() => { var n = document.querySelector('.us-k .num'); return n ? n.classList.contains('eye-v') : 'no card'; }));
  await logout(); await login('u1', '1234');
  const again = await pg.evaluate(() => ({ my: !document.querySelector('.us-k .num').classList.contains('eye-v'), hero: !document.querySelector('section.hero .big').classList.contains('eye-v'), folded: document.querySelector('.us-all .tbl-wrap').style.display === 'none', other: document.querySelectorAll('.card.kpi .v.eye-v').length }));
  console.log('admin again remembered:', JSON.stringify(again));
  await pg.click('[data-ea="1"]'); await pg.waitForTimeout(300); console.log('show all → hidden left:', await pg.evaluate(() => document.querySelectorAll('#view .eye-v').length));
  await pg.screenshot({ path: OUT + '/03_all_shown.png', fullPage: true });
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
