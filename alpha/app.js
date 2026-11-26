'use strict';
/* Cicetekelo Youth Project records - alpha 0.1
   One file, works offline. Data is kept in this browser (IndexedDB) on this computer. */

const VERSION = 'beta 1.8.1';
const BUILD_DATE = '2026-11-24'; /* the day this version was made: a device with an earlier date has a wrong clock */
const SECTIONS = {
  Luigi:  { phase: 1, centre: 'Luigi',    label: 'Luigi',                     color: '#3A5EA8', ink: '#14213D' },
  UCC:    { phase: 2, centre: 'Minsundu', label: 'Minsundu · UCC',            color: '#ECC000', ink: '#14213D' },
  Nkwazi: { phase: 3, centre: 'Nkwazi',   label: 'Nkwazi Centre',              color: '#319536', ink: '#14213D' },
  Youth:  { phase: 4, centre: 'Minsundu', label: 'Minsundu · Youth',          color: '#ECC000', ink: '#14213D' }
};
const SECTION_KEYS = ['Luigi', 'UCC', 'Nkwazi', 'Youth'];
const FAMILY_SECTIONS = ['UCC', 'Youth', 'Nkwazi'];
const STATUSES = ['Active', 'Semi-active', 'Follow-up', 'Closed'];
const STATUS_LABEL = { 'Active': 'Active', 'Semi-active': 'Semi-active', 'Follow-up': 'Reintegrated, in 2-year follow-up', 'Closed': 'File closed' };
const STATUS_CHIP = { 'Active': 'c-green', 'Semi-active': 'c-yellow', 'Follow-up': 'c-purple', 'Closed': '' };
const CLOSE_REASONS = ['2-year follow-up completed', 'Left the programme, no longer comes', 'Transferred to another partner', 'Moved to another Cicetekelo centre', 'Went back to the family', 'Moved to another town', 'Returned to Social Welfare', 'Ran away / lost contact', 'Stopped school', 'Completed school', 'Died', 'Aged out of the programme', 'Other'];
const SCHOOL_TYPES = ['Nkwazi community school', 'Literacy class (Minsundu)', 'Luigi Special School', 'GRZ primary', 'GRZ secondary', 'Private school', 'College / skills training', 'Not in school'];
const VISIT_PURPOSES = ['Family tracing', 'Assessment', 'Follow-up', 'Emergency', 'School visit'];
const VISIT_WHERE = ['Home', 'School', 'Phone', 'Other'];
const EVENT_TYPES = ['Something happened', 'Visited family', 'Bonding with family', 'Sick, medical attention', 'Child protection concern', 'Sneaked out', 'Came back'];
const PROGRAMMES = ['ABA', 'ZAS', 'Muchinga'];
const SUPPORT = ['Nutrition', 'Medical', 'Girl-child activities'];
const OUTREACH_TYPES = ['Day outreach', 'Night outreach', 'Drop-in'];
const SESSION_TYPES = ['Individual', 'Group', 'Family'];
const CENTRES = ['Minsundu', 'Luigi', 'Nkwazi'];
const STAFF_SECTIONS = ['Education Department', 'Family', 'School', 'UCC', 'Youth', 'Luigi', 'Nkwazi', 'Counseling', 'Sports', 'Skills Training', 'Other'];
/* examination classes, by year. Zambia is moving from grades to Form 1-4 (2023 curriculum framework):
   the last Grade 9 examination was in 2025; Grade 7 and Grade 12 are written until 2028, when Grade 6 and Form 4 write with them; from 2029 Grade 6 and Form 4. */
function examGrades(y) { y = Number(y) || Number(today().slice(0, 4)); return y <= 2025 ? ['7', '9', '12'] : y <= 2027 ? ['7', '12'] : y === 2028 ? ['6', '7', '12', 'Form 4'] : ['6', 'Form 4']; }
function inExamClass(c, y) { return examGrades(y).includes(gradeNorm(c.grade)); }
/* the classes to choose from while both systems are in the schools */
const GRADE_LIST = ['ECE', '1', '2', '3', '4', '5', '6', '7', 'Form 1', 'Form 2', 'Form 3', 'Form 4', '10', '11', '12', '1st year', '2nd year', '3rd year', '4th year'];
function gradeLabel(g) { g = String(g || ''); return /^\d+$/.test(g) ? 'grade ' + g : g; }

/* ---------- small helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function today() { return iso(new Date()); }
function thisMonth() { return today().slice(0, 7); }
function addDays(s, n) { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); }
function daysBetween(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5); }
function monthStart(m) { return m + '-01'; }
function monthEnd(m) { const [y, mo] = m.split('-').map(Number); return iso(new Date(y, mo, 0)); }
function addMonths(m, n) { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 1 + n, 1); return iso(d).slice(0, 7); }
function inRange(d, a, b) { return !!d && d >= a && d <= b; }
function fmtDate(s) { if (!s) return ''; const d = new Date(s + 'T00:00:00'); if (isNaN(d)) return s; return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtMonth(m) { const d = new Date(m + '-01T00:00:00'); return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
function quarterOf(m) { const [y, mo] = m.split('-').map(Number); const q = Math.floor((mo - 1) / 3); return { label: 'Q' + (q + 1) + ' ' + y, start: y + '-' + String(q * 3 + 1).padStart(2, '0') + '-01', end: monthEnd(y + '-' + String(q * 3 + 3).padStart(2, '0')) }; }
function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function initials(n) { return String(n || '?').replace(/\(.*?\)/g, '').replace(/[^A-Za-z\s'-]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
function titleCase(s) { s = String(s || '').trim(); if (!s) return ''; if (s !== s.toUpperCase()) return s; return s.toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase()); }
function uniq(a) { return Array.from(new Set(a)); }
function pct(n, d) { return d ? Math.round(n / d * 1000) / 10 : 0; }
function opt(list, val, blank) { return (blank != null ? `<option value="">${esc(blank)}</option>` : '') + list.map(o => { const v = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o; return `<option value="${esc(v)}"${String(v) === String(val ?? '') ? ' selected' : ''}>${esc(l)}</option>`; }).join(''); }
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }

/* ---------- storage (IndexedDB, fallback memory) ---------- */
const IS_DEMO = typeof DEMO_STATE !== 'undefined';
const DB_NAME = IS_DEMO ? 'cicetekelo-records-demo' : 'cicetekelo-records', DB_STORE = 'kv';
const USER_KEY = IS_DEMO ? 'cyp-demo-user' : 'cyp-user';
/* Demo: the invented data was made for DEMO_BASE; every date moves forward so that the demo always looks current. */
function demoState() {
  const st = JSON.parse(JSON.stringify(DEMO_STATE));
  const shift = Math.max(0, daysBetween(DEMO_BASE, today()));
  const months = (Number(today().slice(0, 4)) - Number(DEMO_BASE.slice(0, 4))) * 12 + Number(today().slice(5, 7)) - Number(DEMO_BASE.slice(5, 7));
  const day = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? addDays(v, shift) : v;
  const walk = o => { if (Array.isArray(o)) return o.map(walk); if (o && typeof o === 'object') { for (const k of Object.keys(o)) o[k] = walk(o[k]); return o; } return day(o); };
  for (const k of ['children', 'visits', 'events', 'moves', 'sessions', 'outreach']) st[k] = walk(st[k]);
  const att = {}; for (const [d, v] of Object.entries(st.attendance)) { const nd = addDays(d, shift); if (nd < today()) att[nd] = v; } st.attendance = att;
  const mk = o => { const n = {}; for (const [m, v] of Object.entries(o || {})) n[addMonths(m, Math.max(0, months))] = walk(v); return n; };
  st.reports = mk(st.reports); st.settings.targets = mk(st.settings.targets);
  for (const p of st.plans || []) p.month = addMonths(p.month, Math.max(0, months));
  st.staff = seedStaff(); st.meta.staffSeed = 2;
  st.meta.demoLoaded = today();
  return st;
}
let storageOk = true;
function idb() {
  return new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(DB_STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
}
async function loadState() {
  try {
    const db = await idb();
    return await new Promise((res, rej) => { const tx = db.transaction(DB_STORE, 'readonly'); const g = tx.objectStore(DB_STORE).get('state'); g.onsuccess = () => res(g.result || null); g.onerror = () => rej(g.error); });
  } catch (e) { storageOk = false; return null; }
}
let saveTimer = null;
function save() {
  if (GUEST) return;
  stampChanges();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (!storageOk || GUEST) return;
    try {
      const db = await idb();
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(JSON.parse(JSON.stringify(S)), 'state');
    } catch (e) { storageOk = false; render(); }
  }, 150);
}
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } }

/* ---------- state ---------- */
let S = null;
let USER = null;
const UI = { q: '', toggles: {} };

function blankState() {
  return {
    v: 1, created: today(),
    children: [], visits: [], events: [], moves: [], sessions: [], outreach: [], attendance: {},
    reports: {}, history: [], historyMissing: [], staff: defaultStaff(),
    settings: { interval: { 'Resident': 90, 'Non-resident': 180, 'Follow-up': 90 }, targets: {} },
    meta: { lastBackup: '', imported: '' }
  };
}
function defaultStaff() { return seedStaff(); }
function staffName(id) { const s = S.staff.find(x => x.id === id); return s ? s.name : (id || ''); }
function activeStaff() { return S.staff.filter(s => s.active); }
function child(id) { id = String(id); const al = S.aliases && S.aliases[id]; if (al) id = String(al); return S.children.find(c => String(c.id) === id); }
function fullName(c) { return [c.name, c.surname].filter(Boolean).join(' ') || '(no name)'; }
function displayName(c) { return fullName(c) + (c.nickname ? ' "' + c.nickname + '"' : ''); }
/* full years between two dates: the number changes on the day of the birthday */
function yearsBetween(from, to) {
  const f = String(from || '').slice(0, 10).split('-').map(Number), t = String(to || '').slice(0, 10).split('-').map(Number);
  if (f.length < 3 || t.length < 3 || f.some(isNaN) || t.some(isNaN)) return NaN;
  return t[0] - f[0] - (t[1] < f[1] || (t[1] === f[1] && t[2] < f[2]) ? 1 : 0);
}
function curAge(c) {
  if (c.dob) { const a = yearsBetween(c.dob, today()); return isNaN(a) || a < 0 ? '' : a; }
  if (c.age === '' || c.age == null || isNaN(Number(c.age))) return '';
  const extra = c.ageAsOf ? yearsBetween(c.ageAsOf, today()) : 0;
  return Number(c.age) + (isNaN(extra) ? 0 : Math.max(0, extra));
}
/* how the age is known: from the date of birth, or from an age written on a given day */
function ageText(c) {
  const a = curAge(c); if (a === '') return 'Not known';
  if (c.dob) return a + ' years';
  return 'about ' + a + ' years (no date of birth)';
}
function centreOf(c) { return (SECTIONS[c.section] || {}).centre || ''; }
function isCurrent(c) { return c.status === 'Active' || c.status === 'Semi-active'; }
function movesOf(id) { return S.moves.filter(m => String(m.childId) === String(id)).sort((a, b) => (a.date || '').localeCompare(b.date || '')); }
function visitsOf(id) { return S.visits.filter(v => String(v.childId) === String(id)); }
function inCareOn(c, d) {
  if (c.entryDate && c.entryDate > d) return false;
  let inCare = true;
  for (const m of movesOf(c.id)) {
    if ((m.date || '') > d) break;
    if (m.type === 'reintegrated' || m.type === 'closed') inCare = false;
    if (m.type === 'reopened' || m.type === 'section') inCare = true;
  }
  return inCare;
}
/* where the child sleeps: Resident, In transit (at the centre for a few days, an emergency), Non-resident */
const RES3 = ['Resident', 'In transit', 'Non-resident'];
function sleepsHere(c) { return c.residence === 'Resident' || c.residence === 'In transit'; }
function addMove(childId, type, date, extra) {
  S.moves.push(Object.assign({ id: uid('m'), childId: String(childId), type, date: date === undefined ? today() : (date || ''), by: USER ? USER.id : '' }, extra || {}));
}

/* ---------- visits due ---------- */
function lastHomeVisit(c) {
  let last = '';
  for (const v of visitsOf(c.id)) if (v.purpose !== 'School visit' && v.successful !== 'No' && v.date > last) last = v.date;
  return last;
}
function visitInfo(c) {
  const key = c.status === 'Follow-up' ? 'Follow-up' : sleepsHere(c) ? 'Resident' : 'Non-resident';
  const every = Number(S.settings.interval[key]) || 180;
  const last = lastHomeVisit(c);
  if (!last) return { last: '', every, due: '', late: null, never: true };
  const due = addDays(last, every);
  return { last, every, due, late: daysBetween(due, today()), never: false };
}
function needsVisits(c) { return FAMILY_SECTIONS.includes(c.section) && (isCurrent(c) || c.status === 'Follow-up'); }

/* ---------- record checks ---------- */
const ISSUES = {
  section: 'UCC or Youth proposed from the age, to confirm',
  compound: 'No compound or address',
  guardian: 'No guardian or contact',
  entry: 'No date of entry',
  school: 'No school type (under 18)',
  sex: 'No sex recorded',
  exit: 'Reintegrated or closed without a date',
  files: 'The two Nkwazi files disagree or something is missing: see the note in the profile',
  dob: 'No date of birth (age only, or nothing)'
};
function issuesOf(c) {
  const out = [];
  if (c.sectionToCheck) out.push('section');
  if (!c.compound && !c.familyAddress) out.push('compound');
  if (c.section !== 'Luigi' && !c.guardianName && !c.contact && !c.mother && !c.father) out.push('guardian');
  if (c.section !== 'Luigi' && !c.entryDate && !c.entryYear) out.push('entry');
  if ((c.toCheck || []).length) out.push('files');
  if (isCurrent(c) && c.section !== 'Luigi' && curAge(c) !== '' && curAge(c) < 18 && !c.schoolType) out.push('school');
  if (!c.sex) out.push('sex');
  if ((c.status === 'Follow-up' && !c.reintegrationDate) || (c.status === 'Closed' && !c.closeDate)) out.push('exit');
  return out;
}

/* ---------- pending ---------- */
function pendingData() {
  const t = today();
  const due = [], never = [];
  for (const c of S.children) {
    if (!needsVisits(c)) continue;
    const vi = visitInfo(c);
    if (vi.never) never.push({ c, vi }); else if (vi.late >= 0) due.push({ c, vi });
  }
  due.sort((a, b) => b.vi.late - a.vi.late);
  const absent = absenceList(), missing = absent.filter(x => !x.long), longAbs = absent.filter(x => x.long);
  const actions = [];
  for (const v of S.visits) if (v.action && !v.actionDone) actions.push({ kind: 'visit', item: v });
  for (const s of S.sessions) if (s.action && !s.actionDone) actions.push({ kind: 'session', item: s });
  actions.sort((a, b) => (a.item.date || '').localeCompare(b.item.date || ''));
  const followEnd = S.children.filter(c => c.status === 'Follow-up' && c.reintegrationDate && daysBetween(c.reintegrationDate, t) >= 730);
  const issueCount = {}; let withIssues = 0;
  for (const c of S.children) { if (c.status === 'Closed') continue; const is = issuesOf(c); if (is.length) withIssues++; for (const k of is) issueCount[k] = (issueCount[k] || 0) + 1; }
  const lastM = addMonths(thisMonth(), -1);
  const reports = [];
  for (const k of (S.children.length ? REPORT_KEYS : [])) {
    const def = REPORTS[k]; if (def.quarterly) continue;
    if (def.freq === 'quarterly' && !['03', '06', '09', '12'].includes(lastM.slice(5))) continue;
    const rs = typeof repState === 'function' ? repState(lastM, k).state : ((S.reports[lastM] || {})[k] || {}).checked ? 'checked' : 'open';
    if (rs !== 'checked') reports.push({ key: k, month: lastM, st: { prepared: rs === 'sent', back: rs === 'back' } });
  }
  const backupDays = typeof syncOn === 'function' && syncOn() ? 0 : S.meta.lastBackup ? daysBetween(S.meta.lastBackup, t) : null; /* the shared database is copied every day on the server */
  const total = due.length + never.length + missing.length + longAbs.length + actions.length + followEnd.length + withIssues + reports.length;
  const urgent = due.length + missing.length + longAbs.length + actions.length + followEnd.length + reports.length;
  const review = S.children.filter(c => reviewSignals(c).score > 0).length;
  return { due, never, missing, longAbs, actions, followEnd, issueCount, withIssues, reports, backupDays, total, urgent, review };
}

/* ---------- CSV ---------- */
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const head = (rows.shift() || []).map(h => h.trim());
  return rows.filter(r => r.some(x => String(x).trim() !== '')).map(r => { const o = {}; head.forEach((h, i) => o[h] = r[i] == null ? '' : r[i]); return o; });
}
function toCSV(rows, cols) {
  const q = v => { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return '﻿' + [cols.map(c => q(c.label || c.key)).join(',')].concat(rows.map(r => cols.map(c => q(typeof c.get === 'function' ? c.get(r) : r[c.key])).join(','))).join('\r\n');
}
function download(name, text, type) {
  const blob = new Blob([text], { type: type || 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- Excel (.xlsx) export, no library ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files, type) {
  const enc = new TextEncoder(); const parts = [], central = []; let offset = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, 0, true); h.setUint16(12, 0x21, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nm, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), nm); offset += 30 + nm.length + data.length;
  }
  const cd = central.reduce((s, a) => s + a.length, 0); const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cd, true); e.setUint32(16, offset, true);
  return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type });
}
function xEsc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); }
function colName(i) { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
function cellVal(v) { if (typeof v === 'string' && /^-?\d{1,9}(\.\d+)?$/.test(v) && !/^0\d/.test(v)) return Number(v); return v; }
function sheetXml(rows, filter) {
  const w = [];
  rows.forEach(r => r.forEach((v, i) => { const l = String(v == null ? '' : v).length; w[i] = Math.min(60, Math.max(w[i] || 6, l + 2)); }));
  const cols = w.length ? '<cols>' + w.map((x, i) => `<col min="${i + 1}" max="${i + 1}" width="${x}" customWidth="1"/>`).join('') + '</cols>' : '';
  const body = rows.map((r, ri) => `<row r="${ri + 1}">` + r.map((v0, ci) => {
    const v = cellVal(v0); if (v === null || v === undefined || v === '') return '';
    const ref = colName(ci) + (ri + 1), st = ri === 0 ? ' s="1"' : '';
    if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}"${st}><v>${v}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${xEsc(v)}</t></is></c>`;
  }).join('') + '</row>').join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols}<sheetData>${body}</sheetData>${filter && rows.length > 1 && w.length ? `<autoFilter ref="A1:${colName(w.length - 1)}${typeof filter === 'number' ? filter : rows.length}"/>` : ''}</worksheet>`;
}
/* sheets: [{ name, rows: [[header...], [values...], ...] }] */
function downloadXlsx(filename, sheets) {
  const used = {};
  sheets = sheets.map((s, i) => { let n = String(s.name || 'Sheet' + (i + 1)).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31) || 'Sheet' + (i + 1); while (used[n]) n = n.slice(0, 28) + ' ' + i; used[n] = 1; return { name: n, rows: s.rows, filter: s.filter }; });
  const ns = 'http://schemas.openxmlformats.org/';
  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="${ns}package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${ns}package/2006/relationships"><Relationship Id="rId1" Type="${ns}officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${ns}spreadsheetml/2006/main" xmlns:r="${ns}officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${ns}package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="${ns}officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="${ns}officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${ns}spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` }
  ].concat(sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s.rows, s.filter) })));
  const blob = zipStore(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename.replace(/\.(csv|xlsx)$/i, '') + '.xlsx'; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  toast('Excel file downloaded');
}
function colsToRows(list, cols) { return [cols.map(c => c.label || c.key)].concat(list.map(r => cols.map(c => { const v = typeof c.get === 'function' ? c.get(r) : r[c.key]; return v == null ? '' : v; }))); }

/* ---------- read .xlsx files (no library) ---------- */
async function unzipEntries(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  let eocd = -1; for (let i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('not an Excel (.xlsx) file');
  const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder(); const out = {};
  for (let k = 0; k < n; k++) {
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    out[name] = { method, csize, off };
    p += 46 + nlen + xlen + clen;
  }
  return {
    async text(name) {
      const e = out[name]; if (!e) return null;
      const ln = dv.getUint16(e.off + 26, true), lx = dv.getUint16(e.off + 28, true);
      const data = u8.subarray(e.off + 30 + ln + lx, e.off + 30 + ln + lx + e.csize);
      if (e.method === 0) return dec.decode(data);
      if (typeof DecompressionStream === 'undefined') throw new Error('this browser cannot open Excel files: use Edge or Chrome');
      const ds = new DecompressionStream('deflate-raw');
      const stream = new Blob([data]).stream().pipeThrough(ds);
      return await new Response(stream).text();
    }, names: Object.keys(out)
  };
}
async function readXlsxFirstSheet(buf) {
  const z = await unzipEntries(buf);
  const P = s => new DOMParser().parseFromString(s, 'application/xml');
  const ssx = await z.text('xl/sharedStrings.xml');
  const shared = ssx ? Array.from(P(ssx).getElementsByTagName('si')).map(si => Array.from(si.getElementsByTagName('t')).map(t => t.textContent).join('')) : [];
  const wb = P(await z.text('xl/workbook.xml'));
  const rels = P(await z.text('xl/_rels/workbook.xml.rels'));
  const first = wb.getElementsByTagName('sheet')[0];
  const rid = first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
  let target = Array.from(rels.getElementsByTagName('Relationship')).find(r => r.getAttribute('Id') === rid).getAttribute('Target');
  target = target.replace(/^\/?xl\//, '').replace(/^\//, '');
  const sh = P(await z.text('xl/' + target));
  const grid = [];
  for (const c of Array.from(sh.getElementsByTagName('c'))) {
    const ref = c.getAttribute('r'); const m = /^([A-Z]+)(\d+)$/.exec(ref); if (!m) continue;
    let col = 0; for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64); col--;
    const row = Number(m[2]) - 1, t = c.getAttribute('t');
    const v = c.getElementsByTagName('v')[0];
    let val = '';
    if (t === 's') val = shared[Number(v && v.textContent)] || '';
    else if (t === 'inlineStr') val = Array.from(c.getElementsByTagName('t')).map(x => x.textContent).join('');
    else val = v ? v.textContent : '';
    (grid[row] = grid[row] || [])[col] = val;
  }
  return grid;
}
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
function nameKey(s) { return String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(w => w.length > 1).sort().join(' '); }
function parseLuigiList(grid) {
  let month = '', hr = -1, cols = {};
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r] || [];
    for (let c = 0; c < row.length; c++) {
      const v = String(row[c] || '').trim();
      const mm = /statistics\s+for\s+([a-z]+)\s+(\d{4})/i.exec(v) || /worked with in\s+([a-z]+)\s+(\d{4})/i.exec(v);
      if (mm && !month && MONTHS.includes(mm[1].toLowerCase())) month = mm[2] + '-' + String(MONTHS.indexOf(mm[1].toLowerCase()) + 1).padStart(2, '0');
      if (/^name$/i.test(v) && hr < 0 && row.some(x => /^sex$/i.test(String(x || '').trim()))) { hr = r; row.forEach((x, i) => { const k = String(x || '').trim().toLowerCase(); if (k) cols[k] = i; }); }
    }
  }
  if (hr < 0) throw new Error('no table with NAME and SEX columns found');
  const kids = [];
  for (let r = hr + 1; r < grid.length; r++) {
    const row = grid[r] || []; const name = String(row[cols.name] || '').trim();
    if (!name || /total number|girls\s*\d/i.test(name)) continue;
    kids.push({ name, sex: String(row[cols.sex] || '').trim().toUpperCase().startsWith('F') ? 'F' : 'M', age: Number(row[cols.age]) || '', place: titleCase(String(row[cols.place] || '').trim()) });
  }
  return { month, kids };
}
function importLuigiList(L, month) {
  noStamp();
  const date = month + '-01', ageAsOf = month + '-15';
  const index = {}; for (const c of S.children) { const k = nameKey(fullName(c)); if (k.includes(' ')) (index[k] = index[k] || []).push(c); }
  const ids = [], matched = [], created = [], seen = {};
  for (const k of L) {
    const key = nameKey(k.name);
    if (seen[key]) continue; seen[key] = 1;
    const cand = (index[key] || []).filter(c => { const a = curAge(c); if (a === '' || !k.age) return true; return Math.abs((a - Math.max(0, Math.floor(daysBetween(ageAsOf, today()) / 365.25))) - k.age) <= 2; });
    let pick = cand;
    if (pick.length > 1) { const fromLists = pick.filter(c => String(c.importedFrom || '').startsWith('Luigi list') && Number(c.age) === Number(k.age)); if (fromLists.length) pick = [fromLists[0]]; }
    if (pick.length === 1) { ids.push(String(pick[0].id)); matched.push(pick[0]); continue; }
    const parts = k.name.replace(/\s+/g, ' ').split(' ');
    const c = { id: nextChildId(), surname: titleCase(parts[0]), name: titleCase(parts.slice(1).join(' ')), nickname: '', sex: k.sex, age: k.age, ageAsOf, compound: k.place, section: 'Luigi', residence: 'Non-resident', status: 'Active', entryDate: '', referredBy: '', responsible: '', programmes: [], support: [], importedFrom: 'Luigi list of ' + fmtMonth(month), createdAt: today(), createdBy: USER.id };
    S.children.push(c); ids.push(c.id); created.push(c);
  }
  const removed = dedupeLuigiImports();
  let s = S.outreach.find(o => o.imported && o.date === date);
  if (s) s.children = uniq(s.children.concat(ids)); else S.outreach.push({ id: uid('o'), date, type: 'Monthly list', imported: true, staff: 'Luigi team', children: ids, notes: 'Imported from the Luigi statistics of ' + fmtMonth(month) + ' (names only, activities not recorded per child)', by: USER.id });
  save();
  return { matched, created: created.filter(c => S.children.includes(c)), total: ids.length, removed };
}
/* Children created twice from the same Luigi list (same name, age, list) and with nothing recorded on the copy: keep the first, move links. */
function dedupeLuigiImports() {
  const used = id => S.visits.some(v => String(v.childId) === id) || S.events.some(e => String(e.childId) === id) || S.moves.some(m => String(m.childId) === id) || S.sessions.some(x => (x.children || []).map(String).includes(id)) || Object.values(S.attendance).some(d => d && d[id] != null);
  const first = {}; let removed = 0;
  for (const c of S.children.slice()) {
    if (!String(c.importedFrom || '').startsWith('Luigi list')) continue;
    const k = nameKey(fullName(c)) + '|' + c.age + '|' + c.importedFrom;
    if (!first[k]) { first[k] = c; continue; }
    const id = String(c.id); if (used(id)) continue;
    for (const o of S.outreach) o.children = uniq((o.children || []).map(x => String(x) === id ? String(first[k].id) : String(x)));
    S.children.splice(S.children.indexOf(c), 1); removed++;
  }
  return removed;
}

