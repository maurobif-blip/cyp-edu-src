// two sample screens for approval: Home and Attendance on a phone, names shown as "Sample name"
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  const mask = () => p.evaluate(() => { document.querySelectorAll('.qn b').forEach(x => x.textContent = 'Sample name'); document.querySelectorAll('.qn > span').forEach(x => x.textContent = x.textContent.replace(/"[^"]*" · /, '')); document.querySelectorAll('.qrow .av, .qrow img').forEach(x => { if (x.tagName === 'IMG') x.style.visibility = 'hidden'; else x.textContent = 'SN'; }); document.querySelectorAll('.warn a').forEach(x => x.textContent = 'Sample name'); document.querySelectorAll('[data-act=qundo]').forEach(x => x.textContent = 'Undo: Sample name'); const w = document.querySelector('.hd .nm'); if (w) w.textContent = ''; document.querySelectorAll('.hd .av').forEach(x => x.textContent = 'SN'); });
  await p.evaluate(() => { USER = S.staff.find(s => s.active !== false && !s.admin && mainFlag(s) === 'Nkwazi'); location.hash = '#/home'; render(); }); await p.waitForTimeout(500); await p.addStyleTag({ content: '.demobar{display:none!important}' }); await mask();
  await p.screenshot({ path: '/home/claude/mob/sample-home-phone.png' });
  await p.evaluate(() => { location.hash = '#/attendance?c=Nkwazi'; render(); }); await p.waitForTimeout(600);
  const pick = async (i, v) => { const row = p.locator('.qrow').nth(i); if (v === 'P') await row.locator('button[data-v=P]').click(); else { await row.locator('.qtag').click(); await p.waitForTimeout(200); await p.locator('.qrow').nth(i).locator('.qopts [data-v=' + v + ']').click(); } await p.waitForTimeout(250); };
  await pick(0, 'P'); await pick(1, 'A'); await pick(2, 'S'); await pick(3, 'E'); await p.evaluate(() => scrollTo(0, 0)); await mask();
  await p.evaluate(() => { const r = document.querySelectorAll('.qrow')[1]; scrollTo(0, r.getBoundingClientRect().top + scrollY - 150); }); await p.waitForTimeout(300);
  await p.screenshot({ path: '/home/claude/mob/sample-attendance-phone.png' });
  console.log('rows', await p.evaluate(() => [...document.querySelectorAll('.qrow')].slice(0, 6).map(r => r.innerText.replace(/\s+/g, ' '))), 'fits', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'bar', await p.evaluate(() => document.querySelector('.hd').innerText.replace(/\s+/g, ' ')));
  console.log('small', await p.evaluate(() => [...document.querySelectorAll('.qrow button')].slice(0, 8).map(e => Math.round(e.getBoundingClientRect().height))));
  console.log('errors', errs); await b.close(); })();
