const { chromium } = require('playwright'); const { spawn } = require('child_process');
const srv = spawn('python3', ['-m', 'http.server', '8768'], { cwd: '/home/claude/web/cyp-edu', stdio: 'ignore' });
(async () => { await new Promise(r => setTimeout(r, 1200)); const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  await p.goto('http://localhost:8768/'); await p.waitForTimeout(2500);
  console.log(await p.evaluate(() => { const before = UI.offlineReady; UI.offlineReady = false; const a = offlineCard().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); UI.offlineReady = true; const b2 = offlineCard().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); lsSet('cyp-offline-seen', '1'); const c = offlineCard(); lsSet('cyp-offline-seen', null); return { readyAfterLoad: before, notReady: a, ready: b2, afterOk: c === '' }; }));
  await b.close(); srv.kill(); })();