/* ---------- import from Riccardo's tool ---------- */
function clean(v) { v = String(v == null ? '' : v).trim(); return /^(none|n\/a|na|-|nil|null)$/i.test(v) ? '' : v; }
function staffIdByName(n) {
  n = String(n || '').trim(); if (!n) return '';
  const low = n.toLowerCase();
  let s = S.staff.find(x => x.name.toLowerCase() === low) || S.staff.find(x => low.startsWith(x.name.toLowerCase().split(' ')[0]) && x.name.split(' ').length > 1 && low.includes(x.name.toLowerCase().split(' ').slice(-1)[0]));
  if (!s) { s = { id: uid('s'), name: titleCase(n), role: '', areas: [], section: 'Other', admin: false, active: true }; S.staff.push(s); }
  return s.id;
}
function importRiccardo(rows) {
  noStamp();
  let added = 0, updated = 0;
  for (const r of rows) {
    const id = String(r.id || '').trim(); if (!id) continue;
    const age = clean(r.age);
    const asOf = (clean(r.insert_date) || today()).slice(0, 10);
    const resRaw = clean(r.residential_status).toLowerCase();
    const leave = clean(r.leaving_status).toLowerCase();
    const leaveDate = clean(r.leaving_date).slice(0, 10);
    const reintegrated = leave === 'family' || resRaw === 'left';
    const ageNum = Number(age);
    const etype = clean(r.education_type).toLowerCase();
    const c = {
      id, name: titleCase(clean(r.name)), surname: titleCase(clean(r.surname)), nickname: clean(r.nickname),
      sex: (clean(r.gender).toUpperCase()[0] === 'F') ? 'F' : (clean(r.gender) ? 'M' : ''),
      dob: '', age: age === '' || isNaN(ageNum) || ageNum === 0 ? '' : ageNum, ageAsOf: asOf,
      section: !isNaN(ageNum) && ageNum >= 18 ? 'Youth' : 'UCC', sectionToCheck: true,
      residence: resRaw.startsWith('res') ? 'Resident' : 'Non-resident',
      status: reintegrated ? 'Follow-up' : 'Active',
      reintegrationDate: reintegrated ? leaveDate : '', closeDate: '', closeReason: '',
      entryDate: clean(r.entrance_date).slice(0, 10), referredBy: clean(r.origin_facility), responsible: staffIdByName(r.responsible_person),
      compound: clean(r.location_details), familyAddress: clean(r.familyloc), languages: clean(r.languages),
      father: clean(r.father), mother: clean(r.mother), otherRelatives: clean(r.other_relatives), guardianName: clean(r.guardian_name), guardianRelation: clean(r.guardian_relation), contact: clean(r.contact),
      familyBackground: clean(r.family_background), educationAtEntry: [clean(r.education_background), clean(r.education_grade) ? 'Grade at entry: ' + clean(r.education_grade) : ''].filter(Boolean).join('. '),
      schoolType: etype === 'skill' ? 'College / skills training' : '', schoolName: clean(r.school_name), grade: clean(r.current_education).replace(/(st|nd|rd|th)$/i, ''), skill: clean(r.skill_category),
      programmes: [], support: [], medical: clean(r.medical), disabilities: clean(r.disabilities), objectives: clean(r.objectives), notes: clean(r.notes),
      importedFrom: 'Minsundu tool (Riccardo)', createdAt: asOf
    };
    const old = child(id);
    if (old) {
      // keep anything recorded in this app; fill only empty fields from the import
      for (const k of Object.keys(c)) { if (old.nkzKey && /^(entryDate|referredBy|reintegrationDate)$/.test(k)) continue; if ((old[k] === '' || old[k] == null) && c[k] !== '') old[k] = c[k]; }
      updated++;
    } else {
      S.children.push(c); added++;
      if (reintegrated) addMove(id, 'reintegrated', leaveDate, { note: 'From the Minsundu tool: left to family' });
    }
  }
  S.meta.imported = today();
  save();
  return { added, updated };
}

