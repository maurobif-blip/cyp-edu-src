const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.click('text=Clement'); await p.waitForTimeout(300);
  await p.click('[data-tour=start]'); await p.waitForTimeout(400);
  const missing=[];
  for (let i = 0; i < 40; i++) {
    const info = await p.evaluate(() => [TT.i, location.hash, !!TOUR[TT.i].find(), document.querySelectorAll('.tour-dot').length, !!document.querySelector('.tour-hi')]);
    if (!info[2] || !info[4]) missing.push(info);
    if ([0,5,11,12,16,20,22].includes(i)) await p.screenshot({ path: `/home/claude/demo/t${i+1}.png` });
    const nx = await p.$('[data-tour=next]'); if (!nx) break; await nx.click(); await p.waitForTimeout(350);
  }
  console.log('steps without element:', JSON.stringify(missing));
  // dot click and wandering
  await p.evaluate(() => location.hash = '#/visits'); await p.waitForTimeout(300); console.log('mini bar:', !!(await p.$('.tour-mini')));
  await p.click('[data-tour=back]'); await p.waitForTimeout(300); console.log('back at', await p.evaluate(() => location.hash));
  await p.evaluate(() => location.hash = '#/pending'); await p.waitForTimeout(300); const dots = await p.$$('.tour-dot'); console.log('dots on pending', dots.length);
  await dots[dots.length - 1].click(); await p.waitForTimeout(300); console.log('dot ->', await p.evaluate(() => TT.i)); await p.screenshot({ path: '/home/claude/demo/t-dot.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(100); console.log('closed', await p.evaluate(() => TT.i === null && !document.querySelector('.tour-layer')));
  await p.setViewportSize({ width: 390, height: 844 }); await p.click('[data-tour=start]'); await p.waitForTimeout(400); await p.screenshot({ path: '/home/claude/demo/t-phone.png' });
  console.log('errors', errs); await b.close();
})();
