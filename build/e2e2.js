const { _electron, chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), crypto = require('crypto'), keys = require('./keys.json');
const DATA = '/tmp/claude-0/e2e2'; fs.rmSync(DATA, { recursive: true, force: true });
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', EPOCH = Date.UTC(2026, 0, 1), K = Buffer.from(keys.hmac, 'hex');
const enc = b => { let bits = ''; for (const x of b) bits += x.toString(2).padStart(8, '0'); let s = ''; for (let i = 0; i < bits.length; i += 5) s += B32[parseInt(bits.substr(i, 5).padEnd(5, '0'), 2)]; return s; };
const mac = (m, n) => crypto.createHmac('sha256', K).update(m).digest().slice(0, n);
function code(fp, days) { const v = ((1 << 30) >>> 0) + (days << 16) + 1234; const p = Buffer.alloc(4); p.writeUInt32BE(v >>> 0); const mk = mac('GHX1|' + fp.replace(/-/g, ''), 4), px = Buffer.from(p.map((x, i) => x ^ mk[i])); return enc(Buffer.concat([px, mac('GHL1|' + fp.replace(/-/g, '') + '|' + p.toString('hex'), 6)])).match(/.{4}/g).join('-'); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function start() { const app = await _electron.launch({ executablePath: '/home/claude/ghandi/dist/Ghandi-linux/ghandi', args: ['--no-sandbox', '--disable-gpu'], env: Object.assign({}, process.env, { GHANDI_DATA: DATA }) }); const pg = await app.firstWindow(); await pg.setViewportSize({ width: 1440, height: 860 }).catch(() => { }); return [app, pg]; }
(async () => {
  let [app, pg] = await start(); await sleep(2500); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const fp = (await pg.textContent('#fp')).trim();
  await pg.fill('#key', code('AAAAA-BBBBB-CCCCC-DDDDD', 0)); await pg.click('#act'); await sleep(700);
  console.log('1. short code for another device rejected:', await pg.evaluate(() => document.body.innerText.includes('الكود لا يخص هذا الجهاز')));
  const c = code(fp, 0); console.log('   code length:', c, c.length);
  await pg.fill('#key', c.toLowerCase().replace(/-/g, ' ')); await pg.screenshot({ path: 'shots/50_short_code.png' }); await pg.click('#act'); await sleep(1000);
  console.log('2. short code (typed lowercase/spaces) accepted:', await pg.evaluate(() => !!document.querySelector('#lp')));
  console.log('3. no shop row before setup:', await pg.evaluate(() => !document.querySelector('.gate .box img, .gate .box .row [style*=\"font-size:19px\"]')));
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await sleep(1200); await pg.evaluate(() => Modal.close()); await sleep(200);
  console.log('4. first run opens shop setup:', await pg.evaluate(() => App.view));
  await pg.evaluate(() => { S().shopName = 'بيوتي كورنر'; S().slogan = 'كل اللي يخص جمالك'; Store.saveNow(); });
  // dev panel
  console.log('5. dev panel hidden from owner:', await pg.evaluate(() => !document.querySelector('[data-go="dev"]')));
  await pg.evaluate(() => Dev.ask()); await sleep(600);
  const ch = await pg.evaluate(() => document.querySelectorAll('.modal .fp')[1].textContent.trim());
  await pg.fill('#dvA', 'ABCD-EFGH'); await pg.click('#dvGo'); await sleep(400);
  console.log('6. wrong unlock rejected:', await pg.evaluate(() => !Dev.unlocked));
  await pg.fill('#dvA', enc(mac('GHD1|' + fp.replace(/-/g, '') + '|' + ch, 5)).match(/.{4}/g).join('-')); await pg.click('#dvGo'); await sleep(800);
  console.log('7. right unlock opens dev panel:', await pg.evaluate(() => App.view));
  await pg.screenshot({ path: 'shots/51_dev_panel.png' });
  // shifts off from dev
  await pg.evaluate(() => { devS().shiftMode = 'off'; Store.save(); Shell.render(); go('pos'); }); await sleep(500);
  console.log('8. shifts off → POS opens directly, no shift nav:', await pg.evaluate(() => !!document.querySelector('#scan') && !document.querySelector('[data-go="shifts"]')));
  // keep=1
  await pg.evaluate(() => Backup.run('a')); await sleep(1100); await pg.evaluate(() => Backup.run('b'));
  console.log('9. backups folder keeps only newest:', fs.readdirSync(DATA + '/backups').filter(f => /\.gbk$/.test(f)));
  // login screen texts changed by developer
  await pg.evaluate(() => { const e = LoginTexts.edit('ar'); e.tagline = 'أقوى سيستم لمحلات البيوتي 💄'; Store.saveNow(); });
  // close with X → backup then exit
  const before = fs.readdirSync(DATA + '/backups').filter(f => /\.gbk$/.test(f))[0];
  await sleep(1100);
  const closed = app.waitForEvent('close', { timeout: 20000 }).then(() => true).catch(() => false);
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
  await sleep(250); try { await pg.screenshot({ path: 'shots/52_closing_backup.png' }); } catch (e) { }
  console.log('10. closing with X → app exited:', await closed);
  const after = fs.readdirSync(DATA + '/backups').filter(f => /\.gbk$/.test(f));
  console.log('11. a new backup was made on close:', after.length === 1 && after[0] !== before, after);
  [app, pg] = await start(); await sleep(2500);
  console.log('12. reopen → still activated, login shows shop + dev texts:', await pg.evaluate(() => ({ login: !!document.querySelector('#lp'), shop: document.querySelector('.gate .box').innerText.includes('بيوتي كورنر'), tag: document.querySelector('.gate .art').innerText.includes('أقوى سيستم') })));
  await pg.screenshot({ path: 'shots/53_login_after.png' });
  await app.close().catch(() => { });
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'); process.exit(0);
})().catch(e => { console.log('FAIL', e.stack); process.exit(1); });
