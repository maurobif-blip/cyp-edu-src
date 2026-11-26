const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const errs = []; const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', x => x.accept('x'));
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400);
  await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(700);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); }; const as = w => p.evaluate(w => { USER = S.staff.find(s => s.name.includes(w)); render(); return USER.name; }, w);
  const kid = await p.evaluate(() => S.children.find(c => isCurrent(c) && needsVisits(c)).id);
  const rec = async (txt, by) => { await go('#/visit/new?child=' + kid + '&t=Family'); await p.selectOption('[name="purpose"]', 'Follow-up'); if (by) await p.selectOption('[name="by"]', { label: by }); await p.fill('[name="findings"]', txt); await p.click('form[data-form="visit"] button.pri'); await p.waitForTimeout(600); return p.evaluate(t => { const v = S.visits.find(v => v.findings === t); return [v.id, visitState(v), visitCounts(v)]; }, txt); };
  const a = await rec('by clement'); console.log('visit written by Clement', a.slice(1));
  await go('#/visits?vt=all&vtab=check'); console.log('to validate list', await p.evaluate(() => [document.querySelector('#checkbox h2').innerText, document.querySelectorAll('.chk').length]));
  await go('#/visitrep/' + a[0]); console.log('report page: validation box, chip, change, cancel', await p.evaluate(() => [!!document.querySelector('#visitval'), !!document.querySelector('.lead .chip.c-orange'), !!document.querySelector('a[href*="edit="]'), !!document.querySelector('[data-dact=cancelvisit]')]));
  const rep = () => p.evaluate(() => { const { a, b } = monthCtx(thisMonth()); const r = S.visits.filter(v => inRange(v.date, a, b) && visitTeam(v) === 'Family'); return [r.length, r.filter(visitCounts).length]; }); console.log('report recorded/counted', await rep());
  const c2 = await rec('clement writes for bernard', 'Bernard Chabu'); console.log('written by Clement, made by Bernard', c2.slice(1));
  await as('Bernard'); const d = await rec('by bernard'); console.log('written by Bernard', d.slice(1)); const e = await rec('bernard says clement did it', 'Clement Mwamba'); console.log('written by Bernard with Clement as visitor', e.slice(1));
  await as('Clement'); await go('#/visits?vt=all&vtab=check'); console.log('Clement list', await p.evaluate(() => [document.querySelector('#checkbox h2').innerText, [...document.querySelectorAll('.chk')].map(k => !!k.querySelector('[data-dact=valid]'))]));
  await as('Vadya'); await go('#/visits?vt=all&vtab=check'); console.log('Vadya list', await p.evaluate(() => [...document.querySelectorAll('.chk')].map(k => !!k.querySelector('[data-dact=valid]')))); console.log('report recorded/counted', await rep());
  console.log('errors', errs); await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 500)); process.exit(1); });
