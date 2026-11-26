css=open('app.css').read()+open('ds.css').read(); js=open('app.js').read()+open('luigi.js').read()+open('plan.js').read()+open('staff.js').read()+open('pick.js').read()+open('more.js').read()+open('nkwazi.js').read()+open('school.js').read()+open('docs.js').read()+open('tasks.js').read()+open('groups.js').read()+open('cases.js').read()+open('dsicons.js').read()+open('dsafter.js').read()+open('office.js').read()+open('story.js').read()+open('docx.js').read()+open('counsel.js').read()+open('sync.js').read()+open('web.js').read(); logo=open('logo.b64').read().strip()
lh_head=open('lh_head.b64').read().strip(); lh_foot=open('lh_foot.b64').read().strip()
import os, sys
_pf = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'local', 'pin.txt')
if not os.path.exists(_pf): sys.exit('STOP: local/pin.txt is missing (the default PIN of the computer file; ask Mauro, never write it in chat)')
js = js.replace("'__DEFAULT_PIN__'", "'" + open(_pf).read().strip() + "'")
html=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CYP EDU</title>
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
{js}
</script>
</body>
</html>
'''
open('cicetekelo-records-alpha.html','w').write(html)
print(len(html))
