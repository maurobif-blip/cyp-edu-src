const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const errs = [];
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(300); await p.click('.stile:has-text("Bernard Chabu")');
  const n = await p.evaluate(() => TOUR.length); const miss = [];
  for (let i = 0; i < n; i++) { const ok = await p.evaluate(async i => { const s = TOUR[i]; location.hash = s.go(); await new Promise(r => setTimeout(r, 350)); return !!s.find(); }, i); if (!ok) miss.push(i + 1); }
  console.log('tour steps', n, 'targets missing', miss);
  // real data
  const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message)); q.on('dialog', d => d.accept());
  await q.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await q.waitForTimeout(300); await q.click('.stile:has-text("Mauro")');
  const v3 = JSON.parse(require('fs').readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json','utf8'));
  await q.evaluate(pk => { importStarterPack(pk); save(); }, v3); await q.waitForTimeout(500);
  // old-style plan and visit, as saved by 0.6
  await q.evaluate(() => { const l = S.children.find(c => c.section === 'Luigi' && isCurrent(c)), u = S.children.find(c => c.section === 'UCC' && isCurrent(c)); S.plans = [{ id: 'px1', childId: l.id, month: thisMonth(), purpose: 'Assessment' }, { id: 'px2', childId: u.id, month: thisMonth(), purpose: 'Follow-up' }]; S.visits.push({ id: 'vx1', childId: l.id, date: today(), purpose: 'Assessment', where: 'Home', by: USER.id, successful: 'Yes' }); save(); });
  await q.evaluate(() => location.hash = '#/visits'); await q.waitForTimeout(400); await q.screenshot({ path: 'shots/R-visits.png', fullPage: true });
  console.log('real visits', await q.evaluate(() => [JSON.stringify(visitSel(route().q)), plans().map(planTeam).join(','), S.visits.map(visitTeam).join(','), document.querySelectorAll('#plan .cgrp').length, [...document.querySelectorAll('#plan .it')].map(x => x.querySelector('.tm').textContent).join(',')]));
  await q.evaluate(() => location.hash = '#/attendance?c=Luigi&ld=2026-10-14'); await q.waitForTimeout(500); await q.screenshot({ path: 'shots/R-luigi.png' });
  console.log('real luigi 14 Oct', await q.evaluate(() => [...document.querySelectorAll('#lsheets .tile')].map(x => x.innerText.replace(/\n/g, ' / ')).join(' || ')), await q.evaluate(() => document.querySelectorAll('#lattBody tbody tr').length));
  await q.evaluate(() => location.hash = '#/attendance?c=Nkwazi'); await q.waitForTimeout(300); console.log('real nkwazi', await q.evaluate(() => [...document.querySelectorAll('.top .seg')][1].textContent));
  await q.evaluate(() => location.hash = '#/reports?s=Luigi&m=2026-10'); await q.waitForTimeout(500);
  console.log('real staff table', await q.evaluate(() => { const h = [...document.querySelectorAll('h3')].find(x => x.textContent.startsWith('Who did')); return h.nextElementSibling.innerText.replace(/\n/g, ' / ').replace(/\t/g, ' ').slice(0, 300); }));
  console.log('oct main total', await q.evaluate(() => { const t = luigiTables('2026-10-01', '2026-10-31'); return t.main[t.main.length - 1].join(','); }));
  console.log('errors', errs); await b.close();
})();
