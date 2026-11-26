// beta 1.3: the report of a section sent to the Education office; the month is closed until it is sent back
const { chromium } = require('playwright'); const OUT = '/tmp/cyp-shots/';
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [w, tag] of [[393, 'ph'], [1280, 'pc']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 820 }, isMobile: w < 900, hasTouch: w < 900, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  const login = async who => { await p.evaluate(() => { if (typeof USER !== 'undefined' && USER) { USER = null; render(); } }); await p.waitForTimeout(200); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', await p.evaluate(() => pinValue())); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(500); } };
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(500); };
  const card = () => p.evaluate(() => { const c = document.querySelector('#repflow'); return c ? c.innerText.replace(/\s+/g, ' ').slice(0, 230) : 'no card'; });
  const fits = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  const m = await p.evaluate(() => thisMonth());
  // 1. Lewis (Minsundu) sends the UCC report
  await login('Lewis'); await go('#/reports?s=UCC&m=' + m); console.log(tag, '1 open:', await card(), 'fits', await fits());
  await p.click('#repflow [data-v=send]'); await p.waitForTimeout(300); console.log(tag, '  dialog', await p.evaluate(() => (document.querySelector('#dlg') || {}).innerText || 'none'));
  await p.click('#dlg .ok'); await p.waitForTimeout(400); console.log(tag, '  sent:', await card(), '| buttons', await p.locator('#repflow button').count());
  // 2. the register of UCC is closed for this month: a mark does not change
  await go('#/attendance?c=Minsundu&g=UCC&av=full');
  const tryMark = async () => { const r = await p.evaluate(() => { const bt = document.querySelector('button[data-act="att"], button[data-act="qatt"]'); if (!bt) return null; const d = bt.dataset.d, id = bt.dataset.id, before = (S.attendance[d] || {})[id] || ''; bt.click(); return { d, id, before }; }); await p.waitForTimeout(400); if (!r) return 'no button'; const after = await p.evaluate(r => (S.attendance[r.d] || {})[r.id] || '', r); const t = await p.evaluate(() => { const L = [...document.querySelectorAll('.toast')]; const t = L.map(x => x.innerText).pop() || ''; L.forEach(x => x.remove()); return t; }); return { changed: after !== r.before, toast: t }; };
  console.log(tag, '2 UCC mark while sent:', JSON.stringify(await tryMark()));
  // a Youth child is not closed
  await go('#/attendance?c=Minsundu&g=Youth&av=full'); console.log(tag, '  Youth mark:', JSON.stringify(await tryMark()));
  // 3. Clement sees it in To do and sends it back
  await login('Clement'); await go('#/pending'); console.log(tag, '3 To do line:', await p.evaluate(() => [...document.querySelectorAll('.main a, .main li')].map(x => x.innerText.replace(/\s+/g, ' ')).find(t => /UCC report/.test(t)) || 'none'));
  await go('#/reports?s=UCC&m=' + m); console.log(tag, '  Clement sees:', await card());
  await p.click('#repflow [data-v=back]'); await p.waitForTimeout(300); await p.click('#dlg .ok'); await p.waitForTimeout(300); console.log(tag, '  empty note refused:', await p.evaluate(() => !!document.querySelector('#dlg')));
  await p.fill('#dlg textarea', 'Check the days of 12 and 13 November'); await p.click('#dlg .ok'); await p.waitForTimeout(400);
  console.log(tag, '  after send back, card is first:', await p.evaluate(() => { const c = document.querySelector('#repflow'), s = document.querySelector('.main section.card:not(#repflow)'); return !!c && !!s && !!(c.compareDocumentPosition(s) & 4); }), await card());
  // 4. Lewis: To do line, the register opens again, send again, Clement checks
  await login('Lewis'); await go('#/pending'); const todo = await p.evaluate(() => document.querySelector('.main').innerText.replace(/\s+/g, ' ')); console.log(tag, '4 Lewis To do has the note:', /sent back: Check the days/.test(todo));
  await go('#/home'); const hm = await p.evaluate(() => document.querySelector('.main').innerText.replace(/\s+/g, ' ')); console.log(tag, '  Lewis Home has the note:', /sent back: Check the days/.test(hm));
  await go('#/attendance?c=Minsundu&g=UCC&av=full'); console.log(tag, '  UCC mark after send back:', JSON.stringify(await tryMark()));
  await go('#/reports?s=UCC&m=' + m); await p.click('#repflow [data-v=send]'); await p.waitForTimeout(300); await p.click('#dlg .ok'); await p.waitForTimeout(400); console.log(tag, '  sent again:', await card());
  await login('Clement'); await go('#/reports?s=UCC&m=' + m); await p.click('#repflow [data-v=check]'); await p.waitForTimeout(400); console.log(tag, '  checked:', await card());
  await (await p.$('#repflow')).screenshot({ path: OUT + 'rep-' + tag + '.png' });
  // 5. logframe OP3.2.1, Counselling monthly report, visit form and session form closed
  await go('#/logframe'); console.log(tag, '5 OP3.2.1:', await p.evaluate(() => { const r = [...document.querySelectorAll('#rtable tr')].find(t => /OP3\.2\.1/.test(t.innerText)); return r ? r.innerText.replace(/\s+/g, ' ').slice(0, 140) : 'none'; }));
  await go('#/reports?s=Counseling&cv=month'); console.log(tag, '  Counselling month card:', await card());
  await p.evaluate(m => { S.events.push({ id: uid('e'), childId: '', type: 'Report sent', ref: m + '|Counseling', date: today(), ts: Date.now(), by: USER.id }); S.events.push({ id: uid('e'), childId: '', type: 'Report sent', ref: m + '|Family', date: today(), ts: Date.now(), by: USER.id }); save(); }, m);
  const n0 = await p.evaluate(() => [S.sessions.length, S.visits.length]);
  await go('#/counseling/new?type=Individual'); await p.evaluate(() => { const f = document.querySelector('form[data-form="session"]'); const c = S.children.find(c => isCurrent(c)); UI.sessKids = null; if (f.elements.child1) f.elements.child1.value = c.id; if (f.elements.centre) f.elements.centre.value = 'Minsundu'; f.requestSubmit(); }); await p.waitForTimeout(400); console.log(tag, '  session toast:', await p.evaluate(() => { const L = [...document.querySelectorAll('.toast')]; const t = L.map(x => x.innerText).pop() || ''; L.forEach(x => x.remove()); return t; }));
  await go('#/visit/new?t=Family'); await p.evaluate(() => { const f = document.querySelector('form[data-form="visit"]'); const c = S.children.find(c => isCurrent(c) && centreOf(c) === 'Minsundu'); f.elements.childId.value = c.id; if (f.elements.purpose) f.elements.purpose.value = f.elements.purpose.options[1].value; f.requestSubmit(); }); await p.waitForTimeout(400);
  console.log(tag, '  session and visit refused:', JSON.stringify(n0), JSON.stringify(await p.evaluate(() => [S.sessions.length, S.visits.length])), await p.evaluate(() => [...document.querySelectorAll('.toast')].map(x => x.innerText).pop() || ''));
  // 6. Luigi grid closed
  await p.evaluate(m => { S.events.push({ id: uid('e'), childId: '', type: 'Report sent', ref: m + '|Luigi', date: today(), ts: Date.now(), by: USER.id }); save(); }, m);
  await go('#/attendance?c=Luigi&lt=dropin'); const lc = await p.evaluate(() => { const c = document.querySelector('td.lc[data-lact="cell"]:not(.C):not(.S)'); if (!c) return 'no cell'; const n = S.outreach.reduce((s, x) => s + (x.children || []).length, 0); c.click(); return n; }); await p.waitForTimeout(300);
  console.log(tag, '6 Luigi cell refused:', lc === 'no cell' ? lc : lc === await p.evaluate(() => S.outreach.reduce((s, x) => s + (x.children || []).length, 0)));
  await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