/* ---------- starter pack: everything at first start ---------- */
function importStarterPack(pack) {
  noStamp();
  if (!pack || pack.format !== 'cicetekelo-starter-pack') throw new Error('this is not a Cicetekelo starter pack');
  const out = { children: 0, luigi: null, history: 0 };
  if (pack.riccardoCsv) { const r = importRiccardo(parseCSV(pack.riccardoCsv)); out.children = r.added; out.childrenUpdated = r.updated; }
  if (pack.luigi && pack.luigi.kids) out.luigi = importLuigiList(pack.luigi.kids, pack.luigi.month);
  if (pack.luigiDb) out.luigiDb = importLuigiDb(pack.luigiDb);
  if (pack.nkwazi) out.nkwazi = importNkwazi(pack.nkwazi);
  for (const [id, b64] of Object.entries(pack.photos || {})) if (child(id)) photos()[id] = 'data:image/jpeg;base64,' + b64;
  if (Array.isArray(pack.history)) {
    const key = h => h.section + '|' + h.period;
    const have = new Set(S.history.map(key));
    out.historyUpdated = 0;
    for (const h of pack.history) {
      if (!have.has(key(h))) { S.history.push(h); out.history++; continue; }
      const i = S.history.findIndex(x => key(x) === key(h));
      if (JSON.stringify(S.history[i]) !== JSON.stringify(h)) { S.history[i] = h; out.historyUpdated++; }
    }
  }
  S.historyMissing = pack.missing || S.historyMissing || [];
  S.meta.starterPack = pack.created || today(); S.meta.starterPackVersion = pack.version || 1;
  save();
  return out;
}
function periodSort(p) { const m = /^(\d{4})-Q(\d)$/.exec(p); return m ? m[1] + '-' + String(m[2] * 3).padStart(2, '0') + 'z' : p; }
function historyFor(section) { return S.history.filter(h => h.section === section).sort((a, b) => periodSort(a.period).localeCompare(periodSort(b.period))); }
function historyForMonth(section, m) { const q = quarterOf(m); const qk = m.slice(0, 4) + '-Q' + q.label[1]; return S.history.filter(h => h.section === section && (h.period === m || (h.period === qk && m === q.end.slice(0, 7)))); }
function historyTableHtml(h) {
  return `<div class="tw"><table><thead><tr><th>Code</th><th>Indicator</th>${h.cols.map(c => `<th class="n">${esc(c)}</th>`).join('')}</tr></thead><tbody>${h.rows.map(r => `<tr><td class="sub">${esc(r[0])}</td><td>${esc(r[1])}</td>${r.slice(2).map(v => `<td class="n">${v == null ? '' : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function historyMatrix(section) {
  const recs = historyFor(section); if (!recs.length) return null;
  const labels = []; for (const h of recs) for (const r of h.rows) if (!labels.includes(r[1])) labels.push(r[1]);
  const cell = (h, lab) => { const r = h.rows.find(x => x[1] === lab); if (!r) return null; const v = r.slice(2); return { main: v[v.length - 1], all: h.cols.map((c, i) => c + ': ' + (v[i] == null ? '-' : v[i])).join(', ') }; };
  return { recs, labels, cell };
}

/* ---------- reports ---------- */
function sexCols(list) { const F = list.filter(c => c.sex === 'F').length; return [F, list.length - F, list.length]; }
function resCols(list) { const R = list.filter(c => c.residence === 'Resident').length, T = list.filter(c => c.residence === 'In transit').length; return [R, T, list.length - R - T, list.length]; }
function distinctChildren(ids) { return uniq(uniq(ids.map(String)).map(child).filter(Boolean)); }
function monthCtx(m) { const [x, y] = String(m).split('~'); return { a: monthStart(x), b: monthEnd(y || x) }; }
function movesIn(type, a, b, filter) { return S.moves.filter(x => x.type === type && inRange(x.date, a, b) && (!filter || filter(x))); }
function eventsIn(type, a, b) { return S.events.filter(e => e.type === type && inRange(e.date, a, b)); }

function sectionRows(sec, m, colsFn) {
  const { a, b } = monthCtx(m);
  const dayBefore = addDays(a, -1);
  const kids = S.children.filter(c => c.section === sec);
  const ids = new Set(kids.map(c => String(c.id)));
  const pick = arr => distinctChildren(arr.filter(x => ids.has(String(x))));
  const bf = kids.filter(c => inCareOn(c, dayBefore) && (!c.entryDate || c.entryDate < a));
  const nw = kids.filter(c => inRange(c.entryDate, a, b));
  const re = pick(movesIn('reopened', a, b).map(x => x.childId));
  const evt = t => pick(eventsIn(t, a, b).map(e => e.childId));
  const traced = pick(S.visits.filter(v => v.purpose === 'Family tracing' && v.successful !== 'No' && inRange(v.date, a, b)).map(v => v.childId));
  const reint = pick(movesIn('reintegrated', a, b).map(x => x.childId));
  const closedBy = r => pick(movesIn('closed', a, b, x => x.reason === r).map(x => x.childId));
  const atEnd = kids.filter(c => inCareOn(c, b));
  const school = t => atEnd.filter(c => (c.schoolType === 'Minsundu school' ? 'Literacy class (Minsundu)' : c.schoolType) === t);
  const rows = [
    ['', 'Brought forward from last month', bf],
    ['', 'New admissions', nw],
    ['', 'Re-admissions', re],
    ['', 'Sneaked out', evt('Sneaked out')],
  ];
  if (sec === 'UCC') rows.push(['', 'Transferred to the youth section', pick(movesIn('section', a, b, x => x.from === 'UCC' && x.to === 'Youth').map(x => x.childId))]);
  rows.push(
    ['', 'Visited their families', evt('Visited family')],
    ['', 'Families traced', traced],
    ['', 'Sick and receiving medical attention', evt('Sick, medical attention')],
    ['', 'Reintegrated', reint],
    ['', 'Attending Nkwazi community school', school('Nkwazi community school')],
    ['', 'Attending GRZ school', atEnd.filter(c => c.schoolType === 'GRZ primary' || c.schoolType === 'GRZ secondary')],
    ['', 'Attending the literacy class', school('Literacy class (Minsundu)')],
    ['', 'Bonding with their families', evt('Bonding with family')],
    ['', 'Returned to Social Welfare or discharged', closedBy('Returned to Social Welfare')],
    ['', 'Transferred to other partners', closedBy('Transferred to another partner')],
    ['', 'Total worked with', uniq(bf.concat(nw, re))],
    ['', 'Present at the end of the month', atEnd]
  );
  return rows.map(r => [r[0], r[1], colsFn(r[2]), r[2]]);
}

const REPORTS = {
  Luigi: {
    label: 'Luigi Drop-in', cols: ['Boys', 'Girls', 'Total'], by: 'Luigi',
    rows(m) {
      const { a, b } = monthCtx(m);
      const sess = S.outreach.filter(s => inRange(s.date, a, b));
      const ofType = t => distinctChildren([].concat(...sess.filter(s => s.type === t).map(s => s.children || [])));
      const all = distinctChildren([].concat(...sess.map(s => s.children || [])));
      const firstSeen = {};
      for (const s of S.outreach.slice().sort((x, y) => x.date.localeCompare(y.date))) for (const id of (s.children || [])) if (!firstSeen[id]) firstSeen[id] = s.imported ? 'imported' : s.date;
      const nw = all.filter(c => inRange(firstSeen[c.id], a, b));
      const ref = to => distinctChildren(movesIn('section', a, b, x => x.from === 'Luigi' && x.to === to).map(x => x.childId));
      const bg = l => { const g = l.filter(c => c.sex === 'F').length; return [l.length - g, g, l.length]; };
      return [
        ['', 'Day street outreach', ofType('Day outreach')], ['', 'Drop-in centre', ofType('Drop-in')], ['', 'Night street outreach', ofType('Night outreach')], ['', 'On the imported monthly name list (activity not known)', ofType('Monthly list')],
        ['', 'New children', nw], ['', 'Brought to Minsundu', ref('UCC').concat(ref('Youth'))], ['', 'Brought to Nkwazi', ref('Nkwazi')],
        ['', 'Total children worked with', all]
      ].map(r => [r[0], r[1], bg(r[2]), r[2]]);
    },
    note: 'A child met in more than one activity counts in each row, once in the total.'
  },
  Nkwazi: {
    label: 'Nkwazi Centre', cols: ['Female', 'Male', 'Total'], by: 'Nkwazi',
    rows(m) {
      const { a, b } = monthCtx(m), qa = quarterOf(a.slice(0, 7)).start, F = flowData('Nkwazi', a, b), FQ = flowData('Nkwazi', qa, b);
      const kids = rs => uniq(rs.map(r => r.c));
      const bf = kids(F.rows.filter(r => !r.startIn)), atEnd = kids(F.rows.filter(r => !r.endIn));
      const inQ = FQ.rows.filter(r => r.startIn), inM = F.rows.filter(r => r.startIn), outM = F.rows.filter(r => r.endIn);
      const present = new Set(); for (const d of Object.keys(S.attendance)) if (inRange(d, a, b)) for (const [id, v] of Object.entries(S.attendance[d] || {})) if (v === 'P') present.add(String(id));
      const took = atEnd.concat(kids(outM)).filter(c => present.has(String(c.id)));
      return [
        ['NKZ 1', 'Children worked with from last month', bf],
        ['NKZ 2', 'Children admitted from Luigi this quarter', kids(inQ.filter(r => /Luigi/.test(r.srcLab)))],
        ['NKZ 3', 'Children admitted from the community and other stakeholders this quarter', kids(inQ.filter(r => !/Luigi|Readmission|Back after/.test(r.srcLab)))],
        ['NKZ 4', 'Children who are in community school', atEnd.filter(c => c.schoolType === 'Nkwazi community school')],
        ['NKZ 5', 'Girls and boys who took part in activities this month (present at least one day)', uniq(took)],
        ['NKZ 6', 'Children readmitted this month', kids(inM.filter(r => /Readmission|Back after/.test(r.srcLab)))],
        ['NKZ 7', 'Children in GRZ school this month', atEnd.filter(c => /^GRZ/.test(c.schoolType || ''))],
        ['', 'Children in private school this month', atEnd.filter(c => c.schoolType === 'Private school')],
        ['NKZ 8', 'Children enrolled in community school this month', kids(inM).filter(c => c.schoolType === 'Nkwazi community school')],
        ['NKZ 9', 'Children who received nutritional support this month (ticked in the profile)', atEnd.filter(c => (c.support || []).includes('Nutrition'))],
        ['NKZ 10', 'Children discharged from the programme this month', kids(outM.filter(r => r.s.end !== 'moved'))],
        ['NKZ 11', 'Children transferred to Minsundu', kids(outM.filter(r => r.s.end === 'moved' && /^(UCC|Youth)$/.test(r.s.to || '')))],
        ['NKZ 12', 'Children linked to other stakeholders', kids(outM.filter(r => r.s.reason === 'Transferred to another partner'))],
        ['NKZ 13', 'Total of children worked with at the end of the month', atEnd],
        ['', 'Of whom semi-active', atEnd.filter(c => c.status === 'Semi-active')]
      ].map(r => [r[0], r[1], sexCols(r[2]), r[2]]);
    },
    note: 'Codes NKZ 1 to 13 follow the monthly report of the centre. School and status are the ones written today in each profile.'
  },
  UCC: { label: 'UCC, Minsundu children', short: 'UCC', cols: ['Residents', 'In transit', 'Non-residents', 'Total'], by: 'UCC', rows: m => sectionRows('UCC', m, resCols), note: 'Row order follows the UCC report; codes 1-16 to be aligned with the section template.' },
  Youth: { label: 'Minsundu Youth Centre', short: 'Youth Centre', freq: 'quarterly', cols: ['Residents', 'In transit', 'Non-residents', 'Total'], by: 'Youth', rows: m => sectionRows('Youth', m, resCols), quarterlyNote: true, note: 'The Youth report is quarterly (Yth 1-12). Pick the last month of the quarter, or read three months.' },
  Family: {
    label: 'Family Section', cols: ['Female', 'Male', 'Total'], by: 'Family',
    rows(m) {
      const { a, b } = monthCtx(m);
      const vsRec = S.visits.filter(v => inRange(v.date, a, b) && visitTeam(v) === 'Family'), vs = vsRec.filter(visitCounts);
      const kids = distinctChildren(vs.map(v => v.childId));
      const withP = p => kids.filter(c => (c.programmes || []).includes(p));
      const reint = distinctChildren(movesIn('reintegrated', a, b).map(x => x.childId));
      const traced = distinctChildren(vs.filter(v => v.purpose === 'Family tracing' || v.purpose === 'Assessment').map(v => v.childId));
      const rows = [
        ['FML 1', 'Children worked with this month', kids], ['FML 2', 'Children visited under ABA', withP('ABA')], ['FML 3', 'Children under the ZAS project', withP('ZAS')],
        ['FML 4', 'Children visited under Nkwazi', kids.filter(c => c.section === 'Nkwazi')], ['FML 5', 'Children under Minsundu', kids.filter(c => c.section === 'UCC' || c.section === 'Youth')],
        ['FML 6', 'Children reintegrated', reint], ['FML 7', 'Non-resident children visited', kids.filter(c => !sleepsHere(c) && c.section !== 'Nkwazi')], ['FML 8', 'Children traced and assessed', traced]
      ].map(r => [r[0], r[1], sexCols(r[2]), r[2]]);
      const target = Number((S.settings.targets[m] || {}).homeVisits) || 0;
      const ok = vs.filter(v => v.successful !== 'No').length;
      rows.push(['', 'Visits made (target ' + (target || 'not set') + ')', [null, null, vs.length], null]);
      if (vsRec.length !== vs.length) rows.push(['', 'Visits recorded, not validated yet', [null, null, vsRec.length - vs.length], null]);
      rows.push(['', 'Successful / unsuccessful visits', [null, null, ok + ' / ' + (vs.length - ok)], null]);
      rows.push(['', 'Home follow-ups', [null, null, vs.filter(v => v.purpose === 'Follow-up').length], null]);
      rows.push(['', 'Emergencies', [null, null, vs.filter(v => v.purpose === 'Emergency').length], null]);
      const lf = lf1(b);
      rows.push(['LF 1', 'Reintegrated in the last 24 months, still at home at the last follow-up visit (logframe SO1.1)', [null, null, lf.n + ' of ' + lf.d], null]);
      return rows;
    }
  },
  School: {
    label: 'School Section', cols: ['Female', 'Male', 'N/A', 'Total'], by: 'School',
    rows(m) {
      const { a, b } = monthCtx(m);
      const act = S.children.filter(c => inCareOn(c, b) && c.status !== 'Closed' && dayType(c) && dayType(c) !== 'Not in school');
      const sx = l => { const F = l.filter(c => c.sex === 'F').length, M = l.filter(c => c.sex === 'M').length; return [F, M, l.length - F - M, l.length]; };
      const nk = c => c.section === 'Nkwazi', mi = c => c.section === 'UCC' || c.section === 'Youth', grz = c => dayType(c) === 'GRZ primary' || dayType(c) === 'GRZ secondary', semi = c => c.status === 'Semi-active';
      const comN = c => dayType(c) === 'Nkwazi community school', comM = c => dayType(c) === LITERACY;
      const svRec = S.visits.filter(v => v.purpose === 'School visit' && inRange(v.date, a, b)), sv = svRec.filter(visitCounts);
      const seen = distinctChildren(sv.map(v => v.childId));
      const t = S.settings.targets[m] || {}, priv = act.filter(c => dayType(c) === 'Private school');
      const rows = [
        ['SCH 1', 'Total number of children worked with this month', seen],
        ['SCH 2', 'Number of children in community school under Nkwazi', act.filter(comN)],
        ['SCH 3', 'Number of children in community school under Minsundu', act.filter(comM)],
        ['SCH 4', 'Number of children in GRZ Primary School', act.filter(c => dayType(c) === 'GRZ primary')],
        ['SCH 5', 'Number of children in GRZ secondary school', act.filter(c => dayType(c) === 'GRZ secondary')],
        ['SCH 6', 'Number of children who are in colleges', act.filter(c => dayType(c) === 'College / skills training')],
        ['SCH 7', 'Number of children who are in exam classes', act.filter(c => inExamClass(c, String(b).slice(0, 4)))],
        ['SCH 8', 'Number of children under GRZ for Nkwazi', act.filter(c => grz(c) && nk(c))],
        ['SCH 9', 'Number of children under GRZ for Minsundu', act.filter(c => grz(c) && mi(c))],
        ['SCH 10', 'Number of children visited in GRZ school under Nkwazi', seen.filter(c => grz(c) && nk(c))],
        ['SCH 11', 'Number of children visited in GRZ school under Minsundu', seen.filter(c => grz(c) && mi(c))],
        ['SCH 12', 'Number of children in GRZ school who are semi active', act.filter(c => grz(c) && semi(c))],
        ['SCH 13', 'Number of children in community school under Minsundu who are semi active', act.filter(c => comM(c) && semi(c))],
        ['SCH 14', 'Number of children in community school under Nkwazi who are semi active', act.filter(c => comN(c) && semi(c))]
      ];
      if (priv.length) rows.push(['', 'In private school (not in the section template)', priv]);
      rows.push(['', 'Under ABA (distance adoption)', act.filter(isAba)], ['', 'Under ABA, visited at school this month', seen.filter(isAba)]);
      const out = rows.map(r => [r[0], r[1], sx(r[2]), r[2]]);
      out.push(['', 'School Monitoring Forms filled (target ' + (Number(t.schoolVisits) || 'not set') + ')', [null, null, null, sv.length], null]);
      out.push(['', 'School visits (a school on a day)', [null, null, null, uniq(sv.map(v => v.date + '|' + visitSchool(v).toLowerCase())).length], null]);
      if (svRec.length !== sv.length) out.push(['', 'Forms recorded, not validated yet', [null, null, null, svRec.length - sv.length], null]);
      out.push(['', 'Schools visited', [null, null, null, uniq(sv.map(v => visitSchool(v).toLowerCase()).filter(Boolean)).length], null]);
      return out;
    },
    note: 'Codes SCH 1-14 and columns as in the monthly report of the School Section (October 2026). SCH 1 counts the children visited at school in the month. SCH 3 is the literacy class of Minsundu.'
  },
  Counseling: {
    label: 'Counselling', freq: 'quarterly', cols: ['Minsundu', 'Luigi', 'Nkwazi', 'Total'], by: 'Counseling',
    rows(m) {
      const { a, b } = monthCtx(m);
      const ss = S.sessions.filter(s => inRange(s.date, a, b));
      const per = f => { const v = CENTRES.map(ce => f(ss.filter(s => s.centre === ce))); v.push(v.reduce((x, y) => x + y, 0)); return v; };
      const kidsOf = l => uniq([].concat(...l.map(s => s.children || []))).length + l.filter(s => s.type === 'Group').reduce((x, s) => x + (Number(s.others) || 0), 0);
      return [
        ['', 'Children worked with', per(kidsOf), null],
        ['', 'Individual sessions', per(l => l.filter(s => s.type === 'Individual').length), null],
        ['', 'Group sessions', per(l => l.filter(s => s.type === 'Group').length), null],
        ['', 'Family sessions', per(l => l.filter(s => s.type === 'Family').length), null]
      ];
    },
    note: 'Children worked with = named children plus unnamed group participants.'
  },
  Table6: {
    label: 'Minsundu for Social Welfare (Table 6.0)', short: 'Table 6.0', freq: 'quarterly', quarterly: true, cols: null, by: 'UCC',
    rows: null
  }
};
const REPORT_KEYS = ['Luigi', 'Nkwazi', 'UCC', 'Youth', 'Family', 'School', 'Counseling', 'Table6'];
const HISTORY_TAB = 'History';
function lf1(end) {
  const start = addDays(end, -730);
  const re = S.moves.filter(x => x.type === 'reintegrated' && inRange(x.date, start, end));
  let n = 0, d = 0;
  for (const id of uniq(re.map(x => String(x.childId)))) {
    const fu = visitsOf(id).filter(v => v.purpose === 'Follow-up' && v.stillHome && v.date <= end).sort((p, q) => q.date.localeCompare(p.date))[0];
    if (!fu) continue; d++; if (fu.stillHome === 'Yes') n++;
  }
  return { n, d };
}
function table6(m) {
  const q = quarterOf(m);
  const kids = S.children.filter(c => (c.section === 'UCC' || c.section === 'Youth') && c.residence === 'Resident');
  const grp = c => { const a = curAge(c); if (a === '') return '9 to 18 years'; return a < 9 ? 'Under 9 years' : a <= 18 ? '9 to 18 years' : 'Over 18 years'; };
  const groups = ['Under 9 years', '9 to 18 years', 'Over 18 years'];
  const before = addDays(q.start, -1);
  const cell = (l, sex) => l.filter(c => (c.sex || 'M') === sex).length;
  const rows = groups.map(g => {
    const k = kids.filter(c => grp(c) === g);
    const bf = k.filter(c => inCareOn(c, before) && (!c.entryDate || c.entryDate < q.start));
    const nw = k.filter(c => inRange(c.entryDate, q.start, q.end));
    const ids = new Set(k.map(c => String(c.id)));
    const rel = distinctChildren(movesIn('reintegrated', q.start, q.end).map(x => x.childId).filter(id => ids.has(String(id))));
    const oth = distinctChildren(movesIn('closed', q.start, q.end).map(x => x.childId).filter(id => ids.has(String(id))));
    const handled = uniq(bf.concat(nw));
    const remain = k.filter(c => inCareOn(c, q.end));
    return [g].concat([bf, nw, handled, rel, oth, remain].flatMap(l => [cell(l, 'M'), cell(l, 'F')]));
  });
  const tot = ['Total']; for (let i = 1; i < 13; i++) tot.push(rows.reduce((s, r) => s + r[i], 0));
  rows.push(tot);
  return { q, rows };
}

/* ---------- router ---------- */
function route() {
  let h = (location.hash || '#/home').slice(1); if (h.startsWith('c=')) h = '/home'; /* the address still holds the staff link: it is the Home page */
  const [p, qs] = h.split('?');
  const parts = p.split('/').filter(Boolean);
  return { path: parts[0] || 'home', id: parts[1], sub: parts[2], q: new URLSearchParams(qs || '') };
}
function go(h) { location.hash = h; }
function setQuery(changes) {
  const r = route(); for (const [k, v] of Object.entries(changes)) { if (v === '' || v == null) r.q.delete(k); else r.q.set(k, v); }
  const base = '#/' + [r.path, r.id, r.sub].filter(Boolean).join('/'); const s = r.q.toString();
  history.replaceState(null, '', base + (s ? '?' + s : '')); render();
}

/* ---------- layout ---------- */
const NAV = [['home', 'Home'], ['pending', 'To do'], ['tasks', 'Tasks'], ['children', 'Children'], ['attendance', 'Attendance'], ['visits', 'Monitoring'], ['counseling', 'Counselling'], ['reports', 'Reports'], ['activities', 'Activities'], ['logframe', 'Logframe', true], ['staff', 'Admin', true]];
function shell(active, body) {
  const pc = todoCount();
  const sup = seesOverview();
  const nav = NAV.filter(n => (!n[2] && (n[0] !== 'pending' || sup) && (n[0] !== 'activities' || sup || (USER && staffAreas(USER).includes('Sports')))) || (n[2] && (n[0] === 'staff' ? canAdminPage() : sup))).map(([k, l]) => `<a href="#/${k}" class="${active === k ? 'on' : ''}">${l}${k === (sup ? 'pending' : 'home') && pc ? ` <span class="chip c-red">${pc}</span>` : ''}</a>`).join('');
  return `${IS_DEMO ? demoBar() : ''}${GUEST ? guestBar() : ''}<header class="hd">
    <a class="brand" href="#/home" aria-label="CYP EDU, home"><img src="${LOGO}" alt="">${logoSvg(26)}<span class="bsub">Cicetekelo Youth Project · Education Department records · Association Pope John XXIII</span></a><span class="cyp-appbar__where">${esc((NAV.find(n => n[0] === active) || [0, active === 'more' ? 'More' : ''])[1])}</span>
    <div class="who">
      ${syncChip()}${syncDot()}
      <span class="chip c-orange hidem">${VERSION}</span>
      <a href="#/more" class="av" title="${esc(USER.name)}" style="text-decoration:none">${esc(initials(USER.name))}</a><span class="nm">${esc(USER.name)}</span>
      <button class="btn sm hidem" data-act="logout">Switch user</button>
    </div>
  </header>
  <nav class="nav" aria-label="Main">${nav}</nav>
  <main class="main">${body}</main>
  ${mobileNav(active, pc)}
  <div class="foot">CYP EDU ${VERSION}. ${typeof syncOn === 'function' && syncOn() ? 'Shared database: what you record is sent by itself.' : 'The records are only on this ' + (isPhone() ? 'phone' : 'computer') + '.'} <a href="#/help">How it works</a></div>`;
}
function demoBar() { return `<div class="demobar"><button class="btn sm pri" data-tour="start" style="margin-right:10px"><span class="dlong">Start the guided tour</span><span class="dshort">Guided tour</span></button><b>Demo version.</b> <span class="dshort">Invented children.</span><span class="dlong">All children, visits and attendance are invented. The 2026 report figures are the real ones from the section reports. Try everything: nothing here is real and nothing leaves this computer. <a href="#/help">What we want to know from you</a> · <button class="btn link" data-act="resetdemo">Start the demo again</button></span></div>`; }
function chip(status) { return `<span class="chip ${STATUS_CHIP[status] || ''}">${esc(STATUS_LABEL[status] || status)}</span>`; }
function secChip(s) { const d = SECTIONS[s]; return d ? `<span class="chip placechip">${keyMark(s)}${esc(d.label)}</span>` : ''; }
function childLink(c) { return `<a href="#/child/${esc(c.id)}">${esc(fullName(c))}</a>${c.nickname ? ` <span class="sub">"${esc(c.nickname)}"</span>` : ''}`; }
/* the month of a plan: the Pager of the system. A month to come can be planned, so After stays open */
function monthBar(m, key) {
  const k = key || 'm';
  return `<div class="cyp-pager" role="group" aria-label="Month of the plan"><a class="cyp-btn" href="#" data-q="${k}=${addMonths(m, -1)}">${dsIcon('left')}Before</a><span class="cyp-pager__now">${esc(fmtMonth(m))}</span><a class="cyp-btn" href="#" data-q="${k}=${addMonths(m, 1)}">After${dsIcon('right')}</a></div>`;
}
function monthPicker(m, key) {
  const k = key || 'm', last = m >= thisMonth();
  return `<div class="cyp-pager" role="group" aria-label="Month"><a class="cyp-btn" href="#" data-q="${k}=${addMonths(m, -1)}">${dsIcon('left')}Before</a><span class="cyp-pager__now">${esc(fmtMonth(m))}</span>${last ? `<button class="cyp-btn" disabled>After${dsIcon('right')}</button>` : `<a class="cyp-btn" href="#" data-q="${k}=${addMonths(m, 1)}">After${dsIcon('right')}</a>`}</div>`;
}

/* ---------- views ---------- */
function vLogin() {
  if (IS_WEB && !IS_DEMO && !S.children.length && !activeStaff().length) return vConnect();
  if (UI.pinFor && S.staff.find(x => x.id === UI.pinFor)) return vPin();
  const st = activeStaff();
  return `<div class="login">
    ${brandMark()}
    ${IS_DEMO ? '<div class="demobar" style="border-radius:8px">Demo version with invented children. Choose any name to try it, then tap "Start the guided tour" at the top of the page.</div>' : ''}
    <div><h1>Who is using this ${isPhone() ? 'phone' : 'computer'}?</h1><p class="lead">CYP EDU ${VERSION} · Cicetekelo Youth Project, Education Department. Tap your name.</p></div>
    <div style="width:100%"><button class="stile gtile" data-act="guest"><span class="av">G</span>Guest<small>For visitors. Names, photos and personal details of the children are hidden. View only.</small></button>${loginTiles()}</div>
    <p class="sub" style="max-width:560px"></p>
  </div>`;
}

function sexSplit(list) { const m = list.filter(c => c.sex === 'M').length, f = list.filter(c => c.sex === 'F').length, u = list.length - m - f; return { m, f, u }; }
function sexText(list) { const x = sexSplit(list); return 'M ' + x.m + ' · F ' + x.f + (x.u ? ' · ? ' + x.u : ''); }
function childrenLead(list) { return list.length + ' of ' + S.children.length + ' records shown: ' + sexText(list) + '.'; }
function vHome(r) {
  if (seesOverview() && S.children.length && r.q.get('v') !== 'centres') return vOffice(r);
  const m = r.q.get('m') || thisMonth();
  const filt = r.q.get('f') || 'all';
  const { a, b } = monthCtx(m);
  if (!S.children.length) {
    return `<div class="top"><div><h1>Welcome</h1><p class="lead">There are no children in the records yet.</p></div></div>
    <div class="card"><h2>Start</h2><p>Load the starter pack: one file with the children of the Minsundu tool (same ID numbers), the Luigi name list and the figures of the 2026 section reports. Or add children one by one.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${isSite() ? `<a class="btn pri" href="#/staff/data">Load the starter pack</a>` : `<span class="note">Ask a site admin to import the data.</span>`}<a class="btn" href="#/child/new">Add a child</a></div></div>`;
  }
  const f = c => filt === 'all' ? true : filt === 'res' ? c.residence === 'Resident' : filt === 'tra' ? c.residence === 'In transit' : filt === 'non' ? !sleepsHere(c) : true;
  const cur = S.children.filter(c => isCurrent(c) && f(c));
  const since = addDays(today(), -90);
  const metRecently = new Set([].concat(...S.outreach.filter(s => s.date >= since).map(s => (s.children || []).map(String))));
  const perList = SECTION_KEYS.map(k => k === 'Luigi' ? cur.filter(c => c.section === 'Luigi' && metRecently.has(String(c.id))) : cur.filter(c => c.section === k));
  const per = perList.map(l => l.length);
  const tot = per.reduce((x, y) => x + y, 0);
  const followList = S.children.filter(c => c.status === 'Follow-up' && f(c));
  const follow = followList.length;
  const closed = movesIn('closed', a, b).length;
  const vs = S.visits.filter(v => inRange(v.date, a, b) && visitTeam(v) === 'Family' && visitCounts(v));
  const lvs = S.visits.filter(v => inRange(v.date, a, b) && visitTeam(v) === 'Luigi' && visitCounts(v));
  const sv = S.visits.filter(v => inRange(v.date, a, b) && v.purpose === 'School visit' && visitCounts(v));
  const t = S.settings.targets[m] || {};
  const tv = Number(t.homeVisits) || 0, ts = Number(t.schoolVisits) || 0;
  const done = vs.length;
  const ofp = p => vs.filter(v => v.purpose === p).length;
  const inSchool = S.children.filter(c => isCurrent(c) && c.schoolType && c.schoolType !== 'Not in school').length;
  const seen = uniq(sv.map(v => String(v.childId))).length;
  const sess = S.outreach.filter(s => inRange(s.date, a, b));
  const luigiKids = distinctChildren([].concat(...sess.map(s => s.children || [])));
  const lb = luigiKids.filter(c => c.sex !== 'F').length;
  const firstSeen = {}; for (const s of S.outreach.slice().sort((x, y) => x.date.localeCompare(y.date))) for (const id of (s.children || [])) if (!firstSeen[id]) firstSeen[id] = s.imported ? 'imported' : s.date;
  const lnew = luigiKids.filter(c => inRange(firstSeen[c.id], a, b)).length;
  const toMins = movesIn('section', a, b, x => x.from === 'Luigi' && (x.to === 'UCC' || x.to === 'Youth')).length;
  const bar = (n, d, col) => `<div class="bar" style="margin:10px 0 4px"><div style="width:${d ? Math.min(100, pct(n, d)) : 0}%;background:${col}"></div></div>`;
  /* the numbers of the programme, with their month and their filter: open for the Education admins on a computer, a closed box for everyone else and on phones */
  const numOpen = (seesOverview() && !isPhone()) || r.q.has('f') || r.q.has('m');
  const numCtl = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px"><div class="seg" role="group" aria-label="Children shown">${[['all', 'All'], ['res', 'Residents'], ['tra', 'In transit'], ['non', 'Non-residents']].map(([k, l]) => `<a href="#" data-q="f=${k}" class="${filt === k ? 'on' : ''}">${l}</a>`).join('')}</div>${monthPicker(m)}</div>`;
  return `<div class="top"><div><h1>Home</h1><p class="lead"></p></div></div>
  ${offlineCard()}
  ${installCard(true)}
  ${typeof homeTiles === 'function' ? homeTiles() : ''}
  ${taskHome(true)}
  ${centreGuide()}
  ${taskHome(false)}
  ${homeBirthdays()}
  ${homeTodo()}
  ${syncReminder()}
  ${(() => { if (typeof syncOn === 'function' && syncOn()) return ''; const dev = isPhone() ? 'phone' : 'computer', d = S.meta.lastBackup ? daysBetween(S.meta.lastBackup, today()) : null; return (d == null || d > 7) ? `<div class="warn" style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span>${d == null ? 'No copy of the records has been saved from this ' + dev + ' yet.' : 'The last copy of the records is ' + d + ' days old.'} If this ${dev} breaks, what was recorded since is lost.</span>${isSite() ? '<button class="btn" data-act="backup">Save a copy now</button>' : '<span>Ask a site admin to save a copy.</span>'}</div>` : ''; })()}
  <details class="more" id="homenum"${numOpen ? ' open' : ''}><summary>The programme in numbers · ${esc(fmtMonth(m))}</summary><div style="margin-top:12px">${numCtl}
  <section class="card">
    <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:10px"><span class="big">${tot}</span><span style="color:var(--soft)">children and youth active in the programme today</span><span class="chip">${sexText([].concat(...perList))}</span></div>
    <div class="bar" style="height:16px;margin:16px 0 12px">${SECTION_KEYS.map((k, i) => `<div style="width:${pct(per[i], tot)}%;background:${SECTIONS[k].color}" title="${esc(SECTIONS[k].label)}: ${per[i]}"></div>`).join('')}</div>
    <div class="grid g6">
      ${SECTION_KEYS.map((k, i) => `<a class="tile" href="#/children?section=${k}&status=current${filt !== 'all' ? '&res=' + (filt === 'res' ? 'Resident' : filt === 'tra' ? 'In transit' : 'Non-resident') : ''}"><span class="key"><span class="sw" style="background:${SECTIONS[k].color}"></span>${esc(SECTIONS[k].label)}</span><b>${per[i]}</b><span>${sexText(perList[i])}</span>${k === 'Luigi' ? '<span class="sub">met in the last 3 months</span>' : ''}</a>`).join('')}
      <a class="tile" href="#/children?status=Follow-up"><span class="key"><span class="sw" style="background:#D3D1CB"></span>Reintegrated, in 2-year follow-up</span><b>${follow}</b><span>${sexText(followList)}</span></a>
      <a class="tile" href="#/children?status=Closed"><span class="key"><span class="sw" style="background:#E9E9E7"></span>Files closed in ${esc(fmtMonth(m))}</span><b>${closed}</b></a>
    </div>
    <p class="sub" style="margin:10px 0 0"></p>
  </section>
  <section><p class="sec">Plans and progress in ${esc(fmtMonth(m))}</p>
  ${(() => { const rows = [['Family Section', 'Home visits', done, tv], ['School Section', 'School visits', sv.length, ts]], pc = x => x[3] ? Math.round(100 * x[2] / x[3]) : 0, note = USER.admin ? '<p class="sub" style="margin:8px 0 0">Targets are set in Admin, "Targets of the month".</p>' : '';
    return `<div class="cyp-progress cyp-c-blue homeprog ds-pc"><div class="cyp-progress__row cyp-progress__row--head"><span>Section</span><span></span><span>%</span><span>Done</span><span>Target</span></div>
    ${rows.map(x => `<div class="cyp-progress__row cyp-c-blue"><span class="cyp-progress__label">${secDisc(x[0])}<span><b>${x[0]}</b><small>${x[1]}</small></span></span>${x[3] ? `<span class="cyp-bar"><i style="width:${Math.min(100, pc(x))}%"></i></span>` : '<span></span>'}<span>${x[3] ? pc(x) + '%' : ''}</span><span>${x[2]}</span><span>${x[3] || 'Not set'}</span></div>`).join('')}${note}</div>
    <div class="cyp-card ds-ph">${rows.map(x => rows.every(y => y[3]) ? `<div class="cyp-prow cyp-c-blue"><div class="cyp-prow__head">${secDisc(x[0])}<span class="cyp-prow__name">${x[0]}</span><span class="cyp-prow__pct">${pc(x)}%</span></div><span class="cyp-bar"><i style="width:${Math.min(100, pc(x))}%"></i></span><div class="cyp-prow__figs"><span>${x[2]} ${x[1].toLowerCase()}</span><span>of ${x[3]}</span></div></div>` : `<div class="cyp-prow cyp-prow--count cyp-c-blue"><div class="cyp-prow__head">${secDisc(x[0])}<span class="cyp-prow__name">${x[0]}</span><span class="cyp-prow__pct">${x[2]}</span></div><div class="cyp-prow__figs"><span>${x[1].toLowerCase()}, no target set</span></div></div>`).join('')}${note}</div>`; })()}
  <div class="grid g3">
    <div class="card"><h3>Family Section</h3><p class="sub" style="margin:2px 0 12px">Home visits against the month's target</p>
      <div style="display:flex;align-items:baseline;gap:8px"><span class="big">${done}</span><span style="color:var(--soft)">of ${tv || '?'} planned</span></div>${bar(done, tv, 'var(--blue)')}
      <div class="row"><span>In this month's plan: done / planned</span><b>${planFor(m, 'Family').filter(p => planStatus(p).k === 'done').length} / ${planFor(m, 'Family').length}</b></div>
      <div class="row"><span>Family tracing / assessment</span><b>${ofp('Family tracing')} / ${ofp('Assessment')}</b></div>
      <div class="row"><span>Follow-up visits</span><b>${ofp('Follow-up')}</b></div>
      <div class="row"><span>Unsuccessful (nobody found)</span><b>${vs.filter(v => v.successful === 'No').length}</b></div>
    </div>
    <div class="card"><h3>School Section</h3><p class="sub" style="margin:2px 0 12px">School visits against the month's target</p>
      <div style="display:flex;align-items:baseline;gap:8px"><span class="big">${sv.length}</span><span style="color:var(--soft)">of ${ts || '?'} planned</span></div>${bar(sv.length, ts, 'var(--blue)')}
      <div class="row"><span>Children seen at school</span><b>${seen} of ${inSchool}</b></div>
      <div class="row"><span>Children in examination classes</span><b>${S.children.filter(c => isCurrent(c) && inExamClass(c)).length}</b></div>
    </div>
    <div class="card"><h3>Luigi Drop-in</h3><p class="sub" style="margin:2px 0 12px">Children in contact this month</p>
      <div style="display:flex;align-items:baseline;gap:8px"><span class="big">${luigiKids.length}</span><span style="color:var(--soft)">${lb} boys · ${luigiKids.length - lb} girls</span></div>${bar(lb, luigiKids.length, 'var(--place-luigi)')}
      <div class="row"><span>New children</span><b>${lnew}</b></div>
      <div class="row"><span>Brought to Minsundu</span><b>${toMins}</b></div>
      <div class="row"><span>Outreach and drop-in sessions</span><b>${sess.length}</b></div>
      <div class="row"><span>Home visits by Luigi: done / in the plan</span><b>${lvs.length} / ${planFor(m, 'Luigi').length}</b></div>
    </div>
  </div></section></div></details>`;
}

function filteredChildren(q) {
  const sec = q.get('section'), st = q.get('status') || 'open', res = q.get('res'), sx = q.get('sex'), issue = q.get('issue'), who = q.get('who'), grp = q.get('grp'), ageB = AGE_BANDS.find(x => x[0] === q.get('age')), edu = q.get('edu'), hv = q.get('hv'), cs = q.get('cs') || 'name', m3 = addDays(today(), -92);
  const term = (UI.q || '').trim().toLowerCase();
  return S.children.filter(c => {
    if (sec && !secList(sec).includes(c.section)) return false;
    if (st === 'open' && c.status === 'Closed') return false;
    if (st === 'current' && !isCurrent(c)) return false;
    if (STATUSES.includes(st) && c.status !== st) return false;
    if (res && c.residence !== res) return false;
    if (sx && c.sex !== sx) return false;
    if (who && c.responsible !== who) return false;
    if (issue && !(issue === 'dob' ? !c.dob : issuesOf(c).includes(issue))) return false;
    if (grp && !inGroup(c, grp)) return false;
    if (ageB) { const a = curAge(c); if (ageB[0] === 'none' ? a !== '' : a === '' || a < ageB[2] || a > ageB[3]) return false; }
    if (edu && (edu === 'none' ? dayType(c) : dayType(c) !== edu)) return false;
    if (hv) { const l = visitInfo(c).last || ''; if (hv === 'none' ? l : hv === 'new' ? l < m3 : !l || l >= m3) return false; }
    if (term) { const hay = [c.id, c.name, c.surname, c.nickname, c.compound].join(' ').toLowerCase(); if (!hay.includes(term)) return false; }
    return true;
  }).sort(childSorter(cs));
}
/* Children list: the columns sort and filter like a sheet */
const AGE_BANDS = [['u10', 'Under 10', 0, 9], ['10', '10 to 13', 10, 13], ['14', '14 to 17', 14, 17], ['18', '18 and over', 18, 200], ['none', 'Age not written']];
const CHILD_SORTS = [['name', 'Name, A to Z'], ['name-desc', 'Name, Z to A'], ['age', 'Age, youngest first'], ['age-desc', 'Age, oldest first'], ['hv', 'Home visit, longest ago first'], ['hv-desc', 'Home visit, most recent first'], ['centre', 'Centre'], ['status', 'Status'], ['edu', 'Education'], ['id', 'ID']];
function childFiltersOn(q) { return ['age', 'edu', 'hv', 'sex', 'res', 'section'].some(k => q.get(k)) || (q.get('cs') || 'name') !== 'name' || (q.get('status') || 'open') !== 'open'; }
function childSorter(cs) {
  const desc = /-desc$/.test(cs), k = cs.replace(/-desc$/, ''), nm = (a, b) => fullName(a).localeCompare(fullName(b));
  const val = { id: c => String(c.id), sex: c => c.sex || '', age: c => curAge(c), edu: c => dayLabel(dayType(c)) || '', centre: c => SECTIONS[c.section] ? SECTIONS[c.section].label : '', res: c => c.residence || '', status: c => c.status || '', hv: c => visitInfo(c).last || '' }[k];
  if (!val) return desc ? (a, b) => nm(b, a) : nm;
  return (a, b) => { const x = val(a), y = val(b); if (x === '' && y !== '') return k === 'hv' && !desc ? -1 : 1; if (y === '' && x !== '') return k === 'hv' && !desc ? 1 : -1; const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true }); return (desc ? -d : d) || nm(a, b); };
}
function childRows(list) {
  const q = route().q, cs = q.get('cs') || 'name', th = (k, l, cls) => `<th class="${cls || ''}"${cs.replace(/-desc$/, '') === k ? ` aria-sort="${/-desc$/.test(cs) ? 'descending' : 'ascending'}"` : ''}><a href="#" class="sortth" data-q="cs=${cs === k ? k + '-desc' : k}" title="Sort by this column">${l}<span class="sarr">${cs === k ? ' ▲' : cs === k + '-desc' ? ' ▼' : ' ↕'}</span></a></th>`;
  const fs = (name, options, label) => `<select class="in fsel" data-filter="${name}" aria-label="Filter: ${label}">${options}</select>`, secs = secList(q.get('section'));
  const frow = `<tr class="frow"><td class="mh"></td><td class="ph"></td><td></td><td class="mh">${fs('sex', opt([{ v: 'M', l: 'M' }, { v: 'F', l: 'F' }], q.get('sex'), 'All'), 'sex')}</td><td class="mh">${fs('age', opt(AGE_BANDS.map(x => ({ v: x[0], l: x[1] })), q.get('age'), 'All'), 'age')}</td><td class="mh">${fs('edu', opt(uniq(S.children.map(c => dayType(c)).filter(Boolean)).sort((x, y) => dayLabel(x).localeCompare(dayLabel(y))).map(x => ({ v: x, l: dayLabel(x) })).concat([{ v: 'none', l: 'Not written' }]), q.get('edu'), 'All'), 'education')}</td><td>${fs('section', opt([{ v: 'Luigi', l: 'Luigi' }, { v: 'Minsundu', l: 'Minsundu' }, { v: 'UCC', l: 'Minsundu · UCC' }, { v: 'Youth', l: 'Minsundu · Youth' }, { v: 'Nkwazi', l: 'Nkwazi Centre' }], secs.length === 1 ? secs[0] : secs.join(',') === 'UCC,Youth' ? 'Minsundu' : '', secs.length > 1 && secs.join(',') !== 'UCC,Youth' ? 'Several' : 'All'), 'centre')}</td><td class="mh">${fs('res', opt(RES3, q.get('res'), 'All'), 'resident or not')}</td><td>${fs('status', opt([{ v: 'open', l: 'Open files' }, { v: 'current', l: 'Active and semi-active' }].concat(STATUSES.map(s => ({ v: s, l: STATUS_LABEL[s] }))).concat([{ v: 'all', l: 'All' }]), q.get('status') || 'open'), 'status')}</td><td class="mh">${fs('hv', opt([{ v: 'none', l: 'Never' }, { v: 'old', l: 'More than 3 months ago' }, { v: 'new', l: 'In the last 3 months' }], q.get('hv'), 'All'), 'last home visit')}</td><td class="cyp-table__go"></td></tr>`;
  return `${childFiltersOn(q) ? '<p class="sub chint"><a class="btn sm" href="#" data-q="age=&edu=&hv=&sex=&res=&section=&cs=&status=">Clear filters and order</a></p>' : ''}<div class="tw"><table class="ctable"><thead><tr>${th('id', 'ID', 'mh')}<th class="ph"><span class="vh">Photo</span></th>${th('name', 'Name')}${th('sex', 'Sex', 'mh')}${th('age', 'Age', 'n mh')}${th('edu', 'Education', 'mh')}${th('centre', 'Centre')}${th('res', 'Resident', 'mh')}${th('status', 'Status')}${th('hv', 'Last home visit', 'mh')}<th class="cyp-table__go"><span class="vh">Open</span></th></tr>${frow}</thead><tbody>${list.length ? '' : '<tr><td colspan="11"><p class="empty">No child matches.</p></td></tr>'}
  ${(isPhone() && q.get('call') !== '1' ? list.slice(0, 40) : list).map(c => { const vi = visitInfo(c); return `<tr class="click cyp-tr--link" data-href="#/child/${esc(c.id)}"><td class="mh">${esc(c.id)}</td><td class="ph">${dsAvatar(c)}</td><td><a class="cname" href="#/child/${esc(c.id)}">${esc(fullName(c))}</a>${c.nickname ? ` <span class="sub">"${esc(c.nickname)}"</span>` : ''}<div class="sub mo">ID ${esc(c.id)} · ${esc(c.sex || '')}${curAge(c) !== '' ? ' · ' + esc(curAge(c)) + ' years' : ''}</div></td><td class="mh">${esc(c.sex || '')}</td><td class="n mh">${esc(curAge(c))}</td><td class="mh edu">${eduCell(c)}</td><td>${secChip(c.section)}${c.sectionToCheck ? ' <span class="sub" title="Proposed from age at import">?</span>' : ''}</td><td class="mh">${esc(c.residence || '')}</td><td>${chip(c.status)}</td><td class="mh">${vi.last ? esc(fmtDate(vi.last)) : '<span class="sub">none</span>'}</td><td class="cyp-table__go">${dsIcon('go').replace('cyp-icon', 'cyp-icon cyp-go')}</td></tr>`; }).join('')}
  </tbody></table></div>${isPhone() && q.get('call') !== '1' && list.length > 40 ? `<p style="margin:12px 4px 6px"><a class="btn" href="#" data-q="call=1" style="width:100%">Show all ${list.length} children</a></p><p class="sub" style="margin:0 6px 8px">The first 40 are shown. Type a name above to find a child.</p>` : ''}`;
}
function vChildren(r) {
  const q = r.q; const list = filteredChildren(q);
  const sel = (name, options, val, label, cls) => `<label class="f${cls ? ' ' + cls : ''}">${label}<select class="in" data-filter="${name}">${options}</select></label>`;
  return `<div class="top ctop"><div><h1>Children</h1><p class="lead">${childrenLead(list)}</p></div><div class="ctools" style="display:flex;gap:8px;flex-wrap:wrap">${q.get('grp') === 'ABA' ? `<button class="btn" data-mact="abasheet" data-y="${today().slice(0, 4)}">Export in Excel: scheda ABA ${today().slice(0, 4)} (italiano)</button>` : ''}<a class="btn" href="#/paths${SECTION_KEYS.includes(q.get('section')) ? '?ps=' + esc(q.get('section')) : q.get('section') === 'Minsundu' ? '?ps=UCC' : ''}">Admissions, transfers and discharges</a><button class="btn hidem" data-act="exportlist">Export in Excel</button><a class="btn pri" href="#/child/new">Add a child</a></div></div>
  <div class="card filters fold cfilt${UI.fopen ? ' open' : ''}">
    <label class="f">Search<input class="in" id="search" placeholder="Name, nickname, ID or compound" value="${esc(UI.q)}"></label>${filtBtn()}
    ${secChips(q.get('section'))}
    ${sel('status', opt([{ v: 'open', l: 'Open files' }, { v: 'current', l: 'Active and semi-active' }].concat(STATUSES.map(s => ({ v: s, l: STATUS_LABEL[s] }))).concat([{ v: 'all', l: 'All, including closed' }]), q.get('status') || 'open'), '', 'Status', 'mo')}
    ${sel('res', opt(RES3, q.get('res'), 'All'), '', 'Residence', 'mo')}
    ${sel('sex', opt([{ v: 'M', l: 'Boys' }, { v: 'F', l: 'Girls' }], q.get('sex'), 'All'), '', 'Sex', 'mo')}
    ${sel('who', opt(S.staff.map(s => ({ v: s.id, l: s.name })), q.get('who'), 'Anyone'), '', 'Followed by')}
    ${sel('grp', opt(GROUPS.map(([k, l]) => ({ v: k, l })), q.get('grp'), 'All children'), '', 'Group')}
    ${sel('issue', opt(Object.entries(ISSUES).map(([k, l]) => ({ v: k, l })), q.get('issue'), 'Any'), '', 'Missing information')}
  </div>
  <div class="card csort"><label class="f">Age<select class="in" data-filter="age">${opt(AGE_BANDS.map(x => ({ v: x[0], l: x[1] })), q.get('age'), 'All ages')}</select></label><label class="f">Sort by<select class="in" data-filter="cs">${opt(CHILD_SORTS.map(x => ({ v: x[0], l: x[1] })), /^(sex|res)/.test(q.get('cs') || '') ? '' : q.get('cs') || 'name')}</select></label>${childFiltersOn(q) ? '<a class="btn" href="#" data-q="age=&edu=&hv=&sex=&res=&section=&cs=&status=">Clear filters and order</a>' : ''}</div>
  ${recordsPanel()}
  ${q.get('issue') === 'section' && list.length ? `<div class="note" style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span>At import, children under 18 went to UCC and the others to the Youth Centre. Move the ones that are wrong (open the profile, then "Change status or centre"), then confirm the rest.</span><button class="btn" data-act="confirmall">Confirm UCC or Youth for these ${list.length}</button></div>` : ''}
  <div class="card" style="padding:6px 8px" id="childTable">${childRows(list)}</div>`;
}

