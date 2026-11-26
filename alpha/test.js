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
  await p.goto(url);
  await p.waitForSelector('.stile');
  await p.screenshot({ path: 'shots/01-login.png' });
  await p.click('text=Mauro (evaluation)');
  await p.waitForSelector('h1');
  await p.screenshot({ path: 'shots/02-empty-home.png' });
  await p.goto(url + '#/staff/data'); await p.waitForSelector('#importfile');
  await p.setInputFiles('#importfile', '/mnt/user-data/attachments/3a39158f-1dda-5399-b8a5-94e59b8a34d9/b88f584d-users_export_1.csv');
  await p.waitForSelector('#importmsg .ok, #importmsg .warn');
  console.log('IMPORT:', await p.textContent('#importmsg'));
  const stats = await p.evaluate(() => ({ n: S.children.length, sec: S.children.reduce((a, c) => (a[c.section] = (a[c.section] || 0) + 1, a), {}), st: S.children.reduce((a, c) => (a[c.status] = (a[c.status] || 0) + 1, a), {}), res: S.children.reduce((a, c) => (a[c.residence] = (a[c.residence] || 0) + 1, a), {}), staff: S.staff.map(s => s.name), moves: S.moves.length, resp: S.children.filter(c => c.responsible).length }));
  console.log(JSON.stringify(stats));
  for (const [h, f] of [['#/home', '03-home'], ['#/pending', '04-pending'], ['#/children', '05-children'], ['#/child/5000', '06-profile'], ['#/attendance', '07-attendance'], ['#/visit/new?child=5000', '08-visit'], ['#/reports', '09-reports'], ['#/staff', '10-staff'], ['#/outreach', '11-outreach'], ['#/counseling', '12-counseling'], ['#/child/5000/status', '13-status'], ['#/child/new', '14-newchild']]) {
    await p.goto(url + h); await p.waitForTimeout(250);
    await p.screenshot({ path: 'shots/' + f + '.png', fullPage: true });
  }
  console.log('ERRORS', errs);
  await b.close();
})();
