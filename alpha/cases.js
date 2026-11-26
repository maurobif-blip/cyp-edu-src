/* ---------- Case studies (beta 1.7, 24/11/2026; Draft until Pippen sends his reports and case studies, Mauro 24/11) ----------
   Pippen (Sports), 24/11: the coaches write a case study of a child, in six parts, the lines of reporting of the Sports Section.
   Stored as an event: type "Case study", childId, section, activity, date, parts. A change is a "Case study changed" event (ref = id): the last one counts.
   Who reads it: the staff who see the health notes of the child, the staff of the section that wrote it, the writer, the Education office. */
const CASE_PARTS = [['background', 'Background of the child', 'Where the child comes from, the family, the situation before CYP.'],
  ['came', 'How the child came to CYP', 'Who brought the child, when, and to which centre.'],
  ['activities', 'Activities that brought the change', 'The sport, the training, the people and the moments that made the difference.'],
  ['achieved', 'What the child achieved', 'Teams, competitions, school, skills, responsibilities.'],
  ['change', 'The change in the child', 'Behaviour, confidence, relations, school, health.'],
  ['outcome', 'Conclusion: the outcome', 'Where the child is now, compared with how the child came.']];
const CASE_SECS = [['Sports', 'Sports'], ['Luigi', 'Luigi'], ['UCC', 'Minsundu · UCC'], ['Youth', 'Minsundu · Youth'], ['Nkwazi', 'Nkwazi Centre'], ['Family', 'Family Section'], ['School', 'School Section'], ['Counseling', 'Counselling']];
function caseAll() { return (S.events || []).filter(e => e.type === 'Case study'); }
function caseMerged(e) { const ch = (S.events || []).filter(x => x.type === 'Case study changed' && x.ref === e.id).sort((a, b) => (a.ts || 0) - (b.ts || 0)).pop(); return ch ? Object.assign({}, e, { parts: ch.parts, activity: ch.activity, date: ch.date || e.date, changedBy: ch.by, changedOn: ch.on }) : e; }
function caseGet(id) { const e = caseAll().find(x => x.id === id); return e ? caseMerged(e) : null; }
function caseSees(e) { const c = child(e.childId); return !!USER && !GUEST && (seesHealth(c) || e.by === USER.id || hasFlag(GRP_AREA_OF[e.section] || e.section)); }
const GRP_AREA_OF = { UCC: 'Minsundu', Youth: 'Minsundu' };
function caseCanChange(e) { return !!USER && !GUEST && (e.by === USER.id || !!USER.admin); }
function caseDefSec() { if (!USER) return 'Sports'; const a = staffAreas(USER); if (a.includes('Sports')) return 'Sports'; for (const k of ['Luigi', 'Nkwazi', 'Family', 'School', 'Counseling']) if (a.includes(k)) return k; return a.includes('Minsundu') ? 'UCC' : 'Sports'; }
const caseSecLabel = k => (CASE_SECS.find(x => x[0] === k) || [k, k])[1];

/* in the file of the child: the case studies, each a row that opens it, and the button to write one */
function caseBox(c) {
  const L = caseAll().filter(e => String(e.childId) === String(c.id) && caseSees(e)).map(caseMerged).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const go = dsIcon('go').replace('cyp-icon', 'cyp-icon cyp-go');
  return `<section class="card" id="casebox"><div class="cardhead"><h2>Case studies <span class="chip c-orange">Draft</span></h2><a class="btn sm" href="#/case/new?child=${esc(c.id)}">Write a case study</a></div>
    ${L.length ? `<div class="cyp-rows" style="margin-top:8px">${L.map(e => `<a class="cyp-row cyp-row--link" href="#/case/${esc(e.id)}">${secDisc(e.section === 'UCC' || e.section === 'Youth' ? (e.section === 'UCC' ? 'UCC Children Section' : 'Youth') : e.section)}<span class="cyp-row__text"><b>${esc(caseSecLabel(e.section))}${e.activity ? ' · ' + esc(e.activity) : ''}</b><span>${esc(fmtDate(e.date))} · by ${esc(staffName(e.by))}</span></span>${go}</a>`).join('')}</div>` : '<p class="sub" style="margin:6px 0 0">No case study yet.</p>'}</section>`;
}

