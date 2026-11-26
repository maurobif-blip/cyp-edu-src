
/* ====================================================================
   Documents of the child and photos of the visits.
   The file of the child keeps only the list (c.docs); the files are kept apart:
   on this device until they are sent, then on Drive through the database script (file_put, file_get, file_del).
   ==================================================================== */
const DOC_KINDS = ['Birth certificate', 'Case study', 'School report', 'Other document'];
const FILE_MAX = 3 * 1024 * 1024;
const FILE_PICK = {};
function fileStore(mode, fn) { return idb().then(db => new Promise((res, rej) => { const tx = db.transaction(DB_STORE, mode), rq = fn(tx.objectStore(DB_STORE)); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); })); }
function fileLocalPut(rec) { return fileStore('readwrite', s => s.put(rec, 'file:' + rec.id)); }
function fileLocalGet(id) { return fileStore('readonly', s => s.get('file:' + id)).catch(() => null); }
function fileLocalDel(id) { return fileStore('readwrite', s => s.delete('file:' + id)).catch(() => null); }
function filesOut() { try { return JSON.parse(lsGet('cyp-files-out') || '[]'); } catch (e) { return []; } }
function filesOutSet(l) { try { localStorage.setItem('cyp-files-out', JSON.stringify(l)); } catch (e) {} }
function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
/* a photo is made smaller before it is kept: 1600 pixels on the long side is enough to read a certificate */
function fileRead(file) {
  return new Promise((res, rej) => {
    const rd = new FileReader(); rd.onerror = () => rej(new Error('read'));
    if (/^image\//.test(file.type)) {
      rd.onload = () => { const im = new Image(); im.onerror = () => rej(new Error('image'));
        im.onload = () => { const k = Math.min(1, 1600 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); const u = cv.toDataURL('image/jpeg', 0.8), data = u.slice(u.indexOf(',') + 1); res({ name: file.name.replace(/\.[^.]+$/, '') + '.jpg', mime: 'image/jpeg', data, size: Math.round(data.length * 0.75) }); };
        im.src = rd.result; };
      rd.readAsDataURL(file);
    } else {
      if (file.size > FILE_MAX) return rej(new Error('big'));
      rd.onload = () => { const u = String(rd.result), data = u.slice(u.indexOf(',') + 1); res({ name: file.name, mime: file.type || 'application/octet-stream', data, size: file.size }); };
      rd.readAsDataURL(file);
    }
  });
}
function filePickField(slot, label) { return `<label class="f wide">${label}<input class="in" type="file" accept="image/*,application/pdf" data-file="${slot}"><span class="hint" data-fileinfo="${slot}">Photo or PDF, up to 3 MB.</span></label>`; }
document.addEventListener('change', e => {
  const inp = e.target; if (!inp.matches || !inp.matches('input[type="file"][data-file]')) return;
  const slot = inp.dataset.file, info = document.querySelector(`[data-fileinfo="${slot}"]`), f = inp.files && inp.files[0]; delete FILE_PICK[slot]; if (!f) return;
  if (info) info.textContent = 'Reading the file…';
  fileRead(f).then(x => { FILE_PICK[slot] = x; if (info) info.textContent = 'Ready: ' + x.name + ' · ' + kb(x.size); }).catch(err => { inp.value = ''; if (info) info.textContent = err.message === 'big' ? 'Too big: the limit is 3 MB.' : 'This file cannot be read.'; });
});
/* keep the picked file on this device and put it in the queue to send */
function fileKeep(slot, childId, kind) {
  const x = FILE_PICK[slot]; if (!x) return null; delete FILE_PICK[slot];
  const rec = { id: uid('f'), name: x.name, mime: x.mime, data: x.data, size: x.size, childId: String(childId || ''), kind: kind || '' };
  filesOutSet(filesOut().concat(rec.id));
  fileLocalPut(rec).then(() => filesFlush()).catch(() => { filesOutSet(filesOut().filter(x => x !== rec.id)); toast('The file could not be kept on this device'); });
  return rec;
}
let FILES_BUSY = false;
async function filesFlush() {
  if (FILES_BUSY || !syncOn() || !navigator.onLine) return; FILES_BUSY = true;
  try {
    for (const id of filesOut()) {
      const rec = await fileLocalGet(id); if (!rec) { filesOutSet(filesOut().filter(x => x !== id)); continue; }
      const r = await syncPost({ action: 'file_put', id: rec.id, name: rec.name, mime: rec.mime, data: rec.data, childId: rec.childId, kind: rec.kind, user: USER ? USER.name : '' });
      if (r && r.ok) { filesOutSet(filesOut().filter(x => x !== id)); await fileLocalDel(id); } else break;
    }
  } catch (e) {} finally { FILES_BUSY = false; if (document.querySelector('#docsbox, #checkbox, #visitrep')) render(); }
}
window.addEventListener('online', () => filesFlush());
setInterval(() => { if (filesOut().length) filesFlush(); }, 60000);
async function fileOpen(id, name) {
  let rec = await fileLocalGet(id);
  if (!rec) { if (!syncOn() || !navigator.onLine) return toast('Internet is needed to open this file'); toast('Opening…'); let r = null; try { r = await syncPost({ action: 'file_get', id }); } catch (e) {} if (!r || !r.ok) return toast(r && r.error === 'nofile' ? 'This file is not in the database' : 'The file could not be opened'); rec = r; }
  if (/^image\//.test(rec.mime)) return photoBig('data:' + rec.mime + ';base64,' + rec.data, name || rec.name);
  const bin = atob(rec.data), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([arr], { type: rec.mime })), a = document.createElement('a'); a.href = url; a.target = '_blank'; a.download = rec.name || name || 'document'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function docsBox(c) {
  if (GUEST) return '';
  const list = (c.docs || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')), out = new Set(filesOut()), has = k => list.some(d => d.kind === k);
  return `<section class="card" id="docsbox"><h2>Documents</h2>
    <p style="margin:4px 0 8px">Birth certificate: ${has('Birth certificate') ? '<span class="chip c-green">In the file</span>' : '<span class="chip c-orange">Missing</span>'}</p>
    ${list.map(d => `<div class="it"><div class="w"><b>${esc(d.kind)}</b><span>${esc([d.note, d.name, kb(d.size || 0)].filter(Boolean).join(' · '))}</span><span class="sub">${esc(fmtDate(d.date))} · ${esc(staffName(d.by))}${out.has(d.id) ? ' · waiting for internet to be sent' : ''}</span></div><button class="btn sm" data-dact="open" data-id="${esc(d.id)}" data-name="${esc(d.kind + ' ' + fullName(c))}">Open</button>${USER.admin ? `<button class="btn sm" data-dact="del" data-id="${esc(d.id)}" data-child="${esc(c.id)}">Remove</button>` : ''}</div>`).join('')}
    <form data-form="docadd" style="margin-top:10px"><input type="hidden" name="id" value="${esc(c.id)}"><div class="fs two">${field('Document', 'kind', '', 'select', { req: true, options: opt(DOC_KINDS, has('Birth certificate') ? 'Case study' : 'Birth certificate') })}${field('Date', 'date', today(), 'date', { req: true })}${field('Note', 'note', '', 'text', { wide: true })}${filePickField('doc', 'File')}</div><button class="btn pri" style="margin-top:10px">Add the document</button></form></section>`;
}
FORMS.docadd = function (o) {
  const c = child(o.id); if (!c) return; if (!FILE_PICK.doc) return toast('Choose the file first');
  const rec = fileKeep('doc', c.id, o.kind); c.docs = (c.docs || []).concat({ id: rec.id, kind: o.kind, name: rec.name, mime: rec.mime, size: rec.size, date: o.date || today(), note: (o.note || '').trim(), by: USER.id });
  c.updatedAt = today(); save(); toast(syncOn() && navigator.onLine ? 'Document added' : 'Document added. It will be sent when internet is back'); render();
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-dact]'); if (!b) return; e.preventDefault();
  if (b.dataset.dact === 'open') return void fileOpen(b.dataset.id, b.dataset.name);
  if (b.dataset.dact === 'del') { const c = child(b.dataset.child); if (!c || !USER.admin || !confirm('Remove this document? The file is deleted for everyone.')) return; c.docs = (c.docs || []).filter(d => d.id !== b.dataset.id); c.docsGone = (c.docsGone || []).concat(b.dataset.id); c.updatedAt = today(); save(); filesOutSet(filesOut().filter(x => x !== b.dataset.id)); fileLocalDel(b.dataset.id); if (syncOn()) syncPost({ action: 'file_del', id: b.dataset.id }).catch(() => {}); render(); }
  if (b.dataset.dact === 'cancelvisit') { const v = S.visits.find(x => x.id === b.dataset.id); if (!v || !visitCanCancel(v)) return;
    askBox({ title: 'Cancel this visit?', body: [fmtDate(v.date), teamLabel(visitTeam(v)), v.purpose, 'by ' + staffName(v.by)].filter(Boolean).join(' · ') + '\nIt leaves the lists and the reports.', why: true, ok: 'Cancel the visit', keep: 'Keep the visit' }).then(why => { if (why == null) return;
      const ph = visitPhotos(v);
      S.events.push({ id: uid('e'), childId: String(v.childId), type: 'Visit cancelled', ref: v.id, date: today(), ts: Date.now(), note: [fmtDate(v.date), teamLabel(visitTeam(v)), v.purpose, 'by ' + staffName(v.by)].filter(Boolean).join(' · ') + '. Why: ' + why, by: USER.id });
      dropCancelled(); save(); for (const id of ph) { filesOutSet(filesOut().filter(x => x !== id)); fileLocalDel(id); if (syncOn() && navigator.onLine) syncPost({ action: 'file_del', id }).catch(() => {}); }
      toast('Visit cancelled'); if (history.length > 1) history.back(); else go('#/visits'); });
    return; }
  if (b.dataset.dact === 'cancelrec') { const kind = b.dataset.kind, x = recFind(kind, b.dataset.id); if (!recCanCancel(kind, x)) return;
    askBox({ title: 'Cancel this line?', body: recText(kind, x) + '\nIt leaves the history and the reports.', why: true, ok: 'Cancel the line', keep: 'Keep the line' }).then(why => { if (why == null) return;
      if (kind === 'move') moveUndo(x);
      S.events.push({ id: uid('e'), childId: String(x.childId || (x.children || [])[0] || ''), type: 'Record cancelled', ref: x.id, kind, date: today(), ts: Date.now(), note: recText(kind, x) + ' · by ' + staffName(x.by) + '. Why: ' + why, by: USER.id });
      dropCancelled(); save(); toast('Cancelled'); render(); });
    return; }
  if (b.dataset.dact === 'clearsheet') { const sh = lSheet(b.dataset.k), d = b.dataset.d, s = luigiSess(d, sh.type, false); if (!s || GUEST) return;
    askBox({ title: 'Cancel the ' + sh.label.toLowerCase() + ' sheet of ' + fmtDate(d) + '?', body: 'The ' + (s.children || []).length + ' names, the staff and the notes of this sheet are removed.', ok: 'Cancel the sheet', keep: 'Keep the sheet' }).then(yes => { if (yes == null) return;
      for (const id of (s.children || []).slice()) luigiToggle(id, d, sh.type, false);
      const t = touchSheet(d, sh.type); t.staff = 1; t.notes = 1; t.findings = 1; const s2 = luigiSess(d, sh.type, false); if (s2) { s2.staffIds = []; s2.staff = ''; s2.notes = ''; s2.findings = ''; } luigiClean();
      save(); toast('Sheet cancelled'); render(); });
    return; }
  if (b.dataset.dact === 'goback') { if (history.length > 1) history.back(); else go('#/visits?vtab=check'); return; }
  if (b.dataset.dact === 'valid' || b.dataset.dact === 'back') {
    const v = S.visits.find(x => x.id === b.dataset.id); if (!v || !visitCanValidate(v)) return; let note = b.dataset.note || '';
    if (b.dataset.dact === 'back' && !note) { const inp = b.closest('.chk').querySelector('input[name="note"]'); note = inp ? inp.value.trim() : ''; if (!note) { toast('Write what is missing'); if (inp) inp.focus(); return; } }
    S.events.push({ id: uid('e'), childId: String(v.childId), type: b.dataset.dact === 'valid' ? 'Visit validated' : 'Visit sent back', ref: visitKey(v), date: today(), ts: Date.now(), note, by: USER.id }); save(); toast(b.dataset.dact === 'valid' ? 'Validated' : 'Sent back');
    if (route().path === 'visitrep' && history.length > 1) history.back(); else render();
  }
});

