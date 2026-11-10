const { _electron } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), crypto = require('crypto'), keys = require('./keys.json');
const DATA = '/tmp/claude-0/e2e3'; fs.rmSync(DATA, { recursive: true, force: true });
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', K = Buffer.from(keys.hmac, 'hex');
const enc = b => { let bits = ''; for (const x of b) bits += x.toString(2).padStart(8, '0'); let s = ''; for (let i = 0; i < bits.length; i += 5) s += B32[parseInt(bits.substr(i, 5).padEnd(5, '0'), 2)]; return s; };
const mac = (m, n) => crypto.createHmac('sha256', K).update(m).digest().slice(0, n);
function code(fp) { const v = ((1 << 30) >>> 0) + 1234; const p = Buffer.alloc(4); p.writeUInt32BE(v >>> 0); const mk = mac('GHX1|' + fp.replace(/-/g, ''), 4), px = Buffer.from(p.map((x, i) => x ^ mk[i])); return enc(Buffer.concat([px, mac('GHL1|' + fp.replace(/-/g, '') + '|' + p.toString('hex'), 6)])); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function start() { const app = await _electron.launch({ executablePath: '/home/claude/ghandi/dist/Ghandi-linux/ghandi', args: ['--no-sandbox', '--disable-gpu'], env: Object.assign({}, process.env, { GHANDI_DATA: DATA }) }); const pg = await app.firstWindow(); return [app, pg]; }
(async () => {
  let [app, pg] = await start(); await sleep(2500); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const fp = (await pg.textContent('#fp')).trim(); await pg.fill('#key', code(fp)); await pg.click('#act'); await sleep(1000);
  await pg.fill('#lp', '1234'); await pg.click('#lb'); await sleep(1200); await pg.evaluate(() => Modal.close());
  // simulate an older version having been installed before → what's new + backup
  await pg.evaluate(() => { localStorage.setItem('ghandi.ver', '1.5.0'); S().shopName = 'تجربة'; devS().shiftMode = 'off'; S().posPhone = { on: true, required: false }; S().loyalty = { on: true, earnEvery: 10, earnPts: 1, redeemPts: 100, redeemVal: 10, minRedeem: 100, maxPct: 50, expireMonths: 12, welcome: 0 }; S().custDisplay = { on: true, msg: 'أهلاً' }; Store.db.products.push({ id: 'x1', name: 'روج', barcodes: ['111'], prices: [100, 90, 80, 0], cost: 50, stock: 10, active: true, created: Date.now() }); Store.reindex(); Store.saveNow(); Shell.start(); });
  await sleep(1500);
  console.log('1. update detected → what is new shown:', await pg.evaluate(() => /تم تحديث البرنامج/.test(document.body.innerText)), '| backup made:', fs.readdirSync(DATA + '/backups').some(f => /\.gbk$/.test(f)));
  await pg.screenshot({ path: 'shots/crm/30_whats_new.png' }); await pg.evaluate(() => Modal.close());
  await pg.evaluate(() => go('pos')); await sleep(1500);
  const wins = app.windows(); console.log('2. customer display window opened:', wins.length === 2);
  const cd = wins.find(w => w !== pg);
  await pg.fill('#cbPhone', '01011112222'); await pg.fill('#scan', '111'); await pg.press('#scan', 'Enter'); await sleep(600);
  if (cd) { console.log('3. display shows the cart:', await cd.evaluate(() => document.getElementById('tot').textContent)); await cd.screenshot({ path: 'shots/crm/31_cd_electron.png' }); }
  await pg.evaluate(() => Views.pos.pay()); await sleep(300); await pg.click('#done'); await sleep(800);
  console.log('4. sale saved with auto customer:', await pg.evaluate(() => { var c = Cust.byPhone('01011112222'); return c && c.points; }));
  await sleep(1500); console.log('4b. receipt popup + no print/save window:', await pg.evaluate(() => !!document.querySelector('.rpop') && document.getElementById('rpSt').textContent), ' (linux → graceful):', JSON.stringify(await pg.evaluate(() => IPC.invoke('drawer', {}))));
  // restart keeps everything, no what's-new again
  await pg.evaluate(() => Store.saveNow()); await app.close().catch(() => { }); await sleep(1500);
  [app, pg] = await start(); await sleep(2500); await pg.fill('#lp', '1234'); await pg.click('#lb'); await sleep(1500);
  console.log('6. after restart: customer kept:', await pg.evaluate(() => !!Cust.byPhone('01011112222')), '| no repeat popup:', await pg.evaluate(() => !/تم تحديث البرنامج/.test(document.body.innerText)));
  console.log('7. password copy (desktop AES):', await pg.evaluate(() => { var u = Store.db.users[0]; return u.pwEnc.slice(0, 3) + ' → ' + PwVault.dec(u.pwEnc); }));
  console.log(errs.length ? errs : 'no page errors'); await app.close().catch(() => { }); process.exit(0);
})();
