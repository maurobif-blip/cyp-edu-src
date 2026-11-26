const { chromium } = require('playwright'); const SP = '/tmp/cyp-shots/';
const PIN = require('fs').readFileSync('/home/claude/alpha/t72.js', 'utf8').match(/#pinin', '(\d+)'/)[1];
async function run(b, when, tag) {
  const errs = []; const cx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await cx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', x => x.accept());
  await p.clock.install({ time: new Date(when) });
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.clock.runFor(900); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', PIN); await p.click('form[data-form=pinlogin] button.pri'); await p.clock.runFor(500);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.clock.runFor(500); };
  const out = await p.evaluate(pk => { importStarterPack(pk);
    const names = ['Chifubu Sec', 'chifubu secondary', 'Kansenshi Prisons', 'KANSENSHI SPECIAL SCH', 'Cicetekelo Com', 'Eloihm Primary', 'Northrise'];
    const ks = S.children.filter(c => isCurrent(c)).slice(0, 7); ks.forEach((c, i) => { c.schoolType = i === 4 ? 'Nkwazi community school' : i < 3 ? 'GRZ secondary' : 'GRZ primary'; c.schoolName = names[i]; c.alsoAt = c.alsoAt; });
    const d = today(), y = d.slice(0, 4), bn = S.staff[0].id;
    S.visits.push({ id: 'sv1', childId: ks[0].id, team: 'School', date: d, purpose: 'School visit', where: 'School', by: bn, successful: 'Yes', recordedBy: bn, recordedOn: d });
    S.visits.push({ id: 'sv2', childId: ks[2].id, team: 'School', date: y + '-06-10', purpose: 'School visit', where: 'School', by: bn, successful: 'Yes', recordedBy: bn, recordedOn: y + '-06-10' });
    save(); return { today: d, now: termNow(), next: termNext(termNow()), left: schoolsLeft(termNow()), norm: names.map(schoolNorm), listHas: ['Twatasha Primary', 'NORTEC', 'Chifubu Secondary'].map(n => schoolNames().includes(n)), nNames: schoolNames().length,
      ranges: [1, 2, 3].map(t => termRange(2026, t).join('..')), of: ['2026-03-31', '2026-04-02', '2026-08-15', '2026-09-01', '2026-12-03'].map(x => termOf(x) + (termHoliday(x) ? 'h' : '')) }; }, require('/home/claude/reports/pack-v3-nophotos.json'));
  console.log(tag, JSON.stringify(out));
  await go('#/school'); console.log(tag, 'page', await p.evaluate(() => ({ h1: document.querySelector('h1').innerText, lead: document.querySelector('.top .lead').innerText, tiles: [...document.querySelectorAll('.tile')].map(t => t.innerText.replace(/\s+/g, ' ')), terms: [...document.querySelectorAll('select[data-filter=tm] option')].map(o => o.textContent).slice(0, 3), heads: [...document.querySelectorAll('.schcard h2')].map(h => h.innerText.replace(/\s+/g, ' ')), plan: (document.querySelector('.schcard [data-sact=planschool]') || {}).innerText, fits: document.documentElement.scrollWidth <= innerWidth + 1 })));
  await p.screenshot({ path: SP + 'school-' + tag + '.png' });
  await go('#/school?show=nosch'); console.log(tag, 'nosch', await p.evaluate(() => [...document.querySelectorAll('.schcard h2')].map(h => h.innerText.replace(/\s+/g, ' '))));
  await go('#/school?tm=2026-2'); console.log(tag, 'term 2', await p.evaluate(() => [document.querySelector('.top .lead').innerText, ...[...document.querySelectorAll('.schcard h2')].map(h => h.innerText.replace(/\s+/g, ' '))]));
  await go('#/home'); console.log(tag, 'todoData', await p.evaluate(() => { const o = overviewData(), cs = o.cards || o; const c = cs.find(x => x.k === 'School'); return c.lines.filter(l => /schools/.test(l.text)).map(l => l.n + ' ' + l.text + ' [' + l.lvl + '] ' + l.href); })); console.log(tag, 'todo', await p.evaluate(() => [...document.querySelectorAll('a')].filter(x => /schools not visited/.test(x.innerText)).map(x => x.innerText.replace(/\s+/g, ' ') + ' -> ' + (x.getAttribute('href') || (x.querySelector('a') || { getAttribute() { } }).getAttribute('href') || '')).slice(0, 2)));
  const kid = await p.evaluate(() => S.children.filter(c => isCurrent(c))[1].id);
  await go('#/child/' + kid + '/term'); console.log(tag, 'term form', await p.evaluate(() => [...document.querySelectorAll('select[name=t] option')].map(o => o.textContent + (o.selected ? '*' : ''))));
  await go('#/child/' + kid); console.log(tag, 'school box', await p.evaluate(() => { const b = document.querySelector('#schoolbox'); return b ? [...b.querySelectorAll('dt')].map(d => d.innerText + ': ' + d.nextElementSibling.innerText).filter(x => /Term|School:/.test(x)) : 'none'; }));
  await p.setViewportSize({ width: 393, height: 850 }); await go('#/school'); console.log(tag, 'phone fits', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.screenshot({ path: SP + 'school-phone-' + tag + '.png' });
  console.log(tag, 'errors', errs); await cx.close();
}
(async () => { const b = await chromium.launch(); await run(b, '2026-11-18T09:00:00', 'nov'); await run(b, '2026-12-05T09:00:00', 'dec'); await run(b, '2027-01-12T09:00:00', 'jan'); await b.close(); })().catch(e => { console.error('FAIL', e.message.slice(0, 600)); process.exit(1); });
