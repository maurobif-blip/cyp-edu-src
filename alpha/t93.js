// beta 1.4: group activities (workshops, parents meetings, Girl Child Program, school materials)
const { chromium } = require('playwright'); const OUT = '/tmp/cyp-shots/';
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [w, tag] of [[393, 'ph'], [1280, 'pc']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 820 }, isMobile: w < 900, hasTouch: w < 900, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + String(e))); p.on('dialog', d => d.accept());
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200);
  const login = async who => { await p.evaluate(() => { if (typeof USER !== 'undefined' && USER) { USER = null; render(); } }); await p.waitForTimeout(200); await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', await p.evaluate(() => pinValue())); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(500); } await p.addStyleTag({ content: '.demobar{display:none!important}' }); };
  const go = async h => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(500); };
  const fits = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  const toast = () => p.evaluate(() => { const L = [...document.querySelectorAll('.toast')]; const t = L.map(x => x.innerText).pop() || ''; L.forEach(x => x.remove()); return t; });
  const m = await p.evaluate(() => thisMonth());
  await login('Lewis'); await go('#/more'); console.log(tag, '1 More has it:', await p.locator('a.mitem[href="#/groups"]').count());
  await go('#/groups/new'); console.log(tag, '  form section default:', await p.evaluate(() => document.querySelector('form[data-form=group] [name=section]').value), '| names listed:', await p.locator('[data-pkid]').count(), '| fits', await fits());
  await p.selectOption('form[data-form=group] [name=kind]', 'Workshop'); await p.fill('form[data-form=group] [name=topic]', 'Behaviour change');
  const ids = await p.evaluate(() => [...document.querySelectorAll('[data-pkid]')].slice(0, 3).map(x => x.dataset.pkid));
  for (const id of ids) await p.click(`[data-pkid="${id}"]`);
  await p.fill('#pickq-grp', await p.evaluate(() => fullName(S.children.find(c => c.section === 'Nkwazi' && isCurrent(c))).split(' ')[0])); await p.waitForTimeout(200);
  const extra = await p.evaluate(() => { const x = [...document.querySelectorAll('[data-pkid]')].find(i => child(i.dataset.pkid).section === 'Nkwazi'); return x ? x.dataset.pkid : null; }); if (extra) await p.click(`[data-pkid="${extra}"]`);
  console.log(tag, '  ticked after search:', await p.evaluate(() => UI.grpKids.size));
  await p.click('form[data-form=group] button.pri'); await p.waitForTimeout(500); console.log(tag, '  saved:', await toast(), await p.evaluate(() => location.hash));
  console.log(tag, '  list:', await p.evaluate(() => (document.querySelector('.grprow') || {}).innerText || 'none'));
  // a parents meeting with adults only
  await go('#/groups/new?s=UCC'); await p.selectOption('form[data-form=group] [name=kind]', 'Parents meeting'); await p.fill('form[data-form=group] [name=topic]', 'Family strengthening'); await p.fill('form[data-form=group] [name=women]', '7'); await p.fill('form[data-form=group] [name=men]', '3');
  await p.click('form[data-form=group] button.pri'); await p.waitForTimeout(400); console.log(tag, '2 adults only:', await toast());
  await go('#/groups/new?s=UCC'); await p.selectOption('form[data-form=group] [name=kind]', 'Other'); await p.fill('form[data-form=group] [name=topic]', 'x'); await p.click('form[data-form=group] button.pri'); await p.waitForTimeout(300); console.log(tag, '  nobody refused:', await toast());
  // report of UCC
  await go('#/reports?s=UCC&m=' + m); console.log(tag, '3 report table:', await p.evaluate(() => { const s = [...document.querySelectorAll('section.card')].find(x => /Group activities/.test(x.innerText)); return s ? [...s.querySelectorAll('tbody tr')].map(r => r.innerText.replace(/\s+/g, ' ')).join(' | ') : 'none'; }), 'fits', await fits());
  // child history
  await go('#/child/' + ids[0]); console.log(tag, '4 history:', await p.evaluate(() => /Workshop: Behaviour change/.test(document.querySelector('.main').innerText)));
  // lock: UCC report sent, a new activity for UCC refused
  await p.evaluate(m => { S.events.push({ id: uid('e'), childId: '', type: 'Report sent', ref: m + '|UCC', date: today(), ts: Date.now(), by: USER.id }); save(); }, m);
  const n0 = await p.evaluate(() => grpAll().length);
  await go('#/groups/new?s=UCC'); await p.selectOption('form[data-form=group] [name=kind]', 'Workshop'); await p.fill('form[data-form=group] [name=topic]', 'y'); await p.fill('form[data-form=group] [name=others]', '4'); await p.click('form[data-form=group] button.pri'); await p.waitForTimeout(400);
  console.log(tag, '5 closed month refused:', n0 === await p.evaluate(() => grpAll().length), await toast());
  // cancel refused while the month is closed, allowed after send back
  await go('#/groups?m=' + m); await p.click('.grprow [data-dact=cancelrec]'); await p.waitForTimeout(300); console.log(tag, '  cancel in closed month refused:', !(await p.$('#dlg')), await toast());
  await p.evaluate(m => { S.events.push({ id: uid('e'), childId: '', type: 'Report sent back', ref: m + '|UCC', date: today(), ts: Date.now() + 5, note: 'x', by: USER.id }); save(); }, m);
  await go('#/groups?s=&m=' + m); const before = await p.locator('.grprow').count(); await p.click('.grprow [data-dact=cancelrec]'); await p.waitForTimeout(300); await p.fill('#dlg textarea', 'test'); await p.click('#dlg .ok'); await p.waitForTimeout(400);
  console.log(tag, '6 cancel:', before, '->', await p.locator('.grprow').count());
  await p.screenshot({ path: OUT + 'groups-' + tag + '.png' });
  await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
