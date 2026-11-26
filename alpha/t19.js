const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(400);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(350); };
  const shot = async (n, full) => p.screenshot({ path: 'shots/W-' + n + '.png', fullPage: !!full });
  const login = async who => { if (await p.$('[data-act=logout]')) await p.click('[data-act=logout]'); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(200); };
  await login('Clement Mwamba');
  await go('#/pending'); await shot('todo', true);
  console.log('cards:', await p.evaluate(() => [...document.querySelectorAll('.ovcard')].map(c => c.querySelector('h2').textContent + ' [' + c.querySelector('.ovsum').textContent + '] ' + [...c.querySelectorAll('.al')].map(a => a.className.replace('al ', '') + ':' + a.innerText.replace(/\n/g, ' ').replace(' ›', '')).join(' | ')).join('\n  ')));
  // every line opens a page without error and the target exists
  const links = await p.evaluate(() => [...document.querySelectorAll('.ovcard .al')].map(a => a.getAttribute('href')));
  for (const h of links) { await go(h); const ok = await p.evaluate(() => !!document.querySelector('.main h1')); if (!ok) console.log('BROKEN', h); }
  console.log('links checked', links.length);
  await login('Bernard Chabu');
  await go('#/pending'); console.log('bernard first card:', await p.evaluate(() => document.querySelector('.ovcard h2').textContent));
  await go('#/visits'); await shot('visits-done');
  console.log('tabs:', await p.evaluate(() => [...document.querySelectorAll('#vtabs a')].map(a => a.innerText.replace(/\n/g, ' ')).join(' | ')));
  await p.click('#vtabs a:has-text("Who needs a visit")'); await p.waitForTimeout(250); await shot('visits-need', true);
  console.log('need:', await p.evaluate(() => [document.querySelector('#need h2').textContent, document.querySelectorAll('#need .it').length, document.querySelectorAll('#need .it a.btn').length, document.querySelectorAll('#need [data-pact=plan]').length, !!document.querySelector('#luigi')]));
  await p.click('#need [data-pact=plan]'); await p.waitForTimeout(250);
  await p.click('#vtabs a:has-text("Plan of the month")'); await p.waitForTimeout(250); console.log('plan:', await p.evaluate(() => document.querySelector('#plan h2').textContent + ' / ' + document.querySelector('#plan .sub').textContent.slice(0, 60)));
  await p.click('#vtabs a:has-text("Actions still open")'); await p.waitForTimeout(250); console.log('actions:', await p.evaluate(() => [document.querySelector('#actions h2').textContent, document.querySelectorAll('#actions .it').length]));
  await p.click('#actions [data-act=actiondone]'); await p.waitForTimeout(200); console.log('after done:', await p.evaluate(() => document.querySelector('#actions h2').textContent));
  // record a visit: lands on the list, not on a page that asks to plan
  const cid = await p.evaluate(() => S.children.find(c => c.section === 'UCC' && isCurrent(c)).id);
  await go('#/visit/new?child=' + cid); await p.selectOption('[name=purpose]', 'Follow-up'); await p.fill('[name=findings]', 'ok'); await p.click('form[data-form=visit] button.pri'); await p.waitForTimeout(350);
  console.log('after save:', await p.evaluate(() => [location.hash, document.querySelector('#vtabs a.on').textContent.trim().slice(0, 12), document.querySelector('.main table tbody tr td:nth-child(4)').textContent.trim().slice(0, 30)]));
  await go('#/child/' + cid); console.log('profile plan buttons:', await p.evaluate(() => [document.querySelectorAll('[data-pact=plan]').length, [...document.querySelectorAll('.card h2')].find(h => h.textContent === 'Home visits').parentElement.innerText.replace(/\n/g, ' | ').slice(0, 200)]));
  // child form fields
  const lk = await p.evaluate(() => S.children.find(c => c.section === 'Luigi' && isCurrent(c) && !c.relStreet && !c.backStreet).id);
  await go('#/child/' + lk + '/edit'); await p.selectOption('[name=relStreet]', 'Yes'); await p.fill('[name=relStreetWho]', 'Older sister'); await p.selectOption('[name=backStreet]', 'Family'); await p.fill('[name=backStreetDate]', '2026-11-02'); await shot('child-form');
  await p.click('form[data-form=child] button.pri'); await p.waitForTimeout(300); await shot('child-profile');
  console.log('saved child:', await p.evaluate(id => { const c = child(id); return [c.relStreet, c.relStreetWho, c.backStreet, c.backStreetDate, [...document.querySelectorAll('.top .chip')].map(x => x.textContent).join(',')]; }, lk));
  // groups
  for (const g of ['ABA', 'rel', 'back', 'backq']) { await go('#/children?grp=' + g + (g === 'backq' ? '&status=all' : '')); console.log('group', g, await p.evaluate(() => document.querySelectorAll('#childTable tbody tr').length), g === 'ABA' ? await p.evaluate(() => !!document.querySelector('[data-mact=abasheet]')) : ''); }
  const bq = await p.evaluate(() => S.children.find(c => backAuto(c)).id); await go('#/child/' + bq); await shot('back-ask');
  console.log('back ask:', await p.evaluate(() => (document.querySelector('.warn') || {}).innerText)); await p.click('[data-mact=backyes]'); await p.waitForTimeout(200);
  console.log('confirmed:', await p.evaluate(id => [child(id).backStreet, child(id).backStreetDate, !!backAuto(child(id))], bq));
  await go('#/children'); console.log('records panel:', await p.evaluate(() => (document.querySelector('#records summary') || {}).innerText));
  // ABA in reports
  await go('#/reports?s=Family'); const fam = await p.evaluate(() => [...document.querySelectorAll('#rtable tbody tr:not(.hide)')].slice(0, 2).map(tr => tr.innerText.replace(/\s+/g, ' ')).join(' / '));
  await p.click('.seg a:has-text("ABA only")'); await p.waitForTimeout(250); await shot('report-aba', true);
  console.log('family all:', fam); console.log('family aba:', await p.evaluate(() => [document.querySelector('.card h2').textContent, [...document.querySelectorAll('#rtable tbody tr:not(.hide)')].slice(0, 2).map(tr => tr.innerText.replace(/\s+/g, ' ')).join(' / '), S.children.length]));
  const [d1] = await Promise.all([p.waitForEvent('download'), p.click('[data-mact=abasheet]')]); console.log('download', d1.suggestedFilename());
  await go('#/reports?s=School&aba=1'); console.log('school aba rows:', await p.evaluate(() => [...document.querySelectorAll('#rtable tbody tr:not(.hide)')].map(tr => tr.innerText.replace(/\s+/g, ' ')).filter(x => /ABA|supported/.test(x)).join(' / ')));
  await go('#/visits?vt=all&vg=ABA'); console.log('visits ABA filter:', await p.evaluate(() => [document.querySelectorAll('.main table tbody tr').length, filteredVisits(new URLSearchParams('vt=all')).length]));
  // attendance checks
  await go('#/attendance?c=Minsundu'); await shot('att-check', true);
  console.log('att top:', await p.evaluate(() => [...document.querySelectorAll('.main > .warn, .main > .note')].map(x => x.innerText.replace(/\n/g, ' ')).join(' || ') + ' | list: ' + (document.querySelector('#attcheck h2') || {}).textContent));
  // Luigi findings
  await login('Iness Phiri'); await go('#/attendance?c=Luigi');
  await p.fill('[data-lf=findings]', 'Three new girls near the market, all say they sleep at home.'); await p.dispatchEvent('[data-lf=findings]', 'change'); await p.waitForTimeout(200);
  console.log('findings saved:', await p.evaluate(() => JSON.stringify(S.outreach.filter(s => s.date === today()).map(s => [s.type, s.findings, s.children.length]))));
  await shot('luigi-findings');
  await go('#/reports?s=Luigi'); await shot('luigi-report', true);
  console.log('luigi report extra:', await p.evaluate(() => { const h = [...document.querySelectorAll('h3')].find(x => x.textContent.startsWith('Relatives')); return h.nextElementSibling.innerText.replace(/\n/g, ' / ').replace(/\t/g, ' '); }));
  console.log('findings table rows:', await p.evaluate(() => { const h = [...document.querySelectorAll('h3')].find(x => x.textContent.startsWith('Findings')); return h.nextElementSibling.querySelectorAll('tbody tr').length; }));
  const [d2] = await Promise.all([p.waitForEvent('download'), p.click('[data-lact=xlreport]')]); console.log('download', d2.suggestedFilename());
  await go('#/pending'); console.log('iness first card:', await p.evaluate(() => document.querySelector('.ovcard h2').textContent));
  await go('#/counseling'); console.log('counsel actions:', await p.evaluate(() => (document.querySelector('#cactions h2') || {}).textContent));
  // tour
  const n = await p.evaluate(() => TOUR.length); const miss = [];
  for (let i = 0; i < n; i++) { const ok = await p.evaluate(async i => { const s = TOUR[i]; location.hash = s.go(); await new Promise(r => setTimeout(r, 350)); return !!s.find(); }, i); if (!ok) miss.push(i + 1); }
  console.log('tour steps', n, 'targets missing', miss);
  await p.setViewportSize({ width: 390, height: 844 });
  for (const h of ['#/pending', '#/visits', '#/visits?vtab=need', '#/children', '#/attendance?c=Luigi']) { await go(h); const o = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth); if (o) console.log('phone overflow', h); }
  await go('#/pending'); await shot('phone-todo');
  console.log('errors', errs); await b.close();
})();
