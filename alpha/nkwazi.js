/* ================= Nkwazi (Phase 3), paths between centres, absences ================= */
const NKZ_SOURCES = ['Luigi Drop-in', 'Minsundu (UCC)', 'Community school recruitment', 'Stakeholder', 'APJ', 'New admission', 'Readmission'];
function gradeNorm(g) {
  g = String(g == null ? '' : g).trim(); if (!g) return '';
  if (/^(ece|baby|recep|nursery|pre)/i.test(g)) return 'ECE';
  const f = /form\s*(\d)/i.exec(g); if (f) return 'Form ' + f[1];
  const y = /^(\d)\s*(st|nd|rd|th)?\s*year$/i.exec(g) || /^year\s*(\d)$/i.exec(g); if (y) return y[1] + (['', 'st', 'nd', 'rd'][y[1]] || 'th') + ' year';
  return g.replace(/\D/g, '');
}
function isSecondary(c) { const g = String(c.grade || ''); return /^Form/.test(g) || Number(g) >= 8; }
function entryText(c) { return c.entryDate ? fmtDate(c.entryDate) : (c.entryYear ? 'in ' + c.entryYear : ''); }

/* ---------- one child, one file: joining two records of the same child ---------- */
function rawChild(id) { id = String(id); return S.children.find(c => String(c.id) === id); }
function mergeChildren(keepId, dropId) {
  keepId = String(keepId); dropId = String(dropId);
  const keep = rawChild(keepId), drop = rawChild(dropId);
  if (!keep || !drop || keep === drop) return false;
  const sw = x => String(x) === dropId ? keepId : x;
  for (const k of Object.keys(drop)) { if (k === 'id' || k === 'sameAs') continue; const e = keep[k] === '' || keep[k] == null || (Array.isArray(keep[k]) && !keep[k].length); if (e && drop[k] !== '' && drop[k] != null) keep[k] = drop[k]; }
  for (const v of S.visits) v.childId = sw(v.childId);
  for (const e of S.events) e.childId = sw(e.childId);
  for (const m of S.moves) m.childId = sw(m.childId);
  for (const s of S.sessions) if (s.children) s.children = uniq(s.children.map(sw).map(String));
  for (const o of S.outreach) if (o.children) o.children = uniq(o.children.map(sw).map(String));
  for (const p of (S.plans || [])) if (p.childId != null) p.childId = sw(p.childId);
  for (const d of Object.keys(S.attendance)) { const day = S.attendance[d]; if (!day) continue; for (const k of Object.keys(day)) if (k === String(dropId) || k.startsWith(dropId + '@')) { const nk = keepId + k.slice(String(dropId).length); if (day[nk] == null) day[nk] = day[k]; delete day[k]; } }
  if (S.photos && S.photos[dropId]) { if (!S.photos[keepId]) S.photos[keepId] = S.photos[dropId]; delete S.photos[dropId]; }
  if (String(keep.sameAs) === dropId) keep.sameAs = '';
  for (const x of S.children) if (x !== keep && String(x.sameAs) === dropId) x.sameAs = keepId;
  S.children.splice(S.children.indexOf(drop), 1);
  S.aliases = S.aliases || {};
  for (const k of Object.keys(S.aliases)) if (S.aliases[k] === dropId) S.aliases[k] = keepId;
  S.aliases[dropId] = keepId;
  return true;
}

/* ---------- import of the Nkwazi register and Data Tool (prepared in the starter pack) ---------- */
function importNkwazi(B) {
  noStamp();
  const out = { added: 0, joined: 0, updated: 0, checks: 0 };
  const lab = B.label || 'Nkwazi files';
  const REG = ['schoolType', 'schoolName', 'grade', 'familyAddress', 'compound', 'guardianName', 'guardianRelation', 'contact', 'familyBackground', 'dob'];
  for (const n of B.children || []) {
    const f = n.f || {}, o = n.out || null;
    let c = S.children.find(x => x.nkzKey === n.key), joined = false;
    const again = !!c;
    if (!c && n.into && child(n.into)) { c = child(n.into); joined = true; }
    let prev = null, other = null;
    if (joined) {
      prev = { section: c.section, status: c.status };
      for (const a of n.alias || []) { const x = rawChild(a); if (x && x !== c) { other = { section: x.section, status: x.status, residence: x.residence, responsible: x.responsible }; mergeChildren(c.id, a); } }
    }
    if (!c) {
      c = { id: n.key, nickname: '', languages: '', father: '', mother: '', otherRelatives: '', responsible: '', programmes: [], support: [], skill: '', educationAtEntry: '', medical: '', disabilities: '', objectives: '', notes: '', reintegrationDate: '', closeDate: '', closeReason: '', residence: 'Non-resident', section: 'Nkwazi', createdAt: B.asOf || today(), importedFrom: lab, sectionToCheck: false };
      for (const k of Object.keys(f)) if (k !== 'admissionNote' && k !== 'educationNote') c[k] = f[k];
      if (f.educationNote) c.notes = f.educationNote;
      if (o) { c.status = 'Closed'; c.closeDate = o.date || ''; c.closeReason = o.kind === 'toUCC' ? 'Moved to another Cicetekelo centre' : o.reason; }
      S.children.push(c); out.added++;
    } else if (again) {
      for (const k of Object.keys(f)) if ((c[k] === '' || c[k] == null) && f[k] !== '' && k !== 'status' && k !== 'admissionNote' && k !== 'educationNote' && !(c.nkzJoined && /^(entryDate|entryYear|referredBy)$/.test(k))) c[k] = f[k];
      out.updated++;
    } else {
      // an existing Luigi or Minsundu file that is the same child: one file, the path keeps both
      for (const k of Object.keys(f)) {
        if (['status', 'admissionNote', 'educationNote', 'entryDate', 'entryYear', 'name', 'surname'].includes(k)) continue;
        const e = c[k] === '' || c[k] == null;
        if (e || (REG.includes(k) && !o && f[k] !== '' && !c.updatedAt)) c[k] = f[k];
      }
      if (f.sex && c.sex !== f.sex && !c.updatedAt) c.sex = f.sex;
      const from = n.fromSection || '';
      n._from = from === prev.section || (other && from === other.section) ? from : '';
      if (!n._from && !o) {
        // the Nkwazi files do not say this child came from the other section: the Nkwazi dates are kept, the other date goes in the note
        if (c.entryDate && c.entryDate !== f.entryDate) n.checks = (n.checks || []).concat('The ' + (SECTIONS[prev.section] || {}).label + ' file gives ' + fmtDate(c.entryDate) + ' as date of entry');
        c.entryDate = f.entryDate || ''; c.entryYear = f.entryYear || '';
        if (f.referredBy) c.referredBy = f.referredBy;
      } else if (!c.entryDate && !c.entryYear && !n._from) { c.entryDate = f.entryDate || ''; c.entryYear = f.entryYear || ''; }
      if (!o) {
        c.section = 'Nkwazi'; c.status = f.status || 'Active'; c.residence = 'Non-resident'; c.closeDate = ''; c.closeReason = '';
        if (/^(UCC|Youth)$/.test(prev.section) && prev.status !== 'Closed') { c.sectionToCheck = true; n.checks = (n.checks || []).concat('Also in the Minsundu tool as ' + String(prev.status).toLowerCase() + ': where is this child followed now, Nkwazi or Minsundu?'); }
        else c.sectionToCheck = false;
      } else if (o.kind === 'toUCC') {
        c.section = other && SECTIONS[other.section] && other.section !== 'Luigi' ? other.section : 'UCC';
        if (other) { c.status = other.status; c.residence = other.residence || c.residence; c.responsible = c.responsible || other.responsible; }
        c.sectionToCheck = true;
      }
      c.importedFrom = (c.importedFrom ? c.importedFrom + ' + ' : '') + lab;
      c.nkzJoined = true; c.nkzFrom = n._from;
      out.joined++;
    }
    c.nkzKey = n.key; if (f.toolNo) c.toolNo = f.toolNo;
    if (f.admissionNote && !c.admissionNote) c.admissionNote = f.admissionNote;
    if (!again && (n.checks || []).length) { c.toCheck = n.checks.slice(); out.checks += n.checks.length; }
    // the path: admission, readmission, way out
    const have = new Set(S.moves.map(m => m.id)), id = String(c.id), adm = f.entryDate || ((n.moves || [])[0] || {}).date || '';
    const put = (i, m) => { const mid = 'nkz-' + n.key + '-' + i; if (!have.has(mid)) S.moves.push(Object.assign({ id: mid, childId: id, by: '', src: 'nkwazi' }, m)); };
    const wasJoined = joined || !!c.nkzJoined, jf = joined ? n._from : c.nkzFrom;
    if (wasJoined && jf) put('in', { type: 'section', from: jf, to: 'Nkwazi', date: adm, note: 'Nkwazi Data Tool: admitted from ' + SECTIONS[jf].label });
    else (n.moves || []).forEach((m, i) => put('m' + i, m));
    if (o) {
      if (o.kind === 'toUCC') { if (wasJoined) put('out', { type: 'section', from: 'Nkwazi', to: c.section, date: o.date || '', note: ['Nkwazi Data Tool: transferred to Minsundu', o.reason, o.note].filter(Boolean).join(' · ') }); else put('out', { type: 'closed', date: o.date || '', reason: 'Moved to another Cicetekelo centre', note: ['To Minsundu', o.reason, o.note].filter(Boolean).join(' · ') }); }
      else if (wasJoined) put('out', { type: 'section', from: 'Nkwazi', to: c.section, out: 'discharged', reason: o.reason, date: o.date || '', note: ['Discharged from Nkwazi: ' + o.reason, o.note].filter(Boolean).join(' · ') });
      else put('out', { type: 'closed', date: o.date || '', reason: o.reason, note: o.note || '' });
    }
    if (n.link && child(n.link) && !c.sameAs && child(n.link) !== c) { c.sameAs = String(child(n.link).id); child(n.link).sameAs = String(c.id); }
  }
  S.meta.nkwazi = B.asOf || today();
  return out;
}

