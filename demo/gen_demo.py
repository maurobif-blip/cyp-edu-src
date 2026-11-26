"""Invented data for the Cicetekelo records demo. Base date 2026-11-09; the app moves all dates forward to 'today'."""
import json, random, csv, datetime as dt
import openpyxl

random.seed(23)
BASE = dt.date(2026, 11, 9)
D = lambda d: d.isoformat()
def day(s): return dt.date.fromisoformat(s)
def rnd_date(a, b):
    a, b = day(a), day(b); return D(a + dt.timedelta(days=random.randint(0, (b - a).days)))

# ---- real names, to make sure no invented child matches a real one
real = set()
for r in csv.DictReader(open('/mnt/user-data/attachments/3a39158f-1dda-5399-b8a5-94e59b8a34d9/b88f584d-users_export_1.csv', encoding='utf-8-sig')):
    real.add(frozenset([r['name'].strip().lower(), r['surname'].strip().lower()]))
ws = openpyxl.load_workbook('/mnt/user-data/attachments/3a39158f-1dda-5399-b8a5-94e59b8a34d9/cfbf2b63-DOC_Luigi.xlsx', data_only=True).worksheets[0]
for r in range(29, ws.max_row + 1):
    n = ws.cell(r, 30).value
    if n: real.add(frozenset(w.lower() for w in str(n).split()[:2]))

BOYS = ['Mwila', 'Chanda', 'Kelvin', 'Joseph', 'Emmanuel', 'Brian', 'Moses', 'Gift', 'Blessings', 'Lazarous', 'Kondwani', 'Mapalo', 'Chisanga', 'Patrick', 'Daniel', 'Isaac', 'Peter', 'John', 'Elijah', 'Collins',
        'Clever', 'Fanwell', 'Bright', 'Dalitso', 'Mukuka', 'Kasonde', 'Musonda', 'Chileshe', 'Nathan', 'Samuel', 'Abel', 'Victor', 'Junior', 'Prince', 'Benson', 'Given', 'Lackson', 'Webster', 'Gabriel', 'Felix']
GIRLS = ['Bupe', 'Mutinta', 'Chipo', 'Precious', 'Esther', 'Faith', 'Grace', 'Ruth', 'Thandiwe', 'Mirriam', 'Agness', 'Memory', 'Loveness', 'Purity', 'Febby', 'Beauty', 'Taonga', 'Towela', 'Luyando', 'Natasha',
         'Mercy', 'Martha', 'Mwaka', 'Chikondi', 'Rhoda', 'Joyce', 'Edith', 'Sharon', 'Abigail', 'Hope']
SUR = ['Banda', 'Phiri', 'Mwale', 'Zulu', 'Tembo', 'Mbewe', 'Sakala', 'Kunda', 'Mumba', 'Kapambwe', 'Kasonde', 'Ngoma', 'Nyirenda', 'Simwanza', 'Chola', 'Kalaba', 'Chibwe', 'Mwamba', 'Sichone', 'Siame',
       'Nkonde', 'Mpundu', 'Katongo', 'Chama', 'Mukuka', 'Lombe', 'Kapapa', 'Chikwanda', 'Mwanza', 'Sinkala', 'Chilufya', 'Kabaso', 'Ngulube', 'Daka', 'Chirwa', 'Mvula', 'Sampa', 'Kafwimbi', 'Chisala', 'Mubanga']
NICK = ['Shorty', 'Bigman', 'Chief', 'Small', 'Pastor', 'Doctor', 'Teacher', 'Lucky', 'Junior', 'Sweetie', 'Champion', 'Professor']
COMP = ['Chipulukusu', 'Kabushi', 'Masala', 'Twapia', 'Nkwazi', 'Mushili', 'Kawama', 'Lubuto', 'Chifubu', 'Kaloko', 'Pamodzi', 'Ndeke', 'Kanini', 'Kantolomba']
GRZ_PRI = ['Chipulukusu Primary', 'Kabushi Primary', 'Twapia Primary', 'Nkwazi Primary', 'Mushili Primary']
GRZ_SEC = ['Chifubu Secondary', 'Kansenshi Secondary', 'Pamodzi Secondary', 'Chipulukusu Secondary', 'Temweni Secondary', 'Kamba Secondary']
used = set()
def name(sex):
    while True:
        f = random.choice(GIRLS if sex == 'F' else BOYS); s = random.choice(SUR)
        k = frozenset([f.lower(), s.lower()])
        if k in real or (f, s) in used or f == s: continue
        used.add((f, s)); return f, s

