const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const errs = [];
  const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message)); q.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); q.on('dialog', d => d.accept());
  await q.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await q.waitForTimeout(300); await q.click('.stile:has-text("Mauro")'); await q.waitForTimeout(150); await q.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await q.click('form[data-form=pinlogin] button.pri'); await q.waitForTimeout(250);
  const v3 = JSON.parse(require('fs').readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json','utf8'));
  await q.evaluate(pk => { importStarterPack(pk); save(); }, v3); await q.waitForTimeout(500);
  const go = async h => { await q.evaluate(h => location.hash = h, h); await q.waitForTimeout(400); };
  await go('#/pending'); await q.screenshot({ path: 'shots/R-todo.png', fullPage: true });
  console.log(await q.evaluate(() => [...document.querySelectorAll('.ovcard')].map(c => c.querySelector('h2').textContent + ': ' + [...c.querySelectorAll('.al')].map(a => a.innerText.replace(/\n/g, ' ').replace(' ›', '')).join(' | ')).join('\n')));
  console.log('real: ABA', await q.evaluate(() => S.children.filter(isAba).length), 'programmes', await q.evaluate(() => JSON.stringify(S.children.reduce((o, c) => { for (const p of c.programmes || []) o[p] = (o[p] || 0) + 1; return o; }, {}))));
  console.log('real back candidates', await q.evaluate(() => S.children.filter(c => backAuto(c)).map(c => [c.id, c.whereNow, c.closeDate, backAuto(c).date, backAuto(c).why].join(' ')).slice(0, 40)));
  for (const h of ['#/visits', '#/visits?vtab=need', '#/visits?vtab=plan', '#/visits?vtab=actions', '#/children?grp=backq&status=all', '#/attendance?c=Minsundu', '#/attendance?c=Luigi', '#/reports?s=Luigi&m=2026-10', '#/reports?s=Family&aba=1', '#/counseling', '#/home']) await go(h);
  console.log('oct main total', await q.evaluate(() => { const t = luigiTables('2026-10-01', '2026-10-31'); return t.main[t.main.length - 1].join(','); }));
  console.log('errors', errs); await b.close();
})();
