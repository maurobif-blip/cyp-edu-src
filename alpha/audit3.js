const { chromium } = require('playwright'); const fs = require('fs'); const { start } = require('/home/claude/server/mock.js');
const PORT = 8813, LINK = `http://127.0.0.1:${PORT}/exec?k=K`;
(async () => {
  const mock = await start(PORT, 'K'); const b = await chromium.launch(); const errs = [];
  const mk = async (name, vw) => { const ctx = await b.newContext({ viewport: { width: vw || 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('dialog', x => x.accept()); await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const as = (p, w) => p.evaluate(w => { USER = S.staff.find(s => s.name.includes(w)); render(); return USER.name; }, w);
  const A = await mk('A');
  await A.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await A.waitForTimeout(600);
  await go(A, '#/sync'); await A.fill('form[data-form=synclink] [name=link]', LINK); await A.click('form[data-form=synclink] button'); await A.waitForTimeout(700); await A.click('[data-sact=start]'); await A.waitForTimeout(2500);
  const B = await mk('B', 393);
  await go(B, '#/sync'); await B.fill('form[data-form=synclink] [name=link]', LINK); await B.click('form[data-form=synclink] button'); await B.waitForTimeout(900); const ld = await B.$('[data-sact=load]'); if (ld) { await ld.click(); await B.waitForTimeout(2500); }
  console.log('P0 two devices', await A.evaluate(() => [syncOn(), S.children.length]), await B.evaluate(() => [syncOn(), S.children.length]));
  const kid = await A.evaluate(() => S.children.find(c => isCurrent(c) && centreOf(c) === 'Minsundu' && isPupil(c)).id);
  /* P1 double submit */
  await go(A, '#/visit/new?child=' + kid + '&t=Family'); await A.selectOption('[name="purpose"]', 'Follow-up'); await A.fill('[name="findings"]', 'double');
  const n0 = await A.evaluate(() => S.visits.length); await A.evaluate(() => { const bt = document.querySelector('form[data-form="visit"] button.pri'); bt.click(); bt.click(); }); await A.waitForTimeout(600);
  console.log('P1 double tap on Save: visits added', await A.evaluate(n => S.visits.length - n, n0));
  /* P2 future date, P3 backdated */
  await go(A, '#/visit/new?child=' + kid + '&t=Family'); await A.selectOption('[name="purpose"]', 'Follow-up'); await A.fill('[name="date"]', '2027-06-01'); await A.click('form[data-form="visit"] button.pri'); await A.waitForTimeout(500);
  console.log('P2 future visit accepted', await A.evaluate(() => S.visits.some(v => v.date === '2027-06-01')));
  await go(A, '#/visit/new?child=' + kid + '&t=Family'); await A.selectOption('[name="purpose"]', 'Follow-up'); await A.fill('[name="date"]', '2026-11-10'); await A.fill('[name="findings"]', 'backdated'); await A.click('form[data-form="visit"] button.pri'); await A.waitForTimeout(500);
  console.log('P3 backdated visit: state', await A.evaluate(() => { const v = S.visits.find(v => v.findings === 'backdated'); return [visitState(v), visitCounts(v)]; }));
  console.log('P2b attendance future day markable', await (async () => { await go(A, '#/attendance?c=Nkwazi&d=2027-03-01'); return A.evaluate(() => [location.hash, !!document.querySelector('[data-act="qatt"], [data-act="att"], .qrow')]); })());
  /* P4 lost update on the child record */
  await A.waitForTimeout(9000); await A.evaluate(() => syncNow()); await A.waitForTimeout(1500); await B.evaluate(() => syncNow()); await B.waitForTimeout(1500);
  await B.context().setOffline(true);
  await B.evaluate(id => { const c = child(id); c.monthly = (c.monthly || []).concat({ m: '2026-11', behaviour: 'from the phone, offline', by: USER.id, on: today() }); c.updatedAt = today(); save(); }, kid);
  await A.waitForTimeout(1200);
  await A.evaluate(id => { const c = child(id); c.terms = (c.terms || []).concat({ y: 2026, t: 3, result: 'from the office', by: USER.id, on: today() }); c.docs = (c.docs || []).concat({ id: 'ftest01', kind: 'Birth certificate', name: 'x.jpg', date: today(), by: USER.id }); c.updatedAt = today(); save(); }, kid);
  await A.waitForTimeout(9500); await A.evaluate(() => syncNow()); await A.waitForTimeout(1500);
  await B.context().setOffline(false); await B.waitForTimeout(300); await B.evaluate(() => syncNow()); await B.waitForTimeout(2500); await A.evaluate(() => syncNow()); await A.waitForTimeout(2500); await B.evaluate(() => syncNow()); await B.waitForTimeout(1500);
  const st = p => p.evaluate(id => { const c = child(id); return { terms: (c.terms || []).length, monthly: (c.monthly || []).length, docs: (c.docs || []).length }; }, kid);
  console.log('P4 same child edited on two devices (office: term + document; phone offline: monthly report). After sync A', await st(A), 'B', await st(B));
  /* P5 injection */
  await A.evaluate(() => { const c = S.children[3]; c.name = '<img src=x onerror="window.__x=1">'; c.surname = `O'Neil "Q" & <b>`; c.nickname = '😀\'"><script>window.__x=2</script>'; c.schoolName = '"><img src=x onerror="window.__x=3">'; save(); window.__kid = c.id; });
  const xk = await A.evaluate(() => window.__kid);
  for (const h of ['#/children', '#/child/' + xk, '#/child/' + xk + '/edit', '#/visit/new?child=' + xk, '#/attendance', '#/visits?vtab=need', '#/school', '#/monthly', '#/paths', '#/reports', '#/home']) { await go(A, h); }
  console.log('P5 injection executed', await A.evaluate(() => window.__x || 'no'), 'errors so far', errs.length);
  /* P6 leave a form half written */
  await go(A, '#/visit/new?child=' + kid + '&t=Family'); await A.fill('[name="findings"]', 'A long report written on the phone'); await go(A, '#/home'); await go(A, '#/visit/new?child=' + kid + '&t=Family');
  console.log('P6 text after leaving the form and coming back: "' + await A.evaluate(() => document.querySelector('[name="findings"]').value) + '"');
  /* P7 non admin */
  await as(A, 'Bernard');
  for (const h of ['#/review', '#/feedback', '#/staff', '#/staff/data', '#/logframe', '#/sync']) { await go(A, h); console.log('P7 Bernard', h, '=>', await A.evaluate(() => [(document.querySelector('h1') || {}).innerText, [...document.querySelectorAll('main button')].map(x => x.innerText.trim()).slice(0, 8).join(' | ')])); }
  /* P10 worker told about a visit sent back */
  await as(A, 'Clement'); const vb = await A.evaluate(id => { const bern = S.staff.find(s => s.name.includes('Bernard')); const v = { id: uid('v'), childId: id, team: 'Family', date: today(), purpose: 'Follow-up', where: 'Home', by: bern.id, successful: 'Yes', findings: 'x', action: '', recordedBy: bern.id, recordedOn: today() }; S.visits.push(v); S.events.push({ id: uid('e'), childId: id, type: 'Visit sent back', ref: v.id, date: today(), ts: Date.now(), note: 'Photo missing', by: USER.id }); save(); return v.id; }, kid);
  await as(A, 'Bernard'); await go(A, '#/home'); const home = await A.evaluate(() => document.querySelector('main').innerText); await go(A, '#/pending'); const todo = await A.evaluate(() => document.querySelector('main').innerText);
  console.log('P10 Bernard home mentions sent back:', /sent back/i.test(home), '| to do mentions:', /sent back/i.test(todo), '| to validate tab count', await (async () => { await go(A, '#/visits'); return A.evaluate(() => [...document.querySelectorAll('#vtabs a')].map(a => a.innerText.replace(/\s+/g, ' ')).join(' / ')); })());
  /* P9 volume */
  await as(A, 'Clement');
  const vol = await A.evaluate(() => { const ids = S.children.filter(isCurrent).map(c => c.id); let n = 0; const d0 = new Date('2025-01-01T00:00:00'); for (let i = 0; i < 700; i++) { const d = iso(new Date(d0.getTime() + i * 86400000)); S.attendance[d] = S.attendance[d] || {}; for (const id of ids) { S.attendance[d][id] = 'P'; n++; } } for (let i = 0; i < 6000; i++) S.visits.push({ id: 'vv' + i, childId: ids[i % ids.length], team: 'Family', date: iso(new Date(d0.getTime() + (i % 680) * 86400000)), purpose: 'Follow-up', where: 'Home', by: USER.id, successful: 'Yes', findings: 'Volume test visit text of a normal length, two lines of notes.', action: '' }); const t = performance.now(); _NOSTAMP = true; save(); const ms = performance.now() - t; return { marks: n, visits: S.visits.length, saveMs: Math.round(ms), sizeMB: +(JSON.stringify(S).length / 1048576).toFixed(1) }; });
  console.log('P9 volume', vol);
  for (const h of ['#/home', '#/attendance?c=Minsundu', '#/visits?vt=all', '#/visits?vt=all&vtab=need', '#/reports?s=Family', '#/reports?s=UCC', '#/children', '#/logframe', '#/school', '#/paths', '#/child/' + kid]) { const t = Date.now(); await A.evaluate(h => { location.hash = h; }, h); await A.waitForFunction(() => true); const ms = await A.evaluate(() => { const t = performance.now(); render(); return Math.round(performance.now() - t); }); console.log('   render', h, ms, 'ms'); }
  console.log('errors', errs.slice(0, 6));
  await b.close(); process.exit(0);
})().catch(e => { console.error('FAIL', e.message.slice(0, 700)); process.exit(1); });
