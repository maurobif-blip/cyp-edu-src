const { chromium, devices } = require('playwright'); const fs = require('fs'), http = require('http'), path = require('path');
const ROOT = '/home/claude/finsrc/', PORT = 8871, WEB = `http://localhost:${PORT}/`;
(async () => {
  const web = http.createServer((q, r) => { let f = decodeURIComponent(q.url.split('?')[0]); if (f === '/') f = '/index.html'; const p = path.join(ROOT, f); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.statusCode = 404; return r.end('no'); } const e = path.extname(p); r.setHeader('Content-Type', e === '.html' ? 'text/html; charset=utf-8' : e === '.js' ? 'text/javascript' : e === '.png' ? 'image/png' : 'application/json'); r.end(fs.readFileSync(p)); }); await new Promise(r => web.listen(PORT, r));
  const b = await chromium.launch(); const errs = [];
  const DB = 'https://script.google.com/macros/s/TESTTESTTEST/exec', code = Buffer.from(DB + '|KEY123').toString('base64url'), link = WEB + '?db=' + code;
  const mk = async (dev, standalone, url, n) => { const ctx = await b.newContext({ ...devices[dev] }); await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: WEB.replace(/\/$/, '') }).catch(() => {}); if (standalone) await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource|Manifest/.test(m.text())) errs.push(n + ': ' + m.text()); });
    await p.route('https://script.google.com/**', route => { const req = JSON.parse(route.request().postData() || '{}'); route.fulfill({ contentType: 'application/json', body: JSON.stringify(req.key === 'KEY123' ? (req.action === 'hello' ? { ok: true, empty: false, users: [{ id: 'u1', name: 'Test Person', role: 'head', active: true }] } : { ok: true }) : { ok: false, error: 'key' }) }); });
    await p.goto(url); await p.waitForTimeout(1500); return p; };
  const man = p => p.evaluate(() => { const h = document.querySelector('link[rel=manifest]').getAttribute('href'); if (!h.startsWith('data:')) return h; const m = JSON.parse(decodeURIComponent(h.slice(h.indexOf(',') + 1))); return [m.start_url.replace(/db=.{8}.*/, 'db=…'), m.start_url === location.origin + location.pathname + location.search, m.icons.length]; });
  const st = p => p.evaluate(() => [FIN_VERSION, S.ui.screen, !!(S.cfg && S.cfg.mode === 'shared'), location.search.replace(/db=.*/, 'db=…'), document.querySelector('h1') && document.querySelector('h1').innerText]);
  const saf = await mk('iPhone 13', false, link, 'safari'); console.log('1 iPhone Safari with the link', await st(saf), 'manifest', await man(saf));
  await saf.reload(); await saf.waitForTimeout(1200); console.log('1 after a reload', await st(saf));
  const start = await saf.evaluate(() => JSON.parse(decodeURIComponent(document.querySelector('link[rel=manifest]').getAttribute('href').split(',').slice(1).join(','))).start_url);
  const icon = await mk('iPhone 13', true, start, 'icon'); console.log('2 icon made with the link', await st(icon));
  const bare = await mk('iPhone 13', true, WEB, 'bare'); console.log('3 icon without the link', await st(bare), await bare.evaluate(() => [[...document.querySelectorAll('main li')].map(l => l.innerText), [...document.querySelectorAll('main .card')][0].querySelectorAll('button').length, [...document.querySelectorAll('main button')].map(x => x.innerText).slice(0, 4), document.documentElement.scrollWidth <= innerWidth]));
  await bare.screenshot({ path: '/tmp/cyp-shots/fin-paste.png' });
  await bare.evaluate(t => navigator.clipboard.writeText(t), 'no link here'); await bare.click('[data-a=linkClip]'); await bare.waitForTimeout(400); console.log('3 wrong text', await bare.evaluate(() => [S.ui.screen, (document.querySelector('.box.err') || {}).innerText]));
  await bare.evaluate(t => navigator.clipboard.writeText(t), 'CYP FIN, to ask for money.\n1. Open this link with internet: ' + link + '\n2. Choose your name.'); await bare.click('[data-a=linkClip]'); await bare.waitForTimeout(1200); console.log('3 whole message pasted', await st(bare));
  /* the icon carries an old link, a newer one was pasted: the pasted one stays */
  const old = WEB + '?db=' + Buffer.from(DB + '|OLDKEY').toString('base64url'); await bare.goto(old); await bare.waitForTimeout(1200); console.log('4 icon with an old link after a new one was pasted: key kept', await bare.evaluate(() => [S.cfg.key, S.ui.screen]));
  const and = await mk('Pixel 5', false, link, 'android'); console.log('5 Android', await st(and), 'manifest', await man(and));
  console.log('errors', errs); await b.close(); web.close();
})();
