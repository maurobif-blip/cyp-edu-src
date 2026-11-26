const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (opt, who) => { const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); if (opt.isMobile) await p.tap(`.stile:has-text("${who}")`); else await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(400); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const q = await mk({ viewport: { width: 1440, height: 1000 } }, 'Delian');
  console.log('norm', await q.evaluate(() => ['Chifubu sec', 'Chifubu Sec.', 'chifubu secondary', 'St.Andrews', 'Pamodzi comb', 'Twatasha Prim', 'Kansenshi Prisons', 'Cicetekelo Com', 'NKwazi', 'Kansenshi Secondary'].map(schoolNorm)));
  await go(q, '#/school'); const sn = await q.evaluate(() => document.querySelector('select[data-filter="sn"]').options[2].value);
  console.log('school filter options', await q.evaluate(() => document.querySelector('select[data-filter="sn"]').options.length));
  await q.selectOption('select[data-filter="sn"]', sn); await q.waitForTimeout(400);
  console.log('one school', sn, await q.evaluate(() => [document.querySelectorAll('section.card h2').length, [...document.querySelectorAll('.grid.g4 .tile')].map(t => t.innerText.replace(/\n/g, ' ')).join(' | ')]));
  await q.selectOption('select[data-filter="ty"]', 'in'); await q.waitForTimeout(400);
  console.log('type change resets school', await q.evaluate(() => [document.querySelector('select[data-filter="sn"]').value, document.querySelectorAll('table.mt tbody tr').length > 0]));
  /* ABA fields */
  const ids = await q.evaluate(() => { const a = S.children.find(c => isAba(c) && isPupil(c)), n = S.children.find(c => !isAba(c) && isPupil(c)); return [a && a.id, n.id]; });
  await go(q, '#/visit/new?child=' + ids[0] + '&t=School'); console.log('aba child form', await q.evaluate(() => [!!document.querySelector('[name="aba3y"]'), !!document.querySelector('#schoolnames'), document.querySelector('[name="place"]').getAttribute('list')]));
  await q.fill('[name="abaOptional"]', 'Religious Education'); await q.fill('[name="aba3y"]', 'Improving greatly'); await q.selectOption('[name="perf"]', 'Above average'); await q.fill('[name="strong"]', 'Maths, English'); await q.click('form[data-form="visit"] button.pri'); await q.waitForTimeout(400);
  await go(q, '#/visit/new?child=' + ids[1] + '&t=School'); console.log('non-aba child form', await q.evaluate(() => !!document.querySelector('[name="aba3y"]')));
  console.log('aba sheet', await q.evaluate(() => { const dl = downloadXlsx; let got; window.downloadXlsx = (n, s) => got = s.map(x => [x.name, x.rows.length, x.rows[0].length]); let row; try { abaSheet(today().slice(0, 4)); } finally { window.downloadXlsx = dl; } return got; }));
  console.log('aba row', await q.evaluate(id => { const dl = downloadXlsx; let sh; window.downloadXlsx = (n, s) => sh = s[2].rows; try { abaSheet(today().slice(0, 4)); } finally { window.downloadXlsx = dl; } const r = sh.find(x => String(x[0]) === String(id)); return r ? r.slice(3, 17).join(' | ') : 'row missing'; }, ids[0]));
  await go(q, '#/child/' + ids[1] + '/edit'); console.log('child form datalist', await q.evaluate(() => [document.querySelector('[name="schoolName"]').getAttribute('list'), document.querySelectorAll('#schoolnames option').length]));
  const ph = await mk({ ...devices['Pixel 7'] }, 'Delian'); await go(ph, '#/school'); console.log('phone', await ph.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  console.log('errors', errs.length, errs.slice(0, 4));
  await b.close();
})();
