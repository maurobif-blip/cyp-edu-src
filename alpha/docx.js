/* ====================================================================
   Word files (.docx) on the letterhead of the Cicetekelo (alpha 5.29), no library.
   A document is a list of blocks:
     { h: 1|2|3, t, center }                 heading
     { p: 'text' | [{ t, b, i }], center, small, after }   paragraph (a text with line breaks gives more paragraphs)
     { list: ['a', 'b'] }                     bullets
     { table: { rows: [[cell, ...]], widths: [percent, ...], head: 1, plain: false } }
         cell = 'text' | { t, b, shade, span, center, h (lines of height, for a box to fill by hand) }
     { box: { label, t, lines } }             a labelled box, as on the paper forms
     { sign: [['Signature of counsellor', ''], ...] }   lines to sign
     { br: true }                             new page
   ==================================================================== */
function dxEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); }
/* The documents follow the "Internal templates" of the CYP design system: DocHeader (seal, project name, title, three facts, blue rule),
   StatTile numbers, DataTable tables, label and value pairs, three signature boxes, foot with the chitenge strip.
   Sizes: body 16px = 12pt, tables 13px = 10pt, labels in capitals 12px = 9pt. Ubuntu and Open Sans, with Trebuchet MS and Segoe UI named as stand-ins. */
