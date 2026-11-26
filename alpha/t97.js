// beta 1.8: Clement (25/11) approves a section report as it is, and Undo next to it
const { chromium } = require('playwright'); const OUT = '/tmp/cyp-shots/';
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [w, tag] of [[393, 'ph'], [1366, 'pc']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 820 }, isMobile: w < 900, hasTouch: w < 900, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  const login = async who => { await p.evaluate(() => { if (typeof USER !== 'undefined' && USER) { USER = null; render(); } }); await p.waitForTimeout(200); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', '0000'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); } };
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(450); };
  const card = () => p.evaluate(() => { const c = document.querySelector('#repflow'); return c ? c.innerText.replace(/\s+/g, ' ').slice(0, 200) : 'no card'; });
  const btns = () => p.evaluate(() => [...document.querySelectorAll('#repflow button')].map(x => x.textContent).join(' / '));
  const m = '2026-11';
  await login('Clement'); await go('#/reports?s=UCC&m=' + m); console.log(tag, '1 not sent, office:', await card(), '|', await btns());
  await p.click('#repflow [data-v=check]'); await p.waitForTimeout(400); console.log(tag, '2 approved as it is:', await card(), '|', await btns(), '| locked', await p.evaluate(m => repLocked(m, 'UCC'), m));
  await p.click('#repflow [data-v=undo]'); await p.waitForTimeout(400); console.log(tag, '3 undo:', await card(), '|', await btns(), '| locked', await p.evaluate(m => repLocked(m, 'UCC'), m));
  await login('Lewis'); await go('#/reports?s=UCC&m=' + m); console.log(tag, '4 section sees:', await btns());
  await p.click('#repflow [data-v=send]'); await p.waitForTimeout(300); await p.click('#dlg .ok'); await p.waitForTimeout(400);
  await login('Clement'); await go('#/reports?s=UCC&m=' + m); console.log(tag, '5 sent, office:', await btns());
  await p.click('#repflow [data-v=check]'); await p.waitForTimeout(400); await p.click('#repflow [data-v=undo]'); await p.waitForTimeout(400); console.log(tag, '6 approve + undo -> back to sent:', await card(), '|', await btns());
  await p.click('#repflow [data-v=back]'); await p.waitForTimeout(300); await p.fill('#dlg textarea', 'Add the visits of week 2'); await p.click('#dlg .ok'); await p.waitForTimeout(400);
  await p.click('#repflow [data-v=undo]'); await p.waitForTimeout(400); console.log(tag, '7 send back + undo -> sent:', await card());
  // old marks: an old checked mark can be undone too
  await p.evaluate(() => { S.reports['2026-09'] = S.reports['2026-09'] || {}; S.reports['2026-09'].Luigi = { prepared: { by: 's3', date: '2026-10-02' }, checked: { by: 's2', date: '2026-10-05' } }; save(); });
  await go('#/reports?s=Luigi&m=2026-09'); console.log(tag, '8 old mark:', await card(), '| undo button', await p.locator('#repflow [data-v=undo]').count());
  if (tag === 'ph') { await go('#/reports?s=UCC&m=' + m); await p.click('#repflow [data-v=check]'); await p.waitForTimeout(400); await (await p.$('#repflow')).screenshot({ path: OUT + 'rep97-ph.png' }); }
  await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
