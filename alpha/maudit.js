// phone audit: screenshots of the main pages for different people, and a count of small targets and small text
const { chromium } = require('playwright'); const fs = require('fs'); const OUT = process.argv[2] || '/home/claude/mob/a/'; fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.argv[3] || 360), H = Number(process.argv[4] || 740);
(async () => { const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  const who = await p.evaluate(() => { const pick = f => (S.staff.find(s => s.active !== false && !s.admin && mainFlag(s) === f) || {}).name; return { Counseling: pick('Counseling'), Nkwazi: pick('Nkwazi'), Family: pick('Family'), School: pick('School'), Sports: pick('Sports'), Minsundu: pick('Minsundu'), Luigi: pick('Luigi'), Admin: (S.staff.find(s => s.admin) || {}).name }; });
  const login = async name => { await p.evaluate(n => { USER = S.staff.find(s => s.name === n); location.hash = '#/home'; render(); }, name); await p.waitForTimeout(300); };
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(450); };
  const measure = () => p.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const T = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], label:has(input[type=checkbox]), label:has(input[type=radio])')].filter(vis).filter(el => !el.closest('.demobar') && !el.closest('.tour-layer'));
    const small = T.map(el => { const r = el.getBoundingClientRect(); return { t: (el.innerText || el.getAttribute('aria-label') || el.name || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 28), w: Math.round(r.width), h: Math.round(r.height), tag: el.tagName, cls: el.className && String(el.className).slice(0, 24), inline: getComputedStyle(el).display === 'inline' }; }).filter(x => x.h < 44 || x.w < 44);
    const texts = []; const walker = document.createTreeWalker(document.querySelector('.main') || document.body, NodeFilter.SHOW_TEXT); let n; const seen = {};
    while ((n = walker.nextNode())) { const s = n.nodeValue.trim(); if (!s) continue; const el = n.parentElement; if (!vis(el)) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 14) { const k = el.tagName + '.' + String(el.className).split(' ')[0] + ' ' + fs; seen[k] = (seen[k] || 0) + 1; } }
    const de = document.documentElement;
    return { targets: T.length, small: small.length, smallNotInline: small.filter(x => !x.inline).length, ex: small.filter(x => !x.inline).slice(0, 12), smallText: seen, overflow: de.scrollWidth > de.clientWidth + 1, pageH: de.scrollHeight, screens: +(de.scrollHeight / innerHeight).toFixed(1) };
  });
  const rep = {};
  const shot = async (name, full) => { await p.screenshot({ path: OUT + name + '.png', fullPage: !!full }); rep[name] = await measure(); };
  console.log('who', who);
  // bottom bar per person
  for (const [k, n] of Object.entries(who)) { if (!n) continue; await login(n); const bar = await p.evaluate(() => [...document.querySelectorAll('.mnav a')].map(a => a.innerText.replace(/\s+/g, ' ').trim() + (a.scrollWidth > a.clientWidth ? '!' : ''))); console.log('bar', k, n.split(' ')[0], bar.join(' | ')); await shot('home-' + k); }
  await login(who.Nkwazi);
  for (const [n, h] of [['attendance', '#/attendance'], ['children', '#/children'], ['visits', '#/visits'], ['more', '#/more'], ['tasks', '#/tasks'], ['reports', '#/reports']]) { await go(h); await shot('nk-' + n); }
  const kid = await p.evaluate(() => S.children.find(c => centreOf(c) === 'Nkwazi' && c.status !== 'Closed').id); await go('#/child/' + kid); await shot('nk-child'); await p.screenshot({ path: OUT + 'nk-child-full.png', fullPage: true });
  await go('#/visit'); await shot('nk-visitform');
  await login(who.Counseling);
  for (const [n, h] of [['counseling', '#/counseling'], ['cform', '#/counseling/new?type=Individual'], ['cweek', '#/counseling?cv=week'], ['cmonth', '#/counseling?cv=month'], ['more', '#/more']]) { await go(h); await shot('co-' + n); }
  await login(who.Admin); for (const [n, h] of [['pending', '#/pending'], ['staff', '#/staff']]) { await go(h); await shot('ad-' + n); }
  fs.writeFileSync(OUT + 'report.json', JSON.stringify(rep, null, 1));
  for (const [k, v] of Object.entries(rep)) console.log(k.padEnd(16), 'targets', String(v.targets).padStart(3), 'small', String(v.smallNotInline).padStart(3), 'screens', v.screens, v.overflow ? 'OVERFLOW' : '', JSON.stringify(v.smallText));
  console.log('errors', errs); await b.close(); })();
