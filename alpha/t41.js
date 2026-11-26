const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [n, opt] of [['iPhone', devices['iPhone 13']], ['Android', devices['Pixel 5']], ['Mac Safari', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', viewport: { width: 1300, height: 800 } }], ['Chrome desktop', { viewport: { width: 1300, height: 800 } }], ['Firefox', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:126.0) Gecko/20100101 Firefox/126.0', viewport: { width: 1300, height: 800 } }]]) {
    const p = await (await b.newContext(opt)).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
    console.log(n, '|', await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = installCard(true); const t = d.innerText.replace(/\s+/g, ' '); lsSet('cyp-install-hide', '1'); const hid = installCard(true) === ''; lsSet('cyp-install-hide', null); return [VERSION, IS_WEB, t, 'hidden after Not now: ' + hid, 'More page still has it: ' + (installCard() !== '')].join(' | '); }));
    await p.context().close();
  }
  console.log('errors', errs.slice(0, 4)); await b.close();
})();
