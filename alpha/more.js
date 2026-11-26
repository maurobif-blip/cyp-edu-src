
/* ====================================================================
   Extra child details, ABA, the lists moved into their own pages,
   and the To do page as one box per section
   ==================================================================== */
var _SI = null, GUEST = false, S_REAL = null;
const BACK_OPTS = [['Cicetekelo', 'After Minsundu or another Cicetekelo centre'], ['Facility', 'After another facility'], ['Family', 'After going back to the family'], ['Town', 'After moving to another town']];
function backLabel(k) { const o = BACK_OPTS.find(x => x[0] === k); return o ? o[1] : ''; }
const GROUPS = [['ABA', 'ABA, distance adoption'], ['ZAS', 'ZAS project'], ['Muchinga', 'Muchinga'], ['rel', 'Relatives on the street'], ['back', 'Back on the street after a service'], ['backq', 'Seen on the street again: to confirm']];
function isAba(c) { return (c.programmes || []).includes('ABA'); }
function inGroup(c, g) { return g === 'rel' ? c.relStreet === 'Yes' : g === 'back' ? !!c.backStreet : g === 'backq' ? !!backAuto(c) : (c.programmes || []).includes(g); }

/* seen at day or night outreach after leaving the street for a centre, a facility or the family */
function streetIndex() {
  if (_SI) return _SI;
  const ix = {};
  for (const s of S.outreach) if (s.type === 'Day outreach' || s.type === 'Night outreach') for (const id of s.children || []) (ix[id] = ix[id] || []).push(s.date);
  for (const k in ix) ix[k].sort();
  return _SI = ix;
}
function backAuto(c) {
  if (c.backStreet || c.backNo) return null;
  let exit = '', why = '';
  if (c.section !== 'Luigi') { const mv = movesOf(c.id).filter(x => x.type === 'section' && x.from === 'Luigi').map(x => x.date).sort().pop(); exit = mv || c.entryDate || ''; why = 'Cicetekelo'; }
  else if (c.status === 'Closed' && c.closeDate) { exit = c.closeDate; const r = c.closeReason || ''; why = c.whereNow === 'Family' || /family/i.test(r) ? 'Family' : c.whereNow === 'Chichetekelo' || /Cicetekelo/i.test(r) ? 'Cicetekelo' : c.whereNow === 'OtherCity' || /town/i.test(r) ? 'Town' : 'Facility'; }
  if (!exit) return null;
  const first = (streetIndex()[c.id] || []).find(d => d > exit);
  return first ? { date: first, why, exit } : null;
}
function backAskHtml(c) {
  const b = backAuto(c); if (!b) return '';
  return `<div class="warn" style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span>Met at street outreach on <b>${esc(fmtDate(b.date))}</b>. The file says that on ${esc(fmtDate(b.exit))} ${{ Cicetekelo: 'the child moved to a Cicetekelo centre', Facility: 'the child was taken to another facility', Family: 'the child went back to the family', Town: 'the child moved to another town' }[b.why]}. Is this child back on the street?</span><span style="display:flex;gap:6px"><button class="btn sm" data-mact="backyes" data-id="${esc(c.id)}" data-why="${b.why}" data-d="${b.date}">Yes, back on the street</button><button class="btn sm" data-mact="backno" data-id="${esc(c.id)}">No</button></span></div>`;
}

