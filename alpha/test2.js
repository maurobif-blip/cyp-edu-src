const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  p.on('dialog', d => d.accept());
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.waitForSelector('.stile');
  await p.click('text=Mauro (evaluation)');
  await p.goto(url + '#/staff/data'); await p.waitForSelector('#importfile');
  await p.setInputFiles('#importfile', '/mnt/user-data/attachments/3a39158f-1dda-5399-b8a5-94e59b8a34d9/b88f584d-users_export_1.csv');
  await p.waitForSelector('#importmsg .ok');
  // reintegrated moves with no date should not count this month
  await p.goto(url + '#/reports?s=Family'); await p.waitForTimeout(200);
  console.log('FML6 row:', await p.locator('#rtable tr', { hasText: 'FML 6' }).innerText());
  // record a visit through the form
  await p.goto(url + '#/visit/new?child=5000'); await p.waitForSelector('form[data-form=visit]');
  await p.selectOption('select[name=purpose]', 'Family tracing');
  await p.fill('textarea[name=findings]', 'Test visit');
  await p.fill('input[name=action]', 'Call the mother');
  await p.click('form[data-form=visit] button.pri'); await p.waitForTimeout(300);
  console.log('after visit url', p.url().split('#')[1]);
  // event
  await p.selectOption('form[data-form=event] select[name=type]', 'Sick, medical attention');
  await p.click('form[data-form=event] button'); await p.waitForTimeout(200);
  // attendance: mark 5001 absent 3 days
  const kid = await p.evaluate(() => S.children.find(c => c.residence === 'Resident' && c.status === 'Active').id);
  for (const d of ['2026-11-05', '2026-11-06', '2026-11-09']) {
    await p.goto(url + '#/attendance?d=' + d); await p.waitForTimeout(150);
    await p.click(`button[data-act=att][data-id="${kid}"][data-v=A]`); await p.waitForTimeout(100);
  }
  await p.click('button[data-act=allpresent]'); await p.waitForTimeout(150);
  // move a child to Youth, reintegrate another, close+reopen another
  await p.goto(url + '#/child/5001/status'); await p.waitForSelector('form[data-form=move]');
  await p.selectOption('form[data-form=move] select[name=to]', 'Youth'); await p.click('form[data-form=move] button'); await p.waitForTimeout(200);
  await p.goto(url + '#/child/5002/status'); await p.waitForSelector('form[data-form=reintegrate]');
  await p.click('form[data-form=reintegrate] button'); await p.waitForTimeout(200);
  await p.goto(url + '#/child/5003/status'); await p.waitForSelector('form[data-form=close]');
  await p.selectOption('form[data-form=close] select[name=reason]', 'Returned to Social Welfare'); await p.click('form[data-form=close] button'); await p.waitForTimeout(200);
  await p.goto(url + '#/child/5003/status'); await p.waitForSelector('form[data-form=reopen]');
  // outreach with 2 new kids
  await p.goto(url + '#/outreach'); await p.waitForSelector('form[data-form=outreach]');
  await p.selectOption('form[data-form=outreach] select[name=type]', 'Night outreach');
  await p.fill('textarea[name=newKids]', 'Test Boy, Shorty, M, 13, Chipulukusu\nTest Girl, , F, 14, Masala');
  await p.click('form[data-form=outreach] button'); await p.waitForTimeout(200);
  // counseling
  await p.goto(url + '#/counseling'); await p.waitForSelector('form[data-form=session]');
  await p.selectOption('form[data-form=session] select[name=type]', 'Group'); await p.fill('input[name=others]', '6');
  await p.click('form[data-form=session] button'); await p.waitForTimeout(200);
  // new child
  await p.goto(url + '#/child/new'); await p.waitForSelector('form[data-form=child]');
  await p.fill('input[name=name]', 'Newchild'); await p.selectOption('select[name=sex]', 'F'); await p.selectOption('select[name=section]', 'Nkwazi'); await p.fill('input[name=age]', '9');
  await p.check('input[name=support][value=Nutrition]'); await p.selectOption('select[name=schoolType]', 'Nkwazi community school');
  await p.click('form[data-form=child] button.pri'); await p.waitForTimeout(300);
  console.log('new child url', p.url().split('#')[1]);
  const out = {};
  for (const s of ['Luigi', 'Nkwazi', 'UCC', 'Youth', 'Family', 'School', 'Counseling', 'Table6']) {
    await p.goto(url + '#/reports?s=' + s); await p.waitForTimeout(150);
    out[s] = await p.evaluate(() => tableToRows().map(r => r.join(' | ')));
  }
  console.log(JSON.stringify(out, null, 1));
  await p.goto(url + '#/pending'); await p.waitForTimeout(200);
  console.log('PENDING tiles:', (await p.locator('.tile').allInnerTexts()).map(x => x.replace(/\n/g, ' ')).join(' / '));
  console.log('NAV:', await p.locator('.nav').innerText());
  await p.screenshot({ path: 'shots/20-pending.png', fullPage: true });
  await p.goto(url + '#/home'); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/21-home.png' });
  // backup / export downloads
  await p.goto(url + '#/staff/data'); await p.waitForSelector('button[data-act=backup]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button[data-act=backup]')]);
  await dl.saveAs('shots/backup.json');
  const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('button[data-act=export][data-k=children]')]);
  await dl2.saveAs('shots/children.csv');
  // persistence: reload
  await p.reload(); await p.waitForTimeout(500);
  console.log('after reload', await p.evaluate(() => [S.children.length, S.visits.length, USER && USER.name]));
  // restore into wiped state
  await p.click('button[data-act=wipe]'); await p.waitForTimeout(300);
  console.log('after wipe', await p.evaluate(() => S.children.length));
  await p.goto(url + '#/staff/data'); await p.waitForSelector('#restorefile', { state: 'attached' });
  await p.setInputFiles('#restorefile', 'shots/backup.json'); await p.waitForTimeout(400);
  console.log('after restore', await p.evaluate(() => [S.children.length, S.visits.length]));
  // non-admin cannot see staff
  await p.click('button[data-act=logout]'); await p.click('text=Bernard'); await p.waitForTimeout(200);
  console.log('Bernard nav:', await p.locator('.nav').innerText());
  // mobile
  await p.setViewportSize({ width: 390, height: 844 }); await p.goto(url + '#/visit/new?child=5000'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'shots/22-mobile-visit.png', fullPage: true });
  const ow = await p.evaluate(() => document.documentElement.scrollWidth); console.log('mobile scrollWidth', ow);
  console.log('ERRORS', errs);
  await b.close();
})();
