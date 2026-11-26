// Choice over selects with two or three answers: how many, and the value reaches the saved record
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  await p.evaluate(() => { USER = S.staff.find(s => s.admin); render(); });
  const kid = await p.evaluate(() => S.children.find(c => c.status !== 'Closed' && centreOf(c) === 'Minsundu').id);
  for (const h of ['#/visit/new?child=' + kid, '#/child/' + kid + '/edit', '#/child/new', '#/counseling/new?type=Individual', '#/tasks/new', '#/child/' + kid + '/status']) { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(500);
    console.log(h.slice(0, 26), await p.evaluate(() => ({ choices: [...document.querySelectorAll('.cyp-choice legend')].map(l => l.textContent + ':' + l.parentElement.querySelectorAll('input').length).slice(0, 9), selectsLeft: [...document.querySelectorAll('.main form select.in')].filter(s => !s.dataset.choice && s.offsetParent).length, fits: document.documentElement.scrollWidth <= innerWidth + 1 }))); }
  // a home visit: choose with the Choice, save, read the record
  await p.evaluate(x => { location.hash = x; }, '#/visit/new?child=' + kid); await p.waitForTimeout(500);
  const pick = await p.evaluate(() => { const fs = [...document.querySelectorAll('.cyp-choice')][0]; if (!fs) return null; const r = fs.querySelectorAll('input')[1]; r.click(); const sel = fs.previousElementSibling.querySelector('select'); return [fs.querySelector('legend').textContent, sel.name, sel.value, r.value]; });
  console.log('picked', pick);
  await p.evaluate(() => { const f = document.querySelector('.main form'); const t = f.querySelector('textarea'); if (t) t.value = 'Test of the choice'; });
  const before = await p.evaluate(() => S.visits.length); await p.evaluate(() => { const f = document.querySelector('.main form'); f.requestSubmit ? f.requestSubmit() : f.submit(); }); await p.waitForTimeout(700);
  console.log('saved', await p.evaluate(([n, name]) => { const v = S.visits[S.visits.length - 1]; return [S.visits.length - n, name, v && v[name]]; }, [before, pick && pick[1]]), 'invalid', await p.evaluate(() => (document.querySelector('.main form :invalid') || {}).name || null));
  console.log('errors', errs); await b.close(); })();
