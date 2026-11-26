const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (opt) => { const ctx = await b.newContext({ acceptDownloads: true, ...opt }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const q = await mk({ viewport: { width: 1440, height: 900 } });
  console.log('staff', await q.evaluate(() => S.staff.filter(s => s.active !== false).map(s => s.name + ':' + staffAreas(s).join('/')).slice(0, 40).join(' | ')));
  await q.click('.stile:has-text("Clement")'); await q.waitForTimeout(300);
  await go(q, '#/pending'); console.log('admin todo', await q.evaluate(() => [[...document.querySelectorAll('.ovcard h2')].map(x => x.innerText), document.querySelector('.lead').innerText, [...document.querySelectorAll('nav a')].map(x => x.innerText.replace(/\n/g, ' '))]));
  const t0 = Date.now(); await q.evaluate(() => { for (let i = 0; i < 5; i++) render(); }); console.log('5 renders ms', Date.now() - t0);
  // Luigi report
  await go(q, '#/reports?s=Luigi'); console.log('luigi extra', await q.evaluate(() => { const h = [...document.querySelectorAll('h3')].find(x => /Relatives/.test(x.innerText)); return h.nextElementSibling.innerText.replace(/\n/g, ' | ').slice(0, 300); }), await q.evaluate(() => [...document.querySelectorAll('button')].filter(x => /Export/.test(x.innerText)).map(x => x.innerText)));
  let [dl] = await Promise.all([q.waitForEvent('download'), q.click('[data-lact=xlreportn]')]); await dl.saveAs('/tmp/cyp-shots/luigi-names.xlsx');
  [dl] = await Promise.all([q.waitForEvent('download'), q.click('[data-lact=xlreport]')]); await dl.saveAs('/tmp/cyp-shots/luigi-tables.xlsx');
  await go(q, '#/reports?s=Nkwazi'); [dl] = await Promise.all([q.waitForEvent('download'), q.click('[data-act=xlnames]')]); await dl.saveAs('/tmp/cyp-shots/nkz-names.xlsx');
  await go(q, '#/reports?s=Family&p=Q'); [dl] = await Promise.all([q.waitForEvent('download'), q.click('[data-act=xlnames]')]); await dl.saveAs('/tmp/cyp-shots/fam-names.xlsx');
  for (const s of ['UCC', 'Youth', 'School', 'Counseling', 'Table6']) { await go(q, '#/reports?s=' + s); console.log(s, await q.evaluate(() => !!document.querySelector('[data-act=xlnames]'))); if (s !== 'Table6') { [dl] = await Promise.all([q.waitForEvent('download'), q.click('[data-act=xlnames]')]); } }
  // street situation
  const lid = await q.evaluate(() => S.children.find(c => c.section === 'Luigi' && isCurrent(c) && c.streetCat === 'B').id);
  await go(q, '#/child/' + lid); console.log('chip before', await q.evaluate(() => [...document.querySelectorAll('.top .chip')].map(x => x.innerText)));
  await go(q, '#/child/' + lid + '/status'); await q.selectOption('form[data-form=street] select[name=cat]', 'A'); await q.click('form[data-form=street] button'); await q.waitForTimeout(400);
  console.log('chip after', await q.evaluate(() => [...document.querySelectorAll('.top .chip')].map(x => x.innerText)), await q.evaluate(id => [child(id).streetCat, movesOf(id).filter(m => m.type === 'street').length, document.body.innerText.includes('Street situation: A')], lid));
  await go(q, '#/child/' + lid + '/status'); await q.fill('form[data-form=reintegrate] input[name=date]', await q.evaluate(() => today())); await q.click('form[data-form=reintegrate] button'); await q.waitForTimeout(400);
  console.log('chip after reintegration', await q.evaluate(() => [...document.querySelectorAll('.top .chip')].map(x => x.innerText)));
  // month register
  await go(q, '#/attendance?c=Nkwazi&av=month'); const cell = await q.evaluate(() => { const td = document.querySelector('table.mreg td.mc'); return { d: td.dataset.d, id: td.dataset.id, n: document.querySelectorAll('table.mreg td.mc').length, fu: document.querySelectorAll('table.mreg td.fu').length }; });
  const seq = []; for (let i = 0; i < 5; i++) { await q.click(`table.mreg td.mc[data-d="${cell.d}"][data-id="${cell.id}"]`); await q.waitForTimeout(120); seq.push(await q.evaluate(c => (S.attendance[c.d] || {})[c.id] || '-', cell)); }
  console.log('month cells', cell, seq); await q.screenshot({ path: 'shots/R1.png' });
  await go(q, '#/attendance?c=Minsundu&av=month&g=Resident'); const c2 = await q.evaluate(() => { const td = document.querySelector('table.mreg td.mc'); return { d: td.dataset.d, id: td.dataset.id }; }); const s2 = []; for (let i = 0; i < 5; i++) { await q.click(`table.mreg td.mc[data-d="${c2.d}"][data-id="${c2.id}"]`); await q.waitForTimeout(120); s2.push(await q.evaluate(c => (S.attendance[c.d] || {})[c.id] || '-', c2)); } console.log('minsundu residents', s2);
  // a person who is not a supervisor
  const who = await q.evaluate(() => S.staff.filter(s => s.active !== false && !s.admin && staffAreas(s).length).map(s => [s.name, staffAreas(s).join('/')]).filter(x => /^(Nkwazi|Luigi|Family|Minsundu)$/.test(x[1])).slice(0, 12));
  console.log('non-admin candidates', JSON.stringify(who));
  for (const nm of [who.find(x => x[1] === 'Nkwazi'), who.find(x => x[1] === 'Family'), who.find(x => x[1] === 'Luigi')].filter(Boolean)) {
    const p2 = await mk({ ...devices['Pixel 5'] }); await p2.tap(`.stile:has-text("${nm[0].split(' ')[0]}")`); await p2.waitForTimeout(400);
    await go(p2, '#/pending'); console.log(nm.join(' = '), '->', await p2.evaluate(() => [USER && USER.name, [...document.querySelectorAll('.ovcard h2')].map(x => x.innerText), document.querySelector('.lead').innerText, todoCount(), pendingData().urgent, (document.querySelector('.mnav i') || {}).innerText]));
    if (nm[1] === 'Nkwazi') { await p2.screenshot({ path: 'shots/R2.png' }); await go(p2, '#/attendance?c=Nkwazi&av=month'); await p2.screenshot({ path: 'shots/R3.png' }); }
    await p2.context().close();
  }
  console.log('errors', errs.slice(0, 6)); await b.close();
})();
