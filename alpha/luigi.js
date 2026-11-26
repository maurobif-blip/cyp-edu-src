
/* ================= Luigi: database import, attendance grid, period reports, known-child check ================= */
const STREET_CATS = { A: 'A · sleeps on the street', B: 'B · street connected (goes home to sleep)' };
const WHERE_REASON = { Chichetekelo: 'Moved to another Cicetekelo centre', OtherFacility: 'Transferred to another partner', Family: 'Went back to the family', OtherCity: 'Moved to another town' };
function photos() { if (!S.photos) S.photos = {}; return S.photos; }
function photoOf(c) { return photos()[c.id] || ''; }
function avatar(c, size) {
  const p = photoOf(c), s = size || 34;
  return p ? `<img class="cph" data-name="${esc(fullName(c))}" src="${p}" alt="" style="width:${s}px;height:${s}px;border-radius:50%;object-fit:cover;flex:none">` : `<span class="av" style="width:${s}px;height:${s}px;font-size:${Math.max(12, Math.round(s / 3))}px">${esc(initials(fullName(c)))}</span>`;
}
/* a tap on a child's photo shows it large; inside a button (planner, quick marking) the tap keeps doing what the button does */
function photoBig(src, name) {
  photoBigClose();
  const d = document.createElement('div'); d.id = 'phbox'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Photo of ' + name);
  d.innerHTML = `<figure><img src="${src}" alt="Photo of ${esc(name)}"><figcaption>${esc(name)}</figcaption><button type="button" class="btn">Close</button></figure>`;
  document.body.appendChild(d); d.querySelector('button').focus();
}
function photoBigClose() { const d = document.getElementById('phbox'); if (d) d.remove(); }
document.addEventListener('click', e => {
  if (document.getElementById('phbox')) { e.preventDefault(); e.stopPropagation(); photoBigClose(); return; }
  const im = e.target.closest && e.target.closest('img.cph'); if (!im || im.closest('button, label, [data-pact], .qrow')) return;
  e.preventDefault(); e.stopPropagation(); photoBig(im.src, im.dataset.name || '');
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') photoBigClose(); });
window.addEventListener('hashchange', photoBigClose);
function childUsed(id) {
  id = String(id);
  return S.visits.some(v => String(v.childId) === id) || S.events.some(e => String(e.childId) === id) || S.moves.some(m => String(m.childId) === id) || S.sessions.some(x => (x.children || []).map(String).includes(id))
    || Object.values(S.attendance).some(d => d && d[id] != null) || S.outreach.some(o => !o.imported && (o.children || []).map(String).includes(id));
}

/* ---------- import of the Luigi tool (users.db of Riccardo's Luigi app) ---------- */
function importLuigiDb(db) {
  noStamp();
  const out = { added: 0, updated: 0, sessions: 0, marks: 0, photos: 0, removedList: 0, linked: [] };
  // the January name list is replaced by the full database
  for (const c of S.children.slice()) {
    if (!String(c.importedFrom || '').startsWith('Luigi list') || childUsed(c.id)) continue;
    S.children.splice(S.children.indexOf(c), 1); out.removedList++;
  }
  S.outreach = S.outreach.filter(o => !o.imported);
  const asOf = db.asOf || today();
  for (const u of db.users || []) {
    const id = 'L' + u.id, t = v => String(v == null ? '' : v).trim();
    const where = t(u.current_location) || 'InCity';
    const f = {
      name: t(u.name), surname: t(u.surname), nickname: clean(u.nickname), sex: t(u.gender).toUpperCase().startsWith('F') ? 'F' : 'M',
      age: u.age == null || u.age === '' ? '' : Number(u.age), ageAsOf: t(u.insert_date).slice(0, 10) || asOf, dob: '',
      section: 'Luigi', residence: 'Non-resident', status: where === 'InCity' ? 'Active' : 'Closed',
      entryDate: t(u.entrance_date).slice(0, 10), compound: clean(u.origin_place), familyAddress: clean(u.familyloc), languages: clean(u.languages),
      father: clean(u.father), mother: clean(u.mother), contact: clean(u.contact), guardianName: clean(u.responsible_person), familyBackground: clean(u.family_status),
      disabilities: clean(u.medical), notes: t(u.notes),
      streetCat: t(u.category).toUpperCase() === 'B' ? 'B' : 'A', streetPlace: clean(u.location_details), whereNow: where,
      transferDate: t(u.transfer_date).slice(0, 10), connectionDate: t(u.connection_date).slice(0, 10),
      closeReason: where === 'InCity' ? '' : WHERE_REASON[where] || 'Other', closeDate: where === 'InCity' ? '' : t(u.transfer_date).slice(0, 10),
      luigiId: u.id, importedFrom: 'Luigi tool (database of ' + asOf + ')'
    };
    let c = child(id);
    if (!c) {
      c = Object.assign({ id, referredBy: 'Luigi outreach', responsible: '', programmes: [], support: [], guardianRelation: '', otherRelatives: '', schoolType: '', schoolName: '', grade: '', skill: '', educationAtEntry: '', medical: '', objectives: '', reintegrationDate: '', createdAt: t(u.insert_date).slice(0, 10) || asOf, sectionToCheck: false }, f);
      S.children.push(c); out.added++;
      if (c.status === 'Closed' && c.closeDate) S.moves.push({ id: uid('m'), childId: id, type: 'closed', date: c.closeDate, by: '', reason: c.closeReason, note: f.streetPlace ? 'Luigi tool: ' + where + ', ' + f.streetPlace : 'Luigi tool: ' + where });
    } else {
      // a record changed here is not overwritten: only empty fields are filled
      // a child who moved on to Nkwazi or Minsundu keeps the section and status recorded there
      const moved = c.section !== 'Luigi', KEEP = ['section', 'status', 'residence', 'closeReason', 'closeDate', 'entryDate', 'guardianName', 'compound', 'familyAddress', 'contact', 'familyBackground'];
      for (const k of Object.keys(f)) { if (moved && KEEP.includes(k) && c[k] !== '' && c[k] != null) continue; if (!c.updatedAt || c[k] === '' || c[k] == null) c[k] = f[k]; }
      out.updated++;
    }
  }
  const add = (date, type, id) => {
    const kid = child('L' + id); if (!kid) return; const cid = String(kid.id);
    const sid = 'LDB|' + date + '|' + type;
    let s = S.outreach.find(x => x.id === sid) || S.outreach.find(x => x.date === date && x.type === type);
    if (!s) { s = { id: sid, date, type, staff: 'Luigi team', children: [], notes: '', by: '', src: 'luigiDb' }; S.outreach.push(s); out.sessions++; }
    if (!s.children.includes(cid)) { s.children.push(cid); out.marks++; }
  };
  for (const [id, date, st] of db.presences || []) add(date, Number(st) === 1 ? 'Drop-in' : 'Day outreach', id);
  for (const [id, date] of db.nights || []) add(date, 'Night outreach', id);
  for (const u of db.users || []) { const c = child('L' + u.id); if (c && !c.updatedAt && !(db.photos || {})[u.id]) delete photos()['L' + u.id]; }
  for (const [id, b64] of Object.entries(db.photos || {})) if (child('L' + id)) { photos()['L' + id] = 'data:image/jpeg;base64,' + b64; out.photos++; }
  // same child already in the Minsundu or Nkwazi records?
  for (const c of S.children) {
    if (c.luigiId == null || c.sameAs) continue;
    const k = nameKey(fullName(c));
    const cand = S.children.filter(x => x.luigiId == null && x.section !== 'Luigi' && nameKey(fullName(x)) === k && (curAge(x) === '' || curAge(c) === '' || Math.abs(curAge(x) - curAge(c)) <= 3));
    if (cand.length === 1) { c.sameAs = String(cand[0].id); cand[0].sameAs = String(c.id); out.linked.push([c, cand[0]]); }
  }
  S.meta.luigiDb = asOf;
  return out;
}

/* ---------- periods ---------- */
function periodRange(m, p) {
  const y = m.slice(0, 4), mo = Number(m.slice(5)), mm = n => y + '-' + String(n).padStart(2, '0');
  if (p === 'Q') { const q = Math.floor((mo - 1) / 3); return { a: monthStart(mm(q * 3 + 1)), b: monthEnd(mm(q * 3 + 3)), label: 'Quarter ' + (q + 1) + ', ' + y + ' (' + ['January to March', 'April to June', 'July to September', 'October to December'][q] + ')' }; }
  if (p === 'S') { const s = mo <= 6 ? 0 : 1; return { a: monthStart(mm(s * 6 + 1)), b: monthEnd(mm(s * 6 + 6)), label: (s ? 'July to December ' : 'January to June ') + y }; }
  if (p === '9') return { a: y + '-01-01', b: y + '-09-30', label: 'January to September ' + y };
  if (p === 'Y') return { a: y + '-01-01', b: y + '-12-31', label: 'Year ' + y };
  return { a: monthStart(m), b: monthEnd(m), label: fmtMonth(m) };
}
const PERIODS = [['M', 'Month'], ['Q', 'Quarter'], ['S', 'Semester'], ['9', '9 months'], ['Y', 'Year']];
function periodSeg(p) { return `<div class="seg segp" role="group" aria-label="Period">${PERIODS.map(([k, l]) => `<a href="#" data-q="p=${k}" class="${p === k ? 'on' : ''}">${l}</a>`).join('')}</div>`; }

/* ---------- Luigi report: same tables as the Luigi tool and the Word report ---------- */
const L_COLS = [['day', 'Day street outreach'], ['dropin', 'Drop-in centre'], ['night', 'Night street outreach'], ['other', 'Taken to other stakeholders'], ['mins', 'Taken to Minsundu'], ['nkw', 'Taken to Nkwazi'], ['conn', 'Connected to the street'], ['all', 'Total worked with']];
function luigiReportData(a, b) {
  const sets = { day: new Set(), dropin: new Set(), night: new Set(), other: new Set(), mins: new Set(), nkw: new Set(), conn: new Set(), all: new Set() };
  const TY = { 'Day outreach': 'day', 'Drop-in': 'dropin', 'Night outreach': 'night' };
  for (const s of S.outreach) { if (!inRange(s.date, a, b) || !TY[s.type]) continue; for (const id of s.children || []) if (child(id)) sets[TY[s.type]].add(String(id)); }
  const back = [];
  for (const c of S.children) {
    if (c.luigiId == null || !inRange(c.transferDate, a, b)) continue;
    const pl = c.streetPlace || '';
    if (c.whereNow === 'Chichetekelo') sets[/nkwazi/i.test(pl) ? 'nkw' : 'mins'].add(String(c.id));
    else if (c.whereNow === 'OtherFacility') sets[/mi[n]?sundu/i.test(pl) ? 'mins' : /nkwazi/i.test(pl) ? 'nkw' : 'other'].add(String(c.id));
    else { sets.other.add(String(c.id)); back.push(c); }
  }
  for (const x of movesIn('section', a, b, x => x.from === 'Luigi')) if (child(x.childId)) sets[x.to === 'Nkwazi' ? 'nkw' : 'mins'].add(String(x.childId));
  for (const x of movesIn('closed', a, b, x => x.reason === 'Transferred to another partner')) { const c = child(x.childId); if (c && c.section === 'Luigi' && c.luigiId == null) sets.other.add(String(c.id)); }
  for (const id of new Set([...sets.day, ...sets.dropin])) { const c = child(id); if (c && c.streetCat === 'B') sets.conn.add(id); }
  for (const k of Object.keys(sets)) if (k !== 'all') for (const id of sets[k]) sets.all.add(id);
  const kids = k => [...sets[k]].map(child).filter(Boolean);
  const isNew = c => inRange(c.entryDate, a, b);
  return { sets, kids, isNew, back };
}
function originKey(c) { return (String(c.compound || '').split(/[-(,]/)[0].trim() || 'Not recorded').toUpperCase(); }
function luigiTables(a, b) {
  const D = luigiReportData(a, b), all = D.kids('all');
  const cnt = (k, sex, kind) => D.kids(k).filter(c => (!sex || c.sex === sex) && (kind == null || D.isNew(c) === kind)).length;
  const row = (l1, l2, sex, kind) => [l1, l2].concat(L_COLS.map(([k]) => cnt(k, sex, kind)));
  const main = [['Activities', 'Gender'].concat(L_COLS.map(c => c[1])),
    row('Known children/youths', 'Boys', 'M', false), row('Known children/youths', 'Girls', 'F', false), row('New children/youths', 'Boys', 'M', true), row('New children/youths', 'Girls', 'F', true),
    row('Total children/youths', 'Boys', 'M', null), row('Total children/youths', 'Girls', 'F', null), row('', 'Total', '', null)];
  const pivot = (keyFn, sortFn, head) => {
    const keys = uniq(all.map(keyFn)).sort(sortFn);
    const line = (l, f) => [l].concat(keys.map(k => all.filter(c => keyFn(c) === k && f(c)).length)).concat([all.filter(f).length]);
    return [[head].concat(keys).concat(['Total']), line('Boys', c => c.sex !== 'F'), line('Girls', c => c.sex === 'F'), line('Total', () => true)];
  };
  const origin = pivot(originKey, (x, y) => x.localeCompare(y), 'Place of origin');
  const ages = pivot(c => curAge(c) === '' ? 'Not known' : String(curAge(c)), (x, y) => (Number(x) || 99) - (Number(y) || 99), 'Age');
  const cat = [['Street situation', 'Day outreach', 'Drop-in centre', 'Night outreach', 'Boys', 'Girls', 'Total worked with']];
  for (const [k, l] of [['A', 'A · sleeps on the street'], ['B', 'B · street connected (goes home to sleep)']]) {
    const f = c => c.streetCat === k;
    cat.push([l, D.kids('day').filter(f).length, D.kids('dropin').filter(f).length, D.kids('night').filter(f).length, all.filter(c => f(c) && c.sex !== 'F').length, all.filter(c => f(c) && c.sex === 'F').length, all.filter(f).length]);
  }
  const nocat = all.filter(c => !c.streetCat);
  if (nocat.length) cat.push(['Not recorded', D.kids('day').filter(c => !c.streetCat).length, D.kids('dropin').filter(c => !c.streetCat).length, D.kids('night').filter(c => !c.streetCat).length, nocat.filter(c => c.sex !== 'F').length, nocat.filter(c => c.sex === 'F').length, nocat.length]);
  const lv = S.visits.filter(v => inRange(v.date, a, b) && ((child(v.childId) || {}).section === 'Luigi' || visitTeam(v) === 'Luigi'));
  const visits = [['Home visits to Luigi children', 'Visits', 'Children']].concat(uniq(lv.map(v => v.purpose)).map(p => [p, lv.filter(v => v.purpose === p).length, uniq(lv.filter(v => v.purpose === p).map(v => String(v.childId))).length])).concat([['Total', lv.length, uniq(lv.map(v => String(v.childId))).length]]);
  const ss = S.outreach.filter(s => inRange(s.date, a, b) && L_SHEETS.some(o => o.type === s.type)), who = {};
  for (const s of ss) { const ids = (s.staffIds || []).length ? s.staffIds.map(staffName) : [s.staff || 'Not recorded']; for (const nm of ids) { const r = who[nm] = who[nm] || { 'Drop-in': new Set(), 'Day outreach': new Set(), 'Night outreach': new Set() }; r[s.type].add(s.date); } }
  const days = t => uniq(ss.filter(s => s.type === t).map(s => s.date)).length;
  const staffT = [['Staff', 'Drop-in days', 'Day outreach days', 'Night outreach nights']].concat(Object.keys(who).sort((x, y) => (x === 'Not recorded') - (y === 'Not recorded') || x.localeCompare(y)).map(nm => [nm, who[nm]['Drop-in'].size, who[nm]['Day outreach'].size, who[nm]['Night outreach'].size])).concat([['Total days with the activity', days('Drop-in'), days('Day outreach'), days('Night outreach')]]);
  const bg = f => { const x = all.filter(f); return [x.filter(c => c.sex !== 'F').length, x.filter(c => c.sex === 'F').length, x.length]; };
  const extra = [['Children met in the period', 'Boys', 'Girls', 'Total'], ['With relatives on the street'].concat(bg(c => c.relStreet === 'Yes')), ['Back on the street after a service'].concat(bg(c => !!c.backStreet))]
    .concat(BACK_OPTS.filter(([k]) => all.some(c => c.backStreet === k)).map(([k, lab]) => ['   ' + lab].concat(bg(c => c.backStreet === k))));
  const findings = [['Date', 'Sheet', 'Done by', 'Places and facts', 'Findings: assessment']].concat(ss.filter(s => s.findings || s.notes).sort((x, y) => x.date.localeCompare(y.date)).map(s => [fmtDate(s.date), (L_SHEETS.find(o => o.type === s.type) || {}).label || s.type, sessStaff(s), s.notes || '', s.findings || '']));
  return { D, main, origin, ages, cat, visits, all, staffT, extra, findings };
}
function tHtml(rows, cls, id) {
  return `<div class="tw"><table class="rt ${cls || ''}"${id ? ` id="${id}"` : ''}><thead><tr>${rows[0].map((h, i) => `<th class="${i && cls !== 'ltmain' ? 'n' : i > 1 ? 'n' : ''}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr${/^Total/.test(r[0]) || r[1] === 'Total' ? ' style="font-weight:600"' : ''}>${r.map((v, i) => `<td class="${typeof v === 'number' ? 'n' : ''}">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function luigiReportHtml(a, b, label) {
  const T = luigiTables(a, b), D = T.D;
  const names = L_COLS.map(([k, l]) => { const ks = D.kids(k).sort((x, y) => fullName(x).localeCompare(fullName(y))); return ks.length ? `<p style="margin:6px 0"><b>${esc(l)} (${ks.length})</b>: ${ks.map(c => `<a href="#/child/${esc(c.id)}">${esc(fullName(c))}</a>${D.isNew(c) ? ' (new)' : ''}`).join(', ')}</p>` : ''; }).join('');
  return `${tHtml(T.main, 'ltmain', 'rtable')}
    <p class="sub" style="margin:8px 0 0">A child counts in each column and once in the total.</p>
    <details style="margin-top:8px"><summary class="sub" style="cursor:pointer">Names behind each column</summary>${names || '<p class="empty">Nobody in this period.</p>'}</details>
    <h3 style="margin-top:22px">Places the children come from</h3>${tHtml(T.origin)}
    <h3 style="margin-top:22px">Ages</h3>${tHtml(T.ages)}
    <h3 style="margin-top:22px">Sleeping on the street or going home</h3>${tHtml(T.cat)}
    <h3 style="margin-top:22px">Relatives on the street, children back on the street</h3>${tHtml(T.extra)}<p class="sub" style="margin:6px 0 0"></p>
    <h3 style="margin-top:22px">Counselling at Luigi</h3>${tHtml(counselLuigiTable(a, b))}<p class="sub" style="margin:6px 0 0">Counted from the sessions of the Counselling Section.</p>
    <h3 style="margin-top:22px">Home visits and family tracing by Luigi</h3>${T.visits.length > 2 ? tHtml(T.visits) : '<p class="empty">No visit to a Luigi child recorded in this period.</p>'}
    <h3 style="margin-top:22px">Who did the drop-in, the day outreach and the night outreach</h3>${T.staffT.length > 2 ? tHtml(T.staffT) + '<p class="sub" style="margin:6px 0 0">"Luigi team": days from the Luigi tool. "Not recorded": nobody ticked.</p>' : '<p class="empty">No activity recorded in this period.</p>'}
    <h3 style="margin-top:22px">Findings written on the daily sheets</h3>${T.findings.length > 1 ? tHtml(T.findings) : '<p class="empty">No findings written in this period.</p>'}`;
}

/* ---------- attendance: centre switch and the Luigi monthly sheets ---------- */
function centreSeg(centre) { return `<div class="seg regbar" role="group" aria-label="Register">${CENTRES.concat(['School', 'Literacy']).map(k => `<a href="#" data-q="c=${k}&g=&only=&sec=&gr=&sg=" class="${centre === k ? 'on' : ''}">${CENTRE_LABEL[k]}</a>`).join('')}<a href="#/activities?v=month">Sports</a></div>`; }
/* attIn is in nkwazi.js: a child is on the list of every centre he or she comes to */
/* the three month grids of Luigi: one sheet each, one tap marks, a second tap clears */
const L_MODE = { centre: { type: 'Drop-in', mark: 'C', total: 'Days in centre', tap: 'came to the centre', met: 'At the centre this month' }, day: { type: 'Day outreach', mark: 'S', total: 'Days on the street', tap: 'met on the street', met: 'Met on the street this month' }, night: { type: 'Night outreach', mark: 'S', total: 'Nights on the street', tap: 'slept on the street', met: 'Met at night this month' } };
function lMode(k) { return L_MODE[k] ? k : 'centre'; }
function luigiMonthMap(m, mode) {
  const T = L_MODE[lMode(mode)], map = {};
  for (const s of S.outreach) { if (!s.date || s.date.slice(0, 7) !== m || s.type !== T.type) continue; for (const id of s.children || []) (map[id] = map[id] || {})[s.date] = T.mark; }
  return map;
}
function luigiSet(id, date, kind, night) {
  id = String(id);
  const types = night ? ['Night outreach'] : ['Drop-in', 'Day outreach'];
  const chosen = kind ? (night ? 'Night outreach' : kind === 'C' ? 'Drop-in' : 'Day outreach') : '';
  for (const t of types) touchSheet(date, t).ch[id] = t === chosen ? 1 : 0;
  for (const s of S.outreach) if (s.date === date && types.includes(s.type)) s.children = (s.children || []).filter(x => String(x) !== id);
  if (kind) {
    const type = night ? 'Night outreach' : kind === 'C' ? 'Drop-in' : 'Day outreach';
    let s = S.outreach.find(x => x.date === date && x.type === type);
    luigiSess(date, type, true).children.push(id);
  }
  luigiClean();
}
/* the three daily sheets of Luigi: each one can be done by different staff */
const L_SHEETS = [
  { k: 'dropin', type: 'Drop-in', label: 'Drop-in centre', mark: 'Came to the centre', cls: 'P', color: '#319536' },
  { k: 'day', type: 'Day outreach', label: 'Day outreach', mark: 'Met on the street', cls: 'H', color: '#ECC000' },
  { k: 'night', type: 'Night outreach', label: 'Night outreach', mark: 'Slept on the street', cls: 'A', color: '#D44C47' }
];
function lSheet(k) { return L_SHEETS.find(x => x.k === k) || L_SHEETS[0]; }
function luigiSess(date, type, create) {
  let s = S.outreach.find(x => x.date === date && x.type === type);
  if (!s && create) { s = { id: 'LA|' + date + '|' + type, date, type, staff: '', staffIds: [], children: [], notes: '', by: USER ? USER.id : '' }; S.outreach.push(s); }
  return s;
}
function luigiClean() { S.outreach = S.outreach.filter(s => (s.children || []).length || s.notes || s.findings || (s.staffIds || []).length); }
function luigiToggle(id, date, type, on) {
  id = String(id); touchSheet(date, type).ch[id] = on ? 1 : 0;
  for (const s of S.outreach) if (s.date === date && s.type === type) s.children = (s.children || []).filter(x => String(x) !== id);
  if (on) luigiSess(date, type, true).children.push(id);
  luigiClean();
}
function sessStaff(s) { return s ? ((s.staffIds || []).map(staffName).join(', ') || s.staff || '') : ''; }
function luigiDaySets(d) {
  const o = {}; for (const sh of L_SHEETS) o[sh.k] = new Set();
  for (const s of S.outreach) if (s.date === d) { const sh = L_SHEETS.find(x => x.type === s.type); if (sh) for (const id of s.children || []) o[sh.k].add(String(id)); }
  return o;
}
function luigiStaffHtml(d, sh) {
  const s = luigiSess(d, sh.type), ids = s ? (s.staffIds || []) : [], n = luigiDaySets(d)[sh.k].size;
  const base = activeStaff().filter(x => staffAreas(x).includes('Luigi'));
  const extra = ids.map(id => S.staff.find(x => x.id === id)).filter(x => x && !base.includes(x));
  if (USER && !base.includes(USER) && !extra.includes(USER)) extra.push(USER);
  const others = activeStaff().filter(x => !base.includes(x) && !extra.includes(x)).sort((a, b) => a.name.localeCompare(b.name));
  const names = ids.map(staffName).join(', ') || (s && s.staff) || '';
  return `<details class="lstaff"${!isPhone() || UI.lstOpen ? ' open' : ''}><summary><span class="lbl">Who did the ${esc(sh.label.toLowerCase())} on this day?</span> ${names ? `<b>${esc(names)}</b>` : (n ? '<span class="chip c-orange">Tick the names</span>' : '<span class="sub">nobody ticked yet</span>')}${s && (s.notes || s.findings) ? ' <span class="chip c-green">notes written</span>' : ''}<span class="btn sm lstchg">Staff, notes, findings</span></summary>
    <div class="checks">${base.concat(extra).map(x => `<label><input type="checkbox" data-lstaff="${sh.k}" data-d="${d}" value="${esc(x.id)}"${ids.includes(x.id) ? ' checked' : ''}>${esc(x.name)}</label>`).join('')}
      <select class="in" data-lstaffadd="${sh.k}" data-d="${d}" style="width:auto;min-height:44px" aria-label="Add another person"><option value="">Add another person</option>${others.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></div>
    ${s && s.staff && !ids.length ? `<div class="sub">Recorded before as: ${esc(s.staff)}</div>` : ''}
    <div class="fs two" style="margin-top:8px"><label class="f">Places and facts of the day<textarea class="in" rows="2" data-lnote="${sh.k}" data-lf="notes" data-d="${d}" placeholder="Where you went, what happened">${esc(s ? s.notes || '' : '')}</textarea></label>
    <label class="f">Findings: what is your assessment?<textarea class="in" rows="2" data-lnote="${sh.k}" data-lf="findings" data-d="${d}" placeholder="What you understood today about the children and the street: new faces, changes, risks, what to do next">${esc(s ? s.findings || '' : '')}</textarea></label></div>${s && !GUEST ? `<p style="margin:10px 0 0"><button type="button" class="btn sm danger" data-dact="clearsheet" data-k="${sh.k}" data-d="${d}">Cancel this sheet</button></p>` : ''}</details>`;
}
function luigiKids(m, mode) {
  const map = luigiMonthMap(m, mode), cat = route().q.get('lcat') || '', term = (UI.lattq || '').trim().toLowerCase(), seen = route().q.get('lseen') === '1';
  const kids = S.children.filter(c => c.section === 'Luigi' && (c.status !== 'Closed' || map[c.id])
    && (!cat || (c.streetCat || '') === cat) && (!seen || map[c.id]) && (!term || [c.id, c.name, c.surname, c.nickname, c.compound].join(' ').toLowerCase().includes(term)))
    .sort((x, y) => (!!map[y.id] - !!map[x.id]) || fullName(x).localeCompare(fullName(y)));
  return { kids, map };
}
/* the month grid opens on today: no sideways search for the day */
function luigiGridToday() { const t = document.querySelector('.lgrid thead th.td'), w = t && t.closest('.lwrap'); if (w) w.scrollLeft = Math.max(0, t.offsetLeft - w.clientWidth / 2); }
/* the other two sheets of the same day, shown small in the corner of the cell (beta 1.5: the month grid is the easiest way to mark, comment of 24/11) */
const L_OTHER = { centre: [['day', 'd', 'Day outreach'], ['night', 'n', 'Night outreach']], day: [['centre', 'c', 'Drop-in centre'], ['night', 'n', 'Night outreach']], night: [['centre', 'c', 'Drop-in centre'], ['day', 'd', 'Day outreach']] };
const L_SHEET_OF = { centre: 'dropin', day: 'day', night: 'night' };
function luigiGrid(m, mode) {
  mode = lMode(mode); const T = L_MODE[mode], { kids, map } = luigiKids(m, mode), n = Number(monthEnd(m).slice(8)), days = [];
  const others = L_OTHER[mode].map(([k, l, t]) => ({ map: luigiMonthMap(m, k), l, t }));
  const oth = (id, d) => { const o = others.filter(x => (x.map[id] || {})[d]); return o.length ? `<span class="cyp-cellnote" aria-label="Also: ${esc(o.map(x => x.t).join(', '))}">${o.map(x => x.l).join(' ')}</span>` : ''; };
  for (let i = 1; i <= n; i++) days.push(m + '-' + String(i).padStart(2, '0'));
  if (!kids.length) return '<p class="empty">No child matches.</p>';
  const wd = d => new Date(d + 'T00:00:00').getDay();
  const head = `<tr><th class="lname">Name</th>${days.map(d => `<th class="${[0, 6].includes(wd(d)) ? 'we' : ''}${d === today() ? ' td' : ''}">${d > today() ? `${'SMTWTFS'[wd(d)]}<br>${Number(d.slice(8))}` : `<a href="#" data-q="lt=today&ld=${d}&ls=${L_SHEET_OF[mode]}" title="Open the sheet of this day: staff, notes, findings">${'SMTWTFS'[wd(d)]}<br>${Number(d.slice(8))}</a>`}</th>`).join('')}<th>${mode === 'night' ? 'Nights' : 'Days'}</th></tr>`;
  const nMet = kids.filter(c => map[c.id]).length, sep = (t, k) => `<tr class="gsep"><th class="lname">${t} · ${k}</th><td colspan="${days.length + 1}"></td></tr>`;
  const body = kids.map((c, i) => { const r = map[c.id] || {}; const vals = days.map(d => r[d] || '');
    return `${nMet && i === 0 ? sep(T.met, nMet) : ''}${nMet && i === nMet && nMet < kids.length ? sep('Everyone else, A to Z', kids.length - nMet) : ''}<tr data-id="${esc(c.id)}"><th class="lname" scope="row"><span class="lnm">${avatar(c, 28)}<span><a href="#/child/${esc(c.id)}">${esc(fullName(c))}</a>${c.nickname ? ` <span class="sub">"${esc(c.nickname)}"</span>` : ''} <span class="lcat ${c.streetCat || ''}" title="${esc(STREET_CATS[c.streetCat] || 'Street situation not recorded')}">${esc(c.streetCat || '?')}</span></span></span></th>${days.map((d, i) => `<td class="lc ${vals[i]}${[0, 6].includes(wd(d)) ? ' we' : ''}${d === today() ? ' td' : ''}${d > today() ? ' fut' : ''}" data-lact="cell" data-d="${d}" data-v="${vals[i]}">${oth(c.id, d)}<b class="gm">${vals[i]}</b></td>`).join('')}<td class="ln" data-t="T">${vals.filter(v => v).length}</td></tr>`; }).join('');
  const foot = `<tr class="lfoot"><th class="lname">Children marked</th>${days.map(d => `<td data-fd="${d}">${kids.filter(c => (map[c.id] || {})[d]).length || ''}</td>`).join('')}<td></td></tr>`;
  return `<div class="tw lwrap"><table class="lgrid" data-mode="${mode}"><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div>`;
}
function luigiSumData(year) {
  const st = {};
  for (const s of S.outreach) { if (!s.date || s.date.slice(0, 4) !== year) continue; const k = s.type === 'Drop-in' ? 'c' : s.type === 'Day outreach' ? 's' : s.type === 'Night outreach' ? 'n' : null; if (!k) continue;
    for (const id of s.children || []) { const r = st[id] = st[id] || { c: 0, s: 0, n: 0, last: '' }; r[k]++; if (s.date > r.last) r.last = s.date; } }
  const kids = S.children.filter(c => c.section === 'Luigi' || st[c.id] && c.luigiId != null);
  return { st, kids, lu: kids.filter(c => c.section === 'Luigi') };
}
/* the rows of the summary, with the filters and the order chosen on the page */
function luigiSumRows(year) {
  const q = route().q, { st, kids } = luigiSumData(year), term = (UI.lattq || '').trim().toLowerCase();
  const cat = q.get('fcat') || '', num = k => q.get(k) || '', fg = q.get('fg') || '', fl = q.get('fl') || '', mNow = today().slice(0, 7);
  const okNum = (v, f) => !f || (f === '0' ? !v : f === '1' ? v >= 1 : f === '5' ? v >= 5 : f === '10' ? v >= 10 : true);
  let rows = kids.filter(c => (c.status !== 'Closed' || st[c.id]) && (!term || [c.id, c.name, c.surname, c.nickname].join(' ').toLowerCase().includes(term))).map(c => ({ c, r: st[c.id] || { c: 0, s: 0, n: 0, last: '' } })).map(x => Object.assign(x, { gone: x.r.last ? daysBetween(x.r.last, today()) : null }));
  rows = rows.filter(x => (!cat || (cat === 'none' ? !x.c.streetCat : x.c.streetCat === cat)) && okNum(x.r.c, num('fc')) && okNum(x.r.s, num('fs')) && okNum(x.r.n, num('fn'))
    && (!fg || (fg === 'never' ? x.gone == null : fg === 'lt7' ? x.gone != null && x.gone < 7 : fg === '7' ? x.gone != null && x.gone >= 7 : fg === '30' ? x.gone != null && x.gone >= 30 : true))
    && (!fl || (fl === 'never' ? !x.r.last : fl === 'month' ? x.r.last.slice(0, 7) === mNow : fl === 'before' ? !!x.r.last && x.r.last.slice(0, 7) < mNow : true)));
  const so = q.get('lso') || 'gone', dir = (q.get('lsd') || 'desc') === 'asc' ? 1 : -1;
  const val = x => so === 'name' ? fullName(x.c).toLowerCase() : so === 'cat' ? (x.c.streetCat || 'z') : so === 'c' ? x.r.c : so === 's' ? x.r.s : so === 'n' ? x.r.n : so === 'last' ? (x.r.last || '') : (x.gone == null ? -1 : x.gone);
  return rows.sort((a, b) => { const va = val(a), vb = val(b); return (va < vb ? -1 : va > vb ? 1 : 0) * dir || fullName(a.c).localeCompare(fullName(b.c)); });
}
function luigiSummary(year) {
  const q = route().q, { st, kids, lu } = luigiSumData(year), rows = luigiSumRows(year);
  const total = kids.filter(c => c.status !== 'Closed' || st[c.id]).length;
  const k = (n, l) => `<div class="tile"><b>${n}</b><span>${l}</span></div>`;
  const so = q.get('lso') || 'gone', sd = q.get('lsd') || 'desc';
  const th = (key, label, n) => `<th class="${n ? 'n' : ''}"><a href="#" class="sortth" data-q="lso=${key}&lsd=${so === key && sd === 'desc' ? 'asc' : 'desc'}" title="Sort by this column">${label}${so === key ? (sd === 'asc' ? ' ▲' : ' ▼') : ''}</a></th>`;
  const nOpt = [{ v: '1', l: '1 or more' }, { v: '5', l: '5 or more' }, { v: '10', l: '10 or more' }, { v: '0', l: 'None' }];
  const any = ['fcat', 'fc', 'fs', 'fn', 'fl', 'fg'].some(x => q.get(x));
  return `<div class="grid g6">${k(lu.length, 'Children on record')}${k(lu.filter(c => c.status !== 'Closed').length, 'In town now')}${k(lu.filter(c => c.streetCat === 'A').length, 'A · sleeps on the street')}${k(lu.filter(c => c.streetCat === 'B').length, 'B · street connected')}${k(Object.values(st).filter(r => r.c).length, 'Came to the centre in ' + year)}${k(Object.values(st).filter(r => r.n).length, 'Met at night in ' + year)}</div>
  <div class="card filters fold${UI.fopen ? ' open' : ''}" style="grid-template-columns:repeat(6,1fr);margin-top:16px">
    <label class="f">Situation<select class="in" data-filter="fcat">${opt([{ v: 'A', l: 'A · sleeps on the street' }, { v: 'B', l: 'B · street connected' }, { v: 'none', l: 'Not written' }], q.get('fcat'), 'All')}</select></label>${filtBtn()}
    <label class="f">Days in centre<select class="in" data-filter="fc">${opt(nOpt, q.get('fc'), 'Any')}</select></label>
    <label class="f">Days met on the street<select class="in" data-filter="fs">${opt(nOpt, q.get('fs'), 'Any')}</select></label>
    <label class="f">Nights on the street<select class="in" data-filter="fn">${opt(nOpt, q.get('fn'), 'Any')}</select></label>
    <label class="f">Last met<select class="in" data-filter="fl">${opt([{ v: 'month', l: 'This month' }, { v: 'before', l: 'Before this month' }, { v: 'never', l: 'Never in ' + year }], q.get('fl'), 'Any time')}</select></label>
    <label class="f">Days not met<select class="in" data-filter="fg">${opt([{ v: 'lt7', l: 'Less than 7' }, { v: '7', l: '7 or more' }, { v: '30', l: '30 or more' }, { v: 'never', l: 'Never met' }], q.get('fg'), 'Any')}</select></label>
  </div>
  <div class="card" style="padding:6px 8px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:6px 4px;align-items:center"><span class="sub"><b>${rows.length}</b> of ${total} children shown${any ? ' · <a href="#" data-q="fcat=&fc=&fs=&fn=&fl=&fg=">clear the filters</a>' : ''} · tap a column title to sort</span><button class="btn sm" data-act="xl" data-k="lsum">Export in Excel</button></div><div class="tw"><table id="lsumtable"><thead><tr>${th('name', 'Name')}${th('cat', 'Situation')}${th('c', 'Days in centre', 1)}${th('s', 'Days met on the street', 1)}${th('n', 'Nights on the street', 1)}${th('last', 'Last met')}${th('gone', 'Days not met', 1)}</tr></thead><tbody>
  ${rows.map(({ c, r, gone }) => `<tr><td>${childLink(c)}<div class="sub">ID ${esc(c.id)}${c.status === 'Closed' ? ' · ' + esc(c.closeReason || 'closed') : ''}</div></td><td>${esc(c.streetCat || '')}</td><td class="n">${r.c || ''}</td><td class="n">${r.s || ''}</td><td class="n">${r.n || ''}</td><td>${esc(fmtDate(r.last))}</td><td class="n" style="${gone >= 30 ? 'color:var(--red);font-weight:700' : gone >= 7 ? 'color:var(--red)' : ''}">${gone == null ? 'never' : gone}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No child matches these filters.</td></tr>'}
  </tbody></table></div></div>`;
}
XL.lsum = function () { const y = (route().q.get('ly') || route().q.get('lm') || today()).slice(0, 4), rows = luigiSumRows(y); downloadXlsx('luigi-summary-' + y, [{ name: 'Luigi ' + y, rows: [['ID', 'Name', 'Situation', 'Days in centre', 'Days met on the street', 'Nights on the street', 'Last met', 'Days not met']].concat(rows.map(x => [x.c.id, fullName(x.c), x.c.streetCat || '', x.r.c, x.r.s, x.r.n, x.r.last, x.gone == null ? '' : x.gone])) }]); };
function luigiDayAll(d) {
  const sets = luigiDaySets(d), any = id => L_SHEETS.some(sh => sets[sh.k].has(String(id)));
  return { sets, any, all: S.children.filter(c => (c.section === 'Luigi' && c.status !== 'Closed') || any(c.id)) };
}
function luigiDayList(d, k) {
  const sh = lSheet(k), q = route().q, cat = q.get('lcat') || '', only = q.get('lonly') || '', term = (UI.lattq || '').trim().toLowerCase(), { sets, all } = luigiDayAll(d);
  const on = c => sets[sh.k].has(String(c.id));
  const kids = all.filter(c => (!cat || c.streetCat === cat) && (!term || [c.id, c.name, c.surname, c.nickname, c.compound].join(' ').toLowerCase().includes(term))
    && (!only || (only === 'on') === on(c))).sort((x, y) => (on(y) - on(x)) || fullName(x).localeCompare(fullName(y)));
  const nOn = kids.filter(on).length, sep = (t, n) => `<tr class="gsep"><td colspan="3">${t} · ${n}</td></tr>`;
  if (!kids.length) return '<p class="empty">No child matches. A new face? Use the box above.</p>';
  const also = c => L_SHEETS.filter(o => o.k !== sh.k && sets[o.k].has(String(c.id))).map(o => `<span class="chip">${esc(o.mark.toLowerCase())}</span>`).join(' ');
  return `<div class="tw"><table class="atttab one"><thead><tr><th>Name</th><th>Also on this day</th><th>${esc(sh.label)}</th></tr></thead><tbody>${kids.map((c, i) =>
    `${nOn && i === 0 ? sep(esc(sh.mark), nOn) : ''}${nOn && i === nOn && nOn < kids.length ? sep('Everyone else, A to Z', kids.length - nOn) : ''}<tr><td><div style="display:flex;gap:10px;align-items:center">${avatar(c, 36)}<div>${childLink(c)} <span class="lcat ${c.streetCat || ''}" title="${esc(STREET_CATS[c.streetCat] || '')}">${esc(c.streetCat || '?')}</span><div class="sub">${curAge(c) !== '' ? curAge(c) + ' years · ' : ''}${esc(c.compound || '')}${c.section !== 'Luigi' ? ' · file in ' + esc(SECTIONS[c.section].label) : ''}</div></div></div></td>
      <td>${also(c)}</td><td><div class="att"><button class="${sh.cls}${on(c) ? ' on' : ''}" data-lact="day" data-id="${esc(c.id)}" data-d="${d}" data-sheet="${sh.k}" style="min-width:150px">${on(c) ? '✓ ' : ''}${esc(sh.mark)}</button></div></td></tr>`).join('')}</tbody></table></div>`;
}
function vLuigiAtt(r) {
  const q = r.q, m = q.get('lm') || thisMonth(), tab = q.get('lt') || 'today', d = q.get('ld') || today();
  const tabs = `<div class="seg">${[['today', 'Daily attendance', 'Daily'], ['centre', 'Drop-in centre monthly view', 'Centre: month'], ['day', 'Day outreach monthly view', 'Day: month'], ['night', 'Night outreach monthly view', 'Night: month'], ['sum', 'Whole year', 'Year']].map(([k, l, s]) => `<a href="#" data-q="lt=${k}" class="${tab === k ? 'on' : ''}"><span class="dlong">${l}</span><span class="dshort">${s}</span></a>`).join('')}</div>`;
  const search = `<label class="f">Find a name<input class="in" id="lattsearch" placeholder="Name, nickname, ID or place" value="${esc(UI.lattq || '')}"></label>`;
  const catSel = `<label class="f">Street situation<select class="in" data-filter="lcat">${opt([{ v: 'A', l: 'A · sleeps on the street' }, { v: 'B', l: 'B · street connected' }], q.get('lcat'), 'All')}</select></label>`;
  let body, filters, when;
  if (tab === 'today') {
    const sh = lSheet(q.get('ls')), { sets, any, all } = luigiDayAll(d), only = q.get('lonly') || '';
    const kidsOf = k => all.filter(c => sets[k].has(String(c.id)));
    const tile = o => { const l = kidsOf(o.k), st = sessStaff(luigiSess(d, o.type)); return `<a href="#" class="tile lsheet${sh.k === o.k ? ' on' : ''}" data-q="ls=${o.k}&lonly=" style="--c:${o.color}"><span class="key"><span class="sw" style="background:${o.color}"></span>${esc(o.label)}</span><b>${l.length}</b><span>${sexText(l)}</span><span class="sub">${st ? 'By ' + esc(st) : 'Staff not recorded'}</span></a>`; };
    const notMet = all.filter(c => c.section === 'Luigi' && !any(c.id)).length;
    when = `<input class="in" type="date" value="${d}" max="${today()}" data-filter="ld" style="width:auto" aria-label="Another day">`;
    filters = `<p class="sec" style="margin:0">Three sheets for the day. Choose the one you did</p><div class="grid g3" id="lsheets">${L_SHEETS.map(tile).join('')}</div>`;
    body = `<div class="card" style="border-top:4px solid ${sh.color}">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start"><h2>${esc(sh.label)} · ${esc(fmtDate(d))}</h2><button class="btn sm" data-lact="xlday" data-d="${d}">Export in Excel</button></div>
      ${luigiStaffHtml(d, sh)}
      <div class="filters fold${UI.fopen ? ' open' : ''}" style="grid-template-columns:2fr 1fr 1fr;margin:12px 0 6px;display:grid;gap:10px">${search}${filtBtn()}${catSel}<label class="f">Show<select class="in" data-filter="lonly">${opt([{ v: 'on', l: 'Only: ' + sh.mark.toLowerCase() }, { v: 'off', l: 'Only children not marked' }], only, 'Everyone')}</select></label></div>
      <div id="lattBody">${luigiDayList(d, sh.k)}</div></div>
      <p class="sub" style="margin:0">Tap to mark. Tap again to clear. ${notMet} children in town are on none of the three sheets for this day.</p>`;
  } else if (tab === 'sum') {
    when = monthPicker(m, 'lm'); filters = `<div class="card filters" style="grid-template-columns:1fr">${search}</div>`;
    body = `<div id="lattBody">${luigiSummary(m.slice(0, 4))}</div>`;
  } else {
    const T = L_MODE[lMode(tab)], { kids, map } = luigiKids(m, tab); const seen = kids.filter(c => map[c.id]);
    when = monthPicker(m, 'lm');
    filters = `<div class="card filters fold${UI.fopen ? ' open' : ''}" style="grid-template-columns:2fr 1fr 1fr">${search}${filtBtn()}${catSel}<label class="f">Show<select class="in" data-filter="lseen">${opt([{ v: '1', l: 'Only children marked this month' }], q.get('lseen'), 'All children in town')}</select></label></div>`;
    body = `<div class="card" style="padding:6px 8px">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:6px 4px;align-items:center"><span class="sub">Tap a cell: <b class="lc ${T.mark}" style="padding:1px 6px">${T.mark}</b> ${T.tap}. Tap again to clear. ${seen.length} of ${kids.length} children marked this month (${sexText(seen)}; A ${seen.filter(c => c.streetCat === 'A').length} · B ${seen.filter(c => c.streetCat === 'B').length}).<br>Small letters: on another sheet the same day (c centre, d day outreach, n night outreach). Tap a day to open its sheet: staff, notes, findings.</span><button class="btn sm" data-lact="xlmonth">Export in Excel</button></div>
      <div id="lattBody">${luigiGrid(m, tab)}</div></div>`;
  }
  const lead = tab === 'today' ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : tab === 'sum' ? 'Year ' + m.slice(0, 4) : (L_MODE[tab] ? lSheet(tab === 'centre' ? 'dropin' : tab).label + ' · ' : '') + fmtMonth(m);
  return `<div class="top"><div><h1>Attendance · Luigi</h1>${tab === 'today' ? '' : `<p class="lead">${esc(lead)}</p>`}</div></div>
  ${centreSeg('Luigi')}
  ${tab === 'today' ? dayBar(d, 'ld') + filters : ''}
  ${tabs}
  ${when ? `<div class="attctl">${when}</div>` : ''}
  <details class="card soft more knowncard"${r.q.get('go') === 'knownq' ? ' open' : ''}><summary>New face? Check if the child is already known</summary>
    <div style="margin-top:10px"><input class="in" id="knownq" data-ctx="luigi" placeholder="Name or nickname" autocomplete="off" aria-label="Name or nickname of the child"><div id="knownbox" style="margin-top:8px"></div></div></details>
  ${tab === 'today' ? '' : filters}${body}`;
}

/* ---------- is this child already known? ---------- */
function lev(a, b) { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; let prev = Array.from({ length: n + 1 }, (_, k) => k); for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; }
function lev1(a, b) { return lev(a, b) <= (Math.max(a.length, b.length) >= 7 ? 2 : 1); }
function knownMatches(text, skipId) {
  const toks = String(text || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  if (!toks.length || toks.join('').length < 3) return null;
  const out = [];
  for (const c of S.children) {
    if (skipId && String(c.id) === String(skipId)) continue;
    const words = [c.name, c.surname, c.nickname].join(' ').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean);
    let score = 0, ok = true;
    for (const t of toks) { if (words.some(w => w === t)) score += 3; else if (words.some(w => w.startsWith(t))) score += 2; else if (t.length >= 4 && words.some(w => lev1(w, t) || (w.length > 4 && lev1(w.slice(0, t.length), t)))) score += 1; else { ok = false; break; } }
    if (ok) out.push({ c, score });
  }
  return out.sort((x, y) => y.score - x.score || fullName(x.c).localeCompare(fullName(y.c))).slice(0, 8).map(x => x.c);
}
function lastMet(c) {
  let d = '', what = '';
  for (const o of S.outreach) if (o.date > d && (o.children || []).map(String).includes(String(c.id))) { d = o.date; what = o.type; }
  for (const [day, v] of Object.entries(S.attendance)) if (day > d && v && v[c.id] === 'P') { d = day; what = centreOf(c) + ' attendance'; }
  for (const v of S.visits) if (String(v.childId) === String(c.id) && v.date > d && v.successful !== 'No') { d = v.date; what = v.purpose + ' visit'; }
  return d ? fmtDate(d) + ' (' + what.toLowerCase() + ')' : '';
}
function pendingOf(c) {
  const out = [];
  if (needsVisits(c)) { const vi = visitInfo(c); if (vi.never) out.push('Home visit: none recorded yet'); else if (vi.late >= 0) out.push('Home visit due, ' + vi.late + ' days late'); }
  const acts = S.visits.filter(v => String(v.childId) === String(c.id) && v.action && !v.actionDone).map(v => v.action).concat(S.sessions.filter(s => (s.children || []).map(String).includes(String(c.id)) && s.action && !s.actionDone).map(s => s.action));
  for (const a of acts) out.push('Action open: ' + a);
  const is = issuesOf(c); if (is.length && c.status !== 'Closed') out.push('To complete: ' + is.map(k => ISSUES[k].toLowerCase()).join('; '));
  return out;
}
function knownHtml(text, ctx, skipId) {
  const list = knownMatches(text, skipId);
  if (list == null) return '';
  const rq = route().q, tab = rq.get('lt') || 'today', shs = tab === 'today' ? [lSheet(rq.get('ls'))] : tab === 'night' ? [lSheet('night')] : tab === 'day' ? [lSheet('day')] : tab === 'centre' ? [lSheet('dropin')] : [lSheet('dropin'), lSheet('day')];
  if (!list.length) return ctx === 'form' ? '' : `<div class="note">Nobody with this name in the records of any centre. <button class="btn sm" data-lact="newchild" data-name="${esc(text)}">Add as a new Luigi child</button></div>`;
  return `<div class="${ctx === 'form' ? 'warn' : ''}" style="display:flex;flex-direction:column;gap:2px">${ctx === 'form' ? '<b>Already in the records? Check before saving a second file for the same child.</b>' : ''}
  ${list.map(c => { const p = pendingOf(c), lm = lastMet(c);
    return `<div class="it">${avatar(c, 40)}<div class="w"><b><a href="#/child/${esc(c.id)}">${esc(fullName(c))}</a>${c.nickname ? ` <span class="sub">"${esc(c.nickname)}"</span>` : ''}</b>
      <span>ID ${esc(c.id)} · ${esc(SECTIONS[c.section] ? SECTIONS[c.section].label : c.section)} · ${esc(STATUS_LABEL[c.status] || c.status)}${curAge(c) !== '' ? ' · ' + curAge(c) + ' years' : ''}${c.sex ? ' · ' + c.sex : ''}${c.compound ? ' · from ' + esc(c.compound) : ''}${c.streetCat ? ' · ' + c.streetCat : ''}${lm ? ' · last met ' + esc(lm) : ''}</span>
      ${p.length ? `<span style="color:var(--orange)">${p.map(esc).join(' · ')}</span>` : ''}</div>
      ${ctx === 'luigi' ? `<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${shs.map(o => `<button class="btn sm" data-lact="mark" data-id="${esc(c.id)}" data-sheet="${o.k}">Mark: ${esc(o.mark.toLowerCase())}</button>`).join('')}</div>` : ''}</div>`; }).join('')}
  ${ctx === 'form' ? '' : `<div class="sub" style="padding-top:6px">Not one of these? <button class="btn sm" data-lact="newchild" data-name="${esc(text)}">Add as a new Luigi child</button></div>`}</div>`;
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-lact]'); if (!b) return;
  const act = b.dataset.lact;
  if (act === 'cell') {
    const table = b.closest('table'), T = L_MODE[lMode(table.dataset.mode)], tr = b.closest('tr'), id = tr.dataset.id, d = b.dataset.d;
    if (d > today()) { toast('This day is in the future'); return; }
    const next = b.dataset.v ? '' : T.mark, gm = $('.gm', b);
    luigiToggle(id, d, T.type, !!next); save();
    b.classList.remove('C', 'S'); if (next) b.classList.add(next); b.dataset.v = next; if (gm) gm.textContent = next;
    const tt = $('[data-t=T]', tr); if (tt) tt.textContent = $$('td.lc', tr).filter(x => x.dataset.v).length;
    const f = $(`[data-fd="${d}"]`, table); if (f) f.textContent = $$(`td.lc[data-d="${d}"]`, table).filter(x => x.dataset.v).length || '';
  } else if (act === 'day') {
    const c = child(b.dataset.id), sh = lSheet(b.dataset.sheet);
    luigiToggle(c.id, b.dataset.d, sh.type, !b.classList.contains('on')); save(); render();
  } else if (act === 'mark') {
    const c = child(b.dataset.id); if (!c) return;
    if (c.section !== 'Luigi' && !confirm(fullName(c) + ' is in the records of ' + SECTIONS[c.section].label + '. Mark him or her as met by Luigi today? The file stays in ' + SECTIONS[c.section].label + '.')) return;
    const sh = lSheet(b.dataset.sheet), dd = route().q.get('ld') || today();
    luigiToggle(c.id, dd, sh.type, true); save(); toast(fullName(c) + ': ' + sh.mark.toLowerCase() + ', ' + fmtDate(dd)); render();
  } else if (act === 'newchild') {
    const p = String(b.dataset.name || '').trim().split(/\s+/);
    UI.prefill = { name: titleCase(p[0] || ''), surname: titleCase(p.slice(1).join(' ')), section: 'Luigi', residence: 'Non-resident', streetCat: 'A' }; go('#/child/new');
  } else if (act === 'xlday') {
    const d = b.dataset.d, { sets } = luigiDayAll(d);
    downloadXlsx('luigi-daily-report-' + d, L_SHEETS.map(sh => { const s = luigiSess(d, sh.type), kids = S.children.filter(c => sets[sh.k].has(String(c.id))).sort((x, y) => fullName(x).localeCompare(fullName(y)));
      return { name: sh.label, rows: [[sh.label, fmtDate(d)], ['Done by', sessStaff(s) || 'not recorded'], ['Places and facts', s ? s.notes || '' : ''], ['Findings: assessment', s ? s.findings || '' : ''], ['Children', kids.length], ['Boys / girls', kids.filter(c => c.sex !== 'F').length + ' / ' + kids.filter(c => c.sex === 'F').length], [''], ['ID', 'Name', 'Nickname', 'Sex', 'Age', 'Situation', 'From']].concat(kids.map(c => [c.id, fullName(c), c.nickname || '', c.sex, curAge(c), c.streetCat || '', c.compound || ''])) }; }));
  } else if (act === 'xlmonth') {
    const q = route().q, m = q.get('lm') || thisMonth(), mode = lMode(q.get('lt')), T = L_MODE[mode], { kids, map } = luigiKids(m, mode), n = Number(monthEnd(m).slice(8)), days = [];
    for (let i = 1; i <= n; i++) days.push(m + '-' + String(i).padStart(2, '0'));
    const rows = [['ID', 'Name', 'Nickname', 'Sex', 'Age', 'Situation', 'From'].concat(days.map(d => Number(d.slice(8)))).concat([T.total])];
    for (const c of kids) { const v = days.map(d => (map[c.id] || {})[d] || ''); rows.push([c.id, fullName(c), c.nickname || '', c.sex, curAge(c), c.streetCat || '', c.compound || ''].concat(v).concat([v.filter(x => x).length])); }
    downloadXlsx('luigi-' + mode + '-' + m, [{ name: fmtMonth(m), rows }]);
  } else if (act === 'xlreport') {
    const q = route().q, m = q.get('m') || thisMonth(), rg = periodRange(m, q.get('p') || 'M'), T = luigiTables(rg.a, rg.b);
    downloadXlsx('luigi-report-' + rg.a.slice(0, 7) + '-to-' + rg.b.slice(0, 7), [{ name: 'Statistics', rows: T.main }, { name: 'Places of origin', rows: T.origin }, { name: 'Ages', rows: T.ages }, { name: 'Street situation', rows: T.cat }, { name: 'Home visits', rows: T.visits }, { name: 'Staff by activity', rows: T.staffT }, { name: 'Relatives, back on street', rows: T.extra }, { name: 'Findings', rows: T.findings }]);
  } else if (act === 'xlreportn') {
    const q = route().q, m = q.get('m') || thisMonth(), rg = periodRange(m, q.get('p') || 'M'), T = luigiTables(rg.a, rg.b);
    const cnt = { 'Drop-in': {}, 'Day outreach': {}, 'Night outreach': {} };
    for (const s of S.outreach) if (cnt[s.type] && inRange(s.date, rg.a, rg.b)) for (const id of new Set((s.children || []).map(String))) cnt[s.type][id] = (cnt[s.type][id] || 0) + 1;
    const cols = L_COLS.filter(([k]) => k !== 'all'), has = {}; for (const [k] of cols) has[k] = new Set(T.D.kids(k).map(c => String(c.id)));
    const kids = T.D.kids('all').sort((x, y) => fullName(x).localeCompare(fullName(y)));
    const head = ['ID', 'Name', 'Nickname', 'Sex', 'Age', 'From', 'Situation', 'Known or new', 'Days in the centre', 'Days met on the street', 'Nights met on the street'].concat(cols.map(([, l]) => l)).concat(['Relatives on the street', 'Back on the street']);
    const rows = kids.map(c => [c.id, fullName(c), c.nickname || '', c.sex || '', curAge(c), c.compound || '', c.streetCat || '', T.D.isNew(c) ? 'New' : 'Known', cnt['Drop-in'][c.id] || 0, cnt['Day outreach'][c.id] || 0, cnt['Night outreach'][c.id] || 0].concat(cols.map(([k]) => has[k].has(String(c.id)) ? 1 : '')).concat([c.relStreet === 'Yes' ? 1 : '', c.backStreet ? 1 : '']));
    const tot = ['', 'Total: ' + kids.length + ' children', '', '', '', '', '', '', rows.reduce((s, r) => s + r[8], 0), rows.reduce((s, r) => s + r[9], 0), rows.reduce((s, r) => s + r[10], 0)].concat(head.slice(11).map((h, i) => rows.filter(r => r[11 + i] === 1).length));
    downloadXlsx('luigi-report-with-names-' + rg.a.slice(0, 7) + '-to-' + rg.b.slice(0, 7), [{ name: 'Children', rows: [head].concat(rows).concat([tot]), filter: rows.length + 1 }]);
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'knownq') { const box = $('#knownbox'); if (box) box.innerHTML = knownHtml(el.value, el.dataset.ctx || 'luigi'); return; }
  if (el.id === 'lattsearch') { UI.lattq = el.value; const q = route().q, box = $('#lattBody'); if (box) { const lt = q.get('lt') || 'today'; box.innerHTML = lt === 'sum' ? luigiSummary((q.get('lm') || thisMonth()).slice(0, 4)) : lt === 'today' ? luigiDayList(q.get('ld') || today(), q.get('ls')) : luigiGrid(q.get('lm') || thisMonth(), lt); } return; }
  const f = el.form; const box = $('#dupbox');
  if (box && f && f.dataset.form === 'child' && ['name', 'surname', 'nickname'].includes(el.name)) box.innerHTML = knownHtml([f.elements.name.value, f.elements.surname.value].join(' ').trim() || f.elements.nickname.value, 'form');
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.lstaff || el.dataset.lstaffadd) { UI.lstOpen = true;
    const sh = lSheet(el.dataset.lstaff || el.dataset.lstaffadd), s = luigiSess(el.dataset.d, sh.type, true), ids = new Set(s.staffIds || []); touchSheet(el.dataset.d, sh.type).staff = 1;
    if (el.dataset.lstaffadd) { if (el.value) ids.add(el.value); } else if (el.checked) ids.add(el.value); else ids.delete(el.value);
    s.staffIds = Array.from(ids); s.staff = s.staffIds.map(staffName).join(', '); luigiClean(); save(); render(); return;
  }
  if (el.dataset.lnote) { const sh = lSheet(el.dataset.lnote), v = el.value.trim(), f = el.dataset.lf === 'findings' ? 'findings' : 'notes'; const s = luigiSess(el.dataset.d, sh.type, !!v); touchSheet(el.dataset.d, sh.type)[f] = 1; if (s) { s[f] = v; luigiClean(); save(); toast(f === 'findings' ? 'Findings saved' : 'Note saved'); } return; }
  if (el.id === 'photofile' && el.files[0]) {
    const img = new Image(), url = URL.createObjectURL(el.files[0]);
    img.onload = () => { const k = Math.min(1, 280 / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      UI.photoPending = cv.toDataURL('image/jpeg', 0.7); URL.revokeObjectURL(url); const pv = $('#photoprev'); if (pv) pv.innerHTML = `<img src="${UI.photoPending}" alt="" style="width:72px;height:72px;border-radius:50%;object-fit:cover">`; };
    img.onerror = () => toast('Could not read this picture');
    img.src = url;
  }
});