/* the form: six parts, one under the other */
function vCaseForm(r) {
  const edit = r.id && r.id !== 'new' ? caseGet(r.id) : null, cid = edit ? edit.childId : r.q.get('child'), c = child(cid);
  if (!c) return `<h1>Case study</h1><p>Open the file of the child first, then "Write a case study".</p>`;
  if (edit && !caseCanChange(edit)) return `<h1>Case study</h1><p>Only who wrote it, or the Education office, can change it.</p>`;
  const P = edit ? edit.parts || {} : {}, sec = edit ? edit.section : caseDefSec(), acts = typeof actAll === 'function' ? actAll() : [];
  return `<div class="top"><div><h1>${edit ? 'Change the case study' : 'Write a case study'} <span class="chip c-orange">Draft</span></h1><p class="lead">${esc(fullName(c))} · ID ${esc(c.id)}</p></div><a class="btn" href="${edit ? '#/case/' + esc(edit.id) : '#/child/' + esc(c.id)}">Back</a></div>
  <form class="card" data-form="casestudy" style="max-width:720px"><input type="hidden" name="childId" value="${esc(c.id)}"><input type="hidden" name="id" value="${edit ? esc(edit.id) : ''}"><div class="fs two">
    ${edit ? `<input type="hidden" name="section" value="${esc(sec)}">` : field('Section', 'section', sec, 'select', { req: true, options: opt(CASE_SECS.map(([v, l]) => ({ v, l })), sec) })}
    ${field('Activity or sport', 'activity', edit ? edit.activity : (actOf(c)[0] || ''), 'text', { attrs: acts.length ? ' list="caseacts"' : '' })}${acts.length ? `<datalist id="caseacts">${acts.map(a => `<option value="${esc(a)}"></option>`).join('')}</datalist>` : ''}
    ${field('Date', 'date', edit ? edit.date : today(), 'date', { req: true })}</div>
    ${CASE_PARTS.map(([k, l, h], i) => field(`${i + 1}. ${l}`, 'p_' + k, P[k] || '', 'textarea', { wide: true, rows: 5, hint: h })).join('')}
    <button class="btn pri" style="margin-top:12px">Save the case study</button></form>`;
}
FORMS.casestudy = function (o) {
  const parts = {}; for (const [k] of CASE_PARTS) parts[k] = String(o['p_' + k] || '').trim();
  if (!Object.values(parts).some(Boolean)) return toast('Write at least one part');
  if (o.id) { const e = caseGet(o.id); if (!e || !caseCanChange(e)) return toast('Not allowed'); S.events.push({ id: uid('e'), childId: '', type: 'Case study changed', ref: o.id, date: o.date, activity: String(o.activity || '').trim(), parts, ts: Date.now(), by: USER.id, on: today() }); save(); toast('Case study changed'); return go('#/case/' + o.id); }
  const e = { id: uid('e'), childId: String(o.childId), type: 'Case study', section: o.section || 'Sports', activity: String(o.activity || '').trim(), date: o.date, parts, ts: Date.now(), by: USER.id };
  S.events.push(e); save(); toast('Case study saved'); go('#/case/' + e.id);
};

