
/* ====================================================================
   School Section: the school visit as on the paper School Monitoring Form,
   results per term, pupils by school, and referrals between sections.
   Referrals are events (type 'Referral', closed by 'Referral closed' with ref),
   so they travel with the lists every version of the app already sends.
   ==================================================================== */
const PERF = ['Above average', 'Average', 'Below average'];
const SCH_ATT = ['Regular', 'Irregular', 'Absent'];
const TREND = ['Improving', 'The same', 'Decreasing'];
const YEAR_END = ['Promoted to the next grade', 'Repeats the grade', 'Completed school', 'Stopped school', 'Results not out yet'];
const REFER_TO = [['Family', 'Family Section'], ['School', 'School Section'], ['Counseling', 'Counselling'], ['Luigi', 'Luigi'], ['Minsundu', 'Minsundu'], ['Nkwazi', 'Nkwazi Centre'], ['Sports', 'Sports']];
const REFER_WHY = ['Home visit suggested', 'Not attending school', 'School performance going down', 'Behaviour', 'Problem at home', 'Health', 'Needs school support', 'Other'];
const SCH_KEYS = ['teacher', 'teacherPhone', 'schAtt', 'perf', 'perfNote', 'cocurr', 'behaviour', 'intTeachers', 'intMates', 'teacherComment', 'weak', 'strong', 'classTeacher', 'trend', 'abaOptional', 'abaExam', 'abaSugAcad', 'aba3y', 'abaSugSoc'];
function referLabel(k) { const x = REFER_TO.find(r => r[0] === k); return x ? x[1] : (k || ''); }

/* ---------- terms, as the School Section counts them: the school year starts in January.
   Term 1 January to March (April holidays), Term 2 May to July (August holidays), Term 3 September to November (December holidays).
   A date in the holiday month counts for the term that has just closed, so a visit in the last school days is not lost. ---------- */
const TERM_MONTHS = { 1: 'January to March', 2: 'May to July', 3: 'September to November' }, TERM_SHORT = { 1: 'Jan-Mar', 2: 'May-Jul', 3: 'Sep-Nov' }, TERM_START = { 1: 'January', 2: 'May', 3: 'September' };
function termOf(d) { const m = Number(String(d).slice(5, 7)); return m <= 4 ? 1 : m <= 8 ? 2 : 3; }
function termHoliday(d) { return [4, 8, 12].includes(Number(String(d).slice(5, 7))); }
function termRange(y, t) { return t === 1 ? [y + '-01-01', y + '-04-30'] : t === 2 ? [y + '-05-01', y + '-08-31'] : [y + '-09-01', y + '-12-31']; }
function termNow() { return { y: Number(today().slice(0, 4)), t: termOf(today()), hol: termHoliday(today()) }; }
function termNext(x) { return x.t === 3 ? { y: x.y + 1, t: 1 } : { y: x.y, t: x.t + 1 }; }
function termIsNow(x) { const n = termNow(); return x.y === n.y && x.t === n.t; }
function termSel(q) { const x = String(q.get('tm') || '').split('-'), n = termNow(); return { y: Number(x[0]) || n.y, t: [1, 2, 3].includes(Number(x[1])) ? Number(x[1]) : n.t }; }
function termLabel(x) { return x.y + ' Term ' + x.t; }

