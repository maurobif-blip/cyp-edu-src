// computer shots: node dshot.js outdir "Flag|#/hash|file" ...
const { chromium } = require('playwright'); const fs = require('fs'); const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  for (const a of process.argv.slice(3)) { const [flag, hash, file, full] = a.split('|');
    await p.evaluate(([f, h]) => { USER = f === 'Admin' ? S.staff.find(s => s.admin) : S.staff.find(s => s.active !== false && !s.admin && mainFlag(s) === f); location.hash = h; render(); }, [flag, hash]); await p.waitForTimeout(500);
    await p.addStyleTag({ content: '.demobar{display:none!important}' });
    await p.screenshot({ path: OUT + file + '.png', fullPage: !!full });
    console.log(file, await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 ? 'OVERFLOW' : 'ok')); }
  console.log('errors', errs); await b.close(); })();
