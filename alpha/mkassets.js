const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const css = fs.readFileSync(process.argv[2] + '/project/components/bundle.css', 'utf8'); const m = css.match(/\.cyp-chitenge \{[^}]*background-image: (url\("[^"]+"\))/);
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 794, height: 24 }, deviceScaleFactor: 2 })).newPage();
  await p.setContent(`<style>body{margin:0}div{height:24px;background-repeat:repeat-x;background-size:16px 24px;background-image:${m[1]}}</style><div></div>`); await p.screenshot({ path: '/home/claude/mob/chit.png' }); await b.close(); })();
