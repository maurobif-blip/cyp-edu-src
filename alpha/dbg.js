const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext()).newPage(); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); await p.click('.stile:has-text("Bernard")'); await p.waitForTimeout(400);
  await p.evaluate(() => location.hash = '#/referrals'); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => ({ areas: staffAreas(USER), team: myTeam(), mine: REFER_TO.map(x => x[0]).filter(k => hasFlag(k)), q: String(route().q.get('to')), sel: document.querySelector('select[data-filter="to"]').value, hash: location.hash })));
  await b.close(); })();