/* ---------- pupils ---------- */
function schoolVisits(c) { return visitsOf(c.id).filter(v => v.purpose === 'School visit' && v.successful !== 'No').sort((a, b) => (b.date || '').localeCompare(a.date || '')); }
function isPupil(c) { const t = dayType(c); return (isCurrent(c) || c.status === 'Follow-up') && !!t && t !== 'Not in school'; }
function outsideSchool(c) { return ['GRZ primary', 'GRZ secondary', 'Private school', 'College / skills training', 'Luigi Special School'].includes(dayType(c)); }
/* one spelling for each school: "Chifubu sec" and "Chifubu Sec." read as "Chifubu Secondary" */
/* the schools on the list of the School Section (October 2026): the names to choose from, and the other spellings of the same name */
const SCHOOLS_KNOWN = ['Chifubu Secondary', 'Chilengwa Primary', 'Chilengwa Secondary', 'Chipulukusu Secondary', 'Chiwala Boarding', 'Cicetekelo Community School', 'Copperbelt University', 'Dambo Primary', 'Dambo Secondary', 'Dominican Convent', 'Elohim Primary Baluba', 'George PEAS Boarding', 'Kamba Secondary', 'Kansenshi Day Secondary', 'Kansenshi Primary', 'Kansenshi Prisons', 'Kansenshi Secondary', 'Kansenshi Special School', 'Lubwe Boarding School', 'Luigi Special School', 'Mulungushi University', 'NORTEC', 'Northrise Secondary', 'Pamodzi Secondary', 'St Andrews Secondary', 'Temweni Secondary', 'Twalubuka Secondary', 'Twatasha Primary'];
const SCHOOL_ALIAS = { 'cicetekelo': 'Cicetekelo Community School', 'cicetekelo com': 'Cicetekelo Community School', 'cicetekelo community': 'Cicetekelo Community School', 'chicetekelo community school': 'Cicetekelo Community School', 'elohim primary': 'Elohim Primary Baluba', 'eloihm primary': 'Elohim Primary Baluba', 'george peas boardind': 'George PEAS Boarding', 'george peas': 'George PEAS Boarding', 'lubwe boarding': 'Lubwe Boarding School', 'nortec college': 'NORTEC', 'st andrew secondary': 'St Andrews Secondary', "st andrew's secondary": 'St Andrews Secondary' };
for (const n of SCHOOLS_KNOWN) SCHOOL_ALIAS[n.toLowerCase()] = n;
function schoolNorm(n) { let s = String(n || '').trim().replace(/\s+/g, ' ').replace(/\bSt\.\s*/i, 'St '); if (!s) return ''; s = s.replace(/\bsec\b\.?/i, 'Secondary').replace(/\bprim\b\.?/i, 'Primary').replace(/\bcomb\b\.?/i, 'Combined').replace(/\bsch\b\.?/i, 'School'); return SCHOOL_ALIAS[s.toLowerCase()] || s.split(' ').map(w => w === w.toLowerCase() || (w === w.toUpperCase() && w.length > 3) ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(' '); }
function schoolOf(c) { const s = schoolNorm(c.schoolName); return s || (outsideSchool(c) ? 'School name not written' : dayLabel(dayType(c))); }
function schoolNames() { const m = {}; for (const n of SCHOOLS_KNOWN) m[n] = 1; for (const c of S.children) { const s = schoolNorm(c.schoolName); if (s) m[s] = 1; } return Object.keys(m).sort((a, b) => a.localeCompare(b)); }
function schoolList() { return `<datalist id="schoolnames">${schoolNames().map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>`; }
function termsOf(c) { return (c.terms || []).slice().sort((a, b) => (b.y - a.y) || (b.t - a.t)); }
function termAvg(r) { const v = (r.subjects || []).map(s => Number(s.e)).filter(n => n === n && n > 0); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; }
/* progress of a pupil: the last two term results (level, or average mark when the marks are written); if there is only one, what the last school visit says */
function progressOf(c) {
  const T = termsOf(c).filter(r => r.perf || termAvg(r) != null);
  if (T.length >= 2) {
    const a = T[0], b = T[1], ma = termAvg(a), mb = termAvg(b);
    if (ma != null && mb != null && ma !== mb) return ma > mb ? 'Improving' : 'Decreasing';
    if (a.perf && b.perf) { const d = PERF.indexOf(b.perf) - PERF.indexOf(a.perf); return d > 0 ? 'Improving' : d < 0 ? 'Decreasing' : 'The same'; }
  }
  const v = schoolVisits(c).find(x => x.trend); return v ? v.trend : '';
}
function trendChip(t) { return t ? `<span class="chip ${t === 'Improving' ? 'c-green' : t === 'Decreasing' ? 'c-red' : ''}">${esc(t)}</span>` : ''; }
function attLast(c, key, days) {
  const from = addDays(today(), -(days || 30)); let p = 0, n = 0;
  for (const d of Object.keys(S.attendance)) { if (d < from || d > today()) continue; const v = S.attendance[d][key]; if (v == null) continue; n++; if (v === 'P') p++; }
  return { p, n };
}

/* ---------- referrals between sections ---------- */
function referClosed(id) { return S.events.find(e => e.type === 'Referral closed' && e.ref === id); }
function referOpen(to) { return S.events.filter(e => e.type === 'Referral' && !referClosed(e.id) && (!to || e.to === to) && child(e.childId)).sort((a, b) => (a.date || '').localeCompare(b.date || '')); }
function referAdd(childId, from, to, reason, note, date, visitId) { S.events.push({ id: uid('e'), childId: String(childId), type: 'Referral', date: date || today(), from: from || '', to, reason: reason || '', note: note || '', by: USER.id, visitId: visitId || '' }); }
function referLine(lines, k) { const n = referOpen(k).length; if (n) lines.unshift({ n, text: n === 1 ? 'child referred by colleagues' : 'children referred by colleagues', href: '#/referrals?to=' + k, lvl: 'red' }); return lines; }
function eventLine(e) {
  if (e.type === 'Task' || TASK_EV.includes(e.type)) return taskEventLine(e);
  if (VISIT_EV.includes(e.type) || e.type === 'Visit corrected') return '';
  if (e.type === 'Record cancelled' || e.type === 'Visit cancelled') return `<b>Cancelled</b> <span class="sub">by ${esc(staffName(e.by))}</span>${e.note ? `<div class="sub">${esc(e.note)}</div>` : ''}`;
  if (e.type === 'Referral') { const cl = referClosed(e.id); return `<b>Referred to ${esc(referLabel(e.to))}</b>${e.from ? ' by ' + esc(referLabel(e.from)) : ''}: ${esc(e.reason || '')} ${cl ? '<span class="chip c-green">Done</span>' : '<span class="chip c-orange">Open</span>'} <span class="sub">${esc(staffName(e.by))}</span>${e.note ? `<div>${esc(e.note)}</div>` : ''}`; }
  if (e.type === 'Case study') return caseSees(e) ? `<b>Case study</b> <span class="sub">${esc(caseSecLabel(e.section))} · by ${esc(staffName(e.by))}</span> <a class="btn sm" href="#/case/${esc(e.id)}">Open the case study</a>` : '<b>Case study</b> <span class="sub">' + HIDDEN_TXT + '</span>';
  if (e.type === 'Case study changed') return '';
  if (e.type === 'Player profile') return `<b>Player profile · ${esc(e.sport)}</b> <span class="sub">by ${esc(staffName(e.by))}</span>`;
  if (e.type === 'Referral closed') return `<b>Referral closed</b> <span class="sub">${esc(staffName(e.by))}</span>${e.note ? `<div>${esc(e.note)}</div>` : ''}`;
  const kid = child(e.childId), open = CONF_EVENTS.includes(e.type) ? seesProtection(kid, e) : HEALTH_EVENTS.includes(e.type) ? (seesHealth(kid) || e.by === USER.id) : true;
  return `<b>${esc(e.type)}</b> <span class="sub">recorded by ${esc(staffName(e.by))}</span>${e.note ? `<div>${open ? esc(e.note) : hiddenChip()}</div>` : ''}`;
}
/* what the colleague who referred wrote about the child: the visit of the referral, or his or her last record before it (beta 1.5, comment of 24/11) */
function referSource(e) {
  const vis = v => ({ d: v.date, href: '#/visitrep/' + v.id, sec: TEAM_KEYS.includes(v.team) ? v.team : '', title: (v.purpose || 'Visit') + ' visit, ' + fmtDate(v.date), detail: v.findings || '' });
  const v0 = e.visitId ? S.visits.find(x => x.id === e.visitId || visitKey(x) === e.visitId) : null; if (v0) return vis(v0);
  const from = d => d && d <= (e.date || today()) && d >= addDays(e.date || today(), -60), cid = String(e.childId), late = (a, b) => (b.date || '').localeCompare(a.date || '');
  const vs = S.visits.filter(x => String(x.childId) === cid && (x.by === e.by || x.recordedBy === e.by) && from(x.date)).sort(late)[0];
  const ss = S.sessions.filter(x => (x.children || []).map(String).includes(cid) && x.by === e.by && from(x.date)).sort(late)[0];
  const ev = S.events.filter(x => String(x.childId) === cid && x.by === e.by && x.id !== e.id && x.type !== 'Referral' && x.note && from(x.date)).sort(late)[0];
  return [vs && vis(vs), ss && { d: ss.date, href: '#/session/' + ss.id, sec: 'Counseling', title: 'Counselling session, ' + fmtDate(ss.date), detail: ss.topic && sessSees(ss) ? ss.topic : '' },
    ev && { d: ev.date, href: '#/child/' + cid, sec: '', title: ev.type + ', ' + fmtDate(ev.date), detail: ev.note }].filter(Boolean).sort((a, b) => (b.d || '').localeCompare(a.d || ''))[0] || null;
}
/* the icon of a section or a place, inline, for the route line of a referral */
function refIcon(k) { const p = (typeof PLACE_ICON !== 'undefined' && PLACE_ICON[k]) || SEC_ICON[SEC_KEY[k] || k]; return p ? `<svg class="cyp-icon" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>` : ''; }
/* a referral as the Referral of the design system (24/11): route, reason with its state, the note as written, who and when, the record behind it, then the actions */
function referItem(e) {
  const c = child(e.childId), src = referSource(e), cut = t => t.length > 160 ? t.slice(0, 160) + '…' : t, go = dsIcon('go').replace('cyp-icon', 'cyp-icon cyp-go');
  return `<article class="cyp-card cyp-referral refit">
    <p class="cyp-referral__route label-caps">${refIcon(e.from)}${esc(referLabel(e.from) || 'A section')} ${dsIcon('arrow')} ${refIcon(e.to)}${esc(referLabel(e.to))}</p>
    <div class="cyp-referral__head"><h3 class="heading-3">${esc(e.reason || 'No reason written')}</h3><span class="cyp-tag cyp-tag--warn">${dsIcon('clock')}Waiting</span></div>
    <p class="cyp-referral__child">${childLink(c)} ${centreChip(c)}</p>
    ${e.note ? `<div class="cyp-note"><p><q>${esc(e.note)}</q></p></div>` : ''}
    <p class="small cyp-referral__meta">${esc(staffName(e.by))}, ${esc(fmtDate(e.date))}</p>
    ${src ? `<div class="cyp-rows"><a class="cyp-row cyp-row--link" href="${src.href}">${src.sec ? secDisc(src.sec) : ''}<span class="cyp-row__text"><b>${esc(src.title)}</b>${src.detail ? `<span>${esc(cut(src.detail))}</span>` : ''}</span>${go}</a></div>` : ''}
    ${TEAM_KEYS.includes(e.to) ? `<div class="refact"><a class="btn sm" href="#/visit/new?child=${esc(c.id)}&t=${esc(e.to)}">Record a visit</a><span class="sub">Plan for</span>${[0, 1, 2].map(i => { const m = addMonths(thisMonth(), i), inp = plans().some(p => String(p.childId) === String(c.id) && p.month === m && planTeam(p) === e.to); return inp ? `<span class="chip c-green">${esc(fmtMonth(m))} ✓</span>` : `<button type="button" class="btn sm" data-pact="plan" data-id="${esc(c.id)}" data-m="${m}" data-team="${esc(e.to)}">${esc(fmtMonth(m))}</button>`; }).join('')}</div>` : ''}
    <form data-form="referdone" class="refdone"><input type="hidden" name="id" value="${esc(e.id)}"><input class="in" name="note" placeholder="What was done" aria-label="What was done" required><button class="btn sm pri">Done</button></form></article>`;
}
/* what the colleagues asked of a section: shown where that section works (Monitoring, Activities) */
function referFor(team, centre) { return referOpen().filter(e => (TEAM_KEYS.includes(team) || team === 'Sports' ? e.to === team : team === 'Others' ? e.to !== 'Family' && e.to !== 'School' : true) && (!centre || centre === 'all' || centreOf(child(e.childId)) === centre)); }
function referTeamBox(team, centre) { const l = referFor(team, centre); return l.length ? `<section class="card refcard" id="refteam"><h2>Referred by colleagues · ${l.length}</h2>${l.map(referItem).join('')}</section>` : ''; }
function vReferNew(r) {
  const cid = r.q.get('child'), c = cid ? child(cid) : null;
  return `<div class="top"><div><h1>Refer a child</h1><p class="lead">The section finds it in its To do.</p></div><a class="btn" href="#/referrals">Back</a></div>
  <form class="card" data-form="refer" style="max-width:720px">
    <div class="fs two">${childPick('id', c ? c.id : '', 'Child *')}${field('From', 'from', '', 'select', { options: opt(REFER_TO.map(([v, l]) => ({ v, l })), referFrom(), 'Choose') })}${field('To', 'referTo', '', 'select', { req: true, options: opt(REFER_TO.map(([v, l]) => ({ v, l })), '', 'Choose') })}
      ${field('Why', 'referWhy', '', 'select', { req: true, options: opt(REFER_WHY, '', 'Choose') })}${field('Date', 'date', today(), 'date', { req: true })}${field('Note for that section', 'referNote', '', 'textarea', { wide: true, rows: 3 })}</div>
    <button class="btn pri" style="margin-top:12px">Refer</button></form>`;
}
function referFrom() { return myTeam() || myCentre() || (hasFlag('Sports') ? 'Sports' : ''); }
function referBox(c) {
  const list = referOpen().filter(e => String(e.childId) === String(c.id)); if (!list.length) return '';
  return `<section class="card refcard"><h2>Referred to another section · ${list.length}</h2>${list.map(referItem).join('')}</section>`;
}
function referFields() {
  return `${field('Refer to another section', 'referTo', '', 'select', { options: opt(REFER_TO.map(([v, l]) => ({ v, l })), '', 'No') })}
      ${field('Why', 'referWhy', '', 'select', { options: opt(REFER_WHY, '', 'Choose') })}
      ${field('Note for that section', 'referNote', '', 'text', { wide: true })}`;
}
function vRefer(c) {
  return `<div class="top"><div><h1>Refer ${esc(fullName(c))}</h1><p class="lead">The other section finds it in its To do.</p></div><a class="btn" href="#/child/${esc(c.id)}">Back</a></div>
  <form class="card" data-form="refer" style="max-width:720px"><input type="hidden" name="id" value="${esc(c.id)}">
    <div class="fs two">${field('From', 'from', '', 'select', { options: opt(REFER_TO.map(([v, l]) => ({ v, l })), referFrom(), 'Choose') })}${field('To', 'referTo', '', 'select', { req: true, options: opt(REFER_TO.map(([v, l]) => ({ v, l })), '', 'Choose') })}
      ${field('Why', 'referWhy', '', 'select', { req: true, options: opt(REFER_WHY, '', 'Choose') })}${field('Date', 'date', today(), 'date', { req: true })}${field('Note for that section', 'referNote', '', 'textarea', { wide: true, rows: 3 })}</div>
    <button class="btn pri" style="margin-top:12px">Refer</button></form>`;
}
function vReferrals(r) {
  const q = r.q, mine = REFER_TO.map(x => x[0]).filter(k => hasFlag(k)), tq = q.get('to') || (seesOverview() ? 'all' : myTeam() || (mine.length === 1 ? mine[0] : 'all')), to = tq === 'all' ? '' : tq;
  const open = referOpen(to), done = S.events.filter(e => e.type === 'Referral' && referClosed(e.id) && (!to || e.to === to) && child(e.childId)).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 30);
  return `<div class="top"><div><h1>Referrals between sections</h1><p class="lead">One section asks another to follow a child.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><select class="in" data-filter="to" style="width:auto" aria-label="Referred to">${opt([{ v: 'all', l: 'To every section' }].concat(REFER_TO.map(([v, l]) => ({ v, l: 'To ' + l }))), to || 'all')}</select><button class="btn sm" data-act="xl" data-k="referrals">Export in Excel</button><a class="btn pri" href="#/referrals/new">Refer a child</a></div></div>
  <section class="card refcard"><h2>Open · ${open.length}</h2><p class="sub" style="margin:2px 0 6px">Write what was done, then tap Done.</p>${open.length ? open.map(referItem).join('') : '<p class="empty">No open referral.</p>'}</section>
  <section class="card"><h2>Done · ${done.length}</h2>${done.length ? done.map(e => { const c = child(e.childId), cl = referClosed(e.id); return `<div class="it"><div class="w"><b>${childLink(c)}</b><span>${esc(referLabel(e.from) || 'A section')} → ${esc(referLabel(e.to))}: ${esc(e.reason || '')} · ${esc(fmtDate(e.date))}</span><span>Done ${esc(fmtDate(cl.date))} by ${esc(staffName(cl.by))}: ${esc(cl.note || '')}</span></div></div>`; }).join('') : '<p class="empty">Nothing yet.</p>'}</section>`;
}

