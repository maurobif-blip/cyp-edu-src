const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); await p.click('.stile:has-text("Clement")'); await p.waitForTimeout(300);
  const kids = await p.evaluate(() => S.children.filter(c => c.section === 'UCC' && isCurrent(c)).slice(0, 3).map(c => ({ id: c.id, name: c.name, surname: c.surname })));
  const dir = '/tmp/cyp-shots/ph'; fs.mkdirSync(dir, { recursive: true });
  const png = await p.evaluate(() => { const cv = document.createElement('canvas'); cv.width = 800; cv.height = 600; const x = cv.getContext('2d'); x.fillStyle = '#448361'; x.fillRect(0, 0, 800, 600); return cv.toDataURL('image/jpeg', 0.9).split(',')[1]; });
  const files = [`${kids[0].surname} ${kids[0].name}.jpg`, `${kids[1].name} ${kids[1].surname} 14yrs.jpg`, `${kids[2].surname}.jpg`, 'IMG_20250819_103713.jpg', 'Nobody Known.jpg'].map(f => { const fp = dir + '/' + f; fs.writeFileSync(fp, Buffer.from(png, 'base64')); return fp; });
  await p.evaluate(() => location.hash = '#/staff/data'); await p.waitForTimeout(400);
  await p.setInputFiles('#photosfile', files); await p.waitForTimeout(1200);
  console.log(await p.evaluate(() => UI.photoBatch.map(x => [x.name, x.sure, x.pick, x.cands.length, x.src.length])));
  console.log('button', await p.evaluate(() => document.querySelector('[data-act=photossave]').innerText)); await p.screenshot({ path: 'shots/P1.png', fullPage: false });
  await p.click('[data-act=photossave]'); await p.waitForTimeout(400);
  console.log('saved', await p.evaluate(ids => ids.map(id => !!photos()[id] && photos()[id].length), kids.map(k => k.id)));
  console.log('errors', errs.slice(0, 5)); await b.close();
})();
