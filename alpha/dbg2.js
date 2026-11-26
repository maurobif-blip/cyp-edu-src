const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); await p.click('.stile:has-text("Bernard")'); await p.waitForTimeout(400);
  const k = await p.evaluate(() => S.children.find(c => needsVisits(c)).id); await p.evaluate(h => location.hash = h, '#/visit/new?child=' + k + '&t=Family'); await p.waitForTimeout(500);
  await p.fill('[name="findings"]', 'x'); await p.click('form[data-form="visit"] button.pri'); await p.waitForTimeout(600);
  console.log(await p.evaluate(() => ({ hash: location.hash, invalid: [...document.querySelectorAll('form[data-form="visit"] :invalid')].map(e => e.name), toast: (document.querySelector('.toast') || {}).innerText, n: S.visits.filter(v => v.date === today()).length })));
  await b.close(); })();
