const { chromium } = require('playwright'); const fs = require('fs'); const { start } = require('/home/claude/server/mock.js');
const PORT = 8814, LINK = `http://127.0.0.1:${PORT}/exec?k=K`;
(async () => {
  const mock = await start(PORT, 'K'); const b = await chromium.launch(); const errs = [];
  const mk = async (name, vw, when) => { const ctx = await b.newContext({ viewport: { width: vw || 1440, height: 900 } }); const p = await ctx.newPage(); await p.addInitScript(() => { new MutationObserver(() => { const d = document.getElementById('dlg'); if (!d || d.dataset.auto) return; d.dataset.auto = '1'; setTimeout(() => { const t = d.querySelector('textarea'); if (t) t.value = 'Written by mistake'; d.querySelector('.ok').click(); }, 60); }).observe(document, { childList: true, subtree: true }); }); if (when) await p.clock.setFixedTime(new Date(when)); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('dialog', x => x.type() === 'prompt' ? x.accept('Recorded by mistake') : x.accept()); await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const as = (p, w) => p.evaluate(w => { USER = S.staff.find(s => s.name.includes(w)); render(); return USER.name; }, w);
  const sync = async (...ps) => { for (const p of ps) { await p.evaluate(() => syncNow()); await p.waitForTimeout(1600); } };
  const A = await mk('A');
  await A.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await A.waitForTimeout(600);
  await go(A, '#/sync'); await A.fill('form[data-form=synclink] [name=link]', LINK); await A.click('form[data-form=synclink] button'); await A.waitForTimeout(700); await A.click('[data-sact=start]'); await A.waitForTimeout(2500);
  const B = await mk('B', 393);
  /* since alpha 5.20 a new shared database is locked: the second device needs the staff link, which carries the key */
  await go(B, '#/sync'); await B.fill('form[data-form=synclink] [name=link]', await A.evaluate(() => staffLink('http://app.test/'))); await B.click('form[data-form=synclink] button'); await B.waitForTimeout(900); await B.click('[data-sact=load]'); await B.waitForTimeout(2500);
  console.log('version', await A.evaluate(() => VERSION), 'two devices', await A.evaluate(() => syncOn()), await B.evaluate(() => syncOn()));
  const kid = await A.evaluate(() => S.children.find(c => isCurrent(c) && needsVisits(c) && centreOf(c) === 'Minsundu').id);
  const kid2 = await A.evaluate(id => S.children.find(c => isCurrent(c) && needsVisits(c) && c.id !== id).id, kid);
  /* 1. Bernard on the phone (B) records a visit by mistake; it reaches the office; he cancels it */
  await as(B, 'Bernard'); await go(B, '#/visit/new?child=' + kid + '&t=Family'); await B.selectOption('[name="purpose"]', 'Family tracing'); await B.fill('[name="findings"]', 'prova'); await B.click('form[data-form="visit"] button.pri'); await B.waitForTimeout(700);
  const vid = await B.evaluate(id => visitsOf(id).filter(v => v.findings === 'prova').pop().id, kid);
  await B.waitForTimeout(8500); await sync(B, A);
  console.log('1 visit reached the office', await A.evaluate(id => !!S.visits.find(v => v.id === id), vid));
  await go(B, '#/visitrep/' + vid); console.log('1 author sees Cancel', await B.evaluate(() => !!document.querySelector('[data-dact=cancelvisit]')));
  await B.click('[data-dact=cancelvisit]'); await B.waitForTimeout(700);
  console.log('1 cancelled on the phone', await B.evaluate(id => [!S.visits.find(v => v.id === id), S.events.filter(e => e.type === 'Visit cancelled').map(e => e.note)], vid));
  await B.waitForTimeout(8500); await sync(B, A); await go(A, '#/visits?vt=all&vtab=check');
  console.log('1 gone at the office too', await A.evaluate(id => [!S.visits.find(v => v.id === id), document.querySelectorAll('.chk').length], vid));
  await go(A, '#/child/' + kid); console.log('1 line in the history of the child', await A.evaluate(() => (document.body.innerText.match(/Visit cancelled[^\n]*\n[^\n]*/) || [''])[0].replace(/\n/g, ' | ')));
  await go(A, '#/visitrep/' + vid); console.log('1 old link', await A.evaluate(() => document.querySelector('.empty').innerText));
  await sync(B); console.log('1 not resurrected after another exchange', await A.evaluate(id => !S.visits.find(v => v.id === id), vid), await B.evaluate(id => !S.visits.find(v => v.id === id), vid), 'pending', await A.evaluate(() => pendingCount()), await B.evaluate(() => pendingCount()));
  /* 2. validated visit: the author cannot cancel, the supervisor can */
  await go(B, '#/visit/new?child=' + kid + '&t=Family'); await B.selectOption('[name="purpose"]', 'Follow-up'); await B.fill('[name="findings"]', 'real visit'); await B.click('form[data-form="visit"] button.pri'); await B.waitForTimeout(700);
  const v2 = await B.evaluate(id => visitsOf(id).filter(v => v.findings === 'real visit').pop().id, kid);
  await B.waitForTimeout(8500); await sync(B, A); await go(A, '#/visitrep/' + v2); await A.click('#visitval [data-dact=valid]'); await A.waitForTimeout(600); await A.waitForTimeout(8500); await sync(A, B);
  await go(B, '#/visitrep/' + v2); console.log('2 validated: author Cancel button', await B.evaluate(() => !!document.querySelector('[data-dact=cancelvisit]')), '| chip', await B.evaluate(() => document.querySelector('.lead .chip').innerText));
  await go(A, '#/visitrep/' + v2); console.log('2 supervisor Cancel button', await A.evaluate(() => !!document.querySelector('[data-dact=cancelvisit]')));
  /* 3. sent again with a photo travels to the office */
  await go(B, '#/visit/new?child=' + kid2 + '&t=Family'); await B.selectOption('[name="purpose"]', 'Follow-up'); await B.fill('[name="findings"]', 'third'); await B.click('form[data-form="visit"] button.pri'); await B.waitForTimeout(700);
  const v3 = await B.evaluate(id => visitsOf(id).filter(v => v.findings === 'third').pop().id, kid2);
  await B.waitForTimeout(8500); await sync(B, A); await go(A, '#/visitrep/' + v3); await A.click('#visitval [data-note]'); await A.waitForTimeout(600); await A.waitForTimeout(8500); await sync(A, B);
  await go(B, '#/home'); console.log('3 phone home', await B.evaluate(() => (document.querySelector('main').innerText.match(/\d+\s*visits? sent back by the supervisor/) || ['no line'])[0].replace(/\s+/g, ' ')));
  await go(B, '#/visits?vt=Family&vtab=check'); console.log('3 phone tab', await B.evaluate(() => [document.querySelector('#checkbox h2').innerText, document.querySelector('#vtabs a.on').innerText.replace(/\s+/g, ' ')]));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC', 'base64'); fs.writeFileSync('/tmp/cyp-shots/p61.png', png);
  await go(B, '#/visitrep/' + v3); await B.setInputFiles('#visitval input[type=file]', '/tmp/cyp-shots/p61.png'); await B.waitForTimeout(500); await B.click('#visitval form button.pri'); await B.waitForTimeout(3000);
  await B.waitForTimeout(6500); await sync(B, A); await go(A, '#/visitrep/' + v3); await A.waitForTimeout(1500);
  console.log('3 office sees', await A.evaluate(id => { const v = S.visits.find(x => x.id === id); return [visitState(v), visitPhotos(v).length, !!document.querySelector('img.vph')]; }, v3), 'server files', Object.keys(mock.store._files).length);
  /* 4. document removed at the office does not come back from a phone that still had it */
  await as(A, 'Clement'); await A.evaluate(id => { const c = child(id); c.docs = [{ id: 'fdoc0001', kind: 'Other document', name: 'a.jpg', date: today(), by: USER.id }]; c.updatedAt = today(); save(); }, kid2); await A.waitForTimeout(9000); await sync(A, B);
  await B.context().setOffline(true); await B.evaluate(id => { const c = child(id); c.monthly = [{ m: '2026-11', behaviour: 'offline', by: USER.id, on: today(), ts: Date.now() }]; c.updatedAt = today(); save(); }, kid2);
  await go(A, '#/child/' + kid2); await A.click('#docsbox [data-dact=del]'); await A.waitForTimeout(600); await A.waitForTimeout(8500); await sync(A);
  await B.context().setOffline(false); await B.waitForTimeout(8500); await sync(B, A, B);
  console.log('4 after sync: docs / monthly', await A.evaluate(id => [(child(id).docs || []).length, (child(id).monthly || []).length], kid2), await B.evaluate(id => [(child(id).docs || []).length, (child(id).monthly || []).length], kid2));
  /* 5. drafts */
  await go(B, '#/child/' + kid + '/month'); const has = await B.evaluate(() => !!document.querySelector('form[data-form=monthly]'));
  if (has) { await B.fill('form[data-form=monthly] [name=behaviour]', 'Calm, helps the younger ones'); await B.reload(); await B.waitForTimeout(900); const pinb = await B.$('#pinin'); if (pinb) { await B.click('.stile:has-text("Bernard")').catch(() => {}); await B.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await B.click('form[data-form=pinlogin] button.pri'); await B.waitForTimeout(500); }
    console.log('5 after closing and opening the app', await B.evaluate(() => [location.hash, USER && USER.name, (document.querySelector('form[data-form=monthly] [name=behaviour]') || {}).value]));
    await go(B, '#/child/' + kid2 + '/month'); console.log('5 other child: field empty', await B.evaluate(() => (document.querySelector('form[data-form=monthly] [name=behaviour]') || {}).value === '')); } else console.log('5 no monthly form for this child');
  await go(B, '#/visit/new?child=' + kid + '&t=Family'); await B.fill('[name="findings"]', 'half written'); await go(B, '#/home'); await go(B, '#/visit/new?child=' + kid2 + '&t=Family'); console.log('5 visit form of another child stays empty', await B.evaluate(() => document.querySelector('[name="findings"]').value === ''));
  await go(B, '#/visit/new?t=Family'); console.log('5 visit form without child: child and text back', await B.evaluate(() => [document.querySelector('[name="childId"]').value, document.querySelector('[name="findings"]').value]));
  await B.selectOption('[name="purpose"]', 'Follow-up'); await B.click('form[data-form="visit"] button.pri'); await B.waitForTimeout(600); await go(B, '#/visit/new?t=Family'); console.log('5 after saving: form empty', await B.evaluate(() => document.querySelector('[name="findings"]').value === ''));
  /* 6. wrong clock */
  const C = await mk('C', 393, '2015-01-01T10:00:00'); await go(C, '#/home');
  console.log('6 clock 2015', await C.evaluate(() => (document.querySelector('#clockwarn') || {}).innerText));
  await C.evaluate(() => { S.children.push({ id: '9001', name: 'T', surname: 'T', section: 'UCC', status: 'Active', residence: 'Resident' }); }); await go(C, '#/visit/new?child=9001&t=Family'); await C.selectOption('[name="purpose"]', 'Follow-up'); await C.click('form[data-form="visit"] button.pri'); await C.waitForTimeout(400); console.log('6 nothing saved', await C.evaluate(() => S.visits.length));
  /* 7. help and footer */
  await go(A, '#/help'); console.log('7 help mentions', await A.evaluate(() => { const t = document.querySelector('main').innerText; return ['Two computers do not share', 'No PIN', 'No school term', 'Microsoft Edge', 'validates', 'Without internet'].map(k => k + ':' + t.includes(k)).join(' '); }), '| footer:', await A.evaluate(() => document.querySelector('.foot').innerText));
  await A.setViewportSize({ width: 393, height: 800 }); for (const h of ['#/help', '#/attendance?c=Nkwazi', '#/visitrep/' + v3, '#/visits?vt=all&vtab=check']) { await go(A, h); console.log('phone fits', h.slice(0, 22), await A.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); }
  console.log('errors', errs);
  await b.close(); process.exit(0);
})().catch(e => { console.error('FAIL', e.message.slice(0, 700)); process.exit(1); });