/* ---------- the path of a child through the centres ---------- */
function pathOf(c) {
  const mv = movesOf(c.id), first = mv.find(m => m.type === 'section');
  const start = c.entryDate || (c.entryYear ? c.entryYear + '-01-01' : '');
  let cur = { sec: first ? first.from : c.section, a: start, approx: !c.entryDate && !!c.entryYear, b: '', src: c.referredBy || '', end: '', reason: '' };
  const spans = [cur];
  for (const m of mv) {
    if (m.type === 'admitted') { if (m.to && cur.sec === m.to && (!cur.a || cur.approx)) { cur.a = m.date || cur.a; cur.approx = false; } }
    else if (m.type === 'section') {
      if (!cur.end) { cur.b = m.date || ''; cur.end = m.out === 'discharged' ? 'discharged' : 'moved'; cur.reason = m.reason || ''; cur.to = m.to; }
      cur = { sec: m.to, a: m.date || '', b: '', src: m.out === 'discharged' ? 'Back after ' + ((SECTIONS[m.from] || {}).label || m.from) : (CENTRE_OF_SEC(m.from)), fromSec: m.from, end: '', reason: '', back: m.out === 'discharged' };
      spans.push(cur);
    }
    else if (m.type === 'reintegrated') { if (!cur.end) { cur.b = m.date || ''; cur.end = 'home'; } }
    else if (m.type === 'closed') { if (!cur.end || cur.end === 'home') { if (cur.end !== 'home') cur.b = m.date || ''; cur.closed = m.date || ''; cur.end = cur.end || 'closed'; cur.reason = m.reason || ''; } }
    else if (m.type === 'reopened') { if (cur.end) { cur = { sec: m.section || cur.sec, a: m.date || '', b: '', src: 'Readmission', end: '', reason: '' }; spans.push(cur); } else if (m.date) { cur.firstIn = cur.a; cur.a = m.date; cur.approx = false; cur.src = 'Readmission'; } }
  }
  for (const s of spans) if (s.a && s.end && s.b && s.a > s.b) { s.a = ''; s.approx = false; }
  if (!cur.end) { if (c.status === 'Closed') { cur.end = 'closed'; cur.b = c.closeDate || ''; cur.reason = c.closeReason || ''; } else if (c.status === 'Follow-up') { cur.end = 'home'; cur.b = c.reintegrationDate || ''; } }
  return spans;
}
function CENTRE_OF_SEC(s) { return s === 'UCC' ? 'Minsundu (UCC)' : (SECTIONS[s] || {}).label || s || ''; }
function srcNorm(s) { s = String(s || '').trim(); if (!s) return ''; if (/luigi/i.test(s)) return 'Luigi Drop-in'; if (/youth/i.test(s)) return SECTIONS.Youth.label; if (/minsundu|\bucc\b/i.test(s)) return 'Minsundu (UCC)'; if (/social welfare/i.test(s)) return 'District Social Welfare Office'; if (/communit.*(recom|devel)/i.test(s)) return 'Community'; return s.length > 3 && s === s.toUpperCase() ? titleCase(s) : s; }
function spanDates(s) {
  const f = d => d ? (s.approx && d === s.a ? d.slice(0, 4) : new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })) : '';
  const a = f(s.a), b = s.end ? f(s.b) : 'today';
  return a || s.end ? (a || 'date not known') + (a === b ? '' : ' to ' + (b || 'date not known')) : '';
}
function spanLen(s) { if (!s.a) return ''; const b = s.end ? s.b : today(); if (!b) return ''; const m = Math.round(daysBetween(s.a, b) / 30.4); return m < 1 ? '' : m < 12 ? m + ' months' : (Math.round(m / 12 * 10) / 10) + ' years'; }
const END_LABEL = { home: 'Home with the family', closed: 'File closed', discharged: 'Discharged' };
function pathHtml(c) {
  const sp = pathOf(c); if (!sp.length) return '';
  const t = today(), mon = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '';
  const segs = sp.map(s => { const a = s.a || '', b = s.end ? (s.b || '') : t; return { s, a, b, days: a && b && b >= a ? Math.max(daysBetween(a, b), 1) : 0 }; });
  const tot = segs.reduce((n, x) => n + x.days, 0) || 1, visits = visitsOf(c.id).filter(v => v.successful !== 'No' && v.date).map(v => v.date);
  let rail = '', nv = 0;
  segs.forEach((x, i) => {
    const d = SECTIONS[x.s.sec] || { color: '#73726E' }, prev = segs[i - 1];
    if (prev && prev.b && x.a && x.a > prev.b && prev.s.end !== 'moved') rail += `<span class="gap" style="flex:${Math.max(daysBetween(prev.b, x.a), tot * .03)} 1 0" title="Not in the programme"></span>`;
    const ticks = x.days ? visits.filter(v => v >= x.a && v <= x.b).map(v => { nv++; return `<i style="left:${Math.min(98, Math.max(2, Math.round(daysBetween(x.a, v) / x.days * 100)))}%"></i>`; }).join('') : '';
    rail += `<span class="sg${x.days ? '' : ' unk'}" style="flex:${x.days || tot * .08} 1 0;background-color:${d.color}" title="${esc(CENTRE_OF_SEC(x.s.sec))}">${ticks}</span>`;
  });
  const last = segs[segs.length - 1], open = !last.s.end, firstA = (segs.find(x => x.a) || {}).a || '';
  const rows = sp.map((s, i) => {
    const d = SECTIONS[s.sec] || { color: '#73726E', label: s.sec, phase: '' }, now = i === sp.length - 1 && !s.end;
    const endTxt = s.end && s.end !== 'moved' ? `<span class="chip ${s.end === 'home' ? 'c-green' : ''}">${esc(END_LABEL[s.end])}${s.reason ? ': ' + esc(reasonLabel(s.reason)) : ''}</span>` : '';
    return `<div class="stg"><span class="stdot" style="background:${d.color}"></span><b>${esc(CENTRE_OF_SEC(s.sec))}</b><span class="sub">${esc(spanDates(s))}${spanLen(s) ? ' · ' + spanLen(s) : ''}</span>${s.back ? '<span class="chip c-orange">Came back</span>' : ''}${now ? `<span class="chip ${STATUS_CHIP[c.status] || ''}">${c.status === 'Semi-active' ? 'Here now, semi-active' : 'Here now'}</span>` : ''}${endTxt}${s.end === 'home' && i === sp.length - 1 && c.status === 'Follow-up' ? '<span class="chip c-purple">2-year follow-up</span>' : ''}</div>`;
  }).join('');
  const src = sp[0].src && !(sp[0].sec === 'Luigi' && /luigi/i.test(sp[0].src)) && srcNorm(sp[0].src) !== CENTRE_OF_SEC(sp[0].sec) ? srcNorm(sp[0].src) : '';
  return `<section class="card"><h2>Where this child has been</h2><p class="sub" style="margin:2px 0 10px">${src ? 'Came from: ' + esc(src) + '. ' : ''}</p>
    <div class="rail" role="img" aria-label="${esc(sp.map(s => CENTRE_OF_SEC(s.sec) + ' ' + spanDates(s)).join(', then '))}">${rail}${open ? '<span class="now" title="Today"></span>' : `<span class="stop" style="background:${last.s.end === 'home' ? '#319536' : '#9B9A97'}"></span>`}</div>
    <div class="railx"><span>${esc(mon(firstA) || 'date of entry not known')}</span><span>${open ? 'Today' : esc(mon(last.b) || '')}</span></div>
    <div class="stages">${rows}</div>${nv ? '<p class="sub" style="margin:8px 0 0"><span class="vtick"></span> home or school visit</p>' : ''}</section>`;
}

