const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); const W = t => pg.waitForTimeout(t), ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await W(2500);
  await pg.keyboard.type('ghandi'); await W(400); await pg.fill('#dvU', 'gandy'); await pg.fill('#dvP', '23905320'); await pg.click('#dvGo'); await W(2000);
  ok(await pg.evaluate(() => App.view === 'dev'), 'new developer login gandy / 23905320 works');
  // set a new password for mariam, then reveal it
  await pg.click('[data-a="pw"][data-u="u2"]'); await W(200); await pg.fill('#ua1', 'Mariam77'); await pg.click('#uaS'); await W(1200);
  const rows = await pg.$$('#dvUsers tr'); await pg.evaluate(() => document.querySelectorAll('#dvUsers [data-show]').forEach(b => b.click())); await W(200);
  const txt = await pg.evaluate(() => [...document.querySelectorAll('#dvUsers tr')].map(r => r.innerText.replace(/\s+/g, ' ')).join('\n')); console.log(txt);
  ok(/Mariam77/.test(txt) && /1234/.test(txt), 'passwords readable in developer panel');
  await pg.evaluate(() => { var c = document.getElementById('dvUsers'); c.scrollIntoView(); }); await pg.screenshot({ path: 'build/shots/tier/40_dev_pw.png' });
  console.log(errs.length ? errs : 'NO PAGE ERRORS'); await b.close();
})();