STAFF = {'Clement': 's1', 'Lewis': 's2', 'Max': 's3', 'Kelvin': 's4', 'Dellah': 's5', 'Bernard': 's6', 'Richard': 's7', 'Delian': 's8', 'Marable': 's9', 'Chipo': 's10', 'Cristoph': 's11', 'Chisha': 's12', 'Merabe': 's13', 'Charles': 's14'}
kids = []; nid = [1001]
def mk(sex, section, residence, age, status='Active', entry=None, **kw):
    f, s = name(sex)
    yob = BASE.year - age
    dob = D(dt.date(yob, random.randint(1, 12), random.randint(1, 28))) if random.random() < .55 else ''
    c = dict(id=str(nid[0]), name=f, surname=s, nickname=random.choice(NICK) if random.random() < .18 else '', sex=sex, dob=dob, age='' if dob else age, ageAsOf='' if dob else D(BASE),
             section=section, residence=residence, status=status, entryDate=entry or '', referredBy='', responsible='', compound=random.choice(COMP), familyAddress='',
             languages=random.choice(['Bemba', 'Bemba and English', 'Bemba, Nyanja', 'Bemba and English']), father='', mother='', otherRelatives='', guardianName='', guardianRelation='', contact='',
             familyBackground=random.choice(['Parents alive', 'Single mother', 'Paternal orphan', 'Lives with grandmother', 'Double orphan']), schoolType='', schoolName='', grade='', skill='',
             educationAtEntry='', programmes=[], support=[], medical='Good', disabilities='None', objectives='', notes='', reintegrationDate='', closeDate='', closeReason='',
             importedFrom='Demo data (invented)', createdAt=entry or '2026-01-15', sectionToCheck=False)
    c.update(kw); nid[0] += 1
    if section != 'Luigi':
        g = random.random()
        if g < .93:
            rel = random.choice(['Mother', 'Grandmother', 'Aunt', 'Uncle', 'Father', 'Elder sister'])
            c['guardianName'] = random.choice(GIRLS + BOYS) + ' ' + (c['surname'] if rel in ('Mother', 'Father') else random.choice(SUR)); c['guardianRelation'] = rel
            c['contact'] = '0970 00%04d' % random.randint(0, 9999) if random.random() < .6 else ''
            c['familyAddress'] = c['compound'] + ' ' + str(random.randint(100, 2999))
    kids.append(c); return c

def school_for(c, age):
    if c['section'] == 'Nkwazi':
        if age <= 13 or random.random() < .6: c.update(schoolType='Nkwazi community school', schoolName='Cicetekelo Community School', grade='ECE' if age <= 7 else str(min(7, max(1, age - 7))))
        else: c.update(schoolType=random.choice(['GRZ secondary', 'GRZ secondary', 'Private school']), schoolName=random.choice(GRZ_SEC), grade=str(min(12, age - 5)))
    elif age <= 13: c.update(schoolType=random.choice(['Nkwazi community school', 'Minsundu school', 'GRZ primary']), grade=str(min(7, max(1, age - 6))))
    elif age <= 19: c.update(schoolType='GRZ secondary', schoolName=random.choice(GRZ_SEC), grade=str(min(12, max(8, age - 5))))
    else: c.update(schoolType=random.choice(['College / skills training', 'Not in school']), skill=random.choice(['Automotive mechanics', 'Carpentry', 'Agriculture']))
    if c['schoolType'] == 'GRZ primary': c['schoolName'] = random.choice(GRZ_PRI)
    if c['schoolType'] == 'Minsundu school': c['schoolName'] = 'Minsundu Community School'

# ---- UCC (Minsundu children): residents and a few non-residents, boys
ucc = []
for i in range(20):
    a = random.randint(9, 15); c = mk('M', 'UCC', 'Resident', a, entry=rnd_date('2022-03-01', '2026-06-30'), responsible=random.choice(['s3', 's4', 's5']),
                                    referredBy=random.choice(['District Social Welfare Office', 'District Social Welfare Office', 'Luigi Drop-in', 'Community', 'Police (Victim Support)']))
    school_for(c, a); c['programmes'] = ['ABA'] if random.random() < .45 else []; c['support'] = ['Nutrition', 'Medical'] if random.random() < .3 else ['Nutrition']; ucc.append(c)
