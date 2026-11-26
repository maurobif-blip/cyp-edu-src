const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const SP = '/tmp/cyp-shots/';
  const mk = async (opt, who) => { const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); if (opt.isMobile) await p.tap(`.stile:has-text("${who}")`); else await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(400); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const q = await mk({ viewport: { width: 1440, height: 1000 } }, 'Delian');
  console.log('user', await q.evaluate(() => [USER.name, myTeam()]));
  await go(q, '#/school');
  console.log('school page', await q.evaluate(() => [document.querySelector('h1').innerText, [...document.querySelectorAll('.grid.g4 .tile')].map(t => t.innerText.replace(/\n/g, ' ')).join(' | '), document.querySelectorAll('section.card h2').length, [...document.querySelectorAll('section.card h2')].slice(0, 3).map(h => h.innerText).join(' || ')]));
  const kid = await q.evaluate(() => schoolRows(new URLSearchParams('')).find(r => r.c.schoolName).c.id);
  await go(q, '#/visit/new?child=' + kid + '&t=School');
  console.log('form', await q.evaluate(() => [document.querySelector('h1').innerText, [...document.querySelectorAll('form[data-form="visit"] label.f')].map(l => l.childNodes[0].textContent.trim() || l.innerText.split('\n')[0]).join(' | '), document.querySelector('[name="place"]').value, document.querySelector('.note').innerText]));
  await q.selectOption('[name="schAtt"]', 'Irregular'); await q.selectOption('[name="perf"]', 'Average'); await q.fill('[name="perfNote"]', 'Weak in Mathematics'); await q.fill('[name="teacher"]', 'Mrs Test'); await q.fill('[name="behaviour"]', 'Good'); await q.fill('[name="weak"]', 'Mathematics'); await q.fill('[name="action"]', 'Extra lessons in Mathematics');
  await q.selectOption('[name="referTo"]', 'Family'); await q.selectOption('[name="referWhy"]', 'Not attending school'); await q.fill('[name="referNote"]', 'Missed two weeks');
  await q.click('form[data-form="visit"] button.pri'); await q.waitForTimeout(500);
  console.log('saved', await q.evaluate(id => { const v = schoolVisits(child(id))[0], rf = referOpen('Family'); return { hash: location.hash, schAtt: v.schAtt, perf: v.perf, teacher: v.teacher, findings: v.findings, action: v.action, refs: rf.length, ref: rf[0] && [rf[0].from, rf[0].to, rf[0].reason, rf[0].visitId === v.id] }; }, kid));
  /* second visit shows the last one */
  await go(q, '#/visit/new?child=' + kid + '&t=School'); console.log('last visit note', await q.evaluate(() => document.querySelector('.note').innerText));
  /* change team -> generic form */
  await q.selectOption('select[name="team"]', 'Family'); await q.waitForTimeout(500);
  console.log('team change', await q.evaluate(() => [location.hash, !!document.querySelector('[name="schAtt"]'), !!document.querySelector('[name="findings"]'), !!document.querySelector('[name="referTo"]'), document.querySelector('[name="childId"]').value]));
  /* term results with marks, two terms -> progress */
  await go(q, '#/child/' + kid + '/term?y=2026&t=2'); await q.selectOption('[name="perf"]', 'Below average'); await q.fill('[name="pos"]', '20'); await q.click('details.marks summary'); await q.fill('[name="ms0"]', 'English'); await q.fill('[name="me0"]', '40'); await q.fill('[name="ms1"]', 'Mathematics'); await q.fill('[name="me1"]', '30'); await q.click('form[data-form="term"] button.pri'); await q.waitForTimeout(400);
  await go(q, '#/child/' + kid + '/term?y=2026&t=3'); await q.selectOption('[name="perf"]', 'Average'); await q.selectOption('[name="yearEnd"]', 'Promoted to the next grade'); await q.click('details.marks summary'); await q.fill('[name="ms0"]', 'English'); await q.fill('[name="me0"]', '60'); await q.fill('[name="ms1"]', 'Mathematics'); await q.fill('[name="me1"]', '50'); await q.click('form[data-form="term"] button.pri'); await q.waitForTimeout(400);
  console.log('terms', await q.evaluate(id => { const c = child(id); return { n: c.terms.length, avg: termsOf(c).map(termAvg), progress: progressOf(c), promoted: [promotedIn(2026).ok.length, promotedIn(2026).all.length], hash: location.hash }; }, kid));
  console.log('child file', await q.evaluate(() => [!!document.querySelector('.refcard'), (document.querySelector('#schoolbox') || {}).innerText.replace(/\n+/g, ' | ').slice(0, 520)]));
  await q.screenshot({ path: SP + 't55-child.png', fullPage: false });
  /* history line */
  console.log('history', await q.evaluate(() => [...document.querySelectorAll('.card')].map(x => x.innerText).join(' ').match(/Referred to Family Section[^\n]*/)[0]));
  /* edit term keeps marks */
  await go(q, '#/child/' + kid + '/term?y=2026&t=3'); console.log('edit term', await q.evaluate(() => [document.querySelector('[name="ms1"]').value, document.querySelector('[name="me1"]').value, document.querySelector('[name="yearEnd"]').value, document.querySelector('details.marks').open]));
  /* family user sees it in To do, closes it */
  const f = await mk({ viewport: { width: 1440, height: 1000 } }, 'Bernard');
  await f.evaluate(([id]) => { referAdd(id, 'School', 'Family', 'Not attending school', 'Missed two weeks'); save(); render(); }, [kid]);
  await go(f, '#/'); console.log('family home', await f.evaluate(() => (document.body.innerText.match(/[^\n]*referred by[^\n]*/) || ['(no line)'])[0]));
  await go(f, '#/referrals'); console.log('referrals page', await f.evaluate(() => [document.querySelector('h1').innerText, document.querySelector('select[data-filter="to"]').value, document.querySelectorAll('.refit').length]));
  await f.fill('.refdone input[name="note"]', 'Home visit done, mother will bring him back'); await f.click('.refdone button'); await f.waitForTimeout(400);
  console.log('closed', await f.evaluate(() => [referOpen('Family').length, document.querySelectorAll('.refit').length, [...document.querySelectorAll('section.card')][1].innerText.replace(/\n+/g, ' | ').slice(0, 200)]));
  await go(f, '#/visits?vt=Family'); console.log('monitoring links', await f.evaluate(() => [...document.querySelectorAll('.top a.btn')].map(a => a.innerText).join(' | ')));
  await go(f, '#/visit/new?t=Family'); console.log('family form has refer + generic', await f.evaluate(() => [!!document.querySelector('[name="referTo"]'), !!document.querySelector('[name="findings"]'), !!document.querySelector('[name="schAtt"]')]));
  /* plan a school, exports, logframe, to do school */
  await go(q, '#/school'); const before = await q.evaluate(() => plans().length); await q.click('[data-sact="planschool"]'); await q.waitForTimeout(400); console.log('plan school +', await q.evaluate(b => plans().length - b, before));
  console.log('exports', await q.evaluate(() => { const o = []; const dl = downloadXlsx; let got = []; window.downloadXlsx = (n, s) => got.push([n, s[0].rows.length, s[0].rows[0].length]); try { XL.school(); XL.referrals(); } catch (e) { o.push(String(e)); } window.downloadXlsx = dl; return [got, o]; }));
  await go(q, '#/school?show=down'); console.log('show=down', await q.evaluate(() => document.querySelectorAll('table.mt tbody tr').length));
  await go(q, '#/school?ty=all'); console.log('all schools', await q.evaluate(() => [...document.querySelectorAll('.grid.g4 .tile')].map(t => t.innerText.replace(/\n/g, ' ')).join(' | ')));
  await go(q, '#/school'); await q.screenshot({ path: SP + 't55-school.png', fullPage: false });
  const adm = await mk({ viewport: { width: 1440, height: 1000 } }, 'Clement');
  await adm.evaluate(id => { const c = child(id); c.terms = [{ y: Number(today().slice(0, 4)), t: 3, perf: 'Average', yearEnd: 'Promoted to the next grade', subjects: [] }]; save(); }, kid);
  await go(adm, '#/logframe'); console.log('logframe', await adm.evaluate(() => [...document.querySelectorAll('tr')].find(t => /SO1\.2/.test(t.innerText)).innerText.replace(/\s+/g, ' ')));
  await go(adm, '#/pending'); console.log('to do school', await adm.evaluate(() => (document.body.innerText.match(/[^\n]*not visited at school[^\n]*/) || ['(none)'])[0]));
  /* phone */
  const ph = await mk({ ...devices['Pixel 7'] }, 'Delian');
  for (const h of ['#/school', '#/visit/new?child=' + kid + '&t=School', '#/child/' + kid, '#/child/' + kid + '/term', '#/referrals', '#/more']) { await go(ph, h); console.log('phone', h, await ph.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)); }
  await go(ph, '#/visit/new?child=' + kid + '&t=School'); await ph.screenshot({ path: SP + 't55-phone.png', fullPage: true });
  console.log('errors', errs.length, errs.slice(0, 5));
  await b.close();
})();