/* ---------- paths of a whole section: who came in, from where, who left, to where ---------- */
function flowData(sec, a, b) {
  const dayBefore = addDays(a, -1), rows = [], inBy = {}, outBy = {}, here = {};
  let start = 0;
  const add = (o, k) => { o[k] = (o[k] || 0) + 1; };
  for (const c of S.children) {
    const sp = pathOf(c);
    sp.forEach((s, i) => {
      if (s.sec !== sec) return;
      const sa = s.a || '', eb = s.end ? (s.b || '') : '9999';
      const endIn = s.end && (s.b ? inRange(s.b, a, b) : false);
      const startIn = !!sa && inRange(sa, a, b) && !s.approx;
      const before = !sa || sa < a || (s.approx && sa <= b);
      const alive = s.end ? (s.b ? s.b >= a : false) : true;
      if (!(startIn || (before && alive))) return;
      const srcLab = srcNorm(s.src) || 'Source not written';
      const outLab = !s.end ? '' : s.end === 'moved' ? 'To ' + CENTRE_OF_SEC(s.to) : s.end === 'home' ? 'Home with the family' : (s.reason || 'Discharged, reason not written');
      if (startIn) add(inBy, srcLab); else start++;
      if (endIn) add(outBy, outLab);
      else if (!s.end || eb > b) add(here, c.status === 'Semi-active' && !s.end ? 'Semi-active' : c.schoolType === 'Nkwazi community school' ? 'In the community school' : /^GRZ|Private/.test(c.schoolType || '') ? 'In GRZ or private school' : c.schoolType === 'College / skills training' ? 'In college or skills training' : sec === 'Luigi' ? 'Followed on the street' : 'Other, school not written');
      rows.push({ c, s, startIn, endIn, srcLab, outLab });
    });
  }
  return { start, inBy, outBy, here, rows };
}
/* ---------- by centre register: at Minsundu UCC and Youth are one register, so a move between them is no admission and no discharge ---------- */
function secCentre(sec) { return sec === 'UCC' || sec === 'Youth' ? 'Minsundu' : sec; }
function reasonLabel(r) { return r === 'Transferred to another partner' ? 'Transferred to another facility' : (r || ''); }
function centreSpans(c) {
  const out = [];
  for (const s of pathOf(c)) {
    const k = secCentre(s.sec), last = out[out.length - 1];
    if (last && last.centre === k && last.end === 'moved' && secCentre(last.to) === k) { last.b = s.b; last.end = s.end; last.reason = s.reason; last.to = s.to; last.closed = s.closed; last.sec = s.sec; }
    else out.push(Object.assign({}, s, { centre: k }));
  }
  return out;
}
function centreSrc(s) { if (s.back) return s.src; if (s.fromSec) return CENTRE_LABEL[secCentre(s.fromSec)] || s.fromSec; const t = srcNorm(s.src); return /minsundu|\bucc\b|youth/i.test(t) ? 'Minsundu' : /nkwazi/i.test(t) ? 'Nkwazi Centre' : t; }
function flowCentre(centre, a, b, crit, res) {
  const rows = [], inBy = {}, outBy = {}, here = {};
  let start = 0;
  const add = (o, k) => { o[k] = (o[k] || 0) + 1; };
  for (const c of S.children) {
    if (res && c.residence !== res) continue;
    for (const s of centreSpans(c)) {
      if (s.centre !== centre || (crit && s.sec !== crit)) continue;
      const sa = s.a || '', eb = s.end ? (s.b || '') : '9999';
      const endIn = s.end && (s.b ? inRange(s.b, a, b) : false);
      const startIn = !!sa && inRange(sa, a, b) && !s.approx;
      const before = !sa || sa < a || (s.approx && sa <= b);
      const alive = s.end ? (s.b ? s.b >= a : false) : true;
      if (!(startIn || (before && alive))) continue;
      const srcLab = centreSrc(s) || 'Source not written';
      const outLab = !s.end ? '' : s.end === 'moved' ? 'To ' + (CENTRE_LABEL[secCentre(s.to)] || s.to) : s.end === 'home' ? 'Home with the family' : (reasonLabel(s.reason) || 'Discharged, reason not written');
      if (startIn) add(inBy, srcLab); else start++;
      if (endIn) add(outBy, outLab);
      else if (!s.end || eb > b) add(here, centre === 'Minsundu' ? (sleepsHere(c) ? c.residence : 'Non-resident') + ', ' + s.sec : c.status === 'Semi-active' && !s.end ? 'Semi-active' : dayType(c) === 'Nkwazi community school' ? 'In the community school' : /^GRZ|Private/.test(c.schoolType || '') ? 'In GRZ or private school' : c.schoolType === 'College / skills training' ? 'In college or skills training' : centre === 'Luigi' ? 'Followed on the street' : 'Other, school not written');
      rows.push({ c, s, startIn, endIn, srcLab, outLab });
    }
  }
  return { start, inBy, outBy, here, rows };
}
function flowSvg(F, sec) {
  const col = CENTRE_COLOR[sec] || (SECTIONS[sec] || {}).color || '#ECC000';
  const L = [['Brought from the past year', F.start, '#B8B6B0']].concat(Object.entries(F.inBy).sort((x, y) => y[1] - x[1]).map(([k, n]) => [k, n, k.includes('Luigi') ? SECTIONS.Luigi.color : /Minsundu|UCC/.test(k) ? SECTIONS.UCC.color : /Youth/.test(k) ? SECTIONS.Youth.color : /Nkwazi/.test(k) ? SECTIONS.Nkwazi.color : '#CB912F'])).filter(x => x[1]);
  const R = Object.entries(F.here).sort((x, y) => y[1] - x[1]).map(([k, n]) => [k, n, k === 'Semi-active' ? '#CB912F' : col]).concat(Object.entries(F.outBy).sort((x, y) => y[1] - x[1]).map(([k, n]) => [k, n, /Luigi/.test(k) ? SECTIONS.Luigi.color : /Minsundu|UCC/.test(k) ? SECTIONS.UCC.color : /Youth/.test(k) ? SECTIONS.Youth.color : /Home/.test(k) ? '#319536' : '#9B9A97']));
  const tot = L.reduce((x, y) => x + y[1], 0); if (!tot) return '<p class="empty">No child in this period.</p>';
  const gap = 10, W = 760, bw = 12, x1 = 230, x2 = W / 2 - 40, x3 = W - 230 - bw, unit = Math.min(3.2, 300 / tot);
  const hOf = n => Math.max(n * unit, 2), pitch = n => Math.max(hOf(n) + gap, 19), hh = list => list.reduce((x, y) => x + pitch(y[1]), 0);
  const H = Math.max(hh(L), hh(R), tot * unit) + 34, top = 22;
  const stack = list => { let y = top + (H - 34 - hh(list)) / 2; return list.map(([k, n, c]) => { const o = { k, n, c, y, h: hOf(n) }; y += pitch(n); return o; }); };
  const A = stack(L), B = stack(R), my = top + (H - 34 - tot * unit) / 2;
  let ya = my, yb = my, out = '';
  const rib = (xa, ya0, xb, yb0, h, c) => { const m = (xa + xb) / 2; return `<path d="M${xa},${ya0} C${m},${ya0} ${m},${yb0} ${xb},${yb0} L${xb},${yb0 + h} C${m},${yb0 + h} ${m},${ya0 + h} ${xa},${ya0 + h} Z" fill="${c}" opacity=".28"/>`; };
  for (const o of A) { out += rib(x1 + bw, o.y, x2, ya, o.h, o.c) + `<rect x="${x1}" y="${o.y}" width="${bw}" height="${o.h}" rx="2" fill="${o.c}"/><text x="${x1 - 8}" y="${o.y + o.h / 2 + 4}" text-anchor="end" class="fl"><tspan class="fn">${o.n}</tspan> ${esc(o.k)}</text>`; ya += o.n * unit; }
  for (const o of B) { out += rib(x2 + 80, yb, x3, o.y, o.h, o.c) + `<rect x="${x3}" y="${o.y}" width="${bw}" height="${o.h}" rx="2" fill="${o.c}"/><text x="${x3 + bw + 8}" y="${o.y + o.h / 2 + 4}" class="fl"><tspan class="fn">${o.n}</tspan> ${esc(o.k)}</text>`; yb += o.n * unit; }
  out += `<rect x="${x2}" y="${my}" width="80" height="${tot * unit}" rx="6" fill="${col}"/><text x="${x2 + 40}" y="${my + tot * unit / 2 - 2}" text-anchor="middle" class="fc">${tot}</text><text x="${x2 + 40}" y="${my + tot * unit / 2 + 14}" text-anchor="middle" class="fcs">worked with</text>`;
  out += `<text x="${x1 + bw}" y="12" text-anchor="end" class="fh">WHERE THEY CAME FROM</text><text x="${x3}" y="12" class="fh">WHERE THEY ARE NOW</text>`;
  return `<div class="tw"><svg class="flow" viewBox="0 0 ${W} ${H}" role="img" aria-label="Admissions and discharges of ${esc(CENTRE_LABEL[sec] || CENTRE_OF_SEC(sec))}" style="min-width:640px;width:100%">${out}</svg></div>`;
}
const PATH_COLS = [{ label: 'No', get: (r, i) => i + 1 }, { label: 'ID', get: r => r.c.id }, { label: 'Name', get: r => fullName(r.c) }, { label: 'Sex', get: r => r.c.sex }, { label: 'Date of admission', get: r => r.s.approx ? r.s.a.slice(0, 4) : r.s.a }, { label: 'Transfer / referral from (in)', get: r => r.srcLab }, { label: 'Transfer / discharge (out)', get: r => r.outLab }, { label: 'Date', get: r => r.s.end ? r.s.b : '' }, { label: 'Reason', get: r => reasonLabel(r.s.reason) || r.c.admissionNote || '' }, { label: 'Status now', get: r => r.s.end ? '' : r.c.status }];
const PATH_COLS_M = [{ label: 'UCC or Youth', get: r => r.s.sec }, { label: 'Resident or not', get: r => r.c.residence || '' }];
function pathSel(q) {
  const p = q.get('ps') || '', k = secCentre(p);
  const sec = CENTRES.includes(k) ? k : (hasFlag('Nkwazi') || !hasFlag('Luigi') && !hasFlag('Minsundu') ? 'Nkwazi' : hasFlag('Luigi') ? 'Luigi' : 'Minsundu');
  const y = q.get('py') || today().slice(0, 4);
  const a = y === 'all' ? '1990-01-01' : y + '-01-01', b = y === 'all' ? today() : (y === today().slice(0, 4) ? today() : y + '-12-31');
  const crit = sec !== 'Minsundu' ? '' : ['UCC', 'Youth'].includes(q.get('pk')) ? q.get('pk') : '';
  const res = sec === 'Minsundu' && RES3.includes(q.get('pr')) ? q.get('pr') : '';
  return { sec, y, a, b, crit, res };
}
function pathFlow(q) { const x = pathSel(q); return flowCentre(x.sec, x.a, x.b, x.crit, x.res); }
function pathRows(q) { const only = q.get('pf') || ''; return pathFlow(q).rows.filter(r => !only || (only === 'in' ? r.startIn : only === 'out' ? r.endIn : !r.s.end)).sort((x, y) => (x.s.a || '').localeCompare(y.s.a || '') || fullName(x.c).localeCompare(fullName(y.c))); }
function vPaths(r) {
  const q = r.q, { sec, y, crit, res } = pathSel(q), F = pathFlow(q), only = q.get('pf') || '', M = sec === 'Minsundu';
  const years = ['all']; for (let i = Number(today().slice(0, 4)); i >= 2020; i--) years.push(String(i));
  const nIn = Object.values(F.inBy).reduce((x, n) => x + n, 0), nOut = Object.values(F.outBy).reduce((x, n) => x + n, 0), nHere = Object.values(F.here).reduce((x, n) => x + n, 0);
  const rows = pathRows(q);
  const tile = (k, n, l) => `<a href="#" class="tile" data-q="pf=${only === k ? '' : k}" style="${only === k ? 'border-color:var(--ink)' : ''}"><b>${n}</b><span>${l}</span></a>`;
  return `<div class="top"><div><h1>Admissions, transfers and discharges · ${esc(CENTRE_LABEL[sec])}${crit ? ' · ' + crit : ''}${res ? ' · ' + (res === 'Resident' ? 'residents' : res === 'In transit' ? 'in transit' : 'non-residents') : ''}</h1><p class="lead">${y === 'all' ? 'All years.' : 'Year ' + esc(y) + (y === today().slice(0, 4) ? ', up to today.' : '.')}</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg" role="group" aria-label="Centre">${CENTRES.map(k => `<a href="#" data-q="ps=${k}&pf=&pk=&pr=" class="${sec === k ? 'on' : ''}">${esc(CENTRE_LABEL[k])}</a>`).join('')}</div>
    ${M ? `<select class="in" data-filter="pk" style="width:auto" aria-label="UCC or Youth">${opt(['UCC', 'Youth'], crit, 'UCC and Youth')}</select><select class="in" data-filter="pr" style="width:auto" aria-label="Resident or not">${opt([{ v: 'Resident', l: 'Residents' }, { v: 'In transit', l: 'In transit' }, { v: 'Non-resident', l: 'Non-residents' }], res, 'Everyone')}</select>` : ''}
    <select class="in" data-filter="py" style="width:auto" aria-label="Year">${opt(years.map(v => ({ v, l: v === 'all' ? 'All years' : v })), y)}</select></div></div>
  <section class="card">${flowSvg(F, sec)}<p class="sub" style="margin:8px 0 0">A child readmitted counts once for each stay.</p></section>
  <div class="grid g4">${tile('', F.rows.length, 'Worked with in the period')}${tile('in', nIn, 'Admitted')}${tile('out', nOut, 'Discharged or transferred')}${tile('here', nHere, 'Still at the centre')}</div>
  <section class="card" style="padding:6px 8px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:6px 4px"><h2 style="margin:0">Admissions and discharges register · ${rows.length}</h2><button class="btn sm" data-act="xl" data-k="paths">Export in Excel</button></div>
    <div class="tw"><table class="mt"><thead><tr><th>Name</th>${M ? '<th>UCC or Youth</th><th>Resident or not</th>' : ''}<th>Admitted</th><th>From</th><th>Out</th><th>Date</th><th>Reason</th></tr></thead><tbody>${rows.map(x => `<tr><td>${childLink(x.c)}<div class="sub">ID ${esc(x.c.id)} · ${esc(x.c.sex || '?')}</div></td>${M ? `<td>${esc(x.s.sec)}</td><td>${esc(x.c.residence || '')}</td>` : ''}<td>${esc(x.s.a ? (x.s.approx ? x.s.a.slice(0, 4) : fmtDate(x.s.a)) : 'not written')}</td><td>${esc(x.srcLab)}</td><td>${x.s.end ? esc(x.outLab) : `<span class="chip ${STATUS_CHIP[x.c.status] || ''}">${esc(x.c.status)}</span>`}</td><td>${esc(x.s.end ? fmtDate(x.s.b) || 'not written' : '')}</td><td>${esc(reasonLabel(x.s.reason) || x.c.admissionNote || '')}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">Nobody.</td></tr>'}</tbody></table></div></section>
  <p class="sub" style="margin:0">New admission: add the child. Discharge: close the file. Transfer: Change status or centre.${M ? ' From resident to non-resident is not a discharge. From UCC to Youth is not a transfer.' : ''}</p>`;
}

/* ---------- absences: a short alert, and a long absence that asks to review the status ---------- */
function absSet() { const s = S.settings.absence || {}; return { alert: Number(s.alert) > 0 ? Number(s.alert) : 4, review: Number(s.review) > 0 ? Number(s.review) : 60 }; }
function absenceList() {
  const A = absSet(), t = today(), dates = Object.keys(S.attendance).sort().reverse(), out = [];
  for (const c of S.children) {
    if (!isCurrent(c)) continue;
    for (const centre of attCentres(c)) {
      if (centre === 'Luigi') continue;
      const key = attKey(c, centre); let run = 0, since = '';
      for (const d of dates) { if (d > t) continue; const s = (S.attendance[d] || {})[key]; if (s == null) continue; if (s === 'A' || s === 'T') { run++; since = d; } else if (s === 'S' || s === 'E') continue; else break; }
      if (!run) continue;
      const days = daysBetween(since, t);
      if (days >= A.review) out.push({ c, centre, run, since, days, long: true }); else if (run >= A.alert) out.push({ c, centre, run, since, days, long: false });
    }
  }
  return out.sort((x, y) => y.days - x.days);
}
function absChip(c) { const x = absenceList().find(y => y.c === c); return x ? `<span class="chip ${x.long ? 'c-red' : 'c-orange'}">${x.long ? 'Not coming for ' + x.days + ' days: check the status' : 'Absent ' + x.run + ' days in a row'}</span>` : ''; }

/* ---------- Nkwazi attendance: community school or other schools, class ---------- */
function nkzSchoolGroup(c) { return c.schoolType === 'Nkwazi community school' ? 'com' : c.schoolType && c.schoolType !== 'Not in school' ? 'other' : 'none'; }
function gradeSort(g) { g = String(g || ''); if (g === 'ECE') return 0; const f = /^Form (\d)/.exec(g); if (f) return 7 + Number(f[1]); return Number(g) || 99; }
function nkzFilters(q) {
  const ctr = teacherReg(q.get('c')) ? q.get('c') : 'Nkwazi', kids = S.children.filter(c => isCurrent(c) && attCentres(c).includes(ctr));
  const grades = uniq(kids.map(c => c.grade).filter(Boolean)).sort((x, y) => gradeSort(x) - gradeSort(y));
  return `${ctr !== 'Nkwazi' ? '' : `<label class="f">School<select class="in" data-filter="sg">${opt([{ v: 'com', l: 'Community school · ' + kids.filter(c => nkzSchoolGroup(c) === 'com').length }, { v: 'other', l: 'GRZ and private schools · ' + kids.filter(c => nkzSchoolGroup(c) === 'other').length }, { v: 'none', l: 'No school written · ' + kids.filter(c => nkzSchoolGroup(c) === 'none').length }], q.get('sg'), 'All')}</select></label>`}
    <label class="f">Class<select class="in" data-filter="gr">${opt(grades.map(g => ({ v: g, l: /^\d+$/.test(g) ? 'Grade ' + g : g })), q.get('gr'), 'All classes')}</select></label>`;
}

/* ---------- wording: the English used in the Zambian reports of the project ---------- */
const WORDS = [[/Counseling/g, 'Counselling'], [/counseling/g, 'counselling'], [/\bCounselor/g, 'Counsellor'], [/\bcounselor/g, 'counsellor'], [/\bEnrollment/g, 'Enrolment'], [/\benrollment/g, 'enrolment']];
function zmText(t) { for (const [a, b] of WORDS) t = t.replace(a, b); return t; }
function zm(html) { return String(html).replace(/>([^<]+)</g, (m, t) => '>' + zmText(t) + '<'); }

/* ---------- attendance: the month as a register, like the paper one ---------- */
const ATT_SHOW = { P: '✓', A: 'X', S: 'S', E: 'P', H: 'H', B: 'B', T: 'St' };
function attMonthTable(q) {
  const d = q.get('d') || today(), m = d.slice(0, 7), n = Number(monthEnd(m).slice(8));
  const q2 = new URLSearchParams(q.toString()); q2.delete('only');
  const kids = attKids(q2, true), days = []; for (let i = 1; i <= n; i++) days.push(m + '-' + String(i).padStart(2, '0'));
  if (!kids.length) return '<p class="empty">No child matches.</p>';
  const wk = x => { const w = new Date(x + 'T00:00:00').getDay(); return w === 0 || w === 6; };
  const ctr = q.get('c') || defCentre(), mk = attMarks(ctr, attGrp(q, ctr));
  return `<div class="tw"><table class="mreg"><thead><tr><th>Name</th>${days.map(x => `<th class="${wk(x) ? 'we' : ''}${x === today() ? ' td' : ''}">${Number(x.slice(8))}</th>`).join('')}${mk.map(k => `<th title="${ATT_L[k]}">${ATT_SHOW[k]}</th>`).join('')}</tr></thead><tbody>${kids.map(c => { const v = days.map(x => (S.attendance[x] || {})[attKey(c, q.get('c') || defCentre())] || ''); const cnt = k => v.filter(x => x === k).length; const key = attKey(c, q.get('c') || defCentre()); return `<tr><td>${childLink(c)}</td>${v.map((x, i) => days[i] > today() ? `<td class="fu${wk(days[i]) ? ' we' : ''}"></td>` : `<td class="mc ${x ? 'm' + x : ''}${wk(days[i]) ? ' we' : ''}" data-act="mcell" data-d="${days[i]}" data-id="${esc(key)}" data-c="${esc(c.id)}">${ATT_SHOW[x] || ''}</td>`).join('')}${mk.map((k, i) => `<td>${i ? cnt(k) || '' : '<b>' + cnt(k) + '</b>'}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div><p class="sub" style="margin:8px 4px 2px">Tap a box to change: ${mk.map(k => ATT_SHOW[k] + ' ' + ATT_L[k].toLowerCase()).join(', ')}, empty.</p>`;
}

/* ---------- section, where the child sleeps, where the child comes by day: three separate things ---------- */
const DAY_CENTRE = { Luigi: 'Luigi Drop-in', Minsundu: 'Minsundu Centre', Nkwazi: 'Nkwazi Centre' };
/* T = Street: a resident of Minsundu who left the centre without permission and is on the street (alpha 5.27) */
const ATT_L = { P: 'Present', H: 'Home', B: 'Boarding school', T: 'Street', A: 'Absent', S: 'Sick', E: 'Permission' };
const DAY_LABEL = { 'Nkwazi community school': 'Community school', 'Literacy class (Minsundu)': 'Literacy class', 'GRZ primary': 'GRZ school, primary', 'GRZ secondary': 'GRZ school, secondary' };
/* the school of the children at Minsundu is the literacy class: files written before 12/11 say 'Minsundu school' */
const LITERACY = 'Literacy class (Minsundu)';
function dayLabel(t) { return DAY_LABEL[t] || t || ''; }
function dayOpts() { return SCHOOL_TYPES.map(t => ({ v: t, l: dayLabel(t) })); }
/* where the child goes by day: the school type of the file; older files may only have the school name or the first "also at" field */
function dayType(c) {
  if (c.schoolType) return c.schoolType === 'Sandra Centre' ? 'Luigi Special School' : c.schoolType === 'Minsundu school' ? LITERACY : c.schoolType;
  if (c.alsoAt === 'Nkwazi') return 'Nkwazi community school';
  if (c.alsoAt === 'Minsundu') return LITERACY;
  if (c.alsoAt !== 'none' && centreOf(c) === 'Minsundu' && /^\s*nkwa[sz]i(\s+community(\s+school)?)?\s*$/i.test(c.schoolName || '')) return 'Nkwazi community school';
  /* names used in the Minsundu register: proposals until somebody confirms them in Edit */
  if (centreOf(c) === 'Minsundu' && /^\s*ch?icetekelo\s+com/i.test(c.schoolName || '')) return LITERACY;
  if (/luigi\s+special/i.test(c.schoolName || '')) return 'Luigi Special School';
  return '';
}
function alsoAt(c) { return ''; }
/* the registers a child is on: the one of the centre, the one of Minsundu when he or she goes to school there, and the community school register (kept by the teacher) */
function attCentres(c) { const out = [centreOf(c)], t = dayType(c); if (t === 'Nkwazi community school') out.push('School'); if (t === LITERACY) out.push('Literacy'); return out; }
function teacherReg(k) { return k === 'School' || k === 'Literacy'; }
function attKey(c, centre) { return centre && centre !== centreOf(c) ? c.id + '@' + centre : String(c.id); }
/* Minsundu keeps three registers: UCC and Youth (residents) and non-residents */
function attIn(c, centre, grp) {
  if (!attCentres(c).includes(centre)) return false;
  if (grp === 'All') return true;
  if (grp === 'UCC' || grp === 'Youth') return sleepsHere(c) && c.section === grp;
  return (grp === 'Resident') === sleepsHere(c);
}
function attGroups(centre) { return centre === 'Minsundu' ? [['UCC', 'UCC'], ['Youth', 'Youth'], ['Non-resident', 'Non-residents'], ['All', 'Everyone']] : [['All', 'Everyone'], ['Resident', 'Residents'], ['Non-resident', 'Non-residents']]; }
function grpText(grp) { return grp === 'All' ? 'everyone' : grp === 'Resident' ? 'residents' : grp === 'Non-resident' ? 'non-residents' : grp; }
/* the marks of each register, as on the paper ones: at Minsundu a resident is present, at home (H) or at boarding school */
function attMarks(centre, grp) { return centre !== 'Minsundu' ? ['P', 'A', 'S', 'E'] : grp === 'Non-resident' ? ['P', 'A'] : grp === 'All' ? ['P', 'H', 'B', 'T', 'A'] : ['P', 'H', 'B', 'T']; }
function attOpts(c, centre) { return attMarks(centre, centre === 'Minsundu' && !sleepsHere(c) ? 'Non-resident' : 'UCC').map(k => [k, ATT_L[k]]); }
function sleepsText(c) {
  if (c.residence === 'Resident') return 'At Minsundu Centre (resident)';
  if (c.residence === 'In transit') return 'At Minsundu Centre (in transit)';
  if (c.section === 'Luigi') return c.streetCat ? STREET_CATS[c.streetCat] : 'Not written';
  return 'At home (non-resident)';
}
function guestLine(c, centre) { return teacherReg(centre) ? ' · ' + esc(CENTRE_LABEL[centreOf(c)] || '') + (c.residence === 'Resident' ? ', resident' : '') : centre !== centreOf(c) ? ` · followed by ${esc(c.section === 'Luigi' ? 'Luigi' : c.section)}, ${c.residence === 'Resident' ? 'sleeps at Minsundu' : 'sleeps at home'}` : c.residence === 'Resident' && centre === 'Nkwazi' ? ' · sleeps at Minsundu' : ''; }
function whereHtml(c) {
  const sec = SECTIONS[c.section] || {}, t = dayType(c), auto = t && !c.schoolType;
  const day = t ? dayLabel(t) + (c.schoolName && !/community school|Minsundu school|Literacy class|Luigi Special|Not in school/.test(t) ? ' · ' + c.schoolName : '') : c.section === 'Luigi' ? 'Luigi Drop-in' : 'Not written';
  const lists = attCentres(c).filter(k => k !== 'Luigi');
  const cell = (q, a, s) => `<div class="w3"><span>${q}</span><b>${esc(a)}</b>${s ? `<small>${s}</small>` : ''}</div>`;
  return `<div class="where3">${cell('Centre', sec.label || '', '')}${cell('Sleeps', sleepsText(c), '')}${cell('Education', day, (lists.length > 1 ? 'Registers: ' + lists.map(k => CENTRE_LABEL[k] || k).join(', ') : '') + (auto ? ' · to confirm' : ''))}</div>`;
}
function secExplain() {
  const cell = (q, t) => `<div class="w3"><span>${q}</span><b style="font-weight:500">${t}</b></div>`;
  return `<section class="card" id="sections"><h2>Three things in every file</h2>
  <div class="where3" style="margin:10px 0 0">${cell('Centre', 'Luigi, Minsundu or Nkwazi Centre')}${cell('Sleeps', 'At Minsundu (resident) or at home')}${cell('Education', 'The school or centre of the day')}</div></section>`;
}
function attWho(centre) { return ''; }

/* ---------- quick marking: one tap on the name, made for a phone held in one hand ---------- */
function attMode(q) { const v = q.get('av'); return ['month', 'day', 'quick'].includes(v) ? v : (window.matchMedia && window.matchMedia('(max-width:899.98px)').matches ? 'quick' : 'day'); }
function attBody(q) { const m = attMode(q); return m === 'month' ? attMonthTable(q) : m === 'quick' ? attQuickList(q) : attTable(q); }
function attQuickBase(q) { const q2 = new URLSearchParams(q.toString()); q2.delete('only'); const keep = UI.attq; UI.attq = ''; const r = attKids(q2, true); UI.attq = keep; return r; }
function attQuick(q, centre, grp, d) {
  const all = S.children.filter(c => isCurrent(c) && attIn(c, centre, grp));
  let chips;
  if (centre !== 'Minsundu') { const grades = uniq(all.map(c => c.grade).filter(Boolean).map(String)).sort((x, y) => gradeSort(x) - gradeSort(y)); chips = [['', 'All classes']].concat(grades.map(g => [g, /^\d+$/.test(g) ? 'Grade ' + g : g])).map(([v, l]) => `<a href="#" data-q="gr=${esc(v)}" class="${(q.get('gr') || '') === v ? 'on' : ''}">${esc(l)}</a>`).join(''); }
  else chips = attGroups(centre).map(([v, l]) => `<a href="#" data-q="g=${v}" class="${grp === v ? 'on' : ''}">${l}</a>`).join('');
  return `<div class="qtop"><input class="in qsearch" id="attsearch" type="search" autocomplete="off" placeholder="Type a name, tap it" aria-label="Find a name" value="${esc(UI.attq || '')}">
    <div class="qchips">${chips}</div>
    <div id="qstat">${attQuickStat(q, centre, grp, d)}</div></div>
  <div class="card" style="padding:0 8px"><div id="attTable">${attQuickList(q)}</div></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="xl" data-k="attday">Export in Excel</button></div>`;
}
function attQuickStat(q, centre, grp, d) {
  const base = attQuickBase(q), day = S.attendance[d] || {}, n = k => base.filter(c => day[attKey(c, centre)] === k).length, todo = base.filter(c => day[attKey(c, centre)] == null).length;
  const lm = UI.lastMark && UI.lastMark.d === d && UI.lastMark.centre === centre ? UI.lastMark : null, lc = lm ? child(String(lm.id).split('@')[0]) : null;
  const done = q.get('qt') === 'done';
  return `<div class="qcount"><span><b class="qday${d === today() ? '' : ' other'}">${esc(new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))}</b> · <b>${n('P')}</b> present${n('A') ? ` · ${n('A')} absent` : ''}${n('H') ? ` · ${n('H')} home` : ''}${n('B') ? ` · ${n('B')} boarding school` : ''}${n('T') ? ` · ${n('T')} street` : ''}${n('S') + n('E') ? ` · ${n('S') + n('E')} other` : ''} · <b>${todo}</b> to mark</span>${lm && lc ? `<button class="btn sm" data-act="qundo">Undo: ${esc(lc.name || fullName(lc))}</button>` : ''}</div>
    <div class="seg" role="group" aria-label="To mark or marked"><a href="#" data-q="qt=" class="${done ? '' : 'on'}">To mark · ${todo}</a><a href="#" data-q="qt=done" class="${done ? 'on' : ''}">Marked · ${base.length - todo}</a></div>`;
}
/* the names tapped on this page stay in the list until the page changes: on a slow phone a name that goes away looks like a tap that was lost */
function qJust(q, centre, d) { const k = [centre, q.get('g') || '', q.get('gr') || '', q.get('sg') || '', d, q.get('qt') || ''].join('|'); if (!UI.qJust || UI.qJust.k !== k) UI.qJust = { k, ids: new Set() }; return UI.qJust.ids; }
function attQuickList(q) {
  const centre = q.get('c') || defCentre(), d = q.get('d') || today(), day = S.attendance[d] || {}, term = (UI.attq || '').trim();
  const q2 = new URLSearchParams(q.toString()); q2.delete('only');
  const all = attKids(q2, true), done = q.get('qt') === 'done';
  const keep = qJust(q, centre, d);
  const kids = term ? all : all.filter(c => { const key = attKey(c, centre); return (day[key] != null) === done || keep.has(key); });
  if (!kids.length) return `<p class="empty">${term ? 'No child with this name on this list.' : done ? 'Nobody marked yet.' : 'Everyone on this list is marked.'}</p>`;
  const rows = kids.map(c => attQuickRow(c, centre, d, day)).join('');
  return rows + `<div id="qrestbox">${attQuickRest(q, centre, d)}</div>`;
}
function attQuickRest(q, centre, d) {
  if ((UI.attq || '').trim() || q.get('qt') === 'done') return '';
  const day = S.attendance[d] || {}, left = attQuickBase(q).filter(c => day[attKey(c, centre)] == null).length;
  return left ? `<div class="qrest"><p class="sub" style="margin:0">${left} not marked yet.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="qrest" data-v="A" data-d="${d}">The others are absent</button><button class="btn" data-act="qrest" data-v="P" data-d="${d}">The others are present</button></div></div>` : '';
}
function attQuickRow(c, centre, d, day) {
    const key = attKey(c, centre), v = day[key], open = UI.qopen === key;
    const sub = [teacherReg(centre) ? (CENTRE_LABEL[centreOf(c)] || '') + (c.residence === 'Resident' ? ', resident' : '') : centre !== centreOf(c) || (centre === 'Nkwazi' && c.residence === 'Resident') ? 'Sleeps at ' + (c.residence === 'Resident' ? 'Minsundu' : 'home') : '', centre === 'Minsundu' || (!teacherReg(centre) && centre !== centreOf(c)) ? c.section : '', c.residence === 'In transit' ? 'In transit' : '', c.grade ? (/^\d+$/.test(String(c.grade)) ? 'Grade ' + c.grade : c.grade) : '', 'ID ' + c.id].filter(Boolean).join(' · ');
    const TG = { P: ['ok', 'check'], A: ['danger', 'x'], T: ['danger', 'pin'], S: ['warn', 'alert'] }, tg = TG[v], at = `data-act="qatt" data-d="${d}" data-id="${esc(key)}"`;
    const tag = `<button class="cyp-tag cyp-tag--button qtag${tg ? ' cyp-tag--' + tg[0] : ''}" data-act="qopen" data-id="${esc(key)}" aria-expanded="${open}" aria-label="${v ? ATT_L[v] + ': change' : 'Not marked: other marks'}">${tg ? dsIcon(tg[1]) : ''}${v ? ATT_L[v] : 'Not marked'}${dsIcon('down')}</button>`;
    return `<div class="qrow cyp-row cyp-row--mark${v ? ' done ' + v : ''}">${dsAvatar(c)}<div class="qn cyp-row__text"><a class="cyp-row__open" href="#/child/${esc(c.id)}"><b>${esc(fullName(c))}</b>${dsIcon('go').replace('cyp-icon', 'cyp-icon cyp-go')}</a><span>${c.nickname ? '"' + esc(c.nickname) + '" · ' : ''}${esc(sub)}</span><div class="cyp-row__tags">${tag}</div></div>
      ${v ? '' : `<button class="cyp-btn cyp-btn--mark" ${at} data-v="P">${dsIcon('check')}Present</button>`}
      ${open ? `<div class="qopts"><fieldset class="cyp-choice cyp-choice--two"><legend>${v ? 'Change the mark' : 'Other marks'}</legend><div class="cyp-choice__row">${attOpts(c, centre).filter(([k]) => k !== v && (v || k !== 'P')).map(([k, l]) => `<label><input type="radio" name="qo" ${at} data-v="${k}"><span>${l}</span></label>`).join('')}</div></fieldset><div class="qmore">${v ? `<button class="btn" ${at} data-v="">Remove the mark</button>` : ''}</div></div>` : ''}</div>`;
}
function attQuickAct(act, b) {
  if (!['qatt', 'qopen', 'qundo', 'qrest'].includes(act)) return false;
  const q = route().q, centre = q.get('c') || defCentre();
  if (act === 'qopen') { UI.qopen = UI.qopen === b.dataset.id ? null : b.dataset.id; const t = $('#attTable'); if (t) t.innerHTML = attBody(q); return true; }
  if (act === 'qatt') {
    const d = b.dataset.d, id = b.dataset.id, v = b.dataset.v; S.attendance[d] = S.attendance[d] || {};
    const prev = S.attendance[d][id]; touchAtt(d, id); if (v) S.attendance[d][id] = v; else delete S.attendance[d][id];
    UI.lastMark = { d, id, centre, prev: prev == null ? '' : prev }; UI.qopen = null; qJust(q, centre, d).add(id);
    const had = (UI.attq || '') !== ''; UI.attq = ''; save();
    /* only the row and the counts are drawn again: the answer to the tap is immediate, also on a slow phone */
    const rowEl = b.closest('.qrow'), kid = child(String(id).split('@')[0]), stat = $('#qstat');
    if (!had && rowEl && kid && stat) { rowEl.outerHTML = attQuickRow(kid, centre, d, S.attendance[d] || {}); stat.innerHTML = attQuickStat(q, centre, attGrp(q, centre), d); const rb = $('#qrestbox'); if (rb) rb.innerHTML = attQuickRest(q, centre, d); if (typeof syncBadge === 'function') syncBadge(); return true; }
    render();
    if (had) { const s = $('#attsearch'); if (s) s.focus(); }
    return true;
  }
  if (act === 'qundo') { const m = UI.lastMark; if (!m) return true; S.attendance[m.d] = S.attendance[m.d] || {}; touchAtt(m.d, m.id); if (m.prev) S.attendance[m.d][m.id] = m.prev; else delete S.attendance[m.d][m.id]; UI.lastMark = null; save(); render(); return true; }
  if (act === 'qrest') {
    const d = b.dataset.d, v = b.dataset.v, day = S.attendance[d] = S.attendance[d] || {}, list = attQuickBase(q).filter(c => day[attKey(c, centre)] == null);
    if (!list.length || !confirm('Mark ' + list.length + (list.length === 1 ? ' child' : ' children') + ' as ' + (v === 'A' ? 'absent' : 'present') + ' for ' + fmtDate(d) + '? You can still change each child afterwards.')) return true;
    for (const c of list) { const k = attKey(c, centre); day[k] = v; touchAtt(d, k); } UI.lastMark = null; save(); render(); return true;
  }
  return true;
}

/* ---------- month register: a click on a box changes the mark ---------- */
function monthCellAct(b) {
  if (GUEST) return;
  const d = b.dataset.d, id = b.dataset.id, c = child(b.dataset.c), centre = route().q.get('c') || defCentre(); if (!c) return;
  const order = attOpts(c, centre).map(x => x[0]).concat(['']);
  S.attendance[d] = S.attendance[d] || {};
  const cur = S.attendance[d][id] || '', nx = order[(order.indexOf(cur) + 1) % order.length];
  touchAtt(d, id); if (nx) S.attendance[d][id] = nx; else delete S.attendance[d][id];
  save();
  const box = document.querySelector('#attTable .tw'), x = box ? box.scrollLeft : 0, t = $('#attTable');
  if (t) { t.innerHTML = attMonthTable(route().q); const nb = document.querySelector('#attTable .tw'); if (nb) nb.scrollLeft = x; }
}

/* ---------- report with names: one row per child, one column per indicator ---------- */
function reportNamesXlsx() {
  const r = route(), m = r.q.get('m') || thisMonth(), k = r.q.get('s') || defReport(), def = REPORTS[k]; if (!def || !def.rows) return;
  const p = k === 'Table6' ? 'M' : (r.q.get('p') || 'M'), rg = periodRange(m, p), aba = (k === 'Family' || k === 'School') && r.q.get('aba') === '1';
  const rows = abaScope(aba, () => def.rows(p === 'M' ? m : rg.a.slice(0, 7) + '~' + rg.b.slice(0, 7)));
  const inds = rows.filter(x => Array.isArray(x[3])), sets = inds.map(x => new Set(x[3].map(c => String(c.id))));
  const seen = new Set(), kids = []; for (const x of inds) for (const c of x[3]) if (!seen.has(String(c.id))) { seen.add(String(c.id)); kids.push(c); }
  kids.sort((x, y) => fullName(x).localeCompare(fullName(y)));
  const head = ['ID', 'Name', 'Nickname', 'Sex', 'Age', 'Centre', 'Sleeps', 'Status', 'Compound', 'School', 'Grade'].concat(inds.map(x => (x[0] + ' ' + x[1]).trim()));
  const body = kids.map(c => [c.id, fullName(c), c.nickname || '', c.sex || '', curAge(c), (SECTIONS[c.section] || {}).label || '', c.residence || '', STATUS_LABEL[c.status] || c.status || '', c.compound || c.familyAddress || '', c.schoolName || c.schoolType || '', c.grade || ''].concat(sets.map(s => s.has(String(c.id)) ? 1 : '')));
  const tot = ['', 'Total: ' + kids.length + ' children', '', '', '', '', '', '', '', '', ''].concat(sets.map(s => s.size));
  downloadXlsx(k + (aba ? '-ABA' : '') + '-with-names-' + (p === 'M' ? m : rg.a.slice(0, 7) + '-to-' + rg.b.slice(0, 7)), [{ name: 'Children', rows: [head].concat(body).concat([tot]), filter: body.length + 1 }]);
}

/* ---------- comments on the app: tap the word on the screen, write the comment ---------- */
/* everyone can comment unless an Education admin switched it off (alpha 5.26: at the start all staff comment) */
function fbAll() { return !(S.settings && S.settings.feedbackAll === false); }
function fbCan() { return !!USER && !GUEST && (USER.admin || fbAll()); }
function fbList() { const all = S.feedback || [], done = new Set(all.filter(x => x.ref).map(x => x.ref)); return all.filter(x => !x.ref).map(x => Object.assign({}, x, { done: done.has(x.id) })).sort((x, y) => (y.ts || 0) - (x.ts || 0)); }
function fbDraw() {
  let b = document.getElementById('fbbtn');
  if (!fbCan()) { if (b) b.remove(); const bar = document.getElementById('fbbar'); if (bar) bar.remove(); UI.fbMode = false; document.body.classList.remove('fbmode'); return; }
  if (!b) { b = document.createElement('button'); b.id = 'fbbtn'; b.type = 'button'; b.addEventListener('click', e => { e.stopPropagation(); fbMode(!UI.fbMode); }); }
  /* the button lives in the bar at the top, so it never covers a name or a button of the page */
  const host = document.querySelector('.hd .who');
  /* AppBar of the system (DS 6cd0): the message-square icon alone, before the sync state; hidden while choosing the place, its space kept */
  if (host) { if (b.parentNode !== host) host.insertBefore(b, host.firstChild); b.className = 'cyp-appbar__action inhd'; b.innerHTML = typeof dsIcon === 'function' ? dsIcon('comment') : 'Comment'; }
  else { if (b.parentNode !== document.body) document.body.appendChild(b); b.className = ''; b.textContent = UI.fbMode ? 'Cancel' : 'Comment'; }
  b.title = 'Write a comment on a word or a part of this page'; b.setAttribute('aria-label', 'Comment');
}
function fbMode(on) {
  UI.fbMode = on; document.body.classList.toggle('fbmode', on); document.body.classList.toggle('cyp-commenting', on); fbDraw();
  let bar = document.getElementById('fbbar');
  if (on && !bar) { bar = document.createElement('div'); bar.id = 'fbbar'; bar.setAttribute('role', 'status'); bar.innerHTML = '<span>Tap the word or the place you want to comment.</span><button type="button" id="fbstop">Cancel</button>'; bar.querySelector('#fbstop').addEventListener('click', e => { e.stopPropagation(); fbMode(false); }); document.body.appendChild(bar); }
  if (!on && bar) bar.remove();
}
function fbOpen(text) {
  fbMode(false);
  const old = document.getElementById('fbbox'); if (old) old.remove();
  const box = document.createElement('div'); box.id = 'fbbox';
  box.innerHTML = `<div class="fbcard" role="dialog" aria-label="Comment"><h2 style="margin:0 0 8px">Comment</h2><p class="sub" style="margin:0 0 4px">On the screen:</p><p class="fbq">${esc(text || '(no text here)')}</p>
    <label class="sub" for="fbnote">Your comment</label><textarea class="in" id="fbnote" rows="3"></textarea>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn pri" type="button" id="fbsave">Save the comment</button><button class="btn" type="button" id="fbcancel">Cancel</button></div></div>`;
  document.body.appendChild(box);
  const page = /^#c=/.test(location.hash) ? '#/home' : (location.hash || '#/home'); /* never the staff link in a comment */
  box.querySelector('#fbcancel').addEventListener('click', () => box.remove());
  box.addEventListener('click', e => { if (e.target === box) box.remove(); });
  box.querySelector('#fbsave').addEventListener('click', () => {
    const note = box.querySelector('#fbnote').value.trim(); if (!note) { box.querySelector('#fbnote').focus(); return; }
    S.feedback = S.feedback || []; S.feedback.push({ id: uid('fb'), ts: Date.now(), date: today(), by: USER ? USER.name : '', page, text: text || '', note, v: VERSION, phone: window.innerWidth <= 760 ? 1 : 0 });
    save(); box.remove(); toast('Comment saved'); if (route().path === 'feedback' || route().path === 'staff') render();
  });
  setTimeout(() => { const t = box.querySelector('#fbnote'); if (t) t.focus(); }, 30);
}
document.addEventListener('click', e => {
  if (!UI.fbMode) return;
  if (e.target.closest && e.target.closest('#fbbtn, #fbbox, #fbbar')) return;
  e.preventDefault(); e.stopPropagation();
  let el = e.target, text = '';
  for (let i = 0; i < 4 && el && el !== document.body; i++) { text = (el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || el.title || '').trim(); if (text) break; el = el.parentElement; }
  fbOpen(text.replace(/\s+/g, ' ').slice(0, 160));
}, true);
function fbAdminCard() {
  const L = fbList(), open = L.filter(x => !x.done).length;
  return `<section class="card"><h2>Comments on the app</h2><p class="sub">Tap Comment, tap the word, write.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><a class="btn" href="#/feedback">Open the comments${open ? ` <span class="chip c-red">${open}</span>` : ''}</a>
    <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-act="fball" ${fbAll() ? 'checked' : ''}> All staff can comment (now: ${fbAll() ? 'everyone' : 'supervisors only'})</label></div></section>`;
}
function fbText(L) { return L.map(x => `[${x.date}${x.by ? ' · ' + x.by : ''} · ${x.page}${x.phone ? ' · phone' : ''} · ${x.v || ''}]\nOn the screen: ${x.text}\nComment: ${x.note}`).join('\n\n'); }
function vFeedback(r) {
  if (!canAdminPage()) return `<h1>Comments on the app</h1><p class="lead">Only supervisors see this page.</p>`;
  const show = r.q.get('f') || 'open', all = fbList(), L = all.filter(x => show === 'all' || (show === 'done') === x.done);
  return `<div class="top"><div><h1>Comments on the app</h1><p class="lead">${all.filter(x => !x.done).length} open · ${all.filter(x => x.done).length} done</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg" role="group" aria-label="Which comments">${[['open', 'Open'], ['done', 'Done'], ['all', 'All']].map(([k, l]) => `<a href="#" data-q="f=${k}" class="${show === k ? 'on' : ''}">${l}</a>`).join('')}</div><button class="btn sm" data-act="fbcopy">Copy the open comments</button><button class="btn sm" data-act="fbxl">Export in Excel</button><a class="btn sm" href="#/staff">Back to Admin</a></div></div>
  <div class="card">${L.length ? `<div class="tw"><table><thead><tr><th>Date</th><th>By</th><th>Page</th><th>On the screen</th><th>Comment</th><th></th></tr></thead><tbody>${L.map(x => `<tr><td>${esc(fmtDate(x.date))}</td><td>${esc(x.by || '')}</td><td><a href="${esc(x.page)}">${esc(x.page.replace(/^#\//, '').split('?')[0] || 'home')}</a>${x.phone ? ' <span class="sub">phone</span>' : ''}<div class="sub">${esc(x.v || '')}</div></td><td class="fbq2">${esc(x.text)}</td><td><b>${esc(x.note)}</b></td><td>${x.done ? '<span class="chip c-green">Done</span>' : `<button class="btn sm" data-act="fbdone" data-id="${esc(x.id)}">Done</button>`}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">No comments here.</p>'}</div>`;
}
function fbAct(act, b) {
  if (act === 'fbdone') { S.feedback.push({ id: uid('fb'), ref: b.dataset.id, ts: Date.now(), date: today(), by: USER ? USER.name : '' }); save(); render(); return true; }
  if (act === 'fball') { S.settings.feedbackAll = !!b.checked; S.meta.adminTs = Date.now(); if (S.meta.sync) syncMeta().adminDirty = Date.now(); save(); render(); return true; }
  if (act === 'fbcopy') { const t = fbText(fbList().filter(x => !x.done)); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => toast('Copied'), () => toast('Could not copy: use Export in Excel')); else toast('Could not copy: use Export in Excel'); return true; }
  if (act === 'fbxl') { downloadXlsx('cyp-edu-comments-' + today(), [{ name: 'Comments', rows: [['Date', 'By', 'Page', 'Phone', 'Version', 'On the screen', 'Comment', 'Done']].concat(fbList().map(x => [x.date, x.by || '', x.page, x.phone ? 'yes' : '', x.v || '', x.text, x.note, x.done ? 'yes' : ''])), filter: true }]); return true; }
  return false;
}

/* ---------- photos from files: the file name is the name of the child ---------- */
function photoCands(fileName) {
  const base = String(fileName).replace(/\.[a-z0-9]+$/i, '').replace(/\d+\s*(yrs?|years?)?/gi, ' ').replace(/copy|img|photo/gi, ' ');
  const words = nameKey(base).split(' ').filter(Boolean); if (!words.length) return { exact: [], near: [] };
  const exact = [], near = [];
  for (const c of S.children) {
    const cw = nameKey(fullName(c)).split(' ').filter(Boolean); if (!cw.length) continue;
    const common = words.filter(w => cw.includes(w)).length;
    if (common === words.length && common === cw.length) exact.push(c);
    else if (common >= 2 || (common === 1 && words.length === 1)) near.push({ c, common });
    else if (common === Math.min(words.length, cw.length) && common >= 1 && Math.min(words.length, cw.length) >= 2) near.push({ c, common });
  }
  near.sort((x, y) => y.common - x.common || (y.c.status !== 'Closed') - (x.c.status !== 'Closed'));
  return { exact, near: near.slice(0, 8).map(x => x.c) };
}
function photoSmall(file) {
  return new Promise(res => { const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 280 / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', 0.7)); };
    img.onerror = () => { URL.revokeObjectURL(url); res(''); }; img.src = url; });
}
function photosBatchHtml() {
  const B = UI.photoBatch || []; if (!B.length) return '';
  const lab = c => `${fullName(c)} · ${(SECTIONS[c.section] || {}).label || c.section} · ID ${c.id}${c.status === 'Closed' ? ' · closed' : ''}${photos()[c.id] ? ' · has a photo, it will be replaced' : ''}`;
  const n = B.filter(x => x.pick).length;
  return `<div class="tw"><table><thead><tr><th>Picture</th><th>File</th><th>Child</th></tr></thead><tbody>${B.map((x, i) => `<tr><td>${x.src ? `<img src="${x.src}" alt="" style="width:56px;height:56px;border-radius:8px;object-fit:cover">` : 'Could not read'}</td><td>${esc(x.name)}</td><td>${x.src ? `<select class="in" data-photopick="${i}"><option value="">Do not add</option>${x.cands.map(c => `<option value="${esc(c.id)}"${String(x.pick) === String(c.id) ? ' selected' : ''}>${esc(lab(c))}</option>`).join('')}</select>${x.cands.length ? (x.sure ? '' : '<div class="sub">Not sure: choose the child, or leave "Do not add".</div>') : '<div class="sub">No child with this name.</div>'}` : ''}</td></tr>`).join('')}</tbody></table></div>
  <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap"><button class="btn pri" data-act="photossave"${n ? '' : ' disabled'}>Save ${n} ${n === 1 ? 'photo' : 'photos'}</button><span class="sub">${B.length} files chosen</span></div>`;
}
async function photosBatchLoad(files) {
  const msg = $('#photosmsg'); if (msg) msg.innerHTML = '<p class="sub">Reading the pictures...</p>';
  const B = [];
  for (const f of files) { const src = await photoSmall(f), k = photoCands(f.name), sure = k.exact.length === 1; B.push({ name: f.name, src, cands: k.exact.concat(k.near.filter(c => !k.exact.includes(c))), sure, pick: sure ? k.exact[0].id : '' }); }
  B.sort((x, y) => (x.sure === y.sure ? 0 : x.sure ? 1 : -1) || x.name.localeCompare(y.name));
  UI.photoBatch = B; if (msg) msg.innerHTML = photosBatchHtml();
}
function photosBatchSave() {
  const B = (UI.photoBatch || []).filter(x => x.pick && x.src && child(x.pick)); if (!B.length) return;
  for (const x of B) { const c = child(x.pick); photos()[c.id] = x.src; syncMeta().photos[c.id] = 1; }
  UI.photoBatch = null; save(); toast(B.length + (B.length === 1 ? ' photo saved' : ' photos saved')); render();
}
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'photosfile' && el.files && el.files.length) { photosBatchLoad(Array.from(el.files)); return; }
  if (el.dataset && el.dataset.photopick != null && UI.photoBatch) { UI.photoBatch[Number(el.dataset.photopick)].pick = el.value; const msg = $('#photosmsg'); if (msg) msg.innerHTML = photosBatchHtml(); }
});