for i in range(8):
    a = random.randint(10, 16); c = mk('M', 'UCC', 'Non-resident', a, entry=rnd_date('2021-01-01', '2026-05-30'), responsible=random.choice(['s3', 's4']), referredBy='Community'); school_for(c, a); ucc.append(c)
# ---- Youth: residents and non-residents, boys
youth = []
for i in range(18):
    a = random.randint(15, 21); c = mk('M', 'Youth', 'Resident', a, entry=rnd_date('2019-01-01', '2026-04-30'), responsible=random.choice(['s2', 's13', 's14']), referredBy=random.choice(['District Social Welfare Office', 'Children section (UCC)', 'Community']))
    school_for(c, a); c['programmes'] = ['ABA'] if random.random() < .3 else []; youth.append(c)
for i in range(30):
    a = random.randint(16, 23); c = mk('M', 'Youth', 'Non-resident', a, entry=rnd_date('2017-01-01', '2026-03-30'), responsible=random.choice(['s2', 's13', 's14', 's6']), referredBy=random.choice(['Community development', 'District Social Welfare Office', 'Community']))
    school_for(c, a); c['programmes'] = random.choice([[], [], ['ZAS'], ['ABA']]); youth.append(c)
# ---- Nkwazi: girls and boys, non-residents
nkw = []
for i in range(70):
    sex = 'F' if i < 40 else 'M'; a = random.randint(6, 17)
    c = mk(sex, 'Nkwazi', 'Non-resident', a, entry=rnd_date('2020-01-01', '2026-09-30'), responsible='s12', referredBy=random.choice(['Community school recruitment'] * 6 + ['Stakeholder', 'Stakeholder', 'Luigi Drop-in', 'New admission', 'APJ']))
    school_for(c, a); c['support'] = ['Nutrition'] + (['Girl-child activities'] if sex == 'F' and a >= 10 else []); c['programmes'] = ['ABA'] if random.random() < .35 else (['Muchinga'] if random.random() < .1 else [])
    if random.random() < .11: c['status'] = 'Semi-active'
    nkw.append(c)
# ---- Luigi: street-connected children, boys and girls
lui = []
for i in range(55):
    sex = 'F' if i < 17 else 'M'; a = random.randint(9, 22)
    c = mk(sex, 'Luigi', 'Non-resident', a, entry='', responsible='s11', compound=random.choice(['Chipulukusu'] * 5 + COMP))
    c['createdAt'] = rnd_date('2026-02-01', '2026-10-31') if i % 7 else rnd_date('2026-10-12', '2026-11-06')
    c['familyAddress'] = ''; c['guardianName'] = ''; lui.append(c)
# ---- reintegrated (2-year follow-up) and closed files
moves = []
def move(cid, typ, date, by='s6', **kw): moves.append(dict(id='m%d' % (len(moves) + 1), childId=cid, type=typ, date=date, by=by, **kw))
follow = []
for i in range(14):
    sec = 'UCC' if i < 9 else 'Youth'; a = random.randint(10, 15) if sec == 'UCC' else random.randint(16, 20)
    rd = rnd_date('2025-01-15', '2026-09-30') if i > 1 else ['2026-10-17', '2026-11-02'][i]
    c = mk('M', sec, 'Non-resident', a, status='Follow-up', entry=rnd_date('2021-01-01', '2024-12-31'), responsible=random.choice(['s6', 's7']), reintegrationDate=rd, referredBy='District Social Welfare Office')
    school_for(c, a); move(c['id'], 'reintegrated', rd, note='Went home to ' + random.choice(['the mother', 'the grandmother', 'an aunt', 'both parents']) + ' in ' + c['compound']); follow.append(c)
reasons = ['2-year follow-up completed', 'Left the programme, no longer comes', 'Aged out of the programme', 'Ran away / lost contact', 'Returned to Social Welfare', 'Transferred to another partner']
for i in range(7):
    sec = random.choice(['UCC', 'Youth', 'Nkwazi']); cd = rnd_date('2026-03-01', '2026-10-30') if i > 1 else ['2026-10-21', '2026-11-04'][i]
    c = mk('M' if sec != 'Nkwazi' else random.choice('MF'), sec, 'Non-resident', random.randint(12, 22), status='Closed', entry=rnd_date('2018-01-01', '2024-06-30'), closeDate=cd, closeReason=reasons[i % len(reasons)], responsible='s6')
    move(c['id'], 'closed', cd, reason=c['closeReason'], note='')