function secList(v) { const out = []; for (const k of String(v || '').split(',')) { if (k === 'Minsundu') out.push('UCC', 'Youth'); else if (SECTIONS[k]) out.push(k); } return out; }
function secChips(v) { const on = secList(v); return `<div class="f secf"><span>Centre: tap one or more</span><div class="qchips">${['Luigi', 'UCC', 'Youth', 'Nkwazi'].map(k => { const next = on.includes(k) ? on.filter(x => x !== k) : on.concat([k]); return `<a href="#" data-q="section=${next.join(',')}" class="${on.includes(k) ? 'on' : ''}" aria-pressed="${on.includes(k)}">${esc(SECTIONS[k].label)}</a>`; }).join('')}</div></div>`; }
function field(label, name, val, type, extra) {
  extra = extra || {};
  const req = extra.req ? ' <span class="req">*</span>' : '';
  let input;
  if (type === 'select') input = `<select class="in" name="${name}"${extra.req ? ' required' : ''}>${extra.options}</select>`;
  else if (type === 'textarea') input = `<textarea class="in" name="${name}" rows="${extra.rows || 3}">${esc(val)}</textarea>`;
  else input = `<input class="in" type="${type || 'text'}" name="${name}" value="${esc(val)}"${extra.req ? ' required' : ''}${type === 'date' && name === 'date' && !/max=/.test(extra.attrs || '') ? ' max="' + today() + '"' : ''}${extra.attrs || ''}>`;
  return `<label class="f${extra.wide ? ' wide' : ''}"><span>${esc(label)}${req}</span>${input}${extra.hint ? `<span class="sub" style="font-weight:400">${esc(extra.hint)}</span>` : ''}</label>`;
}
function checks(name, list, vals) { return `<div class="checks">${list.map(o => `<label><input type="checkbox" name="${name}" value="${esc(o)}"${(vals || []).includes(o) ? ' checked' : ''}>${esc(o)}</label>`).join('')}</div>`; }

function vChildForm(c) {
  const isNew = !c;
  c = c || Object.assign({ section: 'UCC', residence: 'Resident', status: 'Active', entryDate: today(), responsible: USER.id, programmes: [], support: [] }, UI.prefill || {});
  UI.prefill = null; UI.photoPending = null;
  return `<div class="top"><div><h1>${isNew ? 'Add a child' : 'Edit ' + esc(fullName(c))}</h1><p class="lead">${isNew ? 'Fields with * are needed. Everything else can be added later.' : 'ID ' + esc(c.id)}</p></div></div>
  <form data-form="child" class="card" style="display:flex;flex-direction:column;gap:18px">
    <input type="hidden" name="id" value="${esc(c.id || '')}">
    <div><p class="sec">Identity</p><fieldset class="fs">
      ${field('First name', 'name', c.name, 'text', { req: true })}${field('Surname', 'surname', c.surname)}${field('Nickname', 'nickname', c.nickname)}
      ${field('Sex', 'sex', '', 'select', { req: true, options: opt([{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }], c.sex, '') })}
      ${field('Date of birth', 'dob', c.dob, 'date', { hint: 'The age changes by itself on the birthday.', attrs: ' max="' + today() + '"' })}${field('Age, if the date of birth is not known', 'age', c.dob ? '' : curAge(c), 'number', { attrs: ' min="0" max="40"', hint: '' })}
      ${field('Languages', 'languages', c.languages)}
      <label class="f"><span>Photo</span><span style="display:flex;gap:10px;align-items:center"><span id="photoprev">${c.id && photoOf(c) ? `<img src="${photoOf(c)}" alt="" style="width:72px;height:72px;border-radius:50%;object-fit:cover">` : ''}</span><input type="file" accept="image/*" id="photofile" class="in"></span><span class="sub" style="font-weight:400"></span></label>
    </fieldset>${isNew ? `<div id="dupbox" style="margin-top:10px">${c.name ? knownHtml([c.name, c.surname].join(' '), 'form') : ''}</div>` : ''}</div>
    <div><p class="sec">Street situation (Luigi)</p><fieldset class="fs">
      ${field('Situation', 'streetCat', '', 'select', { options: opt([{ v: 'A', l: STREET_CATS.A }, { v: 'B', l: STREET_CATS.B }], c.streetCat, 'Not a street child / not known') })}
      ${field('Where he or she stays now', 'streetPlace', c.streetPlace, 'text', { hint: 'Street spot, market, facility...' })}${field('Connected (from A to B) on', 'connectionDate', c.connectionDate, 'date')}
      ${field('Relatives on the street', 'relStreet', '', 'select', { options: opt(['Yes', 'No'], c.relStreet, 'Not known') })}${field('Which relatives', 'relStreetWho', c.relStreetWho, 'text', { hint: 'Mother, older brother...' })}<span></span>
      ${field('Back on the street after a service', 'backStreet', '', 'select', { options: opt(BACK_OPTS.map(([k, l]) => ({ v: k, l })), c.backStreet, 'No / not known'), hint: '' })}${field('Found on the street again on', 'backStreetDate', c.backStreetDate, 'date')}
    </fieldset></div>
    <div><p class="sec">In the programme</p><fieldset class="fs">
      ${field('Centre', 'section', '', 'select', { req: true, options: opt(SECTION_KEYS.map(k => ({ v: k, l: SECTIONS[k].label })), c.section), hint: '' })}
      ${field('Where the child sleeps', 'residence', '', 'select', { options: opt([{ v: 'Resident', l: 'Resident: sleeps at Minsundu Centre' }, { v: 'In transit', l: 'In transit: at Minsundu Centre for a few days' }, { v: 'Non-resident', l: 'Non-resident: sleeps at home' }], c.residence) })}
      ${field('Date of entry', 'entryDate', c.entryDate, 'date', { req: isNew })}${isNew ? '' : field('Year of entry, if the date is not known', 'entryYear', c.entryYear, 'text', { attrs: ' inputmode="numeric" pattern="[0-9]{4}" maxlength="4"' })}
      ${field('Came from (referred by)', 'referredBy', c.referredBy, 'text', { hint: 'Luigi, Minsundu, community school recruitment, stakeholder, Social Welfare...', attrs: ' list="srclist"' })}<datalist id="srclist">${NKZ_SOURCES.concat(['District Social Welfare Office']).map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      ${field('Followed by', 'responsible', '', 'select', { options: opt(activeStaff().map(s => ({ v: s.id, l: s.name })), c.responsible, '') })}
      <label class="f wide"><span>Programmes (ABA = distance adoption)</span>${checks('programmes', PROGRAMMES, c.programmes)}</label>
      <label class="f wide"><span>Support received (Nkwazi)</span>${checks('support', SUPPORT, c.support)}</label>
    </fieldset></div>
    <div><p class="sec">Family</p><fieldset class="fs">
      ${field('Compound or address', 'compound', c.compound)}${field('Family address', 'familyAddress', c.familyAddress)}${field('Contact phone', 'contact', c.contact)}
      ${field('Guardian', 'guardianName', c.guardianName)}${field('Guardian is the child\'s', 'guardianRelation', c.guardianRelation, 'text', { hint: 'Mother, aunt, grandmother...' })}${field('Father', 'father', c.father)}
      ${field('Mother', 'mother', c.mother)}${field('Other relatives', 'otherRelatives', c.otherRelatives)}${field('Family background', 'familyBackground', c.familyBackground)}
    </fieldset></div>
    ${isNew ? '<details class="more"><summary>More details: school, health, notes. They can be added later.</summary><div style="display:flex;flex-direction:column;gap:18px;margin-top:14px">' : ''}
    <div><p class="sec">School</p><fieldset class="fs">
      ${field('Education: by day goes to', 'schoolType', '', 'select', { options: opt(dayOpts(), dayType(c), 'Not written'), hint: '' })}${field('School name', 'schoolName', schoolNorm(c.schoolName), 'text', { attrs: ' list="schoolnames"', hint: 'Choose from the list if the school is there.' })}${schoolList()}${field('Class now', 'grade', c.grade, 'text', { attrs: ' list="gradelist"', hint: 'Grade (7, 11) or Form (Form 2).' })}<datalist id="gradelist">${GRADE_LIST.map(g => `<option value="${g}"></option>`).join('')}</datalist>${field('Class (stream)', 'stream', c.stream, 'text', { hint: 'A, B, Blue...' })}
      ${field('Skill or trade', 'skill', c.skill)}${field('Education at entry', 'educationAtEntry', c.educationAtEntry, 'textarea', { wide: true, rows: 2 })}
    </fieldset></div>
    <div><p class="sec">Health and notes</p><fieldset class="fs">
      ${seesHealth(c) ? field('Medical', 'medical', c.medical, 'textarea', { rows: 2 }) + field('Disabilities', 'disabilities', c.disabilities, 'textarea', { rows: 2 }) : `<p class="f wide" style="margin:0">${hiddenChip()} <span class="sub">Medical, disabilities and notes.</span></p>`}${field('Objectives', 'objectives', c.objectives, 'textarea', { rows: 2 })}
      ${seesHealth(c) ? field('Notes', 'notes', c.notes, 'textarea', { wide: true, rows: 4 }) : ''}
    </fieldset></div>
    ${isNew ? '</div></details>' : ''}
    <div style="display:flex;gap:10px"><button class="btn pri">${isNew ? 'Save the child' : 'Save changes'}</button><a class="btn" href="${isNew ? '#/children' : '#/child/' + esc(c.id)}">Cancel</a></div>
  </form>`;
}

/* Children list, Education: the school or centre itself, with the kind and the class under it (comment of 24/11) */
function eduCell(c) {
  const t = dayLabel(dayType(c)), n = schoolNorm(c.schoolName), g = c.grade ? gradeLabel(c.grade) : '';
  if (!t && !n) return '<span class="sub">Not written</span>';
  const main = n || t, sub = [n && t && n.toLowerCase() !== t.toLowerCase() ? t : '', g].filter(Boolean).join(' · ');
  return `${esc(main)}${sub ? `<div class="sub">${esc(sub)}</div>` : ''}`;
}
/* the education of a child, in a small form of its own (from the School box and the Details box of the file) */
function vEduForm(c) {
  return `<div class="top"><div><h1>Education · ${esc(fullName(c))}</h1><p class="lead">Where the child goes by day, the school, the class.</p></div><a class="btn" href="#/child/${esc(c.id)}">Back</a></div>
  <form class="card" data-form="edu" style="max-width:720px"><input type="hidden" name="id" value="${esc(c.id)}"><div class="fs two">
    ${field('By day goes to', 'schoolType', '', 'select', { options: opt(dayOpts(), dayType(c), 'Not written') })}${field('School name', 'schoolName', schoolNorm(c.schoolName), 'text', { attrs: ' list="schoolnames"', hint: 'Choose from the list if the school is there.' })}${schoolList()}
    ${field('Class now', 'grade', c.grade, 'text', { attrs: ' list="gradelist"', hint: 'Grade (7, 11) or Form (Form 2).' })}<datalist id="gradelist">${GRADE_LIST.map(g => `<option value="${g}"></option>`).join('')}</datalist>${field('Class (stream)', 'stream', c.stream, 'text', { hint: 'A, B, Blue...' })}
    ${field('Skill or trade', 'skill', c.skill)}</div>
    <button class="btn pri" style="margin-top:12px">Save</button></form>`;
}
function vChild(r) {
  if (r.id === 'new') return vChildForm(null);
  const c = child(r.id); if (!c) return `<h1>Not found</h1><p><a class="btn" href="#/children">Back to the list</a></p>`;
  if (r.sub === 'edit') return vChildForm(c);
  if (r.sub === 'status') return vStatus(c);
  if (r.sub === 'refer') return vRefer(c);
  if (r.sub === 'edu') return vEduForm(c);
  if (r.sub === 'player') return vPlayerForm(c, r.q);
  if (r.sub === 'term') return vTerm(c);
  if (r.sub === 'month') return vMonthly1(c);
  const vi = visitInfo(c), lite = sportsOnly(); /* Sports: a shorter file, without family, documents, visits */
  const hist = [];
  if (!lite) for (const v of visitsOf(c.id)) hist.push({ d: v.date, t: `<b>${esc(v.purpose)}</b> visit${v.where ? ' · ' + esc(v.where) : ''}${v.successful === 'No' ? ' · <span class="chip c-red">nobody found</span>' : ''}${v.stillHome ? ' · still at home: ' + esc(v.stillHome) : ''} <span class="sub">by ${esc(staffName(v.by))} · ${esc(teamLabel(visitTeam(v)))}</span>${v.findings ? `<div>${esc(v.findings)}</div>` : ''}${v.action ? `<div class="sub">Action: ${esc(v.action)}${v.actionDone ? ' (done)' : ''}</div>` : ''}<div><a class="btn sm" href="#/visitrep/${esc(v.id)}">Open the report</a> ${visitChip(v)}</div>` });
  for (const e of S.events.filter(e => String(e.childId) === String(c.id) && (!lite || e.by === USER.id))) { const t = eventLine(e); if (t) hist.push({ d: e.date, t: t + cancelBtn('event', e) }); }
  for (const e of S.events.filter(e => e.type === 'Group activity' && (e.children || []).map(String).includes(String(c.id)))) hist.push({ d: e.date, t: esc(e.kind || 'Group activity') + ': ' + esc(e.topic || '') + ' <span class="sub">(' + esc(grpSecLabel(e.section)) + ')</span>' });
  for (const m of movesOf(c.id)) hist.push({ d: m.date, t: `<b>${esc(moveLabel(m))}</b>${m.by ? ` <span class="sub">by ${esc(staffName(m.by))}</span>` : ''}${m.note ? `<div>${esc(m.note)}</div>` : ''}${cancelBtn('move', m)}` });
  if (!lite) for (const s of S.sessions.filter(s => (s.children || []).map(String).includes(String(c.id)))) hist.push({ d: s.date, t: `<b>Counselling, ${esc(s.type.toLowerCase())} session</b> <span class="sub">by ${esc(staffName(s.by))}</span>${s.topic ? `<div>${seesProtection(c, s) ? esc(s.topic) : hiddenChip()}</div>` : ''}<a class="btn sm" href="#/session/${esc(s.id)}">Open the session</a>${cancelBtn('session', s)}` });
  const met = S.outreach.filter(o => (o.children || []).map(String).includes(String(c.id)));
  if (met.length > 12) {
    const byM = {};
    for (const o of met) { const r = byM[o.date.slice(0, 7)] = byM[o.date.slice(0, 7)] || { last: '', n: {} }; r.n[o.type] = (r.n[o.type] || 0) + 1; if (o.date > r.last) r.last = o.date; }
    for (const [mo, r] of Object.entries(byM)) hist.push({ d: r.last, t: `<b>Luigi, ${esc(fmtMonth(mo))}</b><div>${[['Drop-in', 'days in the centre'], ['Day outreach', 'days met on the street'], ['Night outreach', 'nights on the street'], ['Monthly list', 'on the monthly list']].filter(x => r.n[x[0]]).map(x => r.n[x[0]] + ' ' + x[1]).join(' · ')}</div><div class="sub">Last met in the month</div>` });
  } else for (const o of met) hist.push({ d: o.date, t: o.imported ? `<b>On the Luigi list of ${esc(fmtMonth(o.date.slice(0, 7)))}</b>` : `<b>Met at ${esc(o.type.toLowerCase())}</b> <span class="sub">Luigi</span>` });
  if (c.entryDate) hist.push({ d: c.entryDate, t: `<b>Entered the programme</b>${c.referredBy ? ' · referred by ' + esc(c.referredBy) : ''}` });
  hist.sort((a, b) => (b.d || '').localeCompare(a.d || ''));
  const dl = rows => `<dl class="dl">${rows.filter(x => x[1] !== '' && x[1] != null && !(Array.isArray(x[1]) && !x[1].length)).map(x => `<dt>${esc(x[0])}</dt><dd>${Array.isArray(x[1]) ? esc(x[1].join(', ')) : esc(x[1])}</dd>`).join('')}</dl>`;
  const iss = issuesOf(c);
  return `<div class="top"><div style="display:flex;gap:14px;align-items:center">${avatar(c, photoOf(c) ? 96 : 56)}<div><h1>${esc(fullName(c))}${c.nickname ? ` <span style="font-weight:400;color:var(--muted)">"${esc(c.nickname)}"</span>` : ''}</h1>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="chip">ID ${esc(c.id)}</span>${chip(c.status)}${curAge(c) !== '' ? `<span class="chip">${c.dob ? '' : 'about '}${esc(curAge(c))} years</span>` : ''}${c.streetCat && c.section === 'Luigi' && isCurrent(c) ? `<span class="chip c-orange">${esc(STREET_CATS[c.streetCat])}</span>` : ''}${isAba(c) ? '<span class="chip c-green">ABA</span>' : ''}${c.relStreet === 'Yes' ? '<span class="chip c-orange">Relatives on the street</span>' : ''}${c.backStreet ? '<span class="chip c-red">Back on the street</span>' : ''}${absChip(c)}</div></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${lite ? '' : `<a class="btn pri" href="#/visit/new?child=${esc(c.id)}">Record a visit</a>`}<button class="btn" data-act="happened">Something happened</button><a class="btn" href="#/child/${esc(c.id)}/refer">Refer to a section</a>${lite ? '' : `<a class="btn" href="#/child/${esc(c.id)}/status">Change status or centre</a><a class="btn" href="#/child/${esc(c.id)}/edit">Edit</a>`}</div></div>
  ${referBox(c)}
  ${whereHtml(c)}
  ${actBoxes(c)}
  ${schoolBox(c)}
  ${lite ? '' : monthlyBox(c)}
  ${playerBox(c)}
  ${caseBox(c)}
  ${lite ? '' : docsBox(c)}
  ${c.sameAs && child(c.sameAs) ? `<div class="note">Probably the same child as <a href="#/child/${esc(c.sameAs)}">${esc(fullName(child(c.sameAs)))}, ID ${esc(c.sameAs)}</a> in ${esc(SECTIONS[child(c.sameAs).section].label)}: same name and a similar age. Check with the section before using two files.</div>` : ''}
  ${backAskHtml(c)}
  ${(c.toCheck || []).length ? `<div class="note"><b>To confirm with the Nkwazi team</b><ul style="margin:6px 0 8px 18px;padding:0">${c.toCheck.map(x => `<li>${esc(x)}</li>`).join('')}</ul><button class="btn sm" data-act="nkzchecked" data-id="${esc(c.id)}">Checked: remove this note</button></div>` : ''}
  ${pathHtml(c)}
  ${iss.length ? `<div class="warn">To complete: ${iss.map(k => esc(ISSUES[k])).join('; ')}.${c.sectionToCheck ? ` <button class="btn sm" data-act="confirmsection" data-id="${esc(c.id)}">${esc(SECTIONS[c.section].label)} is right</button>` : ''}</div>` : ''}
  <div class="grid g2" style="align-items:start">
    <div style="display:flex;flex-direction:column;gap:16px">
      ${lite ? '' : `<section class="card"><h2>Home visits</h2>
        ${needsVisits(c) ? `<div class="row"><span>Last home visit</span><b>${vi.last ? esc(fmtDate(vi.last)) : 'none recorded'}</b></div><div class="row"><span>Next visit due</span><b>${vi.never ? 'now' : esc(fmtDate(vi.due))}${!vi.never && vi.late >= 0 ? ` <span class="chip c-red">${vi.late} days late</span>` : ''}</b></div><p class="sub" style="margin:4px 0 0">Every ${vi.every} days (${esc(c.status === 'Follow-up' ? 'follow-up' : (c.residence || 'non-resident').toLowerCase())}).</p>` : (c.section === 'Luigi' ? luigiVisitLine(c) : '<p class="empty">No home visits planned for this status or section.</p>')}
        ${needsVisits(c) || c.section === 'Luigi' ? planProfileHtml(c) : ''}
      </section>`}
      <section class="card"><div class="cardhead"><h2>Details</h2>${lite ? '' : `<a class="btn sm" href="#/child/${esc(c.id)}/edit">Change</a>`}</div>
        <p class="sec" style="margin-top:12px">Age</p>${dl([['Date of birth', c.dob ? fmtDate(c.dob) : 'Not known'], ['Age today', ageText(c)]])}
        <p class="sec" style="margin-top:12px">In the programme</p>${dl([['Centre', SECTIONS[c.section] ? SECTIONS[c.section].label : ''], ['Date of entry', entryText(c)], ['Came from', c.referredBy], ['Note at admission', c.admissionNote], ['No in the Nkwazi Data Tool', c.toolNo], ['Followed by', staffName(c.responsible)], ['Programmes', c.programmes], ['Support received', c.support], ['Street situation', STREET_CATS[c.streetCat] || ''], ['Relatives on the street', c.relStreet ? c.relStreet + (c.relStreetWho ? ' · ' + c.relStreetWho : '') : ''], ['Back on the street', c.backStreet ? backLabel(c.backStreet) + (c.backStreetDate ? ' · found again on ' + fmtDate(c.backStreetDate) : '') : ''], ['Where now', [c.whereNow && c.whereNow !== 'InCity' ? c.whereNow : '', c.streetPlace].filter(Boolean).join(', ')], ['Taken to another place on', fmtDate(c.transferDate)], ['Connected (A to B) on', fmtDate(c.connectionDate)], ['Reintegrated on', fmtDate(c.reintegrationDate)], ['File closed', c.closeDate ? fmtDate(c.closeDate) + ' · ' + (c.closeReason || '') : '']])}
        ${lite ? '' : '<p class="sec" style="margin-top:14px">Family</p>' + dl([['Compound', c.compound], ['Family address', c.familyAddress], ['Contact', c.contact], ['Guardian', [c.guardianName, c.guardianRelation].filter(Boolean).join(', ')], ['Father', c.father], ['Mother', c.mother], ['Other relatives', c.otherRelatives], ['Family background', c.familyBackground], ['Languages', c.languages]])}
        <p class="sec" style="margin-top:14px">School ${lite ? '' : `<a class="btn sm" href="#/child/${esc(c.id)}/edu" style="margin-left:8px">Change</a>`}</p>${dl([['School type', c.schoolType ? c.schoolType + (c.schoolTypeToCheck ? ' (from the Nkwazi file: GRZ or private to confirm)' : '') : ''], ['School', c.schoolName], ['Grade', c.grade], ['Class (stream)', c.stream], ['Skill', c.skill], ['Education at entry', c.educationAtEntry]])}
        <p class="sec" style="margin-top:14px">Health and notes</p>${seesHealth(c) ? dl([['Medical', c.medical], ['Disabilities', c.disabilities], ['Objectives', c.objectives], ['Notes', c.notes]]) : seesConditions(c) ? dl([['Medical', c.medical || 'Nothing written'], ['Disabilities', c.disabilities || 'Nothing written'], ['Objectives', c.objectives]]) + (c.notes ? `<p style="margin:6px 0 0">Notes: ${hiddenChip()}</p>` : '') : dl([['Objectives', c.objectives]]) + (c.medical || c.disabilities || c.notes ? `<p style="margin:6px 0 0">${hiddenChip()}</p>` : '')}
        ${c.importedFrom ? `<p class="sub" style="margin:12px 0 0">Imported from the ${esc(c.importedFrom)}.</p>` : ''}
      </section>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <section class="card" id="happened"><h2>Something happened</h2>
        <form data-form="event" style="display:grid;grid-template-columns:1fr 150px;gap:8px">
          <input type="hidden" name="childId" value="${esc(c.id)}">
          <select class="in" name="type" aria-label="What happened">${opt(EVENT_TYPES)}</select><input class="in" type="date" name="date" value="${today()}" max="${today()}" aria-label="Date" required>
          <textarea class="in" name="note" id="evnote" rows="3" placeholder="What happened" aria-label="Details" style="grid-column:1/-1"></textarea><button class="btn pri" style="grid-column:1/-1">Save in the history</button>
        </form></section>
      <section class="card"><h2>History</h2><div class="tl" style="margin-top:12px">${hist.length ? hist.map(h => `<div class="e"><div class="sub">${esc(fmtDate(h.d) || 'date not recorded')}</div>${h.t}</div>`).join('') : '<p class="empty">Nothing recorded yet.</p>'}</div></section>
    </div>
  </div>`;
}
function moveLabel(m) {
  if (m.type === 'section') return 'Moved from ' + ((SECTIONS[m.from] || {}).label || m.from) + ' to ' + ((SECTIONS[m.to] || {}).label || m.to);
  if (m.type === 'reintegrated') return 'Reintegrated with the family; 2-year follow-up starts';
  if (m.type === 'closed') return 'File closed' + (m.reason ? ': ' + reasonLabel(m.reason) : '');
  if (m.type === 'reopened') return 'File reopened';
  if (m.type === 'status') return 'Status changed to ' + (STATUS_LABEL[m.to] || m.to);
  if (m.type === 'residence') return 'Now ' + (m.to || '').toLowerCase();
  if (m.type === 'street') return 'Street situation: ' + (m.to ? STREET_CATS[m.to] : 'not on the street any more');
  if (m.type === 'handover') return 'Handed over';
  if (m.type === 'admitted') return 'Admitted';
  return m.type;
}
function vStatus(c) {
  const closed = c.status === 'Closed';
  return `<div class="top"><div><h1>${esc(fullName(c))}</h1><p class="lead">Now: ${esc(SECTIONS[c.section].label)} · ${esc(STATUS_LABEL[c.status])} · ${esc(c.residence || '')}</p></div><a class="btn" href="#/child/${esc(c.id)}">Back</a></div>
  <div class="grid g2" style="align-items:start">
    ${closed ? `<form class="card" data-form="reopen"><input type="hidden" name="id" value="${esc(c.id)}"><h2>Reopen the file</h2><p class="sub"></p>
      <div class="fs two">${field('Date', 'date', today(), 'date', { req: true })}${field('Section', 'section', '', 'select', { options: opt(SECTION_KEYS.map(k => ({ v: k, l: SECTIONS[k].label })), c.section) })}${field('Note', 'note', '', 'text', { wide: true })}</div><button class="btn pri" style="margin-top:12px">Reopen</button></form>` : `
    ${c.section === 'Luigi' || c.streetCat ? `<form class="card" data-form="street"><input type="hidden" name="id" value="${esc(c.id)}"><h2>Street situation</h2><p class="sub">Now: <b>${esc(c.streetCat ? STREET_CATS[c.streetCat] : 'not on the street, or not known')}</b></p>
      <div class="fs two">${field('Situation now', 'cat', '', 'select', { options: opt([{ v: 'A', l: STREET_CATS.A }, { v: 'B', l: STREET_CATS.B }, { v: 'none', l: 'Not on the street any more' }], c.streetCat || 'none') })}${field('Date', 'date', today(), 'date', { req: true })}</div><button class="btn" style="margin-top:12px">Save</button></form>` : ''}
    ${centreOf(c) === 'Minsundu' ? `<form class="card" data-form="resid"><input type="hidden" name="id" value="${esc(c.id)}"><h2>Resident, in transit or non-resident</h2><p class="sub">Now: <b>${esc(c.residence || 'not written')}</b>. The child stays on the Minsundu register.</p>
      <div class="fs two">${field('Now', 'to', '', 'select', { req: true, options: opt([{ v: 'Resident', l: 'Resident: sleeps at Minsundu Centre' }, { v: 'In transit', l: 'In transit: at Minsundu Centre for a few days' }, { v: 'Non-resident', l: 'Non-resident: sleeps at home' }, { v: 'facility', l: 'Transferred to another facility (closes the file)' }], c.residence) })}${field('Date', 'date', today(), 'date', { req: true })}${field('Note (which facility)', 'note', '', 'text', { wide: true })}</div><button class="btn pri" style="margin-top:12px">Save</button></form>` : ''}
    <form class="card" data-form="move"><input type="hidden" name="id" value="${esc(c.id)}"><h2>Move to another centre</h2><p class="sub"></p>
      <div class="fs two">${field('New section', 'to', '', 'select', { options: opt(SECTION_KEYS.filter(k => k !== c.section).map(k => ({ v: k, l: SECTIONS[k].label }))) })}${field('Date', 'date', today(), 'date', { req: true })}${field('Where the child sleeps', 'residence', '', 'select', { options: opt([{ v: 'Resident', l: 'Resident: sleeps at Minsundu Centre' }, { v: 'In transit', l: 'In transit: at Minsundu Centre for a few days' }, { v: 'Non-resident', l: 'Non-resident: sleeps at home' }], c.residence) })}${field('Education: by day goes to', 'schoolType', '', 'select', { options: opt(dayOpts(), dayType(c), 'Not written'), hint: '' })}${field('Note', 'note', '')}</div><button class="btn pri" style="margin-top:12px">Move</button></form>
    <form class="card" data-form="activity"><input type="hidden" name="id" value="${esc(c.id)}"><h2>Active or semi-active</h2><p class="sub"></p>
      <div class="fs two">${field('Status', 'status', '', 'select', { options: opt(['Active', 'Semi-active'], c.status === 'Semi-active' ? 'Semi-active' : 'Active') })}${field('Date', 'date', today(), 'date')}</div><button class="btn" style="margin-top:12px">Save</button></form>
    ${c.status !== 'Follow-up' ? `<form class="card" data-form="reintegrate"><input type="hidden" name="id" value="${esc(c.id)}"><h2>Reintegrated with the family</h2><p class="sub"></p>
      <div class="fs two">${field('Date', 'date', today(), 'date', { req: true })}${field('Note', 'note', '')}</div><button class="btn pri" style="margin-top:12px">Record reintegration</button></form>` : ''}
    <form class="card" data-form="close"><input type="hidden" name="id" value="${esc(c.id)}"><h2>Close the file</h2><p class="sub">You can open it again later.</p>
      <div class="fs two">${field('Reason', 'reason', '', 'select', { req: true, options: opt(CLOSE_REASONS.map(v => ({ v, l: reasonLabel(v) })), c.status === 'Follow-up' ? CLOSE_REASONS[0] : '', '') })}${field('Date', 'date', today(), 'date', { req: true })}${field('Note', 'note', '', 'text', { wide: true })}</div><button class="btn danger" style="margin-top:12px">Close the file</button></form>`}
  </div>`;
}

