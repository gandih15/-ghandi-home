const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const keys = require('./keys.json');
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
(async () => {
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const pg = await br.newPage();
  await pg.goto('file:///home/claude/ghandi/app/index.html?demo'); await pg.waitForTimeout(1500);
  const fp = await pg.evaluate(() => License.fingerprint());
  const sign = async (payload) => {
    const k = await crypto.subtle.importKey('jwk', keys.prv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const p = Buffer.from(JSON.stringify(payload));
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, p);
    return b64u(p) + '.' + b64u(Buffer.from(sig));
  };
  const good = await sign({ f: fp, n: 'Test Shop', i: Date.now() });
  const other = await sign({ f: 'AAAAA-BBBBB-CCCCC-DDDDD', n: 'X', i: Date.now() });
  const expired = await sign({ f: fp, n: 'X', i: Date.now(), e: Date.now() - 1000 });
  const tampered = good.replace(/^./, c => c === 'e' ? 'f' : 'e');
  for (const [n, k] of [['good', good], ['other device', other], ['expired', expired], ['tampered', tampered]])
    console.log(n, JSON.stringify(await pg.evaluate(k => License.verify(k).then(r => ({ ok: r.ok, why: r.why })), k)));
  // barcode + xlsx roundtrip
  const rt = await pg.evaluate(async () => { const blob = XL.writeXlsx([['الاسم','الباركود','قطاعي'],['روج','111 | 222',85]], 'P', true); const rows = await XL.readXlsx(await blob.arrayBuffer()); return JSON.stringify(rows); });
  console.log('xlsx roundtrip', rt);
  console.log('code128', await pg.evaluate(() => Barcode.encode('200000000017').length));
  await br.close();
})();