# Luigi to UCC: three children, the latest one last week
for i, d in enumerate(['2026-08-20', '2026-10-14', '2026-11-03']):
    c = lui[20 + i]; c.update(section='UCC', residence='Resident', entryDate=d, referredBy='Luigi Drop-in', responsible='s3', age=random.randint(11, 13), dob='', ageAsOf=D(BASE), compound='Chipulukusu')
    c['guardianName'] = ''; c['contact'] = ''; school_for(c, c['age'])
    if i == 2: c['schoolType'] = ''; c['schoolName'] = ''; c['grade'] = ''; c['notes'] = 'Brought from Luigi after night outreach. Family tracing to start.'
    move(c['id'], 'section', d, by='s11', **{'from': 'Luigi', 'to': 'UCC', 'note': 'Brought from Luigi Drop-in after outreach'})
    move(c['id'], 'residence', d, by='s3', **{'from': 'Non-resident', 'to': 'Resident'})
# Luigi to Nkwazi: two children who went back to school
for i, d in enumerate(['2026-03-10', '2026-06-02']):
    c = lui[24 + i]; a0 = c.get('entryDate') or '2025-06-01'
    c.update(section='Nkwazi', residence='Non-resident', referredBy='Luigi outreach', responsible='s12', age=random.randint(10, 13), dob='', ageAsOf=D(BASE), compound='Nkwazi', entryDate=min(a0, '2025-11-15'))
    c.update(schoolType='Nkwazi community school', schoolName='Cicetekelo Community School', grade=str(2 + i), support=['Nutrition'])
    move(c['id'], 'section', d, by='s11', **{'from': 'Luigi', 'to': 'Nkwazi', 'note': 'Back home, enrolled in the community school'})
# Nkwazi: three children who stopped school in February, one transferred to Minsundu
for i, c in enumerate([x for x in nkw if x['status'] == 'Active' and x['entryDate'] < '2025-06-01'][:4]):
    if i < 3: c.update(status='Closed', closeDate='2026-02-27', closeReason='Stopped school'); move(c['id'], 'closed', '2026-02-27', by='s12', reason='Stopped school')
    else: c.update(section='UCC', residence='Resident', sex='M'); move(c['id'], 'section', '2026-09-14', by='s12', **{'from': 'Nkwazi', 'to': 'UCC', 'note': 'For further intervention'})
# UCC to Youth (age)
for c in ucc[:2]:
    c.update(section='Youth', age=16, dob='', ageAsOf=D(BASE)); move(c['id'], 'section', '2026-09-01', by='s2', **{'from': 'UCC', 'to': 'Youth', 'note': 'Turned 16'})
# records with something missing, to show the checks
for c in random.sample(youth[18:], 4): c['guardianName'] = ''; c['contact'] = ''; c['mother'] = ''; c['father'] = ''
for c in random.sample(nkw, 5): c['compound'] = ''; c['familyAddress'] = ''
for c in random.sample(ucc[2:], 2): c['schoolType'] = ''
for c in random.sample(youth[18:], 3): c['sectionToCheck'] = True
# two non-residents who in fact stopped coming (for "Files to review")
gone = random.sample([c for c in youth[18:] if c['status'] == 'Active'], 3)
gone[0]['notes'] = 'He is now working as a bus conductor in town and no longer comes to the centre.'
gone[1]['objectives'] = 'Completed grade 12 in 2024. Encourage him to look for skills training.'
gone[1]['entryDate'] = '2016-02-11'

cur = lambda c: c['status'] in ('Active', 'Semi-active')
homes = [c for c in kids if c['section'] in ('UCC', 'Youth', 'Nkwazi') and (cur(c) or c['status'] == 'Follow-up') and c not in gone]

