/* ====================================================================
   Counselling Section (alpha 5.29), from the paper forms of the section seen on 23/11/2026:
   Form 1A Internal counselling, Form 5 Group counselling, Form 6 Family counselling,
   Counsellor Weekly Monitoring Form, Monthly Statistical Form, monthly and quarterly report (PSC 1-13).
   One way of counting for every report: a child counts once in each row, whatever the number of sessions.
   ==================================================================== */
const COUNSEL_FORMS = { Individual: ['FORM 1A', 'Internal counselling records form'], Group: ['FORM 5', 'Group counselling standard report form'], Family: ['FORM 6', 'Family counselling records form'] };
const COUNSEL_REF = [['', 'No'], ['DEC', 'To DEC, for further counselling'], ['Specific', 'For a specific case']];
const COUNSEL_CENTRES = ['Minsundu', 'Luigi', 'Nkwazi'];
function sessKids(s) { return distinctChildren((s.children || []).map(String)); }
function sessNumber(s) { const c = (s.children || [])[0]; if (!c || s.type === 'Group') return ''; return S.sessions.filter(x => x.type === s.type && String((x.children || [])[0]) === String(c) && ((x.date || '') < (s.date || '') || (x.date === s.date && (x.recordedOn || '') <= (s.recordedOn || '') && x.id <= s.id))).length || 1; }
function sessSees(s) { return seesProtection(s.children && s.children[0] ? child(s.children[0]) : null, s); }
function sessWho(s) { const ks = sessKids(s), o = Number(s.others) || 0; if (s.type !== 'Group') return ks.map(fullName).join(', '); return (ks.length + o) + ' children' + (ks.length ? ': ' + ks.map(fullName).join(', ') : '') + (o ? (ks.length ? ', and ' : ': ') + o + ' not named' : ''); }

