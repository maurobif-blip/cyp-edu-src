/* ---------- Interactive report: the InteractiveReport of the CYP design system ----------
   A cover on the blue ground, then one chapter on the screen at a time. Chapters in a row on blue (number and name on a computer, the number on a phone).
   At the bottom Back and the primary button "Next: name of the next chapter" (also the keyboard arrows, and a swipe on a phone).
   A place is a ResultBand in the colour of the place, a section a ProgressRow in blue with its icon. A place or a list opens from a button Open.
   The next chapter comes in from the right, the one before from the left; rings draw, bars grow and numbers count once (dsEnter in dsafter.js).
   Nothing here is typed by hand: all is read from the records. */
const ST_PLACES = [['Luigi', 'Luigi', 'luigi'], ['Minsundu', 'Minsundu', 'minsundu'], ['Nkwazi', 'Nkwazi Centre', 'nkwazi']];
function stData(m) {
  const { a, b } = monthCtx(m), t = today(), end = b < t ? b : t, open = S.children.filter(c => c.status !== 'Closed');
  const days = Object.keys(S.attendance).filter(d => inRange(d, a, end)), sex = l => ({ f: l.filter(c => c.sex === 'F').length, m: l.filter(c => c.sex === 'M').length, n: l.length });
  const lu = S.outreach.filter(o => inRange(o.date, a, end) && !o.cancelled), luSeen = new Set(); lu.forEach(o => (o.children || []).forEach(id => luSeen.add(String(id))));
  const wk = d => { const k = new Date(d + 'T12:00:00').getDay(); return k !== 0 && k !== 6; }; let wd = 0; for (let d = a; d <= end; d = addDays(d, 1)) if (wk(d)) wd++;
  const places = ST_PLACES.map(([k, label, cls]) => { const kids = open.filter(c => centreOf(c) === k); let seen, taken, of;
    if (k === 'Luigi') { seen = kids.filter(c => luSeen.has(String(c.id))); taken = uniq(lu.filter(o => o.type === 'Drop-in' && wk(o.date)).map(o => o.date)).length; of = wd; }
    else { const key = c => attKey(c, k); seen = kids.filter(c => days.some(d => (S.attendance[d] || {})[key(c)] === 'P')); const ks = kids.map(key); const dd = days.filter(d => (k === 'Minsundu' || wk(d)) && ks.some(x => (S.attendance[d] || {})[x] != null)); taken = dd.length; of = k === 'Minsundu' ? Number(end.slice(8)) : wd; }
    return { k, label, cls, kids: sex(kids), seen: sex(seen), taken, of, href: '#/attendance?c=' + k }; });
  const plan = team => { const pl = planFor(m, team); return [pl.filter(p => planStatus(p).k === 'done').length, pl.length]; }, [fd, fp] = plan('Family'), [sd, sp] = plan('School');
  const cs = counselStats(a, b).all, tasks = taskAll(), ends = taskEnds(), openT = tasks.filter(x => !taskDone(x, ends));
  const sections = [
    { label: 'Family Section', what: 'Home visits of the plan done', val: fd, of: fp, note: 'No plan of visits for this month', href: `#/visits?vt=Family&vtab=plan&m=${m}` },
    { label: 'School Section', what: 'Pupils of the plan visited at school', val: sd, of: sp, note: 'No plan of visits for this month', href: `#/visits?vt=School&vtab=plan&m=${m}` },
    { label: 'Counselling', what: 'Children counselled, each child once', val: cs.all.length + cs.others, of: 0, note: (cs.nInd + cs.nGrp + cs.nFam) + ' sessions', href: '#/reports?s=Counseling&cv=month' }];
  return { m, a, b: end, open: sex(open), places, sections, tasks: { open: openT.length, late: openT.filter(taskLate).length, done: tasks.filter(x => { const d = taskDone(x, ends); return d && inRange((d.date || '').slice(0, 10), a, end); }).length, list: openT.filter(taskLate).slice(0, 5) }, wait: S.visits.filter(v => visitState(v) === 'wait').length };
}
const stNum = n => `<span class="st-n" data-n="${Number(n) || 0}">${(Number(n) || 0).toLocaleString('en-GB')}</span>`;
function stArcs(parts) { /* parts: [[class, value, label]]; slices start at the top and run clockwise, in the order given */
  const tot = parts.reduce((s, x) => s + x[1], 0) || 1; let off = 0;
  return parts.map(([cls, v]) => { const sh = Math.round(1000 * v / tot) / 10, c = `<circle class="cyp-c-${cls}" cx="120" cy="120" r="98" pathLength="100" stroke-dasharray="${sh} ${100 - sh}" stroke-dashoffset="${-off}"/>`; off += sh; return c; }).join('');
}
function stPages(D) {
  const mon = fmtMonth(D.m), pct = (v, of) => of ? Math.round(100 * v / of) : 0, n = v => (Number(v) || 0).toLocaleString('en-GB');
  const open = (href, what) => `<a class="cyp-btn" href="${href}" aria-label="Open ${esc(what)}">Open</a>`;
  /* bands and rows that open more detail are the tap target themselves, with chevron-right (ResultBand, ProgressRow, 24/11) */
  const go = dsIcon('go').replace('cyp-icon', 'cyp-icon cyp-go'), pdisc = k => typeof PLACE_ICON !== 'undefined' && PLACE_ICON[k] ? `<span class="cyp-disc"><svg viewBox="0 0 24 24" aria-hidden="true">${PLACE_ICON[k]}</svg></span>` : pinDisc('');
  const band = x => `<a class="cyp-result cyp-result--app cyp-result--link cyp-c-${x.cls}" href="${x.href}" aria-label="${esc(x.label)}: open the register"><div class="cyp-result__text st-first"><svg class="cyp-ring" viewBox="0 0 240 240" role="img" aria-label="Girls ${x.seen.f}, boys ${x.seen.m}">${stArcs([['navy', x.seen.f], ['sky', x.seen.m]])}</svg><div><b>${stNum(x.seen.n)} of ${n(x.kids.n)} children</b><br>Girls ${x.seen.f}, boys ${x.seen.m}</div></div>
      <div class="cyp-result__name">${pdisc(x.k)}<span class="heading-2">${esc(x.label)}</span></div>
      <div class="cyp-result__block"><div><span class="figure">${stNum(pct(x.seen.n, x.kids.n))}%</span><small>${x.k === 'Luigi' ? 'met this month' : 'present at least once'}</small></div></div>
      <div class="cyp-result__action">${go}</div></a>`;
  /* a row with a target: name, %, Open, bar, figures. Without a target (count): name, value, Open, unit with no target set */
  const pw = (href, cls, inner, what) => href ? `<a class="${cls} cyp-prow--link" href="${href}" aria-label="Open ${esc(what)}">${inner}</a>` : `<div class="${cls}">${inner}</div>`;
  const prow = (cls, disc, name, val, of, left, right, href, what, unit) => of ? pw(href, `cyp-prow cyp-c-${cls}`, `<span class="cyp-prow__head">${disc}<span class="cyp-prow__name">${esc(name)}</span><span class="cyp-prow__pct">${pct(val, of)}%</span>${href ? go : ''}</span><span class="cyp-bar"><i style="width:${Math.min(100, pct(val, of))}%"></i></span><span class="cyp-prow__figs"><span>${esc(left)}</span><span>${esc(right)}</span></span>`, what)
    : pw(href, `cyp-prow cyp-prow--count cyp-c-${cls}`, `<span class="cyp-prow__head">${disc}<span class="cyp-prow__name">${esc(name)}</span><span class="cyp-prow__pct">${stNum(val)}</span>${href ? go : ''}</span><span class="cyp-prow__figs"><span>${esc(unit)}, no target set</span></span>`, what);
  const plan = D.sections.filter(x => x.label !== 'Counselling'), cs = D.sections.find(x => x.label === 'Counselling');
  const tile = (label, fig, note) => `<div class="cyp-stat"><span class="cyp-stat__label label-caps">${esc(label)}</span><span class="cyp-stat__figure figure">${stNum(fig)}</span><span class="cyp-stat__note">${esc(note)}</span></div>`;
  return [
    { k: 'cover', cover: true, html: `<div class="cyp-ground st-cover"><div class="cyp-plate st-seal"><img src="${LOGO}" alt="Seal of the Cicetekelo Youth Project"></div><p class="label-caps">Cicetekelo Youth Project</p><h1 class="cover-title">Education Department</h1><p class="st-sub">${esc(mon)}</p><p class="small">Read from the records of CYP EDU on ${dxDate(today())}</p><a class="cyp-btn st-start" href="#/story?m=${D.m}&p=1">Open the report${dsIcon('right')}</a></div>` },
    { k: 'children', nav: 'Children', title: 'Children with an open file in ' + mon, html: `<div class="cyp-tiles">${tile('Children', D.open.n, 'Each child is counted once')}${tile('Girls', D.open.f, 'With an open file')}${tile('Boys', D.open.m, 'With an open file')}</div>
        <div class="cyp-card"><div class="cyp-donut"><svg viewBox="0 0 240 240" role="img" aria-label="Children by centre: ${esc(D.places.map(x => x.label + ' ' + x.kids.n).join(', '))}">${stArcs(D.places.map(x => [x.cls, x.kids.n]))}</svg><div><h3 class="heading-3 st-h3">Children by the centre that follows them</h3><ul class="cyp-legend">${D.places.map(x => `<li class="cyp-c-${x.cls}"><i class="cyp-swatch"></i><span class="label-caps">${esc(x.label)}</span><b>${n(x.kids.n)}</b></li>`).join('')}</ul></div></div></div>
        <div>${`<a class="cyp-btn" href="#/children">Open the list of children</a>`}</div>` },
    { k: 'centres', nav: 'Centres', title: 'The three centres in ' + mon, html: `<p class="st-lead">Children present or met at least once in the month, out of the children with an open file.</p><div>${D.places.map(band).join('')}</div>` },
    { k: 'sections', nav: 'Sections', title: 'Family, School and Counselling in ' + mon, html: `<div class="cyp-card st-narrow"><h3 class="heading-3">The plan of the month against what is recorded</h3>${plan.map(x => { const u = x.label === 'Family Section' ? 'home visits done' : 'pupils visited at school', all = plan.every(y => y.of); return prow('blue', secDisc(x.label), x.label, x.val, all ? x.of : 0, x.val + ' ' + u, 'of ' + x.of + ' in the plan', x.href, 'the plan of the ' + x.label, u); }).join('')}</div>
        <div class="cyp-tiles st-narrow st-one">${tile('Children counselled', cs.val, cs.note + ', each child counted once')}</div><div><a class="cyp-btn" href="${cs.href}">Open Counselling</a></div>` },
    { k: 'registers', nav: 'Registers', title: 'Registers taken in ' + mon, html: `<div class="cyp-card st-narrow"><h3 class="heading-3">Days with the register taken</h3>${D.places.map(x => prow(x.cls, pinDisc('', true), x.label, x.taken, x.of, x.taken + ' days taken', 'of ' + x.of + (x.k === 'Minsundu' ? ' days' : ' weekdays'), x.href, 'the register of ' + x.label, 'days taken')).join('')}</div><p class="st-lead">Days of the month so far. Minsundu counts every day, Luigi and Nkwazi Centre the weekdays.</p>` },
    { k: 'office', nav: 'Open points', title: 'Tasks and visits still open', html: `<div class="cyp-tiles">${tile('Tasks open', D.tasks.open, D.tasks.late + ' late')}${tile('Tasks done this month', D.tasks.done, 'Closed with Done')}${tile('Visits to validate', D.wait, 'Waiting for the Education office')}</div>
        ${D.tasks.list.length ? `<div class="cyp-card st-narrow"><h3 class="heading-3">Tasks that are late</h3><div class="st-list">${D.tasks.list.map(x => `<div class="cyp-row"><div class="cyp-row__text"><b>${esc(x.title || 'Task')}</b><span>${esc(taskWho(x))} · to do by ${dxDate(x.due)}</span></div><span class="cyp-tag cyp-tag--warn">${dsIcon('alert')}Late</span></div>`).join('')}</div></div>` : ''}
        <div class="st-acts"><a class="cyp-btn" href="#/tasks?v=all">Open Tasks</a><a class="cyp-btn" href="#/visits?vtab=check">Open the visits to validate</a></div>` }
  ];
}

