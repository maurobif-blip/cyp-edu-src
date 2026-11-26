const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.click('text=Mauro (evaluation)');
  const pack = require('fs').readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-09.json','utf8');
  const r = await p.evaluate(pk => { const a = importStarterPack(JSON.parse(pk)); const b2 = importStarterPack(JSON.parse(pk));
    return [a.luigi.created.length, b2.luigi.created.map(c=>[c.surname,c.name,c.age]), b2.history,
      S.children.filter(c=>nameKey(fullName(c))===nameKey(fullName(b2.luigi.created[0]||{surname:'',name:''}))).map(c=>[c.id,c.section,c.age,c.ageAsOf,curAge(c),c.importedFrom])]; }, pack);
  console.log(JSON.stringify(r)); await b.close();
})();
