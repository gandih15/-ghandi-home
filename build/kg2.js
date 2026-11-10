const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  // the app (browser preview) computes its own fingerprint; the keygen must produce codes the app accepts
  const app = await br.newPage(); await app.goto('file:///home/claude/ghandi/app/index.html?demo'); await app.waitForTimeout(1500);
  const fp = await app.evaluate(() => License.fingerprint());
  const kg = await br.newPage({ viewport: { width: 860, height: 1000 } }); kg.on('pageerror', e => console.log('ERR', e.message));
  await kg.goto('file:///home/claude/ghandi/owner-tools/Ghandi-Keygen.html');
  await kg.fill('#fp', fp.toLowerCase()); await kg.fill('#n', 'بيوتي كورنر'); await kg.fill('#o', 'أ. منى'); await kg.fill('#ph', '01223334445'); await kg.fill('#ct', 'بني سويف');
  for (const d of ['0', '365']) {
    await kg.selectOption('#d', d); await kg.click('#go'); await kg.waitForTimeout(400);
    const code = await kg.textContent('#out');
    console.log('duration', d, '→', code, JSON.stringify(await app.evaluate(c => License.verify(c).then(r => ({ ok: r.ok, exp: r.payload && r.payload.e ? new Date(r.payload.e).toISOString().slice(0, 10) : 'lifetime' })), code)));
  }
  await kg.screenshot({ path: 'shots/54_keygen_short.png' });
  const ch = await app.evaluate(() => License.devChallenge());
  await kg.click('.tabs button[data-t=dev]'); await kg.fill('#dfp', fp); await kg.fill('#dch', ch); await kg.click('#dgo'); await kg.waitForTimeout(300);
  const ans = await kg.textContent('#dout');
  console.log('dev unlock', ch, '→', ans, await app.evaluate(a => License.devCheck(a[0], a[1]), [ch, ans]));
  await kg.screenshot({ path: 'shots/55_keygen_dev.png' });
  await br.close();
})();
