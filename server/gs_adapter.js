
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
function store_() {
  var log = sheet_('log', ['seq', 'time', 'device', 'user', 'parts', 'data']), ids = sheet_('ids', ['id', 'uid']), P = props_();
  return {
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
function reply_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  var lock = null;
  try {
    var req = JSON.parse(e.postData.contents);
    /* only one device writes at a time; reading needs no waiting */
    if (req.changes || req.action === 'snapshot_put' || req.action === 'restart') { lock = LockService.getScriptLock(); lock.waitLock(25000); }
    return reply_(cypHandle(req, store_()));
  } catch (err) { return reply_({ ok: false, error: 'server', detail: String(err) }); }
  finally { if (lock) { try { lock.releaseLock(); } catch (x) {} } }
}
function doGet(e) { return ContentService.createTextOutput('CYP EDU shared database'); }
/* Run once from the editor: prepares the sheets and the key. */
function setup() {
  store_();
  if (!props_().getProperty('key')) props_().setProperty('key', (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''));
  Logger.log('Ready. Now: Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone. Then run the function "link".');
}
/* Run after the deployment: shows the link of the shared database, to paste in the app once. */
function link() {
  var url = ScriptApp.getService().getUrl();
  if (!url) { Logger.log('Not deployed yet: Deploy > New deployment > Web app.'); return; }
  Logger.log(url.replace(/\/dev$/, '/exec') + '?k=' + props_().getProperty('key'));
}

/* note 2026-11-11: link() no longer builds the URL, see Code.gs */
