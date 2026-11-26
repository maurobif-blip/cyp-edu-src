const { chromium } = require('playwright'); const fs = require('fs'); const SP = '/tmp/cyp-shots/';
(async () => {
  const b = await chromium.launch(); const errs = []; const p = await (await b.newContext({ viewport: { width: 393, height: 850 }, deviceScaleFactor: 2 })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', x => x.accept());
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400);
  await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(700);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const kid = await p.evaluate(() => { const c = S.children.find(c => c.section === 'Luigi' && isCurrent(c)); referAdd(c.id, 'Nkwazi', 'Family', 'Problem at home', 'only 2 meals per week'); const k2 = S.children.find(x => isCurrent(x) && centreOf(x) === 'Minsundu'); referAdd(k2.id, 'Family', 'Minsundu', 'Behaviour', ''); save(); USER = S.staff.find(s => s.name.includes('Bernard')); render(); return c.id; });
  await go('#/visits?vt=Family&vtab=plan');
  console.log('buttons', await p.evaluate(() => document.querySelector('#refteam .refact').innerText.replace(/\s+/g, ' ')));
  await p.click('#refteam .refact [data-pact=plan]:nth-of-type(2)'); await p.waitForTimeout(500);
  const next = await p.evaluate(() => addMonths(thisMonth(), 1));
  console.log('planned for next month', await p.evaluate(([id, m]) => plans().filter(x => String(x.childId) === id).map(x => [x.month, x.team, x.purpose]), [kid, next]), '| row now', await p.evaluate(() => document.querySelector('#refteam .refact').innerText.replace(/\s+/g, ' ')));
  await p.screenshot({ path: SP + 'refer-plan.png' });
  await go('#/visits?vt=Family&vtab=plan&m=' + next); console.log('plan of next month lists the child', await p.evaluate(id => !!document.querySelector(`a[href="#/child/${id}"]`), kid), '| fits', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await go('#/referrals?to=all'); console.log('referral to a centre has no plan buttons', await p.evaluate(() => [...document.querySelectorAll('.refit')].map(r => !!r.querySelector('.refact'))));
  console.log('errors', errs); await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 500)); process.exit(1); });