/* ---------- counting, used by every report: Counselling, Luigi, Nkwazi, UCC, Youth, weekly ---------- */
function counselCount(list) {
  const kids = t => distinctChildren([].concat(...list.filter(s => !t || s.type === t).map(s => (s.children || []).map(String))));
  const others = list.filter(s => s.type === 'Group').reduce((n, s) => n + (Number(s.others) || 0), 0);
  const all = kids(), ind = kids('Individual'), grp = kids('Group'), fam = kids('Family');
  return { list, all, ind, grp, fam, others, nInd: list.filter(s => s.type === 'Individual').length, nGrp: list.filter(s => s.type === 'Group').length, nFam: list.filter(s => s.type === 'Family').length,
    /* the old way: individual, group and family added together, so a child in two kinds of session counts twice */
    added: ind.length + grp.length + fam.length, budget: list.reduce((n, s) => n + (Number(s.budget) || 0), 0),
    issues: uniq(list.map(s => (s.topic || '').trim()).filter(Boolean)) };
}
function counselStats(a, b) {
  const ss = S.sessions.filter(s => inRange(s.date, a, b)), by = {};
  for (const ce of COUNSEL_CENTRES) by[ce] = counselCount(ss.filter(s => s.centre === ce));
  const all = counselCount(ss), sum = COUNSEL_CENTRES.reduce((n, ce) => n + by[ce].all.length, 0);
  return { ss, by, all, sum, moreCentres: sum - all.all.length, moreKinds: all.added - all.all.length };
}
/* the children counselled in a centre in the period, each child once: the row that goes into the report of each centre */
function counselKids(centre, a, b, pred) { const l = distinctChildren([].concat(...S.sessions.filter(s => s.centre === centre && inRange(s.date, a, b)).map(s => (s.children || []).map(String)))); return pred ? l.filter(pred) : l; }
function counselPsc(m) {
  const { a, b } = monthCtx(m), T = counselStats(a, b);
  const sx = (l, na) => { const F = l.filter(c => c.sex === 'F').length, M = l.filter(c => c.sex === 'M').length; return [F, M, l.length - F - M + (na || 0), l.length + (na || 0)]; };
  /* sessions by the sex of the child; a group with boys and girls, or with nobody named, goes under N/A */
  const sess = l => { let F = 0, M = 0, N = 0; for (const s of l) { const ks = sessKids(s), f = ks.filter(c => c.sex === 'F').length, mm = ks.filter(c => c.sex === 'M').length; if (ks.length && f === ks.length && !(Number(s.others) > 0)) F++; else if (ks.length && mm === ks.length && !(Number(s.others) > 0)) M++; else N++; } return [F, M, N, l.length]; };
  const of = (ce, t) => T.by[ce].list.filter(s => s.type === t), ref = k => distinctChildren([].concat(...T.ss.filter(s => s.referred === k).map(s => (s.children || []).map(String))));
  const fam = T.ss.filter(s => s.type === 'Family');
  const rows = [
    ['PSC 1', 'Total number of children worked with in all centres (each child once)', sx(T.all.all, T.all.others), T.all.all],
    ['PSC 2', 'Total number of children worked with in Luigi drop in centre', sx(T.by.Luigi.all, T.by.Luigi.others), T.by.Luigi.all],
    ['PSC 3', 'Number of children worked with in Nkwazi centre', sx(T.by.Nkwazi.all, T.by.Nkwazi.others), T.by.Nkwazi.all],
    ['PSC 4', 'Number of children worked with in Minsundu centre', sx(T.by.Minsundu.all, T.by.Minsundu.others), T.by.Minsundu.all],
    ['PSC 5', 'Number of individual counselling conducted in Minsundu centre (sessions)', sess(of('Minsundu', 'Individual')), T.by.Minsundu.ind],
    ['PSC 6', 'Number of individual counselling conducted in Nkwazi centre (sessions)', sess(of('Nkwazi', 'Individual')), T.by.Nkwazi.ind],
    ['PSC 7', 'Number of individual counselling conducted in Luigi drop in centre (sessions)', sess(of('Luigi', 'Individual')), T.by.Luigi.ind],
    ['PSC 8', 'Number of group counselling sessions conducted at Luigi drop in centre', sess(of('Luigi', 'Group')), T.by.Luigi.grp],
    ['PSC 9', 'Number of group counselling sessions conducted at Minsundu centre', sess(of('Minsundu', 'Group')), T.by.Minsundu.grp],
    ['PSC 10', 'Number of group counselling sessions conducted at Nkwazi centre', sess(of('Nkwazi', 'Group')), T.by.Nkwazi.grp],
    ['PSC 11', 'Number of children referred to DEC for further counselling', sx(ref('DEC')), ref('DEC')],
    ['PSC 12', 'Number of children referred for specific cases', sx(ref('Specific')), ref('Specific')],
    ['PSC 13', 'Number of family counselling sessions / home visits', sess(fam), T.all.fam],
    ['', 'Check of double counting', [null, null, null, null], null],
    ['', 'Sum of the three centres (PSC 2 + PSC 3 + PSC 4)', [null, null, null, T.sum + T.all.others], null],
    ['', 'Children counted in more than one centre (in PSC 1 they count once)', [null, null, null, T.moreCentres], null],
    ['', 'Children in more than one kind of session: individual, group, family (they count once)', [null, null, null, T.moreKinds], null],
    ['', 'Group participants not named (cannot be checked: they stay under N/A)', [null, null, null, T.all.others], null]
  ];
  return rows;
}
REPORTS.Counseling = {
  label: 'Counselling', cols: ['Female', 'Male', 'N/A', 'Total'], by: 'Counseling', rows: counselPsc,
  note: 'Codes PSC 1-13 as in the report of the Counselling Section. PSC 1-4, 11 and 12 count children, each child once. PSC 5-10 and 13 count sessions, by the sex of the child.'
};
/* the same count inside the reports of the centres */
(function () {
  const nk = REPORTS.Nkwazi.rows; REPORTS.Nkwazi.rows = m => { const { a, b } = monthCtx(m), l = counselKids('Nkwazi', a, b); return nk(m).concat([['', 'Children counselled at Nkwazi this month (each child once, from Counselling)', sexCols(l), l]]); };
  const lu = REPORTS.Luigi.rows; REPORTS.Luigi.rows = m => { const { a, b } = monthCtx(m), l = counselKids('Luigi', a, b), g = l.filter(c => c.sex === 'F').length; return lu(m).concat([['', 'Children counselled at Luigi (each child once, from Counselling)', [l.length - g, g, l.length], l]]); };
  for (const sec of ['UCC', 'Youth']) { const f = REPORTS[sec].rows; REPORTS[sec].rows = m => { const { a, b } = monthCtx(m), l = counselKids('Minsundu', a, b, c => c.section === sec); return f(m).concat([['', 'Counselled at Minsundu this month (each child once, from Counselling)', resCols(l), l]]); }; }
})();
function counselLuigiTable(a, b) {
  const T = counselCount(S.sessions.filter(s => s.centre === 'Luigi' && inRange(s.date, a, b))), bg = l => { const g = l.filter(c => c.sex === 'F').length; return [l.length - g, g, l.length]; };
  return [['Counselling at Luigi', 'Boys', 'Girls', 'Total'], ['Children counselled (each child once)'].concat(bg(T.all)), ['Counselled individually'].concat(bg(T.ind)), ['In group sessions (named)'].concat(bg(T.grp)), ['Individual sessions', '', '', T.nInd], ['Group sessions', '', '', T.nGrp], ['Family sessions', '', '', T.nFam]];
}

