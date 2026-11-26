
/* ====================================================================
   The app as a web address that installs on the phone and opens
   without a connection (the records stay on the phone and are sent
   to the shared database when the connection is back).
   ==================================================================== */
const IS_WEB = /^https?:$/.test(location.protocol);
var _installEvt = null;
function b64u(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
/* the link of the staff as one code: where the database is, its key and, when the lock is on, the key of the lock */
function linkCode(c) { c = c || syncCfg(); return c ? b64u(JSON.stringify(Object.assign({ u: c.url, k: c.key }, c.enc ? { e: c.enc } : {}))) : ''; }
/* iPhone, iPad and Safari on a Mac: the icon on the Home Screen is another app with its own empty memory.
   It starts from the address it was made from, so on these devices the address keeps the link until the icon is made. */
function iconKeepsLink() { return /^https?:$/.test(location.protocol) && !window.CYP_SYNC && (installKind() === 'ios' || installKind() === 'safari'); } /* runs before IS_WEB exists */
function linkFromHash() {
  const h = location.hash; if (!h.startsWith('#c=')) return false;
  let o = null, had = null; try { o = JSON.parse(unb64u(h.slice(3))); } catch (e) {}
  try { had = JSON.parse(lsGet('cyp-sync') || 'null'); } catch (e) {}
  /* opened from the icon: the icon always carries the link it was made with, so a newer link pasted in the app stays */
  if (o && o.u && o.k && !(isInstalled() && had && had.url)) lsSet('cyp-sync', JSON.stringify(Object.assign({ url: o.u, key: o.k }, o.e ? { enc: o.e } : {})));
  if (iconKeepsLink() && !isInstalled()) return true;
  try { history.replaceState(null, '', location.pathname + location.search + '#/home'); } catch (e) { location.hash = '#/home'; }
  return true;
}
var _manCode = '';
/* tells the iPhone to start the icon with the link, and keeps the link in the address of the Home page */
function linkKeep(anyPage) {
  if (!iconKeepsLink()) return;
  const code = linkCode(); if (!code) return;
  if (code !== _manCode) { const l = document.querySelector('link[rel="manifest"]');
    if (l) { const base = location.origin + location.pathname.replace(/[^\/]*$/, ''), icon = (f, s, p) => ({ src: base + f, sizes: s + 'x' + s, type: 'image/png', purpose: p });
      l.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify({ name: 'CYP EDU', short_name: 'CYP EDU', description: 'Cicetekelo Youth Project, Education Department records', id: base, start_url: base + '#c=' + code, scope: base, display: 'standalone', background_color: '#FFFFFF', theme_color: '#0091D5', icons: [icon('icon-192.png', 192, 'any'), icon('icon-512.png', 512, 'any'), icon('icon-maskable-512.png', 512, 'maskable')] })); _manCode = code; } }
  if (!isInstalled() && (anyPage || route().path === 'home') && location.hash !== '#c=' + code) { try { history.replaceState(null, '', location.pathname + location.search + '#c=' + code); } catch (e) {} }
}
function staffLink(appUrl) { const c = syncCfg(); if (!c || !appUrl) return ''; return String(appUrl).trim().replace(/#.*$/, '') + '#c=' + linkCode(c); }
function appUrl() { return IS_WEB ? location.origin + location.pathname : ((S.settings && S.settings.appUrl) || ''); }
function isInstalled() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
function installHow() {
  const ua = navigator.userAgent || '', ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return 'Tap the Share button (square with an arrow up), then <b>Add to Home Screen</b>.';
  if (/Android/.test(ua)) return 'Tap the three dots at the top, then <b>Add to Home screen</b> or <b>Install app</b>.';
  if (/Firefox/.test(ua)) return 'Firefox cannot install it. Open this page in Chrome or Edge.';
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return 'In the menu at the top: <b>File</b>, then <b>Add to Dock</b>.';
  return 'Click the small screen icon at the right of the address bar, then <b>Install</b>.';
}
function installKind() { const ua = navigator.userAgent || ''; if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'; if (/Firefox/.test(ua)) return 'firefox'; if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return 'safari'; return 'chromium'; }
/* where the icon is once the app is on the device */
function installWhere() {
  const k = installKind(), ua = navigator.userAgent || '';
  if (k === 'ios') return 'Look for the CYP EDU icon on the Home Screen. On the last pages too: swipe left.';
  if (/Android/.test(ua)) return 'Look for the CYP EDU icon among all the apps: swipe up on the home screen and type CYP. Press and hold the icon, then drag it to the home screen.';
  if (k === 'safari') return 'Look for the CYP EDU icon in the Dock or in Launchpad.';
  return 'Look for CYP EDU among the apps of the computer, or type chrome://apps in the address bar.';
}
function installCard(home) {
  if (!IS_WEB || isInstalled()) return '';
  if (home && (lsGet('cyp-install-hide') === '1' || lsGet('cyp-installed') === '1')) return '';
  /* Chrome and Edge offer the installation only while the app is not installed: no offer, no card on Home */
  if (home && installKind() === 'chromium' && !_installEvt) return '';
  const dev = isPhone() ? 'phone' : 'computer', done = lsGet('cyp-installed') === '1' || (installKind() === 'chromium' && !_installEvt);
  return `<section class="card soft" id="installcard"${home ? ' data-home="1"' : ''}><h2>Put CYP EDU on this ${dev}</h2>
    ${_installEvt ? '<button class="btn pri" data-wact="install" style="width:100%;margin-top:8px">Install CYP EDU</button>' : home ? `<p style="margin:6px 0 0">${installHow()}</p>` : `${done ? `<p style="margin:6px 0 0"><b>CYP EDU is probably on this ${dev} already.</b> ${installWhere()}</p><p style="margin:10px 0 0"><b>No icon?</b> ${installHow()}</p>` : `<p style="margin:6px 0 0">${installHow()}</p><p class="sub" style="margin:8px 0 0">After that: ${installWhere()}</p>`}`}
    ${home ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${_installEvt ? '' : '<button class="btn sm" data-wact="installhide">Already done</button>'}<button class="btn sm" data-wact="installhide">Not now</button></div>` : ''}</section>`;
}
function offlineCard() {
  if (!IS_WEB) return '';
  const dev = isPhone() ? 'phone' : 'computer';
  if (!UI.offlineReady) return `<div class="warn" id="offcard">Keep this page open one minute, with internet. The app is being saved on this ${dev}.</div>`;
  if (lsGet('cyp-offline-seen') === '1') return '';
  return `<div class="ok" id="offcard" style="display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap"><span><b>Ready.</b> CYP EDU now opens on this ${dev} without internet too.</span><button class="btn sm" data-wact="offseen">OK</button></div>`;
}
function offlineLine() { if (!IS_WEB) return ''; return `<div class="row"><span>Opens without a connection on this ${isPhone() ? 'phone' : 'computer'}</span><b>${UI.offlineReady ? 'yes' : 'not yet: keep the app open a moment with a connection'}</b></div>`; }
/* asks for the link of the staff: one button that takes it from what was copied, and a box for the same thing by hand */
function linkAsk(why) {
  const paste = !!(navigator.clipboard && navigator.clipboard.readText);
  return `<div class="card" id="linkask" style="width:100%;max-width:420px;text-align:left"><h2 style="margin:0 0 8px">${why || 'CYP EDU needs the staff link'}</h2>
    <ol style="margin:0 0 12px;padding-left:20px;line-height:1.7"><li>Go to the message with the link (WhatsApp or email).</li><li>Hold the link, then tap <b>Copy</b>.</li><li>Come back here${paste ? ' and tap <b>Paste the link</b>' : ' and paste it in the box'}.</li></ol>
    ${paste ? '<button class="btn pri" data-wact="linkpaste" style="width:100%">Paste the link</button>' : ''}
    <form data-form="synclink" style="display:flex;flex-direction:column;gap:8px;margin-top:12px"><label class="f"><span>${paste ? 'Or paste it here' : 'Link'}</span><input class="in" name="link" autocomplete="off" autocapitalize="off" spellcheck="false" required></label><button class="btn${paste ? '' : ' pri'}">Open</button></form></div>`;
}
/* first screen of a phone that has nothing yet */
function vConnect() {
  const cfg = syncCfg(), st = UI.syncPing;
  return `<div class="login">
    <div>${brandMark()}<p class="lead" style="margin-top:10px">Cicetekelo Youth Project · Education Department</p></div>
    ${cfg ? `<div class="card" style="width:100%;max-width:420px">${UI.syncMsg ? `<div class="warn" style="margin:0 0 10px">${UI.syncMsg}</div>` : ''}${st && !st.ok ? `<p class="sub">The shared database does not answer. Check the connection of this ${isPhone() ? 'phone' : 'computer'}.</p><button class="btn pri" data-wact="retry" style="width:100%">Try again</button>` : st && st.ok && !st.hasSnapshot ? `<p class="sub">The shared database is still empty. An Education admin starts it once, from the computer where the records are today.</p><button class="btn" data-wact="retry" style="width:100%">Try again</button>` : '<p class="sub" style="margin:0"><b>Loading the records…</b><br>The first time this takes about a minute. Keep this page open.</p>'}</div>`
      : linkAsk()}
    <p class="sub" style="max-width:420px">The names of the children are on this ${isPhone() ? 'phone' : 'computer'} only after the link is opened and the staff PIN is typed.</p>
  </div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-wact]'); if (!b) return;
  const act = b.dataset.wact;
  if (act === 'copytext') { const el = document.getElementById(b.dataset.src), t = el ? el.value : ''; try { await navigator.clipboard.writeText(t); toast('Copied'); } catch (x) { if (el) { el.select(); document.execCommand('copy'); toast('Copied'); } } return; }
  if (act === 'offseen') { lsSet('cyp-offline-seen', '1'); render(); return; }
  if (act === 'installhide') { lsSet('cyp-install-hide', '1'); render(); return; }
  if (act === 'install' && _installEvt) { _installEvt.prompt(); try { await _installEvt.userChoice; } catch (x) {} _installEvt = null; render(); }
  else if (act === 'retry') { UI.syncPing = null; UI.syncMsg = ''; render(); syncAuto(); }
  else if (act === 'linkpaste') { let t = ''; try { t = await navigator.clipboard.readText(); } catch (x) { return toast('The phone did not give the copied link. Paste it in the box.'); } if (!parseLink(t)) return toast('What you copied is not the staff link. Copy the link from the message.'); FORMS.synclink({ link: t }); }
  else if (act === 'copylink') { const t = staffLink(appUrl()); try { await navigator.clipboard.writeText(t); toast('Link copied'); } catch (x) { const i = document.getElementById('stafflink'); if (i) { i.select(); document.execCommand('copy'); toast('Link copied'); } } }
  else if (act === 'sharelink') { try { await navigator.share({ title: 'CYP EDU', text: 'CYP EDU, the records of the Education Department. Open this link once with a connection, then it also opens without.', url: staffLink(appUrl()) }); } catch (x) {} }
});
FORMS.appurl = function (o) { const u = String(o.appUrl || '').trim(); if (u && !/^https:\/\//.test(u)) return toast('The address must start with https://'); S.settings.appUrl = u; save(); toast('Saved'); render(); };
function inviteText(link) { return ['CYP EDU, the app of the Education Department.', '', '1. Open this link on your phone or computer, with internet:', link, '', '2. Keep it on the phone or computer.', 'iPhone: Share button, then Add to Home Screen. If the app then asks for the link: copy the link above and tap Paste the link.', 'Android: three dots, then Install app.', 'Computer with Chrome or Edge: icon at the right of the address bar, then Install.', 'Mac with Safari: File, then Add to Dock.', '', '3. Tap your name and type the PIN. The PIN comes in another message.', '', 'Do not forward this link: it opens the records of the children.'].join('\n'); }
function pinText() { return 'CYP EDU PIN: ' + pinValue(); }
function staffLinkCard() {
  if (!isSite() || !syncOn()) return '';
  const url = appUrl(), link = staffLink(url);
  const send = (id, txt, mail) => `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn pri" data-wact="copytext" data-src="${id}">Copy</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(txt)}">WhatsApp</a>${mail ? `<a class="btn" href="mailto:?subject=${encodeURIComponent('CYP EDU')}&body=${encodeURIComponent(txt)}">Email</a>` : ''}</div>`;
  return `<section class="card"><h2>Invite the staff</h2>
    ${link ? `<p class="sub" style="margin:4px 0 10px">Two messages: first the link, then the PIN. Staff only.</p>
      <label class="f"><span>1. The link</span><textarea class="in" id="invmsg" rows="13" readonly onclick="this.select()">${esc(inviteText(link))}</textarea></label>${send('invmsg', inviteText(link), true)}
      <label class="f" style="margin-top:14px"><span>2. The PIN</span><input class="in" id="invpin" readonly value="${esc(pinText())}" onclick="this.select()"></label>${send('invpin', pinText(), false)}`
      : `<p class="sub" style="margin:4px 0 10px">The app needs a web address first.</p>`}
    ${IS_WEB ? '' : `<form data-form="appurl" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;margin-top:12px"><label class="f"><span>Web address of the app</span><input class="in" name="appUrl" value="${esc(S.settings.appUrl || '')}" placeholder="https://..."></label><button class="btn">Save</button></form>`}</section>`;
}
/* a new staff link tapped while the app is open: the page does not load again, so the link is read here.
   Only when this device has no working link: an old address in the history must not replace a link that works. */
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#c=') || IS_DEMO) return; const c = parseLink(location.hash); if (!c || linkCode(c) === linkCode()) return; if (syncOn() && !SY.lock) return; FORMS.synclink({ link: location.hash }); });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); _installEvt = e; const c = document.getElementById('installcard'); if (c) c.outerHTML = installCard(c.dataset.home === '1'); else if (USER && route().path === 'home') render(); });
window.addEventListener('appinstalled', () => { _installEvt = null; lsSet('cyp-installed', '1'); if (USER) render(); });
if (IS_WEB && isInstalled()) lsSet('cyp-installed', '1');
if (IS_WEB && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.ready.then(() => { UI.offlineReady = true; if (USER && (route().path === 'sync' || route().path === 'home')) render(); }).catch(() => {});
  });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
}

