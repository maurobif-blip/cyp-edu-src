const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const SP = '/tmp/cyp-shots/';
  const mk = async (opt, who) => { const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); if (opt.isMobile) await p.tap(`.stile:has-text("${who}")`); else await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(400); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const q = await mk({ viewport: { width: 1440, height: 1000 } }, 'Clement');
  const tiles = () => q.evaluate(() => [document.querySelector('h1').innerText, [...document.querySelectorAll('.grid.g4 .tile')].map(t => t.innerText.replace(/\n/g, ' ')).join(' | '), [...document.querySelectorAll('table.mt thead th')].map(x => x.innerText).join(','), document.querySelectorAll('table.mt tbody tr').length]);
  for (const c of ['Luigi', 'Minsundu', 'Nkwazi']) { await go(q, '#/paths?ps=' + c); console.log(c, await tiles()); }
  await go(q, '#/paths?ps=Minsundu');
  console.log('seg', await q.evaluate(() => [document.querySelector('.top .seg').innerText.replace(/\n/g, ' | '), [...document.querySelectorAll('.top select')].map(s => [...s.options].map(o => o.text).join('/')).join(' || ')]));
  console.log('right side', await q.evaluate(() => { const x = pathSel(route().q), F = flowCentre('Minsundu', x.a, x.b); return { here: F.here, out: F.outBy, in: F.inBy, start: F.start, rows: F.rows.length }; }));
  /* old way for comparison: UCC + Youth separately */
  console.log('old separate', await q.evaluate(() => { const x = pathSel(route().q), U = flowData('UCC', x.a, x.b), Y = flowData('Youth', x.a, x.b); const n = o => Object.values(o).reduce((a, b) => a + b, 0); return { uccRows: U.rows.length, youthRows: Y.rows.length, uccOut: U.outBy, youthIn: Y.inBy }; }));
  /* a move UCC -> Youth must not count as out/in at Minsundu */
  const r1 = await q.evaluate(() => { const x = pathSel(route().q), before = flowCentre('Minsundu', x.a, x.b); const c = S.children.find(c => c.section === 'UCC' && isCurrent(c)); FORMS.move({ id: c.id, to: 'Youth', date: today(), residence: c.residence, note: '' }); const after = flowCentre('Minsundu', x.a, x.b); const n = o => Object.values(o).reduce((a, b) => a + b, 0); const sp = centreSpans(c); return { id: c.id, rowsSame: before.rows.length === after.rows.length, outSame: n(before.outBy) === n(after.outBy), inSame: n(before.inBy) === n(after.inBy), spans: sp.length, lastSec: sp[sp.length - 1].sec, old: flowData('UCC', x.a, x.b).outBy }; });
  console.log('UCC->Youth', r1);
  /* filters */
  await go(q, '#/paths?ps=Minsundu&pk=Youth'); console.log('Youth', await tiles());
  await go(q, '#/paths?ps=Minsundu&pr=Resident'); console.log('Residents', await tiles());
  await go(q, '#/paths?ps=Minsundu'); await q.screenshot({ path: SP + 't54-paths.png', fullPage: true });
  /* resident -> non-resident: no discharge */
  const kid = await q.evaluate(() => S.children.find(c => centreOf(c) === 'Minsundu' && isCurrent(c) && c.residence === 'Resident').id);
  await go(q, '#/child/' + kid); const href = await q.evaluate(() => { const a = [...document.querySelectorAll('a')].find(a => /Change status or centre/.test(a.innerText)); return a ? a.getAttribute('href') : null; }); console.log('status link', href);
  await go(q, href); console.log('forms', await q.evaluate(() => [...document.querySelectorAll('form.card h2')].map(h => h.innerText).join(' | ')));
  const before = await q.evaluate(() => { const x = pathSel(new URLSearchParams('ps=Minsundu')), F = flowCentre('Minsundu', x.a, x.b); return { out: Object.values(F.outBy).reduce((a, b) => a + b, 0), here: F.here }; });
  await q.selectOption('form[data-form="resid"] select[name="to"]', 'Non-resident'); await q.click('form[data-form="resid"] button'); await q.waitForTimeout(400);
  console.log('non-resident', await q.evaluate(([id, before]) => { const c = child(id), x = pathSel(new URLSearchParams('ps=Minsundu')), F = flowCentre('Minsundu', x.a, x.b); return { res: c.residence, status: c.status, hash: location.hash, outSame: Object.values(F.outBy).reduce((a, b) => a + b, 0) === before.out, hereBefore: before.here, hereAfter: F.here, lastMove: moveLabel(movesOf(id).slice(-1)[0]), inNonResRegister: attIn(c, 'Minsundu', 'Non-resident') }; }, [kid, before]));
  /* transferred to another facility: closes */
  await go(q, href); await q.selectOption('form[data-form="resid"] select[name="to"]', 'facility'); await q.fill('form[data-form="resid"] input[name="note"]', 'Test facility'); await q.click('form[data-form="resid"] button'); await q.waitForTimeout(400);
  console.log('facility', await q.evaluate(id => { const c = child(id), x = pathSel(new URLSearchParams('ps=Minsundu')), F = flowCentre('Minsundu', x.a, x.b); return { status: c.status, reason: c.closeReason, out: F.outBy, label: moveLabel(movesOf(id).slice(-1)[0]) }; }, kid));
  /* non-Minsundu child has no resid form; close reasons label */
  const nk = await q.evaluate(() => S.children.find(c => c.section === 'Nkwazi' && isCurrent(c)).id); await go(q, href.replace(kid, nk));
  console.log('nkwazi child', await q.evaluate(() => [!!document.querySelector('form[data-form="resid"]'), [...document.querySelector('form[data-form="close"] select').options].map(o => o.text).filter(t => /Transferred/.test(t)).join(','), [...document.querySelector('form[data-form="close"] select').options].find(o => /Transferred/.test(o.text)).value]));
  /* report Nkwazi still works */
  await go(q, '#/reports?sec=Nkwazi'); console.log('report ok', await q.evaluate(() => document.querySelectorAll('table').length > 0));
  console.log('errors', errs.length, errs.slice(0, 4));
  await b.close();
})();
