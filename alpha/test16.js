const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(400);
  const shot = async (h, n, full) => { if (h) { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(400); } await p.screenshot({ path: 'shots/V-' + n + '.png', fullPage: !!full }); };
  const login = async who => { if (await p.$('[data-act=logout]')) await p.click('[data-act=logout]'); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(200); };
  await login('Bernard Chabu');
  await shot('#/visits', 'visits-bernard', true);
  console.log('bernard sel', await p.evaluate(() => [JSON.stringify(visitSel(route().q)), planFor(thisMonth(), 'Family').length, planFor(thisMonth(), 'Luigi').length, planFor(thisMonth()).length, filteredVisits(route().q).length]));
  await p.click('#vchoose .seg a:has-text("Luigi Drop-in")'); await p.waitForTimeout(200);
  console.log('luigi sel', await p.evaluate(() => [JSON.stringify(visitSel(route().q)), document.querySelector('#plan h2').textContent, [...document.querySelectorAll('#plan .it .chip')].map(x => x.textContent).join('|'), filteredVisits(route().q).length]));
  await shot(null, 'visits-luigi', true);
  await p.click('#vchoose .seg a:has-text("Family Section")'); await p.click('#vchoose .cbtn:has-text("Nkwazi")'); await p.waitForTimeout(200);
  console.log('family nkwazi', await p.evaluate(() => [JSON.stringify(visitSel(route().q)), document.querySelector('.vnow').textContent, document.querySelectorAll('#plan .cgrp').length, document.querySelector('[data-pact=plandue]') && document.querySelector('[data-pact=plandue]').textContent]));
  // search restricted to centre
  const nk = await p.evaluate(() => { const c = S.children.find(c => c.section === 'Nkwazi' && isCurrent(c) && !plans().some(p => String(p.childId) === String(c.id))); const u = S.children.find(c => c.section === 'UCC' && isCurrent(c)); return [c.name + ' ' + c.surname, c.id, u.name + ' ' + u.surname]; });
  await p.fill('#planq', nk[2]); await p.waitForTimeout(150); console.log('UCC child searched in Nkwazi:', (await p.textContent('#planbox')).slice(0, 140));
  await p.fill('#planq', nk[0]); await p.waitForTimeout(150); await p.click('#planbox [data-pact=plan]'); await p.waitForTimeout(200);
  console.log('plan added', await p.evaluate(id => JSON.stringify(plans().filter(p => p.childId === String(id))), nk[1]));
  await shot(null, 'visits-family-nkwazi', true);
  // record a visit from the plan
  await p.click(`#plan a[href*="child=${nk[1]}"]`); await p.waitForTimeout(300);
  console.log('form team', await p.inputValue('[name=team]'), await p.inputValue('[name=childId]'));
  await shot(null, 'visit-form');
  await p.selectOption('[name=purpose]', 'Follow-up'); await p.fill('[name=findings]', 'Test'); await p.click('form[data-form=visit] button.pri'); await p.waitForTimeout(300);
  console.log('visit saved', await p.evaluate(id => { const v = S.visits[S.visits.length - 1]; const pl = plans().find(p => p.childId === String(id)); return [v.team, v.childId, planStatus(pl).k]; }, nk[1]));
  // school team
  await p.evaluate(() => location.hash = '#/visits?vt=School'); await p.waitForTimeout(300);
  console.log('school', await p.evaluate(() => [filteredVisits(route().q).length, S.visits.filter(v => v.purpose === 'School visit' && v.date.slice(0, 7) === thisMonth()).length, document.querySelector('a.btn.pri[href^="#/visit/new"]').getAttribute('href')]));
  await p.click('a.btn.pri[href^="#/visit/new"]'); await p.waitForTimeout(200); console.log('school form', await p.inputValue('[name=team]'), await p.inputValue('[name=purpose]'), await p.inputValue('[name=where]'));
  // to do, by centre
  await shot('#/pending', 'pending', true);
  console.log('pending seg', await p.evaluate(() => [...document.querySelectorAll('#visits .seg a')].map(x => x.textContent).join(' | ')));
  await p.click('#visits .seg a:has-text("Nkwazi")'); await p.waitForTimeout(200); console.log('pending nkwazi rows', await p.evaluate(() => [document.querySelectorAll('#visits .it').length, [...new Set([...document.querySelectorAll('#visits .cchip')].map(x => x.textContent))].join(',')]));
  // attendance Nkwazi
  await login('Chisha Mulenga');
  await shot('#/attendance', 'att-nkwazi');
  console.log('nkwazi', await p.evaluate(() => [document.querySelector('h1').textContent, [...document.querySelectorAll('.top .seg')][1].textContent, document.querySelectorAll('#attTable tbody tr').length]));
  await p.click('.top .seg a:has-text("Residents")'); await p.waitForTimeout(200);
  console.log('nkwazi residents', await p.evaluate(() => [document.querySelector('h1').textContent, document.querySelectorAll('#attTable tbody tr').length, document.querySelectorAll('#attTable .att button').length / Math.max(1, document.querySelectorAll('#attTable tbody tr').length)]));
  await p.click('.top .seg a:has-text("Minsundu")'); await p.waitForTimeout(200); console.log('switch centre resets group:', await p.evaluate(() => [document.querySelector('h1').textContent, location.hash]));
  console.log('chisha visits default', await p.evaluate(() => { location.hash = '#/visits'; return JSON.stringify(visitSel(new URLSearchParams(''))); }));
  // Luigi sheets
  await login('Iness Phiri');
  await shot('#/attendance', 'luigi-day', true);
  console.log('luigi tiles', await p.evaluate(() => [...document.querySelectorAll('#lsheets .tile')].map(x => x.innerText.replace(/\n/g, ' / ')).join(' || ')));
  const d = await p.evaluate(() => today());
  await p.check('[data-lstaff=dropin][value=s23]'); await p.waitForTimeout(150);
  await p.click('#lattBody tbody tr:nth-child(1) [data-lact=day]'); await p.waitForTimeout(150); await p.click('#lattBody tbody tr:nth-child(2) [data-lact=day]'); await p.waitForTimeout(150);
  await p.click('#lsheets .tile:has-text("Night outreach")'); await p.waitForTimeout(200);
  await p.click('#lattBody tbody tr:nth-child(1) [data-lact=day]'); await p.waitForTimeout(150);
  await p.selectOption('[data-lstaffadd=night]', { label: 'Kelvin Chongo' }); await p.waitForTimeout(150); await p.check('[data-lstaff=night][value=s24]'); await p.waitForTimeout(150);
  await p.fill('[data-lnote=night]', 'Masala market and Broadway'); await p.dispatchEvent('[data-lnote=night]', 'change'); await p.waitForTimeout(150);
  console.log('sessions today', await p.evaluate(d => JSON.stringify(S.outreach.filter(s => s.date === d).map(s => [s.type, s.children.length, s.staffIds, s.staff, s.notes])), d));
  await shot(null, 'luigi-night', true);
  console.log('also chips', await p.evaluate(() => document.querySelector('#lattBody tbody tr:nth-child(1) td:nth-child(2)').textContent));
  // untick everything on drop-in -> session removed only if no children/staff
  await p.click('#lsheets .tile:has-text("Day outreach")'); await p.waitForTimeout(150); await p.check('[data-lstaff=day][value=s24]'); await p.waitForTimeout(150); await p.uncheck('[data-lstaff=day][value=s24]'); await p.waitForTimeout(150);
  console.log('empty day session removed', await p.evaluate(d => S.outreach.filter(s => s.date === d).map(s => s.type).join(','), d));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-lact=xlday]')]); console.log('download', dl.suggestedFilename());
  // known box marks on the open sheet
  await p.fill('#knownq', await p.evaluate(() => { const c = S.children.find(c => c.section === 'Luigi' && isCurrent(c)); return c.name + ' ' + c.surname; })); await p.waitForTimeout(150);
  console.log('known buttons', await p.evaluate(() => [...document.querySelectorAll('#knownbox [data-lact=mark]')].slice(0, 2).map(x => x.textContent).join(' | ')));
  // month grid still works
  await p.evaluate(() => location.hash = '#/attendance?c=Luigi&lt=day'); await p.waitForTimeout(300); await p.click('.lgrid tbody tr:nth-child(3) td.lc.td'); await p.waitForTimeout(100);
  console.log('grid click', await p.evaluate(d => S.outreach.filter(s => s.date === d).map(s => [s.type, s.children.length]).join(' ; '), d));
  await shot('#/reports?s=Luigi', 'luigi-report', true);
  console.log('staff table', await p.evaluate(() => { const h = [...document.querySelectorAll('h3')].find(x => x.textContent.startsWith('Who did')); return h ? h.nextElementSibling.innerText.replace(/\n/g, ' / ').replace(/\t/g, ' ').slice(0, 400) : 'missing'; }));
  await shot('#/home', 'home-iness', true);
  console.log('family report rows', await p.evaluate(() => REPORTS.Family.rows(thisMonth()).map(r => r[1].slice(0, 22) + ':' + r[2][2]).join(' | ')));
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => location.hash = '#/visits'); await p.waitForTimeout(300);
  console.log('phone overflow visits', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)); await p.screenshot({ path: 'shots/V-phone-visits.png' });
  await p.evaluate(() => location.hash = '#/attendance?c=Luigi'); await p.waitForTimeout(300); console.log('phone overflow luigi', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)); await p.screenshot({ path: 'shots/V-phone-luigi.png' });
  console.log('errors', errs); await b.close();
})();
