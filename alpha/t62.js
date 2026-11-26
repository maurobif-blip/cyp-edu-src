const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const errs = []; const ctx = await b.newContext({ viewport: { width: 393, height: 800 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', x => x.accept());
  const login = async who => { await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(150); const pin = await p.$('#pinin'); if (pin) { await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); } await p.waitForTimeout(400); };
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(400); };
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await login('Clement');
  await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(900);
  await p.click('[data-act=logout]').catch(async () => { await p.evaluate(() => { USER = null; lsSet(USER_KEY, null); render(); }); }); await p.waitForTimeout(300); await login('Lewis');
  const [k1, k2] = await p.evaluate(() => monthlyKids(null).slice(0, 2).map(c => c.id));
  await go('#/child/' + k1 + '/month'); await p.fill('form[data-form=monthly] [name=behaviour]', 'Calm, helps the younger ones'); await p.fill('form[data-form=monthly] [name=plan]', 'Talk with the teacher');
  await p.reload(); await p.waitForTimeout(900); if (await p.$('.stile')) await login('Lewis'); else if (await p.$('#pinin')) { await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400); }
  console.log('after closing and opening', await p.evaluate(() => [location.hash, USER && USER.name, document.querySelector('form[data-form=monthly] [name=behaviour]').value, document.querySelector('form[data-form=monthly] [name=plan]').value]));
  await go('#/child/' + k2 + '/month'); console.log('other child stays empty', await p.evaluate(() => document.querySelector('form[data-form=monthly] [name=behaviour]').value === ''));
  await go('#/child/' + k1 + '/month?m=2026-10'); console.log('other month stays empty', await p.evaluate(() => document.querySelector('form[data-form=monthly] [name=behaviour]').value === ''));
  await go('#/child/' + k1 + '/month'); await p.click('form[data-form=monthly] button.pri'); await p.waitForTimeout(600); console.log('saved', await p.evaluate(id => (child(id).monthly || []).map(r => r.behaviour), k1), 'draft left', await p.evaluate(() => lsGet('cyp-draft')));
  /* another user on the same phone does not get the text */
  await go('#/child/' + k2 + '/month'); await p.fill('form[data-form=monthly] [name=behaviour]', 'Text of Lewis'); await p.evaluate(() => { USER = S.staff.find(s => s.name.includes('Chisha')); render(); }); await p.waitForTimeout(300); console.log('another user: empty', await p.evaluate(() => document.querySelector('form[data-form=monthly] [name=behaviour]').value === ''));
  /* cancel link clears */
  await p.evaluate(() => { USER = S.staff.find(s => s.name.includes('Lewis')); render(); }); await go('#/visit/new?child=' + k1 + '&t=Family'); await p.fill('[name=findings]', 'to throw away'); await p.click('form[data-form=visit] a.btn'); await p.waitForTimeout(400); await go('#/visit/new?child=' + k1 + '&t=Family'); console.log('after Cancel: empty', await p.evaluate(() => document.querySelector('[name=findings]').value === ''));
  /* counselling session and something happened */
  await go('#/counseling'); const cf = await p.evaluate(() => [...document.querySelectorAll('form[data-form]')].map(f => f.dataset.form)); console.log('forms on counselling', cf);
  await go('#/child/' + k1); await p.click('[data-act=happened]').catch(() => {}); await p.waitForTimeout(300); const ta = await p.$('#happened textarea, #happened [name=note]'); if (ta) { await ta.fill('Went home for the weekend'); await go('#/home'); await go('#/child/' + k1); console.log('something happened: text back', await p.evaluate(() => (document.querySelector('#happened [name=note]') || {}).value)); }
  console.log('errors', errs); await b.close();
})().catch(e => { console.error('FAIL', e.message.slice(0, 600)); process.exit(1); });
