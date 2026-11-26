// full-page phone shots of chosen pages: node mshot.js outdir "Name|#/hash|file" ...
const { chromium } = require('playwright'); const fs = require('fs'); const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: Number(process.env.W || 360), height: 740 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  for (const a of process.argv.slice(3)) { const [flag, hash, file, clip] = a.split('|');
    await p.evaluate(([f, h]) => { USER = f === 'Admin' ? S.staff.find(s => s.admin) : S.staff.find(s => s.active !== false && !s.admin && mainFlag(s) === f); location.hash = h === '@child' ? '#/child/' + S.children.find(c => centreOf(c) === 'Nkwazi' && c.status !== 'Closed').id : h; render(); }, [flag, hash]); await p.waitForTimeout(500);
    await p.addStyleTag({ content: '.demobar{display:none!important}' });
    const h = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: OUT + file + '.png', fullPage: true, clip: { x: 0, y: 0, width: Number(process.env.W || 360), height: Math.min(h, Number(clip || 2200)) } });
    console.log(file, h, await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 ? 'OVERFLOW' : 'ok')); }
  console.log('errors', errs); await b.close(); })();
