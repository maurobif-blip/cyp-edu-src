const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const SP = '/tmp/cyp-shots/';
  const mk = async (opt, who) => { const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); if (opt.isMobile) await p.tap(`.stile:has-text("${who}")`); else await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(400); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const photo = p => p.evaluate(() => { const cv = document.createElement('canvas'); cv.width = 210; cv.height = 280; const x = cv.getContext('2d'); x.fillStyle = '#C96'; x.fillRect(0, 0, 210, 280); x.fillStyle = '#333'; x.beginPath(); x.arc(105, 110, 60, 0, 7); x.fill(); const u = cv.toDataURL('image/jpeg', .7); const kids = S.children.filter(c => needsVisits(c)).slice(0, 400); for (const c of kids) photos()[c.id] = u; save(); render(); return kids[0].id; });
  const q = await mk({ viewport: { width: 1440, height: 900 } }, 'Clement');
  const id = await photo(q);
  await go(q, '#/child/' + id);
  console.log('file: photo with class', await q.evaluate(() => { const i = document.querySelector('.top img.cph'); return i ? [i.width, getComputedStyle(i).cursor, i.dataset.name] : null; }));
  await q.click('.top img.cph'); await q.waitForTimeout(250);
  console.log('open', await q.evaluate(() => { const d = document.getElementById('phbox'); if (!d) return null; const i = d.querySelector('img').getBoundingClientRect(); return { w: Math.round(i.width), h: Math.round(i.height), cap: d.querySelector('figcaption').innerText, focus: document.activeElement.innerText, hash: location.hash }; }));
  await q.screenshot({ path: SP + 't53-big.png' });
  await q.keyboard.press('Escape'); await q.waitForTimeout(150); console.log('esc closes', await q.evaluate(() => !document.getElementById('phbox')));
  await q.click('.top img.cph'); await q.waitForTimeout(200); await q.mouse.click(40, 40); await q.waitForTimeout(200); console.log('click outside closes, stays on file', await q.evaluate(() => [!document.getElementById('phbox'), location.hash]));
  await q.click('.top img.cph'); await q.waitForTimeout(200); await q.click('#phbox button'); await q.waitForTimeout(200); console.log('Close button', await q.evaluate(() => !document.getElementById('phbox')));
  /* list rows */
  await go(q, '#/visits?vtab=need'); const n = await q.evaluate(() => document.querySelectorAll('.it img.cph').length);
  if (n) { await q.click('.it img.cph'); await q.waitForTimeout(200); console.log('list photo opens', n, await q.evaluate(() => [!!document.getElementById('phbox'), location.hash])); await q.keyboard.press('Escape'); }
  /* planner tile still toggles */
  await go(q, '#/visits?vtab=plan&m=2026-12&vt=Family'); const before = await q.evaluate(() => plans().length);
  await q.click('.ptile img.cph'); await q.waitForTimeout(300); console.log('planner tile: plan +1, no big photo', await q.evaluate(b => [plans().length - b, !document.getElementById('phbox')], before));
  /* phone: quick marking still marks, file photo opens */
  const ph = await mk({ ...devices['Pixel 7'] }, 'Maxwell'); const pid = await photo(ph);
  await go(ph, '#/attendance?c=Minsundu'); const k = await ph.evaluate(() => { const r = document.querySelector('.qrow .qmain img.cph'); return r ? r.closest('.qmain').dataset.id : null; });
  if (k) { await ph.tap('.qrow .qmain img.cph'); await ph.waitForTimeout(300); console.log('phone quick marking by photo', await ph.evaluate(k => [(S.attendance[today()] || {})[k], !document.getElementById('phbox')], k)); } else console.log('no photo row in quick marking');
  await go(ph, '#/child/' + pid); await ph.tap('.top img.cph'); await ph.waitForTimeout(250);
  console.log('phone open', await ph.evaluate(() => { const i = document.querySelector('#phbox img').getBoundingClientRect(); return [Math.round(i.width), Math.round(i.height), window.innerWidth]; }));
  await ph.screenshot({ path: SP + 't53-phone.png' });
  await ph.tap('#phbox img'); await ph.waitForTimeout(200); console.log('phone tap closes', await ph.evaluate(() => !document.getElementById('phbox')));
  console.log('errors', errs.length, errs.slice(0, 3));
  await b.close();
})();
