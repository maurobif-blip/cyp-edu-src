const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Galaxy S9+'] }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(400);
  const tag = process.argv[2] || 'M';
  await p.screenshot({ path: `shots/${tag}-login.png` });
  await p.tap('.stile:has-text("Iness Phiri")'); await p.waitForTimeout(300);
  const pages = [['home', '#/home'], ['todo', '#/pending'], ['att-luigi', '#/attendance?c=Luigi'], ['att-nkwazi', '#/attendance?c=Nkwazi'], ['visits', '#/visits?vt=all'], ['visits-need', '#/visits?vt=Family&vtab=need'], ['visits-plan', '#/visits?vt=all&vtab=plan'], ['visit-new', '#/visit/new'], ['children', '#/children'], ['child', '#/child/1169'], ['child-new', '#/child/new'], ['counseling', '#/counseling'], ['reports', '#/reports?s=Luigi'], ['att-grid', '#/attendance?c=Luigi&lt=day']];
  for (const [n, h] of pages) { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(400);
    const o = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (o[0] > o[1] + 1) console.log('OVERFLOW', n, o);
    await p.screenshot({ path: `shots/${tag}-${n}.png` }); }
  console.log('errors', errs); await b.close();
})();