/* ---------- the school visit: the fields of the School Monitoring Form ---------- */
function lastSchoolText(c) { const v = c ? schoolVisits(c)[0] : null; return v ? fmtDate(v.date) + [v.schAtt, v.perf, v.trend].filter(Boolean).map(x => ' · ' + x).join('') : ''; }
function schoolVisitFields(c) {
  const last = lastSchoolText(c);
  return `<input type="hidden" name="purpose" value="School visit"><input type="hidden" name="where" value="School">
      ${field('Visited by', 'by', '', 'select', { options: opt(activeStaff().map(s => ({ v: s.id, l: s.name })), USER.id) })}
      ${field('Did the visit take place?', 'successful', '', 'select', { options: opt([{ v: 'Yes', l: 'Yes' }, { v: 'No', l: 'No, nobody found' }], 'Yes') })}
      <div class="note" style="grid-column:1/-1;margin:0">Last school visit: <b>${esc(last || (c ? 'none recorded' : 'choose the child first'))}</b></div>
      ${field('School', 'place', c ? schoolNorm(c.schoolName) : '', 'text', { attrs: ' list="schoolnames"' })}
      ${field('Grade teacher', 'teacher', '', 'text')}
      ${field('Phone of the teacher', 'teacherPhone', '', 'tel')}
      ${field('Attendance', 'schAtt', '', 'select', { options: opt(SCH_ATT, '', 'Choose') })}
      ${field('Academic performance', 'perf', '', 'select', { options: opt(PERF, '', 'Choose') })}
      ${field('Academic performance: details', 'perfNote', '', 'text', { wide: true })}
      ${field('Co-curriculum activities', 'cocurr', '', 'text')}
      ${field('General behaviour', 'behaviour', '', 'text')}
      ${field('Interaction with the teachers', 'intTeachers', '', 'text')}
      ${field('Interaction with the schoolmates', 'intMates', '', 'text')}
      ${field("Teacher's comment", 'teacherComment', '', 'textarea', { wide: true, rows: 2 })}
      ${field('Weaknesses and/or challenges', 'weak', '', 'text')}
      ${field('Strengths', 'strong', '', 'text')}
      ${field('Name of class teacher', 'classTeacher', '', 'text')}
      ${field('Comparison with the last visit', 'trend', '', 'select', { options: opt(TREND, '', last ? 'Choose' : 'First visit') })}
      ${c && isAba(c) ? `<p class="sec" style="grid-column:1/-1;margin:6px 0 0">ABA child: update / closing report</p>
      ${field('Optional subject chosen', 'abaOptional', '', 'text')}
      ${field('Exams: statement of results', 'abaExam', '', 'text', { hint: 'Improving or decreasing from last year' })}
      ${field('Suggestion from the teacher: academic performance', 'abaSugAcad', '', 'text', { wide: true })}
      ${field('Change in the academic performance of the last three years', 'aba3y', '', 'text', { wide: true })}
      ${field('Suggestion from the teacher: social behaviour', 'abaSugSoc', '', 'text', { wide: true })}` : ''}
      ${field('Interventions and way forward', 'action', '', 'text', { wide: true, hint: 'Stays in Actions still open until done.' })}${schoolList()}`;
}
function schoolFindings(o) {
  const p = [['Attendance', o.schAtt], ['Performance', [o.perf, o.perfNote].filter(Boolean).join(', ')], ['Behaviour', o.behaviour], ['With teachers', o.intTeachers], ['With schoolmates', o.intMates], ['Co-curriculum', o.cocurr], ["Teacher's comment", o.teacherComment], ['Weaknesses', o.weak], ['Strengths', o.strong], ['Compared with the last visit', o.trend]];
  return p.filter(x => x[1]).map(x => x[0] + ': ' + x[1]).join('. ');
}

