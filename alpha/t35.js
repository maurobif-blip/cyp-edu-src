const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const run = async (nm, opt) => { const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900);
    if (opt.isMobile) await p.tap(`.stile:has-text("${nm}")`); else await p.click(`.stile:has-text("${nm}")`); await p.waitForTimeout(300);
    await p.evaluate(() => { const t = today(), y = Number(t.slice(0, 4)); const nk = S.children.filter(c => c.section === 'Nkwazi' && isCurrent(c)), uc = S.children.filter(c => c.section === 'UCC' && isCurrent(c));
      nk[0].dob = (y - 10) + t.slice(4); nk[1].dob = (y - 8) + addDays(t, -1).slice(4); nk[2].dob = (y - 12) + addDays(t, 3).slice(4); nk[3].dob = (y - 9) + addDays(t, 7).slice(4); nk[4].dob = (y - 9) + addDays(t, 8).slice(4); nk[5].dob = (y - 9) + addDays(t, -2).slice(4); uc[0].dob = (y - 11) + t.slice(4); save(); render(); });
    await p.waitForTimeout(300);
    console.log(nm, opt.isMobile ? 'phone' : 'desk', await p.evaluate(() => { const el = document.querySelector('#birthdays'); return el ? el.innerText.replace(/\n+/g, ' | ') : 'no birthday note'; }));
    if (nm === 'Chisha') await p.screenshot({ path: `shots/B-${opt.isMobile ? 'ph' : 'dk'}.png` }); await p.context().close(); };
  await run('Chisha', { viewport: { width: 1440, height: 900 } }); await run('Chisha', { ...devices['Pixel 5'] }); await run('Maxwell', { viewport: { width: 1440, height: 900 } }); await run('Bernard', { viewport: { width: 1440, height: 900 } }); await run('Clement', { viewport: { width: 1440, height: 900 } });
  console.log('errors', errs.slice(0, 5)); await b.close();
})();
