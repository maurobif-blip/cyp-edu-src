// change a task: who can, what changes, the next of a series uses the changed date; team names with members
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  await p.evaluate(() => { USER = S.staff.find(s => s.admin); location.hash = '#/tasks/new'; render(); }); await p.waitForTimeout(500);
  console.log('teams', await p.evaluate(() => [...document.querySelectorAll('.tteams label')].map(l => l.innerText.replace(/\n+/g, ' | ')).slice(0, 4)), 'fits', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.fill('input[name=title]', 'First draft monthly report'); await p.check('input[name=teams][value=Admin]'); await p.evaluate(() => { document.querySelector('.main form').requestSubmit(); }); await p.waitForTimeout(600);
  console.log('given', await p.evaluate(() => [location.hash, document.querySelector('.trow').innerText.replace(/\s+/g, ' ').slice(0, 150)]));
  await p.click('a:has-text("Change the task")'); await p.waitForTimeout(500);
  console.log('edit form', await p.evaluate(() => [document.querySelector('h1').innerText, document.querySelector('input[name=title]').value, document.querySelector('input[name=teams][value=Admin]').checked]));
  await p.fill('input[name=title]', 'First draft of the monthly report'); await p.uncheck('input[name=teams][value=Admin]'); await p.check('input[name=teams][value=Family]'); const due = await p.evaluate(() => addDays(today(), 3)); await p.evaluate(d => { document.querySelector('input[name=due]').value = d; }, due);
  await p.evaluate(() => { document.querySelector('.main form').requestSubmit(); }); await p.waitForTimeout(600);
  console.log('changed', await p.evaluate(() => [document.querySelector('.trow').innerText.replace(/\s+/g, ' ').slice(0, 170), S.events.filter(e => e.type === 'Task').length, S.events.filter(e => e.type === 'Task changed').length]));
  const fam = await p.evaluate(() => { const me = USER; USER = S.staff.find(s => !s.admin && mainFlag(s) === 'Family'); const n = taskOpenFor(USER).length, can = !!(USER.admin); location.hash = '#/tasks'; render(); const btn = !!document.querySelector('a[href^="#/tasks/edit"]'); USER = me; return [n, btn]; });
  console.log('family person sees it, has no Change button', fam);
  console.log('errors', errs); await b.close(); })();