/* ---------- results per term ---------- */
function vTerm(c) {
  const n = termNow(), q = route().q, y = Number(q.get('y')) || n.y, t = Number(q.get('t')) || n.t, old = (c.terms || []).find(r => r.y === y && r.t === t) || {};
  const subs = (old.subjects || []).concat(Array.from({ length: 10 }, () => ({}))).slice(0, 10);
  return `<div class="top"><div><h1>Term result · ${esc(fullName(c))}</h1><p class="lead">${esc(schoolOf(c))}${c.grade ? ' · ' + esc(gradeLabel(c.grade)) : ''}</p></div><a class="btn" href="${q.get('back') === 'pu' ? '#/pupil/' : '#/child/'}${esc(c.id)}">Back</a></div>
  <form class="card" data-form="term" style="max-width:820px"><input type="hidden" name="id" value="${esc(c.id)}">${q.get('back') === 'pu' ? '<input type="hidden" name="back" value="pu">' : ''}
    <div class="fs two">${field('Year', 'y', y, 'number', { req: true })}${field('Term', 't', '', 'select', { req: true, options: opt([1, 2, 3].map(v => ({ v, l: 'Term ' + v + ' · ' + TERM_MONTHS[v] })), t) })}
      ${field('Academic performance', 'perf', '', 'select', { options: opt(PERF, old.perf || '', 'Choose') })}${field('Position in class', 'pos', old.pos || '', 'text')}
      ${field('Days absent', 'absent', old.absent == null ? '' : old.absent, 'number')}${field('End of the year', 'yearEnd', '', 'select', { options: opt(YEAR_END, old.yearEnd || '', 'Not the end of the year') })}
      ${field('Strong subjects', 'strong', old.strong || '', 'text')}${field('Weak subjects', 'weak', old.weak || '', 'text')}
      ${field('Note', 'note', old.note || '', 'text', { wide: true })}</div>
    <details class="marks"${(old.subjects || []).length ? ' open' : ''}><summary>Marks by subject (if you want to keep them)</summary>
      <div class="tw"><table class="mt"><thead><tr><th>Subject</th><th>Test 1</th><th>Test 2</th><th>End of term</th><th>Grade</th></tr></thead><tbody>
      ${subs.map((s, i) => `<tr><td><input class="in" name="ms${i}" value="${esc(s.s || '')}" aria-label="Subject ${i + 1}"></td><td><input class="in" name="m1${i}" value="${esc(s.t1 || '')}" inputmode="numeric" aria-label="Test 1"></td><td><input class="in" name="m2${i}" value="${esc(s.t2 || '')}" inputmode="numeric" aria-label="Test 2"></td><td><input class="in" name="me${i}" value="${esc(s.e || '')}" inputmode="numeric" aria-label="End of term"></td><td><input class="in" name="mg${i}" value="${esc(s.g || '')}" aria-label="Grade"></td></tr>`).join('')}
      </tbody></table></div></details>
    <button class="btn pri" style="margin-top:12px">Save the term</button></form>`;
}
function termRow(c, r) { const av = termAvg(r); return `<tr><td><b>${r.y} Term ${r.t}</b></td><td>${esc(r.perf || '')}${av != null ? ` <span class="sub">average ${av}</span>` : ''}</td><td>${esc(r.pos || '')}</td><td>${r.absent == null || r.absent === '' ? '' : esc(r.absent)}</td><td>${esc(r.weak || '')}</td><td>${esc(r.yearEnd || '')}</td><td><a class="btn sm" href="#/child/${esc(c.id)}/term?y=${r.y}&t=${r.t}">Change</a></td></tr>`; }

/* ---------- the school box on the file of the child: what every section knows, in one place ---------- */
function schoolBox(c) {
  const pupil = isPupil(c) || (c.terms || []).length || schoolVisits(c).length;
  /* not a pupil: the education box all the same, with Change (comment of 24/11) */
  if (!pupil) return sportsOnly() ? '' : `<section class="card" id="schoolbox"><div class="cardhead"><h2 style="margin:0">Education</h2><a class="btn sm" href="#/child/${esc(c.id)}/edu">Change</a></div><dl class="dl" style="margin-top:8px"><dt>By day goes to</dt><dd>${esc(dayLabel(dayType(c)) || 'Not written')}</dd>${c.schoolName ? `<dt>School</dt><dd>${esc(schoolNorm(c.schoolName))}</dd>` : ''}${c.skill ? `<dt>Skill or trade</dt><dd>${esc(c.skill)}</dd>` : ''}</dl></section>`;
  const sv = schoolVisits(c), v = sv[0], n = termNow(), [ta, tb] = termRange(n.y, n.t), inTerm = sv.some(x => inRange(x.date, ta, tb)), T = termsOf(c), pr = progressOf(c);
  const regs = attCentres(c).filter(k => k !== 'Luigi').map(k => { const a = attLast(c, attKey(c, k), 30); return a.n ? `${CENTRE_LABEL[k]}: present ${a.p} of ${a.n} days marked` : `${CENTRE_LABEL[k]}: no marks in the last 30 days`; });
  const hv = lastHomeVisit(c), ses = S.sessions.filter(s => (s.children || []).map(String).includes(String(c.id))).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const row = (k, x) => x ? `<dt>${k}</dt><dd>${x}</dd>` : '';
  return `<section class="card" id="schoolbox"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><h2 style="margin:0">School ${trendChip(pr)}</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><a class="btn sm" href="#/child/${esc(c.id)}/edu">Change</a><a class="btn sm pri" href="#/pupil/${esc(c.id)}">School page of the pupil</a></div></div>
    <dl class="dl" style="margin-top:8px">${row('School', esc(schoolOf(c)) + (c.grade ? ' · ' + esc(gradeLabel(c.grade)) : '') + (c.stream ? ' ' + esc(c.stream) : ''))}
      ${row('Last school visit', v ? `${esc(fmtDate(v.date))}${v.schAtt ? ' · attendance ' + esc(v.schAtt.toLowerCase()) : ''}${v.perf ? ' · ' + esc(v.perf.toLowerCase()) : ''}${v.trend ? ' · ' + esc(v.trend.toLowerCase()) : ''}` : 'None recorded')}
      ${row(termLabel(n), inTerm ? 'Visited' : n.hol ? 'Not visited' : '<span class="chip c-orange">Not visited yet</span>')}
      ${row('Registers, last 30 days', regs.map(esc).join('<br>'))}
      ${row('Last home visit', hv ? esc(fmtDate(hv)) : 'None recorded')}
      ${row('Counselling', ses.length ? ses.length + (ses.length === 1 ? ' session' : ' sessions') + ', last ' + esc(fmtDate(ses[0].date)) : '')}</dl>
    ${T.length ? `<div class="tw" style="margin-top:8px"><table class="mt"><thead><tr><th>Term</th><th>Performance</th><th>Position</th><th>Days absent</th><th>Weak subjects</th><th>End of the year</th><th><span class="vh">Change</span></th></tr></thead><tbody>${T.slice(0, 6).map(r => termRow(c, r)).join('')}</tbody></table></div>` : ''}</section>`;
}

