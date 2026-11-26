// alpha 5.28: tasks given to a person, to several people or to a team
const { chromium } = require('playwright'); const OUT = '/tmp/cyp-shots/';
(async () => { const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 393, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  const login = async who => { await p.evaluate(() => { if (typeof USER !== 'undefined' && USER) { USER = null; render(); } }); await p.waitForTimeout(200); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', await p.evaluate(() => pinValue())); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(500); } await p.addStyleTag({ content: '.demobar{display:none!important}' }); };
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(500); };
  const fits = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  const home = () => p.evaluate(() => { const s = document.querySelector('#tasks'); return s ? s.innerText.replace(/\s+/g, ' ').slice(0, 260) : 'no box'; });
  // 1. Clement gives a task to the Family Section and to Chisha, every week
  await login('Clement'); await go('#/home'); console.log('1 home of Clement', await home());
  await go('#/tasks/new'); console.log('1 form fits', await fits(), 'teams', await p.evaluate(() => document.querySelectorAll('input[name=teams]').length), 'people', await p.evaluate(() => document.querySelectorAll('input[name=staff]').length));
  await p.screenshot({ path: OUT + 't84-form.png', fullPage: true });
  await p.click('form[data-form=task] button.pri'); await p.waitForTimeout(200); console.log('1 empty form stays', await p.evaluate(() => location.hash));
  await p.fill('input[name=title]', 'Bring the school list of November to the office'); await p.click('form[data-form=task] button.pri'); await p.waitForTimeout(300); console.log('1 nobody chosen', await p.evaluate(() => [location.hash, (document.querySelector('.toast') || {}).innerText]));
  await p.check('input[name=teams][value=Family]'); const chisha = await p.evaluate(() => S.staff.find(s => /Chisha/.test(s.name)).id); await p.check(`input[name=staff][value=${chisha}]`);
  const tomorrow = await p.evaluate(() => addDays(today(), 1)); await p.fill('input[name=due]', tomorrow); await p.selectOption('select[name=repeat]', 'week'); await p.fill('textarea[name=note]', 'Paper copy and Excel');
  await p.click('form[data-form=task] button.pri'); await p.waitForTimeout(500);
  console.log('1 saved', await p.evaluate(() => [location.hash, S.events.filter(e => e.type === 'Task').map(t => [t.title, t.teams, t.staff.length, t.due, t.repeat])]));
  console.log('1 list', await p.evaluate(() => [...document.querySelectorAll('.tseg a')].map(x => x.innerText.trim() + (x.classList.contains('on') ? '*' : ''))), await p.evaluate(() => document.querySelector('.trow').innerText.replace(/\s+/g, ' ')));
  await p.screenshot({ path: OUT + 't84-list.png' });
  // a late task for Merabe, made directly
  await p.evaluate(() => { const m = S.staff.find(s => /Merabe/.test(s.name)); S.events.push({ id: uid('e'), childId: '', type: 'Task', date: addDays(today(), -9), ts: Date.now() - 9e8, title: 'Send the term results of Chifubu Secondary', note: '', due: addDays(today(), -2), repeat: '', teams: [], staff: [m.id], by: USER.id }); save(); });
  await go('#/pending'); console.log('1 to do of the office', await p.evaluate(() => [...document.querySelectorAll('.al')].map(x => x.innerText.replace(/\s+/g, ' ')).filter(t => /task/.test(t))));
  await go('#/tasks?v=all'); console.log('1 all', await p.evaluate(() => ({ rows: document.querySelectorAll('.trow').length, late: document.querySelectorAll('.trow.late').length, table: [...document.querySelectorAll('table.ttab tbody tr')].map(r => r.innerText.replace(/\s+/g, ' ')) })), 'fits', await fits());
  // 2. Bernard (Family) sees it at Home and taps Done
  await login('Bernard'); await go('#/home'); console.log('2 Bernard home', await home()); await p.screenshot({ path: OUT + 't84-home.png' });
  console.log('2 fits', await fits(), 'badge', await p.evaluate(() => todoCount() - todoCount0()));
  await p.tap('#tasks [data-tact=done]'); await p.waitForTimeout(400);
  console.log('2 after done', await home()); console.log('2 events', await p.evaluate(() => S.events.filter(e => /^Task/.test(e.type)).map(e => [e.type, e.due || '', e.ref ? 'ref' : '', staffName(e.by)])));
  await go('#/tasks'); console.log('2 tasks page', await p.evaluate(() => [...document.querySelectorAll('.card.taskcard')].map(c => c.querySelector('h2').innerText + ' | ' + [...c.querySelectorAll('.trow')].map(r => r.innerText.replace(/\s+/g, ' ').slice(0, 150)).join(' || '))));
  console.log('2 cannot cancel a task of Clement', await p.evaluate(() => document.querySelectorAll('[data-tact=cancel]').length));
  // 3. Chisha sees the next one (given by name), Merabe sees only hers, late
  await login('Chisha'); await go('#/home'); console.log('3 Chisha', await home());
  await login('Merabe'); await go('#/home'); console.log('3 Merabe', await home(), 'red number', await p.evaluate(() => todoCount() - todoCount0()));
  await go('#/tasks?v=all'); console.log('3 Merabe cannot see all', await p.evaluate(() => [...document.querySelectorAll('.tseg a')].map(x => x.innerText.trim()).join(' | ') + ' rows ' + document.querySelectorAll('.trow').length));
  await go('#/home'); await p.tap('#tasks [data-tact=done]'); await p.waitForTimeout(300); console.log('3 Merabe done', await home());
  await go('#/tasks'); await p.tap('[data-tact=reopen]'); await p.waitForTimeout(300); console.log('3 reopened', await p.evaluate(() => document.querySelector('.card.taskcard h2').innerText));
  // 4. Clement cancels a task; the guest sees nothing
  await login('Clement'); await go('#/tasks?v=all'); await p.tap('[data-tact=cancel]'); await p.waitForTimeout(300); await p.fill('#dlg textarea', 'Given by mistake'); await p.tap('#dlg .ok'); await p.waitForTimeout(400);
  console.log('4 after cancel', await p.evaluate(() => ({ tasks: S.events.filter(e => e.type === 'Task').length, cancelled: S.events.filter(e => e.type === 'Record cancelled').length })));
  // 5. a task about a child shows in the history of the child
  await go('#/tasks/new'); await p.fill('input[name=title]', 'Take the birth certificate to the school'); await p.check('input[name=teams][value=School]');
  const kid = await p.evaluate(() => S.children.find(c => c.status !== 'Closed').id); await p.evaluate(id => { document.querySelector('.cpick input[type=hidden]').value = id; }, kid);
  await p.click('form[data-form=task] button.pri'); await p.waitForTimeout(400); await go('#/child/' + kid);
  console.log('5 history of the child', await p.evaluate(() => [...document.querySelectorAll('.main *')].filter(x => !x.children.length || x.tagName === 'B').map(x => x.parentElement.innerText).filter(t => /^Task:/.test(t.trim())).slice(0, 1).map(t => t.replace(/\s+/g, ' ').slice(0, 140))));
  // 6. computer: the menu has Tasks
  const c2 = await b.newContext({ viewport: { width: 1366, height: 800 } }); const q = await c2.newPage(); q.on('pageerror', e => errs.push(String(e)));
  await q.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await q.waitForTimeout(1200); await q.click('.stile:has-text("Bernard")'); await q.waitForTimeout(300); if (await q.$('#pinin')) { await q.fill('#pinin', await q.evaluate(() => pinValue())); await q.click('form[data-form=pinlogin] button.pri'); await q.waitForTimeout(500); }
  console.log('6 menu', await q.evaluate(() => [...document.querySelectorAll('header nav a, .topnav a, nav a')].map(x => x.innerText.trim()).filter(Boolean).slice(0, 12)), 'home box', await q.evaluate(() => !!document.querySelector('#tasks')));
  console.log('errors', errs); await b.close(); })();
