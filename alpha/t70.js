const { chromium } = require('playwright'); const fs = require('fs'); const SP = '/tmp/cyp-shots/';
(async () => {
  const b = await chromium.launch(); const errs = []; const p = await (await b.newContext({ viewport: { width: 393, height: 850 }, deviceScaleFactor: 2 })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', x => x.accept());
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400);
  await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(700);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const info = () => p.evaluate(() => { const d = document.querySelector('.cyp-pager[aria-label="Month of the plan"]'); return d ? [d.className, '', d.querySelector('.cyp-pager__now').innerText, d.querySelectorAll('.cyp-btn').length, document.querySelector('.ppick') ? document.querySelector('.ppick').dataset.m : '', document.documentElement.scrollWidth <= innerWidth + 1] : 'no bar'; });
  await go('#/visits?vt=Family&vtab=plan'); console.log('this month', await info());
  await p.click('.cyp-pager a.cyp-btn:has-text("After")'); await p.waitForTimeout(400); console.log('next', await info()); await p.screenshot({ path: SP + 'month-next.png' });
  await p.click('.cyp-pager a.cyp-btn:has-text("After")'); await p.waitForTimeout(400); console.log('two ahead', await info());
  await p.click('.cyp-pager a.cyp-btn:has-text("Before")'); await p.waitForTimeout(400); console.log('back', await info());
  await p.click('.cyp-pager a.cyp-btn:has-text("Before")'); await p.waitForTimeout(400); console.log('last month', await info());
  await p.click('.cyp-pager a.cyp-btn:has-text("Before")'); await p.waitForTimeout(400); console.log('older', await info());
  await go('#/visits?vt=Family'); console.log('visits done keeps the small month picker', await p.evaluate(() => [!document.querySelector('.cyp-pager[aria-label="Month of the plan"]'), !!document.querySelector('.top .seg[aria-label="Month"]')]));
  await go('#/visits?vt=Family&vtab=need'); console.log('other tabs: no month', await p.evaluate(() => [!document.querySelector('.cyp-pager[aria-label="Month of the plan"]'), !document.querySelector('.top .seg[aria-label="Month"]')]));
  await p.setViewportSize({ width: 1440, height: 900 }); await go('#/visits?vt=Family&vtab=plan&m=2026-12'); console.log('computer', await info());
  console.log('errors', errs); await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 500)); process.exit(1); });
