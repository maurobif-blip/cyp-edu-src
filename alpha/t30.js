const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (opt) => { const ctx = await b.newContext(opt); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const ph = await mk({ ...devices['Pixel 5'] }); await ph.tap('.stile:has-text("Clement")'); await ph.waitForTimeout(300);
  console.log('guests', await ph.evaluate(() => JSON.stringify({ atNkz: S.children.filter(c => isCurrent(c) && attCentres(c).includes('Nkwazi')).length, guestsNkz: S.children.filter(c => isCurrent(c) && alsoAt(c) === 'Nkwazi').map(c => c.section + '/' + c.residence), guestsMin: S.children.filter(c => isCurrent(c) && alsoAt(c) === 'Minsundu').length })));
  await go(ph, '#/attendance?c=Nkwazi');
  console.log('mode', await ph.evaluate(() => [document.querySelector('h1').innerText, !!document.querySelector('.qtop'), document.querySelectorAll('.qrow').length, document.querySelector('.qcount').innerText, document.querySelector('.hd').offsetHeight, document.documentElement.scrollWidth - innerWidth]));
  await ph.screenshot({ path: 'shots/Q1.png' });
  // scroll, tap a name, check scroll stays and the row leaves the list
  await ph.evaluate(() => window.scrollTo(0, 900)); await ph.waitForTimeout(200);
  const before = await ph.evaluate(() => { const r = [...document.querySelectorAll('.qrow')].find(x => x.getBoundingClientRect().top > 300); return { y: scrollY, name: r.querySelector('b').innerText, id: r.querySelector('.qmain').dataset.id, n: document.querySelectorAll('.qrow').length }; });
  await ph.tap(`.qmain[data-id="${before.id}"]`); await ph.waitForTimeout(300);
  console.log('after tap', before, await ph.evaluate(id => ({ y: scrollY, n: document.querySelectorAll('.qrow').length, mark: (S.attendance[today()] || {})[id], count: document.querySelector('.qcount').innerText.replace(/\n/g, ' ') }), before.id));
  await ph.screenshot({ path: 'shots/Q2.png' });
  await ph.tap('[data-act=qundo]'); await ph.waitForTimeout(300);
  console.log('undo', await ph.evaluate(id => (S.attendance[today()] || {})[id], before.id));
  // search then tap: the box empties and keeps the focus
  await ph.evaluate(() => window.scrollTo(0, 0)); const nm = before.name.split(' ')[0].slice(0, 4);
  await ph.fill('#attsearch', nm); await ph.waitForTimeout(250);
  console.log('search', nm, await ph.evaluate(() => document.querySelectorAll('.qrow').length));
  await ph.screenshot({ path: 'shots/Q3.png' });
  await ph.tap('.qrow .qmain'); await ph.waitForTimeout(300);
  console.log('after search tap', await ph.evaluate(() => [document.querySelector('#attsearch').value, document.activeElement && document.activeElement.id]));
  // other mark
  await ph.tap('.qrow .qmore'); await ph.waitForTimeout(200); await ph.screenshot({ path: 'shots/Q4.png' });
  console.log('opts', await ph.evaluate(() => [...document.querySelectorAll('.qopts .btn')].map(x => x.innerText)));
  await ph.tap('.qopts .btn.S'); await ph.waitForTimeout(300);
  // class chip, then the others absent
  await ph.tap('.qchips a:nth-child(3)'); await ph.waitForTimeout(300);
  const c1 = await ph.evaluate(() => [document.querySelector('.qchips a.on').innerText, document.querySelectorAll('.qrow').length]);
  await ph.tap('[data-act=qrest][data-v=A]'); await ph.waitForTimeout(400);
  console.log('chip + rest', c1, await ph.evaluate(() => [document.querySelector('.qcount').innerText.replace(/\n/g, ' '), document.querySelectorAll('.qrow').length]));
  await ph.tap('.qtop .seg a:nth-child(2)'); await ph.waitForTimeout(300); await ph.screenshot({ path: 'shots/Q5.png' });
  // residents coming from Minsundu
  await go(ph, '#/attendance?c=Nkwazi&g=Resident'); console.log('nkz residents', await ph.evaluate(() => [document.querySelector('h1').innerText, document.querySelectorAll('.qrow').length, (document.querySelector('.qrow small') || {}).innerText]));
  const g = await ph.evaluate(() => { const c = S.children.find(c => isCurrent(c) && alsoAt(c) === 'Nkwazi'); return { id: c.id, key: attKey(c, 'Nkwazi'), home: attKey(c, 'Minsundu') }; });
  await ph.tap(`.qmain[data-id="${g.key}"]`); await ph.waitForTimeout(300);
  console.log('guest marks', await ph.evaluate(g => [(S.attendance[today()] || {})[g.key], (S.attendance[today()] || {})[g.home]], g));
  await go(ph, '#/attendance?c=Minsundu'); console.log('minsundu', await ph.evaluate(() => [document.querySelector('h1').innerText, [...document.querySelectorAll('.qchips a')].map(x => x.innerText), document.querySelectorAll('.qrow').length]));
  await ph.tap('.qchips a:nth-child(2)'); await ph.waitForTimeout(300); console.log('ucc', await ph.evaluate(() => [document.querySelectorAll('.qrow').length, document.querySelector('.qcount').innerText.replace(/\n/g, ' ')])); await ph.screenshot({ path: 'shots/Q6.png' });
  await go(ph, '#/child/' + g.id); await ph.screenshot({ path: 'shots/Q7.png' }); console.log('where', await ph.evaluate(() => document.querySelector('.where3').innerText.replace(/\n/g, ' | ')));
  await go(ph, '#/attendance?c=Minsundu&av=day'); console.log('full list rows', await ph.evaluate(() => document.querySelectorAll('#attTable tbody tr:not(.gsep)').length));
  await go(ph, '#/attendance?c=Nkwazi&av=month'); console.log('month rows', await ph.evaluate(() => document.querySelectorAll('table.mreg tbody tr').length));
  const q = await mk({ viewport: { width: 1440, height: 900 } }); await q.click('.stile:has-text("Clement")'); await q.waitForTimeout(300);
  await go(q, '#/attendance?c=Nkwazi'); console.log('desktop', await q.evaluate(() => [document.querySelector('h1').innerText, !!document.querySelector('.qtop'), document.querySelectorAll('#attTable tbody tr:not(.gsep)').length, document.querySelector('.nav').offsetHeight])); await q.screenshot({ path: 'shots/Q8.png' });
  await go(q, '#/attendance?c=Nkwazi&av=quick'); await q.screenshot({ path: 'shots/Q9.png' });
  await go(q, '#/help'); await q.evaluate(() => document.querySelector('#sections').scrollIntoView()); await q.screenshot({ path: 'shots/Q10.png' });
  await go(q, '#/child/' + g.id + '/edit'); console.log('form', await q.evaluate(() => !!document.querySelector('select[name=schoolType]')));
  await go(q, '#/pending'); await go(q, '#/reports?s=Nkwazi'); await go(q, '#/children?section=Minsundu');
  console.log('errors', errs.slice(0, 6)); await b.close();
})();
