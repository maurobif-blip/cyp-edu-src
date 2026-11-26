// beta 1.7: case studies in six parts (Pippen, 24/11) and health conditions for the Sports coaches
const { chromium } = require('playwright'); const fs = require('fs'); const OUT = '/tmp/cyp-shots/';
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [w, tag] of [[393, 'ph'], [1366, 'pc']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 820 }, isMobile: w < 900, hasTouch: w < 900, reducedMotion: 'reduce', acceptDownloads: true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  const login = async who => { await p.evaluate(() => { if (typeof USER !== 'undefined' && USER) { USER = null; render(); } }); await p.waitForTimeout(200); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', '0000'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); } };
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(450); };
  const fits = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  const kid = await p.evaluate(() => { const c = S.children.find(x => x.section === 'UCC' && x.status !== 'Closed'); c.medical = 'Asthma, carries an inhaler'; c.notes = 'Private case note'; c.activities = ['Football']; save(); return c.id; });
  // 1 coach: health conditions yes, notes no, health line in the register
  await login('Pippen'); await go('#/child/' + kid); const t1 = await p.evaluate(() => document.querySelector('.main').innerText);
  console.log(tag, '1 coach file: asthma', /Asthma/.test(t1), '| private note', /Private case note/.test(t1), '| case box', /Case studies/.test(t1), '| fits', await fits());
  await go('#/activities?a=Football'); console.log(tag, '  register health line:', await p.locator('.hline:has-text("Asthma")').count());
  // 2 write a case study
  await go('#/child/' + kid); await p.click('a:has-text("Write a case study")'); await p.waitForTimeout(400);
  console.log(tag, '2 form parts:', await p.locator('form[data-form=casestudy] textarea').count(), '| section', await p.evaluate(() => document.querySelector('form[data-form=casestudy] [name=section]').value), '| fits', await fits());
  await p.click('form[data-form=casestudy] button.pri'); await p.waitForTimeout(300); console.log(tag, '  empty refused:', await p.evaluate(() => location.hash.includes('/case/new')));
  const parts = ['Lived on the street near the market.', 'Brought by the Luigi outreach team.', 'Football three times a week.', 'Plays in the under-15 league.', 'Comes on time, helps the younger ones.', 'Back in school and living with his aunt.'];
  const ta = await p.$$('form[data-form=casestudy] textarea'); for (let i = 0; i < ta.length; i++) await ta[i].fill(parts[i]);
  await p.click('form[data-form=casestudy] button.pri'); await p.waitForTimeout(500);
  console.log(tag, '  saved ->', await p.evaluate(() => location.hash.slice(0, 8)), '| parts shown', await p.locator('.main h2').count());
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-cs=word]')]); const f = OUT + 'case-' + tag + '.docx'; await dl.saveAs(f); console.log(tag, '  word', dl.suggestedFilename(), fs.statSync(f).size > 3000);
  // 3 change, list, history, who sees
  await p.click('a:has-text("Change")'); await p.waitForTimeout(300); await p.fill('form[data-form=casestudy] [name=p_outcome]', 'Back in school, lives with his aunt, captain of the team.'); await p.click('form[data-form=casestudy] button.pri'); await p.waitForTimeout(400);
  console.log(tag, '3 changed:', /captain of the team/.test(await p.evaluate(() => document.querySelector('.main').innerText)), '| one case in list', await p.evaluate(() => caseAll().length));
  await go('#/cases?s=Sports'); console.log(tag, '  list rows:', await p.locator('.main .cyp-row--link').count(), '| fits', await fits());
  await login('Lewis'); await go('#/child/' + kid); console.log(tag, '  centre staff sees it:', await p.locator('#casebox .cyp-row--link').count(), '| history line', await p.locator('a:has-text("Open the case study")').count());
  await login('Merabe'); await go('#/cases'); console.log(tag, '  other section (School) sees:', await p.locator('.main .cyp-row--link').count());
  // 4 player profile
  await login('Pippen'); await go('#/child/' + kid); console.log(tag, '4 player box:', await p.locator('#playerbox summary').innerText());
  await p.click('#playerbox summary'); await p.click('#playerbox a:has-text("Write the profile")'); await p.waitForTimeout(300);
  await p.fill('form[data-form=player] [name=role]', 'Midfielder'); await p.selectOption('form[data-form=player] [name=level]', 'Plays in competitions'); await p.fill('form[data-form=player] [name=strengths]', 'Reads the game, passes well'); await p.click('form[data-form=player] button.pri'); await p.waitForTimeout(400);
  await p.click('#playerbox summary'); console.log(tag, '  saved:', (await p.locator('#playerbox').innerText()).replace(/\n/g, ' / ').slice(0, 200), '| fits', await fits());
  await login('Lewis'); await go('#/child/' + kid); await p.click('#playerbox summary'); console.log(tag, '  Lewis reads, no change button:', /Midfielder/.test(await p.locator('#playerbox').innerText()), await p.locator('#playerbox a:has-text("Change")').count());
  if (tag === 'ph') { await login('Pippen'); await go('#/child/' + kid); await p.click('#playerbox summary'); await p.locator('#playerbox').screenshot({ path: OUT + 'player-ph.png' }); }
  if (tag === 'ph') { await login('Pippen'); await go('#/case/' + await p.evaluate(() => caseAll()[0].id)); await p.screenshot({ path: OUT + 'case-ph.png', fullPage: true }); }
  await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
