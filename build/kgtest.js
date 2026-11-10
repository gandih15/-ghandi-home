const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const app = await br.newPage(); await app.goto('file:///home/claude/ghandi/app/index.html?demo'); await app.waitForTimeout(1200);
  const fp = await app.evaluate(() => License.fingerprint());
  const kg = await br.newPage({ viewport: { width: 900, height: 900 } }); kg.on('pageerror', e => console.log('ERR', e.message));
  await kg.goto('file:///home/claude/ghandi/owner-tools/Ghandi-Keygen.html');
  await kg.fill('#fp', fp.toLowerCase()); await kg.fill('#n', 'لمسة أنوثة'); await kg.fill('#ne', 'Lamsa Accessories'); await kg.fill('#o', 'أ. سارة حسن'); await kg.fill('#ct', 'بني سويف'); await kg.fill('#ph', '01001234567'); await kg.check('#lk'); await kg.click('#go'); await kg.waitForTimeout(600);
  const key = await kg.inputValue('#out');
  console.log('verify:', JSON.stringify(await app.evaluate(k => License.verify(k), key)));
  await kg.screenshot({ path: '/home/claude/ghandi/build/shots/18_keygen.png' });
  await br.close();
})();
