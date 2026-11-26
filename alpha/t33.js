const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); await p.click('.stile:has-text("Clement")'); await p.waitForTimeout(300);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const id = await p.evaluate(() => S.children.find(c => c.section === 'UCC' && c.residence === 'Resident' && isCurrent(c) && c.schoolType === 'GRZ primary').id);
  await go('#/child/' + id); console.log('grz', await p.evaluate(() => document.querySelector('.where3').innerText.replace(/\n/g, ' | ')));
  await go('#/child/' + id + '/edit'); console.log('options', await p.evaluate(() => [...document.querySelectorAll('select[name=schoolType] option')].map(o => o.textContent), !!0), await p.evaluate(() => !!document.querySelector('select[name=alsoAt]')));
  await p.selectOption('select[name=schoolType]', 'Luigi Special School'); await p.click('form[data-form=child] button.pri'); await p.waitForTimeout(500);
  console.log('sandra', await p.evaluate(id => [document.querySelector('.where3').innerText.replace(/\n/g, ' | '), attCentres(child(id))], id));
  // older file: only the first "also at" field
  const id2 = await p.evaluate(() => { const c = S.children.find(c => c.section === 'UCC' && isCurrent(c) && !c.schoolType) || S.children.find(c => c.section === 'Youth' && isCurrent(c)); c.schoolType = ''; c.schoolName = ''; c.alsoAt = 'Nkwazi'; save(); return c.id; });
  await go('#/child/' + id2); console.log('legacy', await p.evaluate(id => [document.querySelector('.where3').innerText.replace(/\n/g, ' | '), attCentres(child(id))], id2));
  await go('#/child/' + id2 + '/edit'); console.log('legacy form default', await p.evaluate(() => document.querySelector('select[name=schoolType]').value)); await p.click('form[data-form=child] button.pri'); await p.waitForTimeout(500);
  console.log('legacy saved', await p.evaluate(id => [child(id).schoolType, child(id).alsoAt, attCentres(child(id))], id2));
  const lu = await p.evaluate(() => S.children.find(c => c.section === 'Luigi' && isCurrent(c)).id); await go('#/child/' + lu); console.log('luigi', await p.evaluate(() => document.querySelector('.where3').innerText.replace(/\n/g, ' | ')));
  await go('#/help'); console.log('help', await p.evaluate(() => document.querySelector('#sections').innerText.includes('Luigi Special School')));
  for (const s of ['UCC', 'School', 'Nkwazi']) await go('#/reports?s=' + s);
  console.log('errors', errs.slice(0, 5)); await b.close();
})();
