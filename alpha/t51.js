const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (opt, who) => { const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); if (opt.isMobile) await p.tap(`.stile:has-text("${who}")`); else await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(400); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const q = await mk({ viewport: { width: 1440, height: 900 } }, 'Clement');
  /* Monitoring */
  for (const t of ['Family', 'School', 'Others', 'all']) { await go(q, '#/visits?vt=' + t); console.log('centres', t, await q.evaluate(() => [...document.querySelectorAll('#vchoose .cbtns a b')].map(x => x.innerText).join(' | '))); }
  await go(q, '#/visits?vt=Family&vc=Luigi'); console.log('family+vc=Luigi ->', await q.evaluate(() => document.querySelector('.vnow').innerText));
  console.log('luigi kids in family lists', await q.evaluate(() => { const m = planMonth(); addPlan(S.children.find(c => c.section === 'Luigi' && isCurrent(c)).id, m, 'Family'); const r = { planFamily: planFor(m, 'Family', 'all').filter(p => centreOf(child(p.childId)) === 'Luigi').length, planAll: planFor(m, 'all', 'all').filter(p => centreOf(child(p.childId)) === 'Luigi').length, need: visitNeed('Family', 'all').due.concat(visitNeed('Family', 'all').never).filter(x => centreOf(x.c) === 'Luigi').length }; return r; }));
  for (const t of ['Family', 'Others', 'all']) { await go(q, '#/visits?vt=' + t + '&m=2026-10'); console.log('visits done', t, await q.evaluate(() => document.querySelector('.main h2').innerText)); }
  /* Minsundu registers */
  await go(q, '#/attendance?c=Minsundu&av=day');
  console.log('minsundu', await q.evaluate(() => [document.querySelector('h1').innerText, [...document.querySelectorAll('.attctl .seg')].map(s => s.innerText.replace(/\n/g, ' | ')).slice(0, 2).join(' || '), [...document.querySelectorAll('.grid.g4 .tile span:first-of-type')].map(x => x.innerText).join(','), [...document.querySelectorAll('#attTable tbody tr:not(.gsep)')].length, [...document.querySelectorAll('#attTable tbody tr:not(.gsep) .att')][0].innerText.replace(/\n/g, ',')]));
  console.log('counts', await q.evaluate(() => { const cur = S.children.filter(isCurrent), n = g => cur.filter(c => attIn(c, 'Minsundu', g)).length; return { UCC: n('UCC'), Youth: n('Youth'), NonRes: n('Non-resident'), All: n('All'), sum: n('UCC') + n('Youth') + n('Non-resident') }; }));
  for (const g of ['Youth', 'Non-resident', 'All']) { await go(q, '#/attendance?c=Minsundu&av=day&g=' + g); console.log(g, await q.evaluate(() => [document.querySelector('h1').innerText, [...document.querySelectorAll('.grid.g4 .tile span:first-of-type')].map(x => x.innerText).join(','), document.querySelectorAll('#attTable tbody tr:not(.gsep)').length, [...new Set([...document.querySelectorAll('#attTable tbody tr:not(.gsep) .att')].map(x => x.innerText.replace(/\n/g, ',')))].join(' / ')])); }
  await go(q, '#/attendance?c=Minsundu&av=day&g=UCC');
  const id = await q.evaluate(() => document.querySelector('#attTable button[data-v="B"]').dataset.id);
  await q.click(`#attTable button[data-id="${id}"][data-v="B"]`); await q.waitForTimeout(300);
  console.log('boarding mark', await q.evaluate(id => [S.attendance[today()][id], document.querySelector('.grid.g4').innerText.replace(/\n+/g, ' ')], id));
  await go(q, '#/attendance?c=Minsundu&av=month&g=UCC');
  console.log('month', await q.evaluate(() => [[...document.querySelectorAll('table.mreg thead th')].slice(-3).map(x => x.innerText + '=' + x.title).join(','), document.querySelectorAll('table.mreg td.mB').length, document.querySelector('#attTable p.sub').innerText]));
  const cell = await q.$('table.mreg td.mB'); await cell.click(); await q.waitForTimeout(300);
  console.log('cycle after B', await q.evaluate(id => (S.attendance[today()] || {})[id] || '(empty)', id));
  /* literacy class */
  console.log('literacy', await q.evaluate(() => { const cur = S.children.filter(isCurrent); const l = cur.filter(c => attCentres(c).includes('Literacy')); if (!l.length) { const c = cur.find(c => c.section === 'UCC'); c.schoolType = 'Minsundu school'; const d = cur.find(c => c.section === 'Nkwazi'); d.schoolType = 'Literacy class (Minsundu)'; save(); } const l2 = S.children.filter(c => isCurrent(c) && attCentres(c).includes('Literacy')); return { before: l.length, now: l2.length, labels: [...new Set(l2.map(c => dayLabel(dayType(c))))], keys: l2.slice(0, 2).map(c => attKey(c, 'Literacy')), inMinsunduAll: S.children.filter(c => isCurrent(c) && centreOf(c) !== 'Minsundu' && attIn(c, 'Minsundu', 'All')).length, opts: dayOpts().map(o => o.l).join(' | ') }; }));
  await go(q, '#/attendance?c=Literacy&av=day');
  console.log('literacy page', await q.evaluate(() => [document.querySelector('h1').innerText, [...document.querySelectorAll('.attctl .seg')][0].innerText.replace(/\n/g, ' | '), document.querySelectorAll('#attTable tbody tr:not(.gsep)').length, [...document.querySelectorAll('.filters label')].map(x => x.childNodes[0].textContent).join(','), [...document.querySelectorAll('#attTable tbody tr:not(.gsep) .att')][0].innerText.replace(/\n/g, ',')]));
  const lk = await q.evaluate(() => document.querySelector('#attTable button[data-v="P"]').dataset.id);
  await q.click(`#attTable button[data-id="${lk}"][data-v="P"]`); await q.waitForTimeout(300);
  console.log('literacy mark', lk, await q.evaluate(k => S.attendance[today()][k], lk));
  await go(q, '#/child/' + lk.split('@')[0]); console.log('file', await q.evaluate(() => document.querySelector('.where3').innerText.replace(/\n+/g, ' | ')));
  await go(q, '#/'); console.log('home minsundu card', await q.evaluate(() => [...document.querySelectorAll('a')].filter(a => /Attendance/.test(a.innerText) && /Minsundu|Literacy/.test(a.getAttribute('href') || '')).map(a => a.innerText).join(' | ')));
  /* phone, quick marking */
  const ph = await mk({ ...devices['Pixel 7'] }, 'Maxwell');
  await go(ph, '#/attendance?c=Minsundu');
  console.log('phone', await ph.evaluate(() => [document.querySelector('h1').innerText, document.querySelector('.qchips').innerText.replace(/\n/g, ' | '), document.querySelectorAll('.qrow').length]));
  await ph.tap('.qchips a:nth-child(2)'); await ph.waitForTimeout(300);
  console.log('phone youth', await ph.evaluate(() => [document.querySelector('h1').innerText, document.querySelectorAll('.qrow').length]));
  await ph.tap('.qrow .qmore'); await ph.waitForTimeout(250);
  console.log('phone other', await ph.evaluate(() => document.querySelector('.qopts').innerText.replace(/\n/g, ' | ')));
  await ph.screenshot({ path: '/tmp/cyp-shots/t51-phone.png' });
  await go(q, '#/attendance?c=Minsundu&av=day&g=UCC'); await q.screenshot({ path: '/tmp/cyp-shots/t51-ucc.png' });
  await go(q, '#/visits?vt=Family'); await q.screenshot({ path: '/tmp/cyp-shots/t51-mon.png' });
  console.log('errors', errs.length, errs.slice(0, 4));
  await b.close();
})();
