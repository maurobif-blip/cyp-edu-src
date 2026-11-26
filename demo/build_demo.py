import json
A='/home/claude/alpha/'
css=open(A+'app.css').read()+open(A+'ds.css').read(); js=open(A+'app.js').read()+open(A+'luigi.js').read()+open(A+'plan.js').read()+open(A+'staff.js').read()+open(A+'pick.js').read()+open(A+'more.js').read()+open(A+'nkwazi.js').read()+open(A+'school.js').read()+open(A+'docs.js').read()+open(A+'tasks.js').read()+open(A+'groups.js').read()+open(A+'cases.js').read()+open(A+'dsicons.js').read()+open(A+'dsafter.js').read()+open(A+'office.js').read()+open(A+'story.js').read()+open(A+'docx.js').read()+open(A+'counsel.js').read()+open(A+'sync.js').read()+open(A+'web.js').read()+open(A+'tour.js').read(); logo=open(A+'logo.b64').read().strip()
lh_head=open(A+'lh_head.b64').read().strip(); lh_foot=open(A+'lh_foot.b64').read().strip()
state=open('demo_state.json').read()
import os, sys
_pf = '/home/claude/cyp-edu-src/local/pin.txt'
if not os.path.exists(_pf): sys.exit('STOP: local/pin.txt is missing')
js = js.replace("'__DEFAULT_PIN__'", "'" + open(_pf).read().strip() + "'")
html=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CYP EDU demo</title>
<link rel="icon" href="data:image/png;base64,{logo}">
<style>
{css}
</style>
</head>
<body>
<div id="app"><p style="padding:40px;font-family:sans-serif">Loading...</p></div>
<noscript>This page needs JavaScript. Open it in Microsoft Edge or Google Chrome.</noscript>
<script>
const LOGO = 'data:image/png;base64,{logo}';
const LH_HEAD = 'data:image/jpeg;base64,{lh_head}', LH_FOOT = 'data:image/jpeg;base64,{lh_foot}';
const DEMO_BASE = '2026-11-09';
const DEMO_STATE = {state};
{js}
</script>
</body>
</html>
'''
open('cicetekelo-records-DEMO.html','w').write(html); print(len(html))
