const { chromium } = require('playwright'); const fs = require('fs'); const { start } = require('/home/claude/server/mock.js');
const PIN = require('/home/claude/cyp-edu-src/alpha/pin.js'), SP = '/tmp/cyp-shots/';
(async () => {
  const mock = await start(8840, 'K'); const b = await chromium.launch(); const errs = [];
  for (const w of [393, 360]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: true, isMobile: true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(900);
    await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', PIN); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400);
    await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(600);
    const fit = async tag => console.log(w, tag, await p.evaluate(() => { const small = [...document.querySelectorAll('main button, main a.btn, main summary')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => e.innerText.slice(0, 30)); return { fits: document.documentElement.scrollWidth <= innerWidth, small }; }));
    await p.evaluate(() => location.hash = '#/sync'); await p.waitForTimeout(400);
    if (w === 393) { await p.fill('form[data-form=synclink] [name=link]', 'http://127.0.0.1:8840/exec?k=K'); await p.click('form[data-form=synclink] button'); await p.waitForTimeout(800); await fit('start step'); await p.screenshot({ path: SP + 'lock-start.png', fullPage: true }); await p.click('[data-sact=start]'); await p.waitForTimeout(2500); }
    else { await p.evaluate(() => { lsSet('cyp-sync', JSON.stringify({ url: 'http://127.0.0.1:8840/exec', key: 'K' })); }); await p.reload(); await p.waitForTimeout(900); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', PIN); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400); await p.evaluate(() => location.hash = '#/sync'); await p.waitForTimeout(900); await p.click('[data-sact=load]'); await p.waitForTimeout(1500); await p.evaluate(() => { SY.busy = false; return syncNow(); }); await p.waitForTimeout(600); await p.evaluate(() => { location.hash = '#/home'; }); await p.waitForTimeout(300); await p.evaluate(() => { location.hash = '#/sync'; }); await p.waitForTimeout(500); }
    await p.evaluate(() => { const d = document.getElementById('lockbox'); if (d) d.open = true; }); await fit('connected'); await p.screenshot({ path: SP + 'lock-' + w + '.png', fullPage: true });
    await p.evaluate(() => location.hash = '#/help'); await p.waitForTimeout(400); await fit('help');
    await ctx.close();
  }
  console.log('errors', errs); await b.close(); mock.srv.close();
})();