# ---- home visits (Family) and school visits, August to 8 November
FIND = {
 'Follow-up': ['The child is at home and going to school. The mother sells vegetables at the market.', 'Living with the grandmother. School fees are paid; food is short at the end of the month.',
               'The boy is at home but stopped school in September. Talked with the aunt about going back in January.', 'Family is stable. The child helps in the garden after school.'],
 'Assessment': ['House of two rooms, six people. The mother works as a maid; the father is in Lusaka.', 'Grandmother willing to care for the child; needs support for school requirements.',
                'Family moved from Kabushi to Twapia. Neighbours confirmed the address.'],
 'Family tracing': ['Found the uncle in Kawama after asking at the church. He knew the child had left home.', 'Nobody knew the family at the first address; a neighbour gave a new one in Mushili.',
                    'Traced the mother in Luanshya through Social Welfare. First meeting went well.'],
 'Emergency': ['Child reported beaten at home. Talked with the guardian and informed Social Welfare.', 'The girl has not come to Nkwazi for two weeks. She is looking after a sick younger brother.'],
}
ACTIONS = ['Visit again in December with the school results', 'Ask Social Welfare about the support letter', 'Bring the guardian to the Monday meeting', 'Help the family with school requirements for January',
           'Counselling session for the child', 'Find the father\'s phone number', 'Check school attendance with the teacher']
visits = []
def visit(c, date, purpose, by, ok='Yes', where='Home', place='', action=''):
    v = dict(id='v%d' % (len(visits) + 1), childId=c['id'], date=date, purpose=purpose, where=where, by=by, successful=ok, metWith='' if ok == 'No' else random.choice(['Mother', 'Grandmother', 'Aunt', 'Guardian', 'Uncle', 'Father']) if where == 'Home' else 'Class teacher',
             place=place, stillHome=('Yes' if random.random() < .85 else 'No') if purpose == 'Follow-up' and ok == 'Yes' else '', findings='' if ok == 'No' else random.choice(FIND.get(purpose, ['Talked with the teacher. Attendance is good; results are average.', 'The boy was absent three days last week. The teacher will call us.', 'Good progress in maths, weak in English.'])),
             action=action, actionDone=bool(action) and date < '2026-10-15', recordedBy=by, recordedOn=date)
    visits.append(v)
earlier = [c for c in homes if random.random() < .75]
for c in earlier:
    purpose = 'Follow-up' if c['status'] == 'Follow-up' else random.choice(['Follow-up', 'Assessment', 'Follow-up'])
    lo = max('2026-02-02', c['entryDate'] or '2026-02-02', c['reintegrationDate'] or '2026-02-02')
    if lo < '2026-07-31': visit(c, rnd_date(lo, '2026-07-31'), purpose, random.choice(['s6', 's7']), 'Yes')
