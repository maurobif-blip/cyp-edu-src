const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); await p.click('.stile:has-text("Chisha")'); await p.waitForTimeout(300);
  console.log(await p.evaluate(() => { const t = today(), y = Number(t.slice(0, 4)); for (const c of S.children) { c.dob = ''; } const nk = S.children.filter(c => c.section === 'Nkwazi' && isCurrent(c));
    nk[0].age = 10; nk[0].ageAsOf = (y - 1) + t.slice(4);            // age only, "birthday" today: must not show
    nk[1].dob = (y - 8) + t.slice(4);                               // real date: shows
    const r0 = birthdayList().map(x => x.c === nk[1] ? 'real' : x.c === nk[0] ? 'AGE-ONLY' : 'other');
    return { shown: r0, ageOnlyAge: curAge(nk[0]), jan1: (() => { const c = { dob: '2015-01-01', status: 'Active', section: 'Nkwazi' }; return c.dob.slice(5) === '01-01'; })() }; }));
  console.log('errors', errs); await b.close();
})();
