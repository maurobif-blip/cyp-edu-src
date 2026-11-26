const { chromium } = require('playwright'); const fs = require('fs');
const SP = '/tmp/cyp-shots/rev3/'; fs.mkdirSync(SP, { recursive: true });
const SHOTS = { Bernard: ['#/home', '#/visits', '#/visits?vtab=need', '#/visits?vtab=plan', '#/more'], Merabe: ['#/home', '#/visits', '#/school'], Cristoph: ['#/home', '#/attendance', '#/visits'], Clement: ['#/home', '#/visits', '#/todo2'] };
(async () => { const b = await chromium.launch();
  for (const who of Object.keys(SHOTS)) { const ctx = await b.newContext({ viewport: { width: 393, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); const p = await ctx.newPage(); p.on('dialog', d => d.accept());
    await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', await p.evaluate(() => pinValue())); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400); }
    await p.addStyleTag({ content: '#tour, .tourbar, #demobar { display: none !important; }' });
    const kid = await p.evaluate(() => S.children.find(c => isCurrent(c) && centreOf(c) === 'Minsundu').id);
    for (const h of SHOTS[who].concat(who === 'Bernard' ? ['#/child/' + kid] : [])) { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); await p.screenshot({ path: SP + who + h.replace(/[^a-z0-9]+/gi, '_') + '.png', fullPage: true }); }
    await ctx.close(); }
  await b.close(); })();
