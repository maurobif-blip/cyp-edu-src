const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.click('text=Mauro (evaluation)');
  const pk = JSON.parse(require('fs').readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-09-v2.json','utf8'));
  await p.evaluate(pk => importStarterPack(pk), pk);
  await p.goto(url + '#/home'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/90-home-sex.png' });
  await p.goto(url + '#/children?sex=F'); await p.waitForTimeout(300); console.log(await p.textContent('.lead')); await p.screenshot({ path: 'shots/91-children-sex.png' });
  await p.fill('#search', 'kabwe'); await p.waitForTimeout(200); console.log(await p.textContent('.lead'));
  await p.goto(url + '#/attendance'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/92-att-sex.png' });
  await p.setViewportSize({ width: 390, height: 844 }); await p.goto(url + '#/children'); await p.waitForTimeout(300);
  console.log('overflow', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log(await p.evaluate(() => { const x = sexSplit(S.children.filter(isCurrent)); return x; }));
  console.log('errors', errs); await b.close();
})();
