const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true }); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  const url = 'file:///home/claude/demo/cicetekelo-records-DEMO.html';
  await p.goto(url); await p.screenshot({ path: '/home/claude/demo/d0-login.png' });
  await p.click('text=Bernard'); await p.waitForTimeout(400);
  const pages = ['home','pending','children','child/1169','attendance','visits','outreach','counseling','reports','reports?s=UCC&m=2026-10','reports?s=Luigi&m=2026-10','reports?s=History&h=Luigi','review','help'];
  for (const [i,pg] of pages.entries()) { await p.evaluate(h => location.hash = '#/' + h, pg); await p.waitForTimeout(350); await p.screenshot({ path: `/home/claude/demo/d${i+1}-${pg.replace(/[\/?=&]/g,'_')}.png`, fullPage: true }); }
  console.log(await p.evaluate(() => [IS_DEMO, DB_NAME, S.children.length, pendingData().urgent, Object.keys(S.attendance).length]));
  // real app DB untouched?
  const p2 = await ctx.newPage(); await p2.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p2.waitForTimeout(300); console.log('real app children:', await p2.evaluate(() => S.children.length), await p2.evaluate(() => IS_DEMO));
  // phone
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => location.hash = '#/home'); await p.waitForTimeout(300);
  console.log('overflow', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)); await p.screenshot({ path: '/home/claude/demo/d-phone.png' });
  console.log('errors', errs); await b.close();
})();
