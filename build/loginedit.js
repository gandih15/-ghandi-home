const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo&reset'); await pg.waitForTimeout(2600);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(900);
  await pg.evaluate(() => { S().skin = 'velvet'; applyLook(); Shell.render(); go('shop'); }); await pg.waitForTimeout(500);
  await pg.evaluate(() => document.getElementById('loginCard').scrollIntoView()); await pg.waitForTimeout(200);
  // owner edits: new title, tagline, edits a line, hides one, adds one
  await pg.fill('#lgT', 'لمسة أنوثة'); await pg.dispatchEvent('#lgT', 'change');
  await pg.fill('#lgS', 'كل اللي يخص جمالك في مكان واحد — إكسسوارات وميك أب وهدايا 💖'); await pg.dispatchEvent('#lgS', 'change');
  await pg.evaluate(() => { const r = document.querySelectorAll('#lgF [data-i]'); r[5].querySelector('[data-on]').click(); });
  await pg.click('#lgAdd'); await pg.waitForTimeout(100);
  await pg.evaluate(() => { const r = [...document.querySelectorAll('#lgF [data-i]')].pop(); const t = r.querySelector('[data-t]'); t.value = 'توصيل لحد البيت 🚚'; t.onchange(); });
  await pg.evaluate(() => { const r = [...document.querySelectorAll('#lgF [data-i]')].pop(); const e = r.querySelector('[data-e]'); e.value = '🚚'; e.onchange(); });
  await pg.evaluate(() => document.getElementById('loginCard').scrollIntoView()); await pg.waitForTimeout(300);
  await pg.screenshot({ path: 'shots/44_login_editor.png' });
  await pg.click('#lgPrev'); await pg.waitForTimeout(800); await pg.screenshot({ path: 'shots/45_login_custom.png' });
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await br.close();
})();
