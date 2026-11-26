/* screenshots for the presentations: demo build, invented children only */
const { chromium } = require('playwright'); const OUT = '/home/claude/deck1/shots/';
(async () => { const b = await chromium.launch();
  const open = async who => { const ctx = await b.newContext({ viewport: { width: 393, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const p = await ctx.newPage(); p.on('dialog', d => d.accept());
    await p.goto('file:///home/claude/demo/cicetekelo-records-DEMO.html'); await p.waitForTimeout(1200); await p.addStyleTag({ content: '#demobar, .demobar, #tour, .tourbar { display: none !important; }' });
    return p; };
  const login = async (p, who) => { await p.click(`.stile:has-text("${who}")`); await p.waitForTimeout(300); if (await p.$('#pinin')) { await p.fill('#pinin', await p.evaluate(() => pinValue())); await p.click('form[data-form=pinlogin] button.pri'); await p.waitForTimeout(500); } await p.addStyleTag({ content: 'body > div:first-child:has(button), .demo, [class*=demo] { }' }); };
  const hideDemo = p => p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { if (/^Guided tour/.test((e.innerText || '').trim()) && e.offsetHeight < 80 && e.offsetHeight > 20 && e.offsetWidth > 300) { e.style.display = 'none'; break; } } });
  const shot = async (p, h, name) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(500); await hideDemo(p); await p.waitForTimeout(100); await p.screenshot({ path: OUT + name + '.png' }); };
  let p = await open(); await hideDemo(p); const logo = await p.$('.logo, .brand, header img, svg'); 
  const lg = await p.evaluate(() => { const el = [...document.querySelectorAll('svg, img')].find(e => e.getBoundingClientRect().width > 150 && e.getBoundingClientRect().top < 400 && e.getBoundingClientRect().height < 120); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  if (lg) await p.screenshot({ path: OUT + 'wordmark.png', clip: { x: lg.x - 4, y: lg.y - 4, width: lg.w + 8, height: lg.h + 8 } });
  console.log('wordmark', lg);
  await login(p, 'Bernard'); await shot(p, '#/home', 'home-family');
  const kid = await p.evaluate(() => S.children.find(c => isCurrent(c) && centreOf(c) === 'Minsundu').id); await shot(p, '#/child/' + kid, 'child'); await shot(p, '#/visits', 'monitoring-family'); await shot(p, '#/more', 'more');
  p = await open(); await login(p, 'Chisha'); await shot(p, '#/home', 'home-nkwazi'); await shot(p, '#/attendance?c=Nkwazi', 'attendance-nkwazi');
  await b.close(); })();