/* ---------- validation of the visits: the reports count only what the supervisor has validated ---------- */
const VALID_FROM = '2026-11-17';
const VISIT_EV = ['Visit validated', 'Visit sent back', 'Visit sent again'];
/* a visit that was changed is a new line with the same root: validation follows the root */
function visitKey(v) { return v.root || v.id; }
function visitTrail(v) { const k = visitKey(v); return S.events.filter(e => e.ref === k && VISIT_EV.includes(e.type)).sort((x, y) => (x.ts || 0) - (y.ts || 0)); }
function visitCheck(v) { const k = visitKey(v); let last = null; for (const e of S.events) if (e.ref === k && VISIT_EV.includes(e.type) && (!last || (e.ts || 0) >= (last.ts || 0))) last = e; return last; }
function visitCanValidate(v) { return !GUEST && USER.admin && !visitMine(v); } /* nobody validates his own visit */
function visitCanEdit(v) { if (GUEST) return false; const s = visitState(v); return s === 'old' ? (USER.admin || visitMine(v)) : (s === 'wait' || s === 'back') && visitMine(v); }
function editFill() {
  const f = document.querySelector('form[data-form="visit"]'), h = f && f.querySelector('input[name="edit"]'); if (!h) return; const v = S.visits.find(x => x.id === h.value); if (!v) return;
  for (const el of f.elements) { if (!el.name || el.type === 'file' || el.type === 'hidden' || el.name === 'team' || el.name.startsWith('refer')) continue; const val = v[el.name]; if (val == null) continue;
    if (el.tagName === 'SELECT') { if ([...el.options].some(x => x.value === String(val))) el.value = String(val); } else el.value = String(val); }
}
/* a visit written by an Education admin needs no validation: it counts as it is */
function visitFree(v) { const s = S.staff.find(x => x.id === (v.recordedBy || v.by)); return !!(s && s.admin); }
function visitState(v) { if ((v.recordedOn || v.date || '') < VALID_FROM || visitFree(v)) return 'old'; const e = visitCheck(v); return !e || e.type === 'Visit sent again' ? 'wait' : e.type === 'Visit validated' ? 'ok' : 'back'; }
function visitCounts(v) { const s = visitState(v); return s === 'old' || s === 'ok'; }
function visitChip(v) { const s = visitState(v), e = visitCheck(v); return s === 'ok' ? `<span class="chip c-green">Validated by ${esc(staffName(e.by))}</span>` : s === 'back' ? `<span class="chip c-red">Sent back: ${esc(e.note || '')}</span>` : s === 'wait' ? '<span class="chip c-orange">To validate</span>' : ''; }
/* a visit recorded by mistake is cancelled: it leaves the lists, a line stays in the history of the child */
function visitCanCancel(v) { if (GUEST) return false; const s = visitState(v); return USER.admin || (visitMine(v) && (s === 'wait' || s === 'back')); }
const CANCEL_EV = ['Visit cancelled', 'Visit corrected', 'Record cancelled'];
function dropCancelled() {
  if (typeof S !== 'object' || !S || !S.events || !S.visits) return; let gone = null; for (const e of S.events) if (e.ref && CANCEL_EV.includes(e.type)) (gone = gone || new Set()).add(e.ref); if (!gone) return;
  for (const k of ['visits', 'sessions', 'moves', 'events']) if ((S[k] || []).some(x => gone.has(x.id))) S[k] = S[k].filter(x => !gone.has(x.id));
}
/* every line written by mistake can be cancelled by who wrote it or by a supervisor; a line stays in the history */
const KEEP_EV = VISIT_EV.concat(CANCEL_EV, ['Referral closed']);
function lastOfType(c, type) { let last = null; S.moves.forEach(m => { if (String(m.childId) === String(c.id) && m.type === type && (!last || (m.date || '') >= (last.date || ''))) last = m; }); return last; }
function moveCan(m) {
  const c = child(m.childId); if (!c || m.src) return false; const last = lastOfType(c, m.type); if (!last || last.id !== m.id) return false;
  if (m.type === 'section') return c.section === m.to && !!SECTIONS[m.from];
  if (m.type === 'residence') return c.residence === m.to;
  if (m.type === 'status') return c.status === m.to && !!m.from;
  if (m.type === 'street') return (c.streetCat || '') === (m.to || '');
  if (m.type === 'reintegrated') return c.status === 'Follow-up' && c.reintegrationDate === m.date;
  if (m.type === 'closed') return c.status === 'Closed' && (c.closeDate || '') === (m.date || '');
  if (m.type === 'reopened') { const cl = lastOfType(c, 'closed'); return c.status !== 'Closed' && !!cl && (cl.date || '') <= (m.date || ''); }
  if (m.type === 'handover') return c.responsible === m.to;
  return false;
}
function moveUndo(m) {
  const c = child(m.childId);
  if (m.type === 'section') c.section = m.from;
  else if (m.type === 'residence') c.residence = m.from || '';
  else if (m.type === 'status') c.status = m.from;
  else if (m.type === 'street') { c.streetCat = m.from || ''; if (c.connectionDate === m.date) c.connectionDate = ''; }
  else if (m.type === 'reintegrated') { c.status = m.prev || 'Active'; c.reintegrationDate = ''; }
  else if (m.type === 'closed') { c.status = m.prev || (c.reintegrationDate ? 'Follow-up' : 'Active'); c.closeDate = ''; c.closeReason = ''; }
  else if (m.type === 'reopened') { const cl = lastOfType(c, 'closed'), re = lastOfType(c, 'reintegrated'); c.status = 'Closed'; c.closeDate = cl.date || ''; c.closeReason = cl.reason || ''; if (re && cl.prev === 'Follow-up') c.reintegrationDate = re.date; }
  else if (m.type === 'handover') c.responsible = m.from;
  c.updatedAt = today();
}
function recFind(kind, id) { return ((kind === 'event' ? S.events : kind === 'move' ? S.moves : S.sessions) || []).find(x => x.id === id); }
function recCanCancel(kind, x) {
  if (GUEST || !x || !(USER.admin || x.by === USER.id || x.recordedBy === USER.id)) return false;
  if (kind === 'event') return !KEEP_EV.includes(x.type);
  if (kind === 'move') return moveCan(x);
  return kind === 'session';
}
function recText(kind, x) { return kind === 'event' ? fmtDate(x.date) + ' · ' + (x.type === 'Referral' ? 'Referred to ' + referLabel(x.to) : x.type) + (x.note ? ': ' + x.note : '') : kind === 'move' ? fmtDate(x.date) + ' · ' + moveLabel(x) : fmtDate(x.date) + ' · Counselling, ' + String(x.type || '').toLowerCase() + ' session' + (x.topic ? ': ' + x.topic : ''); }
function cancelBtn(kind, x) { return recCanCancel(kind, x) ? ` <button type="button" class="btn link sub cx" data-dact="cancelrec" data-kind="${kind}" data-id="${esc(x.id)}">Cancel</button>` : ''; }
function visitPhotos(v) { return [v.photo].concat(visitTrail(v).map(e => e.file)).filter(Boolean); }
function visitMine(v) { return v.by === USER.id || v.recordedBy === USER.id; }
function visitsToCheck(team, centre) { return S.visits.filter(v => { const s = visitState(v); return (s === 'wait' || s === 'back') && tmatch(visitTeam(v), team) && vcIn(child(v.childId), team, centre) && child(v.childId); }).sort((a, b) => (a.date || '').localeCompare(b.date || '')); }
function checkHtml(team, centre) {
  const all = visitsToCheck(team, centre), back = all.filter(v => visitState(v) === 'back'), wait = all.filter(v => visitState(v) === 'wait'), list = USER.admin ? wait.concat(back) : back.concat(wait);
  const item = v => { const c = child(v.childId), st = visitState(v), ph = visitPhotos(v);
    return `<div class="chk"><div class="w"><b>${childLink(c)}</b> ${centreChip(c)} ${visitChip(v)}<div class="sub">${esc(fmtDate(v.date))} · ${esc(teamLabel(visitTeam(v)))} · ${esc(v.purpose || '')} · ${esc(staffName(v.by))}${v.successful === 'No' ? ' · nobody found' : ''}${v.metWith ? ' · met ' + esc(v.metWith) : ''}${v.place ? ' · ' + esc(v.place) : ''}</div>${v.findings ? `<div>${esc(v.findings.slice(0, 200))}${v.findings.length > 200 ? '…' : ''}</div>` : ''}${v.action ? `<div class="sub">Action: ${esc(v.action)}</div>` : ''}</div>
      <div class="chka">${ph.length ? `<button class="btn sm" data-dact="open" data-id="${esc(ph[ph.length - 1])}" data-name="Visit ${esc(fullName(c))} ${esc(v.date)}">See the photo</button>` : '<span class="chip c-orange">No photo</span>'}<a class="btn sm pri" href="#/visitrep/${esc(v.id)}">Open the report</a>${visitCanValidate(v) && st === 'wait' ? `<button class="btn sm" data-dact="valid" data-id="${esc(v.id)}">Validate</button><input class="in" name="note" placeholder="What is missing" aria-label="What is missing"><button class="btn sm" data-dact="back" data-id="${esc(v.id)}">Send back</button>` : ''}${st === 'back' && visitCanValidate(v) ? `<button class="btn sm" data-dact="valid" data-id="${esc(v.id)}">Validate</button>` : ''}</div></div>`; };
  return `<section class="card" id="checkbox"><h2>${USER.admin ? 'Visits to validate · ' + wait.length : back.length ? 'Sent back · ' + back.length : 'Waiting for the Education office · ' + wait.length}</h2><p class="sub" style="margin:2px 0 6px">The reports count the visits validated by the Education office. Visits written by the Education office and visits before ${esc(fmtDate(VALID_FROM))} count as they are.</p>${list.length ? list.map(item).join('') : '<p class="empty">Nothing to validate.</p>'}</section>`;
}

