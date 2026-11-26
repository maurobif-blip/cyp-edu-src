const { chromium } = require('playwright'); const fs = require('fs');
const ROUTES = ['home','pending','children','child','visit','visits','attendance','outreach','counseling','reports','staff','help','more','sync','feedback','activities','logframe','visitrep','school','referrals','monthly','review','paths','schoolvisit','pupil'];
(async () => {
  const b = await chromium.launch(); const out = [];
  const WHO = process.argv[2] ? process.argv[2].split(',') : ['Clement', 'Bernard', 'Merabe', 'Chisha', 'Lewis', 'Bwalya'];
  for (const vw of [393, 1440]) for (const who of WHO) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vw < 500 ? 800 : 1000 } }); const p = await ctx.newPage(); let errs = [];
    p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errs.push('console ' + m.text().slice(0, 160)); }); p.on('dialog', x => x.dismiss());
    await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700);
    await p.click('.stile:has-text("Clement")'); await p.waitForTimeout(150); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400);
    await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(600);
    const u = await p.evaluate(w => { const s = S.staff.find(s => s.name.includes(w) && s.active !== false); if (!s) return null; USER = s; render(); return [s.name, s.role || '', !!s.admin, typeof myTeam === 'function' ? myTeam() : '', typeof myCentre === 'function' ? myCentre() : '']; }, who);
    if (!u) { out.push({ who, vw, fatal: 'no such staff' }); continue; }
    const seen = new Set(), queue = ['#/home'], cnt = {}; let pages = 0; const prob = [];
    const key = h => { const [pa, qs] = h.slice(2).split('?'); const parts = pa.split('/'); const q = new URLSearchParams(qs || ''); for (const k of ['m', 'd', 'q', 'vq', 'vf', 'all', 'lall']) q.delete(k); return parts[0] + (parts[1] ? '/' + (parts[0] === 'child' || parts[0] === 'visitrep' ? '*' : parts[1]) : '') + (parts[2] ? '/' + parts[2] : '') + '?' + [...q.keys()].sort().map(k => k + '=' + q.get(k)).join('&'); };
    while (queue.length && pages < 260) {
      const h = queue.shift(); const k = key(h); const base = k.split('?')[0]; cnt[k] = (cnt[k] || 0) + 1; if (cnt[k] > (base.startsWith('child/*') || base.startsWith('visitrep') ? 3 : 1)) continue; if (seen.has(h)) continue; seen.add(h); pages++;
      errs = []; await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(230);
      const r = await p.evaluate(ROUTES => {
        const main = document.querySelector('main') || document.body, txt = main.innerText || '';
        const bad = (txt.match(/undefined|NaN|\[object Object\]|Invalid Date|null\b/g) || []).slice(0, 4);
        const links = [...document.querySelectorAll('a[href^="#/"]')].map(a => a.getAttribute('href'));
        const dead = links.filter(l => { const pa = l.slice(2).split('?')[0].split('/'); if (pa[0] && !ROUTES.includes(pa[0])) return true; if (pa[0] === 'child' && pa[1] && pa[1] !== 'new' && !child(pa[1])) return true; return false; });
        const small = [...main.querySelectorAll('a.btn, button, select, input:not([type=hidden])')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 36) && innerWidth < 500; }).length;
        const tiny = [...main.querySelectorAll('*')].filter(e => e.children.length === 0 && (e.innerText || '').trim().length > 3 && parseFloat(getComputedStyle(e).fontSize) < 12 && e.getBoundingClientRect().width > 0).length;
        return { h1: (document.querySelector('h1') || {}).innerText || '', warn: !!document.querySelector('.warn') && /Something went wrong/.test(txt) ? txt.slice(0, 200) : '', over: document.documentElement.scrollWidth - innerWidth, bad, links: [...new Set(links)], dead: [...new Set(dead)], len: txt.trim().length, small, tiny, nolabel: [...main.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')].filter(e => !e.closest('label') && !e.getAttribute('aria-label') && !(e.id && document.querySelector('label[for="' + e.id + '"]'))).length, imgNoAlt: [...main.querySelectorAll('img:not([alt])')].length };
      }, ROUTES);
      const pr = []; if (errs.length) pr.push(errs.join(' | ')); if (r.warn) pr.push('WARN ' + r.warn); if (r.over > 1) pr.push('overflow ' + r.over); if (r.bad.length) pr.push('text ' + r.bad.join(',')); if (r.dead.length) pr.push('dead ' + r.dead.slice(0, 4).join(' ')); if (!r.h1) pr.push('no h1'); if (r.len < 60) pr.push('nearly empty ' + r.len); if (r.small) pr.push('small targets ' + r.small); if (r.tiny) pr.push('tiny text ' + r.tiny); if (r.nolabel) pr.push('fields without label ' + r.nolabel);
      if (pr.length) prob.push(h + ' :: ' + pr.join(' ; '));
      for (const l of r.links) if (!seen.has(l)) queue.push(l);
    }
    out.push({ who: u, vw, pages, left: queue.length, prob });
    await ctx.close();
  }
  for (const o of out) { console.log('\n###', JSON.stringify(o.who), 'width', o.vw, 'pages', o.pages, 'queue left', o.left, 'problems', (o.prob || []).length); for (const x of (o.prob || [])) console.log('  ', x.slice(0, 330)); }
  await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 500)); process.exit(1); });
