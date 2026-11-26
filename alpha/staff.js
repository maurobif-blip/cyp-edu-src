
/* ================= Staff: one person, several areas of work (they rotate) ================= */
/* access levels (beta 1.5, Mauro 24/11): Site = admins of the app (they change it: staff, PIN, data, shared database); Admin = Education office (sees all, validates, checks the reports);
   Mgmt = Administration of the organisation (sees all, follows tasks and people, does not validate). Then the areas of work. */
const ACCESS_FLAGS = ['Site', 'Admin', 'Mgmt'];
const STAFF_FLAGS = [['Site', 'Site admin (changes the app)'], ['Admin', 'Education office (validates)'], ['Mgmt', 'Administration (overview)'], ['Minsundu', 'Minsundu'], ['Nkwazi', 'Nkwazi'], ['Luigi', 'Luigi'], ['Sports', 'Sports (all centres)'], ['Family', 'Family Section'], ['School', 'School Section'], ['Counseling', 'Counselling']];
const FLAG_LABEL = Object.fromEntries(STAFF_FLAGS);
const FLAG_PRIORITY = ['Site', 'Admin', 'Mgmt', 'Family', 'School', 'Counseling', 'Sports', 'Minsundu', 'Nkwazi', 'Luigi'];
/* Names, roles and areas from the organigram v26, the staff rotation sheets (Jan-Mar 2026), the leave days list (June 2026), the weekend programmes and the section reports. */
const STAFF_SEED = [
  ['s1', 'Clement Mwamba', 'Head of Department, Education', ['Admin']],
  ['s2', 'Lewis Chewe', 'Centre Supervisor, Minsundu', ['Minsundu']],
  ['s3', 'Maxwell Lungu', 'Head of UCC (Minsundu children)', ['Minsundu']],
  ['s4', 'Kelvin Chongo', 'Educator, UCC', ['Minsundu']],
  ['s5', 'Dellah Victoria Shilubwe', 'Educator, UCC', ['Minsundu']],
  ['s6', 'Bernard Chabu', 'Head of Family Section', ['Family', 'Minsundu']],
  ['s7', 'Richard Kasela', 'Family Section', ['Family', 'Minsundu']],
  ['s8', 'Delian Nachula', 'School Section', ['School', 'Minsundu']],
  ['s9', 'Marable', 'Same person as Merabe Malama Chanda (other spelling)', ['School'], false],
  ['s10', 'Chippo Choongo', 'Counsellor (Madame Chipo)', ['Counseling', 'Minsundu', 'Luigi', 'Nkwazi']],
  ['s11', 'Cristoph', 'Head of Luigi Drop-in (surname to confirm)', ['Luigi']],
  ['s12', 'Chisha Mulenga', 'Centre Supervisor, Nkwazi', ['Nkwazi']],
  ['s13', 'Merabe Malama Chanda', 'School Section and Youth', ['School', 'Minsundu']],
  ['s14', 'Sokota Charles', 'Educator, Youth; catechism', ['Minsundu']],
  ['s15', 'Pippen Musakaie', 'Head of Sports; basketball coach', ['Sports']],
  ['s16', 'Mauro (evaluation)', 'Evaluation team', ['Admin']],
  ['s17', 'Ana (evaluation)', 'Evaluation team', ['Admin']],
  ['s18', 'Vadya P. Tembo', 'Assistant Head of Department, Education', ['Admin']],
  ['s19', 'Anthony Bantungwa', 'Spiritual guide', ['Minsundu']],
  ['s20', 'Nase Mwila', 'Educator', ['Minsundu']],
  ['s21', 'Patrick Mulenga', 'Deputy Supervisor, Nkwazi', ['Nkwazi']],
  ['s22', 'Joyce Chisenga', 'Educator; coach', ['Nkwazi']],
  ['s23', 'Iness Phiri', 'Educator (centre to confirm)', ['Luigi']],
  ['s24', 'Jack Nyirongo', 'Educator (centre to confirm)', ['Luigi']],
  ['s25', 'Peter Mijere', 'Coach', ['Sports']],
  ['s26', 'Watson Tembo', 'Coach, basketball', ['Sports']],
  ['s27', 'Richard Mapande', 'Coach, football', ['Sports']],
  ['s28', 'Webby Chanda', 'Coach, football', ['Sports']],
  ['s29', 'Happy Muzenze Jr', 'Coach, tennis', ['Sports']],
  ['s30', 'Chiwala', 'Coach, basketball (full name to confirm)', ['Sports']],
  ['s31', 'Chris', 'Coach, football (full name to confirm)', ['Sports']],
  ['s32', 'Mbewe', 'Educator on the Minsundu rotation (first name to confirm)', ['Minsundu']],
  ['s33', 'Davies Mulenga', 'Head of Skills Training', []],
  ['s34', 'Agatha Kaingu', 'On the leave list: role to confirm', []],
  ['s35', 'Reginartol Mwenya', 'On the leave list: role to confirm', []],
  ['s36', 'Jonathan Ngosa', 'On the leave list: role to confirm', []],
  ['s37', 'Chongo Mulenga', 'On the leave list: role to confirm', []],
  ['s38', 'Mr Bwalya', 'Head teacher, community school (first name to confirm)', ['Nkwazi']]
];
const LEGACY_AREA = { UCC: 'Minsundu', Youth: 'Minsundu', Luigi: 'Luigi', Nkwazi: 'Nkwazi', Family: 'Family', School: 'School', Counseling: 'Counseling', Sports: 'Sports' };
function seedStaff() { return STAFF_SEED.map(([id, name, role, areas, active]) => ({ id, name, role, areas: areas.slice(), admin: areas.includes('Admin'), section: areas[0] || 'Other', active: active !== false })); }
function staffAreas(s) {
  if (!s) return [];
  if (Array.isArray(s.areas)) return s.areas;
  const a = []; if (s.admin) a.push('Admin'); if (LEGACY_AREA[s.section]) a.push(LEGACY_AREA[s.section]); return a;
}
function hasFlag(f, s) { return staffAreas(s || USER).includes(f); }
/* until somebody has the Site box ticked, the Education office keeps the site admin rights (no lock-out on a new database or before the update) */
function anySite() { return (S.staff || []).some(x => x.active !== false && staffAreas(x).includes('Site')); }
function isSite(s) { s = s || USER; return !!s && (staffAreas(s).includes('Site') || (!!s.admin && !anySite())); }
function isMgmt(s) { return staffAreas(s || USER).includes('Mgmt'); }
/* sees the whole programme: Education office, Administration, site admins */
function seesOverview(s) { s = s || USER; return !!s && !GUEST && (!!s.admin || isSite(s) || isMgmt(s)); }
/* the Admin page: site admins and the Education office (who works where, targets); PIN, data and the shared database only for site admins */
function canAdminPage() { return !!USER && !GUEST && (!!USER.admin || isSite()); }
/* staff whose only area is Sports: a shorter file of the child (no family, documents, visits) */
function sportsOnly(s) { s = s || USER; const a = staffAreas(s); return !!s && a.length > 0 && a.every(k => k === 'Sports'); }
function mainFlag(s) { const a = staffAreas(s); return FLAG_PRIORITY.find(f => a.includes(f)) || ''; }
const FLAG_SHORT = { Site: 'Site admin', Admin: 'Education office', Mgmt: 'Administration', Sports: 'Sports' };
function areasText(s) { const a = staffAreas(s); return a.length ? STAFF_FLAGS.filter(([k]) => a.includes(k)).map(([k, l]) => FLAG_SHORT[k] || l).join(' · ') : 'No area set'; }
/* brings an older staff list up to the seed: same ids, full names, roles, areas; people added by hand are left alone */
function mergeStaff() {
  if ((S.meta.staffSeed || 0) >= 2) return false;
  for (const x of seedStaff()) {
    let s = S.staff.find(y => y.id === x.id) || S.staff.find(y => y.name.toLowerCase() === x.name.toLowerCase());
    if (!s) { S.staff.push(x); continue; }
    if (!Array.isArray(s.areas)) { const wasAdmin = !!s.admin; s.name = x.name; s.role = x.role; s.areas = x.areas.slice(); if (wasAdmin && !s.areas.includes('Admin')) s.areas.unshift('Admin'); s.admin = s.areas.includes('Admin'); s.section = s.areas[0] || 'Other'; if (x.active === false) s.active = false; }
  }
  for (const s of S.staff) if (!Array.isArray(s.areas)) { s.areas = staffAreas(s); s.role = s.role || ''; }
  S.meta.staffSeed = 2; return true;
}
function flagChecks(s, self) { return STAFF_FLAGS.map(([k]) => `<td style="text-align:center"><input type="checkbox" data-staff="flag" data-flag="${k}" data-id="${esc(s.id)}" aria-label="${esc(FLAG_LABEL[k])}"${staffAreas(s).includes(k) ? ' checked' : ''}${self && (k === 'Admin' || k === 'Site') ? ' disabled title="You cannot remove your own access"' : ACCESS_FLAGS.includes(k) && !isSite() ? ' disabled title="Only a site admin gives this access"' : ''}></td>`).join(''); }
function staffTable() {
  const list = S.staff.slice().sort((a, b) => (b.active - a.active) || a.name.localeCompare(b.name));
  return `<div class="tw"><table class="stafft"><thead><tr><th>Name and role</th>${STAFF_FLAGS.map(([k, l]) => `<th style="text-align:center;white-space:normal;max-width:84px">${esc(l)}</th>`).join('')}<th style="text-align:center;white-space:normal;max-width:96px">Confidential (all centres)</th><th class="n">Children followed</th><th>Status</th></tr></thead><tbody>
  ${list.map(s => `<tr style="${s.active ? '' : 'opacity:.55'}"><td><b>${esc(s.name)}</b><input class="in" style="min-height:30px;padding:3px 8px;margin-top:4px;font-size:13px" data-staff="role" data-id="${esc(s.id)}" value="${esc(s.role || '')}" placeholder="Role" aria-label="Role of ${esc(s.name)}"></td>${flagChecks(s, s.id === USER.id)}<td style="text-align:center"><input type="checkbox" data-staff="conf" data-id="${esc(s.id)}" aria-label="Sees confidential information of all centres"${['Admin', 'Site', 'Mgmt', 'Counseling'].some(k => staffAreas(s).includes(k)) ? ' checked disabled title="Education office, administration, site admins and counsellors always see it"' : s.conf ? ' checked' : ''}></td><td class="n"><a href="#/children?who=${esc(s.id)}">${S.children.filter(c => c.responsible === s.id && c.status !== 'Closed').length}</a></td><td><button class="btn sm" data-act="staffactive" data-id="${esc(s.id)}"${s.id === USER.id ? ' disabled' : ''}>${s.active ? 'Active · set as left' : 'Left · set as active'}</button></td></tr>`).join('')}
  </tbody></table></div>`;
}
function loginTiles() {
  const st = activeStaff(), groups = FLAG_PRIORITY.map(f => [f, st.filter(s => mainFlag(s) === f)]).concat([['', st.filter(s => !mainFlag(s))]]).filter(g => g[1].length);
  const order = ['Site', 'Mgmt', 'Admin', 'Minsundu', 'Nkwazi', 'Luigi', 'Family', 'School', 'Counseling', 'Sports', ''];
  groups.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  return groups.map(([f, l]) => `<p class="sec" style="width:100%;text-align:left;margin:10px 0 0">${esc(f ? ({ Site: 'Site admins', Mgmt: 'Administration', Admin: 'Education Department' }[f] || FLAG_LABEL[f]) : 'Other staff')}</p><div class="staffgrid">${l.sort((a, b) => a.name.localeCompare(b.name)).map(s => `<button class="stile" data-act="login" data-id="${esc(s.id)}"><span class="av">${esc(initials(s.name))}</span>${esc(s.name)}<small>${esc(staffAreas(s).length > 1 ? areasText(s) : (s.role || areasText(s)))}</small></button>`).join('')}</div>`).join('');
}
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset || !el.dataset.staff) return;
  const s = S.staff.find(x => x.id === el.dataset.id); if (!s) return;
  if (el.dataset.staff === 'flag') { if (ACCESS_FLAGS.includes(el.dataset.flag) && !isSite()) { el.checked = !el.checked; return toast('Only a site admin gives this access'); } const a = new Set(staffAreas(s)); if (el.checked) a.add(el.dataset.flag); else a.delete(el.dataset.flag); s.areas = STAFF_FLAGS.map(x => x[0]).filter(k => a.has(k)); s.admin = s.areas.includes('Admin'); s.section = mainFlag(s) || 'Other'; save(); }
  else if (el.dataset.staff === 'role') { s.role = el.value.trim(); save(); }
  else if (el.dataset.staff === 'conf') { s.conf = !!el.checked; save(); }
});
