
/* ====================================================================
   PIN for the staff
   ==================================================================== */
function pinValue() { return String((S.settings && S.settings.pin) || '__DEFAULT_PIN__'); }
function needPin() { return !IS_DEMO; }
function pinOk() { try { return sessionStorage.getItem('cyp-ok') === '1'; } catch (e) { return false; } }
function pinLock() { try { const t = Number(sessionStorage.getItem('cyp-lock') || 0); return t > Date.now() ? Math.ceil((t - Date.now()) / 1000) : 0; } catch (e) { return 0; } }
function vPin() {
  const s = S.staff.find(x => x.id === UI.pinFor), lock = pinLock();
  return `<div class="login">
    ${brandMark('sm')}
    <div><span class="av" style="width:56px;height:56px;font-size:18px">${esc(initials(s.name))}</span><h1 style="margin-top:10px">${esc(s.name)}</h1><p class="lead">Type the staff PIN to open the records.</p></div>
    <form data-form="pinlogin" class="card" style="width:100%;max-width:340px;display:flex;flex-direction:column;gap:12px">
      <label class="f"><span>PIN</span><input class="in pinin" id="pinin" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="8" required${lock ? ' disabled' : ''}></label>
      ${UI.pinErr ? `<div class="warn" style="margin:0">${esc(UI.pinErr)}</div>` : ''}${lock ? `<div class="warn" style="margin:0">Too many wrong tries. Wait ${lock} seconds and try again.</div>` : ''}
      <button class="btn pri"${lock ? ' disabled' : ''}>Open</button><button type="button" class="btn" data-act="pinback">Back to the names</button>
    </form>
    <p class="sub" style="max-width:420px">Visitors use "Guest" on the first screen: names and photos of the children are hidden there.</p>
  </div>`;
}
FORMS.pinlogin = function (o) {
  if (pinLock()) return render();
  const s = S.staff.find(x => x.id === UI.pinFor); if (!s) { UI.pinFor = null; return render(); }
  if (String(o.pin).trim() !== pinValue()) {
    UI.pinTries = (UI.pinTries || 0) + 1; UI.pinErr = 'Wrong PIN.';
    if (UI.pinTries >= 5) { UI.pinTries = 0; UI.pinErr = ''; try { sessionStorage.setItem('cyp-lock', String(Date.now() + 60000)); } catch (e) {} }
    render(); const pi = $('#pinin'); if (pi && !pi.disabled) pi.focus(); return;
  }
  UI.pinTries = 0; UI.pinErr = ''; UI.pinFor = null; guestOut();
  try { sessionStorage.setItem('cyp-ok', '1'); } catch (e) {}
  USER = s; lsSet(USER_KEY, s.id); if (!location.hash) location.hash = '#/home'; render();
};
FORMS.pin = function (o) {
  if (!isSite()) return toast('Only a site admin changes the PIN');
  const p = String(o.pin || '').trim(); if (!/^\d{4,8}$/.test(p)) return toast('The PIN must be 4 to 8 digits');
  S.settings.pin = p; save(); toast('PIN changed'); render();
};

/* ====================================================================
   One shared database for every phone and computer.
   Each device keeps its own copy so that it works without a connection.
   What is recorded is sent by itself to the shared database, and what the
   others recorded arrives by itself. No file to export.
   ==================================================================== */
var _NOSTAMP = false, _SNAP = null, _ASNAP = null;
const SYNC_KEYS = ['visits', 'sessions', 'events', 'moves', 'plans', 'feedback'];
function noStamp() { _NOSTAMP = true; setTimeout(() => { snapChildren(); _NOSTAMP = false; }, 0); }
function childSig(c) { const t = c.updatedTs; c.updatedTs = undefined; const s = JSON.stringify(c); c.updatedTs = t; return s; }
function adminSig() { return JSON.stringify([S.staff, S.settings, S.reports]); }
function snapChildren() { _SNAP = {}; for (const c of S.children) _SNAP[c.id] = childSig(c); _ASNAP = adminSig(); }
function syncMeta() {
  const m = S.meta.sync = S.meta.sync || {};
  for (const k of ['att', 'sheets', 'photos', 'kids', 'newKids', 'rmPlans', 'done']) m[k] = m[k] || {};
  return m;
}
function touchAtt(d, id) { if (!GUEST) syncMeta().att[d + '|' + id] = Date.now(); }
function touchSheet(d, type) { const m = syncMeta(), k = d + '|' + type; let e = m.sheets[k]; if (!e || typeof e !== 'object') e = m.sheets[k] = { ch: {}, full: e ? 1 : 0 }; e.ts = Date.now(); return e; }
function touchDone(kind, id) { if (!GUEST) syncMeta().done[kind + '|' + id] = Date.now(); }
function stampChanges() {
  if (GUEST || _NOSTAMP || !S || !S.children) return;
  if (!_SNAP) { snapChildren(); return; }
  const now = Date.now(), m = syncMeta();
  for (const c of S.children) {
    if (_SNAP[c.id] === undefined && !c.uid) { c.uid = uid('k'); m.newKids[c.uid] = 1; }
    const s = childSig(c);
    if (_SNAP[c.id] !== s) { c.updatedTs = now; _SNAP[c.id] = s; m.kids[c.id] = now; }
  }
  const a = adminSig(); if (a !== _ASNAP) { _ASNAP = a; S.meta.adminTs = now; m.adminDirty = now; }
  m.dirtyAt = now;
  schedulePush();
}
function devId() { let d = lsGet('cyp-dev'); if (!d) { d = Math.random().toString(36).slice(2, 8).toUpperCase(); lsSet('cyp-dev', d); } return d; }