/* ---------- pupils by school: who was visited this term, how they are doing ---------- */
function schoolRows(q, all) {
  const x = termSel(q), [ta, tb] = termRange(x.y, x.t), ty = q.get('ty') || 'out', ce = q.get('sc') || '', show = q.get('show') || '';
  const refs = new Set(referOpen().map(e => String(e.childId)));
  const base = S.children.filter(c => isPupil(c) && (ty === 'all' || (ty === 'out') === outsideSchool(c)) && (!ce || centreOf(c) === ce)).map(c => {
    const sv = schoolVisits(c), inT = sv.filter(v => inRange(v.date, ta, tb)), v = sv[0] || null, tr = (c.terms || []).find(r => r.y === x.y && r.t === x.t) || null;
    return { c, school: schoolOf(c), v, visited: inT.length > 0, vt: inT.length ? inT[0].date : '', tr, pr: progressOf(c), ref: refs.has(String(c.id)) };
  });
  if (all) return base;
  if (show === 'nosch') { const seen = new Set(base.filter(r => r.visited).map(r => r.school)), sn0 = base.some(r => r.school === q.get('sn')) ? q.get('sn') : ''; return base.filter(r => !seen.has(r.school) && (!sn0 || r.school === sn0)); }
  const sn = base.some(r => r.school === q.get('sn')) ? q.get('sn') : '';
  return base.filter(r => (!sn || r.school === sn) && (!show || (show === 'novisit' ? !r.visited : show === 'att' ? r.v && r.v.schAtt && r.v.schAtt !== 'Regular' : show === 'down' ? r.pr === 'Decreasing' || (r.v && r.v.perf === 'Below average') || (r.tr && r.tr.perf === 'Below average') : show === 'noterm' ? !r.tr : r.ref)));
}
function vSchool(r) {
  const q = r.q, x = termSel(q), rows = schoolRows(q), n = termNow(), pm0 = planMonth(), pm = termHoliday(pm0 + '-01') ? addMonths(pm0, 1) : pm0, inPl = new Set(planFor(pm, 'School', 'all').map(p => String(p.childId)));
  const names = {}; for (const r of schoolRows(q, true)) names[r.school] = (names[r.school] || 0) + 1;
  const terms = []; for (let y = n.y, t = n.t, i = 0; i < 6; i++) { terms.push({ v: y + '-' + t, l: y + ' · Term ' + t + ' (' + TERM_SHORT[t] + ')' }); t--; if (!t) { t = 3; y--; } }
  const by = {}; for (const r of rows) (by[r.school] = by[r.school] || []).push(r);
  const schools = Object.entries(by).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const vis = rows.filter(r => r.visited).length, doneS = schools.filter(([, l]) => l.some(r => r.visited)).length, nx = termNext(n), hol = n.hol && termIsNow(x), tile = (nn, l) => `<div class="tile"><b>${nn}</b><span>${l}</span></div>`;
  const cnt = k => rows.filter(r => r.pr === k).length;
  return `<div class="top"><div><p class="kick">Database of pupils · School Section</p><h1>Pupils by school · ${esc(termLabel(x))}</h1><p class="lead">${esc(TERM_MONTHS[x.t])}. Every school is visited at least once in the term.${hol ? ` <b>School holidays now: Term ${nx.t} starts in ${TERM_START[nx.t]}.</b>` : ''}</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#/referrals?to=School">Referrals</a><button class="btn" data-act="xl" data-k="school">Export in Excel</button></div></div>
  <div class="card filters" style="grid-template-columns:repeat(5,minmax(0,1fr))">
    <label class="f">Term<select class="in" data-filter="tm">${opt(terms, x.y + '-' + x.t)}</select></label>
    <label class="f">School<select class="in" data-filter="sn">${opt(Object.keys(names).sort((a, b) => a.localeCompare(b)).map(k => ({ v: k, l: k + ' · ' + names[k] })), names[q.get('sn')] ? q.get('sn') : '', 'Every school')}</select></label>
    <label class="f">Schools<select class="in" data-filter="ty">${opt([{ v: 'out', l: 'GRZ, private, college' }, { v: 'in', l: 'Community school, literacy class' }, { v: 'all', l: 'All schools' }], q.get('ty') || 'out')}</select></label>
    <label class="f">Centre<select class="in" data-filter="sc">${opt(CENTRES.map(k => ({ v: k, l: CENTRE_LABEL[k] })), q.get('sc') || '', 'All centres')}</select></label>
    <label class="f">Show<select class="in" data-filter="show">${opt([{ v: 'nosch', l: 'Schools not visited this term' }, { v: 'novisit', l: 'Pupils not visited this term' }, { v: 'att', l: 'Attendance irregular or absent' }, { v: 'down', l: 'Below average or decreasing' }, { v: 'noterm', l: 'No term result yet' }, { v: 'ref', l: 'Referred, still open' }], q.get('show') || '', 'Everyone')}</select></label></div>
  <div class="grid g4">${tile(rows.length, 'Pupils')}${tile(doneS + ' / ' + schools.length, 'Schools visited this term')}${tile(vis + ' / ' + rows.length, 'Pupils seen this term')}${tile(cnt('Improving') + ' · ' + cnt('Decreasing'), 'Improving · decreasing')}</div>
  ${schools.map(([name, l]) => { const left = l.filter(r => !r.visited).length, seen = l.length - left, last = l.map(r => r.vt).sort().pop() || '';
    return `<section class="card schcard" style="padding:8px 10px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center;padding:2px 2px 6px"><h2 style="margin:0">${esc(name)} · ${l.length} ${seen ? `<span class="chip c-green">Visited ${esc(fmtDate(last))}</span> <span class="sub">${seen === l.length ? 'all pupils seen' : seen + ' of ' + l.length + ' pupils seen'}</span>` : '<span class="chip c-orange">Not visited this term</span>'}</h2><span class="schact">${left ? (l.filter(r => !r.visited).every(r => inPl.has(String(r.c.id))) ? `<span class="chip c-green">In the plan · ${esc(fmtMonth(pm))}</span><a class="btn sm" href="#/visits?vt=School&vtab=plan&m=${pm}">Open the plan</a>` : `<button class="btn pri" data-sact="planschool" data-school="${esc(name)}" data-m="${pm}">Plan the visit · ${esc(fmtMonth(pm))}</button>`) : ''}<a class="btn" href="#/schoolvisit?sn=${encodeURIComponent(name)}">Record the visit</a></span></div>
      <div class="tw"><table class="mt"><thead><tr><th>Pupil</th><th>Class</th><th>Last school visit</th><th>Attendance</th><th>Performance</th><th>Progress</th><th></th></tr></thead><tbody>${l.sort((a, b) => fullName(a.c).localeCompare(fullName(b.c))).map(r => `<tr><td>${pupilLink(r.c)} ${centreChip(r.c)}${r.ref ? ' <span class="chip c-orange">Referred</span>' : ''}</td><td>${esc(r.c.grade || '')}</td><td>${r.v ? esc(fmtDate(r.v.date)) : '<span class="sub">never</span>'}${r.visited ? '' : ' <span class="chip c-orange">not this term</span>'}</td><td>${esc((r.v && r.v.schAtt) || '')}</td><td>${esc((r.tr && r.tr.perf) || (r.v && r.v.perf) || '')}</td><td>${trendChip(r.pr)}</td><td><a class="btn sm" href="#/visit/new?child=${esc(r.c.id)}&t=School">Record a visit</a></td></tr>`).join('')}</tbody></table></div></section>`; }).join('') || '<p class="empty">No pupil here.</p>'}`;
}
/* ---------- one visit to a school: the pupils seen that day, one School Monitoring Form each ---------- */
function schoolPupils(sn) { return S.children.filter(c => isPupil(c) && schoolOf(c) === sn).sort((a, b) => fullName(a).localeCompare(fullName(b))); }
function sheetOn(c, d) { return visitsOf(c.id).find(v => v.purpose === 'School visit' && v.date === d) || null; }
/* a school visit is a school on a day; the forms filled that day belong to it */
function schoolTrips(a, b) { const m = {}; for (const v of S.visits) { if (v.purpose !== 'School visit' || !inRange(v.date, a, b) || !child(v.childId)) continue; const sn = visitSchool(v); if (!sn) continue; const k = v.date + '|' + sn; (m[k] = m[k] || { date: v.date, school: sn, forms: [] }).forms.push(v); } return Object.values(m).sort((x, y) => y.date.localeCompare(x.date) || x.school.localeCompare(y.school)); }
function schoolTripsHtml(a, b, label) { const T = schoolTrips(a, b); return `<section class="card" id="trips"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:6px"><h2 style="margin:0">School visits · ${esc(label)} · ${T.length}</h2><a class="btn pri" href="#/schoolvisit">Record a school visit</a></div>${T.length ? T.map(t => `<div class="it"><div class="w"><b>${esc(t.school)}</b><span>${esc(fmtDate(t.date))} · ${t.forms.length} ${t.forms.length === 1 ? 'pupil' : 'pupils'} seen</span></div><a class="btn sm" href="#/schoolvisit?sn=${encodeURIComponent(t.school)}&d=${t.date}">Open the visit</a></div>`).join('') : '<p class="empty">No school visit recorded.</p>'}</section>`; }
function vSchoolVisit(r) {
  const q = r.q, sn = q.get('sn') || '', d = q.get('d') && q.get('d') <= today() ? q.get('d') : today(), n = termNow(), [ta, tb] = termRange(n.y, n.t), kids = sn ? schoolPupils(sn) : [];
  if (!kids.length) {
    const by = {}; for (const c of S.children) if (isPupil(c)) { const k = schoolOf(c); (by[k] = by[k] || { out: outsideSchool(c), l: [] }).l.push(c); }
    const tile = ([k, g]) => { const last = g.l.map(lastSchoolVisit).sort().pop() || '', inT = inRange(last, ta, tb); return `<a class="scard${inT ? ' done' : ''}" href="#/schoolvisit?sn=${encodeURIComponent(k)}"><b>${esc(k)}</b><span>${g.l.length} ${g.l.length === 1 ? 'pupil' : 'pupils'}</span><span class="chip ${inT ? 'c-green' : 'c-orange'}">${inT ? 'Visited ' + esc(fmtDate(last)) : 'Not visited this term'}</span></a>`; };
    const E = Object.entries(by).filter(([k]) => k !== 'School name not written').sort((a, b) => b[1].l.length - a[1].l.length || a[0].localeCompare(b[0])), out = E.filter(x => x[1].out), own = E.filter(x => !x[1].out);
    return `<div class="top"><div><h1>Record a school visit</h1></div><a class="btn" href="#/visits?vt=School">Back</a></div>
    <p class="vq">Which school did you visit?</p>
    <div class="sgrid">${out.map(tile).join('') || '<p class="empty">No pupil with a school written.</p>'}</div>${own.length ? `<p class="sec" style="margin:18px 0 8px">Schools of the project</p><div class="sgrid">${own.map(tile).join('')}</div>` : ''}`;
  }
  const rows = kids.map(c => ({ c, v: sheetOn(c, d), last: lastSchoolVisit(c) })), seen = rows.filter(x => x.v).length, tile = (nn, l) => `<div class="tile"><b>${nn}</b><span>${l}</span></div>`;
  const row = ({ c, v, last }) => `<div class="it">${avatar(c, 40)}<div class="w"><b>${pupilLink(c)}</b> ${centreChip(c)}<span>${esc(gradeLabel(c.grade) || 'class not written')}${v ? (v.schAtt ? ' · attendance ' + esc(v.schAtt.toLowerCase()) : '') + (v.perf ? ' · ' + esc(v.perf.toLowerCase()) : '') + (v.trend ? ' · ' + esc(v.trend.toLowerCase()) : '') : ' · last form: ' + (last ? esc(fmtDate(last)) : 'never')}</span></div>${v ? `<span class="chip c-green">Form filled</span><a class="btn sm" href="#/visitrep/${esc(v.id)}">Open the form</a>` : `<a class="btn sm pri" href="#/visit/new?child=${esc(c.id)}&t=School&d=${d}&back=sv">Fill the form</a>`}</div>`;
  return `<div class="top"><div><p class="kick">School visit</p><h1>${esc(sn)}</h1></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#/schoolvisit">Another school</a><a class="btn" href="#/school?ty=all&sn=${encodeURIComponent(sn)}">Results of the term</a></div></div>
  ${dayBar(d, 'd')}
  <div class="grid g4" style="margin-top:12px">${tile(kids.length, 'Pupils in this school')}${tile(seen + ' / ' + kids.length, 'Forms filled this day')}</div>
  <section class="card" style="padding:8px 10px"><p class="sub" style="margin:4px 2px 6px">One School Monitoring Form for each pupil seen.</p>${rows.filter(x => !x.v).map(row).join('')}${seen ? `<div class="grp">Done · ${seen}</div>` + rows.filter(x => x.v).map(row).join('') : ''}</section>`;
}
/* ---------- one page for one pupil: the forms of the school visits and the results of the terms, nothing else ---------- */
function pupilLink(c) { return `<a href="#/pupil/${esc(c.id)}">${esc(fullName(c))}</a>${c.nickname ? ` <span class="sub">"${esc(c.nickname)}"</span>` : ''}`; }
function vPupil(r) {
  const c = child(r.id); if (!c) return '<div class="top"><div><h1>Pupil</h1></div></div><div class="card"><p class="empty">This child is not in the database.</p></div>';
  const sv = schoolVisits(c), n = termNow(), [ta, tb] = termRange(n.y, n.t), inT = sv.some(x => inRange(x.date, ta, tb)), T = termsOf(c), pr = progressOf(c), sn = schoolOf(c), tile = (nn, l) => `<div class="tile"><b>${nn}</b><span>${l}</span></div>`;
  const mk = T.find(x => (x.subjects || []).length);
  return `<div class="top"><div><p class="kick">Pupil · School Section</p><h1 class="ph1">${avatar(c, 52)}<a href="#/child/${esc(c.id)}" aria-label="Open the file of ${esc(fullName(c))}">${esc(fullName(c))}</a></h1><p class="lead">${esc(sn)}${c.grade ? ' · ' + esc(gradeLabel(c.grade)) : ''}${c.stream ? ' ' + esc(c.stream) : ''} ${centreChip(c)}</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${schoolPupils(sn).length ? `<a class="btn" href="#/schoolvisit?sn=${encodeURIComponent(sn)}">The pupils of the school</a>` : ''}<a class="btn" href="#/child/${esc(c.id)}">The file of the child</a></div></div>
  <div class="grid g4">${tile(sv[0] ? esc(fmtDate(sv[0].date)) : 'Never', 'Last school visit')}${tile(inT ? 'Visited' : n.hol ? 'Not visited' : 'Not yet', esc(termLabel(n)))}${tile(pr ? esc(pr) : '-', 'Progress')}</div>
  <section class="card" id="pforms"><div class="phead"><h2><span class="pnum">1</span>School visits · ${sv.length}</h2><a class="btn pri" href="#/visit/new?child=${esc(c.id)}&t=School&back=pu">Fill a form</a></div>
    ${sv.length ? sv.map(v => `<div class="it"><div class="w"><b>${esc(fmtDate(v.date))}</b><span>${[v.schAtt ? 'Attendance ' + v.schAtt.toLowerCase() : '', v.perf || '', v.by ? 'by ' + staffName(v.by) : ''].filter(Boolean).map(esc).join(' · ')}</span></div>${trendChip(v.trend)}<a class="btn sm" href="#/visitrep/${esc(v.id)}">Open the form</a></div>`).join('') : '<p class="empty">No form yet.</p>'}</section>
  <section class="card" id="pterms"><div class="phead"><h2><span class="pnum">2</span>Term results · ${T.length}</h2><a class="btn pri" href="#/child/${esc(c.id)}/term?back=pu">Add a term result</a></div>
    ${T.length ? T.map(x => `<div class="it"><div class="w"><b>${x.y} Term ${x.t}</b><span>${[x.perf, x.pos ? 'position ' + x.pos : '', termAvg(x) != null ? 'average mark ' + termAvg(x) : '', x.absent === '' || x.absent == null ? '' : x.absent + ' days absent', x.yearEnd].filter(Boolean).map(esc).join(' · ') || 'Nothing written'}</span></div><a class="btn sm" href="#/child/${esc(c.id)}/term?y=${x.y}&t=${x.t}&back=pu">Change</a></div>`).join('') : '<p class="empty">No term result yet.</p>'}
    ${mk ? `<h3 style="margin:16px 0 6px">Marks · ${mk.y} Term ${mk.t}</h3><div class="tw"><table class="mt"><thead><tr><th>Subject</th><th>Test 1</th><th>Test 2</th><th>End of term</th><th>Grade</th></tr></thead><tbody>${mk.subjects.map(s2 => `<tr><td>${esc(s2.s)}</td><td>${esc(s2.t1 || '')}</td><td>${esc(s2.t2 || '')}</td><td>${esc(s2.e || '')}</td><td>${esc(s2.g || '')}</td></tr>`).join('')}</tbody></table></div>` : ''}</section>`;
}
/* To do: the schools with pupils where no school visit is written in the term */
function schoolsLeft(x) { const [ta, tb] = termRange(x.y, x.t), m = {}; for (const c of S.children) { if (!isPupil(c) || !outsideSchool(c)) continue; const n = schoolOf(c); if (n === 'School name not written') continue; m[n] = m[n] || schoolVisits(c).some(v => inRange(v.date, ta, tb)); } const all = Object.keys(m); return { all: all.length, left: all.filter(k => !m[k]).length }; }
const SCHOOL_COLS = [{ label: 'School', get: r => r.school }, { label: 'ID', get: r => r.c.id }, { label: 'Name', get: r => fullName(r.c) }, { label: 'Sex', get: r => r.c.sex }, { label: 'Centre', get: r => centreOf(r.c) }, { label: 'Type of school', get: r => dayLabel(dayType(r.c)) }, { label: 'Grade', get: r => r.c.grade || '' },
  { label: 'Pupil seen this term', get: r => r.visited ? 'Yes' : 'No' }, { label: 'Last school visit', get: r => r.v ? r.v.date : '' }, { label: 'Attendance', get: r => (r.v && r.v.schAtt) || '' }, { label: 'Performance (last visit)', get: r => (r.v && r.v.perf) || '' },
  { label: 'Term result', get: r => (r.tr && r.tr.perf) || '' }, { label: 'Position in class', get: r => (r.tr && r.tr.pos) || '' }, { label: 'Days absent', get: r => r.tr && r.tr.absent != null ? r.tr.absent : '' }, { label: 'Average mark', get: r => r.tr && termAvg(r.tr) != null ? termAvg(r.tr) : '' }, { label: 'End of the year', get: r => (r.tr && r.tr.yearEnd) || '' },
  { label: 'Progress', get: r => r.pr }, { label: 'Referred, open', get: r => r.ref ? 'Yes' : '' }, { label: 'ABA', get: r => isAba(r.c) ? 'Yes' : '' }];