const DX = { blue: '0B5FA5', ink: '14213D', muted: '4A5568', line: 'D5DBE6', strong: '8A94A6', band: 'E3E3E3', soft: 'F2F5F9', disp: 'Ubuntu', text: 'Open Sans' };
const DOCX_W = 10466; /* width of the text: A4 with 48px margins, in twentieths of a point */
function dxDate(d) { const x = String(d || '').slice(0, 10).split('-'); return x.length === 3 ? x[2] + '/' + x[1] + '/' + x[0] : String(d || ''); }
function dxRun(r, base) {
  r = typeof r === 'string' ? { t: r } : r; base = base || {}; const b = r.b || base.b, i = r.i || base.i, sz = r.sz || base.sz, color = r.color || base.color, font = r.font || base.font, caps = r.caps || base.caps;
  return `<w:r><w:rPr>${font ? `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>` : ''}${b ? '<w:b/>' : ''}${i ? '<w:i/>' : ''}${caps ? '<w:caps/><w:spacing w:val="8"/>' : ''}${color ? `<w:color w:val="${color}"/>` : ''}${sz ? `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>` : ''}</w:rPr><w:t xml:space="preserve">${dxEsc(r.t)}</w:t></w:r>`;
}
function dxPara(content, o) {
  o = o || {}; const runs = Array.isArray(content) ? content : [{ t: content == null ? '' : String(content) }];
  if (runs.length === 1 && /\n/.test(runs[0].t || '')) return String(runs[0].t).split(/\n/).map(l => dxPara([Object.assign({}, runs[0], { t: l })], o)).join('');
  return `<w:p><w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ''}${o.keep ? '<w:keepNext/>' : ''}${o.bottom ? `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="${o.bottom}"/></w:pBdr>` : ''}${o.tabs || ''}<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 120 : o.after}"/>${o.ind != null || o.right != null ? `<w:ind w:left="${o.ind || 0}" w:right="${o.right || 0}" w:hanging="${o.hang || 0}"/>` : ''}${o.jc ? `<w:jc w:val="${o.jc}"/>` : o.center ? '<w:jc w:val="center"/>' : ''}</w:pPr>${runs.map(r => dxRun(r, o)).join('')}${o.raw || ''}</w:p>`;
}
const dxLabel = (t, o) => dxPara([{ t, b: true, caps: true, font: DX.disp, sz: 18, color: DX.muted }], Object.assign({ after: 20 }, o || {}));
function dxTc(w, body, o) { o = o || {}; const bd = (k, v) => v ? `<w:${k} w:val="single" w:sz="${v[0]}" w:space="0" w:color="${v[1]}"/>` : `<w:${k} w:val="nil"/>`;
  return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.span > 1 ? `<w:gridSpan w:val="${o.span}"/>` : ''}<w:tcBorders>${bd('top', o.top)}${bd('left', o.left)}${bd('bottom', o.bottom)}${bd('right', o.right)}</w:tcBorders>${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ''}${o.mar ? `<w:tcMar><w:top w:w="${o.mar[0]}" w:type="dxa"/><w:left w:w="${o.mar[1]}" w:type="dxa"/><w:bottom w:w="${o.mar[2]}" w:type="dxa"/><w:right w:w="${o.mar[3]}" w:type="dxa"/></w:tcMar>` : ''}<w:vAlign w:val="${o.v || 'top'}"/></w:tcPr>${body}</w:tc>`; }
function dxGrid(dxa, rows, o) { o = o || {}; return `<w:tbl><w:tblPr><w:tblW w:w="${dxa.reduce((s, x) => s + x, 0)}" w:type="dxa"/>${o.ind != null ? `<w:tblInd w:w="${o.ind}" w:type="dxa"/>` : ''}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${dxa.map(x => `<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${rows.join('')}</w:tbl>${o.nogap ? '' : '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="200" w:lineRule="exact"/></w:pPr></w:p>'}`; }
const dxTr = (cells, head) => `<w:tr><w:trPr><w:cantSplit/>${head ? '<w:tblHeader/>' : ''}</w:trPr>${cells.join('')}</w:tr>`;
function dxCols(pcts, n) { let w = (pcts || []).slice(0, n); const used = w.reduce((s, x) => s + x, 0), rest = n - w.length; for (let i = 0; i < rest; i++) w.push((100 - used) / rest); const sum = w.reduce((s, x) => s + x, 0); const d = w.map(x => Math.round(DOCX_W * x / sum)); d[n - 1] += DOCX_W - d.reduce((s, x) => s + x, 0); return d; }
/* DataTable: heads in capitals on the grey band, even rows on the soft ground, hairlines, numbers to the right */
function dxTable(t) {
  const n = Math.max.apply(null, t.rows.map(r => r.reduce((s, c) => s + ((c && c.span) || 1), 0))), dxa = dxCols(t.widths, n), num = v => /^[\d.,]+( of [\d.,]+)?%?$/.test(String(v).trim());
  if (t.plain) return dxGrid(dxa, t.rows.map(r => { let col = 0; return dxTr(r.map(c => { c = c == null ? '' : typeof c === 'object' ? c : { t: c }; const sp = c.span || 1, w = dxa.slice(col, col + sp).reduce((s, x) => s + x, 0); col += sp; return dxTc(w, dxPara([{ t: c.t == null ? '' : String(c.t), b: c.b }], { after: 0, sz: 20 }), { span: sp }); })); }));
  let body = 0;
  return dxGrid(dxa, t.rows.map((r, ri) => { let col = 0; const head = ri < (t.head || 0); if (!head) body++; const zebra = !head && body % 2 === 0;
    return dxTr(r.map((c, ci) => { c = c == null ? '' : typeof c === 'object' ? c : { t: c }; const sp = c.span || 1, w = dxa.slice(col, col + sp).reduce((s, x) => s + x, 0), text = c.t == null ? '' : String(c.t); col += sp;
      const p = head ? dxPara([{ t: text, b: true, caps: true, font: DX.disp, sz: 18 }], { after: 0, jc: ci && t.rows.slice(t.head || 0).every(x => x[ci] == null || x[ci] === '' || num(typeof x[ci] === 'object' ? x[ci].t : x[ci])) ? 'right' : '' }) : dxPara([{ t: text, b: c.b }], { after: 0, sz: 20, keep: c.keep, jc: num(text) && ci ? 'right' : c.center ? 'center' : '' }) + (c.h ? dxPara('', { after: 0 }).repeat(c.h) : '');
      return dxTc(w, p, { span: sp, fill: head ? DX.band : c.shade ? DX.band : zebra ? DX.soft : '', bottom: [4, head ? DX.strong : DX.line] }); }), head); }));
}
function dxBlocks(blocks) {
  return blocks.filter(Boolean).map(k => {
    if (k.doc) return '';
    if (k.h) return dxPara([{ t: /[a-z]/.test(k.t) ? k.t : k.t.toLowerCase().replace(/^([\d. ]*)([a-z])/, (m, a, b) => a + b.toUpperCase()), b: true, font: DX.disp, sz: 24 }], { style: 'Heading3', keep: true, before: 280, after: 120 });
    if (k.list) return k.list.map(x => dxPara([{ t: '•\t' + x }], { ind: 360, hang: 360, after: 60 })).join('');
    if (k.table) return dxTable(k.table);
    /* StatTile: three numbers in a row */
    if (k.tiles) { const d = dxCols([], 5), g = 240, w = Math.floor((DOCX_W - 2 * g) / 3); return dxGrid([w, g, w, g, DOCX_W - 2 * w - 2 * g], [dxTr(k.tiles.slice(0, 3).flatMap((x, i) => { const bd = [4, DX.line]; const c = dxTc(i === 2 ? DOCX_W - 2 * w - 2 * g : w, dxLabel(x[0]) + dxPara([{ t: String(x[1]), b: true, font: DX.disp, sz: 60, color: DX.blue }], { after: 20 }) + dxPara([{ t: x[2] || '', sz: 20, color: DX.muted }], { after: 0 }), { top: bd, left: bd, bottom: bd, right: bd, mar: [160, 200, 160, 200] }); return i < 2 ? [c, dxTc(g, dxPara('', { after: 0 }))] : [c]; }))]); }
    /* label and value pairs from one record, two columns */
    if (k.kv) { const g = 360, w = Math.floor((DOCX_W - g) / 2), rows = []; for (let i = 0; i < k.kv.length; i += 2) { const cell = x => x ? dxTc(w, dxLabel(x[0]) + dxPara([{ t: x[1] == null ? '' : String(x[1]) }], { after: 0 }), { bottom: [4, DX.strong], mar: [100, 0, 40, 0] }) : dxTc(w, dxPara('', { after: 0 })); rows.push(dxTr([cell(k.kv[i]), dxTc(g, dxPara('', { after: 0 })), cell(k.kv[i + 1])])); } return dxGrid([w, g, DOCX_W - w - g], rows); }
    /* a long answer: its label, then the text, or lines to fill in by hand */
    if (k.box) return dxPara([{ t: k.box.label, b: true, font: DX.disp, sz: 24 }], { style: 'Heading3', keep: true, before: 240, after: 80 }) + (k.box.t ? dxPara(k.box.t, { after: 80 }) : dxPara('', { after: 0, before: 200, bottom: DX.strong }).repeat(k.box.lines || 4));
    /* signatures: three boxes in the order the paper moves */
    if (k.sign) { const g = 360, w = Math.floor((DOCX_W - 2 * g) / 3), s = k.sign.slice(0, 3); while (s.length < 3) s.push(null); return dxPara('', { after: 0, before: 480 }) + dxGrid([w, g, w, g, DOCX_W - 2 * w - 2 * g], [dxTr(s.flatMap((x, i) => { const c = x ? dxTc(w, dxLabel(x[0], { after: 0 }) + dxPara([{ t: x[1] || '', sz: 20, color: DX.muted }], { after: 0 }), { top: [6, DX.ink], mar: [60, 0, 0, 0] }) : dxTc(w, dxPara('', { after: 0 })); return i < 2 ? [c, dxTc(g, dxPara('', { after: 0 }))] : [c]; }))]); }
    if (k.br) return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    return dxPara(Array.isArray(k.p) ? k.p : [{ t: k.p == null ? '' : String(k.p), b: k.b }], { center: k.center, sz: k.small ? 20 : 0, color: k.small ? DX.muted : '', after: k.after });
  }).join('');
}
function dxPic(rid, cx, cy, name, id) {
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id || 1}" name="${name}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}
function dxBytes(dataUrl) { const b = atob(String(dataUrl).split(',')[1] || ''), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
/* builds the file: the DocHeader at the top of every page, the foot with the chitenge strip at the bottom of every page */
function docxBlob(blocks) {
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n', REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', PKG = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const h1 = blocks.find(k => k && k.h === 1), doc = (blocks.find(k => k && k.doc) || {}).doc || { title: h1 ? h1.t : 'Document' }; if (!blocks.some(k => k && k.doc) && h1) blocks = blocks.filter(k => k !== h1);
  const facts = (doc.facts || []).slice(0, 3), now = new Date(), made = dxDate(today()) + ' at ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const seal = 685800, wS = 1280, wF = 3300, wT = DOCX_W - wS - wF;
  const head = dxGrid([wS, wT, wF], [dxTr([
    dxTc(wS, `<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${dxPic('rId1', seal, seal, 'Seal of the Cicetekelo Youth Project')}</w:p>`, { v: 'center', bottom: [18, DX.blue], mar: [0, 0, 160, 0] }),
    dxTc(wT, dxPara([{ t: 'Cicetekelo Youth Project', b: true, caps: true, font: DX.disp, sz: 18, color: DX.blue }], { after: 20 }) + dxPara([{ t: doc.title || '', b: true, font: DX.disp, sz: 30 }], { after: 0 }), { v: 'center', bottom: [18, DX.blue], mar: [0, 120, 160, 120] }),
    dxTc(wF, facts.map(f => dxPara([{ t: f[0] + '  ', sz: 20, color: DX.muted }, { t: f[1] == null ? '' : String(f[1]), sz: 20, b: true }], { after: 0 })).join('') || dxPara('', { after: 0 }), { v: 'center', bottom: [18, DX.blue], mar: [0, 0, 160, 0] })])], { nogap: true }) + dxPara('', { after: 0 });
  const fld = t => `<w:r><w:rPr><w:color w:val="${DX.muted}"/><w:sz w:val="17"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:color w:val="${DX.muted}"/><w:sz w:val="17"/></w:rPr><w:instrText xml:space="preserve"> ${t} </w:instrText></w:r><w:r><w:rPr><w:color w:val="${DX.muted}"/><w:sz w:val="17"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:color w:val="${DX.muted}"/><w:sz w:val="17"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:color w:val="${DX.muted}"/><w:sz w:val="17"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>`;
  const foot = dxPara([{ t: 'CYP EDU · made on ' + made + '\t' + 'Page ', sz: 17, color: DX.muted }], { after: 80, tabs: `<w:tabs><w:tab w:val="right" w:pos="${DOCX_W}"/></w:tabs>`, raw: fld('PAGE') }).replace('\t', '</w:t><w:tab/><w:t xml:space="preserve">');
  const style = (id, name, sz, extra) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/>${extra || ''}</w:pPr><w:rPr><w:rFonts w:ascii="${DX.disp}" w:hAnsi="${DX.disp}" w:cs="${DX.disp}"/><w:b/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr></w:style>`;
  const font = (n, alt, fam) => `<w:font w:name="${n}"><w:altName w:val="${alt}"/><w:family w:val="${fam}"/><w:pitch w:val="variable"/></w:font>`;
  const files = [
    { name: '[Content_Types].xml', data: X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>' },
    { name: '_rels/.rels', data: X + `<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: 'word/_rels/document.xml.rels', data: X + `<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/styles" Target="styles.xml"/><Relationship Id="rId2" Type="${REL}/header" Target="header1.xml"/><Relationship Id="rId3" Type="${REL}/footer" Target="footer1.xml"/><Relationship Id="rId4" Type="${REL}/fontTable" Target="fontTable.xml"/></Relationships>` },
    { name: 'word/_rels/header1.xml.rels', data: X + `<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/image" Target="media/seal.png"/></Relationships>` },
        { name: 'word/fontTable.xml', data: X + `<w:fonts ${NS}>${font(DX.disp, 'Trebuchet MS', 'swiss')}${font(DX.text, 'Segoe UI', 'swiss')}</w:fonts>` },
    { name: 'word/styles.xml', data: X + `<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${DX.text}" w:hAnsi="${DX.text}" w:cs="${DX.text}" w:eastAsia="${DX.text}"/><w:color w:val="${DX.ink}"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${style('Heading1', 'heading 1', 30, '<w:outlineLvl w:val="0"/>')}${style('Heading2', 'heading 2', 24, '<w:outlineLvl w:val="1"/>')}${style('Heading3', 'heading 3', 24, '<w:outlineLvl w:val="2"/>')}</w:styles>` },
    { name: 'word/header1.xml', data: X + `<w:hdr ${NS}>${head}</w:hdr>` },
    { name: 'word/footer1.xml', data: X + `<w:ftr ${NS}>${foot}</w:ftr>` },
    { name: 'word/media/seal.png', data: dxBytes(LH_HEAD) },
    { name: 'word/document.xml', data: X + `<w:document ${NS}><w:body>${dxBlocks(blocks)}<w:sectPr><w:headerReference w:type="default" r:id="rId2"/><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="2500" w:right="720" w:bottom="1300" w:left="720" w:header="720" w:footer="560" w:gutter="0"/></w:sectPr></w:body></w:document>` }
  ];
  return zipStore(files, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}
