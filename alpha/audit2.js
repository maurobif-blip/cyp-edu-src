const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 393, height: 800 } }); const p = await ctx.newPage(); p.on('dialog', x => x.dismiss());
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700);
  await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400);
  await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(600);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(350); };
  const desc = `e => (e.tagName + '.' + (e.className || '').toString().split(' ').join('.') + ' "' + (e.innerText || e.value || e.placeholder || e.name || '').trim().slice(0, 30) + '"')`;
  for (const h of ['#/attendance?c=Nkwazi', '#/activities']) { await go(h); console.log('OVER', h, await p.evaluate(d => { const f = eval(d); return [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && !e.closest('.tw'); }).slice(0, 6).map(e => f(e) + ' right=' + Math.round(e.getBoundingClientRect().right)); }, desc)); }
  for (const h of ['#/home', '#/child/new', '#/attendance?c=Luigi', '#/reports?s=UCC', '#/visits?vtab=need', '#/child/5006', '#/reports?s=Luigi']) { await go(h);
    console.log('\nPAGE', h); console.log(' small', await p.evaluate(d => { const f = eval(d); return [...document.querySelectorAll('main a.btn, main button, main select, main input:not([type=hidden])')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 36; }).slice(0, 8).map(e => f(e) + ' h=' + Math.round(e.getBoundingClientRect().height)); }, desc));
    console.log(' tiny', await p.evaluate(d => { const f = eval(d); const m = {}; [...document.querySelectorAll('main *')].filter(e => e.children.length === 0 && (e.innerText || '').trim().length > 3 && parseFloat(getComputedStyle(e).fontSize) < 12 && e.getBoundingClientRect().width > 0).forEach(e => { const k = e.tagName + '.' + (e.className || '') + ' ' + getComputedStyle(e).fontSize; m[k] = (m[k] || 0) + 1; }); return m; }, desc));
    console.log(' nolabel', await p.evaluate(d => { const f = eval(d); return [...document.querySelectorAll('main input:not([type=hidden]):not([type=checkbox]):not([type=radio]), main select, main textarea')].filter(e => !e.closest('label') && !e.getAttribute('aria-label') && !(e.id && document.querySelector('label[for="' + e.id + '"]'))).map(f); }, desc)); }
  await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 500)); process.exit(1); });
