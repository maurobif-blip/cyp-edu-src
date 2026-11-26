const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Galaxy S9+'], deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(400);
  await p.tap('.stile:has-text("Iness Phiri")'); await p.waitForTimeout(300);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(400); };
  const clip = async (n, hgt) => p.screenshot({ path: `shots/F-${n}.png`, fullPage: true, clip: { x: 0, y: 0, width: 320, height: hgt || 1700 } });
  await go('#/attendance?c=Luigi');
  await p.tap('details.lstaff summary'); await p.waitForTimeout(150); await p.tap('[data-lstaff=dropin][value=s23]'); await p.waitForTimeout(150);
  for (const i of [4, 9, 13]) { await p.tap(`#lattBody tbody tr:nth-child(${i}) [data-lact=day]`); await p.waitForTimeout(120); }
  await clip('luigi', 2300);
  await go('#/attendance?c=Minsundu&d=' + await p.evaluate(() => addDays(today(), -5))); await clip('minsundu', 1700);
  await go('#/visits?vt=Family&vtab=need'); await clip('need', 1500);
  await go('#/visits?vt=all&vtab=plan'); await clip('plan', 1700);
  await go('#/visit/new'); await p.fill('[data-cp=q]', 'ban'); await p.waitForTimeout(200); await clip('visitform', 1500);
  await p.tap('.cpopt'); await p.waitForTimeout(150); console.log('picked', await p.inputValue('[name=childId]'), await p.evaluate(() => document.querySelector('.cpsel b').textContent));
  await p.selectOption('[name=purpose]', 'Assessment'); await p.fill('[name=findings]', 'Phone test'); await p.tap('form[data-form=visit] button.pri'); await p.waitForTimeout(350);
  console.log('saved', await p.evaluate(() => [location.hash, S.visits[S.visits.length - 1].findings, S.visits[S.visits.length - 1].team]));
  await clip('visits-done', 1300);
  await go('#/more'); await clip('more', 760);
  await go('#/children'); await p.tap('.mfbtn'); await p.waitForTimeout(200); await clip('children', 1300);
  await go('#/home'); await clip('home', 2200);
  await go('#/counseling'); await clip('counseling', 1500);
  await go('#/reports?s=Luigi'); await clip('report', 1500);
  for (const h of ['#/home', '#/pending', '#/attendance?c=Luigi', '#/attendance?c=Luigi&lt=sum', '#/attendance?c=Nkwazi', '#/visits', '#/visits?vtab=need', '#/visits?vtab=plan', '#/visits?vtab=actions', '#/visit/new', '#/children', '#/child/1169', '#/child/1169/edit', '#/child/1169/status', '#/child/new', '#/counseling', '#/reports?s=Luigi', '#/reports?s=Family', '#/reports?s=History&h=UCC', '#/more', '#/help', '#/review']) { await go(h); const o = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (o[0] > o[1] + 1) console.log('OVERFLOW', h, o, await p.evaluate(() => { const w = innerWidth, out = []; for (const el of document.querySelectorAll('.main *')) { const r = el.getBoundingClientRect(); if (r.right > w + 1 && !el.closest('.tw')) out.push(el.tagName + '.' + String(el.className).slice(0, 30) + ' ' + Math.round(r.right)); } return out.slice(0, 4); })); }
  console.log('errors', errs); await b.close();
})();
