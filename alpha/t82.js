/* iPhone: the icon on the Home Screen is another app with empty memory. The link must travel with it. */
const { chromium, devices } = require('playwright'); const fs = require('fs'), http = require('http'), path = require('path'); const { start } = require('/home/claude/server/mock.js');
const PIN = require('/home/claude/cyp-edu-src/alpha/pin.js');
const ALPHA = 'file:///home/claude/alpha/cicetekelo-records-alpha.html', DBP = 8851, WEBP = 8852, EXEC = `http://127.0.0.1:${DBP}/exec?k=K`, WEB = `http://localhost:${WEBP}/`;
const ROOT = '/home/claude/web/cyp-edu/'; const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
(async () => {
  const mock = await start(DBP, 'K');
  const web = http.createServer((q, r) => { let f = decodeURIComponent(q.url.split('?')[0]); if (f === '/') f = '/index.html'; const p = path.join(ROOT, f); if (!p.startsWith(ROOT) || !fs.existsSync(p)) { r.statusCode = 404; return r.end('no'); } r.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream'); r.setHeader('Cache-Control', 'no-cache'); r.end(fs.readFileSync(p)); }); await new Promise(r => web.listen(WEBP, r));
  const b = await chromium.launch(); const errs = [];
  const hook = (p, n) => { p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource|Manifest/.test(m.text())) errs.push(n + ': ' + m.text()); }); p.on('dialog', d => d.accept()); };
  const pin = async (p, who) => { await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(150); await p.fill('#pinin', PIN); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(500); };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(400); };
  const short = h => h.startsWith('#c=') ? '#c=…(' + h.length + ')' : h;
  /* office starts the shared database (locked) */
  const office = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); hook(office, 'office'); await office.goto(ALPHA); await office.waitForTimeout(600); await pin(office, 'Clement');
  await office.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await office.waitForTimeout(600);
  await go(office, '#/sync'); await office.fill('form[data-form=synclink] [name=link]', EXEC); await office.click('form[data-form=synclink] button'); await office.waitForTimeout(700); await office.click('[data-sact=start]'); await office.waitForTimeout(2000);
  const link = await office.evaluate(u => staffLink(u), WEB), code = link.split('#c=')[1];
  console.log('invite text for the iPhone', await office.evaluate(u => inviteText(staffLink(u)).split('\n').filter(l => /iPhone/.test(l))[0], WEB));

  /* 1. iPhone in Safari: opens the link */
  const iph = { ...devices['iPhone 13'] };
  const sctx = await b.newContext(iph); const saf = await sctx.newPage(); hook(saf, 'safari'); await saf.goto(link);
  await saf.waitForFunction(() => typeof S !== 'undefined' && S && S.children && S.children.length > 0, null, { timeout: 20000 }); await saf.waitForTimeout(600);
  const man = async p => { const h = await p.evaluate(() => document.querySelector('link[rel=manifest]').getAttribute('href')); if (!h.startsWith('data:')) return h; const m = JSON.parse(decodeURIComponent(h.slice(h.indexOf(',') + 1))); return { start: m.start_url.replace(/#c=.*/, '#c=…'), sameCode: m.start_url.endsWith('#c=' + code), scope: m.scope, icons: m.icons.map(i => i.src.replace(/^.*\//, '')) }; };
  console.log('1 safari on the opening screen', await saf.evaluate(() => [installKind(), isInstalled(), S.children.length, !!document.querySelector('.stile')]), short(await saf.evaluate(() => location.hash)), 'address has the link', (await saf.evaluate(() => location.hash)) === '#c=' + code);
  console.log('1 manifest', await man(saf));
  await pin(saf, 'Bernard');
  console.log('1 after the PIN: page', await saf.evaluate(() => [route().path, !!document.getElementById('installcard'), document.querySelector('#installcard') && document.querySelector('#installcard').innerText.replace(/\s+/g, ' ').slice(0, 110)]), 'address', short(await saf.evaluate(() => location.hash)));
  await go(saf, '#/children'); console.log('1 another page', await saf.evaluate(() => [route().path, location.hash, document.querySelector('h1').innerText]));
  await go(saf, '#/home'); console.log('1 back on Home: address', short(await saf.evaluate(() => location.hash)), 'route', await saf.evaluate(() => route().path));
  await saf.reload(); await saf.waitForTimeout(1200); console.log('1 after a reload', short(await saf.evaluate(() => location.hash)), await saf.evaluate(() => [syncOn(), S.children.length]));
  /* a comment made on Home must not carry the link */
  await saf.evaluate(() => { USER = S.staff.find(s => s.admin); render(); }); 
  console.log('1 comment page', await saf.evaluate(() => { const src = fbMode.toString() + (typeof fbSave === 'function' ? fbSave.toString() : ''); return /\^#c=/.test(document.documentElement.innerHTML) ; }));

  /* 2. the icon on the Home Screen: a new empty memory, started from the address the icon was made from */
  const standalone = async (url, n) => { const ctx = await b.newContext(iph); await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: WEB.replace(/\/$/, '') }).catch(() => {}); await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); }); const p = await ctx.newPage(); hook(p, n); await p.goto(url); await p.waitForTimeout(1500); return p; };
  const startUrl = JSON.parse(decodeURIComponent((await saf.evaluate(() => document.querySelector('link[rel=manifest]').getAttribute('href'))).split(',').slice(1).join(','))).start_url;
  const icon = await standalone(startUrl, 'icon'); await icon.waitForFunction(() => typeof S !== 'undefined' && S && S.children && S.children.length > 0, null, { timeout: 20000 }).catch(() => {}); await icon.waitForTimeout(500);
  console.log('2 icon made with the link', await icon.evaluate(() => [isInstalled(), syncOn(), lockOn(), S.children.length, location.hash, !!document.querySelector('.stile')]));
  await pin(icon, 'Bernard'); console.log('2 inside', await icon.evaluate(() => [route().path, location.hash, !!document.getElementById('installcard')]));

  /* 3. the icon made without the link (the case of today): one button */
  const bare = await standalone(WEB, 'bare');
  console.log('3 icon without the link', await bare.evaluate(() => { const c = document.getElementById('linkask'); return c ? [c.querySelector('h2').innerText, [...c.querySelectorAll('li')].map(l => l.innerText), [...c.querySelectorAll('button')].map(x => x.innerText)] : document.body.innerText.slice(0, 200); }));
  await bare.screenshot({ path: '/tmp/cyp-shots/iphone-paste.png' });
  await bare.evaluate(t => navigator.clipboard.writeText(t), 'hello, this is not a link'); await bare.click('[data-wact=linkpaste]'); await bare.waitForTimeout(500);
  console.log('3 wrong text copied', await bare.evaluate(() => [(document.querySelector('.toast, #toast') || {}).innerText, !!syncCfg()]));
  await bare.evaluate(t => navigator.clipboard.writeText(t), 'CYP EDU, the app of the Education Department.\n1. Open this link: ' + link + '\n2. Keep it'); await bare.click('[data-wact=linkpaste]');
  await bare.waitForFunction(() => typeof S !== 'undefined' && S && S.children && S.children.length > 0, null, { timeout: 20000 }).catch(() => {}); await bare.waitForTimeout(600);
  console.log('3 after Paste the link (the whole message was copied)', await bare.evaluate(() => [syncOn(), lockOn(), S.children.length, !!document.querySelector('.stile')]));
  const fits = await bare.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

  /* 4. the key is changed: the icon still starts with the old link; the new one is pasted and stays */
  await go(office, '#/home'); await go(office, '#/sync'); await office.evaluate(() => { document.getElementById('lockbox').open = true; }); office.removeAllListeners('dialog'); office.on('dialog', d => d.type() === 'prompt' ? d.accept('LOCK') : d.accept()); await office.click('#lockbox button'); await office.waitForTimeout(2500);
  const link2 = await office.evaluate(u => staffLink(u), WEB);
  await pin(bare, 'Bernard'); await bare.evaluate(() => syncNow()); await bare.waitForTimeout(1500); await go(bare, '#/sync');
  console.log('4 old key', await bare.evaluate(() => [SY.state, SY.lock, (document.querySelector('section.card[style*="red"] h2') || {}).innerText, !!document.querySelector('section.card[style*="red"] [data-wact=linkpaste]'), !!document.querySelector('section.card[style*="red"] form[data-form=synclink]')]), 'fits', await bare.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await bare.evaluate(t => navigator.clipboard.writeText(t), link2); await bare.click('section.card[style*="red"] [data-wact=linkpaste]'); await bare.waitForTimeout(3000);
  console.log('4 new link pasted', await bare.evaluate(() => [SY.state, SY.lock, syncOn(), S.children.length]));
  const key2 = await bare.evaluate(() => syncCfg().enc);
  await bare.goto(startUrl); await bare.reload(); await bare.waitForTimeout(1500);
  console.log('4 icon opened again with its old link: the new key stays', await bare.evaluate(k => [syncCfg().enc === k, location.hash], key2));

  /* 4b. the key changes again while the Android app is open: the new link is tapped, the page does not load again */
  const a2 = await (await b.newContext({ ...devices['Pixel 5'] })).newPage(); hook(a2, 'android2'); await a2.goto(link2); await a2.waitForFunction(() => typeof S !== 'undefined' && S && S.children && S.children.length > 0, null, { timeout: 20000 }); await pin(a2, 'Bernard');
  await a2.evaluate(l => { location.hash = '#c=' + l.split('#c=')[1]; }, link); await a2.waitForTimeout(600); console.log('4b an old link in the address does not replace a link that works', await a2.evaluate(k => [syncCfg().enc === k, route().path], key2));
  await go(office, '#/home'); await go(office, '#/sync'); await office.evaluate(() => { document.getElementById('lockbox').open = true; }); await office.click('#lockbox button'); await office.waitForTimeout(2500); const link3 = await office.evaluate(u => staffLink(u), WEB);
  await a2.evaluate(() => syncNow()); await a2.waitForTimeout(1500); console.log('4b key changed', await a2.evaluate(() => [SY.state, SY.lock]));
  await a2.evaluate(l => { location.hash = '#c=' + l.split('#c=')[1]; }, link3); await a2.waitForTimeout(3500); console.log('4b new link tapped with the app open', await a2.evaluate(() => [SY.state, SY.lock, syncOn(), S.children.length, route().path]));
  /* 5. Android: as before */
  const actx = await b.newContext({ ...devices['Pixel 5'] }); const and = await actx.newPage(); hook(and, 'android'); await and.goto(link3); await and.waitForFunction(() => typeof S !== 'undefined' && S && S.children && S.children.length > 0, null, { timeout: 20000 }); await and.waitForTimeout(500);
  console.log('5 android', await and.evaluate(() => [installKind(), location.hash, document.querySelector('link[rel=manifest]').getAttribute('href'), S.children.length]));
  console.log('opening screen fits the phone', fits, 'errors', errs);
  await b.close(); mock.srv.close(); web.close();
})();