/* ---------- ABA: same tables, only the children in distance adoption ---------- */
function abaScope(on, fn) {
  if (!on) return fn();
  const C = S.children, V = S.visits; S.children = C.filter(isAba); const ids = new Set(S.children.map(c => String(c.id))); S.visits = V.filter(v => ids.has(String(v.childId)));
  try { return fn(); } finally { S.children = C; S.visits = V; }
}
function abaSheet(year) {
  const a = year + '-01-01', b = year + '-12-31', IT = { Active: 'Attivo', 'Semi-active': 'Semi-attivo', 'Follow-up': 'Reinserito, in follow-up', Closed: 'Chiuso' };
  const kids = S.children.filter(c => isAba(c) && (c.status !== 'Closed' || (c.closeDate || '9') >= a)).sort((x, y) => fullName(x).localeCompare(fullName(y)));
  const H = ['ID', 'Nome', 'Cognome', 'Sesso', 'Età', 'Centro', 'Sezione', 'Residenza', 'Stato del fascicolo', 'Compound o indirizzo', 'Tutore', 'Parentela del tutore', 'Contatto', 'Tipo di scuola', 'Scuola', 'Classe', 'Visite a casa nell\'anno', 'Date delle visite a casa', 'Ultima visita a casa: cosa è emerso', 'Visite a scuola nell\'anno', 'Date delle visite a scuola', 'Ultima visita a scuola: cosa è emerso', 'Azioni ancora aperte', 'Note'];
  let nh = 0, ns = 0, never = 0;
  const rows = kids.map(c => {
    const vs = visitsOf(c.id).filter(v => inRange(v.date, a, b)).sort((x, y) => x.date.localeCompare(y.date)), hv = vs.filter(v => v.purpose !== 'School visit'), sv = vs.filter(v => v.purpose === 'School visit');
    nh += hv.length; ns += sv.length; if (!vs.length) never++;
    const last = l => l.length ? l[l.length - 1].findings || '' : '';
    return [c.id, c.name, c.surname, c.sex, curAge(c), centreOf(c), (SECTIONS[c.section] || {}).label || '', c.residence === 'Resident' ? 'Residente' : c.residence === 'In transit' ? 'In transito' : c.residence === 'Non-resident' ? 'Non residente' : '', IT[c.status] || c.status, c.familyAddress || c.compound || '', c.guardianName || '', c.guardianRelation || '', c.contact || '', c.schoolType || '', c.schoolName || '', c.grade || '',
      hv.length, hv.map(v => fmtDate(v.date)).join('; '), last(hv), sv.length, sv.map(v => fmtDate(v.date)).join('; '), last(sv), vs.filter(v => v.action && !v.actionDone).map(v => v.action).join('; '), seesHealth(c) ? c.notes || '' : (c.notes ? HIDDEN_TXT : '')];
  });
  const by = f => kids.filter(f).length;
  const sum = [['Scheda ABA (adozioni a distanza), anno ' + year], ['Preparata il', fmtDate(today())], [''], ['Bambini e ragazzi ABA', kids.length], ['Maschi', by(c => c.sex !== 'F')], ['Femmine', by(c => c.sex === 'F')], ['Minsundu', by(c => centreOf(c) === 'Minsundu')], ['Nkwazi', by(c => centreOf(c) === 'Nkwazi')], ['Luigi', by(c => centreOf(c) === 'Luigi')], ['Visite a casa nell\'anno', nh], ['Visite a scuola nell\'anno', ns], ['Senza nessuna visita registrata nell\'anno', never]];
  const HS = ['ID', 'Nome', 'Cognome', 'Scuola', 'Classe', 'Insegnante', 'Data dell\'ultima visita a scuola', 'Compilato da', 'Rendimento', 'Materie con risultati positivi', 'Materie con risultati negativi', 'Materia opzionale scelta', 'Attività co-curricolari', 'Esami: risultati', 'Difficoltà a scuola', 'Suggerimento dell\'insegnante (rendimento)', 'Andamento degli ultimi tre anni', 'Frequenza', 'Comportamento', 'Rapporto con insegnanti', 'Rapporto con compagni', 'Suggerimento dell\'insegnante (comportamento)', 'Rispetto all\'ultima visita', 'Interventi e prossimi passi', 'Term 1', 'Term 2', 'Term 3', 'Giorni di assenza nell\'anno', 'Esito di fine anno', 'Progresso'];
  const PI = { 'Above average': 'Sopra la media', Average: 'Nella media', 'Below average': 'Sotto la media', Regular: 'Regolare', Irregular: 'Irregolare', Absent: 'Assente', Improving: 'In miglioramento', 'The same': 'Stabile', Decreasing: 'In calo' }, it = x => PI[x] || x || '';
  const school = kids.filter(c => isPupil(c) || (c.terms || []).some(r => r.y === Number(year)) || schoolVisits(c).some(v => inRange(v.date, a, b))).map(c => {
    const v = schoolVisits(c).find(x => inRange(x.date, a, b)) || {}, T = t => (c.terms || []).find(r => r.y === Number(year) && r.t === t) || {}, ty = [1, 2, 3].map(T), abs = ty.map(r => Number(r.absent)).filter(n => n === n && n > 0), ye = ty.map(r => r.yearEnd).filter(Boolean).pop() || '';
    return [c.id, c.name, c.surname, schoolOf(c), c.grade || '', v.teacher || v.classTeacher || '', v.date ? fmtDate(v.date) : '', v.by ? staffName(v.by) : '', it(v.perf) + (v.perfNote ? ': ' + v.perfNote : ''), v.strong || ty.map(r => r.strong).filter(Boolean).pop() || '', v.weak || ty.map(r => r.weak).filter(Boolean).pop() || '', v.abaOptional || '', v.cocurr || '', v.abaExam || '', v.weak || '', v.abaSugAcad || v.teacherComment || '', v.aba3y || '', it(v.schAtt), v.behaviour || '', v.intTeachers || '', v.intMates || '', v.abaSugSoc || '', it(v.trend), v.action || '',
      it(ty[0].perf), it(ty[1].perf), it(ty[2].perf), abs.length ? abs.reduce((x, y) => x + y, 0) : '', ye, it(progressOf(c))];
  });
  downloadXlsx('scheda-ABA-' + year, [{ name: 'Riepilogo', rows: sum.concat([['Alunni ABA con dati di scuola', school.length]]) }, { name: 'Bambini ABA', rows: [H].concat(rows) }, { name: 'Scuola ABA', rows: [HS].concat(school) }]);
}

/* ---------- Children page: records to complete ---------- */
function recordsPanel() {
  const P = pendingData(); if (!P.withIssues) return '';
  return `<details class="card more" id="records"${route().q.get('issue') ? ' open' : ''}><summary><b>${P.withIssues} open files</b> miss information that a report needs. Tap to see what.</summary>
    <div style="margin-top:8px">${Object.entries(P.issueCount).map(([k, n]) => `<div class="it"><div class="w"><b>${esc(ISSUES[k])}</b></div><span class="chip">${n}</span><a class="btn sm" href="#" data-q="issue=${k}">Show these children</a></div>`).join('')}</div></details>`;
}

