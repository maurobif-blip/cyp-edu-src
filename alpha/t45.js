const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ ...devices['Pixel 5'] })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); await p.tap('.stile:has-text("Chisha")'); await p.waitForTimeout(400);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const id = await p.evaluate(() => S.children.find(c => c.section === 'Nkwazi' && isCurrent(c)).id);
  await go('#/child/' + id); console.log('boxes', await p.evaluate(() => [...document.querySelectorAll('.actbox .card')].map(c => c.querySelector('h3').innerText + ': ' + [...c.querySelectorAll('button')].map(x => x.innerText).join(', '))));
  await p.tap('.actbox [data-a="Football"]'); await p.waitForTimeout(300); await p.tap('.actbox [data-a="Carpentry"]'); await p.waitForTimeout(300);
  console.log('enrolled from the file', await p.evaluate(id => [child(id).activities, [...document.querySelectorAll('.actbox .btn.pri')].map(x => x.innerText), location.hash], id)); await p.screenshot({ path: 'shots/S1.png' });
  await p.evaluate(() => { USER = S.staff.find(s => s.admin); }); await go('#/activities?a=Football');
  console.log('on the Football list', await p.evaluate(id => !![...document.querySelectorAll('#actlist .qmain')].find(x => x.dataset.c === String(id)), id));
  console.log('errors', errs.slice(0, 5)); await b.close();
})();
