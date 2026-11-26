// beta 1.8: the interactive report starts from the year (Mauro, 25/11): annual report figures, new logframe, then the month
const { chromium } = require('playwright'); const OUT = '/tmp/cyp-shots/';
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [w, tag] of [[393, 'ph'], [1366, 'pc']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 820 }, isMobile: w < 900, hasTouch: w < 900, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  await p.click('.stile:has-text("Clement")'); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', '0000'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); }
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(500); };
  const fits = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  await go('#/story'); console.log(tag, '0 cover:', (await p.evaluate(() => document.querySelector('#stchap').innerText)).replace(/\n/g, ' / ').slice(0, 220));
  console.log(tag, '  data:', JSON.stringify(await p.evaluate(() => { const Y = stYear('2026'); return { luigi: Y.luigi, school: Y.school, mins: Y.mins, fam: Y.family.n, sch: Y.schoolSec.n, lf: { reach: Y.lf.reach.n, rein: Y.lf.rein.n, pr: [Y.lf.pr.ok.length, Y.lf.pr.all.length], sport: Y.lf.sport.n } }; })));
  for (let i = 1; i <= 6; i++) { await go('#/story?y=2026&p=' + i); console.log(tag, i, (await p.evaluate(() => document.querySelector('.st-title').innerText + ' | ' + document.querySelector('.st-body').innerText.replace(/\n/g, ' / ').slice(0, 260))), '| fits', await fits());
    if (tag === 'ph' && i <= 3) await p.screenshot({ path: OUT + 'story-y' + i + '-ph.png', fullPage: true }); }
  console.log(tag, '  chapters:', await p.evaluate(() => [...document.querySelectorAll('.cyp-nav--chapters a')].map(a => a.innerText.replace(/\s+/g, ' ')).join(' | ')));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400); console.log(tag, '  arrow ->', await p.evaluate(() => location.hash));
  await go('#/story?m=2026-11&p=1'); console.log(tag, '7 month still works:', await p.evaluate(() => document.querySelector('.st-title').innerText), '| link to year', await p.locator('a[href^="#/story?y=2026"]').count());
  await go('#/story?y=2025&p=1'); console.log(tag, '8 year 2025:', await p.evaluate(() => document.querySelector('.st-title').innerText));
  if (tag === 'pc') { await go('#/story?y=2026&p=3'); await p.screenshot({ path: OUT + 'story-y3-pc.png' }); }
  await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
