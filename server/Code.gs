/* ===== CYP EDU shared database: the rules, independent of where the data is kept ===== */
function cypHandle(req, store) {
  if (!req || !store.key() || req.key !== store.key()) return { ok: false, error: 'key' };
  var a = req.action, sn = store.snapMeta();
  if (a === 'ping') return { ok: true, seq: store.lastSeq(), hasSnapshot: !!sn, snapshotSeq: sn ? sn.seq : 0, gen: store.gen() };
  if (a === 'snapshot_get') { var s = store.snapGet(); return s ? { ok: true, seq: s.seq, state: s.text, gen: store.gen() } : { ok: false, error: 'empty' }; }
  /* documents and photos: kept as separate files, never inside the database file */
  if (a === 'file_put' || a === 'file_get' || a === 'file_del') {
    var fid = String(req.id || '');
    if (!/^[A-Za-z0-9_-]{6,40}$/.test(fid)) return { ok: false, error: 'file' };
    if (a === 'file_put') { if (!req.data) return { ok: false, error: 'file' }; store.filePut({ id: fid, name: String(req.name || 'file').slice(0, 120), mime: String(req.mime || 'application/octet-stream'), childId: String(req.childId || ''), kind: String(req.kind || ''), user: String(req.user || '') }, String(req.data)); return { ok: true, id: fid }; }
    if (a === 'file_get') { var fl = store.fileGet(fid); return fl ? { ok: true, id: fid, name: fl.name, mime: fl.mime, data: fl.data } : { ok: false, error: 'nofile' }; }
    store.fileDel(fid); return { ok: true, id: fid };
  }
  if (a === 'restart') { store.reset(); sn = null; req.seq = 0; a = 'snapshot_put'; }
  if (req.gen && req.gen !== store.gen()) return { ok: false, error: 'reset', gen: store.gen() };
  if (a === 'snapshot_put') {
    var seq = Number(req.seq) || 0;
    if (sn && seq < sn.seq) return { ok: true, seq: store.lastSeq(), kept: true };
    if (seq > store.lastSeq()) return { ok: false, error: 'reset' };
    var st = JSON.parse(req.state), known = {}, add = [], rows = store.idsAll(), i;
    for (i = 0; i < rows.length; i++) known[rows[i].id] = 1;
    for (i = 0; i < (st.children || []).length; i++) { var c = st.children[i], id = String(c.id); if (!known[id]) { known[id] = 1; add.push({ id: id, uid: c.uid || '' }); } }
    if (add.length) store.idsAdd(add);
    store.snapPut(seq, req.state);
    return { ok: true, seq: store.lastSeq(), gen: store.gen() };
  }
  if (a === 'sync') {
    if (!sn) return { ok: false, error: 'empty' };
    var since = Number(req.since) || 0;
    if (since > store.lastSeq()) return { ok: false, error: 'reset', gen: store.gen() };
    var assigned = {};
    if (req.changes) {
      var ch = req.changes, all = store.idsAll(), byId = {}, byUid = {}, max = 0, toAdd = [], news = {}, k, n;
      for (k = 0; k < all.length; k++) { byId[all[k].id] = all[k].uid || ''; if (all[k].uid) byUid[all[k].uid] = all[k].id; n = Number(all[k].id); if (n === n && n > max) max = n; }
      for (k = 0; k < (ch.newKids || []).length; k++) news[ch.newKids[k]] = 1;
      for (k = 0; k < (ch.children || []).length; k++) {
        var kid = ch.children[k], kidId = String(kid.id), uid = kid.uid || '';
        if (uid && byUid[uid] != null) { if (byUid[uid] !== kidId) assigned[uid] = byUid[uid]; continue; }
        if (uid && news[uid] && byId[kidId] != null && byId[kidId] !== uid) { max = max + 1; var nid = String(max); assigned[uid] = nid; byId[nid] = uid; byUid[uid] = nid; toAdd.push({ id: nid, uid: uid }); continue; }
        if (byId[kidId] == null) { byId[kidId] = uid; if (uid) byUid[uid] = kidId; toAdd.push({ id: kidId, uid: uid }); n = Number(kidId); if (n === n && n > max) max = n; }
      }
      var hasAsg = false; for (k in assigned) hasAsg = true;
      if (hasAsg) ch.idAssign = assigned;
      if (toAdd.length) store.idsAdd(toAdd);
      store.logAppend({ device: String(req.device || ''), user: String(req.user || ''), json: JSON.stringify(ch) });
    }
    var list = store.logRead(since, 40), last = store.lastSeq(), items = [], cur = since;
    for (var r = 0; r < list.length; r++) { cur = list[r].seq; if (list[r].device === String(req.device || '')) continue; items.push({ seq: list[r].seq, device: list[r].device, user: list[r].user, changes: JSON.parse(list[r].json) }); }
    return { ok: true, seq: cur, more: cur < last, items: items, assigned: assigned, snapshotSeq: sn.seq, last: last, gen: store.gen() };
  }
  return { ok: false, error: 'action' };
}

