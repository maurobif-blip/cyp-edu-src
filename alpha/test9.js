const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.click('text=Mauro (evaluation)');
  const pk = JSON.parse(require('fs').readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-09-v2.json','utf8'));
  await p.evaluate(pk => { window.__pk = JSON.parse(JSON.stringify(pk)); }, pk); console.log(await p.evaluate(pk => { importStarterPack(pk);
    const c = S.children.find(x => x.id == '5213'); const d = Object.assign({}, c, { id: nextChildId() }); S.children.push(d);
    S.outreach[0].children.push(String(d.id)); const before = S.children.length;
    S.history.find(h => h.section==='Luigi' && h.period==='2026-Q2').rows = [['','Total children worked with',86]];
    const o = importStarterPack(JSON.parse(JSON.stringify(window.__pk))); return [before, S.children.length, o.luigi.removed, o.luigi.created.length, o.history, o.historyUpdated, S.outreach[0].children.length]; }, pk));
  await b.close();
})();