/* logframe SO1.2: pupils with an end-of-year result written for the year */
function promotedIn(y) { const all = [], ok = []; for (const c of S.children) { const r = (c.terms || []).filter(x => x.y === y && x.yearEnd && x.yearEnd !== 'Results not out yet').sort((a, b) => b.t - a.t)[0]; if (!r) continue; all.push(c); if (/^Promoted|^Completed/.test(r.yearEnd)) ok.push(c); } return { all, ok }; }

/* ---------- saving ---------- */
FORMS.refer = function (o) { const c = child(o.id); if (!c) return toast('Choose a child'); if (!o.referTo) return toast('Choose the section'); referAdd(c.id, o.from, o.referTo, o.referWhy, o.referNote, o.date); save(); toast('Referred to ' + referLabel(o.referTo)); go('#/child/' + c.id); };
FORMS.referdone = function (o) { const e = S.events.find(x => x.id === o.id); if (!e || referClosed(e.id)) return render(); S.events.push({ id: uid('e'), childId: String(e.childId), type: 'Referral closed', ref: e.id, date: today(), note: (o.note || '').trim(), by: USER.id }); save(); toast('Referral closed'); render(); };
FORMS.term = function (o) {
  const c = child(o.id), y = Number(o.y), t = Number(o.t); if (!c || !y || ![1, 2, 3].includes(t)) return toast('Write the year and the term');
  const subjects = []; for (let i = 0; i < 10; i++) { const s = (o['ms' + i] || '').trim(); if (s) subjects.push({ s, t1: (o['m1' + i] || '').trim(), t2: (o['m2' + i] || '').trim(), e: (o['me' + i] || '').trim(), g: (o['mg' + i] || '').trim() }); }
  const r = { y, t, perf: o.perf || '', pos: (o.pos || '').trim(), absent: o.absent === '' || o.absent == null ? '' : Number(o.absent), strong: (o.strong || '').trim(), weak: (o.weak || '').trim(), note: (o.note || '').trim(), yearEnd: o.yearEnd || '', subjects, by: USER.id, on: today(), ts: Date.now() };
  c.terms = (c.terms || []).filter(x => !(x.y === y && x.t === t)).concat(r); c.updatedAt = today(); save(); toast('Term saved'); go(o.back === 'pu' ? '#/pupil/' + c.id : '#/child/' + c.id);
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-sact]'); if (!b) return; e.preventDefault();
  if (b.dataset.sact === 'planschool') { let n = 0; for (const r of schoolRows(route().q)) if (r.school === b.dataset.school && !r.visited && addPlan(r.c.id, b.dataset.m, 'School')) n++; save(); toast(n ? b.dataset.school + ': ' + n + (n === 1 ? ' pupil' : ' pupils') + ' in the plan of ' + fmtMonth(b.dataset.m) : 'Already in the plan'); render(); }
});
/* in the visit form, changing who made the visit shows the fields of that section */
document.addEventListener('change', e => {
  const s = e.target; if (!s.matches || !s.matches('form[data-form="visit"] select[name="team"]')) return;
  const f = s.form, id = (f.querySelector('[name="childId"]') || {}).value || '';
  if ((s.value === 'School') !== !!f.querySelector('[name="schAtt"]')) location.hash = '#/visit/new?' + (id ? 'child=' + encodeURIComponent(id) + '&' : '') + 't=' + s.value;
});