/* ---------- Visits page: who needs a visit, actions still open ---------- */
function visitNeed(team, centre) {
  const P = pendingData(), fam = team === 'all' || team === 'Family', lui = (team === 'all' || team === 'Luigi' || team === 'Others') && (centre === 'all' || centre === 'Luigi');
  const inC = c => vcIn(c, 'Family', centre);
  const due = fam ? P.due.filter(x => inC(x.c)) : [], never = fam ? P.never.filter(x => inC(x.c)) : [], followEnd = fam ? P.followEnd.filter(inC) : [];
  const L = lui ? luigiSteps() : { noFamily: [], toVisit: [], kids: [] };
  return { due, never, followEnd, L, fam, lui, count: due.length + never.length + L.noFamily.length + L.toVisit.length };
}
function needHtml(r, team, centre, N) {
  const showAll = r.q.get('all') === '1', LIM = 15, pm = planMonth();
  const list = N.due.concat(N.never), g = {};
  for (const x of list) { const k = titleCase((x.c.compound || x.c.familyAddress || 'No address').split(/[,#\d]/)[0].trim()) || 'No address'; (g[k] = g[k] || []).push(x); }
  const groups = Object.entries(g).sort((p, q) => q[1].length - p[1].length);
  const row = x => `<div class="it">${avatar(x.c, 34)}<div class="w"><b>${childLink(x.c)}</b><span>${centreChip(x.c)} ${esc(SECTIONS[x.c.section] ? SECTIONS[x.c.section].label : '')} · ${esc(x.c.status === 'Follow-up' ? 'reintegrated, follow-up' : (x.c.residence || ''))} · ${x.vi.never ? (x.c.entryDate ? 'in the programme since ' + esc(fmtDate(x.c.entryDate)) : 'no visit recorded') : 'last visit ' + esc(fmtDate(x.vi.last))}${isAba(x.c) ? ' · ABA' : ''}</span></div>${x.vi.never ? '<span class="chip c-orange">No visit recorded</span>' : `<span class="chip c-red">${x.vi.late} days late</span>`}${planBtn(x.c, pm, 'Family')}</div>`;
  let shown = 0;
  const html = groups.map(([k, l]) => { if (!showAll && shown >= LIM) return ''; const part = showAll ? l : l.slice(0, LIM - shown); shown += part.length; return `<div class="grp">${esc(k)} · ${l.length}</div>` + part.map(row).join(''); }).join('');
  const fam = N.fam ? `<section class="card" id="need"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h2>Home visits due · Family Section · ${list.length}</h2>${list.length > LIM ? `<a href="#" data-q="all=${showAll ? '' : '1'}" class="sub">${showAll ? 'Show fewer' : 'Show all ' + list.length}</a>` : ''}</div>
      <p class="sub" style="margin:2px 0 6px">${N.due.length} late, ${N.never.length} never visited. Grouped by compound. The button puts the child in the plan of ${esc(fmtMonth(pm))}. Residents every ${S.settings.interval.Resident} days, non-residents every ${S.settings.interval['Non-resident']}, follow-up every ${S.settings.interval['Follow-up']}.</p>
      ${list.length ? html : '<p class="empty">No home visit is due.</p>'}</section>
      ${N.followEnd.length ? `<section class="card" id="followend"><h2>2-year follow-up completed · ${N.followEnd.length}</h2><p class="sub" style="margin:2px 0 6px">Reintegrated more than two years ago: the file can be closed.</p>${N.followEnd.map(c => `<div class="it"><div class="w"><b>${childLink(c)}</b><span>Reintegrated ${esc(fmtDate(c.reintegrationDate))}</span></div><a class="btn sm" href="#/child/${esc(c.id)}/status">Close the file</a></div>`).join('')}</section>` : ''}` : '';
  const lui = N.lui ? luigiStepsCard(r) : '';
  return (fam + lui) || `<section class="card"><p class="empty">No automatic list for ${esc(teamLabel(team))}${centre === 'all' ? '' : ' in ' + esc(CENTRE_LABEL[centre])}. Use "Plan of the month" to choose who to visit.</p></section>`;
}
function visitActions(team, centre) {
  return S.visits.filter(v => v.action && !v.actionDone && tmatch(visitTeam(v), team) && vcIn(child(v.childId), team, centre)).sort((x, y) => (x.date || '').localeCompare(y.date || ''));
}
function actionsHtml(list) {
  return `<section class="card" id="actions"><h2>Actions still open · ${list.length}</h2><p class="sub" style="margin:2px 0 6px">Tap Done when it is done.</p>
    ${list.length ? list.map(v => { const c = child(v.childId); return `<div class="it"><div class="w"><b>${esc(v.action)}</b><span>${c ? childLink(c) + ' · ' + centreChip(c) + ' ' : ''}${esc(teamLabel(visitTeam(v)))} · ${esc(v.purpose)} · ${esc(staffName(v.by))} · since ${esc(fmtDate(v.date))}</span></div><button class="btn sm" data-act="actiondone" data-kind="visit" data-id="${esc(v.id)}">Done</button></div>`; }).join('') : '<p class="empty">No open actions.</p>'}</section>`;
}
function counselActions() {
  const list = S.sessions.filter(s => s.action && !s.actionDone).sort((x, y) => (x.date || '').localeCompare(y.date || '')); if (!list.length) return '';
  return `<section class="card" id="cactions"><h2>Actions still open · ${list.length}</h2>${list.map(s => { const c = s.children && s.children[0] ? child(s.children[0]) : null; return `<div class="it"><div class="w"><b>${esc(s.action)}</b><span>${c ? esc(fullName(c)) + ' · ' : ''}${esc(s.type)} session · ${esc(staffName(s.by))} · since ${esc(fmtDate(s.date))}</span></div><button class="btn sm" data-act="actiondone" data-kind="session" data-id="${esc(s.id)}">Done</button></div>`; }).join('')}</section>`;
}

/* ---------- Attendance page: days not marked, children absent in a row ---------- */
function attGap(centre, grp) {
  const kids = S.children.filter(c => isCurrent(c) && attIn(c, centre, grp)); if (!kids.length) return null;
  const ids = new Set(kids.map(c => attKey(c, centre))), t = today(); let last = '';
  for (const d of Object.keys(S.attendance).sort().reverse()) { if (d > t) continue; const day = S.attendance[d] || {}; if (Object.keys(day).some(id => ids.has(String(id)) && day[id] != null)) { last = d; break; } }
  return { n: kids.length, last, days: last ? daysBetween(last, t) : null };
}
function luigiGap(type) {
  const t = today(); let last = '';
  for (const s of S.outreach) if (s.type === type && s.date <= t && (s.children || []).length && s.date > last) last = s.date;
  return { last, days: last ? daysBetween(last, t) : null };
}
function missingIn(centre) { return pendingData().missing.filter(x => (x.centre || centreOf(x.c)) === centre); }
function longIn(centre) { return pendingData().longAbs.filter(x => (x.centre || centreOf(x.c)) === centre); }
function attCheckTop(centre, grp, d) {
  const g = attGap(centre, grp), miss = missingIn(centre), out = [];
  if (g && d === today() && (g.days == null || g.days >= 2)) out.push(`<div class="warn">${g.days == null ? 'No attendance has been marked yet' : `Attendance not marked for <b>${g.days} days</b>`} for ${esc(CENTRE_LABEL[centre] || centre)}, ${esc(grpText(grp))}${g.last ? '. Last day marked: ' + esc(fmtDate(g.last)) + '. Use the arrows or the date to fill the days missed' : ''}.</div>`);
  const lg = longIn(centre);
  if (lg.length) out.push(`<div class="warn" style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span><b>${lg.length} ${lg.length === 1 ? 'child has' : 'children have'}</b> not come for ${absSet().review} days or more: check if the status has to change.</span><a class="btn sm" href="#" data-scroll="attlong">See who</a></div>`);
  if (miss.length) out.push(`<div class="note" style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span><b>${miss.length} ${miss.length === 1 ? 'child' : 'children'}</b> absent ${absSet().alert} days or more in a row.</span><a class="btn sm" href="#" data-scroll="attcheck">See who</a></div>`);
  return out.join('');
}
function attCheckList(centre) {
  const miss = missingIn(centre), lg = longIn(centre); if (!miss.length && !lg.length) return '';
  const longHtml = lg.length ? `<section class="card" id="attlong" style="border-color:var(--red,#E03E3E)"><h2>Not coming for ${absSet().review} days or more: check the status · ${lg.length}</h2><p class="sub" style="margin:2px 0 6px">Comes rarely: make semi-active. Has left: close the file.</p>
    ${lg.map(x => `<div class="it">${avatar(x.c, 34)}<div class="w"><b>${childLink(x.c)}</b><span>${esc(SECTIONS[x.c.section].label)} · ${esc(x.c.status)} · absent since ${esc(fmtDate(x.since))}</span></div><span class="chip c-red">${x.days} days</span><a class="btn sm" href="#/child/${esc(x.c.id)}/status">Check the status</a></div>`).join('')}</section>` : '';
  if (!miss.length) return longHtml;
  return longHtml + `<section class="card" id="attcheck"><h2>Absent ${absSet().alert} days or more in a row · ${miss.length}</h2><p class="sub" style="margin:2px 0 6px">Counted on the days when attendance was marked.</p>
    ${miss.map(x => `<div class="it">${avatar(x.c, 34)}<div class="w"><b>${childLink(x.c)}</b><span>${esc(SECTIONS[x.c.section].label)} · ${esc(x.c.residence || '')} · absent since ${esc(fmtDate(x.since))}</span></div><span class="chip c-red">${x.run} days</span></div>`).join('')}</section>`;
}

/* ---------- To do: one box per section, a few lines each; the lists are in the pages ---------- */
function overviewData() {
  const P = pendingData(), m = thisMonth(), next = addMonths(m, 1), late20 = Number(today().slice(8)) >= 20, { a, b } = monthCtx(m);
  const L = (n, text, href, lvl) => ({ n, text: n === 1 ? text.replace(/^children\b/, 'child').replace(/^days\b/, 'day').replace(/^actions\b/, 'action').replace(/^home visits\b/, 'home visit').replace(/^open files\b/, 'open file').replace(/^2-year follow-ups\b/, '2-year follow-up') : text, href, lvl: lvl || 'red' });
  const gapLines = (centre) => { const out = []; for (const [g, lab] of [['Resident', 'residents'], ['Non-resident', 'non-residents']]) { const x = attGap(centre, g); if (!x) continue;
      if (x.days == null) out.push(L('!', `No attendance marked yet for the ${x.n} ${lab}`, `#/attendance?c=${centre}&g=${g}`, 'orange'));
      else if (x.days >= 2) out.push(L(x.days, `days without attendance for the ${lab} (last: ${fmtDate(x.last)})`, `#/attendance?c=${centre}&g=${g}`, x.days >= 5 ? 'red' : 'orange')); }
    const lg = P.longAbs.filter(y => (y.centre || centreOf(y.c)) === centre).length; if (lg) out.push(L(lg, `children not coming for ${absSet().review} days or more: check the status`, `#/attendance?c=${centre}&go=attlong`));
    const miss = P.missing.filter(y => (y.centre || centreOf(y.c)) === centre).length; if (miss) out.push(L(miss, `children absent ${absSet().alert} days or more in a row`, `#/attendance?c=${centre}&go=attcheck`, 'orange'));
    if (centre === 'Nkwazi') { const fc = S.children.filter(c => c.section === 'Nkwazi' && (c.toCheck || []).length).length; if (fc) out.push(L(fc, 'children with something to confirm from the two Nkwazi files', '#/children?section=Nkwazi&status=all&issue=files', 'orange')); }
    return out; };
  const planLines = (team) => { const out = [], pl = planFor(m, team); if (pl.length) out.push(L(pl.filter(p => planStatus(p).k === 'done').length + ' / ' + pl.length, `visits of the plan of ${fmtMonth(m)} done`, `#/visits?vt=${team}&vtab=plan&m=${m}`, 'info'));
    if (late20 && !planFor(next, team).length) out.push(L('!', `The plan of ${fmtMonth(next)} is not made yet`, `#/visits?vt=${team}&vtab=plan&m=${next}`, 'orange')); return out; };
  const acts = t => S.visits.filter(v => v.action && !v.actionDone && visitTeam(v) === t).length;
  const cards = [];
  // Luigi
  { const lines = [], ls = luigiSteps(), g = luigiGap('Drop-in'), kids = S.children.filter(c => c.section === 'Luigi');
    if (kids.length) {
      if (g.days == null) lines.push(L('!', 'No drop-in sheet filled yet', '#/attendance?c=Luigi', 'orange')); else if (g.days >= 2) lines.push(L(g.days, `days without a drop-in sheet (last: ${fmtDate(g.last)})`, '#/attendance?c=Luigi', g.days >= 5 ? 'red' : 'orange'));
      if (ls.noFamily.length) lines.push(L(ls.noFamily.length, 'children: we do not know where the family is', '#/visits?vt=Luigi&vtab=need', 'orange'));
      if (ls.toVisit.length) lines.push(L(ls.toVisit.length, 'children with family known and no home visit yet', '#/visits?vt=Luigi&vtab=need', 'orange'));
      const bq = S.children.filter(c => backAuto(c)).length; if (bq) lines.push(L(bq, 'seen on the street again after leaving: to confirm', '#/children?status=all&grp=backq', 'orange'));
      const a2 = acts('Luigi'); if (a2) lines.push(L(a2, 'actions from Luigi visits still open', '#/visits?vt=Luigi&vtab=actions'));
      lines.push(...planLines('Luigi'));
    }
    referLine(lines, 'Luigi'); backLine(lines, 'Luigi'); cards.push({ k: 'Luigi', title: 'Luigi Drop-in', color: SECTIONS.Luigi.color, lines, empty: !kids.length ? 'No children recorded yet.' : '' }); }
  for (const centre of ['Minsundu', 'Nkwazi']) { const n = S.children.filter(c => isCurrent(c) && centreOf(c) === centre).length;
    const gl = n ? gapLines(centre) : [];
    if (centre === 'Minsundu') { const t0 = addDays(today(), -6), ids = new Set(); for (const d of Object.keys(S.attendance)) if (d >= t0 && d <= today()) for (const [id, v] of Object.entries(S.attendance[d] || {})) if (v === 'T') ids.add(String(id)); if (ids.size) gl.unshift(L(ids.size, 'children marked Street in the last 7 days', '#/attendance?c=Minsundu&g=All&av=month')); }
    cards.push({ k: centre, title: centre, color: CENTRE_COLOR[centre], lines: referLine(monthlyLine(gl, centre), centre), empty: n ? '' : 'No children recorded yet.' }); }
  // Family
  { const lines = [], d2 = P.due.length, nv = P.never.length;
    if (d2) lines.push(L(d2, 'home visits late', '#/visits?vt=Family&vtab=need'));
    if (nv) lines.push(L(nv, 'children never visited at home', '#/visits?vt=Family&vtab=need', 'orange'));
    const a2 = acts('Family'); if (a2) lines.push(L(a2, 'actions from visits still open', '#/visits?vt=Family&vtab=actions'));
    if (P.followEnd.length) lines.push(L(P.followEnd.length, '2-year follow-ups completed: file to close', '#/visits?vt=Family&vtab=need&go=followend', 'orange'));
    lines.push(...planLines('Family'));
    const t = Number((S.settings.targets[m] || {}).homeVisits) || 0, done = S.visits.filter(v => inRange(v.date, a, b) && visitTeam(v) === 'Family').length;
    lines.push(L(done + (t ? ' / ' + t : ''), `home visits done in ${fmtMonth(m)}${t ? ' (target)' : ''}`, '#/visits?vt=Family', 'info'));
    referLine(lines, 'Family'); backLine(lines, 'Family'); cards.push({ k: 'Family', title: 'Family Section', color: '#73726E', lines }); }
  // School
  { const lines = [], a2 = acts('School'); if (a2) lines.push(L(a2, 'actions from school visits still open', '#/visits?vt=School&vtab=actions'));
    if (P.issueCount.school) lines.push(L(P.issueCount.school, 'children under 18 without school information', '#/children?issue=school', 'orange'));
    lines.push(...planLines('School'));
    const t = Number((S.settings.targets[m] || {}).schoolVisits) || 0, done = S.visits.filter(v => inRange(v.date, a, b) && v.purpose === 'School visit').length;
    { const kidsSeen = uniq(S.visits.filter(v => inRange(v.date, a, b) && v.purpose === 'School visit').map(v => String(v.childId))).length, trips = schoolTrips(a, b).length; lines.push(L(kidsSeen + (t ? ' / ' + t : ''), `${kidsSeen === 1 && !t ? 'pupil' : 'pupils'} monitored at school in ${fmtMonth(m)}${t ? ' (target)' : ''} · ${trips} school ${trips === 1 ? 'visit' : 'visits'}`, '#/visits?vt=School', 'info')); }
    { const tn = termNow(), sl = schoolsLeft(tn); if (sl.all) lines.unshift(L(sl.left, 'of ' + sl.all + (tn.hol ? ' schools not visited in ' + termLabel(tn) + ' (school holidays now)' : ' schools not visited yet in ' + termLabel(tn)), '#/school?show=nosch', sl.left && !tn.hol ? 'orange' : 'info')); }
    referLine(lines, 'School'); backLine(lines, 'School'); cards.push({ k: 'School', title: 'School Section', color: '#73726E', lines }); }
  // Counseling
  { const lines = [], a2 = S.sessions.filter(s => s.action && !s.actionDone).length; if (a2) lines.push(L(a2, 'actions from sessions still open', '#/counseling?go=cactions'));
    lines.push(L(S.sessions.filter(s => inRange(s.date, a, b)).length, `sessions recorded in ${fmtMonth(m)}`, '#/counseling', 'info'));
    referLine(lines, 'Counseling'); backLine(lines, 'Counseling'); cards.push({ k: 'Counseling', title: 'Counselling', color: '#73726E', lines }); }
  // Education office
  { const lines = [];
    for (const x of P.reports) lines.push(L('', `${REPORTS[x.key].short || REPORTS[x.key].label} report of ${fmtMonth(x.month)}: ${x.st.prepared ? 'sent, to check' : x.st.back ? 'sent back' : 'not sent'}`, `#/reports?s=${x.key}&m=${x.month}`, x.st.prepared ? 'orange' : 'red'));
    if (typeof repWaiting === 'function') { const seen = new Set(P.reports.map(x => x.month + '|' + x.key)); for (const w of repWaiting()) if (w.state === 'sent' && !seen.has(w.m + '|' + w.k)) lines.push(L('', `${repLabel(w.k)} report of ${fmtMonth(w.m)}: sent, to check`, `#/reports?s=${w.k}&m=${w.m}`, 'orange')); }
    if (P.withIssues) lines.push(L(P.withIssues, 'open files with information missing', '#/children?go=records', 'orange'));
    if (P.review) lines.push(L(P.review, 'open files of children who seem to have left', '#/review', 'orange'));
    if (S.children.length && (P.backupDays == null || P.backupDays > 7)) lines.push(L(P.backupDays == null ? '!' : P.backupDays, P.backupDays == null ? 'No backup made on this ' + (isPhone() ? 'phone' : 'computer') + ' yet' : 'days since the last backup', USER && USER.admin ? '#/staff/data' : '#/help', 'red'));
    { const sl = referLine([], 'Sports'); if (sl.length) cards.push({ k: 'Sports', title: 'Sports', color: '#73726E', lines: sl }); }
    checkLine(lines); taskLine(lines); cards.push({ k: 'Admin', title: 'Education office', color: '#37352F', lines }); }
  /* a report sent back by the Education office: first line of the card of its section */
  if (typeof repWaiting === 'function') for (const w of repWaiting()) if (w.state === 'back') { const ck = w.k === 'UCC' || w.k === 'Youth' ? 'Minsundu' : w.k, card = cards.find(c => c.k === ck); if (card) { card.lines = card.lines || []; card.lines.unshift(L('', `${repLabel(w.k)} report of ${fmtMonth(w.m)} sent back: ${w.R.last.note || ''}`, `#/reports?s=${w.k}&m=${w.m}`, 'red')); card.empty = ''; } }
  return cards;
}
/* the red number in the menu: supervisors count everything, the others only their own sections */
function todoCount() { return todoCount0() + taskLateMine(); }
function todoCount0() {
  if (!USER || seesOverview()) return pendingData().urgent;
  const mine = staffAreas(USER); if (!mine.length) return 0;
  const own = c => mine.includes(c.k) || (mine.includes('Sports') && CENTRES.includes(c.k));
  let n = 0; for (const c of overviewData()) if (own(c)) for (const x of c.lines) if (x.lvl === 'red') n += typeof x.n === 'number' ? x.n : 1;
  return n;
}
/* staff of a centre: birthdays of the children of their centres, yesterday, today and the next 7 days.
   Only a real date of birth counts: never the age written on a day, never 1 January (used when the day is not known) */
function birthdayList() {
  if (!USER || seesOverview() || GUEST) return [];
  const mine = staffAreas(USER).filter(k => CENTRES.includes(k)); if (!mine.length) return [];
  const t = today(), out = [];
  const leap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  for (const c of S.children) {
    if (!c.dob || c.status === 'Closed' || !/^\d{4}-\d{2}-\d{2}$/.test(c.dob) || c.dob.slice(5) === '01-01') continue;
    if (!attCentres(c).some(k => mine.includes(k))) continue;
    for (let k = -1; k <= 7; k++) {
      const d = addDays(t, k), y = Number(d.slice(0, 4)); let md = c.dob.slice(5); if (md === '02-29' && !leap(y)) md = '02-28';
      if (d.slice(5) === md && y > Number(c.dob.slice(0, 4))) { out.push({ c, k, d, age: y - Number(c.dob.slice(0, 4)) }); break; }
    }
  }
  return out.sort((x, y) => x.k - y.k || fullName(x.c).localeCompare(fullName(y.c)));
}
function homeBirthdays() {
  const L = birthdayList(); if (!L.length) return '';
  const nm = x => `<a href="#/child/${esc(x.c.id)}"><b>${esc(fullName(x.c))}</b></a> (${x.age})`, join = a => a.map(nm).join(', ');
  const tod = L.filter(x => x.k === 0), yes = L.filter(x => x.k === -1), wk = L.filter(x => x.k > 0);
  const day = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `<div class="note bday" id="birthdays">${tod.length ? `<p><b>Today is the birthday of</b> ${join(tod)}.</p>` : ''}${yes.length ? `<p>Yesterday was the birthday of ${join(yes)}.</p>` : ''}${wk.length ? `<p>Birthdays in the next 7 days: ${wk.map(x => esc(day(x.d)) + ' ' + nm(x)).join(' · ')}.</p>` : ''}</div>`;
}
/* staff who are not supervisors: the To do of their own sections, on the Home page */
function homeTodo() {
  if (!USER || seesOverview() || GUEST) return '';
  const mine = staffAreas(USER); if (!mine.length) return '';
  const own = c => mine.includes(c.k) || (mine.includes('Sports') && CENTRES.includes(c.k));
  const mf = mainFlag(USER), cards = overviewData().filter(own).sort((x, y) => (y.k === mf) - (x.k === mf));
  if (!cards.length) return '';
  const open = c => c.lines.filter(l => l.lvl !== 'info').length;
  return `<section id="todo"><h2 style="margin:0 0 8px">To do in ${cards.length === 1 ? 'your section' : 'your sections'}</h2>
  <div class="grid ${cards.length >= 3 ? 'g3' : cards.length === 2 ? 'g2' : ''} ovgrid" id="ovgrid" style="align-items:start${cards.length === 1 ? ';max-width:640px' : ''}">${cards.map(c => `<section class="card ovcard" style="border-top:5px solid ${c.color}"><h2>${esc(c.title)}</h2>
    <p class="ovsum ${open(c) ? 'has' : 'ok'}">${c.empty ? esc(c.empty) : open(c) ? open(c) + (open(c) === 1 ? ' thing' : ' things') + ' to look at' : 'Nothing open'}</p>
    ${c.lines.map(l => `<a class="al ${l.lvl}" href="${l.href}">${l.n !== '' ? `<b>${esc(l.n)}</b>` : '<b>·</b>'}<span>${esc(l.text)}</span><i aria-hidden="true">›</i></a>`).join('')}</section>`).join('')}</div>
  <p class="sub" style="margin:6px 0 0">Red: late. Orange: soon. Grey: this month.</p></section>`;
}
function vPending(r) {
  const cards = overviewData(), mine = USER ? staffAreas(USER) : [];
  const own = c => mine.includes(c.k) || (mine.includes('Sports') && CENTRES.includes(c.k));
  const mf = USER ? mainFlag(USER) : '', score = c => c.k === mf ? 2 : own(c) ? 1 : 0;
  const sorted = cards.slice().sort((x, y) => score(y) - score(x));
  const open = c => c.lines.filter(l => l.lvl !== 'info').length;
  const card = c => `<section class="card ovcard"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><h2 class="keyh">${['Luigi', 'Minsundu', 'Nkwazi'].includes(c.k) ? placeSwatch(c.k) : secDisc(c.k)}${esc(c.title)}</h2>${own(c) ? '<span class="chip c-blue">You work here</span>' : ''}</div>
    <p class="ovsum ${open(c) ? 'has' : 'ok'}">${c.empty ? esc(c.empty) : open(c) ? open(c) + (open(c) === 1 ? ' thing' : ' things') + ' to look at' : 'Nothing open'}</p>
    ${c.lines.map(l => `<a class="al ${l.lvl}" href="${l.href}">${l.n !== '' ? `<b>${esc(l.n)}</b>` : '<b>·</b>'}<span>${esc(l.text)}</span><i aria-hidden="true">›</i></a>`).join('')}</section>`;
  return `<div class="top"><div><h1>To do</h1><p class="lead">Tap a line to open the list.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="xl" data-k="pending">Export in Excel</button></div></div>
  <div class="grid g3 ovgrid" id="ovgrid" style="align-items:start">${sorted.map(card).join('')}</div>
  <p class="sub" style="margin:0">Red: late. Orange: soon. Grey: this month.</p>`;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-mact]'); if (!b) return;
  const act = b.dataset.mact;
  if (act === 'abasheet') abaSheet(b.dataset.y);
  else if (act === 'backyes') { const c = child(b.dataset.id); c.backStreet = b.dataset.why; c.backStreetDate = b.dataset.d; c.updatedAt = today(); save(); toast(fullName(c) + ': marked as back on the street'); render(); }
  else if (act === 'backno') { const c = child(b.dataset.id); c.backNo = true; save(); render(); }
});


/* ====================================================================
   Phones: bottom bar, menu page, filters that fold, child picker
   ==================================================================== */
function isPhone() { return window.matchMedia && window.matchMedia('(max-width:899.98px)').matches; }
/* the phone menu follows the person: Home, the three places of their own work, More.
   The three places come from the main area the Education office gave to the person. Everything else is in More. */
const MNAV_SET = { Admin: ['pending', 'children', 'reports'], Mgmt: ['pending', 'tasks', 'reports'], Family: ['visits', 'children', 'tasks'], School: ['school', 'children', 'visits'], Counseling: ['counseling', 'children', 'reports'], Sports: ['activities', 'attendance', 'children'], '': ['attendance', 'visits', 'children'] };
const MNAV_LAB = { home: 'Home', attendance: 'Attendance', visits: 'Monitoring', children: 'Children', counseling: 'Counselling', reports: 'Reports', pending: 'To do', school: 'Schools', activities: 'Activities', tasks: 'Tasks' };
function mnavItems(u) { u = u || USER; const k = u && (u.admin || isSite(u)) ? 'Admin' : u && isMgmt(u) ? 'Mgmt' : mainFlag(u); return ['home'].concat(MNAV_SET[k] || MNAV_SET['']); }
function mobileNav(active, pc) {
  const main = mnavItems(), lab = MNAV_LAB;
  const ic = { home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z', attendance: 'M9 12l2 2 4-4M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z', visits: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.800-7 11-7 11zm0-8.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z', children: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.700 0-6 1.300-6 4v2h12v-2c0-2.700-3.300-4-6-4zm8 0c-.400 0-.800 0-1.200.100 1.300.900 2.200 2.200 2.200 3.900v2h5v-2c0-2.700-3.300-4-6-4z', more: 'M4 6h16M4 12h16M4 18h16',
    counseling: 'M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', reports: 'M5 20V11M12 20V4M19 20v-6M3 20h18', pending: 'M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2', school: 'M3 5c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6v13', activities: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18', tasks: 'M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11' };
  const svg = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ic[k]}"/></svg>`;
  const path = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0], adm = USER && USER.admin;
  const cur = main.includes('school') && ['school', 'schoolvisit', 'pupil'].includes(path) ? 'school' : main.includes(active) ? active : 'more';
  const n = k => k === 'tasks' ? taskOpenFor(USER).length : k === (main.includes('pending') ? 'pending' : 'home') ? pc : 0;
  return `<nav class="mnav" aria-label="Main, phone">${main.map(k => `<a href="#/${k}" class="${cur === k ? 'on' : ''}"${cur === k ? ' aria-current="page"' : ''}>${svg(k)}<span>${lab[k]}${n(k) ? ` <span class="cyp-badge">${n(k) > 99 ? '99+' : n(k)}</span>` : ''}</span></a>`).join('')}<a href="#/more" class="${cur === 'more' ? 'on' : ''}"${cur === 'more' ? ' aria-current="page"' : ''}>${svg('more')}<span>More</span></a></nav>`;
}
function vMore() {
  const pc = todoCount(), bar = mnavItems(), item = (h, t, s, n) => `<a class="mitem" href="${h}"><span><b>${t}</b><small>${s}</small></span>${n ? `<span class="chip c-red">${n}</span>` : ''}<i aria-hidden="true">›</i></a>`;
  const out = k => !bar.includes(k);
  return `<div class="top"><div><h1>More</h1><p class="lead">${esc(USER.name)}${staffAreas(USER).length ? ' · ' + esc(areasText(USER)) : ''}</p></div></div>
  <div class="mlist">
    ${seesOverview() && out('pending') ? item('#/pending', 'To do', 'What is still open, section by section', pc) : ''}
    ${out('attendance') ? item('#/attendance', 'Attendance', 'Registers of Minsundu, Nkwazi and Luigi') : ''}
    ${out('visits') ? item('#/visits', 'Monitoring', 'Home visits and school visits') : ''}
    ${out('children') ? item('#/children', 'Children', 'Find a child, open the profile') : ''}
    ${out('tasks') ? item('#/tasks', 'Tasks', 'Given to a person or to a team', taskOpenFor(USER).length) : ''}
    ${out('counseling') ? item('#/counseling', 'Counselling', 'Record a session') : ''}
    ${out('reports') ? item('#/reports', 'Reports', 'Tables of each section') : ''}
    ${out('activities') && (seesOverview() || staffAreas(USER).includes('Sports')) ? item('#/activities', 'Activities', 'Sports and VET training · draft') : ''}
    ${out('school') ? item('#/school', 'Pupils by school', 'School visits and results per term') : ''}
    ${item('#/cases', 'Case studies', 'Background, change and outcome of a child, in six parts')}
    ${item('#/groups', 'Group activities', 'Workshops, parents meetings, Girl Child Program, school materials')}
    ${item('#/referrals', 'Referrals', 'Between sections')}
    ${item('#/monthly', 'Monthly reports', 'Minsundu key child form')}
    <a class="mitem" href="#/sync"><span><b>Shared database</b><small>${syncOn() ? (SY.state === 'off' ? 'No connection: saved here, sent later' : 'Connected: sent and received by itself') : 'Not connected yet'}</small></span>${syncOn() && pendingCount() ? '<span class="chip c-blue">Sending</span>' : ''}<i aria-hidden="true">›</i></a>
    ${seesOverview() ? item('#/logframe', 'Logframe', 'Indicators · draft') : ''}
    ${canAdminPage() ? item('#/staff', 'Admin', isSite() ? 'People, areas, PIN, backup' : 'People, areas, targets') : ''}
    ${typeof fbCan === 'function' && fbCan() ? `<a class="mitem mo" href="#" data-cmt="1"><span><b>Comment</b><small>Goes back to the page you were on. Then tap what is not clear.</small></span><i aria-hidden="true">›</i></a>` : ''}
    ${item('#/help', 'How it works', 'And what we want to know from you')}
  </div>
  ${installCard()}
  <div class="card soft" style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span class="sub">${storageOk ? 'Saved on this ' + (isPhone() ? 'phone' : 'computer') : 'Not saving: open the file in Chrome'} · ${VERSION}</span><button class="btn" data-act="logout">Switch user</button></div>`;
}
function filtBtn() { return `<button type="button" class="btn mfbtn" data-mact="filters" aria-expanded="${UI.fopen ? 'true' : 'false'}">${UI.fopen ? 'Hide filters' : 'Filters'}</button>`; }

/* one box to find a child by typing, instead of a list of hundreds of names */
function childPick(name, id, label) {
  return `<div class="f wide cpick" data-name="${name}"><span>${esc(label)}</span>${childPickInner(name, id)}</div>`;
}
function childPickInner(name, id) {
  const c = id ? child(id) : null;
  return `<input type="hidden" name="${name}" value="${c ? esc(c.id) : ''}">` + (c
    ? `<div class="cpsel">${avatar(c, 40)}<div class="w"><b>${esc(fullName(c))}${c.nickname ? ' "' + esc(c.nickname) + '"' : ''}</b><span>${centreChip(c)} ${esc(SECTIONS[c.section].label)} · ID ${esc(c.id)}</span></div><button type="button" class="btn sm" data-cp="clear">Change</button></div>`
    : `<input class="in" data-cp="q" placeholder="Type the name, nickname or ID" aria-label="Find the child: name, nickname or ID" autocomplete="off" autocapitalize="words"><div class="cpres"></div>`);
}
function childPickResults(text) {
  const t = String(text || '').trim().toLowerCase(); if (t.length < 2) return '';
  const open = S.children.filter(c => c.status !== 'Closed');
  let list = open.filter(c => [c.id, c.name, c.surname, c.nickname].join(' ').toLowerCase().includes(t) || (fullName(c).toLowerCase().includes(t)));
  if (!list.length) list = (knownMatches(text) || []).filter(c => c.status !== 'Closed');
  list = list.sort((x, y) => fullName(x).localeCompare(fullName(y))).slice(0, 8);
  if (!list.length) return '<p class="empty" style="margin:6px 0">No child with an open file matches.</p>';
  return list.map(c => `<button type="button" class="cpopt" data-cp="pick" data-id="${esc(c.id)}">${avatar(c, 36)}<span class="w"><b>${esc(fullName(c))}${c.nickname ? ' "' + esc(c.nickname) + '"' : ''}</b><small>${esc(centreOf(c))} · ${esc(SECTIONS[c.section].label)}${curAge(c) !== '' ? ' · ' + curAge(c) + ' years' : ''} · ID ${esc(c.id)}</small></span></button>`).join('');
}
document.addEventListener('input', e => {
  if (e.target.dataset && e.target.dataset.cp === 'q') { const box = e.target.parentElement.querySelector('.cpres'); if (box) box.innerHTML = childPickResults(e.target.value); }
});
document.addEventListener('click', e => {
  const f = e.target.closest('[data-mact="filters"]'); if (f) { UI.fopen = !UI.fopen; render(); return; }
  const b = e.target.closest('[data-cp]'); if (!b || b.dataset.cp === 'q') return;
  const w = b.closest('.cpick'), name = w.dataset.name, label = w.querySelector('span').outerHTML;
  w.innerHTML = label + childPickInner(name, b.dataset.cp === 'pick' ? b.dataset.id : '');
  if (b.dataset.cp === 'clear') { const q = w.querySelector('[data-cp=q]'); if (q) q.focus(); }
});


/* ====================================================================
   Guest view: a copy of the records with names, photos and personal
   details removed. The real records are not touched and nothing is saved.
   ==================================================================== */
const MASK = 'XXXX';
function maskState(st) {
  const ph = st.photos; st.photos = {};
  let s; try { s = JSON.parse(JSON.stringify(st)); } finally { st.photos = ph; }
  const m = (o, keys) => { for (const k of keys) if (o[k]) o[k] = MASK; };
  for (const c of s.children) {
    const age = curAge(c);
    c.name = MASK; c.surname = ''; c.nickname = '';
    if (c.dob) { c.dob = ''; c.age = age; c.ageAsOf = today(); }
    const src = srcNorm(c.referredBy), keepSrc = NKZ_SOURCES.includes(src) || /^(Luigi|Minsundu|Community|District Social Welfare)/.test(src);
    m(c, ['guardianName', 'guardianRelation', 'father', 'mother', 'otherRelatives', 'contact', 'familyAddress', 'familyBackground', 'medical', 'disabilities', 'objectives', 'notes', 'educationAtEntry', 'streetPlace', 'relStreetWho', 'languages', 'referredBy']);
    if (keepSrc) c.referredBy = src;
    if (c.toCheck) c.toCheck = c.toCheck.length ? [MASK] : []; m(c, ['admissionNote']);
  }
  for (const v of s.visits || []) m(v, ['findings', 'action', 'metWith', 'place']);
  for (const x of s.sessions || []) m(x, ['topic', 'action']);
  for (const x of s.events || []) m(x, ['note']);
  for (const x of s.moves || []) m(x, ['note']);
  for (const x of s.outreach || []) m(x, ['notes', 'findings']);
  s.photos = {};
  return s;
}
function saveNow() {
  clearTimeout(saveTimer);
  if (GUEST || !storageOk) return Promise.resolve();
  return idb().then(db => new Promise(res => { const tx = db.transaction(DB_STORE, 'readwrite'); tx.objectStore(DB_STORE).put(JSON.parse(JSON.stringify(S)), 'state'); tx.oncomplete = res; tx.onerror = res; tx.onabort = res; })).catch(() => {});
}
async function guestIn() {
  if (GUEST) return;
  await saveNow();
  S_REAL = S; S = maskState(S_REAL); GUEST = true;
  USER = { id: 'guest', name: 'Guest', role: 'Guest view', areas: [], admin: false, active: true, guest: true };
  lsSet(USER_KEY, 'guest'); if (!location.hash) location.hash = '#/home'; render();
}
function guestOut() { if (!GUEST) return; S = S_REAL; S_REAL = null; GUEST = false; }
function guestBar() { return `<div class="guestbar"><b>Guest view.</b> <span>Names, photos and personal details of the children are hidden. View only.</span> <button class="btn sm" data-act="logout">Leave</button></div>`; }

document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-cmt]'); if (!b) return; e.preventDefault(); history.back(); setTimeout(() => { if (typeof fbMode === 'function') fbMode(true); }, 500); });
