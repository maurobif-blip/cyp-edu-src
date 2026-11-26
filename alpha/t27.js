const { chromium, devices } = require('playwright'); const fs = require('fs'), http = require('http'), path = require('path'); const { start } = require('/home/claude/server/mock.js');
const ALPHA = 'file:///home/claude/alpha/cicetekelo-records-alpha.html', DBP = 8795, WEBP = 8801, EXEC = `http://127.0.0.1:${DBP}/exec?k=K`, WEB = `http://localhost:${WEBP}/`;
const SRC = '/home/claude/web/cyp-edu/', ROOT = require('fs').mkdtempSync(require('os').tmpdir() + '/t27-') + '/'; require('fs').cpSync(SRC, ROOT, { recursive: true }); /* a copy: the files that get published are never touched */ const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
(async () => {
  const mock = await start(DBP, 'K');
  const web = http.createServer((q, r) => { let f = decodeURIComponent(q.url.split('?')[0]); if (f === '/') f = '/index.html'; const p = path.join(ROOT, f); if (!p.startsWith(ROOT) || !fs.existsSync(p)) { r.statusCode = 404; return r.end('no'); } r.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream'); r.setHeader('Cache-Control', 'no-cache'); r.end(fs.readFileSync(p)); }); await new Promise(r => web.listen(WEBP, '127.0.0.1', r));
  const b = await chromium.launch(); const errs = [];
  const hook = (p, name) => { p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_INTERNET_DISCONNECTED|ERR_CONNECTION|Failed to load resource|ERR_EMPTY_RESPONSE|ERR_FAILED/.test(m.text())) errs.push(name + ': ' + m.text()); }); p.on('dialog', d => d.accept()); };
  const pin = async (p, who, code) => { await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(150); await p.fill('#pinin', code || require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(300); };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(300); };
  // office: local file, starts the shared database
  const octx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const office = await octx.newPage(); hook(office, 'office'); await office.goto(ALPHA); await office.waitForTimeout(400); await pin(office, 'Mauro');
  const v3 = JSON.parse(fs.readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json', 'utf8'));
  await office.evaluate(pk => { importStarterPack(pk); save(); }, v3); await office.waitForTimeout(700);
  await go(office, '#/sync'); await office.fill('form[data-form=synclink] [name=link]', EXEC); await office.click('form[data-form=synclink] button'); await office.waitForTimeout(600); await office.click('[data-sact=start]'); await office.waitForTimeout(1500);
  await office.evaluate(u => { S.settings.appUrl = u; save(); }, WEB); await go(office, '#/home'); await go(office, '#/sync'); await office.screenshot({ path: 'shots/Z-office-link.png', fullPage: true });
  const link = await office.evaluate(() => staffLink(appUrl())); console.log('staff link:', link.slice(0, 60) + '… (' + link.length + ' characters)');
  // phone: opens the link once, with a connection
  const pctx = await b.newContext({ ...devices['Pixel 5'] }); let phone = await pctx.newPage(); hook(phone, 'phone');
  await phone.goto(link); await phone.waitForTimeout(300); await phone.screenshot({ path: 'shots/Z-phone-first.png' });
  await phone.waitForFunction(() => typeof S !== 'undefined' && S && S.children && S.children.length > 0, null, { timeout: 20000 }); await phone.waitForTimeout(500);
  console.log('phone after opening the link:', await phone.evaluate(() => [location.href.replace(/c=.*/, 'c=…'), S.children.length, Object.keys(S.photos || {}).length, activeStaff().length, syncOn(), !!USER]));
  await phone.screenshot({ path: 'shots/Z-phone-login.png' });
  await pin(phone, 'Iness Phiri');
  await phone.waitForFunction(() => UI.offlineReady === true, null, { timeout: 15000 }); await phone.waitForTimeout(800);
  await go(phone, '#/sync'); await phone.screenshot({ path: 'shots/Z-phone-sync.png', fullPage: true });
  console.log('service worker ready, caches:', await phone.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks[0]); return [ks, (await c.keys()).length]; }));
  // ---- NO CONNECTION: reload, then close and open again
  await pctx.setOffline(true);
  await phone.reload(); await phone.waitForTimeout(900);
  console.log('offline reload:', await phone.evaluate(() => [document.querySelector('h1') && document.querySelector('h1').textContent, !!USER, S.children.length]));
  await phone.close(); phone = await pctx.newPage(); hook(phone, 'phone2');
  await phone.goto(WEB); await phone.waitForTimeout(900);
  console.log('offline, app closed and opened again:', await phone.evaluate(() => [document.querySelector('h1') && document.querySelector('h1').textContent, activeStaff().length, S.children.length]));
  await pin(phone, 'Iness Phiri'); await phone.screenshot({ path: 'shots/Z-phone-offline-home.png' });
  const ids = await phone.evaluate(() => ({ ucc: S.children.filter(c => c.section === 'UCC' && isCurrent(c) && c.residence === 'Resident').slice(0, 3).map(c => c.id), d: today() }));
  await go(phone, "#/attendance?c=Minsundu&av=day"); for (let i = 0; i < 3; i++) { await phone.evaluate(() => [...document.querySelectorAll('#attTable tbody tr:not(.gsep)')].filter(tr => !tr.querySelector('.att .on'))[0].querySelector('button.P').click()); await phone.waitForTimeout(150); }
  await go(phone, '#/visit/new?child=' + ids.ucc[0]); await phone.selectOption('[name=team]', 'Family'); await phone.selectOption('[name=purpose]', 'Follow-up'); await phone.fill('[name=findings]', 'Written without a connection'); await phone.tap('form[data-form=visit] button.pri'); await phone.waitForTimeout(300);
  await go(phone, '#/child/new'); await phone.fill('[name=name]', 'Offlinechild'); await phone.selectOption('[name=sex]', 'F'); await phone.selectOption('[name=section]', 'Nkwazi'); await phone.tap('form[data-form=child] button.pri'); await phone.waitForTimeout(400);
  await phone.evaluate(() => syncNow()); await phone.waitForTimeout(500); await go(phone, '#/home');
  console.log('offline, after recording:', await phone.evaluate(() => [SY.state, countText(buildChanges().count), (document.querySelector('.main .warn') || {}).innerText]));
  await phone.screenshot({ path: 'shots/Z-phone-offline-recorded.png' });
  await phone.close(); await phone.waitForTimeout && 0;
  // office meanwhile sees nothing
  await office.evaluate(() => syncNow()); await office.waitForTimeout(400); console.log('office before the phone is back online: visits', await office.evaluate(() => S.visits.length), 'children', await office.evaluate(() => S.children.length));
  // ---- CONNECTION BACK: the phone is opened, nothing is touched
  await pctx.setOffline(false); phone = await pctx.newPage(); hook(phone, 'phone3'); await phone.goto(WEB); await phone.waitForTimeout(600);
  let sent = -1; const t0 = Date.now(); for (let i = 0; i < 40; i++) { await phone.waitForTimeout(500); if (await phone.evaluate(() => syncOn() && pendingCount() === 0 && SY.state === 'ok')) { sent = Math.round((Date.now() - t0) / 100) / 10; break; } }
  console.log('connection back: everything sent by itself after', sent, 'seconds (the PIN was not even typed yet)');
  await office.evaluate(() => syncNow()); await office.waitForTimeout(500);
  console.log('office now:', await office.evaluate(ids => ({ visits: S.visits.map(v => v.findings), child: S.children.filter(c => c.name === 'Offlinechild').map(c => c.id + ' ' + c.section), present: Object.values(S.attendance[ids.d] || {}).join('') }), ids));
  // ---- a new version of the app reaches the phone by itself
  const idx = ROOT + 'index.html', sw = ROOT + 'sw.js', h0 = fs.readFileSync(idx, 'utf8'), s0 = fs.readFileSync(sw, 'utf8');
  fs.writeFileSync(idx, h0.replace(/const VERSION = '[^']+';/, "const VERSION = 'test-new-version';")); fs.writeFileSync(sw, s0.replace(/const V = '[^']+';/, "const V = 'cyp-edu-newtest';"));
  await phone.reload(); await phone.waitForTimeout(2500); await phone.reload(); await phone.waitForTimeout(1200);
  console.log('after an update of the app on the web address, the phone runs:', await phone.evaluate(() => VERSION), '| records still there:', await phone.evaluate(() => S.children.length));
  fs.writeFileSync(idx, h0); fs.writeFileSync(sw, s0);
  console.log('errors', errs);
  await b.close(); mock.srv.close(); web.close();
})();