/* ====================================================================
   Minsundu Key Child Form: the monthly report of the key worker, one per child and month.
   The app fills what it already knows (school, registers, visits, counselling); the key worker writes the rest.
   Kept in the file of the child (c.monthly).
   ==================================================================== */
const PARENTAL = ['Both parents alive', 'Paternal orphan', 'Maternal orphan', 'Double orphan', 'Not known'];
const MONTHLY_FROM = '2026-11';
function monthlyOf(c, m) { return (c.monthly || []).find(r => r.m === m) || null; }
function monthlyKids(q) { const g = (q && q.get('mg')) || 'Resident'; return S.children.filter(c => isCurrent(c) && centreOf(c) === 'Minsundu' && (g === 'all' || (g === 'UCC' || g === 'Youth' ? c.section === g && c.residence === 'Resident' : g === 'Resident' ? c.residence === 'Resident' : !sleepsHere(c)))).sort((a, b) => fullName(a).localeCompare(fullName(b))); }
function monthDue() { const m = Number(today().slice(8)) >= 25 ? thisMonth() : addMonths(thisMonth(), -1); return m >= MONTHLY_FROM ? m : ''; }
function canCheck() { return USER.admin || /supervisor|head/i.test(USER.role || ''); }
/* what the app already knows about the child in the month */
function monthFacts(c, m) {
  const { a, b } = monthCtx(m), out = [], key = String(c.id); let p = 0, h = 0, bs = 0, ab = 0, st = 0, n = 0;
  for (const d of Object.keys(S.attendance)) { if (!inRange(d, a, b)) continue; const v = S.attendance[d][key]; if (v == null) continue; n++; if (v === 'P') p++; else if (v === 'H') h++; else if (v === 'B') bs++; else if (v === 'T') st++; else if (v === 'A') ab++; }
  out.push(['Register of the centre', n ? `present ${p} of ${n} days marked${h ? ', home ' + h : ''}${bs ? ', boarding school ' + bs : ''}${st ? ', on the street ' + st : ''}${ab ? ', absent ' + ab : ''}` : 'no marks this month']);
  for (const k of attCentres(c).filter(x => teacherReg(x))) { const kk = attKey(c, k); let pp = 0, nn = 0; for (const d of Object.keys(S.attendance)) { if (!inRange(d, a, b)) continue; const v = S.attendance[d][kk]; if (v == null) continue; nn++; if (v === 'P') pp++; } out.push([CENTRE_LABEL[k], nn ? `present ${pp} of ${nn} days marked` : 'no marks this month']); }
  const sv = schoolVisits(c)[0], T = termsOf(c)[0];
  out.push(['School', schoolOf(c) + (c.grade ? ', ' + gradeLabel(c.grade) : '')]);
  if (sv) out.push(['Last school visit', fmtDate(sv.date) + [sv.schAtt && 'attendance ' + sv.schAtt.toLowerCase(), sv.perf && sv.perf.toLowerCase(), sv.trend && sv.trend.toLowerCase()].filter(Boolean).map(x => ', ' + x).join('')]);
  if (T) out.push(['Last term result', T.y + ' Term ' + T.t + (T.perf ? ', ' + T.perf.toLowerCase() : '') + (T.pos ? ', position ' + T.pos : '')]);
  const hv = visitsOf(c.id).filter(v => v.purpose !== 'School visit' && inRange(v.date, a, b)); if (hv.length) out.push(['Home visits this month', hv.map(v => fmtDate(v.date)).join(', ')]);
  const ses = S.sessions.filter(s => inRange(s.date, a, b) && (s.children || []).map(String).includes(key)); if (ses.length) out.push(['Counselling this month', ses.length + (ses.length === 1 ? ' session' : ' sessions')]);
  const ev = S.events.filter(e => String(e.childId) === key && inRange(e.date, a, b) && !/^Referral|^Visit |^Task/.test(e.type)); if (ev.length) out.push(['Happened this month', ev.map(e => e.type + (e.note && !CONF_EVENTS.includes(e.type) && (!HEALTH_EVENTS.includes(e.type) || seesHealth(c)) ? ': ' + e.note : '')).join('; ')]);
  const rf = referOpen().filter(e => String(e.childId) === key); if (rf.length) out.push(['Referred, still open', rf.map(e => referLabel(e.to) + ': ' + e.reason).join('; ')]);
  return out;
}
function schoolGuess(c) { const v = schoolVisits(c)[0], T = termsOf(c)[0]; return (T && T.perf) || (v && v.perf) || ''; }
function vMonthly1(c) {
  const q = route().q, m = /^\d{4}-\d{2}$/.test(q.get('m') || '') ? q.get('m') : (monthDue() || thisMonth()), old = monthlyOf(c, m) || {}, prev = monthlyOf(c, addMonths(m, -1));
  return `<div class="top"><div><h1>Monthly report · ${esc(fullName(c))}</h1><p class="lead">Key child form · ${esc(fmtMonth(m))}</p></div><a class="btn" href="#/child/${esc(c.id)}">Back</a></div>
  <section class="card"><h2>From the app</h2><dl class="dl">${[['Age', curAge(c) !== '' ? curAge(c) + ' years' : '']].concat(monthFacts(c, m)).filter(x => x[1]).map(x => `<dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd>`).join('')}</dl></section>
  <form class="card" data-form="monthly" style="max-width:820px"><input type="hidden" name="id" value="${esc(c.id)}"><input type="hidden" name="m" value="${m}">
    <div class="fs two">${field('Parental status', 'parental', '', 'select', { options: opt(PARENTAL, c.parentalStatus || '', 'Choose') })}${field('School performance', 'perf', old.perf != null ? old.perf : schoolGuess(c), 'text')}
      ${field('General behaviour', 'behaviour', old.behaviour || '', 'textarea', { wide: true, rows: 2 })}${seesHealth(c) ? field('Health status', 'health', old.health || '', 'text', { wide: true }) : `<p class="f wide" style="margin:0">${hiddenChip()} <span class="sub">Health status.</span></p>`}
      ${field('Strengths', 'strengths', old.strengths || '', 'textarea', { wide: true, rows: 2 })}${field('Weakness', 'weak', old.weak || '', 'textarea', { wide: true, rows: 2 })}
      ${field('Areas which need to be worked on', 'areas', old.areas || '', 'textarea', { wide: true, rows: 2 })}${field('Action plan / period', 'plan', old.plan || '', 'textarea', { wide: true, rows: 2 })}
      ${field('Note', 'note', old.note || '', 'text', { wide: true })}${field('Key worker', 'by', '', 'select', { options: opt(activeStaff().map(s => ({ v: s.id, l: s.name })), old.by || USER.id) })}${field('Date', 'on', old.on || today(), 'date', { req: true })}</div>
    ${prev && !old.m ? `<p class="sub" style="margin:10px 0 0">Last month's action plan: ${esc(prev.plan || 'not written')}</p>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center"><button class="btn pri">Save the report</button>${old.m ? (old.checkedBy ? `<span class="chip c-green">Checked by ${esc(staffName(old.checkedBy))} · ${esc(fmtDate(old.checkedOn))}</span>` : canCheck() ? `<button type="button" class="btn" data-sact="monthcheck" data-id="${esc(c.id)}" data-m="${m}">Checked by the supervisor</button>` : '<span class="chip c-orange">Not checked by the supervisor yet</span>') : ''}</div></form>`;
}
function monthlyBox(c) {
  if (centreOf(c) !== 'Minsundu' || (!isCurrent(c) && !(c.monthly || []).length)) return '';
  const m0 = monthDue() || thisMonth(), list = (c.monthly || []).slice().sort((a, b) => b.m.localeCompare(a.m)).slice(0, 6), has = monthlyOf(c, m0);
  return `<section class="card" id="monthlybox"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><div><h2 style="margin:0">Minsundu monthly reports</h2><p class="sub" style="margin:2px 0 0">Key Child Form, written by the key worker.</p></div><a class="btn sm${has ? '' : ' pri'}" href="#/child/${esc(c.id)}/month?m=${m0}">${has ? 'Open' : 'Write'} the report of ${esc(fmtMonth(m0))}</a></div>
    ${list.length ? list.map(r => `<div class="it"><div class="w"><b>${esc(fmtMonth(r.m))}</b><span>${esc([r.perf && 'School: ' + r.perf, r.behaviour, r.plan && 'Plan: ' + r.plan].filter(Boolean).join(' · ').slice(0, 220))}</span><span class="sub">${esc(staffName(r.by))}${r.checkedBy ? ' · checked by ' + esc(staffName(r.checkedBy)) : ' · not checked yet'}</span></div><a class="btn sm" href="#/child/${esc(c.id)}/month?m=${r.m}">Open</a></div>`).join('') : '<p class="empty">No monthly report yet.</p>'}</section>`;
}
function vMonthly(r) {
  const q = r.q, m = /^\d{4}-\d{2}$/.test(q.get('m') || '') ? q.get('m') : (monthDue() || thisMonth()), kids = monthlyKids(q), g = q.get('mg') || 'Resident';
  const done = kids.filter(c => monthlyOf(c, m)), chk = done.filter(c => monthlyOf(c, m).checkedBy), tile = (n, l) => `<div class="tile"><b>${n}</b><span>${l}</span></div>`;
  return `<div class="top"><div><h1>Monthly reports · ${esc(fmtMonth(m))}</h1><p class="lead">Minsundu key child form: one for each child, every month.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${monthPicker(m)}<button class="btn" data-act="xl" data-k="monthly">Export in Excel</button></div></div>
  <div class="seg" role="group" aria-label="Children" style="margin-bottom:10px">${[['Resident', 'Residents'], ['UCC', 'UCC'], ['Youth', 'Youth'], ['Non-resident', 'Non-residents'], ['all', 'Everyone']].map(([k, l]) => `<a href="#" data-q="mg=${k}" class="${g === k ? 'on' : ''}">${l}</a>`).join('')}</div>
  <div class="grid g4">${tile(kids.length, 'Children')}${tile(done.length, 'Reports written')}${tile(kids.length - done.length, 'Still to write')}${tile(chk.length, 'Checked by the supervisor')}</div>
  <section class="card" style="padding:6px 8px">${kids.length ? kids.map(c => { const x = monthlyOf(c, m); return `<div class="it">${avatar(c, 34)}<div class="w"><b>${childLink(c)}</b><span>${esc(c.section)} · ${esc(c.residence || '')}${x ? ' · ' + esc(staffName(x.by)) + ' · ' + esc(fmtDate(x.on)) : ''}</span></div>${x ? (x.checkedBy ? '<span class="chip c-green">Checked</span>' : '<span class="chip">Written</span>') : '<span class="chip c-orange">To write</span>'}<a class="btn sm${x ? '' : ' pri'}" href="#/child/${esc(c.id)}/month?m=${m}">${x ? 'Open' : 'Write'}</a></div>`; }).join('') : '<p class="empty">No child here.</p>'}</section>`;
}
const MONTHLY_COLS = [{ label: 'ID', get: x => x.c.id }, { label: 'Name', get: x => fullName(x.c) }, { label: 'UCC or Youth', get: x => x.c.section }, { label: 'Resident or not', get: x => x.c.residence || '' }, { label: 'Age', get: x => curAge(x.c) }, { label: 'Parental status', get: x => x.c.parentalStatus || '' }, { label: 'Grade', get: x => x.c.grade || '' }, { label: 'School', get: x => schoolOf(x.c) },
  { label: 'School performance', get: x => x.r.perf || '' }, { label: 'General behaviour', get: x => x.r.behaviour || '' }, { label: 'Health status', get: x => seesHealth(x.c) ? x.r.health || '' : (x.r.health ? HIDDEN_TXT : '') }, { label: 'Strengths', get: x => x.r.strengths || '' }, { label: 'Weakness', get: x => x.r.weak || '' }, { label: 'Areas to work on', get: x => x.r.areas || '' }, { label: 'Action plan / period', get: x => x.r.plan || '' }, { label: 'Note', get: x => x.r.note || '' },
  { label: 'Key worker', get: x => x.r.by ? staffName(x.r.by) : '' }, { label: 'Date', get: x => x.r.on || '' }, { label: 'Checked by', get: x => x.r.checkedBy ? staffName(x.r.checkedBy) : '' }];
