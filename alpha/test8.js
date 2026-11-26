const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.click('text=Mauro (evaluation)');
  const fs=require('fs'); const old = JSON.parse(fs.readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-09.json','utf8'));
  // simulate user's state: old pack (40 tables, Luigi Q2 totals only) loaded twice
  old.version=1; old.history = old.history.filter(h=>!['Luigi|2026-05','Luigi|2026-Q1','Youth|2026-05','Family|2026-02','Family|2026-05','Counseling|2026-05','Counseling|2026-Q2','Nkwazi|2026-Q2','Nkwazi|2026-Q1','UCC|2026-02','UCC|2026-08','UCC|2026-06'].includes(h.section+'|'+h.period));
  const r0 = await p.evaluate(pk => { importStarterPack(pk); importStarterPack(pk); return [S.children.length, S.history.length]; }, old);
  console.log('user state before:', r0);
  await p.goto(url + '#/staff/data');
  await p.setInputFiles('#starterfile', '/home/claude/reports/cicetekelo-starter-pack-2026-11-09-v2.json');
  await p.waitForFunction(() => /new tables/.test(document.querySelector('#startermsg')?.textContent || ''));
  console.log(await p.textContent('#startermsg'));
  console.log(await p.evaluate(() => [S.children.length, S.history.length, S.children.filter(c=>nameKey(fullName(c))==='joseph kangwa'||fullName(c).includes('Kangwa Joseph')).map(c=>c.id+' '+c.section+' '+c.age)]));
  await p.goto(url + '#/staff/data'); console.log((await p.textContent('main')).match(/Loaded already[^.]*\.[^.]*\./)?.[0]);
  console.log('errors', errs); await b.close();
})();
