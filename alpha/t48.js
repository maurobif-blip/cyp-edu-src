const { chromium, devices } = require('playwright'); const { spawn } = require('child_process');
const srv = spawn('python3', ['-m', 'http.server', '8769'], { cwd: '/home/claude/web/cyp-edu', stdio: 'ignore' });
(async () => { await new Promise(r => setTimeout(r, 1200)); const b = await chromium.launch(); const errs = [];
  for (const [n, opt] of [['Chrome desktop', { viewport: { width: 1300, height: 800 } }], ['iPhone', devices['iPhone 13']], ['Mac Safari', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', viewport: { width: 1300, height: 800 } }]]) {
    const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('http://localhost:8769/'); await p.waitForTimeout(1500);
    console.log(n, '|', await p.evaluate(() => { const txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); const r = { kind: installKind(), noOffer: txt(installCard(true)) || '(no card)' }; _installEvt = { prompt() {} }; r.withOffer = txt(installCard(true)); _installEvt = null; lsSet('cyp-installed', '1'); r.afterInstall = txt(installCard(true)) || '(no card)'; lsSet('cyp-installed', null); r.morePage = installCard() !== ''; return JSON.stringify(r); }));
    await p.context().close(); }
  console.log('errors', errs); await b.close(); srv.kill(); })();
