const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/S-login.png', fullPage: true });
  console.log('tiles', (await p.$$('.stile')).length);
  // simulate an older database: old staff list, then reload
  await p.evaluate(async () => { S.staff = [['Clement','Education Department',true],['Lewis Chewe','Youth',true],['Maxwell Lungu','UCC',false],['Kelvin Chongo','UCC',false],['Dellah Victoria Shilubwe','UCC',false],['Bernard','Family',false],['Richard Kasela','Family',false],['Delian Nachula','School',false],['Marable','School',false],['Madame Chipo','Counseling',false],['Cristoph','Luigi',false],['Chisha','Nkwazi',false],['Merabe','Youth',false],['Charles','Youth',false],['Pippen','Sports',false],['Mauro (evaluation)','Other',true],['Ana (evaluation)','Other',true]].map((s,i)=>({id:'s'+(i+1),name:s[0],section:s[1],admin:s[2],active:true})); S.staff.push({id:'sx1',name:'Someone Added',section:'Luigi',admin:false,active:true}); delete S.meta.staffSeed; save(); await new Promise(r => setTimeout(r, 400)); });
  await p.reload(); await p.waitForTimeout(400);
  console.log('after migration:', await p.evaluate(() => [S.staff.length, S.staff.filter(s=>s.active).length, S.staff.find(s=>s.id==='s6').name, S.staff.find(s=>s.id==='s9').active, S.staff.find(s=>s.id==='sx1').areas, S.staff.find(s=>s.id==='s16').admin, S.staff.find(s=>s.id==='s2').areas]));
  await p.click('text=Mauro (evaluation)');
  const v3 = JSON.parse(require('fs').readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json','utf8'));
  console.log('import:', await p.evaluate(pk => { importStarterPack(pk); return [S.staff.length, S.children.filter(c => c.responsible).length, [...new Set(S.children.map(c => staffName(c.responsible)))]]; }, v3));
  const shot = async (h, n, full) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/S-' + n + '.png', fullPage: !!full }); };
  await shot('#/staff', 'staff', true);
  // flag change: give Kelvin the Nkwazi flag, add staff
  await p.check('input[data-staff=flag][data-flag=Nkwazi][data-id=s4]'); await p.fill('form[data-form=staffadd] [name=name]', 'Test Person'); await p.check('form[data-form=staffadd] [name=areas][value=Luigi]'); await p.check('form[data-form=staffadd] [name=areas][value=Family]'); await p.click('form[data-form=staffadd] button'); await p.waitForTimeout(200);
  console.log('flags:', await p.evaluate(() => [S.staff.find(s=>s.id==='s4').areas, S.staff.find(s=>s.name==='Test Person').areas]));
  for (const [who, n] of [['Bernard Chabu', 'bernard'], ['Chippo Choongo', 'chipo'], ['Kelvin Chongo', 'kelvin'], ['Pippen Musakaie', 'pippen']]) {
    await p.click('[data-act=logout]'); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(200); await shot('#/home', 'home-' + n);
    console.log(who, '->', await p.evaluate(() => [myBoxes().join(','), defCentre(), defReport(), !!document.querySelector('nav a[href="#/staff"]')]));
  }
  console.log('errors', errs); await b.close();
})();
