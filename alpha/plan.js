
/* ================= Monthly plan of home visits, Luigi family steps, "where to go" by centre ================= */
function plans() { if (!S.plans) S.plans = []; return S.plans; }
function familyKnown(c) { const v = String(c.familyAddress || '').trim(); return !!v && !/^(unknown|not known|\?+)$/i.test(v); }
/* who does the visit: each section plans and records its own */
/* Nkwazi and Minsundu educators do not visit on their own: home visits to their children go through the Family Section */
const VISIT_TEAMS = [['Family', 'Family Section'], ['School', 'School Section'], ['Luigi', 'Others: Luigi educators'], ['Counseling', 'Others: counsellor'], ['Other', 'Others: another educator']];
function tmatch(t, team) { return team === 'all' || t === team || (team === 'Others' && t !== 'Family' && t !== 'School'); }
/* Family Section and School Section do not follow the children of Luigi: those visits belong to Others */
function noLuigi(team) { return team === 'Family' || team === 'School'; }
function vcIn(c, team, centre) { const k = c ? centreOf(c) : ''; return centre && centre !== 'all' ? k === centre : !(noLuigi(team) && k === 'Luigi'); }
const TEAM_KEYS = VISIT_TEAMS.map(x => x[0]);
const CENTRE_COLOR = { Luigi: SECTIONS.Luigi.color, Minsundu: SECTIONS.UCC.color, Nkwazi: SECTIONS.Nkwazi.color };
const CENTRE_LABEL = { Luigi: 'Luigi', Minsundu: 'Minsundu', Nkwazi: 'Nkwazi Centre', School: 'Community school', Literacy: 'Literacy class' };
function teamLabel(k) { const t = VISIT_TEAMS.find(x => x[0] === k); return t ? t[1] : (k || ''); }
function myTeam() { const a = USER ? staffAreas(USER) : []; return ['Family', 'School', 'Counseling', 'Luigi'].find(k => a.includes(k)) || ''; }
function myCentre() { const a = USER ? staffAreas(USER) : [], c = CENTRES.filter(k => a.includes(k)); return c.length === 1 && !a.includes('Admin') && !a.includes('Sports') ? c[0] : ''; }
function teamFor(c) { return myTeam() || (c && c.section === 'Luigi' ? 'Luigi' : 'Family'); }
function visitTeam(v) { if (TEAM_KEYS.includes(v.team)) return v.team; if (v.purpose === 'School visit') return 'School'; const c = child(v.childId); return c && c.section === 'Luigi' ? 'Luigi' : 'Family'; }
function planTeam(p) { if (TEAM_KEYS.includes(p.team)) return p.team; const c = child(p.childId); return c && c.section === 'Luigi' ? 'Luigi' : 'Family'; }
const CENTRE_INK = { Luigi: SECTIONS.Luigi.ink, Minsundu: SECTIONS.UCC.ink, Nkwazi: SECTIONS.Nkwazi.ink };
function centreChip(c) { const k = centreOf(c); return k ? `<span class="cchip" style="background:${CENTRE_INK[k]}">${esc(k)}</span>` : ''; }
/* the two choices on the Visits page: section doing the visits, centre of the child */
function visitSel(q) {
  const mt = myTeam(), t = q.get('vt') || (mt === 'Family' || mt === 'School' ? mt : mt ? 'Others' : 'Family');
  const c = q.get('vc') || (t === 'Luigi' || (t === 'Others' && mt === 'Luigi') ? 'Luigi' : (!mt && myCentre()) || 'all');
  const team = TEAM_KEYS.includes(t) || t === 'Others' ? t : mt === 'Family' || mt === 'School' ? mt : 'Family'; /* "all sections" is no longer a choice: an old link with vt=all opens the section of the person */
  return { team, centre: CENTRES.includes(c) && !(noLuigi(team) && c === 'Luigi') ? c : 'all' };
}
function planFor(m, team, centre) { return plans().filter(p => p.month === m && child(p.childId) && (!team || tmatch(planTeam(p), team)) && vcIn(child(p.childId), team, centre)); }
function planOf(c) { return plans().filter(p => String(p.childId) === String(c.id)).sort((a, b) => a.month.localeCompare(b.month)); }
function planStatus(p) {
  const school = planTeam(p) === 'School';
  const vs = S.visits.filter(v => String(v.childId) === String(p.childId) && (v.date || '').slice(0, 7) === p.month && (v.purpose === 'School visit') === school).sort((a, b) => b.date.localeCompare(a.date));
  const ok = vs.find(v => v.successful !== 'No');
  return ok ? { k: 'done', v: ok } : vs.length ? { k: 'tried', v: vs[0] } : { k: 'planned' };
}
function planPurpose(c) { return c.status === 'Follow-up' ? 'Follow-up' : !familyKnown(c) ? 'Family tracing' : lastHomeVisit(c) ? 'Follow-up' : 'Assessment'; }
function addPlan(id, month, team) {
  const c = child(id); if (!c) return false;
  team = TEAM_KEYS.includes(team) ? team : (team === 'Others' ? (c.section === 'Luigi' ? 'Luigi' : (['Luigi', 'Counseling'].includes(myTeam()) ? myTeam() : 'Other')) : teamFor(c));
  if (plans().some(p => String(p.childId) === String(id) && p.month === month && planTeam(p) === team)) return false;
  plans().push({ id: uid('p'), childId: String(id), month, team, purpose: team === 'School' ? 'School visit' : planPurpose(c), createdBy: USER ? USER.id : '', createdAt: today() }); return true;
}
/* from the 20th the planning is for the next month */
function planMonth() { return Number(today().slice(8)) >= 20 ? addMonths(thisMonth(), 1) : thisMonth(); }
function shortMonth(m) { return new Date(m + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'short' }); }
function planBtn(c, m, team) {
  m = m || planMonth(); team = team || teamFor(c);
  const p = plans().find(x => String(x.childId) === String(c.id) && x.month >= thisMonth() && planTeam(x) === team);
  return p ? `<span class="chip c-blue">Planned ${esc(shortMonth(p.month))}</span>` : `<button class="btn sm" data-pact="plan" data-id="${esc(c.id)}" data-m="${m}" data-team="${team}">Plan for ${esc(shortMonth(m))}</button>`;
}

