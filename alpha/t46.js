const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const srv = spawn('python3', ['-m', 'http.server', '8767'], { cwd: '/home/claude/web/cyp-edu', stdio: 'ignore' });
(async () => {
  const dir = '/tmp/cyp-shots/profile-offline'; fs.rmSync(dir, { recursive: true, force: true });
  // day 1: first opening, with internet
  await new Promise(r => setTimeout(r, 1200));
  let ctx = await chromium.launchPersistentContext(dir, { viewport: { width: 1300, height: 800 } }); let p = ctx.pages()[0] || await ctx.newPage();
  await p.goto('http://localhost:8767/'); await p.waitForTimeout(2500);
  const d1 = await p.evaluate(async () => { const reg = await navigator.serviceWorker.ready; S.children.push({ id: 'T1', name: 'Test', surname: 'Offline', section: 'Nkwazi', residence: 'Non-resident', status: 'Active' }); S.attendance['2000-01-07'] = { T1: 'P' }; save(); await new Promise(r => setTimeout(r, 800)); return { version: VERSION, sw: !!reg.active, caches: (await caches.keys()).length, offlineReady: UI.offlineReady, children: S.children.length }; });
  console.log('day 1, online:', JSON.stringify(d1));
  await ctx.close();                                   // the computer is switched off
  srv.kill();                                          // and there is no internet any more
  await new Promise(r => setTimeout(r, 800));
  // two days later: the computer is switched on, no internet
  ctx = await chromium.launchPersistentContext(dir, { viewport: { width: 1300, height: 800 } }); p = ctx.pages()[0] || await ctx.newPage();
  let err = ''; try { await p.goto('http://localhost:8767/', { timeout: 15000 }); } catch (e) { err = e.message.split('\n')[0]; }
  await p.waitForTimeout(1500);
  const d2 = await p.evaluate(() => ({ opened: typeof VERSION !== 'undefined' ? VERSION : null, title: document.title, children: typeof S !== 'undefined' ? S.children.length : null, markStillThere: typeof S !== 'undefined' ? (S.attendance['2000-01-07'] || {}).T1 : null, screen: document.body.innerText.slice(0, 60).replace(/\n/g, ' | ') })).catch(e => ({ fail: String(e).slice(0, 80) }));
  console.log('2 days later, offline:', err || 'page opened', JSON.stringify(d2));
  // she works offline, closes again, reopens offline
  await p.evaluate(() => { S.attendance['2000-01-08'] = { T1: 'A' }; save(); }); await p.waitForTimeout(800); await ctx.close();
  ctx = await chromium.launchPersistentContext(dir, { viewport: { width: 1300, height: 800 } }); p = ctx.pages()[0] || await ctx.newPage();
  try { await p.goto('http://localhost:8767/#/home', { timeout: 15000 }); } catch (e) {} await p.waitForTimeout(1200);
  console.log('third opening, still offline:', JSON.stringify(await p.evaluate(() => ({ opened: VERSION, day2mark: (S.attendance['2000-01-08'] || {}).T1 }))));
  await ctx.close();
})();