/* ---------- the report of one visit on a full page: what the supervisor reads before validating ---------- */
const FILE_MEM = new Map();
async function fileData(id) {
  if (FILE_MEM.has(id)) return FILE_MEM.get(id);
  let rec = await fileLocalGet(id);
  if (!rec && syncOn() && navigator.onLine) { try { const r = await syncPost({ action: 'file_get', id }); if (r && r.ok) rec = r; } catch (e) {} }
  if (rec) { FILE_MEM.set(id, rec); if (FILE_MEM.size > 8) FILE_MEM.delete(FILE_MEM.keys().next().value); }
  return rec;
}
function fileImgs() {
  document.querySelectorAll('[data-fimg]').forEach(async el => {
    if (el.dataset.done) return; el.dataset.done = '1';
    const rec = await fileData(el.dataset.fimg); if (!el.isConnected) return;
    if (!rec) { el.textContent = syncOn() && !navigator.onLine ? 'Internet is needed to see the photo.' : 'The photo could not be opened.'; return; }
    if (/^image\//.test(rec.mime)) el.innerHTML = `<img class="cph vph" src="data:${esc(rec.mime)};base64,${rec.data}" data-name="${esc(el.dataset.name || '')}" alt="Photo of the visit">`;
    else el.innerHTML = `<button class="btn" data-dact="open" data-id="${esc(el.dataset.fimg)}" data-name="${esc(el.dataset.name || '')}">Open ${esc(rec.name || 'the file')}</button>`;
  });
}
function visitRows(v) {
  const school = v.purpose === 'School visit';
  const rows = [['Date', fmtDate(v.date)], ['Section', teamLabel(visitTeam(v))], ['Visited by', staffName(v.by)], v.recordedBy && v.recordedBy !== v.by ? ['Written by', staffName(v.recordedBy)] : null, ['Purpose', v.purpose], ['Where', school ? visitSchool(v) : [v.where, v.place].filter(Boolean).join(' · ')], [school ? 'Did the visit take place?' : 'Was somebody found?', v.successful === 'No' ? 'No, nobody found' : 'Yes'], ['Met with', v.metWith], ['Still living at home', v.stillHome]];
  if (school) rows.push(['Grade teacher', [v.teacher, v.teacherPhone].filter(Boolean).join(' · ')], ['Attendance', v.schAtt], ['Academic performance', [v.perf, v.perfNote].filter(Boolean).join(' · ')], ['Co-curriculum activities', v.cocurr], ['General behaviour', v.behaviour], ['Interaction with the teachers', v.intTeachers], ['Interaction with the schoolmates', v.intMates], ["Teacher's comment", v.teacherComment], ['Weaknesses and/or challenges', v.weak], ['Strengths', v.strong], ['Name of class teacher', v.classTeacher], ['Comparison with the last visit', v.trend], ['Optional subject chosen', v.abaOptional], ['Exams: statement of results', v.abaExam], ['Suggestion from the teacher: academic performance', v.abaSugAcad], ['Change in the academic performance of the last three years', v.aba3y], ['Suggestion from the teacher: social behaviour', v.abaSugSoc]);
  else rows.push(['What was found', v.findings]);
  rows.push([school ? 'Interventions and way forward' : 'Follow-up action', v.action ? v.action + (v.actionDone ? ' (done)' : '') : '']);
  for (const e of S.events) if (e.type === 'Referral' && String(e.childId) === String(v.childId) && e.date === v.date) rows.push(['Referred to', [referLabel(e.to), e.reason, e.note].filter(Boolean).join(' · ')]);
  return rows.filter(r => r && r[1]);
}
function vVisitRep(r) {
  const v = S.visits.find(x => x.id === r.id), c = v && child(v.childId);
  if (!v || !c) return '<div class="top"><div><h1>Visit report</h1></div></div><div class="card"><p class="empty">This visit is not in the database.</p></div>';
  const st = visitState(v), ph = visitPhotos(v), trail = visitTrail(v), nm = 'Visit ' + fullName(c) + ' ' + v.date, mine = visitMine(v);
  const tl = e => `<div class="it"><div class="w"><b>${e.type === 'Visit validated' ? 'Validated' : e.type === 'Visit sent back' ? 'Sent back' : 'Sent again'}</b> <span class="sub">${esc(fmtDate(e.date))} · ${esc(staffName(e.by))}</span>${e.note ? `<div>${esc(e.note)}</div>` : ''}${e.file ? '<div class="sub">Photo added</div>' : ''}</div></div>`;
  const check = USER.admin && visitMine(v) && (st === 'wait' || st === 'back') ? '<p class="sub" style="margin:8px 0 0">Your visit: another person of the Education office validates it.</p>' : visitCanValidate(v) && (st === 'wait' || st === 'back') ? `<div class="chk" style="border:0;padding-bottom:0"><div class="chka" style="width:100%"><button class="btn pri" data-dact="valid" data-id="${esc(v.id)}">Validate</button>${st === 'wait' ? `${ph.length ? '' : `<button class="btn" data-dact="back" data-id="${esc(v.id)}" data-note="Photo missing">Send back: photo missing</button>`}<input class="in" name="note" placeholder="What is missing" aria-label="What is missing" style="flex:1;min-width:160px"><button class="btn" data-dact="back" data-id="${esc(v.id)}">Send back</button>` : ''}</div></div>` : '';
  const again = !GUEST && mine && (st === 'back' || (st === 'wait' && !ph.length)) ? `<form data-form="visitagain" style="display:flex;flex-direction:column;gap:10px;margin-top:10px;max-width:640px"><input type="hidden" name="id" value="${esc(v.id)}">${st === 'back' ? field('What you add', 'note', '', 'textarea', { wide: true, rows: 3 }) : ''}${filePickField('again', 'Photo of the visit')}<div><button class="btn pri">${st === 'back' ? 'Send again' : 'Add the photo'}</button></div></form>` : '';
  setTimeout(fileImgs, 0);
  return `<div class="top"><div><h1>${v.purpose === 'School visit' ? 'School Monitoring Form' : 'Visit report'}</h1><p class="lead">${childLink(c)} ${centreChip(c)} ${visitChip(v)}</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${v.purpose === 'School visit' ? `<a class="btn" href="#/pupil/${esc(c.id)}">Forms and results of the pupil</a>` : ''}<a class="btn" href="#" data-dact="goback">Back</a></div></div>
  <section class="card" id="visitrep"><dl class="dl vdl">${visitRows(v).map(([k, x]) => `<dt>${esc(k)}</dt><dd>${esc(x)}</dd>`).join('')}</dl></section>
  <section class="card"><h2>Photo</h2>${ph.length ? ph.map(id => `<div class="vphw" data-fimg="${esc(id)}" data-name="${esc(nm)}">Opening the photo…</div>`).join('') : '<p style="margin:4px 0"><span class="chip c-orange">No photo</span></p>'}</section>
  ${st === 'old' ? '' : `<section class="card" id="visitval"><h2>Validation</h2>${trail.length ? trail.map(tl).join('') : '<p class="sub" style="margin:4px 0">Not validated yet.</p>'}${check}${again}</section>`}
  ${visitCanEdit(v) || visitCanCancel(v) ? `<p style="margin:14px 0 0;display:flex;gap:8px;flex-wrap:wrap">${visitCanEdit(v) ? `<a class="btn" href="#/visit/new?child=${esc(c.id)}&t=${esc(visitTeam(v))}&edit=${esc(v.id)}">Change the report</a>` : ''}${visitCanCancel(v) ? `<button class="btn danger" data-dact="cancelvisit" data-id="${esc(v.id)}">Cancel this visit</button>` : ''}</p>` : ''}`;
}
FORMS.visitagain = function (o) {
  const v = S.visits.find(x => x.id === o.id); if (!v || GUEST) return; const note = String(o.note || '').trim(), ph = fileKeep('again', v.childId, 'Visit photo');
  if (!note && !ph) return toast(visitState(v) === 'back' ? 'Write what you add or choose the photo' : 'Choose the photo first');
  S.events.push({ id: uid('e'), childId: String(v.childId), type: 'Visit sent again', ref: visitKey(v), date: today(), ts: Date.now(), note, file: ph ? ph.id : '', by: USER.id }); save(); toast(ph && !note ? 'Photo added' : 'Sent again'); render();
};
function backLine(lines, team) { const n = visitsToCheck(team, 'all').filter(v => visitState(v) === 'back').length; if (n) lines.unshift({ n, text: n === 1 ? 'visit sent back by the Education office' : 'visits sent back by the Education office', href: '#/visits?vt=' + team + '&vtab=check', lvl: 'red' }); return lines; }
function checkLine(lines) { const n = visitsToCheck('all', 'all').filter(v => visitState(v) === 'wait').length; if (n) lines.unshift({ n, text: n === 1 ? 'visit to validate' : 'visits to validate', href: '#/visits?vt=all&vtab=check', lvl: 'red' }); return lines; }

/* a question with two buttons that say what they do; with why:true it also asks the reason. Gives the reason (or '') on yes, null on no */
function askBox(o) {
  return new Promise(res => {
    const old = document.getElementById('dlg'); if (old) old.remove();
    const d = document.createElement('div'); d.id = 'dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'dlgt');
    d.innerHTML = `<div class="dlgin"><h2 id="dlgt">${esc(o.title)}</h2>${o.body ? `<p>${esc(o.body).replace(/\n/g, '<br>')}</p>` : ''}${o.why ? '<label class="f">Why<textarea class="in" rows="2"></textarea></label>' : ''}<div class="dlgb"><button type="button" class="btn keep">${esc(o.keep || 'No')}</button><button type="button" class="btn ${o.okCls || 'danger'} ok">${esc(o.ok || 'Yes')}</button></div></div>`;
    const back = document.activeElement, ta = () => d.querySelector('textarea');
    const end = v => { d.remove(); document.removeEventListener('keydown', key, true); if (back && back.focus && back.isConnected) back.focus(); res(v); };
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); end(null); } else if (e.key === 'Tab') { const f = [...d.querySelectorAll('textarea, button')], i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); } };
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('.keep')) return end(null); if (e.target.closest('.ok')) { if (o.why && !ta().value.trim()) { toast('Write why'); ta().focus(); return; } end(o.why ? ta().value.trim() : ''); } });
    document.addEventListener('keydown', key, true); document.body.appendChild(d); (o.why ? ta() : d.querySelector('.keep')).focus();
  });
}

