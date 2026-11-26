const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); p.on('dialog', d => d.accept());
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.click('text=Mauro (evaluation)');
  await p.goto(url + '#/staff/data');
  await p.setInputFiles('#importfile', '/mnt/user-data/attachments/3a39158f-1dda-5399-b8a5-94e59b8a34d9/b88f584d-users_export_1.csv'); await p.waitForSelector('#importmsg .ok');
  await p.setInputFiles('#luigifile', '/mnt/user-data/attachments/3a39158f-1dda-5399-b8a5-94e59b8a34d9/cfbf2b63-DOC_Luigi.xlsx'); await p.waitForSelector('#luigimsg .ok, #luigimsg .warn', { timeout: 10000 });
  console.log(await p.textContent('#luigimsg'));
  // re-import must not duplicate
  await p.setInputFiles('#luigifile', '/mnt/user-data/attachments/3a39158f-1dda-5399-b8a5-94e59b8a34d9/cfbf2b63-DOC_Luigi.xlsx'); await p.waitForTimeout(800);
  console.log('after reimport', await p.evaluate(() => [S.children.length, S.children.filter(c => c.section === 'Luigi').length, S.outreach.length, S.outreach[0].children.length]));
  await p.goto(url + '#/reports?s=Luigi&m=2026-01'); await p.waitForTimeout(200);
  console.log((await p.evaluate(() => tableToRows().map(r => r.join(' | ')))).join('\n'));
  await p.goto(url + '#/home'); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/70-home.png' });
  await p.goto(url + '#/children?section=Luigi'); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/71-luigi.png' });
  console.log('pending', (await p.evaluate(() => { const P = pendingData(); return [P.urgent, P.withIssues, JSON.stringify(P.issueCount)]; })));
  console.log('ERRORS', errs); await b.close();
})();
