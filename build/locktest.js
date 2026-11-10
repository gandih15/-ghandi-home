const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const keys = require('./keys.json');
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
(async () => {
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await br.newContext({ viewport: { width: 1440, height: 860 } }); const pg = await ctx.newPage();
  pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/claude/ghandi/app/index.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(2000);
  const fp = await pg.textContent('#fp');
  const k = await crypto.subtle.importKey('jwk', keys.prv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const p = Buffer.from(JSON.stringify({ f: fp.trim(), n: 'بيوتي كورنر', ne: 'Beauty Corner', o: 'أ. منى', ph: '01223334445', l: 1, i: Date.now() }));
  const key = b64u(p) + '.' + b64u(Buffer.from(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, p)));
  await pg.fill('#key', key); await pg.click('#act'); await pg.waitForTimeout(800);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await pg.waitForTimeout(1200);
  await pg.evaluate(() => { Modal.close(); go('shop'); }); await pg.waitForTimeout(400); console.log('shop:', await pg.evaluate(() => [S().shopName, S().shopNameEn, S().ownerName, App.view, document.querySelector('[data-k="shopName"]').disabled]));
  await pg.evaluate(() => Modal.close()); await pg.waitForTimeout(200);
  await pg.screenshot({ path: '/home/claude/ghandi/build/shots/29_locked_shop.png' });
  await br.close();
})();