/* what was recorded on this device and is not in the shared database yet */
function buildChanges() {
  const m = syncMeta(), base = m.base || {};
  const f = { format: 'cyp-edu-changes', version: 2, app: VERSION, from: USER ? USER.name : '', device: devId(), created: new Date().toISOString() };
  for (const k of SYNC_KEYS) { const have = new Set(base[k] || []); f[k] = (S[k] || []).filter(x => !have.has(x.id)); }
  f.attendance = {}; let nAtt = 0;
  for (const key of Object.keys(m.att)) { const i = key.indexOf('|'), d = key.slice(0, i), id = key.slice(i + 1), v = (S.attendance[d] || {})[id]; (f.attendance[d] = f.attendance[d] || {})[id] = v == null ? '' : v; nAtt++; }
  f.sheets = [];
  for (const key of Object.keys(m.sheets)) { const i = key.indexOf('|'), d = key.slice(0, i), t = key.slice(i + 1), e = typeof m.sheets[key] === 'object' ? m.sheets[key] : { ch: {}, full: 1 };
    const s = S.outreach.find(x => x.date === d && x.type === t), out = { date: d, type: t, on: [], off: [] };
    if (e.full) out.on = s ? (s.children || []).map(String) : []; else for (const [id, v] of Object.entries(e.ch || {})) (v ? out.on : out.off).push(id);
    if (e.staff || e.full) out.staffIds = s ? (s.staffIds || []) : [];
    if (e.notes || e.full) out.notes = s ? s.notes || '' : '';
    if (e.findings || e.full) out.findings = s ? s.findings || '' : '';
    f.sheets.push(out); }
  f.children = S.children.filter(c => m.kids[c.id]);
  f.newKids = f.children.filter(c => c.uid && m.newKids[c.uid]).map(c => c.uid);
  f.photos = {}; for (const id of Object.keys(m.photos)) if (photos()[id]) f.photos[id] = photos()[id];
  f.plansRemoved = Object.keys(m.rmPlans);
  f.done = Object.keys(m.done);
  if (m.adminDirty) f.admin = { ts: S.meta.adminTs || m.adminDirty, staff: S.staff, settings: S.settings, reports: S.reports };
  f.count = { children: f.children.length, attendance: nAtt, sheets: f.sheets.length, visits: f.visits.length, sessions: f.sessions.length, events: f.events.length, moves: f.moves.length, plans: f.plans.length + f.plansRemoved.length, other: Object.keys(f.photos).length + f.done.length + (f.admin ? 1 : 0) + (f.feedback || []).length };
  f.empty = !Object.values(f.count).some(Boolean);
  return f;
}
function ackChanges(f, mark) {
  const m = syncMeta(); m.base = m.base || {};
  for (const k of SYNC_KEYS) { const set = new Set(m.base[k] || []); for (const x of f[k] || []) set.add(x.id); m.base[k] = Array.from(set); }
  const clear = (o, ts) => { for (const k of Object.keys(o)) if ((ts ? ts(o[k]) : o[k]) <= mark) delete o[k]; };
  clear(m.att); clear(m.sheets, e => (e && e.ts) || 0); clear(m.photos); clear(m.kids); clear(m.rmPlans); clear(m.done);
  for (const u of f.newKids || []) delete m.newKids[u];
  if (m.adminDirty && m.adminDirty <= mark) m.adminDirty = 0;
  m.sentAt = Date.now();
}
function countText(c) { const p = []; const add = (n, s, pl) => { if (n) p.push(n + ' ' + (n === 1 ? s : pl)); };
  add(c.attendance, 'attendance mark', 'attendance marks'); add(c.sheets, 'Luigi sheet', 'Luigi sheets'); add(c.visits, 'visit', 'visits'); add(c.sessions, 'counseling session', 'counseling sessions'); add(c.children, 'child file new or changed', 'child files new or changed'); add(c.events, 'event', 'events'); add(c.moves, 'change of status or centre', 'changes of status or centre'); add(c.plans, 'change in the plan of visits', 'changes in the plan of visits'); add(c.other, 'other change', 'other changes');
  return p.join(', '); }

/* a child gets another ID: everything recorded for that child follows */
function renameChild(oldId, newId) {
  oldId = String(oldId); newId = String(newId); if (oldId === newId) return;
  const c = child(oldId); if (!c) return; c.id = newId;
  const fx = x => String(x) === oldId ? newId : x;
  for (const k of ['visits', 'events', 'moves', 'plans']) for (const x of S[k] || []) if (String(x.childId) === oldId) x.childId = newId;
  for (const x of S.sessions || []) if (x.children) x.children = x.children.map(fx);
  for (const x of S.outreach || []) if (x.children) x.children = x.children.map(fx);
  for (const d of Object.keys(S.attendance || {})) for (const k of Object.keys(S.attendance[d])) if (k === String(oldId) || k.startsWith(oldId + '@')) { S.attendance[d][newId + k.slice(String(oldId).length)] = S.attendance[d][k]; delete S.attendance[d][k]; }
  if (photos()[oldId]) { photos()[newId] = photos()[oldId]; delete photos()[oldId]; }
  for (const x of S.children) if (String(x.sameAs) === oldId) x.sameAs = newId;
  const m = syncMeta(); for (const o of [m.kids, m.photos]) if (o[oldId] != null) { o[newId] = o[oldId]; delete o[oldId]; }
  for (const key of Object.keys(m.att)) if (key.endsWith('|' + oldId)) { m.att[key.slice(0, key.length - oldId.length) + newId] = m.att[key]; delete m.att[key]; }
  for (const e of Object.values(m.sheets)) if (e && e.ch && e.ch[oldId] != null) { e.ch[newId] = e.ch[oldId]; delete e.ch[oldId]; }
  if (_SNAP && _SNAP[oldId] !== undefined) { delete _SNAP[oldId]; _SNAP[newId] = childSig(c); }
}

