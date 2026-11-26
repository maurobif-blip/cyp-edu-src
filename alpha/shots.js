const { chromium } = require('playwright'); const fs = require('fs'); const SP = '/tmp/cyp-shots/';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 393, height: 800 }, deviceScaleFactor: 1 }); const p = await ctx.newPage(); p.on('dialog', x => x.accept());
  await p.goto('file:///home/claude/alpha/cicetekelo-records-alpha.html'); await p.waitForTimeout(700); await p.click('.stile:has-text("Clement")'); await p.fill('#pinin', require('/home/claude/cyp-edu-src/alpha/pin.js')); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(400);
  await p.evaluate(pk => { importStarterPack(pk); save(); }, JSON.parse(fs.readFileSync('/home/claude/reports/pack-v3-nophotos.json', 'utf8'))); await p.waitForTimeout(700);
  const go = async h => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(450); };
  const kid = await p.evaluate(() => { const c = S.children.find(c => isCurrent(c) && needsVisits(c) && centreOf(c) === 'Minsundu'); const bern = S.staff.find(s => s.name.includes('Bernard')); const mkv = (f, back) => { const v = { id: uid('v'), childId: c.id, team: 'Family', date: today(), purpose: 'Follow-up', where: 'Home', by: bern.id, successful: 'Yes', metWith: 'Mother', findings: f, action: 'Second visit in December', recordedBy: bern.id, recordedOn: today() }; S.visits.push(v); if (back) S.events.push({ id: uid('e'), childId: c.id, type: 'Visit sent back', ref: v.id, date: today(), ts: Date.now(), note: 'Photo missing', by: USER.id }); return v.id; }; window.__v1 = mkv('Mother at home. The child goes to school every day.', true); window.__v2 = mkv('Nobody at home, neighbour says they moved to Kabushi.', false); save(); USER = bern; render(); return c.id; });
  await go('#/home'); await p.screenshot({ path: SP + 's-home-bernard.png', fullPage: true });
  await go('#/visits?vt=Family&vtab=check'); await p.screenshot({ path: SP + 's-check-bernard.png', fullPage: true });
  await go('#/visitrep/' + await p.evaluate(() => window.__v1)); await p.screenshot({ path: SP + 's-rep-bernard.png', fullPage: true });
  await go('#/help'); await p.screenshot({ path: SP + 's-help.png', fullPage: true });
  await b.close();
})();
