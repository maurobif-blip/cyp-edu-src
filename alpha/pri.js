const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true })).newPage();
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  await p.evaluate(() => { USER = S.staff.find(s => s.admin); render(); });
  const kid = await p.evaluate(() => S.children.find(c => c.status !== 'Closed' && centreOf(c) === 'Minsundu').id);
  const pages = ['#/home', '#/home?v=centres', '#/pending', '#/attendance?c=Nkwazi', '#/attendance?c=Luigi', '#/children', '#/child/' + kid, '#/visits', '#/visits?vt=School', '#/visit', '#/school', '#/counseling', '#/counseling/new?type=Individual', '#/reports', '#/tasks', '#/tasks/new', '#/referrals', '#/monthly', '#/more', '#/staff', '#/sync', '#/help', '#/activities', '#/story?p=2'];
  const out = []; for (const h of pages) { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(350); out.push([h, await p.evaluate(() => [...document.querySelectorAll('.main .btn.pri, .main .cyp-btn--primary')].filter(e => e.offsetParent).length), await p.evaluate(() => [...document.querySelectorAll('.main .seg')].filter(e => e.offsetParent && e.children.length >= 2 && e.children.length <= 3).length)]); }
  console.log('pages', out.length, 'with 0:', out.filter(x => x[1] === 0).length, 'with 1:', out.filter(x => x[1] === 1).length, 'with 2+:', out.filter(x => x[1] > 1).map(x => x[0].slice(2, 22) + ' ' + x[1]).join(', '));
  console.log('selectors with 2 or 3 options:', out.reduce((s, x) => s + x[2], 0), 'on', out.filter(x => x[2]).length, 'pages'); await b.close(); })();
