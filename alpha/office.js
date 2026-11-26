/* ---------- Education office: the first page of the Education admin (alpha 5.30) ----------
   One page to see the day, what waits for a decision, the registers, the month by section, the week of tasks, the people.
   Built with the pieces of the CYP design system: stat tiles, status tags, rows, data table, progress bars in the category colours. */
const OFFICE_REGS = [['Minsundu', 'UCC', 'Minsundu · UCC', 'minsundu'], ['Minsundu', 'Youth', 'Minsundu · Youth', 'minsundu'], ['Minsundu', 'Non-resident', 'Minsundu · non-residents', 'minsundu'], ['Minsundu:Literacy', 'All', 'Minsundu · literacy class', 'minsundu'], ['Nkwazi', 'All', 'Nkwazi Centre', 'nkwazi'], ['School', 'All', 'Community school', 'community-school']];
function officeIcon(k) {
  const P = { ok: 'M20 6L9 17l-5-5', warn: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', late: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', go: 'M9 18l6-6-6-6' };
  return `<svg class="cyp-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[k]}"/></svg>`;
}
function officeTag(kind, text) { return `<span class="cyp-tag cyp-tag--${kind}">${officeIcon(kind === 'ok' ? 'ok' : kind === 'danger' ? 'late' : 'warn')}${esc(text)}</span>`; }
function officeRegs(d) {
  const day = S.attendance[d] || {}, days = Object.keys(S.attendance).sort(), rows = [];
  for (const [ck, grp, label, cat] of OFFICE_REGS) { const centre = ck.split(':').pop();
    const kids = S.children.filter(c => isCurrent(c) && attIn(c, centre, grp)); if (!kids.length) continue;
    const keys = kids.map(c => attKey(c, centre)), marked = keys.filter(k => day[k] != null).length, present = keys.filter(k => day[k] === 'P').length;
    let last = ''; for (let i = days.length - 1; i >= 0 && !last; i--) { const x = S.attendance[days[i]] || {}; if (days[i] <= d && keys.some(k => x[k] != null)) last = days[i]; }
    rows.push({ label, cat, n: kids.length, marked, present, last, href: `#/attendance?c=${centre}${centre === 'Minsundu' ? '&g=' + grp : ''}` });
  }
  const lu = S.outreach.filter(o => o.type === 'Drop-in' && !o.cancelled), luToday = lu.find(o => o.date === d), luLast = lu.map(o => o.date).filter(x => x <= d).sort().pop() || '';
  rows.unshift({ label: 'Luigi · drop-in centre', cat: 'luigi', n: null, marked: luToday ? (luToday.children || []).length : 0, present: luToday ? (luToday.children || []).length : 0, last: luLast, href: '#/attendance?c=Luigi' });
  return rows;
}
function officeWeekdays(a, b) { let n = 0; for (let d = a; d <= b; d = addDays(d, 1)) { const k = new Date(d + 'T12:00:00').getDay(); if (k !== 0 && k !== 6) n++; } return n; }
function officeMonth() {
  const m = thisMonth(), { a, b } = monthCtx(m), t = today(), out = [];
  const plan = team => { const pl = planFor(m, team); return [pl.filter(p => planStatus(p).k === 'done').length, pl.length]; };
  const [fd, fp] = plan('Family'), [sd, sp] = plan('School');
  const sess = S.sessions.filter(s => inRange(s.date, a, b)).length;
  const wkd = d => { const k = new Date(d + 'T12:00:00').getDay(); return k !== 0 && k !== 6; };
  const taken = (centre, grp, every) => { const kids = S.children.filter(c => isCurrent(c) && attIn(c, centre, grp)).map(c => attKey(c, centre)); let n = 0; for (const d of Object.keys(S.attendance)) if (inRange(d, a, t) && (every || wkd(d)) && kids.some(k => (S.attendance[d] || {})[k] != null)) n++; return n; };
  const wd = officeWeekdays(a, t), all = Number(t.slice(8)), lu = uniq(S.outreach.filter(o => o.type === 'Drop-in' && inRange(o.date, a, t) && wkd(o.date)).map(o => o.date)).length;
  out.push({ label: 'Luigi', what: 'weekdays with the drop-in sheet', done: lu, of: wd, cat: 'luigi', href: '#/attendance?c=Luigi' });
  out.push({ label: 'Minsundu', what: 'days with the UCC register taken (every day)', done: taken('Minsundu', 'UCC', true), of: all, cat: 'minsundu', href: '#/attendance?c=Minsundu' });
  out.push({ label: 'Nkwazi Centre', what: 'weekdays with the register taken', done: taken('Nkwazi', 'All'), of: wd, cat: 'nkwazi', href: '#/attendance?c=Nkwazi' });
  out.push({ label: 'Family Section', what: fp ? 'home visits of the plan done' : 'no plan of visits for this month', done: fd, of: fp, cat: 'blue', href: `#/visits?vt=Family&vtab=plan&m=${m}` });
  out.push({ label: 'School Section', what: sp ? 'pupils of the plan visited' : 'no plan of visits for this month', done: sd, of: sp, cat: 'blue', href: `#/visits?vt=School&vtab=plan&m=${m}` });
  out.push({ label: 'Counselling', what: 'sessions recorded', done: sess, of: 0, cat: 'blue', href: '#/counseling' });
  return out;
}
function officeQueue() {
  const cards = overviewData(), out = [];
  for (const c of cards) for (const l of c.lines) if (l.lvl === 'red' || l.lvl === 'orange') out.push({ sec: c.title, n: l.n, text: l.text, href: l.href, lvl: l.lvl, own: c.k === 'Admin' || /Education office/.test(c.title) });
  out.sort((x, y) => (y.own - x.own) || ((y.lvl === 'red') - (x.lvl === 'red')));
  return out;
}
function officeWeek() {
  const ends = taskEnds(), w = weekStart(today()), open = taskAll().filter(t => !taskDone(t, ends)), days = [];
  for (let i = 0; i < 7; i++) { const d = addDays(w, i); days.push({ d, tasks: open.filter(t => t.due === d) }); }
  return { days, late: open.filter(t => t.due && t.due < w), nodate: open.filter(t => !t.due), open };
}
function officePeople() {
  const ends = taskEnds(), all = taskAll(), m = thisMonth(), from = addDays(today(), -6), rows = [];
  for (const s of activeStaff().slice().sort((a, b) => a.name.localeCompare(b.name))) {
    const mine = all.filter(t => (t.staff || []).includes(s.id) || (t.teams || []).some(k => staffAreas(s).includes(k))), open = mine.filter(t => !taskDone(t, ends));
    const rec = S.visits.filter(v => (v.recordedBy || v.by) === s.id && inRange(v.recordedOn || v.date, from, today())).length + S.sessions.filter(x => x.by === s.id && inRange(x.date, from, today())).length + S.events.filter(e => e.by === s.id && !/^Task|^Visit|^Record|^Counselling week/.test(e.type) && inRange(e.date, from, today())).length;
    if (!mine.length && !rec) continue;
    rows.push({ name: s.name, area: areasText(s), open: open.length, late: open.filter(taskLate).length, done: mine.filter(t => { const d = taskDone(t, ends); return d && (d.date || '').slice(0, 7) === m; }).length, rec });
  }
  return rows;
}
function vOffice(r) {
  const t = today(), regs = officeRegs(t), month = officeMonth(), queue = officeQueue(), W = officeWeek(), people = officePeople();
  const openKids = S.children.filter(c => c.status !== 'Closed').length, taken = regs.filter(x => x.marked).length, present = regs.reduce((s, x) => s + x.present, 0);
  const wait = S.visits.filter(v => visitState(v) === 'wait').length, lateTasks = W.open.filter(taskLate).length;
  const dname = new Date(t + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const tile = (label, fig, note, href) => `<a class="cyp-stat otile" href="${href}"><span class="cyp-stat__label label-caps">${esc(label)}</span><span class="cyp-stat__figure figure">${esc(fig)}</span><span class="cyp-stat__note">${esc(note)}</span></a>`;
  const regRow = x => `<tr class="cyp-tr--link" data-href="${x.href}"><td><span class="oreg"><i class="cyp-swatch cyp-c-${x.cat}"></i>${esc(x.label)}</span></td><td>${x.marked ? officeTag('ok', 'Taken') : officeTag(x.last && x.last >= addDays(t, -1) ? 'warn' : 'danger', 'Not yet')}</td><td class="num" data-l="Present">${x.marked ? x.present : ''}</td><td class="num" data-l="Marked">${x.n == null ? '' : x.marked + ' of ' + x.n}</td><td data-l="Last day taken">${x.last ? (x.last === t ? 'Today' : esc(fmtDate(x.last))) : 'Never'}</td><td class="cyp-table__go"><a href="${x.href}" aria-label="Open the register of ${esc(x.label)}">${dsIcon('go').replace('cyp-icon', 'cyp-icon cyp-go')}</a></td></tr>`;
  const mrow = x => { const pct = x.of ? Math.min(100, Math.round(100 * x.done / x.of)) : 0; return `<a class="omonth cyp-c-${x.cat}" href="${x.href}"><span class="olab">${x.cat === 'blue' ? secDisc(x.label) : '<i class="cyp-swatch"></i>'}<b>${esc(x.label)}</b><small>${esc(x.what)}</small></span>${x.of ? `<span class="cyp-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>` : '<span></span>'}<span class="onum">${x.of ? x.done + ' of ' + x.of : x.done}</span></a>`; };
  const qrow = x => `<a class="cyp-row oq" href="${x.href}"><span class="oqn ${x.lvl}">${x.n === '' || x.n === '!' || x.n == null ? officeIcon('warn') : esc(x.n)}</span><span class="cyp-row__text"><b>${esc(x.text)}</b><span>${esc(x.sec)}</span></span>${officeIcon('go')}</a>`;
  const trow = x => `<li><b>${esc(x.title || x.text || 'Task')}</b><span>${esc(taskWho(x))}</span></li>`;
  const day = x => { const dt = new Date(x.d + 'T12:00:00'); return `<div class="oday${x.d === t ? ' now' : ''}${x.d < t ? ' past' : ''}"><div class="odh"><span class="label-caps">${dt.toLocaleDateString('en-GB', { weekday: 'short' })}</span><b>${dt.getDate()}</b></div>${x.tasks.length ? `<ul>${x.tasks.map(trow).join('')}</ul>` : '<p class="onone">No task due</p>'}</div>`; };
  const qn = UI.oqAll ? queue.length : 8;
  return `<div class="top otop"><div><p class="sec" style="margin:0 0 4px">${esc(dname)}</p><h1 class="keyh">${USER.admin || isSite() ? secDisc('Education office') + 'Education office' : secDisc('Administration') + 'Overview'}</h1></div><div class="oacts"><a class="btn pri" href="#/tasks/new">Give a task</a><a class="btn" href="#/pending">To do, section by section</a><a class="btn" href="#/story">Interactive report</a><a class="btn" href="#/home?v=centres">Centres and sections</a></div></div>
  <div class="otiles">
    ${tile('Children with an open file', openKids.toLocaleString('en-GB'), 'In Luigi, Minsundu and Nkwazi Centre', '#/children')}
    ${tile('Present today', present.toLocaleString('en-GB'), taken + ' of ' + regs.length + ' registers taken today', '#/attendance')}
    ${tile('Visits to validate', String(wait), wait ? 'Waiting for the Education office' : 'Nothing waiting', '#/visits?vtab=check')}
    ${tile('Tasks open', String(W.open.length), lateTasks ? lateTasks + ' late' : 'None late', '#/tasks?v=all')}
  </div>
  <div class="ogrid">
    <section class="card ocard"><div class="ohead"><h2>Registers today</h2><a class="btn sm" href="#/attendance">Attendance</a></div>
      <div class="tw"><table class="cyp-table otab"><thead><tr><th>Register</th><th>Today</th><th class="num">Present</th><th class="num">Marked</th><th>Last day taken</th><th></th></tr></thead><tbody>${regs.map(regRow).join('')}</tbody></table></div></section>
    <section class="card ocard"><div class="ohead"><h2>Waiting for a decision</h2><span class="cyp-tag${queue.length ? ' cyp-tag--warn' : ' cyp-tag--ok'}">${queue.length ? queue.length + ' lines' : 'Nothing open'}</span></div>
      ${queue.length ? `<div class="oqlist">${queue.slice(0, qn).map(qrow).join('')}</div>${queue.length > qn ? `<button class="btn sm" data-oact="qall" style="margin-top:12px">Show all ${queue.length}</button>` : ''}` : '<p class="onone">Nothing is late in any section.</p>'}</section>
  </div>
  <section class="card ocard"><div class="ohead"><h2>${esc(fmtMonth(thisMonth()))} by section</h2><a class="btn sm" href="#/reports">Reports</a></div><div class="omlist">${month.map(mrow).join('')}</div></section>
  <section class="card ocard"><div class="ohead"><h2>Tasks of this week</h2><div class="oacts"><a class="btn sm" href="#/tasks?v=all">All tasks</a><a class="btn sm pri" href="#/tasks/new">Give a task</a></div></div>
    ${W.late.length ? `<div class="cyp-banner cyp-banner--danger" style="margin-bottom:12px">${officeIcon('late')}${W.late.length} ${W.late.length === 1 ? 'task is' : 'tasks are'} late from before this week: ${esc(W.late.slice(0, 3).map(x => (x.title || 'Task') + ' (' + taskWho(x) + ')').join('; '))}${W.late.length > 3 ? '; and ' + (W.late.length - 3) + ' more' : ''}</div>` : ''}
    <div class="oweek">${W.days.map(day).join('')}</div>
    ${W.nodate.length ? `<p class="sub" style="margin:12px 0 0">${W.nodate.length} open ${W.nodate.length === 1 ? 'task has' : 'tasks have'} no date.</p>` : ''}</section>
  <section class="card ocard"><div class="ohead"><h2>People</h2>${canAdminPage() ? '<a class="btn sm" href="#/staff">Admin</a>' : ''}</div>
    ${people.length ? `<div class="tw"><table class="cyp-table otab"><thead><tr><th>Who</th><th>Area</th><th class="num">Tasks open</th><th class="num">Late</th><th class="num">Done in ${esc(fmtMonth(thisMonth()).split(' ')[0])}</th><th class="num">Visits, sessions and events written in 7 days</th></tr></thead><tbody>${people.map(p => `<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.area)}</td><td class="num" data-l="Tasks open">${p.open}</td><td class="num" data-l="Late">${p.late ? `<span class="cyp-tag cyp-tag--danger">${p.late}</span>` : 0}</td><td class="num" data-l="Done">${p.done}</td><td class="num" data-l="Written in 7 days">${p.rec}</td></tr>`).join('')}</tbody></table></div><p class="sub" style="margin:8px 0 0">Attendance marks are not counted: the register does not keep who marked.</p>` : '<p class="onone">No task given and nothing written in the last 7 days.</p>'}</section>`;
}
/* Home of the educators: three numbers first (StatTile of the system) */
function homeTiles() {
  if (!USER || seesOverview() || GUEST) return '';
  const t = today(), a = staffAreas(USER), regs = officeRegs(t).filter(x => a.includes('Luigi') && x.cat === 'luigi' || a.includes('Minsundu') && x.cat === 'minsundu' || a.includes('Nkwazi') && (x.cat === 'nkwazi' || x.cat === 'community-school'));
  const tile = (label, fig, note, href) => `<a class="cyp-stat otile" href="${href}"><span class="cyp-stat__label label-caps">${esc(label)}</span><span class="cyp-stat__figure figure">${esc(fig)}</span><span class="cyp-stat__note">${esc(note)}</span></a>`;
  const m = thisMonth(), { a: ma, b: mb } = monthCtx(m), mf = mainFlag(USER), out = [];
  if (regs.length) { const kids = regs.reduce((s, x) => s + (x.n || 0), 0), taken = regs.filter(x => x.marked).length;
    out.push(tile('Present today', String(regs.reduce((s, x) => s + x.present, 0)), taken + ' of ' + regs.length + (regs.length === 1 ? ' register' : ' registers') + ' taken today', '#/attendance'));
    if (kids) out.push(tile('On the registers', kids.toLocaleString('en-GB'), 'Children of your centre', '#/children')); }
  if (mf === 'Family' || mf === 'School') { const pl = planFor(m, mf); out.push(tile('Plan of ' + fmtMonth(m).split(' ')[0], pl.filter(p => planStatus(p).k === 'done').length + ' of ' + pl.length, 'Visits of the plan done', `#/visits?vt=${mf}&vtab=plan&m=${m}`)); }
  if (mf === 'Counseling') out.push(tile('Sessions in ' + fmtMonth(m).split(' ')[0], String(S.sessions.filter(s => inRange(s.date, ma, mb)).length), 'Individual, group and family', '#/counseling'));
  const mine = taskOpenFor(USER); out.push(tile('Your tasks', String(mine.length), mine.filter(taskLate).length ? mine.filter(taskLate).length + ' late' : 'None late', '#/tasks'));
  return `<div class="otiles htiles">${out.slice(0, 3).join('')}</div>`;
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-oact]'); if (!b) return; if (b.dataset.oact === 'qall') { UI.oqAll = true; render(); } });
