const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (opt) => { const ctx = await b.newContext(opt); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(500); };
  for (const [nm, opt] of [['Chisha', { viewport: { width: 1440, height: 900 } }], ['Chisha', { ...devices['Pixel 5'] }], ['Chippo', { viewport: { width: 1440, height: 900 } }], ['Davies', { viewport: { width: 1440, height: 900 } }], ['Clement', { viewport: { width: 1440, height: 900 } }], ['Clement', { ...devices['Pixel 5'] }]]) {
    const p = await mk(opt); const ph = !!opt.isMobile; if (ph) await p.tap(`.stile:has-text("${nm}")`); else await p.click(`.stile:has-text("${nm}")`); await p.waitForTimeout(400);
    const info = await p.evaluate(() => ({ user: USER.name, nav: [...document.querySelectorAll('nav.nav a')].map(x => x.innerText.replace(/\n/g, ' ')).join(','), mnav: [...document.querySelectorAll('.mnav a')].map(x => x.innerText.replace(/\n/g, ' ')).join(','), todoHome: !!document.querySelector('#todo'), cards: [...document.querySelectorAll('#todo .ovcard h2')].map(x => x.innerText), top: document.querySelector('#todo') ? Math.round(document.querySelector('#todo').getBoundingClientRect().top) : null }));
    await go(p, '#/pending'); const pend = await p.evaluate(() => [document.querySelector('h1').innerText, Math.round(scrollY), !!document.querySelector('#todo'), document.querySelectorAll('.ovcard').length]);
    await go(p, '#/more'); const more = await p.evaluate(() => [...document.querySelectorAll('.mitem b')].map(x => x.innerText).join(','));
    console.log(nm, ph ? 'phone' : 'desk', JSON.stringify(info), JSON.stringify(pend), more);
    if (nm === 'Chisha') { await go(p, '#/home'); await p.screenshot({ path: `shots/H-${ph ? 'ph' : 'dk'}.png` }); }
    await p.context().close();
  }
  // Aaron: Luigi, street connected, moved to UCC as resident, goes to Nkwazi school
  const q = await mk({ viewport: { width: 1440, height: 900 } }); await q.click('.stile:has-text("Clement")'); await q.waitForTimeout(300);
  const id = await q.evaluate(() => S.children.find(c => c.section === 'Luigi' && isCurrent(c) && c.streetCat === 'B').id);
  await go(q, '#/child/' + id + '/status'); await q.selectOption('form[data-form=move] select[name=to]', 'UCC'); await q.selectOption('form[data-form=move] select[name=residence]', 'Resident'); await q.selectOption('form[data-form=move] select[name=schoolType]', 'Nkwazi community school'); await q.click('form[data-form=move] button'); await q.waitForTimeout(500);
  console.log('aaron case', await q.evaluate(id => { const c = child(id); return { chips: [...document.querySelectorAll('.top .chip')].map(x => x.innerText), where: document.querySelector('.where3').innerText.replace(/\n/g, ' | '), centres: attCentres(c), inNkzResidents: attIn(c, 'Nkwazi', 'Resident'), inMinsundu: attIn(c, 'Minsundu', 'Resident'), streetCat: c.streetCat }; }, id));
  await go(q, '#/attendance?c=Nkwazi&g=Resident&av=day'); console.log('on Nkwazi list', await q.evaluate(id => !!document.querySelector(`#attTable a[href="#/child/${id}"]`), id));
  console.log('errors', errs.slice(0, 6)); await b.close();
})();
