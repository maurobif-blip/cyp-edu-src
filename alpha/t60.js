const { chromium } = require('playwright'); const fs = require('fs'); const { start } = require('/home/claude/server/mock.js');
const PORT = 8812, LINK = `http://127.0.0.1:${PORT}/exec?k=K`, SP = '/tmp/cyp-shots/';
(async () => {
  const mock = await start(PORT, 'K'); const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } }); const q = await ctx.newPage();
  q.on('pageerror', e => errs.push(e.message)); q.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errs.push(m.text()); }); q.on('dialog', x => x.accept());
  await q.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await q.waitForTimeout(900);
  const pin = async who => { await q.click(`.stile:has-text("${who}")`); await q.waitForTimeout(150); await q.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await q.click('form[data-form=pinlogin] button.pri'); await q.waitForTimeout(400); };
  const go = async h => { await q.evaluate(h => location.hash = h, h); await q.waitForTimeout(500); };
  const as = async who => { await q.evaluate(w => { USER = S.staff.find(s => s.name.includes(w)); render(); }, who); await q.waitForTimeout(200); return q.evaluate(() => [USER.name, !!USER.admin]); };
  await pin('Clement');
  await q.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await q.waitForTimeout(700);
  await go('#/sync'); await q.fill('form[data-form=synclink] [name=link]', LINK); await q.click('form[data-form=synclink] button'); await q.waitForTimeout(700); const st = await q.$('[data-sact=start]'); if (st) { await st.click(); await q.waitForTimeout(2000); }
  console.log('version', await q.evaluate(() => VERSION), 'shared', await q.evaluate(() => syncOn()));
  const kid = await q.evaluate(() => S.children.find(c => isCurrent(c) && needsVisits(c) && centreOf(c) === 'Minsundu').id);
  console.log('as', await as('Bernard'));
  await go('#/visit/new?child=' + kid + '&t=Family'); await q.selectOption('[name="purpose"]', 'Family tracing'); await q.fill('[name="findings"]', 'Aunt found in Chipulukusu. She accepts a second visit.'); await q.fill('[name="action"]', 'Second visit with the child'); await q.click('form[data-form="visit"] button.pri'); await q.waitForTimeout(900);
  const vid = await q.evaluate(id => visitsOf(id).filter(v => v.date === today()).pop().id, kid);
  await go('#/visits?vt=Family&vtab=check');
  console.log('bernard list', await q.evaluate(() => { const k = document.querySelector('.chk'); return [document.querySelector('#checkbox h2').innerText, k.querySelector('.chka').innerText.replace(/\s+/g, ' '), !!k.querySelector('[data-dact=valid]')]; }));
  await q.click('.chk a:has-text("Open the report")'); await q.waitForTimeout(500);
  console.log('bernard page', await q.evaluate(() => ({ hash: location.hash.slice(0, 11), h1: document.querySelector('h1').innerText, rows: [...document.querySelectorAll('#visitrep dt')].map(x => x.innerText), photo: document.querySelectorAll('section.card')[1].innerText.replace(/\s+/g, ' '), val: document.querySelector('#visitval').innerText.replace(/\s+/g, ' '), canValidate: !!document.querySelector('[data-dact=valid]') })));
  console.log('as', await as('Clement'));
  await go('#/visits?vt=all&vtab=check'); await q.click('.chk a:has-text("Open the report")'); await q.waitForTimeout(500);
  await q.screenshot({ path: SP + 't60-page.png', fullPage: true });
  console.log('clement page buttons', await q.evaluate(() => [...document.querySelectorAll('#visitval button')].map(x => x.innerText)));
  await q.click('#visitval [data-note]'); await q.waitForTimeout(600);
  console.log('quick send back', await q.evaluate(id => { const v = S.visits.find(x => x.id === id); return [location.hash, visitState(v), visitCheck(v).note]; }, vid));
  console.log('as', await as('Bernard'));
  await go('#/visitrep/' + vid);
  console.log('bernard sees', await q.evaluate(() => [document.querySelector('.lead').innerText.replace(/\s+/g, ' '), [...document.querySelectorAll('#visitval form label')].map(l => l.innerText.split('\n')[0]), document.querySelector('#visitval form button').innerText]));
  await q.click('#visitval form button.pri'); await q.waitForTimeout(300); console.log('empty: still', await q.evaluate(id => visitState(S.visits.find(x => x.id === id)), vid));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC', 'base64'); fs.writeFileSync(SP + 'ph.png', png);
  await q.fill('#visitval [name=note]', 'Photo of the house with the aunt'); await q.setInputFiles('#visitval input[type=file]', SP + 'ph.png'); await q.waitForTimeout(500); await q.click('#visitval form button.pri'); await q.waitForTimeout(3000);
  console.log('sent again', await q.evaluate(id => { const v = S.visits.find(x => x.id === id); return [visitState(v), visitPhotos(v).length, filesOut().length, !!document.querySelector('img.vph'), !!document.querySelector('#visitval form')]; }, vid), 'server files', Object.keys(mock.store._files).length);
  console.log('as', await as('Clement'));
  await go('#/visits?vt=all&vtab=check'); console.log('list after', await q.evaluate(() => document.querySelector('.chk .chka').innerText.replace(/\s+/g, ' ')));
  await q.click('.chk a:has-text("Open the report")'); await q.waitForTimeout(1500);
  console.log('photo on the page from the server', await q.evaluate(() => { const i = document.querySelector('img.vph'); return i ? [i.src.slice(0, 22), i.naturalWidth] : null; }), 'trail', await q.evaluate(() => [...document.querySelectorAll('#visitval .it')].map(x => x.innerText.replace(/\s+/g, ' '))));
  await q.click('img.vph'); await q.waitForTimeout(300); console.log('photo enlarges', await q.evaluate(() => !!document.getElementById('phbox'))); await q.keyboard.press('Escape');
  const rep = () => q.evaluate(() => { const { a, b } = monthCtx(thisMonth()); const rec = S.visits.filter(v => inRange(v.date, a, b) && visitTeam(v) === 'Family'); return [rec.length, rec.filter(visitCounts).length]; });
  console.log('report before', await rep()); await q.click('#visitval [data-dact=valid]'); await q.waitForTimeout(700);
  console.log('validated', await q.evaluate(id => [location.hash, visitState(S.visits.find(x => x.id === id)), document.querySelectorAll('.chk').length], vid), 'report after', await rep());
  /* links to the report */
  await go('#/visits?vt=Family'); await q.click('table.vtab tbody tr td.vopen a'); await q.waitForTimeout(400); console.log('from visits done', await q.evaluate(() => [location.hash.slice(0, 11), document.querySelector('.lead').innerText.replace(/\s+/g, ' ')]));
  await go('#/child/' + kid); console.log('child file link', await q.evaluate(() => !!document.querySelector('a[href^="#/visitrep/"]')), 'no validation line', await q.evaluate(() => !/Visit sent again|Visit sent back/.test(document.body.innerText)));
  /* school visit */
  const pup = await q.evaluate(() => S.children.find(c => isCurrent(c) && isPupil(c)).id);
  await go('#/visit/new?child=' + pup + '&t=School'); await q.selectOption('[name="schAtt"]', { index: 1 }); await q.selectOption('[name="perf"]', { index: 2 }); await q.fill('[name="teacherComment"]', 'Works well in class'); await q.fill('[name="teacher"]', 'Mrs Phiri'); await q.click('form[data-form="visit"] button.pri'); await q.waitForTimeout(800);
  const sv = await q.evaluate(id => visitsOf(id).filter(v => v.purpose === 'School visit').pop().id, pup); await go('#/visitrep/' + sv);
  console.log('school rows', await q.evaluate(() => [...document.querySelectorAll('#visitrep dt')].map(x => x.innerText).join(' | ')));
  await go('#/visitrep/nothing'); console.log('unknown', await q.evaluate(() => document.querySelector('.empty').innerText));
  /* old visit: no validation box */
  const old = await q.evaluate(() => (S.visits.find(v => v.date < VALID_FROM && child(v.childId)) || {}).id); if (old) { await go('#/visitrep/' + old); console.log('old visit', await q.evaluate(() => [!!document.querySelector('#visitval'), document.querySelectorAll('#visitrep dt').length])); } else console.log('no old visit in the pack');
  /* phone */
  await q.setViewportSize({ width: 393, height: 800 }); await go('#/visitrep/' + vid); await q.waitForTimeout(600); console.log('phone page fits', await q.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)); await q.screenshot({ path: SP + 't60-phone.png', fullPage: true });
  await go('#/visits?vt=all&vtab=check'); console.log('phone list fits', await q.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  console.log('errors', errs);
  await b.close(); mock.close && mock.close(); process.exit(0);
})().catch(e => { console.error('FAIL', e.message.slice(0, 600)); process.exit(1); });
