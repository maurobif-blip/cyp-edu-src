/* the copy of every night, run against a pretend Drive */
const fs = require('fs'); const src = fs.readFileSync('/home/claude/server/Code.gs', 'utf8');
let NOW = new Date('2026-11-20T00:05:00Z'); let idn = 0;
class File { constructor(name, text, parent) { this.name = name; this.text = text; this.id = 'f' + (++idn); this.trashed = false; this.parent = parent; ALL[this.id] = this; } getId() { return this.id; } setTrashed(v) { this.trashed = v; } isTrashed() { return this.trashed; } getName() { return this.name; }
  makeCopy(name, dir) { const f = new File(name, this.text, dir); dir.files.push(f); return f; } getParents() { const p = this.parent; let done = false; return { hasNext: () => !done && !!p, next: () => { done = true; return p; } }; } getBlob() { return { getDataAsString: () => this.text }; } setContent(t) { this.text = t; } }
class Folder { constructor(name) { this.name = name; this.files = []; this.folders = []; this.trashed = false; } getName() { return this.name; } setTrashed(v) { this.trashed = v; }
  iter(a) { let i = 0; return { hasNext: () => i < a.length, next: () => a[i++] }; }
  getFoldersByName(n) { return this.iter(this.folders.filter(f => f.name === n && !f.trashed)); } getFolders() { return this.iter(this.folders.filter(f => !f.trashed)); } getFiles() { return this.iter(this.files.filter(f => !f.trashed)); }
  createFolder(n) { const f = new Folder(n); this.folders.push(f); return f; } createFile(n, t) { const f = new File(n, t, this); this.files.push(f); return f; } }
const ALL = {}; const ROOT = new Folder('Cicetekelo'); const SHEETFILE = new File('CYP EDU database', 'SHEET', ROOT); ROOT.files.push(SHEETFILE); const SNAP = new File('cyp-edu-snapshot.json', '{"children":[]}', ROOT); ROOT.files.push(SNAP);
const rows = { log: [['seq'], [1], [2], [3]], backups: null }; const triggers = [];
const sheetObj = n => ({ getLastRow: () => rows[n].length, appendRow: r => rows[n].push(r), getRange: () => ({ setValues() { return this; }, setNumberFormat() { return this; } }), setFrozenRows() {}, getMaxRows: () => 10, getMaxColumns: () => 10 });
const g = { PropertiesService: { getScriptProperties: () => ({ getProperty: k => ({ snapId: SNAP.id, snapSeq: '2', gen: 'abc12345' })[k] || null, setProperty() {} }) },
  SpreadsheetApp: { openById: () => ({ getId: () => SHEETFILE.id, getSheetByName: n => rows[n] ? sheetObj(n) : null, insertSheet: n => { rows[n] = []; return sheetObj(n); } }) },
  DriveApp: { getFileById: id => id === g.SHEET ? SHEETFILE : ALL[id], getRootFolder: () => ROOT },
  Utilities: { formatDate: (d, tz, f) => { const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).reduce((o, x) => (o[x.type] = x.value, o), {}); return f === 'yyyy-MM-dd' ? `${p.year}-${p.month}-${p.day}` : `${p.hour}:${p.minute}`; }, getUuid: () => 'u' },
  ScriptApp: { newTrigger: fn => { const t = { fn }; const b = { timeBased: () => b, everyDays: n => (t.days = n, b), atHour: h => (t.hour = h, b), nearMinute: m => (t.min = m, b), inTimezone: z => (t.tz = z, b), create: () => triggers.push(t) }; return b; }, getProjectTriggers: () => triggers.map(t => ({ getHandlerFunction: () => t.fn, t })), deleteTrigger: x => triggers.splice(triggers.indexOf(x.t), 1) },
  Logger: { log: s => g.logs.push(s) }, logs: [], ContentService: {}, LockService: {} };
const RealDate = Date; g.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [NOW.getTime()])); } static now() { return NOW.getTime(); } };
const fn = new Function(...Object.keys(g), src + '\n;return { nightlyBackup, backupOn, backupOff, backupNow, SHEET_ID };'); const api = fn(...Object.values(g)); ALL[api.SHEET_ID] = SHEETFILE;
const tree = () => { const b = ROOT.folders.find(f => f.name === 'CYP EDU backups'); return b ? b.folders.filter(f => !f.trashed).map(f => f.name + ':' + f.files.filter(x => !x.trashed).map(x => x.name).length).join(' ') : 'none'; };
api.backupOn(); api.backupOn(); console.log('triggers after two backupOn', triggers.length, JSON.stringify(triggers[0]), g.logs[0]);
console.log('first night', api.nightlyBackup(), tree()); const b = ROOT.folders.find(f => f.name === 'CYP EDU backups');
console.log('files', b.folders[0].files.map(f => f.name), 'day is the Ndola day (02:05 on the 20th)', b.folders[0].name);
console.log('about', b.folders[0].files.find(f => /about/.test(f.name)).text.split('\n').slice(1, 5));
console.log('same day again', api.nightlyBackup(), tree(), 'files in the bin', b.folders[0].files.filter(f => f.trashed).length);
for (let i = 1; i <= 34; i++) { NOW = new RealDate(NOW.getTime() + 864e5); api.nightlyBackup(); }
const live = b.folders.filter(f => !f.trashed).map(f => f.name).sort(); console.log('after 35 nights: kept', live.length, live[0], 'to', live[live.length - 1], 'in the bin', b.folders.filter(f => f.trashed).length);
console.log('log sheet rows', rows.backups.length, rows.backups[0], rows.backups[rows.backups.length - 1]);
SNAP.makeCopy = () => { throw new Error('Drive is full'); }; let err = ''; try { api.nightlyBackup(); } catch (e) { err = e.message; } console.log('failure is written and thrown', err, rows.backups[rows.backups.length - 1].slice(-1));
api.backupOff(); console.log('triggers after backupOff', triggers.length);
