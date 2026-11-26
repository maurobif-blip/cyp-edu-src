const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(300); await p.click('.stile:has-text("Bernard Chabu")');
  await p.click('.demobar button'); await p.waitForTimeout(400);
  for (let i = 0; i < 31; i++) { const t = await p.evaluate(() => (document.querySelector('.tour-pop h3, .tour-pop b') || {}).textContent); if (i === 5 || i === 6 || i === 7 || i === 30) console.log(i + 1, t, await p.evaluate(() => location.hash)); const nx = await p.$('.tour-pop [data-tour=next], .tour-pop button.pri'); if (!nx) { console.log('no next at', i + 1); break; } await nx.click(); await p.waitForTimeout(450); }
  await p.screenshot({ path: '/home/claude/alpha/shots/W-tour-end.png' });
  console.log('errors', errs); await b.close();
})();
