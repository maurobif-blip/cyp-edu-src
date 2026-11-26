// alpha 5.30: Education office page for the Education admin, design system layer
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [W, H, name] of [[1366, 900, 'pc'], [360, 740, 'phone']]) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 500, hasTouch: W < 500 }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ' ' + e)); p.on('dialog', d => d.accept());
    await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
    const as = async (f, h) => { await p.evaluate(([f, h]) => { USER = f === 'Admin' ? S.staff.find(s => s.admin) : S.staff.find(s => s.active !== false && !s.admin && mainFlag(s) === f); location.hash = h; render(); }, [f, h]); await p.waitForTimeout(400); };
    await as('Admin', '#/home'); await p.addStyleTag({ content: '.demobar{display:none!important}' });
    // two tasks: one due today for a person, one late for a team; a register mark today
    await p.evaluate(() => { const t = today(), who = S.staff.find(s => !s.admin && s.active).id; S.events.push({ id: 'tk1', type: 'Task', date: t, ts: Date.now(), by: USER.id, title: 'Send the October report', staff: [who], teams: [], due: t }, { id: 'tk2', type: 'Task', date: addDays(t, -9), ts: Date.now(), by: USER.id, title: 'Check the files of Nkwazi', staff: [], teams: ['Nkwazi'], due: addDays(t, -8) }); const k = S.children.find(c => isCurrent(c) && attIn(c, 'Nkwazi', 'All')); S.attendance[t] = S.attendance[t] || {}; S.attendance[t][attKey(k, 'Nkwazi')] = 'P'; save(); render(); });
    await p.waitForTimeout(400);
    console.log(name, 'title', await p.evaluate(() => document.querySelector('h1').innerText), '| tiles', await p.evaluate(() => [...document.querySelectorAll('.otile')].map(x => x.innerText.replace(/\s+/g, ' '))));
    console.log(name, 'registers', await p.evaluate(() => [...document.querySelectorAll('.otab')[0].querySelectorAll('tbody tr')].map(r => r.innerText.replace(/\s+/g, ' ').trim())));
    console.log(name, 'queue', await p.evaluate(() => [document.querySelectorAll('.oq').length, document.querySelector('.oq') && document.querySelector('.oq').innerText.replace(/\s+/g, ' ')]));
    console.log(name, 'month', await p.evaluate(() => [...document.querySelectorAll('.omonth')].map(r => r.innerText.replace(/\s+/g, ' ').trim())));
    console.log(name, 'week', await p.evaluate(() => [...document.querySelectorAll('.oday')].map(r => r.innerText.replace(/\s+/g, ' ').trim())), '| late banner', await p.evaluate(() => (document.querySelector('.cyp-banner--danger') || {}).innerText));
    console.log(name, 'people', await p.evaluate(() => [...document.querySelectorAll('.otab')[1].querySelectorAll('tbody tr')].slice(0, 4).map(r => r.innerText.replace(/\s+/g, ' ').trim())));
    console.log(name, 'fits', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '| small targets', await p.evaluate(() => [...document.querySelectorAll('.main a[href], .main button')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.height < 40); }).map(e => e.innerText.trim().slice(0, 20) + ' ' + Math.round(e.getBoundingClientRect().height))));
    // links of the page lead somewhere
    const hrefs = await p.evaluate(() => uniq([...document.querySelectorAll('.main a[href^="#/"]')].map(a => a.getAttribute('href'))));
    for (const h of hrefs) { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(250); const t = await p.evaluate(() => (document.querySelector('h1') || {}).innerText); if (!t || /^Education office$/.test(t)) console.log(name, 'LINK back to office or empty:', h, t); }
    console.log(name, 'links checked', hrefs.length);
    await as('Admin', '#/home?v=centres'); console.log(name, 'centres view', await p.evaluate(() => document.querySelector('h1').innerText));
    await as('Nkwazi', '#/home'); console.log(name, 'educator home', await p.evaluate(() => document.querySelector('h1').innerText), await p.evaluate(() => !!document.querySelector('.otiles')));
    await as('Admin', '#/home'); await p.screenshot({ path: '/home/claude/mob/office-' + name + '.png', fullPage: true });
    await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
