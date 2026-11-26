const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); p.on('dialog', d => d.accept());
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.click('text=Mauro (evaluation)');
  await p.screenshot({ path: 'shots/80-empty.png' });
  await p.goto(url + '#/staff/data');
  await p.setInputFiles('#starterfile', '/home/claude/reports/cicetekelo-starter-pack-2026-11-09.json'); await p.waitForSelector('#startermsg .ok, #startermsg .warn');
  console.log(await p.textContent('#startermsg'));
  await p.setInputFiles('#starterfile', '/home/claude/reports/cicetekelo-starter-pack-2026-11-09.json'); await p.waitForTimeout(800);
  console.log('second load:', await p.textContent('#startermsg'));
  console.log(await p.evaluate(() => [S.children.length, S.history.length, S.outreach.length]));
  for (const s of ['Luigi', 'School', 'UCC', 'Youth', 'Nkwazi', 'Family', 'Counseling', 'Table6']) {
    await p.goto(url + '#/reports?s=History&h=' + s); await p.waitForTimeout(150);
    const hdr = await p.evaluate(() => [...document.querySelectorAll('.card table thead th')].map(x => x.innerText).join(' | '));
    console.log(s, '::', hdr);
  }
  await p.goto(url + '#/reports?s=History&h=School'); await p.waitForTimeout(150); await p.screenshot({ path: 'shots/81-history.png', fullPage: true });
  await p.goto(url + '#/reports?s=School&m=2026-10'); await p.waitForTimeout(150); await p.screenshot({ path: 'shots/82-reported.png', fullPage: true });
  console.log('reported cards Oct school:', await p.locator('h2', { hasText: 'What the section reported' }).count());
  await p.goto(url + '#/reports?s=Youth&m=2026-09'); await p.waitForTimeout(150);
  console.log('reported cards Youth Sep:', await p.locator('h2', { hasText: 'What the section reported' }).count());
  await p.goto(url + '#/reports?s=History&h=Luigi'); await p.waitForTimeout(150);
  const [d] = await Promise.all([p.waitForEvent('download'), p.click('button[data-act=xl][data-k=history]')]); await d.saveAs('shots/history.xlsx');
  console.log('ERRORS', errs); await b.close();
})();
