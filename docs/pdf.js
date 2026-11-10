const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await b.newPage();
  for (const [src, out] of [['1-install', 'Ghandi-1-التسطيب-والتفعيل-والتشغيل'], ['2-guide', 'Ghandi-2-دليل-الاستخدام-الكامل'], ['3-dev', 'Ghandi-3-دليل-المطور-سري']]) {
    await pg.goto('file:///home/claude/ghandi/docs/' + src + '.html'); await pg.waitForTimeout(800);
    await pg.pdf({ path: '/home/claude/ghandi/docs/' + out + '.pdf', format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;text-align:center;font-size:9px;color:#999"><span class="pageNumber"></span> / <span class="totalPages"></span></div>', margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' } });
    console.log(out);
  }
  await b.close();
})();