/* ---------- Luigi: from "family not known" to the first home visit ---------- */
function luigiSteps() {
  const kids = S.children.filter(c => c.section === 'Luigi' && isCurrent(c));
  const byNew = (a, b) => (b.entryDate || b.createdAt || '').localeCompare(a.entryDate || a.createdAt || '');
  const noFamily = kids.filter(c => !familyKnown(c)).sort(byNew);
  const toVisit = kids.filter(c => familyKnown(c) && !lastHomeVisit(c)).sort(byNew);
  return { kids, noFamily, toVisit, visited: kids.filter(c => lastHomeVisit(c)) };
}
function luigiStepsCard(r) {
  const L = luigiSteps(); if (!L.kids.length) return '';
  const all = r.q.get('lall') === '1', LIM = 6, m = planMonth();
  const row = (c, right) => `<div class="it">${avatar(c, 34)}<div class="w"><b>${childLink(c)}</b><span>${curAge(c) !== '' ? curAge(c) + ' years · ' : ''}${c.sex || ''}${c.streetCat ? ' · ' + c.streetCat : ''}${c.entryDate ? ' · first met ' + esc(fmtDate(c.entryDate)) : ''}${familyKnown(c) ? ' · family in ' + esc(c.familyAddress) : c.compound ? ' · from ' + esc(c.compound) : ''}</span></div>${right}</div>`;
  const planned = L.toVisit.filter(c => plans().some(p => String(p.childId) === String(c.id) && p.month >= thisMonth() && planTeam(p) === 'Luigi')).length;
  return `<section class="card" id="luigi" style="grid-column:1/-1"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h2>Luigi · family and first home visit</h2><a href="#" data-q="lall=${all ? '' : '1'}" class="sub">${all ? 'Show fewer' : 'Show all'}</a></div>
    <p class="sub" style="margin:2px 0 10px">Three steps: find the family, plan the first visit, monthly plan. ${L.visited.length} of ${L.kids.length} children in town already have a home visit recorded.</p>
    <div class="grid g2" style="align-items:start">
      <div><p class="sec">1 · We still do not know where the family is · ${L.noFamily.length}</p>
        ${L.noFamily.length ? (all ? L.noFamily : L.noFamily.slice(0, LIM)).map(c => row(c, `<a class="btn sm" href="#/child/${esc(c.id)}/edit">Add family details</a>`)).join('') : '<p class="empty">Family known for every child.</p>'}</div>
      <div><p class="sec">2 · Family known: plan a home visit · ${L.toVisit.length}${planned ? ' (' + planned + ' planned)' : ''}</p>
        ${L.toVisit.length ? (all ? L.toVisit : L.toVisit.slice(0, LIM)).map(c => row(c, planBtn(c, m, 'Luigi'))).join('') : '<p class="empty">No first visit to plan.</p>'}
        ${L.toVisit.length ? `<div style="margin-top:8px"><a class="btn sm" href="#/visits?m=${m}&vt=Luigi&vtab=plan">Open the Luigi plan of ${esc(fmtMonth(m))}</a></div>` : ''}</div>
    </div></section>`;
}

