const { chromium, devices } = require('playwright'); const fs = require('fs'); const { start } = require('/home/claude/server/mock.js');
const ALPHA = 'file:///home/claude/alpha/cicetekelo-records-alpha.html', PORT = 8793, LINK = `http://127.0.0.1:${PORT}/exec?k=K`;
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const mock = await start(PORT, 'K'); const b = await chromium.launch(); const errs = [];
  const mk = async (name, opt, inject) => { const ctx = await b.newContext(Object.assign({ acceptDownloads: true }, opt)); if (inject) await ctx.addInitScript(cfg => { window.CYP_SYNC = cfg; }, { url: `http://127.0.0.1:${PORT}/exec`, key: 'K' }); const p = await ctx.newPage(); p._n = name; p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_INTERNET_DISCONNECTED|ERR_CONNECTION|Failed to load resource|ERR_EMPTY_RESPONSE/.test(m.text())) errs.push(name + ': ' + m.text()); }); p.on('dialog', d => d.accept()); await p.goto(ALPHA); await p.waitForTimeout(500); return p; };
  const pin = async (p, who) => { await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(150); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(300); };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(300); };
  const sync = async (...ps) => { for (let i = 0; i < 2; i++) for (const p of ps) { await p.evaluate(() => syncNow()); await p.waitForTimeout(120); } };
  const sig = p => p.evaluate(() => { const norm = o => JSON.stringify(o); const kids = S.children.map(c => { const x = Object.assign({}, c); return x; }).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const out = S.outreach.map(s => [s.date, s.type, (s.children || []).map(String).sort().join(','), (s.staffIds || []).slice().sort().join(','), s.notes || '', s.findings || '']).sort();
    const att = Object.keys(S.attendance).sort().map(d => [d, Object.entries(S.attendance[d]).sort()]).filter(x => x[1].length);
    const h = s => { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return x; };
    const ids = k => (S[k] || []).map(x => x.id).sort().join(',');
    return { kids: S.children.length, kidsH: h(norm(kids)), visits: S.visits.length, visH: h(ids('visits')), att: h(norm(att)), out: h(norm(out)), plans: h(ids('plans')), sess: h(ids('sessions')), ev: h(ids('events')), mv: h(ids('moves')), staff: h(norm(S.staff)), set: h(norm(S.settings)), done: S.visits.filter(v => v.actionDone).length + S.sessions.filter(v => v.actionDone).length, photos: Object.keys(S.photos || {}).length, pending: pendingCount(), cursor: S.meta.sync.cursor }; });
  const same = async (label, ...ps) => { const s = []; for (const p of ps) s.push(await sig(p)); const keys = Object.keys(s[0]).filter(k => k !== 'cursor'); const diff = keys.filter(k => s.some(x => x[k] !== s[0][k])); console.log(label, diff.length ? 'DIFFERENT: ' + diff.map(k => k + '=' + s.map(x => x[k]).join('/')).join('  ') : 'all ' + ps.length + ' devices equal', '| children', s[0].kids, 'visits', s[0].visits, 'pending', s.map(x => x.pending).join('/'), 'cursor', s.map(x => x.cursor).join('/')); return !diff.length; };

  // 1. office starts the shared database
  const office = await mk('office', { viewport: { width: 1440, height: 900 } });
  await pin(office, 'Mauro');
  const v3 = JSON.parse(fs.readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json', 'utf8'));
  await office.evaluate(pk => { importStarterPack(pk); save(); }, v3); await office.waitForTimeout(700);
  await go(office, '#/sync'); await office.screenshot({ path: 'shots/Y-connect.png' });
  await office.fill('form[data-form=synclink] [name=link]', LINK); await office.click('form[data-form=synclink] button'); await office.waitForTimeout(600);
  await office.screenshot({ path: 'shots/Y-start.png' });
  await office.click('[data-sact=start]'); await office.waitForTimeout(1500);
  console.log('server after start: snapshot', !!mock.store.snapGet(), Math.round(mock.store.snapGet().text.length / 1024) + ' KB, ids', mock.store._ids.length, '| office:', await office.evaluate(() => [syncOn(), SY.state, document.querySelector('.note') && document.querySelector('.note').innerText]));
  // 2. two phones open the link: they take the database without questions
  const A = await mk('phoneA', { ...devices['Pixel 5'] }, true); await A.waitForTimeout(1500);
  console.log('phone A before login:', await A.evaluate(() => [!!USER, S.children.length, Object.keys(S.photos || {}).length, syncOn()]));
  await pin(A, 'Iness Phiri');
  const B = await mk('phoneB', { ...devices['Galaxy S9+'] }, true); await B.waitForTimeout(1500); await pin(B, 'Lewis Chewe');
  await same('after loading', office, A, B);
  // 3. phone A records
  const ids = await A.evaluate(() => ({ ucc: S.children.filter(c => c.section === 'UCC' && isCurrent(c) && c.residence === 'Resident').slice(0, 4).map(c => c.id), lu: S.children.filter(c => c.section === 'Luigi' && isCurrent(c)).slice(0, 4).map(c => c.id), d: today() }));
  await A.evaluate(ids => { const d = ids.d; S.attendance[d] = S.attendance[d] || {}; for (const id of ids.ucc.slice(0, 3)) { S.attendance[d][id] = 'P'; touchAtt(d, id); } save(); }, ids);
  await go(A, '#/attendance?c=Luigi'); await A.tap('details.lstaff summary'); await A.waitForTimeout(100); await A.tap('[data-lstaff=dropin][value=s23]'); await A.waitForTimeout(150);
  await A.fill('[data-lf=findings]', 'Two boys moved to the bus station.'); await A.dispatchEvent('[data-lf=findings]', 'change'); await A.waitForTimeout(150);
  await A.evaluate(ids => { luigiToggle(ids.lu[0], ids.d, 'Drop-in', true); luigiToggle(ids.lu[1], ids.d, 'Drop-in', true); save(); }, ids);
  await go(A, '#/visit/new?child=' + ids.ucc[0]); await A.selectOption('[name=team]', 'Luigi'); await A.selectOption('[name=purpose]', 'Follow-up'); await A.fill('[name=findings]', 'Visit recorded on phone A'); await A.fill('[name=action]', 'Call back'); await A.tap('form[data-form=visit] button.pri'); await A.waitForTimeout(300);
  await go(A, '#/child/new'); await A.fill('[name=name]', 'Achild'); await A.fill('[name=surname]', 'Test'); await A.selectOption('[name=sex]', 'M'); await A.selectOption('[name=section]', 'Luigi'); await A.tap('form[data-form=child] button.pri'); await A.waitForTimeout(400);
  const aId = await A.evaluate(() => S.children.find(c => c.name === 'Achild').id);
  await go(A, '#/visit/new?child=' + aId); await A.selectOption('[name=purpose]', 'Assessment'); await A.fill('[name=findings]', 'First visit to Achild'); await A.tap('form[data-form=visit] button.pri'); await A.waitForTimeout(300);
  // 4. phone B is without a connection and records too: same new ID, same attendance cell, unticks nothing yet
  await B.context().setOffline(true);
  await go(B, '#/child/new'); await B.fill('[name=name]', 'Bchild'); await B.fill('[name=surname]', 'Test'); await B.selectOption('[name=sex]', 'F'); await B.selectOption('[name=section]', 'UCC'); await B.tap('form[data-form=child] button.pri'); await B.waitForTimeout(400);
  const bId = await B.evaluate(() => S.children.find(c => c.name === 'Bchild').id);
  await B.evaluate(([ids, bId]) => { const d = ids.d; S.attendance[d] = S.attendance[d] || {}; S.attendance[d][ids.ucc[3]] = 'A'; touchAtt(d, ids.ucc[3]); S.attendance[d][bId] = 'P'; touchAtt(d, bId); luigiToggle(ids.lu[2], d, 'Drop-in', true); save(); }, [ids, bId]);
  await go(B, '#/child/' + ids.lu[3] + '/edit'); await B.selectOption('[name=relStreet]', 'Yes'); await B.tap('form[data-form=child] button.pri'); await B.waitForTimeout(300);
  await B.evaluate(() => syncNow()); await B.waitForTimeout(400);
  await go(B, '#/home'); console.log('phone B offline: new child id', bId, '(phone A used', aId + ') state', await B.evaluate(() => [SY.state, pendingCount(), (document.querySelector('.main .warn') || {}).innerText]));
  await B.screenshot({ path: 'shots/Y-offline.png' });
  // 5. A sends by itself (no button): wait for the automatic push
  await A.waitForTimeout(9000); console.log('phone A after 9 s, without touching anything: pending', await A.evaluate(() => pendingCount()), 'server log rows', mock.store._log.length);
  await B.context().setOffline(false); await B.waitForTimeout(300);
  await sync(B, A, office, B, A, office);
  await same('after both phones recorded', office, A, B);
  console.log('new children on the three devices:', JSON.stringify(await Promise.all([office, A, B].map(p => p.evaluate(() => S.children.filter(c => /child$/.test(c.name)).map(c => c.name + ' ' + c.id).sort().join(', '))))));
  console.log('office sees:', await office.evaluate(([ids]) => { const d = ids.d, sh = S.outreach.find(s => s.date === d && s.type === 'Drop-in'), b = S.children.find(c => c.name === 'Bchild'); return { att: ids.ucc.map(i => S.attendance[d][i]).join(''), bAtt: S.attendance[d][b.id], sheetHas: ids.lu.slice(0, 3).map(i => sh.children.includes(i)), staff: sh.staffIds, findings: sh.findings, visitsA: S.visits.filter(v => /phone A|Achild/.test(v.findings)).map(v => v.childId), rel: child(ids.lu[3]).relStreet }; }, [ids]));
  // 6. unticks, actions done, plan, staff and PIN changes travel too
  await B.evaluate(ids => { luigiToggle(ids.lu[0], ids.d, 'Drop-in', false); const d = ids.d; delete S.attendance[d][ids.ucc[1]]; touchAtt(d, ids.ucc[1]); save(); }, ids);
  await go(office, '#/visits?vt=all&vtab=actions'); await office.click('#actions [data-act=actiondone]'); await office.waitForTimeout(200);
  await office.evaluate(ids => { addPlan(ids.ucc[2], thisMonth(), 'Family'); addPlan(ids.ucc[3], thisMonth(), 'Family'); save(); }, ids); await sync(office, A, B);
  await A.evaluate(() => { const p = plans()[0]; S.plans = plans().filter(x => x.id !== p.id); syncMeta().rmPlans[p.id] = Date.now(); save(); });
  await go(office, '#/staff'); await office.fill('form[data-form=pin] [name=pin]', '2468'); await office.click('form[data-form=pin] button'); await office.waitForTimeout(200);
  await office.evaluate(() => { const s = S.staff.find(x => x.name === 'Iness Phiri'); s.areas = ['Luigi', 'Nkwazi']; save(); });
  await sync(B, A, office, B, A, office);
  await same('after unticks, action done, plan, PIN and staff', office, A, B);
  console.log('phone A now:', await A.evaluate(ids => ({ pin: pinValue(), inessAreas: S.staff.find(x => x.name === 'Iness Phiri').areas, sheetHasFirst: S.outreach.find(s => s.date === ids.d && s.type === 'Drop-in').children.includes(ids.lu[0]), att1: S.attendance[ids.d][ids.ucc[1]] || 'cleared', plans: (S.plans || []).length, done: S.visits.filter(v => v.actionDone).length }), ids));
  // 7. no touching: does a change on the office reach the phone by itself?
  const t0 = Date.now(); await office.evaluate(ids => { const d = ids.d; S.attendance[d][ids.ucc[0]] = 'H'; touchAtt(d, ids.ucc[0]); save(); }, ids);
  let secs = -1; for (let i = 0; i < 80; i++) { await wait(1000); if (await A.evaluate(ids => S.attendance[ids.d][ids.ucc[0]], ids) === 'H') { secs = Math.round((Date.now() - t0) / 1000); break; } }
  console.log('change made on the office computer appeared on phone A by itself after', secs, 'seconds');
  // 8. server unreachable, then back
  mock.setDown(true); await A.evaluate(ids => { const d = ids.d; S.attendance[d][ids.ucc[2]] = 'A'; touchAtt(d, ids.ucc[2]); save(); }, ids); await A.evaluate(() => syncNow()); await A.waitForTimeout(600);
  console.log('server down: phone A state', await A.evaluate(() => [SY.state, pendingCount()])); mock.setDown(false);
  await sync(A, office, B); await same('after the server came back', office, A, B);
  // 9. closing and reopening the phone keeps everything and stays connected
  await A.reload(); await A.waitForTimeout(800); console.log('phone A reopened:', await A.evaluate(() => [!!USER, S.children.length, syncOn(), S.meta.sync.cursor]));
  // 10. guest on the office while changes arrive
  await office.click('[data-act=logout]'); await office.waitForTimeout(200); await office.click('[data-act=guest]'); await office.waitForTimeout(500);
  await B.evaluate(ids => { const d = ids.d; S.attendance[d][ids.ucc[3]] = 'P'; touchAtt(d, ids.ucc[3]); save(); }, ids); await sync(B); await office.evaluate(() => syncNow()); await office.waitForTimeout(300);
  console.log('office in guest view:', await office.evaluate(() => [GUEST, S.children[0].name, S_REAL.children[0].name !== 'XXXX']));
  await office.click('.guestbar [data-act=logout]'); await office.waitForTimeout(200); await office.click('.stile:has-text("Mauro")'); await office.waitForTimeout(150); await office.fill('#pinin', '2468'); await office.click('form[data-form=pinlogin] button.pri'); await office.waitForTimeout(300);
  await sync(office, A, B); await same('after the guest view', office, A, B);
  // 11. a brand new phone much later: snapshot plus the log
  const C = await mk('phoneC', { ...devices['Pixel 5'] }, true); await C.waitForTimeout(2000); await sync(C); await same('new phone C joins', office, A, B, C);
  // 12. replace the shared database from the office (after an import)
  await office.evaluate(() => { noStamp(); S.children.push({ id: '9999', name: 'Imported', surname: 'Later', sex: 'M', section: 'UCC', status: 'Active', residence: 'Resident', programmes: [], support: [] }); save(); }); await office.waitForTimeout(200);
  await go(office, '#/sync'); await office.click('details:has([data-sact=restart]) summary'); await office.click('[data-sact=restart]'); await office.waitForTimeout(1500);
  await sync(A, B, C, office); await A.waitForTimeout(800); await same('after the office replaced the shared database', office, A, B, C);
  await go(A, '#/sync'); await A.screenshot({ path: 'shots/Y-phone-sync.png' }); await go(A, '#/attendance?c=Minsundu'); await A.screenshot({ path: 'shots/Y-phone-att.png' });
  console.log('server: log rows', mock.store._log.length, 'calls', mock.calls(), '| errors', errs);
  await b.close(); mock.srv.close();
})();
