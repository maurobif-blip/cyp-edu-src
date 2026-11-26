const { chromium } = require('playwright'); const fs = require('fs'); const SP = '/tmp/cyp-shots/';
(async () => {
  const b = await chromium.launch(); const errs = []; const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', x => x.accept());
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400);
  await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(700);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); }; const as = w => p.evaluate(w => { USER = S.staff.find(s => s.name.includes(w)); UI.planq = ''; render(); return [USER.name, staffAreas(USER).join(',')]; }, w);
  const [k1, kl] = await p.evaluate(() => [S.children.find(c => isCurrent(c) && centreOf(c) === 'Minsundu' && needsVisits(c)).id, S.children.find(c => c.section === 'Luigi' && isCurrent(c)).id]);
  console.log('as', await as('Pippen'));
  await go('#/referrals'); await p.click('a:has-text("Refer a child")'); await p.waitForTimeout(400);
  console.log('refer page', await p.evaluate(() => [document.querySelector('h1').innerText, document.querySelector('[name=from]').value, [...document.querySelector('[name=referTo]').options].map(o => o.text).join('|'), document.querySelector('[name=referWhy]').options[1].text]));
  await p.click('form[data-form=refer] button.pri'); await p.waitForTimeout(300); console.log('no child: still on the page', await p.evaluate(() => location.hash));
  await p.evaluate(id => { const cp = document.querySelector('.cpick'); cp.innerHTML = '<span>Child *</span>' + childPickInner('id', id); }, k1);
  await p.selectOption('[name=referTo]', 'Family'); await p.selectOption('[name=referWhy]', 'Home visit suggested'); await p.fill('[name=referNote]', 'He stopped coming to training, the mother may have moved'); await p.click('form[data-form=refer] button.pri'); await p.waitForTimeout(500);
  await go('#/child/' + kl + '/refer'); await p.selectOption('[name=referTo]', 'Family'); await p.selectOption('[name=referWhy]', 'Problem at home'); await p.click('form[data-form=refer] button.pri'); await p.waitForTimeout(500);
  console.log('referrals saved', await p.evaluate(() => S.events.filter(e => e.type === 'Referral').map(e => [e.from, e.to, e.reason])));
  console.log('as', await as('Bernard')); await go('#/home'); console.log('Bernard To do', await p.evaluate(() => (document.querySelector('main').innerText.match(/\d+\s*children referred by colleagues|\d+\s*child referred by colleagues/) || ['no line'])[0].replace(/\s+/g, ' ')));
  await go('#/visits?vt=Family&vtab=plan');
  console.log('plan page: box', await p.evaluate(() => (document.querySelector('#refteam h2') || {}).innerText), '| filters', await p.evaluate(() => [...document.querySelectorAll('.pfil .seg')[1].querySelectorAll('a')].map(a => a.innerText).join(' / ')));
  console.log('first tiles', await p.evaluate(() => [...document.querySelectorAll('.ptile')].slice(0, 3).map(t => [t.className.replace('ptile', '').trim(), t.querySelector('b').innerText, (t.querySelector('small.rf') || {}).innerText || ''])));
  await p.click('.pfil .seg a:has-text("Referred")'); await p.waitForTimeout(400); console.log('Referred filter', await p.evaluate(() => [...document.querySelectorAll('.ptile b')].map(x => x.innerText)), '| Luigi child is in', await p.evaluate(id => !!document.querySelector(`.ptile[data-id="${id}"]`), kl));
  await p.screenshot({ path: SP + 'plan-referred.png' });
  await p.click(`.ptile[data-id="${k1}"]`); await p.waitForTimeout(400); console.log('in the plan', await p.evaluate(id => plans().some(x => String(x.childId) === id), k1));
  await go('#/visits?vt=Family&vtab=need'); console.log('need tab box', await p.evaluate(() => [(document.querySelector('#refteam h2') || {}).innerText, !!document.querySelector('#refteam a[href*="visit/new"]')]));
  await go('#/visits?vt=School&vtab=plan'); console.log('School plan: no box, no Referred filter', await p.evaluate(() => [!document.querySelector('#refteam'), !/Referred/.test(document.querySelector('.pfil').innerText)]));
  await go('#/visits?vt=Family&vtab=need'); await p.fill('#refteam form.refdone input[name=note]', 'Visited, mother found in Kabushi'); await p.click('#refteam form.refdone button'); await p.waitForTimeout(500);
  console.log('after Done: open to Family', await p.evaluate(() => referOpen('Family').length));
  /* a section asks Sports */
  await go('#/referrals/new?child=' + k1); await p.selectOption('[name=referTo]', 'Sports'); await p.selectOption('[name=referWhy]', 'Other'); await p.fill('[name=referNote]', 'Wants to join basketball'); await p.click('form[data-form=refer] button.pri'); await p.waitForTimeout(500);
  console.log('as', await as('Pippen')); await go('#/home'); console.log('Pippen To do', await p.evaluate(() => /Sports[\s\S]{0,80}referred by colleagues/.test(document.querySelector('main').innerText)), 'red count', await p.evaluate(() => todoCount()));
  await go('#/activities'); console.log('Activities box', await p.evaluate(() => (document.querySelector('#refteam') || {}).innerText.replace(/\s+/g, ' ').slice(0, 160)));
  await p.setViewportSize({ width: 393, height: 850 }); for (const h of ['#/activities', '#/referrals/new', '#/referrals']) { await go(h); console.log('phone fits', h, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); }
  await as('Bernard'); await go('#/visits?vt=Family&vtab=plan'); console.log('phone plan fits', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  console.log('errors', errs); await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 600)); process.exit(1); });
