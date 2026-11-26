// beta 1.8: sports disciplines, training groups, month grid, Sports in the registers row, new kinds of group activity
const { chromium } = require('playwright'); const OUT = '/tmp/cyp-shots/';
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [w, tag] of [[393, 'ph'], [1366, 'pc']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 820 }, isMobile: w < 900, hasTouch: w < 900, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  const login = async who => { await p.evaluate(() => { if (typeof USER !== 'undefined' && USER) { USER = null; render(); } }); await p.waitForTimeout(200); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', '0000'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); } };
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(450); };
  const fits = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  await login('Pippen'); await go('#/activities');
  console.log(tag, '1 disciplines:', await p.evaluate(() => [...document.querySelectorAll('.qchips a')].map(a => a.textContent.split(' ·')[0]).join(', ')));
  // enrol: guessed groups
  const g = await p.evaluate(() => { const u = S.children.find(c => c.section === 'UCC' && c.status !== 'Closed'), n = S.children.find(c => c.section === 'Nkwazi' && c.status !== 'Closed'), y = S.children.find(c => c.section === 'Youth' && c.status !== 'Closed'), l = S.children.find(c => c.section === 'Luigi' && c.status !== 'Closed');
    [u, n, y, l].forEach(c => { actEnrolSet(c, 'Basketball', true); actEnrolSet(c, 'Football', true); }); save();
    return [u, n, y, l].map(c => c.section + ': ' + actTeamOf(c, 'Basketball') + ' / ' + actTeamOf(c, 'Football') + ' (age ' + curAge(c) + ')'); });
  console.log(tag, '2 groups guessed:', g.join(' | '));
  await go('#/activities?a=Basketball'); console.log(tag, '3 basketball group chips:', await p.locator('.qchips a[data-q^="g="]').count(), '| rows all', await p.locator('#actlist .qrow').count());
  await p.click('.qchips a[data-q="g=UCC (U12 and U14)"]'); await p.waitForTimeout(300); console.log(tag, '  rows UCC group', await p.locator('#actlist .qrow').count());
  await p.click('a[data-q="v=month"]'); await p.waitForTimeout(400); console.log(tag, '4 month grid rows:', await p.locator('.actgrid tbody tr').count(), '| fits', await fits());
  await p.evaluate(() => document.querySelector('.actgrid tbody tr:first-child td.td').click()); await p.waitForTimeout(200);
  console.log(tag, '  tapped today:', await p.evaluate(() => { const tr = document.querySelector('.actgrid tbody tr'); return [tr.querySelector('td.td').dataset.v, tr.querySelector('[data-t=T]').textContent, !!S.attendance[today()][tr.dataset.id + '@act:Basketball']]; }));
  await p.evaluate(() => document.querySelector('.actgrid tbody tr:first-child td.td').click()); await p.waitForTimeout(200); console.log(tag, '  tapped again:', await p.evaluate(() => !!(S.attendance[today()] || {})[document.querySelector('.actgrid tbody tr').dataset.id + '@act:Basketball']));
  if (tag === 'pc') await p.screenshot({ path: OUT + 'sgrid-pc.png' });
  // enrolment group select
  await go('#/activities?t=enrol'); const sel = p.locator('select[data-actteam="Football"]').first(); console.log(tag, '5 group selects in enrolment:', await p.locator('select[data-actteam]').count());
  await sel.selectOption('U15'); await p.waitForTimeout(200); console.log(tag, '  saved', await p.evaluate(() => S.children.filter(c => c.actTeam && c.actTeam.Football === 'U15').length >= 1));
  // registers row
  await login('Lewis'); await go('#/attendance'); console.log(tag, '6 Sports in registers row:', await p.locator('.regbar a[href="#/activities?v=month"]').count());
  // group activity kinds
  await go('#/groups/new?s=Sports'); console.log(tag, '7 kinds:', await p.evaluate(() => [...document.querySelectorAll('form[data-form=group] [name=kind] option')].map(o => o.textContent).slice(1).join(', ')));
  await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