/* one case study, to read, change or download in Word */
function vCase(r) {
  const e = caseGet(r.id); if (!e) return `<h1>Case study</h1><p>Not found. It may have been cancelled.</p>`;
  if (!caseSees(e)) return `<h1>Case study</h1><p>${HIDDEN_TXT}</p>`;
  const c = child(e.childId), P = e.parts || {};
  return `<div class="top"><div><h1>Case study <span class="chip c-orange">Draft</span></h1><p class="lead">${c ? childLink(c) : ''} · ${esc(caseSecLabel(e.section))}${e.activity ? ' · ' + esc(e.activity) : ''} · ${esc(fmtDate(e.date))} · by ${esc(staffName(e.by))}${e.changedBy ? ' · changed by ' + esc(staffName(e.changedBy)) : ''}</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-cs="word" data-id="${esc(e.id)}">Download in Word</button>${caseCanChange(e) ? `<a class="btn" href="#/case/${esc(e.id)}/edit">Change</a>` : ''}${c ? `<a class="btn" href="#/child/${esc(c.id)}">The file of the child</a>` : ''}</div></div>
    <section class="card" style="max-width:720px">${CASE_PARTS.map(([k, l], i) => `<h2 style="margin-top:${i ? 18 : 0}px">${i + 1}. ${esc(l)}</h2><p style="white-space:pre-wrap;margin:4px 0 0">${P[k] ? esc(P[k]) : '<span class="sub">Not written</span>'}</p>`).join('')}</section>
    ${typeof cancelBtn === 'function' && caseCanChange(e) ? `<p>${cancelBtn('event', e)}</p>` : ''}`;
}
function caseDocx(e) {
  const c = child(e.childId), P = e.parts || {};
  const blocks = [{ doc: { title: 'Case study', facts: [['Section', caseSecLabel(e.section)], ['Date', dxDate(e.date)], ['Made by', 'CYP EDU']] } },
    { kv: [['Name of the child', c ? fullName(c) : ''], ['ID', c ? c.id : ''], ['Sex', c ? (c.sex === 'F' ? 'Female' : c.sex === 'M' ? 'Male' : '') : ''], ['Age', c ? ageText(c) : ''], ['Centre', c ? (SECTIONS[c.section] ? SECTIONS[c.section].label : c.section) : ''], ['Activity or sport', e.activity || ''], ['Written by', staffName(e.by)], ['Date', dxDate(e.date)]] }];
  CASE_PARTS.forEach(([k, l], i) => blocks.push({ box: { label: (i + 1) + '. ' + l, t: P[k] || '', lines: 4 } }));
  blocks.push({ sign: [['Written by', staffName(e.by)], ['Head of section', ''], ['Date', '']] });
  docxDownload('Case-study-' + (c ? c.id : 'child') + '-' + e.date, blocks);
}
document.addEventListener('click', ev => { const b = ev.target.closest ? ev.target.closest('[data-cs="word"]') : null; if (!b) return; const e = caseGet(b.dataset.id); if (e && caseSees(e)) caseDocx(e); });

/* all the case studies of a month, by section */
function vCases(r) {
  const q = r.q, m = q.get('m') || thisMonth(), sec = q.get('s') || '', { a, b } = monthCtx(m);
  const L = caseAll().map(caseMerged).filter(e => inRange(e.date, a, b) && (!sec || e.section === sec) && caseSees(e)).sort((x, y) => (y.date || '').localeCompare(x.date || ''));
  const go = dsIcon('go').replace('cyp-icon', 'cyp-icon cyp-go');
  return `<div class="top"><div><h1>Case studies <span class="chip c-orange">Draft</span></h1><p class="lead">Six parts each: background, how the child came, activities, achievements, change, outcome.</p></div>${monthPicker(m)}</div>
  <div class="seg segg" role="group" aria-label="Section"><a href="#" data-q="s=" class="${sec ? '' : 'on'}">All sections</a>${CASE_SECS.map(([k, l]) => `<a href="#" data-q="s=${k}" class="${sec === k ? 'on' : ''}">${esc(l)}</a>`).join('')}</div>
  <section class="card"><h2>${esc(fmtMonth(m))} · ${L.length} ${L.length === 1 ? 'case study' : 'case studies'}</h2>${L.length ? `<div class="cyp-rows">${L.map(e => { const c = child(e.childId); return `<a class="cyp-row cyp-row--link" href="#/case/${esc(e.id)}">${c ? dsAvatar(c) : ''}<span class="cyp-row__text"><b>${c ? esc(fullName(c)) : 'Child'}</b><span>${esc(caseSecLabel(e.section))}${e.activity ? ' · ' + esc(e.activity) : ''} · ${esc(fmtDate(e.date))} · by ${esc(staffName(e.by))}</span></span>${go}</a>`; }).join('')}</div>` : '<p class="empty">No case study in this month. Write one from the file of the child.</p>'}</section>`;
}

/* ---------- Player profile (beta 1.7, Pippen 24/11) ----------
   An openable box in the file of the child: for each sport the child plays, the role, the team or class, the level, strengths, weaknesses, goals.
   Stored as an event "Player profile" (childId, sport, fields): the latest for each sport counts. The fields will follow what Pippen reports. */
