/* the lock: records locked on the device before they leave it */
const { chromium } = require('playwright'); const fs = require('fs'); const { start } = require('/home/claude/server/mock.js');
const PIN = require('/home/claude/cyp-edu-src/alpha/pin.js');
const PORT = 8833, LINK = `http://127.0.0.1:${PORT}/exec?k=K`, SP = '/tmp/cyp-shots/', APP = 'file:///home/claude/alpha/cicetekelo-records-alpha.html';
(async () => {
  const mock = await start(PORT, 'K'); const b = await chromium.launch(); const errs = [];
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC', 'base64'); fs.writeFileSync(SP + 'cert.png', png);
  const mk = async (who, hash) => { const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(who + ': ' + m.text()); }); p.on('dialog', d => d.type() === 'prompt' ? d.accept('LOCK') : d.accept()); await p.goto(APP + (hash || '')); await p.waitForTimeout(1500); return p; };
  const pin = async (p, who) => { await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(150); await p.fill('#pinin', PIN); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400); };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const sync = async p => { await p.evaluate(() => syncNow()); await p.waitForTimeout(700); };
  const serverText = () => JSON.stringify([mock.store.snapGet(), mock.store._log, mock.store._files]);
  const leak = words => words.filter(w => serverText().includes(w));

  /* 1. first device starts the shared database: locked from the start */
  const A = await mk('A'); await pin(A, 'Clement');
  console.log('secure context, lock possible', await A.evaluate(() => [isSecureContext, lockCan()]));
  await A.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await A.waitForTimeout(700);
  await go(A, '#/sync'); await A.fill('form[data-form=synclink] [name=link]', LINK); await A.click('form[data-form=synclink] button'); await A.waitForTimeout(700);
  console.log('start card says', await A.evaluate(() => /locked before they are sent/.test(document.querySelector('main, body').innerText)));
  await A.click('[data-sact=start]'); await A.waitForTimeout(2500);
  const names = await A.evaluate(() => S.children.slice(0, 40).map(c => c.surname).filter(x => x && x.length > 4));
  const staffNames = await A.evaluate(() => S.staff.map(s => s.name.split(' ')[0]).filter(x => x.length > 4));
  console.log('A shared', await A.evaluate(() => [syncOn(), lockOn(), (syncCfg().enc || '').length, !!syncCfg().encNext]), 'page', await A.evaluate(() => [...document.querySelectorAll('.row')].map(r => r.innerText.replace(/\s+/g, ' ')).filter(t => /^Records locked/.test(t))));
  const snap = JSON.parse(mock.store.snapGet().text);
  console.log('server copy: keys', Object.keys(snap), 'children stubs', snap.children.length, Object.keys(snap.children[0]), 'ids on server', mock.store._ids.length, 'children on A', await A.evaluate(() => S.children.length));
  console.log('names of children on the server', leak(names).length, 'names of staff on the server', leak(staffNames).length, 'PIN on the server', serverText().includes('"pin"'));
  const link = await A.evaluate(() => staffLink('http://app.test/'));

  /* 2. second device opens the staff link */
  const B = await mk('B', '#c=' + link.split('#c=')[1]);
  console.log('B after the link', await B.evaluate(() => [syncOn(), lockOn(), S.children.length, location.hash])); await pin(B, 'Bernard');

  /* 3. A records: a visit with a photo, a new child, a document, attendance; B receives them readable */
  const kid = await A.evaluate(() => S.children.find(c => isCurrent(c) && needsVisits(c) && centreOf(c) === 'Minsundu').id);
  await A.evaluate(id => { S.visits.push({ id: uid('v'), childId: id, date: today(), type: 'Family', purpose: 'Family tracing', findings: 'Zebrawood secret finding', by: USER.id, ts: Date.now() }); const c = child(id); c.medical = 'Quartzite secret medical'; c.updatedTs = Date.now(); save(); }, kid);
  await go(A, '#/child/new'); await A.fill('[name=name]', 'Xylophonia'); await A.fill('[name=surname]', 'Testchild'); await A.selectOption('[name=sex]', 'F'); await A.click('form[data-form=child] button.pri'); await A.waitForTimeout(600);
  await go(A, '#/child/' + kid); await A.setInputFiles('#docsbox input[type=file]', SP + 'cert.png'); await A.waitForTimeout(500); await A.click('#docsbox form button.pri'); await A.waitForTimeout(2500);
  await sync(A); await sync(A); await sync(B); await sync(B);
  console.log('B received', await B.evaluate(id => [S.visits.some(v => v.findings === 'Zebrawood secret finding'), child(id).medical, S.children.some(c => c.name === 'Xylophonia'), (child(id).docs || []).length], kid));
  console.log('log rows', mock.store._log.length, 'formats', [...new Set(mock.store._log.map(r => JSON.parse(r.json).format))], 'user column', [...new Set(mock.store._log.map(r => r.user))], 'leaks', leak(['Zebrawood', 'Quartzite', 'Xylophonia', 'Testchild', 'cert.png', 'image/png']));
  console.log('server files', Object.values(mock.store._files).map(f => [f.name, f.mime, f.childId, f.kind, f.data.length]));
  await go(B, '#/child/' + kid); await B.click('#docsbox [data-dact="open"]'); await B.waitForTimeout(1500);
  console.log('B opens the document from the server', await B.evaluate(() => { const d = document.getElementById('phbox'); return d ? [d.querySelector('img').src.slice(0, 22), d.querySelector('img').naturalWidth] : null; })); await B.keyboard.press('Escape');
  /* B records, A receives */
  await B.evaluate(id => { S.attendance[today()] = S.attendance[today()] || {}; S.attendance[today()][id] = 'P'; syncMeta().att[today() + '|' + id] = Date.now(); save(); }, kid); await sync(B); await sync(A);
  console.log('A received the attendance of B', await A.evaluate(id => (S.attendance[today()] || {})[id], kid));

  /* 4. a device with the database link but without the key */
  const C = await mk('C'); await pin(C, 'Clement'); await go(C, '#/sync'); await C.fill('form[data-form=synclink] [name=link]', LINK); await C.click('form[data-form=synclink] button'); await C.waitForTimeout(900);
  await C.click('[data-sact=load]'); await C.waitForTimeout(1200);
  console.log('C without the key', await C.evaluate(() => [S.children.length, syncOn(), (document.querySelector('.note') || {}).innerText]));

  /* 5. changes that are not locked are left out by the devices that hold the key */
  const r = await fetch(`http://127.0.0.1:${PORT}/exec`, { method: 'POST', body: JSON.stringify({ key: 'K', action: 'sync', device: 'old-phone', user: 'x', since: mock.store._log.length, gen: mock.store.gen(), changes: { format: 'cyp-edu-changes', from: 'old', children: [{ id: kid, name: '', surname: 'WIPED', updatedTs: Date.now() + 5000 }] } }) }).then(x => x.json());
  await sync(A); console.log('plain change posted', r.ok, 'A keeps the name', await A.evaluate(id => child(id).surname !== 'WIPED' && !!child(id).name, kid));

  /* 6. a device where an old version took the locked database as it was */
  await B.evaluate(async () => { const r = await fetch(syncCfg().url, { method: 'POST', body: JSON.stringify({ key: syncCfg().key, action: 'snapshot_get' }) }).then(x => x.json()); const m = S.meta.sync; S = Object.assign(blankState(), JSON.parse(r.state)); S.meta.sync = m; rawSave(); });
  console.log('B broken by an old version', await B.evaluate(() => [!!S.locked, S.children.length, Object.keys(S.children[0]).length])); await sync(B);
  console.log('B repaired at the next exchange', await B.evaluate(() => [!!S.locked, S.children.length, Object.keys(S.children[0]).length > 5, !!USER]));

  /* 7. change the key: the old link stops opening the records */
  await A.evaluate(() => { USER = S.staff.find(s => s.name.includes('Clement')); }); await go(A, '#/sync'); await A.evaluate(() => { document.getElementById('lockbox').open = true; });
  console.log('admin card', await A.evaluate(() => [document.querySelector('#lockbox summary').innerText, document.querySelector('#lockbox button').innerText]));
  const key1 = await A.evaluate(() => syncCfg().enc); await A.click('#lockbox button'); await A.waitForTimeout(2500);
  console.log('key changed', await A.evaluate(k => [syncCfg().enc !== k, !!syncCfg().encNext, document.querySelector('.note').innerText], key1));
  await sync(B); await go(B, '#/sync');
  console.log('B with the old key', await B.evaluate(() => [SY.state, SY.lock, (document.querySelector('section.card[style*="red"] h2') || {}).innerText, document.getElementById('syncchip') && document.getElementById('syncchip').innerText]));
  const link2 = await A.evaluate(() => staffLink('http://app.test/'));
  await B.goto(APP + '#c=' + link2.split('#c=')[1]); await B.reload(); await B.waitForTimeout(2500);
  console.log('B with the new link', await B.evaluate(() => [syncOn(), lockOn(), S.children.length, SY.state, S.children.some(c => c.name === 'Xylophonia')]));

  /* 8. a database that is not locked: lock it later; the answer of the database gets lost once */
  const mock2 = await start(PORT + 1, 'K2'); const D = await mk('D'); await pin(D, 'Clement');
  await D.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await D.waitForTimeout(700);
  await D.evaluate(async l => { lsSet('cyp-sync', JSON.stringify(parseLink(l))); await syncStart(false, false); }, `http://127.0.0.1:${PORT + 1}/exec?k=K2`); await D.waitForTimeout(500);
  const plainLink = await D.evaluate(() => staffLink('http://app.test/'));
  console.log('D plain database', await D.evaluate(() => [syncOn(), lockOn()]), 'server holds names', JSON.parse(mock2.store.snapGet().text).children[0].name !== undefined, 'link has no key', !JSON.parse(Buffer.from(plainLink.split('#c=')[1], 'base64url').toString()).e);
  const E = await mk('E', '#c=' + plainLink.split('#c=')[1]); console.log('E on the plain database', await E.evaluate(() => [syncOn(), lockOn(), S.children.length])); await pin(E, 'Bernard');
  /* the database of today is not locked: it must keep working as before */
  await D.evaluate(() => { const c = S.children.find(c => isCurrent(c)); c.nickname = 'Plainsync'; c.updatedTs = Date.now(); S.visits.push({ id: uid('v'), childId: c.id, date: today(), type: 'Family', findings: 'Plain finding', by: USER.id, ts: Date.now() }); save(); }); await sync(D); await sync(E);
  await E.evaluate(() => { const c = S.children.find(c => c.nickname === 'Plainsync'); S.attendance[today()] = S.attendance[today()] || {}; S.attendance[today()][c.id] = 'P'; syncMeta().att[today() + '|' + c.id] = Date.now(); save(); }); await sync(E); await sync(D);
  console.log('plain database still exchanges', await E.evaluate(() => [S.children.some(c => c.nickname === 'Plainsync'), S.visits.some(v => v.findings === 'Plain finding')]), await D.evaluate(() => { const c = S.children.find(c => c.nickname === 'Plainsync'); return (S.attendance[today()] || {})[c.id]; }), 'formats', [...new Set(mock2.store._log.map(r => JSON.parse(r.json).format))], 'user column filled', mock2.store._log.every(r => !!r.user));
  await go(D, '#/sync'); await D.evaluate(() => { document.getElementById('lockbox').open = true; });
  console.log('admin card on a plain database', await D.evaluate(() => [document.querySelector('#lockbox summary').innerText, [...document.querySelectorAll('.row')].map(r => r.innerText.replace(/\s+/g, ' ')).filter(t => /^Records locked/.test(t))[0]]));
  /* the request arrives, the answer does not */
  await D.route('**/exec', async route => { const body = route.request().postData() || ''; if (/"action":"restart"/.test(body)) { await fetch(route.request().url(), { method: 'POST', body }); await route.abort(); } else await route.continue(); });
  await D.click('#lockbox button'); await D.waitForTimeout(2000); await D.unroute('**/exec');
  console.log('answer lost', await D.evaluate(() => [lockOn(), !!syncCfg().encNext, (document.querySelector('.note') || {}).innerText]), 'server locked', !!JSON.parse(mock2.store.snapGet().text).locked);
  await sync(D); await go(D, '#/sync');
  console.log('D after the next exchange', await D.evaluate(() => [SY.state, SY.lock, lockOn(), !!syncCfg().encNext, (document.querySelector('section.card[style*="red"] h2') || {}).innerText]));
  if (await D.$('[data-sact=load]')) { await D.click('[data-sact=load]'); await D.waitForTimeout(1500); }
  console.log('D took its own locked database', await D.evaluate(() => [syncOn(), lockOn(), !!syncCfg().encNext, S.children.length, SY.state]));
  await sync(E); console.log('E without the key', await E.evaluate(() => [SY.state, SY.lock, S.children.length > 100]));
  const link3 = await D.evaluate(() => staffLink('http://app.test/')); await E.goto(APP + '#c=' + link3.split('#c=')[1]); await E.reload(); await E.waitForTimeout(2500);
  console.log('E with the new link', await E.evaluate(() => [syncOn(), lockOn(), S.children.length, SY.state]));

  /* 9. a locked copy from Drive restored as a backup */
  fs.writeFileSync(SP + 'locked-backup.json', mock2.store.snapGet().text);
  await E.evaluate(() => { USER = S.staff.find(s => s.name.includes('Clement')); }); await go(E, '#/staff/data'); const n0 = await E.evaluate(() => S.children.length);
  await E.setInputFiles('#restorefile', SP + 'locked-backup.json'); await E.waitForTimeout(1500);
  console.log('restore of a locked copy with the key', await E.evaluate(() => [S.children.length, Object.keys(S.children[0]).length > 5, !!S.locked]), n0);
  await go(C, '#/staff/data'); await C.setInputFiles('#restorefile', SP + 'locked-backup.json'); await C.waitForTimeout(1200);
  console.log('restore of a locked copy without the key', await C.evaluate(() => [S.children.length, (document.querySelector('.toast, #toast') || {}).innerText]));
  console.log('errors', errs);
  await b.close(); mock.srv.close(); mock2.srv.close();
})();
