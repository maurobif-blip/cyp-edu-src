// alpha 5.29: counselling forms, weekly / monthly / quarterly report, Word files on the letterhead, no double counting
const { chromium } = require('playwright'); const fs = require('fs'); const OUT = '/home/claude/counsel/out/'; fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  const login = async who => { await p.evaluate(() => { if (typeof USER !== 'undefined' && USER) { USER = null; render(); } }); await p.waitForTimeout(200); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', await p.evaluate(() => pinValue())); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(500); } await p.addStyleTag({ content: '.demobar{display:none!important}' }); };
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(500); };
  const dl = async (sel, name) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(sel)]); const f = OUT + name; await d.saveAs(f); return d.suggestedFilename(); };
  await login('Chippo');
  // start clean: the demo has its own sessions; keep them out of this month
  const info = await p.evaluate(() => { const m = thisMonth(), { a, b } = monthCtx(m); S.sessions = S.sessions.filter(s => !inRange(s.date, a, b)); save(); const k = c => c.status !== 'Closed'; const mi = S.children.filter(c => k(c) && centreOf(c) === 'Minsundu' && c.sex === 'M').slice(0, 3).map(c => c.id), nk = S.children.filter(c => k(c) && centreOf(c) === 'Nkwazi' && c.sex === 'F').slice(0, 2).map(c => c.id); return { mi, nk, today: today() }; });
  await go('#/counseling'); console.log('1 page', await p.evaluate(() => [[...document.querySelectorAll('.ctabs a')].map(x => x.innerText), [...document.querySelectorAll('.cnew a')].map(x => x.innerText.replace(/\s+/g, ' '))]));
  // individual session (Form 1A)
  await p.click('.cnew a:has-text("Individual")'); await p.waitForTimeout(400);
  console.log('2 form 1A fields', await p.evaluate(() => [...document.querySelectorAll('form[data-form=session] .f > span, form[data-form=session] label > span')].map(x => x.innerText.trim()).filter(Boolean)));
  const fill = async (kid, o) => { if (kid) await p.evaluate(id => { document.querySelector('form[data-form=session] .cpick input[type=hidden]').value = id; }, kid); for (const [k, v] of Object.entries(o)) { const el = await p.$(`form[data-form=session] [name=${k}]`); const tag = await el.evaluate(e => e.tagName); if (tag === 'SELECT') await el.selectOption(v); else await el.fill(v); } await p.click('form[data-form=session] button.pri'); await p.waitForTimeout(500); };
  await fill(info.mi[0], { centre: 'Minsundu', topic: 'Anger, bottled up feelings', strengths: 'Willing to change', summary: 'Goals of the child: to control anger.\nGoals of the counsellor: weekly follow-up.', conclusion: 'Second session next week.', action: 'Meet the key worker', budget: '20' });
  console.log('2 saved, session page', await p.evaluate(() => [location.hash.slice(0, 10), [...document.querySelectorAll('.sessdl dt')].map(x => x.innerText).join(' | ')]));
  console.log('2 word', await dl('[data-cact=sessword]', 'form1a.docx'));
  // the same boy again individually (second session) and in a group at Minsundu; the same boy also at Nkwazi in a group
  await go('#/counseling/new?type=Individual'); await fill(info.mi[0], { centre: 'Minsundu', topic: 'Follow-up on anger' });
  console.log('3 second session number', await p.evaluate(() => [...document.querySelectorAll('.sessdl dt')].map((d, i) => d.innerText === 'Session number' ? document.querySelectorAll('.sessdl dd')[i].innerText : '').join('')));
  await go('#/counseling/new?type=Group'); await p.selectOption('form[data-form=session] [name=centre]', 'Minsundu'); await p.waitForTimeout(300);
  await p.evaluate(ids => { UI.sessKids = new Set(ids.map(String)); sessGroupDraw(); }, info.mi);
  console.log('3 group picker', await p.evaluate(() => document.querySelector('#sessgroup').innerText.slice(0, 60).replace(/\s+/g, ' ')));
  await fill(null, { topic: 'Peer pressure', period: '10:00 - 11:00', place: 'Dining hall', others: '4', summary: 'We talked about peer pressure.' });
  await go('#/counseling/new?type=Group'); await p.selectOption('form[data-form=session] [name=centre]', 'Nkwazi'); await p.evaluate(ids => { UI.sessKids = new Set(ids.map(String)); sessGroupDraw(); }, info.nk.concat([info.mi[0]])); await fill(null, { topic: 'Teen pregnancies' });
  console.log('3 word group', await dl('[data-cact=sessword]', 'form5.docx'));
  await go('#/counseling/new?type=Family'); await fill(info.nk[0], { centre: 'Nkwazi', relative: 'Mrs Banda', relation: 'Aunt', topic: 'School attendance', referred: 'DEC' });
  console.log('3 word family', await dl('[data-cact=sessword]', 'form6.docx'));
  // monthly report
  await go('#/reports?s=Counseling&cv=month');
  console.log('4 PSC', await p.evaluate(() => [...document.querySelectorAll('#rtable tbody tr')].map(r => [...r.cells].map(c => c.innerText.trim()).join(' | '))));
  console.log('4 double counting', await p.evaluate(() => document.querySelectorAll('section.card')[1].innerText.replace(/\s+/g, ' ')));
  console.log('4 by centre', await p.evaluate(() => [...[...document.querySelectorAll('section.card')].find(x => /issues tackled/i.test(x.innerText)).querySelectorAll('tr')].map(r => [...r.cells].map(c => c.innerText.trim()).join(' | '))));
  console.log('4 word monthly', await dl('[data-cact=periodword]', 'monthly.docx'));
  await go('#/reports?s=Counseling&cv=quarter'); console.log('5 quarterly', await p.evaluate(() => document.querySelector('.lead').innerText), await dl('[data-cact=periodword]', 'quarterly.docx'));
  // weekly
  await go('#/reports?s=Counseling&cv=week'); console.log('6 weekly rows', await p.evaluate(() => [...document.querySelectorAll('table.cweek tbody tr')].map(r => [...r.cells].map(c => c.innerText.trim().slice(0, 50)).join(' | '))));
  console.log('6 by centre', await p.evaluate(() => [...document.querySelectorAll('section.card')[1].querySelectorAll('tr')].map(r => [...r.cells].map(c => c.innerText.trim()).join(' | '))));
  await p.fill('form[data-form=counselweek] textarea', 'A calm week. Two follow-ups planned.'); await p.click('form[data-form=counselweek] button.was-pri, form[data-form=counselweek] button.pri'); await p.waitForTimeout(400);
  console.log('6 summary kept', await p.evaluate(() => document.querySelector('form[data-form=counselweek] textarea').value)); console.log('6 word weekly', await dl('[data-cact=weekword]', 'weekly.docx'));
  // Reports page: Counselling, Nkwazi, UCC, Luigi take the same counts; Word of a section on the letterhead
  await go('#/reports?s=Counseling'); console.log('7 reports page', await p.evaluate(() => [...document.querySelectorAll('#rtable tbody tr')].slice(0, 2).map(r => r.innerText.replace(/\s+/g, ' ').trim())));
  console.log('7 word from Reports', await dl('[data-cact=periodword]', 'reports-counselling.docx'));
  for (const k of ['Nkwazi', 'UCC', 'Luigi']) { await go('#/reports?s=' + k); console.log('7', k, await p.evaluate(() => [...document.querySelectorAll('.main tr')].map(r => r.innerText.replace(/\s+/g, ' ').trim()).filter(t => /ounsel/.test(t)).slice(0, 3))); }
  await go('#/reports?s=Nkwazi'); console.log('7 word Nkwazi', await dl('[data-act=wordreport]', 'nkwazi.docx'));
  await go('#/reports?s=Luigi'); console.log('7 word Luigi', await dl('[data-act=wordreport]', 'luigi.docx'));
  // who must not read: Pippen (Sports)
  const sid = await p.evaluate(() => S.sessions[S.sessions.length - 1].id);
  await login('Pippen'); await go('#/counseling'); console.log('8 Pippen list', await p.evaluate(() => [...document.querySelectorAll('.it .w span')].map(x => x.innerText.slice(0, 44)).slice(0, 2)));
  await go('#/session/' + sid); console.log('8 Pippen session', await p.evaluate(() => document.querySelector('section.card').innerText.trim().slice(0, 60)));
  await go('#/reports?s=Counseling&cv=month'); console.log('8 Pippen issues', await p.evaluate(() => [...[...document.querySelectorAll('section.card')].find(x => /issues tackled/i.test(x.innerText)).querySelectorAll('tr')].map(r => r.cells[6].innerText.trim())));
  // phone
  const c2 = await b.newContext({ viewport: { width: 393, height: 800 }, isMobile: true, hasTouch: true }); const q = await c2.newPage(); q.on('pageerror', e => errs.push(String(e)));
  await q.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await q.waitForTimeout(1200); await q.click('.stile:has-text("Chippo")'); await q.waitForTimeout(300); if (await q.$('#pinin')) { await q.fill('#pinin', await q.evaluate(() => pinValue())); await q.click('form[data-form=pinlogin] button.pri'); await q.waitForTimeout(500); }
  for (const h of ['#/counseling', '#/counseling/new?type=Individual', '#/counseling/new?type=Group', '#/reports?s=Counseling&cv=week', '#/reports?s=Counseling&cv=month']) { await q.evaluate(x => location.hash = x, h); await q.waitForTimeout(500); console.log('9 phone', h, 'fits', await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
  await q.evaluate(x => location.hash = x, '#/counseling/new?type=Individual'); await q.waitForTimeout(400); await q.screenshot({ path: OUT + 'phone-form.png', fullPage: true });
  console.log('errors', errs); await b.close(); })();
