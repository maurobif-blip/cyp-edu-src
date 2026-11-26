const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + __dirname + '/cicetekelo-records-alpha.html'); await p.click('text=Cristoph');
  const v3 = JSON.parse(require('fs').readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json','utf8'));
  await p.evaluate(pk => { importStarterPack(pk); }, v3);
  await p.evaluate(() => location.hash = '#/home'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/R-home.png' });
  await p.evaluate(() => location.hash = '#/attendance'); await p.waitForTimeout(300);
  const row = 'tbody tr:nth-child(3) '; await p.click(row + '[data-v=S]'); await p.waitForTimeout(150); await p.click(row + '[data-v=N]'); await p.waitForTimeout(150);
  console.log('day marks:', await p.evaluate(() => { const d = today(); return S.outreach.filter(o => o.date === d).map(o => o.type + ':' + o.children.length); }));
  await p.click(row + '[data-v=S]'); await p.waitForTimeout(150); console.log('after clear:', await p.evaluate(() => { const d = today(); return S.outreach.filter(o => o.date === d).map(o => o.type + ':' + o.children.length); }));
  await p.fill('#knownq', 'new boy test'); await p.waitForTimeout(150); await p.click('[data-lact=newchild]'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/R-newchild.png', fullPage: true });
  console.log('new form:', await p.evaluate(() => [document.querySelector('[name=name]').value, document.querySelector('[name=section]').value, !!document.querySelector('details.more')]));
  console.log('errors', errs); await b.close();
})();
