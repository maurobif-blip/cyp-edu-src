const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const pack = JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'));
  const PAGES = ['#/home', '#/pending', '#/children', '#/attendance?c=Nkwazi', '#/attendance?c=Minsundu&g=UCC', '#/attendance?c=Luigi', '#/attendance?c=School', '#/attendance?c=Literacy', '#/visits', '#/visits?vtab=need', '#/visits?vtab=plan', '#/visits?vtab=actions', '#/visits?vtab=check', '#/visit/new', '#/visit/new?t=School', '#/counseling', '#/outreach', '#/reports', '#/reports?s=Family', '#/reports?s=School', '#/reports?s=UCC', '#/reports?s=Youth', '#/reports?s=Nkwazi', '#/reports?s=Luigi', '#/reports?s=Counseling', '#/school', '#/referrals', '#/monthly', '#/paths', '#/paths?ps=Minsundu', '#/activities', '#/logframe', '#/staff', '#/staff/data', '#/review', '#/feedback', '#/more', '#/sync', '#/help', '#/child/new'];
  for (const [label, when, withPack] of [['31 Dec 2026 23:30', '2026-12-31T23:30:00', 1], ['1 Jan 2027 08:00', '2027-01-01T08:00:00', 1], ['29 Feb 2028', '2028-02-29T10:00:00', 1], ['phone clock reset: 1 Jan 2015', '2015-01-01T10:00:00', 1], ['empty database today', '2026-11-17T10:00:00', 0]]) {
    const ctx = await b.newContext({ viewport: { width: 393, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 140))); p.on('dialog', x => x.dismiss());
    await p.clock.setFixedTime(new Date(when));
    await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(600);
    await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(300);
    if (withPack) { await p.evaluate(pk => { importStarterPack(pk); save(); }, pack); await p.waitForTimeout(400); }
    const bad = []; const kid = await p.evaluate(() => (S.children[0] || {}).id); const pages = PAGES.concat(kid ? ['#/child/' + kid, '#/child/' + kid + '/edit', '#/child/' + kid + '/term', '#/child/' + kid + '/month'] : []);
    for (const h of pages) { const n = errs.length; await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(160); const r = await p.evaluate(() => { const t = document.querySelector('main').innerText; return [/Something went wrong/.test(t) ? t.slice(0, 160) : '', (t.match(/undefined|NaN|Invalid Date|\[object/g) || []).join(','), document.documentElement.scrollWidth - innerWidth]; }); if (errs.length > n || r[0] || r[1] || r[2] > 5) bad.push(h + ' ' + JSON.stringify([errs.slice(n), r])); }
    const info = await p.evaluate(() => ({ today: today(), month: thisMonth(), term: typeof termNow === 'function' ? JSON.stringify(termNow()) : '' }));
    console.log('\n##', label, JSON.stringify(info), 'pages', pages.length, 'problems', bad.length); bad.forEach(x => console.log('   ', x.slice(0, 400)));
    if (!withPack) { await p.evaluate(() => { location.hash = '#/home'; }); await p.waitForTimeout(200); console.log('   empty home text:', (await p.evaluate(() => document.querySelector('main').innerText)).replace(/\s+/g, ' ').slice(0, 500)); }
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 500)); process.exit(1); });