/* Monitoring, School Section: the way to the pupils of every school */
function schoolSpot() { const P = S.children.filter(c => isPupil(c) && outsideSchool(c)), sl = schoolsLeft(termNow()); return `<a class="spot" href="#/school"><div><span class="sk">Database of pupils · School Section</span><b>Pupils by school</b></div><div class="sr"><span class="sub">${P.length} pupils · ${sl.all} schools${sl.all && !termNow().hol ? ' · ' + sl.left + ' not visited in ' + esc(termLabel(termNow())) : ''}</span><span class="btn pri">Open</span></div></a>`; }
function vVisitForm(r) {
  const cid = r.q.get('child'); const c = cid ? child(cid) : null;
  const opts = S.children.filter(x => x.status !== 'Closed').sort((a, b) => fullName(a).localeCompare(fullName(b))).map(x => ({ v: x.id, l: fullName(x) + (x.nickname ? ' "' + x.nickname + '"' : '') + ' · ' + centreOf(x) + ' · ' + x.id }));
  const tq = r.q.get('t'), team = TEAM_KEYS.includes(tq) ? tq : (myTeam() || (c ? teamFor(c) : '')), school = team === 'School';
  const ed = r.q.get('edit') ? S.visits.find(x => x.id === r.q.get('edit') && visitCanEdit(x)) : null;
  return `<div class="top"><div><h1>${ed ? 'Change the visit' : school ? 'School Monitoring Form' : 'Record a visit'}</h1><p class="lead">${school ? 'One form for each pupil seen in the school visit.' : ''}</p></div>${school && !ed ? '<a class="btn" href="#/schoolvisit' + (c && schoolNorm(c.schoolName) ? '?sn=' + encodeURIComponent(schoolOf(c)) + (r.q.get('d') ? '&d=' + esc(r.q.get('d')) : '') : '') + '">The pupils of the school</a>' : ''}</div>
  <form class="card" data-form="visit" style="display:flex;flex-direction:column;gap:14px;max-width:820px">${['sv', 'pu'].includes(r.q.get('back')) ? '<input type="hidden" name="back" value="' + r.q.get('back') + '">' : ''}${ed ? `<input type="hidden" name="edit" value="${esc(ed.id)}">` : ''}
    <div class="fs two">
      ${field('Who made the visit?', 'team', '', 'select', { req: true, wide: true, options: opt(VISIT_TEAMS.map(([k, l]) => ({ v: k, l })), team, 'Choose the section'), hint: '' })}
      ${childPick('childId', c ? c.id : '', 'Child *')}
      ${field('Date', 'date', /^\d{4}-\d\d-\d\d$/.test(r.q.get('d') || '') && r.q.get('d') <= today() ? r.q.get('d') : today(), 'date', { req: true })}
      ${school ? schoolVisitFields(c) : `      ${field('Purpose', 'purpose', '', 'select', { req: true, options: opt(VISIT_PURPOSES, school ? 'School visit' : c && c.status === 'Follow-up' ? 'Follow-up' : '', 'Choose') })}
      ${field('Where', 'where', '', 'select', { options: opt(VISIT_WHERE, school ? 'School' : 'Home') })}
      ${field('Visited by', 'by', '', 'select', { options: opt(activeStaff().map(s => ({ v: s.id, l: s.name })), USER.id) })}
      ${field('Was somebody found?', 'successful', '', 'select', { options: opt([{ v: 'Yes', l: 'Yes, the visit took place' }, { v: 'No', l: 'No, nobody found' }], 'Yes') })}
      ${field('Met with', 'metWith', '', 'text', { hint: 'Mother, guardian, teacher…' })}
      ${field('School or place', 'place', '', 'text', { hint: 'For school visits: the school name' })}
      ${field('Follow-up only: is the child still living at home?', 'stillHome', '', 'select', { options: opt(['Yes', 'No'], '', 'Not a follow-up visit'), hint: 'Feeds logframe SO1.1' })}
      ${field('What did you find?', 'findings', '', 'textarea', { wide: true, rows: 4 })}
      ${field('Follow-up action', 'action', '', 'text', { wide: true, hint: 'Stays in Visits, Actions still open, until done.' })}`}
      ${referFields()}
      ${filePickField('visit', 'Photo of the visit')}
    </div>
    <div style="display:flex;gap:10px"><button class="btn pri">${ed ? 'Save the changes' : 'Save visit'}</button><a class="btn" href="${ed ? '#/visitrep/' + esc(ed.id) : c ? '#/child/' + esc(c.id) : '#/visits'}">${ed ? 'Leave as it is' : 'Cancel'}</a></div>
  </form>`;
}
/* visits done: every column can be filtered and sorted; the export gives what is on the screen */
function visitsBase(q) {
  const m = q.get('m') || thisMonth(), per = q.get('vper') || '', y = String(m).slice(0, 4);
  const { a, b } = per === 'year' ? { a: y + '-01-01', b: y + '-12-31' } : per === 'all' ? { a: '1990-01-01', b: '2999-12-31' } : monthCtx(m);
  const { team, centre } = visitSel(q);
  return S.visits.filter(v => inRange(v.date, a, b) && tmatch(visitTeam(v), team) && vcIn(child(v.childId), team, centre));
}
function visitSchool(v) { const c = child(v.childId); return v.purpose === 'School visit' ? (schoolNorm(v.place) || (c ? schoolOf(c) : '')) : ''; }
const VISIT_FK = ['p', 'by', 'ok', 'vg', 'vw', 'vq', 'vf', 'va', 'vsn', 'vsa', 'vsp', 'vst'];
function filteredVisits(q) {
  const g = k => q.get(k) || '', term = g('vq').trim().toLowerCase(), words = g('vf').trim().toLowerCase();
  const so = g('vso') || 'date', dir = (g('vsd') || 'desc') === 'asc' ? 1 : -1;
  const rows = visitsBase(q).filter(v => {
    const c = child(v.childId);
    if (g('p') && v.purpose !== g('p')) return false;
    if (g('by') && v.by !== g('by')) return false;
    if (g('ok') && (g('ok') === 'No') !== (v.successful === 'No')) return false;
    if (g('vg') && (!c || !inGroup(c, g('vg')))) return false;
    if (g('vw') && (v.where || '') !== g('vw')) return false;
    if (term && !(c ? [c.id, c.name, c.surname, c.nickname].join(' ') : String(v.childId)).toLowerCase().includes(term)) return false;
    if (words && ![v.findings, v.action, v.metWith, v.place].join(' ').toLowerCase().includes(words)) return false;
    if (g('va') && (g('va') === 'open' ? !(v.action && !v.actionDone) : g('va') === 'done' ? !(v.action && v.actionDone) : !!v.action)) return false;
    if (g('vsn') && visitSchool(v) !== g('vsn')) return false;
    if (g('vsa') && (v.schAtt || '') !== g('vsa')) return false;
    if (g('vsp') && (v.perf || '') !== g('vsp')) return false;
    if (g('vst') && (v.trend || '') !== g('vst')) return false;
    return true;
  });
  const val = v => { const c = child(v.childId); return so === 'child' ? (c ? fullName(c) : '').toLowerCase() : so === 'team' ? teamLabel(visitTeam(v)) : so === 'centre' ? (c ? centreOf(c) : '') : so === 'purpose' ? v.purpose || '' : so === 'where' ? (v.where || '') + (v.place || '') : so === 'ok' ? (v.successful === 'No' ? 'No' : 'Yes') : so === 'by' ? staffName(v.by) : v.date || ''; };
  return rows.sort((x, y) => { const va = val(x), vb = val(y); return (va < vb ? -1 : va > vb ? 1 : 0) * dir || (y.date || '').localeCompare(x.date || ''); });
}
const VISIT_COLS_SCHOOL = [{ label: 'School', get: v => visitSchool(v) }, { label: 'School attendance', get: v => v.schAtt || '' }, { label: 'Performance', get: v => v.perf || '' }, { label: 'Compared with the last visit', get: v => v.trend || '' }, { label: 'Grade teacher', get: v => v.teacher || '' }, { label: 'Weaknesses', get: v => v.weak || '' }, { label: 'Strengths', get: v => v.strong || '' }];
const VISIT_COLS = [{ key: 'date', label: 'Date' }, { label: 'Visit made by (section)', get: v => teamLabel(visitTeam(v)) }, { label: 'Centre of the child', get: v => { const c = child(v.childId); return c ? centreOf(c) : ''; } }, { key: 'childId', label: 'Child ID' }, { label: 'Child', get: v => { const c = child(v.childId); return c ? fullName(c) : ''; } }, { label: 'Section', get: v => { const c = child(v.childId); return c ? (SECTIONS[c.section] || {}).label || '' : ''; } }, { label: 'Residence', get: v => { const c = child(v.childId); return c ? c.residence || '' : ''; } }, { key: 'purpose', label: 'Purpose' }, { key: 'where', label: 'Where' }, { key: 'place', label: 'Place' }, { label: 'Found', get: v => v.successful === 'No' ? 'No' : 'Yes' }, { key: 'metWith', label: 'Met with' }, { key: 'stillHome', label: 'Still at home' }, { label: 'By', get: v => staffName(v.by) }, { key: 'findings', label: 'Findings' }, { key: 'action', label: 'Action' }, { label: 'Action done', get: v => v.actionDone ? 'Yes' : '' }];
function vVisits(r) {
  if (r.id === 'new') return vVisitForm(r);
  const q = r.q, m = q.get('m') || thisMonth(), { team, centre } = visitSel(q);
  const tab = ['need', 'plan', 'actions', 'check'].includes(q.get('vtab')) ? q.get('vtab') : 'done';
  const N = visitNeed(team, centre), acts = visitActions(team, centre);
  const tabs = [['done', 'Visits done', ''], ['need', 'Who needs a visit', N.count], ['plan', 'Plan of the month', planFor(tab === 'plan' ? m : planMonth(), team, centre).length], ['actions', 'Actions still open', acts.length], ['check', 'To validate', visitsToCheck(team, centre).filter(v => visitState(v) === (USER.admin ? 'wait' : 'back')).length]];
  let body;
  if (tab === 'check') body = checkHtml(team, centre);
  else if (tab === 'need') body = referTeamBox(team, centre) + needHtml(r, team, centre, N);
  else if (tab === 'plan') body = monthBar(m) + planReminder() + referTeamBox(team, centre) + planCard(m, team, centre);
  else if (tab === 'actions') body = actionsHtml(acts);
  else {
    const base = visitsBase(q), vs = filteredVisits(q), any = VISIT_FK.some(k => q.get(k)), per = q.get('vper') || '', yy = String(m).slice(0, 4);
    const hasSchool = base.some(v => v.purpose === 'School visit'), schoolCols = hasSchool && team === 'School';
    const sel = (name, options, label) => `<label class="f">${label}<select class="in" data-filter="${name}">${options}</select></label>`;
    const txt = (name, label, ph) => `<label class="f">${label}<input class="in" data-filter="${name}" value="${esc(q.get(name) || '')}" placeholder="${ph}"></label>`;
    const so = q.get('vso') || 'date', sd = q.get('vsd') || 'desc';
    const th = (key, label, cls) => `<th class="${cls || ''}"><a href="#" class="sortth" data-q="vso=${key}&vsd=${so === key && sd === 'desc' ? 'asc' : 'desc'}" title="Sort by this column">${label}${so === key ? (sd === 'asc' ? ' ▲' : ' ▼') : ''}</a></th>`;
    const names = {}; for (const v of base) { const n = visitSchool(v); if (n) names[n] = (names[n] || 0) + 1; }
    const oneTeam = team === 'Family' || team === 'School'; /* the page is already of one section: the section is not written again on every row */
    const who = ' · ' + (team === 'Others' ? 'Others' : teamLabel(team)) + (centre === 'all' ? '' : ' · children of ' + CENTRE_LABEL[centre]);
    body = `${team === 'School' ? schoolTripsHtml(per === 'year' ? yy + '-01-01' : per === 'all' ? '0000' : m + '-01', per === 'year' ? yy + '-12-31' : per === 'all' ? '9999' : m + '-31', per === 'year' ? yy : per === 'all' ? 'all years' : fmtMonth(m)) : ''}<div class="spot plain"><div><span class="sk">Database of visits${team === 'School' ? ' · one row for each form' : ''}</span><b>${team === 'School' ? 'Forms filled' : 'Visits done'}${esc(who)} · ${esc(per === 'year' ? yy : per === 'all' ? 'all years' : fmtMonth(m))}</b></div><div class="sr"><span class="sn">${vs.length}</span><button class="btn sm" data-act="xl" data-k="visits">Export in Excel</button></div></div>
  <div class="card filters fold${UI.fopen ? ' open' : ''}" style="grid-template-columns:repeat(4,minmax(0,1fr))">${filtBtn()}
    ${sel('vper', opt([{ v: 'year', l: 'Whole year ' + yy }, { v: 'all', l: 'All years' }], per, 'The month chosen above'), 'Period')}
    ${txt('vq', 'Child', 'Name or ID')}
    ${sel('p', opt(VISIT_PURPOSES, q.get('p'), 'All purposes'), 'Purpose')}
    ${sel('vw', opt(VISIT_WHERE, q.get('vw'), 'Anywhere'), 'Where')}
    ${sel('ok', opt([{ v: 'Yes', l: 'Somebody found' }, { v: 'No', l: 'Nobody found' }], q.get('ok'), 'All visits'), 'Found')}
    ${sel('by', opt(S.staff.map(s => ({ v: s.id, l: s.name })), q.get('by'), 'Anyone'), 'Visited by')}
    ${sel('vg', opt([{ v: 'ABA', l: 'ABA children only' }, { v: 'ZAS', l: 'ZAS children only' }], q.get('vg'), 'All children'), 'Children')}
    ${sel('va', opt([{ v: 'open', l: 'Action still open' }, { v: 'done', l: 'Action done' }, { v: 'none', l: 'No action written' }], q.get('va'), 'Any'), 'Follow-up action')}
    ${txt('vf', 'Findings', 'A word')}
    ${hasSchool ? sel('vsn', opt(Object.keys(names).sort((x, y) => x.localeCompare(y)).map(k => ({ v: k, l: k + ' · ' + names[k] })), q.get('vsn'), 'Every school'), 'School') + sel('vsa', opt(SCH_ATT, q.get('vsa'), 'Any'), 'School attendance') + sel('vsp', opt(PERF, q.get('vsp'), 'Any'), 'Performance') + sel('vst', opt(TREND, q.get('vst'), 'Any'), 'Compared with the last visit') : ''}
  </div>
  <div class="card" style="padding:6px 8px"><p class="sub" style="margin:4px 4px 6px"><b>${vs.length}</b>${any ? ' of ' + base.length : ''} ${team === 'School' ? 'forms' : 'visits'}${any ? ' · <a href="#" data-q="' + VISIT_FK.map(k => k + '=').join('&') + '">clear the filters</a>' : ''}<span class="mh"> · tap a column title to sort</span></p>${vs.length ? `<div class="tw"><table class="vtab"><thead><tr>${th('date', 'Date')}${oneTeam ? '' : th('team', 'Section', 'mh')}${th('centre', 'Centre', 'mh')}${th('child', 'Child')}${th('purpose', 'Purpose')}${th('where', 'Where', 'mh')}${th('ok', 'Found')}${th('by', 'By', 'mh')}${schoolCols ? '<th class="mh">Attendance</th><th class="mh">Performance</th>' : ''}<th class="mh">Findings</th><th><span class="vh">Report</span></th></tr></thead><tbody>${vs.map(v => { const c = child(v.childId); return `<tr><td>${esc(fmtDate(v.date))}</td>${oneTeam ? '' : `<td class="mh">${esc(teamLabel(visitTeam(v)))}</td>`}<td class="mh">${c ? centreChip(c) : ''}</td><td class="vkid">${c ? childLink(c) : esc(v.childId)}${c && isAba(c) ? ' <span class="chip c-green">ABA</span>' : ''}<div class="sub mo">${oneTeam ? '' : esc(teamLabel(visitTeam(v))) + ' · '}${esc(staffName(v.by))}</div></td><td>${esc(v.purpose)}</td><td class="mh">${esc(v.where || '')}${v.place ? ' · ' + esc(v.place) : ''}</td><td>${v.successful === 'No' ? '<span class="chip c-red">No</span>' : 'Yes'}</td><td class="mh">${esc(staffName(v.by))}</td>${schoolCols ? `<td class="mh">${esc(v.schAtt || '')}</td><td class="mh">${esc(v.perf || '')}${v.trend ? ' · ' + esc(v.trend) : ''}</td>` : ''}<td class="mh">${esc((v.findings || '').slice(0, 120))}${v.action ? `<div class="sub">Action${v.actionDone ? ' (done)' : ''}: ${esc(v.action.slice(0, 80))}</div>` : ''}</td><td class="vopen">${visitChip(v)}<a class="btn sm" href="#/visitrep/${esc(v.id)}">Open the report</a></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="empty">No visits match.</p>'}</div>`;
  }
  return `<div class="top"><div><h1>Monitoring</h1></div><div style="display:flex;gap:8px;flex-wrap:wrap">${tab === 'done' ? monthPicker(m) : ''}<a class="btn" href="#/referrals${TEAM_KEYS.includes(team) ? '?to=' + team : ''}">Referrals${referOpen(TEAM_KEYS.includes(team) ? team : '').length ? ' · ' + referOpen(TEAM_KEYS.includes(team) ? team : '').length : ''}</a>${team === 'School' ? '<a class="btn pri" href="#/schoolvisit">Record a school visit</a>' : `<a class="btn pri" href="#/visit/new?t=${team}">Record a visit</a>`}</div></div>
  ${visitChooser(q, m)}
  ${team === 'School' ? schoolSpot() : ''}
  <div class="vtabs" id="vtabs" role="tablist">${tabs.map(([k, l, n]) => `<a href="#" role="tab" data-q="vtab=${k === 'done' ? '' : k}&all=&lall=" class="${tab === k ? 'on' : ''}">${l}${n !== '' ? ` <span class="n">${n}</span>` : ''}</a>`).join('')}</div>
  ${body}`;
}

function attGrp(q, centre) { const g = q.get('g'); return centre === 'Minsundu' ? (['UCC', 'Youth', 'Non-resident', 'All'].includes(g) ? g : 'UCC') : (g || 'All'); }
function attKids(q, plain) {
  const centre = q.get('c') || defCentre(), grp = attGrp(q, centre), sec = '', only = q.get('only'), d = q.get('d') || today();
  const day = S.attendance[d] || {};
  const term = (UI.attq || '').trim().toLowerCase();
  return S.children.filter(c => isCurrent(c) && attIn(c, centre, grp)
    && (!sec || c.section === sec)
    && (centre === 'Minsundu' || ((!q.get('sg') || centre !== 'Nkwazi' || nkzSchoolGroup(c) === q.get('sg')) && (!q.get('gr') || String(c.grade) === q.get('gr'))))
    && (!only || (only === 'unmarked' ? day[attKey(c, centre)] == null : day[attKey(c, centre)] === only))
    && (!term || [c.id, c.name, c.surname, c.nickname].join(' ').toLowerCase().includes(term))
  ).sort((a, b) => (plain ? 0 : (day[attKey(b, centre)] === 'P') - (day[attKey(a, centre)] === 'P')) || fullName(a).localeCompare(fullName(b)));
}
function attTable(q) {
  const d = q.get('d') || today(), centre = q.get('c') || defCentre();
  const kids = attKids(q), day = S.attendance[d] || {};
  if (!kids.length) return '<p class="empty">No child matches.</p>';
  const nP = kids.filter(c => day[attKey(c, centre)] === 'P').length, sep = (t, n) => `<tr class="gsep"><td colspan="3">${t} · ${n}</td></tr>`;
  return `<div class="tw"><table class="atttab"><thead><tr><th>Name</th><th>Centre</th><th>Attendance</th></tr></thead><tbody>${kids.map((c, i) => `${nP && i === 0 ? sep('Present', nP) : ''}${nP && i === nP && nP < kids.length ? sep('Everyone else, A to Z', kids.length - nP) : ''}<tr><td>${childLink(c)}${c.residence === 'In transit' ? ' <span class="chip c-orange">In transit</span>' : ''}<div class="sub">ID ${esc(c.id)}${c.entryDate ? ' · since ' + esc(c.entryDate.slice(0, 4)) : ''}${guestLine(c, centre)}</div></td><td>${secChip(c.section)}</td><td><div class="att">${attOpts(c, centre).map(([k, l]) => `<button class="${k}${day[attKey(c, centre)] === k ? ' on' : ''}" data-act="att" data-d="${d}" data-id="${esc(attKey(c, centre))}" data-v="${k}">${l}</button>`).join('')}</div></td></tr>`).join('')}</tbody></table></div>`;
}
/* the day of a register: the Pager of the system with one day as the period (DS 3484). It opens on today; After is disabled on today */
function dayBar(d, param) {
  const t = today(), lab = new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `<div class="cyp-pager cyp-pager--day" role="group" aria-label="Day of the register"><a class="cyp-btn" href="#" data-q="${param}=${addDays(d, -1)}">${dsIcon('left')}Before</a><span class="cyp-pager__now">${esc(lab)}${d === t ? '<span class="cyp-tag">Today</span>' : `<span class="cyp-tag cyp-tag--warn">${dsIcon('alert')}Not today</span>`}</span>${d < t ? `<a class="cyp-btn" href="#" data-q="${param}=${addDays(d, 1)}">After${dsIcon('right')}</a>` : `<button class="cyp-btn" disabled>After${dsIcon('right')}</button>`}</div>`;
}
function vAttendance(r) {
  const q = r.q, centre = q.get('c') || defCentre();
  if (centre === 'Luigi') return vLuigiAtt(r);
  const d = q.get('d') || today(), grp = attGrp(q, centre), mode = attMode(q), month = mode === 'month', quick = mode === 'quick';
  const all = S.children.filter(c => isCurrent(c) && attIn(c, centre, grp));
  const day = S.attendance[d] || {};
  const mk = c => day[attKey(c, centre)];
  const cnt = k => all.filter(c => mk(c) === k).length;
  const notDone = all.filter(c => mk(c) == null).length;
  const sx = k => sexText(k === 'unmarked' ? all.filter(c => mk(c) == null) : all.filter(c => mk(c) === k));
  const only = q.get('only') || '';
  const tile = (k, n, l) => `<a href="#" class="tile" data-q="only=${only === k ? '' : k}" style="${only === k ? 'border-color:var(--ink)' : ''}"><b>${n}</b><span>${l}</span><span class="sub">${sx(k)}</span></a>`;
  return `<div class="top"><div><h1>Attendance · ${esc(CENTRE_LABEL[centre] || centre)} · ${esc(grpText(grp))}</h1>${month ? `<p class="lead">${esc(fmtMonth(d.slice(0, 7)))}</p>` : ''}</div>
  </div>
  ${centreSeg(centre)}
  ${month ? '' : dayBar(d, 'd')}
  ${quick ? '' : `<div class="grid g4">
    ${centre === 'Minsundu' ? attMarks(centre, grp).map(k => tile(k, cnt(k), ATT_L[k])).join('') : tile('P', cnt('P'), 'Present') + tile('A', cnt('A'), 'Absent') + tile('S', cnt('S') + cnt('E'), 'Sick or with permission')}${tile('unmarked', notDone, 'Not marked yet')}
  </div>`}
  <div class="attctl">
    ${quick ? `<details class="qctl"${window.matchMedia && window.matchMedia('(max-width:899.98px)').matches ? '' : ' open'}><summary>Change group, day or view</summary>` : ''}<div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg" role="group" aria-label="Group">${attGroups(centre).map(([k, l]) => `<a href="#" data-q="g=${k}" class="${grp === k ? 'on' : ''}">${l} · ${S.children.filter(c => isCurrent(c) && attIn(c, centre, k)).length}</a>`).join('')}</div>
    <input class="in" type="date" value="${d}" max="${today()}" data-filter="d" style="width:auto" aria-label="Another day">
    <div class="seg" role="group" aria-label="How to mark"><a href="#" data-q="av=quick" class="${quick ? 'on' : ''}">Quick marking</a><a href="#" data-q="av=day" class="${mode === 'day' ? 'on' : ''}">Full list</a><a href="#" data-q="av=month" class="${month ? 'on' : ''}">Month register</a></div></div>${quick ? '</details>' : ''}</div>
  ${quick ? attQuick(q, centre, grp, d) + attWho(centre) + attCheckTop(centre, grp, d) : `${attWho(centre)}
  ${attCheckTop(centre, grp, d)}
  <div class="card filters fold${UI.fopen ? ' open' : ''}" style="grid-template-columns:2fr 1fr${centre === 'Minsundu' ? '' : centre === 'Nkwazi' ? ' 1fr 1fr' : ' 1fr'}">
    <label class="f">Find a name<input class="in" id="attsearch" placeholder="Name, nickname or ID" value="${esc(UI.attq || '')}"></label>${filtBtn()}
    ${centre !== 'Minsundu' ? nkzFilters(q) : ''}
    <label class="f">Show<select class="in" data-filter="only">${opt([{ v: 'unmarked', l: 'Not marked yet' }].concat(attMarks(centre, grp).map(k => ({ v: k, l: ATT_L[k] }))), only, 'Everyone')}</select></label>
  </div>
  <div class="card" style="padding:6px 8px">
    <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:6px 4px"><button class="btn sm" data-act="xl" data-k="${month ? 'attmonth' : 'attday'}">Export in Excel</button>${month ? `<span class="sub" style="align-self:center">${esc(fmtMonth(d.slice(0, 7)))} · tap a box to mark or change</span>` : `<button class="btn sm" data-act="allpresent" data-d="${d}" data-g="${grp}" data-c="${centre}">Mark everyone not marked as present</button>`}</div>
    <div id="attTable">${month ? attMonthTable(q) : attTable(q)}</div>
  </div>`}
  ${attCheckList(centre)}
  <p class="sub" style="margin:0">No longer comes? Open the profile, close the file.</p>`;
}

function vOutreach(r) {
  const m = r.q.get('m') || thisMonth(); const { a, b } = monthCtx(m);
  const ss = S.outreach.filter(s => inRange(s.date, a, b)).sort((x, y) => y.date.localeCompare(x.date));
  const luigi = S.children.filter(c => c.section === 'Luigi' && c.status !== 'Closed').sort((x, y) => fullName(x).localeCompare(fullName(y)));
  return `<div class="top"><div><h1>Street outreach and drop-in · Luigi</h1><p class="lead">${ss.length} sessions in ${esc(fmtMonth(m))}.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${monthPicker(m)}<button class="btn" data-act="xl" data-k="outreach">Export in Excel</button></div></div>
  <div class="grid g2" style="align-items:start">
    <form class="card" data-form="outreach" style="display:flex;flex-direction:column;gap:12px"><h2>Record a session</h2>
      <div class="fs two">${field('Date', 'date', today(), 'date', { req: true })}${field('Session', 'type', '', 'select', { options: opt(OUTREACH_TYPES) })}${field('Staff', 'staff', USER.name, 'text', { wide: true })}</div>
      <div class="f"><span>Children met (known to Luigi)</span>${luigi.length ? `<div class="checks" style="max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:6px;padding:8px">${luigi.map(c => `<label style="width:46%"><input type="checkbox" name="children" value="${esc(c.id)}">${esc(fullName(c))}${c.nickname ? ' "' + esc(c.nickname) + '"' : ''}</label>`).join('')}</div>` : '<span class="sub" style="font-weight:400">No Luigi children yet: add new ones below.</span>'}</div>
      <div class="f"><span>New face? Check first if the child is already known</span><input class="in" id="knownq" data-ctx="luigi" placeholder="Name or nickname" autocomplete="off"><div id="knownbox"></div></div>
      <div class="f"><span>New children met for the first time</span><span class="sub" style="font-weight:400">One per line: name, nickname, sex (M/F), age, compound. Example: Joseph Banda, Shorty, M, 13, Chipulukusu</span><textarea class="in" name="newKids" rows="3"></textarea></div>
      ${field('Notes', 'notes', '', 'textarea', { rows: 2 })}
      <button class="btn pri">Save session</button></form>
    <section class="card"><h2>Sessions this month</h2>${ss.length ? ss.map(s => `<div class="it"><div class="w"><b>${esc(fmtDate(s.date))} · ${esc(s.type)}</b><span>${(s.children || []).length} children · ${esc(s.staff || '')}${s.notes ? ' · ' + esc(s.notes.slice(0, 80)) : ''}</span></div></div>`).join('') : '<p class="empty">No sessions recorded this month.</p>'}</section>
  </div>`;
}

function reportTable(def, m) {
  if (!def.rows) return '';
  const rows = def.rows(m);
  return `<div class="tw"><table id="rtable" class="rstack"><thead><tr><th>Code</th><th>Indicator</th>${def.cols.map(c => `<th class="n">${esc(c)}</th>`).join('')}<th class="nx"></th></tr></thead><tbody>
  ${rows.map((r, i) => `<tr><td class="sub rcode">${esc(r[0])}</td><td class="rind">${esc(r[1])}</td>${r[2].map((v, j) => `<td class="n" data-l="${esc(def.cols[j] || '')}">${v == null ? '' : esc(v)}</td>`).join('')}<td class="nx">${r[3] && r[3].length ? `<button class="btn link sub" data-act="names" data-i="${i}">Names</button>` : ''}</td></tr><tr class="hide" id="names${i}"><td></td><td colspan="${def.cols.length + 2}" class="sub">${r[3] ? r[3].map(c => esc(fullName(c)) + ' (' + esc(c.id) + ')').join(', ') : ''}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function repSecSeg(k) { return `<div class="seg segg" style="align-self:flex-start">${REPORT_KEYS.map(x => `<a href="#" data-q="s=${x}" class="${x === k ? 'on' : ''}">${esc(REPORTS[x].short || REPORTS[x].label)}</a>`).join('')}<a href="#" data-q="s=${HISTORY_TAB}">2026 from the reports</a></div>`; }
function vReports(r) {
  const m = r.q.get('m') || addMonths(thisMonth(), 0);
  const k = r.q.get('s') || defReport();
  if (k === HISTORY_TAB) return vHistory(r);
  /* Counselling: its weekly, monthly and quarterly reports live here only (comment of 24/11: no copy in the Counselling page) */
  if (k === 'Counseling') { const cv = r.q.get('cv') || 'month'; return cv === 'week' ? counselWeek(r) : counselPeriod(r, cv === 'quarter' ? 'quarter' : 'month'); }
  const def = REPORTS[k];
  const st = (S.reports[m] || {})[k] || {};
  const p = k === 'Table6' ? 'M' : (r.q.get('p') || 'M'), rg = periodRange(m, p);
  const canAba = k === 'Family' || k === 'School', aba = canAba && r.q.get('aba') === '1';
  let body;
  if (k === 'Luigi') body = luigiReportHtml(rg.a, rg.b, rg.label);
  else if (k === 'Table6') {
    const t = table6(m);
    body = `<div class="tw"><table id="rtable"><thead><tr><th rowspan="2">Age group</th>${['Brought forward', 'New placements', 'Total handled', 'Closed: to relatives', 'Closed: foster or other', 'Remaining'].map(h => `<th colspan="2" class="n">${h}</th>`).join('')}</tr><tr>${'<th class="n">M</th><th class="n">F</th>'.repeat(6)}</tr></thead><tbody>${t.rows.map(rw => `<tr>${rw.map((v, i) => `<td class="${i ? 'n' : ''}">${i ? v : `<b>${esc(v)}</b>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="sub">${esc(t.q.label)}, Minsundu residents (UCC and Youth). Ages are today's ages.</p>`;
  } else body = abaScope(aba, () => reportTable(def, p === 'M' ? m : rg.a.slice(0, 7) + '~' + rg.b.slice(0, 7)));
  return `<div class="top"><div><h1>Reports</h1><p class="lead">Choose the section and the month.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${k === 'Table6' ? '' : periodSeg(p)}${monthPicker(m)}</div></div>
  ${repSecSeg(k)}
  ${!def.quarterly && p === 'M' && !aba && repState(m, k).state === 'back' ? repCard(k, m) : ''}
  <section class="card">
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">
      <div><h2>${esc(def.label)}${aba ? ' · ABA children only' : ''} · ${esc(def.quarterly ? quarterOf(m).label : rg.label)}</h2>${canAba ? `<div class="seg" role="group" aria-label="All children or ABA" style="margin:8px 0 2px"><a href="#" data-q="aba=" class="${aba ? '' : 'on'}">All children</a><a href="#" data-q="aba=1" class="${aba ? 'on' : ''}">ABA only (distance adoption) · ${S.children.filter(c => isAba(c) && c.status !== 'Closed').length}</a></div>` : ''}<p class="sub" style="margin:4px 0 0">${def.note ? esc(def.note) + ' ' : ''}</p></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="repbtns"><a class="btn sm" href="#/story">Interactive report</a><button class="btn sm pri" data-act="wordreport" data-title="${esc(def.label)}" data-period="${esc(def.quarterly ? quarterOf(m).label : rg.label)}" data-name="${esc(k + (aba ? '-ABA' : '') + '-report-' + (p === 'M' ? m : rg.a.slice(0, 7) + '-to-' + rg.b.slice(0, 7)))}">Download the report in Word</button><button class="btn sm" data-act="copytable">Copy table</button>${k === 'Luigi' ? '<button class="btn sm" data-lact="xlreport">Export in Excel</button><button class="btn sm" data-lact="xlreportn">Export in Excel with names</button>' : `<button class="btn sm" data-act="csvtable" data-name="${esc(k + (aba ? '-ABA' : '') + '-' + (p === 'M' ? m : rg.a.slice(0, 7) + '-to-' + rg.b.slice(0, 7)))}">Export in Excel</button>${def.rows ? '<button class="btn sm" data-act="xlnames">Export in Excel with names</button>' : ''}`}${canAba ? `<button class="btn sm" data-mact="abasheet" data-y="${m.slice(0, 4)}">Export in Excel: scheda ABA ${m.slice(0, 4)} (italiano)</button>` : ''}<button class="btn sm" data-act="print">Print</button></div>
    </div>
    <div style="margin-top:12px">${body}</div>
    ${k === 'School' && !aba && p === 'M' ? schoolReportLists(m) : ''}
  </section>
  ${!def.quarterly && !aba && typeof grpReportHtml === 'function' ? grpReportHtml(k, rg.a, rg.b) : ''}
  ${historyForMonth(k, m).map(h => `<section class="card"><h2>What the section reported · ${esc(h.label)}</h2><p class="sub" style="margin:4px 0 10px">Copied from ${esc(h.source)}, as written.${h.note ? ' Note: ' + esc(h.note) : ''}</p>${historyTableHtml(h)}</section>`).join('')}
  ${def.quarterly || p !== 'M' || aba || repState(m, k).state === 'back' ? '' : repCard(k, m)}`;
}

function vHistory(r) {
  const sec = r.q.get('h') || 'Luigi';
  const M = historyMatrix(sec);
  const secs = REPORT_KEYS.filter(k => historyFor(k).length);
  const tabs = `<div class="seg segg" style="align-self:flex-start">${REPORT_KEYS.map(x => `<a href="#" data-q="s=${x}">${esc(REPORTS[x].short || REPORTS[x].label)}</a>`).join('')}<a href="#" class="on">2026 from the reports</a></div>`;
  if (!S.history.length) return `<div class="top"><div><h1>Reports</h1></div></div>${tabs}<div class="card"><h2>No report figures loaded</h2><p>Load the starter pack (Staff, then Data) to see the figures of the 2026 section reports month by month.</p></div>`;
  return `<div class="top"><div><h1>2026 from the section reports</h1><p class="lead">Copied from the Word reports of the sections.</p></div><button class="btn" data-act="xl" data-k="history">Export in Excel: all report figures</button></div>
  ${tabs}
  <div class="seg" style="align-self:flex-start">${secs.map(x => `<a href="#" data-q="h=${x}" class="${x === sec ? 'on' : ''}">${esc(REPORTS[x].short || REPORTS[x].label)}</a>`).join('')}</div>
  ${M ? `<section class="card"><h2>${esc(REPORTS[sec].label)}</h2><p class="sub" style="margin:4px 0 10px">Each cell shows the last column of the section's table (total${sec === 'Table6' ? '; for Table 6.0: remaining at the end of the quarter' : ''}). Point at a number to see the full breakdown. Empty: the indicator is not in that report.</p>
    <div class="tw"><table><thead><tr><th>Indicator</th>${M.recs.map(h => `<th class="n">${esc(h.label)}</th>`).join('')}</tr></thead><tbody>
    ${M.labels.map(l => `<tr><td>${esc(l)}</td>${M.recs.map(h => { const c = M.cell(h, l); return `<td class="n" title="${c ? esc(c.all) : ''}">${c && c.main != null ? esc(c.main) : ''}</td>`; }).join('')}</tr>`).join('')}
    </tbody></table></div></section>
    <section class="card soft"><h2>Sources and notes</h2>${M.recs.map(h => `<div class="it"><div class="w"><b>${esc(h.label)} · ${esc(h.source)}</b><span>${esc(h.note || 'No remarks.')}</span></div></div>`).join('')}</section>` : ''}
  ${S.historyMissing && S.historyMissing.length ? `<section class="card"><h2>Reports not found in the files</h2><ul style="margin:8px 0 0;padding-left:18px;line-height:1.6">${S.historyMissing.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}`;
}

function vStaff(r) {
  if (!canAdminPage()) return `<h1>Admin</h1><p>Only the Education office and the site admins see this page.</p>`;
  if (r.id === 'data') return isSite() ? vData() : `<h1>Data</h1><p>Only the site admins see this page.</p>`;
  return `<div class="top"><div><h1>Admin</h1><p class="lead">Who works where.</p></div>${isSite() ? '<a class="btn" href="#/staff/data">Data: import, backup, export</a>' : ''}</div>
  <section class="card" style="padding:6px 8px">${staffTable()}</section>
  <p class="sub" style="margin:0">Tick the areas where each person works.</p>
  <div class="grid g2" style="align-items:start">
    <form class="card" data-form="staffadd"><h2>Add a staff member</h2><div class="fs two" style="margin-top:10px">${field('Name', 'name', '', 'text', { req: true })}${field('Role', 'role', '', 'text')}<label class="f wide"><span>Areas of work</span>${checks('areas', STAFF_FLAGS.map(x => x[0]), [])}</label></div><button class="btn pri" style="margin-top:12px">Add</button></form>
    <form class="card" data-form="handover"><h2>Hand over children</h2><p class="sub"></p>
      <div class="fs two">${field('From', 'from', '', 'select', { options: opt(S.staff.map(s => ({ v: s.id, l: s.name + ' (' + S.children.filter(c => c.responsible === s.id && c.status !== 'Closed').length + ')' })), '', '') })}${field('To', 'to', '', 'select', { options: opt(activeStaff().map(s => ({ v: s.id, l: s.name })), '', '') })}</div><button class="btn pri" style="margin-top:12px">Move the children</button></form>
  </div>
  ${fbAdminCard()}
  ${IS_DEMO || !isSite() ? '' : `<form class="card" data-form="pin"><h2>PIN for the staff</h2><p class="sub">One PIN for all staff. Guest does not need it.</p>
    <div class="fs">${field('New PIN (4 to 8 digits)', 'pin', '', 'text', { attrs: ' inputmode="numeric" pattern="[0-9]{4,8}" autocomplete="off"', req: true })}</div><button class="btn" style="margin-top:12px">Change the PIN</button></form>`}
  <form class="card" data-form="settings"><h2>Home visit frequency</h2><p class="sub">Days between two home visits.</p>
    <div class="fs">${field('Residents', 'Resident', S.settings.interval.Resident, 'number')}${field('Non-residents', 'Non-resident', S.settings.interval['Non-resident'], 'number')}${field('Reintegrated, in follow-up', 'Follow-up', S.settings.interval['Follow-up'], 'number')}</div><button class="btn" style="margin-top:12px">Save</button></form>
  <section class="card"><h2>Targets of the month</h2><p class="sub">${esc(fmtMonth(thisMonth()))}. They show in Home, "Plans and progress".</p>
    ${[['homeVisits', 'Home visits, Family Section'], ['schoolVisits', 'School visits, School Section']].map(([k, l]) => `<form data-form="target" style="display:flex;gap:8px;align-items:flex-end;margin-top:10px;flex-wrap:wrap"><input type="hidden" name="m" value="${thisMonth()}"><input type="hidden" name="k" value="${k}"><label class="f" style="flex:1 1 220px"><span>${l}</span><input class="in" type="number" min="0" inputmode="numeric" name="v" value="${(S.settings.targets[thisMonth()] || {})[k] || ''}"></label><button class="btn">Set the target</button></form>`).join('')}</section>
  <form class="card" data-form="absence"><h2>Absences</h2><p class="sub">First number: alert. Second number: review the status of the child.</p>
    <div class="fs">${field('Alert after this many days absent in a row', 'alert', absSet().alert, 'number', { attrs: ' min="1"' })}${field('Review the status after this many days without coming', 'review', absSet().review, 'number', { attrs: ' min="2"' })}</div><button class="btn" style="margin-top:12px">Save</button></form>`;
}
function vData() {
  return `<div class="top"><div><h1>Data</h1><p class="lead">Import, backup and export.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn pri" href="#/sync">Shared database</a><a class="btn" href="#/staff">Back to staff</a></div></div>
  <div class="grid g2" style="align-items:start">
    ${IS_DEMO ? `<section class="card" style="grid-column:1/-1;border:2px solid var(--orange)"><h2>Demo version</h2><p class="sub">Loading real data is turned off here: this file is for trying the app with invented children. The real version is a separate file.</p><button class="btn" style="margin-top:10px" data-act="resetdemo">Start the demo again</button></section>` : ''}
    <section class="card${IS_DEMO ? ' hide' : ''}" style="grid-column:1/-1;border:2px solid var(--pri)"><h2>First start: load the starter pack</h2><p class="sub">One file with what was collected before the app. Minsundu: the 179 children of the Minsundu tool, same IDs. Luigi: the children with photos and the 2026 day and night attendance; their IDs get an L in front. Nkwazi: the children of the October 2026 register and of the Data Tool; their IDs get an N in front. A child already in another tool keeps one file. Also the figures of the 2026 section reports. Loading it twice does not create duplicates.${S.meta.starterPack ? ' Loaded already: pack of ' + esc(fmtDate(S.meta.starterPack)) + ', version ' + (S.meta.starterPackVersion || 1) + ' (' + S.history.length + ' report tables).' : ''}</p>
      <input type="file" accept=".json,application/json" id="starterfile" class="in" style="margin-top:10px" aria-label="Starter pack file"><div id="startermsg" style="margin-top:10px"></div></section>
    <section class="card${IS_DEMO ? ' hide' : ''}"><h2>Import from the Minsundu tool</h2><p class="sub">In Riccardo's tool, export the children to CSV (users_export.csv), then choose the file here. IDs stay the same (5000 and up). Running it again adds new children and fills empty fields; it never overwrites what was recorded here.</p>
      <input type="file" accept=".csv,text/csv" id="importfile" class="in" style="margin-top:10px" aria-label="File to import"><div id="importmsg" style="margin-top:10px"></div></section>
    <section class="card${IS_DEMO ? ' hide' : ''}"><h2>Import a Luigi list (Excel)</h2><p class="sub">The monthly Luigi statistics file with the list of names (NAME, SEX, AGE, PLACE). Children already in the records under the same name and a similar age are not created twice: they are linked. The month is read from the title ("Luigi statistics for ..."). Use the most recent list.</p>
      <input type="file" accept=".xlsx" id="luigifile" class="in" style="margin-top:10px" aria-label="Luigi list file"><div id="luigimsg" style="margin-top:10px"></div></section>
    <section class="card" style="grid-column:1/-1"><h2>Add photos from files</h2><p class="sub">Choose the pictures. The file name must be the name of the child. Check, then save.</p>
      <input type="file" accept="image/*" multiple id="photosfile" class="in" style="margin-top:10px" aria-label="Photos file"><div id="photosmsg" style="margin-top:10px"></div></section>
    <section class="card"><h2>Backup</h2><p class="sub">Download a full copy of the data. Keep it on a USB key or Google Drive (not shared publicly: it contains children's personal data). ${S.meta.lastBackup ? 'Last backup: ' + esc(fmtDate(S.meta.lastBackup)) + '.' : 'No backup made yet.'}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn pri" data-act="backup">Download backup</button><label class="btn">Restore a backup<input type="file" accept=".json,application/json" id="restorefile" class="hide"></label></div></section>
    <section class="card"><h2>Export in Excel</h2><p class="sub">Everything in one Excel file (one sheet per table), or one table at a time. Every list in the app has its own "Export in Excel" button: it exports what is on the screen, with the filters you chose.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn pri" data-act="export" data-k="all">Everything</button>${['children', 'visits', 'events', 'moves', 'sessions', 'outreach', 'attendance'].map(k => `<button class="btn" data-act="export" data-k="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div></section>
    <section class="card"><h2>Start again</h2><p class="sub">Deletes all data on this ${isPhone() ? 'phone' : 'computer'}. Make a backup first.</p><button class="btn danger" style="margin-top:10px" data-act="wipe">Delete all data on this ${isPhone() ? 'phone' : 'computer'}</button></section>
  </div>`;
}

function vHelp() {
  const li = a => a.map(x => `<li>${x}</li>`).join('');
  return `<div class="top"><div><h1>How it works</h1><p class="lead">CYP EDU ${VERSION}</p></div></div>
  ${centreGuide(true)}
  ${secExplain()}
  <section class="card"><h2>Tasks</h2><p style="margin:8px 0 0">A task is given to a person, to several people or to a team. It shows in their Home until one of them taps Done. The person who gave it and the Education admins see who did it and when.</p></section>
  <section class="card"><h2>Who sees what</h2><ul style="margin:10px 0 0;padding-left:18px;line-height:1.6"><li><b>Health, disabilities and notes of a child:</b> the staff of the child's centre, the person who follows the child, the counsellors, the Education admins.</li><li><b>Child protection concerns and what is said in counselling:</b> the person who wrote it, the person who follows the child, the head of the child's centre, the counsellors, the Education admins.</li><li>Everyone else sees "${HIDDEN_TXT}".</li><li>An Education admin can tick "Confidential" in Admin for a person who needs to see more.</li><li><b>Access:</b> site admins change the app (staff, PIN, data, shared database); the Education office sees everything, validates the visits and checks the reports; the Administration sees everything and follows tasks and people; the staff of Sports see a shorter file of the child.</li></ul></section>
  <section class="card"><h2>Where the records are kept</h2><ul style="margin:10px 0 0;padding-left:18px;line-height:1.6"><li>On this phone or computer, so the app works without internet.</li><li>In the shared database, in the Google account of the project, so every phone shows the same records.</li><li>When the lock is on (More, Shared database), the records are locked on the phone before they are sent. Google keeps them and cannot read them. Only a phone opened with the staff link can read them.</li><li>Do not forward the staff link. If a phone is lost, tell the Education office the same day.</li></ul></section>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>Every day</h2><ol style="margin:10px 0 0;padding-left:18px;line-height:1.6">${li([
      'Open the app and tap your name. Staff names ask for the staff PIN.',
      'Start from Home, in the box of your centre or section.',
      'Record what you did: attendance, a visit, a session, something that happened.',
      'To do shows what is still open.',
      'On a phone the menu is at the bottom: Home, Attendance, Monitoring, Children, More.'])}</ol></section>
    <section class="card"><h2>Without internet</h2><ul style="margin:10px 0 0;padding-left:18px;line-height:1.6">${li([
      'The app opens and saves without internet.',
      'When internet is back, what you recorded is sent by itself and what the others recorded arrives.',
      'Photos and documents wait on the device until they are sent.',
      'Text half written stays on the device until you save it.'])}</ul></section>
    <section class="card"><h2>Visits</h2><ul style="margin:10px 0 0;padding-left:18px;line-height:1.6">${li([
      'Each section plans and records its own visits. Home visits to Minsundu and Nkwazi children are made by the Family Section.',
      'The Education office opens the report of each visit and validates it, or sends it back.',
      'A visit sent back: open it, add what is missing, send it again.',
      'The reports count the validated visits.',
      'Before it is validated you can change it: open its report, Change the report.',
      'A visit recorded by mistake: open its report, Cancel this visit.'])}</ul></section>
    <section class="card"><h2>The file of the child</h2><ul style="margin:10px 0 0;padding-left:18px;line-height:1.6">${li([
      'One file per child, with the same ID at Luigi, Minsundu and Nkwazi.',
      'In the file: path between the centres, school and term results, monthly reports, documents, referrals, history.',
      'A file is closed and reopened, never deleted.',
      'A line written by mistake: Cancel, next to the line in the history.',
      'Guest (first name on the opening screen): names, photos and personal details are hidden and nothing can be changed.'])}</ul></section>
    <section class="card"><h2>Reports</h2><ul style="margin:10px 0 0;padding-left:18px;line-height:1.6">${li([
      'The monthly table of each section is counted from what is recorded.',
      'Copy it into the Word report, or download it for Excel.',
      'Not in the app yet: clinic and kitchen data.'])}</ul></section>
    <section class="card soft"${IS_DEMO ? ' style="border:2px solid var(--orange)"' : ''}><h2>Tell us</h2><ul style="margin:10px 0 0;padding-left:18px;line-height:1.6">${li([
      'Comment button, on every page: write what is wrong or missing on that page.',
      'What do you record today that you cannot record here?',
      'What takes longer here than on paper?'])}</ul></section>
  </div>`;
}

/* ---------- files to review for closure ---------- */
const RX_STRONG = /(opted to get married|(he|has|is now) (got )?married|a married man|does ?n'?t come to the cent|doesnt come to the cent|no longer (comes|attends|coming)|discharge lett|is a teacher|working as a|currently working|currentyly working|ran away from the cent)/i;
const RX_MEDIUM = /(left the cent|done with school|completed (his )?(grade ?12|school)|stop+ed (school|attending|going|coming))/i;
function reviewSignals(c) {
  if (!(isCurrent(c))) return { score: 0, why: [], strong: false };
  if (c.reviewKeep) return { score: 0, why: [], strong: false };
  const why = []; let score = 0, strong = false;
  const txt = [c.notes, c.objectives].join(' ');
  const ms = txt.match(RX_STRONG), mm = txt.match(RX_MEDIUM);
  if (ms) { strong = true; score += 3; why.push('Notes say: "' + snippet(txt, ms.index) + '"'); }
  else if (mm) { score += 2; why.push('Notes say: "' + snippet(txt, mm.index) + '"'); }
  if (c.entryDate && c.entryDate < '2020-01-01') { score += 1; why.push('In the programme since ' + c.entryDate.slice(0, 4)); }
  const age = curAge(c); if (age !== '' && age >= 21) { score += 1; why.push('Age ' + age); }
  if (c.section === 'UCC' || c.section === 'Youth') {
    const days = Object.keys(S.attendance).filter(d => daysBetween(d, today()) <= 30 && daysBetween(d, today()) >= 0 && Object.keys(S.attendance[d]).some(id => { const k = child(id); return k && k.residence === c.residence; }));
    if (days.length >= 5 && !days.some(d => ['P', 'H', 'B'].includes(S.attendance[d][c.id]))) { score += 2; why.push('Not present on any of the ' + days.length + ' attendance days recorded in the last 30 days'); }
  }
  const recent = S.visits.some(v => String(v.childId) === String(c.id) && daysBetween(v.date, today()) < 180) || Object.entries(S.attendance).some(([d, o]) => o[c.id] === 'P' && daysBetween(d, today()) < 60);
  if (recent) return { score: 0, why: [], strong: false };
  if (!strong && score < 2) return { score: 0, why, strong };
  return { score, why, strong };
}
function snippet(s, i) { const a = Math.max(0, i - 40), b = Math.min(s.length, i + 70); return (a ? '…' : '') + s.slice(a, b).trim().toLowerCase() + (b < s.length ? '…' : ''); }
function vReview() {
  const list = S.children.map(c => ({ c, s: reviewSignals(c) })).filter(x => x.s.score > 0).sort((a, b) => b.s.score - a.s.score || (a.c.entryDate || '').localeCompare(b.c.entryDate || ''));
  const actR = S.children.filter(c => isCurrent(c) && (c.section === 'UCC' || c.section === 'Youth') && c.residence === 'Resident').length;
  const actN = S.children.filter(c => isCurrent(c) && (c.section === 'UCC' || c.section === 'Youth') && !sleepsHere(c)).length;
  return `<div class="top"><div><h1>Files to review</h1><p class="lead">Open files of children and youth who probably left, but whose file was never closed. The Minsundu tool had no way to close a file.</p></div><button class="btn" data-act="xl" data-k="review">Export in Excel</button></div>
  <div class="note">Minsundu, open files now: <b>${actR} residents and ${actN} non-residents</b>. The Q3 2026 report counted 46 residents and 56 non-residents. The difference is mostly files that should be closed.</div>
  ${list.length ? `<form class="card" data-form="bulkclose" style="padding:6px 8px">
    <div class="tw"><table><thead><tr><th><input type="checkbox" data-act="checkall" aria-label="Select all"></th><th>Child</th><th>Centre</th><th>Residence</th><th>Why it is listed</th><th></th></tr></thead><tbody>
    ${list.map(x => `<tr><td><input type="checkbox" name="ids" value="${esc(x.c.id)}"${x.s.strong ? ' checked' : ''}></td><td>${childLink(x.c)}<div class="sub">ID ${esc(x.c.id)}${curAge(x.c) !== '' ? ' · ' + esc(curAge(x.c)) + ' years' : ''}</div></td><td>${secChip(x.c.section)}</td><td>${esc(x.c.residence || '')}</td><td>${x.s.why.map(w => `<div>${esc(w)}</div>`).join('')}</td><td><button type="button" class="btn sm" data-act="keepopen" data-id="${esc(x.c.id)}" title="Still in the programme: remove from this list">Still active</button></td></tr>`).join('')}
    </tbody></table></div>
    <div class="fs" style="grid-template-columns:1fr 1fr 2fr;padding:14px 10px 6px">${field('Reason', 'reason', '', 'select', { options: opt(CLOSE_REASONS.map(v => ({ v, l: reasonLabel(v) })), 'Left the programme, no longer comes') })}${field('Closing date', 'date', today(), 'date', { req: true })}${field('Note', 'note', 'Closed during the review of old records: left the programme before this app was used.')}</div>
    <div style="padding:6px 10px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn pri">Close the selected files</button><span class="sub">Ticked already: the files where the notes say clearly that the youth left. Check the others with the section before ticking them. A closed file can be reopened at any time.</span></div>
  </form>` : '<div class="ok">No open file looks inactive.</div>'}`;
}

/* ---------- Excel exports of the current view ---------- */
const XL = {
  monthly() { const q = route().q, m = /^\d{4}-\d{2}$/.test(q.get('m') || '') ? q.get('m') : (monthDue() || thisMonth()); downloadXlsx('monthly-reports-' + m, [{ name: m, rows: colsToRows(monthlyKids(q).map(c => ({ c, r: monthlyOf(c, m) || {} })), MONTHLY_COLS), filter: true }]); },
  school() { const q = route().q, x = termSel(q); downloadXlsx('pupils-by-school-' + x.y + '-term' + x.t, [{ name: 'Pupils', rows: colsToRows(schoolRows(q).sort((a, b) => a.school.localeCompare(b.school) || fullName(a.c).localeCompare(fullName(b.c))), SCHOOL_COLS), filter: true }]); },
  referrals() { const L = S.events.filter(e => e.type === 'Referral' && child(e.childId)); downloadXlsx('referrals', [{ name: 'Referrals', rows: colsToRows(L, [{ key: 'date', label: 'Date' }, { key: 'childId', label: 'Child ID' }, { label: 'Child', get: e => fullName(child(e.childId)) }, { label: 'From', get: e => referLabel(e.from) }, { label: 'To', get: e => referLabel(e.to) }, { key: 'reason', label: 'Why' }, { key: 'note', label: 'Note' }, { label: 'By', get: e => staffName(e.by) }, { label: 'Done on', get: e => (referClosed(e.id) || {}).date || '' }, { label: 'What was done', get: e => (referClosed(e.id) || {}).note || '' }]), filter: true }]); },
  visits() { const q = route().q, per = q.get('vper') || '', m = q.get('m') || thisMonth(); downloadXlsx('visits-' + (per === 'year' ? String(m).slice(0, 4) : per === 'all' ? 'all-years' : m), [{ name: 'Visits', rows: colsToRows(filteredVisits(q), VISIT_COLS.concat(VISIT_COLS_SCHOOL)), filter: true }]); },
  attday() { const q = route().q, d = q.get('d') || today(), day = S.attendance[d] || {}; const L = ATT_L; downloadXlsx('attendance-' + d, [{ name: d, rows: colsToRows(attKids(q), [{ key: 'id', label: 'ID' }, { label: 'Name', get: c => fullName(c) }, { key: 'nickname', label: 'Nickname' }, { label: 'Section', get: c => SECTIONS[c.section].label }, { key: 'residence', label: 'Residence' }, { label: 'Sleeps', get: c => sleepsText(c) }, { label: d, get: c => L[day[attKey(c, q.get('c') || defCentre())]] || '' }]) }]); },
  paths() { const q = route().q, x = pathSel(q), rows = pathRows(q), PC = x.sec === 'Minsundu' ? PATH_COLS.slice(0, 4).concat(PATH_COLS_M, PATH_COLS.slice(4)) : PATH_COLS; downloadXlsx('register-' + x.sec + '-' + x.y, [{ name: 'Register', rows: [PC.map(c => c.label)].concat(rows.map((r, i) => PC.map(c => c.get(r, i)))) }]); },
  attmonth() {
    const q = route().q, d = q.get('d') || today(), m = d.slice(0, 7), n = Number(monthEnd(m).slice(8));
    const q2 = new URLSearchParams(q.toString()); q2.delete('only');
    const kids = attKids(q2, true); const days = []; for (let i = 1; i <= n; i++) days.push(m + '-' + String(i).padStart(2, '0'));
    const rows = [['ID', 'Name', 'Section', 'Residence'].concat(days.map(x => Number(x.slice(8)))).concat(['Present', 'Home', 'Boarding school', 'Street', 'Absent', 'Sick', 'Permission'])];
    for (const c of kids) { const v = days.map(x => (S.attendance[x] || {})[attKey(c, q.get('c') || defCentre())] || ''); rows.push([c.id, fullName(c), SECTIONS[c.section].label, c.residence].concat(v).concat(['P', 'H', 'B', 'T', 'A', 'S', 'E'].map(k => v.filter(x => x === k).length))); }
    downloadXlsx('attendance-register-' + m, [{ name: fmtMonth(m), rows }]);
  },
  outreach() { const m = route().q.get('m') || thisMonth(), { a, b } = monthCtx(m); const name = x => { const c = child(x); return c ? fullName(c) : ''; }; downloadXlsx('outreach-' + m, [{ name: 'Sessions', rows: colsToRows(S.outreach.filter(s => inRange(s.date, a, b)), [{ key: 'date', label: 'Date' }, { key: 'type', label: 'Session' }, { key: 'staff', label: 'Staff' }, { label: 'Children', get: v => (v.children || []).length }, { label: 'Names', get: v => (v.children || []).map(name).join('; ') }, { key: 'notes', label: 'Notes' }]) }]); },
  sessions() { const m = route().q.get('m') || thisMonth(), { a, b } = monthCtx(m); const name = x => { const c = child(x); return c ? fullName(c) : ''; }; downloadXlsx('counseling-' + m, [{ name: 'Sessions', rows: colsToRows(S.sessions.filter(s => inRange(s.date, a, b)), [{ key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'centre', label: 'Centre' }, { label: 'Child', get: v => (v.children || []).map(name).join('; ') }, { key: 'others', label: 'Other participants' }, { label: 'Topic or issues', get: v => sessSees(v) ? v.topic || '' : 'Hidden' }, { label: 'Strengths', get: v => sessSees(v) ? v.strengths || '' : '' }, { label: 'Summary', get: v => sessSees(v) ? v.summary || '' : '' }, { label: 'Conclusion and way forward', get: v => sessSees(v) ? v.conclusion || '' : '' }, { label: 'Counsellor', get: v => staffName(v.by) }, { label: 'Co-counsellor', get: v => v.co ? staffName(v.co) : '' }, { key: 'referred', label: 'Referred' }, { key: 'budget', label: 'Budget used (ZMW)' }, { key: 'action', label: 'Action' }]) }]); },
  pending() {
    const P = pendingData();
    const base = c => [c.id, fullName(c), (SECTIONS[c.section] || {}).label || '', c.residence || '', STATUS_LABEL[c.status], c.compound || c.familyAddress || '', staffName(c.responsible)];
    const H = ['ID', 'Name', 'Section', 'Residence', 'Status', 'Compound', 'Followed by'];
    const sheets = [
      { name: 'Home visits due', rows: [H.concat(['Last home visit', 'Due', 'Days late'])].concat(P.due.concat(P.never).map(x => base(x.c).concat([x.vi.last, x.vi.due, x.vi.never ? 'no visit recorded' : x.vi.late]))) },
      { name: 'Missing', rows: [H.concat(['Absent since', 'Days in a row'])].concat(P.missing.map(x => base(x.c).concat([x.since, x.run]))) },
      { name: 'Actions open', rows: [['Date', 'Action', 'Child', 'From', 'By']].concat(P.actions.map(x => { const c = child(x.item.childId) || (x.item.children && child(x.item.children[0])); return [x.item.date, x.item.action, c ? fullName(c) : '', x.kind === 'visit' ? x.item.purpose : 'Counseling', staffName(x.item.by)]; })) },
      { name: 'Records to complete', rows: [H.concat(['Missing'])].concat(S.children.filter(c => c.status !== 'Closed' && issuesOf(c).length).map(c => base(c).concat([issuesOf(c).map(k => ISSUES[k]).join('; ')]))) }
    ];
    downloadXlsx('pending-' + today(), sheets);
  },
  history() {
    const long = [['Section', 'Period', 'Code', 'Indicator', 'Breakdown', 'Value', 'Source', 'Note']];
    for (const h of S.history.slice().sort((a, b) => a.section.localeCompare(b.section) || periodSort(a.period).localeCompare(periodSort(b.period)))) for (const r of h.rows) h.cols.forEach((c, i) => { const v = r[2 + i]; if (v != null && v !== '') long.push([REPORTS[h.section] ? REPORTS[h.section].label : h.section, h.label, r[0], r[1], c, v, h.source, h.note || '']); });
    const sheets = [{ name: 'All report figures', rows: long }];
    for (const k of REPORT_KEYS) { const M = historyMatrix(k); if (!M) continue; sheets.push({ name: REPORTS[k].short || REPORTS[k].label, rows: [['Indicator'].concat(M.recs.map(h => h.label))].concat(M.labels.map(l => [l].concat(M.recs.map(h => { const c = M.cell(h, l); return c && c.main != null ? c.main : ''; })))) }); }
    downloadXlsx('cicetekelo-2026-report-figures', sheets);
  },
  review() { downloadXlsx('files-to-review-' + today(), [{ name: 'Files to review', rows: [['ID', 'Name', 'Section', 'Residence', 'Age', 'Date of entry', 'Why it is listed']].concat(S.children.map(c => ({ c, s: reviewSignals(c) })).filter(x => x.s.score > 0).map(x => [x.c.id, fullName(x.c), SECTIONS[x.c.section].label, x.c.residence, curAge(x.c), x.c.entryDate, x.s.why.join('; ')])) }]); }
};

/* ---------- render ---------- */
function render() { _SI = null; UI.staleView = false; document.body.classList.toggle('guest', !!GUEST); dropCancelled();
  const app = $('#app');
  if (!USER) { app.innerHTML = vLogin(); linkKeep(true); return; }
  const r = route();
  if (r.path !== 'attendance') UI.qJust = null; /* the names kept in the quick list are let go when the page is left */
  let body, active = r.path;
  try {
    switch (r.path) {
      case 'home': body = vHome(r); break;
      case 'pending': if (seesOverview()) body = vPending(r); else { body = vHome(r); active = 'home'; setTimeout(() => { const el = document.getElementById('todo'); if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); } }, 60); } break;
      case 'children': body = vChildren(r); break;
      case 'child': body = vChild(r); active = 'children'; break;
      case 'visit': case 'visits': r.path === 'visit' && (r.id = 'new'); body = vVisits(r); active = 'visits'; break;
      case 'attendance': body = vAttendance(r); break;
      case 'outreach': body = vOutreach(r); break;
      case 'counseling': body = vCounseling(r); break;
      case 'session': body = vSession(r); active = 'counseling'; break;
      case 'reports': body = vReports(r); break;
      case 'staff': body = canAdminPage() ? vStaff(r) : vHome(r); break;
      case 'help': body = vHelp(); active = ''; break;
      case 'more': body = vMore(); active = 'more'; break;
      case 'sync': body = vSync(); active = 'more'; break;
      case 'feedback': body = vFeedback(r); active = 'staff'; break;
      case 'activities': body = vActivities(r); break;
      case 'logframe': body = vLogframe(r); break;
      case 'visitrep': body = vVisitRep(r); active = 'visits'; break;
      case 'school': body = vSchool(r); active = 'visits'; break;
      case 'schoolvisit': body = vSchoolVisit(r); active = 'visits'; break;
      case 'pupil': body = vPupil(r); active = 'visits'; break;
      case 'referrals': body = r.id === 'new' ? vReferNew(r) : vReferrals(r); active = 'visits'; break;
      case 'tasks': body = vTasks(r); active = 'tasks'; break;
      case 'groups': body = r.id === 'new' ? vGroupNew(r) : vGroups(r); active = 'reports'; break;
      case 'case': body = r.id === 'new' || r.sub === 'edit' ? vCaseForm(r) : vCase(r); active = 'children'; break;
      case 'cases': body = vCases(r); active = 'children'; break;
      case 'story': body = vStory(r); active = 'reports'; break;
      case 'monthly': body = vMonthly(r); active = 'children'; break;
      case 'review': body = vReview(); active = 'pending'; break;
      case 'paths': body = vPaths(r); active = 'children'; break;
      default: body = vHome(r); active = 'home';
    }
  } catch (e) { console.error(e); body = `<div class="warn">Something went wrong on this page: ${esc(e.message)}</div>`; }
  if (clockBad()) body = `<div class="warn" id="clockwarn"><b>The date of this ${isPhone() ? 'phone' : 'computer'} is wrong: it says ${esc(fmtDate(today()))}${today() >= BUILD_DATE ? '. Today is ' + esc(fmtDate(iso(new Date(Date.now() + (SY.skew || 0))))) : ''}.</b> Set the date in the settings, then open the app again. Nothing can be saved until then.</div>` + body;
  app.innerHTML = zm(shell(active, body));
  const s = $('#search'); if (s && UI.focusSearch) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); UI.focusSearch = false; }
  if (IS_DEMO && typeof tourDraw === 'function') setTimeout(tourDraw, 0);
  fbDraw(); editFill(); draftRestore(); luigiGridToday(); linkKeep(); sessGroupDraw(); if (typeof grpKidsDraw === 'function') grpKidsDraw(); if (typeof dsAfter === 'function') dsAfter();
}

/* ---------- actions ---------- */
function formObj(f) {
  const o = {}; const fd = new FormData(f);
  for (const [k, v] of fd.entries()) { if (k in o) { o[k] = [].concat(o[k], v); } else o[k] = v; }
  for (const el of $$('input[type=checkbox]', f)) if (!(el.name in o)) o[el.name] = [];
  for (const el of $$('input[type=checkbox]', f)) if (typeof o[el.name] === 'string') o[el.name] = [o[el.name]];
  return o;
}
function nextChildId() { const n = S.children.map(c => Number(c.id)).filter(x => !isNaN(x)); return String(n.length ? Math.max(...n) + 1 : 5000); }
const FORMS = {
  child(o) {
    const isNew = !o.id;
    let c = isNew ? { id: nextChildId(), status: 'Active', createdAt: today(), createdBy: USER.id } : child(o.id);
    const oldSection = c.section, oldRes = c.residence, ageBefore = isNew ? '' : curAge(c), hadDob = !isNew && !!c.dob;
    const keys = ['name', 'surname', 'nickname', 'sex', 'dob', 'languages', 'section', 'residence', 'entryDate', 'entryYear', 'referredBy', 'responsible', 'stream', 'programmes', 'support', 'compound', 'familyAddress', 'contact', 'guardianName', 'guardianRelation', 'father', 'mother', 'otherRelatives', 'familyBackground', 'schoolType', 'schoolName', 'grade', 'skill', 'educationAtEntry', 'medical', 'disabilities', 'objectives', 'notes', 'streetCat', 'streetPlace', 'connectionDate', 'relStreet', 'relStreetWho', 'backStreet', 'backStreetDate'];
    for (const k of keys) { if (['medical', 'disabilities', 'notes'].includes(k) && !(k in o)) continue; c[k] = Array.isArray(o[k]) ? o[k] : String(o[k] == null ? '' : o[k]).trim(); }
    if (!o.dob && o.age !== '') { if (hadDob || ageBefore === '' || Number(o.age) !== ageBefore || !c.ageAsOf) { c.age = Number(o.age); c.ageAsOf = today(); } } else if (o.dob) { c.age = ''; }
    c.grade = gradeNorm(c.grade); if (c.schoolType) { c.schoolTypeToCheck = false; c.alsoAt = ''; }
    if (!isNew && oldSection && oldSection !== c.section) { addMove(c.id, 'section', today(), { from: oldSection, to: c.section }); c.sectionToCheck = false; }
    if (!isNew && oldRes && oldRes !== c.residence) addMove(c.id, 'residence', today(), { from: oldRes, to: c.residence });
    c.updatedAt = today(); c.updatedBy = USER.id;
    if (isNew) S.children.push(c);
    if (UI.photoPending) { photos()[c.id] = UI.photoPending; UI.photoPending = null; syncMeta().photos[c.id] = 1; }
    save(); toast(isNew ? 'Child added' : 'Changes saved'); go('#/child/' + c.id);
  },
  visit(o) {
    if (!o.childId) return toast('Choose a child');
    if (!o.team) return toast('Choose the section that made the visit');
    const old = o.edit ? S.visits.find(x => x.id === o.edit) : null; if (o.edit && (!old || !visitCanEdit(old))) return toast('This visit cannot be changed');
    const v = { id: uid('v'), childId: String(o.childId), team: TEAM_KEYS.includes(o.team) ? o.team : teamFor(child(o.childId)), date: o.date, purpose: o.purpose, where: o.where, by: o.by || USER.id, successful: o.successful, metWith: o.metWith, place: o.place, stillHome: o.purpose === 'Follow-up' ? o.stillHome : '', findings: o.findings, action: (o.action || '').trim(), actionDone: false, recordedBy: old ? old.recordedBy : USER.id, recordedOn: old ? old.recordedOn : today() };
    if (old) { v.root = visitKey(old); v.editedBy = USER.id; v.editedOn = today(); v.actionDone = !!old.actionDone && old.action === v.action; }
    if (v.purpose === 'School visit') { for (const k of SCH_KEYS) if (o[k]) v[k] = String(o[k]).trim(); if (!v.findings) v.findings = schoolFindings(o); }
    { const ph = fileKeep('visit', v.childId, 'Visit photo'); if (ph) v.photo = ph.id; else if (old && old.photo) v.photo = old.photo; }
    if (old) { const back = visitState(old) === 'back', t = Date.now(); S.events.push({ id: uid('e'), childId: String(old.childId), type: 'Visit corrected', ref: old.id, date: today(), ts: t, by: USER.id }); if (back) S.events.push({ id: uid('e'), childId: v.childId, type: 'Visit sent again', ref: v.root, date: today(), ts: t + 1, note: 'Report changed', by: USER.id }); }
    S.visits.push(v); dropCancelled(); if (o.referTo) referAdd(v.childId, v.team, o.referTo, o.referWhy, o.referNote, v.date, v.id);
    save(); toast(old ? 'Changes saved' : o.referTo ? 'Visit saved. Referred to ' + referLabel(o.referTo) : 'Visit saved'); go(old ? '#/visitrep/' + v.id : o.back === 'pu' && v.purpose === 'School visit' ? '#/pupil/' + v.childId : o.back === 'sv' && v.purpose === 'School visit' && visitSchool(v) ? '#/schoolvisit?sn=' + encodeURIComponent(visitSchool(v)) + '&d=' + v.date : '#/visits?vt=' + v.team + '&m=' + v.date.slice(0, 7));
  },
  edu(o) {
    const c = child(o.id); if (!c) return;
    for (const k of ['schoolType', 'schoolName', 'grade', 'stream', 'skill']) c[k] = String(o[k] == null ? '' : o[k]).trim();
    c.grade = gradeNorm(c.grade); if (c.schoolType) { c.schoolTypeToCheck = false; c.alsoAt = ''; }
    c.updatedAt = today(); c.updatedBy = USER.id; save(); toast('Changes saved'); go('#/child/' + c.id);
  },
  event(o) { S.events.push({ id: uid('e'), childId: String(o.childId), type: o.type, date: o.date, note: o.note, by: USER.id }); save(); toast('Added to the history'); render(); },
  move(o) {
    const c = child(o.id); addMove(c.id, 'section', o.date, { from: c.section, to: o.to, note: o.note });
    if (o.residence && o.residence !== c.residence) addMove(c.id, 'residence', o.date, { from: c.residence, to: o.residence });
    c.section = o.to; c.residence = o.residence || c.residence; c.sectionToCheck = false; if (o.schoolType != null) { c.schoolType = o.schoolType; c.alsoAt = ''; } c.updatedAt = today(); save(); toast('Moved to ' + SECTIONS[o.to].label); go('#/child/' + c.id);
  },
  street(o) { const c = child(o.id), to = o.cat === 'none' ? '' : o.cat, from = c.streetCat || ''; if (to !== from) { addMove(c.id, 'street', o.date, { from, to }); c.streetCat = to; if (from === 'A' && to === 'B') c.connectionDate = o.date; c.updatedAt = today(); } save(); toast('Street situation saved'); go('#/child/' + c.id); },
  activity(o) { const c = child(o.id); if (c.status !== o.status) { addMove(c.id, 'status', o.date, { from: c.status, to: o.status }); c.status = o.status; } save(); go('#/child/' + c.id); },
  resid(o) {
    const c = child(o.id);
    if (o.to === 'facility') { if (!confirm('Close the file of ' + fullName(c) + ': transferred to another facility?')) return; const reason = 'Transferred to another partner'; addMove(c.id, 'closed', o.date, { reason, note: o.note, prev: c.status }); c.status = 'Closed'; c.closeDate = o.date; c.closeReason = reason; save(); toast('File closed: transferred to another facility'); }
    else { if (o.to !== c.residence) { addMove(c.id, 'residence', o.date, { from: c.residence, to: o.to, note: o.note }); c.residence = o.to; c.updatedAt = today(); } save(); toast('Saved: ' + o.to.toLowerCase()); }
    go('#/child/' + c.id);
  },
  reintegrate(o) { const c = child(o.id); addMove(c.id, 'reintegrated', o.date, { note: o.note, prev: c.status }); c.status = 'Follow-up'; c.reintegrationDate = o.date; save(); toast('Reintegration recorded'); go('#/child/' + c.id); },
  close(o) { const c = child(o.id); addMove(c.id, 'closed', o.date, { reason: o.reason, note: o.note, prev: c.status }); c.status = 'Closed'; c.closeDate = o.date; c.closeReason = o.reason; save(); toast('File closed'); go('#/child/' + c.id); },
  reopen(o) { const c = child(o.id); addMove(c.id, 'reopened', o.date, { note: o.note }); if (o.section !== c.section) addMove(c.id, 'section', o.date, { from: c.section, to: o.section }); c.section = o.section; c.status = 'Active'; c.closeDate = ''; c.closeReason = ''; c.reintegrationDate = ''; save(); toast('File reopened'); go('#/child/' + c.id); },
  outreach(o) {
    const ids = [].concat(o.children || []);
    for (const line of String(o.newKids || '').split(/\n/).map(x => x.trim()).filter(Boolean)) {
      const p = line.split(',').map(x => x.trim());
      if (!p[0]) continue;
      const nm = p[0].split(/\s+/);
      const c = { id: nextChildId(), name: nm[0] || '', surname: nm.slice(1).join(' '), nickname: p[1] || '', sex: (p[2] || '').toUpperCase().startsWith('F') ? 'F' : 'M', age: Number(p[3]) || '', ageAsOf: o.date, compound: p[4] || '', section: 'Luigi', residence: 'Non-resident', status: 'Active', entryDate: o.date, referredBy: 'Luigi ' + o.type.toLowerCase(), responsible: USER.id, programmes: [], support: [], createdAt: today(), createdBy: USER.id };
      S.children.push(c); ids.push(c.id);
    }
    S.outreach.push({ id: uid('o'), date: o.date, type: o.type, staff: o.staff, children: ids.map(String), notes: o.notes, by: USER.id });
    save(); toast('Session saved'); render();
  },
  session(o) {
    S.sessions.push({ id: uid('c'), date: o.date, type: o.type, centre: o.centre, by: o.by, children: (o.child1 ? [String(o.child1)] : []).concat(o.type === 'Group' ? Array.from(UI.sessKids || []).filter(x => x !== String(o.child1)) : []), others: Number(o.others) || 0, topic: o.topic, action: (o.action || '').trim(), actionDone: false, recordedBy: USER.id, recordedOn: today() });
    UI.sessKids = null; pickReset('sess'); save(); toast('Session saved'); render();
  },
  target(o) { S.settings.targets[o.m] = S.settings.targets[o.m] || {}; S.settings.targets[o.m][o.k] = Number(o.v) || 0; save(); render(); },
  staffadd(o) { const a = [].concat(o.areas || []).filter(k => isSite() || !ACCESS_FLAGS.includes(k)); S.staff.push({ id: uid('s'), name: o.name.trim(), role: (o.role || '').trim(), areas: a, section: a[0] || 'Other', admin: a.includes('Admin'), active: true }); save(); toast('Added'); render(); },
  handover(o) {
    if (!o.from || !o.to || o.from === o.to) return toast('Choose two different people');
    const list = S.children.filter(c => c.responsible === o.from && c.status !== 'Closed');
    for (const c of list) { c.responsible = o.to; addMove(c.id, 'handover', today(), { from: o.from, to: o.to, note: 'Followed by ' + staffName(o.to) + ' instead of ' + staffName(o.from) }); }
    save(); toast(list.length + ' children moved to ' + staffName(o.to)); render();
  },
  bulkclose(o) {
    const ids = [].concat(o.ids || []);
    if (!ids.length) return toast('Tick at least one file');
    if (!confirm('Close ' + ids.length + ' files? They can be reopened later.')) return;
    for (const id of ids) { const c = child(id); if (!c || c.status === 'Closed') continue; addMove(c.id, 'closed', o.date, { reason: o.reason, note: o.note }); c.status = 'Closed'; c.closeDate = o.date; c.closeReason = o.reason; }
    save(); toast(ids.length + ' files closed'); render();
  },
  absence(o) { const a = Math.max(1, Number(o.alert) || 4), r = Math.max(a + 1, Number(o.review) || 60); S.settings.absence = { alert: a, review: r }; save(); toast('Saved'); render(); },
  settings(o) { for (const k of ['Resident', 'Non-resident', 'Follow-up']) S.settings.interval[k] = Number(o[k]) || S.settings.interval[k]; save(); toast('Saved'); render(); }
};

function tableToRows() { const t = $('#rtable'); if (!t) return []; return $$('tr', t).filter(tr => !tr.classList.contains('hide') && !tr.classList.contains('nx')).map(tr => $$('th,td', tr).filter(td => !td.classList.contains('nx')).map(td => td.innerText.replace(/\s+/g, ' ').trim())); }

let _LASTSUB = { sig: '', at: 0 };
document.addEventListener('submit', e => {
  const f = e.target; const h = FORMS[f.dataset.form]; if (!h) return;
  e.preventDefault(); const o = formObj(f), free = ['pinlogin', 'synclink'].includes(f.dataset.form);
  let sig = ''; try { sig = f.dataset.form + JSON.stringify(o); } catch (x) {}
  if (sig && sig === _LASTSUB.sig && Date.now() - _LASTSUB.at < 2500) return;
  if (!free && clockBad()) return toast('Set the date of this ' + (isPhone() ? 'phone' : 'computer') + ' first');
  if (!free && typeof o.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.date) && o.date > today()) { toast('This date is in the future'); const d = f.querySelector('[name="date"]'); if (d) d.focus(); return; }
  _LASTSUB = { sig, at: Date.now() }; draftClear(); h(o, f);
});
/* a wrong clock (phones go back to 2015 or 1970 when the battery was empty) would date the records wrongly */
function clockBad() { return today() < BUILD_DATE || (typeof SY === 'object' && Math.abs(SY.skew || 0) > 86400000); } /* SY.skew: the hour of the shared database minus the hour of this device */
/* text half written is kept on this device: leaving the page, a call or a closed browser does not lose it */
const DRAFT_KEY = 'cyp-draft', DRAFT_SKIP = ['pinlogin', 'synclink', 'docadd', 'staffadd', 'staffpin'];
function draftKey() { const r = route(); return [r.path, r.id || '', r.sub || ''].join('/'); }
function draftClear() { lsSet(DRAFT_KEY, null); }
function draftSave(f) {
  if (GUEST || !f || DRAFT_SKIP.includes(f.dataset.form)) return; const vals = {}; let text = 0;
  for (const el of f.elements) { if (!el.name || el.type === 'file' || el.type === 'password' || el.type === 'submit') continue;
    if (el.type === 'checkbox') (vals[el.name] = vals[el.name] || { cb: [] }).cb.push([el.value, el.checked]);
    else if (el.type === 'radio') { if (el.checked) vals[el.name] = el.value; }
    else { vals[el.name] = el.value; if ((el.tagName === 'TEXTAREA' || el.type === 'text') && el.value.trim().length > 2) text++; } }
  if (!text) return;
  lsSet(DRAFT_KEY, JSON.stringify({ key: draftKey(), form: f.dataset.form, at: Date.now(), by: USER ? USER.id : '', hid: draftHid(f), vals }));
}
function draftHid(f) { return [...f.elements].filter(el => el.type === 'hidden' && el.name && el.name !== 'childId').map(el => el.name + '=' + el.value).sort().join('&'); }
function draftRestore() {
  let d = null; try { d = JSON.parse(lsGet(DRAFT_KEY) || 'null'); } catch (e) {}
  if (!d || !USER || d.by !== USER.id || d.key !== draftKey() || Date.now() - d.at > 48 * 3600000) return;
  const f = document.querySelector('form[data-form="' + d.form + '"]'); if (!f) return;
  const cq = route().q.get('child'), tq = route().q.get('t'); if (cq && d.vals.childId && String(d.vals.childId) !== String(cq)) return; if (tq && d.vals.team && d.vals.team !== tq) return;
  if ((d.hid || '') !== draftHid(f)) return;
  if (d.vals.childId && !cq && f.querySelector('.cpick') && child(d.vals.childId)) { const cp = f.querySelector('.cpick'); cp.innerHTML = `<span>${cp.querySelector('span') ? cp.querySelector('span').innerHTML : ''}</span>` + childPickInner(cp.dataset.name, d.vals.childId); }
  let n = 0;
  for (const el of f.elements) { if (!el.name || !(el.name in d.vals) || el.type === 'file' || el.type === 'hidden') continue; const v = d.vals[el.name];
    if (el.type === 'checkbox') { const hit = v && v.cb && v.cb.find(x => x[0] === el.value); if (hit && el.checked !== hit[1]) { el.checked = hit[1]; n++; } }
    else if (el.type === 'radio') { if (el.value === v && !el.checked) { el.checked = true; n++; } }
    else if (el.tagName === 'SELECT') { if (el.value !== v && [...el.options].some(x => x.value === v)) { el.value = v; n++; } }
    else if (el.value !== v) { el.value = v; n++; } }
  if (n && UI.draftTold !== d.at) { UI.draftTold = d.at; toast('Your text is back'); }
}
document.addEventListener('input', e => { const f = e.target.closest && e.target.closest('form[data-form]'); if (f) draftSave(f); });
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('form[data-form] a.btn'); if (a) draftClear(); }, true);
document.addEventListener('click', e => {
  const sc = e.target.closest('[data-scroll]');
  if (sc) { e.preventDefault(); const el = document.getElementById(sc.dataset.scroll); if (el) el.scrollIntoView({ behavior: 'smooth' }); return; }
  const q = e.target.closest('[data-q]');
  if (q) { e.preventDefault(); const ch = {}; for (const kv of q.dataset.q.split('&')) { const [k, v] = kv.split('='); ch[k] = v; } setQuery(ch); return; }
  const tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) { go(tr.dataset.href); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'guest') { guestIn(); return; }
  if (act === 'login' && needPin()) { UI.pinFor = b.dataset.id; UI.pinErr = ''; render(); const pi = $('#pinin'); if (pi) pi.focus(); return; }
  if (act === 'pinback') { UI.pinFor = null; render(); return; }
  if (act === 'login') { guestOut(); const s = S.staff.find(x => x.id === b.dataset.id); USER = s; lsSet(USER_KEY, s.id); if (!location.hash) location.hash = '#/home'; render(); }
  else if (act === 'logout') { guestOut(); USER = null; UI.pinFor = null; lsSet(USER_KEY, null); try { sessionStorage.removeItem('cyp-ok'); } catch (e) {} render(); }
  else if (act === 'att') { const d = b.dataset.d; S.attendance[d] = S.attendance[d] || {}; touchAtt(d, b.dataset.id); if (S.attendance[d][b.dataset.id] === b.dataset.v) delete S.attendance[d][b.dataset.id]; else S.attendance[d][b.dataset.id] = b.dataset.v; save(); render(); }
  else if (act === 'allpresent') { const d = b.dataset.d, g = b.dataset.g; if (!confirm('Mark as present everyone who is not marked yet for ' + fmtDate(d) + '? You can still change each child afterwards.')) return; S.attendance[d] = S.attendance[d] || {}; for (const c of S.children) { const k = attKey(c, b.dataset.c || 'Minsundu'); if (isCurrent(c) && attIn(c, b.dataset.c || 'Minsundu', g) && S.attendance[d][k] == null) { S.attendance[d][k] = 'P'; touchAtt(d, k); } } save(); render(); }
  else if (attQuickAct(act, b)) return;
  else if (act === 'actiondone') { const arr = b.dataset.kind === 'visit' ? S.visits : S.sessions; const it = arr.find(x => x.id === b.dataset.id); if (it) { it.actionDone = true; it.actionDoneBy = USER.id; it.actionDoneOn = today(); touchDone(b.dataset.kind, it.id); } save(); render(); }
  else if (act === 'keepopen') { const c = child(b.dataset.id); c.reviewKeep = today(); save(); render(); }
  else if (act === 'checkall') { for (const x of $$('input[name=ids]')) x.checked = b.checked; }
  else if (act === 'confirmall') { const list = filteredChildren(route().q); if (confirm('Confirm the current section for ' + list.length + ' children?')) { for (const c of list) c.sectionToCheck = false; save(); toast('Sections confirmed'); render(); } }
  else if (act === 'nkzchecked') { const c = child(b.dataset.id); c.toCheck = []; c.updatedAt = today(); save(); render(); }
  else if (act === 'confirmsection') { const c = child(b.dataset.id); c.sectionToCheck = false; save(); render(); }
  else if (act === 'names') { const r = $('#names' + b.dataset.i); if (r) r.classList.toggle('hide'); }
  else if (act === 'repflow') { repAct(b); }
  else if (act === 'rstatus') { const m = b.dataset.m, k = b.dataset.k; S.reports[m] = S.reports[m] || {}; const st = S.reports[m][k] = S.reports[m][k] || {}; if (b.dataset.v === 'reset') delete S.reports[m][k]; else st[b.dataset.v] = { by: USER.id, date: today() }; save(); render(); }
  else if (act === 'copytable') { const txt = tableToRows().map(r => r.join('\t')).join('\n'); copyText(txt); }
  else if (act === 'xlnames') { reportNamesXlsx(); }
  else if (fbAct(act, b)) return;
  else if (act === 'photossave') { photosBatchSave(); }
  else if (act === 'wordreport') { wordReport(b); }
  else if (act === 'happened') { const el = document.getElementById('happened'), t = document.getElementById('evnote'); if (el) el.scrollIntoView({ block: 'center' }); if (t) t.focus(); }
  else if (act === 'actmark') { actMark(b); }
  else if (act === 'actenrol') { actEnrol(b); }
  else if (act === 'actxl') { actXlsx(); }
  else if (act === 'mcell') { monthCellAct(b); }
  else if (act === 'csvtable') { downloadXlsx(b.dataset.name, [{ name: b.dataset.name, rows: tableToRows() }]); }
  else if (act === 'print') window.print();
  else if (act === 'staffactive') { const s = S.staff.find(x => x.id === b.dataset.id); s.active = !s.active; save(); render(); }
  else if (act === 'backup') { download('cicetekelo-backup-' + today() + '.json', JSON.stringify(S), 'application/json'); S.meta.lastBackup = today(); save(); render(); }
  else if (act === 'export') exportTable(b.dataset.k);
  else if (act === 'exportlist') { const list = filteredChildren(route().q); downloadXlsx('children-' + today(), [{ name: 'Children', rows: colsToRows(list, CHILD_COLS) }]); }
  else if (act === 'xl') { const f = XL[b.dataset.k]; if (f) f(); }
  else if (act === 'resetdemo') { if (IS_DEMO && !GUEST && confirm('Start the demo again? Everything entered in the demo is replaced by the invented data.')) { noStamp(); S = Object.assign(blankState(), demoState()); save(); toast('Demo data restored'); go('#/home'); } }
  else if (act === 'wipe') { if (confirm('Delete all data on this ' + (isPhone() ? 'phone' : 'computer') + '? This cannot be undone.')) { const staff = S.staff; S = blankState(); S.staff = staff; save(); toast('All data deleted'); go('#/home'); } }
});
function copyText(t) {
  const done = () => toast('Table copied: paste it into Word or Excel');
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
  function fallback() { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Copy not allowed here'); } ta.remove(); }
}
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.filter) { setQuery({ [el.dataset.filter]: el.value }); return; }
  if (el.dataset.staff) return;
  if (el.id === 'importfile' && el.files[0]) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const rows = parseCSV(rd.result);
        if (!rows.length || !('residential_status' in rows[0]) || !('id' in rows[0])) { $('#importmsg').innerHTML = '<div class="warn">This does not look like the export of the Minsundu tool (columns id, name, residential_status... not found).</div>'; return; }
        const res = importRiccardo(rows);
        $('#importmsg').innerHTML = `<div class="ok">${res.added} children added, ${res.updated} already here (empty fields filled). Section set from age (UCC under 18, Youth 18 and over): confirm it on each profile.</div>`;
      } catch (err) { $('#importmsg').innerHTML = '<div class="warn">Could not read the file: ' + esc(err.message) + '</div>'; }
    };
    rd.readAsText(el.files[0]);
  }
  if (el.id === 'starterfile' && el.files[0]) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const out = importStarterPack(JSON.parse(rd.result));
        $('#startermsg').innerHTML = `<div class="ok">Loaded. Minsundu tool: ${out.children} children added${out.childrenUpdated ? ', ' + out.childrenUpdated + ' already here' : ''}. ${out.nkwazi ? 'Nkwazi register and Data Tool: ' + out.nkwazi.added + ' children added, ' + out.nkwazi.joined + ' joined to a Luigi or Minsundu file of the same child' + (out.nkwazi.updated ? ', ' + out.nkwazi.updated + ' already here' : '') + '. ' : ''}${out.luigiDb ? 'Luigi tool: ' + out.luigiDb.added + ' children added, ' + out.luigiDb.updated + ' already here, ' + out.luigiDb.photos + ' photos, ' + out.luigiDb.marks + ' day and night marks in ' + out.luigiDb.sessions + ' sessions' + (out.luigiDb.removedList ? '; ' + out.luigiDb.removedList + ' names of the old January list replaced' : '') + (out.luigiDb.linked.length ? '. Probably the same child in two records: ' + out.luigiDb.linked.map(x => esc(fullName(x[0])) + ' (' + esc(x[0].id) + ' and ' + esc(x[1].id) + ')').join(', ') : '') : 'Luigi list: ' + (out.luigi ? out.luigi.created.length + ' added, ' + out.luigi.matched.length + ' linked to children already in the records' : 'none')}. ${out.luigi && out.luigi.removed ? 'Duplicates removed: ' + out.luigi.removed + '. ' : ''}Report figures: ${out.history} new tables${out.historyUpdated ? ', ' + out.historyUpdated + ' updated' : ''}, ${S.history.length} in all. Next: confirm the sections (Children, filter "Missing information") and close the files that are no longer active (Pending, then Files to review).</div>`;
      } catch (err) { $('#startermsg').innerHTML = '<div class="warn">Could not load the file: ' + esc(err.message) + '</div>'; }
    };
    rd.readAsText(el.files[0]);
  }
  if (el.id === 'luigifile' && el.files[0]) {
    const f = el.files[0];
    f.arrayBuffer().then(readXlsxFirstSheet).then(grid => {
      const res = parseLuigiList(grid);
      let month = res.month;
      if (!month) { month = prompt('Which month is this list for? (YYYY-MM)', thisMonth()) || ''; if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('month not given'); }
      const out = importLuigiList(res.kids, month);
      $('#luigimsg').innerHTML = `<div class="ok">${esc(fmtMonth(month))}: ${res.kids.length} names in the list. ${out.created.length} children added to Luigi; ${out.matched.length} already in the records and linked: ${out.matched.map(c => esc(fullName(c)) + ' (' + esc(c.id) + ', ' + esc(SECTIONS[c.section].label) + ')').join(', ') || 'none'}. Check that the linked ones are the same person.</div>`;
    }).catch(err => { $('#luigimsg').innerHTML = '<div class="warn">Could not read the file: ' + esc(err.message) + '</div>'; });
  }
  if (el.id === 'restorefile' && el.files[0]) {
    const rd = new FileReader();
    rd.onload = async () => {
      try { let d = JSON.parse(rd.result);
        if (d && d.locked && d.box) { try { d = JSON.parse(await lockOpen(d.box, (syncCfg() || {}).enc)); } catch (e) { throw new Error('this copy is locked. It opens only on a device connected to the shared database with the same staff link'); } }
        if (!d || !Array.isArray(d.children)) throw new Error('not a backup of this app'); if (!confirm('Replace all data on this ' + (isPhone() ? 'phone' : 'computer') + ' with this backup (' + d.children.length + ' children)?')) return; noStamp(); S = Object.assign(blankState(), d); mergeStaff(); save(); USER = S.staff.find(s => s.id === (USER && USER.id)) || null; toast('Backup restored'); render(); }
      catch (err) { toast('Could not restore: ' + err.message); }
    };
    rd.readAsText(el.files[0]);
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'attsearch') { UI.attq = e.target.value; const t = $('#attTable'); if (t) t.innerHTML = attBody(route().q); return; }
  if (e.target.id === 'search') { UI.q = e.target.value; const t = $('#childTable'); if (t) t.innerHTML = childRows(filteredChildren(route().q)); const l = $('.lead'); if (l) l.textContent = childrenLead(filteredChildren(route().q)); }
});
window.addEventListener('hashchange', () => { if (!(IS_DEMO && TT && TT.nav)) window.scrollTo(0, 0); render(); });

const CHILD_COLS = [
  { key: 'id', label: 'ID' }, { key: 'name', label: 'First name' }, { key: 'surname', label: 'Surname' }, { key: 'nickname', label: 'Nickname' }, { key: 'sex', label: 'Sex' },
  { label: 'Age', get: c => curAge(c) }, { key: 'dob', label: 'Date of birth' }, { label: 'Centre', get: c => (SECTIONS[c.section] || {}).label || c.section },
  { key: 'residence', label: 'Residence' }, { label: 'Status', get: c => STATUS_LABEL[c.status] || c.status }, { key: 'entryDate', label: 'Date of entry' }, { key: 'referredBy', label: 'Referred by' },
  { label: 'Followed by', get: c => staffName(c.responsible) }, { label: 'Programmes', get: c => (c.programmes || []).join('; ') }, { label: 'ABA', get: c => isAba(c) ? 'Yes' : '' }, { key: 'streetCat', label: 'Street situation' }, { key: 'relStreet', label: 'Relatives on the street' }, { key: 'relStreetWho', label: 'Which relatives' }, { label: 'Back on the street', get: c => backLabel(c.backStreet) }, { key: 'backStreetDate', label: 'Found on the street again on' }, { label: 'Support', get: c => (c.support || []).join('; ') },
  { key: 'compound', label: 'Compound' }, { key: 'familyAddress', label: 'Family address' }, { key: 'contact', label: 'Contact' }, { key: 'guardianName', label: 'Guardian' }, { key: 'guardianRelation', label: 'Guardian relation' },
  { key: 'schoolType', label: 'School type' }, { key: 'schoolName', label: 'School' }, { key: 'grade', label: 'Grade' }, { key: 'reintegrationDate', label: 'Reintegrated on' }, { key: 'closeDate', label: 'Closed on' }, { key: 'closeReason', label: 'Close reason' },
  { label: 'Last home visit', get: c => lastHomeVisit(c) }
];
function exportTable(k) {
  const name = (x) => { const c = child(x); return c ? fullName(c) : ''; };
  const sets = {
    children: [S.children, CHILD_COLS],
    visits: [S.visits, [{ key: 'date', label: 'Date' }, { label: 'Visit made by (section)', get: v => teamLabel(visitTeam(v)) }, { key: 'childId', label: 'Child ID' }, { label: 'Child', get: v => name(v.childId) }, { key: 'purpose', label: 'Purpose' }, { key: 'where', label: 'Where' }, { key: 'place', label: 'Place' }, { key: 'successful', label: 'Found' }, { key: 'metWith', label: 'Met with' }, { key: 'stillHome', label: 'Still at home' }, { label: 'By', get: v => staffName(v.by) }, { key: 'findings', label: 'Findings' }, { key: 'action', label: 'Action' }, { label: 'Action done', get: v => v.actionDone ? 'Yes' : '' }]],
    events: [S.events, [{ key: 'date', label: 'Date' }, { key: 'childId', label: 'Child ID' }, { label: 'Child', get: v => name(v.childId) }, { key: 'type', label: 'Event' }, { key: 'note', label: 'Note' }, { label: 'By', get: v => staffName(v.by) }]],
    moves: [S.moves, [{ key: 'date', label: 'Date' }, { key: 'childId', label: 'Child ID' }, { label: 'Child', get: v => name(v.childId) }, { label: 'What', get: v => moveLabel(v) }, { key: 'reason', label: 'Reason' }, { key: 'note', label: 'Note' }, { label: 'By', get: v => staffName(v.by) }]],
    sessions: [S.sessions, [{ key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'centre', label: 'Centre' }, { label: 'Child', get: v => (v.children || []).map(name).join('; ') }, { key: 'others', label: 'Other participants' }, { label: 'Topic or issues', get: v => sessSees(v) ? v.topic || '' : 'Hidden' }, { label: 'Strengths', get: v => sessSees(v) ? v.strengths || '' : '' }, { label: 'Summary', get: v => sessSees(v) ? v.summary || '' : '' }, { label: 'Conclusion and way forward', get: v => sessSees(v) ? v.conclusion || '' : '' }, { label: 'Counsellor', get: v => staffName(v.by) }, { label: 'Co-counsellor', get: v => v.co ? staffName(v.co) : '' }, { key: 'referred', label: 'Referred' }, { key: 'budget', label: 'Budget used (ZMW)' }, { key: 'action', label: 'Action' }]],
    outreach: [S.outreach, [{ key: 'date', label: 'Date' }, { key: 'type', label: 'Session' }, { key: 'staff', label: 'Staff' }, { label: 'Children', get: v => (v.children || []).length }, { label: 'Names', get: v => (v.children || []).map(name).join('; ') }, { key: 'notes', label: 'Notes' }]],
    attendance: [[].concat(...Object.entries(S.attendance).map(([d, o]) => Object.entries(o).map(([id, s]) => ({ d, id, s })))), [{ key: 'd', label: 'Date' }, { key: 'id', label: 'Child ID' }, { label: 'Child', get: v => name(String(v.id).split('@')[0]) }, { label: 'Other register', get: v => String(v.id).split('@')[1] || '' }, { label: 'Status', get: v => ATT_L[v.s] }]]
  };
  if (k === 'all') { downloadXlsx('cicetekelo-all-data-' + today(), Object.entries(sets).map(([n, [rows, cols]]) => ({ name: n[0].toUpperCase() + n.slice(1), rows: colsToRows(rows, cols) }))); return; }
  const [rows, cols] = sets[k];
  downloadXlsx(k + '-' + today(), [{ name: k, rows: colsToRows(rows, cols) }]);
}

/* ---------- start ---------- */
(async function start() {
  linkFromHash();
  const saved = await loadState();
  S = saved ? Object.assign(blankState(), saved) : (IS_DEMO ? Object.assign(blankState(), demoState()) : blankState());
  const ms = mergeStaff(); snapChildren();
  if (ms || !saved) rawSave();
  const uidSaved = lsGet(USER_KEY);
  USER = S.staff.find(s => s.id === uidSaved && s.active) || null;
  if (USER && needPin() && !pinOk()) USER = null;
  if (uidSaved === 'guest') { await guestIn(); return; }
  render();
  syncAuto();
})();
