const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1300, height: 900 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(900); await p.click('.stile:has-text("Clement")'); await p.waitForTimeout(300);
  console.log(await p.evaluate(() => { window.syncOn = () => true; syncOn = () => true; syncCfg = () => ({ url: 'https://example.org/db', key: 'KEY' }); S.settings.appUrl = 'https://example.org/app/'; const d = document.createElement('div'); d.innerHTML = staffLinkCard(); return { title: d.querySelector('h2').innerText, msg: d.querySelector('#invmsg').value.replace(/#c=\S+/, '#c=…'), pinShown: /^CYP EDU PIN: \d+$/.test(d.querySelector('#invpin').value), links: [...d.querySelectorAll('a.btn')].map(a => a.getAttribute('href').slice(0, 28)), buttons: [...d.querySelectorAll('button')].map(x => x.innerText) }; }));
  console.log('errors', errs); await b.close();
})();
