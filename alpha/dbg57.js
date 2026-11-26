const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 393, height: 800 } })).newPage(); p.on('dialog', x => x.dismiss());
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(600); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(300);
  await p.evaluate(pk => { importStarterPack(pk); const c = S.children.find(c => isCurrent(c) && needsVisits(c)); referAdd(c.id, 'Sports', 'Family', 'Home visit suggested', 'note'); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(400);
  await p.evaluate(() => { location.hash = '#/referrals'; }); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => { const f = document.querySelector('.refdone'), i = f.querySelector('input.in'), bt = f.querySelector('button'); const r = e => { const x = e.getBoundingClientRect(); return Math.round(x.width) + 'x' + Math.round(x.height); }; const cs = getComputedStyle(f); return { form: r(f), input: r(i), button: r(bt), formDisplay: cs.display, formFlex: cs.flex, formWidth: cs.width, refit: r(f.parentElement), refitDir: getComputedStyle(f.parentElement).flexDirection, inputFlex: getComputedStyle(i).flex, inputW: getComputedStyle(i).width, hidden: [...f.querySelectorAll('input')].map(x => x.type + ':' + r(x)) }; }));
  console.log('summary', await p.evaluate(() => { location.hash = '#/attendance?c=Minsundu&g=UCC'; return 1; })); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => [...document.querySelectorAll('summary')].map(s => [s.className, s.parentElement.className, getComputedStyle(s).paddingTop, Math.round(s.getBoundingClientRect().height)])));
  await b.close();
})();
