const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (opt, who) => { const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); if (opt.isMobile) await p.tap(`.stile:has-text("${who}")`); else await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(400); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const SP = '/tmp/cyp-shots/';
  const q = await mk({ viewport: { width: 1440, height: 1000 } }, 'Bernard');
  await go(q, '#/visits?vtab=plan&m=2026-12');
  const info = () => q.evaluate(() => ({ h2: document.querySelector('#plan h2').innerText, sub: document.querySelector('#plan .sub').innerText, segs: [...document.querySelectorAll('#ppick .seg')].map(s => s.innerText.replace(/\n/g, ' | ')), tiles: document.querySelectorAll('.ptile').length, inPlan: document.querySelectorAll('.ptile.in').length, first: [...document.querySelectorAll('.ptile')].slice(0, 4).map(t => t.innerText.replace(/\n/g, ' / ')), more: (document.querySelector('#ppick a.btn') || {}).innerText }));
  console.log('family dec', await info());
  await q.click('.ptile:nth-child(1)'); await q.waitForTimeout(300); await q.click('.ptile:nth-child(3)'); await q.waitForTimeout(300);
  console.log('after 2 taps', await q.evaluate(() => ({ plan: planFor('2026-12', 'Family', 'all').length, in: document.querySelectorAll('.ptile.in').length, sub: document.querySelector('#plan .sub').innerText, rows: document.querySelectorAll('#plan .it').length, pressed: document.querySelector('.ptile').getAttribute('aria-pressed') })));
  await q.click('.ptile:nth-child(1)'); await q.waitForTimeout(300);
  console.log('tap again', await q.evaluate(() => ({ plan: planFor('2026-12', 'Family', 'all').length, rm: Object.keys(syncMeta().rmPlans).length })));
  for (const f of ['late', 'never', 'follow', 'action']) { await q.click(`#ppick a[data-q^="pf=${f}"]`); await q.waitForTimeout(300); console.log(f, await q.evaluate(() => [document.querySelectorAll('.ptile').length, (document.querySelector('#ppick a.btn') || {}).innerText || '', (document.querySelector('.ptile small') || {}).innerText || ''])); }
  await q.click('#ppick a[data-q^="pf=&"]'); await q.waitForTimeout(300);
  await q.click('#ppick a[data-q^="vc=Nkwazi"]'); await q.waitForTimeout(300); console.log('nkwazi', await q.evaluate(() => [document.querySelector('.vnow').innerText, document.querySelectorAll('.ptile').length, document.querySelector('#ppick select').options.length]));
  const cmp = await q.evaluate(() => document.querySelector('#ppick select').options[1].value); await q.selectOption('#ppick select', cmp); await q.waitForTimeout(300);
  console.log('compound', cmp, await q.evaluate(() => [document.querySelectorAll('.ptile').length, [...document.querySelectorAll('#ppick .seg')][1].innerText.replace(/\n/g, ' | ')]));
  await go(q, '#/visits?vtab=plan&m=2026-12&pall=1'); console.log('show all', await q.evaluate(() => document.querySelectorAll('.ptile').length));
  await go(q, '#/visits?vtab=plan&m=2026-12'); await q.screenshot({ path: SP + 't52-plan.png', fullPage: false });
  /* done visit: tile stays */
  console.log('done tile', await q.evaluate(() => { const m = thisMonth(); const p = planFor(m, 'Family', 'all').find(p => planStatus(p).k === 'done'); return p ? 'has done plan ' + m : 'no done plan in ' + m; }));
  await go(q, '#/visits?vtab=plan&m=2026-11&pall=1');
  const dn = await q.$('.ptile.done'); if (dn) { const before = await q.evaluate(() => plans().length); await dn.click(); await q.waitForTimeout(300); console.log('tap on done keeps plan', before === await q.evaluate(() => plans().length)); } else console.log('no done tile in november');
  await go(q, '#/visits?vtab=plan&m=2026-10'); console.log('past month picker', await q.evaluate(() => !!document.querySelector('#ppick')));
  /* school, others, all */
  for (const t of ['School', 'Others', 'all']) { await go(q, '#/visits?vtab=plan&m=2026-12&vt=' + t); console.log(t, await q.evaluate(() => [[...document.querySelectorAll('#ppick .seg')].map(s => s.innerText.replace(/\n/g, ' | ')).join(' || '), document.querySelectorAll('.ptile').length, [...document.querySelectorAll('.ptile')].slice(0, 2).map(t => t.innerText.replace(/\n/g, ' / '))])); 
    const id = await q.evaluate(() => document.querySelector('.ptile:not(.in)').dataset.id); await q.click(`.ptile[data-id="${id}"]`); await q.waitForTimeout(300); console.log('  planned as', await q.evaluate(id => plans().filter(p => String(p.childId) === id && p.month === '2026-12').map(p => planTeam(p) + ':' + p.purpose), id)); }
  /* phone */
  const ph = await mk({ ...devices['Pixel 7'] }, 'Bernard');
  await go(ph, '#/visits?vtab=plan&m=2026-12');
  console.log('phone', await ph.evaluate(() => [document.querySelectorAll('.ptile').length, document.documentElement.scrollWidth <= window.innerWidth + 1, Math.round(document.querySelector('.ptile').getBoundingClientRect().width)]));
  await ph.evaluate(() => document.querySelector('#ppick').scrollIntoView()); await ph.waitForTimeout(200); await ph.tap('.ptile:nth-child(2)'); await ph.waitForTimeout(300);
  const y = await ph.evaluate(() => window.scrollY); console.log('phone after tap: in plan', await ph.evaluate(() => document.querySelectorAll('.ptile.in').length), 'scroll kept', y > 100);
  await ph.screenshot({ path: SP + 't52-phone.png' });
  console.log('errors', errs.length, errs.slice(0, 4));
  await b.close();
})();
