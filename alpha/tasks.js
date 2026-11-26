/* ====================================================================
   Tasks (alpha 5.28): a task is given to a person, to several people or to a team.
   It shows in the Home of each of them until one of them taps Done.
   Stored as events (type "Task", closed by "Task done", opened again by "Task reopened"),
   so it travels with the shared database as it is, locked or not, with no change to the script.
   ==================================================================== */
const TASK_TEAMS = [['Admin', 'Education office'], ['Luigi', 'Luigi educators'], ['Minsundu', 'Minsundu educators'], ['Nkwazi', 'Nkwazi Centre educators'], ['Family', 'Family Section'], ['School', 'School Section'], ['Counseling', 'Counselling'], ['Sports', 'Sports']];
const TASK_EV = ['Task done', 'Task reopened', 'Task changed'];
const TASK_REPEAT = [['', 'No'], ['week', 'Every week'], ['month', 'Every month']];
function taskTeamLabel(k) { const x = TASK_TEAMS.find(t => t[0] === k); return x ? x[1] : k; }
/* a task can be changed by who gave it or by an Education admin: the change is a record of its own ("Task changed"), the last one counts */
function taskMerged(t) { const ch = S.events.filter(e => e.type === 'Task changed' && e.ref === t.id).sort((a, b) => (a.ts || 0) - (b.ts || 0)).pop(); return ch ? Object.assign({}, t, { title: ch.title, note: ch.note, due: ch.due, repeat: ch.repeat, teams: ch.teams || [], staff: ch.staff || [], childId: ch.childId || '', changedOn: ch.date, changedBy: ch.by }) : t; }
function taskAll() { return S.events.filter(e => e.type === 'Task').map(taskMerged); }
function taskTeamPeople(k) { const l = activeStaff().filter(s => k === 'Admin' ? s.admin : staffAreas(s).includes(k)).map(s => s.name.split(' ')[0]); return l.length > 7 ? l.slice(0, 7).join(', ') + ' and ' + (l.length - 7) + ' more' : l.join(', '); }
/* the last "done" or "reopened" of each task */
function taskEnds() { const m = {}; for (const e of S.events) if (e.ref && TASK_EV.includes(e.type) && (!m[e.ref] || (e.ts || 0) >= (m[e.ref].ts || 0))) m[e.ref] = e; return m; }
function taskDone(t, ends) { const e = (ends || taskEnds())[t.id]; return e && e.type === 'Task done' ? e : null; }
function taskMine(t, s) { s = s || USER; return !!s && ((t.staff || []).includes(s.id) || (t.teams || []).some(k => hasFlag(k, s))); }
function taskSees(t) { return !!USER && !GUEST && (seesOverview() || t.by === USER.id || taskMine(t)); }
function taskWho(t) { return (t.teams || []).map(taskTeamLabel).concat((t.staff || []).map(staffName)).join(', ') || 'Nobody'; }
function taskLate(t) { return !!t.due && t.due < today(); }
function taskOrder(a, b) { return (a.due || '9999').localeCompare(b.due || '9999') || (a.ts || 0) - (b.ts || 0); }
function taskOpenFor(s) { const ends = taskEnds(); return taskAll().filter(t => taskMine(t, s) && !taskDone(t, ends)).sort(taskOrder); }
function taskDueChip(t, done) {
  if (done) return `<span class="chip c-green">Done</span>`;
  if (!t.due) return '';
  const d = daysBetween(today(), t.due), late = t.due < today();
  return `<span class="chip ${late ? 'c-red' : t.due === today() ? 'c-orange' : ''}">${late ? 'Late: ' + esc(fmtDate(t.due)) : t.due === today() ? 'Today' : 'By ' + esc(fmtDate(t.due))}</span>`;
}
function taskRow(t, ends, o2) {
  o2 = o2 || {}; const done = taskDone(t, ends), c = t.childId ? child(t.childId) : null, can = taskMine(t) || USER.admin || t.by === USER.id;
  return `<div class="trow${done ? ' done' : taskLate(t) ? ' late' : ''}"><div class="w"><b>${esc(t.title || '')}</b>
      <span>For: <strong>${esc(taskWho(t))}</strong> · from ${esc(staffName(t.by))}, ${esc(fmtDate(t.date))}${t.repeat ? ' · ' + (t.repeat === 'week' ? 'every week' : 'every month') : ''}${t.changedOn ? ' · changed ' + esc(fmtDate(t.changedOn)) : ''}</span>
      ${t.note ? `<span class="tnote">${esc(t.note)}</span>` : ''}${c ? `<span>About: ${childLink(c)}</span>` : ''}
      ${done ? `<span>Done by <strong>${esc(staffName(done.by))}</strong>, ${esc(fmtDate(done.date))}${done.note ? ': ' + esc(done.note) : ''}</span>` : ''}</div>
    <div class="tact">${taskDueChip(t, done)}${done ? (can ? `<button type="button" class="btn sm" data-tact="reopen" data-id="${esc(t.id)}">Not done</button>` : '') : can ? `<button type="button" class="btn pri" data-tact="done" data-id="${esc(t.id)}">Done</button>` : ''}${!done && !o2.home && (USER.admin || t.by === USER.id) ? `<a class="btn sm" href="#/tasks/edit?id=${esc(t.id)}">Change the task</a><button type="button" class="btn link sub" data-tact="cancel" data-id="${esc(t.id)}">Cancel the task</button>` : ''}</div></div>`;
}
/* Home: the tasks of the person, the ones of the teams included */
/* with open tasks the box is the first thing on Home; with none it is one line under Start here */
function taskHome(top) {
  if (!USER || GUEST) return '';
  const ends = taskEnds(), mine = taskAll().filter(t => taskMine(t) && !taskDone(t, ends)).sort(taskOrder);
  if (!mine.length !== !top) return '';
  if (!mine.length) return `<section class="card soft taskline" id="tasks"><span><b>Your tasks</b> · none open</span><span class="tbtns"><a class="btn sm" href="#/tasks">All tasks</a><a class="btn sm" href="#/tasks/new">Give a task</a></span></section>`;
  const late = mine.filter(taskLate).length, show = mine.slice(0, 5);
  return `<section class="card taskcard" id="tasks"><div class="thead"><h2>Your tasks · ${mine.length}${late ? ` <span class="chip c-red">${late} late</span>` : ''}</h2><span class="tbtns"><a class="btn sm" href="#/tasks">All tasks</a><a class="btn sm" href="#/tasks/new">Give a task</a></span></div>
    ${show.map(t => taskRow(t, ends, { home: true })).join('')}${mine.length > show.length ? `<a class="btn" style="margin-top:8px" href="#/tasks">See all your ${mine.length} tasks</a>` : ''}</section>`;
}
function taskLateMine() { return USER && !GUEST ? taskOpenFor(USER).filter(taskLate).length : 0; }
function taskLine(lines) { const ends = taskEnds(), n = taskAll().filter(t => !taskDone(t, ends) && taskLate(t)).length; if (n) lines.push({ n, text: n === 1 ? 'task late' : 'tasks late', href: '#/tasks?v=all', lvl: 'red' }); return lines; }
function taskForm(r) {
  const eid = r.id === 'edit' ? r.q.get('id') : '', t0 = eid ? S.events.find(x => x.id === eid && x.type === 'Task') : null, t = t0 ? taskMerged(t0) : null;
  if (eid && (!t || !(USER.admin || t.by === USER.id))) return `<div class="top"><div><h1>Change the task</h1><p class="lead">Only who gave the task, or the Education office, can change it.</p></div><a class="btn" href="#/tasks">Back</a></div>`;
  const cid = t ? t.childId : r.q.get('child'), c = cid ? child(cid) : null, people = activeStaff().slice().sort((a, b) => a.name.localeCompare(b.name)), has = (l, v) => t && (l || []).includes(v) ? ' checked' : '';
  return `<div class="top"><div><h1>${t ? 'Change the task' : 'Give a task'}</h1><p class="lead">It shows in the Home of each person you choose.</p></div><a class="btn" href="#/tasks">Back</a></div>
  <form class="card" data-form="task" style="max-width:760px">${t ? `<input type="hidden" name="edit" value="${esc(t.id)}">` : ''}
    <div class="fs">${field('What has to be done', 'title', t ? t.title : '', 'text', { req: true, wide: true, attrs: ' maxlength="140"' })}
      ${field('Details', 'note', t ? t.note : '', 'textarea', { wide: true, rows: 2 })}</div>
    <h3 class="tlab">For whom <span class="req">*</span></h3>
    <p class="sub" style="margin:0 0 6px">A team: everyone who works there sees the task. One Done closes it for all.</p>
    <div class="checks tchecks tteams">${TASK_TEAMS.map(([k, l]) => `<label><input type="checkbox" name="teams" value="${k}"${has(t && t.teams, k)}><span><b>${esc(l)}</b><small>${esc(taskTeamPeople(k) || 'Nobody yet')}</small></span></label>`).join('')}</div>
    <h3 class="tlab">People</h3>
    <div class="checks tchecks">${people.map(s => `<label><input type="checkbox" name="staff" value="${esc(s.id)}"${has(t && t.staff, s.id)}>${esc(s.name)}</label>`).join('')}</div>
    <div class="fs two" style="margin-top:14px">${field('To do by', 'due', t ? t.due : '', 'date', { attrs: t ? '' : ' min="' + today() + '"' })}
      ${field('Repeat', 'repeat', t ? t.repeat : '', 'select', { options: opt(TASK_REPEAT.map(([v, l]) => ({ v, l })), t ? t.repeat : '') })}
      ${childPick('child', c ? c.id : '', 'About a child (not needed)')}</div>
    <button class="btn pri" style="margin-top:14px">${t ? 'Save the task' : 'Give the task'}</button></form>`;
}
function vTasks(r) {
  if (GUEST) return `<div class="top"><div><h1>Tasks</h1><p class="lead">Not available in the guest view.</p></div></div>`;
  if (r.id === 'new' || r.id === 'edit') return taskForm(r);
  const ends = taskEnds(), all = taskAll().filter(taskSees), v = r.q.get('v') || 'me';
  const sets = { me: all.filter(t => taskMine(t)), by: all.filter(t => t.by === USER.id), all };
  const tabs = [['me', 'For me'], ['by', 'Given by me']].concat(seesOverview() ? [['all', 'All']] : []);
  const list = sets[tabs.some(t => t[0] === v) ? v : 'me'], open = list.filter(t => !taskDone(t, ends)).sort(taskOrder);
  const done = list.filter(t => taskDone(t, ends)).sort((a, b) => (taskDone(b, ends).ts || 0) - (taskDone(a, ends).ts || 0)).slice(0, 40);
  const n = k => sets[k].filter(t => !taskDone(t, ends)).length;
  return `<div class="top"><div><h1>Tasks</h1><p class="lead">Given to a person, to several people or to a team.</p></div><a class="btn pri" href="#/tasks/new">Give a task</a></div>
  <div class="seg tseg" role="group" aria-label="Which tasks">${tabs.map(([k, l]) => `<a href="#" data-q="v=${k}" class="${(v === k) || (k === 'me' && !tabs.some(t => t[0] === v)) ? 'on' : ''}">${l} · ${n(k)}</a>`).join('')}</div>
  <section class="card taskcard"><h2>Open · ${open.length}</h2>${open.length ? open.map(t => taskRow(t, ends)).join('') : '<p class="empty">No open task.</p>'}</section>
  ${v === 'all' && seesOverview() ? taskByPerson(ends) : ''}
  <section class="card taskcard"><h2>Done · ${done.length}</h2>${done.length ? done.map(t => taskRow(t, ends)).join('') : '<p class="empty">Nothing yet.</p>'}</section>`;
}
/* for the Education office: open, late and done, person by person */
function taskByPerson(ends) {
  const all = taskAll(), m = thisMonth(), rows = [];
  const count = (label, f) => { const mine = all.filter(f); if (!mine.length) return; const open = mine.filter(t => !taskDone(t, ends)); rows.push([label, open.length, open.filter(taskLate).length, mine.filter(t => { const d = taskDone(t, ends); return d && (d.date || '').slice(0, 7) === m; }).length]); };
  for (const [k, l] of TASK_TEAMS) count('Team: ' + l, t => (t.teams || []).includes(k));
  for (const s of activeStaff().slice().sort((a, b) => a.name.localeCompare(b.name))) count(s.name, t => (t.staff || []).includes(s.id));
  if (!rows.length) return '';
  return `<section class="card"><h2>Person by person</h2><p class="sub" style="margin:2px 0 6px">Tasks given by name or to the team.</p><div class="tw"><table class="ttab"><thead><tr><th>Who</th><th>Open</th><th>Late</th><th>Done in ${esc(fmtMonth(m))}</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(x[0])}</td><td>${x[1]}</td><td>${x[2] ? `<b style="color:var(--red)">${x[2]}</b>` : 0}</td><td>${x[3]}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function taskNextDue(t) { const from = t.due && t.due > today() ? t.due : (t.due || today()); if (t.repeat === 'week') return addDays(from, 7); const d = new Date(from + 'T12:00:00'); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10); }
function taskEventLine(e) {
  if (TASK_EV.includes(e.type)) return '';
  const d = taskDone(e); return `<b>Task</b>: ${esc(e.title || '')} ${d ? '<span class="chip c-green">Done</span>' : '<span class="chip c-orange">Open</span>'} <span class="sub">for ${esc(taskWho(e))} · from ${esc(staffName(e.by))}</span>`;
}
FORMS.task = function (o) {
  const title = (o.title || '').trim(), teams = [].concat(o.teams || []), staff = [].concat(o.staff || []);
  if (!title) return toast('Write what has to be done');
  if (!teams.length && !staff.length) return toast('Choose at least one person or one team');
  if (o.edit) { const t0 = S.events.find(x => x.id === o.edit && x.type === 'Task'); if (!t0 || !(USER.admin || t0.by === USER.id)) return toast('This task cannot be changed');
    S.events.push({ id: uid('e'), childId: '', type: 'Task changed', ref: t0.id, date: today(), ts: Date.now(), title, note: (o.note || '').trim(), due: o.due || '', repeat: o.repeat || '', teams, staff, by: USER.id }); save(); toast('Task changed'); return go('#/tasks?v=by'); }
  S.events.push({ id: uid('e'), childId: o.child && child(o.child) ? String(o.child) : '', type: 'Task', date: today(), ts: Date.now(), title, note: (o.note || '').trim(), due: o.due || '', repeat: o.repeat || '', teams, staff, by: USER.id });
  save(); toast('Task given to ' + (teams.map(taskTeamLabel).concat(staff.map(staffName)).join(', '))); go('#/tasks?v=by');
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tact]'); if (!b || !USER || GUEST) return;
  const t0 = S.events.find(x => x.id === b.dataset.id && x.type === 'Task'); if (!t0) return; const t = taskMerged(t0);
  const act = b.dataset.tact;
  if (act === 'done') {
    if (taskDone(t)) return render();
    S.events.push({ id: uid('e'), childId: t.childId || '', type: 'Task done', ref: t.id, date: today(), ts: Date.now(), note: '', by: USER.id });
    if (t.repeat) { const due = taskNextDue(t), root = t.root || t.id, id = root + '@' + due; if (!S.events.some(x => x.id === id)) S.events.push({ id, root, childId: t.childId || '', type: 'Task', date: today(), ts: Date.now() + 1, title: t.title, note: t.note || '', due, repeat: t.repeat, teams: (t.teams || []).slice(), staff: (t.staff || []).slice(), by: t.by }); }
    save(); toast('Done: ' + t.title); render(); return;
  }
  if (act === 'reopen') { S.events.push({ id: uid('e'), childId: t.childId || '', type: 'Task reopened', ref: t.id, date: today(), ts: Date.now(), note: '', by: USER.id }); save(); toast('The task is open again'); render(); return; }
  if (act === 'cancel') {
    if (!(USER.admin || t.by === USER.id)) return;
    askBox({ title: 'Cancel this task?', body: t.title + '\nFor: ' + taskWho(t) + '\nIt leaves the Home of everyone.', why: true, ok: 'Cancel the task', keep: 'Keep the task' }).then(why => { if (why == null) return;
      S.events.push({ id: uid('e'), childId: t.childId || '', type: 'Record cancelled', ref: t.id, kind: 'event', date: today(), ts: Date.now(), note: 'Task: ' + t.title + ' · for ' + taskWho(t) + ' · by ' + staffName(t.by) + '. Why: ' + why, by: USER.id });
      dropCancelled(); save(); toast('Task cancelled'); render(); });
  }
});

/* ---------- the report of a section, sent to the Education office (beta 1.3, 24/11/2026) ----------
   Mauro, 24/11: the section sends the report of the month; after that the records of the month are closed
   and only the Education office can open them again, with Send back and a note.
   Stored as events, so they travel with the shared database as it is: "Report sent", "Report checked",
   "Report sent back", ref = month|key. The last one decides the state. Marks made before (S.reports) still count. */
const REP_EV = ['Report sent', 'Report checked', 'Report sent back', 'Report undone'];
const REP_SEC = ['Luigi', 'Nkwazi', 'UCC', 'Youth', 'Family', 'School', 'Counseling'];
function repLabel(k) { return (REPORTS[k] && (REPORTS[k].short || REPORTS[k].label)) || k; }
function repEvents(m, k) { const ref = m + '|' + k; return (S.events || []).filter(e => e.ref === ref && REP_EV.includes(e.type)).sort((a, b) => (a.ts || 0) - (b.ts || 0)); }
function repState(m, k) {
  /* old marks (S.reports) first, then the events in order; "Report undone" takes back the last step (Clement's comment of 25/11) */
  const ev = repEvents(m, k), old = ((S.reports || {})[m] || {})[k] || {}, st = [];
  if (old.prepared) st.push({ type: 'Report sent', by: old.prepared.by, date: old.prepared.date });
  if (old.checked) st.push({ type: 'Report checked', by: old.checked.by, date: old.checked.date });
  for (const e of ev) { if (e.type === 'Report undone') st.pop(); else st.push(e); }
  const last = st[st.length - 1] || null, sent = st.filter(e => e.type === 'Report sent').pop() || null;
  if (!last) return { state: 'open', sent: null, last: null, ev, prev: null };
  return { state: last.type === 'Report sent' ? 'sent' : last.type === 'Report checked' ? 'checked' : 'back', sent, last, ev, prev: st[st.length - 2] || null };
}
function repLocked(m, k) { if (!m || !REP_SEC.includes(k)) return false; const s = repState(m, k).state; return s === 'sent' || s === 'checked'; }
function repLockMsg(m, k) { return `The ${repLabel(k)} report of ${fmtMonth(m)} was sent to the Education office. To change it, the Education office sends it back first.`; }
function repKeyOfChild(c) { return c && REP_SEC.includes(c.section) ? c.section : ''; }
/* the first locked report among the children, for a day; '' when nothing is locked */
function repLockKids(d, kids) { const m = String(d || '').slice(0, 7); for (const c of kids) { const k = repKeyOfChild(c); if (k && repLocked(m, k)) return m + '|' + k; } return ''; }
function repStop(mk) { const [m, k] = mk.split('|'); toast(repLockMsg(m, k)); }
function repCard(k, m) {
  if (!REP_SEC.includes(k) || GUEST) return '';
  const R = repState(m, k), who = x => x ? esc(staffName(x.by)) + ', ' + esc(fmtDate(x.date)) : '', adm = USER && USER.admin;
  const btn = (v, l, pri) => `<button class="btn${pri ? ' pri' : ''}" data-act="repflow" data-k="${k}" data-m="${m}" data-v="${v}">${l}</button>`;
  let tag, line, acts = '';
  /* the Education office can approve a report as it is, sent or not, and take back its last step with Undo (Clement, 25/11) */
  const approve = btn('check', R.state === 'sent' ? 'Approve' : 'Approve as it is', true), undo = adm && R.last && R.last.by && (R.last.type === 'Report checked' || R.last.type === 'Report sent back') ? btn('undo', 'Undo') : '';
  if (R.state === 'open') { tag = '<span class="cyp-tag">Not sent</span>'; line = adm ? 'The section has not sent it yet. You can approve it as it is: the records of the month close.' : 'When the report is ready, send it. After that the records of the month cannot be changed.'; acts = adm ? approve : btn('send', 'Send to the Education office', true); }
  else if (R.state === 'sent') { tag = '<span class="cyp-tag cyp-tag--warn">Sent</span>'; line = 'Sent by ' + who(R.sent) + '. The records of the month are closed.' + (adm ? '' : ' Waiting for the Education office.'); if (adm) acts = approve + btn('back', 'Send back'); }
  else if (R.state === 'checked') { tag = `<span class="cyp-tag cyp-tag--ok">${dsIcon('check')}Approved</span>`; line = (R.sent ? 'Sent by ' + who(R.sent) + '. ' : 'Not sent by the section. ') + 'Approved by ' + who(R.last) + '. The records of the month are closed.'; if (adm) acts = undo + btn('back', 'Send back'); }
  else { tag = `<span class="cyp-tag cyp-tag--danger">${dsIcon('alert')}Sent back</span>`; line = 'Sent back by ' + who(R.last) + ': <b>' + esc(R.last.note || '') + '</b><br>The records of the month can be changed. Then send the report again.'; acts = adm ? approve + undo : btn('send', 'Send again to the Education office', true); }
  return `<section class="card soft repflow" id="repflow"><h2>The report of ${esc(fmtMonth(m))} ${tag}</h2><p style="margin:6px 0 0">${line}</p>${acts ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${acts}</div>` : ''}${R.ev.length > 1 ? `<details style="margin-top:10px"><summary>What happened</summary><ul class="sub">${R.ev.map(e => `<li>${esc(fmtDate(e.date))} · ${esc(e.type.replace('Report ', '').replace('checked', 'approved'))} by ${esc(staffName(e.by))}${e.note ? ': ' + esc(e.note) : ''}</li>`).join('')}</ul></details>` : ''}</section>`;
}
async function repAct(b) {
  const k = b.dataset.k, m = b.dataset.m, v = b.dataset.v, R = repState(m, k);
  const push = (type, note) => { S.events.push({ id: uid('e'), childId: '', type, ref: m + '|' + k, date: today(), ts: Date.now(), note: note || '', by: USER.id }); save(); render(); };
  if (v === 'send') {
    if (R.state === 'sent' || R.state === 'checked') return render();
    const ok = await askBox({ title: 'Send the ' + repLabel(k) + ' report of ' + fmtMonth(m) + '?', body: 'After this the records of ' + fmtMonth(m) + ' for ' + repLabel(k) + ' cannot be changed. If something must be changed, the Education office sends the report back.', keep: 'Not now', ok: 'Send the report', okCls: 'pri' });
    if (ok === null) return; push('Report sent'); toast('Sent to the Education office');
  } else if (v === 'check') { if (!USER.admin || R.state === 'checked') return render(); push('Report checked', R.state === 'sent' ? '' : 'Approved as it is'); toast('Approved'); }
  else if (v === 'undo') { if (!USER.admin || !R.last || (R.last.type !== 'Report checked' && R.last.type !== 'Report sent back')) return render(); push('Report undone', R.last.type.replace('Report ', '')); toast('Undone'); }
  else if (v === 'back') {
    if (!USER.admin || (R.state !== 'sent' && R.state !== 'checked')) return render();
    const note = await askBox({ title: 'Send back the ' + repLabel(k) + ' report of ' + fmtMonth(m) + '?', body: 'Write what must be changed. The section reads it at the top of the report.', why: true, keep: 'Keep it', ok: 'Send back', okCls: 'pri' });
    if (note === null) return; push('Report sent back', note); toast('Sent back');
  }
}
/* the reports waiting: for the Education office the ones sent, for a section the ones sent back */
function repWaiting() { const out = []; const ms = new Set((S.events || []).filter(e => REP_EV.includes(e.type)).map(e => e.ref.split('|')[0])); for (const r of Object.keys(S.reports || {})) ms.add(r);
  for (const m of ms) for (const k of REP_SEC) { const s = repState(m, k).state; if (s === 'sent' || s === 'back') out.push({ m, k, state: s, R: repState(m, k) }); } return out.sort((a, b) => a.m.localeCompare(b.m)); }

/* the lock: a capture listener stops a write to a closed month before any other handler runs */
(function () {
  const stop = (e, mk) => { e.preventDefault(); e.stopImmediatePropagation(); repStop(mk); };
  document.addEventListener('click', e => {
    if (!e.target.closest || GUEST || !USER) return;
    const dc = e.target.closest('[data-dact="cancelrec"]');
    if (dc) { const x = typeof recFind === 'function' ? recFind(dc.dataset.kind, dc.dataset.id) : null; let k = '';
      if (x && dc.dataset.kind === 'event' && x.type === 'Group activity') k = x.section; else if (x && dc.dataset.kind === 'session') k = 'Counseling';
      if (k && x.date && repLocked(x.date.slice(0, 7), k)) return stop(e, x.date.slice(0, 7) + '|' + k); return; }
    const b = e.target.closest('[data-act],[data-lact]'); if (!b) return;
    const act = b.dataset.act, la = b.dataset.lact, q = route().q, centre = q.get('c') || (typeof defCentre === 'function' ? defCentre() : '');
    const kidOf = id => child(String(id || '').split('@')[0]);
    let mk = '';
    if (act === 'att' || act === 'qatt') { const c = kidOf(b.dataset.id); if (c) mk = repLockKids(b.dataset.d, [c]); }
    else if (act === 'qundo') { const L = UI.lastMark; const c = L && kidOf(L.id); if (c) mk = repLockKids(L.d, [c]); }
    else if (act === 'mcell') { const c = child(b.dataset.c); if (c) mk = repLockKids(b.dataset.d, [c]); }
    else if (act === 'qrest') { const d = b.dataset.d, day = S.attendance[d] || {}; mk = repLockKids(d, attQuickBase(q).filter(c => day[attKey(c, centre)] == null)); }
    else if (act === 'allpresent') { const ce = b.dataset.c || 'Minsundu', d = b.dataset.d; mk = repLockKids(d, S.children.filter(c => isCurrent(c) && attIn(c, ce, b.dataset.g))); }
    else if (la === 'cell' || la === 'day') { const d = b.dataset.d; if (repLocked(String(d).slice(0, 7), 'Luigi')) mk = d.slice(0, 7) + '|Luigi'; }
    else if (la === 'mark') { const d = q.get('ld') || today(); if (repLocked(d.slice(0, 7), 'Luigi')) mk = d.slice(0, 7) + '|Luigi'; }
    if (mk) stop(e, mk);
  }, true);
  document.addEventListener('change', e => {
    const el = e.target; if (!el || !el.dataset || GUEST || !USER) return;
    if (el.dataset.lstaff || el.dataset.lstaffadd || el.dataset.lnote) { const d = el.dataset.d || ''; if (repLocked(d.slice(0, 7), 'Luigi')) { e.stopImmediatePropagation(); repStop(d.slice(0, 7) + '|Luigi'); render(); } }
  }, true);
  document.addEventListener('submit', e => {
    const f = e.target; if (!f || !f.dataset || GUEST || !USER) return;
    const v = n => f.elements[n] ? f.elements[n].value : '', d = v('date'), m = d.slice(0, 7);
    let k = '';
    if (f.dataset.form === 'visit') { const t = v('team'); k = t === 'Family' || t === 'School' ? t : ''; const ed = v('edit'), old = ed && S.visits.find(x => x.id === ed); if (!k && old) k = visitTeam(old); if (old && repLocked(old.date.slice(0, 7), k)) { e.preventDefault(); e.stopImmediatePropagation(); return repStop(old.date.slice(0, 7) + '|' + k); } }
    else if (f.dataset.form === 'session') k = 'Counseling';
    else if (f.dataset.form === 'outreach') k = 'Luigi';
    else if (f.dataset.form === 'group') k = v('section');
    if (k && repLocked(m, k)) { e.preventDefault(); e.stopImmediatePropagation(); repStop(m + '|' + k); }
  }, true);
})();