/* ---------- the year (Mauro's comment of 25/11): first what CYP reports every year (the annual report of APJ23, 2025),
   then some indicators of the new logframe, then the chapters of the month read from the records ----------
   Figures of the annual report 2025 are shown beside, as they were printed. */
const ST_AR2025 = { luigi: 320, nkwazi: 144, minsundu: 128, family: 145, school: 197 };
function stOpenIn(c, a, b) { return inCareOn(c, a) || inRange(c.entryDate, a, b) || S.moves.some(x => x.type === 'reopened' && String(x.childId) === String(c.id) && inRange(x.date, a, b)); }
function stYear(y) {
  const a = y + '-01-01', yEnd = y + '-12-31', b = yEnd < today() ? yEnd : today(), rng = y + '-01~' + y + '-12', sex = l => ({ f: l.filter(c => c.sex === 'F').length, m: l.filter(c => c.sex === 'M').length, n: l.length });
  /* Luigi: each child once, in the first group that fits (drop-in, then night outreach, then day outreach, then the rest) */
  const L = luigiReportData(a, b), st = L.sets, inS = (k, id) => st[k].has(id), allL = [...st.all];
  const dropin = allL.filter(id => inS('dropin', id)), night = allL.filter(id => !inS('dropin', id) && inS('night', id)), day = allL.filter(id => !inS('dropin', id) && !inS('night', id) && inS('day', id)), rest = allL.filter(id => !inS('dropin', id) && !inS('night', id) && !inS('day', id));
  const luMonths = uniq(S.outreach.filter(o => inRange(o.date, a, b) && !o.cancelled).map(o => o.date.slice(0, 7))).length;
  /* Nkwazi community school: children with the community school written as school, with a file open during the year */
  const cs = S.children.filter(c => dayType(c) === 'Nkwazi community school' && stOpenIn(c, a, b)), csN = cs.filter(c => centreOf(c) !== 'Minsundu'), csM = cs.filter(c => centreOf(c) === 'Minsundu');
  /* Minsundu: the rows of the UCC and Youth reports, counted on the year, each child once */
  const rowsOf = sec => { const o = {}; for (const r of REPORTS[sec].rows(rng)) o[r[1]] = r[3]; return o; }, U = rowsOf('UCC'), Yo = rowsOf('Youth'), both = k => uniq((U[k] || []).concat(Yo[k] || []));
  const mins = S.children.filter(c => centreOf(c) === 'Minsundu'), minsIds = new Set(mins.map(c => String(c.id)));
  const closed = distinctChildren(movesIn('closed', a, b).map(x => x.childId).filter(id => minsIds.has(String(id))));
  const worked = both('Total worked with'), res = l => l.filter(c => c.residence === 'Resident');
  /* Family and School: the first row of their reports, on the year */
  const first = k => { const r = REPORTS[k].rows(rng)[0]; return r ? r[3] : []; };
  /* new logframe indicators that the records can already give */
  const ids = new Set(); for (const d of Object.keys(S.attendance)) if (inRange(d, a, b)) for (const [k, v] of Object.entries(S.attendance[d])) if (v === 'P' || v === 'H' || v === 'B') ids.add(String(k).split('@')[0]);
  for (const o of S.outreach) if (inRange(o.date, a, b)) for (const id of o.children || []) ids.add(String(id)); for (const v of S.visits) if (inRange(v.date, a, b)) ids.add(String(v.childId)); for (const x of S.sessions) if (inRange(x.date, a, b)) for (const id of x.children || []) ids.add(String(id));
  const reach = distinctChildren([...ids]), rein = S.children.filter(c => inRange(c.reintegrationDate, a, b)), PR = promotedIn(Number(y));
  const sports = actGroups().Sports || [], sp = new Set(); for (const d of Object.keys(S.attendance)) if (inRange(d, a, b)) for (const k of Object.keys(S.attendance[d])) { const i = k.indexOf('@act:'); if (i > 0 && sports.includes(k.slice(i + 5))) sp.add(k.slice(0, i)); }
  S.children.forEach(c => { if (c.status !== 'Closed' && actOf(c).some(x => sports.includes(x))) sp.add(String(c.id)); });
  return { y, a, b, luigi: { all: allL.length, parts: [dropin.length, night.length, day.length, rest.length], months: luMonths },
    school: { all: sex(cs), nb: csN.filter(c => c.sex !== 'F').length, ng: csN.filter(c => c.sex === 'F').length, mi: csM.length },
    mins: { worked: sex(worked), start: res(both('Brought forward from last month')).length, non: worked.filter(c => c.residence !== 'Resident').length, nw: both('New admissions').length, out: closed.length, rein: both('Reintegrated').length, end: res(both('Present at the end of the month')).length },
    family: sex(first('Family')), schoolSec: sex(first('School')),
    lf: { reach: sex(reach), rein: sex(rein), pr: PR, sport: sex(distinctChildren([...sp])) } };
}
function stYearPages(Y, month) {
  const n = v => (Number(v) || 0).toLocaleString('en-GB'), pct = (v, of) => of ? Math.round(100 * v / of) : 0;
  const tile = (label, fig, note) => `<div class="cyp-stat"><span class="cyp-stat__label label-caps">${esc(label)}</span><span class="cyp-stat__figure figure">${stNum(fig)}</span><span class="cyp-stat__note">${esc(note)}</span></div>`;
  const was = k => `<p class="st-lead">Annual report 2025: <b>${n(ST_AR2025[k])}</b>. Counted from the records in CYP EDU; what was not recorded in the app is missing.</p>`;
  const donut = (title, parts, cls) => `<div class="cyp-card"><div class="cyp-donut"><svg viewBox="0 0 240 240" role="img" aria-label="${esc(title + ': ' + parts.map(x => x[0] + ' ' + x[1]).join(', '))}">${stArcs(parts.map((x, i) => [cls[i], x[1]]))}</svg><div><h3 class="heading-3 st-h3">${esc(title)}</h3><ul class="cyp-legend">${parts.map((x, i) => `<li class="cyp-c-${cls[i]}"><i class="cyp-swatch"></i><span class="label-caps">${esc(x[0])}</span><b>${n(x[1])}</b></li>`).join('')}</ul></div></div></div>`;
  const yr = 'in ' + Y.y, C4 = ['navy', 'sky', 'luigi', 'nkwazi'], L = Y.luigi, Sc = Y.school, M = Y.mins, LF = Y.lf;
  const draft = '<span class="cyp-tag cyp-tag--warn">Draft</span>';
  return [
    { k: 'luigi', nav: 'Luigi', title: 'Luigi Drop-in Centre ' + yr, html: `<div class="cyp-tiles st-narrow st-one">${tile('Children worked with', L.all, 'Each child counted once · months with records: ' + L.months)}</div>
        ${donut('Where the children were met', [['Drop-in centre', L.parts[0]], ['Night outreach only', L.parts[1]], ['Day outreach only', L.parts[2]], ['Other organisations and transfers', L.parts[3]]], C4)}${was('luigi')}<div><a class="cyp-btn" href="#/reports?s=Luigi&p=Y&m=${month}">Open the Luigi report of the year</a></div>` },
    { k: 'cschool', nav: 'Community school', title: 'Nkwazi community school ' + yr, html: `<div class="cyp-tiles st-narrow st-one">${tile('Pupils', Sc.all.n, 'With a file open during the year')}</div>
        ${donut('The pupils', [['Boys of Nkwazi Centre', Sc.nb], ['Girls of Nkwazi Centre', Sc.ng], ['Children of Minsundu', Sc.mi]], ['navy', 'sky', 'minsundu'])}${was('nkwazi')}` },
    { k: 'minsundu', nav: 'Minsundu', title: 'Minsundu Centre ' + yr, html: `<div class="cyp-tiles">${tile('Children worked with', M.worked.n, 'UCC and Youth, each child once')}${tile('Residents on 1 January', M.start, 'In care at the start of the year')}${tile('Non-residents', M.non, 'Worked with during the year')}</div>
        <div class="cyp-tiles">${tile('New admissions', M.nw, 'During the year')}${tile('Files closed', M.out, 'Discharged, transferred or returned')}${tile('Reintegrated', M.rein, 'Back with the family')}${tile('Residents at the end', M.end, Y.b < Y.y + '-12-31' ? 'On ' + dxDate(Y.b) : 'On 31 December')}</div><p class="st-lead">Residents and non-residents as written in the file today.</p>${was('minsundu')}` },
    { k: 'famsch', nav: 'Family and School', title: 'Family and School Sections ' + yr, html: `<div class="cyp-tiles">${tile('Family Section', Y.family.n, 'Children worked with (FML 1) · annual report 2025: ' + n(ST_AR2025.family))}${tile('School Section', Y.schoolSec.n, 'Children worked with (SCH 1) · annual report 2025: ' + n(ST_AR2025.school))}</div>
        <p class="st-lead">The first row of each section report, counted on the whole year. Counted from the records in CYP EDU; what was not recorded in the app is missing.</p>` },
    { k: 'logframe', nav: 'Logframe', title: 'Indicators of the new logframe ' + yr, html: `<p class="st-lead">Logframe v0.6 ${draft}: the indicators the records can already give.</p><div class="cyp-tiles">${tile('R.1 Children supported', LF.reach.n, 'Girls ' + LF.reach.f + ', boys ' + LF.reach.m + ' · present, met, visited or counselled')}${tile('OP1.3.1 Reintegrated', LF.rein.n, 'Reintegration date in the year')}</div>
        <div class="cyp-tiles">${tile('SO1.2 Promoted', LF.pr.all.length ? pct(LF.pr.ok.length, LF.pr.all.length) : 0, LF.pr.all.length ? '% of ' + LF.pr.all.length + ' pupils with an end-of-year result' : 'No end-of-year result written yet')}${tile('OP1.6.1 In coached sport', LF.sport.n, 'Enrolled or present in Activities')}</div>${seesOverview() ? '<div><a class="cyp-btn" href="#/logframe">Open the logframe</a></div>' : ''}` },
  ];
}
function vStory(r) {
  /* the year comes first (#/story or #/story?y=2026); a month (#/story?m=2026-11) keeps the report of the month as before */
  const mq = r.q.get('m'), yq = r.q.get('y'), yearMode = !mq || !!yq;
  const y = yearMode ? (yq || (mq || thisMonth()).slice(0, 4)) : mq.slice(0, 4), m = yearMode ? (y === thisMonth().slice(0, 4) ? thisMonth() : y + '-12') : mq;
  const D = stData(m), mp = stPages(D);
  const P = yearMode ? [stYearCover(y, m)].concat(stYearPages(stYear(y), m), mp.filter(x => !x.cover).map(x => Object.assign({}, x, { month: true }))) : mp;
  const p = Math.max(0, Math.min(P.length - 1, Number(r.q.get('p') || 0))), pg = P[p], base = yearMode ? `y=${y}` : `m=${m}`;
  UI.stDir = UI.stLast != null && UI.stLast > p ? 'prev' : 'next'; UI.stLast = p; UI.stCount = P.length; UI.stMonth = m; UI.stBase = base;
  const go = i => `#/story?${base}&p=${i}`, last = yearMode ? y >= thisMonth().slice(0, 4) : m >= thisMonth();
  if (pg.cover) return `<section id="stchap" class="st-chap">${pg.html}</section>`;
  const monthPage = yearMode && !!pg.month;
  const pager = monthPage ? `<p class="st-lead">The month: ${esc(fmtMonth(m))}. <a href="#/story?m=${m}&p=1">Open the report of a month</a></p>`
    : yearMode ? `<div class="cyp-pager st-pager" role="group" aria-label="Year"><a class="cyp-btn" href="#/story?y=${Number(y) - 1}&p=${p}">${dsIcon('left')}Before</a><span class="cyp-pager__now">${esc(y)}</span>${last ? `<button class="cyp-btn" disabled>After${dsIcon('right')}</button>` : `<a class="cyp-btn" href="#/story?y=${Number(y) + 1}&p=${p}">After${dsIcon('right')}</a>`}</div>`
    : `<div class="cyp-pager st-pager" role="group" aria-label="Month"><a class="cyp-btn" href="#/story?m=${addMonths(m, -1)}&p=${p}">${dsIcon('left')}Before</a><span class="cyp-pager__now">${esc(fmtMonth(m))}</span>${last ? `<button class="cyp-btn" disabled>After${dsIcon('right')}</button>` : `<a class="cyp-btn" href="#/story?m=${addMonths(m, 1)}&p=${p}">After${dsIcon('right')}</a>`}</div>`;
  const yearLink = yearMode ? '' : `<p class="st-lead"><a href="#/story?y=${y}&p=1">Open the report of the year ${esc(y)}</a></p>`;
  /* chapters: in the year, two rows, the year and the month, each with its name; they wrap instead of scrolling (Mauro, 25/11) */
  const link = i => `<a class="label-caps" href="${go(i)}"${i === p ? ' aria-current="page"' : ''}>${i}<span class="cyp-nav__name">&nbsp;${esc(P[i].nav)}</span></a>`, idx = P.map((x, i) => i).filter(i => !P[i].cover);
  const nav = yearMode ? `<nav class="cyp-nav cyp-nav--chapters st-nav2" aria-label="Chapters of the report"><div class="st-navg"><span class="st-navl label-caps">The year ${esc(y)}</span>${idx.filter(i => !P[i].month).map(link).join('')}</div><div class="st-navg"><span class="st-navl label-caps">${esc(fmtMonth(m))}</span>${idx.filter(i => P[i].month).map(link).join('')}</div></nav>`
    : `<nav class="cyp-nav cyp-nav--chapters" aria-label="Chapters of the report">${idx.map(link).join('')}</nav>`;
  return `${nav}
  <section id="stchap" class="st-chap"><div class="st-body"><h2 class="heading-2 st-title">${esc(pg.title)}</h2>${pager}${p === 1 ? yearLink : ''}${pg.html}
    <div class="st-foot"><a class="cyp-btn" href="${go(p - 1)}">${dsIcon('left')}Back</a>${p + 1 < P.length ? `<a class="cyp-btn cyp-btn--primary" href="${go(p + 1)}">Next: ${esc(P[p + 1].nav)}${dsIcon('right')}</a>` : ''}</div></div></section>`;
}
function stYearCover(y, m) {
  return { k: 'cover', cover: true, html: `<div class="cyp-ground st-cover"><div class="cyp-plate st-seal"><img src="${LOGO}" alt="Seal of the Cicetekelo Youth Project"></div><p class="label-caps">Cicetekelo Youth Project</p><h1 class="cover-title">Education Department</h1><p class="st-sub">The year ${esc(y)}</p><p class="small">First what CYP reports every year, then the new logframe, then the month of ${esc(fmtMonth(m))}. Read from the records of CYP EDU on ${dxDate(today())}</p><a class="cyp-btn st-start" href="#/story?y=${y}&p=1">Open the report${dsIcon('right')}</a></div>` };
}
/* keyboard arrows, swipe, and the numbers that count up when their page arrives */
function stGo(d) { if (!/^#\/story/.test(location.hash)) return; const q = new URLSearchParams(location.hash.split('?')[1] || ''), p = Number(q.get('p') || 0), n = p + d; if (n < 0 || n >= (UI.stCount || 1)) return; location.hash = `#/story?${UI.stBase || 'm=' + (q.get('m') || UI.stMonth || thisMonth())}&p=${n}`; }
document.addEventListener('keydown', e => { if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) return; if (e.key === 'ArrowRight') stGo(1); else if (e.key === 'ArrowLeft') stGo(-1); });
(() => { let x0 = null, y0 = 0; document.addEventListener('touchstart', e => { const s = e.target.closest && e.target.closest('#stchap'); x0 = s ? e.touches[0].clientX : null; y0 = s ? e.touches[0].clientY : 0; }, { passive: true });
  document.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) stGo(dx < 0 ? 1 : -1); }, { passive: true }); })();
