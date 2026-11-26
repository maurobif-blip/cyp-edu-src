const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(300); await p.click('.stile:has-text("Bernard Chabu")');
  const n = await p.evaluate(() => TOUR.length); const miss = [];
  for (let i = 0; i < n; i++) { const ok = await p.evaluate(async i => { const s = TOUR[i]; location.hash = s.go(); await new Promise(r => setTimeout(r, 350)); return !!s.find(); }, i); if (!ok) miss.push((i + 1) + ' ' + await p.evaluate(i => TOUR[i].t + ' ' + TOUR[i].go(), i)); }
  console.log('fresh demo, tour targets missing:', miss);
  await b.close();
})();
