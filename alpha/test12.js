const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.click('text=Mauro (evaluation)');
  const fs=require('fs'); const v2 = JSON.parse(fs.readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-09-v2.json','utf8'));
  console.log('v2 state:', await p.evaluate(pk => { importStarterPack(pk); return [S.children.length, S.outreach.length]; }, v2));
  await p.goto(url + '#/staff/data');
  await p.setInputFiles('#starterfile', '/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json');
  await p.waitForFunction(() => /Loaded/.test(document.querySelector('#startermsg')?.textContent || ''), null, { timeout: 20000 });
  console.log((await p.textContent('#startermsg')).slice(0, 700));
  console.log(await p.evaluate(() => { const sx = l => l.filter(c=>c.sex==='F').length; const L = S.children.filter(c=>c.section==='Luigi');
    const show = (a,b) => { const T = luigiTables(a,b); return T.main.slice(5).map(r => r.slice(1).join(' ')).join(' | '); };
    return { children: S.children.length, luigi: L.length, active: L.filter(isCurrent).length, photos: Object.keys(S.photos).length, sessions: S.outreach.length,
      oct: show('2026-10-01','2026-10-31'), q3: show('2026-07-01','2026-09-30'), sem: show('2026-01-01','2026-06-30'), nine: show('2026-01-01','2026-09-30'), year: show('2026-01-01','2026-12-31'),
      origin: luigiTables('2026-10-01','2026-10-31').origin.map(r=>r.join(' ')).join(' / ') }; }));
  // second load: nothing new
  console.log('reload:', await p.evaluate(pk => { const o = importStarterPack(pk).luigiDb; return [o.added, o.updated, o.marks, o.sessions, S.children.length]; }, JSON.parse(fs.readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json','utf8'))));
  const shot = async (h, n, full) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/L-' + n + '.png', fullPage: !!full }); };
  await shot('#/attendance?c=Luigi', 'att-today'); await shot('#/attendance?c=Luigi&lt=day&lm=2026-10', 'att-day');
  // click a cell
  const cell = await p.$('table.lgrid tbody tr:nth-child(3) td.lc:nth-child(12)'); const before = await cell.textContent(); await cell.click(); const a1 = await cell.textContent(); await cell.click(); const a2 = await cell.textContent(); await cell.click();
  console.log('cell cycle:', JSON.stringify([before, a1, a2, await cell.textContent()]));
  await p.fill('#knownq', 'humphrey malata'); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/L-known.png' });
  console.log('known:', (await p.textContent('#knownbox')).replace(/\s+/g,' ').slice(0, 300));
  await shot('#/attendance?c=Luigi&lm=2026-10&lt=night', 'att-night');
  await shot('#/attendance?c=Luigi&lt=sum', 'att-sum');
  await shot('#/attendance?c=Nkwazi', 'att-nkwazi');
  await shot('#/reports?s=Luigi&m=2026-10', 'rep-oct', true);
  await shot('#/reports?s=Luigi&m=2026-09&p=9', 'rep-9m', true);
  await shot('#/reports?s=UCC&m=2026-06&p=S', 'rep-ucc-sem');
  await shot('#/child/L5085', 'child', true);
  await shot('#/child/L5085/edit', 'child-edit', true);
  await shot('#/home', 'home'); await shot('#/pending', 'pending');
  const [dl] = await Promise.all([p.waitForEvent('download'), (async () => { await p.evaluate(() => location.hash = '#/reports?s=Luigi&m=2026-10'); await p.waitForTimeout(300); await p.click('[data-lact=xlreport]'); })()]);
  await dl.saveAs('shots/luigi-report.xlsx');
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => location.hash = '#/attendance?c=Luigi'); await p.waitForTimeout(300);
  console.log('phone overflow', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log('errors', errs); await b.close();
})();