/* ===== Google side: a Google Sheet holds the log of changes, Drive holds the app and the full copy ===== */
var CHUNK = 40000, SNAP_FILE = 'cyp-edu-snapshot.json';
function props_() { return PropertiesService.getScriptProperties(); }
/* the Google Sheet that holds the database (the long code in its address) */
var SHEET_ID = '1MnYRaXo1dYnIsoty8mQ3LxH9ZAzl-sxJE3ZPutX_OBw';
var BOOK_ = null;
function book_() { if (!BOOK_) BOOK_ = SpreadsheetApp.openById(SHEET_ID); return BOOK_; }
function sheet_(name, head) {
  var sh = book_().getSheetByName(name);
  if (!sh) { sh = book_().insertSheet(name); sh.getRange(1, 1, 1, head.length).setValues([head]); sh.setFrozenRows(1); sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).setNumberFormat('@'); }
  return sh;
}
function folder_() { var it = DriveApp.getFileById(book_().getId()).getParents(); return it.hasNext() ? it.next() : DriveApp.getRootFolder(); }
var FILES_FOLDER = 'CYP EDU files';
function filesFolder_() { var f = folder_(), it = f.getFoldersByName(FILES_FOLDER); return it.hasNext() ? it.next() : f.createFolder(FILES_FOLDER); }
function filesSheet_() { return sheet_('files', ['id', 'driveId', 'name', 'mime', 'bytes', 'time', 'user', 'childId', 'kind']); }
function fileRow_(id) { var sh = filesSheet_(), n = sh.getLastRow() - 1; if (n < 1) return 0; var hit = sh.getRange(2, 1, n, 1).createTextFinder(id).matchEntireCell(true).findNext(); return hit ? hit.getRow() : 0; }
function store_() {
  var log = sheet_('log', ['seq', 'time', 'device', 'user', 'parts', 'data']), ids = sheet_('ids', ['id', 'uid']), P = props_();
  return {
    filePut: function (m, b64) {
      if (fileRow_(m.id)) return;
      var bytes = Utilities.base64Decode(b64), file = filesFolder_().createFile(Utilities.newBlob(bytes, m.mime, m.id + '__' + m.name)), sh = filesSheet_();
      sh.getRange(sh.getLastRow() + 1, 1, 1, 9).setNumberFormat('@').setValues([[m.id, file.getId(), m.name, m.mime, String(bytes.length), new Date().toISOString(), m.user, m.childId, m.kind]]);
    },
    fileGet: function (id) {
      var r = fileRow_(id); if (!r) return null;
      var v = filesSheet_().getRange(r, 1, 1, 4).getValues()[0]; if (!v[1]) return null;
      var file = DriveApp.getFileById(String(v[1])); if (file.isTrashed()) return null;
      return { name: String(v[2]), mime: String(v[3]), data: Utilities.base64Encode(file.getBlob().getBytes()) };
    },
    fileDel: function (id) {
      var r = fileRow_(id); if (!r) return;
      var sh = filesSheet_(), did = String(sh.getRange(r, 2).getValue());
      if (did) { try { DriveApp.getFileById(did).setTrashed(true); } catch (x) {} }
      sh.getRange(r, 2).setValue(''); sh.getRange(r, 3).setValue('(deleted)');
    },
    key: function () { return P.getProperty('key') || ''; },
    gen: function () { var x = P.getProperty('gen'); if (!x) { x = Utilities.getUuid().slice(0, 8); P.setProperty('gen', x); } return x; },
    reset: function () {
      if (log.getLastRow() > 1) log.getRange(2, 1, log.getLastRow() - 1, log.getMaxColumns()).clearContent();
      if (ids.getLastRow() > 1) ids.getRange(2, 1, ids.getLastRow() - 1, 2).clearContent();
      P.setProperty('gen', Utilities.getUuid().slice(0, 8)); P.setProperty('snapSeq', '0');
    },
    lastSeq: function () { return Math.max(0, log.getLastRow() - 1); },
    logAppend: function (r) {
      var parts = []; for (var i = 0; i < r.json.length; i += CHUNK) parts.push('~' + r.json.substr(i, CHUNK));
      var seq = log.getLastRow(), row = [String(seq), new Date().toISOString(), r.device, r.user, String(parts.length)].concat(parts);
      if (log.getMaxColumns() < row.length) { log.insertColumnsAfter(log.getMaxColumns(), row.length - log.getMaxColumns()); log.getRange(1, 1, log.getMaxRows(), log.getMaxColumns()).setNumberFormat('@'); }
      log.getRange(seq + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    },
    logRead: function (since, limit) {
      var last = log.getLastRow() - 1; if (last <= since) return [];
      var n = Math.min(limit, last - since), vals = log.getRange(since + 2, 1, n, log.getLastColumn()).getValues(), out = [];
      for (var i = 0; i < vals.length; i++) { var v = vals[i], parts = Number(v[4]) || 0, js = ''; for (var j = 0; j < parts; j++) js += String(v[5 + j]).substr(1); out.push({ seq: since + 1 + i, device: String(v[2]), user: String(v[3]), json: js }); }
      return out;
    },
    idsAll: function () { var n = ids.getLastRow() - 1; if (n < 1) return []; var v = ids.getRange(2, 1, n, 2).getValues(), out = []; for (var i = 0; i < v.length; i++) out.push({ id: String(v[i][0]), uid: String(v[i][1] || '') }); return out; },
    idsAdd: function (list) { var rows = []; for (var i = 0; i < list.length; i++) rows.push([String(list[i].id), String(list[i].uid || '')]); ids.getRange(ids.getLastRow() + 1, 1, rows.length, 2).setNumberFormat('@').setValues(rows); },
    snapMeta: function () { var id = P.getProperty('snapId'); return id ? { seq: Number(P.getProperty('snapSeq')) || 0, id: id } : null; },
    snapGet: function () { var m = this.snapMeta(); if (!m) return null; return { seq: m.seq, text: DriveApp.getFileById(m.id).getBlob().getDataAsString('UTF-8') }; },
    snapPut: function (seq, text) {
      var m = this.snapMeta(), f = folder_();
      if (m) DriveApp.getFileById(m.id).setContent(text); else { var file = f.createFile(SNAP_FILE, text, 'application/json'); P.setProperty('snapId', file.getId()); }
      P.setProperty('snapSeq', String(seq));
      var day = new Date().toISOString().slice(0, 10), name = 'cyp-edu-backup-' + day + '.json';
      if (P.getProperty('backupDay') !== day) { f.createFile(name, text, 'application/json'); P.setProperty('backupDay', day); }
    }
  };
}
function reply_(o) { try { o.now = new Date().getTime(); } catch (x) {} /* the app compares it with the clock of the device */ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  var lock = null;
  try {
    var req = JSON.parse(e.postData.contents);
    /* only one device writes at a time; reading needs no waiting */
    if (req.changes || req.action === 'snapshot_put' || req.action === 'restart' || req.action === 'file_put' || req.action === 'file_del') { lock = LockService.getScriptLock(); lock.waitLock(25000); }
    return reply_(cypHandle(req, store_()));
  } catch (err) { return reply_({ ok: false, error: 'server', detail: String(err) }); }
  finally { if (lock) { try { lock.releaseLock(); } catch (x) {} } }
}
function doGet(e) { return ContentService.createTextOutput('CYP EDU shared database · files'); }
/* Run once from the editor: prepares the sheets and the key. */
function setup() {
  store_();
  if (!props_().getProperty('key')) props_().setProperty('key', (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''));
  Logger.log('Ready. Now: Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone. Then run the function "link".');
}
/* Run after the deployment: shows the key. The link to paste in the app is the web app URL followed by ?k= and the key.
   The web app URL is in Deploy > Manage deployments (it ends with /exec). The editor cannot read that URL by itself. */
function link() {
  Logger.log('Key: ' + props_().getProperty('key'));
  Logger.log('Link for the app = web app URL from "Manage deployments" + ?k= + the key above.');
}

/* ---------- the copy of every night ----------
   Every night at about 2 (Ndola time) the database copies itself into the folder "CYP EDU backups", next to the Sheet.
   One folder for each night, with: a copy of the Sheet (every change received, the IDs, the list of the files),
   a copy of the full file of the records, and a short text that says what the copy holds.
   The last 30 nights are kept; older folders go to the bin of Drive. The documents and photos in "CYP EDU files" are not copied: they never change once sent.
   Run backupOn once from this editor to start it (Google asks to allow the script to run by itself). backupOff stops it. backupNow makes a copy at once.
   When the lock of the app is on, the copies are locked too: they open only with the key that is inside the staff link. */
var BACKUP_FOLDER = 'CYP EDU backups', BACKUP_KEEP = 30, BACKUP_TZ = 'Africa/Lusaka', BACKUP_HOUR = 2;
function backupsFolder_() { var f = folder_(), it = f.getFoldersByName(BACKUP_FOLDER); return it.hasNext() ? it.next() : f.createFolder(BACKUP_FOLDER); }
function nightlyBackup() {
  var now = new Date(), day = Utilities.formatDate(now, BACKUP_TZ, 'yyyy-MM-dd'), time = Utilities.formatDate(now, BACKUP_TZ, 'HH:mm');
  var P = props_(), changes = 0, sheetId = '', snapCopy = '', result = 'ok', kept = 0;
  try {
    var root = backupsFolder_(), it = root.getFoldersByName(day), dir = it.hasNext() ? it.next() : root.createFolder(day);
    var old = dir.getFiles(); while (old.hasNext()) old.next().setTrashed(true); /* a second copy on the same day replaces the first */
    var logSheet = book_().getSheetByName('log'); changes = logSheet ? Math.max(0, logSheet.getLastRow() - 1) : 0;
    sheetId = DriveApp.getFileById(SHEET_ID).makeCopy('CYP EDU database ' + day, dir).getId();
    var snapId = P.getProperty('snapId');
    if (snapId) snapCopy = DriveApp.getFileById(snapId).makeCopy('cyp-edu-snapshot ' + day + '.json', dir).getId();
    dir.createFile('about this copy.txt', ['CYP EDU, copy of the shared database', 'Made: ' + day + ' ' + time + ' (Ndola time)', 'Changes in the log: ' + changes,
      'Full file of the records: ' + (snapId ? 'made at change ' + (P.getProperty('snapSeq') || '0') : 'not made yet'), 'Database number: ' + (P.getProperty('gen') || ''),
      '', 'To use this copy: the full file of the records plus the changes after it in the sheet "log" of the copied Sheet are the whole database at that time.',
      'The documents and photos are in the folder "CYP EDU files" and are not part of this copy.'].join('\n'), 'text/plain');
    var all = [], fs = root.getFolders(); while (fs.hasNext()) { var d = fs.next(); if (/^\d{4}-\d{2}-\d{2}$/.test(d.getName())) all.push(d); }
    all.sort(function (a, b) { return a.getName() < b.getName() ? 1 : -1; });
    for (var i = BACKUP_KEEP; i < all.length; i++) all[i].setTrashed(true);
    kept = Math.min(all.length, BACKUP_KEEP);
  } catch (e) { result = 'FAILED: ' + e; }
  try { sheet_('backups', ['day', 'time', 'changes in the log', 'copy of the Sheet', 'copy of the records', 'nights kept', 'result']).appendRow([day, time, String(changes), sheetId, snapCopy, String(kept), result]); } catch (x) {}
  if (result !== 'ok') throw new Error(result); /* Google then writes to the owner of the script */
  return result;
}
function backupNow() { Logger.log(nightlyBackup()); }
function backupOn() {
  backupOff();
  ScriptApp.newTrigger('nightlyBackup').timeBased().everyDays(1).atHour(BACKUP_HOUR).nearMinute(0).inTimezone(BACKUP_TZ).create();
  Logger.log('The copy of every night is on: about ' + BACKUP_HOUR + ':00, ' + BACKUP_TZ + '. Folder: ' + BACKUP_FOLDER + '.');
}
function backupOff() { var t = ScriptApp.getProjectTriggers(); for (var i = 0; i < t.length; i++) if (t[i].getHandlerFunction() === 'nightlyBackup') ScriptApp.deleteTrigger(t[i]); }
