const { chromium } = require('playwright'); const fs = require('fs'); const SP = '/tmp/cyp-shots/';
(async () => {
  const b = await chromium.launch(); const errs = []; const p = await (await b.newContext({ viewport: { width: 393, height: 850 }, deviceScaleFactor: 2 })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', x => x.accept());
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400);
  await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(700);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  await go('#/visits?vt=Family&vtab=plan'); const n0 = await p.evaluate(() => document.querySelectorAll('.ptile').length);
  const target = await p.evaluate(() => { const x = planPool('Family', 'all'); const c = x[x.length - 1].c; return [c.id, c.name, fullName(c), centreOf(c)]; });
  await p.fill('#plansearch', target[1].slice(0, 4).toLowerCase()); await p.waitForTimeout(300);
  console.log('tiles before', n0, '| after typing "' + target[1].slice(0, 4).toLowerCase() + '":', await p.evaluate(() => [...document.querySelectorAll('.ptile b')].map(x => x.innerText).slice(0, 8)), '| focus stays', await p.evaluate(() => document.activeElement.id));
  await p.click(`.ptile[data-id="${target[0]}"]`); await p.waitForTimeout(400);
  console.log('tapped: in the plan', await p.evaluate(id => [plans().some(x => String(x.childId) === id), document.querySelector('#plansearch').value, !!document.querySelector(`.ptile.in[data-id="${id}"]`)], target[0]));
  await p.screenshot({ path: SP + 'plan-search.png' });
  await p.fill('#plansearch', 'zzzz'); await p.waitForTimeout(200); console.log('no match', await p.evaluate(() => document.querySelector('#pgridbox .empty').innerText));
  await p.fill('#plansearch', ''); await p.waitForTimeout(200); console.log('cleared: tiles', await p.evaluate(() => document.querySelectorAll('.ptile').length));
  await p.fill('#plansearch', String(target[0])); await p.waitForTimeout(200); console.log('by ID', await p.evaluate(() => [...document.querySelectorAll('.ptile b')].map(x => x.innerText)));
  await p.evaluate(() => { UI.planq = ''; }); await go('#/visits?vt=School&vtab=plan'); await p.fill('#plansearch', 'a'); await p.waitForTimeout(200); console.log('school plan search works', await p.evaluate(() => document.querySelectorAll('.ptile').length > 0), 'fits', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  /* school report */
  await p.evaluate(() => { UI.planq = ''; }); await p.setViewportSize({ width: 1440, height: 900 }); await go('#/reports?s=School&m=2026-10');
  console.log('report head', await p.evaluate(() => [...document.querySelectorAll('#rtable thead th')].map(x => x.innerText).join(' | ')));
  console.log('rows', await p.evaluate(() => [...document.querySelectorAll('#rtable tbody tr')].map(r => [...r.querySelectorAll('td')].slice(0, 6).map(x => x.innerText.trim()).join(' ; ')).join('\n')));
  console.log('lists', await p.evaluate(() => [...document.querySelectorAll('section.card h3')].map(x => x.innerText)));
  await p.screenshot({ path: SP + 'school-report.png', fullPage: true });
  await go('#/reports?s=School&m=2026-10&aba=1'); console.log('ABA only: rows', await p.evaluate(() => document.querySelectorAll('#rtable tbody tr').length), 'lists hidden', await p.evaluate(() => !document.querySelector('section.card h3')));
  await p.setViewportSize({ width: 393, height: 850 }); await go('#/reports?s=School&m=2026-10'); console.log('phone fits', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  console.log('errors', errs); await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 500)); process.exit(1); });
