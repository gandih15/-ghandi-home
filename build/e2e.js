// End-to-end test of the real desktop build (Linux Electron = same code as Ghandi.exe)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const cp = require('child_process'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const keys = require('./keys.json');
const DATA = '/tmp/claude-0/e2e-data'; fs.rmSync(DATA, { recursive: true, force: true });
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const { _electron } = require('/opt/npm-tools/node_modules/playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function start() {
  const app = await _electron.launch({ executablePath: '/home/claude/ghandi/dist/Ghandi-linux/ghandi', args: ['--no-sandbox', '--disable-gpu'], env: Object.assign({}, process.env, { GHANDI_DATA: DATA, GHANDI_DEV: '1' }) });
  const pg = await app.firstWindow(); await pg.setViewportSize({ width: 1440, height: 860 }).catch(() => { }); return [app, pg];
}
(async () => {
  let [br, pg] = await start(); await sleep(2500);
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  console.log('1. desktop mode:', await pg.evaluate(() => ({ IS_ELECTRON, IS_NW, dataDir: Store.dataDir(), gate: !!document.querySelector('#fp') })));
  const fp = (await pg.textContent('#fp')).trim(); console.log('2. device id shown:', fp);
  await pg.screenshot({ path: 'shots/40_desktop_activation.png' });
  // owner generates a key for THIS device (same as keygen tool)
  const pay = Buffer.from(JSON.stringify({ f: fp, n: 'لمسة أنوثة', o: 'أ. سارة', l: 1, i: Date.now() }));
  const key = b64u(pay) + '.' + b64u(crypto.sign('sha256', pay, { key: crypto.createPrivateKey({ key: keys.prv, format: 'jwk' }), dsaEncoding: 'ieee-p1363' }));
  const other = (() => { const p = Buffer.from(JSON.stringify({ f: 'AAAAA-BBBBB-CCCCC-DDDDD', n: 'x', i: Date.now() })); return b64u(p) + '.' + b64u(crypto.sign('sha256', p, { key: crypto.createPrivateKey({ key: keys.prv, format: 'jwk' }), dsaEncoding: 'ieee-p1363' })); })();
  await pg.fill('#key', other); await pg.click('#act'); await sleep(800);
  console.log('3. key for another device rejected:', await pg.evaluate(() => document.body.innerText.includes('الكود لا يخص هذا الجهاز')));
  await pg.fill('#key', key); await pg.click('#act'); await sleep(1200);
  console.log('4. activated → login screen:', await pg.evaluate(() => !!document.querySelector('#lp')), '| license file:', fs.existsSync(DATA + '/license.key'));
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await sleep(1200);
  await pg.evaluate(() => Modal.close()); await sleep(200);
  console.log('5. shop name from license:', await pg.evaluate(() => S().shopName), '| view:', await pg.evaluate(() => App.view));
  await pg.screenshot({ path: 'shots/41_desktop_first_run.png' });
  // add data, save, backup
  await pg.evaluate(() => { Store.db.products.push({ id: 'x1', name: 'روج تجربة', barcodes: ['111222333'], prices: [50, 0, 0, 0], cost: 20, stock: 5, cat: 'ميك أب', active: true }); Store.reindex(); Store.saveNow(); });
  const raw = fs.readFileSync(DATA + '/ghandi.db');
  console.log('6. data file encrypted:', raw.slice(0, 5).toString() === 'GHDB2', '| contains plain text?', raw.includes(Buffer.from('روج تجربة')));
  const r = await pg.evaluate(() => Backup.run('test')); console.log('7. backup:', JSON.stringify(r.ok), '| readme:', fs.readdirSync(DATA + '/backups').filter(f => /txt$/.test(f)));
  console.log('8. printers via IPC:', JSON.stringify(await pg.evaluate(() => Printer.list())));
  const pr = await pg.evaluate(() => IPC.invoke('print', { html: '<p>test</p>', printer: 'NO_SUCH_PRINTER', silent: true, copies: 1 }));
  console.log('9. print IPC round-trip:', JSON.stringify(pr));
  await pg.evaluate(() => go('backup')); await sleep(600); await pg.screenshot({ path: 'shots/42_desktop_backup.png' });
  await br.close(); await sleep(1500);
  // corrupt the data file → must recover from .prev
  const d = fs.readFileSync(DATA + '/ghandi.db'); d[d.length - 10] ^= 0xff; fs.writeFileSync(DATA + '/ghandi.db', d);
  [br, pg] = await start(); await sleep(2500);
  console.log('10. after corrupting data file:', await pg.evaluate(() => ({ products: Store.db.products.length, login: !!document.querySelector('#lp') })));
  await br.close(); await sleep(1500);
  // fresh PC: delete data → must find latest backup automatically
  const bk = fs.readdirSync(DATA + '/backups').filter(f => /gbk$/.test(f)); fs.mkdirSync('/tmp/claude-0/e2e-bk', { recursive: true }); fs.copyFileSync(DATA + '/backups/' + bk[0], '/tmp/claude-0/e2e-bk/' + bk[0]);
  fs.rmSync(DATA, { recursive: true, force: true }); fs.mkdirSync(DATA + '/backups', { recursive: true }); fs.copyFileSync('/tmp/claude-0/e2e-bk/' + bk[0], DATA + '/backups/' + bk[0]);
  [br, pg] = await start(); await sleep(2500);
  console.log('11. fresh install with a backup present → restore offered:', await pg.evaluate(() => document.body.innerText.includes('تم العثور على نسخة احتياطية')));
  await pg.screenshot({ path: 'shots/43_desktop_restore_offer.png' });
  await br.close(); await sleep(1000);
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors');
  process.exit(0);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
