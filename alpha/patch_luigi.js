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
  const date = month + '-01', ageAsOf = month + '-15';
  const index = {}; for (const c of S.children) { const k = nameKey(fullName(c)); if (k.includes(' ')) (index[k] = index[k] || []).push(c); }
  const ids = [], matched = [], created = [], seen = {};
  for (const k of L) {
    const key = nameKey(k.name);
    if (seen[key]) continue; seen[key] = 1;
    const cand = (index[key] || []).filter(c => { const a = curAge(c); if (a === '' || !k.age) return true; return Math.abs((a - Math.max(0, Math.floor(daysBetween(ageAsOf, today()) / 365.25))) - k.age) <= 2; });
    if (cand.length === 1) { ids.push(String(cand[0].id)); matched.push(cand[0]); continue; }
    const parts = k.name.replace(/\s+/g, ' ').split(' ');
    const c = { id: nextChildId(), surname: titleCase(parts[0]), name: titleCase(parts.slice(1).join(' ')), nickname: '', sex: k.sex, age: k.age, ageAsOf, compound: k.place, section: 'Luigi', residence: 'Non-resident', status: 'Active', entryDate: '', referredBy: '', responsible: '', programmes: [], support: [], importedFrom: 'Luigi list of ' + fmtMonth(month), createdAt: today(), createdBy: USER.id };
    S.children.push(c); ids.push(c.id); created.push(c);
  }
  let s = S.outreach.find(o => o.imported && o.date === date);
  if (s) s.children = uniq(s.children.concat(ids)); else S.outreach.push({ id: uid('o'), date, type: 'Monthly list', imported: true, staff: 'Luigi team', children: ids, notes: 'Imported from the Luigi statistics of ' + fmtMonth(month) + ' (names only, activities not recorded per child)', by: USER.id });
  save();
  return { matched, created, total: ids.length };
}