/* add what another device recorded */
/* terms, monthly reports and documents are lists inside the file of the child: two devices that add to the same file both keep their lines */
const KID_LISTS = [['terms', x => x.y + '|' + x.t], ['monthly', x => x.m], ['docs', x => x.id]];
function joinKidLists(mine, ic, icNewer) {
  const out = { docsGone: uniq((mine.docsGone || []).concat(ic.docsGone || [])) }, gone = new Set(out.docsGone);
  for (const [k, key] of KID_LISTS) { const map = new Map();
    for (const [list, wins] of [[mine[k] || [], !icNewer], [ic[k] || [], icNewer]]) for (const x of list) { const id = key(x), old = map.get(id); if (!old || (x.ts || 0) > (old.x.ts || 0) || ((x.ts || 0) === (old.x.ts || 0) && wins)) map.set(id, { x }); }
    out[k] = Array.from(map.values()).map(e => e.x).filter(x => k !== 'docs' || !gone.has(x.id)); }
  return out;
}
function putKidLists(c, j, ic) {
  const sig = o => JSON.stringify([KID_LISTS.map(([k, key]) => (o[k] || []).map(x => key(x) + ':' + (x.ts || 0) + ':' + (x.checkedOn || '')).sort()), (o.docsGone || []).slice().sort()]);
  for (const [k] of KID_LISTS) { if (j[k].length || c[k]) c[k] = j[k]; } if (j.docsGone.length) c.docsGone = j.docsGone;
  return sig(c) !== sig(ic);
}
function mergeIncoming(inc, opt) {
  opt = opt || {};
  if (!inc || (inc.format !== 'cyp-edu-changes' && inc.format !== 'cicetekelo-phone-file')) throw new Error('this is not a file of changes made by this app');
  const out = { from: inc.from || '', children: 0, updated: 0, att: 0, sheets: 0, visits: 0, sessions: 0, events: 0, moves: 0, plans: 0, photos: 0, renum: [] };
  const m = syncMeta(); m.base = m.base || {};
  const asg = inc.idAssign || {}, idMap = {}, byUid = {}; for (const c of S.children) if (c.uid) byUid[c.uid] = c;
  const mapId = id => idMap[String(id)] || String(id);
  const moveAway = id => { const x = child(id); if (x) { const nid = nextChildId(); renameChild(x.id, nid); if (x.uid) m.newKids[x.uid] = 1; m.kids[nid] = Date.now(); } };
  for (const [u, fid] of Object.entries(asg)) { const mine = byUid[u]; if (mine && String(mine.id) !== String(fid)) { const other = child(fid); if (other && other !== mine) moveAway(fid); renameChild(mine.id, fid); } }
  for (const ic of inc.children || []) {
    let target = ic.uid && asg[ic.uid] ? String(asg[ic.uid]) : String(ic.id);
    let mine = ic.uid ? byUid[ic.uid] : null;
    if (!mine) { const same = child(target);
      if (same && same.uid && ic.uid && same.uid !== ic.uid) { if (opt.sync) moveAway(target); else { target = nextChildId(); out.renum.push({ name: fullName(ic), from: String(ic.id), to: target }); } }
      else if (same) mine = same; }
    if (mine && String(mine.id) !== target && opt.sync) { const other = child(target); if (other && other !== mine) moveAway(target); renameChild(mine.id, target); }
    if (mine) target = String(mine.id);
    if (target !== String(ic.id)) idMap[String(ic.id)] = target;
    if (mine) { const newer = (ic.updatedTs || 0) > (mine.updatedTs || 0), joined = joinKidLists(mine, ic, newer); if (newer) { Object.assign(mine, ic, { id: mine.id }); out.updated++; }
      if (putKidLists(mine, joined, ic)) { mine.updatedTs = Date.now(); m.kids[mine.id] = mine.updatedTs; if (!newer) out.updated++; } }
    else { const nc = Object.assign({}, ic, { id: target }); S.children.push(nc); if (nc.uid) byUid[nc.uid] = nc; out.children++; }
  }
  for (const [id, src] of Object.entries(inc.photos || {})) { const t = mapId(id); if (child(t)) { photos()[t] = src; out.photos++; } }
  const fix = x => { if (x.childId != null) x.childId = mapId(x.childId); if (Array.isArray(x.children)) x.children = x.children.map(mapId); return x; };
  for (const k of SYNC_KEYS) { S[k] = S[k] || []; const have = new Set(S[k].map(x => x.id)), bs = new Set(m.base[k] || []);
    for (const x of inc[k] || []) { if (!have.has(x.id)) { S[k].push(fix(Object.assign({}, x))); have.add(x.id); out[k]++; } bs.add(x.id); }
    m.base[k] = Array.from(bs); }
  if ((inc.plansRemoved || []).length) { const rm = new Set(inc.plansRemoved), n0 = S.plans.length; S.plans = S.plans.filter(p => !rm.has(p.id)); out.plans += n0 - S.plans.length; }
  for (const key of inc.done || []) { const i = key.indexOf('|'), arr = key.slice(0, i) === 'visit' ? S.visits : S.sessions, it = arr.find(x => x.id === key.slice(i + 1)); if (it && !it.actionDone) it.actionDone = true; }
  for (const [k, ids] of Object.entries(inc.actionsDone || {})) { const set = new Set(ids); for (const x of S[k] || []) if (set.has(x.id) && x.action && !x.actionDone) x.actionDone = true; }
  for (const [d, day] of Object.entries(inc.attendance || {})) { S.attendance[d] = S.attendance[d] || {}; for (const [id0, v] of Object.entries(day)) { const id = mapId(id0); if ((S.attendance[d][id] || '') !== v) { if (v) S.attendance[d][id] = v; else delete S.attendance[d][id]; out.att++; } } }
  for (const s0 of inc.sheets || []) {
    const on = (s0.on || s0.children || []).map(mapId), off = (s0.off || []).map(mapId);
    let mine = S.outreach.find(x => x.date === s0.date && x.type === s0.type);
    const before = mine ? JSON.stringify([mine.children, mine.staffIds, mine.notes, mine.findings]) : '';
    if (!mine) { if (!on.length && !(s0.staffIds || []).length && !s0.notes && !s0.findings) continue; mine = { id: 'LA|' + s0.date + '|' + s0.type, date: s0.date, type: s0.type, staff: '', staffIds: [], children: [], notes: '', by: '' }; S.outreach.push(mine); }
    const offSet = new Set(off);
    mine.children = uniq((mine.children || []).map(String).filter(x => !offSet.has(x)).concat(on));
    if (s0.staffIds) { mine.staffIds = s0.staffIds.slice(); mine.staff = mine.staffIds.map(staffName).join(', ') || mine.staff || ''; }
    if (s0.notes != null) mine.notes = s0.notes;
    if (s0.findings != null) mine.findings = s0.findings;
    if (JSON.stringify([mine.children, mine.staffIds, mine.notes, mine.findings]) !== before) out.sheets++;
  }
  S.outreach = S.outreach.filter(s => !String(s.id).startsWith('LA|') || (s.children || []).length || s.notes || s.findings || (s.staffIds || []).length);
  if (inc.admin && (inc.admin.ts || 0) > (S.meta.adminTs || 0)) { S.staff = inc.admin.staff; S.settings = inc.admin.settings; S.reports = inc.admin.reports || {}; S.meta.adminTs = inc.admin.ts; out.admin = 1;
    if (USER && !GUEST) { USER = S.staff.find(x => x.id === USER.id && x.active) || null; } }
  return out;
}
function mergeText(o) {
  const parts = countText({ attendance: o.att, sheets: o.sheets, visits: o.visits, sessions: o.sessions, children: o.children + o.updated, events: o.events, moves: o.moves, plans: o.plans });
  return (o.from ? 'From ' + o.from + ': ' : '') + (parts || 'nothing new') + '.' + (o.renum.length ? ' New ID given here: ' + o.renum.map(r => r.name + ' ' + r.from + ' → ' + r.to).join('; ') + '.' : '');
}

