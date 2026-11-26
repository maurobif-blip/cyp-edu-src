const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 5'], deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(400);
  await p.screenshot({ path: 'shots/P-login.png' });
  await p.tap('.stile:has-text("Iness Phiri")'); await p.waitForTimeout(300);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(400); };
  await go('#/attendance?c=Luigi'); for (const i of [4, 9]) { await p.tap(`#lattBody tbody tr:nth-child(${i}) [data-lact=day]`); await p.waitForTimeout(120); }
  await p.screenshot({ path: 'shots/P-luigi.png', fullPage: true, clip: { x: 0, y: 0, width: 393, height: 1500 } });
  await go('#/attendance?c=Nkwazi'); await p.tap('[data-act=allpresent]'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/P-nkwazi.png', fullPage: true, clip: { x: 0, y: 0, width: 393, height: 1500 } });
  await go('#/children'); await p.screenshot({ path: 'shots/P-children.png', fullPage: true, clip: { x: 0, y: 0, width: 393, height: 1500 } });
  await go('#/visits?vt=all'); await p.screenshot({ path: 'shots/P-visits.png', fullPage: true, clip: { x: 0, y: 0, width: 393, height: 1500 } });
  await go('#/more'); await p.tap('.main [data-act=logout]'); await p.waitForTimeout(200); await p.tap('[data-act=guest]'); await p.waitForTimeout(500); await go('#/children'); await p.screenshot({ path: 'shots/P-guest.png', fullPage: true, clip: { x: 0, y: 0, width: 393, height: 1500 } });
  console.log('errors', errs); await b.close();
})();
