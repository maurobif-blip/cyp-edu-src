const { chromium, devices } = require('playwright'); const fs = require('fs'), http = require('http'), path = require('path'); const { start } = require('/home/claude/server/mock.js');
const ROOT = '/home/claude/web/cyp-edu/';
(async () => { const mock = await start(8861, 'K'); const web = http.createServer((q, r) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; const p = path.join(ROOT, f); if (!fs.existsSync(p)) { r.statusCode = 404; return r.end('no'); } r.setHeader('Content-Type', f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream'); r.end(fs.readFileSync(p)); }); await new Promise(r => web.listen(8862, r));
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => console.log('LOG', m.type(), m.text().slice(0, 200)));
  const code = Buffer.from(JSON.stringify({ u: 'http://127.0.0.1:8861/exec', k: 'K' })).toString('base64url');
  await p.goto('http://localhost:8862/#c=' + code); await p.waitForTimeout(3000);
  console.log(await p.evaluate(() => ({ hash: location.hash.slice(0, 8), cfg: !!syncCfg(), ping: UI.syncPing, msg: UI.syncMsg, kind: installKind(), body: document.body.innerText.slice(0, 300) })));
  await b.close(); mock.srv.close(); web.close(); })();
