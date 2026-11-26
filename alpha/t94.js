// beta 1.5: the nine comments of 24/11 (roles, Luigi grid, counselling reports in Reports, referrals, file of the child, education, picker, icons)
const { chromium } = require('playwright'); const OUT = '/tmp/cyp-shots/';
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [w, tag] of [[393, 'ph'], [1366, 'pc']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 820 }, isMobile: w < 900, hasTouch: w < 900, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  // access levels as decided on 24/11: Mauro site admin + Education office; Davies (as a stand-in) Administration
  await p.evaluate(() => { const set = (id, a) => { const s = S.staff.find(x => x.id === id); s.areas = a; s.admin = a.includes('Admin'); }; set('s16', ['Site', 'Admin']); set('s33', ['Mgmt']); save(); });
  const login = async who => { await p.evaluate(() => { if (typeof USER !== 'undefined' && USER) { USER = null; render(); } }); await p.waitForTimeout(200); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', '0000'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); } };
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(500); };
  const fits = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  const txt = () => p.evaluate(() => document.querySelector('.main').innerText);
  console.log(tag, '0 login groups:', await p.evaluate(() => [...document.querySelectorAll('p.sec')].map(x => x.innerText).join(' | ')));
  // 1 roles
  await login('Davies'); console.log(tag, '1 Mgmt home:', await p.evaluate(() => document.querySelector('h1').innerText), '| sees all:', await p.evaluate(() => seesAll()), '| admin page:', await p.evaluate(() => canAdminPage()));
  await go('#/tasks?v=all'); console.log(tag, '  tasks All tab:', await p.locator('a[data-q="v=all"], a:has-text("All")').count() > 0);
  await go('#/staff'); console.log(tag, '  /staff:', (await txt()).slice(0, 60).replace(/\n/g, ' '));
  await go('#/visits?vtab=check'); console.log(tag, '  validate buttons:', await p.locator('[data-vact=ok], button:has-text("Validate")').count());
  await login('Clement'); await go('#/staff'); console.log(tag, '2 Office admin page:', await p.evaluate(() => !!document.querySelector('.stafft')), '| data link:', await p.locator('a[href="#/staff/data"]').count(), '| PIN card:', await p.locator('form[data-form=pin]').count(), '| Site box disabled:', await p.evaluate(() => document.querySelector('input[data-flag=Site][data-id=s2]').disabled));
  await go('#/staff/data'); console.log(tag, '  data page:', (await txt()).slice(0, 40).replace(/\n/g, ' '));
  await login('Mauro'); await go('#/staff'); console.log(tag, '3 Site admin data link:', await p.locator('a[href="#/staff/data"]').count(), '| Site box enabled:', await p.evaluate(() => !document.querySelector('input[data-flag=Site][data-id=s2]').disabled));
  // 4 Sports lite file
  const kid = await p.evaluate(() => S.children.find(c => c.section === 'UCC' && c.status !== 'Closed' && c.familyAddress || c.section === 'UCC' && c.status !== 'Closed').id);
  await login('Pippen'); await go('#/child/' + kid); const t4 = await txt();
  console.log(tag, '4 Sports file: family', /Family address|Guardian/.test(t4), '| home visits card', /Home visits/.test(t4), '| record a visit', /Record a visit/.test(t4), '| refer', /Refer to a section/.test(t4), '| fits', await fits());
  // 5 file: Change on Details, Education form
  await login('Lewis'); await go('#/child/' + kid); console.log(tag, '5 Details Change:', await p.locator('.cardhead a:has-text("Change")').count(), '| edu Change:', await p.locator(`a[href="#/child/${kid}/edu"]`).count());
  await go(`#/child/${kid}/edu`); await p.fill('form[data-form=edu] [name=schoolName]', 'St Andrews Secondary'); await p.selectOption('form[data-form=edu] [name=schoolType]', { index: 4 }); await p.fill('form[data-form=edu] [name=grade]', 'form 2');
  await p.click('form[data-form=edu] button.pri, form[data-form=edu] button'); await p.waitForTimeout(400); console.log(tag, '  saved:', await p.evaluate(k => { const c = child(k); return [c.schoolName, c.schoolType, c.grade, location.hash].join(' | '); }, kid));
  await go('#/children?section=UCC'); console.log(tag, '6 Education cell:', await p.evaluate(k => { const r = document.querySelector(`tr[data-href="#/child/${k}"] td.edu`); return r ? r.innerText.replace(/\n/g, ' / ') : 'not shown (phone)'; }, kid), '| fits', await fits());
  if (tag === 'pc') { console.log(tag, '  table width', await p.evaluate(() => [document.querySelector('.ctable').scrollWidth, document.querySelector('.ctable').closest('.tw').clientWidth])); await p.screenshot({ path: OUT + 'b15-children.png' }); }
  // 7 icons
  console.log(tag, '7 icons:', await p.evaluate(() => ['Luigi', 'Nkwazi', 'UCC'].map(k => k + ':' + (keyMark(k).includes('cyp-disc') ? 'disc' : 'swatch')).join(' ')));
  // 8 referral with the colleague's report
  await p.evaluate(k => { const v = { id: uid('v'), childId: String(k), team: 'Others', date: today(), purpose: 'Follow-up', where: 'Home', by: 's15', recordedBy: 's15', recordedOn: today(), successful: 'Yes', findings: 'The mother asks for help with school fees.' }; S.visits.push(v); referAdd(k, 'Sports', 'Family', 'Home visit suggested', 'Please go this month', today(), v.id); save(); }, kid);
  await login('Bernard'); await go('#/referrals?to=Family'); console.log(tag, '8 referral:', await p.evaluate(() => { const r = document.querySelector('.cyp-referral'); return r ? r.innerText.replace(/\n/g, ' / ').slice(0, 260) : 'none'; }), '| record row:', await p.locator('.cyp-referral a.cyp-row--link[href^="#/visitrep/"]').count(), '| fits', await fits());
  if (tag === 'ph') await p.screenshot({ path: OUT + 'b15-referral-ph.png', fullPage: false });
  // 9 counselling: no report tabs on the page, old link goes to Reports
  await login('Chippo'); await go('#/counseling'); console.log(tag, '9 counselling tabs:', await p.locator('.ctabs a').count(), '| record buttons:', await p.locator('.cnew a').count());
  await go('#/counseling?cv=week'); await p.waitForTimeout(300); console.log(tag, '  old link ->', await p.evaluate(() => location.hash), '| h1', await p.evaluate(() => document.querySelector('h1').innerText), '| kind tabs', await p.locator('.ctabs a').count());
  await go('#/reports?s=Counseling&cv=quarter'); console.log(tag, '  quarterly in Reports:', /Quarterly report/.test(await txt()), '| fits', await fits());
  // 10 picker in group counselling
  await go('#/counseling/new?type=Group'); await p.waitForTimeout(300); console.log(tag, '10 picker:', await p.evaluate(() => [...document.querySelectorAll('select[data-pf=reg] option')].map(o => o.textContent).join(' / ')));
  await p.selectOption('select[data-pf=reg]', 'Nkwazi'); await p.waitForTimeout(200); const nN = await p.locator('#sessgroup input[data-pkid]').count();
  await p.check('input[data-pf=sex][value=F]'); await p.waitForTimeout(200); const nF = await p.locator('#sessgroup input[data-pkid]').count();
  await p.click('button[data-pact=all]'); await p.waitForTimeout(200); const tk = await p.evaluate(() => UI.sessKids.size);
  await p.selectOption('select[data-pf=reg]', 'Luigi'); await p.waitForTimeout(200); console.log(tag, '  Nkwazi', nN, '| girls', nF, '| ticked all', tk, '| after changing register still ticked', await p.evaluate(() => UI.sessKids.size), '| ticked listed on top', await p.locator('#sessgroup input[data-pkid]:checked').count(), '| fits', await fits());
  if (tag === 'ph') await p.screenshot({ path: OUT + 'b15-picker-ph.png' });
  // 11 Luigi grid: photo, other sheets, day link
  await p.evaluate(() => { const c = S.children.find(x => x.section === 'Luigi' && x.status !== 'Closed'); luigiToggle(c.id, today(), 'Drop-in', true); luigiToggle(c.id, today(), 'Day outreach', true); save(); });
  await login('Cristoph'); await go('#/attendance?c=Luigi&lt=day'); await p.waitForTimeout(300);
  console.log(tag, '11 Luigi grid: photos', await p.locator('.lgrid .lnm .av, .lgrid .lnm img').count() > 0, '| other sheet marks', await p.locator('.lgrid td.lc .cyp-cellnote').count(), '| day links', await p.locator('.lgrid thead th a').count(), '| fits', await fits());
  await p.click('.lgrid thead th.td a'); await p.waitForTimeout(400); console.log(tag, '  day link opens:', await p.evaluate(() => location.hash));
  await go('#/attendance?c=Luigi&lt=day'); if (tag === 'pc') await p.screenshot({ path: OUT + 'b15-luigi-grid.png' });
  await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
