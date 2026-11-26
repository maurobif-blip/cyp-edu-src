const { chromium, devices } = require('playwright'); const fs = require('fs');
const ALPHA = 'file:///home/claude/alpha/cicetekelo-records-alpha.html';
async function pin(p, who, code) { await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(150); await p.fill('#pinin', code || require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(300); }
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (opt) => { const ctx = await b.newContext(Object.assign({ acceptDownloads: true }, opt)); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept()); await p.goto(ALPHA); await p.waitForTimeout(300); return p; };
  const go = async (p, h) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(350); };
  const dl = async (p, sel) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(sel)]); const path = '/tmp/claude-0/' + d.suggestedFilename(); fs.mkdirSync('/tmp/claude-0', { recursive: true }); await d.saveAs(path); return path; };
  // ---- PIN
  const office = await mk({ viewport: { width: 1440, height: 900 } });
  await office.click('.stile:has-text("Mauro")'); await office.waitForTimeout(150); await office.screenshot({ path: 'shots/S-pin.png' });
  await office.fill('#pinin', '0000'); await office.click('form[data-form=pinlogin] button.pri'); await office.waitForTimeout(200);
  console.log('wrong pin ->', await office.evaluate(() => [!!USER, (document.querySelector('.warn') || {}).textContent]));
  await office.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await office.click('form[data-form=pinlogin] button.pri'); await office.waitForTimeout(300);
  console.log('right pin ->', await office.evaluate(() => USER && USER.name));
  await office.reload(); await office.waitForTimeout(400); console.log('reload same tab keeps session:', await office.evaluate(() => !!USER));
  // ---- office loads the real pack and makes the file for the phones
  const v3 = JSON.parse(fs.readFileSync('/home/claude/reports/cicetekelo-starter-pack-2026-11-10-v3.json', 'utf8'));
  await office.evaluate(pk => { importStarterPack(pk); save(); }, v3); await office.waitForTimeout(700);
  await go(office, '#/sync'); await office.screenshot({ path: 'shots/S-office.png', fullPage: true });
  const officeFile = await dl(office, '[data-sact=office]'); console.log('office file', officeFile.split('/').pop(), Math.round(fs.statSync(officeFile).size / 1024) + ' KB');
  console.log('office stamps after import:', await office.evaluate(() => [S.children.filter(c => c.updatedTs).length, S.children.length]));
  // ---- phone: fresh app, PIN, load the office data
  const phone = await mk({ ...devices['Pixel 5'] });
  await phone.tap('.stile:has-text("Iness Phiri")'); await phone.waitForTimeout(150); await phone.screenshot({ path: 'shots/S-pin-phone.png' }); await phone.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await phone.tap('form[data-form=pinlogin] button.pri'); await phone.waitForTimeout(300);
  await go(phone, '#/more'); await phone.tap('a.mitem[href="#/sync"]'); await phone.waitForTimeout(300);
  await phone.setInputFiles('#officefile', officeFile); await phone.waitForTimeout(900);
  console.log('phone loaded:', await phone.evaluate(() => [S.children.length, Object.keys(S.photos || {}).length, isSatellite(), unsent(), USER && USER.name, countText(phoneFile().count) || 'nothing to send']));
  await phone.screenshot({ path: 'shots/S-phone-sync.png', fullPage: true });
  // ---- phone records things
  const ids = await phone.evaluate(() => ({ ucc: S.children.filter(c => c.section === 'UCC' && isCurrent(c) && c.residence === 'Resident').slice(0, 3).map(c => c.id), lu: S.children.filter(c => c.section === 'Luigi' && isCurrent(c)).slice(0, 2).map(c => c.id), next: nextChildId() }));
  await go(phone, '#/attendance?c=Minsundu'); for (let i = 1; i <= 3; i++) { await phone.evaluate(i => document.querySelectorAll('#attTable .att button.P')[0] && [...document.querySelectorAll('#attTable tbody tr:not(.gsep)')].filter(tr => !tr.querySelector('.att .on'))[0].querySelector('button.P').click(), i); await phone.waitForTimeout(150); }
  await go(phone, '#/attendance?c=Luigi'); await phone.tap('details.lstaff summary'); await phone.waitForTimeout(100); await phone.tap('[data-lstaff=dropin][value=s23]'); await phone.waitForTimeout(150);
  await phone.fill('[data-lf=findings]', 'Two boys moved to the bus station.'); await phone.dispatchEvent('[data-lf=findings]', 'change'); await phone.waitForTimeout(150);
  for (let i = 0; i < 2; i++) { await phone.evaluate(() => [...document.querySelectorAll('#lattBody [data-lact=day]')].filter(x => !x.classList.contains('on'))[0].click()); await phone.waitForTimeout(150); }
  await go(phone, '#/visit/new?child=' + ids.ucc[0]); await phone.selectOption('[name=team]', 'Luigi'); await phone.selectOption('[name=purpose]', 'Follow-up'); await phone.fill('[name=findings]', 'Visit recorded on the phone'); await phone.fill('[name=action]', 'Call back'); await phone.tap('form[data-form=visit] button.pri'); await phone.waitForTimeout(300);
  await go(phone, '#/child/new'); await phone.fill('[name=name]', 'Phonechild'); await phone.fill('[name=surname]', 'Test'); await phone.selectOption('[name=sex]', 'M'); await phone.selectOption('[name=section]', 'Luigi'); await phone.tap('form[data-form=child] button.pri'); await phone.waitForTimeout(400);
  const newId = await phone.evaluate(() => S.children[S.children.length - 1].id);
  await go(phone, '#/visit/new?child=' + newId); await phone.selectOption('[name=purpose]', 'Assessment'); await phone.fill('[name=findings]', 'First visit to the new child'); await phone.tap('form[data-form=visit] button.pri'); await phone.waitForTimeout(300);
  await go(phone, '#/child/' + ids.lu[0] + '/edit'); await phone.selectOption('[name=relStreet]', 'Yes'); await phone.tap('form[data-form=child] button.pri'); await phone.waitForTimeout(300);
  await go(phone, '#/home'); console.log('phone reminder:', await phone.evaluate(() => (document.querySelector('.main .warn') || {}).innerText));
  await go(phone, '#/sync'); console.log('phone to send:', await phone.evaluate(() => countText(phoneFile().count)), '| new child id on phone', newId);
  const pf = await dl(phone, '[data-sact=send]'); const pfj = JSON.parse(fs.readFileSync(pf, 'utf8'));
  console.log('phone file', pf.split('/').pop(), Math.round(fs.statSync(pf).size / 1024) + ' KB', JSON.stringify(pfj.count), 'unsent now:', await phone.evaluate(() => unsent()));
  // ---- office meanwhile: another new child (same next ID) and another attendance mark
  await go(office, '#/child/new'); await office.fill('[name=name]', 'Officechild'); await office.fill('[name=surname]', 'Test'); await office.selectOption('[name=sex]', 'F'); await office.selectOption('[name=section]', 'UCC'); await office.click('form[data-form=child] button.pri'); await office.waitForTimeout(400);
  console.log('office new child id', await office.evaluate(() => S.children[S.children.length - 1].id));
  await office.evaluate(id => { const d = today(); S.attendance[d] = S.attendance[d] || {}; S.attendance[d][id] = 'A'; save(); }, ids.ucc[2]);
  const before = await office.evaluate(() => [S.children.length, S.visits.length, Object.keys(S.attendance[today()] || {}).length]);
  await go(office, '#/sync'); await office.setInputFiles('#phonefiles', pf); await office.waitForTimeout(700);
  console.log('office msg:', await office.evaluate(() => document.querySelector('.note').innerText.replace(/\n/g, ' | ')));
  console.log('office after:', await office.evaluate(([nid, ids]) => { const pc = S.children.find(c => c.name === 'Phonechild'), oc = S.children.find(c => c.name === 'Officechild'); const d = today(); const sh = S.outreach.find(s => s.date === d && s.type === 'Drop-in');
    return { children: S.children.length, phoneChildId: pc && pc.id, officeChildId: oc && oc.id, visitsForPhoneChild: S.visits.filter(v => v.childId === pc.id).map(v => v.findings), visitUcc: S.visits.filter(v => v.findings === 'Visit recorded on the phone').length, att: JSON.stringify(Object.values(S.attendance[d])), sheet: sh && [sh.children.length, sh.staffIds, sh.findings], rel: child(ids.lu[0]).relStreet }; }, [newId, ids]), 'before:', before);
  await office.setInputFiles('#phonefiles', pf); await office.waitForTimeout(600); console.log('same file again:', await office.evaluate(() => document.querySelector('.note').innerText.replace(/\n/g, ' | ').slice(0, 130)), await office.evaluate(() => [S.children.length, S.visits.length]));
  // ---- office gives the complete data back, phone loads it
  const of2 = await dl(office, '[data-sact=office]');
  await go(phone, '#/sync'); await phone.setInputFiles('#officefile', of2); await phone.waitForTimeout(900);
  console.log('phone after loading office data:', await phone.evaluate(() => [S.children.length, S.children.filter(c => /child$/.test(c.name)).map(c => c.name + ' ' + c.id).join(', '), unsent(), countText(phoneFile().count) || 'nothing to send', S.visits.length]));
  // wrong file types
  await phone.setInputFiles('#officefile', pf); await phone.waitForTimeout(400); console.log('phone file given as office file:', await phone.evaluate(() => document.querySelector('.note').innerText.slice(0, 110)));
  // ---- PIN change and lock
  await go(office, '#/staff'); await office.fill('form[data-form=pin] [name=pin]', '2468'); await office.click('form[data-form=pin] button'); await office.waitForTimeout(300);
  await office.click('[data-act=logout]'); await office.waitForTimeout(200); await office.click('.stile:has-text("Mauro")'); await office.waitForTimeout(150);
  for (let i = 0; i < 5; i++) { await office.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await office.click('form[data-form=pinlogin] button.pri'); await office.waitForTimeout(120); }
  console.log('old pin 5 times ->', await office.evaluate(() => [!!USER, document.querySelector('#pinin').disabled, [...document.querySelectorAll('.warn')].map(x => x.textContent).join(' ')]));
  await office.evaluate(() => sessionStorage.removeItem('cyp-lock')); await office.click('[data-act=pinback]'); await office.click('.stile:has-text("Mauro")'); await office.fill('#pinin', '2468'); await office.click('form[data-form=pinlogin] button.pri'); await office.waitForTimeout(300); console.log('new pin ->', await office.evaluate(() => USER && USER.name));
  // new tab (new session) asks the PIN again
  const p2 = await office.context().newPage(); await p2.goto(ALPHA); await p2.waitForTimeout(400); console.log('new tab logged in without PIN:', await p2.evaluate(() => !!USER));
  console.log('errors', errs); await b.close();
})();