/* ---------- pages ---------- */
/* the reports of Counselling are in Reports only (beta 1.5): the section tabs of Reports, then Weekly, Monthly, Quarterly */
function counselTabs(cv) { return `${repSecSeg('Counseling')}<div class="seg ctabs" role="group" aria-label="Counselling report">${[['week', 'Weekly report'], ['month', 'Monthly report'], ['quarter', 'Quarterly report']].map(([k, l]) => `<a href="#" data-q="cv=${k}" class="${cv === k ? 'on' : ''}">${l}</a>`).join('')}</div>`; }
function vCounseling(r) {
  if (r.id === 'new') return counselForm(r);
  const cv = r.q.get('cv') || '';
  /* old links to the reports of the Counselling page go to Reports */
  if (cv) { const q = new URLSearchParams(r.q); q.set('s', 'Counseling'); setTimeout(() => location.replace('#/reports?' + q.toString()), 0); return ''; }
  const m = r.q.get('m') || thisMonth(), { a, b } = monthCtx(m);
  const ss = S.sessions.filter(s => inRange(s.date, a, b)).sort((x, y) => y.date.localeCompare(x.date));
  return `<div class="top"><div><h1>Counselling</h1><p class="lead">${ss.length} sessions in ${esc(fmtMonth(m))}.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${monthPicker(m)}<button class="btn" data-act="xl" data-k="sessions">Export in Excel</button></div></div>
  <section class="card"><h2>Record a session</h2><div class="cnew">${SESSION_TYPES.map(t => `<a class="btn pri" href="#/counseling/new?type=${t}">${t} counselling<small>${COUNSEL_FORMS[t][0]}</small></a>`).join('')}</div></section>
  ${counselActions()}
  <section class="card"><h2>Sessions in ${esc(fmtMonth(m))}</h2>${ss.length ? ss.map(s => `<div class="it"><div class="w"><b>${esc(fmtDate(s.date))} · ${esc(s.type)} · ${esc(CENTRE_LABEL[s.centre] || s.centre)}</b><span>${sessSees(s) ? esc(sessWho(s)) + (s.topic ? ' · ' + esc(s.topic.length > 90 ? s.topic.slice(0, 90) + '…' : s.topic) : '') : HIDDEN_TXT} · ${esc(staffName(s.by))}</span></div><a class="btn sm" href="#/session/${esc(s.id)}">Open</a></div>`).join('') : '<p class="empty">No sessions recorded this month.</p>'}</section>`;
}
function counselForm(r) {
  const type = SESSION_TYPES.includes(r.q.get('type')) ? r.q.get('type') : 'Individual', F = COUNSEL_FORMS[type], cid = r.q.get('child'), c0 = cid ? child(cid) : null;
  const staffOpt = sel => opt(activeStaff().map(s => ({ v: s.id, l: s.name })), sel);
  const big = (label, name, rows) => field(label, name, '', 'textarea', { wide: true, rows });
  const head = `<input type="hidden" name="type" value="${type}">
      ${field('Date', 'date', today(), 'date', { req: true })}${field('Centre', 'centre', c0 && COUNSEL_CENTRES.includes(centreOf(c0)) ? centreOf(c0) : '', 'select', { options: opt(CENTRES) })}
      ${field('Name of counsellor', 'by', '', 'select', { options: staffOpt(USER.id) })}${field('Name of co-counsellor', 'co', '', 'select', { options: '<option value="">Nobody</option>' + staffOpt('') })}`;
  const tail = `${big('Conclusion, suggestions, recommendations, way forward', 'conclusion', 4)}
      ${field('Follow-up action (stays in "Actions still open" until it is done)', 'action', '', 'text', { wide: true })}
      ${field('Referred', 'referred', '', 'select', { options: opt(COUNSEL_REF.map(([v, l]) => ({ v, l })), '') })}${field('Budget used (ZMW)', 'budget', '', 'number', { attrs: ' min="0" step="any"' })}`;
  let body;
  if (type === 'Group') body = `${head}
      ${big('Topic of the session', 'topic', 4)}
      ${field('Period of session (from - to)', 'period', '', 'text')}${field('Place where the session took place', 'place', '', 'text')}
      <div class="f" style="grid-column:1/-1" id="sessgroup"></div>
      ${field('Other counsellees, not named', 'others', '', 'number', { attrs: ' min="0"' })}
      ${big('Summary of the actual session (all the main points)', 'summary', 8)}
      ${tail}`;
  else body = `${head}
      ${childPick('child1', c0 ? c0.id : '', type === 'Family' ? 'Name of child / youth' : 'Name of counsellee')}
      ${type === 'Family' ? field('Name of relative spoken to', 'relative', '', 'text') + field('Kind of relationship to the child / youth', 'relation', '', 'text') : ''}
      ${big('Issue(s) identified by the counsellor', 'topic', 5)}
      ${big('Strengths identified', 'strengths', 3)}
      ${big('Summary of the session (all the main points: goals of the child, of the parents or guardians, of the counsellor)', 'summary', 8)}
      ${tail}`;
  return `<div class="top"><div><h1>${esc(type)} counselling</h1><p class="lead">${esc(F[0])}. ${esc(F[1])}.</p></div><a class="btn" href="#/counseling">Back</a></div>
  <div class="seg ctabs" role="group" aria-label="Kind of session">${SESSION_TYPES.map(t => `<a href="#/counseling/new?type=${t}${cid ? '&child=' + esc(cid) : ''}" class="${t === type ? 'on' : ''}">${t}</a>`).join('')}</div>
  <form class="card" data-form="session" style="max-width:860px"><div class="fs two">${body}</div>
    <p class="sub" style="margin:10px 0 0">The session number is counted by the app. The child's details (date of birth, centre, next of kin) come from the file of the child.</p>
    <button class="btn pri" style="margin-top:12px">Save the session</button></form>`;
}
FORMS.session = function (o) {
  const type = SESSION_TYPES.includes(o.type) ? o.type : 'Individual';
  const kids = (o.child1 ? [String(o.child1)] : []).concat(type === 'Group' ? Array.from(UI.sessKids || []).filter(x => x !== String(o.child1)) : []);
  if (type !== 'Group' && !kids.length) return toast('Choose the child');
  if (type === 'Group' && !kids.length && !(Number(o.others) > 0)) return toast('Tick who took part, or write how many');
  if (!o.centre) return toast('Choose the centre');
  const t = x => (x || '').trim();
  const s = { id: uid('c'), date: o.date, type, centre: o.centre, by: o.by, co: o.co || '', children: kids, others: type === 'Group' ? Number(o.others) || 0 : 0, topic: t(o.topic), strengths: t(o.strengths), summary: t(o.summary), conclusion: t(o.conclusion), relative: t(o.relative), relation: t(o.relation), period: t(o.period), place: t(o.place), referred: o.referred || '', budget: Number(o.budget) || 0, action: t(o.action), actionDone: false, recordedBy: USER.id, recordedOn: today() };
  S.sessions.push(s); UI.sessKids = null; pickReset('sess'); save(); toast('Session saved'); go('#/session/' + s.id);
};
function vSession(r) {
  const s = S.sessions.find(x => x.id === r.id); if (!s) return `<div class="top"><div><h1>Counselling session</h1></div><a class="btn" href="#/counseling">Back</a></div><p class="empty">This session is not in the records.</p>`;
  const F = COUNSEL_FORMS[s.type] || COUNSEL_FORMS.Individual, sees = sessSees(s);
  const rows = sees ? counselSessRows(s) : [];
  return `<div class="top"><div><h1>${esc(s.type)} counselling · ${esc(fmtDate(s.date))}</h1><p class="lead">${esc(F[0])}. ${esc(F[1])}.</p></div><a class="btn" href="#/counseling">Back</a></div>
  <section class="card">${sees ? `<dl class="sessdl">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v || '').replace(/\n/g, '<br>') || '<span class="sub">Not written</span>'}</dd>`).join('')}</dl>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn pri" data-cact="sessword" data-id="${esc(s.id)}">Download the form in Word</button>${cancelBtn('session', s)}</div>` : `<p>${hiddenChip()}</p>`}</section>`;
}
function counselSessRows(s) {
  const c = s.type !== 'Group' && s.children && s.children[0] ? child(s.children[0]) : null, rows = [['Name of counsellor', staffName(s.by)], ['Date', fmtDate(s.date)], ['Centre', CENTRE_LABEL[s.centre] || s.centre]];
  if (s.type === 'Group') rows.push(['Topic of the session', s.topic], ['Period of session', s.period], ['Place where the session took place', s.place], ['Number of counsellees', String(sessKids(s).length + (Number(s.others) || 0))], ['Names of counsellees', sessKids(s).map((k, i) => (i + 1) + '. ' + fullName(k)).join('\n') + (Number(s.others) ? '\nNot named: ' + s.others : '')], ['Summary of the actual session', s.summary]);
  else {
    rows.push([s.type === 'Family' ? 'Name of child / youth' : 'Name of counsellee', c ? fullName(c) : ''], ['Serial number', c ? c.id : ''], ['Sex', c ? (c.sex === 'F' ? 'Female' : c.sex === 'M' ? 'Male' : '') : ''], ['Date of birth (age)', c ? (c.dob ? fmtDate(c.dob) + ' (' + ageText(c) + ')' : curAge(c) === '' ? 'Not known' : 'Not known, about ' + curAge(c) + ' years') : '']);
    if (s.type === 'Family') rows.push(['Name of relative spoken to', s.relative], ['Kind of relationship to child / youth', s.relation]);
    rows.push(['Session number', String(sessNumber(s))], ['Issue(s) identified by counsellor', s.topic], ['Strengths identified', s.strengths], ['Summary of the session', s.summary]);
  }
  rows.push(['Conclusion, suggestions, recommendations, way forward', s.conclusion], ['Follow-up action', s.action ? s.action + (s.actionDone ? ' (done)' : ' (open)') : ''], ['Referred', (COUNSEL_REF.find(x => x[0] === (s.referred || '')) || ['', 'No'])[1]], ['Budget used (ZMW)', s.budget ? String(s.budget) : ''], ['Name of co-counsellor', s.co ? staffName(s.co) : '']);
  return rows;
}
function counselSessDocx(s) {
  const F = COUNSEL_FORMS[s.type] || COUNSEL_FORMS.Individual, rows = counselSessRows(s), long = /^(Issue|Strengths|Summary|Conclusion|Topic of the session|Names of counsellees)/;
  const cap = x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase(), blocks = [{ doc: { title: cap(F[1]), facts: [['Section', 'Counselling'], ['Form', F[0].replace(/^FORM\s*/i, '')], ['Made by', 'CYP EDU']] } }];
  const short = rows.filter(([k]) => !long.test(k));
  blocks.push({ kv: short.map(([k, v]) => [k, v || '']) });
  for (const [k, v] of rows.filter(([k]) => long.test(k))) blocks.push({ box: { label: k, t: v, lines: /^Summary/.test(k) ? 6 : 3 } });
  blocks.push({ sign: [['Counsellor', staffName(s.by)], ['Co-counsellor', s.co ? staffName(s.co) : ''], ['Date', '']] });
  docxDownload(F[0].replace(/\s+/g, '') + '-' + s.type + '-counselling-' + s.date, blocks);
}

/* ---------- weekly report: one for the three centres ---------- */
function weekStart(d) { const x = new Date(d + 'T12:00:00'), k = (x.getDay() + 6) % 7; return addDays(d, -k); }
function counselWeekNote(w, who) { const k = w + '|' + (who || 'all'), l = S.events.filter(e => e.type === 'Counselling week summary' && e.ref === k).sort((x, y) => (y.ts || 0) - (x.ts || 0)); return l[0] ? l[0].note || '' : ''; }
function counselWeekData(r) {
  const w = weekStart(/^\d{4}-\d\d-\d\d$/.test(r.q.get('w') || '') ? r.q.get('w') : today()), e = addDays(w, 6);
  const all = S.sessions.filter(s => inRange(s.date, w, e)), people = uniq(all.map(s => s.by)).filter(Boolean);
  const who = r.q.get('by') || '', ss = all.filter(s => !who || s.by === who).sort((x, y) => x.date.localeCompare(y.date) || COUNSEL_CENTRES.indexOf(x.centre) - COUNSEL_CENTRES.indexOf(y.centre));
  const by = {}; for (const ce of COUNSEL_CENTRES) by[ce] = counselCount(ss.filter(s => s.centre === ce));
  const tot = counselCount(ss), sum = COUNSEL_CENTRES.reduce((n, ce) => n + by[ce].all.length, 0);
  return { w, e, who, people, ss, by, tot, more: sum - tot.all.length, note: counselWeekNote(w, who) };
}
function counselWeekRows(D) {
  const day = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + fmtDate(d);
  return D.ss.map(s => { const sees = sessSees(s); return [day(s.date), s.type, CENTRE_LABEL[s.centre] || s.centre, sees ? sessWho(s) : String(sessKids(s).length + (Number(s.others) || 0)) + ' children', sees ? (s.topic || '') : HIDDEN_TXT, s.budget ? String(s.budget) : '']; });
}
function counselWeekSum(D) {
  const row = (l, T) => [l, T.nInd, T.nGrp, T.nFam, T.all.length + T.others, T.budget || ''];
  return [['Centre', 'Individual sessions', 'Group sessions', 'Family sessions', 'Children (each child once)', 'Budget used (ZMW)']].concat(COUNSEL_CENTRES.map(ce => row(CENTRE_LABEL[ce] || ce, D.by[ce]))).concat([row('All three centres', D.tot)]);
}
function counselWeek(r) {
  const D = counselWeekData(r), rows = counselWeekRows(D), sum = counselWeekSum(D), next = addDays(D.w, 7);
  return `<div class="top"><div><h1>Reports</h1><p class="lead">Counselling · Counsellor Weekly Monitoring Form, the three centres together.</p></div><button class="btn pri" data-cact="weekword">Download the weekly report in Word</button></div>
  ${counselTabs('week')}
  <div class="cyp-pager" role="group" aria-label="Week of the report" style="margin-bottom:12px"><a class="cyp-btn" href="#" data-q="w=${addDays(D.w, -7)}">${dsIcon('left')}Before</a><span class="cyp-pager__now">Week of ${D.w.split('-').reverse().join('/')}</span>${next <= today() ? `<a class="cyp-btn" href="#" data-q="w=${next}">After${dsIcon('right')}</a>` : `<button class="cyp-btn" disabled>After${dsIcon('right')}</button>`}</div>
  ${D.people.length > 1 || D.who ? `<div class="seg ctabs" role="group" aria-label="Counsellor"><a href="#" data-q="by=" class="${D.who ? '' : 'on'}">All counsellors</a>${D.people.map(id => `<a href="#" data-q="by=${esc(id)}" class="${D.who === id ? 'on' : ''}">${esc(staffName(id))}</a>`).join('')}</div>` : ''}
  <section class="card"><h2>Sessions of the week · ${rows.length}</h2>${rows.length ? `<div class="tw"><table class="rt cweek"><thead><tr><th>Date / Day</th><th>Type of session</th><th>Centre</th><th>Name or number of children counselled</th><th>Topics discussed</th><th class="n">Budget used (ZMW)</th></tr></thead><tbody>${rows.map(x => `<tr>${x.map((v, i) => `<td class="${i === 5 ? 'n' : ''}">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="empty">No session recorded in this week.</p>'}</section>
  <section class="card"><h2>The week by centre</h2>${tHtml(sum)}<p class="sub" style="margin:6px 0 0">A child seen in two centres counts in each centre and once in the last row${D.more > 0 ? ': ' + D.more + ' this week' : ''}.</p></section>
  <form class="card" data-form="counselweek"><h2>Weekly summary / observations</h2><input type="hidden" name="w" value="${D.w}"><input type="hidden" name="who" value="${esc(D.who)}">
    <textarea class="in" name="note" rows="6" aria-label="Weekly summary and observations">${esc(D.note)}</textarea><button class="btn pri" style="margin-top:10px">Save the summary</button></form>`;
}
FORMS.counselweek = function (o) {
  S.events.push({ id: uid('e'), childId: '', type: 'Counselling week summary', ref: o.w + '|' + (o.who || 'all'), date: today(), ts: Date.now(), note: (o.note || '').trim(), by: USER.id });
  save(); toast('Summary saved'); render();
};
function counselWeekDocx(r) {
  const D = counselWeekData(r), sum = counselWeekSum(D);
  docxDownload('Counselling-weekly-report-' + D.w, [
    { doc: { title: 'Counsellor weekly monitoring form', facts: [['Section', 'Counselling'], ['Week', dxDate(D.w) + ' to ' + dxDate(D.e)], ['Made by', 'CYP EDU']] } },
    { tiles: [['Sessions', sum[sum.length - 1].slice(1, 4).reduce((a, b) => a + Number(b || 0), 0), 'Individual, group and family'], ['Children', sum[sum.length - 1][4], 'Each child once, the three centres'], ['Budget used', sum[sum.length - 1][5] ? 'K ' + Number(sum[sum.length - 1][5]).toLocaleString('en-GB') : 'K 0', 'Kwacha, this week']] },
    { kv: [['Counsellor', D.who ? staffName(D.who) : D.people.map(staffName).join(', ')], ['Centres', 'Minsundu, Luigi, Nkwazi Centre']] },
    { table: { head: 1, widths: [13, 14, 13, 21, 27, 12], rows: [['Date / Day', 'Type of session', 'Centre', 'Name or number of children counselled', 'Topics discussed', 'Budget (ZMW)']].concat(counselWeekRows(D).length ? counselWeekRows(D) : [['', '', '', '', '', '']]) } },
    { h: 2, t: 'The week by centre' }, { table: { head: 1, widths: [24, 15, 15, 15, 17, 14], rows: sum.map(x => x.map(String)) } },
    { p: 'A child seen in two centres counts in each centre and once in the last row.', small: true },
    { box: { label: 'WEEKLY SUMMARY / OBSERVATIONS', t: D.note, lines: 6 } },
    { sign: [['Counsellor', D.who ? staffName(D.who) : ''], ['Checked by', ''], ['Date', '']] }
  ]);
}

/* ---------- monthly and quarterly report: the same template ---------- */
function counselPeriodCtx(r, cv) {
  const m = r.q.get('m') || thisMonth();
  if (cv === 'quarter') { const q = quarterOf(m); return { m, key: q.start.slice(0, 7) + '~' + q.end.slice(0, 7), a: q.start, b: q.end, label: q.label, kind: 'Quarterly report' }; }
  const c = monthCtx(m); return { m, key: m, a: c.a, b: c.b, label: fmtMonth(m), kind: 'Monthly report' };
}
function counselByCentre(a, b) {
  const T = counselStats(a, b), rows = [['Centre', 'Children: individual', 'Children: group', 'Sessions: individual', 'Sessions: group', 'Sessions: family', 'Issues tackled']];
  for (const ce of COUNSEL_CENTRES) { const x = T.by[ce]; rows.push([CENTRE_LABEL[ce] || ce, x.ind.length, x.grp.length + x.others, x.nInd, x.nGrp, x.nFam, x.issues.join('; ')]); }
  rows.push(['Totals', T.all.ind.length, T.all.grp.length + T.all.others, T.all.nInd, T.all.nGrp, T.all.nFam, '']);
  return rows;
}
function counselPeriod(r, cv) {
  const P = counselPeriodCtx(r, cv), rows = counselPsc(P.key), T = counselStats(P.a, P.b), see = seesAll() || hasFlag('Counseling');
  const stat = counselByCentre(P.a, P.b).map((x, i) => i && !see ? x.slice(0, 6).concat([x[6] ? HIDDEN_TXT : '']) : x);
  return `<div class="top"><div><h1>Reports</h1><p class="lead">Counselling · ${esc(P.kind)} · ${esc(P.label)}.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${monthPicker(P.m)}<button class="btn pri" data-cact="periodword" data-cv="${cv}">Download the report in Word</button></div></div>
  ${counselTabs(cv)}
  ${cv === 'month' && typeof repCard === 'function' ? repCard('Counseling', P.m) : ''}
  <section class="card"><h2>Statistics · ${esc(P.label)}</h2><div class="tw"><table class="rt rstack" id="rtable"><thead><tr><th>Code</th><th>Indicator</th><th class="n">Female</th><th class="n">Male</th><th class="n">N/A</th><th class="n">Total</th></tr></thead><tbody>${rows.map(x => x[0] === '' && x[2][3] == null ? `<tr class="rhead"><td colspan="6"><b>${esc(x[1])}</b></td></tr>` : `<tr><td class="sub rcode">${esc(x[0])}</td><td class="rind">${esc(x[1])}</td>${x[2].map((v, j) => `<td class="n" data-l="${['Female', 'Male', 'N/A', 'Total'][j]}">${v == null ? '' : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="sub" style="margin:8px 0 0">${esc(REPORTS.Counseling.note)}</p></section>
  <section class="card"><h2>Double counting</h2><p style="margin:6px 0 0">${T.all.all.length + T.all.others} children were worked with in ${esc(P.label)}. Added centre by centre they would be ${T.sum + T.all.others}: ${T.moreCentres} ${T.moreCentres === 1 ? 'child was' : 'children were'} seen in more than one centre. Added by kind of session (individual, group, family) they would be ${T.all.added + T.all.others}: ${T.moreKinds} ${T.moreKinds === 1 ? 'child was' : 'children were'} in more than one kind.${T.all.others ? ' ' + T.all.others + ' group participants have no name written and cannot be checked.' : ''}</p></section>
  <section class="card"><h2>By centre</h2>${tHtml(stat)}</section>
  ${cv === 'month' && typeof grpReportHtml === 'function' ? grpReportHtml('Counseling', P.a, P.b) : ''}`;
}
function counselNarrative(P) {
  const see = seesAll() || hasFlag('Counseling'), T = counselStats(P.a, P.b), out = [], pl = (n, one, many) => n + ' ' + (n === 1 ? one : many), bg = l => { const g = l.filter(c => c.sex === 'F').length, b = l.filter(c => c.sex === 'M').length; return pl(b, 'boy', 'boys') + ' and ' + pl(g, 'girl', 'girls') + (l.length - g - b ? ' and ' + (l.length - g - b) + ' with sex not written' : ''); };
  out.push({ h: 2, t: 'NARRATIVE REPORT' }, { h: 3, t: 'INTRODUCTION' }, { p: 'This report covers the activities regarding psychosocial counselling which took place in the three centres, Minsundu, Luigi drop in and Nkwazi, over the period from ' + fmtDate(P.a) + ' to ' + fmtDate(P.b) + '.' });
  out.push({ h: 3, t: 'ACTIVITIES' }, { p: 'The activities which took place in the three centres are as follows:' }, { list: ['Individual counselling', 'Group counselling', 'Family counselling', 'Counselling through an activity'] });
  for (const ce of COUNSEL_CENTRES) {
    const x = T.by[ce], iss = t => !see ? [] : uniq(x.list.filter(s => s.type === t).map(s => (s.topic || '').trim()).filter(Boolean));
    out.push({ p: (ce === 'Luigi' ? 'LUIGI DROP-IN CENTRE' : ce.toUpperCase() + ' CENTRE'), b: true });
    if (!x.list.length) { out.push({ p: 'No counselling session recorded in this period.' }); continue; }
    out.push({ p: (ce === 'Luigi' ? 'Luigi drop in centre' : ce + ' centre') + ' had a total of ' + pl(x.all.length + x.others, 'child', 'children') + ' counselled (' + bg(x.all) + (x.others ? ', and ' + x.others + ' group participants not named' : '') + '). Each child is counted once. The breakdown is as follows:' });
    out.push({ p: 'Individual counselling', b: true }, { p: (x.ind.length ? 'Counselled individually: ' + bg(x.ind) + ', ' + x.ind.length + ' in total. Number of sessions: ' + x.nInd + '.' : 'No individual counselling recorded.') + (iss('Individual').length ? ' Issues discussed: ' + iss('Individual').join('; ') + '.' : '') });
    out.push({ p: 'Group counselling', b: true }, { p: (x.nGrp ? 'Counselled as a group: ' + pl(x.grp.length + x.others, 'child', 'children') + ' (' + bg(x.grp) + (x.others ? ', ' + x.others + ' not named' : '') + '). Number of sessions: ' + x.nGrp + '.' : 'No group counselling recorded.') + (iss('Group').length ? ' Issues discussed: ' + iss('Group').join('; ') + '.' : '') });
    out.push({ p: 'Family counselling', b: true }, { p: x.nFam ? 'Family counselling sessions: ' + x.nFam + ', for ' + pl(x.fam.length, 'child', 'children') + '.' : 'No family counselling recorded.' });
    out.push({ p: 'Counselling through activities', b: true }, { p: '' });
  }
  out.push({ h: 3, t: 'CHALLENGES, ACTION TAKEN AND PROPOSED ACTION' }, { table: { head: 1, widths: [34, 33, 33], rows: [['Challenges', 'Action taken', 'Proposed action'], [{ t: '', h: 4 }, '', '']] } });
  out.push({ h: 3, t: 'CONCLUSION' }, { p: '' }, { p: '' });
  return out;
}
function counselPeriodDocx(r, cv) {
  const see = seesAll() || hasFlag('Counseling'), P = counselPeriodCtx(r, cv), rows = counselPsc(P.key), stat = counselByCentre(P.a, P.b).map((x, i) => i && !see ? x.slice(0, 6).concat(['']) : x);
  const blocks = docxReportHead('Counselling', P.label, P.kind);
  { const T = counselStats(P.a, P.b), tot = k => { const x = rows.find(y => y[0] === k); return x && x[2][3] != null ? Number(x[2][3]) : 0; }; blocks.push({ tiles: [['Children worked with', (T.all.all.length + T.all.others).toLocaleString('en-GB'), 'Each child once, the three centres'], ['Sessions', (T.all.nInd + T.all.nGrp + T.all.nFam).toLocaleString('en-GB'), 'Individual, group and family'], ['Children referred', (tot('PSC 11') + tot('PSC 12')).toLocaleString('en-GB'), 'To DEC or for specific cases']] }, { h: 3, t: 'Indicators' }); }
  blocks.push({ table: { head: 1, widths: [11, 49, 11, 9, 9, 11], rows: [['Code', 'Indicator', 'Female', 'Male', 'N/A', 'Total']].concat(rows.map(x => x[0] === '' && x[2][3] == null ? [{ t: x[1], b: true, span: 6, shade: 'F3F5F7' }] : [x[0], x[1]].concat(x[2].map(v => v == null ? '' : String(v))))) } });
  blocks.push({ p: 'Figures counted by CYP EDU from the sessions recorded, on ' + fmtDate(today()) + '. Each child counts once in PSC 1-4. Check them before sending the report.', small: true });
  blocks.push({ h: 2, t: 'STATISTICS BY CENTRE' }, { table: { head: 1, widths: [14, 13, 13, 13, 13, 13, 21], rows: stat.map(x => x.map(String)) } });
  docxDownload('Counselling-' + (cv === 'quarter' ? 'quarterly' : 'monthly') + '-report-' + P.key.replace('~', '-to-'), blocks.concat(counselNarrative(P)));
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cact]'); if (!b || !USER || GUEST) return;
  const act = b.dataset.cact, r = route();
  if (act === 'sessword') { const s = S.sessions.find(x => x.id === b.dataset.id); if (s && sessSees(s)) counselSessDocx(s); }
  else if (act === 'weekword') counselWeekDocx(r);
  else if (act === 'periodword') counselPeriodDocx(r, b.dataset.cv === 'quarter' ? 'quarter' : 'month');
});

/* ---------- the report of every section in Word, on the letterhead ---------- */
function wordReport(b) {
  const card = b.closest('section.card'); if (!card) return;
  const title = b.dataset.title || 'Section', period = b.dataset.period || '';
  if (title === 'Counselling') { const r = route(), p = r.q.get('p') || 'M'; if (p === 'M' || p === 'Q') return counselPeriodDocx(r, p === 'Q' ? 'quarter' : 'month'); }
  const src = card.lastElementChild.cloneNode(true);
  src.querySelectorAll('button, .btn, input, select, svg, script, .noprint, .hide, [hidden], tr[id^="names"]').forEach(x => x.remove());
  src.querySelectorAll('details').forEach(d => { const div = document.createElement('div'); const s = d.querySelector('summary'); if (s) { const h = document.createElement('p'); h.innerHTML = '<b>' + s.textContent + '</b>'; div.appendChild(h); s.remove(); } while (d.firstChild) div.appendChild(d.firstChild); d.replaceWith(div); });
  src.querySelectorAll('table').forEach(t => { for (let g = 0; g < 3; g++) { const rows = Array.from(t.rows).filter(r => r.cells.length > 1); if (!rows.length) break; const w = Math.max.apply(null, rows.map(r => r.cells.length)); const last = rows.filter(r => r.cells.length === w); if (last.length !== rows.length || !last.every(r => !r.cells[w - 1].textContent.trim())) break; last.forEach(r => r.deleteCell(w - 1)); } });
  const blocks = docxReportHead(title, period, 'Report');
  blocks.push({ h: 2, t: '1. INTRODUCTION' }, { p: '' }, { p: '' }, { h: 2, t: '2. STATISTICS' });
  for (const k of docxFromDom(src)) blocks.push(k);
  blocks.push({ p: 'Figures counted by CYP EDU from the records on ' + fmtDate(today()) + '. Check them before sending the report.', small: true });
  ['ACTIVITIES', 'ACHIEVEMENTS'].forEach((h, i) => blocks.push({ h: 2, t: (i + 3) + '. ' + h }, { p: '' }, { p: '' }));
  blocks.push({ h: 2, t: '5. CHALLENGES, ACTION TAKEN AND PROPOSED ACTION' }, { table: { head: 1, widths: [34, 33, 33], rows: [['Challenges', 'Action taken', 'Proposed action'], [{ t: '', h: 4 }, '', '']] } });
  blocks.push({ h: 2, t: '6. RECOMMENDATIONS' }, { p: '' }, { p: '' }, { h: 2, t: '7. CONCLUSION' }, { p: '' }, { p: '' });
  docxDownload(b.dataset.name || 'report', blocks);
}
