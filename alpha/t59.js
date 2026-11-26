const { chromium, devices } = require('playwright'); const fs = require('fs'); const { start } = require('/home/claude/server/mock.js');
const PORT = 8811, LINK = `http://127.0.0.1:${PORT}/exec?k=K`, SP = '/tmp/cyp-shots/';
(async () => {
  const mock = await start(PORT, 'K'); const b = await chromium.launch(); const errs = [];
  /* a small jpeg and a small pdf to upload */
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC', 'base64'); fs.writeFileSync(SP + 'cert.png', png); fs.writeFileSync(SP + 'case.pdf', '%PDF-1.4\n% test case study\n%%EOF\n');
  const mk = async (who, opt) => { const ctx = await b.newContext(Object.assign({ acceptDownloads: true }, opt || { viewport: { width: 1440, height: 1000 } })); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_INTERNET_DISCONNECTED|ERR_CONNECTION|Failed to load resource/.test(m.text())) errs.push(who + ': ' + m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(900); return p; };
  const pin = async (p, who) => { await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(150); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400); };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const q = await mk('Clement'); await pin(q, 'Clement');
  await q.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await q.waitForTimeout(700);
  await go(q, '#/sync'); const hasForm = await q.evaluate(() => !!document.querySelector('form[data-form=synclink]')); console.log('sync form', hasForm);
  if (hasForm) { await q.fill('form[data-form=synclink] [name=link]', LINK); await q.click('form[data-form=synclink] button'); await q.waitForTimeout(700); const st = await q.$('[data-sact=start]'); if (st) { await st.click(); await q.waitForTimeout(2000); } }
  console.log('shared', await q.evaluate(() => syncOn()), 'snapshot on server', !!mock.store.snapGet());
  const kid = await q.evaluate(() => S.children.find(c => isCurrent(c) && needsVisits(c)).id);
  await go(q, '#/child/' + kid);
  console.log('docs box', await q.evaluate(() => document.querySelector('#docsbox').innerText.replace(/\n+/g, ' | ').slice(0, 200)));
  await q.setInputFiles('#docsbox input[type=file]', SP + 'cert.png'); await q.waitForTimeout(500);
  console.log('picked', await q.evaluate(() => document.querySelector('[data-fileinfo="doc"]').innerText));
  await q.click('#docsbox form button.pri'); await q.waitForTimeout(2500);
  console.log('after add', await q.evaluate(id => { const c = child(id); return { docs: c.docs.map(d => [d.kind, d.name, d.mime, d.size]), out: filesOut().length, chip: document.querySelector('#docsbox p').innerText }; }, kid), 'server files', Object.keys(mock.store._files).length, Object.values(mock.store._files).map(f => [f.name, f.mime, f.kind, f.data.length]));
  console.log('local copy removed after sending', await q.evaluate(async id => !(await fileLocalGet(child(id).docs[0].id)), kid));
  await q.click('#docsbox [data-dact="open"]'); await q.waitForTimeout(1200);
  console.log('open image from the server', await q.evaluate(() => { const d = document.getElementById('phbox'); return d ? [d.querySelector('img').src.slice(0, 30), d.querySelector('figcaption').innerText] : null; })); await q.keyboard.press('Escape');
  /* pdf */
  await q.selectOption('#docsbox [name="kind"]', 'Case study'); await q.fill('#docsbox [name="note"]', 'October case study'); await q.setInputFiles('#docsbox input[type=file]', SP + 'case.pdf'); await q.waitForTimeout(400); await q.click('#docsbox form button.pri'); await q.waitForTimeout(2500);
  const [dl] = await Promise.all([q.waitForEvent('download', { timeout: 8000 }).catch(() => null), q.click('#docsbox .it:has-text("Case study") [data-dact="open"]')]);
  console.log('pdf', await q.evaluate(id => child(id).docs.length, kid), 'server files', Object.keys(mock.store._files).length, 'download', dl ? dl.suggestedFilename() : 'no download event');
  /* offline: kept on the device, sent later */
  mock.setDown(true); await q.context().setOffline(true);
  await q.selectOption('#docsbox [name="kind"]', 'Other document'); await q.setInputFiles('#docsbox input[type=file]', SP + 'cert.png'); await q.waitForTimeout(400); await q.click('#docsbox form button.pri'); await q.waitForTimeout(1200);
  console.log('offline', await q.evaluate(() => [filesOut().length, (document.body.innerText.match(/waiting for internet to be sent/) || [''])[0]]), 'server files', Object.keys(mock.store._files).length);
  await q.click('#docsbox .it:has-text("Other document") [data-dact="open"]'); await q.waitForTimeout(500); console.log('open offline from the device', await q.evaluate(() => !!document.getElementById('phbox'))); await q.keyboard.press('Escape');
  mock.setDown(false); await q.context().setOffline(false); await q.evaluate(() => filesFlush()); await q.waitForTimeout(2500);
  console.log('back online', await q.evaluate(() => filesOut().length), 'server files', Object.keys(mock.store._files).length);
  /* remove */
  await q.click('#docsbox .it:has-text("Other document") [data-dact="del"]'); await q.waitForTimeout(1200); console.log('removed', await q.evaluate(id => child(id).docs.length, kid), 'server files', Object.keys(mock.store._files).length);
  /* visit with photo, then validation by the supervisor */
  await go(q, '#/visit/new?child=' + kid + '&t=Family'); await q.selectOption('[name="purpose"]', 'Follow-up'); await q.fill('[name="findings"]', 'Mother at home, child attends school'); await q.setInputFiles('form[data-form="visit"] input[type=file]', SP + 'cert.png'); await q.waitForTimeout(400); await q.click('form[data-form="visit"] button.pri'); await q.waitForTimeout(3000);
  console.log('visit', await q.evaluate(id => { const v = visitsOf(id).filter(v => v.date === today()).pop(); return [!!v.photo, visitState(v), filesOut().length]; }, kid), 'server files', Object.keys(mock.store._files).length);
  const rep = () => q.evaluate(() => { const m = thisMonth(), { a, b } = monthCtx(m); const rec = S.visits.filter(v => inRange(v.date, a, b) && visitTeam(v) === 'Family'); return [rec.length, rec.filter(visitCounts).length]; });
  await q.evaluate(() => { const bn = S.staff.find(s => s.name.includes('Bernard')).id; for (const v of S.visits) if (v.recordedOn === today()) { v.by = bn; v.recordedBy = bn; } save(); });
  await go(q, '#/visits?vt=all&vtab=check');
  console.log('clement tab', await q.evaluate(() => [document.querySelector('#checkbox h2').innerText, document.querySelectorAll('.chk').length]), 'report recorded/counted', await rep());
  await q.click('.chk [data-dact="open"]'); await q.waitForTimeout(1500); console.log('photo opens from the server', await q.evaluate(() => !!document.getElementById('phbox'))); await q.keyboard.press('Escape');
  await q.screenshot({ path: SP + 't59-check.png' });
  await q.click('.chk [data-dact="back"]'); await q.waitForTimeout(300); console.log('send back needs a note: still', await q.evaluate(() => [document.querySelectorAll('.chk').length, visitsToCheck('all', 'all').filter(v => visitState(v) === 'back').length]));
  await q.fill('.chk input[name="note"]', 'Photo not clear'); await q.click('.chk [data-dact="back"]'); await q.waitForTimeout(400); console.log('sent back', await q.evaluate(() => [document.querySelector('.chk .chip.c-red').innerText, visitsToCheck('all', 'all').filter(v => visitState(v) === 'back').length]), 'report', await rep());
  await q.click('.chk [data-dact="valid"]'); await q.waitForTimeout(400);
  console.log('validated', await q.evaluate(() => document.querySelectorAll('.chk').length), 'report recorded/counted', await rep());
  await go(q, '#/reports?s=Family'); console.log('family report rows', await q.evaluate(() => [...document.querySelectorAll('tr')].filter(t => /Visits made|not validated/.test(t.innerText)).map(t => t.innerText.replace(/\s+/g, ' ')).join(' || ')));
  await go(q, '#/child/' + kid); console.log('history has no validation line', await q.evaluate(() => !/Visit validated|Visit sent back/.test(document.body.innerText)));
  /* a non-admin in the demo: sees only his visits, cannot validate */
  const d = await (await b.newContext({ viewport: { width: 393, height: 800 } })).newPage(); d.on('pageerror', e => errs.push('demo: ' + e.message)); d.on('dialog', x => x.accept()); await d.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await d.waitForTimeout(900); await d.click('.stile:has-text("Bernard")'); await d.waitForTimeout(400);
  const dk = await d.evaluate(() => S.children.find(c => needsVisits(c)).id);
  await go(d, '#/visit/new?child=' + dk + '&t=Family'); await d.selectOption('[name="purpose"]', 'Follow-up'); await d.setInputFiles('form[data-form="visit"] input[type=file]', SP + 'cert.png'); await d.waitForTimeout(400); await d.click('form[data-form="visit"] button.pri'); await d.waitForTimeout(800);
  await go(d, '#/visits?vt=Family&vtab=check'); console.log('demo non-admin', await d.evaluate(() => [document.querySelector('#checkbox h2').innerText, document.querySelectorAll('.chk').length, !!document.querySelector('[data-dact="valid"]'), document.documentElement.scrollWidth <= window.innerWidth + 1]));
  await d.click('.chk [data-dact="open"]'); await d.waitForTimeout(500); console.log('demo photo from the device', await d.evaluate(() => !!document.getElementById('phbox'))); await d.keyboard.press('Escape');
  for (const h of ['#/child/' + dk, '#/visit/new?child=' + dk + '&t=Family']) { await go(d, h); console.log('phone', h, await d.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)); }
  await go(d, '#/'); console.log('demo to do', await d.evaluate(() => /to validate/.test(document.body.innerText)));
  console.log('errors', errs.length, errs.slice(0, 5));
  await b.close(); mock.srv.close();
})();