/* ---------- Activities: sports and skills training (draft) ----------
   Enrolment is kept in the child's file (c.activities). Attendance is a mark per day, child and discipline. */
/* beta 1.8 (comments of 24/11 from the meeting with Pippen): attendance is kept for football, basketball, golf and tennis, plus acrobatics; swimming and volleyball left out */
const ACT_DEFAULT = { Sports: ['Football', 'Basketball', 'Golf', 'Tennis', 'Acrobatics'], 'VET training': ['Carpentry', 'Agriculture', 'Mechanics', 'Handicraft'] };
function actGroups() { return (S.settings && S.settings.activities) || ACT_DEFAULT; }
function actAll() { return [].concat.apply([], Object.values(actGroups())); }
function actNow(q) { return q.get('a') || actAll()[0]; }
function actOf(c) { return Array.isArray(c.activities) ? c.activities : []; }
/* the training groups of a sport (comments of 24/11): basketball by centre, football by age; a child has one group per sport (c.actTeam) */
const ACT_TEAMS = { Basketball: ['Luigi', 'UCC (U12 and U14)', 'Nkwazi Centre (U12, U14, U16)', 'Youth'], Football: ['Luigi', 'Nkwazi Centre', 'U13', 'U15', 'U19+ (Youth)'] };
function actTeamOf(c, a) { return (c.actTeam && c.actTeam[a]) || ''; }
function actTeamGuess(c, a) {
  const T = ACT_TEAMS[a]; if (!T) return ''; const sec = c.section, age = Number(curAge(c)) || 0;
  if (sec === 'Luigi') return 'Luigi'; if (sec === 'Nkwazi') return T.find(x => x.startsWith('Nkwazi')) || '';
  if (sec === 'Youth') return T.find(x => x.includes('Youth')) || '';
  if (a === 'Basketball') return sec === 'UCC' ? 'UCC (U12 and U14)' : '';
  return age && age < 13 ? 'U13' : age && age < 15 ? 'U15' : age ? 'U19+ (Youth)' : '';
}
function actTeamSet(c, a, t) { c.actTeam = Object.assign({}, c.actTeam || {}); if (t) c.actTeam[a] = t; else delete c.actTeam[a]; c.updatedAt = today(); }
function actIds(a, from, to) { const suf = '@act:' + a, ids = new Set(); for (const day of Object.keys(S.attendance)) if (day >= from && day <= to) for (const k of Object.keys(S.attendance[day])) if (k.endsWith(suf)) ids.add(k.slice(0, -suf.length)); return Array.from(ids); }
function actFind(term) { return S.children.filter(c => c.status !== 'Closed' && (fullName(c) + ' ' + (c.nickname || '')).toLowerCase().includes(term)).slice(0, 30); }
/* the coach sees the health conditions of the child under the name (Pippen, 24/11) */
function healthLine(c) { const t = [c.medical, c.disabilities].map(x => String(x || '').trim()).filter(Boolean).join(' · '); return t && seesConditions(c) ? `<small class="hline">${dsIcon('alert')}Health: ${esc(t.length > 90 ? t.slice(0, 90) + '…' : t)}</small>` : ''; }
function actRowHead(c) { return `${avatar(c, 44)}<span class="qn"><b>${esc(fullName(c))}</b><small>${esc(c.section + ' · ID ' + c.id)}</small>${healthLine(c)}</span>`; }
function actList(q) {
  const a = actNow(q), d = q.get('d') || today(), day = S.attendance[d] || {}, term = (UI.actq || '').trim().toLowerCase();
  const tm = q.get('g') || '';
  let kids = term.length >= 2 ? actFind(term) : S.children.filter(c => c.status !== 'Closed' && actOf(c).includes(a) && (!tm || actTeamOf(c, a) === tm));
  kids = kids.slice().sort((x, y) => fullName(x).localeCompare(fullName(y)));
  if (!kids.length) return `<p class="empty">${term.length >= 2 ? 'No child with this name.' : 'Nobody enrolled yet. Type a name above, or use Enrolment.'}</p>`;
  return kids.map(c => { const k = c.id + '@act:' + a, v = day[k]; return `<div class="qrow"><button class="qmain" data-act="actmark" data-d="${d}" data-id="${esc(k)}" data-c="${esc(c.id)}" data-a="${esc(a)}">${actRowHead(c)}${v ? '<span class="qmark P">Present</span>' : '<span class="qtick">Present</span>'}</button></div>`; }).join('');
}
function actEnrolList() {
  const term = (UI.actq || '').trim().toLowerCase(), G = actGroups();
  let kids = term.length >= 2 ? actFind(term) : S.children.filter(c => c.status !== 'Closed' && actOf(c).length);
  kids = kids.slice().sort((x, y) => fullName(x).localeCompare(fullName(y)));
  if (!kids.length) return `<p class="empty">${term.length >= 2 ? 'No child with this name.' : 'Nobody enrolled yet. Type a name above.'}</p>`;
  return kids.map(c => `<div class="qrow enr"><div class="qmain" style="cursor:default">${actRowHead(c)}</div><div class="qopts">${Object.entries(G).map(([g, L]) => L.map(x => `<button class="btn sm${actOf(c).includes(x) ? ' pri' : ''}" data-act="actenrol" data-c="${esc(c.id)}" data-a="${esc(x)}" aria-pressed="${actOf(c).includes(x)}">${actOf(c).includes(x) ? '✓ ' : ''}${esc(x)}</button>`).join('')).join('')}</div>${actOf(c).filter(x => ACT_TEAMS[x]).map(x => `<label class="sub" style="display:flex;gap:8px;align-items:center;margin:4px 0 0">${esc(x)} group <select class="in" style="width:auto" data-actteam="${esc(x)}" data-c="${esc(c.id)}"><option value="">Not set</option>${ACT_TEAMS[x].map(t => `<option${actTeamOf(c, x) === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}</div>`).join('');
}
function vActivities(r) {
  const q = r.q, G = actGroups(), tab = q.get('t') === 'enrol' ? 'enrol' : 'att', a = actNow(q), d = q.get('d') || today(), day = S.attendance[d] || {}, suf = '@act:' + a, m = d.slice(0, 7);
  const open = S.children.filter(c => c.status !== 'Closed'), enr = x => open.filter(c => actOf(c).includes(x)).length;
  const head = `<div class="top"><div><h1>Activities <span class="chip c-orange">Draft</span></h1><p class="lead">Sports and VET training.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg" role="group" aria-label="Attendance or enrolment"><a href="#" data-q="t=" class="${tab === 'att' ? 'on' : ''}">Attendance</a><a href="#" data-q="t=enrol" class="${tab === 'enrol' ? 'on' : ''}">Enrolment</a></div>${tab === 'att' ? `<input class="in" type="date" id="actdate" value="${d}" max="${today()}" style="width:auto" aria-label="Day">` : ''}<button class="btn sm" data-act="actxl">Export in Excel</button></div></div>`;
  const search = `<input class="in qsearch" id="actsearch" type="search" autocomplete="off" placeholder="${tab === 'att' ? 'Type a name, tap it' : 'Type a name'}" aria-label="Find a name" value="${esc(UI.actq || '')}">`;
  const refs = referTeamBox('Sports') + `<p style="margin:0 0 12px"><a class="btn" href="#/cases?s=Sports">Case studies</a></p>`;
  if (tab === 'enrol') return head + refs + `<div class="qtop">${search}<div class="qcount"><span>Tap a discipline to enrol. Tap again to remove.</span><span><b>${open.filter(c => actOf(c).length).length}</b> children enrolled</span></div></div>
  <div class="card" style="padding:0 8px"><div id="actlist">${actEnrolList()}</div></div>`;
  const n = Object.keys(day).filter(k => k.endsWith(suf)).length;
  const days = Object.keys(S.attendance).filter(x => x.slice(0, 7) === m && Object.keys(S.attendance[x]).some(k => k.endsWith(suf))).length;
  const mk = uniq(actIds(a, m + '-01', monthEnd(m)).map(id => child(id)).filter(Boolean));
  const tm = q.get('g') || '', T = ACT_TEAMS[a], view = q.get('v') === 'month' ? 'month' : 'day';
  const chips = Object.entries(G).map(([g, L]) => `<p class="sec" style="margin:6px 0 4px">${esc(g)}</p><div class="qchips">${L.map(x => `<a href="#" data-q="a=${esc(x)}&g=" class="${x === a ? 'on' : ''}">${esc(x)} · ${enr(x)}</a>`).join('')}</div>`).join('')
    + (T ? `<p class="sec" style="margin:6px 0 4px">${esc(a)} groups</p><div class="qchips"><a href="#" data-q="g=" class="${tm ? '' : 'on'}">All groups</a>${T.map(x => `<a href="#" data-q="g=${esc(x)}" class="${tm === x ? 'on' : ''}">${esc(x)} · ${open.filter(c => actOf(c).includes(a) && actTeamOf(c, a) === x).length}</a>`).join('')}</div>` : '')
    + `<div class="seg" role="group" aria-label="Day or month" style="margin:8px 0;width:fit-content"><a href="#" data-q="v=" class="${view === 'day' ? 'on' : ''}">Day</a><a href="#" data-q="v=month" class="${view === 'month' ? 'on' : ''}">Month view</a></div>`;
  if (view === 'month') { const mm = q.get('m') || thisMonth(); return head + refs + chips + `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px"><span class="sub">Tap a cell: P = present. Tap again to clear.</span>${monthPicker(mm)}</div><section class="card" style="padding:6px">${actGrid(a, mm, tm)}</section>`; }
  return head + refs + chips + `
  <div class="qtop">${search}<div class="qcount"><span><b>${esc(a)}</b> · ${esc(fmtDate(d))} · <b>${n}</b> present of ${enr(a)} enrolled</span><span>${esc(fmtMonth(m))}: ${days} ${days === 1 ? 'day' : 'days'} · ${mk.length} children (F ${mk.filter(c => c.sex === 'F').length}, M ${mk.filter(c => c.sex === 'M').length})</span></div></div>
  <div class="card" style="padding:0 8px"><div id="actlist">${actList(q)}</div></div>`;
}
/* the month of a discipline as a grid, as for Luigi (comment of 24/11): one row per child, one column per day, a tap marks present */
function actGrid(a, m, tm) {
  const suf = '@act:' + a, n = Number(monthEnd(m).slice(8)), days = []; for (let i = 1; i <= n; i++) days.push(m + '-' + String(i).padStart(2, '0'));
  const ids = new Set(actIds(a, m + '-01', monthEnd(m))); S.children.forEach(c => { if (c.status !== 'Closed' && actOf(c).includes(a)) ids.add(String(c.id)); });
  const kids = Array.from(ids).map(id => child(id)).filter(c => c && (!tm || actTeamOf(c, a) === tm)).sort((x, y) => fullName(x).localeCompare(fullName(y)));
  if (!kids.length) return '<p class="empty">Nobody enrolled in this group. Use Enrolment.</p>';
  const wd = d => new Date(d + 'T00:00:00').getDay(), T = today();
  const head = `<tr><th class="lname">Name</th>${days.map(d => `<th class="${[0, 6].includes(wd(d)) ? 'we' : ''}${d === T ? ' td' : ''}">${'SMTWTFS'[wd(d)]}<br>${Number(d.slice(8))}</th>`).join('')}<th>Days</th></tr>`;
  const body = kids.map(c => { const v = days.map(d => (S.attendance[d] || {})[c.id + suf] ? 'P' : ''); return `<tr data-id="${esc(c.id)}"><th class="lname" scope="row"><span class="lnm">${avatar(c, 28)}<span><a href="#/child/${esc(c.id)}">${esc(fullName(c))}</a>${actTeamOf(c, a) ? ` <small class="sub">${esc(actTeamOf(c, a))}</small>` : ''}</span></span></th>${days.map((d, i) => `<td class="lc${v[i] ? ' C' : ''}${[0, 6].includes(wd(d)) ? ' we' : ''}${d === T ? ' td' : ''}${d > T ? ' fut' : ''}" data-sact="cell" data-d="${d}" data-a="${esc(a)}" data-v="${v[i]}"><b class="gm">${v[i]}</b></td>`).join('')}<td class="n" data-t="T">${v.filter(Boolean).length}</td></tr>`; }).join('');
  const foot = `<tr><th class="lname">Present</th>${days.map(d => `<td class="n" data-fd="${d}">${kids.filter(c => (S.attendance[d] || {})[c.id + suf]).length || ''}</td>`).join('')}<td></td></tr>`;
  return `<div class="tw lwrap"><table class="lgrid actgrid"><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('td[data-sact="cell"]') : null; if (!b || GUEST) return;
  const d = b.dataset.d; if (d > today()) return toast('This day has not come yet');
  const tr = b.closest('tr'), c = child(tr.dataset.id), a = b.dataset.a, k = tr.dataset.id + '@act:' + a; if (!c) return;
  S.attendance[d] = S.attendance[d] || {}; touchAtt(d, k);
  const on = !b.dataset.v; if (on) S.attendance[d][k] = 'P'; else delete S.attendance[d][k]; save();
  b.dataset.v = on ? 'P' : ''; b.classList.toggle('C', on); const gm = b.querySelector('.gm'); if (gm) gm.textContent = on ? 'P' : '';
  const tt = tr.querySelector('[data-t=T]'); if (tt) tt.textContent = tr.querySelectorAll('td[data-sact][data-v="P"]').length;
  const tb = b.closest('table'), f = tb.querySelector(`[data-fd="${d}"]`); if (f) f.textContent = tb.querySelectorAll(`td[data-sact][data-d="${d}"][data-v="P"]`).length || '';
});
function actEnrolSet(c, a, on) { const L = actOf(c).filter(x => x !== a); if (on) L.push(a); c.activities = L; if (on && ACT_TEAMS[a] && !actTeamOf(c, a)) actTeamSet(c, a, actTeamGuess(c, a)); c.updatedAt = today(); }
function actMark(b) {
  if (GUEST) return; const d = b.dataset.d, id = b.dataset.id, c = child(b.dataset.c); S.attendance[d] = S.attendance[d] || {}; touchAtt(d, id);
  if (S.attendance[d][id]) delete S.attendance[d][id]; else { S.attendance[d][id] = 'P'; if (c && !actOf(c).includes(b.dataset.a)) actEnrolSet(c, b.dataset.a, true); }
  const had = !!(UI.actq || ''); UI.actq = ''; save(); render(); if (had) { const s = $('#actsearch'); if (s) s.focus(); }
}
function actEnrol(b) {
  if (GUEST) return; const c = child(b.dataset.c); if (!c) return; actEnrolSet(c, b.dataset.a, !actOf(c).includes(b.dataset.a)); save(); UI.actOpen = String(c.id); /* the box of this child stays open while the buttons are used */
  const t = $('#actlist'); if (t && route().path === 'activities') t.innerHTML = actEnrolList(); else render();
}
/* in the file of the child: two small boxes to enrol in sports and in VET training */
function actBoxes(c) {
  const boxes = `<div class="grid g2 actbox" style="margin-bottom:12px">${Object.entries(actGroups()).map(([g, L]) => `<section class="card" style="padding:12px 14px"><h3 style="margin:0 0 8px">${esc(g)}</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${L.map(x => `<button class="btn sm${actOf(c).includes(x) ? ' pri' : ''}" data-act="actenrol" data-c="${esc(c.id)}" data-a="${esc(x)}" aria-pressed="${actOf(c).includes(x)}">${actOf(c).includes(x) ? '✓ ' : ''}${esc(x)}</button>`).join('')}</div></section>`).join('')}</div>`;
  /* the buttons stay open for the people of Sports, who enrol the children; everyone else sees one line with what the child does */
  if (hasFlag('Sports') || UI.actOpen === String(c.id)) return boxes;
  const mine = actOf(c);
  return `<details class="card more" id="actfold" style="margin-bottom:12px"><summary>Sports and VET training: ${mine.length ? esc(mine.join(', ')) : 'none'}</summary><div style="margin-top:12px">${boxes}</div></details>`;
}
function actXlsx() {
  const q = route().q, a = actNow(q), all = actAll();
  if (q.get('t') === 'enrol') { const kids = S.children.filter(c => c.status !== 'Closed' && actOf(c).length).sort((x, y) => fullName(x).localeCompare(fullName(y))); return downloadXlsx('activities-enrolment-' + today(), [{ name: 'Enrolment', rows: [['ID', 'Name', 'Sex', 'Age', 'Centre'].concat(all)].concat(kids.map(c => [c.id, fullName(c), c.sex || '', curAge(c), (SECTIONS[c.section] || {}).label || ''].concat(all.map(x => actOf(c).includes(x) ? 1 : '')))), filter: true }]); }
  const m = (q.get('d') || today()).slice(0, 7), suf = '@act:' + a;
  const days = Object.keys(S.attendance).filter(x => x.slice(0, 7) === m && Object.keys(S.attendance[x]).some(k => k.endsWith(suf))).sort();
  const ids = new Set(actIds(a, m + '-01', monthEnd(m))); S.children.forEach(c => { if (c.status !== 'Closed' && actOf(c).includes(a)) ids.add(String(c.id)); });
  const kids = Array.from(ids).map(id => [id, child(id)]).filter(x => x[1]).sort((x, y) => fullName(x[1]).localeCompare(fullName(y[1])));
  const rows = [['ID', 'Name', 'Sex', 'Age', 'Centre'].concat(days).concat(['Days present'])].concat(kids.map(([id, c]) => { const v = days.map(x => S.attendance[x][id + suf] ? 1 : ''); return [c.id, fullName(c), c.sex || '', curAge(c), (SECTIONS[c.section] || {}).label || ''].concat(v).concat([v.filter(Boolean).length]); }));
  downloadXlsx('activity-' + a + '-' + m, [{ name: a.slice(0, 28), rows, filter: true }]);
}
document.addEventListener('input', e => { if (e.target.id === 'actsearch') { UI.actq = e.target.value; const t = $('#actlist'); if (t) t.innerHTML = route().q.get('t') === 'enrol' ? actEnrolList() : actList(route().q); } });
document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.actteam && !GUEST) { const c = child(t.dataset.c); if (c) { actTeamSet(c, t.dataset.actteam, t.value); save(); toast('Group saved'); } } });
document.addEventListener('change', e => { if (e.target.id === 'actdate' && e.target.value) location.hash = '#/activities?a=' + encodeURIComponent(actNow(route().q)) + '&d=' + e.target.value; });

/* ---------- Logframe v0.6 of 23 Nov 2026 (Drive: "Cicetekelo - Logframe v0.6"): what the app can already count (draft, supervisors only).
   28 indicators in three components. A figure that another app or a register holds says where it comes from. ---------- */
function vLogframe(r) {
  if (!seesOverview()) return '<h1>Logframe</h1><p class="lead">Supervisors only.</p>';
  const m = r.q.get('m') || thisMonth(), Q = quarterOf(m), a = Q.start, b = Q.end, me = monthEnd(m) > today() ? today() : monthEnd(m);
  const ids = new Set();
  for (const d of Object.keys(S.attendance)) if (inRange(d, a, b)) for (const [k, v] of Object.entries(S.attendance[d])) if (v === 'P' || v === 'H' || v === 'B') ids.add(String(k).split('@')[0]);
  for (const s of S.outreach) if (inRange(s.date, a, b)) for (const id of s.children || []) ids.add(String(id));
  for (const v of S.visits) if (inRange(v.date, a, b)) ids.add(String(v.childId));
  for (const s of S.sessions) if (inRange(s.date, a, b)) for (const id of s.children || []) ids.add(String(id));
  const kidsOf = set => uniq(Array.from(set).map(id => child(id)).filter(Boolean));
  const reach = kidsOf(ids), LD = luigiTables(a, b).D, lu = LD.kids('all');
  const res = S.children.filter(c => centreOf(c) === 'Minsundu' && c.residence === 'Resident' && inCareOn(c, me));
  const rein = S.children.filter(c => inRange(c.reintegrationDate, a, b)), r24 = S.children.filter(c => c.reintegrationDate && c.reintegrationDate >= addDays(today(), -730));
  const pupils = S.children.filter(c => isCurrent(c) && dayType(c) && dayType(c) !== 'Not in school'), byType = {}; pupils.forEach(c => { const t = dayLabel(dayType(c)); byType[t] = (byType[t] || 0) + 1; });
  const sp = new Set(), sports = actGroups().Sports || []; S.children.forEach(c => { if (c.status !== 'Closed' && actOf(c).some(x => sports.includes(x))) sp.add(String(c.id)); });
  for (const d of Object.keys(S.attendance)) if (inRange(d, a, b)) for (const k of Object.keys(S.attendance[d])) { const i = k.indexOf('@act:'); if (i > 0 && sports.includes(k.slice(i + 5))) sp.add(k.slice(0, i)); }
  const val = L => `<b>${L.length}</b> <span class="sub">F ${L.filter(c => c.sex === 'F').length} · M ${L.filter(c => c.sex === 'M').length}</span>`;
  const src = t => `<span class="sub">${t}</span>`, EAT = src('In CYP EAT'), FIN = src('In CYP FIN'), FILE = src('Tracking file of the M&E focal point'), NY = src('Not recorded yet'), PS = src('Public statistics');
  const Y12 = Number(b.slice(0, 4)), PR = promotedIn(Y12);
  /* Component 3 (v0.6): what CYP EDU can say about its own use */
  const SEC7 = ['Luigi', 'Nkwazi', 'UCC', 'Youth', 'Family', 'School', 'Counseling'], rm = S.reports[m] || {}, repDone = SEC7.filter(k => typeof repState === 'function' ? repState(m, k).state === 'checked' : rm[k] && rm[k].prepared && rm[k].checked).length;
  const act = S.children.filter(isCurrent), full = act.filter(c => c.sex && c.dob && centreOf(c) && dayType(c));
  const G = [
    ['Programme reach', [
      ['R.1', 'Children and youth supported by CYP', Q.label, val(reach) + ` <span class="sub">· residents ${reach.filter(c => c.residence === 'Resident').length} · in transit ${reach.filter(c => c.residence === 'In transit').length}</span>`]]],
    ['Component 1 - Rehabilitation and inclusion', [
      ['SO1.1', 'Reintegrated children still at home (%)', 'Last 24 months', NY + ` <span class="sub">· ${r24.length} reintegrated</span>`],
      ['SO1.2', 'Supported pupils promoted to the next grade (%)', String(Y12), PR.all.length ? `<b>${Math.round(PR.ok.length / PR.all.length * 100)}%</b> <span class="sub">${PR.ok.length} of ${PR.all.length} pupils with an end-of-year result written</span>` : NY + ' <span class="sub">· write "End of the year" in the term result</span>'],
      ['OP1.1.1', 'Children reached by Luigi', Q.label, val(lu) + ` <span class="sub">· new ${lu.filter(c => LD.isNew(c)).length}</span>`],
      ['OP1.2.1', 'Residents at Minsundu', fmtDate(me), val(res) + ` <span class="sub">· in transit ${S.children.filter(c => centreOf(c) === 'Minsundu' && c.residence === 'In transit' && inCareOn(c, me)).length}</span>`],
      ['OP1.3.1', 'Children reintegrated', Q.label, val(rein)],
      ['OP1.4.1', 'Pupils supported in school', 'Today', val(pupils) + `<div class="sub">${Object.entries(byType).map(([t, n]) => esc(t) + ' ' + n).join(' · ')}</div><div class="sub">Holy Family pupils are not in the app.</div>`],
      ['OP1.5.1', 'Clinic consultations', 'Month', src('Clinic register')],
      ['OP1.5.2', 'Plates served per day', 'Month', EAT],
      ['OP1.6.1', 'Children and youth in coached sport', Q.label, val(kidsOf(sp)) + ' <span class="sub">· enrolled or present, from Activities</span>'],
      ['OP1.7.1', 'Trainees passing the TEVETA exam (%)', 'Year', src('TEVETA results')]]],
    ['Component 2 - Social enterprises and livelihoods', [
      ['SO2.1', 'Graduates in work (%)', 'Year', src('Yearly phone call to graduates')], ['SO2.2', 'Muchinga businesses still active (%)', 'Quarter', src('Muchinga visit records')],
      ['OP2.1.1', 'Youth working or on placement', 'Quarter', src('Staff lists of the enterprises')], ['OP2.2.1', 'Graduates placed with external employers', 'Quarter', src('Job coach records')],
      ['OP2.3.1', 'Families supported to start a business', 'Quarter', src('Muchinga records')], ['OP2.4.1', 'Adults in supported work (Mary Christine)', 'Month', src('Mary Christine register')]]],
    ['Component 3 - Monitoring and management system', [
      ['SO3.1', 'Logframe indicators produced from the apps on time (%)', 'Quarter', FILE],
      ['SO3.2', 'Approved spending linked to a budget line (%)', 'Month', FIN],
      ['OP3.1.1', 'Monitoring and management tools set up or strengthened and in use', 'Quarter', FILE],
      ['OP3.2.1', 'Section reports produced from CYP EDU', fmtMonth(m), `<b>${repDone}</b> <span class="sub">of 7 sections with the report of the month sent and checked</span>`],
      ['OP3.2.2', 'Children\'s records complete (%)', 'Today', act.length ? `<b>${Math.round(100 * full.length / act.length)}%</b> <span class="sub">${full.length} of ${act.length} active and semi-active children with sex, date of birth, centre and education written</span>` : NY],
      ['OP3.3.1', 'Spending recorded in CYP FIN (% of value paid)', 'Month', FIN], ['OP3.3.2', 'Paid requests with a receipt (%)', 'Month', FIN],
      ['OP3.4.1', 'Lunch services counted (% of service days)', 'Month', EAT], ['OP3.4.2', 'Weekly stock counts done (% of weeks)', 'Month', EAT]]],
    ['Impact', [
      ['OO.1', 'Youth NEET rate, Copperbelt (%)', 'Year', PS], ['OO.2', 'Secondary completion rate, Copperbelt (%)', 'Year', PS]]]
  ];
  const nAll = G.reduce((t, g) => t + g[1].length, 0);
  return `<div class="top"><div><h1>Logframe <span class="chip c-orange">Draft</span></h1><p class="lead">${esc(Q.label)}</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${monthPicker(m)}<button class="btn sm" data-act="csvtable" data-name="logframe-${esc(Q.label.replace(/\s+/g, '-'))}">Export in Excel</button></div></div>
  <div class="note">Draft. Logframe v0.6 of 23 Nov 2026: ${nAll} indicators. Where a figure is not counted here, the line says where it comes from. Check the figures with the sections. Targets not set.</div>
  <div class="card"><div class="tw"><table id="rtable" class="lftab"><thead><tr><th class="lfc">Component</th><th>Code</th><th>Indicator</th><th>Period</th><th>Value</th></tr></thead><tbody>${G.map(g => `<tr class="lfgroup nx"><th colspan="4" scope="colgroup">${esc(g[0])}</th></tr>` + g[1].map(x => `<tr><td class="lfc">${esc(g[0])}</td><td>${x[0]}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${x[3]}</td></tr>`).join('')).join('')}</tbody></table></div></div>`;
}

/* ---------- Counselling, group session: the children present that day in the centre, tick who took part ---------- */
function sessGroupHtml() {
  const f = document.querySelector('form[data-form="session"]'), v = k => f && f.elements[k] ? f.elements[k].value : '';
  const type = v('type') || 'Individual', date = v('date') || today(), centre = v('centre') || CENTRES[0];
  if (type !== 'Group') return '';
  UI.sessKids = UI.sessKids || new Set();
  const day = S.attendance[date] || {}, here = S.children.filter(c => c.status !== 'Closed' && centreOf(c) === centre && ['P', 'H'].includes(day[attKey(c, centre)]));
  return pickHtml('sess', { sel: UI.sessKids, here, hereLabel: 'Present at ' + (CENTRE_LABEL[centre] || centre) + ' on ' + fmtDate(date), def: centre, label: 'Group: tick who took part' });
}
function sessGroupDraw() { const b = document.getElementById('sessgroup'); if (!b) return; b.innerHTML = sessGroupHtml(); }
PICK_ON.sess = { sel: () => (UI.sessKids = UI.sessKids || new Set()), draw: () => sessGroupDraw() };
document.addEventListener('change', e => {
  const el = e.target, f = el.closest ? el.closest('form[data-form="session"]') : null; if (!f) return;
  if (['type', 'date', 'centre'].includes(el.name)) { pickReset('sess'); sessGroupDraw(); }
});
