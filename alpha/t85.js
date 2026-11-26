// alpha 5.28: tasks travel between two devices through the shared database (locked)
const { chromium } = require('playwright'); const fs = require('fs'); const { start } = require('/home/claude/server/mock.js');
const PORT = 8831, LINK = `http://127.0.0.1:${PORT}/exec?k=K`;
(async () => {
  const mock = await start(PORT, 'K'); const b = await chromium.launch(); const errs = [];
  const mk = async (name, vw, when) => { const ctx = await b.newContext({ viewport: { width: vw || 1440, height: 900 } }); const p = await ctx.newPage(); await p.addInitScript(() => { new MutationObserver(() => { const d = document.getElementById('dlg'); if (!d || d.dataset.auto) return; d.dataset.auto = '1'; setTimeout(() => { const t = d.querySelector('textarea'); if (t) t.value = 'Written by mistake'; d.querySelector('.ok').click(); }, 60); }).observe(document, { childList: true, subtree: true }); }); if (when) await p.clock.setFixedTime(new Date(when)); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('dialog', x => x.type() === 'prompt' ? x.accept('Recorded by mistake') : x.accept()); await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400); return p; };

  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const as = (p, w) => p.evaluate(w => { USER = S.staff.find(s => s.name.includes(w)); render(); return USER.name; }, w);
  const sync = async (...ps) => { for (const p of ps) { await p.evaluate(() => syncNow()); await p.waitForTimeout(1600); } };
  const A = await mk('A');
  await A.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await A.waitForTimeout(600);
  await go(A, '#/sync'); await A.fill('form[data-form=synclink] [name=link]', LINK); await A.click('form[data-form=synclink] button'); await A.waitForTimeout(700); await A.click('[data-sact=start]'); await A.waitForTimeout(2500);
  const B = await mk('B', 393);
  await go(B, '#/sync'); await B.fill('form[data-form=synclink] [name=link]', await A.evaluate(() => staffLink('http://app.test/'))); await B.click('form[data-form=synclink] button'); await B.waitForTimeout(900); await B.click('[data-sact=load]'); await B.waitForTimeout(2500);
  console.log('version', await A.evaluate(() => VERSION), 'two devices', await A.evaluate(() => syncOn()), await B.evaluate(() => syncOn()), 'locked', await A.evaluate(() => lockOn()));
  // office (A): Clement gives a task to the Family Section, every week
  await as(A, 'Clement'); await go(A, '#/tasks/new'); await A.fill('input[name=title]', 'Bring the visit forms of the week'); await A.check('input[name=teams][value=Family]'); await A.fill('input[name=due]', await A.evaluate(() => today())); await A.selectOption('select[name=repeat]', 'week');
  await A.click('form[data-form=task] button.pri'); await A.waitForTimeout(8500); await sync(A, B);
  await as(B, 'Bernard'); await go(B, '#/home');
  console.log('1 the phone of Bernard has the task', await B.evaluate(() => { const s = document.querySelector('#tasks'); return s ? s.innerText.replace(/\s+/g, ' ').slice(0, 160) : 'no box'; }));
  console.log('1 the server holds no title in clear', !JSON.stringify(mock.dump ? mock.dump() : {}).includes('visit forms'));
  // phone (B): Bernard taps Done without internet, then the connection is back
  await B.context().setOffline(true); await B.tap ? 0 : 0; await B.click('#tasks [data-tact=done]'); await B.waitForTimeout(500);
  console.log('2 done offline, next week made', await B.evaluate(() => S.events.filter(e => /^Task/.test(e.type)).map(e => e.type + (e.due ? ' ' + e.due : ''))));
  await B.context().setOffline(false); await B.waitForTimeout(9000); await sync(B, A); await go(A, '#/tasks?v=by');
  console.log('2 the office sees who did it', await A.evaluate(() => [...document.querySelectorAll('.trow')].map(r => r.innerText.replace(/\s+/g, ' ').slice(0, 170))));
  // both tap Done on the next one before they exchange: one next task only
  const next = await A.evaluate(() => { const ends = taskEnds(); return taskAll().find(t => !taskDone(t, ends)).id; });
  await as(A, 'Richard'); await go(A, '#/home'); await A.click('#tasks [data-tact=done]'); await go(B, '#/home'); await B.click('#tasks [data-tact=done]'); await A.waitForTimeout(9000); await sync(A, B, A);
  console.log('3 after two Done on two devices', await A.evaluate(() => { const ends = taskEnds(); return { tasks: taskAll().map(t => t.due + (taskDone(t, ends) ? ' done' : ' open')), doneEvents: S.events.filter(e => e.type === 'Task done').length }; }), await B.evaluate(() => { const ends = taskEnds(); return taskAll().map(t => t.due + (taskDone(t, ends) ? ' done' : ' open')); }));
  // cancelled at the office: it leaves the phone
  await as(A, 'Clement'); await go(A, '#/tasks?v=by'); await A.click('[data-tact=cancel]'); await A.waitForTimeout(900); await A.waitForTimeout(8500); await sync(A, B); await go(B, '#/home');
  console.log('4 cancelled everywhere', await A.evaluate(() => taskAll().length), await B.evaluate(() => taskAll().length), 'pending', await A.evaluate(() => pendingCount()), await B.evaluate(() => pendingCount()));
  console.log('errors', errs); await b.close(); mock.close ? mock.close() : 0; process.exit(0);
})();
