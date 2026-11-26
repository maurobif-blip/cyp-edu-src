// interactive report (beta 1.1, InteractiveReport of the design system): cover, chapters, Back / Next, keyboard, motion classes, numbers, links, phone and computer
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [W, H, name] of [[1366, 860, 'pc'], [360, 740, 'phone']]) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 500, hasTouch: W < 500 }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ' ' + e));
    await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
    await p.evaluate(() => { USER = S.staff.find(s => s.admin); location.hash = '#/story'; render(); }); await p.waitForTimeout(600); await p.addStyleTag({ content: '.demobar{display:none!important}' });
    console.log(name, 'cover', await p.evaluate(() => [document.querySelector('.st-cover h1').innerText, document.querySelector('.st-sub').innerText, !!document.querySelector('.cyp-nav--chapters'), document.querySelector('.st-start').innerText.trim()]));
    const n = await p.evaluate(() => UI.stCount); const out = [];
    for (let i = 1; i < n; i++) { await p.evaluate(i => { location.hash = '#/story?p=' + i; }, i); await p.waitForTimeout(120);
      const cls = await p.evaluate(() => [document.getElementById('stchap').className, document.querySelector('.st-body').className]); await p.waitForTimeout(1500);
      out.push(await p.evaluate(cls => ({ nav: document.querySelector('.cyp-nav--chapters [aria-current]').innerText.replace(/\s+/g, ' '), navNames: getComputedStyle(document.querySelector('.cyp-nav__name')).display, title: document.querySelector('.st-title').innerText, in: cls, after: document.getElementById('stchap').className, foot: [...document.querySelectorAll('.st-foot .cyp-btn')].map(x => x.innerText.trim()), pri: document.querySelectorAll('.main .cyp-btn--primary, .main .btn.pri').length, nums: [...document.querySelectorAll('.st-n')].map(x => x.textContent + '=' + x.dataset.n).slice(0, 6), fits: document.documentElement.scrollWidth <= innerWidth + 1 }), cls));
      await p.screenshot({ path: '/home/claude/mob/story-' + name + '-' + i + '.png', fullPage: name === 'phone' }); }
    out.forEach(o => console.log(name, JSON.stringify(o).slice(0, 520)));
    await p.evaluate(() => { location.hash = '#/story?p=2'; }); await p.waitForTimeout(500); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400); const k1 = await p.evaluate(() => location.hash); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(150); const back = await p.evaluate(() => document.getElementById('stchap').className);
    console.log(name, 'keys', k1, await p.evaluate(() => location.hash), back);
    // a month before with the Pager: the chapter stays, nothing comes in again
    await p.click('.st-pager a:has-text("Before")'); await p.waitForTimeout(150); console.log(name, 'month before', await p.evaluate(() => [location.hash, document.getElementById('stchap').className, document.querySelector('.cyp-pager__now').innerText, document.querySelector('.st-pager .cyp-btn:last-child').tagName]));
    // a redraw (as a sync does) does not move the page
    await p.evaluate(() => render()); await p.waitForTimeout(100); console.log(name, 'redraw', await p.evaluate(() => [document.getElementById('stchap').className, document.querySelector('main').className]));
    const links = []; for (let i = 1; i < n; i++) { await p.evaluate(i => { location.hash = '#/story?p=' + i; }, i); await p.waitForTimeout(300); links.push(...await p.evaluate(() => [...document.querySelectorAll('#stchap a[href^="#/"]')].map(a => a.getAttribute('href')).filter(h => !/^#\/story/.test(h)))); }
    for (const h of [...new Set(links)]) { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(250); const t = await p.evaluate(() => (document.querySelector('h1') || {}).innerText); if (!t) console.log(name, 'EMPTY', h); }
    console.log(name, 'links opened', new Set(links).size);
    // page motion: a new page comes in, the same page drawn again does not
    await p.evaluate(() => { location.hash = '#/children'; }); await p.waitForTimeout(120); const m1 = await p.evaluate(() => document.querySelector('main').className); await p.evaluate(() => render()); await p.waitForTimeout(80); const m2 = await p.evaluate(() => document.querySelector('main').className); await p.waitForTimeout(1400);
    console.log(name, 'page motion', [m1, m2, await p.evaluate(() => document.querySelector('main').className)]);
    await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
