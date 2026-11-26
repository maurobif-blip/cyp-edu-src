const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200); await p.addStyleTag({ content: '.demobar{display:none!important}' });
  await p.screenshot({ path: '/home/claude/mob/login.png' }); console.log('login overflow', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
  const c2 = await b.newContext({ viewport: { width: 1366, height: 800 } }); const q = await c2.newPage(); await q.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await q.waitForTimeout(1200);
  await q.evaluate(() => { USER = S.staff.find(s => s.active !== false && !s.admin && mainFlag(s) === 'Nkwazi'); location.hash = '#/children'; render(); }); await q.waitForTimeout(500); await q.addStyleTag({ content: '.demobar{display:none!important}' });
  await q.screenshot({ path: '/home/claude/mob/pc-children.png' }); await b.close(); })();
