/* ---------- Group activities (beta 1.4, 24/11/2026) ----------
   Mauro, 24/11: one simple record for workshops, parents meetings, Girl Child Program and school materials,
   so the section reports can count them (indicators LUI 6, MIN 5, NKZ 17, FML 13, SCH 20 of the proposal of 24/11).
   Stored as an event: type "Group activity", childId '', children = the names ticked. Cancelled with "Record cancelled". */
const GRP_SECS = [['Luigi', 'Luigi Drop-in'], ['UCC', 'Minsundu · UCC'], ['Youth', 'Minsundu · Youth'], ['Nkwazi', 'Nkwazi Centre'], ['Family', 'Family Section'], ['School', 'School Section'], ['Counseling', 'Counselling'], ['Sports', 'Sports']];
/* beta 1.8 (comment of 24/11): health talks, team outings, tournaments, the youth camp of the ZBF and activities outside the project */
const GRP_KINDS = ['Workshop', 'Parents meeting', 'Girl Child Program', 'Cookery session', 'School materials given', 'Health talk', 'Team outing', 'Tournament', 'Youth camp (ZBF)', 'Activity outside the project', 'Other'];
const GRP_AREA = { Luigi: 'Luigi', Minsundu: 'UCC', Nkwazi: 'Nkwazi', Family: 'Family', School: 'School', Counseling: 'Counseling', Sports: 'Sports' };
function grpSecLabel(k) { return (GRP_SECS.find(x => x[0] === k) || [k, k])[1]; }
function grpAll() { return (S.events || []).filter(e => e.type === 'Group activity'); }
function grpIn(a, b, sec) { return grpAll().filter(e => inRange(e.date, a, b) && (!sec || e.section === sec)).sort((x, y) => (y.date || '').localeCompare(x.date || '') || (y.ts || 0) - (x.ts || 0)); }
function grpKids(e) { return distinctChildren((e.children || []).map(String)); }
function grpDefSec() { if (!USER) return 'Luigi'; const a = staffAreas(USER); for (const k of ['Luigi', 'Minsundu', 'Nkwazi', 'Family', 'School', 'Counseling', 'Sports']) if (a.includes(k)) return GRP_AREA[k]; return 'Luigi'; }
function grpSexLine(L) { const f = L.filter(c => c.sex === 'F').length, m = L.filter(c => c.sex === 'M').length; return `F ${f} · M ${m}`; }

/* the list of the month */
function vGroups(r) {
  const q = r.q, m = q.get('m') || thisMonth(), sec = q.get('s') || '', { a, b } = monthCtx(m), L = grpIn(a, b, sec);
  const row = e => { const ks = grpKids(e), ad = (Number(e.women) || 0) + (Number(e.men) || 0), ot = Number(e.others) || 0;
    return `<div class="cyp-row grprow"><div class="cyp-row__text"><b>${esc(e.kind || 'Group activity')} · ${esc(e.topic || '')}</b><span>${esc(fmtDate(e.date))} · ${esc(grpSecLabel(e.section))} · ${ks.length + ot} children${ks.length ? ' (' + grpSexLine(ks) + ')' : ''}${ad ? ' · ' + ad + ' adults (women ' + (Number(e.women) || 0) + ', men ' + (Number(e.men) || 0) + ')' : ''} · by ${esc(staffName(e.by))}</span>${ks.length ? `<details class="grpnames"><summary>Names</summary><p class="sub">${ks.map(c => childLink(c)).join(', ')}</p></details>` : ''}${e.note ? `<p class="sub">${esc(e.note)}</p>` : ''}</div>${typeof cancelBtn === 'function' ? cancelBtn('event', e) : ''}</div>`; };
  return `<div class="top"><div><h1>Group activities</h1><p class="lead">Workshops, parents meetings, Girl Child Program, cookery, school materials: one line each, with the names.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${monthPicker(m)}<a class="btn pri" href="#/groups/new${sec ? '?s=' + sec : ''}">Record a group activity</a></div></div>
  <div class="seg segg" role="group" aria-label="Section"><a href="#" data-q="s=" class="${sec ? '' : 'on'}">All sections</a>${GRP_SECS.map(([k, l]) => `<a href="#" data-q="s=${k}" class="${sec === k ? 'on' : ''}">${esc(l)}</a>`).join('')}</div>
  <section class="card"><h2>${esc(fmtMonth(m))} · ${L.length} ${L.length === 1 ? 'activity' : 'activities'}</h2>${L.length ? L.map(row).join('') : '<p class="empty">No group activity recorded in this month.</p>'}</section>`;
}