const PLAYER_FIELDS = [['role', 'Role or position', 'text'], ['team', 'Team or class', 'text'], ['level', 'Level', 'select'], ['strengths', 'Strengths', 'textarea'], ['weaknesses', 'Weaknesses', 'textarea'], ['goals', 'Goals for the next months', 'textarea'], ['note', 'Notes of the coach', 'textarea']];
const PLAYER_LEVELS = ['Beginner', 'Improving', 'Good', 'Plays in competitions'];
function sportsList() { const g = typeof actGroups === 'function' ? actGroups() : {}; return (g.Sports || ['Football', 'Basketball', 'Golf', 'Tennis']).slice(); }
function playerProfiles(c) { const by = {}; for (const e of (S.events || []).filter(e => e.type === 'Player profile' && String(e.childId) === String(c.id)).sort((a, b) => (a.ts || 0) - (b.ts || 0))) by[e.sport] = e; return by; }
const pdl = rows => `<dl class="dl">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd style="white-space:pre-wrap">${esc(v)}</dd>`).join('')}</dl>`;
function playerBox(c) {
  const P = playerProfiles(c), sports = sportsList().filter(s => actOf(c).includes(s) || P[s]);
  if (!sports.length && !hasFlag('Sports') && !(USER && USER.admin)) return '';
  const can = !!USER && !GUEST && (hasFlag('Sports') || !!USER.admin);
  const one = s => { const e = P[s]; return `<div class="pprof"><div class="cardhead"><h3 class="heading-3" style="margin:0">${refIcon('Sports')} ${esc(s)}</h3>${can ? `<a class="btn sm" href="#/child/${esc(c.id)}/player?sport=${encodeURIComponent(s)}">${e ? 'Change' : 'Write the profile'}</a>` : ''}</div>
    ${e ? pdl(PLAYER_FIELDS.map(([k, l]) => [l, e[k]]).filter(x => x[1])) + `<p class="sub" style="margin:4px 0 0">By ${esc(staffName(e.by))}, ${esc(fmtDate(e.date))}</p>` : '<p class="sub" style="margin:4px 0 0">No profile yet.</p>'}</div>`; };
  return `<details class="card more" id="playerbox"><summary>Player profile <span class="chip c-orange">Draft</span>${sports.length ? ': ' + esc(sports.join(', ')) : ''}</summary><div style="margin-top:8px">
    ${sports.length ? sports.map(one).join('') : '<p class="sub">The child is not enrolled in a sport. Enrol in "Sports and VET training", or choose a sport below.</p>'}
    ${can ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${sportsList().filter(s => !sports.includes(s)).map(s => `<a class="btn sm" href="#/child/${esc(c.id)}/player?sport=${encodeURIComponent(s)}">Add ${esc(s)}</a>`).join('')}</div>` : ''}</div></details>`;
}
function vPlayerForm(c, q) {
  const s = q.get('sport') || sportsList()[0], e = playerProfiles(c)[s] || {};
  if (!(hasFlag('Sports') || (USER && USER.admin))) return `<h1>Player profile</h1><p>Only the Sports Section and the Education office write it.</p>`;
  return `<div class="top"><div><h1>Player profile · ${esc(s)} <span class="chip c-orange">Draft</span></h1><p class="lead">${esc(fullName(c))} · ID ${esc(c.id)}</p></div><a class="btn" href="#/child/${esc(c.id)}">Back</a></div>
  <form class="card" data-form="player" style="max-width:720px"><input type="hidden" name="childId" value="${esc(c.id)}"><input type="hidden" name="sport" value="${esc(s)}"><div class="fs two">
    ${PLAYER_FIELDS.map(([k, l, t]) => t === 'select' ? field(l, k, e[k] || '', 'select', { options: opt(PLAYER_LEVELS, e[k] || '', 'Choose') }) : t === 'textarea' ? field(l, k, e[k] || '', 'textarea', { wide: true, rows: 3 }) : field(l, k, e[k] || '')).join('')}</div>
    <button class="btn pri" style="margin-top:12px">Save the profile</button></form>`;
}
FORMS.player = function (o) {
  const e = { id: uid('e'), childId: String(o.childId), type: 'Player profile', sport: o.sport, date: today(), ts: Date.now(), by: USER.id };
  for (const [k] of PLAYER_FIELDS) e[k] = String(o[k] || '').trim();
  if (!PLAYER_FIELDS.some(([k]) => e[k])) return toast('Write at least one field');
  const c = child(o.childId); if (c && !actOf(c).includes(o.sport)) { c.activities = actOf(c).concat(o.sport); c.updatedAt = today(); }
  S.events.push(e); save(); toast('Profile saved'); go('#/child/' + o.childId);
};