/* ---------- the plan on the Visits page ---------- */
function visitChooser(q, m) {
  const { team, centre } = visitSel(q);
  const nPlan = k => planFor(m, team, k).length;
  const tBtn = (k, l) => `<a href="#" data-q="vt=${k}&vc=" class="tbtn keyh${team === k ? ' on' : ''}"${team === k ? ' aria-current="true"' : ''}>${secDisc(k)}${esc(l)}</a>`;
  const cBtn = (k, l, col) => `<a href="#" data-q="vc=${k}" class="cbtn${centre === k ? ' on' : ''}" style="--c:${col}"><b>${esc(l)}</b><span>${nPlan(k)} in the plan</span></a>`;
  return `<details class="card vchoose" id="vchoose"${isPhone() ? '' : ' open'}>
    <summary><span class="vnow">You are looking at: <b>${esc(team === 'all' ? 'all sections' : team === 'Others' ? 'Others' : teamLabel(team))}</b> · <b>${esc(centre === 'all' ? 'children of all centres' : 'children of ' + CENTRE_LABEL[centre])}</b></span><span class="btn sm vchg">Change</span></summary>
    <div><p class="vq">1 · Who does the visits?</p><div class="tbtns" role="group" aria-label="Who does the visits">${tBtn('Family', 'Family Section')}${tBtn('School', 'School Section')}<a href="#" data-q="vt=Others&vc=" class="tbtn${team !== 'Family' && team !== 'School' ? ' on' : ''}">Others</a></div></div>
    <div><p class="vq">2 · Children of which centre?</p><div class="cbtns" role="group" aria-label="Centre of the child">${['Luigi', 'Minsundu', 'Nkwazi'].filter(k => !(noLuigi(team) && k === 'Luigi')).map(k => cBtn(k, CENTRE_LABEL[k], CENTRE_COLOR[k])).join('')}${cBtn('all', 'All centres', '#73726E')}</div></div>
  </details>`;
}
/* ---------- planner: the children as faces, longest without a visit first; a tap puts in or takes out of the plan ---------- */
function planPlace(c) { return titleCase((c.familyAddress || c.compound || 'No address').split(/[,#\d(]/)[0].trim()) || 'No address'; }
function agoText(d) { if (!d) return 'never visited'; const n = daysBetween(d, today()); return n < 14 ? n + (n === 1 ? ' day ago' : ' days ago') : n < 60 ? Math.round(n / 7) + ' weeks ago' : Math.round(n / 30) + ' months ago'; }
function lastSchoolVisit(c) { let last = ''; for (const v of visitsOf(c.id)) if (v.purpose === 'School visit' && v.successful !== 'No' && v.date > last) last = v.date; return last; }
function planPool(team, centre) {
  const school = team === 'School';
  const act = new Set(S.visits.filter(v => v.action && !v.actionDone && tmatch(visitTeam(v), team)).map(v => String(v.childId)));
  /* a child referred to this section by a colleague is in the list even when the usual rule would leave it out */
  const ref = new Map(); for (const e of referFor(team, centre)) if (!ref.has(String(e.childId))) ref.set(String(e.childId), e);
  const kids = S.children.filter(c => ref.has(String(c.id)) || (vcIn(c, team, centre) && (school ? FAMILY_SECTIONS.includes(c.section) && isCurrent(c) && dayType(c) && dayType(c) !== 'Not in school' : team === 'Family' ? needsVisits(c) : needsVisits(c) || (c.section === 'Luigi' && isCurrent(c)))));
  return kids.map(c => {
    const vi = !school && needsVisits(c) ? visitInfo(c) : null, last = school ? lastSchoolVisit(c) : vi ? vi.last : lastHomeVisit(c);
    return { c, last, never: !last, late: !!(vi && !vi.never && vi.late >= 0), follow: c.status === 'Follow-up', action: act.has(String(c.id)), refer: ref.get(String(c.id)) || null };
  }).sort((a, b) => (b.refer ? 1 : 0) - (a.refer ? 1 : 0) || (a.last || '').localeCompare(b.last || '') || (a.c.entryDate || '').localeCompare(b.c.entryDate || '') || fullName(a.c).localeCompare(fullName(b.c)));
}
const PLAN_F = [['', 'All', () => true], ['refer', 'Referred', x => !!x.refer], ['late', 'Late', x => x.late], ['never', 'Never visited', x => x.never], ['follow', 'Follow-up', x => x.follow], ['action', 'Action open', x => x.action]];
function planGrid(m, team, centre) {
  const q = route().q, term = (UI.planq || '').trim().toLowerCase();
  const pool = planPool(team, term ? 'all' : centre), pf = PLAN_F.some(f => f[0] === q.get('pf')) ? q.get('pf') : '';
  const cmp = q.get('pcmp') || '';
  /* a name typed in the box looks in every centre and ignores the other filters */
  const list = term ? pool.filter(x => [x.c.id, x.c.name, x.c.surname, x.c.nickname, fullName(x.c)].join(' ').toLowerCase().includes(term)).sort((x, y) => fullName(x.c).localeCompare(fullName(y.c)))
    : pool.filter(x => !cmp || planPlace(x.c) === cmp).filter(PLAN_F.find(f => f[0] === pf)[2]);
  const LIM = term ? 48 : isPhone() ? 12 : 24, all = q.get('pall') === '1', shown = all ? list : list.slice(0, LIM);
  const mine = id => plans().find(p => String(p.childId) === String(id) && p.month === m && tmatch(planTeam(p), team));
  const tile = x => { const p = mine(x.c.id), st = p ? planStatus(p).k : '';
    return `<button class="ptile${p ? ' in' : ''}${st && st !== 'planned' ? ' done' : ''}${x.refer ? ' refer' : x.late ? ' late' : x.never ? ' never' : ''}" data-pact="ptoggle" data-id="${esc(x.c.id)}" data-m="${m}" data-team="${team}" aria-pressed="${p ? 'true' : 'false'}">${avatar(x.c, 56)}<b>${esc(fullName(x.c))}</b>${x.refer ? `<small class="rf">${esc(referLabel(x.refer.from) || 'A colleague')}: ${esc(x.refer.reason || 'referred')}</small>` : ''}<small>${esc(agoText(x.last))}${centre === 'all' || term ? ' · ' + esc(centreOf(x.c)) : ''}</small>${p ? '<i aria-hidden="true">✓</i>' : ''}</button>`; };
  return `${shown.length ? `<div class="pgrid">${shown.map(tile).join('')}</div>` : `<p class="empty">${term ? 'No child with this name.' : 'No child here.'}</p>`}
    ${!term && list.length > LIM ? `<div style="margin-top:8px"><a href="#" class="btn sm" data-q="pall=${all ? '' : '1'}">${all ? 'Show fewer' : 'Show all ' + list.length}</a></div>` : ''}`;
}
function planPicker(m, team, centre) {
  const q = route().q, pool = planPool(team, centre), pf = PLAN_F.some(f => f[0] === q.get('pf')) ? q.get('pf') : '';
  const places = {}; for (const x of pool) places[planPlace(x.c)] = (places[planPlace(x.c)] || 0) + 1;
  const cmp = places[q.get('pcmp')] ? q.get('pcmp') : '';
  const base = pool.filter(x => !cmp || planPlace(x.c) === cmp);
  const centres = ['Luigi', 'Minsundu', 'Nkwazi'].filter(k => !(noLuigi(team) && k === 'Luigi'));
  const sch = team === 'School', inPl = new Set(planFor(m, 'School', 'all').map(p => String(p.childId))), bySch = {}; if (sch) for (const x of pool) { const k = schoolOf(x.c); (bySch[k] = bySch[k] || []).push(x); }
  const sTile = ([k, l]) => { const nIn = l.filter(x => inPl.has(String(x.c.id))).length, last = l.map(x => x.last || '').sort().pop(); return `<button type="button" class="scard${nIn === l.length ? ' on' : ''}" data-pact="pschool" data-school="${esc(k)}" data-m="${m}" data-centre="${centre}" aria-pressed="${nIn === l.length}"><b>${esc(k)}</b><span>${l.length} ${l.length === 1 ? 'pupil' : 'pupils'} · ${last ? 'last visit ' + esc(fmtDate(last)) : 'never visited'}</span>${nIn === l.length ? '<span class="chip c-blue">✓ In the plan</span>' : nIn ? `<span class="chip">${nIn} of ${l.length} in the plan</span>` : ''}</button>`; };
  const schools = sch ? `<p class="vq" style="margin:0 0 2px">Schools</p><p class="sub" style="margin:0 0 8px">Tap a school: all its pupils in the plan. Tap again: out.</p><div class="sgrid">${Object.entries(bySch).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(sTile).join('') || '<p class="empty">No pupil with a school written.</p>'}</div><details id="psingle" class="psingle"${UI.psingle || UI.planq ? ' open' : ''}><summary>Choose single pupils</summary>` : '';
  return `<div class="ppick" id="ppick" data-m="${m}" data-team="${team}" data-centre="${centre}">
    <input class="in qsearch" id="plansearch" type="search" autocomplete="off" placeholder="Type a name" aria-label="Find a child by name" value="${esc(UI.planq || '')}" style="margin-bottom:8px">${schools}
    <div class="pfil"><div class="seg" role="group" aria-label="Centre">${centres.map(k => `<a href="#" data-q="vc=${k}&pcmp=&pall=" class="${centre === k ? 'on' : ''}">${esc(CENTRE_LABEL[k])}</a>`).join('')}<a href="#" data-q="vc=all&pcmp=&pall=" class="${centre === 'all' ? 'on' : ''}">All centres</a></div>
      <div class="seg" role="group" aria-label="Which children">${PLAN_F.filter(([k, l, f]) => !k || k === pf || base.some(f)).map(([k, l, f]) => `<a href="#" data-q="pf=${k}&pall=" class="${pf === k ? 'on' : ''}">${l} · ${base.filter(f).length}</a>`).join('')}</div>
      <select class="in" data-filter="pcmp" aria-label="Compound" style="width:auto">${opt(Object.entries(places).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ v: k, l: k + ' · ' + n })), cmp, 'All compounds')}</select></div>
    <p class="sub" style="margin:8px 0 0">Longest without a visit first. Tap a face: in the plan. Tap again: out. Purple ring: referred by a colleague. Red ring: late. Orange ring: never visited.</p>
    <div id="pgridbox">${planGrid(m, team, centre)}</div>${sch ? '</details>' : ''}
  </div>`;
}
document.addEventListener('toggle', e => { if (e.target && e.target.id === 'psingle') UI.psingle = e.target.open; }, true);
document.addEventListener('input', e => { if (e.target.id !== 'plansearch') return; UI.planq = e.target.value; { const ps = document.getElementById('psingle'); if (ps && e.target.value) ps.open = true; } const box = document.getElementById('pgridbox'), pp = document.getElementById('ppick'); if (box && pp) box.innerHTML = planGrid(pp.dataset.m, pp.dataset.team, pp.dataset.centre); });
function planCard(m, team, centre) {
  team = team || 'all'; centre = centre || 'all';
  const list = planFor(m, team, centre).map(p => ({ p, c: child(p.childId), st: planStatus(p) }));
  const n = k => list.filter(x => x.st.k === k).length;
  const place = planPlace;
  const P = pendingData(), due = (team === 'all' || team === 'Family') ? P.due.filter(x => vcIn(x.c, 'Family', centre) && !plans().some(p => String(p.childId) === String(x.c.id) && p.month === m && planTeam(p) === 'Family')) : [];
  const chipOf = st => st.k === 'done' ? `<span class="chip c-green">Done ${esc(fmtDate(st.v.date))}</span>` : st.k === 'tried' ? `<span class="chip c-orange">Tried ${esc(fmtDate(st.v.date))}, nobody found</span>` : '<span class="chip">To do</span>';
  const past = m < thisMonth();
  const row = ({ p, c, st }) => `<div class="it">${avatar(c, 34)}<div class="w"><b>${childLink(c)}</b><span>${team === 'all' ? '<em class="tm">' + esc(teamLabel(planTeam(p))) + '</em> · ' : ''}${esc(SECTIONS[c.section].label)} · ${team === 'School' ? esc(gradeLabel(c.grade) || 'class not written') : esc(p.purpose) + (c.familyAddress ? ' · ' + esc(c.familyAddress) : '') + (c.guardianName ? ' · ' + esc(c.guardianName) : '') + (c.contact ? ' · ' + esc(c.contact) : '')}</span></div>${chipOf(st)}${st.k !== 'done' ? (team === 'School' ? `<a class="btn sm" href="#/visit/new?child=${esc(c.id)}&t=School&back=sv">Fill the form</a>` : `<a class="btn sm" href="#/visit/new?child=${esc(c.id)}&t=${planTeam(p)}">Record a visit</a>`) : ''}${st.k === 'planned' ? `<button class="btn sm" data-pact="unplan" data-id="${esc(p.id)}" aria-label="Remove ${esc(fullName(c))} from the plan">Remove</button>` : ''}</div>`;
  const block = k => { const l = list.filter(x => centreOf(x.c) === k); if (!l.length) return centre === k ? '' : '';
    const groups = {}; for (const x of l) (groups[place(x.c)] = groups[place(x.c)] || []).push(x);
    return `<div class="cgrp" style="--c:${CENTRE_COLOR[k]}"><b>${esc(CENTRE_LABEL[k])}</b><span>${l.length} ${l.length === 1 ? 'child' : 'children'} · ${l.filter(x => x.st.k === 'done').length} done</span></div>` + Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([g, gl]) => `<div class="grp">${esc(g)} · ${gl.length}</div>` + gl.map(row).join('')).join(''); };
  const sG = {}; if (team === 'School') for (const x of list) (sG[schoolOf(x.c)] = sG[schoolOf(x.c)] || []).push(x);
  const sBlock = () => Object.entries(sG).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(([k, gl]) => { const dn = gl.filter(x => x.st.k === 'done').length, pl = gl.filter(x => x.st.k === 'planned').length;
    return `<details class="pschool"><summary><span class="w"><b>${esc(k)}</b><span class="sub">${gl.length} ${gl.length === 1 ? 'pupil' : 'pupils'} · ${dn} seen</span></span>${dn === gl.length ? '<span class="chip c-green">Done</span>' : `<a class="btn sm pri" href="#/schoolvisit?sn=${encodeURIComponent(k)}">Record the visit</a>`}${pl && !past ? `<button class="btn sm" data-pact="unplanschool" data-school="${esc(k)}" data-m="${m}" aria-label="Remove ${esc(k)} from the plan">Remove</button>` : ''}</summary>${gl.map(row).join('')}</details>`; }).join('');
  const who = (team === 'all' ? '' : teamLabel(team) + ' · ') + (centre === 'all' ? '' : 'children of ' + CENTRE_LABEL[centre] + ' · ');
  return `<section class="card" id="plan"${centre !== 'all' ? ` style="border-top:4px solid ${CENTRE_COLOR[centre]}"` : ''}>
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start"><div><h2>Plan of visits · ${esc(who)}${esc(fmtMonth(m))}</h2>
      <p class="sub" style="margin:2px 0 0">${team === 'School' ? (list.length ? `${Object.keys(sG).length} ${Object.keys(sG).length === 1 ? 'school' : 'schools'}, ${list.length} ${list.length === 1 ? 'pupil' : 'pupils'} planned: ${n('done')} seen, ${list.length - n('done')} to see.` : 'No school planned yet.') : (list.length ? `${list.length} ${list.length === 1 ? 'child' : 'children'} planned: ${n('done')} done, ${n('tried')} tried, ${n('planned')} to do.` : 'Nobody planned yet.') + ' A recorded visit ticks the child off.'}</p></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-pact="xlplan" data-m="${m}" data-team="${team}" data-centre="${centre}">Export in Excel</button></div></div>
    ${past ? '' : planPicker(m, team, centre)}
    ${list.length && !past ? '<p class="sec" style="margin:18px 0 0">In the plan · ' + (team === 'School' ? Object.keys(sG).length + (Object.keys(sG).length === 1 ? ' school · ' : ' schools · ') + list.length + ' pupils' : list.length) + '</p>' : ''}
    ${team === 'School' ? sBlock() : CENTRES.map(block).join('')}
    ${past ? '' : `<div style="margin-top:14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end">
      <label class="f">Add a child${centre === 'all' ? '' : ' of ' + esc(CENTRE_LABEL[centre])} to ${team === 'all' ? 'the plan' : 'the plan of ' + esc(teamLabel(team))}<input class="in" id="planq" data-m="${m}" data-team="${team}" data-centre="${centre}" placeholder="Name, nickname or ID" autocomplete="off"></label>
      ${due.length ? `<button class="btn" data-pact="plandue" data-m="${m}" data-centre="${centre}">Add the ${due.length} overdue home visits${centre === 'all' ? '' : ' of ' + esc(CENTRE_LABEL[centre])}</button>` : '<span></span>'}
    </div><div id="planbox" style="margin-top:6px"></div>`}
  </section>`;
}
function planSearchHtml(text, m, team, centre) {
  team = team || 'all'; centre = centre || 'all';
  const list = knownMatches(text) || (/^[lL]?\d{3,}$/.test(String(text).trim()) ? S.children.filter(c => String(c.id).toLowerCase() === String(text).trim().toLowerCase()) : null);
  if (list == null) return '';
  const all = list.filter(c => c.status !== 'Closed'), open = all.filter(c => centre === 'all' || centreOf(c) === centre), other = all.length - open.length;
  const more = other ? `<p class="sub" style="margin:6px 0 0">${other} more with this name in other centres. Choose "All centres" above to see them.</p>` : '';
  if (!open.length) return `<p class="empty">No child with an open file matches${centre === 'all' ? '' : ' in ' + esc(CENTRE_LABEL[centre])}.</p>` + more;
  return open.map(c => { const vi = visitInfo(c), t = team === 'all' || team === 'Others' ? teamFor(c) : team; return `<div class="it">${avatar(c, 34)}<div class="w"><b>${childLink(c)}</b><span>${centreChip(c)} ID ${esc(c.id)} · ${esc(SECTIONS[c.section].label)}${familyKnown(c) ? ' · family in ' + esc(c.familyAddress) : ' · family not known yet'} · ${vi.last ? 'last home visit ' + esc(fmtDate(vi.last)) : 'no home visit recorded'}</span></div>${plans().some(p => String(p.childId) === String(c.id) && p.month === m && planTeam(p) === t) ? '<span class="chip c-blue">In this plan</span>' : `<button class="btn sm pri" data-pact="plan" data-id="${esc(c.id)}" data-m="${m}" data-team="${t}">Add to the plan of ${esc(teamLabel(t))}</button>`}</div>`; }).join('') + more;
}
function planProfileHtml(c) {
  if (c.status === 'Closed') return '';
  const mine = planOf(c).filter(x => x.month >= thisMonth() && planStatus(x).k !== 'done');
  if (!mine.length) return '';
  return `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #EFEFED">
    ${mine.map(x => { const st = planStatus(x); return `<div class="row"><span>In the plan of ${esc(fmtMonth(x.month))} · ${esc(teamLabel(planTeam(x)))}</span><b>${st.k === 'tried' ? 'tried, nobody found' : 'to do'}</b></div>`; }).join('')}</div>`;
}
function luigiVisitLine(c) {
  if (c.section !== 'Luigi') return '';
  const last = lastHomeVisit(c);
  if (last) return `<div class="row"><span>Last home visit</span><b>${esc(fmtDate(last))}</b></div>`;
  return familyKnown(c) ? `<div class="row"><span>Family in ${esc(c.familyAddress)}</span><b>no home visit yet</b></div>` : `<div class="row"><span>Where the family is</span><b>not known yet <a class="btn sm" href="#/child/${esc(c.id)}/edit">Add it</a></b></div>`;
}
function planReminder() {
  const next = addMonths(thisMonth(), 1);
  const t = myTeam();
  if (Number(today().slice(8)) < 20 || planFor(next, t || 'all').length) return '';
  return `<div class="warn" style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span>The plan of visits${t ? ' of ' + esc(teamLabel(t)) : ''} for <b>${esc(fmtMonth(next))}</b> is not made yet.</span><a class="btn" href="#/visits?vtab=plan&m=${next}">Make the plan</a></div>`;
}

/* ---------- where to go, by centre ---------- */
function myBoxes() { const a = staffAreas(USER); if (a.includes('Admin') || a.includes('Sports')) return ['Luigi', 'Minsundu', 'Nkwazi', 'All']; const out = []; for (const k of ['Luigi', 'Minsundu', 'Nkwazi']) if (a.includes(k)) out.push(k); if (['Family', 'School', 'Counseling'].some(k => a.includes(k))) out.unshift('All'); return out; }
function defCentre() { return ['Minsundu', 'Nkwazi', 'Luigi'].find(k => hasFlag(k)) || 'Minsundu'; }
function defReport() { const m = mainFlag(USER); return ['Family', 'School', 'Counseling', 'Luigi', 'Nkwazi'].includes(m) ? m : m === 'Minsundu' ? 'UCC' : 'Family'; }
function centreGuide(full) {
  const lm = planMonth();
  const G = [
    { k: 'Luigi', title: 'Luigi Drop-in', sub: 'Street outreach and drop-in', color: SECTIONS.Luigi.color, links: [['Attendance', '#/attendance?c=Luigi'], ['Children', '#/children?section=Luigi'], ['Admissions and discharges', '#/paths?ps=Luigi'], ['Monitoring', '#/visits?vt=Luigi&vtab=need'], ['New face? Check', '#/attendance?c=Luigi&go=knownq'], ['Reports', '#/reports?s=Luigi']] },
    { k: 'Minsundu', title: 'Minsundu', sub: 'UCC and Youth', color: SECTIONS.UCC.color, links: [['Attendance: UCC', '#/attendance?c=Minsundu&g=UCC'], ['Attendance: Youth', '#/attendance?c=Minsundu&g=Youth'], ['Attendance: non-residents', '#/attendance?c=Minsundu&g=Non-resident'], ['Attendance: literacy class', '#/attendance?c=Literacy'], ['Monthly reports', '#/monthly'], ['Children', '#/children?section=Minsundu'], ['Admissions and discharges', '#/paths?ps=Minsundu'], ['Monitoring', '#/visits?vt=Family&vc=Minsundu'], ['Absences to check', '#/attendance?c=Minsundu&go=attcheck'], ['Reports', '#/reports?s=' + ('UCC')]] },
    { k: 'Nkwazi', title: 'Nkwazi', sub: 'Centre register and community school', color: SECTIONS.Nkwazi.color, links: [['Attendance: centre', '#/attendance?c=Nkwazi'], ['Attendance: community school', '#/attendance?c=School'], ['Children', '#/children?section=Nkwazi'], ['Admissions and discharges', '#/paths?ps=Nkwazi'], ['Monitoring', '#/visits?vt=Family&vc=Nkwazi'], ['Absences to check', '#/attendance?c=Nkwazi&go=attcheck'], ['Reports', '#/reports?s=Nkwazi']] },
    { k: 'All', title: 'Family, School, Counselling', sub: 'Sections working in all centres', color: '#73726E', links: [[mainFlag(USER) === 'Counseling' ? 'Record a counselling session' : 'Record a home or school visit', mainFlag(USER) === 'Counseling' ? '#/counseling' : '#/visit/new'], ['Monitoring', '#/visits?vtab=need'], ['Plan of visits · ' + fmtMonth(lm), '#/visits?vtab=plan&m=' + lm], ['Pupils by school', '#/school'], ['Referrals', '#/referrals'], ['Counselling', '#/counseling'], ['Reports', '#/reports?s=' + (['Family', 'School', 'Counseling'].includes(mainFlag(USER)) ? mainFlag(USER) : 'Family')]] }
  ];
  /* Home shows only what is done every day. What is in the menu at the bottom (Children, Monitoring) or in More (Reports, Referrals) is not repeated there. The Help page keeps the whole list. */
  const adm = seesOverview(), fsc = [];
  if (adm || hasFlag('Family') || !['School', 'Counseling'].some(k => hasFlag(k))) fsc.push(['Record a home visit', '#/visit/new'], ['Plan of visits · ' + fmtMonth(lm), '#/visits?vt=Family&vtab=plan&m=' + lm]);
  if (adm || hasFlag('School')) fsc.push(['Record a school visit', '#/schoolvisit'], ['Pupils by school', '#/school']);
  if (adm || hasFlag('Counseling')) fsc.push(['Record a counselling session', '#/counseling']);
  if (!adm && mainFlag(USER) === 'Counseling') fsc.push(['Weekly report', '#/reports?s=Counseling&cv=week'], ['Monthly report', '#/reports?s=Counseling&cv=month']);
  const DAILY = { Luigi: [['Attendance', '#/attendance?c=Luigi'], ['New face? Check', '#/attendance?c=Luigi&go=knownq']], Minsundu: [['Attendance', '#/attendance?c=Minsundu'], ['Attendance: literacy class', '#/attendance?c=Literacy'], ['Monthly reports', '#/monthly']], Nkwazi: [['Attendance: centre', '#/attendance?c=Nkwazi'], ['Attendance: community school', '#/attendance?c=School']], All: fsc };
  if (!full) G.forEach(g => { g.links = DAILY[g.k]; });
  let mine = full ? [] : myBoxes();
  if (!full && !adm && mine.length === 4 && ['Family', 'School', 'Counseling'].includes(mainFlag(USER))) mine = ['All'];
  const box = (g, big, own) => `<div class="card guide${own ? ' mine' : ''}" style="border-top:4px solid ${g.color}">
    <div style="display:flex;justify-content:space-between;gap:6px;align-items:flex-start"><h3>${esc(g.title)}</h3>${own ? '<span class="chip c-blue">You work here</span>' : ''}</div><p class="sub" style="margin:2px 0 8px">${esc(g.sub)}</p>
    ${big || !full ? `<div class="gbtns">${g.links.map(([l, h], i) => `<a href="${h}" class="btn${i === 0 && own ? ' pri' : ''}">${esc(l)}</a>`).join('')}</div>` : g.links.map(([l, h], i) => `<a href="${h}" class="${i === 0 ? 'first' : ''}">${esc(l)}</a>`).join('')}</div>`;
  if (mine.length && mine.length < 4) {
    const me = mine.map(k => G.find(g => g.k === k)), rest = G.filter(g => !mine.includes(g.k));
    return `<div id="guide"><p class="sec" style="margin:0 0 8px">Start here</p>${me.length === 1 ? box(me[0], true, true) : `<div class="grid g${me.length}" style="align-items:stretch">${me.map(g => box(g, false, true)).join('')}</div>`}
      <details class="more" style="margin-top:10px"><summary>Other centres and sections</summary><div class="grid g${Math.min(3, rest.length)}" style="align-items:stretch;margin-top:10px">${rest.map(g => box(g, false, false)).join('')}</div></details></div>`;
  }
  return `<div id="guide"><p class="sec" style="margin:0 0 8px">Where to go${full ? ', by centre' : mine.length ? '' : ' · choose your centre'}</p><div class="grid g4" style="align-items:stretch">${G.map(g => box(g, false, false)).join('')}</div>
    ${full || mine.length ? '' : '<p class="sub" style="margin:8px 0 0">An Education admin can set your areas of work on the Admin page: then this page starts with your own centres.</p>'}</div>`;
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pact]'); if (!b) return;
  const act = b.dataset.pact;
  if (act === 'plan') { const c = child(b.dataset.id), tm = b.dataset.team || teamFor(c); if (addPlan(b.dataset.id, b.dataset.m, tm)) { save(); toast(fullName(c) + ' is in the plan of ' + teamLabel(tm) + ' for ' + fmtMonth(b.dataset.m)); } const q = $('#planq'), keep = q ? q.value : ''; render(); const q2 = $('#planq'); if (keep && q2) { q2.value = keep; $('#planbox').innerHTML = planSearchHtml(keep, q2.dataset.m, q2.dataset.team, q2.dataset.centre); } }
  else if (act === 'ptoggle') {
    const c = child(b.dataset.id), tm = b.dataset.team, m = b.dataset.m; if (!c) return;
    const p = plans().find(x => String(x.childId) === String(c.id) && x.month === m && tmatch(planTeam(x), tm));
    if (p && planStatus(p).k !== 'planned') return toast('A visit is already recorded: it stays in the plan');
    if (p) { S.plans = plans().filter(x => x.id !== p.id); syncMeta().rmPlans[p.id] = Date.now(); } else addPlan(c.id, m, tm === 'all' ? teamFor(c) : tm);
    save(); render();
  }
  else if (act === 'pschool' || act === 'unplanschool') {
    const m = b.dataset.m, sn = b.dataset.school, kids = planPool('School', b.dataset.centre || 'all').filter(x => schoolOf(x.c) === sn).map(x => x.c), mine = plans().filter(p => p.month === m && planTeam(p) === 'School' && child(p.childId) && schoolOf(child(p.childId)) === sn);
    const allIn = kids.length && kids.every(c => mine.some(p => String(p.childId) === String(c.id)));
    if (act === 'unplanschool' || allIn) { const out = mine.filter(p => planStatus(p).k === 'planned'); for (const p of out) syncMeta().rmPlans[p.id] = Date.now(); const ids = new Set(out.map(p => p.id)); S.plans = plans().filter(p => !ids.has(p.id)); toast(out.length ? sn + ': out of the plan' : 'Forms already filled: the school stays in the plan'); }
    else { let n = 0; for (const c of kids) if (addPlan(c.id, m, 'School')) n++; toast(sn + ': ' + n + (n === 1 ? ' pupil' : ' pupils') + ' in the plan of ' + fmtMonth(m)); }
    save(); render();
  }
  else if (act === 'unplan') { S.plans = plans().filter(p => p.id !== b.dataset.id); syncMeta().rmPlans[b.dataset.id] = Date.now(); save(); render(); }
  else if (act === 'plandue') { let n = 0; const ce = b.dataset.centre || 'all'; for (const x of pendingData().due) if (vcIn(x.c, 'Family', ce) && addPlan(x.c.id, b.dataset.m, 'Family')) n++; save(); toast(n + ' children added to the plan of the Family Section'); render(); }
  else if (act === 'xlplan') {
    const m = b.dataset.m, tm = b.dataset.team || 'all', ce = b.dataset.centre || 'all', rows = [['Visits by', 'Centre of the child', 'Child ID', 'Name', 'Section', 'Purpose', 'Family address', 'Compound', 'Guardian', 'Contact', 'Status', 'Visit date', 'Visited by']];
    const pl = planFor(m, tm, ce).sort((x, y) => (planTeam(x) + centreOf(child(x.childId))).localeCompare(planTeam(y) + centreOf(child(y.childId))));
    for (const p of pl) { const c = child(p.childId), st = planStatus(p); rows.push([teamLabel(planTeam(p)), centreOf(c), c.id, fullName(c), SECTIONS[c.section].label, p.purpose, c.familyAddress || '', c.compound || '', c.guardianName || '', c.contact || '', st.k === 'done' ? 'Done' : st.k === 'tried' ? 'Tried, nobody found' : 'To do', st.v ? st.v.date : '', st.v ? staffName(st.v.by) : '']); }
    downloadXlsx('plan-of-visits-' + m + (tm === 'all' ? '' : '-' + tm.toLowerCase()) + (ce === 'all' ? '' : '-' + ce.toLowerCase()), [{ name: fmtMonth(m), rows }]);
  }
});
document.addEventListener('input', e => { if (e.target.id === 'planq') { const box = $('#planbox'); if (box) box.innerHTML = planSearchHtml(e.target.value, e.target.dataset.m, e.target.dataset.team, e.target.dataset.centre); } });
function goTarget() { const g = route().q.get('go'); if (!g) return; setTimeout(() => { const el = document.getElementById(g); if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); if (el.focus && /INPUT/.test(el.tagName)) el.focus(); }
  const q = route().q; q.delete('go'); const qs = q.toString(); history.replaceState(null, '', '#/' + location.hash.slice(2).split('?')[0] + (qs ? '?' + qs : '')); }, 60); }
window.addEventListener('hashchange', goTarget);
