const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); await p.click('.stile:has-text("Chisha")'); await p.waitForTimeout(300);
  const dir = '/tmp/cyp-shots/';
  for (const s of ['Nkwazi', 'Luigi', 'UCC', 'Youth', 'Family', 'School', 'Counseling', 'Table6']) {
    await p.evaluate(s => location.hash = '#/reports?s=' + s, s); await p.waitForTimeout(500);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=wordreport]')]); const f = dir + 'rep-' + s + '.doc'; await dl.saveAs(f);
    const t = fs.readFileSync(f, 'utf8'); console.log(s, dl.suggestedFilename(), t.length, 'tables', (t.match(/<table/g) || []).length, 'rows', (t.match(/<tr/g) || []).length, /class=|data-act|<button|<a /.test(t.split('</style>')[1]) ? 'LEFTOVERS' : 'clean', (t.match(/REPORT FOR [^<]+/) || [])[0]);
  }
  console.log('errors', errs.slice(0, 5)); await b.close();
})();
