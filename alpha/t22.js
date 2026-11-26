const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const errs = [];
  const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message)); q.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); q.on('dialog', d => d.accept());
  await q.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await q.waitForTimeout(300); await q.click('.stile:has-text("Mauro")'); await q.waitForTimeout(150); await q.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await q.click('form[data-form=pinlogin] button.pri'); await q.waitForTimeout(250);
  const v3 = JSON.parse(require('fs').readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json','utf8'));
  await q.evaluate(pk => { importStarterPack(pk); const c = S.children.find(c => c.section === 'UCC'); S.visits.push({ id: 'vx', childId: c.id, team: 'Family', date: today(), purpose: 'Follow-up', where: 'Home', by: USER.id, successful: 'Yes', metWith: 'Mother Chanda', findings: 'Secret finding about the family', action: 'Call the uncle' }); save(); }, v3); await q.waitForTimeout(600);
  const real = await q.evaluate(() => { const staffWords = new Set(S.staff.flatMap(s => s.name.toLowerCase().split(/[^a-z]+/))); const w = new Set(); const keep = new Set(S.children.flatMap(c => [c.compound, c.schoolName, c.schoolType].join(' ').toLowerCase().split(/[^a-z]+/))); for (const c of S.children) for (const k of ['name', 'surname', 'nickname']) for (const x of String(c[k] || '').toLowerCase().split(/[^a-z]+/)) if (x.length >= 5 && !staffWords.has(x) && !keep.has(x) && !['known', 'first', 'small', 'chips', 'staff'].includes(x)) w.add(x); const pairs = S.children.map(c => (c.name + ' ' + c.surname).toLowerCase().trim()).filter(x => x.length > 6); w.pairs = pairs; return { words: [...w].concat(w.pairs), n: S.children.length, photos: Object.keys(S.photos || {}).length, first: S.children[0].name + ' ' + S.children[0].surname }; });
  console.log('real:', real.n, 'children,', real.photos, 'photos,', real.words.length, 'name words');
  await q.click('[data-act=logout]'); await q.waitForTimeout(200); await q.screenshot({ path: 'shots/G-login.png' });
  await q.click('[data-act=guest]'); await q.waitForTimeout(600);
  console.log('guest:', await q.evaluate(() => [GUEST, USER.name, S.children[0].name, Object.keys(S.photos).length, S_REAL.children[0].name !== 'XXXX', !!document.querySelector('.guestbar')]));
  const go = async h => { await q.evaluate(h => location.hash = h, h); await q.waitForTimeout(450); };
  const leak = async tag => { const r = await q.evaluate(words => { const txt = document.body.innerText.toLowerCase(); const vals = [...document.querySelectorAll('input,textarea,option')].map(e => (e.value || '') + ' ' + (e.textContent || '')).join(' ').toLowerCase(); const hit = words.filter(w => new RegExp('\\b' + w + '\\b').test(txt) || new RegExp('\\b' + w + '\\b').test(vals)); const imgs = [...document.querySelectorAll('img')].filter(i => !/logo/i.test(i.alt)).length; return { hit: hit.slice(0, 8), n: hit.length, imgs, secret: /secret finding|uncle|mother chanda/.test(txt + vals) }; }, real.words); if (r.n || r.imgs || r.secret) console.log('LEAK', tag, JSON.stringify(r)); return r; };
  const cid = await q.evaluate(() => S.children.find(c => c.section === 'UCC').id), lid = await q.evaluate(() => S.children.find(c => c.section === 'Luigi').id);
  const pages = ['#/home', '#/pending', '#/children', '#/children?status=all', '#/child/' + cid, '#/child/' + cid + '/edit', '#/child/' + lid, '#/attendance?c=Minsundu', '#/attendance?c=Luigi', '#/attendance?c=Luigi&lt=day&lm=2026-10', '#/attendance?c=Luigi&lt=sum', '#/visits?vt=all', '#/visits?vt=all&vtab=need', '#/visits?vt=all&vtab=plan', '#/visits?vt=all&vtab=actions', '#/visit/new', '#/counseling', '#/reports?s=Luigi&m=2026-10', '#/reports?s=UCC', '#/reports?s=Family', '#/review', '#/more', '#/staff', '#/staff/data'];
  let bad = 0; for (const h of pages) { await go(h); const r = await leak(h); if (r.n || r.imgs || r.secret) bad++; }
  console.log('pages checked', pages.length, 'with leaks', bad);
  await go('#/reports?s=Luigi&m=2026-10'); await q.click('details summary'); await leak('names behind columns');
  await go('#/child/' + lid); await q.screenshot({ path: 'shots/G-child.png' });
  await go('#/attendance?c=Luigi&ld=2026-10-14'); await q.screenshot({ path: 'shots/G-luigi.png' });
  // search by real name finds nothing
  await go('#/children'); await q.fill('#search', real.first.split(' ')[0]); await q.waitForTimeout(300); console.log('search real first name ->', await q.evaluate(() => document.querySelectorAll('#childTable tbody tr').length), 'rows');
  // guest marks attendance and saves a visit: nothing reaches the real records
  await go('#/attendance?c=Minsundu'); await q.evaluate(() => document.querySelector('#attTable .att button.P').click()); await q.waitForTimeout(400); console.log('guest edit controls visible:', await q.evaluate(() => [...document.querySelectorAll('a[href^="#/visit/new"],a[href$="/edit"],form[data-form] button')].filter(e => e.offsetParent).length));
  const [dl] = await Promise.all([q.waitForEvent('download'), (async () => { await go('#/children'); await q.click('[data-act=exportlist]'); })()]);
  const path = await dl.path(); const buf = require('fs').readFileSync(path); console.log('export bytes', buf.length);
  const stored = await q.evaluate(() => loadState().then(s => [s.children[0].name, s.children.length, Object.keys(s.photos || {}).length, Object.keys(s.attendance || {}).length, s.visits.length, s.visits[s.visits.length - 1].findings]));
  console.log('stored while guest:', stored);
  await q.reload(); await q.waitForTimeout(700); console.log('after reload:', await q.evaluate(() => [GUEST, S.children[0].name, S_REAL.children[0].name === 'XXXX']));
  await q.click('.guestbar [data-act=logout]'); await q.waitForTimeout(300); await q.click('.stile:has-text("Mauro")'); await q.waitForTimeout(150); await q.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await q.click('form[data-form=pinlogin] button.pri'); await q.waitForTimeout(250); await q.waitForTimeout(300);
  console.log('back as staff:', await q.evaluate(first => [GUEST, (S.children[0].name + ' ' + S.children[0].surname) === first, Object.keys(S.photos).length, Object.keys(S.attendance).length, S.visits[S.visits.length - 1].findings], real.first));
  await q.evaluate(() => { S.meta.t = 1; save(); }); await q.waitForTimeout(400);
  console.log('stored after staff save:', await q.evaluate(() => loadState().then(s => [s.children[0].name !== 'XXXX', s.children.length])));
  console.log('errors', errs); await b.close();
})();
