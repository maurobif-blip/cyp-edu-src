const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const pack = JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'));
  const PAGES = ['#/home', '#/pending', '#/children', '#/children?section=Luigi', '#/attendance?c=Nkwazi', '#/attendance?c=Minsundu&g=UCC', '#/attendance?c=Minsundu&g=UCC&av=day', '#/attendance?c=Minsundu&g=UCC&av=month', '#/attendance?c=Luigi', '#/visits', '#/visits?vtab=need', '#/visits?vtab=plan', '#/visits?vtab=actions', '#/visits?vtab=check', '#/visit/new?t=Family', '#/visit/new?t=School', '#/counseling', '#/reports', '#/reports?s=Family', '#/reports?s=School', '#/reports?s=UCC', '#/reports?s=Luigi', '#/school', '#/referrals', '#/referrals/new', '#/monthly', '#/paths', '#/activities', '#/logframe', '#/staff', '#/staff/data', '#/review', '#/feedback', '#/more', '#/sync', '#/help', '#/child/new'];
  const out = { contrast: {}, targets: {}, text: {}, struct: [] };
  for (const vw of [393, 1440]) {
    const p = await (await b.newContext({ viewport: { width: vw, height: vw < 500 ? 800 : 900 } })).newPage(); p.on('dialog', x => x.dismiss());
    await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(600);
    if (vw === 393) out.login = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300) }));
    await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(300);
    await p.evaluate(pk => { importStarterPack(pk); const c = S.children.find(c => isCurrent(c) && needsVisits(c)); const bn = S.staff.find(s => s.name.includes('Bernard')).id; S.visits.push({ id: uid('v'), childId: c.id, team: 'Family', date: today(), purpose: 'Follow-up', where: 'Home', by: bn, successful: 'Yes', findings: 'x', action: 'y', recordedBy: bn, recordedOn: today() }); referAdd(c.id, 'Sports', 'Family', 'Home visit suggested', 'note'); save(); window.__kid = c.id; }, pack); await p.waitForTimeout(400);
    const kid = await p.evaluate(() => window.__kid); const vid = await p.evaluate(() => S.visits[S.visits.length - 1].id);
    for (const h of PAGES.concat(['#/child/' + kid, '#/child/' + kid + '/edit', '#/child/' + kid + '/status', '#/child/' + kid + '/term', '#/visitrep/' + vid])) {
      await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(200);
      const r = await p.evaluate(() => {
        const lum = c => { const a = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
        const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
        const bgOf = el => { let e = el; while (e) { const x = parse(getComputedStyle(e).backgroundColor); if (x && x.a > 0.95) return x.c; e = e.parentElement; } return [255, 255, 255]; };
        const fails = {}, small = {};
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
          if (own) { const fg = parse(cs.color); if (fg && fg.a > 0.9) { const bg = bgOf(el), L1 = lum(fg.c), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05), fs = parseFloat(cs.fontSize), big = fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700); if (ratio < (big ? 3 : 4.5)) { const k = 'rgb(' + fg.c + ') on rgb(' + bg + ') = ' + ratio.toFixed(2) + ' · ' + el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ').slice(0, 2).join('.') + ' "' + el.innerText.trim().slice(0, 22) + '"'; fails[k] = (fails[k] || 0) + 1; } } }
          if (innerWidth < 500 && el.matches('a.btn, button, select, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), .seg a, summary, a[data-q]') && (r.height < 40 || r.width < 40)) { const k = el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ').slice(0, 3).join('.') + ' "' + (el.innerText || el.placeholder || el.getAttribute('aria-label') || '').trim().slice(0, 18) + '" ' + Math.round(r.width) + 'x' + Math.round(r.height); small[k] = (small[k] || 0) + 1; }
        }
        const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map(x => x.tagName[1]).join('');
        return { fails, small, hs, h1: document.querySelectorAll('h1').length, landmarks: ['main', 'nav', 'header', 'footer'].filter(t => document.querySelector(t)).join(','), unlabeled: [...document.querySelectorAll('main input:not([type=hidden]):not([type=checkbox]):not([type=radio]), main select, main textarea')].filter(e => !e.closest('label') && !e.getAttribute('aria-label') && !(e.id && document.querySelector('label[for="' + e.id + '"]'))).map(e => (e.name || e.id || e.placeholder || e.type)).join(','), text: document.querySelector('main') ? document.querySelector('main').innerText : document.body.innerText };
      });
      for (const [k, n] of Object.entries(r.fails)) { const kk = k.replace(/ "[^"]*"$/, ''); out.contrast[kk] = out.contrast[kk] || { n: 0, ex: k.match(/"([^"]*)"$/)[1], pages: new Set() }; out.contrast[kk].n += n; out.contrast[kk].pages.add(h.split('?')[0]); }
      for (const [k, n] of Object.entries(r.small)) { const kk = k.replace(/ "[^"]*"/, ''); out.targets[kk] = out.targets[kk] || { n: 0, ex: (k.match(/"([^"]*)"/) || [0, ''])[1], pages: new Set() }; out.targets[kk].n += n; out.targets[kk].pages.add(h.split('?')[0]); }
      if (vw === 393) { out.struct.push([h.replace(kid, 'ID').replace(vid, 'V'), 'h:' + r.hs.slice(0, 14), 'h1:' + r.h1, r.landmarks, r.unlabeled ? 'unlabeled: ' + r.unlabeled : ''].join(' | ')); out.text[h.replace(kid, 'ID').replace(vid, 'V')] = r.text; }
    }
    await p.context().close();
  }
  const fmt = o => Object.entries(o).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => v.n + '× ' + k + ' e.g. "' + v.ex + '" [' + [...v.pages].slice(0, 4).join(' ') + ']');
  console.log('LOGIN', JSON.stringify(out.login)); console.log('\n== CONTRAST FAILS'); fmt(out.contrast).slice(0, 40).forEach(x => console.log(x.slice(0, 230)));
  console.log('\n== SMALL TARGETS (phone, under 40px)'); fmt(out.targets).slice(0, 40).forEach(x => console.log(x.slice(0, 200)));
  console.log('\n== STRUCTURE'); out.struct.forEach(x => console.log(x));
  fs.writeFileSync('/tmp/cyp-shots/alltext.json', JSON.stringify(out.text));
  await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 500)); process.exit(1); });