months = [('2026-08-01', '2026-08-31', 40), ('2026-09-01', '2026-09-30', 42), ('2026-10-01', '2026-10-31', 44), ('2026-11-02', '2026-11-08', 12)]
for a, b, n in months:
    def due(c):
        last = max([v['date'] for v in visits if v['childId'] == c['id'] and v['purpose'] != 'School visit'] or ['2025-06-01'])
        every = 90 if (c['residence'] == 'Resident' or c['status'] == 'Follow-up') else 180
        return D(day(last) + dt.timedelta(days=every + random.randint(-20, 20)))
    for c in sorted(homes, key=due)[:n]:
        purpose = 'Follow-up' if c['status'] == 'Follow-up' else random.choice(['Follow-up', 'Follow-up', 'Assessment', 'Family tracing', 'Emergency'] if c['section'] != 'Nkwazi' else ['Follow-up', 'Assessment', 'Emergency'])
        ok = 'No' if random.random() < .13 else 'Yes'
        visit(c, rnd_date(a, b), purpose, random.choice(['s6', 's7', 's6']), ok, action=random.choice(ACTIONS) if ok == 'Yes' and random.random() < .3 else '')
    sch = [c for c in kids if cur(c) and c['schoolType'] in ('GRZ primary', 'GRZ secondary')]
    for c in random.sample(sch, max(3, n // 3)):
        visit(c, rnd_date(a, b), 'School visit', random.choice(['s8', 's13']), 'Yes', where='School', place=c['schoolName'] or 'GRZ school')
# the newest UCC child: family tracing planned, one visit done
newest = lui[22]; visit(newest, '2026-11-05', 'Family tracing', 's6', 'Yes', action='Second visit with the mother and Social Welfare')
visits[-1]['findings'] = 'Found the mother in Chipulukusu. She agreed to meet at the centre next week.'

# ---- events (residents)
events = []
res = [c for c in kids if c['residence'] == 'Resident' and cur(c)]
ETXT = {'Visited family': 'Weekend at home', 'Bonding with family': 'Two weeks at home before reintegration', 'Sick, medical attention': random.choice(['Malaria, taken to the clinic', 'Stomach pains, clinic', 'Cough, clinic']), 'Sneaked out': 'Left the centre at night', 'Came back': 'Came back by himself'}
for a, b, n in months:
    for c in random.sample(res, min(len(res), n // 2)):
        t = random.choice(['Visited family', 'Visited family', 'Bonding with family', 'Sick, medical attention'])
        events.append(dict(id='e%d' % (len(events) + 1), childId=c['id'], type=t, date=rnd_date(a, b), note=ETXT[t], by=random.choice(['s3', 's4', 's13'])))
sneak = random.choice([c for c in res if c['section'] == 'UCC'])
events += [dict(id='e900', childId=sneak['id'], type='Sneaked out', date='2026-10-10', note='Left the centre at night with an older boy', by='s4'), dict(id='e901', childId=sneak['id'], type='Came back', date='2026-10-13', note='Found by the Luigi team in town', by='s11')]

# ---- Luigi outreach and drop-in sessions
outreach = []
d = dt.date(2026, 8, 3)
luigi_now = lambda date: [c for c in lui if (c['section'] == 'Luigi' or c['entryDate'] > date) and c['createdAt'] <= date]
regular = set(c['id'] for c in random.sample(lui, 25))
while d < BASE:
    wd = d.weekday(); ds = D(d)
    types = (['Drop-in'] if wd in (0, 2, 4) else []) + (['Day outreach'] if wd in (1, 3) else []) + (['Night outreach'] if wd == 4 else [])
    for t in types:
        pool = luigi_now(ds)
        if not pool: continue
        n = {'Drop-in': random.randint(14, 26), 'Day outreach': random.randint(8, 16), 'Night outreach': random.randint(10, 18)}[t]
        w = [3 if c['id'] in regular else 1 for c in pool]
        pick = set()
        while len(pick) < min(n, len(pool)): pick.add(random.choices(pool, w)[0]['id'])
        outreach.append(dict(id='o%d' % (len(outreach) + 1), date=ds, type=t, staff=random.choice(['Cristoph', 'Cristoph and Kelvin', 'Luigi team']), children=sorted(pick),
                             notes=random.choice(['', '', 'Football in the afternoon', 'Many children at Masala market', 'Two new boys from Chipulukusu', 'Rain, fewer children'])))
    d += dt.timedelta(days=1)
# newly created Luigi children: make sure they appear on their first day
for c in lui:
    if c['section'] != 'Luigi': continue
    s = next((o for o in outreach if o['date'] >= c['createdAt']), None)
    if s and c['id'] not in s['children']: s['children'].append(c['id'])

# ---- counseling sessions
TOP = ['Respect and obedience', 'Dangers of smoking and Bostik', 'Personal hygiene', 'Self-esteem', 'Goal setting', 'Peer pressure', 'Importance of school', 'Family values', 'Grief', 'Anger management']
sessions = []
for a, b, n in months:
    for i in range(n // 2):
        t = random.choice(['Individual', 'Individual', 'Group', 'Group', 'Family'])
        cen = random.choice(['Minsundu', 'Minsundu', 'Luigi', 'Nkwazi'])
        pool = [c for c in kids if cur(c) and (c['section'] in ('UCC', 'Youth') if cen == 'Minsundu' else c['section'] == cen)]
        c = random.choice(pool)
        date = rnd_date(a, b)
        sessions.append(dict(id='c%d' % (len(sessions) + 1), date=date, type=t, centre=cen, by='s10', children=[] if t == 'Group' else [c['id']], others=random.randint(8, 30) if t == 'Group' else 0,
                             topic=random.choice(TOP), action=random.choice(['', '', 'See again in two weeks', 'Talk with the guardian']) if t != 'Group' else '', actionDone=date < '2026-10-20'))

# ---- attendance at Minsundu, 1 October to 8 November
att = {}
resid = [c for c in kids if c['section'] in ('UCC', 'Youth') and c['residence'] == 'Resident']
nonres = [c for c in kids if c['section'] in ('UCC', 'Youth') and c['residence'] == 'Non-resident' and cur(c)]
missing = random.sample([c for c in resid if c['entryDate'] < '2026-10-01'], 2)
_nk = [c for c in nkw if c['status'] == 'Active' and c['section'] == 'Nkwazi' and c['entryDate'] < '2026-01-01']
nk_long, nk_short = _nk[3], _nk[7]
d = dt.date(2026, 10, 1)
while d < BASE:
    ds = D(d); day_ = {}
    for c in resid:
        if c['entryDate'] > ds: continue
        if c is missing[0] and ds >= '2026-11-05': day_[c['id']] = 'A'; continue
        if c is missing[1] and ds >= '2026-11-04': day_[c['id']] = 'A'; continue
        r = random.random(); day_[c['id']] = 'P' if r < .9 else 'H' if r < .96 else 'A'
    if d.weekday() < 5:
        for c in nonres:
            if c in gone: continue
            if random.random() < .35: day_[c['id']] = 'P'
    for c in gone:
        if d.weekday() < 5 and random.random() < .3: day_[c['id']] = 'A'
    if d.weekday() < 5:
        for c in nkw:
            if not cur(c) or c['section'] != 'Nkwazi' or (c['entryDate'] or '') > ds: continue
            if c is nk_long: day_[c['id']] = 'A'; continue
            if c is nk_short and ds >= '2026-11-03': day_[c['id']] = 'A'; continue
            day_[c['id']] = 'P' if random.random() < .88 else 'A'
    att[ds] = day_; d += dt.timedelta(days=1)

# ---- report figures (real, from the section reports), report statuses and targets
pk = json.load(open('/home/claude/reports/pack-v3-nophotos.json'))
hist = pk['history']
for h in hist: h['note'] = h['note'].replace(' 2 brothers (Mbangu) taken back to the family.', ' 2 brothers taken back to the family.')
reports = {
 '2026-09': {k: {'prepared': {'by': b, 'date': '2026-10-05'}, 'checked': {'by': 's1', 'date': '2026-10-09'}} for k, b in [('Luigi', 's11'), ('Nkwazi', 's12'), ('UCC', 's3'), ('Family', 's6'), ('School', 's8')]},
 '2026-10': {'Luigi': {'prepared': {'by': 's11', 'date': '2026-11-04'}, 'checked': {'by': 's1', 'date': '2026-11-06'}}, 'UCC': {'prepared': {'by': 's3', 'date': '2026-11-03'}, 'checked': {'by': 's4', 'date': '2026-11-05'}},
             'School': {'prepared': {'by': 's8', 'date': '2026-11-02'}}, 'Family': {'prepared': {'by': 's6', 'date': '2026-11-06'}}},
}
staff = [['Clement', 'Education Department', True], ['Lewis Chewe', 'Youth', True], ['Maxwell Lungu', 'UCC', False], ['Kelvin Chongo', 'UCC', False], ['Dellah Victoria Shilubwe', 'UCC', False], ['Bernard', 'Family', False],
         ['Richard Kasela', 'Family', False], ['Delian Nachula', 'School', False], ['Marable', 'School', False], ['Madame Chipo', 'Counseling', False], ['Cristoph', 'Luigi', False], ['Chisha', 'Nkwazi', False],
         ['Merabe', 'Youth', False], ['Charles', 'Youth', False], ['Pippen', 'Sports', False], ['Mauro (evaluation)', 'Other', True], ['Ana (evaluation)', 'Other', True]]
plan_kids = [c for c in homes if any(v['childId'] == c['id'] and v['date'] >= '2026-11-01' and v['purpose'] != 'School visit' for v in visits)][:6]
plan_kids += [c for c in homes if c not in plan_kids and c['status'] != 'Closed'][10:16] + [c for c in lui if c['section'] == 'Luigi'][:3]
plans = [dict(id='p%d' % i, childId=c['id'], month='2026-11', team='Family' if c['section'] != 'Luigi' else 'Luigi', purpose='Follow-up' if c['section'] != 'Luigi' else 'Assessment', createdBy='s6' if c['section'] != 'Luigi' else 's11', createdAt='2026-10-29') for i, c in enumerate(plan_kids)]
# each section records its own visits; Luigi staff visit the families of Luigi children
for v in visits: v['team'] = 'School' if v['purpose'] == 'School visit' else 'Family'
_lk = [c for c in lui if c['section'] == 'Luigi']
visits.append(dict(id='vL1', childId=_lk[1]['id'], team='Luigi', date='2026-11-05', purpose='Assessment', where='Home', by='s23', successful='Yes', metWith='Mother', place='', stillHome='', findings='The mother sells vegetables at the market. Three younger children at home. She agrees that the boy comes to the drop-in centre every day.', action='Second visit with the Family Section', actionDone=False, recordedBy='s23', recordedOn='2026-11-05'))
visits.append(dict(id='vL2', childId=_lk[2]['id'], team='Luigi', date='2026-11-06', purpose='Assessment', where='Home', by='s24', successful='No', metWith='', place='', stillHome='', findings='Nobody at home. A neighbour says the family moved in October.', action='', actionDone=False, recordedBy='s24', recordedOn='2026-11-06'))
# who did each Luigi sheet: different staff for drop-in, day outreach and night outreach
_who = {'Drop-in': [['s11', 's23'], ['s23'], ['s11', 's10']], 'Day outreach': [['s24', 's23'], ['s24']], 'Night outreach': [['s11', 's24']]}
_nm = {'s10': 'Chippo Choongo', 's11': 'Cristoph', 's23': 'Iness Phiri', 's24': 'Jack Nyirongo'}
for i, o in enumerate(outreach):
    ids = _who[o['type']][i % len(_who[o['type']])]; o['staffIds'] = ids; o['staff'] = ', '.join(_nm[x] for x in ids)
# Luigi: relatives on the street, children back on the street, findings of the day
for i, c in enumerate(_lk):
    if i % 5 == 0: c['relStreet'] = 'Yes'; c['relStreetWho'] = ['Mother', 'Older brother', 'Two brothers', 'Mother and sister'][(i // 5) % 4]
    elif i % 3 == 0: c['relStreet'] = 'No'
_lk[7]['backStreet'] = 'Family'; _lk[7]['backStreetDate'] = '2026-09-14'
_lk[12]['backStreet'] = 'Cicetekelo'; _lk[12]['backStreetDate'] = '2026-10-02'
_lk[21]['backStreet'] = 'Facility'; _lk[21]['backStreetDate'] = '2026-10-20'
_again = [c for c in kids if c['section'] == 'UCC' and c['residence'] == 'Non-resident' and c['status'] == 'Active'][0]
_f = {'Day outreach': ['Fewer children at Masala market than last week. Two boys say they sleep at the bus station now.', 'A group of five new boys from Chipulukusu, all under 12. They ask for the drop-in centre.'],
      'Night outreach': ['Most children sleep near Broadway. Glue is used more openly than last month.'],
      'Drop-in': ['Good day. Three children ask to go back to school.']}
_seen = {}
for o in sorted(outreach, key=lambda o: o['date'], reverse=True):
    k = _seen.get(o['type'], 0)
    if k < len(_f[o['type']]): o['findings'] = _f[o['type']][k]; _seen[o['type']] = k + 1
    if o['type'] == 'Day outreach' and k == 0: o['children'].append(_again['id'])
# Nkwazi has a few resident children too
for i, c in enumerate([c for c in kids if c['section'] == 'Nkwazi' and c['status'] in ('Active', 'Semi-active')]):
    if i % 9 == 0: c['residence'] = 'Resident'
for i, c in enumerate([c for c in lui if c['section'] == 'Luigi']):
    c['familyAddress'] = '' if i % 9 == 0 else c['compound']
state = dict(v=1, created=D(BASE), children=kids, visits=visits, events=events, moves=moves, sessions=sessions, outreach=outreach, attendance=att, reports=reports, history=hist, historyMissing=pk['missing'],
             staff=[dict(id='s%d' % (i + 1), name=s[0], section=s[1], admin=s[2], active=True) for i, s in enumerate(staff)],
             settings=dict(absence={'alert': 4, 'review': 30}, interval={'Resident': 90, 'Non-resident': 180, 'Follow-up': 90}, targets={'2026-10': {'homeVisits': 35, 'schoolVisits': 12}, '2026-11': {'homeVisits': 35, 'schoolVisits': 12}}),
             plans=plans, meta=dict(lastBackup='2026-11-06', imported='', demo=True))
for c in lui:
    c['streetCat'] = 'B' if int(c['id']) % 4 == 0 else 'A'; c['streetPlace'] = ['Masala market', 'Broadway', 'Town centre', 'Kansenshi'][int(c['id']) % 4]
json.dump(state, open('demo_state.json', 'w'), ensure_ascii=False)
from collections import Counter
print(len(kids), 'children', Counter((c['section'], c['status']) for c in kids))
print(len(visits), 'visits;', len(events), 'events;', len(moves), 'moves;', len(outreach), 'outreach;', len(sessions), 'sessions;', len(att), 'attendance days;', len(hist), 'report tables')
print('Luigi to UCC last week:', newest['name'], newest['surname'], newest['id'])