function docxDownload(name, blocks) {
  const url = URL.createObjectURL(docxBlob(blocks)), a = document.createElement('a');
  a.href = url; a.download = String(name).replace(/[\\/:*?"<>|]+/g, '-') + '.docx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Word file downloaded');
}
/* what is on the screen (tables, titles, lists) as blocks of a Word file */
function docxFromDom(root) {
  const out = [], txt = n => (n.textContent || '').replace(/\s+/g, ' ').trim();
  const walk = n => {
    for (const el of Array.from(n.children)) {
      const tag = el.tagName;
      if (/^H[1-6]$/.test(tag)) { if (txt(el)) out.push({ h: Math.min(3, Math.max(2, Number(tag[1]))), t: txt(el) }); }
      else if (tag === 'TABLE') {
        const rows = Array.from(el.rows).map(r => Array.from(r.cells).map(c => ({ t: txt(c), b: c.tagName === 'TH' || !!c.querySelector('b,strong') && txt(c) === txt(c.querySelector('b,strong')), span: c.colSpan > 1 ? c.colSpan : 0 }))).filter(r => r.length);
        if (rows.length) { const n2 = Math.max.apply(null, rows.map(r => r.reduce((s, c) => s + (c.span || 1), 0))); out.push({ table: { rows, head: el.tHead ? el.tHead.rows.length : 0, widths: docxWidths(rows, n2) } }); }
      }
      else if (tag === 'UL' || tag === 'OL') out.push({ list: Array.from(el.children).map(txt).filter(Boolean) });
      else if (tag === 'P') { if (txt(el)) out.push({ p: txt(el), b: !!el.querySelector('b') && txt(el) === txt(el.querySelector('b')) }); }
      else if (el.children.length && el.querySelector('table,p,h1,h2,h3,h4,ul,ol,div')) walk(el);
      else if (txt(el)) out.push({ p: txt(el) });
    }
  };
  walk(root); return out;
}
/* the first column takes what the numbers leave: a wide text column, narrow number columns */
function docxWidths(rows, n) {
  const len = Array.from({ length: n }, () => 0);
  for (const r of rows) { let i = 0; for (const c of r) { if (!(c.span > 1)) len[i] = Math.max(len[i], Math.min(60, String(c.t || '').length)); i += c.span || 1; } }
  const w = len.map(l => Math.max(7, Math.min(46, l * 1.15 + 3))), sum = w.reduce((s, x) => s + x, 0); return w.map(x => x * 100 / sum);
}
/* the head of every report of the Education Department, as in the reports of the sections */
function docxReportHead(section, period, kind) {
  const who = USER && !GUEST ? USER.name : '';
  return [
    { doc: { title: section + ' · ' + (kind || 'Report'), facts: [['Section', section], ['Period', period || ''], ['Made by', 'CYP EDU']] } },
    { kv: [['Department', 'Education'], ['Date compiled', dxDate(today())], ['Compiled by', who], ['Checked by', '']] }
  ];
}
