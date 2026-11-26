// alpha 5.27: Street at Minsundu, registers visible, the marked row stays
const { chromium } = require('playwright'); const OUT = '/tmp/cyp-shots/';
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (vp, mob, who) => { const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1 }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
    await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
    await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', await p.evaluate(() => pinValue())); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(500); }
    await p.addStyleTag({ content: '.demobar{display:none!important}' }); return p; };
  const go = async (p, h) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(600); };
  // 1. Max on a phone: the registers are visible, one tap goes to Luigi
  let p = await mk({ width: 393, height: 800 }, true, 'Maxwell'); await go(p, '#/attendance');
  console.log('1 registers visible', await p.evaluate(() => [...document.querySelectorAll('.regbar a')].filter(x => x.offsetParent).map(x => x.innerText.trim() + (x.classList.contains('on') ? '*' : ''))));
  console.log('1 wider than the screen', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await p.tap('.regbar a:has-text("Luigi")'); await p.waitForTimeout(600);
  console.log('1 Luigi page', await p.evaluate(() => [document.querySelector('h1').innerText, !!document.querySelector('.regbar a.on'), document.querySelectorAll('.lrow, .qrow, [data-lact]').length > 0]));
  await p.screenshot({ path: OUT + 't83-luigi.png' });
  await p.tap('.regbar a:has-text("Minsundu")'); await p.waitForTimeout(600);
  // 2. the row stays after the tap
  const before = await p.evaluate(() => ({ rows: document.querySelectorAll('.qrow').length, first: document.querySelector('.qrow .qn b').innerText, stat: document.querySelector('.qcount').innerText }));
  await p.tap('.qrow button[data-v=P]'); await p.waitForTimeout(250);
  const after = await p.evaluate(() => ({ rows: document.querySelectorAll('.qrow').length, first: document.querySelector('.qrow .qn b').innerText, cls: document.querySelector('.qrow').className, mark: document.querySelector('.qrow .qmark') && document.querySelector('.qrow .qmark').innerText, stat: document.querySelector('.qcount').innerText, seg: document.querySelector('#qstat .seg').innerText.replace(/\s+/g, ' '), rest: document.querySelector('.qrest .sub').innerText, saved: Object.values(S.attendance[today()] || {}) }));
  console.log('2 before', before); console.log('2 after', after);
  console.log('2 row stays', before.rows === after.rows && before.first === after.first && /done P/.test(after.cls));
  // 3. Street: Other on the second row
  await p.tap('.qrow:nth-of-type(2) .qtag'); await p.waitForTimeout(250);
  console.log('3 options', await p.evaluate(() => [...document.querySelectorAll('.qopts .btn')].map(x => x.innerText.trim())));
  await p.tap('.qopts .btn:has-text("Street")'); await p.waitForTimeout(250);
  console.log('3 after street', await p.evaluate(() => ({ rows: document.querySelectorAll('.qrow').length, cls: document.querySelectorAll('.qrow')[1].className, mark: document.querySelectorAll('.qrow')[1].querySelector('.qmark').innerText, stat: document.querySelector('.qcount').innerText, saved: Object.values(S.attendance[today()] || {}) })));
  await p.screenshot({ path: OUT + 't83-quick.png' });
  // undo keeps the row
  await p.tap('[data-act=qundo]'); await p.waitForTimeout(400);
  console.log('3 undo', await p.evaluate(() => ({ rows: document.querySelectorAll('.qrow').length, saved: Object.values(S.attendance[today()] || {}) })));
  await p.tap('.qrow:nth-of-type(2) .qtag'); await p.waitForTimeout(250); await p.tap('.qopts .btn:has-text("Street")'); await p.waitForTimeout(250);
  // leaving the page and coming back: the marked rows are under Marked
  await go(p, '#/home'); await go(p, '#/attendance');
  console.log('3 back on the page', await p.evaluate(() => ({ rows: document.querySelectorAll('.qrow').length, seg: document.querySelector('#qstat .seg').innerText.replace(/\s+/g, ' ') })));
  // non residents have no Street
  await go(p, '#/attendance?c=Minsundu&g=Non-resident'); await p.tap('.qrow .qtag'); await p.waitForTimeout(250);
  console.log('3 non-residents', await p.evaluate(() => [...document.querySelectorAll('.qopts .btn')].map(x => x.innerText.trim())));
  // Nkwazi unchanged
  await go(p, '#/attendance?c=Nkwazi'); await p.tap('.qrow .qtag'); await p.waitForTimeout(250);
  console.log('3 Nkwazi', await p.evaluate(() => [...document.querySelectorAll('.qopts .btn')].map(x => x.innerText.trim())));
  // 4. month register and To do
  await go(p, '#/attendance?c=Minsundu&g=UCC&av=month');
  console.log('4 month', await p.evaluate(() => ({ head: [...document.querySelectorAll('table.mreg thead th')].slice(-4).map(x => x.innerText + '=' + x.title), st: document.querySelectorAll('table.mreg td.mT').length, txt: (document.querySelector('table.mreg td.mT') || {}).innerText })));
  await go(p, '#/home');
  console.log('4 to do', await p.evaluate(() => [...document.querySelectorAll('.main a, .main .it')].map(x => x.innerText.replace(/\s+/g, ' ').trim()).filter(t => /Street/.test(t)).slice(0, 3)));
  // 5. computer: full list has the Street button, registers visible
  const c = await mk({ width: 1366, height: 800 }, false, 'Lewis'); await go(c, '#/attendance?c=Minsundu&g=UCC');
  console.log('5 computer', await c.evaluate(() => ({ reg: [...document.querySelectorAll('.regbar a')].map(x => x.innerText.trim()), buttons: [...document.querySelector('.atttab .att').querySelectorAll('button')].map(x => x.innerText.trim()), tiles: [...document.querySelectorAll('.tile span:not(.sub)')].map(x => x.innerText.trim()) })));
  await c.click('.atttab .att button.T'); await c.waitForTimeout(300);
  console.log('5 saved', await c.evaluate(() => Object.values(S.attendance[today()] || {})));
  await go(c, '#/attendance?c=Luigi&lt=centre'); console.log('5 luigi month', await c.evaluate(() => ({ reg: !!document.querySelector('.regbar'), month: !!document.querySelector('.attctl input, .attctl select, .attctl a') })));
  console.log('errors', errs); await b.close(); })();
