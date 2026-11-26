const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.click('text=Mauro (evaluation)');
  const pk = JSON.parse(require('fs').readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-09-v2.json','utf8'));
  await p.evaluate(pk => importStarterPack(pk), pk); await p.waitForTimeout(500);
  await p.evaluate(() => { location.hash = '#/children'; }); await p.waitForTimeout(200);
  await p.evaluate(() => { location.hash = '#/home'; }); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/90-home-sex.png' });
  await p.evaluate(() => { location.hash = '#/children'; }); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/91-children-sex.png' });
  await b.close();
})();