/* ---------- connection to the shared database ---------- */
var SY = { busy: false, state: '', err: '', timer: null, pushT: null, last: 0, lastPush: 0, fail: 0, got: 0 };
function syncCfg() {
  if (IS_DEMO) return null;
  if (window.CYP_SYNC && window.CYP_SYNC.url) return window.CYP_SYNC;
  try { const c = JSON.parse(lsGet('cyp-sync') || 'null'); return c && c.url ? c : null; } catch (e) { return null; }
}
function syncOn() { return !!syncCfg() && !!(S.meta.sync && S.meta.sync.shared); }
function parseLink(text) { const t = String(text || '').trim(), h = t.indexOf('#c='); if (h >= 0) { try { const o = JSON.parse(unb64u((/^[A-Za-z0-9_-]+/.exec(t.slice(h + 3)) || [''])[0])); /* the whole message may have been copied: only the code after #c= counts */ return o.u && o.k ? Object.assign({ url: o.u, key: o.k }, o.e ? { enc: o.e } : {}) : null; } catch (e) { return null; } } const i = t.indexOf('?'); if (!/^https?:\/\//.test(t) || i < 0) return null; const k = new URLSearchParams(t.slice(i + 1)).get('k'); return k ? { url: t.slice(0, i), key: k } : null; }
/* ---------- the lock: the records are locked on the device before they leave it ----------
   The key of the lock travels only inside the staff link, after the # (a browser never sends that part to a server).
   Google keeps what it receives and cannot read it. In clear stay only what the database needs to give the IDs:
   the ID and the random code of each child, the times, the sizes. Names of staff and of files are not sent. */
const LOCK_FORMAT = 'cyp-edu-locked', LOCK_FILE = 'locked';
const LOCK_MSG = { locked: 'This device does not have the key of the shared database. It needs the new staff link: More, Shared database.', lockkey: 'The key on this device does not open the shared database. It needs the new staff link: More, Shared database.', nolock: 'This browser cannot lock the records. Open the app in Chrome.' };
function lockOn(cfg) { cfg = cfg || syncCfg(); return !!(cfg && cfg.enc); }
function lockCan() { return typeof crypto !== 'undefined' && !!crypto.subtle && typeof TextEncoder !== 'undefined'; }
function bytesB64(u8) { let t = ''; for (let i = 0; i < u8.length; i += 0x8000) t += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(t); }
function b64Bytes(b) { const t = atob(b), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; }
function lockNewKey() { return bytesB64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
const _LOCKKEYS = {};
async function lockKey(enc) { if (!_LOCKKEYS[enc]) { let t = String(enc).replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; _LOCKKEYS[enc] = await crypto.subtle.importKey('raw', b64Bytes(t), 'AES-GCM', false, ['encrypt', 'decrypt']); } return _LOCKKEYS[enc]; }
async function lockSeal(text, enc) {
  const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await lockKey(enc), new TextEncoder().encode(text)));
  const out = new Uint8Array(13 + ct.length); out[0] = 1; out.set(iv, 1); out.set(ct, 13); return bytesB64(out);
}
async function lockOpen(b64, enc) {
  if (!enc) throw new Error('locked'); if (!lockCan()) throw new Error('nolock');
  let u; try { u = b64Bytes(b64); } catch (e) { throw new Error('lockkey'); }
  if (u[0] !== 1 || u.length < 30) throw new Error('lockkey');
  try { return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(1, 13) }, await lockKey(enc), u.subarray(13))); } catch (e) { throw new Error('lockkey'); }
}
const lockStubs = list => (list || []).map(c => ({ id: c.id, uid: c.uid || '' }));
/* what leaves the device */
async function lockOut(body, cfg) {
  if (!lockOn(cfg)) return body;
  if (!lockCan()) throw new Error('nolock');
  const b = Object.assign({}, body), e = cfg.enc;
  if (b.changes) b.changes = { format: LOCK_FORMAT, children: lockStubs(b.changes.children), newKids: b.changes.newKids || [], box: await lockSeal(JSON.stringify(b.changes), e) };
  if (typeof b.state === 'string') b.state = JSON.stringify({ locked: 1, children: lockStubs(JSON.parse(b.state).children), box: await lockSeal(b.state, e) });
  if (b.action === 'file_put') { b.data = await lockSeal(JSON.stringify({ name: b.name, mime: b.mime, data: b.data }), e); b.name = LOCK_FILE; b.mime = 'application/octet-stream'; b.childId = ''; b.kind = ''; }
  if ('user' in b) b.user = '';
  return b;
}
/* what arrives on the device */
async function lockIn(body, r, cfg) {
  if (!r || !r.ok) return r;
  const e = cfg.enc || cfg.encNext; /* the key kept aside: the database took it but the answer did not arrive */
  const got = () => { if (!cfg.enc && cfg.encNext && !window.CYP_SYNC) { const c = syncCfg(); if (c && c.encNext === e) { c.enc = e; delete c.encNext; lsSet('cyp-sync', JSON.stringify(c)); } } };
  if (Array.isArray(r.items)) { const keep = [];
    for (const it of r.items) { const ch = it.changes;
      if (ch && ch.format === LOCK_FORMAT) { const o = JSON.parse(await lockOpen(ch.box, e)); if (ch.idAssign) o.idAssign = ch.idAssign; it.changes = o; keep.push(it); got(); }
      else if (e) console.warn('change not locked: left out', it.seq); /* a device with an old version of the app: its changes are not taken */
      else keep.push(it); }
    r.items = keep; }
  if (typeof r.state === 'string' && r.state.slice(0, 12) === '{"locked":1,') { r.state = await lockOpen(JSON.parse(r.state).box, e); r.wasLocked = true; got(); }
  if (body.action === 'file_get' && r.name === LOCK_FILE) { const o = JSON.parse(await lockOpen(r.data, e)); r.name = o.name; r.mime = o.mime; r.data = o.data; }
  return r;
}
function lockErr(e) { const m = String(e && e.message || e); return LOCK_MSG[m] ? m : ''; }
async function syncPost(body, cfg) {
  cfg = cfg || syncCfg(); if (!cfg) throw new Error('not connected');
  const plain = body; body = await lockOut(body, cfg);
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 45000);
  try { const r = await fetch(cfg.url, { method: 'POST', body: JSON.stringify(Object.assign({ key: cfg.key }, body)), signal: ctl.signal, redirect: 'follow' }); const j = await r.json();
    if (j && typeof j.now === 'number') { const was = clockBad(); SY.skew = j.now - Date.now(); if (clockBad() !== was) setTimeout(render, 0); }
    return await lockIn(plain, j, cfg); }
  finally { clearTimeout(to); }
}
function pendingCount() { if (!S.meta.sync) return 0; const f = buildChanges(); return f.empty ? 0 : Object.values(f.count).reduce((a, b) => a + b, 0); }
function sharedState() { const m = S.meta.sync; S.meta.sync = undefined; let s; try { s = JSON.stringify(S); } finally { S.meta.sync = m; } return s; }
function freshMeta(seq, gen) { const m = { shared: 1, gen: gen || '', cursor: seq, base: {}, att: {}, sheets: {}, photos: {}, kids: {}, newKids: {}, rmPlans: {}, done: {}, loadedAt: Date.now(), sentAt: Date.now(), dirtyAt: 0, adminDirty: 0 }; for (const k of SYNC_KEYS) m.base[k] = (S[k] || []).map(x => x.id); return m; }
function rawSave() { const n = _NOSTAMP; _NOSTAMP = true; try { save(); } finally { _NOSTAMP = n; } }
/* first device: its records become the shared database */
async function syncStart(restart, newKey) {
  if (!S.settings.pin) S.settings.pin = pinValue();
  let cfg = syncCfg();
  /* a new key is kept aside until the database confirms: the same key is used again if the step is repeated */
  if (newKey && !window.CYP_SYNC) { if (!lockCan()) throw new Error('nolock'); if (!cfg.encNext) { cfg.encNext = lockNewKey(); lsSet('cyp-sync', JSON.stringify(cfg)); } cfg = Object.assign({}, cfg, { enc: cfg.encNext }); }
  const r = await syncPost({ action: restart ? 'restart' : 'snapshot_put', seq: 0, state: sharedState() }, cfg);
  if (!r.ok) throw new Error(r.error || 'not saved');
  if (newKey && !window.CYP_SYNC) { const c = syncCfg(); c.enc = c.encNext; delete c.encNext; lsSet('cyp-sync', JSON.stringify(c)); }
  S.meta.sync = freshMeta(r.seq || 0, r.gen); snapChildren(); rawSave();
}
/* any other device: it takes the shared database */
async function syncLoad() {
  const r = await syncPost({ action: 'snapshot_get' });
  if (!r.ok) throw new Error(r.error === 'empty' ? 'the shared database is still empty' : (r.error || 'not loaded'));
  const d = JSON.parse(r.state), uidNow = USER && USER.id;
  if (!r.wasLocked && lockOn() && !window.CYP_SYNC) { const c = syncCfg(); delete c.enc; lsSet('cyp-sync', JSON.stringify(c)); }
  _NOSTAMP = true;
  try { S = Object.assign(blankState(), d); mergeStaff(); S.meta.sync = freshMeta(r.seq || 0, r.gen); snapChildren(); save(); } finally { _NOSTAMP = false; }
  if (uidNow && !GUEST) USER = S.staff.find(s => s.id === uidNow && s.active) || null;
}
function softRender() { const el = document.activeElement; if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.type !== 'checkbox' && el.type !== 'file') { UI.staleView = true; syncBadge(); return; } UI.staleView = false; render(); }
function syncBadge() { const el = document.getElementById('syncchip'); if (el) el.outerHTML = syncChip(); const d = document.getElementById('syncdot'); if (d) d.outerHTML = syncDot(); }
async function syncNow() {
  if (!syncOn() || GUEST || SY.busy) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { SY.state = 'off'; syncBadge(); return; }
  SY.busy = true; SY.state = SY.state === 'off' ? 'off' : 'wait'; syncBadge();
  try {
    SY.lock = '';
    if (S.locked || S.box) { await syncLoad(); render(); } /* an old version of the app took a locked database as it was: take it again, opened */
    let more = true, guard = 0, got = 0;
    while (more && guard++ < 50) {
      const m = syncMeta(), mark = Date.now(), f = buildChanges(), send = f.empty ? null : f;
      const r = await syncPost({ action: 'sync', device: devId(), user: USER ? USER.name : '', since: m.cursor || 0, gen: m.gen || '', changes: send });
      if (!r.ok) { if (r.error === 'reset' || r.error === 'empty') {
          if (r.error === 'reset' && f.empty) { await syncLoad(); SY.state = 'ok'; SY.err = ''; SY.last = Date.now(); render(); return; }
          SY.state = 'err'; SY.err = 'The shared database was replaced. Open "Shared database" in More.'; syncBadge(); return; }
        throw new Error(r.error || 'error'); }
      if (r.gen && !m.gen) m.gen = r.gen;
      _NOSTAMP = true;
      try {
        if (GUEST) return;
        if (send) { ackChanges(send, mark); if (Object.keys(r.assigned || {}).length) mergeIncoming({ format: 'cyp-edu-changes', idAssign: r.assigned, children: [] }, { sync: true }); SY.lastPush = Date.now(); }
        for (const it of r.items || []) { try { mergeIncoming(it.changes, { sync: true }); got++; } catch (e) { console.warn('change skipped', it.seq, e); } }
        syncMeta().cursor = r.seq; syncMeta().lastSync = Date.now();
        snapChildren(); save();
      } finally { _NOSTAMP = false; }
      more = !!r.more;
      if (USER && USER.admin && !more && pendingCount() === 0 && (r.last - (r.snapshotSeq || 0)) >= 150 && !SY.snapDone) { SY.snapDone = true; syncPost({ action: 'snapshot_put', seq: r.seq, state: sharedState() }).catch(() => { SY.snapDone = false; }); }
    }
    SY.state = 'ok'; SY.err = ''; SY.fail = 0; SY.last = Date.now();
    if (got) softRender(); else syncBadge();
    if (!USER && !GUEST) render();
  } catch (e) { const lk = lockErr(e); if (lk) { SY.state = 'err'; SY.lock = lk; SY.err = LOCK_MSG[lk]; if (route().path === 'sync') render(); else syncBadge(); } else { SY.fail++; SY.state = 'off'; SY.err = String(e && e.message || e); syncBadge(); } }
  finally { SY.busy = false; if (syncOn() && pendingCount() && SY.state === 'ok') schedulePush(); }
}
function schedulePush() { if (!syncOn() || GUEST) return; clearTimeout(SY.pushT); const wait = Math.max(2500, 8000 - (Date.now() - SY.lastPush)); SY.pushT = setTimeout(syncNow, SY.state === 'off' ? Math.max(wait, 15000) : wait); if (SY.state === 'ok') { SY.state = 'wait'; syncBadge(); } }
function syncLoop() {
  clearInterval(SY.timer);
  SY.timer = setInterval(() => { if (document.visibilityState === 'visible' && syncOn()) { const gap = SY.state === 'off' ? Math.min(120000, 20000 * (1 + SY.fail)) : 15000; if (Date.now() - Math.max(SY.last, SY.lastTry || 0) >= gap) { SY.lastTry = Date.now(); syncNow(); } } }, 5000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
  window.addEventListener('online', () => syncNow()); window.addEventListener('offline', () => { SY.state = 'off'; syncBadge(); });
  if (syncOn()) syncNow();
}
function syncWord(k, title) { const P = { ok: 'M20 6 9 17l-5-5', send: 'M12 19V5M5 12l7-7 7 7', off: 'M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2-1.5M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8a15 15 0 0 0-11.3-3.8M2 2l20 20' }, W = { ok: 'Saved', send: 'Sending', off: 'Offline' }; return `<a id="syncchip" href="#/sync" class="cyp-appbar__sync" title="${esc(title || '')}"><svg class="cyp-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[k]}"/></svg>${W[k]}</a>`; }
function syncChip() {
  if (typeof LH_HEAD !== 'undefined' && storageOk) { if (!syncOn()) return syncWord('ok', 'Saved on this ' + (isPhone() ? 'phone' : 'computer')); if (SY.state !== 'err') { const n = pendingCount(); return SY.state === 'off' ? syncWord('off', 'No internet: saved on this ' + (isPhone() ? 'phone' : 'computer') + (n ? ' · ' + n + ' to send' : '')) : syncWord(SY.state === 'wait' || n ? 'send' : 'ok', 'Shared database'); } }
  if (!syncOn()) return storageOk ? `<span id="syncchip" class="chip c-green hidem" title="Everything is saved in this browser on this ${isPhone() ? 'phone' : 'computer'}">Saved on this ${isPhone() ? 'phone' : 'computer'}</span>` : `<span id="syncchip" class="chip c-red">Not saving: open the app in Chrome</span>`;
  const p = SY.state === 'wait' || (SY.state !== 'off' && pendingCount());
  if (SY.state === 'err') return `<a id="syncchip" href="#/sync" class="chip c-red">Shared database: open "More"</a>`;
  if (SY.state === 'off') { const n = pendingCount(); return `<a id="syncchip" href="#/sync" class="chip c-orange" title="${esc(SY.err)}">No internet: saved on this ${isPhone() ? 'phone' : 'computer'}${n ? ' · ' + n + ' to send' : ''}</a>`; }
  return `<a id="syncchip" href="#/sync" class="chip ${p ? 'c-blue' : 'c-green'} hidem">${p ? 'Sending…' : 'Shared: up to date'}${UI.staleView ? ' · new data' : ''}</a>`;
}
function syncDot() { if (!syncOn()) return '<span id="syncdot"></span>'; const p = pendingCount(); return `<a id="syncdot" href="#/sync" class="sdot ${SY.state === 'off' || SY.state === 'err' ? 'off' : (SY.state === 'wait' || p) ? 'wait' : 'ok'}" aria-label="${SY.state === 'off' ? 'No connection: saved on this phone, sent later' : p ? 'Sending' : 'Up to date'}"></a>`; }
function isSatellite() { return false; }
function unsent() { return false; }
function syncReminder() {
  if (!syncOn() || SY.state !== 'off') return '';
  const n = pendingCount(); if (!n) return '';
  return `<div class="warn" style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span>No connection. ${n} ${n === 1 ? 'record is' : 'records are'} saved on this ${isPhone() ? 'phone' : 'computer'} and will be sent by themselves when the connection is back.</span><button class="btn sm" data-sact="now">Try now</button></div>`;
}
function vSync() {
  if (GUEST) return `<div class="top"><div><h1>Shared database</h1><p class="lead">Not available in the guest view.</p></div></div>`;
  const cfg = syncCfg(), dev = isPhone() ? 'phone' : 'computer', m = syncMeta();
  const when = t => t ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'not yet';
  const msg = UI.syncMsg ? `<div class="note">${UI.syncMsg}</div>` : '';
  if (IS_DEMO) return `<div class="top"><div><h1>Shared database</h1><p class="lead">In the real app every phone and computer shares one database: what one person records appears on the others by itself. The demo keeps its invented data on this device only.</p></div></div>`;
  if (syncOn()) { const f = buildChanges(), txt = f.empty ? '' : countText(f.count);
    return `<div class="top"><div><h1>Shared database</h1><p class="lead">This ${dev} is connected. What you record is sent by itself, and what the others record arrives by itself. Without a connection the app keeps working and sends later.</p></div></div>${msg}
    <section class="card"><div class="row"><span>State</span><b>${SY.state === 'off' ? 'No connection now' : SY.state === 'err' ? esc(SY.err) : txt ? 'Sending' : 'Up to date'}</b></div>
      <div class="row"><span>Waiting to be sent</span><b>${txt || 'nothing'}</b></div>
      <div class="row"><span>Last exchange with the shared database</span><b>${esc(when(m.lastSync))}</b></div>
      <div class="row"><span>Children in the records</span><b>${S.children.length}</b></div>
      <div class="row"><span>Records locked before they are sent</span><b>${lockOn() ? 'yes' : 'no'}</b></div>
      ${offlineLine()}
      <button class="btn pri" style="margin-top:12px;width:100%" data-sact="now">Send and receive now</button></section>
    ${staffLinkCard()}${installCard()}
    ${SY.state === 'err' && SY.lock ? `<section class="card" style="border:2px solid var(--red)"><h2>${SY.lock === 'nolock' ? 'This browser cannot lock the records' : 'This ' + dev + ' needs the new staff link'}</h2><p class="sub" style="margin:4px 0 10px">${SY.lock === 'nolock' ? 'Open the app in Chrome.' : 'The shared database is locked with a key. The key is inside the staff link. Ask the Education office for the new link.'}</p>${SY.lock === 'nolock' ? '<button class="btn" data-sact="now">Try again</button>' : linkAsk('Paste the new staff link')}</section>` : SY.state === 'err' ? `<section class="card" style="border:2px solid var(--red)"><h2>The shared database was replaced</h2><p class="sub" style="margin:4px 0 10px">${txt ? 'Not sent from this ' + dev + ': ' + esc(txt) + '. They are lost if you continue. ' : ''}This ${dev} has to take the new shared database.</p><button class="btn pri" data-sact="load">Use the shared database</button></section>` : ''}
    ${isSite() ? `<details class="card more"><summary>After an import on this ${dev}: replace the shared database</summary><p class="sub" style="margin:8px 0">Use it only when a starter pack or an import was loaded on this ${dev} after the shared database was started. The records of this ${dev} become the shared database and every other device takes them at its next exchange.</p><button class="btn" data-sact="restart">Replace the shared database with the records of this ${dev}</button></details>` : ''}
    ${isSite() && !window.CYP_SYNC && SY.state !== 'err' ? `<details class="card more" id="lockbox"><summary>${lockOn() ? 'Change the key of the lock' : 'Lock the shared database'}</summary>
      <p class="sub" style="margin:8px 0">${lockOn() ? 'Use it when a phone is lost or a person leaves the project. The old staff link stops opening the records.' : 'With the lock, every phone and computer locks the records before sending them. Google keeps the records and cannot read them. The key of the lock is inside the staff link.'}</p>
      <ol class="sub" style="margin:0 0 10px;padding-left:20px;line-height:1.6"><li>Do it when every phone shows "Up to date": records not sent yet from the other phones are lost.</li><li>After it, send the new staff link to every person (the card "Invite the staff" on this page).</li><li>Keep a copy of the new staff link in a safe place. Without the link, the copy on Google cannot be opened.</li></ol>
      <button class="btn" data-sact="lock">${lockOn() ? 'Change the key' : 'Lock the shared database'}</button></details>` : ''}
    ${isSite() && !window.CYP_SYNC ? `<details class="card more"><summary>Disconnect this ${dev}</summary><p class="sub" style="margin:8px 0">The records stay on this ${dev}, but nothing is sent or received any more.</p><button class="btn danger" data-sact="disconnect">Disconnect</button></details>` : ''}`; }
  if (cfg) { const st = UI.syncPing; if (!st && !UI.syncChecking) { UI.syncChecking = true; setTimeout(() => syncCheck().then(() => { UI.syncChecking = false; }), 0); }
    return `<div class="top"><div><h1>Shared database</h1><p class="lead">The link is saved. One more step for this ${dev}.</p></div></div>${msg}
    <section class="card">${!st ? '<p class="sub">Checking the shared database…</p>' : !st.ok ? `<div class="warn">The shared database does not answer: ${esc(st.error || 'no connection')}.</div><button class="btn" data-sact="check">Try again</button>${USER.admin && !window.CYP_SYNC ? `<form data-form="synclink" style="margin-top:14px"><p class="sub" style="margin:0 0 6px">If the connection of this ${dev} works, the link saved here may be wrong. Paste the right link:</p><label class="f"><span>Link</span><input class="in" name="link" placeholder="https://script.google.com/macros/s/.../exec?k=..." autocomplete="off" required></label><button class="btn pri" style="margin-top:10px">Use this link</button></form>` : ''}` :
      !st.hasSnapshot ? (isSite() && S.children.length ? `<h2>Start the shared database</h2><p class="sub" style="margin:4px 0 10px">The shared database is empty. The ${S.children.length} children and all the records of this ${dev} become the shared database. Do this once, on the one computer where the records are today. After that every computer and every phone is equal.${lockCan() && !window.CYP_SYNC ? ' The records are locked before they are sent: Google keeps them and cannot read them.' : ''}</p><button class="btn pri" data-sact="start">Start with the records of this ${dev}</button>` : `<p class="sub">The shared database is still empty. An Education admin starts it once, from the computer where the records are today.</p>`)
      : `<h2>Use the shared database on this ${dev}</h2><p class="sub" style="margin:4px 0 10px">${S.children.length ? `The ${S.children.length} children recorded on this ${dev} are replaced by the shared database. ` : ''}From then on everything is sent and received by itself.</p><button class="btn pri" data-sact="load">Use the shared database</button>`}
      ${isSite() && !window.CYP_SYNC ? '<p style="margin:12px 0 0"><button class="btn link sub" data-sact="disconnect">Remove the link from this device</button></p>' : ''}</section>`; }
  return `<div class="top"><div><h1>Shared database</h1><p class="lead">Today this ${dev} keeps its own copy of the records and nothing leaves it. With the shared database every phone and computer shows the same records: what one person records appears on the others by itself.</p></div></div>${msg}
  ${isSite() ? `<form class="card" data-form="synclink"><h2>Connect this ${dev}</h2><p class="sub" style="margin:4px 0 10px">Paste the link of the shared database (it is given once, when the database is set up in the Google account).</p>
    <label class="f"><span>Link</span><input class="in" name="link" placeholder="https://script.google.com/macros/s/.../exec?k=..." autocomplete="off" required></label><button class="btn pri" style="margin-top:12px">Connect</button></form>` : '<section class="card"><p class="sub">An Education admin connects this device to the shared database.</p></section>'}`;
}
FORMS.synclink = function (o) {
  const c = parseLink(o.link); if (!c) return toast('This is not the link of the shared database');
  lsSet('cyp-sync', JSON.stringify(c)); UI.syncPing = null; UI.syncMsg = '';
  /* a device already on the shared database that receives a new link (the key was changed): take the database again with it */
  if (syncOn()) { SY.lock = ''; SY.state = 'wait'; render(); syncNow().then(() => { if (route().path === 'sync') render(); }); return; }
  render(); if (USER) syncCheck(); else syncAuto();
};
async function syncCheck() { try { UI.syncPing = await syncPost({ action: 'ping' }); } catch (e) { UI.syncPing = { ok: false, error: 'no connection' }; } if (route().path === 'sync') render(); return UI.syncPing; }
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-sact]'); if (!b || GUEST) return;
  const act = b.dataset.sact;
  try {
    if (act === 'now') { UI.syncMsg = ''; await syncNow(); if (route().path === 'sync') render(); }
    else if (act === 'check') { UI.syncPing = null; render(); await syncCheck(); }
    else if (act === 'start') { if (!confirm('Start the shared database with the ' + S.children.length + ' children and all the records of this device?')) return; b.disabled = true; b.textContent = 'Sending the records…'; await syncStart(false, lockCan() && !lockOn()); UI.syncMsg = 'The shared database is started. The other devices can now use it.' + (lockOn() ? ' Keep a copy of the staff link in a safe place: the key of the lock is inside it.' : ''); SY.state = 'ok'; render(); syncNow(); }
    else if (act === 'restart') { if (!confirm('Are you sure? This replaces the shared database with the ' + S.children.length + ' children and the records of this device. All the data now in the shared database will be lost, for everyone.')) return; if (!confirm('Are you really sure? All previous data will be lost. This cannot be undone.')) return; if (prompt('Last step. Type REPLACE to replace the database of everyone.') !== 'REPLACE') return; b.disabled = true; b.textContent = 'Sending the records…'; await syncStart(true); UI.syncMsg = 'The shared database now holds the records of this device.'; SY.state = 'ok'; render(); }
    else if (act === 'lock') { const was = lockOn(); if (!confirm((was ? 'Change the key of the lock?' : 'Lock the shared database?') + ' Every person will need the new staff link. Records not sent yet from the other phones are lost.')) return; if (prompt('Last step. Type LOCK to continue.') !== 'LOCK') return; b.disabled = true; b.textContent = 'Sending the records…'; await syncStart(true, true); UI.syncMsg = (was ? 'The key is changed.' : 'The shared database is locked.') + ' Now send the new staff link to every person and keep a copy of it in a safe place.'; SY.state = 'ok'; SY.lock = ''; render(); }
    else if (act === 'load') { if (S.children.length && !confirm('Replace the records on this device with the shared database?')) return; b.disabled = true; b.textContent = 'Loading the records…'; await syncLoad(); UI.syncMsg = 'This device now uses the shared database: ' + S.children.length + ' children.'; SY.state = 'ok'; render(); syncNow(); }
    else if (act === 'disconnect') { if (!confirm('Disconnect this device from the shared database?')) return; lsSet('cyp-sync', null); if (S.meta.sync) S.meta.sync.shared = 0; rawSave(); UI.syncPing = null; UI.syncMsg = 'Disconnected.'; render(); }
  } catch (err) { const lk = lockErr(err); UI.syncMsg = lk ? esc(LOCK_MSG[lk]) : 'Not done: ' + esc(String(err && err.message || err)) + '.'; render(); }
});
/* opened from the link of the shared database: connect without questions */
async function syncAuto() {
  if (IS_DEMO) return;
  syncLoop();
  if (!syncCfg() || syncOn()) return;
  const st = await syncCheck();
  if (st && st.ok && st.hasSnapshot && !S.children.length) { try { await syncLoad(); SY.state = 'ok'; render(); syncNow(); } catch (e) { const lk = lockErr(e); UI.syncMsg = lk ? esc(LOCK_MSG[lk]) : 'Not loaded: ' + esc(String(e.message || e)); render(); } }
  else if (!USER) render();
}
