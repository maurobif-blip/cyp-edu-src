/* inventory of every main page: how many controls, how many repeated links, how long. Demo build: invented children only. */
const { chromium } = require('playwright'); const fs = require('fs');
const SP = '/tmp/cyp-shots/rev2/'; fs.mkdirSync(SP, { recursive: true });
const PAGES = ['#/home', '#/todo', '#/attendance', '#/attendance?c=Luigi', '#/attendance?c=Nkwazi', '#/visits', '#/visits?team=Family', '#/visits?team=School', '#/visits?team=Family&tab=need', '#/visits?team=Family&tab=plan', '#/visits?team=Family&tab=open', '#/visits?team=Family&tab=validate', '#/children', '#/school', '#/schoolvisit', '#/moves', '#/counseling', '#/reports', '#/monthly', '#/activities', '#/referrals', '#/more', '#/sync', '#/help', '#/staff', '#/logframe'];
(async () => {
  const b = await chromium.launch(); const out = [];
  for (const [who, w] of [['Clement', 1440], ['Clement', 393], ['Bernard', 393], ['Merabe', 393], ['Cristoph', 393]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w > 500 ? 900 : 800 }, isMobile: w < 500, hasTouch: w < 500 }); const p = await ctx.newPage(); p.on('dialog', d => d.accept());
    await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
    const tile = await p.$(`.stile:has-text("${who}")`); if (!tile) { console.log('no user', who, await p.evaluate(() => [...document.querySelectorAll('.stile')].map(x => x.innerText.split('\n')[0]).slice(0, 50).join(' | '))); await ctx.close(); continue; }
    await tile.click(); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', await p.evaluate(() => pinValue())); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400); }
    await p.evaluate(() => { const t = document.getElementById('tour'); if (t) t.remove(); try { lsSet('cyp-tour-done', '1'); } catch (e) {} });
    const kid = await p.evaluate(() => { const c = S.children.find(c => isCurrent(c) && centreOf(c) === 'Minsundu' && (c.terms || []).length) || S.children.find(c => isCurrent(c) && centreOf(c) === 'Minsundu'); return c.id; });
    for (const h of PAGES.concat(['#/child/' + kid, '#/pupil/' + kid])) {
      await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(350);
      const r = await p.evaluate(() => { const m = document.querySelector('main') || document.body; const vis = e => e.offsetParent !== null && !e.closest('details:not([open])');
        const ctr = [...m.querySelectorAll('a[href], button, select, input, summary, [data-q], [data-act]')].filter(vis); const hrefs = {}; [...m.querySelectorAll('a[href]')].filter(vis).forEach(a => { const k = a.getAttribute('href'); hrefs[k] = (hrefs[k] || 0) + 1; });
        const dup = Object.entries(hrefs).filter(([k, n]) => n > 1 && !/child\/|pupil\/|visitrep/.test(k)).map(([k, n]) => k + '×' + n);
        return { route: route().path, h1: (m.querySelector('h1') || {}).innerText, ctr: ctr.length, btn: ctr.filter(e => e.matches('button, a.btn, .btn')).length, cards: m.querySelectorAll('section.card, .card').length, closed: m.querySelectorAll('details:not([open])').length, words: m.innerText.split(/\s+/).length, screens: +(document.documentElement.scrollHeight / innerHeight).toFixed(1), dup }; });
      out.push({ who, w, h, ...r });
      if ((who === 'Clement' && w === 1440) || (w === 393 && ['#/home', '#/visits', '#/visits?team=Family', '#/more', '#/school', '#/attendance'].includes(h)) || (who === 'Bernard' && /child\//.test(h))) await p.screenshot({ path: SP + who + '-' + w + '-' + h.replace(/[^a-z0-9]+/gi, '_') + '.png', fullPage: w < 500 ? false : false });
    }
    await ctx.close();
  }
  fs.writeFileSync(SP + 'inventory.json', JSON.stringify(out));
  for (const r of out) console.log([r.who.slice(0, 4), r.w, r.h.padEnd(34), 'ctrl', String(r.ctr).padStart(3), 'btn', String(r.btn).padStart(3), 'cards', String(r.cards).padStart(2), 'words', String(r.words).padStart(4), 'scr', r.screens, r.dup.join(' ')].join(' '));
  await b.close();
})();
