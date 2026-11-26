// Local stand-in for the Google side, with the same rules (core.js). Used only for testing.
const http = require('http'), fs = require('fs'), vm = require('vm');
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(__dirname + '/core.js', 'utf8'), ctx);
function memStore(key) {
  const log = [], ids = []; let snap = null, gen = 'g1';
  const files = {};
  return { _files: files, filePut: (m, b64) => { if (!files[m.id]) files[m.id] = { name: m.name, mime: m.mime, data: b64, childId: m.childId, kind: m.kind }; }, fileGet: id => files[id] || null, fileDel: id => { delete files[id]; },
    _log: log, _ids: ids, key: () => key, gen: () => gen, reset: () => { log.length = 0; ids.length = 0; snap = null; gen = 'g' + (Number(gen.slice(1)) + 1); }, lastSeq: () => log.length, logAppend: r => log.push(Object.assign({ seq: log.length + 1 }, r)), logRead: (since, limit) => log.slice(since, since + limit).map(r => ({ seq: r.seq, device: r.device, user: r.user, json: r.json })),
    idsAll: () => ids.slice(), idsAdd: l => { for (const x of l) ids.push({ id: String(x.id), uid: String(x.uid || '') }); }, snapMeta: () => snap ? { seq: snap.seq } : null, snapGet: () => snap, snapPut: (seq, text) => { snap = { seq, text }; } };
}
function start(port, key) {
  const store = memStore(key); let down = false, calls = 0, skew = 0, noNow = false;
  const srv = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (down) { req.destroy(); return; }
    let body = ''; req.on('data', d => body += d); req.on('end', () => {
      calls++; let out; try { out = ctx.cypHandle(JSON.parse(body), store); } catch (e) { out = { ok: false, error: 'server', detail: String(e) }; }
      if (out && !noNow) out.now = Date.now() + skew;
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(out));
    });
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r({ store, srv, setDown: v => down = v, setSkew: v => skew = v, setNoNow: v => noNow = v, calls: () => calls })));
}
module.exports = { start };
