const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.click('text=Mauro (evaluation)');
  const fs=require('fs'); const v3 = JSON.parse(fs.readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json','utf8'));
  console.log(await p.evaluate(pk => { importStarterPack(pk); const L = luigiSteps(); return { children: S.children.length, photos: Object.keys(S.photos).length, has5000: !!S.photos['5000'], noFamily: L.noFamily.length, toVisit: L.toVisit.length, urgent: pendingData().urgent }; }, v3));
  const shot = async (h, n, full) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); await p.screenshot({ path: 'shots/P-' + n + '.png', fullPage: !!full }); };
  await shot('#/home', 'home');
  await shot('#/pending?go=luigi', 'pending-luigi');
  // plan two Luigi children from Pending, then open the plan
  const btns = await p.$$('#luigi [data-pact=plan]'); await btns[0].click(); await p.waitForTimeout(200); await (await p.$$('#luigi [data-pact=plan]'))[0].click(); await p.waitForTimeout(200);
  await p.evaluate(() => location.hash = '#/visits'); await p.waitForTimeout(300);
  await p.fill('#planq', 'kabwe'); await p.waitForTimeout(200); await p.click('#planbox [data-pact=plan]'); await p.waitForTimeout(300);
  console.log('plan after adds:', await p.evaluate(() => S.plans.map(x => x.childId + ' ' + x.month + ' ' + x.purpose)));
  // record a visit for the first planned child -> done
  await p.evaluate(() => { const pl = S.plans[0]; S.visits.push({ id: 'vt1', childId: pl.childId, date: today(), purpose: 'Assessment', where: 'Home', by: USER.id, successful: 'Yes', findings: 'test' }); save(); render(); });
  await p.waitForTimeout(200); await p.screenshot({ path: 'shots/P-plan.png', fullPage: true });
  console.log('statuses:', await p.evaluate(() => S.plans.map(x => planStatus(x).k)), 'steps now:', await p.evaluate(() => { const L = luigiSteps(); return [L.noFamily.length, L.toVisit.length, L.visited.length]; }));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-pact=xlplan]')]); await dl.saveAs('shots/plan.xlsx');
  await shot('#/child/' + await p.evaluate(() => S.plans[1].childId), 'child-plan');
  await shot('#/child/5000', 'child5000');
  // defaults by section
  await p.click('[data-act=logout]'); await p.click('text=Cristoph'); await p.waitForTimeout(200);
  await shot('#/home', 'home-cristoph');
  await p.click('nav a[href="#/attendance"]'); await p.waitForTimeout(300); console.log('Cristoph attendance:', await p.textContent('h1'));
  await p.click('nav a[href="#/reports"]'); await p.waitForTimeout(300); console.log('Cristoph reports:', await p.textContent('.main section.card h2'));
  await p.click('#guide a:has-text("New face")').catch(()=>{}); 
  await p.evaluate(() => location.hash = '#/home'); await p.waitForTimeout(200); await p.click('#guide a:has-text("New face")'); await p.waitForTimeout(400); console.log('focus on:', await p.evaluate(() => document.activeElement.id), location => 0, await p.evaluate(() => location.hash));
  await p.setViewportSize({ width: 390, height: 844 }); await shot('#/home', 'home-phone'); console.log('phone overflow', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await shot('#/visits', 'visits-phone'); console.log('phone overflow visits', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log('errors', errs); await b.close();
})();
