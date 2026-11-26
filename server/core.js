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
