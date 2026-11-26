/* ---------- after each page is drawn: two rules of the CYP design system applied in one place (alpha 5.30) ----------
   1. One primary button per screen: the first main action keeps the filled blue, the others become plain buttons.
      The main action is the button that saves the form of the page, else the first blue button of the page.
   2. Choice: in a form, a question with two or three answers shows them all at once (the select stays underneath and keeps the value).
   3. Motion (beta 1.1): a page comes in when the person changes page (cyp-enter). In the Interactive report the next chapter comes from the right,
      the one before from the left. Numbers of the tiles count once. A page drawn again by a sync, by a filter or by a mark does not move. */
function dsOnePrimary() {
  const main = document.querySelector('.main'); if (!main) return;
  const all = [...main.querySelectorAll('.btn.pri')].filter(b => b.offsetParent); if (all.length < 2) return;
  const forms = [...main.querySelectorAll('form.card, form[data-form]')].filter(f => f.offsetParent && f.querySelector('textarea, input:not([type=hidden]), select'));
  const big = forms.sort((a, b) => b.querySelectorAll('input, select, textarea').length - a.querySelectorAll('input, select, textarea').length)[0];
  const keep = (big && big.querySelectorAll('input, select, textarea').length >= 4 && [...big.querySelectorAll('.btn.pri')].filter(b => b.offsetParent).pop()) || all.find(b => b.closest('.top, .otop, .guide.mine')) || all[0];
  all.forEach(b => { if (b !== keep) { b.classList.remove('pri'); b.classList.add('was-pri'); } });
}
function dsChoice() {
  const main = document.querySelector('.main'); if (!main) return; let n = 0;
  main.querySelectorAll('form select.in').forEach(sel => {
    if (sel.dataset.choice || sel.multiple || sel.dataset.filter != null || sel.closest('.rfilters, th')) return;
    const opts = [...sel.options].filter(o => !(o.value === '' && /^(|choose.*|select.*|pick.*|-+|—|…|\.\.\.|\?)$/i.test(o.textContent.trim()))); if (opts.length < 2 || opts.length > 3 || opts.some(o => o.textContent.trim().length > 22)) return;
    const lab = sel.closest('label.f'); if (!lab) return; const name = ((lab.querySelector(':scope > span') || lab.firstChild || {}).textContent || '').trim(); if (!name) return;
    sel.dataset.choice = '1'; const id = 'ch' + Date.now().toString(36) + (n++);
    const fs = document.createElement('fieldset'); fs.className = 'cyp-choice';
    fs.innerHTML = `<legend>${esc(name)}</legend><div class="cyp-choice__row">${opts.map(o => `<label><input type="radio" name="${id}" form="${id}" value="${esc(o.value)}"${sel.value === o.value ? ' checked' : ''}><span>${esc(o.textContent.trim())}</span></label>`).join('')}</div>`;
    lab.classList.add('choice-under'); lab.after(fs);
    fs.addEventListener('change', e => { if (e.target.type !== 'radio') return; sel.value = e.target.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); });
    sel.addEventListener('change', () => { fs.querySelectorAll('input').forEach(r => { r.checked = r.value === sel.value; }); });
  });
}
function dsTools() { document.querySelectorAll('.main .btn, .main .cyp-btn, .hd #fbbtn').forEach(b => { if (b.querySelector('svg')) return; const t = b.textContent.trim(), k = /^Export (all data )?in Excel/.test(t) ? 'excel' : /^Print\b/.test(t) ? 'print' : t === 'Comment' ? 'comment' : ''; if (k) b.insertAdjacentHTML('afterbegin', dsIcon(k)); }); }
function dsAfter() { try { dsChoice(); dsOnePrimary(); dsTools(); dsEnter(); } catch (e) { console.error(e); } }

/* the photo of a child, or the initials, at the start of a row: the cyp-avatar of the system (48px circle) */
function dsAvatar(c) { const p = photoOf(c); return '<span class="cyp-avatar" aria-hidden="true">' + (p ? '<img class="cph" data-name="' + esc(fullName(c)) + '" src="' + p + '" alt="">' : esc(initials(fullName(c)))) + '</span>'; }

function dsCount(root) {
  root.querySelectorAll('.st-n, .cyp-stat__figure').forEach(el => { if (el.children.length) return; const txt = el.textContent.trim(); if (!/^[0-9][0-9,]*$/.test(txt)) return; const n = Number(txt.replace(/,/g, '')); if (!n) return;
    const t0 = performance.now(), dur = 700, step = t => { if (!el.isConnected) return; const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))).toLocaleString('en-GB'); if (k < 1) requestAnimationFrame(step); else el.textContent = txt; }; requestAnimationFrame(step); });
}
function dsEnter() {
  const r = route(), story = r.path === 'story', page = r.path + '/' + (r.id || ''), key = page + (story ? '/' + (r.q.get('p') || 0) : '');
  const was = UI.dsKey, wasPage = UI.dsPage; UI.dsKey = key; UI.dsPage = page;
  if (key === was || !window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const main = document.querySelector('main.main'); if (!main) return;
  const chap = story && wasPage === page ? document.getElementById('stchap') : null, body = chap && chap.querySelector('.st-body');
  if (chap) { chap.classList.add(UI.stDir === 'prev' ? 'cyp-enter-prev' : 'cyp-enter-next'); if (body) body.classList.add('cyp-enter'); }
  else { main.classList.add('cyp-enter'); const b = main.querySelector('.st-body'); if (b) b.classList.add('cyp-enter'); }
  dsCount(main);
  /* the classes go once the page is in: an animated block keeps its own layer, and a list that opens over the next card must stay above it */
  clearTimeout(UI.dsEnterT); UI.dsEnterT = setTimeout(() => document.querySelectorAll('.cyp-enter, .cyp-enter-next, .cyp-enter-prev').forEach(x => x.classList.remove('cyp-enter', 'cyp-enter-next', 'cyp-enter-prev')), 1200);
}