/* the form */
function vGroupNew(r) {
  const q = r.q, sec = GRP_SECS.some(x => x[0] === q.get('s')) ? q.get('s') : grpDefSec();
  UI.grpKids = UI.grpKids || new Set();
  return `<div class="top"><div><h1>Record a group activity</h1><p class="lead">One line for each activity: the day, what it was about, who took part.</p></div><a class="btn" href="#/groups">Back</a></div>
  <form class="card" data-form="group" style="max-width:860px"><div class="fs two">
    ${field('Section', 'section', sec, 'select', { req: true, options: opt(GRP_SECS.map(([v, l]) => ({ v, l })), sec) })}
    ${field('Kind of activity', 'kind', '', 'select', { req: true, options: opt(GRP_KINDS, q.get('k') || '', 'Choose') })}
    ${field('Date', 'date', today(), 'date', { req: true })}
    ${field('Topic, or what was given', 'topic', '', 'text', { req: true })}
    <div class="f" style="grid-column:1/-1" id="grpkids"></div>
    ${field('Other children, not named', 'others', '', 'number', { attrs: ' min="0"' })}
    ${field('Adults present: women', 'women', '', 'number', { attrs: ' min="0"' })}${field('Adults present: men', 'men', '', 'number', { attrs: ' min="0"' })}
    ${field('Note', 'note', '', 'textarea', { wide: true, rows: 3 })}
  </div><button class="btn pri" style="margin-top:12px">Save the activity</button></form>`;
}
/* who took part: the children of the section first; filters, search and ticks as everywhere (pick.js) */
const GRP_REG = { Luigi: 'Luigi', UCC: 'UCC', Youth: 'Youth', Nkwazi: 'Nkwazi' };
function grpKidsHtml() {
  const f = document.querySelector('form[data-form="group"]'); if (!f) return '';
  const sec = f.elements.section ? f.elements.section.value : '';
  UI.grpKids = UI.grpKids || new Set();
  return pickHtml('grp', { sel: UI.grpKids, def: GRP_REG[sec] || '', label: 'Who took part: tick the names' });
}
function grpKidsDraw() { const b = document.getElementById('grpkids'); if (!b) return; b.innerHTML = grpKidsHtml(); }
PICK_ON.grp = { sel: () => (UI.grpKids = UI.grpKids || new Set()), draw: () => grpKidsDraw() };
document.addEventListener('change', e => {
  const el = e.target, f = el.closest ? el.closest('form[data-form="group"]') : null; if (!f) return;
  if (el.name === 'section') { pickReset('grp'); grpKidsDraw(); }
});
FORMS.group = function (o) {
  const kids = Array.from(UI.grpKids || []), n = v => Math.max(0, Number(v) || 0);
  if (!o.kind) return toast('Choose the kind of activity');
  if (!kids.length && !n(o.others) && !n(o.women) && !n(o.men)) return toast('Tick who took part, or write how many');
  S.events.push({ id: uid('e'), childId: '', type: 'Group activity', section: o.section, kind: o.kind, date: o.date, topic: (o.topic || '').trim(), children: kids, others: n(o.others), women: n(o.women), men: n(o.men), note: (o.note || '').trim(), ts: Date.now(), by: USER.id });
  UI.grpKids = null; pickReset('grp'); save(); toast('Activity saved'); go('#/groups?s=' + o.section + '&m=' + o.date.slice(0, 7));
};

/* in the report of a section: one table with the activities of the period */
function grpReportHtml(k, a, b) {
  if (!GRP_SECS.some(x => x[0] === k)) return '';
  const L = grpIn(a, b, k), add = `<a class="btn sm" href="#/groups/new?s=${k}">Record a group activity</a>`;
  if (!L.length) return `<section class="card"><h2>Group activities</h2><p class="sub" style="margin:4px 0 10px">No workshop, parents meeting, Girl Child Program, cookery or school materials recorded in this period.</p>${add}</section>`;
  const rows = GRP_KINDS.map(kd => { const l = L.filter(e => e.kind === kd); if (!l.length) return null; const ks = distinctChildren([].concat(...l.map(e => (e.children || []).map(String)))), ot = l.reduce((s, e) => s + (Number(e.others) || 0), 0), w = l.reduce((s, e) => s + (Number(e.women) || 0), 0), mm = l.reduce((s, e) => s + (Number(e.men) || 0), 0);
    return [kd, l.length, ks.filter(c => c.sex === 'F').length, ks.filter(c => c.sex === 'M').length, ks.length, ot, w + mm]; }).filter(Boolean);
  return `<section class="card"><h2>Group activities</h2><p class="sub" style="margin:4px 0 10px">Each child once per kind of activity. Not named = children counted without a name.</p>
    <div class="tw"><table class="rt"><thead><tr><th>Kind</th><th class="n">Activities</th><th class="n">Girls</th><th class="n">Boys</th><th class="n">Children named</th><th class="n">Not named</th><th class="n">Adults</th></tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td class="${i ? 'n' : ''}">${esc(String(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn sm" href="#/groups?s=${k}&m=${a.slice(0, 7)}">Open the list</a>${add}</div></section>`;
}
