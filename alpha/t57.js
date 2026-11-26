const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const SP = '/tmp/cyp-shots/';
  const mk = async (opt, who) => { const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); if (opt.isMobile) await p.tap(`.stile:has-text("${who}")`); else await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(400); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const q = await mk({ viewport: { width: 1440, height: 1000 } }, 'Maxwell');
  console.log('user', await q.evaluate(() => [USER.name, USER.role, canCheck(), monthDue()]));
  await go(q, '#/monthly?m=2026-11');
  console.log('list', await q.evaluate(() => [document.querySelector('h1').innerText, document.querySelector('.seg').innerText.replace(/\n/g, ' | '), [...document.querySelectorAll('.grid.g4 .tile')].map(t => t.innerText.replace(/\n/g, ' ')).join(' | '), document.querySelectorAll('section.card .it').length]));
  const kid = await q.evaluate(() => monthlyKids(null)[0].id);
  await go(q, '#/child/' + kid); console.log('box', await q.evaluate(() => (document.querySelector('#monthlybox') || {}).innerText.replace(/\n+/g, ' | ')));
  await go(q, '#/child/' + kid + '/month?m=2026-11');
  console.log('form', await q.evaluate(() => [document.querySelector('h1').innerText, document.querySelector('section.card dl').innerText.replace(/\n+/g, ' | ').slice(0, 420), [...document.querySelectorAll('form[data-form="monthly"] label.f')].map(l => l.childNodes[0].textContent.trim()).join(' | '), document.querySelector('[name="perf"]').value]));
  await q.selectOption('[name="parental"]', 'Paternal orphan'); await q.fill('[name="behaviour"]', 'Behaves well'); await q.fill('[name="health"]', 'Physically fit'); await q.fill('[name="strengths"]', 'Likes school'); await q.fill('[name="plan"]', 'Group counselling'); await q.click('form[data-form="monthly"] button.pri'); await q.waitForTimeout(400);
  console.log('saved', await q.evaluate(id => { const c = child(id), r = monthlyOf(c, '2026-11'); return [location.hash, c.parentalStatus, r.behaviour, r.plan, staffName(r.by), !!r.checkedBy, (document.querySelector('#monthlybox') || {}).innerText.replace(/\n+/g, ' | ').slice(0, 200)]; }, kid));
  await go(q, '#/child/' + kid + '/month?m=2026-11'); const hasBtn = await q.evaluate(() => !!document.querySelector('[data-sact="monthcheck"]')); if (hasBtn) { await q.click('[data-sact="monthcheck"]'); await q.waitForTimeout(300); }
  console.log('checked', hasBtn, await q.evaluate(id => [!!monthlyOf(child(id), '2026-11').checkedBy, (document.querySelector('form .chip') || {}).innerText], kid));
  /* edit without changing keeps the check; changing text removes it */
  await q.click('form[data-form="monthly"] button.pri'); await q.waitForTimeout(300); console.log('resave keeps check', await q.evaluate(id => !!monthlyOf(child(id), '2026-11').checkedBy, kid));
  await go(q, '#/child/' + kid + '/month?m=2026-11'); await q.fill('[name="plan"]', 'Changed plan'); await q.click('form[data-form="monthly"] button.pri'); await q.waitForTimeout(300); console.log('change removes check', await q.evaluate(id => !monthlyOf(child(id), '2026-11').checkedBy, kid));
  /* next month shows last plan */
  await go(q, '#/child/' + kid + '/month?m=2026-12'); console.log('next month', await q.evaluate(() => (document.querySelector('form p.sub') || {}).innerText));
  await go(q, '#/monthly?m=2026-11'); console.log('list after', await q.evaluate(() => [...document.querySelectorAll('.grid.g4 .tile')].map(t => t.innerText.replace(/\n/g, ' ')).join(' | ')));
  console.log('export', await q.evaluate(() => { const dl = downloadXlsx; let got; window.downloadXlsx = (n, s) => got = [n, s[0].rows.length, s[0].rows[0].length]; try { XL.monthly(); } finally { window.downloadXlsx = dl; } return got; }));
  console.log('to do line 16th', await q.evaluate(() => monthlyLine([], 'Minsundu').length));
  /* non-Minsundu child: no box */
  const nk = await q.evaluate(() => S.children.find(c => c.section === 'Nkwazi' && isCurrent(c)).id); await go(q, '#/child/' + nk); console.log('nkwazi child box', await q.evaluate(() => !!document.querySelector('#monthlybox')));
  await go(q, '#/'); console.log('home link', await q.evaluate(() => [...document.querySelectorAll('a')].some(a => a.getAttribute('href') === '#/monthly')));
  const ph = await mk({ ...devices['Pixel 7'] }, 'Maxwell'); for (const h of ['#/monthly', '#/child/' + kid + '/month?m=2026-11', '#/child/' + kid]) { await go(ph, h); console.log('phone', h, await ph.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)); }
  await go(ph, '#/child/' + kid + '/month?m=2026-11'); await ph.screenshot({ path: SP + 't57-phone.png', fullPage: true });
  console.log('errors', errs.length, errs.slice(0, 4));
  await b.close();
})();