/* the CYP EDU wordmark: CYP in the blue of the project, EDU in a chitenge zig-zag with the colours of the Zambian flag */
/* the logo of the project beside the name of the app: login, PIN and first-opening pages */
function brandMark(size) {
  return `<div class="lgbrand${size ? ' ' + size : ''}"><img src="${LOGO}" alt="Cicetekelo Youth Project logo">${logoSvg(46)}</div>`;
}
function logoSvg(h) {
  const wd = Math.round(h * 953 / 200);
  return `<svg class="cyplogo" role="img" aria-label="CYP EDU" viewBox="0 0 953 200" width="${wd}" height="${h}"><defs><pattern id="cyl-chit" patternUnits="userSpaceOnUse" width="48" height="72"><rect width="48" height="72" fill="#198A00"/><polygon points="0,-18 24,-38 48,-18 48,0 24,-20 0,0" fill="#EF7D00"/><polygon points="0,0 24,-20 48,0 48,18 24,-2 0,18" fill="#198A00"/><polygon points="0,18 24,-2 48,18 48,36 24,16 0,36" fill="#DE2010"/><polygon points="0,36 24,16 48,36 48,54 24,34 0,54" fill="#111111"/><polygon points="0,54 24,34 48,54 48,72 24,52 0,72" fill="#EF7D00"/><polygon points="0,72 24,52 48,72 48,90 24,70 0,90" fill="#198A00"/></pattern><clipPath id="cyl-cap"><rect width="953" height="200"/></clipPath></defs><g clip-path="url(#cyl-cap)" fill="none" stroke-width="46"><g stroke="#0091D5"><path d="M127,52 C110,30 95,23 80,23 C45,23 23,55 23,100 C23,145 45,177 80,177 C95,177 110,170 127,148"/><path d="M155,-10 L228,105 L301,-10"/><path d="M228,105 L228,200"/><path d="M345,200 L345,23 L397,23 C427,23 444,40 444,66 C444,92 427,109 397,109 L345,109"/></g><g stroke="url(#cyl-chit)"><path d="M621,23 L534,23 L534,177 L621,177"/><path d="M534,100 L606,100"/><path d="M660,23 L702,23 C742,23 764,55 764,100 C764,145 742,177 702,177 L660,177 Z"/><path d="M826,0 L826,115 C826,155 848,177 878,177 C908,177 930,155 930,115 L930,0"/></g></g></svg>`;
}
