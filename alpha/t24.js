const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(300); await p.click('.stile:has-text("Bernard Chabu")');
  await p.evaluate(() => location.hash = '#/attendance?c=Luigi'); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => { const e = document.querySelector('#lattBody'); const chain = []; let x = e; while (x && x.id !== 'app') { chain.push(x.tagName + '.' + x.className); x = x.parentElement; } return chain.join(' < '); }));
  await b.close();
})();