FORMS.monthly = function (o) {
  const c = child(o.id); if (!c || !/^\d{4}-\d{2}$/.test(o.m || '')) return;
  const old = monthlyOf(c, o.m) || {}, t = k => String(o[k] || '').trim();
  const r = { m: o.m, perf: t('perf'), behaviour: t('behaviour'), health: 'health' in o ? t('health') : (old.health || ''), strengths: t('strengths'), weak: t('weak'), areas: t('areas'), plan: t('plan'), note: t('note'), by: o.by || USER.id, on: o.on || today(), ts: Date.now() };
  if (old.checkedBy && ['perf', 'behaviour', 'health', 'strengths', 'weak', 'areas', 'plan'].every(k => (old[k] || '') === r[k])) { r.checkedBy = old.checkedBy; r.checkedOn = old.checkedOn; }
  c.monthly = (c.monthly || []).filter(x => x.m !== o.m).concat(r); if (o.parental) c.parentalStatus = o.parental; c.updatedAt = today(); save(); toast('Report saved'); go('#/child/' + c.id);
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-sact="monthcheck"]'); if (!b || !canCheck()) return; e.preventDefault();
  const c = child(b.dataset.id), r = c && monthlyOf(c, b.dataset.m); if (!r) return; r.checkedBy = USER.id; r.checkedOn = today(); r.ts = Date.now(); c.updatedAt = today(); save(); toast('Checked'); render();
});
function monthlyLine(lines, centre) { const m = centre === 'Minsundu' ? monthDue() : ''; if (!m) return lines; const kids = monthlyKids(null), left = kids.filter(c => !monthlyOf(c, m)).length; if (left) lines.push({ n: left, text: 'monthly reports of ' + fmtMonth(m) + ' to write (residents)', href: '#/monthly?m=' + m, lvl: 'orange' }); return lines; }

/* ---------- lists of the School Section monthly report ---------- */
function schoolReportLists(m) {
  const { a, b } = monthCtx(m);
  const col = S.children.filter(c => inCareOn(c, b) && c.status !== 'Closed' && dayType(c) === 'College / skills training').sort((x, y) => fullName(x).localeCompare(fullName(y)));
  const sv = S.visits.filter(v => v.purpose === 'School visit' && inRange(v.date, a, b) && visitCounts(v)), by = {};
  for (const v of sv) { const n = visitSchool(v) || 'School not written'; (by[n] = by[n] || new Set()).add(String(v.childId)); }
  const schools = Object.entries(by).sort((x, y) => y[1].size - x[1].size || x[0].localeCompare(y[0]));
  return `<h3 style="margin:18px 0 6px">Those in college, university or skills training · ${col.length}</h3>
    ${col.length ? `<div class="tw"><table><thead><tr><th>Name</th><th>Year</th><th>College or university</th></tr></thead><tbody>${col.map(c => `<tr><td>${childLink(c)}</td><td>${esc(c.grade || '')}</td><td>${esc(schoolOf(c) || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nobody recorded in college or skills training.</p>'}
    <h3 style="margin:18px 0 6px">Schools visited in ${esc(fmtMonth(m))} · ${schools.length}</h3>
    ${schools.length ? `<div class="tw"><table><thead><tr><th>School</th><th class="n">Learners visited</th></tr></thead><tbody>${schools.map(([n, set]) => `<tr><td>${esc(n)}</td><td class="n">${set.size}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">No validated school visit this month.</p>'}`;
}
