import re, hashlib, os, json
from PIL import Image, ImageDraw, ImageFont
A='/home/claude/alpha/'; OUT='/home/claude/web/cyp-edu/'; os.makedirs(OUT, exist_ok=True)
css=open(A+'app.css').read()+open(A+'ds.web.css').read(); logo=open(A+'logo.b64').read().strip()
lh_head=open(A+'lh_head.b64').read().strip(); lh_foot=open(A+'lh_foot.b64').read().strip()
staff=open(A+'staff.js').read()
i=staff.index('const STAFF_SEED = ['); j=staff.index('\n];', i)+3
staff=staff[:i]+'const STAFF_SEED = [];'+staff[j:]
sync=open(A+'sync.js').read(); assert sync.count("|| '__DEFAULT_PIN__'")==1; sync=sync.replace("|| '__DEFAULT_PIN__'","|| ''")
js='const WEB_BUILD = true;\n'+open(A+'app.js').read()+open(A+'luigi.js').read()+open(A+'plan.js').read()+staff+open(A+'pick.js').read()+open(A+'more.js').read()+open(A+'nkwazi.js').read()+open(A+'school.js').read()+open(A+'docs.js').read()+open(A+'tasks.js').read()+open(A+'groups.js').read()+open(A+'cases.js').read()+open(A+'dsicons.js').read()+open(A+'dsafter.js').read()+open(A+'office.js').read()+open(A+'story.js').read()+open(A+'docx.js').read()+open(A+'counsel.js').read()+sync+open(A+'web.js').read()
html=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0091D5">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="CYP EDU">
<meta name="robots" content="noindex,nofollow">
<title>CYP EDU</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<style>
{css}
</style>
</head>
<body>
<div id="app"><p style="padding:40px;font-family:sans-serif">Loading...</p></div>
<noscript>This page needs JavaScript. Open it in Google Chrome.</noscript>
<script>
const LOGO = 'data:image/png;base64,{logo}';
const LH_HEAD = 'data:image/jpeg;base64,{lh_head}', LH_FOOT = 'data:image/jpeg;base64,{lh_foot}';
{js}
</script>
</body>
</html>
'''
open(OUT+'index.html','w').write(html)
h=hashlib.sha1(html.encode()).hexdigest()[:10]
sw='''/* CYP EDU: keeps the app on the device so that it opens without a connection.
   Newest version first when there is internet, the kept copy when there is none. Change V at every update. */
const V = 'cyp-edu-%s';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './fonts/Ubuntu-Medium.woff2', './fonts/Ubuntu-Bold.woff2', './fonts/OpenSans-Regular.woff2', './fonts/OpenSans-SemiBold.woff2', './fonts/OpenSans-Bold.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
});
''' % h
open(OUT+'sw.js','w').write(sw)
json.dump({"name":"CYP EDU","short_name":"CYP EDU","description":"Cicetekelo Youth Project, Education Department records","start_url":"./","scope":"./","display":"standalone","background_color":"#FFFFFF","theme_color":"#0091D5","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},{"src":"icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}, open(OUT+'manifest.webmanifest','w'), indent=1)
import subprocess
ICON_HTML='''<!doctype html><html><body style="margin:0"><div style="width:512px;height:512px;background:#FFFFFF;display:flex;flex-direction:column;align-items:center;justify-content:space-between">
<div style="flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;padding-top:14px">
<svg viewBox="0 0 497 200" style="width:336px;height:135px;display:block"><defs><pattern id="chit" patternUnits="userSpaceOnUse" width="48" height="72"><rect width="48" height="72" fill="#198A00"/><polygon points="0,-18 24,-38 48,-18 48,0 24,-20 0,0" fill="#EF7D00" stroke="#FFFFFF" stroke-width="2.5"/><polygon points="0,0 24,-20 48,0 48,18 24,-2 0,18" fill="#198A00" stroke="#FFFFFF" stroke-width="2.5"/><polygon points="0,18 24,-2 48,18 48,36 24,16 0,36" fill="#DE2010" stroke="#FFFFFF" stroke-width="2.5"/><polygon points="0,36 24,16 48,36 48,54 24,34 0,54" fill="#111111" stroke="#FFFFFF" stroke-width="2.5"/><polygon points="0,54 24,34 48,54 48,72 24,52 0,72" fill="#EF7D00" stroke="#FFFFFF" stroke-width="2.5"/><polygon points="0,72 24,52 48,72 48,90 24,70 0,90" fill="#198A00" stroke="#FFFFFF" stroke-width="2.5"/></pattern><clipPath id="capA"><rect width="497" height="200"/></clipPath><clipPath id="capB"><rect x="567" width="485" height="200"/></clipPath></defs>
<g clip-path="url(#capA)" fill="none" stroke="#0091D5" stroke-width="46"><path d="M127,52 C110,30 95,23 80,23 C45,23 23,55 23,100 C23,145 45,177 80,177 C95,177 110,170 127,148"/><path d="M178,-10 L251,105 L324,-10"/><path d="M251,105 L251,200"/><path d="M375,200 L375,23 L427,23 C457,23 474,40 474,66 C474,92 457,109 427,109 L375,109"/></g></svg>
<svg viewBox="567 0 485 200" style="width:328px;height:135px;display:block"><g clip-path="url(#capB)" fill="none" stroke="url(#chit)" stroke-width="46"><path d="M677,23 L590,23 L590,177 L677,177"/><path d="M590,100 L662,100"/><path d="M749,23 L791,23 C831,23 853,55 853,100 C853,145 831,177 791,177 L749,177 Z"/><path d="M925,0 L925,115 C925,155 947,177 977,177 C1007,177 1029,155 1029,115 L1029,0"/></g></svg></div>
<svg viewBox="0 0 512 54" style="width:512px;height:54px;display:block"><rect width="512" height="54" fill="url(#chit)"/></svg></div></body></html>'''
open('/home/claude/web/icon.html','w').write(ICON_HTML)
subprocess.run(['node','-e','''const {chromium}=require("playwright");(async()=>{const b=await chromium.launch();for(const n of [512,192]){const p=await (await b.newContext({viewport:{width:512,height:512},deviceScaleFactor:n/512})).newPage();await p.goto("file:///home/claude/web/icon.html");await p.screenshot({path:"/home/claude/web/cyp-edu/icon-"+n+".png"});}await b.close();})();'''],check=True,cwd='/home/claude/alpha')
print('web build', len(html), h, os.listdir(OUT))
bad=[w for w in ['Clement','Mwamba','Chippo','Iness','Lewis Chewe','Maxwell',] + (["'" + open('/home/claude/cyp-edu-src/local/pin.txt').read().strip() + "'"] if __import__('os').path.exists('/home/claude/cyp-edu-src/local/pin.txt') else []) if w in html]
print('names or PIN left in the web build:', bad)

# fonts and the stylesheet of the CYP design system, as files beside the app
import shutil
DS='/home/claude/ds2/CYP/'
os.makedirs(OUT+'fonts', exist_ok=True)
for f in json.load(open(A+'ds.fonts.json')): shutil.copy(DS+'fonts/'+f, OUT+'fonts/'+f)
shutil.copy(DS+'components/bundle.css', OUT+'bundle.css')
os.makedirs(OUT+'licenses', exist_ok=True)
for f in os.listdir(DS+'licenses'): shutil.copy(DS+'licenses/'+f, OUT+'licenses/'+f)
