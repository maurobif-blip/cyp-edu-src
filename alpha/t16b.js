const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(300); await p.click('.stile:has-text("Bernard Chabu")');
  for (const h of ['#/visits', '#/visits?vt=all', '#/pending', '#/attendance?c=Nkwazi', '#/attendance?c=Luigi', '#/home']) {
    await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(300);
    console.log(h, await p.evaluate(() => { const w = innerWidth; const out = []; for (const el of document.querySelectorAll('.main *')) { const r = el.getBoundingClientRect(); if (r.right > w + 1 && !el.closest('.tw')) out.push(el.tagName + '.' + el.className + ' ' + Math.round(r.right)); } return [document.documentElement.scrollWidth, out.slice(0, 6)]; }));
  }
  await p.evaluate(() => location.hash = '#/visits'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/V-phone-visits.png', fullPage: true });
  await b.close();
})();