/* ====================================================================
   Need to know (alpha 5.19): health, confidential notes, child protection.
   This hides what is on the screen and in the Excel files. The records are still
   on every device of the staff: it is a rule of the interface, not a lock.
   ==================================================================== */
const CONF_EVENTS = ['Child protection concern'], HEALTH_EVENTS = ['Sick, medical attention'];
function isHead(u) { return /supervisor|head/i.test((u && u.role) || ''); }
function inMyCentre(c) { return !!USER && !!c && staffAreas(USER).includes(centreOf(c)); }
/* sees everything: Education admins, the counsellors, the people ticked "Confidential" in Admin */
function seesAll() { return !!USER && !GUEST && (!!USER.admin || isSite() || isMgmt() || !!USER.conf || hasFlag('Counseling')); }
/* health and notes: also the staff of the child's centre and the person who follows the child */
/* health conditions (medical, disabilities): also the Sports coaches, who must know them to train the child safely (Pippen, 24/11). Notes stay with seesHealth. */
function seesConditions(c) { return seesHealth(c) || (!!USER && !GUEST && hasFlag('Sports')); }
function seesHealth(c) { return seesAll() || (!!USER && !GUEST && (!c || !c.id || c.responsible === USER.id || inMyCentre(c))); }
/* child protection and counselling: also who wrote the record, who follows the child, the head of the child's centre */
function seesProtection(c, rec) { return seesAll() || (!!USER && !GUEST && ((rec && (rec.by === USER.id || rec.recordedBy === USER.id)) || (!!c && (c.responsible === USER.id || (isHead(USER) && inMyCentre(c)))))); }
const HIDDEN_TXT = 'Hidden: only for the staff who need it';
function hiddenChip() { return `<span class="chip c-hid">${HIDDEN_TXT}</span>`; }
