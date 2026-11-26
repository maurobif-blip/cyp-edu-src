// quick marking with the register row of the design system: Present button, other marks from the tag, Street, remove, Comment under More
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  await p.evaluate(() => { USER = S.staff.find(s => s.active !== false && !s.admin && mainFlag(s) === 'Minsundu'); location.hash = '#/attendance?c=Minsundu&g=UCC'; render(); }); await p.waitForTimeout(500);
  const row = i => p.locator('.qrow').nth(i), st = () => p.evaluate(() => { const t = today(); return [...document.querySelectorAll('.qrow')].slice(0, 3).map(r => r.querySelector('.qtag').innerText.trim() + '|' + (r.querySelector('.cyp-btn--mark') ? 'btn' : '-')); });
  console.log('0', await st(), 'button size', await row(0).locator('.cyp-btn--mark').evaluate(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }), 'row', await row(0).evaluate(e => Math.round(e.getBoundingClientRect().height)));
  await row(0).locator('.cyp-btn--mark').tap(); await p.waitForTimeout(300); console.log('1 present', await st());
  await row(1).locator('.qtag').tap(); await p.waitForTimeout(300); console.log('2 options', await row(1).locator('.qopts label, .qopts button, .qopts a').allInnerTexts());
  await row(1).locator('.qopts input[data-v=T]').tap(); await p.waitForTimeout(300); console.log('2 street', await st(), await row(1).locator('.qtag').evaluate(e => e.className));
  await row(0).locator('.qtag').tap(); await p.waitForTimeout(300); await row(0).locator('.qopts button[data-v=""]').tap(); await p.waitForTimeout(300); console.log('3 removed', await st());
  console.log('saved', await p.evaluate(() => Object.values(S.attendance[today()] || {}).filter(Boolean)), 'fits', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  // Comment under More: back to the page, comment mode on
  await p.evaluate(() => { location.hash = '#/children'; }); await p.waitForTimeout(400); await p.evaluate(() => { location.hash = '#/more'; }); await p.waitForTimeout(400);
  console.log('4 bar', await p.evaluate(() => [...document.querySelectorAll('.hd *')].filter(e => e.offsetParent && /Comment/.test(e.innerText || '') && e.children.length === 0).length), 'More has Comment', await p.locator('[data-cmt]').count());
  await p.locator('[data-cmt]').tap(); await p.waitForTimeout(900); console.log('4 after', await p.evaluate(() => [location.hash, !!UI.fbMode, !!document.getElementById('fbbar')]));
  console.log('errors', errs); await b.close(); })();
