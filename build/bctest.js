const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await br.newPage({ viewport: { width: 900, height: 700 } });
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo'); await pg.waitForTimeout(1200);
  const codes = ['200000000017', 'INV1024', '6221000037001', 'ABC-123'];
  await pg.evaluate(codes => { document.body.innerHTML = codes.map(c => '<div style="width:600px;height:120px;margin:30px;background:#fff">' + Barcode.svg(c, { height: 50 }) + '</div>').join(''); document.body.style.background = '#fff'; }, codes);
  for (let i = 0; i < codes.length; i++) { const el = (await pg.$$('body > div'))[i]; await el.screenshot({ path: `/tmp/claude-0/bc${i}.png` }); }
  await br.close();
})();
