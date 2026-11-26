const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const url = 'file://' + __dirname + '/cicetekelo-records-alpha.html';
  await p.goto(url); await p.waitForSelector('.stile'); await p.click('text=Mauro (evaluation)');
  await p.evaluate(() => { S.children.push({ id: '9999', name: 'Test', surname: 'Child', section: 'UCC', residence: 'Resident', status: 'Active', sex: 'M', programmes: [], support: [] }); });
  for (const h of ['#/home', '#/pending', '#/children', '#/child/9999', '#/attendance', '#/visit/new?child=9999', '#/reports', '#/staff', '#/outreach', '#/counseling', '#/child/9999/status', '#/child/new', '#/staff/data']) {
    await p.goto(url + h); await p.waitForTimeout(150);
    const w = await p.evaluate(() => { const W = document.documentElement.clientWidth; const bad = []; for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.right > W + 1 && !el.closest('.tw')) bad.push(el.tagName + '.' + el.className + ' ' + Math.round(r.right)); } return [document.documentElement.scrollWidth, bad.slice(0, 4)]; });
    console.log(h, JSON.stringify(w));
  }
  await p.goto(url + '#/visit/new?child=9999'); await p.screenshot({ path: 'shots/30-mobile-visit.png', fullPage: true });
  await b.close();
})();
